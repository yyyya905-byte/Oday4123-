// Debt Collection & WhatsApp Business Automation Service
import { Sale, Customer, StoreSettings, ExchangeRateBulletin, DebtTransaction, InvoiceInstallmentPlan } from '../types';

export interface DebtReminderLog {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  saleId?: string;
  invoiceNumber?: string;
  type: 'invoice_created' | 'post_sale' | 'scheduled_reminder' | 'manual_reminder' | 'payment_receipt' | 'overdue_notice' | 'installment_plan';
  amountDue: number;
  totalDebt: number;
  currencySymbol: string;
  messageText: string;
  status: 'sent' | 'opened_in_whatsapp' | 'pending';
  sentAt: string;
  method: 'direct_api' | 'whatsapp_link';
}

export const DEBT_COLLECTION_STORAGE_KEY = 'kian_pos_debt_reminder_logs';
export const LAST_REMINDER_CHECK_KEY = 'kian_pos_last_debt_reminder_check';

export interface TemplateVariableInfo {
  tag: string;
  label: string;
  description: string;
  example: string;
}

export const AVAILABLE_TEMPLATE_VARIABLES: TemplateVariableInfo[] = [
  { tag: '{customer_name}', label: 'اسم العميل', description: 'الاسم الكامل للزبون', example: 'أحمد العلي' },
  { tag: '{store_name}', label: 'اسم المتجر', description: 'اسم المحل أو المنشأة', example: 'سوبرماركت البركة' },
  { tag: '{invoice_number}', label: 'رقم الفاتورة', description: 'الرقم التسلسلي للفاتورة', example: 'INV-2026-0842' },
  { tag: '{invoice_date}', label: 'تاريخ الفاتورة', description: 'تاريخ صدور الفاتورة', example: '2026/09/03' },
  { tag: '{items_list}', label: 'قائمة الأصناف والمشتريات', description: 'الأصناف والكميات والأسعار مفصلة', example: '1. زيت زيتون 5L × 2 = 180,000 ل.س' },
  { tag: '{total_amount}', label: 'إجمالي الفاتورة', description: 'القيمة الإجمالية للمبيعات', example: '250,000 ل.س' },
  { tag: '{paid_amount}', label: 'المبلغ المسدد مقدماً', description: 'الدفعة النقدية المسددة', example: '50,000 ل.س' },
  { tag: '{remaining_amount}', label: 'المبلغ المتبقي من الفاتورة', description: 'صافي دين الفاتورة الحالية', example: '200,000 ل.س' },
  { tag: '{total_customer_debt}', label: 'إجمالي ذمة العميل الكلية', description: 'مجموع الديون السابقة والحالية', example: '450,000 ل.س' },
  { tag: '{usd_equivalent}', label: 'المعادل بالدولار $', description: 'محسوب وفق سعر صرف الليرة اليوم', example: 'حوالي $29.80 (سعر الليرة اليوم)' },
  { tag: '{usd_rate}', label: 'سعر صرف الدولار', description: 'سعر الصرف المعتمد حالياً', example: '15,100 ل.س' },
  { tag: '{days}', label: 'عدد أيام التذكير / المهلة', description: 'فترة الاستحقاق بالأيام', example: '7 أيام' },
  { tag: '{store_phone}', label: 'هاتف المتجر', description: 'رقم هاتف المتجر للتواصل', example: '+963933123456' },
  { tag: '{store_address}', label: 'عنوان المتجر', description: 'مقر وموقع المحل', example: 'دمشق - المزة' },
  { tag: '{payment_amount}', label: 'قيمة الدفعة المسددة', description: 'المبلغ المستلم بسند القبض', example: '100,000 ل.س' },
  { tag: '{voucher_number}', label: 'رقم السند المالي', description: 'رقم سند القبض أو الإشعار', example: 'VOUCH-1002' },
];

