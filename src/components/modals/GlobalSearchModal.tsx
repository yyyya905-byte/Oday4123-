import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Search, Package, FileSpreadsheet, Users, ArrowRight, X, Sparkles } from 'lucide-react';

export const GlobalSearchModal: React.FC = () => {
  const {
    isGlobalSearchOpen,
    setIsGlobalSearchOpen,
    products,
    customers,
    sales,
    addToCart,
    setActiveTab,
    formatCurrency,
    t,
    language
  } = useApp();

  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
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

  const clean = query.trim().toLowerCase();

  const filteredProducts = clean
    ? products.filter(
        p =>
          p.nameAr.toLowerCase().includes(clean) ||
          p.nameEn.toLowerCase().includes(clean) ||
          p.barcode.includes(clean) ||
          p.sku.toLowerCase().includes(clean) ||
          p.identificationCodes?.some(c => c.toLowerCase().includes(clean))
      ).slice(0, 6)
    : [];

  const filteredCustomers = clean
    ? customers.filter(
        c =>
          c.name.toLowerCase().includes(clean) ||
          c.phone.includes(clean) ||
          c.customerCode.toLowerCase().includes(clean)
      ).slice(0, 4)
    : [];

  const filteredSales = clean
    ? sales.filter(
        s =>
          s.invoiceNumber.toLowerCase().includes(clean) ||
          (s.customerName && s.customerName.toLowerCase().includes(clean))
      ).slice(0, 4)
    : [];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center p-4 pt-16 sm:pt-24 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Search Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-amber-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="ابحث عن منتج، باركود، عميل، أو رقم فاتورة..."
            className="w-full bg-transparent text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
          />
          <button
            onClick={() => setIsGlobalSearchOpen(false)}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-96 overflow-y-auto p-4 space-y-4">
          {!clean && (
            <div className="text-center py-8 text-slate-400 text-xs">
              <Sparkles className="w-8 h-8 text-amber-500/50 mx-auto mb-2" />
              <p>اكتب اسم المنتج، الباركود، رقم هاتف العميل، أو رقم الفاتورة للبحث المباشر</p>
            </div>
          )}

          {/* Products results */}
          {filteredProducts.length > 0 && (
            <div>
              <h4 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5" />
                المنتجات
              </h4>
              <div className="space-y-1.5">
                {filteredProducts.map(p => (
                  <div
                    key={p.id}
                    onClick={() => {
                      addToCart(p);
                      setActiveTab('pos');
                      setIsGlobalSearchOpen(false);
                    }}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-slate-200/80 dark:border-slate-700/80 cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                        {p.image ? (
                          <img src={p.image} alt={p.nameAr} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          p.nameAr.charAt(0)
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          {language === 'ar' ? p.nameAr : p.nameEn}
                        </p>
                        <span className="text-[10px] font-mono text-slate-400">
                          {p.barcode} • المخزون: {p.stock} {p.unit}
                        </span>
                      </div>
                    </div>
                    <div className="text-end">
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400 block">
                        {formatCurrency(p.price)}
                      </span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        + إضافة للسلة
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Customers results */}
          {filteredCustomers.length > 0 && (
            <div>
              <h4 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                العملاء والأعضاء
              </h4>
              <div className="space-y-1.5">
                {filteredCustomers.map(c => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setActiveTab('customers');
                      setIsGlobalSearchOpen(false);
                    }}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 cursor-pointer transition-all"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{c.name}</span>
                        <span className="text-[10px] font-mono bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 px-1.5 py-0.2 rounded-md">
                          {c.customerCode}
                        </span>
                      </p>
                      <span className="text-[10px] text-slate-400">{c.phone}</span>
                    </div>
                    <div className="text-end text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span>{c.points} نقطة</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Invoices results */}
          {filteredSales.length > 0 && (
            <div>
              <h4 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                الفواتير
              </h4>
              <div className="space-y-1.5">
                {filteredSales.map(s => (
                  <div
                    key={s.id}
                    onClick={() => {
                      setActiveTab('invoices');
                      setIsGlobalSearchOpen(false);
                    }}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 cursor-pointer transition-all"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                        {s.invoiceNumber}
                      </p>
                      <span className="text-[10px] text-slate-400">
                        {s.customerName || 'عميل نقدي'} • {new Date(s.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                      {formatCurrency(s.total)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {clean && filteredProducts.length === 0 && filteredCustomers.length === 0 && filteredSales.length === 0 && (
            <div className="text-center py-6 text-slate-400 text-xs">
              لم يتم العثور على نتائج مطابقة لـ "{query}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
