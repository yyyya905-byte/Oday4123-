import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Shield, KeyRound, X, Delete, ShieldCheck, Zap, UserCheck, LogOut, CheckCircle2, RefreshCw, Sparkles, LogIn, Lock } from 'lucide-react';
import { getRoleInfo } from '../../utils/permissions';
import { GoogleIcon } from '../common/GoogleIcon';
import { AUTHORIZED_PURCHASE_GENERATOR_EMAILS } from '../../utils/licenseUtils';

interface PinSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PinSwitchModal: React.FC<PinSwitchModalProps> = ({ isOpen, onClose }) => {
  const {
    users,
    loginWithPin,
    t,
    language,
    currentUser,
    setCurrentUser,
    googleUser,
    isGoogleSignedIn,
    isGoogleAuthLoading,
    signInWithGoogle,
    signOutGoogle,
    isIdleLocked,
    setIsIdleLocked
  } = useApp();

  const [pin, setPin] = useState('');

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    if (pin.length < 6) {
      const nextPin = pin + digit;
      setPin(nextPin);
      if (nextPin.length === 4) {
        // Auto-check 4-digit PIN
        setTimeout(() => {
          const success = loginWithPin(nextPin);
          if (success) {
            setIsIdleLocked(false);
            onClose();
          } else {
            setPin('');
          }
        }, 150);
      }
    }
  };

  const handleQuickLogin = (userPin: string) => {
    const success = loginWithPin(userPin);
    if (success) {
      setIsIdleLocked(false);
      onClose();
    }
  };

  const handleGoogleSignIn = async (hintEmail?: string) => {
    const success = await signInWithGoogle({ hintEmail, role: 'owner' });
    if (success) {
      setIsIdleLocked(false);
      onClose();
    }
  };

  const handleSwitchToGoogleUser = () => {
    if (!googleUser) return;
    const matchingUser = users.find(u => 
      (u.googleEmail && u.googleEmail.toLowerCase() === googleUser.email.toLowerCase()) ||
      (u.email && u.email.toLowerCase() === googleUser.email.toLowerCase())
    );
    if (matchingUser) {
      setCurrentUser(matchingUser);
      setIsIdleLocked(false);
      onClose();
    } else {
      handleGoogleSignIn(googleUser.email);
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPin('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="font-black text-sm text-slate-900 dark:text-white">
                {isIdleLocked ? 'قفل الأمان التلقائي (عدم نشاط 15 دقيقة)' : 'تسجيل الدخول وتبديل المستخدم'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isIdleLocked ? 'أدخل رمز PIN أو سجل الدخول لاستئناف العمل' : 'الدخول عبر حساب Google أو رمز المرور الشخصي (PIN)'}
              </p>
            </div>
          </div>
          {!isIdleLocked && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {isIdleLocked && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300 font-bold shrink-0">
            <Lock className="w-4 h-4 text-amber-500 shrink-0" />
            <span>تم قفل الكاشير تلقائياً بعد مرور 15 دقيقة دون نشاط لحماية البيانات</span>
          </div>
        )}

        <div className="p-4 sm:p-5 overflow-y-auto flex-1 text-center space-y-4">
          {/* ============================================================== */}
          {/* GOOGLE SIGN-IN SECTION */}
          {/* ============================================================== */}
          <div className="bg-gradient-to-br from-slate-50 to-blue-50/40 dark:from-slate-800/50 dark:to-slate-800/20 p-3.5 rounded-2xl border border-blue-100/80 dark:border-slate-700/60 shadow-xs text-start">
            {isGoogleSignedIn && googleUser ? (
              /* Already Signed In with Google */
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-emerald-500 shadow-xs bg-white">
                        {googleUser.picture ? (
                          <img src={googleUser.picture} alt={googleUser.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-amber-600 bg-amber-100">
                            {googleUser.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <span className="absolute -bottom-1 -end-1 p-0.5 bg-white dark:bg-slate-900 rounded-full shadow-2xs">
                        <GoogleIcon className="w-3.5 h-3.5" />
                      </span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-xs text-slate-900 dark:text-white truncate">
                          {googleUser.name}
                        </span>
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-black bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                          متصل بـ Google
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold truncate">
                        حساب المالك المعتمد
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={signOutGoogle}
                    className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer shrink-0"
                    title="تسجيل الخروج من حساب Google"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>

                {/* Switch or Login Button */}
                {currentUser.email !== googleUser.email ? (
                  <button
                    onClick={handleSwitchToGoogleUser}
                    className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>التبديل إلى هذا الحساب (مالك المتجر)</span>
                  </button>
                ) : (
                  <div className="flex items-center justify-between text-[11px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-xl font-bold">
                    <span>أنت مسجل الدخول حالياً بهذا الحساب</span>
                    <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.2 rounded-full">النشط</span>
                  </div>
                )}
              </div>
            ) : (
              /* Not Signed In - Prominent Google Button */
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <GoogleIcon className="w-4 h-4" />
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      تسجيل الدخول الموحد (Google Sign-In)
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                    صلاحية المالك 👑
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  سجّل دخولك بحساب Google للوصول الكامل لكافة شاشات الكاشير، الإعدادات، والنسخ السحابي في Google Drive.
                </p>

                {/* Primary Google Button */}
                <button
                  onClick={() => handleGoogleSignIn()}
                  disabled={isGoogleAuthLoading}
                  className="w-full py-2.5 px-4 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-white text-xs font-black flex items-center justify-center gap-2.5 shadow-sm hover:shadow transition-all active:scale-98 cursor-pointer"
                >
                  {isGoogleAuthLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                  ) : (
                    <GoogleIcon className="w-4 h-4" />
                  )}
                  <span>
                    {isGoogleAuthLoading ? 'جاري الاتصال بـ Google...' : 'تسجيل الدخول باستخدام Google'}
                  </span>
                </button>

                {/* Quick 1-click button for authorized developers */}
                <div className="space-y-1.5 pt-0.5">
                  {AUTHORIZED_PURCHASE_GENERATOR_EMAILS.map((email, idx) => (
                    <button
                      key={email}
                      type="button"
                      onClick={() => handleGoogleSignIn(email)}
                      disabled={isGoogleAuthLoading}
                      className="w-full py-1.5 px-3 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60 text-[11px] font-bold flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>دخول فوري بحساب المطور المعتمد ({idx + 1})</span>
                      </span>
                      <span className="text-[10px] font-black text-blue-600 dark:text-blue-400">دخول ⚡</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="relative my-2 flex items-center justify-center">
            <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
            <span className="bg-white dark:bg-slate-900 px-3 text-[11px] font-bold text-slate-400 uppercase shrink-0">
              أو اختيار موظف بالرمز السري (PIN)
            </span>
          </div>

          {/* Quick Staff Selection Cards */}
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {users.map(u => {
                const roleMeta = getRoleInfo(u.role);
                const isCurrent = currentUser.id === u.id;

                return (
                  <div
                    key={u.id}
                    className={`p-2.5 rounded-2xl border text-start flex items-center justify-between gap-2 transition-all ${
                      isCurrent
                        ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/80 shadow-xs'
                        : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/80 hover:border-amber-300'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-xs text-slate-900 dark:text-white truncate">
                          {u.name}
                        </span>
                        {u.isGoogleAccount && (
                          <span title="حساب مرتبط بـ Google">
                            <GoogleIcon className="w-3 h-3 shrink-0" />
                          </span>
                        )}
                        {isCurrent && (
                          <span className="text-[9px] bg-amber-500 text-slate-950 font-black px-1 rounded">
                            النشط
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-[9px] font-black px-1.5 py-0.2 rounded border ${roleMeta.badgeColor}`}>
                          {roleMeta.badgeLabel}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          PIN: {u.pinCode}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleQuickLogin(u.pinCode)}
                      className="px-2 py-1 rounded-xl text-[10px] font-extrabold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors shrink-0 cursor-pointer shadow-2xs"
                      title={`دخول فوري بحساب ${u.name}`}
                    >
                      دخول
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* PIN Indicators Dots */}
          <div className="pt-1">
            <div className="flex items-center justify-center gap-3 my-2">
              {[0, 1, 2, 3].map(index => (
                <div
                  key={index}
                  className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
                    pin.length > index
                      ? 'bg-amber-500 border-amber-500 scale-110 shadow-xs shadow-amber-500/50'
                      : 'border-slate-300 dark:border-slate-600 bg-transparent'
                  }`}
                />
              ))}
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto mt-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                <button
                  key={num}
                  onClick={() => handleDigit(num)}
                  className="h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-base font-bold text-slate-900 dark:text-white transition-all shadow-xs cursor-pointer"
                >
                  {num}
                </button>
              ))}
              <button
                onClick={handleClear}
                className="h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-xs font-bold text-slate-600 dark:text-slate-400 transition-all cursor-pointer"
              >
                C
              </button>
              <button
                onClick={() => handleDigit('0')}
                className="h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-base font-bold text-slate-900 dark:text-white transition-all shadow-xs cursor-pointer"
              >
                0
              </button>
              <button
                onClick={handleBackspace}
                className="h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 flex items-center justify-center text-slate-600 dark:text-slate-400 transition-all cursor-pointer"
              >
                <Delete className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
