import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import {
  AlertTriangle,
  Package,
  Plus,
  TrendingDown,
  Printer,
  RefreshCw,
  CheckCircle2,
  Boxes,
  BellRing,
  AlertOctagon,
  ArrowDownRight,
  Sparkles,
  Search,
  ShoppingCart
} from 'lucide-react';

interface LowStockAlertsCenterProps {
  onOpenAdjustModal: (product: Product, defaultType?: any) => void;
}

export const LowStockAlertsCenter: React.FC<LowStockAlertsCenterProps> = ({ onOpenAdjustModal }) => {
  const { products, adjustStock, formatCurrency, settings, notify } = useApp();

  const [alertFilter, setAlertFilter] = useState<'all' | 'out_of_stock' | 'low_stock'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPrintingSheet, setIsPrintingSheet] = useState(false);

  // Filter products at or below minStock
  const allAlertProducts = products.filter(p => p.stock <= p.minStock);
  const outOfStockProducts = allAlertProducts.filter(p => p.stock <= 0);
  const lowStockProducts = allAlertProducts.filter(p => p.stock > 0 && p.stock <= p.minStock);

  const displayedProducts = allAlertProducts.filter(p => {
    if (alertFilter === 'out_of_stock' && p.stock > 0) return false;
    if (alertFilter === 'low_stock' && p.stock <= 0) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return p.nameAr.toLowerCase().includes(q) || p.nameEn.toLowerCase().includes(q) || p.barcode.includes(q);
    }
    return true;
  });

  const handleInstantRestock = (product: Product, amount: number, label: string) => {
    adjustStock(product.id, amount, 'purchase', `توريد سريع من مركز تنبيهات النقص (${label})`);
    notify(
      'تم التوريد بنجاح',
      `تمت إضافة +${amount} ${product.unit} للمنتج (${product.nameAr}) وأصبح المخزون: ${product.stock + amount} ${product.unit}`,
      'success'
    );
  };

  const handleScanAndNotifyAll = () => {
    if (allAlertProducts.length === 0) {
      notify('المخزون مكتمل', 'جميع المنتجات فوق حد الطلب الأدنى ولا يوجد أي نقص حالياً.', 'success');
      return;
    }

    notify(
      'تنبيه مخزون تلقائي',
      `يوجد (${allAlertProducts.length}) صنف وصل إلى حد الطلب الأدنى أو نفد بالكامل. يرجى مراجعة التوريدات.`,
      'warning'
    );
  };

  const handlePrintReorderSheet = () => {
    window.print();
  };

  return (
    <div className="space-y-4 animate-in fade-in">
      {/* Top Banner Alert Info */}
      <div className="bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-amber-500/5 dark:from-amber-950/40 dark:via-rose-950/30 dark:to-slate-900 border border-amber-500/30 dark:border-amber-700/50 rounded-3xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 dark:bg-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <BellRing className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>مركز المراقبة والتنبيه التلقائي لنواقص المخزون</span>
                <span className="text-xs bg-rose-600 text-white font-mono font-bold px-2 py-0.5 rounded-full">
                  {allAlertProducts.length} تنبيه نشط
                </span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                نظام آلي يكشف المنتجات التي بلغت أو انخفضت عن حد الطلب الأدنى ({settings.currency.symbol})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleScanAndNotifyAll}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 transition-all cursor-pointer shadow-xs"
            >
              <RefreshCw className="w-4 h-4 text-amber-500" />
              <span>فحص وإرسال إشعار</span>
            </button>

            <button
              type="button"
              onClick={handlePrintReorderSheet}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black rounded-xl shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة كشف النواقص</span>
            </button>
          </div>
        </div>

        {/* Severity Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-3 border-t border-amber-500/20 dark:border-amber-800/40">
          <div
            onClick={() => setAlertFilter('all')}
            className={`p-3 rounded-2xl border transition-all cursor-pointer ${
              alertFilter === 'all'
                ? 'bg-white dark:bg-slate-800 border-amber-500 shadow-xs'
                : 'bg-white/60 dark:bg-slate-800/60 border-transparent hover:bg-white'
            }`}
          >
            <div className="text-[11px] font-bold text-slate-500">إجمالي الأصناف المنبهة</div>
            <div className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-0.5">
              {allAlertProducts.length} <span className="text-xs font-bold text-slate-400">صنف</span>
            </div>
          </div>

          <div
            onClick={() => setAlertFilter('out_of_stock')}
            className={`p-3 rounded-2xl border transition-all cursor-pointer ${
              alertFilter === 'out_of_stock'
                ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 shadow-xs'
                : 'bg-white/60 dark:bg-slate-800/60 border-transparent hover:bg-white'
            }`}
          >
            <div className="text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>أصناف نفدت بالكامل (0 مخزون)</span>
            </div>
            <div className="text-2xl font-black font-mono text-rose-600 dark:text-rose-400 mt-0.5">
              {outOfStockProducts.length} <span className="text-xs font-bold text-rose-400">صنف حرج</span>
            </div>
          </div>

          <div
            onClick={() => setAlertFilter('low_stock')}
            className={`p-3 rounded-2xl border transition-all cursor-pointer ${
              alertFilter === 'low_stock'
                ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 shadow-xs'
                : 'bg-white/60 dark:bg-slate-800/60 border-transparent hover:bg-white'
            }`}
          >
            <div className="text-[11px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>أصناف قاربت على النفاد (دون حد الطلب)</span>
            </div>
            <div className="text-2xl font-black font-mono text-amber-700 dark:text-amber-400 mt-0.5">
              {lowStockProducts.length} <span className="text-xs font-bold text-amber-500">صنف</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="البحث في قائمة النواقص بالاسم أو الباركود..."
            className="w-full pl-3 pr-9 py-2 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute start-3 top-2.5" />
        </div>
      </div>

      {/* Alerts Cards Grid */}
      {displayedProducts.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h4 className="text-base font-black text-slate-900 dark:text-white">المخزون بحالة ممتازة!</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            لا توجد أي أصناف تواجه نقصاً أو تقع تحت الحد الأدنى المحدد حالياً.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {displayedProducts.map(product => {
            const isZero = product.stock <= 0;
            const percentageOfMin = product.minStock > 0 ? Math.min(100, Math.round((product.stock / product.minStock) * 100)) : 0;
            const wholesaleMultiplier = product.wholesaleUnitMultiplier || 12;

            return (
              <div
                key={product.id}
                className={`p-4 rounded-3xl border transition-all ${
                  isZero
                    ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/60 shadow-xs'
                    : 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-300 dark:border-amber-900/60 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden shadow-2xs">
                      {product.image ? (
                        <img src={product.image} alt={product.nameAr} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        product.nameAr.charAt(0)
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-slate-900 dark:text-white">
                          {product.nameAr}
                        </h4>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${
                            isZero
                              ? 'bg-rose-600 text-white animate-pulse'
                              : 'bg-amber-500 text-white'
                          }`}
                        >
                          {isZero ? '⛔ نفاد كامل (0)' : '⚠️ دون حد الطلب'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span className="font-mono">باركود: {product.barcode}</span>
                        <span>•</span>
                        <span>سعر البيع: <strong className="font-mono text-slate-700 dark:text-slate-300">{formatCurrency(product.price)}</strong></span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stock Gauge & Progress */}
                <div className="mt-3 p-3 bg-white/90 dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-600 dark:text-slate-300">
                      المتوفر حالياً: <strong className={`font-mono text-sm ${isZero ? 'text-rose-600' : 'text-amber-600'}`}>{product.stock} {product.unit}</strong>
                    </span>
                    <span className="text-slate-400 font-bold">
                      حد الأمان (الحد الأدنى): <strong className="font-mono text-slate-800 dark:text-slate-200">{product.minStock} {product.unit}</strong>
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all rounded-full ${
                        isZero ? 'bg-rose-500 w-0' : 'bg-amber-500'
                      }`}
                      style={{ width: `${isZero ? 4 : percentageOfMin}%` }}
                    />
                  </div>
                </div>

                {/* Quick Restock Action Buttons */}
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {/* +20 Units */}
                  <button
                    type="button"
                    onClick={() => handleInstantRestock(product, 20, '+20 قطعة')}
                    className="py-2 px-1 bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-800 dark:text-slate-200 hover:text-emerald-600 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 transition-all active:scale-95 text-center flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-500" />
                    <span>توريد (+20)</span>
                  </button>

                  {/* +1 Carton */}
                  <button
                    type="button"
                    onClick={() => handleInstantRestock(product, wholesaleMultiplier, `+1 ${product.wholesaleUnit || 'كرتونة'}`)}
                    className="py-2 px-1 bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-800 dark:text-slate-200 hover:text-amber-600 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 transition-all active:scale-95 text-center flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Boxes className="w-3.5 h-3.5 text-amber-500" />
                    <span>+1 {product.wholesaleUnit || 'كرتونة'} ({wholesaleMultiplier})</span>
                  </button>

                  {/* Custom Adjust Modal */}
                  <button
                    type="button"
                    onClick={() => onOpenAdjustModal(product, 'purchase')}
                    className="py-2 px-1 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all text-center flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>سند توريد مخصص</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
