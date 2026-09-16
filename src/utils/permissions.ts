import { UserRole, ActiveTab } from '../types';

export interface RoleInfo {
  role: UserRole;
  labelAr: string;
  labelEn: string;
  badgeLabel: string;
  descriptionAr: string;
  badgeColor: string;
  textColor: string;
  accentColor: string;
  level: number; // 1: Cashier, 2: Supervisor, 3: Manager/Admin/Owner
}

export type PermissionAction =
  | 'view_dashboard'
  | 'view_net_profit'
  | 'view_reports'
  | 'manage_staff'
  | 'system_settings'
  | 'cloud_backup'
  | 'export_data'
  | 'manage_expenses'
  | 'manage_debts'
  | 'manage_inventory'
  | 'manage_products'
  | 'manage_wholesale'
  | 'view_ai_advisor'
  | 'apply_custom_discount'
  | 'delete_invoice'
  | 'approve_returns'
  | 'pos_sale'
  | 'view_invoices'
  | 'view_customers';

export const ROLE_INFO_MAP: Record<UserRole, RoleInfo> = {
  owner: {
    role: 'owner',
    labelAr: 'مالك النظام (Owner)',
    labelEn: 'System Owner',
    badgeLabel: 'مالك النظام',
    descriptionAr: 'تحكم كامل وشامل في كافة خصائص وميزانيات وحسابات وإعدادات النظام',
    badgeColor: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
    textColor: 'text-amber-600 dark:text-amber-400',
    accentColor: '#F59E0B',
    level: 3,
  },
  admin: {
    role: 'admin',
    labelAr: 'مدير النظام (Admin)',
    labelEn: 'Administrator',
    badgeLabel: 'مدير النظام',
    descriptionAr: 'صلاحيات إدارة كاملة ومطلقة للتقارير والأرباح والموظفين والإعدادات',
    badgeColor: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30',
    textColor: 'text-purple-600 dark:text-purple-400',
    accentColor: '#8B5CF6',
    level: 3,
  },
  manager: {
    role: 'manager',
    labelAr: 'مدير فرع (Manager)',
    labelEn: 'Branch Manager',
    badgeLabel: 'مدير',
    descriptionAr: 'إدارة شاملة للمبيعات، الأرباح الصافية، التقارير المالية، الموظفين، والمصاريف',
    badgeColor: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30',
    textColor: 'text-purple-600 dark:text-purple-400',
    accentColor: '#A855F7',
    level: 3,
  },
  supervisor: {
    role: 'supervisor',
    labelAr: 'مشرف وردية (Supervisor)',
    labelEn: 'Shift Supervisor',
    badgeLabel: 'مشرف',
    descriptionAr: 'إشراف على حركة المبيعات، المستودعات، الديون، المرتجعات، وتعديل الأسعار والمصاريف اليومية، دون الإعدادات الحساسة وحسابات الأرباح التراكمية',
    badgeColor: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
    textColor: 'text-indigo-600 dark:text-indigo-400',
    accentColor: '#6366F1',
    level: 2,
  },
  cashier: {
    role: 'cashier',
    labelAr: 'كاشير مبيعات (Cashier)',
    labelEn: 'Cashier',
    badgeLabel: 'كاشير',
    descriptionAr: 'نقطة البيع (POS)، فواتير الزبائن، والبحث عن المنتجات، مع حجب لوحة التحكم المالية والتقارير والإعدادات',
    badgeColor: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    accentColor: '#10B981',
    level: 1,
  },
  inventory: {
    role: 'inventory',
    labelAr: 'أمين مستودع (Inventory)',
    labelEn: 'Inventory Clerk',
    badgeLabel: 'مستودع',
    descriptionAr: 'متابعة حركة المخزون، الجرد الدوري، وسيارات التوزيع',
    badgeColor: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
    textColor: 'text-blue-600 dark:text-blue-400',
    accentColor: '#3B82F6',
    level: 1,
  },
  accountant: {
    role: 'accountant',
    labelAr: 'محاسب مالي (Accountant)',
    labelEn: 'Accountant',
    badgeLabel: 'محاسب',
    descriptionAr: 'تدقيق القيود المحاسبية، التقارير المالية، المصاريف، وسندات الديون',
    badgeColor: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',
    textColor: 'text-cyan-600 dark:text-cyan-400',
    accentColor: '#06B6D4',
    level: 2,
  },
};

