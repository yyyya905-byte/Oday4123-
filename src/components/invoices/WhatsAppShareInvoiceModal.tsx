import React, { useState, useEffect, useMemo } from 'react';
import { Sale, Customer, StoreSettings } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  X,
  Share2,
  Copy,
  Check,
  Send,
  MessageCircle,
  ExternalLink,
  Phone,
  Receipt,
  Sparkles,
  Link as LinkIcon,
  Store,
  User,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { soundEffects } from '../../services/audio';
import { haptics } from '../../services/haptics';
import {
  formatPhoneForWhatsApp,
  getWhatsAppClickToChatUrl,
  openWhatsAppDeepLink
} from '../../services/debtCollectionService';

interface WhatsAppShareInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  customer?: Customer | null;
}

/**
 * Builds an authentic, clear, customer-friendly WhatsApp receipt message
 */
export function buildCustomerInvoiceWhatsAppMessage(params: {
  storeSettings: StoreSettings;
  sale: Sale;
  customer?: Customer | null;
  quickLink: string;
}): string {
  const { storeSettings, sale, customer, quickLink } = params;
  const storeName = storeSettings.storeNameAr || storeSettings.storeNameEn || 'متجرنا';
  const currencySymbol = storeSettings.currency.symbolNative || storeSettings.currency.symbol || 'ل.س';
  const phone = storeSettings.phone || storeSettings.mobile || storeSettings.managerWhatsappPhone || '';
  const address = storeSettings.address || '';

  const dateFormatted = new Date(sale.createdAt).toLocaleString('ar-SY', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const paymentLabels: Record<string, string> = {
    cash: 'نقداً (Cash) 💵',
    card: 'بطاقة مصرفية 💳',
    credit: 'آجل على الحساب ⏳',
    split: 'دفع مجزأ (نقد + آجل) ⚖️',
    transfer: 'تحويل مالي 📲'
  };

  const paymentLabel = paymentLabels[sale.paymentMethod] || sale.paymentMethod;

  // Build items list
  const itemsText = sale.items
    .map((item, idx) => {
      const unit = item.isWholesale ? ` (${item.wholesaleUnit || 'طرد/جملة'})` : '';
      const variant = item.variantNameAr ? ` [${item.variantNameAr}]` : '';
      return `  *${idx + 1}.* ${item.productNameAr}${variant} × ${item.quantity}${unit} = *${item.total.toLocaleString()} ${currencySymbol}*`;
    })
    .join('\n');

  // Customer greeting
  const customerName = sale.customerName || customer?.name || 'عميلنا العزيز';
  const customerDebt = customer?.currentDebt ? `\n📊 *رصيد حسابكم الحالي لدينا:* ${customer.currentDebt.toLocaleString()} ${currencySymbol}` : '';

  return [
    `🧾 *فاتورة مشتريات إلكترونية*`,
    `🏢 *${storeName}*`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `مرحباً بك أستاذ/ة *${customerName}* المحترم/ة 🌸`,
    `شكراً لتسوقكم من *${storeName}*، نرفق لكم تفاصيل فاتورتكم:`,
    ``,
    `🔖 *رقم الفاتورة:* #${sale.invoiceNumber}`,
    sale.queueNumber ? `🔢 *رقم الطابور / الطلب:* #${String(sale.queueNumber).padStart(3, '0')}` : '',
    sale.tableName ? `🍽️ *الطاولة / المكان:* ${sale.tableName}` : '',
    `📅 *التاريخ والوقت:* ${dateFormatted}`,
    `💳 *طريقة الدفع:* ${paymentLabel}`,
    `👨‍💼 *الكاشير:* ${sale.cashierName}`,
    ``,
    `📋 *قائمة المشتريات والأصناف:*`,
    itemsText,
    `━━━━━━━━━━━━━━━━━━━━`,
    `💰 *المجموع الفرعي:* ${sale.subtotal.toLocaleString()} ${currencySymbol}`,
    sale.discountTotal > 0 ? `🎁 *إجمالي الخصم:* -${sale.discountTotal.toLocaleString()} ${currencySymbol}` : '',
    sale.taxTotal > 0 ? `🏛️ *الضريبة:* +${sale.taxTotal.toLocaleString()} ${currencySymbol}` : '',
    `💵 *المبلغ الإجمالي النهائي:* *${sale.total.toLocaleString()} ${currencySymbol}*`,
    customerDebt,
    ``,
    `🔗 *رابط الفاتورة والتفاصيل:*`,
    quickLink,
    ``,
    `━━━━━━━━━━━━━━━━━━━━`,
    `✨ نسعد دائماً بخدمتكم ونتمنى لكم يوماً طيباً ومباركاً!`,
    phone ? `📞 للاستفسار والتواصل: ${phone}` : '',
    address ? `📍 العنوان: ${address}` : ''
  ]
    .filter(Boolean)
    .join('\n');
}

export const WhatsAppShareInvoiceModal: React.FC<WhatsAppShareInvoiceModalProps> = ({
  isOpen,
  onClose,
  sale,
  customer
}) => {
  const { settings, formatCurrency, language, notify } = useApp();

  const [phoneInput, setPhoneInput] = useState<string>('');
  const [copiedMessage, setCopiedMessage] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Initialize phone when sale or customer changes
  useEffect(() => {
    if (sale) {
      const rawPhone = sale.customerPhone || customer?.phone || '';
      setPhoneInput(rawPhone);
      setCopiedMessage(false);
      setCopiedLink(false);
    }
  }, [sale, customer]);

  // Generate Digital Quick Link for this invoice
  const quickLink = useMemo(() => {
    if (!sale) return '';
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://kianpos.app';
    return `${origin}/?invoice=${encodeURIComponent(sale.invoiceNumber)}`;
  }, [sale]);

  // Pre-generate full WhatsApp message text
  const messageText = useMemo(() => {
    if (!sale) return '';
    return buildCustomerInvoiceWhatsAppMessage({
      storeSettings: settings,
      sale,
      customer,
      quickLink
    });
  }, [sale, customer, settings, quickLink]);

  if (!isOpen || !sale) return null;

  const handleCopyMessage = async () => {
    soundEffects.playSuccess();
    haptics.confirm();
    try {
      await navigator.clipboard.writeText(messageText);
      setCopiedMessage(true);
      notify('تم نسخ نص الفاتورة', 'يمكنك لصق الرسالة مباشرة في واتساب أو أي تطبيق آخر', 'success');
      setTimeout(() => setCopiedMessage(false), 3000);
    } catch {
      notify('تعذر النسخ التلقائي', 'يرجى تحديد النص ونسخه يدوياً', 'warning');
    }
  };

  const handleCopyLinkOnly = async () => {
    soundEffects.playSuccess();
    haptics.tap();
    try {
      await navigator.clipboard.writeText(quickLink);
      setCopiedLink(true);
      notify('تم نسخ رابط الفاتورة', quickLink, 'success');
      setTimeout(() => setCopiedLink(false), 3000);
    } catch {
      notify('تعذر النسخ', 'يرجى نسخ الرابط يدوياً', 'warning');
    }
  };

  const handleSendToWhatsApp = () => {
    soundEffects.playSuccess();
    haptics.confirm();
    const clean = formatPhoneForWhatsApp(phoneInput);
    openWhatsAppDeepLink(clean, messageText);
    notify(
      'جاري فتح واتساب...',
      clean ? `إرسال الفاتورة إلى الرقم ${phoneInput}` : 'فتح واتساب لاختيار جهة الاتصال للمشاركة',
      'info'
    );
  };

  const cleanFormattedPhone = formatPhoneForWhatsApp(phoneInput);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="whatsapp-share-title"
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        className="relative w-full max-w-xl max-h-[92dvh] flex flex-col apple-glass-card rounded-3xl shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100 animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-200/70 dark:border-white/[0.08] bg-emerald-500/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/30">
              <MessageCircle className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 id="whatsapp-share-title" className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>مشاركة الفاتورة عبر واتساب</span>
                <span className="text-xs px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono font-bold">
                  #{sale.invoiceNumber}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                توليد رابط سريع ورسالة تفصيلية تحتوي على مشتريات العميل وحسابه
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              soundEffects.playGlassTap();
              onClose();
            }}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
          {/* Quick Stats Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3 rounded-2xl bg-slate-100/80 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.06] text-xs">
            <div>
              <span className="text-[11px] text-slate-400 block">العميل المستلم:</span>
              <span className="font-bold text-slate-900 dark:text-white truncate block">
                {sale.customerName || customer?.name || 'عميل نقدي'}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">إجمالي الفاتورة:</span>
              <span className="font-black text-emerald-600 dark:text-emerald-400 font-mono block">
                {formatCurrency(sale.total)}
              </span>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="text-[11px] text-slate-400 block">عدد الأصناف:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 font-mono block">
                {sale.items.reduce((s, it) => s + it.quantity, 0)} أصناف
              </span>
            </div>
          </div>

          {/* Customer Phone Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-500" />
                <span>رقم هاتف العميل على واتساب:</span>
              </span>
              <span className="text-[11px] text-slate-400 font-normal">
                (يمكن تركه فارغاً للاختيار من جهات الاتصال في واتساب)
              </span>
            </label>
            <div className="relative">
              <input
                type="tel"
                value={phoneInput}
                onChange={e => setPhoneInput(e.target.value)}
                placeholder="مثال: 0933123456 أو 963933123456 أو +961..."
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs font-mono font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/40 min-h-[44px]"
                dir="ltr"
              />
              {phoneInput && (
                <button
                  type="button"
                  onClick={() => setPhoneInput('')}
                  className="absolute end-2.5 top-2.5 p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {cleanFormattedPhone ? (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
                ✓ سيتم الإرسال مباشرة إلى: +{cleanFormattedPhone}
              </p>
            ) : (
              <p className="text-[11px] text-slate-400">
                💡 في حال عدم إدخال رقم، سيفتح واتساب نافذة لاختيار المحادثة أو جهة الاتصال مباشرة.
              </p>
            )}
          </div>

          {/* Quick Receipt Web Link Box */}
          <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-300/60 dark:border-emerald-800/60 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <LinkIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-[11px] font-bold text-emerald-900 dark:text-emerald-200 block truncate">
                  رابط الفاتورة الإلكترونية السريع:
                </span>
                <span className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 font-mono truncate block" dir="ltr">
                  {quickLink}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyLinkOnly}
              className="shrink-0 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950 font-bold text-xs border border-emerald-300 dark:border-emerald-800 flex items-center gap-1 cursor-pointer active:scale-95 transition-all min-h-[36px]"
              title="نسخ رابط الفاتورة فقط"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'تم النسخ' : 'نسخ الرابط'}</span>
            </button>
          </div>

          {/* Message Preview Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                معاينة الرسالة الجاهزة للإرسال:
              </label>
              <button
                type="button"
                onClick={handleCopyMessage}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copiedMessage ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedMessage ? 'تم نسخ كامل الرسالة' : 'نسخ نص الرسالة بالكامل'}</span>
              </button>
            </div>

            <div className="relative p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 font-sans whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto selection:bg-emerald-200 selection:text-emerald-900">
              {messageText}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-200/70 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.02] flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleCopyMessage}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 min-h-[44px] shadow-2xs"
          >
            {copiedMessage ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copiedMessage ? 'تم نسخ الرسالة والرابط' : 'نسخ النص والرابط'}</span>
          </button>

          <button
            type="button"
            onClick={handleSendToWhatsApp}
            className="flex-1 sm:flex-initial px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 min-h-[44px] shadow-md shadow-emerald-600/30"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
            <span>مشاركة عبر واتساب الآن</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </button>
        </div>
      </div>
    </div>
  );
};
