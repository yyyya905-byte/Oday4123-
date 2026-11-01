import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ReceiptText,
  UtensilsCrossed,
  Network,
  BarChart3,
  X,
  Play,
  Check,
  Zap,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  ExternalLink
} from 'lucide-react';
import posShowcaseImg from '../../assets/images/kian_pos_showcase_1793548499948.jpg';
import kitchenKdsImg from '../../assets/images/kian_kitchen_kds_1793548514596.jpg';
import meshSyncImg from '../../assets/images/kian_mesh_sync_1793548536086.jpg';
import analyticsHubImg from '../../assets/images/kian_analytics_hub_1793548550310.jpg';
import { soundEffects } from '../../services/audio';

export interface WelcomeFeaturesLoadingModalProps {
  isOpen: boolean;
  onClose: () => void;
  isInitialFirstVisit?: boolean;
}

interface AppFeatureSlide {
  id: string;
  badgeAr: string;
  badgeColor: string;
  titleAr: string;
  descriptionAr: string;
  image: string;
  icon: React.ElementType;
  highlightsAr: string[];
}

const APP_FEATURES: AppFeatureSlide[] = [
  {
    id: 'pos_cashier',
    badgeAr: 'نقطة بيع ذكية وسريعة',
    badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    titleAr: 'إصدار فواتير فائقة السرعة تعمل دون إنترنت',
    descriptionAr:
      'نظام بيع متطور يدعم مسح الباركود، شاشات اللمس السريع، الفواتير الحرارية، تعدد العملات وأسعار الصرف، مع حفظ فوري ومحلي في جهازك يضمن استمرار العمل دون توقف.',
    image: posShowcaseImg,
    icon: ReceiptText,
    highlightsAr: [
      'بيع فوري بالباركود وشاشات اللمس',
      'فواتير حرارية مع رمز الاستجابة QR',
      'دعم كامل للعمل دون اتصال بالإنترنت',
      'حساب تلقائي للضرائب والخصومات'
    ]
  },
  {
    id: 'kitchen_dining',
    badgeAr: 'إدارة المطاعم وشاشات المطبخ',
    badgeColor: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    titleAr: 'شاشات شيف لاسلكية ومنيو إلكتروني QR للطاولات',
    descriptionAr:
      'اربط صالة المطعم مباشرة بالمطبخ؛ ترسل الطلبات آلياً لشاشة الشيف (KDS) مع تتبع فوري لمراحل الطهي والتقديم، مع إمكانية مسح منيو QR الذكي للطلب من الطاولة.',
    image: kitchenKdsImg,
    icon: UtensilsCrossed,
    highlightsAr: [
      'شاشة مطبخ ذكية لتنظيم طلبات الشيف',
      'منيو إلكتروني QR لطلبات الزبائن من الطاولة',
      'تتبع مباشر لحالة التحضير والجاهزية',
      'تنبيهات صوتية وبصرية فورية للمطبخ والصالة'
    ]
  },
  {
    id: 'mesh_devices',
    badgeAr: 'شبكة الأجهزة المتزامنة',
    badgeColor: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    titleAr: 'ربط فوري بين الكاشير الرئيسي والأجهزة الفرعية',
    descriptionAr:
      'اربط شاشات المطبخ، كاشيرات الفروع، هواتف النوادل، وقارئات الباركود بجهازك الرئيسي عبر رمز PIN السريع وبدون سيرفرات خارجية، مع تحكم فوري بصلاحيات كل شاشة.',
    image: meshSyncImg,
    icon: Network,
    highlightsAr: [
      'ربط لاسلكي سريع برمز PIN بضغطة واحدة',
      'تزامن لحظي للمبيعات والطلبات والمخزون',
      'تخصيص الصلاحيات والصفحات لكل جهاز',
      'مؤشرات حية للأجهزة المتصلة وتنبيه عند الانقطاع'
    ]
  },
  {
    id: 'analytics_inventory',
    badgeAr: 'التقارير المالية والديون',
    badgeColor: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    titleAr: 'لوحات بيانية للأرباح، مراقبة المخزون، وسندات الديون',
    descriptionAr:
      'تحليلات بيانية دقيقة لحركة المبيعات وصافي الأرباح، تنبيهات ذكية عند اقتراب نفاد المخزون، إدارة شاملة لديون العملاء، مع نسخ احتياطي سحابي إلى Google Drive.',
    image: analyticsHubImg,
    icon: BarChart3,
    highlightsAr: [
      'تقارير أرباح يومية وشهرية ورسوم بيانية',
      'جرد فوري للمخزون مع تنبيهات النواقص',
      'سجل شامل لديون وأقساط العملاء',
      'نسخ احتياطي سحابي مجدول إلى Google Drive'
    ]
  }
];

