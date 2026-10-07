import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Wrench,
  X,
  Coins,
  Banknote,
  Tag,
  Barcode as BarcodeIcon,
  ArrowLeftRight,
  HardDrive,
  Leaf,
  SlidersHorizontal,
  Database,
  RefreshCw,
  Store,
  UtensilsCrossed,
  Building2
} from 'lucide-react';

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
    isOnline,
    offlineQueueCount,
    isSyncingOffline,
    syncOfflineQueueNow,
    isPowerSavingActive,
    togglePowerSaving,
    setIsDataTransferModalOpen,
    setIsPairingModalOpen,
    setActiveTab,
    setIsButtonCustomizerModalOpen,
    openStorageCleanupModal,
    openShiftModal,
    openPromotionsModal,
    activeShift
  } = useApp();

  if (!isOpen) return null;

  const isRtl = language === 'ar';

  const modeBadge = {
    restaurant: {
      label: language === 'ar' ? 'نمط المطاعم والكافيهات' : 'Restaurant Mode',
      icon: UtensilsCrossed,
      color: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border-emerald-500/25'
    },
    wholesale: {
      label: language === 'ar' ? 'نمط تجارة الجملة والتوزيع' : 'Wholesale Mode',
      icon: Building2,
      color: 'bg-amber-500/12 text-amber-800 dark:text-amber-300 border-amber-500/25'
    },
    retail: {
      label: language === 'ar' ? 'نمط التجزئة والسوبرماركت' : 'Retail Mode',
      icon: Store,
      color: 'bg-blue-500/12 text-blue-700 dark:text-blue-300 border-blue-500/25'
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
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        className="relative w-full max-w-2xl max-h-[92dvh] flex flex-col apple-glass-card rounded-3xl shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-slate-200/70 dark:border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 flex items-center justify-center shadow-xs">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <h2 id="tools-hub-title" className="text-sm sm:text-base font-black tracking-tight">
                {language === 'ar' ? 'الأدوات المساعدة' : 'System Utilities & Tools'}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {language === 'ar'
                  ? 'أدوات الصندوق، أسعار الصرف، الباركود، وإدارة الذاكرة'
                  : 'Cash drawer, exchange calculator, barcode labels, and storage'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
            aria-label={language === 'ar' ? 'إغلاق' : 'Close'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 p-3.5 sm:p-5 overflow-y-auto space-y-4">
          {/* Active Operating Mode Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-slate-200/50 dark:bg-white/[0.04] border border-white/60 dark:border-white/[0.07]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                {language === 'ar' ? 'وضع التشغيل:' : 'Operating Mode:'}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border ${modeBadge.color}`}>
                <ModeIcon className="w-3.5 h-3.5" />
                <span>{modeBadge.label}</span>
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleToolAction(() => setIsModeModalOpen(true))}
              className="px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white bg-white dark:bg-white/[0.08] hover:opacity-90 rounded-xl border border-slate-200/80 dark:border-white/[0.1] transition-all cursor-pointer shadow-2xs"
            >
              {language === 'ar' ? 'تغيير الوضع' : 'Switch Mode'}
            </button>
          </div>

          {/* Core Cashier & Financial Utilities Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* 1. Shift Handover & Cash Drawer Balancing */}
            <button
              type="button"
              onClick={() => handleToolAction(() => openShiftModal())}
              className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/75 dark:bg-white/[0.04] hover:bg-white dark:hover:bg-white/[0.08] border border-slate-200/70 dark:border-white/[0.07] transition-all text-start cursor-pointer group active:scale-[0.98]"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Banknote className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {language === 'ar' ? 'الوردية ومطابقة الصندوق' : 'Shift & Cash Drawer'}
                  </h4>
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 shrink-0">
                    {activeShift ? `#${activeShift.shiftNumber}` : (language === 'ar' ? 'مغلق' : 'Closed')}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                  {language === 'ar' ? 'عد النقد، الإيداع والسحب، وتقرير التسليم' : 'Count cash drawer and handover shift'}
                </p>
              </div>
            </button>

            {/* 2. Currency Exchange Bulletin & Calculator */}
            <button
              type="button"
              onClick={() => handleToolAction(onOpenBulletin)}
              className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/75 dark:bg-white/[0.04] hover:bg-white dark:hover:bg-white/[0.08] border border-slate-200/70 dark:border-white/[0.07] transition-all text-start cursor-pointer group active:scale-[0.98]"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/12 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Coins className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {language === 'ar' ? 'نشرة الصرف وحاسبة العملات' : 'Currency & Exchange'}
                  </h4>
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 shrink-0">
                    {settings.currency.symbol}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                  {language === 'ar' ? 'أسعار الدولار واليورو والذهب وتحويل المبالغ' : 'Live USD/EUR rates and converter'}
                </p>
              </div>
            </button>

            {/* 3. Smart Promotions & Deals */}
            <button
              type="button"
              onClick={() => handleToolAction(() => openPromotionsModal())}
              className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/75 dark:bg-white/[0.04] hover:bg-white dark:hover:bg-white/[0.08] border border-slate-200/70 dark:border-white/[0.07] transition-all text-start cursor-pointer group active:scale-[0.98]"
            >
              <div className="w-10 h-10 rounded-xl bg-rose-500/12 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Tag className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {language === 'ar' ? 'العروض والخصومات الترويجية' : 'Promotions & Deals'}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                  {language === 'ar' ? 'خصومات السلة التلقائية وعروض الهدايا' : 'Automatic cart discounts and BOGO deals'}
                </p>
              </div>
            </button>

            {/* 4. Barcode Designer & Label Printer */}
            <button
              type="button"
              onClick={() => handleToolAction(onOpenBarcodeDesigner)}
              className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/75 dark:bg-white/[0.04] hover:bg-white dark:hover:bg-white/[0.08] border border-slate-200/70 dark:border-white/[0.07] transition-all text-start cursor-pointer group active:scale-[0.98]"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-500/12 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <BarcodeIcon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {language === 'ar' ? 'تصميم وطباعة ملصقات الباركود' : 'Barcode Label Printer'}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                  {language === 'ar' ? 'تخصيص وطباعة لصاقات الباركود والأسعار' : 'Design and print product barcode stickers'}
                </p>
              </div>
            </button>

            {/* 5. Add Sub-Device & Assign Role (Master Device) */}
            <button
              type="button"
              onClick={() => handleToolAction(() => {
                setActiveTab('devices');
                setIsPairingModalOpen(true);
              })}
              className="flex items-center gap-3 p-3.5 rounded-2xl bg-amber-50/75 dark:bg-amber-950/20 hover:bg-amber-100/80 dark:hover:bg-amber-950/35 border border-amber-300/70 dark:border-amber-800/60 transition-all text-start cursor-pointer group active:scale-[0.98]"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <ArrowLeftRight className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {language === 'ar' ? 'إضافة جهاز وتحديد وظيفته وعمله' : 'Add Sub-Device & Role'}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                  {language === 'ar'
                    ? businessMode === 'restaurant'
                      ? 'إضافة كاشير أو نادل أو شاشة مطبخ بكود خاص ومشاركة البيانات تلقائياً'
                      : 'إضافة كاشير أو مساعد أو جرد بكود خاص ومشاركة البيانات تلقائياً'
                    : businessMode === 'restaurant'
                    ? 'Link cashier, waiter, or kitchen with unique code'
                    : 'Link cashier, assistant, or scanner with unique code'}
                </p>
              </div>
            </button>

            {/* 6. Storage Health & Smart Cleanup */}
            <button
              type="button"
              onClick={() => handleToolAction(() => openStorageCleanupModal())}
              className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/75 dark:bg-white/[0.04] hover:bg-white dark:hover:bg-white/[0.08] border border-slate-200/70 dark:border-white/[0.07] transition-all text-start cursor-pointer group active:scale-[0.98]"
            >
              <div className="w-10 h-10 rounded-xl bg-cyan-500/12 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                <HardDrive className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {language === 'ar' ? 'فحص وتنظيف الذاكرة' : 'Storage & Memory Cleaner'}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                  {language === 'ar' ? 'مراقبة سعة IndexedDB وتفريغ السجلات القديمة' : 'Inspect storage usage and free space'}
                </p>
              </div>
            </button>

            {/* 7. UI & Button Layout Customizer */}
            <button
              type="button"
              id="btn-tools-customize-buttons"
              onClick={() => handleToolAction(() => setIsButtonCustomizerModalOpen(true))}
              className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/75 dark:bg-white/[0.04] hover:bg-white dark:hover:bg-white/[0.08] border border-slate-200/70 dark:border-white/[0.07] transition-all text-start cursor-pointer group active:scale-[0.98]"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-500/12 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {language === 'ar' ? 'تخصيص تخطيط الواجهة والأزرار' : 'Customize UI Layout'}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                  {language === 'ar' ? 'ترتيب أزرار الكاشير وموقع السلة يمين أو يسار' : 'Configure cart position and POS buttons'}
                </p>
              </div>
            </button>

            {/* 8. Power Saving Mode Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/75 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/[0.07]">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isPowerSavingActive
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-500/12 text-slate-600 dark:text-slate-300'
                }`}>
                  <Leaf className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {language === 'ar' ? 'وضع توفير الطاقة' : 'Eco Power Saver'}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {isPowerSavingActive
                      ? (language === 'ar' ? 'مفعل لحفظ البطارية' : 'Active')
                      : (language === 'ar' ? 'إضاءة وأداء كامل' : 'Full brightness')}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={togglePowerSaving}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isPowerSavingActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                }`}
                aria-label="تبديل وضع توفير الطاقة"
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                    isPowerSavingActive ? (isRtl ? '-translate-x-5' : 'translate-x-5') : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Offline Queue Sync Bar (Only shown if there are queued offline actions) */}
          {offlineQueueCount > 0 && (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25">
              <div className="flex items-center gap-2.5">
                <Database className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {language === 'ar' ? `${offlineQueueCount} عملية معلقة للمزامنة` : `${offlineQueueCount} pending offline actions`}
                </span>
              </div>
              {isOnline && (
                <button
                  type="button"
                  onClick={syncOfflineQueueNow}
                  disabled={isSyncingOffline}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-slate-900 dark:bg-white dark:text-slate-950 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingOffline ? 'animate-spin' : ''}`} />
                  <span>{language === 'ar' ? 'مزامنة الآن' : 'Sync Now'}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