export const DEFAULT_TEMPLATES = {
  invoice_created: `مرحباً بك أستاذ *{customer_name}* المحترم 🌸
تحية طيبة من *{store_name}*

🧾 تم قيد فاتورة مبيعات آجلة جديدة على حسابكم:
🔖 *رقم الفاتورة:* {invoice_number}
📅 *التاريخ:* {invoice_date}

📋 *تفاصيل الأغراض والمشتريات:*
{items_list}

💰 *الحساب المالي للفاتورة:*
• إجمالي الفاتورة: *{total_amount}*
• المسدد مقدماً: {paid_amount}
• 🔴 *المطلوب دفعه لهذه الفاتورة:* *{remaining_amount}*

📊 *إجمالي ذمتكم / رصيد الدين الكلي لدينا حالياً:*
👉 *{total_customer_debt}*
{usd_equivalent}

⏳ نرجو التكرم بالترتيب للتسديد خلال *{days} أيام* لتسهيل المعاملات.
نشكر ثقتكم بنا ونتمنى لكم دوام التوفيق والبركة!
📞 للاستفسار والتسديد: {store_phone}
📍 {store_address}`,

  periodic_reminder: `مرحباً أستاذ *{customer_name}* المحترم 🌸
تحية طيبة من إدارة *{store_name}*

نود تذكير حضرتكم بلطف بوجود رصيد ذمة مالية مستحقة السداد مسجلة لديكم:
💰 *إجمالي المبلغ المتبقي:* *{total_customer_debt}*
{usd_equivalent}

⏳ نرجو منكم التكرم بترتيب سداد المبلغ في أقرب فرصة مناسبة للحفاظ على استمرارية التسهيلات الائتمانية بيننا.

💳 يمكنك التسديد نقداً في مقر المتجر أو عبر التحويل المالي.
📞 للتواصل أو طلب كشف حساب تفصيلي: {store_phone}

شاكرين لكم حسن تعاونكم الدائم 🙏`,

  overdue_notice: `تنبيه هام ومتابعة حساب ⚠️
إلى الأستاذ *{customer_name}* المحترم،
تحية من إدارة *{store_name}*

نود إحاطتكم علماً بأن الرصيد الآجل المستحق على حسابكم بمبلغ *{total_customer_debt}* قد تجاوز موعد السداد المحدد.
{usd_equivalent}

يرجى التكرم بمراجعتنا لتسوية الحساب في موعد أقصاه 3 أيام لتجنب تعليق التعاملات الآجلة.

📞 هاتف الإدارة: {store_phone}
شاكرين تفهمكم وتعاونكم.`,

  payment_receipt: `إشعار سند قبض مالي وتسديد ذمة 🧾✅
الأستاذ *{customer_name}* المحترم،

تم بحمد الله استلام وتسجيل دفعة مالية لحسابكم لدى *{store_name}*:
🔖 *رقم السند:* {voucher_number}
💵 *المبلغ المسدد:* *{payment_amount}*
📅 *التاريخ والوقت:* {invoice_date}

📊 *رصيد الدين المتبقي في ذمتكم بعد هذا السداد:*
👉 *{total_customer_debt}*

نشكركم على التزامكم وسرعة سدادكم وجزاكم الله كل خير! 🌸
📞 للتواصل: {store_phone}`
};

/**
 * Format Arabic WhatsApp Message for Debt on Invoice Creation (عند إصدار فاتورة بالآجل)
 */
export function buildDebtInvoiceMessage(params: {
  storeSettings: StoreSettings;
  customer: Customer;
  sale: Sale;
  remainingDebt: number;
  bulletin?: ExchangeRateBulletin;
}): string {
  const { storeSettings, customer, sale, remainingDebt, bulletin } = params;
  const storeName = storeSettings.storeNameAr || 'متجرنا';
  const currencySymbol = storeSettings.currency.symbolNative || storeSettings.currency.symbol || 'ل.س';

  // Items breakdown with emojis
  let itemsText = '';
  if (storeSettings.includeItemsListInDebtMessage !== false) {
    itemsText = sale.items
      .map((item, idx) => {
        const unit = item.isWholesale ? ` (${item.wholesaleUnit || 'طرد/جملة'})` : '';
        return `${idx + 1}. *${item.productNameAr}* × ${item.quantity}${unit} = ${item.total.toLocaleString()} ${currencySymbol}`;
      })
      .join('\n');
  } else {
    itemsText = `(تم شراء ${sale.items.length} أصناف)`;
  }

  // Multi-currency calculation if Syrian Pound / Lebanese Pound / Bulletin available
  let exchangeNote = '';
  let usdRateStr = '';
  const isLbp = storeSettings.currency.code === 'LBP' || currencySymbol.includes('ل.ل');
  const isSyp = storeSettings.currency.code === 'SYP' || currencySymbol.includes('ل.س');
  if (storeSettings.includeExchangeRateInDebtMessage !== false && bulletin && (isSyp || isLbp)) {
    if (bulletin.usdSellRate > 0) {
      const usdTotalDebt = (customer.currentDebt / bulletin.usdSellRate).toFixed(2);
      const usdInvoiceDebt = (remainingDebt / bulletin.usdSellRate).toFixed(2);
      const rateLabel = isLbp ? 'ل.ل/$' : 'ل.س/$';
      const sourceName = isLbp ? 'سعر صرف السوق اللبناني' : 'موقع الليرة اليوم';
      usdRateStr = `${bulletin.usdSellRate.toLocaleString()} ${rateLabel}`;
      exchangeNote = `\n💱 *المعادل التقريبي بالدولار (${bulletin.usdSellRate.toLocaleString()} ${rateLabel}):*\n💵 قيمة دين هذه الفاتورة: حوالي *$${usdInvoiceDebt}*\n💵 إجمالي ذممك بالدولار: حوالي *$${usdTotalDebt}* (${sourceName})\n`;
    }
  }

  const rawTemplate = storeSettings.debtInvoiceMessageTemplate && storeSettings.debtInvoiceMessageTemplate.trim().length > 0
    ? storeSettings.debtInvoiceMessageTemplate
    : DEFAULT_TEMPLATES.invoice_created;

  const totalDebt = customer.currentDebt || remainingDebt;
  const dateFormatted = new Date(sale.createdAt).toLocaleDateString('ar-SY', { dateStyle: 'full' });

  const msg = rawTemplate
    .replace(/{customer_name}/g, customer.name)
    .replace(/{store_name}/g, storeName)
    .replace(/{invoice_number}/g, sale.invoiceNumber || 'INV-000')
    .replace(/{invoice_date}/g, dateFormatted)
    .replace(/{items_list}/g, itemsText)
    .replace(/{total_amount}/g, `${sale.total.toLocaleString()} ${currencySymbol}`)
    .replace(/{paid_amount}/g, `${sale.paidAmount.toLocaleString()} ${currencySymbol}`)
    .replace(/{remaining_amount}/g, `${remainingDebt.toLocaleString()} ${currencySymbol}`)
    .replace(/{total_customer_debt}/g, `${totalDebt.toLocaleString()} ${currencySymbol}`)
    .replace(/{usd_equivalent}/g, exchangeNote)
    .replace(/{usd_rate}/g, usdRateStr)
    .replace(/{days}/g, String(storeSettings.debtReminderDays || 7))
    .replace(/{store_phone}/g, storeSettings.phone || storeSettings.mobile || storeSettings.managerWhatsappPhone || '')
    .replace(/{store_address}/g, storeSettings.address || '');

  return msg.trim();
}

