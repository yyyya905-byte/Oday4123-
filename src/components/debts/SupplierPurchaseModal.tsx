import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Supplier, Product } from '../../types';
import {
  Building2,
  Package,
  Plus,
  Minus,
  Trash2,
  Search,
  CheckCircle2,
  X,
  Sparkles,
  AlertTriangle,
  Barcode,
  DollarSign,
  TrendingUp,
  Layers,
  Truck,
  FileText,
  UserPlus,
  Users,
  ShoppingBag
} from 'lucide-react';

export interface PurchaseLineItemDraft {
  id: string;
  mode: 'existing' | 'new';
  productId?: string;
  productName: string;
  categoryId: string;
  barcode: string;
  unit: string;
  quantity: number;
  costPrice: number;
  wholesalePrice: number;
  retailPrice: number;
  minStock: number;
  currentStock?: number;
}

interface SupplierPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSupplier?: Supplier | null;
  initialProductsToRestock?: Product[];
}

export const SupplierPurchaseModal: React.FC<SupplierPurchaseModalProps> = ({
  isOpen,
  onClose,
  initialSupplier = null,
  initialProductsToRestock = [],
}) => {
  const {
    suppliers,
    products,
    categories,
    recordSupplierPurchaseInvoice,
    formatCurrency,
    settings,
    notify,
  } = useApp();

  // 1. Supplier State (Existing vs New Company/Supplier)
  const [supplierMode, setSupplierMode] = useState<'existing' | 'new'>('existing');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [newSupplierName, setNewSupplierName] = useState<string>('');
  const [newSupplierCompany, setNewSupplierCompany] = useState<string>('');
  const [newSupplierPhone, setNewSupplierPhone] = useState<string>('');
  const [newSupplierCategory, setNewSupplierCategory] = useState<string>('مواد غذائية وتوريد عام');

  // 2. Item Entry Mode ('existing' from inventory vs 'new' product)
  const [itemEntryMode, setItemEntryMode] = useState<'existing' | 'new'>('existing');
  const [productSearchQuery, setProductSearchQuery] = useState<string>('');
  const [selectedExistingProductId, setSelectedExistingProductId] = useState<string>('');

  // Draft fields for adding an item
  const [draftProductName, setDraftProductName] = useState<string>('');
  const [draftCategoryId, setDraftCategoryId] = useState<string>(categories[0]?.id || 'cat_1');
  const [draftBarcode, setDraftBarcode] = useState<string>('');
  const [draftUnit, setDraftUnit] = useState<string>('قطعة');
  const [draftMinStock, setDraftMinStock] = useState<number>(5);
  const [draftQuantity, setDraftQuantity] = useState<number>(10);
  const [draftCostPrice, setDraftCostPrice] = useState<number | ''>('');
  const [draftWholesalePrice, setDraftWholesalePrice] = useState<number | ''>('');
  const [draftRetailPrice, setDraftRetailPrice] = useState<number | ''>('');

  // 3. Invoice Line Items List
  const [invoiceItems, setInvoiceItems] = useState<PurchaseLineItemDraft[]>([]);

  // 4. Financial & Invoice Metadata
  const [paymentType, setPaymentType] = useState<'credit' | 'cash' | 'partial'>('credit');
  const [paidAmount, setPaidAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer' | 'check'>('cash');
  const [referenceInvoice, setReferenceInvoice] = useState<string>('');
  const [invoiceNotes, setInvoiceNotes] = useState<string>('');

  // Initialize when modal opens
  useEffect(() => {
    if (!isOpen) return;

    if (initialSupplier) {
      setSupplierMode('existing');
      setSelectedSupplierId(initialSupplier.id);
    } else if (suppliers.length > 0) {
      setSupplierMode('existing');
      setSelectedSupplierId(suppliers[0].id);
    } else {
      setSupplierMode('new');
    }

    setReferenceInvoice(`PUR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
    setInvoiceNotes('');
    setPaymentType('credit');
    setPaidAmount('');

    if (initialProductsToRestock && initialProductsToRestock.length > 0) {
      const prefilled: PurchaseLineItemDraft[] = initialProductsToRestock.map((p, idx) => {
        const suggestedQty = Math.max(10, (p.minStock || 5) * 2 - (p.stock || 0));
        return {
          id: `line_${Date.now()}_${idx}`,
          mode: 'existing',
          productId: p.id,
          productName: p.nameAr,
          categoryId: p.categoryId,
          barcode: p.barcode,
          unit: p.unit || 'قطعة',
          quantity: suggestedQty,
          costPrice: p.costPrice || 0,
          wholesalePrice: p.wholesalePrice || Math.round((p.price || 0) * 0.85),
          retailPrice: p.price || 0,
          minStock: p.minStock || 5,
          currentStock: p.stock || 0,
        };
      });
      setInvoiceItems(prefilled);
    } else {
      setInvoiceItems([]);
    }
  }, [isOpen, initialSupplier, initialProductsToRestock, suppliers]);

  // Filter existing products for quick selection
  const filteredExistingProducts = useMemo(() => {
    const q = productSearchQuery.trim().toLowerCase();
    if (!q) return products.slice(0, 40);
    return products.filter(
      p =>
        p.nameAr.toLowerCase().includes(q) ||
        (p.nameEn && p.nameEn.toLowerCase().includes(q)) ||
        p.barcode.includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q))
    );
  }, [products, productSearchQuery]);

  // Handle selecting an existing product from inventory
  const handleSelectExistingProduct = (productId: string) => {
    setSelectedExistingProductId(productId);
    const prod = products.find(p => p.id === productId);
    if (prod) {
      setDraftProductName(prod.nameAr);
      setDraftCategoryId(prod.categoryId);
      setDraftBarcode(prod.barcode);
      setDraftUnit(prod.unit || 'قطعة');
      setDraftMinStock(prod.minStock || 5);
      setDraftQuantity(Math.max(10, (prod.minStock || 5) * 2 - (prod.stock || 0)));
      setDraftCostPrice(prod.costPrice || 0);
      setDraftWholesalePrice(prod.wholesalePrice || Math.round((prod.price || 0) * 0.85));
      setDraftRetailPrice(prod.price || 0);
    }
  };

  // Add current draft item (existing or new) to invoiceItems
  const handleAddDraftItemToInvoice = () => {
    const qty = Math.max(1, Number(draftQuantity) || 1);
    const cost = Math.max(0, Number(draftCostPrice) || 0);
    const wholesale = Math.max(0, Number(draftWholesalePrice) || cost);
    const retail = Math.max(0, Number(draftRetailPrice) || wholesale || cost);

    if (itemEntryMode === 'existing') {
      const prod = products.find(p => p.id === selectedExistingProductId);
      if (!prod) {
        notify('تنبيه', 'يرجى اختيار المنتج من المخزون أولاً', 'warning');
        return;
      }
      if (cost <= 0) {
        notify('تنبيه', 'يرجى إدخال سعر الشراء للمنتج', 'warning');
        return;
      }

      // Check if already in list -> update quantity & prices
      const existingIdx = invoiceItems.findIndex(
        it => it.mode === 'existing' && it.productId === prod.id
      );
      if (existingIdx >= 0) {
        setInvoiceItems(prev =>
          prev.map((it, i) =>
            i === existingIdx
              ? {
                  ...it,
                  quantity: it.quantity + qty,
                  costPrice: cost,
                  wholesalePrice: wholesale,
                  retailPrice: retail,
                }
              : it
          )
        );
      } else {
        setInvoiceItems(prev => [
          ...prev,
          {
            id: `line_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
            mode: 'existing',
            productId: prod.id,
            productName: prod.nameAr,
            categoryId: prod.categoryId,
            barcode: prod.barcode,
            unit: prod.unit || 'قطعة',
            quantity: qty,
            costPrice: cost,
            wholesalePrice: wholesale,
            retailPrice: retail,
            minStock: prod.minStock || 5,
            currentStock: prod.stock || 0,
          },
        ]);
      }

      // Reset draft selection
      setSelectedExistingProductId('');
      setDraftProductName('');
      setDraftCostPrice('');
      setDraftWholesalePrice('');
      setDraftRetailPrice('');
      setDraftQuantity(10);
    } else {
      // New product mode
      if (!draftProductName.trim()) {
        notify('تنبيه', 'يرجى إدخال اسم المنتج الجديد', 'warning');
        return;
      }
      if (cost <= 0) {
        notify('تنبيه', 'يرجى إدخال سعر الشراء للمنتج الجديد', 'warning');
        return;
      }
      if (retail <= 0) {
        notify('تنبيه', 'يرجى إدخال سعر البيع بالمفرق للمنتج الجديد', 'warning');
        return;
      }

      setInvoiceItems(prev => [
        ...prev,
        {
          id: `line_new_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
          mode: 'new',
          productName: draftProductName.trim(),
          categoryId: draftCategoryId || categories[0]?.id || 'cat_1',
          barcode:
            draftBarcode.trim() ||
            `${Math.floor(620000000000 + Math.random() * 99999999999)}`,
          unit: draftUnit || 'قطعة',
          quantity: qty,
          costPrice: cost,
          wholesalePrice: wholesale > 0 ? wholesale : Math.round(retail * 0.85),
          retailPrice: retail,
          minStock: Math.max(1, Number(draftMinStock) || 5),
          currentStock: 0,
        },
      ]);

      // Reset new product draft fields
      setDraftProductName('');
      setDraftBarcode('');
      setDraftQuantity(10);
      setDraftCostPrice('');
      setDraftWholesalePrice('');
      setDraftRetailPrice('');
    }
  };

  // One-click autofill all low-stock products
  const handleLoadLowStockProducts = () => {
    const lowProds = products.filter(p => p.stock <= (p.minStock || 5));
    if (lowProds.length === 0) {
      notify('المخزون مكتمل', 'لا توجد منتجات منخفضة المخزون حالياً', 'info');
      return;
    }

    setInvoiceItems(prev => {
      const existingIds = new Set(prev.filter(i => i.mode === 'existing').map(i => i.productId));
      const newLines: PurchaseLineItemDraft[] = lowProds
        .filter(p => !existingIds.has(p.id))
        .map((p, idx) => ({
          id: `line_low_${Date.now()}_${idx}`,
          mode: 'existing',
          productId: p.id,
          productName: p.nameAr,
          categoryId: p.categoryId,
          barcode: p.barcode,
          unit: p.unit || 'قطعة',
          quantity: Math.max(10, (p.minStock || 5) * 2 - (p.stock || 0)),
          costPrice: p.costPrice || 0,
          wholesalePrice: p.wholesalePrice || Math.round((p.price || 0) * 0.85),
          retailPrice: p.price || 0,
          minStock: p.minStock || 5,
          currentStock: p.stock || 0,
        }));
      return [...prev, ...newLines];
    });

    notify('تم إدراج النواقص', `تمت إضافة المنتجات المنخفضة المخزون إلى فاتورة الشراء`, 'success');
  };

  // Update a line item in the table
  const updateLineItem = (id: string, patch: Partial<PurchaseLineItemDraft>) => {
    setInvoiceItems(prev => prev.map(item => (item.id === id ? { ...item, ...patch } : item)));
  };

  const removeLineItem = (id: string) => {
    setInvoiceItems(prev => prev.filter(item => item.id !== id));
  };

  // Totals calculation
  const invoiceTotals = useMemo(() => {
    const totalUnits = invoiceItems.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
    const totalPurchaseCost = invoiceItems.reduce(
      (sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.costPrice) || 0),
      0
    );
    const totalWholesaleValue = invoiceItems.reduce(
      (sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.wholesalePrice) || 0),
      0
    );
    const totalRetailValue = invoiceItems.reduce(
      (sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.retailPrice) || 0),
      0
    );
    const expectedRetailProfit = Math.max(0, totalRetailValue - totalPurchaseCost);
    const expectedWholesaleProfit = Math.max(0, totalWholesaleValue - totalPurchaseCost);

    return {
      totalUnits,
      totalPurchaseCost,
      totalWholesaleValue,
      totalRetailValue,
      expectedRetailProfit,
      expectedWholesaleProfit,
    };
  }, [invoiceItems]);

  const effectivePaidAmount = useMemo(() => {
    if (paymentType === 'cash') return invoiceTotals.totalPurchaseCost;
    if (paymentType === 'credit') return 0;
    return Math.min(invoiceTotals.totalPurchaseCost, Math.max(0, Number(paidAmount) || 0));
  }, [paymentType, paidAmount, invoiceTotals.totalPurchaseCost]);

  const remainingDebtAmount = Math.max(0, invoiceTotals.totalPurchaseCost - effectivePaidAmount);

  const handleSubmitPurchaseInvoice = (e: React.FormEvent) => {
    e.preventDefault();

    if (supplierMode === 'existing' && !selectedSupplierId) {
      notify('تنبيه', 'يرجى اختيار المورد أو الشركة، أو إضافة مورد جديد', 'warning');
      return;
    }
    if (supplierMode === 'new' && !newSupplierName.trim() && !newSupplierCompany.trim()) {
      notify('تنبيه', 'يرجى كتابة اسم المورد أو اسم الشركة', 'warning');
      return;
    }
    if (invoiceItems.length === 0) {
      notify('تنبيه', 'يرجى إضافة منتج واحد على الأقل إلى فاتورة الشراء', 'warning');
      return;
    }

    const result = recordSupplierPurchaseInvoice({
      supplierMode,
      supplierId: selectedSupplierId,
      newSupplierName: newSupplierName.trim() || newSupplierCompany.trim(),
      newSupplierCompany: newSupplierCompany.trim() || newSupplierName.trim(),
      newSupplierPhone: newSupplierPhone.trim(),
      newSupplierCategory,
      referenceInvoice,
      paymentType,
      paidAmount: effectivePaidAmount,
      paymentMethod,
      notes: invoiceNotes,
      items: invoiceItems.map(it => ({
        mode: it.mode,
        productId: it.productId,
        productName: it.productName,
        categoryId: it.categoryId,
        barcode: it.barcode,
        unit: it.unit,
        quantity: Number(it.quantity) || 1,
        costPrice: Number(it.costPrice) || 0,
        wholesalePrice: Number(it.wholesalePrice) || 0,
        retailPrice: Number(it.retailPrice) || 0,
        minStock: Number(it.minStock) || 5,
      })),
    });

    if (result) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const selectedExistingProduct = products.find(p => p.id === selectedExistingProductId);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-6xl w-full shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden my-auto flex flex-col max-h-[94vh]">
        {/* Top Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent dark:from-amber-950/50 dark:to-slate-900 border-b border-amber-200/70 dark:border-amber-800/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/25">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  فاتورة شراء وتوريد بضاعة من الشركات والموردين
                </h2>
                <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-black bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-400/30">
                  تحديث تلقائي للمخزون والأسعار
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                إضافة اسم المورد أو الشركة • توريد منتج من المخزون أو تعريف منتج جديد • تحديد الكمية وسعر الشراء وسعر الجملة والمفرق
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Scrollable Content */}
        <form onSubmit={handleSubmitPurchaseInvoice} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* SECTION 1: SUPPLIER / COMPANY SELECTION OR CREATION */}
          <div className="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/90 dark:border-slate-700/80 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/70 dark:border-slate-700/70 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                  1. بيانات الشركة أو المورد ورقم الفاتورة
                </h3>
              </div>

              {/* Toggle Existing Supplier vs New Supplier/Company */}
              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setSupplierMode('existing')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    supplierMode === 'existing'
                      ? 'bg-amber-500 text-slate-950 font-black shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>اختيار مورد / شركة مسجلة ({suppliers.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSupplierMode('new')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    supplierMode === 'new'
                      ? 'bg-amber-500 text-slate-950 font-black shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ إضافة اسم مورد أو شركة جديدة</span>
                </button>
              </div>
            </div>

            {supplierMode === 'existing' ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    اختر المورد أو الشركة المورّدة:
                  </label>
                  <select
                    value={selectedSupplierId}
                    onChange={e => setSelectedSupplierId(e.target.value)}
                    className="w-full py-2.5 px-3 text-xs font-bold rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="">-- اختر المورد أو الشركة --</option>
                    {suppliers.map(sup => (
                      <option key={sup.id} value={sup.id}>
                        {sup.name} {sup.companyName ? `(${sup.companyName})` : ''} — الرصيد المستحق: {formatCurrency(sup.currentDebt || 0)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    رقم فاتورة المورد / الإشعار:
                  </label>
                  <input
                    type="text"
                    value={referenceInvoice}
                    onChange={e => setReferenceInvoice(e.target.value)}
                    placeholder="مثال: INV-SUP-2026"
                    className="w-full py-2.5 px-3 text-xs font-mono font-bold rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    اسم المورد أو المندوب <span className="text-rose-500">*</span>:
                  </label>
                  <input
                    type="text"
                    value={newSupplierName}
                    onChange={e => setNewSupplierName(e.target.value)}
                    placeholder="مثال: مؤسسة البركة التجارية"
                    className="w-full py-2 px-3 text-xs font-bold rounded-xl bg-white dark:bg-slate-900 border-2 border-amber-500/60 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    اسم الشركة / العلامة التجارية:
                  </label>
                  <input
                    type="text"
                    value={newSupplierCompany}
                    onChange={e => setNewSupplierCompany(e.target.value)}
                    placeholder="مثال: شركة التوريد المتحدة"
                    className="w-full py-2 px-3 text-xs font-bold rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    رقم الهاتف / التواصل:
                  </label>
                  <input
                    type="text"
                    value={newSupplierPhone}
                    onChange={e => setNewSupplierPhone(e.target.value)}
                    placeholder="09XXXXXXXX"
                    className="w-full py-2 px-3 text-xs font-mono rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    رقم فاتورة الشراء:
                  </label>
                  <input
                    type="text"
                    value={referenceInvoice}
                    onChange={e => setReferenceInvoice(e.target.value)}
                    placeholder="PUR-2026-001"
                    className="w-full py-2 px-3 text-xs font-mono font-bold rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: ADD PRODUCT FROM INVENTORY OR DEFINE NEW PRODUCT */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-indigo-500/30 dark:border-indigo-500/40 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                  2. إضافة المنتجات المشتراة (تحديد الكمية + سعر الشراء + سعر الجملة + سعر المفرق)
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Quick Autofill Low Stock Button */}
                <button
                  type="button"
                  onClick={handleLoadLowStockProducts}
                  className="px-3 py-1.5 rounded-xl text-[11px] font-black bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition-all flex items-center gap-1.5 cursor-pointer"
                  title="إدراج جميع الأصناف التي وصلت للحد الأدنى في الفاتورة تلقائياً"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>إدراج نواقص المخزون تلقائياً</span>
                </button>

                {/* Switch between Existing Inventory Product & Brand New Product */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setItemEntryMode('existing')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      itemEntryMode === 'existing'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>إضافة منتج من المخزون</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setItemEntryMode('new');
                      setSelectedExistingProductId('');
                      setDraftProductName('');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      itemEntryMode === 'new'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>+ إضافة منتج جديد للمخزون</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Product Selector / New Product Fields */}
            {itemEntryMode === 'existing' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ابحث في المخزون بالاسم أو الباركود:
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={productSearchQuery}
                      onChange={e => setProductSearchQuery(e.target.value)}
                      placeholder="اكتب اسم المنتج أو امسح الباركود..."
                      className="w-full py-2 ps-9 pe-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    اختر المنتج من المخزون ({filteredExistingProducts.length} متاح):
                  </label>
                  <select
                    value={selectedExistingProductId}
                    onChange={e => handleSelectExistingProduct(e.target.value)}
                    className="w-full py-2 px-3 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-indigo-500/50 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="">-- اختر المنتج لتعبئة أسعاره وكميته --</option>
                    {filteredExistingProducts.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nameAr} — (المخزون: {p.stock} {p.unit || 'قطعة'}) — شراء: {formatCurrency(p.costPrice)} | مفرق: {formatCurrency(p.price)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-emerald-50/40 dark:bg-emerald-950/20 p-3 rounded-xl border border-emerald-200/70 dark:border-emerald-800/50">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-emerald-950 dark:text-emerald-200 mb-1">
                    اسم المنتج الجديد <span className="text-rose-500">*</span>:
                  </label>
                  <input
                    type="text"
                    value={draftProductName}
                    onChange={e => setDraftProductName(e.target.value)}
                    placeholder="اكتب اسم الصنف الجديد ليتم تعريفه في المخزون..."
                    className="w-full py-2 px-3 text-xs font-bold rounded-xl bg-white dark:bg-slate-900 border-2 border-emerald-500/60 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-emerald-950 dark:text-emerald-200 mb-1">
                    القسم / التصنيف:
                  </label>
                  <select
                    value={draftCategoryId}
                    onChange={e => setDraftCategoryId(e.target.value)}
                    className="w-full py-2 px-3 text-xs font-bold rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.nameAr}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-emerald-950 dark:text-emerald-200 mb-1">
                      الوحدة:
                    </label>
                    <select
                      value={draftUnit}
                      onChange={e => setDraftUnit(e.target.value)}
                      className="w-full py-2 px-2 text-xs font-bold rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                    >
                      <option value="قطعة">قطعة</option>
                      <option value="كرتونة">كرتونة</option>
                      <option value="علبة">علبة</option>
                      <option value="كيلو">كيلو</option>
                      <option value="طرد">طرد</option>
                      <option value="عبوة">عبوة</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-emerald-950 dark:text-emerald-200 mb-1">
                      الحد الأدنى:
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={draftMinStock}
                      onChange={e => setDraftMinStock(Math.max(1, Number(e.target.value) || 1))}
                      className="w-full py-2 px-2 text-xs font-mono font-bold rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-center"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Quantity + Purchase Price + Wholesale Price + Retail Price Row */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 items-end pt-1">
              {/* 1. Quantity */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  الكمية المشتراة {selectedExistingProduct ? `(الحالي: ${selectedExistingProduct.stock})` : ''}:
                </label>
                <div className="flex items-center rounded-xl border-2 border-indigo-500/60 bg-white dark:bg-slate-900 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setDraftQuantity(q => Math.max(1, (Number(q) || 1) - 1))}
                    className="px-2.5 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-black transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={draftQuantity}
                    onChange={e => setDraftQuantity(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full py-2 text-center font-mono font-black text-sm text-slate-900 dark:text-white bg-transparent focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setDraftQuantity(q => (Number(q) || 0) + 1)}
                    className="px-2.5 py-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-black transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 2. Purchase Price (سعر الشراء) */}
              <div>
                <label className="block text-xs font-bold text-rose-700 dark:text-rose-400 mb-1">
                  سعر الشراء (التكلفة) ({settings.currency.symbol}):
                </label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={draftCostPrice}
                  onChange={e => {
                    const val = e.target.value === '' ? '' : Number(e.target.value);
                    setDraftCostPrice(val);
                    if (typeof val === 'number' && val > 0) {
                      if (!draftWholesalePrice) setDraftWholesalePrice(Math.round(val * 1.15));
                      if (!draftRetailPrice) setDraftRetailPrice(Math.round(val * 1.35));
                    }
                  }}
                  placeholder="0"
                  className="w-full py-2 px-3 font-mono font-black text-sm rounded-xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-300 dark:border-rose-800 text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* 3. Wholesale Price (سعر البيع بالجملة) */}
              <div>
                <label className="block text-xs font-bold text-amber-700 dark:text-amber-400 mb-1">
                  سعر البيع بالجملة ({settings.currency.symbol}):
                </label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={draftWholesalePrice}
                  onChange={e => setDraftWholesalePrice(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0"
                  className="w-full py-2 px-3 font-mono font-black text-sm rounded-xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* 4. Retail Price (سعر البيع بالمفرق) */}
              <div>
                <label className="block text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1">
                  سعر البيع بالمفرق ({settings.currency.symbol}):
                </label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={draftRetailPrice}
                  onChange={e => setDraftRetailPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0"
                  className="w-full py-2 px-3 font-mono font-black text-sm rounded-xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-800 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* 5. Add Button */}
              <div className="col-span-2 sm:col-span-1">
                <button
                  type="button"
                  onClick={handleAddDraftItemToInvoice}
                  className={`w-full py-2.5 px-3 rounded-xl font-black text-xs text-white shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                    itemEntryMode === 'new'
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                      : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>{itemEntryMode === 'new' ? 'إدراج الصنف الجديد' : 'إدراج في الفاتورة'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 3: INVOICE ITEMS TABLE (Editable Quantities & Prices) */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-black text-slate-900 dark:text-white">
                  جدول أصناف فاتورة الشراء والتوريد ({invoiceItems.length} صنف)
                </span>
              </div>
              {invoiceItems.length > 0 && (
                <span className="text-[11px] font-bold text-slate-500">
                  يمكنك تعديل الكمية أو أسعار الشراء والجملة والمفرق مباشرة من الجدول أدناه
                </span>
              )}
            </div>

            {invoiceItems.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <Package className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  لم تتم إضافة أصناف إلى الفاتورة بعد. اختر منتجاً من المخزون أو أضف منتجاً جديداً من الأعلى.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-start">
                  <thead className="bg-slate-100/80 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-black border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-2.5 px-3 text-start">المنتج</th>
                      <th className="py-2.5 px-2 text-center">النوع</th>
                      <th className="py-2.5 px-2 text-center">الكمية المشتراة</th>
                      <th className="py-2.5 px-2 text-center text-rose-600 dark:text-rose-400">سعر الشراء</th>
                      <th className="py-2.5 px-2 text-center text-amber-600 dark:text-amber-400">سعر الجملة</th>
                      <th className="py-2.5 px-2 text-center text-emerald-600 dark:text-emerald-400">سعر المفرق</th>
                      <th className="py-2.5 px-3 text-end">إجمالي الشراء</th>
                      <th className="py-2.5 px-2 text-center">حذف</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {invoiceItems.map(item => {
                      const lineCost = (Number(item.quantity) || 0) * (Number(item.costPrice) || 0);
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 px-3">
                            <div className="font-black text-slate-900 dark:text-white">{item.productName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              الباركود: {item.barcode} • الوحدة: {item.unit}
                            </div>
                          </td>

                          <td className="py-2.5 px-2 text-center">
                            {item.mode === 'new' ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                منتج جديد ✨
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                                من المخزون (حالي: {item.currentStock ?? 0})
                              </span>
                            )}
                          </td>

                          {/* Quantity Stepper in Table */}
                          <td className="py-2.5 px-2">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  updateLineItem(item.id, { quantity: Math.max(1, (item.quantity || 1) - 1) })
                                }
                                className="w-6 h-6 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center font-bold hover:bg-rose-100"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <input
                                type="number"
                                min={1}
                                value={item.quantity}
                                onChange={e =>
                                  updateLineItem(item.id, { quantity: Math.max(1, Number(e.target.value) || 1) })
                                }
                                className="w-16 py-1 text-center font-mono font-black text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  updateLineItem(item.id, { quantity: (item.quantity || 0) + 1 })
                                }
                                className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center font-bold hover:bg-emerald-100"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </td>

                          {/* Purchase Price (سعر الشراء) */}
                          <td className="py-2.5 px-2 text-center">
                            <input
                              type="number"
                              min={0}
                              step="any"
                              value={item.costPrice}
                              onChange={e =>
                                updateLineItem(item.id, { costPrice: Math.max(0, Number(e.target.value) || 0) })
                              }
                              className="w-24 py-1 px-2 text-center font-mono font-black text-xs rounded-lg border border-rose-300 dark:border-rose-800 bg-rose-50/30 dark:bg-rose-950/20 text-slate-900 dark:text-white"
                            />
                          </td>

                          {/* Wholesale Price (سعر البيع بالجملة) */}
                          <td className="py-2.5 px-2 text-center">
                            <input
                              type="number"
                              min={0}
                              step="any"
                              value={item.wholesalePrice}
                              onChange={e =>
                                updateLineItem(item.id, { wholesalePrice: Math.max(0, Number(e.target.value) || 0) })
                              }
                              className="w-24 py-1 px-2 text-center font-mono font-black text-xs rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/20 text-slate-900 dark:text-white"
                            />
                          </td>

                          {/* Retail Price (سعر البيع بالمفرق) */}
                          <td className="py-2.5 px-2 text-center">
                            <input
                              type="number"
                              min={0}
                              step="any"
                              value={item.retailPrice}
                              onChange={e =>
                                updateLineItem(item.id, { retailPrice: Math.max(0, Number(e.target.value) || 0) })
                              }
                              className="w-24 py-1 px-2 text-center font-mono font-black text-xs rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/20 text-slate-900 dark:text-white"
                            />
                          </td>

                          {/* Total Line Cost */}
                          <td className="py-2.5 px-3 text-end font-mono font-black text-slate-900 dark:text-white">
                            {formatCurrency(lineCost)}
                          </td>

                          <td className="py-2.5 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeLineItem(item.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* SECTION 4: FINANCIAL SUMMARY & PAYMENT SETTLEMENT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Payment Options */}
            <div className="lg:col-span-7 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3">
              <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-amber-500" />
                <span>3. طريقة التسوية المالية وسداد المورد</span>
              </h4>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'credit', label: '📋 آجل (ذمة للمورد)', desc: 'تقييد كامل الفاتورة بالدين' },
                  { id: 'cash', label: '💵 نقدي بالكامل', desc: 'سداد كامل القيمة الآن' },
                  { id: 'partial', label: '⚖️ تقسيم نقد + آجل', desc: 'تقسيم الفاتورة بين نقد وآجل' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setPaymentType(opt.id as any);
                      if (opt.id === 'partial' && (!paidAmount || Number(paidAmount) === 0)) {
                        setPaidAmount(Math.round(invoiceTotals.totalPurchaseCost / 2));
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-start transition-all cursor-pointer ${
                      paymentType === opt.id
                        ? 'bg-amber-500 text-slate-950 border-amber-500 font-black shadow-xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="text-xs font-black">{opt.label}</div>
                    <div className={`text-[10px] mt-0.5 ${paymentType === opt.id ? 'text-slate-900/80' : 'text-slate-400'}`}>
                      {opt.desc}
                    </div>
                  </button>
                ))}
              </div>

              {paymentType === 'partial' && (
                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                      نسبة التقسيم السريع (نقد ⟷ آجل):
                    </span>
                    <div className="flex items-center gap-1">
                      {[
                        { label: '25% نقد', ratio: 0.25 },
                        { label: '50% نصف', ratio: 0.5 },
                        { label: '75% نقد', ratio: 0.75 },
                      ].map(r => (
                        <button
                          key={r.label}
                          type="button"
                          onClick={() => setPaidAmount(Math.round(invoiceTotals.totalPurchaseCost * r.ratio))}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-50 cursor-pointer"
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1">
                        💵 المدفوع نقداً الآن ({settings.currency.symbol}):
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={invoiceTotals.totalPurchaseCost}
                        value={paidAmount}
                        onChange={e => setPaidAmount(e.target.value === '' ? '' : Math.min(invoiceTotals.totalPurchaseCost, Math.max(0, Number(e.target.value))))}
                        placeholder="0"
                        className="w-full py-2 px-3 font-mono font-black text-sm rounded-xl bg-white dark:bg-slate-900 border-2 border-emerald-500 text-emerald-700 dark:text-emerald-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-rose-600 dark:text-rose-400 mb-1">
                        📋 المتبقي آجلاً (ذمة للمورد):
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={invoiceTotals.totalPurchaseCost}
                        value={remainingDebtAmount === 0 ? '' : remainingDebtAmount}
                        onChange={e => {
                          const debtVal = Math.min(invoiceTotals.totalPurchaseCost, Math.max(0, Number(e.target.value) || 0));
                          setPaidAmount(Math.max(0, invoiceTotals.totalPurchaseCost - debtVal));
                        }}
                        placeholder="0"
                        className="w-full py-2 px-3 font-mono font-black text-sm rounded-xl bg-rose-50 dark:bg-rose-950/30 border-2 border-rose-400 dark:border-rose-800 text-rose-700 dark:text-rose-300"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ملاحظات الفاتورة / شروط التوريد:
                </label>
                <input
                  type="text"
                  value={invoiceNotes}
                  onChange={e => setInvoiceNotes(e.target.value)}
                  placeholder="مثال: بضاعة مستلمة في المستودع الرئيسي..."
                  className="w-full py-2 px-3 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Summary KPI Box */}
            <div className="lg:col-span-5 p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white flex flex-col justify-between space-y-3 shadow-lg">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>إجمالي عدد القطع والوحدات المورّدة:</span>
                  <span className="font-mono font-black text-white">{invoiceTotals.totalUnits} وحدة</span>
                </div>
                <div className="flex items-center justify-between text-xs text-amber-300">
                  <span>القيمة المتوقعة بسعر الجملة:</span>
                  <span className="font-mono font-bold">{formatCurrency(invoiceTotals.totalWholesaleValue)}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-emerald-300">
                  <span>القيمة المتوقعة بسعر المفرق:</span>
                  <span className="font-mono font-bold">{formatCurrency(invoiceTotals.totalRetailValue)}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-emerald-400 pt-1 border-t border-white/10">
                  <span>الربح المتوقع (بالمفرق / بالجملة):</span>
                  <span className="font-mono font-black">
                    {formatCurrency(invoiceTotals.expectedRetailProfit)} / {formatCurrency(invoiceTotals.expectedWholesaleProfit)}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-white/15 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-300 block">إجمالي قيمة فاتورة الشراء:</span>
                  <span className="text-2xl font-black font-mono text-amber-400">
                    {formatCurrency(invoiceTotals.totalPurchaseCost)}
                  </span>
                </div>
                <div className="text-end">
                  <span className="text-[10px] text-slate-400 block">المتبقي ذمة للمورد:</span>
                  <span className="text-sm font-black font-mono text-rose-400">
                    {formatCurrency(remainingDebtAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/25 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>اعتماد فاتورة الشراء وتوريد المخزون وتحديث الأسعار</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