export function getRoleInfo(role: UserRole): RoleInfo {
  return ROLE_INFO_MAP[role] || ROLE_INFO_MAP.cashier;
}

/**
 * Validates if the specified role can navigate to or access a particular active tab.
 */
export function canAccessTab(tab: ActiveTab, role: UserRole): boolean {
  // Owner, Admin, Manager have access to all tabs
  if (role === 'owner' || role === 'admin' || role === 'manager') {
    return true;
  }

  // Supervisor has access to operational tabs, but NOT sensitive system settings or staff accounts management
  if (role === 'supervisor') {
    const restrictedForSupervisor: ActiveTab[] = ['settings', 'staff', 'reports'];
    return !restrictedForSupervisor.includes(tab);
  }

  // Cashier is restricted to POS, Invoices viewing, Customers, Returns, Devices & About
  if (role === 'cashier') {
    const allowedForCashier: ActiveTab[] = ['pos', 'invoices', 'customers', 'returns', 'devices', 'about'];
    return allowedForCashier.includes(tab);
  }

  // Inventory Specialist
  if (role === 'inventory') {
    const allowedForInventory: ActiveTab[] = ['inventory', 'products', 'trade', 'devices', 'about'];
    return allowedForInventory.includes(tab);
  }

  // Accountant
  if (role === 'accountant') {
    const allowedForAccountant: ActiveTab[] = ['dashboard', 'reports', 'expenses', 'debts', 'invoices', 'about'];
    return allowedForAccountant.includes(tab);
  }

  return false;
}

/**
 * Validates granular action permissions based on the user's role.
 */
export function hasActionPermission(action: PermissionAction, role: UserRole): boolean {
  // Master Admins / Owners / Managers can execute all actions
  if (role === 'owner' || role === 'admin' || role === 'manager') {
    return true;
  }

  switch (action) {
    case 'view_dashboard':
      return role === 'supervisor' || role === 'accountant';

    case 'view_net_profit':
      // Hidden from Cashiers & Supervisors; only Managers/Admins/Owners & Accountants
      return role === 'accountant';

    case 'view_reports':
      return role === 'accountant';

    case 'manage_staff':
    case 'system_settings':
    case 'cloud_backup':
    case 'delete_invoice':
      // Strictly restricted to Manager / Admin / Owner
      return false;

    case 'manage_expenses':
    case 'manage_debts':
      return role === 'supervisor' || role === 'accountant';

    case 'manage_inventory':
    case 'manage_products':
      return role === 'supervisor' || role === 'inventory';

    case 'manage_wholesale':
    case 'view_ai_advisor':
    case 'apply_custom_discount':
    case 'approve_returns':
      return role === 'supervisor';

    case 'pos_sale':
    case 'view_invoices':
    case 'view_customers':
      return true;

    case 'export_data':
      return role === 'supervisor' || role === 'accountant';

    default:
      return false;
  }
}

/**
 * Visual matrix of permissions by primary roles (كاشير، مشرف، مدير)
 */
export interface MatrixFeatureItem {
  id: string;
  nameAr: string;
  category: string;
  cashier: boolean;
  supervisor: boolean;
  manager: boolean;
  tooltipAr?: string;
}

