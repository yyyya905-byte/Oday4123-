import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Customer,
  Supplier,
  DebtTransaction,
  PaymentMethod,
  InvoiceInstallmentPlan,
  InstallmentScheduleItem,
  DebtPartyType
} from '../../types';
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
  Sparkles,
  Truck,
  ShoppingBag,
  Package,
  BellRing,
  Calendar,
  AlertTriangle,
  SlidersHorizontal,
  Flame,
  ChevronDown,
  ChevronUp,
  Layers
} from 'lucide-react';
import { PrintableVoucherModal } from './PrintableVoucherModal';
import { AccountStatementModal } from './AccountStatementModal';
import { WhatsAppDebtAutomationDashboard } from './WhatsAppDebtAutomationDashboard';
import { SupplierPurchaseModal } from './SupplierPurchaseModal';
import {
  InvoiceInstallmentSplitterModal,
  INSTALLMENT_STORAGE_KEY,
  getInitialInstallmentPlans
} from './InvoiceInstallmentModal';
import {
  buildDebtPeriodicReminderMessage,
  buildInstallmentPlanWhatsAppMessage,
  buildVoucherReceiptWhatsAppMessage,
  sendWhatsAppDebtMessage,
  openWhatsAppDeepLink,
  DEBT_COLLECTION_STORAGE_KEY,
  DebtReminderLog
} from '../../services/debtCollectionService';


