import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Customer, Supplier, DebtTransaction, PaymentMethod } from '../../types';
import {
  Users,
  Building2,
  FileText,
  Plus,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  Printer,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Wallet,
  Coins,
  CheckCircle2,
  AlertCircle,
  Clock,
  Filter,
  FileSpreadsheet,
  Download,
  ReceiptText,
  Percent,
  X,
  Edit2,
  Trash2,
  Eye,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  MessageSquareShare,
  Send,
  Sparkles
} from 'lucide-react';
import { PrintableVoucherModal } from './PrintableVoucherModal';
import { AccountStatementModal } from './AccountStatementModal';
import { WhatsAppDebtAutomationDashboard } from './WhatsAppDebtAutomationDashboard';
import {
  buildDebtPeriodicReminderMessage,
  sendWhatsAppDebtMessage,
  DEBT_COLLECTION_STORAGE_KEY,
  DebtReminderLog
} from '../../services/debtCollectionService';


export const DebtView: React.FC = () => {
  const {
    customers,
    suppliers,
    debtTransactions,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    recordCustomerDebtPayment,
    addCustomerManualDebt,
    recordSupplierDebtPayment,
    addSupplierInvoiceDebt,
    formatCurrency,
    settings,
    t,
    language,
    notify
  } = useApp();

  // Active Main Tab
  const [activeTab, setActiveTab] = useState<'customers' | 'suppliers' | 'vouchers'>('customers');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterDebtOnly, setFilterDebtOnly] = useState<boolean>(true);
  const [voucherTypeFilter, setVoucherTypeFilter] = useState<'all' | 'payment' | 'charge' | 'customer' | 'supplier'>('all');

  // Modals state
  const [isCustomerPayModalOpen, setIsCustomerPayModalOpen] = useState(false);
  const [selectedCustomerForPay, setSelectedCustomerForPay] = useState<Customer | null>(null);
  const [customerPayAmount, setCustomerPayAmount] = useState<number | ''>('');
  const [customerPayDiscount, setCustomerPayDiscount] = useState<number | ''>('');
  const [customerPayMethod, setCustomerPayMethod] = useState<'cash' | 'card' | 'transfer' | 'check'>('cash');
  const [customerPayNotes, setCustomerPayNotes] = useState<string>('');

  const [isCustomerAddDebtModalOpen, setIsCustomerAddDebtModalOpen] = useState(false);
  const [selectedCustomerForDebt, setSelectedCustomerForDebt] = useState<Customer | null>(null);
  const [customerDebtAmount, setCustomerDebtAmount] = useState<number | ''>('');
  const [customerDebtRefInvoice, setCustomerDebtRefInvoice] = useState<string>('');
  const [customerDebtNotes, setCustomerDebtNotes] = useState<string>('');

  // Supplier Modals
  const [isSupplierPayModalOpen, setIsSupplierPayModalOpen] = useState(false);
  const [selectedSupplierForPay, setSelectedSupplierForPay] = useState<Supplier | null>(null);
  const [supplierPayAmount, setSupplierPayAmount] = useState<number | ''>('');
  const [supplierPayDiscount, setSupplierPayDiscount] = useState<number | ''>('');
  const [supplierPayMethod, setSupplierPayMethod] = useState<'cash' | 'card' | 'transfer' | 'check'>('cash');
  const [supplierPayNotes, setSupplierPayNotes] = useState<string>('');

  const [isSupplierInvoiceModalOpen, setIsSupplierInvoiceModalOpen] = useState(false);
  const [selectedSupplierForInvoice, setSelectedSupplierForInvoice] = useState<Supplier | null>(null);
  const [supplierInvoiceAmount, setSupplierInvoiceAmount] = useState<number | ''>('');
  const [supplierInvoiceRef, setSupplierInvoiceRef] = useState<string>('');
  const [supplierInvoiceNotes, setSupplierInvoiceNotes] = useState<string>('');

  // Add/Edit Supplier Modal
  const [isSupplierFormOpen, setIsSupplierFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierFormData, setSupplierFormData] = useState({
    name: '',
    code: '',
    phone: '',
    address: '',
    companyName: '',
    currentDebt: 0,
    totalPurchases: 0,
    notes: '',
  });

  // Statement & Voucher View Modals
  const [selectedPartyForStatement, setSelectedPartyForStatement] = useState<{
    type: 'customer' | 'supplier';
    party: Customer | Supplier;
  } | null>(null);

  const [selectedVoucherForPrint, setSelectedVoucherForPrint] = useState<DebtTransaction | null>(null);

  // WhatsApp Debt Reminder Preview Modal
  const [isWhatsAppReminderModalOpen, setIsWhatsAppReminderModalOpen] = useState(false);
  const [isWhatsAppAutomationModalOpen, setIsWhatsAppAutomationModalOpen] = useState(false);
  const [targetCustomerForReminder, setTargetCustomerForReminder] = useState<Customer | null>(null);
  const [reminderMessageDraft, setReminderMessageDraft] = useState<string>('');
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [reminderLogs, setReminderLogs] = useState<DebtReminderLog[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(DEBT_COLLECTION_STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  });


  // Totals & KPI Calculations
  const totalCustomerDebt = useMemo(() => {
    return customers.reduce((sum, c) => sum + (c.currentDebt || 0), 0);
  }, [customers]);

  const totalSupplierDebt = useMemo(() => {
    return suppliers.reduce((sum, s) => sum + (s.currentDebt || 0), 0);
  }, [suppliers]);

  const netBalance = totalCustomerDebt - totalSupplierDebt;

  const customersWithDebtCount = useMemo(() => {
    return customers.filter(c => (c.currentDebt || 0) > 0).length;
  }, [customers]);

  const suppliersWithDebtCount = useMemo(() => {
    return suppliers.filter(s => (s.currentDebt || 0) > 0).length;
  }, [suppliers]);

  // Filtered Lists
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      if (filterDebtOnly && (c.currentDebt || 0) <= 0) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          c.name.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          c.customerCode.toLowerCase().includes(q)
        );
      }
      return true;
    }).sort((a, b) => (b.currentDebt || 0) - (a.currentDebt || 0));
  }, [customers, filterDebtOnly, searchQuery]);

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => {
      if (filterDebtOnly && (s.currentDebt || 0) <= 0) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          s.name.toLowerCase().includes(q) ||
          (s.phone && s.phone.includes(q)) ||
          s.code.toLowerCase().includes(q) ||
          (s.companyName && s.companyName.toLowerCase().includes(q))
        );
      }
      return true;
    }).sort((a, b) => (b.currentDebt || 0) - (a.currentDebt || 0));
  }, [suppliers, filterDebtOnly, searchQuery]);

  const filteredVouchers = useMemo(() => {
    return debtTransactions.filter(tx => {
      if (voucherTypeFilter === 'payment' && tx.type !== 'payment') return false;
      if (voucherTypeFilter === 'charge' && tx.type !== 'charge') return false;
      if (voucherTypeFilter === 'customer' && tx.partyType !== 'customer') return false;
      if (voucherTypeFilter === 'supplier' && tx.partyType !== 'supplier') return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          tx.voucherNumber.toLowerCase().includes(q) ||
          tx.partyName.toLowerCase().includes(q) ||
          (tx.notes && tx.notes.toLowerCase().includes(q)) ||
          (tx.referenceInvoice && tx.referenceInvoice.toLowerCase().includes(q))
        );
      }
      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [debtTransactions, voucherTypeFilter, searchQuery]);

  // Handlers for Customer Payments
  const handleOpenCustomerPay = (cust: Customer) => {
    setSelectedCustomerForPay(cust);
    setCustomerPayAmount(cust.currentDebt || 0);
    setCustomerPayDiscount('');
    setCustomerPayMethod('cash');
    setCustomerPayNotes('');
    setIsCustomerPayModalOpen(true);
  };

  const handleExecuteCustomerPay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerForPay) return;
    const amount = Number(customerPayAmount) || 0;
    const discount = Number(customerPayDiscount) || 0;

    if (amount <= 0 && discount <= 0) {
      notify('تنبيه', 'يرجى إدخال مبلغ التحصيل أو الخصم', 'warning');
      return;
    }

    const tx = recordCustomerDebtPayment(
      selectedCustomerForPay.id,
      amount,
      customerPayMethod,
      customerPayNotes,
      discount
    );

    if (tx) {
      setIsCustomerPayModalOpen(false);
      setSelectedVoucherForPrint(tx);
    }
  };

  const handleOpenWhatsAppReminder = (cust: Customer) => {
    if (!cust.phone) {
      notify('تنبيه', 'لا يوجد رقم هاتف مسجل لهذا العميل لإرسال تذكير بالواتساب', 'warning');
      return;
    }
    setTargetCustomerForReminder(cust);
    const draft = buildDebtPeriodicReminderMessage({
      storeSettings: settings,
      customer: cust,
      bulletin: settings.exchangeBulletin
    });
    setReminderMessageDraft(draft);
    setIsWhatsAppReminderModalOpen(true);
  };

  const handleSendWhatsAppReminderDirectly = async () => {
    if (!targetCustomerForReminder || !reminderMessageDraft) return;

    setIsSendingWhatsApp(true);
    try {
      await sendWhatsAppDebtMessage({
        phone: targetCustomerForReminder.phone,
        message: reminderMessageDraft,
        customerName: targetCustomerForReminder.name,
        customerId: targetCustomerForReminder.id,
        amountDue: targetCustomerForReminder.currentDebt,
        totalDebt: targetCustomerForReminder.currentDebt,
        currencySymbol: settings.currency.symbolNative || settings.currency.symbol,
        type: 'manual_reminder',
        storeSettings: settings
      });

      // Update local logs state
      try {
        const updatedLogs = JSON.parse(localStorage.getItem(DEBT_COLLECTION_STORAGE_KEY) || '[]');
        setReminderLogs(updatedLogs);
      } catch {}

      notify(
        'تم إرسال التذكير بنجاح',
        `تم إرسال تذكير تسديد الدين إلى واتساب ${targetCustomerForReminder.name}`,
        'success'
      );
      setIsWhatsAppReminderModalOpen(false);
    } catch (err: any) {
      notify('تعذر الإرسال الآلي', err?.message || 'يرجى التحقق من الاتصال بالإنترنت', 'error');
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  const handleOpenCustomerAddDebt = (cust: Customer) => {
    setSelectedCustomerForDebt(cust);
    setCustomerDebtAmount('');
    setCustomerDebtRefInvoice('');
    setCustomerDebtNotes('');
    setIsCustomerAddDebtModalOpen(true);
  };

  const handleExecuteCustomerAddDebt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerForDebt) return;
    const amount = Number(customerDebtAmount) || 0;
    if (amount <= 0) {
      notify('تنبيه', 'يرجى إدخال قيمة الدين الآجل', 'warning');
      return;
    }

    const tx = addCustomerManualDebt(
      selectedCustomerForDebt.id,
      amount,
      customerDebtRefInvoice,
      customerDebtNotes
    );

    if (tx) {
      setIsCustomerAddDebtModalOpen(false);
      setSelectedVoucherForPrint(tx);
    }
  };

  // Handlers for Supplier Payments
  const handleOpenSupplierPay = (sup: Supplier) => {
    setSelectedSupplierForPay(sup);
    setSupplierPayAmount(sup.currentDebt || 0);
    setSupplierPayDiscount('');
    setSupplierPayMethod('cash');
    setSupplierPayNotes('');
    setIsSupplierPayModalOpen(true);
  };

  const handleExecuteSupplierPay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierForPay) return;
    const amount = Number(supplierPayAmount) || 0;
    const discount = Number(supplierPayDiscount) || 0;

    if (amount <= 0 && discount <= 0) {
      notify('تنبيه', 'يرجى إدخال مبلغ السداد', 'warning');
      return;
    }

    const tx = recordSupplierDebtPayment(
      selectedSupplierForPay.id,
      amount,
      supplierPayMethod,
      supplierPayNotes,
      discount
    );

    if (tx) {
      setIsSupplierPayModalOpen(false);
      setSelectedVoucherForPrint(tx);
    }
  };

  const handleOpenSupplierInvoice = (sup: Supplier) => {
    setSelectedSupplierForInvoice(sup);
    setSupplierInvoiceAmount('');
    setSupplierInvoiceRef('');
    setSupplierInvoiceNotes('');
    setIsSupplierInvoiceModalOpen(true);
  };

  const handleExecuteSupplierInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierForInvoice) return;
    const amount = Number(supplierInvoiceAmount) || 0;
    if (amount <= 0) {
      notify('تنبيه', 'يرجى إدخال قيمة الفاتورة الآجلة', 'warning');
      return;
    }

    const tx = addSupplierInvoiceDebt(
      selectedSupplierForInvoice.id,
      amount,
      supplierInvoiceRef,
      supplierInvoiceNotes
    );

    if (tx) {
      setIsSupplierInvoiceModalOpen(false);
      setSelectedVoucherForPrint(tx);
    }
  };

  // Supplier Add / Edit Form
  const handleOpenAddSupplier = () => {
    setEditingSupplier(null);
    setSupplierFormData({
      name: '',
      code: `SUP-${Math.floor(100 + Math.random() * 900)}`,
      phone: '',
      address: '',
      companyName: '',
      currentDebt: 0,
      totalPurchases: 0,
      notes: '',
    });
    setIsSupplierFormOpen(true);
  };

  const handleOpenEditSupplier = (sup: Supplier) => {
    setEditingSupplier(sup);
    setSupplierFormData({
      name: sup.name,
      code: sup.code,
      phone: sup.phone || '',
      address: sup.address || '',
      companyName: sup.companyName || '',
      currentDebt: sup.currentDebt || 0,
      totalPurchases: sup.totalPurchases || 0,
      notes: sup.notes || '',
    });
    setIsSupplierFormOpen(true);
  };

  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierFormData.name.trim()) {
      notify('تنبيه', 'يرجى إدخال اسم المورد أو الشركة', 'warning');
      return;
    }

    if (editingSupplier) {
      updateSupplier(editingSupplier.id, supplierFormData);
    } else {
      addSupplier(supplierFormData);
    }
    setIsSupplierFormOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-100 dark:bg-slate-950">
      {/* Top Title & Quick Stats Banner */}
      <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                <Wallet className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                إدارة حسابات الديون والذمم (الزبائن والموردين)
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              متابعة ديون الزبائن الآجلة، مستحقات الموردين، إصدار سندات القبض والصرف، وتوليد كشوفات الحساب
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsWhatsAppAutomationModalOpen(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <MessageSquareShare className="w-4 h-4" />
              <span>إعدادات التذكير الآلي (واتساب)</span>
            </button>

            {activeTab === 'suppliers' && (
              <button
                type="button"
                onClick={handleOpenAddSupplier}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>+ إضافة مورد جديد</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة الملخص</span>
            </button>
          </div>
        </div>

        {/* Financial KPI Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
          {/* 1. Customer Debts */}
          <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/80 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-indigo-900 dark:text-indigo-300">
                ديون الزبائن (الذمم المدينة)
              </span>
              <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="text-lg sm:text-xl font-black font-mono text-indigo-600 dark:text-indigo-400 mt-1">
              {formatCurrency(totalCustomerDebt)}
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
              {customersWithDebtCount} عميل عليه ذمم مستحقة
            </span>
          </div>

          {/* 2. Supplier Debts */}
          <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/80 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-900 dark:text-amber-300">
                مستحقات الموردين (الذمم الدائنة)
              </span>
              <Building2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-lg sm:text-xl font-black font-mono text-amber-600 dark:text-amber-400 mt-1">
              {formatCurrency(totalSupplierDebt)}
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
              {suppliersWithDebtCount} مورد مطلوب له دفعات
            </span>
          </div>

          {/* 3. Net Balance */}
          <div className={`p-3 rounded-2xl border ${
            netBalance >= 0
              ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-bold ${netBalance >= 0 ? 'text-emerald-900 dark:text-emerald-300' : 'text-rose-900 dark:text-rose-300'}`}>
                صافي المركز المالي للذمم
              </span>
              {netBalance >= 0 ? (
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-rose-600" />
              )}
            </div>
            <div className={`text-lg sm:text-xl font-black font-mono mt-1 ${netBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {formatCurrency(Math.abs(netBalance))}
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
              {netBalance >= 0 ? 'فائض لصالح المتجر (ديون أكثر)' : 'عجز (مستحقات موردين أكثر)'}
            </span>
          </div>

          {/* 4. Total Vouchers Count */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                سجل السندات والحركات
              </span>
              <FileText className="w-4 h-4 text-slate-500" />
            </div>
            <div className="text-lg sm:text-xl font-black font-mono text-slate-900 dark:text-white mt-1">
              {debtTransactions.length} <span className="text-xs font-normal text-slate-400">سند</span>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
              سندات قبض وصرف موثقة
            </span>
          </div>
        </div>
      </div>

      {/* Main View Body & Tabs */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden p-3 sm:p-5 space-y-3">
        {/* Navigation Tabs Bar & Search / Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              type="button"
              id="tab-debt-customers"
              onClick={() => setActiveTab('customers')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'customers'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>ديون الزبائن ({customers.length})</span>
              {totalCustomerDebt > 0 && (
                <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px] font-mono">
                  {formatCurrency(totalCustomerDebt)}
                </span>
              )}
            </button>

            <button
              type="button"
              id="tab-debt-suppliers"
              onClick={() => setActiveTab('suppliers')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'suppliers'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>ديون الموردين ({suppliers.length})</span>
              {totalSupplierDebt > 0 && (
                <span className="px-1.5 py-0.2 rounded-md bg-slate-950/20 text-[10px] font-mono">
                  {formatCurrency(totalSupplierDebt)}
                </span>
              )}
            </button>

            <button
              type="button"
              id="tab-debt-vouchers"
              onClick={() => setActiveTab('vouchers')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'vouchers'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>سجل السندات المالية ({debtTransactions.length})</span>
            </button>
          </div>

          {/* Search & Only Debt Toggle */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={
                  activeTab === 'customers' ? 'بحث باسم الزبون أو الهاتف...' :
                  activeTab === 'suppliers' ? 'بحث باسم المورد أو الشركة...' :
                  'بحث برقم السند أو الاسم...'
                }
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full text-xs py-2 ps-9 pe-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {activeTab !== 'vouchers' ? (
              <button
                type="button"
                onClick={() => setFilterDebtOnly(!filterDebtOnly)}
                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                  filterDebtOnly
                    ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
              >
                {filterDebtOnly ? 'المدينون فقط' : 'عرض الكل'}
              </button>
            ) : (
              <select
                value={voucherTypeFilter}
                onChange={e => setVoucherTypeFilter(e.target.value as any)}
                className="text-xs py-2 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="all">كافة السندات</option>
                <option value="payment">سندات قبض وصرف (تسديدات)</option>
                <option value="charge">قيود الذمم والمشتريات</option>
                <option value="customer">سندات الزبائن فقط</option>
                <option value="supplier">سندات الموردين فقط</option>
              </select>
            )}
          </div>
        </div>

        {/* TAB 1: CUSTOMERS DEBTS */}
        {activeTab === 'customers' && (
          <div className="flex-1 overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 sm:p-4">
            {filteredCustomers.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <Users className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-2" />
                <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                  {filterDebtOnly ? 'لا يوجد زبائن عليهم ديون مستحقة حالياً' : 'لا يوجد زبائن مطابقين للبحث'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  يمكنك إجراء عملية بيع بالآجل من شاشة الكاشير لتقييد الذمم تلقائياً
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {filteredCustomers.map(cust => {
                  const debt = cust.currentDebt || 0;
                  const creditLimit = cust.creditLimit || 500000;
                  const usagePercent = Math.min(100, Math.round((debt / creditLimit) * 100));

                  return (
                    <div
                      key={cust.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between shadow-2xs ${
                        debt > 0
                          ? 'bg-gradient-to-b from-indigo-50/40 to-white dark:from-indigo-950/20 dark:to-slate-900 border-indigo-200/80 dark:border-indigo-800/80'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h3 className="font-black text-sm text-slate-900 dark:text-white">
                                {cust.name}
                              </h3>
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                {cust.customerType === 'wholesale' ? 'تاجر جملة' : 'مفرق'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                              {cust.phone} • {cust.customerCode}
                            </div>
                          </div>

                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            debt > 0
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                          }`}>
                            {debt > 0 ? 'مستحق الدفع' : 'حساب مبرأ'}
                          </span>
                        </div>

                        {/* Debt Amount Display */}
                        <div className="mt-3 p-3 bg-white dark:bg-slate-800/70 rounded-xl border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold block">
                              الرصيد المدين المستحق:
                            </span>
                            <span className={`text-xl font-black font-mono tracking-tight ${debt > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                              {formatCurrency(debt)}
                            </span>
                          </div>
                          <div className="text-end">
                            <span className="text-[10px] text-slate-400 font-bold block">
                              حد الائتمان:
                            </span>
                            <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                              {formatCurrency(creditLimit)}
                            </span>
                          </div>
                        </div>

                        {/* Credit Usage Bar */}
                        {creditLimit > 0 && debt > 0 && (
                          <div className="mt-2 space-y-1">
                            <div className="flex justify-between text-[10px] text-slate-400 font-mono font-bold">
                              <span>استهلاك الائتمان:</span>
                              <span>{usagePercent}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  usagePercent > 80 ? 'bg-rose-500' : usagePercent > 50 ? 'bg-amber-500' : 'bg-indigo-500'
                                }`}
                                style={{ width: `${usagePercent}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenCustomerPay(cust)}
                          className="flex-1 py-2 px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 shadow-xs transition-all active:scale-95 cursor-pointer"
                          title="تسجيل سند قبض وتحصيل نقدي"
                        >
                          <Coins className="w-3.5 h-3.5" />
                          <span>سند قبض</span>
                        </button>

                        {debt > 0 && (
                          <button
                            type="button"
                            onClick={() => handleOpenWhatsAppReminder(cust)}
                            className="py-2 px-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
                            title="إرسال تذكير تسديد الدين عبر واتساب"
                          >
                            <MessageSquareShare className="w-3.5 h-3.5" />
                            <span className="hidden xs:inline">تذكير واتساب</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleOpenCustomerAddDebt(cust)}
                          className="py-2 px-2 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-bold text-xs rounded-xl border border-indigo-200 dark:border-indigo-800 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                          title="قيد دين يدوي جديد"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>قيد دين</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedPartyForStatement({ type: 'customer', party: cust })}
                          className="py-2 px-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition-colors cursor-pointer"
                          title="كشف حساب مالي تفصيلي"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                          <span>كشف</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SUPPLIERS DEBTS */}
        {activeTab === 'suppliers' && (
          <div className="flex-1 overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 sm:p-4">
            {filteredSuppliers.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-2" />
                <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                  {filterDebtOnly ? 'لا توجد مستحقات أو ديون للموردين حالياً' : 'لا يوجد موردين مطابقين للبحث'}
                </p>
                <button
                  type="button"
                  onClick={handleOpenAddSupplier}
                  className="mt-3 px-4 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl hover:bg-amber-600"
                >
                  + إضافة مورد جديد
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {filteredSuppliers.map(sup => {
                  const debt = sup.currentDebt || 0;

                  return (
                    <div
                      key={sup.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between shadow-2xs ${
                        debt > 0
                          ? 'bg-gradient-to-b from-amber-50/40 to-white dark:from-amber-950/20 dark:to-slate-900 border-amber-200/80 dark:border-amber-800/80'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h3 className="font-black text-sm text-slate-900 dark:text-white">
                                {sup.name}
                              </h3>
                              <span className="text-[10px] font-mono text-slate-400">
                                ({sup.code})
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {sup.companyName && <span className="font-bold">{sup.companyName} • </span>}
                              <span className="font-mono">{sup.phone || 'بدون هاتف'}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditSupplier(sup)}
                              className="p-1 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                              title="تعديل بيانات المورد"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteSupplier(sup.id)}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                              title="حذف المورد"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Supplier Debt Amount Box */}
                        <div className="mt-3 p-3 bg-white dark:bg-slate-800/70 rounded-xl border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold block">
                              الرصيد المستحق للمورد:
                            </span>
                            <span className={`text-xl font-black font-mono tracking-tight ${debt > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
                              {formatCurrency(debt)}
                            </span>
                          </div>
                          <div className="text-end">
                            <span className="text-[10px] text-slate-400 font-bold block">
                              إجمالي المشتريات:
                            </span>
                            <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                              {formatCurrency(sup.totalPurchases || 0)}
                            </span>
                          </div>
                        </div>

                        {sup.address && (
                          <div className="mt-2 text-[11px] text-slate-500 truncate">
                            📍 {sup.address}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenSupplierPay(sup)}
                          className="flex-1 py-2 px-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1 shadow-xs transition-all active:scale-95"
                          title="تسجيل سند صرف وسداد دفعة للمورد"
                        >
                          <Coins className="w-3.5 h-3.5" />
                          <span>سند صرف</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenSupplierInvoice(sup)}
                          className="py-2 px-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition-colors"
                          title="تسجيل فاتورة شراء بضاعة بالدين"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>فاتورة شراء</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedPartyForStatement({ type: 'supplier', party: sup })}
                          className="py-2 px-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition-colors"
                          title="كشف حساب مالي تفصيلي"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                          <span>كشف</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: VOUCHERS AND FINANCIAL MOVEMENTS */}
        {activeTab === 'vouchers' && (
          <div className="flex-1 overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 sm:p-4">
            {filteredVouchers.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <FileText className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-2" />
                <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                  لا توجد سندات أو حركات مالية مسجلة
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-start">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-3 text-start">رقم السند</th>
                      <th className="p-3 text-start">التاريخ والوقت</th>
                      <th className="p-3 text-start">الطرف المالي</th>
                      <th className="p-3 text-start">نوع السند</th>
                      <th className="p-3 text-start">طريقة الدفع</th>
                      <th className="p-3 text-end">المبلغ المحصل/المسدد</th>
                      <th className="p-3 text-end">الرصيد المتبقي</th>
                      <th className="p-3 text-center">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredVouchers.map(tx => {
                      const isCustomer = tx.partyType === 'customer';
                      const isPayment = tx.type === 'payment';

                      return (
                        <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                            {tx.voucherNumber}
                          </td>
                          <td className="p-3 text-[11px] text-slate-500 font-mono">
                            {new Date(tx.createdAt).toLocaleString(language === 'ar' ? 'ar-SY' : 'en-US')}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                              {isCustomer ? (
                                <Users className="w-3.5 h-3.5 text-indigo-500" />
                              ) : (
                                <Building2 className="w-3.5 h-3.5 text-amber-500" />
                              )}
                              <span>{tx.partyName}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono block">
                              {isCustomer ? 'زبون' : 'مورد'}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black ${
                              isPayment
                                ? isCustomer
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            }`}>
                              {isPayment
                                ? isCustomer
                                  ? 'سند قبض (تحصيل زبون)'
                                  : 'سند صرف (سداد مورد)'
                                : isCustomer
                                ? 'قيد دين آجل (فاتورة)'
                                : 'فاتورة شراء بضاعة'}
                            </span>
                          </td>
                          <td className="p-3 text-slate-600 dark:text-slate-300">
                            {tx.paymentMethod === 'cash' ? '💵 نقداً' :
                             tx.paymentMethod === 'card' ? '💳 بطاقة' :
                             tx.paymentMethod === 'transfer' ? '🏦 حوالة' : '📝 شيك'}
                          </td>
                          <td className="p-3 text-end font-mono font-black text-sm text-slate-900 dark:text-white">
                            {formatCurrency(tx.amount)}
                            {tx.discountAmount ? (
                              <span className="block text-[10px] text-emerald-600 font-bold">
                                + خصم {formatCurrency(tx.discountAmount)}
                              </span>
                            ) : null}
                          </td>
                          <td className="p-3 text-end font-mono font-bold text-slate-500 dark:text-slate-400">
                            {formatCurrency(tx.newBalance)}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => setSelectedVoucherForPrint(tx)}
                              className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-slate-700 dark:text-slate-300 hover:text-amber-800 font-bold text-[11px] rounded-lg transition-colors inline-flex items-center gap-1"
                            >
                              <Printer className="w-3 h-3" />
                              <span>معاينة وطباعة</span>
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
        )}
      </div>

      {/* MODAL 1: Customer Debt Payment (سند قبض) */}
      {isCustomerPayModalOpen && selectedCustomerForPay && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-4">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-emerald-950 dark:text-emerald-200">
                    سند قبض مالي (تسديد دفعة زبون)
                  </h3>
                  <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300">
                    العميل: {selectedCustomerForPay.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomerPayModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteCustomerPay} className="p-5 space-y-4">
              {/* Debt overview */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
                <span className="text-slate-500 font-bold">الرصيد المدين الإجمالي الحالي:</span>
                <span className="text-base font-black font-mono text-rose-600 dark:text-rose-400">
                  {formatCurrency(selectedCustomerForPay.currentDebt || 0)}
                </span>
              </div>

              {/* Amount to pay */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    المبلغ المحصل نقداً ({settings.currency.symbol}):
                  </label>
                  <button
                    type="button"
                    onClick={() => setCustomerPayAmount(selectedCustomerForPay.currentDebt || 0)}
                    className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                  >
                    تسديد كامل الرصيد
                  </button>
                </div>
                <input
                  type="number"
                  required
                  min={0}
                  value={customerPayAmount}
                  onChange={e => setCustomerPayAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0"
                  className="w-full text-xl font-black font-mono py-2 px-3 bg-white dark:bg-slate-800 border-2 border-emerald-500/60 rounded-xl text-slate-900 dark:text-white focus:outline-none"
                  autoFocus
                />
              </div>

              {/* Discount / Settlement Waiver */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  خصم تسوية / إبراء جزء من الدين (اختياري):
                </label>
                <input
                  type="number"
                  min={0}
                  value={customerPayDiscount}
                  onChange={e => setCustomerPayDiscount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0"
                  className="w-full text-sm font-mono py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  طريقة القبض:
                </label>
                <div className="grid grid-cols-4 gap-1.5 text-xs">
                  {[
                    { id: 'cash', label: '💵 كاش' },
                    { id: 'card', label: '💳 بطاقة' },
                    { id: 'transfer', label: '🏦 حوالة' },
                    { id: 'check', label: '📝 شيك' }
                  ].map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setCustomerPayMethod(m.id as any)}
                      className={`py-2 rounded-xl border text-center font-bold transition-all ${
                        customerPayMethod === m.id
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  البيان والملاحظات:
                </label>
                <input
                  type="text"
                  value={customerPayNotes}
                  onChange={e => setCustomerPayNotes(e.target.value)}
                  placeholder="مثال: تسديد دفعة عن فاتورة مبيعات سابقة..."
                  className="w-full text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              {/* Live Remaining Balance Calculation */}
              <div className="p-3 bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-950 dark:text-emerald-200">
                  الرصيد المتبقي بعد القبض:
                </span>
                <span className="font-mono font-black text-sm text-emerald-700 dark:text-emerald-300">
                  {formatCurrency(
                    Math.max(
                      0,
                      (selectedCustomerForPay.currentDebt || 0) -
                        ((Number(customerPayAmount) || 0) + (Number(customerPayDiscount) || 0))
                    )
                  )}
                </span>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCustomerPayModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تأكيد وقبض السند</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Add Customer Manual Debt (قيد دين) */}
      {isCustomerAddDebtModalOpen && selectedCustomerForDebt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-4">
            <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 border-b border-indigo-200 dark:border-indigo-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-indigo-950 dark:text-indigo-200">
                    قيد دين آجل جديد على العميل
                  </h3>
                  <p className="text-[11px] text-indigo-800/80 dark:text-indigo-300">
                    العميل: {selectedCustomerForDebt.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomerAddDebtModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteCustomerAddDebt} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  قيمة الدين الآجل ({settings.currency.symbol}):
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={customerDebtAmount}
                  onChange={e => setCustomerDebtAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0"
                  className="w-full text-xl font-black font-mono py-2 px-3 bg-white dark:bg-slate-800 border-2 border-indigo-500/60 rounded-xl text-slate-900 dark:text-white focus:outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  رقم الفاتورة المرجعية (اختياري):
                </label>
                <input
                  type="text"
                  value={customerDebtRefInvoice}
                  onChange={e => setCustomerDebtRefInvoice(e.target.value)}
                  placeholder="مثال: INV-2026-089"
                  className="w-full text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  البيان والسبب:
                </label>
                <textarea
                  value={customerDebtNotes}
                  onChange={e => setCustomerDebtNotes(e.target.value)}
                  rows={2}
                  placeholder="تفاصيل بضاعة مسحوبة بالآجل..."
                  className="w-full text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCustomerAddDebtModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95"
                >
                  تقييد وحفظ الدين
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Supplier Payment (سند صرف لمورد) */}
      {isSupplierPayModalOpen && selectedSupplierForPay && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-4">
            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-amber-950 dark:text-amber-200">
                    سند صرف مالي (سداد دفعة لمورد)
                  </h3>
                  <p className="text-[11px] text-amber-800/80 dark:text-amber-300">
                    المورد: {selectedSupplierForPay.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSupplierPayModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteSupplierPay} className="p-5 space-y-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
                <span className="text-slate-500 font-bold">الرصيد المستحق للمورد حالياً:</span>
                <span className="text-base font-black font-mono text-amber-600 dark:text-amber-400">
                  {formatCurrency(selectedSupplierForPay.currentDebt || 0)}
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    المبلغ المسدد للمورد ({settings.currency.symbol}):
                  </label>
                  <button
                    type="button"
                    onClick={() => setSupplierPayAmount(selectedSupplierForPay.currentDebt || 0)}
                    className="text-[11px] text-amber-600 dark:text-amber-400 font-bold hover:underline"
                  >
                    سداد كامل الرصيد
                  </button>
                </div>
                <input
                  type="number"
                  required
                  min={0}
                  value={supplierPayAmount}
                  onChange={e => setSupplierPayAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0"
                  className="w-full text-xl font-black font-mono py-2 px-3 bg-white dark:bg-slate-800 border-2 border-amber-500/60 rounded-xl text-slate-900 dark:text-white focus:outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  خصم ممنوح من المورد (إبراء جزء من الحساب):
                </label>
                <input
                  type="number"
                  min={0}
                  value={supplierPayDiscount}
                  onChange={e => setSupplierPayDiscount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0"
                  className="w-full text-sm font-mono py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  طريقة الصرف:
                </label>
                <div className="grid grid-cols-4 gap-1.5 text-xs">
                  {[
                    { id: 'cash', label: '💵 كاش' },
                    { id: 'card', label: '💳 بطاقة' },
                    { id: 'transfer', label: '🏦 حوالة' },
                    { id: 'check', label: '📝 شيك' }
                  ].map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSupplierPayMethod(m.id as any)}
                      className={`py-2 rounded-xl border text-center font-bold transition-all ${
                        supplierPayMethod === m.id
                          ? 'bg-amber-500 text-slate-950 border-amber-500 font-extrabold shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  البيان / الملاحظات:
                </label>
                <input
                  type="text"
                  value={supplierPayNotes}
                  onChange={e => setSupplierPayNotes(e.target.value)}
                  placeholder="سداد دفعة حساب بضاعة..."
                  className="w-full text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSupplierPayModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تأكيد وصرف السند</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Supplier Invoice Debt (فاتورة شراء آجلة) */}
      {isSupplierInvoiceModalOpen && selectedSupplierForInvoice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    تسجيل فاتورة شراء بضاعة آجلة من مورد
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    المورد: {selectedSupplierForInvoice.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSupplierInvoiceModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteSupplierInvoice} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  إجمالي قيمة الفاتورة الآجلة ({settings.currency.symbol}):
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={supplierInvoiceAmount}
                  onChange={e => setSupplierInvoiceAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0"
                  className="w-full text-xl font-black font-mono py-2 px-3 bg-white dark:bg-slate-800 border-2 border-amber-500/60 rounded-xl text-slate-900 dark:text-white focus:outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  رقم فاتورة المورد / السند:
                </label>
                <input
                  type="text"
                  value={supplierInvoiceRef}
                  onChange={e => setSupplierInvoiceRef(e.target.value)}
                  placeholder="مثال: SUP-INV-994"
                  className="w-full text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  البيان ونوع البضاعة:
                </label>
                <textarea
                  value={supplierInvoiceNotes}
                  onChange={e => setSupplierInvoiceNotes(e.target.value)}
                  rows={2}
                  placeholder="تفاصيل الشحنة أو البضاعة المستلمة..."
                  className="w-full text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSupplierInvoiceModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95"
                >
                  تسجيل الفاتورة على الحساب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: Add / Edit Supplier */}
      {isSupplierFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-4">
            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-amber-950 dark:text-amber-200">
                    {editingSupplier ? 'تعديل بيانات المورد' : 'إضافة مورد جديد'}
                  </h3>
                  <p className="text-[11px] text-amber-800/80 dark:text-amber-300">
                    بيانات الاتصال والرصيد الافتتاحي المستحق
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSupplierFormOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="p-5 space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    اسم المورد / المسؤول: *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: شركة البركة للمواد الغذائية..."
                    value={supplierFormData.name}
                    onChange={e => setSupplierFormData({ ...supplierFormData, name: e.target.value })}
                    className="w-full text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    كود المورد:
                  </label>
                  <input
                    type="text"
                    value={supplierFormData.code}
                    onChange={e => setSupplierFormData({ ...supplierFormData, code: e.target.value })}
                    className="w-full text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    رقم الهاتف:
                  </label>
                  <input
                    type="tel"
                    placeholder="09..."
                    value={supplierFormData.phone}
                    onChange={e => setSupplierFormData({ ...supplierFormData, phone: e.target.value })}
                    className="w-full text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    اسم الشركة التجارية:
                  </label>
                  <input
                    type="text"
                    placeholder="شركة..."
                    value={supplierFormData.companyName}
                    onChange={e => setSupplierFormData({ ...supplierFormData, companyName: e.target.value })}
                    className="w-full text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  العنوان والمستودع:
                </label>
                <input
                  type="text"
                  placeholder="دمشق - سوق الهال / المنطقة الصناعية..."
                  value={supplierFormData.address}
                  onChange={e => setSupplierFormData({ ...supplierFormData, address: e.target.value })}
                  className="w-full text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              {!editingSupplier && (
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      الرصيد الافتتاحي المستحق للمورد:
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={supplierFormData.currentDebt}
                      onChange={e => setSupplierFormData({ ...supplierFormData, currentDebt: Number(e.target.value) })}
                      className="w-full text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      إجمالي المشتريات السابقة:
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={supplierFormData.totalPurchases}
                      onChange={e => setSupplierFormData({ ...supplierFormData, totalPurchases: Number(e.target.value) })}
                      className="w-full text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ملاحظات إضافية:
                </label>
                <input
                  type="text"
                  placeholder="ملاحظات الحساب والتعامل..."
                  value={supplierFormData.notes}
                  onChange={e => setSupplierFormData({ ...supplierFormData, notes: e.target.value })}
                  className="w-full text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSupplierFormOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95"
                >
                  {editingSupplier ? 'حفظ التعديلات' : 'تسجيل المورد'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: Printable Voucher Document */}
      <PrintableVoucherModal
        voucher={selectedVoucherForPrint}
        isOpen={Boolean(selectedVoucherForPrint)}
        onClose={() => setSelectedVoucherForPrint(null)}
      />

      {/* MODAL 7: Detailed Account Statement Document */}
      <AccountStatementModal
        partyType={selectedPartyForStatement?.type || 'customer'}
        party={selectedPartyForStatement?.party || null}
        isOpen={Boolean(selectedPartyForStatement)}
        onClose={() => setSelectedPartyForStatement(null)}
        onSelectVoucher={(v) => {
          setSelectedPartyForStatement(null);
          setSelectedVoucherForPrint(v);
        }}
      />

      {/* MODAL 8: WhatsApp Debt Reminder Message Preview & Dispatch */}
      {isWhatsAppReminderModalOpen && targetCustomerForReminder && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-6 py-4 bg-emerald-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-white/20 flex items-center justify-center">
                  <MessageSquareShare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm">إرسال تذكير تسديد الدين عبر واتساب</h3>
                  <p className="text-[11px] text-emerald-100 font-mono">
                    {targetCustomerForReminder.name} ({targetCustomerForReminder.phone})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsWhatsAppReminderModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Summary pill */}
              <div className="flex items-center justify-between p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">إجمالي الذمة المستحقة:</span>
                  <span className="text-base font-black font-mono text-emerald-700 dark:text-emerald-400">
                    {formatCurrency(targetCustomerForReminder.currentDebt || 0)}
                  </span>
                </div>
                <div className="text-left">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">النظام الآلي:</span>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-lg">
                    {settings.whatsappApiKey ? 'WhatsApp Business Cloud API' : 'WhatsApp Direct (Click-to-Chat)'}
                  </span>
                </div>
              </div>

              {/* Message Editable Box */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>نص الرسالة المرسلة للعميل:</span>
                  <span className="text-[10px] text-slate-400">يمكنك تعديل نص الرسالة قبل الإرسال</span>
                </label>
                <textarea
                  rows={8}
                  value={reminderMessageDraft}
                  onChange={e => setReminderMessageDraft(e.target.value)}
                  className="w-full text-xs font-sans p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white leading-relaxed focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="اكتب رسالة التذكير..."
                />
              </div>

              {/* Info Note */}
              <div className="flex items-start gap-2 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 p-3 rounded-xl">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  إذا كان مفتاح WhatsApp Business Cloud API معرفاً في الإعدادات، سيتم الإرسال سحابياً بدون فتح المتصفح. وإلا فسيتم توجيهك إلى واتساب ويب مع تجهيز الرسالة فوراً.
                </span>
              </div>

              {/* Footer buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsWhatsAppReminderModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  disabled={isSendingWhatsApp || !reminderMessageDraft.trim()}
                  onClick={handleSendWhatsAppReminderDirectly}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                >
                  {isSendingWhatsApp ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>جاري الإرسال...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>إرسال عبر الواتساب</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* WhatsApp Automation Dashboard Modal */}
      {isWhatsAppAutomationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-5xl max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800 p-6 relative">
            <button
              type="button"
              onClick={() => setIsWhatsAppAutomationModalOpen(false)}
              className="absolute top-5 left-5 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 transition-colors cursor-pointer z-20"
            >
              <X className="w-4 h-4" />
            </button>
            <WhatsAppDebtAutomationDashboard
              isModal={true}
              onClose={() => setIsWhatsAppAutomationModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
