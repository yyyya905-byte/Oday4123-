import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Sliders,
  X,
  RotateCcw,
  Check,
  MoveHorizontal,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  LayoutGrid,
  Sparkles,
  Smartphone,
  Layers,
  Wrench,
  Search,
  PlusCircle,
  Bell,
  Sun,
  Languages,
  User,
  ScanBarcode,
  QrCode,
  Printer,
  Edit3,
  Star,
  Calculator,
  Compass,
  Zap,
  CheckCircle2,
  Maximize2,
  ReceiptText,
  Wallet,
  Package,
  BarChart3,
  Coins,
  Palette
} from 'lucide-react';
import { ButtonLayoutConfig, ButtonLayoutPreset, POSCartPosition, POSPayButtonAlignment, FloatingActionPosition } from '../../types';
import { DEFAULT_FLOATING_HUB_ORDER, DEFAULT_FLOATING_HUB_VISIBILITY } from '../common/FloatingActionHub';

interface CashierButtonMeta {
  id: string;
  nameAr: string;
  nameEn: string;
  icon: React.ElementType;
  desc: string;
}

const CASHIER_BUTTONS_CATALOG: Record<string, CashierButtonMeta> = {
  numpad: {
    id: 'numpad',
    nameAr: 'لوحة الأرقام اللمسية',
    nameEn: 'Touch Numpad',
    icon: Calculator,
    desc: 'لوحة آلة حاسبة سريعة لإدخال الكميات والأسعار باللمس'
  },
  barcode: {
    id: 'barcode',
    nameAr: 'قارئ الباركود',
    nameEn: 'Barcode Scanner',
    icon: ScanBarcode,
    desc: 'فتح نافذة كاميرا الباركود ومسح ملصقات الأصناف'
  },
  customerQr: {
    id: 'customerQr',
    nameAr: 'ماسح زبائن الولاء (QR)',
    nameEn: 'Customer QR',
    icon: QrCode,
    desc: 'مسح بطاقات الولاء الرقمية للزبائن واستبدال النقاط'
  },
  bluetoothPrinter: {
    id: 'bluetoothPrinter',
    nameAr: 'طابعة البلوتوث الحرارية',
    nameEn: 'Bluetooth Printer',
    icon: Printer,
    desc: 'إدارة وتوصيل طابعة الفواتير المحمولة وفحص الاتصال'
  },
  priceEdit: {
    id: 'priceEdit',
    nameAr: 'تعديل السعر السريع',
    nameEn: 'Quick Price Edit',
    icon: Edit3,
    desc: 'تعديل سعر البيع مباشرة للصنف المحدد أثناء المحاسبة'
  },
  favorites: {
    id: 'favorites',
    nameAr: 'تصفية المفضلة',
    nameEn: 'Favorites Filter',
    icon: Star,
    desc: 'إظهار المنتجات الأكثر طلباً والمميزة بنجمة فقط'
  },
  customizeButtons: {
    id: 'customizeButtons',
    nameAr: 'تخصيص الأزرار',
    nameEn: 'Customize Buttons',
    icon: Sliders,
    desc: 'فتح نافذة التحكم بمواقع وترتيب أزرار الواجهة'
  }
};

interface HeaderButtonMeta {
  id: string;
  nameAr: string;
  nameEn: string;
  icon: React.ElementType;
}

