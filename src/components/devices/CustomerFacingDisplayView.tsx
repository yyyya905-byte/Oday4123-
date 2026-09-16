import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Tv,
  ShoppingBag,
  Sparkles,
  Award,
  QrCode,
  CheckCircle2,
  ArrowRight,
  Gift,
  Flame,
  CreditCard,
  Smartphone,
  KeyRound,
  Radio
} from 'lucide-react';
import QRCode from 'qrcode';

export const CustomerFacingDisplayView: React.FC<{ onBackToMain?: () => void }> = ({ onBackToMain }) => {
  const { 
    cart, 
    orderDiscount, 
    formatCurrency, 
    settings, 
    language,
    selectedCustomer,
    liveRemoteCart,
    setIsConnectToCashierModalOpen
  } = useApp();

  const [paymentQr, setPaymentQr] = useState<string>('');
  const [promoSlide, setPromoSlide] = useState(0);

  // Synchronize with remote cashier cart or use local cart
  const effectiveCart = (cart && cart.length > 0) ? cart : (liveRemoteCart?.items || []);
  const localSubtotal = cart.reduce((acc, it) => acc + (it.total || 0), 0);
  const localTotal = Math.max(0, localSubtotal - (orderDiscount?.value || 0));

  const subtotal = (cart && cart.length > 0) ? localSubtotal : (liveRemoteCart?.subtotal || 0);
  const total = (cart && cart.length > 0) ? localTotal : (liveRemoteCart?.total || 0);
  const discountVal = (cart && cart.length > 0) ? (orderDiscount?.value || 0) : (liveRemoteCart?.discount || 0);
  const pointsEarned = Math.floor(total / (settings?.pointsSpendRatio || 10000));
  const activeCustomerName = selectedCustomer?.name || liveRemoteCart?.customerName || null;

  // Promotional slideshow items
  const promoOffers = [
    {
      titleAr: "أهلاً وسهلاً بكم في " + settings.storeNameAr,
      titleEn: "Welcome to " + settings.storeNameEn,
      descAr: "يسعدنا خدمتكم بأفضل جودة وأنسب الأسعار",
      descEn: "Serving you with the highest quality and best prices",
      badge: "عرض اليوم",
      color: "from-amber-500 to-amber-600"
    },
    {
      titleAr: "برنامج ولاء ونقاط كيان كاشير 🎁",
      titleEn: "KIAN Loyalty & Points Program",
      descAr: "اجمع النقاط مع كل عملية شراء واستبدلها بخصومات فورية مجانية!",
      descEn: "Earn reward points on every purchase and redeem instant discounts!",
      badge: "نقاط ومكافآت",
      color: "from-emerald-500 to-teal-600"
    },
    {
      titleAr: "دفع إلكتروني سريع وآمن 📱",
      titleEn: "Instant Mobile QR Payment",
      descAr: "ادفع عبر سيريتل كاش أو إم تي إن كاش أو المحافظ الرقمية بكل سهولة",
      descEn: "Pay seamlessly with SyriaTel Cash, MTN Cash or Digital Wallets",
      badge: "دفع إلكتروني",
      color: "from-blue-600 to-indigo-600"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setPromoSlide(prev => (prev + 1) % promoOffers.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // Generate QR for Payment
  useEffect(() => {
    const paymentPayload = `KIAN_POS_PAY|STORE:${settings.storeNameEn}|TOTAL:${total}|CURR:${settings.currency.symbolNative}`;
    QRCode.toDataURL(paymentPayload, {
      width: 200,
      margin: 1,
      color: { dark: '#0f172a', light: '#ffffff' }
    }).then(setPaymentQr).catch(() => {});
  }, [total, settings]);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden font-sans select-none">
      {/* Top Banner Header */}
      <div className="h-20 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          {onBackToMain && (
            <button
              onClick={onBackToMain}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1.5 text-xs font-bold"
            >
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              <span>{language === 'ar' ? 'الرجوع للنظام' : 'Back'}</span>
            </button>
          )}
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-amber-500/20">
            K
          </div>
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              <span>{language === 'ar' ? settings.storeNameAr : settings.storeNameEn}</span>
              <span className="text-xs bg-amber-500/20 text-amber-400 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                {language === 'ar' ? 'شاشة العميل' : 'Customer Display'}
              </span>
            </h1>
            <p className="text-xs text-slate-400">{settings.tagline || 'نظام كاشير ومبيعات متكامل'}</p>
          </div>
        </div>

        {/* Customer greeting or info and cashier connection button */}
        <div className="flex items-center gap-2.5">
          {activeCustomerName ? (
            <div className="flex items-center gap-3 bg-slate-800/90 border border-slate-700 py-2 px-4 rounded-2xl">
              <Award className="w-6 h-6 text-amber-400" />
              <div>
                <p className="text-xs text-slate-400">{language === 'ar' ? 'أهلاً بك يا' : 'Welcome'}</p>
                <p className="text-sm font-black text-white">{activeCustomerName}</p>
              </div>
              {selectedCustomer && (
                <div className="ms-2 ps-3 border-s border-slate-700 text-end">
                  <span className="text-[10px] text-amber-400 block">{language === 'ar' ? 'رصيد النقاط' : 'Points'}</span>
                  <span className="text-sm font-black text-amber-400">{selectedCustomer.points.toLocaleString()}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2 text-slate-400 text-xs font-semibold">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{language === 'ar' ? 'شكراً لزيارتكم ونسعد بخدمتكم دائماً' : 'Thank you for shopping with us!'}</span>
            </div>
          )}

          <button
            onClick={() => setIsConnectToCashierModalOpen(true)}
            className="py-2 px-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 border border-slate-700 flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
            title="إدخال كود الكاشير لربط هذه الشاشة بالكاشير الرئيسي"
          >
            <KeyRound className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">{language === 'ar' ? 'ربط بكود الكاشير' : 'Connect to Cashier'}</span>
          </button>
        </div>
      </div>

      {/* Body Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Column: Cart Items List */}
        <div className="flex-1 flex flex-col p-6 border-b lg:border-b-0 lg:border-e border-slate-800 overflow-hidden">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-black text-white">
                {language === 'ar' ? 'قائمة مشترياتك الحالية' : 'Current Order Items'} ({effectiveCart.length})
              </h2>
            </div>
            {pointsEarned > 0 && (
              <span className="text-xs bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 font-bold px-2.5 py-1 rounded-xl flex items-center gap-1.5">
                <Gift className="w-3.5 h-3.5" />
                <span>+{pointsEarned} {language === 'ar' ? 'نقطة ولاء تضاف لحسابك' : 'Loyalty Points Earned'}</span>
              </span>
            )}
          </div>

          {/* Items or Empty Banner */}
          {effectiveCart.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              {/* Promotional Slide Banner */}
              <div className={`w-full max-w-lg p-6 rounded-3xl bg-gradient-to-br ${promoOffers[promoSlide].color} text-white shadow-2xl animate-in fade-in`}>
                <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-xs mb-3 inline-block">
                  {promoOffers[promoSlide].badge}
                </span>
                <h3 className="text-xl font-black mb-2">
                  {language === 'ar' ? promoOffers[promoSlide].titleAr : promoOffers[promoSlide].titleEn}
                </h3>
                <p className="text-xs text-white/90 leading-relaxed">
                  {language === 'ar' ? promoOffers[promoSlide].descAr : promoOffers[promoSlide].descEn}
                </p>
              </div>

              <div className="flex items-center gap-1.5 mt-4">
                {promoOffers.map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 rounded-full transition-all ${i === promoSlide ? 'w-6 bg-amber-400' : 'w-2 bg-slate-800'}`}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/80 pe-2">
              {effectiveCart.map((item, idx) => (
                <div key={`${item.productId}-${idx}`} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 font-black text-sm flex items-center justify-center shrink-0">
                      {item.quantity}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">
                        {language === 'ar' ? item.product.nameAr : item.product.nameEn}
                      </p>
                      <span className="text-xs text-slate-400">
                        {formatCurrency(item.unitPrice)} للقطعة
                      </span>
                    </div>
                  </div>

                  <div className="text-end">
                    <p className="text-base font-black text-amber-400">
                      {formatCurrency(item.total)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Checkout Totals & QR Code */}
        <div className="w-full lg:w-96 bg-slate-900/60 p-6 flex flex-col justify-between shrink-0">
          {/* Summary Box */}
          <div className="space-y-3 bg-slate-800/80 p-5 rounded-2xl border border-slate-700/80">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {language === 'ar' ? 'ملخص الحساب الإجمالي' : 'Payment Summary'}
            </h3>

            <div className="flex justify-between text-xs text-slate-300">
              <span>{language === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}</span>
              <span className="font-bold">{formatCurrency(subtotal)}</span>
            </div>

            {discountVal > 0 && (
              <div className="flex justify-between text-xs text-emerald-400">
                <span>{language === 'ar' ? 'الخصم المطبق' : 'Discount'}</span>
                <span className="font-bold">-{formatCurrency(discountVal)}</span>
              </div>
            )}

            <div className="pt-3 border-t border-slate-700 flex justify-between items-baseline">
              <span className="text-sm font-black text-white">
                {language === 'ar' ? 'المبلغ المطلوب للدفع' : 'Total Amount'}
              </span>
              <span className="text-2xl font-black text-amber-400">
                {formatCurrency(total)}
              </span>
            </div>
          </div>

          {/* Instant QR Code Payment */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col items-center text-center mt-4">
            <div className="p-2 bg-white rounded-xl shadow-md mb-2">
              {paymentQr ? (
                <img src={paymentQr} alt="Payment QR" className="w-32 h-32 object-contain rounded-lg" />
              ) : (
                <div className="w-32 h-32 flex items-center justify-center text-slate-400">
                  <QrCode className="w-8 h-8 animate-pulse" />
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
              <Smartphone className="w-4 h-4" />
              <span>{language === 'ar' ? 'امسح للدفع الإلكتروني الفوري' : 'Scan to Pay with Mobile QR'}</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              سيريتل كاش / MTN كاش / المحافظ الرقمية
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
