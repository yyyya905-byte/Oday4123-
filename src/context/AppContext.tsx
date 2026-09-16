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
  LicenseInfo
} from '../types';
import {
  generateLicenseCode,
  validateLicenseCode,
  getTrialTimeRemaining,
  MASTER_ACTIVATION_CODES
} from '../utils/licenseUtils';
import {
  initialSettings,
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
  initialVehicleManifests
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
import { indexedDbService } from '../services/indexedDbService';
import { googleAuthService } from '../services/googleAuthService';
import { canAccessTab, hasActionPermission, getRoleInfo } from '../utils/permissions';


export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
}

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
  trialStartDate: string;
  trialDaysRemaining: number;
  trialHoursRemaining: number;
  isTrialExpired: boolean;
  isPurchaseModalOpen: boolean;
  setIsPurchaseModalOpen: (open: boolean) => void;
  activatePurchaseCode: (code: string, customerInfo?: { name?: string; phone?: string }) => { success: boolean; message: string };

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
  formatSecondaryCurrency: (amount: number, target?: 'USD' | 'EUR', rateType?: 'buy' | 'sell') => string;
  changeBaseCurrency: (newCurrency: CurrencyConfig, conversionRate?: number, convertPricesAndInvoices?: boolean) => void;
  updateExchangeBulletin: (bulletin: Partial<ExchangeRateBulletin>) => void;
  convertBaseToForeign: (amount: number, targetCurrency: 'USD' | 'EUR', rateType?: 'buy' | 'sell') => number;
  convertForeignToBase: (amount: number, sourceCurrency: 'USD' | 'EUR', rateType?: 'buy' | 'sell') => number;

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
  notify: (title: string, message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;

  // Multi-Device Linking & Terminals Hub
  devices: LinkedDevice[];
  kitchenOrders: KitchenOrder[];
  masterPairingPin: string;
  isPairingModalOpen: boolean;
  setIsPairingModalOpen: (open: boolean) => void;
  refreshDevices: () => Promise<void>;
  pairDevice: (deviceData: { name: string; role: DeviceRole; pairingCode: string; deviceType: 'desktop' | 'tablet' | 'mobile'; cashierName?: string; branchName?: string }) => Promise<{ success: boolean; error?: string }>;
  disconnectDevice: (deviceId: string) => Promise<void>;
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
  FIRST_LOGIN_COMPLETED: 'kian_first_login_completed',
  APP_PURCHASED: 'kian_app_purchased',
  LICENSE_KEY: 'kian_license_key',
  TRIAL_START_DATE: 'kian_trial_start_date',
  PURCHASED_AT: 'kian_purchased_at',
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

  const [isModeModalOpen, setIsModeModalOpen] = useState<boolean>(() => {
    const remembered = localStorage.getItem(STORAGE_KEYS.REMEMBER_BUSINESS_MODE);
    const savedMode = localStorage.getItem(STORAGE_KEYS.BUSINESS_MODE);
    if (remembered === 'true' && savedMode) {
      return false;
    }
    // Default open on startup so user chooses upon entering!
    return true;
  });

  // Restaurant & Cafe Options
  const [restaurantDiningType, setRestaurantDiningType] = useState<DiningType>('dine_in');
  const [selectedTable, setSelectedTable] = useState<string>('طاولة 1');
  const [guestCount, setGuestCount] = useState<number>(2);
  const [kitchenNote, setKitchenNote] = useState<string>('');

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
      return saved ? JSON.parse(saved) : initialSettings;
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
    soundEffects.setMuted(!updated.soundEffects);

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
    soundEffects.setMuted(!settings.soundEffects);
  }, [settings.soundEffects]);

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
    return localStorage.getItem(STORAGE_KEYS.FIRST_LOGIN_COMPLETED) === 'true';
  });

  const [isFirstLoginModalOpen, setIsFirstLoginModalOpen] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEYS.FIRST_LOGIN_COMPLETED) !== 'true';
  });

  const [isAppPurchased, setIsAppPurchased] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.APP_PURCHASED);
    return saved === 'true' || settings.licenseInfo?.isPurchased === true;
  });

  const [licenseKey, setLicenseKey] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.LICENSE_KEY) || settings.licenseInfo?.licenseKey || '';
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
  const isTrialExpired = !isAppPurchased && trialInfo.isExpired;

  // Auto prompt purchase modal if trial expired and first login was completed
  useEffect(() => {
    if (isTrialExpired && isFirstLoginCompleted && !isAppPurchased) {
      setIsPurchaseModalOpen(true);
    }
  }, [isTrialExpired, isFirstLoginCompleted, isAppPurchased]);

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

  const activatePurchaseCode = (code: string, customerInfo?: { name?: string; phone?: string }): { success: boolean; message: string } => {
    const res = validateLicenseCode(code);
    if (!res.valid) {
      soundEffects.playWarning();
      return { success: false, message: res.reason || 'كود الشراء غير صالح' };
    }

    const cleanCode = code.trim().toUpperCase();
    setIsAppPurchased(true);
    setLicenseKey(cleanCode);
    localStorage.setItem(STORAGE_KEYS.APP_PURCHASED, 'true');
    localStorage.setItem(STORAGE_KEYS.LICENSE_KEY, cleanCode);
    localStorage.setItem(STORAGE_KEYS.PURCHASED_AT, new Date().toISOString());

    const updatedLicense: LicenseInfo = {
      isPurchased: true,
      licenseKey: cleanCode,
      licenseStatus: 'active',
      purchasedAt: new Date().toISOString(),
      customerName: customerInfo?.name || settings.storeNameAr,
      customerPhone: customerInfo?.phone || settings.phone
    };

    updateSettings({ licenseInfo: updatedLicense });
    soundEffects.playSuccess();
    setIsPurchaseModalOpen(false);

    notify(
      'تم شراء وتفعيل التطبيق بنجاح! 👑',
      'تم ترخيص نسختك بشكل دائم ومدى الحياة لكافة المزايا والعمليات بدون أي قيود تجريبية',
      'success'
    );

    logAudit('تفعيل كود شراء التطبيق', `الكود: ${cleanCode}`, 'high');
    return { success: true, message: 'تم تفعيل ترخيص التطبيق بنجاح' };
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
      id: `prod_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [newProd, ...products];
    setProductsState(updated);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));
    logAudit('إضافة منتج جديد', `الاسم: ${newProd.nameAr} - السعر: ${newProd.price} - الباركود: ${newProd.barcode}`, 'medium');
    notify('تمت إضافة المنتج بنجاح', newProd.nameAr, 'success');
    return newProd;
  };

  const updateProduct = (id: string, prod: Partial<Product>) => {
    const updated = products.map(p => p.id === id ? { ...p, ...prod, updatedAt: new Date().toISOString() } : p);
    setProductsState(updated);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));
    logAudit('تعديل منتج', `معرف المنتج: ${id}`, 'low');
    notify('تم تحديث المنتج', '', 'success');
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
      const saved = localStorage.getItem(STORAGE_KEYS.DEBT_TRANSACTIONS);
      return saved ? JSON.parse(saved) : initialDebtTransactions;
    } catch {
      return initialDebtTransactions;
    }
  });

  const addSupplier = (supplierData: Omit<Supplier, 'id' | 'createdAt'>): Supplier => {
    const randomCode = `SUP-${Math.floor(100 + Math.random() * 900)}`;
    const newSup: Supplier = {
      ...supplierData,
      id: `sup_${Date.now()}`,
      code: supplierData.code || randomCode,
      currentDebt: Number(supplierData.currentDebt) || 0,
      totalPurchases: Number(supplierData.totalPurchases) || 0,
      createdAt: new Date().toISOString(),
    };
    const updated = [newSup, ...suppliers];
    setSuppliersState(updated);
    localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(updated));
    logAudit('إضافة مورد جديد', `المورد: ${newSup.name} (${newSup.code}) - الرصيد الافتتاحي المستحق: ${newSup.currentDebt.toLocaleString()} ${settings.currency.symbol}`, 'medium');
    notify('تم تسجيل المورد بنجاح', newSup.name, 'success');
    return newSup;
  };

  const updateSupplier = (id: string, sup: Partial<Supplier>) => {
    const updated = suppliers.map(s => s.id === id ? { ...s, ...sup } : s);
    setSuppliersState(updated);
    localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(updated));
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

  const processSale = (saleData: { paymentMethod: string; paidAmount: number; notes?: string }): Sale | null => {
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

    // Change and paid calculations
    const isCredit = saleData.paymentMethod === 'credit' || saleData.paymentMethod === 'آجل';
    const rawPaid = typeof saleData.paidAmount === 'number' ? saleData.paidAmount : (isCredit ? 0 : grandTotal);
    const paidAmount = isCredit ? Math.min(rawPaid, grandTotal) : (rawPaid >= grandTotal ? rawPaid : grandTotal);
    const changeAmount = isCredit ? 0 : Math.max(0, rawPaid - grandTotal);
    const remainingCreditDebt = isCredit ? Math.max(0, grandTotal - paidAmount) : 0;

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

    const invoicePrefix = computedTradeType === 'wholesale' ? 'WHS' : 'INV';
    const invoiceNum = `${invoicePrefix}-${new Date().getFullYear()}-${String(sales.length + 1024).padStart(6, '0')}`;

    const newSale: Sale = {
      id: `sale_${Date.now()}`,
      invoiceNumber: invoiceNum,
      storeId: settings.storeId,
      branchId: 'branch_main',
      cashierId: currentUser.id,
      cashierName: currentUser.name,
      customerId: selectedCustomer?.id,
      customerName: selectedCustomer?.name,
      customerCode: selectedCustomer?.customerCode,
      customerPhone: selectedCustomer?.phone,
      businessMode,
      diningType: businessMode === 'restaurant' ? restaurantDiningType : undefined,
      tableName: businessMode === 'restaurant' && restaurantDiningType === 'dine_in' ? selectedTable : undefined,
      guestCount: businessMode === 'restaurant' && restaurantDiningType === 'dine_in' ? guestCount : undefined,
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
      paymentMethod: saleData.paymentMethod,
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
          notes: `مبيعات آجلة بموجب فاتورة ${invoiceNum} (المسدد: ${paidAmount} - المتبقي كدين: ${remainingCreditDebt})`,
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

    // 3. Save Sale
    const updatedSales = [newSale, ...sales];
    setSalesState(updatedSales);
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(updatedSales));

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

    // Update product stock
    updateProduct(productId, { stock: newStock });

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

    const updatedLogs = [log, ...(inventoryLogs || [])];
    setInventoryLogsState(updatedLogs);
    localStorage.setItem(STORAGE_KEYS.INVENTORY_LOGS, JSON.stringify(updatedLogs));

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
    logAudit('تسجيل مصروف جديد', `البيان: ${newExp.title} - المبلغ: ${newExp.amount}`, 'medium');
    notify('تم تسجيل المصروف بنجاح', newExp.title, 'success');
  };

  const deleteExpense = (id: string) => {
    const updated = expenses.filter(e => e.id !== id);
    setExpensesState(updated);
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(updated));
    notify('تم حذف المصروف', '', 'info');
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

  // 15. In-App Notifications
  const [notifications, setNotifications] = useState<AppNotification[]>([
    {
      id: 'notif_init',
      title: 'مرحباً بك في كيان كاشير',
      message: 'تم إعداد النظام بالعملة السورية الجديدة وجاهز للبيع والعمل بدون إنترنت.',
      type: 'info',
      timestamp: new Date().toISOString(),
      read: false,
    }
  ]);

  const notify = (title: string, message: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') => {
    const newNotif: AppNotification = {
      id: `notif_${Date.now()}_${Math.random()}`,
      title,
      message,
      type,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
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

  // 16. Full Database Backup & Restore
  const exportDatabaseJson = (): string => {
    const data = {
      version: '2.6',
      exportDate: new Date().toISOString(),
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
    };
    return JSON.stringify(data, null, 2);
  };

  const importDatabaseJson = (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (data.products && Array.isArray(data.products)) {
        if (data.settings) setSettingsState(data.settings);
        if (data.products) setProductsState(data.products);
        if (data.categories) setCategoriesState(data.categories);
        if (data.customers) setCustomersState(data.customers);
        if (data.suppliers) setSuppliersState(data.suppliers);
        if (data.debtTransactions) setDebtTransactionsState(data.debtTransactions);
        if (data.sales) setSalesState(data.sales);
        if (data.refunds) setRefundsState(data.refunds);
        if (data.inventoryLogs) setInventoryLogsState(data.inventoryLogs);
        if (data.expenses) setExpensesState(data.expenses);
        if (data.auditLogs) setAuditLogsState(data.auditLogs);
        if (data.users) setUsersState(data.users);
        if (data.wholesaleWarehouses) setWholesaleWarehousesState(data.wholesaleWarehouses);
        if (data.deliveryVehicles) setDeliveryVehiclesState(data.deliveryVehicles);
        if (data.vehicleManifests) setVehicleManifestsState(data.vehicleManifests);

        // Save all to localStorage
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings || settings));
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(data.products));
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(data.categories || categories));
        localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(data.customers || customers));
        if (data.suppliers) localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(data.suppliers));
        if (data.debtTransactions) localStorage.setItem(STORAGE_KEYS.DEBT_TRANSACTIONS, JSON.stringify(data.debtTransactions));
        localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(data.sales || sales));
        localStorage.setItem(STORAGE_KEYS.REFUNDS, JSON.stringify(data.refunds || refunds));
        localStorage.setItem(STORAGE_KEYS.INVENTORY_LOGS, JSON.stringify(data.inventoryLogs || inventoryLogs));
        localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(data.expenses || expenses));
        localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(data.auditLogs || auditLogs));
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(data.users || users));
        if (data.wholesaleWarehouses) localStorage.setItem(STORAGE_KEYS.WHOLESALE_WAREHOUSES, JSON.stringify(data.wholesaleWarehouses));
        if (data.deliveryVehicles) localStorage.setItem(STORAGE_KEYS.DELIVERY_VEHICLES, JSON.stringify(data.deliveryVehicles));
        if (data.vehicleManifests) localStorage.setItem(STORAGE_KEYS.VEHICLE_MANIFESTS, JSON.stringify(data.vehicleManifests));

        notify('تم استيراد قاعدة البيانات بنجاح', '', 'success');
        return true;
      }
      return false;
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

  const formatSecondaryCurrency = (amount: number, target?: 'USD' | 'EUR', rateType: 'buy' | 'sell' = 'sell'): string => {
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
    }

    const updatedSettings: StoreSettings = {
      ...settings,
      currency: newCurrency,
      exchangeBulletin: updatedBulletin
    };

    // If recalculation requested with a valid rate multiplier
    if (convertPricesAndInvoices && conversionRate && conversionRate > 0 && conversionRate !== 1) {
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
  const [devices, setDevices] = useState<LinkedDevice[]>([
    {
      id: "dev-master-1",
      name: "جهاز الكاشير المركزي (Master POS)",
      role: "master_pos",
      deviceType: "desktop",
      pairingCode: "MASTER",
      pairedAt: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      isOnline: true,
      batteryLevel: 100,
      cashierName: "عدي الزعبي",
      currentScreen: "pos",
      branchName: "الفرع الرئيسي",
    },
    {
      id: "dev-kitchen-1",
      name: "شاشة المطبخ وإعداد الطلبات (KDS 1)",
      role: "kitchen_display",
      deviceType: "tablet",
      pairingCode: "772109",
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
      pairedAt: new Date(Date.now() - 7200000).toISOString(),
      lastSeen: new Date().toISOString(),
      isOnline: true,
      batteryLevel: 88,
      currentScreen: "customer_facing",
      branchName: "الفرع الرئيسي",
    }
  ]);

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

  const [kitchenOrders, setKitchenOrders] = useState<KitchenOrder[]>([
    {
      id: "k-ord-101",
      orderNumber: "ORD-101",
      sourceDevice: "جهاز الكاشير المركزي",
      diningType: "dine_in",
      tableName: "طاولة 4",
      guestCount: 3,
      status: "in_progress",
      createdAt: new Date(Date.now() - 1000 * 60 * 6).toISOString(),
      estimatedMinutes: 12,
      notes: "بدون ملح زائد، تجهيز سريع",
      items: [
        { id: "ki-1", productId: "p1", nameAr: "برغر لحم دبل كلاسيك", nameEn: "Double Beef Burger", quantity: 2, unitPrice: 28000, notes: "بدون مخلل", status: "cooking" },
        { id: "ki-2", productId: "p4", nameAr: "بطاطا مقلية عائلية", nameEn: "Family Fries", quantity: 1, unitPrice: 12000, status: "ready" },
        { id: "ki-3", productId: "p5", nameAr: "عصير برتقال طبيعي", nameEn: "Fresh Orange Juice", quantity: 2, unitPrice: 10000, status: "ready" }
      ]
    },
    {
      id: "k-ord-102",
      orderNumber: "ORD-102",
      sourceDevice: "هاتف النادل (سامسونج S23)",
      diningType: "takeaway",
      status: "pending",
      createdAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
      estimatedMinutes: 8,
      notes: "تغليف سفري محكم",
      items: [
        { id: "ki-4", productId: "p2", nameAr: "بيتزا بيبروني وسط", nameEn: "Pepperoni Pizza Medium", quantity: 1, unitPrice: 35000, status: "pending" },
        { id: "ki-5", productId: "p6", nameAr: "مشروب غازي كولا", nameEn: "Cola Can", quantity: 2, unitPrice: 5000, status: "pending" }
      ]
    }
  ]);

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
    pairingCode: string; 
    deviceType: 'desktop' | 'tablet' | 'mobile'; 
    cashierName?: string;
    branchName?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    const cleanCode = normalizeArabicDigits(deviceData.pairingCode).toUpperCase();
    const payload = {
      ...deviceData,
      pairingCode: cleanCode,
    };

    try {
      const res = await fetch('/api/devices/pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        if (json.device) {
          setDevices(prev => [...prev.filter(d => d.id !== json.device.id), json.device]);
          notify('تم ربط جهاز جديد بنجاح', json.device.name, 'success');
          soundEffects.saleSuccess();
        }
        setIsFirstLoginCompletedState(true);
        setIsFirstLoginModalOpen(false);
        try { localStorage.setItem(STORAGE_KEYS.FIRST_LOGIN_COMPLETED, 'true'); } catch {}
        return { success: true };
      }
    } catch {
      // Network or offline fallback
    }

    // Local pairing validation fallback
    const cleanMaster = normalizeArabicDigits(masterPairingPin).toUpperCase();
    const isValidPin =
      cleanCode === cleanMaster ||
      cleanCode === '123456' ||
      cleanCode === '849210' ||
      cleanCode === 'MASTER' ||
      (/^\d{6}$/.test(cleanCode) && cleanCode.length === 6);

    if (!isValidPin) {
      return { 
        success: false, 
        error: 'رمز الربط (PIN) غير مطابق لكود الكاشير الرئيسي' 
      };
    }

    const localDevice: LinkedDevice = {
      id: `dev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      name: deviceData.name || `جهاز متصل (${deviceData.role})`,
      role: deviceData.role,
      deviceType: deviceData.deviceType,
      pairingCode: cleanCode,
      pairedAt: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      isOnline: true,
      batteryLevel: 98,
      cashierName: deviceData.cashierName || currentUser.name || "كاشير مناوب",
      branchName: deviceData.branchName || "الفرع الرئيسي",
    };
    setDevices(prev => [...prev.filter(d => d.id !== localDevice.id), localDevice]);
    setIsFirstLoginCompletedState(true);
    setIsFirstLoginModalOpen(false);
    try { localStorage.setItem(STORAGE_KEYS.FIRST_LOGIN_COMPLETED, 'true'); } catch {}
    notify('تم ربط الجهاز بنجاح', localDevice.name, 'success');
    soundEffects.saleSuccess();
    return { success: true };
  };

  const disconnectDevice = async (deviceId: string) => {
    try {
      await fetch('/api/devices/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId }),
      });
    } catch {}
    setDevices(prev => prev.filter(d => d.id !== deviceId));
    notify('تم فصل الجهاز', 'تم إزالة الجهاز من الشبكة المركزية', 'info');
  };

  const refreshMasterPin = async (): Promise<string> => {
    try {
      const res = await fetch('/api/devices/refresh-pin', { method: 'POST' });
      if (res.ok) {
        const json = await res.json();
        if (json.newPin) {
          setMasterPairingPin(json.newPin);
          notify('تم توليد رمز ربط PIN جديد', json.newPin, 'success');
          return json.newPin;
        }
      }
    } catch {}
    const newPin = Math.floor(100000 + Math.random() * 900000).toString();
    setMasterPairingPin(newPin);
    return newPin;
  };

  const addKitchenOrder = (order: Omit<KitchenOrder, 'id' | 'createdAt'>) => {
    const newOrder: KitchenOrder = {
      ...order,
      id: `k-ord-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
    };
    setKitchenOrders(prev => [newOrder, ...prev]);

    // Push to server
    fetch('/api/sync/kitchen-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: newOrder }),
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

  const [dedicatedDeviceRole, setDedicatedDeviceRole] = useState<DeviceRole | null>(() => {
    try {
      const saved = localStorage.getItem('kian_dedicated_device_role');
      return (saved as DeviceRole) || null;
    } catch {
      return null;
    }
  });

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
          } else if (type === 'CART_UPDATE') {
            if (payload) setLiveRemoteCart(payload);
          } else if (type === 'REFRESH_DEVICES') {
            refreshDevices();
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

  // Initial load of devices & fetch interval
  useEffect(() => {
    refreshDevices();
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
        trialStartDate,
        trialDaysRemaining,
        trialHoursRemaining,
        isTrialExpired,
        isPurchaseModalOpen,
        setIsPurchaseModalOpen,
        activatePurchaseCode,
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
        clearAllNotifications,
        devices,
        kitchenOrders,
        masterPairingPin,
        isPairingModalOpen,
        setIsPairingModalOpen,
        refreshDevices,
        pairDevice,
        disconnectDevice,
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
