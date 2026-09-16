import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Sale } from '../../types';
import {
  ScanBarcode,
  Camera,
  Search,
  X,
  AlertCircle,
  Video,
  VideoOff,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Barcode as BarcodeIcon,
  Zap,
  Info
} from 'lucide-react';
import { soundEffects } from '../../services/audio';
import { Html5Qrcode } from 'html5-qrcode';

interface InvoiceBarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvoiceMatched: (sale: Sale) => void;
}

export const InvoiceBarcodeScannerModal: React.FC<InvoiceBarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onInvoiceMatched
}) => {
  const { sales, notify, language } = useApp();
  const [manualCode, setManualCode] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [matchedSale, setMatchedSale] = useState<Sale | null>(null);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const manualInputRef = useRef<HTMLInputElement>(null);
  const isScanningBusy = useRef<boolean>(false);

  // Parse raw scanned text into an invoice match
  const parseAndFindInvoice = (rawText: string): Sale | undefined => {
    const clean = rawText.trim();
    if (!clean) return undefined;

    // 1. Check if rawText is JSON (such as receipt QR payload)
    if (clean.startsWith('{') && clean.endsWith('}')) {
      try {
        const parsed = JSON.parse(clean);
        const candidateInv = parsed.inv || parsed.invoiceNumber || parsed.invoice_number || parsed.id;
        if (candidateInv) {
          const match = sales.find(s => 
            s.invoiceNumber.toLowerCase() === String(candidateInv).toLowerCase().trim() ||
            s.id.toLowerCase() === String(candidateInv).toLowerCase().trim()
          );
          if (match) return match;
        }
      } catch {
        // Not JSON, continue to next checks
      }
    }

    // 2. Direct exact match by invoiceNumber or id
    const exact = sales.find(s => 
      s.invoiceNumber.toLowerCase() === clean.toLowerCase() ||
      s.id.toLowerCase() === clean.toLowerCase()
    );
    if (exact) return exact;

    // 3. Partial or sanitized alphanumeric match (removing spaces, symbols)
    const sanitizedClean = clean.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const sanitizedMatch = sales.find(s => {
      const sanitizedInv = s.invoiceNumber.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      const sanitizedId = s.id.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      return sanitizedInv === sanitizedClean || sanitizedId === sanitizedClean;
    });

    return sanitizedMatch;
  };

  const handleProcessBarcode = (scannedText: string) => {
    if (isScanningBusy.current) return;
    const clean = scannedText.trim();
    if (!clean) return;

    isScanningBusy.current = true;
    const found = parseAndFindInvoice(clean);

    if (found) {
      soundEffects.playBeep();
      setMatchedSale(found);
      notify('تم العثور على الفاتورة', `فاتورة #${found.invoiceNumber} للعميل ${found.customerName || 'عميل نقدي'}`, 'success');

      setTimeout(() => {
        stopCamera();
        onInvoiceMatched(found);
        onClose();
        isScanningBusy.current = false;
      }, 700);
    } else {
      soundEffects.playWarning();
      setCameraError(`لم يتم العثور على فاتورة تطابق الرمز: "${clean}". تأكد من مسح باركود الفاتورة الأصلية الصحيح.`);
      setTimeout(() => {
        isScanningBusy.current = false;
      }, 1200);
    }
  };

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

      const scanner = new Html5Qrcode('invoice-scanner-viewport');
      html5QrCodeRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 20,
          qrbox: { width: 280, height: 180 },
          aspectRatio: 1.333,
        },
        (decodedText) => {
          handleProcessBarcode(decodedText);
        },
        () => {}
      );
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Invoice Camera start error:', err);
      setCameraError(language === 'ar' ? 'تعذر تشغيل الكاميرا. يرجى التحقق من صلاحيات الكاميرا أو استخدام قارئ الباركود اليدوي USB.' : 'Camera unavailable. Use manual barcode scanner.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      } catch (e) {
        console.warn('Stop camera error:', e);
      }
      html5QrCodeRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    if (isOpen) {
      setMatchedSale(null);
      setCameraError(null);
      setManualCode('');
      isScanningBusy.current = false;
      startCamera();
      // Auto-focus manual input
      setTimeout(() => {
        manualInputRef.current?.focus();
      }, 300);
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleProcessBarcode(manualCode);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
        {/* Header */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <ScanBarcode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>مسح باركود الفاتورة الأصلية</span>
                <span className="text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-300 font-mono px-2 py-0.5 rounded-md">
                  QR / 1D Barcode
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                وجّه الكاميرا أو قارئ الباركود نحو الإيصال لاسترجاع الفاتورة فوراً
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* Camera Viewport */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 aspect-4/3 flex flex-col items-center justify-center shadow-inner">
            <div id="invoice-scanner-viewport" className="w-full h-full object-cover" />

            {/* Target Reticle & Laser Beam Overlay */}
            {isCameraActive && !matchedSale && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-40 border-2 border-amber-400/80 rounded-2xl relative shadow-lg">
                  {/* Corner Reticles */}
                  <span className="absolute -top-1 -start-1 w-4 h-4 border-t-4 border-s-4 border-amber-400 rounded-tl" />
                  <span className="absolute -top-1 -end-1 w-4 h-4 border-t-4 border-e-4 border-amber-400 rounded-tr" />
                  <span className="absolute -bottom-1 -start-1 w-4 h-4 border-b-4 border-s-4 border-amber-400 rounded-bl" />
                  <span className="absolute -bottom-1 -end-1 w-4 h-4 border-b-4 border-e-4 border-amber-400 rounded-br" />

                  {/* Animated Red Scanning Line */}
                  <div className="w-full h-0.5 bg-rose-500/90 shadow-[0_0_12px_rgba(244,63,94,1)] animate-bounce" style={{ marginTop: '45%' }} />
                </div>
                <div className="absolute bottom-3 bg-black/60 backdrop-blur-xs text-white text-[11px] font-mono px-3 py-1 rounded-full border border-white/10">
                  ضع باركود أو رمز QR الفاتورة داخل الإطار
                </div>
              </div>
            )}

            {/* Success Overlay on Detection */}
            {matchedSale && (
              <div className="absolute inset-0 bg-emerald-950/90 backdrop-blur-xs flex flex-col items-center justify-center text-white p-4 text-center animate-in zoom-in-95">
                <div className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center mb-3 shadow-lg shadow-emerald-500/40 animate-pulse">
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-base font-black">تم العثور على الفاتورة بنجاح!</h4>
                <p className="font-mono text-xs text-emerald-200 mt-1">#{matchedSale.invoiceNumber}</p>
                <span className="text-[11px] text-emerald-300 mt-0.5">
                  جاري فتح تفاصيل الفاتورة وتحديد الأصناف...
                </span>
              </div>
            )}

            {/* Error or Camera Inactive State */}
            {!isCameraActive && !matchedSale && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-slate-400 bg-slate-900/90">
                <VideoOff className="w-10 h-10 mb-2 text-slate-500" />
                <p className="text-xs font-bold text-slate-300 mb-1">الكاميرا متوقفة حالياً</p>
                <p className="text-[11px] text-slate-400 mb-3 max-w-xs">
                  يمكنك إعادة تشغيل الكاميرا أو كتابة/مسح رقم الفاتورة باستخدام القارئ اليدوي أدناه
                </p>
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>إعادة تشغيل الكاميرا</span>
                </button>
              </div>
            )}
          </div>

          {/* Camera Error Message */}
          {cameraError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-2 text-rose-700 dark:text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">{cameraError}</p>
              </div>
            </div>
          )}

          {/* Handheld Barcode Gun / Manual Invoice Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <BarcodeIcon className="w-4 h-4 text-amber-500" />
                <span>قارئ الباركود اليدوي USB أو البحث المباشر:</span>
              </label>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                جاهز للمسح الفوري
              </span>
            </div>

            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  ref={manualInputRef}
                  type="text"
                  value={manualCode}
                  onChange={e => setManualCode(e.target.value)}
                  placeholder="امسح بقارئ الباركود أو اكتب رقم الفاتورة (مثال: INV-20260831-0001)..."
                  className="w-full pl-3 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-mono font-bold text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500"
                />
                <Search className="w-4 h-4 text-slate-400 absolute start-3 top-3.5" />
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all shrink-0"
              >
                جلب الفاتورة
              </button>
            </form>
          </div>

          {/* Quick Demo Invoices for Instant Verification */}
          <div>
            <span className="text-[10px] font-bold text-slate-400 block mb-1">
              فواتير جاهزة للاختبار الفوري:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {sales.slice(0, 4).map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleProcessBarcode(s.invoiceNumber)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-600 text-[11px] font-mono text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  {s.invoiceNumber}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
