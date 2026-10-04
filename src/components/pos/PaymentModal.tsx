import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { PaymentMethod, Sale, Customer } from '../../types';
import confetti from 'canvas-confetti';
import {
  Banknote,
  CreditCard,
  Send,
  Star,
  CheckCircle2,
  X,
  Calculator,
  ArrowRight,
  FileText,
  UserCheck,
  AlertCircle,
  UserPlus,
  Coins,
  Wallet,
  Plus,
  Split
} from 'lucide-react';
import { PrintableReceiptModal } from './PrintableReceiptModal';
import { DraggableModalWrapper } from '../common/DraggableModalWrapper';
import { isLebaneseCurrency, LEBANESE_QUICK_BANKNOTES, LEBANESE_INCREMENT_BUTTONS } from '../../utils/currencyUtils';
import { voiceAnnouncer } from '../../services/voiceAnnouncer';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  initialPaymentMethod?: PaymentMethod;
  initialPaidAmount?: number | null;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  totalAmount,
  initialPaymentMethod,
  initialPaidAmount
}) => {
  const {
    processSale,
    formatCurrency,
    t,
    settings,
    customers,
    selectedCustomer,
    setSelectedCustomer,
    addCustomer,
    pointsToRedeem,
    language,
    notify
  } = useApp();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paidAmount, setPaidAmount] = useState<number>(totalAmount);
  const [notes, setNotes] = useState<string>('');
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState<boolean>(false);

  // Quick Customer Selection for Credit Sales
  const [quickCustomerSearch, setQuickCustomerSearch] = useState<string>('');
  const [isQuickAddCustomerOpen, setIsQuickAddCustomerOpen] = useState<boolean>(false);
  const [newCustomerName, setNewCustomerName] = useState<string>('');
  const [newCustomerPhone, setNewCustomerPhone] = useState<string>('');

  useEffect(() => {
    if (isOpen && initialPaymentMethod) {
      setPaymentMethod(initialPaymentMethod);
    }
  }, [isOpen, initialPaymentMethod]);

  useEffect(() => {
    if (isOpen && typeof initialPaidAmount === 'number' && initialPaidAmount > 0) {
      setPaidAmount(initialPaidAmount);
      return;
    }
    if (paymentMethod === 'credit') {
      setPaidAmount(0); // Default down payment for credit can be 0 or partial
    } else if (paymentMethod === 'split') {
      setPaidAmount(Math.round(totalAmount / 2)); // Default 50% cash / 50% credit
    } else {
      setPaidAmount(totalAmount);
    }
  }, [totalAmount, paymentMethod, isOpen, initialPaidAmount]);

  if (!isOpen && !isReceiptOpen) return null;

  const isCredit = paymentMethod === 'credit' || paymentMethod === 'split';
  const changeDue = !isCredit ? Math.max(0, paidAmount - totalAmount) : 0;
  const remainingDebt = isCredit ? Math.max(0, totalAmount - (paidAmount || 0)) : 0;
  const cashRatioPercent =
    totalAmount > 0 ? Math.min(100, Math.max(0, Math.round(((paidAmount || 0) / totalAmount) * 100))) : 0;
  const creditRatioPercent = 100 - cashRatioPercent;

  // Currency specific detection (Lebanese Pound LBP / Syrian Pound SYP / USD)
  const isLebanesePound = isLebaneseCurrency(settings.currency);
  const isSyrianPound = settings.currency.code === 'SYP' || settings.currency.symbol.includes('ل.س') || settings.currency.symbol.includes('LS');
  const isUsd = settings.currency.code === 'USD' || settings.currency.symbol === '$';

  let quickBanknotes = [10, 20, 50, 100, 200, 500];
  let quickIncrements = [10, 20, 50, 100];

  if (isLebanesePound) {
    quickBanknotes = LEBANESE_QUICK_BANKNOTES;
    quickIncrements = LEBANESE_INCREMENT_BUTTONS;
  } else if (isSyrianPound) {
    quickBanknotes = [5000, 10000, 25000, 50000, 100000, 200000];
    quickIncrements = [5000, 10000, 25000, 50000];
  }

  // Dual Currency Rate for Lebanon (1 USD = 89,500 LBP default or from bulletin)
  const usdRateForLbp = settings.exchangeBulletin?.usdSellRate && settings.exchangeBulletin.usdSellRate > 1000
    ? settings.exchangeBulletin.usdSellRate
    : 89500;
  const totalInUsdForLbp = Number((totalAmount / usdRateForLbp).toFixed(2));
  const changeDueInUsdForLbp = changeDue > 0 ? Number((changeDue / usdRateForLbp).toFixed(2)) : 0;

  const handleAddAmount = (val: number) => {
    setPaidAmount(prev => (Number(prev) || 0) + val);
  };

  const handleSetUsdCash = (usdVal: number) => {
    const lbpVal = Math.round(usdVal * usdRateForLbp);
    setPaidAmount(lbpVal);
    notify('تم احتساب الدولار', `استلام ورقة $${usdVal} = ${lbpVal.toLocaleString()} ل.ل (سعر الصرف: ${usdRateForLbp.toLocaleString()})`, 'info');
  };

  const handleSetExact = () => {
    setPaidAmount(totalAmount);
  };

  const handleCreateQuickCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName.trim()) return;
    const newCust = addCustomer({
      name: newCustomerName.trim(),
      phone: newCustomerPhone.trim() || '0900000000',
      currentDebt: 0,
      creditLimit: 500000,
    });
    setSelectedCustomer(newCust);
    setIsQuickAddCustomerOpen(false);
    setNewCustomerName('');
    setNewCustomerPhone('');
    notify('تم بنجاح', `تم تسجيل العميل (${newCust.name}) وتحديده للفاتورة الآجلة`, 'success');
  };

  const handleCompletePayment = () => {
    // Validation
    if (paymentMethod === 'cash' && paidAmount < totalAmount) {
      notify('تنبيه', 'المبلغ المدفوع نقداً أقل من إجمالي الفاتورة المطلوبة', 'warning');
      return;
    }

    if ((paymentMethod === 'credit' || (paymentMethod === 'split' && remainingDebt > 0)) && !selectedCustomer) {
      notify('تنبيه مطلوب', 'يرجى اختيار أو تسجيل العميل لتقييد الجزء الآجل من الفاتورة على حسابه', 'warning');
      return;
    }

    const sale = processSale({
      paymentMethod,
      paidAmount: Number(paidAmount) || 0,
      notes,
    });

    if (sale) {
      // Confetti celebratory animation
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#F59E0B', '#10B981', '#3B82F6', '#6366F1']
        });
      } catch {}

      setCompletedSale(sale);
      setIsReceiptOpen(true);
      onClose();

      // Smart Voice Announcer of Receipt Total
      try {
        voiceAnnouncer.announceSale(sale.total, settings.currency.symbol, language === 'ar' ? 'ar' : 'en');
      } catch {}
    }
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(quickCustomerSearch.toLowerCase()) ||
    c.phone.includes(quickCustomerSearch) ||
    c.customerCode.toLowerCase().includes(quickCustomerSearch.toLowerCase())
  );

  return (
    <>
      <DraggableModalWrapper
        isOpen={isOpen}
        onClose={onClose}
        title={<span>{t('paymentTitle')} <span className="text-xs text-slate-400 font-normal">(إتمام الفاتورة)</span></span>}
        subtitle="حدد طريقة الدفع والمبلغ المستلم — اسحب الشريط العلوي لتحريك النافذة"
        icon={<Calculator className="w-5 h-5" />}
        maxWidth="max-w-lg"
      >
        <div className="p-4 sm:p-5 space-y-4">
          {/* Grand Total Hero Display */}
          <div className="p-4 bg-gradient-to-tr from-amber-500/15 via-amber-500/10 to-amber-600/5 dark:from-amber-950/40 dark:to-slate-800/40 border border-amber-500/30 rounded-2xl text-center shadow-xs">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-300 block mb-1">
              {t('amountDue')} (المبلغ المطلوب)
            </span>
            <span className="text-3xl sm:text-4xl font-black text-slate-950 dark:text-white tracking-tight font-mono">
              {formatCurrency(totalAmount)}
            </span>
            {selectedCustomer && (
              <div className="flex items-center justify-center gap-2 mt-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white/70 dark:bg-slate-800/70 py-1 px-3 rounded-xl border border-amber-200 dark:border-slate-700 w-fit mx-auto">
                <UserCheck className="w-3.5 h-3.5 text-amber-600" />
                <span>العميل: {selectedCustomer.name}</span>
                {selectedCustomer.currentDebt ? (
                  <span className="text-[10px] text-rose-600 font-mono">
                    (دين سابق: {formatCurrency(selectedCustomer.currentDebt)})
                  </span>
                ) : null}
              </div>
            )}
          </div>

          {/* Payment Methods Selector (4 Options including Ajal / Credit) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {t('paymentMethod')} (طريقة السداد):
              </label>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                💡 اضغط مطولاً على أي خيار لمعرفة تفاصيله
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {/* 1. Cash */}
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                data-longpress-title="الدفع نقداً (Cash)"
                data-longpress-desc="استلام المبلغ ورقياً من العميل كاش، مع حساب الفكة والمبلغ المتبقي للزبون بدقة وتسجيله في صندوق الكاشير."
                className={`flex flex-col items-center justify-center p-3 min-h-[64px] rounded-2xl border transition-all cursor-pointer active:scale-95 ${
                  paymentMethod === 'cash'
                    ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20 font-bold scale-[1.02]'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <Banknote className="w-5 h-5 mb-1" />
                <span className="text-xs font-bold">{t('cash')}</span>
              </button>

              {/* 2. Split (نقد + آجل) */}
              <button
                type="button"
                id="btn-payment-method-split"
                onClick={() => setPaymentMethod('split')}
                data-longpress-title="تقسيم الفاتورة (نقد + آجل)"
                data-longpress-desc="تقسيم قيمة الفاتورة بين دفعة نقدية تُستلم الآن للصندوق والباقي يُقيد ديناً آجلاً على حساب العميل."
                className={`flex flex-col items-center justify-center p-3 min-h-[64px] rounded-2xl border transition-all cursor-pointer active:scale-95 ${
                  paymentMethod === 'split'
                    ? 'bg-gradient-to-tr from-emerald-600 to-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/25 font-bold scale-[1.02]'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <Split className={`w-5 h-5 mb-1 ${paymentMethod === 'split' ? 'text-white' : 'text-emerald-500'}`} />
                <span className="text-xs font-bold">نقد + آجل</span>
              </button>

              {/* 3. Ajal / Credit (آجل على الحساب) */}
              <button
                type="button"
                id="btn-payment-method-credit"
                onClick={() => setPaymentMethod('credit')}
                data-longpress-title="البيع الآجل والذمم (Credit / Ajal)"
                data-longpress-desc="تسجيل الفاتورة على حساب العميل في سجل الديون مع إمكانية دفع جزء نقداً وتسجيل الباقي ديناً بذمة العميل."
                className={`flex flex-col items-center justify-center p-3 min-h-[64px] rounded-2xl border transition-all cursor-pointer active:scale-95 ${
                  paymentMethod === 'credit'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20 font-bold scale-[1.02]'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <FileText className={`w-5 h-5 mb-1 ${paymentMethod === 'credit' ? 'text-white' : 'text-indigo-400'}`} />
                <span className="text-xs font-bold">آجل (ذمم)</span>
              </button>

              {/* 4. Card */}
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                data-longpress-title="الدفع بالبطاقة الإلكترونية (Card)"
                data-longpress-desc="الدفع عبر نقاط البيع المصرفية وبطاقات الدفع الإلكتروني، لا يتطلب إرجاع فكة نقدية."
                className={`flex flex-col items-center justify-center p-3 min-h-[64px] rounded-2xl border transition-all cursor-pointer active:scale-95 ${
                  paymentMethod === 'card'
                    ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20 font-bold scale-[1.02]'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <CreditCard className="w-5 h-5 mb-1" />
                <span className="text-xs font-bold">{t('card')}</span>
              </button>

              {/* 5. Transfer */}
              <button
                type="button"
                onClick={() => setPaymentMethod('transfer')}
                data-longpress-title="الحوالة أو الدفع الرقمي (Transfer)"
                data-longpress-desc="الدفع عبر التحويل البنكي أو المحافظ الإلكترونية المعتمدة مثل الهرم، الفؤاد، سيريتل كاش أو شام كاش."
                className={`flex flex-col items-center justify-center p-3 min-h-[64px] rounded-2xl border transition-all cursor-pointer active:scale-95 col-span-2 sm:col-span-1 ${
                  paymentMethod === 'transfer'
                    ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20 font-bold scale-[1.02]'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <Send className="w-5 h-5 mb-1" />
                <span className="text-xs font-bold">{t('transfer')}</span>
              </button>
            </div>
          </div>

              {/* CREDIT & SPLIT (نقد + آجل) SPECIFIC SECTION */}
              {(paymentMethod === 'credit' || paymentMethod === 'split') && (
                <div className="space-y-3 bg-indigo-50/70 dark:bg-indigo-950/30 p-4 rounded-2xl border border-indigo-200 dark:border-indigo-800/80 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 dark:text-indigo-300">
                      <Wallet className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>
                        {paymentMethod === 'split'
                          ? 'تقسيم سعر الفاتورة بين النقد والآجل (اختيار العميل):'
                          : 'حساب العميل الآجل (الذمم المدينة):'}
                      </span>
                    </div>
                    {!isQuickAddCustomerOpen && (
                      <button
                        type="button"
                        onClick={() => setIsQuickAddCustomerOpen(true)}
                        className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>+ تسجيل عميل جديد</span>
                      </button>
                    )}
                  </div>

                  {/* Quick Add New Customer Form if toggled */}
                  {isQuickAddCustomerOpen ? (
                    <form onSubmit={handleCreateQuickCustomer} className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-indigo-200 dark:border-indigo-800 space-y-2">
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">إضافة عميل آجل جديد:</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          required
                          placeholder="اسم العميل الكامل..."
                          value={newCustomerName}
                          onChange={e => setNewCustomerName(e.target.value)}
                          className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                          autoFocus
                        />
                        <input
                          type="tel"
                          placeholder="رقم الهاتف (اختياري)..."
                          value={newCustomerPhone}
                          onChange={e => setNewCustomerPhone(e.target.value)}
                          className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                        />
                      </div>
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setIsQuickAddCustomerOpen(false)}
                          className="px-3 py-1 text-xs text-slate-500 rounded-lg hover:bg-slate-100"
                        >
                          إلغاء
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1 text-xs font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        >
                          حفظ وتحديد
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div>
                      {selectedCustomer ? (
                        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-indigo-200 dark:border-indigo-800 flex items-center justify-between">
                          <div>
                            <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>{selectedCustomer.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">({selectedCustomer.customerCode})</span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-3">
                              <span>الهاتف: {selectedCustomer.phone}</span>
                              <span>الدين السابق: <strong className="text-rose-600 font-mono">{formatCurrency(selectedCustomer.currentDebt || 0)}</strong></span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedCustomer(null)}
                            className="text-[11px] text-rose-500 hover:underline font-bold"
                          >
                            تغيير
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <input
                            type="text"
                            placeholder="ابحث عن العميل بالاسم أو رقم الهاتف أو الكود..."
                            value={quickCustomerSearch}
                            onChange={e => setQuickCustomerSearch(e.target.value)}
                            className="w-full text-xs py-2 px-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl border border-indigo-200 dark:border-indigo-800 focus:outline-none"
                          />
                          <div className="max-h-28 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 rounded-xl border border-indigo-100 dark:border-indigo-900/60">
                            {filteredCustomers.slice(0, 5).map(c => (
                              <div
                                key={c.id}
                                onClick={() => {
                                  setSelectedCustomer(c);
                                  setQuickCustomerSearch('');
                                }}
                                className="p-2 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/40 cursor-pointer flex items-center justify-between text-xs transition-colors"
                              >
                                <span className="font-bold text-slate-800 dark:text-slate-200">{c.name}</span>
                                <span className="text-[10px] text-slate-400 font-mono">{c.phone}</span>
                              </div>
                            ))}
                            {filteredCustomers.length === 0 && (
                              <div className="p-2 text-center text-[11px] text-slate-400">
                                لا يوجد عميل بهذا الاسم - اضغط "+ تسجيل عميل جديد" بالأعلى
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Interactive Bidirectional Cash ⟷ Credit Split Section */}
                  <div className="pt-3 border-t border-indigo-200/60 dark:border-indigo-800/60 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <span className="text-xs font-black text-indigo-950 dark:text-indigo-200 flex items-center gap-1">
                        <Split className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>توزيع وتقسيم قيمة الفاتورة (نقد ⟷ آجل):</span>
                      </span>

                      {/* Quick Split Ratio Buttons */}
                      <div className="flex items-center gap-1">
                        {[
                          { label: 'كامل آجل (0%)', ratio: 0 },
                          { label: '25% نقد', ratio: 0.25 },
                          { label: '50% نصف', ratio: 0.5 },
                          { label: '75% نقد', ratio: 0.75 },
                        ].map(preset => {
                          const targetVal = Math.round(totalAmount * preset.ratio);
                          const isSelected = Math.abs((paidAmount || 0) - targetVal) < 5;
                          return (
                            <button
                              key={preset.label}
                              type="button"
                              onClick={() => setPaidAmount(targetVal)}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-indigo-600 text-white shadow-2xs'
                                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100'
                              }`}
                            >
                              {preset.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Visual Split Progress Bar & Interactive Range Slider */}
                    <div className="space-y-1.5">
                      <div className="h-3 w-full rounded-full bg-indigo-200 dark:bg-indigo-900/70 overflow-hidden flex shadow-inner">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-200"
                          style={{ width: `${cashRatioPercent}%` }}
                        />
                        <div
                          className="h-full bg-indigo-600 transition-all duration-200"
                          style={{ width: `${creditRatioPercent}%` }}
                        />
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={totalAmount}
                        step={totalAmount >= 10000 ? 500 : 1}
                        value={Math.min(totalAmount, Math.max(0, paidAmount || 0))}
                        onChange={e => setPaidAmount(Number(e.target.value))}
                        aria-label="شريط تمرير تقسيم الفاتورة بين النقد والآجل"
                        className="w-full h-1.5 accent-emerald-600 cursor-pointer"
                      />
                      <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                        <span className="text-emerald-700 dark:text-emerald-400">
                          💵 نقداً الآن: {cashRatioPercent}% ({formatCurrency(paidAmount || 0)})
                        </span>
                        <span className="text-indigo-700 dark:text-indigo-300">
                          📋 آجل (ذمة): {creditRatioPercent}% ({formatCurrency(remainingDebt)})
                        </span>
                      </div>
                    </div>

                    {/* Side-by-side Cash Input and Credit Input (Bidirectionally Linked!) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* 1. Cash Portion Paid Now */}
                      <div className="p-2.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800">
                        <label className="block text-[11px] font-black text-emerald-900 dark:text-emerald-300 mb-1">
                          💵 القسم المدفوع نقداً الآن ({settings.currency.symbol}):
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={totalAmount}
                          value={paidAmount === 0 ? '' : paidAmount}
                          onChange={e => {
                            const val = Math.min(totalAmount, Math.max(0, Number(e.target.value) || 0));
                            setPaidAmount(val);
                          }}
                          placeholder="0"
                          className="w-full text-lg font-black font-mono py-1.5 px-2.5 bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 rounded-lg border border-emerald-300 dark:border-emerald-700 focus:outline-none"
                        />
                      </div>

                      {/* 2. Deferred Credit Debt Portion */}
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700">
                        <label className="block text-[11px] font-black text-indigo-900 dark:text-indigo-300 mb-1">
                          📋 القسم المتبقي آجلاً (دين على العميل):
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={totalAmount}
                          value={remainingDebt === 0 ? '' : remainingDebt}
                          onChange={e => {
                            const debtVal = Math.min(totalAmount, Math.max(0, Number(e.target.value) || 0));
                            setPaidAmount(Math.max(0, totalAmount - debtVal));
                          }}
                          placeholder="0"
                          className="w-full text-lg font-black font-mono py-1.5 px-2.5 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 rounded-lg border border-indigo-200 dark:border-indigo-800 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Quick Cash Banknotes for Cash Portion in Split Mode */}
                    {quickBanknotes.some(b => b < totalAmount) && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">
                          اختيار سريع للدفعة النقدية المستلمة الآن:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {quickBanknotes
                            .filter(b => b < totalAmount)
                            .map(val => (
                              <button
                                key={val}
                                type="button"
                                onClick={() => setPaidAmount(val)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border transition-all active:scale-95 cursor-pointer ${
                                  paidAmount === val
                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                    : 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50'
                                }`}
                              >
                                نقد: {val.toLocaleString()}
                              </button>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Customer Total Balance After Sale */}
                    {selectedCustomer && (
                      <div className="p-2.5 bg-indigo-600/10 dark:bg-indigo-900/40 border border-indigo-500/30 rounded-xl flex items-center justify-between text-xs">
                        <span className="font-bold text-indigo-950 dark:text-indigo-200">
                          إجمالي ذمة العميل ({selectedCustomer.name}) بعد هذه الفاتورة:
                        </span>
                        <span className="font-mono font-black text-sm text-indigo-700 dark:text-indigo-300">
                          {formatCurrency((selectedCustomer.currentDebt || 0) + remainingDebt)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* CASH / CARD / TRANSFER PAYMENT AMOUNT & CHANGE DUE CALCULATION */}
              {paymentMethod !== 'credit' && paymentMethod !== 'split' && (
                <div className="space-y-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {t('amountPaid')} (المبلغ المستلم من الزبون):
                    </label>
                    <button
                      type="button"
                      onClick={handleSetExact}
                      data-longpress-title="المبلغ بالتمام والكمال"
                      data-longpress-desc="تعيين المبلغ المستلم ليساوي بالضبط إجمالي الفاتورة دون أي باقي أو فكة."
                      className="text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 min-h-[38px] rounded-xl flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                    >
                      <Coins className="w-3.5 h-3.5" />
                      <span>{t('exactAmount')} ({formatCurrency(totalAmount)})</span>
                    </button>
                  </div>

                  {/* Primary Paid Input Field */}
                  <div className="relative">
                    <input
                      type="number"
                      id="input-pos-paid-amount"
                      value={paidAmount || ''}
                      onChange={e => setPaidAmount(Number(e.target.value))}
                      className="w-full text-2xl font-black font-mono py-3.5 px-4 min-h-[52px] bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl border-2 border-amber-500/50 focus:border-amber-500 focus:outline-none text-start shadow-inner"
                      autoFocus
                    />
                    <div className="absolute end-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      {settings.currency.symbol}
                    </div>
                  </div>

                  {/* Quick Banknotes Buttons */}
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block mb-1.5">
                      فئات نقدية سريعة ({settings.currency.symbol}):
                    </span>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                      {quickBanknotes.map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setPaidAmount(val)}
                          data-longpress-title={`فئة ${val.toLocaleString()} ${settings.currency.symbol}`}
                          data-longpress-desc={`تحديد أن العميل سلّم ورقة نقدية من فئة ${val.toLocaleString()} ${settings.currency.symbol} لاحتساب الباقي فوراً.`}
                          className="min-h-[46px] py-2.5 px-2 bg-white dark:bg-slate-900 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-xs font-black font-mono text-slate-800 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 transition-all active:scale-95 text-center shadow-2xs cursor-pointer flex items-center justify-center"
                        >
                          {val.toLocaleString()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Increment Buttons */}
                  <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                    <span className="text-[10px] text-slate-400 font-bold">إضافة:</span>
                    {quickIncrements.map(inc => (
                      <button
                        key={inc}
                        type="button"
                        onClick={() => handleAddAmount(inc)}
                        data-longpress-title={`إضافة ${inc.toLocaleString()}`}
                        data-longpress-desc={`إضافة ورقة إضافية بقيمة ${inc.toLocaleString()} إلى إجمالي ما استلمته من الزبون.`}
                        className="min-h-[40px] px-3 py-2 bg-slate-200/80 dark:bg-slate-700/80 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-xs font-mono font-bold text-slate-700 dark:text-slate-300 rounded-xl transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{inc.toLocaleString()}</span>
                      </button>
                    ))}
                  </div>

                  {/* LEBANESE DUAL CURRENCY USD CASH HELPER (دفع بالدولار النقدي للعملة اللبنانية) */}
                  {isLebanesePound && (
                    <div className="p-3 bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/30 rounded-2xl space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-900 dark:text-emerald-200">
                          <span className="w-5 h-5 rounded-lg bg-emerald-500 text-white flex items-center justify-center text-xs font-bold">$</span>
                          <span>استلام دولار نقداً (USD Cash):</span>
                        </div>
                        <div className="text-[11px] font-mono text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-2">
                          <span>الفاتورة: <strong>${totalInUsdForLbp}</strong></span>
                          <span>(1$ = {usdRateForLbp.toLocaleString()} ل.ل)</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-1.5">
                        {[10, 20, 50, 100].map(dollar => (
                          <button
                            key={dollar}
                            type="button"
                            onClick={() => handleSetUsdCash(dollar)}
                            className="min-h-[42px] px-2 py-2 bg-white dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-emerald-950 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-mono font-black text-emerald-800 dark:text-emerald-300 transition-all active:scale-95 text-center shadow-2xs cursor-pointer flex flex-col items-center justify-center"
                          >
                            <span className="text-sm font-black">${dollar}</span>
                            <span className="text-[9px] text-slate-400 font-normal">{(dollar * usdRateForLbp).toLocaleString()} ل.ل</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* PROMINENT CHANGE DUE DISPLAY (قديش باقيله) */}
                  <div className={`mt-3 p-4 rounded-2xl border transition-all ${
                    paidAmount >= totalAmount
                      ? 'bg-emerald-500/10 dark:bg-emerald-950/40 border-emerald-500/40'
                      : 'bg-rose-500/10 dark:bg-rose-950/40 border-rose-500/40'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                          <Coins className={`w-4 h-4 ${paidAmount >= totalAmount ? 'text-emerald-600' : 'text-rose-500'}`} />
                          <span>{t('changeDue')} (المبلغ الباقي للزبون / الفكة):</span>
                        </span>
                        <div className="flex items-baseline gap-3 mt-1">
                          <div className="text-3xl font-black font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(changeDue)}
                          </div>
                          {isLebanesePound && changeDue > 0 && (
                            <div className="text-sm font-mono font-bold text-slate-500 dark:text-slate-400">
                              (أو تقريباً <span className="font-black text-emerald-600 dark:text-emerald-400">${changeDueInUsdForLbp}</span>)
                            </div>
                          )}
                        </div>
                      </div>

                      {paidAmount < totalAmount ? (
                        <div className="text-end space-y-1.5">
                          <span className="text-xs text-rose-600 dark:text-rose-400 font-bold block">
                            المبلغ غير كافٍ!
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono block">
                            ينقص: {formatCurrency(totalAmount - paidAmount)}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const currentCash = paidAmount > 0 ? paidAmount : 0;
                              setPaymentMethod('split');
                              setTimeout(() => setPaidAmount(currentCash), 0);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-extrabold flex items-center gap-1 shadow-xs active:scale-95 transition-all cursor-pointer"
                          >
                            <Split className="w-3 h-3" />
                            <span>تقسيم الباقي كدين آجل</span>
                          </button>
                        </div>
                      ) : (
                        <div className="text-end">
                          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2.5 py-1 rounded-xl">
                            {changeDue === 0 ? 'المبلغ مطابق تماماً' : 'تم احتساب الباقي'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Order Notes */}
              <div>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="ملاحظات إضافية على الفاتورة (مثال: طلب خارجي، توصيل، رقم الطاولة)..."
                  className="w-full text-xs py-3 px-3.5 min-h-[44px] bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Confirm Sale & Print Button */}
              <button
                type="button"
                id="btn-confirm-complete-sale"
                disabled={
                  (paymentMethod === 'cash' && paidAmount < totalAmount) ||
                  ((paymentMethod === 'credit' || (paymentMethod === 'split' && remainingDebt > 0)) && !selectedCustomer)
                }
                onClick={handleCompletePayment}
                data-longpress-title="تأكيد الدفع وطباعة الفاتورة"
                data-longpress-desc="حفظ الفاتورة نهائياً، خصم الكميات من المستودع، تسجيل الحركة في الصندوق، وإظهار إيصال الطباعة المباشرة."
                className={`w-full py-4 min-h-[54px] rounded-2xl text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98 cursor-pointer ${
                  (paymentMethod === 'cash' && paidAmount < totalAmount) ||
                  ((paymentMethod === 'credit' || (paymentMethod === 'split' && remainingDebt > 0)) && !selectedCustomer)
                    ? 'bg-slate-400 dark:bg-slate-700 text-slate-200 cursor-not-allowed shadow-none'
                    : paymentMethod === 'credit' || paymentMethod === 'split'
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 shadow-indigo-600/30'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-amber-500/30'
                }`}
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>
                  {paymentMethod === 'split'
                    ? `تأكيد تقسيم الفاتورة (نقد: ${formatCurrency(paidAmount || 0)} + آجل: ${formatCurrency(remainingDebt)})`
                    : paymentMethod === 'credit'
                    ? `تأكيد الفاتورة الآجلة (${formatCurrency(totalAmount)})`
                    : `${t('completeSale')} (${formatCurrency(totalAmount)})`}
                </span>
              </button>
        </div>
      </DraggableModalWrapper>

      {/* Printable Receipt Modal */}
      <PrintableReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => {
          setIsReceiptOpen(false);
          setCompletedSale(null);
        }}
        sale={completedSale}
      />
    </>
  );
};
