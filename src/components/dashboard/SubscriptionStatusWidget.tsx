import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Calendar,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Crown,
  KeyRound,
  RefreshCw,
  Sparkles
} from 'lucide-react';

export const SubscriptionStatusWidget: React.FC = () => {
  const {
    isAppPurchased: contextPurchased,
    licenseExpiresAt: contextExpiresAt,
    licenseRemainingDays: contextRemainingDays,
    isLicenseExpired: contextIsExpired,
    isTrialExpired: contextIsTrialExpired,
    setIsPurchaseModalOpen,
    language
  } = useApp();

  // Local state synced directly with localStorage
  const [subData, setSubData] = useState(() => readSubscriptionFromStorage());
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  function readSubscriptionFromStorage() {
    try {
      const expiresAtIso = localStorage.getItem('kian_pos_license_expires_at');
      const isPurchased = localStorage.getItem('kian_app_purchased') === 'true';
      const licenseType = localStorage.getItem('kian_pos_license_type') || (expiresAtIso ? 'subscription' : 'lifetime');
      const trialStartDate = localStorage.getItem('kian_trial_start_date');
      const isTrialExpiredStored = localStorage.getItem('kian_pos_is_trial_expired') === 'true';

      if (expiresAtIso) {
        const expTime = new Date(expiresAtIso).getTime();
        const now = Date.now();
        const diffMs = expTime - now;

        if (isNaN(expTime)) {
          return {
            hasSubscription: false,
            isPurchased,
            isExpired: true,
            daysRemaining: 0,
            hoursRemaining: 0,
            expiresAtFormatted: '',
            licenseType,
            progressPercent: 0,
            totalDurationDays: 30
          };
        }

        const isExpired = diffMs <= 0;
        const totalHours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
        const daysRemaining = Math.max(0, Math.floor(totalHours / 24));
        const hoursRemaining = totalHours % 24;

        // Estimate total duration for progress bar
        const totalDurationDays = licenseType === '1_year' || daysRemaining > 35 ? 365 : 30;
        const progressPercent = isExpired
          ? 0
          : Math.min(100, Math.max(1, Math.round((daysRemaining / totalDurationDays) * 100)));

        const expDate = new Date(expiresAtIso);
        const expiresAtFormatted = expDate.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        return {
          hasSubscription: true,
          isPurchased: !isExpired && isPurchased,
          isExpired,
          daysRemaining,
          hoursRemaining,
          expiresAtFormatted,
          licenseType: licenseType === '1_year' ? '1_year' : '1_month',
          progressPercent,
          totalDurationDays
        };
      }

      // Guest trial or lifetime
      if (isPurchased) {
        return {
          hasSubscription: true,
          isPurchased: true,
          isExpired: false,
          daysRemaining: 9999,
          hoursRemaining: 0,
          expiresAtFormatted: language === 'ar' ? 'مدى الحياة (دائم)' : 'Lifetime',
          licenseType: 'lifetime',
          progressPercent: 100,
          totalDurationDays: 9999
        };
      }

      // Guest trial
      const trialStart = trialStartDate ? new Date(trialStartDate).getTime() : Date.now();
      const trialEnd = trialStart + 7 * 24 * 60 * 60 * 1000;
      const trialDiff = trialEnd - Date.now();
      const trialDays = Math.max(0, Math.floor(trialDiff / (1000 * 60 * 60 * 24)));
      const trialHours = Math.max(0, Math.floor((trialDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
      const isTrialExpired = trialDiff <= 0 || isTrialExpiredStored;

      return {
        hasSubscription: false,
        isPurchased: false,
        isExpired: isTrialExpired,
        daysRemaining: trialDays,
        hoursRemaining: trialHours,
        expiresAtFormatted: language === 'ar' ? 'وضع الضيف (7 أيام)' : 'Guest Trial (7 days)',
        licenseType: 'guest_trial',
        progressPercent: isTrialExpired ? 0 : Math.round((trialDiff / (7 * 24 * 60 * 60 * 1000)) * 100),
        totalDurationDays: 7
      };
    } catch {
      return {
        hasSubscription: false,
        isPurchased: false,
        isExpired: false,
        daysRemaining: 7,
        hoursRemaining: 0,
        expiresAtFormatted: '',
        licenseType: 'guest_trial',
        progressPercent: 100,
        totalDurationDays: 7
      };
    }
  }

  // Sync periodically and on storage events
  useEffect(() => {
    const handleUpdate = () => {
      setSubData(readSubscriptionFromStorage());
      setLastRefreshed(new Date());
    };

    window.addEventListener('storage', handleUpdate);
    const interval = setInterval(handleUpdate, 15000); // Check every 15s

    return () => {
      window.removeEventListener('storage', handleUpdate);
      clearInterval(interval);
    };
  }, [contextPurchased, contextExpiresAt, contextRemainingDays, contextIsExpired, contextIsTrialExpired, language]);

  const handleManualRefresh = () => {
    setSubData(readSubscriptionFromStorage());
    setLastRefreshed(new Date());
  };

  const isAnnual = subData.licenseType === '1_year' || subData.daysRemaining > 35;
  const isMonthly = subData.licenseType === '1_month' || (!isAnnual && subData.hasSubscription && subData.licenseType !== 'lifetime');
  const isLifetime = subData.licenseType === 'lifetime';
  const isGuest = subData.licenseType === 'guest_trial';

  // Urgent status when less than 5 days
  const isUrgent = !isLifetime && subData.daysRemaining <= 5 && !subData.isExpired;

  return (
    <div
      className={`p-4 sm:p-5 rounded-3xl border transition-all shadow-xs relative overflow-hidden ${
        subData.isExpired
          ? 'bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent border-rose-500/40 dark:border-rose-900/60'
          : isUrgent
          ? 'bg-gradient-to-br from-amber-500/15 via-rose-500/5 to-transparent border-amber-500/50 dark:border-amber-500/40'
          : isAnnual
          ? 'bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border-emerald-500/30 dark:border-emerald-500/20'
          : isMonthly
          ? 'bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent border-blue-500/30 dark:border-blue-500/20'
          : 'bg-gradient-to-br from-amber-500/10 via-slate-500/5 to-transparent border-amber-500/30 dark:border-amber-500/20'
      }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left Section: Icon & Title & Badges */}
        <div className="flex items-start sm:items-center gap-3.5">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black shrink-0 shadow-md ${
              subData.isExpired
                ? 'bg-rose-600 text-white shadow-rose-600/20'
                : isUrgent
                ? 'bg-amber-500 text-slate-950 shadow-amber-500/20 animate-pulse'
                : isAnnual
                ? 'bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-emerald-600/20'
                : isMonthly
                ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-blue-600/20'
                : 'bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 shadow-amber-500/20'
            }`}
          >
            {subData.isExpired ? (
              <AlertTriangle className="w-6 h-6" />
            ) : isLifetime ? (
              <Crown className="w-6 h-6" />
            ) : isAnnual ? (
              <ShieldCheck className="w-6 h-6" />
            ) : isMonthly ? (
              <Calendar className="w-6 h-6" />
            ) : (
              <Clock className="w-6 h-6" />
            )}
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>
                  {isAnnual
                    ? 'اشتراك سنوي في كاشير كيان'
                    : isMonthly
                    ? 'اشتراك شهري في كاشير كيان'
                    : isLifetime
                    ? 'ترخيص دائم مدى الحياة'
                    : 'فترة وضع الضيف التجريبي'}
                </span>
              </h3>

              <span
                className={`text-[10px] font-black px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 shadow-2xs ${
                  subData.isExpired
                    ? 'bg-rose-600 text-white'
                    : isUrgent
                    ? 'bg-amber-500 text-slate-950 animate-bounce'
                    : isAnnual
                    ? 'bg-emerald-600 text-white'
                    : isMonthly
                    ? 'bg-blue-600 text-white'
                    : 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                }`}
              >
                {subData.isExpired ? (
                  <span>منتهي الصلاحية ✕</span>
                ) : isUrgent ? (
                  <span>ينتهي قريباً جداً ⚠️</span>
                ) : isLifetime ? (
                  <span>دائم غير مقيد 👑</span>
                ) : (
                  <span>اشتراك نشط ✓</span>
                )}
              </span>

              <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500">
                (قيمة localStorage المعتمدة)
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
              {subData.expiresAtFormatted && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {subData.isExpired ? 'انتهى بتاريخ: ' : 'تاريخ الانتهاء: '}
                    <strong className="text-slate-900 dark:text-slate-200">
                      {subData.expiresAtFormatted}
                    </strong>
                  </span>
                </span>
              )}

              {isGuest && (
                <span className="text-amber-600 dark:text-amber-400 font-bold">
                  متبقي من مهلة أسبوع الضيف المجانية
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Center / Right Section: Big Days Counter & Actions */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 self-stretch lg:self-auto justify-between lg:justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-200/60 dark:border-slate-800/60">
          {/* Days Left Big Display */}
          <div className="flex items-center gap-3">
            <div className="text-right sm:text-left">
              <span className="text-[10px] font-bold text-slate-400 block">
                {subData.isExpired ? 'الحالة' : 'المدة المتبقية:'}
              </span>
              <div className="flex items-baseline gap-1.5">
                {isLifetime ? (
                  <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    غير محدد (دائم)
                  </span>
                ) : subData.isExpired ? (
                  <span className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
                    0 يوم (منتهي)
                  </span>
                ) : (
                  <>
                    <span
                      className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
                        isUrgent
                          ? 'text-rose-600 dark:text-rose-400'
                          : isAnnual
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : isMonthly
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {subData.daysRemaining}
                    </span>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      يوماً
                    </span>
                    {subData.hoursRemaining > 0 && (
                      <span className="text-[11px] font-mono text-slate-400">
                        و {subData.hoursRemaining} س
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleManualRefresh}
              className="p-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              title="تحديث البيانات من الذاكرة المحلية (localStorage)"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsPurchaseModalOpen(true)}
              className={`px-4 py-2.5 rounded-xl font-black text-xs transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-2 ${
                subData.isExpired
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/25 animate-bounce'
                  : isUrgent
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/25'
                  : 'bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 shadow-slate-900/10'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>
                {subData.isExpired
                  ? 'تجديد الاشتراك بكود جديد'
                  : subData.isPurchased
                  ? 'تمديد / ترقية الاشتراك'
                  : 'تفعيل الاشتراك الآن'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Progress Bar (Visual remaining timeline) */}
      {!isLifetime && (
        <div className="mt-3 pt-3 border-t border-slate-200/50 dark:border-slate-800/50">
          <div className="flex items-center justify-between text-[11px] font-bold mb-1">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>
                {subData.isExpired
                  ? 'انتهت مدة الصلاحية — يرجى تزويد النظام بكود تجديد لمواصلة العمليات'
                  : `متبقي ${subData.progressPercent}% من دورة الاشتراك الحالية (${subData.totalDurationDays} يوماً)`}
              </span>
            </span>
            <span
              className={`font-mono ${
                subData.isExpired
                  ? 'text-rose-600'
                  : isUrgent
                  ? 'text-amber-600'
                  : isAnnual
                  ? 'text-emerald-600'
                  : 'text-blue-600'
              }`}
            >
              {subData.daysRemaining} / {subData.totalDurationDays} يوم
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-slate-200/80 dark:bg-slate-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                subData.isExpired
                  ? 'bg-rose-500 w-0'
                  : isUrgent
                  ? 'bg-gradient-to-r from-rose-500 to-amber-500'
                  : isAnnual
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-500'
                  : isMonthly
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                  : 'bg-gradient-to-r from-amber-400 to-amber-500'
              }`}
              style={{ width: `${subData.progressPercent}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
