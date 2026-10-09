import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { StoreSettings } from '../../types';
import { soundEffects } from '../../services/audio';
import {
  Store,
  Receipt,
  Upload,
  Camera,
  Image as ImageIcon,
  Trash2,
  Save,
  CheckCircle2,
  FileText,
  MessageSquare,
  Sparkles,
  Printer,
  RotateCcw,
  Check,
  Eye,
  Sliders,
  Phone,
  MapPin,
  FileCode,
  Tag,
  AlertCircle,
  HelpCircle,
  QrCode,
  Barcode as BarcodeIcon,
  Clock,
  Layers,
  CheckSquare,
  Square
} from 'lucide-react';
import { generateBarcodeSvg } from '../../utils/barcodeUtils';
import { ReceiptLayoutDragDropEditor } from './ReceiptLayoutDragDropEditor';

// 5 Preset Logo Badges for quick professional 1-click branding
const PRESET_LOGOS = [
  {
    id: 'retail',
    name: 'سوبرماركت / بقالة',
    color: '#0f172a',
    accent: '#f59e0b',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" rx="20" fill="#0f172a"/><path d="M25 35h50l-6 28H31L25 35z" fill="none" stroke="#f59e0b" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="38" cy="72" r="5" fill="#f59e0b"/><circle cx="62" cy="72" r="5" fill="#f59e0b"/><path d="M20 25h10l3 10" stroke="#f59e0b" stroke-width="5" stroke-linecap="round"/><path d="M42 45h16M50 37v16" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/></svg>`
  },
  {
    id: 'cafe',
    name: 'كافيه / مطعم',
    color: '#1c1917',
    accent: '#f59e0b',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" rx="20" fill="#1c1917"/><path d="M28 42h40v22a14 14 0 0 1-14 14H42a14 14 0 0 1-14-14V42z" fill="none" stroke="#f59e0b" stroke-width="5" stroke-linecap="round"/><path d="M68 47h6a7 7 0 0 1 7 7v0a7 7 0 0 1-7 7h-6" fill="none" stroke="#f59e0b" stroke-width="5"/><path d="M38 24c0 4-4 6-4 10M50 22c0 4-4 6-4 10M62 24c0 4-4 6-4 10" stroke="#fbbf24" stroke-width="3" stroke-linecap="round"/></svg>`
  },
  {
    id: 'pharmacy',
    name: 'صيدلية وعناية',
    color: '#064e3b',
    accent: '#34d399',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" rx="20" fill="#064e3b"/><path d="M35 50h30M50 35v30" stroke="#34d399" stroke-width="9" stroke-linecap="round"/><circle cx="50" cy="50" r="34" fill="none" stroke="#6ee7b7" stroke-width="4" stroke-dasharray="6 4"/></svg>`
  },
  {
    id: 'clothing',
    name: 'أزياء وملابس',
    color: '#1e1b4b',
    accent: '#a855f7',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" rx="20" fill="#1e1b4b"/><path d="M30 40h40l6 36H24L30 40z" fill="none" stroke="#a855f7" stroke-width="5" stroke-linecap="round"/><path d="M40 40V30a10 10 0 0 1 20 0v10" fill="none" stroke="#c084fc" stroke-width="5" stroke-linecap="round"/><circle cx="50" cy="58" r="4" fill="#f472b6"/></svg>`
  },
  {
    id: 'tech',
    name: 'إلكترونيات وهواتف',
    color: '#0f172a',
    accent: '#38bdf8',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" rx="20" fill="#0f172a"/><rect x="32" y="24" width="36" height="52" rx="6" fill="none" stroke="#38bdf8" stroke-width="5"/><circle cx="50" cy="68" r="3" fill="#38bdf8"/><path d="M44 32h12" stroke="#94a3b8" stroke-width="3" stroke-linecap="round"/></svg>`
  }
];

