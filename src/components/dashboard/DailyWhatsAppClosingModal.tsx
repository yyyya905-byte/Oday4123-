import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Send,
  X,
  Copy,
  Check,
  Phone,
  Calculator,
  ShieldCheck,
  TrendingUp,
  DollarSign,
  Receipt,
  Package,
  Layers,
  Sparkles,
  ExternalLink,
  MessageCircle
} from 'lucide-react';
import { soundEffects } from '../../services/audio';

interface DailyWhatsAppClosingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DailyWhatsAppClosingModal: React.FC<DailyWhatsAppClosingModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    sales,
    products,
    expenses,
    settings,
    updateSettings,
    currentUser,
    formatCurrency,
    t,
    language,
    notify,
    logAudit
  } = useApp();

  // Settings State for Phone & Auto-dispatch
  const [phoneNumber, setPhoneNumber] = useState<string>(settings.managerWhatsappPhone || settings.mobile || '+963933123456');
  const [autoSendOnClose, setAutoSendOnClose] = useState<boolean>(settings.autoSendDailyReportOnClose ?? true);
  const [includeInventory, setIncludeInventory] = useState<boolean>(settings.includeInventoryInReport ?? true);
  
  // Cash Drawer Reconciliation (Optional actual count)
  const [actualCashInDrawer, setActualCashInDrawer] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Today's Sales Calculation
  const todayStr = useMemo(() => new Date().toDateString(), []);
  const todaySales = useMemo(() => {
    return sales.filter(s => new Date(s.createdAt).toDateString() === todayStr && s.status === 'completed');
  }, [sales, todayStr]);

  const todayRevenue = useMemo(() => todaySales.reduce((sum, s) => sum + s.total, 0), [todaySales]);
  const todayInvoicesCount = todaySales.length;
  const todayAOV = todayInvoicesCount > 0 ? Math.round(todayRevenue / todayInvoicesCount) : 0;

  // Breakdown by payment methods
  const cashSalesTotal = useMemo(() => todaySales.filter(s => s.paymentMethod === 'cash' || s.paymentMethod === 'نقداً').reduce((sum, s) => sum + s.total, 0), [todaySales]);
  const cardSalesTotal = useMemo(() => todaySales.filter(s => s.paymentMethod === 'card' || s.paymentMethod === 'بطاقة').reduce((sum, s) => sum + s.total, 0), [todaySales]);
  const transferSalesTotal = useMemo(() => todaySales.filter(s => s.paymentMethod === 'transfer' || s.paymentMethod === 'تحويل' || s.paymentMethod === 'credit' || s.paymentMethod === 'آجل').reduce((sum, s) => sum + s.total, 0), [todaySales]);

  // Today's Expenses
  const todayExpensesList = useMemo(() => {
    return expenses.filter(e => {
      const expDate = e.date ? new Date(e.date).toDateString() : new Date(e.createdAt).toDateString();
      return expDate === todayStr;
    });
  }, [expenses, todayStr]);

  const todayExpensesTotal = useMemo(() => todayExpensesList.reduce((sum, e) => sum + e.amount, 0), [todayExpensesList]);

  // Cost of Goods Sold for today's sales
  const todayCOGS = useMemo(() => {
    return todaySales.reduce((acc, sale) => {
      const saleCost = sale.items.reduce((itemAcc, item) => {
        const prod = products.find(p => p.id === item.productId);
        const cost = prod ? prod.costPrice : (item.costPrice || item.unitPrice * 0.7);
        return itemAcc + (cost * item.quantity);
      }, 0);
      return acc + saleCost;
    }, 0);
  }, [todaySales, products]);

  const todayNetProfit = Math.round(todayRevenue - todayCOGS - todayExpensesTotal);

  // Inventory stats for today
  const inventoryTodayStats = useMemo(() => {
    let totalUnitsSold = 0;
    const productSoldMap: Record<string, { name: string; qty: number; total: number }> = {};

    todaySales.forEach(s => {
      s.items.forEach(it => {
        totalUnitsSold += it.quantity;
        if (!productSoldMap[it.productId]) {
          productSoldMap[it.productId] = {
            name: it.productNameAr,
            qty: 0,
            total: 0
          };
        }
        productSoldMap[it.productId].qty += it.quantity;
        productSoldMap[it.productId].total += it.total;
      });
    });

    const topSoldItems = Object.values(productSoldMap)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    const lowStockItems = products.filter(p => p.stock <= p.minStock && p.status === 'active');

    return {
      totalUnitsSold,
      distinctProductsCount: Object.keys(productSoldMap).length,
      topSoldItems,
      lowStockItems
    };
  }, [todaySales, products]);

  // Cash variance
  const parsedActualCash = actualCashInDrawer.trim() !== '' ? Number(actualCashInDrawer) : null;
  const cashVariance = parsedActualCash !== null ? parsedActualCash - cashSalesTotal : 0;

  // Formatted Date & Time
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

  // Construct WhatsApp Message Plaintext
  const reportMessage = useMemo(() => {
    const lines: string[] = [];

    lines.push(`📊 *تقرير الجرد والإغلاق اليومي — ${settings.storeNameAr || 'كيان كاشير'}* 📊`);
    lines.push(`🏢 *الفرع / المتجر:* ${settings.storeNameAr}`);
    lines.push(`📅 *التاريخ:* ${dateFormatted}`);
    lines.push(`⏰ *الوقت:* ${timeFormatted}`);
    lines.push(`👤 *المسؤول / الكاشير:* ${currentUser.name} (${currentUser.role})`);
    lines.push(`━━━━━━━━━━━━━━━━━━━━━`);

    lines.push(`💰 *الملخص المالي ومؤشرات الأداء:*`);
    lines.push(`▫️ إجمالي الإيرادات اليومية: *${formatCurrency(todayRevenue)}*`);
    lines.push(`▫️ عدد المعاملات (الفواتير): *${todayInvoicesCount} فاتورة*`);
    lines.push(`▫️ متوسط قيمة الفاتورة (AOV): *${formatCurrency(todayAOV)}*`);
    lines.push(`▫️ إجمالي المصروفات اليومية: *${formatCurrency(todayExpensesTotal)}*`);
    lines.push(`▫️ صافي الربح اليومي التقديري: *${formatCurrency(todayNetProfit)}*`);
    lines.push(``);

    lines.push(`💳 *تفصيل طرق التحصيل:*`);
    lines.push(`▫️ 💵 نقداً بالصندوق (Cash): *${formatCurrency(cashSalesTotal)}*`);
    lines.push(`▫️ 💳 بطاقة إلكترونية (Card): *${formatCurrency(cardSalesTotal)}*`);
    if (transferSalesTotal > 0) {
      lines.push(`▫️ 📱 تحويل / آجل (Other): *${formatCurrency(transferSalesTotal)}*`);
    }

    if (parsedActualCash !== null) {
      lines.push(``);
      lines.push(`🔒 *مطابقة النقدية في الدرج:*`);
      lines.push(`▫️ النقد الفعلي المحصي: *${formatCurrency(parsedActualCash)}*`);
      if (cashVariance === 0) {
        lines.push(`▫️ النتيجة: *متطابق تماماً 100% بدون فروقات ✅*`);
      } else if (cashVariance > 0) {
        lines.push(`▫️ النتيجة: *فائض في الصندوق بمقدار +${formatCurrency(cashVariance)} 🟢*`);
      } else {
        lines.push(`▫️ النتيجة: *عجز في الصندوق بمقدار ${formatCurrency(cashVariance)} 🔴*`);
      }
    }

    if (includeInventory) {
      lines.push(``);
      lines.push(`📦 *جرد حركة المخزون اليومي:*`);
      lines.push(`▫️ إجمالي القطع المباعة اليوم: *${inventoryTodayStats.totalUnitsSold} قطعة*`);
      lines.push(`▫️ أصناف تم بيعها اليوم: *${inventoryTodayStats.distinctProductsCount} صنف*`);
      
      if (inventoryTodayStats.topSoldItems.length > 0) {
        lines.push(`\n🔝 *أعلى الأصناف مبيعاً اليوم:*`);
        inventoryTodayStats.topSoldItems.forEach((item, idx) => {
          lines.push(`${idx + 1}. ${item.name} (${item.qty} قطعة — ${formatCurrency(item.total)})`);
        });
      }

      if (inventoryTodayStats.lowStockItems.length > 0) {
        lines.push(`\n⚠️ *تنبيه نقص المخزون (${inventoryTodayStats.lowStockItems.length} أصناف وصلت لحد الطلب):*`);
        inventoryTodayStats.lowStockItems.slice(0, 4).forEach(p => {
          lines.push(`• ${p.nameAr}: المتبقي ${p.stock} ${p.unit} (الحد: ${p.minStock})`);
        });
      }
    }

    lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`✅ *تم إصدار وتوثيق الجرد آلياً بنظام KIAN CASHIER*`);

    return lines.join('\n');
  }, [
    settings,
    dateFormatted,
    timeFormatted,
    currentUser,
    formatCurrency,
    todayRevenue,
    todayInvoicesCount,
    todayAOV,
    todayExpensesTotal,
    todayNetProfit,
    cashSalesTotal,
    cardSalesTotal,
    transferSalesTotal,
    parsedActualCash,
    cashVariance,
    includeInventory,
    inventoryTodayStats
  ]);

  if (!isOpen) return null;

  // Clean and prepare WhatsApp Link
  const cleanPhone = phoneNumber.replace(/[^0-9+]/g, '').replace('+', '');
  const encodedText = encodeURIComponent(reportMessage);
  const whatsappUrl = cleanPhone 
    ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`
    : `https://api.whatsapp.com/send?text=${encodedText}`;

  const handleSendToWhatsApp = () => {
    // Save updated settings
    updateSettings({
      managerWhatsappPhone: phoneNumber,
      autoSendDailyReportOnClose: autoSendOnClose,
      includeInventoryInReport: includeInventory
    });

    logAudit(
      'إرسال الجرد اليومي إلى واتساب',
      `تم إرسال تقرير الإغلاق والمبيعات (إيراد: ${todayRevenue} - فواتير: ${todayInvoicesCount}) إلى الرقم: ${phoneNumber}`,
      'medium'
    );

    soundEffects.playSuccess();
    notify('جاري الإرسال عبر WhatsApp', 'تم تجهيز تقرير الجرد اليومي وإرساله بنجاح', 'success');

    // Open WhatsApp in new tab / application
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    onClose();
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(reportMessage);
    setCopied(true);
    soundEffects.playSuccess();
    notify('تم النسخ بنجاح', 'تم نسخ تقرير الجرد اليومي بالكامل إلى الحافظة', 'info');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 via-amber-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>{t('sendDailyReportToWhatsApp')}</span>
                <span className="text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full">
                  إرسال فوري تلقائي
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('dailyClosingSubtitle')}
              </p>
            </div>
          </div>

          <button
            id="btn-close-whatsapp-modal"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Key KPI Quick Bar */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 block">
                {t('dailyRevenue')}
              </span>
              <span className="text-sm font-black text-amber-600 dark:text-amber-400 font-mono">
                {formatCurrency(todayRevenue)}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-center">
              <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 block">
                {t('transactionCount')}
              </span>
              <span className="text-sm font-black text-blue-600 dark:text-blue-400 font-mono">
                {todayInvoicesCount}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 block">
                {t('averageOrderValue')}
              </span>
              <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {formatCurrency(todayAOV)}
              </span>
            </div>
          </div>

          {/* Configuration Form: Phone Number & Options */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-700/70 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{t('managerPhone')} (مع رمز الدولة)</span>
                </label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value)}
                  placeholder="+963 933 123 456"
                  className="w-full text-xs font-mono font-bold px-3.5 py-2.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Cash Reconciliation input (Optional) */}
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5 text-amber-500" />
                  <span>المبلغ الفعلي في الدرج (اختياري للمطابقة)</span>
                </label>
                <input
                  type="number"
                  value={actualCashInDrawer}
                  onChange={e => setActualCashInDrawer(e.target.value)}
                  placeholder={`المتوقع: ${cashSalesTotal}`}
                  className="w-full text-xs font-mono font-bold px-3.5 py-2.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Reconciliation outcome badge if cash entered */}
            {parsedActualCash !== null && (
              <div className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-between ${
                cashVariance === 0 
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                  : cashVariance > 0
                    ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20'
                    : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20'
              }`}>
                <span>{cashVariance === 0 ? '✅ النقدية متطابقة تماماً بدون أي عجز' : cashVariance > 0 ? `🟢 فائض نقدي في الصندوق (+${formatCurrency(cashVariance)})` : `🔴 عجز في الصندوق (${formatCurrency(cashVariance)})`}</span>
                <span className="font-mono">{formatCurrency(parsedActualCash)}</span>
              </div>
            )}

            {/* Toggles */}
            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeInventory}
                  onChange={e => setIncludeInventory(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 rounded"
                />
                <span className="text-slate-700 dark:text-slate-300 font-semibold">
                  تضمين جرد حركة المخزون والأصناف المنخفضة
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSendOnClose}
                  onChange={e => setAutoSendOnClose(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 rounded"
                />
                <span className="text-slate-700 dark:text-slate-300 font-semibold">
                  تفعيل الإرسال التلقائي كخيار افتراضي
                </span>
              </label>
            </div>
          </div>

          {/* WhatsApp Chat Preview Bubble */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                <span>معاينة نص التقرير كما سيصل للمستلم عبر واتساب:</span>
              </span>

              <button
                type="button"
                onClick={handleCopyMessage}
                className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'تم النسخ' : 'نسخ النص'}</span>
              </button>
            </div>

            <div className="bg-[#e5ddd5]/30 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl rounded-tr-none shadow-xs border border-emerald-500/20 max-h-60 overflow-y-auto font-mono text-[11px] leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap select-text">
                {reportMessage}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            {t('cancel')}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyMessage}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
            >
              <Copy className="w-4 h-4" />
              <span>نسخ فقط</span>
            </button>

            <button
              id="btn-confirm-send-whatsapp"
              type="button"
              onClick={handleSendToWhatsApp}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-black shadow-md shadow-emerald-600/20 transition-all"
            >
              <Send className="w-4 h-4" />
              <span>إرسال الجرد عبر WhatsApp الآن</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
