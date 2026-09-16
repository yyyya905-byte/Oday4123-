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
  LineChart
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
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
    setIsPinModalOpen
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
  const [salesTrendPeriod, setSalesTrendPeriod] = useState<'daily' | 'monthly'>('daily');
  const [dailyDaysRange, setDailyDaysRange] = useState<7 | 14 | 30>(7);
  const [salesChartType, setSalesChartType] = useState<'area' | 'bar'>('area');
  const [salesMetric, setSalesMetric] = useState<'sales' | 'invoices' | 'both'>('both');

  // Chart data: Daily Sales for selectable range (7, 14, 30 days)
  const dailyTrendsData = useMemo(() => {
    const days = [];
    for (let i = dailyDaysRange - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString(language === 'ar' ? 'ar-SY' : 'en-US', {
        weekday: dailyDaysRange > 14 ? undefined : 'short',
        month: 'numeric',
        day: 'numeric'
      });

      const daySales = safeSales.filter(s => s.createdAt.startsWith(dateStr) && s.status === 'completed');
      const dayTotal = daySales.reduce((sum, s) => sum + s.total, 0);
      const dayCount = daySales.length;
      const avgBasket = dayCount > 0 ? Math.round(dayTotal / dayCount) : 0;

      days.push({
        name: dayName,
        date: dateStr,
        sales: dayTotal,
        invoices: dayCount,
        avgBasket,
      });
    }
    return days;
  }, [safeSales, language, dailyDaysRange]);

  // Chart data: Monthly Sales for the past 12 months
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

      months.push({
        name: monthName,
        date: monthKey,
        sales: monthTotal,
        invoices: monthCount,
        avgBasket,
      });
    }
    return months;
  }, [safeSales, language]);

  // Active trend metrics
  const activeTrendData = salesTrendPeriod === 'daily' ? dailyTrendsData : monthlyTrendsData;
  const activePeriodTotal = activeTrendData.reduce((sum, item) => sum + item.sales, 0);
  const activePeriodInvoices = activeTrendData.reduce((sum, item) => sum + item.invoices, 0);
  const activePeriodAvg = activeTrendData.length > 0 ? Math.round(activePeriodTotal / activeTrendData.length) : 0;
  const peakPeriodItem = useMemo(() => {
    if (activeTrendData.length === 0) return null;
    return activeTrendData.reduce((max, curr) => curr.sales > max.sales ? curr : max, activeTrendData[0]);
  }, [activeTrendData]);

  // Payment methods chart data
  const paymentChartData = [
    { name: 'نقدي (Cash)', value: cashSalesTotal || 1, color: '#F59E0B' },
    { name: 'بطاقة (Card)', value: cardSalesTotal || 1, color: '#3B82F6' },
    { name: 'تحويل (Transfer)', value: transferSalesTotal || 0, color: '#10B981' },
  ];

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

      {/* Visual Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Interactive Sales Trends Visual Tool (Daily & Monthly) */}
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
                      {salesTrendPeriod === 'daily' ? `يومي (${dailyDaysRange} يوماً)` : 'شهري (12 شهراً)'}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {salesTrendPeriod === 'daily'
                      ? 'متابعة حركة المبيعات وتكرار الفواتير يوماً بيوم'
                      : 'تحليل الأداء المالي والنمو الشهري الشامل على مدار العام'}
                  </p>
                </div>
              </div>
            </div>

            {/* Interactive Mode Switches */}
            <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
              {/* Daily / Monthly Toggle */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setSalesTrendPeriod('daily')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
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
                  onClick={() => setSalesTrendPeriod('monthly')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    salesTrendPeriod === 'monthly'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-black'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>شهري</span>
                </button>
              </div>

              {/* Sub-range for daily view */}
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

              {/* Chart Type Toggle: Area vs Bar */}
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
                  <LineChart className="w-3.5 h-3.5" />
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
              </div>
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
              <span className="text-[10px] text-slate-400 font-bold block">عدد العمليات</span>
              <span className="text-xs sm:text-sm font-black text-indigo-600 dark:text-indigo-400 font-mono">
                {activePeriodInvoices} فاتورة
              </span>
            </div>
            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold block">
                {salesTrendPeriod === 'daily' ? 'المتوسط اليومي' : 'المتوسط الشهري'}
              </span>
              <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {formatCurrency(activePeriodAvg)}
              </span>
            </div>
            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold block">ذروة الأداء (الأعلى)</span>
              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white font-mono truncate block" title={peakPeriodItem ? `${peakPeriodItem.name}: ${formatCurrency(peakPeriodItem.sales)}` : '-'}>
                {peakPeriodItem && peakPeriodItem.sales > 0 ? `${peakPeriodItem.name}` : 'لا توجد بيانات'}
              </span>
            </div>
          </div>

          {/* Interactive Recharts Canvas */}
          <div className="h-64 sm:h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              {salesChartType === 'area' ? (
                <AreaChart data={activeTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesGradInteractive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="invoicesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis
                    yAxisId="revenueAxis"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <YAxis
                    yAxisId="invoicesAxis"
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
                          {dataPoint?.avgBasket > 0 && (
                            <div className="flex items-center justify-between gap-3 text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                              <span>متوسط الفاتورة:</span>
                              <span className="font-mono text-emerald-400">
                                {formatCurrency(dataPoint.avgBasket)}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    }}
                  />
                  <Area
                    yAxisId="revenueAxis"
                    type="monotone"
                    dataKey="sales"
                    name="المبيعات"
                    stroke="#F59E0B"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#salesGradInteractive)"
                  />
                </AreaChart>
              ) : (
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
                    dataKey="sales"
                    name="المبيعات"
                    fill="#F59E0B"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              توزيع طرق الدفع
            </h3>
            <p className="text-xs text-slate-400">نسبة التحصيل النقدي والبطاقات</p>
          </div>

          <div className="h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
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
