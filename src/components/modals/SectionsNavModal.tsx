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
  Activity,
  Coins,
  Search,
  Grid
} from 'lucide-react';

interface SectionsNavModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SectionCategory {
  title: string;
  items: {
    id: ActiveTab;
    name: string;
    desc: string;
    icon: React.ElementType;
    badge?: number | string;
  }[];
}

export const SectionsNavModal: React.FC<SectionsNavModalProps> = ({ isOpen, onClose }) => {
  const {
    activeTab,
    setActiveTab,
    language,
    cart,
    products,
    devices,
    deliveryVehicles,
    businessMode,
    currentUser
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const roleInfo = getRoleInfo(currentUser.role);
  const cartItemsCount = cart.reduce((acc, it) => acc + it.quantity, 0);
  const lowStockCount = products.filter(p => p.stock <= p.minStock && p.status === 'active').length;
  const vehiclesOnRoute = deliveryVehicles.filter(v => v.status === 'on_route').length;
  const visibleDevices = devices.filter(d =>
    businessMode === 'restaurant' ? true : d.role !== 'kitchen_display' && d.role !== 'waiter_mobile'
  );
  const onlineDevicesCount = visibleDevices.filter(d => d.isOnline).length;

  const categories: SectionCategory[] = [
    {
      title: language === 'ar' ? 'المبيعات ونقاط البيع' : 'Sales & POS',
      items: [
        {
          id: 'pos',
          name: language === 'ar' ? 'شاشة الكاشير (POS)' : 'Cashier Terminal (POS)',
          desc: language === 'ar' ? 'إصدار الفواتير الفورية، مسح الباركود، والدفع نقداً أو آجل' : 'Instant invoice checkout, barcode scanning, cash and card payments',
          icon: ReceiptText,
          badge: cartItemsCount > 0 ? cartItemsCount : undefined
        },
        {
          id: 'invoices',
          name: language === 'ar' ? 'سجل الفواتير والمبيعات' : 'Sales Invoices & Receipts',
          desc: language === 'ar' ? 'أرشيف الفواتير الصادرة، إعادة طباعة الإيصالات، وتصدير التقارير' : 'Browse historical receipts, reprint tickets, export tax summaries',
          icon: FileSpreadsheet
        },
        {
          id: 'returns',
          name: language === 'ar' ? 'المرتجعات والاسترجاع' : 'Refunds & Returns',
          desc: language === 'ar' ? 'معالجة استرجاع المنتجات بمسح باركود الفاتورة وإعادة الكميات للمخزن' : 'Scan receipt barcode to process returns and restock inventory',
          icon: RotateCcw
        }
      ]
    },
    {
      title: language === 'ar' ? 'المخزون والتجارة' : 'Catalog & Inventory',
      items: [
        {
          id: 'products',
          name: language === 'ar' ? 'المنتجات والأسعار' : 'Products & Pricing Catalog',
          desc: language === 'ar' ? 'إضافة وتعديل المنتجات وأسعار التجزئة والجملة وأكواد الباركود' : 'Manage product lines, wholesale/retail prices, and barcodes',
          icon: Package,
          badge: lowStockCount > 0 ? lowStockCount : undefined
        },
        {
          id: 'trade',
          name: language === 'ar' ? 'تجارة الجملة والطلبيات' : 'Wholesale Trade & Orders',
          desc: language === 'ar' ? 'إدارة طلبيات كبار التجار ومستويات أسعار الجملة ونصف الجملة' : 'B2B bulk orders, tiered trade price tiers and wholesale packages',
          icon: Building2
        },
        {
          id: 'inventory',
          name: language === 'ar' ? 'المستودعات وسيارات التوزيع' : 'Warehouses & Delivery Fleet',
          desc: language === 'ar' ? 'جرد المستودعات، ومراقبة النواقص، وحركة سيارات النقل والتوزيع' : 'Stock audits, transit manifests, delivery truck load dispatching',
          icon: Layers,
          badge: vehiclesOnRoute > 0 ? vehiclesOnRoute : undefined
        }
      ]
    },
    {
      title: language === 'ar' ? 'المالية والعملاء' : 'Finance & CRM',
      items: [
        {
          id: 'customers',
          name: language === 'ar' ? 'سجل العملاء والولاء' : 'Customer Directory & Loyalty',
          desc: language === 'ar' ? 'بيانات الزبائن، وسجل المشتريات، ورصيد نقاط المكافآت وكشوف الحساب' : 'Customer CRM, purchase records, rewards points and statements',
          icon: Users
        },
        {
          id: 'debts',
          name: language === 'ar' ? 'دفتر الديون والمستحقات' : 'Debt Ledger & Receivables',
          desc: language === 'ar' ? 'متابعة ديون الزبائن ومستحقات الموردين وسندات القبض والصرف' : 'Track credit balances, supplier obligations, vouchers, and aging',
          icon: Coins
        },
        {
          id: 'expenses',
          name: language === 'ar' ? 'المصروفات اليومية' : 'Daily Expenses & Overheads',
          desc: language === 'ar' ? 'تسجيل إيجار المحل، الفواتير، الصيانة، والرواتب لاحتساب صافي الربح' : 'Log shop expenses, utilities, wages and operating overheads',
          icon: Wallet
        },
        {
          id: 'reports',
          name: language === 'ar' ? 'التقارير والأرباح' : 'Financial Reports & Profits',
          desc: language === 'ar' ? 'تقارير الإيرادات، الأرباح الصافية، حركة الصندوق، والضرائب' : 'Income statements, net profit breakdown, cash register shifts',
          icon: TrendingUp
        }
      ]
    },
    {
      title: language === 'ar' ? 'الإدارة والنظام' : 'System & Admin',
      items: [
        {
          id: 'dashboard',
          name: language === 'ar' ? 'لوحة التحكم والمؤشرات' : 'Executive Dashboard',
          desc: language === 'ar' ? 'نبض المبيعات اللحظي، المؤشرات الحيوية، وأعلى الأصناف مبيعاً' : 'Live sales velocity, KPI summaries, and top-selling goods',
          icon: LayoutDashboard
        },
        {
          id: 'ai',
          name: language === 'ar' ? 'المساعد الذكي (AI)' : 'AI Intelligence',
          desc: language === 'ar' ? 'تحليل أداء المتجر واقتراح خطط التسعير والمخزون' : 'AI analytics, demand forecasting, and inventory optimization',
          icon: Sparkles
        },
        {
          id: 'staff',
          name: language === 'ar' ? 'طاقم العمل والورديات' : 'Staff & Permissions',
          desc: language === 'ar' ? 'إدارة صلاحيات الكاشير والمشرفين وسجلات الأمان' : 'Employee PINs, cashier shifts, audit trails and access control',
          icon: UserCog
        },
        {
          id: 'devices',
          name: language === 'ar' ? 'مركز ربط الأجهزة وأكوادها' : 'Device Linking Hub',
          desc: language === 'ar'
            ? (businessMode === 'restaurant'
                ? 'إعطاء كل جهاز كود خاص ومزامنة الكاشير والنادل وشاشة المطبخ'
                : 'إعطاء كل جهاز كود خاص ومزامنة نقاط البيع والمساعدين وشاشات العرض')
            : 'Assign unique codes to each device and sync with master terminal',
          icon: Radio,
          badge: onlineDevicesCount > 0 ? onlineDevicesCount : undefined
        },
        {
          id: 'devices_status',
          name: language === 'ar' ? 'صفحة حالة الأجهزة المرتبطة' : 'Linked Devices Status Page',
          desc: language === 'ar'
            ? 'مراقبة حالة الاتصال، الكود الخاص بكل جهاز، البطارية، والنشاط اللحظي للأجهزة المرتبطة بالجهاز الرئيسي'
            : 'Live status, unique device code, battery, and real-time activity of all linked devices',
          icon: Activity,
          badge: visibleDevices.length > 0 ? visibleDevices.length : undefined
        },
        {
          id: 'settings',
          name: language === 'ar' ? 'إعدادات النظام' : 'Store Settings',
          desc: language === 'ar' ? 'تخصيص الفواتير، الطابعات، والنسخ الاحتياطي السحابي' : 'Receipt layout, printer options, Google Drive backup sync',
          icon: Settings
        },
        {
          id: 'about',
          name: language === 'ar' ? 'حول النظام' : 'About System',
          desc: language === 'ar' ? 'معلومات الإصدار، حالة التخزين، والدعم الفني' : 'Version details, offline database storage, and quick help',
          icon: Info
        }
      ]
    }
  ];

  const handleSelectTab = (tabId: ActiveTab) => {
    setActiveTab(tabId);
    onClose();
  };

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
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        className="relative w-full max-w-3xl max-h-[92dvh] flex flex-col apple-glass-card rounded-3xl shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-slate-200/70 dark:border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 flex items-center justify-center shadow-xs">
              <Grid className="w-4 h-4" />
            </div>
            <div>
              <h2 id="sections-nav-title" className="text-sm sm:text-base font-black tracking-tight">
                {language === 'ar' ? 'أقسام النظام' : 'System Sections'}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {currentUser.name} · {language === 'ar' ? roleInfo.labelAr : roleInfo.labelEn}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
            aria-label={language === 'ar' ? 'إغلاق' : 'Close'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input */}
        <div className="px-4 sm:px-5 py-2.5 border-b border-slate-200/60 dark:border-white/[0.06]">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'ar' ? 'بحث سريع في الأقسام...' : 'Filter sections...'}
              className="w-full ps-9 pe-8 py-2 text-xs sm:text-sm font-medium bg-slate-200/60 dark:bg-white/[0.06] border border-white/60 dark:border-white/[0.08] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
            />
            <Search className="w-4 h-4 text-slate-400 absolute start-3 top-2.5 pointer-events-none" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 absolute end-1.5 top-1.5 rounded-lg"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Categories Grid */}
        <div className="flex-1 p-3.5 sm:p-5 overflow-y-auto space-y-4">
          {filteredCategories.length === 0 ? (
            <div className="py-10 text-center text-slate-400 dark:text-slate-500">
              <p className="text-xs font-bold">
                {language === 'ar' ? 'لم يتم العثور على أي قسم يطابق بحثك' : 'No sections matched your filter'}
              </p>
            </div>
          ) : (
            filteredCategories.map((category, catIdx) => (
              <div key={catIdx}>
                <h3 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mb-2 px-1">
                  {category.title}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {category.items.map((item) => {
                    const ItemIcon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectTab(item.id)}
                        className={`flex items-center gap-3 p-3 rounded-2xl border text-start transition-all cursor-pointer group active:scale-[0.98] ${
                          isActive
                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 border-slate-900 dark:border-white shadow-sm'
                            : 'bg-white/70 dark:bg-white/[0.04] hover:bg-white dark:hover:bg-white/[0.08] border-slate-200/70 dark:border-white/[0.07]'
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform ${
                            isActive
                              ? 'bg-white/15 dark:bg-slate-900/10 text-white dark:text-slate-950'
                              : 'bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          <ItemIcon className="w-4 h-4" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="text-xs font-bold truncate">
                              {item.name}
                            </h4>
                            {item.badge !== undefined && (
                              <span className="text-[10px] font-mono tabular-nums font-bold opacity-80 shrink-0">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className={`text-[11px] mt-0.5 line-clamp-1 ${
                            isActive ? 'text-white/75 dark:text-slate-700' : 'text-slate-500 dark:text-slate-400'
                          }`}>
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
      </div>
    </div>
  );
};
