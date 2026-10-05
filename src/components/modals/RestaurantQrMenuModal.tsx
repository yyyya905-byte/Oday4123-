import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, DeviceRole, DiningType } from '../../types';
import QRCode from 'qrcode';
import { soundEffects } from '../../services/audio';
import {
  PRESET_FOOD_IMAGES,
  TARGET_DEVICE_OPTIONS,
  getTargetDeviceLabel,
  compressImageFile,
  QR_MENU_THEME_PRESETS,
  DEFAULT_QR_MENU_THEME,
  resolveProductFromInventory,
} from '../menu/CustomerQrMenuPage';
import {
  QrCode,
  Printer,
  ExternalLink,
  Copy,
  Check,
  UtensilsCrossed,
  Camera,
  Monitor,
  Smartphone,
  Search,
  Upload,
  Image as ImageIcon,
  Sparkles,
  X,
  ShoppingBag,
  CheckCircle2,
  Clock,
  Wifi,
  Layers,
  Eye,
  SlidersHorizontal,
  ArrowUpRight,
  RefreshCw,
  Palette,
  Star,
  Trash2,
} from 'lucide-react';

interface RestaurantQrMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TABLES_LIST = Array.from({ length: 20 }, (_, i) => `الطاولة ${i + 1}`);

export const RestaurantQrMenuModal: React.FC<RestaurantQrMenuModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    products,
    categories,
    settings,
    devices,
    kitchenOrders,
    selectedTable,
    updateProduct,
    updateQrMenuTheme,
    customerReviews,
    deleteCustomerReview,
    updateKitchenItemStatus,
    loadKitchenOrderToCart,
    setIsCustomerMenuPreviewOpen,
    formatCurrency,
    notify,
  } = useApp();

  const [activeTab, setActiveTab] = useState<
    'qr_print' | 'product_routing' | 'live_orders' | 'theme_customizer' | 'customer_reviews'
  >('qr_print');

  const activeQrTheme = useMemo(
    () => ({
      ...DEFAULT_QR_MENU_THEME,
      ...(settings.qrMenuTheme || {}),
    }),
    [settings.qrMenuTheme]
  );

  // --- Tab 1: QR Code Generator & Print State ---
  const [qrMode, setQrMode] = useState<'single_table' | 'general_menu' | 'all_tables'>('single_table');
  const [qrTable, setQrTable] = useState<string>(selectedTable || 'الطاولة 1');
  const [qrDiningType, setQrDiningType] = useState<DiningType>('dine_in');
  const [cardHeadline, setCardHeadline] = useState<string>('امسح الكود واطلب مباشرة من جوالك 📱');
  const [cardSubtext, setCardSubtext] = useState<string>('تصفح قائمة الطعام والمشروبات بالصور والأسعار واطلب بضغطة زر');
  const [wifiName, setWifiName] = useState<string>('');
  const [wifiPass, setWifiPass] = useState<string>('');
  const [singleQrDataUrl, setSingleQrDataUrl] = useState<string>('');
  const [multiTableQrs, setMultiTableQrs] = useState<{ table: string; url: string; qrData: string }[]>([]);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // --- Tab 2: Per-Product Device Routing & Image Management State ---
  const [prodSearch, setProdSearch] = useState('');
  const [prodCategoryFilter, setProdCategoryFilter] = useState('cat_all');
  const [bulkCategory, setBulkCategory] = useState('cat_all');
  const [bulkTargetValue, setBulkTargetValue] = useState('role:kitchen_display');
  const [photoPickerProduct, setPhotoPickerProduct] = useState<Product | null>(null);
  const [customPhotoUrl, setCustomPhotoUrl] = useState('');
  const fileUploadRef = useRef<HTMLInputElement>(null);

  // Build customer menu URL
  const customerMenuUrl = useMemo(() => {
    const base = `${window.location.origin}${window.location.pathname}`;
    const params = new URLSearchParams();
    params.set('customerMenu', '1');
    if (qrMode === 'single_table') {
      params.set('table', qrTable);
      params.set('type', 'dine_in');
    } else {
      params.set('type', qrDiningType);
    }
    return `${base}?${params.toString()}`;
  }, [qrMode, qrTable, qrDiningType]);

  // Generate Single QR Data URL
  useEffect(() => {
    if (!isOpen) return;
    QRCode.toDataURL(customerMenuUrl, {
      width: 340,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then(url => setSingleQrDataUrl(url))
      .catch(() => {});
  }, [customerMenuUrl, isOpen]);

  // Generate Multi-Table QR Codes (Tables 1..12) when `all_tables` is selected
  useEffect(() => {
    if (!isOpen || qrMode !== 'all_tables') return;
    const base = `${window.location.origin}${window.location.pathname}`;
    const tablesToGenerate = TABLES_LIST.slice(0, 12);

    Promise.all(
      tablesToGenerate.map(async tbl => {
        const url = `${base}?customerMenu=1&table=${encodeURIComponent(tbl)}&type=dine_in`;
        const qrData = await QRCode.toDataURL(url, {
          width: 240,
          margin: 2,
          color: { dark: '#0f172a', light: '#ffffff' },
        });
        return { table: tbl, url, qrData };
      })
    )
      .then(list => setMultiTableQrs(list))
      .catch(() => {});
  }, [isOpen, qrMode]);

  // Filtered products for Tab 2
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCat = prodCategoryFilter === 'cat_all' || p.categoryId === prodCategoryFilter;
      const q = prodSearch.trim().toLowerCase();
      const matchQ =
        !q ||
        p.nameAr.toLowerCase().includes(q) ||
        (p.nameEn && p.nameEn.toLowerCase().includes(q)) ||
        p.sku.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [products, prodCategoryFilter, prodSearch]);

  // Customer QR Orders for Tab 3
  const customerQrOrders = useMemo(() => {
    return kitchenOrders.filter(o => o.isCustomerQrOrder || o.orderNumber?.startsWith('QR-'));
  }, [kitchenOrders]);

  if (!isOpen) return null;

  // Handle Copy Link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(customerMenuUrl).catch(() => {});
    setCopiedUrl(true);
    soundEffects.playSuccess();
    notify('تم نسخ رابط منيو الزبائن', 'يمكنك مشاركة الرابط أو فتحه من أي جوال', 'success');
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  // Sync product update to server + local context
  const syncProductChange = async (productId: string, updates: Partial<Product>) => {
    updateProduct(productId, updates);
    try {
      await fetch('/api/menu/update-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, updates }),
      });
      const bc = new BroadcastChannel('kian_pos_devices_mesh');
      bc.postMessage({
        type: 'MENU_PRODUCT_UPDATED',
        payload: { productId, updates },
      });
      bc.close();
    } catch {}
  };

  // Parse Target Selection Value (`role:kitchen_display` or `device:dev-123`)
  const parseTargetValue = (val: string): Partial<Product> => {
    if (val.startsWith('device:')) {
      const devId = val.replace('device:', '');
      const dev = devices.find(d => d.id === devId);
      return {
        targetDeviceId: devId,
        targetDeviceRole: dev?.role || 'kitchen_display',
        targetStationName: dev?.name || 'جهاز مخصص',
      };
    }
    const role = val.replace('role:', '') as DeviceRole | 'all';
    const opt = TARGET_DEVICE_OPTIONS.find(o => o.role === role);
    return {
      targetDeviceId: '',
      targetDeviceRole: role,
      targetStationName: opt?.labelAr || 'شاشة المطبخ الرئيسية (KDS)',
    };
  };

  const getProductTargetSelectValue = (p: Product): string => {
    if (p.targetDeviceId && devices.some(d => d.id === p.targetDeviceId)) {
      return `device:${p.targetDeviceId}`;
    }
    return `role:${p.targetDeviceRole || 'kitchen_display'}`;
  };

  // Bulk Apply Target Device to Category
  const handleBulkApplyTarget = () => {
    const updates = parseTargetValue(bulkTargetValue);
    const targetList = products.filter(
      p => bulkCategory === 'cat_all' || p.categoryId === bulkCategory
    );
    targetList.forEach(p => {
      syncProductChange(p.id, updates);
    });
    soundEffects.saleSuccess();
    notify(
      'تم توجيه المنتجات بنجاح',
      `تم توجيه (${targetList.length}) منتج للظهور في: ${updates.targetStationName}`,
      'success'
    );
  };

  // Handle Image File Upload for a Product
  const handleProductFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !photoPickerProduct) return;
    try {
      const compressed = await compressImageFile(file, 700, 0.82);
      await syncProductChange(photoPickerProduct.id, { image: compressed });
      soundEffects.saleSuccess();
      notify('تم حفظ صورة المنتج', `تم تحديث صورة [${photoPickerProduct.nameAr}] في منيو الزبون`, 'success');
      setPhotoPickerProduct(null);
    } catch {
      notify('خطأ في الصورة', 'تعذر رفع الصورة المختارة', 'error');
    }
  };

  // Print QR Code Stand Card / Multi-Table Sheet
  const handlePrintQrCode = () => {
    soundEffects.playBeep();
    const storeName = settings.storeNameAr || 'المطعم والكافيه';
    const storePhone = settings.phone || '';

    const printContainer = document.createElement('div');
    printContainer.id = 'qr-menu-print-overlay';
    printContainer.dir = 'rtl';
    printContainer.className = 'fixed inset-0 z-[99999] bg-white text-slate-950 p-6 overflow-auto';

    if (qrMode === 'all_tables' && multiTableQrs.length > 0) {
      printContainer.innerHTML = `
        <div style="font-family: system-ui, sans-serif; max-width: 1000px; margin: 0 auto; direction: rtl;">
          <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px dashed #cbd5e1; padding-bottom: 12px;">
            <h1 style="font-size: 22px; font-weight: 900; margin: 0;">${storeName} — بطاقات QR للطاولات</h1>
            <p style="font-size: 13px; color: #475569; margin: 4px 0 0;">قص البطاقات وثبت كل باركود على الطاولة المخصصة له</p>
          </div>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">
            ${multiTableQrs
              .map(
                item => `
              <div style="border: 2px solid #0f172a; border-radius: 20px; padding: 16px; text-align: center; page-break-inside: avoid; background: #fff;">
                <div style="font-size: 15px; font-weight: 900; color: #0f172a;">${storeName}</div>
                <div style="display: inline-block; margin: 6px 0; padding: 4px 14px; background: #f59e0b; color: #0f172a; font-weight: 900; font-size: 14px; border-radius: 999px;">
                  ${item.table}
                </div>
                <div style="margin: 8px auto; width: 155px; height: 155px;">
                  <img src="${item.qrData}" style="width: 100%; height: 100%; object-fit: contain;" />
                </div>
                <div style="font-size: 12px; font-weight: 800; color: #0f172a;">${cardHeadline}</div>
                ${
                  wifiName
                    ? `<div style="margin-top: 6px; font-size: 10px; color: #475569; border-top: 1px dashed #e2e8f0; padding-top: 4px;">واي فاي: <b>${wifiName}</b> ${wifiPass ? `| كلمة السر: <b>${wifiPass}</b>` : ''}</div>`
                    : ''
                }
              </div>
            `
              )
              .join('')}
          </div>
        </div>
      `;
    } else {
      const badgeLabel =
        qrMode === 'single_table'
          ? qrTable
          : qrDiningType === 'takeaway'
          ? 'منيو الطلبات السفرية'
          : qrDiningType === 'delivery'
          ? 'منيو طلبات التوصيل'
          : 'منيو الطعام والمشروبات';

      printContainer.innerHTML = `
        <div style="font-family: system-ui, sans-serif; max-width: 420px; margin: 20px auto; border: 4px solid #0f172a; border-radius: 32px; padding: 28px 24px; text-align: center; direction: rtl; background: #ffffff;">
          <div style="font-size: 26px; font-weight: 900; color: #0f172a; margin-bottom: 6px;">${storeName}</div>
          <div style="display: inline-block; padding: 6px 20px; background: #f59e0b; color: #0f172a; font-weight: 900; font-size: 17px; border-radius: 999px; margin-bottom: 16px;">
            ${badgeLabel}
          </div>
          <div style="border: 3px dashed #cbd5e1; border-radius: 24px; padding: 16px; width: 250px; height: 250px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
            <img src="${singleQrDataUrl}" style="width: 220px; height: 220px; object-fit: contain;" />
          </div>
          <div style="font-size: 18px; font-weight: 900; color: #0f172a; margin-bottom: 6px;">${cardHeadline}</div>
          <div style="font-size: 13px; color: #475569; line-height: 1.5; margin-bottom: 14px;">${cardSubtext}</div>
          ${
            wifiName
              ? `<div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 14px; padding: 10px; font-size: 12px; margin-bottom: 10px;">
                  📶 شبكة الواي فاي: <b>${wifiName}</b> ${wifiPass ? `<br/>🔑 كلمة المرور: <b>${wifiPass}</b>` : ''}
                 </div>`
              : ''
          }
          ${storePhone ? `<div style="font-size: 12px; font-weight: 700; color: #64748b;">📞 للاستفسار: ${storePhone}</div>` : ''}
        </div>
      `;
    }

    document.body.appendChild(printContainer);
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        if (document.body.contains(printContainer)) {
          document.body.removeChild(printContainer);
        }
      }, 600);
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div
        dir="rtl"
        className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[94vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Top Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black">
                  منيو QR للزبائن وتوجيه طلبات المنتجات للأجهزة
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  صفحة مخصصة للزبون
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                اطبع باركود QR للزبائن، ضع صوراً للمنتجات، وحدد الجهاز الذي يظهر فيه كل منتج فور طلبه
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                setIsCustomerMenuPreviewOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
            >
              <Eye className="w-4 h-4" />
              <span>فتح صفحة الزبون المخصصة</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-4 pt-3 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('qr_print')}
            className={`px-4 py-2.5 rounded-t-2xl text-xs sm:text-sm font-black flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'qr_print'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 border-amber-500 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 border-transparent'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>1. طباعة كود QR لصفحة الزبائن</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('product_routing')}
            className={`px-4 py-2.5 rounded-t-2xl text-xs sm:text-sm font-black flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'product_routing'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border-blue-500 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 border-transparent'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>2. صور المنتجات وتحديد جهاز كل منتج ({products.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('live_orders')}
            className={`px-4 py-2.5 rounded-t-2xl text-xs sm:text-sm font-black flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'live_orders'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 border-emerald-500 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 border-transparent'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>3. طلبات الزبائن الواردة عبر QR</span>
            {customerQrOrders.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-white">
                {customerQrOrders.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('theme_customizer')}
            className={`px-4 py-2.5 rounded-t-2xl text-xs sm:text-sm font-black flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'theme_customizer'
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 border-purple-500 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 border-transparent'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>4. تخصيص ألوان وهوية المنيو</span>
            <span
              className="w-3 h-3 rounded-full border border-slate-400 shrink-0"
              style={{ backgroundColor: activeQrTheme.primaryColor }}
            />
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('customer_reviews')}
            className={`px-4 py-2.5 rounded-t-2xl text-xs sm:text-sm font-black flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'customer_reviews'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 border-amber-500 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 border-transparent'
            }`}
          >
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>5. تقييمات الزبائن</span>
            {customerReviews.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950">
                {customerReviews.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* ==========================================
              TAB 1: PRINT QR CODE FOR DEDICATED CUSTOMER PAGE
             ========================================== */}
          {activeTab === 'qr_print' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: QR Configuration */}
              <div className="lg:col-span-7 space-y-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-4">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>تخصيص باركود QR للزبائن</span>
                  </h3>

                  {/* QR Mode Selector */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setQrMode('single_table')}
                      className={`p-3 rounded-2xl border text-start transition-all cursor-pointer ${
                        qrMode === 'single_table'
                          ? 'bg-amber-500/15 border-amber-500 text-amber-900 dark:text-amber-300 font-black'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="text-xs font-black">🍽️ باركود لطاولة محددة</div>
                      <p className="text-[10px] opacity-75 mt-0.5">
                        يفتح المنيو مع تحديد رقم الطاولة تلقائياً
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setQrMode('all_tables')}
                      className={`p-3 rounded-2xl border text-start transition-all cursor-pointer ${
                        qrMode === 'all_tables'
                          ? 'bg-amber-500/15 border-amber-500 text-amber-900 dark:text-amber-300 font-black'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="text-xs font-black">📑 طباعة كل الطاولات (1-12)</div>
                      <p className="text-[10px] opacity-75 mt-0.5">
                        ورقة واحدة تحتوي باركود مستقل لكل طاولة
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setQrMode('general_menu')}
                      className={`p-3 rounded-2xl border text-start transition-all cursor-pointer ${
                        qrMode === 'general_menu'
                          ? 'bg-amber-500/15 border-amber-500 text-amber-900 dark:text-amber-300 font-black'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="text-xs font-black">🛍️ باركود منيو عام / سفري</div>
                      <p className="text-[10px] opacity-75 mt-0.5">
                        للكاشير أو الاستلام السفري والتوصيل
                      </p>
                    </button>
                  </div>

                  {/* Table Selector when single_table */}
                  {qrMode === 'single_table' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                        اختر الطاولة المراد طباعة باركود QR لها:
                      </label>
                      <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
                        {TABLES_LIST.slice(0, 15).map(tbl => (
                          <button
                            key={tbl}
                            type="button"
                            onClick={() => setQrTable(tbl)}
                            className={`py-2 px-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                              qrTable === tbl
                                ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 border-amber-500'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {tbl}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Custom Texts & Wi-Fi on Printed QR Stand */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">
                        عنوان بطاقة الباركود المطبوعة:
                      </label>
                      <input
                        type="text"
                        value={cardHeadline}
                        onChange={e => setCardHeadline(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">
                        اسم شبكة الواي فاي للزبائن (اختياري):
                      </label>
                      <input
                        type="text"
                        value={wifiName}
                        onChange={e => setWifiName(e.target.value)}
                        placeholder="مثال: Cafe_Guest_WiFi"
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">
                        كلمة مرور الواي فاي (اختياري):
                      </label>
                      <input
                        type="text"
                        value={wifiPass}
                        onChange={e => setWifiPass(e.target.value)}
                        placeholder="مثال: 12345678"
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold font-mono"
                      />
                    </div>
                  </div>

                  {/* Direct Link Copy Box */}
                  <div className="pt-2">
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">
                      الرابط المباشر لصفحة الزبائن المخصصة:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={customerMenuUrl}
                        dir="ltr"
                        className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-600 dark:text-slate-300"
                      />
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
                      >
                        {copiedUrl ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        <span>{copiedUrl ? 'تم النسخ' : 'نسخ الرابط'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handlePrintQrCode}
                    className="flex-1 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 cursor-pointer"
                  >
                    <Printer className="w-5 h-5" />
                    <span>
                      {qrMode === 'all_tables'
                        ? 'طباعة بطاقات QR لكافة الطاولات (A4)'
                        : `طباعة كود QR (${qrMode === 'single_table' ? qrTable : 'المنيو العام'})`}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      setIsCustomerMenuPreviewOpen(true);
                    }}
                    className="py-3.5 px-5 rounded-2xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Eye className="w-4 h-4 text-amber-400" />
                    <span>معاينة صفحة الزبون</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Live Printable Stand Card Preview */}
              <div className="lg:col-span-5 flex flex-col items-center">
                <div className="w-full max-w-sm bg-white text-slate-950 rounded-3xl border-4 border-slate-900 p-6 text-center shadow-xl">
                  <div className="text-xl font-black text-slate-900">
                    {settings.storeNameAr || 'المطعم والكافيه'}
                  </div>
                  <div className="inline-block mt-2 mb-4 px-4 py-1 rounded-full bg-amber-500 text-slate-950 font-black text-sm shadow-xs">
                    {qrMode === 'single_table'
                      ? qrTable
                      : qrMode === 'all_tables'
                      ? 'الطاولة 1 إلى 12'
                      : 'منيو الطلب الذاتي'}
                  </div>

                  <div className="w-56 h-56 mx-auto p-3 rounded-3xl border-2 border-dashed border-slate-300 flex items-center justify-center bg-white">
                    {singleQrDataUrl ? (
                      <img
                        src={singleQrDataUrl}
                        alt="Customer Menu QR"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <QrCode className="w-24 h-24 text-slate-300 animate-pulse" />
                    )}
                  </div>

                  <h4 className="text-base font-black text-slate-900 mt-4">{cardHeadline}</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{cardSubtext}</p>

                  {wifiName && (
                    <div className="mt-3 p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-700">
                      <div>
                        📶 واي فاي: <b>{wifiName}</b>
                      </div>
                      {wifiPass && (
                        <div>
                          🔑 الرمز: <b className="font-mono">{wifiPass}</b>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ==========================================
              TAB 2: PER-PRODUCT DEVICE ROUTING & PHOTOS
             ========================================== */}
          {activeTab === 'product_routing' && (
            <div className="space-y-4">
              {/* Bulk Category Routing Bar */}
              <div className="p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 flex flex-col md:flex-row items-stretch md:items-end justify-between gap-3">
                <div className="space-y-1">
                  <h4 className="text-xs sm:text-sm font-black text-blue-950 dark:text-blue-200 flex items-center gap-1.5">
                    <Monitor className="w-4 h-4 text-blue-600" />
                    <span>توجيه جماعي سريع: حدد أين يظهر كل قسم عند طلب الزبون</span>
                  </h4>
                  <p className="text-[11px] text-blue-800 dark:text-blue-300">
                    يمكنك توجيه قسم كامل (مثل المشروبات للبارستا، والمأكولات لشاشة المطبخ) بضغطة واحدة، أو تخصيص كل منتج على حدة بالأسفل.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={bulkCategory}
                    onChange={e => setBulkCategory(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 text-xs font-bold"
                  >
                    <option value="cat_all">كل الأقسام ({products.length} منتج)</option>
                    {categories
                      .filter(c => c.id !== 'cat_all')
                      .map(c => (
                        <option key={c.id} value={c.id}>
                          قسم: {c.nameAr}
                        </option>
                      ))}
                  </select>

                  <select
                    value={bulkTargetValue}
                    onChange={e => setBulkTargetValue(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 text-xs font-bold"
                  >
                    <optgroup label="حسب نوع الجهاز / القسم">
                      {TARGET_DEVICE_OPTIONS.map(opt => (
                        <option key={opt.role} value={`role:${opt.role}`}>
                          يظهر في: {opt.labelAr}
                        </option>
                      ))}
                    </optgroup>
                    {devices.length > 0 && (
                      <optgroup label="أجهزة مربوطة حالياً بالشبكة">
                        {devices.map(dev => (
                          <option key={dev.id} value={`device:${dev.id}`}>
                            جهاز متصل: {dev.name}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>

                  <button
                    type="button"
                    onClick={handleBulkApplyTarget}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-xs cursor-pointer"
                  >
                    تطبيق التوجيه
                  </button>
                </div>
              </div>

              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={prodSearch}
                    onChange={e => setProdSearch(e.target.value)}
                    placeholder="ابحث عن منتج لتغيير صورته أو الجهاز الموجه له..."
                    className="w-full ps-9 pe-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute start-3 top-3" />
                </div>

                <select
                  value={prodCategoryFilter}
                  onChange={e => setProdCategoryFilter(e.target.value)}
                  className="px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                >
                  <option value="cat_all">جميع الأقسام</option>
                  {categories
                    .filter(c => c.id !== 'cat_all')
                    .map(c => (
                      <option key={c.id} value={c.id}>
                        {c.nameAr}
                      </option>
                    ))}
                </select>
              </div>

              {/* Products List with Photo Picker & Target Device Selector */}
              <div className="space-y-2.5">
                {filteredProducts.length === 0 ? (
                  <div className="p-10 text-center text-slate-400 text-xs font-bold bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                    لا توجد منتجات مطابقة. يمكنك إضافة المنتجات من قسم المنتجات.
                  </div>
                ) : (
                  filteredProducts.map(product => {
                    const currentTargetVal = getProductTargetSelectValue(product);
                    const invInfo = resolveProductFromInventory(product, products);
                    const resolvedPhoto = invInfo.imageUrl || product.image;

                    return (
                      <div
                        key={product.id}
                        className="p-3 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 hover:border-amber-400/60 transition-all"
                      >
                        {/* Product Photo & Name */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div
                            onClick={() => {
                              setPhotoPickerProduct(product);
                              setCustomPhotoUrl(resolvedPhoto || '');
                            }}
                            className="relative w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 flex items-center justify-center cursor-pointer group"
                            title="صورة المنتج من بيانات المخزون — اضغط لتغيير الصورة"
                          >
                            {resolvedPhoto ? (
                              <img
                                src={resolvedPhoto}
                                alt={product.nameAr}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Camera className="w-6 h-6 text-slate-400 group-hover:text-amber-500" />
                            )}
                            <span className="absolute inset-x-0 bottom-0 bg-slate-950/75 text-white text-[9px] font-bold text-center py-0.5">
                              {resolvedPhoto ? 'تغيير الصورة' : '+ ضع صورة'}
                            </span>
                          </div>

                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                                {product.nameAr}
                              </h4>
                              <span className="text-xs font-black text-amber-600 dark:text-amber-400 font-mono">
                                {formatCurrency(product.price)}
                              </span>
                            </div>

                            <input
                              type="text"
                              value={product.descriptionAr || ''}
                              onChange={e =>
                                syncProductChange(product.id, { descriptionAr: e.target.value })
                              }
                              placeholder="أضف وصفاً قصيراً يظهر للزبون في المنيو (اختياري)..."
                              className="w-full max-w-md px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold"
                            />
                          </div>
                        </div>

                        {/* Target Device Selector (مسؤول كل منتج يظهر وين) */}
                        <div className="w-full md:w-auto flex flex-wrap items-center gap-2 justify-end shrink-0">
                          <div className="flex flex-col">
                            <label className="text-[10px] font-bold text-slate-400 mb-0.5">
                              يظهر طلب الزبون في جهاز:
                            </label>
                            <select
                              value={currentTargetVal}
                              onChange={e => {
                                const updates = parseTargetValue(e.target.value);
                                syncProductChange(product.id, updates);
                                soundEffects.playClick();
                                notify(
                                  'تم تحديث وجهة المنتج',
                                  `[${product.nameAr}] سيظهر الآن في: ${updates.targetStationName}`,
                                  'info'
                                );
                              }}
                              className="px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 text-xs font-extrabold cursor-pointer"
                            >
                              <optgroup label="الأجهزة والأقسام الرئيسية">
                                {TARGET_DEVICE_OPTIONS.map(opt => (
                                  <option key={opt.role} value={`role:${opt.role}`}>
                                    {opt.labelAr}
                                  </option>
                                ))}
                              </optgroup>
                              {devices.length > 0 && (
                                <optgroup label="أجهزة مربوطة حالياً بالشبكة">
                                  {devices.map(dev => (
                                    <option key={dev.id} value={`device:${dev.id}`}>
                                      جهاز: {dev.name}
                                    </option>
                                  ))}
                                </optgroup>
                              )}
                            </select>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setPhotoPickerProduct(product);
                              setCustomPhotoUrl(product.image || '');
                            }}
                            className="px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1 cursor-pointer mt-3.5"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>صورة</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ==========================================
              TAB 3: LIVE INCOMING CUSTOMER QR ORDERS
             ========================================== */}
          {activeTab === 'live_orders' && (
            <div className="space-y-3">
              {customerQrOrders.length === 0 ? (
                <div className="p-12 text-center bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <QrCode className="w-12 h-12 text-slate-400 mx-auto" />
                  <h4 className="text-sm font-black text-slate-800 dark:text-slate-200">
                    لا توجد طلبات واردة من باركود الزبائن حتى الآن
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    بمجرد أن يمسح الزبون كود QR ويطلب من جواله، سيظهر طلبه هنا وفي الجهاز الموجه له كل منتج تلقائياً مع تنبيه صوتي.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      setIsCustomerMenuPreviewOpen(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-black text-xs inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    <span>تجربة الطلب من صفحة الزبون الآن</span>
                  </button>
                </div>
              ) : (
                customerQrOrders.map(order => (
                  <div
                    key={order.id}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-800/70 border-2 border-emerald-500/40 shadow-sm space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700/70 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="px-3 py-1 rounded-xl bg-emerald-600 text-white font-black font-mono text-xs">
                          {order.orderNumber}
                        </span>
                        <span className="font-black text-sm text-slate-900 dark:text-white">
                          {order.tableName || 'طلب زبون QR'}
                        </span>
                        {order.customerName && (
                          <span className="text-xs font-bold text-slate-500">
                            ({order.customerName} {order.customerPhone ? `- ${order.customerPhone}` : ''})
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {order.totalAmount ? (
                          <span className="font-black font-mono text-sm text-amber-600 dark:text-amber-400">
                            {formatCurrency(order.totalAmount)}
                          </span>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => {
                            loadKitchenOrderToCart(order);
                            onClose();
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 text-xs font-black flex items-center gap-1.5 cursor-pointer"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>سحب للسلة والفوترة</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {order.items.map(item => (
                        <div
                          key={item.id}
                          className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                              {item.quantity}× {item.nameAr}
                            </p>
                            <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 truncate">
                              موجه إلى: {item.targetDeviceName || 'شاشة المطبخ'}
                            </p>
                            {item.notes && (
                              <p className="text-[10px] text-amber-600 truncate">ملاحظة: {item.notes}</p>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              updateKitchenItemStatus(
                                order.id,
                                item.id,
                                item.status === 'pending'
                                  ? 'cooking'
                                  : item.status === 'cooking'
                                  ? 'ready'
                                  : 'served'
                              )
                            }
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-black shrink-0 cursor-pointer ${
                              item.status === 'ready' || item.status === 'served'
                                ? 'bg-emerald-600 text-white'
                                : item.status === 'cooking'
                                ? 'bg-amber-500 text-slate-950'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {item.status === 'pending'
                              ? 'بدء التحضير'
                              : item.status === 'cooking'
                              ? 'تحديد كجاهز ✓'
                              : 'جاهز ✓'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ==========================================
              TAB 4: BRAND THEME CUSTOMIZER FOR CUSTOMER QR MENU
             ========================================== */}
          {activeTab === 'theme_customizer' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7 space-y-5">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-4">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <Palette className="w-4 h-4 text-purple-500" />
                      <span>قوالب الهوية الجاهزة لصفحة منيو الزبون (CustomerQrMenuPage)</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      اختر هوية لونية جاهزة أو خصص ألوان الأزرار والخلفية والترويسة لتطابق شعار وهوية مطعمك.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {QR_MENU_THEME_PRESETS.map(preset => {
                      const isSelected = activeQrTheme.presetId === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            updateQrMenuTheme(preset.theme);
                            soundEffects.playSuccess();
                            notify('تم تطبيق ألوان الهوية', `تم تفعيل ثيم: ${preset.nameAr}`, 'success');
                          }}
                          className={`p-3.5 rounded-2xl border text-start transition-all cursor-pointer ${
                            isSelected
                              ? 'border-purple-500 bg-purple-500/10 ring-2 ring-purple-500/20'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-purple-400'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-black text-slate-900 dark:text-white">
                              {preset.nameAr}
                            </span>
                            <div className="flex items-center gap-1">
                              <span
                                className="w-4 h-4 rounded-full border border-slate-300"
                                style={{ backgroundColor: preset.theme.primaryColor }}
                              />
                              <span
                                className="w-4 h-4 rounded-full border border-slate-300"
                                style={{ backgroundColor: preset.theme.backgroundColor }}
                              />
                              <span
                                className="w-4 h-4 rounded-full border border-slate-300"
                                style={{ backgroundColor: preset.theme.headerBackgroundColor }}
                              />
                            </div>
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">
                            {preset.descAr}
                          </p>
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom HEX Color Pickers */}
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-black block text-slate-800 dark:text-slate-200">
                          لون الأزرار والعناصر التفاعلية
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {activeQrTheme.primaryColor}
                        </span>
                      </div>
                      <input
                        type="color"
                        value={activeQrTheme.primaryColor}
                        onChange={e =>
                          updateQrMenuTheme({ primaryColor: e.target.value, presetId: 'custom' })
                        }
                        className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent"
                      />
                    </div>

                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-black block text-slate-800 dark:text-slate-200">
                          لون خلفية صفحة المنيو
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {activeQrTheme.backgroundColor}
                        </span>
                      </div>
                      <input
                        type="color"
                        value={activeQrTheme.backgroundColor}
                        onChange={e =>
                          updateQrMenuTheme({ backgroundColor: e.target.value, presetId: 'custom' })
                        }
                        className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent"
                      />
                    </div>

                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-black block text-slate-800 dark:text-slate-200">
                          لون خلفية الترويسة العلوية
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {activeQrTheme.headerBackgroundColor}
                        </span>
                      </div>
                      <input
                        type="color"
                        value={activeQrTheme.headerBackgroundColor}
                        onChange={e =>
                          updateQrMenuTheme({
                            headerBackgroundColor: e.target.value,
                            presetId: 'custom',
                          })
                        }
                        className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent"
                      />
                    </div>

                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-black block text-slate-800 dark:text-slate-200">
                          لون خلفية بطاقات الأصناف
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {activeQrTheme.cardBackgroundColor}
                        </span>
                      </div>
                      <input
                        type="color"
                        value={activeQrTheme.cardBackgroundColor}
                        onChange={e =>
                          updateQrMenuTheme({
                            cardBackgroundColor: e.target.value,
                            presetId: 'custom',
                          })
                        }
                        className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Live Mockup Preview of CustomerQrMenuPage */}
              <div className="lg:col-span-5">
                <div
                  style={{
                    backgroundColor: activeQrTheme.backgroundColor,
                    color: activeQrTheme.isDarkBackground ? '#f8fafc' : '#0f172a',
                  }}
                  className="rounded-3xl border-4 border-slate-900 overflow-hidden shadow-xl"
                >
                  <div
                    style={{ backgroundColor: activeQrTheme.headerBackgroundColor }}
                    className="p-4 text-white flex items-center gap-3"
                  >
                    <div
                      style={{
                        backgroundColor: activeQrTheme.primaryColor,
                        color: activeQrTheme.buttonTextColor,
                      }}
                      className="w-11 h-11 rounded-2xl flex items-center justify-center font-black shrink-0"
                    >
                      <UtensilsCrossed className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-black">
                        {settings.storeNameAr || 'المطعم والكافيه'}
                      </div>
                      <div className="text-[10px] text-slate-300">معاينة حية لألوان صفحة الزبون</div>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    {products.slice(0, 2).map(sample => {
                      const inv = resolveProductFromInventory(sample, products);
                      return (
                        <div
                          key={sample.id}
                          style={{ backgroundColor: activeQrTheme.cardBackgroundColor }}
                          className="p-3 rounded-2xl border border-slate-200/70 dark:border-slate-700 shadow-xs space-y-2.5"
                        >
                          <div className="flex items-center gap-2.5">
                            {inv.imageUrl && (
                              <img
                                src={inv.imageUrl}
                                alt={sample.nameAr}
                                className="w-14 h-14 rounded-xl object-cover shrink-0"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-xs font-black truncate">{sample.nameAr}</span>
                                <span
                                  style={{
                                    backgroundColor: `${activeQrTheme.primaryColor}20`,
                                    borderColor: `${activeQrTheme.primaryColor}50`,
                                  }}
                                  className="px-2 py-0.5 rounded-lg border text-[11px] font-black font-mono shrink-0"
                                >
                                  {formatCurrency(sample.price)}
                                </span>
                              </div>
                              <p className="text-[10px] opacity-70 truncate mt-0.5">
                                {inv.description}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            style={{
                              backgroundColor: activeQrTheme.primaryColor,
                              color: activeQrTheme.buttonTextColor,
                            }}
                            className="w-full py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1"
                          >
                            <span>+ إضافة إلى الطلب</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==========================================
              TAB 5: CUSTOMER QR EXPERIENCE REVIEWS
             ========================================== */}
          {activeTab === 'customer_reviews' && (
            <div className="space-y-4">
              {customerReviews.length === 0 ? (
                <div className="p-12 text-center bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <Star className="w-10 h-10 text-amber-400 mx-auto" />
                  <h4 className="text-sm font-black">لا توجد تقييمات مسجلة بعد</h4>
                  <p className="text-xs text-slate-500">
                    ستظهر تقييمات العملاء هنا وفي لوحة تحكم المدير فور إرسالهم للطلبات عبر صفحة QR.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {customerReviews.map(rev => (
                    <div
                      key={rev.id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                              {rev.customerName || 'عميل كريم'}
                            </span>
                            {rev.tableName && (
                              <span className="px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] font-black">
                                {rev.tableName}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {new Date(rev.createdAt).toLocaleString('ar-SY')}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <div className="flex items-center gap-0.5 bg-amber-500/10 px-2 py-1 rounded-xl">
                            {[1, 2, 3, 4, 5].map(s => (
                              <Star
                                key={s}
                                className={`w-3.5 h-3.5 ${
                                  s <= rev.rating
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-slate-300 dark:text-slate-600'
                                }`}
                              />
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() => deleteCustomerReview(rev.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 cursor-pointer"
                            title="حذف التقييم"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {rev.comment && (
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700">
                          &ldquo;{rev.comment}&rdquo;
                        </p>
                      )}

                      {rev.tags && rev.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {rev.tags.map(t => (
                            <span
                              key={t}
                              className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sub-Modal: Quick Product Photo Picker & Uploader */}
      {photoPickerProduct && (
        <div className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            dir="rtl"
            className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-slate-900 dark:text-white">
                صورة المنتج: {photoPickerProduct.nameAr}
              </h4>
              <button
                type="button"
                onClick={() => setPhotoPickerProduct(null)}
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <input
              ref={fileUploadRef}
              type="file"
              accept="image/*"
              onChange={handleProductFileChange}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileUploadRef.current?.click()}
              className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <Upload className="w-4 h-4" />
              <span>رفع صورة من جهازك أو الكاميرا</span>
            </button>

            <div>
              <span className="block text-[11px] font-bold text-slate-500 mb-1.5">
                أو اختر صورة جاهزة عالية الدقة:
              </span>
              <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
                {PRESET_FOOD_IMAGES.map(preset => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={async () => {
                      await syncProductChange(photoPickerProduct.id, { image: preset.url });
                      soundEffects.saleSuccess();
                      notify('تم تحديث الصورة', `تم وضع صورة لـ ${photoPickerProduct.nameAr}`, 'success');
                      setPhotoPickerProduct(null);
                    }}
                    className="relative rounded-xl overflow-hidden aspect-square border border-slate-200 dark:border-slate-700 hover:border-amber-500 cursor-pointer"
                  >
                    <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                    <span className="absolute inset-x-0 bottom-0 bg-slate-950/75 text-white text-[9px] font-bold truncate px-1">
                      {preset.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <input
                type="url"
                value={customPhotoUrl}
                onChange={e => setCustomPhotoUrl(e.target.value)}
                placeholder="أو الصق رابط صورة مباشر (https://...)"
                className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
              />
              <button
                type="button"
                onClick={async () => {
                  await syncProductChange(photoPickerProduct.id, {
                    image: customPhotoUrl.trim() || undefined,
                  });
                  soundEffects.saleSuccess();
                  setPhotoPickerProduct(null);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black cursor-pointer"
              >
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
