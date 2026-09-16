import React from 'react';
import { useApp } from '../../context/AppContext';
import { ActiveTab } from '../../types';
import { canAccessTab, getRoleInfo } from '../../utils/permissions';
import {
  LayoutDashboard,
  ReceiptText,
  Package,
  Layers,
  Users,
  Building2,
  FileSpreadsheet,
  RotateCcw,
  Wallet,
  TrendingUp,
  UserCog,
  Settings,
  Info,
  Sparkles,
  Radio,
  Coins,
  ShieldCheck,
  KeyRound,
  Cloud,
  ChevronDown
} from 'lucide-react';
import { GoogleIcon } from '../common/GoogleIcon';

interface NavSection {
  title: string;
  badge?: string;
  badgeColor?: string;
  items: {
    id: ActiveTab;
    labelKey: string;
    customLabel?: string;
    icon: React.ElementType;
    badge?: number;
    badgeColor?: string;
    tag?: string;
  }[];
}

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    t,
    products,
    cart,
    devices,
    deliveryVehicles,
    settings,
    currentUser,
    googleUser,
    isGoogleSignedIn,
    setIsPinModalOpen
  } = useApp();

  const lowStockCount = products.filter(p => p.stock <= p.minStock && p.status === 'active').length;
  const vehiclesOnRoute = deliveryVehicles.filter(v => v.status === 'on_route').length;
  const cartItemsCount = cart.reduce((acc, it) => acc + it.quantity, 0);
  const onlineDevicesCount = devices.filter(d => d.isOnline).length;
  const isGoogleDriveConnected = Boolean(settings.googleDriveConnected);
  const roleInfo = getRoleInfo(currentUser.role);

  const tabDescriptions: Record<ActiveTab, { title: string; desc: string }> = {
    pos: {
      title: 'شاشة الكاشير ونقطة البيع (POS)',
      desc: 'إصدار الفواتير الفورية، وتمرير المنتجات بالباركود، والدفع نقداً أو بالبطاقة أو آجل.'
    },
    invoices: {
      title: 'سجل المبيعات والفواتير',
      desc: 'سجل الفواتير الصادرة، وإعادة طباعة الإيصالات، وتصدير التقارير الضريبية.'
    },
    returns: {
      title: 'إدارة المرتجعات والاسترجاع',
      desc: 'معالجة استرجاع الفواتير بمسح الباركود، وإرجاع المنتجات لمخزون المستودع.'
    },
    products: {
      title: 'كتالوج وإدارة المنتجات',
      desc: 'إضافة وتعديل المنتجات وأسعار التجزئة والجملة، وإدارة وحدات القياس وأكواد الباركود.'
    },
    trade: {
      title: 'مركز تجارة الجملة والطلبيات',
      desc: 'إدارة طلبيات كبار التجار، ومستويات أسعار الجملة ونصف الجملة والتوزيع.'
    },
    inventory: {
      title: 'المستودعات وسيارات التوزيع',
      desc: 'مراقبة كميات المخزون، وجرد المستودعات، وتوزيع البضائع عبر سيارات النقل.'
    },
    customers: {
      title: 'سجل العملاء والولاء',
      desc: 'إدارة بيانات العملاء، وسجلات الشراء، ورصيد نقاط المكافآت وكشوف الحساب.'
    },
    debts: {
      title: 'دفتر الديون والمستحقات',
      desc: 'متابعة الديون الآجلة على الزبائن، ومستحقات الموردين وسندات القبض والصرف.'
    },
    expenses: {
      title: 'المصروفات والمصاريف اليومية',
      desc: 'تسجيل مصاريف المحل والكهرباء والإيجار والرواتب لمطابقتها في كشف الأرباح.'
    },
    reports: {
      title: 'التقارير المالية والمحاسبية',
      desc: 'تقارير الإيرادات، والأرباح، والضريبة، وحركة الصندوق والورديات.'
    },
    dashboard: {
      title: 'لوحة التحكم والمؤشرات',
      desc: 'إحصائيات المبيعات اللحظية، والأرباح الصافية، والمنتجات الأكثر طلباً.'
    },
    ai: {
      title: 'المساعد الذكي (Gemini AI)',
      desc: 'تحليل أداء المتجر بالذكاء الاصطناعي، واقتراح خطط تسعير ذكية وتنبؤات المخزون.'
    },
    staff: {
      title: 'طاقم العمل والورديات',
      desc: 'إدارة صلاحيات الكاشير والمشرفين، ومتابعة سجلات تسجيل الدخول والورديات.'
    },
    devices: {
      title: 'مركز ربط الأجهزة والشاشات',
      desc: 'مزامنة شاشات المطبخ KDS، شاشات العرض للعملاء، ونقاط البيع الإضافية.'
    },
    settings: {
      title: 'إعدادات النظام والنسخ السحابي',
      desc: 'تخصيص معلومات المتجر، وإعدادات الطابعات، ومزامنة النسخ مع Google Drive.'
    },
    about: {
      title: 'حول النظام والدعم الفني',
      desc: 'معلومات الإصدار، حالة قاعدة البيانات المحلية، وإرشادات الاستخدام.'
    }
  };

  // Structured Professional Navigation Hierarchy
  const navSections: NavSection[] = [
    {
      title: 'المبيعات ونقاط البيع',
      badge: 'مباشر',
      badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      items: [
        {
          id: 'pos',
          labelKey: 'navPOS',
          icon: ReceiptText,
          badge: cartItemsCount > 0 ? cartItemsCount : undefined,
          badgeColor: 'bg-amber-500 text-slate-950 font-black'
        },
        {
          id: 'invoices',
          labelKey: 'navInvoices',
          customLabel: 'سجل الفواتير',
          icon: FileSpreadsheet
        },
        {
          id: 'returns',
          labelKey: 'navReturns',
          customLabel: 'المرتجعات',
          icon: RotateCcw,
          tag: 'مسح باركود'
        }
      ]
    },
    {
      title: 'المخزون والمنتجات والجملة',
      badge: 'المستودعات',
      badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      items: [
        {
          id: 'products',
          labelKey: 'navProducts',
          icon: Package,
          badge: lowStockCount > 0 ? lowStockCount : undefined,
          badgeColor: 'bg-rose-500 text-white font-black'
        },
        {
          id: 'trade',
          labelKey: 'navTrade',
          customLabel: 'تجارة الجملة',
          icon: Building2,
          tag: 'جملة وشرائح'
        },
        {
          id: 'inventory',
          labelKey: 'navInventory',
          customLabel: 'المستودعات والنقل',
          icon: Layers,
          badge: vehiclesOnRoute > 0 ? vehiclesOnRoute : undefined,
          badgeColor: 'bg-amber-500 text-slate-950 font-black'
        }
      ]
    },
    {
      title: 'العملاء والمالية',
      badge: 'الدفاتر',
      badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      items: [
        {
          id: 'customers',
          labelKey: 'navCustomers',
          icon: Users
        },
        {
          id: 'debts',
          labelKey: 'navDebts',
          customLabel: 'دفتر الديون',
          icon: Coins,
          tag: 'زبائن وموردين'
        },
        {
          id: 'expenses',
          labelKey: 'navExpenses',
          customLabel: 'المصروفات',
          icon: Wallet
        },
        {
          id: 'reports',
          labelKey: 'navReports',
          customLabel: 'التقارير والأرباح',
          icon: TrendingUp
        }
      ]
    },
    {
      title: 'الإدارة والنظام',
      items: [
        {
          id: 'dashboard',
          labelKey: 'navDashboard',
          icon: LayoutDashboard
        },
        {
          id: 'ai',
          labelKey: 'navAI',
          icon: Sparkles,
          tag: 'AI Pro'
        },
        {
          id: 'staff',
          labelKey: 'navStaff',
          customLabel: 'طاقم العمل',
          icon: UserCog
        },
        {
          id: 'devices',
          labelKey: 'navDevices',
          customLabel: 'مركز الأجهزة',
          icon: Radio,
          badge: onlineDevicesCount > 0 ? onlineDevicesCount : undefined,
          badgeColor: 'bg-emerald-500 text-white'
        },
        {
          id: 'settings',
          labelKey: 'navSettings',
          icon: Settings,
          tag: isGoogleDriveConnected ? 'سحابي متصل' : undefined
        },
        {
          id: 'about',
          labelKey: 'navAbout',
          icon: Info
        }
      ]
    }
  ];

  return (
    <aside className="app-sidebar hidden lg:flex flex-col w-60 bg-white dark:bg-slate-900 border-e border-slate-200/80 dark:border-slate-800/80 shrink-0 select-none z-20 transition-colors">
      {/* Brand Header */}
      <div className="p-3.5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-sm shadow-xs">
            K
          </div>
          <div>
            <span className="text-xs font-black tracking-tight text-slate-900 dark:text-white block">
              {t('appName')}
            </span>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">
              نظام الكاشير والمستودعات
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 py-2 px-2.5 space-y-3.5 overflow-y-auto">
        {navSections
          .map(sec => ({
            ...sec,
            items: sec.items.filter(item => canAccessTab(item.id, currentUser.role))
          }))
          .filter(sec => sec.items.length > 0)
          .map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              <div className="flex items-center justify-between px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                <span>{section.title}</span>
                {section.badge && (
                  <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-md ${section.badgeColor}`}>
                    {section.badge}
                  </span>
                )}
              </div>

              <div className="space-y-0.5">
                {section.items.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  const tooltip = tabDescriptions[item.id] || { title: item.customLabel || t(item.labelKey as any), desc: '' };
                  const itemLabel = item.customLabel || t(item.labelKey as any);

                  return (
                    <button
                      key={item.id}
                      id={`sidebar-tab-${item.id}`}
                      type="button"
                      onClick={() => setActiveTab(item.id)}
                      data-longpress-title={tooltip.title}
                      data-longpress-desc={tooltip.desc}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-amber-500 text-slate-950 shadow-xs font-black'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-950' : 'text-slate-400 dark:text-slate-500'}`} />
                        <span className="truncate">{itemLabel}</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.tag && !isActive && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                            {item.tag}
                          </span>
                        )}
                        {item.badge !== undefined && (
                          <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${isActive ? 'bg-slate-950 text-amber-400' : item.badgeColor || 'bg-amber-100 text-amber-700'}`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
      </div>

      {/* Staff Access Level Badge & Switcher */}
      <div className="p-3 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80 space-y-2">
        <div className="p-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="relative w-6 h-6 rounded-lg overflow-hidden bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs shrink-0">
                {currentUser.avatar ? (
                  <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  currentUser.name.charAt(0)
                )}
                {(currentUser.isGoogleAccount || (isGoogleSignedIn && currentUser.email === googleUser?.email)) && (
                  <span className="absolute -bottom-0.5 -end-0.5 bg-white dark:bg-slate-900 rounded-full p-0.5 shadow-2xs">
                    <GoogleIcon className="w-2 h-2" />
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-black text-slate-900 dark:text-white truncate block">
                  {currentUser.name}
                </span>
                <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 block">
                  {roleInfo.badgeLabel}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsPinModalOpen(true)}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-amber-600 transition-colors cursor-pointer"
              title="تبديل المستخدم (PIN)"
            >
              <KeyRound className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Cloud Sync Status */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
          <div className="flex items-center gap-1.5">
            <Cloud className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-bold text-[10px]">
              {isGoogleDriveConnected ? 'Google Drive متصل' : 'نسخ احتياطي سحابي'}
            </span>
          </div>
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
            جاهز
          </span>
        </div>
      </div>
    </aside>
  );
};
