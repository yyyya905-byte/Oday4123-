/**
 * IndexedDB Service for Kian Cashier (كيان كاشير)
 * 
 * Provides robust offline-first persistence for:
 * - Products, categories, and barcodes
 * - Customers, loyalty points, and debt ledgers
 * - Invoices, receipts, and sales transactions
 * - Offline mutations queue (auto-synced when internet reconnects)
 * - Cross-device data transfer packages
 */

import { 
  Product, 
  Category, 
  Customer, 
  Sale, 
  StoreSettings, 
  Refund, 
  DebtTransaction, 
  Expense, 
  VehicleLoadingManifest 
} from '../types';

const DB_NAME = 'KianCashier_OfflineDB';
const DB_VERSION = 2;

export interface OfflineQueueItem {
  id?: number;
  actionType: 'CREATE_SALE' | 'ADJUST_STOCK' | 'RECORD_DEBT_PAYMENT' | 'ADD_CUSTOMER' | 'SYNC_SETTINGS';
  payload: any;
  createdAt: string;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  retryCount: number;
  errorMessage?: string;
}

export interface DeviceTransferPackage {
  transferCode: string;
  senderDeviceId?: string;
  senderDeviceName: string;
  createdAt: string;
  expiresAt: string;
  transferType: 'all' | 'products' | 'customers' | 'sales' | 'documents' | 'settings' | string;
  summary: {
    productsCount: number;
    categoriesCount: number;
    customersCount: number;
    salesCount: number;
    documentsCount?: number;
    hasSettings: boolean;
  };
  data: {
    products?: Product[];
    categories?: Category[];
    customers?: Customer[];
    sales?: Sale[];
    refunds?: Refund[];
    debtTransactions?: DebtTransaction[];
    expenses?: Expense[];
    vehicleManifests?: VehicleLoadingManifest[];
    settings?: Partial<StoreSettings>;
  };
  notes?: string;
}

export interface StorageStats {
  productsCount: number;
  customersCount: number;
  salesCount: number;
  offlineQueueCount: number;
  usageBytes: number;
  quotaBytes: number;
  percentUsed: number;
  lastSyncTime: string | null;
}

export interface StoragePurgeCandidateReport {
  usageBytes: number;
  quotaBytes: number;
  freeBytes: number;
  percentUsed: number;
  isWarning: boolean;
  isCritical: boolean;
  statusLevel: 'healthy' | 'warning' | 'critical';
  statusMessageAr: string;
  isSimulatedWarning: boolean;
  syncedSales: {
    totalCount: number;
    totalBytes: number;
    olderThan30Days: { count: number; bytes: number; sales: Sale[] };
    olderThan60Days: { count: number; bytes: number; sales: Sale[] };
    olderThan90Days: { count: number; bytes: number; sales: Sale[] };
  };
  syncedQueue: {
    count: number;
    bytes: number;
  };
  expiredTransfers: {
    count: number;
    bytes: number;
    transfers: DeviceTransferPackage[];
  };
  oldAuditLogs: {
    count: number;
    bytes: number;
  };
  totalCleanableBytes: number;
}

export interface PurgeOptions {
  purgeSalesOlderThanDays?: 30 | 60 | 90 | null;
  purgeSyncedQueue?: boolean;
  purgeExpiredTransfers?: boolean;
  purgeOldAuditLogs?: boolean;
}

export interface PurgeExecutionResult {
  deletedSalesCount: number;
  deletedSalesIds: string[];
  deletedQueueCount: number;
  deletedTransfersCount: number;
  deletedLogsCount: number;
  freedBytes: number;
  messageAr: string;
}

export interface IndexedDbCleanWipeSummary {
  dbName: string;
  productsCount: number;
  categoriesCount: number;
  customersCount: number;
  salesCount: number;
  offlineQueueCount: number;
  deviceTransfersCount: number;
  totalRecordsCount: number;
  estimatedSizeBytes: number;
  objectStoreNames: string[];
}

export type AutoBackupTriggerType =
  | 'manual_download'
  | 'scheduled_auto'
  | 'shift_close'
  | 'pre_restore_safety'
  | 'data_mutation';

export interface IndexedDbAutoBackupConfig {
  enabled: boolean;
  intervalMinutes: 5 | 15 | 30 | 60 | 360 | 1440;
  autoDownloadToDevice: boolean;
  backupOnShiftClose: boolean;
  safetyBackupBeforeRestore: boolean;
  maxHistoryCount: number;
  lastAutoBackupAt: string | null;
  lastDownloadedAt: string | null;
}

export interface IndexedDbBackupSnapshot {
  backupId: string;
  app: string;
  engine: string;
  dbName: string;
  dbVersion: number;
  version: string;
  exportDate: string;
  triggerType: AutoBackupTriggerType;
  triggerLabelAr: string;
  storeName: string;
  checksum: string;
  notes?: string;
  summary: {
    productsCount: number;
    categoriesCount: number;
    customersCount: number;
    salesCount: number;
    offlineQueueCount: number;
    deviceTransfersCount: number;
    suppliersCount: number;
    debtTransactionsCount: number;
    refundsCount: number;
    inventoryLogsCount: number;
    expensesCount: number;
    usersCount: number;
    totalRecordsCount: number;
    estimatedSizeBytes: number;
  };
  indexedDbStores: {
    products: Product[];
    categories: Category[];
    customers: Customer[];
    sales: Sale[];
    settings: StoreSettings | null;
    offline_queue: OfflineQueueItem[];
    device_transfers: DeviceTransferPackage[];
    app_meta: Array<{ key: string; value: any }>;
  };
  // Top-level compatibility fields for AppContext hydration
  settings?: StoreSettings | null;
  products: Product[];
  categories: Category[];
  customers: Customer[];
  sales: Sale[];
  suppliers?: any[];
  debtTransactions?: DebtTransaction[];
  refunds?: Refund[];
  inventoryLogs?: any[];
  expenses?: Expense[];
  auditLogs?: any[];
  users?: any[];
  wholesaleWarehouses?: any[];
  deliveryVehicles?: any[];
  vehicleManifests?: VehicleLoadingManifest[];
  shifts?: any[];
  promotions?: any[];
}

export interface IndexedDbParsedRestorePreview {
  valid: boolean;
  error?: string;
  backupId: string;
  app: string;
  version: string;
  exportDate: string;
  storeName: string;
  checksum: string;
  triggerLabelAr: string;
  fileSizeBytes: number;
  counts: {
    productsCount: number;
    categoriesCount: number;
    customersCount: number;
    salesCount: number;
    offlineQueueCount: number;
    deviceTransfersCount: number;
    suppliersCount: number;
    debtTransactionsCount: number;
    refundsCount: number;
    inventoryLogsCount: number;
    expensesCount: number;
    usersCount: number;
    totalRecordsCount: number;
  };
  rawSnapshot: any;
}