/**
 * Format Periodic Reminder Message for Customer Debt (رسالة تذكير دورية بالتسديد)
 */
export function buildDebtPeriodicReminderMessage(params: {
  storeSettings: StoreSettings;
  customer: Customer;
  bulletin?: ExchangeRateBulletin;
}): string {
  const { storeSettings, customer, bulletin } = params;
  const storeName = storeSettings.storeNameAr || 'متجرنا';
  const currencySymbol = storeSettings.currency.symbolNative || storeSettings.currency.symbol || 'ل.س';
  const totalDebt = customer.currentDebt || 0;

  let exchangeNote = '';
  let usdRateStr = '';
  const isLbp = storeSettings.currency.code === 'LBP' || currencySymbol.includes('ل.ل');
  const isSyp = storeSettings.currency.code === 'SYP' || currencySymbol.includes('ل.س');
  if (storeSettings.includeExchangeRateInDebtMessage !== false && bulletin && (isSyp || isLbp)) {
    if (bulletin.usdSellRate > 0) {
      const usdTotalDebt = (totalDebt / bulletin.usdSellRate).toFixed(2);
      const rateLabel = isLbp ? 'ل.ل/$' : 'ل.س/$';
      const sourceName = isLbp ? 'سعر صرف السوق اللبناني' : 'موقع الليرة اليوم';
      usdRateStr = `${bulletin.usdSellRate.toLocaleString()} ${rateLabel}`;
      exchangeNote = `\n💱 *المعادل بسعر صرف العملة اليوم (${bulletin.usdSellRate.toLocaleString()} ${rateLabel}):*\n💵 إجمالي الذمة بالدولار: *$${usdTotalDebt}* (وفق ${sourceName})\n`;
    }
  }

  const rawTemplate = storeSettings.debtReminderMessageTemplate && storeSettings.debtReminderMessageTemplate.trim().length > 0
    ? storeSettings.debtReminderMessageTemplate
    : DEFAULT_TEMPLATES.periodic_reminder;

  const msg = rawTemplate
    .replace(/{customer_name}/g, customer.name)
    .replace(/{store_name}/g, storeName)
    .replace(/{total_customer_debt}/g, `${totalDebt.toLocaleString()} ${currencySymbol}`)
    .replace(/{debt_amount}/g, `${totalDebt.toLocaleString()} ${currencySymbol}`)
    .replace(/{remaining_amount}/g, `${totalDebt.toLocaleString()} ${currencySymbol}`)
    .replace(/{usd_equivalent}/g, exchangeNote)
    .replace(/{usd_rate}/g, usdRateStr)
    .replace(/{days}/g, String(storeSettings.debtReminderDays || 7))
    .replace(/{store_phone}/g, storeSettings.phone || storeSettings.mobile || storeSettings.managerWhatsappPhone || '')
    .replace(/{store_address}/g, storeSettings.address || '');

  return msg.trim();
}

