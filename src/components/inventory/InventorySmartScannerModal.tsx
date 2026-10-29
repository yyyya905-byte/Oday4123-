import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import {
  Camera,
  ScanBarcode,
  Search,
  X,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Package,
  Plus,
  Minus,
  SlidersHorizontal,
  RefreshCw,
  Sparkles,
  Volume2,
  Check,
  Tag,
  ArrowRight,
  Boxes,
  Zap,
  Copy
} from 'lucide-react';
import { soundEffects } from '../../services/audio';
import { haptics } from '../../services/haptics';
import { Html5Qrcode } from 'html5-qrcode';
import { DraggableModalWrapper } from '../common/DraggableModalWrapper';

export interface InventorySmartScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenQuickAdjustment?: (product: Product) => void;
  onProductFound?: (product: Product) => void;
}

export const InventorySmartScannerModal: React.FC<InventorySmartScannerModalProps> = ({
  isOpen,
  onClose,
  onOpenQuickAdjustment,
  onProductFound,
}) => {
  const { products, adjustStock, formatCurrency, notify, language } = useApp();

  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [continuousScan, setContinuousScan] = useState<boolean>(true);
  const [manualBarcodeInput, setManualBarcodeInput] = useState<string>('');

  // Scanned Detection State
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [detectedProduct, setDetectedProduct] = useState<Product | null>(null);
  const [isScanSuccessAnimation, setIsScanSuccessAnimation] = useState<boolean>(false);
  const [notFoundBarcode, setNotFoundBarcode] = useState<string | null>(null);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const lastScanTimestamp = useRef<number>(0);
  const lastScannedCodeRef = useRef<string>('');
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (html5QrCodeRef.current) {
        try { await html5QrCodeRef.current.stop(); } catch {}
      }

      const scanner = new Html5Qrcode('inventory-smart-scan-viewport');
      html5QrCodeRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 15,
          qrbox: { width: 280, height: 180 },
          aspectRatio: 1.333,
        },
        (decodedText) => {
          handleBarcodeDetected(decodedText);
        },
        () => {}
      );
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Smart scanner camera start warning:', err);
      setCameraError(
        language === 'ar'
          ? 'تعذر تشغيل الكاميرا (يرجى منح إذن الكاميرا من إعدادات المتصفح أو إدخال الباركود يدوياً)'
          : 'Camera access denied or unavailable. Please grant camera permission or enter barcode manually.'
      );
      setIsCameraActive(false);
    }
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch {}
      html5QrCodeRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    if (isOpen) {
      // Delay slightly for modal DOM container to render
      const timer = setTimeout(() => {
        startCamera();
      }, 250);
      return () => {
        clearTimeout(timer);
        stopCamera();
      };
    } else {
      stopCamera();
      setDetectedProduct(null);
      setScannedCode(null);
      setNotFoundBarcode(null);
      setIsScanSuccessAnimation(false);
    }
  }, [isOpen]);

  const handleBarcodeDetected = (rawCode: string) => {
    const clean = rawCode.trim();
    if (!clean) return;

    // Throttle identical barcode scans within 1.2s
    const now = Date.now();
    if (clean === lastScannedCodeRef.current && now - lastScanTimestamp.current < 1200) {
      return;
    }
    lastScanTimestamp.current = now;
    lastScannedCodeRef.current = clean;
    setScannedCode(clean);

    // 1. Trigger High-Tech Visual Overlay Success Animation
    setIsScanSuccessAnimation(true);
    if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    successTimeoutRef.current = setTimeout(() => {
      setIsScanSuccessAnimation(false);
    }, 1400);

    // 2. Play audio & tactile scan response
    soundEffects.playBeep();
    haptics.successScan();

    // 3. Search and auto-fill product details
    const found = products.find(
      p =>
        p.barcode.toLowerCase() === clean.toLowerCase() ||
        p.sku.toLowerCase() === clean.toLowerCase() ||
        p.identificationCodes?.some(c => c.toLowerCase() === clean.toLowerCase())
    );

    if (found) {
      setDetectedProduct(found);
      setNotFoundBarcode(null);
      if (onProductFound) {
        onProductFound(found);
      }
      notify(
        '⚡ تم التعرف على المنتج فورياً',
        `${found.nameAr} · المخزون: ${found.stock} ${found.unit}`,
        'success'
      );
      if (!continuousScan) {
        stopCamera();
      }
    } else {
      setDetectedProduct(null);
      setNotFoundBarcode(clean);
      soundEffects.playWarning();
    }
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualBarcodeInput.trim()) return;
    handleBarcodeDetected(manualBarcodeInput);
    setManualBarcodeInput('');
  };

  const handleInstantQuickRestock = (product: Product, amount: number) => {
    soundEffects.playCashDrawer();
    haptics.confirm();
    adjustStock(product.id, amount, 'purchase', 'توريد سريع (+10) من الفحص الذكي بالكاميرا');
    setDetectedProduct(prev => (prev ? { ...prev, stock: prev.stock + amount } : null));
    notify('تم التوريد بنجاح', `تمت إضافة +${amount} ${product.unit} إلى رصيد ${product.nameAr}`, 'success');
  };

  const handleInstantQuickDamage = (product: Product) => {
    if (product.stock <= 0) return;
    soundEffects.playDeleteTick();
    haptics.warning();
    adjustStock(product.id, -1, 'damage', 'خصم تالف (-1) من الفحص الذكي بالكاميرا');
    setDetectedProduct(prev => (prev ? { ...prev, stock: Math.max(0, prev.stock - 1) } : null));
    notify('تم خصم تالف', `تم خصم 1 ${product.unit} تالف من ${product.nameAr}`, 'info');
  };

  if (!isOpen) return null;

  return (
    <DraggableModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="الفحص الذكي بالكاميرا وقارئ الباركود (Smart Scan)"
      maxWidth="max-w-2xl"
    >
      <div className="p-4 sm:p-5 space-y-4 text-slate-900 dark:text-white">
        {/* Scanner Viewport with Dynamic Laser Scanline & Target Brackets */}
        <div className="relative rounded-3xl overflow-hidden bg-slate-950 border-2 border-slate-800 shadow-2xl min-h-[220px] flex items-center justify-center">
          {/* HTML5 QR Camera Element */}
          <div
            id="inventory-smart-scan-viewport"
            className="w-full h-full min-h-[220px] flex items-center justify-center overflow-hidden"
          />

          {/* Fallback Camera Placeholder / Permission Alert */}
          {!isCameraActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-slate-400 bg-slate-950/95 space-y-3 z-10">
              <Camera className="w-12 h-12 text-slate-600 animate-pulse" />
              <div className="max-w-sm space-y-1">
                <p className="text-xs sm:text-sm font-bold text-slate-200">
                  {cameraError || 'جارٍ طلب الإذن وتشغيل كاميرا الجهاز...'}
                </p>
                <p className="text-[11px] text-slate-400">
                  يمكنك أيضاً كتابة الباركود أو مسحه بماسح USB في الحقل أدناه فورياً
                </p>
              </div>
              <button
                type="button"
                onClick={startCamera}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>إعادة محاولة تشغيل الكاميرا</span>
              </button>
            </div>
          )}

          {/* High-Tech Visual Reticle & Animated Scan Beam Overlay */}
          {isCameraActive && (
            <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
              {/* Target Bounding Frame with Corner Brackets */}
              <div className="relative w-64 h-40 rounded-2xl border border-white/20">
                {/* 4 Neon Corner Accents */}
                <div className="absolute -top-1 -start-1 w-5 h-5 border-t-4 border-s-4 border-amber-400 rounded-tl-lg" />
                <div className="absolute -top-1 -end-1 w-5 h-5 border-t-4 border-e-4 border-amber-400 rounded-tr-lg" />
                <div className="absolute -bottom-1 -start-1 w-5 h-5 border-b-4 border-s-4 border-amber-400 rounded-bl-lg" />
                <div className="absolute -bottom-1 -end-1 w-5 h-5 border-b-4 border-e-4 border-amber-400 rounded-br-lg" />

                {/* Animated Green Laser Sweeping Beam */}
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#34d399] animate-[bounce_2s_infinite]" />
              </div>

              {/* Viewfinder Caption Banner */}
              <div className="absolute bottom-3 inset-x-0 flex justify-center">
                <span className="px-3 py-1 rounded-full text-[11px] font-black bg-slate-900/80 backdrop-blur-md text-amber-400 border border-amber-500/30 shadow-md">
                  وجّه الكاميرا نحو باركود الصنف
                </span>
              </div>
            </div>
          )}

          {/* VISUAL SCAN SUCCESS OVERLAY FLASH EFFECT */}
          {isScanSuccessAnimation && (
            <div className="absolute inset-0 z-20 pointer-events-none bg-emerald-500/25 ring-8 ring-emerald-400 rounded-3xl transition-all duration-300 animate-in fade-in zoom-in-95 flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-slate-950/90 border-2 border-emerald-400 text-center shadow-2xl space-y-1">
                <div className="w-12 h-12 rounded-full bg-emerald-500 text-slate-950 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/40 animate-bounce">
                  <Check className="w-7 h-7 stroke-[3]" />
                </div>
                <h4 className="text-sm font-black text-emerald-400">تم التعرف على الباركود!</h4>
                <p className="text-xs font-mono font-bold text-white">{scannedCode}</p>
              </div>
            </div>
          )}
        </div>

        {/* Manual Input Fallback & Continuous Scan Control */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <form onSubmit={handleManualSearch} className="flex-1 relative flex items-center gap-1.5">
            <div className="relative flex-1">
              <ScanBarcode className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={manualBarcodeInput}
                onChange={e => setManualBarcodeInput(e.target.value)}
                placeholder="أو اكتب/امسح الباركود يدوياً هنا..."
                className="w-full ps-9 pe-3 py-2 text-xs font-mono font-bold bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-amber-500"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs cursor-pointer active:scale-95 transition-all shadow-xs shrink-0"
            >
              بحث
            </button>
          </form>

          <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer select-none shrink-0 self-end sm:self-center">
            <input
              type="checkbox"
              checked={continuousScan}
              onChange={e => setContinuousScan(e.target.checked)}
              className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
            />
            <span>المسح المتواصل للأصناف</span>
          </label>
        </div>

        {/* AUTO-FILLED PRODUCT DETAILS DISPLAY CARD */}
        {detectedProduct && (
          <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-white to-amber-500/10 dark:from-emerald-950/40 dark:via-slate-900 dark:to-amber-950/30 border-2 border-emerald-500/50 shadow-xl space-y-3.5 animate-in slide-in-from-bottom-2 duration-200">
            {/* Header: Name, Status, Barcode */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-md shadow-emerald-500/20">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      {detectedProduct.nameAr}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                      تم العثور عليه بالمخزون ✓
                    </span>
                  </div>
                  {detectedProduct.nameEn && (
                    <p className="text-xs text-slate-500 font-sans">{detectedProduct.nameEn}</p>
                  )}
                  <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                    الباركود: <span className="font-bold text-slate-700 dark:text-slate-200">{detectedProduct.barcode}</span> · SKU: {detectedProduct.sku}
                  </p>
                </div>
              </div>

              {/* Stock Status Badge */}
              <div className="text-end">
                <span className="text-[10px] text-slate-400 block font-bold">رصيد المخزون الحالي</span>
                <span className={`text-lg font-black font-mono tabular-nums ${
                  detectedProduct.stock <= 0
                    ? 'text-rose-600'
                    : detectedProduct.stock <= detectedProduct.minStock
                    ? 'text-amber-600'
                    : 'text-emerald-600'
                }`}>
                  {detectedProduct.stock} {detectedProduct.unit}
                </span>
                <span className="block text-[10px] text-slate-400">
                  (حد الأمان: {detectedProduct.minStock} {detectedProduct.unit})
                </span>
              </div>
            </div>

            {/* Financial Details: Cost, Retail Price, Valuation */}
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-500 block">سعر التكلفة</span>
                <span className="text-xs sm:text-sm font-black font-mono text-slate-700 dark:text-slate-300">
                  {formatCurrency(detectedProduct.costPrice)}
                </span>
              </div>

              <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-500 block">سعر البيع بالمفرق</span>
                <span className="text-xs sm:text-sm font-black font-mono text-blue-600 dark:text-blue-400">
                  {formatCurrency(detectedProduct.price)}
                </span>
              </div>

              <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-500 block">قيمة المخزون الحالي</span>
                <span className="text-xs sm:text-sm font-black font-mono text-amber-600 dark:text-amber-400">
                  {formatCurrency(detectedProduct.costPrice * detectedProduct.stock)}
                </span>
              </div>
            </div>

            {/* Actions Cluster for this Product */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleInstantQuickRestock(detectedProduct, 10)}
                  className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-xs"
                  title="إضافة 10 قطع فورياً للمخزون"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+10 توريد فوري</span>
                </button>

                <button
                  type="button"
                  disabled={detectedProduct.stock <= 0}
                  onClick={() => handleInstantQuickDamage(detectedProduct)}
                  className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 font-bold text-xs flex items-center gap-1 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                  title="خصم قطعة واحدة تالفة"
                >
                  <Minus className="w-3.5 h-3.5" />
                  <span>-1 تسجيل تلف</span>
                </button>
              </div>

              {/* Primary Action: Open Quick Stock Adjustment Modal */}
              <button
                type="button"
                onClick={() => {
                  if (onOpenQuickAdjustment) {
                    onOpenQuickAdjustment(detectedProduct);
                    onClose();
                  }
                }}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs shadow-md shadow-amber-500/25 flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>فتح التعديل المتقدم للمخزون ➔</span>
              </button>
            </div>
          </div>
        )}

        {/* Not Found In Database Banner */}
        {notFoundBarcode && !detectedProduct && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex items-center justify-between gap-3 text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <p className="text-xs font-black">
                  باركود غير مسجل في المستودع: <span className="font-mono">{notFoundBarcode}</span>
                </p>
                <p className="text-[11px] text-amber-700 dark:text-amber-300">
                  الصنف غير موجود بقاعدة بيانات المنتجات. يمكنك إضافته من صفحة المنتجات.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(notFoundBarcode);
                notify('تم نسخ الباركود', notFoundBarcode, 'info');
              }}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-300 dark:border-slate-700 flex items-center gap-1 cursor-pointer shrink-0"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>نسخ الكود</span>
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            💡 يتم التعرف تلقائياً على الباركود الدولي EAN-13 والأكواد السريعة
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </DraggableModalWrapper>
  );
};
