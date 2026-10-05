import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Expense } from '../../types';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Scale,
  Plus,
  Check,
  X,
  BarChart3,
  LineChart as LineChartIcon,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Calendar
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  AreaChart,
  BarChart,
  Bar,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from 'recharts';

export const DailyProfitVsExpensesWidget: React.FC = () => {
  const {
    sales = [],
    products = [],
    expenses = [],
    isAppPurchased,
    addExpense,
    formatCurrency,
    language,
    setActiveTab,
    currentUser,
    notify
  } = useApp();

  const [daysRange, setDaysRange] = useState<7 | 14 | 30>(7);
  const [chartMode, setChartMode] = useState<'composed' | 'area' | 'bar'>('composed');
  const [isQuickExpenseOpen, setIsQuickExpenseOpen] = useState<boolean>(false);
  const [expTitle, setExpTitle] = useState<string>('');
  const [expAmount, setExpAmount] = useState<string>('');
  const [expCategory, setExpCategory] = useState<Expense['category']>('other');

  const safeSales = sales || [];
  const safeProducts = products || [];
  const safeExpenses = expenses || [];

  // Build day-by-day comparison data: Daily Gross Profit vs. Daily Expenses vs. Daily Net Profit
  const dailyComparisonData = useMemo(() => {
    const result: {
      dateStr: string;
      label: string;
      fullDateLabel: string;
      revenue: number;
      cogs: number;
      grossProfit: number;
      expenses: number;
      netProfit: number;
      invoicesCount: number;
      expensesCount: number;
      profitMargin: number;
    }[] = [];

    const now = new Date();
    const isZeroedOut =
      isAppPurchased ||
      (safeSales.length === 0 && safeExpenses.length === 0) ||
      (typeof window !== 'undefined' && localStorage.getItem('kian_pos_zeroed_out') === 'true');

    // Realistic baseline curve ONLY for guest demo mode when demo sales/expenses are present
    const baselinePattern = [
      { gross: 185000, exp: 45000, rev: 490000, inv: 6 },
      { gross: 210000, exp: 60000, rev: 540000, inv: 8 },
      { gross: 165000, exp: 95000, rev: 430000, inv: 5 },
      { gross: 245000, exp: 50000, rev: 620000, inv: 9 },
      { gross: 195000, exp: 70000, rev: 510000, inv: 7 },
      { gross: 275000, exp: 85000, rev: 710000, inv: 11 },
      { gross: 230000, exp: 55000, rev: 590000, inv: 8 },
    ];

    for (let i = daysRange - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const isToday = i === 0;
      const isYesterday = i === 1;

      let label = '';
      if (isToday) {
        label = language === 'ar' ? 'اليوم' : 'Today';
      } else if (isYesterday) {
        label = language === 'ar' ? 'أمس' : 'Yesterday';
      } else {
        label = d.toLocaleDateString(language === 'ar' ? 'ar-SY' : 'en-US', {
          weekday: daysRange > 14 ? undefined : 'short',
          month: 'numeric',
          day: 'numeric'
        });
      }

      const fullDateLabel = d.toLocaleDateString(language === 'ar' ? 'ar-SY' : 'en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
      });

      // 1. Filter completed sales for this day
      const daySales = safeSales.filter(
        s => s.status === 'completed' && s.createdAt && s.createdAt.startsWith(dateStr)
      );

      let revenue = daySales.reduce((sum, s) => sum + (s.total || 0), 0);
      let cogs = daySales.reduce((acc, sale) => {
        if (typeof sale.costTotal === 'number' && sale.costTotal > 0) {
          return acc + sale.costTotal;
        }
        const saleCost = (sale.items || []).reduce((itemAcc, item) => {
          const prod = safeProducts.find(p => p.id === item.productId);
          const unitCost = item.costPrice ?? (prod ? prod.costPrice : item.unitPrice * 0.68);
          return itemAcc + unitCost * item.quantity;
        }, 0);
        return acc + saleCost;
      }, 0);

      let grossProfit = Math.max(0, Math.round(revenue - cogs));

      // 2. Filter expenses for this day
      const dayExpensesList = safeExpenses.filter(e => {
        const expDate = (e.date || e.createdAt || '').split('T')[0];
        return expDate === dateStr;
      });
      let dayExpensesTotal = dayExpensesList.reduce((sum, e) => sum + (e.amount || 0), 0);

      let invoicesCount = daySales.length;
      let expensesCount = dayExpensesList.length;

      if (!isZeroedOut && i > 0 && revenue === 0 && dayExpensesTotal === 0) {
        const pat = baselinePattern[i % baselinePattern.length];
        revenue = pat.rev;
        grossProfit = pat.gross;
        cogs = revenue - grossProfit;
        dayExpensesTotal = pat.exp;
        invoicesCount = pat.inv;
        expensesCount = 1;
      } else if (!isZeroedOut && i > 0 && revenue === 0 && dayExpensesTotal > 0) {
        const pat = baselinePattern[i % baselinePattern.length];
        revenue = pat.rev;
        grossProfit = pat.gross;
        cogs = revenue - grossProfit;
        invoicesCount = pat.inv;
      }

      const netProfit = Math.round(grossProfit - dayExpensesTotal);
      const profitMargin = revenue > 0 ? Math.round((netProfit / revenue) * 100) : 0;

      result.push({
        dateStr,
        label,
        fullDateLabel,
        revenue,
        cogs,
        grossProfit,
        expenses: dayExpensesTotal,
        netProfit,
        invoicesCount,
        expensesCount,
        profitMargin
      });
    }

    return result;
  }, [safeSales, safeProducts, safeExpenses, isAppPurchased, daysRange, language]);

  // Aggregate summary metrics for selected period
  const summary = useMemo(() => {
    const totalGrossProfit = dailyComparisonData.reduce((s, d) => s + d.grossProfit, 0);
    const totalExpenses = dailyComparisonData.reduce((s, d) => s + d.expenses, 0);
    const totalNetProfit = totalGrossProfit - totalExpenses;
    const totalRevenue = dailyComparisonData.reduce((s, d) => s + d.revenue, 0);
    const expenseToProfitRatio =
      totalGrossProfit > 0 ? Math.round((totalExpenses / totalGrossProfit) * 100) : 0;

    const bestDay =
      dailyComparisonData.length > 0
        ? dailyComparisonData.reduce((best, cur) => (cur.netProfit > best.netProfit ? cur : best), dailyComparisonData[0])
        : null;

    const highestExpenseDay =
      dailyComparisonData.length > 0
        ? dailyComparisonData.reduce((max, cur) => (cur.expenses > max.expenses ? cur : max), dailyComparisonData[0])
        : null;

    return {
      totalGrossProfit,
      totalExpenses,
      totalNetProfit,
      totalRevenue,
      expenseToProfitRatio,
      bestDay,
      highestExpenseDay
    };
  }, [dailyComparisonData]);

  const handleQuickAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(expAmount);
    if (!expTitle.trim() || isNaN(numericAmount) || numericAmount <= 0) {
      if (notify) notify('تنبيه', 'يرجى إدخال بيان المصروف وقيمة صحيحة أكبر من صفر', 'warning');
      return;
    }

    addExpense({
      title: expTitle.trim(),
      category: expCategory,
      amount: numericAmount,
      date: new Date().toISOString().split('T')[0],
      notes: 'سُجل من أداة مقارنة الأرباح والمصروفات في لوحة القيادة'
    });

    setExpTitle('');
    setExpAmount('');
    setIsQuickExpenseOpen(false);
    if (notify) notify('تم تسجيل المصروف', 'تم تحديث الرسم البياني للأرباح مقارنة بالمصروفات فوراً', 'success');
  };

  return (
    <section
      aria-label="الأرباح اليومية مقارنة بالمصروفات"
      className="apple-glass-card bg-white/90 dark:bg-slate-900/90 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-xs space-y-5"
    >
      {/* Top Header & Interactive Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              {language === 'ar'
                ? 'تحليل الأرباح اليومية مقارنة بالمصروفات'
                : 'Daily Profit vs. Expenses Analytics'}
            </h3>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <span>مقارنة الأرباح التشغيلية مع المصاريف اليومية وصافي العائد</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">آخر {daysRange} أيام</span>
            </div>
          </div>
        </div>

        {/* Functional Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          {/* Quick Add Expense Toggle Button */}
          <button
            type="button"
            onClick={() => setIsQuickExpenseOpen(!isQuickExpenseOpen)}
            className="px-3 py-1.5 min-h-[38px] rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'تسجيل مصروف اليوم' : 'Log Expense'}</span>
          </button>

          {/* Range Selector (7d / 14d / 30d) */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {([7, 14, 30] as const).map(d => (
              <button
                key={d}
                type="button"
                onClick={() => setDaysRange(d)}
                className={`px-2.5 py-1 min-h-[32px] rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  daysRange === d
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-black'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {d} {language === 'ar' ? 'أيام' : 'Days'}
              </button>
            ))}
          </div>

          {/* Chart Type Selector */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setChartMode('composed')}
              className={`px-2.5 py-1 min-h-[32px] rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                chartMode === 'composed'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-2xs font-black'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="مخطط مركب (أعمدة الأرباح والمصروفات + منحنى الصافي)"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>مركب</span>
            </button>
            <button
              type="button"
              onClick={() => setChartMode('bar')}
              className={`px-2.5 py-1 min-h-[32px] rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                chartMode === 'bar'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-2xs font-black'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="مخطط أعمدة مزدوج"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>أعمدة</span>
            </button>
            <button
              type="button"
              onClick={() => setChartMode('area')}
              className={`px-2.5 py-1 min-h-[32px] rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                chartMode === 'area'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-2xs font-black'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="مخطط مساحي مقارن"
            >
              <LineChartIcon className="w-3.5 h-3.5" />
              <span>مساحي</span>
            </button>
          </div>
        </div>
      </div>

      {/* Inline Quick Expense Form */}
      {isQuickExpenseOpen && (
        <form
          onSubmit={handleQuickAddExpense}
          className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 space-y-3 animate-in fade-in"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-800 dark:text-slate-200">
              إضافة مصروف تشغيلي سريع ليوم ({new Date().toLocaleDateString('ar-SY')})
            </span>
            <button
              type="button"
              onClick={() => setIsQuickExpenseOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
            <input
              type="text"
              required
              value={expTitle}
              onChange={e => setExpTitle(e.target.value)}
              placeholder="بيان المصروف (مثال: مازوت مولدة، ضيافة)..."
              className="sm:col-span-2 px-3 py-2 min-h-[40px] text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
            />
            <input
              type="number"
              required
              min={1}
              value={expAmount}
              onChange={e => setExpAmount(e.target.value)}
              placeholder="المبلغ..."
              className="px-3 py-2 min-h-[40px] text-xs font-mono font-bold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
            />
            <div className="flex items-center gap-2">
              <select
                value={expCategory}
                onChange={e => setExpCategory(e.target.value as Expense['category'])}
                className="flex-1 px-2.5 py-2 min-h-[40px] text-xs font-bold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value="other">مصاريف عامة</option>
                <option value="electricity">كهرباء وطاقة</option>
                <option value="purchases">مشتريات سريعة</option>
                <option value="maintenance">صيانة</option>
                <option value="salaries">رواتب وأجور</option>
                <option value="rent">إيجار</option>
              </select>
              <button
                type="submit"
                className="px-4 py-2 min-h-[40px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>حفظ</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* 4 Key Comparison Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. Total Gross Profit */}
        <div className="p-3.5 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-bold">إجمالي الأرباح التشغيلية</span>
            <TrendingUp className="w-4 h-4 text-emerald-500 shrink-0" />
          </div>
          <div className="text-base sm:text-lg font-black font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
            {formatCurrency(summary.totalGrossProfit)}
          </div>
          <div className="text-[11px] text-slate-400">
            من مبيعات بقيمة {formatCurrency(summary.totalRevenue)}
          </div>
        </div>

        {/* 2. Total Expenses */}
        <div className="p-3.5 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-bold">إجمالي المصروفات</span>
            <Wallet className="w-4 h-4 text-rose-500 shrink-0" />
          </div>
          <div className="text-base sm:text-lg font-black font-mono tabular-nums text-rose-600 dark:text-rose-400">
            {formatCurrency(summary.totalExpenses)}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>أعلى يوم: {summary.highestExpenseDay?.label || '-'}</span>
            <button
              type="button"
              onClick={() => setActiveTab('expenses')}
              className="text-amber-600 dark:text-amber-400 font-bold hover:underline cursor-pointer"
            >
              السجل ←
            </button>
          </div>
        </div>

        {/* 3. Net Profit After Expenses */}
        <div className="p-3.5 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-bold">صافي الربح (بعد المصاريف)</span>
            {summary.totalNetProfit >= 0 ? (
              <ArrowUpRight className="w-4 h-4 text-indigo-500 shrink-0" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-rose-500 shrink-0" />
            )}
          </div>
          <div
            className={`text-base sm:text-lg font-black font-mono tabular-nums ${
              summary.totalNetProfit >= 0
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatCurrency(summary.totalNetProfit)}
          </div>
          <div className="text-[11px] text-slate-400">
            أفضل يوم صافي: {summary.bestDay?.label || '-'}
          </div>
        </div>

        {/* 4. Expense-to-Profit Efficiency Ratio */}
        <div className="p-3.5 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-bold">نسبة المصروفات للأرباح</span>
            <span className="font-mono font-black text-slate-800 dark:text-slate-200">
              {summary.expenseToProfitRatio}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-emerald-500/20 overflow-hidden flex">
            <div
              className="h-full bg-rose-500 transition-all duration-300"
              style={{ width: `${Math.min(100, summary.expenseToProfitRatio)}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-400">
            {summary.expenseToProfitRatio <= 35
              ? 'كفاءة تشغيلية ممتازة (مصروفات منضبطة)'
              : summary.expenseToProfitRatio <= 65
              ? 'معدل مصروفات متوسط مقارنة بالأرباح'
              : 'تنبيه: المصروفات تلتهم جزءاً كبيراً من الربح'}
          </div>
        </div>
      </div>

      {/* Legend Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 pt-1">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
            <span className="w-3 h-3 rounded-xs bg-emerald-500 inline-block" />
            <span>الأرباح اليومية (Gross Profit)</span>
          </span>
          <span className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
            <span className="w-3 h-3 rounded-xs bg-rose-500 inline-block" />
            <span>المصروفات اليومية (Expenses)</span>
          </span>
          <span className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
            <span className="w-3 h-1 rounded-full bg-indigo-500 inline-block" />
            <span>صافي الربح (Net Profit)</span>
          </span>
        </div>
        <span className="text-[11px] text-slate-400">
          مرر المؤشر على أي يوم لعرض التفاصيل المالية الكاملة
        </span>
      </div>

      {/* Recharts Interactive Canvas */}
      <div className="h-72 sm:h-80 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          {chartMode === 'composed' ? (
            <ComposedChart data={dailyComparisonData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />
              <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
              />
              <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="2 2" />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const d = payload[0]?.payload;
                  return (
                    <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-xl border border-slate-800 text-xs space-y-2 min-w-[210px]">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                        <span className="font-black text-amber-400">{d.label}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{d.dateStr}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-300">إجمالي المبيعات:</span>
                        <span className="font-mono font-bold text-slate-200">{formatCurrency(d.revenue)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="flex items-center gap-1.5 text-emerald-300">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span>الأرباح التشغيلية:</span>
                        </span>
                        <span className="font-mono font-black text-emerald-400">
                          {formatCurrency(d.grossProfit)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="flex items-center gap-1.5 text-rose-300">
                          <span className="w-2 h-2 rounded-full bg-rose-500" />
                          <span>المصروفات اليومية:</span>
                        </span>
                        <span className="font-mono font-black text-rose-400">
                          -{formatCurrency(d.expenses)}
                        </span>
                      </div>
                      <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between gap-4">
                        <span className="font-bold text-indigo-300">صافي الربح النهائي:</span>
                        <span
                          className={`font-mono font-black ${
                            d.netProfit >= 0 ? 'text-indigo-400' : 'text-rose-400'
                          }`}
                        >
                          {formatCurrency(d.netProfit)}
                        </span>
                      </div>
                    </div>
                  );
                }}
              />
              <Bar
                dataKey="grossProfit"
                name="الأرباح اليومية"
                fill="#10B981"
                radius={[6, 6, 0, 0]}
                maxBarSize={28}
              />
              <Bar
                dataKey="expenses"
                name="المصروفات اليومية"
                fill="#F43F5E"
                radius={[6, 6, 0, 0]}
                maxBarSize={28}
              />
              <Line
                type="monotone"
                dataKey="netProfit"
                name="صافي الربح"
                stroke="#6366F1"
                strokeWidth={2.5}
                dot={{ r: 3.5, fill: '#6366F1', strokeWidth: 1.5, stroke: '#fff' }}
              />
            </ComposedChart>
          ) : chartMode === 'bar' ? (
            <BarChart data={dailyComparisonData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />
              <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const d = payload[0]?.payload;
                  return (
                    <div className="bg-slate-900/95 text-white p-3 rounded-2xl shadow-xl border border-slate-800 text-xs space-y-1.5 min-w-[190px]">
                      <div className="font-black text-amber-400 border-b border-slate-800 pb-1">{d.label}</div>
                      <div className="flex justify-between gap-3">
                        <span className="text-emerald-300">الأرباح:</span>
                        <span className="font-mono font-bold text-emerald-400">{formatCurrency(d.grossProfit)}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-rose-300">المصروفات:</span>
                        <span className="font-mono font-bold text-rose-400">{formatCurrency(d.expenses)}</span>
                      </div>
                      <div className="flex justify-between gap-3 pt-1 border-t border-slate-800">
                        <span className="text-indigo-300">الصافي:</span>
                        <span className="font-mono font-bold text-indigo-400">{formatCurrency(d.netProfit)}</span>
                      </div>
                    </div>
                  );
                }}
              />
              <Bar dataKey="grossProfit" name="الأرباح اليومية" fill="#10B981" radius={[6, 6, 0, 0]} maxBarSize={30} />
              <Bar dataKey="expenses" name="المصروفات اليومية" fill="#F43F5E" radius={[6, 6, 0, 0]} maxBarSize={30} />
            </BarChart>
          ) : (
            <AreaChart data={dailyComparisonData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="dailyGrossProfitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="dailyExpensesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />
              <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const d = payload[0]?.payload;
                  return (
                    <div className="bg-slate-900/95 text-white p-3 rounded-2xl shadow-xl border border-slate-800 text-xs space-y-1.5 min-w-[190px]">
                      <div className="font-black text-amber-400 border-b border-slate-800 pb-1">{d.label}</div>
                      <div className="flex justify-between gap-3">
                        <span className="text-emerald-300">الأرباح اليومية:</span>
                        <span className="font-mono font-bold text-emerald-400">{formatCurrency(d.grossProfit)}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-rose-300">المصروفات اليومية:</span>
                        <span className="font-mono font-bold text-rose-400">{formatCurrency(d.expenses)}</span>
                      </div>
                      <div className="flex justify-between gap-3 pt-1 border-t border-slate-800">
                        <span className="text-indigo-300">صافي الربح:</span>
                        <span className="font-mono font-bold text-indigo-400">{formatCurrency(d.netProfit)}</span>
                      </div>
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="grossProfit"
                name="الأرباح اليومية"
                stroke="#10B981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#dailyGrossProfitGrad)"
              />
              <Area
                type="monotone"
                dataKey="expenses"
                name="المصروفات اليومية"
                stroke="#F43F5E"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#dailyExpensesGrad)"
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </section>
  );
};
