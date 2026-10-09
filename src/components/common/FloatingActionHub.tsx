import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Sparkles,
  Sliders,
  ReceiptText,
  Plus,
  Coins,
  Sun,
  Moon,
  Palette,
  Package,
  Layers,
  BarChart3,
  Wallet,
  Search,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  RotateCcw,
  Check,
  GripVertical,
  ArrowUpToLine,
  LayoutDashboard
} from 'lucide-react';
import { haptics } from '../../services/haptics';

interface FloatingActionHubProps {
  onOpenBarcodeScanner?: () => void;
  onOpenBulletinModal?: () => void;
}

export interface FloatingHubActionItem {
  id: string;
  labelAr: string;
  labelEn: string;
  icon: React.ElementType;
  badgeColorClass: string;
  titleAr: string;
}

export const DEFAULT_FLOATING_HUB_ORDER: string[] = [
  'pos',
  'dashboard',
  'ai',
  'debts',
  'products',
  'inventory',
  'reports',
  'shift',
  'search',
  'themeToggle',
  'themeColor',
  'customizeButtons',
  'about'
];

export const DEFAULT_FLOATING_HUB_VISIBILITY: Record<string, boolean> = {
  pos: true,
  dashboard: true,
  ai: true,
  debts: true,
  products: true,
  inventory: true,
  reports: true,
  shift: true,
  search: true,
  themeToggle: true,
  themeColor: true,
  customizeButtons: true,
  about: true
};

