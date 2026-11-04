import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Search,
  Package,
  FileSpreadsheet,
  Users,
  ArrowRight,
  X,
  Sparkles,
  Barcode,
  TrendingUp,
  Tag,
  CreditCard,
  ShoppingBag
} from 'lucide-react';
import { matchesProductSearch, matchesCustomerSearch, matchesSaleSearch } from '../../utils/arabicSearch';
import { soundEffects } from '../../services/audio';

export const GlobalSearchModal: React.FC = () => {
  const {
    isGlobalSearchOpen,
    setIsGlobalSearchOpen,
    products,
    categories,
    customers,
    sales,
    addToCart,
    setActiveTab,
    formatCurrency,
    language
  } = useApp();

  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        soundEffects.playClick();
        setIsGlobalSearchOpen(true);
      }
      if (e.key === 'Escape' && isGlobalSearchOpen) {
        setIsGlobalSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGlobalSearchOpen, setIsGlobalSearchOpen]);

  useEffect(() => {
    if (isGlobalSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isGlobalSearchOpen]);

  if (!isGlobalSearchOpen) return null;

  const clean = query.trim();

  // Search products with Arabic normalization & multi-token
  const filteredProducts = clean
    ? products
        .filter(p => {
          const cat = categories.find(c => c.id === p.categoryId);
          return matchesProductSearch(p, clean, cat?.nameAr);
        })
        .slice(0, 8)
    : [];

  // Search customers with Arabic normalization
  const filteredCustomers = clean
    ? customers
        .filter(c => matchesCustomerSearch(c, clean))
        .slice(0, 5)
    : [];

  // Search invoices
  const filteredSales = clean
    ? sales
        .filter(s => matchesSaleSearch(s, clean))
        .slice(0, 5)
    : [];

  const handleSelectProduct = (product: typeof products[0]) => {
    soundEffects.playSuccess();
    addToCart(product);
    setActiveTab('pos');
    setIsGlobalSearchOpen(false);
  };

  const handleSelectCustomer = () => {
    soundEffects.playClick();
    setActiveTab('customers');
    setIsGlobalSearchOpen(false);
  };

  const handleSelectInvoice = () => {
    soundEffects.playClick();
    setActiveTab('invoices');
    setIsGlobalSearchOpen(false);
  };

  const QUICK_SEARCH_CHIPS = ['كابتشينو', 'لاتيه', 'برغر', 'طازج', 'عميل', 'فاتورة'];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="البحث الشامل في النظام"
      className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-md flex items-start justify-center p-3 sm:p-4 pt-12 sm:pt-20 animate-in fade-in duration-150"
      onClick={() => setIsGlobalSearchOpen(false)}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center gap-3 bg-slate-50/60 dark:bg-slate-800/40">
          <Search className="w-5 h-5 text-amber-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="ابحث عن منتج، باركود، عميل، أو رقم فاتورة..."
            className="w-full bg-transparent text-sm sm:text-base font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                soundEffects.playClick();
                setQuery('');
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
            >
              ✕
            </button>
          )}
          <span className="hidden sm:inline-block text-[10px] font-mono text-slate-400 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded-md">
            ESC
          </span>
          <button
            type="button"
            onClick={() => setIsGlobalSearchOpen(false)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Search Chips */}
        {!clean && (
          <div className="px-4 py-2.5 bg-slate-100/50 dark:bg-slate-800/20 border-b border-slate-200/60 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
            <span className="text-[11px] font-bold text-slate-400 shrink-0">اقتراحات سريعة:</span>
            {QUICK_SEARCH_CHIPS.map(chip => (
              <button
                key={chip}
                type="button"
                onClick={() => {
                  soundEffects.playClick();
                  setQuery(chip);
                }}
                className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-bold hover:border-amber-500 hover:text-amber-600 shrink-0 transition-all cursor-pointer"
              >
                {chip}
              </button>
            ))}
          </div>
        )}

        {/* Results Container */}
        <div className="overflow-y-auto p-4 space-y-4 flex-1">
          {!clean && (
            <div className="text-center py-10 text-slate-400 text-xs space-y-2">
              <Sparkles className="w-10 h-10 text-amber-500/40 mx-auto" />
              <p className="font-bold text-slate-600 dark:text-slate-300">
                البحث الذكي الموحد في كيان كاشير
              </p>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                يدعم توحيد الهمزات والألف والتاء المربوطة، والبحث برقم الباركود أو اسم العميل أو رقم الفاتورة.
              </p>
            </div>
          )}

          {/* Products results */}
          {filteredProducts.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-amber-500" />
                  <span>المنتجات المطابقة ({filteredProducts.length})</span>
                </h4>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                  انقر للإضافة مباشرة لسلة الكاشير
                </span>
              </div>

              <div className="space-y-1.5">
                {filteredProducts.map(p => {
                  const cat = categories.find(c => c.id === p.categoryId);
                  return (
                    <div
                      key={p.id}
                      onClick={() => handleSelectProduct(p)}
                      className="group flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-slate-200/80 dark:border-slate-700/80 cursor-pointer transition-all active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                          {p.image ? (
                            <img src={p.image} alt={p.nameAr} className="w-full h-full object-cover group-hover:scale-105 transition-transform" referrerPolicy="no-referrer" />
                          ) : (
                            p.nameAr.charAt(0)
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                            {language === 'ar' ? p.nameAr : p.nameEn}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                            {cat && <span className="font-sans text-slate-500">{cat.nameAr} ·</span>}
                            <span>{p.barcode || p.sku}</span>
                            <span>· المخزون: {p.stock} {p.unit}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-end shrink-0 ms-2">
                        <span className="text-xs sm:text-sm font-black font-mono text-emerald-600 dark:text-emerald-400 block">
                          {formatCurrency(p.price)}
                        </span>
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-0.5 justify-end group-hover:underline">
                          <ShoppingBag className="w-3 h-3" />
                          <span>+ سلة البيع</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Customers results */}
          {filteredCustomers.length > 0 && (
            <div>
              <h4 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-500" />
                <span>العملاء ({filteredCustomers.length})</span>
              </h4>
              <div className="space-y-1.5">
                {filteredCustomers.map(c => {
                  const debt = c.currentDebt || c.debtBalance || 0;
                  return (
                    <div
                      key={c.id}
                      onClick={handleSelectCustomer}
                      className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 cursor-pointer transition-all"
                    >
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 truncate">
                          <span>{c.name}</span>
                          <span className="text-[10px] font-mono bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-400 px-1.5 py-0.2 rounded-md">
                            {c.customerCode}
                          </span>
                        </p>
                        <span className="text-[10px] text-slate-400 font-mono">{c.phone}</span>
                      </div>
                      <div className="text-end shrink-0 ms-2">
                        {debt > 0 ? (
                          <span className="text-xs font-black font-mono text-rose-600 dark:text-rose-400 block">
                            دين: {formatCurrency(debt)}
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-emerald-600 block">
                            خالص
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 font-mono">
                          {c.points} نقطة
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Invoices results */}
          {filteredSales.length > 0 && (
            <div>
              <h4 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                <span>الفواتير والمبيعات ({filteredSales.length})</span>
              </h4>
              <div className="space-y-1.5">
                {filteredSales.map(s => (
                  <div
                    key={s.id}
                    onClick={handleSelectInvoice}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 cursor-pointer transition-all"
                  >
                    <div>
                      <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white font-mono">
                        #{s.invoiceNumber}
                      </p>
                      <span className="text-[10px] text-slate-400">
                        {s.customerName || 'عميل نقدي'} · {new Date(s.createdAt).toLocaleDateString('ar-SY')}
                      </span>
                    </div>
                    <span className="text-xs sm:text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(s.total)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {clean && filteredProducts.length === 0 && filteredCustomers.length === 0 && filteredSales.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-xs">
              لم يتم العثور على نتائج مطابقة لـ "{query}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