export const WelcomeFeaturesLoadingModal: React.FC<WelcomeFeaturesLoadingModalProps> = ({
  isOpen,
  onClose,
  isInitialFirstVisit = false
}) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStepLabel, setLoadingStepLabel] = useState('تهيئة بيئة العمل المحلية...');
  const [isBootstrapped, setIsBootstrapped] = useState(!isInitialFirstVisit);
  const [dontShowAgain, setDontShowAgain] = useState(true);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initial loading simulation for the first launch
  useEffect(() => {
    if (!isOpen) return;

    if (isInitialFirstVisit && !isBootstrapped) {
      setLoadingProgress(10);
      setLoadingStepLabel('تهيئة محرك التخزين المحلي الآمن (IndexedDB)...');

      const t1 = setTimeout(() => {
        setLoadingProgress(45);
        setLoadingStepLabel('فحص بصمة أمان الجهاز والاتصال الشبكي...');
      }, 700);

      const t2 = setTimeout(() => {
        setLoadingProgress(80);
        setLoadingStepLabel('تجهيز واجهات البيع السريع وشاشات المطاعم...');
      }, 1500);

      const t3 = setTimeout(() => {
        setLoadingProgress(100);
        setLoadingStepLabel('جاهز للانطلاق بنجاح! مرحباً بك في كاشير كيان');
        setIsBootstrapped(true);
        soundEffects.playSuccess();
      }, 2300);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    } else {
      setLoadingProgress(100);
      setIsBootstrapped(true);
    }
  }, [isOpen, isInitialFirstVisit, isBootstrapped]);

  // Auto progression across slides if user hasn't interacted
  useEffect(() => {
    if (!isOpen) return;

    autoPlayTimerRef.current = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % APP_FEATURES.length);
    }, 6500);

    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    };
  }, [isOpen, activeSlide]);

  if (!isOpen) return null;

  const currentFeature = APP_FEATURES[activeSlide];
  const CurrentIcon = currentFeature.icon;

  const handleNext = () => {
    soundEffects.playGlassTap();
    setActiveSlide(prev => (prev + 1) % APP_FEATURES.length);
  };

  const handlePrev = () => {
    soundEffects.playGlassTap();
    setActiveSlide(prev => (prev - 1 + APP_FEATURES.length) % APP_FEATURES.length);
  };

  const handleFinish = () => {
    soundEffects.playSuccess();
    if (dontShowAgain) {
      try {
        localStorage.setItem('kian_welcome_tour_seen_v1', 'true');
      } catch {}
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-xl animate-fade-in overflow-y-auto select-none"
      dir="rtl"
    >
      {/* Outer Glow Highlights */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Showcase Container */}
      <div className="relative w-full max-w-4xl my-auto bg-slate-900/95 border border-slate-700/60 rounded-3xl shadow-2xl shadow-emerald-950/40 overflow-hidden flex flex-col text-slate-100 transition-all duration-300">
        
        {/* Top Header Bar: Animated Kian Logo & Close Action */}
        <div className="flex items-center justify-between px-5 sm:px-7 py-4 border-b border-slate-800/80 bg-slate-950/40">
          
          {/* Logo & Brand Identity with Gentle Floating Animation */}
          <div className="flex items-center gap-3.5">
            <div className="relative group">
              {/* Outer soft rotating aura */}
              <div className="absolute -inset-1.5 bg-gradient-to-tr from-emerald-500 to-cyan-400 rounded-2xl opacity-60 blur-xs group-hover:opacity-90 transition-opacity animate-pulse" />
              
              {/* Animated Floating Logo Box */}
              <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-600 to-slate-900 border border-emerald-400/40 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-emerald-500/20 transform transition-transform duration-700 hover:scale-105 animate-float-kian">
                <span>ك</span>
              </div>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-black tracking-tight text-white">
                  نظام كاشير كيان الذكي
                </span>
                <span className="px-2 py-0.5 text-[10px] font-black rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  الإصدار الحديث 2026
                </span>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                نقطة بيع سريعة · شاشات مطاعم · شبكة أجهزة متزامنة دون إنترنت
              </span>
            </div>
          </div>

          {/* Close / Skip button */}
          <button
            type="button"
            onClick={handleFinish}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer btn-tactile"
            title="إغلاق والبدء"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Initial Loading Progress Bar (Interactive feedback during boot) */}
        {loadingProgress < 100 && (
          <div className="px-5 sm:px-7 py-3 bg-emerald-950/30 border-b border-emerald-800/30 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-300">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                {loadingStepLabel}
              </span>
              <span>{loadingProgress}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 transition-all duration-500 ease-out rounded-full"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Main Content Area: Slide Visual & Description */}
        <div className="p-5 sm:p-7 flex flex-col gap-6">
          
          {/* Feature Showcase Grid: Image + Details */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            
            {/* Visual Media Showcase with Glow Frame */}
            <div className="lg:col-span-7 relative group rounded-2xl overflow-hidden border border-slate-700/60 bg-slate-950 shadow-inner">
              <div className="aspect-video w-full overflow-hidden relative">
                <img
                  src={currentFeature.image}
                  alt={currentFeature.titleAr}
                  className="w-full h-full object-cover object-center transform group-hover:scale-102 transition-transform duration-700"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />

                {/* Overlaid quick badge */}
                <div className="absolute top-3 right-3 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-700/80 text-xs font-bold text-emerald-300 shadow-md">
                  <CurrentIcon className="w-4 h-4 text-emerald-400" />
                  <span>{currentFeature.badgeAr}</span>
                </div>
              </div>
            </div>

            {/* Feature Information & Highlights */}
            <div className="lg:col-span-5 flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs font-bold w-fit border-slate-700/80 bg-slate-800/60 text-slate-300">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>الميزة {activeSlide + 1} من {APP_FEATURES.length}</span>
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-white leading-snug">
                  {currentFeature.titleAr}
                </h3>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                  {currentFeature.descriptionAr}
                </p>
              </div>

              {/* Bullet Highlights */}
              <div className="space-y-2 pt-1 border-t border-slate-800">
                {currentFeature.highlightsAr.map((hl, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs font-medium text-slate-200">
                    <div className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/30">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span>{hl}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Segment Indicator Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
            {APP_FEATURES.map((feat, idx) => {
              const Icon = feat.icon;
              const isActive = idx === activeSlide;
              return (
                <button
                  key={feat.id}
                  type="button"
                  onClick={() => {
                    soundEffects.playGlassTap();
                    setActiveSlide(idx);
                  }}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-bold transition-all text-start cursor-pointer btn-tactile ${
                    isActive
                      ? 'bg-slate-800 border-emerald-500/60 text-emerald-300 shadow-md ring-1 ring-emerald-500/30'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="truncate">{feat.badgeAr}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Footer Bar: Slide Controls & Start Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 sm:px-7 py-4 border-t border-slate-800/80 bg-slate-950/60">
          
          {/* Do not show again checkbox */}
          <label className="flex items-center gap-2.5 text-xs text-slate-400 hover:text-slate-200 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={e => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-400/40 cursor-pointer"
            />
            <span>عدم إظهار هذه الجولة الترحيبية تلقائياً مرة أخرى</span>
          </label>

          {/* Navigation Controls */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handlePrev}
              className="px-3.5 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer btn-tactile"
            >
              <ChevronRight className="w-4 h-4" />
              <span>السابق</span>
            </button>

            {activeSlide < APP_FEATURES.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer btn-tactile"
              >
                <span>الميزة التالية</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            ) : null}

            <button
              type="button"
              onClick={handleFinish}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/25 flex items-center gap-2 transition-all cursor-pointer btn-tactile active:scale-95"
            >
              <span>ابدأ استخدام كاشير كيان الآن</span>
              <Play className="w-3.5 h-3.5 fill-current" />
            </button>
          </div>
        </div>
      </div>

      {/* Global CSS Animation for gentle float on Kian Logo */}
      <style>{`
        @keyframes float-kian {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-5px) rotate(-1deg);
          }
        }
        .animate-float-kian {
          animation: float-kian 3.2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};
