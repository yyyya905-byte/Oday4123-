import React from 'react';
import { useApp } from '../../context/AppContext';
import { DebtTransaction } from '../../types';
import { Printer, X, CheckCircle2, Building2, Phone, Calendar, User, FileText, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

interface PrintableVoucherModalProps {
  voucher: DebtTransaction | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PrintableVoucherModal: React.FC<PrintableVoucherModalProps> = ({
  voucher,
  isOpen,
  onClose
}) => {
  const { settings, formatCurrency, language } = useApp();

  if (!isOpen || !voucher) return null;

  const isCustomerPayment = voucher.partyType === 'customer' && voucher.type === 'payment';
  const isSupplierPayment = voucher.partyType === 'supplier' && voucher.type === 'payment';
  const isCustomerCharge = voucher.partyType === 'customer' && voucher.type === 'charge';
  const isSupplierCharge = voucher.partyType === 'supplier' && voucher.type === 'charge';

  const voucherTitle = isCustomerPayment
    ? 'سند قبض مالي (Receipt Voucher)'
    : isSupplierPayment
    ? 'سند صرف مالي (Payment Voucher)'
    : isCustomerCharge
    ? 'قيد ذمة مدينة (Debit Note)'
    : 'فاتورة قيد دائن (Credit Note)';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-4">
        {/* Modal Controls (Not printed) */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                معاينة وطباعة السند المالي
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                {voucher.voucherNumber}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة السند</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Voucher Document Container */}
        <div className="p-6 sm:p-8 bg-white text-slate-900 space-y-6 print:p-0 print:m-0" id="printable-voucher-content">
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
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
              <p className="text-xs text-slate-600 font-bold mt-0.5">
                {settings.tagline || 'نظام إدارة المبيعات ونقاط البيع المتكامل'}
              </p>
              {settings.phone && (
                <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono mt-1">
                  <Phone className="w-3 h-3" />
                  <span>{settings.phone}</span>
                </div>
              )}
            </div>

            <div className="text-end">
              <div className={`inline-block px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider mb-1 ${
                isCustomerPayment
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : isSupplierPayment
                  ? 'bg-rose-100 text-rose-900 border border-rose-300'
                  : 'bg-indigo-100 text-indigo-900 border border-indigo-300'
              }`}>
                {voucherTitle}
              </div>
              <div className="text-xs font-mono font-bold text-slate-700">
                رقم السند: <strong className="text-slate-950">{voucher.voucherNumber}</strong>
              </div>
              <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                التاريخ: {new Date(voucher.createdAt).toLocaleString(language === 'ar' ? 'ar-SY' : 'en-US')}
              </div>
            </div>
          </div>

          {/* Amount Badge Big Box */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-bold block mb-0.5">
                المبلغ بالأرقام ({settings.currency.symbol}):
              </span>
              <span className="text-3xl font-black font-mono text-slate-950 tracking-tight">
                {formatCurrency(voucher.amount)}
              </span>
              {voucher.discountAmount ? (
                <div className="text-xs text-emerald-700 font-bold mt-1">
                  + خصم تسوية ممنوح: {formatCurrency(voucher.discountAmount)}
                </div>
              ) : null}
            </div>

            <div className="text-end border-s border-slate-200 ps-4">
              <span className="text-xs text-slate-500 font-bold block">
                طريقة الدفع / التسليم:
              </span>
              <span className="text-sm font-extrabold text-slate-900 block mt-0.5">
                {voucher.paymentMethod === 'cash' ? '💵 نقداً (كاش)' :
                 voucher.paymentMethod === 'card' ? '💳 بطاقة بنكية' :
                 voucher.paymentMethod === 'transfer' ? '🏦 حوالة مالية' : '📝 شيك مصرفي'}
              </span>
            </div>
          </div>

          {/* Party Details & Narrative */}
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2 p-3 bg-slate-50/70 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-500 min-w-[90px]">
                {voucher.partyType === 'customer' ? 'اسم الزبون:' : 'اسم المورد:'}
              </span>
              <span className="font-black text-slate-950 text-base">
                {voucher.partyName}
              </span>
            </div>

            <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-500">الرصيد السابق قبل هذه العملية:</span>
                <span className="font-mono font-bold text-slate-700">{formatCurrency(voucher.previousBalance)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-500">
                  {voucher.type === 'payment' ? 'المبلغ المسدد والحسم:' : 'قيمة القيد المضاف:'}
                </span>
                <span className="font-mono font-bold text-slate-900">
                  {voucher.type === 'payment' ? `-${formatCurrency(voucher.amount + (voucher.discountAmount || 0))}` : `+${formatCurrency(voucher.amount)}`}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm pt-1.5 border-t border-slate-200">
                <span className="font-black text-slate-950">الرصيد الصافي المتبقي بعد السند:</span>
                <span className="font-mono font-black text-slate-950 text-base">{formatCurrency(voucher.newBalance)}</span>
              </div>
            </div>

            {voucher.referenceInvoice && (
              <div className="text-xs text-slate-600">
                <strong className="text-slate-800">رقم الفاتورة المرجعية:</strong> {voucher.referenceInvoice}
              </div>
            )}

            {voucher.notes && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700">
                <strong className="block text-slate-900 mb-0.5">البيان / الملاحظات:</strong>
                {voucher.notes}
              </div>
            )}
          </div>

          {/* Signatures */}
          <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs">
            <div>
              <span className="block font-bold text-slate-500 mb-8">
                توقيع المنظم / المحاسب: ({voucher.recordedBy})
              </span>
              <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto"></div>
            </div>
            <div>
              <span className="block font-bold text-slate-500 mb-8">
                توقيع المستلم / العميل:
              </span>
              <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto"></div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center text-[10px] text-slate-400 pt-4">
            تم إصدار هذا المستند رسمياً عبر {settings.storeNameAr || 'كيان كاشير'} — نظام المحاسبة والديون
          </div>
        </div>
      </div>
    </div>
  );
};
