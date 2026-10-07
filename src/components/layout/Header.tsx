import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Sun,
  Moon,
  Search,
  Bell,
  WifiOff,
  Languages,
  CheckCircle2,
  AlertTriangle,
  Info,
  X,
  UtensilsCrossed,
  Building2,
  Store,
  Wrench,
  RefreshCw,
  Sparkles,
  CheckCheck,
  DollarSign,
  Plus,
  Crown
} from 'lucide-react';
import { ExchangeBulletinModal } from '../currency/ExchangeBulletinModal';
import { BarcodeDesignerModal } from '../barcode/BarcodeDesignerModal';
import { ToolsHubModal } from '../modals/ToolsHubModal';
import { getRoleInfo } from '../../utils/permissions';
import { GoogleIcon } from '../common/GoogleIcon';
import { soundEffects } from '../../services/audio';

export const Header: React.FC = () => {
  const {
    t,
    language,
    setLanguage,
    theme,
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
    isMasterDevice,
    setIsPairingModalOpen,
    offlineQueueCount,
    isSyncingOffline,
    syncOfflineQueueNow,
    isPowerSavingActive,
    setIsPinModalOpen
  } = useApp();

  const headerVisibility = settings.buttonLayout?.headerButtonsVisibility || {};

  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);
  const [notifFilterTab, setNotifFilterTab] = useState<'improvements' | 'all' | 'alerts'>('all');
  const [isBulletinModalOpen, setIsBulletinModalOpen] = useState(false);
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [isToolsHubModalOpen, setIsToolsHubModalOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;
  const improvementsCount = notifications.filter(
    n => n.category === 'feature' || n.category === 'improvement' || n.category === 'system_update' || n.isPermanent
  ).length;
  const onlineDevicesCount = devices.filter(
    d => d.isOnline && (businessMode === 'restaurant' || (d.role !== 'kitchen_display' && d.role !== 'waiter_mobile'))
  ).length;
  const roleInfo = getRoleInfo(currentUser.role);
  const bulletin = settings.exchangeBulletin;

  const modeBadge = {
    restaurant: {
      label: language === 'ar' ? 'مطاعم' : 'Dining',
      icon: UtensilsCrossed,
      color: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border-emerald-500/25'
    },
    wholesale: {
      label: language === 'ar' ? 'جملة' : 'Wholesale',
      icon: Building2,
      color: 'bg-amber-500/12 text-amber-800 dark:text-amber-300 border-amber-500/25'
    },
    retail: {
      label: language === 'ar' ? 'تجزئة' : 'Retail',
      icon: Store,
      color: 'bg-blue-500/12 text-blue-700 dark:text-blue-300 border-blue-500/25'
    }
  }[businessMode];

  const ModeIcon = modeBadge.icon;

  return (
    <header className="app-header h-14 material-header px-3 sm:px-5 flex items-center justify-between sticky top-0 z-30 transition-colors select-none">
      {/* Zone 1: Brand Identity & Operating Mode Switcher */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button
          type="button"
          onClick={() => {
            soundEffects.playGlassTap();
            setActiveTab('pos');
          }}
          className="flex items-center gap-2.5 cursor-pointer group btn-tactile text-start"
          id="header-brand-logo"
          title={language === 'ar' ? 'نقطة البيع الرئيسية (POS)' : 'Main POS'}
        >
          <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 flex items-center justify-center font-black text-sm shadow-xs group-hover:scale-105 transition-transform shrink-0">
            K
          </div>
          <span className="text-xs sm:text-sm font-black tracking-tight text-slate-900 dark:text-white truncate max-w-[130px] sm:max-w-[180px]">
            {language === 'ar' ? settings.storeNameAr : settings.storeNameEn}
          </span>
        </button>

        {headerVisibility.operatingMode !== false && (
          <button
            id="btn-header-operating-mode"
            type="button"
            onClick={() => {
              soundEffects.playGlassPress();
              setIsModeModalOpen(true);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all hover:opacity-90 active:scale-95 cursor-pointer btn-tactile whitespace-nowrap ${modeBadge.color}`}
            title={language === 'ar' ? 'تبديل وضع التشغيل (تجزئة / جملة / مطاعم)' : 'Switch Operating Mode'}
          >
            <ModeIcon className="w-3.5 h-3.5 shrink-0" />
            <span>{modeBadge.label}</span>
          </button>
        )}
      </div>

      {/* Zone 2: Apple Spotlight Global Search */}
      {headerVisibility.search !== false && (
        <div className="flex-1 max-w-xs sm:max-w-md mx-2 sm:mx-4 min-w-0">
          <button
            id="btn-open-global-search"
            type="button"
            onClick={() => {
              soundEffects.playGlassTap();
              setIsGlobalSearchOpen(true);
            }}
            className="w-full flex items-center justify-between gap-2 px-3 py-1.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-200/60 dark:bg-white/[0.06] hover:bg-slate-200/90 dark:hover:bg-white/[0.1] rounded-xl border border-white/60 dark:border-white/[0.08] transition-all text-start cursor-pointer backdrop-blur-md"
          >
            <div className="flex items-center gap-2 truncate">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate text-[11px] sm:text-xs">{t('globalSearch')}</span>
            </div>
            <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-md text-slate-500 dark:text-slate-400 shrink-0">
              ⌘K
            </kbd>
          </button>
        </div>
      )}

      {/* Zone 3: Unified Tools Button, Live Exchange Rate, Status & User */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Compact Live USD Rate Pill (Replaces bulky second header bar) */}
        {bulletin && bulletin.displayInHeader !== false && (
          <button
            id="btn-open-currency-calculator"
            type="button"
            onClick={() => {
              soundEffects.playGlassPress();
              setIsBulletinModalOpen(true);
            }}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-200/60 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] border border-white/60 dark:border-white/[0.08] text-xs font-bold text-slate-700 dark:text-slate-200 transition-all cursor-pointer btn-tactile whitespace-nowrap"
            title={language === 'ar' ? 'نشرة أسعار الصرف وحاسبة العملات' : 'Exchange Rates & Calculator'}
          >
            <DollarSign className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-mono tabular-nums">{bulletin.usdSellRate.toLocaleString()}</span>
          </button>
        )}

        {/* Master Device "إضافة جهاز" Quick Action Button */}
        {isMasterDevice && (
          <button
            id="btn-header-master-add-device"
            type="button"
            onClick={() => {
              soundEffects.playGlassPress();
              setIsPairingModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-l from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-black transition-all active:scale-95 cursor-pointer shadow-xs whitespace-nowrap btn-tactile"
            title={
              businessMode === 'restaurant'
                ? 'إضافة جهاز جديد (كاشير / نادل / شاشة مطبخ / مساعد) وتحديد عمله ومشاركة البيانات تلقائياً مع الجهاز الرئيسي'
                : 'إضافة جهاز جديد (كاشير / مساعد / مشرف) وتحديد عمله ومشاركة البيانات تلقائياً مع الجهاز الرئيسي'
            }
          >
            <Crown className="w-3.5 h-3.5 shrink-0" />
            <Plus className="w-3.5 h-3.5 -ms-1 shrink-0 stroke-[2.5]" />
            <span>{language === 'ar' ? 'إضافة جهاز' : 'Add Device'}</span>
            {onlineDevicesCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-slate-950/20 text-slate-950 text-[10px] font-mono font-black">
                {onlineDevicesCount}
              </span>
            )}
          </button>
        )}

        {/* THE SINGLE UNIFIED TOOLS BUTTON (الأدوات) */}
        {headerVisibility.toolsHub !== false && (
          <button
            id="btn-header-tools-hub"
            type="button"
            onClick={() => {
              soundEffects.playGlassPress();
              setIsToolsHubModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 hover:opacity-90 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-xs whitespace-nowrap btn-tactile"
            title={language === 'ar' ? 'فتح قائمة الأدوات والميزات الذكية' : 'Open Tools & Utilities'}
          >
            <Wrench className="w-3.5 h-3.5 shrink-0" />
            <span>{language === 'ar' ? 'الأدوات' : 'Tools'}</span>
            {(onlineDevicesCount > 0 || isPowerSavingActive || offlineQueueCount > 0) && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 dark:bg-amber-500 animate-pulse shrink-0" />
            )}
          </button>
        )}

        {/* Offline / Sync Status Indicator (Only shown when offline or pending sync) */}
        {(!isOnline || offlineQueueCount > 0) && (
          <button
            type="button"
            onClick={() => {
              if (offlineQueueCount > 0 && isOnline) {
                syncOfflineQueueNow();
              }
            }}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25 cursor-pointer whitespace-nowrap"
            title={!isOnline ? 'وضع أوفلاين' : `${offlineQueueCount} عملية معلقة للمزامنة`}
          >
            {!isOnline ? (
              <WifiOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            ) : (
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingOffline ? 'animate-spin' : ''}`} />
            )}
            <span className="hidden lg:inline">{!isOnline ? t('offline') : offlineQueueCount}</span>
          </button>
        )}

        {/* Notifications Dropdown Toggle */}
        <div className="relative">
          <button
            id="btn-notifications"
            type="button"
            onClick={() => setIsNotifDropdownOpen(!isNotifDropdownOpen)}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-white/[0.08] transition-colors relative cursor-pointer btn-tactile"
            title={t('notifications')}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center font-mono">
                {unreadCount}
              </span>
            )}
          </button>

          {isNotifDropdownOpen && (
            <div className="absolute end-0 mt-2 w-80 sm:w-96 apple-glass-card rounded-3xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
              <div className="p-3.5 border-b border-slate-200/70 dark:border-white/[0.08] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-slate-700 dark:text-slate-200" />
                  <div>
                    <h3 className="text-xs font-black text-slate-900 dark:text-white">
                      {language === 'ar' ? 'الإشعارات والتنبيهات' : 'Notifications'}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllNotificationsAsRead}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 transition-all cursor-pointer"
                    >
                      <CheckCheck className="w-3 h-3" />
                      <span>{language === 'ar' ? 'تحديد كمقروء' : 'Read all'}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={clearAllNotifications}
                    className="px-2 py-1 text-[10px] font-bold text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    {language === 'ar' ? 'مسح' : 'Clear'}
                  </button>
                </div>
              </div>

              <div className="px-3 py-2 border-b border-slate-200/50 dark:border-white/[0.06] flex items-center gap-1 apple-segmented m-2 rounded-xl">
                <button
                  type="button"
                  onClick={() => setNotifFilterTab('all')}
                  className={`flex-1 py-1 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    notifFilterTab === 'all'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {language === 'ar' ? 'الكل' : 'All'} ({notifications.length})
                </button>
                <button
                  type="button"
                  onClick={() => setNotifFilterTab('alerts')}
                  className={`flex-1 py-1 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    notifFilterTab === 'alerts'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {language === 'ar' ? 'التنبيهات' : 'Alerts'}
                </button>
                <button
                  type="button"
                  onClick={() => setNotifFilterTab('improvements')}
                  className={`flex-1 py-1 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    notifFilterTab === 'improvements'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {language === 'ar' ? 'التحديثات' : 'Updates'} ({improvementsCount})
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-white/[0.06]">
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
                  .map(n => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationAsRead(n.id)}
                      className={`p-3 text-xs flex gap-2.5 items-start hover:bg-slate-50/80 dark:hover:bg-white/[0.04] cursor-pointer transition-colors ${
                        !n.read ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                      }`}
                    >
                      {n.category === 'feature' || n.category === 'improvement' || n.isPermanent ? (
                        <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
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
                        <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span className="truncate">{n.title}</span>
                          {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />}
                        </p>
                        <p className="text-slate-600 dark:text-slate-300 text-[11px] mt-0.5 leading-relaxed">
                          {n.message}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        {headerVisibility.themeToggle !== false && (
          <button
            id="btn-theme-toggle"
            type="button"
            onClick={toggleTheme}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-white/[0.08] transition-all cursor-pointer btn-tactile"
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
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-white/[0.08] transition-colors cursor-pointer whitespace-nowrap btn-tactile"
            title={t('language')}
          >
            <Languages className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[11px]">{language === 'ar' ? 'EN' : 'عربي'}</span>
          </button>
        )}

        {/* Staff Profile / PIN Switch */}
        <button
          id="btn-user-profile-shift"
          type="button"
          onClick={() => setIsPinModalOpen(true)}
          className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 rounded-xl bg-slate-200/60 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] border border-white/60 dark:border-white/[0.08] transition-all text-start cursor-pointer shrink-0 btn-tactile"
          title={`${currentUser.name} (${roleInfo.labelAr}) - انقر لتبديل الموظف`}
        >
          <div className="relative w-6 h-6 rounded-lg overflow-hidden bg-slate-900 dark:bg-white text-white dark:text-slate-950 flex items-center justify-center font-black text-xs shrink-0">
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
          <span className="hidden xl:block text-xs font-bold text-slate-900 dark:text-white truncate max-w-[85px]">
            {currentUser.name}
          </span>
        </button>
      </div>

      {/* Unified Tools Hub Modal */}
      <ToolsHubModal
        isOpen={isToolsHubModalOpen}
        onClose={() => setIsToolsHubModalOpen(false)}
        onOpenBulletin={() => setIsBulletinModalOpen(true)}
        onOpenBarcodeDesigner={() => setIsBarcodeModalOpen(true)}
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
  );
};
