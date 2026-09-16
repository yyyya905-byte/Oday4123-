import React, { useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Sale, Refund } from '../../types';
import { Printer, X, RotateCcw, CheckCircle2, Barcode as BarcodeIcon, FileText } from 'lucide-react';
import { generateBarcodeSvg } from '../../utils/barcodeUtils';

interface PrintableReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  refund: (Refund & { returnNumber?: string; originalInvoiceNumber?: string; totalRefund?: number; refundMethod?: string }) | null;
  originalSale?: Sale | null;
}

export const PrintableReturnModal: React.FC<PrintableReturnModalProps> = ({
  isOpen,
  onClose,
  refund,
  originalSale
}) => {
  const { settings, formatCurrency, language } = useApp();
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !refund) return null;

  const returnNum = refund.returnNumber || refund.refundNumber || `REF-${refund.id}`;
  const invNum = refund.originalInvoiceNumber || refund.invoiceNumber || (originalSale ? originalSale.invoiceNumber : '—');
  const refundTotal = refund.totalRefund ?? refund.totalRefundAmount ?? 0;
  const returnDate = refund.createdAt ? new Date(refund.createdAt).toLocaleString(language === 'ar' ? 'ar-SY' : 'en-US') : new Date().toLocaleString();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
        {/* Header Bar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                إشعار استرجاع بضاعة معتمد
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">
                {returnNum}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Voucher Paper */}
        <div className="p-5 overflow-y-auto max-h-[75vh] flex justify-center bg-slate-100 dark:bg-slate-950/50">
          <div
            id="printable-return-voucher"
            ref={printRef}
            className="bg-white text-slate-900 font-sans border border-slate-200 rounded-2xl shadow-xs print:border-none print:shadow-none"
            style={{
              width: settings.printPaperSize === '58mm' ? '54mm' : '76mm',
              maxWidth: '100%',
              margin: '0 auto',
              paddingTop: `${settings.receiptTopMarginMm ?? 3}mm`,
              paddingBottom: `${settings.receiptBottomMarginMm ?? 4}mm`,
              paddingRight: `${settings.receiptRightMarginMm ?? 3}mm`,
              paddingLeft: `${settings.receiptLeftMarginMm ?? 3}mm`,
              boxSizing: 'border-box'
            }}
          >
            {/* Store Branding */}
            <div className="text-center pb-3 border-b border-dashed border-slate-300">
              <h1 className="text-base font-black text-slate-900">{settings.storeNameAr}</h1>
              {settings.storeNameEn && (
                <p className="text-[10px] text-slate-500 font-semibold">{settings.storeNameEn}</p>
              )}
              {settings.phone && (
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">هاتف: {settings.phone}</p>
              )}
              <div className="inline-block mt-2 px-3 py-1 bg-rose-50 text-rose-700 rounded-full border border-rose-200 text-xs font-black">
                إشعار إرجاع بضاعة (Sales Return Voucher)
              </div>
            </div>

            {/* Voucher Metadata */}
            <div className="py-2.5 space-y-1 text-[11px] border-b border-dashed border-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">رقم إشعار المرتجع:</span>
                <span className="font-mono font-bold">{returnNum}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">الفاتورة الأصلية:</span>
                <span className="font-mono font-bold text-amber-600">{invNum}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">تاريخ ووقت الإرجاع:</span>
                <span className="font-mono">{returnDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">الكاشير المستلم:</span>
                <span className="font-bold">{refund.cashierName || 'الكاشير'}</span>
              </div>
              {originalSale?.customerName && (
                <div className="flex justify-between">
                  <span className="text-slate-500">العميل:</span>
                  <span className="font-bold">{originalSale.customerName}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">سبب الإرجاع:</span>
                <span className="font-medium text-slate-800">{refund.reason || 'إرجاع بضاعة'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">حالة المخزون:</span>
                <span className="font-bold text-emerald-700">
                  {refund.restock ? 'أعيدت البضاعة للمستودع (+ مخزون)' : 'لم تعد للمخزون (تالف)'}
                </span>
              </div>
            </div>

            {/* Returned Items Table */}
            <div className="py-2.5 border-b border-dashed border-slate-300">
              <span className="text-[11px] font-bold text-slate-700 block mb-1.5">الأصناف المسترجعة:</span>
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="pb-1 text-start">الصنف</th>
                    <th className="pb-1 text-center">الكمية</th>
                    <th className="pb-1 text-end">السعر</th>
                    <th className="pb-1 text-end">المجموع</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(refund.items || []).map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-1.5 text-slate-900 font-medium">
                        {item.productName}
                      </td>
                      <td className="py-1.5 text-center font-mono font-bold">
                        {item.quantity}
                      </td>
                      <td className="py-1.5 text-end font-mono text-slate-600">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="py-1.5 text-end font-mono font-bold text-rose-700">
                        {formatCurrency(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Refund Financial Summary */}
            <div className="py-3 border-b border-dashed border-slate-300 space-y-1 text-xs">
              <div className="flex justify-between items-center text-sm font-black text-rose-700">
                <span>المبلغ المسترد للعميل:</span>
                <span className="font-mono text-base">{formatCurrency(refundTotal)}</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-600">
                <span>طريقة استرداد المبلغ:</span>
                <span className="font-bold">
                  {refund.refundMethod === 'credit_debt' 
                    ? 'خصم من رصيد الدين للعميل' 
                    : refund.refundMethod === 'card' 
                    ? 'بطاقة بنكية / تحويل' 
                    : 'نقداً (Cash)'}
                </span>
              </div>
            </div>

            {/* Barcode of Return Voucher */}
            <div className="my-3 flex flex-col items-center justify-center">
              <div
                className="max-w-full overflow-hidden flex justify-center"
                dangerouslySetInnerHTML={{
                  __html: generateBarcodeSvg(returnNum, {
                    width: 240,
                    height: 48,
                    fontSize: 9,
                    showText: true,
                    barColor: '#000000',
                    bgColor: '#ffffff'
                  })
                }}
              />
              <span className="text-[9px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                <BarcodeIcon className="w-3 h-3 text-slate-400" />
                باركود إشعار المرتجع المعتمد
              </span>
            </div>

            {/* Signatures */}
            <div className="pt-2 text-[10px] grid grid-cols-2 gap-4 text-center text-slate-500">
              <div className="border-t border-slate-300 pt-1">
                <p className="font-semibold">توقيع المستلم (الكاشير)</p>
              </div>
              <div className="border-t border-slate-300 pt-1">
                <p className="font-semibold">توقيع العميل</p>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center pt-3 text-[9px] text-slate-400">
              <p>نظام كيان كاشير الذكي لإدارة نقاط البيع والمرتجعات</p>
            </div>

            {/* Thermal Cutter Safe Clearance Feed Space */}
            <div
              style={{
                height: `${settings.receiptBottomCutFeedMm ?? 18}mm`,
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              className="relative no-print group"
            >
              <div className="w-full border-b border-dashed border-rose-300 dark:border-rose-700/60 my-auto relative">
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full text-[8px] font-bold flex items-center gap-1 border border-rose-200">
                  ✂ خط قاطع الطابعة الحرارية ({settings.receiptBottomCutFeedMm ?? 18}mm)
                </span>
              </div>
            </div>
            {/* Blank Feed Spacer for Print Hardware */}
            <div
              className="hidden print:block"
              style={{ height: `${settings.receiptBottomCutFeedMm ?? 18}mm` }}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex gap-2 no-print">
          <button
            onClick={handlePrint}
            className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة الإشعار الحراري</span>
          </button>
          <button
            onClick={onClose}
            className="px-5 py-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition-all"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
