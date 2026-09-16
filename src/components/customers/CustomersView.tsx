import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Customer, DebtTransaction } from '../../types';
import QRCode from 'qrcode';
import {
  Users,
  Plus,
  Search,
  Star,
  QrCode,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  Printer,
  Edit2,
  Trash2,
  X,
  Sparkles,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
  CreditCard,
  Receipt,
  FileText,
  MessageSquareShare,
  Send,
  AlertCircle,
  CheckCircle2,
  Coins,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  Layers
} from 'lucide-react';
import { soundEffects } from '../../services/audio';
import { AccountStatementModal } from '../debts/AccountStatementModal';
import { PrintableVoucherModal } from '../debts/PrintableVoucherModal';
import {
  buildDebtPeriodicReminderMessage,
  sendWhatsAppDebtMessage,
  DEBT_COLLECTION_STORAGE_KEY,
  DebtReminderLog
} from '../../services/debtCollectionService';

export const CustomersView: React.FC = () => {
  const {
    customers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    adjustCustomerPoints,
    sales,
    debtTransactions,
    recordCustomerDebtPayment,
    addCustomerManualDebt,
    formatCurrency,
    t,
    language,
    settings,
    updateSettings,
    notify
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'debt_only' | 'zero_debt' | 'loyalty'>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPointsModalOpen, setIsPointsModalOpen] = useState(false);
  const [pointsChange, setPointsChange] = useState<number>(50);
  const [pointsReason, setPointsReason] = useState<string>('');
  const [customerQrDataUrl, setCustomerQrDataUrl] = useState<string>('');

  // Debt Payment Modal (سند قبض)
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState<number | ''>('');
  const [payDiscount, setPayDiscount] = useState<number | ''>('');
  const [payMethod, setPayMethod] = useState<'cash' | 'card' | 'transfer' | 'check'>('cash');
  const [payNotes, setPayNotes] = useState<string>('');

  // Add Debt Modal (قيد ذمة مالي)
  const [isAddDebtModalOpen, setIsAddDebtModalOpen] = useState(false);
  const [manualDebtAmount, setManualDebtAmount] = useState<number | ''>('');
  const [manualDebtRef, setManualDebtRef] = useState<string>('');
  const [manualDebtNotes, setManualDebtNotes] = useState<string>('');

  // Statement & Voucher Modals
  const [isStatementOpen, setIsStatementOpen] = useState(false);
  const [isVoucherOpen, setIsVoucherOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<DebtTransaction | null>(null);

  // Form State for Add Customer
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [creditLimit, setCreditLimit] = useState<number | ''>('');
  const [initialDebt, setInitialDebt] = useState<number | ''>('');

  // Set default selected customer if none
  useEffect(() => {
    if (!selectedCustomer && customers.length > 0) {
      setSelectedCustomer(customers[0]);
    } else if (selectedCustomer) {
      const refreshed = customers.find(c => c.id === selectedCustomer.id);
      if (refreshed) {
        setSelectedCustomer(refreshed);
      }
    }
  }, [customers]);

  // Generate QR for selected customer
  useEffect(() => {
    if (selectedCustomer) {
      QRCode.toDataURL(selectedCustomer.customerCode, { width: 180, margin: 1 })
        .then(url => setCustomerQrDataUrl(url))
        .catch(() => {});
    }
  }, [selectedCustomer]);

  // Statistics Calculations
  const stats = useMemo(() => {
    let totalDebt = 0;
    let debtCustomersCount = 0;
    let zeroDebtCustomersCount = 0;
    let totalPoints = 0;

    customers.forEach(c => {
      const debt = c.currentDebt || 0;
      if (debt > 0) {
        totalDebt += debt;
        debtCustomersCount++;
      } else {
        zeroDebtCustomersCount++;
      }
      totalPoints += (c.points || 0);
    });

    return {
      totalCustomers: customers.length,
      totalDebt,
      debtCustomersCount,
      zeroDebtCustomersCount,
      totalPoints
    };
  }, [customers]);

  // Filtered customers list
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      // 1. Search Query
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || (
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.customerCode.toLowerCase().includes(q) ||
        (c.companyName && c.companyName.toLowerCase().includes(q))
      );

      if (!matchesSearch) return false;

      // 2. Filter Type
      const debt = c.currentDebt || 0;
      if (filterType === 'debt_only') return debt > 0;
      if (filterType === 'zero_debt') return debt <= 0;
      if (filterType === 'loyalty') return (c.points || 0) > 0;
      return true;
    });
  }, [customers, searchQuery, filterType]);

  // Selected customer invoices & transactions
  const customerInvoices = useMemo(() => {
    if (!selectedCustomer) return [];
    return sales.filter(s => s.customerId === selectedCustomer.id || s.customerCode === selectedCustomer.customerCode);
  }, [sales, selectedCustomer]);

  const customerTransactions = useMemo(() => {
    if (!selectedCustomer) return [];
    return debtTransactions.filter(tx => tx.partyType === 'customer' && tx.partyId === selectedCustomer.id);
  }, [debtTransactions, selectedCustomer]);

  const handleOpenAdd = () => {
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setNotes('');
    setCreditLimit('');
    setInitialDebt('');
    setIsAddModalOpen(true);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      notify('تنبيه', 'يرجى إدخال اسم العميل ورقم الهاتف', 'warning');
      return;
    }

    const newCus = addCustomer({
      name,
      phone,
      email,
      address,
      notes,
      creditLimit: creditLimit === '' ? 0 : Number(creditLimit),
      currentDebt: initialDebt === '' ? 0 : Number(initialDebt),
    });

    soundEffects.playSuccess();
    notify('تم بنجاح', `تم تسجيل العميل الجديد ${name} وتحديد بياناته المالية`, 'success');
    setSelectedCustomer(newCus);
    setIsAddModalOpen(false);
  };

  const handlePointsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    adjustCustomerPoints(
      selectedCustomer.id,
      Number(pointsChange),
      Number(pointsChange) >= 0 ? 'earn' : 'redeem',
      pointsReason || 'تعديل يدوي من إدارة العملاء'
    );
    soundEffects.playSuccess();
    notify('تم بنجاح', 'تم تحديث رصيد نقاط الولاء للعميل', 'success');
    setIsPointsModalOpen(false);
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !payAmount || Number(payAmount) <= 0) {
      notify('خطأ', 'يرجى إدخال مبلغ سداد صحيح أكبر من الصفر', 'error');
      return;
    }

    const voucher = recordCustomerDebtPayment(
      selectedCustomer.id,
      Number(payAmount),
      payMethod,
      payNotes,
      payDiscount === '' ? 0 : Number(payDiscount)
    );

    if (voucher) {
      soundEffects.playCash();
      notify('تم بنجاح', `تم تسجيل سند القبض المالي للعميل ${selectedCustomer.name}`, 'success');
      setIsPayModalOpen(false);
      setPayAmount('');
      setPayDiscount('');
      setPayNotes('');
      setSelectedVoucher(voucher);
      setIsVoucherOpen(true);
    }
  };

  const handleAddManualDebt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !manualDebtAmount || Number(manualDebtAmount) <= 0) {
      notify('خطأ', 'يرجى إدخال مبلغ دين صحيح', 'error');
      return;
    }

    const voucher = addCustomerManualDebt(
      selectedCustomer.id,
      Number(manualDebtAmount),
      manualDebtRef,
      manualDebtNotes
    );

    if (voucher) {
      soundEffects.playSuccess();
      notify('تم بنجاح', `تم تسجيل قيد الذمة على العميل ${selectedCustomer.name}`, 'success');
      setIsAddDebtModalOpen(false);
      setManualDebtAmount('');
      setManualDebtRef('');
      setManualDebtNotes('');
      setSelectedVoucher(voucher);
      setIsVoucherOpen(true);
    }
  };

  const handleSendWhatsAppReminder = async (customer: Customer) => {
    if (!customer.phone) {
      notify('تنبيه', 'لا يوجد رقم هاتف مسجل لهذا العميل', 'warning');
      return;
    }

    const currentDebt = customer.currentDebt || 0;
    if (currentDebt <= 0) {
      notify('تنبيه', 'هذا العميل مبرأ الذمة ولا يترتب عليه أي دين حالي', 'info');
      return;
    }

    const msg = buildDebtPeriodicReminderMessage({
      storeSettings: settings,
      customer
    });
    const res = await sendWhatsAppDebtMessage({
      phone: customer.phone,
      message: msg,
      customerName: customer.name,
      customerId: customer.id,
      amountDue: currentDebt,
      totalDebt: currentDebt,
      currencySymbol: settings.currency.symbol,
      type: 'manual_reminder',
      storeSettings: settings
    });

    if (res.success) {
      soundEffects.playSuccess();
      notify('تم الفتح', `تم تجهيز رسالة التذكير بالدين للعميل ${customer.name} عبر واتساب`, 'success');
    } else {
      notify('خطأ', 'تعذر إرسال الرسالة، يرجى التحقق من الرقم', 'error');
    }
  };

  const toggleLoyaltySetting = () => {
    const nextVal = !settings.enableLoyaltyPoints;
    updateSettings({ enableLoyaltyPoints: nextVal });
    soundEffects.playClick();
    notify(
      'إعدادات الولاء',
      nextVal ? 'تم تفعيل نظام نقاط الولاء والمكافآت بنجاح' : 'تم إيقاف نظام نقاط الولاء والمكافآت مؤقتاً',
      'info'
    );
  };

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6 bg-slate-50/50 dark:bg-slate-950">
      {/* Top Header & Loyalty System Quick Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {t('customerLoyaltyTitle')} والذمم المالية
            </h2>
            <span className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold px-2.5 py-0.5 rounded-full">
              {customers.length} عميل
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            متابعة ديون كل عميل على حدة، إصدار سندات القبض، كشوفات الحسابات، وبطاقات العضوية بالـ QR Code
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Loyalty On/Off Toggle Button */}
          <button
            type="button"
            onClick={toggleLoyaltySetting}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              settings.enableLoyaltyPoints !== false
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
            }`}
            title="انقر لتشغيل أو إيقاف نظام نقاط الولاء والمكافآت"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>نظام الولاء:</span>
            <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
              settings.enableLoyaltyPoints !== false ? 'bg-emerald-500 text-white' : 'bg-slate-400 text-white'
            }`}>
              {settings.enableLoyaltyPoints !== false ? 'مُفعّل (يعمل)' : 'مُعطّل (متوقف)'}
            </span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 text-xs font-black rounded-xl shadow-md shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addCustomer')} جديد</span>
          </button>
        </div>
      </div>

      {/* 4 Financial & Customer Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Customers */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">إجمالي سجل العملاء</span>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mt-0.5 font-mono">
              {stats.totalCustomers} <span className="text-xs font-bold text-slate-400">عميل</span>
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Total Customer Debts (Outstanding) */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-red-200/90 dark:border-red-900/40 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-red-600 dark:text-red-400 flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>إجمالي ديون العملاء (مستحقة)</span>
            </span>
            <h3 className="text-lg font-black text-red-600 dark:text-red-400 mt-0.5 font-mono">
              {formatCurrency(stats.totalDebt)}
            </h3>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              على {stats.debtCustomersCount} عميل مدين
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center">
            <Coins className="w-5 h-5" />
          </div>
        </div>

        {/* Settled Customers (Zero Debt) */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200/90 dark:border-emerald-900/40 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>عملاء مبرؤو الذمة (0 دين)</span>
            </span>
            <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono">
              {stats.zeroDebtCustomersCount} <span className="text-xs font-bold text-slate-400">عميل</span>
            </h3>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              ذمم مسددة بالكامل
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Loyalty System Status Card */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200/90 dark:border-amber-900/40 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>نظام نقاط الولاء</span>
            </span>
            <h3 className="text-lg font-black text-slate-900 dark:text-white mt-0.5 font-mono">
              {settings.enableLoyaltyPoints !== false ? `${stats.totalPoints} نقطة` : 'متوقف'}
            </h3>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {settings.enableLoyaltyPoints !== false ? 'مفعل لكافة الفواتير' : 'معطل من الإعدادات'}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Star className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Grid: Customer List & Customer Detailed Financial Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left / Main Section: Search, Category Filters, and Detailed Table (7 Cols) */}
        <div className="lg:col-span-7 space-y-3">
          {/* Search bar & Filter Pills */}
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="بحث باسم العميل، رقم الهاتف، أو كود الحساب..."
                className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  filterType === 'all'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                كافة العملاء ({customers.length})
              </button>

              <button
                type="button"
                onClick={() => setFilterType('debt_only')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  filterType === 'debt_only'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 border border-red-200 dark:border-red-900/50'
                }`}
              >
                <TrendingDown className="w-3.5 h-3.5" />
                <span>عملاء مدينون بذمم ({stats.debtCustomersCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setFilterType('zero_debt')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  filterType === 'zero_debt'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-900/50'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>مبرؤو الذمة ({stats.zeroDebtCustomersCount})</span>
              </button>

              {settings.enableLoyaltyPoints !== false && (
                <button
                  type="button"
                  onClick={() => setFilterType('loyalty')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    filterType === 'loyalty'
                      ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                      : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 border border-amber-200 dark:border-amber-900/50'
                  }`}
                >
                  <Star className="w-3.5 h-3.5" />
                  <span>أعضاء الولاء</span>
                </button>
              )}
            </div>
          </div>

          {/* Customers and Debts Table Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-start text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                    <th className="py-3 px-4 text-start">العميل</th>
                    <th className="py-3 px-3 text-start">الكود / الهاتف</th>
                    <th className="py-3 px-3 text-start">الدين المستحق (الذمة)</th>
                    {settings.enableLoyaltyPoints !== false && (
                      <th className="py-3 px-3 text-center">نقاط الولاء</th>
                    )}
                    <th className="py-3 px-3 text-end">إجمالي المشتريات</th>
                    <th className="py-3 px-4 text-center">إجراء سريع</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <Users className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
                        <p className="text-xs font-bold">لا يوجد عملاء يطابقون خيارات البحث أو التصفية الحالية</p>
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map(customer => {
                      const isSelected = selectedCustomer?.id === customer.id;
                      const debt = customer.currentDebt || 0;
                      const hasDebt = debt > 0;

                      return (
                        <tr
                          key={customer.id}
                          onClick={() => setSelectedCustomer(customer)}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-amber-500/10 dark:bg-amber-950/40'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-8 h-8 rounded-full text-white flex items-center justify-center font-black text-xs shrink-0 ${
                                hasDebt ? 'bg-gradient-to-tr from-red-600 to-amber-600' : 'bg-gradient-to-tr from-amber-600 to-amber-500'
                              }`}>
                                {customer.name.charAt(0)}
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 dark:text-white block">
                                  {customer.name}
                                </span>
                                {customer.companyName && (
                                  <span className="text-[10px] text-slate-400 block">{customer.companyName}</span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            <span className="font-mono font-bold text-amber-600 dark:text-amber-400 block">
                              {customer.customerCode}
                            </span>
                            <span className="font-mono text-[11px] text-slate-400 block">
                              {customer.phone}
                            </span>
                          </td>

                          {/* Individual Customer Debt Display */}
                          <td className="py-3 px-3">
                            {hasDebt ? (
                              <div className="inline-flex flex-col">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 font-mono border border-red-200 dark:border-red-900/50">
                                  <TrendingDown className="w-3 h-3 text-red-600" />
                                  <span>{formatCurrency(debt)}</span>
                                </span>
                                <span className="text-[9px] text-red-500 font-bold mt-0.5">
                                  مستحق الدفع (مدين)
                                </span>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>0 (مبرأ الذمة)</span>
                              </span>
                            )}
                          </td>

                          {/* Loyalty Points (Conditional) */}
                          {settings.enableLoyaltyPoints !== false && (
                            <td className="py-3 px-3 text-center">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-black bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                {customer.points}
                              </span>
                            </td>
                          )}

                          <td className="py-3 px-3 text-end font-mono font-bold text-slate-800 dark:text-slate-200">
                            {formatCurrency(customer.totalSpent)}
                          </td>

                          {/* Action Buttons */}
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5" onClick={e => e.stopPropagation()}>
                              {hasDebt && (
                                <>
                                  <button
                                    onClick={() => {
                                      setSelectedCustomer(customer);
                                      setPayAmount(debt);
                                      setIsPayModalOpen(true);
                                    }}
                                    className="p-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold transition-all shadow-xs"
                                    title="تسديد دفعة / سند قبض"
                                  >
                                    <Receipt className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    onClick={() => handleSendWhatsAppReminder(customer)}
                                    className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 hover:bg-emerald-200 text-emerald-700 dark:text-emerald-300 text-[11px] transition-all"
                                    title="إرسال تذكير بالدين عبر واتساب"
                                  >
                                    <MessageSquareShare className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}

                              <button
                                onClick={() => {
                                  setSelectedCustomer(customer);
                                  setIsStatementOpen(true);
                                }}
                                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] transition-all"
                                title="كشف حساب تفصيلي"
                              >
                                <FileText className="w-3.5 h-3.5" />
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
        </div>

        {/* Right Section: Individual Customer Financial Breakdown & Card (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {selectedCustomer ? (
            <div className="space-y-4 animate-in fade-in">
              {/* 1. INDIVIDUAL DEBT & FINANCIAL BALANCE CARD */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">
                        الذمة المالية للعميل: {selectedCustomer.name}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono">
                        كود: {selectedCustomer.customerCode} | {selectedCustomer.phone}
                      </span>
                    </div>
                  </div>

                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                    (selectedCustomer.currentDebt || 0) > 0
                      ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
                      : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                  }`}>
                    {(selectedCustomer.currentDebt || 0) > 0 ? 'مترتب عليه دين' : 'مبرأ الذمة تماماً'}
                  </span>
                </div>

                {/* Big Debt Amount Display */}
                <div className={`p-4 rounded-2xl border text-center space-y-1 ${
                  (selectedCustomer.currentDebt || 0) > 0
                    ? 'bg-red-50/80 dark:bg-red-950/30 border-red-200 dark:border-red-900/50'
                    : 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50'
                }`}>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                    الرصيد المدين المتبقي على العميل حالياً
                  </span>
                  <div className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
                    (selectedCustomer.currentDebt || 0) > 0
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {formatCurrency(selectedCustomer.currentDebt || 0)}
                  </div>
                  {selectedCustomer.creditLimit ? (
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 mt-2 text-xs text-slate-600 dark:text-slate-300 flex justify-between">
                      <span>سقف الائتمان المسموح:</span>
                      <span className="font-mono font-bold">{formatCurrency(selectedCustomer.creditLimit)}</span>
                    </div>
                  ) : null}
                </div>

                {/* Fast Action Buttons for this Customer's Debt */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPayAmount(selectedCustomer.currentDebt || '');
                      setIsPayModalOpen(true);
                    }}
                    className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-black rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>سند قبض (تسديد)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsAddDebtModalOpen(true)}
                    className="py-2.5 px-3 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 text-xs font-black rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span>قيد ذمة جديد</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsStatementOpen(true)}
                    className="py-2.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-500" />
                    <span>كشف حساب تفصيلي</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSendWhatsAppReminder(selectedCustomer)}
                    className="py-2.5 px-3 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-xl border border-emerald-200 dark:border-emerald-800 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <MessageSquareShare className="w-3.5 h-3.5 text-emerald-500" />
                    <span>تذكير بالدين (WhatsApp)</span>
                  </button>
                </div>
              </div>

              {/* 2. Virtual Membership Card & Loyalty Section */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
                <div className="p-4 rounded-2xl bg-gradient-to-tr from-slate-950 via-slate-900 to-amber-950 text-white shadow-xl relative overflow-hidden border border-amber-500/30">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono tracking-widest text-amber-400 uppercase font-black">
                        بطاقة عضوية العميل
                      </span>
                      <h3 className="text-lg font-black mt-1">{selectedCustomer.name}</h3>
                      <p className="text-xs font-mono text-slate-300">{selectedCustomer.phone}</p>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-sm">
                      K
                    </div>
                  </div>

                  <div className="mt-6 flex items-end justify-between">
                    <div>
                      <span className="text-[9px] text-slate-400 block">رصيد نقاط الولاء:</span>
                      {settings.enableLoyaltyPoints !== false ? (
                        <span className="text-xl font-black text-amber-400 flex items-center gap-1 font-mono">
                          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                          {selectedCustomer.points} نقطة
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-slate-400">
                          نظام النقاط متوقف
                        </span>
                      )}
                    </div>

                    <div className="text-end">
                      <span className="text-[9px] font-mono text-slate-400">رقم العضوية:</span>
                      <p className="text-xs font-mono font-bold text-white">{selectedCustomer.customerCode}</p>
                    </div>
                  </div>
                </div>

                {/* QR Code Section */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex flex-col items-center justify-center text-center">
                  {customerQrDataUrl && (
                    <img src={customerQrDataUrl} alt="Member QR" className="w-32 h-32 rounded-xl shadow-xs" />
                  )}
                  <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 mt-2">
                    {selectedCustomer.customerCode}
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    امسح الرمز في شاشة الكاشير لربط العضو بالفاتورة مباشرة
                  </p>
                </div>

                {/* Adjust Points or Print Card */}
                <div className="flex gap-2">
                  {settings.enableLoyaltyPoints !== false && (
                    <button
                      onClick={() => setIsPointsModalOpen(true)}
                      className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Star className="w-3.5 h-3.5" />
                      <span>تعديل رصيد النقاط</span>
                    </button>
                  )}

                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                    title="طباعة بطاقة العضوية"
                  >
                    <Printer className="w-4 h-4" />
                    <span>طباعة</span>
                  </button>
                </div>
              </div>

              {/* 3. Customer Recent Transactions & Invoices Tab */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
                <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5 text-amber-500" />
                  <span>سجل حركات وفواتير العميل الأخيرة ({customerInvoices.length + customerTransactions.length})</span>
                </h4>

                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {customerInvoices.length === 0 && customerTransactions.length === 0 ? (
                    <p className="text-[11px] text-slate-400 text-center py-3">لا توجد حركات أو فواتير سابقة لهذا العميل</p>
                  ) : (
                    <>
                      {/* Vouchers */}
                      {customerTransactions.slice(0, 5).map(tx => (
                        <div
                          key={tx.id}
                          onClick={() => {
                            setSelectedVoucher(tx);
                            setIsVoucherOpen(true);
                          }}
                          className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 flex justify-between items-center text-xs hover:border-amber-500 cursor-pointer transition-all"
                        >
                          <div className="flex items-center gap-2">
                            <span className={`p-1 rounded-md text-[10px] font-bold ${
                              tx.type === 'payment' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950' : 'bg-red-100 text-red-700 dark:bg-red-950'
                            }`}>
                              {tx.type === 'payment' ? 'سند قبض' : 'قيد ذمة'}
                            </span>
                            <div>
                              <p className="font-mono font-bold text-slate-900 dark:text-white">{tx.voucherNumber}</p>
                              <span className="text-[10px] text-slate-400">{new Date(tx.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <span className={`font-mono font-bold ${tx.type === 'payment' ? 'text-emerald-600' : 'text-red-600'}`}>
                            {tx.type === 'payment' ? '-' : '+'}{formatCurrency(tx.amount)}
                          </span>
                        </div>
                      ))}

                      {/* Invoices */}
                      {customerInvoices.slice(0, 5).map(inv => (
                        <div
                          key={inv.id}
                          className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 flex justify-between items-center text-xs"
                        >
                          <div>
                            <p className="font-mono font-bold text-slate-900 dark:text-white">{inv.invoiceNumber}</p>
                            <span className="text-[10px] text-slate-400">{new Date(inv.createdAt).toLocaleDateString()}</span>
                          </div>
                          <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                            {formatCurrency(inv.total)}
                          </span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 p-10 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs text-center text-slate-400 space-y-2">
              <Users className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                اختر عميلاً من القائمة لمعاينة ذمته المالية وسندات ديونه وبطاقة عضويته
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: Add New Customer */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-500" />
                <span>تسجيل عميل جديد وتحديد الذمة المالية</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="p-6 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  اسم العميل الكامل *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="مثال: حسام الدين خالد"
                  className="w-full text-xs font-bold px-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    رقم الهاتف *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="09..."
                    className="w-full text-xs font-mono font-bold px-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    سقف الائتمان ({settings.currency.symbol})
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={creditLimit}
                    onChange={e => setCreditLimit(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0 = بدون حد"
                    className="w-full text-xs font-mono font-bold px-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  رصيد الدين الافتتاحي (إن وجد) ({settings.currency.symbol})
                </label>
                <input
                  type="number"
                  min={0}
                  value={initialDebt}
                  onChange={e => setInitialDebt(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full text-xs font-mono font-bold px-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  العنوان أو مكان العمل (اختياري)
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="دمشق — الميدان..."
                  className="w-full text-xs px-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xl shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  حفظ وتسجيل العميل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Record Customer Payment (سند قبض مالي) */}
      {isPayModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 bg-emerald-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                <div>
                  <h3 className="font-black text-sm">تسجيل سند قبض مالي (سداد دين)</h3>
                  <p className="text-[11px] text-emerald-100">العميل: {selectedCustomer.name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsPayModalOpen(false)}
                className="p-1 rounded-full text-emerald-200 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
                <span className="text-slate-500">الدين الحالي المستحق:</span>
                <span className="font-mono font-black text-red-600 dark:text-red-400 text-sm">
                  {formatCurrency(selectedCustomer.currentDebt || 0)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  المبلغ المسدد نقداً / بالحوالة ({settings.currency.symbol}) *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="أدخل المبلغ المسدد..."
                  className="w-full text-lg font-mono font-black px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-emerald-500 text-center"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    طريقة السداد
                  </label>
                  <select
                    value={payMethod}
                    onChange={e => setPayMethod(e.target.value as any)}
                    className="w-full text-xs font-bold px-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none"
                  >
                    <option value="cash">نقداً (كاش)</option>
                    <option value="transfer">حوالة مصرفية</option>
                    <option value="card">بطاقة دفع</option>
                    <option value="check">شيك مصرفي</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    خصم تسوية ممنوح (إن وجد)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={payDiscount}
                    onChange={e => setPayDiscount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0"
                    className="w-full text-xs font-mono font-bold px-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ملاحظات أو رقم الإشعار البنكي
                </label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={e => setPayNotes(e.target.value)}
                  placeholder="مثال: دفعة بموجب إشعار..."
                  className="w-full text-xs px-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md cursor-pointer"
                >
                  تأكيد وإصدار سند القبض
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Add Manual Debt (قيد ذمة مالي) */}
      {isAddDebtModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 bg-amber-500 text-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5" />
                <div>
                  <h3 className="font-black text-sm">تسجيل قيد ذمة جديد (إضافة دين)</h3>
                  <p className="text-[11px] font-bold text-slate-800">العميل: {selectedCustomer.name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddDebtModalOpen(false)}
                className="p-1 rounded-full text-slate-800 hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddManualDebt} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  مبلغ الدين الإضافي ({settings.currency.symbol}) *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={manualDebtAmount}
                  onChange={e => setManualDebtAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="أدخل مبلغ الدين..."
                  className="w-full text-lg font-mono font-black px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500 text-center"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  رقم الفاتورة أو المرجع اليدوي (اختياري)
                </label>
                <input
                  type="text"
                  value={manualDebtRef}
                  onChange={e => setManualDebtRef(e.target.value)}
                  placeholder="مثال: INV-MANUAL-001"
                  className="w-full text-xs font-mono px-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  سبب أو تفاصيل القيد
                </label>
                <input
                  type="text"
                  value={manualDebtNotes}
                  onChange={e => setManualDebtNotes(e.target.value)}
                  placeholder="مثال: بضاعة مسحوبة بالآجل..."
                  className="w-full text-xs px-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddDebtModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xl shadow-md cursor-pointer"
                >
                  تأكيد وإضافة الدين
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Adjust Points Modal */}
      {isPointsModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                تعديل نقاط: {selectedCustomer.name}
              </h3>
              <button
                onClick={() => setIsPointsModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePointsSubmit} className="p-6 space-y-3.5">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 text-center">
                <span className="text-xs text-amber-800 dark:text-amber-300 font-bold block">
                  الرصيد الحالي: {selectedCustomer.points} نقطة
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  النقاط المراد إضافتها أو خصمها (+ أو -)
                </label>
                <input
                  type="number"
                  required
                  value={pointsChange}
                  onChange={e => setPointsChange(Number(e.target.value))}
                  className="w-full text-lg font-bold font-mono px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 text-center focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  سبب التعديل
                </label>
                <input
                  type="text"
                  placeholder="مثال: هدية ترحيبية، تصحيح..."
                  value={pointsReason}
                  onChange={e => setPointsReason(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPointsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xl cursor-pointer"
                >
                  تأكيد النقاط
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: Account Statement */}
      {selectedCustomer && (
        <AccountStatementModal
          isOpen={isStatementOpen}
          onClose={() => setIsStatementOpen(false)}
          partyType="customer"
          party={selectedCustomer}
          onSelectVoucher={voucher => {
            setSelectedVoucher(voucher);
            setIsStatementOpen(false);
            setIsVoucherOpen(true);
          }}
        />
      )}

      {/* MODAL 6: Printable Voucher Modal */}
      {selectedVoucher && (
        <PrintableVoucherModal
          isOpen={isVoucherOpen}
          onClose={() => {
            setIsVoucherOpen(false);
            setSelectedVoucher(null);
          }}
          voucher={selectedVoucher}
        />
      )}
    </div>
  );
};
