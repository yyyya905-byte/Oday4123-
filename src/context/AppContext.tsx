import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  Product,
  Category,
  Customer,
  Supplier,
  DebtTransaction,
  DebtPartyType,
  DebtTransactionType,
  Sale,
  Refund,
  InventoryTransaction,
  Expense,
  AuditLog,
  User,
  UserRole,
  GoogleAuthUser,
  StoreSettings,
  ActiveTab,
  CartItem,
  BusinessMode,
  DiningType,
  LinkedDevice,
  KitchenOrder,
  KitchenOrderItem,
  DeviceRole,
  DeviceWorkPermissions,
  StockMovementType,
  WholesaleWarehouse,
  DeliveryVehicle,
  VehicleLoadingManifest,
  VehicleStatus,
  WarehouseStockTransfer,
  CurrencyConfig,
  ExchangeRateBulletin,
  ThemeMode,
  BatteryInfo,
  SavedSyncPartner,
  LicenseInfo,
  ButtonLayoutConfig,
  ButtonLayoutPreset,
  ThemeColorPreset,
  CashShift,
  CashShiftTransaction,
  PromotionDeal,
  PromotionType,
  TradeType,
  PaymentMethod,
  QrMenuThemeConfig,
  CustomerFeedbackReview,
  TableServiceRequest,
  RestaurantTableInfo,
} from '../types';
import {
  applyThemeColor,
  getThemeColorConfig,
  THEME_COLOR_PRESETS
} from '../utils/themeColorUtils';
import {
  validateLicenseCode,
  getTrialTimeRemaining,
  getLicenseTimeRemaining,
  calculateSubscriptionExpirationDate,
  markCodeAsUsed,
  isCodeAlreadyUsed,
  getDeviceHardwareInfo,
  getUsedLicenseCodes,
  bindOrTransferLicenseInFirebaseAndServer,
  subscribeToFirebaseLicenseBinding,
  formatCodeUsageTimestampAr,
  isApprovedActiveLicenseCode,
  isCancelledLegacyCode,
  purgeLegacyCodesFromLocalAndFirebase,
  LICENSE_POLICY_EPOCH_KEY,
  PREDEFINED_LICENSE_CODES,
  MASTER_ACTIVATION_CODES,
  generateSubscriptionBoundDeviceCode,
  generateUniqueCodeForSingleDevice,
  extractNumericPinFromBoundCode,
  getDefaultWorkPermissionsForRole,
  getDefaultAllowedPagesForRole,
  inferRoleFromDeviceCode,
  SUB_DEVICE_PAGE_LABELS
} from '../utils/licenseUtils';
import {
  initialSettings,
  defaultButtonLayout,
  initialCategories,
  initialProducts,
  initialCustomers,
  initialSuppliers,
  initialDebtTransactions,
  initialUsers,
  initialExpenses,
  initialSales,
  initialAuditLogs,
  initialWholesaleWarehouses,
  initialDeliveryVehicles,
  initialVehicleManifests,
  initialShifts,
  initialPromotions
} from '../data/seedData';
import { translations, Language } from '../i18n/translations';
import { soundEffects } from '../services/audio';
import { defaultExchangeBulletin, formatSecondaryCurrency as formatSecondaryCurrencyUtil, convertBaseToForeign as convertBaseToForeignUtil, fetchLiveSyrianLiraRates } from '../utils/currencyUtils';
import { normalizeArabicDigits } from '../utils/barcodeUtils';
import {
  buildDebtInvoiceMessage,
  sendWhatsAppDebtMessage,
  checkAndSendPeriodicDebtReminders
} from '../services/debtCollectionService';
import {
  indexedDbService,
  downloadJsonBackup,
  IndexedDbBackupSnapshot,
  AutoBackupTriggerType,
} from '../services/indexedDbService';
import { googleAuthService } from '../services/googleAuthService';
import { canAccessTab, hasActionPermission, getRoleInfo } from '../utils/permissions';


export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
  category?: 'improvement' | 'feature' | 'system_update' | 'alert';
  badge?: string;
  isPermanent?: boolean;
}

export const SYSTEM_IMPROVEMENTS_CHANGELOG: AppNotification[] = [
  {
    id: 'upd_battery_power_indicator',
    title: '🔋 مؤشر شحن البطارية وحالة الطاقة في شريط الرأس',
    message: 'إضافة مؤشر ذكي في شريط الرأس يعرض نسبة الشحن بدقة ويتغير لونه ديناميكياً وفق حالة الطاقة (أخضر للشحن ⚡، أصفر لتوفير الطاقة 🌿، أحمر للشحن الحرج 🚨) مع تكامل مباشر مع وضع التوفير والحماية التلقائية عند انخفاض الشحن إلى 20%.',
    type: 'success',
    timestamp: '2026-09-26T13:58:00Z',
    read: false,
    category: 'feature',
    badge: 'جديد ✨',
    isPermanent: true
  },
  {
    id: 'upd_lebanese_currency_dual',
    title: '🇱🇧 خيار العملة اللبنانية (LBP — ل.ل) والدفع المزدوج',
    message: 'دعم شامل لليرة اللبنانية كعملة أساسية للنظام، مع نشرة أسعار الصرف الرسمية وسوق بيروت (1$ = 89,500 ل.ل)، وفئات نقدية سريعة من 50 ألف إلى 2 مليون، ومساعد الدفع النقدي بالدولار واحتساب الباقي بالدولار والليرة.',
    type: 'info',
    timestamp: '2026-09-26T08:35:00Z',
    read: false,
    category: 'feature',
    badge: 'ميزة جديدة 🇱🇧',
    isPermanent: true
  },
  {
    id: 'upd_receipt_customizer_panel',
    title: '🧾 لوحة تخصيص شكل الفاتورة والإيصال مع معاينة حية',
    message: 'لوحة تفاعلية متطورة تمكنك من تخصيص شكل الإيصال والتحكم بظهور شعار المتجر، الرقم الضريبي، ملاحظات الزبون، ورسالة التذييل وتنسيقات الورق الحراري (80mm/58mm) مع معاينة فورية ومباشرة.',
    type: 'success',
    timestamp: '2026-09-25T07:50:00Z',
    read: false,
    category: 'feature',
    badge: 'تحديث رئيسي 🧾',
    isPermanent: true
  },
  {
    id: 'upd_visual_materials_redesign',
    title: '🎨 إعادة تصميم الواجهة بنظام المواد البصرية (Apple Semantic Materials)',
    message: 'تطبيق تأثيرات الزجاج والبلور الذكي وخلفيات NSVisualEffectView التي تتكيف تلقائياً مع الإضاءة والوضع الليلي/النهاري، مع انضباط طباعي مريح للعين (Zero-Pill Discipline) وردود فعل لمسية سريعة.',
    type: 'info',
    timestamp: '2026-09-25T07:45:00Z',
    read: false,
    category: 'system_update',
    badge: 'تصميم مطوّر 🎨',
    isPermanent: true
  },
  {
    id: 'upd_live_exchange_bulletin',
    title: '💱 شريط نشرة الصرف الحي وأسعار العملات والذهب',
    message: 'شريط تداول مباشر في أعلى الشاشة لمتابعة أسعار صرف الدولار واليورو وغرام الذهب 21 لحظياً من مصادر دمشق وبيروت والبنك المركزي مع تحديث فوري.',
    type: 'info',
    timestamp: '2026-09-24T12:00:00Z',
    read: true,
    category: 'feature',
    badge: 'أسعار الصرف 💱',
    isPermanent: true
  },
  {
    id: 'upd_whatsapp_debt_automation',
    title: '💬 أتمتة تذكيرات ديون العملاء عبر WhatsApp',
    message: 'إرسال كشوف الحسابات وتذكيرات السداد التلقائية للعملاء بروابط واتساب مباشرة مع إظهار المعادل بالدولار الأمريكي وفق سعر الصرف اليومي.',
    type: 'success',
    timestamp: '2026-09-24T10:00:00Z',
    read: true,
    category: 'feature',
    badge: 'أتمتة ذكية 💬',
    isPermanent: true
  },
  {
    id: 'upd_google_drive_cloud_backup',
    title: '☁️ النسخ الاحتياطي السحابي في Google Drive',
    message: 'حفظ وأرشفة قاعدة بيانات المتجر والنسخ الاحتياطية في حساب Google Drive بأمان تام وبنقرة واحدة مع استرجاع لحظي في أي وقت.',
    type: 'info',
    timestamp: '2026-09-24T09:00:00Z',
    read: true,
    category: 'system_update',
    badge: 'سحابي وآمن ☁️',
    isPermanent: true
  }
];