/**
 * Format Overdue Notice Message
 */
export function buildDebtOverdueMessage(params: {
  storeSettings: StoreSettings;
  customer: Customer;
  bulletin?: ExchangeRateBulletin;
}): string {
  const { storeSettings, customer, bulletin } = params;
  const storeName = storeSettings.storeNameAr || 'متجرنا';
  const currencySymbol = storeSettings.currency.symbolNative || storeSettings.currency.symbol || 'ل.س';
  const totalDebt = customer.currentDebt || 0;

  let exchangeNote = '';
  const isLbp = storeSettings.currency.code === 'LBP' || currencySymbol.includes('ل.ل');
  const isSyp = storeSettings.currency.code === 'SYP' || currencySymbol.includes('ل.س');
  if (storeSettings.includeExchangeRateInDebtMessage !== false && bulletin && (isSyp || isLbp)) {
    if (bulletin.usdSellRate > 0) {
      const usdTotalDebt = (totalDebt / bulletin.usdSellRate).toFixed(2);
      const sourceName = isLbp ? 'سوق بيروت وصيرفة' : 'نشرة الليرة اليوم';
      exchangeNote = `\n💱 *المعادل بالدولار:* *$${usdTotalDebt}* (وفق ${sourceName})\n`;
    }
  }

  const rawTemplate = storeSettings.debtOverdueMessageTemplate && storeSettings.debtOverdueMessageTemplate.trim().length > 0
    ? storeSettings.debtOverdueMessageTemplate
    : DEFAULT_TEMPLATES.overdue_notice;

  return rawTemplate
    .replace(/{customer_name}/g, customer.name)
    .replace(/{store_name}/g, storeName)
    .replace(/{total_customer_debt}/g, `${totalDebt.toLocaleString()} ${currencySymbol}`)
    .replace(/{debt_amount}/g, `${totalDebt.toLocaleString()} ${currencySymbol}`)
    .replace(/{remaining_amount}/g, `${totalDebt.toLocaleString()} ${currencySymbol}`)
    .replace(/{usd_equivalent}/g, exchangeNote)
    .replace(/{days}/g, String(storeSettings.debtReminderDays || 7))
    .replace(/{store_phone}/g, storeSettings.phone || storeSettings.mobile || storeSettings.managerWhatsappPhone || '')
    .trim();
}

/**
 * Format Payment Receipt Voucher Message
 */
export function buildDebtPaymentReceiptMessage(params: {
  storeSettings: StoreSettings;
  customer: Customer;
  voucher: DebtTransaction;
  paymentAmount: number;
  newBalance: number;
}): string {
  const { storeSettings, customer, voucher, paymentAmount, newBalance } = params;
  const storeName = storeSettings.storeNameAr || 'متجرنا';
  const currencySymbol = storeSettings.currency.symbolNative || storeSettings.currency.symbol || 'ل.س';
  const dateFormatted = new Date(voucher.createdAt || new Date()).toLocaleString('ar-SY', { dateStyle: 'medium', timeStyle: 'short' });

  const rawTemplate = storeSettings.debtPaymentReceiptTemplate && storeSettings.debtPaymentReceiptTemplate.trim().length > 0
    ? storeSettings.debtPaymentReceiptTemplate
    : DEFAULT_TEMPLATES.payment_receipt;

  return rawTemplate
    .replace(/{customer_name}/g, customer.name)
    .replace(/{store_name}/g, storeName)
    .replace(/{voucher_number}/g, voucher.voucherNumber || (voucher.id ? voucher.id.slice(-6).toUpperCase() : 'REC-001'))
    .replace(/{payment_amount}/g, `${paymentAmount.toLocaleString()} ${currencySymbol}`)
    .replace(/{invoice_date}/g, dateFormatted)
    .replace(/{total_customer_debt}/g, `${Math.max(0, newBalance).toLocaleString()} ${currencySymbol}`)
    .replace(/{store_phone}/g, storeSettings.phone || storeSettings.mobile || storeSettings.managerWhatsappPhone || '')
    .trim();
}

/**
 * Build comprehensive WhatsApp message for an Official Receipt / Payment / Charge Voucher (سند قبض / سند صرف / إشعار قيد)
 */