const HEADER_BUTTONS_CATALOG: Record<string, HeaderButtonMeta> = {
  operatingMode: {
    id: 'operatingMode',
    nameAr: 'وضع التشغيل (مطاعم/تجزئة/جملة)',
    nameEn: 'Operating Mode',
    icon: Layers
  },
  sectionsNav: {
    id: 'sectionsNav',
    nameAr: 'متصفح الأقسام (الأقسام)',
    nameEn: 'Sections Navigator',
    icon: LayoutGrid
  },
  search: {
    id: 'search',
    nameAr: 'حقل البحث الشامل (Ctrl+K)',
    nameEn: 'Global Search',
    icon: Search
  },
  toolsHub: {
    id: 'toolsHub',
    nameAr: 'قائمة الأدوات والميزات الذكية',
    nameEn: 'Tools Hub',
    icon: Wrench
  },
  quickNewSale: {
    id: 'quickNewSale',
    nameAr: 'زر فاتورة جديدة (كاشير)',
    nameEn: 'New Sale Button',
    icon: PlusCircle
  },
  networkStatus: {
    id: 'networkStatus',
    nameAr: 'مؤشر حالة الاتصال والأوفلاين',
    nameEn: 'Network & Sync Status',
    icon: Zap
  },
  battery: {
    id: 'battery',
    nameAr: 'مؤشر شحن البطارية وتوفير الطاقة',
    nameEn: 'Battery & Eco Indicator',
    icon: Zap
  },
  notifications: {
    id: 'notifications',
    nameAr: 'زر الإشعارات وسجل التحسينات',
    nameEn: 'Notifications & Updates',
    icon: Bell
  },
  themeToggle: {
    id: 'themeToggle',
    nameAr: 'مبدل الوضع الليلي / النهاري',
    nameEn: 'Dark / Light Theme',
    icon: Sun
  },
  langToggle: {
    id: 'langToggle',
    nameAr: 'مبدل لغة الواجهة (عربي/EN)',
    nameEn: 'Language Switcher',
    icon: Languages
  },
  staffProfile: {
    id: 'staffProfile',
    nameAr: 'بطاقة الموظف وتبديل الوردية',
    nameEn: 'Staff & Shift Profile',
    icon: User
  }
};

const FLOATING_BUTTONS_CATALOG: Record<string, HeaderButtonMeta> = {
  pos: { id: 'pos', nameAr: 'شاشة الكاشير (نقطة البيع)', nameEn: 'POS Register', icon: ReceiptText },
  debts: { id: 'debts', nameAr: 'الديون والشراء من الموردين', nameEn: 'Debts & Suppliers', icon: Wallet },
  products: { id: 'products', nameAr: 'المنتجات وتنبيهات النواقص', nameEn: 'Products & Alerts', icon: Package },
  inventory: { id: 'inventory', nameAr: 'إدارة المخزون والمستودع', nameEn: 'Inventory Hub', icon: Layers },
  reports: { id: 'reports', nameAr: 'لوحة التقارير والأرباح', nameEn: 'Analytics & Reports', icon: BarChart3 },
  shift: { id: 'shift', nameAr: 'صندوق النقد والوردية', nameEn: 'Cash Shift Drawer', icon: Coins },
  search: { id: 'search', nameAr: 'البحث الشامل السريع', nameEn: 'Global Search', icon: Search },
  themeToggle: { id: 'themeToggle', nameAr: 'الوضع الليلي / النهاري', nameEn: 'Dark / Light Mode', icon: Sun },
  themeColor: { id: 'themeColor', nameAr: 'ألوان المتجر والهوية', nameEn: 'Theme Color', icon: Palette },
  customizeButtons: { id: 'customizeButtons', nameAr: 'تخصيص مواقع الأزرار', nameEn: 'Customize Layout', icon: Sliders },
  about: { id: 'about', nameAr: 'سجل التحسينات والدليل', nameEn: "What's New", icon: Sparkles }
};