export const DebtView: React.FC = () => {
  const {
    customers,
    updateCustomer,
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
  const [activeTab, setActiveTab] = useState<'customers' | 'suppliers' | 'purchase_invoices' | 'installments' | 'vouchers'>('customers');

  // Installment Plans State & Modals
  const [installmentPlans, setInstallmentPlans] = useState<InvoiceInstallmentPlan[]>(() => {
    try {
      const isZeroed =
        localStorage.getItem('kian_pos_zeroed_out') === 'true' ||
        localStorage.getItem('kian_app_purchased') === 'true';
      const saved = localStorage.getItem(INSTALLMENT_STORAGE_KEY);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          if (isZeroed || parsed.length > 0 || saved.trim() === '[]') {
            return parsed;
          }
        }
      }
      if (isZeroed) {
        localStorage.setItem(INSTALLMENT_STORAGE_KEY, JSON.stringify([]));
        return [];
      }
      const seeded = getInitialInstallmentPlans();
      localStorage.setItem(INSTALLMENT_STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    } catch {
      return [];
    }
  });

  // Listen for global zero-out event when monthly/yearly activation code is entered
  useEffect(() => {
    const handleZeroOut = () => {
      setInstallmentPlans([]);
      localStorage.setItem(INSTALLMENT_STORAGE_KEY, JSON.stringify([]));
      setSelectedPurchaseInvoiceForView(null);
      setIsInstallmentSplitterOpen(false);
    };
    window.addEventListener('kian-zero-out-all', handleZeroOut);
    return () => window.removeEventListener('kian-zero-out-all', handleZeroOut);
  }, []);
  const [isInstallmentSplitterOpen, setIsInstallmentSplitterOpen] = useState<boolean>(false);
  const [installmentInitialConfig, setInstallmentInitialConfig] = useState<{
    partyType?: DebtPartyType;
    customer?: Customer | null;
    supplier?: Supplier | null;
    invoiceNumber?: string;
    totalAmount?: number;
    downPayment?: number;
  }>({});
  const [installmentFilterPartyType, setInstallmentFilterPartyType] = useState<'all' | 'customer' | 'supplier'>('all');
  const [installmentFilterStatus, setInstallmentFilterStatus] = useState<'all' | 'overdue' | 'active' | 'completed'>('all');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterDebtOnly, setFilterDebtOnly] = useState<boolean>(false);
  const [selectedSupplierFilterForInvoices, setSelectedSupplierFilterForInvoices] = useState<string>('all');
  const [purchasePaymentStatusFilter, setPurchasePaymentStatusFilter] = useState<'all' | 'credit' | 'partial' | 'cash'>('all');
  const [selectedPurchaseInvoiceForView, setSelectedPurchaseInvoiceForView] = useState<DebtTransaction | null>(null);
  const [smartAlertFilter, setSmartAlertFilter] = useState<'all' | 'all_alerts' | 'overdue' | 'high_balance' | 'due_soon'>('all');
  const [isSmartAlertDrawerOpen, setIsSmartAlertDrawerOpen] = useState<boolean>(true);
  const [isAlertRulesConfigOpen, setIsAlertRulesConfigOpen] = useState<boolean>(false);
  const [highBalanceThreshold, setHighBalanceThreshold] = useState<number>(250000);
  const [creditUsageAlertPercent, setCreditUsageAlertPercent] = useState<number>(75);
  const [defaultCreditDays, setDefaultCreditDays] = useState<number>(settings.debtReminderDays || 7);
  const [voucherTypeFilter, setVoucherTypeFilter] = useState<'all' | 'payment' | 'charge' | 'customer' | 'supplier'>('all');
  const [isSmartPurchaseModalOpen, setIsSmartPurchaseModalOpen] = useState<boolean>(false);
  const [selectedSupplierForSmartPurchase, setSelectedSupplierForSmartPurchase] = useState<Supplier | null>(null);

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
  const [customerDebtDueDate, setCustomerDebtDueDate] = useState<string>('');

  // Due Date & Credit Limit Quick Editor Modal
  const [isDueDateModalOpen, setIsDueDateModalOpen] = useState(false);
  const [selectedCustomerForDueDate, setSelectedCustomerForDueDate] = useState<Customer | null>(null);
  const [editDueDateValue, setEditDueDateValue] = useState<string>('');
  const [editCreditLimitValue, setEditCreditLimitValue] = useState<number | ''>('');

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

  // WhatsApp Debt Reminder & Universal Document Dispatch Modal
  const [isWhatsAppReminderModalOpen, setIsWhatsAppReminderModalOpen] = useState(false);
  const [isWhatsAppAutomationModalOpen, setIsWhatsAppAutomationModalOpen] = useState(false);
  const [targetCustomerForReminder, setTargetCustomerForReminder] = useState<Customer | null>(null);
  const [whatsappDispatchMeta, setWhatsappDispatchMeta] = useState<{
    title: string;
    partyName: string;
    partyId: string;
    phone: string;
    amountDue: number;
    totalDebt: number;
    type: DebtReminderLog['type'];
  } | null>(null);
  const [reminderMessageDraft, setReminderMessageDraft] = useState<string>('');
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [sendReceiptToWhatsAppOnPay, setSendReceiptToWhatsAppOnPay] = useState<boolean>(true);
  const [payWhatsAppPhoneInput, setPayWhatsAppPhoneInput] = useState<string>('');
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

  // Smart Debt Alert & Risk Analysis Engine for Customers
  const customerAlertMap = useMemo(() => {
    const map: Record<
      string,
      {
        customer: Customer;
        debt: number;
        creditLimit: number;
        usagePercent: number;
        effectiveDueDate: string | null;
        isExplicitDueDate: boolean;
        isOverdue: boolean;
        overdueDays: number;
        isDueSoon: boolean;
        daysUntilDue: number | null;
        isHighBalance: boolean;
        isCreditExceeded: boolean;
        severity: 'critical' | 'overdue' | 'high_balance' | 'due_soon' | 'normal';
        reasons: string[];
      }
    > = {};

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    customers.forEach(cust => {
      const debt = cust.currentDebt || 0;
      const creditLimit = cust.creditLimit || 500000;
      const usagePercent = creditLimit > 0 ? Math.round((debt / creditLimit) * 100) : 0;

      if (debt <= 0) {
        map[cust.id] = {
          customer: cust,
          debt: 0,
          creditLimit,
          usagePercent: 0,
          effectiveDueDate: cust.debtDueDate || null,
          isExplicitDueDate: Boolean(cust.debtDueDate),
          isOverdue: false,
          overdueDays: 0,
          isDueSoon: false,
          daysUntilDue: null,
          isHighBalance: false,
          isCreditExceeded: false,
          severity: 'normal',
          reasons: []
        };
        return;
      }

      // Determine effective due date
      let effectiveDueDate: string | null = cust.debtDueDate || null;
      const isExplicitDueDate = Boolean(cust.debtDueDate);

      if (!effectiveDueDate) {
        const refDateStr = cust.lastDebtChargeDate || cust.lastPurchaseDate || cust.createdAt;
        if (refDateStr) {
          const refDate = new Date(refDateStr);
          if (!isNaN(refDate.getTime())) {
            refDate.setDate(refDate.getDate() + defaultCreditDays);
            effectiveDueDate = refDate.toISOString().split('T')[0];
          }
        }
      }

      let isOverdue = false;
      let overdueDays = 0;
      let isDueSoon = false;
      let daysUntilDue: number | null = null;

      if (effectiveDueDate) {
        const dueObj = new Date(effectiveDueDate);
        dueObj.setHours(0, 0, 0, 0);
        const diffMs = todayStart.getTime() - dueObj.getTime();
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays > 0) {
          isOverdue = true;
          overdueDays = diffDays;
          daysUntilDue = -diffDays;
        } else {
          daysUntilDue = Math.abs(diffDays);
          if (daysUntilDue <= 3) {
            isDueSoon = true;
          }
        }
      }

      const isCreditExceeded = creditLimit > 0 && debt >= creditLimit;
      const isHighBalance =
        debt >= highBalanceThreshold ||
        (creditLimit > 0 && usagePercent >= creditUsageAlertPercent);

      const reasons: string[] = [];
      if (isOverdue) {
        reasons.push(`متأخر عن السداد منذ ${overdueDays} ${overdueDays === 1 ? 'يوم' : 'أيام'}`);
      } else if (isDueSoon && daysUntilDue !== null) {
        reasons.push(
          daysUntilDue === 0
            ? 'يستحق السداد اليوم'
            : `يستحق السداد خلال ${daysUntilDue} ${daysUntilDue === 1 ? 'يوم' : 'أيام'}`
        );
      }

      if (isCreditExceeded) {
        reasons.push(`تجاوز سقف الائتمان (${usagePercent}%)`);
      } else if (isHighBalance) {
        if (usagePercent >= creditUsageAlertPercent) {
          reasons.push(`استهلك ${usagePercent}% من سقف الائتمان`);
        } else {
          reasons.push(`رصيد مدين مرتفع (${formatCurrency(debt)})`);
        }
      }

      let severity: 'critical' | 'overdue' | 'high_balance' | 'due_soon' | 'normal' = 'normal';
      if ((isOverdue && isHighBalance) || isCreditExceeded) {
        severity = 'critical';
      } else if (isOverdue) {
        severity = 'overdue';
      } else if (isHighBalance) {
        severity = 'high_balance';
      } else if (isDueSoon) {
        severity = 'due_soon';
      }

      map[cust.id] = {
        customer: cust,
        debt,
        creditLimit,
        usagePercent,
        effectiveDueDate,
        isExplicitDueDate,
        isOverdue,
        overdueDays,
        isDueSoon,
        daysUntilDue,
        isHighBalance,
        isCreditExceeded,
        severity,
        reasons
      };
    });

    return map;
  }, [customers, highBalanceThreshold, creditUsageAlertPercent, defaultCreditDays, formatCurrency]);

  const smartAlertSummary = useMemo(() => {
    const profiles = Object.values(customerAlertMap).filter(p => p.debt > 0);
    const overdueList = profiles
      .filter(p => p.isOverdue)
      .sort((a, b) => b.overdueDays - a.overdueDays || b.debt - a.debt);
    const highBalanceList = profiles
      .filter(p => p.isHighBalance)
      .sort((a, b) => b.debt - a.debt);
    const dueSoonList = profiles
      .filter(p => p.isDueSoon)
      .sort((a, b) => (a.daysUntilDue || 0) - (b.daysUntilDue || 0));
    const allFlaggedList = profiles
      .filter(p => p.isOverdue || p.isHighBalance || p.isDueSoon)
      .sort((a, b) => {
        const rank = { critical: 4, overdue: 3, high_balance: 2, due_soon: 1, normal: 0 };
        if (rank[b.severity] !== rank[a.severity]) return rank[b.severity] - rank[a.severity];
        return b.debt - a.debt;
      });

    const overdueTotalDebt = overdueList.reduce((sum, p) => sum + p.debt, 0);
    const highBalanceTotalDebt = highBalanceList.reduce((sum, p) => sum + p.debt, 0);

    return {
      overdueList,
      highBalanceList,
      dueSoonList,
      allFlaggedList,
      overdueTotalDebt,
      highBalanceTotalDebt
    };
  }, [customerAlertMap]);

  // Filtered Lists
  const filteredCustomers = useMemo(() => {
    return customers
      .filter(c => {
        const alertProfile = customerAlertMap[c.id];
        if (filterDebtOnly && (c.currentDebt || 0) <= 0) return false;
        if (smartAlertFilter === 'all_alerts') {
          if (!alertProfile || (!alertProfile.isOverdue && !alertProfile.isHighBalance)) return false;
        } else if (smartAlertFilter === 'overdue') {
          if (!alertProfile || !alertProfile.isOverdue) return false;
        } else if (smartAlertFilter === 'high_balance') {
          if (!alertProfile || !alertProfile.isHighBalance) return false;
        } else if (smartAlertFilter === 'due_soon') {
          if (!alertProfile || !alertProfile.isDueSoon) return false;
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          return (
            c.name.toLowerCase().includes(q) ||
            c.phone.includes(q) ||
            c.customerCode.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        const pa = customerAlertMap[a.id];
        const pb = customerAlertMap[b.id];
        const rank = { critical: 4, overdue: 3, high_balance: 2, due_soon: 1, normal: 0 };
        const ra = pa ? rank[pa.severity] : 0;
        const rb = pb ? rank[pb.severity] : 0;
        if (rb !== ra) return rb - ra;
        return (b.currentDebt || 0) - (a.currentDebt || 0);
      });
  }, [customers, filterDebtOnly, smartAlertFilter, searchQuery, customerAlertMap]);

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

  // Supplier Purchase Invoices List & KPIs
  const purchaseInvoices = useMemo(() => {
    return debtTransactions
      .filter(tx => tx.partyType === 'supplier' && tx.type === 'charge')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [debtTransactions]);

  const purchaseInvoicesKPIs = useMemo(() => {
    let totalAmount = 0;
    let totalPaid = 0;
    let totalRemaining = 0;
    let totalItemsCount = 0;

    purchaseInvoices.forEach(inv => {
      const amt = inv.amount || 0;
      const paid = inv.paidAmount !== undefined ? inv.paidAmount : 0;
      const rem = inv.remainingDebt !== undefined ? inv.remainingDebt : Math.max(0, amt - paid);
      totalAmount += amt;
      totalPaid += paid;
      totalRemaining += rem;
      if (inv.purchaseItems && inv.purchaseItems.length > 0) {
        totalItemsCount += inv.purchaseItems.reduce((s, it) => s + (it.quantity || 0), 0);
      }
    });

    return {
      count: purchaseInvoices.length,
      totalAmount,
      totalPaid,
      totalRemaining,
      totalItemsCount
    };
  }, [purchaseInvoices]);

  const filteredPurchaseInvoices = useMemo(() => {
    return purchaseInvoices.filter(inv => {
      if (selectedSupplierFilterForInvoices !== 'all' && inv.partyId !== selectedSupplierFilterForInvoices) {
        return false;
      }
      const amt = inv.amount || 0;
      const paid = inv.paidAmount !== undefined ? inv.paidAmount : 0;
      const rem = inv.remainingDebt !== undefined ? inv.remainingDebt : Math.max(0, amt - paid);
      const status = inv.paymentStatus || (paid >= amt ? 'cash' : paid > 0 ? 'partial' : 'credit');

      if (purchasePaymentStatusFilter !== 'all' && status !== purchasePaymentStatusFilter) {
        return false;
      }
      if (filterDebtOnly && rem <= 0) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesItems = inv.purchaseItems?.some(
          it => it.productName.toLowerCase().includes(q) || (it.barcode && it.barcode.includes(q))
        );
        return (
          inv.voucherNumber.toLowerCase().includes(q) ||
          inv.partyName.toLowerCase().includes(q) ||
          (inv.referenceInvoice && inv.referenceInvoice.toLowerCase().includes(q)) ||
          (inv.notes && inv.notes.toLowerCase().includes(q)) ||
          Boolean(matchesItems)
        );
      }
      return true;
    });
  }, [purchaseInvoices, selectedSupplierFilterForInvoices, purchasePaymentStatusFilter, filterDebtOnly, searchQuery]);

  // Handlers for Customer Payments
  const handleOpenCustomerPay = (cust: Customer) => {
    setSelectedCustomerForPay(cust);
    setCustomerPayAmount(cust.currentDebt || 0);
    setCustomerPayDiscount('');
    setCustomerPayMethod('cash');
    setCustomerPayNotes('');
    setPayWhatsAppPhoneInput(cust.phone || '');
    setSendReceiptToWhatsAppOnPay(true);
    setIsCustomerPayModalOpen(true);
  };

  const handleExecuteCustomerPay = async (e: React.FormEvent) => {
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

      if (sendReceiptToWhatsAppOnPay) {
        const targetPhone = payWhatsAppPhoneInput.trim() || selectedCustomerForPay.phone || '';
        if (targetPhone) {
          const msg = buildVoucherReceiptWhatsAppMessage({
            storeSettings: settings,
            voucher: tx,
            partyPhone: targetPhone,
            bulletin: settings.exchangeBulletin
          });
          try {
            await sendWhatsAppDebtMessage({
              phone: targetPhone,
              message: msg,
              customerName: selectedCustomerForPay.name,
              customerId: selectedCustomerForPay.id,
              amountDue: tx.amount,
              totalDebt: tx.newBalance,
              currencySymbol: settings.currency.symbolNative || settings.currency.symbol,
              type: 'payment_receipt',
              storeSettings: settings
            });
            try {
              const updatedLogs = JSON.parse(localStorage.getItem(DEBT_COLLECTION_STORAGE_KEY) || '[]');
              setReminderLogs(updatedLogs);
            } catch {}
            notify(
              'تم إرسال سند القبض عبر واتساب',
              `تم إرسال إيصال القبض رقم ${tx.voucherNumber} مباشرة إلى واتساب ${selectedCustomerForPay.name}`,
              'success'
            );
          } catch {}
        }
      }
    }
  };

  const handleOpenWhatsAppReminder = (cust: Customer) => {
    setTargetCustomerForReminder(cust);
    const alertProfile = customerAlertMap[cust.id];
    let draft = buildDebtPeriodicReminderMessage({
      storeSettings: settings,
      customer: cust,
      bulletin: settings.exchangeBulletin
    });

    if (alertProfile && (alertProfile.isOverdue || alertProfile.isHighBalance)) {
      const extraAlertNote = [
        '',
        '🔔 *إشعار استحقاق مالي هام:*',
        alertProfile.isOverdue
          ? `⏰ تجاوز الرصيد التاريخ المحدد للسداد (${alertProfile.effectiveDueDate}) بـ *${alertProfile.overdueDays} يوم*.`
          : '',
        alertProfile.isHighBalance
          ? `⚠️ وصل الرصيد المستحق إلى *${formatCurrency(alertProfile.debt)}* (${alertProfile.usagePercent}% من سقف الائتمان المسموح).`
          : '',
        'نرجو التكرم بتسوية الرصيد في أقرب وقت شاكرين حسن تعاونكم.'
      ]
        .filter(Boolean)
        .join('\n');
      draft = `${draft}\n${extraAlertNote}`;
    }

    setWhatsappDispatchMeta({
      title: 'إرسال تذكير تسديد الدين عبر واتساب',
      partyName: cust.name,
      partyId: cust.id,
      phone: cust.phone || '',
      amountDue: cust.currentDebt || 0,
      totalDebt: cust.currentDebt || 0,
      type: 'manual_reminder'
    });
    setReminderMessageDraft(draft);
    setIsWhatsAppReminderModalOpen(true);
  };

  const handleSendInstallmentPlanWhatsApp = async (plan: InvoiceInstallmentPlan, directNow: boolean = false) => {
    const foundPartyPhone =
      plan.partyType === 'customer'
        ? customers.find(c => c.id === plan.partyId || c.name === plan.partyName)?.phone || ''
        : suppliers.find(s => s.id === plan.partyId || s.name === plan.partyName)?.phone || '';

    const message = buildInstallmentPlanWhatsAppMessage({
      storeSettings: settings,
      plan,
      bulletin: settings.exchangeBulletin
    });

    if (directNow && foundPartyPhone.trim()) {
      setIsSendingWhatsApp(true);
      try {
        await sendWhatsAppDebtMessage({
          phone: foundPartyPhone.trim(),
          message,
          customerName: plan.partyName,
          customerId: plan.partyId,
          amountDue: plan.remainingAmount,
          totalDebt: plan.remainingAmount,
          currencySymbol: settings.currency.symbolNative || settings.currency.symbol,
          type: 'installment_plan',
          storeSettings: settings
        });
        try {
          const updatedLogs = JSON.parse(localStorage.getItem(DEBT_COLLECTION_STORAGE_KEY) || '[]');
          setReminderLogs(updatedLogs);
        } catch {}
        notify(
          'تم إرسال فاتورة الأقساط عبر واتساب',
          `تم إرسال جدول تقسيط الفاتورة (${plan.invoiceNumber}) إلى واتساب ${plan.partyName} بنجاح`,
          'success'
        );
      } catch (err: any) {
        notify('تعذر الإرسال', err?.message || 'حدث خطأ أثناء إرسال فاتورة الأقساط', 'error');
      } finally {
        setIsSendingWhatsApp(false);
      }
      return;
    }

    setTargetCustomerForReminder(null);
    setWhatsappDispatchMeta({
      title: `إرسال فاتورة الأقساط (${plan.invoiceNumber}) عبر واتساب`,
      partyName: plan.partyName,
      partyId: plan.partyId,
      phone: foundPartyPhone,
      amountDue: plan.remainingAmount,
      totalDebt: plan.totalInvoiceAmount,
      type: 'installment_plan'
    });
    setReminderMessageDraft(message);
    setIsWhatsAppReminderModalOpen(true);
  };

  const handleSendVoucherWhatsApp = async (tx: DebtTransaction, directNow: boolean = false) => {
    const foundPartyPhone =
      tx.partyType === 'customer'
        ? customers.find(c => c.id === tx.partyId || c.name === tx.partyName)?.phone || ''
        : suppliers.find(s => s.id === tx.partyId || s.name === tx.partyName)?.phone || '';

    const message = buildVoucherReceiptWhatsAppMessage({
      storeSettings: settings,
      voucher: tx,
      partyPhone: foundPartyPhone,
      bulletin: settings.exchangeBulletin
    });

    const docLabel =
      tx.type === 'payment'
        ? tx.partyType === 'customer'
          ? 'سند القبض'
          : 'سند الصرف'
        : tx.partyType === 'customer'
        ? 'إشعار قيد الدين'
        : 'فاتورة المشتريات';

    if (directNow && foundPartyPhone.trim()) {
      setIsSendingWhatsApp(true);
      try {
        await sendWhatsAppDebtMessage({
          phone: foundPartyPhone.trim(),
          message,
          customerName: tx.partyName,
          customerId: tx.partyId,
          amountDue: tx.amount,
          totalDebt: tx.newBalance,
          currencySymbol: settings.currency.symbolNative || settings.currency.symbol,
          type: tx.type === 'payment' ? 'payment_receipt' : 'post_sale',
          storeSettings: settings
        });
        try {
          const updatedLogs = JSON.parse(localStorage.getItem(DEBT_COLLECTION_STORAGE_KEY) || '[]');
          setReminderLogs(updatedLogs);
        } catch {}
        notify(
          `تم إرسال ${docLabel} عبر واتساب`,
          `تم إرسال ${docLabel} رقم (${tx.voucherNumber}) مباشرة إلى واتساب ${tx.partyName}`,
          'success'
        );
      } catch (err: any) {
        notify('تعذر الإرسال', err?.message || 'حدث خطأ أثناء الإرسال عبر واتساب', 'error');
      } finally {
        setIsSendingWhatsApp(false);
      }
      return;
    }

    setTargetCustomerForReminder(null);
    setWhatsappDispatchMeta({
      title: `إرسال ${docLabel} (${tx.voucherNumber}) عبر واتساب`,
      partyName: tx.partyName,
      partyId: tx.partyId,
      phone: foundPartyPhone,
      amountDue: tx.amount,
      totalDebt: tx.newBalance,
      type: tx.type === 'payment' ? 'payment_receipt' : 'post_sale'
    });
    setReminderMessageDraft(message);
    setIsWhatsAppReminderModalOpen(true);
  };

  const handleSendSingleInstallmentWhatsApp = (
    plan: InvoiceInstallmentPlan,
    inst: InstallmentScheduleItem,
    directNow: boolean = false
  ) => {
    const isPaid = inst.status === 'paid';
    if (isPaid) {
      // Find matching voucher in debtTransactions if exists, or synthesize one
      const matchedTx =
        (inst.voucherNumber && debtTransactions.find(t => t.voucherNumber === inst.voucherNumber)) || {
          id: inst.id,
          voucherNumber: inst.voucherNumber || `RV-INST-${inst.installmentNumber}`,
          partyType: plan.partyType,
          partyId: plan.partyId,
          partyName: plan.partyName,
          type: 'payment' as const,
          amount: inst.paidAmount || inst.amount,
          previousBalance: plan.remainingAmount + (inst.paidAmount || inst.amount),
          newBalance: plan.remainingAmount,
          paymentMethod: inst.paymentMethod || 'cash',
          referenceInvoice: plan.invoiceNumber,
          notes: `دفعة القسط رقم #${inst.installmentNumber} من فاتورة ${plan.invoiceNumber} (استحقاق ${inst.dueDate})`,
          createdAt: inst.paidAt || new Date().toISOString(),
          recordedBy: 'الإدارة المالية'
        };
      handleSendVoucherWhatsApp(matchedTx, directNow);
      return;
    }

    const foundPartyPhone =
      plan.partyType === 'customer'
        ? customers.find(c => c.id === plan.partyId || c.name === plan.partyName)?.phone || ''
        : suppliers.find(s => s.id === plan.partyId || s.name === plan.partyName)?.phone || '';

    const storeName = settings.storeNameAr || settings.storeNameEn || 'متجرنا';
    const message = [
      `📅 *إشعار استحقاق قسط — ${storeName}*`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `👤 *السيد/ة:* ${plan.partyName}`,
      `🧾 *رقم الفاتورة:* ${plan.invoiceNumber}`,
      `🔢 *رقم الدفعة / القسط:* القسط رقم #${inst.installmentNumber} من أصل ${plan.installmentsCount}`,
      `💰 *قيمة القسط المستحق:* *${formatCurrency(inst.amount)}*`,
      `📆 *تاريخ الاستحقاق:* *${inst.dueDate}*`,
      `📉 *إجمالي المتبقي من الفاتورة:* ${formatCurrency(plan.remainingAmount)}`,
      inst.notes ? `📝 *ملاحظات:* ${inst.notes}` : '',
      `━━━━━━━━━━━━━━━━━━━━`,
      `نرجو التكرم بسداد الدفعة في موعدها المحدد، شاكرين حسن تعاملكم معنا. 🙏`
    ]
      .filter(Boolean)
      .join('\n');

    if (directNow && foundPartyPhone.trim()) {
      sendWhatsAppDebtMessage({
        phone: foundPartyPhone.trim(),
        message,
        customerName: plan.partyName,
        customerId: plan.partyId,
        amountDue: inst.amount,
        totalDebt: plan.remainingAmount,
        currencySymbol: settings.currency.symbolNative || settings.currency.symbol,
        type: 'installment_plan',
        storeSettings: settings
      }).then(() => {
        notify(
          'تم إرسال إشعار القسط عبر واتساب',
          `تم إرسال تذكير القسط رقم #${inst.installmentNumber} إلى واتساب ${plan.partyName}`,
          'success'
        );
      });
      return;
    }

    setTargetCustomerForReminder(null);
    setWhatsappDispatchMeta({
      title: `إرسال إشعار القسط #${inst.installmentNumber} (${plan.invoiceNumber}) عبر واتساب`,
      partyName: plan.partyName,
      partyId: plan.partyId,
      phone: foundPartyPhone,
      amountDue: inst.amount,
      totalDebt: plan.remainingAmount,
      type: 'installment_plan'
    });
    setReminderMessageDraft(message);
    setIsWhatsAppReminderModalOpen(true);
  };

  const handleSendWhatsAppReminderDirectly = async () => {
    const activePhone = whatsappDispatchMeta?.phone || targetCustomerForReminder?.phone || '';
    const activeName = whatsappDispatchMeta?.partyName || targetCustomerForReminder?.name || 'العميل';
    const activeId = whatsappDispatchMeta?.partyId || targetCustomerForReminder?.id || 'PARTY';
    const activeAmount = whatsappDispatchMeta?.amountDue ?? targetCustomerForReminder?.currentDebt ?? 0;
    const activeTotal = whatsappDispatchMeta?.totalDebt ?? targetCustomerForReminder?.currentDebt ?? 0;
    const activeType = whatsappDispatchMeta?.type || 'manual_reminder';

    if (!reminderMessageDraft.trim()) return;
    if (!activePhone.trim()) {
      notify('تنبيه', 'يرجى إدخال رقم هاتف واتساب المستلم أولاً', 'warning');
      return;
    }

    setIsSendingWhatsApp(true);
    try {
      await sendWhatsAppDebtMessage({
        phone: activePhone.trim(),
        message: reminderMessageDraft,
        customerName: activeName,
        customerId: activeId,
        amountDue: activeAmount,
        totalDebt: activeTotal,
        currencySymbol: settings.currency.symbolNative || settings.currency.symbol,
        type: activeType,
        storeSettings: settings
      });

      // Update local logs state
      try {
        const updatedLogs = JSON.parse(localStorage.getItem(DEBT_COLLECTION_STORAGE_KEY) || '[]');
        setReminderLogs(updatedLogs);
      } catch {}

      notify(
        'تم الإرسال عبر واتساب بنجاح',
        `تم إرسال الرسالة المالية إلى واتساب ${activeName}`,
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
    const defaultDue = new Date(Date.now() + defaultCreditDays * 86400000).toISOString().split('T')[0];
    setCustomerDebtDueDate(cust.debtDueDate || defaultDue);
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

    if (customerDebtDueDate) {
      updateCustomer(selectedCustomerForDebt.id, {
        debtDueDate: customerDebtDueDate,
        lastDebtChargeDate: new Date().toISOString()
      });
    }

    if (tx) {
      setIsCustomerAddDebtModalOpen(false);
      setSelectedVoucherForPrint(tx);
    }
  };

  const handleOpenDueDateModal = (cust: Customer) => {
    setSelectedCustomerForDueDate(cust);
    const alertProfile = customerAlertMap[cust.id];
    setEditDueDateValue(
      cust.debtDueDate ||
        alertProfile?.effectiveDueDate ||
        new Date(Date.now() + defaultCreditDays * 86400000).toISOString().split('T')[0]
    );
    setEditCreditLimitValue(cust.creditLimit || 500000);
    setIsDueDateModalOpen(true);
  };

  const handleSaveDueDateAndLimit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerForDueDate) return;
    updateCustomer(selectedCustomerForDueDate.id, {
      debtDueDate: editDueDateValue || undefined,
      creditLimit: Number(editCreditLimitValue) || 0
    });
    notify(
      'تم تحديث شروط الاستحقاق',
      `تم حفظ تاريخ السداد المحدد وسقف الائتمان للعميل ${selectedCustomerForDueDate.name}`,
      'success'
    );
    setIsDueDateModalOpen(false);
  };

  // Installment Plans Computed Metrics & Handlers
  const saveInstallmentPlansToStorage = (updated: InvoiceInstallmentPlan[]) => {
    setInstallmentPlans(updated);
    try {
      localStorage.setItem(INSTALLMENT_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  const handleOpenInstallmentSplitter = (config?: {
    partyType?: DebtPartyType;
    customer?: Customer | null;
    supplier?: Supplier | null;
    invoiceNumber?: string;
    totalAmount?: number;
    downPayment?: number;
  }) => {
    setInstallmentInitialConfig(config || {});
    setIsInstallmentSplitterOpen(true);
  };

  const handleSaveInstallmentPlan = async (
    newPlan: InvoiceInstallmentPlan,
    recordNewCharge: boolean,
    recordDownPaymentNow: boolean,
    sendWhatsAppImmediately?: boolean,
    customWhatsAppPhone?: string
  ) => {
    if (recordNewCharge) {
      if (newPlan.partyType === 'customer') {
        addCustomerManualDebt(
          newPlan.partyId,
          newPlan.totalInvoiceAmount,
          newPlan.invoiceNumber,
          `قيد فاتورة مقسطة على ${newPlan.installmentsCount} دفعات — ${newPlan.notes || ''}`
        );
      } else {
        addSupplierInvoiceDebt(
          newPlan.partyId,
          newPlan.totalInvoiceAmount,
          newPlan.invoiceNumber,
          `فاتورة مشتريات مقسطة على ${newPlan.installmentsCount} دفعات — ${newPlan.notes || ''}`
        );
      }
    }

    if (recordDownPaymentNow && newPlan.downPaymentAmount > 0) {
      if (newPlan.partyType === 'customer') {
        recordCustomerDebtPayment(
          newPlan.partyId,
          newPlan.downPaymentAmount,
          'cash',
          `دفعة أولى مقدمة من فاتورة مقسطة رقم ${newPlan.invoiceNumber}`
        );
      } else {
        recordSupplierDebtPayment(
          newPlan.partyId,
          newPlan.downPaymentAmount,
          'cash',
          `دفعة أولى مقدمة من فاتورة مشتريات مقسطة رقم ${newPlan.invoiceNumber}`
        );
      }
    }

    // Sync customer's next debtDueDate with the earliest unpaid installment due date
    if (newPlan.partyType === 'customer') {
      const nextUnpaid = newPlan.installments
        .filter(i => i.status !== 'paid')
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
      if (nextUnpaid) {
        updateCustomer(newPlan.partyId, {
          debtDueDate: nextUnpaid.dueDate
        });
      }
    }

    const updated = [newPlan, ...installmentPlans];
    saveInstallmentPlansToStorage(updated);
    setActiveTab('installments');
    notify(
      'تم اعتماد خطة تقسيط الفاتورة',
      `تم تقسيم الفاتورة ${newPlan.invoiceNumber} (${newPlan.partyName}) إلى ${newPlan.installmentsCount} دفعات مجدولة بنجاح`,
      'success'
    );

    if (sendWhatsAppImmediately) {
      const resolvedPhone =
        (customWhatsAppPhone && customWhatsAppPhone.trim()) ||
        (newPlan.partyType === 'customer'
          ? customers.find(c => c.id === newPlan.partyId || c.name === newPlan.partyName)?.phone || ''
          : suppliers.find(s => s.id === newPlan.partyId || s.name === newPlan.partyName)?.phone || '');

      const planMsg = buildInstallmentPlanWhatsAppMessage({
        storeSettings: settings,
        plan: newPlan,
        bulletin: settings.exchangeBulletin
      });

      if (resolvedPhone.trim()) {
        try {
          await sendWhatsAppDebtMessage({
            phone: resolvedPhone.trim(),
            message: planMsg,
            customerName: newPlan.partyName,
            customerId: newPlan.partyId,
            amountDue: newPlan.remainingAmount,
            totalDebt: newPlan.totalInvoiceAmount,
            currencySymbol: settings.currency.symbolNative || settings.currency.symbol,
            type: 'installment_plan',
            storeSettings: settings
          });
          try {
            const updatedLogs = JSON.parse(localStorage.getItem(DEBT_COLLECTION_STORAGE_KEY) || '[]');
            setReminderLogs(updatedLogs);
          } catch {}
          notify(
            'تم إرسال فاتورة الأقساط على واتساب',
            `تم إرسال جدول الأقساط للفاتورة ${newPlan.invoiceNumber} إلى واتساب ${newPlan.partyName}`,
            'success'
          );
        } catch {}
      } else {
        openWhatsAppDeepLink('', planMsg);
      }
    }
  };

  const handlePaySingleInstallment = (plan: InvoiceInstallmentPlan, inst: InstallmentScheduleItem) => {
    if (inst.status === 'paid') return;
    const amountToPay = Math.max(0, inst.amount - (inst.paidAmount || 0));
    if (amountToPay <= 0) return;

    let tx: DebtTransaction | null = null;
    if (plan.partyType === 'customer') {
      tx = recordCustomerDebtPayment(
        plan.partyId,
        amountToPay,
        'cash',
        `تحصيل الدفعة رقم #${inst.installmentNumber} من فاتورة ${plan.invoiceNumber} (استحقاق ${inst.dueDate})`
      );
    } else {
      tx = recordSupplierDebtPayment(
        plan.partyId,
        amountToPay,
        'cash',
        `سداد الدفعة رقم #${inst.installmentNumber} من فاتورة المشتريات ${plan.invoiceNumber} (استحقاق ${inst.dueDate})`
      );
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const updatedPlans = installmentPlans.map(p => {
      if (p.id !== plan.id) return p;
      const updatedInsts = p.installments.map(item => {
        if (item.id !== inst.id) return item;
        return {
          ...item,
          paidAmount: item.amount,
          status: 'paid' as const,
          paidAt: new Date().toISOString(),
          voucherNumber: tx?.voucherNumber,
          paymentMethod: 'cash' as const
        };
      });

      const nextRemaining = updatedInsts.reduce(
        (sum, item) => sum + Math.max(0, item.amount - (item.paidAmount || 0)),
        0
      );
      const allPaid = updatedInsts.every(item => item.status === 'paid');
      const anyOverdue = updatedInsts.some(
        item => item.status !== 'paid' && item.dueDate < todayStr
      );

      // Update customer's next due date if customer
      if (p.partyType === 'customer') {
        const nextPending = updatedInsts
          .filter(item => item.status !== 'paid')
          .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
        updateCustomer(p.partyId, {
          debtDueDate: nextPending ? nextPending.dueDate : undefined
        });
      }

      return {
        ...p,
        installments: updatedInsts,
        remainingAmount: nextRemaining,
        status: allPaid ? ('completed' as const) : anyOverdue ? ('overdue' as const) : ('active' as const)
      };
    });

    saveInstallmentPlansToStorage(updatedPlans);
    if (tx) {
      setSelectedVoucherForPrint(tx);
    }
  };

  const handleUpdateInstallmentItemDueDate = (planId: string, installmentId: string, newDueDate: string) => {
    if (!newDueDate) return;
    const todayStr = new Date().toISOString().split('T')[0];
    const updatedPlans = installmentPlans.map(p => {
      if (p.id !== planId) return p;
      const updatedInsts = p.installments.map(item => {
        if (item.id !== installmentId) return item;
        const nextStatus =
          item.status === 'paid'
            ? ('paid' as const)
            : newDueDate < todayStr
            ? ('overdue' as const)
            : ('pending' as const);
        return {
          ...item,
          dueDate: newDueDate,
          status: nextStatus
        };
      });

      const allPaid = updatedInsts.every(i => i.status === 'paid');
      const anyOverdue = updatedInsts.some(i => i.status !== 'paid' && i.dueDate < todayStr);

      if (p.partyType === 'customer') {
        const nextPending = updatedInsts
          .filter(item => item.status !== 'paid')
          .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
        if (nextPending) {
          updateCustomer(p.partyId, { debtDueDate: nextPending.dueDate });
        }
      }

      return {
        ...p,
        installments: updatedInsts,
        status: allPaid ? ('completed' as const) : anyOverdue ? ('overdue' as const) : ('active' as const)
      };
    });

    saveInstallmentPlansToStorage(updatedPlans);
    notify('تم تحديث تاريخ استحقاق الدفعة', `تم تعديل موعد استحقاق القسط إلى ${newDueDate}`, 'info');
  };

  const handleDeleteInstallmentPlan = (planId: string) => {
    const updated = installmentPlans.filter(p => p.id !== planId);
    saveInstallmentPlansToStorage(updated);
    notify('تم حذف خطة التقسيط', 'تمت إزالة جدول الأقساط المحدد', 'info');
  };

  const installmentsKPIs = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    let totalFinanced = 0;
    let totalRemaining = 0;
    let overdueInstallmentsCount = 0;
    let overdueInstallmentsAmount = 0;
    let paidInstallmentsCount = 0;

    installmentPlans.forEach(p => {
      totalFinanced += p.financedAmount || 0;
      totalRemaining += p.remainingAmount || 0;
      p.installments.forEach(inst => {
        if (inst.status === 'paid') {
          paidInstallmentsCount++;
        } else if (inst.dueDate < todayStr || inst.status === 'overdue') {
          overdueInstallmentsCount++;
          overdueInstallmentsAmount += Math.max(0, inst.amount - (inst.paidAmount || 0));
        }
      });
    });

    return {
      plansCount: installmentPlans.length,
      totalFinanced,
      totalRemaining,
      overdueInstallmentsCount,
      overdueInstallmentsAmount,
      paidInstallmentsCount
    };
  }, [installmentPlans]);

  const filteredInstallmentPlans = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return installmentPlans.filter(p => {
      if (installmentFilterPartyType !== 'all' && p.partyType !== installmentFilterPartyType) return false;
      const isOverduePlan = p.installments.some(i => i.status !== 'paid' && i.dueDate < todayStr);
      const effectiveStatus = p.status === 'completed' ? 'completed' : isOverduePlan ? 'overdue' : 'active';
      if (installmentFilterStatus !== 'all' && effectiveStatus !== installmentFilterStatus) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          p.partyName.toLowerCase().includes(q) ||
          p.invoiceNumber.toLowerCase().includes(q) ||
          (p.notes && p.notes.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [installmentPlans, installmentFilterPartyType, installmentFilterStatus, searchQuery]);

  // Handlers for Supplier Payments
  const handleOpenSupplierPay = (sup: Supplier) => {
    setSelectedSupplierForPay(sup);
    setSupplierPayAmount(sup.currentDebt || 0);
    setSupplierPayDiscount('');
    setSupplierPayMethod('cash');
    setSupplierPayNotes('');
    setPayWhatsAppPhoneInput(sup.phone || '');
    setSendReceiptToWhatsAppOnPay(true);
    setIsSupplierPayModalOpen(true);
  };

  const handleExecuteSupplierPay = async (e: React.FormEvent) => {
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

      if (sendReceiptToWhatsAppOnPay) {
        const targetPhone = payWhatsAppPhoneInput.trim() || selectedSupplierForPay.phone || '';
        if (targetPhone) {
          const msg = buildVoucherReceiptWhatsAppMessage({
            storeSettings: settings,
            voucher: tx,
            partyPhone: targetPhone,
            bulletin: settings.exchangeBulletin
          });
          try {
            await sendWhatsAppDebtMessage({
              phone: targetPhone,
              message: msg,
              customerName: selectedSupplierForPay.name,
              customerId: selectedSupplierForPay.id,
              amountDue: tx.amount,
              totalDebt: tx.newBalance,
              currencySymbol: settings.currency.symbolNative || settings.currency.symbol,
              type: 'payment_receipt',
              storeSettings: settings
            });
            try {
              const updatedLogs = JSON.parse(localStorage.getItem(DEBT_COLLECTION_STORAGE_KEY) || '[]');
              setReminderLogs(updatedLogs);
            } catch {}
            notify(
              'تم إرسال سند الصرف عبر واتساب',
              `تم إرسال سند الصرف رقم ${tx.voucherNumber} مباشرة إلى واتساب المورد ${selectedSupplierForPay.name}`,
              'success'
            );
          } catch {}
        }
      }
    }
  };

  const handlePrintDebtsSummaryReport = () => {
    const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>ملخص الديون والذمم - ${settings.storeNameAr || settings.storeNameEn}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
    body { font-family: 'Cairo', sans-serif; padding: 24px; color: #0f172a; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 18px; }
    .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
    .kpi { border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px; background: #f8fafc; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 20px; }
    th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: right; }
    th { background: #0f172a; color: #fff; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h2 style="margin:0">${settings.storeNameAr || settings.storeNameEn}</h2>
      <p style="margin:4px 0 0;font-size:12px;color:#475569">تقرير ملخص الديون والذمم والأقساط المجدولة</p>
    </div>
    <div style="text-align:left;font-size:12px">
      <div>تاريخ الطباعة: ${new Date().toLocaleString('ar-SY')}</div>
    </div>
  </div>
  <div class="kpis">
    <div class="kpi"><div>ديون الزبائن</div><strong style="font-size:16px">${formatCurrency(totalCustomerDebt)}</strong></div>
    <div class="kpi"><div>مستحقات الموردين</div><strong style="font-size:16px">${formatCurrency(totalSupplierDebt)}</strong></div>
    <div class="kpi"><div>إجمالي فواتير المشتريات</div><strong style="font-size:16px">${formatCurrency(purchaseInvoicesKPIs.totalAmount)}</strong></div>
    <div class="kpi"><div>الأقساط المتبقية</div><strong style="font-size:16px">${formatCurrency(installmentsKPIs.totalRemaining)}</strong></div>
  </div>
  <h3>قائمة الزبائن المدينين</h3>
  <table>
    <thead><tr><th>العميل</th><th>الهاتف</th><th>تاريخ الاستحقاق</th><th>الرصيد المستحق</th></tr></thead>
    <tbody>
      ${customers.filter(c => (c.currentDebt || 0) > 0).map(c => `<tr><td>${c.name}</td><td>${c.phone || '—'}</td><td>${c.debtDueDate || '—'}</td><td>${formatCurrency(c.currentDebt || 0)}</td></tr>`).join('')}
    </tbody>
  </table>
  <h3>قائمة الموردين الدائنين</h3>
  <table>
    <thead><tr><th>المورد / الشركة</th><th>الهاتف</th><th>إجمالي المشتريات</th><th>الرصيد المستحق</th></tr></thead>
    <tbody>
      ${suppliers.filter(s => (s.currentDebt || 0) > 0).map(s => `<tr><td>${s.name}</td><td>${s.phone || '—'}</td><td>${formatCurrency(s.totalPurchases || 0)}</td><td>${formatCurrency(s.currentDebt || 0)}</td></tr>`).join('')}
    </tbody>
  </table>
</body>
</html>`;
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 2000);
      }, 300);
    }
  };

  const handleOpenSupplierInvoice = (sup?: Supplier) => {
    setSelectedSupplierForSmartPurchase(sup || null);
    setIsSmartPurchaseModalOpen(true);
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
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleOpenInstallmentSplitter()}
              className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-black text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all active:scale-95 cursor-pointer"
            >
              <Layers className="w-4 h-4" />
              <span>+ تقسيم فاتورة إلى أقساط</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenSupplierInvoice()}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all active:scale-95 cursor-pointer"
            >
              <Truck className="w-4 h-4" />
              <span>+ فاتورة شراء وتوريد من شركة / مورد</span>
            </button>

            <button
              type="button"
              onClick={handleOpenAddSupplier}
              className="px-3.5 py-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ إضافة مورد / شركة</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (activeTab === 'suppliers' && suppliers.length > 0) {
                  setSelectedPartyForStatement({ type: 'supplier', party: suppliers[0] });
                } else if (customers.length > 0) {
                  setSelectedPartyForStatement({ type: 'customer', party: customers[0] });
                } else if (suppliers.length > 0) {
                  setSelectedPartyForStatement({ type: 'supplier', party: suppliers[0] });
                }
              }}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>كشف حساب تفصيلي</span>
            </button>

            <button
              type="button"
              onClick={() => setIsWhatsAppAutomationModalOpen(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <MessageSquareShare className="w-4 h-4" />
              <span>التذكير الآلي (واتساب)</span>
            </button>

            <button
              type="button"
              onClick={handlePrintDebtsSummaryReport}
              className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
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

          {/* 4. Purchase Invoices & Vouchers Summary */}
          <div
            onClick={() => setActiveTab('purchase_invoices')}
            className="p-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-amber-50/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl cursor-pointer transition-all"
            title="انقر لعرض كافة فواتير المشتريات والتوريد"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                فواتير المشتريات والسندات
              </span>
              <ShoppingBag className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-lg sm:text-xl font-black font-mono text-slate-900 dark:text-white mt-1 flex items-baseline gap-2">
              <span>{purchaseInvoices.length} <span className="text-xs font-bold text-amber-600 dark:text-amber-400">فاتورة شراء</span></span>
              <span className="text-xs font-normal text-slate-400">• {debtTransactions.length} سند</span>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
              إجمالي المشتريات: {formatCurrency(purchaseInvoicesKPIs.totalAmount)}
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
              {(smartAlertSummary.overdueList.length > 0 || smartAlertSummary.highBalanceList.length > 0) && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 ${
                    activeTab === 'customers'
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400'
                  }`}
                  title="تنبيهات ذكية: عملاء متأخرون أو رصيد مرتفع"
                >
                  <BellRing className="w-3 h-3" />
                  {smartAlertSummary.overdueList.length + smartAlertSummary.highBalanceList.length}
                </span>
              )}
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
              <span>الشراء من الشركات والموردين ({suppliers.length})</span>
              {totalSupplierDebt > 0 && (
                <span className="px-1.5 py-0.2 rounded-md bg-slate-950/20 text-[10px] font-mono">
                  {formatCurrency(totalSupplierDebt)}
                </span>
              )}
            </button>

            <button
              type="button"
              id="tab-debt-purchase-invoices"
              onClick={() => setActiveTab('purchase_invoices')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'purchase_invoices'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>فواتير المشتريات ({purchaseInvoices.length})</span>
              {purchaseInvoicesKPIs.totalAmount > 0 && (
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                  activeTab === 'purchase_invoices' ? 'bg-white/20 text-white' : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                }`}>
                  {formatCurrency(purchaseInvoicesKPIs.totalAmount)}
                </span>
              )}
            </button>

            <button
              type="button"
              id="tab-debt-installments"
              onClick={() => setActiveTab('installments')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'installments'
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>جدولة الأقساط والدفعات ({installmentPlans.length})</span>
              {installmentsKPIs.overdueInstallmentsCount > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                  activeTab === 'installments' ? 'bg-rose-500 text-white' : 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400'
                }`}>
                  {installmentsKPIs.overdueInstallmentsCount} متأخر
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
                  activeTab === 'purchase_invoices' ? 'بحث برقم فاتورة الشراء، اسم المورد، أو الصنف...' :
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
          <div className="flex-1 overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 sm:p-4 space-y-4">
            {/* SMART DEBT NOTIFICATIONS & RISK RADAR CENTER */}
            <div className="rounded-2xl border border-rose-200/80 dark:border-rose-900/60 bg-gradient-to-br from-rose-50/70 via-amber-50/40 to-white dark:from-rose-950/30 dark:via-amber-950/15 dark:to-slate-900 overflow-hidden shadow-2xs">
              {/* Top Alert Bar */}
              <div className="p-3 sm:p-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-rose-200/50 dark:border-rose-900/40">
                <div className="flex items-start sm:items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-600/25 relative">
                    <BellRing className="w-5 h-5" />
                    {smartAlertSummary.allFlaggedList.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
                        {smartAlertSummary.allFlaggedList.length}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                        نظام الإشعارات الذكي ومراقبة مخاطر الديون
                      </h3>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                        {smartAlertSummary.overdueList.length} متأخر عن السداد • {smartAlertSummary.highBalanceList.length} رصيد مرتفع
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                      يميز تلقائياً العملاء الذين تجاوزوا تاريخ السداد المحدد أو تخطت ديونهم الحد الآمن ({formatCurrency(highBalanceThreshold)} أو {creditUsageAlertPercent}% من السقف)
                    </p>
                  </div>
                </div>

                {/* Filter Pills & Settings Button */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setSmartAlertFilter('all')}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                      smartAlertFilter === 'all'
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-xs'
                        : 'bg-white/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    الكل ({customers.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setSmartAlertFilter(smartAlertFilter === 'overdue' ? 'all' : 'overdue')}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                      smartAlertFilter === 'overdue'
                        ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/30'
                        : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80 hover:bg-rose-100'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>متأخر عن السداد ({smartAlertSummary.overdueList.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSmartAlertFilter(smartAlertFilter === 'high_balance' ? 'all' : 'high_balance')}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                      smartAlertFilter === 'high_balance'
                        ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/30'
                        : 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80 hover:bg-amber-100'
                    }`}
                  >
                    <Flame className="w-3.5 h-3.5" />
                    <span>رصيد مرتفع ({smartAlertSummary.highBalanceList.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSmartAlertFilter(smartAlertFilter === 'due_soon' ? 'all' : 'due_soon')}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                      smartAlertFilter === 'due_soon'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80 hover:bg-indigo-100'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>يستحق قريباً ({smartAlertSummary.dueSoonList.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsAlertRulesConfigOpen(!isAlertRulesConfigOpen)}
                    className={`p-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      isAlertRulesConfigOpen
                        ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                    title="ضبط معايير التنبيه الذكي (حد الرصيد المرتفع وأيام الاستحقاق)"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsSmartAlertDrawerOpen(!isSmartAlertDrawerOpen)}
                    className="p-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 cursor-pointer"
                    title={isSmartAlertDrawerOpen ? 'طي قائمة الإشعارات العاجلة' : 'عرض قائمة الإشعارات العاجلة'}
                  >
                    {isSmartAlertDrawerOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Configurable Smart Thresholds Drawer */}
              {isAlertRulesConfigOpen && (
                <div className="p-3 bg-slate-900/5 dark:bg-slate-950/60 border-b border-rose-200/50 dark:border-rose-900/40 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in fade-in">
                  <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                      حد الرصيد المرتفع للتنبيه ({settings.currency.symbol}):
                    </label>
                    <input
                      type="number"
                      min={1000}
                      step={25000}
                      value={highBalanceThreshold}
                      onChange={e => setHighBalanceThreshold(Math.max(0, Number(e.target.value)))}
                      className="w-full text-xs font-mono font-black py-1.5 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                      نسبة استهلاك سقف الائتمان للتنبيه (%):
                    </label>
                    <input
                      type="number"
                      min={10}
                      max={100}
                      value={creditUsageAlertPercent}
                      onChange={e => setCreditUsageAlertPercent(Math.min(100, Math.max(10, Number(e.target.value))))}
                      className="w-full text-xs font-mono font-black py-1.5 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                      مهلة السداد الافتراضية عند عدم تحديد تاريخ (بالأيام):
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={defaultCreditDays}
                      onChange={e => setDefaultCreditDays(Math.max(1, Number(e.target.value)))}
                      className="w-full text-xs font-mono font-black py-1.5 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {/* Expandable Priority Notification Feed */}
              {isSmartAlertDrawerOpen && smartAlertSummary.allFlaggedList.length > 0 && (
                <div className="p-3 space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400 px-1">
                    <span>
                      قائمة التنبيهات النشطة ({smartAlertSummary.allFlaggedList.length} عميل يتطلب متابعة تحصيل):
                    </span>
                    <span className="font-mono text-rose-600 dark:text-rose-400">
                      إجمالي الديون المتأخرة: {formatCurrency(smartAlertSummary.overdueTotalDebt)}
                    </span>
                  </div>

                  <div className="flex items-stretch gap-2.5 overflow-x-auto pb-1 no-scrollbar">
                    {smartAlertSummary.allFlaggedList.map(alertItem => {
                      const isCrit = alertItem.severity === 'critical';
                      const isOver = alertItem.isOverdue;
                      return (
                        <div
                          key={alertItem.customer.id}
                          className={`min-w-[270px] sm:min-w-[300px] max-w-[320px] p-3 rounded-xl border flex flex-col justify-between gap-2 transition-all shrink-0 ${
                            isCrit
                              ? 'bg-rose-50/90 dark:bg-rose-950/50 border-rose-300 dark:border-rose-700 shadow-xs'
                              : isOver
                              ? 'bg-white dark:bg-slate-900 border-rose-200 dark:border-rose-800/80'
                              : alertItem.isHighBalance
                              ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/80'
                              : 'bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800/70'
                          }`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`w-2 h-2 rounded-full shrink-0 ${
                                      isCrit || isOver
                                        ? 'bg-rose-600 animate-ping'
                                        : alertItem.isHighBalance
                                        ? 'bg-amber-500'
                                        : 'bg-indigo-500'
                                    }`}
                                  />
                                  <h4 className="font-black text-xs text-slate-900 dark:text-white truncate">
                                    {alertItem.customer.name}
                                  </h4>
                                </div>
                                <span className="text-[11px] font-black font-mono text-rose-600 dark:text-rose-400 block mt-0.5">
                                  {formatCurrency(alertItem.debt)}
                                </span>
                              </div>

                              <span
                                className={`text-[10px] font-black px-2 py-0.5 rounded-full whitespace-nowrap ${
                                  isCrit
                                    ? 'bg-rose-600 text-white'
                                    : isOver
                                    ? 'bg-rose-100 dark:bg-rose-900/70 text-rose-700 dark:text-rose-200'
                                    : alertItem.isHighBalance
                                    ? 'bg-amber-100 dark:bg-amber-900/70 text-amber-800 dark:text-amber-200'
                                    : 'bg-indigo-100 dark:bg-indigo-900/70 text-indigo-700 dark:text-indigo-200'
                                }`}
                              >
                                {isCrit
                                  ? 'حرج: متأخر + رصيد مرتفع'
                                  : isOver
                                  ? `متأخر ${alertItem.overdueDays} يوم`
                                  : alertItem.isHighBalance
                                  ? `رصيد مرتفع (${alertItem.usagePercent}%)`
                                  : 'يستحق السداد قريباً'}
                              </span>
                            </div>

                            <div className="mt-1.5 space-y-0.5">
                              {alertItem.reasons.map((r, idx) => (
                                <div
                                  key={idx}
                                  className="text-[10px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1"
                                >
                                  <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />
                                  <span className="truncate">{r}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-1.5">
                            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                              الاستحقاق: {alertItem.effectiveDueDate || 'غير محدد'}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenCustomerPay(alertItem.customer)}
                                className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold cursor-pointer"
                              >
                                تحصيل
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenWhatsAppReminder(alertItem.customer)}
                                className="px-2 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-300/50 text-[10px] font-bold cursor-pointer"
                                title="إرسال تنبيه واتساب ذكي"
                              >
                                واتساب
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenDueDateModal(alertItem.customer)}
                                className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-[10px] font-bold cursor-pointer"
                                title="تعديل موعد السداد"
                              >
                                جدولة
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

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
                  const alertProfile = customerAlertMap[cust.id];
                  const isOverdue = alertProfile?.isOverdue || false;
                  const isHighBalance = alertProfile?.isHighBalance || false;
                  const isDueSoon = alertProfile?.isDueSoon || false;
                  const isCritical = alertProfile?.severity === 'critical';

                  return (
                    <div
                      key={cust.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between shadow-2xs relative overflow-hidden ${
                        isCritical
                          ? 'bg-gradient-to-b from-rose-50/80 via-amber-50/20 to-white dark:from-rose-950/35 dark:via-slate-900 dark:to-slate-900 border-rose-400 dark:border-rose-600 ring-2 ring-rose-500/20'
                          : isOverdue
                          ? 'bg-gradient-to-b from-rose-50/60 to-white dark:from-rose-950/25 dark:to-slate-900 border-rose-300 dark:border-rose-700/90'
                          : isHighBalance
                          ? 'bg-gradient-to-b from-amber-50/60 to-white dark:from-amber-950/25 dark:to-slate-900 border-amber-300 dark:border-amber-700/90'
                          : debt > 0
                          ? 'bg-gradient-to-b from-indigo-50/40 to-white dark:from-indigo-950/20 dark:to-slate-900 border-indigo-200/80 dark:border-indigo-800/80'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div>
                        {/* Smart Diagnostic Banner for Flagged Customers */}
                        {alertProfile && (isOverdue || isHighBalance || isDueSoon) && (
                          <div
                            className={`mb-3 px-2.5 py-1.5 rounded-xl border flex items-center justify-between gap-2 text-[10px] font-bold ${
                              isCritical || isOverdue
                                ? 'bg-rose-100/90 dark:bg-rose-950/70 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                                : isHighBalance
                                ? 'bg-amber-100/90 dark:bg-amber-950/70 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                                : 'bg-indigo-100/80 dark:bg-indigo-950/70 border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-200'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              {isCritical || isOverdue ? (
                                <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0 animate-pulse" />
                              ) : isHighBalance ? (
                                <Flame className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                              ) : (
                                <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                              )}
                              <span className="truncate">{alertProfile.reasons.join(' • ')}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleOpenDueDateModal(cust)}
                              className="underline hover:opacity-80 shrink-0 cursor-pointer"
                            >
                              تعديل الموعد
                            </button>
                          </div>
                        )}

                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
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

                          <div className="flex flex-col items-end gap-1">
                            <span
                              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                                isCritical
                                  ? 'bg-rose-600 text-white shadow-xs'
                                  : isOverdue
                                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-300 dark:border-rose-700'
                                  : isHighBalance
                                  ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                                  : debt > 0
                                  ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300'
                                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                              }`}
                            >
                              {isCritical
                                ? 'تجاوز السداد والسقف'
                                : isOverdue
                                ? `متأخر ${alertProfile?.overdueDays} يوم`
                                : isHighBalance
                                ? 'رصيد مرتفع'
                                : debt > 0
                                ? 'مستحق الدفع'
                                : 'حساب مبرأ'}
                            </span>
                          </div>
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
                            <button
                              type="button"
                              onClick={() => handleOpenDueDateModal(cust)}
                              className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 cursor-pointer"
                              title="انقر لتعديل سقف الائتمان وتاريخ الاستحقاق"
                            >
                              <span>{formatCurrency(creditLimit)}</span>
                            </button>
                          </div>
                        </div>

                        {/* Due Date Schedule Row */}
                        <div className="mt-2 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-bold">تاريخ السداد المحدد:</span>
                            <span
                              className={`font-mono font-bold ${
                                isOverdue
                                  ? 'text-rose-600 dark:text-rose-400'
                                  : isDueSoon
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : 'text-slate-700 dark:text-slate-200'
                              }`}
                            >
                              {alertProfile?.effectiveDueDate || cust.debtDueDate || 'غير محدد'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleOpenDueDateModal(cust)}
                            className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                          >
                            {cust.debtDueDate ? 'تغيير التاريخ' : '+ تحديد موعد'}
                          </button>
                        </div>

                        {/* Credit Usage Bar */}
                        {creditLimit > 0 && debt > 0 && (
                          <div className="mt-2 space-y-1">
                            <div className="flex justify-between text-[10px] text-slate-400 font-mono font-bold">
                              <span>استهلاك الائتمان:</span>
                              <span className={usagePercent >= creditUsageAlertPercent ? 'text-rose-600 dark:text-rose-400 font-black' : ''}>
                                {usagePercent}%
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  usagePercent >= creditUsageAlertPercent ? 'bg-rose-500' : usagePercent > 50 ? 'bg-amber-500' : 'bg-indigo-500'
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
                          onClick={() => handleOpenInstallmentSplitter({
                            partyType: 'customer',
                            customer: cust,
                            totalAmount: debt > 0 ? debt : 250000
                          })}
                          className="py-2 px-2 bg-violet-50 dark:bg-violet-950/50 hover:bg-violet-100 text-violet-700 dark:text-violet-300 font-bold text-xs rounded-xl border border-violet-200 dark:border-violet-800 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                          title="تقسيم فاتورة أو رصيد العميل إلى دفعات وأقساط مجدولة"
                        >
                          <Layers className="w-3.5 h-3.5" />
                          <span>تقسيط</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedPartyForStatement({ type: 'customer', party: cust })}
                          className="py-2 px-2.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60 font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition-colors cursor-pointer"
                          title="كشف حساب مالي تفصيلي"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                          <span>كشف حساب</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SUPPLIERS DEBTS & PURCHASING */}
        {activeTab === 'suppliers' && (
          <div className="flex-1 overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 sm:p-4 space-y-4">
            {/* Quick Supplier Purchasing & Inventory Restock Header Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent dark:from-amber-950/40 dark:to-slate-900 border border-amber-300/60 dark:border-amber-800/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    مركز الشراء والتوريد من الشركات والموردين
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    أضف اسم المورد أو الشركة، وأدرج منتجات من المخزون أو عرف منتجات جديدة مع الكمية وسعر الشراء وسعر البيع بالجملة والمفرق
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleOpenSupplierInvoice()}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>+ فاتورة شراء بضاعة وتوريد مخزون</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenAddSupplier}
                  className="px-3.5 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-amber-500" />
                  <span>إضافة شركة / مورد جديد</span>
                </button>
              </div>
            </div>

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
                        <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleOpenSupplierPay(sup)}
                            className="flex-1 py-2 px-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1 shadow-xs transition-all active:scale-95 cursor-pointer"
                            title="تسجيل سند صرف وسداد دفعة للمورد"
                          >
                            <Coins className="w-3.5 h-3.5" />
                            <span>سند صرف</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenSupplierInvoice(sup)}
                            className="flex-1 py-2 px-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 shadow-xs transition-all active:scale-95 cursor-pointer"
                            title="شراء وتوريد بضاعة من المورد (تحديث الكميات وأسعار الشراء والجملة والمفرق)"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>شراء بضاعة</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSupplierFilterForInvoices(sup.id);
                              setActiveTab('purchase_invoices');
                            }}
                            className="py-2 px-2.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-800 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-700/60 font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition-colors cursor-pointer"
                            title="عرض فواتير المشتريات الخاصة بهذا المورد"
                          >
                            <ReceiptText className="w-3.5 h-3.5" />
                            <span>فواتير الشراء ({purchaseInvoices.filter(inv => inv.partyId === sup.id).length})</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedPartyForStatement({ type: 'supplier', party: sup })}
                            className="py-2 px-2.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60 font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition-colors cursor-pointer"
                            title="كشف حساب مالي تفصيلي"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                            <span>كشف حساب</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Embedded Purchase Invoices Section inside Suppliers Tab */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                      <ReceiptText className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">
                        سجل فواتير المشتريات والتوريد من الموردين ({purchaseInvoices.length})
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        جميع فواتير شراء البضاعة المسجلة مع تفاصيل الأصناف الموردة والمدفوعات والذمم المتبقية
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSupplierFilterForInvoices('all');
                        setActiveTab('purchase_invoices');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
                    >
                      فتح تبويب فواتير المشتريات الكامل
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenSupplierInvoice()}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>فاتورة شراء جديدة</span>
                    </button>
                  </div>
                </div>

                {purchaseInvoices.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                    لا توجد فواتير مشتريات مسجلة بعد. اضغط على «+ فاتورة شراء بضاعة وتوريد مخزون» لإضافة فاتورة.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-xs text-start">
                      <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="p-3 text-start">رقم الفاتورة / السند</th>
                          <th className="p-3 text-start">التاريخ</th>
                          <th className="p-3 text-start">المورد / الشركة</th>
                          <th className="p-3 text-start">الأصناف الموردة</th>
                          <th className="p-3 text-end">إجمالي الفاتورة</th>
                          <th className="p-3 text-end">المسدد</th>
                          <th className="p-3 text-end">المتبقي ذمة</th>
                          <th className="p-3 text-center">إجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {purchaseInvoices.slice(0, 10).map(inv => {
                          const amt = inv.amount || 0;
                          const paid = inv.paidAmount !== undefined ? inv.paidAmount : 0;
                          const rem = inv.remainingDebt !== undefined ? inv.remainingDebt : Math.max(0, amt - paid);
                          const status = inv.paymentStatus || (paid >= amt ? 'cash' : paid > 0 ? 'partial' : 'credit');

                          return (
                            <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                              <td className="p-3">
                                <div className="font-mono font-black text-slate-900 dark:text-white">
                                  {inv.referenceInvoice || inv.voucherNumber}
                                </div>
                                <span className="text-[10px] font-mono text-slate-400 block">
                                  سند: {inv.voucherNumber}
                                </span>
                              </td>
                              <td className="p-3 text-[11px] font-mono text-slate-500">
                                {new Date(inv.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SY' : 'en-US')}
                              </td>
                              <td className="p-3 font-bold text-slate-900 dark:text-white">
                                {inv.partyName}
                              </td>
                              <td className="p-3 max-w-xs">
                                {inv.purchaseItems && inv.purchaseItems.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {inv.purchaseItems.slice(0, 3).map((item, idx) => (
                                      <span
                                        key={idx}
                                        className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300"
                                      >
                                        {item.productName} × {item.quantity}
                                      </span>
                                    ))}
                                    {inv.purchaseItems.length > 3 && (
                                      <span className="px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-[10px] font-bold text-indigo-600">
                                        +{inv.purchaseItems.length - 3} أصناف
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-[11px] text-slate-500 truncate block max-w-[240px]">
                                    {inv.notes || 'فاتورة شراء بضاعة'}
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-end font-mono font-black text-slate-900 dark:text-white">
                                {formatCurrency(amt)}
                              </td>
                              <td className="p-3 text-end font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(paid)}
                              </td>
                              <td className="p-3 text-end">
                                <span className={`font-mono font-black ${rem > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600'}`}>
                                  {formatCurrency(rem)}
                                </span>
                                <span className={`block text-[9px] font-bold ${
                                  status === 'cash' ? 'text-emerald-600' : status === 'partial' ? 'text-amber-600' : 'text-rose-600'
                                }`}>
                                  {status === 'cash' ? 'مدفوعة نقداً' : status === 'partial' ? 'مسددة جزئياً' : 'آجلة بالكامل'}
                                </span>
                              </td>
                              <td className="p-3 text-center">
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedPurchaseInvoiceForView(inv)}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>عرض الفاتورة</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSendVoucherWhatsApp(inv, true)}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                                    title="إرسال الفاتورة مباشرة عبر واتساب"
                                  >
                                    <Send className="w-3 h-3" />
                                    <span>واتساب</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedVoucherForPrint(inv)}
                                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 text-slate-600 dark:text-slate-300 cursor-pointer"
                                    title="طباعة السند"
                                  >
                                    <Printer className="w-3.5 h-3.5" />
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
          </div>
        )}

        {/* TAB 2.5: PURCHASE INVOICES (فواتير المشتريات) */}
        {activeTab === 'purchase_invoices' && (
          <div className="flex-1 overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 sm:p-4 space-y-4">
            {/* Header & KPIs for Purchase Invoices */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-amber-500/5 to-transparent dark:from-emerald-950/30 dark:to-slate-900 border border-emerald-200/80 dark:border-emerald-800/60 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                      سجل فواتير المشتريات والتوريد من الشركات والموردين
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      استعراض كافة فواتير الشراء مع تفصيل الأصناف الموردة، أسعار التكلفة والجملة والمفرق، الدفعات المسددة، والذمم المتبقية
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenSupplierInvoice()}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ تسجيل فاتورة مشتريات جديدة</span>
                  </button>
                </div>
              </div>

              {/* 4 Mini KPI Cards for Purchase Invoices */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-500 block">عدد فواتير المشتريات</span>
                  <span className="text-lg font-black font-mono text-slate-900 dark:text-white mt-0.5 block">
                    {purchaseInvoicesKPIs.count} فاتورة
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-500 block">إجمالي قيمة فواتير الشراء</span>
                  <span className="text-lg font-black font-mono text-indigo-600 dark:text-indigo-400 mt-0.5 block">
                    {formatCurrency(purchaseInvoicesKPIs.totalAmount)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-500 block">المدفوع عند الشراء</span>
                  <span className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                    {formatCurrency(purchaseInvoicesKPIs.totalPaid)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-500 block">الذمم الآجلة من الفواتير</span>
                  <span className="text-lg font-black font-mono text-rose-600 dark:text-rose-400 mt-0.5 block">
                    {formatCurrency(purchaseInvoicesKPIs.totalRemaining)}
                  </span>
                </div>
              </div>

              {/* Filter Bar by Supplier & Payment Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-emerald-200/50 dark:border-slate-800">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 me-1">حالة السداد:</span>
                  {[
                    { id: 'all', label: 'كل الفواتير' },
                    { id: 'credit', label: 'آجل (غير مسدد)' },
                    { id: 'partial', label: 'مسدد جزئياً' },
                    { id: 'cash', label: 'مدفوع نقداً بالكامل' }
                  ].map(st => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setPurchasePaymentStatusFilter(st.id as any)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        purchasePaymentStatusFilter === st.id
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">تصفية حسب المورد:</span>
                  <select
                    value={selectedSupplierFilterForInvoices}
                    onChange={e => setSelectedSupplierFilterForInvoices(e.target.value)}
                    className="text-xs py-1.5 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:outline-none"
                  >
                    <option value="all">جميع الشركات والموردين ({suppliers.length})</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Purchase Invoices Cards List */}
            {filteredPurchaseInvoices.length === 0 ? (
              <div className="h-60 flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <ShoppingBag className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-2" />
                <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                  لا توجد فواتير مشتريات مطابقة للفلتر المحدد
                </p>
                <button
                  type="button"
                  onClick={() => handleOpenSupplierInvoice()}
                  className="mt-3 px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 cursor-pointer"
                >
                  + إضافة فاتورة مشتريات جديدة
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                {filteredPurchaseInvoices.map(inv => {
                  const amt = inv.amount || 0;
                  const paid = inv.paidAmount !== undefined ? inv.paidAmount : 0;
                  const rem = inv.remainingDebt !== undefined ? inv.remainingDebt : Math.max(0, amt - paid);
                  const status = inv.paymentStatus || (paid >= amt ? 'cash' : paid > 0 ? 'partial' : 'credit');
                  const supplierObj = suppliers.find(s => s.id === inv.partyId || s.name === inv.partyName);

                  return (
                    <div
                      key={inv.id}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-400/70 dark:hover:border-emerald-700/70 shadow-2xs flex flex-col justify-between gap-3 transition-all"
                    >
                      <div className="space-y-3">
                        {/* Card Top Row */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-black text-sm text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                                {inv.referenceInvoice || inv.voucherNumber}
                              </span>
                              <span className="text-[11px] font-mono text-slate-400">
                                سند: {inv.voucherNumber}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <Building2 className="w-4 h-4 text-amber-500 shrink-0" />
                              <h4 className="font-black text-sm text-slate-900 dark:text-white">
                                {inv.partyName}
                              </h4>
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                              📅 {new Date(inv.createdAt).toLocaleString(language === 'ar' ? 'ar-SY' : 'en-US')} • بواسطة: {inv.recordedBy}
                            </div>
                          </div>

                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black whitespace-nowrap ${
                              status === 'cash'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                                : status === 'partial'
                                ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                            }`}
                          >
                            {status === 'cash'
                              ? 'مدفوعة نقداً بالكامل'
                              : status === 'partial'
                              ? 'مسددة جزئياً (نقد + آجل)'
                              : 'فاتورة شراء آجلة (دين)'}
                          </span>
                        </div>

                        {/* Financial Breakdown Row */}
                        <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block">إجمالي الفاتورة:</span>
                            <span className="text-sm font-black font-mono text-slate-900 dark:text-white">
                              {formatCurrency(amt)}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block">المسدد للمورد:</span>
                            <span className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(paid)}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block">المتبقي ذمة:</span>
                            <span className={`text-sm font-black font-mono ${rem > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500'}`}>
                              {formatCurrency(rem)}
                            </span>
                          </div>
                        </div>

                        {/* Purchased Items Mini Table */}
                        {inv.purchaseItems && inv.purchaseItems.length > 0 ? (
                          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
                            <div className="px-3 py-1.5 bg-slate-100/80 dark:bg-slate-800/80 text-[10px] font-black text-slate-600 dark:text-slate-300 flex items-center justify-between">
                              <span className="flex items-center gap-1">
                                <Package className="w-3.5 h-3.5 text-emerald-600" />
                                الأصناف الموردة في الفاتورة ({inv.purchaseItems.length} صنف)
                              </span>
                              <span>الكمية × سعر الشراء</span>
                            </div>
                            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-36 overflow-y-auto">
                              {inv.purchaseItems.map((item, idx) => (
                                <div key={idx} className="px-3 py-1.5 flex items-center justify-between text-[11px] bg-white dark:bg-slate-900">
                                  <div className="truncate pe-2">
                                    <span className="font-bold text-slate-800 dark:text-slate-200">{item.productName}</span>
                                    {item.unit && (
                                      <span className="text-[10px] text-slate-400 ms-1">({item.unit})</span>
                                    )}
                                  </div>
                                  <div className="font-mono text-end shrink-0">
                                    <span className="text-slate-500">{item.quantity} × {formatCurrency(item.costPrice)} = </span>
                                    <span className="font-black text-slate-900 dark:text-white">{formatCurrency(item.totalCost)}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-800">
                            <span className="font-bold text-slate-400 block text-[10px] mb-0.5">بيان الفاتورة:</span>
                            {inv.notes || 'فاتورة شراء بضاعة من المورد'}
                          </div>
                        )}
                      </div>

                      {/* Card Footer Actions */}
                      <div className="pt-2.5 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setSelectedPurchaseInvoiceForView(inv)}
                          className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>عرض وطباعة الفاتورة</span>
                        </button>

                        {supplierObj && rem > 0 && (
                          <button
                            type="button"
                            onClick={() => handleOpenSupplierPay(supplierObj)}
                            className="py-2 px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer"
                            title="تسجيل سند صرف لسداد المورد"
                          >
                            <Coins className="w-3.5 h-3.5" />
                            <span>سداد دفعة</span>
                          </button>
                        )}

                        {supplierObj && rem > 0 && (
                          <button
                            type="button"
                            onClick={() =>
                              handleOpenInstallmentSplitter({
                                partyType: 'supplier',
                                supplier: supplierObj,
                                invoiceNumber: inv.referenceInvoice || inv.voucherNumber,
                                totalAmount: amt,
                                downPayment: paid
                              })
                            }
                            className="py-2 px-2.5 bg-violet-50 dark:bg-violet-950/50 hover:bg-violet-100 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer"
                            title="تقسيم فاتورة المشتريات إلى دفعات وأقساط مجدولة"
                          >
                            <Layers className="w-3.5 h-3.5" />
                            <span>تقسيط الفاتورة</span>
                          </button>
                        )}

                        {supplierObj && (
                          <button
                            type="button"
                            onClick={() => setSelectedPartyForStatement({ type: 'supplier', party: supplierObj })}
                            className="py-2 px-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer"
                            title="كشف حساب المورد"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                            <span>كشف الحساب</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setSelectedVoucherForPrint(inv)}
                          className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 text-slate-700 dark:text-slate-300 rounded-xl cursor-pointer"
                          title="طباعة سند القيد"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2.8: INVOICE INSTALLMENTS & SCHEDULED PAYMENTS (جدولة الأقساط والدفعات) */}
        {activeTab === 'installments' && (
          <div className="flex-1 overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 sm:p-4 space-y-4">
            {/* Header & KPIs for Installment Plans */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-500/10 via-indigo-500/5 to-transparent dark:from-violet-950/30 dark:to-slate-900 border border-violet-200/80 dark:border-violet-800/60 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-violet-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-violet-600/20">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                      مركز تقسيم الفواتير إلى دفعات متعددة وجدولة تواريخ الاستحقاق
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      قسّم أي فاتورة زبون أو مورد إلى دفعات وأقساط مجدولة مع تواريخ استحقاق دقيقة لكل دفعة وسندات تحصيل مباشرة
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenInstallmentSplitter()}
                    className="px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-black text-xs rounded-xl shadow-md shadow-violet-600/20 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ تقسيم فاتورة جديدة إلى أقساط</span>
                  </button>
                </div>
              </div>

              {/* 4 Mini KPI Cards for Installment Plans */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-500 block">خطط التقسيط الفعالة</span>
                  <span className="text-lg font-black font-mono text-slate-900 dark:text-white mt-0.5 block">
                    {installmentsKPIs.plansCount} خطة
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-500 block">إجمالي المبالغ المجدولة</span>
                  <span className="text-lg font-black font-mono text-violet-600 dark:text-violet-400 mt-0.5 block">
                    {formatCurrency(installmentsKPIs.totalFinanced)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-500 block">الرصيد المتبقي من الأقساط</span>
                  <span className="text-lg font-black font-mono text-indigo-600 dark:text-indigo-400 mt-0.5 block">
                    {formatCurrency(installmentsKPIs.totalRemaining)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-500 block">دفعات متأخرة عن موعدها</span>
                  <span className="text-lg font-black font-mono text-rose-600 dark:text-rose-400 mt-0.5 block">
                    {installmentsKPIs.overdueInstallmentsCount} دفعة ({formatCurrency(installmentsKPIs.overdueInstallmentsAmount)})
                  </span>
                </div>
              </div>

              {/* Filter Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-violet-200/50 dark:border-slate-800">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 me-1">نوع الطرف:</span>
                  {[
                    { id: 'all', label: 'كل الفواتير المقسطة' },
                    { id: 'customer', label: 'أقساط الزبائن (مبيعات)' },
                    { id: 'supplier', label: 'أقساط الموردين (مشتريات)' }
                  ].map(pt => (
                    <button
                      key={pt.id}
                      type="button"
                      onClick={() => setInstallmentFilterPartyType(pt.id as any)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        installmentFilterPartyType === pt.id
                          ? 'bg-violet-600 text-white shadow-2xs'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {pt.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 me-1">حالة الجدول:</span>
                  {[
                    { id: 'all', label: 'الكل' },
                    { id: 'overdue', label: 'بها أقساط متأخرة' },
                    { id: 'active', label: 'نشطة منتظمة' },
                    { id: 'completed', label: 'مكتملة السداد' }
                  ].map(st => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setInstallmentFilterStatus(st.id as any)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        installmentFilterStatus === st.id
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Installment Plans Cards */}
            {filteredInstallmentPlans.length === 0 ? (
              <div className="h-60 flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <Layers className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-2" />
                <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                  لا توجد خطط تقسيط مطابقة للفلتر المحدد
                </p>
                <button
                  type="button"
                  onClick={() => handleOpenInstallmentSplitter()}
                  className="mt-3 px-4 py-2 bg-violet-600 text-white font-bold text-xs rounded-xl hover:bg-violet-700 cursor-pointer"
                >
                  + تقسيم فاتورة إلى دفعات الآن
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {filteredInstallmentPlans.map(plan => {
                  const todayStr = new Date().toISOString().split('T')[0];
                  const paidCount = plan.installments.filter(i => i.status === 'paid').length;
                  const totalCount = plan.installments.length;
                  const paidSum = plan.installments.reduce((s, i) => s + (i.paidAmount || 0), 0);
                  const progressPct = plan.financedAmount > 0 ? Math.min(100, Math.round((paidSum / plan.financedAmount) * 100)) : 0;
                  const hasOverdue = plan.installments.some(i => i.status !== 'paid' && i.dueDate < todayStr);
                  const isCompleted = paidCount === totalCount && totalCount > 0;

                  return (
                    <div
                      key={plan.id}
                      className={`p-4 rounded-2xl border shadow-2xs flex flex-col justify-between gap-3 transition-all ${
                        isCompleted
                          ? 'bg-emerald-50/30 dark:bg-emerald-950/15 border-emerald-200 dark:border-emerald-800'
                          : hasOverdue
                          ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="space-y-3">
                        {/* Top Plan Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-black text-xs text-slate-900 dark:text-white">
                                فاتورة: {plan.invoiceNumber}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                  plan.partyType === 'customer'
                                    ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                }`}
                              >
                                {plan.partyType === 'customer' ? 'زبون (تحصيل أقساط)' : 'مورد (سداد أقساط)'}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400">
                                ({plan.frequency === 'weekly' ? 'أسبوعي' : plan.frequency === 'biweekly' ? 'نصف شهري' : plan.frequency === 'monthly' ? 'شهري' : 'مخصص'})
                              </span>
                            </div>

                            <h4 className="font-black text-sm text-slate-900 dark:text-white mt-1.5 flex items-center gap-1.5">
                              {plan.partyType === 'customer' ? (
                                <Users className="w-4 h-4 text-indigo-500" />
                              ) : (
                                <Building2 className="w-4 h-4 text-amber-500" />
                              )}
                              <span>{plan.partyName}</span>
                            </h4>

                            {plan.notes && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                {plan.notes}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 flex-wrap justify-end">
                            <button
                              type="button"
                              onClick={() => handleSendInstallmentPlanWhatsApp(plan, true)}
                              className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black flex items-center gap-1 shadow-xs transition-all active:scale-95 cursor-pointer"
                              title="إرسال فاتورة الأقساط وجدول الدفعات مباشرة عبر واتساب"
                            >
                              <Send className="w-3 h-3" />
                              <span>إرسال فاتورة الأقساط واتساب</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSendInstallmentPlanWhatsApp(plan, false)}
                              className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 cursor-pointer"
                              title="معاينة وتعديل رسالة فاتورة الأقساط قبل الإرسال"
                            >
                              <MessageSquareShare className="w-3.5 h-3.5" />
                            </button>
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-black whitespace-nowrap ${
                                isCompleted
                                  ? 'bg-emerald-600 text-white'
                                  : hasOverdue
                                  ? 'bg-rose-600 text-white animate-pulse'
                                  : 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300'
                              }`}
                            >
                              {isCompleted ? 'مكتمل السداد ✓' : hasOverdue ? 'يوجد قسط متأخر!' : `نشط (${paidCount}/${totalCount})`}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteInstallmentPlan(plan.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer"
                              title="حذف جدول التقسيط"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Plan Amounts & Progress Bar */}
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 space-y-2">
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div>
                              <span className="text-[10px] text-slate-400 font-bold block">إجمالي الفاتورة / المقدم:</span>
                              <span className="font-mono font-bold text-slate-700 dark:text-slate-200">
                                {formatCurrency(plan.totalInvoiceAmount)}
                                {plan.downPaymentAmount > 0 && (
                                  <span className="text-[10px] text-emerald-600 block">
                                    مقدم: {formatCurrency(plan.downPaymentAmount)}
                                  </span>
                                )}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 font-bold block">المبلغ المقسط:</span>
                              <span className="font-mono font-black text-violet-600 dark:text-violet-400">
                                {formatCurrency(plan.financedAmount)}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 font-bold block">المتبقي غير المسدد:</span>
                              <span className="font-mono font-black text-rose-600 dark:text-rose-400">
                                {formatCurrency(plan.remainingAmount)}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-bold text-slate-500">
                              <span>نسبة إنجاز الأقساط ({paidCount} من {totalCount} دفعات):</span>
                              <span className="font-mono">{progressPct}%</span>
                            </div>
                            <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full transition-all"
                                style={{ width: `${progressPct}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Individual Installments Schedule Table */}
                        <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
                          <div className="px-3 py-2 bg-slate-100/80 dark:bg-slate-800 text-[11px] font-black text-slate-700 dark:text-slate-300 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-violet-600" />
                              <span>جدول الدفعات وتواريخ الاستحقاق ({totalCount} دفعات)</span>
                            </span>
                            <span className="text-[10px] font-normal text-slate-400">
                              يمكنك تعديل تاريخ أي دفعة أو تحصيلها مباشرة
                            </span>
                          </div>

                          <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {plan.installments.map(inst => {
                              const isPaid = inst.status === 'paid';
                              const isInstOverdue = !isPaid && inst.dueDate < todayStr;

                              return (
                                <div
                                  key={inst.id}
                                  className={`p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
                                    isPaid
                                      ? 'bg-emerald-50/30 dark:bg-emerald-950/10'
                                      : isInstOverdue
                                      ? 'bg-rose-50/60 dark:bg-rose-950/30'
                                      : ''
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5">
                                    <span
                                      className={`w-6 h-6 rounded-lg font-mono font-black text-[11px] flex items-center justify-center shrink-0 ${
                                        isPaid
                                          ? 'bg-emerald-600 text-white'
                                          : isInstOverdue
                                          ? 'bg-rose-600 text-white'
                                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                      }`}
                                    >
                                      #{inst.installmentNumber}
                                    </span>

                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono font-black text-slate-900 dark:text-white">
                                          {formatCurrency(inst.amount)}
                                        </span>
                                        <span
                                          className={`px-1.5 py-0.2 rounded text-[9px] font-black ${
                                            isPaid
                                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'
                                              : isInstOverdue
                                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200'
                                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                          }`}
                                        >
                                          {isPaid
                                            ? `مسدد (${inst.voucherNumber || 'سند'})`
                                            : isInstOverdue
                                            ? 'متأخر عن السداد'
                                            : 'بانتظار الاستحقاق'}
                                        </span>
                                      </div>
                                      {inst.notes && (
                                        <span className="text-[10px] text-slate-400 block">{inst.notes}</span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 self-end sm:self-center">
                                    {/* Editable Due Date */}
                                    <div className="flex items-center gap-1">
                                      <span className="text-[10px] text-slate-400">الاستحقاق:</span>
                                      <input
                                        type="date"
                                        disabled={isPaid}
                                        value={inst.dueDate}
                                        onChange={e =>
                                          handleUpdateInstallmentItemDueDate(plan.id, inst.id, e.target.value)
                                        }
                                        className={`text-[11px] font-mono font-bold py-1 px-2 rounded-lg border ${
                                          isPaid
                                            ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400'
                                            : isInstOverdue
                                            ? 'bg-white dark:bg-slate-900 border-rose-300 dark:border-rose-700 text-rose-600 dark:text-rose-400'
                                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                                        }`}
                                      />
                                    </div>

                                    {isPaid ? (
                                      <div className="flex items-center gap-1">
                                        <button
                                          type="button"
                                          onClick={() => handleSendSingleInstallmentWhatsApp(plan, inst, true)}
                                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] flex items-center gap-1 shadow-2xs cursor-pointer"
                                          title="إرسال سند قبض هذه الدفعة مباشرة على واتساب"
                                        >
                                          <Send className="w-3 h-3" />
                                          <span>سند القبض واتساب</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const matchedTx =
                                              (inst.voucherNumber &&
                                                debtTransactions.find(t => t.voucherNumber === inst.voucherNumber)) || {
                                                id: inst.id,
                                                voucherNumber: inst.voucherNumber || `RV-INST-${inst.installmentNumber}`,
                                                partyType: plan.partyType,
                                                partyId: plan.partyId,
                                                partyName: plan.partyName,
                                                type: 'payment' as const,
                                                amount: inst.paidAmount || inst.amount,
                                                previousBalance: plan.remainingAmount + (inst.paidAmount || inst.amount),
                                                newBalance: plan.remainingAmount,
                                                paymentMethod: inst.paymentMethod || 'cash',
                                                referenceInvoice: plan.invoiceNumber,
                                                notes: `دفعة القسط رقم #${inst.installmentNumber} من فاتورة ${plan.invoiceNumber} (استحقاق ${inst.dueDate})`,
                                                createdAt: inst.paidAt || new Date().toISOString(),
                                                recordedBy: 'الإدارة المالية'
                                              };
                                            setSelectedVoucherForPrint(matchedTx);
                                          }}
                                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 text-slate-700 dark:text-slate-300 cursor-pointer"
                                          title="معاينة وطباعة سند القبض"
                                        >
                                          <Printer className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-1">
                                        <button
                                          type="button"
                                          onClick={() => handleSendSingleInstallmentWhatsApp(plan, inst, false)}
                                          className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 cursor-pointer"
                                          title="إرسال إشعار استحقاق هذا القسط عبر واتساب"
                                        >
                                          <MessageSquareShare className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handlePaySingleInstallment(plan, inst)}
                                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-2xs cursor-pointer"
                                          title="تسجيل سداد هذه الدفعة وإصدار سند رسمي"
                                        >
                                          <Coins className="w-3 h-3" />
                                          <span>{plan.partyType === 'customer' ? 'تحصيل القسط' : 'سداد القسط'}</span>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
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
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  if (isCustomer) {
                                    const foundCust = customers.find(c => c.id === tx.partyId || c.name === tx.partyName);
                                    if (foundCust) {
                                      setSelectedPartyForStatement({ type: 'customer', party: foundCust });
                                    }
                                  } else {
                                    const foundSup = suppliers.find(s => s.id === tx.partyId || s.name === tx.partyName);
                                    if (foundSup) {
                                      setSelectedPartyForStatement({ type: 'supplier', party: foundSup });
                                    }
                                  }
                                }}
                                className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-bold text-[11px] rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                                title="فتح كشف الحساب التفصيلي لهذا الطرف"
                              >
                                <FileSpreadsheet className="w-3 h-3" />
                                <span>كشف الحساب</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSendVoucherWhatsApp(tx, true)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg transition-colors inline-flex items-center gap-1 shadow-2xs cursor-pointer"
                                title="إرسال السند مباشرة عبر واتساب"
                              >
                                <Send className="w-3 h-3" />
                                <span>إرسال واتساب</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedVoucherForPrint(tx)}
                                className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-slate-700 dark:text-slate-300 hover:text-amber-800 font-bold text-[11px] rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Printer className="w-3 h-3" />
                                <span>معاينة السند</span>
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

              {/* Direct WhatsApp Receipt Dispatch Option */}
              <div className="p-3 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-2">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="flex items-center gap-2 text-xs font-black text-emerald-900 dark:text-emerald-200">
                    <MessageSquareShare className="w-4 h-4 text-emerald-600" />
                    <span>إرسال سند القبض مباشرة عبر واتساب فور التأكيد</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={sendReceiptToWhatsAppOnPay}
                    onChange={e => setSendReceiptToWhatsAppOnPay(e.target.checked)}
                    className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                  />
                </label>
                {sendReceiptToWhatsAppOnPay && (
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 shrink-0">
                      رقم واتساب العميل:
                    </span>
                    <input
                      type="tel"
                      dir="ltr"
                      value={payWhatsAppPhoneInput}
                      onChange={e => setPayWhatsAppPhoneInput(e.target.value)}
                      placeholder="9639..."
                      className="flex-1 text-xs font-mono py-1.5 px-2.5 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-xl text-slate-900 dark:text-white"
                    />
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCustomerPayModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{sendReceiptToWhatsAppOnPay ? 'تأكيد القبض وإرسال السند واتساب' : 'تأكيد وقبض السند'}</span>
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
                  تاريخ الاستحقاق المحدد للسداد:
                </label>
                <input
                  type="date"
                  value={customerDebtDueDate}
                  onChange={e => setCustomerDebtDueDate(e.target.value)}
                  className="w-full text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  سيقوم نظام الإشعارات الذكي بتنبيهك تلقائياً عند تجاوز هذا التاريخ
                </span>
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

              {/* Direct WhatsApp Voucher Dispatch Option */}
              <div className="p-3 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-2">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="flex items-center gap-2 text-xs font-black text-emerald-900 dark:text-emerald-200">
                    <MessageSquareShare className="w-4 h-4 text-emerald-600" />
                    <span>إرسال سند الصرف مباشرة عبر واتساب للمورد فور التأكيد</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={sendReceiptToWhatsAppOnPay}
                    onChange={e => setSendReceiptToWhatsAppOnPay(e.target.checked)}
                    className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                  />
                </label>
                {sendReceiptToWhatsAppOnPay && (
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 shrink-0">
                      رقم واتساب المورد:
                    </span>
                    <input
                      type="tel"
                      dir="ltr"
                      value={payWhatsAppPhoneInput}
                      onChange={e => setPayWhatsAppPhoneInput(e.target.value)}
                      placeholder="9639..."
                      className="flex-1 text-xs font-mono py-1.5 px-2.5 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-xl text-slate-900 dark:text-white"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSupplierPayModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{sendReceiptToWhatsAppOnPay ? 'تأكيد الصرف وإرسال السند واتساب' : 'تأكيد وصرف السند'}</span>
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

      {/* MODAL 8: WhatsApp Universal Document & Reminder Preview & Dispatch */}
      {isWhatsAppReminderModalOpen && (whatsappDispatchMeta || targetCustomerForReminder) && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-6 py-4 bg-emerald-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-white/20 flex items-center justify-center">
                  <MessageSquareShare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm">
                    {whatsappDispatchMeta?.title || 'إرسال تذكير تسديد الدين عبر واتساب'}
                  </h3>
                  <p className="text-[11px] text-emerald-100 font-mono">
                    {whatsappDispatchMeta?.partyName || targetCustomerForReminder?.name}
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
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">المبلغ / الرصيد المستحق:</span>
                  <span className="text-base font-black font-mono text-emerald-700 dark:text-emerald-400">
                    {formatCurrency(whatsappDispatchMeta?.amountDue ?? targetCustomerForReminder?.currentDebt ?? 0)}
                  </span>
                </div>
                <div className="text-left">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">النظام الآلي:</span>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-lg">
                    {settings.whatsappApiKey ? 'WhatsApp Business Cloud API' : 'WhatsApp Direct (Click-to-Chat)'}
                  </span>
                </div>
              </div>

              {/* Recipient Phone Number Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  رقم هاتف واتساب المستلم:
                </label>
                <input
                  type="tel"
                  dir="ltr"
                  value={whatsappDispatchMeta?.phone ?? targetCustomerForReminder?.phone ?? ''}
                  onChange={e => {
                    const val = e.target.value;
                    if (whatsappDispatchMeta) {
                      setWhatsappDispatchMeta({ ...whatsappDispatchMeta, phone: val });
                    } else if (targetCustomerForReminder) {
                      setWhatsappDispatchMeta({
                        title: 'إرسال تذكير تسديد الدين عبر واتساب',
                        partyName: targetCustomerForReminder.name,
                        partyId: targetCustomerForReminder.id,
                        phone: val,
                        amountDue: targetCustomerForReminder.currentDebt || 0,
                        totalDebt: targetCustomerForReminder.currentDebt || 0,
                        type: 'manual_reminder'
                      });
                    }
                  }}
                  placeholder="9639..."
                  className="w-full text-xs font-mono py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Message Editable Box */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>نص الرسالة المرسلة عبر واتساب:</span>
                  <span className="text-[10px] text-slate-400">يمكنك تعديل نص الرسالة قبل الإرسال</span>
                </label>
                <textarea
                  rows={8}
                  value={reminderMessageDraft}
                  onChange={e => setReminderMessageDraft(e.target.value)}
                  className="w-full text-xs font-sans p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white leading-relaxed focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="اكتب الرسالة..."
                />
              </div>

              {/* Info Note */}
              <div className="flex items-start gap-2 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 p-3 rounded-xl">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  إذا كان مفتاح WhatsApp Business Cloud API معرفاً في الإعدادات، سيتم الإرسال سحابياً بدون فتح المتصفح. وإلا فسيتم توجيهك إلى واتساب مباشرة مع تجهيز الرسالة فوراً.
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
                      <span>إرسال مباشر عبر واتساب</span>
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
      {/* Smart Due Date & Credit Limit Quick Editor Modal */}
      {isDueDateModalOpen && selectedCustomerForDueDate && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-4">
            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-rose-950 dark:text-rose-200">
                    جدولة تاريخ السداد وسقف الائتمان
                  </h3>
                  <p className="text-[11px] text-rose-800/80 dark:text-rose-300">
                    العميل: {selectedCustomerForDueDate.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDueDateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDueDateAndLimit} className="p-5 space-y-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
                <span className="text-slate-500 font-bold">الرصيد المدين الحالي:</span>
                <span className="text-base font-black font-mono text-rose-600 dark:text-rose-400">
                  {formatCurrency(selectedCustomerForDueDate.currentDebt || 0)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  تاريخ السداد المحدد (موعد الاستحقاق):
                </label>
                <input
                  type="date"
                  value={editDueDateValue}
                  onChange={e => setEditDueDateValue(e.target.value)}
                  className="w-full text-sm font-mono font-bold py-2 px-3 bg-white dark:bg-slate-800 border-2 border-rose-500/50 rounded-xl text-slate-900 dark:text-white focus:outline-none"
                />
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  {[
                    { label: 'بعد 3 أيام', days: 3 },
                    { label: 'بعد أسبوع', days: 7 },
                    { label: 'بعد 15 يوم', days: 15 },
                    { label: 'بعد شهر', days: 30 }
                  ].map(preset => (
                    <button
                      key={preset.days}
                      type="button"
                      onClick={() => {
                        const d = new Date(Date.now() + preset.days * 86400000).toISOString().split('T')[0];
                        setEditDueDateValue(d);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-300 text-[10px] font-bold border border-slate-200 dark:border-slate-700 cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  سقف الائتمان المسموح للعميل ({settings.currency.symbol}):
                </label>
                <input
                  type="number"
                  min={0}
                  step={25000}
                  value={editCreditLimitValue}
                  onChange={e => setEditCreditLimitValue(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full text-sm font-mono font-bold py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsDueDateModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  حفظ موعد السداد والسقف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Purchase Invoice Details & Print Modal */}
      {selectedPurchaseInvoiceForView && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-4">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-sm sm:text-base">
                      تفاصيل فاتورة مشتريات وتوريد بضاعة
                    </h3>
                    <span className="px-2 py-0.5 rounded-md bg-white/20 font-mono text-xs font-bold">
                      {selectedPurchaseInvoiceForView.referenceInvoice || selectedPurchaseInvoiceForView.voucherNumber}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-100 mt-0.5">
                    المورد: {selectedPurchaseInvoiceForView.partyName} • رقم السند: {selectedPurchaseInvoiceForView.voucherNumber}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPurchaseInvoiceForView(null)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* Invoice Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">المورد / الشركة:</span>
                  <span className="font-black text-slate-900 dark:text-white">{selectedPurchaseInvoiceForView.partyName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">رقم الفاتورة المرجعي:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {selectedPurchaseInvoiceForView.referenceInvoice || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">تاريخ التوريد:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    {new Date(selectedPurchaseInvoiceForView.createdAt).toLocaleString(language === 'ar' ? 'ar-SY' : 'en-US')}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">المستلم / المسجل:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{selectedPurchaseInvoiceForView.recordedBy}</span>
                </div>
              </div>

              {/* Purchased Items Table */}
              <div>
                <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-emerald-600" />
                  <span>جدول الأصناف والبضائع الموردة في الفاتورة:</span>
                </h4>

                {selectedPurchaseInvoiceForView.purchaseItems && selectedPurchaseInvoiceForView.purchaseItems.length > 0 ? (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-xs text-start">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                        <tr>
                          <th className="p-2.5 text-start">#</th>
                          <th className="p-2.5 text-start">اسم الصنف</th>
                          <th className="p-2.5 text-center">الكمية</th>
                          <th className="p-2.5 text-end">سعر الشراء الإفرادي</th>
                          <th className="p-2.5 text-end">سعر الجملة</th>
                          <th className="p-2.5 text-end">سعر المفرق</th>
                          <th className="p-2.5 text-end">إجمالي التكلفة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {selectedPurchaseInvoiceForView.purchaseItems.map((it, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="p-2.5 font-mono text-slate-400">{idx + 1}</td>
                            <td className="p-2.5">
                              <div className="font-bold text-slate-900 dark:text-white">{it.productName}</div>
                              {it.barcode && <span className="text-[10px] font-mono text-slate-400">باركود: {it.barcode}</span>}
                            </td>
                            <td className="p-2.5 text-center font-mono font-black text-slate-900 dark:text-white">
                              {it.quantity} {it.unit || 'قطعة'}
                            </td>
                            <td className="p-2.5 text-end font-mono font-bold text-slate-700 dark:text-slate-300">
                              {formatCurrency(it.costPrice)}
                            </td>
                            <td className="p-2.5 text-end font-mono text-slate-500">
                              {it.wholesalePrice ? formatCurrency(it.wholesalePrice) : '—'}
                            </td>
                            <td className="p-2.5 text-end font-mono text-slate-500">
                              {it.retailPrice ? formatCurrency(it.retailPrice) : '—'}
                            </td>
                            <td className="p-2.5 text-end font-mono font-black text-emerald-700 dark:text-emerald-400">
                              {formatCurrency(it.totalCost)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
                    {selectedPurchaseInvoiceForView.notes || 'فاتورة شراء بضاعة مقيدة في حساب المورد'}
                  </div>
                )}
              </div>

              {/* Financial Summary */}
              {(() => {
                const amt = selectedPurchaseInvoiceForView.amount || 0;
                const paid = selectedPurchaseInvoiceForView.paidAmount !== undefined ? selectedPurchaseInvoiceForView.paidAmount : 0;
                const rem = selectedPurchaseInvoiceForView.remainingDebt !== undefined ? selectedPurchaseInvoiceForView.remainingDebt : Math.max(0, amt - paid);
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-900 text-white">
                    <div>
                      <span className="text-[11px] text-slate-400 block">إجمالي قيمة الفاتورة:</span>
                      <span className="text-lg font-black font-mono text-white">{formatCurrency(amt)}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block">المدفوع للمورد:</span>
                      <span className="text-lg font-black font-mono text-emerald-400">{formatCurrency(paid)}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block">الرصيد المتبقي ذمة:</span>
                      <span className="text-lg font-black font-mono text-amber-400">{formatCurrency(rem)}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800 flex-wrap">
                <button
                  type="button"
                  onClick={() => setSelectedPurchaseInvoiceForView(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  إغلاق
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const inv = selectedPurchaseInvoiceForView;
                    setSelectedPurchaseInvoiceForView(null);
                    handleSendVoucherWhatsApp(inv, true);
                  }}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>إرسال الفاتورة عبر واتساب</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const inv = selectedPurchaseInvoiceForView;
                    setSelectedPurchaseInvoiceForView(null);
                    setSelectedVoucherForPrint(inv);
                  }}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>معاينة وطباعة سند الفاتورة</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Smart Supplier Purchase & Inventory Restock Modal */}
      <SupplierPurchaseModal
        isOpen={isSmartPurchaseModalOpen}
        onClose={() => {
          setIsSmartPurchaseModalOpen(false);
          setSelectedSupplierForSmartPurchase(null);
        }}
        initialSupplier={selectedSupplierForSmartPurchase}
      />

      {/* Invoice Installment Splitter & Multi-Payment Scheduler Modal */}
      <InvoiceInstallmentSplitterModal
        isOpen={isInstallmentSplitterOpen}
        onClose={() => setIsInstallmentSplitterOpen(false)}
        onSavePlan={handleSaveInstallmentPlan}
        initialPartyType={installmentInitialConfig.partyType}
        initialCustomer={installmentInitialConfig.customer}
        initialSupplier={installmentInitialConfig.supplier}
        initialInvoiceNumber={installmentInitialConfig.invoiceNumber}
        initialTotalAmount={installmentInitialConfig.totalAmount}
        initialDownPayment={installmentInitialConfig.downPayment}
      />
    </div>
  );
};