export const FloatingActionHub: React.FC<FloatingActionHubProps> = () => {
  const {
    settings,
    setActiveTab,
    setIsButtonCustomizerModalOpen,
    updateButtonLayout,
    openShiftModal,
    setIsSearchModalOpen,
    toggleTheme,
    theme,
    language,
    notify,
    isMasterDevice,
    currentDeviceAllowedPages
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [isCustomizingOrder, setIsCustomizingOrder] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const layout = settings.buttonLayout;

  // Merge stored order with any new catalog items so nothing is ever lost
  const orderedIds = useMemo(() => {
    const saved = layout?.floatingActionButtonsOrder;
    if (!saved || !Array.isArray(saved) || saved.length === 0) {
      return DEFAULT_FLOATING_HUB_ORDER;
    }
    const missing = DEFAULT_FLOATING_HUB_ORDER.filter(id => !saved.includes(id));
    return [...saved.filter(id => DEFAULT_FLOATING_HUB_ORDER.includes(id)), ...missing];
  }, [layout?.floatingActionButtonsOrder]);

  const visibilityMap = useMemo(() => {
    return {
      ...DEFAULT_FLOATING_HUB_VISIBILITY,
      ...(layout?.floatingActionButtonsVisibility || {})
    };
  }, [layout?.floatingActionButtonsVisibility]);

  if (!layout || layout.floatingActionEnabled === false || layout.floatingActionPosition === 'hidden') {
    return null;
  }

  const posClass = {
    'bottom-right': 'bottom-20 right-4 sm:bottom-6 sm:right-6',
    'bottom-left': 'bottom-20 left-4 sm:bottom-6 sm:left-6',
    'top-right': 'top-20 right-4 sm:top-20 sm:right-6',
    'top-left': 'top-20 left-4 sm:top-20 sm:left-6'
  }[layout.floatingActionPosition] || 'bottom-20 right-4 sm:bottom-6 sm:right-6';

  const isTopPosition =
    layout.floatingActionPosition === 'top-right' || layout.floatingActionPosition === 'top-left';

  const catalogMap: Record<string, FloatingHubActionItem & { onTrigger: () => void }> = {
    pos: {
      id: 'pos',
      labelAr: 'شاشة الكاشير (نقطة البيع)',
      labelEn: 'POS Register',
      icon: ReceiptText,
      badgeColorClass: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
      titleAr: 'الانتقال الفوري إلى شاشة الكاشير ونقطة البيع',
      onTrigger: () => {
        setIsOpen(false);
        setActiveTab('pos');
      }
    },
    dashboard: {
      id: 'dashboard',
      labelAr: 'لوحة القيادة (Dashboard)',
      labelEn: 'Dashboard',
      icon: LayoutDashboard,
      badgeColorClass: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
      titleAr: 'الانتقال إلى لوحة القيادة ومقارنة الأرباح اليومية بالمصروفات',
      onTrigger: () => {
        setIsOpen(false);
        setActiveTab('dashboard');
      }
    },
    ai: {
      id: 'ai',
      labelAr: 'المستشار الذكي (AI Engine)',
      labelEn: 'AI Intelligence Hub',
      icon: Sparkles,
      badgeColorClass: 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
      titleAr: 'فتح منظومة الذكاء الاصطناعي والتحليل المالي والتسعير الذكي',
      onTrigger: () => {
        setIsOpen(false);
        setActiveTab('ai');
      }
    },
    debts: {
      id: 'debts',
      labelAr: 'الديون والشراء من الموردين',
      labelEn: 'Debts & Suppliers',
      icon: Wallet,
      badgeColorClass: 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
      titleAr: 'إدارة ديون الزبائن وفواتير الشراء من الشركات والموردين',
      onTrigger: () => {
        setIsOpen(false);
        setActiveTab('debts');
      }
    },
    products: {
      id: 'products',
      labelAr: 'المنتجات وتنبيهات النواقص',
      labelEn: 'Products & Alerts',
      icon: Package,
      badgeColorClass: 'bg-rose-500/20 text-rose-600 dark:text-rose-400',
      titleAr: 'إدارة المنتجات والأسعار وتقرير المخزون الأدنى',
      onTrigger: () => {
        setIsOpen(false);
        setActiveTab('products');
      }
    },
    inventory: {
      id: 'inventory',
      labelAr: 'إدارة المخزون والمستودع',
      labelEn: 'Inventory Hub',
      icon: Layers,
      badgeColorClass: 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400',
      titleAr: 'جرد المخزون وحركات التوريد وسيارات التوزيع',
      onTrigger: () => {
        setIsOpen(false);
        setActiveTab('inventory');
      }
    },
    reports: {
      id: 'reports',
      labelAr: 'لوحة التقارير والأرباح',
      labelEn: 'Analytics & Reports',
      icon: BarChart3,
      badgeColorClass: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
      titleAr: 'الرسوم البيانية للمبيعات اليومية وتطور الأرباح',
      onTrigger: () => {
        setIsOpen(false);
        setActiveTab('reports');
      }
    },
    shift: {
      id: 'shift',
      labelAr: 'صندوق النقد والوردية',
      labelEn: 'Cash Shift Drawer',
      icon: Coins,
      badgeColorClass: 'bg-teal-500/20 text-teal-600 dark:text-teal-400',
      titleAr: 'فتح وإغلاق الوردية وإدارة النقد في الصندوق',
      onTrigger: () => {
        setIsOpen(false);
        openShiftModal();
      }
    },
    search: {
      id: 'search',
      labelAr: 'البحث الشامل السريع',
      labelEn: 'Global Search',
      icon: Search,
      badgeColorClass: 'bg-sky-500/20 text-sky-600 dark:text-sky-400',
      titleAr: 'البحث الفوري عن منتج أو فاتورة أو عميل',
      onTrigger: () => {
        setIsOpen(false);
        setIsSearchModalOpen(true);
      }
    },
    themeToggle: {
      id: 'themeToggle',
      labelAr: theme === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي',
      labelEn: theme === 'dark' ? 'Light Mode' : 'Dark Mode',
      icon: theme === 'dark' ? Sun : Moon,
      badgeColorClass: 'bg-purple-500/20 text-purple-600 dark:text-purple-400',
      titleAr: 'تبديل المظهر الليلي والنهاري',
      onTrigger: () => {
        toggleTheme();
      }
    },
    themeColor: {
      id: 'themeColor',
      labelAr: 'ألوان المتجر والهوية',
      labelEn: 'Theme Color',
      icon: Palette,
      badgeColorClass: 'bg-pink-500/20 text-pink-600 dark:text-pink-400',
      titleAr: 'تخصيص نظام ألوان وهوية المتجر',
      onTrigger: () => {
        setIsOpen(false);
        setActiveTab('settings');
      }
    },
    customizeButtons: {
      id: 'customizeButtons',
      labelAr: 'تخصيص مواقع الأزرار',
      labelEn: 'Customize Layout',
      icon: Sliders,
      badgeColorClass: 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
      titleAr: 'تخصيص وترتيب مواقع أزرار الواجهة بالكامل',
      onTrigger: () => {
        setIsOpen(false);
        setIsButtonCustomizerModalOpen(true);
      }
    },
    about: {
      id: 'about',
      labelAr: 'سجل التحسينات والدليل',
      labelEn: "What's New",
      icon: Sparkles,
      badgeColorClass: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
      titleAr: 'سجل التحديثات ودليل استخدام النظام',
      onTrigger: () => {
        setIsOpen(false);
        setActiveTab('about');
      }
    }
  };

  const handleMoveItem = (index: number, direction: 'up' | 'down' | 'top') => {
    haptics.selection();
    const nextOrder = [...orderedIds];
    if (direction === 'top' && index > 0) {
      const [moved] = nextOrder.splice(index, 1);
      nextOrder.unshift(moved);
    } else {
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= nextOrder.length) return;
      const temp = nextOrder[index];
      nextOrder[index] = nextOrder[targetIndex];
      nextOrder[targetIndex] = temp;
    }
    updateButtonLayout({
      floatingActionButtonsOrder: nextOrder,
      activePreset: 'custom'
    });
  };

  const handleToggleVisibility = (id: string) => {
    haptics.selection();
    const nextVis = {
      ...visibilityMap,
      [id]: !visibilityMap[id]
    };
    // Ensure at least 1 item stays visible
    const visibleCount = Object.values(nextVis).filter(Boolean).length;
    if (visibleCount === 0) {
      notify('تنبيه', 'يجب إبقاء أيقونة واحدة على الأقل ظاهرة في القائمة السريعة', 'warning');
      return;
    }
    updateButtonLayout({
      floatingActionButtonsVisibility: nextVis,
      activePreset: 'custom'
    });
  };

  const handleResetFloatingOrder = () => {
    haptics.tap();
    updateButtonLayout({
      floatingActionButtonsOrder: DEFAULT_FLOATING_HUB_ORDER,
      floatingActionButtonsVisibility: DEFAULT_FLOATING_HUB_VISIBILITY
    });
    notify('تمت الاستعادة', 'تمت استعادة الترتيب الافتراضي لأيقونات الوصول السريع', 'info');
  };

  const handleDropOnItem = (targetId: string) => {
    if (!draggedId || draggedId === targetId) return;
    const fromIdx = orderedIds.indexOf(draggedId);
    const toIdx = orderedIds.indexOf(targetId);
    if (fromIdx < 0 || toIdx < 0) return;

    const nextOrder = [...orderedIds];
    const [removed] = nextOrder.splice(fromIdx, 1);
    nextOrder.splice(toIdx, 0, removed);

    updateButtonLayout({
      floatingActionButtonsOrder: nextOrder,
      activePreset: 'custom'
    });
    setDraggedId(null);
  };

  const tabActionIds = ['pos', 'dashboard', 'debts', 'products', 'inventory', 'reports', 'about'];

  const visibleItems = orderedIds
    .filter(id => {
      if (visibilityMap[id] === false || !catalogMap[id]) return false;
      if (!isMasterDevice && currentDeviceAllowedPages && currentDeviceAllowedPages.length > 0) {
        if (id === 'themeColor') return currentDeviceAllowedPages.includes('settings' as any);
        if (id === 'customizeButtons') return false;
        if (tabActionIds.includes(id)) {
          return currentDeviceAllowedPages.includes(id as any);
        }
      }
      return true;
    })
    .map(id => catalogMap[id]);

  return (
    <div
      className={`fixed z-40 ${posClass} select-none print:hidden flex ${
        isTopPosition ? 'flex-col-reverse' : 'flex-col'
      } items-end`}
    >
      {/* Expanded Quick Dial Menu / Reorder Customizer */}
      {isOpen && (
        <div
          className={`${
            isTopPosition ? 'mt-3' : 'mb-3'
          } w-72 sm:w-80 rounded-3xl apple-glass-panel bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-200`}
        >
          {/* Top Header Bar inside FloatingActionHub */}
          <div className="px-3.5 py-2.5 bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <Sliders className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                {isCustomizingOrder
                  ? language === 'ar'
                    ? 'تخصيص ترتيب الأيقونات'
                    : 'Customize Icon Order'
                  : language === 'ar'
                  ? 'الوصول السريع للعمليات'
                  : 'Quick Action Hub'}
              </span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {isCustomizingOrder && (
                <button
                  type="button"
                  onClick={handleResetFloatingOrder}
                  className="p-1.5 rounded-lg text-[10px] font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                  title="استعادة الترتيب الافتراضي"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                id="btn-toggle-floating-hub-reorder"
                onClick={() => {
                  haptics.buttonPress();
                  setIsCustomizingOrder(!isCustomizingOrder);
                }}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-black flex items-center gap-1 transition-all cursor-pointer ${
                  isCustomizingOrder
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 border border-amber-400/30'
                }`}
                title="تغيير ترتيب وإظهار/إخفاء أيقونات الوصول السريع"
              >
                {isCustomizingOrder ? (
                  <>
                    <Check className="w-3 h-3" />
                    <span>{language === 'ar' ? 'حفظ الترتيب' : 'Done'}</span>
                  </>
                ) : (
                  <>
                    <Sliders className="w-3 h-3" />
                    <span>{language === 'ar' ? 'ترتيب الأيقونات' : 'Reorder'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Body: Either Reorder Mode or Quick Action Mode */}
          {isCustomizingOrder ? (
            <div className="p-2.5 max-h-[65vh] overflow-y-auto space-y-1.5">
              <div className="px-2 py-1 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/50 text-[10px] font-bold text-amber-800 dark:text-amber-300">
                رتّب العمليات الأكثر تكراراً لديك في المقدمة باستخدام الأسهم أو السحب والإفلات:
              </div>

              {orderedIds.map((id, idx) => {
                const item = catalogMap[id];
                if (!item) return null;
                const Icon = item.icon;
                const isVisible = visibilityMap[id] !== false;

                return (
                  <div
                    key={id}
                    draggable
                    onDragStart={() => setDraggedId(id)}
                    onDragOver={e => e.preventDefault()}
                    onDrop={() => handleDropOnItem(id)}
                    className={`p-2 rounded-2xl border flex items-center justify-between gap-2 transition-all ${
                      isVisible
                        ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs'
                        : 'bg-slate-100/60 dark:bg-slate-800/40 border-dashed border-slate-300 dark:border-slate-700 opacity-55'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <GripVertical className="w-3.5 h-3.5 text-slate-400 cursor-grab shrink-0" />
                      <span className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-mono font-black text-slate-500 flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span
                        className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${item.badgeColorClass}`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                        {language === 'ar' ? item.labelAr : item.labelEn}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* Move to #1 Top Priority */}
                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={() => handleMoveItem(idx, 'top')}
                          className="p-1 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 hover:bg-amber-100 transition-colors cursor-pointer"
                          title="نقل إلى المرتبة الأولى (الأولوية القصوى)"
                        >
                          <ArrowUpToLine className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Move Up */}
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveItem(idx, 'up')}
                        className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                        title="تحريك لأعلى"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>

                      {/* Move Down */}
                      <button
                        type="button"
                        disabled={idx === orderedIds.length - 1}
                        onClick={() => handleMoveItem(idx, 'down')}
                        className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                        title="تحريك لأسفل"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Show / Hide */}
                      <button
                        type="button"
                        onClick={() => handleToggleVisibility(id)}
                        className={`p-1 rounded-lg border transition-colors cursor-pointer ${
                          isVisible
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800'
                            : 'bg-slate-200 text-slate-500 border-slate-300 dark:bg-slate-700 dark:border-slate-600'
                        }`}
                        title={isVisible ? 'إخفاء من القائمة السريعة' : 'إظهار في القائمة السريعة'}
                      >
                        {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-2.5 max-h-[65vh] overflow-y-auto space-y-1.5">
              {visibleItems.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      haptics.buttonPress();
                      item.onTrigger();
                    }}
                    className="w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-slate-200/80 dark:border-slate-700/70 text-slate-800 dark:text-slate-100 transition-all cursor-pointer group text-xs font-black active:scale-98"
                    title={item.titleAr}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${item.badgeColorClass}`}
                      >
                        <Icon className="w-4 h-4" />
                      </span>
                      <span className="truncate">
                        {language === 'ar' ? item.labelAr : item.labelEn}
                      </span>
                    </div>
                    {idx === 0 && (
                      <span className="px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[9px] font-bold shrink-0">
                        الأسرع ⚡
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Main Floating Trigger Button */}
      <button
        id="btn-floating-action-hub"
        type="button"
        onClick={() => {
          haptics.buttonPress();
          setIsOpen(!isOpen);
          if (isOpen) setIsCustomizingOrder(false);
        }}
        className={`w-12 h-12 rounded-2xl shadow-2xl flex items-center justify-center transition-all transform active:scale-95 cursor-pointer ${
          isOpen
            ? 'bg-rose-500 hover:bg-rose-600 text-white rotate-45'
            : 'bg-gradient-to-tr from-amber-600 to-amber-400 text-slate-950 hover:scale-105 shadow-amber-500/30'
        }`}
        title={isOpen ? 'إغلاق القائمة السريعة' : 'أدوات الوصول السريع وتخصيص ترتيب الأيقونات'}
      >
        {isOpen ? <Plus className="w-6 h-6" /> : <Sliders className="w-5 h-5 font-black" />}
      </button>
    </div>
  );
};
