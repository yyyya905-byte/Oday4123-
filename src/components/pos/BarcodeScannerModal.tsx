import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { ScanBarcode, Camera, Search, PlusCircle, X, AlertCircle, Video, VideoOff, Check, RefreshCw } from 'lucide-react';
import { soundEffects } from '../../services/audio';
import { Html5Qrcode } from 'html5-qrcode';
import { DraggableModalWrapper } from '../common/DraggableModalWrapper';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductNotFound?: (scannedBarcode: string) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onProductNotFound
}) => {
  const { products, addToCart, t, formatCurrency, notify, language } = useApp();
  const [manualCode, setManualCode] = useState('');
  const [notFoundCode, setNotFoundCode] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [continuousScan, setContinuousScan] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [lastScannedName, setLastScannedName] = useState<string | null>(null);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const lastScanTimestamp = useRef<number>(0);
  const lastScannedCodeRef = useRef<string>('');

  const handleScanCode = (code: string) => {
    const clean = code.trim();
    if (!clean) return;

    // Prevent duplicate triggers within 1.4 seconds for the same barcode
    const now = Date.now();
    if (clean === lastScannedCodeRef.current && now - lastScanTimestamp.current < 1400) {
      return;
    }
    lastScanTimestamp.current = now;
    lastScannedCodeRef.current = clean;

    const found = products.find(
      p =>
        p.barcode.toLowerCase() === clean.toLowerCase() ||
        p.sku.toLowerCase() === clean.toLowerCase() ||
        p.identificationCodes?.some(c => c.toLowerCase() === clean.toLowerCase())
    );

    if (found) {
      soundEffects.playBeep();
      addToCart(found);
      setLastScannedName(`${language === 'ar' ? found.nameAr : found.nameEn} (${formatCurrency(found.price)})`);
      notify('تمت إضافة المنتج للسلة', `${language === 'ar' ? found.nameAr : found.nameEn} (${formatCurrency(found.price)})`, 'success');
      setManualCode('');
      setNotFoundCode(null);

      if (!continuousScan) {
        stopCamera();
        onClose();
      }
    } else {
      soundEffects.playWarning();
      setNotFoundCode(clean);
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (html5QrCodeRef.current) {
        try { await html5QrCodeRef.current.stop(); } catch {}
      }

      const scanner = new Html5Qrcode("barcode-scanner-video-box");
      html5QrCodeRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 15,
          qrbox: { width: 260, height: 160 },
          aspectRatio: 1.333,
        },
        (decodedText) => {
          handleScanCode(decodedText);
        },
        () => {}
      );
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn("Camera start warning:", err);
      setCameraError(language === 'ar' ? 'تعذر تشغيل الكاميرا (يرجى التحقق من إذن الكاميرا أو استخدام قارئ الباركود اليدوي)' : 'Camera unavailable. Use manual/USB barcode scanner.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current.clear();
      } catch (e) {
        console.warn("Error stopping scanner:", e);
      }
      html5QrCodeRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    if (isOpen) {
      // Auto-start camera if previously allowed
      startCamera();
    } else {
      stopCamera();
      setNotFoundCode(null);
      setLastScannedName(null);
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleScanCode(manualCode);
    }
  };

  return (
    <DraggableModalWrapper
      isOpen={isOpen}
      onClose={() => {
        stopCamera();
        onClose();
      }}
      title={language === 'ar' ? 'قارئ الباركود المباشر' : 'Live Barcode Scanner'}
      subtitle={language === 'ar' ? 'كاميرا الجهاز ومسدسات USB وبلوتوث' : 'Camera & USB/Bluetooth scanners'}
      icon={<ScanBarcode className="w-5 h-5 text-amber-500" />}
      maxWidth="max-w-md"
    >
      <div className="p-4 sm:p-5 space-y-4">
          {/* Viewfinder Camera Feed Container */}
          <div className="relative w-full min-h-[190px] bg-slate-950 rounded-2xl flex flex-col items-center justify-center overflow-hidden border-2 border-dashed border-amber-500/60 shadow-inner">
            <div id="barcode-scanner-video-box" className="w-full h-full overflow-hidden rounded-xl" />

            {!isCameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-slate-900 text-slate-300">
                <Camera className="w-12 h-12 text-amber-500/50 mb-2" />
                <p className="text-xs font-semibold mb-2">
                  {cameraError || (language === 'ar' ? 'الكاميرا متوقفة حالياً' : 'Camera stopped')}
                </p>
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 active:scale-95 shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'تشغيل الكاميرا' : 'Start Camera'}</span>
                </button>
              </div>
            )}

            {isCameraActive && (
              <div className="absolute top-2 end-2 z-10 flex items-center gap-1">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-bold text-white bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-xs">
                  {language === 'ar' ? 'مسح نشط' : 'Scanning'}
                </span>
              </div>
            )}
          </div>

          {/* Success Flash Toast */}
          {lastScannedName && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-2xl flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-200 animate-in fade-in">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>تمت الإضافة: {lastScannedName}</span>
              </div>
              <span className="text-[10px] bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-md">
                +1 في السلة
              </span>
            </div>
          )}

          {/* Manual Input Fallback & Physical Scanner Input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                autoFocus
                value={manualCode}
                onChange={e => {
                  setManualCode(e.target.value);
                  setNotFoundCode(null);
                }}
                onKeyDown={handleKeyDown}
                placeholder={language === 'ar' ? 'أدخل الباركود أو SKU يدوياً أو امسحه...' : 'Enter Barcode/SKU or scan...'}
                className="w-full pl-3 pr-9 py-2.5 bg-slate-100 dark:bg-slate-800 text-sm font-mono font-bold text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500"
              />
              <ScanBarcode className="w-4 h-4 text-slate-400 absolute start-3 top-3.5" />
            </div>

            <button
              type="button"
              onClick={() => handleScanCode(manualCode)}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all shrink-0"
            >
              {language === 'ar' ? 'إضافة' : 'Add'}
            </button>
          </div>

          {/* Continuous Scan Toggle */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 text-xs">
            <span className="text-slate-600 dark:text-slate-400 font-semibold">
              {language === 'ar' ? 'المسح المستمر (إبقاء النافذة مفتوحة لمسح عدة منتجات)' : 'Continuous scanning mode'}
            </span>
            <input
              type="checkbox"
              checked={continuousScan}
              onChange={e => setContinuousScan(e.target.checked)}
              className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
            />
          </div>

          {/* Quick Demo Barcodes */}
          <div className="text-start">
            <p className="text-[11px] font-bold text-slate-400 mb-1.5">
              {language === 'ar' ? 'باركود تجريبي سريع:' : 'Quick test barcodes:'}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {products.slice(0, 4).map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleScanCode(p.barcode)}
                  className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-[10px] font-mono text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                >
                  {p.barcode} ({language === 'ar' ? p.nameAr : p.nameEn})
                </button>
              ))}
            </div>
          </div>

          {/* Not Found Warning & Action */}
          {notFoundCode && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-2xl text-start animate-in fade-in">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-bold text-rose-900 dark:text-rose-200">
                    الباركود ({notFoundCode}) غير مسجل!
                  </p>
                  <p className="text-[11px] text-rose-700 dark:text-rose-300 mt-0.5">
                    {t('wantToAddProduct')}
                  </p>
                  {onProductNotFound && (
                    <button
                      type="button"
                      onClick={() => {
                        stopCamera();
                        onClose();
                        onProductNotFound(notFoundCode);
                      }}
                      className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>{t('addProduct')}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
    </DraggableModalWrapper>
  );
};
