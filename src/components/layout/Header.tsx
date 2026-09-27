import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Sun,
  Moon,
  Search,
  PlusCircle,
  Bell,
  Wifi,
  WifiOff,
  Languages,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
  X,
  UtensilsCrossed,
  Building2,
  Store,
  SlidersHorizontal,
  Wrench,
  Grid,
  RefreshCw,
  MoreVertical,
  Clock,
  KeyRound,
  Crown,
  Sparkles,
  CheckCheck
} from 'lucide-react';
import { PinSwitchModal } from '../modals/PinSwitchModal';
import { ExchangeBulletinBar } from '../currency/ExchangeBulletinBar';
import { ExchangeBulletinModal } from '../currency/ExchangeBulletinModal';
import { BarcodeDesignerModal } from '../barcode/BarcodeDesignerModal';
import { ToolsHubModal } from '../modals/ToolsHubModal';
import { SectionsNavModal } from '../modals/SectionsNavModal';
import { getRoleInfo } from '../../utils/permissions';
import { GoogleIcon } from '../common/GoogleIcon';
import { isAuthorizedToGenerateCodes } from '../../utils/licenseUtils';
import { BatteryIndicator } from './BatteryIndicator';

export const Header: React.FC = () => {
  const {
    t,
    language,
    setLanguage,
    theme,
    themeMode,
    toggleTheme,
    currentUser,
    googleUser,
    isGoogleSignedIn,
    isOnline,
    setActiveTab,
    setIsGlobalSearchOpen,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearAllNotifications,
    settings,
    businessMode,
    setIsModeModalOpen,
    devices,
    offlineQueueCount,
    isSyncingOffline,
    syncOfflineQueueNow,
    isPowerSavingActive,
    isPinModalOpen,
    setIsPinModalOpen,
    isAppPurchased,
    trialDaysRemaining,
    isTrialExpired,
    setIsPurchaseModalOpen,
    setIsButtonCustomizerModalOpen
  } = useApp();

  const headerVisibility = settings.buttonLayout?.headerButtonsVisibility || {};

  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);
  const [notifFilterTab, setNotifFilterTab] = useState<'improvements' | 'all' | 'alerts'>('improvements');
  const [isBulletinModalOpen, setIsBulletinModalOpen] = useState(false);
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [isToolsHubModalOpen, setIsToolsHubModalOpen] = useState(false);
  const [isSectionsModalOpen, setIsSectionsModalOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;
  const improvementsCount = notifications.filter(n => n.category === 'feature' || n.category === 'improvement' || n.category === 'system_update' || n.isPermanent).length;
  const unreadImprovementsCount = notifications.filter(n => (n.category === 'feature' || n.category === 'improvement' || n.category === 'system_update' || n.isPermanent) && !n.read).length;
  const onlineDevicesCount = devices.filter(d => d.isOnline).length;
  const roleInfo = getRoleInfo(currentUser.role);

  const activeEmail = (
    googleUser?.email ||
    currentUser?.googleEmail ||
    currentUser?.email ||
    ''
  ).trim().toLowerCase();

  const isAuthorizedToGenerate = isAuthorizedToGenerateCodes(activeEmail);

  const modeBadge = {
    restaurant: {
      label: language === 'ar' ? 'مطاعم' : 'Dining',
      icon: UtensilsCrossed,
      color: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
    },
    wholesale: {
      label: language === 'ar' ? 'جملة' : 'Wholesale',
      icon: Building2,
      color: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
    },
    retail: {
      label: language === 'ar' ? 'تجزئة' : 'Retail',
      icon: Store,
      color: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800'
    }
  }[businessMode];

  const ModeIcon = modeBadge.icon;

  return (
    <>
      <header className="app-header h-15 material-header px-2.5 sm:px-4 flex items-center justify-between sticky top-0 z-30 transition-colors select-none shadow-xs">
        {/* Start / Left Section: Brand, Mode & Sections Navigator */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Brand Logo & Store Name */}
          <div
            onClick={() => setActiveTab('pos')}
            className="flex items-center gap-2 cursor-pointer group btn-tactile"
            id="header-brand-logo"
            title={language === 'ar' ? 'نقطة البيع الرئيسية (POS)' : 'Main POS'}
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 flex items-center justify-center font-black text-base shadow-sm group-hover:scale-105 transition-transform shrink-0">
              K
            </div>
            <div className="hidden sm:block leading-tight">
              <h1 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-1">
                <span>{language === 'ar' ? settings.storeNameAr : settings.storeNameEn}</span>
              </h1>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                {language === 'ar' ? 'كاشير ومخازن متكامل' : 'POS & Inventory'}
              </p>
            </div>
          </div>

          {/* Clean Mode Pill */}
          {headerVisibility.operatingMode !== false && (
            <button
              id="btn-header-operating-mode"
              type="button"
              onClick={() => setIsModeModalOpen(true)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-[11px] font-bold transition-all hover:opacity-90 active:scale-95 cursor-pointer btn-tactile ${modeBadge.color}`}
              title={language === 'ar' ? 'تبديل وضع التشغيل' : 'Switch Mode'}
            >
              <ModeIcon className="w-3 h-3" />
              <span className="hidden md:inline">{modeBadge.label}</span>
            </button>
          )}

          {/* Professional "الأقسام" (Sections Navigator) Button */}
          {headerVisibility.sectionsNav !== false && (
            <button
              id="btn-header-sections-nav"
              type="button"
              onClick={() => setIsSectionsModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all active:scale-95 cursor-pointer border border-slate-200/80 dark:border-slate-700/80 shadow-2xs btn-tactile"
              title={language === 'ar' ? 'استعراض كافة أقسام النظام' : 'Browse All Sections'}
            >
              <Grid className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">{language === 'ar' ? 'الأقسام' : 'Sections'}</span>
            </button>
          )}
        </div>

        {/* Center: Clean Global Search Input */}
        {headerVisibility.search !== false && (
          <div className="flex-1 max-w-sm mx-2 sm:mx-4 min-w-0">
            <button
              id="btn-open-global-search"
              type="button"
              onClick={() => setIsGlobalSearchOpen(true)}
              className="w-full flex items-center justify-between gap-1.5 px-3 py-1.5 text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200/70 dark:hover:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/80 transition-colors text-start cursor-pointer shadow-2xs"
            >
              <div className="flex items-center gap-2 truncate">
                <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate text-[11px] sm:text-xs">{t('globalSearch')}</span>
              </div>
              <kbd className="hidden sm:inline-block px-1.5 py-0.2 text-[10px] font-mono bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-slate-500 dark:text-slate-300 shrink-0">
                Ctrl+K
              </kbd>
            </button>
          </div>
        )}

        {/* End / Right Section: Tools Menu, New Sale, Status & User */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Guest Trial / License Status Pill */}
          {isAppPurchased ? (
            <button
              id="btn-header-license-status"
              type="button"
              onClick={() => setIsPurchaseModalOpen(true)}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-xs font-black hover:bg-emerald-500/20 transition-all cursor-pointer shrink-0 shadow-2xs"
              title="النسخة مرخصة ومدفوعة بالكامل مدى الحياة — انقر لعرض التفاصيل"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>مرخص بالكامل</span>
            </button>
          ) : isTrialExpired ? (
            <button
              id="btn-header-license-status"
              type="button"
              onClick={() => setIsPurchaseModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 text-xs font-black hover:bg-rose-500/25 transition-all cursor-pointer shrink-0 animate-bounce shadow-xs"
              title="انتهت الفترة التجريبية — انقر لإدخال كود الشراء"
            >
              <KeyRound className="w-3.5 h-3.5 text-rose-600" />
              <span>شراء التطبيق</span>
            </button>
          ) : (
            <button
              id="btn-header-license-status"
              type="button"
              onClick={() => setIsPurchaseModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 text-xs font-black hover:bg-amber-500/25 transition-all cursor-pointer shrink-0 shadow-2xs"
              title={`وضع الضيف التجريبي نشط — متبقي ${trialDaysRemaining} أيام. انقر لإدخال كود الشراء وتفعيل التطبيق`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="hidden xs:inline">وضع الضيف:</span>
              <span>{trialDaysRemaining} أيام</span>
            </button>
          )}

          {/* Special Purchase Code Generation Button for Authorized Developers */}
          {isAuthorizedToGenerate && (
            <button
              id="btn-header-dev-key-gen"
              type="button"
              onClick={() => setIsPurchaseModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-all cursor-pointer shrink-0 shadow-xs active:scale-95"
              title="أدوات المطور المعتمد — انقر لتوليد أكواد الشراء"
            >
              <Crown className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">إنشاء كود شراء</span>
            </button>
          )}

          {/* Primary "قائمة الأدوات" (Tools Menu) Button */}
          {headerVisibility.toolsHub !== false && (
            <button
              id="btn-header-tools-hub"
              type="button"
              onClick={() => setIsToolsHubModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-300/80 dark:border-amber-700/80 text-xs font-black transition-all active:scale-95 cursor-pointer shadow-2xs group"
              title={language === 'ar' ? 'فتح قائمة الأدوات والميزات الذكية' : 'Open Tools & Utilities'}
            >
              <Wrench className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 group-hover:rotate-45 transition-transform" />
              <span>{language === 'ar' ? 'قائمة الأدوات' : 'Tools'}</span>
              {(onlineDevicesCount > 0 || isPowerSavingActive || offlineQueueCount > 0) && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
              )}
            </button>
          )}

          {/* Quick POS New Sale Button */}
          {headerVisibility.quickNewSale !== false && (
            <button
              id="btn-quick-new-sale"
              type="button"
              onClick={() => setActiveTab('pos')}
              className="hidden md:flex items-center gap-1 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 text-xs font-black px-2.5 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer"
              title={language === 'ar' ? 'فتح شاشة الكاشير للبيع' : 'Open POS Cashier'}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{t('newSale')}</span>
            </button>
          )}

          {/* Minimalist Network Online/Offline Status */}
          {headerVisibility.networkStatus !== false && (
            <div
              onClick={() => {
                if (offlineQueueCount > 0 && isOnline) {
                  syncOfflineQueueNow();
                }
              }}
              className={`hidden lg:flex items-center gap-1 px-2 py-1 rounded-xl text-[11px] font-bold select-none ${
                isOnline
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
              } ${offlineQueueCount > 0 && isOnline ? 'cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/60' : ''}`}
              title={
                !isOnline
                  ? 'أوفلاين — يتم تخزين البيانات محلياً في IndexedDB'
                  : offlineQueueCount > 0
                  ? `${offlineQueueCount} عملية معلقة، انقر للمزامنة الفورية`
                  : 'متصل بالإنترنت'
              }
            >
              {isOnline ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[10px]">{t('online')}</span>
                  {offlineQueueCount > 0 && (
                    <span className="flex items-center gap-0.5 bg-amber-500 text-slate-950 text-[9px] font-black px-1 rounded-full ms-0.5">
                      <RefreshCw className={`w-2.5 h-2.5 ${isSyncingOffline ? 'animate-spin' : ''}`} />
                      {offlineQueueCount}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  <span className="text-[10px]">{t('offline')}</span>
                </>
              )}
            </div>
          )}

          {/* System Battery Charge Level & Power Saving Indicator */}
          {headerVisibility.battery !== false && <BatteryIndicator />}

          {/* Notifications Dropdown Toggle */}
          <div className="relative">
            <button
              id="btn-notifications"
              type="button"
              onClick={() => setIsNotifDropdownOpen(!isNotifDropdownOpen)}
              className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative cursor-pointer"
              title={t('notifications')}
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {isNotifDropdownOpen && (
              <div className="absolute end-0 mt-2 w-80 sm:w-104 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                {/* Header Bar */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                      <Bell className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-slate-900 dark:text-white">
                        {language === 'ar' ? 'الإشعارات وسجل التحسينات' : 'Notifications & Updates'}
                      </h3>
                      <p className="text-[10px] text-slate-400">
                        {unreadCount > 0
                          ? (language === 'ar' ? `${unreadCount} غير مقروء` : `${unreadCount} unread`)
                          : (language === 'ar' ? 'جميع الإشعارات مقروءة' : 'All caught up')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllNotificationsAsRead}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 transition-all cursor-pointer"
                        title="تحديد الكل كمقروء"
                      >
                        <CheckCheck className="w-3 h-3" />
                        <span>{language === 'ar' ? 'تحديد كمقروء' : 'Read all'}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={clearAllNotifications}
                      className="px-2 py-1 text-[10px] font-bold text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="مسح التنبيهات المؤقتة والاحتفاظ بسجل التحسينات"
                    >
                      {language === 'ar' ? 'مسح التنبيهات' : 'Clear alerts'}
                    </button>
                  </div>
                </div>

                {/* Filter Tabs Bar (دائماً يظهر خيار التحسينات المضافة) */}
                <div className="px-3 pt-2.5 pb-2 bg-slate-50/50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setNotifFilterTab('improvements')}
                    className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      notifFilterTab === 'improvements'
                        ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200/60 dark:border-slate-700/60'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{language === 'ar' ? 'التحسينات والميزات' : 'What\'s New'}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full font-mono font-black bg-black/10 dark:bg-white/20">
                      {improvementsCount}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNotifFilterTab('all')}
                    className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      notifFilterTab === 'all'
                        ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200/60 dark:border-slate-700/60'
                    }`}
                  >
                    <span>{language === 'ar' ? 'الكل' : 'All'}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full font-mono bg-black/10 dark:bg-white/20">
                      {notifications.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNotifFilterTab('alerts')}
                    className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      notifFilterTab === 'alerts'
                        ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200/60 dark:border-slate-700/60'
                    }`}
                  >
                    <span>{language === 'ar' ? 'التنبيهات' : 'Alerts'}</span>
                  </button>
                </div>

                {/* Optional Top Explanatory Banner for Improvements */}
                {notifFilterTab === 'improvements' && (
                  <div className="p-2.5 bg-gradient-to-r from-amber-500/10 via-emerald-500/5 to-transparent border-b border-amber-500/20 flex items-center gap-2 text-xs">
                    <span className="text-base select-none">✨</span>
                    <p className="text-[11px] text-amber-900 dark:text-amber-200 font-bold leading-tight">
                      {language === 'ar'
                        ? 'سجل التحديثات والإضافات: يوثق دائماً كل ما تم تطويره وتحسينه في النظام.'
                        : 'Release Log: Always showcasing all improvements and features added to the system.'}
                    </p>
                  </div>
                )}

                {/* Notifications List */}
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {notifications
                    .filter(n => {
                      if (notifFilterTab === 'improvements') {
                        return n.category === 'feature' || n.category === 'improvement' || n.category === 'system_update' || n.isPermanent;
                      }
                      if (notifFilterTab === 'alerts') {
                        return n.category === 'alert' || (!n.isPermanent && n.category !== 'feature' && n.category !== 'improvement' && n.category !== 'system_update');
                      }
                      return true;
                    })
                    .length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs space-y-1">
                      <p className="font-bold">{t('noNotifications')}</p>
                      <p className="text-[10px] text-slate-400">لا توجد عناصر لعرضها في هذا القسم حالياً</p>
                    </div>
                  ) : (
                    notifications
                      .filter(n => {
                        if (notifFilterTab === 'improvements') {
                          return n.category === 'feature' || n.category === 'improvement' || n.category === 'system_update' || n.isPermanent;
                        }
                        if (notifFilterTab === 'alerts') {
                          return n.category === 'alert' || (!n.isPermanent && n.category !== 'feature' && n.category !== 'improvement' && n.category !== 'system_update');
                        }
                        return true;
                      })
                      .map(n => (
                        <div
                          key={n.id}
                          onClick={() => markNotificationAsRead(n.id)}
                          className={`p-3 text-xs flex gap-2.5 items-start hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors ${
                            !n.read ? 'bg-amber-50/60 dark:bg-amber-950/20' : ''
                          }`}
                        >
                          {/* Icon representation */}
                          {n.category === 'feature' || n.category === 'improvement' || n.isPermanent ? (
                            <div className="w-7 h-7 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                              <Sparkles className="w-3.5 h-3.5" />
                            </div>
                          ) : n.type === 'success' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          ) : n.type === 'warning' ? (
                            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          ) : n.type === 'error' ? (
                            <X className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                          ) : (
                            <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1 flex-wrap">
                              <p className="font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                                <span>{n.title}</span>
                                {!n.read && (
                                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                                )}
                              </p>
                              {n.badge && (
                                <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300/80 dark:border-amber-700 shrink-0">
                                  {n.badge}
                                </span>
                              )}
                            </div>

                            <p className="text-slate-600 dark:text-slate-300 text-[11px] mt-1 leading-relaxed">
                              {n.message}
                            </p>

                            <div className="flex items-center justify-between mt-1.5 text-[9px] text-slate-400">
                              <span>
                                {new Date(n.timestamp).toLocaleDateString(language === 'ar' ? 'ar-SY' : 'en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                              {n.isPermanent && (
                                <span className="text-amber-600 dark:text-amber-400 font-bold">
                                  {language === 'ar' ? 'دائم في السجل ✓' : 'Permanent ✓'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Button Positions & Layout Customizer Quick Trigger */}
          <button
            id="btn-header-customize-buttons"
            type="button"
            onClick={() => setIsButtonCustomizerModalOpen(true)}
            className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-600 transition-colors relative cursor-pointer"
            title={language === 'ar' ? 'تخصيص وترتيب مواقع الأزرار والواجهة' : 'Customize UI & Button Layout'}
          >
            <SlidersHorizontal className="w-4 h-4 text-amber-500" />
          </button>

          {/* Theme Toggle */}
          {headerVisibility.themeToggle !== false && (
            <button
              id="btn-theme-toggle"
              type="button"
              onClick={toggleTheme}
              className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all relative cursor-pointer"
              title={theme === 'dark' ? t('lightMode') : t('darkMode')}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>
          )}

          {/* Language Switcher */}
          {headerVisibility.langToggle !== false && (
            <button
              id="btn-lang-toggle"
              type="button"
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              className="flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              title={t('language')}
            >
              <Languages className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[11px]">{language === 'ar' ? 'EN' : 'عربي'}</span>
            </button>
          )}

          {/* Staff Switch / Profile Card */}
          <button
            id="btn-user-profile-shift"
            type="button"
            onClick={() => setIsPinModalOpen(true)}
            className="flex items-center gap-1.5 p-1 sm:px-2 sm:py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-slate-200/80 dark:border-slate-700/80 transition-all text-start cursor-pointer shrink-0 shadow-2xs"
            title={`${currentUser.name} (${roleInfo.labelAr}) - انقر للتبديل`}
          >
            <div className="relative w-6 h-6 rounded-lg overflow-hidden bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs shrink-0">
              {currentUser.avatar ? (
                <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                currentUser.name.charAt(0)
              )}
              {(currentUser.isGoogleAccount || (isGoogleSignedIn && currentUser.email === googleUser?.email)) && (
                <span className="absolute -bottom-0.5 -end-0.5 bg-white dark:bg-slate-900 rounded-full p-0.5 shadow-2xs">
                  <GoogleIcon className="w-2 h-2" />
                </span>
              )}
            </div>
            <div className="hidden sm:block leading-tight">
              <p className="text-xs font-black text-slate-900 dark:text-white truncate max-w-[85px]">
                {currentUser.name}
              </p>
              <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 block">
                {roleInfo.badgeLabel}
              </span>
            </div>
          </button>
        </div>

        {/* Modals */}
        {/* Tools Hub Modal (All Secondary Tools & Utilities) */}
        <ToolsHubModal
          isOpen={isToolsHubModalOpen}
          onClose={() => setIsToolsHubModalOpen(false)}
          onOpenBulletin={() => setIsBulletinModalOpen(true)}
          onOpenBarcodeDesigner={() => setIsBarcodeModalOpen(true)}
        />

        {/* All Sections Navigator Modal */}
        <SectionsNavModal
          isOpen={isSectionsModalOpen}
          onClose={() => setIsSectionsModalOpen(false)}
        />

        {/* Currency Exchange Bulletin & Converter Modal */}
        {isBulletinModalOpen && (
          <ExchangeBulletinModal
            isOpen={isBulletinModalOpen}
            onClose={() => setIsBulletinModalOpen(false)}
          />
        )}

        {/* Barcode Designer & Label Printer Modal */}
        {isBarcodeModalOpen && (
          <BarcodeDesignerModal
            isOpen={isBarcodeModalOpen}
            onClose={() => setIsBarcodeModalOpen(false)}
          />
        )}
      </header>
      <ExchangeBulletinBar />
    </>
  );
};
