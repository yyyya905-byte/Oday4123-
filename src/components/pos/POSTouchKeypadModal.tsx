import React, { useState, useEffect, useRef } from 'react';
import { Product } from '../../types';
import { useApp } from '../../context/AppContext';
import { 
  Calculator, 
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
  Percent,
  Boxes,
  Layers,
  ArrowRight,
  Delete
} from 'lucide-react';
import { soundEffects } from '../../services/audio';
import { haptics } from '../../services/haptics';
import { DraggableModalWrapper } from '../common/DraggableModalWrapper';

export type KeypadMode = 'quantity' | 'price' | 'discount';

export interface POSTouchKeypadModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: KeypadMode;
  product?: Product | null;
  // Quantity mode props
  currentQuantity?: number;
  unit?: string;
  maxStock?: number;
  unitPrice?: number;
  onConfirmQuantity?: (newQuantity: number) => void;
  // Price mode props
  currentPrice?: number;
  costPrice?: number;
  isCartItem?: boolean;
  cartQuantity?: number;
  onConfirmPrice?: (newPrice: number, alsoUpdateCatalog: boolean, alsoAddToCart?: boolean) => void;
  // Discount mode props
  currentDiscountValue?: number;
  currentDiscountType?: 'percentage' | 'fixed';
  subtotal?: number;
  onConfirmDiscount?: (val: number, type: 'percentage' | 'fixed') => void;
}

