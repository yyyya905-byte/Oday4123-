import React from 'react';
import { useApp } from '../../context/AppContext';
import { ActiveTab } from '../../types';
import { canAccessTab } from '../../utils/permissions';
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
  Activity,
  Coins,
  Cloud
} from 'lucide-react';

interface NavSection {
  title: string;
  items: {
    id: ActiveTab;
    labelKey: string;
    customLabel?: string;
    icon: React.ElementType;
    badge?: number;
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
    businessMode,
    language
  } = useApp();

  const lowStockCount = products.filter(p => p.stock <= p.minStock && p.status === 'active').length;
  const vehiclesOnRoute = deliveryVehicles.filter(v => v.status === 'on_route').length;
  const cartItemsCount = cart.reduce((acc, it) => acc + it.quantity, 0);
  const visibleDevices = devices.filter(d =>
    businessMode === 'restaurant' ? true : d.role !== 'kitchen_display' && d.role !== 'waiter_mobile'
  );
  const onlineDevicesCount = visibleDevices.filter(d => d.isOnline).length;
  const isGoogleDriveConnected = Boolean(settings.googleDriveConnected);

  const navSections: NavSection[] = [
    {
      title: language === 'ar' ? 'المبيعات ونقاط البيع' : 'Sales & POS',
      items: [
        {
          id: 'pos',
          labelKey: 'navPOS',
          icon: ReceiptText,
          badge: cartItemsCount > 0 ? cartItemsCount : undefined
        },
        {
          id: 'dashboard',
          labelKey: 'navDashboard',
          customLabel: language === 'ar' ? 'لوحة القيادة' : 'Dashboard',
          icon: LayoutDashboard
        },
        {
          id: 'invoices',
          labelKey: 'navInvoices',
          customLabel: language === 'ar' ? 'سجل الفواتير' : 'Invoices',
          icon: FileSpreadsheet
        },
        {
          id: 'returns',
          labelKey: 'navReturns',
          customLabel: language === 'ar' ? 'المرتجعات' : 'Returns',
          icon: RotateCcw
        }
      ]
    },
    {
      title: language === 'ar' ? 'المخزون والتجارة' : 'Catalog & Inventory',
      items: [
        {
          id: 'products',
          labelKey: 'navProducts',
          icon: Package,
          badge: lowStockCount > 0 ? lowStockCount : undefined
        },
        {
          id: 'trade',
          labelKey: 'navTrade',
          customLabel: language === 'ar' ? 'تجارة الجملة' : 'Wholesale',
          icon: Building2
        },
        {
          id: 'inventory',
          labelKey: 'navInventory',
          customLabel: language === 'ar' ? 'المستودعات والنقل' : 'Warehouses',
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
          labelKey: 'navCustomers',
          icon: Users
        },
        {
          id: 'debts',
          labelKey: 'navDebts',
          customLabel: language === 'ar' ? 'دفتر الديون' : 'Debts Ledger',
          icon: Coins
        },
        {
          id: 'expenses',
          labelKey: 'navExpenses',
          customLabel: language === 'ar' ? 'المصروفات' : 'Expenses',
          icon: Wallet
        },
        {
          id: 'reports',
          labelKey: 'navReports',
          customLabel: language === 'ar' ? 'التقارير والأرباح' : 'Reports',
          icon: TrendingUp
        }
      ]
    },
    {
      title: language === 'ar' ? 'الإدارة والنظام' : 'System & Admin',
      items: [
        {
          id: 'ai',
          labelKey: 'navAI',
          icon: Sparkles
        },
        {
          id: 'staff',
          labelKey: 'navStaff',
          customLabel: language === 'ar' ? 'طاقم العمل' : 'Staff',
          icon: UserCog
        },
        {
          id: 'devices',
          labelKey: 'navDevices',
          customLabel: language === 'ar' ? 'مركز الأجهزة والأكواد' : 'Devices Hub',
          icon: Radio,
          badge: onlineDevicesCount > 0 ? onlineDevicesCount : undefined
        },
        {
          id: 'devices_status',
          labelKey: 'navDevices',
          customLabel: language === 'ar' ? 'حالة الأجهزة المرتبطة' : 'Devices Status',
          icon: Activity,
          badge: visibleDevices.length > 0 ? visibleDevices.length : undefined
        },
        {
          id: 'settings',
          labelKey: 'navSettings',
          icon: Settings
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
    <aside className="app-sidebar hidden lg:flex flex-col w-60 material-sidebar shrink-0 select-none z-20 transition-colors">
      {/* Navigation Sections (Apple macOS / iPadOS Sidebar Style) */}
      <div className="flex-1 py-3.5 px-3 space-y-4 overflow-y-auto">
        {navSections
          .map(sec => ({
            ...sec,
            items: sec.items.filter(item => canAccessTab(item.id, currentUser.role))
          }))
          .filter(sec => sec.items.length > 0)
          .map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              <div className="px-2.5 py-0.5 text-[11px] font-bold text-slate-400 dark:text-slate-500">
                <span>{section.title}</span>
              </div>

              <div className="space-y-0.5">
                {section.items.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  const itemLabel = item.customLabel || t(item.labelKey as any);

                  return (
                    <button
                      key={item.id}
                      id={`sidebar-tab-${item.id}`}
                      type="button"
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer btn-tactile ${
                        isActive
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-xs font-black'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-white/[0.06] hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white dark:text-slate-950' : 'text-slate-400 dark:text-slate-500'}`} />
                        <span className="truncate">{itemLabel}</span>
                      </div>

                      {item.badge !== undefined && (
                        <span
                          className={`text-[10px] font-mono tabular-nums font-bold px-1.5 py-0.2 rounded-md shrink-0 ${
                            isActive
                              ? 'bg-white/20 dark:bg-slate-900/15 text-white dark:text-slate-950'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
      </div>

      {/* Quiet Single-Line Cloud Sync Footer */}
      <div className="px-4 py-3 border-t border-slate-200/60 dark:border-white/[0.06] flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5 truncate">
          <Cloud className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">
            {isGoogleDriveConnected
              ? (language === 'ar' ? 'السحابة متصلة' : 'Cloud Connected')
              : (language === 'ar' ? 'تخزين محلي آمن' : 'Local Storage')}
          </span>
        </div>
        <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 shrink-0">
          {language === 'ar' ? 'نشط' : 'Active'}
        </span>
      </div>
    </aside>
  );
};