export function buildVoucherReceiptWhatsAppMessage(params: {
  storeSettings: StoreSettings;
  transaction?: DebtTransaction;
  voucher?: DebtTransaction;
  partyPhone?: string;
  bulletin?: ExchangeRateBulletin;
}): string {
  const { storeSettings, bulletin } = params;
  const transaction = (params.transaction || params.voucher)!;
  if (!transaction) return '';
  const storeName = storeSettings.storeNameAr || 'متجرنا';
  const currencySymbol = storeSettings.currency.symbolNative || storeSettings.currency.symbol || 'ل.س';
  const isPayment = transaction.type === 'payment';
  const isCustomer = transaction.partyType === 'customer';

  const voucherTitle = isPayment
    ? isCustomer
      ? '🧾 *سند قبض رسمي (تسديد دفعة دين)*'
      : '🧾 *سند صرف مالي (سداد دفعة لمورد)*'
    : isCustomer
    ? '📋 *إشعار قيد ذمة / فاتورة مبيعات آجلة*'
    : '📦 *فاتورة مشتريات وتوريد بضاعة*';

  const dateFormatted = new Date(transaction.createdAt || new Date()).toLocaleString('ar-SY', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  const paymentMethodLabel =
    transaction.paymentMethod === 'cash'
      ? 'نقداً (كاش)'
      : transaction.paymentMethod === 'card'
      ? 'بطاقة بنكية'
      : transaction.paymentMethod === 'transfer'
      ? 'حوالة مالية / إلكترونية'
      : transaction.paymentMethod === 'check'
      ? 'شيك مصرفي'
      : 'نقداً';

  const discount = transaction.discountAmount || 0;
  const totalDeducted = transaction.amount + discount;

  let itemsSection = '';
  if (transaction.purchaseItems && transaction.purchaseItems.length > 0) {
    const lines = transaction.purchaseItems.map(
      (item, idx) =>
        `${idx + 1}. *${item.productName}* — الكمية: ${item.quantity} ${item.unit || 'قطعة'} × ${item.costPrice.toLocaleString()} = *${item.totalCost.toLocaleString()} ${currencySymbol}*`
    );
    itemsSection = `\n📦 *الأصناف الموردة في الفاتورة:*\n${lines.join('\n')}\n`;
  }

  let exchangeNote = '';
  const isLbp = storeSettings.currency.code === 'LBP' || currencySymbol.includes('ل.ل');
  const isSyp = storeSettings.currency.code === 'SYP' || currencySymbol.includes('ل.س');
  if (storeSettings.includeExchangeRateInDebtMessage !== false && bulletin && (isSyp || isLbp) && bulletin.usdSellRate > 0) {
    const usdPaid = (transaction.amount / bulletin.usdSellRate).toFixed(2);
    const usdRem = (Math.max(0, transaction.newBalance) / bulletin.usdSellRate).toFixed(2);
    const rateLabel = isLbp ? 'ل.ل/$' : 'ل.س/$';
    exchangeNote = `\n💱 *المعادل بالدولار (${bulletin.usdSellRate.toLocaleString()} ${rateLabel}):*\n• قيمة السند: *$${usdPaid}* | الرصيد المتبقي: *$${usdRem}*\n`;
  }

  const greetingName = isCustomer ? `الأستاذ *${transaction.partyName}* المحترم` : `السادة *${transaction.partyName}* المحترمين`;
  const storePhone = storeSettings.phone || storeSettings.mobile || storeSettings.managerWhatsappPhone || '';

  return [
    voucherTitle,
    `من: *${storeName}*`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `👤 إلى: ${greetingName}`,
    `🔖 *رقم السند:* ${transaction.voucherNumber}`,
    transaction.referenceInvoice ? `📄 *الفاتورة المرجعية:* ${transaction.referenceInvoice}` : '',
    `📅 *التاريخ والوقت:* ${dateFormatted}`,
    `💳 *طريقة الدفع:* ${paymentMethodLabel}`,
    itemsSection,
    `💰 *التفاصيل المالية للسند:*`,
    `• الرصيد السابق قبل العملية: ${transaction.previousBalance.toLocaleString()} ${currencySymbol}`,
    isPayment
      ? `• ✅ *المبلغ المقبوض / المسدد:* *${transaction.amount.toLocaleString()} ${currencySymbol}*`
      : `• ➕ *قيمة القيد / الفاتورة:* *${transaction.amount.toLocaleString()} ${currencySymbol}*`,
    discount > 0 ? `• 🎁 خصم التسوية الممنوح: ${discount.toLocaleString()} ${currencySymbol}` : '',
    discount > 0 ? `• إجمالي المخصوم من الرصيد: ${totalDeducted.toLocaleString()} ${currencySymbol}` : '',
    transaction.paidAmount !== undefined && !isPayment
      ? `• المسدد نقداً عند الفاتورة: ${transaction.paidAmount.toLocaleString()} ${currencySymbol}`
      : '',
    `• 📌 *الرصيد المتبقي الحالي:* *${Math.max(0, transaction.newBalance).toLocaleString()} ${currencySymbol}*`,
    exchangeNote,
    transaction.notes ? `📝 *البيان / ملاحظات:* ${transaction.notes}` : '',
    `👨‍💼 *الموظف المسؤول:* ${transaction.recordedBy}`,
    `━━━━━━━━━━━━━━━━━━━━`,
    isPayment
      ? '✨ نشكر لكم التزامكم وحسن تعاملكم معنا. هذا السند بمثابة إشعار استلام رسمي.'
      : '✨ نشكر ثقتكم بنا ونتمنى لكم دوام التوفيق.',
    storePhone ? `📞 للاستفسار: ${storePhone}` : ''
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * Build comprehensive WhatsApp message for an Installment Plan Invoice & Schedule (فاتورة وجدول الأقساط)
 */
export function buildInstallmentPlanWhatsAppMessage(params: {
  storeSettings: StoreSettings;
  plan: InvoiceInstallmentPlan;
  bulletin?: ExchangeRateBulletin;
}): string {
  const { storeSettings, plan, bulletin } = params;
  const storeName = storeSettings.storeNameAr || 'متجرنا';
  const currencySymbol = storeSettings.currency.symbolNative || storeSettings.currency.symbol || 'ل.س';
  const isCustomer = plan.partyType === 'customer';

  const totalPaidInstallments = plan.installments
    .filter(i => i.status === 'paid')
    .reduce((sum, i) => sum + (i.paidAmount || i.amount), 0);
  const totalRemaining =
    plan.remainingAmount !== undefined
      ? plan.remainingAmount
      : Math.max(0, plan.financedAmount - totalPaidInstallments);
  const paidCount = plan.installments.filter(i => i.status === 'paid').length;
  const downPaymentVal = plan.downPaymentAmount || 0;

  const frequencyLabel =
    plan.frequency === 'weekly'
      ? 'أسبوعي'
      : plan.frequency === 'biweekly'
      ? 'نصف شهري (كل 15 يوم)'
      : plan.frequency === 'monthly'
      ? 'شهري'
      : 'تواريخ مخصصة';

  const todayStr = new Date().toISOString().split('T')[0];

  const scheduleLines = plan.installments.map(inst => {
    const isPaid = inst.status === 'paid';
    const isOverdue = !isPaid && inst.dueDate < todayStr;
    const statusBadge = isPaid
      ? `✅ مدفوع (${inst.voucherNumber || 'سند قبض'})`
      : isOverdue
      ? '⚠️ متأخر عن الاستحقاق'
      : '⏳ بانتظار السداد';

    return `  *${inst.installmentNumber}.* استحقاق *${inst.dueDate}* ⬅️ *${inst.amount.toLocaleString()} ${currencySymbol}* [${statusBadge}]`;
  });

  let exchangeNote = '';
  const isLbp = storeSettings.currency.code === 'LBP' || currencySymbol.includes('ل.ل');
  const isSyp = storeSettings.currency.code === 'SYP' || currencySymbol.includes('ل.س');
  if (storeSettings.includeExchangeRateInDebtMessage !== false && bulletin && (isSyp || isLbp) && bulletin.usdSellRate > 0) {
    const usdFinanced = (plan.financedAmount / bulletin.usdSellRate).toFixed(2);
    const usdRemaining = (totalRemaining / bulletin.usdSellRate).toFixed(2);
    const rateLabel = isLbp ? 'ل.ل/$' : 'ل.س/$';
    exchangeNote = `\n💱 *المعادل بالدولار (${bulletin.usdSellRate.toLocaleString()} ${rateLabel}):*\n• إجمالي التقسيط: *$${usdFinanced}* | المتبقي حالياً: *$${usdRemaining}*\n`;
  }

  const storePhone = storeSettings.phone || storeSettings.mobile || storeSettings.managerWhatsappPhone || '';

  return [
    `📑 *فاتورة وعقد جدولة أقساط رسمي*`,
    `من: *${storeName}*`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `👤 ${isCustomer ? 'العميل' : 'المورد'}: *${plan.partyName}*`,
    `🧾 *رقم الفاتورة المقسطة:* ${plan.invoiceNumber}`,
    `📅 *تاريخ الاتفاق:* ${new Date(plan.createdAt).toLocaleDateString('ar-SY')} | *نظام الدفعات:* ${frequencyLabel}`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `💰 *الملخص المالي للفاتورة المقسطة:*`,
    `• إجمالي قيمة الفاتورة: *${plan.totalInvoiceAmount.toLocaleString()} ${currencySymbol}*`,
    `• الدفعة الأولى (المقدم): ${downPaymentVal.toLocaleString()} ${currencySymbol}`,
    `• صافي المبلغ المقسط: *${plan.financedAmount.toLocaleString()} ${currencySymbol}*`,
    `• المسدد من الأقساط (${paidCount}/${plan.installmentsCount}): ${totalPaidInstallments.toLocaleString()} ${currencySymbol}`,
    `• 🔴 *الرصيد المتبقي للسداد:* *${totalRemaining.toLocaleString()} ${currencySymbol}*`,
    exchangeNote,
    `📅 *جدول الدفعات وتواريخ الاستحقاق (${plan.installmentsCount} دفعات):*`,
    ...scheduleLines,
    plan.notes ? `\n📝 *ملاحظات وشروط إضافية:* ${plan.notes}` : '',
    `━━━━━━━━━━━━━━━━━━━━`,
    `✨ نرجو الالتزام بمواعيد الاستحقاق المحددة أعلاه. شاكرين لكم ثقتكم وحسن تعاملكم معنا.`,
    storePhone ? `📞 للاستفسار والتسديد: ${storePhone}` : ''
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * Clean and format international phone number for WhatsApp
 */
export function formatPhoneForWhatsApp(phone: string): string {
  let clean = phone.replace(/[^0-9]/g, '');
  // If starts with 09 (Syrian mobile local format), convert to +9639
  if (clean.startsWith('09') && clean.length === 10) {
    clean = '963' + clean.slice(1);
  } else if (clean.startsWith('9') && clean.length === 9) {
    clean = '963' + clean;
  } else if (clean.startsWith('00')) {
    clean = clean.slice(2);
  }
  return clean;
}

/**
 * Generate Direct WhatsApp Link with Pre-filled Message
 */
export function getWhatsAppClickToChatUrl(phone: string, message: string): string {
  const cleanPhone = formatPhoneForWhatsApp(phone);
  const encodedText = encodeURIComponent(message);
  return cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodedText}`
    : `https://wa.me/?text=${encodedText}`;
}

/**
 * Safely open WhatsApp deep link in a new tab using DOM anchor click (works inside sandboxed iframes)
 */
export function openWhatsAppDeepLink(phone: string, message: string): string {
  const waUrl = getWhatsAppClickToChatUrl(phone, message);
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    try {
      const link = document.createElement('a');
      link.href = waUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.warn('WhatsApp anchor open fallback error:', e);
    }
  }
  return waUrl;
}

/**
 * Automatically send WhatsApp Message:
 * 1. Attempts direct background WhatsApp Business API via Backend endpoint (if configured)
 * 2. Falls back to opening official WhatsApp / Web in new tab
 */
export async function sendWhatsAppDebtMessage(params: {
  phone: string;
  message: string;
  customerName: string;
  customerId: string;
  saleId?: string;
  invoiceNumber?: string;
  amountDue: number;
  totalDebt: number;
  currencySymbol: string;
  type: DebtReminderLog['type'];
  storeSettings: StoreSettings;
}): Promise<{ success: boolean; method: 'direct_api' | 'whatsapp_link'; logId: string; waUrl: string }> {
  const {
    phone,
    message,
    customerName,
    customerId,
    saleId,
    invoiceNumber,
    amountDue,
    totalDebt,
    currencySymbol,
    type,
    storeSettings
  } = params;

  const cleanPhone = formatPhoneForWhatsApp(phone);
  const waUrl = getWhatsAppClickToChatUrl(cleanPhone, message);
  let method: 'direct_api' | 'whatsapp_link' = 'whatsapp_link';
  let isApiSuccess = false;

  const apiKey = storeSettings.whatsappApiKey;
  const phoneNumberId = storeSettings.whatsappPhoneId || storeSettings.whatsappPhoneNumberId;

  // 1. Try Backend WhatsApp Business Dispatcher if configured, otherwise open WhatsApp immediately
  if (apiKey && phoneNumberId && cleanPhone) {
    try {
      const res = await fetch('/api/whatsapp/send-debt-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanPhone,
          message,
          customerName,
          customerId,
          saleId,
          invoiceNumber,
          amountDue,
          totalDebt,
          apiKey,
          phoneNumberId,
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.mode === 'whatsapp_cloud_api') {
          isApiSuccess = true;
          method = 'direct_api';
        }
      }
    } catch (err) {
      console.warn('WhatsApp Direct API Dispatch failed, fallback to click to chat:', err);
    }
  }

  // 2. If API not configured or in simulated mode, open WhatsApp directly for the user
  if (!isApiSuccess) {
    openWhatsAppDeepLink(cleanPhone, message);
  }

  // 3. Save Log in LocalStorage for tracking
  const logId = `wlog_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
  const logEntry: DebtReminderLog = {
    id: logId,
    customerId,
    customerName,
    customerPhone: phone,
    saleId,
    invoiceNumber,
    type,
    amountDue,
    totalDebt,
    currencySymbol,
    messageText: message,
    status: isApiSuccess ? 'sent' : 'opened_in_whatsapp',
    sentAt: new Date().toISOString(),
    method
  };

  try {
    const existingLogs: DebtReminderLog[] = JSON.parse(
      localStorage.getItem(DEBT_COLLECTION_STORAGE_KEY) || '[]'
    );
    existingLogs.unshift(logEntry);
    localStorage.setItem(
      DEBT_COLLECTION_STORAGE_KEY,
      JSON.stringify(existingLogs.slice(0, 500))
    );
  } catch (err) {
    console.error('Error saving debt reminder log:', err);
  }

  return {
    success: true,
    method,
    logId,
    waUrl
  };
}

/**
 * Periodic Debt Checker:
 * Runs periodically to check all customers with unpaid debts who haven't received a reminder
 * within the configured interval (e.g. daily, 3 days, 7 days, 14 days, 30 days).
 */
export function checkAndSendPeriodicDebtReminders(params: {
  customers: Customer[];
  storeSettings: StoreSettings;
  bulletin?: ExchangeRateBulletin;
  onReminderTriggered?: (customer: Customer, message: string) => void;
}): number {
  const { customers, storeSettings, bulletin, onReminderTriggered } = params;
  if (!storeSettings.autoSendDebtReminders) {
    return 0;
  }

  let intervalDays = storeSettings.debtReminderDays || 7;
  if (storeSettings.debtReminderFrequency === 'daily') intervalDays = 1;
  else if (storeSettings.debtReminderFrequency === 'every_3_days') intervalDays = 3;
  else if (storeSettings.debtReminderFrequency === 'weekly') intervalDays = 7;
  else if (storeSettings.debtReminderFrequency === 'biweekly') intervalDays = 14;
  else if (storeSettings.debtReminderFrequency === 'monthly') intervalDays = 30;

  const intervalMs = intervalDays * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const minThreshold = storeSettings.debtReminderMinThreshold || 0;

  let existingLogs: DebtReminderLog[] = [];
  try {
    existingLogs = JSON.parse(localStorage.getItem(DEBT_COLLECTION_STORAGE_KEY) || '[]');
  } catch {
    existingLogs = [];
  }

  let triggeredCount = 0;

  for (const customer of customers) {
    const debt = customer.currentDebt || 0;
    if (debt <= 0 || debt < minThreshold || !customer.phone) continue;

    // Find last reminder sent to this customer
    const lastReminder = existingLogs.find(l => l.customerId === customer.id && (l.type === 'scheduled_reminder' || l.type === 'manual_reminder'));
    let shouldSend = false;

    if (!lastReminder) {
      shouldSend = true;
    } else {
      const lastSentTime = new Date(lastReminder.sentAt).getTime();
      if (now - lastSentTime >= intervalMs) {
        shouldSend = true;
      }
    }

    if (shouldSend) {
      const message = buildDebtPeriodicReminderMessage({
        storeSettings,
        customer,
        bulletin
      });

      sendWhatsAppDebtMessage({
        phone: customer.phone,
        message,
        customerName: customer.name,
        customerId: customer.id,
        amountDue: debt,
        totalDebt: debt,
        currencySymbol: storeSettings.currency.symbolNative || storeSettings.currency.symbol,
        type: 'scheduled_reminder',
        storeSettings
      });

      if (onReminderTriggered) {
        onReminderTriggered(customer, message);
      }

      triggeredCount++;
    }
  }

  localStorage.setItem(LAST_REMINDER_CHECK_KEY, new Date().toISOString());
  return triggeredCount;
}

/**
 * Test WhatsApp Cloud API Connection via Backend Endpoint
 */
export async function testWhatsAppCloudApiConnection(params: {
  apiKey: string;
  phoneNumberId: string;
  testPhone: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    const formattedPhone = formatPhoneForWhatsApp(params.testPhone);
    const res = await fetch('/api/whatsapp/send-debt-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: params.apiKey,
        phoneNumberId: params.phoneNumberId,
        phone: formattedPhone,
        to: formattedPhone,
        customerName: 'اختبار اتصال واتساب',
        message: '🧪 رسالة تجريبية من نظام كاشير كيان: تم التحقق من ربط WhatsApp Cloud API بنجاح!'
      })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      return {
        success: true,
        message: 'تم إرسال الرسالة التجريبية بنجاح عبر سيرفر واتساب للأعمال!'
      };
    } else {
      return {
        success: false,
        message: data.error || data.message || 'فشل الاتصال، يرجى التأكد من الـ Token ورقم الهاتف'
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'خطأ في الاتصال بالخادم'
    };
  }
}