class IndexedDbService {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  /**
   * Initializes or gets existing IndexedDB connection
   */
  async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise<IDBDatabase>((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        return reject(new Error('IndexedDB غير مدعوم في هذا المتصفح'));
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Products Store
        if (!db.objectStoreNames.contains('products')) {
          const productStore = db.createObjectStore('products', { keyPath: 'id' });
          productStore.createIndex('barcode', 'barcode', { unique: false });
          productStore.createIndex('category', 'category', { unique: false });
          productStore.createIndex('sku', 'sku', { unique: false });
        }

        // Categories Store
        if (!db.objectStoreNames.contains('categories')) {
          db.createObjectStore('categories', { keyPath: 'id' });
        }

        // Customers Store
        if (!db.objectStoreNames.contains('customers')) {
          const customerStore = db.createObjectStore('customers', { keyPath: 'id' });
          customerStore.createIndex('phone', 'phone', { unique: false });
          customerStore.createIndex('customerCode', 'customerCode', { unique: false });
        }

        // Sales Store
        if (!db.objectStoreNames.contains('sales')) {
          const saleStore = db.createObjectStore('sales', { keyPath: 'id' });
          saleStore.createIndex('createdAt', 'createdAt', { unique: false });
          saleStore.createIndex('invoiceNumber', 'invoiceNumber', { unique: false });
          saleStore.createIndex('paymentStatus', 'paymentStatus', { unique: false });
        }

        // Settings Store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'id' });
        }

        // Offline Mutation Queue Store
        if (!db.objectStoreNames.contains('offline_queue')) {
          const queueStore = db.createObjectStore('offline_queue', { keyPath: 'id', autoIncrement: true });
          queueStore.createIndex('status', 'status', { unique: false });
          queueStore.createIndex('createdAt', 'createdAt', { unique: false });
          queueStore.createIndex('actionType', 'actionType', { unique: false });
        }

        // Device Transfers Store
        if (!db.objectStoreNames.contains('device_transfers')) {
          const transferStore = db.createObjectStore('device_transfers', { keyPath: 'transferCode' });
          transferStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // App Meta / Cache Store
        if (!db.objectStoreNames.contains('app_meta')) {
          db.createObjectStore('app_meta', { keyPath: 'key' });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        const error = (event.target as IDBOpenDBRequest).error;
        console.error('Failed to open IndexedDB:', error);
        reject(error);
      };
    });

