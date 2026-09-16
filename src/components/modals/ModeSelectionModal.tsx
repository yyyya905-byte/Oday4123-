import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BusinessMode } from '../../types';
import {
  UtensilsCrossed,
  Building2,
  Store,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Users,
  Receipt,
  Layers,
  ShoppingBag,
  Flame,
  Boxes,
  Zap,
  Coffee,
  X,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface ModeSelectionModalProps {
  isOpen: boolean;
  onClose?: () => void;
  canDismiss?: boolean;
}

export const ModeSelectionModal: React.FC<ModeSelectionModalProps> = ({
  isOpen,
  onClose,
  canDismiss = true,
}) => {
  const {
    t,
    language,
    businessMode,
    setBusinessMode,
    setActiveTab,
    notify
  } = useApp();

  const [selectedMode, setSelectedMode] = useState<BusinessMode>(businessMode || 'retail');
  const [rememberChoice, setRememberChoice] = useState<boolean>(false);

  if (!isOpen) return null;

  const isRtl = language === 'ar';

  const modesConfig = [
    {
      id: 'restaurant' as BusinessMode,
      title: language === 'ar' ? 'كاشير المطاعم والكافيهات' : 'Restaurant & Cafe POS',
      badge: language === 'ar' ? 'صالة • مطبخ • سفري' : 'Dine-In • Kitchen • Takeaway',
      description:
        language === 'ar'
          ? 'مخصص للمطاعم، المقاهي، محلات الوجبات والحلويات. يشمل إدارة الطاولات، تذاكر المطبخ KOT، طلبات السفري والتوصيل، وملاحظات التحضير.'
          : 'Tailored for restaurants, cafes, fast food & diners. Includes dining tables, kitchen KOT tickets, takeaway/delivery, and chef notes.',
      icon: UtensilsCrossed,
      color: 'from-emerald-500 to-teal-600',
      accentBg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60',
      activeBorder: 'ring-2 ring-emerald-500 border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/50',
      badgeColor: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300',
      features: [
        language === 'ar' ? 'إدارة طاولات الصالة وطلبات السفري والتوصيل' : 'Dine-in table orders, takeaway & delivery',
        language === 'ar' ? 'إرسال بون المطبخ (KOT) وتخصيص ملاحظات الشيف' : 'Kitchen KOT printing & custom chef instructions',
        language === 'ar' ? 'قوائم سريعة للمشروبات، الوجبات، والمقبلات' : 'Fast-touch categories for food, drinks & sweets',
      ],
      popularTag: language === 'ar' ? 'الأكثر طلباً للمطاعم' : 'Best for Hospitality'
    },
    {
      id: 'wholesale' as BusinessMode,
      title: language === 'ar' ? 'كاشير وتجارة الجملة والتوزيع' : 'Wholesale & Distribution POS',
      badge: language === 'ar' ? 'كراتين • طرود • ذمم وتجار' : 'Cartons • Multipliers • Commercial Accounts',
      description:
        language === 'ar'
          ? 'مخصص لمستودعات الجملة، الموزعين، والشركات. يدعم البيع بالكرتونة والطرود، أسعار الجملة التلقائية، وسجلات ذمم وديون التجار.'
          : 'Engineered for wholesale warehouses, distributors & bulk trade. Supports cartons/pack multipliers, dealer pricing, and credit limits.',
      icon: Building2,
      color: 'from-amber-500 to-orange-600',
      accentBg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60',
      activeBorder: 'ring-2 ring-amber-500 border-amber-500 bg-amber-50/60 dark:bg-amber-950/50',
      badgeColor: 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300',
      features: [
        language === 'ar' ? 'تطبيق أسعار الجملة ومعاملات العبوات تلقائياً' : 'Automated wholesale unit rates & pack multipliers',
        language === 'ar' ? 'سجلات تجار الجملة، السجلات التجارية وسقوف الدين' : 'Commercial customer records, CR & debt limits',
        language === 'ar' ? 'فواتير جملة WHS مع كشف الحساب وسندات القبض' : 'Wholesale invoices with balance & debt receipts',
      ],
      popularTag: language === 'ar' ? 'الأقوى للمستودعات' : 'Best for Wholesale'
    },
    {
      id: 'retail' as BusinessMode,
      title: language === 'ar' ? 'كاشير المفرق والتجزئة' : 'Retail & Supermarket POS',
      badge: language === 'ar' ? 'باركود سريع • نقاط ولاء • كاش' : 'Rapid Barcode • Loyalty • Quick Checkout',
      description:
        language === 'ar'
          ? 'مخصص للسوبرماركت، المتاجر، محلات الملابس والإلكترونيات. تركيز كامل على مسح الباركود الفوري، بطاقات الزبائن، ونقاط الولاء.'
          : 'Built for supermarkets, retail shops, boutiques & groceries. Focused on blazing fast barcode scanning, loyalty points, and cash registers.',
      icon: Store,
      color: 'from-blue-500 to-indigo-600',
      accentBg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60',
      activeBorder: 'ring-2 ring-blue-500 border-blue-500 bg-blue-50/60 dark:bg-blue-950/50',
      badgeColor: 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300',
      features: [
        language === 'ar' ? 'مسح سريع بالباركود وقارئ البطاقات' : 'Instant barcode scanner & quick POS grid',
        language === 'ar' ? 'نظام بطاقات الرواد ونقاط الولاء والاستبدال' : 'Loyalty points earn/redeem & customer cards',
        language === 'ar' ? 'فواتير نقدية وإلكترونية سريعة بطباعة 80mm' : 'Fast thermal receipt printing & split payments',
      ],
      popularTag: language === 'ar' ? 'الافتراضي للمتاجر' : 'Standard Retail'
    },
  ];

  const handleConfirmMode = (mode: BusinessMode) => {
    setBusinessMode(mode, rememberChoice);
    setActiveTab('pos');
    
    const modeNames = {
      restaurant: language === 'ar' ? 'كاشير المطاعم والكافيهات' : 'Restaurant POS',
      wholesale: language === 'ar' ? 'كاشير وتجارة الجملة' : 'Wholesale POS',
      retail: language === 'ar' ? 'كاشير المفرق والتجزئة' : 'Retail POS',
    };

    notify(
      language === 'ar' ? 'تم ضبط وضع الكاشير بنجاح' : 'Operating Mode Activated',
      modeNames[mode],
      'success'
    );

    if (onClose) onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
      id="mode-selection-modal-overlay"
    >
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col my-auto transition-all"
        id="mode-selection-modal-content"
      >
        {/* Header Bar */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-amber-500/20">
              K
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black tracking-tight">
                  {language === 'ar' ? 'اختر نظام ونمط الكاشير للعمل' : 'Choose Operating POS System'}
                </h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {language === 'ar' ? 'KIAN CASHIER' : 'v2.5 PRO'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {language === 'ar'
                  ? 'اختر بين نمط المطاعم، الجملة والتوزيع، أو المفرق والتجزئة لتكييف الواجهة فوراً'
                  : 'Select Restaurant, Wholesale, or Retail mode to customize your sales experience'}
              </p>
            </div>
          </div>

          {canDismiss && onClose && (
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
              title={language === 'ar' ? 'إغلاق' : 'Close'}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* 3 Main Mode Selection Cards */}
        <div className="p-6 sm:p-8 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {modesConfig.map((mode) => {
              const Icon = mode.icon;
              const isCurrent = selectedMode === mode.id;

              return (
                <div
                  key={mode.id}
                  id={`mode-card-${mode.id}`}
                  onClick={() => setSelectedMode(mode.id)}
                  className={`relative rounded-2xl border p-5 transition-all duration-200 cursor-pointer flex flex-col justify-between group ${
                    isCurrent
                      ? `${mode.activeBorder} shadow-lg`
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md'
                  }`}
                >
                  {/* Top Badge */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${mode.badgeColor}`}>
                      {mode.badge}
                    </span>
                    {isCurrent && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                        <CheckCircle2 className="w-4 h-4 fill-amber-500 text-white dark:text-slate-900" />
                        <span>{language === 'ar' ? 'محدد' : 'Selected'}</span>
                      </span>
                    )}
                  </div>

                  {/* Icon & Title */}
                  <div className="mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${mode.color} flex items-center justify-center text-white shadow-md mb-3 group-hover:scale-105 transition-transform`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      {mode.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed line-clamp-3">
                      {mode.description}
                    </p>
                  </div>

                  {/* Feature Highlights */}
                  <div className="space-y-2 mb-5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                    {mode.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>

                  {/* Action Button */}
                  <button
                    id={`btn-select-mode-${mode.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleConfirmMode(mode.id);
                    }}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs ${
                      isCurrent
                        ? `bg-gradient-to-r ${mode.color} text-white shadow-md hover:opacity-95 active:scale-98`
                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <span>{language === 'ar' ? `دخول ${mode.title}` : `Launch ${mode.title}`}</span>
                    {isRtl ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-600 dark:text-slate-400 select-none">
            <input
              type="checkbox"
              id="checkbox-remember-mode"
              checked={rememberChoice}
              onChange={(e) => setRememberChoice(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-amber-500 focus:ring-amber-500 focus:ring-offset-0 bg-white dark:bg-slate-800 cursor-pointer"
            />
            <span>{t('rememberMode')}</span>
          </label>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {canDismiss && onClose && (
              <button
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                {t('cancel')}
              </button>
            )}
            <button
              id="btn-confirm-selected-mode"
              onClick={() => handleConfirmMode(selectedMode)}
              className="flex-1 sm:flex-none px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-extrabold rounded-xl shadow-md shadow-amber-500/20 active:scale-98 flex items-center justify-center gap-2 transition-all"
            >
              <span>{language === 'ar' ? 'تأكيد ودخول النظام' : 'Confirm & Launch System'}</span>
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
