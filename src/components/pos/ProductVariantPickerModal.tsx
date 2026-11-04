import React, { useState, useMemo, useEffect } from 'react';
import { Product, ProductVariant } from '../../types';
import { useApp } from '../../context/AppContext';
import { soundEffects } from '../../services/audio';
import { haptics } from '../../services/haptics';
import {
  X,
  Plus,
  Minus,
  Check,
  Package,
  Layers,
  Sparkles,
  Barcode,
  Search,
  ShoppingCart,
  Eye,
  Tag,
  AlertCircle,
  CheckCircle2,
  ListFilter,
  SlidersHorizontal,
  Info,
  Calendar,
  Layers as LayersIcon
} from 'lucide-react';

interface ProductVariantPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onAddToCart?: (product: Product, quantity: number, forceWholesale?: boolean, variant?: ProductVariant) => void;
}

export const ProductVariantPickerModal: React.FC<ProductVariantPickerModalProps> = ({
  isOpen,
  onClose,
  product,
  onAddToCart
}) => {
  const {
    cart,
    addToCart,
    formatCurrency,
    settings,
    language,
    posTradeMode,
    businessMode,
    categories,
    t
  } = useApp();

  const [activeTab, setActiveTab] = useState<'picker' | 'list'>('picker');
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);
  const [variantListQuantities, setVariantListQuantities] = useState<Record<string, number>>({});
  const [searchFilter, setSearchFilter] = useState('');

  const hasVariants = Boolean(product?.hasVariants && product?.variants && product.variants.length > 0);
  const variants = product?.variants || [];
  const variantOptions = product?.variantOptions || [];

  // Reset and auto-initialize state when product opens
  useEffect(() => {
    if (isOpen && product) {
      setSelectedQuantity(1);
      setSearchFilter('');
      setActiveTab('picker');

      if (hasVariants && variants.length > 0) {
        // Auto-select first variant's attributes as initial state for instant responsiveness
        const firstVar = variants[0];
        if (firstVar && firstVar.attributes) {
          setSelectedAttributes({ ...firstVar.attributes });
        } else if (variantOptions.length > 0) {
          const initialMap: Record<string, string> = {};
          variantOptions.forEach(opt => {
            if (opt.values && opt.values.length > 0) {
              initialMap[opt.nameAr] = opt.values[0];
            }
          });
          setSelectedAttributes(initialMap);
        } else {
          setSelectedAttributes({});
        }

        // Initialize list view quantities to 1
        const initialQtys: Record<string, number> = {};
        variants.forEach(v => {
          initialQtys[v.id] = 1;
        });
        setVariantListQuantities(initialQtys);
      } else {
        setSelectedAttributes({});
      }
    }
  }, [isOpen, product]);

  // Resolve matching variant based on current selected attributes
  const matchedVariant = useMemo<ProductVariant | null>(() => {
    if (!hasVariants || variants.length === 0) return null;

    // First try exact match where all attributes match
    const exact = variants.find(v => {
      if (!v.attributes) return false;
      for (const [key, val] of Object.entries(selectedAttributes)) {
        if (val && v.attributes[key] !== val) {
          return false;
        }
      }
      return true;
    });

    if (exact) return exact;

    // Fallback: match first variant that matches any selected attribute or first variant
    return variants[0] || null;
  }, [hasVariants, variants, selectedAttributes]);

  // Filtered variants for the 'list' overview tab
  const filteredVariants = useMemo(() => {
    return variants.filter(v => {
      if (searchFilter.trim()) {
        const q = searchFilter.toLowerCase();
        const matchesName = (v.nameAr || '').toLowerCase().includes(q) || (v.nameEn || '').toLowerCase().includes(q);
        const matchesSku = (v.sku || '').toLowerCase().includes(q);
        const matchesBarcode = (v.barcode || '').toLowerCase().includes(q);
        if (!matchesName && !matchesSku && !matchesBarcode) {
          return false;
        }
      }
      return true;
    });
  }, [variants, searchFilter]);

  if (!isOpen || !product) return null;

  const isWholesale = posTradeMode === 'wholesale' || product.tradeType === 'wholesale';

  // Calculate current effective price based on trade mode
  const currentUnitPrice = matchedVariant
    ? (isWholesale && matchedVariant.wholesalePrice && matchedVariant.wholesalePrice > 0
        ? matchedVariant.wholesalePrice
        : matchedVariant.price)
    : (isWholesale && product.wholesalePrice && product.wholesalePrice > 0
        ? product.wholesalePrice
        : product.price);

  const currentOriginalPrice = matchedVariant ? matchedVariant.price : product.price;
  const currentStock = matchedVariant ? matchedVariant.stock : product.stock;
  const isOutOfStock = currentStock <= 0;
  const isLowStock = currentStock > 0 && currentStock <= (matchedVariant?.minStock || product.minStock || 5);
  const currentSku = matchedVariant ? matchedVariant.sku : product.sku;
  const currentBarcode = matchedVariant ? matchedVariant.barcode : product.barcode;

  // Calculate total price with quantity
  const calculatedTotal = currentUnitPrice * selectedQuantity;

  // Category name
  const cat = categories.find(c => c.id === product.categoryId);

  // Handle adding configured item from interactive picker
  const handleAddConfiguredItemToCart = () => {
    if (isOutOfStock) {
      soundEffects.playWarning();
      haptics.warning();
      return;
    }

    soundEffects.playSuccess();
    haptics.glassPress();

    if (onAddToCart) {
      onAddToCart(product, selectedQuantity, isWholesale, matchedVariant || undefined);
    } else {
      addToCart(product, selectedQuantity, isWholesale, matchedVariant || undefined);
    }

    onClose();
  };

  // Handle adding from list view
  const handleAddFromList = (variant: ProductVariant, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const qty = variantListQuantities[variant.id] || 1;

    if (variant.stock <= 0) {
      soundEffects.playWarning();
      haptics.warning();
      return;
    }

    soundEffects.playGlassTap();
    haptics.selection();

    if (onAddToCart) {
      onAddToCart(product, qty, isWholesale, variant);
    } else {
      addToCart(product, qty, isWholesale, variant);
    }

    setVariantListQuantities(prev => ({ ...prev, [variant.id]: 1 }));
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-details-modal-title"
      className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Product Thumbnail */}
            <div className="w-13 h-13 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-700 shrink-0 flex items-center justify-center shadow-xs">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.nameAr}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-emerald-600 dark:text-emerald-400 font-black text-2xl">
                  {product.nameAr.charAt(0)}
                </div>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3
                  id="product-details-modal-title"
                  className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate"
                >
                  {language === 'ar' ? product.nameAr : product.nameEn}
                </h3>

                {hasVariants && (
                  <span className="px-2 py-0.5 text-[10px] font-black rounded-lg bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 shrink-0 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-purple-500" />
                    <span>{variants.length} خيارات / أحجام</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
                {cat && (
                  <span className="font-semibold text-slate-600 dark:text-slate-300">
                    {language === 'ar' ? cat.nameAr : cat.nameEn}
                  </span>
                )}
                <span>·</span>
                <span className="font-mono text-[11px] text-slate-400">
                  SKU: {currentSku}
                </span>
                {currentBarcode && (
                  <>
                    <span>·</span>
                    <span className="font-mono text-[11px] text-slate-400 flex items-center gap-0.5">
                      <Barcode className="w-3 h-3" />
                      {currentBarcode}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher (Only if item has multiple variants) */}
        {hasVariants && (
          <div className="px-5 pt-3 pb-0 bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  soundEffects.playGlassTap();
                  setActiveTab('picker');
                }}
                className={`px-3.5 py-2 text-xs font-black rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 border-b-2 ${
                  activeTab === 'picker'
                    ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900 shadow-2xs'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>تحديد الخيارات بالشرائح التفاعلية</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundEffects.playGlassTap();
                  setActiveTab('list');
                }}
                className={`px-3.5 py-2 text-xs font-black rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 border-b-2 ${
                  activeTab === 'list'
                    ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900 shadow-2xs'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span>عرض جميع التفرعات ({variants.length})</span>
              </button>
            </div>

            <div className="text-[11px] font-bold text-slate-400 hidden sm:block">
              {isWholesale ? 'وضع بيع الجملة مفعل' : 'وضع بيع التجزئة'}
            </div>
          </div>
        )}

        {/* Modal Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 max-h-[62vh]">
          {hasVariants && activeTab === 'picker' ? (
            /* 1. INTERACTIVE ATTRIBUTE CHIPS PICKER */
            <div className="space-y-4">
              {/* Attribute Dimensions (e.g. Size, Color, Flavor) */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-2">
                  <Tag className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>حدد المقاس واللون والخيارات المطلوبة:</span>
                </div>

                {variantOptions.map(opt => {
                  const currentSelectedVal = selectedAttributes[opt.nameAr];

                  return (
                    <div key={opt.nameAr} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-black text-slate-900 dark:text-white">
                          {opt.nameAr}:
                        </span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {currentSelectedVal || 'يرجى الاختيار'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {opt.values.map(val => {
                          const isSelected = currentSelectedVal === val;

                          // Check if any variant exists with this attribute value and is in stock
                          const matchingVariantsWithVal = variants.filter(
                            v => v.attributes && v.attributes[opt.nameAr] === val
                          );
                          const totalStockForVal = matchingVariantsWithVal.reduce(
                            (s, v) => s + (v.stock || 0),
                            0
                          );

                          return (
                            <button
                              key={val}
                              type="button"
                              onClick={() => {
                                soundEffects.playGlassTap();
                                haptics.selection();
                                setSelectedAttributes(prev => ({
                                  ...prev,
                                  [opt.nameAr]: val
                                }));
                              }}
                              className={`group relative px-4 py-2 min-h-[42px] rounded-xl text-xs font-black transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 ${
                                isSelected
                                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400'
                                  : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-emerald-500/60 hover:bg-slate-50 dark:hover:bg-slate-800'
                              }`}
                            >
                              {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                              <span>{val}</span>

                              {totalStockForVal <= 0 && (
                                <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                                  isSelected ? 'bg-rose-900 text-rose-200' : 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-300'
                                }`}>
                                  نافذ
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Matched Variant Details & Live Updated Price Card */}
              {matchedVariant ? (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-white to-blue-500/5 dark:from-emerald-950/30 dark:via-slate-800/80 dark:to-blue-950/20 border border-emerald-500/30 shadow-xs space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>الخيار المحدد المتطابق</span>
                      </div>
                      <h4 className="text-base font-black text-slate-900 dark:text-white">
                        {matchedVariant.nameAr}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono flex-wrap">
                        <span>SKU: {matchedVariant.sku}</span>
                        {matchedVariant.barcode && <span>· باركود: {matchedVariant.barcode}</span>}
                      </div>
                    </div>

                    {/* Stock Status Pill */}
                    <div className="text-end shrink-0">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-xl shadow-2xs ${
                          isOutOfStock
                            ? 'bg-rose-600 text-white animate-pulse'
                            : isLowStock
                            ? 'bg-amber-500 text-white'
                            : 'bg-emerald-600 text-white'
                        }`}
                      >
                        {isOutOfStock
                          ? 'نافذ تماماً (0)'
                          : isLowStock
                          ? `قارَب على النفاد (${currentStock})`
                          : `متوفر بالمخزن (${currentStock})`}
                      </span>
                    </div>
                  </div>

                  {/* Live Price Display Row */}
                  <div className="pt-2 border-t border-emerald-500/20 flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                        السعر المحدث للقطعة:
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(currentUnitPrice)}
                        </span>
                        {isWholesale && currentOriginalPrice !== currentUnitPrice && (
                          <span className="text-xs line-through font-mono text-slate-400">
                            {formatCurrency(currentOriginalPrice)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quantity Stepper */}
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                      <span className="text-xs font-bold px-2 text-slate-500 dark:text-slate-400">
                        الكمية:
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          soundEffects.playQuantityTick('down');
                          haptics.cartModify();
                          setSelectedQuantity(q => Math.max(1, q - 1));
                        }}
                        disabled={selectedQuantity <= 1}
                        className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-30 flex items-center justify-center cursor-pointer active:scale-90"
                      >
                        <Minus className="w-4 h-4" />
                      </button>

                      <span className="w-8 text-center font-black font-mono text-sm text-slate-900 dark:text-white tabular-nums">
                        {selectedQuantity}
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          soundEffects.playQuantityTick('up');
                          haptics.cartModify();
                          setSelectedQuantity(q => q + 1);
                        }}
                        className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center cursor-pointer active:scale-90"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 text-xs font-bold">
                  لم يتم العثور على خيار متطابق مع جميع التحديدات، يرجى اختيار توليفة أخرى.
                </div>
              )}
            </div>
          ) : hasVariants && activeTab === 'list' ? (
            /* 2. ALL COMBINATIONS LIST VIEW */
            <div className="space-y-2.5">
              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  value={searchFilter}
                  onChange={e => setSearchFilter(e.target.value)}
                  placeholder="ابحث بالاسم، المقاس، أو رمز SKU أو الباركود..."
                  className="w-full text-xs font-bold ps-9 pe-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-emerald-500"
                />
                <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
                {searchFilter && (
                  <button
                    type="button"
                    onClick={() => setSearchFilter('')}
                    className="absolute end-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {filteredVariants.map(v => {
                const effectivePrice = isWholesale && v.wholesalePrice && v.wholesalePrice > 0
                  ? v.wholesalePrice
                  : v.price;
                const outOfStock = v.stock <= 0;
                const qty = variantListQuantities[v.id] || 1;
                const inCartItem = cart.find(
                  it => it.productId === product.id && it.variantId === v.id
                );

                return (
                  <div
                    key={v.id}
                    className={`p-3 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      inCartItem
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-500/40'
                        : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:border-emerald-500/50'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {v.nameAr}
                        </span>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                            outOfStock
                              ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                              : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          }`}
                        >
                          {outOfStock ? 'نفد' : `${v.stock} قطعة`}
                        </span>
                        {inCartItem && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                            بالسلة ({inCartItem.quantity})
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">
                        SKU: {v.sku} {v.barcode && `· ${v.barcode}`}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      <div className="text-start sm:text-end">
                        <span className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(effectivePrice)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                        <button
                          type="button"
                          onClick={() => {
                            setVariantListQuantities(prev => ({
                              ...prev,
                              [v.id]: Math.max(1, (prev[v.id] || 1) - 1)
                            }));
                          }}
                          disabled={qty <= 1}
                          className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 active:scale-90"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-7 text-center font-black font-mono text-xs text-slate-900 dark:text-white">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setVariantListQuantities(prev => ({
                              ...prev,
                              [v.id]: (prev[v.id] || 1) + 1
                            }));
                          }}
                          className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-90"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleAddFromList(v, e)}
                        disabled={outOfStock}
                        className="px-3 py-1.5 min-h-[36px] rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1 disabled:opacity-40 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>إضافة</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* 3. SINGLE PRODUCT DETAILS VIEW (No Variants) */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      بيانات ومواصفات المنتج
                    </span>
                    <h4 className="text-base font-black text-slate-900 dark:text-white">
                      {language === 'ar' ? product.nameAr : product.nameEn}
                    </h4>
                    {product.descriptionAr && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                        {product.descriptionAr}
                      </p>
                    )}
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-xl shadow-2xs shrink-0 ${
                      isOutOfStock
                        ? 'bg-rose-600 text-white'
                        : isLowStock
                        ? 'bg-amber-500 text-white'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {isOutOfStock
                      ? 'نافذ تماماً (0)'
                      : `متوفر: ${product.stock} ${product.unit}`}
                  </span>
                </div>

                {/* Specs Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-bold">الوحدة</span>
                    <span className="font-bold text-slate-900 dark:text-white">{product.unit || 'قطعة'}</span>
                  </div>

                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-bold">سعر البيع</span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400 font-mono">
                      {formatCurrency(product.price)}
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-bold">سعر الجملة</span>
                    <span className="font-black text-amber-600 dark:text-amber-400 font-mono">
                      {formatCurrency(product.wholesalePrice || Math.round(product.price * 0.85))}
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-bold">الحد الأدنى</span>
                    <span className="font-bold text-rose-600 dark:text-rose-400 font-mono">
                      {product.minStock} {product.unit}
                    </span>
                  </div>
                </div>

                {/* Quantity Stepper Row */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                      السعر الحالي المطلوب:
                    </span>
                    <span className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(currentUnitPrice)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                    <span className="text-xs font-bold px-2 text-slate-500 dark:text-slate-400">
                      الكمية:
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        soundEffects.playQuantityTick('down');
                        haptics.cartModify();
                        setSelectedQuantity(q => Math.max(1, q - 1));
                      }}
                      disabled={selectedQuantity <= 1}
                      className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-30 flex items-center justify-center cursor-pointer active:scale-90"
                    >
                      <Minus className="w-4 h-4" />
                    </button>

                    <span className="w-8 text-center font-black font-mono text-sm text-slate-900 dark:text-white tabular-nums">
                      {selectedQuantity}
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        soundEffects.playQuantityTick('up');
                        haptics.cartModify();
                        setSelectedQuantity(q => q + 1);
                      }}
                      className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center cursor-pointer active:scale-90"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Bar: Total & Primary Add Button */}
        <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">
                المجموع الكلي ({selectedQuantity} {product.unit || 'قطعة'}):
              </span>
              <span className="text-lg sm:text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                {formatCurrency(calculatedTotal)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              إلغاء
            </button>

            <button
              type="button"
              onClick={handleAddConfiguredItemToCart}
              disabled={isOutOfStock}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-emerald-600/30 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>
                {isOutOfStock
                  ? 'الخيار نافذ من المخزون'
                  : `إضافة للسلة بـ ${formatCurrency(calculatedTotal)}`}
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
