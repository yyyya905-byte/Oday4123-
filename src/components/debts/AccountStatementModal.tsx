import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Customer, Supplier, DebtTransaction } from '../../types';
import {
  Printer,
  X,
  FileSpreadsheet,
  Download,
  Calendar,
  User,
  Building2,
  Phone,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
  Search,
  Filter
} from 'lucide-react';

interface AccountStatementModalProps {
  partyType: 'customer' | 'supplier';
  party: Customer | Supplier | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectVoucher?: (voucher: DebtTransaction) => void;
}

export const AccountStatementModal: React.FC<AccountStatementModalProps> = ({
  partyType,
  party,
  isOpen,
  onClose,
  onSelectVoucher
}) => {
  const { settings, formatCurrency, debtTransactions, sales, language } = useApp();

  const [dateFilter, setDateFilter] = useState<'all' | 'month' | 'quarter' | 'year'>('all');

  if (!isOpen || !party) return null;

  const partyTxs = useMemo(() => {
    return debtTransactions
      .filter(tx => tx.partyType === partyType && tx.partyId === party.id)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [debtTransactions, partyType, party.id]);

  // Calculations
  const totalCharged = partyTxs
    .filter(tx => tx.type === 'charge')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalPaid = partyTxs
    .filter(tx => tx.type === 'payment')
    .reduce((sum, tx) => sum + tx.amount + (tx.discountAmount || 0), 0);

  const currentBalance = party.currentDebt || 0;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ['رقم السند', 'التاريخ', 'النوع', 'البيان', 'مدين / مضاف', 'دائن / مسدد', 'الرصيد التراكمي', 'بواسطة'];
    const rows = partyTxs.map(tx => [
      tx.voucherNumber,
      new Date(tx.createdAt).toLocaleDateString(),
      tx.type === 'charge' ? 'قيد ذمة' : 'سداد دفعة',
      `"${tx.notes || ''}"`,
      tx.type === 'charge' ? tx.amount : 0,
      tx.type === 'payment' ? (tx.amount + (tx.discountAmount || 0)) : 0,
      tx.newBalance,
      tx.recordedBy
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `كشف_حساب_${party.name}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-4">
        {/* Header Controls (Hidden during print) */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                كشف حساب مالي تفصيلي (Statement of Account)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {partyType === 'customer' ? 'كشف الذمم المدينة للزبون' : 'كشف حساب الذمم الدائنة للمورد'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تصدير Excel/CSV</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة الكشف</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Statement Document */}
        <div className="p-6 sm:p-8 bg-white text-slate-900 space-y-6 max-h-[82vh] overflow-y-auto print:max-h-none print:overflow-visible print:p-0" id="printable-statement-content">
          {/* Header Brand & Party Overview */}
          <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              {settings.logo && (
                <img
                  src={settings.logo}
                  alt={settings.storeNameAr || 'شعار المتجر'}
                  className="max-h-12 max-w-[140px] object-contain mb-1"
                />
              )}
              <h1 className="text-xl font-black text-slate-950 tracking-tight">
                {settings.storeNameAr || 'كيان كاشير'}
              </h1>
              <p className="text-xs text-slate-600 font-bold">
                {settings.tagline || 'نظام إدارة المبيعات ونقاط البيع المتكامل'}
              </p>
              {settings.phone && (
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  هاتف المنشأة: {settings.phone}
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs sm:min-w-[280px]">
              <div className="font-extrabold text-slate-900 text-sm mb-1 flex items-center gap-1.5">
                {partyType === 'customer' ? <User className="w-4 h-4 text-indigo-600" /> : <Building2 className="w-4 h-4 text-amber-600" />}
                <span>{party.name}</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  ({partyType === 'customer' ? (party as Customer).customerCode : (party as Supplier).code})
                </span>
              </div>
              <div className="text-[11px] text-slate-600 flex items-center justify-between">
                <span>الهاتف:</span>
                <span className="font-mono font-bold">{party.phone || 'غير مسجل'}</span>
              </div>
              <div className="text-[11px] text-slate-600 flex items-center justify-between mt-0.5">
                <span>تاريخ إصدار الكشف:</span>
                <span className="font-mono">{new Date().toLocaleDateString(language === 'ar' ? 'ar-SY' : 'en-US')}</span>
              </div>
            </div>
          </div>

          {/* Statement Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 block mb-1">
                إجمالي الديون / المشتريات الآجلة:
              </span>
              <span className="text-xl font-black text-slate-900 font-mono">
                {formatCurrency(totalCharged)}
              </span>
            </div>

            <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200">
              <span className="text-[11px] font-bold text-emerald-800 block mb-1">
                إجمالي المسدد والخصومات:
              </span>
              <span className="text-xl font-black text-emerald-700 font-mono">
                {formatCurrency(totalPaid)}
              </span>
            </div>

            <div className={`p-3.5 rounded-2xl border ${
              currentBalance > 0
                ? 'bg-rose-50 border-rose-200'
                : 'bg-slate-50 border-slate-200'
            }`}>
              <span className={`text-[11px] font-bold block mb-1 ${currentBalance > 0 ? 'text-rose-800' : 'text-slate-500'}`}>
                الرصيد المتبقي المستحق حالياً:
              </span>
              <span className={`text-2xl font-black font-mono tracking-tight ${currentBalance > 0 ? 'text-rose-700' : 'text-slate-900'}`}>
                {formatCurrency(currentBalance)}
              </span>
            </div>
          </div>

          {/* Statement Movements Table */}
          <div>
            <h4 className="text-xs font-black text-slate-900 mb-2 uppercase tracking-wider">
              حركات وسندات الحساب بالتفصيل ({partyTxs.length} حركة):
            </h4>

            {partyTxs.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-400 text-xs">
                لا توجد حركات مسجلة لهذا الحساب حتى الآن
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-xs text-start">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5 text-start">رقم السند</th>
                      <th className="p-2.5 text-start">التاريخ</th>
                      <th className="p-2.5 text-start">نوع الحركة</th>
                      <th className="p-2.5 text-start">البيان والملاحظات</th>
                      <th className="p-2.5 text-end">مدين (+)</th>
                      <th className="p-2.5 text-end">دائن / مسدد (-)</th>
                      <th className="p-2.5 text-end">الرصيد</th>
                      <th className="p-2.5 text-center print:hidden">معاينة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {partyTxs.map(tx => (
                      <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-2.5 font-mono font-bold text-slate-900">
                          {tx.voucherNumber}
                        </td>
                        <td className="p-2.5 text-[11px] text-slate-500 font-mono">
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-2.5">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            tx.type === 'charge'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {tx.type === 'charge' ? 'قيد ذمة آجل' : 'سند تسديد'}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-600 max-w-[220px] truncate">
                          {tx.notes}
                          {tx.referenceInvoice && (
                            <span className="block text-[10px] text-slate-400 font-mono">
                              فاتورة #{tx.referenceInvoice}
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 text-end font-mono font-bold text-slate-900">
                          {tx.type === 'charge' ? formatCurrency(tx.amount) : '-'}
                        </td>
                        <td className="p-2.5 text-end font-mono font-bold text-emerald-700">
                          {tx.type === 'payment' ? formatCurrency(tx.amount + (tx.discountAmount || 0)) : '-'}
                        </td>
                        <td className="p-2.5 text-end font-mono font-black text-slate-950">
                          {formatCurrency(tx.newBalance)}
                        </td>
                        <td className="p-2.5 text-center print:hidden">
                          {onSelectVoucher && (
                            <button
                              type="button"
                              onClick={() => onSelectVoucher(tx)}
                              className="text-[11px] text-amber-600 font-bold hover:underline"
                            >
                              عرض السند
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Statement Closing Notes & Signatures */}
          <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs">
            <div>
              <span className="block font-bold text-slate-500 mb-8">
                ختم وتوقيع المحاسب المعتمد:
              </span>
              <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto"></div>
            </div>
            <div>
              <span className="block font-bold text-slate-500 mb-8">
                توقيع المصادقة على الرصيد:
              </span>
              <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
