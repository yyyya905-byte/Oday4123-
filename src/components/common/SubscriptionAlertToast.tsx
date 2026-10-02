import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Clock,
  AlertTriangle,
  KeyRound,
  X,
  Sparkles,
  Calendar,
  ShieldAlert
} from 'lucide-react';
import { soundEffects } from '../../services/audio';

export const SubscriptionAlertToast: React.FC = () => {
  const {
    isAppPurchased,
    licenseExpiresAt,
    licenseRemainingDays,
    licenseRemainingHours,
    isLicenseExpired,
    isLifetimeLicense,
    trialDaysRemaining,
    trialHoursRemaining,
    isTrialExpired,
    setIsPurchaseModalOpen,
    notify
  } = useApp();

  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [toastType, setToastType] = useState<'trial' | 'expiring_soon' | null>(null);
  const [isDismissedSession, setIsDismissedSession] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('kian_sub_toast_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (isDismissedSession) return;

    // Check Condition 1: Guest Trial Mode (when not purchased and trial not expired)
    if (!isAppPurchased && !isTrialExpired) {
      setToastType('trial');
      setIsVisible(true);
      try {
        soundEffects.playBeep();
      } catch {}
      return;
    }

    // Check Condition 2: Subscription expiring in 3 days or less (and not lifetime, not expired yet)
    if (
      isAppPurchased &&
      licenseExpiresAt &&
      !isLifetimeLicense &&
      !isLicenseExpired &&
      licenseRemainingDays <= 3
    ) {
      setToastType('expiring_soon');
      setIsVisible(true);
      try {
        soundEffects.playWarning();
      } catch {}
      return;
    }

    setIsVisible(false);
  }, [
    isAppPurchased,
    licenseExpiresAt,
    licenseRemainingDays,
    isLicenseExpired,
    isLifetimeLicense,
    isTrialExpired,
    isDismissedSession
  ]);

  if (!isVisible || !toastType) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    try {
      sessionStorage.setItem('kian_sub_toast_dismissed', 'true');
      setIsDismissedSession(true);
    } catch {}
  };

  const handleOpenPurchase = () => {
    setIsPurchaseModalOpen(true);
    handleDismiss();
  };

  return (
    <aside
      aria-live="polite"
      className="fixed top-4 end-4 z-50 max-w-sm sm:max-w-md w-[calc(100vw-2rem)] animate-in slide-in-from-top-4 duration-300 select-none shadow-2xl rounded-3xl overflow-hidden border backdrop-blur-md"
    >
      {toastType === 'expiring_soon' ? (
        /* Expiring Soon Toast (<= 3 days) */
        <div className="p-4 bg-gradient-to-br from-amber-500/15 via-rose-500/10 to-slate-900/90 dark:to-slate-950/95 border-amber-500/40 text-slate-900 dark:text-white">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-600/30 animate-pulse">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black">
                    ينتهي قريباً جداً ⚠️
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    تنبيه التجديد
                  </span>
                </div>
                <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-tight">
                  تبقى {licenseRemainingDays === 0 ? 'أقل من 24 ساعة' : licenseRemainingDays === 1 ? 'يوم واحد فقط' : licenseRemainingDays === 2 ? 'يومان فقط' : '3 أيام'} على انتهاء الاشتراك!
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  أوشك اشتراكك في كاشير كيان على الانتهاء. سارع بإدخال كود تجديد جديد لضمان استمرارية عمليات البيع والفواتير دون توقف مفاجئ.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDismiss}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
              title="إغلاق التنبيه"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3.5 pt-3 border-t border-amber-500/20 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleDismiss}
              className="text-[11px] font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              تذكيري لاحقاً
            </button>

            <button
              type="button"
              onClick={handleOpenPurchase}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs shadow-md shadow-amber-500/25 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>تجديد الاشتراك الآن</span>
            </button>
          </div>
        </div>
      ) : (
        /* Guest Trial Mode Toast */
        <div className="p-4 bg-gradient-to-br from-amber-500/15 via-blue-500/10 to-slate-900/90 dark:to-slate-950/95 border-amber-500/40 text-slate-900 dark:text-white">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-md shadow-amber-500/30">
                <Clock className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black">
                    وضع الضيف التجريبي ⏱️
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    أسبوع مجاناً
                  </span>
                </div>
                <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-tight">
                  متبقي لديك {trialDaysRemaining} أيام في التجربة المجانية
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  أنت تعمل حالياً بكامل ميزات النظام التجريبية. لتثبيت نسختك الدائمة وتجنب الإغلاق التلقائي، احصل على كود تفعيل التطبيق.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDismiss}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
              title="إغلاق التنبيه"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3.5 pt-3 border-t border-amber-500/20 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleDismiss}
              className="text-[11px] font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              متابعة التجربة
            </button>

            <button
              type="button"
              onClick={handleOpenPurchase}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs shadow-md shadow-amber-500/25 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>تفعيل وشراء الترخيص</span>
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};
