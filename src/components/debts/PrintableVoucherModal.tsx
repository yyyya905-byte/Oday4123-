import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { DebtTransaction } from '../../types';
import {
  Printer,
  X,
  CheckCircle2,
  Building2,
  User,
  FileText,
  ArrowDownLeft,
  ArrowUpRight,
  MessageSquareShare,
  Send,
  Copy,
  Check,
  Phone,
  Sparkles,
  ShoppingBag
} from 'lucide-react';
import {
  buildVoucherReceiptWhatsAppMessage,
  sendWhatsAppDebtMessage,
  getWhatsAppClickToChatUrl
} from '../../services/debtCollectionService';

interface PrintableVoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction?: DebtTransaction | null;
  voucher?: DebtTransaction | null;
  autoOpenWhatsAppPanel?: boolean;
}

export const PrintableVoucherModal: React.FC<PrintableVoucherModalProps> = ({
  isOpen,
  onClose,
  transaction: propTransaction,
  voucher: propVoucher,
  autoOpenWhatsAppPanel = true,
}) => {
  const transaction = propTransaction ?? propVoucher ?? null;
  const {
    settings,
    formatCurrency,
    language,
    customers,
    suppliers,
    notify
  } = useApp();

  // Resolve party phone number from customers or suppliers
  const resolvedPartyPhone = useMemo(() => {
    if (!transaction) return '';
    if (transaction.partyType === 'customer') {
      const cust = customers.find(
        c => c.id === transaction.partyId || c.name === transaction.partyName
      );
      return cust?.phone || '';
    } else {
      const sup = suppliers.find(
        s => s.id === transaction.partyId || s.name === transaction.partyName
      );
      return sup?.phone || '';
    }
  }, [transaction, customers, suppliers]);

  const [recipientPhone, setRecipientPhone] = useState<string>('');
  const [showWhatsAppComposer, setShowWhatsAppComposer] = useState<boolean>(autoOpenWhatsAppPanel);
  const [waMessageText, setWaMessageText] = useState<string>('');
  const [isSendingWa, setIsSendingWa] = useState<boolean>(false);
  const [copiedWa, setCopiedWa] = useState<boolean>(false);

  useEffect(() => {
    if (transaction) {
      setRecipientPhone(resolvedPartyPhone);
      setShowWhatsAppComposer(autoOpenWhatsAppPanel);
      const msg = buildVoucherReceiptWhatsAppMessage({
        storeSettings: settings,
        transaction,
        bulletin: settings.exchangeBulletin
      });
      setWaMessageText(msg);
    }
  }, [transaction, resolvedPartyPhone, autoOpenWhatsAppPanel, settings]);

  if (!isOpen || !transaction) return null;

  const isPayment = transaction.type === 'payment';
  const isCustomer = transaction.partyType === 'customer';

  // Determine Voucher Title
  let voucherTitleAr = 'سند قيد مالي';
  let voucherTitleEn = 'FINANCIAL VOUCHER';

  if (isCustomer && isPayment) {
    voucherTitleAr = 'سند قبض (تسديد دفعة زبون)';
    voucherTitleEn = 'RECEIPT VOUCHER';
  } else if (isCustomer && !isPayment) {
    voucherTitleAr = 'إشعار قيد ذمة / مبيعات آجلة';
    voucherTitleEn = 'DEBIT NOTE / CREDIT SALE';
  } else if (!isCustomer && isPayment) {
    voucherTitleAr = 'سند صرف (دفعة لمورد)';
    voucherTitleEn = 'PAYMENT VOUCHER';
  } else if (!isCustomer && !isPayment) {
    voucherTitleAr =
      transaction.purchaseItems && transaction.purchaseItems.length > 0
        ? 'فاتورة وسند توريد مشتريات'
        : 'سند قيد فاتورة مشتريات آجلة';
    voucherTitleEn = 'SUPPLIER PURCHASE INVOICE VOUCHER';
  }

  const paymentMethodLabel: Record<string, string> = {
    cash: 'نقداً (Cash)',
    card: 'بطاقة إلكترونية (Card)',
    transfer: 'حوالة مالية (Transfer)',
    check: 'شيك مصرفي (Check)',
  };

  // Dedicated iframe printing so it prints cleanly in any browser/iframe environment
  const handlePrintVoucher = () => {
    const currencySym = settings.currency.symbolNative || settings.currency.symbol || 'ل.س';
    const dateStr = new Date(transaction.createdAt).toLocaleString(
      language === 'ar' ? 'ar-SY' : 'en-US'
    );
    const methodStr =
      paymentMethodLabel[transaction.paymentMethod || 'cash'] || 'نقداً';
    const discount = transaction.discountAmount || 0;

    const purchaseItemsHtml =
      transaction.purchaseItems && transaction.purchaseItems.length > 0
        ? `
        <div style="margin-top: 14px;">
          <div style="font-size: 12px; font-weight: 800; margin-bottom: 6px; color: #1e293b;">
            تفاصيل الأصناف الموردة (${transaction.purchaseItems.length} صنف):
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
            <thead>
              <tr style="background: #f1f5f9; border-bottom: 1px solid #cbd5e1;">
                <th style="padding: 6px; text-align: right;">الصنف</th>
                <th style="padding: 6px; text-align: center;">الكمية</th>
                <th style="padding: 6px; text-align: left;">سعر الشراء</th>
                <th style="padding: 6px; text-align: left;">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              ${transaction.purchaseItems
                .map(
                  it => `
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 5px 6px; font-weight: 700;">${it.productName}</td>
                  <td style="padding: 5px 6px; text-align: center; font-family: monospace;">${it.quantity} ${it.unit || 'قطعة'}</td>
                  <td style="padding: 5px 6px; text-align: left; font-family: monospace;">${it.costPrice.toLocaleString()} ${currencySym}</td>
                  <td style="padding: 5px 6px; text-align: left; font-family: monospace; font-weight: 800;">${it.totalCost.toLocaleString()} ${currencySym}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      `
        : '';

    const htmlContent = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8" />
  <title>${voucherTitleAr} - ${transaction.voucherNumber}</title>
  <style>
    @page { size: A5 landscape; margin: 10mm; }
    * { box-sizing: border-box; font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif; }
    body { margin: 0; padding: 16px; color: #0f172a; background: #fff; direction: rtl; }
    .voucher-box { border: 2px solid #0f172a; border-radius: 14px; padding: 18px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px dashed #cbd5e1; padding-bottom: 12px; margin-bottom: 14px; }
    .store-name { font-size: 18px; font-weight: 900; margin: 0; }
    .store-sub { font-size: 11px; color: #475569; margin-top: 3px; }
    .badge { background: ${isPayment ? '#ecfdf5' : '#fff1f2'}; border: 1.5px solid ${isPayment ? '#10b981' : '#f43f5e'}; color: ${isPayment ? '#065f46' : '#9f1239'}; padding: 6px 14px; border-radius: 10px; text-align: center; }
    .badge-title { font-size: 14px; font-weight: 900; }
    .badge-en { font-size: 9px; letter-spacing: 1px; font-family: monospace; }
    .meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px; margin-bottom: 14px; font-size: 12px; }
    .meta-label { font-size: 10px; color: #64748b; font-weight: 700; display: block; }
    .meta-val { font-weight: 900; font-family: monospace; font-size: 13px; }
    .party-box { border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px; margin-bottom: 14px; }
    .fin-grid { display: grid; grid-template-columns: repeat(${discount > 0 ? 4 : 3}, 1fr); gap: 10px; margin-bottom: 14px; }
    .fin-card { border: 1px solid #cbd5e1; border-radius: 10px; padding: 10px; text-align: center; }
    .fin-card.highlight { background: ${isPayment ? '#ecfdf5' : '#fff1f2'}; border-width: 2px; border-color: ${isPayment ? '#10b981' : '#f43f5e'}; }
    .sigs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 24px; padding-top: 12px; border-top: 1px solid #cbd5e1; text-align: center; font-size: 11px; font-weight: 700; color: #475569; }
    .sig-line { margin-top: 28px; border-bottom: 1px dashed #94a3b8; }
  </style>
</head>
<body>
  <div class="voucher-box">
    <div class="header">
      <div>
        <h1 class="store-name">${settings.storeNameAr || 'متجرنا'}</h1>
        <div class="store-sub">${settings.address || ''} ${settings.phone ? '• هاتف: ' + settings.phone : ''}</div>
      </div>
      <div class="badge">
        <div class="badge-title">${voucherTitleAr}</div>
        <div class="badge-en">${voucherTitleEn}</div>
      </div>
    </div>

    <div class="meta-grid">
      <div>
        <span class="meta-label">رقم السند (Voucher No)</span>
        <span class="meta-val">${transaction.voucherNumber}</span>
      </div>
      <div>
        <span class="meta-label">التاريخ والوقت (Date)</span>
        <span class="meta-val">${dateStr}</span>
      </div>
      <div>
        <span class="meta-label">طريقة الدفع (Method)</span>
        <span class="meta-val">${methodStr}</span>
      </div>
    </div>

    <div class="party-box">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <span style="font-size:10px; color:#64748b; font-weight:700;">
            ${isCustomer ? (isPayment ? 'استلمنا من السيد / الزبون:' : 'قيد على حساب السيد / الزبون:') : (isPayment ? 'صرفنا إلى السادة / المورد:' : 'قيد لصالح السادة / المورد:')}
          </span>
          <div style="font-size:15px; font-weight:900; margin-top:2px;">${transaction.partyName}</div>
        </div>
        ${transaction.referenceInvoice ? `<div style="font-size:11px; font-family:monospace; font-weight:800;">مرجع الفاتورة: ${transaction.referenceInvoice}</div>` : ''}
      </div>
      <div style="margin-top:8px; padding-top:8px; border-top:1px dashed #cbd5e1; font-size:12px;">
        <strong>البيان / الملاحظات:</strong> ${transaction.notes || 'لا توجد ملاحظات إضافية'}
      </div>
    </div>

    <div class="fin-grid">
      <div class="fin-card">
        <span class="meta-label">الرصيد السابق</span>
        <span class="meta-val">${formatCurrency(transaction.previousBalance)}</span>
      </div>
      <div class="fin-card highlight">
        <span class="meta-label">${isPayment ? 'المبلغ المقبوض / المسدد' : 'قيمة القيد المالي'}</span>
        <span class="meta-val" style="font-size:16px;">${formatCurrency(transaction.amount)}</span>
      </div>
      ${discount > 0 ? `
      <div class="fin-card">
        <span class="meta-label">خصم التسوية</span>
        <span class="meta-val">${formatCurrency(discount)}</span>
      </div>` : ''}
      <div class="fin-card">
        <span class="meta-label">الرصيد المتبقي الحالي</span>
        <span class="meta-val">${formatCurrency(transaction.newBalance)}</span>
      </div>
    </div>

    ${purchaseItemsHtml}

    <div class="sigs">
      <div>توقيع المستلم / المحاسب (${transaction.recordedBy})<div class="sig-line"></div></div>
      <div>توقيع ${isCustomer ? 'الزبون' : 'المورد'}<div class="sig-line"></div></div>
      <div>الختم الرسمي للمؤسسة<div class="sig-line"></div></div>
    </div>
  </div>
</body>
</html>`;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 2000);
      }, 250);
    }
  };

  // Send voucher directly via WhatsApp
  const handleSendVoucherWhatsApp = async () => {
    const cleanTargetPhone = recipientPhone.trim();
    if (!cleanTargetPhone) {
      setShowWhatsAppComposer(true);
      notify(
        'أدخل رقم واتساب',
        `يرجى إدخال رقم هاتف ${transaction.partyName} لإرسال السند مباشرة عبر واتساب`,
        'warning'
      );
      return;
    }

    setIsSendingWa(true);
    try {
      const messageToUse =
        waMessageText.trim() ||
        buildVoucherReceiptWhatsAppMessage({
          storeSettings: settings,
          transaction,
          bulletin: settings.exchangeBulletin
        });

      await sendWhatsAppDebtMessage({
        phone: cleanTargetPhone,
        message: messageToUse,
        customerName: transaction.partyName,
        customerId: transaction.partyId,
        invoiceNumber: transaction.voucherNumber,
        amountDue: transaction.amount,
        totalDebt: transaction.newBalance,
        currencySymbol: settings.currency.symbolNative || settings.currency.symbol,
        type: 'payment_receipt',
        storeSettings: settings
      });

      notify(
        'تم فتح واتساب وإرسال السند',
        `تم تجهيز وإرسال ${isPayment ? 'سند القبض' : 'السند المالي'} رقم ${transaction.voucherNumber} إلى ${transaction.partyName}`,
        'success'
      );
    } catch (err) {
      console.error('Error sending voucher via WhatsApp:', err);
      notify('خطأ', 'تعذر إرسال السند عبر واتساب', 'error');
    } finally {
      setIsSendingWa(false);
    }
  };

  const handleCopyVoucherText = () => {
    const textToCopy =
      waMessageText.trim() ||
      buildVoucherReceiptWhatsAppMessage({
        storeSettings: settings,
        transaction,
        bulletin: settings.exchangeBulletin
      });
    navigator.clipboard.writeText(textToCopy);
    setCopiedWa(true);
    notify('تم النسخ', 'تم نسخ نص السند المالي للحافظة بنجاح', 'info');
    setTimeout(() => setCopiedWa(false), 2000);
  };

  const directWaHref = getWhatsAppClickToChatUrl(
    recipientPhone.trim(),
    waMessageText.trim() ||
      buildVoucherReceiptWhatsAppMessage({
        storeSettings: settings,
        transaction,
        bulletin: settings.exchangeBulletin
      })
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200 print:bg-white print:p-0">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] print:shadow-none print:border-none print:max-w-none print:max-h-none">
        {/* Top Modal Action Bar (Hidden in Print) */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5 bg-slate-900 text-white print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm">{voucherTitleAr}</h3>
              <p className="text-[11px] text-slate-400 font-mono">{transaction.voucherNumber}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setShowWhatsAppComposer(!showWhatsAppComposer)}
              className={`px-3 py-2 text-xs font-black rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                showWhatsAppComposer
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
              }`}
            >
              <MessageSquareShare className="w-4 h-4" />
              <span>{isPayment ? 'إرسال سند القبض واتساب' : 'إرسال السند واتساب'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrintVoucher}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة السند</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Direct WhatsApp Send & Customize Drawer */}
        {showWhatsAppComposer && (
          <div className="p-4 bg-gradient-to-r from-emerald-950/90 via-emerald-900/90 to-slate-900 text-white border-b border-emerald-700/50 space-y-3 print:hidden animate-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black shrink-0">
                  <MessageSquareShare className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-emerald-300 flex items-center gap-1.5">
                    <span>إرسال {voucherTitleAr} مباشرة عبر واتساب</span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  </h4>
                  <p className="text-[10px] text-emerald-200/80">
                    يتم إرسال نص السند المالي الرسمي كاملاً برقم السند والرصيد السابق والمسدد والمتبقي
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCopyVoucherText}
                  className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  {copiedWa ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedWa ? 'تم النسخ' : 'نسخ النص'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="sm:col-span-1">
                <label className="block text-[10px] font-bold text-emerald-200 mb-1">
                  رقم واتساب المستلم ({transaction.partyName}):
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-emerald-400 absolute start-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    dir="ltr"
                    value={recipientPhone}
                    onChange={e => setRecipientPhone(e.target.value)}
                    placeholder="+963 9XX XXX XXX"
                    className="w-full ps-8 pe-3 py-2 rounded-xl bg-slate-900/90 border border-emerald-600/60 text-white font-mono text-xs focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div className="sm:col-span-2 flex items-end gap-2">
                <button
                  type="button"
                  onClick={handleSendVoucherWhatsApp}
                  disabled={isSendingWa}
                  className="flex-1 py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {isSendingWa
                      ? 'جاري الفتح والإرسال...'
                      : `إرسال مباشر إلى واتساب ${transaction.partyName}`}
                  </span>
                </button>

                <a
                  href={directWaHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 px-3 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs flex items-center gap-1 transition-colors whitespace-nowrap"
                  title="فتح رابط wa.me مباشرة في نافذة جديدة"
                >
                  <MessageSquareShare className="w-3.5 h-3.5 text-emerald-300" />
                  <span>رابط مباشر</span>
                </a>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-emerald-200 mb-1">
                معاينة وتعديل نص السند قبل الإرسال:
              </label>
              <textarea
                rows={5}
                value={waMessageText}
                onChange={e => setWaMessageText(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950/80 border border-emerald-700/50 text-emerald-50 text-[11px] font-sans leading-relaxed focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>
        )}

        {/* Printable Area */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-900 dark:text-slate-100 print:text-black print:p-4">
          {/* Store Header */}
          <div className="flex items-start justify-between border-b-2 border-dashed border-slate-300 dark:border-slate-700 pb-4">
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white print:text-black">
                {settings.storeNameAr}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 print:text-slate-600 mt-0.5">
                {settings.address}
              </p>
              {settings.phone && (
                <p className="text-xs font-mono text-slate-500 dark:text-slate-400 print:text-slate-600">
                  هاتف: {settings.phone}
                </p>
              )}
            </div>

            <div className="text-left">
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-xs border ${
                  isPayment
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                    : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                }`}
              >
                {isPayment ? (
                  <ArrowDownLeft className="w-4 h-4" />
                ) : (
                  <ArrowUpRight className="w-4 h-4" />
                )}
                <span>{voucherTitleAr}</span>
              </div>
              <p className="text-[10px] font-mono text-slate-400 mt-1 tracking-widest uppercase">
                {voucherTitleEn}
              </p>
            </div>
          </div>

          {/* Voucher Meta Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/50 print:bg-slate-50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 print:border-slate-300">
            <div>
              <span className="text-[11px] text-slate-400 block">رقم السند (Voucher No)</span>
              <span className="font-mono font-black text-sm text-slate-900 dark:text-white print:text-black">
                {transaction.voucherNumber}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">التاريخ والوقت (Date)</span>
              <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200 print:text-black">
                {new Date(transaction.createdAt).toLocaleString(
                  language === 'ar' ? 'ar-SY' : 'en-US'
                )}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">طريقة الدفع (Method)</span>
              <span className="font-bold text-xs text-slate-800 dark:text-slate-200 print:text-black">
                {paymentMethodLabel[transaction.paymentMethod || 'cash'] || 'نقداً'}
              </span>
            </div>
          </div>

          {/* Party Info */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 print:border-slate-300 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isCustomer ? (
                  <User className="w-4 h-4 text-amber-500" />
                ) : (
                  <Building2 className="w-4 h-4 text-amber-500" />
                )}
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {isCustomer
                    ? isPayment
                      ? 'استلمنا من السيد / الزبون:'
                      : 'قيد على حساب السيد / الزبون:'
                    : isPayment
                    ? 'صرفنا إلى السادة / المورد:'
                    : 'قيد لصالح السادة / المورد:'}
                </span>
              </div>
              {transaction.referenceInvoice && (
                <span className="text-xs font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded font-bold">
                  مرجع الفاتورة: {transaction.referenceInvoice}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="text-base font-black text-slate-900 dark:text-white print:text-black">
                {transaction.partyName}
              </p>
              {resolvedPartyPhone && (
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400" dir="ltr">
                  📞 {resolvedPartyPhone}
                </span>
              )}
            </div>

            <div className="pt-2 border-t border-dashed border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-400 block">وذلك عن (البيان / الملاحظات):</span>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 print:text-black mt-0.5">
                {transaction.notes || 'لا توجد ملاحظات إضافية'}
              </p>
            </div>
          </div>

          {/* Financial Breakdown Boxes */}
          <div
            className={`grid grid-cols-1 ${
              transaction.discountAmount && transaction.discountAmount > 0
                ? 'sm:grid-cols-4'
                : 'sm:grid-cols-3'
            } gap-3`}
          >
            {/* Previous Balance */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 print:border-slate-300 text-center">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                الرصيد السابق
              </span>
              <span className="text-sm font-mono font-bold text-slate-700 dark:text-slate-300 print:text-black mt-1 block">
                {formatCurrency(transaction.previousBalance)}
              </span>
            </div>

            {/* Transaction Amount */}
            <div
              className={`p-3.5 rounded-xl border-2 text-center ${
                isPayment
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-500 text-emerald-900 dark:text-emerald-200'
                  : 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-500 text-rose-900 dark:text-rose-200'
              }`}
            >
              <span className="text-[11px] font-bold block">
                {isPayment ? 'المبلغ المقبوض / المسدد' : 'قيمة القيد المالي'}
              </span>
              <span className="text-lg font-mono font-black mt-0.5 block">
                {formatCurrency(transaction.amount)}
              </span>
            </div>

            {/* Discount Granted (if any) */}
            {transaction.discountAmount && transaction.discountAmount > 0 ? (
              <div className="p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-400 text-amber-900 dark:text-amber-200 text-center">
                <span className="text-[11px] font-bold block">خصم التسوية الممنوح</span>
                <span className="text-sm font-mono font-black mt-1 block">
                  {formatCurrency(transaction.discountAmount)}
                </span>
              </div>
            ) : null}

            {/* Remaining New Balance */}
            <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-center">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                الرصيد المتبقي الحالي
              </span>
              <span className="text-base font-mono font-black text-slate-900 dark:text-white print:text-black mt-1 block">
                {formatCurrency(transaction.newBalance)}
              </span>
            </div>
          </div>

          {/* Purchase Items Table if this voucher is a Supplier Purchase Invoice */}
          {transaction.purchaseItems && transaction.purchaseItems.length > 0 && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800/80 flex items-center justify-between text-xs font-black text-slate-800 dark:text-slate-200">
                <div className="flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
                  <span>الأصناف الموردة في الفاتورة ({transaction.purchaseItems.length})</span>
                </div>
                {transaction.paidAmount !== undefined && (
                  <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                    المسدد عند الشراء: {formatCurrency(transaction.paidAmount)}
                  </span>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-start">
                  <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-2 px-3 text-start">الصنف</th>
                      <th className="py-2 px-3 text-center">الكمية</th>
                      <th className="py-2 px-3 text-end">سعر الشراء</th>
                      <th className="py-2 px-3 text-end">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {transaction.purchaseItems.map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">
                          {it.productName}
                        </td>
                        <td className="py-2 px-3 text-center font-mono">
                          {it.quantity} {it.unit || 'قطعة'}
                        </td>
                        <td className="py-2 px-3 text-end font-mono">
                          {formatCurrency(it.costPrice)}
                        </td>
                        <td className="py-2 px-3 text-end font-mono font-black">
                          {formatCurrency(it.totalCost)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Signatures Footer */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs">
            <div className="space-y-8">
              <span className="font-bold text-slate-500 block">
                توقيع المستلم / المحاسب ({transaction.recordedBy})
              </span>
              <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto" />
            </div>
            <div className="space-y-8">
              <span className="font-bold text-slate-500 block">
                توقيع {isCustomer ? 'الزبون' : 'المورد'}
              </span>
              <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto" />
            </div>
            <div className="space-y-8">
              <span className="font-bold text-slate-500 block">الختم الرسمي</span>
              <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto" />
            </div>
          </div>

          <div className="text-center pt-2">
            <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span>سند مالي موثق إلكترونياً عبر نظام {settings.storeNameAr}</span>
            </p>
          </div>
        </div>

        {/* Bottom Quick Action Bar (Hidden in Print) */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 print:hidden">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleSendVoucherWhatsApp}
              disabled={isSendingWa}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <MessageSquareShare className="w-4 h-4" />
              <span>
                {isPayment
                  ? 'إرسال سند القبض مباشرة عبر واتساب'
                  : 'إرسال السند المالي مباشرة عبر واتساب'}
              </span>
            </button>

            <button
              type="button"
              onClick={handleCopyVoucherText}
              className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedWa ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedWa ? 'تم نسخ السند' : 'نسخ نص السند'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintVoucher}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
