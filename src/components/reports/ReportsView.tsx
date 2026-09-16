import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  TrendingUp,
  Download,
  Printer,
  Calendar,
  DollarSign,
  Package,
  UserCheck,
  ReceiptText,
  PieChart as PieIcon,
  Sparkles
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

export const ReportsView: React.FC = () => {
  const {
    sales,
    products,
    expenses,
    formatCurrency,
    t,
    language,
    settings,
    notify
  } = useApp();

  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('month');

  // Filter sales by date range
  const filteredSales = useMemo(() => {
    const now = new Date();
    return sales.filter(s => {
      if (s.status !== 'completed') return false;
      const saleDate = new Date(s.createdAt);

      if (dateRange === 'today') {
        return saleDate.toDateString() === now.toDateString();
      }
      if (dateRange === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        return saleDate >= weekAgo;
      }
      if (dateRange === 'month') {
        const monthAgo = new Date();
        monthAgo.setDate(now.getDate() - 30);
        return saleDate >= monthAgo;
      }
      return true;
    });
  }, [sales, dateRange]);

  // Financial calculations
  const totalRevenue = filteredSales.reduce((sum, s) => sum + s.total, 0);
  const totalDiscountsGiven = filteredSales.reduce((sum, s) => sum + s.discountTotal, 0);
  const totalTaxCollected = filteredSales.reduce((sum, s) => sum + s.taxTotal, 0);
  
  // Cost of goods sold for filtered sales
  const totalCOGS = filteredSales.reduce((acc, sale) => {
    const saleCost = sale.items.reduce((itemAcc, item) => {
      const prod = products.find(p => p.id === item.productId);
      const cost = prod ? prod.costPrice : item.unitPrice * 0.7;
      return itemAcc + (cost * item.quantity);
    }, 0);
    return acc + saleCost;
  }, 0);

  const grossProfit = totalRevenue - totalCOGS;
  const periodExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = Math.round(grossProfit - periodExpenses);

  // Top products sold ranking
  const productSalesMap: { [id: string]: { nameAr: string; qty: number; total: number } } = {};
  filteredSales.forEach(s => {
    s.items.forEach(it => {
      if (!productSalesMap[it.productId]) {
        productSalesMap[it.productId] = { nameAr: it.productNameAr, qty: 0, total: 0 };
      }
      productSalesMap[it.productId].qty += it.quantity;
      productSalesMap[it.productId].total += it.total;
    });
  });

  const topProducts = Object.values(productSalesMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 6);

  // Cashier performance
  const cashierMap: { [name: string]: { name: string; invoices: number; total: number } } = {};
  filteredSales.forEach(s => {
    if (!cashierMap[s.cashierName]) {
      cashierMap[s.cashierName] = { name: s.cashierName, invoices: 0, total: 0 };
    }
    cashierMap[s.cashierName].invoices += 1;
    cashierMap[s.cashierName].total += s.total;
  });

  const cashierPerformance = Object.values(cashierMap);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['رقم الفاتورة,التاريخ,العميل,الكاشير,طريقة الدفع,المجموع الفرعي,الخصم,الضريبة,الإجمالي\n'];
    const rows = filteredSales.map(s =>
      `"${s.invoiceNumber}","${s.createdAt}","${s.customerName || 'نقدي'}","${s.cashierName}","${s.paymentMethod}",${s.subtotal},${s.discountTotal},${s.taxTotal},${s.total}`
    );
    const blob = new Blob([headers.concat(rows).join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `sales-report-${dateRange}-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify('تم بنجاح', 'تم تصدير تقرير المبيعات بنجاح إلى ملف CSV', 'success');
  };

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6 bg-slate-50/50 dark:bg-slate-950">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>{t('reportsTitle')}</span>
            <span className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold px-2 py-0.5 rounded-full">
              التحليلات والأرباح
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            قوائم الدخل، تقارير حركة المبيعات، ومؤشرات الأداء المالي
          </p>
        </div>

        {/* Date Filter & Export */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 flex gap-1 text-xs">
            <button
              onClick={() => setDateRange('today')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                dateRange === 'today' ? 'bg-amber-500 text-white' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              اليوم
            </button>
            <button
              onClick={() => setDateRange('week')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                dateRange === 'week' ? 'bg-amber-500 text-white' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              آخر 7 أيام
            </button>
            <button
              onClick={() => setDateRange('month')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                dateRange === 'month' ? 'bg-amber-500 text-white' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              آخر 30 يوم
            </button>
            <button
              onClick={() => setDateRange('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                dateRange === 'all' ? 'bg-amber-500 text-white' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              الكل
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
          >
            <Download className="w-4 h-4" />
            <span>تصدير Excel/CSV</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة</span>
          </button>
        </div>
      </div>

      {/* Financial Statement P&L Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Revenue */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-400">إجمالي المبيعات (Revenue)</span>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
            {formatCurrency(totalRevenue)}
          </h3>
          <p className="text-[11px] text-slate-400 font-semibold">{filteredSales.length} فاتورة مدفوعة</p>
        </div>

        {/* COGS */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-400">تكلفة البضاعة المباعة (COGS)</span>
          <h3 className="text-xl sm:text-2xl font-black text-slate-700 dark:text-slate-300 font-mono">
            {formatCurrency(totalCOGS)}
          </h3>
          <p className="text-[11px] text-slate-400 font-semibold">بناءً على تكلفة الشراء المسجلة</p>
        </div>

        {/* Total Expenses */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-400">المصاريف التشغيلية (Expenses)</span>
          <h3 className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
            {formatCurrency(periodExpenses)}
          </h3>
          <p className="text-[11px] text-slate-400 font-semibold">إيجار، رواتب، كهرباء، ونثريات</p>
        </div>

        {/* Net Profit */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20 shadow-xs space-y-1">
          <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400">صافي الربح الحقيقي (Net Profit)</span>
          <h3 className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {formatCurrency(netProfit)}
          </h3>
          <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 font-bold">
            هامش الربح: {totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0}%
          </p>
        </div>
      </div>

      {/* Top Products and Cashier Performance Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top Selling Products */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="w-4 h-4 text-amber-500" />
            <span>المنتجات الأكثر مبيعاً في الفترة المحددة</span>
          </h3>

          <div className="space-y-2">
            {topProducts.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">لا توجد مبيعات مسجلة في هذه الفترة</p>
            ) : (
              topProducts.map((prod, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-amber-500 text-white font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{prod.nameAr}</span>
                  </div>
                  <div className="text-end">
                    <span className="text-xs font-bold font-mono text-slate-900 dark:text-white block">
                      {formatCurrency(prod.total)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">{prod.qty} قطعة مباعة</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Cashier Performance */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-amber-500" />
            <span>أداء الكاشيرات وموظفي نقطة البيع</span>
          </h3>

          <div className="space-y-2">
            {cashierPerformance.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">لا يوجد نشاط موظفين في هذه الفترة</p>
            ) : (
              cashierPerformance.map((c, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between"
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{c.name}</h4>
                    <span className="text-[10px] text-slate-400 font-semibold">{c.invoices} فاتورة صادرة</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                    {formatCurrency(c.total)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
