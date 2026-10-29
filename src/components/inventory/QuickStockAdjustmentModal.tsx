import React, { useState, useEffect, useMemo } from 'react';
import { Product, StockMovementType } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  SlidersHorizontal,
  Plus,
  Minus,
  Equal,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Trash2,
  Package,
  Calendar,
  X,
  RotateCcw,
  Sparkles,
  Layers,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  FileText,
  ShieldAlert,
  Boxes,
  Truck,
  Gift,
  Coffee
} from 'lucide-react';
import { soundEffects } from '../../services/audio';
import { haptics } from '../../services/haptics';
import { parsePriceInput, sanitizePriceInputString } from '../../utils/currencyUtils';
import { DraggableModalWrapper } from '../common/DraggableModalWrapper';

export type AdjustmentReasonCode =
  | 'damage'
  | 'spoilage'
  | 'count'
  | 'purchase'
  | 'return'
  | 'loss'
  | 'promotion'
  | 'internal'
  | 'adjustment';

export interface ReasonOption {
  code: AdjustmentReasonCode;
  titleAr: string;
  titleEn: string;
  defaultDirection: 'increment' | 'decrement' | 'count';
  movementType: StockMovementType;
  icon: React.ElementType;
  badgeColor: string;
  descAr: string;
}

export const ADJUSTMENT_REASONS: ReasonOption[] = [
  {
    code: 'damage',
    titleAr: 'تلف / بضاعة مكسورة أو متضررة',
    titleEn: 'Damaged Goods',
    defaultDirection: 'decrement',
    movementType: 'damage',
    icon: Trash2,
    badgeColor: 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300 dark:border-rose-800',
    descAr: 'خصم بسبب كسر، عيب مصنعي، أو تلف أثناء النقل والتخزين',
  },
  {
    code: 'spoilage',
    titleAr: 'فساد / انتهاء تاريخ الصلاحية',
    titleEn: 'Spoilage & Expired',
    defaultDirection: 'decrement',
    movementType: 'damage',
    icon: AlertOctagon,
    badgeColor: 'bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300 border-red-300 dark:border-red-800',
    descAr: 'خصم أصناف منتهية الصلاحية أو غير صالحة للاستهلاك',
  },
  {
    code: 'count',
    titleAr: 'جرد فعلي وتدقيق دوري للمخزون',
    titleEn: 'Physical Inventory Count',
    defaultDirection: 'count',
    movementType: 'adjustment',
    icon: Equal,
    badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border-blue-300 dark:border-blue-800',
    descAr: 'مطابقة رصيد النظام مع العد اليدوي الفعلي على الرفوف',
  },
  {
    code: 'purchase',
    titleAr: 'شراء وتوريد بضاعة جديدة',
    titleEn: 'Purchase & Restock',
    defaultDirection: 'increment',
    movementType: 'purchase',
    icon: Truck,
    badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
    descAr: 'زيادة المخزون عند استلام فاتورة توريد من الشركات والموردين',
  },
  {
    code: 'return',
    titleAr: 'مرتجع مسترجع من عميل',
    titleEn: 'Customer Return',
    defaultDirection: 'increment',
    movementType: 'return',
    icon: RotateCcw,
    badgeColor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800',
    descAr: 'إرجاع صنف سليم للمخزون بعد استرداد العميل',
  },
  {
    code: 'loss',
    titleAr: 'فقدان / عجز مخزني وسرقة',
    titleEn: 'Theft / Unaccounted Loss',
    defaultDirection: 'decrement',
    movementType: 'adjustment',
    icon: ShieldAlert,
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-800',
    descAr: 'عجز غير مبرر في المستودع أو فقدان أثناء المناولة',
  },
  {
    code: 'promotion',
    titleAr: 'عينات تجريبية وهدايا ترويجية',
    titleEn: 'Promotional Samples',
    defaultDirection: 'decrement',
    movementType: 'adjustment',
    icon: Gift,
    badgeColor: 'bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 border-purple-300 dark:border-purple-800',
    descAr: 'صرف عينات مجانية لترويج المبيعات وتجربة الزبائن',
  },
  {
    code: 'internal',
    titleAr: 'استهلاك داخلي وتشغيلي للمنشأة',
    titleEn: 'Internal Store Use',
    defaultDirection: 'decrement',
    movementType: 'adjustment',
    icon: Coffee,
    badgeColor: 'bg-teal-100 text-teal-700 dark:bg-teal-950/80 dark:text-teal-300 border-teal-300 dark:border-teal-800',
    descAr: 'استخدام مواد التنظيف أو الضيافة أو الاستهلاك المباشر',
  },
  {
    code: 'adjustment',
    titleAr: 'تسوية وتعديل إداري مخصص',
    titleEn: 'General Adjustment',
    defaultDirection: 'increment',
    movementType: 'adjustment',
    icon: SlidersHorizontal,
    badgeColor: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700',
    descAr: 'تسوية قيود محاسبية أو إدخال رصيد افتتاحي للمنتج',
  },
];

