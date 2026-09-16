import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, Sparkles, LogIn, Lock, Store, Phone, User, Clock, ArrowLeft, CheckCircle2, KeyRound } from 'lucide-react';
import { GoogleIcon } from '../common/GoogleIcon';

interface FirstTimeLoginModalProps {
  isOpen: boolean;
  onOpenPurchaseModal?: () => void;
}

export const FirstTimeLoginModal: React.FC<FirstTimeLoginModalProps> = ({ isOpen, onOpenPurchaseModal }) => {
  const {
    settings,
    updateSettings,
    completeFirstLogin,
    signInWithGoogle,
    isGoogleAuthLoading,
    users,
    setCurrentUser,
    setIsConnectToCashierModalOpen,
    t
  } = useApp();

  const [mode, setMode] = useState<'options' | 'custom_admin'>('options');
  const [storeName, setStoreName] = useState(settings.storeNameAr || 'متجري الجديد');
  const [adminName, setAdminName] = useState('المدير العام');
  const [phone, setPhone] = useState(settings.phone || '');
  const [pin, setPin] = useState('1234');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    try {
      const success = await signInWithGoogle({ role: 'owner' });
      if (success) {
        completeFirstLogin({ name: adminName });
      }
    } catch {
      setError('تعذر تسجيل الدخول عبر Google، يمكنك المتابعة بحساب الكاشير المحلي.');
    }
  };

  const handleQuickDefaultLogin = () => {
    const adminUser = users.find(u => u.role === 'owner') || users[0];
    if (adminUser) {
      setCurrentUser(adminUser);
    }
    completeFirstLogin();
  };

  const handleCustomAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminName.trim()) {
      setError('يرجى كتابة اسم المسؤول');
      return;
    }
    if (pin.length < 4) {
      setError('رمز PIN السري يجب أن يتكون من 4 أرقام');
      return;
    }

    if (storeName.trim()) {
      updateSettings({
        storeNameAr: storeName.trim(),
        phone: phone.trim()
      });
    }

    const adminUser = users.find(u => u.role === 'owner') || users[0];
    if (adminUser) {
      setCurrentUser({
        ...adminUser,
        name: adminName.trim(),
        pinCode: pin,
        phone: phone.trim()
      });
    }

    completeFirstLogin({
      name: adminName.trim(),
      pinCode: pin,
      phone: phone.trim()
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in select-none">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col my-auto max-h-[95vh]">
        {/* Top Visual Banner */}
        <div className="relative p-6 bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-slate-950 text-center overflow-hidden shrink-0">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-black/10 rounded-full blur-xl pointer-events-none" />

          <div className="w-14 h-14 mx-auto rounded-2xl bg-white text-amber-600 flex items-center justify-center font-black text-2xl shadow-lg shadow-black/10 mb-3">
            K
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/20 text-white text-xs font-black backdrop-blur-xs mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>تسجيل الدخول الإلزامي الأول</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-950">
            مرحباً بك في نظام كاشير كيان
          </h2>
          <p className="text-xs sm:text-sm text-slate-900/90 font-medium mt-1 max-w-sm mx-auto">
            سجل دخولك الآن للبدء بـ <strong className="font-black text-slate-950">وضع الضيف المجاني لمدة أسبوع (7 أيام)</strong> وتجربة كافة المزايا.
          </p>
        </div>

        {/* Trial Feature Highlight Pill */}
        <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200/80 dark:border-amber-900/40 px-4 py-2.5 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300 shrink-0">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="font-bold">وضع الضيف متاح لك لمدة 7 أيام متواصلة مجاناً</span>
          </div>
          <span className="text-[10px] font-black bg-amber-200/80 dark:bg-amber-900/60 px-2 py-0.5 rounded-full">
            مجاني بالكامل
          </span>
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-bold text-center">
              {error}
            </div>
          )}

          {mode === 'options' ? (
            <div className="space-y-3.5">
              {/* Option 1: Google One-Click Sign In */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isGoogleAuthLoading}
                className="w-full p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-amber-500 dark:hover:border-amber-500 bg-slate-50/60 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 transition-all flex items-center justify-between group cursor-pointer shadow-xs active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white shadow-xs border border-slate-100 flex items-center justify-center shrink-0">
                    <GoogleIcon className="w-5 h-5" />
                  </div>
                  <div className="text-start">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      الدخول عبر حساب Google
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      مزامنة سريعة وتأمين الوصول السحابي
                    </p>
                  </div>
                </div>
                <LogIn className="w-5 h-5 text-slate-400 group-hover:text-amber-500 group-hover:-translate-x-1 transition-all shrink-0" />
              </button>

              {/* Option 2: Custom Admin & Store Setup */}
              <button
                type="button"
                onClick={() => setMode('custom_admin')}
                className="w-full p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-amber-500 dark:hover:border-amber-500 bg-slate-50/60 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 transition-all flex items-center justify-between group cursor-pointer shadow-xs active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="text-start">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      تخصيص بيانات المتجر والمسؤول
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      تحديد اسم المتجر، اسمك، ورمز PIN خاص بك
                    </p>
                  </div>
                </div>
                <LogIn className="w-5 h-5 text-slate-400 group-hover:text-amber-500 group-hover:-translate-x-1 transition-all shrink-0" />
              </button>

              {/* Option 3: Quick 1-Click Master Access */}
              <button
                type="button"
                onClick={handleQuickDefaultLogin}
                className="w-full p-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 transition-all cursor-pointer active:scale-[0.98]"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>الدخول السريع كمسؤول النظام (PIN: 1234)</span>
              </button>

              {/* Option 4: Link as Secondary Screen / Cashier Companion */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsConnectToCashierModalOpen(true)}
                  className="w-full p-3 rounded-2xl border border-dashed border-indigo-300 dark:border-indigo-800/80 bg-indigo-50/50 dark:bg-indigo-950/30 hover:bg-indigo-100/50 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <KeyRound className="w-4 h-4 text-indigo-500" />
                  <span>هل هذه شاشة ثانية أو تابلت فرعي؟ اربطها بكود PIN الكاشير الرئيسي</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCustomAdminSubmit} className="space-y-3.5">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-500">إعداد المسؤول والمتجر</span>
                <button
                  type="button"
                  onClick={() => setMode('options')}
                  className="text-xs text-amber-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>الرجوع</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  اسم المتجر أو المحل
                </label>
                <div className="relative">
                  <Store className="w-4 h-4 text-slate-400 absolute start-3 top-3" />
                  <input
                    type="text"
                    value={storeName}
                    onChange={e => setStoreName(e.target.value)}
                    placeholder="مثال: سوبرماركت البركة"
                    className="w-full ps-9 pe-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  اسم المسؤول / الكاشير الرئيسي
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute start-3 top-3" />
                  <input
                    type="text"
                    value={adminName}
                    onChange={e => setAdminName(e.target.value)}
                    placeholder="مثال: أحمد محمد"
                    required
                    className="w-full ps-9 pe-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    رمز PIN (4 أرقام)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute start-3 top-3" />
                    <input
                      type="password"
                      maxLength={4}
                      value={pin}
                      onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="1234"
                      required
                      className="w-full ps-9 pe-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono font-bold tracking-widest text-center"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    رقم الهاتف (اختياري)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute start-3 top-3" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="09xxxxxxxx"
                      className="w-full ps-9 pe-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-center"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 transition-all cursor-pointer mt-2 active:scale-[0.98]"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>حفظ وبدء وضع الضيف (7 أيام مجاناً)</span>
              </button>
            </form>
          )}
        </div>

        {/* Footer info & Purchase Code trigger */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-center text-[11px] text-slate-500 shrink-0">
          <span>دخول إلزامي لأول مرة لتأمين بياناتك، يليه أسبوع تجريبي بوضع الضيف.</span>
          {onOpenPurchaseModal && (
            <button
              type="button"
              onClick={onOpenPurchaseModal}
              className="inline-flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>معك كود شراء؟ اضغط هنا</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
