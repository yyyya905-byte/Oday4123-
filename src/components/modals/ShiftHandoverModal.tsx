import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Banknote,
  Coins,
  Calculator,
  ArrowDownCircle,
  ArrowUpCircle,
  Clock,
  UserCheck,
  Printer,
  Share2,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  X,
  Plus,
  Minus,
  RefreshCw,
  History,
  FileText,
  DollarSign,
  ShieldCheck,
  Send,
  MessageCircle
} from 'lucide-react';
import { soundEffects } from '../../services/audio';
import { CashShift } from '../../types';

interface ShiftHandoverModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COMMON_DENOMINATIONS = [
  { value: 500, label: '500' },
  { value: 200, label: '200' },
  { value: 100, label: '100' },
  { value: 50, label: '50' },
  { value: 20, label: '20' },
  { value: 10, label: '10' },
  { value: 5, label: '5' },
  { value: 1, label: '1' }
];

export const ShiftHandoverModal: React.FC<ShiftHandoverModalProps> = ({
  isOpen,
  onClose
}) => {
  const {
    shifts,
    activeShift,
    startNewShift,
    recordShiftCashMovement,
    closeShift,
    currentUser,
    settings,
    staff,
    formatCurrency,
    language,
    notify
  } = useApp();

  const isRtl = language === 'ar';

  // Navigation tab inside modal
  const [activeTab, setActiveTab] = useState<'current' | 'audit' | 'movement' | 'history'>('current');

  // Start shift form state
  const [openingFloatInput, setOpeningFloatInput] = useState<string>('0');
  const [openingNotes, setOpeningNotes] = useState<string>('');

  // Cash movement state (cash in / cash out)
  const [movementType, setMovementType] = useState<'cash_in' | 'cash_out'>('cash_in');
  const [movementAmount, setMovementAmount] = useState<string>('');
  const [movementReason, setMovementReason] = useState<string>('');

  // Drawer audit denomination counters
  const [denomCounts, setDenomCounts] = useState<Record<number, number>>({
    500: 0,
    200: 0,
    100: 0,
    50: 0,
    20: 0,
    10: 0,
    5: 0,
    1: 0
  });
  const [extraCoinsCash, setExtraCoinsCash] = useState<string>('0');
  const [auditNotes, setAuditNotes] = useState<string>('');
  const [handoverCashier, setHandoverCashier] = useState<string>('');

  // Printable slip view for closing
  const [printedShift, setPrintedShift] = useState<CashShift | null>(null);

  // Calculate counted physical cash
  const countedPhysicalCash = useMemo(() => {
    let sum = 0;
    COMMON_DENOMINATIONS.forEach(d => {
      sum += (denomCounts[d.value] || 0) * d.value;
    });
    const extra = parseFloat(extraCoinsCash) || 0;
    return sum + Math.max(0, extra);
  }, [denomCounts, extraCoinsCash]);

  // Expected Cash calculation
  const expectedCash = activeShift ? (activeShift.expectedCash || 0) : 0;
  const cashDifference = countedPhysicalCash - expectedCash;

  if (!isOpen) return null;

  // Handle Start Shift
  const handleStartShiftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(openingFloatInput) || 0;
    startNewShift(amount, openingNotes);
    setOpeningFloatInput('0');
    setOpeningNotes('');
    setActiveTab('current');
  };

  // Handle Cash Movement
  const handleCashMovementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(movementAmount) || 0;
    if (amount <= 0) {
      notify('خطأ', 'يرجى إدخال مبلغ صحيح أكبر من الصفر', 'error');
      return;
    }
    if (!movementReason.trim()) {
      notify('خطأ', 'يرجى تحديد سبب حركة الصندوق', 'error');
      return;
    }

    recordShiftCashMovement(movementType, amount, movementReason);
    setMovementAmount('');
    setMovementReason('');
    setActiveTab('current');
  };

  // Handle Close Shift
  const handleCloseShiftSubmit = () => {
    if (!activeShift) return;

    try {
      const closed = closeShift(
        countedPhysicalCash,
        auditNotes,
        denomCounts as any,
        handoverCashier || 'الإدارة / الخزينة'
      );
      setPrintedShift(closed);
      soundEffects.playSuccess();
    } catch (err: any) {
      notify('خطأ', err.message || 'فشل إغلاق الوردية', 'error');
    }
  };

  // Quick denomination increment/decrement
  const updateDenom = (val: number, delta: number) => {
    soundEffects.buttonClick();
    setDenomCounts(prev => ({
      ...prev,
      [val]: Math.max(0, (prev[val] || 0) + delta)
    }));
  };

  const setDenomDirect = (val: number, count: number) => {
    setDenomCounts(prev => ({
      ...prev,
      [val]: Math.max(0, count)
    }));
  };

  // Share shift report via WhatsApp to store owner/manager
  const handleShareShiftWhatsApp = (shiftToShare: CashShift) => {
    const phone = (settings.managerWhatsappPhone || settings.mobile || '').replace(/[^0-9]/g, '');
    const dateFormatted = new Date(shiftToShare.closedAt || shiftToShare.openedAt).toLocaleString(
      language === 'ar' ? 'ar-SY' : 'en-US'
    );
    const diffText = (shiftToShare.discrepancy || 0) === 0
      ? '✅ مطابق تماماً (0)'
      : (shiftToShare.discrepancy || 0) > 0
      ? `📈 فائض: +${formatCurrency(shiftToShare.discrepancy || 0)}`
      : `📉 عجز: -${formatCurrency(Math.abs(shiftToShare.discrepancy || 0))}`;

    const text = `📊 *تقرير إغلاق وتسليم الوردية #${shiftToShare.shiftNumber}*
🏢 المتجر: ${settings.storeNameAr || settings.storeNameEn}
👤 كاشير الوردية: ${shiftToShare.cashierName}
🤝 استلم الوردية: ${shiftToShare.handoverToCashierName || 'الإدارة'}
⏰ تاريخ الإغلاق: ${dateFormatted}
-----------------------------
💵 عهدة الافتتاح: ${formatCurrency(shiftToShiftSafe(shiftToShare.openingFloat))}
💰 مبيعات الكاش: ${formatCurrency(shiftToShiftSafe(shiftToShare.cashSales))}
💳 مبيعات البطاقة/الشبكة: ${formatCurrency(shiftToShiftSafe(shiftToShare.cardSales))}
📥 إيداعات إضافية: ${formatCurrency(shiftToShiftSafe(shiftToShare.cashIn))}
📤 مسحوبات نقدية: ${formatCurrency(shiftToShiftSafe(shiftToShare.cashOut))}
-----------------------------
🎯 النقد المتوقع بالدرج: ${formatCurrency(shiftToShiftSafe(shiftToShare.expectedCash))}
💵 النقد الفعلي المحصي: ${formatCurrency(shiftToShiftSafe(shiftToShare.actualCash || 0))}
🔍 نتيجة المطابقة: ${diffText}
${shiftToShare.closingNotes ? `📝 ملاحظات: ${shiftToShare.closingNotes}\n` : ''}-----------------------------
تم الإغلاق والاعتماد آلياً عبر نظام كيان كاشير`;

    const encoded = encodeURIComponent(text);
    const url = phone ? `https://wa.me/${phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  };

  const shiftToShiftSafe = (val?: number) => val || 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shift-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden text-slate-900 dark:text-slate-100">
        
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-850/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Banknote className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="shift-modal-title" className="text-base sm:text-lg font-black tracking-tight">
                  {language === 'ar' ? 'إدارة الورديات ومطابقة درج الكاشير' : 'Cash Shifts & Drawer Balancing'}
                </h2>
                {activeShift ? (
                  <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    وردية #{activeShift.shiftNumber} نشطة
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    لا توجد وردية مفتوحة
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'ar'
                  ? 'متابعة حركة النقد لحظياً، عد فئات العملة، وتسليم الصندوق للمناوب الجديد'
                  : 'Live cash drawer tracking, denomination counts, and seamless cashier handover'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL TABS */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 bg-white dark:bg-slate-900 gap-2 sm:gap-4 overflow-x-auto text-xs font-bold shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('current')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'current'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Banknote className="w-4 h-4" />
            <span>{language === 'ar' ? 'الوردية الحالية والنقد' : 'Current Shift'}</span>
          </button>

          {activeShift && (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('audit')}
                className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === 'audit'
                    ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Calculator className="w-4 h-4" />
                <span>{language === 'ar' ? 'جرد الفئات وتسليم الوردية' : 'Drawer Audit & Handover'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('movement')}
                className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === 'movement'
                    ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Coins className="w-4 h-4" />
                <span>{language === 'ar' ? 'حركة الصندوق (إيداع / سحب)' : 'Cash In / Out'}</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'history'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>{language === 'ar' ? 'سجل الورديات السابقة' : 'Shift History'}</span>
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">

          {/* TAB 1: CURRENT SHIFT / START SHIFT */}
          {activeTab === 'current' && (
            <div>
              {!activeShift ? (
                /* START A NEW SHIFT FORM */
                <div className="max-w-lg mx-auto py-4 space-y-6">
                  <div className="text-center space-y-2">
                    <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                      <Banknote className="w-8 h-8" />
                    </div>
                    <h3 className="text-base sm:text-lg font-black">
                      {language === 'ar' ? 'افتتاح وردية كاشير جديدة' : 'Open New Cashier Shift'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {language === 'ar'
                        ? 'أدخل رصيد العهدة النقدية الافتتاحية الموجودة في درج الكاشير للبدء بتسجيل المبيعات وحركات النقد بدقة.'
                        : 'Enter the opening cash float in the cash drawer to begin shift tracking.'}
                    </p>
                  </div>

                  <form onSubmit={handleStartShiftSubmit} className="space-y-4 bg-slate-50 dark:bg-slate-800/60 p-5 rounded-3xl border border-slate-200 dark:border-slate-700">
                    <div>
                      <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                        {language === 'ar' ? 'رصيد العهدة الافتتاحي (النقد بالدرج):' : 'Opening Cash Float:'}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={openingFloatInput}
                          onChange={e => setOpeningFloatInput(e.target.value)}
                          className="w-full py-3 px-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-lg font-black font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
                          placeholder="0.00"
                          required
                          autoFocus
                        />
                        <span className="absolute end-4 top-3.5 text-xs font-bold text-slate-400">
                          {settings.currency.symbol}
                        </span>
                      </div>
                      
                      {/* Quick Float Chips */}
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        <span className="text-[10px] text-slate-400">{language === 'ar' ? 'مبالغ شائعة:' : 'Quick:'}</span>
                        {[0, 100, 200, 500, 1000].map(amt => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setOpeningFloatInput(String(amt))}
                            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-white dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-950/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                          >
                            {amt === 0 ? (language === 'ar' ? 'بدون عهدة (0)' : 'Zero') : amt}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        {language === 'ar' ? 'ملاحظات الافتتاح (اختياري):' : 'Opening Notes (Optional):'}
                      </label>
                      <input
                        type="text"
                        value={openingNotes}
                        onChange={e => setOpeningNotes(e.target.value)}
                        placeholder={language === 'ar' ? 'مثال: فكة صباحية، عهدة من الإدارة...' : 'e.g. Morning float, small bills...'}
                        className="w-full py-2.5 px-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-sm shadow-md active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Banknote className="w-5 h-5" />
                        <span>{language === 'ar' ? 'افتتاح الوردية وبدء العمل الآن' : 'Start Shift Now'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                /* ACTIVE SHIFT DASHBOARD */
                <div className="space-y-6">
                  {/* Top Bar Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                        <UserCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-[11px] text-slate-400 font-bold">{language === 'ar' ? 'الكاشير المناوب' : 'Cashier on Duty'}</div>
                        <div className="text-sm font-black text-slate-900 dark:text-white">{activeShift.cashierName}</div>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-[11px] text-slate-400 font-bold">{language === 'ar' ? 'وقت الافتتاح' : 'Shift Started'}</div>
                        <div className="text-xs font-black text-slate-900 dark:text-white">
                          {new Date(activeShift.openedAt).toLocaleTimeString(language === 'ar' ? 'ar-SY' : 'en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                        <DollarSign className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-[11px] text-slate-400 font-bold">{language === 'ar' ? 'العهدة الافتتاحية' : 'Opening Float'}</div>
                        <div className="text-sm font-black font-mono text-purple-600 dark:text-purple-400">
                          {formatCurrency(activeShift.openingFloat)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expected Cash in Drawer Hero Card */}
                  <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 text-white shadow-xl border border-slate-800 relative overflow-hidden">
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 text-amber-400 text-xs font-black uppercase tracking-wider">
                          <Banknote className="w-4 h-4" />
                          <span>{language === 'ar' ? 'النقد المتوقع في درج الكاشير الآن' : 'Expected Drawer Cash'}</span>
                        </div>
                        <div className="text-3xl sm:text-4xl font-black font-mono text-white mt-1">
                          {formatCurrency(expectedCash)}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          {language === 'ar'
                            ? '= العهدة الافتتاحية + المبيعات النقدية + الإيداعات - المصروفات والمسحوبات'
                            : '= Opening Float + Cash Sales + Cash In - Expenses - Cash Out'}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => setActiveTab('audit')}
                          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                        >
                          <Calculator className="w-4 h-4" />
                          <span>{language === 'ar' ? 'جرد وتسليم الوردية' : 'Audit & Handover'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveTab('movement')}
                          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                        >
                          <Coins className="w-4 h-4" />
                          <span>{language === 'ar' ? 'إيداع / سحب' : 'Cash In / Out'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Financial Breakdown Table / Cards */}
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                      {language === 'ar' ? 'تفصيل حركات النقد خلال الوردية' : 'Cash Movements Breakdown'}
                    </h3>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      {/* Cash Sales */}
                      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80">
                        <div className="text-slate-400 font-bold mb-1 flex items-center gap-1">
                          <Banknote className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{language === 'ar' ? 'مبيعات الكاش' : 'Cash Sales'}</span>
                        </div>
                        <div className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">
                          +{formatCurrency(activeShift.cashSales || 0)}
                        </div>
                      </div>

                      {/* Card Sales */}
                      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80">
                        <div className="text-slate-400 font-bold mb-1 flex items-center gap-1">
                          <Coins className="w-3.5 h-3.5 text-blue-500" />
                          <span>{language === 'ar' ? 'مبيعات البطاقة' : 'Card Sales'}</span>
                        </div>
                        <div className="text-sm font-black font-mono text-blue-600 dark:text-blue-400">
                          {formatCurrency(activeShift.cardSales || 0)}
                        </div>
                      </div>

                      {/* Cash In */}
                      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80">
                        <div className="text-slate-400 font-bold mb-1 flex items-center gap-1">
                          <ArrowDownCircle className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{language === 'ar' ? 'إيداعات بالدرج' : 'Cash In'}</span>
                        </div>
                        <div className="text-sm font-black font-mono text-indigo-600 dark:text-indigo-400">
                          +{formatCurrency(activeShift.cashIn || 0)}
                        </div>
                      </div>

                      {/* Cash Out */}
                      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80">
                        <div className="text-slate-400 font-bold mb-1 flex items-center gap-1">
                          <ArrowUpCircle className="w-3.5 h-3.5 text-rose-500" />
                          <span>{language === 'ar' ? 'مسحوبات من الدرج' : 'Cash Out'}</span>
                        </div>
                        <div className="text-sm font-black font-mono text-rose-600 dark:text-rose-400">
                          -{formatCurrency(activeShift.cashOut || 0)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Shift Transactions Log */}
                  {activeShift.transactions && activeShift.transactions.length > 0 && (
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2.5">
                        {language === 'ar' ? 'سجل حركات الصندوق لهذه الوردية' : 'Shift Transactions Log'}
                      </h3>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {activeShift.transactions.map((tx, idx) => (
                          <div
                            key={tx.id || idx}
                            className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2">
                              {tx.type === 'cash_in' || tx.type === 'opening' ? (
                                <ArrowDownCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                              ) : (
                                <ArrowUpCircle className="w-4 h-4 text-rose-500 shrink-0" />
                              )}
                              <div>
                                <span className="font-bold text-slate-800 dark:text-slate-200">
                                  {tx.reason || (tx.type === 'opening' ? 'عهدة بداية الوردية' : 'حركة نقدية')}
                                </span>
                                <span className="text-[10px] text-slate-400 block">
                                  {new Date(tx.timestamp).toLocaleTimeString(language === 'ar' ? 'ar-SY' : 'en-US')} • {tx.performedBy}
                                </span>
                              </div>
                            </div>

                            <span className={`font-mono font-bold ${
                              tx.type === 'cash_in' || tx.type === 'opening'
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }`}>
                              {tx.type === 'cash_in' || tx.type === 'opening' ? '+' : '-'}{formatCurrency(tx.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: AUDIT & HANDOVER (جرد الفئات ومطابقة الدرج) */}
          {activeTab === 'audit' && activeShift && (
            <div className="space-y-6">
              {/* Instructions Banner */}
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3">
                <Calculator className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold">
                    {language === 'ar' ? 'حاسبة عد فئات النقد ومطابقة الدرج الذكية' : 'Smart Denomination Counter'}
                  </div>
                  <p className="text-[11px] leading-relaxed text-amber-800/80 dark:text-amber-300/80">
                    {language === 'ar'
                      ? 'قم بعد الأوراق النقدية والعملات الموجودة في الدرج وأدخل عدد كل فئة، وسيقوم النظام بحساب إجمالي النقد الفعلي ومقارنته بالمبلغ المتوقع آلياً.'
                      : 'Count banknotes and coins in the drawer. The system compares physical count vs expected balance.'}
                  </p>
                </div>
              </div>

              {/* Denomination Counter Grid */}
              <div>
                <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 mb-2">
                  {language === 'ar' ? 'عد فئات العملة الورقية والمعدنية:' : 'Denomination Counters:'}
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {COMMON_DENOMINATIONS.map(d => {
                    const count = denomCounts[d.value] || 0;
                    const subtotal = count * d.value;

                    return (
                      <div
                        key={d.value}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between gap-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-black text-sm text-slate-800 dark:text-slate-100 font-mono">
                            فئة {d.label}
                          </span>
                          <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400 font-bold">
                            = {formatCurrency(subtotal)}
                          </span>
                        </div>

                        {/* Counter Controls */}
                        <div className="flex items-center justify-between gap-1 bg-white dark:bg-slate-900 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
                          <button
                            type="button"
                            onClick={() => updateDenom(d.value, -1)}
                            className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 active:scale-90 transition-transform"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>

                          <input
                            type="number"
                            min="0"
                            value={count || ''}
                            onChange={e => setDenomDirect(d.value, parseInt(e.target.value) || 0)}
                            placeholder="0"
                            className="w-12 text-center text-xs font-black font-mono bg-transparent text-slate-900 dark:text-white focus:outline-none"
                          />

                          <button
                            type="button"
                            onClick={() => updateDenom(d.value, 1)}
                            className="w-7 h-7 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 flex items-center justify-center active:scale-90 transition-transform font-bold"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Extra Coins / Loose Cash */}
                <div className="mt-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      {language === 'ar' ? 'فكة معدنية إضافية أو مبالغ أخرى:' : 'Loose Coins & Extra Cash:'}
                    </label>
                    <span className="text-[11px] text-slate-400">
                      {language === 'ar' ? 'أدخل قيمة الفكة المعدنية المتبقية مباشرة' : 'Enter loose coins subtotal'}
                    </span>
                  </div>

                  <div className="w-full sm:w-48 relative">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={extraCoinsCash}
                      onChange={e => setExtraCoinsCash(e.target.value)}
                      placeholder="0.00"
                      className="w-full py-2 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <span className="absolute end-3 top-2.5 text-[10px] text-slate-400">
                      {settings.currency.symbol}
                    </span>
                  </div>
                </div>
              </div>

              {/* AUDIT SUMMARY & VARIANCE CARD */}
              <div className="p-5 rounded-3xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Expected */}
                  <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[11px] text-slate-400 font-bold block">{language === 'ar' ? 'النقد المتوقع في الدرج' : 'Expected in Drawer'}</span>
                    <span className="text-base sm:text-lg font-black font-mono text-slate-900 dark:text-white mt-1 block">
                      {formatCurrency(expectedCash)}
                    </span>
                  </div>

                  {/* Physical Counted */}
                  <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[11px] text-slate-400 font-bold block">{language === 'ar' ? 'النقد الفعلي المحصي' : 'Physical Cash Counted'}</span>
                    <span className="text-base sm:text-lg font-black font-mono text-amber-600 dark:text-amber-400 mt-1 block">
                      {formatCurrency(countedPhysicalCash)}
                    </span>
                  </div>

                  {/* Discrepancy Status */}
                  <div className={`p-3.5 rounded-2xl border flex flex-col justify-center ${
                    cashDifference === 0
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                      : cashDifference > 0
                      ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-300'
                      : 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                  }`}>
                    <span className="text-[11px] font-bold block">
                      {cashDifference === 0
                        ? (language === 'ar' ? 'نتيجة المطابقة: متطابق 100%' : 'Audit Result: Exact Match')
                        : cashDifference > 0
                        ? (language === 'ar' ? 'فائض نقدي بالصندوق' : 'Cash Surplus')
                        : (language === 'ar' ? 'عجز نقدي بالصندوق' : 'Cash Shortage')}
                    </span>
                    <span className="text-base sm:text-lg font-black font-mono mt-1 block">
                      {cashDifference === 0 ? '✓ 0' : `${cashDifference > 0 ? '+' : ''}${formatCurrency(cashDifference)}`}
                    </span>
                  </div>
                </div>

                {/* Handover To Cashier & Notes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {language === 'ar' ? 'المستلم للوردية الجديدة:' : 'Handover to Cashier:'}
                    </label>
                    <select
                      value={handoverCashier}
                      onChange={e => setHandoverCashier(e.target.value)}
                      className="w-full text-xs py-2.5 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                    >
                      <option value="">{language === 'ar' ? '-- تسليم للإدارة / إغلاق نهائي --' : '-- Management / Final Close --'}</option>
                      {staff.filter(st => st.id !== currentUser.id && st.status === 'active').map(st => (
                        <option key={st.id} value={st.name}>
                          {st.name} ({st.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {language === 'ar' ? 'ملاحظات وتبرير الفارق (إن وجد):' : 'Closing Notes / Justification:'}
                    </label>
                    <input
                      type="text"
                      value={auditNotes}
                      onChange={e => setAuditNotes(e.target.value)}
                      placeholder={language === 'ar' ? 'سبب الفائض أو العجز أو تسليم العهدة...' : 'Notes regarding variance...'}
                      className="w-full text-xs py-2 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Confirm Close Button */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCloseShiftSubmit}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-xs shadow-lg shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{language === 'ar' ? 'اعتماد الجرد وإغلاق وتسليم الوردية' : 'Approve Audit & Close Shift'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CASH MOVEMENTS (إيداع وسحب) */}
          {activeTab === 'movement' && activeShift && (
            <div className="space-y-6 max-w-lg mx-auto">
              <div className="text-center space-y-1">
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  {language === 'ar' ? 'تسجيل إيداع أو سحب نقدي من الدرج' : 'Record Cash In / Cash Out'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {language === 'ar'
                    ? 'يتم توثيق كل حركة في سجل الوردية مع تحديث رصيد الدرج المتوقع فورياً.'
                    : 'All cash in/out events are stamped with cashier name and timestamp.'}
                </p>
              </div>

              <form onSubmit={handleCashMovementSubmit} className="space-y-4 bg-slate-50 dark:bg-slate-800/60 p-5 rounded-3xl border border-slate-200 dark:border-slate-700">
                {/* Movement Type Radio */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMovementType('cash_in')}
                    className={`py-3 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 border transition-all ${
                      movementType === 'cash_in'
                        ? 'bg-emerald-500 text-white border-emerald-600 shadow-md shadow-emerald-500/20'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <ArrowDownCircle className="w-4 h-4" />
                    <span>{language === 'ar' ? 'إيداع نقدي (Cash In)' : 'Cash In'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMovementType('cash_out')}
                    className={`py-3 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 border transition-all ${
                      movementType === 'cash_out'
                        ? 'bg-rose-500 text-white border-rose-600 shadow-md shadow-rose-500/20'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <ArrowUpCircle className="w-4 h-4" />
                    <span>{language === 'ar' ? 'سحب نقدي (Cash Out)' : 'Cash Out'}</span>
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'ar' ? 'المبلغ:' : 'Amount:'}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={movementAmount}
                      onChange={e => setMovementAmount(e.target.value)}
                      placeholder="0.00"
                      required
                      className="w-full py-2.5 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-base font-black font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <span className="absolute end-3 top-3 text-xs text-slate-400 font-bold">
                      {settings.currency.symbol}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'ar' ? 'السبب والبيان:' : 'Reason / Note:'}
                  </label>
                  <input
                    type="text"
                    value={movementReason}
                    onChange={e => setMovementReason(e.target.value)}
                    placeholder={
                      movementType === 'cash_in'
                        ? (language === 'ar' ? 'مثال: إضافة فكة نقدية، دعم من الخزينة...' : 'e.g. Added change float...')
                        : (language === 'ar' ? 'مثال: تسديد فواتير كهرباء، مسحوبات مالك، مصاريف نقل...' : 'e.g. Vendor payment, owner withdrawal...')
                    }
                    required
                    className="w-full py-2.5 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs hover:bg-slate-800 dark:hover:bg-slate-100 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{language === 'ar' ? 'تسجيل الحركة وتحديث الدرج' : 'Save Movement'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: SHIFT HISTORY (سجل الورديات) */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {language === 'ar' ? 'سجل الورديات المغلقة والسابقة' : 'Archived Shifts History'}
                </h3>
                <span className="text-xs font-bold text-slate-500">
                  {shifts.length} {language === 'ar' ? 'وردية مسجلة' : 'shifts'}
                </span>
              </div>

              {shifts.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  {language === 'ar' ? 'لا يوجد سجل ورديات سابقة حتى الآن' : 'No previous shifts recorded yet.'}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {shifts.map(sh => (
                    <div
                      key={sh.id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900 dark:text-white">
                            الوردية #{sh.shiftNumber}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            sh.status === 'open'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                          }`}>
                            {sh.status === 'open' ? 'نشطة حالياً' : 'مغلقة'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {sh.cashierName} • {new Date(sh.openedAt).toLocaleDateString(language === 'ar' ? 'ar-SY' : 'en-US')}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-end">
                          <div className="text-[10px] text-slate-400">{language === 'ar' ? 'مبيعات الكاش' : 'Cash Sales'}</div>
                          <div className="font-black font-mono text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(sh.cashSales || 0)}
                          </div>
                        </div>

                        {sh.actualCash !== undefined && (
                          <div className="text-end">
                            <div className="text-[10px] text-slate-400">{language === 'ar' ? 'النتيجة' : 'Result'}</div>
                            <div className={`font-black font-mono ${
                              (sh.discrepancy || 0) === 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : (sh.discrepancy || 0) > 0
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }`}>
                              {(sh.discrepancy || 0) === 0 ? 'مطابق' : `${(sh.discrepancy || 0) > 0 ? '+' : ''}${formatCurrency(sh.discrepancy || 0)}`}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleShareShiftWhatsApp(sh)}
                            className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 transition-colors"
                            title="مشاركة عبر واتساب"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850/80 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>{language === 'ar' ? 'محفوظ محلياً ومشفر في IndexedDB' : 'Securely recorded in offline database'}</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
          >
            {language === 'ar' ? 'إغلاق النافذة' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );
};