export const ButtonLayoutModal: React.FC = () => {
  const {
    settings,
    updateButtonLayout,
    resetButtonLayout,
    applyButtonLayoutPreset,
    isButtonCustomizerModalOpen,
    setIsButtonCustomizerModalOpen,
    businessMode,
    language
  } = useApp();

  const [activeTab, setActiveTab] = useState<'pos' | 'header' | 'floating' | 'presets'>('presets');

  if (!isButtonCustomizerModalOpen) return null;

  const layout: ButtonLayoutConfig = settings.buttonLayout || {
    posCartPosition: 'right',
    posActionButtonsOrder: [
      'numpad',
      'barcode',
      'customerQr',
      'bluetoothPrinter',
      'priceEdit',
      'favorites',
      'customizeButtons'
    ],
    posActionButtonsVisibility: {
      numpad: true,
      barcode: true,
      customerQr: true,
      bluetoothPrinter: true,
      priceEdit: true,
      favorites: true,
      customizeButtons: true
    },
    posPayButtonAlignment: 'split',
    headerButtonsOrder: [
      'operatingMode',
      'sectionsNav',
      'search',
      'toolsHub',
      'quickNewSale',
      'networkStatus',
      'battery',
      'notifications',
      'themeToggle',
      'langToggle',
      'staffProfile'
    ],
    headerButtonsVisibility: {
      operatingMode: true,
      sectionsNav: true,
      search: true,
      toolsHub: true,
      quickNewSale: true,
      networkStatus: true,
      battery: true,
      notifications: true,
      themeToggle: true,
      langToggle: true,
      staffProfile: true
    },
    floatingActionPosition: 'bottom-right',
    floatingActionEnabled: true,
    activePreset: 'standard'
  };

  // Move cashier action button up / down
  const moveCashierButton = (index: number, direction: 'up' | 'down') => {
    const list = [...layout.posActionButtonsOrder];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;
    updateButtonLayout({ posActionButtonsOrder: list });
  };

  // Toggle cashier button visibility
  const toggleCashierButtonVisibility = (btnId: string) => {
    const current = layout.posActionButtonsVisibility[btnId] !== false;
    updateButtonLayout({
      posActionButtonsVisibility: {
        ...layout.posActionButtonsVisibility,
        [btnId]: !current
      }
    });
  };

  // Move header button up / down
  const moveHeaderButton = (index: number, direction: 'up' | 'down') => {
    const list = [...layout.headerButtonsOrder];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;
    updateButtonLayout({ headerButtonsOrder: list });
  };

  // Toggle header button visibility
  const toggleHeaderButtonVisibility = (btnId: string) => {
    const current = layout.headerButtonsVisibility[btnId] !== false;
    updateButtonLayout({
      headerButtonsVisibility: {
        ...layout.headerButtonsVisibility,
        [btnId]: !current
      }
    });
  };

  const floatingOrder =
    layout.floatingActionButtonsOrder && layout.floatingActionButtonsOrder.length > 0
      ? [
          ...layout.floatingActionButtonsOrder.filter(id => DEFAULT_FLOATING_HUB_ORDER.includes(id)),
          ...DEFAULT_FLOATING_HUB_ORDER.filter(id => !layout.floatingActionButtonsOrder!.includes(id))
        ]
      : DEFAULT_FLOATING_HUB_ORDER;

  const floatingVisibility = {
    ...DEFAULT_FLOATING_HUB_VISIBILITY,
    ...(layout.floatingActionButtonsVisibility || {})
  };

  const moveFloatingButton = (index: number, direction: 'up' | 'down') => {
    const list = [...floatingOrder];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;
    updateButtonLayout({ floatingActionButtonsOrder: list });
  };

  const toggleFloatingButtonVisibility = (btnId: string) => {
    const current = floatingVisibility[btnId] !== false;
    updateButtonLayout({
      floatingActionButtonsVisibility: {
        ...floatingVisibility,
        [btnId]: !current
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-500/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {language === 'ar' ? 'تخصيص وترتيب مواقع الأزرار والواجهة' : 'Customize UI & Button Layout'}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300">
                  {language === 'ar' ? 'تحكم كامل' : 'Full Control'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'ar'
                  ? 'تحكم بمكان لوحة السلة، وترتيب أزرار الكاشير، والشريط العلوي، والزر العائم بحرية تامة'
                  : 'Rearrange cart side, cashier command bar, header controls, and floating tools'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsButtonCustomizerModalOpen(false)}
            className="p-2 rounded-2xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="px-4 pt-3 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'presets'
                ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'أوضاع جاهزة بضغطة زر' : 'Ready Presets'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pos')}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'pos'
                ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
            }`}
          >
            <MoveHorizontal className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'موضع السلة وأزرار الكاشير' : 'POS & Cart Placement'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('header')}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'header'
                ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'أزرار الشريط العلوي' : 'Header Buttons'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('floating')}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'floating'
                ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'الزر العائم الذكي' : 'Floating Action Hub'}</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6">
          {/* TAB 1: PRESETS */}
          {activeTab === 'presets' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  {language === 'ar' ? 'اختر الوضع الأنسب لطريقة عملك' : 'Choose Your Ideal Ergonomic Preset'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {language === 'ar'
                    ? 'يمكنك التبديل بين الأوضاع فورياً حسب بيئة العمل واستخدام اليد اليمنى أو اليسرى والشاشات اللمسية'
                    : 'Switch instantly based on your counter environment, touch setup, or hand preference'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* 1. Standard Preset */}
                <div
                  onClick={() => applyButtonLayoutPreset('standard')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer text-start relative ${
                    layout.activePreset === 'standard'
                      ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 shadow-md'
                      : 'border-slate-200 dark:border-slate-800 hover:border-amber-400/60 bg-white dark:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">🎯</span>
                    {layout.activePreset === 'standard' && (
                      <span className="flex items-center gap-1 text-[11px] font-black text-amber-600 dark:text-amber-400">
                        <Check className="w-3.5 h-3.5" /> نشط حالياً
                      </span>
                    )}
                  </div>
                  <h5 className="text-sm font-black text-slate-900 dark:text-white mt-2">
                    الوضع القياسي الذكي (Default RTL)
                  </h5>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    لوحة السلة والمحاسبة على اليمين مع أزرار الأدوات القياسية. مناسب للمستخدم الأيمن واللغة العربية القياسية.
                  </p>
                </div>

                {/* 2. Left-Handed Preset */}
                <div
                  onClick={() => applyButtonLayoutPreset('left_handed')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer text-start relative ${
                    layout.activePreset === 'left_handed'
                      ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 shadow-md'
                      : 'border-slate-200 dark:border-slate-800 hover:border-amber-400/60 bg-white dark:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">🖐️</span>
                    {layout.activePreset === 'left_handed' && (
                      <span className="flex items-center gap-1 text-[11px] font-black text-amber-600 dark:text-amber-400">
                        <Check className="w-3.5 h-3.5" /> نشط حالياً
                      </span>
                    )}
                  </div>
                  <h5 className="text-sm font-black text-slate-900 dark:text-white mt-2">
                    وضع اليد اليسرى (الأعسر / Left-Handed)
                  </h5>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    ينقل لوحة السلة والمحاسبة إلى يسار الشاشة مع عكس أزرار الكاشير والزر العائم لتسهيل الاستخدام باليد اليسرى.
                  </p>
                </div>

                {/* 3. Touchscreen Large Preset */}
                <div
                  onClick={() => applyButtonLayoutPreset('touchscreen')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer text-start relative ${
                    layout.activePreset === 'touchscreen'
                      ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 shadow-md'
                      : 'border-slate-200 dark:border-slate-800 hover:border-amber-400/60 bg-white dark:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">📱</span>
                    {layout.activePreset === 'touchscreen' && (
                      <span className="flex items-center gap-1 text-[11px] font-black text-amber-600 dark:text-amber-400">
                        <Check className="w-3.5 h-3.5" /> نشط حالياً
                      </span>
                    )}
                  </div>
                  <h5 className="text-sm font-black text-slate-900 dark:text-white mt-2">
                    وضع شاشات اللمس الكبيرة (POS Touch)
                  </h5>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    أزرار عريضة ومكبرة بالكامل، زر الدفع بعرض الشاشة، مع إبراز أدوات الباركود والآلة الحاسبة للضغط السريع.
                  </p>
                </div>

                {/* 4. Compact Speed Preset */}
                <div
                  onClick={() => applyButtonLayoutPreset('compact')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer text-start relative ${
                    layout.activePreset === 'compact'
                      ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 shadow-md'
                      : 'border-slate-200 dark:border-slate-800 hover:border-amber-400/60 bg-white dark:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">⚡</span>
                    {layout.activePreset === 'compact' && (
                      <span className="flex items-center gap-1 text-[11px] font-black text-amber-600 dark:text-amber-400">
                        <Check className="w-3.5 h-3.5" /> نشط حالياً
                      </span>
                    )}
                  </div>
                  <h5 className="text-sm font-black text-slate-900 dark:text-white mt-2">
                    الوضع المكثف فائق السرعة (Express Speed)
                  </h5>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    إخفاء كافة العناصر الثانوية والتركيز التام على إدخال الأصناف والمحاسبة الفورية لمنع أي تشويش.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: POS & CART PLACEMENT */}
          {activeTab === 'pos' && (
            <div className="space-y-6">
              {/* Section: Cart Position (Right vs Left) */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      {language === 'ar' ? 'موضع لوحة السلة والمحاسبة في شاشة الكاشير' : 'POS Register Cart Position'}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {language === 'ar'
                        ? 'اختر وضع السلة يمين أو يسار شاشة المنتجات'
                        : 'Choose whether the register cart is docked on the right or left'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => updateButtonLayout({ posCartPosition: 'right' })}
                    className={`p-3.5 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all cursor-pointer ${
                      layout.posCartPosition === 'right'
                        ? 'border-amber-500 bg-amber-500/10 text-amber-900 dark:text-amber-200 font-black shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <div className="w-24 h-12 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 flex p-1 gap-1 items-stretch">
                      <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-sm flex items-center justify-center text-[9px] text-slate-500">
                        المنتجات
                      </div>
                      <div className="w-8 bg-amber-500/80 rounded-sm flex items-center justify-center text-[9px] text-slate-950 font-bold">
                        السلة
                      </div>
                    </div>
                    <span className="text-xs font-bold">السلة على اليمين (الافتراضي)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateButtonLayout({ posCartPosition: 'left' })}
                    className={`p-3.5 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all cursor-pointer ${
                      layout.posCartPosition === 'left'
                        ? 'border-amber-500 bg-amber-500/10 text-amber-900 dark:text-amber-200 font-black shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <div className="w-24 h-12 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 flex p-1 gap-1 items-stretch">
                      <div className="w-8 bg-amber-500/80 rounded-sm flex items-center justify-center text-[9px] text-slate-950 font-bold">
                        السلة
                      </div>
                      <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-sm flex items-center justify-center text-[9px] text-slate-500">
                        المنتجات
                      </div>
                    </div>
                    <span className="text-xs font-bold">السلة على اليسار (وضع الأعسر)</span>
                  </button>
                </div>
              </div>

              {/* Section: Pay Button Alignment */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  تنسيق زر إنهاء الدفع والمحاسبة (Checkout Action Bar)
                </h4>
                <div className={`grid ${businessMode === 'restaurant' ? 'grid-cols-3' : 'grid-cols-2'} gap-2`}>
                  {businessMode === 'restaurant' && (
                    <button
                      type="button"
                      onClick={() => updateButtonLayout({ posPayButtonAlignment: 'split' })}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        layout.posPayButtonAlignment === 'split'
                          ? 'bg-amber-500 text-slate-950 font-black border-amber-600 shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      دفع + مطبخ متجاورين
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => updateButtonLayout({ posPayButtonAlignment: 'full' })}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      layout.posPayButtonAlignment === 'full'
                        ? 'bg-amber-500 text-slate-950 font-black border-amber-600 shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    زر دفع بعرض كامل
                  </button>
                  <button
                    type="button"
                    onClick={() => updateButtonLayout({ posPayButtonAlignment: 'reversed' })}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      layout.posPayButtonAlignment === 'reversed'
                        ? 'bg-amber-500 text-slate-950 font-black border-amber-600 shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    عكس الترتيب
                  </button>
                </div>
              </div>

              {/* Section: Cashier Action Tools Cluster Reorder & Visibility */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    ترتيب وظهور أزرار أدوات الكاشير (شريط الأدوات العلوي)
                  </h4>
                  <span className="text-[10px] text-slate-400">
                    استخدم الأسهم لإعادة الترتيب والعين للإخفاء/الإظهار
                  </span>
                </div>

                <div className="space-y-2">
                  {layout.posActionButtonsOrder.map((btnId, index) => {
                    const meta = CASHIER_BUTTONS_CATALOG[btnId];
                    if (!meta) return null;
                    const Icon = meta.icon;
                    const isVisible = layout.posActionButtonsVisibility[btnId] !== false;

                    return (
                      <div
                        key={btnId}
                        className={`p-2.5 sm:p-3 rounded-2xl border flex items-center justify-between gap-3 transition-colors ${
                          isVisible
                            ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                            : 'bg-slate-100/60 dark:bg-slate-800/40 border-dashed border-slate-300 dark:border-slate-700 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-mono font-bold text-slate-500 shrink-0">
                            {index + 1}
                          </span>
                          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                              {language === 'ar' ? meta.nameAr : meta.nameEn}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate hidden sm:block">
                              {meta.desc}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {/* Visibility Toggle */}
                          <button
                            type="button"
                            onClick={() => toggleCashierButtonVisibility(btnId)}
                            className={`p-1.5 rounded-xl border text-xs transition-colors cursor-pointer ${
                              isVisible
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800'
                                : 'bg-slate-200 text-slate-500 border-slate-300 dark:bg-slate-700 dark:border-slate-600'
                            }`}
                            title={isVisible ? 'إخفاء الزر' : 'إظهار الزر'}
                          >
                            {isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </button>

                          {/* Move Up */}
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => moveCashierButton(index, 'up')}
                            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                            title="تحريك لأعلى"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>

                          {/* Move Down */}
                          <button
                            type="button"
                            disabled={index === layout.posActionButtonsOrder.length - 1}
                            onClick={() => moveCashierButton(index, 'down')}
                            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                            title="تحريك لأسفل"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: HEADER BUTTONS */}
          {activeTab === 'header' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    {language === 'ar' ? 'التحكم بأزرار الشريط العلوي (Header)' : 'Header Buttons & Controls'}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {language === 'ar'
                      ? 'حدد الأزرار التي تريد ظهورها في الشريط العلوي لتسهيل الوصول اليومي أو تقليل الازدحام'
                      : 'Show, hide, and reorder header shortcuts to match your workflow'}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {layout.headerButtonsOrder.map((btnId, index) => {
                  const meta = HEADER_BUTTONS_CATALOG[btnId];
                  if (!meta) return null;
                  const Icon = meta.icon;
                  const isVisible = layout.headerButtonsVisibility[btnId] !== false;

                  return (
                    <div
                      key={btnId}
                      className={`p-2.5 sm:p-3 rounded-2xl border flex items-center justify-between gap-3 transition-colors ${
                        isVisible
                          ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                          : 'bg-slate-100/60 dark:bg-slate-800/40 border-dashed border-slate-300 dark:border-slate-700 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-mono font-bold text-slate-500 shrink-0">
                          {index + 1}
                        </span>
                        <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                          {language === 'ar' ? meta.nameAr : meta.nameEn}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {/* Visibility Toggle */}
                        <button
                          type="button"
                          onClick={() => toggleHeaderButtonVisibility(btnId)}
                          className={`p-1.5 rounded-xl border text-xs transition-colors cursor-pointer ${
                            isVisible
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800'
                              : 'bg-slate-200 text-slate-500 border-slate-300 dark:bg-slate-700 dark:border-slate-600'
                          }`}
                          title={isVisible ? 'إخفاء الزر' : 'إظهار الزر'}
                        >
                          {isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>

                        {/* Move Up */}
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => moveHeaderButton(index, 'up')}
                          className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                          title="تحريك لأعلى"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>

                        {/* Move Down */}
                        <button
                          type="button"
                          disabled={index === layout.headerButtonsOrder.length - 1}
                          onClick={() => moveHeaderButton(index, 'down')}
                          className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                          title="تحريك لأسفل"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: FLOATING ACTION BUTTON (FAB) */}
          {activeTab === 'floating' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      {language === 'ar' ? 'الزر العائم الذكي (Floating Action Hub)' : 'Floating Action Hub'}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {language === 'ar'
                        ? 'زر دائري عائم وسريع يمنحك وصولاً فورياً للميزات والأدوات من أي شاشة'
                        : 'Quick floating shortcut dock accessible across all views'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      updateButtonLayout({
                        floatingActionEnabled: !layout.floatingActionEnabled
                      })
                    }
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      layout.floatingActionEnabled
                        ? 'bg-emerald-500 text-slate-950 font-black shadow-xs'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {layout.floatingActionEnabled ? 'مفعل ✓' : 'معطل ✕'}
                  </button>
                </div>

                {layout.floatingActionEnabled && (
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      موضع الزر العائم على الشاشة:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          updateButtonLayout({
                            floatingActionPosition: 'bottom-right'
                          })
                        }
                        className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 ${
                          layout.floatingActionPosition === 'bottom-right'
                            ? 'bg-amber-500 text-slate-950 font-black border-amber-600 shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <span>↘️</span>
                        <span>أسفل اليمين (افتراضي)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          updateButtonLayout({
                            floatingActionPosition: 'bottom-left'
                          })
                        }
                        className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 ${
                          layout.floatingActionPosition === 'bottom-left'
                            ? 'bg-amber-500 text-slate-950 font-black border-amber-600 shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <span>↙️</span>
                        <span>أسفل اليسار</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          updateButtonLayout({
                            floatingActionPosition: 'top-right'
                          })
                        }
                        className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 ${
                          layout.floatingActionPosition === 'top-right'
                            ? 'bg-amber-500 text-slate-950 font-black border-amber-600 shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <span>↗️</span>
                        <span>أعلى اليمين</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          updateButtonLayout({
                            floatingActionPosition: 'top-left'
                          })
                        }
                        className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 ${
                          layout.floatingActionPosition === 'top-left'
                            ? 'bg-amber-500 text-slate-950 font-black border-amber-600 shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <span>↖️</span>
                        <span>أعلى اليسار</span>
                      </button>
                    </div>

                    {/* Floating Action Hub Icon Order & Visibility */}
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-2.5">
                      <div>
                        <h5 className="text-xs font-black text-slate-900 dark:text-white">
                          ترتيب وإظهار أيقونات قائمة الوصول السريع (FloatingActionHub):
                        </h5>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          رتّب الأيقونات حسب العمليات الأكثر تكراراً لديك لسهولة الوصول السريع
                        </p>
                      </div>

                      <div className="space-y-2">
                        {floatingOrder.map((btnId, index) => {
                          const meta = FLOATING_BUTTONS_CATALOG[btnId];
                          if (!meta) return null;
                          const Icon = meta.icon;
                          const isVisible = floatingVisibility[btnId] !== false;

                          return (
                            <div
                              key={btnId}
                              className={`p-2.5 rounded-2xl border flex items-center justify-between gap-3 transition-colors ${
                                isVisible
                                  ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                                  : 'bg-slate-100/60 dark:bg-slate-800/40 border-dashed border-slate-300 dark:border-slate-700 opacity-60'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-mono font-bold text-slate-500 shrink-0">
                                  {index + 1}
                                </span>
                                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                  <Icon className="w-4 h-4" />
                                </div>
                                <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                                  {language === 'ar' ? meta.nameAr : meta.nameEn}
                                </p>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => toggleFloatingButtonVisibility(btnId)}
                                  className={`p-1.5 rounded-xl border text-xs transition-colors cursor-pointer ${
                                    isVisible
                                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800'
                                      : 'bg-slate-200 text-slate-500 border-slate-300 dark:bg-slate-700 dark:border-slate-600'
                                  }`}
                                  title={isVisible ? 'إخفاء الأيقونة' : 'إظهار الأيقونة'}
                                >
                                  {isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                </button>

                                <button
                                  type="button"
                                  disabled={index === 0}
                                  onClick={() => moveFloatingButton(index, 'up')}
                                  className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                                  title="تحريك لأعلى"
                                >
                                  <ChevronUp className="w-4 h-4" />
                                </button>

                                <button
                                  type="button"
                                  disabled={index === floatingOrder.length - 1}
                                  onClick={() => moveFloatingButton(index, 'down')}
                                  className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                                  title="تحريك لأسفل"
                                >
                                  <ChevronDown className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Action Bar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={resetButtonLayout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'استعادة الترتيب الافتراضي' : 'Reset Defaults'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsButtonCustomizerModalOpen(false)}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{language === 'ar' ? 'تم الحفظ والاعتماد' : 'Apply & Close'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
