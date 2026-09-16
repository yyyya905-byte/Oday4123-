import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { DeviceRole } from '../../types';
import {
  X,
  KeyRound,
  Laptop,
  Tablet,
  Smartphone,
  UtensilsCrossed,
  Tv,
  ScanBarcode,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Radio,
  ArrowLeft,
  Delete,
  ClipboardPaste,
  HelpCircle
} from 'lucide-react';
import { soundEffects } from '../../services/audio';
import { normalizeArabicDigits } from '../../utils/barcodeUtils';

interface ConnectToCashierModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: DeviceRole;
  onSuccessRoleLaunch?: (role: DeviceRole) => void;
}

export const ConnectToCashierModal: React.FC<ConnectToCashierModalProps> = ({
  isOpen,
  onClose,
  defaultRole = 'customer_display',
  onSuccessRoleLaunch
}) => {
  const {
    language,
    pairDevice,
    masterPairingPin,
    setDedicatedDeviceRole,
    notify,
    t
  } = useApp();

  const [enteredPin, setEnteredPin] = useState('');
  const [selectedRole, setSelectedRole] = useState<DeviceRole>(defaultRole);
  const [deviceName, setDeviceName] = useState('');
  const [deviceType, setDeviceType] = useState<'desktop' | 'tablet' | 'mobile'>('tablet');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEnteredPin('');
      setErrorMsg(null);
      setIsSuccess(false);
      setSelectedRole(defaultRole);
      
      const roleDefaults: Record<DeviceRole, { name: string; type: 'desktop' | 'tablet' | 'mobile' }> = {
        customer_display: {
          name: language === 'ar' ? 'شاشة العميل التفاعلية (CFD)' : 'Customer Facing Display',
          type: 'tablet'
        },
        kitchen_display: {
          name: language === 'ar' ? 'شاشة المطبخ والطلبات (KDS)' : 'Kitchen Display System',
          type: 'tablet'
        },
        waiter_mobile: {
          name: language === 'ar' ? 'هاتف النادل المتنقل' : 'Mobile Waiter Pad',
          type: 'mobile'
        },
        stock_scanner: {
          name: language === 'ar' ? 'ماسح الجرد والباركود' : 'Stock Scanner Mobile',
          type: 'mobile'
        },
        secondary_pos: {
          name: language === 'ar' ? 'كاشير فرعي 2' : 'Secondary Cashier Terminal',
          type: 'desktop'
        },
        master_pos: {
          name: language === 'ar' ? 'كاشير مركزي' : 'Master POS',
          type: 'desktop'
        }
      };

      const def = roleDefaults[defaultRole] || roleDefaults.customer_display;
      setDeviceName(def.name);
      setDeviceType(def.type);
    }
  }, [isOpen, defaultRole, language]);

  if (!isOpen) return null;

  const roleList: { id: DeviceRole; label: string; icon: React.ElementType; desc: string; defaultType: 'desktop' | 'tablet' | 'mobile' }[] = [
    {
      id: 'customer_display',
      label: language === 'ar' ? 'شاشة العميل التفاعلية (CFD)' : 'Customer Display (CFD)',
      icon: Tv,
      desc: language === 'ar' ? 'تعرض السلة المباشرة، الأسعار، العروض الترويجية، وكود الدفع' : 'Live cart reflection, prices, promos & QR pay',
      defaultType: 'tablet',
    },
    {
      id: 'kitchen_display',
      label: language === 'ar' ? 'شاشة المطبخ والطلبات (KDS)' : 'Kitchen Display (KDS)',
      icon: UtensilsCrossed,
      desc: language === 'ar' ? 'عرض تذاكر الطلبات الحية، مؤقتات الوجبات، وتنبيهات الطهاة' : 'Live orders, kitchen tickets, timers & alert chimes',
      defaultType: 'tablet',
    },
    {
      id: 'waiter_mobile',
      label: language === 'ar' ? 'هاتف النادل والطلبات' : 'Mobile Waiter Pad',
      icon: Smartphone,
      desc: language === 'ar' ? 'تسجيل طلبات الطاولات والتوصيل وإرسالها لحظياً للكاشير' : 'Table order entry and instant dispatch',
      defaultType: 'mobile',
    },
    {
      id: 'stock_scanner',
      label: language === 'ar' ? 'ماسح الجرد والباركود' : 'Stock Scanner Mobile',
      icon: ScanBarcode,
      desc: language === 'ar' ? 'قراءة الباركود لاسلكياً وإرسال المنتجات للكاشير مباشرة' : 'Scan barcodes wirelessly to cashier cart',
      defaultType: 'mobile',
    },
    {
      id: 'secondary_pos',
      label: language === 'ar' ? 'كاشير فرعي (Satellite POS)' : 'Secondary Cashier POS',
      icon: Laptop,
      desc: language === 'ar' ? 'نقطة بيع إضافية لتخفيف الازدحام ومشاركة المخزون الحي' : 'Extra POS register for busy hours',
      defaultType: 'desktop',
    }
  ];

  const handleSelectRole = (role: DeviceRole) => {
    setSelectedRole(role);
    const item = roleList.find(r => r.id === role);
    if (item) {
      setDeviceType(item.defaultType);
      if (!deviceName || roleList.some(r => r.label === deviceName)) {
        setDeviceName(item.label);
      }
    }
  };

  const handleKeypadPress = (digit: string) => {
    const cleanDigit = normalizeArabicDigits(digit);
    if (enteredPin.length < 6 && cleanDigit) {
      setEnteredPin(prev => (prev + cleanDigit).slice(0, 6));
      setErrorMsg(null);
      soundEffects.buttonClick();
    }
  };

  const handleBackspace = () => {
    setEnteredPin(prev => prev.slice(0, -1));
    setErrorMsg(null);
  };

  const handleClear = () => {
    setEnteredPin('');
    setErrorMsg(null);
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const clean = normalizeArabicDigits(text).slice(0, 6);
      if (clean) {
        setEnteredPin(clean);
        setErrorMsg(null);
        notify('تم لصق الرمز بنجاح', clean, 'info');
      }
    } catch {
      notify('تعذر القراءة من الحافظة', 'يرجى كتابة الرمز يدوياً', 'warning');
    }
  };

  // Physical keyboard listener (desktop / barcode scanner / numpad)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in a text input
      if ((e.target as HTMLElement)?.tagName === 'INPUT' && (e.target as HTMLElement)?.id === 'deviceNameInput') {
        return;
      }

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleKeypadPress(e.key);
      } else if (/[٠-٩]/.test(e.key)) {
        e.preventDefault();
        handleKeypadPress(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmitPairing();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, enteredPin, selectedRole, deviceName, deviceType]);

  const handleSubmitPairing = async () => {
    if (enteredPin.length < 6) {
      setErrorMsg(language === 'ar' ? 'يرجى إدخال رمز PIN كامل مكون من 6 أرقام' : 'Please enter complete 6-digit PIN');
      soundEffects.beep();
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const targetDeviceName = deviceName.trim() || roleList.find(r => r.id === selectedRole)?.label || 'شاشة متصلة';

    try {
      const res = await pairDevice({
        name: targetDeviceName,
        role: selectedRole,
        deviceType,
        pairingCode: enteredPin.trim(),
        cashierName: 'شاشة فرعية مقترنة',
        branchName: 'الفرع الرئيسي'
      });

      if (!res.success) {
        setErrorMsg(res.error || (language === 'ar' 
          ? 'رمز الربط غير صحيح! تأكد من الكود المكون من 6 أرقام المعروض على شاشة الكاشير الرئيسي' 
          : 'Invalid pairing PIN. Check the 6-digit code shown on the Master POS screen'));
        soundEffects.beep();
        setIsSubmitting(false);
        return;
      }

      // Successful handshake
      setIsSuccess(true);
      soundEffects.saleSuccess();
      
      try {
        localStorage.setItem('kian_dedicated_device_role', selectedRole);
        localStorage.setItem('kian_paired_cashier_pin', enteredPin.trim());
      } catch {}

      notify(
        language === 'ar' ? 'تم ربط الشاشة بنجاح!' : 'Screen Paired Successfully!',
        language === 'ar' ? `متصلة الآن بالكاشير المركزي كـ (${targetDeviceName})` : `Connected to Master POS as (${targetDeviceName})`,
        'success'
      );

      setTimeout(() => {
        setIsSuccess(false);
        onClose();
        if (onSuccessRoleLaunch) {
          onSuccessRoleLaunch(selectedRole);
        } else {
          setDedicatedDeviceRole(selectedRole);
        }
      }, 1200);
    } catch (e: any) {
      setErrorMsg(e?.message || 'حدث خطأ أثناء الاتصال بالخادم المركزي');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in select-none">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-amber-600 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black">
                {language === 'ar' ? 'ربط الشاشة بكود الكاشير الرئيسي' : 'Connect Screen to Master POS'}
              </h2>
              <p className="text-xs text-indigo-100">
                {language === 'ar' 
                  ? 'أدخل الرمز الظاهر على شاشة الكاشير لمزامنة هذه الشاشة فورياً' 
                  : 'Enter the PIN shown on Cashier screen to link this terminal'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1">
          {/* Step 1: Select Screen Role */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 block flex items-center justify-between">
              <span>1. {language === 'ar' ? 'حدد وظيفة هذه الشاشة المراد ربطها:' : '1. Select this screen role:'}</span>
              <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                {roleList.find(r => r.id === selectedRole)?.label}
              </span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {roleList.map(opt => {
                const Icon = opt.icon;
                const isSelected = selectedRole === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectRole(opt.id)}
                    className={`p-2.5 rounded-2xl border text-start transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-950 dark:text-white shadow-xs ring-2 ring-indigo-500/30'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`p-1.5 rounded-xl ${isSelected ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold truncate">{opt.label}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-tight">
                      {opt.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: 6-Digit PIN Entry Box */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-amber-500 animate-pulse" />
                <span>2. {language === 'ar' ? 'رمز الربط المكون من 6 أرقام الظاهر على الكاشير:' : '2. Enter the 6-digit PIN from Cashier screen:'}</span>
              </label>

              {/* Paste Button & Hint */}
              <button
                type="button"
                onClick={handlePasteClipboard}
                className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-bold cursor-pointer"
                title="لصق من الحافظة"
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'لصق' : 'Paste'}</span>
              </button>
            </div>

            {/* Visual Digit Boxes with mobile input focus */}
            <div className="relative my-3">
              <input
                id="pinHiddenInput"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={enteredPin}
                onChange={e => {
                  const cleaned = normalizeArabicDigits(e.target.value).slice(0, 6);
                  setEnteredPin(cleaned);
                  setErrorMsg(null);
                }}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                autoComplete="one-time-code"
                aria-label="Pairing PIN"
              />
              <div className="flex items-center justify-center gap-2 sm:gap-3 direction-ltr pointer-events-none" dir="ltr">
                {[0, 1, 2, 3, 4, 5].map(idx => {
                  const char = enteredPin[idx] || '';
                  const isCurrent = enteredPin.length === idx;
                  return (
                    <div
                      key={idx}
                      className={`w-11 h-13 sm:w-12 sm:h-14 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl font-black font-mono shadow-xs transition-all ${
                        char
                          ? 'bg-white dark:bg-slate-900 border-2 border-indigo-500 text-indigo-600 dark:text-amber-400'
                          : isCurrent
                          ? 'bg-indigo-50/50 dark:bg-slate-900 border-2 border-dashed border-amber-400 animate-pulse text-slate-400'
                          : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600'
                      }`}
                    >
                      {char || '•'}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Demo Helper Hint */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
              <span className="flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                <span>{language === 'ar' ? 'الرمز معروض في شاشة الكاشير المركزي (تبويب شبكة الأجهزة)' : 'Find PIN on Cashier terminal > Devices Hub'}</span>
              </span>
              {masterPairingPin && (
                <button
                  type="button"
                  onClick={() => setEnteredPin(masterPairingPin)}
                  className="text-amber-600 dark:text-amber-400 hover:underline font-mono font-bold cursor-pointer"
                  title="استخدام كود الكاشير المتاح على هذا الجهاز للاختبار السريع"
                >
                  {language === 'ar' ? `استخدام (${masterPairingPin})` : `Use (${masterPairingPin})`}
                </button>
              )}
            </div>

            {/* Touchscreen On-Screen Keypad for Tablet & POS screens */}
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <div className="grid grid-cols-3 gap-1.5 max-w-xs mx-auto">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleKeypadPress(num)}
                    className="h-10 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 text-base font-black font-mono text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 shadow-2xs transition-all cursor-pointer"
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleClear}
                  className="h-10 rounded-xl bg-slate-200/80 dark:bg-slate-800/80 hover:bg-slate-300 text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  {language === 'ar' ? 'مسح' : 'Clear'}
                </button>
                <button
                  type="button"
                  onClick={() => handleKeypadPress('0')}
                  className="h-10 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 text-base font-black font-mono text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 shadow-2xs transition-all cursor-pointer"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleBackspace}
                  className="h-10 rounded-xl bg-slate-200/80 dark:bg-slate-800/80 hover:bg-slate-300 text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                  title="حذف رقم"
                >
                  <Delete className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Optional Device Name */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
              3. {language === 'ar' ? 'اسم هذه الشاشة (اختياري للتعريف في لوحة الكاشير):' : '3. Screen name (optional identifier):'}
            </label>
            <input
              type="text"
              value={deviceName}
              onChange={e => setDeviceName(e.target.value)}
              placeholder={language === 'ar' ? 'مثال: شاشة العميل - كاونتر 1' : 'e.g. Customer Screen - Counter 1'}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success Message */}
          {isSuccess && (
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 animate-bounce" />
              <span>{language === 'ar' ? 'تم تأكيد الربط بنجاح! جاري فتح الشاشة المتصلة...' : 'Handshake Verified! Launching linked screen...'}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>{language === 'ar' ? 'ربط آمن بتشفير داخلي وبث فوري' : 'Encrypted mesh & instant relay'}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>

            <button
              id="btn-confirm-connect-by-code"
              type="button"
              onClick={handleSubmitPairing}
              disabled={isSubmitting || isSuccess}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-amber-600 hover:from-indigo-700 hover:to-amber-700 active:scale-95 text-white text-xs font-black shadow-md shadow-indigo-500/20 flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>{isSubmitting ? (language === 'ar' ? 'جاري التحقق والربط...' : 'Linking...') : (language === 'ar' ? 'تأكيد الربط والبدء فوراً' : 'Confirm & Launch')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
