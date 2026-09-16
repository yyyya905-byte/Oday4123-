import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import {
  ScanBarcode,
  Search,
  Plus,
  Minus,
  CheckCircle2,
  Package,
  ArrowRight,
  Sparkles,
  Camera,
  History,
  Layers,
  AlertTriangle,
  Zap,
  ShoppingCart,
  Send,
  Video,
  RefreshCw,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Flashlight,
  Sliders,
  Check,
  RotateCcw,
  Tag,
  Hash,
  Eye
} from 'lucide-react';
import { soundEffects } from '../../services/audio';
import { haptics } from '../../services/haptics';
import { Html5Qrcode } from 'html5-qrcode';

interface ScannedBatchItem {
  product: Product;
  code: string;
  count: number;
  lastScannedAt: string;
}

export const MobileStockScannerView: React.FC<{ onBackToMain?: () => void }> = ({ onBackToMain }) => {
  const { 
    products, 
    adjustStock, 
    formatCurrency, 
    notify,
    language,
    sendRemoteBarcodeScan
  } = useApp();

  // Operating Modes
  // 'pos_relay': Direct relay to Master POS cart
  // 'stock_auto_add': Continuous inventory auditing (+1 on scan automatically)
  // 'stock_inspector': Price & stock verification without altering database
  const [scanMode, setScanMode] = useState<'pos_relay' | 'stock_auto_add' | 'stock_inspector'>('pos_relay');

  // Continuous Scan Configuration
  const [isContinuousEnabled, setIsContinuousEnabled] = useState(true);
  const [auditStep, setAuditStep] = useState<number>(1); // +1, +5, +10, -1
  const [soundMuted, setSoundMuted] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);

  // Visual Scanning Feedback Animation
  const [scanFlashActive, setScanFlashActive] = useState(false);
  const [lastScannedProduct, setLastScannedProduct] = useState<Product | null>(null);
  const [lastScannedCode, setLastScannedCode] = useState<string>('');

  // Continuous Session Batch Tray
  const [sessionItems, setSessionItems] = useState<ScannedBatchItem[]>([]);
  const [barcodeInput, setBarcodeInput] = useState('');

  // Camera & Scan Throttle Refs
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const lastScannedCodeRef = useRef<string>('');
  const lastScanTimeRef = useRef<number>(0);
  const flashTimeoutRef = useRef<any>(null);

  // Total items scanned in this active continuous session
  const totalScannedCount = sessionItems.reduce((acc, item) => acc + item.count, 0);

  /**
   * Process incoming barcode scan from Camera or Manual Input
   */
  const processBarcodeScan = useCallback(async (rawCode: string) => {
    if (isPaused) return;
    const clean = rawCode.trim();
    if (!clean) return;

    const now = Date.now();
    const isSameCode = clean.toLowerCase() === lastScannedCodeRef.current.toLowerCase();

    // Intelligent Rapid Debounce:
    // - Different item: 250ms settle time (super fast consecutive scanning of different shelf items)
    // - Same item: 800ms cooldown (prevents accidental multiple reads of the same physical item,
    //   while allowing deliberate repeat scans of identical products)
    const cooldownMs = isSameCode ? 800 : 250;
    if (now - lastScanTimeRef.current < cooldownMs) {
      return;
    }

    lastScanTimeRef.current = now;
    lastScannedCodeRef.current = clean;
    setLastScannedCode(clean);

    // Search for product across Barcode, SKU, and Secondary Identification Codes
    const found = products.find(p =>
      p.barcode.toLowerCase() === clean.toLowerCase() ||
      p.sku.toLowerCase() === clean.toLowerCase() ||
      p.identificationCodes?.some(c => c.toLowerCase() === clean.toLowerCase())
    );

    if (found) {
      setLastScannedProduct(found);

      // Trigger High-Tech Laser Visual Flash
      setScanFlashActive(true);
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
      flashTimeoutRef.current = setTimeout(() => {
        setScanFlashActive(false);
      }, 250);

      // Tactile physical feedback for cashier
      haptics.successScan();

      // Audio Confirmation: Distinctive POS Laser Beep
      if (!soundMuted) {
        soundEffects.playBarcodeBeep();
      }

      // Update Session Batch Tray
      setSessionItems(prev => {
        const existingIdx = prev.findIndex(item => item.product.id === found.id);
        const timeStr = new Date().toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx] = {
            ...updated[existingIdx],
            count: updated[existingIdx].count + 1,
            lastScannedAt: timeStr,
          };
          // Move to top of batch list
          const [moved] = updated.splice(existingIdx, 1);
          return [moved, ...updated];
        } else {
          return [{
            product: found,
            code: clean,
            count: 1,
            lastScannedAt: timeStr,
          }, ...prev];
        }
      });

      // Mode-Specific Automated Action (No manual button click needed!)
      if (scanMode === 'pos_relay') {
        // Automatic Relay to POS Cart
        await sendRemoteBarcodeScan(clean, 1, 'ماسح باركود متنقل متتابع');
        notify(
          '⚡ إضافة سريعة لسلة الكاشير',
          `[${language === 'ar' ? found.nameAr : found.nameEn}] (+1) أُرسل بنجاح`,
          'success'
        );
      } else if (scanMode === 'stock_auto_add') {
        // Automatic Stock Adjustment on Scan
        const delta = auditStep;
        const type = delta > 0 ? 'restock' : 'adjustment';
        const reason = `جرد سريع متتابع بالكاميرا (${delta > 0 ? '+' : ''}${delta})`;
        adjustStock(found.id, delta, type, reason);
        notify(
          'تعديل رصيد المخزن',
          `تم تعديل [${language === 'ar' ? found.nameAr : found.nameEn}] بمقدار (${delta > 0 ? '+' : ''}${delta})`,
          'info'
        );
      } else {
        // Inspector Mode: Just preview price and current inventory
        notify(
          'فحص المنتج',
          `[${language === 'ar' ? found.nameAr : found.nameEn}] السعر: ${formatCurrency(found.price)} • الرصيد: ${found.stock}`,
          'info'
        );
      }
    } else {
      // Tactile vibration alert for cashier on unrecognized code
      haptics.scanError();

      // Unrecognized barcode feedback: Distinct Error Buzz
      if (!soundMuted) {
        soundEffects.playScanError();
      }
      notify('الرمز غير مسجل', `لم يتم العثور على منتج مسجل بالباركود: ${clean}`, 'warning');
    }
  }, [isPaused, products, scanMode, auditStep, soundMuted, sendRemoteBarcodeScan, adjustStock, notify, language, formatCurrency]);

  /**
   * Start Camera Scanner with continuous video frame analysis
   */
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (html5QrCodeRef.current) {
        try { 
          if (html5QrCodeRef.current.isScanning) {
            await html5QrCodeRef.current.stop(); 
          }
        } catch {}
      }

      const scanner = new Html5Qrcode("mobile-continuous-video-reader");
      html5QrCodeRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 25, // High frame rate for instant, smooth recognition
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            return {
              width: Math.floor(minEdge * 0.85),
              height: Math.floor(minEdge * 0.55),
            };
          },
          aspectRatio: 1.6,
        },
        (decodedText) => {
          processBarcodeScan(decodedText);
        },
        () => {
          // Frame scanned without code - continue silently
        }
      );
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn("Mobile continuous camera error:", err);
      setCameraError(language === 'ar' ? 'تعذر الوصول إلى الكاميرا. يرجى منح إذن الوصول.' : 'Camera access failed');
      setIsCameraActive(false);
    }
  };

  /**
   * Stop Camera Scanner safely
   */
  const stopCamera = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current.clear();
      } catch (e) {
        console.warn("Error stopping continuous camera:", e);
      }
      html5QrCodeRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Toggle Camera Flashlight / Torch if supported
  const toggleTorch = async () => {
    try {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        const nextTorch = !torchOn;
        await html5QrCodeRef.current.applyVideoConstraints({
          advanced: [{ torch: nextTorch } as any]
        });
        setTorchOn(nextTorch);
        soundEffects.playClick();
      }
    } catch (err) {
      notify('تنبيه', 'فلاش الكاميرا غير مدعوم على هذا الجهاز', 'info');
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    };
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    processBarcodeScan(barcodeInput.trim());
    setBarcodeInput('');
  };

  const handleClearSession = () => {
    soundEffects.playClick();
    setSessionItems([]);
    setLastScannedProduct(null);
    setLastScannedCode('');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 text-slate-100 overflow-hidden font-sans select-none">
      {/* 1. Header Bar */}
      <div className="h-16 bg-slate-950 border-b border-slate-800 px-3 sm:px-4 flex items-center justify-between shadow-md shrink-0">
        <div className="flex items-center gap-2.5">
          {onBackToMain && (
            <button
              type="button"
              onClick={() => {
                stopCamera();
                onBackToMain();
              }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
              title="العودة للرئيسية"
            >
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </button>
          )}

          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold shadow-lg shadow-emerald-500/20">
            <ScanBarcode className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xs sm:text-sm font-black text-white">
                {language === 'ar' ? 'الماسح السريع المتتابع (Continuous Multi-Scan)' : 'Continuous Barcode Scanner'}
              </h1>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>مباشر</span>
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              مسح مستمر متتالي دون توقف مع صوت تأكيد فوري لكل منتج
            </p>
          </div>
        </div>

        {/* Audio & Flash Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSoundMuted(!soundMuted)}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              soundMuted
                ? 'bg-slate-800 border-slate-700 text-slate-400'
                : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-xs'
            }`}
            title={soundMuted ? 'تفعيل صوت التأكيد' : 'كتم الصوت'}
          >
            {soundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={toggleTorch}
            disabled={!isCameraActive}
            className={`p-2 rounded-xl border transition-all cursor-pointer disabled:opacity-40 ${
              torchOn
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-md shadow-amber-500/20'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
            title="فلاش الكاميرا"
          >
            <Flashlight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsPaused(!isPaused)}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              isPaused
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                : 'bg-slate-800 border-slate-700 text-slate-300'
            }`}
            title={isPaused ? 'استئناف المسح' : 'إيقاف مؤقت'}
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 2. Operating Mode Switcher & Auto Step Controls */}
      <div className="bg-slate-950 px-3 py-2 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setScanMode('pos_relay');
              soundEffects.playClick();
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              scanMode === 'pos_relay'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>إرسال لسلة البيع (+1)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setScanMode('stock_auto_add');
              soundEffects.playClick();
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              scanMode === 'stock_auto_add'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>تعديل الجرد والمخزن</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setScanMode('stock_inspector');
              soundEffects.playClick();
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              scanMode === 'stock_inspector'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>فحص الأسعار والرصيد</span>
          </button>
        </div>

        {/* Step Selector for Stock Audit */}
        {scanMode === 'stock_auto_add' && (
          <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold">الزيادة التلقائية عند كل مسحة:</span>
            {[1, 5, 10, -1].map((step) => (
              <button
                key={step}
                type="button"
                onClick={() => setAuditStep(step)}
                className={`px-2 py-0.5 rounded-md text-xs font-black transition-all cursor-pointer ${
                  auditStep === step
                    ? step > 0 ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {step > 0 ? `+${step}` : step}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3. Camera Viewfinder Area with High-Tech Laser & Flash Pulse */}
      <div className="relative bg-black flex flex-col items-center justify-center shrink-0 overflow-hidden min-h-[220px] max-h-[300px]">
        {/* The HTML5 Video Element Canvas */}
        <div
          id="mobile-continuous-video-reader"
          className="w-full h-full max-w-lg aspect-video overflow-hidden relative"
        />

        {/* High-Tech Visual Reticle & Laser Scanning Overlay */}
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
          <div className={`w-72 sm:w-80 h-32 sm:h-36 rounded-2xl relative border-2 transition-all duration-150 flex items-center justify-center ${
            scanFlashActive
              ? 'border-emerald-400 bg-emerald-500/25 shadow-[0_0_40px_rgba(52,211,153,0.8)] scale-102'
              : isPaused
              ? 'border-rose-500/40 bg-rose-950/20'
              : 'border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
          }`}>
            {/* 4 Corner Markers */}
            <div className="absolute top-0 start-0 w-4 h-4 border-t-4 border-s-4 border-emerald-400 -mt-1 -ms-1 rounded-tl" />
            <div className="absolute top-0 end-0 w-4 h-4 border-t-4 border-e-4 border-emerald-400 -mt-1 -me-1 rounded-tr" />
            <div className="absolute bottom-0 start-0 w-4 h-4 border-b-4 border-s-4 border-emerald-400 -mb-1 -ms-1 rounded-bl" />
            <div className="absolute bottom-0 end-0 w-4 h-4 border-b-4 border-e-4 border-emerald-400 -mb-1 -me-1 rounded-br" />

            {/* Red/Emerald Laser Line Animation */}
            {!isPaused && (
              <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] animate-pulse" />
            )}

            {/* Status overlay tag inside viewfinder */}
            <div className="absolute bottom-2 px-2.5 py-0.5 rounded-full bg-black/75 backdrop-blur-sm border border-emerald-500/40 text-[10px] font-bold text-emerald-300 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isPaused ? 'bg-rose-500' : 'bg-emerald-400 animate-ping'}`} />
              <span>
                {isPaused
                  ? 'المسح متوقف مؤقتاً'
                  : scanFlashActive
                  ? 'تم التعرف بنجاح! ⚡'
                  : 'وجّه الكاميرا نحو الباركود مباشرة'}
              </span>
            </div>
          </div>
        </div>

        {/* Camera Start Error Fallback */}
        {!isCameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-slate-950 text-slate-300 z-20">
            <Camera className="w-10 h-10 text-emerald-500/50 mb-2" />
            <p className="text-xs font-semibold mb-2">
              {cameraError || (language === 'ar' ? 'الكاميرا متوقفة' : 'Camera inactive')}
            </p>
            <button
              type="button"
              onClick={startCamera}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'إعادة تشغيل الكاميرا' : 'Restart Camera'}</span>
            </button>
          </div>
        )}
      </div>

      {/* 4. Live Scanned Product Pill & Quick Session Stats Strip */}
      <div className="bg-slate-950 px-3.5 py-2.5 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-800/80 px-3 py-1.5 rounded-xl">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px] font-bold text-slate-300">إجمالي المسح:</span>
            <span className="text-sm font-black text-emerald-400">{totalScannedCount}</span>
            <span className="text-[10px] text-slate-400">قطعة</span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[11px] font-bold text-slate-300">أصناف فريدة:</span>
            <span className="text-sm font-black text-blue-400">{sessionItems.length}</span>
          </div>
        </div>

        {sessionItems.length > 0 && (
          <button
            type="button"
            onClick={handleClearSession}
            className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-slate-400 hover:text-rose-400 bg-slate-900 hover:bg-rose-950/40 rounded-xl border border-slate-800 transition-colors cursor-pointer"
            title="تفريغ سجل الجلسة"
          >
            <RotateCcw className="w-3 h-3" />
            <span>تصفير</span>
          </button>
        )}
      </div>

      {/* 5. Last Scanned Product Showcase Card */}
      {lastScannedProduct && (
        <div className="bg-gradient-to-r from-slate-900 to-slate-950 p-3 mx-3 mt-2 rounded-2xl border border-emerald-500/40 shadow-lg shadow-emerald-500/5 shrink-0 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/80">
                  {lastScannedProduct.barcode}
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  {scanMode === 'pos_relay' ? '⚡ تم الإرسال للكاشير' : 'آخر مسحة ناجحة'}
                </span>
              </div>
              <h3 className="text-sm font-black text-white mt-1 truncate">
                {language === 'ar' ? lastScannedProduct.nameAr : lastScannedProduct.nameEn}
              </h3>
              <p className="text-xs text-amber-400 font-bold mt-0.5">
                {formatCurrency(lastScannedProduct.price)} • المخزون الحالي: {lastScannedProduct.stock} {lastScannedProduct.unit}
              </p>
            </div>

            <div className="text-end bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 shrink-0">
              <span className="text-[10px] text-slate-400 block font-bold">مرات المسح</span>
              <span className="text-lg font-black text-emerald-400">
                × {sessionItems.find(i => i.product.id === lastScannedProduct.id)?.count || 1}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 6. Desktop Quick Simulation Bar & Manual Barcode Input */}
      <div className="p-3 bg-slate-950 border-t border-slate-800 shrink-0 space-y-2">
        {/* Manual Barcode Input */}
        <form onSubmit={handleManualSubmit} className="relative">
          <ScanBarcode className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={barcodeInput}
            onChange={e => setBarcodeInput(e.target.value)}
            placeholder="أدخل الباركود أو الكود التعريفي يدوياً واضغط Enter..."
            className="w-full ps-9 pe-20 py-2 rounded-xl text-xs bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="submit"
            className="absolute end-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
          >
            مسح فوري
          </button>
        </form>

        {/* Quick Simulation Bar for Easy Testing */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
          <span className="text-[10px] text-slate-400 whitespace-nowrap flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>أكواد تجريبية سريعة:</span>
          </span>
          {products.slice(0, 6).map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => processBarcodeScan(p.barcode)}
              className="px-2.5 py-1 bg-slate-900 hover:bg-emerald-950 hover:border-emerald-500/50 active:scale-95 text-slate-300 text-[10px] font-mono rounded-lg border border-slate-800 whitespace-nowrap transition-all cursor-pointer"
            >
              {p.barcode} ({p.nameAr.slice(0, 8)}..)
            </button>
          ))}
        </div>
      </div>

      {/* 7. Active Session Scanned Items Stream */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2 bg-slate-900">
        <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-1">
          <span className="flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-emerald-400" />
            <span>سجل الأصناف الممسوحة في هذه الجلسة ({sessionItems.length})</span>
          </span>
          <span className="text-[10px] text-slate-500">الأحدث أولاً</span>
        </div>

        {sessionItems.length === 0 ? (
          <div className="h-32 flex flex-col items-center justify-center text-center p-4 bg-slate-950/60 rounded-2xl border border-slate-800 text-slate-500 text-xs">
            <ScanBarcode className="w-8 h-8 text-slate-700 mb-2" />
            <p className="font-bold text-slate-400">بانتظار مسح المنتجات...</p>
            <p className="text-[11px] text-slate-600 mt-0.5">
              وجّه الكاميرا نحو أي كود، وسيتم تسجيله وإصدار نغمة تأكيد تلقائياً دون الحاجة للنقر على أي زر
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {sessionItems.map((item) => (
              <div
                key={item.product.id}
                className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-all"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-white truncate">
                      {language === 'ar' ? item.product.nameAr : item.product.nameEn}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.2 rounded">
                      {item.code}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>{formatCurrency(item.product.price)}</span>
                    <span>•</span>
                    <span>المخزون الحالي: {item.product.stock}</span>
                    <span>•</span>
                    <span>{item.lastScannedAt}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-emerald-950 text-emerald-300 font-mono font-black text-xs rounded-lg border border-emerald-800/60">
                    × {item.count}
                  </span>

                  {/* Manual trigger for another relay if desired */}
                  <button
                    type="button"
                    onClick={() => {
                      sendRemoteBarcodeScan(item.code, 1, 'ماسح باركود متنقل');
                      soundEffects.playBarcodeBeep();
                      notify('تم التكرار', `+1 إضافي لـ ${item.product.nameAr}`, 'success');
                    }}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title="إرسال دفعة إضافية للكاشير"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
