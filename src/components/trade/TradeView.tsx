import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, Customer, Sale, TradeType } from '../../types';
import {
  Building2,
  Package,
  Users,
  FileSpreadsheet,
  TrendingUp,
  Percent,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  DollarSign,
  ArrowUpDown,
  Edit,
  Save,
  X,
  CreditCard,
  Layers,
  ArrowRight,
  Scale,
  Receipt,
  Eye,
  Printer,
  Sparkles,
  AlertCircle,
  Truck,
  ShieldCheck,
  ChevronRight,
  Tag,
  Store,
  Barcode,
  Copy,
  Trash2,
  ListPlus,
  Hash,
  RefreshCw
} from 'lucide-react';

export const TradeView: React.FC = () => {
  const {
    products,
    updateProduct,
    applyBulkWholesaleMargin,
    categories,
    customers,
    addCustomer,
    updateCustomer,
    sales,
    formatCurrency,
    t: rawT,
    dir,
    setActiveTab,
    setPosTradeMode,
    notify,
  } = useApp();

  const t = (key: string): string => (rawT as any)(key);

  // Active Trade Sub-tab
  const [activeSubTab, setActiveSubTab] = useState<'matrix' | 'clients' | 'invoices' | 'analytics'>('matrix');

  // Search & Category Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [tradeTypeFilter, setTradeTypeFilter] = useState<'all' | 'retail' | 'wholesale' | 'both'>('all');

  // Editing single product wholesale details modal / inline
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editWholesalePrice, setEditWholesalePrice] = useState<number>(0);
  const [editMinQty, setEditMinQty] = useState<number>(1);
  const [editUnit, setEditUnit] = useState<string>('');
  const [editMultiplier, setEditMultiplier] = useState<number>(1);
  const [editTradeType, setEditTradeType] = useState<TradeType>('both');

  // Identification codes state for the editing wholesale product (supports 100+ codes)
  const [editIdentificationCodes, setEditIdentificationCodes] = useState<string[]>([]);
  const [newSingleCode, setNewSingleCode] = useState<string>('');
  const [bulkCodesText, setBulkCodesText] = useState<string>('');
  const [showBulkInput, setShowBulkInput] = useState<boolean>(false);
  const [showSeriesGenerator, setShowSeriesGenerator] = useState<boolean>(false);
  const [seriesPrefix, setSeriesPrefix] = useState<string>('WHS-');
  const [seriesStart, setSeriesStart] = useState<number>(1);
  const [seriesCount, setSeriesCount] = useState<number>(100);
  const [codesFilterQuery, setCodesFilterQuery] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Bulk Price Adjuster Modal
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkDiscountPercent, setBulkDiscountPercent] = useState<number>(20);
  const [bulkCategoryTarget, setBulkCategoryTarget] = useState<string>('all');

  // Add/Edit Wholesale Customer Modal
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [custName, setCustName] = useState('');
  const [custCompany, setCustCompany] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [custTaxNo, setCustTaxNo] = useState('');
  const [custCommercialNo, setCustCommercialNo] = useState('');
  const [custCreditLimit, setCustCreditLimit] = useState<number>(1000000);
  const [custPaymentTerms, setCustPaymentTerms] = useState<string>('نقد عند الاستلام');

  // Debt Payment Settlement Modal
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [debtTargetCustomer, setDebtTargetCustomer] = useState<Customer | null>(null);
  const [debtPaymentAmount, setDebtPaymentAmount] = useState<number>(0);
  const [debtPaymentNote, setDebtPaymentNote] = useState<string>('');

  // View Invoice Modal
  const [selectedInvoice, setSelectedInvoice] = useState<Sale | null>(null);

  // Computed Financial Metrics
  const wholesaleSales = useMemo(() => {
    return sales.filter(s => s.tradeType === 'wholesale' || s.invoiceNumber.startsWith('WHS'));
  }, [sales]);

  const retailSales = useMemo(() => {
    return sales.filter(s => s.tradeType !== 'wholesale' && !s.invoiceNumber.startsWith('WHS'));
  }, [sales]);

  const totalWholesaleRevenue = useMemo(() => {
    return wholesaleSales.reduce((acc, s) => acc + s.total, 0);
  }, [wholesaleSales]);

  const totalRetailRevenue = useMemo(() => {
    return retailSales.reduce((acc, s) => acc + s.total, 0);
  }, [retailSales]);

  const wholesaleCustomers = useMemo(() => {
    return customers.filter(c => c.customerType === 'wholesale' || (c.currentDebt && c.currentDebt > 0) || c.companyName);
  }, [customers]);

  const totalReceivables = useMemo(() => {
    return wholesaleCustomers.reduce((acc, c) => acc + (c.currentDebt || 0), 0);
  }, [wholesaleCustomers]);

  // Filtered Products for Matrix
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.nameAr.toLowerCase().includes(q) ||
        p.nameEn.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.barcode.includes(q) ||
        p.identificationCodes?.some(c => c.toLowerCase().includes(q));
      const matchCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
      const matchTradeType = tradeTypeFilter === 'all' || (p.tradeType || 'both') === tradeTypeFilter;
      return matchSearch && matchCategory && matchTradeType;
    });
  }, [products, searchQuery, selectedCategory, tradeTypeFilter]);

  // Open Edit Product
  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setEditWholesalePrice(prod.wholesalePrice || Math.round(prod.price * 0.8));
    setEditMinQty(prod.wholesaleMinQty || 5);
    setEditUnit(prod.wholesaleUnit || 'طرد / كرتونة');
    setEditMultiplier(prod.wholesaleUnitMultiplier || 6);
    setEditTradeType((prod.tradeType || 'both') as TradeType);
    setEditIdentificationCodes(prod.identificationCodes ? [...prod.identificationCodes] : []);
    setNewSingleCode('');
    setBulkCodesText('');
    setShowBulkInput(false);
    setShowSeriesGenerator(false);
    setCodesFilterQuery('');
  };

  // Add single identification code
  const handleAddSingleCode = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = newSingleCode.trim();
    if (!clean) return;
    if (editIdentificationCodes.includes(clean)) {
      notify('تنبيه', `الكود التعريفي ${clean} مسجل مسبقاً لهذا الصنف`, 'warning');
      return;
    }
    setEditIdentificationCodes(prev => [clean, ...prev]);
    setNewSingleCode('');
    notify('تمت إضافة كود تعريفي', clean, 'success');
  };

  // Bulk import identification codes (e.g. 100+ codes at once)
  const handleImportBulkCodes = () => {
    if (!bulkCodesText.trim()) return;
    const rawTokens = bulkCodesText.split(/[\r\n,\t;]+/);
    const validCodes: string[] = [];
    const seen = new Set(editIdentificationCodes);

    for (const token of rawTokens) {
      const trimmed = token.trim();
      if (trimmed && !seen.has(trimmed)) {
        seen.add(trimmed);
        validCodes.push(trimmed);
      }
    }

    if (validCodes.length === 0) {
      notify('تنبيه', 'لم يتم العثور على أكواد جديدة صالحة أو الأكواد مضافة مسبقاً', 'warning');
      return;
    }

    setEditIdentificationCodes(prev => [...validCodes, ...prev]);
    setBulkCodesText('');
    setShowBulkInput(false);
    notify('تم استيراد الأكواد بنجاح', `تمت إضافة ${validCodes.length} كود تعريفي جديد (الإجمالي: ${editIdentificationCodes.length + validCodes.length} كود)`, 'success');
  };

  // Generate sequence of identification codes (e.g. 100 serial codes in 1 click)
  const handleGenerateSeries = () => {
    const count = Math.max(1, Math.min(seriesCount, 500));
    const prefix = seriesPrefix.trim() || 'WHS-';
    const start = Math.max(0, seriesStart);
    const newGenerated: string[] = [];
    const seen = new Set(editIdentificationCodes);

    for (let i = 0; i < count; i++) {
      const codeNum = String(start + i).padStart(count >= 100 ? 4 : 3, '0');
      const generated = `${prefix}${codeNum}`;
      if (!seen.has(generated)) {
        seen.add(generated);
        newGenerated.push(generated);
      }
    }

    if (newGenerated.length === 0) {
      notify('تنبيه', 'الأكواد المتسلسلة مولدة مسبقاً', 'warning');
      return;
    }

    setEditIdentificationCodes(prev => [...newGenerated, ...prev]);
    setShowSeriesGenerator(false);
    notify('تم توليد السلسلة بنجاح', `تم إنشاء ${newGenerated.length} كود تعريفي متسلسل دفعة واحدة (الإجمالي: ${editIdentificationCodes.length + newGenerated.length} كود)`, 'success');
  };

  // Delete single code
  const handleDeleteCode = (code: string) => {
    setEditIdentificationCodes(prev => prev.filter(c => c !== code));
  };

  // Clear all codes
  const handleClearAllCodes = () => {
    if (window.confirm('هل أنت متأكد من رغبتك في حذف كافة الأكواد التعريفية لهذا المنتج؟')) {
      setEditIdentificationCodes([]);
      notify('تم تفريغ الأكواد', 'تم حذف كافة الأكواد التعريفية للمنتج', 'info');
    }
  };

  // Copy code helper
  const handleCopyCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Save Edit Product
  const handleSaveProductWholesale = () => {
    if (!editingProduct) return;
    updateProduct(editingProduct.id, {
      wholesalePrice: Number(editWholesalePrice),
      wholesaleMinQty: Number(editMinQty),
      wholesaleUnit: editUnit,
      wholesaleUnitMultiplier: Number(editMultiplier),
      tradeType: editTradeType,
      identificationCodes: editIdentificationCodes,
    });
    setEditingProduct(null);
    notify('تم حفظ تفاصيل الجملة والأكواد', `${editingProduct.nameAr} (${editIdentificationCodes.length} كود تعريفي)`, 'success');
  };

  // Open Add / Edit Wholesale Customer
  const handleOpenCustomerModal = (cust?: Customer) => {
    if (cust) {
      setEditingCustomer(cust);
      setCustName(cust.name);
      setCustCompany(cust.companyName || '');
      setCustPhone(cust.phone || '');
      setCustEmail(cust.email || '');
      setCustAddress(cust.address || '');
      setCustTaxNo(cust.taxNumber || '');
      setCustCommercialNo(cust.commercialRegisterNo || '');
      setCustCreditLimit(cust.creditLimit || 1000000);
      setCustPaymentTerms(cust.paymentTerms || 'نقد عند الاستلام');
    } else {
      setEditingCustomer(null);
      setCustName('');
      setCustCompany('');
      setCustPhone('');
      setCustEmail('');
      setCustAddress('');
      setCustTaxNo('');
      setCustCommercialNo('');
      setCustCreditLimit(1000000);
      setCustPaymentTerms('نقد عند الاستلام');
    }
    setIsCustomerModalOpen(true);
  };

  // Save Customer
  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim()) return;

    if (editingCustomer) {
      updateCustomer(editingCustomer.id, {
        name: custName,
        customerType: 'wholesale',
        companyName: custCompany,
        phone: custPhone,
        email: custEmail,
        address: custAddress,
        taxNumber: custTaxNo,
        commercialRegisterNo: custCommercialNo,
        creditLimit: Number(custCreditLimit),
        paymentTerms: custPaymentTerms,
      });
      notify('تم تحديث بيانات تاجر الجملة بنجاح', custName, 'success');
    } else {
      addCustomer({
        name: custName,
        customerType: 'wholesale',
        companyName: custCompany,
        phone: custPhone || '+963 9',
        email: custEmail,
        address: custAddress,
        taxNumber: custTaxNo,
        commercialRegisterNo: custCommercialNo,
        creditLimit: Number(custCreditLimit),
        currentDebt: 0,
        paymentTerms: custPaymentTerms,
        notes: 'تاجر جملة مسجل',
      });
      notify('تمت إضافة تاجر جملة جديد بنجاح', custName, 'success');
    }
    setIsCustomerModalOpen(false);
  };

  // Open Debt Settlement
  const handleOpenDebtModal = (cust: Customer) => {
    setDebtTargetCustomer(cust);
    setDebtPaymentAmount(cust.currentDebt || 0);
    setDebtPaymentNote('تسديد دفعة حساب نقدية');
    setIsDebtModalOpen(true);
  };

  // Process Debt Payment
  const handleProcessDebtPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!debtTargetCustomer || debtPaymentAmount <= 0) return;

    const currentDebt = debtTargetCustomer.currentDebt || 0;
    const remaining = Math.max(0, currentDebt - debtPaymentAmount);

    updateCustomer(debtTargetCustomer.id, {
      currentDebt: remaining,
    });

    notify(
      'تم تسجيل سند قبض / تسديد ذمة',
      `تم سداد ${formatCurrency(debtPaymentAmount)} للتاجر ${debtTargetCustomer.name}. الرصيد المتبقي: ${formatCurrency(remaining)}`,
      'success'
    );
    setIsDebtModalOpen(false);
  };

  // Launch Wholesale POS Mode
  const handleStartWholesalePOS = (customer?: Customer) => {
    setPosTradeMode('wholesale');
    if (customer) {
      // You can select this customer in POS
    }
    setActiveTab('pos');
    notify('تم تفعيل نقطة البيع بأسعار الجملة', 'تم تجهيز السلة بأسعار التوزيع والجملة', 'info');
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-slate-950 overflow-y-auto">
      {/* Top Banner / Breadcrumb & Actions */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 lg:px-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-amber-500 to-amber-600 rounded-2xl text-white shadow-lg shadow-amber-500/20">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  {t('tradeManagementTitle')}
                </h1>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                  {t('wholesaleMode')} &amp; {t('retailTrade')}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t('tradeSubtitle')}
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="trade-btn-bulk-pricing"
              onClick={() => setIsBulkModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold flex items-center gap-2 transition-all"
            >
              <Percent className="w-4 h-4 text-amber-500" />
              <span>{t('bulkPriceAdjuster')}</span>
            </button>

            <button
              id="trade-btn-add-client"
              onClick={() => handleOpenCustomerModal()}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4 text-emerald-500" />
              <span>{t('addWholesaleClient')}</span>
            </button>

            <button
              id="trade-btn-launch-wholesale-pos"
              onClick={() => handleStartWholesalePOS()}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-black shadow-md shadow-amber-500/25 flex items-center gap-2 transition-all"
            >
              <Store className="w-4 h-4" />
              <span>{t('startWholesaleSale')}</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
          {/* Retail Volume */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              {t('retailSalesVolume')}
            </div>
            <div className="text-base font-black text-slate-900 dark:text-white mt-1">
              {formatCurrency(totalRetailRevenue)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
              <span>{retailSales.length} {t('invoicesCount')}</span>
            </div>
          </div>

          {/* Wholesale Volume */}
          <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200/60 dark:border-amber-900/40">
            <div className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
              {t('wholesaleSalesVolume')}
            </div>
            <div className="text-base font-black text-amber-900 dark:text-amber-200 mt-1">
              {formatCurrency(totalWholesaleRevenue)}
            </div>
            <div className="text-[10px] text-amber-600 dark:text-amber-400/80 mt-0.5 flex items-center gap-1">
              <span>{wholesaleSales.length} {t('invoicesCount')}</span>
            </div>
          </div>

          {/* Wholesale Ratio */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              {t('wholesalePercentage')}
            </div>
            <div className="text-base font-black text-slate-900 dark:text-white mt-1">
              {totalRetailRevenue + totalWholesaleRevenue > 0
                ? `${Math.round((totalWholesaleRevenue / (totalRetailRevenue + totalWholesaleRevenue)) * 100)}%`
                : '0%'}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              من إجمالي المبيعات
            </div>
          </div>

          {/* Commercial Dealers */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              {t('wholesaleCustomersCount')}
            </div>
            <div className="text-base font-black text-slate-900 dark:text-white mt-1">
              {wholesaleCustomers.length}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              شركات وتجار معتمدون
            </div>
          </div>

          {/* Total Outstanding Receivables / Debts */}
          <div className="p-3 bg-rose-50/70 dark:bg-rose-950/30 rounded-xl border border-rose-200/60 dark:border-rose-900/40 col-span-2 lg:col-span-1">
            <div className="text-[11px] font-bold text-rose-700 dark:text-rose-400">
              {t('totalReceivables')}
            </div>
            <div className="text-base font-black text-rose-700 dark:text-rose-300 mt-1">
              {formatCurrency(totalReceivables)}
            </div>
            <div className="text-[10px] text-rose-600/80 dark:text-rose-400/80 mt-0.5">
              ذمم آجلة مستحقة التحصيل
            </div>
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex items-center gap-2 mt-4 overflow-x-auto no-scrollbar">
          <button
            id="trade-tab-matrix"
            onClick={() => setActiveSubTab('matrix')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
              activeSubTab === 'matrix'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>{t('tabPricingMatrix')}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/10 font-mono">
              {products.length}
            </span>
          </button>

          <button
            id="trade-tab-clients"
            onClick={() => setActiveSubTab('clients')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
              activeSubTab === 'clients'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{t('tabWholesaleClients')}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/10 font-mono">
              {wholesaleCustomers.length}
            </span>
          </button>

          <button
            id="trade-tab-invoices"
            onClick={() => setActiveSubTab('invoices')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
              activeSubTab === 'invoices'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{t('tabWholesaleInvoices')}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/10 font-mono">
              {wholesaleSales.length}
            </span>
          </button>

          <button
            id="trade-tab-analytics"
            onClick={() => setActiveSubTab('analytics')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
              activeSubTab === 'analytics'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>{t('tabTradeAnalytics')}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 lg:p-6 flex-1">
        {/* ======================= TAB 1: PRICING MATRIX ======================= */}
        {activeSubTab === 'matrix' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between">
              {/* Search */}
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={t('searchPlaceholder')}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full ps-9 pe-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Category Filter & Trade Type Filter */}
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-hidden"
                >
                  <option value="all">{t('allCategories')}</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {dir === 'rtl' ? c.nameAr : c.nameEn}
                    </option>
                  ))}
                </select>

                <select
                  value={tradeTypeFilter}
                  onChange={e => setTradeTypeFilter(e.target.value as any)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-hidden"
                >
                  <option value="all">كل أنواع التجارة (مفرق وجملة)</option>
                  <option value="both">متاح بالمفرق والجملة معاً</option>
                  <option value="retail">مفرق فقط</option>
                  <option value="wholesale">جملة فقط</option>
                </select>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-start text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/80 text-slate-500 dark:text-slate-400 font-black">
                    <tr>
                      <th className="py-3.5 px-4 text-start">المنتج والباركود</th>
                      <th className="py-3.5 px-4 text-start">التصنيف</th>
                      <th className="py-3.5 px-4 text-start">التكلفة (رأس المال)</th>
                      <th className="py-3.5 px-4 text-start">سعر المفرق</th>
                      <th className="py-3.5 px-4 text-start bg-amber-50/50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300">
                        سعر الجملة
                      </th>
                      <th className="py-3.5 px-4 text-start">هامش ربح الجملة</th>
                      <th className="py-3.5 px-4 text-start">وحدة ومعامل التعبئة</th>
                      <th className="py-3.5 px-4 text-start">الحد الأدنى للطلب</th>
                      <th className="py-3.5 px-4 text-start">النوع</th>
                      <th className="py-3.5 px-4 text-center">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                    {filteredProducts.map(prod => {
                      const category = categories.find(c => c.id === prod.categoryId);
                      const wholesalePrice = prod.wholesalePrice || Math.round(prod.price * 0.8);
                      const wholesaleMargin = wholesalePrice > prod.costPrice
                        ? Math.round(((wholesalePrice - prod.costPrice) / wholesalePrice) * 100)
                        : 0;
                      const retailMargin = prod.price > prod.costPrice
                        ? Math.round(((prod.price - prod.costPrice) / prod.price) * 100)
                        : 0;

                      return (
                        <tr key={prod.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                          {/* Name */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 dark:text-white">
                              {dir === 'rtl' ? prod.nameAr : prod.nameEn}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <span className="text-[10px] font-mono text-slate-400">
                                {prod.barcode}
                              </span>
                              {prod.identificationCodes && prod.identificationCodes.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditProduct(prod)}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 dark:hover:bg-amber-900 border border-amber-200/80 dark:border-amber-800/60 transition-colors"
                                  title="انقر لعرض وإدارة الأكواد والباركودات المتعددة لهذا المنتج"
                                >
                                  <Barcode className="w-2.5 h-2.5" />
                                  <span>{prod.identificationCodes.length} كود تعريفي</span>
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Category */}
                          <td className="py-3 px-4 text-slate-500">
                            {category ? (dir === 'rtl' ? category.nameAr : category.nameEn) : 'عام'}
                          </td>

                          {/* Cost */}
                          <td className="py-3 px-4 font-mono text-slate-500">
                            {formatCurrency(prod.costPrice)}
                          </td>

                          {/* Retail Price */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 dark:text-white font-mono">
                              {formatCurrency(prod.price)}
                            </div>
                            <div className="text-[10px] text-emerald-600 font-semibold">
                              هامش: {retailMargin}%
                            </div>
                          </td>

                          {/* Wholesale Price */}
                          <td className="py-3 px-4 bg-amber-50/30 dark:bg-amber-950/10">
                            <div className="font-extrabold text-amber-700 dark:text-amber-400 font-mono text-sm">
                              {formatCurrency(wholesalePrice)}
                            </div>
                            <div className="text-[10px] text-amber-600/80 font-medium">
                              خصم {Math.round(((prod.price - wholesalePrice) / prod.price) * 100)}% عن المفرق
                            </div>
                          </td>

                          {/* Wholesale Margin */}
                          <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                            {wholesaleMargin}%
                          </td>

                          {/* Packaging Unit & Multiplier */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-800 dark:text-slate-200">
                              {prod.wholesaleUnit || 'طرد / كرتونة'}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              يحتوي {prod.wholesaleUnitMultiplier || 6} قطع
                            </div>
                          </td>

                          {/* Min Qty */}
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-bold">
                              {prod.wholesaleMinQty || 5} {prod.unit || 'قطعة'}
                            </span>
                          </td>

                          {/* Trade Availability */}
                          <td className="py-3 px-4">
                            <span
                              className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${
                                prod.tradeType === 'wholesale'
                                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                                  : prod.tradeType === 'retail'
                                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              }`}
                            >
                              {prod.tradeType === 'wholesale'
                                ? 'جملة فقط'
                                : prod.tradeType === 'retail'
                                ? 'مفرق فقط'
                                : 'مفرق وجملة'}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-center">
                            <button
                              id={`btn-edit-wholesale-${prod.id}`}
                              onClick={() => handleOpenEditProduct(prod)}
                              className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 dark:text-amber-300 transition-colors"
                              title="تعديل أسعار ووحدات الجملة"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================= TAB 2: WHOLESALE CLIENTS ======================= */}
        {activeSubTab === 'clients' && (
          <div className="space-y-4">
            {/* Header + Add button */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  {t('tabWholesaleClients')} ({wholesaleCustomers.length})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  إدارة الشركات، المحلات، الوكلاء وسقوف الديون والذمم الآجلة
                </p>
              </div>

              <button
                id="trade-btn-add-client-tab"
                onClick={() => handleOpenCustomerModal()}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-amber-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>{t('addWholesaleClient')}</span>
              </button>
            </div>

            {/* Clients Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {wholesaleCustomers.map(cust => {
                const debt = cust.currentDebt || 0;
                const creditLimit = cust.creditLimit || 1000000;
                const debtRatio = creditLimit > 0 ? Math.min(100, Math.round((debt / creditLimit) * 100)) : 0;

                return (
                  <div
                    key={cust.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:border-amber-500/50 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            تاجر جملة معتمد
                          </span>
                          <h4 className="text-base font-black text-slate-900 dark:text-white mt-1.5">
                            {cust.companyName || cust.name}
                          </h4>
                          {cust.companyName && cust.name !== cust.companyName && (
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              المسؤول: {cust.name}
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() => handleOpenCustomerModal(cust)}
                          className="p-1.5 text-slate-400 hover:text-amber-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Contact info */}
                      <div className="mt-3 space-y-1 text-xs text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-700 dark:text-slate-300">{cust.phone}</span>
                          <span className="text-slate-300 dark:text-slate-700">•</span>
                          <span className="font-mono text-[10px] text-slate-400">{cust.customerCode}</span>
                        </div>
                        {cust.address && (
                          <div className="text-[11px] text-slate-500 truncate">
                            📍 {cust.address}
                          </div>
                        )}
                        {cust.taxNumber && (
                          <div className="text-[11px] text-slate-500">
                            الرقم الضريبي: <span className="font-mono">{cust.taxNumber}</span>
                          </div>
                        )}
                      </div>

                      {/* Debt / Credit Bar */}
                      <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span className="text-slate-500">الرصيد المدين (الذمة):</span>
                          <span className={`font-mono font-black ${debt > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600'}`}>
                            {formatCurrency(debt)}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              debtRatio > 80 ? 'bg-rose-500' : debtRatio > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${debtRatio}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                          <span>سقف الائتمان: {formatCurrency(creditLimit)}</span>
                          <span>{debtRatio}% مستهلك</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                      <button
                        onClick={() => handleOpenDebtModal(cust)}
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 dark:text-emerald-300 text-xs font-bold transition-all text-center"
                      >
                        سند قبض / تسديد ذمة
                      </button>

                      <button
                        onClick={() => handleStartWholesalePOS(cust)}
                        className="py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all flex items-center gap-1"
                        title="إصدار فاتورة جملة جديدة للتاجر"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>فاتورة</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ======================= TAB 3: WHOLESALE INVOICES ======================= */}
        {activeSubTab === 'invoices' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  {t('tabWholesaleInvoices')} ({wholesaleSales.length})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  سجل العمليات والطلبيات المنجزة بأسعار وحدات الجملة
                </p>
              </div>

              <button
                onClick={() => handleStartWholesalePOS()}
                className="px-4 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-amber-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>إصدار فاتورة جملة</span>
              </button>
            </div>

            {/* Invoices Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-start text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/80 text-slate-500 dark:text-slate-400 font-black">
                    <tr>
                      <th className="py-3.5 px-4 text-start">رقم الفاتورة</th>
                      <th className="py-3.5 px-4 text-start">التاجر / العميل</th>
                      <th className="py-3.5 px-4 text-start">التاريخ والوقت</th>
                      <th className="py-3.5 px-4 text-start">عدد الأصناف / الكميات</th>
                      <th className="py-3.5 px-4 text-start">طريقة الدفع</th>
                      <th className="py-3.5 px-4 text-start">الإجمالي</th>
                      <th className="py-3.5 px-4 text-start">صافي الربح</th>
                      <th className="py-3.5 px-4 text-center">عرض</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {wholesaleSales.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                          لا توجد فواتير جملة مسجلة بعد. يمكنك البدء بإصدار أول فاتورة جملة الآن!
                        </td>
                      </tr>
                    ) : (
                      wholesaleSales.map(sale => {
                        const totalQty = sale.items.reduce((acc, it) => acc + it.quantity, 0);

                        return (
                          <tr key={sale.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                            <td className="py-3.5 px-4 font-mono font-bold text-amber-700 dark:text-amber-400">
                              {sale.invoiceNumber}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-900 dark:text-white">
                                {sale.customerName || 'عميل جملة نقدي'}
                              </div>
                              {sale.customerPhone && (
                                <div className="text-[10px] font-mono text-slate-400">
                                  {sale.customerPhone}
                                </div>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                              {new Date(sale.createdAt).toLocaleDateString('ar-SY', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>
                            <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                              <span className="font-bold">{sale.items.length} أصناف</span> ({totalQty} وحدة)
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                {sale.paymentMethod}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-mono font-black text-slate-900 dark:text-white text-sm">
                              {formatCurrency(sale.total)}
                            </td>
                            <td className="py-3.5 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(sale.profitTotal || 0)}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <button
                                onClick={() => setSelectedInvoice(sale)}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                              >
                                <Eye className="w-4 h-4" />
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
          </div>
        )}

        {/* ======================= TAB 4: TRADE ANALYTICS ======================= */}
        {activeSubTab === 'analytics' && (
          <div className="space-y-6">
            {/* Comparison Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Retail Card */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 dark:bg-blue-950 rounded-xl text-blue-600 dark:text-blue-400">
                      <Store className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">
                        تجارة المفرق (التجزئة)
                      </h4>
                      <p className="text-[11px] text-slate-400">البيع المباشر للزبائن والرواد</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                    {retailSales.length} عملية
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                    <span className="text-[11px] text-slate-500">إجمالي الإيرادات:</span>
                    <p className="text-base font-black text-slate-900 dark:text-white font-mono mt-0.5">
                      {formatCurrency(totalRetailRevenue)}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                    <span className="text-[11px] text-slate-500">متوسط الفاتورة:</span>
                    <p className="text-base font-black text-slate-900 dark:text-white font-mono mt-0.5">
                      {retailSales.length > 0 ? formatCurrency(Math.round(totalRetailRevenue / retailSales.length)) : formatCurrency(0)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 text-xs text-slate-600 dark:text-slate-400 space-y-2">
                  <div className="flex justify-between">
                    <span>نسبة الهامش الربحي للمفرق:</span>
                    <span className="font-bold text-emerald-600">~35% - 50%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>سرعة تدوير المخزون:</span>
                    <span className="font-bold">يومية / فردية</span>
                  </div>
                </div>
              </div>

              {/* Wholesale Card */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-amber-100 dark:bg-amber-950 rounded-xl text-amber-600 dark:text-amber-400">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">
                        تجارة الجملة والتوزيع
                      </h4>
                      <p className="text-[11px] text-slate-400">الطلبيات الكبيرة والكراتين والشركات</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                    {wholesaleSales.length} صفقة
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl">
                    <span className="text-[11px] text-amber-700 dark:text-amber-400">إجمالي مبيعات الجملة:</span>
                    <p className="text-base font-black text-amber-900 dark:text-amber-200 font-mono mt-0.5">
                      {formatCurrency(totalWholesaleRevenue)}
                    </p>
                  </div>
                  <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl">
                    <span className="text-[11px] text-amber-700 dark:text-amber-400">متوسط سلة الجملة:</span>
                    <p className="text-base font-black text-amber-900 dark:text-amber-200 font-mono mt-0.5">
                      {wholesaleSales.length > 0 ? formatCurrency(Math.round(totalWholesaleRevenue / wholesaleSales.length)) : formatCurrency(0)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 text-xs text-slate-600 dark:text-slate-400 space-y-2">
                  <div className="flex justify-between">
                    <span>نسبة الهامش الربحي للجملة:</span>
                    <span className="font-bold text-amber-600">~15% - 25% (حجم بيع مرتفع)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>طبيعة التسليم:</span>
                    <span className="font-bold">كراتين، طرود، باقات جملة</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Strategic Advice Card */}
            <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl shadow-md">
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h4 className="text-sm font-bold">مؤشرات ذكية لإدارة تجارة المفرق والجملة</h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                يتيح نظام كيان كاشير فصل وتتبع مبيعات المفرق عن الجملة تلقائيًا. عند بيع كميات بالكرتونة أو الطرد يتم تطبيق سعر الجملة وخصم الكميات من نفس المستودع المشترك بدقة عالية لمنع أي عجز أو تضارب.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ======================= MODAL: EDIT PRODUCT WHOLESALE SPECS & IDENTIFICATION CODES ======================= */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl animate-in zoom-in-95 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500 text-white rounded-2xl shadow-md shadow-amber-500/20">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    تعديل أسعار ووحدات وأكواد الجملة التعريفية
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    {dir === 'rtl' ? editingProduct.nameAr : editingProduct.nameEn} • باركود أساسي: {editingProduct.barcode || '—'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-5 overflow-y-auto space-y-5 text-xs">
              {/* Product Reference Stats */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">سعر التكلفة:</span>
                  <p className="font-mono font-bold text-sm text-slate-700 dark:text-slate-200">{formatCurrency(editingProduct.costPrice)}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">سعر المفرق الحالي:</span>
                  <p className="font-mono font-bold text-sm text-slate-900 dark:text-white">{formatCurrency(editingProduct.price)}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">رصيد المخزون الحالي:</span>
                  <p className="font-mono font-bold text-sm text-emerald-600">{editingProduct.stock} {editingProduct.unit}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">الأكواد التعريفية:</span>
                  <p className="font-mono font-bold text-sm text-amber-600">{editIdentificationCodes.length} كود مسجل</p>
                </div>
              </div>

              {/* Section 1: Wholesale Price & Packaging */}
              <div className="p-4 rounded-2xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 space-y-3.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-amber-900 dark:text-amber-300 flex items-center gap-1.5 text-sm">
                    <DollarSign className="w-4 h-4 text-amber-600" />
                    <span>أسعار ووحدة تعبئة الجملة</span>
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200">
                    هامش الربح: {editWholesalePrice > editingProduct.costPrice ? Math.round(((editWholesalePrice - editingProduct.costPrice) / editWholesalePrice) * 100) : 0}%
                  </span>
                </div>

                {/* Wholesale Price */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    سعر بيع الجملة (للقطعة الواحدة داخل وحدة التعبئة):
                  </label>
                  <input
                    type="number"
                    value={editWholesalePrice}
                    onChange={e => setEditWholesalePrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                  />
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
                    <span>السعر الإجمالي لوحدة الجملة ({editUnit || 'كرتونة'}): <strong className="text-amber-600 font-mono">{formatCurrency(editWholesalePrice * (editMultiplier || 1))}</strong></span>
                    <span>خصم الجملة: <strong className="text-emerald-600">{editingProduct.price > 0 ? Math.round(((editingProduct.price - editWholesalePrice) / editingProduct.price) * 100) : 0}%</strong> عن المفرق</span>
                  </div>
                </div>

                {/* Wholesale Unit Name & Multiplier */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      اسم وحدة الجملة:
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: كرتونة (24 عبوة) أو طرد"
                      value={editUnit}
                      onChange={e => setEditUnit(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      معامل التحويل (كم قطعة في وحدة الجملة):
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={editMultiplier}
                      onChange={e => setEditMultiplier(Number(e.target.value))}
                      className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Min Wholesale Qty & Trade Type */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      الحد الأدنى لكمية الجملة (بالقطع):
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={editMinQty}
                      onChange={e => setEditMinQty(Number(e.target.value))}
                      className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      إتاحة الصنف للبيع:
                    </label>
                    <select
                      value={editTradeType}
                      onChange={e => setEditTradeType(e.target.value as any)}
                      className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
                    >
                      <option value="both">متاح بالمفرق والجملة معاً</option>
                      <option value="wholesale">جملة فقط</option>
                      <option value="retail">مفرق فقط</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: MULTI-IDENTIFICATION CODES (Supports 100+ Codes per Product) */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-xl">
                      <Barcode className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 dark:text-white text-sm">
                        الأكواد التعريفية والباركودات للوحدة / الصنف
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        يدعم ربط أكثر من 100 كود تعريفي (باركود كرتونة، طرد، دفعة، سيريال، بدائل) للصنف الواحد.
                      </p>
                    </div>
                  </div>

                  {/* Badges count */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                      {editIdentificationCodes.length} كود مسجل
                    </span>
                    {editIdentificationCodes.length >= 100 && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
                        +100 كود مفعّل
                      </span>
                    )}
                  </div>
                </div>

                {/* Add single code form */}
                <form onSubmit={handleAddSingleCode} className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="أدخل أو امسح كود تعريفي جديد (باركود كرتونة، رقم تسلسلي، كود المورد)..."
                      value={newSingleCode}
                      onChange={e => setNewSingleCode(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shrink-0 active:scale-95 shadow-sm shadow-blue-500/20"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة كود</span>
                  </button>
                </form>

                {/* Quick actions for 100+ codes handling */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowBulkInput(!showBulkInput);
                      setShowSeriesGenerator(false);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 border transition-all ${
                      showBulkInput
                        ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <ListPlus className="w-3.5 h-3.5" />
                    <span>لصق أو استيراد جماعي (حتى مئات الأكواد)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowSeriesGenerator(!showSeriesGenerator);
                      setShowBulkInput(false);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 border transition-all ${
                      showSeriesGenerator
                        ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Hash className="w-3.5 h-3.5" />
                    <span>توليد 100 كود متسلسل تلقائياً</span>
                  </button>

                  {editIdentificationCodes.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAllCodes}
                      className="px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors mr-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>مسح الكل</span>
                    </button>
                  )}
                </div>

                {/* Bulk Import Drawer */}
                {showBulkInput && (
                  <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 space-y-2 animate-in slide-in-from-top-2">
                    <label className="block font-bold text-amber-950 dark:text-amber-200">
                      الصق الأكواد التعريفية هنا (مفصولة بأسطر جديدة أو فواصل — يدعم لصق أكثر من 100 كود معاً):
                    </label>
                    <textarea
                      rows={4}
                      value={bulkCodesText}
                      onChange={e => setBulkCodesText(e.target.value)}
                      placeholder={"62100100101\n62100100102\nCRTN-BOX-8801\nCRTN-BOX-8802\n..."}
                      className="w-full p-2.5 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 rounded-xl font-mono text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        سيتم تنظيف المسافات وحذف الأكواد المكررة تلقائياً.
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setShowBulkInput(false)}
                          className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold"
                        >
                          إغلاق
                        </button>
                        <button
                          type="button"
                          onClick={handleImportBulkCodes}
                          className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold"
                        >
                          استيراد الأكواد الآن
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Series Generator Drawer */}
                {showSeriesGenerator && (
                  <div className="p-3.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/60 space-y-3 animate-in slide-in-from-top-2">
                    <h5 className="font-bold text-purple-950 dark:text-purple-200">
                      توليد سلسلة أكواد تعريفية تسلسلية لكراتين وطرود الجملة:
                    </h5>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                          البادئة (Prefix):
                        </label>
                        <input
                          type="text"
                          value={seriesPrefix}
                          onChange={e => setSeriesPrefix(e.target.value)}
                          placeholder="مثال: CRTN-"
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                          رقم البداية:
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={seriesStart}
                          onChange={e => setSeriesStart(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                          عدد الأكواد (حتى 500):
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="500"
                          value={seriesCount}
                          onChange={e => setSeriesCount(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-xs font-bold text-purple-600"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-500">
                        معاينة: {seriesPrefix}{String(seriesStart).padStart(seriesCount >= 100 ? 4 : 3, '0')} إلى {seriesPrefix}{String(seriesStart + seriesCount - 1).padStart(seriesCount >= 100 ? 4 : 3, '0')}
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setShowSeriesGenerator(false)}
                          className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold"
                        >
                          إلغاء
                        </button>
                        <button
                          type="button"
                          onClick={handleGenerateSeries}
                          className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-sm"
                        >
                          توليد {seriesCount} كود الآن
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Codes List & Filter */}
                <div className="space-y-2">
                  {editIdentificationCodes.length > 6 && (
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="بحث وتصفية بين الأكواد المسجلة..."
                        value={codesFilterQuery}
                        onChange={e => setCodesFilterQuery(e.target.value)}
                        className="w-full pl-3 pr-8 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200"
                      />
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute start-2.5 top-2.5" />
                    </div>
                  )}

                  {/* Scrollable Codes List */}
                  {editIdentificationCodes.length === 0 ? (
                    <div className="p-6 text-center rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-dashed border-slate-200 dark:border-slate-700 text-slate-400">
                      <Barcode className="w-8 h-8 mx-auto mb-1.5 opacity-40" />
                      <p className="font-bold">لا توجد أكواد تعريفية إضافية مسجلة بعد</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        أدخل كوداً فردياً أو استخدم خيار "لصق أو استيراد جماعي" لإدخال أكثر من 100 كود فوراً
                      </p>
                    </div>
                  ) : (
                    <div className="max-h-56 overflow-y-auto p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1.5">
                      <div className="flex flex-wrap gap-1.5">
                        {editIdentificationCodes
                          .filter(c => !codesFilterQuery.trim() || c.toLowerCase().includes(codesFilterQuery.toLowerCase().trim()))
                          .map((code, idx) => (
                            <div
                              key={code + idx}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs shadow-2xs group hover:border-blue-400 transition-all"
                            >
                              <span className="text-[9px] text-slate-400 font-mono">#{idx + 1}</span>
                              <span className="font-mono font-bold">{code}</span>
                              <button
                                type="button"
                                onClick={() => handleCopyCode(code)}
                                title="نسخ الكود"
                                className="p-0.5 hover:text-blue-500 text-slate-400 transition-colors"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCode(code)}
                                title="حذف الكود"
                                className="p-0.5 hover:text-rose-500 text-slate-400 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                      </div>
                      {codesFilterQuery && (
                        <div className="text-[10px] text-slate-400 text-start pt-1">
                          تمت تصفية النتائج للبحث عن: "{codesFilterQuery}"
                        </div>
                      )}
                    </div>
                  )}

                  {copiedCode && (
                    <div className="text-center text-[11px] text-emerald-600 font-bold animate-in fade-in">
                      تم نسخ الكود ({copiedCode}) إلى الحافظة بنجاح
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                إجمالي الأكواد التعريفية: <strong className="text-slate-800 dark:text-slate-200 font-mono">{editIdentificationCodes.length}</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-300 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSaveProductWholesale}
                  className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-md shadow-amber-500/20 active:scale-95 transition-all"
                >
                  حفظ التعديلات والأكواد
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================= MODAL: BULK WHOLESALE MARGIN CALCULATOR ======================= */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500 text-white rounded-xl">
                  <Percent className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    أداة تعديل أسعار الجملة المجمعة
                  </h3>
                  <p className="text-xs text-slate-400">تطبيق نسبة خصم جملة موحدة على المنتجات</p>
                </div>
              </div>
              <button
                onClick={() => setIsBulkModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-600 dark:text-slate-400">
                تقوم هذه الأداة بحساب أسعار الجملة تلقائيًا كنسبة خصم من سعر المفرق مع ضمان عدم النزول عن سعر التكلفة.
              </p>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  نسبة الخصم للجملة عن سعر المفرق (%):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="5"
                    max="50"
                    step="1"
                    value={bulkDiscountPercent}
                    onChange={e => setBulkDiscountPercent(Number(e.target.value))}
                    className="flex-1 accent-amber-500"
                  />
                  <span className="font-mono font-black text-sm px-3 py-1 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded-xl">
                    {bulkDiscountPercent}%
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  التصنيف المستهدف:
                </label>
                <select
                  value={bulkCategoryTarget}
                  onChange={e => setBulkCategoryTarget(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
                >
                  <option value="all">جميع التصنيفات والمنتجات</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {dir === 'rtl' ? c.nameAr : c.nameEn}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => {
                  applyBulkWholesaleMargin(bulkDiscountPercent, bulkCategoryTarget);
                  setIsBulkModalOpen(false);
                }}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-md shadow-amber-500/20"
              >
                تطبيق وتحديث الأسعار
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================= MODAL: ADD / EDIT WHOLESALE CUSTOMER ======================= */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500 text-white rounded-xl">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {editingCustomer ? 'تعديل بيانات تاجر جملة' : 'إضافة شركة / تاجر جملة جديد'}
                  </h3>
                  <p className="text-xs text-slate-400">سجل حساب تجاري وسقف ائتمان</p>
                </div>
              </div>
              <button
                onClick={() => setIsCustomerModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    اسم الشركة / المؤسسة:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: شركة النور للتوزيع"
                    value={custCompany}
                    onChange={e => setCustCompany(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    اسم الشخص المسؤول:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="الاسم الثلاثي"
                    value={custName}
                    onChange={e => setCustName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    رقم الهاتف / الواتساب:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+963 9..."
                    value={custPhone}
                    onChange={e => setCustPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    سقف الائتمان والدين (ل.س):
                  </label>
                  <input
                    type="number"
                    value={custCreditLimit}
                    onChange={e => setCustCreditLimit(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    الرقم الضريبي (إن وجد):
                  </label>
                  <input
                    type="text"
                    placeholder="TAX-..."
                    value={custTaxNo}
                    onChange={e => setCustTaxNo(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    السجل التجاري:
                  </label>
                  <input
                    type="text"
                    placeholder="CR-..."
                    value={custCommercialNo}
                    onChange={e => setCustCommercialNo(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  العنوان والمستودع:
                </label>
                <input
                  type="text"
                  placeholder="المدينة، المنطقة، اسم الشارع أو المستودع"
                  value={custAddress}
                  onChange={e => setCustAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  شروط السداد:
                </label>
                <input
                  type="text"
                  placeholder="مثال: آجل 30 يوم / نقد عند التسليم / حوالة بنكية"
                  value={custPaymentTerms}
                  onChange={e => setCustPaymentTerms(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 -mx-5 -mb-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-md shadow-amber-500/20"
                >
                  حفظ العميل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================= MODAL: SETTLE DEBT / RECEIPT ======================= */}
      {isDebtModalOpen && debtTargetCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500 text-white rounded-xl">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    سند قبض / تسديد ذمة آجلة
                  </h3>
                  <p className="text-xs text-slate-400">{debtTargetCustomer.name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsDebtModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProcessDebtPayment} className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex justify-between items-center">
                <span className="text-slate-500">الرصيد المدين الإجمالي:</span>
                <span className="font-mono font-black text-rose-600 dark:text-rose-400 text-sm">
                  {formatCurrency(debtTargetCustomer.currentDebt || 0)}
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  المبلغ المسدد الآن (ل.س):
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={debtTargetCustomer.currentDebt || 999999999}
                  value={debtPaymentAmount}
                  onChange={e => setDebtPaymentAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-black text-base text-emerald-600 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ملاحظات أو رقم الإيصال:
                </label>
                <input
                  type="text"
                  value={debtPaymentNote}
                  onChange={e => setDebtPaymentNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 -mx-5 -mb-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setIsDebtModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20"
                >
                  تأكيد وقبض السند
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================= MODAL: VIEW INVOICE DETAILS ======================= */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  فاتورة جملة معتمدة
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-white mt-1">
                  {selectedInvoice.invoiceNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs max-h-[65vh] overflow-y-auto">
              <div className="flex justify-between items-center text-slate-500 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[10px] block">العميل:</span>
                  <span className="font-bold text-slate-900 dark:text-white text-xs">{selectedInvoice.customerName || 'نقدي'}</span>
                </div>
                <div className="text-end">
                  <span className="text-[10px] block">التاريخ:</span>
                  <span className="font-mono">{new Date(selectedInvoice.createdAt).toLocaleDateString('ar-SY')}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <span className="font-bold text-slate-700 dark:text-slate-300 block">الأصناف والكميات:</span>
                {selectedInvoice.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">
                        {dir === 'rtl' ? item.productNameAr : item.productNameEn}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {item.quantity} × {formatCurrency(item.unitPrice)}
                        {item.wholesaleUnit && ` (${item.wholesaleUnit})`}
                      </div>
                    </div>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {formatCurrency(item.total)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl space-y-1.5 font-bold">
                <div className="flex justify-between text-slate-500">
                  <span>المجموع الفرعي:</span>
                  <span className="font-mono">{formatCurrency(selectedInvoice.subtotal)}</span>
                </div>
                {selectedInvoice.discountTotal > 0 && (
                  <div className="flex justify-between text-rose-500">
                    <span>الخصم:</span>
                    <span className="font-mono">-{formatCurrency(selectedInvoice.discountTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span>الإجمالي النهائي:</span>
                  <span className="font-mono text-amber-600 dark:text-amber-400 font-black">
                    {formatCurrency(selectedInvoice.total)}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة الفاتورة</span>
              </button>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
