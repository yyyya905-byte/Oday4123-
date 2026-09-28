import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import { useCameraBarcodeScanner } from '../../hooks/useCameraBarcodeScanner';
import { soundEffects } from '../../services/audio';
import { haptics } from '../../services/haptics';
import {
  ScanBarcode,
  Camera,
  X,
  Volume2,
  VolumeX,
  Zap,
  ZapOff,
  RefreshCw,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Edit2,
  PackagePlus,
  Layers,
  Sparkles,
  ArrowRight,
  Boxes,
  Tag
} from 'lucide-react';
import { generateBarcodeSvg } from '../../utils/barcodeUtils';

interface ScannedProductSessionItem {
  id: string;
  barcode: string;
  name: string;
  price: number;
  stock: number;
  isNew: boolean;
  timestamp: string;
}

interface ProductBarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEditProductRequest?: (product: Product) => void;
  onOpenAddModalWithBarcode?: (barcode: string) => void;
  onScanBarcodeDirect?: (barcode: string) => void;
  initialAction?: 'auto_add' | 'open_modal' | 'stock_increment' | 'field_capture';
}

export const ProductBarcodeScannerModal: React.FC<ProductBarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onEditProductRequest,
  onOpenAddModalWithBarcode,
  onScanBarcodeDirect,
  initialAction = 'auto_add',
}) => {
  const {
    products,
    categories,
    addProduct,
    adjustStock,
    formatCurrency,
    settings,
    notify,
    language
  } = useApp();

  // Mode:
  // 'auto_add': Immediately registers new product or increments stock on barcode scan without manual clicks
  // 'open_modal': Opens full product modal with barcode pre-filled for detailed review
  // 'stock_increment': Only updates inventory count (+1) for existing products
  // 'field_capture': Captures barcode directly into the open form field and closes scanner
  const [scanAction, setScanAction] = useState<'auto_add' | 'open_modal' | 'stock_increment' | 'field_capture'>(
    initialAction
  );

  useEffect(() => {
    if (initialAction) {
      setScanAction(initialAction);
    }
  }, [initialAction]);

  // Audio & Haptic feedback
  const [soundMuted, setSoundMuted] = useState(false);

  // Manual input
  const [manualCode, setManualCode] = useState('');

  // Default values for auto-created products
  const [defaultPrice, setDefaultPrice] = useState<number>(1000);
  const [defaultCostPrice, setDefaultCostPrice] = useState<number>(700);
  const [defaultInitialStock, setDefaultInitialStock] = useState<number>(5);
  const [defaultCategoryId, setDefaultCategoryId] = useState<string>(
    categories[1]?.id || categories[0]?.id || 'cat_all'
  );

  // Scan feedback animation
  const [isLaserFlashing, setIsLaserFlashing] = useState(false);
  const [lastScannedResult, setLastScannedResult] = useState<{
    code: string;
    productName: string;
    isNew: boolean;
    stock: number;
  } | null>(null);

  // Live session history
  const [sessionItems, setSessionItems] = useState<ScannedProductSessionItem[]>([]);

  // Barcode scanner video container DOM ID
  const videoContainerId = 'product-camera-barcode-viewport';

  /**
   * Main scan processor called by camera or manual entry
   */
  const handleBarcodeDecoded = useCallback((rawBarcode: string) => {
    const clean = rawBarcode.trim();
    if (!clean) return;

    // Trigger visual laser flash effect
    setIsLaserFlashing(true);
    setTimeout(() => setIsLaserFlashing(false), 300);

    // Audio and tactile haptics
    if (!soundMuted) {
      soundEffects.playBarcodeBeep();
    }
    haptics.successScan();

    // Direct Form Field capture mode
    if (onScanBarcodeDirect || scanAction === 'field_capture') {
      if (onScanBarcodeDirect) {
        onScanBarcodeDirect(clean);
      }
      notify('تم مسح الباركود بنجاح ✨', `الرمز: ${clean}`, 'success');
      onClose();
      return;
    }

    // Look up in existing catalog
    const existing = products.find(
      p =>
        p.barcode.toLowerCase() === clean.toLowerCase() ||
        p.sku.toLowerCase() === clean.toLowerCase() ||
        p.identificationCodes?.some(c => c.toLowerCase() === clean.toLowerCase())
    );

    const currentTime = new Date().toLocaleTimeString('ar-SY', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    if (existing) {
      // Product already exists in store catalog
      if (scanAction === 'open_modal') {
        // Mode: Review / Edit existing
        onClose();
        if (onEditProductRequest) {
          onEditProductRequest(existing);
        }
        return;
      }

      // Auto Add / Stock Increment mode: Increment stock by 1
      adjustStock(existing.id, 1, 'restock', `إضافة سريعة عبر ماسح الكاميرا (+1) - باركود ${clean}`);
      const newStock = existing.stock + 1;

      setLastScannedResult({
        code: clean,
        productName: language === 'ar' ? existing.nameAr : existing.nameEn,
        isNew: false,
        stock: newStock,
      });

      setSessionItems(prev => [
        {
          id: existing.id,
          barcode: clean,
          name: language === 'ar' ? existing.nameAr : existing.nameEn,
          price: existing.price,
          stock: newStock,
          isNew: false,
          timestamp: currentTime,
        },
        ...prev.filter(item => item.barcode !== clean),
      ]);

      notify(
        '📦 تحديث رصيد الصنف بالمخزن',
        `تمت زيادة رصيد [${language === 'ar' ? existing.nameAr : existing.nameEn}] إلى ${newStock} قطعة`,
        'success'
      );
    } else {
      // Product is NOT in catalog: Brand new barcode!
      if (scanAction === 'open_modal') {
        // Open Product Modal pre-filled with this barcode
        onClose();
        if (onOpenAddModalWithBarcode) {
          onOpenAddModalWithBarcode(clean);
        }
        return;
      }

      // AUTO-ADD MODE: Automatically register new product into catalog!
      const autoName = `صنف جديد (${clean.slice(-4) || clean})`;
      const created = addProduct({
        nameAr: autoName,
        nameEn: `New Item (${clean.slice(-4) || clean})`,
        categoryId: defaultCategoryId,
        barcode: clean,
        sku: `SKU-${clean.slice(-4) || Math.floor(100 + Math.random() * 900)}`,
        price: defaultPrice,
        costPrice: defaultCostPrice,
        wholesalePrice: Math.round(defaultPrice * 0.9),
        wholesaleMinQty: 6,
        wholesaleUnit: 'كرتونة',
        wholesaleUnitMultiplier: 6,
        tradeType: 'both',
        stock: defaultInitialStock,
        minStock: 3,
        unit: 'قطعة',
        image: '',
        isFavorite: false,
        status: 'active',
      });

      setLastScannedResult({
        code: clean,
        productName: created.nameAr,
        isNew: true,
        stock: created.stock,
      });

      setSessionItems(prev => [
        {
          id: created.id,
          barcode: clean,
          name: created.nameAr,
          price: created.price,
          stock: created.stock,
          isNew: true,
          timestamp: currentTime,
        },
        ...prev,
      ]);

      notify(
        '✨ تمت إضافة المنتج الجديد تلقائياً!',
        `الباركود: ${clean} • السعر: ${formatCurrency(created.price)} (يمكنك تعديل الاسم والسعر في أي وقت)`,
        'success'
      );
    }
  }, [
    products,
    scanAction,
    soundMuted,
    language,
    defaultCategoryId,
    defaultPrice,
    defaultCostPrice,
    defaultInitialStock,
    adjustStock,
    addProduct,
    formatCurrency,
    notify,
    onClose,
    onEditProductRequest,
    onOpenAddModalWithBarcode,
  ]);

  // Hook-based Camera Scanner API
  const {
    isScanning,
    isStarting,
    error: cameraError,
    cameras,
    activeCameraId,
    hasTorch,
    isTorchOn,
    isSupported,
    startScanner,
    stopScanner,
    toggleTorch,
    switchCamera,
    scanImageFile,
  } = useCameraBarcodeScanner({
    onScan: handleBarcodeDecoded,
    cooldownMs: 800,
    fps: 22,
    qrbox: { width: 280, height: 160 },
  });

  // Start camera when modal opens, stop when closed
  useEffect(() => {
    let timeoutId: any;
    if (isOpen) {
      // Allow modal DOM to render first
      timeoutId = setTimeout(() => {
        startScanner(videoContainerId);
      }, 150);
    } else {
      stopScanner();
      setLastScannedResult(null);
    }

    return () => {
      clearTimeout(timeoutId);
      stopScanner();
    };
  }, [isOpen, startScanner, stopScanner]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col my-4 max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shadow-inner">
              <ScanBarcode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                  ماسح الباركود بالكاميرا (إضافة المنتجات تلقائياً)
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  API مباشر
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                وجّه كاميرا الهاتف أو الحاسوب نحو ملصق الباركود ليتم التعرف والإضافة فورياً
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action / Mode Selector */}
        <div className="p-3 bg-slate-100/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700/80 text-xs font-bold shadow-2xs">
            <button
              type="button"
              onClick={() => setScanAction('auto_add')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                scanAction === 'auto_add'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <PackagePlus className="w-3.5 h-3.5" />
              <span>إضافة تلقائية فورية</span>
            </button>
            <button
              type="button"
              onClick={() => setScanAction('open_modal')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                scanAction === 'open_modal'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>فتح نافذة التعديل والتسمية</span>
            </button>
            <button
              type="button"
              onClick={() => setScanAction('stock_increment')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                scanAction === 'stock_increment'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>زيادة رصيد المخزن فقط (+1)</span>
            </button>
          </div>

          {/* Quick controls: Torch, Sound, Camera switch */}
          <div className="flex items-center gap-1.5">
            {hasTorch && (
              <button
                type="button"
                onClick={() => toggleTorch()}
                className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  isTorchOn
                    ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
                title={isTorchOn ? 'إطفاء الفلاش' : 'تشغيل الفلاش'}
              >
                {isTorchOn ? <Zap className="w-4 h-4 fill-current" /> : <ZapOff className="w-4 h-4" />}
              </button>
            )}

            <button
              type="button"
              onClick={() => setSoundMuted(!soundMuted)}
              className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                soundMuted
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 border-rose-200 dark:border-rose-900'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
              title={soundMuted ? 'إلغاء كتم الصوت' : 'كتم صوت الصافرة'}
            >
              {soundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {cameras.length > 1 && (
              <select
                value={activeCameraId || ''}
                onChange={e => switchCamera(e.target.value)}
                className="text-xs font-bold py-1.5 px-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none"
              >
                {cameras.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Live Camera Viewport */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 border-2 border-slate-800 aspect-16/10 sm:aspect-16/9 flex items-center justify-center shadow-inner">
            {/* HTML5 QR Code Mount Element */}
            <div id={videoContainerId} className="w-full h-full" />

            {/* Laser Line Scanning Effect Overlay */}
            <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
              {/* Corner targeting brackets */}
              <div className="flex justify-between">
                <div className="w-8 h-8 border-t-3 border-s-3 border-amber-400 rounded-tl-lg" />
                <div className="w-8 h-8 border-t-3 border-e-3 border-amber-400 rounded-tr-lg" />
              </div>

              {/* Animated Laser line */}
              <div className="relative w-full h-0.5 bg-amber-400/80 shadow-[0_0_12px_#f59e0b] animate-bounce my-auto opacity-70" />

              <div className="flex justify-between">
                <div className="w-8 h-8 border-b-3 border-s-3 border-amber-400 rounded-bl-lg" />
                <div className="w-8 h-8 border-b-3 border-e-3 border-amber-400 rounded-br-lg" />
              </div>
            </div>

            {/* Flash Effect upon Successful Scan */}
            {isLaserFlashing && (
              <div className="absolute inset-0 bg-emerald-400/30 backdrop-blur-2xs animate-out fade-out duration-300 pointer-events-none flex items-center justify-center">
                <span className="px-4 py-2 rounded-2xl bg-emerald-600 text-white font-black text-sm shadow-xl flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  تم المسح بنجاح!
                </span>
              </div>
            )}

            {/* Camera Loading or Error */}
            {isStarting && (
              <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center text-white gap-2 pointer-events-none">
                <RefreshCw className="w-7 h-7 text-amber-400 animate-spin" />
                <p className="text-xs font-bold">جارٍ تشغيل كاميرا الجهاز...</p>
              </div>
            )}

            {cameraError && (
              <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center text-white gap-3">
                <AlertTriangle className="w-10 h-10 text-amber-400" />
                <div>
                  <h4 className="font-bold text-sm text-amber-300 mb-1">تعذر الوصول إلى الكاميرا</h4>
                  <p className="text-xs text-slate-300 max-w-sm">
                    يرجى السماح للتطبيق بإذن استخدام الكاميرا من إعدادات المتصفح، أو استخدم الماسح اليدوي أو رفع صورة الباركود أدناه.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => startScanner(videoContainerId)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>إعادة المحاولة</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick Manual Code Input / USB Gun Emulation */}
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative flex-1 w-full">
              <input
                type="text"
                value={manualCode}
                onChange={e => setManualCode(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && manualCode.trim()) {
                    e.preventDefault();
                    handleBarcodeDecoded(manualCode.trim());
                    setManualCode('');
                  }
                }}
                placeholder="أدخل الباركود يدوياً أو بمسدس الباركود ثم اضغط Enter..."
                className="w-full text-xs font-mono font-bold pl-3 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500"
              />
              <Tag className="w-4 h-4 text-slate-400 absolute start-3 top-3" />
            </div>

            <button
              type="button"
              disabled={!manualCode.trim()}
              onClick={() => {
                if (manualCode.trim()) {
                  handleBarcodeDecoded(manualCode.trim());
                  setManualCode('');
                }
              }}
              className="w-full sm:w-auto px-4 py-2.5 bg-slate-900 dark:bg-amber-500 hover:opacity-90 disabled:opacity-40 text-white dark:text-slate-950 text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0"
            >
              معالجة الرمز
            </button>

            {/* Scan from Image File button */}
            <label className="w-full sm:w-auto px-3 py-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0 flex items-center justify-center gap-1.5">
              <Upload className="w-4 h-4 text-indigo-500" />
              <span>رفع صورة باركود</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const code = await scanImageFile(file);
                    if (code) {
                      handleBarcodeDecoded(code);
                    } else {
                      notify('تنبيه', 'لم يتم العثور على باركود صالح في الصورة المرفوعة', 'warning');
                    }
                  }
                }}
              />
            </label>
          </div>

          {/* Quick Auto-Add Defaults Configuration Drawer (Visible in Auto-Add mode) */}
          {scanAction === 'auto_add' && (
            <div className="p-3 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/60 rounded-2xl text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  إعدادات الإضافة التلقائية للمنتجات الجديدة غير المسجلة:
                </span>
                <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                  يتم حفظ الصنف فورياً بهذه القيم الافتراضية
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-600 dark:text-slate-400 font-bold mb-0.5">
                    سعر البيع ({settings.currency.symbolNative || settings.currency.symbol})
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={defaultPrice}
                    onChange={e => setDefaultPrice(Number(e.target.value))}
                    className="w-full text-xs font-mono font-bold px-2 py-1.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg border border-amber-200 dark:border-amber-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-600 dark:text-slate-400 font-bold mb-0.5">
                    سعر التكلفة ({settings.currency.symbolNative || settings.currency.symbol})
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={defaultCostPrice}
                    onChange={e => setDefaultCostPrice(Number(e.target.value))}
                    className="w-full text-xs font-mono font-bold px-2 py-1.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg border border-amber-200 dark:border-amber-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-600 dark:text-slate-400 font-bold mb-0.5">
                    الرصيد المبدئي
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={defaultInitialStock}
                    onChange={e => setDefaultInitialStock(Number(e.target.value))}
                    className="w-full text-xs font-mono font-bold px-2 py-1.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg border border-amber-200 dark:border-amber-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-600 dark:text-slate-400 font-bold mb-0.5">
                    التصنيف الافتراضي
                  </label>
                  <select
                    value={defaultCategoryId}
                    onChange={e => setDefaultCategoryId(e.target.value)}
                    className="w-full text-xs font-bold py-1.5 px-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg border border-amber-200 dark:border-amber-900 focus:outline-none"
                  >
                    {categories.filter(c => c.id !== 'cat_all').map(c => (
                      <option key={c.id} value={c.id}>
                        {language === 'ar' ? c.nameAr : c.nameEn}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Last Scanned Status Card */}
          {lastScannedResult && (
            <div className={`p-3 rounded-2xl border flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 ${
              lastScannedResult.isNew
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60'
                : 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/60'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                  lastScannedResult.isNew
                    ? 'bg-emerald-500 text-white'
                    : 'bg-blue-500 text-white'
                }`}>
                  {lastScannedResult.isNew ? <PackagePlus className="w-5 h-5" /> : <Boxes className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white">
                      {lastScannedResult.productName}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      lastScannedResult.isNew
                        ? 'bg-emerald-100 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200'
                        : 'bg-blue-100 dark:bg-blue-900/80 text-blue-800 dark:text-blue-200'
                    }`}>
                      {lastScannedResult.isNew ? 'صنف جديد مضاف' : 'زيادة رصيد مخزن'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    <span>الباركود: {lastScannedResult.code}</span>
                    <span>•</span>
                    <span>الرصيد بالمخزن: {lastScannedResult.stock} قطعة</span>
                  </div>
                </div>
              </div>

              {/* Action to edit this product immediately */}
              {onEditProductRequest && (
                <button
                  type="button"
                  onClick={() => {
                    const found = products.find(p => p.barcode === lastScannedResult.code);
                    if (found) {
                      onClose();
                      onEditProductRequest(found);
                    }
                  }}
                  className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <Edit2 className="w-3.5 h-3.5 text-amber-500" />
                  <span>تعديل التفاصيل</span>
                </button>
              )}
            </div>
          )}

          {/* Session Scan Log */}
          {sessionItems.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>سجل الأصناف الممسوحة في هذه الجلسة ({sessionItems.length}):</span>
                <button
                  type="button"
                  onClick={() => setSessionItems([])}
                  className="text-[11px] text-slate-400 hover:text-rose-500 cursor-pointer"
                >
                  مسح السجل
                </button>
              </div>

              <div className="max-h-40 overflow-y-auto space-y-1.5 divide-y divide-slate-100 dark:divide-slate-800 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-2xl border border-slate-200 dark:border-slate-800">
                {sessionItems.map(item => (
                  <div key={item.id} className="pt-1.5 first:pt-0 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${item.isNew ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                      <span className="font-bold text-slate-900 dark:text-white">{item.name}</span>
                      <span className="font-mono text-[10px] text-slate-400">{item.barcode}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                        {formatCurrency(item.price)}
                      </span>
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        رصيد: {item.stock}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{item.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/70 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <ScanBarcode className="w-4 h-4 text-amber-500" />
            <span>يدعم معايير: EAN-13, Code 128, QR Code, UPC, Code 39 بكاميرات الهواتف والويب</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 dark:bg-slate-700 hover:opacity-90 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            إغلاق الماسح
          </button>
        </div>
      </div>
    </div>
  );
};
