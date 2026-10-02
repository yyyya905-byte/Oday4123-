import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MessageSquare,
  Lock,
  ExternalLink,
  X,
  Crown,
  Calendar,
  Sparkles,
  Check,
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import { validateLicenseCode, PredefinedLicenseCode } from '../../utils/licenseUtils';

interface AppPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  forceRequired?: boolean;
}

export const AppPurchaseModal: React.FC<AppPurchaseModalProps> = ({ isOpen, onClose, forceRequired = false }) => {
  const {
    isAppPurchased,
    licenseKey,
    licenseExpiresAt,
    licenseRemainingDays,
    licenseRemainingHours,
    isLicenseExpired,
    licenseDurationLabel,
    isLifetimeLicense,
    trialDaysRemaining,
    trialHoursRemaining,
    isTrialExpired,
    activatePurchaseCode,
    settings
  } = useApp();

  const [inputCode, setInputCode] = useState('');
  const [customerName, setCustomerName] = useState(settings.storeNameAr || '');
  const [customerPhone, setCustomerPhone] = useState(settings.phone || '');
  const [error, setError] = useState('');

  // Confirmation Dialog State before saving to localStorage
  interface PendingActivationDetails {
    code: string;
    matchedCode: PredefinedLicenseCode;
    durationLabelAr: string;
    daysGranted: number;
    newExpiresAtIso: string;
    newExpiresAtFormattedAr: string;
    isExtension: boolean;
    currentExpiresFormattedAr?: string;
  }
  const [pendingActivation, setPendingActivation] = useState<PendingActivationDetails | null>(null);
  const [isConfirming, setIsConfirming] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleProceedToConfirmation = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputCode.trim()) {
      setError('يرجى كتابة أو لصق كود التفعيل أولاً');
      return;
    }

    const res = validateLicenseCode(inputCode.trim(), licenseKey);
    if (!res.valid || !res.matchedCode) {
      setError(res.reason || 'كود التفعيل غير صالح');
      return;
    }

    const matched = res.matchedCode;
    const now = new Date();

    // Check if user currently has an active unexpired subscription
    const isExtension = Boolean(
      isAppPurchased &&
      licenseExpiresAt &&
      new Date(licenseExpiresAt).getTime() > now.getTime()
    );
    const baseDate = isExtension ? new Date(licenseExpiresAt!) : now;

    // Calculate new expiration date
    const targetDate = new Date(baseDate.getTime());
    if (matched.duration === '1_year' || matched.durationDays === 365) {
      targetDate.setFullYear(targetDate.getFullYear() + 1);
    } else if (matched.duration === '1_month' || matched.durationDays === 30) {
      targetDate.setMonth(targetDate.getMonth() + 1);
    } else if (matched.durationDays > 0) {
      targetDate.setTime(baseDate.getTime() + matched.durationDays * 24 * 60 * 60 * 1000);
    }

    const formattedAr = targetDate.toLocaleDateString('ar-SA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    let currentExpAr: string | undefined = undefined;
    if (isExtension && licenseExpiresAt) {
      currentExpAr = new Date(licenseExpiresAt).toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }

    setError('');
    setPendingActivation({
      code: inputCode.trim(),
      matchedCode: matched,
      durationLabelAr: matched.durationLabelAr,
      daysGranted: matched.durationDays,
      newExpiresAtIso: targetDate.toISOString(),
      newExpiresAtFormattedAr: formattedAr,
      isExtension,
      currentExpiresFormattedAr: currentExpAr
    });
  };

  const handleFinalConfirm = () => {
    if (!pendingActivation) return;
    setIsConfirming(true);

    const res = activatePurchaseCode(pendingActivation.code, {
      name: customerName,
      phone: customerPhone,
      customExpiresAtIso: pendingActivation.newExpiresAtIso
    });

    if (res.success) {
      setError('');
      setTimeout(() => {
        setIsConfirming(false);
        setPendingActivation(null);
        onClose();
      }, 700);
    } else {
      setIsConfirming(false);
      setError(res.message);
      setPendingActivation(null);
    }
  };

  const whatsappMessage = encodeURIComponent(
    `مرحباً، أود شراء وتفعيل ترخيص نظام كاشير كيان.\nاسم المحل/المتجر: ${settings.storeNameAr || 'متجر جديد'}\nالهاتف: ${settings.phone || ''}\nيرجى تزويدي بكود تفعيل التطبيق.`
  );

  const canDismiss = (!isTrialExpired && !isLicenseExpired) || isAppPurchased || !forceRequired;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in select-none">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col my-auto max-h-[94vh]">
        {/* Header */}
        <div
          className={`relative p-5 text-white shrink-0 ${
            isAppPurchased && !isLicenseExpired
              ? 'bg-gradient-to-r from-emerald-600 to-teal-700'
              : isTrialExpired || isLicenseExpired
              ? 'bg-gradient-to-r from-rose-600 to-amber-700'
              : 'bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center font-black text-xl shrink-0">
                {isAppPurchased && !isLicenseExpired ? (
                  <ShieldCheck className="w-6 h-6 text-emerald-200" />
                ) : isTrialExpired || isLicenseExpired ? (
                  <Lock className="w-6 h-6 text-rose-200" />
                ) : (
                  <KeyRound className="w-6 h-6 text-amber-200" />
                )}
              </div>
              <div>
                <h3 className="font-black text-base sm:text-lg">
                  {isAppPurchased && !isLicenseExpired
                    ? 'الترخيص مفعل بنجاح 👑'
                    : isLicenseExpired
                    ? 'انتهت صلاحية ترخيص التطبيق'
                    : isTrialExpired
                    ? 'انتهت فترة وضع الضيف التجريبي'
                    : 'شراء وتفعيل تطبيق كاشير كيان'}
                </h3>
                <p className="text-xs text-white/80">
                  {isAppPurchased && !isLicenseExpired
                    ? licenseDurationLabel || 'نسخة مرخصة ومدفوعة'
                    : isLicenseExpired
                    ? 'يرجى إدخال كود التفعيل لتجديد الترخيص ومواصلة العمليات'
                    : isTrialExpired
                    ? 'أدخل كود الشراء الممنوح لك للمتابعة واستعادة كافة المزايا'
                    : 'وضع الضيف التجريبي نشط لمدة أسبوع (7 أيام)'}
                </p>
              </div>
            </div>

            {canDismiss && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
                title="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Active License Status Banner */}
          {isAppPurchased && !isLicenseExpired ? (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-black text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>الترخيص الحالي: {licenseDurationLabel}</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-mono text-[10px] font-bold">
                  نشط ✓
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-emerald-200/60 dark:border-emerald-800/60">
                <span className="text-[11px] text-emerald-700 dark:text-emerald-300">
                  كود الترخيص: <span className="font-mono font-bold tracking-widest">••••••••</span>
                </span>
                {!isLifetimeLicense && (
                  <span className="font-bold text-[11px] text-emerald-800 dark:text-emerald-200">
                    متبقي: {licenseRemainingDays} يوم
                  </span>
                )}
              </div>
            </div>
          ) : isLicenseExpired ? (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-900 dark:text-rose-200 flex items-center gap-2.5 text-xs">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <p className="font-black">انتهت مدة الترخيص الخاص بهذا الجهاز</p>
                <p className="text-[11px] text-rose-700 dark:text-rose-300">
                  أدخل كود تجديد صالح (سنة أو شهر) لتجديد الاشتراك ومواصلة العمل.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-slate-800 dark:text-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <span className="font-bold">الوقت المتبقي في وضع الضيف:</span>
              </div>
              <div className="font-mono font-black text-xs text-amber-600 dark:text-amber-400">
                {trialDaysRemaining} أيام و {trialHoursRemaining} ساعات
              </div>
            </div>
          )}

          {/* Visual Subscription Plans Comparison (Year vs Month) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>خيارات ترخيص كاشير كيان المعتمدة:</span>
              </span>
              <span className="text-[10px] font-bold text-slate-400">
                يتعرف النظام تلقائياً على نوع الكود
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Plan 1: Annual Subscription (1 Year) */}
              <div className="relative p-3.5 rounded-2xl border-2 bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/50 dark:border-amber-500/30 flex flex-col justify-between shadow-xs">
                <div className="absolute -top-2.5 left-3 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-[10px] font-black shadow-xs flex items-center gap-1">
                  <span>الأفضل والموصى به ⭐</span>
                </div>

                <div className="space-y-2 pt-1">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-xs shrink-0">
                      <Crown className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-black text-xs text-slate-900 dark:text-white">
                        اشتراك سنوي كامل (1 Year)
                      </h4>
                      <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 block">
                        صلاحية 365 يوماً (سنة كاملة)
                      </span>
                    </div>
                  </div>

                  <ul className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1 pt-1">
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>تفعيل مستمر لمدة عام كامل دون انقطاع</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>نسخ احتياطي سحابي تلقائي لبياناتك</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>كافة ميزات الكاشير والمخازن والتقارير</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-2.5 pt-2 border-t border-amber-500/20 text-center">
                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 block">
                    أدخل كود السنة وسيتفعّل 365 يوماً فوراً
                  </span>
                </div>
              </div>

              {/* Plan 2: Monthly Subscription (1 Month) */}
              <div className="relative p-3.5 rounded-2xl border-2 bg-gradient-to-b from-blue-500/10 via-blue-500/5 to-transparent border-blue-500/40 dark:border-blue-500/30 flex flex-col justify-between shadow-xs">
                <div className="absolute -top-2.5 left-3 px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-black shadow-xs flex items-center gap-1">
                  <span>خيار مرن ⏱️</span>
                </div>

                <div className="space-y-2 pt-1">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black shadow-xs shrink-0">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-black text-xs text-slate-900 dark:text-white">
                        اشتراك شهري (1 Month)
                      </h4>
                      <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 block">
                        صلاحية 30 يوماً (شهر كامل)
                      </span>
                    </div>
                  </div>

                  <ul className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1 pt-1">
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span>تفعيل لمدة 30 يوماً متواصلة</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span>تجربة مرنة وإمكانية التجديد بأي وقت</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span>وصول كامل لكافة شاشات الكاشير</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-2.5 pt-2 border-t border-blue-500/20 text-center">
                  <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 block">
                    أدخل كود الشهر وسيتفعّل 30 يوماً فوراً
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Confirmation Dialog Step OR Activation Input Form */}
          {pendingActivation ? (
            <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-b from-amber-500/15 via-emerald-500/10 to-slate-50 dark:to-slate-900 border-2 border-amber-500/60 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-3 border-b border-amber-500/20 pb-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                      تأكيد تفاصيل الاشتراك الجديد 👑
                    </h4>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-black text-[10px]">
                      كود صالح ومطابق ✓
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    يرجى مراجعة تفاصيل التجديد وتاريخ الانتهاء قبل الحفظ النهائي في النظام:
                  </p>
                </div>
              </div>

              {/* Renewal Breakdown Summary */}
              <div className="space-y-2.5 bg-white/90 dark:bg-slate-800/90 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
                  <span className="text-slate-500 dark:text-slate-400 font-bold">نوع الاشتراك:</span>
                  <span className="font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    {pendingActivation.matchedCode.duration === '1_year' ? (
                      <Crown className="w-4 h-4 text-amber-500" />
                    ) : (
                      <Calendar className="w-4 h-4 text-blue-500" />
                    )}
                    <span>{pendingActivation.durationLabelAr}</span>
                  </span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
                  <span className="text-slate-500 dark:text-slate-400 font-bold">المدة الممنوحة:</span>
                  <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                    +{pendingActivation.daysGranted} يوماً كاملة
                  </span>
                </div>

                {pendingActivation.isExtension && pendingActivation.currentExpiresFormattedAr && (
                  <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 text-[11px] text-blue-900 dark:text-blue-200">
                    <span>💡 ميزة التمديد التراكمي: سيتم إضافة المدة الجديدة فوق موعد انتهائك الحالي ({pendingActivation.currentExpiresFormattedAr}) دون خسارة أي يوم متبقي.</span>
                  </div>
                )}

                <div className="pt-1">
                  <span className="text-slate-500 dark:text-slate-400 font-bold block mb-1">
                    تاريخ انتهاء الاشتراك الجديد بعد التجديد:
                  </span>
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span className="font-black text-xs sm:text-sm text-amber-900 dark:text-amber-200">
                      {pendingActivation.newExpiresAtFormattedAr}
                    </span>
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 dark:text-slate-400 pt-1">
                  🔒 سيتم حفظ هذه البيانات وتاريخ الانتهاء نهائياً في متصفحك (localStorage) واستهلاك الكود فور الضغط على تأكيد.
                </div>
              </div>

              {/* Confirmation Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
                <button
                  type="button"
                  disabled={isConfirming}
                  onClick={handleFinalConfirm}
                  className="w-full sm:flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs shadow-lg shadow-emerald-600/25 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isConfirming ? 'جاري الحفظ والتفعيل...' : 'تأكيد وحفظ الاشتراك نهائياً (localStorage)'}</span>
                </button>

                <button
                  type="button"
                  disabled={isConfirming}
                  onClick={() => setPendingActivation(null)}
                  className="w-full sm:w-auto py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>تراجع وتعديل الكود</span>
                </button>
              </div>
            </div>
          ) : (
            /* Activation Form */
            <form onSubmit={handleProceedToConfirmation} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  كود تفعيل التطبيق (Activation License Key) *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={inputCode}
                    onChange={e => {
                      setInputCode(e.target.value);
                      setError('');
                    }}
                    placeholder="أدخل كود تفعيل التطبيق هنا"
                    className="w-full px-3.5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700 focus:border-amber-500 dark:focus:border-amber-500 focus:outline-none text-slate-900 dark:text-white font-mono font-black text-sm tracking-wider text-center"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/25 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <KeyRound className="w-4 h-4" />
                <span>متابعة لتأكيد تفعيل الاشتراك</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* WhatsApp Support Box */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1.5">
            <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
              <span>كيف أحصل على كود تفعيل التطبيق؟</span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              إذا كنت تشتري هذا التطبيق أو ترغب في ترقيته/تجديده، تواصل مباشرة مع المطور للحصول على كود التفعيل المخصص لمتجرك:
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <a
                href={`https://wa.me/?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
              >
                <span>طلب الكود عبر واتساب</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
          <span>نظام كاشير كيان المتكامل — إصدار 2026</span>
          {canDismiss && (
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:underline cursor-pointer"
            >
              متابعة لاحقاً
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