export const ReceiptHeaderFooterSettings: React.FC = () => {
  const { settings, updateSettings, notify, language, formatCurrency } = useApp();

  // Local form state
  const [formData, setFormData] = useState<StoreSettings>({
    ...settings,
    receiptShowLogo: settings.receiptShowLogo ?? settings.printStoreLogo ?? true,
    receiptLogoSize: settings.receiptLogoSize || 'md',
    receiptShowStoreNameAr: settings.receiptShowStoreNameAr ?? true,
    receiptShowStoreNameEn: settings.receiptShowStoreNameEn ?? true,
    receiptShowAddress: settings.receiptShowAddress ?? true,
    receiptShowPhone: settings.receiptShowPhone ?? true,
    receiptShowTaxNumber: settings.receiptShowTaxNumber ?? settings.printTaxDetails ?? true,
    receiptShowCashierName: settings.receiptShowCashierName ?? settings.printCashierDetails ?? true,
    receiptShowFooterMessage: settings.receiptShowFooterMessage ?? true,
    receiptShowReturnPolicy: settings.receiptShowReturnPolicy ?? true,
    receiptReturnPolicyDays: settings.receiptReturnPolicyDays ?? 3,
    receiptHeader: settings.receiptHeader || 'أهلاً بكم في متجرنا — نسعد بخدمتكم دائماً',
    receiptFooter: settings.receiptFooter || 'شكراً لزيارتكم! يرجى الاحتفاظ بالفاتورة لضمان حق الاسترجاع والاستبدال.'
  });

  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera tracks cleanly
  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setCameraError(null);
  };

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  // Compress & optimize image for thermal receipts and storage
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      notify('تنبيه', 'يرجى اختيار ملف صورة صالح (PNG, JPG, SVG, WebP)', 'warning');
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 380;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const optimized = canvas.toDataURL('image/png', 0.9);
          setFormData(prev => ({ ...prev, logo: optimized }));
          notify('تم تحميل الشعار بنجاح', 'تمت معالجة الشعار وملاءمته للطباعة الحرارية', 'success');
          soundEffects.playBeep();
        }
        setIsProcessing(false);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleStartCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 640 } }
      });
      streamRef.current = stream;
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      setCameraError('تعذر فتح الكاميرا، يرجى التأكد من إعطاء إذن الكاميرا للمتصفح أو رفع ملف الشعار.');
    }
  };

  const handleCaptureCamera = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 300;
    canvas.height = videoRef.current.videoHeight || 300;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/png', 0.9);
      setFormData(prev => ({ ...prev, logo: dataUrl }));
      stopCameraStream();
      soundEffects.playBeep();
      notify('تم التقاط الشعار بنجاح', 'تم حفظ صورة الشعار من الكاميرا', 'success');
    }
  };

  const handleApplyPresetLogo = (svgStr: string, name: string) => {
    const encoded = `data:image/svg+xml;utf8,${encodeURIComponent(svgStr)}`;
    setFormData(prev => ({ ...prev, logo: encoded }));
    soundEffects.playBeep();
    notify('تم تطبيق الشعار الجاهز', `تم اعتماد قالب شعار: ${name}`, 'success');
  };

  const handleRemoveLogo = () => {
    setFormData(prev => ({ ...prev, logo: '' }));
    soundEffects.playClick();
    notify('تمت إزالة الشعار', 'لن يظهر الشعار في الفواتير المطبوعة', 'info');
  };

  const handleResetWording = () => {
    setFormData(prev => ({
      ...prev,
      receiptHeader: 'أهلاً بكم في متجرنا — نسعد بخدمتكم دائماً',
      receiptFooter: 'شكراً لزيارتكم وتسوقكم معنا! يرجى الاحتفاظ بالفاتورة لضمان حق الاسترجاع والاستبدال خلال 3 أيام.'
    }));
    soundEffects.playClick();
    notify('تمت استعادة الصياغة النموذجية', 'تمت استعادة نصوص الترحيب والتذييل الافتراضية', 'info');
  };

  const handleSaveAll = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    updateSettings(formData);
    soundEffects.playSuccess();
    notify(
      'تم حفظ إعدادات الفاتورة بنجاح ✨',
      'تم تحديث شعار المتجر وبيانات الترويسة والتذييل لكافة الفواتير المطبوعة والمحفوظة',
      'success'
    );
  };

  // Preview derived values
  const logoSizePx = formData.receiptLogoSize === 'sm' ? 44 : formData.receiptLogoSize === 'lg' ? 78 : 60;
  const currencySymbol = formData.currency?.symbolNative || formData.currency?.symbol || 'ل.س';

  return (
    <div className="space-y-6 max-w-6xl animate-in fade-in pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 text-white p-5 sm:p-6 rounded-3xl border border-slate-700/80 shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Receipt className="w-5 h-5" />
              </span>
              <h3 className="text-base sm:text-lg font-black tracking-tight">
                شعار المتجر وترويسة وتذييل الفواتير المطبوعة
              </h3>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              تحكم بسهولة في الشعار الرسمي للمتجر، واسم المنشأة، والعنوان، ورقم الهاتف، ورسائل الترحيب في الترويسة، وبنود الشكر وسياسة الاسترجاع في التذييل.
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleSaveAll()}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs rounded-2xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer shrink-0"
          >
            <Save className="w-4 h-4" />
            <span>حفظ الإعدادات والتطبيق</span>
          </button>
        </div>
      </div>

      {/* Interactive Drag-and-Drop Receipt Layout Editor */}
      <ReceiptLayoutDragDropEditor compactHeader />

      {/* Main Grid: Settings Controls on Right, Live Receipt Simulator on Left */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* RIGHT COLUMN (7 Cols): Configuration Controls */}
        <div className="lg:col-span-7 space-y-5">
          {/* SECTION 1: STORE LOGO UPLOAD & MANAGEMENT */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    1. شعار المتجر (Store Logo)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    يظهر في أعلى الفاتورة الورقية المطبوعة وشاشات النظام
                  </p>
                </div>
              </div>

              {formData.logo && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                  شعار معتمد ✓
                </span>
              )}
            </div>

            {/* Current Logo Preview or Upload Box */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex flex-col items-center justify-center p-2 overflow-hidden shrink-0 relative group">
                {formData.logo ? (
                  <>
                    <img
                      src={formData.logo}
                      alt="Store Logo"
                      className="w-full h-full object-contain filter contrast-125"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="absolute inset-0 bg-black/60 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="حذف الشعار"
                    >
                      <Trash2 className="w-5 h-5 text-rose-400 mb-1" />
                      <span className="text-[10px] font-bold">إزالة</span>
                    </button>
                  </>
                ) : (
                  <div className="text-center text-slate-400">
                    <Store className="w-8 h-8 mx-auto mb-1 text-slate-300 dark:text-slate-600" />
                    <span className="text-[10px]">لا يوجد شعار</span>
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-2.5 w-full">
                {/* Upload & Camera Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) processImageFile(f);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                    className="flex-1 min-w-[130px] flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                    <span>رفع من الجهاز</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleStartCamera}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5 text-emerald-500" />
                    <span>التقاط بالكاميرا</span>
                  </button>

                  {formData.logo && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                      title="إزالة الشعار"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Logo Visibility & Size Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-xs cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.receiptShowLogo)}
                      onChange={e => setFormData({ ...formData, receiptShowLogo: e.target.checked })}
                      className="w-4 h-4 accent-amber-500 rounded"
                    />
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      طباعة الشعار على الفاتورة
                    </span>
                  </label>

                  <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-xs font-bold">
                    <span className="text-[10px] text-slate-500 px-1">الحجم:</span>
                    {(['sm', 'md', 'lg'] as const).map(size => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setFormData({ ...formData, receiptLogoSize: size })}
                        className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          formData.receiptLogoSize === size
                            ? 'bg-amber-500 text-slate-950 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {size === 'sm' ? 'صغير' : size === 'md' ? 'متوسط' : 'كبير'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Camera Viewport Drawer */}
            {isCameraActive && (
              <div className="p-3 bg-slate-950 rounded-2xl space-y-2 border border-slate-800 text-center animate-in fade-in">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full max-h-48 object-cover rounded-xl mx-auto"
                />
                <div className="flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={handleCaptureCamera}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl cursor-pointer"
                  >
                    التقاط الصورة
                  </button>
                  <button
                    type="button"
                    onClick={stopCameraStream}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            )}

            {cameraError && (
              <p className="text-xs text-rose-500 bg-rose-50 dark:bg-rose-950/40 p-2 rounded-xl border border-rose-200">
                {cameraError}
              </p>
            )}

            {/* Quick 1-Click Preset Badges */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                شعارات تجارية جاهزة للاستخدام بضغطة زر:
              </span>
              <div className="flex flex-wrap gap-2">
                {PRESET_LOGOS.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleApplyPresetLogo(p.svg, p.name)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-amber-500/10 hover:border-amber-500/40 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
                  >
                    <div
                      className="w-4 h-4 shrink-0"
                      dangerouslySetInnerHTML={{ __html: p.svg }}
                    />
                    <span>{p.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 2: RECEIPT HEADER DETAILS */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    2. بيانات ترويسة الفاتورة (Header Information)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    النصوص والمعلومات التجارية التي تظهر في أعلى الفاتورة تحت الشعار
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Store Name AR */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    اسم المتجر (بالعربية) *
                  </label>
                  <label className="text-[10px] text-slate-500 flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.receiptShowStoreNameAr)}
                      onChange={e => setFormData({ ...formData, receiptShowStoreNameAr: e.target.checked })}
                      className="accent-amber-500 rounded"
                    />
                    إظهار
                  </label>
                </div>
                <input
                  type="text"
                  value={formData.storeNameAr}
                  onChange={e => setFormData({ ...formData, storeNameAr: e.target.value })}
                  placeholder="مثال: أسواق النور المركزية"
                  className="w-full text-xs font-bold px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Store Name EN */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    اسم المتجر (بالإنجليزية)
                  </label>
                  <label className="text-[10px] text-slate-500 flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.receiptShowStoreNameEn)}
                      onChange={e => setFormData({ ...formData, receiptShowStoreNameEn: e.target.checked })}
                      className="accent-amber-500 rounded"
                    />
                    إظهار
                  </label>
                </div>
                <input
                  type="text"
                  value={formData.storeNameEn}
                  onChange={e => setFormData({ ...formData, storeNameEn: e.target.value })}
                  placeholder="e.g. Al-Noor Supermarket"
                  className="w-full text-xs font-bold px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Phone */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    رقم الهاتف وخدمة العملاء
                  </label>
                  <label className="text-[10px] text-slate-500 flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.receiptShowPhone)}
                      onChange={e => setFormData({ ...formData, receiptShowPhone: e.target.checked })}
                      className="accent-amber-500 rounded"
                    />
                    إظهار
                  </label>
                </div>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="مثال: 011-2345678"
                  className="w-full text-xs font-mono font-bold px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Tax / Commercial Record */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <FileCode className="w-3 h-3 text-slate-400" />
                    الرقم الضريبي / السجل التجاري
                  </label>
                  <label className="text-[10px] text-slate-500 flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.receiptShowTaxNumber)}
                      onChange={e => setFormData({ ...formData, receiptShowTaxNumber: e.target.checked })}
                      className="accent-amber-500 rounded"
                    />
                    إظهار
                  </label>
                </div>
                <input
                  type="text"
                  value={formData.taxNumber}
                  onChange={e => setFormData({ ...formData, taxNumber: e.target.value })}
                  placeholder="مثال: 30045678900003"
                  className="w-full text-xs font-mono font-bold px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Address / Branch */}
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    العنوان، المدينة، والفرع
                  </label>
                  <label className="text-[10px] text-slate-500 flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.receiptShowAddress)}
                      onChange={e => setFormData({ ...formData, receiptShowAddress: e.target.checked })}
                      className="accent-amber-500 rounded"
                    />
                    إظهار
                  </label>
                </div>
                <input
                  type="text"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  placeholder="مثال: دمشق — شارع الحمراء، بجانب البريد المركزي"
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Receipt Welcome Header Message */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  رسالة الترحيب أعلى الفاتورة (Header Welcome Greeting)
                </label>
                <input
                  type="text"
                  value={formData.receiptHeader}
                  onChange={e => setFormData({ ...formData, receiptHeader: e.target.value })}
                  placeholder="مثال: أهلاً بكم في متجرنا — نسعد بخدمتكم دائماً"
                  className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: RECEIPT FOOTER DETAILS */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    3. بيانات تذييل الفاتورة (Footer Information)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    رسائل الشكر، شروط وسياسة الاسترجاع، والباركود أسفل الفاتورة
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleResetWording}
                className="text-[10px] font-bold text-slate-500 hover:text-amber-600 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                صياغة نموذجية
              </button>
            </div>

            <div className="space-y-3.5">
              {/* Footer Closing Message */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    رسالة الشكر والتذييل (Footer Closing Message)
                  </label>
                  <label className="text-[10px] text-slate-500 flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.receiptShowFooterMessage)}
                      onChange={e => setFormData({ ...formData, receiptShowFooterMessage: e.target.checked })}
                      className="accent-amber-500 rounded"
                    />
                    إظهار رسالة التذييل
                  </label>
                </div>
                <textarea
                  rows={2}
                  value={formData.receiptFooter}
                  onChange={e => setFormData({ ...formData, receiptFooter: e.target.value })}
                  placeholder="مثال: شكراً لزيارتكم وتسوقكم معنا! نتمنى لكم يوماً سعيداً."
                  className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Return Policy Setting */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.receiptShowReturnPolicy)}
                      onChange={e => setFormData({ ...formData, receiptShowReturnPolicy: e.target.checked })}
                      className="w-4 h-4 accent-amber-500 rounded"
                    />
                    <span>طباعة بند سياسة الاسترجاع والاستبدال</span>
                  </label>
                  <p className="text-[11px] text-slate-500 pr-6">
                    نص إشعار: "البضاعة المباعة ترد وتستبدل خلال X أيام بشرط إحضار الفاتورة الأصلية بحالتها."
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 pr-6 sm:pr-0">
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-bold">المدة:</span>
                  <select
                    value={formData.receiptReturnPolicyDays || 3}
                    onChange={e => setFormData({ ...formData, receiptReturnPolicyDays: Number(e.target.value) })}
                    className="text-xs font-bold font-mono py-1 px-2.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none"
                  >
                    <option value={1}>يوم واحد (24 ساعة)</option>
                    <option value={2}>يومين (48 ساعة)</option>
                    <option value={3}>3 أيام (القياسي)</option>
                    <option value={7}>7 أيام (أسبوع)</option>
                    <option value={14}>14 يوماً (أسبوعين)</option>
                    <option value={30}>30 يوماً (شهر)</option>
                  </select>
                </div>
              </div>

              {/* Additional Footer Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-xs cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={Boolean(formData.printBarcodeOnReceipt ?? true)}
                    onChange={e => setFormData({ ...formData, printBarcodeOnReceipt: e.target.checked })}
                    className="w-4 h-4 accent-amber-500 rounded"
                  />
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                    <BarcodeIcon className="w-3.5 h-3.5 text-slate-500" />
                    <span>طباعة باركود الفاتورة للاسترجاع (1D)</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-xs cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={Boolean(formData.receiptShowCashierName ?? true)}
                    onChange={e => setFormData({ ...formData, receiptShowCashierName: e.target.checked })}
                    className="w-4 h-4 accent-amber-500 rounded"
                  />
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>إظهار اسم الكاشير ووقت الفاتورة</span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={() => handleSaveAll()}
              className="flex items-center gap-2 px-8 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-2xl shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>حفظ التعديلات وتطبيقها</span>
            </button>
          </div>
        </div>

        {/* LEFT COLUMN (5 Cols): LIVE RECEIPT SIMULATOR */}
        <div className="lg:col-span-5 sticky top-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-amber-500" />
              <h4 className="text-xs font-black text-slate-900 dark:text-white">
                المعاينة الحية الفورية للفاتورة الحرارية
              </h4>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              ورق 80mm
            </span>
          </div>

          {/* Thermal Paper Realistic Simulator Card */}
          <div className="bg-white text-slate-950 p-4 sm:p-5 rounded-2xl shadow-xl border-t-8 border-slate-900 font-sans text-xs space-y-3 border-x border-b border-slate-300 select-none">
            {/* 1. Header & Logo */}
            <div className="text-center space-y-1 pb-2 border-b border-dashed border-slate-300">
              {formData.receiptShowLogo && formData.logo && (
                <div className="flex justify-center mb-1">
                  <img
                    src={formData.logo}
                    alt="Logo Preview"
                    style={{ height: `${logoSizePx}px`, maxWidth: '160px' }}
                    className="object-contain filter contrast-125"
                  />
                </div>
              )}

              {formData.receiptShowStoreNameAr && (
                <h3 className="font-black text-sm text-slate-900 tracking-tight">
                  {formData.storeNameAr || 'اسم المتجر بالعربية'}
                </h3>
              )}

              {formData.receiptShowStoreNameEn && formData.storeNameEn && (
                <p className="text-[9.5px] font-bold text-slate-600 uppercase tracking-wider">
                  {formData.storeNameEn}
                </p>
              )}

              {formData.receiptShowAddress && formData.address && (
                <p className="text-[10px] text-slate-600">{formData.address}</p>
              )}

              {formData.receiptShowPhone && formData.phone && (
                <p className="text-[10px] text-slate-600 font-mono">هاتف: {formData.phone}</p>
              )}

              {formData.receiptShowTaxNumber && formData.taxNumber && (
                <p className="text-[9.5px] text-slate-600 font-mono">
                  الرقم الضريبي: {formData.taxNumber}
                </p>
              )}

              {formData.receiptHeader && (
                <div className="text-[10px] text-slate-600 italic pt-1 border-t border-dotted border-slate-200 mt-1">
                  {formData.receiptHeader}
                </div>
              )}
            </div>

            {/* 2. Sample Invoice Meta */}
            <div className="text-[10px] text-slate-600 space-y-0.5 border-b border-dashed border-slate-300 pb-2">
              <div className="flex justify-between">
                <span>رقم الفاتورة:</span>
                <span className="font-mono font-bold text-slate-900">INV-2026-0891</span>
              </div>
              <div className="flex justify-between">
                <span>التاريخ:</span>
                <span className="font-mono">2026/09/28 - 14:30</span>
              </div>
              {formData.receiptShowCashierName && (
                <div className="flex justify-between">
                  <span>الكاشير:</span>
                  <span className="font-semibold text-slate-900">كاشير الصالة الرئيسي</span>
                </div>
              )}
            </div>

            {/* 3. Sample Items Table */}
            <div className="space-y-1.5 text-[10.5px]">
              <div className="flex justify-between font-bold border-b border-slate-200 pb-1 text-[10px] text-slate-500">
                <span>الصنف / الكمية</span>
                <span>المبلغ</span>
              </div>

              <div className="flex justify-between">
                <div>
                  <p className="font-bold text-slate-900">زيت نباتي ممتاز 1 لتر</p>
                  <p className="text-[9.5px] text-slate-500 font-mono">2 × 12,500 {currencySymbol}</p>
                </div>
                <span className="font-mono font-bold">25,000</span>
              </div>

              <div className="flex justify-between">
                <div>
                  <p className="font-bold text-slate-900">أرز بسمتي فاخر 1 كغ</p>
                  <p className="text-[9.5px] text-slate-500 font-mono">1 × 18,000 {currencySymbol}</p>
                </div>
                <span className="font-mono font-bold">18,000</span>
              </div>
            </div>

            {/* 4. Totals & Payment */}
            <div className="pt-2 border-t border-dashed border-slate-300 space-y-1 text-[10.5px]">
              <div className="flex justify-between font-black text-sm bg-slate-100 p-1.5 rounded-lg text-slate-900">
                <span>الإجمالي النهائي:</span>
                <span className="font-mono">43,000 {currencySymbol}</span>
              </div>

              <div className="flex justify-between text-[10px] text-slate-600">
                <span>طريقة الدفع:</span>
                <span>نقداً (Cash)</span>
              </div>
            </div>

            {/* 5. 1D Barcode Preview */}
            {formData.printBarcodeOnReceipt && (
              <div className="pt-1 flex flex-col items-center justify-center">
                <div
                  className="max-w-full overflow-hidden flex justify-center"
                  dangerouslySetInnerHTML={{
                    __html: generateBarcodeSvg('INV-2026-0891', {
                      width: 190,
                      height: 38,
                      fontSize: 8,
                      showText: true,
                      barColor: '#000000',
                      bgColor: '#ffffff'
                    })
                  }}
                />
              </div>
            )}

            {/* 6. Return Policy */}
            {formData.receiptShowReturnPolicy && (
              <div className="text-[9px] text-slate-600 border-t border-dashed border-slate-300 pt-1.5 text-center leading-relaxed">
                البضاعة المباعة ترد وتستبدل خلال {formData.receiptReturnPolicyDays || 3} أيام بإحضار أصل الفاتورة بحالتها الأصلية.
              </div>
            )}

            {/* 7. Footer Message */}
            {formData.receiptShowFooterMessage && formData.receiptFooter && (
              <div className="border-t border-dashed border-slate-300 pt-2 text-[9.5px] text-slate-600 text-center space-y-1">
                <p className="font-medium">{formData.receiptFooter}</p>
                <p className="text-[8px] text-slate-400 font-bold">نظام كيان كاشير الذكي</p>
              </div>
            )}

            {/* Thermal Cut Simulation Jagged Edge */}
            <div className="border-t-2 border-dotted border-slate-400 pt-1 text-center text-[9px] text-slate-400 font-mono">
              - - - - - - - - - - - - - - - - - - - - - - -
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