export interface QuickStockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  initialReasonCode?: AdjustmentReasonCode;
  onSuccess?: (product: Product, delta: number, newStock: number) => void;
}

export const QuickStockAdjustmentModal: React.FC<QuickStockAdjustmentModalProps> = ({
  isOpen,
  onClose,
  product,
  initialReasonCode = 'purchase',
  onSuccess,
}) => {
  const { adjustStock, formatCurrency, notify, logAudit, currentUser } = useApp();

  const [mode, setMode] = useState<'increment' | 'decrement' | 'count'>('increment');
  const [quantityInput, setQuantityInput] = useState<string>('5');
  const [selectedReason, setSelectedReason] = useState<AdjustmentReasonCode>(initialReasonCode);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Sync default direction when changing product or initialReasonCode
  useEffect(() => {
    if (isOpen && product) {
      const reasonMeta = ADJUSTMENT_REASONS.find(r => r.code === initialReasonCode);
      if (reasonMeta) {
        setSelectedReason(initialReasonCode);
        setMode(reasonMeta.defaultDirection);
      } else {
        setSelectedReason('purchase');
        setMode('increment');
      }
      setQuantityInput(reasonMeta?.defaultDirection === 'count' ? String(product.stock) : '5');
      setNotes('');
    }
  }, [isOpen, product, initialReasonCode]);

  // When changing reason, auto-select standard direction if applicable
  const handleSelectReason = (code: AdjustmentReasonCode) => {
    soundEffects.playClick();
    setSelectedReason(code);
    const meta = ADJUSTMENT_REASONS.find(r => r.code === code);
    if (meta) {
      setMode(meta.defaultDirection);
      if (meta.defaultDirection === 'count' && product) {
        setQuantityInput(String(product.stock));
      }
    }
  };

  if (!isOpen || !product) return null;

  const currentStock = Number(product.stock) || 0;
  const parsedQuantity = parsePriceInput(quantityInput);

  // Calculate delta & new stock preview
  let calculatedDelta = 0;
  let resultingStock = currentStock;

  if (mode === 'increment') {
    calculatedDelta = Math.abs(parsedQuantity);
    resultingStock = currentStock + calculatedDelta;
  } else if (mode === 'decrement') {
    calculatedDelta = -Math.abs(parsedQuantity);
    resultingStock = Math.max(0, currentStock + calculatedDelta);
  } else if (mode === 'count') {
    calculatedDelta = parsedQuantity - currentStock;
    resultingStock = Math.max(0, parsedQuantity);
  }

  const selectedReasonMeta = ADJUSTMENT_REASONS.find(r => r.code === selectedReason) || ADJUSTMENT_REASONS[0];
  const isOutOfStockNow = currentStock <= 0;
  const isLowStockNow = currentStock <= product.minStock && !isOutOfStockNow;

  const isOutOfStockAfter = resultingStock <= 0;
  const isLowStockAfter = resultingStock <= product.minStock && !isOutOfStockAfter;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedQuantity < 0) {
      notify('كمية غير صالحة', 'يرجى إدخال قيمة صحيحة للكمية', 'warning');
      return;
    }
    if (mode !== 'count' && parsedQuantity === 0) {
      notify('تنبيه', 'يرجى إدخال كمية أكبر من صفر لتنفيذ التعديل', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const fullReason = [
        selectedReasonMeta.titleAr,
        notes.trim() ? `ملاحظات: ${notes.trim()}` : '',
        `بواسطة: ${currentUser.name}`
      ].filter(Boolean).join(' — ');

      adjustStock(product.id, calculatedDelta, selectedReasonMeta.movementType, fullReason);

      soundEffects.playCashDrawer();
      haptics.confirm();

      const deltaFormatted = calculatedDelta > 0 ? `+${calculatedDelta}` : `${calculatedDelta}`;
      notify(
        'تم تعديل المخزون بنجاح',
        `${product.nameAr}: ${deltaFormatted} ${product.unit} (الرصيد الجديد: ${resultingStock} ${product.unit})`,
        'success'
      );

      logAudit(
        'تعديل كمية المخزون السريع',
        `المنتج: ${product.nameAr} - التعديل: ${deltaFormatted} ${product.unit} - السبب: ${selectedReasonMeta.titleAr}`,
        Math.abs(calculatedDelta) > 50 ? 'high' : 'medium'
      );

      if (onSuccess) {
        onSuccess(product, calculatedDelta, resultingStock);
      }
      onClose();
    } catch (err: any) {
      notify('حدث خطأ', 'تعذر تحديث المخزون، يرجى المحاولة ثانية', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const applyPresetDelta = (amount: number) => {
    soundEffects.playGlassPress();
    haptics.tap();
    if (mode === 'count') {
      const newCount = Math.max(0, currentStock + amount);
      setQuantityInput(String(newCount));
    } else {
      setQuantityInput(String(Math.abs(amount)));
    }
  };

  return (
    <DraggableModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="التعديل السريع لمستوى المخزون"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 p-4 sm:p-5 text-slate-900 dark:text-white">
        {/* Product Identity Header Card */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-slate-100 to-amber-500/10 dark:from-slate-800/80 dark:to-amber-950/30 border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-md shadow-amber-500/20">
              <Package className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-black truncate">{product.nameAr}</h3>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  {product.barcode}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                سعر التكلفة: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{formatCurrency(product.costPrice)}</span> · سعر البيع: <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{formatCurrency(product.price)}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <div className="text-end">
              <span className="text-[10px] text-slate-500 block font-bold">المخزون المسجل</span>
              <span className={`text-base font-black font-mono tabular-nums ${
                isOutOfStockNow ? 'text-rose-600' : isLowStockNow ? 'text-amber-600' : 'text-emerald-600'
              }`}>
                {currentStock} {product.unit}
              </span>
            </div>
          </div>
        </div>

        {/* Mode Selector: Increment (+) vs Decrement (-) vs Exact Count (=) */}
        <div>
          <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-2">
            نوع حركة التعديل:
          </label>
          <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => {
                soundEffects.playGlassPress();
                setMode('increment');
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                mode === 'increment'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>إضافة / زيادة (+)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEffects.playGlassPress();
                setMode('decrement');
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                mode === 'decrement'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 ring-2 ring-rose-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Minus className="w-4 h-4" />
              <span>خصم / تنقيص (-)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEffects.playGlassPress();
                setMode('count');
                setQuantityInput(String(currentStock));
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                mode === 'count'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-2 ring-blue-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Equal className="w-4 h-4" />
              <span>جرد فعلي مباشر (=)</span>
            </button>
          </div>
        </div>

        {/* Quantity Input & Preset Delta Chips */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-slate-700 dark:text-slate-300">
              {mode === 'count' ? 'الكمية الفعلية الموجودة على الرف حالياً:' : 'مقدار التعديل (الكمية):'}
            </label>
            <span className="text-[11px] font-bold text-slate-500 font-mono">
              الوحدة: {product.unit}
            </span>
          </div>

          <div className="relative">
            <input
              type="text"
              required
              inputMode="decimal"
              value={quantityInput}
              onChange={e => setQuantityInput(sanitizePriceInputString(e.target.value))}
              placeholder="0"
              className="w-full text-xl sm:text-2xl font-black font-mono text-center py-3 px-4 bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-300 dark:border-slate-700 focus:border-amber-500 focus:outline-none shadow-inner"
            />
            <span className="absolute end-4 top-1/2 -translate-y-1/2 font-bold text-xs text-slate-400">
              {product.unit}
            </span>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar">
            <span className="text-[11px] text-slate-400 font-bold shrink-0">مقادير سريعة:</span>
            {mode === 'increment' && (
              <>
                {[1, 5, 10, 20, 50, 100].map(qty => (
                  <button
                    key={qty}
                    type="button"
                    onClick={() => applyPresetDelta(qty)}
                    className="px-2.5 py-1 text-xs font-mono font-black rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-800 transition-all cursor-pointer active:scale-95 shrink-0"
                  >
                    +{qty}
                  </button>
                ))}
              </>
            )}

            {mode === 'decrement' && (
              <>
                {[1, 2, 5, 10, 20, 50].map(qty => (
                  <button
                    key={qty}
                    type="button"
                    onClick={() => applyPresetDelta(qty)}
                    className="px-2.5 py-1 text-xs font-mono font-black rounded-lg bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-300/80 dark:border-rose-800 transition-all cursor-pointer active:scale-95 shrink-0"
                  >
                    -{qty}
                  </button>
                ))}
              </>
            )}

            {mode === 'count' && (
              <>
                <button
                  type="button"
                  onClick={() => setQuantityInput('0')}
                  className="px-2.5 py-1 text-xs font-mono font-black rounded-lg bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200 border border-rose-300 cursor-pointer active:scale-95 shrink-0"
                >
                  تصفير (0)
                </button>
                <button
                  type="button"
                  onClick={() => setQuantityInput(String(product.minStock || 5))}
                  className="px-2.5 py-1 text-xs font-mono font-black rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 cursor-pointer active:scale-95 shrink-0"
                >
                  حد الأمان ({product.minStock || 5})
                </button>
              </>
            )}
          </div>
        </div>

        {/* Specific Reason Code Selection Grid */}
        <div className="space-y-1.5">
          <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
            سبب التعديل والرمز المعتمد (Reason Code) *:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/40">
            {ADJUSTMENT_REASONS.map(reason => {
              const isSelected = selectedReason === reason.code;
              const IconComp = reason.icon;
              return (
                <button
                  key={reason.code}
                  type="button"
                  onClick={() => handleSelectReason(reason.code)}
                  className={`p-2.5 rounded-xl border text-start transition-all cursor-pointer flex items-start gap-2 ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500 ring-2 ring-amber-500 shadow-xs'
                      : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-amber-500 text-slate-950' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}>
                    <IconComp className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-black block leading-tight truncate">{reason.titleAr}</span>
                    <span className="text-[10px] text-slate-400 block line-clamp-1 mt-0.5">{reason.descAr}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Notes Field */}
        <div>
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
            ملاحظات إضافية أو رقم السند/الفاتورة (اختياري):
          </label>
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="مثال: فاتورة توريد رقم #429 / إتلاف بضاعة بقرار الإدارة..."
            className="w-full text-xs px-3.5 py-2.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Live Calculation Preview Banner */}
        <div className="p-3.5 rounded-2xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">المخزون الحالي:</span>
            <span className="font-mono font-bold">{currentStock}</span>
            <span className="text-slate-400">➔</span>
            <span className="text-slate-500">التعديل:</span>
            <span className={`font-mono font-black ${
              calculatedDelta > 0 ? 'text-emerald-600' : calculatedDelta < 0 ? 'text-rose-600' : 'text-slate-500'
            }`}>
              {calculatedDelta > 0 ? `+${calculatedDelta}` : calculatedDelta}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 dark:text-slate-300">المخزون بعد الحفظ:</span>
            <span className={`text-sm font-black font-mono tabular-nums px-2.5 py-1 rounded-xl ${
              isOutOfStockAfter
                ? 'bg-rose-600 text-white shadow-xs'
                : isLowStockAfter
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-emerald-600 text-white shadow-xs'
            }`}>
              {resultingStock} {product.unit}
            </span>
          </div>
        </div>

        {/* Actions Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
          >
            إلغاء
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isSubmitting ? 'جارٍ الحفظ...' : 'تأكيد وحفظ التعديل في السجل'}</span>
          </button>
        </div>
      </form>
    </DraggableModalWrapper>
  );
};
