import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle2,
  Sliders,
  Layers,
  Search,
  ShoppingBag,
  Receipt,
  CreditCard,
  Crown,
  HelpCircle,
  Compass,
  ArrowRight,
  RotateCcw,
  DollarSign,
  TrendingUp,
  BellRing,
  Package,
  Boxes,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { soundEffects } from '../../services/audio';

export interface TutorialStep {
  id: string;
  targetSelector: string;
  titleAr: string;
  descriptionAr: string;
  icon: React.ElementType;
  badgeAr: string;
  preferredPlacement?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  targetView?: 'pos' | 'inventory';
  onEnter?: () => void;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'operating-mode',
    targetSelector: '[data-tour="operating-mode"]',
    targetView: 'pos',
    titleAr: 'أوضاع التشغيل المتخصصة (مطاعم / جملة / تجزئة)',
    descriptionAr:
      'اختر وضع العمل الملائم لنشاطك التجاري بنقرة واحدة. يوفر وضع المطاعم إدارة الطاولات والمنيو الرقمي والمطبخ، ووضع الجملة يدعم الكراتين والطرود والأسعار المتعددة، ووضع التجزئة مخصص للبيع السريع والباركود.',
    icon: Layers,
    badgeAr: 'بيئة العمل المخصصة',
    preferredPlacement: 'bottom',
  },
  {
    id: 'pos-search',
    targetSelector: '[data-tour="pos-search"]',
    targetView: 'pos',
    titleAr: 'البحث الذكي، قارئ الباركود، وتصفية الأقسام',
    descriptionAr:
      'ابحث بالاسم أو الكود، أو امسح الباركود مباشرة بكاميرا الجهاز أو القارئ الليزري. يمكنك تصفية المنتجات عبر شريط التصنيفات السريع لعرض الأصناف المطلوبة فوراً.',
    icon: Search,
    badgeAr: 'البحث والتصنيف',
    preferredPlacement: 'bottom',
  },
  {
    id: 'pos-products',
    targetSelector: '[data-tour="pos-products"]',
    targetView: 'pos',
    titleAr: 'كتالوج المنتجات والإضافة السريعة بنقرة واحدة',
    descriptionAr:
      'انقر على أي منتج لإضافته فورياً إلى الفاتورة الحالية مع مؤثرات استجابة سريعة. يظهر رصيد المخزون المتبقي وسعر البيع بشكل مباشر وواضح.',
    icon: ShoppingBag,
    badgeAr: 'المنتجات والمخزون',
    preferredPlacement: 'right',
  },
  {
    id: 'pos-cart',
    targetSelector: '[data-tour="pos-cart"]',
    targetView: 'pos',
    titleAr: 'سلة الفاتورة الحالية والتحكم بالكميات والخصومات',
    descriptionAr:
      'راجع أصناف الزبون، عدل الكميات عبر لوحة الأرقام أو أزرار الزيادة والنقصان، طبق خصماً مالياً أو مئوياً، أو علق الفاتورة لاستئنافها في أي وقت لاحق.',
    icon: Receipt,
    badgeAr: 'سلة المبيعات',
    preferredPlacement: 'left',
  },
  {
    id: 'pos-actions',
    targetSelector: '[data-tour="pos-actions"]',
    targetView: 'pos',
    titleAr: 'أزرار المحاسبة والدفع الفوري وطباعة الفاتورة',
    descriptionAr:
      'أتمم عملية البيع بضغطة زر واحدة عبر الدفع النقدي مع احتساب الباقي تلقائياً، الدفع بالبطاقة، تسجيل ذمة العميل، أو إصدار الفاتورة وطباعتها حرارياً.',
    icon: CreditCard,
    badgeAr: 'الدفع والإنهاء',
    preferredPlacement: 'top',
  },
  {
    id: 'customize-layout',
    targetSelector: '[data-tour="customize-layout"]',
    targetView: 'pos',
    titleAr: 'تخصيص وترتيب مواقع الأزرار حسب رغبة الكاشير',
    descriptionAr:
      'تستطيع تخصيص ترتيب مواقع أزرار الكاشير السريعة وشريط الأدوات العائمة وموقع السلة (يمين أو يسار) حسب راحة يدك لزيادة سرعة وسلاسة البيع اليومي.',
    icon: Sliders,
    badgeAr: 'تخصيص الأزرار',
    preferredPlacement: 'top',
  },
  {
    id: 'inventory-valuation',
    targetSelector: '[data-tour="inventory-valuation"]',
    targetView: 'inventory',
    titleAr: 'إجمالي تقييم المخزون والسيولة والقطع المتوفرة',
    descriptionAr:
      'لوحة فورية تعرض القيمة الإجمالية لبضاعة المستودع بسعر التكلفة وسعر البيع المتوقع، مع عدد القطع المتوفرة في المستودع ونسبة الأصناف السليمة والحرجة.',
    icon: DollarSign,
    badgeAr: 'تقييم المخزون',
    preferredPlacement: 'bottom',
  },
  {
    id: 'inventory-low-stock-tab',
    targetSelector: '[data-tour="inventory-low-stock-tab"]',
    targetView: 'inventory',
    titleAr: 'مركز الإنذار المبكر والتنبيه التلقائي للنواقص',
    descriptionAr:
      'نظام ذكي يرصد فورياً الأصناف التي بلغت حد الطلب الأدنى أو نفدت تماماً، ويتيح لك إصدار بوالص شراء وتوريد فوري من الشركات والموردين بنقرة زر واحدة.',
    icon: BellRing,
    badgeAr: 'تنبيهات النواقص',
    preferredPlacement: 'bottom',
    onEnter: () => {
      window.dispatchEvent(new CustomEvent('tutorial-switch-inventory-tab', { detail: { tab: 'low_stock_alerts' } }));
    },
  },
  {
    id: 'inventory-stock-table',
    targetSelector: '[data-tour="inventory-stock-table"]',
    targetView: 'inventory',
    titleAr: 'جدول مستويات المخزون والتعديل السريع (+ / -)',
    descriptionAr:
      'تتبع كميات كل صنف في المستودع بدقة عالية، مع إمكانية زيادة أو تنقيص المخزون فورياً عبر أزرار (+ / -) السريعة، وتصفية الأصناف الحرجة أو النافذة بنقرة واحدة.',
    icon: Package,
    badgeAr: 'إدارة وتعديل المخزون',
    preferredPlacement: 'top',
    onEnter: () => {
      window.dispatchEvent(new CustomEvent('tutorial-switch-inventory-tab', { detail: { tab: 'stock_levels' } }));
    },
  },
  {
    id: 'header-tools',
    targetSelector: '[data-tour="header-tools"]',
    targetView: 'pos',
    titleAr: 'الأدوات الذكية وإعادة تشغيل الجولة التعريفية',
    descriptionAr:
      'تابع أسعار العملات الدولية ومحول الصرف المباشر، رصيد نقاط مكافآت العملاء، النسخ الاحتياطي السحابي، ويمكنك إعادة تشغيل هذه الجولة التعريفية في أي وقت بالضغط على زر "الجولة التعريفية".',
    icon: Sparkles,
    badgeAr: 'أدوات المنشأة والجولة',
    preferredPlacement: 'bottom',
  },
];

