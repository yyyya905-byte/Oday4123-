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
  BarChart3,
  Clock,
  Wallet,
  ArrowUpRight,
  Sparkles,
  Layers
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
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

const PAYMENT_COLORS: { [key: string]: string } = {
  cash: '#10b981', // Emerald
  card: '#3b82f6', // Blue
  credit: '#f59e0b', // Amber
  transfer: '#8b5cf6', // Purple
  other: '#64748b' // Slate
};

const PAYMENT_LABELS: { [key: string]: string } = {
  cash: 'نقدي (كاش)',
  card: 'بطاقة بنكية / مدى',
  credit: 'آجل / ذمم',
  transfer: 'تحويل بنكي / إلكتروني',
  other: 'أخرى'
};

const CustomChartTooltip = ({ active, payload, label, formatCurrency }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-md text-white text-xs p-3 rounded-2xl border border-slate-700 shadow-xl space-y-1.5 min-w-[150px] z-50">
        <p className="font-bold text-slate-300 border-b border-slate-700/80 pb-1 text-center font-sans">
          {label}
        </p>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-3 text-[11px]">
            <span className="flex items-center gap-1.5 font-bold" style={{ color: entry.color || entry.stroke || entry.fill }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.stroke || entry.fill }} />
              {entry.name}:
            </span>
            <span className="font-mono font-black text-white">
              {typeof entry.value === 'number' && entry.name !== 'الكمية' && entry.name !== 'عدد الفواتير' && entry.name !== 'الفواتير'
                ? formatCurrency(entry.value)
                : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

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
  const [activeChartTab, setActiveChartTab] = useState<'all' | 'timeline' | 'hours' | 'payments' | 'products'>('all');

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
  const averageInvoiceValue = filteredSales.length > 0 ? Math.round(totalRevenue / filteredSales.length) : 0;
  const profitMarginPercent = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0';

  // 1. Timeline Chart Data: Sales & Profit by day or hour
  const timelineChartData = useMemo(() => {
    if (dateRange === 'today') {
      // Group by 2-hour slots for today
      const slots: { [key: string]: { date: string; sales: number; profit: number; invoices: number } } = {};
      const hours = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];
      hours.forEach(h => {
        slots[h] = { date: h, sales: 0, profit: 0, invoices: 0 };
      });

      filteredSales.forEach(s => {
        const hour = new Date(s.createdAt).getHours();
        let slot = '08:00';
        if (hour >= 22) slot = '22:00';
        else if (hour >= 20) slot = '20:00';
        else if (hour >= 18) slot = '18:00';
        else if (hour >= 16) slot = '16:00';
        else if (hour >= 14) slot = '14:00';
        else if (hour >= 12) slot = '12:00';
        else if (hour >= 10) slot = '10:00';

        if (slots[slot]) {
          slots[slot].sales += s.total;
          const cost = s.items.reduce((acc, it) => {
            const p = products.find(prod => prod.id === it.productId);
            return acc + (p ? p.costPrice * it.quantity : it.unitPrice * 0.7 * it.quantity);
          }, 0);
          slots[slot].profit += (s.total - cost);
          slots[slot].invoices += 1;
        }
      });

      return Object.values(slots);
    }

    // Group by Date for week/month/all
    const map: { [dateStr: string]: { date: string; sales: number; profit: number; invoices: number } } = {};
    
    // Pre-populate last 7 days if week
    if (dateRange === 'week') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        const dayLabel = d.toLocaleDateString('ar-SY', { weekday: 'short', month: 'numeric', day: 'numeric' });
        map[key] = { date: dayLabel, sales: 0, profit: 0, invoices: 0 };
      }
    }

    filteredSales.forEach(s => {
      const d = new Date(s.createdAt);
      const key = d.toISOString().slice(0, 10);
      const dayLabel = d.toLocaleDateString('ar-SY', { month: 'short', day: 'numeric' });

      if (!map[key]) {
        map[key] = { date: dayLabel, sales: 0, profit: 0, invoices: 0 };
      }

      map[key].sales += s.total;
      const cost = s.items.reduce((acc, it) => {
        const p = products.find(prod => prod.id === it.productId);
        return acc + (p ? p.costPrice * it.quantity : it.unitPrice * 0.7 * it.quantity);
      }, 0);
      map[key].profit += (s.total - cost);
      map[key].invoices += 1;
    });

    const list = Object.entries(map)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(entry => entry[1]);

    if (list.length === 0) {
      return [
        { date: 'اليوم', sales: 0, profit: 0, invoices: 0 }
      ];
    }

    return list;
  }, [filteredSales, dateRange, products]);

  // 2. Payment Methods Distribution Data
  const paymentMethodsChartData = useMemo(() => {
    const counts: { [method: string]: { value: number; count: number } } = {
      cash: { value: 0, count: 0 },
      card: { value: 0, count: 0 },
      credit: { value: 0, count: 0 },
      transfer: { value: 0, count: 0 }
    };

    filteredSales.forEach(s => {
      const method = s.paymentMethod || 'cash';
      if (!counts[method]) {
        counts[method] = { value: 0, count: 0 };
      }
      counts[method].value += s.total;
      counts[method].count += 1;
    });

    return Object.entries(counts)
      .filter(([_, data]) => data.value > 0 || data.count > 0)
      .map(([method, data]) => ({
        name: PAYMENT_LABELS[method] || method,
        value: Math.round(data.value),
        count: data.count,
        color: PAYMENT_COLORS[method] || '#64748b'
      }));
  }, [filteredSales]);

  // 3. Hourly Activity / Peak Rush Hours Data
  const hourlyActivityData = useMemo(() => {
    const buckets: { [label: string]: { hour: string; sales: number; invoices: number } } = {
      '08-10': { hour: '08:00 - 10:00 ص', sales: 0, invoices: 0 },
      '10-12': { hour: '10:00 - 12:00 م', sales: 0, invoices: 0 },
      '12-14': { hour: '12:00 - 02:00 م', sales: 0, invoices: 0 },
      '14-16': { hour: '02:00 - 04:00 م', sales: 0, invoices: 0 },
      '16-18': { hour: '04:00 - 06:00 م', sales: 0, invoices: 0 },
      '18-20': { hour: '06:00 - 08:00 م', sales: 0, invoices: 0 },
      '20-22': { hour: '08:00 - 10:00 م', sales: 0, invoices: 0 },
      '22-24': { hour: '10:00 - 12:00 ل', sales: 0, invoices: 0 }
    };

    filteredSales.forEach(s => {
      const h = new Date(s.createdAt).getHours();
      let key = '08-10';
      if (h >= 22) key = '22-24';
      else if (h >= 20) key = '20-22';
      else if (h >= 18) key = '18-20';
      else if (h >= 16) key = '16-18';
      else if (h >= 14) key = '14-16';
      else if (h >= 12) key = '12-14';
      else if (h >= 10) key = '10-12';

      if (buckets[key]) {
        buckets[key].sales += s.total;
        buckets[key].invoices += 1;
      }
    });

    return Object.values(buckets);
  }, [filteredSales]);

  // 4. Top products sold ranking & Chart Data
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

  const topProductsChartData = topProducts.map(p => ({
    name: p.nameAr.length > 18 ? p.nameAr.slice(0, 16) + '...' : p.nameAr,
    fullName: p.nameAr,
    المبيعات: Math.round(p.total),
    الكمية: p.qty
  }));

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
              الرسوم البيانية والتحليلات
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            رسوم بيانية تفاعلية لحركة المبيعات، صافي الأرباح، ساعات الذروة، وطرق الدفع
          </p>
        </div>

        {/* Date Filter & Export */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 flex gap-1 text-xs">
            <button
              onClick={() => setDateRange('today')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                dateRange === 'today' ? 'bg-amber-500 text-white' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              اليوم
            </button>
            <button
              onClick={() => setDateRange('week')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                dateRange === 'week' ? 'bg-amber-500 text-white' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              آخر 7 أيام
            </button>
            <button
              onClick={() => setDateRange('month')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                dateRange === 'month' ? 'bg-amber-500 text-white' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              آخر 30 يوم
            </button>
            <button
              onClick={() => setDateRange('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                dateRange === 'all' ? 'bg-amber-500 text-white' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              الكل
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>تصدير Excel/CSV</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة</span>
          </button>
        </div>
      </div>

      {/* Financial Statement P&L Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Gross Revenue */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-400 flex items-center justify-between">
            <span>إجمالي المبيعات</span>
            <DollarSign className="w-4 h-4 text-amber-500" />
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
            {formatCurrency(totalRevenue)}
          </h3>
          <p className="text-[11px] text-slate-400 font-semibold">{filteredSales.length} فاتورة مسجلة</p>
        </div>

        {/* COGS */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-400 flex items-center justify-between">
            <span>تكلفة البضاعة (COGS)</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-slate-700 dark:text-slate-300 font-mono">
            {formatCurrency(totalCOGS)}
          </h3>
          <p className="text-[11px] text-slate-400 font-semibold">بناءً على تكلفة الشراء</p>
        </div>

        {/* Total Expenses */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-400 flex items-center justify-between">
            <span>المصاريف التشغيلية</span>
            <TrendingUp className="w-4 h-4 text-rose-500 rotate-180" />
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
            {formatCurrency(periodExpenses)}
          </h3>
          <p className="text-[11px] text-slate-400 font-semibold">إيجار، رواتب، ونثريات</p>
        </div>

        {/* Net Profit */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20 shadow-xs space-y-1">
          <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 flex items-center justify-between">
            <span>صافي الربح الحقيقي</span>
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {formatCurrency(netProfit)}
          </h3>
          <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 font-bold">
            هامش الربح: {profitMarginPercent}%
          </p>
        </div>

        {/* Average Basket Size */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-400 flex items-center justify-between">
            <span>متوسط الفاتورة</span>
            <ReceiptText className="w-4 h-4 text-sky-500" />
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-sky-600 dark:text-sky-400 font-mono">
            {formatCurrency(averageInvoiceValue)}
          </h3>
          <p className="text-[11px] text-slate-400 font-semibold">قيمة مشتريات العميل الواحد</p>
        </div>
      </div>

      {/* Interactive Charts Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveChartTab('all')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeChartTab === 'all'
              ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>كل الرسوم البيانية</span>
        </button>
        <button
          onClick={() => setActiveChartTab('timeline')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeChartTab === 'timeline'
              ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>منحنى المبيعات والأرباح</span>
        </button>
        <button
          onClick={() => setActiveChartTab('hours')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeChartTab === 'hours'
              ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>أوقات الذروة والازدحام</span>
        </button>
        <button
          onClick={() => setActiveChartTab('payments')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeChartTab === 'payments'
              ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <Wallet className="w-3.5 h-3.5" />
          <span>طرق الدفع والتوزيع</span>
        </button>
        <button
          onClick={() => setActiveChartTab('products')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeChartTab === 'products'
              ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>الأصناف الأكثر مبيعاً</span>
        </button>
      </div>

      {/* Charts Section */}
      <div className="space-y-6">
        {/* Chart 1: Sales & Net Profit Timeline (Area Chart) */}
        {(activeChartTab === 'all' || activeChartTab === 'timeline') && (
          <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-amber-500" />
                  <span>رسم بياني: تطور المبيعات وصافي الأرباح</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  تتبع حركة الإيرادات مقابل الأرباح اليومية عبر الزمن
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
                  <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                  <span>المبيعات</span>
                </div>
                <div className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                  <span>صافي الربح</span>
                </div>
              </div>
            </div>

            <div className="h-[280px] sm:h-[320px] w-full pt-2" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                  <XAxis
                    dataKey="date"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                  />
                  <Tooltip
                    content={<CustomChartTooltip formatCurrency={formatCurrency} />}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    name="المبيعات"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorSales)"
                  />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    name="صافي الربح"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorProfit)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Two-Column Grid: Peak Hours & Payment Methods */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Chart 2: Hourly Activity & Peak Rush Hours */}
          {(activeChartTab === 'all' || activeChartTab === 'hours') && (
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-sky-500" />
                    <span>رسم بياني: أوقات الذروة وازدحام المتجر</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    توزيع حجم المبيعات وعدد الفواتير بحسب ساعات العمل
                  </p>
                </div>
              </div>

              <div className="h-[250px] w-full pt-2" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourlyActivityData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                    <XAxis
                      dataKey="hour"
                      stroke="#94a3b8"
                      fontSize={10}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                    />
                    <Tooltip
                      content={<CustomChartTooltip formatCurrency={formatCurrency} />}
                    />
                    <Bar
                      dataKey="sales"
                      name="المبيعات"
                      fill="#0284c7"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Chart 3: Payment Methods Donut / Pie Chart */}
          {(activeChartTab === 'all' || activeChartTab === 'payments') && (
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <PieIcon className="w-4 h-4 text-emerald-500" />
                  <span>رسم بياني: توزيع طرق الدفع والتحصيل</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  نسبة السيولة النقدية مقارنة بالبطاقات البنكية والذمم
                </p>
              </div>

              <div className="h-[250px] w-full flex items-center justify-center pt-2" dir="ltr">
                {paymentMethodsChartData.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-10">لا توجد عمليات دفع مسجلة</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentMethodsChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {paymentMethodsChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={<CustomChartTooltip formatCurrency={formatCurrency} />}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value, entry: any) => (
                          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 font-sans mx-1">
                            {value}
                          </span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Chart 4: Top Selling Products Bar Chart */}
        {(activeChartTab === 'all' || activeChartTab === 'products') && (
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-purple-500" />
                  <span>رسم بياني: مقارنة مبيعات الأصناف الأكثر طلباً</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  مقارنة مالية للأصناف المتصدرة في المتجر
                </p>
              </div>
            </div>

            <div className="h-[260px] w-full pt-2" dir="ltr">
              {topProductsChartData.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-10">لا توجد أصناف مباعة في الفترة المحددة</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProductsChartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                    <XAxis
                      dataKey="name"
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                    />
                    <Tooltip
                      content={<CustomChartTooltip formatCurrency={formatCurrency} />}
                    />
                    <Bar
                      dataKey="المبيعات"
                      name="المبيعات"
                      fill="#8b5cf6"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Top Products and Cashier Performance Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2">
        {/* Top Selling Products List */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="w-4 h-4 text-amber-500" />
            <span>قائمة المنتجات الأكثر مبيعاً في الفترة المحددة</span>
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
                    <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center">
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
