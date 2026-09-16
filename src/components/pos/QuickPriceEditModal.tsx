import React, { useState, useEffect, useRef } from 'react';
import { Product } from '../../types';
import { useApp } from '../../context/AppContext';
import { 
  DollarSign, 
  X, 
  Check, 
  RotateCcw, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Package, 
  Tag, 
  Sparkles,
  ShoppingBag,
  Calculator,
  Percent
} from 'lucide-react';
import { soundEffects } from '../../services/audio';
import { DraggableModalWrapper } from '../common/DraggableModalWrapper';

interface QuickPriceEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  currentPrice: number;
  isCartItem?: boolean;
  cartQuantity?: number;
  onSave: (newPrice: number, alsoUpdateCatalog: boolean, alsoAddToCart?: boolean) => void;
}

export const QuickPriceEditModal: React.FC<QuickPriceEditModalProps> = ({
  isOpen,
  onClose,
  product,
  currentPrice,
  isCartItem = false,
  cartQuantity = 1,
  onSave
}) => {
  const { settings, formatCurrency, language } = useApp();
  const [priceInput, setPriceInput] = useState<string>('');
  const [alsoUpdateCatalog, setAlsoUpdateCatalog] = useState<boolean>(!isCartItem);
  const [alsoAddToCart, setAlsoAddToCart] = useState<boolean>(false);
  const [showNumpad, setShowNumpad] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && product) {
      setPriceInput(currentPrice.toString());
      setAlsoUpdateCatalog(!isCartItem);
      setAlsoAddToCart(false);
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 80);
    }
  }, [isOpen, product, currentPrice, isCartItem]);

  // Handle keyboard shortcuts (Enter to save, Esc to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Enter') {
        // Prevent default submit and trigger save
        e.preventDefault();
        handleConfirm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, priceInput, alsoUpdateCatalog, alsoAddToCart, product]);

  if (!isOpen || !product) return null;

  const numericPrice = parseFloat(priceInput) || 0;
  const originalPrice = product.price;
  const costPrice = product.costPrice || 0;
  const isLoss = costPrice > 0 && numericPrice < costPrice;
  const profitMargin = costPrice > 0 ? numericPrice - costPrice : 0;
  const profitMarginPercent = numericPrice > 0 && costPrice > 0 
    ? Math.round(((numericPrice - costPrice) / numericPrice) * 100) 
    : 0;
  const priceDifference = numericPrice - originalPrice;

  const handleConfirm = () => {
    if (isNaN(numericPrice) || numericPrice < 0) {
      soundEffects.playWarning();
      return;
    }
    soundEffects.playSuccess();
    onSave(numericPrice, alsoUpdateCatalog, alsoAddToCart);
    onClose();
  };

  const handleApplyPercentage = (percentChange: number) => {
    soundEffects.playClick();
    const base = originalPrice > 0 ? originalPrice : numericPrice;
    const computed = Math.max(0, Math.round(base * (1 + percentChange / 100)));
    setPriceInput(computed.toString());
  };

  const handleRoundPrice = (roundTo: number) => {
    soundEffects.playClick();
    if (roundTo <= 0) return;
    const rounded = Math.round(numericPrice / roundTo) * roundTo;
    setPriceInput(rounded.toString());
  };

  const handleResetToOriginal = () => {
    soundEffects.playClick();
    setPriceInput(originalPrice.toString());
  };

  const handleNumpadPress = (val: string) => {
    soundEffects.playClick();
    if (val === 'C') {
      setPriceInput('0');
    } else if (val === 'DEL') {
      setPriceInput(prev => (prev.length > 1 ? prev.slice(0, -1) : '0'));
    } else if (val === '00') {
      setPriceInput(prev => (prev === '0' || prev === '' ? '0' : prev + '00'));
    } else {
      setPriceInput(prev => (prev === '0' || prev === '' ? val : prev + val));
    }
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <DraggableModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <span>تعديل سعر المنتج مباشرة</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300">
            {isCartItem ? 'صنف بالسلة' : 'بطاقة الصنف'}
          </span>
        </div>
      }
      subtitle={isCartItem ? 'تعديل سعر البيع بالفاتورة الحالية' : 'تعديل فوري لسعر المنتج من شاشة الكاشير'}
      icon={<DollarSign className="w-5 h-5 text-amber-500" />}
      maxWidth="max-w-lg"
    >
      {/* Modal Body */}
      <div className="p-4 sm:p-5 space-y-4">
        {/* Product Identification Bar */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-start justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <h4 className="text-sm font-black text-slate-900 dark:text-white truncate">
                {language === 'ar' ? product.nameAr : product.nameEn}
              </h4>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                <span>كود: {product.sku}</span>
                {product.barcode && (
                  <>
                    <span>•</span>
                    <span>باركود: {product.barcode}</span>
                  </>
                )}
                {product.unit && (
                  <>
                    <span>•</span>
                    <span>الوحدة: {product.unit}</span>
                  </>
                )}
              </div>
            </div>

            <div className="text-end shrink-0">
              <span className="text-[10px] text-slate-400 block">السعر الأساسي</span>
              <span className="text-xs font-bold font-mono text-slate-700 dark:text-slate-300">
                {formatCurrency(originalPrice)}
              </span>
            </div>
          </div>

          {/* Price Input Block */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="quick-price-input" className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-amber-500" />
                <span>السعر الجديد للقطعة (New Unit Price):</span>
              </label>

              <button
                type="button"
                onClick={() => setShowNumpad(!showNumpad)}
                className={`text-[11px] font-bold flex items-center gap-1 px-2.5 py-1 rounded-xl border transition-colors cursor-pointer ${
                  showNumpad
                    ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-2xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-400'
                }`}
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>لوحة أرقام لمسية</span>
              </button>
            </div>

            <div className="relative flex items-center">
              <input
                id="quick-price-input"
                ref={inputRef}
                type="number"
                min="0"
                step="any"
                value={priceInput}
                onChange={e => setPriceInput(e.target.value)}
                className="w-full ps-4 pe-20 py-3 text-2xl font-black font-mono text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-950 border-2 border-amber-500/60 focus:border-amber-500 rounded-2xl outline-none shadow-inner transition-all text-start"
                placeholder="0"
              />
              <span className="absolute end-4 text-xs font-black font-mono px-2 py-1 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 pointer-events-none">
                {settings.currency.symbol}
              </span>
            </div>

            {/* Price Difference Indicator */}
            <div className="flex items-center justify-between text-[11px] pt-1">
              <div className="flex items-center gap-1 font-mono">
                {priceDifference !== 0 ? (
                  <span className={`font-bold flex items-center gap-0.5 ${
                    priceDifference > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {priceDifference > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    <span>
                      {priceDifference > 0 ? `زيادة +${formatCurrency(priceDifference)}` : `خصم ${formatCurrency(Math.abs(priceDifference))}`}
                    </span>
                    <span>
                      ({originalPrice > 0 ? `${priceDifference > 0 ? '+' : ''}${Math.round((priceDifference / originalPrice) * 100)}%` : ''})
                    </span>
                  </span>
                ) : (
                  <span className="text-slate-400">مطابق للسعر الأساسي الحالي</span>
                )}
              </div>

              {priceDifference !== 0 && (
                <button
                  type="button"
                  onClick={handleResetToOriginal}
                  className="text-slate-500 hover:text-amber-600 dark:text-slate-400 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>استعادة السعر الأساسي ({formatCurrency(originalPrice)})</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Percentage & Adjustment Shortcuts */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1">
                <Percent className="w-3.5 h-3.5 text-amber-500" />
                خصومات ونسب سريعة (من السعر الأصلي):
              </span>
              <span className="text-[10px] text-slate-400">انقر للتطبيق الفوري</span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
              {[
                { label: '-5%', val: -5, color: 'hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' },
                { label: '-10%', val: -10, color: 'hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' },
                { label: '-15%', val: -15, color: 'hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' },
                { label: '-20%', val: -20, color: 'hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' },
                { label: '+5%', val: 5, color: 'hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-700 dark:text-blue-400' },
                { label: '+10%', val: 10, color: 'hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-700 dark:text-blue-400' },
              ].map(item => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleApplyPercentage(item.val)}
                  className={`py-1.5 px-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-black font-mono transition-all active:scale-95 cursor-pointer shadow-2xs ${item.color}`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Currency Rounding Bar */}
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-400 shrink-0">تقريب لمضاعفات:</span>
              {[500, 1000, 5000].map(roundVal => (
                <button
                  key={roundVal}
                  type="button"
                  onClick={() => handleRoundPrice(roundVal)}
                  className="px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-mono font-bold cursor-pointer transition-colors"
                >
                  {roundVal.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Touch POS On-Screen Numpad */}
          {showNumpad && (
            <div className="p-3 bg-slate-100 dark:bg-slate-950/80 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 animate-in fade-in zoom-in-95">
              <div className="grid grid-cols-4 gap-1.5">
                {['7', '8', '9', 'DEL', '4', '5', '6', 'C', '1', '2', '3', '00', '0'].map(key => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleNumpadPress(key)}
                    className={`py-2.5 rounded-xl font-black font-mono text-sm transition-all active:scale-90 cursor-pointer shadow-2xs ${
                      key === 'DEL' || key === 'C'
                        ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 hover:bg-rose-200'
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white hover:bg-amber-50 dark:hover:bg-slate-700'
                    } ${key === '0' ? 'col-span-2' : ''}`}
                  >
                    {key === 'DEL' ? '⌫ مسح' : key === 'C' ? 'إفراغ' : key}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handleNumpadPress('.')}
                  className="py-2.5 rounded-xl font-black font-mono text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-white hover:bg-amber-50 cursor-pointer"
                >
                  .
                </button>
              </div>
            </div>
          )}

          {/* Cost & Profit Analysis */}
          {costPrice > 0 && (
            <div className={`p-3 rounded-2xl border ${
              isLoss 
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60' 
                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/80'
            }`}>
              <div className="flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 dark:text-slate-400">سعر التكلفة:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(costPrice)}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 dark:text-slate-400">الربح التقديري:</span>
                  <span className={`font-black ${isLoss ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {formatCurrency(profitMargin)} ({profitMarginPercent}%)
                  </span>
                </div>
              </div>

              {isLoss && (
                <div className="mt-2 flex items-start gap-1.5 text-[11px] text-rose-700 dark:text-rose-300 font-bold">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-500" />
                  <span>تنبيه: السعر المحدد أقل من سعر تكلفة شراء المنتج ({formatCurrency(costPrice)})!</span>
                </div>
              )}
            </div>
          )}

          {/* Scope Selection / Checkboxes */}
          <div className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-500/20 space-y-2.5">
            <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>نطاق تطبيق السعر الجديد:</span>
            </span>

            {isCartItem ? (
              <div className="space-y-2">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-800 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={true}
                    disabled
                    className="w-4 h-4 rounded text-amber-500 cursor-not-allowed"
                  />
                  <span>تطبيق على هذا الصنف في السلة الحالية (الكمية: {cartQuantity})</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-900 dark:text-white">
                  <input
                    type="checkbox"
                    checked={alsoUpdateCatalog}
                    onChange={e => setAlsoUpdateCatalog(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 accent-amber-500 cursor-pointer"
                  />
                  <span>حفظ وتحديث السعر الدائم في بطاقة الصنف بالمخزون أيضاً</span>
                </label>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-900 dark:text-white">
                  <input
                    type="checkbox"
                    checked={alsoUpdateCatalog}
                    onChange={e => setAlsoUpdateCatalog(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 accent-amber-500 cursor-pointer"
                  />
                  <span>تحديث السعر الدائم في بطاقة الصنف بالمخزون</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={alsoAddToCart}
                    onChange={e => setAlsoAddToCart(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 accent-amber-500 cursor-pointer"
                  />
                  <span className="flex items-center gap-1">
                    <ShoppingBag className="w-3.5 h-3.5 text-amber-500" />
                    <span>وإضافة الصنف إلى السلة بالسعر الجديد فوراً</span>
                  </span>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
          >
            إلغاء (Esc)
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            data-longpress-title="حفظ السعر الجديد"
            data-longpress-desc="تطبيق السعر الجديد وحفظ التعديلات في الفاتورة أو بطاقة الصنف بالمخزون."
            className="px-5 sm:px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>حفظ السعر الجديد ({formatCurrency(numericPrice)})</span>
          </button>
        </div>
    </DraggableModalWrapper>
  );
};
