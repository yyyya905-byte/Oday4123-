import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Camera,
  Upload,
  Image as ImageIcon,
  Trash2,
  RefreshCw,
  CheckCircle2,
  Sparkles,
  Eye,
  Download,
  FlipHorizontal,
  X,
  AlertCircle,
  Printer,
  Sliders,
  Check
} from 'lucide-react';
import { soundEffects } from '../../services/audio';

interface StoreLogoUploaderProps {
  onLogoUpdated?: (newLogo: string) => void;
  className?: string;
  showReceiptPreview?: boolean;
}

// Preset store badges for 1-click professional branding
const PRESET_STORE_LOGOS = [
  {
    id: 'retail-store',
    name: 'سوبرماركت / تجزئة',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" rx="20" fill="#0f172a"/><path d="M25 35h50l-6 28H31L25 35z" fill="none" stroke="#f59e0b" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="38" cy="72" r="5" fill="#f59e0b"/><circle cx="62" cy="72" r="5" fill="#f59e0b"/><path d="M20 25h10l3 10" stroke="#f59e0b" stroke-width="5" stroke-linecap="round"/><path d="M42 45h16M50 37v16" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/></svg>`
  },
  {
    id: 'cafe-coffee',
    name: 'مقهى وكافيه',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" rx="20" fill="#1c1917"/><path d="M28 42h40v22a14 14 0 0 1-14 14H42a14 14 0 0 1-14-14V42z" fill="none" stroke="#f59e0b" stroke-width="5" stroke-linecap="round"/><path d="M68 47h6a7 7 0 0 1 7 7v0a7 7 0 0 1-7 7h-6" fill="none" stroke="#f59e0b" stroke-width="5"/><path d="M38 24c0 4-4 6-4 10M50 22c0 4-4 6-4 10M62 24c0 4-4 6-4 10" stroke="#fbbf24" stroke-width="3" stroke-linecap="round"/></svg>`
  },
  {
    id: 'pharmacy-health',
    name: 'صيدلية وعناية',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" rx="20" fill="#064e3b"/><path d="M35 50h30M50 35v30" stroke="#34d399" stroke-width="9" stroke-linecap="round"/><circle cx="50" cy="50" r="34" fill="none" stroke="#6ee7b7" stroke-width="4" stroke-dasharray="6 4"/></svg>`
  },
  {
    id: 'fashion-boutique',
    name: 'أزياء وملابس',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" rx="20" fill="#1e1b4b"/><path d="M30 40h40l6 36H24L30 40z" fill="none" stroke="#a855f7" stroke-width="5" stroke-linecap="round"/><path d="M40 40V30a10 10 0 0 1 20 0v10" fill="none" stroke="#c084fc" stroke-width="5" stroke-linecap="round"/><circle cx="50" cy="58" r="4" fill="#f472b6"/></svg>`
  },
  {
    id: 'tech-electronics',
    name: 'إلكترونيات وهواتف',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" rx="20" fill="#0f172a"/><rect x="32" y="24" width="36" height="52" rx="6" fill="none" stroke="#38bdf8" stroke-width="5"/><circle cx="50" cy="68" r="3" fill="#38bdf8"/><path d="M44 32h12" stroke="#94a3b8" stroke-width="3" stroke-linecap="round"/></svg>`
  }
];