export const PERMISSIONS_MATRIX_DATA: MatrixFeatureItem[] = [
  {
    id: 'pos',
    nameAr: 'نقطة البيع وإصدار الفواتير (POS Sales)',
    category: 'المبيعات ونقاط البيع',
    cashier: true,
    supervisor: true,
    manager: true,
    tooltipAr: 'البيع المباشر، اختيار المنتجات، وقبول المدفوعات',
  },
  {
    id: 'view_invoices',
    nameAr: 'معاينة أرشيف الفواتير وإعادة الطباعة',
    category: 'المبيعات ونقاط البيع',
    cashier: true,
    supervisor: true,
    manager: true,
    tooltipAr: 'الاطلاع على فواتير الوردية وإعادة طباعة الإيصالات',
  },
  {
    id: 'returns',
    nameAr: 'تسجيل وقبول المرتجعات المالية',
    category: 'المبيعات ونقاط البيع',
    cashier: true,
    supervisor: true,
    manager: true,
    tooltipAr: 'إرجاع البضاعة واسترداد المبالغ النقدية',
  },
  {
    id: 'high_discounts',
    nameAr: 'منح خصومات إضافية خاصة (تجاوز السقف)',
    category: 'المبيعات ونقاط البيع',
    cashier: false,
    supervisor: true,
    manager: true,
    tooltipAr: 'منح خصم استثنائي يتطلب موافقة مشرف أو مدير',
  },
  {
    id: 'dashboard',
    nameAr: 'لوحة التحكم والمؤشرات اليومية (Dashboard)',
    category: 'الإدارة والتحليلات',
    cashier: false,
    supervisor: true,
    manager: true,
    tooltipAr: 'مؤشرات حركة البيع اليومية والإحصائيات العامة',
  },
  {
    id: 'net_profit',
    nameAr: 'الاطلاع على الأرباح الصافية وهامش الربح الحساس',
    category: 'الإدارة والتحليلات',
    cashier: false,
    supervisor: false,
    manager: true,
    tooltipAr: 'أرقام الأرباح الصافية بعد خصم تكلفة البضاعة والمصاريف',
  },
  {
    id: 'reports',
    nameAr: 'التقارير المالية المفصلة وحساب الأرباح التراكمية',
    category: 'الإدارة والتحليلات',
    cashier: false,
    supervisor: false,
    manager: true,
    tooltipAr: 'تقارير الإيرادات الشاملة والمقارنات المالية',
  },
  {
    id: 'ai_advisor',
    nameAr: 'مستشار الذكاء الاصطناعي والتنبؤات (AI Hub)',
    category: 'الإدارة والتحليلات',
    cashier: false,
    supervisor: true,
    manager: true,
    tooltipAr: 'تحليلات ذكية وتوليد توصيات تسعير وحملات',
  },
  {
    id: 'products_edit',
    nameAr: 'إدارة المنتجات وتعديل أسعار البيع والتكلفة',
    category: 'المخزون والمنتجات',
    cashier: false,
    supervisor: true,
    manager: true,
    tooltipAr: 'إضافة منتجات، تعديل الأسعار، وإدخال التكلفة',
  },
  {
    id: 'inventory_trade',
    nameAr: 'إدارة مستودعات الجملة وسيارات التوزيع',
    category: 'المخزون والمنتجات',
    cashier: false,
    supervisor: true,
    manager: true,
    tooltipAr: 'تحويل المخزون ومراقبة حمولة السيارات والتوزيع',
  },
  {
    id: 'debts_customers',
    nameAr: 'إدارة ديون الزبائن والموردين وسندات القبض',
    category: 'الديون والموردين',
    cashier: false,
    supervisor: true,
    manager: true,
    tooltipAr: 'تسجيل دفعات الديون وسندات القبض وإشعارات واتساب',
  },
  {
    id: 'expenses',
    nameAr: 'تسجيل واعتماد المصاريف اليومية والتشغيلية',
    category: 'المحاسبة والعمليات',
    cashier: false,
    supervisor: true,
    manager: true,
    tooltipAr: 'فواتير الكهرباء، المولدات، والمصروفات النثرية',
  },
  {
    id: 'staff_mgmt',
    nameAr: 'إدارة الموظفين، الصلاحيات، ورموز الدخول PIN',
    category: 'الأمان والنظام',
    cashier: false,
    supervisor: false,
    manager: true,
    tooltipAr: 'إضافة كاشيرات ومشرفين وتعيين الرموز السرية',
  },
  {
    id: 'audit_log',
    nameAr: 'الاطلاع على سجل الرقابة والأمان (Audit Log)',
    category: 'الأمان والنظام',
    cashier: false,
    supervisor: false,
    manager: true,
    tooltipAr: 'سجل العمليات الحساسة وتتبع الأنشطة بدقة',
  },
  {
    id: 'settings_backup',
    nameAr: 'إعدادات النظام، العملات، والنسخ السحابي Google Drive',
    category: 'الأمان والنظام',
    cashier: false,
    supervisor: false,
    manager: true,
    tooltipAr: 'إعدادات المتجر العامة، النسخ الاحتياطي، وإعدادات الواتساب',
  },
];
