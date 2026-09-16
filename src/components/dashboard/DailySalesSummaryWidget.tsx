import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  DollarSign,
  ReceiptText,
  Calculator,
  TrendingUp,
  Send,
  MessageCircle,
  Package,
  Layers,
  Banknote,
  CreditCard,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { DailyWhatsAppClosingModal } from './DailyWhatsAppClosingModal';
import { soundEffects } from '../../services/audio';

export const DailySalesSummaryWidget: React.FC = () => {
  const {
    sales,
    products,
    expenses,
    settings,
    currentUser,
    formatCurrency,
    t,
    language,
    notify,
    logAudit,
    setActiveTab
  } = useApp();

  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState<boolean>(false);

  // Today's Sales Filter
  const todayStr = useMemo(() => new Date().toDateString(), []);
  
  const todaySales = useMemo(() => {
    return sales.filter(s => new Date(s.createdAt).toDateString() === todayStr && s.status === 'completed');
  }, [sales, todayStr]);

  // 1. Total Daily Revenue
  const todayRevenue = useMemo(() => {
    return todaySales.reduce((sum, s) => sum + s.total, 0);
  }, [todaySales]);

  // 2. Transaction Count
  const todayTransactionCount = todaySales.length;

  // 3. Average Order Value (AOV)
  const averageOrderValue = todayTransactionCount > 0 
    ? Math.round(todayRevenue / todayTransactionCount) 
    : 0;

  // Cash vs Card breakdown
  const cashSalesTotal = useMemo(() => {
    return todaySales
      .filter(s => s.paymentMethod === 'cash' || s.paymentMethod === 'نقداً')
      .reduce((sum, s) => sum + s.total, 0);
  }, [todaySales]);

  const cardSalesTotal = useMemo(() => {
    return todaySales
      .filter(s => s.paymentMethod === 'card' || s.paymentMethod === 'بطاقة')
      .reduce((sum, s) => sum + s.total, 0);
  }, [todaySales]);

  const otherSalesTotal = useMemo(() => {
    return todaySales
      .filter(s => s.paymentMethod !== 'cash' && s.paymentMethod !== 'نقداً' && s.paymentMethod !== 'card' && s.paymentMethod !== 'بطاقة')
      .reduce((sum, s) => sum + s.total, 0);
  }, [todaySales]);

  // Today's Inventory items sold count
  const todayUnitsSold = useMemo(() => {
    return todaySales.reduce((sum, s) => {
      return sum + s.items.reduce((itemSum, it) => itemSum + it.quantity, 0);
    }, 0);
  }, [todaySales]);

  const lowStockCount = useMemo(() => {
    return products.filter(p => p.stock <= p.minStock && p.status === 'active').length;
  }, [products]);

  // 1-Click Instant Dispatch helper
  const handleInstantWhatsAppSend = () => {
    const targetPhone = (settings.managerWhatsappPhone || settings.mobile || '+963933123456').replace(/[^0-9+]/g, '').replace('+', '');
    
    // Construct concise summary text
    const now = new Date();
    const dateFormatted = now.toLocaleDateString(language === 'ar' ? 'ar-SY' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const timeFormatted = now.toLocaleTimeString(language === 'ar' ? 'ar-SY' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const msg = [
      `📊 *جرد وإغلاق المبيعات اليومي — ${settings.storeNameAr || 'كيان كاشير'}*`,
      `📅 *التاريخ:* ${dateFormatted} | ⏰ ${timeFormatted}`,
      `👤 *الكاشير:* ${currentUser.name}`,
      `━━━━━━━━━━━━━━━━━━━━━`,
      `💰 *إجمالي الإيرادات اليومية:* *${formatCurrency(todayRevenue)}*`,
      `🧾 *عدد المعاملات (الفواتير):* *${todayTransactionCount} فاتورة*`,
      `📊 *متوسط قيمة الفاتورة (AOV):* *${formatCurrency(averageOrderValue)}*`,
      `💵 *نقداً في الصندوق:* ${formatCurrency(cashSalesTotal)}`,
      `💳 *دفع إلكتروني / شبكة:* ${formatCurrency(cardSalesTotal)}`,
      `📦 *إجمالي القطع المباعة اليوم:* ${todayUnitsSold} قطعة`,
      lowStockCount > 0 ? `⚠️ *تنبيه نقص مخزون:* ${lowStockCount} أصناف وصلت لحد الطلب` : `✅ *حالة المخزون:* ممتازة`,
      `━━━━━━━━━━━━━━━━━━━━━`,
      `✅ *تم التوثيق آلياً بنظام KIAN CASHIER*`
    ].join('\n');

    const whatsappUrl = targetPhone
      ? `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodeURIComponent(msg)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;

    logAudit(
      'إرسال جرد سريع إلى واتساب',
      `تم إرسال ملخص المبيعات (إيراد: ${todayRevenue} - فواتير: ${todayTransactionCount} - AOV: ${averageOrderValue}) إلى ${targetPhone}`,
      'medium'
    );

    soundEffects.playSuccess();
    notify('تم فتح تطبيق WhatsApp', 'تم تجهيز رسالة الجرد اليومي وإرسالها إلى الإدارة', 'success');
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Widget Top Header Bar */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-amber-500/5 via-emerald-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-md shadow-amber-500/20 shrink-0">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  {t('dailySalesSummary')}
                </h3>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
                  مباشر اليوم
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                متابعة حركة المبيعات، متوسط السلة، وإرسال الجرد اليومي المالي والمخزني تلقائياً إلى WhatsApp
              </p>
            </div>
          </div>

          {/* Action Button: WhatsApp Daily Closing Dispatch */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              id="btn-whatsapp-full-closing"
              onClick={() => setIsWhatsAppModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              title="إغلاق اليومية ومطابقة الصندوق وإرسال تقرير الجرد التفصيلي"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{t('sendDailyReportToWhatsApp')}</span>
            </button>

            <button
              id="btn-whatsapp-instant-send"
              onClick={handleInstantWhatsAppSend}
              className="p-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/20 transition-all"
              title="إرسال سريع فوري بنقرة واحدة إلى رقم الإدارة"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3 Core Requested Metrics Grid (Total Revenue, Transaction Count, Average Order Value) */}
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Metric 1: Total Revenue */}
            <div className="p-4 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-amber-500" />
                  <span>{t('dailyRevenue')}</span>
                </span>
                <h4 className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                  {formatCurrency(todayRevenue)}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                  مجموع مبيعات فواتير اليوم المكتملة
                </p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/25 shrink-0">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>

            {/* Metric 2: Transaction Count */}
            <div className="p-4 rounded-2xl bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                  <ReceiptText className="w-3.5 h-3.5 text-blue-500" />
                  <span>{t('transactionCount')}</span>
                </span>
                <h4 className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                  {todayTransactionCount} <span className="text-sm font-normal text-slate-400">فاتورة</span>
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                  {todayUnitsSold} قطعة تم بيعها خلال اليوم
                </p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-md shadow-blue-500/25 shrink-0">
                <ReceiptText className="w-6 h-6" />
              </div>
            </div>

            {/* Metric 3: Average Order Value (AOV) */}
            <div className="p-4 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{t('averageOrderValue')}</span>
                </span>
                <h4 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">
                  {formatCurrency(averageOrderValue)}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                  معدل إنفاق الزبون في كل معاملة
                </p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/25 shrink-0">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Quick Breakdown Sub-row: Cash / Card Collection & Inventory Alert */}
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                <Banknote className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 block truncate">التحصيل النقدي:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white truncate block">
                  {formatCurrency(cashSalesTotal)}
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                <CreditCard className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 block truncate">المدفوعات الإلكترونية:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white truncate block">
                  {formatCurrency(cardSalesTotal)}
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
                <Package className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 block truncate">حركة المخزون:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white truncate block">
                  {todayUnitsSold} قطع مباعة
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${lowStockCount > 0 ? 'bg-rose-500/10 text-rose-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
                  <Layers className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 block truncate">نواقص المخزون:</span>
                  <span className={`font-mono font-bold truncate block ${lowStockCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {lowStockCount > 0 ? `${lowStockCount} أصناف` : 'مكتمل ✅'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsWhatsAppModalOpen(true)}
                className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline shrink-0"
              >
                جرد كامل ↗
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp Daily Closing & Inventory Modal */}
      <DailyWhatsAppClosingModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
      />
    </>
  );
};