export const StoreLogoUploader: React.FC<StoreLogoUploaderProps> = ({
  onLogoUpdated,
  className = '',
  showReceiptPreview = true
}) => {
  const { settings, updateSettings, notify } = useApp();

  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [monochromePreview, setMonochromePreview] = useState(true);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const fallbackCameraInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera tracks cleanly on unmount or close
  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
    setCameraError(null);
  };

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  // Optimize and compress image into a lightweight Base64 Data URL (Max 400x400)
  const optimizeImage = (dataUrl: string) => {
    setIsProcessing(true);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
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
        if (!ctx) throw new Error('Canvas 2D context unavailable');

        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const optimizedData = canvas.toDataURL('image/png');
        saveLogo(optimizedData);
      } catch (e: any) {
        // Fallback: save original if canvas processing fails
        saveLogo(dataUrl);
      } finally {
        setIsProcessing(false);
      }
    };
    img.onerror = () => {
      setIsProcessing(false);
      notify('خطأ في تحميل الصورة', 'تعذر معالجة ملف الشعار، يرجى تجربة صورة أخرى', 'error');
    };
    img.src = dataUrl;
  };

  const saveLogo = (logoData: string) => {
    updateSettings({
      logo: logoData,
      printStoreLogo: true,
      receiptShowLogo: true
    });
    if (onLogoUpdated) {
      onLogoUpdated(logoData);
    }
    soundEffects.playSuccess();
    notify('تم تحديث الشعار', 'تم حفظ وتعيين شعار المتجر بنجاح لاستخدامه في ترويسة الفواتير المطبوعة', 'success');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      notify('تنبيه', 'يرجى اختيار ملف صورة صالح (PNG, JPG, WEBP, SVG)', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = event => {
      const src = event.target?.result as string;
      optimizeImage(src);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      notify('تنبيه', 'يرجى إفلات ملف صورة فقط', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = event => {
      const src = event.target?.result as string;
      optimizeImage(src);
    };
    reader.readAsDataURL(file);
  };

  // Launch live Camera for taking photo of store signage or logo
  const startCamera = async (facing: 'environment' | 'user' = cameraFacing) => {
    setCameraError(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 640 },
          height: { ideal: 640 }
        },
        audio: false
      });

      streamRef.current = stream;
      setIsCameraOpen(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(e => {
            console.warn('Video play error:', e);
          });
        }
      }, 100);
    } catch (err: any) {
      console.warn('Camera access error:', err);
      // If direct getUserMedia fails (e.g. in sandboxed iframe without direct prompt), fallback to HTML camera capture
      stopCameraStream();
      if (fallbackCameraInputRef.current) {
        fallbackCameraInputRef.current.click();
      } else {
        setCameraError('تعذر فتح الكاميرا مباشرة. يمكنك استخدام زر رفع صورة من الجهاز.');
      }
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      const size = Math.min(video.videoWidth || 480, video.videoHeight || 480);
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const sx = ((video.videoWidth || size) - size) / 2;
      const sy = ((video.videoHeight || size) - size) / 2;

      ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);
      const dataUrl = canvas.toDataURL('image/png');

      stopCameraStream();
      optimizeImage(dataUrl);
    } catch (e: any) {
      console.error('Failed to capture photo:', e);
      notify('خطأ في التقاط الصورة', 'تعذر التقاط لقطة الكاميرا', 'error');
    }
  };

  const handleToggleFacing = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    startCamera(nextFacing);
  };

  const handleRemoveLogo = () => {
    if (confirm('هل أنت متأكد من رغبتك في إزالة شعار المتجر من الفواتير؟')) {
      updateSettings({ logo: '' });
      if (onLogoUpdated) onLogoUpdated('');
      notify('تمت الإزالة', 'تم حذف شعار المتجر. سيتم استخدام اسم المتجر النصي فقط في الترويسة', 'info');
    }
  };

  const handleApplyPreset = (svgString: string) => {
    const encoded = `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
    optimizeImage(encoded);
  };

  const handleDownloadCurrentLogo = () => {
    if (!settings.logo) return;
    const a = document.createElement('a');
    a.href = settings.logo;
    a.download = `store-logo-${settings.storeNameEn || 'kian'}.png`;
    a.click();
  };

  const isPrintLogoEnabled = settings.printStoreLogo ?? settings.receiptShowLogo ?? true;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Hidden Native File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={fallbackCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Main Header & Description */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-amber-500" />
            <span>شعار المتجر الرسمي (Store Logo)</span>
            {settings.logo && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                مفعّل بالفواتير
              </span>
            )}
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            يظهر شعارك تلقائياً أعلى ترويسة جميع الفواتير المطبوعة (حرارية A4 ومفرق وجملة) وسندات القبض وكشوفات الحساب.
          </p>
        </div>

        {/* Print Logo Toggle */}
        <label className="flex items-center gap-2 cursor-pointer select-none bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700 shrink-0">
          <input
            type="checkbox"
            checked={isPrintLogoEnabled}
            onChange={e => {
              const checked = e.target.checked;
              updateSettings({
                printStoreLogo: checked,
                receiptShowLogo: checked
              });
              notify('تم التحديث', checked ? 'تم تفعيل ظهور الشعار في الفواتير المطبوعة' : 'تم تعطيل الشعار في الفواتير المطبوعة', 'info');
            }}
            className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500 cursor-pointer"
          />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
            تضمين الشعار في الفواتير المطبوعة
          </span>
        </label>
      </div>

      {/* Uploader & Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Dropzone and Action Buttons (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          {/* Drag and Drop Zone */}
          <div
            onDragOver={e => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`p-6 rounded-3xl border-2 border-dashed transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-3 relative overflow-hidden group ${
              isDragOver
                ? 'border-amber-500 bg-amber-500/10 scale-[0.99]'
                : settings.logo
                ? 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/60 hover:border-amber-500/80 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                : 'border-amber-300 dark:border-amber-800/70 bg-amber-500/5 hover:border-amber-500 hover:bg-amber-500/10'
            }`}
          >
            {/* Display Current Logo or Upload Prompt */}
            {settings.logo ? (
              <div className="space-y-3 w-full flex flex-col items-center">
                <div className="relative p-2 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-inner">
                  <img
                    src={settings.logo}
                    alt={settings.storeNameAr || 'شعار المتجر'}
                    className="max-h-24 max-w-[200px] object-contain rounded-lg"
                  />
                  <div className="absolute -top-1 -right-1 bg-emerald-500 text-white rounded-full p-1 shadow-xs">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                </div>

                <div>
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">
                    انقر هنا لاختيار صورة بديلة للشعار
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    أو اسحب وأفلت أي ملف صورة جديد هنا (PNG, JPG, SVG)
                  </span>
                </div>
              </div>
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-sm font-black text-slate-900 dark:text-white block">
                    اسحب وأفلت شعار المتجر هنا، أو انقر للاختيار
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
                    يدعم ملفات PNG الشفافة، JPG، WEBP أو SVG (يتم ضبط الحجم تلقائياً لطباعة حرارية فائقة الدقة)
                  </span>
                </div>
              </>
            )}

            {isProcessing && (
              <div className="absolute inset-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-amber-500" />
                <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                  جاري معالجة وضبط الشعار...
                </span>
              </div>
            )}
          </div>

          {/* Quick Action Buttons Row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Button 1: Upload from Computer */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-2.5 px-3.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-2xs active:scale-95 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-amber-500" />
              <span>رفع من الجهاز</span>
            </button>

            {/* Button 2: Camera Capture */}
            <button
              type="button"
              onClick={() => startCamera('environment')}
              className="flex-1 py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>التقاط بالكاميرا 📷</span>
            </button>

            {/* Button 3: Download Current */}
            {settings.logo && (
              <button
                type="button"
                onClick={handleDownloadCurrentLogo}
                className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
                title="تنزيل نسخة من الشعار"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Button 4: Remove Logo */}
            {settings.logo && (
              <button
                type="button"
                onClick={handleRemoveLogo}
                className="py-2.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 text-xs font-bold transition-all cursor-pointer"
                title="حذف الشعار"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Preset Badges (If merchant doesn't have an image file handy) */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>شعارات جاهزة مصممة بنقرة واحدة (Presets):</span>
              </span>
              <span className="text-[10px] text-slate-400">للتجربة السريعة</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {PRESET_STORE_LOGOS.map(preset => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleApplyPreset(preset.svg)}
                  className="p-2 rounded-xl bg-white dark:bg-slate-800 hover:border-amber-500 border border-slate-200 dark:border-slate-700 flex flex-col items-center gap-1 text-center transition-all cursor-pointer shadow-2xs hover:scale-105"
                  title={`استخدام شعار ${preset.name}`}
                >
                  <div
                    className="w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center"
                    dangerouslySetInnerHTML={{ __html: preset.svg }}
                  />
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate w-full">
                    {preset.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Live Thermal Receipt Preview Box (5 cols) */}
        {showReceiptPreview && (
          <div className="lg:col-span-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Printer className="w-3.5 h-3.5 text-amber-500" />
                <span>معاينة حية في ترويسة الفاتورة</span>
              </span>

              {/* Toggle Monochrome vs Color */}
              <button
                type="button"
                onClick={() => setMonochromePreview(!monochromePreview)}
                className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 transition-colors cursor-pointer"
              >
                {monochromePreview ? 'محاكاة حراري (B&W)' : 'ألوان أصلية'}
              </button>
            </div>

            {/* Simulated Thermal Receipt Slip */}
            <div className="bg-white text-slate-950 p-4 rounded-2xl border-2 border-slate-300 dark:border-slate-700 shadow-md font-sans text-center relative overflow-hidden">
              {/* Receipt Top Zigzag Decorative Edge */}
              <div className="h-1 w-full bg-repeating-linear-gradient flex items-center justify-center opacity-30 -mt-2 mb-2">
                - - - - - - - - - - - - - - - - - - - - - -
              </div>

              {/* Logo in Receipt Header */}
              {isPrintLogoEnabled && settings.logo ? (
                <div className="flex flex-col items-center justify-center mb-1.5">
                  <img
                    src={settings.logo}
                    alt={settings.storeNameAr || 'شعار المتجر'}
                    className={`max-h-16 max-w-[140px] object-contain mb-1 transition-all ${
                      monochromePreview ? 'filter grayscale contrast-150' : ''
                    }`}
                  />
                  <div className="text-[9px] font-mono text-emerald-600 font-bold">
                    ✓ الشعار مفعّل في الطباعة
                  </div>
                </div>
              ) : isPrintLogoEnabled ? (
                <div className="p-2 mb-1 rounded-xl bg-slate-100 border border-dashed border-slate-300 text-[11px] text-slate-400 font-bold">
                  لم يتم رفع شعار بعد — سيظهر الاسم النصي فقط
                </div>
              ) : (
                <div className="p-1.5 mb-1 rounded-lg bg-rose-50 text-rose-700 text-[10px] font-bold">
                  ✕ تم إيقاف عرض الشعار بالفواتير
                </div>
              )}

              {/* Store Typography Header */}
              <h3 className="text-base font-black tracking-tight text-black">
                {settings.storeNameAr || 'كاشير كيان المتكامل'}
              </h3>
              {settings.storeNameEn && (
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                  {settings.storeNameEn}
                </p>
              )}
              {settings.address && (
                <p className="text-[10px] text-slate-600 mt-0.5">
                  {settings.address}
                </p>
              )}
              {settings.phone && (
                <p className="text-[10px] font-mono text-slate-700">
                  هاتف: {settings.phone}
                </p>
              )}
              {settings.taxNumber && (
                <p className="text-[9.5px] font-mono text-slate-600">
                  الرقم الضريبي: {settings.taxNumber}
                </p>
              )}

              {/* Header Message / Separator */}
              <div className="border-b border-dashed border-slate-400 my-2" />

              {/* Mini invoice dummy meta */}
              <div className="text-[9.5px] font-mono text-slate-500 space-y-0.5 text-start">
                <div className="flex justify-between">
                  <span>رقم الفاتورة:</span>
                  <span className="font-bold text-black">INV-2026-00124</span>
                </div>
                <div className="flex justify-between">
                  <span>التاريخ:</span>
                  <span>{new Date().toLocaleDateString('ar-SY')}</span>
                </div>
              </div>

              {/* Dummy Items */}
              <div className="border-b border-dashed border-slate-300 my-1.5" />
              <div className="text-[10px] space-y-1 text-start">
                <div className="flex justify-between">
                  <span>صنف تجريبي رقم 1 × 2</span>
                  <span className="font-mono font-bold">24,000 ل.س</span>
                </div>
                <div className="flex justify-between">
                  <span>صنف تجريبي رقم 2 × 1</span>
                  <span className="font-mono font-bold">15,000 ل.س</span>
                </div>
              </div>

              <div className="border-b-2 border-black my-2" />
              <div className="flex justify-between text-xs font-black text-black">
                <span>الإجمالي الصافي:</span>
                <span className="font-mono">39,000 ل.س</span>
              </div>

              <p className="text-[9px] text-slate-400 mt-2 italic">
                {settings.receiptFooter || 'شكراً لزيارتكم! نتشرف بخدمتكم دائماً'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Live Camera Capture Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col">
            {/* Modal Header */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">
                    التقاط صورة شعار المتجر
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    وجّه الكاميرا نحو شعار المحل أو اللافتة أو بطاقة العمل
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={stopCameraStream}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Video Viewport with Guide Frame */}
            <div className="relative bg-black aspect-square overflow-hidden flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Square Centering Guide Overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-dashed border-amber-400/90 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] relative">
                  <div className="absolute -top-6 left-0 right-0 text-center text-[11px] font-bold text-amber-300 drop-shadow-sm">
                    ضع الشعار داخل المربع
                  </div>
                  {/* Corner marks */}
                  <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-amber-400" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-amber-400" />
                  <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-amber-400" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-amber-400" />
                </div>
              </div>

              {cameraError && (
                <div className="absolute inset-x-4 bottom-4 p-3 bg-rose-900/90 text-white rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{cameraError}</span>
                </div>
              )}
            </div>

            {/* Modal Controls Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleToggleFacing}
                className="p-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white transition-colors cursor-pointer"
                title="تبديل الكاميرا (أمامية / خلفية)"
              >
                <FlipHorizontal className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={capturePhoto}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>التقاط وحفظ كشعار 📸</span>
              </button>

              <button
                type="button"
                onClick={stopCameraStream}
                className="px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-bold transition-colors cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
