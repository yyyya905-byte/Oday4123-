import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Customer,
  Supplier,
  Sale,
  DebtTransaction,
  InvoiceInstallmentPlan,
  InstallmentScheduleItem,
  DebtPartyType
} from '../../types';
import {
  Calendar,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Coins,
  Printer,
  X,
  Users,
  Building2,
  FileText,
  Sparkles,
  RefreshCw,
  MessageSquareShare,
  Calculator,
  Layers
} from 'lucide-react';

export const INSTALLMENT_STORAGE_KEY = 'kian_pos_installment_plans_v1';

export const getInitialInstallmentPlans = (): InvoiceInstallmentPlan[] => {
  const now = Date.now();
  const dayMs = 86400000;
  return [
    {
      id: 'plan_seed_1',
      partyType: 'customer',
      partyId: 'cus_wholesale_1',
      partyName: 'مؤسسة النور للتجارة والتوزيع',
      partyPhone: '+963 933 221 100',
      invoiceNumber: 'WHS-2026-001024',
      totalInvoiceAmount: 750000,
      downPaymentAmount: 300000,
      financedAmount: 450000,
      remainingAmount: 450000,
      installmentsCount: 3,
      frequency: 'biweekly',
      status: 'overdue',
      notes: 'اتفاقية تقسيط فاتورة مبيعات الجملة على 3 دفعات نصف شهرية بعد سداد دفعة أولى 300,000',
      createdAt: new Date(now - 20 * dayMs).toISOString(),
      createdBy: 'عدي الزعبي (مالك النظام)',
      installments: [
        {
          id: 'inst_seed_1_1',
          installmentNumber: 1,
          amount: 150000,
          paidAmount: 0,
          dueDate: new Date(now - 5 * dayMs).toISOString().split('T')[0],
          status: 'overdue',
          notes: 'الدفعة الأولى بعد المقدم'
        },
        {
          id: 'inst_seed_1_2',
          installmentNumber: 2,
          amount: 150000,
          paidAmount: 0,
          dueDate: new Date(now + 10 * dayMs).toISOString().split('T')[0],
          status: 'pending',
          notes: 'الدفعة الثانية'
        },
        {
          id: 'inst_seed_1_3',
          installmentNumber: 3,
          amount: 150000,
          paidAmount: 0,
          dueDate: new Date(now + 25 * dayMs).toISOString().split('T')[0],
          status: 'pending',
          notes: 'الدفعة الثالثة والأخيرة'
        }
      ]
    },
    {
      id: 'plan_seed_2',
      partyType: 'customer',
      partyId: 'cus_2',
      partyName: 'أحمد الخطيب',
      partyPhone: '+963 944 556 677',
      invoiceNumber: 'INV-2026-00108',
      totalInvoiceAmount: 250000,
      downPaymentAmount: 65000,
      financedAmount: 185000,
      remainingAmount: 185000,
      installmentsCount: 2,
      frequency: 'weekly',
      status: 'overdue',
      notes: 'تقسيم فاتورة مبيعات آجلة على دفعتين أسبوعيتين',
      createdAt: new Date(now - 10 * dayMs).toISOString(),
      createdBy: 'عدي الزعبي',
      installments: [
        {
          id: 'inst_seed_2_1',
          installmentNumber: 1,
          amount: 95000,
          paidAmount: 0,
          dueDate: new Date(now - 4 * dayMs).toISOString().split('T')[0],
          status: 'overdue',
          notes: 'القسط الأول'
        },
        {
          id: 'inst_seed_2_2',
          installmentNumber: 2,
          amount: 90000,
          paidAmount: 0,
          dueDate: new Date(now + 3 * dayMs).toISOString().split('T')[0],
          status: 'pending',
          notes: 'القسط الثاني'
        }
      ]
    },
    {
      id: 'plan_seed_3',
      partyType: 'supplier',
      partyId: 'sup_1',
      partyName: 'شركة الشام لتوريد البن والمشروبات الساخنة',
      partyPhone: '+963 911 223 344',
      invoiceNumber: 'PUR-2026-8841',
      totalInvoiceAmount: 1350000,
      downPaymentAmount: 500000,
      financedAmount: 850000,
      remainingAmount: 850000,
      installmentsCount: 2,
      frequency: 'monthly',
      status: 'active',
      notes: 'جدولة سداد فاتورة توريد البن الشهرية على دفعتين',
      createdAt: new Date(now - 6 * dayMs).toISOString(),
      createdBy: 'عدي الزعبي (مالك النظام)',
      installments: [
        {
          id: 'inst_seed_3_1',
          installmentNumber: 1,
          amount: 425000,
          paidAmount: 0,
          dueDate: new Date(now + 7 * dayMs).toISOString().split('T')[0],
          status: 'pending',
          notes: 'دفعة أولى للمورد'
        },
        {
          id: 'inst_seed_3_2',
          installmentNumber: 2,
          amount: 425000,
          paidAmount: 0,
          dueDate: new Date(now + 37 * dayMs).toISOString().split('T')[0],
          status: 'pending',
          notes: 'دفعة تصفية الفاتورة'
        }
      ]
    }
  ];
};

interface InvoiceInstallmentSplitterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavePlan: (plan: InvoiceInstallmentPlan, recordNewChargeIfNeeded: boolean, recordDownPaymentNow: boolean) => void;
  initialPartyType?: DebtPartyType;
  initialCustomer?: Customer | null;
  initialSupplier?: Supplier | null;
  initialInvoiceNumber?: string;
  initialTotalAmount?: number;
  initialDownPayment?: number;
}

export const InvoiceInstallmentSplitterModal: React.FC<InvoiceInstallmentSplitterModalProps> = ({
  isOpen,
  onClose,
  onSavePlan,
  initialPartyType = 'customer',
  initialCustomer = null,
  initialSupplier = null,
  initialInvoiceNumber = '',
  initialTotalAmount = 0,
  initialDownPayment = 0
}) => {
  const {
    customers,
    suppliers,
    sales,
    debtTransactions,
    formatCurrency,
    settings,
    currentUser,
    notify
  } = useApp();

  const [partyType, setPartyType] = useState<DebtPartyType>(initialPartyType);
  const [selectedPartyId, setSelectedPartyId] = useState<string>('');
  const [invoiceSourceMode, setInvoiceSourceMode] = useState<'existing' | 'custom'>('existing');
  const [selectedExistingInvoiceNumber, setSelectedExistingInvoiceNumber] = useState<string>('');
  const [customInvoiceNumber, setCustomInvoiceNumber] = useState<string>('');
  const [totalInvoiceAmount, setTotalInvoiceAmount] = useState<number | ''>('');
  const [downPaymentAmount, setDownPaymentAmount] = useState<number | ''>('');
  const [recordNewCharge, setRecordNewCharge] = useState<boolean>(false);
  const [recordDownPaymentNow, setRecordDownPaymentNow] = useState<boolean>(false);

  const [installmentsCount, setInstallmentsCount] = useState<number>(3);
  const [frequency, setFrequency] = useState<'weekly' | 'biweekly' | 'monthly' | 'custom'>('monthly');
  const [firstDueDate, setFirstDueDate] = useState<string>(() => {
    return new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
  });
  const [planNotes, setPlanNotes] = useState<string>('');

  const [draftInstallments, setDraftInstallments] = useState<
    { id: string; installmentNumber: number; amount: number; dueDate: string; notes: string }[]
  >([]);

  // Initialize modal fields when opened
  useEffect(() => {
    if (!isOpen) return;

    if (initialSupplier) {
      setPartyType('supplier');
      setSelectedPartyId(initialSupplier.id);
    } else if (initialCustomer) {
      setPartyType('customer');
      setSelectedPartyId(initialCustomer.id);
    } else {
      setPartyType(initialPartyType);
      if (initialPartyType === 'customer' && customers.length > 0) {
        const withDebt = customers.find(c => (c.currentDebt || 0) > 0) || customers[0];
        setSelectedPartyId(withDebt.id);
      } else if (initialPartyType === 'supplier' && suppliers.length > 0) {
        const withDebt = suppliers.find(s => (s.currentDebt || 0) > 0) || suppliers[0];
        setSelectedPartyId(withDebt.id);
      }
    }

    if (initialInvoiceNumber) {
      setInvoiceSourceMode('custom');
      setCustomInvoiceNumber(initialInvoiceNumber);
    } else {
      setInvoiceSourceMode('existing');
      setCustomInvoiceNumber(`INV-SPL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
    }

    if (initialTotalAmount > 0) {
      setTotalInvoiceAmount(initialTotalAmount);
    } else if (initialCustomer && (initialCustomer.currentDebt || 0) > 0) {
      setTotalInvoiceAmount(initialCustomer.currentDebt || 0);
    } else if (initialSupplier && (initialSupplier.currentDebt || 0) > 0) {
      setTotalInvoiceAmount(initialSupplier.currentDebt || 0);
    } else {
      setTotalInvoiceAmount(300000);
    }

    setDownPaymentAmount(initialDownPayment > 0 ? initialDownPayment : '');
    setRecordNewCharge(false);
    setRecordDownPaymentNow(false);
    setInstallmentsCount(3);
    setFrequency('monthly');
    setFirstDueDate(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
    setPlanNotes('');
  }, [
    isOpen,
    initialPartyType,
    initialCustomer,
    initialSupplier,
    initialInvoiceNumber,
    initialTotalAmount,
    initialDownPayment,
    customers,
    suppliers
  ]);

  // Available existing invoices for the selected party
  const partyExistingInvoices = useMemo(() => {
    const list: { id: string; invoiceNumber: string; totalAmount: number; remainingAmount: number; date: string; label: string }[] = [];

    if (partyType === 'customer') {
      const cust = customers.find(c => c.id === selectedPartyId);
      const custSales = sales.filter(
        s => s.customerId === selectedPartyId || (cust && s.customerName === cust.name)
      );
      custSales.forEach(s => {
        const paid = s.paidAmount !== undefined ? s.paidAmount : s.paymentMethod === 'credit' ? 0 : s.total;
        const rem = Math.max(0, s.total - paid);
        list.push({
          id: s.id,
          invoiceNumber: s.invoiceNumber,
          totalAmount: s.total,
          remainingAmount: rem > 0 ? rem : s.total,
          date: s.createdAt,
          label: `فاتورة مبيعات #${s.invoiceNumber} — الإجمالي: ${formatCurrency(s.total)}${rem > 0 ? ` (المتبقي: ${formatCurrency(rem)})` : ''}`
        });
      });

      const custCharges = debtTransactions.filter(
        tx => tx.partyType === 'customer' && tx.partyId === selectedPartyId && tx.type === 'charge'
      );
      custCharges.forEach(tx => {
        const invNum = tx.referenceInvoice || tx.voucherNumber;
        if (!list.some(l => l.invoiceNumber === invNum)) {
          list.push({
            id: tx.id,
            invoiceNumber: invNum,
            totalAmount: tx.amount,
            remainingAmount: tx.remainingDebt ?? tx.amount,
            date: tx.createdAt,
            label: `قيد دين / فاتورة #${invNum} — المبلغ: ${formatCurrency(tx.amount)}`
          });
        }
      });

      if (cust && (cust.currentDebt || 0) > 0) {
        list.unshift({
          id: `bal_${cust.id}`,
          invoiceNumber: `BAL-${cust.customerCode || cust.id.slice(-4)}`,
          totalAmount: cust.currentDebt || 0,
          remainingAmount: cust.currentDebt || 0,
          date: new Date().toISOString(),
          label: `الرصيد المدين الحالي للعميل بالكامل (${formatCurrency(cust.currentDebt || 0)})`
        });
      }
    } else {
      const sup = suppliers.find(s => s.id === selectedPartyId);
      const supCharges = debtTransactions.filter(
        tx => tx.partyType === 'supplier' && tx.partyId === selectedPartyId && tx.type === 'charge'
      );
      supCharges.forEach(tx => {
        const invNum = tx.referenceInvoice || tx.voucherNumber;
        const rem = tx.remainingDebt !== undefined ? tx.remainingDebt : Math.max(0, tx.amount - (tx.paidAmount || 0));
        list.push({
          id: tx.id,
          invoiceNumber: invNum,
          totalAmount: tx.amount,
          remainingAmount: rem > 0 ? rem : tx.amount,
          date: tx.createdAt,
          label: `فاتورة مشتريات #${invNum} — الإجمالي: ${formatCurrency(tx.amount)}${rem > 0 ? ` (المتبقي: ${formatCurrency(rem)})` : ''}`
        });
      });

      if (sup && (sup.currentDebt || 0) > 0) {
        list.unshift({
          id: `bal_${sup.id}`,
          invoiceNumber: `SUP-BAL-${sup.code}`,
          totalAmount: sup.currentDebt || 0,
          remainingAmount: sup.currentDebt || 0,
          date: new Date().toISOString(),
          label: `إجمالي الذمة المستحقة للمورد (${formatCurrency(sup.currentDebt || 0)})`
        });
      }
    }

    return list;
  }, [partyType, selectedPartyId, customers, suppliers, sales, debtTransactions, formatCurrency]);

  // Select first available invoice when party changes
  useEffect(() => {
    if (!isOpen) return;
    if (invoiceSourceMode === 'existing' && partyExistingInvoices.length > 0 && !initialInvoiceNumber) {
      const first = partyExistingInvoices[0];
      setSelectedExistingInvoiceNumber(first.invoiceNumber);
      setTotalInvoiceAmount(first.remainingAmount || first.totalAmount);
    }
  }, [partyExistingInvoices, invoiceSourceMode, isOpen, initialInvoiceNumber]);

  const financedAmount = useMemo(() => {
    const total = Math.max(0, Number(totalInvoiceAmount) || 0);
    const down = Math.max(0, Number(downPaymentAmount) || 0);
    return Math.max(0, total - down);
  }, [totalInvoiceAmount, downPaymentAmount]);

  // Helper to generate installment rows based on financedAmount, installmentsCount, frequency, firstDueDate
  const generateScheduleRows = (
    targetAmount: number,
    count: number,
    freq: 'weekly' | 'biweekly' | 'monthly' | 'custom',
    startDateStr: string
  ) => {
    const safeCount = Math.max(1, Math.min(60, count));
    const basePart = Math.floor(targetAmount / safeCount);
    const remainder = targetAmount - basePart * safeCount;
    const baseDate = startDateStr ? new Date(startDateStr) : new Date(Date.now() + 7 * 86400000);

    const rows = Array.from({ length: safeCount }, (_, idx) => {
      const due = new Date(baseDate.getTime());
      if (freq === 'weekly') {
        due.setDate(due.getDate() + idx * 7);
      } else if (freq === 'biweekly') {
        due.setDate(due.getDate() + idx * 15);
      } else {
        due.setMonth(due.getMonth() + idx);
      }
      const dueIso = !isNaN(due.getTime())
        ? due.toISOString().split('T')[0]
        : new Date(Date.now() + (idx + 1) * 7 * 86400000).toISOString().split('T')[0];

      // Add any rounding remainder to the first installment
      const rowAmount = idx === 0 ? basePart + remainder : basePart;

      return {
        id: `draft_inst_${Date.now()}_${idx}`,
        installmentNumber: idx + 1,
        amount: rowAmount,
        dueDate: dueIso,
        notes: `الدفعة رقم ${idx + 1} من ${safeCount}`
      };
    });

    setDraftInstallments(rows);
  };

  // Auto-regenerate schedule when parameters change (unless in manual custom edit)
  useEffect(() => {
    if (!isOpen) return;
    generateScheduleRows(financedAmount, installmentsCount, frequency, firstDueDate);
  }, [financedAmount, installmentsCount, frequency, firstDueDate, isOpen]);

  // Sum of draft installments
  const draftTotalSum = useMemo(() => {
    return draftInstallments.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);
  }, [draftInstallments]);

  const differenceFromTarget = financedAmount - draftTotalSum;

  // Update a specific installment row & optionally auto-balance remaining rows
  const handleUpdateInstallmentAmount = (index: number, newAmount: number) => {
    const clamped = Math.max(0, newAmount);
    setDraftInstallments(prev => {
      const next = [...prev];
      next[index] = { ...next[index], amount: clamped };

      // If there are subsequent installments after `index`, auto-distribute the remaining balance across them!
      const subsequentCount = next.length - 1 - index;
      if (subsequentCount > 0) {
        const sumUpToIndex = next.slice(0, index + 1).reduce((s, r) => s + (Number(r.amount) || 0), 0);
        const remainingToDistribute = Math.max(0, financedAmount - sumUpToIndex);
        const perSubsequent = Math.floor(remainingToDistribute / subsequentCount);
        const rem = remainingToDistribute - perSubsequent * subsequentCount;

        for (let j = index + 1; j < next.length; j++) {
          next[j] = {
            ...next[j],
            amount: j === index + 1 ? perSubsequent + rem : perSubsequent
          };
        }
      }
      return next;
    });
  };

  const handleUpdateInstallmentDate = (index: number, newDate: string) => {
    setDraftInstallments(prev =>
      prev.map((item, idx) => (idx === index ? { ...item, dueDate: newDate } : item))
    );
  };

  const handleUpdateInstallmentNotes = (index: number, newNotes: string) => {
    setDraftInstallments(prev =>
      prev.map((item, idx) => (idx === index ? { ...item, notes: newNotes } : item))
    );
  };

  const handleAddCustomInstallmentRow = () => {
    const nextNum = draftInstallments.length + 1;
    const lastDateStr = draftInstallments[draftInstallments.length - 1]?.dueDate || firstDueDate;
    const nextDate = new Date(lastDateStr);
    nextDate.setDate(nextDate.getDate() + (frequency === 'weekly' ? 7 : frequency === 'biweekly' ? 15 : 30));

    const updatedCount = nextNum;
    setInstallmentsCount(updatedCount);
    setDraftInstallments(prev => [
      ...prev,
      {
        id: `draft_inst_${Date.now()}_${nextNum}`,
        installmentNumber: nextNum,
        amount: Math.max(0, differenceFromTarget),
        dueDate: !isNaN(nextDate.getTime()) ? nextDate.toISOString().split('T')[0] : firstDueDate,
        notes: `الدفعة رقم ${nextNum}`
      }
    ]);
  };

  const handleRemoveInstallmentRow = (index: number) => {
    if (draftInstallments.length <= 1) {
      notify('تنبيه', 'يجب أن تحتوي خطة التقسيط على دفعة واحدة على الأقل', 'warning');
      return;
    }
    const filtered = draftInstallments
      .filter((_, idx) => idx !== index)
      .map((item, idx) => ({
        ...item,
        installmentNumber: idx + 1
      }));
    setDraftInstallments(filtered);
    setInstallmentsCount(filtered.length);
  };

  const handleRebalanceInstallmentsEqually = () => {
    generateScheduleRows(financedAmount, draftInstallments.length, frequency, firstDueDate);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPartyId) {
      notify('تنبيه', 'يرجى اختيار العميل أو المورد أولاً', 'warning');
      return;
    }
    if (financedAmount <= 0) {
      notify('تنبيه', 'يرجى إدخال مبلغ فاتورة صالح للتقسيم', 'warning');
      return;
    }
    if (Math.abs(differenceFromTarget) > 1) {
      notify(
        'عدم تطابق مجموع الأقساط',
        `مجموع الدفعات (${formatCurrency(draftTotalSum)}) لا يطابق المبلغ المطلوب تقسيمه (${formatCurrency(financedAmount)}). اضغط على «توزيع بالتساوي» للموازنة.`,
        'warning'
      );
      return;
    }

    const resolvedInvoiceNumber =
      invoiceSourceMode === 'existing' && selectedExistingInvoiceNumber
        ? selectedExistingInvoiceNumber
        : customInvoiceNumber.trim() || `INV-SPL-${Date.now().toString().slice(-5)}`;

    const partyObj =
      partyType === 'customer'
        ? customers.find(c => c.id === selectedPartyId)
        : suppliers.find(s => s.id === selectedPartyId);

    if (!partyObj) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const finalInstallments: InstallmentScheduleItem[] = draftInstallments.map((d, idx) => ({
      id: `inst_${Date.now()}_${idx + 1}`,
      installmentNumber: idx + 1,
      amount: Math.round(Number(d.amount) || 0),
      paidAmount: 0,
      dueDate: d.dueDate || todayStr,
      status: d.dueDate < todayStr ? 'overdue' : 'pending',
      notes: d.notes
    }));

    const hasOverdue = finalInstallments.some(i => i.status === 'overdue');

    const newPlan: InvoiceInstallmentPlan = {
      id: `plan_${Date.now()}`,
      partyType,
      partyId: partyObj.id,
      partyName: partyObj.name,
      partyPhone: partyObj.phone,
      invoiceNumber: resolvedInvoiceNumber,
      totalInvoiceAmount: Number(totalInvoiceAmount) || financedAmount,
      downPaymentAmount: Number(downPaymentAmount) || 0,
      financedAmount,
      remainingAmount: financedAmount,
      installmentsCount: finalInstallments.length,
      frequency,
      installments: finalInstallments,
      status: hasOverdue ? 'overdue' : 'active',
      notes: planNotes.trim() || `خطة تقسيط فاتورة ${resolvedInvoiceNumber} على ${finalInstallments.length} دفعات`,
      createdAt: new Date().toISOString(),
      createdBy: currentUser.name
    };

    onSavePlan(newPlan, recordNewCharge, recordDownPaymentNow);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center shadow-inner">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  تقسيم الفاتورة إلى دفعات متعددة (جدولة الأقساط)
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950">
                  جدولة ذكية للاستحقاق
                </span>
              </div>
              <p className="text-xs text-indigo-100 mt-0.5">
                قسّم أي فاتورة مبيعات أو مشتريات إلى دفعات مجدولة بتواريخ استحقاق مخصصة لكل قسط مع تنبيه تلقائي عند حلول الموعد
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Step 1: Party & Invoice Selection */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-700/80 pb-3">
              <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>1. تحديد الطرف المالي والفاتورة المراد تقسيطها</span>
              </span>

              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setPartyType('customer');
                    if (customers.length > 0) setSelectedPartyId(customers[0].id);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    partyType === 'customer'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>فاتورة زبون (أقساط مبيعات)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPartyType('supplier');
                    if (suppliers.length > 0) setSelectedPartyId(suppliers[0].id);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    partyType === 'supplier'
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>فاتورة مورد (أقساط مشتريات)</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Select Customer or Supplier */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {partyType === 'customer' ? 'اختر الزبون / التاجر:' : 'اختر الشركة / المورد:'}
                </label>
                <select
                  value={selectedPartyId}
                  onChange={e => setSelectedPartyId(e.target.value)}
                  className="w-full text-xs font-bold py-2.5 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                >
                  {partyType === 'customer'
                    ? customers.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} — (الرصيد الحالي: {formatCurrency(c.currentDebt || 0)})
                        </option>
                      ))
                    : suppliers.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name} — (الرصيد المستحق: {formatCurrency(s.currentDebt || 0)})
                        </option>
                      ))}
                </select>
              </div>

              {/* Select Existing Invoice or Custom */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    الفاتورة المرجعية:
                  </label>
                  <div className="flex items-center gap-2 text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setInvoiceSourceMode('existing')}
                      className={`underline cursor-pointer ${
                        invoiceSourceMode === 'existing' ? 'text-indigo-600 dark:text-indigo-400 font-black' : 'text-slate-400'
                      }`}
                    >
                      من الفواتير المسجلة ({partyExistingInvoices.length})
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setInvoiceSourceMode('custom')}
                      className={`underline cursor-pointer ${
                        invoiceSourceMode === 'custom' ? 'text-indigo-600 dark:text-indigo-400 font-black' : 'text-slate-400'
                      }`}
                    >
                      رقم فاتورة جديد / مخصص
                    </button>
                  </div>
                </div>

                {invoiceSourceMode === 'existing' && partyExistingInvoices.length > 0 ? (
                  <select
                    value={selectedExistingInvoiceNumber}
                    onChange={e => {
                      const val = e.target.value;
                      setSelectedExistingInvoiceNumber(val);
                      const found = partyExistingInvoices.find(inv => inv.invoiceNumber === val);
                      if (found) {
                        setTotalInvoiceAmount(found.remainingAmount || found.totalAmount);
                        setDownPaymentAmount('');
                      }
                    }}
                    className="w-full text-xs font-bold py-2.5 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  >
                    {partyExistingInvoices.map(inv => (
                      <option key={inv.id} value={inv.invoiceNumber}>
                        {inv.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={customInvoiceNumber}
                    onChange={e => setCustomInvoiceNumber(e.target.value)}
                    placeholder="مثال: INV-2026-501"
                    className="w-full text-xs font-mono font-bold py-2.5 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                )}
              </div>
            </div>

            {/* Financial Amounts Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                  إجمالي مبلغ الفاتورة ({settings.currency.symbol}):
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={totalInvoiceAmount}
                  onChange={e => setTotalInvoiceAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full text-base font-black font-mono py-1.5 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                  الدفعة الأولى المقدمة نقداً (اختياري):
                </label>
                <input
                  type="number"
                  min={0}
                  max={Number(totalInvoiceAmount) || 0}
                  value={downPaymentAmount}
                  onChange={e => setDownPaymentAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0"
                  className="w-full text-base font-black font-mono py-1.5 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-emerald-600 dark:text-emerald-400"
                />
              </div>

              <div className="bg-indigo-50/80 dark:bg-indigo-950/40 p-3 rounded-xl border border-indigo-200 dark:border-indigo-800 flex flex-col justify-center">
                <span className="text-[11px] font-bold text-indigo-800 dark:text-indigo-300">
                  المبلغ الصافي المجدول للأقساط:
                </span>
                <span className="text-xl font-black font-mono text-indigo-600 dark:text-indigo-400 mt-0.5">
                  {formatCurrency(financedAmount)}
                </span>
              </div>
            </div>

            {/* Optional Accounting Sync Checkboxes */}
            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs">
              {invoiceSourceMode === 'custom' && (
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={recordNewCharge}
                    onChange={e => setRecordNewCharge(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>إضافة قيمة هذه الفاتورة كقيد دين جديد على رصيد الحساب</span>
                </label>
              )}

              {(Number(downPaymentAmount) || 0) > 0 && (
                <label className="flex items-center gap-2 cursor-pointer font-bold text-emerald-700 dark:text-emerald-400">
                  <input
                    type="checkbox"
                    checked={recordDownPaymentNow}
                    onChange={e => setRecordDownPaymentNow(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>تسجيل الدفعة المقدمة ({formatCurrency(Number(downPaymentAmount) || 0)}) كسند مالي فوري</span>
                </label>
              )}
            </div>
          </div>

          {/* Step 2: Installment Count & Schedule Frequency */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-700/80 pb-3">
              <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span>2. إعدادات تقسيم الدفعات وجدولة تواريخ الاستحقاق</span>
              </span>

              <button
                type="button"
                onClick={handleRebalanceInstallmentsEqually}
                className="px-3 py-1.5 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>إعادة توزيع المبلغ بالتساوي على الدفعات</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Number of Installments */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  عدد الدفعات (الأقساط):
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[2, 3, 4, 6, 12].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setInstallmentsCount(num)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black font-mono transition-all cursor-pointer ${
                        installmentsCount === num
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={installmentsCount}
                    onChange={e => setInstallmentsCount(Math.max(1, Math.min(60, Number(e.target.value) || 1)))}
                    className="w-16 text-center text-xs font-mono font-black py-1.5 px-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                    title="عدد دفعات مخصص"
                  />
                </div>
              </div>

              {/* Frequency */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  دورية استحقاق الدفعات:
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'weekly', label: 'أسبوعي (7 أيام)' },
                    { id: 'biweekly', label: 'نصف شهري (15 يوم)' },
                    { id: 'monthly', label: 'شهري (كل شهر)' },
                    { id: 'custom', label: 'تواريخ مخصصة' }
                  ].map(freq => (
                    <button
                      key={freq.id}
                      type="button"
                      onClick={() => setFrequency(freq.id as any)}
                      className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                        frequency === freq.id
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {freq.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* First Installment Due Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  تاريخ استحقاق الدفعة الأولى:
                </label>
                <input
                  type="date"
                  value={firstDueDate}
                  onChange={e => setFirstDueDate(e.target.value)}
                  className="w-full text-xs font-mono font-bold py-2 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Interactive Schedule Table */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                  جدول الأقساط وتواريخ الاستحقاق (يمكنك تعديل مبلغ أو تاريخ أي دفعة يدوياً):
                </span>
                <button
                  type="button"
                  onClick={handleAddCustomInstallmentRow}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة دفعة جديدة</span>
                </button>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                <table className="w-full text-xs text-start">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-2.5 text-start w-20">رقم القسط</th>
                      <th className="p-2.5 text-start">مبلغ الدفعة ({settings.currency.symbol})</th>
                      <th className="p-2.5 text-start">تاريخ الاستحقاق المحدد</th>
                      <th className="p-2.5 text-start">بيان / ملاحظة الدفعة</th>
                      <th className="p-2.5 text-center w-14">حذف</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {draftInstallments.map((inst, index) => (
                      <tr key={inst.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="p-2.5 font-mono font-black text-indigo-600 dark:text-indigo-400">
                          الدفعة #{inst.installmentNumber}
                        </td>
                        <td className="p-2.5">
                          <input
                            type="number"
                            min={0}
                            value={inst.amount}
                            onChange={e => handleUpdateInstallmentAmount(index, Number(e.target.value) || 0)}
                            className="w-36 text-xs font-mono font-black py-1.5 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                          />
                        </td>
                        <td className="p-2.5">
                          <input
                            type="date"
                            value={inst.dueDate}
                            onChange={e => handleUpdateInstallmentDate(index, e.target.value)}
                            className="text-xs font-mono font-bold py-1.5 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                          />
                        </td>
                        <td className="p-2.5">
                          <input
                            type="text"
                            value={inst.notes}
                            onChange={e => handleUpdateInstallmentNotes(index, e.target.value)}
                            placeholder="بيان القسط..."
                            className="w-full text-xs py-1.5 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none"
                          />
                        </td>
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveInstallmentRow(index)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                            title="حذف هذه الدفعة"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Balance Verification Banner */}
              <div
                className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-bold ${
                  Math.abs(differenceFromTarget) <= 1
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                    : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  {Math.abs(differenceFromTarget) <= 1 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  )}
                  <span>
                    مجموع الدفعات المجدولة: <strong className="font-mono">{formatCurrency(draftTotalSum)}</strong> من أصل{' '}
                    <strong className="font-mono">{formatCurrency(financedAmount)}</strong>
                  </span>
                </div>

                {Math.abs(differenceFromTarget) > 1 && (
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-rose-600 dark:text-rose-400">
                      الفرق: {formatCurrency(Math.abs(differenceFromTarget))}
                    </span>
                    <button
                      type="button"
                      onClick={handleRebalanceInstallmentsEqually}
                      className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 text-[11px] font-black cursor-pointer"
                    >
                      موازنة تلقائية
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* General Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ملاحظات وشروط اتفاقية التقسيط (اختياري):
              </label>
              <input
                type="text"
                value={planNotes}
                onChange={e => setPlanNotes(e.target.value)}
                placeholder="مثال: يتم سداد كل دفعة في موعدها المحدد مع إشعار واتساب قبل الاستحقاق..."
                className="w-full text-xs py-2 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Footer Submit */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-600/25 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>اعتماد وحفظ جدول الأقساط ({draftInstallments.length} دفعات)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
