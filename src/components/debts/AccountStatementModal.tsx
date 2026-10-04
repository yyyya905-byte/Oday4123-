import React, { useState, useMemo, useEffect } from 'react';
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
  Search,
  Filter,
  MessageSquareShare,
  Copy,
  Check,
  Receipt,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronDown,
  FileText
} from 'lucide-react';
import { sendWhatsAppDebtMessage } from '../../services/debtCollectionService';

interface AccountStatementModalProps {
  partyType: 'customer' | 'supplier';
  party: Customer | Supplier | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectVoucher?: (voucher: DebtTransaction) => void;
}

interface StatementLedgerRow {
  id: string;
  voucherNumber: string;
  createdAt: string;
  type: 'opening' | 'charge' | 'payment';
  notes: string;
  referenceInvoice?: string;
  debitAmount: number; // مدين (+)
  creditAmount: number; // دائن / مسدد (-)
  discountAmount: number;
  runningBalance: number;
  recordedBy: string;
  paymentMethod?: string;
  originalVoucher?: DebtTransaction;
}

export const AccountStatementModal: React.FC<AccountStatementModalProps> = ({
  partyType: initialPartyType,
  party: initialParty,
  isOpen,
  onClose,
  onSelectVoucher
}) => {
  const {
    settings,
    formatCurrency,
    debtTransactions,
    sales,
    customers,
    suppliers,
    language,
    notify
  } = useApp();

  // Internal state to allow switching party or partyType directly inside the modal
  const [activePartyType, setActivePartyType] = useState<'customer' | 'supplier'>(initialPartyType);
  const [selectedPartyId, setSelectedPartyId] = useState<string>(initialParty?.id || '');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'quarter' | 'year'>('all');
  const [txTypeFilter, setTxTypeFilter] = useState<'all' | 'charge' | 'payment'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeSubView, setActiveSubView] = useState<'ledger' | 'invoices'>('ledger');
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState<boolean>(false);

  // Sync props when modal opens or initialParty changes
  useEffect(() => {
    if (isOpen) {
      setActivePartyType(initialPartyType);
      if (initialParty?.id) {
        setSelectedPartyId(initialParty.id);
      } else if (initialPartyType === 'customer' && customers.length > 0) {
        setSelectedPartyId(customers[0].id);
      } else if (initialPartyType === 'supplier' && suppliers.length > 0) {
        setSelectedPartyId(suppliers[0].id);
      }
      setDateFilter('all');
      setTxTypeFilter('all');
      setSearchQuery('');
      setActiveSubView('ledger');
    }
  }, [isOpen, initialPartyType, initialParty?.id, customers, suppliers]);

  // Resolve live party object from AppContext so balance updates in real time
  const activeParty = useMemo<Customer | Supplier | null>(() => {
    if (activePartyType === 'customer') {
      return (
        customers.find(c => c.id === selectedPartyId) ||
        (initialPartyType === 'customer' ? initialParty : null) ||
        customers[0] ||
        null
      );
    } else {
      return (
        suppliers.find(s => s.id === selectedPartyId) ||
        (initialPartyType === 'supplier' ? initialParty : null) ||
        suppliers[0] ||
        null
      );
    }
  }, [activePartyType, selectedPartyId, customers, suppliers, initialParty, initialPartyType]);

  // All chronological transactions for this party
  const allPartyTxs = useMemo(() => {
    if (!activeParty) return [];
    return debtTransactions
      .filter(tx => tx.partyType === activePartyType && tx.partyId === activeParty.id)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [debtTransactions, activePartyType, activeParty]);

  // Linked POS / Wholesale invoices for this customer
  const partyInvoices = useMemo(() => {
    if (!activeParty || activePartyType !== 'customer') return [];
    const cust = activeParty as Customer;
    return sales
      .filter(
        s =>
          s.customerId === cust.id ||
          (cust.customerCode && s.customerCode === cust.customerCode) ||
          (cust.name && s.customerName === cust.name)
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [sales, activeParty, activePartyType]);

  // Build complete ledger with Opening Balance reconciliation so running balance is 100% accurate
  const fullLedgerRows = useMemo<StatementLedgerRow[]>(() => {
    if (!activeParty) return [];

    const txCharged = allPartyTxs
      .filter(tx => tx.type === 'charge')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const txPaid = allPartyTxs
      .filter(tx => tx.type === 'payment')
      .reduce((sum, tx) => sum + tx.amount + (tx.discountAmount || 0), 0);

    const actualCurrentDebt = activeParty.currentDebt || 0;
    const netFromTxs = txCharged - txPaid;
    const impliedOpeningBalance = Math.max(0, actualCurrentDebt - netFromTxs);

    const rows: StatementLedgerRow[] = [];
    let running = 0;

    if (impliedOpeningBalance > 0) {
      running += impliedOpeningBalance;
      rows.push({
        id: `opening-${activeParty.id}`,
        voucherNumber: 'OPEN-BAL',
        createdAt: activeParty.createdAt || new Date(Date.now() - 30 * 86400000).toISOString(),
        type: 'opening',
        notes: 'رصيد افتتاحي مسجل للحساب',
        debitAmount: impliedOpeningBalance,
        creditAmount: 0,
        discountAmount: 0,
        runningBalance: running,
        recordedBy: 'النظام المالي'
      });
    }

    allPartyTxs.forEach(tx => {
      if (tx.type === 'charge') {
        running += tx.amount;
        rows.push({
          id: tx.id,
          voucherNumber: tx.voucherNumber,
          createdAt: tx.createdAt,
          type: 'charge',
          notes: tx.notes || (activePartyType === 'customer' ? 'قيد ذمة مبيعات آجلة' : 'فاتورة توريد بضاعة آجلة'),
          referenceInvoice: tx.referenceInvoice,
          debitAmount: tx.amount,
          creditAmount: 0,
          discountAmount: 0,
          runningBalance: tx.newBalance !== undefined ? tx.newBalance : running,
          recordedBy: tx.recordedBy || 'الإدارة',
          paymentMethod: tx.paymentMethod,
          originalVoucher: tx
        });
      } else {
        const totalSettled = tx.amount + (tx.discountAmount || 0);
        running = Math.max(0, running - totalSettled);
        rows.push({
          id: tx.id,
          voucherNumber: tx.voucherNumber,
          createdAt: tx.createdAt,
          type: 'payment',
          notes: tx.notes || (activePartyType === 'customer' ? 'سند قبض تسديد دفعة' : 'سند صرف دفعة للمورد'),
          referenceInvoice: tx.referenceInvoice,
          debitAmount: 0,
          creditAmount: totalSettled,
          discountAmount: tx.discountAmount || 0,
          runningBalance: tx.newBalance !== undefined ? tx.newBalance : running,
          recordedBy: tx.recordedBy || 'الإدارة',
          paymentMethod: tx.paymentMethod,
          originalVoucher: tx
        });
      }
    });

    return rows;
  }, [activeParty, allPartyTxs, activePartyType]);

  // Filtered ledger rows based on Date Filter, Type Filter, and Search Query
  const filteredLedgerRows = useMemo(() => {
    const now = new Date();
    return fullLedgerRows.filter(row => {
      // 1. Type filter
      if (txTypeFilter === 'charge' && row.type === 'payment') return false;
      if (txTypeFilter === 'payment' && row.type !== 'payment') return false;

      // 2. Date filter
      if (dateFilter !== 'all' && row.type !== 'opening') {
        const rowDate = new Date(row.createdAt);
        const diffDays = (now.getTime() - rowDate.getTime()) / (1000 * 3600 * 24);
        if (dateFilter === 'today' && rowDate.toDateString() !== now.toDateString()) return false;
        if (dateFilter === 'week' && diffDays > 7) return false;
        if (dateFilter === 'month' && diffDays > 30) return false;
        if (dateFilter === 'quarter' && diffDays > 90) return false;
        if (dateFilter === 'year' && diffDays > 365) return false;
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchVoucher = row.voucherNumber.toLowerCase().includes(q);
        const matchNotes = row.notes.toLowerCase().includes(q);
        const matchRef = row.referenceInvoice ? row.referenceInvoice.toLowerCase().includes(q) : false;
        if (!matchVoucher && !matchNotes && !matchRef) return false;
      }

      return true;
    });
  }, [fullLedgerRows, txTypeFilter, dateFilter, searchQuery]);

  // Summary Totals
  const { totalCharged, totalPaid, currentBalance } = useMemo(() => {
    if (!activeParty) {
      return { totalCharged: 0, totalPaid: 0, currentBalance: 0 };
    }
    const charged = fullLedgerRows.reduce((sum, r) => sum + r.debitAmount, 0);
    const paid = fullLedgerRows.reduce((sum, r) => sum + r.creditAmount, 0);
    const balance = activeParty.currentDebt || 0;
    return {
      totalCharged: charged,
      totalPaid: paid,
      currentBalance: balance
    };
  }, [activeParty, fullLedgerRows]);

  if (!isOpen) return null;

  // Reliable Print Handler (supports iframe print + window.print fallback)
  const handlePrint = () => {
    const printElement = document.getElementById('printable-statement-content');
    if (!printElement) {
      window.print();
      return;
    }

    try {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (doc && activeParty) {
        doc.open();
        doc.write(`
          <!DOCTYPE html>
          <html dir="rtl" lang="ar">
          <head>
            <meta charset="utf-8" />
            <title>كشف حساب - ${activeParty.name}</title>
            <style>
              @page { size: A4; margin: 12mm; }
              body {
                font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif;
                color: #0f172a;
                background: #ffffff;
                margin: 0;
                padding: 8px;
                direction: rtl;
              }
              .header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                border-bottom: 2px solid #0f172a;
                padding-bottom: 12px;
                margin-bottom: 16px;
              }
              .store-title { font-size: 20px; font-weight: 900; margin: 0 0 4px 0; }
              .store-sub { font-size: 12px; color: #475569; margin: 0; }
              .party-box {
                background: #f8fafc;
                border: 1px solid #cbd5e1;
                border-radius: 10px;
                padding: 10px 14px;
                min-width: 240px;
                font-size: 12px;
              }
              .party-name { font-size: 14px; font-weight: 800; margin-bottom: 4px; }
              .kpi-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 10px;
                margin-bottom: 18px;
              }
              .kpi-card {
                border: 1px solid #cbd5e1;
                border-radius: 10px;
                padding: 10px 12px;
                background: #f8fafc;
              }
              .kpi-label { font-size: 11px; color: #475569; font-weight: 700; display: block; margin-bottom: 4px; }
              .kpi-val { font-size: 17px; font-weight: 900; font-family: monospace; }
              table {
                width: 100%;
                border-collapse: collapse;
                font-size: 11px;
                margin-bottom: 24px;
              }
              th, td {
                border: 1px solid #cbd5e1;
                padding: 7px 8px;
                text-align: right;
              }
              th {
                background: #f1f5f9;
                font-weight: 800;
              }
              .num { font-family: monospace; font-weight: 700; text-align: left; }
              .footer-sigs {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 32px;
                margin-top: 28px;
                padding-top: 16px;
                border-top: 1px solid #cbd5e1;
                text-align: center;
                font-size: 12px;
                font-weight: 700;
              }
              .sig-line {
                margin: 36px auto 0 auto;
                width: 70%;
                border-bottom: 1px dashed #64748b;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div>
                <h1 class="store-title">${settings.storeNameAr || 'كيان كاشير'}</h1>
                <p class="store-sub">${settings.tagline || 'كشف حساب مالي تفصيلي معتمد'}</p>
                ${settings.phone ? `<p class="store-sub">هاتف: ${settings.phone}</p>` : ''}
              </div>
              <div class="party-box">
                <div class="party-name">${activePartyType === 'customer' ? 'العميل:' : 'المورد:'} ${activeParty.name}</div>
                <div>الكود: ${activePartyType === 'customer' ? (activeParty as Customer).customerCode : (activeParty as Supplier).code}</div>
                <div>الهاتف: ${activeParty.phone || 'غير مسجل'}</div>
                <div>تاريخ الإصدار: ${new Date().toLocaleDateString('ar-SY')}</div>
              </div>
            </div>

            <div class="kpi-grid">
              <div class="kpi-card">
                <span class="kpi-label">إجمالي الديون / القيود الآجلة:</span>
                <span class="kpi-val">${formatCurrency(totalCharged)}</span>
              </div>
              <div class="kpi-card">
                <span class="kpi-label">إجمالي المسدد والخصومات:</span>
                <span class="kpi-val" style="color:#047857;">${formatCurrency(totalPaid)}</span>
              </div>
              <div class="kpi-card">
                <span class="kpi-label">الرصيد المتبقي المستحق حالياً:</span>
                <span class="kpi-val" style="color:${currentBalance > 0 ? '#be123c' : '#0f172a'};">${formatCurrency(currentBalance)}</span>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>رقم السند</th>
                  <th>التاريخ</th>
                  <th>نوع الحركة</th>
                  <th>البيان والملاحظات</th>
                  <th>مدين (+)</th>
                  <th>دائن / مسدد (-)</th>
                  <th>الرصيد التراكمي</th>
                </tr>
              </thead>
              <tbody>
                ${
                  filteredLedgerRows.length === 0
                    ? `<tr><td colspan="7" style="text-align:center;padding:16px;">لا توجد حركات مسجلة في هذه الفترة</td></tr>`
                    : filteredLedgerRows
                        .map(
                          r => `
                    <tr>
                      <td class="num">${r.voucherNumber}</td>
                      <td>${new Date(r.createdAt).toLocaleDateString('ar-SY')}</td>
                      <td>${r.type === 'opening' ? 'رصيد افتتاحي' : r.type === 'charge' ? 'قيد ذمة آجل' : 'سند تسديد'}</td>
                      <td>${r.notes}${r.referenceInvoice ? ` (فاتورة #${r.referenceInvoice})` : ''}</td>
                      <td class="num">${r.debitAmount > 0 ? formatCurrency(r.debitAmount) : '-'}</td>
                      <td class="num">${r.creditAmount > 0 ? formatCurrency(r.creditAmount) : '-'}</td>
                      <td class="num">${formatCurrency(r.runningBalance)}</td>
                    </tr>
                  `
                        )
                        .join('')
                }
              </tbody>
            </table>

            <div class="footer-sigs">
              <div>
                <span>ختم وتوقيع المحاسب المعتمد</span>
                <div class="sig-line"></div>
              </div>
              <div>
                <span>توقيع المصادقة على الرصيد</span>
                <div class="sig-line"></div>
              </div>
            </div>
          </body>
          </html>
        `);
        doc.close();
        iframe.contentWindow?.focus();
        setTimeout(() => {
          iframe.contentWindow?.print();
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 2000);
        }, 250);
      } else {
        window.print();
      }
    } catch {
      window.print();
    }
  };

  const handleExportCSV = () => {
    if (!activeParty) return;
    const headers = [
      'رقم السند',
      'التاريخ',
      'النوع',
      'البيان',
      'مدين / مضاف',
      'دائن / مسدد',
      'الرصيد التراكمي',
      'بواسطة'
    ];
    const rows = filteredLedgerRows.map(row => [
      row.voucherNumber,
      new Date(row.createdAt).toLocaleDateString('ar-SY'),
      row.type === 'opening' ? 'رصيد افتتاحي' : row.type === 'charge' ? 'قيد ذمة' : 'سداد دفعة',
      `"${(row.notes || '').replace(/"/g, '""')}"`,
      row.debitAmount,
      row.creditAmount,
      row.runningBalance,
      `"${row.recordedBy || ''}"`
    ]);

    const summaryRows = [
      [],
      ['إجمالي الديون المقيّدة', '', '', '', totalCharged, '', '', ''],
      ['إجمالي المسدد والخصومات', '', '', '', '', totalPaid, '', ''],
      ['الرصيد المتبقي المستحق حالياً', '', '', '', '', '', currentBalance, '']
    ];

    const csvBody = [
      headers.join(','),
      ...rows.map(e => e.join(',')),
      ...summaryRows.map(e => e.join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvBody], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `كشف_حساب_${activeParty.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    notify('تم التصدير بنجاح', `تم تحميل ملف كشف حساب ${activeParty.name} بصيغة Excel/CSV`, 'success');
  };

  const buildTextStatement = () => {
    if (!activeParty) return '';
    const storeName = settings.storeNameAr || 'كيان كاشير';
    const lines = [
      `📄 *كشف حساب مالي تفصيلي - ${storeName}*`,
      `────────────────────`,
      `👤 *${activePartyType === 'customer' ? 'العميل' : 'المورد'}:* ${activeParty.name}`,
      `📞 *الهاتف:* ${activeParty.phone || 'غير مسجل'}`,
      `📅 *تاريخ الكشف:* ${new Date().toLocaleDateString('ar-SY')}`,
      `────────────────────`,
      `📌 *إجمالي القيود الآجلة:* ${formatCurrency(totalCharged)}`,
      `✅ *إجمالي المسدد:* ${formatCurrency(totalPaid)}`,
      `💰 *الرصيد المتبقي المستحق:* *${formatCurrency(currentBalance)}*`,
      `────────────────────`
    ];

    if (filteredLedgerRows.length > 0) {
      lines.push(`📋 *آخر الحركات المسجلة (${filteredLedgerRows.length}):*`);
      filteredLedgerRows.slice(-6).forEach(r => {
        const sign = r.type === 'payment' ? '➖ سداد' : '➕ قيد';
        const amt = r.type === 'payment' ? formatCurrency(r.creditAmount) : formatCurrency(r.debitAmount);
        lines.push(
          `• ${new Date(r.createdAt).toLocaleDateString('ar-SY')} | ${sign}: ${amt} (${r.notes})`
        );
      });
    }

    return lines.join('\n');
  };

  const handleCopyStatement = () => {
    const text = buildTextStatement();
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedSummary(true);
    notify('تم النسخ', 'تم نسخ ملخص كشف الحساب إلى الحافظة بنجاح', 'success');
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const handleSendWhatsAppStatement = async () => {
    if (!activeParty) return;
    if (!activeParty.phone) {
      notify('تنبيه', 'لا يوجد رقم هاتف مسجل لهذا الحساب لإرسال الكشف عبر واتساب', 'warning');
      return;
    }

    setIsSendingWhatsApp(true);
    try {
      const msg = buildTextStatement();
      await sendWhatsAppDebtMessage({
        phone: activeParty.phone,
        message: msg,
        customerName: activeParty.name,
        customerId: activeParty.id,
        amountDue: currentBalance,
        totalDebt: currentBalance,
        currencySymbol: settings.currency.symbolNative || settings.currency.symbol,
        type: 'manual_reminder',
        storeSettings: settings
      });
      notify('تم تجهيز الإرسال', `تم إرسال كشف الحساب إلى ${activeParty.name} عبر واتساب`, 'success');
    } catch {
      notify('تنبيه', 'تم نسخ الكشف، يرجى التحقق من الاتصال', 'info');
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  const partyList = activePartyType === 'customer' ? customers : suppliers;

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-5xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto flex flex-col max-h-[94vh]">
        {/* Header Controls (Hidden during print) */}
        <div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 print:hidden shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-xs shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                  كشف حساب مالي تفصيلي (Statement of Account)
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {activePartyType === 'customer'
                    ? 'كشف الذمم المدينة والفواتير وسندات القبض للعميل'
                    : 'كشف الذمم الدائنة وفواتير التوريد وسندات الصرف للمورد'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Account Switcher + Export / Print / WhatsApp Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Switch Party Type (Customer / Supplier) */}
            <div className="inline-flex rounded-xl bg-slate-200/80 dark:bg-slate-950 p-0.5 border border-slate-300/60 dark:border-slate-700">
              <button
                type="button"
                onClick={() => {
                  setActivePartyType('customer');
                  if (customers.length > 0) setSelectedPartyId(customers[0].id);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  activePartyType === 'customer'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <User className="w-3 h-3" />
                <span>العملاء ({customers.length})</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActivePartyType('supplier');
                  if (suppliers.length > 0) setSelectedPartyId(suppliers[0].id);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  activePartyType === 'supplier'
                    ? 'bg-amber-500 text-slate-950 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Building2 className="w-3 h-3" />
                <span>الموردون ({suppliers.length})</span>
              </button>
            </div>

            {/* Quick Account Dropdown Selector */}
            <div className="relative min-w-[175px]">
              <select
                value={activeParty?.id || ''}
                onChange={e => setSelectedPartyId(e.target.value)}
                className="w-full appearance-none text-xs font-bold py-1.5 ps-3 pe-7 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                {partyList.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} — ({formatCurrency(p.currentDebt || 0)})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute end-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <button
              type="button"
              onClick={handleCopyStatement}
              className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              title="نسخ نص كشف الحساب"
            >
              {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSummary ? 'تم النسخ' : 'نسخ'}</span>
            </button>

            <button
              type="button"
              disabled={isSendingWhatsApp}
              onClick={handleSendWhatsAppStatement}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer active:scale-95"
              title="إرسال كشف الحساب عبر واتساب"
            >
              <MessageSquareShare className="w-3.5 h-3.5" />
              <span>واتساب</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Excel/CSV</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xl flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة الكشف</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="hidden lg:flex p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Interactive Filter Bar (Hidden during print) */}
        <div className="px-4 py-2.5 bg-slate-100/80 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 print:hidden shrink-0">
          {/* Date Filter Buttons */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            <Calendar className="w-3.5 h-3.5 text-slate-400 me-1 shrink-0" />
            {(
              [
                { id: 'all', label: 'كل الفترات' },
                { id: 'today', label: 'اليوم' },
                { id: 'week', label: 'آخر 7 أيام' },
                { id: 'month', label: 'هذا الشهر' },
                { id: 'quarter', label: 'آخر 3 أشهر' },
                { id: 'year', label: 'هذه السنة' }
              ] as const
            ).map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setDateFilter(f.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                  dateFilter === f.id
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Search & Movement Type Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute start-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="بحث برقم السند أو البيان..."
                className="w-full text-[11px] py-1.5 ps-8 pe-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <select
              value={txTypeFilter}
              onChange={e => setTxTypeFilter(e.target.value as any)}
              className="text-[11px] font-bold py-1.5 px-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all">كافة الحركات</option>
              <option value="charge">قيود الديون (+)</option>
              <option value="payment">التسديدات (-)</option>
            </select>
          </div>
        </div>

        {/* Printable Statement Document */}
        {!activeParty ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <FileSpreadsheet className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="text-sm font-bold">يرجى اختيار عميل أو مورد لعرض كشف الحساب</p>
          </div>
        ) : (
          <div
            className="p-5 sm:p-7 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 space-y-5 overflow-y-auto flex-1 print:max-h-none print:overflow-visible print:p-0 print:bg-white print:text-slate-900"
            id="printable-statement-content"
          >
            {/* Header Brand & Party Overview */}
            <div className="border-b-2 border-slate-900 dark:border-slate-700 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                {settings.logo && (
                  <img
                    src={settings.logo}
                    alt={settings.storeNameAr || 'شعار المتجر'}
                    className="max-h-12 max-w-[140px] object-contain mb-1"
                  />
                )}
                <h1 className="text-xl font-black text-slate-950 dark:text-white tracking-tight">
                  {settings.storeNameAr || 'كيان كاشير'}
                </h1>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-bold">
                  {settings.tagline || 'نظام إدارة المبيعات ونقاط البيع المتكامل'}
                </p>
                {settings.phone && (
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                    هاتف المنشأة: {settings.phone}
                  </div>
                )}
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs sm:min-w-[300px]">
                <div className="font-extrabold text-slate-900 dark:text-white text-sm mb-1.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {activePartyType === 'customer' ? (
                      <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    ) : (
                      <Building2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    )}
                    <span>{activeParty.name}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono">
                    {activePartyType === 'customer'
                      ? (activeParty as Customer).customerCode
                      : (activeParty as Supplier).code}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center justify-between">
                  <span>رقم الهاتف:</span>
                  <span className="font-mono font-bold">{activeParty.phone || 'غير مسجل'}</span>
                </div>
                {activeParty.address && (
                  <div className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center justify-between mt-0.5">
                    <span>العنوان:</span>
                    <span className="font-bold truncate max-w-[180px]">{activeParty.address}</span>
                  </div>
                )}
                <div className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center justify-between mt-0.5">
                  <span>تاريخ إصدار الكشف:</span>
                  <span className="font-mono">
                    {new Date().toLocaleDateString(language === 'ar' ? 'ar-SY' : 'en-US')}
                  </span>
                </div>
              </div>
            </div>

            {/* Statement Summary KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center justify-between mb-1">
                  <span>إجمالي الديون / القيود الآجلة (+)</span>
                  <ArrowUpRight className="w-4 h-4 text-rose-500" />
                </span>
                <span className="text-xl font-black text-slate-900 dark:text-white font-mono">
                  {formatCurrency(totalCharged)}
                </span>
                <span className="block text-[10px] text-slate-400 mt-0.5">
                  مجموع الفواتير الآجلة والرصيد الافتتاحي
                </span>
              </div>

              <div className="p-3.5 bg-emerald-50/80 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800/70">
                <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 flex items-center justify-between mb-1">
                  <span>إجمالي المسدد والخصومات (-)</span>
                  <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                </span>
                <span className="text-xl font-black text-emerald-700 dark:text-emerald-400 font-mono">
                  {formatCurrency(totalPaid)}
                </span>
                <span className="block text-[10px] text-emerald-600/80 dark:text-emerald-400/70 mt-0.5">
                  مجموع سندات القبض/الصرف والتسويات
                </span>
              </div>

              <div
                className={`p-3.5 rounded-2xl border ${
                  currentBalance > 0
                    ? 'bg-rose-50/90 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/70'
                    : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700'
                }`}
              >
                <span
                  className={`text-[11px] font-bold block mb-1 ${
                    currentBalance > 0
                      ? 'text-rose-800 dark:text-rose-300'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  الرصيد المتبقي المستحق حالياً:
                </span>
                <span
                  className={`text-2xl font-black font-mono tracking-tight ${
                    currentBalance > 0
                      ? 'text-rose-700 dark:text-rose-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {formatCurrency(currentBalance)}
                </span>
                <span className="block text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {currentBalance > 0 ? 'رصيد ذمة قائم مستحق السداد' : 'الحساب مبرأ الذمة بالكامل'}
                </span>
              </div>
            </div>

            {/* Sub-Tabs for Customer: Ledger Movements vs Linked Sales Invoices */}
            {activePartyType === 'customer' && (
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 print:hidden">
                <button
                  type="button"
                  onClick={() => setActiveSubView('ledger')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeSubView === 'ledger'
                      ? 'bg-amber-500 text-slate-950 font-black shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>حركات وسندات الحساب ({filteredLedgerRows.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSubView('invoices')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeSubView === 'invoices'
                      ? 'bg-indigo-600 text-white font-black shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>فواتير مبيعات العميل ({partyInvoices.length})</span>
                </button>
              </div>
            )}

            {/* VIEW 1: Statement Movements Table */}
            {(activeSubView === 'ledger' || activePartyType === 'supplier') && (
              <div>
                <h4 className="text-xs font-black text-slate-900 dark:text-white mb-2.5 flex items-center justify-between">
                  <span>سجل حركات وسندات الحساب بالتفصيل ({filteredLedgerRows.length} حركة):</span>
                  <span className="text-[11px] font-normal text-slate-500">
                    مرتبة زمنياً مع الرصيد التراكمي
                  </span>
                </h4>

                {filteredLedgerRows.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                    لا توجد حركات مطابقة لشروط البحث أو الفترة المحددة لهذا الحساب
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-xs text-start">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="p-2.5 text-start">رقم السند</th>
                          <th className="p-2.5 text-start">التاريخ</th>
                          <th className="p-2.5 text-start">نوع الحركة</th>
                          <th className="p-2.5 text-start">البيان والملاحظات</th>
                          <th className="p-2.5 text-end">مدين / مضاف (+)</th>
                          <th className="p-2.5 text-end">دائن / مسدد (-)</th>
                          <th className="p-2.5 text-end">الرصيد التراكمي</th>
                          <th className="p-2.5 text-center print:hidden">السند</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {filteredLedgerRows.map(row => (
                          <tr
                            key={row.id}
                            className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                          >
                            <td className="p-2.5 font-mono font-bold text-slate-900 dark:text-white">
                              {row.voucherNumber}
                            </td>
                            <td className="p-2.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono whitespace-nowrap">
                              {new Date(row.createdAt).toLocaleDateString('ar-SY')}
                            </td>
                            <td className="p-2.5">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold whitespace-nowrap ${
                                  row.type === 'opening'
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                    : row.type === 'charge'
                                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                }`}
                              >
                                {row.type === 'opening'
                                  ? 'رصيد افتتاحي'
                                  : row.type === 'charge'
                                  ? 'قيد ذمة آجل'
                                  : 'سند تسديد دفعة'}
                              </span>
                            </td>
                            <td className="p-2.5 text-slate-700 dark:text-slate-300 max-w-[240px]">
                              <div className="truncate font-medium">{row.notes}</div>
                              {row.referenceInvoice && (
                                <span className="block text-[10px] text-amber-600 dark:text-amber-400 font-mono">
                                  مرجع الفاتورة: #{row.referenceInvoice}
                                </span>
                              )}
                            </td>
                            <td className="p-2.5 text-end font-mono font-bold text-rose-600 dark:text-rose-400">
                              {row.debitAmount > 0 ? `+${formatCurrency(row.debitAmount)}` : '—'}
                            </td>
                            <td className="p-2.5 text-end font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              {row.creditAmount > 0 ? `-${formatCurrency(row.creditAmount)}` : '—'}
                              {row.discountAmount > 0 && (
                                <span className="block text-[9px] text-emerald-500">
                                  (شامل خصم {formatCurrency(row.discountAmount)})
                                </span>
                              )}
                            </td>
                            <td className="p-2.5 text-end font-mono font-black text-slate-950 dark:text-white">
                              {formatCurrency(row.runningBalance)}
                            </td>
                            <td className="p-2.5 text-center print:hidden">
                              {onSelectVoucher && row.originalVoucher ? (
                                <button
                                  type="button"
                                  onClick={() => onSelectVoucher(row.originalVoucher!)}
                                  className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-[11px] text-amber-600 dark:text-amber-400 font-bold transition-colors cursor-pointer"
                                >
                                  عرض السند
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* VIEW 2: Linked Customer Invoices Table */}
            {activeSubView === 'invoices' && activePartyType === 'customer' && (
              <div>
                <h4 className="text-xs font-black text-slate-900 dark:text-white mb-2.5">
                  سجل فواتير المبيعات المرتبطة بالعميل ({partyInvoices.length} فاتورة):
                </h4>

                {partyInvoices.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                    لا توجد فواتير مبيعات مسجلة باسم هذا العميل بعد
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-xs text-start">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="p-2.5 text-start">رقم الفاتورة</th>
                          <th className="p-2.5 text-start">التاريخ</th>
                          <th className="p-2.5 text-start">الأصناف</th>
                          <th className="p-2.5 text-start">طريقة الدفع</th>
                          <th className="p-2.5 text-end">إجمالي الفاتورة</th>
                          <th className="p-2.5 text-end">المدفوع نقداً</th>
                          <th className="p-2.5 text-end">المقيّد بالآجل</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {partyInvoices.map(inv => {
                          const paidCash =
                            inv.paidAmount !== undefined
                              ? Math.min(inv.total, inv.paidAmount)
                              : inv.paymentMethod === 'credit'
                              ? 0
                              : inv.total;
                          const remDebt =
                            inv.paymentMethod === 'credit' || inv.paymentMethod === 'split'
                              ? Math.max(0, inv.total - paidCash)
                              : 0;

                          return (
                            <tr
                              key={inv.id}
                              className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                            >
                              <td className="p-2.5 font-mono font-bold text-slate-900 dark:text-white">
                                {inv.invoiceNumber}
                              </td>
                              <td className="p-2.5 font-mono text-[11px] text-slate-500">
                                {new Date(inv.createdAt).toLocaleDateString('ar-SY')}
                              </td>
                              <td className="p-2.5 text-slate-600 dark:text-slate-300">
                                {inv.items.length} أصناف (
                                {inv.items.reduce((s, i) => s + i.quantity, 0)} قطعة)
                              </td>
                              <td className="p-2.5">
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                    remDebt > 0 && paidCash > 0
                                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                                      : inv.paymentMethod === 'credit'
                                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  }`}
                                >
                                  {remDebt > 0 && paidCash > 0
                                    ? 'تقسيم (نقد + آجل)'
                                    : inv.paymentMethod === 'credit'
                                    ? 'آجل (دين)'
                                    : inv.paymentMethod === 'cash'
                                    ? 'نقداً (كاش)'
                                    : inv.paymentMethod}
                                </span>
                              </td>
                              <td className="p-2.5 text-end font-mono font-black text-slate-900 dark:text-white">
                                {formatCurrency(inv.total)}
                              </td>
                              <td className="p-2.5 text-end font-mono font-bold text-emerald-600">
                                {formatCurrency(paidCash)}
                              </td>
                              <td className="p-2.5 text-end font-mono font-bold text-rose-600">
                                {remDebt > 0 ? formatCurrency(remDebt) : '—'}
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

            {/* Statement Closing Notes & Signatures */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-8 text-center text-xs">
              <div>
                <span className="block font-bold text-slate-500 dark:text-slate-400 mb-8">
                  ختم وتوقيع المحاسب المعتمد:
                </span>
                <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto"></div>
              </div>
              <div>
                <span className="block font-bold text-slate-500 dark:text-slate-400 mb-8">
                  توقيع المصادقة على الرصيد:
                </span>
                <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto"></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
