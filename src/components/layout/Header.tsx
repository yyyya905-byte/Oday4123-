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
  Crown
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
    setIsPurchaseModalOpen
  } = useApp();

  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);
  const [isBulletinModalOpen, setIsBulletinModalOpen] = useState(false);
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [isToolsHubModalOpen, setIsToolsHubModalOpen] = useState(false);
  const [isSectionsModalOpen, setIsSectionsModalOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;
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
      <header className="app-header h-15 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800/80 px-2 sm:px-4 flex items-center justify-between sticky top-0 z-30 shadow-xs transition-colors select-none">
        {/* Start / Left Section: Brand, Mode & Sections Navigator */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Brand Logo & Store Name */}
          <div
            onClick={() => setActiveTab('pos')}
            className="flex items-center gap-2 cursor-pointer group"
            id="header-brand-logo"
            title={language === 'ar' ? 'نقطة البيع الرئيسية (POS)' : 'Main POS'}
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-base shadow-xs group-hover:scale-105 transition-transform shrink-0">
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
          <button
            id="btn-header-operating-mode"
            type="button"
            onClick={() => setIsModeModalOpen(true)}
            className={`flex items-center gap-1 px-2 py-1 rounded-xl border text-[11px] font-bold transition-all hover:opacity-90 active:scale-95 cursor-pointer ${modeBadge.color}`}
            title={language === 'ar' ? 'تبديل وضع التشغيل' : 'Switch Mode'}
          >
            <ModeIcon className="w-3 h-3" />
            <span className="hidden md:inline">{modeBadge.label}</span>
          </button>

          {/* Professional "الأقسام" (Sections Navigator) Button */}
          <button
            id="btn-header-sections-nav"
            type="button"
            onClick={() => setIsSectionsModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all active:scale-95 cursor-pointer border border-slate-200/80 dark:border-slate-700/80 shadow-2xs"
            title={language === 'ar' ? 'استعراض كافة أقسام النظام' : 'Browse All Sections'}
          >
            <Grid className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">{language === 'ar' ? 'الأقسام' : 'Sections'}</span>
          </button>
        </div>

        {/* Center: Clean Global Search Input */}
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

          {/* Quick POS New Sale Button */}
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

          {/* Minimalist Network Online/Offline Status */}
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
              <div className="absolute end-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-3.5 h-3.5 text-amber-500" />
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">{t('notifications')}</h3>
                    {unreadCount > 0 && (
                      <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold px-1.5 py-0.5 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <button
                      type="button"
                      onClick={clearAllNotifications}
                      className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    >
                      {t('clearAll')}
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-xs">
                      {t('noNotifications')}
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => markNotificationAsRead(n.id)}
                        className={`p-3 text-xs flex gap-2.5 items-start hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer ${
                          !n.read ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''
                        }`}
                      >
                        {n.type === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />}
                        {n.type === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />}
                        {n.type === 'error' && <X className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />}
                        {n.type === 'info' && <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />}
                        <div className="flex-1">
                          <p className="font-bold text-slate-800 dark:text-slate-200">{n.title}</p>
                          <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">{n.message}</p>
                          <span className="text-[9px] text-slate-400 mt-1 block">
                            {new Date(n.timestamp).toLocaleTimeString(language === 'ar' ? 'ar-SY' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Theme Toggle */}
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

          {/* Language Switcher */}
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
