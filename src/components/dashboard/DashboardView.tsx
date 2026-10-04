import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  TrendingUp,
  ReceiptText,
  DollarSign,
  AlertTriangle,
  Users,
  ShoppingBag,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Banknote,
  PlusCircle,
  Package,
  Layers,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  Crown,
  KeyRound,
  ArrowRight,
  Calendar,
  BarChart3,
  LineChart as LineChartIcon,
  Target,
  Clock,
  CheckCircle2,
  TrendingDown,
  Info,
  SlidersHorizontal,
  Download,
  Copy,
  Check,
  Flame,
  ArrowUpDown
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { DailySalesSummaryWidget } from './DailySalesSummaryWidget';
import { DailyProfitVsExpensesWidget } from './DailyProfitVsExpensesWidget';
import { SubscriptionStatusWidget } from './SubscriptionStatusWidget';
import { getRoleInfo, hasActionPermission } from '../../utils/permissions';

export const DashboardView: React.FC = () => {
  const {
    sales = [],
    products = [],
    customers = [],
    expenses = [],
    formatCurrency,
    t,
    language,
    setActiveTab,
    currentUser,
    setCurrentUser,
    users = [],
    setIsPinModalOpen,
    notify
  } = useApp();

  const roleInfo = getRoleInfo(currentUser.role);
  const canViewNetProfit = hasActionPermission('view_net_profit', currentUser.role);
  const canViewAiAdvisor = hasActionPermission('view_ai_advisor', currentUser.role);

  const safeSales = sales || [];
  const safeProducts = products || [];
  const safeCustomers = customers || [];
  const safeExpenses = expenses || [];

  // Metrics computation
  const todaySales = useMemo(() => {
    const todayStr = new Date().toDateString();
    return safeSales.filter(s => new Date(s.createdAt).toDateString() === todayStr && s.status === 'completed');
  }, [safeSales]);

  const todayRevenue = todaySales.reduce((sum, s) => sum + s.total, 0);
  const todayInvoicesCount = todaySales.length;

  // Net Profit (Total Revenue - COGS - Expenses)
  const totalCompletedSales = safeSales.filter(s => s.status === 'completed');
  const totalRevenue = totalCompletedSales.reduce((sum, s) => sum + s.total, 0);
  
  // Cost of goods sold
  const totalCOGS = totalCompletedSales.reduce((acc, sale) => {
    const saleCost = (sale.items || []).reduce((itemAcc, item) => {
      const prod = safeProducts.find(p => p.id === item.productId);
      const cost = prod ? prod.costPrice : item.unitPrice * 0.7; // fallback
      return itemAcc + (cost * item.quantity);
    }, 0);
    return acc + saleCost;
  }, 0);

  const totalExpenses = safeExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = Math.round(totalRevenue - totalCOGS - totalExpenses);

  const cashSalesTotal = totalCompletedSales.filter(s => s.paymentMethod === 'cash').reduce((sum, s) => sum + s.total, 0);
  const cardSalesTotal = totalCompletedSales.filter(s => s.paymentMethod === 'card').reduce((sum, s) => sum + s.total, 0);
  const transferSalesTotal = totalCompletedSales.filter(s => s.paymentMethod === 'transfer').reduce((sum, s) => sum + s.total, 0);

  const lowStockProducts = safeProducts.filter(p => p.stock <= p.minStock && p.status === 'active');

  // Interactive Sales Trends View State
  const [salesTrendPeriod, setSalesTrendPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [dailyDaysRange, setDailyDaysRange] = useState<7 | 14 | 30>(7);
  const [weeklyWeeksRange, setWeeklyWeeksRange] = useState<4 | 8 | 12>(4);
  const [salesChartType, setSalesChartType] = useState<'area' | 'bar' | 'composed'>('area');
  const [salesMetric, setSalesMetric] = useState<'sales' | 'profit' | 'invoices'>('sales');
  const [sideTab, setSideTab] = useState<'payments' | 'rushHours' | 'goal'>('payments');
  const [copiedReport, setCopiedReport] = useState<boolean>(false);

  // Daily Sales Target Tracker
  const [dailyGoal, setDailyGoal] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('kian_daily_sales_target');
      if (saved) return Number(saved);
    } catch {}
    return 50000;
  });
  const [isEditingGoal, setIsEditingGoal] = useState<boolean>(false);
  const [tempGoalInput, setTempGoalInput] = useState<string>('');

  // Handle saving goal
  const handleSaveGoal = () => {
    const val = parseFloat(tempGoalInput);
    if (!isNaN(val) && val > 0) {
      setDailyGoal(val);
      try {
        localStorage.setItem('kian_daily_sales_target', val.toString());
      } catch {}
      if (notify) notify('success', 'تم تحديث هدف المبيعات اليومي بنجاح');
    }
    setIsEditingGoal(false);
  };

  // 1. Chart data: Daily Sales for selectable range (7, 14, 30 days)
  const dailyTrendsData = useMemo(() => {
    const days = [];
    const now = new Date();
    for (let i = dailyDaysRange - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const isToday = i === 0;
      const isYesterday = i === 1;

      let dayName = '';
      if (isToday) {
        dayName = language === 'ar' ? 'اليوم' : 'Today';
      } else if (isYesterday) {
        dayName = language === 'ar' ? 'أمس' : 'Yesterday';
      } else {
        dayName = d.toLocaleDateString(language === 'ar' ? 'ar-SY' : 'en-US', {
          weekday: dailyDaysRange > 14 ? undefined : 'short',
          month: 'numeric',
          day: 'numeric'
        });
      }

      const daySales = safeSales.filter(s => s.createdAt.startsWith(dateStr) && s.status === 'completed');
      const dayTotal = daySales.reduce((sum, s) => sum + s.total, 0);
      const dayCount = daySales.length;
      const avgBasket = dayCount > 0 ? Math.round(dayTotal / dayCount) : 0;

      // COGS & Net Profit
      const dayCost = daySales.reduce((acc, sale) => {
        const saleCost = (sale.items || []).reduce((itemAcc, item) => {
          const prod = safeProducts.find(p => p.id === item.productId);
          const cost = prod ? prod.costPrice : item.unitPrice * 0.7;
          return itemAcc + (cost * item.quantity);
        }, 0);
        return acc + saleCost;
      }, 0);
      const dayProfit = Math.round(dayTotal - dayCost);

      days.push({
        name: dayName,
        date: dateStr,
        sales: dayTotal,
        invoices: dayCount,
        profit: dayProfit,
        avgBasket,
        growthRate: 0
      });
    }

    // Compute day-over-day growth
    for (let idx = 0; idx < days.length; idx++) {
      if (idx > 0 && days[idx - 1].sales > 0) {
        const prev = days[idx - 1].sales;
        const curr = days[idx].sales;
        days[idx].growthRate = Number((((curr - prev) / prev) * 100).toFixed(1));
      }
    }

    return days;
  }, [safeSales, safeProducts, language, dailyDaysRange]);

  // 2. Chart data: Weekly Sales for selectable range (4, 8, 12 weeks)
  const weeklyTrendsData = useMemo(() => {
    const weeks = [];
    const now = new Date();

    for (let i = weeklyWeeksRange - 1; i >= 0; i--) {
      // 7-day rolling window
      const endD = new Date(now);
      endD.setDate(now.getDate() - (i * 7));
      endD.setHours(23, 59, 59, 999);

      const startD = new Date(endD);
      startD.setDate(endD.getDate() - 6);
      startD.setHours(0, 0, 0, 0);

      const startStr = startD.toLocaleDateString(language === 'ar' ? 'ar-SY' : 'en-US', { month: 'numeric', day: 'numeric' });
      const endStr = endD.toLocaleDateString(language === 'ar' ? 'ar-SY' : 'en-US', { month: 'numeric', day: 'numeric' });

      let name = '';
      if (i === 0) {
        name = language === 'ar' ? 'هذا الأسبوع' : 'This Week';
      } else if (i === 1) {
        name = language === 'ar' ? 'الأسبوع الماضي' : 'Last Week';
      } else {
        name = language === 'ar' ? `أسبوع ${weeklyWeeksRange - i}` : `Week ${weeklyWeeksRange - i}`;
      }

      const weekSales = safeSales.filter(s => {
        if (s.status !== 'completed') return false;
        const d = new Date(s.createdAt);
        return d >= startD && d <= endD;
      });

      const weekTotal = weekSales.reduce((sum, s) => sum + s.total, 0);
      const weekCount = weekSales.length;
      const avgBasket = weekCount > 0 ? Math.round(weekTotal / weekCount) : 0;
      const dailyAvg = Math.round(weekTotal / 7);

      // COGS & Profit
      const weekCost = weekSales.reduce((acc, sale) => {
        const saleCost = (sale.items || []).reduce((itemAcc, item) => {
          const prod = safeProducts.find(p => p.id === item.productId);
          const cost = prod ? prod.costPrice : item.unitPrice * 0.7;
          return itemAcc + (cost * item.quantity);
        }, 0);
        return acc + saleCost;
      }, 0);
      const weekProfit = Math.round(weekTotal - weekCost);

      weeks.push({
        name,
        date: `${startStr} - ${endStr}`,
        sales: weekTotal,
        invoices: weekCount,
        profit: weekProfit,
        avgBasket,
        dailyAvg,
        growthRate: 0
      });
    }

    // Compute week-over-week growth
    for (let idx = 0; idx < weeks.length; idx++) {
      if (idx > 0 && weeks[idx - 1].sales > 0) {
        const prev = weeks[idx - 1].sales;
        const curr = weeks[idx].sales;
        weeks[idx].growthRate = Number((((curr - prev) / prev) * 100).toFixed(1));
      }
    }

    return weeks;
  }, [safeSales, safeProducts, language, weeklyWeeksRange]);

  // 3. Chart data: Monthly Sales for past 12 months
  const monthlyTrendsData = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const monthIndex = d.getMonth();
      const monthKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
      
      const monthName = d.toLocaleDateString(language === 'ar' ? 'ar-SY' : 'en-US', {
        month: 'short',
        year: '2-digit'
      });

      const monthSales = safeSales.filter(s => {
        if (s.status !== 'completed') return false;
        const sDate = new Date(s.createdAt);
        return sDate.getFullYear() === year && sDate.getMonth() === monthIndex;
      });

      const monthTotal = monthSales.reduce((sum, s) => sum + s.total, 0);
      const monthCount = monthSales.length;
      const avgBasket = monthCount > 0 ? Math.round(monthTotal / monthCount) : 0;

      const monthCost = monthSales.reduce((acc, sale) => {
        const saleCost = (sale.items || []).reduce((itemAcc, item) => {
          const prod = safeProducts.find(p => p.id === item.productId);
          const cost = prod ? prod.costPrice : item.unitPrice * 0.7;
          return itemAcc + (cost * item.quantity);
        }, 0);
        return acc + saleCost;
      }, 0);
      const monthProfit = Math.round(monthTotal - monthCost);

      months.push({
        name: monthName,
        date: monthKey,
        sales: monthTotal,
        invoices: monthCount,
        profit: monthProfit,
        avgBasket,
        growthRate: 0
      });
    }

    // Compute month-over-month growth
    for (let idx = 0; idx < months.length; idx++) {
      if (idx > 0 && months[idx - 1].sales > 0) {
        const prev = months[idx - 1].sales;
        const curr = months[idx].sales;
        months[idx].growthRate = Number((((curr - prev) / prev) * 100).toFixed(1));
      }
    }

    return months;
  }, [safeSales, safeProducts, language]);

  // Active trend metrics selection
  const activeTrendData = useMemo(() => {
    if (salesTrendPeriod === 'daily') return dailyTrendsData;
    if (salesTrendPeriod === 'weekly') return weeklyTrendsData;
    return monthlyTrendsData;
  }, [salesTrendPeriod, dailyTrendsData, weeklyTrendsData, monthlyTrendsData]);

  const activePeriodTotal = useMemo(() => activeTrendData.reduce((sum, item) => sum + item.sales, 0), [activeTrendData]);
  const activePeriodProfit = useMemo(() => activeTrendData.reduce((sum, item) => sum + item.profit, 0), [activeTrendData]);
  const activePeriodInvoices = useMemo(() => activeTrendData.reduce((sum, item) => sum + item.invoices, 0), [activeTrendData]);
  const activePeriodAvg = useMemo(() => activeTrendData.length > 0 ? Math.round(activePeriodTotal / activeTrendData.length) : 0, [activePeriodTotal, activeTrendData]);
  
  const peakPeriodItem = useMemo(() => {
    if (activeTrendData.length === 0) return null;
    return activeTrendData.reduce((max, curr) => curr.sales > max.sales ? curr : max, activeTrendData[0]);
  }, [activeTrendData]);

  // Growth rate for the current/most recent period vs prior
  const latestGrowthRate = useMemo(() => {
    if (activeTrendData.length < 2) return 0;
    const lastItem = activeTrendData[activeTrendData.length - 1];
    return lastItem.growthRate || 0;
  }, [activeTrendData]);

  // Executive Week-over-Week comparison (This Week vs Last Week)
  const wowComparison = useMemo(() => {
    const now = new Date();
    // This week (last 7 days)
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(now.getDate() - 6);
    thisWeekStart.setHours(0, 0, 0, 0);

    // Last week (prior 7 days)
    const lastWeekEnd = new Date(thisWeekStart);
    lastWeekEnd.setMilliseconds(-1);
    const lastWeekStart = new Date(lastWeekEnd);
    lastWeekStart.setDate(lastWeekEnd.getDate() - 6);
    lastWeekStart.setHours(0, 0, 0, 0);

    const thisWeekSales = safeSales.filter(s => {
      if (s.status !== 'completed') return false;
      const d = new Date(s.createdAt);
      return d >= thisWeekStart && d <= now;
    });

    const lastWeekSales = safeSales.filter(s => {
      if (s.status !== 'completed') return false;
      const d = new Date(s.createdAt);
      return d >= lastWeekStart && d <= lastWeekEnd;
    });

    const thisWeekRevenue = thisWeekSales.reduce((sum, s) => sum + s.total, 0);
    const lastWeekRevenue = lastWeekSales.reduce((sum, s) => sum + s.total, 0);
    const diffRevenue = thisWeekRevenue - lastWeekRevenue;
    const percentChange = lastWeekRevenue > 0
      ? Number(((diffRevenue / lastWeekRevenue) * 100).toFixed(1))
      : (thisWeekRevenue > 0 ? 100 : 0);

    return {
      thisWeekRevenue,
      lastWeekRevenue,
      diffRevenue,
      percentChange,
      thisWeekInvoices: thisWeekSales.length,
      lastWeekInvoices: lastWeekSales.length,
    };
  }, [safeSales]);

  // Today Hourly Rush Hours Data (from 08:00 to 23:00)
  const todayHourlyData = useMemo(() => {
    const hours = [];
    const hourCounts: { [h: number]: { sales: number; invoices: number } } = {};
    for (let h = 8; h <= 23; h++) {
      hourCounts[h] = { sales: 0, invoices: 0 };
    }

    todaySales.forEach(s => {
      const d = new Date(s.createdAt);
      const h = d.getHours();
      if (hourCounts[h]) {
        hourCounts[h].sales += s.total;
        hourCounts[h].invoices += 1;
      }
    });

    for (let h = 8; h <= 23; h++) {
      const label = language === 'ar' 
        ? (h < 12 ? `${h} ص` : h === 12 ? '12 م' : `${h - 12} م`)
        : (h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`);
      hours.push({
        hour: `${String(h).padStart(2, '0')}:00`,
        label,
        sales: hourCounts[h].sales,
        invoices: hourCounts[h].invoices
      });
    }

    return hours;
  }, [todaySales, language]);

  const peakHourItem = useMemo(() => {
    if (todayHourlyData.length === 0) return null;
    return todayHourlyData.reduce((max, curr) => curr.sales > max.sales ? curr : max, todayHourlyData[0]);
  }, [todayHourlyData]);

  // Goal progress percentage
  const goalProgress = Math.min(100, Math.round((todayRevenue / (dailyGoal || 1)) * 100));

  // Payment methods chart data
  const paymentChartData = [
    { name: language === 'ar' ? 'نقدي (Cash)' : 'Cash', value: cashSalesTotal || 1, color: '#F59E0B' },
    { name: language === 'ar' ? 'بطاقة (Card)' : 'Card', value: cardSalesTotal || 1, color: '#3B82F6' },
    { name: language === 'ar' ? 'تحويل (Transfer)' : 'Transfer', value: transferSalesTotal || 0, color: '#10B981' },
  ];

  // Copy Trend Summary to Clipboard
  const handleCopyTrendSummary = () => {
    const periodName = salesTrendPeriod === 'daily' 
      ? `يومي (${dailyDaysRange} يوماً)` 
      : salesTrendPeriod === 'weekly' 
        ? `أسبوعي (${weeklyWeeksRange} أسابيع)` 
        : 'شهري (12 شهراً)';
    
    const text = `📊 ملخص اتجاهات المبيعات (${periodName}):\n` +
      `• إجمالي المبيعات: ${formatCurrency(activePeriodTotal)}\n` +
      (canViewNetProfit ? `• صافي الأرباح: ${formatCurrency(activePeriodProfit)}\n` : '') +
      `• عدد الفواتير: ${activePeriodInvoices} عملية\n` +
      `• متوسط الفترة: ${formatCurrency(activePeriodAvg)}\n` +
      (peakPeriodItem ? `• ذروة المبيعات: ${peakPeriodItem.name} (${formatCurrency(peakPeriodItem.sales)})\n` : '') +
      `• مؤشر النمو الأخير: ${latestGrowthRate >= 0 ? '+' : ''}${latestGrowthRate}%\n` +
      `تم التصدير من نظام كاشير كيان الذكي POS`;

    navigator.clipboard.writeText(text).then(() => {
      setCopiedReport(true);
      if (notify) notify('success', 'تم نسخ ملخص اتجاهات المبيعات إلى الحافظة');
      setTimeout(() => setCopiedReport(false), 2500);
    });
  };

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6 bg-slate-50/50 dark:bg-slate-950">
      {/* Role-Based Access Level & Permission Control Banner */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                  مستوى وصول الموظف الحالي:
                </span>
                <span className={`text-xs font-black px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1 ${roleInfo.badgeColor}`}>
                  {roleInfo.badgeLabel}
                </span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  ({currentUser.name})
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {roleInfo.descriptionAr}
              </p>
            </div>
          </div>

          {/* Quick Role Simulation Switcher */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold text-slate-400 ms-1">
              محاكاة وتبديل الصلاحية:
            </span>
            {users.map(u => {
              const uMeta = getRoleInfo(u.role);
              const isSelected = currentUser.id === u.id;
              return (
                <button
                  key={u.id}
                  onClick={() => setCurrentUser(u)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 border-amber-500 font-black shadow-xs shadow-amber-500/20'
                      : 'bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-400'
                  }`}
                  title={`تبديل فوري لتجربة صلاحية (${uMeta.labelAr})`}
                >
                  <span>{u.name.split(' ')[0]}</span>
                  <span className={`text-[9px] px-1 py-0.2 rounded ${isSelected ? 'bg-slate-950 text-amber-400' : uMeta.badgeColor}`}>
                    {uMeta.badgeLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Permissions Summary Badges */}
        <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-400 font-bold flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-emerald-500" />
              الأدوات المتاحة لك:
            </span>
            <span className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold px-2 py-0.5 rounded-md">
              نقطة البيع POS
            </span>
            <span className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold px-2 py-0.5 rounded-md">
              أرشيف الفواتير
            </span>
            <span className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold px-2 py-0.5 rounded-md">
              المرتجعات والزبائن
            </span>
            {currentUser.role !== 'cashier' && (
              <>
                <span className="bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-semibold px-2 py-0.5 rounded-md">
                  المخزون والمنتجات
                </span>
                <span className="bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-semibold px-2 py-0.5 rounded-md">
                  الديون والمصاريف
                </span>
                <span className="bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-semibold px-2 py-0.5 rounded-md">
                  تجارة الجملة
                </span>
              </>
            )}
            {canViewNetProfit && (
              <span className="bg-purple-500/10 text-purple-700 dark:text-purple-300 font-semibold px-2 py-0.5 rounded-md">
                صافي الأرباح والإعدادات
              </span>
            )}
          </div>

          {!canViewNetProfit && (
            <div className="flex items-center gap-1.5 text-rose-500 dark:text-rose-400 font-bold">
              <Lock className="w-3.5 h-3.5" />
              <span>الأرباح الصافية وإدارة الموظفين والإعدادات محجوبة عن دورك</span>
            </div>
          )}
        </div>
      </div>

      {/* Cashier Role Friendly Redirection Banner */}
      {currentUser.role === 'cashier' && (
        <div className="p-4 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0">
              <ReceiptText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-black text-amber-900 dark:text-amber-200">
                مرحباً بك كاشير {currentUser.name}!
              </h4>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                شاشتك الرئيسية المعتمدة هي نقطة البيع (POS). الأدوات الإدارية مقيدة بحسب صلاحيتك.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('pos')}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-xs shrink-0 flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <span>الانتقال لنقطة البيع (POS)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>{t('dashboard')}</span>
            <span className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold px-2 py-0.5 rounded-full">
              مباشر (Live)
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            نظرة عامة على المبيعات، الأرباح، المخزون، ونشاط نقطة البيع اليوم
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('pos')}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xl shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t('newSale')}</span>
          </button>
        </div>
      </div>

      {/* Subscription Remaining Days & Status Widget (from localStorage) */}
      <SubscriptionStatusWidget />

      {/* AI Smart Executive Advisor Card (Supervisors and Managers Only) */}
      {canViewAiAdvisor && (
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 text-white flex items-center justify-center font-bold shrink-0 shadow-md shadow-indigo-500/20">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  {language === 'ar' ? 'مستشار الذكاء الاصطناعي الفوري (Gemini AI Business Hub)' : 'Instant Gemini AI Business Intelligence'}
                </h4>
                <span className="text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold px-2 py-0.5 rounded-full border border-indigo-500/20">
                  مباشر
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                {language === 'ar'
                  ? 'تحليل فوري للمبيعات، كشف النواقص، اقتراح تسعير الجملة والمفرق، وتوليد حملات تسويقية تلقائياً'
                  : 'Real-time sales auditing, stock deficiency forecast, wholesale pricing models & automated campaigns.'}
              </p>
            </div>
          </div>

          <button
            id="btn-dashboard-open-ai"
            onClick={() => setActiveTab('ai')}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white text-xs font-black rounded-xl shadow-xs shrink-0 flex items-center gap-2 self-start md:self-auto hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>{language === 'ar' ? 'فتح المستشار الذكي والتحليلات' : 'Open AI Advisor'}</span>
          </button>
        </div>
      )}

      {/* Daily Sales Summary Widget with Total Revenue, Transaction Count, AOV & WhatsApp Auto-Dispatch */}
      <DailySalesSummaryWidget />

      {/* Low Stock Warning Banner if any */}
      {lowStockProducts.length > 0 && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-200">
                تنبيه نقص المخزون: {lowStockProducts.length} منتجات وصلت لحد الطلب الأدنى!
              </h4>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                {lowStockProducts.slice(0, 3).map(p => p.nameAr).join('، ')}...
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('inventory')}
            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-xs shrink-0 self-start sm:self-auto"
          >
            إدارة المخزون وتوريد البضاعة
          </button>
        </div>
      )}

      {/* Top 4 Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Sales */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {t('todaySales')}
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
              {formatCurrency(todayRevenue)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 font-semibold">
              <span>{todayInvoicesCount} فواتير بيع مسجلة اليوم</span>
            </p>
          </div>
        </div>

        {/* Net Profit (Guarded for Manager / Owner Only) */}
        {canViewNetProfit ? (
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {t('netProfit')} (الربح الصافي)
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {formatCurrency(netProfit)}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 font-semibold">
                <span>بعد خصم التكلفة والمصاريف التشغيلية</span>
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 dark:bg-slate-900/40 p-4 sm:p-5 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 shadow-xs space-y-3 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                {t('netProfit')} (محجوب)
              </span>
              <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-xs font-bold px-2 py-1 rounded-lg bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400 inline-flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                مقتصر على صلاحية المدير
              </span>
              <p className="text-[11px] text-slate-400 mt-1.5 font-medium">
                تم حجب تفاصيل الأرباح لحماية خصوصية الحسابات
              </p>
            </div>
          </div>
        )}

        {/* Total Invoices */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              إجمالي الفواتير
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <ReceiptText className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
              {safeSales.length}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 font-semibold">
              <span>{safeCustomers.length} عملاء مسجلين في النظام</span>
            </p>
          </div>
        </div>

        {/* Low Stock Items */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {t('lowStockAlert')}
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
              {lowStockProducts.length}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 font-semibold">
              <span>من أصل {safeProducts.length} منتجات في الكتالوج</span>
            </p>
          </div>
        </div>
      </div>

      {/* Week-over-Week Executive Performance Comparison Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-4 sm:p-5 rounded-3xl border border-amber-500/20 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0 shadow-md shadow-amber-500/20">
            <ArrowUpDown className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                مقارنة أداء الأسبوع: هذا الأسبوع مقابل الأسبوع الماضي
              </h4>
              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                wowComparison.percentChange >= 0
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30'
              }`}>
                {wowComparison.percentChange >= 0 ? (
                  <>
                    <ArrowUpRight className="w-3 h-3" />
                    <span>+{wowComparison.percentChange}% نمو أسبوعي</span>
                  </>
                ) : (
                  <>
                    <ArrowDownRight className="w-3 h-3" />
                    <span>{wowComparison.percentChange}% انخفاض</span>
                  </>
                )}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              مبيعات آخر 7 أيام ({formatCurrency(wowComparison.thisWeekRevenue)}) مقارنة بـ 7 أيام السابقة ({formatCurrency(wowComparison.lastWeekRevenue)}). الفرق: {formatCurrency(Math.abs(wowComparison.diffRevenue))}.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start md:self-auto">
          <div className="text-center px-3 py-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold block">فواتير هذا الأسبوع</span>
            <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white font-mono">
              {wowComparison.thisWeekInvoices}
            </span>
          </div>
          <div className="text-center px-3 py-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold block">فواتير الأسبوع الماضي</span>
            <span className="text-xs sm:text-sm font-black text-slate-500 dark:text-slate-400 font-mono">
              {wowComparison.lastWeekInvoices}
            </span>
          </div>
        </div>
      </div>

      {/* Daily Profit vs. Expenses Interactive Recharts Widget */}
      <DailyProfitVsExpensesWidget />

      {/* Visual Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Interactive Sales Trends Visual Tool (Daily, Weekly, Monthly) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
          {/* Header & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3.5">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span>اتجاهات المبيعات وتحليلات الأداء التفاعلية</span>
                    <span className="text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold px-2 py-0.5 rounded-full">
                      {salesTrendPeriod === 'daily'
                        ? `يومي (${dailyDaysRange} يوماً)`
                        : salesTrendPeriod === 'weekly'
                          ? `أسبوعي (${weeklyWeeksRange} أسابيع)`
                          : 'شهري (12 شهراً)'}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {salesTrendPeriod === 'daily'
                      ? 'متابعة حركة المبيعات وتكرار الفواتير يوماً بيوم مع المقارنة اللحظية'
                      : salesTrendPeriod === 'weekly'
                        ? 'مقارنة أداء الأسابيع المتتالية ومعدل النمو الأسبوعي وحجم السلة'
                        : 'تحليل الأداء المالي والنمو الشهري الشامل على مدار العام'}
                  </p>
                </div>
              </div>
            </div>

            {/* Interactive Mode Switches */}
            <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
              {/* Daily / Weekly / Monthly Toggle */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setSalesTrendPeriod('daily')}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    salesTrendPeriod === 'daily'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-black'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>يومي</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSalesTrendPeriod('weekly')}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    salesTrendPeriod === 'weekly'
                      ? 'bg-amber-500 text-slate-950 shadow-xs font-black'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>أسبوعي</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSalesTrendPeriod('monthly')}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    salesTrendPeriod === 'monthly'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-black'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>شهري</span>
                </button>
              </div>

              {/* Sub-range options for Daily */}
              {salesTrendPeriod === 'daily' && (
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
                  {[7, 14, 30].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setDailyDaysRange(days as 7 | 14 | 30)}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        dailyDaysRange === days
                          ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                      }`}
                    >
                      {days}ي
                    </button>
                  ))}
                </div>
              )}

              {/* Sub-range options for Weekly */}
              {salesTrendPeriod === 'weekly' && (
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
                  {[4, 8, 12].map((weeks) => (
                    <button
                      key={weeks}
                      type="button"
                      onClick={() => setWeeklyWeeksRange(weeks as 4 | 8 | 12)}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        weeklyWeeksRange === weeks
                          ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                      }`}
                      title={`${weeks} أسابيع`}
                    >
                      {weeks}أ
                    </button>
                  ))}
                </div>
              )}

              {/* Metric Mode Filter */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setSalesMetric('sales')}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    salesMetric === 'sales'
                      ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs font-black'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  المبيعات
                </button>
                {canViewNetProfit && (
                  <button
                    type="button"
                    onClick={() => setSalesMetric('profit')}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      salesMetric === 'profit'
                        ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs font-black'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                    }`}
                  >
                    الأرباح
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSalesMetric('invoices')}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    salesMetric === 'invoices'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs font-black'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  الفواتير
                </button>
              </div>

              {/* Chart Type Toggle: Area vs Bar vs Composed */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setSalesChartType('area')}
                  className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                    salesChartType === 'area'
                      ? 'bg-white dark:bg-slate-700 text-amber-600 shadow-xs'
                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'
                  }`}
                  title="مخطط مساحي انسيابي"
                >
                  <LineChartIcon className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setSalesChartType('bar')}
                  className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                    salesChartType === 'bar'
                      ? 'bg-white dark:bg-slate-700 text-amber-600 shadow-xs'
                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'
                  }`}
                  title="مخطط أعمدة بيانية"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setSalesChartType('composed')}
                  className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                    salesChartType === 'composed'
                      ? 'bg-white dark:bg-slate-700 text-amber-600 shadow-xs'
                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'
                  }`}
                  title="مخطط مركب مزدوج (مبيعات + خط ترند)"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Copy Summary Button */}
              <button
                type="button"
                onClick={handleCopyTrendSummary}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
                title="نسخ تقرير الاتجاهات إلى الحافظة"
              >
                {copiedReport ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Quick Metrics Ribbon for Selected Period */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold block">إجمالي مبيعات الفترة</span>
              <span className="text-xs sm:text-sm font-black text-amber-600 dark:text-amber-400 font-mono">
                {formatCurrency(activePeriodTotal)}
              </span>
            </div>
            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold block">
                {salesMetric === 'profit' && canViewNetProfit ? 'صافي الربح للفترة' : 'عدد العمليات'}
              </span>
              <span className="text-xs sm:text-sm font-black text-indigo-600 dark:text-indigo-400 font-mono">
                {salesMetric === 'profit' && canViewNetProfit 
                  ? formatCurrency(activePeriodProfit)
                  : `${activePeriodInvoices} فاتورة`}
              </span>
            </div>
            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold block">
                {salesTrendPeriod === 'daily'
                  ? 'المتوسط اليومي'
                  : salesTrendPeriod === 'weekly'
                    ? 'المتوسط الأسبوعي'
                    : 'المتوسط الشهري'}
              </span>
              <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {formatCurrency(activePeriodAvg)}
              </span>
            </div>
            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-bold block">مؤشر النمو الأخير</span>
                {latestGrowthRate !== 0 && (
                  <span className={`text-[10px] font-black ${latestGrowthRate > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {latestGrowthRate > 0 ? `+${latestGrowthRate}%` : `${latestGrowthRate}%`}
                  </span>
                )}
              </div>
              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white font-mono truncate block" title={peakPeriodItem ? `${peakPeriodItem.name}: ${formatCurrency(peakPeriodItem.sales)}` : '-'}>
                {peakPeriodItem && peakPeriodItem.sales > 0 ? `ذروة: ${peakPeriodItem.name}` : 'لا توجد بيانات'}
              </span>
            </div>
          </div>

          {/* Interactive Recharts Canvas */}
          <div className="h-64 sm:h-76 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              {salesChartType === 'area' ? (
                <AreaChart data={activeTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesGradInteractive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="profitGradInteractive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="invoicesGradInteractive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis
                    yAxisId="mainAxis"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload || !payload.length) return null;
                      const dataPoint = payload[0]?.payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl border border-slate-800 text-xs space-y-1.5 min-w-[170px]">
                          <div className="font-bold border-b border-slate-800 pb-1 text-amber-400 flex items-center justify-between">
                            <span>{label}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{dataPoint?.date}</span>
                          </div>
                          <div className="flex items-center justify-between gap-3 text-slate-200">
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-amber-500" />
                              <span>المبيعات:</span>
                            </span>
                            <span className="font-mono font-bold text-amber-400">
                              {formatCurrency(dataPoint?.sales || 0)}
                            </span>
                          </div>
                          {canViewNetProfit && dataPoint?.profit !== undefined && (
                            <div className="flex items-center justify-between gap-3 text-slate-200">
                              <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span>صافي الربح:</span>
                              </span>
                              <span className="font-mono font-bold text-emerald-400">
                                {formatCurrency(dataPoint?.profit || 0)}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center justify-between gap-3 text-slate-200">
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-indigo-400" />
                              <span>الفواتير:</span>
                            </span>
                            <span className="font-mono font-bold text-indigo-300">
                              {dataPoint?.invoices || 0} عملية
                            </span>
                          </div>
                          {dataPoint?.avgBasket > 0 && (
                            <div className="flex items-center justify-between gap-3 text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                              <span>متوسط الفاتورة:</span>
                              <span className="font-mono text-emerald-400">
                                {formatCurrency(dataPoint.avgBasket)}
                              </span>
                            </div>
                          )}
                          {dataPoint?.growthRate !== 0 && dataPoint?.growthRate !== undefined && (
                            <div className="flex items-center justify-between gap-3 text-[10px] pt-1 text-slate-400">
                              <span>النمو عن السابق:</span>
                              <span className={`font-mono font-bold ${dataPoint.growthRate > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {dataPoint.growthRate > 0 ? `+${dataPoint.growthRate}%` : `${dataPoint.growthRate}%`}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    }}
                  />
                  {salesMetric === 'sales' && (
                    <Area
                      yAxisId="mainAxis"
                      type="monotone"
                      dataKey="sales"
                      name="المبيعات"
                      stroke="#F59E0B"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#salesGradInteractive)"
                    />
                  )}
                  {salesMetric === 'profit' && canViewNetProfit && (
                    <Area
                      yAxisId="mainAxis"
                      type="monotone"
                      dataKey="profit"
                      name="صافي الربح"
                      stroke="#10B981"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#profitGradInteractive)"
                    />
                  )}
                  {salesMetric === 'invoices' && (
                    <Area
                      yAxisId="mainAxis"
                      type="monotone"
                      dataKey="invoices"
                      name="عدد الفواتير"
                      stroke="#6366F1"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#invoicesGradInteractive)"
                    />
                  )}
                </AreaChart>
              ) : salesChartType === 'bar' ? (
                <BarChart data={activeTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload || !payload.length) return null;
                      const dataPoint = payload[0]?.payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl border border-slate-800 text-xs space-y-1.5 min-w-[160px]">
                          <div className="font-bold border-b border-slate-800 pb-1 text-amber-400 flex items-center justify-between">
                            <span>{label}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{dataPoint?.date}</span>
                          </div>
                          <div className="flex items-center justify-between gap-3 text-slate-200">
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-amber-500" />
                              <span>المبيعات:</span>
                            </span>
                            <span className="font-mono font-bold text-amber-400">
                              {formatCurrency(dataPoint?.sales || 0)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-3 text-slate-200">
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-indigo-400" />
                              <span>الفواتير:</span>
                            </span>
                            <span className="font-mono font-bold text-indigo-300">
                              {dataPoint?.invoices || 0} فاتورة
                            </span>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Bar
                    dataKey={salesMetric === 'profit' && canViewNetProfit ? 'profit' : salesMetric === 'invoices' ? 'invoices' : 'sales'}
                    name={salesMetric === 'profit' ? 'الربح' : salesMetric === 'invoices' ? 'الفواتير' : 'المبيعات'}
                    fill={salesMetric === 'profit' ? '#10B981' : salesMetric === 'invoices' ? '#6366F1' : '#F59E0B'}
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              ) : (
                <ComposedChart data={activeTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis
                    yAxisId="salesAxis"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <YAxis
                    yAxisId="secondaryAxis"
                    orientation="left"
                    stroke="#818CF8"
                    fontSize={10}
                    tickLine={false}
                    hide={true}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload || !payload.length) return null;
                      const dataPoint = payload[0]?.payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl border border-slate-800 text-xs space-y-1.5 min-w-[160px]">
                          <div className="font-bold border-b border-slate-800 pb-1 text-amber-400 flex items-center justify-between">
                            <span>{label}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{dataPoint?.date}</span>
                          </div>
                          <div className="flex items-center justify-between gap-3 text-slate-200">
                            <span>المبيعات:</span>
                            <span className="font-mono font-bold text-amber-400">{formatCurrency(dataPoint?.sales || 0)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-3 text-slate-200">
                            <span>متوسط السلة:</span>
                            <span className="font-mono font-bold text-emerald-400">{formatCurrency(dataPoint?.avgBasket || 0)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-3 text-slate-200">
                            <span>العمليات:</span>
                            <span className="font-mono font-bold text-indigo-300">{dataPoint?.invoices || 0} فاتورة</span>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Bar
                    yAxisId="salesAxis"
                    dataKey="sales"
                    name="المبيعات"
                    fill="#F59E0B"
                    radius={[6, 6, 0, 0]}
                  />
                  <Line
                    yAxisId="salesAxis"
                    type="monotone"
                    dataKey={canViewNetProfit ? 'profit' : 'avgBasket'}
                    name={canViewNetProfit ? 'صافي الربح' : 'متوسط السلة'}
                    stroke="#10B981"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#10B981' }}
                  />
                </ComposedChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right-Hand Multi-Widget: Payment Methods / Rush Hours / Goal Tracker */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            {/* Widget Tabs */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl w-full">
                <button
                  type="button"
                  onClick={() => setSideTab('payments')}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                    sideTab === 'payments'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-black'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  طرق الدفع
                </button>
                <button
                  type="button"
                  onClick={() => setSideTab('rushHours')}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                    sideTab === 'rushHours'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-black'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  أوقات الذروة
                </button>
                <button
                  type="button"
                  onClick={() => setSideTab('goal')}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                    sideTab === 'goal'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-black'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  هدف اليوم
                </button>
              </div>
            </div>

            {/* Tab 1: Payment Methods Breakdown */}
            {sideTab === 'payments' && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    توزيع التحصيل المالي
                  </h4>
                  <span className="text-[11px] font-mono text-slate-400">
                    الإجمالي: {formatCurrency(totalRevenue)}
                  </span>
                </div>

                <div className="h-44 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={48}
                        outerRadius={72}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {paymentChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any) => [formatCurrency(Number(val)), 'القيمة']}
                        contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <span className="w-3 h-3 rounded-full bg-amber-500" />
                      نقداً (Cash):
                    </span>
                    <span className="font-mono font-bold">{formatCurrency(cashSalesTotal)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <span className="w-3 h-3 rounded-full bg-blue-500" />
                      بطاقة (Card):
                    </span>
                    <span className="font-mono font-bold">{formatCurrency(cardSalesTotal)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <span className="w-3 h-3 rounded-full bg-emerald-500" />
                      تحويل (Transfer):
                    </span>
                    <span className="font-mono font-bold">{formatCurrency(transferSalesTotal)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Today Rush Hours Hourly Velocity */}
            {sideTab === 'rushHours' && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>حركة المبيعات حسب الساعة</span>
                  </h4>
                  {peakHourItem && peakHourItem.sales > 0 && (
                    <span className="text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold px-2 py-0.5 rounded-full">
                      ذروة: {peakHourItem.label}
                    </span>
                  )}
                </div>

                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={todayHourlyData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="2 2" stroke="#e2e8f0" opacity={0.2} vertical={false} />
                      <XAxis dataKey="label" stroke="#94a3b8" fontSize={9} tickLine={false} interval={2} />
                      <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (!active || !payload || !payload.length) return null;
                          const d = payload[0]?.payload;
                          return (
                            <div className="bg-slate-900 text-white p-2 rounded-xl text-[11px] shadow-lg border border-slate-800 space-y-1">
                              <div className="font-bold text-amber-400">{d.hour} ({d.label})</div>
                              <div>المبيعات: <span className="font-mono font-bold">{formatCurrency(d.sales)}</span></div>
                              <div>العمليات: <span className="font-mono font-bold">{d.invoices} فواتير</span></div>
                            </div>
                          );
                        }}
                      />
                      <Bar dataKey="sales" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                  تساعدك أوقات الذروة على تنظيم مناوبات الكاشير وتجهيز الصندوق خلال فترات الازدحام.
                </p>
              </div>
            )}

            {/* Tab 3: Daily Sales Goal Tracker */}
            {sideTab === 'goal' && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-amber-500" />
                    <span>مؤشر هدف المبيعات اليومي</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setTempGoalInput(dailyGoal.toString());
                      setIsEditingGoal(!isEditingGoal);
                    }}
                    className="text-[11px] text-amber-600 dark:text-amber-400 font-bold hover:underline cursor-pointer"
                  >
                    {isEditingGoal ? 'إلغاء' : 'تعديل الهدف'}
                  </button>
                </div>

                {isEditingGoal ? (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      حدد هدف مبيعات اليوم:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={tempGoalInput}
                        onChange={(e) => setTempGoalInput(e.target.value)}
                        placeholder="50000"
                        className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleSaveGoal}
                        className="px-3 py-1.5 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl cursor-pointer"
                      >
                        حفظ
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-end justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">المحقق اليوم</span>
                        <span className="text-lg font-black text-amber-600 dark:text-amber-400 font-mono">
                          {formatCurrency(todayRevenue)}
                        </span>
                      </div>
                      <div className="text-end">
                        <span className="text-[10px] text-slate-400 block font-bold">الهدف المحدد</span>
                        <span className="text-sm font-bold text-slate-600 dark:text-slate-300 font-mono">
                          {formatCurrency(dailyGoal)}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="h-3.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            goalProgress >= 100
                              ? 'bg-emerald-500'
                              : goalProgress >= 70
                                ? 'bg-amber-500'
                                : 'bg-indigo-500'
                          }`}
                          style={{ width: `${goalProgress}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="text-slate-500">
                          {goalProgress >= 100 ? 'تم تجاوز الهدف اليومي بنجاح!' : `متبقي: ${formatCurrency(Math.max(0, dailyGoal - todayRevenue))}`}
                        </span>
                        <span className="font-mono text-amber-600 dark:text-amber-400">
                          {goalProgress}%
                        </span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                      <Flame className="w-4 h-4 shrink-0 text-amber-500" />
                      <span>
                        {goalProgress >= 100
                          ? 'أداء استثنائي اليوم! استمر على نفس الوتيرة.'
                          : 'يمكنك زيادة متوسط السلة عبر عروض الجملة وتخفيضات الكاشير.'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Invoices & Top Selling Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Invoices Table */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              أحدث الفواتير المسجلة
            </h3>
            <button
              onClick={() => setActiveTab('invoices')}
              className="text-xs text-amber-600 dark:text-amber-400 font-bold hover:underline"
            >
              عرض الكل
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400">
                  <th className="pb-2 text-start">رقم الفاتورة</th>
                  <th className="pb-2 text-start">العميل</th>
                  <th className="pb-2 text-start">التاريخ</th>
                  <th className="pb-2 text-start">طريقة الدفع</th>
                  <th className="pb-2 text-end">المبلغ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {safeSales.slice(0, 5).map(sale => (
                  <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 font-mono font-bold text-slate-900 dark:text-white">
                      {sale.invoiceNumber}
                    </td>
                    <td className="py-3 text-slate-700 dark:text-slate-300">
                      {sale.customerName || 'عميل نقدي'}
                    </td>
                    <td className="py-3 text-slate-400">
                      {new Date(sale.createdAt).toLocaleTimeString(language === 'ar' ? 'ar-SY' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 text-end font-mono font-bold text-amber-600 dark:text-amber-400">
                      {formatCurrency(sale.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Low-Stock Action Widget */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              عناصر تحتاج توريد
            </h3>
            <span className="text-[10px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md">
              {lowStockProducts.length} أصناف
            </span>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {lowStockProducts.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                المخزون ممتاز! لا توجد أصناف تحت حد الطلب.
              </p>
            ) : (
              lowStockProducts.slice(0, 5).map(prod => (
                <div
                  key={prod.id}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {prod.nameAr}
                    </p>
                    <span className="text-[10px] text-slate-400 font-mono">
                      حد الطلب: {prod.minStock} {prod.unit}
                    </span>
                  </div>
                  <span className="text-xs font-black text-rose-600 dark:text-rose-400 font-mono">
                    المتبقي: {prod.stock}
                  </span>
                </div>
              ))
            )}
          </div>

          <button
            onClick={() => setActiveTab('inventory')}
            className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-white text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-all"
          >
            فتح إدارة المخزون
          </button>
        </div>
      </div>
    </div>
  );
};
