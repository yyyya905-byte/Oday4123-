import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Wrench,
  X,
  Coins,
  Barcode as BarcodeIcon,
  Radio,
  ArrowLeftRight,
  Cloud,
  Sparkles,
  Leaf,
  SlidersHorizontal,
  Database,
  RefreshCw,
  Printer,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Wifi,
  WifiOff,
  Battery,
  BatteryCharging,
  Zap,
  ExternalLink,
  Store,
  UtensilsCrossed,
  Building2,
  CheckCircle2
} from 'lucide-react';
import { canAccessTab } from '../../utils/permissions';
import { GoogleIcon } from '../common/GoogleIcon';

interface ToolsHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenBulletin: () => void;
  onOpenBarcodeDesigner: () => void;
}

export const ToolsHubModal: React.FC<ToolsHubModalProps> = ({
  isOpen,
  onClose,
  onOpenBulletin,
  onOpenBarcodeDesigner
}) => {
  const {
    language,
    settings,
    businessMode,
    setIsModeModalOpen,
    setActiveTab,
    isOnline,
    offlineQueueCount,
    isSyncingOffline,
    syncOfflineQueueNow,
    isPowerSavingActive,
    togglePowerSaving,
    batteryInfo,
    devices,
    currentUser,
    setIsDataTransferModalOpen
  } = useApp();

  if (!isOpen) return null;

  const isRtl = language === 'ar';
  const onlineDevicesCount = devices.filter(d => d.isOnline).length;
  const isGoogleDriveConnected = Boolean(settings.googleDriveConnected);

  const modeBadge = {
    restaurant: {
      label: language === 'ar' ? 'نمط المطاعم والكافيهات' : 'Restaurant Mode',
      icon: UtensilsCrossed,
      color: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
    },
    wholesale: {
      label: language === 'ar' ? 'نمط تجارة الجملة والتوزيع' : 'Wholesale Mode',
      icon: Building2,
      color: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
    },
    retail: {
      label: language === 'ar' ? 'نمط التجزئة والسوبرماركت' : 'Retail Mode',
      icon: Store,
      color: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800'
    }
  }[businessMode];

  const ModeIcon = modeBadge.icon;

  const handleToolAction = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tools-hub-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div 
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-900 dark:text-slate-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 id="tools-hub-title" className="text-base font-black tracking-tight">
                {language === 'ar' ? 'قائمة الأدوات والميزات الذكية' : 'Tools & Smart Utilities'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'ar'
                  ? 'الوصول السريع لجميع الأدوات المساعدة وحاسبات الأسعار والربط'
                  : 'Quick access to utilities, calculators, and device links'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label={language === 'ar' ? 'إغلاق' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Scrollable Tools Grid */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* Active Mode & System Status Banner */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                {language === 'ar' ? 'النمط التشغيلي:' : 'Active Mode:'}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-black border ${modeBadge.color}`}>
                <ModeIcon className="w-3.5 h-3.5" />
                <span>{modeBadge.label}</span>
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleToolAction(() => setIsModeModalOpen(true))}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/80 rounded-xl border border-amber-200 dark:border-amber-800 transition-all cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'تبديل النمط' : 'Change Mode'}</span>
            </button>
          </div>

          {/* SECTION 1: المالية والعملات والملصقات */}
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 block">
              {language === 'ar' ? 'المالية والطباعة السريعة' : 'Finance & Quick Printing'}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Currency Bulletin & Calculator */}
              <button
                type="button"
                onClick={() => handleToolAction(onOpenBulletin)}
                className="flex items-start gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 hover:bg-amber-50/50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700/80 hover:border-amber-300 dark:hover:border-amber-700 transition-all text-start cursor-pointer group shadow-2xs"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Coins className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-900 dark:text-white">
                      {language === 'ar' ? 'نشرة أسعار الصرف وحاسبة العملات' : 'Exchange Rates & Calculator'}
                    </h4>
                    <span className="text-[10px] font-mono font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-md">
                      {settings.currency.symbol}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                    {language === 'ar'
                      ? 'متابعة أسعار صرف الدولار واليورو وتحويل المبالغ بين العملات'
                      : 'Live multi-currency exchange rates and conversion tool'}
                  </p>
                </div>
              </button>

              {/* Barcode Designer & Label Printer */}
              <button
                type="button"
                onClick={() => handleToolAction(onOpenBarcodeDesigner)}
                className="flex items-start gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 hover:bg-amber-50/50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700/80 hover:border-amber-300 dark:hover:border-amber-700 transition-all text-start cursor-pointer group shadow-2xs"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <BarcodeIcon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-900 dark:text-white">
                      {language === 'ar' ? 'مصمم وطباعة ملصقات الباركود' : 'Barcode Designer & Labels'}
                    </h4>
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded-md">
                      ESC/POS
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                    {language === 'ar'
                      ? 'تخصيص قياسات الملصق وطباعة الباركود للمنتجات على طابعات الليبل'
                      : 'Custom barcode sticker design and batch printing'}
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* SECTION 2: ربط الأجهزة ونقل البيانات والنسخ السحابي */}
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 block">
              {language === 'ar' ? 'الربط ونقل البيانات والسحابة' : 'Devices, Sync & Cloud'}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Linked Devices Hub */}
              <button
                type="button"
                onClick={() => handleToolAction(() => setActiveTab('devices'))}
                className="flex items-start gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 hover:bg-amber-50/50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700/80 hover:border-amber-300 dark:hover:border-amber-700 transition-all text-start cursor-pointer group shadow-2xs"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Radio className="w-5 h-5 animate-pulse" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-900 dark:text-white">
                      {language === 'ar' ? 'مركز ربط الشاشات والأجهزة' : 'Multi-Device Terminals'}
                    </h4>
                    <span className="text-[10px] font-black bg-emerald-500 text-white px-1.5 py-0.5 rounded-full">
                      {onlineDevicesCount} متصل
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                    {language === 'ar'
                      ? 'شاشات المطبخ KDS، شاشة العميل، هاتف النادل، وماسح المخزون'
                      : 'Sync kitchen displays, customer terminals, and mobile waiters'}
                  </p>
                </div>
              </button>

              {/* Data Transfer via Link Code */}
              <button
                type="button"
                onClick={() => handleToolAction(() => setIsDataTransferModalOpen(true))}
                className="flex items-start gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 hover:bg-amber-50/50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700/80 hover:border-amber-300 dark:hover:border-amber-700 transition-all text-start cursor-pointer group shadow-2xs"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <ArrowLeftRight className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-900 dark:text-white">
                      {language === 'ar' ? 'نقل البيانات برمز الربط' : 'Cross-Device Data Transfer'}
                    </h4>
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded-md">
                      P2P Sync
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                    {language === 'ar'
                      ? 'تصدير ونقل المنتجات والفواتير فورياً لجهاز آخر عبر QR أو الرمز'
                      : 'Send or receive store database using direct pairing code'}
                  </p>
                </div>
              </button>

              {/* Cloud Backup Google Drive (Admins/Managers) */}
              {canAccessTab('settings', currentUser.role) && (
                <button
                  type="button"
                  onClick={() => handleToolAction(() => setActiveTab('settings'))}
                  className="flex items-start gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 hover:bg-amber-50/50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700/80 hover:border-amber-300 dark:hover:border-amber-700 transition-all text-start cursor-pointer group shadow-2xs"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Cloud className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-slate-900 dark:text-white">
                        {language === 'ar' ? 'النسخ السحابي (Google Drive)' : 'Cloud Backup (Google Drive)'}
                      </h4>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                        isGoogleDriveConnected
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                      }`}>
                        {isGoogleDriveConnected ? (language === 'ar' ? 'سحابة نشطة' : 'Connected') : (language === 'ar' ? 'غير متصل' : 'Offline')}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                      {language === 'ar'
                        ? 'حفظ وتأمين نسخ احتياطية تلقائية من قاعدة البيانات على حساب Google'
                        : 'Secure automated cloud backups to Google Drive'}
                    </p>
                  </div>
                </button>
              )}

              {/* Gemini AI Intelligence (Managers) */}
              {canAccessTab('ai', currentUser.role) && (
                <button
                  type="button"
                  onClick={() => handleToolAction(() => setActiveTab('ai'))}
                  className="flex items-start gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 hover:bg-amber-50/50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700/80 hover:border-amber-300 dark:hover:border-amber-700 transition-all text-start cursor-pointer group shadow-2xs"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-slate-900 dark:text-white">
                        {language === 'ar' ? 'المساعد الذكي (Gemini AI)' : 'Smart AI Insights (Gemini)'}
                      </h4>
                      <span className="text-[10px] font-black bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-400 px-1.5 py-0.5 rounded-md">
                        AI Pro
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                      {language === 'ar'
                        ? 'اقتراح استراتيجيات التسعير، تنبؤ نفاد المنتجات، وتحليل الأرباح'
                        : 'AI-driven business analytics, forecasting and pricing advice'}
                    </p>
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* SECTION 3: توفير الطاقة والمزامنة والتخزين */}
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 block">
              {language === 'ar' ? 'طاقة النظام والتخزين المحلي' : 'System Power & Offline Storage'}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Power Saving Mode Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isPowerSavingActive
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}>
                    <Leaf className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white">
                      {language === 'ar' ? 'وضع توفير الطاقة والاستعداد' : 'Eco Power Saver Mode'}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {isPowerSavingActive
                        ? (language === 'ar' ? 'مفعل — تعتيم الشاشة لحفظ البطارية' : 'Active — Screen dimmed to save battery')
                        : (language === 'ar' ? 'معطل — أداء كامل وشاشة ساطعة' : 'Disabled — Full screen brightness')}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={togglePowerSaving}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isPowerSavingActive ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                  aria-label="تبديل وضع توفير الطاقة"
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      isPowerSavingActive ? (isRtl ? '-translate-x-5' : 'translate-x-5') : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Offline Sync & Storage Status */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-black text-slate-900 dark:text-white">
                        {language === 'ar' ? 'قاعدة بيانات IndexedDB' : 'IndexedDB Local Cache'}
                      </h4>
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {offlineQueueCount > 0
                        ? (language === 'ar' ? `${offlineQueueCount} عملية تنتظر المزامنة` : `${offlineQueueCount} queued offline`)
                        : (language === 'ar' ? 'كافة البيانات محفوظة ومحدثة محلياً' : 'All data safe & cached locally')}
                    </p>
                  </div>
                </div>

                {isOnline && offlineQueueCount > 0 && (
                  <button
                    type="button"
                    onClick={syncOfflineQueueNow}
                    disabled={isSyncingOffline}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingOffline ? 'animate-spin' : ''}`} />
                    <span>{isSyncingOffline ? '...' : (language === 'ar' ? 'مزامنة' : 'Sync')}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            {language === 'ar' ? 'نظام كيان كاشير الذكي المتكامل' : 'Kian Cashier Smart System'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            {language === 'ar' ? 'إغلاق القائمة' : 'Close Menu'}
          </button>
        </div>
      </div>
    </div>
  );
};
