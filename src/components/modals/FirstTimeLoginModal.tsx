import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { DeviceRole } from '../../types';
import {
  getDefaultWorkPermissionsForRole,
  getDefaultAllowedPagesForRole,
  inferRoleFromDeviceCode,
  SUB_DEVICE_PAGE_LABELS,
} from '../../utils/licenseUtils';
import {
  ShieldCheck,
  Sparkles,
  LogIn,
  Lock,
  Store,
  Phone,
  User,
  Clock,
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  Link2,
  Monitor,
  Smartphone,
  Tablet,
  ScanBarcode,
  UserCheck,
  Briefcase,
  Utensils,
  ChefHat,
  Tv,
  Crown,
  Layers,
} from 'lucide-react';
import { GoogleIcon } from '../common/GoogleIcon';

interface FirstTimeLoginModalProps {
  isOpen: boolean;
  onOpenPurchaseModal?: () => void;
}

export const FirstTimeLoginModal: React.FC<FirstTimeLoginModalProps> = ({
  isOpen,
  onOpenPurchaseModal,
}) => {
  const {
    settings,
    updateSettings,
    completeFirstLogin,
    signInWithGoogle,
    isGoogleAuthLoading,
    users,
    setCurrentUser,
    pairDevice,
    devices,
    subscriptionBoundLinkCode,
    masterPairingPin,
    businessMode,
    setIsFirstLoginModalOpen,
    isFirstLoginCompleted,
  } = useApp();

  const [mode, setMode] = useState<'options' | 'custom_admin' | 'sub_device_link'>('options');
  const [storeName, setStoreName] = useState(settings.storeNameAr || 'متجري الجديد');
  const [adminName, setAdminName] = useState('المدير العام');
  const [phone, setPhone] = useState(settings.phone || '');
  const [pin, setPin] = useState('1234');
  const [error, setError] = useState('');

  // Sub-Device Registration State (ربط الجهاز التابع بالجهاز الرئيسي من صفحة التسجيل للزيارة الأولى)
  const [subDeviceName, setSubDeviceName] = useState('جهاز كاشير فرعي 2');
  const [subUserName, setSubUserName] = useState('أحمد محمود (كاشير)');
  const [subPairingCode, setSubPairingCode] = useState('DEV-CSH-849210');
  const [subRole, setSubRole] = useState<DeviceRole>('secondary_pos');
  const [subDeviceType, setSubDeviceType] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isLinkingSubDevice, setIsLinkingSubDevice] = useState(false);

  const subDevicesOnMaster = useMemo(
    () =>
      devices.filter(
        d =>
          d.role !== 'master_pos' &&
          !d.isMasterDevice &&
          (businessMode === 'restaurant' ||
            (d.role !== 'kitchen_display' && d.role !== 'waiter_mobile'))
      ),
    [devices, businessMode]
  );

  // Detect if entered code matches a device already configured on the Master Device
  const matchedMasterConfiguredDevice = useMemo(() => {
    const clean = subPairingCode.trim().toUpperCase();
    if (!clean) return undefined;
    return devices.find(
      d =>
        d.role !== 'master_pos' &&
        ((d.uniqueDeviceCode && d.uniqueDeviceCode.toUpperCase() === clean) ||
          (d.pairingCode && d.pairingCode.toUpperCase() === clean))
    );
  }, [devices, subPairingCode]);

  const effectiveRoleForPreview: DeviceRole = useMemo(() => {
    if (matchedMasterConfiguredDevice?.role) return matchedMasterConfiguredDevice.role;
    const inferred = inferRoleFromDeviceCode(subPairingCode);
    return inferred || subRole;
  }, [matchedMasterConfiguredDevice, subPairingCode, subRole]);

  const effectiveAllowedPagesForPreview = useMemo(() => {
    if (
      matchedMasterConfiguredDevice?.workPermissions?.allowedPages &&
      matchedMasterConfiguredDevice.workPermissions.allowedPages.length > 0
    ) {
      return matchedMasterConfiguredDevice.workPermissions.allowedPages;
    }
    return getDefaultAllowedPagesForRole(effectiveRoleForPreview);
  }, [matchedMasterConfiguredDevice, effectiveRoleForPreview]);

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
        phone: phone.trim(),
      });
    }

    const adminUser = users.find(u => u.role === 'owner') || users[0];
    if (adminUser) {
      setCurrentUser({
        ...adminUser,
        name: adminName.trim(),
        pinCode: pin,
        phone: phone.trim(),
      });
    }

    completeFirstLogin({
      name: adminName.trim(),
      pinCode: pin,
      phone: phone.trim(),
    });
  };

  const handleSelectPreconfiguredDevice = (dev: (typeof subDevicesOnMaster)[number]) => {
    setError('');
    setSubDeviceName(dev.name);
    setSubUserName(dev.connectedUserName || dev.cashierName || 'موظف مناوب');
    setSubPairingCode(dev.uniqueDeviceCode || dev.pairingCode || subscriptionBoundLinkCode);
    setSubRole(dev.role);
    setSubDeviceType(dev.deviceType || 'desktop');
  };

  const handleRoleChangeInSubForm = (newRole: DeviceRole) => {
    setSubRole(newRole);
    const preset = getDefaultWorkPermissionsForRole(newRole);
    setSubDeviceName(preset.defaultDeviceNameAr);
    setSubDeviceType(preset.defaultDeviceType);
    const matchingDev = subDevicesOnMaster.find(d => d.role === newRole);
    if (matchingDev) {
      setSubPairingCode(matchingDev.uniqueDeviceCode || matchingDev.pairingCode);
      if (matchingDev.connectedUserName || matchingDev.cashierName) {
        setSubUserName(matchingDev.connectedUserName || matchingDev.cashierName || '');
      }
    }
  };

  const handleLinkSubDeviceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!subDeviceName.trim()) {
      setError('يرجى إدخال اسم الجهاز المتصل');
      return;
    }
    if (!subUserName.trim()) {
      setError('يرجى إدخال اسم المستخدم على هذا الجهاز');
      return;
    }
    if (!subPairingCode.trim()) {
      setError('يرجى إدخال كود الربط بالجهاز الرئيسي أو الكود الخاص بالجهاز');
      return;
    }

    setIsLinkingSubDevice(true);
    const preset = getDefaultWorkPermissionsForRole(effectiveRoleForPreview);
    const permissionsWithPages = {
      ...(matchedMasterConfiguredDevice?.workPermissions || preset),
      allowedPages: effectiveAllowedPagesForPreview,
      autoShareDataWithMaster: true,
    };

    const res = await pairDevice({
      name: subDeviceName.trim(),
      role: effectiveRoleForPreview,
      roleLabelAr: matchedMasterConfiguredDevice?.roleLabelAr || preset.roleLabelAr,
      workDescription: matchedMasterConfiguredDevice?.workDescription || preset.workDescription,
      workPermissions: permissionsWithPages,
      pairingCode: subPairingCode.trim(),
      uniqueDeviceCode: subPairingCode.trim().toUpperCase().startsWith('DEV-')
        ? subPairingCode.trim().toUpperCase()
        : matchedMasterConfiguredDevice?.uniqueDeviceCode,
      subscriptionLinkCode: subscriptionBoundLinkCode,
      deviceType: subDeviceType,
      cashierName: subUserName.trim(),
      connectedUserName: subUserName.trim(),
      branchName: 'الفرع الرئيسي',
      registerAsCurrentSubDevice: true,
    });

    setIsLinkingSubDevice(false);

    if (res.success) {
      const cashierUser = users.find(u => u.role === 'cashier') || users[0];
      if (cashierUser) {
        setCurrentUser({
          ...cashierUser,
          name: subUserName.trim(),
          role: effectiveRoleForPreview === 'supervisor' ? 'supervisor' : 'cashier',
        });
      }
      setIsFirstLoginModalOpen(false);
    } else {
      setError(
        res.error || 'كود الربط غير صحيح! تأكد من الكود الخاص بالجهاز أو كود الربط بالجهاز الرئيسي.'
      );
    }
  };

  const allRoleChoices: {
    id: DeviceRole;
    label: string;
    icon: React.FC<{ className?: string }>;
    restaurantOnly?: boolean;
  }[] = [
    { id: 'secondary_pos', label: 'كاشير فرعي (الكاشير + الفواتير)', icon: Monitor },
    { id: 'assistant', label: 'مساعد مبيعات (كاشير + فواتير + منتجات)', icon: UserCheck },
    { id: 'stock_scanner', label: 'أمين مستودع وجرد (المستودع + المنتجات)', icon: ScanBarcode },
    { id: 'supervisor', label: 'مشرف فرع (إشراف ومتابعة)', icon: Briefcase },
    { id: 'waiter_mobile', label: 'نادل / كابتن صالة', icon: Utensils, restaurantOnly: true },
    { id: 'kitchen_display', label: 'شاشة المطبخ (KDS)', icon: ChefHat, restaurantOnly: true },
    { id: 'customer_display', label: 'شاشة عرض الزبون (CFD)', icon: Tv },
  ];
  const roleChoices = allRoleChoices.filter(r => (r.restaurantOnly ? businessMode === 'restaurant' : true));

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in select-none"
      dir="rtl"
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col my-auto max-h-[95vh]">
        {/* Top Visual Banner */}
        <div className="relative p-5 sm:p-6 bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 text-slate-950 text-center overflow-hidden shrink-0">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-black/10 rounded-full blur-xl pointer-events-none" />

          {isFirstLoginCompleted && (
            <button
              type="button"
              onClick={() => setIsFirstLoginModalOpen(false)}
              className="absolute top-4 left-4 px-2.5 py-1 rounded-xl bg-slate-950/20 hover:bg-slate-950/30 text-white text-xs font-bold transition cursor-pointer"
            >
              إغلاق
            </button>
          )}

          <div className="w-12 h-12 mx-auto rounded-2xl bg-white text-amber-600 flex items-center justify-center font-black text-xl shadow-lg shadow-black/10 mb-2.5">
            K
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/20 text-white text-xs font-black backdrop-blur-xs mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>صفحة التسجيل للزيارة الأولى للموقع وربط الأجهزة</span>
          </div>

          <h2 className="text-lg sm:text-xl font-black text-slate-950">
            مرحباً بك في نظام كاشير كيان
          </h2>
          <p className="text-xs text-slate-900/90 font-bold mt-1 max-w-md mx-auto">
            اختر تسجيل الدخول كـ <strong className="font-black text-slate-950">جهاز رئيسي</strong> أو{' '}
            <strong className="font-black text-slate-950">ربط هذا الجهاز كجهاز تابع للجهاز الرئيسي</strong>
          </p>

          {/* Top Mode Switcher Tabs inside First-Time Login Page */}
          <div className="mt-4 grid grid-cols-2 gap-2 bg-slate-950/15 p-1.5 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setError('');
                setMode('options');
              }}
              className={`py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer ${
                mode !== 'sub_device_link'
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <Crown className="w-3.5 h-3.5 text-amber-500" />
              <span>تسجيل كجهاز رئيسي</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setError('');
                setMode('sub_device_link');
              }}
              className={`py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer ${
                mode === 'sub_device_link'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <Link2 className="w-3.5 h-3.5 text-amber-300" />
              <span>ربط جهاز تابع بالرئيسي</span>
            </button>
          </div>
        </div>

        {/* Trial Feature Highlight Pill */}
        {mode !== 'sub_device_link' ? (
          <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200/80 dark:border-amber-900/40 px-4 py-2 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300 shrink-0">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="font-bold">وضع الضيف متاح لك لمدة 7 أيام متواصلة مجاناً</span>
            </div>
            <span className="text-[10px] font-black bg-amber-200/80 dark:bg-amber-900/60 px-2 py-0.5 rounded-full">
              مجاني بالكامل
            </span>
          </div>
        ) : (
          <div className="bg-indigo-50 dark:bg-indigo-950/40 border-b border-indigo-200/80 dark:border-indigo-900/50 px-4 py-2 flex items-center justify-between text-xs text-indigo-800 dark:text-indigo-300 shrink-0">
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span className="font-bold">
                ربط الجهاز التابع بالجهاز الرئيسي وتطبيق صلاحيات الصفحات المحددة له تلقائياً
              </span>
            </div>
            <span className="text-[10px] font-black bg-indigo-200/80 dark:bg-indigo-900/60 px-2 py-0.5 rounded-full">
              تزامن فوري
            </span>
          </div>
        )}

        {/* Body Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-bold text-center">
              {error}
            </div>
          )}

          {mode === 'options' && (
            <div className="space-y-3">
              {/* Option 1: Google One-Click Sign In */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isGoogleAuthLoading}
                className="w-full p-3.5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-amber-500 dark:hover:border-amber-500 bg-slate-50/60 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 transition-all flex items-center justify-between group cursor-pointer shadow-xs active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white shadow-xs border border-slate-100 flex items-center justify-center shrink-0">
                    <GoogleIcon className="w-5 h-5" />
                  </div>
                  <div className="text-start">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      الدخول عبر حساب Google (الجهاز الرئيسي)
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      مزامنة سريعة وتأمين الوصول السحابي للمتجر
                    </p>
                  </div>
                </div>
                <LogIn className="w-5 h-5 text-slate-400 group-hover:text-amber-500 group-hover:-translate-x-1 transition-all shrink-0" />
              </button>

              {/* Option 2: Custom Admin & Store Setup */}
              <button
                type="button"
                onClick={() => setMode('custom_admin')}
                className="w-full p-3.5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-amber-500 dark:hover:border-amber-500 bg-slate-50/60 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 transition-all flex items-center justify-between group cursor-pointer shadow-xs active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="text-start">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      تخصيص بيانات المتجر والمسؤول الرئيسي
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      تحديد اسم المتجر، اسم المسؤول، ورمز PIN خاص بك
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
                <span>الدخول السريع كجهاز رئيسي (PIN: 1234)</span>
              </button>

              {/* Option 4: Prominent Sub-Device Link Card right inside First-Time Registration */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setMode('sub_device_link');
                  }}
                  className="w-full p-4 rounded-2xl border-2 border-indigo-500/40 dark:border-indigo-500/40 bg-gradient-to-l from-indigo-50 via-violet-50 to-indigo-50 dark:from-indigo-950/50 dark:via-violet-950/40 dark:to-indigo-950/50 hover:border-indigo-500 text-right flex items-center justify-between gap-3 transition-all cursor-pointer shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/25">
                      <Link2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs sm:text-sm font-black text-indigo-950 dark:text-white">
                          ربط هذا الجهاز كجهاز تابع للجهاز الرئيسي
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-600 text-white">
                          كاشير / مستودع / مساعد
                        </span>
                      </div>
                      <p className="text-[11px] text-indigo-700 dark:text-indigo-300 mt-0.5">
                        سجّل اسم الجهاز المتصل واسم المستخدم وأدخل كود الجهاز الرئيسي (تظهر فقط الصفحات التي يحددها الرئيسي)
                      </p>
                    </div>
                  </div>
                  <ArrowLeft className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                </button>
              </div>
            </div>
          )}

          {mode === 'custom_admin' && (
            <form onSubmit={handleCustomAdminSubmit} className="space-y-3.5">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-500">إعداد المسؤول والجهاز الرئيسي</span>
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
                <span>حفظ وبدء النظام كجهاز رئيسي</span>
              </button>
            </form>
          )}

          {mode === 'sub_device_link' && (
            <form onSubmit={handleLinkSubDeviceSubmit} className="space-y-4">
              {/* Quick Selection from Master Pre-Configured Devices */}
              {subDevicesOnMaster.length > 0 && (
                <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-3">
                  <span className="text-[11px] font-black text-slate-600 dark:text-slate-300 block mb-2">
                    أجهزة مضافة مسبقاً في لوحة الجهاز الرئيسي (اضغط للتعبئة التلقائية):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {subDevicesOnMaster.map(dev => {
                      const code = dev.uniqueDeviceCode || dev.pairingCode;
                      const isSelected =
                        subPairingCode.trim().toUpperCase() === String(code).toUpperCase();
                      return (
                        <button
                          key={dev.id}
                          type="button"
                          onClick={() => handleSelectPreconfiguredDevice(dev)}
                          className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                          }`}
                        >
                          <span>{dev.name}</span>
                          <span className="font-mono text-[10px] opacity-80" dir="ltr">
                            ({code})
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Connected Device Name & Connected User Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-200 mb-1">
                    اسم الجهاز المتصل (يظهر للجهاز الرئيسي)
                  </label>
                  <div className="relative">
                    <Monitor className="w-4 h-4 text-indigo-500 absolute start-3 top-3" />
                    <input
                      type="text"
                      value={subDeviceName}
                      onChange={e => setSubDeviceName(e.target.value)}
                      placeholder="مثال: جهاز كاشير فرعي 2"
                      required
                      className="w-full ps-9 pe-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-200 mb-1">
                    اسم المستخدم / الموظف (يظهر للجهاز الرئيسي)
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-emerald-500 absolute start-3 top-3" />
                    <input
                      type="text"
                      value={subUserName}
                      onChange={e => setSubUserName(e.target.value)}
                      placeholder="مثال: أحمد محمود (كاشير)"
                      required
                      className="w-full ps-9 pe-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Pairing Code Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-200">
                    الكود الخاص بالجهاز التابع أو كود الربط بالجهاز الرئيسي
                  </label>
                  <button
                    type="button"
                    onClick={() => setSubPairingCode(subscriptionBoundLinkCode || masterPairingPin)}
                    className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    استخدام كود الرئيسي ({subscriptionBoundLinkCode})
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-indigo-500 absolute start-3.5 top-3.5" />
                  <input
                    type="text"
                    value={subPairingCode}
                    onChange={e => setSubPairingCode(e.target.value.toUpperCase())}
                    placeholder="مثال: DEV-CSH-849210"
                    dir="ltr"
                    required
                    className="w-full ps-10 pe-3 py-2.5 bg-indigo-50/50 dark:bg-slate-950 border-2 border-indigo-300 dark:border-indigo-800 rounded-xl text-sm sm:text-base font-mono font-black tracking-wider text-center text-indigo-700 dark:text-indigo-300 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Role Selection & Hardware Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-200 mb-1">
                    الوظيفة المحددة للجهاز التابع من الجهاز الرئيسي
                  </label>
                  <select
                    value={effectiveRoleForPreview}
                    onChange={e => handleRoleChangeInSubForm(e.target.value as DeviceRole)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {roleChoices.map(rc => (
                      <option key={rc.id} value={rc.id}>
                        {rc.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-200 mb-1">
                    نوع الجهاز
                  </label>
                  <div className="grid grid-cols-3 gap-1">
                    {(
                      [
                        { id: 'desktop', label: 'كمبيوتر', icon: Monitor },
                        { id: 'tablet', label: 'تابلت', icon: Tablet },
                        { id: 'mobile', label: 'جوال', icon: Smartphone },
                      ] as const
                    ).map(t => {
                      const TIcon = t.icon;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setSubDeviceType(t.id)}
                          className={`py-2 px-1 rounded-xl border text-[10px] font-black flex flex-col items-center justify-center gap-0.5 transition cursor-pointer ${
                            subDeviceType === t.id
                              ? 'border-indigo-600 bg-indigo-600 text-white'
                              : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <TIcon className="w-3.5 h-3.5" />
                          <span>{t.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Preview of Allowed Pages strictly enforced by Master Device */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/70 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    الصفحات التي ستظهر لهذا الجهاز فقط (حسب تحديد الجهاز الرئيسي):
                  </span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                    {effectiveAllowedPagesForPreview.length} صفحات فقط
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {effectiveAllowedPagesForPreview.map(pageId => (
                    <span
                      key={pageId}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-[11px] font-black flex items-center gap-1 shadow-2xs"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      {SUB_DEVICE_PAGE_LABELS[pageId] || pageId}
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  {effectiveRoleForPreview === 'secondary_pos'
                    ? 'بما أن الجهاز الرئيسي حدد هذا الجهاز كـ (كاشير فرعي)، لن تظهر له سوى صفحة الكاشير وصفحة الفواتير فقط.'
                    : 'يتم إخفاء جميع الصفحات الأخرى تلقائياً بناءً على صلاحيات الجهاز الرئيسي.'}
                </p>
              </div>

              <button
                type="submit"
                disabled={isLinkingSubDevice}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-l from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50"
              >
                <Link2 className="w-4 h-4" />
                <span>
                  {isLinkingSubDevice
                    ? 'جاري ربط الجهاز التابع بالجهاز الرئيسي...'
                    : `ربط الجهاز (${subDeviceName}) باسم المستخدم (${subUserName})`}
                </span>
              </button>
            </form>
          )}
        </div>

        {/* Footer info & Purchase Code trigger */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-center text-[11px] text-slate-500 shrink-0">
          <span>
            يتم ربط الأجهزة التابعة بالجهاز الرئيسي من هذه الصفحة مع تطبيق الصفحات المحددة لكل جهاز.
          </span>
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
