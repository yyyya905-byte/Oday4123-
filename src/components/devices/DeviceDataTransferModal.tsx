import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeftRight, 
  Send, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  QrCode, 
  Wifi, 
  Layers, 
  Package, 
  Users, 
  Receipt, 
  Settings, 
  ShieldCheck, 
  RefreshCw, 
  Smartphone, 
  Laptop, 
  Tablet, 
  Database, 
  Sparkles, 
  X,
  Radio,
  ArrowRight,
  Info,
  FileText,
  Share2,
  Trash2,
  CheckCircle
} from 'lucide-react';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import { indexedDbService, DeviceTransferPackage } from '../../services/indexedDbService';
import { Product, Category, Customer, Sale, StoreSettings, SavedSyncPartner } from '../../types';
import { normalizeArabicDigits } from '../../utils/barcodeUtils';

interface DeviceDataTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'send' | 'receive' | 'partner_sync';
}

export const DeviceDataTransferModal: React.FC<DeviceDataTransferModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'send',
}) => {
  const { 
    products, 
    categories, 
    customers, 
    sales, 
    debtTransactions,
    expenses,
    refunds,
    vehicleManifests,
    settings, 
    devices,
    notify,
    t,
    isOnline,
    saveSyncPartner,
    removeSyncPartner,
    performPartnerSync,
    isSyncingWithPartner,
    updateSettings
  } = useApp();

  const [activeTab, setActiveTab] = useState<'send' | 'receive' | 'partner_sync'>(defaultTab);

  // SEND STATE
  const [includeProducts, setIncludeProducts] = useState(true);
  const [includeCategories, setIncludeCategories] = useState(true);
  const [includeCustomers, setIncludeCustomers] = useState(true);
  const [includeSales, setIncludeSales] = useState(true);
  const [includeDocuments, setIncludeDocuments] = useState(true);
  const [includeSettings, setIncludeSettings] = useState(true);
  const [saveAsPartnerOnSend, setSaveAsPartnerOnSend] = useState(true);

  const [transferCode, setTransferCode] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [transferStatus, setTransferStatus] = useState<'idle' | 'waiting' | 'confirmed'>('idle');
  const [confirmedReceiverName, setConfirmedReceiverName] = useState('');

  // RECEIVE STATE
  const [inputCode, setInputCode] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [fetchedPackage, setFetchedPackage] = useState<DeviceTransferPackage | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [mergeStrategy, setMergeStrategy] = useState<'merge' | 'overwrite'>('merge');
  const [isApplying, setIsApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);
  const [saveAsPartnerOnReceive, setSaveAsPartnerOnReceive] = useState(true);

  // PARTNER SYNC STATE
  const [partnerPairingKeyInput, setPartnerPairingKeyInput] = useState('');
  const [partnerDeviceNameInput, setPartnerDeviceNameInput] = useState('');
  const [isPushingToPartner, setIsPushingToPartner] = useState(false);
  const [partnerPushSuccess, setPartnerPushSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
      setFetchError(null);
      setApplySuccess(false);
      if (settings.savedSyncPartner) {
        setPartnerPairingKeyInput(settings.savedSyncPartner.pairingKey);
        setPartnerDeviceNameInput(settings.savedSyncPartner.deviceName);
      }
    }
  }, [isOpen, defaultTab, settings.savedSyncPartner]);

  // Listen to SSE events for live confirmation when recipient enters code
  useEffect(() => {
    if (!transferCode || transferStatus !== 'waiting') return;

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/devices/stream');
      eventSource.onmessage = (e) => {
        try {
          const eventData = JSON.parse(e.data);
          if (
            eventData.type === 'DATA_TRANSFER_CONFIRMED' && 
            eventData.payload?.transferCode === transferCode
          ) {
            setTransferStatus('confirmed');
            setConfirmedReceiverName(eventData.payload?.receiverDeviceName || 'جهاز فرعي');
            try {
              confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
            } catch {}
          }
        } catch {}
      };
    } catch {}

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [transferCode, transferStatus]);

  if (!isOpen) return null;

  // Handle generating 6-digit transfer package
  const handleGenerateTransfer = async () => {
    setIsGenerating(true);
    setTransferStatus('idle');

    try {
      // 1. Generate clean 6-digit numeric PIN
      const generatedPin = Math.floor(100000 + Math.random() * 900000).toString();
      
      // 2. Prepare payload
      const payloadData: any = {};
      if (includeProducts) payloadData.products = products;
      if (includeCategories) payloadData.categories = categories;
      if (includeCustomers) payloadData.customers = customers;
      if (includeSales) payloadData.sales = sales;
      if (includeDocuments) {
        payloadData.debtTransactions = debtTransactions;
        payloadData.expenses = expenses;
        payloadData.refunds = refunds;
        payloadData.vehicleManifests = vehicleManifests;
      }
      if (includeSettings) payloadData.settings = settings;

      const docsCount = includeDocuments ? (debtTransactions.length + expenses.length + refunds.length + vehicleManifests.length) : 0;

      const summary = {
        productsCount: includeProducts ? products.length : 0,
        categoriesCount: includeCategories ? categories.length : 0,
        customersCount: includeCustomers ? customers.length : 0,
        salesCount: includeSales ? sales.length : 0,
        documentsCount: docsCount,
        hasSettings: includeSettings,
      };

      const storeTitle = settings.storeNameAr || settings.storeNameEn || 'كاشير كيان';
      const deviceName = `${storeTitle} (${window.navigator.platform || 'POS'})`;

      // 3. Save to local IndexedDB
      const localPkg: DeviceTransferPackage = {
        transferCode: generatedPin,
        senderDeviceName: deviceName,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        transferType: 'all',
        summary,
        data: payloadData,
        notes: 'حزمة نقل بيانات نقطة البيع عبر رمز الربط'
      };
      await indexedDbService.saveDeviceTransfer(localPkg);

      // 4. If online, stage on server API
      if (navigator.onLine) {
        try {
          await fetch('/api/devices/transfer/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              transferCode: generatedPin,
              senderDeviceName: deviceName,
              summary,
              data: payloadData,
            })
          });

          // Also register persistent partner channel if auto-sync partner is desired
          if (saveAsPartnerOnSend) {
            await fetch('/api/devices/partner/push', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                channelId: generatedPin,
                senderDeviceName: deviceName,
                summary,
                data: payloadData,
              })
            });
          }
        } catch (serverErr) {
          console.warn('Server transfer staging fallback:', serverErr);
        }
      }

      // 5. Generate QR Code for easy camera scanning
      const qrPayload = JSON.stringify({
        kian_transfer_code: generatedPin,
        app: 'kian-cashier',
        timestamp: Date.now()
      });
      const qrData = await QRCode.toDataURL(qrPayload, {
        width: 260,
        margin: 2,
        color: { dark: '#090d16', light: '#ffffff' }
      });

      setTransferCode(generatedPin);
      setQrCodeDataUrl(qrData);
      setTransferStatus('waiting');
      notify('تم إنشاء رمز النقل', `رمز الربط هو ${generatedPin}. أدخله في الجهاز الآخر لنقل البيانات فوراً.`, 'success');
    } catch (err: any) {
      notify('تعذر إنشاء حزمة النقل', err.message || 'حدث خطأ غير متوقع', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy code to clipboard
  const handleCopyCode = () => {
    if (!transferCode) return;
    navigator.clipboard.writeText(transferCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    notify('تم النسخ', 'تم نسخ رمز الربط إلى الحافظة', 'info');
  };

  // Handle Fetching Package using 6-digit code on recipient device
  const handleFetchPackage = async (codeToFetch?: string) => {
    const raw = codeToFetch || inputCode;
    const code = normalizeArabicDigits(raw).toUpperCase();
    if (!code || code.length < 4) {
      setFetchError('يرجى إدخال رمز ربط صحيح مكون من 6 أرقام');
      return;
    }

    setIsFetching(true);
    setFetchError(null);
    setFetchedPackage(null);

    try {
      // 1. Try fetching from server first if online
      if (navigator.onLine) {
        try {
          const res = await fetch(`/api/devices/transfer/fetch/${encodeURIComponent(code)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.package) {
              setFetchedPackage(data.package);
              setIsFetching(false);
              return;
            }
          }
        } catch (serverErr) {
          console.warn('Server fetch attempt failed, checking IndexedDB:', serverErr);
        }
      }

      // 2. Fallback to local IndexedDB (useful in offline local testing / same browser / mesh)
      const localPkg = await indexedDbService.getDeviceTransfer(code);
      if (localPkg) {
        setFetchedPackage(localPkg);
      } else {
        setFetchError('لم يتم العثور على حزمة بيانات مطابقة لهذا الرمز. تأكد من صحة الرمز المعروض على الجهاز المرسل.');
      }
    } catch (err: any) {
      setFetchError(err.message || 'فشل فحص رمز الربط');
    } finally {
      setIsFetching(false);
    }
  };

  // Apply received package into POS system state and IndexedDB
  const handleApplyData = async () => {
    if (!fetchedPackage || !fetchedPackage.data) return;

    setIsApplying(true);
    try {
      // Create backup before applying
      await indexedDbService.cacheAllData({
        products,
        categories,
        customers,
        sales,
        settings,
      });

      const { data } = fetchedPackage;

      // 1. Products & Categories
      if (data.products && Array.isArray(data.products)) {
        if (mergeStrategy === 'overwrite') {
          localStorage.setItem('kian_pos_products', JSON.stringify(data.products));
          localStorage.setItem('kian_products', JSON.stringify(data.products));
        } else {
          const existingIds = new Set(products.map(p => p.id));
          const existingBarcodes = new Set(products.filter(p => p.barcode).map(p => p.barcode));
          const newProducts = data.products.filter(p => !existingIds.has(p.id) && (!p.barcode || !existingBarcodes.has(p.barcode)));
          const mergedProducts = [...products, ...newProducts];
          localStorage.setItem('kian_pos_products', JSON.stringify(mergedProducts));
          localStorage.setItem('kian_products', JSON.stringify(mergedProducts));
        }
      }

      if (data.categories && Array.isArray(data.categories)) {
        if (mergeStrategy === 'overwrite') {
          localStorage.setItem('kian_pos_categories', JSON.stringify(data.categories));
          localStorage.setItem('kian_categories', JSON.stringify(data.categories));
        } else {
          const existingIds = new Set(categories.map(c => c.id));
          const newCategories = data.categories.filter(c => !existingIds.has(c.id));
          const mergedCategories = [...categories, ...newCategories];
          localStorage.setItem('kian_pos_categories', JSON.stringify(mergedCategories));
          localStorage.setItem('kian_categories', JSON.stringify(mergedCategories));
        }
      }

      // 2. Customers
      if (data.customers && Array.isArray(data.customers)) {
        if (mergeStrategy === 'overwrite') {
          localStorage.setItem('kian_pos_customers', JSON.stringify(data.customers));
          localStorage.setItem('kian_customers', JSON.stringify(data.customers));
        } else {
          const existingPhones = new Set(customers.filter(c => c.phone).map(c => c.phone));
          const existingIds = new Set(customers.map(c => c.id));
          const newCustomers = data.customers.filter(c => !existingIds.has(c.id) && (!c.phone || !existingPhones.has(c.phone)));
          const mergedCustomers = [...customers, ...newCustomers];
          localStorage.setItem('kian_pos_customers', JSON.stringify(mergedCustomers));
          localStorage.setItem('kian_customers', JSON.stringify(mergedCustomers));
        }
      }

      // 3. Sales & Invoices
      if (data.sales && Array.isArray(data.sales) && data.sales.length > 0) {
        if (mergeStrategy === 'overwrite') {
          localStorage.setItem('kian_pos_sales', JSON.stringify(data.sales));
          localStorage.setItem('kian_sales', JSON.stringify(data.sales));
        } else {
          const existingSaleIds = new Set(sales.map(s => s.id));
          const newSales = data.sales.filter(s => !existingSaleIds.has(s.id));
          const mergedSales = [...newSales, ...sales];
          localStorage.setItem('kian_pos_sales', JSON.stringify(mergedSales));
          localStorage.setItem('kian_sales', JSON.stringify(mergedSales));
        }
      }

      // 4. Documents (Debt vouchers, Expenses, Refunds)
      if (data.debtTransactions && Array.isArray(data.debtTransactions)) {
        if (mergeStrategy === 'overwrite') {
          localStorage.setItem('kian_pos_debt_transactions', JSON.stringify(data.debtTransactions));
        } else {
          const existingDebtIds = new Set(debtTransactions.map(d => d.id));
          const newDebts = data.debtTransactions.filter(d => !existingDebtIds.has(d.id));
          localStorage.setItem('kian_pos_debt_transactions', JSON.stringify([...newDebts, ...debtTransactions]));
        }
      }

      if (data.expenses && Array.isArray(data.expenses)) {
        if (mergeStrategy === 'overwrite') {
          localStorage.setItem('kian_pos_expenses', JSON.stringify(data.expenses));
        } else {
          const existingExpIds = new Set(expenses.map(e => e.id));
          const newExpenses = data.expenses.filter(e => !existingExpIds.has(e.id));
          localStorage.setItem('kian_pos_expenses', JSON.stringify([...newExpenses, ...expenses]));
        }
      }

      if (data.refunds && Array.isArray(data.refunds)) {
        if (mergeStrategy === 'overwrite') {
          localStorage.setItem('kian_pos_refunds', JSON.stringify(data.refunds));
        } else {
          const existingRefIds = new Set(refunds.map(r => r.id));
          const newRefunds = data.refunds.filter(r => !existingRefIds.has(r.id));
          localStorage.setItem('kian_pos_refunds', JSON.stringify([...newRefunds, ...refunds]));
        }
      }

      // 5. Settings & Auto-Sync Partner Saving
      let nextSettings = { ...settings };
      if (data.settings && typeof data.settings === 'object') {
        nextSettings = { ...nextSettings, ...data.settings };
      }

      if (saveAsPartnerOnReceive) {
        const partnerConfig: SavedSyncPartner = {
          channelId: fetchedPackage.transferCode,
          pairingKey: fetchedPackage.transferCode,
          deviceName: fetchedPackage.senderDeviceName || 'الجهاز الشريك المركزي',
          savedAt: new Date().toISOString(),
          lastSyncedAt: new Date().toISOString(),
          autoSyncEnabled: true,
          syncSales: true,
          syncDocuments: true,
          syncCatalog: true,
        };
        nextSettings.savedSyncPartner = partnerConfig;
        nextSettings.autoSyncOnStartup = true;
      }

      localStorage.setItem('kian_pos_settings', JSON.stringify(nextSettings));
      localStorage.setItem('kian_settings', JSON.stringify(nextSettings));

      // 6. Persist newly applied data directly into IndexedDB
      await indexedDbService.cacheAllData({
        products: (data.products && mergeStrategy === 'overwrite') ? data.products : products,
        categories: (data.categories && mergeStrategy === 'overwrite') ? data.categories : categories,
        customers: (data.customers && mergeStrategy === 'overwrite') ? data.customers : customers,
        sales: (data.sales && mergeStrategy === 'overwrite') ? data.sales : sales,
        settings: nextSettings,
      });

      // 7. Notify server that transfer succeeded
      try {
        await fetch('/api/devices/transfer/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transferCode: fetchedPackage.transferCode,
            receiverDeviceName: `${settings.storeNameAr || settings.storeNameEn || 'جهاز كاشير فرعي'} (${window.navigator.platform || 'POS'})`
          })
        });
      } catch {}

      setApplySuccess(true);
      try {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
      } catch {}

      notify(
        'تم نقل وتطبيق البيانات بنجاح!',
        `تم تطبيق البيانات وحفظ الجهاز الشريك (${fetchedPackage.summary.productsCount} منتج، ${fetchedPackage.summary.salesCount || 0} مبيعات، ${fetchedPackage.summary.documentsCount || 0} مستند). يجري التحديث...`,
        'success'
      );

      // Auto-reload to apply cleanly into state
      setTimeout(() => {
        window.location.reload();
      }, 1600);

    } catch (err: any) {
      notify('حدث خطأ أثناء تطبيق البيانات', err.message || 'يرجى المحاولة مجدداً', 'error');
    } finally {
      setIsApplying(false);
    }
  };

  // Push latest current data to the saved partner channel
  const handlePushToPartnerChannel = async () => {
    const channelKey = (settings.savedSyncPartner?.pairingKey || partnerPairingKeyInput || '').trim().toUpperCase();
    if (!channelKey) {
      notify('رمز القناة غير محدد', 'يرجى إدخال أو حفظ رمز ربط الجهاز الشريك أولاً', 'error');
      return;
    }

    setIsPushingToPartner(true);
    setPartnerPushSuccess(false);
    try {
      const summary = {
        productsCount: products.length,
        salesCount: sales.length,
        documentsCount: (debtTransactions.length + expenses.length + refunds.length),
        customersCount: customers.length,
      };

      const payloadData = {
        products,
        categories,
        customers,
        sales,
        debtTransactions,
        expenses,
        refunds,
        settings,
      };

      const storeTitle = settings.storeNameAr || settings.storeNameEn || 'كاشير كيان';
      const deviceName = `${storeTitle} (${window.navigator.platform || 'POS'})`;

      const res = await fetch('/api/devices/partner/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId: channelKey,
          senderDeviceName: deviceName,
          summary,
          data: payloadData,
        })
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        throw new Error(resData.error || 'تعذر نشر البيانات على قناة الشريك');
      }

      setPartnerPushSuccess(true);
      notify('تمت مشاركة البيانات بنجاح', `تم إرسال المبيعات والمستندات والمنتجات إلى قناة المزامنة (${channelKey}) ليتلقاها الجهاز الآخر فوراً`, 'success');
      setTimeout(() => setPartnerPushSuccess(false), 3000);
    } catch (e: any) {
      notify('خطأ في إرسال البيانات', e.message || 'تعذر الاتصال بالخادم', 'error');
    } finally {
      setIsPushingToPartner(false);
    }
  };

  // Save new partner configuration from input
  const handleSavePartnerManual = () => {
    const key = partnerPairingKeyInput.trim().toUpperCase();
    if (!key || key.length < 4) {
      notify('رمز غير صحيح', 'يرجى إدخال رمز ربط لا يقل عن 4 أحرف أو أرقام', 'error');
      return;
    }

    const partner: SavedSyncPartner = {
      channelId: key,
      pairingKey: key,
      deviceName: partnerDeviceNameInput.trim() || 'جهاز كاشير شريك',
      savedAt: new Date().toISOString(),
      lastSyncedAt: new Date().toISOString(),
      autoSyncEnabled: true,
      syncSales: true,
      syncDocuments: true,
      syncCatalog: true,
    };

    saveSyncPartner(partner);
    notify('تم حفظ الجهاز الشريك بنجاح', `سيتم المزامنة تلقائياً مع "${partner.deviceName}" فور الدخول للموقع.`, 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                نقل البيانات بين الأجهزة عبر كود الربط
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  مباشر وآمن
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                مزامنة المنتجات والعملاء والإعدادات بين الكاشير والتابلت والأجهزة الأخرى برمز فوري
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-4 pb-2 border-b border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-900">
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              onClick={() => setActiveTab('send')}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'send'
                  ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Send className="w-4 h-4 shrink-0" />
              <span className="truncate">إرسال بيانات</span>
            </button>
            <button
              onClick={() => setActiveTab('receive')}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'receive'
                  ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Download className="w-4 h-4 shrink-0" />
              <span className="truncate">استلام كود</span>
            </button>
            <button
              onClick={() => setActiveTab('partner_sync')}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-xs sm:text-sm font-semibold transition-all relative ${
                activeTab === 'partner_sync'
                  ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <RefreshCw className={`w-4 h-4 shrink-0 ${isSyncingWithPartner ? 'animate-spin text-amber-500' : ''}`} />
              <span className="truncate">المزامنة التلقائية</span>
              {settings.savedSyncPartner?.autoSyncEnabled && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-800" />
              )}
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'send' ? (
            /* TAB 1: SEND DATA */
            <div className="space-y-6">
              {/* Step 1: Select What to Transfer */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-500" />
                    1. اختر البيانات المراد مشاركتها مع الجهاز الآخر:
                  </label>
                  <div className="flex gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setIncludeProducts(true);
                        setIncludeCategories(true);
                        setIncludeCustomers(true);
                        setIncludeSales(true);
                        setIncludeDocuments(true);
                        setIncludeSettings(true);
                      }}
                      className="text-amber-600 dark:text-amber-400 font-medium hover:underline"
                    >
                      تحديد الكل
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Products */}
                  <label className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                    includeProducts 
                      ? 'border-amber-500/50 bg-amber-500/5 dark:bg-amber-500/10' 
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                        <Package className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">المنتجات والمخزون</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{products.length} منتج مسجل</div>
                      </div>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={includeProducts} 
                      onChange={(e) => setIncludeProducts(e.target.checked)}
                      className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                    />
                  </label>

                  {/* Categories */}
                  <label className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                    includeCategories 
                      ? 'border-amber-500/50 bg-amber-500/5 dark:bg-amber-500/10' 
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">أقسام وتصنيفات المنتجات</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{categories.length} قسم</div>
                      </div>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={includeCategories} 
                      onChange={(e) => setIncludeCategories(e.target.checked)}
                      className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                    />
                  </label>

                  {/* Customers & Debts */}
                  <label className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                    includeCustomers 
                      ? 'border-amber-500/50 bg-amber-500/5 dark:bg-amber-500/10' 
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">العملاء وسجلات الديون</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{customers.length} عميل ونقاط ولاء</div>
                      </div>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={includeCustomers} 
                      onChange={(e) => setIncludeCustomers(e.target.checked)}
                      className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                    />
                  </label>

                  {/* Sales & Invoices (مشاركة المبيعات) */}
                  <label className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                    includeSales 
                      ? 'border-amber-500/50 bg-amber-500/5 dark:bg-amber-500/10' 
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                        <Receipt className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">المبيعات والفواتير</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{sales.length} فاتورة وعملية بيع</div>
                      </div>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={includeSales} 
                      onChange={(e) => setIncludeSales(e.target.checked)}
                      className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                    />
                  </label>

                  {/* Documents & Vouchers (مشاركة المستندات) */}
                  <label className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                    includeDocuments 
                      ? 'border-amber-500/50 bg-amber-500/5 dark:bg-amber-500/10' 
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">المستندات والسندات المالية</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{debtTransactions.length + expenses.length + refunds.length} سند قبض/دفع/مصروف</div>
                      </div>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={includeDocuments} 
                      onChange={(e) => setIncludeDocuments(e.target.checked)}
                      className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                    />
                  </label>

                  {/* Store Settings & Currency */}
                  <label className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                    includeSettings 
                      ? 'border-amber-500/50 bg-amber-500/5 dark:bg-amber-500/10' 
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                        <Settings className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">إعدادات النظام والعملات</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{settings.storeNameAr || settings.storeNameEn || 'إعدادات المتجر والطابعات'}</div>
                      </div>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={includeSettings} 
                      onChange={(e) => setIncludeSettings(e.target.checked)}
                      className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                    />
                  </label>
                </div>

                {/* Auto-Sync Option on Send */}
                <label className="flex items-center justify-between p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <Share2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        تفعيل قناة مزامنة مستمرة للجهاز المستلم
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        حفظ هذا الرمز كقناة دائمة لتمكين الجهاز الآخر من مزامنة المبيعات والمستندات تلقائياً عند فتح الموقع
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={saveAsPartnerOnSend}
                    onChange={(e) => setSaveAsPartnerOnSend(e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                  />
                </label>
              </div>

              {/* Generate Button or Active Code Display */}
              {!transferCode ? (
                <button
                  type="button"
                  onClick={handleGenerateTransfer}
                  disabled={isGenerating || (!includeProducts && !includeCategories && !includeCustomers && !includeSettings)}
                  className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold shadow-lg shadow-amber-500/25 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      جارِ تحضير وتشفير حزمة البيانات...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      توليد كود الربط ونقل البيانات الآن
                    </>
                  )}
                </button>
              ) : (
                /* Active Code & QR Area */
                <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-50 to-amber-50/30 dark:from-slate-800/60 dark:to-amber-950/20 border border-amber-500/30 space-y-4 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                      <Radio className="w-4 h-4 animate-pulse text-amber-500" />
                      كود الربط النشط (صالحة لمدة ساعتين)
                    </span>
                    <button
                      onClick={handleGenerateTransfer}
                      className="text-xs text-slate-500 hover:text-amber-600 flex items-center gap-1 font-medium"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      تجديد الرمز
                    </button>
                  </div>

                  {/* Giant 6-digit Code Box */}
                  <div className="flex items-center justify-center gap-3 py-4 bg-white dark:bg-slate-900 rounded-xl border-2 border-amber-500/40 shadow-inner">
                    <span className="font-mono text-4xl sm:text-5xl font-black tracking-widest text-slate-900 dark:text-white selection:bg-amber-500">
                      {transferCode.slice(0, 3)} {transferCode.slice(3, 6)}
                    </span>
                    <button
                      onClick={handleCopyCode}
                      className="p-3 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 transition-colors"
                      title="نسخ الرمز"
                    >
                      {isCopied ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>

                  {/* QR Code and Instructions */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-2">
                    {qrCodeDataUrl && (
                      <div className="p-2.5 bg-white rounded-xl shadow-md border border-slate-200">
                        <img 
                          src={qrCodeDataUrl} 
                          alt="QR Code" 
                          className="w-36 h-36 object-contain" 
                        />
                      </div>
                    )}
                    <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2 max-w-xs text-center sm:text-right">
                      <div className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-1.5 justify-center sm:justify-start">
                        <Smartphone className="w-4 h-4 text-amber-500" />
                        كيفية النقل إلى جهاز الكاشير الآخر:
                      </div>
                      <p>1. افتح تطبيق كاشير كيان على الجهاز الآخر (التابلت أو الهاتف).</p>
                      <p>2. اختر <strong>استلام بيانات</strong> وأدخل الرمز <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{transferCode}</span> أو امسح الباركود بالكاميرا.</p>
                      <p>3. ستنتقل كافة البيانات المختارة في ثوانٍ معدودة دون الحاجة لأسلاك!</p>
                    </div>
                  </div>

                  {/* Transfer live status */}
                  {transferStatus === 'confirmed' ? (
                    <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 flex items-center gap-3 animate-in fade-in">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      <div className="text-xs font-semibold">
                        تم استلام ونقل البيانات بنجاح على الجهاز: <span className="font-bold text-emerald-800 dark:text-emerald-200">{confirmedReceiverName}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 text-xs text-amber-700 dark:text-amber-300/80 bg-amber-500/10 py-2 px-3 rounded-lg border border-amber-500/20">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                      في انتظار إدخال الرمز على الجهاز الآخر لمزامنة البيانات...
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : activeTab === 'receive' ? (
            /* TAB 2: RECEIVE DATA */
            <div className="space-y-6">
              {/* Step 1: Input Code */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Download className="w-4 h-4 text-amber-500" />
                  أدخل رمز الربط (6 أرقام) المعروض على الجهاز المرسل:
                </label>

                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="مثال: 583912"
                    value={inputCode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setInputCode(val);
                      if (val.length === 6) {
                        handleFetchPackage(val);
                      }
                    }}
                    className="flex-1 text-center font-mono text-2xl font-black tracking-widest py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleFetchPackage()}
                    disabled={isFetching || inputCode.length < 4}
                    className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold flex items-center gap-2 disabled:opacity-50 cursor-pointer transition-colors shadow-sm"
                  >
                    {isFetching ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Download className="w-5 h-5" />
                        فحص الحزمة
                      </>
                    )}
                  </button>
                </div>

                {fetchError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{fetchError}</span>
                  </div>
                )}
              </div>

              {/* Step 2: Package Preview & Strategy Selection */}
              {fetchedPackage && (
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                          تم العثور على حزمة البيانات بنجاح
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          المرسل: {fetchedPackage.senderDeviceName}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold px-2 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-md border border-amber-500/20">
                      كود: {fetchedPackage.transferCode}
                    </span>
                  </div>

                  {/* Summary badges */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                      <div className="font-bold text-base text-slate-900 dark:text-white">
                        {fetchedPackage.summary.productsCount}
                      </div>
                      <div className="text-slate-500 text-[11px]">منتج ومخزون</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                      <div className="font-bold text-base text-slate-900 dark:text-white">
                        {fetchedPackage.summary.categoriesCount}
                      </div>
                      <div className="text-slate-500 text-[11px]">أقسام وتصنيفات</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                      <div className="font-bold text-base text-slate-900 dark:text-white">
                        {fetchedPackage.summary.customersCount}
                      </div>
                      <div className="text-slate-500 text-[11px]">عملاء وديون</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                      <div className="font-bold text-base text-indigo-600 dark:text-indigo-400">
                        {fetchedPackage.summary.salesCount || (fetchedPackage.data?.sales?.length || 0)}
                      </div>
                      <div className="text-slate-500 text-[11px]">فواتير ومبيعات</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                      <div className="font-bold text-base text-rose-600 dark:text-rose-400">
                        {fetchedPackage.summary.documentsCount || (
                          (fetchedPackage.data?.debtTransactions?.length || 0) +
                          (fetchedPackage.data?.expenses?.length || 0) +
                          (fetchedPackage.data?.refunds?.length || 0)
                        )}
                      </div>
                      <div className="text-slate-500 text-[11px]">مستندات وسندات</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                      <div className="font-bold text-base text-emerald-600 dark:text-emerald-400">
                        {fetchedPackage.summary.hasSettings ? 'نعم' : 'لا'}
                      </div>
                      <div className="text-slate-500 text-[11px]">إعدادات النظام</div>
                    </div>
                  </div>

                  {/* Save Partner Checkbox */}
                  <label className="flex items-center justify-between p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 cursor-pointer">
                    <div className="flex items-center gap-2.5">
                      <Share2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          حفظ هذا الجهاز كشريك مزامنة دائم (Auto-Sync)
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          مزامنة المبيعات والمستندات والمنتجات تلقائياً مع هذا الجهاز فور فتح الموقع دون الحاجة لإدخال كود
                        </div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={saveAsPartnerOnReceive}
                      onChange={(e) => setSaveAsPartnerOnReceive(e.target.checked)}
                      className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                    />
                  </label>

                  {/* Strategy Choice */}
                  <div className="space-y-2 pt-2">
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      طريقة تطبيق ونقل البيانات:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <label className={`p-3 rounded-xl border cursor-pointer text-xs transition-all flex items-start gap-2.5 ${
                        mergeStrategy === 'merge' 
                          ? 'border-amber-500 bg-amber-500/5 dark:bg-amber-500/10' 
                          : 'border-slate-200 dark:border-slate-700'
                      }`}>
                        <input
                          type="radio"
                          name="strategy"
                          checked={mergeStrategy === 'merge'}
                          onChange={() => setMergeStrategy('merge')}
                          className="mt-0.5 text-amber-600"
                        />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">دمج ذكي (Smart Merge)</div>
                          <div className="text-slate-500 text-[11px] mt-0.5">
                            إضافة العناصر الجديدة وتحديث الفواتير دون مسح البيانات الحالية الموجودة على هذا الجهاز (موصى به).
                          </div>
                        </div>
                      </label>

                      <label className={`p-3 rounded-xl border cursor-pointer text-xs transition-all flex items-start gap-2.5 ${
                        mergeStrategy === 'overwrite' 
                          ? 'border-amber-500 bg-amber-500/5 dark:bg-amber-500/10' 
                          : 'border-slate-200 dark:border-slate-700'
                      }`}>
                        <input
                          type="radio"
                          name="strategy"
                          checked={mergeStrategy === 'overwrite'}
                          onChange={() => setMergeStrategy('overwrite')}
                          className="mt-0.5 text-amber-600"
                        />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">استبدال كامل (Full Overwrite)</div>
                          <div className="text-slate-500 text-[11px] mt-0.5">
                            استبدال كافة المنتجات والعملاء بالحزمة المستلمة (يتم أخذ نسخة احتياطية أولاً).
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Apply Button */}
                  <button
                    type="button"
                    onClick={handleApplyData}
                    disabled={isApplying || applySuccess}
                    className="w-full py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 disabled:opacity-50 cursor-pointer transition-all"
                  >
                    {isApplying ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        جارِ دمج وتطبيق البيانات وحفظها في IndexedDB...
                      </>
                    ) : applySuccess ? (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        تم التطبيق بنجاح! جارِ التحديث...
                      </>
                    ) : (
                      <>
                        <Database className="w-5 h-5" />
                        تطبيق وحفظ البيانات على هذا الجهاز الآن
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* TAB 3: PARTNER AUTO-SYNC */
            <div className="space-y-6">
              {/* Header explanation banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-slate-50 dark:to-slate-800/40 border border-amber-500/20">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
                    <Wifi className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      المزامنة التلقائية الدائمة بين الأجهزة
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/20">
                        مباشر وسحابي
                      </span>
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      احفظ جهاز الكاشير الآخر (تابلت، موبايل، كمبيوتر) لكي يتصل التطبيق به <strong>تلقائياً فور فتح الموقع</strong> ويشارك المبيعات والفواتير والمستندات والمنتجات لحظياً دون الحاجة لتوليد أكواد في كل مرة.
                    </p>
                  </div>
                </div>
              </div>

              {/* Active Saved Partner Card */}
              {settings.savedSyncPartner ? (
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          {settings.savedSyncPartner.deviceName}
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            جهاز محفوظ
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                          رمز القناة: {settings.savedSyncPartner.pairingKey}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        removeSyncPartner();
                        notify('تم إلغاء حفظ الجهاز', 'تمت إزالة الجهاز الشريك من المزامنة التلقائية', 'info');
                      }}
                      className="text-xs text-rose-500 hover:text-rose-600 p-2 rounded-lg hover:bg-rose-500/10 flex items-center gap-1 font-medium transition-colors"
                      title="إزالة هذا الجهاز"
                    >
                      <Trash2 className="w-4 h-4" />
                      إلغاء الربط
                    </button>
                  </div>

                  {/* Sync Status & Info */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60">
                      <div className="text-slate-500 dark:text-slate-400 text-[11px]">آخر مزامنة ناجحة</div>
                      <div className="text-slate-800 dark:text-slate-200 font-bold mt-1">
                        {settings.savedSyncPartner.lastSyncedAt
                          ? new Date(settings.savedSyncPartner.lastSyncedAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                          : 'لم تتم مزامنة بعد'}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60">
                      <div className="text-slate-500 dark:text-slate-400 text-[11px]">تزامن تلقائي عند الفتح</div>
                      <div className="text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                        {settings.autoSyncOnStartup ? 'مُفعل تلقائياً' : 'يدوي'}
                      </div>
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => performPartnerSync()}
                      disabled={isSyncingWithPartner}
                      className="py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 disabled:opacity-50 cursor-pointer transition-all text-xs"
                    >
                      <RefreshCw className={`w-4 h-4 ${isSyncingWithPartner ? 'animate-spin' : ''}`} />
                      {isSyncingWithPartner ? 'جارِ المزامنة وسحب البيانات...' : 'مزامنة وسحب البيانات الآن'}
                    </button>

                    <button
                      type="button"
                      onClick={handlePushToPartnerChannel}
                      disabled={isPushingToPartner}
                      className="py-3 px-4 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white font-bold flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer transition-all text-xs"
                    >
                      {isPushingToPartner ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          جارِ إرسال وتحديث البيانات...
                        </>
                      ) : partnerPushSuccess ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                          تم الإرسال للشريك بنجاح!
                        </>
                      ) : (
                        <>
                          <Share2 className="w-4 h-4 text-amber-400" />
                          إرسال مبيعاتي ومستنداتي للشريك
                        </>
                      )}
                    </button>
                  </div>

                  {/* Startup Auto-Sync Switch */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                    <label className="flex items-center justify-between cursor-pointer py-1">
                      <div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          المزامنة التلقائية فور فتح الموقع (Auto-Sync on Launch)
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          بمجرد دخولك للموقع يتم جلب آخر المبيعات والمستندات تلقائياً من الجهاز الآخر دون أي تدخل
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.autoSyncOnStartup ?? true}
                        onChange={(e) => {
                          updateSettings({ autoSyncOnStartup: e.target.checked });
                          notify('تم تحديث الإعداد', e.target.checked ? 'تم تفعيل المزامنة التلقائية عند بدء التشغيل' : 'تم تعطيل المزامنة التلقائية عند البدء', 'info');
                        }}
                        className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                      />
                    </label>
                  </div>
                </div>
              ) : (
                /* No Partner Saved Yet: Add Form */
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
                  <div className="space-y-1">
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                      ربط جهاز جديد للمزامنة التلقائية:
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      أدخل رمز الربط (كود النقل المكون من 6 أرقام أو اسم القناة المشتركة) لحفظه والتزامن معه تلقائياً:
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        رمز الربط / القناة (Pairing Key):
                      </label>
                      <input
                        type="text"
                        placeholder="مثال: 583912"
                        value={partnerPairingKeyInput}
                        onChange={(e) => setPartnerPairingKeyInput(e.target.value.toUpperCase())}
                        className="w-full text-center font-mono text-xl font-bold py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        اسم الجهاز التابع (Device Name):
                      </label>
                      <input
                        type="text"
                        placeholder="مثال: كاشير الصالة / تابلت البائع"
                        value={partnerDeviceNameInput}
                        onChange={(e) => setPartnerDeviceNameInput(e.target.value)}
                        className="w-full text-xs py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleSavePartnerManual}
                      disabled={!partnerPairingKeyInput || partnerPairingKeyInput.length < 4}
                      className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 disabled:opacity-50 cursor-pointer transition-all text-xs"
                    >
                      <Share2 className="w-4 h-4" />
                      حفظ الجهاز وتفعيل المزامنة التلقائية فوراً
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info banner */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>نقل بيانات مشفر ومحمي مع دعم الحفظ في IndexedDB أوفلاين</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
