import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquareShare,
  Send,
  Calendar,
  Clock,
  KeyRound,
  Sliders,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  DollarSign,
  Receipt,
  UserCheck,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  Filter,
  History,
  Eye,
  FileText,
  HelpCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StoreSettings, Customer, Sale } from '../../types';
import {
  AVAILABLE_TEMPLATE_VARIABLES,
  DEFAULT_TEMPLATES,
  DebtReminderLog,
  DEBT_COLLECTION_STORAGE_KEY,
  testWhatsAppCloudApiConnection,
  checkAndSendPeriodicDebtReminders,
  formatPhoneForWhatsApp,
  getWhatsAppClickToChatUrl
} from '../../services/debtCollectionService';

interface WhatsAppDebtAutomationDashboardProps {
  onClose?: () => void;
  isModal?: boolean;
}

type TemplateKey = 'invoice_created' | 'periodic_reminder' | 'overdue_notice' | 'payment_receipt';

export const WhatsAppDebtAutomationDashboard: React.FC<WhatsAppDebtAutomationDashboardProps> = ({
  onClose,
  isModal = false
}) => {
  const {
    settings,
    updateSettings,
    customers,
    sales,
    notify,
    language
  } = useApp();

  const [formData, setFormData] = useState<StoreSettings>({ ...settings });
  const [activeTemplateTab, setActiveTemplateTab] = useState<TemplateKey>('periodic_reminder');
  const [activeViewSection, setActiveViewSection] = useState<'settings_and_templates' | 'logs_history'>('settings_and_templates');

  // WhatsApp API Testing State
  const [testPhoneNumber, setTestPhoneNumber] = useState<string>(settings.managerWhatsappPhone || '+963933123456');
  const [isTestingApi, setIsTestingApi] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Manual Batch Dispatch State
  const [isBatchSending, setIsBatchSending] = useState<boolean>(false);

  // Copied Preview Message State
  const [copiedPreview, setCopiedPreview] = useState<boolean>(false);

  // Reminder Logs State
  const [logs, setLogs] = useState<DebtReminderLog[]>([]);
  const [logSearchQuery, setLogSearchQuery] = useState<string>('');
  const [logTypeFilter, setLogTypeFilter] = useState<string>('all');

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load Reminder Logs
  useEffect(() => {
    try {
      const stored = localStorage.getItem(DEBT_COLLECTION_STORAGE_KEY);
      if (stored) {
        setLogs(JSON.parse(stored));
      }
    } catch {
      setLogs([]);
    }
  }, []);

  // Update local form state when settings change
  useEffect(() => {
    setFormData({ ...settings });
  }, [settings]);

  // Total customers with active debt
  const debtors = customers.filter(c => (c.currentDebt || 0) > 0);
  const totalOutstandingDebt = debtors.reduce((sum, c) => sum + (c.currentDebt || 0), 0);
  const currencySymbol = settings.currency.symbolNative || settings.currency.symbol || 'ل.س';

  // Get active template content
  const getCurrentTemplateContent = (key: TemplateKey): string => {
    if (key === 'invoice_created') {
      return formData.debtInvoiceMessageTemplate || DEFAULT_TEMPLATES.invoice_created;
    }
    if (key === 'periodic_reminder') {
      return formData.debtReminderMessageTemplate || DEFAULT_TEMPLATES.periodic_reminder;
    }
    if (key === 'overdue_notice') {
      return formData.debtOverdueMessageTemplate || DEFAULT_TEMPLATES.overdue_notice;
    }
    if (key === 'payment_receipt') {
      return formData.debtPaymentReceiptTemplate || DEFAULT_TEMPLATES.payment_receipt;
    }
    return '';
  };

  // Set active template content
  const setCurrentTemplateContent = (key: TemplateKey, value: string) => {
    if (key === 'invoice_created') {
      setFormData(prev => ({ ...prev, debtInvoiceMessageTemplate: value }));
    } else if (key === 'periodic_reminder') {
      setFormData(prev => ({ ...prev, debtReminderMessageTemplate: value }));
    } else if (key === 'overdue_notice') {
      setFormData(prev => ({ ...prev, debtOverdueMessageTemplate: value }));
    } else if (key === 'payment_receipt') {
      setFormData(prev => ({ ...prev, debtPaymentReceiptTemplate: value }));
    }
  };

  // Reset current template to default
  const handleResetCurrentTemplate = () => {
    setCurrentTemplateContent(activeTemplateTab, DEFAULT_TEMPLATES[activeTemplateTab]);
    notify('تمت الاستعادة', 'تمت استعادة القالب الافتراضي للنص بنجاح', 'info');
  };

  // Insert Variable Tag at cursor position
  const handleInsertVariable = (tag: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      const current = getCurrentTemplateContent(activeTemplateTab);
      setCurrentTemplateContent(activeTemplateTab, current + ' ' + tag);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = getCurrentTemplateContent(activeTemplateTab);
    const updated = current.substring(0, start) + tag + current.substring(end);
    setCurrentTemplateContent(activeTemplateTab, updated);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tag.length, start + tag.length);
    }, 50);
  };

  // Generate Simulated Preview Message for active template
  const generateSimulatedPreview = (key: TemplateKey): string => {
    const rawTemplate = getCurrentTemplateContent(key);
    const storeName = formData.storeNameAr || 'سوبرماركت البركة';
    const storePhone = formData.phone || formData.mobile || formData.managerWhatsappPhone || '+963933123456';
    const storeAddress = formData.address || 'دمشق - المزة شارع المعارض';
    const sampleCustomer = debtors[0] || { name: 'أحمد العلي', currentDebt: 350000 };
    const sampleRemaining = 250000;
    const sampleTotal = 300000;
    const samplePaid = 50000;
    const sampleItems = `1. *زيت زيتون بكر ممتاز 5L* × 2 = 180,000 ${currencySymbol}\n2. *أرز بسمتي درجة أولى 5KG* × 1 = 70,000 ${currencySymbol}`;
    
    let usdNote = '';
    const bulletin = formData.exchangeBulletin;
    if (bulletin && bulletin.usdSellRate > 0) {
      const usdAmount = (sampleRemaining / bulletin.usdSellRate).toFixed(2);
      const usdTotal = (sampleCustomer.currentDebt / bulletin.usdSellRate).toFixed(2);
      usdNote = `\n💱 *المعادل بسعر صرف الليرة اليوم (${bulletin.usdSellRate.toLocaleString()} ل.س/$):*\n💵 قيمة دين الفاتورة: حوالي *$${usdAmount}*\n💵 إجمالي الذمة بالدولار: حوالي *$${usdTotal}* (موقع الليرة اليوم)\n`;
    }

    return rawTemplate
      .replace(/{customer_name}/g, sampleCustomer.name)
      .replace(/{store_name}/g, storeName)
      .replace(/{invoice_number}/g, 'INV-2026-0419')
      .replace(/{invoice_date}/g, new Date().toLocaleDateString('ar-SY', { dateStyle: 'full' }))
      .replace(/{items_list}/g, sampleItems)
      .replace(/{total_amount}/g, `${sampleTotal.toLocaleString()} ${currencySymbol}`)
      .replace(/{paid_amount}/g, `${samplePaid.toLocaleString()} ${currencySymbol}`)
      .replace(/{remaining_amount}/g, `${sampleRemaining.toLocaleString()} ${currencySymbol}`)
      .replace(/{total_customer_debt}/g, `${sampleCustomer.currentDebt.toLocaleString()} ${currencySymbol}`)
      .replace(/{debt_amount}/g, `${sampleCustomer.currentDebt.toLocaleString()} ${currencySymbol}`)
      .replace(/{usd_equivalent}/g, usdNote)
      .replace(/{usd_rate}/g, bulletin?.usdSellRate ? `${bulletin.usdSellRate.toLocaleString()} ل.س/$` : '15,100 ل.س/$')
      .replace(/{days}/g, String(formData.debtReminderDays || 7))
      .replace(/{store_phone}/g, storePhone)
      .replace(/{store_address}/g, storeAddress)
      .replace(/{payment_amount}/g, `100,000 ${currencySymbol}`)
      .replace(/{voucher_number}/g, 'REC-9081');
  };

  // Copy Preview Message
  const handleCopyPreview = () => {
    const text = generateSimulatedPreview(activeTemplateTab);
    navigator.clipboard.writeText(text);
    setCopiedPreview(true);
    notify('تم النسخ', 'تم نسخ نص المعاينة إلى الحافظة', 'success');
    setTimeout(() => setCopiedPreview(false), 2000);
  };

  // Save Settings
  const handleSaveSettings = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    updateSettings(formData);
    notify('تم حفظ الإعدادات', 'تم حفظ وتحديث إعدادات التذكير الآلي وقوالب واتساب بنجاح', 'success');
  };

  // Test WhatsApp Connection
  const handleTestConnection = async () => {
    if (!formData.whatsappApiKey || !formData.whatsappPhoneId) {
      notify('تنبيه', 'يرجى إدخال Phone Number ID و API Token أولاً للاختبار', 'warning');
      return;
    }
    setIsTestingApi(true);
    setTestResult(null);
    try {
      const res = await testWhatsAppCloudApiConnection({
        apiKey: formData.whatsappApiKey,
        phoneNumberId: formData.whatsappPhoneId,
        testPhone: testPhoneNumber
      });
      setTestResult(res);
      if (res.success) {
        notify('نجح الاختبار', res.message, 'success');
      } else {
        notify('فشل الاختبار', res.message, 'error');
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'خطأ في الاتصال' });
      notify('خطأ في الاتصال', err.message || 'فشل الاتصال', 'error');
    } finally {
      setIsTestingApi(false);
    }
  };

  // Manual Immediate Batch Reminder Trigger
  const handleTriggerBatchRemindersNow = () => {
    if (debtors.length === 0) {
      notify('لا توجد ديون', 'لا يوجد أي عميل مسجل عليه رصيد ذمة حالياً', 'info');
      return;
    }
    setIsBatchSending(true);
    try {
      const count = checkAndSendPeriodicDebtReminders({
        customers,
        storeSettings: formData,
        bulletin: formData.exchangeBulletin,
        onReminderTriggered: (cust) => {
          console.log(`Reminder sent to ${cust.name}`);
        }
      });

      // Reload logs
      try {
        const stored = localStorage.getItem(DEBT_COLLECTION_STORAGE_KEY);
        if (stored) setLogs(JSON.parse(stored));
      } catch (e) {
        console.error(e);
      }

      if (count > 0) {
        notify('تم إرسال التذكيرات', `تم إرسال رسائل تذكير لـ (${count}) عميل بنجاح`, 'success');
      } else {
        notify('تم الفحص', 'تم فحص الحسابات، وجميع العملاء تم تذكيرهم مؤخراً ضمن الفترة المحددة', 'info');
      }
    } catch (err: any) {
      notify('خطأ', err.message || 'فشل الإرسال الجماعي', 'error');
    } finally {
      setIsBatchSending(false);
    }
  };

  // Filtered Reminder Logs
  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      log.customerName.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
      log.customerPhone.includes(logSearchQuery) ||
      (log.invoiceNumber && log.invoiceNumber.toLowerCase().includes(logSearchQuery.toLowerCase()));
    const matchesType = logTypeFilter === 'all' || log.type === logTypeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className={`space-y-6 ${isModal ? 'p-1' : 'max-w-6xl mx-auto'} animate-in fade-in`}>
      {/* Top Hero Banner & Status Summary */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-slate-900 rounded-3xl p-6 text-white shadow-xl shadow-emerald-950/20 relative overflow-hidden">
        <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                <MessageSquareShare className="w-6 h-6 text-emerald-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black">لوحة تحكم التذكير الآلي بالديون (WhatsApp Business)</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                    نظام آلي متكامل
                  </span>
                </div>
                <p className="text-xs text-emerald-100/90 font-medium">
                  جدولة وتيرة التذكيرات الدورية، تخصيص قوالب الرسائل، والإرسال التلقائي للفواتير وسندات القبض
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats & Action */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 text-center">
              <span className="text-[10px] text-emerald-200 block font-bold">العملاء المدينون</span>
              <span className="text-base font-black font-mono">{debtors.length} عميل</span>
            </div>

            <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 text-center">
              <span className="text-[10px] text-emerald-200 block font-bold">إجمالي الذمم المعلقة</span>
              <span className="text-base font-black font-mono">{totalOutstandingDebt.toLocaleString()} {currencySymbol}</span>
            </div>

            <button
              type="button"
              disabled={isBatchSending || debtors.length === 0}
              onClick={handleTriggerBatchRemindersNow}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-2xl shadow-lg shadow-emerald-500/30 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isBatchSending ? 'animate-spin' : ''}`} />
              <span>فحص وتذكير جماعي الآن</span>
            </button>
          </div>
        </div>

        {/* View Toggle Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={() => setActiveViewSection('settings_and_templates')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeViewSection === 'settings_and_templates'
                ? 'bg-white text-slate-950 shadow-md'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-emerald-600" />
            <span>إعدادات الجدولة والقوالب</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveViewSection('logs_history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeViewSection === 'logs_history'
                ? 'bg-white text-slate-950 shadow-md'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <History className="w-3.5 h-3.5 text-amber-500" />
            <span>سجل الرسائل والتذكيرات ({logs.length})</span>
          </button>
        </div>
      </div>

      {activeViewSection === 'settings_and_templates' ? (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* Section 1: Frequency & Timing Configuration */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    1. وتيرة إرسال التذكيرات والجدولة الزمنية
                  </h3>
                  <p className="text-xs text-slate-400">
                    حدد الفواصل الزمنية لإرسال رسائل التذكير التلقائية لعملاء الديون
                  </p>
                </div>
              </div>

              {/* Master Toggle */}
              <label className="flex items-center gap-2 cursor-pointer bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                <input
                  type="checkbox"
                  checked={formData.autoSendDebtReminders !== false}
                  onChange={e => setFormData({ ...formData, autoSendDebtReminders: e.target.checked })}
                  className="w-4 h-4 accent-emerald-600 rounded"
                />
                <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                  {formData.autoSendDebtReminders !== false ? 'التذكير الآلي مفعّل' : 'التذكير الآلي متوقف'}
                </span>
              </label>
            </div>

            {/* Frequency Selection Cards */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                اختر وتيرة التذكير الدورية:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { id: 'daily', days: 1, label: 'يومياً', desc: 'كل 24 ساعة' },
                  { id: 'every_3_days', days: 3, label: 'كل 3 أيام', desc: 'متابعة حثيثة' },
                  { id: 'weekly', days: 7, label: 'أسبوعياً', desc: 'كل 7 أيام (موصى به)' },
                  { id: 'biweekly', days: 14, label: 'كل أسبوعين', desc: 'كل 14 يوماً' },
                  { id: 'monthly', days: 30, label: 'شهرياً', desc: 'كل 30 يوماً' },
                  { id: 'custom', days: formData.debtReminderDays || 5, label: 'مخصص', desc: 'تحديد الأيام يدوياً' }
                ].map(freq => {
                  const isSelected =
                    (formData.debtReminderFrequency === freq.id) ||
                    (!formData.debtReminderFrequency && formData.debtReminderDays === freq.days);

                  return (
                    <button
                      key={freq.id}
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          debtReminderFrequency: freq.id as any,
                          debtReminderDays: freq.days
                        });
                      }}
                      className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer relative ${
                        isSelected
                          ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 shadow-sm ring-2 ring-emerald-500/20'
                          : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-2 left-2 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                      <span className={`block text-xs font-black ${isSelected ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-800 dark:text-slate-200'}`}>
                        {freq.label}
                      </span>
                      <span className="block text-[10px] text-slate-400 mt-0.5 font-medium">
                        {freq.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Interval & Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  عدد الأيام الفاصلة بدقة:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={formData.debtReminderDays || 7}
                    onChange={e => setFormData({ ...formData, debtReminderDays: Math.max(1, Number(e.target.value)) })}
                    className="w-full text-xs font-mono font-bold px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 text-center"
                  />
                  <span className="text-xs font-bold text-slate-500 shrink-0">يوم</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  الحد الأدنى لمبلغ الدين الخاضع للتذكير:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    placeholder="0 = الجميع"
                    value={formData.debtReminderMinThreshold || 0}
                    onChange={e => setFormData({ ...formData, debtReminderMinThreshold: Number(e.target.value) || 0 })}
                    className="w-full text-xs font-mono font-bold px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 text-center"
                  />
                  <span className="text-xs font-bold text-slate-500 shrink-0">{currencySymbol}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ساعة الإرسال المفضلة:
                </label>
                <select
                  value={formData.debtReminderPreferredHour || 10}
                  onChange={e => setFormData({ ...formData, debtReminderPreferredHour: Number(e.target.value) })}
                  className="w-full text-xs font-bold px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700"
                >
                  <option value={9}>09:00 صباحاً (بداية الدوام)</option>
                  <option value={10}>10:00 صباحاً (الموعد الأفضل)</option>
                  <option value={12}>12:00 ظهراً</option>
                  <option value={16}>04:00 عصراً</option>
                  <option value={18}>06:00 مساءً</option>
                </select>
              </div>
            </div>

            {/* Event Triggers Checklist */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.autoSendDebtInvoiceWhatsApp !== false}
                  onChange={e => setFormData({ ...formData, autoSendDebtInvoiceWhatsApp: e.target.checked })}
                  className="w-4 h-4 accent-emerald-600 rounded"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    إرسال إشعار فوري عند صدور فاتورة مبيعات بالآجل
                  </span>
                  <span className="text-[10px] text-slate-400">
                    يتم إرسال تفاصيل الفاتورة وقائمة الأصناف للعميل بمجرد الحفظ
                  </span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.autoSendDebtPaymentWhatsApp !== false}
                  onChange={e => setFormData({ ...formData, autoSendDebtPaymentWhatsApp: e.target.checked })}
                  className="w-4 h-4 accent-emerald-600 rounded"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    إرسال سند قبض وشكر تلقائياً عند تسديد أي دفعة
                  </span>
                  <span className="text-[10px] text-slate-400">
                    إشعار فوري بالمبلغ المستلم والرصيد المتبقي بعد التسديد
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Section 2: Multi-Template Builder with Live Interactive WhatsApp Phone Simulator */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    2. تخصيص قوالب الرسائل مع المعاينة الحية
                  </h3>
                  <p className="text-xs text-slate-400">
                    قم بتعديل صيغة الرسائل وإدراج المتغيرات الديناميكية كاسم العميل والمبالغ المتبقية
                  </p>
                </div>
              </div>

              {/* Reset Current Template */}
              <button
                type="button"
                onClick={handleResetCurrentTemplate}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>استعادة الصيغة الافتراضية</span>
              </button>
            </div>

            {/* Template Selector Tabs */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'periodic_reminder', label: 'تذكير دوري لطيف بالدين' },
                { id: 'invoice_created', label: 'فاتورة مبيعات آجلة جديدة' },
                { id: 'overdue_notice', label: 'تنبيه استحقاق ديون متأخرة' },
                { id: 'payment_receipt', label: 'إشعار سند قبض وتسديد' }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTemplateTab(tab.id as TemplateKey)}
                  className={`px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                    activeTemplateTab === tab.id
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Template Editor Grid: Left = Editor & Variables, Right = Live WhatsApp Phone Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
              {/* Left Column: Editor (7 cols) */}
              <div className="lg:col-span-7 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    نص القالب المخصص:
                  </label>
                  <span className="text-[11px] font-mono text-slate-400">
                    {getCurrentTemplateContent(activeTemplateTab).length} حرف
                  </span>
                </div>

                <textarea
                  ref={textareaRef}
                  rows={13}
                  value={getCurrentTemplateContent(activeTemplateTab)}
                  onChange={e => setCurrentTemplateContent(activeTemplateTab, e.target.value)}
                  placeholder="أدخل نص الرسالة مع المتغيرات..."
                  className="w-full text-xs font-sans p-4 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-emerald-500 leading-relaxed"
                />

                {/* Variable Inserter Chips */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>انقر لإدراج متغير في النص:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                    {AVAILABLE_TEMPLATE_VARIABLES.map(v => (
                      <button
                        key={v.tag}
                        type="button"
                        onClick={() => handleInsertVariable(v.tag)}
                        className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950 text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-300 border border-slate-200 dark:border-slate-700 text-[11px] font-bold shadow-2xs transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                        title={v.description}
                      >
                        <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{v.tag}</span>
                        <span className="text-[10px] text-slate-400">({v.label})</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Additional Toggles for Invoicing */}
                {activeTemplateTab === 'invoice_created' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.includeItemsListInDebtMessage !== false}
                        onChange={e => setFormData({ ...formData, includeItemsListInDebtMessage: e.target.checked })}
                        className="w-4 h-4 accent-emerald-600 rounded"
                      />
                      <span>تضمين قائمة الأصناف المشتراة بالتفصيل</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.includeExchangeRateInDebtMessage !== false}
                        onChange={e => setFormData({ ...formData, includeExchangeRateInDebtMessage: e.target.checked })}
                        className="w-4 h-4 accent-emerald-600 rounded"
                      />
                      <span>تضمين المعادل بالدولار (موقع الليرة اليوم)</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Right Column: Live Interactive WhatsApp Simulator (5 cols) */}
              <div className="lg:col-span-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-emerald-600" />
                    <span>محاكي واتساب (معاينة حية):</span>
                  </span>

                  <button
                    type="button"
                    onClick={handleCopyPreview}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
                  >
                    {copiedPreview ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedPreview ? 'تم النسخ' : 'نسخ النص'}</span>
                  </button>
                </div>

                {/* WhatsApp Chat Simulator Frame */}
                <div className="bg-[#0b141a] rounded-3xl p-4 shadow-xl border border-slate-700 text-slate-100 flex flex-col justify-between min-h-[420px]">
                  {/* WhatsApp Top Header Bar */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#202c33]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-xs">
                        {formData.storeNameAr ? formData.storeNameAr[0] : 'ك'}
                      </div>
                      <div>
                        <span className="text-xs font-black block text-slate-100">
                          {formData.storeNameAr || 'متجرنا'} (حساب أعمال)
                        </span>
                        <span className="text-[10px] text-emerald-400 block font-medium">متصل الآن</span>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono text-slate-400">
                      {new Date().toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* WhatsApp Message Bubble */}
                  <div className="my-auto py-3">
                    <div className="bg-[#005c4b] text-slate-100 p-3.5 rounded-2xl rounded-tr-none text-xs leading-relaxed space-y-2 shadow-sm whitespace-pre-wrap font-sans text-right max-h-80 overflow-y-auto">
                      {generateSimulatedPreview(activeTemplateTab)}
                    </div>
                    <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400 mt-1 pl-1">
                      <span>{new Date().toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' })}</span>
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    </div>
                  </div>

                  {/* Simulator Footer */}
                  <div className="pt-2 border-t border-[#202c33] text-center text-[10px] text-slate-400">
                    معاينة محاكاة لهاتف العميل المستلم
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: WhatsApp Cloud API & Connection Gateway */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    3. بيانات ربط WhatsApp Business Cloud API (اختياري للإرسال الآلي المباشر)
                  </h3>
                  <p className="text-xs text-slate-400">
                    عند إدخال الـ Token يتم الإرسال من السيرفر بدون تدخل يدوي. في حال عدم إدخاله، يفتح النظام رابط واتساب السريع تلقائياً
                  </p>
                </div>
              </div>

              <a
                href="https://developers.facebook.com/docs/whatsapp/cloud-api"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-bold"
              >
                <span>دليل Meta الرسمي</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  معرّف رقم الهاتف (Phone Number ID)
                </label>
                <input
                  type="text"
                  placeholder="109283746592817"
                  value={formData.whatsappPhoneId || ''}
                  onChange={e => setFormData({ ...formData, whatsappPhoneId: e.target.value })}
                  className="w-full text-xs font-mono font-bold px-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  مفتاح الوصول الدائم (Permanent API Token)
                </label>
                <input
                  type="password"
                  placeholder="EAABw..."
                  value={formData.whatsappApiKey || ''}
                  onChange={e => setFormData({ ...formData, whatsappApiKey: e.target.value })}
                  className="w-full text-xs font-mono font-bold px-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>

            {/* Test Connection Box */}
            <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-emerald-600" />
                  <span>اختبار جاهزية الإرسال عبر API:</span>
                </span>
                <p className="text-[11px] text-slate-500">
                  إرسال رسالة فحص للتأكد من صحة المفاتيح قبل بدء الجدولة التلقائية
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="+9639XXXXXXXX"
                  value={testPhoneNumber}
                  onChange={e => setTestPhoneNumber(e.target.value)}
                  className="text-xs font-mono font-bold px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-300 dark:border-slate-700 w-36 text-center"
                />
                <button
                  type="button"
                  disabled={isTestingApi}
                  onClick={handleTestConnection}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTestingApi ? 'animate-spin' : ''}`} />
                  <span>إرسال تجريبي</span>
                </button>
              </div>
            </div>

            {testResult && (
              <div className={`p-3 rounded-xl text-xs font-bold ${
                testResult.success
                  ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/50 dark:text-emerald-200 border border-emerald-300'
                  : 'bg-rose-100 text-rose-900 dark:bg-rose-900/50 dark:text-rose-200 border border-rose-300'
              }`}>
                {testResult.message}
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer ${
                !isModal ? 'hidden' : ''
              }`}
            >
              إغلاق
            </button>

            <button
              type="submit"
              className="flex items-center gap-2 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-2xl shadow-lg shadow-emerald-600/25 transition-all cursor-pointer active:scale-95 ml-auto"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>حفظ وتطبيق إعدادات التذكير الآلي</span>
            </button>
          </div>
        </form>
      ) : (
        /* Logs & History Section */
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                سجل إشعارات وتذكيرات الواتساب المرسلة
              </h3>
              <p className="text-xs text-slate-400">
                تتبع كامل لكافة الرسائل التلقائية واليدوية الصادرة من النظام
              </p>
            </div>

            {/* Filter and Search */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="بحث باسم العميل أو الهاتف..."
                value={logSearchQuery}
                onChange={e => setLogSearchQuery(e.target.value)}
                className="text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 w-48"
              />

              <select
                value={logTypeFilter}
                onChange={e => setLogTypeFilter(e.target.value)}
                className="text-xs font-bold px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700"
              >
                <option value="all">كل الأنواع</option>
                <option value="scheduled_reminder">تذكير دوري</option>
                <option value="invoice_created">فاتورة آجل</option>
                <option value="manual_reminder">تذكير يدوي</option>
                <option value="payment_receipt">سند قبض</option>
              </select>
            </div>
          </div>

          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <MessageSquareShare className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-xs font-bold text-slate-500">لا توجد رسائل مسجلة في السجل حتى الآن</p>
              <p className="text-[11px] text-slate-400">
                ستظهر هنا كافة إشعارات الفواتير والتذكيرات الدورية فور إرسالها
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold">
                    <th className="pb-3 pr-2">العميل</th>
                    <th className="pb-3">الهاتف</th>
                    <th className="pb-3">نوع الإشعار</th>
                    <th className="pb-3">المبلغ</th>
                    <th className="pb-3">طريقة الإرسال</th>
                    <th className="pb-3">الوقت</th>
                    <th className="pb-3 text-center">الحالة</th>
                    <th className="pb-3 text-left pl-2">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 pr-2 font-black text-slate-900 dark:text-white">
                        {log.customerName}
                      </td>
                      <td className="py-3 font-mono text-slate-600 dark:text-slate-300 text-[11px]">
                        {log.customerPhone}
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                          log.type === 'scheduled_reminder'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : log.type === 'invoice_created'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        }`}>
                          {log.type === 'scheduled_reminder' && 'تذكير دوري'}
                          {log.type === 'invoice_created' && 'فاتورة آجل'}
                          {log.type === 'manual_reminder' && 'تذكير يدوي'}
                          {log.type === 'payment_receipt' && 'سند قبض'}
                          {log.type === 'overdue_notice' && 'تنبيه استحقاق'}
                        </span>
                      </td>
                      <td className="py-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {log.amountDue?.toLocaleString()} {log.currencySymbol || currencySymbol}
                      </td>
                      <td className="py-3 text-[11px] text-slate-500">
                        {log.method === 'direct_api' ? 'سحابي (API)' : 'رابط واتساب'}
                      </td>
                      <td className="py-3 text-[10px] text-slate-400 font-mono">
                        {new Date(log.sentAt).toLocaleString('ar-SY', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="py-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                          {log.status === 'sent' ? 'مرسل' : 'فُتح بواتساب'}
                        </span>
                      </td>
                      <td className="py-3 text-left pl-2">
                        <button
                          type="button"
                          onClick={() => {
                            const url = getWhatsAppClickToChatUrl(log.customerPhone, log.messageText);
                            window.open(url, '_blank');
                          }}
                          className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                        >
                          إعادة إرسال
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
