import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, KeyRound, Sparkles, CheckCircle2, Clock, AlertTriangle, MessageSquare, Copy, Check, Lock, ChevronDown, ChevronUp, ExternalLink, X, Crown, LogIn, UserCheck } from 'lucide-react';
import { generateLicenseCode, MASTER_ACTIVATION_CODES, isAuthorizedToGenerateCodes, AUTHORIZED_PURCHASE_GENERATOR_EMAILS } from '../../utils/licenseUtils';

interface AppPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  forceRequired?: boolean;
}

export const AppPurchaseModal: React.FC<AppPurchaseModalProps> = ({ isOpen, onClose, forceRequired = false }) => {
  const {
    isAppPurchased,
    licenseKey,
    trialDaysRemaining,
    trialHoursRemaining,
    isTrialExpired,
    activatePurchaseCode,
    settings,
    currentUser,
    googleUser,
    signInWithGoogle
  } = useApp();

  const [inputCode, setInputCode] = useState('');
  const [customerName, setCustomerName] = useState(settings.storeNameAr || '');
  const [customerPhone, setCustomerPhone] = useState(settings.phone || '');
  const [error, setError] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showDevGenerator, setShowDevGenerator] = useState(true);
  const [generatedCode, setGeneratedCode] = useState('');
  const [isSigningInDev, setIsSigningInDev] = useState(false);

  // Determine if active user is one of the authorized Gmails
  const activeEmail = (
    googleUser?.email ||
    currentUser?.googleEmail ||
    currentUser?.email ||
    ''
  ).trim().toLowerCase();

  const isAuthorized = isAuthorizedToGenerateCodes(activeEmail);

  if (!isOpen) return null;

  const handleActivate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputCode.trim()) {
      setError('يرجى كتابة أو لصق كود الشراء أولاً');
      return;
    }

    const res = activatePurchaseCode(inputCode.trim(), {
      name: customerName,
      phone: customerPhone
    });

    if (res.success) {
      setError('');
      setTimeout(() => {
        onClose();
      }, 700);
    } else {
      setError(res.message);
    }
  };

  const handleGenerateKey = () => {
    const code = generateLicenseCode(customerPhone || customerName || 'KIAN');
    setGeneratedCode(code);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleApplyPreset = (code: string) => {
    setInputCode(code);
    setError('');
  };

  const whatsappMessage = encodeURIComponent(
    `مرحباً، أود شراء وتفعيل ترخيص نظام كاشير كيان.\nاسم المحل/المتجر: ${settings.storeNameAr || 'متجر جديد'}\nالهاتف: ${settings.phone || ''}\nيرجى تزويدي بكود شراء التطبيق.`
  );

  const canDismiss = !isTrialExpired || isAppPurchased || !forceRequired;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in select-none">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col my-auto max-h-[94vh]">
        {/* Header */}
        <div className={`relative p-5 text-white shrink-0 ${
          isAppPurchased
            ? 'bg-gradient-to-r from-emerald-600 to-teal-700'
            : isTrialExpired
            ? 'bg-gradient-to-r from-rose-600 to-amber-700'
            : 'bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center font-black text-xl shrink-0">
                {isAppPurchased ? (
                  <ShieldCheck className="w-6 h-6 text-emerald-200" />
                ) : isTrialExpired ? (
                  <Lock className="w-6 h-6 text-rose-200" />
                ) : (
                  <KeyRound className="w-6 h-6 text-amber-200" />
                )}
              </div>
              <div>
                <h3 className="font-black text-base sm:text-lg">
                  {isAppPurchased
                    ? 'الترخيص الدائم مفعل بنجاح 👑'
                    : isTrialExpired
                    ? 'انتهت فترة وضع الضيف التجريبي'
                    : 'شراء وترخيص تطبيق كاشير كيان'}
                </h3>
                <p className="text-xs text-white/80">
                  {isAppPurchased
                    ? 'نسخة مرخصة ومدفوعة بالكامل مدى الحياة'
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

        {/* Status Banner */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 shrink-0">
          {isAppPurchased ? (
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-300 text-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div className="flex-1">
                <span className="font-bold block">التطبيق مرخص بالكامل مدى الحياة</span>
                <span className="text-[11px] opacity-80 font-mono">الكود: {licenseKey || 'مفعل'}</span>
              </div>
            </div>
          ) : isTrialExpired ? (
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-300 text-xs">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <div className="flex-1">
                <span className="font-black block">انتهت مدة الأسبوع التجريبي المجاني</span>
                <span className="text-[11px] opacity-90">
                  يرجى إدخال كود شراء التطبيق الممنوح لك من المطور لفتح النظام بشكل دائم
                </span>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-300 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="font-black">وضع الضيف التجريبي نشط الآن</span>
                </div>
                <span className="font-black bg-amber-200/70 dark:bg-amber-900/60 px-2 py-0.5 rounded-full text-[10px]">
                  متبقي {trialDaysRemaining} أيام و {trialHoursRemaining} ساعة
                </span>
              </div>
              <div className="w-full bg-amber-200/50 dark:bg-amber-900/40 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all"
                  style={{ width: `${Math.max(5, Math.min(100, ((trialDaysRemaining * 24 + trialHoursRemaining) / 168) * 100))}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Form & Purchase Code Input Section */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
          <form onSubmit={handleActivate} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-800 dark:text-slate-200 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-amber-500" />
                  <span>أدخل كود شراء التطبيق (Activation License Key)</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">يمنحه لك المطور</span>
              </label>

              <div className="relative">
                <input
                  type="text"
                  value={inputCode}
                  onChange={e => {
                    setInputCode(e.target.value.toUpperCase());
                    setError('');
                  }}
                  placeholder="مثال: KIAN-PRO-2026 أو الكود الممنوح لك"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700 focus:border-amber-500 rounded-2xl text-sm sm:text-base font-mono font-black text-center tracking-wider text-slate-900 dark:text-white uppercase transition-all shadow-inner"
                  required
                />
              </div>

              {error && (
                <p className="text-xs text-rose-500 font-bold mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{error}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all cursor-pointer active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4" />
              <span>تفعيل وشراء التطبيق الآن</span>
            </button>
          </form>

          {/* Contact Developer for Code */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2.5">
            <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
              <span>كيف أحصل على كود شراء التطبيق؟</span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              إذا كنت تشتري هذا التطبيق أو ترغب في ترقيته إلى نسخة دائمة غير مقيدة، تواصل مباشرة مع المطور للحصول على كود التفعيل المخصص لمتجرك:
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

          {/* Developer / Master Keys Helper (Exclusively for authorized developer emails) */}
          {isAuthorized ? (
            <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 dark:bg-amber-950/30 dark:border-amber-500/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-xs">
                    <Crown className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>أدوات صاحب النظام لإنشاء الأكواد</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-bold">
                        مطور معتمد
                      </span>
                    </h4>
                    <p className="text-[11px] text-amber-700 dark:text-amber-300 font-bold">
                      تم التحقق من هوية المطور المعتمد ✓
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowDevGenerator(!showDevGenerator)}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-800 dark:text-amber-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                >
                  <span>{showDevGenerator ? 'إخفاء' : 'عرض'}</span>
                  {showDevGenerator ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {showDevGenerator && (
                <div className="space-y-3 pt-2 border-t border-amber-500/20 text-xs">
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    يمكنك كصاحب النظام إنشاء وتوليد كود شراء جديد مخصص للزبون بنقرة واحدة، أو استخدام الأكواد المعتمدة:
                  </p>

                  {/* Primary Action Button: Generate Purchase Code */}
                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        type="button"
                        onClick={handleGenerateKey}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 transition-all cursor-pointer active:scale-95 shrink-0"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>زر إنشاء كود شراء جديد</span>
                      </button>

                      {generatedCode && (
                        <div className="flex-1 flex items-center justify-between px-3 py-2 bg-white dark:bg-slate-800 rounded-xl border-2 border-amber-400 dark:border-amber-600 font-mono text-xs shadow-inner">
                          <span className="font-black text-amber-600 dark:text-amber-400 text-sm tracking-wider">
                            {generatedCode}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleCopy(generatedCode)}
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors cursor-pointer"
                              title="نسخ الكود للحافظة"
                            >
                              {copiedKey === generatedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApplyPreset(generatedCode)}
                              className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-[11px] font-black cursor-pointer shadow-2xs"
                            >
                              تطبيق بالكود
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Master Activation Keys Preset List */}
                  <div className="pt-2 border-t border-amber-500/15 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">
                      أكواد رئيسية جاهزة للتسليم المباشر:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {MASTER_ACTIVATION_CODES.map(code => (
                        <button
                          key={code}
                          type="button"
                          onClick={() => handleApplyPreset(code)}
                          className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-amber-500 text-[11px] font-mono font-bold text-slate-700 dark:text-slate-200 cursor-pointer shadow-2xs hover:bg-amber-50 dark:hover:bg-slate-700 transition-all"
                          title="انقر لوضعه في خانة الكود"
                        >
                          {code}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>إنشاء وتوليد الأكواد محصور بالمطور المعتمد فقط</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                زر إنشاء وتوليد أكواد الشراء متاح حصراً للمطور المعتمد ومالك النظام. إذا كنت صاحب النظام، يمكنك تسجيل الدخول للتحقق وعرض زر الإنشاء:
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {AUTHORIZED_PURCHASE_GENERATOR_EMAILS.map((email, idx) => (
                  <button
                    key={email}
                    type="button"
                    disabled={isSigningInDev}
                    onClick={async () => {
                      setIsSigningInDev(true);
                      await signInWithGoogle({ hintEmail: email });
                      setIsSigningInDev(false);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-amber-500 text-[11px] font-bold text-slate-700 dark:text-slate-200 cursor-pointer transition-all shadow-2xs hover:bg-amber-50 dark:hover:bg-slate-700"
                  >
                    <LogIn className="w-3 h-3 text-amber-500" />
                    <span>دخول بحساب المطور المعتمد ({idx + 1})</span>
                  </button>
                ))}
              </div>
            </div>
          )}
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
