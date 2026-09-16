import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ActiveTab } from '../../types';
import { canAccessTab, getRoleInfo } from '../../utils/permissions';
import {
  X,
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
  Search,
  ChevronLeft,
  ChevronRight,
  Store,
  Grid
} from 'lucide-react';

interface SectionsNavModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SectionCategory {
  title: string;
  badge?: string;
  badgeColor?: string;
  items: {
    id: ActiveTab;
    name: string;
    desc: string;
    icon: React.ElementType;
    badge?: number | string;
    badgeColor?: string;
    tag?: string;
  }[];
}

export const SectionsNavModal: React.FC<SectionsNavModalProps> = ({ isOpen, onClose }) => {
  const {
    activeTab,
    setActiveTab,
    language,
    t,
    cart,
    products,
    devices,
    deliveryVehicles,
    settings,
    currentUser
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const isRtl = language === 'ar';
  const roleInfo = getRoleInfo(currentUser.role);
  const cartItemsCount = cart.reduce((acc, it) => acc + it.quantity, 0);
  const lowStockCount = products.filter(p => p.stock <= p.minStock && p.status === 'active').length;
  const vehiclesOnRoute = deliveryVehicles.filter(v => v.status === 'on_route').length;
  const onlineDevicesCount = devices.filter(d => d.isOnline).length;
  const isGoogleDriveConnected = Boolean(settings.googleDriveConnected);

  const categories: SectionCategory[] = [
    {
      title: language === 'ar' ? 'المبيعات ونقاط البيع اليومية' : 'Sales & Front Desk',
      badge: language === 'ar' ? 'مباشر' : 'Live',
      badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      items: [
        {
          id: 'pos',
          name: language === 'ar' ? 'شاشة الكاشير (POS)' : 'Cashier Terminal (POS)',
          desc: language === 'ar' ? 'إصدار فواتير البيع الفورية، مسح الباركود، والدفع نقداً أو شبكة أو آجل' : 'Instant invoice checkout, barcode scanning, cash and card payments',
          icon: ReceiptText,
          badge: cartItemsCount > 0 ? `${cartItemsCount} سلة` : undefined,
          badgeColor: 'bg-amber-500 text-slate-950 font-black'
        },
        {
          id: 'invoices',
          name: language === 'ar' ? 'سجل الفواتير والمبيعات' : 'Sales Invoices & Receipts',
          desc: language === 'ar' ? 'أرشيف الفواتير الصادرة، إعادة طباعة الإيصالات، وتصدير التقارير' : 'Browse historical receipts, reprint tickets, export tax summaries',
          icon: FileSpreadsheet
        },
        {
          id: 'returns',
          name: language === 'ar' ? 'إدارة المرتجعات والاسترجاع' : 'Refunds & Returns',
          desc: language === 'ar' ? 'معالجة استرجاع المنتجات بمسح باركود الفاتورة وإعادة الكميات للمخزن' : 'Scan receipt barcode to process returns and restock inventory',
          icon: RotateCcw,
          tag: language === 'ar' ? 'مسح باركود' : 'Barcode'
        }
      ]
    },
    {
      title: language === 'ar' ? 'المخزون والمنتجات والجملة' : 'Inventory, Catalog & Wholesale',
      badge: language === 'ar' ? 'المستودعات' : 'Warehouse',
      badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      items: [
        {
          id: 'products',
          name: language === 'ar' ? 'كتالوج المنتجات والأسعار' : 'Products & Pricing Catalog',
          desc: language === 'ar' ? 'إضافة وتعديل المنتجات وأسعار التجزئة والجملة وأكواد الباركود' : 'Manage product lines, wholesale/retail prices, and barcodes',
          icon: Package,
          badge: lowStockCount > 0 ? `${lowStockCount} نفاد` : undefined,
          badgeColor: 'bg-rose-500 text-white font-black'
        },
        {
          id: 'trade',
          name: language === 'ar' ? 'تجارة الجملة والطلبيات' : 'Wholesale Trade & Orders',
          desc: language === 'ar' ? 'إدارة طلبيات كبار العملاء ومستويات أسعار الجملة ونصف الجملة' : 'B2B bulk orders, tiered trade price tiers and wholesale packages',
          icon: Building2,
          tag: language === 'ar' ? 'جملة وشرائح' : 'B2B'
        },
        {
          id: 'inventory',
          name: language === 'ar' ? 'المستودعات وسيارات التوزيع' : 'Warehouses & Delivery Fleet',
          desc: language === 'ar' ? 'جرد المستودعات، ومراقبة النواقص، وحركة سيارات النقل والتوزيع' : 'Stock audits, transit manifests, delivery truck load dispatching',
          icon: Layers,
          badge: vehiclesOnRoute > 0 ? `${vehiclesOnRoute} سيارات` : undefined,
          badgeColor: 'bg-amber-500 text-slate-950 font-black'
        }
      ]
    },
    {
      title: language === 'ar' ? 'العملاء والمالية والمصروفات' : 'Customers, Debts & Finance',
      badge: language === 'ar' ? 'المالية' : 'Finance',
      badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      items: [
        {
          id: 'customers',
          name: language === 'ar' ? 'سجل العملاء وبرنامج الولاء' : 'Customer Directory & Loyalty',
          desc: language === 'ar' ? 'بيانات الزبائن، وسجل المشتريات، ورصيد نقاط المكافآت وكشوف الحساب' : 'Customer CRM, purchase records, rewards points and statements',
          icon: Users
        },
        {
          id: 'debts',
          name: language === 'ar' ? 'دفتر الديون والمستحقات' : 'Debt Ledger & Receivables',
          desc: language === 'ar' ? 'متابعة ديون الزبائن ومستحقات الموردين وسندات القبض والصرف' : 'Track credit balances, supplier obligations, vouchers, and aging',
          icon: Coins,
          tag: language === 'ar' ? 'زبائن وموردين' : 'Accounts'
        },
        {
          id: 'expenses',
          name: language === 'ar' ? 'المصروفات والنفقات اليومية' : 'Daily Expenses & Overheads',
          desc: language === 'ar' ? 'تسجيل إيجار المحل، الفواتير، الصيانة، والرواتب لاحتساب صافي الربح' : 'Log shop expenses, utilities, wages and operating overheads',
          icon: Wallet
        },
        {
          id: 'reports',
          name: language === 'ar' ? 'التقارير المالية والأرباح' : 'Financial Reports & Profits',
          desc: language === 'ar' ? 'تقارير الإيرادات، الأرباح الصافية، حركة الصندوق، والضرائب' : 'Income statements, net profit breakdown, cash register shifts',
          icon: TrendingUp
        }
      ]
    },
    {
      title: language === 'ar' ? 'الإدارة والنظام والمساعد الذكي' : 'Administration & System',
      items: [
        {
          id: 'dashboard',
          name: language === 'ar' ? 'لوحة التحكم والمؤشرات' : 'Executive Dashboard',
          desc: language === 'ar' ? 'نبض المبيعات اللحظي، المؤشرات الحيوية، وأعلى الأصناف مبيعاً' : 'Live sales velocity, KPI summaries, and top-selling goods',
          icon: LayoutDashboard
        },
        {
          id: 'ai',
          name: language === 'ar' ? 'المساعد الذكي (Gemini AI)' : 'AI Intelligence (Gemini)',
          desc: language === 'ar' ? 'تحليل أداء المتجر بالذكاء الاصطناعي واقتراح خطط التسعير والمخزون' : 'AI analytics, demand forecasting, and inventory optimization',
          icon: Sparkles,
          tag: 'Gemini AI'
        },
        {
          id: 'staff',
          name: language === 'ar' ? 'طاقم العمل والورديات' : 'Staff, Shifts & Permissions',
          desc: language === 'ar' ? 'إدارة صلاحيات الكاشير والمشرفين، الورديات، وسجلات الأمان' : 'Employee PINs, cashier shifts, audit trails and access control',
          icon: UserCog
        },
        {
          id: 'devices',
          name: language === 'ar' ? 'مركز ربط الأجهزة والشاشات' : 'Device Linking & Terminals Hub',
          desc: language === 'ar' ? 'مزامنة شاشات المطبخ، شاشات العرض للعملاء، ونقاط البيع الإضافية' : 'Sync kitchen KDS displays, customer screens, and mobile waiters',
          icon: Radio,
          badge: onlineDevicesCount > 0 ? `${onlineDevicesCount} جهاز` : undefined,
          badgeColor: 'bg-emerald-500 text-white'
        },
        {
          id: 'settings',
          name: language === 'ar' ? 'إعدادات المتجر والنسخ السحابي' : 'Store Settings & Cloud Sync',
          desc: language === 'ar' ? 'تخصيص الفواتير، الطابعات، ومزامنة النسخ مع Google Drive' : 'Receipt layout, printer options, Google Drive backup sync',
          icon: Settings,
          tag: isGoogleDriveConnected ? (language === 'ar' ? 'سحابي متصل' : 'Drive Active') : undefined
        },
        {
          id: 'about',
          name: language === 'ar' ? 'حول النظام والمساعدة' : 'About System & Database',
          desc: language === 'ar' ? 'معلومات الإصدار، حالة التخزين، والدعم الفني للنظام' : 'Version details, offline database storage, and quick help',
          icon: Info
        }
      ]
    }
  ];

  const handleSelectTab = (tabId: ActiveTab) => {
    setActiveTab(tabId);
    onClose();
  };

  // Filter sections by search query
  const filteredCategories = categories.map(cat => ({
    ...cat,
    items: cat.items.filter(item => {
      if (!canAccessTab(item.id, currentUser.role)) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.desc.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q)
      );
    })
  })).filter(cat => cat.items.length > 0);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sections-nav-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-900 dark:text-slate-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
              <Grid className="w-5 h-5" />
            </div>
            <div>
              <h2 id="sections-nav-title" className="text-base font-black tracking-tight">
                {language === 'ar' ? 'دليل أقسام النظام الشامل' : 'All System Sections & Modules'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'ar'
                  ? 'اختر القسم المطلوب للانتقال المباشر أو البحث السريع'
                  : 'Select an area to navigate directly or search modules'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label={language === 'ar' ? 'إغلاق' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Filter Search Input */}
        <div className="px-5 pt-3 pb-1 border-b border-slate-100 dark:border-slate-800">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'ar' ? 'بحث في الأقسام (كاشير، مستودعات، ديون، تقارير...)' : 'Filter sections (POS, debts, inventory...)'}
              className="w-full ps-9 pe-9 py-2 text-xs sm:text-sm font-semibold bg-slate-100 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 rounded-xl focus:outline-none focus:border-amber-500 transition-all"
            />
            <Search className="w-4 h-4 text-slate-400 absolute start-3 top-2.5 pointer-events-none" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 absolute end-1.5 top-1 rounded-lg"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Categories & Items Grid */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-5">
          {filteredCategories.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500">
              <p className="text-sm font-bold">
                {language === 'ar' ? 'لم يتم العثور على أي قسم يطابق بحثك' : 'No sections matched your filter'}
              </p>
            </div>
          ) : (
            filteredCategories.map((category, catIdx) => (
              <div key={catIdx}>
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <span>{category.title}</span>
                  </h3>
                  {category.badge && (
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${category.badgeColor}`}>
                      {category.badge}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {category.items.map((item) => {
                    const ItemIcon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectTab(item.id)}
                        className={`flex items-start gap-3 p-3 rounded-2xl border text-start transition-all cursor-pointer group active:scale-95 shadow-2xs ${
                          isActive
                            ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-400 dark:border-amber-600 ring-2 ring-amber-400/20'
                            : 'bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-750 border-slate-200 dark:border-slate-700/80 hover:border-slate-300'
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                            isActive
                              ? 'bg-amber-500 text-slate-950 shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-700/80 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          <ItemIcon className="w-4 h-4" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className={`text-xs font-black truncate ${
                              isActive ? 'text-amber-800 dark:text-amber-300' : 'text-slate-900 dark:text-white'
                            }`}>
                              {item.name}
                            </h4>
                            {item.badge && (
                              <span className={`text-[10px] px-1.5 py-0.2 rounded-md shrink-0 ${item.badgeColor}`}>
                                {item.badge}
                              </span>
                            )}
                            {item.tag && !item.badge && (
                              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.2 rounded shrink-0">
                                {item.tag}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-tight">
                            {item.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {language === 'ar' ? 'المستخدم الحالي:' : 'Current User:'}
            </span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {currentUser.name} ({language === 'ar' ? roleInfo.labelAr : roleInfo.labelEn})
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            {language === 'ar' ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
