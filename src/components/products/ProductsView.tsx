import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, Category, TradeType, DeviceRole } from '../../types';
import {
  PRESET_FOOD_IMAGES,
  TARGET_DEVICE_OPTIONS,
  compressImageFile,
} from '../menu/CustomerQrMenuPage';
import {
  Plus,
  Minus,
  Search,
  Edit2,
  Trash2,
  Star,
  Package,
  Layers,
  Sparkles,
  X,
  Tag,
  Coins,
  AlertTriangle,
  AlertOctagon,
  Barcode as BarcodeIcon,
  Printer,
  Download,
  Camera,
  BellRing,
  FileSpreadsheet,
  Truck,
  CheckCircle2,
  RefreshCw,
  Upload,
  Monitor,
  Image as ImageIcon,
} from 'lucide-react';
import { BarcodeDesignerModal } from '../barcode/BarcodeDesignerModal';
import { ProductBarcodeScannerModal } from './ProductBarcodeScannerModal';
import { SupplierPurchaseModal } from '../debts/SupplierPurchaseModal';
import { generateBarcodeSvg, generateRandomEan13 } from '../../utils/barcodeUtils';

export const ProductsView: React.FC = () => {
  const {
    products,
    categories,
    addProduct,
    updateProduct,
    deleteProduct,
    adjustStock,
    addCategory,
    deleteCategory,
    formatCurrency,
    setActiveTab,
    t,
    language,
    settings,
    businessMode,
    notify
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');

  // Quick Low Stock Report Modal State
  const [isLowStockReportOpen, setIsLowStockReportOpen] = useState(false);
  const [isSupplierPurchaseModalOpen, setIsSupplierPurchaseModalOpen] = useState(false);
  const [productsToRestockInPurchase, setProductsToRestockInPurchase] = useState<Product[]>([]);

  // Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Barcode Designer State
  const [isBarcodeDesignerOpen, setIsBarcodeDesignerOpen] = useState(false);
  const [barcodeProductTarget, setBarcodeProductTarget] = useState<Product | null>(null);

  // Camera Barcode Scanner State
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [cameraScanTarget, setCameraScanTarget] = useState<'catalog' | 'modal_field'>('catalog');

  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCatNameAr, setNewCatNameAr] = useState('');
  const [newCatNameEn, setNewCatNameEn] = useState('');

  // Form State
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [barcode, setBarcode] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState<number>(10000);
  const [costPrice, setCostPrice] = useState<number>(7000);
  const [wholesalePrice, setWholesalePrice] = useState<number>(8500);
  const [wholesaleMinQty, setWholesaleMinQty] = useState<number>(12);
  const [wholesaleUnit, setWholesaleUnit] = useState<string>('كرتونة');
  const [wholesaleUnitMultiplier, setWholesaleUnitMultiplier] = useState<number>(12);
  const [tradeType, setTradeType] = useState<TradeType>('both');
  const [stock, setStock] = useState<number>(20);
  const [minStock, setMinStock] = useState<number>(5);
  const [unit, setUnit] = useState('قطعة');
  const [image, setImage] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');
  const [targetDeviceRole, setTargetDeviceRole] = useState<DeviceRole | 'all'>('kitchen_display');
  const [targetStationName, setTargetStationName] = useState('شاشة المطبخ الرئيسية (KDS)');
  const [isFavorite, setIsFavorite] = useState(false);
  const productImgInputRef = useRef<HTMLInputElement>(null);

  // Identification codes
  const [identificationCodes, setIdentificationCodes] = useState<string[]>([]);
  const [newCodeInput, setNewCodeInput] = useState<string>('');
  const [bulkCodesInput, setBulkCodesInput] = useState<string>('');
  const [showBulkCodesBox, setShowBulkCodesBox] = useState<boolean>(false);

  // Currency label
  const currencySymbol = settings.currency.symbolNative || settings.currency.symbol;
  const currencyCode = settings.currency.code;

  // Live profit calculation
  const profitAmount = Math.max(0, price - costPrice);
  const profitMarginPercent = costPrice > 0 ? ((profitAmount / costPrice) * 100).toFixed(1) : '100';

  // LOW STOCK ALERT SYSTEM COMPUTATIONS (Products where stock <= minStock)
  const lowStockAlertProducts = useMemo(() => {
    return products
      .filter(p => p.stock <= p.minStock)
      .sort((a, b) => a.stock - b.stock);
  }, [products]);

  const outOfStockCount = useMemo(
    () => lowStockAlertProducts.filter(p => p.stock <= 0).length,
    [lowStockAlertProducts]
  );

  const criticalThresholdCount = useMemo(
    () => lowStockAlertProducts.filter(p => p.stock > 0 && p.stock <= p.minStock).length,
    [lowStockAlertProducts]
  );

  const totalEstimatedRestockCost = useMemo(() => {
    return lowStockAlertProducts.reduce((sum, p) => {
      const targetStock = Math.max(p.minStock * 2, p.minStock + 10);
      const neededQty = Math.max(1, targetStock - p.stock);
      return sum + neededQty * (p.costPrice || Math.round(p.price * 0.7));
    }, 0);
  }, [lowStockAlertProducts]);

  // Export Quick Low Stock Report to CSV
  const handleExportLowStockCSV = () => {
    const headers = [
      'اسم المنتج,الباركود,الرمز SKU,الرصيد الحالي,الحد الأدنى,الحالة,الكمية المقترحة للشراء,سعر الشراء,التكلفة التقديرية\n'
    ];
    const rows = lowStockAlertProducts.map(p => {
      const targetStock = Math.max(p.minStock * 2, p.minStock + 10);
      const neededQty = Math.max(1, targetStock - p.stock);
      const statusText = p.stock <= 0 ? 'نافذ تماماً (0)' : 'وصل للحد الأدنى';
      const totalCost = neededQty * (p.costPrice || 0);
      return `"${p.nameAr}","${p.barcode}","${p.sku}",${p.stock},${p.minStock},"${statusText}",${neededQty},${p.costPrice},${totalCost}`;
    });
    const blob = new Blob([headers.concat(rows).join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `low-stock-quick-report-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify('تم تصدير التقرير السريع', 'تم تحميل قائمة المنتجات التي وصلت للحد الأدنى بصيغة CSV', 'success');
  };

  // Restock all low-stock products to safe level in 1 click
  const handleRestockAllLowProducts = () => {
    if (lowStockAlertProducts.length === 0) return;
    lowStockAlertProducts.forEach(p => {
      const targetStock = Math.max(p.minStock * 2, p.minStock + 10);
      const delta = Math.max(1, targetStock - p.stock);
      adjustStock(p.id, delta, 'restock', 'توريد تعويضي سريع من تقرير النواقص');
    });
    notify(
      'تم تعويض المخزون بنجاح',
      `تمت إعادة تعبئة ${lowStockAlertProducts.length} منتجات إلى المستوى الآمن`,
      'success'
    );
  };

  const openAddModal = (initialBarcode?: string) => {
    setEditingProduct(null);
    setNameAr('');
    setNameEn('');
    setCategoryId(categories[1]?.id || categories[0]?.id || 'cat_all');
    setBarcode(initialBarcode || `${Math.floor(1000000000000 + Math.random() * 9000000000000)}`);
    setSku(`SKU-${Math.floor(100 + Math.random() * 900)}`);
    setPrice(10000);
    setCostPrice(7000);
    setWholesalePrice(8500);
    setWholesaleMinQty(12);
    setWholesaleUnit('كرتونة');
    setWholesaleUnitMultiplier(12);
    setTradeType('both');
    setStock(25);
    setMinStock(5);
    setUnit('قطعة');
    setImage('');
    setDescriptionAr('');
    setTargetDeviceRole('kitchen_display');
    setTargetStationName('شاشة المطبخ الرئيسية (KDS)');
    setIsFavorite(false);
    setIdentificationCodes([]);
    setNewCodeInput('');
    setBulkCodesInput('');
    setShowBulkCodesBox(false);
    setIsProductModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setNameAr(product.nameAr);
    setNameEn(product.nameEn);
    setCategoryId(product.categoryId);
    setBarcode(product.barcode);
    setSku(product.sku);
    setPrice(product.price);
    setCostPrice(product.costPrice || 0);
    setWholesalePrice(product.wholesalePrice || Math.round(product.price * 0.85));
    setWholesaleMinQty(product.wholesaleMinQty || 12);
    setWholesaleUnit(product.wholesaleUnit || 'كرتونة');
    setWholesaleUnitMultiplier(product.wholesaleUnitMultiplier || 12);
    setTradeType(product.tradeType || 'both');
    setStock(product.stock);
    setMinStock(product.minStock);
    setUnit(product.unit);
    setImage(product.image || '');
    setDescriptionAr(product.descriptionAr || '');
    setTargetDeviceRole(product.targetDeviceRole || 'kitchen_display');
    setTargetStationName(product.targetStationName || 'شاشة المطبخ الرئيسية (KDS)');
    setIsFavorite(product.isFavorite || false);
    setIdentificationCodes(product.identificationCodes ? [...product.identificationCodes] : []);
    setNewCodeInput('');
    setBulkCodesInput('');
    setShowBulkCodesBox(false);
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameAr.trim() || price <= 0) {
      notify('تنبيه', 'يرجى إدخال اسم المنتج وسعر البيع بالعملة المحددة', 'warning');
      return;
    }

    const payload = {
      nameAr,
      nameEn: nameEn || nameAr,
      categoryId,
      barcode,
      sku,
      price: Number(price),
      costPrice: Number(costPrice) || 0,
      wholesalePrice: Number(wholesalePrice) || Number(price),
      wholesaleMinQty: Number(wholesaleMinQty) || 1,
      wholesaleUnit: wholesaleUnit || 'كرتونة',
      wholesaleUnitMultiplier: Number(wholesaleUnitMultiplier) || 1,
      tradeType,
      identificationCodes,
      stock: Number(stock),
      minStock: Number(minStock),
      unit: unit || 'قطعة',
      image: image.trim() || undefined,
      descriptionAr: descriptionAr.trim() || undefined,
      targetDeviceRole,
      targetStationName: targetStationName.trim() || 'شاشة المطبخ الرئيسية (KDS)',
      isFavorite,
      status: 'active' as const,
    };

    if (editingProduct) {
      updateProduct(editingProduct.id, payload);
      notify('تم بنجاح', `تم تحديث بيانات المنتج (${nameAr}) بسعر ${formatCurrency(price)}`, 'success');
    } else {
      addProduct(payload);
      notify('تم بنجاح', `تم إضافة المنتج الجديد (${nameAr}) بسعر ${formatCurrency(price)}`, 'success');
    }

    setIsProductModalOpen(false);
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatNameAr.trim()) return;
    addCategory({
      nameAr: newCatNameAr.trim(),
      nameEn: (newCatNameEn || newCatNameAr).trim(),
      color: '#f59e0b',
      icon: 'tag',
      sortOrder: categories.length + 1,
    });
    setNewCatNameAr('');
    setNewCatNameEn('');
    notify('تم بنجاح', 'تمت إضافة التصنيف الجديد', 'success');
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (selectedCat !== 'all' && p.categoryId !== selectedCat) return false;
      if (stockFilter === 'in_stock' && p.stock <= p.minStock) return false;
      if (stockFilter === 'low_stock' && p.stock > p.minStock) return false;
      if (stockFilter === 'out_of_stock' && p.stock > 0) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = p.nameAr.toLowerCase().includes(query) || p.nameEn.toLowerCase().includes(query);
        const matchesBarcode = p.barcode.toLowerCase().includes(query);
        const matchesSku = p.sku.toLowerCase().includes(query);
        const matchesIdentification = p.identificationCodes?.some(c => c.toLowerCase().includes(query));
        if (!matchesName && !matchesBarcode && !matchesSku && !matchesIdentification) return false;
      }
      return true;
    });
  }, [products, selectedCat, stockFilter, searchQuery]);

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-5 bg-transparent">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>{t('productsTitle')}</span>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
              · {currencySymbol} ({currencyCode})
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            إدارة كتالوج الأصناف، أسعار الشراء والمفرق والجملة، ونظام الإنذار المبكر لنقص المخزون
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* RED LOW STOCK ALERT BUTTON IN HEADER */}
          <button
            type="button"
            id="btn-open-low-stock-quick-report"
            onClick={() => setIsLowStockReportOpen(true)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer active:scale-95 whitespace-nowrap ${
              lowStockAlertProducts.length > 0
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/35 ring-2 ring-rose-400/60'
                : 'apple-glass-card text-emerald-700 dark:text-emerald-400'
            }`}
            title="عرض التقرير السريع للمنتجات التي وصلت للحد الأدنى"
          >
            <span className="relative flex h-2.5 w-2.5">
              {lowStockAlertProducts.length > 0 && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-85" />
              )}
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  lowStockAlertProducts.length > 0 ? 'bg-white' : 'bg-emerald-500'
                }`}
              />
            </span>
            <BellRing className="w-4 h-4" />
            <span>
              تقرير النواقص السريع ({lowStockAlertProducts.length})
            </span>
          </button>

          {/* Shortcut to Purchase from Companies & Suppliers */}
          <button
            type="button"
            onClick={() => {
              setProductsToRestockInPurchase([]);
              setIsSupplierPurchaseModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-black rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap"
            title="فتح نافذة الشراء والتوريد من الشركات والموردين"
          >
            <Truck className="w-4 h-4" />
            <span>الشراء من الشركات والموردين</span>
          </button>

          {/* Camera Barcode Scanner */}
          <button
            type="button"
            id="btn-scan-product-camera"
            onClick={() => {
              setCameraScanTarget('catalog');
              setIsCameraScannerOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap"
            title="ماسح الباركود بالكاميرا"
          >
            <Camera className="w-4 h-4" />
            <span>ماسح الكاميرا</span>
          </button>

          {/* Barcode Designer & Sticker Printer */}
          <button
            type="button"
            onClick={() => {
              setBarcodeProductTarget(products[0] || null);
              setIsBarcodeDesignerOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 apple-glass-card text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap"
            title="مصمم وطباعة ملصقات الباركود للمنتجات"
          >
            <BarcodeIcon className="w-4 h-4" />
            <span>طباعة الباركود</span>
          </button>

          {/* Manage Categories */}
          <button
            type="button"
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 apple-glass-card text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap"
          >
            <Layers className="w-4 h-4 text-amber-500" />
            <span>التصنيفات</span>
          </button>

          {/* Add Product Button */}
          <button
            type="button"
            id="btn-add-new-product"
            onClick={() => openAddModal()}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 text-xs font-black rounded-xl shadow-md shadow-amber-500/20 transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addProduct')}</span>
          </button>
        </div>
      </div>

      {/* RED ILLUMINATED LOW STOCK ALERT BANNER (يضيء باللون الأحمر عند وصول أي منتج للحد الأدنى) */}
      {lowStockAlertProducts.length > 0 && (
        <div
          id="low-stock-red-alert-banner"
          className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-600/15 via-rose-500/10 to-red-600/15 dark:from-rose-950/70 dark:via-red-950/50 dark:to-rose-900/60 border-2 border-rose-500 dark:border-rose-500/90 p-4 sm:p-5 shadow-lg shadow-rose-500/15 transition-all"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              {/* Glowing Red Siren Icon */}
              <div className="relative w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-rose-600/50">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-2xl bg-rose-500 opacity-40" />
                <AlertOctagon className="w-6 h-6 relative z-10 animate-pulse" />
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-rose-600 text-white text-[11px] font-black shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                    إنذار أحمر للمخزون (Low Stock Alert)
                  </span>
                  <h3 className="text-sm sm:text-base font-black text-rose-950 dark:text-rose-100">
                    تنبيه: وصلت كمية {lowStockAlertProducts.length} منتجات إلى مستوى المخزون الأدنى!
                  </h3>
                </div>

                <p className="text-xs text-rose-800 dark:text-rose-200/90 font-semibold">
                  يوجد <strong className="font-mono underline">{outOfStockCount}</strong> صنف نافذ تماماً (رصيد 0) و{' '}
                  <strong className="font-mono underline">{criticalThresholdCount}</strong> صنف عند الحد الأدنى للطلب:{' '}
                  <span className="font-bold text-rose-950 dark:text-white">
                    {lowStockAlertProducts
                      .slice(0, 4)
                      .map(p => `${p.nameAr} (${p.stock} ${p.unit})`)
                      .join(' · ')}
                    {lowStockAlertProducts.length > 4 ? ` · +${lowStockAlertProducts.length - 4} أخرى` : ''}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsLowStockReportOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md shadow-rose-600/30 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>عرض قائمة النواقص في تقرير سريع</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setStockFilter(stockFilter === 'low_stock' ? 'all' : 'low_stock')
                }
                className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer whitespace-nowrap ${
                  stockFilter === 'low_stock'
                    ? 'bg-rose-900 text-white border-rose-800'
                    : 'bg-white/90 dark:bg-slate-900/90 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800 hover:bg-rose-50'
                }`}
              >
                {stockFilter === 'low_stock' ? 'إلغاء حصر الجدول وعرض الكل' : 'حصر الجدول بالنواقص فقط'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="apple-glass-card p-4 rounded-3xl flex flex-col sm:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="بحث بالاسم، الباركود، أو الرمز (SKU)..."
            className="w-full ps-10 pe-9 py-2 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute start-3 top-2.5" />
          <button
            type="button"
            onClick={() => {
              setCameraScanTarget('catalog');
              setIsCameraScannerOpen(true);
            }}
            className="absolute end-2 top-2 p-1 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title="مسح باركود بالكاميرا"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>

        {/* Category Filter */}
        <div className="w-full sm:w-auto">
          <select
            value={selectedCat}
            onChange={e => setSelectedCat(e.target.value)}
            className="w-full sm:w-44 py-2 px-3 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none"
          >
            <option value="all">جميع التصنيفات</option>
            {categories.filter(c => c.id !== 'cat_all').map(c => (
              <option key={c.id} value={c.id}>
                {language === 'ar' ? c.nameAr : c.nameEn}
              </option>
            ))}
          </select>
        </div>

        {/* Stock Filter */}
        <div className="w-full sm:w-auto">
          <select
            value={stockFilter}
            onChange={e => setStockFilter(e.target.value as any)}
            className="w-full sm:w-48 py-2 px-3 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none"
          >
            <option value="all">كل الحالات ({products.length})</option>
            <option value="in_stock">متوفر بالمخزون الآمن</option>
            <option value="low_stock">🚨 وصل للحد الأدنى أو نفد ({lowStockAlertProducts.length})</option>
            <option value="out_of_stock">⛔ نفد تماماً (0) ({outOfStockCount})</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="apple-glass-card rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <th className="py-3.5 px-4 text-start">المنتج وحالة الإنذار</th>
                <th className="py-3.5 px-3 text-start">التصنيف</th>
                <th className="py-3.5 px-3 text-start">الباركود / SKU</th>
                <th className="py-3.5 px-3 text-end">سعر الشراء ({currencySymbol})</th>
                <th className="py-3.5 px-3 text-end">سعر المفرق ({currencySymbol})</th>
                <th className="py-3.5 px-3 text-end">سعر الجملة ({currencySymbol})</th>
                <th className="py-3.5 px-3 text-center">المخزون والحد الأدنى</th>
                <th className="py-3.5 px-4 text-end">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Package className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                    <p className="text-xs font-bold">{t('noProductsFound')}</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map(product => {
                  const cat = categories.find(c => c.id === product.categoryId);
                  const isOutOfStock = product.stock <= 0;
                  const isLowStock = product.stock <= product.minStock;

                  return (
                    <tr
                      key={product.id}
                      className={`transition-colors ${
                        isLowStock
                          ? 'bg-rose-50/75 dark:bg-rose-950/30 border-s-4 border-s-rose-600 hover:bg-rose-100/60 dark:hover:bg-rose-950/45'
                          : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      {/* Product Name & Red Low Stock Indicator */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`relative w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden ${
                              isLowStock
                                ? 'bg-rose-600 text-white ring-2 ring-rose-400 shadow-md shadow-rose-600/30'
                                : 'bg-amber-500/10 text-amber-600'
                            }`}
                          >
                            {product.image ? (
                              <img
                                src={product.image}
                                alt={product.nameAr}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              product.nameAr.charAt(0)
                            )}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-bold text-slate-900 dark:text-white">
                                {language === 'ar' ? product.nameAr : product.nameEn}
                              </span>
                              {product.isFavorite && (
                                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                              )}
                              {isLowStock && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-black shadow-xs animate-pulse">
                                  <AlertOctagon className="w-3 h-3" />
                                  <span>{isOutOfStock ? 'نافذ (0)' : 'وصل للحد الأدنى'}</span>
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400">
                              <span>الوحدة: {product.unit}</span>
                              <span>·</span>
                              <span>الحد الأدنى: {product.minStock}</span>
                              {product.wholesaleUnit && (
                                <span className="text-amber-600 dark:text-amber-400 font-semibold">
                                  · {product.wholesaleUnit} ({product.wholesaleUnitMultiplier || 1})
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3">
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                          {cat ? (language === 'ar' ? cat.nameAr : cat.nameEn) : 'عام'}
                        </span>
                      </td>

                      {/* Barcode & SKU */}
                      <td className="py-3 px-3 font-mono tabular-nums">
                        <p className="text-slate-900 dark:text-white font-bold">{product.barcode}</p>
                        <span className="text-[10px] text-slate-400">{product.sku}</span>
                      </td>

                      {/* Cost Price with Currency */}
                      <td className="py-3 px-3 text-end font-mono tabular-nums text-slate-600 dark:text-slate-400">
                        <span className="font-bold">{formatCurrency(product.costPrice)}</span>
                      </td>

                      {/* Retail Price with Currency */}
                      <td className="py-3 px-3 text-end font-mono tabular-nums font-black text-blue-600 dark:text-blue-400">
                        {formatCurrency(product.price)}
                      </td>

                      {/* Wholesale Price with Currency */}
                      <td className="py-3 px-3 text-end font-mono tabular-nums font-black text-amber-600 dark:text-amber-400">
                        {formatCurrency(product.wholesalePrice || product.price)}
                      </td>

                      {/* Stock Level with Decrement (-) & Increment (+) Buttons & Red Alert Glow */}
                      <td className="py-3 px-3 text-center">
                        <div
                          className={`inline-flex items-center gap-1 p-1 rounded-xl border transition-all ${
                            isLowStock
                              ? 'bg-rose-600/15 dark:bg-rose-950/80 border-rose-500 shadow-sm shadow-rose-500/25'
                              : 'bg-slate-100/80 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/80'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              adjustStock(product.id, -1, 'adjustment', 'تنقيص سريع للمنتج من صفحة الأصناف')
                            }
                            disabled={product.stock <= 0}
                            className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 hover:bg-rose-600 hover:text-white text-rose-600 dark:text-rose-400 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center transition-colors shadow-2xs cursor-pointer active:scale-90"
                            title="تنقيص مخزون المنتج (-1)"
                            aria-label="تنقيص مخزون المنتج"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>

                          <span
                            className={`font-mono tabular-nums font-black text-xs px-2.5 py-1 rounded-lg inline-flex items-center gap-1 min-w-[70px] justify-center ${
                              isLowStock
                                ? 'bg-rose-600 text-white shadow-xs animate-pulse'
                                : 'text-emerald-700 dark:text-emerald-400'
                            }`}
                          >
                            {isLowStock && <AlertTriangle className="w-3 h-3 text-white shrink-0" />}
                            <span>{product.stock}</span>
                            <span className="text-[10px]">{product.unit}</span>
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              adjustStock(product.id, 1, 'restock', 'زيادة سريعة للمنتج من صفحة الأصناف')
                            }
                            className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 hover:bg-emerald-600 hover:text-white text-emerald-600 dark:text-emerald-400 flex items-center justify-center transition-colors shadow-2xs cursor-pointer active:scale-90"
                            title="زيادة مخزون المنتج (+1)"
                            aria-label="زيادة مخزون المنتج"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-end">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setBarcodeProductTarget(product);
                              setIsBarcodeDesignerOpen(true);
                            }}
                            className="p-1.5 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
                            title="تصميم وطباعة ملصق الباركود لهذا المنتج"
                          >
                            <BarcodeIcon className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(product)}
                            className="p-1.5 rounded-xl text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
                            title="تعديل المنتج والأسعار"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`هل أنت متأكد من حذف المنتج (${product.nameAr})؟`)) {
                                deleteProduct(product.id);
                              }
                            }}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="حذف المنتج"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QUICK LOW-STOCK REPORT MODAL (تقرير سريع للمنتجات التي وصلت للحد الأدنى) */}
      {isLowStockReportOpen && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full shadow-2xl border-2 border-rose-500/80 overflow-hidden my-4">
            {/* Report Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-rose-600 to-red-600 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                  <AlertOctagon className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg">
                    التقرير السريع للمنتجات المنخفضة والنافذة (Low Stock Quick Report)
                  </h3>
                  <p className="text-xs text-rose-100">
                    قائمة فورية بجميع الأصناف التي وصلت إلى الحد الأدنى للمخزون أو نفدت تماماً مع تكلفة إعادة الشراء
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={handleExportLowStockCSV}
                  disabled={lowStockAlertProducts.length === 0}
                  className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تصدير CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsLowStockReportOpen(false)}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/25 text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Summary KPIs inside Quick Report */}
            <div className="p-4 sm:p-5 bg-rose-50/40 dark:bg-rose-950/20 border-b border-rose-200/70 dark:border-rose-900/50 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800/80">
                <span className="text-[11px] font-bold text-slate-500 block">إجمالي الأصناف الحرجة</span>
                <span className="text-xl font-black font-mono tabular-nums text-rose-600 dark:text-rose-400">
                  {lowStockAlertProducts.length} صنف
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800/80">
                <span className="text-[11px] font-bold text-slate-500 block">أصناف رصيدها صفر (نافذة)</span>
                <span className="text-xl font-black font-mono tabular-nums text-red-600 dark:text-red-400">
                  {outOfStockCount} صنف
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800/80">
                <span className="text-[11px] font-bold text-slate-500 block">وصلت للحد الأدنى</span>
                <span className="text-xl font-black font-mono tabular-nums text-amber-600 dark:text-amber-400">
                  {criticalThresholdCount} صنف
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800/80">
                <span className="text-[11px] font-bold text-slate-500 block">تكلفة التعويض التقديرية</span>
                <span className="text-lg font-black font-mono tabular-nums text-slate-900 dark:text-white">
                  {formatCurrency(totalEstimatedRestockCost)}
                </span>
              </div>
            </div>

            {/* Report Table */}
            <div className="p-4 sm:p-5 max-h-[55vh] overflow-y-auto">
              {lowStockAlertProducts.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    جميع المنتجات في المستوى الآمن!
                  </h4>
                  <p className="text-xs text-slate-500">
                    لا يوجد حالياً أي منتج وصل إلى الحد الأدنى للمخزون.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-start">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                        <th className="py-2.5 px-3 text-start">المنتج</th>
                        <th className="py-2.5 px-3 text-center">الرصيد الحالي</th>
                        <th className="py-2.5 px-3 text-center">الحد الأدنى</th>
                        <th className="py-2.5 px-3 text-center">الكمية المقترحة</th>
                        <th className="py-2.5 px-3 text-end">سعر الشراء</th>
                        <th className="py-2.5 px-3 text-end">تكلفة التوريد</th>
                        <th className="py-2.5 px-3 text-end">توريد فوري</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
                      {lowStockAlertProducts.map(item => {
                        const targetStock = Math.max(item.minStock * 2, item.minStock + 10);
                        const suggestedOrder = Math.max(1, targetStock - item.stock);
                        const lineCost = suggestedOrder * (item.costPrice || 0);

                        return (
                          <tr key={item.id} className="hover:bg-rose-50/40 dark:hover:bg-rose-950/20">
                            <td className="py-3 px-3">
                              <div className="font-black text-slate-900 dark:text-white">{item.nameAr}</div>
                              <div className="text-[10px] font-mono text-slate-400">
                                {item.barcode} · {item.sku}
                              </div>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-mono tabular-nums font-black text-xs inline-block">
                                {item.stock} {item.unit}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center font-mono tabular-nums font-bold text-slate-600 dark:text-slate-300">
                              {item.minStock} {item.unit}
                            </td>
                            <td className="py-3 px-3 text-center font-mono tabular-nums font-black text-emerald-600 dark:text-emerald-400">
                              +{suggestedOrder} {item.unit}
                            </td>
                            <td className="py-3 px-3 text-end font-mono tabular-nums text-slate-600 dark:text-slate-300">
                              {formatCurrency(item.costPrice)}
                            </td>
                            <td className="py-3 px-3 text-end font-mono tabular-nums font-black text-slate-900 dark:text-white">
                              {formatCurrency(lineCost)}
                            </td>
                            <td className="py-3 px-3 text-end">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    adjustStock(item.id, 10, 'restock', 'توريد سريع (+10) من تقرير النواقص')
                                  }
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold text-[11px] cursor-pointer active:scale-95"
                                >
                                  +10
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    adjustStock(
                                      item.id,
                                      suggestedOrder,
                                      'restock',
                                      'تعويض للمستوى الآمن من تقرير النواقص'
                                    )
                                  }
                                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-[11px] cursor-pointer active:scale-95"
                                >
                                  تعويض (+{suggestedOrder})
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Report Footer Actions */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                {lowStockAlertProducts.length > 0 && (
                  <button
                    type="button"
                    onClick={handleRestockAllLowProducts}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>تعويض وتوريد جميع النواقص دفعة واحدة</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setIsLowStockReportOpen(false);
                    setProductsToRestockInPurchase(lowStockAlertProducts);
                    setIsSupplierPurchaseModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>شراء وتوريد النواقص من الشركات والموردين</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsLowStockReportOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold cursor-pointer"
              >
                إغلاق التقرير
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Add / Edit Modal with explicit Currency inputs and Wholesale controls */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {editingProduct ? 'تعديل بيانات وأسعار المنتج' : 'إضافة منتج جديد للكتالوج'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    العملة المعتمدة: <strong className="font-mono text-amber-600">{currencySymbol} ({currencyCode})</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-5 sm:p-6 space-y-4 max-h-[82vh] overflow-y-auto">
              {/* Names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    اسم المنتج (بالعربية) *
                  </label>
                  <input
                    type="text"
                    required
                    value={nameAr}
                    onChange={e => setNameAr(e.target.value)}
                    placeholder="مثال: زيت نباتي 1 لتر"
                    className="w-full text-xs font-bold px-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    اسم المنتج (بالإنجليزية)
                  </label>
                  <input
                    type="text"
                    value={nameEn}
                    onChange={e => setNameEn(e.target.value)}
                    placeholder="e.g. Cooking Oil 1L"
                    className="w-full text-xs font-bold px-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Category & Single Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    التصنيف
                  </label>
                  <select
                    value={categoryId}
                    onChange={e => setCategoryId(e.target.value)}
                    className="w-full text-xs font-bold px-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none"
                  >
                    {categories.filter(c => c.id !== 'cat_all').map(c => (
                      <option key={c.id} value={c.id}>
                        {language === 'ar' ? c.nameAr : c.nameEn}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    وحدة القياس الفردية
                  </label>
                  <input
                    type="text"
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                    placeholder="قطعة، كغ، علبة، لتر..."
                    className="w-full text-xs font-bold px-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none"
                  />
                </div>
              </div>

              {/* Barcode & SKU */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      الباركود (Barcode) *
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCameraScanTarget('modal_field');
                          setIsCameraScannerOpen(true);
                        }}
                        className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Camera className="w-3 h-3" />
                        مسح بالكاميرا
                      </button>
                      <button
                        type="button"
                        onClick={() => setBarcode(generateRandomEan13())}
                        className="text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3" />
                        توليد تلقائي
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    required
                    value={barcode}
                    onChange={e => setBarcode(e.target.value)}
                    placeholder="امسح بالماسح أو اكتب..."
                    className="w-full text-xs font-mono font-bold px-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500"
                  />
                  {barcode && (
                    <div className="mt-1.5 p-1 bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center">
                      <div
                        className="w-full flex justify-center"
                        dangerouslySetInnerHTML={{
                          __html: generateBarcodeSvg(barcode, {
                            height: 28,
                            width: 1.5,
                            showText: true,
                            fontSize: 10
                          })
                        }}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    الرمز المخزني (SKU)
                  </label>
                  <input
                    type="text"
                    value={sku}
                    onChange={e => setSku(e.target.value)}
                    placeholder="SKU-101"
                    className="w-full text-xs font-mono font-bold px-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none"
                  />
                </div>
              </div>

              {/* PRICING SECTION */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-amber-500" />
                    <span>تسعير المنتج بالعملة ({currencySymbol}):</span>
                  </span>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    هامش الربح: +{profitMarginPercent}% ({formatCurrency(profitAmount)})
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* 1. Cost Price */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      سعر الشراء (التكلفة)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        value={costPrice || ''}
                        onChange={e => setCostPrice(Number(e.target.value))}
                        className="w-full text-sm font-bold font-mono py-2 px-2.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl border border-slate-300 dark:border-slate-600 focus:outline-none focus:border-amber-500"
                      />
                      <span className="absolute end-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                        {currencySymbol}
                      </span>
                    </div>
                  </div>

                  {/* 2. Retail Sale Price */}
                  <div>
                    <label className="block text-[11px] font-bold text-blue-600 dark:text-blue-400 mb-1">
                      سعر البيع بالمفرق *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        required
                        min={0}
                        value={price || ''}
                        onChange={e => setPrice(Number(e.target.value))}
                        className="w-full text-sm font-black font-mono py-2 px-2.5 bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 rounded-xl border-2 border-blue-400 dark:border-blue-600 focus:outline-none"
                      />
                      <span className="absolute end-2.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-blue-600">
                        {currencySymbol}
                      </span>
                    </div>
                  </div>

                  {/* 3. Wholesale Price */}
                  <div>
                    <label className="block text-[11px] font-bold text-amber-600 dark:text-amber-400 mb-1">
                      سعر البيع بالجملة
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        value={wholesalePrice || ''}
                        onChange={e => setWholesalePrice(Number(e.target.value))}
                        className="w-full text-sm font-bold font-mono py-2 px-2.5 bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-300 rounded-xl border border-amber-300 dark:border-amber-700 focus:outline-none"
                      />
                      <span className="absolute end-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-amber-500">
                        {currencySymbol}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Wholesale Packaging Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      اسم وحدة الجملة (التعبئة)
                    </label>
                    <input
                      type="text"
                      value={wholesaleUnit}
                      onChange={e => setWholesaleUnit(e.target.value)}
                      placeholder="كرتونة، صندوق، طرد، باقة..."
                      className="w-full text-xs font-bold px-3 py-1.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      عدد القطع في وحدة الجملة
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={wholesaleUnitMultiplier || ''}
                      onChange={e => setWholesaleUnitMultiplier(Number(e.target.value))}
                      className="w-full text-xs font-bold font-mono px-3 py-1.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Stock and Low Stock Minimum Alert Threshold */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    الكمية المتوفرة بالمستودع حالياً
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setStock(Math.max(0, Number(stock) - 1))}
                      className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 hover:bg-rose-600 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      min={0}
                      value={stock}
                      onChange={e => setStock(Math.max(0, Number(e.target.value)))}
                      className="flex-1 text-center text-sm font-black font-mono px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => setStock(Number(stock) + 1)}
                      className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 hover:bg-emerald-600 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-rose-600 dark:text-rose-400 mb-1 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>حد الطلب الأدنى (يضيء بالأحمر عنده) *</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={minStock}
                    onChange={e => setMinStock(Math.max(0, Number(e.target.value)))}
                    className="w-full text-sm font-bold font-mono px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-rose-300 dark:border-rose-700 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Product Image & Customer QR Menu Target Device Routing (QR Menu routing only in restaurant mode) */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-amber-500" />
                    <span>
                      {businessMode === 'restaurant'
                        ? 'صورة المنتج وتوجيه طلبات منيو الزبون (QR)'
                        : 'صورة المنتج التوضيحية'}
                    </span>
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                    {image ? (
                      <img src={image} alt="product" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <input
                      ref={productImgInputRef}
                      type="file"
                      accept="image/*"
                      onChange={async e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const dataUrl = await compressImageFile(file, 700, 0.82);
                          setImage(dataUrl);
                        } catch {}
                      }}
                      className="hidden"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => productImgInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>رفع صورة للمنتج</span>
                      </button>
                      {image && (
                        <button
                          type="button"
                          onClick={() => setImage('')}
                          className="px-2.5 py-1.5 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 text-xs font-bold cursor-pointer"
                        >
                          حذف الصورة
                        </button>
                      )}
                    </div>
                    <input
                      type="url"
                      value={image}
                      onChange={e => setImage(e.target.value)}
                      placeholder="أو الصق رابط صورة مباشر (https://...)"
                      className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                    />
                  </div>
                </div>

                {/* Quick food & drink image presets & QR Menu routing — Strictly Restaurant Only */}
                {businessMode === 'restaurant' && (
                  <>
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                      {PRESET_FOOD_IMAGES.map(preset => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setImage(preset.url)}
                          className={`shrink-0 w-12 h-12 rounded-xl overflow-hidden border-2 cursor-pointer ${
                            image === preset.url ? 'border-amber-500' : 'border-transparent'
                          }`}
                          title={preset.label}
                        >
                          <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>

                    {/* Target Device Routing & Description */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1">
                          <Monitor className="w-3.5 h-3.5 text-blue-500" />
                          <span>الجهاز الموجه له الطلب (يظهر وين):</span>
                        </label>
                        <select
                          value={targetDeviceRole}
                          onChange={e => {
                            const r = e.target.value as DeviceRole | 'all';
                            setTargetDeviceRole(r);
                            const opt = TARGET_DEVICE_OPTIONS.find(o => o.role === r);
                            if (opt) setTargetStationName(opt.labelAr);
                          }}
                          className="w-full px-2.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                        >
                          {TARGET_DEVICE_OPTIONS.map(opt => (
                            <option key={opt.role} value={opt.role}>
                              {opt.labelAr}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                          وصف المنتج في صفحة الزبون:
                        </label>
                        <input
                          type="text"
                          value={descriptionAr}
                          onChange={e => setDescriptionAr(e.target.value)}
                          placeholder="مثال: مع البطاطا والصوص الخاص..."
                          className="w-full px-2.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 text-xs font-black rounded-xl shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  {editingProduct ? 'حفظ التعديلات' : 'إضافة المنتج'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Manager Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                إدارة تصنيفات المنتجات
              </h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <form onSubmit={handleAddCategory} className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="اسم التصنيف بالعربية..."
                  value={newCatNameAr}
                  onChange={e => setNewCatNameAr(e.target.value)}
                  className="flex-1 text-xs font-bold px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl shrink-0 cursor-pointer"
                >
                  إضافة
                </button>
              </form>

              <div className="max-h-60 overflow-y-auto space-y-1.5 divide-y divide-slate-100 dark:divide-slate-800">
                {categories.filter(c => c.id !== 'cat_all').map(c => (
                  <div key={c.id} className="pt-1.5 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {c.nameAr} ({c.nameEn})
                    </span>
                    <button
                      onClick={() => {
                        if (confirm(`هل أنت متأكد من حذف التصنيف (${c.nameAr})؟`)) {
                          deleteCategory(c.id);
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Designer & Label Printing Modal */}
      {isBarcodeDesignerOpen && (
        <BarcodeDesignerModal
          isOpen={isBarcodeDesignerOpen}
          onClose={() => setIsBarcodeDesignerOpen(false)}
          initialProduct={barcodeProductTarget || undefined}
        />
      )}

      {/* Camera Barcode Scanner Modal */}
      <ProductBarcodeScannerModal
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        initialAction={cameraScanTarget === 'modal_field' ? 'field_capture' : 'auto_add'}
        onScanBarcodeDirect={
          cameraScanTarget === 'modal_field'
            ? code => {
                setBarcode(code);
              }
            : undefined
        }
        onEditProductRequest={prod => {
          setIsCameraScannerOpen(false);
          openEditModal(prod);
        }}
        onOpenAddModalWithBarcode={scannedBarcode => {
          setIsCameraScannerOpen(false);
          openAddModal(scannedBarcode);
        }}
      />

      {/* Smart Supplier Purchase & Inventory Restock Modal */}
      <SupplierPurchaseModal
        isOpen={isSupplierPurchaseModalOpen}
        onClose={() => {
          setIsSupplierPurchaseModalOpen(false);
          setProductsToRestockInPurchase([]);
        }}
        initialProductsToRestock={productsToRestockInPurchase}
      />
    </div>
  );
};
