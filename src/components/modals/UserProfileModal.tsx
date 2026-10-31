import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  User,
  Shield,
  Camera,
  Check,
  X,
  Upload,
  RotateCcw,
  KeyRound,
  Sparkles,
  Briefcase,
  Mail,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { GoogleIcon } from '../common/GoogleIcon';
import { soundEffects } from '../../services/audio';
import { UserRole } from '../../types';
import { getRoleInfo } from '../../utils/permissions';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPinSwitch?: () => void;
}

const AVAILABLE_ROLES: { role: UserRole; labelAr: string; descAr: string }[] = [
  { role: 'owner', labelAr: 'مالك المتجر (صلاحيات كاملة)', descAr: 'إدارة كاملة للنظام، الفواتير، الإعدادات، والتقارير المالية' },
  { role: 'admin', labelAr: 'مدير النظام', descAr: 'إدارة النظام والمستخدمين والمنتجات والمخزون' },
  { role: 'manager', labelAr: 'مدير الفرع / الصالة', descAr: 'إدارة المبيعات والمخازن والورديات والخصومات' },
  { role: 'supervisor', labelAr: 'مشرف كاشير', descAr: 'الإشراف على عمليات البيع والمرتجعات وإلغاء الفواتير' },
  { role: 'cashier', labelAr: 'كاشير / نقطة بيع', descAr: 'إجراء عمليات البيع والتحصيل وإصدار الفواتير' },
  { role: 'inventory', labelAr: 'أمين المستودع', descAr: 'إدارة المخزون والتوريد والجرد وسندات النقل' },
  { role: 'accountant', labelAr: 'محاسب مالي', descAr: 'متابعة الديون والمدفوعات والمصاريف والتقارير' },
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  onOpenPinSwitch
}) => {
  const {
    currentUser,
    updateUserProfile,
    googleUser,
    isGoogleSignedIn,
    isGoogleAuthLoading,
    signInWithGoogle,
    signOutGoogle,
    language
  } = useApp();

  const [name, setName] = useState(currentUser.name || '');
  const [jobTitle, setJobTitle] = useState(currentUser.jobTitle || (currentUser.role === 'owner' ? 'مالك المتجر' : 'كاشير معتمد'));
  const [role, setRole] = useState<UserRole>(currentUser.role || 'owner');
  const [avatar, setAvatar] = useState(currentUser.avatar || '');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state when modal opens or user switches
  React.useEffect(() => {
    if (isOpen) {
      setName(currentUser.name || '');
      setJobTitle(currentUser.jobTitle || (currentUser.role === 'owner' ? 'مالك المتجر' : 'كاشير معتمد'));
      setRole(currentUser.role || 'owner');
      setAvatar(currentUser.avatar || '');
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert(language === 'ar' ? 'يرجى اختيار ملف صورة صالح' : 'Please select a valid image');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert(language === 'ar' ? 'حجم الصورة كبير جداً (الحد الأقصى 2MB)' : 'Image is too large (max 2MB)');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setAvatar(result);
        soundEffects.playClick();
      }
      setIsUploading(false);
    };
    reader.onerror = () => {
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRestoreGoogleAvatar = () => {
    if (googleUser?.picture) {
      setAvatar(googleUser.picture);
      soundEffects.playClick();
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    updateUserProfile({
      name: name.trim(),
      jobTitle: jobTitle.trim(),
      role,
      avatar: avatar.trim() || undefined,
    });

    onClose();
  };

  const handleGoogleConnectToggle = async () => {
    if (isGoogleSignedIn) {
      signOutGoogle();
    } else {
      const ok = await signInWithGoogle();
      if (ok && googleUser?.picture) {
        setAvatar(googleUser.picture);
      }
    }
  };

  const currentRoleInfo = getRoleInfo(currentUser.role);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col max-h-[92vh] animate-scale-up"
        dir="rtl"
      >
        {/* Header */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-b border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
              <User className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                الملف الشخصي والحساب
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                تعديل اسم صاحب الحساب، المسمى الوظيفي، وصورة الملف
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              soundEffects.playGlassPress();
              onClose();
            }}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Avatar Section */}
          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06]">
            {/* Avatar Circle with Google Badge */}
            <div className="relative shrink-0">
              <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 shadow-md">
                <div className="w-full h-full rounded-full overflow-hidden bg-slate-900 text-white flex items-center justify-center font-black text-2xl">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt={name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                      onError={() => {
                        // fallback if avatar url fails
                        setAvatar('');
                      }}
                    />
                  ) : (
                    <span>{name.charAt(0) || '👤'}</span>
                  )}
                </div>
              </div>

              {(currentUser.isGoogleAccount || isGoogleSignedIn) && (
                <div
                  className="absolute bottom-0 end-0 bg-white dark:bg-slate-900 rounded-full p-1.5 shadow-md border border-slate-200 dark:border-slate-700"
                  title="حساب Google مرتبط"
                >
                  <GoogleIcon className="w-4 h-4" />
                </div>
              )}
            </div>

            {/* Avatar Actions */}
            <div className="flex-1 text-center sm:text-start space-y-2">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                صورة الحساب
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                تظهر صورتك في شريط الرأس وكافة الإيصالات وسجلات النظام.
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition cursor-pointer shadow-xs active:scale-95"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{isUploading ? 'جاري التحميل...' : 'تغيير الصورة'}</span>
                </button>

                {googleUser?.picture && (
                  <button
                    type="button"
                    onClick={handleRestoreGoogleAvatar}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-200/80 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 text-xs font-bold transition cursor-pointer"
                    title="استعادة صورة حساب Google الأصلية"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>صورة Google</span>
                  </button>
                )}

                {avatar && (
                  <button
                    type="button"
                    onClick={() => {
                      setAvatar('');
                      soundEffects.playClick();
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-bold transition cursor-pointer"
                  >
                    <span>إزالة الصورة</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Google Account Integration Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-l from-slate-50 to-indigo-50/40 dark:from-white/[0.02] dark:to-indigo-950/20 border border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 shadow-xs border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                <GoogleIcon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-slate-900 dark:text-white">
                    حساب Google
                  </span>
                  {isGoogleSignedIn && (
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                      متصل
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {isGoogleSignedIn && googleUser?.email
                    ? googleUser.email
                    : 'سجّل الدخول بحساب Google لمزامنة بياناتك وسجلاتك سحابياً'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleConnectToggle}
              disabled={isGoogleAuthLoading}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                isGoogleSignedIn
                  ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400'
                  : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs'
              }`}
            >
              {isGoogleAuthLoading
                ? 'جاري الاتصال...'
                : isGoogleSignedIn
                ? 'فصل الحساب'
                : 'تسجيل بحساب Google'}
            </button>
          </div>

          {/* Input: Owner / User Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
              اسم صاحب الحساب / المستخدم <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="أدخل اسمك الكامل (مثال: أحمد العلي)"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all placeholder:text-slate-400"
              />
              <div className="absolute inset-y-0 end-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Input: Job Title / الوظيفة */}
          <div className="space-y-1.5">
            <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
              المسمى الوظيفي / وظيفة صاحب الحساب <span className="text-amber-500 font-normal">(المسمى الظاهر في الإيصالات)</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="مثال: مدير المتجر، كبير الكاشيرات، مشرف الصالة..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all placeholder:text-slate-400"
              />
              <div className="absolute inset-y-0 end-3 flex items-center pointer-events-none text-slate-400">
                <Briefcase className="w-4 h-4" />
              </div>
            </div>
            {/* Quick Job Title Pills */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {['مالك المتجر', 'مدير الفرع', 'كبير الكاشيرات', 'مشرف مبيعات', 'أمين المستودع'].map((titlePreset) => (
                <button
                  key={titlePreset}
                  type="button"
                  onClick={() => {
                    setJobTitle(titlePreset);
                    soundEffects.playClick();
                  }}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                    jobTitle === titlePreset
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
                  }`}
                >
                  {titlePreset}
                </button>
              ))}
            </div>
          </div>

          {/* Role Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
              مستوى الصلاحية في النظام
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all cursor-pointer"
            >
              {AVAILABLE_ROLES.map((r) => (
                <option key={r.role} value={r.role} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  {r.labelAr}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              {AVAILABLE_ROLES.find(r => r.role === role)?.descAr}
            </p>
          </div>

          {/* Staff Switch / PIN helper */}
          {onOpenPinSwitch && (
            <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <KeyRound className="w-4 h-4 text-amber-500" />
                <span>تبديل الموظف أو تسجيل الخروج السريع؟</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPinSwitch();
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                تبديل الموظف (PIN)
              </button>
            </div>
          )}
        </form>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50/80 dark:bg-white/[0.02] border-t border-slate-200/80 dark:border-white/[0.08] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              soundEffects.playGlassPress();
              onClose();
            }}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 text-xs font-bold transition cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-l from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black shadow-md shadow-amber-500/20 active:scale-95 transition flex items-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>حفظ التعديلات</span>
          </button>
        </div>
      </div>
    </div>
  );
};
