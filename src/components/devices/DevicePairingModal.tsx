import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { DeviceRole } from '../../types';
import QRCode from 'qrcode';
import {
  X,
  QrCode,
  KeyRound,
  Laptop,
  Tablet,
  Smartphone,
  UtensilsCrossed,
  Tv,
  ScanBarcode,
  CheckCircle2,
  Copy,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Radio
} from 'lucide-react';

interface DevicePairingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DevicePairingModal: React.FC<DevicePairingModalProps> = ({ isOpen, onClose }) => {
  const { 
    t, 
    language, 
    masterPairingPin, 
    refreshMasterPin, 
    pairDevice,
    settings,
    setIsConnectToCashierModalOpen
  } = useApp();

  const [selectedRole, setSelectedRole] = useState<DeviceRole>('kitchen_display');
  const [deviceName, setDeviceName] = useState('');
  const [deviceType, setDeviceType] = useState<'desktop' | 'tablet' | 'mobile'>('tablet');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);

  // Generate pairing URL with role parameter
  const pairingUrl = `${window.location.origin}${window.location.pathname}?pairPin=${masterPairingPin}&role=${selectedRole}`;

  useEffect(() => {
    QRCode.toDataURL(pairingUrl, {
      width: 260,
      margin: 2,
      color: {
        dark: '#1e293b',
        light: '#ffffff'
      }
    }).then(url => {
      setQrDataUrl(url);
    }).catch(err => {
      console.error("QR Code Error:", err);
    });
  }, [pairingUrl, masterPairingPin, selectedRole]);

  if (!isOpen) return null;

  const roleOptions: { id: DeviceRole; label: string; icon: React.ElementType; desc: string; defaultName: string; defaultType: 'desktop' | 'tablet' | 'mobile' }[] = [
    {
      id: 'kitchen_display',
      label: language === 'ar' ? 'شاشة المطبخ (KDS)' : 'Kitchen Display (KDS)',
      icon: UtensilsCrossed,
      desc: language === 'ar' ? 'عرض تذاكر الطلبات الواردة مباشرة وإدارتها للطباخين' : 'Live incoming orders for chefs and baristas',
      defaultName: language === 'ar' ? 'شاشة المطبخ الرئيسية (KDS 1)' : 'Main Kitchen Screen (KDS 1)',
      defaultType: 'tablet',
    },
    {
      id: 'customer_display',
      label: language === 'ar' ? 'شاشة العميل (CFD)' : 'Customer Display (CFD)',
      icon: Tv,
      desc: language === 'ar' ? 'شاشة موجهة للزبون لعرض الفاتورة والأسعار وكود الدفع' : 'Facing screen showing live cart & payment QR',
      defaultName: language === 'ar' ? 'شاشة الزبون التفاعلية (CFD 1)' : 'Interactive Customer Screen',
      defaultType: 'tablet',
    },
    {
      id: 'waiter_mobile',
      label: language === 'ar' ? 'هاتف النادل والطلبات' : 'Mobile Waiter Pad',
      icon: Smartphone,
      desc: language === 'ar' ? 'تسجيل طلبات الطاولات والتوصيل وإرسالها فوراً' : 'Handheld order taking at dining tables',
      defaultName: language === 'ar' ? 'هاتف النادل (صالة 1)' : 'Waiter Phone (Floor 1)',
      defaultType: 'mobile',
    },
    {
      id: 'stock_scanner',
      label: language === 'ar' ? 'ماسح الجرد المتنقل' : 'Stock Barcode Scanner',
      icon: ScanBarcode,
      desc: language === 'ar' ? 'جرد المنتجات وقراءة الباركود وتحديث الأرصدة فوراً' : 'Handheld mobile scanner for stock audit',
      defaultName: language === 'ar' ? 'ماسح المستودع المتنقل' : 'Warehouse Stock Scanner',
      defaultType: 'mobile',
    },
    {
      id: 'secondary_pos',
      label: language === 'ar' ? 'كاشير فرعي 2' : 'Secondary Cashier POS',
      icon: Laptop,
      desc: language === 'ar' ? 'نقطة بيع فرعية لتخفيف الازدحام ومشاركة المخزون' : 'Satellite register to speed up peak hours',
      defaultName: language === 'ar' ? 'كاشير فرعي رقم 2' : 'Satellite Cashier 2',
      defaultType: 'desktop',
    }
  ];

  const handleSelectRole = (role: DeviceRole) => {
    setSelectedRole(role);
    const opt = roleOptions.find(r => r.id === role);
    if (opt) {
      setDeviceName(opt.defaultName);
      setDeviceType(opt.defaultType);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(pairingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleQuickPairThisBrowser = async () => {
    setIsSubmitting(true);
    const targetName = deviceName.trim() || roleOptions.find(r => r.id === selectedRole)?.defaultName || 'جهاز جديد';
    const res = await pairDevice({
      name: targetName,
      role: selectedRole,
      deviceType,
      pairingCode: masterPairingPin,
      cashierName: "كاشير مناوب",
      branchName: "الفرع الرئيسي"
    });
    setIsSubmitting(false);
    if (res.success) {
      setSuccessMessage(true);
      setTimeout(() => {
        setSuccessMessage(false);
        onClose();
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-500 to-amber-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black">{t('pairDeviceModalTitle')}</h2>
              <p className="text-xs text-amber-100">{t('devicesSubtitle')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Quick link to enter Cashier PIN */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/30">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500 text-white shadow-xs">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-black text-slate-900 dark:text-white block">
                  {language === 'ar' ? 'هل تريد ربط شاشة تابعة عبر إدخال كود الكاشير؟' : 'Connecting a secondary screen via Cashier PIN?'}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {language === 'ar' ? 'أدخل الرمز المكون من 6 أرقام المعروض على جهاز الكاشير الرئيسي' : 'Enter the 6-digit PIN code displayed on the master register'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                setIsConnectToCashierModalOpen(true);
              }}
              className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-black transition-all cursor-pointer shadow-xs shrink-0"
            >
              {language === 'ar' ? 'إدخال كود الكاشير 🔑' : 'Enter Cashier PIN 🔑'}
            </button>
          </div>

          {/* Step 1: Select Terminal Role */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2.5 block">
              1. {language === 'ar' ? 'حدد نوع الشاشة أو الجهاز المراد ربطه:' : 'Select Device / Screen Role:'}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {roleOptions.map(opt => {
                const Icon = opt.icon;
                const isSelected = selectedRole === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectRole(opt.id)}
                    className={`p-3 rounded-2xl border text-start transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-slate-900 dark:text-white shadow-xs ring-2 ring-amber-500/20'
                        : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold">{opt.label}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                      {opt.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: QR Code & 6-Digit PIN pairing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
            {/* QR Code Column */}
            <div className="flex flex-col items-center text-center">
              <div className="p-2.5 bg-white rounded-2xl shadow-md border border-slate-200 mb-2">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="Pairing QR Code" className="w-44 h-44 object-contain rounded-xl" />
                ) : (
                  <div className="w-44 h-44 flex items-center justify-center text-slate-400">
                    <QrCode className="w-12 h-12 animate-spin" />
                  </div>
                )}
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {t('scanQrToPair')}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'ar' ? 'افتح كاميرا الهاتف واقرأ الكود للربط الفوري' : 'Point phone camera to auto-connect'}
              </p>
            </div>

            {/* PIN Code Column */}
            <div className="space-y-3.5 border-t md:border-t-0 md:border-s border-slate-200 dark:border-slate-700 pt-3 md:pt-0 md:ps-4">
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                  {t('masterPairingPinLabel')}
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white dark:bg-slate-900 border-2 border-dashed border-amber-500 rounded-xl py-2 px-3 text-center">
                    <span className="text-2xl sm:text-3xl font-black font-mono tracking-widest text-amber-600 dark:text-amber-400">
                      {masterPairingPin}
                    </span>
                  </div>
                  <button
                    onClick={refreshMasterPin}
                    className="p-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors"
                    title={t('refreshPin')}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Direct URL copy */}
              <div>
                <button
                  onClick={handleCopyLink}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-slate-500" />}
                  <span>{copied ? (language === 'ar' ? 'تم نسخ الرابط!' : 'Link Copied!') : (language === 'ar' ? 'نسخ رابط الربط المباشر' : 'Copy Direct Link')}</span>
                </button>
              </div>

              {/* Quick Simulator / Register */}
              <div className="pt-2">
                <button
                  onClick={handleQuickPairThisBrowser}
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 transition-all disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isSubmitting ? (language === 'ar' ? 'جاري الربط...' : 'Connecting...') : (language === 'ar' ? 'تأكيد تسجيل وربط هذا الجهاز' : 'Confirm & Register Device')}</span>
                </button>
              </div>

              {successMessage && (
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-xs font-bold text-center flex items-center justify-center gap-1.5 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t('pairingSuccess')}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>{language === 'ar' ? 'اتصال مشفر وآمن عبر الشبكة المحلية والإنترنت' : 'Secure encrypted local network mesh'}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors"
          >
            {language === 'ar' ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
