import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, Category, TradeType } from '../../types';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Star,
  Package,
  Layers,
  Sparkles,
  X,
  Check,
  Tag,
  ScanBarcode,
  UploadCloud,
  Copy,
  Boxes,
  Percent,
  Coins,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Barcode as BarcodeIcon,
  Printer,
  ListPlus,
  Hash
} from 'lucide-react';
import { BarcodeDesignerModal } from '../barcode/BarcodeDesignerModal';
import { generateBarcodeSvg, generateRandomEan13 } from '../../utils/barcodeUtils';

export const ProductsView: React.FC = () => {
  const {
    products,
    categories,
    addProduct,
    updateProduct,
    deleteProduct,
    addCategory,
    deleteCategory,
    formatCurrency,
    t,
    language,
    settings,
    notify
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');

  // Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Barcode Designer State
  const [isBarcodeDesignerOpen, setIsBarcodeDesignerOpen] = useState(false);
  const [barcodeProductTarget, setBarcodeProductTarget] = useState<Product | null>(null);

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
  const [isFavorite, setIsFavorite] = useState(false);

  // Identification codes (supporting 100+ codes per product for wholesale / retail)
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
    setImage('https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&auto=format&fit=crop&q=60');
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
      image,
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
      if (stockFilter === 'low_stock' && (p.stock > p.minStock || p.stock <= 0)) return false;
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
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-5 bg-slate-50/50 dark:bg-slate-950">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>{t('productsTitle')}</span>
            <span className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold px-2.5 py-0.5 rounded-full font-mono">
              العملة: {currencySymbol} ({currencyCode})
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            إدارة كتالوج الأصناف، أسعار المفرق والجملة بالعملة، وحدود تنبيهات النقص
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Barcode Designer & Sticker Printer */}
          <button
            type="button"
            onClick={() => {
              setBarcodeProductTarget(products[0] || null);
              setIsBarcodeDesignerOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 text-xs font-black rounded-xl shadow-sm hover:opacity-90 transition-all cursor-pointer"
            title="مصمم وطباعة ملصقات الباركود للمنتجات"
          >
            <BarcodeIcon className="w-4 h-4" />
            <span>طباعة الباركودات</span>
          </button>

          {/* Manage Categories */}
          <button
            type="button"
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 transition-all cursor-pointer"
          >
            <Layers className="w-4 h-4 text-amber-500" />
            <span>إدارة التصنيفات</span>
          </button>

          {/* Add Product Button */}
          <button
            type="button"
            id="btn-add-new-product"
            onClick={() => openAddModal()}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-black rounded-xl shadow-md shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addProduct')} (مع السعر والعملة)</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="بحث بالاسم، الباركود، أو الرمز (SKU)..."
            className="w-full pl-3 pr-9 py-2 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute start-3 top-2.5" />
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
            className="w-full sm:w-44 py-2 px-3 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none"
          >
            <option value="all">كل الحالات ({products.length})</option>
            <option value="in_stock">متوفر بالمخزون</option>
            <option value="low_stock">⚠️ قارب على النفاد (حد الطلب)</option>
            <option value="out_of_stock">⛔ نفد من المخزون (0)</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <th className="py-3.5 px-4 text-start">المنتج</th>
                <th className="py-3.5 px-3 text-start">التصنيف</th>
                <th className="py-3.5 px-3 text-start">الباركود / SKU</th>
                <th className="py-3.5 px-3 text-end">سعر التكلفة ({currencySymbol})</th>
                <th className="py-3.5 px-3 text-end">سعر المفرق ({currencySymbol})</th>
                <th className="py-3.5 px-3 text-end">سعر الجملة ({currencySymbol})</th>
                <th className="py-3.5 px-3 text-center">المخزون الحالي</th>
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
                  const isLowStock = product.stock <= product.minStock && !isOutOfStock;

                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Product Name & Photo */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                            {product.image ? (
                              <img src={product.image} alt={product.nameAr} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              product.nameAr.charAt(0)
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 dark:text-white">
                                {language === 'ar' ? product.nameAr : product.nameEn}
                              </span>
                              {product.isFavorite && (
                                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400">
                              <span>الوحدة: {product.unit}</span>
                              {product.wholesaleUnit && (
                                <span className="text-amber-600 dark:text-amber-400 font-semibold">
                                  • {product.wholesaleUnit} ({product.wholesaleUnitMultiplier || 1} قطعة)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3">
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {cat ? (language === 'ar' ? cat.nameAr : cat.nameEn) : 'عام'}
                        </span>
                      </td>

                      {/* Barcode & SKU */}
                      <td className="py-3 px-3 font-mono">
                        <p className="text-slate-900 dark:text-white font-bold">{product.barcode}</p>
                        <span className="text-[10px] text-slate-400">{product.sku}</span>
                      </td>

                      {/* Cost Price with Currency */}
                      <td className="py-3 px-3 text-end font-mono text-slate-500 dark:text-slate-400">
                        <span className="font-semibold">{formatCurrency(product.costPrice)}</span>
                      </td>

                      {/* Retail Price with Currency */}
                      <td className="py-3 px-3 text-end font-mono font-bold text-blue-600 dark:text-blue-400">
                        <span className="px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/40">
                          {formatCurrency(product.price)}
                        </span>
                      </td>

                      {/* Wholesale Price with Currency */}
                      <td className="py-3 px-3 text-end font-mono font-bold text-amber-600 dark:text-amber-400">
                        <span className="px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/40">
                          {formatCurrency(product.wholesalePrice || product.price)}
                        </span>
                      </td>

                      {/* Stock Level */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`font-mono font-bold text-xs px-2.5 py-1 rounded-xl inline-flex items-center gap-1 ${
                            isOutOfStock
                              ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900'
                              : isLowStock
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900'
                              : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                          }`}
                        >
                          {isLowStock && <AlertTriangle className="w-3 h-3 text-amber-600" />}
                          {product.stock} {product.unit}
                        </span>
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
                    <button
                      type="button"
                      onClick={() => setBarcode(generateRandomEan13())}
                      className="text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      توليد باركود تلقائي
                    </button>
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
                          __html: generateBarcodeSvg(barcode, { width: 180, height: 35, showText: true })
                        }}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    رمز الصنف SKU
                  </label>
                  <input
                    type="text"
                    value={sku}
                    onChange={e => setSku(e.target.value)}
                    className="w-full text-xs font-mono font-bold px-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Identification Codes Section (Supports 100+ codes per product for wholesale / retail) */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <BarcodeIcon className="w-3.5 h-3.5 text-blue-500" />
                    <span>الأكواد والباركودات التعريفية الإضافية (يدعم أكثر من 100 كود تعريفي):</span>
                  </label>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300">
                    {identificationCodes.length} كود مسجل
                  </span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="أدخل كود تعريفي إضافي أو باركود كرتونة..."
                    value={newCodeInput}
                    onChange={e => setNewCodeInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const trimmed = newCodeInput.trim();
                        if (trimmed && !identificationCodes.includes(trimmed)) {
                          setIdentificationCodes(prev => [trimmed, ...prev]);
                          setNewCodeInput('');
                        }
                      }
                    }}
                    className="flex-1 text-xs font-mono px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const trimmed = newCodeInput.trim();
                      if (trimmed && !identificationCodes.includes(trimmed)) {
                        setIdentificationCodes(prev => [trimmed, ...prev]);
                        setNewCodeInput('');
                      }
                    }}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs cursor-pointer"
                  >
                    إضافة
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBulkCodesBox(!showBulkCodesBox)}
                    className="px-3 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <ListPlus className="w-3.5 h-3.5" />
                    <span>لصق مجمع</span>
                  </button>
                </div>

                {showBulkCodesBox && (
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-2">
                    <textarea
                      rows={3}
                      value={bulkCodesInput}
                      onChange={e => setBulkCodesInput(e.target.value)}
                      placeholder="الصق هنا أكثر من 100 كود (كل كود بسطر أو مفصول بفواصل)..."
                      className="w-full text-xs font-mono p-2 bg-white dark:bg-slate-900 rounded-lg border border-amber-300 dark:border-amber-800"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const tokens = bulkCodesInput.split(/[\r\n,\t;]+/).map(t => t.trim()).filter(Boolean);
                          const seen = new Set(identificationCodes);
                          const added: string[] = [];
                          for (const tok of tokens) {
                            if (!seen.has(tok)) {
                              seen.add(tok);
                              added.push(tok);
                            }
                          }
                          setIdentificationCodes(prev => [...added, ...prev]);
                          setBulkCodesInput('');
                          setShowBulkCodesBox(false);
                        }}
                        className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold cursor-pointer"
                      >
                        إدراج الأكواد
                      </button>
                    </div>
                  </div>
                )}

                {identificationCodes.length > 0 && (
                  <div className="max-h-28 overflow-y-auto p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap gap-1">
                    {identificationCodes.map(code => (
                      <span
                        key={code}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-mono border border-slate-200 dark:border-slate-700"
                      >
                        <span>{code}</span>
                        <button
                          type="button"
                          onClick={() => setIdentificationCodes(prev => prev.filter(c => c !== code))}
                          className="text-slate-400 hover:text-rose-500 cursor-pointer"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* PRICING SECTION WITH CLEAR CURRENCY BADGES */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-amber-500" />
                    <span>تسعير المنتج بالعملة ({currencySymbol}):</span>
                  </span>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-900">
                    هامش الربح: +{profitMarginPercent}% ({formatCurrency(profitAmount)})
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* 1. Cost Price */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      سعر التكلفة والشراء
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
                      سعر البيع بالمفرق (تجزئة) *
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
                      عدد القطع في وحدة الجملة (الكرتونة)
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
                  <input
                    type="number"
                    min={0}
                    value={stock || ''}
                    onChange={e => setStock(Number(e.target.value))}
                    className="w-full text-sm font-bold font-mono px-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-700 dark:text-amber-400 mb-1 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>حد الطلب الأدنى (إشعار النقص التلقائي) *</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={minStock || ''}
                    onChange={e => setMinStock(Number(e.target.value))}
                    className="w-full text-sm font-bold font-mono px-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-amber-300 dark:border-amber-700 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  رابط صورة المنتج (اختياري)
                </label>
                <input
                  type="url"
                  value={image}
                  onChange={e => setImage(e.target.value)}
                  placeholder="https://..."
                  className="w-full text-xs font-mono px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none"
                />
              </div>

              {/* Favorite Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="fav-checkbox"
                  checked={isFavorite}
                  onChange={e => setIsFavorite(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
                <label htmlFor="fav-checkbox" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  إضافة للمفضلة وشاشة البيع السريع (⭐)
                </label>
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
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-black rounded-xl shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  {editingProduct ? 'حفظ التعديلات' : 'إضافة المنتج بالعملة'}
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
              {/* Add New Category Form */}
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
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shrink-0 cursor-pointer"
                >
                  إضافة
                </button>
              </form>

              {/* Existing Categories List */}
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
    </div>
  );
};