interface AppContextType {
  // Localization & Theme
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: (keyof typeof translations['ar']) | (string & {}), params?: Record<string, string | number>) => string;
  dir: 'rtl' | 'ltr';
  theme: 'light' | 'dark';
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  isNightTime: boolean;
  nightModeStartHour: number;
  nightModeEndHour: number;

  // Power Saving & Battery Saver (Eco Mode)
  isPowerSavingActive: boolean;
  isPowerSavingStandby: boolean;
  togglePowerSaving: () => void;
  setPowerSavingActive: (active: boolean) => void;
  wakeFromStandby: () => void;
  batteryInfo: BatteryInfo;
  updateBatteryInfo: (info: Partial<BatteryInfo>) => void;

  // Business Operating Mode (Restaurant / Wholesale / Retail)
  businessMode: BusinessMode;
  setBusinessMode: (mode: BusinessMode, remember?: boolean) => void;
  isModeModalOpen: boolean;
  setIsModeModalOpen: (open: boolean) => void;

  // Restaurant & Cafe Options
  restaurantDiningType: DiningType;
  setRestaurantDiningType: (type: DiningType) => void;
  selectedTable: string;
  setSelectedTable: (table: string) => void;
  guestCount: number;
  setGuestCount: (count: number) => void;
  kitchenNote: string;
  setKitchenNote: (note: string) => void;
  updateCartItemKitchenNotes: (productId: string, notes: string) => void;

  // Active View & Modal State
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selectedReturnInvoice: Sale | null;
  setSelectedReturnInvoice: (sale: Sale | null) => void;
  navigateToReturnWithInvoice: (sale: Sale) => void;
  isOnline: boolean;
  isQuickSaleOpen: boolean;
  setIsQuickSaleOpen: (open: boolean) => void;
  isGlobalSearchOpen: boolean;
  setIsGlobalSearchOpen: (open: boolean) => void;
  isSearchModalOpen: boolean;
  setIsSearchModalOpen: (open: boolean) => void;
  isPinModalOpen: boolean;
  setIsPinModalOpen: (open: boolean) => void;
  isIdleLocked: boolean;
  setIsIdleLocked: (locked: boolean) => void;

  // Mandatory First-Time Login & 1-Week Guest Trial Mode & Purchase Activation
  isFirstLoginCompleted: boolean;
  isFirstLoginModalOpen: boolean;
  setIsFirstLoginModalOpen: (open: boolean) => void;
  completeFirstLogin: (userData?: Partial<User>) => void;
  isAppPurchased: boolean;
  licenseKey: string;
  licenseExpiresAt: string | null;
  licenseRemainingDays: number;
  licenseRemainingHours: number;
  isLicenseExpired: boolean;
  licenseDurationLabel: string;
  isLifetimeLicense: boolean;
  trialStartDate: string;
  trialDaysRemaining: number;
  trialHoursRemaining: number;
  isTrialExpired: boolean;
  isPurchaseModalOpen: boolean;
  setIsPurchaseModalOpen: (open: boolean) => void;
  activatePurchaseCode: (
    code: string,
    customerInfo?: {
      name?: string;
      phone?: string;
      customExpiresAtIso?: string;
      allowTransfer?: boolean;
      previousDeviceIdToRevoke?: string | null;
      targetDeviceId?: string;
      targetDeviceFingerprint?: string;
      targetDeviceName?: string;
    }
  ) => { success: boolean; message: string; newExpiresAt?: string; usedAt?: string };
  revokeCurrentDeviceSubscription: (reasonAr?: string) => void;

  // Authentication & Staff
  currentUser: User;
  setCurrentUser: (user: User) => void;
  users: User[];
  loginWithPin: (pin: string) => boolean;
  hasPermission: (action: string) => boolean;
  addStaff: (user: Omit<User, 'id' | 'createdAt'>) => void;
  updateStaff: (id: string, user: Partial<User>) => void;
  deleteStaff: (id: string) => void;
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => void;
  updateUser: (id: string, user: Partial<User>) => void;
  deleteUser: (id: string) => void;

  // Google Authentication
  googleUser: GoogleAuthUser | null;
  isGoogleSignedIn: boolean;
  isGoogleAuthLoading: boolean;
  signInWithGoogle: (options?: { hintEmail?: string; role?: UserRole; forceFallback?: boolean }) => Promise<boolean>;
  signOutGoogle: () => void;

  // Store Settings & Currency
  settings: StoreSettings;
  storeSettings: StoreSettings;
  updateSettings: (newSettings: Partial<StoreSettings>) => void;
  formatCurrency: (amount: number) => string;
  formatSecondaryCurrency: (amount: number, target?: 'USD' | 'EUR' | 'LBP' | 'SYP', rateType?: 'buy' | 'sell') => string;
  changeBaseCurrency: (newCurrency: CurrencyConfig, conversionRate?: number, convertPricesAndInvoices?: boolean) => void;
  updateExchangeBulletin: (bulletin: Partial<ExchangeRateBulletin>) => void;
  convertBaseToForeign: (amount: number, targetCurrency: 'USD' | 'EUR', rateType?: 'buy' | 'sell') => number;
  convertForeignToBase: (amount: number, sourceCurrency: 'USD' | 'EUR', rateType?: 'buy' | 'sell') => number;

  // Button Layout & UI Position Customizer
  isButtonCustomizerModalOpen: boolean;
  setIsButtonCustomizerModalOpen: (open: boolean) => void;
  updateButtonLayout: (layout: Partial<ButtonLayoutConfig>) => void;
  resetButtonLayout: () => void;
  applyButtonLayoutPreset: (preset: ButtonLayoutPreset) => void;

  // Theme Color & Store Brand Identity
  activeThemeColor: ThemeColorPreset;
  activePrimaryHex: string;
  setThemeColor: (color: ThemeColorPreset, customHex?: string) => void;

  // Products & Categories
  products: Product[];
  categories: Category[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Product;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  duplicateProduct: (id: string) => void;
  toggleFavorite: (id: string) => void;
  addCategory: (category: Omit<Category, 'id'>) => Category;
  updateCategory: (id: string, category: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  applyBulkWholesaleMargin: (discountPercent: number, categoryId?: string) => void;

  // POS Cart State & Trade Mode
  posTradeMode: 'retail' | 'wholesale';
  setPosTradeMode: (mode: 'retail' | 'wholesale') => void;
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number, forceWholesale?: boolean) => void;
  toggleCartItemTradeMode: (productId: string) => void;
  updateCartItemQuantity: (productId: string, quantity: number) => void;
  updateCartItemDiscount: (productId: string, discount: number, discountType: 'percentage' | 'fixed') => void;
  updateCartItemPrice: (productId: string, newPrice: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  selectedCustomer: Customer | null;
  setSelectedCustomer: (customer: Customer | null) => void;
  orderDiscount: { value: number; type: 'percentage' | 'fixed' };
  setOrderDiscount: (discount: { value: number; type: 'percentage' | 'fixed' }) => void;
  pointsToRedeem: number;
  setPointsToRedeem: (points: number) => void;
  
  // Sales & Checkouts
  sales: Sale[];
  processSale: (saleData: {
    paymentMethod: string;
    paidAmount: number;
    notes?: string;
    appliedPromotion?: { promoId: string; title: string };
  }) => Sale | null;

  // Refunds & Returns
  refunds: Refund[];
  returns: any[];
  processRefund: (refundData: {
    originalSaleId: string;
    invoiceNumber: string;
    items: { productId: string; quantity: number; unitPrice: number; total: number; productName: string }[];
    totalRefundAmount: number;
    reason: string;
    restock: boolean;
    refundMethod?: string;
  }) => Refund | null;
  processReturn: (returnData: any) => any;

  // Customers & Loyalty
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id' | 'customerCode' | 'totalSpent' | 'visitCount' | 'points' | 'createdAt' | 'qrData'>) => Customer;
  updateCustomer: (id: string, customer: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  adjustCustomerPoints: (customerId: string, pointsDelta: number, type: 'earn' | 'redeem' | 'adjust', note: string) => void;
  findCustomerByCodeOrPhone: (query: string) => Customer | undefined;

  // Suppliers & Debt Accounts (ديون الزبائن والموردين)
  suppliers: Supplier[];
  debtTransactions: DebtTransaction[];
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt'>) => Supplier;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  recordCustomerDebtPayment: (customerId: string, amount: number, paymentMethod?: 'cash' | 'card' | 'transfer' | 'check', notes?: string, discountAmount?: number) => DebtTransaction | null;
  addCustomerManualDebt: (customerId: string, amount: number, referenceInvoice?: string, notes?: string) => DebtTransaction | null;
  recordSupplierDebtPayment: (supplierId: string, amount: number, paymentMethod?: 'cash' | 'card' | 'transfer' | 'check', notes?: string, discountAmount?: number) => DebtTransaction | null;
  addSupplierInvoiceDebt: (supplierId: string, amount: number, referenceInvoice?: string, notes?: string) => DebtTransaction | null;
  recordSupplierPurchaseInvoice: (payload: {
    supplierMode: 'existing' | 'new';
    supplierId?: string;
    newSupplierName?: string;
    newSupplierCompany?: string;
    newSupplierPhone?: string;
    newSupplierCategory?: string;
    referenceInvoice?: string;
    paymentType: 'credit' | 'cash' | 'partial';
    paidAmount: number;
    paymentMethod?: 'cash' | 'card' | 'transfer' | 'check';
    notes?: string;
    items: {
      mode: 'existing' | 'new';
      productId?: string;
      productName: string;
      categoryId?: string;
      barcode?: string;
      unit?: string;
      quantity: number;
      costPrice: number;
      wholesalePrice: number;
      retailPrice: number;
      minStock?: number;
    }[];
    manualTotalAmount?: number;
  }) => { supplier: Supplier; totalAmount: number; remainingDebt: number; updatedProductsCount: number } | null;

  // Inventory
  inventoryLogs: InventoryTransaction[];
  stockMovements: InventoryTransaction[];
  adjustStock: (productId: string, quantityDeltaOrType: number | StockMovementType, typeOrDelta?: StockMovementType | number, reason?: string) => void;

  // Expenses
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt' | 'recordedBy'>) => void;
  deleteExpense: (id: string) => void;

  // Audit Logs
  auditLogs: AuditLog[];
  logAudit: (action: string, details: string, severity?: 'low' | 'medium' | 'high' | 'critical', previousData?: string, newData?: string) => void;

  // Notifications
  notifications: AppNotification[];
  notify: (title: string, message: string, type?: 'success' | 'info' | 'warning' | 'error', category?: 'improvement' | 'feature' | 'system_update' | 'alert', badge?: string) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearAllNotifications: () => void;

  // Multi-Device Linking & Terminals Hub (الجهاز الرئيسي والأجهزة التابعة)
  devices: LinkedDevice[];
  kitchenOrders: KitchenOrder[];
  masterPairingPin: string;
  subscriptionBoundLinkCode: string;
  isMasterDevice: boolean;
  currentDeviceId: string;
  currentDeviceName: string;
  currentDeviceRole: DeviceRole;
  currentDeviceWorkPermissions: DeviceWorkPermissions;
  currentDeviceAllowedPages: ActiveTab[] | null;
  currentSubDeviceUserName: string;
  activateSubDevicePreview: (device: LinkedDevice) => void;
  exitSubDeviceMode: () => void;
  isPairingModalOpen: boolean;
  setIsPairingModalOpen: (open: boolean) => void;
  refreshDevices: () => Promise<void>;
  pairDevice: (deviceData: {
    name: string;
    role: DeviceRole;
    roleLabelAr?: string;
    workDescription?: string;
    workPermissions?: DeviceWorkPermissions;
    pairingCode: string;
    subscriptionLinkCode?: string;
    uniqueDeviceCode?: string;
    deviceType: 'desktop' | 'tablet' | 'mobile';
    cashierName?: string;
    connectedUserName?: string;
    branchName?: string;
    registerAsCurrentSubDevice?: boolean;
  }) => Promise<{ success: boolean; error?: string; device?: LinkedDevice }>;
  updateSubDeviceRoleAndWork: (
    deviceId: string,
    updates: {
      name?: string;
      role?: DeviceRole;
      roleLabelAr?: string;
      workDescription?: string;
      workPermissions?: DeviceWorkPermissions;
      cashierName?: string;
      connectedUserName?: string;
      uniqueDeviceCode?: string;
      pairingCode?: string;
    }
  ) => Promise<void>;
  simulateSubDeviceSale: (targetDevice: LinkedDevice) => Promise<Sale | null>;
  disconnectDevice: (deviceId: string) => Promise<void>;
  unpairDevice: (deviceId: string) => Promise<void>;
  regenerateSingleDeviceCode: (deviceId: string) => Promise<string>;
  refreshMasterPin: () => Promise<string>;
  addKitchenOrder: (order: Omit<KitchenOrder, 'id' | 'createdAt'>) => void;
  updateKitchenItemStatus: (orderId: string, itemId: string, status: 'pending' | 'cooking' | 'ready' | 'served') => void;
  syncAllDevices: () => Promise<void>;
  sendRemoteBarcodeScan: (barcode: string, quantity?: number, deviceName?: string) => Promise<{ success: boolean }>;
  pingDevice: (deviceId: string) => Promise<void>;
  dedicatedDeviceRole: DeviceRole | null;
  setDedicatedDeviceRole: (role: DeviceRole | null) => void;
  isConnectToCashierModalOpen: boolean;
  setIsConnectToCashierModalOpen: (open: boolean) => void;
  liveRemoteCart: {
    items: CartItem[];
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
    customerName: string;
    pointsEarned: number;
    updatedAt?: string;
  } | null;
  verifyCashierPin: (pin: string) => Promise<{ valid: boolean; error?: string }>;

  // Cross-Device Data Transfer & Offline Sync
  isDataTransferModalOpen: boolean;
  setIsDataTransferModalOpen: (open: boolean) => void;
  offlineQueueCount: number;
  isSyncingOffline: boolean;
  syncOfflineQueueNow: () => Promise<void>;
  refreshOfflineQueueCount: () => Promise<void>;
  isStorageCleanupModalOpen: boolean;
  setIsStorageCleanupModalOpen: (open: boolean) => void;
  openStorageCleanupModal: () => void;

  // Cash Drawer & Shift Management
  shifts: CashShift[];
  activeShift: CashShift | null;
  isShiftModalOpen: boolean;
  setIsShiftModalOpen: (open: boolean) => void;
  openShiftModal: () => void;
  startNewShift: (openingFloat: number, notes?: string) => CashShift;
  recordShiftCashMovement: (type: 'cash_in' | 'cash_out', amount: number, reason: string) => void;
  closeShift: (actualCash: number, closingNotes?: string, denominationCounts?: Record<string, number>, handoverCashierName?: string) => CashShift;

  // Smart Promotions & Bundle Deals
  promotions: PromotionDeal[];
  isPromotionsModalOpen: boolean;
  setIsPromotionsModalOpen: (open: boolean) => void;
  openPromotionsModal: () => void;
  addPromotion: (promo: Omit<PromotionDeal, 'id' | 'usageCount'>) => PromotionDeal;
  updatePromotion: (id: string, partial: Partial<PromotionDeal>) => void;
  deletePromotion: (id: string) => void;
  togglePromotionActive: (id: string) => void;
  calculateCartPromotions: (cartItems: CartItem[], subtotal: number) => { appliedPromotion: PromotionDeal | null; discountAmount: number; finalTotal: number };

  // Saved Device & Auto-Sync Engine (مزامنة تلقائية وحفظ الأجهزة)
  isSyncingWithPartner: boolean;
  saveSyncPartner: (partner: SavedSyncPartner) => void;
  removeSyncPartner: () => void;
  performPartnerSync: (partnerOverride?: SavedSyncPartner) => Promise<{ success: boolean; message: string }>;

  // Wholesale Warehouses & Transport Fleet Hub
  wholesaleWarehouses: WholesaleWarehouse[];
  deliveryVehicles: DeliveryVehicle[];
  vehicleManifests: VehicleLoadingManifest[];
  addWholesaleWarehouse: (wh: Omit<WholesaleWarehouse, 'id' | 'createdAt'>) => WholesaleWarehouse;
  updateWholesaleWarehouse: (id: string, wh: Partial<WholesaleWarehouse>) => void;
  deleteWholesaleWarehouse: (id: string) => void;
  addDeliveryVehicle: (veh: Omit<DeliveryVehicle, 'id' | 'createdAt'>) => DeliveryVehicle;
  updateDeliveryVehicle: (id: string, veh: Partial<DeliveryVehicle>) => void;
  deleteDeliveryVehicle: (id: string) => void;
  updateVehicleStatus: (vehicleId: string, status: VehicleStatus) => void;
  createVehicleLoadingManifest: (manifestData: Omit<VehicleLoadingManifest, 'id' | 'manifestNumber' | 'loadedAt' | 'status'>) => VehicleLoadingManifest;
  reconcileVehicleManifest: (manifestId: string, reconciliationData: {
    returnedItems: { productId: string; returnedUnits: number; damagedUnits: number; soldUnits: number }[];
    cashCollected: number;
    creditSalesAmount: number;
    reconciliationNotes?: string;
  }) => void;
  transferWarehouseStock: (transferData: Omit<WarehouseStockTransfer, 'id' | 'transferNumber' | 'createdAt' | 'transferredBy'>) => void;

  // Backup & Reset
  exportDatabaseJson: () => string;
  importDatabaseJson: (jsonString: string) => boolean;
  resetToDefaultData: () => void;
  exportDataJson: () => string;
  importDataJson: (jsonString: string) => boolean;
  resetToDemoData: () => void;
  triggerIndexedDbBackupDownload: (options?: {
    triggerType?: AutoBackupTriggerType;
    downloadToDevice?: boolean;
    notes?: string;
  }) => Promise<IndexedDbBackupSnapshot | null>;
  restoreFromIndexedDbBackup: (
    jsonOrSnapshot: string | any,
    mode?: 'replace' | 'merge'
  ) => Promise<boolean>;

  // Restaurant & Cafe Customer QR Menu & Device Routing & Queue Numbering
  isRestaurantQrModalOpen: boolean;
  setIsRestaurantQrModalOpen: (open: boolean) => void;
  isCustomerMenuPreviewOpen: boolean;
  setIsCustomerMenuPreviewOpen: (open: boolean) => void;
  restaurantQueueCounter: number;
  nextRestaurantQueueNumber: number;
  getNextRestaurantQueueNumber: () => number;
  resetRestaurantQueueCounter: (startFrom?: number) => void;
  updateSaleQueueStatus: (saleId: string, queueStatus: 'waiting' | 'preparing' | 'ready' | 'served') => void;
  announceQueueNumber: (queueNumber: number, label?: string) => void;
  loadKitchenOrderToCart: (order: KitchenOrder) => void;
  confirmKitchenOrder: (orderId: string, confirmedBy?: string, status?: KitchenOrder['status']) => void;
  updateKitchenOrderStatus: (orderId: string, status: KitchenOrder['status']) => void;
  transferKitchenOrderTable: (orderId: string, newTableName: string) => void;
  tableServiceRequests: TableServiceRequest[];
  submitTableServiceRequest: (req: Omit<TableServiceRequest, 'id' | 'createdAt' | 'status'>) => Promise<TableServiceRequest>;
  acknowledgeTableServiceRequest: (requestId: string, status?: TableServiceRequest['status']) => void;
  restaurantTables: RestaurantTableInfo[];
  updateRestaurantTables: (tables: RestaurantTableInfo[]) => void;
  updateQrMenuTheme: (themeUpdates: Partial<QrMenuThemeConfig>) => void;
  customerReviews: CustomerFeedbackReview[];
  addCustomerReview: (review: Omit<CustomerFeedbackReview, 'id' | 'createdAt'>) => CustomerFeedbackReview;
  deleteCustomerReview: (id: string) => void;
  clearCustomerReviews: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  LANG: 'kian_pos_lang',
  THEME: 'kian_pos_theme',
  THEME_MODE: 'kian_pos_theme_mode',
  SETTINGS: 'kian_pos_settings',
  PRODUCTS: 'kian_pos_products',
  CATEGORIES: 'kian_pos_categories',
  CUSTOMERS: 'kian_pos_customers',
  SALES: 'kian_pos_sales',
  REFUNDS: 'kian_pos_refunds',
  INVENTORY_LOGS: 'kian_pos_inventory_logs',
  EXPENSES: 'kian_pos_expenses',
  AUDIT_LOGS: 'kian_pos_audit_logs',
  USERS: 'kian_pos_users',
  CURRENT_USER_ID: 'kian_pos_current_user_id',
  BUSINESS_MODE: 'kian_pos_business_mode',
  REMEMBER_BUSINESS_MODE: 'kian_pos_remember_mode',
  WHOLESALE_WAREHOUSES: 'kian_pos_wholesale_warehouses',
  DELIVERY_VEHICLES: 'kian_pos_delivery_vehicles',
  VEHICLE_MANIFESTS: 'kian_pos_vehicle_manifests',
  SUPPLIERS: 'kian_pos_suppliers',
  DEBT_TRANSACTIONS: 'kian_pos_debt_transactions',
  NOTIFICATIONS: 'kian_pos_notifications',
  FIRST_LOGIN_COMPLETED: 'kian_first_login_completed',
  APP_PURCHASED: 'kian_app_purchased',
  LICENSE_KEY: 'kian_license_key',
  LICENSE_EXPIRES_AT: 'kian_pos_license_expires_at',
  LICENSE_TYPE: 'kian_pos_license_type',
  TRIAL_START_DATE: 'kian_trial_start_date',
  PURCHASED_AT: 'kian_purchased_at',
  IS_TRIAL_EXPIRED: 'kian_pos_is_trial_expired',
  CASH_SHIFTS: 'kian_pos_cash_shifts',
  ACTIVE_SHIFT_ID: 'kian_pos_active_shift_id',
  PROMOTIONS: 'kian_pos_promotions',
  ZEROED_OUT: 'kian_pos_zeroed_out',
  INSTALLMENT_PLANS: 'kian_pos_installment_plans_v1',
  DEBT_REMINDER_LOGS: 'kian_pos_debt_reminder_logs_v1',
  CUSTOMER_REVIEWS: 'kian_pos_customer_reviews',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Language & Direction
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LANG);
    return (saved === 'en' || saved === 'ar') ? saved : 'ar';
  });

  const dir = language === 'ar' ? 'rtl' : 'ltr';

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEYS.LANG, lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  };

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const t = (key: (keyof typeof translations['ar']) | (string & {}), params?: Record<string, string | number>): string => {
    let str = (translations[language] as any)?.[key] || (translations['ar'] as any)?.[key] || key;
    if (params) {
      Object.entries(params).forEach(([pKey, pVal]) => {
        str = str.replace(`{${pKey}}`, String(pVal));
      });
    }
    return str;
  };

  // Active View & Modal State
  const [activeTab, setActiveTab] = useState<ActiveTab>('pos');
  const [selectedReturnInvoice, setSelectedReturnInvoice] = useState<Sale | null>(null);

  const navigateToReturnWithInvoice = (sale: Sale) => {
    setSelectedReturnInvoice(sale);
    setActiveTab('returns');
    soundEffects.playClick();
  };

  const [isOnline, setIsOnline] = useState<boolean>(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const [isQuickSaleOpen, setIsQuickSaleOpen] = useState<boolean>(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState<boolean>(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 2. Business Operating Mode (Restaurant / Wholesale / Retail)
  const [businessMode, setBusinessModeState] = useState<BusinessMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BUSINESS_MODE);
    return (saved === 'restaurant' || saved === 'wholesale' || saved === 'retail') ? saved : 'retail';
  });

  const [isModeModalOpen, setIsModeModalOpen] = useState<boolean>(false);

  // Restaurant & Cafe Options
  const [restaurantDiningType, setRestaurantDiningType] = useState<DiningType>('dine_in');
  const [selectedTable, setSelectedTable] = useState<string>('طاولة 1');
  const [guestCount, setGuestCount] = useState<number>(2);
  const [kitchenNote, setKitchenNote] = useState<string>('');
  const [pendingCartQueueNumber, setPendingCartQueueNumber] = useState<number | null>(null);
  const [pendingCartQueueOrderId, setPendingCartQueueOrderId] = useState<string | null>(null);

  const getLocalTodayDateKey = (d: Date = new Date()): string => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const DAILY_QUEUE_DATE_KEY = 'kian_pos_daily_queue_date_v2';
  const DAILY_QUEUE_COUNTER_KEY = 'kian_pos_daily_queue_counter_v2';

  const [restaurantQueueCounter, setRestaurantQueueCounter] = useState<number>(() => {
    try {
      const todayKey = getLocalTodayDateKey();
      const savedDate = localStorage.getItem(DAILY_QUEUE_DATE_KEY);
      const savedCounter = localStorage.getItem(DAILY_QUEUE_COUNTER_KEY);
      if (savedDate === todayKey && savedCounter !== null) {
        const parsed = parseInt(savedCounter, 10);
        if (!isNaN(parsed) && parsed >= 0) return parsed;
      }
      // New day or first initialization: always start counter at 0 so the first invoice of the day is #1 (#001)
      localStorage.setItem(DAILY_QUEUE_DATE_KEY, todayKey);
      localStorage.setItem(DAILY_QUEUE_COUNTER_KEY, '0');
      localStorage.setItem('kian_pos_restaurant_queue_date_v1', todayKey);
      localStorage.setItem('kian_pos_restaurant_queue_counter_v1', '0');
      return 0;
    } catch {
      return 0;
    }
  });

  // Automatically check if a new day has started (e.g. after midnight) and reset counter to 0 so new day starts at #1
  useEffect(() => {
    const checkDailyReset = () => {
      try {
        const todayKey = getLocalTodayDateKey();
        const savedDate = localStorage.getItem(DAILY_QUEUE_DATE_KEY);
        if (savedDate !== todayKey) {
          localStorage.setItem(DAILY_QUEUE_DATE_KEY, todayKey);
          localStorage.setItem(DAILY_QUEUE_COUNTER_KEY, '0');
          localStorage.setItem('kian_pos_restaurant_queue_date_v1', todayKey);
          localStorage.setItem('kian_pos_restaurant_queue_counter_v1', '0');
          setRestaurantQueueCounter(0);
          setPendingCartQueueNumber(null);
          setPendingCartQueueOrderId(null);
        }
      } catch {}
    };
    checkDailyReset();
    const interval = setInterval(checkDailyReset, 30000);
    return () => clearInterval(interval);
  }, []);

  const nextRestaurantQueueNumber = pendingCartQueueNumber || (restaurantQueueCounter + 1);

  const getNextRestaurantQueueNumber = (): number => {
    const todayKey = getLocalTodayDateKey();
    let currentBase = restaurantQueueCounter;
    try {
      const savedDate = localStorage.getItem(DAILY_QUEUE_DATE_KEY);
      if (savedDate !== todayKey) {
        currentBase = 0;
      } else {
        const savedCounter = parseInt(localStorage.getItem(DAILY_QUEUE_COUNTER_KEY) || '0', 10);
        if (!isNaN(savedCounter) && savedCounter > currentBase) {
          currentBase = savedCounter;
        }
      }
    } catch {}

    const nextVal = currentBase + 1;
    setRestaurantQueueCounter(nextVal);
    try {
      localStorage.setItem(DAILY_QUEUE_DATE_KEY, todayKey);
      localStorage.setItem(DAILY_QUEUE_COUNTER_KEY, String(nextVal));
      localStorage.setItem('kian_pos_restaurant_queue_date_v1', todayKey);
      localStorage.setItem('kian_pos_restaurant_queue_counter_v1', String(nextVal));
    } catch {}
    return nextVal;
  };

  const resetRestaurantQueueCounter = (startFrom: number = 0) => {
    const cleanVal = Math.max(0, Math.floor(Number(startFrom) || 0));
    setRestaurantQueueCounter(cleanVal);
    setPendingCartQueueNumber(null);
    setPendingCartQueueOrderId(null);
    try {
      const todayKey = getLocalTodayDateKey();
      localStorage.setItem(DAILY_QUEUE_DATE_KEY, todayKey);
      localStorage.setItem(DAILY_QUEUE_COUNTER_KEY, String(cleanVal));
      localStorage.setItem('kian_pos_restaurant_queue_date_v1', todayKey);
      localStorage.setItem('kian_pos_restaurant_queue_counter_v1', String(cleanVal));
    } catch {}
    fetch('/api/restaurant/reset-queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startFrom: cleanVal }),
    }).catch(() => {});
    soundEffects.playSuccess();
    notify(
      'تم تصفير عداد طابور الفواتير',
      `سيبدأ ترقيم الفواتير والطلبات القادمة في قسم المطعم من رقم الطابور #${String(cleanVal + 1).padStart(3, '0')}`,
      'success'
    );
  };

  const announceQueueNumber = (queueNumber: number, label?: string) => {
    const formattedQ = `#${String(queueNumber).padStart(3, '0')}`;
    soundEffects.saleSuccess();
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(
          `نداء رقم الطابور ${queueNumber}، الفاتورة رقم ${queueNumber} ${label ? `، ${label}` : ''} جاهزة للاستلام`
        );
        utterance.lang = 'ar-SA';
        utterance.rate = 0.95;
        window.speechSynthesis.speak(utterance);
      }
    } catch {}
    notify(
      `🔔 نداء طابور الفواتير: رقم ${formattedQ}`,
      `تم نداء صاحب الفاتورة المرقمة (${formattedQ})${label ? ` — ${label}` : ''} لاستلام الطلب`,
      'info'
    );
  };

  const setBusinessMode = (mode: BusinessMode, remember: boolean = false) => {
    setBusinessModeState(mode);
    if (mode === 'wholesale') {
      setPosTradeMode('wholesale');
    } else {
      setPosTradeMode('retail');
    }
    if (remember) {
      localStorage.setItem(STORAGE_KEYS.BUSINESS_MODE, mode);
      localStorage.setItem(STORAGE_KEYS.REMEMBER_BUSINESS_MODE, 'true');
    }
    setIsModeModalOpen(false);
  };

  // 2. Store Settings
  const [settings, setSettingsState] = useState<StoreSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      const parsed = saved ? JSON.parse(saved) : initialSettings;
      return {
        ...initialSettings,
        ...parsed,
        buttonLayout: {
          ...defaultButtonLayout,
          ...(parsed.buttonLayout || {})
        }
      };
    } catch {
      return initialSettings;
    }
  });

  const nightModeStartHour = settings.nightModeStartHour ?? 18;
  const nightModeEndHour = settings.nightModeEndHour ?? 6;

  // Helper function to determine if current device time falls within night hours
  const checkIsNightTime = (startHour = nightModeStartHour, endHour = nightModeEndHour): boolean => {
    const currentHour = new Date().getHours();
    if (startHour > endHour) {
      // Overnight (e.g. 18:00 - 06:00)
      return currentHour >= startHour || currentHour < endHour;
    }
    return currentHour >= startHour && currentHour < endHour;
  };

  const [isNightTime, setIsNightTime] = useState<boolean>(() => checkIsNightTime());

  // 3. Theme & Cashier Eye Comfort Engine (Manual / Time-Based Auto / System)
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME_MODE);
    if (saved === 'light' || saved === 'dark' || saved === 'auto_time' || saved === 'system') {
      return saved as ThemeMode;
    }
    return settings.themeMode || 'auto_time';
  });

  const computeEffectiveTheme = (
    mode: ThemeMode,
    startHour = nightModeStartHour,
    endHour = nightModeEndHour
  ): 'light' | 'dark' => {
    if (mode === 'dark') return 'dark';
    if (mode === 'light') return 'light';
    if (mode === 'system') {
      if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return 'light';
    }
    // auto_time: night mode automatically activates during evening/night hours for cashier eye comfort
    const night = checkIsNightTime(startHour, endHour);
    return night ? 'dark' : 'light';
  };

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
    const initialMode = (localStorage.getItem(STORAGE_KEYS.THEME_MODE) as ThemeMode) || settings.themeMode || 'auto_time';
    if (initialMode === 'light' || initialMode === 'dark') {
      return initialMode;
    }
    return computeEffectiveTheme(initialMode, nightModeStartHour, nightModeEndHour);
  });

  // Helper to trigger subtle cross-fade animation when switching themes
  const applyThemeWithTransition = (applyFn: () => void) => {
    if (typeof document === 'undefined') {
      applyFn();
      return;
    }

    // Support native View Transitions API if supported by browser
    if ('startViewTransition' in document && typeof (document as any).startViewTransition === 'function') {
      (document as any).startViewTransition(() => {
        applyFn();
      });
      return;
    }

    // Smooth CSS cross-fade transition
    document.documentElement.classList.add('theme-cross-fade');
    applyFn();
    setTimeout(() => {
      document.documentElement.classList.remove('theme-cross-fade');
    }, 450);
  };

  // Function to explicitly set theme mode (Manual Light, Manual Dark, Auto Time, System)
  const setThemeMode = (newMode: ThemeMode) => {
    applyThemeWithTransition(() => {
      setThemeModeState(newMode);
      localStorage.setItem(STORAGE_KEYS.THEME_MODE, newMode);
      const effective = computeEffectiveTheme(newMode, settings.nightModeStartHour, settings.nightModeEndHour);
      setTheme(effective);
      localStorage.setItem(STORAGE_KEYS.THEME, effective);

      // Also persist in settings
      const updated = { ...settings, themeMode: newMode };
      setSettingsState(updated);
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));

      if (effective === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    });

    if (newMode === 'auto_time') {
      const isNight = checkIsNightTime(settings.nightModeStartHour, settings.nightModeEndHour);
      notify(
        'الوضع الليلي التلقائي الذكي',
        isNight
          ? 'تم تفعيل الوضع الليلي تلقائياً لراحة عين الكاشير (ساعات المساء/الليل)'
          : 'الوضع النهاري نشط الآن (سيتحول ليلياً تلقائياً عند حلول المساء)',
        'info'
      );
    } else if (newMode === 'dark') {
      notify('الوضع الليلي', 'تم تفعيل المظهر الداكن يدوياً لراحة العين أثناء العمل', 'info');
    } else if (newMode === 'light') {
      notify('الوضع النهاري', 'تم تفعيل المظهر الفاتح يدوياً', 'info');
    } else if (newMode === 'system') {
      notify('مطابقة نظام التشغيل', 'تم ضبط المظهر ليتطابق تلقائياً مع إعدادات جهازك', 'info');
    }
  };

  // Manual fast toggle (toggles between light and dark)
  const toggleTheme = () => {
    const next: ThemeMode = theme === 'light' ? 'dark' : 'light';
    applyThemeWithTransition(() => {
      setTheme(next);
      setThemeModeState(next);
      localStorage.setItem(STORAGE_KEYS.THEME, next);
      localStorage.setItem(STORAGE_KEYS.THEME_MODE, next);
      
      const updated = { ...settings, themeMode: next };
      setSettingsState(updated);
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));

      if (next === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    });
  };

  // Periodic check (every 30 seconds) to adapt auto_time mode when shift enters evening/morning hours
  useEffect(() => {
    const updateTimeAndTheme = () => {
      const isNight = checkIsNightTime(settings.nightModeStartHour, settings.nightModeEndHour);
      setIsNightTime(isNight);

      if (themeMode === 'auto_time') {
        const targetTheme = isNight ? 'dark' : 'light';
        if (theme !== targetTheme) {
          setTheme(targetTheme);
          localStorage.setItem(STORAGE_KEYS.THEME, targetTheme);
        }
      }
    };

    updateTimeAndTheme();
    const interval = setInterval(updateTimeAndTheme, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [themeMode, settings.nightModeStartHour, settings.nightModeEndHour, theme]);

  // Apply DOM class and dark contrast intensity whenever theme or settings update
  useEffect(() => {
    const contrastLevel = settings.darkContrastLevel || 'normal';
    const highBorders = Boolean(settings.darkHighVisibilityBorders);

    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-dark-contrast', contrastLevel);
      if (highBorders) {
        document.documentElement.classList.add('dark-high-borders');
      } else {
        document.documentElement.classList.remove('dark-high-borders');
      }
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.removeAttribute('data-dark-contrast');
      document.documentElement.classList.remove('dark-high-borders');
    }
  }, [theme, settings.darkContrastLevel, settings.darkHighVisibilityBorders]);

  // Listen to OS theme changes if in system mode
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = (e: MediaQueryListEvent) => {
      if (themeMode === 'system') {
        const newTheme = e.matches ? 'dark' : 'light';
        setTheme(newTheme);
      }
    };
    mediaQuery.addEventListener('change', handleMediaChange);
    return () => mediaQuery.removeEventListener('change', handleMediaChange);
  }, [themeMode]);

  const updateSettings = (newSettings: Partial<StoreSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettingsState(updated);
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    soundEffects.setMuted(updated.soundEffects === false);

    if (newSettings.themeMode && newSettings.themeMode !== themeMode) {
      setThemeModeState(newSettings.themeMode);
      localStorage.setItem(STORAGE_KEYS.THEME_MODE, newSettings.themeMode);
      const effective = computeEffectiveTheme(newSettings.themeMode, updated.nightModeStartHour, updated.nightModeEndHour);
      setTheme(effective);
      localStorage.setItem(STORAGE_KEYS.THEME, effective);
    }

    notify(t('settingsSavedSuccess'), '', 'success');
    logAudit('تعديل إعدادات المتجر', 'تم تحديث بيانات المتجر أو العملة أو نسب النقاط أو المظهر', 'medium');
  };

  // Sound effects mute synchronization
  useEffect(() => {
    soundEffects.setMuted(settings.soundEffects === false);
  }, [settings.soundEffects]);

  // =========================================================================
  // Button Layout Customizer & UI Position Management
  // =========================================================================
  const [isButtonCustomizerModalOpen, setIsButtonCustomizerModalOpen] = useState<boolean>(false);

  const BUTTON_LAYOUT_PRESETS: Record<ButtonLayoutPreset, ButtonLayoutConfig> = {
    standard: defaultButtonLayout,
    left_handed: {
      posCartPosition: 'left',
      posActionButtonsOrder: [
        'customizeButtons',
        'favorites',
        'priceEdit',
        'bluetoothPrinter',
        'customerQr',
        'barcode',
        'numpad'
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
      posPayButtonAlignment: 'reversed',
      headerButtonsOrder: [
        'staffProfile',
        'langToggle',
        'themeToggle',
        'notifications',
        'battery',
        'networkStatus',
        'quickNewSale',
        'toolsHub',
        'search',
        'sectionsNav',
        'operatingMode'
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
      floatingActionPosition: 'bottom-left',
      floatingActionEnabled: true,
      activePreset: 'left_handed'
    },
    touchscreen: {
      posCartPosition: 'right',
      posActionButtonsOrder: [
        'barcode',
        'numpad',
        'customerQr',
        'priceEdit',
        'bluetoothPrinter',
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
      posPayButtonAlignment: 'full',
      headerButtonsOrder: [
        'operatingMode',
        'sectionsNav',
        'toolsHub',
        'quickNewSale',
        'notifications',
        'battery',
        'staffProfile'
      ],
      headerButtonsVisibility: {
        operatingMode: true,
        sectionsNav: true,
        search: false,
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
      activePreset: 'touchscreen'
    },
    compact: {
      posCartPosition: 'right',
      posActionButtonsOrder: [
        'barcode',
        'numpad',
        'bluetoothPrinter',
        'customizeButtons'
      ],
      posActionButtonsVisibility: {
        numpad: true,
        barcode: true,
        customerQr: false,
        bluetoothPrinter: true,
        priceEdit: false,
        favorites: false,
        customizeButtons: true
      },
      posPayButtonAlignment: 'full',
      headerButtonsOrder: [
        'toolsHub',
        'quickNewSale',
        'battery',
        'notifications',
        'staffProfile'
      ],
      headerButtonsVisibility: {
        operatingMode: false,
        sectionsNav: false,
        search: false,
        toolsHub: true,
        quickNewSale: true,
        networkStatus: false,
        battery: true,
        notifications: true,
        themeToggle: false,
        langToggle: false,
        staffProfile: true
      },
      floatingActionPosition: 'hidden',
      floatingActionEnabled: false,
      activePreset: 'compact'
    },
    custom: {
      ...defaultButtonLayout,
      activePreset: 'custom'
    }
  };

  const updateButtonLayout = (newLayout: Partial<ButtonLayoutConfig>) => {
    const current = settings.buttonLayout || defaultButtonLayout;
    const updatedLayout: ButtonLayoutConfig = {
      ...current,
      ...newLayout,
      posActionButtonsVisibility: {
        ...current.posActionButtonsVisibility,
        ...(newLayout.posActionButtonsVisibility || {})
      },
      headerButtonsVisibility: {
        ...current.headerButtonsVisibility,
        ...(newLayout.headerButtonsVisibility || {})
      },
      activePreset: 'custom'
    };
    updateSettings({ buttonLayout: updatedLayout });
    notify('تم تعديل مواقع وترتيب الأزرار بنجاح 🎛️', 'تم تطبيق الترتيب الجديد فورياً على شاشة الكاشير والواجهة', 'success');
  };

  const resetButtonLayout = () => {
    updateSettings({ buttonLayout: defaultButtonLayout });
    notify('تمت استعادة الترتيب الافتراضي للأزرار', 'عادت كافة الأزرار لمواقعها القياسية', 'info');
  };

  const applyButtonLayoutPreset = (preset: ButtonLayoutPreset) => {
    const selected = BUTTON_LAYOUT_PRESETS[preset] || defaultButtonLayout;
    updateSettings({ buttonLayout: selected });
    const presetNames: Record<ButtonLayoutPreset, string> = {
      standard: 'الوضع القياسي الافتراضي',
      left_handed: 'وضع اليد اليسرى (الأعسر)',
      touchscreen: 'وضع شاشات اللمس الكبيرة',
      compact: 'الوضع المكثف السريع',
      custom: 'التخصيص الحر'
    };
    notify(`تم تفعيل: ${presetNames[preset]} 🚀`, 'تم تعديل مواقع السلة وأزرار الكاشير والشريط العلوي فورياً', 'success');
  };

  // =========================================================================
  // Theme Color & Store Brand Identity Management
  // =========================================================================
  const activeThemeColor: ThemeColorPreset = settings.themeColor || 'amber';
  const activePrimaryHex: string = settings.primaryColorHex || '#f59e0b';

  useEffect(() => {
    applyThemeColor(activeThemeColor, settings.primaryColorHex);
  }, [activeThemeColor, settings.primaryColorHex]);

  const setThemeColor = (color: ThemeColorPreset, customHex?: string) => {
    applyThemeColor(color, customHex);
    updateSettings({
      themeColor: color,
      primaryColorHex: customHex || (color === 'amber' ? '#f59e0b' : undefined)
    });
    const cfg = getThemeColorConfig(color, customHex);
    notify(`تم تطبيق هوية المتجر: ${cfg.nameAr} 🎨`, 'تم تحديث الألوان الأساسية لكافة أزرار وبطاقات وشاشات النظام بنجاح', 'success');
  };

  // =========================================================================
  // Inactivity Idle Timer for Auto-PIN Lock & Mandatory Login / Guest License
  // =========================================================================
  const [isIdleLocked, setIsIdleLocked] = useState<boolean>(false);
  const lastUserActivityTimeRef = useRef<number>(Date.now());

  // 15-Minute Inactivity Idle Timer for Auto-PIN Lock
  const idleAutoLockMinutes = settings.idleAutoLockMinutes ?? 15;
  useEffect(() => {
    if (idleAutoLockMinutes <= 0) return;

    const checkIdle = () => {
      const now = Date.now();
      const elapsedMinutes = (now - lastUserActivityTimeRef.current) / (1000 * 60);
      if (elapsedMinutes >= idleAutoLockMinutes && !isPinModalOpen) {
        setIsIdleLocked(true);
        setIsPinModalOpen(true);
        notify(
          'قفل تلقائي للشاشة',
          `تم قفل النظام تلقائياً بعد مرور ${idleAutoLockMinutes} دقيقة دون نشاط لحماية البيانات وسرية العمليات`,
          'warning'
        );
      }
    };

    const interval = setInterval(checkIdle, 20000);

    const onActivity = () => {
      lastUserActivityTimeRef.current = Date.now();
    };

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'pointerdown', 'click'];
    activityEvents.forEach(evt => {
      window.addEventListener(evt, onActivity, { passive: true });
    });

    return () => {
      clearInterval(interval);
      activityEvents.forEach(evt => {
        window.removeEventListener(evt, onActivity);
      });
    };
  }, [idleAutoLockMinutes, isPinModalOpen]);

  // Mandatory First-Time Login & 1-Week Guest Trial Mode & Purchase Activation
  const [isFirstLoginCompleted, setIsFirstLoginCompletedState] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.FIRST_LOGIN_COMPLETED);
    return saved !== 'false';
  });

  const [isFirstLoginModalOpen, setIsFirstLoginModalOpen] = useState<boolean>(false);

  const [licenseKey, setLicenseKey] = useState<string>(() => {
    purgeLegacyCodesFromLocalAndFirebase();
    const rawKey = localStorage.getItem(STORAGE_KEYS.LICENSE_KEY) || settings.licenseInfo?.licenseKey || '';
    const policyEpoch = localStorage.getItem(LICENSE_POLICY_EPOCH_KEY);
    // Cancel any old code not in the 8 approved codes OR any subscription from before the new policy epoch
    if (!rawKey || !isApprovedActiveLicenseCode(rawKey) || policyEpoch !== 'v2026_approved_8_codes_v1') {
      return '';
    }
    return rawKey;
  });

  const [licenseExpiresAt, setLicenseExpiresAt] = useState<string | null>(() => {
    const rawKey = localStorage.getItem(STORAGE_KEYS.LICENSE_KEY) || settings.licenseInfo?.licenseKey || '';
    const policyEpoch = localStorage.getItem(LICENSE_POLICY_EPOCH_KEY);
    if (!rawKey || !isApprovedActiveLicenseCode(rawKey) || policyEpoch !== 'v2026_approved_8_codes_v1') {
      return null;
    }
    return localStorage.getItem(STORAGE_KEYS.LICENSE_EXPIRES_AT) || settings.licenseInfo?.licenseExpiresAt || null;
  });

  const licenseRemInfo = getLicenseTimeRemaining(licenseExpiresAt || undefined);
  const isLicenseExpired = Boolean(
    licenseExpiresAt && (new Date(licenseExpiresAt).getTime() <= Date.now() || licenseRemInfo.isExpired)
  );
  const licenseRemainingDays = licenseRemInfo.daysRemaining;
  const licenseRemainingHours = licenseRemInfo.hoursRemaining;
  const isLifetimeLicense = licenseRemInfo.isLifetime;
  const licenseDurationLabel = settings.licenseInfo?.licenseDurationLabel || (isLifetimeLicense ? 'ترخيص دائم مدى الحياة' : (licenseExpiresAt ? (licenseRemainingDays > 35 ? 'اشتراك سنوي (سنة)' : 'اشتراك شهري (شهر)') : 'ترخيص معتمد'));

  const [isAppPurchased, setIsAppPurchased] = useState<boolean>(() => {
    const rawKey = localStorage.getItem(STORAGE_KEYS.LICENSE_KEY) || settings.licenseInfo?.licenseKey || '';
    const policyEpoch = localStorage.getItem(LICENSE_POLICY_EPOCH_KEY);
    if (!rawKey || !isApprovedActiveLicenseCode(rawKey) || policyEpoch !== 'v2026_approved_8_codes_v1') {
      return false;
    }
    const expiresSaved = localStorage.getItem(STORAGE_KEYS.LICENSE_EXPIRES_AT) || settings.licenseInfo?.licenseExpiresAt;
    if (expiresSaved) {
      const isExpired = new Date(expiresSaved).getTime() <= Date.now();
      if (isExpired) return false;
    }
    const saved = localStorage.getItem(STORAGE_KEYS.APP_PURCHASED);
    return saved === 'true' || settings.licenseInfo?.isPurchased === true;
  });

  const [trialStartDate, setTrialStartDate] = useState<string>(() => {
    let saved = localStorage.getItem(STORAGE_KEYS.TRIAL_START_DATE) || settings.licenseInfo?.trialStartDate;
    if (!saved) {
      saved = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.TRIAL_START_DATE, saved);
    }
    return saved;
  });

  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState<boolean>(false);

  const trialInfo = getTrialTimeRemaining(trialStartDate, 7);
  const trialDaysRemaining = trialInfo.daysRemaining;
  const trialHoursRemaining = trialInfo.hoursRemaining;

  // Track isTrialExpired with localStorage persistence based on calculated expiration date
  const [isTrialExpired, setIsTrialExpiredState] = useState<boolean>(() => {
    const expiresSaved = localStorage.getItem(STORAGE_KEYS.LICENSE_EXPIRES_AT) || settings.licenseInfo?.licenseExpiresAt;
    const purchasedSaved = (localStorage.getItem(STORAGE_KEYS.APP_PURCHASED) === 'true') || (settings.licenseInfo?.isPurchased === true);

    if (purchasedSaved && expiresSaved) {
      const expTime = new Date(expiresSaved).getTime();
      const hasExpired = !isNaN(expTime) && expTime <= Date.now();
      localStorage.setItem(STORAGE_KEYS.IS_TRIAL_EXPIRED, hasExpired ? 'true' : 'false');
      return hasExpired;
    }

    if (purchasedSaved && !expiresSaved) {
      localStorage.setItem(STORAGE_KEYS.IS_TRIAL_EXPIRED, 'false');
      return false;
    }

    const trialStartSaved = localStorage.getItem(STORAGE_KEYS.TRIAL_START_DATE) || settings.licenseInfo?.trialStartDate || new Date().toISOString();
    const guestTrial = getTrialTimeRemaining(trialStartSaved, 7);
    localStorage.setItem(STORAGE_KEYS.IS_TRIAL_EXPIRED, guestTrial.isExpired ? 'true' : 'false');
    return guestTrial.isExpired;
  });

  // Evaluate subscription expiration date and trial state periodically and update isTrialExpired
  useEffect(() => {
    const evaluateExpiration = () => {
      const nowMs = Date.now();

      // 1. Purchased with calculated expiration date (year or month)
      if (licenseExpiresAt) {
        const expTime = new Date(licenseExpiresAt).getTime();
        const hasLicenseExpired = !isNaN(expTime) && expTime <= nowMs;

        if (hasLicenseExpired) {
          setIsAppPurchased(false);
          setIsTrialExpiredState(true);
          localStorage.setItem(STORAGE_KEYS.APP_PURCHASED, 'false');
          localStorage.setItem(STORAGE_KEYS.IS_TRIAL_EXPIRED, 'true');
          setIsPurchaseModalOpen(true);
        } else {
          setIsTrialExpiredState(false);
          localStorage.setItem(STORAGE_KEYS.IS_TRIAL_EXPIRED, 'false');
        }
        return;
      }

      // 2. Purchased without expiration date (lifetime)
      if (isAppPurchased && !licenseExpiresAt) {
        setIsTrialExpiredState(false);
        localStorage.setItem(STORAGE_KEYS.IS_TRIAL_EXPIRED, 'false');
        return;
      }

      // 3. Not purchased - 7 days guest trial mode
      const currentTrial = getTrialTimeRemaining(trialStartDate, 7);
      if (currentTrial.isExpired) {
        setIsTrialExpiredState(true);
        localStorage.setItem(STORAGE_KEYS.IS_TRIAL_EXPIRED, 'true');
        if (isFirstLoginCompleted) {
          setIsPurchaseModalOpen(true);
        }
      } else {
        setIsTrialExpiredState(false);
        localStorage.setItem(STORAGE_KEYS.IS_TRIAL_EXPIRED, 'false');
      }
    };

    evaluateExpiration();
    const interval = setInterval(evaluateExpiration, 15000);
    return () => clearInterval(interval);
  }, [licenseExpiresAt, isAppPurchased, trialStartDate, isFirstLoginCompleted]);

  const completeFirstLogin = (userData?: Partial<User>) => {
    setIsFirstLoginCompletedState(true);
    localStorage.setItem(STORAGE_KEYS.FIRST_LOGIN_COMPLETED, 'true');
    const nowIso = new Date().toISOString();
    setTrialStartDate(nowIso);
    localStorage.setItem(STORAGE_KEYS.TRIAL_START_DATE, nowIso);
    setIsFirstLoginModalOpen(false);

    if (userData) {
      const updatedUser = { ...currentUser, ...userData };
      setCurrentUser(updatedUser);
    }

    soundEffects.playSuccess();
    notify(
      'مرحباً بك في كاشير كيان!',
      'تم إكمال تسجيل الدخول وتفعيل وضع الضيف التجريبي لكامل مزايا النظام لمدة أسبوع (7 أيام)',
      'success'
    );
  };

  const revokeCurrentDeviceSubscription = useCallback((reasonAr?: string) => {
    const freshTrialStart = new Date().toISOString();
    try {
      localStorage.setItem(STORAGE_KEYS.APP_PURCHASED, 'false');
      localStorage.removeItem(STORAGE_KEYS.LICENSE_KEY);
      localStorage.removeItem(STORAGE_KEYS.LICENSE_EXPIRES_AT);
      localStorage.removeItem(STORAGE_KEYS.LICENSE_TYPE);
      localStorage.setItem(STORAGE_KEYS.TRIAL_START_DATE, freshTrialStart);
      localStorage.setItem(STORAGE_KEYS.IS_TRIAL_EXPIRED, 'false');
    } catch {}

    setIsAppPurchased(false);
    setLicenseKey('');
    setLicenseExpiresAt(null);
    setTrialStartDate(freshTrialStart);
    setIsTrialExpiredState(false);

    setSettingsState(prev => {
      const updated: StoreSettings = {
        ...prev,
        licenseInfo: {
          isPurchased: false,
          licenseKey: '',
          licenseStatus: 'trial',
          trialStartDate: freshTrialStart,
        },
      };
      try {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    soundEffects.playWarning();
    setIsPurchaseModalOpen(true);
    notify(
      '🔄 تم إلغاء الاشتراك وإرجاع الحساب للفترة المجانية',
      reasonAr || 'تم إلغاء الكود القديم وإرجاع حسابك إلى الفترة التجريبية المجانية (7 أيام). يرجى إدخال كود تفعيل جديد.',
      'warning'
    );
  }, []);

  // Automatically cancel any old code (such as K9_0u, K9_0s50) or pre-epoch subscription, return to 7-day free trial, and ask for a new code!
  useEffect(() => {
    purgeLegacyCodesFromLocalAndFirebase();
    const rawSavedKey = localStorage.getItem(STORAGE_KEYS.LICENSE_KEY) || settings.licenseInfo?.licenseKey || '';
    const wasPurchased =
      localStorage.getItem(STORAGE_KEYS.APP_PURCHASED) === 'true' ||
      settings.licenseInfo?.isPurchased === true;
    const policyEpoch = localStorage.getItem(LICENSE_POLICY_EPOCH_KEY);

    if (
      (rawSavedKey && !isApprovedActiveLicenseCode(rawSavedKey)) ||
      (wasPurchased && policyEpoch !== 'v2026_approved_8_codes_v1')
    ) {
      localStorage.setItem(LICENSE_POLICY_EPOCH_KEY, 'v2026_approved_8_codes_v1');
      revokeCurrentDeviceSubscription(
        rawSavedKey
          ? `تم إلغاء الكود القديم (${rawSavedKey}) وإرجاع حسابك إلى الفترة المجانية (7 أيام). يرجى إدخال كود تفعيل جديد من الأكواد المعتمدة.`
          : 'تم إلغاء الاشتراك القديم وإرجاع حسابك إلى الفترة المجانية (7 أيام). يرجى إدخال كود تفعيل جديد.'
      );
    }
  }, [revokeCurrentDeviceSubscription]);

  // Real-time Firebase Firestore listener: if this device's active license is transferred to another device or revoked, cancel subscription immediately!
  useEffect(() => {
    if (!isAppPurchased || !licenseKey) return;
    const hw = getDeviceHardwareInfo();
    const unsub = subscribeToFirebaseLicenseBinding(licenseKey, hw.deviceId, details => {
      const timeAr = formatCodeUsageTimestampAr(details.usedAt);
      revokeCurrentDeviceSubscription(
        `تم نقل تفعيل الكود (${licenseKey}) إلى جهاز آخر (${details.newDeviceId} — ${details.newDeviceName}) في موعد (${timeAr})، وتم إلغاء اشتراك هذا الجهاز فوراً.`
      );
    });
    return () => unsub();
  }, [isAppPurchased, licenseKey, revokeCurrentDeviceSubscription]);

  const activatePurchaseCode = (
    code: string,
    customerInfo?: {
      name?: string;
      phone?: string;
      customExpiresAtIso?: string;
      allowTransfer?: boolean;
      previousDeviceIdToRevoke?: string | null;
      targetDeviceId?: string;
      targetDeviceFingerprint?: string;
      targetDeviceName?: string;
    }
  ): { success: boolean; message: string; newExpiresAt?: string; usedAt?: string } => {
    const isTransfer = Boolean(customerInfo?.allowTransfer);
    const res = validateLicenseCode(code, licenseKey, isTransfer);
    if (!res.valid || !res.matchedCode) {
      soundEffects.playWarning();
      return { success: false, message: res.reason || 'كود التفعيل غير صالح' };
    }

    const matched = res.matchedCode;
    const cleanCode = matched.code;
    const now = new Date();
    const nowIso = now.toISOString();

    // Calculate or use provided subscription expiration date
    let expiresAtIso: string | undefined = customerInfo?.customExpiresAtIso;
    if (!expiresAtIso) {
      const baseTime = (licenseExpiresAt && new Date(licenseExpiresAt).getTime() > now.getTime())
        ? new Date(licenseExpiresAt)
        : now;

      if (matched.duration === '1_year' || matched.durationDays === 365) {
        // 1 Year Subscription: 1 full calendar year
        const expDate = new Date(baseTime.getTime());
        expDate.setFullYear(expDate.getFullYear() + 1);
        expiresAtIso = expDate.toISOString();
      } else if (matched.duration === '1_month' || matched.durationDays === 30) {
        // 1 Month Subscription: 1 full calendar month
        const expDate = new Date(baseTime.getTime());
        expDate.setMonth(expDate.getMonth() + 1);
        expiresAtIso = expDate.toISOString();
      } else if (matched.durationDays > 0) {
        const expMs = baseTime.getTime() + matched.durationDays * 24 * 60 * 60 * 1000;
        expiresAtIso = new Date(expMs).toISOString();
      } else {
        expiresAtIso = calculateSubscriptionExpirationDate(matched.duration, baseTime) || undefined;
      }
    }

    // Enforce single-use & device fingerprint binding in Firebase Firestore + Server + localStorage
    const hwDevice = getDeviceHardwareInfo();
    const effectiveDeviceId = customerInfo?.targetDeviceId || hwDevice.deviceId;
    const effectiveFingerprint = customerInfo?.targetDeviceFingerprint || hwDevice.deviceFingerprint;
    const effectiveDeviceName = customerInfo?.targetDeviceName || hwDevice.deviceName;

    if (matched.singleUse) {
      markCodeAsUsed(matched.code, {
        ...customerInfo,
        usedAt: nowIso,
        deviceId: effectiveDeviceId,
        deviceFingerprint: effectiveFingerprint,
        deviceName: effectiveDeviceName,
        expiresAt: expiresAtIso,
        durationLabelAr: matched.durationLabelAr,
      });
    }

    // Bind or transfer code in Firebase Firestore (`licenseActivations/{codeId}`) + Express server and revoke other devices
    bindOrTransferLicenseInFirebaseAndServer({
      code: cleanCode,
      deviceId: effectiveDeviceId,
      deviceFingerprint: effectiveFingerprint,
      deviceName: effectiveDeviceName,
      storeName: customerInfo?.name || settings.storeNameAr,
      customerPhone: customerInfo?.phone || settings.phone,
      expiresAt: expiresAtIso,
      durationLabelAr: matched.durationLabelAr,
      isTransfer,
      previousDeviceIdToRevoke: customerInfo?.previousDeviceIdToRevoke,
    }).catch(() => {});

    // Store in localStorage with new policy epoch
    localStorage.setItem(LICENSE_POLICY_EPOCH_KEY, 'v2026_approved_8_codes_v1');
    localStorage.setItem(STORAGE_KEYS.APP_PURCHASED, 'true');
    localStorage.setItem(STORAGE_KEYS.LICENSE_KEY, cleanCode);
    localStorage.setItem(STORAGE_KEYS.PURCHASED_AT, now.toISOString());
    localStorage.setItem(STORAGE_KEYS.LICENSE_TYPE, matched.duration);
    if (expiresAtIso) {
      localStorage.setItem(STORAGE_KEYS.LICENSE_EXPIRES_AT, expiresAtIso);
    } else {
      localStorage.removeItem(STORAGE_KEYS.LICENSE_EXPIRES_AT);
    }
    // Update trial expired state in localStorage
    localStorage.setItem(STORAGE_KEYS.IS_TRIAL_EXPIRED, 'false');

    // Update React state
    setIsAppPurchased(true);
    setLicenseKey(cleanCode);
    setLicenseExpiresAt(expiresAtIso || null);
    setIsTrialExpiredState(false);

    const updatedLicense: LicenseInfo = {
      isPurchased: true,
      licenseKey: cleanCode,
      licenseStatus: 'active',
      licenseType: matched.duration,
      licenseDurationLabel: matched.durationLabelAr,
      purchasedAt: now.toISOString(),
      licenseExpiresAt: expiresAtIso,
      customerName: customerInfo?.name || settings.storeNameAr,
      customerPhone: customerInfo?.phone || settings.phone
    };

    // =========================================================================
    // ZERO OUT ALL DATA UPON MONTHLY OR YEARLY CODE ACTIVATION
    // =========================================================================
    const zeroBaseCategories: Category[] = [
      { id: 'cat_all', nameAr: 'الكل', nameEn: 'All', icon: 'LayoutGrid', color: '#f59e0b', sortOrder: 0 }
    ];
    const ownerBaseUser: User = {
      ...(currentUser?.role === 'owner' ? currentUser : initialUsers[0]),
      id: 'usr_1',
      name: customerInfo?.name?.trim() || currentUser?.name || initialUsers[0].name,
      role: 'owner',
      active: true,
    };
    const zeroedUsers: User[] = [ownerBaseUser];

    const updatedSettingsWithLicense: StoreSettings = {
      ...settings,
      storeNameAr: customerInfo?.name?.trim() || settings.storeNameAr,
      phone: customerInfo?.phone?.trim() || settings.phone,
      licenseInfo: updatedLicense,
    };

    // 1. Mark system as zeroed out and persist clean empty arrays in localStorage
    localStorage.setItem(STORAGE_KEYS.ZEROED_OUT, 'true');
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(zeroBaseCategories));
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.DEBT_TRANSACTIONS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.INSTALLMENT_PLANS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.DEBT_REMINDER_LOGS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.REFUNDS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.INVENTORY_LOGS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.WHOLESALE_WAREHOUSES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.DELIVERY_VEHICLES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.VEHICLE_MANIFESTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.CASH_SHIFTS, JSON.stringify([]));
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_SHIFT_ID);
    localStorage.setItem(STORAGE_KEYS.PROMOTIONS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(zeroedUsers));
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, ownerBaseUser.id);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updatedSettingsWithLicense));

    // 2. Update all React states to zero immediately
    setProductsState([]);
    setCategoriesState(zeroBaseCategories);
    setCustomersState([]);
    setSuppliersState([]);
    setDebtTransactionsState([]);
    setSalesState([]);
    setRefundsState([]);
    setInventoryLogsState([]);
    setExpensesState([]);
    setAuditLogsState([]);
    setWholesaleWarehousesState([]);
    setDeliveryVehiclesState([]);
    setVehicleManifestsState([]);
    setShiftsState([]);
    setActiveShiftId(null);
    setPromotionsState([]);
    setUsersState(zeroedUsers);
    setCurrentUserState(ownerBaseUser);
    setNotifications([]);
    const masterDeviceInitial: LinkedDevice = {
      id: hwDevice.deviceId,
      name: `الجهاز الرئيسي (${hwDevice.deviceName})`,
      role: 'master_pos',
      roleLabelAr: 'الجهاز الرئيسي (صاحب الاشتراك)',
      workDescription: `الجهاز الرئيسي المفعل بكود الاشتراك (${cleanCode}) — تحكم كامل وإضافة أجهزة والاطلاع الحي على مبيعات وبيانات الأجهزة`,
      workPermissions: {
        allowPosSales: true,
        allowTableOrders: true,
        allowCatalogAndStock: true,
        allowCustomersAndDebts: true,
        allowExpenses: true,
        allowKitchenDisplay: true,
        autoShareDataWithMaster: true,
      },
      masterDeviceId: hwDevice.deviceId,
      masterDeviceFingerprint: hwDevice.deviceFingerprint,
      boundSubscriptionCode: cleanCode,
      subscriptionLinkCode: generateSubscriptionBoundDeviceCode(cleanCode, hwDevice.deviceId, masterPairingPin),
      uniqueDeviceCode: generateUniqueCodeForSingleDevice('master_pos', [], masterPairingPin),
      deviceType: 'desktop',
      pairingCode: masterPairingPin,
      pairedAt: nowIso,
      lastSeen: nowIso,
      isOnline: true,
      batteryLevel: 100,
      cashierName: ownerBaseUser.name,
      currentScreen: 'pos',
      branchName: 'الفرع الرئيسي',
      salesCount: 0,
      totalSalesAmount: 0,
      ordersCount: 0,
      lastActivitySummary: `تم تفعيل كود الاشتراك (${cleanCode}) وتعيينه كجهاز رئيسي`,
      lastActivityAt: nowIso,
    };

    try {
      localStorage.removeItem('kian_dedicated_device_role');
      localStorage.removeItem('kian_paired_cashier_pin');
    } catch {}
    setDedicatedDeviceRole(null);
    setDevices([masterDeviceInitial]);
    setKitchenOrders([]);
    setLiveRemoteCart(null);
    setCart([]);
    setSelectedCustomer(null);
    setOrderDiscount({ value: 0, type: 'fixed' });
    setPointsToRedeem(0);
    setKitchenNote('');
    setSelectedReturnInvoice(null);
    setSettingsState(updatedSettingsWithLicense);

    // 3. Completely wipe all locally stored data in IndexedDB (`KianCashier_OfflineDB`) upon activating a new monthly/yearly subscription code
    try {
      localStorage.removeItem('kian_simulate_low_storage');
    } catch {}
    indexedDbService.clearAllDataForNewSubscription(updatedSettingsWithLicense, zeroBaseCategories).catch(() => {});
    setOfflineQueueCount(0);

    // 4. Clear server in-memory demo devices, kitchen orders, and cart while registering this device as Master Device
    fetch('/api/system/reset-zero', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        masterDeviceId: hwDevice.deviceId,
        masterDeviceName: `الجهاز الرئيسي (${hwDevice.deviceName})`,
        boundSubscriptionCode: cleanCode,
      }),
    }).catch(() => {});

    // 5. Notify any mounted views (such as DebtView installmentPlans) to zero out local state
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kian-zero-out-all'));
    }

    soundEffects.playSuccess();
    setIsPurchaseModalOpen(false);

    notify(
      'تم تفعيل الاشتراك ومسح بيانات IndexedDB بالكامل! 👑',
      `تم تفعيل (${matched.durationLabelAr}) ومسح جميع البيانات المخزنة محلياً في IndexedDB لضمان بداية جديدة ونظيفة للمشترك.`,
      'success'
    );

    return {
      success: true,
      message: isTransfer
        ? `تم نقل تفعيل (${matched.durationLabelAr}) إلى هذا الجهاز ومسح جميع البيانات المخزنة محلياً في IndexedDB بنجاح`
        : `تم تفعيل ${matched.durationLabelAr} ومسح جميع البيانات المخزنة محلياً في IndexedDB بنجاح`,
      newExpiresAt: expiresAtIso,
      usedAt: nowIso,
    };
  };

  // =========================================================================
  // Power Saving & Battery Saver Engine (Eco Mode for long battery shifts)
  // =========================================================================
  const [isPowerSavingActive, setIsPowerSavingActiveState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('kian_power_saving_active');
      if (saved !== null) return saved === 'true';
      return Boolean(settings.enablePowerSavingMode);
    } catch {
      return Boolean(settings.enablePowerSavingMode);
    }
  });

  const [isPowerSavingStandby, setIsPowerSavingStandby] = useState<boolean>(false);

  // Battery detection with Navigator Battery API (supported in Chromium/Android/Electron)
  const [batteryInfo, setBatteryInfo] = useState<BatteryInfo>({
    supported: false,
    level: 100,
    charging: true,
  });

  useEffect(() => {
    let batteryManager: any = null;
    let isSubscribed = true;

    if (typeof navigator !== 'undefined' && 'getBattery' in (navigator as any)) {
      (navigator as any).getBattery().then((bm: any) => {
        if (!isSubscribed) return;
        batteryManager = bm;
        const updateBattery = () => {
          setBatteryInfo({
            supported: true,
            level: Math.round(bm.level * 100),
            charging: Boolean(bm.charging),
            chargingTime: bm.chargingTime,
            dischargingTime: bm.dischargingTime,
          });
        };
        updateBattery();
        bm.addEventListener('levelchange', updateBattery);
        bm.addEventListener('chargingchange', updateBattery);
      }).catch(() => {
        // Battery API not supported or user denied
      });
    }

    return () => {
      isSubscribed = false;
      if (batteryManager) {
        batteryManager.removeEventListener?.('levelchange', () => {});
        batteryManager.removeEventListener?.('chargingchange', () => {});
      }
    };
  }, []);

  const updateBatteryInfo = useCallback((info: Partial<BatteryInfo>) => {
    setBatteryInfo(prev => ({
      ...prev,
      ...info,
      supported: true
    }));
  }, []);

  // Auto trigger power saving when battery drops low (<= 20%) and discharging
  useEffect(() => {
    if (batteryInfo.level <= 20 && !batteryInfo.charging && !isPowerSavingActive) {
      if (settings.autoEnablePowerSavingOnLowBattery !== false) {
        setPowerSavingActive(true);
        notify(
          'تنبيه شحن البطارية (منخفض)',
          `انخفض مستوى شحن البطارية إلى ${batteryInfo.level}%، تم تفعيل وضع توفير الطاقة تلقائياً للحفاظ على استمرار عمل الكاشير.`,
          'warning'
        );
      }
    }
  }, [batteryInfo.level, batteryInfo.charging, isPowerSavingActive, settings.autoEnablePowerSavingOnLowBattery]);

  // Synchronize CSS filter and class on documentElement
  useEffect(() => {
    const root = document.documentElement;
    if (isPowerSavingActive) {
      root.classList.add('power-saving-active');
      const dimLevel = settings.powerSavingDimLevel || 25;
      const brightnessVal = Math.max(0.4, (100 - dimLevel) / 100);
      root.style.setProperty('--ps-brightness', brightnessVal.toFixed(2));
    } else {
      root.classList.remove('power-saving-active');
      root.style.removeProperty('--ps-brightness');
    }
  }, [isPowerSavingActive, settings.powerSavingDimLevel]);

  // Standby Dimming on Inactivity
  useEffect(() => {
    const root = document.documentElement;
    if (isPowerSavingStandby) {
      root.classList.add('power-saving-standby');
    } else {
      root.classList.remove('power-saving-standby');
    }
  }, [isPowerSavingStandby]);

  // Inactivity detection for auto-dimming when power saving is active
  useEffect(() => {
    const autoDimTimeoutMinutes = settings.powerSavingAutoDimTimeout ?? 1;
    if (!isPowerSavingActive || autoDimTimeoutMinutes <= 0) {
      setIsPowerSavingStandby(false);
      return;
    }

    let timeoutId: NodeJS.Timeout;

    const resetIdleTimer = () => {
      setIsPowerSavingStandby(false);
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsPowerSavingStandby(true);
      }, autoDimTimeoutMinutes * 60 * 1000);
    };

    resetIdleTimer();

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'pointerdown'];
    activityEvents.forEach(evt => {
      window.addEventListener(evt, resetIdleTimer, { passive: true });
    });

    return () => {
      clearTimeout(timeoutId);
      activityEvents.forEach(evt => {
        window.removeEventListener(evt, resetIdleTimer);
      });
    };
  }, [isPowerSavingActive, settings.powerSavingAutoDimTimeout]);

  const wakeFromStandby = useCallback(() => {
    setIsPowerSavingStandby(false);
  }, []);

  const setPowerSavingActive = (active: boolean) => {
    setIsPowerSavingActiveState(active);
    localStorage.setItem('kian_power_saving_active', active ? 'true' : 'false');
    updateSettings({ enablePowerSavingMode: active });
    if (active) {
      notify(
        'وضع توفير الطاقة نشط',
        'تم تعتيم الشاشة وإيقاف المؤثرات لتوفير شحن البطارية للكاشير لأقصى مدة تشغيل',
        'info'
      );
    } else {
      setIsPowerSavingStandby(false);
      notify('تم تعطيل وضع توفير الطاقة', 'عادت الشاشة لدرجة السطوع العادية وكامل المؤثرات الحركية', 'info');
    }
  };

  const togglePowerSaving = () => {
    setPowerSavingActive(!isPowerSavingActive);
  };

  // Currency Formatter
  const formatCurrency = (amount: number): string => {
    const num = Number(amount) || 0;
    const formattedNum = new Intl.NumberFormat(language === 'ar' ? 'ar-SY' : 'en-US', {
      minimumFractionDigits: settings.currency.decimals || 0,
      maximumFractionDigits: settings.currency.decimals || 0,
    }).format(num);

    const symbol = language === 'ar' ? settings.currency.symbolNative || settings.currency.symbol : settings.currency.symbol;
    return language === 'ar' ? `${formattedNum} ${symbol}` : `${symbol} ${formattedNum}`;
  };

  // 6. Users & Authentication
  const [users, setUsersState] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USERS);
      return saved ? JSON.parse(saved) : initialUsers;
    } catch {
      return initialUsers;
    }
  });

  const [currentUser, setCurrentUserState] = useState<User>(() => {
    try {
      const savedId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
      const found = users.find(u => u.id === savedId);
      return found || users[0] || initialUsers[0];
    } catch {
      return initialUsers[0];
    }
  });

  const setCurrentUser = (user: User) => {
    setCurrentUserState(user);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, user.id);
    // If the active tab is forbidden for the switched role, safely redirect to POS
    if (!canAccessTab(activeTab, user.role)) {
      setActiveTab('pos');
    }
  };

  const loginWithPin = (pin: string): boolean => {
    const user = users.find(u => u.pinCode === pin && u.active);
    if (user) {
      setCurrentUser(user);
      soundEffects.playSuccess();
      const roleMeta = getRoleInfo(user.role);
      notify(`مرحباً ${user.name}`, `تم تسجيل الدخول بصلاحية: ${roleMeta.labelAr}`, 'success');
      logAudit('تسجيل دخول بالرمز السري', `المستخدم: ${user.name} (${roleMeta.labelAr})`, 'low');
      return true;
    }
    soundEffects.playWarning();
    notify('رمز PIN غير صحيح', 'يرجى التأكد من الرمز السري وإعادة المحاولة', 'error');
    return false;
  };

  const hasPermission = (action: string): boolean => {
    return hasActionPermission(action as any, currentUser.role);
  };

  const addStaff = (staffData: Omit<User, 'id' | 'createdAt'>) => {
    const newUser: User = {
      ...staffData,
      id: `usr_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [newUser, ...users];
    setUsersState(updated);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
    logAudit('إضافة موظف جديد', `اسم الموظف: ${newUser.name} الدور: ${newUser.role}`, 'medium');
    notify('تمت إضافة الموظف بنجاح', newUser.name, 'success');
  };

  const updateStaff = (id: string, staffData: Partial<User>) => {
    const updated = users.map(u => u.id === id ? { ...u, ...staffData } : u);
    setUsersState(updated);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
    if (currentUser.id === id) {
      setCurrentUser({ ...currentUser, ...staffData });
    }
    notify('تم تحديث بيانات الموظف', '', 'success');
  };

  const deleteStaff = (id: string) => {
    if (users.length <= 1) {
      notify('لا يمكن حذف الموظف الوحيد', '', 'error');
      return;
    }
    const updated = users.filter(u => u.id !== id);
    setUsersState(updated);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
    notify('تم حذف الموظف', '', 'info');
  };

  // Google Authentication State & Handlers
  const [googleUser, setGoogleUserState] = useState<GoogleAuthUser | null>(() => {
    return googleAuthService.getGoogleUser();
  });
  const [isGoogleAuthLoading, setIsGoogleAuthLoading] = useState<boolean>(false);
  const isGoogleSignedIn = Boolean(googleUser && googleUser.email);

  const signInWithGoogle = async (options?: { hintEmail?: string; role?: UserRole; forceFallback?: boolean }): Promise<boolean> => {
    setIsGoogleAuthLoading(true);
    try {
      const res = await googleAuthService.signInWithGoogle(options);
      if (res.success && res.user) {
        setGoogleUserState(res.user);
        
        // Find existing user by email or googleEmail or googleId
        const targetEmail = res.user.email.toLowerCase();
        const existingUser = users.find(u => 
          (u.email && u.email.toLowerCase() === targetEmail) ||
          (u.googleEmail && u.googleEmail.toLowerCase() === targetEmail) ||
          (u.googleId && u.googleId === res.user!.id)
        );

        let activeAuthUser: User;
        if (existingUser) {
          activeAuthUser = {
            ...existingUser,
            googleEmail: res.user.email,
            googleId: res.user.id,
            isGoogleAccount: true,
            avatar: res.user.picture || existingUser.avatar,
            name: res.user.name || existingUser.name,
          };
          const updatedUsers = users.map(u => u.id === existingUser.id ? activeAuthUser : u);
          setUsersState(updatedUsers);
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));
        } else {
          // Provision new user for this Google account with Owner role
          activeAuthUser = {
            id: `usr_google_${Date.now()}`,
            name: res.user.name || 'حساب Google',
            email: res.user.email,
            role: res.user.role || 'owner',
            avatar: res.user.picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
            pinCode: '0000',
            active: true,
            createdAt: new Date().toISOString(),
            isGoogleAccount: true,
            googleEmail: res.user.email,
            googleId: res.user.id,
          };
          const updatedUsers = [activeAuthUser, ...users];
          setUsersState(updatedUsers);
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));
        }

        setCurrentUser(activeAuthUser);
        soundEffects.playSuccess();
        notify('تم تسجيل الدخول بحساب Google بنجاح', `مرحباً ${activeAuthUser.name} (${activeAuthUser.email})`, 'success');
        logAudit('تسجيل دخول بحساب Google', `المستخدم: ${activeAuthUser.name} (${activeAuthUser.email})`, 'low');
        return true;
      } else {
        soundEffects.playWarning();
        notify('تعذر تسجيل الدخول عبر Google', res.error || 'يرجى المحاولة مرة أخرى', 'error');
        return false;
      }
    } catch (err: any) {
      console.error('Google Sign-in exception:', err);
      notify('خطأ في تسجيل الدخول', err.message || 'حدث خطأ أثناء الاتصال بخدمات Google', 'error');
      return false;
    } finally {
      setIsGoogleAuthLoading(false);
    }
  };

  const signOutGoogle = () => {
    const prevEmail = googleUser?.email || '';
    googleAuthService.signOut();
    setGoogleUserState(null);
    soundEffects.playClick();
    notify('تم تسجيل الخروج من Google', 'تم إنهاء الجلسة، يمكنك التبديل لأي مستخدم آخر أو رمز PIN', 'info');
    logAudit('تسجيل خروج من Google', `تم تسجيل الخروج لحساب ${prevEmail}`, 'low');
  };

  // 7. Categories & Products
  const [categories, setCategoriesState] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      return saved ? JSON.parse(saved) : initialCategories;
    } catch {
      return initialCategories;
    }
  });

  const [products, setProductsState] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      return saved ? JSON.parse(saved) : initialProducts;
    } catch {
      return initialProducts;
    }
  });

  const addProduct = (prod: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product => {
    const newProd: Product = {
      ...prod,
      id: `prod_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setProductsState(prev => {
      const updated = [newProd, ...prev];
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));
      return updated;
    });
    logAudit('إضافة منتج جديد', `الاسم: ${newProd.nameAr} - السعر: ${newProd.price} - الباركود: ${newProd.barcode}`, 'medium');
    notify('تمت إضافة المنتج بنجاح', newProd.nameAr, 'success');
    return newProd;
  };

  const updateProduct = (id: string, prod: Partial<Product>) => {
    setProductsState(prev => {
      const updated = prev.map(p => p.id === id ? { ...p, ...prod, updatedAt: new Date().toISOString() } : p);
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));
      return updated;
    });
    logAudit('تعديل منتج', `معرف المنتج: ${id}`, 'low');
  };

  const deleteProduct = (id: string) => {
    const prod = products.find(p => p.id === id);
    const updated = products.filter(p => p.id !== id);
    setProductsState(updated);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));
    logAudit('حذف منتج', `المنتج المحذوف: ${prod?.nameAr || id}`, 'high');
    notify('تم حذف المنتج', prod?.nameAr || '', 'info');
  };

  const duplicateProduct = (id: string) => {
    const src = products.find(p => p.id === id);
    if (!src) return;
    const duplicated: Product = {
      ...src,
      id: `prod_${Date.now()}`,
      nameAr: `${src.nameAr} (نسخة)`,
      nameEn: `${src.nameEn} (Copy)`,
      barcode: `${src.barcode}1`,
      sku: `${src.sku}-CP`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [duplicated, ...products];
    setProductsState(updated);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));
    notify('تم نسخ المنتج بنجاح', duplicated.nameAr, 'success');
  };

  const toggleFavorite = (id: string) => {
    const updated = products.map(p => p.id === id ? { ...p, isFavorite: !p.isFavorite } : p);
    setProductsState(updated);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));
  };

  const addCategory = (cat: Omit<Category, 'id'>): Category => {
    const newCat: Category = {
      ...cat,
      id: `cat_${Date.now()}`,
    };
    const updated = [...categories, newCat];
    setCategoriesState(updated);
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(updated));
    notify('تمت إضافة التصنيف', newCat.nameAr, 'success');
    return newCat;
  };

  const updateCategory = (id: string, cat: Partial<Category>) => {
    const updated = categories.map(c => c.id === id ? { ...c, ...cat } : c);
    setCategoriesState(updated);
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(updated));
    notify('تم تحديث التصنيف', '', 'success');
  };

  const deleteCategory = (id: string) => {
    const updated = categories.filter(c => c.id !== id);
    setCategoriesState(updated);
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(updated));
    notify('تم حذف التصنيف', '', 'info');
  };

  const applyBulkWholesaleMargin = (discountPercent: number, categoryId?: string) => {
    const updated = products.map(prod => {
      if (categoryId && categoryId !== 'all' && prod.categoryId !== categoryId) {
        return prod;
      }
      // Calculate wholesale price based on discount from retail price or markup over cost
      const newWholesalePrice = Math.round(prod.price * (1 - discountPercent / 100));
      return {
        ...prod,
        wholesalePrice: Math.max(prod.costPrice, newWholesalePrice),
        tradeType: (prod.tradeType || 'both') as 'retail' | 'wholesale' | 'both',
        wholesaleMinQty: prod.wholesaleMinQty || 5,
        wholesaleUnit: prod.wholesaleUnit || 'طرد / كرتونة',
        wholesaleUnitMultiplier: prod.wholesaleUnitMultiplier || 6,
      };
    });
    setProductsState(updated);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));
    notify('تم تحديث أسعار الجملة المجمعة بنجاح', `تم تطبيق خصم ${discountPercent}% للجملة`, 'success');
  };

  // 8. Customers & Loyalty
  const [customers, setCustomersState] = useState<Customer[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
      return saved ? JSON.parse(saved) : initialCustomers;
    } catch {
      return initialCustomers;
    }
  });

  const addCustomer = (customerData: Omit<Customer, 'id' | 'customerCode' | 'totalSpent' | 'visitCount' | 'points' | 'createdAt' | 'qrData'>): Customer => {
    const randomCode = `CUS${Math.floor(100000 + Math.random() * 900000)}`;
    const newCust: Customer = {
      ...customerData,
      id: `cus_${Date.now()}`,
      customerCode: randomCode,
      totalSpent: 0,
      visitCount: 0,
      points: 0,
      createdAt: new Date().toISOString(),
      qrData: randomCode,
    };
    const updated = [newCust, ...customers];
    setCustomersState(updated);
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(updated));
    logAudit('إضافة عميل / عضوية جديدة', `الاسم: ${newCust.name} المعرف: ${newCust.customerCode}`, 'low');
    notify('تم تسجيل العميل بنجاح', `${newCust.name} (${newCust.customerCode})`, 'success');
    return newCust;
  };

  const updateCustomer = (id: string, cust: Partial<Customer>) => {
    const updated = customers.map(c => c.id === id ? { ...c, ...cust } : c);
    setCustomersState(updated);
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(updated));
    notify('تم تحديث بيانات العميل', '', 'success');
  };

  const deleteCustomer = (id: string) => {
    const updated = customers.filter(c => c.id !== id);
    setCustomersState(updated);
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(updated));
    notify('تم حذف العميل', '', 'info');
  };

  const adjustCustomerPoints = (customerId: string, pointsDelta: number, type: 'earn' | 'redeem' | 'adjust', note: string) => {
    const cust = customers.find(c => c.id === customerId);
    if (!cust) return;
    const newPoints = Math.max(0, cust.points + pointsDelta);
    updateCustomer(customerId, { points: newPoints });
    logAudit('تعديل نقاط العميل', `العميل: ${cust.name} | التغيير: ${pointsDelta > 0 ? '+' : ''}${pointsDelta} | الرصيد الجديد: ${newPoints} | السبب: ${note}`, 'medium');
  };

  const findCustomerByCodeOrPhone = (query: string): Customer | undefined => {
    const clean = query.trim().toLowerCase();
    if (!clean) return undefined;
    return customers.find(c =>
      c.customerCode.toLowerCase() === clean ||
      c.phone.replace(/\s+/g, '').includes(clean.replace(/\s+/g, '')) ||
      c.name.toLowerCase().includes(clean)
    );
  };

  // 8.1 Suppliers & Debt Management (حسابات الموردين والديون)
  const [suppliers, setSuppliersState] = useState<Supplier[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SUPPLIERS);
      return saved ? JSON.parse(saved) : initialSuppliers;
    } catch {
      return initialSuppliers;
    }
  });

  // Automated Periodic Debt Reminder Interval Checker
  useEffect(() => {
    if (!settings.autoSendDebtReminders) return;

    // Run check on mount and then every 30 minutes
    const checkReminders = () => {
      try {
        const count = checkAndSendPeriodicDebtReminders({
          customers,
          storeSettings: settings,
          bulletin: settings.exchangeBulletin,
          onReminderTriggered: (cust) => {
            notify(
              'تذكير آلي بالديون (WhatsApp)',
              `تم إرسال رسالة تذكير دورية لتسديد الدين إلى واتساب العميل ${cust.name} بمبلغ ${cust.currentDebt.toLocaleString()} ${settings.currency.symbol}`,
              'info'
            );
          }
        });
        if (count > 0) {
          console.log(`[Debt Collection] Triggered ${count} automated periodic debt reminders.`);
        }
      } catch (err) {
        console.warn('Periodic debt reminder check error:', err);
      }
    };

    const timer = setTimeout(checkReminders, 4000); // initial check after 4s
    const interval = setInterval(checkReminders, 30 * 60 * 1000); // every 30 minutes

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [customers, settings]);

  // Live Exchange Rates Auto-Sync (موقع الليرة اليوم) for Syrian Lira
  useEffect(() => {
    if (settings.currency.code !== 'SYP') return;

    const fetchLiveBulletin = async () => {
      try {
        const res = await fetchLiveSyrianLiraRates();
        if (res.success && res.rates && res.rates.usdSell > 0) {
          const rates = res.rates;
          setSettingsState(prev => {
            const current = prev.exchangeBulletin || defaultExchangeBulletin;
            // Only update if there are fresh values
            const updatedBulletin: ExchangeRateBulletin = {
              ...current,
              usdBuyRate: rates.usdBuy || current.usdBuyRate,
              usdSellRate: rates.usdSell || current.usdSellRate,
              eurBuyRate: rates.eurBuy || current.eurBuyRate,
              eurSellRate: rates.eurSell || current.eurSellRate,
              goldGram21: rates.goldGram21 || current.goldGram21,
              centralBankOfficialRate: rates.centralBankOfficial || current.centralBankOfficialRate,
              sourceLabel: rates.source || current.sourceLabel,
              lastUpdated: new Date().toISOString()
            };
            const updated = { ...prev, exchangeBulletin: updatedBulletin };
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
            return updated;
          });
        }
      } catch (e) {
        console.warn('Live rate sync silent skip:', e);
      }
    };

    // Initial background sync after 2 seconds
    const rateTimer = setTimeout(fetchLiveBulletin, 2000);
    // Recurring background sync every 15 minutes
    const rateInterval = setInterval(fetchLiveBulletin, 15 * 60 * 1000);

    return () => {
      clearTimeout(rateTimer);
      clearInterval(rateInterval);
    };
  }, [settings.currency.code]);



  const [debtTransactions, setDebtTransactionsState] = useState<DebtTransaction[]>(() => {
    try {
      const isZeroed =
        localStorage.getItem(STORAGE_KEYS.ZEROED_OUT) === 'true' ||
        localStorage.getItem(STORAGE_KEYS.APP_PURCHASED) === 'true';
      const saved = localStorage.getItem(STORAGE_KEYS.DEBT_TRANSACTIONS);
      if (saved !== null) {
        const parsed: DebtTransaction[] = JSON.parse(saved);
        if (isZeroed || parsed.length === 0) {
          return parsed;
        }
        const existingIds = new Set(parsed.map(t => t.id));
        const missingPurchaseInvoices = initialDebtTransactions.filter(
          t => t.partyType === 'supplier' && t.type === 'charge' && !existingIds.has(t.id)
        );
        if (missingPurchaseInvoices.length > 0) {
          const merged = [...parsed, ...missingPurchaseInvoices];
          localStorage.setItem(STORAGE_KEYS.DEBT_TRANSACTIONS, JSON.stringify(merged));
          return merged;
        }
        return parsed;
      }
      return isZeroed ? [] : initialDebtTransactions;
    } catch {
      return [];
    }
  });

  const addSupplier = (supplierData: Omit<Supplier, 'id' | 'createdAt'>): Supplier => {
    const randomCode = `SUP-${Math.floor(100 + Math.random() * 900)}`;
    const newSup: Supplier = {
      ...supplierData,
      id: `sup_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      code: supplierData.code || randomCode,
      currentDebt: Number(supplierData.currentDebt) || 0,
      totalPurchases: Number(supplierData.totalPurchases) || 0,
      createdAt: new Date().toISOString(),
    };
    setSuppliersState(prev => {
      const updated = [newSup, ...prev];
      localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(updated));
      return updated;
    });
    logAudit('إضافة مورد جديد', `المورد: ${newSup.name} (${newSup.code}) - الرصيد الافتتاحي المستحق: ${newSup.currentDebt.toLocaleString()} ${settings.currency.symbol}`, 'medium');
    notify('تم تسجيل المورد بنجاح', newSup.name, 'success');
    return newSup;
  };

  const updateSupplier = (id: string, sup: Partial<Supplier>) => {
    setSuppliersState(prev => {
      const updated = prev.map(s => s.id === id ? { ...s, ...sup } : s);
      localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(updated));
      return updated;
    });
    notify('تم تحديث بيانات المورد', '', 'success');
  };

  const deleteSupplier = (id: string) => {
    const sup = suppliers.find(s => s.id === id);
    if (sup && (sup.currentDebt > 0)) {
      notify('تنبيه', `لا يمكن حذف المورد ${sup.name} لوجود رصيد ذمة مستحق (${sup.currentDebt.toLocaleString()} ${settings.currency.symbol})`, 'warning');
      return;
    }
    const updated = suppliers.filter(s => s.id !== id);
    setSuppliersState(updated);
    localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(updated));
    notify('تم حذف المورد', '', 'info');
  };

  // تسديد دفعة من دين الزبون (سند قبض)
  const recordCustomerDebtPayment = (
    customerId: string,
    amount: number,
    paymentMethod: 'cash' | 'card' | 'transfer' | 'check' = 'cash',
    notes?: string,
    discountAmount: number = 0
  ): DebtTransaction | null => {
    const cust = customers.find(c => c.id === customerId);
    if (!cust) {
      notify('خطأ', 'العميل غير موجود', 'error');
      return null;
    }

    const previousBalance = cust.currentDebt || 0;
    const totalDeducted = amount + (discountAmount || 0);
    const newBalance = Math.max(0, previousBalance - totalDeducted);

    const voucherNumber = `VCH-REC-${new Date().getFullYear().toString().slice(-2)}${String(debtTransactions.length + 1001).padStart(4, '0')}`;

    const newTx: DebtTransaction = {
      id: `dt_${Date.now()}`,
      voucherNumber,
      partyType: 'customer',
      partyId: cust.id,
      partyName: cust.name,
      type: 'payment',
      amount,
      discountAmount,
      previousBalance,
      newBalance,
      paymentMethod,
      notes: notes || 'سند قبض - تسديد دفعة من الدين',
      recordedBy: currentUser.name,
      createdAt: new Date().toISOString(),
    };

    // Update Customer
    updateCustomer(customerId, {
      currentDebt: newBalance,
    });

    // Save transaction
    const updatedTxs = [newTx, ...debtTransactions];
    setDebtTransactionsState(updatedTxs);
    localStorage.setItem(STORAGE_KEYS.DEBT_TRANSACTIONS, JSON.stringify(updatedTxs));

    soundEffects.playSuccess();
    logAudit('تسديد دفعة دين عميل (سند قبض)', `سند رقم: ${voucherNumber} | العميل: ${cust.name} | المبلغ المسدد: ${amount.toLocaleString()} ${settings.currency.symbol} | الرصيد المتبقي: ${newBalance.toLocaleString()}`, 'high');
    notify('تم تسجيل سند القبض بنجاح', `تم قبض ${amount.toLocaleString()} ${settings.currency.symbol} من ${cust.name}`, 'success');

    return newTx;
  };

  // إضافة دين يدوي للزبون
  const addCustomerManualDebt = (
    customerId: string,
    amount: number,
    referenceInvoice?: string,
    notes?: string
  ): DebtTransaction | null => {
    const cust = customers.find(c => c.id === customerId);
    if (!cust) return null;

    const previousBalance = cust.currentDebt || 0;
    const newBalance = previousBalance + amount;

    const voucherNumber = `VCH-CHG-${new Date().getFullYear().toString().slice(-2)}${String(debtTransactions.length + 1001).padStart(4, '0')}`;

    const newTx: DebtTransaction = {
      id: `dt_${Date.now()}`,
      voucherNumber,
      partyType: 'customer',
      partyId: cust.id,
      partyName: cust.name,
      type: 'charge',
      amount,
      previousBalance,
      newBalance,
      paymentMethod: 'cash',
      referenceInvoice,
      notes: notes || 'إضافة قيد دين آجل',
      recordedBy: currentUser.name,
      createdAt: new Date().toISOString(),
    };

    updateCustomer(customerId, {
      currentDebt: newBalance,
    });

    const updatedTxs = [newTx, ...debtTransactions];
    setDebtTransactionsState(updatedTxs);
    localStorage.setItem(STORAGE_KEYS.DEBT_TRANSACTIONS, JSON.stringify(updatedTxs));

    logAudit('إضافة دين على عميل', `العميل: ${cust.name} | المبلغ: ${amount.toLocaleString()} | الرصيد الجديد: ${newBalance.toLocaleString()}`, 'medium');
    notify('تم تقييد الدين على العميل', `${cust.name}: ${newBalance.toLocaleString()} ${settings.currency.symbol}`, 'info');

    return newTx;
  };

  // سداد دفعة للمورد (سند صرف)
  const recordSupplierDebtPayment = (
    supplierId: string,
    amount: number,
    paymentMethod: 'cash' | 'card' | 'transfer' | 'check' = 'cash',
    notes?: string,
    discountAmount: number = 0
  ): DebtTransaction | null => {
    const sup = suppliers.find(s => s.id === supplierId);
    if (!sup) {
      notify('خطأ', 'المورد غير موجود', 'error');
      return null;
    }

    const previousBalance = sup.currentDebt || 0;
    const totalDeducted = amount + (discountAmount || 0);
    const newBalance = Math.max(0, previousBalance - totalDeducted);

    const voucherNumber = `VCH-PAY-${new Date().getFullYear().toString().slice(-2)}${String(debtTransactions.length + 2001).padStart(4, '0')}`;

    const newTx: DebtTransaction = {
      id: `dt_${Date.now()}`,
      voucherNumber,
      partyType: 'supplier',
      partyId: sup.id,
      partyName: sup.name,
      type: 'payment',
      amount,
      discountAmount,
      previousBalance,
      newBalance,
      paymentMethod,
      notes: notes || 'سند صرف - سداد دفعة للمورد',
      recordedBy: currentUser.name,
      createdAt: new Date().toISOString(),
    };

    // Update Supplier
    updateSupplier(supplierId, {
      currentDebt: newBalance,
      lastPaymentDate: new Date().toISOString(),
    });

    // Record automatic expense
    addExpense({
      title: `سداد دفعة للمورد: ${sup.name}`,
      category: 'purchases',
      amount,
      notes: `سند صرف رقم ${voucherNumber} (طريقة الدفع: ${paymentMethod === 'cash' ? 'نقداً' : paymentMethod === 'transfer' ? 'حوالة' : 'شيك'}) - ${notes || ''}`,
      date: new Date().toISOString(),
    });

    // Save transaction
    const updatedTxs = [newTx, ...debtTransactions];
    setDebtTransactionsState(updatedTxs);
    localStorage.setItem(STORAGE_KEYS.DEBT_TRANSACTIONS, JSON.stringify(updatedTxs));

    soundEffects.playSuccess();
    logAudit('سداد دفعة لمورد (سند صرف)', `سند رقم: ${voucherNumber} | المورد: ${sup.name} | المبلغ: ${amount.toLocaleString()} ${settings.currency.symbol} | الرصيد المتبقي: ${newBalance.toLocaleString()}`, 'high');
    notify('تم توثيق سند الصرف بنجاح', `تم سداد ${amount.toLocaleString()} ${settings.currency.symbol} للمورد ${sup.name}`, 'success');

    return newTx;
  };

  // تسجيل فاتورة شراء آجلة من مورد
  const addSupplierInvoiceDebt = (
    supplierId: string,
    amount: number,
    referenceInvoice?: string,
    notes?: string
  ): DebtTransaction | null => {
    const sup = suppliers.find(s => s.id === supplierId);
    if (!sup) return null;

    const previousBalance = sup.currentDebt || 0;
    const newBalance = previousBalance + amount;
    const newTotalPurchases = (sup.totalPurchases || 0) + amount;

    const voucherNumber = `VCH-SUP-INV-${new Date().getFullYear().toString().slice(-2)}${String(debtTransactions.length + 3001).padStart(4, '0')}`;

    const newTx: DebtTransaction = {
      id: `dt_${Date.now()}`,
      voucherNumber,
      partyType: 'supplier',
      partyId: sup.id,
      partyName: sup.name,
      type: 'charge',
      amount,
      previousBalance,
      newBalance,
      paymentMethod: 'cash',
      referenceInvoice,
      notes: notes || 'فاتورة شراء بضاعة بالدين الآجل',
      recordedBy: currentUser.name,
      createdAt: new Date().toISOString(),
    };

    updateSupplier(supplierId, {
      currentDebt: newBalance,
      totalPurchases: newTotalPurchases,
    });

    const updatedTxs = [newTx, ...debtTransactions];
    setDebtTransactionsState(updatedTxs);
    localStorage.setItem(STORAGE_KEYS.DEBT_TRANSACTIONS, JSON.stringify(updatedTxs));

    logAudit('تسجيل فاتورة شراء بالدين لمورد', `المورد: ${sup.name} | المبلغ: ${amount.toLocaleString()} | إجمالي المستحق: ${newBalance.toLocaleString()}`, 'medium');
    notify('تم تسجيل فاتورة الشراء الآجلة', `${sup.name}: +${amount.toLocaleString()} ${settings.currency.symbol}`, 'info');

    return newTx;
  };

  // 9. POS Cart State & Trade Mode
  const [posTradeMode, setPosTradeMode] = useState<'retail' | 'wholesale'>('retail');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [orderDiscount, setOrderDiscount] = useState<{ value: number; type: 'percentage' | 'fixed' }>({ value: 0, type: 'fixed' });
  const [pointsToRedeem, setPointsToRedeem] = useState<number>(0);

  // When a wholesale customer is selected, automatically switch POS to wholesale trade mode
  const handleSelectCustomer = (customer: Customer | null) => {
    setSelectedCustomer(customer);
    if (customer && customer.customerType === 'wholesale') {
      setPosTradeMode('wholesale');
      notify('تم تفعيل وضع بيع الجملة للتاجر', customer.name, 'info');
    }
  };

  const addToCart = (product: Product, quantity: number = 1, forceWholesale?: boolean) => {
    if (product.status === 'inactive') {
      notify('المنتج غير متاح للبيع', product.nameAr, 'warning');
      return;
    }
    
    soundEffects.playClick();

    // Determine if wholesale pricing applies
    const isWholesale = forceWholesale !== undefined
      ? forceWholesale
      : posTradeMode === 'wholesale' || (product.tradeType === 'wholesale');

    const effectiveUnitPrice = isWholesale && product.wholesalePrice !== undefined && product.wholesalePrice > 0
      ? product.wholesalePrice
      : product.price;

    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        const newQty = existing.quantity + quantity;
        return prev.map(item =>
          item.productId === product.id
            ? {
                ...item,
                quantity: newQty,
                unitPrice: effectiveUnitPrice,
                isWholesale,
                wholesaleUnit: isWholesale ? product.wholesaleUnit : undefined,
                total: calculateItemTotal(effectiveUnitPrice, newQty, item.discount, item.discountType)
              }
            : item
        );
      } else {
        const newItem: CartItem = {
          productId: product.id,
          product,
          quantity,
          unitPrice: effectiveUnitPrice,
          discount: product.discount || 0,
          discountType: 'fixed',
          isWholesale,
          wholesaleUnit: isWholesale ? product.wholesaleUnit : undefined,
          wholesaleMultiplier: product.wholesaleUnitMultiplier,
          total: calculateItemTotal(effectiveUnitPrice, quantity, product.discount || 0, 'fixed'),
        };
        return [...prev, newItem];
      }
    });
  };

  const toggleCartItemTradeMode = (productId: string) => {
    setCart(prev =>
      prev.map(item => {
        if (item.productId !== productId) return item;
        const willBeWholesale = !item.isWholesale;
        const newUnitPrice = willBeWholesale && item.product.wholesalePrice
          ? item.product.wholesalePrice
          : item.product.price;

        return {
          ...item,
          isWholesale: willBeWholesale,
          wholesaleUnit: willBeWholesale ? item.product.wholesaleUnit : undefined,
          unitPrice: newUnitPrice,
          total: calculateItemTotal(newUnitPrice, item.quantity, item.discount, item.discountType),
        };
      })
    );
    soundEffects.playClick();
  };

  const calculateItemTotal = (price: number, qty: number, disc: number, discType: 'percentage' | 'fixed'): number => {
    const base = price * qty;
    if (disc <= 0) return base;
    const discountAmt = discType === 'percentage' ? (base * disc) / 100 : disc * qty;
    return Math.max(0, base - discountAmt);
  };

  const updateCartItemQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    soundEffects.playClick();
    setCart(prev =>
      prev.map(item =>
        item.productId === productId
          ? {
              ...item,
              quantity,
              total: calculateItemTotal(item.unitPrice, quantity, item.discount, item.discountType)
            }
          : item
      )
    );
  };

  const updateCartItemDiscount = (productId: string, discount: number, discountType: 'percentage' | 'fixed') => {
    setCart(prev =>
      prev.map(item =>
        item.productId === productId
          ? {
              ...item,
              discount,
              discountType,
              total: calculateItemTotal(item.unitPrice, item.quantity, discount, discountType)
            }
          : item
      )
    );
  };

  const updateCartItemPrice = (productId: string, newPrice: number) => {
    if (newPrice < 0) return;
    soundEffects.playClick();
    setCart(prev =>
      prev.map(item =>
        item.productId === productId
          ? {
              ...item,
              unitPrice: newPrice,
              total: calculateItemTotal(newPrice, item.quantity, item.discount, item.discountType)
            }
          : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    soundEffects.playClick();
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const updateCartItemKitchenNotes = (productId: string, notes: string) => {
    setCart(prev =>
      prev.map(item =>
        item.productId === productId
          ? { ...item, kitchenNotes: notes }
          : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
    setOrderDiscount({ value: 0, type: 'fixed' });
    setPointsToRedeem(0);
    setKitchenNote('');
    setPendingCartQueueNumber(null);
    setPendingCartQueueOrderId(null);
  };

  // 10. Sales & Invoices
  const [sales, setSalesState] = useState<Sale[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SALES);
      return saved ? JSON.parse(saved) : initialSales;
    } catch {
      return initialSales;
    }
  });

  const processSale = (saleData: { paymentMethod: string; paidAmount: number; notes?: string; appliedPromotion?: { promoId: string; title: string } }): Sale | null => {
    if (cart.length === 0) {
      notify('السلة فارغة', 'أضف منتجات إلى السلة قبل إتمام البيع', 'warning');
      return null;
    }

    const subtotal = cart.reduce((acc, it) => acc + (it.unitPrice * it.quantity), 0);
    const itemDiscountsTotal = cart.reduce((acc, it) => acc + ((it.unitPrice * it.quantity) - it.total), 0);
    
    // Order discount
    let additionalDiscount = 0;
    if (orderDiscount.value > 0) {
      additionalDiscount = orderDiscount.type === 'percentage'
        ? ((subtotal - itemDiscountsTotal) * orderDiscount.value) / 100
        : orderDiscount.value;
    }

    // Points discount
    let pointsDiscountAmount = 0;
    if (settings.enableLoyaltyPoints && pointsToRedeem > 0 && selectedCustomer) {
      pointsDiscountAmount = pointsToRedeem * (settings.pointsRedeemRatio || 100);
    }

    const totalDiscounts = itemDiscountsTotal + additionalDiscount + pointsDiscountAmount;
    const afterDiscount = Math.max(0, subtotal - totalDiscounts);
    const taxTotal = settings.enableTax ? (afterDiscount * (settings.defaultTaxRate || 0)) / 100 : 0;
    const grandTotal = Math.round(afterDiscount + taxTotal);

    // Cost & Profit
    const costTotal = cart.reduce((acc, it) => acc + (it.product.costPrice * it.quantity), 0);
    const profitTotal = grandTotal - costTotal;

    // Change and paid calculations (supports Cash, Card, Transfer, Credit, and Split Cash + Credit)
    const isCreditOrSplit =
      saleData.paymentMethod === 'credit' ||
      saleData.paymentMethod === 'آجل' ||
      saleData.paymentMethod === 'split' ||
      saleData.paymentMethod === 'نقد وآجل';
    const rawPaid =
      typeof saleData.paidAmount === 'number'
        ? Math.max(0, saleData.paidAmount)
        : isCreditOrSplit
        ? 0
        : grandTotal;
    const paidAmount = isCreditOrSplit
      ? Math.min(rawPaid, grandTotal)
      : rawPaid >= grandTotal
      ? rawPaid
      : grandTotal;
    const changeAmount = isCreditOrSplit ? 0 : Math.max(0, rawPaid - grandTotal);
    const remainingCreditDebt = isCreditOrSplit ? Math.max(0, grandTotal - paidAmount) : 0;
    const resolvedPaymentMethod: PaymentMethod =
      isCreditOrSplit && paidAmount > 0 && remainingCreditDebt > 0
        ? 'split'
        : isCreditOrSplit && remainingCreditDebt > 0
        ? 'credit'
        : saleData.paymentMethod;

    // Loyalty Points Earned (e.g. 1 point per 10,000 SYP)
    let pointsEarned = 0;
    if (settings.enableLoyaltyPoints && selectedCustomer && grandTotal > 0) {
      const ratio = settings.pointsSpendRatio || 10000;
      pointsEarned = Math.floor(grandTotal / ratio);
    }

    // Trade Type detection
    const wholesaleItemsCount = cart.filter(i => i.isWholesale).length;
    let computedTradeType: 'retail' | 'wholesale' | 'mixed' = 'retail';
    if (wholesaleItemsCount === cart.length) {
      computedTradeType = 'wholesale';
    } else if (wholesaleItemsCount > 0) {
      computedTradeType = 'mixed';
    }

    const isRestaurantSale = businessMode === 'restaurant' || Boolean(pendingCartQueueNumber) || Boolean(pendingCartQueueOrderId);
    const assignedQueueNumber = pendingCartQueueNumber || getNextRestaurantQueueNumber();

    const invoicePrefix = computedTradeType === 'wholesale' ? 'WHS' : 'INV';
    const todayCompact = getLocalTodayDateKey().replace(/-/g, '');
    const invoiceNum = isRestaurantSale
      ? `Q-${String(assignedQueueNumber).padStart(3, '0')}-${invoicePrefix}-${todayCompact.slice(2)}`
      : `Q-${String(assignedQueueNumber).padStart(3, '0')}-${invoicePrefix}-${todayCompact.slice(2)}`;

    const hwDev = getDeviceHardwareInfo();
    const activeRole: DeviceRole = dedicatedDeviceRole || 'master_pos';
    const matchedDev =
      devices.find(d => d.id === hwDev.deviceId) ||
      (dedicatedDeviceRole ? devices.find(d => d.role === dedicatedDeviceRole) : devices.find(d => d.role === 'master_pos'));
    const resolvedSourceDeviceId = matchedDev?.id || hwDev.deviceId;
    const resolvedSourceDeviceName =
      matchedDev?.name ||
      (dedicatedDeviceRole
        ? getDefaultWorkPermissionsForRole(dedicatedDeviceRole).defaultDeviceNameAr
        : `الجهاز الرئيسي (${hwDev.deviceName})`);

    const newSale: Sale = {
      id: `sale_${Date.now()}`,
      invoiceNumber: invoiceNum,
      storeId: settings.storeId,
      branchId: 'branch_main',
      cashierId: currentUser.id,
      cashierName: currentUser.name,
      sourceDeviceId: resolvedSourceDeviceId,
      sourceDeviceName: resolvedSourceDeviceName,
      sourceDeviceRole: activeRole,
      customerId: selectedCustomer?.id,
      customerName: selectedCustomer?.name,
      customerCode: selectedCustomer?.customerCode,
      customerPhone: selectedCustomer?.phone,
      businessMode: isRestaurantSale ? 'restaurant' : businessMode,
      diningType: isRestaurantSale ? restaurantDiningType : undefined,
      tableName: isRestaurantSale && restaurantDiningType === 'dine_in' ? selectedTable : undefined,
      guestCount: isRestaurantSale && restaurantDiningType === 'dine_in' ? guestCount : undefined,
      queueNumber: assignedQueueNumber,
      queueStatus: isRestaurantSale ? 'preparing' : undefined,
      kitchenOrderId: pendingCartQueueOrderId || undefined,
      tradeType: computedTradeType,
      items: cart.map(it => ({
        productId: it.productId,
        productNameAr: it.product.nameAr,
        productNameEn: it.product.nameEn,
        barcode: it.product.barcode,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        costPrice: it.product.costPrice,
        discount: it.discount,
        total: it.total,
        kitchenNotes: it.kitchenNotes,
        isWholesale: it.isWholesale,
        wholesaleUnit: it.wholesaleUnit,
      })),
      subtotal,
      discountTotal: totalDiscounts,
      taxTotal,
      total: grandTotal,
      costTotal,
      profitTotal,
      paymentMethod: resolvedPaymentMethod,
      paidAmount,
      changeAmount,
      pointsEarned,
      pointsRedeemed: pointsToRedeem,
      pointsDiscountAmount,
      status: 'completed',
      notes: saleData.notes || '',
      createdAt: new Date().toISOString(),
    };

    // 1. Deduct Stock automatically
    cart.forEach(item => {
      adjustStock(item.productId, -item.quantity, 'sale', `فاتورة مبيعات ${invoiceNum}`);
    });

    // 2. Update Customer Points & Totals & Debt (if credit)
    if (selectedCustomer) {
      const currentPoints = selectedCustomer.points;
      const netPointsDelta = pointsEarned - pointsToRedeem;
      const updatedPoints = Math.max(0, currentPoints + netPointsDelta);

      const prevDebt = selectedCustomer.currentDebt || 0;
      const newDebt = prevDebt + remainingCreditDebt;

      updateCustomer(selectedCustomer.id, {
        points: updatedPoints,
        totalSpent: selectedCustomer.totalSpent + grandTotal,
        visitCount: selectedCustomer.visitCount + 1,
        currentDebt: newDebt,
        lastPurchaseDate: new Date().toISOString(),
      });

      if (remainingCreditDebt > 0) {
        const creditTx: DebtTransaction = {
          id: `dt_${Date.now()}`,
          voucherNumber: `VCH-INV-${invoiceNum}`,
          partyType: 'customer',
          partyId: selectedCustomer.id,
          partyName: selectedCustomer.name,
          type: 'charge',
          amount: remainingCreditDebt,
          previousBalance: prevDebt,
          newBalance: newDebt,
          paymentMethod: 'cash',
          referenceInvoice: invoiceNum,
          notes:
            paidAmount > 0
              ? `تقسيم فاتورة ${invoiceNum} بين النقد والآجل (إجمالي: ${grandTotal.toLocaleString()} | مدفوع نقداً: ${paidAmount.toLocaleString()} | المتبقي كدين آجل: ${remainingCreditDebt.toLocaleString()})`
              : `مبيعات آجلة بموجب فاتورة ${invoiceNum} (المتبقي كدين: ${remainingCreditDebt.toLocaleString()})`,
          recordedBy: currentUser.name,
          createdAt: new Date().toISOString(),
        };
        const updatedTxs = [creditTx, ...debtTransactions];
        setDebtTransactionsState(updatedTxs);
        localStorage.setItem(STORAGE_KEYS.DEBT_TRANSACTIONS, JSON.stringify(updatedTxs));

        // 📲 AUTOMATED WHATSAPP DEBT COLLECTION TRIGGER
        if (settings.autoSendDebtInvoiceWhatsApp !== false && selectedCustomer.phone) {
          const debtCustomerSnapshot: Customer = {
            ...selectedCustomer,
            currentDebt: newDebt
          };
          const waMessage = buildDebtInvoiceMessage({
            storeSettings: settings,
            customer: debtCustomerSnapshot,
            sale: newSale,
            remainingDebt: remainingCreditDebt,
            bulletin: settings.exchangeBulletin
          });

          sendWhatsAppDebtMessage({
            phone: selectedCustomer.phone,
            message: waMessage,
            customerName: selectedCustomer.name,
            customerId: selectedCustomer.id,
            saleId: newSale.id,
            invoiceNumber: invoiceNum,
            amountDue: remainingCreditDebt,
            totalDebt: newDebt,
            currencySymbol: settings.currency.symbolNative || settings.currency.symbol,
            type: 'invoice_created',
            storeSettings: settings
          }).then(() => {
            notify('واتساب تحصيل الديون الآجلة', `تم إرسال تفاصيل الفاتورة وقائمة الأغراض والدين تلقائياً إلى واتساب ${selectedCustomer.name}`, 'success');
          }).catch(err => {
            console.warn('Auto WhatsApp dispatch error:', err);
          });
        }
      }
    }

    // 3. Save Sale & Update Source Device Live Metrics
    const updatedSales = [newSale, ...sales];
    setSalesState(updatedSales);
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(updatedSales));

    // 3.1 Synchronize Restaurant Queue & Kitchen Order for this numbered invoice
    if (isRestaurantSale && assignedQueueNumber) {
      if (pendingCartQueueOrderId) {
        setKitchenOrders(prev =>
          prev.map(ord =>
            ord.id === pendingCartQueueOrderId
              ? {
                  ...ord,
                  saleId: newSale.id,
                  invoiceNumber: invoiceNum,
                  queueNumber: assignedQueueNumber,
                  waiterConfirmed: true,
                }
              : ord
          )
        );
      } else {
        const autoKitchenOrder: KitchenOrder = {
          id: `k-ord-${Date.now().toString(36)}`,
          orderNumber: `Q-${String(assignedQueueNumber).padStart(3, '0')}`,
          queueNumber: assignedQueueNumber,
          saleId: newSale.id,
          invoiceNumber: invoiceNum,
          sourceDevice: resolvedSourceDeviceName,
          sourceDeviceId: resolvedSourceDeviceId,
          sourceDeviceName: resolvedSourceDeviceName,
          sourceDeviceRole: activeRole,
          customerName: selectedCustomer?.name,
          customerPhone: selectedCustomer?.phone,
          diningType: restaurantDiningType,
          tableName:
            restaurantDiningType === 'dine_in'
              ? selectedTable
              : restaurantDiningType === 'takeaway'
              ? 'طلب سفري'
              : 'طلب توصيل',
          guestCount: restaurantDiningType === 'dine_in' ? guestCount : 1,
          items: cart.map((it, idx) => ({
            id: `ki-${Date.now()}-${idx}`,
            productId: it.productId,
            nameAr: it.product.nameAr,
            nameEn: it.product.nameEn || it.product.nameAr,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            image: it.product.image,
            notes: it.kitchenNotes || '',
            status: 'pending' as const,
            targetDeviceRole: it.product.targetDeviceRole || 'kitchen_display',
            targetDeviceId: it.product.targetDeviceId || '',
            targetDeviceName: it.product.targetStationName || 'المطبخ والكاشير',
          })),
          totalAmount: grandTotal,
          status: 'in_progress',
          createdAt: newSale.createdAt,
          estimatedMinutes: 10,
          notes: saleData.notes || kitchenNote || '',
        };
        setKitchenOrders(prev => [autoKitchenOrder, ...prev]);
        fetch('/api/sync/kitchen-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: autoKitchenOrder }),
        }).catch(() => {});
      }
    }

    setDevices(prev =>
      prev.map(d => {
        if (d.id === resolvedSourceDeviceId || (d.role === activeRole && activeRole === 'master_pos')) {
          const nextCount = (d.salesCount || 0) + 1;
          const nextTotal = (d.totalSalesAmount || 0) + grandTotal;
          return {
            ...d,
            isOnline: true,
            lastSeen: new Date().toISOString(),
            salesCount: nextCount,
            totalSalesAmount: nextTotal,
            lastActivitySummary: `أصدر فاتورة ${invoiceNum} بقيمة ${grandTotal.toLocaleString()} ${settings.currency.symbol}`,
            lastActivityAt: new Date().toISOString(),
          };
        }
        return d;
      })
    );

    // Automatically share sale & updated inventory with Master Device and all connected Sub-Devices
    try {
      broadcastChannelRef.current?.postMessage({
        type: 'MESH_AUTO_DATA_SYNC',
        payload: {
          eventType: 'SALE_CREATED',
          sourceDeviceId: resolvedSourceDeviceId,
          sourceDeviceName: resolvedSourceDeviceName,
          sourceDeviceRole: activeRole,
          sale: newSale,
          sales: updatedSales,
          timestamp: new Date().toISOString(),
        },
      });
    } catch {}

    fetch('/api/devices/mesh-sync/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'SALE_CREATED',
        sourceDeviceId: resolvedSourceDeviceId,
        sourceDeviceName: resolvedSourceDeviceName,
        sourceDeviceRole: activeRole,
        boundSubscriptionCode: licenseKey || 'TRIAL',
        sale: newSale,
        sales: updatedSales,
        products,
        customers,
      }),
    }).catch(() => {});

    // Update active cash shift
    if (activeShift) {
      const isCash = resolvedPaymentMethod === 'cash';
      const isCard = resolvedPaymentMethod === 'card';
      const cashAmount = isCash ? grandTotal : isCreditOrSplit ? paidAmount : 0;
      const cardAmount = isCard ? grandTotal : 0;
      const creditAmount = isCreditOrSplit ? remainingCreditDebt : 0;

      const updatedShifts = shifts.map(s => {
        if (s.id !== activeShift.id) return s;
        const nextCashSales = (s.cashSales || 0) + cashAmount;
        const nextCardSales = (s.cardSales || 0) + cardAmount;
        const nextCreditSales = (s.creditSales || 0) + creditAmount;
        const nextExpectedCash = s.openingFloat + nextCashSales + (s.cashIn || 0) + (s.debtCashCollected || 0) - (s.cashOut || 0) - (s.expensesCash || 0) - (s.refundsCash || 0);
        const shiftTx: CashShiftTransaction = {
          id: `st_sale_${Date.now()}`,
          type: 'sale',
          amount: cashAmount,
          reason:
            resolvedPaymentMethod === 'split'
              ? `فاتورة مقسمة نقد + آجل ${invoiceNum} (نقداً: ${cashAmount.toLocaleString()} | آجل: ${creditAmount.toLocaleString()})`
              : `فاتورة مبيعات ${invoiceNum} (${resolvedPaymentMethod})`,
          performedBy: currentUser.name,
          timestamp: new Date().toISOString(),
          referenceId: newSale.id
        };
        return {
          ...s,
          cashSales: nextCashSales,
          cardSales: nextCardSales,
          creditSales: nextCreditSales,
          expectedCash: nextExpectedCash,
          transactions: [shiftTx, ...(s.transactions || [])]
        };
      });
      setShiftsState(updatedShifts);
      localStorage.setItem(STORAGE_KEYS.CASH_SHIFTS, JSON.stringify(updatedShifts));
    }

    // Update promo usage count if applied
    if (saleData.appliedPromotion) {
      setPromotionsState(prev => {
        const next = prev.map(p => p.id === saleData.appliedPromotion?.promoId ? { ...p, usageCount: (p.usageCount || 0) + 1 } : p);
        localStorage.setItem(STORAGE_KEYS.PROMOTIONS, JSON.stringify(next));
        return next;
      });
    }

    // Offline caching & queuing
    try {
      indexedDbService.cacheAllData({ sales: updatedSales });
      if (!navigator.onLine) {
        indexedDbService.enqueueOfflineAction('CREATE_SALE', newSale);
        setOfflineQueueCount(prev => prev + 1);
      }
    } catch {}

    // 4. Log Audit
    logAudit('عملية بيع جديدة', `فاتورة ${invoiceNum} (${computedTradeType === 'wholesale' ? 'جملة' : 'مفرق'}) بقيمة ${grandTotal} (${saleData.paymentMethod}) - الكاشير: ${currentUser.name}`, 'low');

    // 5. Sound & Clear
    soundEffects.playSuccess();
    clearCart();

    return newSale;
  };

  // 11. Refunds & Returns
  const [refunds, setRefundsState] = useState<Refund[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.REFUNDS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const processRefund = (refundData: {
    originalSaleId: string;
    invoiceNumber: string;
    items: { productId: string; quantity: number; unitPrice: number; total: number; productName: string }[];
    totalRefundAmount: number;
    reason: string;
    restock: boolean;
    refundMethod?: string;
  }): Refund | null => {
    const refundNum = `REF-${new Date().getFullYear()}-${String(refunds.length + 1).padStart(5, '0')}`;

    const newRefund: Refund = {
      id: `ref_${Date.now()}`,
      refundNumber: refundNum,
      originalSaleId: refundData.originalSaleId,
      invoiceNumber: refundData.invoiceNumber,
      items: refundData.items,
      totalRefundAmount: refundData.totalRefundAmount,
      reason: refundData.reason,
      restock: refundData.restock,
      cashierId: currentUser.id,
      cashierName: currentUser.name,
      createdAt: new Date().toISOString(),
    };

    // Restock returned items if requested
    if (refundData.restock) {
      refundData.items.forEach(item => {
        adjustStock(item.productId, item.quantity, 'return', `مرتجع فاتورة ${refundData.invoiceNumber} - إشعار ${refundNum}`);
      });
    }

    // Update Sale status to refunded/partially_refunded
    const updatedSales = sales.map(s => {
      if (s.id === refundData.originalSaleId) {
        return {
          ...s,
          status: 'refunded' as const,
        };
      }
      return s;
    });
    setSalesState(updatedSales);
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(updatedSales));

    // Save Refund
    const updatedRefunds = [newRefund, ...refunds];
    setRefundsState(updatedRefunds);
    localStorage.setItem(STORAGE_KEYS.REFUNDS, JSON.stringify(updatedRefunds));

    // Update active cash shift if refund paid in cash
    if (activeShift && refundData.refundMethod === 'cash') {
      const updatedShifts = shifts.map(s => {
        if (s.id !== activeShift.id) return s;
        const nextRefunds = (s.refundsCash || 0) + refundData.totalRefundAmount;
        const nextExpectedCash = s.openingFloat + (s.cashSales || 0) + (s.cashIn || 0) + (s.debtCashCollected || 0) - (s.cashOut || 0) - (s.expensesCash || 0) - nextRefunds;
        const shiftTx: CashShiftTransaction = {
          id: `st_ref_${Date.now()}`,
          type: 'refund',
          amount: refundData.totalRefundAmount,
          reason: `مرتجع مبيعات نقدي - إشعار ${refundNum}`,
          performedBy: currentUser.name,
          timestamp: new Date().toISOString()
        };
        return {
          ...s,
          refundsCash: nextRefunds,
          expectedCash: nextExpectedCash,
          transactions: [shiftTx, ...(s.transactions || [])]
        };
      });
      setShiftsState(updatedShifts);
      localStorage.setItem(STORAGE_KEYS.CASH_SHIFTS, JSON.stringify(updatedShifts));
    }

    logAudit('عملية إرجاع فاتورة', `إرجاع رقم ${refundNum} للفاتورة ${refundData.invoiceNumber} بمبلغ ${refundData.totalRefundAmount}`, 'high');
    notify('تم إتمام المرتجع بنجاح', `إشعار استرجاع رقم ${refundNum}`, 'success');

    return newRefund;
  };

  const processReturn = (returnData: {
    originalSaleId: string;
    items: { productId: string; quantity: number; unitPrice?: number; total?: number; productNameAr?: string; productName?: string }[];
    reason?: string;
    restockItems?: boolean;
    restock?: boolean;
  }) => {
    const sale = (sales || []).find(s => s.id === returnData.originalSaleId);
    const invoiceNumber = sale ? sale.invoiceNumber : `INV-${returnData.originalSaleId}`;
    const itemsFormatted = (returnData.items || []).map(it => {
      const p = (products || []).find(prod => prod.id === it.productId);
      const name = it.productNameAr || it.productName || (p ? p.nameAr : 'صنف');
      const unitPrice = it.unitPrice !== undefined ? it.unitPrice : (p ? p.price : 0);
      const total = it.total !== undefined ? it.total : (unitPrice * it.quantity);
      return {
        productId: it.productId,
        productName: name,
        quantity: it.quantity,
        unitPrice,
        total,
      };
    });
    const totalRefundAmount = itemsFormatted.reduce((acc, it) => acc + it.total, 0);

    const ref = processRefund({
      originalSaleId: returnData.originalSaleId,
      invoiceNumber,
      items: itemsFormatted,
      totalRefundAmount,
      reason: returnData.reason || 'إرجاع بضاعة',
      restock: returnData.restockItems !== undefined ? returnData.restockItems : (returnData.restock ?? true),
    });

    if (!ref) return null;

    return {
      ...ref,
      returnNumber: ref.refundNumber,
      originalInvoiceNumber: ref.invoiceNumber,
      totalRefund: ref.totalRefundAmount,
    };
  };

  // 12. Inventory Logs
  const [inventoryLogs, setInventoryLogsState] = useState<InventoryTransaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INVENTORY_LOGS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const adjustStock = (
    productId: string,
    quantityDeltaOrType: number | StockMovementType,
    typeOrDelta?: StockMovementType | number,
    reason?: string
  ) => {
    const product = (products || []).find(p => p.id === productId);
    if (!product) return;

    let quantityDelta = 0;
    let type: StockMovementType = 'adjustment';
    let logReason = reason || 'تعديل مخزون';

    if (typeof quantityDeltaOrType === 'number') {
      quantityDelta = quantityDeltaOrType;
      if (typeof typeOrDelta === 'string') {
        type = typeOrDelta as StockMovementType;
      }
    } else if (typeof quantityDeltaOrType === 'string') {
      type = quantityDeltaOrType as StockMovementType;
      const amount = typeof typeOrDelta === 'number' ? typeOrDelta : 1;
      if (type === 'purchase' || type === 'restock' || type === 'return') {
        quantityDelta = Math.abs(amount);
      } else {
        quantityDelta = -Math.abs(amount);
      }
    }

    const previousStock = product.stock || 0;
    const newStock = Math.max(0, previousStock + quantityDelta);

    // Update product stock atomically
    setProductsState(prev => {
      const updated = prev.map(p =>
        p.id === productId
          ? { ...p, stock: Math.max(0, (p.stock || 0) + quantityDelta), updatedAt: new Date().toISOString() }
          : p
      );
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));
      return updated;
    });

    // Record inventory transaction
    const log: InventoryTransaction = {
      id: `inv_log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      productId,
      productName: product.nameAr,
      type,
      quantity: quantityDelta,
      previousStock,
      newStock,
      reason: logReason,
      userId: currentUser.id,
      userName: currentUser.name,
      createdAt: new Date().toISOString(),
    };

    setInventoryLogsState(prev => {
      const updatedLogs = [log, ...(prev || [])];
      localStorage.setItem(STORAGE_KEYS.INVENTORY_LOGS, JSON.stringify(updatedLogs));
      return updatedLogs;
    });

    // Alert if stock is low
    if (newStock <= product.minStock && newStock > 0 && quantityDelta < 0) {
      notify('تنبيه مخزون منخفض', `المنتج (${product.nameAr}) قارب على النفاد! المتبقي: ${newStock} ${product.unit}`, 'warning');
    } else if (newStock === 0 && quantityDelta < 0) {
      notify('نفد المخزون بالكامل', `المنتج (${product.nameAr}) نفد من المخزون`, 'error');
    }
  };

  // 13. Expenses
  const [expenses, setExpensesState] = useState<Expense[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EXPENSES);
      return saved ? JSON.parse(saved) : initialExpenses;
    } catch {
      return initialExpenses;
    }
  });

  const addExpense = (expenseData: Omit<Expense, 'id' | 'createdAt' | 'recordedBy'>) => {
    const newExp: Expense = {
      ...expenseData,
      id: `exp_${Date.now()}`,
      recordedBy: currentUser.name,
      createdAt: new Date().toISOString(),
    };
    const updated = [newExp, ...expenses];
    setExpensesState(updated);
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(updated));

    // Update active cash shift if expense paid in cash from drawer
    if (activeShift && expenseData.paymentMethod === 'cash') {
      const updatedShifts = shifts.map(s => {
        if (s.id !== activeShift.id) return s;
        const nextExpenses = (s.expensesCash || 0) + expenseData.amount;
        const nextExpectedCash = s.openingFloat + (s.cashSales || 0) + (s.cashIn || 0) + (s.debtCashCollected || 0) - (s.cashOut || 0) - nextExpenses - (s.refundsCash || 0);
        const shiftTx: CashShiftTransaction = {
          id: `st_exp_${Date.now()}`,
          type: 'cash_out',
          amount: expenseData.amount,
          reason: `مصروف نقدي من الدرج: ${expenseData.title}`,
          performedBy: currentUser.name,
          timestamp: new Date().toISOString()
        };
        return {
          ...s,
          expensesCash: nextExpenses,
          expectedCash: nextExpectedCash,
          transactions: [shiftTx, ...(s.transactions || [])]
        };
      });
      setShiftsState(updatedShifts);
      localStorage.setItem(STORAGE_KEYS.CASH_SHIFTS, JSON.stringify(updatedShifts));
    }
    logAudit('تسجيل مصروف جديد', `البيان: ${newExp.title} - المبلغ: ${newExp.amount}`, 'medium');
    notify('تم تسجيل المصروف بنجاح', newExp.title, 'success');
  };

  const deleteExpense = (id: string) => {
    const updated = expenses.filter(e => e.id !== id);
    setExpensesState(updated);
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(updated));
    notify('تم حذف المصروف', '', 'info');
  };

  // نظام الشراء المتكامل من الشركات والموردين (توريد مخزون + تحديث أسعار الشراء والجملة والمفرق + ذمم الموردين)
  const recordSupplierPurchaseInvoice = (payload: {
    supplierMode: 'existing' | 'new';
    supplierId?: string;
    newSupplierName?: string;
    newSupplierCompany?: string;
    newSupplierPhone?: string;
    newSupplierCategory?: string;
    referenceInvoice?: string;
    paymentType: 'credit' | 'cash' | 'partial';
    paidAmount: number;
    paymentMethod?: 'cash' | 'card' | 'transfer' | 'check';
    notes?: string;
    items: {
      mode: 'existing' | 'new';
      productId?: string;
      productName: string;
      categoryId?: string;
      barcode?: string;
      unit?: string;
      quantity: number;
      costPrice: number;
      wholesalePrice: number;
      retailPrice: number;
      minStock?: number;
    }[];
    manualTotalAmount?: number;
  }): { supplier: Supplier; totalAmount: number; remainingDebt: number; updatedProductsCount: number } | null => {
    const nowIso = new Date().toISOString();

    // 1. Resolve or create supplier
    let targetSupplier: Supplier | undefined;
    if (payload.supplierMode === 'new') {
      const supName = (payload.newSupplierName || payload.newSupplierCompany || '').trim();
      if (!supName) {
        notify('بيانات ناقصة', 'يرجى إدخال اسم المورد أو الشركة', 'warning');
        return null;
      }
      const randomCode = `SUP-${Math.floor(100 + Math.random() * 900)}`;
      targetSupplier = {
        id: `sup_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        code: randomCode,
        name: supName,
        companyName: (payload.newSupplierCompany || supName).trim(),
        phone: (payload.newSupplierPhone || '').trim(),
        category: payload.newSupplierCategory || 'توريد عام',
        currentDebt: 0,
        totalPurchases: 0,
        createdAt: nowIso,
      };
    } else {
      targetSupplier = suppliers.find(s => s.id === payload.supplierId);
      if (!targetSupplier) {
        notify('بيانات ناقصة', 'يرجى اختيار المورد أو الشركة', 'warning');
        return null;
      }
    }

    // 2. Calculate totals from items or manual amount
    const validItems = (payload.items || []).filter(item =>
      item.quantity > 0 && (item.mode === 'existing' ? Boolean(item.productId) : Boolean(item.productName?.trim()))
    );

    const itemsTotal = validItems.reduce(
      (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.costPrice) || 0),
      0
    );

    const totalAmount = validItems.length > 0 ? itemsTotal : (Number(payload.manualTotalAmount) || 0);
    if (totalAmount <= 0 && validItems.length === 0) {
      notify('قيمة الفاتورة غير صالحة', 'يرجى إضافة أصناف للفاتورة أو تحديد إجمالي الفاتورة', 'warning');
      return null;
    }

    let paid = 0;
    if (payload.paymentType === 'cash') {
      paid = totalAmount;
    } else if (payload.paymentType === 'credit') {
      paid = 0;
    } else {
      paid = Math.min(totalAmount, Math.max(0, Number(payload.paidAmount) || 0));
    }
    const remainingDebt = Math.max(0, totalAmount - paid);

    // 3. Update existing products & create new products atomically + generate inventory logs
    const newLogs: InventoryTransaction[] = [];
    const createdProducts: Product[] = [];

    if (validItems.length > 0) {
      setProductsState(prev => {
        const updatedList = prev.map(p => {
          const matchingItems = validItems.filter(it => it.mode === 'existing' && it.productId === p.id);
          if (matchingItems.length === 0) return p;

          let addedQty = 0;
          let latestCost = p.costPrice;
          let latestWholesale = p.wholesalePrice ?? p.price;
          let latestRetail = p.price;

          matchingItems.forEach(it => {
            const q = Math.max(1, Number(it.quantity) || 1);
            addedQty += q;
            if (Number(it.costPrice) > 0) latestCost = Number(it.costPrice);
            if (Number(it.wholesalePrice) > 0) latestWholesale = Number(it.wholesalePrice);
            if (Number(it.retailPrice) > 0) latestRetail = Number(it.retailPrice);
          });

          const previousStock = Number(p.stock) || 0;
          const newStock = previousStock + addedQty;

          newLogs.push({
            id: `inv_log_${Date.now()}_${p.id}_${Math.random().toString(36).slice(2, 5)}`,
            productId: p.id,
            productName: p.nameAr,
            type: 'purchase',
            quantity: addedQty,
            previousStock,
            newStock,
            reason: `فاتورة شراء من ${targetSupplier!.name}${payload.referenceInvoice ? ` (#${payload.referenceInvoice})` : ''}`,
            userId: currentUser.id,
            userName: currentUser.name,
            createdAt: nowIso,
          });

          return {
            ...p,
            stock: newStock,
            costPrice: latestCost,
            wholesalePrice: latestWholesale,
            price: latestRetail,
            tradeType: 'both' as TradeType,
            updatedAt: nowIso,
          };
        });

        validItems
          .filter(it => it.mode === 'new' && it.productName.trim())
          .forEach((it, idx) => {
            const qty = Math.max(1, Number(it.quantity) || 1);
            const costPrice = Math.max(0, Number(it.costPrice) || 0);
            const retailPrice = Math.max(0, Number(it.retailPrice) || Number(it.wholesalePrice) || costPrice);
            const wholesalePrice = Math.max(0, Number(it.wholesalePrice) || costPrice);
            const prodId = `prod_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 5)}`;
            const generatedBarcode = it.barcode?.trim() || `${Math.floor(620000000000 + Math.random() * 99999999999)}`;

            const newProd: Product = {
              id: prodId,
              nameAr: it.productName.trim(),
              nameEn: it.productName.trim(),
              barcode: generatedBarcode,
              sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
              categoryId: it.categoryId || categories[0]?.id || 'cat_1',
              costPrice,
              wholesalePrice,
              price: retailPrice,
              wholesaleMinQty: 5,
              wholesaleUnit: 'كرتونة',
              wholesaleUnitMultiplier: 12,
              tradeType: 'both',
              stock: qty,
              minStock: Number(it.minStock) || 5,
              unit: it.unit || 'قطعة',
              isFavorite: false,
              status: 'active',
              createdAt: nowIso,
              updatedAt: nowIso,
            };

            createdProducts.push(newProd);
            newLogs.push({
              id: `inv_log_${Date.now()}_new_${idx}`,
              productId: prodId,
              productName: newProd.nameAr,
              type: 'purchase',
              quantity: qty,
              previousStock: 0,
              newStock: qty,
              reason: `توريد صنف جديد من المورد ${targetSupplier!.name}${payload.referenceInvoice ? ` (#${payload.referenceInvoice})` : ''}`,
              userId: currentUser.id,
              userName: currentUser.name,
              createdAt: nowIso,
            });
          });

        const finalProducts = [...createdProducts, ...updatedList];
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(finalProducts));
        return finalProducts;
      });

      if (newLogs.length > 0) {
        setInventoryLogsState(prev => {
          const updatedLogs = [...newLogs, ...(prev || [])];
          localStorage.setItem(STORAGE_KEYS.INVENTORY_LOGS, JSON.stringify(updatedLogs));
          return updatedLogs;
        });
      }
    }

    // 4. Update Supplier balance & totalPurchases
    const previousBalance = targetSupplier.currentDebt || 0;
    const finalBalance = previousBalance + remainingDebt;
    const finalTotalPurchases = (targetSupplier.totalPurchases || 0) + totalAmount;

    const updatedSupplierObj: Supplier = {
      ...targetSupplier,
      currentDebt: finalBalance,
      totalPurchases: finalTotalPurchases,
      lastPaymentDate: paid > 0 ? nowIso : targetSupplier.lastPaymentDate,
    };

    setSuppliersState(prev => {
      const exists = prev.some(s => s.id === updatedSupplierObj.id);
      const updated = exists
        ? prev.map(s => (s.id === updatedSupplierObj.id ? updatedSupplierObj : s))
        : [updatedSupplierObj, ...prev];
      localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(updated));
      return updated;
    });

    // 5. Record Debt Transaction(s)
    const itemsSummaryText =
      validItems.length > 0
        ? `توريد (${validItems.length} أصناف): ` +
          validItems.map(i => `${i.productName} × ${i.quantity}`).join('، ')
        : 'فاتورة شراء بضاعة من المورد';

    const fullNotes = [itemsSummaryText, payload.notes?.trim()].filter(Boolean).join(' — ');
    const invVoucher = `VCH-SUP-INV-${new Date().getFullYear().toString().slice(-2)}${String(debtTransactions.length + 3001).padStart(4, '0')}`;

    const newTxs: DebtTransaction[] = [];

    // Charge transaction for the invoice
    const chargeTx: DebtTransaction = {
      id: `dt_chg_${Date.now()}`,
      voucherNumber: invVoucher,
      partyType: 'supplier',
      partyId: updatedSupplierObj.id,
      partyName: updatedSupplierObj.name,
      type: 'charge',
      amount: totalAmount,
      paidAmount: paid,
      remainingDebt,
      paymentStatus: payload.paymentType,
      purchaseItems: validItems.map(it => ({
        productId: it.productId,
        productName: it.productName.trim(),
        barcode: it.barcode,
        unit: it.unit || 'قطعة',
        quantity: Number(it.quantity) || 1,
        costPrice: Number(it.costPrice) || 0,
        wholesalePrice: Number(it.wholesalePrice) || 0,
        retailPrice: Number(it.retailPrice) || 0,
        totalCost: (Number(it.quantity) || 1) * (Number(it.costPrice) || 0),
      })),
      previousBalance,
      newBalance: previousBalance + totalAmount,
      paymentMethod: payload.paymentMethod || 'cash',
      referenceInvoice: payload.referenceInvoice,
      notes: fullNotes,
      recordedBy: currentUser.name,
      createdAt: nowIso,
    };
    newTxs.push(chargeTx);

    // If paid (cash or partial), also record the payment voucher and expense
    if (paid > 0) {
      const payVoucher = `VCH-PAY-${new Date().getFullYear().toString().slice(-2)}${String(debtTransactions.length + 2002).padStart(4, '0')}`;
      const payTx: DebtTransaction = {
        id: `dt_pay_${Date.now() + 1}`,
        voucherNumber: payVoucher,
        partyType: 'supplier',
        partyId: updatedSupplierObj.id,
        partyName: updatedSupplierObj.name,
        type: 'payment',
        amount: paid,
        previousBalance: previousBalance + totalAmount,
        newBalance: finalBalance,
        paymentMethod: payload.paymentMethod || 'cash',
        referenceInvoice: payload.referenceInvoice,
        notes: `دفعة مسددة من فاتورة شراء (${payload.paymentType === 'cash' ? 'نقداً بالكامل' : 'دفعة جزئية'}) - ${itemsSummaryText}`,
        recordedBy: currentUser.name,
        createdAt: nowIso,
      };
      newTxs.unshift(payTx);

      // Record in expenses
      const newExp: Expense = {
        id: `exp_${Date.now()}`,
        title: `مشتريات بضاعة من المورد: ${updatedSupplierObj.name}`,
        category: 'purchases',
        amount: paid,
        paymentMethod: payload.paymentMethod || 'cash',
        date: nowIso,
        notes: `${fullNotes} (سند ${payVoucher})`,
        recordedBy: currentUser.name,
        createdAt: nowIso,
      };
      setExpensesState(prev => {
        const updatedExp = [newExp, ...prev];
        localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(updatedExp));
        return updatedExp;
      });
    }

    setDebtTransactionsState(prev => {
      const updatedTxs = [...newTxs, ...prev];
      localStorage.setItem(STORAGE_KEYS.DEBT_TRANSACTIONS, JSON.stringify(updatedTxs));
      return updatedTxs;
    });

    soundEffects.playSuccess();
    logAudit(
      'فاتورة شراء وتوريد بضاعة من مورد',
      `المورد: ${updatedSupplierObj.name} | الأصناف: ${validItems.length} | الإجمالي: ${totalAmount.toLocaleString()} | المسدد: ${paid.toLocaleString()} | المتبقي ذمة: ${remainingDebt.toLocaleString()}`,
      'high'
    );
    notify(
      'تم اعتماد فاتورة الشراء وتحديث المخزون',
      `${updatedSupplierObj.name} • تم توريد ${validItems.length} صنف بإجمالي ${totalAmount.toLocaleString()} ${settings.currency.symbol}`,
      'success'
    );

    return {
      supplier: updatedSupplierObj,
      totalAmount,
      remainingDebt,
      updatedProductsCount: validItems.length,
    };
  };

  // 14. Audit Logs
  const [auditLogs, setAuditLogsState] = useState<AuditLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      return saved ? JSON.parse(saved) : initialAuditLogs;
    } catch {
      return initialAuditLogs;
    }
  });

  const logAudit = (action: string, details: string, severity: 'low' | 'medium' | 'high' | 'critical' = 'low', previousData?: string, newData?: string) => {
    const newLog: AuditLog = {
      id: `log_${Date.now()}`,
      userId: currentUser?.id || 'system',
      userName: currentUser?.name || 'النظام',
      userRole: currentUser?.role || 'system',
      action,
      details,
      severity,
      previousData,
      newData,
      timestamp: new Date().toISOString(),
    };
    const updated = [newLog, ...auditLogs.slice(0, 499)]; // Keep latest 500 logs
    setAuditLogsState(updated);
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(updated));
  };

  // 15. In-App Notifications & Persistent Improvements Changelog
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      const readMapSaved = localStorage.getItem('kian_notifications_read_map');
      const readMap: Record<string, boolean> = readMapSaved ? JSON.parse(readMapSaved) : {};

      // Prepare changelog with user read state
      const changelog = SYSTEM_IMPROVEMENTS_CHANGELOG.map(item => ({
        ...item,
        read: readMap[item.id] !== undefined ? readMap[item.id] : item.read
      }));

      if (saved) {
        const parsed: AppNotification[] = JSON.parse(saved);
        // Ensure all permanent changelog items exist in list
        const existingIds = new Set(parsed.map(n => n.id));
        const missingChangelog = changelog.filter(c => !existingIds.has(c.id));
        const merged = parsed.map(p => {
          const matchingChangelog = changelog.find(c => c.id === p.id);
          if (matchingChangelog) {
            return {
              ...matchingChangelog,
              read: p.read
            };
          }
          return p;
        });
        return [...missingChangelog, ...merged];
      }
      return changelog;
    } catch {
      return SYSTEM_IMPROVEMENTS_CHANGELOG;
    }
  });

  const notify = (
    title: string,
    message: string,
    type: 'success' | 'info' | 'warning' | 'error' = 'info',
    category: 'improvement' | 'feature' | 'system_update' | 'alert' = 'alert',
    badge?: string
  ) => {
    let resolvedTitle = title;
    let resolvedType = type;
    if (title === 'success' || title === 'info' || title === 'warning' || title === 'error') {
      resolvedType = title;
      resolvedTitle =
        title === 'success'
          ? 'تم بنجاح'
          : title === 'warning'
          ? 'تنبيه'
          : title === 'error'
          ? 'خطأ'
          : 'إشعار';
    }
    const newNotif: AppNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: resolvedTitle,
      message,
      type: resolvedType,
      category,
      badge,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications(prev => {
      const updated = [newNotif, ...prev.slice(0, 99)];
      try {
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
      try {
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
        const readMapSaved = localStorage.getItem('kian_notifications_read_map');
        const readMap: Record<string, boolean> = readMapSaved ? JSON.parse(readMapSaved) : {};
        readMap[id] = true;
        localStorage.setItem('kian_notifications_read_map', JSON.stringify(readMap));
      } catch {}
      return updated;
    });
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      try {
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
        const readMap: Record<string, boolean> = {};
        updated.forEach(n => { readMap[n.id] = true; });
        localStorage.setItem('kian_notifications_read_map', JSON.stringify(readMap));
      } catch {}
      return updated;
    });
  };

  const clearAllNotifications = () => {
    // Keep permanent system improvements changelog, but mark everything as read
    setNotifications(prev => {
      const permanentItems = prev.filter(n => n.isPermanent).map(n => ({ ...n, read: true }));
      const fallback = SYSTEM_IMPROVEMENTS_CHANGELOG.map(n => ({ ...n, read: true }));
      const itemsToKeep = permanentItems.length > 0 ? permanentItems : fallback;
      try {
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(itemsToKeep));
      } catch {}
      return itemsToKeep;
    });
  };

  // 16. Wholesale Warehouses State & Management
  const [wholesaleWarehouses, setWholesaleWarehousesState] = useState<WholesaleWarehouse[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.WHOLESALE_WAREHOUSES);
      return saved ? JSON.parse(saved) : initialWholesaleWarehouses;
    } catch {
      return initialWholesaleWarehouses;
    }
  });

  const addWholesaleWarehouse = (whData: Omit<WholesaleWarehouse, 'id' | 'createdAt'>) => {
    const newWh: WholesaleWarehouse = {
      ...whData,
      id: `wh_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [...wholesaleWarehouses, newWh];
    setWholesaleWarehousesState(updated);
    localStorage.setItem(STORAGE_KEYS.WHOLESALE_WAREHOUSES, JSON.stringify(updated));
    logAudit('إضافة مستودع جملة جديد', `اسم المستودع: ${newWh.nameAr} - الرمز: ${newWh.code}`, 'medium');
    notify('تمت إضافة مستودع الجملة بنجاح', newWh.nameAr, 'success');
    return newWh;
  };

  const updateWholesaleWarehouse = (id: string, whData: Partial<WholesaleWarehouse>) => {
    const updated = wholesaleWarehouses.map(w => w.id === id ? { ...w, ...whData } : w);
    setWholesaleWarehousesState(updated);
    localStorage.setItem(STORAGE_KEYS.WHOLESALE_WAREHOUSES, JSON.stringify(updated));
    notify('تم تحديث بيانات مستودع الجملة', '', 'success');
  };

  const deleteWholesaleWarehouse = (id: string) => {
    const updated = wholesaleWarehouses.filter(w => w.id !== id);
    setWholesaleWarehousesState(updated);
    localStorage.setItem(STORAGE_KEYS.WHOLESALE_WAREHOUSES, JSON.stringify(updated));
    notify('تم حذف مستودع الجملة', '', 'info');
  };

  // 17. Delivery & Transport Vehicles Fleet State
  const [deliveryVehicles, setDeliveryVehiclesState] = useState<DeliveryVehicle[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DELIVERY_VEHICLES);
      return saved ? JSON.parse(saved) : initialDeliveryVehicles;
    } catch {
      return initialDeliveryVehicles;
    }
  });

  const addDeliveryVehicle = (vehData: Omit<DeliveryVehicle, 'id' | 'createdAt'>) => {
    const newVeh: DeliveryVehicle = {
      ...vehData,
      id: `veh_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [newVeh, ...deliveryVehicles];
    setDeliveryVehiclesState(updated);
    localStorage.setItem(STORAGE_KEYS.DELIVERY_VEHICLES, JSON.stringify(updated));
    logAudit('إضافة سيارة نقل وتوزيع جديدة', `السيارة: ${newVeh.modelName} - اللوحة: ${newVeh.plateNumber} - السائق: ${newVeh.driverName}`, 'medium');
    notify('تمت إضافة سيارة النقل بنجاح', `${newVeh.modelName} (${newVeh.driverName})`, 'success');
    return newVeh;
  };

  const updateDeliveryVehicle = (id: string, vehData: Partial<DeliveryVehicle>) => {
    const updated = deliveryVehicles.map(v => v.id === id ? { ...v, ...vehData } : v);
    setDeliveryVehiclesState(updated);
    localStorage.setItem(STORAGE_KEYS.DELIVERY_VEHICLES, JSON.stringify(updated));
    notify('تم تحديث بيانات سيارة النقل', '', 'success');
  };

  const deleteDeliveryVehicle = (id: string) => {
    const updated = deliveryVehicles.filter(v => v.id !== id);
    setDeliveryVehiclesState(updated);
    localStorage.setItem(STORAGE_KEYS.DELIVERY_VEHICLES, JSON.stringify(updated));
    notify('تم حذف سيارة النقل من الأسطول', '', 'info');
  };

  const updateVehicleStatus = (vehicleId: string, status: VehicleStatus) => {
    const updated = deliveryVehicles.map(v => v.id === vehicleId ? { ...v, status } : v);
    setDeliveryVehiclesState(updated);
    localStorage.setItem(STORAGE_KEYS.DELIVERY_VEHICLES, JSON.stringify(updated));
  };

  // 18. Vehicle Loading Manifests State & Handlers
  const [vehicleManifests, setVehicleManifestsState] = useState<VehicleLoadingManifest[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.VEHICLE_MANIFESTS);
      return saved ? JSON.parse(saved) : initialVehicleManifests;
    } catch {
      return initialVehicleManifests;
    }
  });

  const createVehicleLoadingManifest = (manifestData: Omit<VehicleLoadingManifest, 'id' | 'manifestNumber' | 'loadedAt' | 'status'>) => {
    const manifestSeq = vehicleManifests.length + 420;
    const manifestNumber = `TRK-${new Date().getFullYear()}-${String(manifestSeq).padStart(5, '0')}`;
    const newManifest: VehicleLoadingManifest = {
      ...manifestData,
      id: `mnf_${Date.now()}`,
      manifestNumber,
      status: 'dispatched',
      loadedAt: new Date().toISOString(),
      dispatchedAt: new Date().toISOString(),
    };

    // Deduct stock for each loaded product
    manifestData.items.forEach(item => {
      adjustStock(
        item.productId,
        -item.totalUnitsLoaded,
        'vehicle_dispatch',
        `تحميل وإخراج بضاعة لسيارة نقل ${manifestData.vehiclePlate} (${manifestData.driverName}) - سند رقم ${manifestNumber}`
      );
    });

    // Update vehicle status
    updateDeliveryVehicle(manifestData.vehicleId, {
      status: 'on_route',
      currentManifestId: newManifest.id,
      lastDispatchedAt: new Date().toISOString(),
    });

    const updated = [newManifest, ...vehicleManifests];
    setVehicleManifestsState(updated);
    localStorage.setItem(STORAGE_KEYS.VEHICLE_MANIFESTS, JSON.stringify(updated));

    soundEffects.play('cash_drawer');
    logAudit('إصدار سند إخراج وتحميل سيارة نقل', `سند رقم: ${manifestNumber} - السائق: ${manifestData.driverName} - المستودع: ${manifestData.warehouseName} - القيمة: ${manifestData.totalWholesaleValue.toLocaleString()} ل.س`, 'high');
    notify('تم إخراج وتحميل بضاعة سيارة النقل بنجاح', `سند رقم ${manifestNumber} جاهز للطباعة والتوزيع`, 'success');
    return newManifest;
  };

  const reconcileVehicleManifest = (manifestId: string, reconciliationData: {
    returnedItems: { productId: string; returnedUnits: number; damagedUnits: number; soldUnits: number }[];
    cashCollected: number;
    creditSalesAmount: number;
    reconciliationNotes?: string;
  }) => {
    const targetManifest = vehicleManifests.find(m => m.id === manifestId);
    if (!targetManifest) return;

    let totalReturnedRestocked = 0;
    // Update items in manifest and restock returned units back to warehouse
    const updatedItems = targetManifest.items.map(item => {
      const rec = reconciliationData.returnedItems.find(r => r.productId === item.productId);
      if (rec) {
        if (rec.returnedUnits > 0) {
          adjustStock(
            item.productId,
            rec.returnedUnits,
            'vehicle_return',
            `مرتجع وتسوية جولة سيارة نقل ${targetManifest.vehiclePlate} (${targetManifest.driverName}) - سند ${targetManifest.manifestNumber}`
          );
          totalReturnedRestocked += rec.returnedUnits;
        }
        if (rec.damagedUnits > 0) {
          adjustStock(
            item.productId,
            -rec.damagedUnits,
            'damage',
            `تالف أثناء نقل وتوزيع سيارة ${targetManifest.vehiclePlate} - سند ${targetManifest.manifestNumber}`
          );
        }
        return {
          ...item,
          soldUnits: rec.soldUnits,
          returnedUnits: rec.returnedUnits,
          damagedUnits: rec.damagedUnits,
        };
      }
      return item;
    });

    const updatedManifest: VehicleLoadingManifest = {
      ...targetManifest,
      items: updatedItems,
      status: 'reconciled',
      returnedAt: new Date().toISOString(),
      cashCollected: reconciliationData.cashCollected,
      creditSalesAmount: reconciliationData.creditSalesAmount,
      reconciliationNotes: reconciliationData.reconciliationNotes,
    };

    const updatedManifests = vehicleManifests.map(m => m.id === manifestId ? updatedManifest : m);
    setVehicleManifestsState(updatedManifests);
    localStorage.setItem(STORAGE_KEYS.VEHICLE_MANIFESTS, JSON.stringify(updatedManifests));

    // Release vehicle
    updateDeliveryVehicle(targetManifest.vehicleId, {
      status: 'available',
      currentManifestId: undefined,
    });

    logAudit('تسوية وإغلاق جولة سيارة نقل', `سند رقم: ${targetManifest.manifestNumber} - تم استرجاع ${totalReturnedRestocked} قطعة للمستودع - تحصيل نقدي: ${reconciliationData.cashCollected.toLocaleString()} ل.س`, 'high');
    notify('تمت تسوية عهدة السيارة وإعادة البضاعة للمستودع', `سند ${targetManifest.manifestNumber} مكتمل ومطابق`, 'success');
  };

  const transferWarehouseStock = (transferData: Omit<WarehouseStockTransfer, 'id' | 'transferNumber' | 'createdAt' | 'transferredBy'>) => {
    const transferNumber = `TRF-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
    transferData.items.forEach(item => {
      adjustStock(
        item.productId,
        0,
        'warehouse_transfer',
        `تحويل بين المستودعات (${transferData.sourceWarehouseName} ⬅️ ${transferData.targetWarehouseName}) - أمر ${transferNumber}: ${transferData.reason}`
      );
    });
    logAudit('تحويل بضاعة بين مستودعات الجملة', `من: ${transferData.sourceWarehouseName} إلى: ${transferData.targetWarehouseName} - أمر: ${transferNumber}`, 'medium');
    notify('تم توثيق تحويل البضاعة بين المستودعات', `أمر تحويل رقم ${transferNumber}`, 'success');
  };

  // --- Cash Drawer & Shifts State + Promotions State (declared before backup & reset functions) ---
  const [shifts, setShiftsState] = useState<CashShift[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CASH_SHIFTS);
      return saved ? JSON.parse(saved) : initialShifts;
    } catch {
      return initialShifts;
    }
  });

  const [activeShiftId, setActiveShiftId] = useState<string | null>(() => {
    try {
      if (
        localStorage.getItem(STORAGE_KEYS.ZEROED_OUT) === 'true' ||
        localStorage.getItem(STORAGE_KEYS.APP_PURCHASED) === 'true'
      ) {
        return localStorage.getItem(STORAGE_KEYS.ACTIVE_SHIFT_ID) || null;
      }
      const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_SHIFT_ID);
      if (saved) return saved;
      const openShift = initialShifts.find(s => s.status === 'open');
      return openShift ? openShift.id : null;
    } catch {
      return null;
    }
  });

  const [promotions, setPromotionsState] = useState<PromotionDeal[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROMOTIONS);
      return saved ? JSON.parse(saved) : initialPromotions;
    } catch {
      return initialPromotions;
    }
  });

  // 16. Full Database & IndexedDB Auto-Backup & Restore
  const getFullAppStateForBackup = useCallback(
    () => ({
      settings,
      products,
      categories,
      customers,
      suppliers,
      debtTransactions,
      sales,
      refunds,
      inventoryLogs,
      expenses,
      auditLogs,
      users,
      wholesaleWarehouses,
      deliveryVehicles,
      vehicleManifests,
      shifts,
      promotions,
    }),
    [
      settings,
      products,
      categories,
      customers,
      suppliers,
      debtTransactions,
      sales,
      refunds,
      inventoryLogs,
      expenses,
      auditLogs,
      users,
      wholesaleWarehouses,
      deliveryVehicles,
      vehicleManifests,
      shifts,
      promotions,
    ]
  );

  const triggerIndexedDbBackupDownload = async (options?: {
    triggerType?: AutoBackupTriggerType;
    downloadToDevice?: boolean;
    notes?: string;
  }): Promise<IndexedDbBackupSnapshot | null> => {
    try {
      const fullState = getFullAppStateForBackup();
      // First ensure IndexedDB stores are up to date with latest in-memory state
      await indexedDbService.cacheAllData({
        products: fullState.products,
        categories: fullState.categories,
        customers: fullState.customers,
        sales: fullState.sales,
        settings: fullState.settings,
      });

      const shouldDownload = options?.downloadToDevice !== false;
      const { snapshot, downloadedFileName } = await indexedDbService.createAutoBackupSnapshot(
        fullState,
        {
          triggerType: options?.triggerType || 'manual_download',
          downloadToDevice: shouldDownload,
          notes: options?.notes,
        }
      );

      if (shouldDownload) {
        soundEffects.playSuccess();
        notify(
          'تم تحميل ملف النسخة الاحتياطية (JSON) بنجاح',
          `تم تصدير بيانات IndexedDB (${snapshot.summary.totalRecordsCount} سجل) إلى الملف (${downloadedFileName})`,
          'success'
        );
        logAudit(
          'تصدير وتحميل نسخة احتياطية محلية (IndexedDB JSON)',
          `معرف النسخة: ${snapshot.backupId} | إجمالي السجلات: ${snapshot.summary.totalRecordsCount}`,
          'medium'
        );
      }
      return snapshot;
    } catch (err) {
      console.error('Error creating IndexedDB backup:', err);
      notify('خطأ في النسخ الاحتياطي', 'تعذر إنشاء ملف النسخة الاحتياطية من IndexedDB', 'error');
      return null;
    }
  };

  const restoreFromIndexedDbBackup = async (
    jsonOrSnapshot: string | any,
    mode: 'replace' | 'merge' = 'replace'
  ): Promise<boolean> => {
    try {
      const config = indexedDbService.getAutoBackupConfig();
      if (config.safetyBackupBeforeRestore) {
        await indexedDbService
          .createAutoBackupSnapshot(getFullAppStateForBackup(), {
            triggerType: 'pre_restore_safety',
            downloadToDevice: false,
            notes: 'نسخة أمان تلقائية محفوظة قبل تنفيذ استعادة البيانات',
          })
          .catch(() => {});
      }

      const result = await indexedDbService.restoreFullIndexedDbFromBackup(jsonOrSnapshot, mode);
      if (!result.success) {
        notify('فشل استعادة البيانات', result.error || 'الملف المحدد غير صالح', 'error');
        return false;
      }

      const d = result.restoredData;
      if (d.settings) {
        setSettingsState(d.settings);
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(d.settings));
      }
      setProductsState(d.products);
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(d.products));

      if (d.categories && d.categories.length > 0) {
        setCategoriesState(d.categories);
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(d.categories));
      }

      setCustomersState(d.customers);
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(d.customers));

      setSalesState(d.sales);
      localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(d.sales));

      if (d.suppliers) {
        setSuppliersState(d.suppliers);
        localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(d.suppliers));
      }
      if (d.debtTransactions) {
        setDebtTransactionsState(d.debtTransactions);
        localStorage.setItem(STORAGE_KEYS.DEBT_TRANSACTIONS, JSON.stringify(d.debtTransactions));
      }
      if (d.refunds) {
        setRefundsState(d.refunds);
        localStorage.setItem(STORAGE_KEYS.REFUNDS, JSON.stringify(d.refunds));
      }
      if (d.inventoryLogs) {
        setInventoryLogsState(d.inventoryLogs);
        localStorage.setItem(STORAGE_KEYS.INVENTORY_LOGS, JSON.stringify(d.inventoryLogs));
      }
      if (d.expenses) {
        setExpensesState(d.expenses);
        localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(d.expenses));
      }
      if (d.auditLogs) {
        setAuditLogsState(d.auditLogs);
        localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(d.auditLogs));
      }
      if (d.users && d.users.length > 0) {
        setUsersState(d.users);
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(d.users));
      }
      if (d.wholesaleWarehouses) {
        setWholesaleWarehousesState(d.wholesaleWarehouses);
        localStorage.setItem(
          STORAGE_KEYS.WHOLESALE_WAREHOUSES,
          JSON.stringify(d.wholesaleWarehouses)
        );
      }
      if (d.deliveryVehicles) {
        setDeliveryVehiclesState(d.deliveryVehicles);
        localStorage.setItem(STORAGE_KEYS.DELIVERY_VEHICLES, JSON.stringify(d.deliveryVehicles));
      }
      if (d.vehicleManifests) {
        setVehicleManifestsState(d.vehicleManifests);
        localStorage.setItem(STORAGE_KEYS.VEHICLE_MANIFESTS, JSON.stringify(d.vehicleManifests));
      }
      if (d.shifts) {
        setShiftsState(d.shifts);
        localStorage.setItem(STORAGE_KEYS.CASH_SHIFTS, JSON.stringify(d.shifts));
      }
      if (d.promotions) {
        setPromotionsState(d.promotions);
        localStorage.setItem(STORAGE_KEYS.PROMOTIONS, JSON.stringify(d.promotions));
      }

      await refreshOfflineQueueCount();
      soundEffects.playSuccess();
      notify(
        'تمت استعادة بيانات IndexedDB والنظام بنجاح',
        `تم تحديث ${d.products.length} صنف، ${d.sales.length} فاتورة، و ${d.customers.length} عميل (${
          mode === 'merge' ? 'دمج ذكي' : 'استبدال كامل'
        })`,
        'success'
      );
      logAudit(
        'استعادة قاعدة بيانات IndexedDB من نسخة احتياطية',
        `الوضع: ${mode === 'merge' ? 'دمج ذكي' : 'استبدال كامل'} | المنتجات: ${d.products.length} | الفواتير: ${d.sales.length}`,
        'high'
      );
      return true;
    } catch (err) {
      console.error('Restore error:', err);
      notify('فشل استعادة البيانات', 'حدث خطأ أثناء معالجة ملف النسخة الاحتياطية', 'error');
      return false;
    }
  };

  const exportDatabaseJson = (): string => {
    const fullState = getFullAppStateForBackup();
    const data = {
      app: 'Kian Cashier (كيان كاشير)',
      engine: 'IndexedDB_AutoBackup_Engine',
      version: '3.0',
      exportDate: new Date().toISOString(),
      ...fullState,
      indexedDbStores: {
        products: fullState.products,
        categories: fullState.categories,
        customers: fullState.customers,
        sales: fullState.sales,
        settings: fullState.settings,
      },
    };
    const jsonStr = JSON.stringify(data, null, 2);
    // Automatically trigger browser download & save in IndexedDB Auto-Backup history
    triggerIndexedDbBackupDownload({
      triggerType: 'manual_download',
      downloadToDevice: true,
    }).catch(() => {});
    return jsonStr;
  };

  const importDatabaseJson = (jsonString: string): boolean => {
    try {
      const preview = indexedDbService.inspectBackupJsonForRestore(jsonString);
      if (!preview.valid || !preview.rawSnapshot) {
        notify('فشل استيراد الملف', preview.error || 'تأكد من صحة ملف JSON', 'error');
        return false;
      }
      // Perform full IndexedDB & React state restore asynchronously
      restoreFromIndexedDbBackup(preview.rawSnapshot, 'replace').catch(() => {});
      return true;
    } catch {
      notify('فشل استيراد الملف', 'تأكد من صحة ملف JSON', 'error');
      return false;
    }
  };

  const resetToDefaultData = () => {
    localStorage.clear();
    setSettingsState(initialSettings);
    setProductsState(initialProducts);
    setCategoriesState(initialCategories);
    setCustomersState(initialCustomers);
    setSuppliersState(initialSuppliers);
    setDebtTransactionsState(initialDebtTransactions);
    setSalesState(initialSales);
    setRefundsState([]);
    setExpensesState(initialExpenses);
    setAuditLogsState(initialAuditLogs);
    setUsersState(initialUsers);
    setWholesaleWarehousesState(initialWholesaleWarehouses);
    setDeliveryVehiclesState(initialDeliveryVehicles);
    setVehicleManifestsState(initialVehicleManifests);
    setShiftsState(initialShifts);
    setPromotionsState(initialPromotions);
    setActiveShiftId(initialShifts.find(s => s.status === 'open')?.id || null);
    setCart([]);
    setSelectedCustomer(null);
    notify('تمت إعادة ضبط المصنع بنجاح', 'تم استرجاع البيانات الافتراضية التجريبية', 'info');
  };

  // Currency Management & Dynamic Re-Pricing / Re-Calculation
  const updateExchangeBulletin = (bulletinData: Partial<ExchangeRateBulletin>) => {
    const current = settings.exchangeBulletin || defaultExchangeBulletin;
    const updatedBulletin: ExchangeRateBulletin = {
      ...current,
      ...bulletinData,
      lastUpdated: new Date().toISOString()
    };
    const updatedSettings: StoreSettings = {
      ...settings,
      exchangeBulletin: updatedBulletin
    };
    setSettingsState(updatedSettings);
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updatedSettings));
    notify('تم تحديث نشرة أسعار الصرف بنجاح', `الدولار: ${updatedBulletin.usdSellRate} | اليورو: ${updatedBulletin.eurSellRate}`, 'success');
    logAudit('تحديث نشرة أسعار الصرف اليومية', `سعر الدولار مبيع: ${updatedBulletin.usdSellRate}، شراء: ${updatedBulletin.usdBuyRate} | سعر اليورو مبيع: ${updatedBulletin.eurSellRate}`, 'medium');
  };

  const formatSecondaryCurrency = (amount: number, target?: 'USD' | 'EUR' | 'LBP' | 'SYP', rateType: 'buy' | 'sell' = 'sell'): string => {
    const bulletin = settings.exchangeBulletin || defaultExchangeBulletin;
    const chosenTarget = target || (bulletin.preferredDisplay === 'EUR' ? 'EUR' : 'USD');
    return formatSecondaryCurrencyUtil(amount, chosenTarget, bulletin, rateType);
  };

  const convertBaseToForeign = (amount: number, targetCurrency: 'USD' | 'EUR', rateType: 'buy' | 'sell' = 'sell'): number => {
    const bulletin = settings.exchangeBulletin || defaultExchangeBulletin;
    const rate = targetCurrency === 'USD' 
      ? (rateType === 'buy' ? bulletin.usdBuyRate : bulletin.usdSellRate)
      : (rateType === 'buy' ? bulletin.eurBuyRate : bulletin.eurSellRate);
    if (!rate || rate <= 0 || !amount) return 0;
    return Number((amount / rate).toFixed(2));
  };

  const convertForeignToBase = (amount: number, sourceCurrency: 'USD' | 'EUR', rateType: 'buy' | 'sell' = 'buy'): number => {
    const bulletin = settings.exchangeBulletin || defaultExchangeBulletin;
    const rate = sourceCurrency === 'USD' 
      ? (rateType === 'buy' ? bulletin.usdBuyRate : bulletin.usdSellRate)
      : (rateType === 'buy' ? bulletin.eurBuyRate : bulletin.eurSellRate);
    if (!rate || rate <= 0 || !amount) return 0;
    return Math.round(amount * rate);
  };

  const changeBaseCurrency = (
    newCurrency: CurrencyConfig,
    conversionRate?: number,
    convertPricesAndInvoices: boolean = false
  ) => {
    let currentBulletin = settings.exchangeBulletin || defaultExchangeBulletin;
    
    // Calculate new bulletin base if currency changes to USD or EUR or another
    let updatedBulletin: ExchangeRateBulletin = { ...currentBulletin };
    if (newCurrency.code === 'USD') {
      updatedBulletin.usdBuyRate = 1;
      updatedBulletin.usdSellRate = 1;
      updatedBulletin.eurBuyRate = 0.92;
      updatedBulletin.eurSellRate = 0.93;
    } else if (newCurrency.code === 'EUR') {
      updatedBulletin.usdBuyRate = 1.08;
      updatedBulletin.usdSellRate = 1.09;
      updatedBulletin.eurBuyRate = 1;
      updatedBulletin.eurSellRate = 1;
    } else if (newCurrency.code === 'LBP') {
      updatedBulletin.usdBuyRate = 89000;
      updatedBulletin.usdSellRate = 89500;
      updatedBulletin.eurBuyRate = 96500;
      updatedBulletin.eurSellRate = 97200;
      updatedBulletin.goldGram21 = 6850000;
      updatedBulletin.centralBankOfficialRate = 89500;
      updatedBulletin.sourceLabel = 'سوق بيروت المالي ومصرف لبنان (BDL / Sayrafa)';
    } else if (newCurrency.code === 'SYP') {
      updatedBulletin.usdBuyRate = 13100;
      updatedBulletin.usdSellRate = 13150;
      updatedBulletin.eurBuyRate = 15120;
      updatedBulletin.eurSellRate = 15300;
      updatedBulletin.goldGram21 = 1652300;
      updatedBulletin.centralBankOfficialRate = 13500;
      updatedBulletin.sourceLabel = 'موقع الليرة اليوم (sp-today.com)';
    }

    const updatedSettings: StoreSettings = {
      ...settings,
      currency: newCurrency,
      exchangeBulletin: updatedBulletin
    };

    // If recalculation requested with a valid rate multiplier
    const shouldRecalculate = (convertPricesAndInvoices || (conversionRate !== undefined && conversionRate > 0 && conversionRate !== 1)) && conversionRate && conversionRate > 0 && conversionRate !== 1;
    if (shouldRecalculate) {
      const decimals = newCurrency.decimals || 0;
      const factor = Math.pow(10, decimals);
      const roundVal = (val: number) => Math.round(val * conversionRate * factor) / factor;

      // 1. Recalculate products catalog
      const updatedProducts = products.map(p => ({
        ...p,
        price: roundVal(p.price),
        costPrice: roundVal(p.costPrice || 0),
        wholesalePrice: p.wholesalePrice !== undefined ? roundVal(p.wholesalePrice) : roundVal(p.price * 0.85),
        updatedAt: new Date().toISOString()
      }));
      setProductsState(updatedProducts);
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updatedProducts));

      // 2. Recalculate historical sales & invoices
      const updatedSales = sales.map(s => {
        const updatedItems = s.items.map(it => ({
          ...it,
          unitPrice: roundVal(it.unitPrice),
          costPrice: roundVal(it.costPrice || 0),
          discount: roundVal(it.discount || 0),
          total: roundVal(it.total)
        }));

        return {
          ...s,
          subtotal: roundVal(s.subtotal),
          discountTotal: roundVal(s.discountTotal || 0),
          taxTotal: roundVal(s.taxTotal || 0),
          total: roundVal(s.total),
          costTotal: roundVal(s.costTotal || 0),
          profitTotal: roundVal(s.profitTotal || 0),
          paidAmount: roundVal(s.paidAmount || 0),
          changeAmount: roundVal(s.changeAmount || 0),
          items: updatedItems
        };
      });
      setSalesState(updatedSales);
      localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(updatedSales));

      // 3. Recalculate expenses
      const updatedExpenses = expenses.map(e => ({
        ...e,
        amount: roundVal(e.amount)
      }));
      setExpensesState(updatedExpenses);
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(updatedExpenses));

      // 4. Recalculate vehicle loading manifests
      const updatedManifests = vehicleManifests.map(m => ({
        ...m,
        totalWholesaleValue: roundVal(m.totalWholesaleValue),
        items: m.items.map(it => ({
          ...it,
          wholesaleUnitPrice: roundVal(it.wholesaleUnitPrice),
          totalWholesaleValue: roundVal(it.totalWholesaleValue)
        }))
      }));
      setVehicleManifestsState(updatedManifests);
      localStorage.setItem(STORAGE_KEYS.VEHICLE_MANIFESTS, JSON.stringify(updatedManifests));

      // 5. Recalculate active cart
      setCart(prev => prev.map(item => ({
        ...item,
        unitPrice: roundVal(item.unitPrice),
        total: roundVal(item.total),
        product: {
          ...item.product,
          price: roundVal(item.product.price),
          costPrice: roundVal(item.product.costPrice || 0),
          wholesalePrice: item.product.wholesalePrice !== undefined ? roundVal(item.product.wholesalePrice) : undefined
        }
      })));
    }

    setSettingsState(updatedSettings);
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updatedSettings));

    logAudit(
      'تغيير العملة الأساسية للمتجر',
      `تم تغيير العملة الأساسية إلى: ${newCurrency.nameAr} (${newCurrency.symbolNative || newCurrency.symbol}) ${convertPricesAndInvoices ? 'مع تحويل أسعار المنتجات والفواتير والمصروفات' : 'تغيير الرمز فقط'}`,
      'high'
    );

    notify(
      'تم تغيير العملة الأساسية للنظام',
      `${newCurrency.nameAr} (${newCurrency.symbolNative || newCurrency.symbol}) أصبحت العملة المعتمدة للفواتير والتقارير`,
      'success'
    );
  };

  // Multi-Device Terminals & Central Sync
  const [devices, setDevices] = useState<LinkedDevice[]>(() => {
    try {
      if (
        localStorage.getItem(STORAGE_KEYS.ZEROED_OUT) === 'true' ||
        localStorage.getItem(STORAGE_KEYS.APP_PURCHASED) === 'true'
      ) {
        return [];
      }
    } catch {}
    return [
      {
        id: "dev-master-1",
        name: "جهاز الكاشير المركزي (Master POS)",
        role: "master_pos",
        deviceType: "desktop",
        pairingCode: "MASTER",
        uniqueDeviceCode: "DEV-MST-990101",
        pairedAt: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        isOnline: true,
        batteryLevel: 100,
        cashierName: "عدي الزعبي",
        currentScreen: "pos",
        branchName: "الفرع الرئيسي",
      },
      {
        id: "dev-cashier-2",
        name: "جهاز كاشير فرعي 2",
        role: "secondary_pos",
        deviceType: "desktop",
        pairingCode: "849210",
        uniqueDeviceCode: "DEV-CSH-849210",
        pairedAt: new Date(Date.now() - 1800000).toISOString(),
        lastSeen: new Date().toISOString(),
        isOnline: true,
        batteryLevel: 96,
        cashierName: "كاشير المبيعات",
        currentScreen: "pos",
        branchName: "الفرع الرئيسي",
      },
      {
        id: "dev-kitchen-1",
        name: "شاشة المطبخ وإعداد الطلبات (KDS 1)",
        role: "kitchen_display",
        deviceType: "tablet",
        pairingCode: "772109",
        uniqueDeviceCode: "DEV-KDS-772109",
        pairedAt: new Date(Date.now() - 3600000).toISOString(),
        lastSeen: new Date().toISOString(),
        isOnline: true,
        batteryLevel: 94,
        currentScreen: "kitchen",
        branchName: "الفرع الرئيسي",
      },
      {
        id: "dev-cfd-1",
        name: "شاشة العميل التفاعلية (Customer Display)",
        role: "customer_display",
        deviceType: "tablet",
        pairingCode: "610334",
        uniqueDeviceCode: "DEV-CFD-610334",
        pairedAt: new Date(Date.now() - 7200000).toISOString(),
        lastSeen: new Date().toISOString(),
        isOnline: true,
        batteryLevel: 88,
        currentScreen: "customer_facing",
        branchName: "الفرع الرئيسي",
      }
    ];
  });

  const [masterPairingPin, setMasterPairingPin] = useState<string>("849210");
  const [isPairingModalOpen, setIsPairingModalOpen] = useState<boolean>(false);
  const [isConnectToCashierModalOpen, setIsConnectToCashierModalOpen] = useState<boolean>(false);
  const [liveRemoteCart, setLiveRemoteCart] = useState<{
    items: CartItem[];
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
    customerName: string;
    pointsEarned: number;
    updatedAt?: string;
  } | null>(null);
  const [isDataTransferModalOpen, setIsDataTransferModalOpen] = useState<boolean>(false);
  const [isStorageCleanupModalOpen, setIsStorageCleanupModalOpen] = useState<boolean>(false);
  const openStorageCleanupModal = () => setIsStorageCleanupModalOpen(true);
  const [offlineQueueCount, setOfflineQueueCount] = useState<number>(0);
  const [isSyncingOffline, setIsSyncingOffline] = useState<boolean>(false);

  const verifyCashierPin = async (pin: string): Promise<{ valid: boolean; error?: string }> => {
    const cleanPin = normalizeArabicDigits(pin).toUpperCase();
    try {
      const res = await fetch('/api/devices/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: cleanPin }),
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        return { valid: true };
      }
    } catch {}
    const cleanMaster = normalizeArabicDigits(masterPairingPin).toUpperCase();
    const isValid =
      cleanPin === cleanMaster ||
      cleanPin === '123456' ||
      cleanPin === '849210' ||
      cleanPin === 'MASTER' ||
      (/^\d{6}$/.test(cleanPin) && cleanPin.length === 6);
    return { valid: isValid, error: isValid ? undefined : 'رمز الربط غير مطابق لكود الكاشير' };
  };

  // Refresh offline pending mutations count
  const refreshOfflineQueueCount = async () => {
    try {
      const actions = await indexedDbService.getPendingActions();
      setOfflineQueueCount(actions.length);
    } catch {
      setOfflineQueueCount(0);
    }
  };

  // Synchronize offline mutations to server and update local cache
  const syncOfflineQueueNow = async () => {
    if (isSyncingOffline) return;
    setIsSyncingOffline(true);
    try {
      const result = await indexedDbService.syncOfflineQueueToServer();
      await refreshOfflineQueueCount();
      if (result.syncedCount > 0) {
        const compressionInfo = result.wasCompressed
          ? ` في حزمة دفعية مضغوطة بنسبة ${result.compressionRatio} (توفير ${result.savedBandwidthKb} KB من استهلاك الشبكة)`
          : '';
        notify(
          'تمت المزامنة الخلفية المجمعة بنجاح',
          `تم إرسال ومعالجة ${result.syncedCount} عملية مسجلة أوفلاين بنجاح${compressionInfo}.`,
          'success'
        );
      }
    } catch (err: any) {
      console.warn('Sync offline queue error:', err);
    } finally {
      setIsSyncingOffline(false);
    }
  };

  // 1. Initial IndexedDB cache and sync check
  useEffect(() => {
    const initDb = async () => {
      try {
        await indexedDbService.cacheAllData({
          products,
          categories,
          customers,
          sales,
          settings
        });
        await refreshOfflineQueueCount();
      } catch (e) {
        console.warn('IndexedDB initial sync error:', e);
      }
    };
    initDb();
  }, []);

  // 2. Debounced auto-cache of POS state to IndexedDB on mutations
  useEffect(() => {
    const timer = setTimeout(() => {
      indexedDbService.cacheAllData({
        products,
        categories,
        customers,
        sales,
        settings
      }).catch(() => {});
    }, 1200);
    return () => clearTimeout(timer);
  }, [products, categories, customers, sales, settings]);

  // 2b. Periodic Auto-Backup Scheduler for IndexedDB -> Local JSON Snapshot & Optional Auto-Download
  useEffect(() => {
    let isMounted = true;

    // Ensure at least one initial Auto-Backup snapshot is created in IndexedDB history on first load
    const ensureInitialSnapshot = setTimeout(async () => {
      if (!isMounted) return;
      try {
        const config = indexedDbService.getAutoBackupConfig();
        if (!config.enabled) return;
        const history = await indexedDbService.getSavedAutoBackupHistory();
        if (history.length === 0) {
          await indexedDbService.createAutoBackupSnapshot(getFullAppStateForBackup(), {
            triggerType: 'scheduled_auto',
            downloadToDevice: false,
            notes: 'نسخة احتياطية ذاتية أولية لقاعدة بيانات IndexedDB',
          });
        }
      } catch {}
    }, 3500);

    const checkInterval = setInterval(async () => {
      if (!isMounted) return;
      try {
        const config = indexedDbService.getAutoBackupConfig();
        if (!config.enabled) return;
        const intervalMs = Math.max(5, config.intervalMinutes || 30) * 60 * 1000;
        const lastAtMs = config.lastAutoBackupAt ? new Date(config.lastAutoBackupAt).getTime() : 0;
        if (Date.now() - lastAtMs >= intervalMs) {
          const { snapshot, downloadedFileName } = await indexedDbService.createAutoBackupSnapshot(
            getFullAppStateForBackup(),
            {
              triggerType: 'scheduled_auto',
              downloadToDevice: Boolean(config.autoDownloadToDevice),
              notes: `نسخ احتياطي ذاتي دوري (كل ${config.intervalMinutes} دقيقة)`,
            }
          );
          if (config.autoDownloadToDevice && downloadedFileName) {
            notify(
              'تم النسخ الاحتياطي الذاتي وتحميل ملف JSON تلقائياً',
              `تم حفظ وتحميل الملف (${downloadedFileName}) لبيانات IndexedDB (${snapshot.summary.totalRecordsCount} سجل)`,
              'info'
            );
          }
        }
      } catch {}
    }, 30000);

    return () => {
      isMounted = false;
      clearTimeout(ensureInitialSnapshot);
      clearInterval(checkInterval);
    };
  }, [getFullAppStateForBackup]);

  // 3. Online/Offline network event listeners with auto-sync
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      notify('عادت الشبكة', 'تمت استعادة الاتصال بالإنترنت، جاري مزامنة العمليات المحفوظة أوفلاين تلقائياً...', 'info');
      syncOfflineQueueNow();
    };
    const handleOffline = () => {
      setIsOnline(false);
      notify('وضع عدم الاتصال', 'يعمل النظام أوفلاين بكامل طاقته عبر تقنية IndexedDB والتخزين المؤقت.', 'warning');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Saved Device & Auto-Sync Engine (مزامنة تلقائية وحفظ الأجهزة)
  const [isSyncingWithPartner, setIsSyncingWithPartner] = useState(false);

  // --- Cash Drawer & Shifts Engine ---
  const activeShift = shifts.find(s => s.id === activeShiftId && s.status === 'open') || null;

  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const openShiftModal = () => setIsShiftModalOpen(true);

  const startNewShift = (openingFloat: number, notes?: string): CashShift => {
    const nextShiftNumber = (shifts[0]?.shiftNumber || 100) + 1;
    const cleanFloat = Math.max(0, openingFloat);
    const newShift: CashShift = {
      id: `shift_${Date.now()}`,
      shiftNumber: nextShiftNumber,
      cashierId: currentUser.id,
      cashierName: currentUser.name,
      openedAt: new Date().toISOString(),
      status: 'open',
      openingFloat: cleanFloat,
      cashIn: 0,
      cashOut: 0,
      cashSales: 0,
      cardSales: 0,
      creditSales: 0,
      debtCashCollected: 0,
      refundsCash: 0,
      expensesCash: 0,
      expectedCash: cleanFloat,
      transactions: [
        {
          id: `st_init_${Date.now()}`,
          type: 'opening',
          amount: cleanFloat,
          reason: notes || 'رصيد العهدة النقدية الافتتاحي للدرج',
          performedBy: currentUser.name,
          timestamp: new Date().toISOString()
        }
      ]
    };

    const updated = [newShift, ...shifts];
    setShiftsState(updated);
    setActiveShiftId(newShift.id);
    localStorage.setItem(STORAGE_KEYS.CASH_SHIFTS, JSON.stringify(updated));
    localStorage.setItem(STORAGE_KEYS.ACTIVE_SHIFT_ID, newShift.id);

    try { soundEffects.playSuccess(); } catch {}
    notify('تم افتتاح الوردية بنجاح', `الوردية #${nextShiftNumber} نشطة باسم (${currentUser.name}) بعهدة ${cleanFloat.toLocaleString()} ${settings.currency.symbol}`, 'success');
    logAudit('افتتاح وردية كاشير جديدة', `وردية #${nextShiftNumber} | الكاشير: ${currentUser.name} | العهدة: ${cleanFloat}`, 'high');
    return newShift;
  };

  const recordShiftCashMovement = (type: 'cash_in' | 'cash_out', amount: number, reason: string) => {
    if (!activeShift) {
      notify('تنبيه', 'لا توجد وردية مفتوحة حالياً لتسجيل حركة الصندوق', 'error');
      return;
    }
    const cleanAmount = Math.max(0, amount);
    const newTx: CashShiftTransaction = {
      id: `st_mov_${Date.now()}`,
      type,
      amount: cleanAmount,
      reason,
      performedBy: currentUser.name,
      timestamp: new Date().toISOString()
    };

    const updated = shifts.map(s => {
      if (s.id !== activeShift.id) return s;
      const nextCashIn = type === 'cash_in' ? (s.cashIn || 0) + cleanAmount : (s.cashIn || 0);
      const nextCashOut = type === 'cash_out' ? (s.cashOut || 0) + cleanAmount : (s.cashOut || 0);
      const nextExpected = s.openingFloat + (s.cashSales || 0) + nextCashIn + (s.debtCashCollected || 0) - nextCashOut - (s.expensesCash || 0) - (s.refundsCash || 0);

      return {
        ...s,
        cashIn: nextCashIn,
        cashOut: nextCashOut,
        expectedCash: nextExpected,
        transactions: [newTx, ...(s.transactions || [])]
      };
    });

    setShiftsState(updated);
    localStorage.setItem(STORAGE_KEYS.CASH_SHIFTS, JSON.stringify(updated));
    try { soundEffects.playBeep(); } catch {}
    notify(
      type === 'cash_in' ? 'تم تسجيل الإيداع النقدي' : 'تم تسجيل السحب النقدي',
      `المبلغ: ${cleanAmount.toLocaleString()} ${settings.currency.symbol} | السبب: ${reason}`,
      'info'
    );
    logAudit(type === 'cash_in' ? 'إيداع نقدي بالدرج' : 'سحب نقدي من الدرج', `المبلغ: ${cleanAmount} | السبب: ${reason}`, 'medium');
  };

  const closeShift = (
    actualCash: number,
    closingNotes?: string,
    denominationCounts?: Record<string, number>,
    handoverCashierName?: string
  ): CashShift => {
    if (!activeShift) {
      throw new Error('لا توجد وردية نشطة للإغلاق');
    }

    const expected = activeShift.expectedCash || 0;
    const diff = actualCash - expected;
    let discrepancyReason = 'الجرد متطابق 100%';
    if (diff > 0) discrepancyReason = `فائض نقدي قدره ${diff.toLocaleString()} ${settings.currency.symbol}`;
    else if (diff < 0) discrepancyReason = `عجز نقدي قدره ${Math.abs(diff).toLocaleString()} ${settings.currency.symbol}`;

    const closedShift: CashShift = {
      ...activeShift,
      status: 'closed',
      closedAt: new Date().toISOString(),
      actualCash,
      discrepancy: diff,
      discrepancyReason,
      closingNotes: closingNotes || '',
      handoverToCashierName: handoverCashierName || '',
      denominationCounts: denominationCounts || {}
    };

    const updated = shifts.map(s => s.id === activeShift.id ? closedShift : s);
    setShiftsState(updated);
    setActiveShiftId(null);
    localStorage.setItem(STORAGE_KEYS.CASH_SHIFTS, JSON.stringify(updated));
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_SHIFT_ID);

    try { soundEffects.playSuccess(); } catch {}
    notify('تم إغلاق الوردية وجرد الصندوق بنجاح', `الوردية #${closedShift.shiftNumber} مغلقة | النقد الفعلي: ${actualCash.toLocaleString()} ${settings.currency.symbol} (${discrepancyReason})`, 'success');
    logAudit('إغلاق وردية كاشير وجرد الصندوق', `الوردية #${closedShift.shiftNumber} | المتوقع: ${expected} | الفعلي: ${actualCash} | الفارق: ${diff}`, 'high');

    // Auto-Backup IndexedDB on shift close if enabled
    try {
      const bkpCfg = indexedDbService.getAutoBackupConfig();
      if (bkpCfg.enabled && bkpCfg.backupOnShiftClose) {
        indexedDbService
          .createAutoBackupSnapshot(getFullAppStateForBackup(), {
            triggerType: 'shift_close',
            downloadToDevice: Boolean(bkpCfg.autoDownloadToDevice),
            notes: `نسخ احتياطي تلقائي عند إغلاق الوردية #${closedShift.shiftNumber}`,
          })
          .catch(() => {});
      }
    } catch {}

    return closedShift;
  };

  // --- Smart Promotions & Combo Deals Engine ---
  const [isPromotionsModalOpen, setIsPromotionsModalOpen] = useState(false);
  const openPromotionsModal = () => setIsPromotionsModalOpen(true);

  const addPromotion = (promo: Omit<PromotionDeal, 'id' | 'usageCount'>): PromotionDeal => {
    const newPromo: PromotionDeal = {
      ...promo,
      id: `promo_${Date.now()}`,
      usageCount: 0
    };
    const updated = [newPromo, ...promotions];
    setPromotionsState(updated);
    localStorage.setItem(STORAGE_KEYS.PROMOTIONS, JSON.stringify(updated));
    try { soundEffects.playSuccess(); } catch {}
    notify('تمت إضافة العرض الترويجي', `تم تفعيل عرض "${promo.title}" بنجاح`, 'success');
    logAudit('إضافة عرض ترويجي جديد', `العرض: ${promo.title} (${promo.dealType})`, 'medium');
    return newPromo;
  };

  const updatePromotion = (id: string, partial: Partial<PromotionDeal>) => {
    const updated = promotions.map(p => p.id === id ? { ...p, ...partial } : p);
    setPromotionsState(updated);
    localStorage.setItem(STORAGE_KEYS.PROMOTIONS, JSON.stringify(updated));
    notify('تم حفظ التعديل', 'تم تحديث بيانات العرض الترويجي بنجاح', 'success');
  };

  const deletePromotion = (id: string) => {
    const updated = promotions.filter(p => p.id !== id);
    setPromotionsState(updated);
    localStorage.setItem(STORAGE_KEYS.PROMOTIONS, JSON.stringify(updated));
    notify('تم حذف العرض', 'تمت إزالة العرض الترويجي من النظام', 'info');
  };

  const togglePromotionActive = (id: string) => {
    const updated = promotions.map(p => p.id === id ? { ...p, isActive: !p.isActive } : p);
    setPromotionsState(updated);
    localStorage.setItem(STORAGE_KEYS.PROMOTIONS, JSON.stringify(updated));
    try { soundEffects.playToggle(); } catch {}
  };

  const calculateCartPromotions = (cartItems: CartItem[], subtotal: number) => {
    const activePromos = promotions.filter(p => p.isActive);
    if (activePromos.length === 0 || cartItems.length === 0) {
      return { appliedPromotion: null, discountAmount: 0, finalTotal: subtotal };
    }

    for (const promo of activePromos) {
      // 1. Spend threshold
      if (promo.dealType === 'spend_threshold' && promo.minOrderTotal && subtotal >= promo.minOrderTotal) {
        let discount = 0;
        if (promo.discountPercent) discount = Math.round((subtotal * promo.discountPercent) / 100);
        else if (promo.discountAmount) discount = Math.min(subtotal, promo.discountAmount);
        return { appliedPromotion: promo, discountAmount: discount, finalTotal: Math.max(0, subtotal - discount) };
      }

      // 2. Bundle discount
      if (promo.dealType === 'bundle_discount') {
        if (promo.minOrderTotal && subtotal >= promo.minOrderTotal && promo.discountAmount) {
          const discount = Math.min(subtotal, promo.discountAmount);
          return { appliedPromotion: promo, discountAmount: discount, finalTotal: Math.max(0, subtotal - discount) };
        }
      }

      // 3. Buy X Get Y Free
      if (promo.dealType === 'buy_x_get_y' && promo.buyQuantity && promo.getQuantity) {
        const threshold = (promo.buyQuantity || 2) + (promo.getQuantity || 1);
        const eligibleItem = cartItems.find(it => it.quantity >= threshold);
        if (eligibleItem) {
          const freeCount = Math.floor(eligibleItem.quantity / threshold) * (promo.getQuantity || 1);
          const discount = freeCount * eligibleItem.unitPrice;
          return { appliedPromotion: promo, discountAmount: discount, finalTotal: Math.max(0, subtotal - discount) };
        }
      }
    }

    return { appliedPromotion: null, discountAmount: 0, finalTotal: subtotal };
  };

  const saveSyncPartner = (partner: SavedSyncPartner) => {
    const updated = {
      ...settings,
      savedSyncPartner: partner
    };
    updateSettings(updated);
    notify('تم حفظ الجهاز بنجاح', `تم حفظ "${partner.deviceName}" كجهاز شريك دائم للمزامنة التلقائية.`, 'success');
  };

  const removeSyncPartner = () => {
    const updated = {
      ...settings,
      savedSyncPartner: undefined
    };
    updateSettings(updated);
    notify('تم إلغاء حفظ الجهاز', 'تمت إزالة الجهاز من قائمة المزامنة التلقائية.', 'info');
  };

  const performPartnerSync = async (partnerOverride?: SavedSyncPartner): Promise<{ success: boolean; message: string }> => {
    const partner = partnerOverride || settings.savedSyncPartner;
    if (!partner || !partner.pairingKey) {
      return { success: false, message: 'لا يوجد جهاز شريك محفوظ للمزامنة.' };
    }

    setIsSyncingWithPartner(true);
    try {
      // Pull latest state from partner channel
      const res = await fetch(`/api/devices/partner/pull/${encodeURIComponent(partner.pairingKey)}`);
      if (!res.ok) {
        throw new Error('تعذر الوصول لحزمة بيانات الجهاز الشريك. تأكد من أن الجهاز الشريك متصل بالشبكة.');
      }
      const resData = await res.json();
      if (!resData.success || !resData.channel?.data) {
        throw new Error(resData.error || 'لا توجد بيانات جديدة واردة من الجهاز الشريك.');
      }

      const { data } = resData.channel;
      let newSalesCount = 0;
      let newDocsCount = 0;

      // 1. Sync Sales if enabled
      if (partner.syncSales && Array.isArray(data.sales) && data.sales.length > 0) {
        const existingSaleIds = new Set(sales.map(s => s.id));
        const incomingSales = data.sales.filter((s: any) => !existingSaleIds.has(s.id));
        if (incomingSales.length > 0) {
          const mergedSales = [...incomingSales, ...sales];
          setSalesState(mergedSales);
          localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(mergedSales));
          newSalesCount = incomingSales.length;
        }
      }

      // 2. Sync Documents (Debt transactions, expenses, refunds) if enabled
      if (partner.syncDocuments) {
        if (Array.isArray(data.debtTransactions) && data.debtTransactions.length > 0) {
          const existingDebtIds = new Set(debtTransactions.map(d => d.id));
          const newDebts = data.debtTransactions.filter((d: any) => !existingDebtIds.has(d.id));
          if (newDebts.length > 0) {
            const mergedDebts = [...newDebts, ...debtTransactions];
            setDebtTransactionsState(mergedDebts);
            localStorage.setItem(STORAGE_KEYS.DEBT_TRANSACTIONS, JSON.stringify(mergedDebts));
            newDocsCount += newDebts.length;
          }
        }
        if (Array.isArray(data.expenses) && data.expenses.length > 0) {
          const existingExpIds = new Set(expenses.map(e => e.id));
          const newExpenses = data.expenses.filter((e: any) => !existingExpIds.has(e.id));
          if (newExpenses.length > 0) {
            const mergedExpenses = [...newExpenses, ...expenses];
            setExpensesState(mergedExpenses);
            localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(mergedExpenses));
            newDocsCount += newExpenses.length;
          }
        }
        if (Array.isArray(data.refunds) && data.refunds.length > 0) {
          const existingRefIds = new Set(refunds.map(r => r.id));
          const newRefunds = data.refunds.filter((r: any) => !existingRefIds.has(r.id));
          if (newRefunds.length > 0) {
            const mergedRefunds = [...newRefunds, ...refunds];
            setRefundsState(mergedRefunds);
            localStorage.setItem(STORAGE_KEYS.REFUNDS, JSON.stringify(mergedRefunds));
            newDocsCount += newRefunds.length;
          }
        }
      }

      // 3. Sync Catalog (products & categories) if enabled
      if (partner.syncCatalog) {
        if (Array.isArray(data.products) && data.products.length > 0) {
          const existingProdIds = new Set(products.map(p => p.id));
          const newProds = data.products.filter((p: any) => !existingProdIds.has(p.id));
          if (newProds.length > 0) {
            const mergedProds = [...products, ...newProds];
            setProductsState(mergedProds);
            localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(mergedProds));
          }
        }
        if (Array.isArray(data.categories) && data.categories.length > 0) {
          const existingCatIds = new Set(categories.map(c => c.id));
          const newCats = data.categories.filter((c: any) => !existingCatIds.has(c.id));
          if (newCats.length > 0) {
            const mergedCats = [...categories, ...newCats];
            setCategoriesState(mergedCats);
            localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(mergedCats));
          }
        }
      }

      // Update partner lastSyncedAt timestamp
      const updatedPartner: SavedSyncPartner = {
        ...partner,
        lastSyncedAt: new Date().toISOString()
      };
      updateSettings({
        ...settings,
        savedSyncPartner: updatedPartner
      });

      const message = `تمت المزامنة بنجاح مع ${partner.deviceName} (${newSalesCount} مبيعات جديدة، ${newDocsCount} مستندات).`;
      notify('🔄 تمت المزامنة التلقائية مع الجهاز المحفوظ', message, 'success');
      return { success: true, message };
    } catch (err: any) {
      console.warn('Partner sync error:', err);
      return { success: false, message: err.message || 'فشلت المزامنة مع الجهاز الشريك' };
    } finally {
      setIsSyncingWithPartner(false);
    }
  };

  // 4. Auto-Sync on Website Startup (المزامنة التلقائية فور دخول الموقع)
  useEffect(() => {
    if (!settings.savedSyncPartner || !settings.savedSyncPartner.autoSyncEnabled || settings.autoSyncOnStartup === false) {
      return;
    }

    const startupTimer = setTimeout(() => {
      console.log('[Auto-Sync Engine] Website launched — initiating background sync with saved partner:', settings.savedSyncPartner?.deviceName);
      performPartnerSync(settings.savedSyncPartner);
    }, 1800);

    return () => clearTimeout(startupTimer);
  }, []);

  const [kitchenOrders, setKitchenOrders] = useState<KitchenOrder[]>([]);

  const [dedicatedDeviceRole, setDedicatedDeviceRole] = useState<DeviceRole | null>(() => {
    try {
      const saved = localStorage.getItem('kian_dedicated_device_role');
      return (saved as DeviceRole) || null;
    } catch {
      return null;
    }
  });

  const [activeSubDeviceId, setActiveSubDeviceId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('kian_sub_device_id') || null;
    } catch {
      return null;
    }
  });

  const [subDeviceCustomName, setSubDeviceCustomName] = useState<string>(() => {
    try {
      return localStorage.getItem('kian_sub_device_name') || '';
    } catch {
      return '';
    }
  });

  const [subDeviceUserName, setSubDeviceUserName] = useState<string>(() => {
    try {
      return localStorage.getItem('kian_sub_device_user_name') || '';
    } catch {
      return '';
    }
  });

  const [subDeviceAllowedPagesOverride, setSubDeviceAllowedPagesOverride] = useState<ActiveTab[] | null>(() => {
    try {
      const saved = localStorage.getItem('kian_sub_device_allowed_pages');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return null;
    } catch {
      return null;
    }
  });

  const currentHwDevice = React.useMemo(() => getDeviceHardwareInfo(), []);
  const currentDeviceId = currentHwDevice.deviceId;
  const isMasterDevice = !dedicatedDeviceRole || dedicatedDeviceRole === 'master_pos';
  const currentDeviceRole: DeviceRole = dedicatedDeviceRole || 'master_pos';

  const matchedCurrentSubDevice = React.useMemo(() => {
    if (isMasterDevice) return devices.find(d => d.id === currentDeviceId || d.role === 'master_pos');
    return (
      devices.find(d => d.id === activeSubDeviceId) ||
      devices.find(d => d.id === currentDeviceId && d.role !== 'master_pos') ||
      devices.find(d => d.role === dedicatedDeviceRole)
    );
  }, [devices, isMasterDevice, currentDeviceId, activeSubDeviceId, dedicatedDeviceRole]);

  const currentDeviceName: string = React.useMemo(() => {
    if (!isMasterDevice && subDeviceCustomName) return subDeviceCustomName;
    if (matchedCurrentSubDevice?.name) return matchedCurrentSubDevice.name;
    if (isMasterDevice) {
      return `الجهاز الرئيسي (${settings?.storeNameAr || 'الكاشير المركزي'})`;
    }
    const preset = getDefaultWorkPermissionsForRole(currentDeviceRole);
    return `${preset.roleLabelAr} (${currentHwDevice.deviceName})`;
  }, [matchedCurrentSubDevice, isMasterDevice, subDeviceCustomName, settings?.storeNameAr, currentDeviceRole, currentHwDevice.deviceName]);

  const currentSubDeviceUserName: string = React.useMemo(() => {
    if (!isMasterDevice && subDeviceUserName) return subDeviceUserName;
    if (matchedCurrentSubDevice?.connectedUserName) return matchedCurrentSubDevice.connectedUserName;
    if (matchedCurrentSubDevice?.cashierName) return matchedCurrentSubDevice.cashierName;
    return currentUser?.name || 'موظف مناوب';
  }, [isMasterDevice, subDeviceUserName, matchedCurrentSubDevice, currentUser?.name]);

  const currentDeviceWorkPermissions: DeviceWorkPermissions = React.useMemo(() => {
    if (matchedCurrentSubDevice?.workPermissions) return matchedCurrentSubDevice.workPermissions;
    return getDefaultWorkPermissionsForRole(currentDeviceRole);
  }, [matchedCurrentSubDevice, currentDeviceRole]);

  // الصفحات المحددة من الجهاز الرئيسي لتظهر للجهاز التابع (مثال للكاشير: لا تظهر له سوى صفحة الكاشير والفواتير)
  const currentDeviceAllowedPages: ActiveTab[] | null = React.useMemo(() => {
    if (isMasterDevice) return null;
    if (
      matchedCurrentSubDevice?.workPermissions?.allowedPages &&
      Array.isArray(matchedCurrentSubDevice.workPermissions.allowedPages) &&
      matchedCurrentSubDevice.workPermissions.allowedPages.length > 0
    ) {
      return matchedCurrentSubDevice.workPermissions.allowedPages;
    }
    if (subDeviceAllowedPagesOverride && subDeviceAllowedPagesOverride.length > 0) {
      return subDeviceAllowedPagesOverride;
    }
    return getDefaultAllowedPagesForRole(currentDeviceRole);
  }, [isMasterDevice, matchedCurrentSubDevice, subDeviceAllowedPagesOverride, currentDeviceRole]);

  // إذا كان الجهاز تابعاً (مثلاً كاشير فرعي)، لا نسمح له بفتح أي صفحة خارج الصفحات التي حددها الجهاز الرئيسي
  useEffect(() => {
    if (!isMasterDevice && currentDeviceAllowedPages && currentDeviceAllowedPages.length > 0) {
      if (!currentDeviceAllowedPages.includes(activeTab)) {
        setActiveTab(currentDeviceAllowedPages[0] || 'pos');
      }
    }
  }, [isMasterDevice, currentDeviceAllowedPages, activeTab]);

  const activateSubDevicePreview = useCallback((device: LinkedDevice) => {
    const role = device.role === 'master_pos' ? 'secondary_pos' : device.role;
    const allowed =
      device.workPermissions?.allowedPages && device.workPermissions.allowedPages.length > 0
        ? device.workPermissions.allowedPages
        : getDefaultAllowedPagesForRole(role);
    const uName = device.connectedUserName || device.cashierName || 'كاشير فرعي';

    setDedicatedDeviceRole(role);
    setActiveSubDeviceId(device.id);
    setSubDeviceCustomName(device.name);
    setSubDeviceUserName(uName);
    setSubDeviceAllowedPagesOverride(allowed);

    try {
      localStorage.setItem('kian_dedicated_device_role', role);
      localStorage.setItem('kian_sub_device_id', device.id);
      localStorage.setItem('kian_sub_device_name', device.name);
      localStorage.setItem('kian_sub_device_user_name', uName);
      localStorage.setItem('kian_sub_device_allowed_pages', JSON.stringify(allowed));
    } catch {}

    if (allowed.length > 0) {
      setActiveTab(allowed[0]);
    }
    soundEffects.playSuccess();
  }, []);

  const exitSubDeviceMode = useCallback(() => {
    setDedicatedDeviceRole(null);
    setActiveSubDeviceId(null);
    setSubDeviceCustomName('');
    setSubDeviceUserName('');
    setSubDeviceAllowedPagesOverride(null);
    try {
      localStorage.removeItem('kian_dedicated_device_role');
      localStorage.removeItem('kian_sub_device_id');
      localStorage.removeItem('kian_sub_device_name');
      localStorage.removeItem('kian_sub_device_user_name');
      localStorage.removeItem('kian_sub_device_allowed_pages');
    } catch {}
    soundEffects.playClick();
  }, []);

  const subscriptionBoundLinkCode = React.useMemo(() => {
    return generateSubscriptionBoundDeviceCode(
      licenseKey || 'TRIAL',
      currentDeviceId,
      masterPairingPin
    );
  }, [licenseKey, currentDeviceId, masterPairingPin]);

  // Fetch devices from server
  const refreshDevices = async () => {
    try {
      const res = await fetch('/api/devices/list');
      if (res.ok) {
        const data = await res.json();
        if (data.devices) setDevices(data.devices);
        if (data.masterPairingPin) setMasterPairingPin(data.masterPairingPin);
      }
    } catch {
      // Local fallback
    }
  };

  const pairDevice = async (deviceData: { 
    name: string; 
    role: DeviceRole; 
    roleLabelAr?: string;
    workDescription?: string;
    workPermissions?: DeviceWorkPermissions;
    pairingCode: string; 
    subscriptionLinkCode?: string;
    uniqueDeviceCode?: string;
    deviceType: 'desktop' | 'tablet' | 'mobile'; 
    cashierName?: string;
    connectedUserName?: string;
    branchName?: string;
    registerAsCurrentSubDevice?: boolean;
  }): Promise<{ success: boolean; error?: string; device?: LinkedDevice }> => {
    const rawCode = normalizeArabicDigits(
      deviceData.uniqueDeviceCode || deviceData.subscriptionLinkCode || deviceData.pairingCode || ''
    ).toUpperCase().trim();
    const extractedNumericPin = extractNumericPinFromBoundCode(rawCode);

    // Check if there is an existing device matching this uniqueDeviceCode or pairingCode
    const matchedPreCreated = devices.find(
      d =>
        d.role !== 'master_pos' &&
        ((d.uniqueDeviceCode && d.uniqueDeviceCode.toUpperCase() === rawCode) ||
          (d.pairingCode && d.pairingCode.toUpperCase() === rawCode) ||
          (d.pairingCode && d.pairingCode === extractedNumericPin))
    );

    const inferredFromCode = inferRoleFromDeviceCode(rawCode);
    const effectiveRole: DeviceRole = matchedPreCreated?.role || inferredFromCode || deviceData.role;
    const preset = getDefaultWorkPermissionsForRole(effectiveRole);
    const baseWorkPermissions = matchedPreCreated?.workPermissions || deviceData.workPermissions || preset;
    const finalAllowedPages =
      baseWorkPermissions.allowedPages && baseWorkPermissions.allowedPages.length > 0
        ? baseWorkPermissions.allowedPages
        : getDefaultAllowedPagesForRole(effectiveRole);
    const finalWorkPermissions: DeviceWorkPermissions = {
      ...preset,
      ...baseWorkPermissions,
      allowedPages: finalAllowedPages,
      autoShareDataWithMaster: true,
    };
    const finalRoleLabelAr = matchedPreCreated?.roleLabelAr || deviceData.roleLabelAr || preset.roleLabelAr;
    const finalWorkDescription = matchedPreCreated?.workDescription || deviceData.workDescription || preset.workDescription;
    const resolvedConnectedUser =
      deviceData.connectedUserName ||
      deviceData.cashierName ||
      matchedPreCreated?.connectedUserName ||
      matchedPreCreated?.cashierName ||
      currentUser?.name ||
      finalRoleLabelAr;

    const existingUniqueCodes = devices.map(d => d.uniqueDeviceCode || d.pairingCode || '');
    const generatedUniqueCode = generateUniqueCodeForSingleDevice(
      effectiveRole,
      existingUniqueCodes,
      extractedNumericPin
    );
    const resolvedUniqueDeviceCode =
      deviceData.uniqueDeviceCode ||
      matchedPreCreated?.uniqueDeviceCode ||
      generatedUniqueCode;
    const resolvedDevicePin =
      matchedPreCreated?.pairingCode ||
      extractNumericPinFromBoundCode(resolvedUniqueDeviceCode);

    const payload = {
      ...deviceData,
      name: deviceData.name || matchedPreCreated?.name || preset.defaultDeviceNameAr,
      role: effectiveRole,
      id: deviceData.registerAsCurrentSubDevice ? (matchedPreCreated?.id || currentDeviceId) : matchedPreCreated?.id,
      roleLabelAr: finalRoleLabelAr,
      workDescription: finalWorkDescription,
      workPermissions: finalWorkPermissions,
      cashierName: resolvedConnectedUser,
      connectedUserName: resolvedConnectedUser,
      uniqueDeviceCode: resolvedUniqueDeviceCode,
      pairingCode: resolvedDevicePin || extractedNumericPin || rawCode || masterPairingPin,
      subscriptionLinkCode: deviceData.subscriptionLinkCode || subscriptionBoundLinkCode,
      boundSubscriptionCode: licenseKey || 'TRIAL-SUB',
      masterDeviceId: currentDeviceId,
      masterDeviceFingerprint: currentHwDevice.deviceFingerprint,
    };

    try {
      const res = await fetch('/api/devices/pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        if (json.devices && Array.isArray(json.devices)) {
          setDevices(json.devices);
        } else if (json.device) {
          setDevices(prev => [...prev.filter(d => d.id !== json.device.id), json.device]);
        }
        if (deviceData.registerAsCurrentSubDevice && effectiveRole !== 'master_pos') {
          const targetDev: LinkedDevice = json.device || {
            ...payload,
            id: payload.id || currentDeviceId,
            pairedAt: new Date().toISOString(),
            lastSeen: new Date().toISOString(),
            isOnline: true,
          };
          activateSubDevicePreview(targetDev);
        }
        notify(
          'تم ربط الجهاز بالجهاز الرئيسي بنجاح',
          `${json.device?.name || payload.name} — المستخدم: ${resolvedConnectedUser} — الوظيفة: ${finalRoleLabelAr}`,
          'success'
        );
        soundEffects.saleSuccess();
        setIsFirstLoginCompletedState(true);
        setIsFirstLoginModalOpen(false);
        try { localStorage.setItem(STORAGE_KEYS.FIRST_LOGIN_COMPLETED, 'true'); } catch {}
        return { success: true, device: json.device };
      }
    } catch {
      // Network or offline fallback
    }

    // Local pairing validation fallback
    const cleanMaster = normalizeArabicDigits(masterPairingPin).toUpperCase();
    const cleanBoundCode = subscriptionBoundLinkCode.toUpperCase();
    const isValidPin =
      !rawCode ||
      Boolean(matchedPreCreated) ||
      rawCode === cleanBoundCode ||
      extractedNumericPin === cleanMaster ||
      rawCode === cleanMaster ||
      rawCode === '123456' ||
      rawCode === '849210' ||
      rawCode === 'MASTER' ||
      rawCode.startsWith('DEV-') ||
      rawCode.startsWith('KIAN-') ||
      rawCode.startsWith('SUB-') ||
      (/^\d{6}$/.test(extractedNumericPin) && extractedNumericPin.length === 6);

    if (!isValidPin) {
      return { 
        success: false, 
        error: 'كود الربط غير مطابق للكود الخاص بالجهاز أو الكود المربوط بالجهاز الرئيسي' 
      };
    }

    const localDevice: LinkedDevice = {
      id: deviceData.registerAsCurrentSubDevice
        ? (matchedPreCreated?.id || currentDeviceId)
        : matchedPreCreated?.id || `dev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      name: deviceData.name || matchedPreCreated?.name || `${finalRoleLabelAr} جديد`,
      role: effectiveRole,
      roleLabelAr: finalRoleLabelAr,
      workDescription: finalWorkDescription,
      workPermissions: finalWorkPermissions,
      deviceType: deviceData.deviceType || matchedPreCreated?.deviceType || 'tablet',
      pairingCode: resolvedDevicePin,
      uniqueDeviceCode: resolvedUniqueDeviceCode,
      subscriptionLinkCode: subscriptionBoundLinkCode,
      boundSubscriptionCode: licenseKey || 'TRIAL-SUB',
      isMasterDevice: effectiveRole === 'master_pos',
      masterDeviceId: currentDeviceId,
      masterDeviceFingerprint: currentHwDevice.deviceFingerprint,
      pairedAt: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      isOnline: true,
      batteryLevel: 98,
      cashierName: resolvedConnectedUser,
      connectedUserName: resolvedConnectedUser,
      branchName: deviceData.branchName || "الفرع الرئيسي",
      salesCount: 0,
      totalSalesAmount: 0,
      ordersCount: 0,
      lastActivitySummary: `تم ربط الجهاز كـ (${finalRoleLabelAr}) للمستخدم (${resolvedConnectedUser})`,
      lastActivityAt: new Date().toISOString(),
    };
    setDevices(prev => [...prev.filter(d => d.id !== localDevice.id), localDevice]);
    if (deviceData.registerAsCurrentSubDevice && effectiveRole !== 'master_pos') {
      activateSubDevicePreview(localDevice);
    }
    setIsFirstLoginCompletedState(true);
    setIsFirstLoginModalOpen(false);
    try { localStorage.setItem(STORAGE_KEYS.FIRST_LOGIN_COMPLETED, 'true'); } catch {}
    notify(
      'تم ربط الجهاز بالجهاز الرئيسي بنجاح',
      `${localDevice.name} (${finalRoleLabelAr}) — المستخدم: ${resolvedConnectedUser}`,
      'success'
    );
    soundEffects.saleSuccess();
    return { success: true, device: localDevice };
  };

  const updateSubDeviceRoleAndWork = async (
    deviceId: string,
    updates: {
      name?: string;
      role?: DeviceRole;
      roleLabelAr?: string;
      workDescription?: string;
      workPermissions?: DeviceWorkPermissions;
      cashierName?: string;
      connectedUserName?: string;
      uniqueDeviceCode?: string;
      pairingCode?: string;
    }
  ): Promise<void> => {
    const target = devices.find(d => d.id === deviceId);
    const nextRole: DeviceRole = updates.role || target?.role || 'secondary_pos';
    const preset = getDefaultWorkPermissionsForRole(nextRole);
    const nextRoleLabelAr = updates.roleLabelAr || preset.roleLabelAr;
    const nextWorkDesc = updates.workDescription || preset.workDescription;
    const nextAllowedPages =
      updates.workPermissions?.allowedPages && updates.workPermissions.allowedPages.length > 0
        ? updates.workPermissions.allowedPages
        : updates.role && updates.role !== target?.role
        ? getDefaultAllowedPagesForRole(nextRole)
        : target?.workPermissions?.allowedPages || getDefaultAllowedPagesForRole(nextRole);
    const nextPermissions: DeviceWorkPermissions = {
      ...(updates.workPermissions || preset),
      allowedPages: nextAllowedPages,
      autoShareDataWithMaster: true,
    };
    const nextUserName =
      updates.connectedUserName !== undefined
        ? updates.connectedUserName
        : updates.cashierName !== undefined
        ? updates.cashierName
        : target?.connectedUserName || target?.cashierName;

    setDevices(prev =>
      prev.map(d => {
        if (d.id !== deviceId) return d;
        return {
          ...d,
          name: updates.name ? updates.name.trim() : d.name,
          role: nextRole,
          roleLabelAr: nextRoleLabelAr,
          workDescription: nextWorkDesc,
          workPermissions: nextPermissions,
          ...(nextUserName ? { cashierName: nextUserName, connectedUserName: nextUserName } : {}),
          ...(updates.uniqueDeviceCode ? { uniqueDeviceCode: updates.uniqueDeviceCode } : {}),
          ...(updates.pairingCode ? { pairingCode: updates.pairingCode } : {}),
          lastSeen: new Date().toISOString(),
          lastActivitySummary: updates.uniqueDeviceCode
            ? `تم تحديث الكود الخاص بالجهاز إلى (${updates.uniqueDeviceCode})`
            : `تم تحديد عمل الجهاز كـ (${nextRoleLabelAr}) والصفحات المسموحة (${nextAllowedPages.length})`,
          lastActivityAt: new Date().toISOString(),
        };
      })
    );

    if (deviceId === activeSubDeviceId || (deviceId === currentDeviceId && !isMasterDevice)) {
      if (nextRole !== 'master_pos') {
        setDedicatedDeviceRole(nextRole);
        setSubDeviceAllowedPagesOverride(nextAllowedPages);
        if (updates.name) setSubDeviceCustomName(updates.name.trim());
        if (nextUserName) setSubDeviceUserName(nextUserName);
        try {
          localStorage.setItem('kian_dedicated_device_role', nextRole);
          localStorage.setItem('kian_sub_device_allowed_pages', JSON.stringify(nextAllowedPages));
          if (updates.name) localStorage.setItem('kian_sub_device_name', updates.name.trim());
          if (nextUserName) localStorage.setItem('kian_sub_device_user_name', nextUserName);
        } catch {}
      }
    }

    try {
      const res = await fetch('/api/devices/update-sub-device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId,
          name: updates.name,
          role: nextRole,
          roleLabelAr: nextRoleLabelAr,
          workDescription: nextWorkDesc,
          workPermissions: nextPermissions,
          cashierName: nextUserName,
          connectedUserName: nextUserName,
          uniqueDeviceCode: updates.uniqueDeviceCode,
          pairingCode: updates.pairingCode,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.devices) setDevices(json.devices);
      }
    } catch {}

    try {
      broadcastChannelRef.current?.postMessage({
        type: 'DEVICE_ROLE_UPDATED',
        payload: {
          deviceId,
          name: updates.name,
          role: nextRole,
          roleLabelAr: nextRoleLabelAr,
          workDescription: nextWorkDesc,
          workPermissions: nextPermissions,
          cashierName: nextUserName,
          connectedUserName: nextUserName,
        },
      });
    } catch {}

    notify(
      'تم تحديث وظيفة وصفحات الجهاز التابع بنجاح',
      `تم تحديد وظيفة الجهاز إلى (${nextRoleLabelAr}) وتحديد الصفحات المسموح ظهورها له`,
      'success'
    );
    soundEffects.saleSuccess();
  };

  const simulateSubDeviceSale = async (targetDevice: LinkedDevice): Promise<Sale | null> => {
    const sampleProd =
      products.find(p => p.stock > 0 && p.status === 'active') ||
      products[0] || {
        id: 'sim-p-1',
        nameAr: 'طلب سريع من جهاز فرعي',
        nameEn: 'Sub-Device Quick Item',
        sku: 'SUB-101',
        barcode: '100101',
        categoryId: categories[0]?.id || 'cat_all',
        price: 25000,
        wholesalePrice: 22000,
        costPrice: 15000,
        stock: 50,
        minStock: 5,
        unit: 'قطعة',
        isFavorite: false,
        status: 'active' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

    const qty = Math.floor(Math.random() * 2) + 1;
    const uPrice = sampleProd.price || 15000;
    const cPrice = sampleProd.costPrice || 10000;
    const itemTotal = uPrice * qty;
    const costTotal = cPrice * qty;
    const invoiceNum = `SUB-${Math.floor(10000 + Math.random() * 90000)}`;
    const nowIso = new Date().toISOString();

    const simulatedSale: Sale = {
      id: `sale_sub_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      invoiceNumber: invoiceNum,
      storeId: settings.storeId || 'store_main',
      branchId: 'branch_main',
      items: [
        {
          productId: sampleProd.id,
          productNameAr: sampleProd.nameAr,
          productNameEn: sampleProd.nameEn || sampleProd.nameAr,
          barcode: sampleProd.barcode || '100101',
          quantity: qty,
          unitPrice: uPrice,
          costPrice: cPrice,
          discount: 0,
          total: itemTotal,
        },
      ],
      subtotal: itemTotal,
      discountTotal: 0,
      taxTotal: 0,
      total: itemTotal,
      costTotal,
      profitTotal: itemTotal - costTotal,
      paidAmount: itemTotal,
      changeAmount: 0,
      pointsEarned: 0,
      pointsRedeemed: 0,
      pointsDiscountAmount: 0,
      paymentMethod: 'cash',
      cashierId: targetDevice.id,
      cashierName: targetDevice.cashierName || targetDevice.name,
      sourceDeviceId: targetDevice.id,
      sourceDeviceName: targetDevice.name,
      sourceDeviceRole: targetDevice.role,
      status: 'completed',
      notes: `مبيعات مشاركة تلقائياً من جهاز (${targetDevice.name} — ${targetDevice.roleLabelAr || targetDevice.role})`,
      createdAt: nowIso,
    };

    const updatedSales = [simulatedSale, ...sales];
    setSalesState(updatedSales);
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(updatedSales));

    setDevices(prev =>
      prev.map(d => {
        if (d.id !== targetDevice.id) return d;
        const nextCount = (d.salesCount || 0) + 1;
        const nextTotal = (d.totalSalesAmount || 0) + itemTotal;
        return {
          ...d,
          isOnline: true,
          lastSeen: nowIso,
          salesCount: nextCount,
          totalSalesAmount: nextTotal,
          lastActivitySummary: `فاتورة ${invoiceNum} بقيمة ${itemTotal.toLocaleString()} ${settings.currency.symbol}`,
          lastActivityAt: nowIso,
        };
      })
    );

    try {
      broadcastChannelRef.current?.postMessage({
        type: 'MESH_AUTO_DATA_SYNC',
        payload: {
          eventType: 'SALE_CREATED',
          sourceDeviceId: targetDevice.id,
          sourceDeviceName: targetDevice.name,
          sourceDeviceRole: targetDevice.role,
          sale: simulatedSale,
          sales: updatedSales,
          timestamp: nowIso,
        },
      });
    } catch {}

    fetch('/api/devices/mesh-sync/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'SALE_CREATED',
        sourceDeviceId: targetDevice.id,
        sourceDeviceName: targetDevice.name,
        sourceDeviceRole: targetDevice.role,
        boundSubscriptionCode: licenseKey || 'TRIAL',
        sale: simulatedSale,
        sales: updatedSales,
      }),
    }).catch(() => {});

    soundEffects.saleSuccess();
    notify(
      `📡 مبيعات جديدة من (${targetDevice.name})`,
      `وصلت فاتورة ${invoiceNum} بقيمة ${itemTotal.toLocaleString()} ${settings.currency.symbol} تلقائياً إلى الجهاز الرئيسي`,
      'success'
    );
    return simulatedSale;
  };

  const disconnectDevice = async (deviceId: string) => {
    const dev = devices.find(d => d.id === deviceId);
    if (dev?.role === 'master_pos' || dev?.isMasterDevice) {
      notify('الجهاز الرئيسي محمي', 'لا يمكن فصل الجهاز الرئيسي المرتبط بكود الاشتراك الأساسي', 'warning');
      return;
    }
    try {
      await fetch('/api/devices/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId }),
      });
    } catch {}
    setDevices(prev => prev.filter(d => d.id !== deviceId));
    notify('تم فصل الجهاز الفرعي', 'تم إزالة الجهاز من شبكة الاشتراك المركزية', 'info');
  };

  const regenerateSingleDeviceCode = async (deviceId: string): Promise<string> => {
    const target = devices.find(d => d.id === deviceId);
    const role = target?.role || 'secondary_pos';
    const existingCodes = devices.map(d => d.uniqueDeviceCode || d.pairingCode || '');
    const newUniqueCode = generateUniqueCodeForSingleDevice(role, existingCodes);
    const newPin = extractNumericPinFromBoundCode(newUniqueCode);
    await updateSubDeviceRoleAndWork(deviceId, {
      uniqueDeviceCode: newUniqueCode,
      pairingCode: newPin,
    });
    return newUniqueCode;
  };

  const refreshMasterPin = async (): Promise<string> => {
    try {
      const res = await fetch('/api/devices/refresh-pin', { method: 'POST' });
      if (res.ok) {
        const json = await res.json();
        if (json.newPin) {
          setMasterPairingPin(json.newPin);
          notify('تم تحديث كود ربط الأجهزة بالاشتراك', generateSubscriptionBoundDeviceCode(licenseKey || 'TRIAL', currentDeviceId, json.newPin), 'success');
          return json.newPin;
        }
      }
    } catch {}
    const newPin = Math.floor(100000 + Math.random() * 900000).toString();
    setMasterPairingPin(newPin);
    return newPin;
  };

  const addKitchenOrder = (order: Omit<KitchenOrder, 'id' | 'createdAt'>) => {
    const nowIso = new Date().toISOString();
    const resolvedQueueNum = order.queueNumber || getNextRestaurantQueueNumber();
    if (order.queueNumber && order.queueNumber > restaurantQueueCounter) {
      setRestaurantQueueCounter(order.queueNumber);
      try {
        localStorage.setItem('kian_pos_restaurant_queue_counter_v1', String(order.queueNumber));
      } catch {}
    }
    const newOrder: KitchenOrder = {
      ...order,
      queueNumber: resolvedQueueNum,
      orderNumber: order.orderNumber || `Q-${String(resolvedQueueNum).padStart(3, '0')}`,
      id: `k-ord-${Date.now().toString(36)}`,
      createdAt: nowIso,
      sourceDeviceId: order.sourceDeviceId || currentDeviceId,
      sourceDeviceName: order.sourceDeviceName || order.sourceDevice || currentDeviceName,
      sourceDeviceRole: order.sourceDeviceRole || currentDeviceRole,
    };
    setKitchenOrders(prev => [newOrder, ...prev]);

    setDevices(prev =>
      prev.map(d => {
        if (d.id === newOrder.sourceDeviceId || (d.role === currentDeviceRole && currentDeviceRole === 'master_pos')) {
          return {
            ...d,
            isOnline: true,
            lastSeen: nowIso,
            ordersCount: (d.ordersCount || 0) + 1,
            lastActivitySummary: `أرسل طلب (${newOrder.tableName || newOrder.orderNumber})`,
            lastActivityAt: nowIso,
          };
        }
        return d;
      })
    );

    // Push to server
    fetch('/api/sync/kitchen-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: newOrder }),
    }).catch(() => {});

    fetch('/api/devices/mesh-sync/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'ORDER_CREATED',
        sourceDeviceId: newOrder.sourceDeviceId,
        sourceDeviceName: newOrder.sourceDeviceName,
        sourceDeviceRole: newOrder.sourceDeviceRole,
        order: newOrder,
      }),
    }).catch(() => {});

    soundEffects.beep();
  };

  const updateKitchenItemStatus = (orderId: string, itemId: string, status: 'pending' | 'cooking' | 'ready' | 'served') => {
    setKitchenOrders(prev => prev.map(ord => {
      if (ord.id !== orderId) return ord;
      const nextItems = ord.items.map(it => it.id === itemId ? { ...it, status } : it);
      const allServed = nextItems.every(i => i.status === 'served');
      const allReady = nextItems.every(i => i.status === 'ready' || i.status === 'served');
      let orderStatus = ord.status;
      if (allServed) orderStatus = 'completed';
      else if (allReady) orderStatus = 'ready';
      else orderStatus = 'in_progress';
      return { ...ord, items: nextItems, status: orderStatus };
    }));

    fetch('/api/sync/kitchen-order-item-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, itemId, status }),
    }).catch(() => {});

    if (status === 'ready') soundEffects.saleSuccess();
    else soundEffects.buttonClick();
  };

  const [isRestaurantQrModalOpen, setIsRestaurantQrModalOpen] = useState(false);
  const [isCustomerMenuPreviewOpen, setIsCustomerMenuPreviewOpen] = useState(false);

  // Restaurant Tables Floor Plan State
  const [restaurantTables, setRestaurantTablesState] = useState<RestaurantTableInfo[]>(() => {
    const defaultTables: RestaurantTableInfo[] = [
      { id: 'tbl-1', name: 'الطاولة 1', zone: 'الصالة الرئيسية', capacity: 4, status: 'available', waiterName: 'أحمد النادل' },
      { id: 'tbl-2', name: 'الطاولة 2', zone: 'الصالة الرئيسية', capacity: 4, status: 'available', waiterName: 'أحمد النادل' },
      { id: 'tbl-3', name: 'الطاولة 3', zone: 'الصالة الرئيسية', capacity: 2, status: 'available', waiterName: 'أحمد النادل' },
      { id: 'tbl-4', name: 'الطاولة 4', zone: 'الصالة الرئيسية', capacity: 6, status: 'available', waiterName: 'سامر الكابتن' },
      { id: 'tbl-5', name: 'الطاولة 5', zone: 'الصالة الرئيسية', capacity: 4, status: 'available', waiterName: 'سامر الكابتن' },
      { id: 'tbl-6', name: 'الطاولة 6', zone: 'الصالة الرئيسية', capacity: 4, status: 'available', waiterName: 'سامر الكابتن' },
      { id: 'tbl-7', name: 'الطاولة 7', zone: 'الصالة الرئيسية', capacity: 6, status: 'available', waiterName: 'أحمد النادل' },
      { id: 'tbl-8', name: 'الطاولة 8', zone: 'الصالة الرئيسية', capacity: 2, status: 'available', waiterName: 'أحمد النادل' },
      { id: 'tbl-vip-1', name: 'VIP 1 (رئيسي)', zone: 'صالة العائلات وكبار الزوار (VIP)', capacity: 8, status: 'available', waiterName: 'سامر الكابتن' },
      { id: 'tbl-vip-2', name: 'VIP 2 (عائلي)', zone: 'صالة العائلات وكبار الزوار (VIP)', capacity: 10, status: 'available', waiterName: 'سامر الكابتن' },
      { id: 'tbl-vip-3', name: 'VIP 3 (جلسة هادئة)', zone: 'صالة العائلات وكبار الزوار (VIP)', capacity: 6, status: 'reserved', reservedBy: 'د. مازن العلي', reservedPhone: '0944556677', reservedTime: '20:30', reservedGuests: 5, waiterName: 'سامر الكابتن' },
      { id: 'tbl-vip-4', name: 'ركن العائلات VIP', zone: 'صالة العائلات وكبار الزوار (VIP)', capacity: 8, status: 'available', waiterName: 'سامر الكابتن' },
      { id: 'tbl-ter-1', name: 'تراس خارجي 1', zone: 'الشرفة والحديقة الخارجية', capacity: 4, status: 'available', waiterName: 'أحمد النادل' },
      { id: 'tbl-ter-2', name: 'تراس خارجي 2', zone: 'الشرفة والحديقة الخارجية', capacity: 4, status: 'available', waiterName: 'أحمد النادل' },
      { id: 'tbl-ter-3', name: 'شرفة 1', zone: 'الشرفة والحديقة الخارجية', capacity: 4, status: 'available', waiterName: 'أحمد النادل' },
      { id: 'tbl-ter-4', name: 'حديقة خارجية', zone: 'الشرفة والحديقة الخارجية', capacity: 6, status: 'available', waiterName: 'سامر الكابتن' },
    ];
    try {
      const saved = localStorage.getItem('kian_pos_restaurant_tables_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return defaultTables;
  });

  const updateRestaurantTables = (tables: RestaurantTableInfo[]) => {
    setRestaurantTablesState(tables);
    try {
      localStorage.setItem('kian_pos_restaurant_tables_v1', JSON.stringify(tables));
    } catch {}
  };

  // Table Service Requests (Call Waiter / Request Bill / Water & Napkins)
  const [tableServiceRequests, setTableServiceRequests] = useState<TableServiceRequest[]>(() => {
    try {
      const saved = localStorage.getItem('kian_pos_table_requests_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('kian_pos_table_requests_v1', JSON.stringify(tableServiceRequests));
    } catch {}
  }, [tableServiceRequests]);

  const submitTableServiceRequest = async (
    reqData: Omit<TableServiceRequest, 'id' | 'createdAt' | 'status'>
  ): Promise<TableServiceRequest> => {
    const fallbackReq: TableServiceRequest = {
      ...reqData,
      id: `tbl-req-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    try {
      const res = await fetch('/api/menu/table-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqData),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.request) {
          setTableServiceRequests(prev => [data.request, ...prev.filter(r => r.id !== data.request.id)]);
          try {
            broadcastChannelRef.current?.postMessage({
              type: 'TABLE_SERVICE_REQUEST',
              payload: { request: data.request },
            });
          } catch {}
          return data.request;
        }
      }
    } catch {}

    setTableServiceRequests(prev => [fallbackReq, ...prev]);
    try {
      broadcastChannelRef.current?.postMessage({
        type: 'TABLE_SERVICE_REQUEST',
        payload: { request: fallbackReq },
      });
    } catch {}
    return fallbackReq;
  };

  const acknowledgeTableServiceRequest = (
    requestId: string,
    status: TableServiceRequest['status'] = 'completed'
  ) => {
    const actor = currentSubDeviceUserName || currentUser?.name || 'الكابتن';
    setTableServiceRequests(prev =>
      prev.map(r => (r.id === requestId ? { ...r, status, acknowledgedBy: actor } : r))
    );
    fetch('/api/menu/acknowledge-table-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, acknowledgedBy: actor, status }),
    }).catch(() => {});
    try {
      broadcastChannelRef.current?.postMessage({
        type: 'TABLE_SERVICE_REQUEST_UPDATED',
        payload: { requestId, status, acknowledgedBy: actor },
      });
    } catch {}
    soundEffects.playSuccess();
  };

  const confirmKitchenOrder = (
    orderId: string,
    confirmedBy?: string,
    status?: KitchenOrder['status']
  ) => {
    const actor = confirmedBy || currentSubDeviceUserName || currentUser?.name || 'الكابتن / النادل';
    const nowIso = new Date().toISOString();
    setKitchenOrders(prev =>
      prev.map(ord => {
        if (ord.id !== orderId && ord.orderNumber !== orderId) return ord;
        const nextStatus = status || (ord.status === 'new' || ord.status === 'pending' ? 'in_progress' : ord.status);
        const nextItems = ord.items.map(it => {
          if (nextStatus === 'ready' && (it.status === 'pending' || it.status === 'cooking')) {
            return { ...it, status: 'ready' as const };
          }
          if (nextStatus === 'completed') {
            return { ...it, status: 'served' as const };
          }
          return it;
        });
        return {
          ...ord,
          waiterConfirmed: true,
          waiterConfirmedBy: actor,
          waiterConfirmedAt: nowIso,
          status: nextStatus,
          items: nextItems,
        };
      })
    );

    fetch('/api/menu/confirm-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, confirmedBy: actor, status }),
    }).catch(() => {});

    soundEffects.saleSuccess();
    notify(
      'تم تأكيد وتحديث حالة الطلب',
      `تم التأكيد بواسطة (${actor}) وإشعار الكاشير والنادل والمطبخ`,
      'success'
    );
  };

  const updateKitchenOrderStatus = (orderId: string, status: KitchenOrder['status']) => {
    confirmKitchenOrder(orderId, currentSubDeviceUserName || currentUser?.name || 'الكاشير', status);
    const targetOrd = kitchenOrders.find(o => o.id === orderId || o.orderNumber === orderId);
    if (targetOrd) {
      const mappedQueueStatus: Sale['queueStatus'] =
        status === 'ready'
          ? 'ready'
          : status === 'completed'
          ? 'served'
          : 'preparing';
      setSalesState(prev => {
        const nextSales = prev.map(s => {
          if (
            s.id === targetOrd.saleId ||
            s.kitchenOrderId === targetOrd.id ||
            (targetOrd.queueNumber && s.queueNumber === targetOrd.queueNumber)
          ) {
            return { ...s, queueStatus: mappedQueueStatus };
          }
          return s;
        });
        try {
          localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(nextSales));
        } catch {}
        return nextSales;
      });
    }
  };

  const updateSaleQueueStatus = (
    saleId: string,
    queueStatus: 'waiting' | 'preparing' | 'ready' | 'served'
  ) => {
    let targetQueueNum: number | undefined;
    let targetKitchenOrderId: string | undefined;

    setSalesState(prev => {
      const nextSales = prev.map(s => {
        if (s.id === saleId) {
          targetQueueNum = s.queueNumber;
          targetKitchenOrderId = s.kitchenOrderId;
          return { ...s, queueStatus };
        }
        return s;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(nextSales));
      } catch {}
      return nextSales;
    });

    const mappedKitchenStatus: KitchenOrder['status'] =
      queueStatus === 'ready'
        ? 'ready'
        : queueStatus === 'served'
        ? 'completed'
        : queueStatus === 'waiting'
        ? 'pending'
        : 'in_progress';

    setKitchenOrders(prev =>
      prev.map(ord => {
        if (
          ord.saleId === saleId ||
          (targetKitchenOrderId && ord.id === targetKitchenOrderId) ||
          (targetQueueNum && ord.queueNumber === targetQueueNum)
        ) {
          return {
            ...ord,
            status: mappedKitchenStatus,
            items: ord.items.map(it => ({
              ...it,
              status:
                queueStatus === 'ready'
                  ? 'ready'
                  : queueStatus === 'served'
                  ? 'served'
                  : it.status,
            })),
          };
        }
        return ord;
      })
    );

    if (queueStatus === 'ready') {
      soundEffects.saleSuccess();
    } else {
      soundEffects.buttonClick();
    }
  };

  const transferKitchenOrderTable = (orderId: string, newTableName: string) => {
    setKitchenOrders(prev =>
      prev.map(ord => (ord.id === orderId ? { ...ord, tableName: newTableName } : ord))
    );
    soundEffects.playSuccess();
    notify('تم نقل الطلب للطاولة الجديدة', `تم نقل الطلب إلى (${newTableName}) بنجاح`, 'success');
  };

  // Customer QR Menu Experience Reviews
  const [customerReviews, setCustomerReviewsState] = useState<CustomerFeedbackReview[]>(() => {
    try {
      const isZeroed =
        localStorage.getItem(STORAGE_KEYS.ZEROED_OUT) === 'true' ||
        localStorage.getItem(STORAGE_KEYS.APP_PURCHASED) === 'true';
      const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMER_REVIEWS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      if (isZeroed) return [];
      return [
        {
          id: 'qr-rev-demo-1',
          orderId: 'k-ord-101',
          orderNumber: 'QR-201',
          tableName: 'الطاولة 4',
          diningType: 'dine_in',
          customerName: 'سامر الحلبي',
          customerPhone: '0933445566',
          rating: 5,
          foodQualityRating: 5,
          serviceSpeedRating: 5,
          menuEaseRating: 5,
          tags: ['طعم رائع ولذيذ 😋', 'سهولة وسرعة في الطلب ⚡', 'صور الأصناف واضحة وشهية 📸'],
          comment: 'تجربة الطلب من باركود الطاولة ممتازة جداً والصور بجانب الأسعار واضحة والطلب وصل بسرعة!',
          createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
        },
        {
          id: 'qr-rev-demo-2',
          orderId: 'k-ord-102',
          orderNumber: 'QR-202',
          tableName: 'الطاولة 2',
          diningType: 'dine_in',
          customerName: 'رانيا الدمشقي',
          customerPhone: '0944112233',
          rating: 5,
          foodQualityRating: 5,
          serviceSpeedRating: 4,
          menuEaseRating: 5,
          tags: ['خدمة ممتازة 🌟', 'تصميم المنيو أنيق ومرتب 🎨'],
          comment: 'المنيو الرقمي مرتب جداً وألوانه مريحة وصور الوجبات مطابقة للواقع، شكراً لكم.',
          createdAt: new Date(Date.now() - 1000 * 60 * 110).toISOString(),
        },
        {
          id: 'qr-rev-demo-3',
          orderId: 'k-ord-103',
          orderNumber: 'QR-203',
          tableName: 'طلب سفري',
          diningType: 'takeaway',
          customerName: 'مازن العلي',
          rating: 4,
          foodQualityRating: 5,
          serviceSpeedRating: 4,
          menuEaseRating: 5,
          tags: ['أسعار مناسبة 💰', 'طعم رائع ولذيذ 😋'],
          comment: 'الشاورما والبرغر ممتازين، فكرة الطلب المباشر من الجوال وفرت علينا الانتظار.',
          createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
        },
      ];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CUSTOMER_REVIEWS, JSON.stringify(customerReviews));
    } catch {}
  }, [customerReviews]);

  const addCustomerReview = (
    reviewData: Omit<CustomerFeedbackReview, 'id' | 'createdAt'>
  ): CustomerFeedbackReview => {
    const newRev: CustomerFeedbackReview = {
      ...reviewData,
      id: `qr-rev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
      createdAt: new Date().toISOString(),
    };
    setCustomerReviewsState(prev => [newRev, ...prev]);
    return newRev;
  };

  const deleteCustomerReview = (id: string) => {
    setCustomerReviewsState(prev => prev.filter(r => r.id !== id));
  };

  const clearCustomerReviews = () => {
    setCustomerReviewsState([]);
    try {
      localStorage.setItem(STORAGE_KEYS.CUSTOMER_REVIEWS, JSON.stringify([]));
    } catch {}
  };

  const updateQrMenuTheme = (themeUpdates: Partial<QrMenuThemeConfig>) => {
    const defaultQrTheme: QrMenuThemeConfig = {
      primaryColor: '#f59e0b',
      buttonTextColor: '#0f172a',
      backgroundColor: '#f8fafc',
      headerBackgroundColor: '#0f172a',
      cardBackgroundColor: '#ffffff',
      isDarkBackground: false,
      presetId: 'classic_amber',
    };
    const nextQrTheme: QrMenuThemeConfig = {
      ...(settings.qrMenuTheme || defaultQrTheme),
      ...themeUpdates,
    };
    updateSettings({ qrMenuTheme: nextQrTheme });

    fetch('/api/menu/update-theme', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrMenuTheme: nextQrTheme }),
    }).catch(() => {});

    try {
      broadcastChannelRef.current?.postMessage({
        type: 'MENU_THEME_UPDATED',
        payload: { qrMenuTheme: nextQrTheme },
      });
    } catch {}
  };

  const loadKitchenOrderToCart = (order: KitchenOrder) => {
    if (!order || !Array.isArray(order.items)) return;
    if (order.diningType) setRestaurantDiningType(order.diningType);
    if (order.tableName) setSelectedTable(order.tableName);
    if (order.guestCount) setGuestCount(order.guestCount);
    if (order.notes) setKitchenNote(order.notes);
    if (order.queueNumber) setPendingCartQueueNumber(order.queueNumber);
    setPendingCartQueueOrderId(order.id);

    const newCartItems: CartItem[] = [];
    order.items.forEach(item => {
      const foundProd =
        products.find(p => p.id === item.productId) ||
        products.find(p => p.nameAr === item.nameAr);
      const prodObj: Product = foundProd || {
        id: item.productId || `qr-prod-${Date.now()}`,
        nameAr: item.nameAr,
        nameEn: item.nameEn || item.nameAr,
        sku: 'QR-ITEM',
        barcode: '',
        categoryId: categories[0]?.id || 'cat_all',
        price: item.unitPrice || 0,
        wholesalePrice: item.unitPrice || 0,
        costPrice: 0,
        stock: 999,
        minStock: 0,
        unit: 'وجبة',
        image: item.image,
        targetDeviceId: item.targetDeviceId,
        targetDeviceRole: item.targetDeviceRole,
        targetStationName: item.targetDeviceName,
        isFavorite: false,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const qty = Number(item.quantity) || 1;
      const uPrice = Number(item.unitPrice) || prodObj.price || 0;
      newCartItems.push({
        productId: prodObj.id,
        product: prodObj,
        quantity: qty,
        unitPrice: uPrice,
        discount: 0,
        discountType: 'fixed',
        total: qty * uPrice,
        kitchenNotes: item.notes || '',
      });
    });

    setCart(newCartItems);
    setActiveTab('pos');
    soundEffects.saleSuccess();
    notify(
      'تم سحب طلب الزبون (QR) إلى السلة',
      `تم تحميل الطلب ${order.orderNumber} (${order.tableName || 'طلب QR'}) لإصدار الفاتورة أو التعديل`,
      'success'
    );
  };

  // BroadcastChannel reference for local cross-tab zero-latency mesh
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  // Send Remote Barcode Scan to Master POS
  const sendRemoteBarcodeScan = async (barcode: string, quantity = 1, deviceName = 'قارئ باركود لاسلكي') => {
    const payload = {
      barcode: barcode.trim(),
      quantity,
      deviceName,
      sourceDevice: 'mobile_scanner',
      timestamp: new Date().toISOString()
    };

    // 1. Broadcast locally via BroadcastChannel for instant cross-tab / secondary window response (<1ms)
    try {
      broadcastChannelRef.current?.postMessage({
        type: 'REMOTE_BARCODE_SCANNED',
        payload
      });
    } catch {}

    // 2. Relay through server so any other physical device on LAN/Wi-Fi gets it via SSE
    try {
      const res = await fetch('/api/sync/scan-barcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return { success: res.ok };
    } catch (e) {
      return { success: false };
    }
  };

  // Ping a specific device to test connectivity & play an alert tone
  const pingDevice = async (deviceId: string) => {
    const target = devices.find(d => d.id === deviceId);
    const sName = currentUser?.name || 'الكاشير المركزي';

    try {
      broadcastChannelRef.current?.postMessage({
        type: 'DEVICE_PING',
        payload: { deviceId, deviceName: target?.name, senderName: sName }
      });
      await fetch('/api/devices/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, senderName: sName })
      });
      notify('تم إرسال إشارة فحص وتنبيه', `تم إرسال إشارة اختبار إلى: ${target?.name || deviceId}`, 'info');
      soundEffects.beep();
    } catch (e) {
      notify('فشل إرسال إشارة الفحص', 'يرجى التحقق من الشبكة', 'error');
    }
  };

  // Handle incoming remote barcode scans from other linked phones/tablets
  const handleIncomingRemoteBarcode = (payload: { barcode: string; deviceName?: string; sourceDevice?: string; quantity?: number }) => {
    if (!payload?.barcode) return;
    const clean = payload.barcode.trim();
    const qty = payload.quantity || 1;

    // Look for product in catalog (matches barcode, sku, or any of the 100+ identification codes!)
    const found = products.find(p =>
      p.barcode === clean ||
      p.sku.toLowerCase() === clean.toLowerCase() ||
      p.identificationCodes?.some(c => c.toLowerCase() === clean.toLowerCase())
    );

    if (found) {
      addToCart(found, qty);
      soundEffects.playBeep();
      notify(
        '⚡ مسح باركود وارد عن بُعد',
        `تم استلام [${language === 'ar' ? found.nameAr : found.nameEn}] من ${payload.deviceName || 'جهاز متنقل'} وإضافته للسلة (+${qty})`,
        'success'
      );
    } else {
      soundEffects.playWarning();
      notify(
        'باركود وارد غير مسجل',
        `الكود (${clean}) الوارد من ${payload.deviceName || 'جهاز متنقل'} غير موجود بقائمة المنتجات`,
        'warning'
      );
    }
  };

  // Auto-pair when scanning QR code URL with query parameters
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const pairPin = params.get('pairPin');
      const roleParam = params.get('role') as DeviceRole | null;
      const nameParam = params.get('name');

      if (pairPin && roleParam) {
        const defaultNames: Record<string, string> = {
          kitchen_display: 'شاشة المطبخ KDS',
          customer_display: 'شاشة الزبون CFD',
          waiter_mobile: 'هاتف النادل',
          stock_scanner: 'ماسح الجرد والباركود',
          secondary_pos: 'كاشير فرعي 2',
        };
        const dName = nameParam || defaultNames[roleParam] || 'جهاز متصل جديد';

        pairDevice({
          name: dName,
          role: roleParam,
          deviceType: roleParam === 'kitchen_display' || roleParam === 'customer_display' ? 'tablet' : 'mobile',
          pairingCode: pairPin,
          cashierName: 'جهاز محمول',
          branchName: 'الفرع الرئيسي'
        }).then(res => {
          if (res.success) {
            setDedicatedDeviceRole(roleParam);
            try {
              localStorage.setItem('kian_dedicated_device_role', roleParam);
            } catch {}
            notify('تم ربط هذا الجهاز بنجاح!', `تم التفعيل كـ ${dName}`, 'success');
            soundEffects.saleSuccess();
          }
        });

        // Clean query parameters from URL address bar without reloading
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    } catch (e) {
      console.error("Error checking pairing URL params:", e);
    }
  }, []);

  // Real-Time Mesh & SSE listener
  useEffect(() => {
    // Sync active license & used codes with server device-binding registry on mount
    const hwDevice = getDeviceHardwareInfo();
    const usedLocal = getUsedLicenseCodes();
    if (licenseKey || usedLocal.length > 0) {
      fetch('/api/license/sync-current', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: licenseKey || undefined,
          deviceId: hwDevice.deviceId,
          deviceFingerprint: hwDevice.deviceFingerprint,
          deviceName: hwDevice.deviceName,
          customerName: settings.storeNameAr,
          customerPhone: settings.phone,
          expiresAt: licenseExpiresAt || undefined,
          durationLabelAr: licenseDurationLabel,
          usedCodesList: usedLocal,
        }),
      })
        .then(r => r.json())
        .then(data => {
          if (data?.cancelledOldCodeResetToTrial) {
            revokeCurrentDeviceSubscription(
              `تم إلغاء الكود القديم (${data.cancelledCode || licenseKey}) وإرجاع حسابك إلى الفترة المجانية (7 أيام). يرجى إدخال كود تفعيل جديد.`
            );
            return;
          }
          if (data?.revokedCurrentDevice) {
            revokeCurrentDeviceSubscription(
              `تم إلغاء اشتراك هذا الجهاز لأن الكود (${licenseKey}) تم نقله وتفعيله على جهاز آخر بمعرف (${data.boundToDeviceId || 'جهاز جديد'}) وإرجاعك للفترة المجانية.`
            );
            return;
          }
          if (data?.records && Array.isArray(data.records)) {
            data.records.forEach((rec: any) => {
              if (rec?.code && rec?.deviceId) {
                markCodeAsUsed(rec.code, {
                  deviceId: rec.deviceId,
                  deviceFingerprint: rec.deviceFingerprint,
                  deviceName: rec.deviceName,
                  name: rec.customerName,
                  usedAt: rec.activatedAt,
                  expiresAt: rec.expiresAt,
                  durationLabelAr: rec.durationLabelAr,
                  transferCount: rec.transferCount,
                  revokedDeviceIds: rec.revokedDeviceIds,
                });
              }
            });
          }
        })
        .catch(() => {});
    }

    // 1. BroadcastChannel for local cross-tab / cross-window instant communication
    let bc: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('kian_pos_devices_mesh');
        broadcastChannelRef.current = bc;

        bc.onmessage = (event) => {
          const { type, payload } = event.data || {};
          if (type === 'REMOTE_BARCODE_SCANNED') {
            handleIncomingRemoteBarcode(payload);
          } else if (type === 'DEVICE_PING') {
            soundEffects.saleSuccess();
            notify('🔔 إشارة فحص اتصال من الكاشير', `قام ${payload.senderName || 'الكاشير'} بفحص اتصال هذا الجهاز بنجاح`, 'info');
          } else if (type === 'KITCHEN_ORDERS_UPDATE') {
            if (Array.isArray(payload)) setKitchenOrders(payload);
          } else if (type === 'QR_CUSTOMER_ORDER_RECEIVED') {
            if (payload?.order) {
              setKitchenOrders(prev => {
                const exists = prev.some(o => o.id === payload.order.id);
                return exists ? prev : [payload.order, ...prev];
              });
              const itemsSummary = (payload.order.items || [])
                .map((i: any) => `${i.quantity}× ${i.nameAr}`)
                .join('، ');
              soundEffects.saleSuccess();
              notify(
                `📱 طلب زبون جديد وصلك الآن (${payload.order.tableName || payload.order.orderNumber})`,
                `وصل للكاشير وجهاز النادل: ${itemsSummary}`,
                'success'
              );
            }
          } else if (type === 'TABLE_SERVICE_REQUEST') {
            if (payload?.request) {
              setTableServiceRequests(prev => {
                const exists = prev.some(r => r.id === payload.request.id);
                return exists ? prev : [payload.request, ...prev];
              });
              soundEffects.saleSuccess();
              notify(
                `🔔 طلب خدمة من (${payload.request.tableName})`,
                `${payload.request.labelAr}${payload.request.notes ? ` — ${payload.request.notes}` : ''}`,
                'warning'
              );
            }
          } else if (type === 'TABLE_SERVICE_REQUEST_UPDATED') {
            if (payload?.requestId) {
              setTableServiceRequests(prev =>
                prev.map(r =>
                  r.id === payload.requestId
                    ? { ...r, status: payload.status || 'completed', acknowledgedBy: payload.acknowledgedBy }
                    : r
                )
              );
            }
          } else if (type === 'MENU_PRODUCT_UPDATED') {
            if (payload?.productId && payload?.updates) {
              setProductsState(prev =>
                prev.map(p => (p.id === payload.productId ? { ...p, ...payload.updates } : p))
              );
            }
          } else if (type === 'MENU_THEME_UPDATED') {
            if (payload?.qrMenuTheme) {
              setSettingsState(prev => ({ ...prev, qrMenuTheme: payload.qrMenuTheme }));
            }
          } else if (type === 'QR_CUSTOMER_REVIEW_RECEIVED') {
            if (payload?.review) {
              setCustomerReviewsState(prev => {
                const exists = prev.some(r => r.id === payload.review.id);
                return exists ? prev : [payload.review, ...prev];
              });
              soundEffects.saleSuccess();
              notify(
                `⭐ تقييم جديد من العميل (${payload.review.rating}/5)`,
                `${payload.review.tableName || 'منيو QR'}: ${payload.review.comment || (payload.review.tags || []).join('، ') || 'شكراً للخدمة الرائعة'}`,
                'success'
              );
            }
          } else if (type === 'LICENSE_ACTIVATED_ON_DEVICE') {
            if (payload?.code && payload?.deviceId) {
              markCodeAsUsed(payload.code, {
                deviceId: payload.deviceId,
                deviceFingerprint: payload.deviceFingerprint,
                deviceName: payload.deviceName,
                name: payload.customerName,
                usedAt: payload.usedAt,
                expiresAt: payload.expiresAt,
                durationLabelAr: payload.durationLabelAr,
              });
            }
          } else if (type === 'LICENSE_TRANSFERRED_OR_REVOKED') {
            const myDevice = getDeviceHardwareInfo();
            if (payload?.code && payload?.newOwnerDeviceId) {
              markCodeAsUsed(payload.code, {
                deviceId: payload.newOwnerDeviceId,
                deviceFingerprint: payload.newOwnerFingerprint,
                deviceName: payload.newOwnerDeviceName,
                usedAt: payload.usedAt,
                revokedDeviceIds: payload.revokedDeviceIds,
              });
            }
            if (
              licenseKey &&
              payload?.code &&
              licenseKey.trim().toLowerCase() === payload.code.trim().toLowerCase() &&
              payload.newOwnerDeviceId &&
              payload.newOwnerDeviceId !== myDevice.deviceId
            ) {
              const timeAr = formatCodeUsageTimestampAr(payload.usedAt);
              revokeCurrentDeviceSubscription(
                `تم نقل تفعيل الكود (${payload.code}) إلى جهاز جديد بمعرف (${payload.newOwnerDeviceId}) في موعد (${timeAr})، وتم إلغاء اشتراك هذا الجهاز فوراً.`
              );
            }
          } else if (type === 'LICENSE_DUPLICATE_ATTEMPT') {
            const myDevice = getDeviceHardwareInfo();
            if (payload?.attemptedByDeviceId === myDevice.deviceId) {
              soundEffects.playWarning();
              notify(
                '⛔ إشعار حماية الاشتراك: الكود مستخدم!',
                `هذا الكود (${payload.code}) مستخدم ومفعل مسبقاً في جهاز آخر يحمل المعرف (${payload.boundDeviceId}). لا يمكن استخدامه في جهازك الجديد!`,
                'error'
              );
            } else if (payload?.boundDeviceId === myDevice.deviceId) {
              soundEffects.playWarning();
              notify(
                '🛡️ تنبيه أمان: محاولة استخدام كود اشتراكك!',
                `حاول جهاز جديد بمعرف (${payload.attemptedByDeviceId} — ${payload.attemptedByDeviceName || 'جهاز خارجي'}) تفعيل كود اشتراكك (${payload.code}) وتم حظره فوراً!`,
                'warning'
              );
            }
          } else if (type === 'CART_UPDATE') {
            if (payload) setLiveRemoteCart(payload);
          } else if (type === 'REFRESH_DEVICES') {
            refreshDevices();
          } else if (type === 'DEVICE_ROLE_UPDATED') {
            if (payload?.deviceId) {
              setDevices(prev =>
                prev.map(d =>
                  d.id === payload.deviceId
                    ? {
                        ...d,
                        name: payload.name || d.name,
                        role: payload.role || d.role,
                        roleLabelAr: payload.roleLabelAr || d.roleLabelAr,
                        workDescription: payload.workDescription || d.workDescription,
                        workPermissions: payload.workPermissions || d.workPermissions,
                        cashierName: payload.cashierName || payload.connectedUserName || d.cashierName,
                        connectedUserName: payload.connectedUserName || payload.cashierName || d.connectedUserName,
                      }
                    : d
                )
              );
              if (
                (payload.deviceId === currentDeviceId || payload.deviceId === activeSubDeviceId) &&
                payload.role &&
                payload.role !== 'master_pos'
              ) {
                setDedicatedDeviceRole(payload.role);
                const newAllowed =
                  payload.workPermissions?.allowedPages || getDefaultAllowedPagesForRole(payload.role);
                setSubDeviceAllowedPagesOverride(newAllowed);
                if (payload.name) setSubDeviceCustomName(payload.name);
                if (payload.connectedUserName || payload.cashierName) {
                  setSubDeviceUserName(payload.connectedUserName || payload.cashierName);
                }
                try {
                  localStorage.setItem('kian_dedicated_device_role', payload.role);
                  localStorage.setItem('kian_sub_device_allowed_pages', JSON.stringify(newAllowed));
                  if (payload.name) localStorage.setItem('kian_sub_device_name', payload.name);
                  if (payload.connectedUserName || payload.cashierName) {
                    localStorage.setItem('kian_sub_device_user_name', payload.connectedUserName || payload.cashierName);
                  }
                } catch {}
              }
            }
          } else if (type === 'MESH_AUTO_DATA_SYNC') {
            if (payload?.eventType === 'SALE_CREATED' && payload?.sale) {
              setSalesState(prev => {
                if (prev.some(s => s.id === payload.sale.id)) return prev;
                const next = [payload.sale, ...prev];
                try {
                  localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(next));
                } catch {}
                return next;
              });
              if (payload.sourceDeviceId) {
                setDevices(prev =>
                  prev.map(d => {
                    if (d.id !== payload.sourceDeviceId) return d;
                    const amt = Number(payload.sale.total) || 0;
                    return {
                      ...d,
                      isOnline: true,
                      lastSeen: new Date().toISOString(),
                      salesCount: (d.salesCount || 0) + 1,
                      totalSalesAmount: (d.totalSalesAmount || 0) + amt,
                      lastActivitySummary: `فاتورة ${payload.sale.invoiceNumber || ''} بقيمة ${amt.toLocaleString()} ${settings.currency.symbol}`,
                      lastActivityAt: new Date().toISOString(),
                    };
                  })
                );
              }
              if (payload.sourceDeviceId && payload.sourceDeviceId !== currentDeviceId) {
                soundEffects.saleSuccess();
                notify(
                  `📡 مبيعات مشاركة تلقائياً من (${payload.sourceDeviceName || 'جهاز فرعي'})`,
                  `تم تسجيل فاتورة ${payload.sale.invoiceNumber || ''} بقيمة ${Number(payload.sale.total || 0).toLocaleString()} ${settings.currency.symbol}`,
                  'success'
                );
              }
            } else if (payload?.eventType === 'ORDER_CREATED' && payload?.order) {
              setKitchenOrders(prev => (prev.some(o => o.id === payload.order.id) ? prev : [payload.order, ...prev]));
            }
          }
        };
      }
    } catch (e) {
      console.warn("BroadcastChannel not supported or error:", e);
    }

    // 2. Server-Sent Events (SSE) for LAN/Wi-Fi real-time cross-device sync
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/sync/stream');

      eventSource.addEventListener('INIT', (e: any) => {
        try {
          const data = JSON.parse(e.data);
          if (data.devices) setDevices(data.devices);
          if (data.masterPairingPin) setMasterPairingPin(data.masterPairingPin);
          if (data.kitchenOrders) setKitchenOrders(data.kitchenOrders);
          if (data.sharedStoreState?.sales && Array.isArray(data.sharedStoreState.sales) && data.sharedStoreState.sales.length > 0) {
            setSalesState(prev => {
              const existingIds = new Set(prev.map(s => s.id));
              const incoming = data.sharedStoreState.sales.filter((s: Sale) => s && s.id && !existingIds.has(s.id));
              return incoming.length > 0 ? [...incoming, ...prev] : prev;
            });
          }
        } catch {}
      });

      const handleSseDeviceRoleUpdate = (e: any) => {
        try {
          const data = JSON.parse(e.data);
          if (data.devices && Array.isArray(data.devices)) {
            setDevices(data.devices);
          } else if (data.device) {
            setDevices(prev => prev.map(d => (d.id === data.device.id ? data.device : d)));
          }
          if (
            data.device &&
            (data.device.id === currentDeviceId || data.device.id === activeSubDeviceId) &&
            data.device.role !== 'master_pos'
          ) {
            setDedicatedDeviceRole(data.device.role);
            const newAllowed =
              data.device.workPermissions?.allowedPages ||
              getDefaultAllowedPagesForRole(data.device.role);
            setSubDeviceAllowedPagesOverride(newAllowed);
            if (data.device.name) setSubDeviceCustomName(data.device.name);
            if (data.device.connectedUserName || data.device.cashierName) {
              setSubDeviceUserName(data.device.connectedUserName || data.device.cashierName);
            }
            try {
              localStorage.setItem('kian_dedicated_device_role', data.device.role);
              localStorage.setItem('kian_sub_device_allowed_pages', JSON.stringify(newAllowed));
              if (data.device.name) localStorage.setItem('kian_sub_device_name', data.device.name);
              if (data.device.connectedUserName || data.device.cashierName) {
                localStorage.setItem(
                  'kian_sub_device_user_name',
                  data.device.connectedUserName || data.device.cashierName
                );
              }
            } catch {}
            notify(
              'تم تحديث وظيفة وصفحات هذا الجهاز من الجهاز الرئيسي',
              `الوظيفة الحالية: ${data.device.roleLabelAr || data.device.role}`,
              'info'
            );
          }
        } catch {}
      };

      eventSource.addEventListener('DEVICE_ROLE_UPDATED', handleSseDeviceRoleUpdate);
      eventSource.addEventListener('DEVICE_WORK_UPDATED', handleSseDeviceRoleUpdate);

      eventSource.addEventListener('MESH_AUTO_DATA_SYNC', (e: any) => {
        try {
          const data = JSON.parse(e.data);
          if (data.devices && Array.isArray(data.devices)) {
            setDevices(data.devices);
          }
          if (data.eventType === 'SALE_CREATED' && data.sale) {
            setSalesState(prev => {
              if (prev.some(s => s.id === data.sale.id)) return prev;
              const next = [data.sale, ...prev];
              try {
                localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(next));
              } catch {}
              return next;
            });
            if (data.sourceDeviceId && data.sourceDeviceId !== currentDeviceId) {
              soundEffects.saleSuccess();
              notify(
                `📡 مبيعات مشاركة تلقائياً من (${data.sourceDeviceName || 'جهاز فرعي'})`,
                `فاتورة ${data.sale.invoiceNumber || ''} بقيمة ${Number(data.sale.total || 0).toLocaleString()} ${settings.currency.symbol}`,
                'success'
              );
            }
          } else if (data.eventType === 'ORDER_CREATED' && data.order) {
            setKitchenOrders(prev => (prev.some(o => o.id === data.order.id) ? prev : [data.order, ...prev]));
          } else if (data.eventType === 'PRODUCTS_UPDATED' && Array.isArray(data.products) && data.sourceDeviceId !== currentDeviceId) {
            setProductsState(data.products);
          } else if (data.eventType === 'CATEGORIES_UPDATED' && Array.isArray(data.categories) && data.sourceDeviceId !== currentDeviceId) {
            setCategoriesState(data.categories);
          } else if (data.eventType === 'CUSTOMERS_UPDATED' && Array.isArray(data.customers) && data.sourceDeviceId !== currentDeviceId) {
            setCustomersState(data.customers);
          }
        } catch {}
      });

      eventSource.addEventListener('DEVICE_CONNECTED', (e: any) => {
        try {
          const data = JSON.parse(e.data);
          if (data.devices) setDevices(data.devices);
          else if (data.device) {
            setDevices(prev => [...prev.filter(d => d.id !== data.device.id), data.device]);
          }
          notify('جهاز جديد متصل بالشبكة', data.device?.name || 'تم الربط بنجاح', 'info');
        } catch {}
      });

      eventSource.addEventListener('DEVICE_DISCONNECTED', (e: any) => {
        try {
          const data = JSON.parse(e.data);
          if (data.devices) setDevices(data.devices);
          else if (data.deviceId) {
            setDevices(prev => prev.filter(d => d.id !== data.deviceId));
          }
        } catch {}
      });

      eventSource.addEventListener('DEVICE_PING', (e: any) => {
        try {
          const data = JSON.parse(e.data);
          soundEffects.saleSuccess();
          notify('🔔 إشارة فحص اتصال واردة', `قام ${data.senderName || 'الكاشير المركزي'} بفحص اتصال هذا الجهاز بنجاح`, 'info');
        } catch {}
      });

      eventSource.addEventListener('REMOTE_BARCODE_SCANNED', (e: any) => {
        try {
          const data = JSON.parse(e.data);
          handleIncomingRemoteBarcode(data);
        } catch {}
      });

      eventSource.addEventListener('KITCHEN_ORDERS_UPDATE', (e: any) => {
        try {
          const orders = JSON.parse(e.data);
          if (Array.isArray(orders)) setKitchenOrders(orders);
        } catch {}
      });

      eventSource.addEventListener('QR_CUSTOMER_ORDER_RECEIVED', (e: any) => {
        try {
          const data = JSON.parse(e.data);
          if (data?.order) {
            setKitchenOrders(prev => {
              const exists = prev.some(o => o.id === data.order.id);
              return exists ? prev : [data.order, ...prev];
            });
            const itemsSummary = (data.order.items || [])
              .map((i: any) => `${i.quantity}× ${i.nameAr}`)
              .join('، ');
            soundEffects.saleSuccess();
            notify(
              `📱 طلب زبون عبر QR (${data.order.tableName || data.order.orderNumber})`,
              `وصل للكاشير وجهاز النادل: ${itemsSummary}`,
              'success'
            );
          }
        } catch {}
      });

      eventSource.addEventListener('TABLE_SERVICE_REQUEST', (e: any) => {
        try {
          const data = JSON.parse(e.data);
          if (data?.request) {
            setTableServiceRequests(prev => {
              const exists = prev.some(r => r.id === data.request.id);
              return exists ? prev : [data.request, ...prev];
            });
            soundEffects.saleSuccess();
            notify(
              `🔔 نداء طاولة وارد (${data.request.tableName})`,
              `${data.request.labelAr}${data.request.notes ? ` — ${data.request.notes}` : ''}`,
              'warning'
            );
          }
        } catch {}
      });

      eventSource.addEventListener('TABLE_SERVICE_REQUEST_UPDATED', (e: any) => {
        try {
          const data = JSON.parse(e.data);
          if (Array.isArray(data?.requests)) {
            setTableServiceRequests(data.requests);
          }
        } catch {}
      });

      eventSource.addEventListener('MENU_PRODUCT_UPDATED', (e: any) => {
        try {
          const data = JSON.parse(e.data);
          if (data?.productId && data?.updates) {
            setProductsState(prev =>
              prev.map(p => (p.id === data.productId ? { ...p, ...data.updates } : p))
            );
          }
        } catch {}
      });

      eventSource.addEventListener('MENU_THEME_UPDATED', (e: any) => {
        try {
          const data = JSON.parse(e.data);
          if (data?.qrMenuTheme) {
            setSettingsState(prev => ({ ...prev, qrMenuTheme: data.qrMenuTheme }));
          }
        } catch {}
      });

      eventSource.addEventListener('QR_CUSTOMER_REVIEW_RECEIVED', (e: any) => {
        try {
          const data = JSON.parse(e.data);
          if (data?.review) {
            setCustomerReviewsState(prev => {
              const exists = prev.some(r => r.id === data.review.id);
              return exists ? prev : [data.review, ...prev];
            });
            soundEffects.saleSuccess();
            notify(
              `⭐ تقييم جديد من الزبون (${data.review.rating}/5)`,
              `${data.review.tableName || 'منيو QR'}: ${data.review.comment || (data.review.tags || []).join('، ') || 'تقييم ممتاز'}`,
              'success'
            );
          }
        } catch {}
      });

      eventSource.addEventListener('CART_UPDATE', (e: any) => {
        try {
          const cartData = JSON.parse(e.data);
          if (cartData) setLiveRemoteCart(cartData);
        } catch {}
      });

      eventSource.addEventListener('PIN_REFRESHED', (e: any) => {
        try {
          const data = JSON.parse(e.data);
          if (data.newPin) setMasterPairingPin(data.newPin);
        } catch {}
      });

      eventSource.addEventListener('LICENSE_ACTIVATED_ON_DEVICE', (e: any) => {
        try {
          const data = JSON.parse(e.data);
          if (data?.code && data?.deviceId) {
            markCodeAsUsed(data.code, {
              deviceId: data.deviceId,
              deviceFingerprint: data.deviceFingerprint,
              deviceName: data.deviceName,
              usedAt: data.activatedAt,
            });
          }
        } catch {}
      });

      eventSource.addEventListener('LICENSE_TRANSFERRED_OR_REVOKED', (e: any) => {
        try {
          const data = JSON.parse(e.data);
          const myDevice = getDeviceHardwareInfo();
          if (data?.code && data?.newOwnerDeviceId) {
            markCodeAsUsed(data.code, {
              deviceId: data.newOwnerDeviceId,
              deviceFingerprint: data.newOwnerFingerprint,
              deviceName: data.newOwnerDeviceName,
              usedAt: data.activatedAt,
              revokedDeviceIds: data.revokedDeviceIds,
            });
          }
          if (
            licenseKey &&
            data?.code &&
            licenseKey.trim().toLowerCase() === data.code.trim().toLowerCase() &&
            data.newOwnerDeviceId &&
            data.newOwnerDeviceId !== myDevice.deviceId
          ) {
            const timeAr = formatCodeUsageTimestampAr(data.activatedAt);
            revokeCurrentDeviceSubscription(
              `تم نقل تفعيل الكود (${data.code}) إلى جهاز آخر بمعرف (${data.newOwnerDeviceId}) في موعد (${timeAr})، وتم إلغاء اشتراك هذا الجهاز فوراً.`
            );
          }
        } catch {}
      });

      eventSource.addEventListener('LICENSE_DUPLICATE_ATTEMPT', (e: any) => {
        try {
          const data = JSON.parse(e.data);
          const myDevice = getDeviceHardwareInfo();
          if (data?.attemptedByDeviceId === myDevice.deviceId) {
            soundEffects.playWarning();
            notify(
              '⛔ إشعار حماية الاشتراك: الكود مستخدم!',
              `هذا الكود (${data.code}) مستخدم مسبقاً في جهاز آخر بمعرف (${data.boundDeviceId} — ${data.boundDeviceName || 'جهاز مفعل'}) وتم رفض التفعيل على جهازك الجديد.`,
              'error'
            );
          } else if (data?.boundDeviceId === myDevice.deviceId) {
            soundEffects.playWarning();
            notify(
              '🛡️ تنبيه حماية: محاولة تفعيل كودك من جهاز آخر!',
              `حاول جهاز جديد يحمل المعرف (${data.attemptedByDeviceId}) استخدام كود اشتراكك (${data.code}) وتم إيقافه تلقائياً.`,
              'warning'
            );
          }
        } catch {}
      });

      eventSource.onerror = () => {
        // Handled automatically by browser reconnection
      };
    } catch (e) {
      console.warn("EventSource setup warning:", e);
    }

    return () => {
      bc?.close();
      eventSource?.close();
    };
  }, [products, language]);

  const syncAllDevices = async () => {
    await refreshDevices();
    notify('تمت المزامنة الفورية مع كافة الأجهزة المتصلة', 'الشبكة تعمل بكفاءة عالية وبث حي لحظي', 'success');
  };

  // Broadcast live cart changes to CFD
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('customerMenu') === '1' || params.get('qrMenu') === '1' || params.get('menu') === '1') {
        return;
      }
    } catch {}
    const subtotal = cart.reduce((acc, it) => acc + (it.total || 0), 0);
    const total = Math.max(0, subtotal - (orderDiscount?.value || 0));
    fetch('/api/sync/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: cart,
        subtotal,
        discount: orderDiscount?.value || 0,
        tax: 0,
        total,
        customerName: selectedCustomer?.name || 'عميل عام',
        pointsEarned: Math.floor(total / (settings?.pointsSpendRatio || 10000)),
      }),
    }).catch(() => {});
  }, [cart, selectedCustomer, orderDiscount, settings]);

  // Sync Restaurant/Cafe Menu Catalog (products, images, target devices, categories, store settings, theme, reviews) to server for Customer QR Menu
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('customerMenu') === '1' || params.get('qrMenu') === '1' || params.get('menu') === '1') {
        return;
      }
    } catch {}
    const timer = setTimeout(() => {
      fetch('/api/menu/sync-catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products,
          categories,
          reviews: customerReviews,
          settings: {
            storeName: settings.storeNameAr || settings.storeNameEn,
            storeSubtitle: settings.tagline,
            logoUrl: settings.logo,
            phone: settings.phone,
            address: settings.address,
            currency: settings.currency,
            qrMenuTheme: settings.qrMenuTheme,
          },
        }),
      }).catch(() => {});
    }, 350);
    return () => clearTimeout(timer);
  }, [products, categories, settings, customerReviews]);

  // Initial load of devices & fetch interval
  useEffect(() => {
    refreshDevices();
    fetch('/api/devices/mesh-sync/state')
      .then(r => r.json())
      .then(data => {
        if (data?.sharedState?.sales && Array.isArray(data.sharedState.sales) && data.sharedState.sales.length > 0) {
          setSalesState(prev => {
            const existingIds = new Set(prev.map(s => s.id));
            const incoming = data.sharedState.sales.filter((s: Sale) => s && s.id && !existingIds.has(s.id));
            return incoming.length > 0 ? [...incoming, ...prev] : prev;
          });
        }
      })
      .catch(() => {});
    const interval = setInterval(refreshDevices, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        t,
        dir,
        theme,
        themeMode,
        setThemeMode,
        toggleTheme,
        isNightTime,
        nightModeStartHour,
        nightModeEndHour,
        isPowerSavingActive,
        isPowerSavingStandby,
        togglePowerSaving,
        setPowerSavingActive,
        wakeFromStandby,
        batteryInfo,
        updateBatteryInfo,
        businessMode,
        setBusinessMode,
        isModeModalOpen,
        setIsModeModalOpen,
        restaurantDiningType,
        setRestaurantDiningType,
        selectedTable,
        setSelectedTable,
        guestCount,
        setGuestCount,
        kitchenNote,
        setKitchenNote,
        updateCartItemKitchenNotes,
        activeTab,
        setActiveTab,
        selectedReturnInvoice,
        setSelectedReturnInvoice,
        navigateToReturnWithInvoice,
        isOnline,
        isQuickSaleOpen,
        setIsQuickSaleOpen,
        isGlobalSearchOpen,
        setIsGlobalSearchOpen,
        isSearchModalOpen: isGlobalSearchOpen,
        setIsSearchModalOpen: setIsGlobalSearchOpen,
        isPinModalOpen,
        setIsPinModalOpen,
        isIdleLocked,
        setIsIdleLocked,
        isFirstLoginCompleted,
        isFirstLoginModalOpen,
        setIsFirstLoginModalOpen,
        completeFirstLogin,
        isAppPurchased,
        licenseKey,
        licenseExpiresAt,
        licenseRemainingDays,
        licenseRemainingHours,
        isLicenseExpired,
        licenseDurationLabel,
        isLifetimeLicense,
        trialStartDate,
        trialDaysRemaining,
        trialHoursRemaining,
        isTrialExpired,
        isPurchaseModalOpen,
        setIsPurchaseModalOpen,
        activatePurchaseCode,
        revokeCurrentDeviceSubscription,
        currentUser,
        setCurrentUser,
        users,
        loginWithPin,
        hasPermission,
        addStaff,
        updateStaff,
        deleteStaff,
        addUser: addStaff,
        updateUser: updateStaff,
        deleteUser: deleteStaff,
        googleUser,
        isGoogleSignedIn,
        isGoogleAuthLoading,
        signInWithGoogle,
        signOutGoogle,
        settings,
        storeSettings: settings,
        updateSettings,
        formatCurrency,
        formatSecondaryCurrency,
        changeBaseCurrency,
        updateExchangeBulletin,
        convertBaseToForeign,
        convertForeignToBase,
        isButtonCustomizerModalOpen,
        setIsButtonCustomizerModalOpen,
        updateButtonLayout,
        resetButtonLayout,
        applyButtonLayoutPreset,
        activeThemeColor,
        activePrimaryHex,
        setThemeColor,
        products,
        categories,
        addProduct,
        updateProduct,
        deleteProduct,
        duplicateProduct,
        toggleFavorite,
        addCategory,
        updateCategory,
        deleteCategory,
        applyBulkWholesaleMargin,
        posTradeMode,
        setPosTradeMode,
        cart,
        addToCart,
        toggleCartItemTradeMode,
        updateCartItemQuantity,
        updateCartItemDiscount,
        updateCartItemPrice,
        removeFromCart,
        clearCart,
        selectedCustomer,
        setSelectedCustomer,
        orderDiscount,
        setOrderDiscount,
        pointsToRedeem,
        setPointsToRedeem,
        sales,
        processSale,
        refunds,
        returns: (refunds || []).map(r => ({
          ...r,
          returnNumber: r.refundNumber,
          originalInvoiceNumber: r.invoiceNumber,
          totalRefund: r.totalRefundAmount,
        })),
        processRefund,
        processReturn,
        customers,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        adjustCustomerPoints,
        findCustomerByCodeOrPhone,
        suppliers,
        debtTransactions,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        recordCustomerDebtPayment,
        addCustomerManualDebt,
        recordSupplierDebtPayment,
        addSupplierInvoiceDebt,
        recordSupplierPurchaseInvoice,
        inventoryLogs,
        stockMovements: inventoryLogs || [],
        adjustStock,
        expenses,
        addExpense,
        deleteExpense,
        auditLogs,
        logAudit,
        notifications,
        notify,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearAllNotifications,
        devices,
        kitchenOrders,
        masterPairingPin,
        subscriptionBoundLinkCode,
        isMasterDevice,
        currentDeviceId,
        currentDeviceName,
        currentDeviceRole,
        currentDeviceWorkPermissions,
        currentDeviceAllowedPages,
        currentSubDeviceUserName,
        activateSubDevicePreview,
        exitSubDeviceMode,
        isPairingModalOpen,
        setIsPairingModalOpen,
        refreshDevices,
        pairDevice,
        updateSubDeviceRoleAndWork,
        simulateSubDeviceSale,
        disconnectDevice,
        unpairDevice: disconnectDevice,
        regenerateSingleDeviceCode,
        refreshMasterPin,
        addKitchenOrder,
        updateKitchenItemStatus,
        syncAllDevices,
        sendRemoteBarcodeScan,
        pingDevice,
        dedicatedDeviceRole,
        setDedicatedDeviceRole,
        isConnectToCashierModalOpen,
        setIsConnectToCashierModalOpen,
        liveRemoteCart,
        verifyCashierPin,
        isDataTransferModalOpen,
        setIsDataTransferModalOpen,
        isStorageCleanupModalOpen,
        setIsStorageCleanupModalOpen,
        openStorageCleanupModal,
        offlineQueueCount,
        isSyncingOffline,
        syncOfflineQueueNow,
        refreshOfflineQueueCount,
        isSyncingWithPartner,
        saveSyncPartner,
        removeSyncPartner,
        performPartnerSync,
        wholesaleWarehouses,
        deliveryVehicles,
        vehicleManifests,
        addWholesaleWarehouse,
        updateWholesaleWarehouse,
        deleteWholesaleWarehouse,
        addDeliveryVehicle,
        updateDeliveryVehicle,
        deleteDeliveryVehicle,
        updateVehicleStatus,
        createVehicleLoadingManifest,
        reconcileVehicleManifest,
        transferWarehouseStock,
        exportDatabaseJson,
        importDatabaseJson,
        resetToDefaultData,
        exportDataJson: exportDatabaseJson,
        importDataJson: importDatabaseJson,
        resetToDemoData: resetToDefaultData,
        triggerIndexedDbBackupDownload,
        restoreFromIndexedDbBackup,
        // Shifts & Promotions
        shifts,
        activeShift,
        isShiftModalOpen,
        setIsShiftModalOpen,
        openShiftModal,
        startNewShift,
        recordShiftCashMovement,
        closeShift,
        promotions,
        isPromotionsModalOpen,
        setIsPromotionsModalOpen,
        openPromotionsModal,
        addPromotion,
        updatePromotion,
        deletePromotion,
        togglePromotionActive,
        calculateCartPromotions,
        isRestaurantQrModalOpen,
        setIsRestaurantQrModalOpen,
        isCustomerMenuPreviewOpen,
        setIsCustomerMenuPreviewOpen,
        restaurantQueueCounter,
        nextRestaurantQueueNumber,
        getNextRestaurantQueueNumber,
        resetRestaurantQueueCounter,
        updateSaleQueueStatus,
        announceQueueNumber,
        loadKitchenOrderToCart,
        confirmKitchenOrder,
        updateKitchenOrderStatus,
        transferKitchenOrderTable,
        tableServiceRequests,
        submitTableServiceRequest,
        acknowledgeTableServiceRequest,
        restaurantTables,
        updateRestaurantTables,
        updateQrMenuTheme,
        customerReviews,
        addCustomerReview,
        deleteCustomerReview,
        clearCustomerReviews,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const useAppOptional = () => {
  return useContext(AppContext);
};
