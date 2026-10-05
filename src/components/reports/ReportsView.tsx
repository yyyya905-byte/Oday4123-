import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  TrendingUp,
  Download,
  Printer,
  DollarSign,
  Package,
  UserCheck,
  ReceiptText,
  PieChart as PieIcon,
  BarChart3,
  Clock,
  Wallet,
  Layers,
  Activity,
  Percent
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
  ComposedChart,
  PieChart,
  Pie,
  Cell,
  Legend,
  ReferenceLine
} from 'recharts';

const PAYMENT_COLORS: { [key: string]: string } = {
  cash: '#10b981', // Emerald
  card: '#3b82f6', // Blue
  credit: '#f59e0b', // Amber
  transfer: '#8b5cf6', // Purple
  other: '#64748b' // Slate
};

const PRODUCT_PIE_COLORS = [
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
];

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
      <div className="bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-xl text-white text-xs p-3.5 rounded-2xl border border-white/10 shadow-2xl space-y-1.5 min-w-[175px] z-50">
        {label && (
          <p className="font-bold text-slate-300 border-b border-slate-700/80 pb-1.5 text-center font-sans">
            {label}
          </p>
        )}
        {payload.map((entry: any, index: number) => {
          const isCountMetric =
            entry.name === 'الكمية المباعة' ||
            entry.name === 'الكمية' ||
            entry.name === 'عدد الفواتير' ||
            entry.name === 'الفواتير';
          const isPercentMetric = entry.name === 'هامش الربح %' || entry.dataKey === 'margin';

          return (
            <div key={`item-${index}`} className="flex items-center justify-between gap-3 text-[11px]">
              <span
                className="flex items-center gap-1.5 font-bold"
                style={{ color: entry.color || entry.stroke || entry.fill || '#f59e0b' }}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: entry.color || entry.stroke || entry.fill || '#f59e0b' }}
                />
                {entry.name}:
              </span>
              <span className="font-mono tabular-nums font-black text-white">
                {isPercentMetric
                  ? `${entry.value}%`
                  : typeof entry.value === 'number' && !isCountMetric
                  ? formatCurrency(entry.value)
                  : entry.value}
              </span>
            </div>
          );
        })}
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
    notify
  } = useApp();

  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('month');
  const [activeChartTab, setActiveChartTab] = useState<
    'all' | 'daily_sales' | 'products_dist' | 'profit_evolution' | 'hours_payments'
  >('all');

  // Interactive sub-toggles for individual charts
  const [dailySalesChartStyle, setDailySalesChartStyle] = useState<'area' | 'bar' | 'composed'>('area');
  const [productSortMetric, setProductSortMetric] = useState<'revenue' | 'quantity'>('revenue');
  const [profitChartMode, setProfitChartMode] = useState<'profit_vs_cost' | 'profit_margin'>('profit_vs_cost');

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
      const cost = prod ? prod.costPrice : item.costPrice || item.unitPrice * 0.65;
      return itemAcc + cost * item.quantity;
    }, 0);
    return acc + saleCost;
  }, 0);

  const grossProfit = Math.max(0, totalRevenue - totalCOGS);
  const periodExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = Math.round(grossProfit - periodExpenses);
  const averageInvoiceValue = filteredSales.length > 0 ? Math.round(totalRevenue / filteredSales.length) : 0;
  const profitMarginPercent = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : '0.0';

  // 1. Daily Sales & Profit Evolution Timeline Data
  const timelineChartData = useMemo(() => {
    if (dateRange === 'today') {
      const slots: {
        [key: string]: {
          date: string;
          sales: number;
          cost: number;
          grossProfit: number;
          netProfit: number;
          margin: number;
          invoices: number;
        };
      } = {};
      const hours = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];
      hours.forEach(h => {
        slots[h] = { date: h, sales: 0, cost: 0, grossProfit: 0, netProfit: 0, margin: 0, invoices: 0 };
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
            return acc + (p ? p.costPrice * it.quantity : (it.costPrice || it.unitPrice * 0.65) * it.quantity);
          }, 0);
          slots[slot].cost += Math.round(cost);
          const gp = Math.max(0, Math.round(s.total - cost));
          slots[slot].grossProfit += gp;
          slots[slot].netProfit += gp;
          slots[slot].invoices += 1;
        }
      });

      return Object.values(slots).map(item => ({
        ...item,
        margin: item.sales > 0 ? Number(((item.grossProfit / item.sales) * 100).toFixed(1)) : 0
      }));
    }

    // Group by Date for week/month/all
    const map: {
      [dateStr: string]: {
        date: string;
        sales: number;
        cost: number;
        grossProfit: number;
        netProfit: number;
        margin: number;
        invoices: number;
      };
    } = {};

    const daysCount = dateRange === 'week' ? 7 : 7;
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const dayLabel = d.toLocaleDateString('ar-SY', { weekday: 'short', month: 'numeric', day: 'numeric' });
      map[key] = { date: dayLabel, sales: 0, cost: 0, grossProfit: 0, netProfit: 0, margin: 0, invoices: 0 };
    }

    filteredSales.forEach(s => {
      const d = new Date(s.createdAt);
      const key = d.toISOString().slice(0, 10);
      const dayLabel = d.toLocaleDateString('ar-SY', { weekday: 'short', month: 'numeric', day: 'numeric' });

      if (!map[key]) {
        map[key] = { date: dayLabel, sales: 0, cost: 0, grossProfit: 0, netProfit: 0, margin: 0, invoices: 0 };
      }

      map[key].sales += s.total;
      const cost = s.items.reduce((acc, it) => {
        const p = products.find(prod => prod.id === it.productId);
        return acc + (p ? p.costPrice * it.quantity : (it.costPrice || it.unitPrice * 0.65) * it.quantity);
      }, 0);
      map[key].cost += Math.round(cost);
      const gp = Math.max(0, Math.round(s.total - cost));
      map[key].grossProfit += gp;
      map[key].netProfit += gp;
      map[key].invoices += 1;
    });

    const dailyExpenseEstimate = Math.round(periodExpenses / Math.max(1, Object.keys(map).length));

    const list = Object.entries(map)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([, val]) => {
        const net = val.sales > 0 ? Math.max(0, val.grossProfit - dailyExpenseEstimate) : 0;
        const margin = val.sales > 0 ? Number(((val.grossProfit / val.sales) * 100).toFixed(1)) : 0;
        return {
          ...val,
          netProfit: net,
          margin
        };
      });

    return list;
  }, [filteredSales, dateRange, products, periodExpenses]);

  const averageDailySales = useMemo(() => {
    const activeDays = timelineChartData.filter(d => d.sales > 0);
    if (activeDays.length === 0) return 0;
    const sum = activeDays.reduce((acc, d) => acc + d.sales, 0);
    return Math.round(sum / activeDays.length);
  }, [timelineChartData]);

  // 2. Top Selling Products Distribution (Pie + Bar Data)
  const { topProducts, topProductsChartData, topProductsPieData } = useMemo(() => {
    const productSalesMap: {
      [id: string]: { id: string; nameAr: string; qty: number; total: number; profit: number };
    } = {};

    filteredSales.forEach(s => {
      s.items.forEach(it => {
        if (!productSalesMap[it.productId]) {
          productSalesMap[it.productId] = {
            id: it.productId,
            nameAr: it.productNameAr,
            qty: 0,
            total: 0,
            profit: 0
          };
        }
        const prod = products.find(p => p.id === it.productId);
        const unitCost = prod ? prod.costPrice : it.costPrice || it.unitPrice * 0.65;
        productSalesMap[it.productId].qty += it.quantity;
        productSalesMap[it.productId].total += it.total;
        productSalesMap[it.productId].profit += Math.max(0, it.total - unitCost * it.quantity);
      });
    });

    const list = Object.values(productSalesMap);

    const sorted = [...list]
      .sort((a, b) => (productSortMetric === 'revenue' ? b.total - a.total : b.qty - a.qty))
      .slice(0, 6);

    const totalTopRevenue = sorted.reduce((acc, item) => acc + item.total, 0) || 1;

    const barData = sorted.map((p, idx) => ({
      name: p.nameAr.length > 16 ? p.nameAr.slice(0, 15) + '…' : p.nameAr,
      fullName: p.nameAr,
      المبيعات: Math.round(p.total),
      'الربح الصافي': Math.round(p.profit),
      'الكمية المباعة': p.qty,
      color: PRODUCT_PIE_COLORS[idx % PRODUCT_PIE_COLORS.length]
    }));

    const pieData = sorted.map((p, idx) => ({
      name: p.nameAr.length > 18 ? p.nameAr.slice(0, 16) + '…' : p.nameAr,
      fullName: p.nameAr,
      value: Math.round(p.total),
      qty: p.qty,
      share: Math.round((p.total / totalTopRevenue) * 100),
      color: PRODUCT_PIE_COLORS[idx % PRODUCT_PIE_COLORS.length]
    }));

    return {
      topProducts: sorted,
      topProductsChartData: barData,
      topProductsPieData: pieData
    };
  }, [filteredSales, products, productSortMetric]);

  // 3. Payment Methods Distribution Data
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

  // 4. Hourly Activity / Peak Rush Hours Data
  const hourlyActivityData = useMemo(() => {
    const buckets: { [label: string]: { hour: string; sales: number; invoices: number } } = {
      '08-10': { hour: '08-10 ص', sales: 0, invoices: 0 },
      '10-12': { hour: '10-12 م', sales: 0, invoices: 0 },
      '12-14': { hour: '12-02 م', sales: 0, invoices: 0 },
      '14-16': { hour: '02-04 م', sales: 0, invoices: 0 },
      '16-18': { hour: '04-06 م', sales: 0, invoices: 0 },
      '18-20': { hour: '06-08 م', sales: 0, invoices: 0 },
      '20-22': { hour: '08-10 م', sales: 0, invoices: 0 },
      '22-24': { hour: '10-12 ل', sales: 0, invoices: 0 }
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

  // Cashier performance
  const cashierPerformance = useMemo(() => {
    const cashierMap: { [name: string]: { name: string; invoices: number; total: number } } = {};
    filteredSales.forEach(s => {
      if (!cashierMap[s.cashierName]) {
        cashierMap[s.cashierName] = { name: s.cashierName, invoices: 0, total: 0 };
      }
      cashierMap[s.cashierName].invoices += 1;
      cashierMap[s.cashierName].total += s.total;
    });
    return Object.values(cashierMap);
  }, [filteredSales]);

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

  const formatCompactNumber = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
    return `${val}`;
  };

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-5 bg-transparent">
      {/* Top Header & Date Range Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {t('reportsTitle')} · لوحة التحليلات التفاعلية
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            رسوم بيانية تفاعلية للمبيعات اليومية، وتوزيع المنتجات الأكثر مبيعاً، وتطور أرباح المتجر
          </p>
        </div>

        {/* Date Filter & Export */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="apple-segmented flex items-center gap-1 p-1 rounded-xl text-xs">
            {(
              [
                { id: 'today', label: 'اليوم' },
                { id: 'week', label: 'آخر 7 أيام' },
                { id: 'month', label: 'آخر 30 يوم' },
                { id: 'all', label: 'الكل' }
              ] as const
            ).map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => setDateRange(item.id)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                  dateRange === item.id
                    ? 'apple-pill-active text-slate-900 dark:text-white font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            <span>تصدير CSV</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 apple-glass-card text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-95 whitespace-nowrap"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards (Apple Glassmorphism) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="apple-glass-card p-4 rounded-2xl space-y-1">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>إجمالي المبيعات</span>
            <DollarSign className="w-4 h-4 text-amber-500" />
          </span>
          <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
            {formatCurrency(totalRevenue)}
          </h3>
          <p className="text-[11px] text-slate-400 font-semibold font-mono tabular-nums">
            {filteredSales.length} فاتورة · متوسط اليوم {formatCurrency(averageDailySales)}
          </p>
        </div>

        <div className="apple-glass-card p-4 rounded-2xl space-y-1">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>تكلفة البضاعة المباعة</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </span>
          <h3 className="text-lg sm:text-xl font-black text-slate-700 dark:text-slate-300 font-mono tabular-nums">
            {formatCurrency(totalCOGS)}
          </h3>
          <p className="text-[11px] text-slate-400 font-semibold">بناءً على سعر التكلفة الفعلي</p>
        </div>

        <div className="apple-glass-card p-4 rounded-2xl space-y-1">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>إجمالي الربح التشغيلي</span>
            <Activity className="w-4 h-4 text-blue-500" />
          </span>
          <h3 className="text-lg sm:text-xl font-black text-blue-600 dark:text-blue-400 font-mono tabular-nums">
            {formatCurrency(grossProfit)}
          </h3>
          <p className="text-[11px] text-slate-400 font-semibold font-mono tabular-nums">
            هامش الربح الإجمالي: {profitMarginPercent}%
          </p>
        </div>

        <div className="apple-glass-card p-4 rounded-2xl border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20 space-y-1">
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center justify-between">
            <span>صافي أرباح المتجر</span>
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </span>
          <h3 className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
            {formatCurrency(netProfit)}
          </h3>
          <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 font-bold font-mono tabular-nums">
            بعد خصم المصاريف ({formatCurrency(periodExpenses)})
          </p>
        </div>

        <div className="apple-glass-card p-4 rounded-2xl space-y-1 col-span-2 lg:col-span-1">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>متوسط قيمة الفاتورة</span>
            <ReceiptText className="w-4 h-4 text-purple-500" />
          </span>
          <h3 className="text-lg sm:text-xl font-black text-purple-600 dark:text-purple-400 font-mono tabular-nums">
            {formatCurrency(averageInvoiceValue)}
          </h3>
          <p className="text-[11px] text-slate-400 font-semibold">قيمة سلة المشتريات للعميل</p>
        </div>
      </div>

      {/* Interactive Analytics View Switcher */}
      <div className="apple-segmented inline-flex items-center gap-1 p-1 rounded-2xl overflow-x-auto max-w-full">
        <button
          type="button"
          onClick={() => setActiveChartTab('all')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeChartTab === 'all'
              ? 'apple-pill-active text-slate-900 dark:text-white font-black'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5 text-amber-500" />
          <span>لوحة التحليلات الشاملة</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveChartTab('daily_sales')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeChartTab === 'daily_sales'
              ? 'apple-pill-active text-slate-900 dark:text-white font-black'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-blue-500" />
          <span>المبيعات اليومية</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveChartTab('products_dist')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeChartTab === 'products_dist'
              ? 'apple-pill-active text-slate-900 dark:text-white font-black'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <PieIcon className="w-3.5 h-3.5 text-purple-500" />
          <span>توزيع المنتجات الأكثر مبيعاً</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveChartTab('profit_evolution')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeChartTab === 'profit_evolution'
              ? 'apple-pill-active text-slate-900 dark:text-white font-black'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          <span>تطور أرباح المتجر</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveChartTab('hours_payments')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeChartTab === 'hours_payments'
              ? 'apple-pill-active text-slate-900 dark:text-white font-black'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-sky-500" />
          <span>أوقات الذروة وطرق الدفع</span>
        </button>
      </div>

      {/* INTERACTIVE RECHARTS DASHBOARD PANELS */}
      <div className="space-y-5">
        {/* PANEL 1: DAILY SALES INTERACTIVE CHART (المبيعات اليومية) */}
        {(activeChartTab === 'all' || activeChartTab === 'daily_sales') && (
          <div className="apple-glass-card p-5 rounded-3xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-amber-500" />
                  <span>تحليلات المبيعات اليومية وحجم الفواتير</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  متابعة حركة المبيعات اليومية ومقارنتها بمتوسط الأداء اليومي للمتجر
                </p>
              </div>

              {/* Interactive Chart Type Selector */}
              <div className="apple-segmented flex items-center gap-1 p-1 rounded-xl text-[11px] self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setDailySalesChartStyle('area')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                    dailySalesChartStyle === 'area'
                      ? 'apple-pill-active text-slate-900 dark:text-white'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  منحنى مساحي
                </button>
                <button
                  type="button"
                  onClick={() => setDailySalesChartStyle('bar')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                    dailySalesChartStyle === 'bar'
                      ? 'apple-pill-active text-slate-900 dark:text-white'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  أعمدة يومية
                </button>
                <button
                  type="button"
                  onClick={() => setDailySalesChartStyle('composed')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                    dailySalesChartStyle === 'composed'
                      ? 'apple-pill-active text-slate-900 dark:text-white'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  المبيعات + الفواتير
                </button>
              </div>
            </div>

            <div className="h-[270px] sm:h-[310px] w-full pt-2" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                {dailySalesChartStyle === 'area' ? (
                  <AreaChart data={timelineChartData} margin={{ top: 10, right: 15, left: 5, bottom: 0 }}>
                    <defs>
                      <linearGradient id="dailySalesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" opacity={0.35} />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={formatCompactNumber}
                    />
                    <Tooltip content={<CustomChartTooltip formatCurrency={formatCurrency} />} />
                    {averageDailySales > 0 && (
                      <ReferenceLine
                        y={averageDailySales}
                        stroke="#64748b"
                        strokeDasharray="4 4"
                      />
                    )}
                    <Area
                      type="monotone"
                      dataKey="sales"
                      name="المبيعات اليومية"
                      stroke="#f59e0b"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#dailySalesGrad)"
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                  </AreaChart>
                ) : dailySalesChartStyle === 'bar' ? (
                  <BarChart data={timelineChartData} margin={{ top: 10, right: 15, left: 5, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" opacity={0.35} />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={formatCompactNumber}
                    />
                    <Tooltip content={<CustomChartTooltip formatCurrency={formatCurrency} />} />
                    <Bar
                      dataKey="sales"
                      name="المبيعات اليومية"
                      fill="#f59e0b"
                      radius={[10, 10, 0, 0]}
                      maxBarSize={48}
                    />
                  </BarChart>
                ) : (
                  <ComposedChart data={timelineChartData} margin={{ top: 10, right: 15, left: 5, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" opacity={0.35} />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis
                      yAxisId="left"
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={formatCompactNumber}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="#3b82f6"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<CustomChartTooltip formatCurrency={formatCurrency} />} />
                    <Bar
                      yAxisId="left"
                      dataKey="sales"
                      name="المبيعات اليومية"
                      fill="#f59e0b"
                      radius={[8, 8, 0, 0]}
                      maxBarSize={42}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="invoices"
                      name="عدد الفواتير"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#3b82f6' }}
                    />
                  </ComposedChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* PANEL 2: TOP SELLING PRODUCTS DISTRIBUTION (توزيع المنتجات الأكثر مبيعاً) */}
        {(activeChartTab === 'all' || activeChartTab === 'products_dist') && (
          <div className="apple-glass-card p-5 rounded-3xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <PieIcon className="w-4 h-4 text-purple-500" />
                  <span>توزيع المنتجات الأكثر مبيعاً ومساهمتها في الإيرادات</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  الحصة السوقية للأصناف المتصدرة ومقارنة الكميات المباعة والعائد المالي لكل منتج
                </p>
              </div>

              {/* Sort Toggle: Revenue vs Quantity */}
              <div className="apple-segmented flex items-center gap-1 p-1 rounded-xl text-[11px] self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setProductSortMetric('revenue')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                    productSortMetric === 'revenue'
                      ? 'apple-pill-active text-slate-900 dark:text-white'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  ترتيب حسب الإيرادات
                </button>
                <button
                  type="button"
                  onClick={() => setProductSortMetric('quantity')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                    productSortMetric === 'quantity'
                      ? 'apple-pill-active text-slate-900 dark:text-white'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  ترتيب حسب الكمية المباعة
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center pt-2">
              {/* Left: Donut Distribution Chart (5 cols) */}
              <div className="lg:col-span-5 flex flex-col items-center">
                <div className="h-[250px] w-full" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={topProductsPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={58}
                        outerRadius={92}
                        paddingAngle={4}
                        dataKey={productSortMetric === 'revenue' ? 'value' : 'qty'}
                        nameKey="name"
                      >
                        {topProductsPieData.map((entry, index) => (
                          <Cell key={`prod-pie-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomChartTooltip formatCurrency={formatCurrency} />} />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value: any) => (
                          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 font-sans mx-1">
                            {value}
                          </span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Clean unboxed share breakdown */}
                <div className="w-full grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 dark:border-white/[0.06]">
                  {topProductsPieData.slice(0, 4).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs px-2 py-1">
                      <span className="flex items-center gap-1.5 truncate text-slate-700 dark:text-slate-300 font-semibold">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="truncate">{item.name}</span>
                      </span>
                      <span className="font-mono tabular-nums font-black text-slate-900 dark:text-white ms-1">
                        {item.share}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Top Products Revenue & Quantity Comparison Bar Chart (7 cols) */}
              <div className="lg:col-span-7 h-[280px] w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topProductsChartData}
                    margin={{ top: 10, right: 15, left: 5, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" opacity={0.35} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={formatCompactNumber}
                    />
                    <Tooltip content={<CustomChartTooltip formatCurrency={formatCurrency} />} />
                    <Legend
                      verticalAlign="top"
                      height={30}
                      formatter={(val: any) => (
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-sans mx-1">
                          {val}
                        </span>
                      )}
                    />
                    <Bar
                      dataKey="المبيعات"
                      name="المبيعات"
                      fill="#8b5cf6"
                      radius={[8, 8, 0, 0]}
                      maxBarSize={38}
                    />
                    <Bar
                      dataKey="الربح الصافي"
                      name="الربح الصافي"
                      fill="#10b981"
                      radius={[8, 8, 0, 0]}
                      maxBarSize={38}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* PANEL 3: STORE PROFIT EVOLUTION CHART (تطور أرباح المتجر) */}
        {(activeChartTab === 'all' || activeChartTab === 'profit_evolution') && (
          <div className="apple-glass-card p-5 rounded-3xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <span>تطور أرباح المتجر وهوامش الربحية عبر الزمن</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  مقارنة تطور إجمالي الربح وصافي الربح وتكلفة البضاعة المباعة يومياً
                </p>
              </div>

              <div className="apple-segmented flex items-center gap-1 p-1 rounded-xl text-[11px] self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setProfitChartMode('profit_vs_cost')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                    profitChartMode === 'profit_vs_cost'
                      ? 'apple-pill-active text-slate-900 dark:text-white'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  الأرباح مقابل التكلفة
                </button>
                <button
                  type="button"
                  onClick={() => setProfitChartMode('profit_margin')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                    profitChartMode === 'profit_margin'
                      ? 'apple-pill-active text-slate-900 dark:text-white'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  تطور هامش الربح %
                </button>
              </div>
            </div>

            <div className="h-[270px] sm:h-[310px] w-full pt-2" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                {profitChartMode === 'profit_vs_cost' ? (
                  <AreaChart data={timelineChartData} margin={{ top: 10, right: 15, left: 5, bottom: 0 }}>
                    <defs>
                      <linearGradient id="grossProfitGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.45} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#64748b" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#64748b" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" opacity={0.35} />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={formatCompactNumber}
                    />
                    <Tooltip content={<CustomChartTooltip formatCurrency={formatCurrency} />} />
                    <Legend
                      verticalAlign="top"
                      height={30}
                      formatter={(val: any) => (
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-sans mx-1">
                          {val}
                        </span>
                      )}
                    />
                    <Area
                      type="monotone"
                      dataKey="grossProfit"
                      name="إجمالي الربح"
                      stroke="#10b981"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#grossProfitGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="cost"
                      name="تكلفة البضاعة"
                      stroke="#64748b"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      fillOpacity={1}
                      fill="url(#costGrad)"
                    />
                  </AreaChart>
                ) : (
                  <ComposedChart data={timelineChartData} margin={{ top: 10, right: 15, left: 5, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" opacity={0.35} />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis
                      yAxisId="left"
                      stroke="#10b981"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={formatCompactNumber}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="#f59e0b"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={val => `${val}%`}
                    />
                    <Tooltip content={<CustomChartTooltip formatCurrency={formatCurrency} />} />
                    <Bar
                      yAxisId="left"
                      dataKey="grossProfit"
                      name="إجمالي الربح"
                      fill="#10b981"
                      radius={[8, 8, 0, 0]}
                      maxBarSize={40}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="margin"
                      name="هامش الربح %"
                      stroke="#f59e0b"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#f59e0b' }}
                    />
                  </ComposedChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* PANEL 4: PEAK HOURS & PAYMENT METHODS (أوقات الذروة وطرق الدفع) */}
        {(activeChartTab === 'all' || activeChartTab === 'hours_payments') && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Peak Rush Hours */}
            <div className="apple-glass-card p-5 rounded-3xl space-y-4">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-sky-500" />
                  <span>أوقات الذروة وازدحام المتجر</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  توزيع حجم المبيعات بحسب ساعات العمل اليومية
                </p>
              </div>

              <div className="h-[240px] w-full pt-2" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourlyActivityData} margin={{ top: 10, right: 10, left: 5, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" opacity={0.35} />
                    <XAxis dataKey="hour" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={formatCompactNumber}
                    />
                    <Tooltip content={<CustomChartTooltip formatCurrency={formatCurrency} />} />
                    <Bar dataKey="sales" name="المبيعات" fill="#0284c7" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Payment Methods Distribution */}
            <div className="apple-glass-card p-5 rounded-3xl space-y-4">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-emerald-500" />
                  <span>توزيع طرق الدفع والتحصيل</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  نسبة السيولة النقدية مقارنة بالبطاقات البنكية والذمم والتحويلات
                </p>
              </div>

              <div className="h-[240px] w-full flex items-center justify-center pt-2" dir="ltr">
                {paymentMethodsChartData.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-10">لا توجد عمليات دفع مسجلة</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentMethodsChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={52}
                        outerRadius={82}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {paymentMethodsChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomChartTooltip formatCurrency={formatCurrency} />} />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value: any) => (
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
          </div>
        )}
      </div>

      {/* Bottom Summary Tables: Top Products Ranking & Cashier Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-1">
        {/* Top Selling Products List */}
        <div className="apple-glass-card p-5 rounded-3xl space-y-3">
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="w-4 h-4 text-amber-500" />
            <span>ترتيب الأصناف الأكثر مبيعاً وربحية</span>
          </h3>

          <div className="divide-y divide-slate-200/60 dark:divide-white/[0.06]">
            {topProducts.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">لا توجد مبيعات مسجلة في هذه الفترة</p>
            ) : (
              topProducts.map((prod, idx) => (
                <div key={prod.id || idx} className="py-2.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-mono tabular-nums font-black text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate block">
                        {prod.nameAr}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                        {prod.qty} قطعة مباعة · ربح صافي {formatCurrency(prod.profit)}
                      </span>
                    </div>
                  </div>
                  <div className="text-end shrink-0">
                    <span className="text-xs font-black font-mono tabular-nums text-slate-900 dark:text-white block">
                      {formatCurrency(prod.total)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Cashier Performance */}
        <div className="apple-glass-card p-5 rounded-3xl space-y-3">
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-500" />
            <span>أداء الكاشيرات وموظفي نقطة البيع</span>
          </h3>

          <div className="divide-y divide-slate-200/60 dark:divide-white/[0.06]">
            {cashierPerformance.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">لا يوجد نشاط موظفين في هذه الفترة</p>
            ) : (
              cashierPerformance.map((c, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{c.name}</h4>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                      {c.invoices} فاتورة مكتملة
                    </span>
                  </div>
                  <span className="text-xs font-mono tabular-nums font-black text-emerald-600 dark:text-emerald-400">
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