export const POSTouchKeypadModal: React.FC<POSTouchKeypadModalProps> = ({
  isOpen,
  onClose,
  mode,
  product,
  currentQuantity = 1,
  unit = 'قطعة',
  maxStock,
  unitPrice = 0,
  onConfirmQuantity,
  currentPrice = 0,
  costPrice = 0,
  isCartItem = false,
  cartQuantity = 1,
  onConfirmPrice,
  currentDiscountValue = 0,
  currentDiscountType = 'percentage',
  subtotal = 0,
  onConfirmDiscount
}) => {
  const { settings, formatCurrency, language } = useApp();

  // Internal input state (as string for natural calculator editing)
  const [inputValue, setInputValue] = useState<string>('1');
  const [alsoUpdateCatalog, setAlsoUpdateCatalog] = useState<boolean>(!isCartItem);
  const [alsoAddToCart, setAlsoAddToCart] = useState<boolean>(false);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>(currentDiscountType);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize input when modal opens or mode/targets change
  useEffect(() => {
    if (isOpen) {
      if (mode === 'quantity') {
        setInputValue(currentQuantity > 0 ? currentQuantity.toString() : '1');
      } else if (mode === 'price') {
        const p = currentPrice || (product ? product.price : 0);
        setInputValue(p.toString());
        setAlsoUpdateCatalog(!isCartItem);
        setAlsoAddToCart(false);
      } else if (mode === 'discount') {
        setInputValue((currentDiscountValue || 0).toString());
        setDiscountType(currentDiscountType || 'percentage');
      }

      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 60);
    }
  }, [isOpen, mode, currentQuantity, currentPrice, currentDiscountValue, currentDiscountType, isCartItem, product]);

  // Handle hardware keyboard interactions
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleConfirm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, inputValue, alsoUpdateCatalog, alsoAddToCart, discountType, mode]);

  if (!isOpen) return null;

  const numericValue = parseFloat(inputValue) || 0;

  // Numpad touch operations
  const handleNumpadPress = (val: string) => {
    if (val === 'C') {
      haptics.delete();
      soundEffects.playClick();
      setInputValue('0');
    } else if (val === 'DEL') {
      haptics.tap();
      soundEffects.playClick();
      setInputValue(prev => {
        if (prev.length <= 1) return '0';
        return prev.slice(0, -1);
      });
    } else if (val === '.') {
      haptics.tap();
      soundEffects.playClick();
      setInputValue(prev => {
        if (prev.includes('.')) return prev;
        return (prev === '' ? '0' : prev) + '.';
      });
    } else if (val === '00') {
      haptics.tap();
      soundEffects.playClick();
      setInputValue(prev => {
        if (prev === '0' || prev === '') return '0';
        return prev + '00';
      });
    } else if (val === '000') {
      haptics.tap();
      soundEffects.playClick();
      setInputValue(prev => {
        if (prev === '0' || prev === '') return '0';
        return prev + '000';
      });
    } else {
      haptics.tap();
      soundEffects.playClick();
      setInputValue(prev => {
        if (prev === '0' || prev === '') return val;
        return prev + val;
      });
    }

    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Quick increment/decrement shortcuts
  const handleAddQuantity = (delta: number) => {
    haptics.buttonPress();
    soundEffects.playClick();
    const current = parseFloat(inputValue) || 0;
    const next = Math.max(0.1, Math.round((current + delta) * 100) / 100);
    setInputValue(next.toString());
  };

  const handleSetExact = (val: number) => {
    haptics.buttonPress();
    soundEffects.playClick();
    setInputValue(val.toString());
  };

  // Price percentage & rounding operations
  const originalProductPrice = product?.price || currentPrice || 0;
  const productCost = costPrice || product?.costPrice || 0;
  const profitMargin = productCost > 0 ? numericValue - productCost : 0;
  const profitMarginPercent = numericValue > 0 && productCost > 0 
    ? Math.round(((numericValue - productCost) / numericValue) * 100) 
    : 0;
  const isLoss = productCost > 0 && numericValue < productCost;
  const priceDiff = numericValue - originalProductPrice;

  const handleApplyPricePercent = (percent: number) => {
    haptics.buttonPress();
    soundEffects.playClick();
    const base = originalProductPrice > 0 ? originalProductPrice : numericValue;
    const computed = Math.max(0, Math.round(base * (1 + percent / 100)));
    setInputValue(computed.toString());
  };

  const handleRoundPrice = (roundTo: number) => {
    haptics.buttonPress();
    soundEffects.playClick();
    if (roundTo <= 0) return;
    const rounded = Math.round(numericValue / roundTo) * roundTo;
    setInputValue(rounded.toString());
  };

  // Confirm handling
  const handleConfirm = () => {
    if (isNaN(numericValue) || numericValue < 0) {
      haptics.scanError();
      soundEffects.playWarning();
      return;
    }

    haptics.confirm();
    soundEffects.playSuccess();

    if (mode === 'quantity') {
      onConfirmQuantity?.(numericValue);
    } else if (mode === 'price') {
      onConfirmPrice?.(numericValue, alsoUpdateCatalog, alsoAddToCart);
    } else if (mode === 'discount') {
      onConfirmDiscount?.(numericValue, discountType);
    }

    onClose();
  };

  // Common quick quantities for retail, restaurant, and wholesale
  const quickQuantityPresets = [1, 2, 3, 4, 5, 6, 10, 12, 20, 24, 50, 100];
  const quickQuantityDeltas = [
    { label: '+1', val: 1 },
    { label: '+2', val: 2 },
    { label: '+5', val: 5 },
    { label: '+10', val: 10 },
    { label: '+20', val: 20 },
    { label: '+50', val: 50 },
    { label: '+½', val: 0.5 },
  ];

  // Quick discount percentages
  const quickDiscountPercentages = [5, 10, 15, 20, 25, 30, 50];

  return (
    <DraggableModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <span className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
            {mode === 'quantity'
              ? (language === 'ar' ? 'لوحة إدخال الكمية باللمس' : 'Touch Quantity Keypad')
              : mode === 'price'
              ? (language === 'ar' ? 'لوحة تعديل السعر باللمس' : 'Touch Price Keypad')
              : (language === 'ar' ? 'لوحة تحديد الخصم باللمس' : 'Touch Discount Keypad')}
          </span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
            mode === 'quantity'
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
              : mode === 'price'
              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
          }`}>
            {mode === 'quantity' ? 'كمية' : mode === 'price' ? 'سعر فوري' : 'خصم'}
          </span>
        </div>
      }
      subtitle={
        product 
          ? `${language === 'ar' ? product.nameAr : product.nameEn} ${product.sku ? `(كود: ${product.sku})` : ''}`
          : (language === 'ar' ? 'إدخال رقمي فوري للشاشات اللمسية' : 'Touch-optimized numeric input')
      }
      icon={
        mode === 'quantity' ? (
          <Boxes className="w-5 h-5 text-blue-600" />
        ) : mode === 'price' ? (
          <Tag className="w-5 h-5 text-amber-500" />
        ) : (
          <Percent className="w-5 h-5 text-emerald-500" />
        )
      }
      maxWidth="max-w-md sm:max-w-lg"
    >
      <div className="p-3 sm:p-4.5 space-y-3 sm:space-y-4">
        {/* Product / Context Info Banner */}
        {product && (
          <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-100/90 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                {language === 'ar' ? product.nameAr : product.nameEn}
              </h4>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                <span>الوحدة: {unit || product.unit || 'قطعة'}</span>
                <span>•</span>
                <span>السعر: {formatCurrency(unitPrice || product.price)}</span>
                {maxStock !== undefined && (
                  <>
                    <span>•</span>
                    <span className={maxStock <= 5 ? 'text-amber-600 font-bold' : ''}>
                      المتاح: {maxStock}
                    </span>
                  </>
                )}
              </div>
            </div>

            {mode === 'quantity' && unitPrice > 0 && (
              <div className="text-end shrink-0 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                <span className="text-[10px] text-slate-400 block">الإجمالي المتوقع</span>
                <span className="text-xs sm:text-sm font-black text-blue-600 dark:text-blue-400 font-mono">
                  {formatCurrency(numericValue * unitPrice)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Discount Mode Type Switcher */}
        {mode === 'discount' && (
          <div className="flex items-center justify-between p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => {
                soundEffects.playClick();
                setDiscountType('percentage');
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                discountType === 'percentage'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Percent className="w-3.5 h-3.5" />
              <span>نسبة مئوية (%)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                soundEffects.playClick();
                setDiscountType('fixed');
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                discountType === 'fixed'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <span>مبلغ ثابت ({settings.currency.symbol})</span>
            </button>
          </div>
        )}

        {/* Big High-Contrast Touch Screen Display & Live Calculation */}
        <div className="relative rounded-2xl p-3 sm:p-4 bg-slate-900 dark:bg-black border-2 border-slate-700 dark:border-slate-800 shadow-inner flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
            <span>
              {mode === 'quantity'
                ? `الكمية الحالية (${unit || 'قطعة'})`
                : mode === 'price'
                ? `السعر الجديد (${settings.currency.symbol})`
                : discountType === 'percentage'
                ? 'نسبة الخصم المئوية'
                : `قيمة الخصم المباشر (${settings.currency.symbol})`}
            </span>
            <span className="text-[11px] text-amber-400 font-bold flex items-center gap-1">
              <span>لمس مباشر</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0 flex items-baseline gap-2">
              <input
                ref={inputRef}
                type="text"
                inputMode="decimal"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                className="w-full bg-transparent text-white font-mono font-black text-3xl sm:text-4xl tracking-tight focus:outline-none select-all"
                placeholder="0"
              />
              <span className="text-sm sm:text-base font-bold text-amber-400 shrink-0 font-mono">
                {mode === 'quantity' ? unit : mode === 'discount' && discountType === 'percentage' ? '%' : settings.currency.symbol}
              </span>
            </div>

            {/* In-display Quick Backspace & Clear */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => handleNumpadPress('DEL')}
                className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 active:scale-90 flex items-center justify-center font-black cursor-pointer shadow-xs transition-transform"
                title="مسح رقم (Backspace)"
                aria-label="مسح رقم"
              >
                <Delete className="w-5 h-5 text-amber-400" />
              </button>
              <button
                type="button"
                onClick={() => handleNumpadPress('C')}
                className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 active:scale-90 flex items-center justify-center font-black text-sm cursor-pointer shadow-xs transition-transform"
                title="تفريغ الحقل (Clear)"
                aria-label="تفريغ الحقل"
              >
                C
              </button>
            </div>
          </div>

          {/* Sub-calculation bar inside display */}
          <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
            {mode === 'quantity' ? (
              <>
                <span className="text-slate-400">
                  {unitPrice > 0 ? `${numericValue} × ${formatCurrency(unitPrice)}` : 'الكمية الإجمالية'}
                </span>
                <span className="text-emerald-400 font-black">
                  = {formatCurrency(numericValue * unitPrice)}
                </span>
              </>
            ) : mode === 'price' ? (
              <>
                <div className="flex items-center gap-1">
                  {priceDiff !== 0 ? (
                    <span className={`font-bold flex items-center gap-0.5 ${priceDiff > 0 ? 'text-blue-400' : 'text-emerald-400'}`}>
                      {priceDiff > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                      <span>{priceDiff > 0 ? `+${formatCurrency(priceDiff)}` : `${formatCurrency(priceDiff)}`}</span>
                    </span>
                  ) : (
                    <span className="text-slate-400">نفس السعر الحالي ({formatCurrency(originalProductPrice)})</span>
                  )}
                </div>
                {productCost > 0 && (
                  <span className={`font-bold ${isLoss ? 'text-rose-400' : 'text-emerald-400'}`}>
                    هامش: {profitMarginPercent}% ({formatCurrency(profitMargin)})
                  </span>
                )}
              </>
            ) : (
              <>
                <span className="text-slate-400">
                  المجموع: {formatCurrency(subtotal)}
                </span>
                <span className="text-emerald-400 font-bold">
                  الصافي: {formatCurrency(
                    Math.max(0, subtotal - (discountType === 'percentage' ? (subtotal * numericValue) / 100 : numericValue))
                  )}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Warning if stock exceeded or price below cost */}
        {mode === 'quantity' && maxStock !== undefined && numericValue > maxStock && (
          <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-300 text-xs font-bold">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
            <span>تنبيه: الكمية المدخلة ({numericValue}) أكبر من رصيد المخزن الحالي ({maxStock})</span>
          </div>
        )}

        {mode === 'price' && isLoss && (
          <div className="flex items-center gap-2 p-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-300 text-xs font-bold">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>تنبيه: السعر المحدد أقل من سعر التكلفة ({formatCurrency(productCost)}) - خسارة!</span>
          </div>
        )}

        {/* Quick Presets Bar (Quantity Presets / Price % / Discount %) */}
        {mode === 'quantity' && (
          <div className="space-y-1.5">
            {/* Incremental Deltas */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[10px] text-slate-400 shrink-0 font-bold">إضافة:</span>
              {quickQuantityDeltas.map(d => (
                <button
                  key={d.label}
                  type="button"
                  onClick={() => handleAddQuantity(d.val)}
                  className="px-2.5 py-1.5 min-h-[36px] rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-mono text-xs font-black active:scale-90 transition-transform cursor-pointer shrink-0"
                >
                  {d.label}
                </button>
              ))}
            </div>

            {/* Direct Number Presets */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[10px] text-slate-400 shrink-0 font-bold">مباشر:</span>
              {quickQuantityPresets.map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleSetExact(val)}
                  className={`px-2.5 py-1 min-h-[32px] rounded-xl font-mono text-xs font-bold transition-all active:scale-90 cursor-pointer shrink-0 border ${
                    numericValue === val
                      ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>
        )}

        {mode === 'price' && (
          <div className="space-y-1.5">
            {/* Quick % and Rounding */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[10px] text-slate-400 shrink-0 font-bold">خصم/زيادة:</span>
              {[-5, -10, -15, -20, -50, 5, 10].map(pct => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => handleApplyPricePercent(pct)}
                  className={`px-2 py-1 min-h-[34px] rounded-xl font-mono text-xs font-black border transition-transform active:scale-90 cursor-pointer shrink-0 ${
                    pct < 0
                      ? 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                      : 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                  }`}
                >
                  {pct > 0 ? `+${pct}%` : `${pct}%`}
                </button>
              ))}
              {originalProductPrice > 0 && priceDiff !== 0 && (
                <button
                  type="button"
                  onClick={() => handleSetExact(originalProductPrice)}
                  className="px-2 py-1 min-h-[34px] rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 text-xs font-bold active:scale-90 cursor-pointer shrink-0 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>الأصلي</span>
                </button>
              )}
            </div>

            {/* Currency rounding shortcuts */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[10px] text-slate-400 shrink-0 font-bold">تقريب:</span>
              {[500, 1000, 5000, 10000].map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleRoundPrice(r)}
                  className="px-2 py-1 min-h-[30px] rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[10px] font-mono font-bold active:scale-90 cursor-pointer shrink-0"
                >
                  {r.toLocaleString()}
                </button>
              ))}
            </div>
          </div>
        )}

        {mode === 'discount' && discountType === 'percentage' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[10px] text-slate-400 shrink-0 font-bold">نسب سريعة:</span>
            {quickDiscountPercentages.map(pct => (
              <button
                key={pct}
                type="button"
                onClick={() => handleSetExact(pct)}
                className={`px-3 py-1.5 min-h-[36px] rounded-xl font-mono text-xs font-black border transition-transform active:scale-90 cursor-pointer shrink-0 ${
                  numericValue === pct
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                    : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                }`}
              >
                {pct}%
              </button>
            ))}
          </div>
        )}

        {/* BIG TACTILE TOUCH NUMPAD GRID (Designed for Speed & Heavy Fingers) */}
        <div className="grid grid-cols-4 gap-2 sm:gap-2.5 pt-1">
          {/* Row 1: 7, 8, 9, Quick Modifier */}
          <button
            type="button"
            onClick={() => handleNumpadPress('7')}
            className="min-h-[54px] sm:min-h-[58px] rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-mono font-black text-2xl shadow-xs border border-slate-200 dark:border-slate-700 active:scale-95 active:bg-amber-50 dark:active:bg-slate-600 transition-all flex items-center justify-center cursor-pointer select-none"
          >
            7
          </button>
          <button
            type="button"
            onClick={() => handleNumpadPress('8')}
            className="min-h-[54px] sm:min-h-[58px] rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-mono font-black text-2xl shadow-xs border border-slate-200 dark:border-slate-700 active:scale-95 active:bg-amber-50 dark:active:bg-slate-600 transition-all flex items-center justify-center cursor-pointer select-none"
          >
            8
          </button>
          <button
            type="button"
            onClick={() => handleNumpadPress('9')}
            className="min-h-[54px] sm:min-h-[58px] rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-mono font-black text-2xl shadow-xs border border-slate-200 dark:border-slate-700 active:scale-95 active:bg-amber-50 dark:active:bg-slate-600 transition-all flex items-center justify-center cursor-pointer select-none"
          >
            9
          </button>
          <button
            type="button"
            onClick={() => handleNumpadPress('DEL')}
            className="min-h-[54px] sm:min-h-[58px] rounded-2xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-bold text-xs sm:text-sm shadow-xs border border-rose-200 dark:border-rose-900/50 active:scale-95 transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer select-none"
            title="مسح رقم"
          >
            <Delete className="w-5 h-5 text-rose-600" />
            <span className="text-[10px] font-black">مسح</span>
          </button>

          {/* Row 2: 4, 5, 6, Clear */}
          <button
            type="button"
            onClick={() => handleNumpadPress('4')}
            className="min-h-[54px] sm:min-h-[58px] rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-mono font-black text-2xl shadow-xs border border-slate-200 dark:border-slate-700 active:scale-95 active:bg-amber-50 dark:active:bg-slate-600 transition-all flex items-center justify-center cursor-pointer select-none"
          >
            4
          </button>
          <button
            type="button"
            onClick={() => handleNumpadPress('5')}
            className="min-h-[54px] sm:min-h-[58px] rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-mono font-black text-2xl shadow-xs border border-slate-200 dark:border-slate-700 active:scale-95 active:bg-amber-50 dark:active:bg-slate-600 transition-all flex items-center justify-center cursor-pointer select-none"
          >
            5
          </button>
          <button
            type="button"
            onClick={() => handleNumpadPress('6')}
            className="min-h-[54px] sm:min-h-[58px] rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-mono font-black text-2xl shadow-xs border border-slate-200 dark:border-slate-700 active:scale-95 active:bg-amber-50 dark:active:bg-slate-600 transition-all flex items-center justify-center cursor-pointer select-none"
          >
            6
          </button>
          <button
            type="button"
            onClick={() => handleNumpadPress('C')}
            className="min-h-[54px] sm:min-h-[58px] rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm shadow-xs border border-slate-200 dark:border-slate-700 active:scale-95 transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer select-none"
            title="تفريغ الحقل"
          >
            <span className="text-base font-black">C</span>
            <span className="text-[10px] font-bold">تفريغ</span>
          </button>

          {/* Row 3: 1, 2, 3, Extra helper button */}
          <button
            type="button"
            onClick={() => handleNumpadPress('1')}
            className="min-h-[54px] sm:min-h-[58px] rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-mono font-black text-2xl shadow-xs border border-slate-200 dark:border-slate-700 active:scale-95 active:bg-amber-50 dark:active:bg-slate-600 transition-all flex items-center justify-center cursor-pointer select-none"
          >
            1
          </button>
          <button
            type="button"
            onClick={() => handleNumpadPress('2')}
            className="min-h-[54px] sm:min-h-[58px] rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-mono font-black text-2xl shadow-xs border border-slate-200 dark:border-slate-700 active:scale-95 active:bg-amber-50 dark:active:bg-slate-600 transition-all flex items-center justify-center cursor-pointer select-none"
          >
            2
          </button>
          <button
            type="button"
            onClick={() => handleNumpadPress('3')}
            className="min-h-[54px] sm:min-h-[58px] rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-mono font-black text-2xl shadow-xs border border-slate-200 dark:border-slate-700 active:scale-95 active:bg-amber-50 dark:active:bg-slate-600 transition-all flex items-center justify-center cursor-pointer select-none"
          >
            3
          </button>
          {mode === 'price' ? (
            <button
              type="button"
              onClick={() => handleNumpadPress('000')}
              className="min-h-[54px] sm:min-h-[58px] rounded-2xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-900 dark:text-amber-200 font-mono font-black text-lg shadow-xs border border-amber-200 dark:border-amber-800/60 active:scale-95 transition-all flex items-center justify-center cursor-pointer select-none"
              title="إضافة 3 أصفار (آلاف)"
            >
              000
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleAddQuantity(1)}
              className="min-h-[54px] sm:min-h-[58px] rounded-2xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-mono font-black text-base shadow-xs border border-blue-200 dark:border-blue-800/60 active:scale-95 transition-all flex items-center justify-center cursor-pointer select-none"
              title="زيادة 1"
            >
              +1
            </button>
          )}

          {/* Row 4: 0, 00, Decimal Dot, Confirm */}
          <button
            type="button"
            onClick={() => handleNumpadPress('0')}
            className="min-h-[54px] sm:min-h-[58px] rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-mono font-black text-2xl shadow-xs border border-slate-200 dark:border-slate-700 active:scale-95 active:bg-amber-50 dark:active:bg-slate-600 transition-all flex items-center justify-center cursor-pointer select-none"
          >
            0
          </button>
          <button
            type="button"
            onClick={() => handleNumpadPress('00')}
            className="min-h-[54px] sm:min-h-[58px] rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-mono font-black text-xl shadow-xs border border-slate-200 dark:border-slate-700 active:scale-95 active:bg-amber-50 dark:active:bg-slate-600 transition-all flex items-center justify-center cursor-pointer select-none"
          >
            00
          </button>
          <button
            type="button"
            onClick={() => handleNumpadPress('.')}
            className="min-h-[54px] sm:min-h-[58px] rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-mono font-black text-2xl shadow-xs border border-slate-200 dark:border-slate-700 active:scale-95 active:bg-amber-50 dark:active:bg-slate-600 transition-all flex items-center justify-center cursor-pointer select-none"
            title="فاصلة عشرية"
          >
            .
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={`min-h-[54px] sm:min-h-[58px] rounded-2xl text-white font-black text-sm shadow-md active:scale-95 transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer select-none ${
              mode === 'quantity'
                ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30'
                : mode === 'price'
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/30'
                : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
            }`}
          >
            <Check className="w-5 h-5" />
            <span className="text-[11px] font-black">تأكيد</span>
          </button>
        </div>

        {/* Scope Options for Price Mode */}
        {mode === 'price' && (
          <div className="p-3 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-500/20 space-y-2">
            <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>خيارات حفظ السعر:</span>
            </span>

            {isCartItem ? (
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-900 dark:text-white">
                <input
                  type="checkbox"
                  checked={alsoUpdateCatalog}
                  onChange={e => setAlsoUpdateCatalog(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 accent-amber-500 cursor-pointer"
                />
                <span>تحديث السعر الدائم في بطاقة الصنف بالمخزون أيضاً</span>
              </label>
            ) : (
              <div className="space-y-1.5">
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
        )}

        {/* Modal Bottom Action Buttons */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
          >
            إلغاء (Esc)
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            className={`flex-1 px-4 py-2.5 rounded-xl font-black text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer ${
              mode === 'quantity'
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : mode === 'price'
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>
              {mode === 'quantity'
                ? `اعتماد الكمية (${numericValue} ${unit})`
                : mode === 'price'
                ? `حفظ السعر (${formatCurrency(numericValue)})`
                : `تطبيق الخصم (${numericValue}${discountType === 'percentage' ? '%' : ' ' + settings.currency.symbol})`}
            </span>
          </button>
        </div>
      </div>
    </DraggableModalWrapper>
  );
};
