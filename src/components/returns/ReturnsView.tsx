import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Sale, SaleItem, Refund } from '../../types';
import {
  RotateCcw,
  Search,
  CheckCircle2,
  AlertCircle,
  Package,
  Calendar,
  DollarSign,
  User,
  History,
  ScanBarcode,
  Camera,
  Printer,
  X,
  Check,
  Tag,
  Copy,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Banknote,
  Sparkles,
  AlertTriangle,
  Barcode as BarcodeIcon,
  RefreshCw,
  Eye
} from 'lucide-react';
import { soundEffects } from '../../services/audio';
import { generateBarcodeSvg } from '../../utils/barcodeUtils';
import { InvoiceBarcodeScannerModal } from './InvoiceBarcodeScannerModal';
import { PrintableReturnModal } from './PrintableReturnModal';

export const ReturnsView: React.FC = () => {
  const {
    sales,
    refunds,
    returns,
    processReturn,
    formatCurrency,
    t,
    language,
    settings,
    notify,
    selectedReturnInvoice,
    setSelectedReturnInvoice,
    recordCustomerDebtPayment,
    customers,
    products
  } = useApp();

  const [invoiceQuery, setInvoiceQuery] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Sale | null>(null);
  const [returnItems, setReturnItems] = useState<{ [productId: string]: number }>({});
  const [selectedItemIds, setSelectedItemIds] = useState<{ [productId: string]: boolean }>({});
  const [reason, setReason] = useState('رغبة العميل');
  const [customReason, setCustomReason] = useState('');
  const [restock, setRestock] = useState(true);
  const [refundMethod, setRefundMethod] = useState<'cash' | 'card' | 'credit_debt'>('cash');

  // Modals state
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [isReturnReceiptOpen, setIsReturnReceiptOpen] = useState(false);
  const [activeRefundForPrint, setActiveRefundForPrint] = useState<any>(null);
  const [copiedInvoice, setCopiedInvoice] = useState(false);
  const [lastScannedItemBanner, setLastScannedItemBanner] = useState<{
    name: string;
    code: string;
    qty: number;
  } | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus search input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // Auto-dismiss scanned item alert banner
  useEffect(() => {
    if (!lastScannedItemBanner) return;
    const timer = setTimeout(() => setLastScannedItemBanner(null), 3000);
    return () => clearTimeout(timer);
  }, [lastScannedItemBanner]);

  // Check if an invoice was passed via navigation (e.g. from InvoicesView)
  useEffect(() => {
    if (selectedReturnInvoice) {
      loadInvoiceForReturn(selectedReturnInvoice);
      setSelectedReturnInvoice(null);
    }
  }, [selectedReturnInvoice]);

  // Load an invoice into the return work area
  const loadInvoiceForReturn = (sale: Sale) => {
    setSelectedInvoice(sale);
    setInvoiceQuery(sale.invoiceNumber);

    // Calculate previously returned quantities for items in this sale
    const prevReturnsForSale = (refunds || []).filter(r => r.originalSaleId === sale.id);
    const initialReturnQuantities: { [productId: string]: number } = {};
    const initialSelected: { [productId: string]: boolean } = {};

    sale.items.forEach(item => {
      const previouslyReturned = prevReturnsForSale.reduce((acc, r) => {
        const matching = (r.items || []).find(it => it.productId === item.productId);
        return acc + (matching ? matching.quantity : 0);
      }, 0);

      const availableQty = Math.max(0, item.quantity - previouslyReturned);

      // Default: If available > 0, select by default with 1 or availableQty
      if (availableQty > 0) {
        initialReturnQuantities[item.productId] = availableQty;
        initialSelected[item.productId] = true;
      } else {
        initialReturnQuantities[item.productId] = 0;
        initialSelected[item.productId] = false;
      }
    });

    setReturnItems(initialReturnQuantities);
    setSelectedItemIds(initialSelected);

    // If the original sale was on credit and customer has debt, suggest debt deduction
    const cust = customers.find(c => c.id === sale.customerId);
    if (sale.paymentMethod === 'credit' || (cust && (cust.currentDebt || 0) > 0)) {
      setRefundMethod('credit_debt');
    } else {
      setRefundMethod('cash');
    }

    soundEffects.playClick();
  };

  // Global hardware barcode scanner reader (USB / Bluetooth / Wireless gun)
  useEffect(() => {
    let scanBuffer = '';
    let lastKeyTime = 0;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if a modal is open or typing in textarea
      const target = e.target as HTMLElement | null;
      const isEditingTextarea = target && target.tagName === 'TEXTAREA';
      if (isScannerModalOpen || isReturnReceiptOpen || isEditingTextarea) return;

      const currentTime = Date.now();
      const isFast = (currentTime - lastKeyTime) < 80;
      lastKeyTime = currentTime;

      if (e.key === 'Enter') {
        const candidate = (scanBuffer.trim() || invoiceQuery.trim());
        if (candidate.length >= 2) {
          const clean = candidate.toLowerCase();

          // 1. Check if candidate matches an invoice barcode or QR payload
          let targetInv = clean;
          if (clean.startsWith('{') && clean.endsWith('}')) {
            try {
              const parsed = JSON.parse(candidate);
              if (parsed.inv || parsed.invoiceNumber) {
                targetInv = String(parsed.inv || parsed.invoiceNumber).toLowerCase();
              }
            } catch {}
          }

          const matchedSale = sales.find(s =>
            s.invoiceNumber.toLowerCase() === targetInv ||
            s.id.toLowerCase() === targetInv ||
            s.invoiceNumber.toLowerCase() === clean
          );

          if (matchedSale) {
            e.preventDefault();
            soundEffects.playSuccess();
            scanBuffer = '';
            setInvoiceQuery(matchedSale.invoiceNumber);
            loadInvoiceForReturn(matchedSale);
            notify('تم مسح باركود فاتورة بنجاح!', `فاتورة #${matchedSale.invoiceNumber} للعميل ${matchedSale.customerName || 'نقدي'}`, 'success');
            return;
          }

          // 2. If an invoice is ALREADY loaded, check if scanned barcode matches an item in this invoice!
          if (selectedInvoice) {
            const matchedItem = selectedInvoice.items.find(it => {
              if (it.barcode && it.barcode.toLowerCase() === clean) return true;
              if (it.productId.toLowerCase() === clean) return true;
              const prod = products.find(p => p.id === it.productId);
              if (prod) {
                if (prod.barcode && prod.barcode.toLowerCase() === clean) return true;
                if (prod.sku && prod.sku.toLowerCase() === clean) return true;
                if (prod.identificationCodes?.some(c => c.toLowerCase() === clean)) return true;
              }
              return false;
            });

            if (matchedItem) {
              e.preventDefault();
              soundEffects.playBeep();

              // Compute available qty for this item
              const prevReturnsForSale = (refunds || []).filter(r => r.originalSaleId === selectedInvoice.id);
              const previouslyReturned = prevReturnsForSale.reduce((acc, r) => {
                const matching = (r.items || []).find(it => it.productId === matchedItem.productId);
                return acc + (matching ? matching.quantity : 0);
              }, 0);
              const maxAvailable = Math.max(0, itemAvailableQtyFor(selectedInvoice, matchedItem));

              if (maxAvailable <= 0) {
                notify('تنبيه', `الصنف "${matchedItem.productNameAr}" تم استرجاعه بالكامل مسبقاً!`, 'warning');
              } else {
                setSelectedItemIds(prev => ({ ...prev, [matchedItem.productId]: true }));
                setReturnItems(prev => {
                  const current = prev[matchedItem.productId] || 0;
                  const nextVal = Math.min(maxAvailable, current + 1);
                  setLastScannedItemBanner({
                    name: matchedItem.productNameAr,
                    code: candidate,
                    qty: nextVal
                  });
                  return { ...prev, [matchedItem.productId]: nextVal };
                });
                notify('تم تحديد صنف بالباركود', `${matchedItem.productNameAr} (الكمية: +1)`, 'info');
              }
              scanBuffer = '';
              return;
            } else {
              notify('تنبيه', `الصنف ذو الباركود "${candidate}" غير موجود ضمن أصناف هذه الفاتورة!`, 'warning');
            }
          }
        }
        scanBuffer = '';
      } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        if (isFast || scanBuffer.length > 0) {
          scanBuffer += e.key;
        } else {
          scanBuffer = e.key;
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [sales, selectedInvoice, isScannerModalOpen, isReturnReceiptOpen, invoiceQuery, refunds]);

  const itemAvailableQtyFor = (inv: Sale, item: SaleItem) => {
    const prevReturnsForSale = (refunds || []).filter(r => r.originalSaleId === inv.id);
    const previouslyReturned = prevReturnsForSale.reduce((acc, r) => {
      const matching = (r.items || []).find(it => it.productId === item.productId);
      return acc + (matching ? matching.quantity : 0);
    }, 0);
    return Math.max(0, item.quantity - previouslyReturned);
  };

  // Search by text / barcode input
  const handleSearchInvoice = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = invoiceQuery.trim();
    if (!clean) return;

    // Check JSON QR payload
    let targetQuery = clean;
    if (clean.startsWith('{') && clean.endsWith('}')) {
      try {
        const parsed = JSON.parse(clean);
        if (parsed.inv || parsed.invoiceNumber) {
          targetQuery = parsed.inv || parsed.invoiceNumber;
        }
      } catch {}
    }

    const found = sales.find(s => 
      s.invoiceNumber.toLowerCase() === targetQuery.toLowerCase() ||
      s.id.toLowerCase() === targetQuery.toLowerCase()
    );

    if (found) {
      soundEffects.playSuccess();
      loadInvoiceForReturn(found);
      notify('تم العثور على الفاتورة', `#${found.invoiceNumber}`, 'success');
    } else {
      soundEffects.playWarning();
      notify('غير موجود', `لم يتم العثور على فاتورة بالرقم "${targetQuery}"`, 'warning');
    }
  };

  // Hardware Scanner detection on search input
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearchInvoice();
    }
  };

  // Stepper quantity update for a specific item
  const handleQuantityChange = (productId: string, val: number, maxAvailable: number) => {
    const clamped = Math.max(0, Math.min(maxAvailable, val));
    setReturnItems(prev => ({
      ...prev,
      [productId]: clamped,
    }));

    // Auto-update selection checkbox
    setSelectedItemIds(prev => ({
      ...prev,
      [productId]: clamped > 0,
    }));
  };

  // Toggle selection checkbox for an item
  const handleToggleItemSelection = (productId: string, maxAvailable: number) => {
    const currentlySelected = !!selectedItemIds[productId];
    const nextSelected = !currentlySelected;

    setSelectedItemIds(prev => ({
      ...prev,
      [productId]: nextSelected,
    }));

    setReturnItems(prev => ({
      ...prev,
      [productId]: nextSelected ? (prev[productId] > 0 ? prev[productId] : maxAvailable) : 0,
    }));
  };

  // Quick batch actions
  const handleSelectAll = () => {
    if (!selectedInvoice) return;
    const prevReturnsForSale = (refunds || []).filter(r => r.originalSaleId === selectedInvoice.id);

    const updatedQty: { [productId: string]: number } = {};
    const updatedSelected: { [productId: string]: boolean } = {};

    selectedInvoice.items.forEach(item => {
      const previouslyReturned = prevReturnsForSale.reduce((acc, r) => {
        const matching = (r.items || []).find(it => it.productId === item.productId);
        return acc + (matching ? matching.quantity : 0);
      }, 0);
      const availableQty = Math.max(0, item.quantity - previouslyReturned);

      if (availableQty > 0) {
        updatedQty[item.productId] = availableQty;
        updatedSelected[item.productId] = true;
      } else {
        updatedQty[item.productId] = 0;
        updatedSelected[item.productId] = false;
      }
    });

    setReturnItems(updatedQty);
    setSelectedItemIds(updatedSelected);
    soundEffects.playClick();
  };

  const handleDeselectAll = () => {
    if (!selectedInvoice) return;
    const updatedQty: { [productId: string]: number } = {};
    const updatedSelected: { [productId: string]: boolean } = {};

    selectedInvoice.items.forEach(item => {
      updatedQty[item.productId] = 0;
      updatedSelected[item.productId] = false;
    });

    setReturnItems(updatedQty);
    setSelectedItemIds(updatedSelected);
    soundEffects.playClick();
  };

  // Compute previously returned summary for this invoice
  const previousReturns = selectedInvoice 
    ? (refunds || []).filter(r => r.originalSaleId === selectedInvoice.id)
    : [];

  const totalPreviouslyReturnedAmount = previousReturns.reduce((acc, r) => acc + (r.totalRefundAmount || 0), 0);

  // Compute available returnable quantity for a specific item
  const getItemAvailableQty = (item: SaleItem): number => {
    if (!selectedInvoice) return item.quantity;
    const previouslyReturned = previousReturns.reduce((acc, r) => {
      const matching = (r.items || []).find(it => it.productId === item.productId);
      return acc + (matching ? matching.quantity : 0);
    }, 0);
    return Math.max(0, item.quantity - previouslyReturned);
  };

  // Compute live refund total
  const calculateRefundTotal = () => {
    if (!selectedInvoice) return 0;
    let sum = 0;
    selectedInvoice.items.forEach(it => {
      const isSelected = selectedItemIds[it.productId];
      const qty = returnItems[it.productId] || 0;
      if (isSelected && qty > 0) {
        sum += it.unitPrice * qty;
      }
    });
    return sum;
  };

  const refundTotal = calculateRefundTotal();
  const selectedItemsCount = selectedInvoice 
    ? selectedInvoice.items.filter(it => selectedItemIds[it.productId] && (returnItems[it.productId] || 0) > 0).length
    : 0;

  // Process and finalize return
  const handleConfirmReturn = () => {
    if (!selectedInvoice) return;

    const itemsToReturn: SaleItem[] = [];
    selectedInvoice.items.forEach(it => {
      const isSelected = selectedItemIds[it.productId];
      const qty = returnItems[it.productId] || 0;
      if (isSelected && qty > 0) {
        itemsToReturn.push({
          ...it,
          quantity: qty,
          total: it.unitPrice * qty,
        });
      }
    });

    if (itemsToReturn.length === 0) {
      soundEffects.playWarning();
      notify('تنبيه', 'يرجى تحديد صنف واحد على الأقل مع كمية للإرجاع', 'warning');
      return;
    }

    const effectiveReason = reason === 'أخرى' && customReason ? customReason : reason;

    const ret = processReturn({
      originalSaleId: selectedInvoice.id,
      items: itemsToReturn.map(it => ({
        productId: it.productId,
        productNameAr: it.productNameAr,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        total: it.total,
      })),
      reason: effectiveReason,
      restockItems: restock,
    });

    if (ret) {
      // If customer has debt and chose to deduct refund from debt
      if (refundMethod === 'credit_debt' && selectedInvoice.customerId) {
        const cust = customers.find(c => c.id === selectedInvoice.customerId);
        if (cust) {
          recordCustomerDebtPayment(
            cust.id,
            ret.totalRefund,
            'cash',
            `خصم مرتجع فاتورة رقم ${ret.returnNumber || ret.refundNumber} من رصيد الدين`
          );
        }
      }

      soundEffects.playSuccess();
      notify('تم تسجيل المرتجع بنجاح', `رقم الإشعار: ${ret.returnNumber || ret.refundNumber} بقيمة ${formatCurrency(ret.totalRefund)}`, 'success');

      // Prepare return voucher for printing
      setActiveRefundForPrint({
        ...ret,
        refundMethod,
      });
      setIsReturnReceiptOpen(true);

      // Reset form
      setSelectedInvoice(null);
      setInvoiceQuery('');
      setReturnItems({});
      setSelectedItemIds({});
    }
  };

  const handleCopyInvoiceNumber = () => {
    if (!selectedInvoice) return;
    navigator.clipboard.writeText(selectedInvoice.invoiceNumber);
    setCopiedInvoice(true);
    setTimeout(() => setCopiedInvoice(false), 1500);
  };

  return (
    <div className="flex-1 p-3 sm:p-6 overflow-y-auto space-y-5 bg-slate-50/50 dark:bg-slate-950 max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <RotateCcw className="w-6 h-6 text-rose-600" />
            <span>{t('returnsTitle')}</span>
            <span className="text-xs bg-rose-500/10 text-rose-700 dark:text-rose-400 font-bold px-2.5 py-0.5 rounded-full border border-rose-500/20 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-rose-500" />
              ربط المرتجعات بالباركود
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            مسح باركود الفاتورة الأصلية، استرجاع تفاصيل البيع، واختيار العناصر المراد إرجاعها فقط لتسريع المرتجعات
          </p>
        </div>

        {/* Scan Barcode Action Button */}
        <button
          onClick={() => setIsScannerModalOpen(true)}
          className="px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <Camera className="w-5 h-5" />
          <span>مسح باركود الفاتورة بالكاميرا</span>
        </button>
      </div>

      {/* Scanned Item Feedback Banner */}
      {lastScannedItemBanner && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 p-3 rounded-2xl flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <div>
              <span className="font-bold text-xs">تم رصد الصنف بالباركود وإضافته للمرتجع:</span>
              <p className="text-xs font-black">{lastScannedItemBanner.name} (الكمية المحددة: {lastScannedItemBanner.qty})</p>
            </div>
          </div>
          <button
            onClick={() => setLastScannedItemBanner(null)}
            className="p-1 rounded-lg text-emerald-600 hover:bg-emerald-500/20"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Invoice Search & Scanner Input Card */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <BarcodeIcon className="w-4 h-4 text-amber-500" />
            <span>البحث برقم الفاتورة أو مسح الباركود المطبوع على الإيصال:</span>
          </label>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            يدعم قارئ الباركود اليدوي USB والكاميرا
          </span>
        </div>

        <form onSubmit={handleSearchInvoice} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <input
              ref={searchInputRef}
              type="text"
              value={invoiceQuery}
              onChange={e => setInvoiceQuery(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="امسح بالباركود أو اكتب رقم الفاتورة (مثال: INV-20260831-0001)..."
              className="w-full pl-3 pr-10 py-3 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-mono font-bold text-slate-900 dark:text-white rounded-2xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            />
            <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-3.5" />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 sm:flex-initial px-5 py-3 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs rounded-2xl shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <Search className="w-4 h-4" />
              <span>جلب تفاصيل الفاتورة</span>
            </button>

            <button
              type="button"
              onClick={() => setIsScannerModalOpen(true)}
              className="px-4 py-3 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-bold text-xs rounded-2xl border border-amber-200 dark:border-amber-800/60 active:scale-95 transition-all flex items-center justify-center gap-1.5"
              title="فتح ماسح الباركود بالكاميرا"
            >
              <ScanBarcode className="w-4 h-4" />
              <span className="hidden sm:inline">الكاميرا</span>
            </button>
          </div>
        </form>

        {/* Quick Demo Invoices Bar */}
        <div className="pt-1 flex items-center flex-wrap gap-2 text-xs">
          <span className="text-[11px] font-bold text-slate-400">فواتير سريعة للتجربة:</span>
          {sales.slice(0, 4).map(s => (
            <button
              key={s.id}
              type="button"
              onClick={() => loadInvoiceForReturn(s)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-mono border transition-all flex items-center gap-1 ${
                selectedInvoice?.id === s.id
                  ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              <span>{s.invoiceNumber}</span>
              <span className="opacity-75 text-[10px]">({formatCurrency(s.total)})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Selected Invoice Return Studio */}
      {selectedInvoice && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden space-y-4 animate-in fade-in">
          {/* Invoice Header Card */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 to-amber-50/30 dark:from-slate-800/80 dark:to-slate-800/40 border-b border-slate-200/90 dark:border-slate-800">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    فاتورة أصلية موثقة
                  </span>
                  <span className="font-mono font-black text-slate-900 dark:text-white text-base sm:text-lg">
                    #{selectedInvoice.invoiceNumber}
                  </span>
                  <button
                    onClick={handleCopyInvoiceNumber}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    title="نسخ رقم الفاتورة"
                  >
                    {copiedInvoice ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  {/* Visual SVG Barcode */}
                  <div
                    className="hidden sm:inline-block bg-white px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs"
                    dangerouslySetInnerHTML={{
                      __html: generateBarcodeSvg(selectedInvoice.invoiceNumber, {
                        width: 130,
                        height: 24,
                        fontSize: 8,
                        showText: false,
                        barColor: '#000000',
                        bgColor: '#ffffff'
                      })
                    }}
                  />
                </div>

                {/* Metadata Grid */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    العميل: <strong className="text-slate-900 dark:text-white">{selectedInvoice.customerName || 'عميل نقدي'}</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    التاريخ: <span className="font-mono">{new Date(selectedInvoice.createdAt).toLocaleString(language === 'ar' ? 'ar-SY' : 'en-US')}</span>
                  </span>
                  <span>
                    الكاشير: <strong>{selectedInvoice.cashierName}</strong>
                  </span>
                  <span>
                    طريقة الدفع: <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[10px] font-bold">{selectedInvoice.paymentMethod}</span>
                  </span>
                  {selectedInvoice.tradeType && (
                    <span className="text-amber-600 dark:text-amber-400 font-bold">
                      ({selectedInvoice.tradeType === 'wholesale' ? 'تجارة جملة' : 'بيع مفرق'})
                    </span>
                  )}
                </div>
              </div>

              {/* Financial Totals Pill */}
              <div className="flex items-center gap-4 bg-white dark:bg-slate-900/90 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs self-start lg:self-auto">
                <div className="text-end">
                  <span className="text-[10px] text-slate-400 block font-semibold">إجمالي الفاتورة الأصلية</span>
                  <span className="text-base sm:text-lg font-black font-mono text-slate-900 dark:text-white">
                    {formatCurrency(selectedInvoice.total)}
                  </span>
                </div>
                <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
                <div className="text-end">
                  <span className="text-[10px] text-slate-400 block font-semibold">الأصناف المشتراة</span>
                  <span className="text-base font-bold font-mono text-amber-600 dark:text-amber-400">
                    {selectedInvoice.items.length} صنف
                  </span>
                </div>
              </div>
            </div>

            {/* Previous Returns Notice Banner */}
            {previousReturns.length > 0 && (
              <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-bold">
                    تنبيه: تمت معالجة {previousReturns.length} عملية إرجاع سابقة لهذه الفاتورة بإجمالي مسترد {formatCurrency(totalPreviouslyReturnedAmount)}.
                  </p>
                  <p className="text-[11px] opacity-90 mt-0.5">
                    الكميات المتاحة للإرجاع في الجدول أدناه محسوبة تلقائياً بخصم ما تم إرجاعه مسبقاً لحماية الحسابات.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Selective Items Table Card */}
          <div className="p-4 sm:p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>اختيار العناصر المراد إرجاعها فقط</span>
                  <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full font-bold">
                    محدد: {selectedItemsCount} من {selectedInvoice.items.length}
                  </span>
                </h4>
                <p className="text-xs text-slate-500">
                  حدد الصنف واضبط الكمية المراد إرجاعها بدقة عبر مفاتيح اللمس السريعة
                </p>
              </div>

              {/* Quick Batch Buttons */}
              <div className="flex items-center gap-1.5 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 text-xs font-bold transition-all border border-amber-200 dark:border-amber-800/40 flex items-center gap-1"
                  title="تحديد كامل كميات الفاتورة المتاحة للإرجاع"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>تحديد الكل (كامل الفاتورة)</span>
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all"
                  title="إلغاء التحديد لاختيار أصناف معينة فقط"
                >
                  إلغاء التحديد (لاختيار مفرد)
                </button>
              </div>
            </div>

            {/* Items List */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-start text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold">
                      <th className="py-3 px-3 text-center w-12">تحديد</th>
                      <th className="py-3 px-3 text-start">الصنف</th>
                      <th className="py-3 px-2 text-center">الكمية الأصلية</th>
                      <th className="py-3 px-2 text-center">المتاح للإرجاع</th>
                      <th className="py-3 px-3 text-end">سعر الوحدة</th>
                      <th className="py-3 px-3 text-center w-44">كمية المرتجع</th>
                      <th className="py-3 px-4 text-end">مبلغ الاسترداد</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {selectedInvoice.items.map(item => {
                      const maxAvailable = getItemAvailableQty(item);
                      const isSelected = !!selectedItemIds[item.productId];
                      const currentQty = returnItems[item.productId] || 0;
                      const lineRefund = item.unitPrice * (isSelected ? currentQty : 0);
                      const isFullyReturned = maxAvailable <= 0;

                      return (
                        <tr
                          key={item.productId}
                          className={`transition-colors ${
                            isFullyReturned
                              ? 'bg-slate-50/50 dark:bg-slate-900/30 opacity-60'
                              : isSelected
                              ? 'bg-amber-50/40 dark:bg-amber-950/20'
                              : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/30'
                          }`}
                        >
                          {/* Selection Checkbox */}
                          <td className="py-3 px-3 text-center">
                            <input
                              type="checkbox"
                              disabled={isFullyReturned}
                              checked={isSelected}
                              onChange={() => handleToggleItemSelection(item.productId, maxAvailable)}
                              className="w-5 h-5 accent-amber-500 rounded-lg cursor-pointer disabled:cursor-not-allowed"
                            />
                          </td>

                          {/* Product Info */}
                          <td className="py-3 px-3">
                            <span className="font-bold text-slate-900 dark:text-white block">
                              {item.productNameAr}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              باركود: {item.barcode || '—'}
                            </span>
                          </td>

                          {/* Original Purchased Qty */}
                          <td className="py-3 px-2 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                            {item.quantity}
                          </td>

                          {/* Available to Return */}
                          <td className="py-3 px-2 text-center">
                            {isFullyReturned ? (
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500">
                                مرتجع بالكامل
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-mono font-bold text-xs">
                                {maxAvailable} قطع
                              </span>
                            )}
                          </td>

                          {/* Unit Price */}
                          <td className="py-3 px-3 text-end font-mono text-slate-600 dark:text-slate-400">
                            {formatCurrency(item.unitPrice)}
                          </td>

                          {/* Stepper Controls (Large Touch-Friendly) */}
                          <td className="py-3 px-3 text-center">
                            {isFullyReturned ? (
                              <span className="text-[11px] text-slate-400 font-semibold">—</span>
                            ) : (
                              <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
                                <button
                                  type="button"
                                  disabled={currentQty <= 0}
                                  onClick={() => handleQuantityChange(item.productId, currentQty - 1, maxAvailable)}
                                  className="w-9 h-9 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-black text-sm flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-600 active:scale-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min={0}
                                  max={maxAvailable}
                                  value={currentQty}
                                  onChange={e => handleQuantityChange(item.productId, parseInt(e.target.value) || 0, maxAvailable)}
                                  className="w-12 text-center font-mono font-black text-sm text-slate-900 dark:text-white bg-transparent focus:outline-none"
                                />
                                <button
                                  type="button"
                                  disabled={currentQty >= maxAvailable}
                                  onClick={() => handleQuantityChange(item.productId, currentQty + 1, maxAvailable)}
                                  className="w-9 h-9 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-black text-sm flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-600 active:scale-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                                >
                                  +
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleQuantityChange(item.productId, maxAvailable, maxAvailable)}
                                  className="px-2 py-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-400 font-bold text-[10px] rounded-lg transition-colors ms-0.5"
                                  title="إرجاع كامل الكمية المتاحة لهذا الصنف"
                                >
                                  الكل
                                </button>
                              </div>
                            )}
                          </td>

                          {/* Line Refund Total */}
                          <td className="py-3 px-4 text-end font-mono font-black text-rose-600 dark:text-rose-400 text-sm">
                            {formatCurrency(lineRefund)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Return Settings, Reason & Payout Method */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              {/* Return Reason */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  سبب الإرجاع:
                </label>
                <select
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="w-full text-xs font-bold px-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500"
                >
                  <option value="رغبة العميل">رغبة العميل (تغيير رأي)</option>
                  <option value="منتج به عيب تصنيع أو تالف">منتج به عيب تصنيع أو تالف</option>
                  <option value="صنف غير مطابق للطلب أو المقاس">صنف غير مطابق للطلب أو المقاس</option>
                  <option value="انتهاء الصلاحية أو الجودة">انتهاء الصلاحية أو الجودة</option>
                  <option value="أخرى">سبب آخر (تحديد يدوي)</option>
                </select>

                {reason === 'أخرى' && (
                  <input
                    type="text"
                    value={customReason}
                    onChange={e => setCustomReason(e.target.value)}
                    placeholder="اكتب سبب الإرجاع هنا..."
                    className="w-full mt-2 text-xs font-medium px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none"
                  />
                )}
              </div>

              {/* Refund Payout Method */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  طريقة استرداد المبلغ:
                </label>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 cursor-pointer text-xs font-semibold">
                    <input
                      type="radio"
                      name="refundMethod"
                      value="cash"
                      checked={refundMethod === 'cash'}
                      onChange={() => setRefundMethod('cash')}
                      className="accent-amber-500"
                    />
                    <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                    <span>نقداً (Cash Refund)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 cursor-pointer text-xs font-semibold">
                    <input
                      type="radio"
                      name="refundMethod"
                      value="card"
                      checked={refundMethod === 'card'}
                      onChange={() => setRefundMethod('card')}
                      className="accent-amber-500"
                    />
                    <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                    <span>إرجاع للبطاقة / تحويل بنكي</span>
                  </label>

                  {selectedInvoice.customerId && (
                    <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 cursor-pointer text-xs font-semibold">
                      <input
                        type="radio"
                        name="refundMethod"
                        value="credit_debt"
                        checked={refundMethod === 'credit_debt'}
                        onChange={() => setRefundMethod('credit_debt')}
                        className="accent-amber-500"
                      />
                      <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                      <span>خصم من رصيد دين العميل</span>
                    </label>
                  )}
                </div>
              </div>

              {/* Restock & Accounting Checkbox */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  حركة المخزون:
                </label>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      id="restock-checkbox"
                      checked={restock}
                      onChange={e => setRestock(e.target.checked)}
                      className="w-4 h-4 accent-amber-500 rounded mt-0.5"
                    />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      إعادة الأصناف المرتجعة للمخزون تلقائياً (+ زيادة الرصيد)
                    </span>
                  </label>
                  <p className="text-[11px] text-slate-500 ms-6">
                    {restock
                      ? 'سيتم قيد زيادة المخزون تلقائياً في سجلات المستودع'
                      : 'لن يتم إضافة الأصناف للمخزون (للبضائع التالفة)'}
                  </p>
                </div>
              </div>
            </div>

            {/* Refund Total Summary Bar & Confirmation Action */}
            <div className="mt-4 p-4 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs text-slate-400 block">إجمالي المبلغ المسترد للعميل:</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black font-mono text-rose-400">
                    {formatCurrency(refundTotal)}
                  </span>
                  <span className="text-xs text-slate-400">
                    ({selectedItemsCount} أصناف محددة)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedInvoice(null);
                    setReturnItems({});
                    setSelectedItemIds({});
                  }}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all"
                >
                  إلغاء
                </button>

                <button
                  type="button"
                  disabled={refundTotal <= 0}
                  onClick={handleConfirmReturn}
                  className={`flex-1 sm:flex-initial px-6 py-3.5 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 ${
                    refundTotal <= 0
                      ? 'bg-slate-700 text-slate-400 cursor-not-allowed shadow-none'
                      : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30'
                  }`}
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>تأكيد الإرجاع وطباعة الإشعار</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Historical Returns Log Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-4 h-4 text-amber-500" />
            <span>سجل إشعارات المرتجعات السابقة</span>
            <span className="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono px-2 py-0.5 rounded-full font-bold">
              {returns?.length || 0}
            </span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold">
                <th className="pb-2 text-start">رقم المرتجع</th>
                <th className="pb-2 text-start">الفاتورة الأصلية</th>
                <th className="pb-2 text-start">السبب</th>
                <th className="pb-2 text-center">الأصناف المرتجعة</th>
                <th className="pb-2 text-end">مبلغ الاسترداد</th>
                <th className="pb-2 text-center">حالة المخزون</th>
                <th className="pb-2 text-end">التاريخ</th>
                <th className="pb-2 text-end">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {(!returns || returns.length === 0) ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    لا توجد عمليات إرجاع مسجلة بعد
                  </td>
                </tr>
              ) : (
                returns.map((ret: any) => {
                  const rNum = ret.returnNumber || ret.refundNumber || `REF-${ret.id}`;
                  const origInv = ret.originalInvoiceNumber || ret.invoiceNumber || '—';
                  const origSaleMatch = sales.find(s => s.invoiceNumber === origInv || s.id === ret.originalSaleId);

                  return (
                    <tr key={ret.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 font-mono font-bold text-slate-900 dark:text-white">
                        {rNum}
                      </td>
                      <td className="py-3 font-mono font-bold text-amber-600 dark:text-amber-400">
                        {origInv}
                      </td>
                      <td className="py-3 text-slate-700 dark:text-slate-300">
                        {ret.reason || 'إرجاع بضاعة'}
                      </td>
                      <td className="py-3 text-center font-mono">
                        {(ret.items || []).reduce((acc: number, it: any) => acc + (it.quantity || 0), 0)} قطع
                      </td>
                      <td className="py-3 text-end font-mono font-black text-rose-600 dark:text-rose-400">
                        {formatCurrency(ret.totalRefund ?? ret.totalRefundAmount ?? 0)}
                      </td>
                      <td className="py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          ret.restock
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                            : 'bg-rose-500/10 text-rose-700 dark:text-rose-400'
                        }`}>
                          {ret.restock ? 'أعيدت للمخزون' : 'تالف'}
                        </span>
                      </td>
                      <td className="py-3 text-end text-slate-400 font-mono text-[11px]">
                        {ret.createdAt ? new Date(ret.createdAt).toLocaleString(language === 'ar' ? 'ar-SY' : 'en-US') : '—'}
                      </td>
                      <td className="py-3 text-end">
                        <button
                          onClick={() => {
                            setActiveRefundForPrint(ret);
                            setIsReturnReceiptOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-amber-600"
                          title="طباعة إشعار المرتجع"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Barcode Scanner Modal */}
      <InvoiceBarcodeScannerModal
        isOpen={isScannerModalOpen}
        onClose={() => setIsScannerModalOpen(false)}
        onInvoiceMatched={(matchedSale) => {
          loadInvoiceForReturn(matchedSale);
        }}
      />

      {/* Printable Return Voucher Modal */}
      <PrintableReturnModal
        isOpen={isReturnReceiptOpen}
        onClose={() => {
          setIsReturnReceiptOpen(false);
          setActiveRefundForPrint(null);
        }}
        refund={activeRefundForPrint}
        originalSale={
          activeRefundForPrint 
            ? sales.find(s => s.id === activeRefundForPrint.originalSaleId || s.invoiceNumber === activeRefundForPrint.originalInvoiceNumber || s.invoiceNumber === activeRefundForPrint.invoiceNumber) 
            : null
        }
      />
    </div>
  );
};