    return this.initPromise;
  }

  /**
   * Synchronize full in-memory state into IndexedDB (Products, Categories, Customers, Sales, Settings)
   */
  async cacheAllData(data: {
    products?: Product[];
    categories?: Category[];
    customers?: Customer[];
    sales?: Sale[];
    settings?: StoreSettings;
  }): Promise<void> {
    try {
      await this.getDB();

      // Replace products store (clears old records if array is empty)
      if (data.products !== undefined) {
        await this.replaceStoreItems('products', data.products);
      }

      // Replace categories store
      if (data.categories !== undefined) {
        await this.replaceStoreItems('categories', data.categories);
      }

      // Replace customers store
      if (data.customers !== undefined) {
        await this.replaceStoreItems('customers', data.customers);
      }

      // Replace sales store
      if (data.sales !== undefined) {
        await this.replaceStoreItems('sales', data.sales);
      }

      // Write settings
      if (data.settings) {
        await this.putOne('settings', { id: 'current_store_settings', ...data.settings });
      }

      // Update metadata
      await this.putOne('app_meta', {
        key: 'last_cache_timestamp',
        value: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Error caching data to IndexedDB:', err);
    }
  }

  /**
   * Read or initialize Auto-Backup configuration from localStorage / IndexedDB
   */
  getAutoBackupConfig(): IndexedDbAutoBackupConfig {
    const defaultConfig: IndexedDbAutoBackupConfig = {
      enabled: true,
      intervalMinutes: 30,
      autoDownloadToDevice: false,
      backupOnShiftClose: true,
      safetyBackupBeforeRestore: true,
      maxHistoryCount: 10,
      lastAutoBackupAt: null,
      lastDownloadedAt: null,
    };
    try {
      const saved = localStorage.getItem('kian_indexeddb_autobackup_config');
      if (saved) {
        return { ...defaultConfig, ...JSON.parse(saved) };
      }
    } catch {}
    return defaultConfig;
  }

  /**
   * Save Auto-Backup configuration to localStorage & IndexedDB app_meta
   */
  async saveAutoBackupConfig(partial: Partial<IndexedDbAutoBackupConfig>): Promise<IndexedDbAutoBackupConfig> {
    const current = this.getAutoBackupConfig();
    const updated: IndexedDbAutoBackupConfig = { ...current, ...partial };
    try {
      localStorage.setItem('kian_indexeddb_autobackup_config', JSON.stringify(updated));
      await this.putOne('app_meta', {
        key: 'auto_backup_config',
        value: updated,
      });
    } catch (err) {
      console.warn('Failed to persist auto-backup config:', err);
    }
    return updated;
  }

  /**
   * Compute a fast deterministic checksum for verifying JSON backup integrity
   */
  private computeBackupChecksum(payloadStr: string): string {
    let hash = 2166136261;
    for (let i = 0; i < payloadStr.length; i++) {
      hash ^= payloadStr.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return `KIAN-SHA-${(hash >>> 0).toString(16).toUpperCase().padStart(8, '0')}`;
  }

  /**
   * Build a complete snapshot reading directly from all IndexedDB object stores
   * and merging extended POS collections so nothing is ever lost.
   */
  async exportFullIndexedDbSnapshot(
    extendedState?: {
      products?: Product[];
      categories?: Category[];
      customers?: Customer[];
      sales?: Sale[];
      settings?: StoreSettings;
      suppliers?: any[];
      debtTransactions?: DebtTransaction[];
      refunds?: Refund[];
      inventoryLogs?: any[];
      expenses?: Expense[];
      auditLogs?: any[];
      users?: any[];
      wholesaleWarehouses?: any[];
      deliveryVehicles?: any[];
      vehicleManifests?: VehicleLoadingManifest[];
      shifts?: any[];
      promotions?: any[];
    },
    triggerType: AutoBackupTriggerType = 'manual_download',
    notes?: string
  ): Promise<IndexedDbBackupSnapshot> {
    await this.getDB();

    const [
      idbProducts,
      idbCategories,
      idbCustomers,
      idbSales,
      idbSettingsRecord,
      idbQueue,
      idbTransfers,
      idbMetaAll,
    ] = await Promise.all([
      this.getAll<Product>('products').catch(() => []),
      this.getAll<Category>('categories').catch(() => []),
      this.getAll<Customer>('customers').catch(() => []),
      this.getAll<Sale>('sales').catch(() => []),
      this.getOne<any>('settings', 'current_store_settings').catch(() => null),
      this.getAll<OfflineQueueItem>('offline_queue').catch(() => []),
      this.getAll<DeviceTransferPackage>('device_transfers').catch(() => []),
      this.getAll<any>('app_meta').catch(() => []),
    ]);

    let cleanIdbSettings: StoreSettings | null = null;
    if (idbSettingsRecord) {
      const { id, ...rest } = idbSettingsRecord;
      cleanIdbSettings = rest as StoreSettings;
    }

    const finalProducts =
      idbProducts.length > 0 ? idbProducts : extendedState?.products || [];
    const finalCategories =
      idbCategories.length > 0 ? idbCategories : extendedState?.categories || [];
    const finalCustomers =
      idbCustomers.length > 0 ? idbCustomers : extendedState?.customers || [];
    const finalSales =
      idbSales.length > 0 ? idbSales : extendedState?.sales || [];
    const finalSettings =
      extendedState?.settings || cleanIdbSettings || null;

    const suppliers = extendedState?.suppliers || [];
    const debtTransactions = extendedState?.debtTransactions || [];
    const refunds = extendedState?.refunds || [];
    const inventoryLogs = extendedState?.inventoryLogs || [];
    const expenses = extendedState?.expenses || [];
    const auditLogs = extendedState?.auditLogs || [];
    const users = extendedState?.users || [];
    const wholesaleWarehouses = extendedState?.wholesaleWarehouses || [];
    const deliveryVehicles = extendedState?.deliveryVehicles || [];
    const vehicleManifests = extendedState?.vehicleManifests || [];
    const shifts = extendedState?.shifts || [];
    const promotions = extendedState?.promotions || [];

    // Filter out bulky auto_backup_history from app_meta inside the snapshot to prevent recursive growth
    const filteredAppMeta = (idbMetaAll || []).filter(
      (m: any) => m && m.key !== 'auto_backup_history'
    );

    const triggerLabels: Record<AutoBackupTriggerType, string> = {
      manual_download: 'نسخ احتياطي وتحميل بطلب المستخدم',
      scheduled_auto: 'نسخ احتياطي ذاتي دوري تلقائي (Auto-Backup)',
      shift_close: 'نسخ احتياطي تلقائي عند إغلاق الوردية',
      pre_restore_safety: 'نسخة أمان تلقائية قبل استعادة بيانات جديدة',
      data_mutation: 'نسخ احتياطي تلقائي بعد تحديث العمليات',
    };

    const totalRecordsCount =
      finalProducts.length +
      finalCategories.length +
      finalCustomers.length +
      finalSales.length +
      idbQueue.length +
      idbTransfers.length +
      suppliers.length +
      debtTransactions.length +
      refunds.length +
      inventoryLogs.length +
      expenses.length;

    const coreChecksumSeed = JSON.stringify({
      p: finalProducts.length,
      c: finalCategories.length,
      cu: finalCustomers.length,
      s: finalSales.length,
      q: idbQueue.length,
      t: Date.now(),
    });
    const checksum = this.computeBackupChecksum(coreChecksumSeed);
    const exportDate = new Date().toISOString();
    const backupId = `IDB_BKP_${Date.now()}_${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const storeName =
      finalSettings?.storeNameAr || finalSettings?.storeNameEn || 'متجر كيان كاشير';

    const snapshot: IndexedDbBackupSnapshot = {
      backupId,
      app: 'Kian Cashier (كيان كاشير)',
      engine: 'IndexedDB_AutoBackup_Engine',
      dbName: DB_NAME,
      dbVersion: DB_VERSION,
      version: '3.0',
      exportDate,
      triggerType,
      triggerLabelAr: triggerLabels[triggerType] || 'نسخ احتياطي',
      storeName,
      checksum,
      notes,
      summary: {
        productsCount: finalProducts.length,
        categoriesCount: finalCategories.length,
        customersCount: finalCustomers.length,
        salesCount: finalSales.length,
        offlineQueueCount: idbQueue.length,
        deviceTransfersCount: idbTransfers.length,
        suppliersCount: suppliers.length,
        debtTransactionsCount: debtTransactions.length,
        refundsCount: refunds.length,
        inventoryLogsCount: inventoryLogs.length,
        expensesCount: expenses.length,
        usersCount: users.length,
        totalRecordsCount,
        estimatedSizeBytes: 0,
      },
      indexedDbStores: {
        products: finalProducts,
        categories: finalCategories,
        customers: finalCustomers,
        sales: finalSales,
        settings: finalSettings,
        offline_queue: idbQueue,
        device_transfers: idbTransfers,
        app_meta: filteredAppMeta,
      },
      settings: finalSettings,
      products: finalProducts,
      categories: finalCategories,
      customers: finalCustomers,
      sales: finalSales,
      suppliers,
      debtTransactions,
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
    };

    const estimatedSizeBytes = Math.max(2048, JSON.stringify(snapshot).length);
    snapshot.summary.estimatedSizeBytes = estimatedSizeBytes;

    return snapshot;
  }

  /**
   * Creates an IndexedDB Auto-Backup snapshot, stores it in the rolling history inside IndexedDB,
   * and optionally downloads the JSON file directly to the user's device.
   */
  async createAutoBackupSnapshot(
    extendedState?: Parameters<IndexedDbService['exportFullIndexedDbSnapshot']>[0],
    options?: {
      triggerType?: AutoBackupTriggerType;
      downloadToDevice?: boolean;
      customFileNamePrefix?: string;
      notes?: string;
    }
  ): Promise<{
    snapshot: IndexedDbBackupSnapshot;
    downloadedFileName: string | null;
  }> {
    const triggerType = options?.triggerType || 'manual_download';
    const snapshot = await this.exportFullIndexedDbSnapshot(
      extendedState,
      triggerType,
      options?.notes
    );

    // Save snapshot into IndexedDB rolling history (`app_meta` -> `auto_backup_history`)
    try {
      const config = this.getAutoBackupConfig();
      const maxCount = Math.max(3, Math.min(25, config.maxHistoryCount || 10));
      const existingHistoryRecord = await this.getOne<{
        key: string;
        value: IndexedDbBackupSnapshot[];
      }>('app_meta', 'auto_backup_history');
      const existingList = Array.isArray(existingHistoryRecord?.value)
        ? existingHistoryRecord!.value
        : [];

      const updatedHistory = [snapshot, ...existingList].slice(0, maxCount);
      await this.putOne('app_meta', {
        key: 'auto_backup_history',
        value: updatedHistory,
      });

      const nowIso = snapshot.exportDate;
      await this.saveAutoBackupConfig({
        lastAutoBackupAt: nowIso,
        ...(options?.downloadToDevice ? { lastDownloadedAt: nowIso } : {}),
      });
    } catch (err) {
      console.warn('Failed to store snapshot in IndexedDB history:', err);
    }

    let downloadedFileName: string | null = null;
    if (options?.downloadToDevice) {
      downloadedFileName = downloadJsonBackup(
        snapshot,
        options.customFileNamePrefix || 'Kian_IndexedDB_Backup'
      );
    }

    return { snapshot, downloadedFileName };
  }

  /**
   * Retrieve all saved Auto-Backup snapshots from IndexedDB
   */
  async getSavedAutoBackupHistory(): Promise<IndexedDbBackupSnapshot[]> {
    try {
      const record = await this.getOne<{ key: string; value: IndexedDbBackupSnapshot[] }>(
        'app_meta',
        'auto_backup_history'
      );
      if (record && Array.isArray(record.value)) {
        return record.value;
      }
    } catch (err) {
      console.warn('Error reading auto_backup_history from IndexedDB:', err);
    }
    return [];
  }

  /**
   * Delete a specific snapshot from the IndexedDB Auto-Backup history
   */
  async deleteAutoBackupFromHistory(backupId: string): Promise<IndexedDbBackupSnapshot[]> {
    try {
      const list = await this.getSavedAutoBackupHistory();
      const filtered = list.filter(item => item.backupId !== backupId);
      await this.putOne('app_meta', {
        key: 'auto_backup_history',
        value: filtered,
      });
      return filtered;
    } catch {
      return [];
    }
  }

  /**
   * Parse and validate a JSON backup string before restoring, returning full preview counts
   */
  inspectBackupJsonForRestore(jsonString: string): IndexedDbParsedRestorePreview {
    try {
      const rawSize = new Blob([jsonString]).size;
      const parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== 'object') {
        return {
          valid: false,
          error: 'ملف JSON غير صالح أو فارغ.',
          backupId: '',
          app: '',
          version: '',
          exportDate: '',
          storeName: '',
          checksum: '',
          triggerLabelAr: '',
          fileSizeBytes: rawSize,
          counts: {
            productsCount: 0,
            categoriesCount: 0,
            customersCount: 0,
            salesCount: 0,
            offlineQueueCount: 0,
            deviceTransfersCount: 0,
            suppliersCount: 0,
            debtTransactionsCount: 0,
            refundsCount: 0,
            inventoryLogsCount: 0,
            expensesCount: 0,
            usersCount: 0,
            totalRecordsCount: 0,
          },
          rawSnapshot: null,
        };
      }

      // Support both IndexedDbBackupSnapshot format, GoogleDrive snapshot format, and DeviceTransferPackage format
      const idbStores = parsed.indexedDbStores || {};
      const dataNode = parsed.data || parsed;

      const products: Product[] = Array.isArray(idbStores.products)
        ? idbStores.products
        : Array.isArray(dataNode.products)
        ? dataNode.products
        : [];
      const categories: Category[] = Array.isArray(idbStores.categories)
        ? idbStores.categories
        : Array.isArray(dataNode.categories)
        ? dataNode.categories
        : [];
      const customers: Customer[] = Array.isArray(idbStores.customers)
        ? idbStores.customers
        : Array.isArray(dataNode.customers)
        ? dataNode.customers
        : [];
      const sales: Sale[] = Array.isArray(idbStores.sales)
        ? idbStores.sales
        : Array.isArray(dataNode.sales)
        ? dataNode.sales
        : [];
      const offlineQueue: OfflineQueueItem[] = Array.isArray(idbStores.offline_queue)
        ? idbStores.offline_queue
        : [];
      const deviceTransfers: DeviceTransferPackage[] = Array.isArray(idbStores.device_transfers)
        ? idbStores.device_transfers
        : [];
      const suppliers: any[] = Array.isArray(dataNode.suppliers) ? dataNode.suppliers : [];
      const debtTransactions: any[] = Array.isArray(dataNode.debtTransactions)
        ? dataNode.debtTransactions
        : [];
      const refunds: any[] = Array.isArray(dataNode.refunds) ? dataNode.refunds : [];
      const inventoryLogs: any[] = Array.isArray(dataNode.inventoryLogs)
        ? dataNode.inventoryLogs
        : Array.isArray(dataNode.stockMovements)
        ? dataNode.stockMovements
        : [];
      const expenses: any[] = Array.isArray(dataNode.expenses) ? dataNode.expenses : [];
      const users: any[] = Array.isArray(dataNode.users) ? dataNode.users : [];
      const settingsObj = idbStores.settings || dataNode.settings || null;

      const hasValidCollections =
        Array.isArray(idbStores.products) ||
        Array.isArray(dataNode.products) ||
        Array.isArray(idbStores.sales) ||
        Array.isArray(dataNode.sales) ||
        Array.isArray(idbStores.customers) ||
        Array.isArray(dataNode.customers) ||
        Boolean(settingsObj);

      if (!hasValidCollections) {
        return {
          valid: false,
          error:
            'الملف المختار لا يحتوي على هيكلة بيانات IndexedDB أو كاشير كيان المعتمدة (لا توجد منتجات أو فواتير أو إعدادات).',
          backupId: '',
          app: '',
          version: '',
          exportDate: '',
          storeName: '',
          checksum: '',
          triggerLabelAr: '',
          fileSizeBytes: rawSize,
          counts: {
            productsCount: 0,
            categoriesCount: 0,
            customersCount: 0,
            salesCount: 0,
            offlineQueueCount: 0,
            deviceTransfersCount: 0,
            suppliersCount: 0,
            debtTransactionsCount: 0,
            refundsCount: 0,
            inventoryLogsCount: 0,
            expensesCount: 0,
            usersCount: 0,
            totalRecordsCount: 0,
          },
          rawSnapshot: null,
        };
      }

      const totalRecordsCount =
        products.length +
        categories.length +
        customers.length +
        sales.length +
        offlineQueue.length +
        deviceTransfers.length +
        suppliers.length +
        debtTransactions.length +
        refunds.length +
        inventoryLogs.length +
        expenses.length;

      return {
        valid: true,
        backupId: parsed.backupId || `RESTORE_${Date.now()}`,
        app: parsed.app || 'Kian Cashier',
        version: String(parsed.version || '2.6'),
        exportDate: parsed.exportDate || parsed.exportedAt || parsed.createdAt || new Date().toISOString(),
        storeName:
          parsed.storeName ||
          settingsObj?.storeNameAr ||
          settingsObj?.storeNameEn ||
          'نسخة احتياطية معتمدة',
        checksum: parsed.checksum || this.computeBackupChecksum(jsonString.slice(0, 2048)),
        triggerLabelAr: parsed.triggerLabelAr || 'ملف نسخة احتياطية خارجي (JSON)',
        fileSizeBytes: rawSize,
        counts: {
          productsCount: products.length,
          categoriesCount: categories.length,
          customersCount: customers.length,
          salesCount: sales.length,
          offlineQueueCount: offlineQueue.length,
          deviceTransfersCount: deviceTransfers.length,
          suppliersCount: suppliers.length,
          debtTransactionsCount: debtTransactions.length,
          refundsCount: refunds.length,
          inventoryLogsCount: inventoryLogs.length,
          expensesCount: expenses.length,
          usersCount: users.length,
          totalRecordsCount,
        },
        rawSnapshot: parsed,
      };
    } catch (err: any) {
      return {
        valid: false,
        error: 'تعذر قراءة ملف JSON: تأكد من أن الملف بصيغة JSON صحيحة وغير تالف.',
        backupId: '',
        app: '',
        version: '',
        exportDate: '',
        storeName: '',
        checksum: '',
        triggerLabelAr: '',
        fileSizeBytes: 0,
        counts: {
          productsCount: 0,
          categoriesCount: 0,
          customersCount: 0,
          salesCount: 0,
          offlineQueueCount: 0,
          deviceTransfersCount: 0,
          suppliersCount: 0,
          debtTransactionsCount: 0,
          refundsCount: 0,
          inventoryLogsCount: 0,
          expensesCount: 0,
          usersCount: 0,
          totalRecordsCount: 0,
        },
        rawSnapshot: null,
      };
    }
  }

  /**
   * Restores all IndexedDB object stores (`products`, `categories`, `customers`, `sales`, `settings`, `offline_queue`, `device_transfers`)
   * from a parsed snapshot or JSON string, supporting both 'replace' (full overwrite) and 'merge' (smart non-destructive merge).
   */
  async restoreFullIndexedDbFromBackup(
    jsonOrObject: string | any,
    mode: 'replace' | 'merge' = 'replace'
  ): Promise<{
    success: boolean;
    error?: string;
    restoredAt: string;
    mode: 'replace' | 'merge';
    restoredData: {
      products: Product[];
      categories: Category[];
      customers: Customer[];
      sales: Sale[];
      settings: StoreSettings | null;
      suppliers?: any[];
      debtTransactions?: DebtTransaction[];
      refunds?: Refund[];
      inventoryLogs?: any[];
      expenses?: Expense[];
      auditLogs?: any[];
      users?: any[];
      wholesaleWarehouses?: any[];
      deliveryVehicles?: any[];
      vehicleManifests?: VehicleLoadingManifest[];
      shifts?: any[];
      promotions?: any[];
    };
  }> {
    const restoredAt = new Date().toISOString();
    try {
      const rawString =
        typeof jsonOrObject === 'string' ? jsonOrObject : JSON.stringify(jsonOrObject);
      const preview = this.inspectBackupJsonForRestore(rawString);
      if (!preview.valid || !preview.rawSnapshot) {
        return {
          success: false,
          error: preview.error || 'ملف النسخة الاحتياطية غير صالح للاستعادة',
          restoredAt,
          mode,
          restoredData: {
            products: [],
            categories: [],
            customers: [],
            sales: [],
            settings: null,
          },
        };
      }

      const parsed = preview.rawSnapshot;
      const idbStores = parsed.indexedDbStores || {};
      const dataNode = parsed.data || parsed;

      const incomingProducts: Product[] = Array.isArray(idbStores.products)
        ? idbStores.products
        : Array.isArray(dataNode.products)
        ? dataNode.products
        : [];
      const incomingCategories: Category[] = Array.isArray(idbStores.categories)
        ? idbStores.categories
        : Array.isArray(dataNode.categories)
        ? dataNode.categories
        : [];
      const incomingCustomers: Customer[] = Array.isArray(idbStores.customers)
        ? idbStores.customers
        : Array.isArray(dataNode.customers)
        ? dataNode.customers
        : [];
      const incomingSales: Sale[] = Array.isArray(idbStores.sales)
        ? idbStores.sales
        : Array.isArray(dataNode.sales)
        ? dataNode.sales
        : [];
      const incomingSettings: StoreSettings | null =
        idbStores.settings || dataNode.settings || null;
      const incomingQueue: OfflineQueueItem[] = Array.isArray(idbStores.offline_queue)
        ? idbStores.offline_queue
        : [];
      const incomingTransfers: DeviceTransferPackage[] = Array.isArray(idbStores.device_transfers)
        ? idbStores.device_transfers
        : [];

      await this.getDB();

      let finalProducts = incomingProducts;
      let finalCategories = incomingCategories;
      let finalCustomers = incomingCustomers;
      let finalSales = incomingSales;

      if (mode === 'merge') {
        const [currProds, currCats, currCusts, currSales] = await Promise.all([
          this.getAll<Product>('products').catch(() => []),
          this.getAll<Category>('categories').catch(() => []),
          this.getAll<Customer>('customers').catch(() => []),
          this.getAll<Sale>('sales').catch(() => []),
        ]);

        const mergeById = <T extends { id: string }>(current: T[], incoming: T[]): T[] => {
          const map = new Map<string, T>();
          current.forEach(item => {
            if (item && item.id) map.set(item.id, item);
          });
          incoming.forEach(item => {
            if (item && item.id) map.set(item.id, item);
          });
          return Array.from(map.values());
        };

        finalProducts = mergeById(currProds, incomingProducts);
        finalCategories = mergeById(currCats, incomingCategories);
        finalCustomers = mergeById(currCusts, incomingCustomers);
        finalSales = mergeById(currSales, incomingSales);
      }

      // Write all stores to IndexedDB
      await this.replaceStoreItems('products', finalProducts);
      if (finalCategories.length > 0 || mode === 'replace') {
        await this.replaceStoreItems('categories', finalCategories);
      }
      await this.replaceStoreItems('customers', finalCustomers);
      await this.replaceStoreItems('sales', finalSales);

      if (incomingSettings) {
        await this.putOne('settings', {
          id: 'current_store_settings',
          ...incomingSettings,
        });
      }

      if (incomingQueue.length > 0) {
        await this.bulkPut('offline_queue', incomingQueue);
      }

      if (incomingTransfers.length > 0) {
        await this.bulkPut('device_transfers', incomingTransfers);
      }

      await this.putOne('app_meta', {
        key: 'last_restore_timestamp',
        value: restoredAt,
      });
      await this.putOne('app_meta', {
        key: 'last_cache_timestamp',
        value: restoredAt,
      });

      return {
        success: true,
        restoredAt,
        mode,
        restoredData: {
          products: finalProducts,
          categories: finalCategories,
          customers: finalCustomers,
          sales: finalSales,
          settings: incomingSettings,
          suppliers: Array.isArray(dataNode.suppliers) ? dataNode.suppliers : undefined,
          debtTransactions: Array.isArray(dataNode.debtTransactions)
            ? dataNode.debtTransactions
            : undefined,
          refunds: Array.isArray(dataNode.refunds) ? dataNode.refunds : undefined,
          inventoryLogs: Array.isArray(dataNode.inventoryLogs)
            ? dataNode.inventoryLogs
            : Array.isArray(dataNode.stockMovements)
            ? dataNode.stockMovements
            : undefined,
          expenses: Array.isArray(dataNode.expenses) ? dataNode.expenses : undefined,
          auditLogs: Array.isArray(dataNode.auditLogs) ? dataNode.auditLogs : undefined,
          users: Array.isArray(dataNode.users) ? dataNode.users : undefined,
          wholesaleWarehouses: Array.isArray(dataNode.wholesaleWarehouses)
            ? dataNode.wholesaleWarehouses
            : undefined,
          deliveryVehicles: Array.isArray(dataNode.deliveryVehicles)
            ? dataNode.deliveryVehicles
            : undefined,
          vehicleManifests: Array.isArray(dataNode.vehicleManifests)
            ? dataNode.vehicleManifests
            : undefined,
          shifts: Array.isArray(dataNode.shifts) ? dataNode.shifts : undefined,
          promotions: Array.isArray(dataNode.promotions) ? dataNode.promotions : undefined,
        },
      };
    } catch (err: any) {
      console.error('Failed to restore IndexedDB from backup:', err);
      return {
        success: false,
        error: err?.message || 'حدث خطأ أثناء استعادة قاعدة بيانات IndexedDB',
        restoredAt,
        mode,
        restoredData: {
          products: [],
          categories: [],
          customers: [],
          sales: [],
          settings: null,
        },
      };
    }
  }

  /**
   * Returns a detailed summary of all records currently stored in IndexedDB before performing a clean wipe
   */
  async getCleanWipeSummary(): Promise<IndexedDbCleanWipeSummary> {
    const storeList = [
      'products',
      'categories',
      'customers',
      'sales',
      'offline_queue',
      'device_transfers',
      'settings',
      'app_meta',
    ];
    try {
      const [products, categories, customers, sales, queue, transfers] = await Promise.all([
        this.getAll<Product>('products'),
        this.getAll<Category>('categories'),
        this.getAll<Customer>('customers'),
        this.getAll<Sale>('sales'),
        this.getAll<OfflineQueueItem>('offline_queue'),
        this.getAll<DeviceTransferPackage>('device_transfers'),
      ]);

      const totalRecordsCount =
        products.length +
        categories.length +
        customers.length +
        sales.length +
        queue.length +
        transfers.length;

      const rawJson = JSON.stringify({ products, categories, customers, sales, queue, transfers });
      const estimatedSizeBytes = Math.max(4096, rawJson.length * 2);

      return {
        dbName: DB_NAME,
        productsCount: products.length,
        categoriesCount: categories.length,
        customersCount: customers.length,
        salesCount: sales.length,
        offlineQueueCount: queue.length,
        deviceTransfersCount: transfers.length,
        totalRecordsCount,
        estimatedSizeBytes,
        objectStoreNames: storeList,
      };
    } catch {
      return {
        dbName: DB_NAME,
        productsCount: 0,
        categoriesCount: 0,
        customersCount: 0,
        salesCount: 0,
        offlineQueueCount: 0,
        deviceTransfersCount: 0,
        totalRecordsCount: 0,
        estimatedSizeBytes: 0,
        objectStoreNames: storeList,
      };
    }
  }

  /**
   * Completely wipes ALL object stores in IndexedDB (`KianCashier_OfflineDB`) upon activating a new monthly/annual subscription code,
   * ensuring a 100% clean start for the subscriber.
   */
  async clearAllDataForNewSubscription(
    freshSettings?: StoreSettings,
    baseCategories?: Category[]
  ): Promise<{
    success: boolean;
    clearedStores: string[];
    totalClearedRecords: number;
    wipedAt: string;
  }> {
    const wipedAt = new Date().toISOString();
    const allStores = [
      'products',
      'categories',
      'customers',
      'sales',
      'settings',
      'offline_queue',
      'device_transfers',
      'app_meta',
    ];

    try {
      const summaryBefore = await this.getCleanWipeSummary();
      const db = await this.getDB();
      const dynamicStores = Array.from(db.objectStoreNames);
      const existingStores = dynamicStores.length > 0
        ? dynamicStores
        : allStores.filter(name => db.objectStoreNames.contains(name));

      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(existingStores, 'readwrite');
        for (const storeName of existingStores) {
          tx.objectStore(storeName).clear();
        }
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });

      if (baseCategories && baseCategories.length > 0) {
        await this.bulkPut('categories', baseCategories);
      }

      if (freshSettings) {
        await this.putOne('settings', { id: 'current_store_settings', ...freshSettings });
      }

      await this.putOne('app_meta', {
        key: 'last_subscription_clean_wipe',
        value: wipedAt,
      });
      await this.putOne('app_meta', {
        key: 'last_cache_timestamp',
        value: wipedAt,
      });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('kian-indexeddb-wiped', {
            detail: { wipedAt, clearedStores: existingStores, totalClearedRecords: summaryBefore.totalRecordsCount },
          })
        );
      }

      return {
        success: true,
        clearedStores: existingStores,
        totalClearedRecords: summaryBefore.totalRecordsCount,
        wipedAt,
      };
    } catch (err) {
      console.warn('Error clearing IndexedDB for new subscription:', err);
      return {
        success: false,
        clearedStores: allStores,
        totalClearedRecords: 0,
        wipedAt,
      };
    }
  }

  /**
   * Restore all cached state from IndexedDB when starting offline or recovering
   */
  async loadCachedData(): Promise<{
    products: Product[];
    categories: Category[];
    customers: Customer[];
    sales: Sale[];
    settings: StoreSettings | null;
  }> {
    try {
      const [products, categories, customers, sales, settingsRecord] = await Promise.all([
        this.getAll<Product>('products'),
        this.getAll<Category>('categories'),
        this.getAll<Customer>('customers'),
        this.getAll<Sale>('sales'),
        this.getOne<any>('settings', 'current_store_settings'),
      ]);

      let settings: StoreSettings | null = null;
      if (settingsRecord) {
        const { id, ...rest } = settingsRecord;
        settings = rest as StoreSettings;
      }

      return { products, categories, customers, sales, settings };
    } catch (err) {
      console.warn('Error loading cached data from IndexedDB:', err);
      return { products: [], categories: [], customers: [], sales: [], settings: null };
    }
  }

  /**
   * Enqueue an action performed while offline (e.g. sale, debt payment)
   */
  async enqueueOfflineAction(actionType: OfflineQueueItem['actionType'], payload: any): Promise<number> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['offline_queue'], 'readwrite');
      const store = transaction.objectStore('offline_queue');

      const item: OfflineQueueItem = {
        actionType,
        payload,
        createdAt: new Date().toISOString(),
        status: 'pending',
        retryCount: 0,
      };

      const request = store.add(item);
      request.onsuccess = () => {
        resolve(request.result as number);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all pending offline queue items
   */
  async getPendingOfflineQueue(): Promise<OfflineQueueItem[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['offline_queue'], 'readonly');
      const store = transaction.objectStore('offline_queue');
      const index = store.index('status');
      const request = index.getAll('pending');

      request.onsuccess = () => {
        resolve(request.result || []);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Alias for getPendingOfflineQueue
   */
  async getPendingActions(): Promise<OfflineQueueItem[]> {
    return this.getPendingOfflineQueue();
  }

  /**
   * Mark a queue item as synced or update status
   */
  async updateQueueItemStatus(id: number, status: OfflineQueueItem['status'], errorMessage?: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['offline_queue'], 'readwrite');
      const store = transaction.objectStore('offline_queue');
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        const item: OfflineQueueItem = getReq.result;
        if (!item) return resolve();

        item.status = status;
        if (status === 'failed') {
          item.retryCount = (item.retryCount || 0) + 1;
          item.errorMessage = errorMessage;
        }
        const putReq = store.put(item);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }

  /**
   * Helper to compress JSON data into gzip base64 using standard browser CompressionStream
   */
  private async compressBatchPayload(data: any): Promise<{
    isCompressed: boolean;
    compression?: 'gzip';
    payload: string;
    originalSizeBytes: number;
    compressedSizeBytes: number;
    compressionRatio: string;
    savedBandwidthKb: string;
  }> {
    const jsonStr = JSON.stringify(data);
    const encoder = new TextEncoder();
    const rawBytes = encoder.encode(jsonStr);
    const originalSizeBytes = rawBytes.byteLength;

    if (typeof CompressionStream !== 'undefined') {
      try {
        const cs = new CompressionStream('gzip');
        const writer = cs.writable.getWriter();
        writer.write(rawBytes);
        writer.close();

        const response = new Response(cs.readable);
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const uint8 = new Uint8Array(arrayBuffer);
        const compressedSizeBytes = uint8.byteLength;

        // Convert Uint8Array to base64 string safely
        let binary = '';
        const chunkSize = 8192;
        for (let i = 0; i < uint8.length; i += chunkSize) {
          const chunk = uint8.subarray(i, i + chunkSize);
          binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
        }
        const base64 = btoa(binary);
        const saved = Math.max(0, originalSizeBytes - compressedSizeBytes);
        const ratio = originalSizeBytes > 0 ? ((saved / originalSizeBytes) * 100).toFixed(1) : '0';

        return {
          isCompressed: true,
          compression: 'gzip',
          payload: base64,
          originalSizeBytes,
          compressedSizeBytes,
          compressionRatio: `${ratio}%`,
          savedBandwidthKb: (saved / 1024).toFixed(2),
        };
      } catch (err) {
        console.warn('[IndexedDB Sync] Native compression failed, using plain JSON:', err);
      }
    }

    return {
      isCompressed: false,
      payload: jsonStr,
      originalSizeBytes,
      compressedSizeBytes: originalSizeBytes,
      compressionRatio: '0%',
      savedBandwidthKb: '0.00',
    };
  }

  /**
   * Automatically synchronizes all pending offline items to the server in a single compressed batch HTTP request
   */
  async syncOfflineQueueToServer(): Promise<{
    syncedCount: number;
    failedCount: number;
    total: number;
    wasCompressed?: boolean;
    compressionRatio?: string;
    savedBandwidthKb?: string;
    batchId?: string;
  }> {
    const pending = await this.getPendingOfflineQueue();
    if (pending.length === 0) {
      return { syncedCount: 0, failedCount: 0, total: 0 };
    }

    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const batchEnvelope = {
      batchId,
      timestamp: new Date().toISOString(),
      clientVersion: '1.2.0',
      itemsCount: pending.length,
      items: pending,
    };

    let syncedCount = 0;
    let failedCount = 0;
    let wasCompressed = false;
    let compressionRatio = '0%';
    let savedBandwidthKb = '0.00';

    try {
      // 1. Compress the batch payload to reduce network latency and data consumption
      const compressionResult = await this.compressBatchPayload(batchEnvelope);
      wasCompressed = compressionResult.isCompressed;
      compressionRatio = compressionResult.compressionRatio;
      savedBandwidthKb = compressionResult.savedBandwidthKb;

      let requestBody: any;
      if (compressionResult.isCompressed) {
        requestBody = {
          isCompressed: true,
          compression: compressionResult.compression,
          batchId,
          originalSizeBytes: compressionResult.originalSizeBytes,
          compressedSizeBytes: compressionResult.compressedSizeBytes,
          payload: compressionResult.payload,
        };
      } else {
        requestBody = {
          isCompressed: false,
          batchId,
          items: pending,
        };
      }

      // 2. Transmit the single compressed batch HTTP request
      const response = await fetch('/api/sync/offline-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const result = await response.json();
        const confirmedIds: Set<number> = new Set(result.syncedIds || []);

        // 3. Mark items as synced in IndexedDB
        for (const item of pending) {
          if (item.id) {
            if (confirmedIds.size === 0 || confirmedIds.has(item.id)) {
              await this.updateQueueItemStatus(item.id, 'synced');
              syncedCount++;
            }
          }
        }

        // 4. Clean up old synced items to preserve storage
        await this.purgeSyncedQueueItems();
      } else {
        throw new Error(`Server responded with ${response.status}`);
      }
    } catch (err: any) {
      console.warn('[IndexedDB Sync] Compressed batch sync failed, will retry later:', err);
      for (const item of pending) {
        if (item.id) {
          await this.updateQueueItemStatus(item.id, 'failed', err.message);
          failedCount++;
        }
      }
    }

    return {
      syncedCount,
      failedCount,
      total: pending.length,
      wasCompressed,
      compressionRatio,
      savedBandwidthKb,
      batchId,
    };
  }

  /**
   * Delete already synced items older than 24 hours
   */
  async purgeSyncedQueueItems(): Promise<void> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction(['offline_queue'], 'readwrite');
      const store = transaction.objectStore('offline_queue');
      const index = store.index('status');
      const request = index.getAll('synced');

      request.onsuccess = () => {
        const items = request.result || [];
        for (const item of items) {
          if (item.id) store.delete(item.id);
        }
      };
    } catch (err) {
      console.warn('Failed to purge synced queue items:', err);
    }
  }

  /**
   * Save a staged Device Transfer Package (sent or received via pairing code)
   */
  async saveDeviceTransfer(pkg: DeviceTransferPackage): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['device_transfers'], 'readwrite');
      const store = transaction.objectStore('device_transfers');
      const request = store.put(pkg);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get a Device Transfer Package by its 6-digit code from local IndexedDB
   */
  async getDeviceTransfer(transferCode: string): Promise<DeviceTransferPackage | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['device_transfers'], 'readonly');
      const store = transaction.objectStore('device_transfers');
      const request = store.get(transferCode.trim().toUpperCase());
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Calculate storage and record statistics
   */
  async getStorageStats(): Promise<StorageStats> {
    try {
      const [products, customers, sales, queue] = await Promise.all([
        this.getAll<Product>('products'),
        this.getAll<Customer>('customers'),
        this.getAll<Sale>('sales'),
        this.getPendingOfflineQueue(),
      ]);

      let usageBytes = 0;
      let quotaBytes = 0;
      let percentUsed = 0;

      if (navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        usageBytes = estimate.usage || 0;
        quotaBytes = estimate.quota || 0;
        percentUsed = quotaBytes > 0 ? Math.round((usageBytes / quotaBytes) * 100) : 0;
      }

      // If browser estimate API returns 0 or is constrained in sandbox iframe, approximate real IndexedDB size
      if (usageBytes <= 0) {
        const rawJson = JSON.stringify({ products, customers, sales, queue });
        usageBytes = Math.max(12800, rawJson.length * 2);
      }

      const meta = await this.getOne<any>('app_meta', 'last_cache_timestamp');

      return {
        productsCount: products.length,
        customersCount: customers.length,
        salesCount: sales.length,
        offlineQueueCount: queue.length,
        usageBytes,
        quotaBytes,
        percentUsed,
        lastSyncTime: meta?.value || null,
      };
    } catch (err) {
      return {
        productsCount: 0,
        customersCount: 0,
        salesCount: 0,
        offlineQueueCount: 0,
        usageBytes: 0,
        quotaBytes: 0,
        percentUsed: 0,
        lastSyncTime: null,
      };
    }
  }

  /**
   * Get all synced queue items
   */
  async getSyncedQueueItems(): Promise<OfflineQueueItem[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const transaction = db.transaction(['offline_queue'], 'readonly');
        const store = transaction.objectStore('offline_queue');
        const index = store.index('status');
        const request = index.getAll('synced');
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  }

  /**
   * Delete specific sales from IndexedDB by their ID
   */
  async deleteSalesByIds(ids: string[]): Promise<number> {
    if (!ids || ids.length === 0) return 0;
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['sales'], 'readwrite');
        const store = transaction.objectStore('sales');
        let count = 0;
        ids.forEach(id => {
          store.delete(id);
          count++;
        });
        transaction.oncomplete = () => resolve(count);
        transaction.onerror = () => reject(transaction.error);
      });
    } catch (err) {
      console.warn('Failed to delete sales from IndexedDB:', err);
      return 0;
    }
  }

  /**
   * Purge expired device transfer packages
   */
  async purgeExpiredTransfers(): Promise<number> {
    try {
      const db = await this.getDB();
      const all = await this.getAll<DeviceTransferPackage>('device_transfers');
      const now = Date.now();
      const expired = all.filter(t => new Date(t.expiresAt).getTime() < now);
      if (expired.length === 0) return 0;

      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['device_transfers'], 'readwrite');
        const store = transaction.objectStore('device_transfers');
        expired.forEach(t => store.delete(t.transferCode));
        transaction.oncomplete = () => resolve(expired.length);
        transaction.onerror = () => reject(transaction.error);
      });
    } catch (err) {
      console.warn('Failed to purge expired transfers:', err);
      return 0;
    }
  }

  /**
   * Purge all synced items from the offline mutation queue
   */
  async purgeSyncedQueue(): Promise<number> {
    try {
      const items = await this.getSyncedQueueItems();
      if (items.length === 0) return 0;
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['offline_queue'], 'readwrite');
        const store = transaction.objectStore('offline_queue');
        items.forEach(it => {
          if (it.id) store.delete(it.id);
        });
        transaction.oncomplete = () => resolve(items.length);
        transaction.onerror = () => reject(transaction.error);
      });
    } catch {
      return 0;
    }
  }

  /**
   * Generates a smart report on storage usage and candidates for safe cleaning
   */
  async getStoragePurgeReport(allSales: Sale[] = []): Promise<StoragePurgeCandidateReport> {
    const stats = await this.getStorageStats();

    // Check simulation mode flag (stored in localStorage for easy testing)
    let isSimulatedWarning = false;
    try {
      isSimulatedWarning = localStorage.getItem('kian_simulate_low_storage') === 'true';
    } catch {}

    const now = Date.now();
    const msInDay = 24 * 60 * 60 * 1000;
    const cutoff30 = now - 30 * msInDay;
    const cutoff60 = now - 60 * msInDay;
    const cutoff90 = now - 90 * msInDay;

    // Filter synced/completed sales by age
    const sales30: Sale[] = [];
    const sales60: Sale[] = [];
    const sales90: Sale[] = [];
    let totalSyncedCount = 0;
    let totalSyncedBytes = 0;

    for (const sale of allSales) {
      if (sale.status === 'completed' || sale.status === 'refunded') {
        const time = new Date(sale.createdAt).getTime();
        const saleSize = Math.max(380, JSON.stringify(sale).length * 2);
        totalSyncedCount++;
        totalSyncedBytes += saleSize;

        if (time < cutoff90) {
          sales90.push(sale);
          sales60.push(sale);
          sales30.push(sale);
        } else if (time < cutoff60) {
          sales60.push(sale);
          sales30.push(sale);
        } else if (time < cutoff30) {
          sales30.push(sale);
        }
      }
    }

    const bytes30 = sales30.reduce((acc, s) => acc + Math.max(380, JSON.stringify(s).length * 2), 0);
    const bytes60 = sales60.reduce((acc, s) => acc + Math.max(380, JSON.stringify(s).length * 2), 0);
    const bytes90 = sales90.reduce((acc, s) => acc + Math.max(380, JSON.stringify(s).length * 2), 0);

    // Get synced queue items
    const syncedQueueItems = await this.getSyncedQueueItems();
    const syncedQueueBytes = syncedQueueItems.reduce((acc, q) => acc + Math.max(250, JSON.stringify(q).length * 2), 0);

    // Get expired transfers
    let expiredTransfers: DeviceTransferPackage[] = [];
    try {
      const allTransfers = await this.getAll<DeviceTransferPackage>('device_transfers');
      expiredTransfers = allTransfers.filter(t => new Date(t.expiresAt).getTime() < now);
    } catch {}
    const expiredTransfersBytes = expiredTransfers.reduce((acc, t) => acc + Math.max(500, JSON.stringify(t).length * 2), 0);

    // Get old audit logs
    let oldLogsCount = 0;
    let oldLogsBytes = 0;
    try {
      const logsRaw = localStorage.getItem('kian_pos_audit_logs');
      if (logsRaw) {
        const logs = JSON.parse(logsRaw);
        if (Array.isArray(logs)) {
          const oldLogs = logs.filter((l: any) => new Date(l.timestamp || l.createdAt).getTime() < cutoff30);
          oldLogsCount = oldLogs.length;
          oldLogsBytes = Math.max(120, JSON.stringify(oldLogs).length * 2);
        }
      }
    } catch {}

    const freeBytes = Math.max(0, stats.quotaBytes - stats.usageBytes);
    let percentUsed = stats.percentUsed;
    let usageBytes = stats.usageBytes;

    if (isSimulatedWarning) {
      percentUsed = 86;
      usageBytes = stats.quotaBytes > 0 ? Math.round(stats.quotaBytes * 0.86) : 215000000;
    }

    const isCritical = percentUsed >= 90 || (freeBytes > 0 && freeBytes < 8 * 1024 * 1024);
    const isWarning = isSimulatedWarning || percentUsed >= 75 || (freeBytes > 0 && freeBytes < 30 * 1024 * 1024) || (sales30.length >= 25);

    const statusLevel: 'healthy' | 'warning' | 'critical' = isCritical ? 'critical' : isWarning ? 'warning' : 'healthy';
    const statusMessageAr = isCritical
      ? 'مساحة تخزين حرجة جداً! يلزم تنظيف البيانات القديمة فوراً لتفادي توقف حفظ الفواتير.'
      : isWarning
      ? 'تنبيه استباقي: المساحة التخزينية تقترب من حد الامتلاء. يُوصى بتنظيف السجلات القديمة المزامنة.'
      : 'حالة التخزين ممتازة ومستقرة. لا توجد مخاطر حالية لنفاد المساحة.';

    const totalCleanableBytes = bytes30 + syncedQueueBytes + expiredTransfersBytes + oldLogsBytes;

    return {
      usageBytes,
      quotaBytes: stats.quotaBytes,
      freeBytes,
      percentUsed,
      isWarning,
      isCritical,
      statusLevel,
      statusMessageAr,
      isSimulatedWarning,
      syncedSales: {
        totalCount: totalSyncedCount,
        totalBytes: totalSyncedBytes,
        olderThan30Days: { count: sales30.length, bytes: bytes30, sales: sales30 },
        olderThan60Days: { count: sales60.length, bytes: bytes60, sales: sales60 },
        olderThan90Days: { count: sales90.length, bytes: bytes90, sales: sales90 },
      },
      syncedQueue: {
        count: syncedQueueItems.length,
        bytes: syncedQueueBytes,
      },
      expiredTransfers: {
        count: expiredTransfers.length,
        bytes: expiredTransfersBytes,
        transfers: expiredTransfers,
      },
      oldAuditLogs: {
        count: oldLogsCount,
        bytes: oldLogsBytes,
      },
      totalCleanableBytes,
    };
  }

  /**
   * Execute selective data purge based on user choices
   */
  async executePurge(options: PurgeOptions, allSales: Sale[] = []): Promise<PurgeExecutionResult> {
    let deletedSalesCount = 0;
    const deletedSalesIds: string[] = [];
    let freedSalesBytes = 0;
    let deletedQueueCount = 0;
    let freedQueueBytes = 0;
    let deletedTransfersCount = 0;
    let freedTransfersBytes = 0;
    let deletedLogsCount = 0;
    let freedLogsBytes = 0;

    const now = Date.now();
    const msInDay = 24 * 60 * 60 * 1000;

    // 1. Purge sales older than specified days
    if (options.purgeSalesOlderThanDays && options.purgeSalesOlderThanDays > 0) {
      const cutoff = now - options.purgeSalesOlderThanDays * msInDay;
      const salesToPurge = allSales.filter(sale => {
        if (sale.status !== 'completed' && sale.status !== 'refunded') return false;
        const time = new Date(sale.createdAt).getTime();
        return time < cutoff;
      });

      if (salesToPurge.length > 0) {
        const ids = salesToPurge.map(s => s.id);
        deletedSalesCount = await this.deleteSalesByIds(ids);
        deletedSalesIds.push(...ids);
        freedSalesBytes = salesToPurge.reduce((acc, s) => acc + Math.max(380, JSON.stringify(s).length * 2), 0);
      }
    }

    // 2. Purge synced queue items
    if (options.purgeSyncedQueue) {
      const queueItems = await this.getSyncedQueueItems();
      freedQueueBytes = queueItems.reduce((acc, q) => acc + Math.max(250, JSON.stringify(q).length * 2), 0);
      deletedQueueCount = await this.purgeSyncedQueue();
    }

    // 3. Purge expired transfers
    if (options.purgeExpiredTransfers) {
      try {
        const allTransfers = await this.getAll<DeviceTransferPackage>('device_transfers');
        const expired = allTransfers.filter(t => new Date(t.expiresAt).getTime() < now);
        freedTransfersBytes = expired.reduce((acc, t) => acc + Math.max(500, JSON.stringify(t).length * 2), 0);
        deletedTransfersCount = await this.purgeExpiredTransfers();
      } catch (e) {
        console.warn('Error purging expired transfers:', e);
      }
    }

    // 4. Purge old audit logs
    if (options.purgeOldAuditLogs) {
      try {
        const logsRaw = localStorage.getItem('kian_pos_audit_logs');
        if (logsRaw) {
          const logs = JSON.parse(logsRaw);
          if (Array.isArray(logs)) {
            const cutoff30 = now - 30 * msInDay;
            const remainingLogs = logs.filter((l: any) => new Date(l.timestamp || l.createdAt).getTime() >= cutoff30);
            deletedLogsCount = logs.length - remainingLogs.length;
            freedLogsBytes = Math.max(120, (logs.length - remainingLogs.length) * 160);
            localStorage.setItem('kian_pos_audit_logs', JSON.stringify(remainingLogs));
          }
        }
      } catch (e) {
        console.warn('Error purging old logs:', e);
      }
    }

    // Clear simulation if it was active
    try {
      localStorage.removeItem('kian_simulate_low_storage');
    } catch {}

    const totalFreedBytes = freedSalesBytes + freedQueueBytes + freedTransfersBytes + freedLogsBytes;
    const parts: string[] = [];
    if (deletedSalesCount > 0) parts.push(`${deletedSalesCount} فاتورة قديمة`);
    if (deletedQueueCount > 0) parts.push(`${deletedQueueCount} معاملة أوفلاين متزامنة`);
    if (deletedTransfersCount > 0) parts.push(`${deletedTransfersCount} حزمة نقل منتهية`);
    if (deletedLogsCount > 0) parts.push(`${deletedLogsCount} سجل تدقيق قديم`);

    const summaryParts = parts.length > 0 ? parts.join('، و') : 'العناصر المحددة';
    const messageAr = `تم إتمام التنظيف بنجاح: تم حذف (${summaryParts}) وتوفير ما يقارب ${formatStorageSize(totalFreedBytes)} من المساحة التخزينية.`;

    return {
      deletedSalesCount,
      deletedSalesIds,
      deletedQueueCount,
      deletedTransfersCount,
      deletedLogsCount,
      freedBytes: totalFreedBytes,
      messageAr
    };
  }

  // --- Generic Helpers ---

  private async replaceStoreItems<T>(storeName: string, items: T[]): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      store.clear();

      items.forEach((item) => store.put(item));

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  private async bulkPut<T>(storeName: string, items: T[]): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);

      items.forEach((item) => store.put(item));

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  private async putOne<T>(storeName: string, item: T): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async getOne<T>(storeName: string, key: IDBValidKey): Promise<T | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  private async getAll<T>(storeName: string): Promise<T[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }
}

export const indexedDbService = new IndexedDbService();

export function formatStorageSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function downloadJsonBackup(
  data: any,
  fileNamePrefix: string = 'Kian_IndexedDB_Backup',
  exactFileName?: string
): string {
  try {
    const jsonStr = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
    const finalFileName = exactFileName || `${fileNamePrefix}_${dateStr}_${timeStr}.json`;
    a.download = finalFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return finalFileName;
  } catch (err) {
    console.error('Failed to export backup file:', err);
    return `${fileNamePrefix}.json`;
  }
}