export const TUTORIAL_STORAGE_KEY = 'kian_pos_tutorial_completed_v1';

export const InteractiveSpotlightTutorial: React.FC = () => {
  const { isTutorialOpen, setIsTutorialOpen, activeTab, setActiveTab } = useApp();

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  // Check if first-time user automatically
  useEffect(() => {
    try {
      const hasCompleted = localStorage.getItem(TUTORIAL_STORAGE_KEY);
      if (!hasCompleted) {
        // Automatically start the walkthrough for new users after layout stabilizes
        const timer = setTimeout(() => {
          setIsTutorialOpen(true);
          soundEffects.playBatchChime(1);
        }, 1200);
        return () => clearTimeout(timer);
      }
    } catch {}
  }, [setIsTutorialOpen]);

  const currentStep = TUTORIAL_STEPS[currentStepIndex];

  // Reset to step 0 and start view whenever tutorial is opened
  useEffect(() => {
    if (isTutorialOpen) {
      setCurrentStepIndex(0);
      const firstStep = TUTORIAL_STEPS[0];
      if (firstStep?.targetView && activeTab !== firstStep.targetView) {
        setActiveTab(firstStep.targetView);
      }
    }
  }, [isTutorialOpen]);

  // Synchronize target view and onEnter hook when step changes
  useEffect(() => {
    if (!isTutorialOpen || !currentStep) return;

    if (currentStep.targetView && activeTab !== currentStep.targetView) {
      setActiveTab(currentStep.targetView);
    }

    if (currentStep.onEnter) {
      currentStep.onEnter();
    }
  }, [currentStepIndex, isTutorialOpen, currentStep, activeTab, setActiveTab]);

  // Locate the DOM rect of current target element
  const updateTargetRect = useCallback(() => {
    if (!isTutorialOpen || !currentStep) {
      setTargetRect(null);
      return;
    }

    const el = document.querySelector(currentStep.targetSelector) as HTMLElement | null;
    if (el) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setTargetRect(rect);
        // Ensure target element is scrolled into view smoothly if needed
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        return;
      }
    }
    setTargetRect(null);
  }, [isTutorialOpen, currentStep]);

  useEffect(() => {
    if (!isTutorialOpen) return;

    updateTargetRect();
    const t1 = setTimeout(updateTargetRect, 80);
    const t2 = setTimeout(updateTargetRect, 220);
    const t3 = setTimeout(updateTargetRect, 500);

    const handleResize = () => updateTargetRect();
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);

    const checkInterval = setInterval(updateTargetRect, 600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
      clearInterval(checkInterval);
    };
  }, [updateTargetRect, currentStepIndex, isTutorialOpen, activeTab]);

  if (!isTutorialOpen) {
    return null;
  }

  const handleNext = () => {
    soundEffects.playClick();
    if (currentStepIndex < TUTORIAL_STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    soundEffects.playClick();
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    soundEffects.playSuccess();
    try {
      localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
    } catch {}
    setIsTutorialOpen(false);
    setCurrentStepIndex(0);
  };

  const handleSkip = () => {
    soundEffects.playClick();
    try {
      localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
    } catch {}
    setIsTutorialOpen(false);
    setCurrentStepIndex(0);
  };

  const IconComponent = currentStep.icon;
  const progressPercent = Math.round(((currentStepIndex + 1) / TUTORIAL_STEPS.length) * 100);

  // Position calculating for card
  const getCardStyle = (): React.CSSProperties => {
    if (!targetRect || typeof window === 'undefined') {
      // Centered fallback
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const cardWidth = Math.min(420, viewportW - 32);

    let top = 0;
    let left = 0;

    const placement = currentStep.preferredPlacement || 'bottom';

    if (placement === 'bottom' && targetRect.bottom + 260 < viewportH) {
      top = targetRect.bottom + 16;
      left = Math.max(16, Math.min(targetRect.left + (targetRect.width - cardWidth) / 2, viewportW - cardWidth - 16));
    } else if (placement === 'top' && targetRect.top - 260 > 10) {
      top = Math.max(16, targetRect.top - 260);
      left = Math.max(16, Math.min(targetRect.left + (targetRect.width - cardWidth) / 2, viewportW - cardWidth - 16));
    } else if (placement === 'left' && targetRect.left - cardWidth - 16 > 10) {
      top = Math.max(16, Math.min(targetRect.top, viewportH - 280));
      left = targetRect.left - cardWidth - 16;
    } else if (placement === 'right' && targetRect.right + cardWidth + 16 < viewportW) {
      top = Math.max(16, Math.min(targetRect.top, viewportH - 280));
      left = targetRect.right + 16;
    } else {
      // Fallback: place below or top depending on space
      if (targetRect.bottom + 240 < viewportH) {
        top = targetRect.bottom + 14;
      } else {
        top = Math.max(16, targetRect.top - 260);
      }
      left = Math.max(16, Math.min(viewportW / 2 - cardWidth / 2, viewportW - cardWidth - 16));
    }

    return {
      top: `${top}px`,
      left: `${left}px`,
      width: `${cardWidth}px`,
    };
  };

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-[99999] pointer-events-auto select-none transition-all duration-300"
    >
      {/* SVG Spotlight Mask Cutout Overlay */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none transition-all duration-300">
        <defs>
          <mask id="spotlight-mask">
            {/* White area = opaque backdrop */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {/* Black area = transparent cutout spotlight */}
            {targetRect && (
              <rect
                x={targetRect.left - 6}
                y={targetRect.top - 6}
                width={targetRect.width + 12}
                height={targetRect.height + 12}
                rx="18"
                ry="18"
                fill="black"
              />
            )}
          </mask>
        </defs>

        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(15, 23, 42, 0.75)"
          mask="url(#spotlight-mask)"
        />
      </svg>

      {/* Target Pulsing Beacon & Ring */}
      {targetRect && (
        <div
          style={{
            top: `${targetRect.top - 6}px`,
            left: `${targetRect.left - 6}px`,
            width: `${targetRect.width + 12}px`,
            height: `${targetRect.height + 12}px`,
          }}
          className="absolute rounded-2xl pointer-events-none ring-4 ring-amber-400 ring-offset-2 ring-offset-transparent shadow-2xl transition-all duration-300 animate-pulse"
        >
          <span className="absolute -top-3 -end-3 flex h-6 w-6">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-6 w-6 bg-amber-500 text-slate-950 font-black text-[11px] items-center justify-center shadow-md">
              {currentStepIndex + 1}
            </span>
          </span>
        </div>
      )}

      {/* Floating Tutorial Guide Card */}
      <div
        style={getCardStyle()}
        className="absolute z-10 glass-card-elevated p-5 sm:p-6 rounded-3xl shadow-2xl border-2 border-amber-500/60 dark:border-amber-400/50 text-slate-900 dark:text-white transform transition-all duration-300 animate-in fade-in zoom-in-95"
      >
        {/* Step Badge & Progress Header */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-500/20">
              <IconComponent className="w-5 h-5" />
            </div>
            <div>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                {currentStep.badgeAr}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold mr-2">
                خطوة {currentStepIndex + 1} من {TUTORIAL_STEPS.length}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSkip}
            className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-colors cursor-pointer"
            title="إغلاق وتخطي الجولة"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Card Content */}
        <div className="py-3.5 space-y-2">
          <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-snug">
            {currentStep.titleAr}
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            {currentStep.descriptionAr}
          </p>
        </div>

        {/* Progress Dots Bar */}
        <div className="flex items-center gap-1.5 py-1">
          {TUTORIAL_STEPS.map((step, idx) => (
            <button
              key={step.id}
              type="button"
              onClick={() => {
                soundEffects.playClick();
                setCurrentStepIndex(idx);
              }}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                idx === currentStepIndex
                  ? 'w-6 bg-amber-500'
                  : idx < currentStepIndex
                  ? 'w-2 bg-emerald-500'
                  : 'w-2 bg-slate-300 dark:bg-slate-700'
              }`}
              title={`الانتقال إلى خطوة ${idx + 1}`}
            />
          ))}
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2 mt-2">
          <div className="flex items-center gap-1.5">
            {currentStepIndex > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
              >
                <ChevronRight className="w-3.5 h-3.5" />
                <span>السابق</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSkip}
              className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-2 font-bold cursor-pointer"
            >
              تخطي الجولة
            </button>
          </div>

          <button
            type="button"
            onClick={handleNext}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 active:scale-95 text-slate-950 font-black text-xs rounded-xl shadow-md shadow-amber-500/25 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>{currentStepIndex === TUTORIAL_STEPS.length - 1 ? 'إنهاء الجولة ✅' : 'التالي'}</span>
            {currentStepIndex < TUTORIAL_STEPS.length - 1 && (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
