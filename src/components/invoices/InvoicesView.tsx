import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Sale } from '../../types';
import {
  FileSpreadsheet,
  Search,
  Printer,
  RotateCcw,
  Eye,
  Calendar,
  DollarSign,
  User,
  X,
  CreditCard,
  Banknote,
  Send,
  Sparkles
} from 'lucide-react';
import { PrintableReceiptModal } from '../pos/PrintableReceiptModal';

export const InvoicesView: React.FC = () => {
  const {
    sales,
    formatCurrency,
    t,
    language,
    settings,
    setActiveTab,
    navigateToReturnWithInvoice
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  const filteredSales = sales.filter(s => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      s.invoiceNumber.toLowerCase().includes(q) ||
      (s.customerName && s.customerName.toLowerCase().includes(q)) ||
      s.cashierName.toLowerCase().includes(q)
    );
  });

  const handleViewDetails = (sale: Sale) => {
    setSelectedSale(sale);
    setIsDetailModalOpen(true);
  };

  const handlePrintReceipt = (sale: Sale) => {
    setSelectedSale(sale);
    setIsReceiptModalOpen(true);
  };

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-5 bg-slate-50/50 dark:bg-slate-950">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>{t('invoicesHistoryTitle')}</span>
            <span className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold px-2 py-0.5 rounded-full">
              {sales.length} فاتورة مسجلة
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            أرشيف الفواتير الصادرة، إعادة طباعة الإيصالات، ومتابعة المدفوعات
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('returns')}
            className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-bold text-xs rounded-xl border border-rose-200 dark:border-rose-800/60 shadow-xs transition-all flex items-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4 text-rose-500" />
            <span>مسح باركود وإرجاع بضاعة</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center gap-2">
        <Search className="w-4 h-4 text-slate-400 ms-2" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="بحث برقم الفاتورة، اسم العميل، أو الكاشير..."
          className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400"
        />
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
                    <p className="text-xs font-bold">لا توجد فواتير مطابقة للبحث</p>
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
              <div className="pt-3 flex gap-2">
                <button
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    setIsReceiptModalOpen(true);
                  }}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة الإيصال الحراري</span>
                </button>
                <button
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    navigateToReturnWithInvoice(selectedSale);
                  }}
                  className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
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
    </div>
  );
};
