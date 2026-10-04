import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Sale, Customer, DebtTransaction } from '../../types';
import { AccountStatementModal } from '../debts/AccountStatementModal';
import { PrintableVoucherModal } from '../debts/PrintableVoucherModal';
import {
  FileSpreadsheet,
  Search,
  Printer,
  RotateCcw,
  Eye,
  Calendar as CalendarIcon,
  DollarSign,
  User,
  X,
  CreditCard,
  Banknote,
  Send,
  Sparkles,
  Download,
  Filter,
  CheckCircle2,
  TrendingUp,
  Receipt,
  Clock,
  ArrowUpDown,
  Sliders,
} from 'lucide-react';
import { PrintableReceiptModal } from '../pos/PrintableReceiptModal';
import { ReceiptCustomizerModal } from '../modals/ReceiptCustomizerModal';
import { DateRangePicker } from '../ui/DateRangePicker';
import {
  CivilDateRange,
  isCivilDateInRange,
  formatCivilDateRangeDisplay,
  getCivilToday,
  getCivilYesterday,
  getCivilDaysAgo,
  getCivilMonthStart,
  getCivilMonthEnd,
} from '../../utils/civilDate';

export const InvoicesView: React.FC = () => {
  const {
    sales,
    customers,
    formatCurrency,
    t,
    language,
    settings,
    setActiveTab,
    navigateToReturnWithInvoice
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<CivilDateRange>({
    from: undefined,
    to: undefined,
  });
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isCustomizerModalOpen, setIsCustomizerModalOpen] = useState(false);
  const [statementCustomer, setStatementCustomer] = useState<Customer | null>(null);
  const [isStatementOpen, setIsStatementOpen] = useState(false);
  const [selectedVoucherForPrint, setSelectedVoucherForPrint] = useState<DebtTransaction | null>(null);

  const resolveCustomerFromSale = (sale: Sale): Customer | null => {
    if (sale.customerId) {
      const byId = customers.find(c => c.id === sale.customerId);
      if (byId) return byId;
    }
    if (sale.customerCode) {
      const byCode = customers.find(c => c.customerCode === sale.customerCode);
      if (byCode) return byCode;
    }
    if (sale.customerName) {
      const byName = customers.find(c => c.name === sale.customerName);
      if (byName) return byName;
    }
    return customers[0] || null;
  };

  // Determine active preset
  const activePreset = useMemo(() => {
    const today = getCivilToday();
    const yest = getCivilYesterday();
    const last7 = getCivilDaysAgo(6);
    const mStart = getCivilMonthStart();
    const mEnd = getCivilMonthEnd();

    if (!dateRange.from && !dateRange.to) return 'all';
    if (dateRange.from === today && dateRange.to === today) return 'today';
    if (dateRange.from === yest && dateRange.to === yest) return 'yesterday';
    if (dateRange.from === last7 && dateRange.to === today) return 'last7';
    if (dateRange.from === mStart && dateRange.to === mEnd) return 'thisMonth';
    return 'custom';
  }, [dateRange]);

  const handleApplyPreset = (preset: 'all' | 'today' | 'yesterday' | 'last7' | 'thisMonth') => {
    switch (preset) {
      case 'all':
        setDateRange({ from: undefined, to: undefined });
        break;
      case 'today': {
        const today = getCivilToday();
        setDateRange({ from: today, to: today });
        break;
      }
      case 'yesterday': {
        const yest = getCivilYesterday();
        setDateRange({ from: yest, to: yest });
        break;
      }
      case 'last7':
        setDateRange({ from: getCivilDaysAgo(6), to: getCivilToday() });
        break;
      case 'thisMonth':
        setDateRange({ from: getCivilMonthStart(), to: getCivilMonthEnd() });
        break;
    }
  };

  // Filter sales by civil date range and text search query
  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      // 1. Date Range Filter using strict Civil Date (never parsed as UTC)
      if (!isCivilDateInRange(s.createdAt, dateRange)) {
        return false;
      }

      // 2. Text Search Query
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        s.invoiceNumber.toLowerCase().includes(q) ||
        (s.customerName && s.customerName.toLowerCase().includes(q)) ||
        s.cashierName.toLowerCase().includes(q)
      );
    });
  }, [sales, dateRange, searchQuery]);

  // Financial KPIs for the selected date range
  const kpis = useMemo(() => {
    const totalAmount = filteredSales.reduce((acc, s) => acc + s.total, 0);
    const totalCount = filteredSales.length;
    const cashAmount = filteredSales
      .filter(s => s.paymentMethod === 'cash')
      .reduce((acc, s) => acc + s.total, 0);
    const cardAmount = filteredSales
      .filter(s => s.paymentMethod === 'card' || s.paymentMethod === 'transfer')
      .reduce((acc, s) => acc + s.total, 0);
    const otherAmount = totalAmount - cashAmount - cardAmount;
    const avgOrder = totalCount > 0 ? totalAmount / totalCount : 0;
    return {
      totalAmount,
      totalCount,
      cashAmount,
      cardAmount,
      otherAmount,
      avgOrder,
    };
  }, [filteredSales]);

  const handleViewDetails = (sale: Sale) => {
    setSelectedSale(sale);
    setIsDetailModalOpen(true);
  };

  const handlePrintReceipt = (sale: Sale) => {
    setSelectedSale(sale);
    setIsReceiptModalOpen(true);
  };

  const handleExportCSV = () => {
    if (filteredSales.length === 0) return;
    const headers = ['رقم الفاتورة', 'التاريخ والوقت', 'العميل', 'الكاشير', 'طريقة الدفع', 'عدد الأصناف', 'المبلغ الإجمالي'];
    const rows = filteredSales.map(s => [
      s.invoiceNumber,
      `"${new Date(s.createdAt).toLocaleString('ar-SY')}"`,
      `"${s.customerName || 'عميل نقدي'}"`,
      `"${s.cashierName}"`,
      `"${s.paymentMethod}"`,
      s.items.reduce((sum, it) => sum + it.quantity, 0),
      s.total
    ]);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `invoices_export_${dateRange.from || 'all'}_to_${dateRange.to || 'all'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const hasActiveDateFilter = Boolean(dateRange.from || dateRange.to);

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-5 bg-slate-50/50 dark:bg-slate-950">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Receipt className="w-6 h-6 text-amber-500" />
            <span>{t('invoicesHistoryTitle')}</span>
            <span className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold px-2 py-0.5 rounded-full">
              {filteredSales.length} من أصل {sales.length} فاتورة
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            عرض الفواتير باستخدام التاريخ وفلاتر الفترات المخصصة، إعادة طباعة الإيصالات، ومتابعة المتحصلات
          </p>
        </div>

        <div className="flex items-center gap-2">
          {filteredSales.length > 0 && (
            <button
              onClick={handleExportCSV}
              className="px-3 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              title="تصدير الفواتير المعروضة إلى ملف Excel/CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>تصدير CSV</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (customers.length > 0) {
                setStatementCustomer(customers[0]);
              }
              setIsStatementOpen(true);
            }}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>كشف حساب عميل</span>
          </button>

          <button
            onClick={() => setIsCustomizerModalOpen(true)}
            id="btn-invoices-receipt-customizer"
            className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-black text-xs rounded-xl border border-amber-300/80 dark:border-amber-700/80 shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            title="تخصيص شكل وحقول الفاتورة (الشعار، الرقم الضريبي، ملاحظات العميل، ورسالة التذييل)"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>تخصيص شكل الفاتورة</span>
          </button>

          <button
            onClick={() => setActiveTab('returns')}
            className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-bold text-xs rounded-xl border border-rose-200 dark:border-rose-800/60 shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-rose-500" />
            <span>مسح باركود وإرجاع بضاعة</span>
          </button>
        </div>
      </div>

      {/* Date Filtering Bar & Controls */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
        {/* Presets and Custom Range Picker */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Quick Date Presets */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1 shrink-0 me-1">
              <CalendarIcon className="w-3.5 h-3.5 text-amber-500" />
              <span>فترة العرض:</span>
            </span>

            <button
              type="button"
              onClick={() => handleApplyPreset('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activePreset === 'all'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              جميع التواريخ
            </button>

            <button
              type="button"
              onClick={() => handleApplyPreset('today')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activePreset === 'today'
                  ? 'bg-amber-500 text-slate-950 shadow-xs ring-1 ring-amber-500'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              فواتير اليوم
            </button>

            <button
              type="button"
              onClick={() => handleApplyPreset('yesterday')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activePreset === 'yesterday'
                  ? 'bg-amber-500 text-slate-950 shadow-xs ring-1 ring-amber-500'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              فواتير أمس
            </button>

            <button
              type="button"
              onClick={() => handleApplyPreset('last7')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activePreset === 'last7'
                  ? 'bg-amber-500 text-slate-950 shadow-xs ring-1 ring-amber-500'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              آخر 7 أيام
            </button>

            <button
              type="button"
              onClick={() => handleApplyPreset('thisMonth')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activePreset === 'thisMonth'
                  ? 'bg-amber-500 text-slate-950 shadow-xs ring-1 ring-amber-500'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              هذا الشهر
            </button>
          </div>

          {/* Dedicated Date Range Picker Component */}
          <div className="flex items-center gap-2 shrink-0">
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
              language={language}
              placeholder="تحديد نطاق زمني للفواتير..."
              className="w-full sm:w-auto"
              align="end"
            />

            {hasActiveDateFilter && (
              <button
                type="button"
                onClick={() => setDateRange({ from: undefined, to: undefined })}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shrink-0"
                title="إلغاء فلتر التاريخ وعرض الكل"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Search Input & Active Filter Summary */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="w-full sm:flex-1 relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute start-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="بحث برقم الفاتورة، اسم العميل، أو الكاشير..."
              className="w-full bg-slate-50 dark:bg-slate-800/60 ps-9 pe-4 py-2 rounded-2xl text-xs font-medium text-slate-900 dark:text-white border border-slate-200/80 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500/40"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute end-2.5 p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Active Period Feedback Badge */}
          <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span>النطاق النشط:</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-xl">
              {formatCivilDateRangeDisplay(dateRange, language)}
            </span>
          </div>
        </div>
      </div>

      {/* Date Range Financial Summary Metrics Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-bold">إجمالي فواتير الفترة</span>
            <Receipt className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-mono">
            {kpis.totalCount} <span className="text-xs font-normal text-slate-400">فاتورة</span>
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-bold">مبيعات الفترة المحددة</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {formatCurrency(kpis.totalAmount)}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-bold">المتحصل نقداً (Cash)</span>
            <Banknote className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-mono">
            {formatCurrency(kpis.cashAmount)}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-bold">متوسط قيمة الفاتورة</span>
            <TrendingUp className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-mono">
            {formatCurrency(kpis.avgOrder)}
          </p>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4 text-start">رقم الفاتورة</th>
                <th className="py-3 px-3 text-start">التاريخ والوقت</th>
                <th className="py-3 px-3 text-start">العميل</th>
                <th className="py-3 px-3 text-start">الكاشير</th>
                <th className="py-3 px-3 text-start">طريقة الدفع</th>
                <th className="py-3 px-3 text-center">عدد الأصناف</th>
                <th className="py-3 px-3 text-end">المبلغ الإجمالي</th>
                <th className="py-3 px-4 text-end">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <FileSpreadsheet className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      لا توجد فواتير مطابقة للفترة المحددة أو شروط البحث
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1 font-mono">
                      الفترة: {formatCivilDateRangeDisplay(dateRange, language)}
                    </p>
                    {hasActiveDateFilter && (
                      <button
                        type="button"
                        onClick={() => setDateRange({ from: undefined, to: undefined })}
                        className="mt-3 px-3 py-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 font-bold text-xs rounded-xl transition-all cursor-pointer"
                      >
                        إلغاء تصفية التاريخ وعرض جميع الفواتير
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredSales.map(sale => (
                  <tr key={sale.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {sale.invoiceNumber}
                    </td>
                    <td className="py-3 px-3 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                      {new Date(sale.createdAt).toLocaleString(language === 'ar' ? 'ar-SY' : 'en-US')}
                    </td>
                    <td className="py-3 px-3 text-slate-800 dark:text-slate-200 font-medium">
                      {sale.customerName || 'عميل نقدي'}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                      {sale.cashierName}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {sale.paymentMethod === 'cash' ? 'نقداً (Cash)' : sale.paymentMethod === 'card' ? 'بطاقة' : sale.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono">
                      {sale.items.reduce((acc, it) => acc + it.quantity, 0)}
                    </td>
                    <td className="py-3 px-3 text-end font-mono font-bold text-amber-600 dark:text-amber-400 text-sm">
                      {formatCurrency(sale.total)}
                    </td>
                    <td className="py-3 px-4 text-end">
                      <div className="flex items-center justify-end gap-1">
                        {(sale.customerId || sale.customerName) && (
                          <button
                            type="button"
                            onClick={() => {
                              const cust = resolveCustomerFromSale(sale);
                              setStatementCustomer(cust);
                              setIsStatementOpen(true);
                            }}
                            className="px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                            title="عرض كشف الحساب التفصيلي للعميل"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                            <span>كشف حساب</span>
                          </button>
                        )}
                        <button
                          onClick={() => navigateToReturnWithInvoice(sale)}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          title="إرجاع بضاعة من الفاتورة"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleViewDetails(sale)}
                          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="عرض تفاصيل الفاتورة"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handlePrintReceipt(sale)}
                          className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                          title="طباعة الإيصال"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Detail Modal */}
      {isDetailModalOpen && selectedSale && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  تفاصيل الفاتورة #{selectedSale.invoiceNumber}
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(selectedSale.createdAt).toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              {/* Meta information */}
              <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
                <div>
                  <span className="text-slate-400 block">العميل:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedSale.customerName || 'عميل نقدي'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">الكاشير:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedSale.cashierName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">طريقة الدفع:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedSale.paymentMethod}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">النقاط المكتسبة:</span>
                  <span className="font-bold text-amber-600">+{selectedSale.pointsEarned} نقطة</span>
                </div>
              </div>

              {/* Items */}
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2">الأصناف المشتراة:</h4>
                <div className="space-y-1.5">
                  {selectedSale.items.map((it, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex justify-between items-center"
                    >
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{it.productNameAr}</p>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {it.quantity} × {formatCurrency(it.unitPrice)}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {formatCurrency(it.total)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial summary */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1 text-slate-600 dark:text-slate-400">
                <div className="flex justify-between">
                  <span>المجموع الفرعي:</span>
                  <span className="font-mono">{formatCurrency(selectedSale.subtotal)}</span>
                </div>
                {selectedSale.discountTotal > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>إجمالي الخصم:</span>
                    <span className="font-mono">-{formatCurrency(selectedSale.discountTotal)}</span>
                  </div>
                )}
                {selectedSale.taxTotal > 0 && (
                  <div className="flex justify-between">
                    <span>الضريبة:</span>
                    <span className="font-mono">+{formatCurrency(selectedSale.taxTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span>المبلغ الإجمالي:</span>
                  <span className="font-mono text-amber-600 dark:text-amber-400">{formatCurrency(selectedSale.total)}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    setIsReceiptModalOpen(true);
                  }}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة الإيصال الحراري</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const cust = resolveCustomerFromSale(selectedSale);
                    setIsDetailModalOpen(false);
                    setStatementCustomer(cust);
                    setIsStatementOpen(true);
                  }}
                  className="px-3.5 py-2.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>كشف حساب العميل</span>
                </button>
                <button
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    navigateToReturnWithInvoice(selectedSale);
                  }}
                  className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>إرجاع بضاعة</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      <PrintableReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        sale={selectedSale}
      />

      {/* Real-time Receipt Customizer Modal */}
      <ReceiptCustomizerModal
        isOpen={isCustomizerModalOpen}
        onClose={() => setIsCustomizerModalOpen(false)}
      />

      {/* Account Statement Modal */}
      <AccountStatementModal
        isOpen={isStatementOpen}
        onClose={() => setIsStatementOpen(false)}
        partyType="customer"
        party={statementCustomer}
        onSelectVoucher={voucher => {
          setIsStatementOpen(false);
          setSelectedVoucherForPrint(voucher);
        }}
      />

      {/* Printable Voucher Modal */}
      <PrintableVoucherModal
        isOpen={Boolean(selectedVoucherForPrint)}
        onClose={() => setSelectedVoucherForPrint(null)}
        voucher={selectedVoucherForPrint}
      />
    </div>
  );
};
