import React, { useEffect, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { BottomNav } from './components/layout/BottomNav';
import { POSView } from './components/pos/POSView';
import { DashboardView } from './components/dashboard/DashboardView';
import { ProductsView } from './components/products/ProductsView';
import { TradeView } from './components/trade/TradeView';
import { InventoryView } from './components/inventory/InventoryView';
import { CustomersView } from './components/customers/CustomersView';
import { DebtView } from './components/debts/DebtView';
import { InvoicesView } from './components/invoices/InvoicesView';
import { ReturnsView } from './components/returns/ReturnsView';
import { ExpensesView } from './components/expenses/ExpensesView';
import { ReportsView } from './components/reports/ReportsView';
import { StaffView } from './components/staff/StaffView';
import { SettingsView } from './components/settings/SettingsView';
import { AboutView } from './components/about/AboutView';
import { AIAssistantView } from './components/ai/AIAssistantView';
import { DevicesHubView } from './components/devices/DevicesHubView';
import { DeviceStatusMonitorView } from './components/devices/DeviceStatusMonitorView';
import { DevicePairingModal } from './components/devices/DevicePairingModal';
import { KitchenDisplayView } from './components/devices/KitchenDisplayView';
import { CustomerFacingDisplayView } from './components/devices/CustomerFacingDisplayView';
import { MobileWaiterView } from './components/devices/MobileWaiterView';
import { MobileStockScannerView } from './components/devices/MobileStockScannerView';
import { DeviceDataTransferModal } from './components/devices/DeviceDataTransferModal';
import { ConnectToCashierModal } from './components/devices/ConnectToCashierModal';
import { DataUsageSummaryWidget } from './components/common/DataUsageSummaryWidget';
import { PinSwitchModal } from './components/modals/PinSwitchModal';
import { GlobalSearchModal } from './components/modals/GlobalSearchModal';
import { ModeSelectionModal } from './components/modals/ModeSelectionModal';
import { FirstTimeLoginModal } from './components/modals/FirstTimeLoginModal';
import { AppPurchaseModal } from './components/modals/AppPurchaseModal';
import { SubscriptionAlertToast } from './components/common/SubscriptionAlertToast';
import { ButtonLayoutModal } from './components/modals/ButtonLayoutModal';
import { StorageCleanupReportModal } from './components/modals/StorageCleanupReportModal';
import { StorageProactiveAlertToast } from './components/common/StorageProactiveAlertToast';
import { ShiftHandoverModal } from './components/modals/ShiftHandoverModal';
import { PromotionsModal } from './components/modals/PromotionsModal';
import { RestaurantQrMenuModal } from './components/modals/RestaurantQrMenuModal';
import { CustomerQrMenuPage } from './components/menu/CustomerQrMenuPage';
import { FloatingActionHub } from './components/common/FloatingActionHub';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { LongPressProvider } from './components/common/LongPressTooltip';
import { WifiOff, RefreshCw, ArrowLeftRight, Database, CheckCircle2, Leaf } from 'lucide-react';

const AppContent: React.FC = () => {
  const { 
    activeTab, 
    isPinModalOpen, 
    setIsPinModalOpen, 
    isSearchModalOpen, 
    setIsSearchModalOpen,
    isModeModalOpen,
    setIsModeModalOpen,
    dedicatedDeviceRole,
    setDedicatedDeviceRole,
    exitSubDeviceMode,
    isMasterDevice,
    currentDeviceAllowedPages,
    isFirstLoginCompleted,
    isFirstLoginModalOpen,
    isPurchaseModalOpen,
    setIsPurchaseModalOpen,
    isTrialExpired,
    isDataTransferModalOpen,
    setIsDataTransferModalOpen,
    isConnectToCashierModalOpen,
    setIsConnectToCashierModalOpen,
    isStorageCleanupModalOpen,
    setIsStorageCleanupModalOpen,
    openStorageCleanupModal,
    isShiftModalOpen,
    setIsShiftModalOpen,
    isPromotionsModalOpen,
    setIsPromotionsModalOpen,
    isRestaurantQrModalOpen,
    setIsRestaurantQrModalOpen,
    isCustomerMenuPreviewOpen,
    setIsCustomerMenuPreviewOpen,
    selectedTable,
    restaurantDiningType,
    businessMode,
    offlineQueueCount,
    isSyncingOffline,
    syncOfflineQueueNow,
    isOnline,
    isPowerSavingActive,
    isPowerSavingStandby,
    wakeFromStandby
  } = useApp();

  // If manager opened the Customer Menu Preview from POS (Restaurant Mode only)
  if (isCustomerMenuPreviewOpen && businessMode === 'restaurant') {
    return (
      <CustomerQrMenuPage
        isStandalone={false}
        initialTable={selectedTable}
        initialDiningType={restaurantDiningType}
        onClosePreview={() => setIsCustomerMenuPreviewOpen(false)}
      />
    );
  }

  // If this device was paired or selected as a dedicated terminal
  if (dedicatedDeviceRole === 'kitchen_display' && businessMode === 'restaurant') {
    return <KitchenDisplayView onBackToMain={exitSubDeviceMode} />;
  }
  if (dedicatedDeviceRole === 'customer_display') {
    return <CustomerFacingDisplayView onBackToMain={exitSubDeviceMode} />;
  }
  if (dedicatedDeviceRole === 'waiter_mobile' && businessMode === 'restaurant') {
    return <MobileWaiterView onBackToMain={exitSubDeviceMode} />;
  }
  if (dedicatedDeviceRole === 'stock_scanner' && (!currentDeviceAllowedPages || !currentDeviceAllowedPages.includes(activeTab))) {
    return <MobileStockScannerView onBackToMain={exitSubDeviceMode} />;
  }

  const renderActiveView = () => {
    const effectiveTab =
      !isMasterDevice &&
      currentDeviceAllowedPages &&
      currentDeviceAllowedPages.length > 0 &&
      !currentDeviceAllowedPages.includes(activeTab)
        ? currentDeviceAllowedPages[0]
        : activeTab;

    switch (effectiveTab) {
      case 'pos':
        return <POSView />;
      case 'dashboard':
        return <DashboardView />;
      case 'products':
        return <ProductsView />;
      case 'trade':
        return <TradeView />;
      case 'ai':
        return <AIAssistantView />;
      case 'inventory':
        return <InventoryView />;
      case 'customers':
        return <CustomersView />;
      case 'debts':
        return <DebtView />;
      case 'invoices':
        return <InvoicesView />;
      case 'returns':
        return <ReturnsView />;
      case 'expenses':
        return <ExpensesView />;
      case 'reports':
        return <ReportsView />;
      case 'staff':
        return <StaffView />;
      case 'devices':
        return <DevicesHubView />;
      case 'devices_status':
        return <DeviceStatusMonitorView />;
      case 'settings':
        return <SettingsView />;
      case 'about':
        return <AboutView />;
      default:
        return <POSView />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-transparent font-sans antialiased text-slate-900 dark:text-slate-100 select-none">
      {/* Sidebar for Desktop / Tablet */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="app-content-wrapper flex flex-col flex-1 h-full min-w-0 overflow-hidden">
        {/* Top App Header */}
        <Header />

        {/* Dynamic View Body */}
        <main className="app-main-viewport flex-1 flex overflow-hidden relative">
          {renderActiveView()}
        </main>

        {/* Bottom Navigation for Mobile */}
        <BottomNav />
      </div>

      {/* Global Modals */}
      <PinSwitchModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
      />

      <GlobalSearchModal />

      <ModeSelectionModal
        isOpen={isModeModalOpen}
        onClose={() => setIsModeModalOpen(false)}
      />

      <DeviceDataTransferModal
        isOpen={isDataTransferModalOpen}
        onClose={() => setIsDataTransferModalOpen(false)}
      />

      <ConnectToCashierModal
        isOpen={isConnectToCashierModalOpen}
        onClose={() => setIsConnectToCashierModalOpen(false)}
      />

      {activeTab !== 'devices' && activeTab !== 'devices_status' && <DevicePairingModal />}

      {/* First-Time Login Modal (Only when explicitly triggered) */}
      <FirstTimeLoginModal
        isOpen={!isFirstLoginCompleted || isFirstLoginModalOpen}
        onOpenPurchaseModal={() => setIsPurchaseModalOpen(true)}
      />

      {/* Proactive Low Storage Warning Toast & Smart Cleaner */}
      <StorageProactiveAlertToast onOpenCleanupModal={openStorageCleanupModal} />

      {/* Smart Storage Cleanup & Report Modal */}
      <StorageCleanupReportModal
        isOpen={isStorageCleanupModalOpen}
        onClose={() => setIsStorageCleanupModalOpen(false)}
      />

      {/* Cash Drawer Balancing & Shift Handover Modal */}
      <ShiftHandoverModal
        isOpen={isShiftModalOpen}
        onClose={() => setIsShiftModalOpen(false)}
      />

      {/* Smart Promotions & Dynamic Deals Modal */}
      <PromotionsModal
        isOpen={isPromotionsModalOpen}
        onClose={() => setIsPromotionsModalOpen(false)}
      />

      {/* Restaurant & Cafe Customer QR Menu & Product Device Routing Modal (Restaurant Mode Only) */}
      {businessMode === 'restaurant' && (
        <RestaurantQrMenuModal
          isOpen={isRestaurantQrModalOpen}
          onClose={() => setIsRestaurantQrModalOpen(false)}
        />
      )}

      {/* App Purchase Code Activation Modal */}
      <AppPurchaseModal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        forceRequired={isTrialExpired}
      />

      {/* Button Layout & UI Customizer Modal */}
      <ButtonLayoutModal />

      {/* Floating Offline Sync & Storage Status Banner */}
      {(!isOnline || offlineQueueCount > 0) && (
        <aside
          aria-label="حالة الاتصال والمزامنة"
          className="fixed bottom-32 md:bottom-5 start-2 sm:start-4 end-2 sm:end-auto z-40 flex flex-wrap items-center gap-2.5 py-2 px-3 rounded-2xl bg-slate-900/95 dark:bg-slate-800/95 text-white backdrop-blur-md shadow-2xl border border-slate-700/80 text-xs animate-in slide-in-from-bottom-3 duration-300 max-w-[calc(100vw-1rem)] sm:max-w-md"
        >
          <div className="flex items-center gap-2">
            {!isOnline ? (
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            ) : (
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            )}
            <div>
              <div className="font-bold flex items-center gap-1.5 leading-tight">
                {!isOnline ? (
                  <>
                    <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                    <span>وضع أوفلاين (IndexedDB)</span>
                  </>
                ) : (
                  <>
                    <Database className="w-3.5 h-3.5 text-emerald-400" />
                    <span>متصل — مزامنة مضغوطة</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Embedded Data-Usage Summary Widget */}
          <DataUsageSummaryWidget
            onOpenDataTransfer={() => setIsDataTransferModalOpen(true)}
            onOpenStorageCleanup={openStorageCleanupModal}
          />

          <div className="flex items-center gap-1.5 border-s border-slate-700 ps-2">
            {isOnline && (
              <button
                type="button"
                onClick={syncOfflineQueueNow}
                disabled={isSyncingOffline}
                data-longpress-title="مزامنة فورية"
                data-longpress-desc="رفع ومزامنة كافة العمليات المخزنة محلياً في IndexedDB إلى الخادم وقاعدة البيانات المركزية."
                className="flex items-center gap-1 py-1 px-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                title="مزامنة العمليات المعلقة الآن بحزمة مضغوطة"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingOffline ? 'animate-spin' : ''}`} />
                <span>{isSyncingOffline ? 'جارِ...' : 'مزامنة'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsDataTransferModalOpen(true)}
              data-longpress-title="نقل البيانات السريع"
              data-longpress-desc="تصدير ونقل بيانات المتجر والمخزون إلى هاتف أو جهاز كاشير آخر عبر رمز QR أو كود الربط."
              className="flex items-center gap-1 py-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
              title="نقل البيانات إلى جهاز آخر عبر كود الربط"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">نقل</span>
            </button>
          </div>
        </aside>
      )}

      {/* Power Saving Standby Screen Wake Overlay */}
      {isPowerSavingStandby && (
        <div
          role="button"
          tabIndex={0}
          onClick={wakeFromStandby}
          onKeyDown={wakeFromStandby}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px] flex flex-col items-center justify-center text-center p-6 cursor-pointer select-none animate-in fade-in duration-300"
        >
          <div className="bg-slate-900/95 text-white p-7 rounded-3xl border border-slate-700/80 shadow-2xl max-w-sm flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center animate-pulse">
              <Leaf className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold">وضع الاستعداد وتوفير الطاقة</h3>
              <p className="text-xs text-slate-300 mt-1">
                تم تعتيم الشاشة لحفظ طاقة البطارية أثناء عدم الاستخدام
              </p>
            </div>
            <div className="px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs mt-2 hover:bg-amber-400 transition-colors">
              المس الشاشة أو اضغط أي مفتاح للاستيقاظ
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function detectStandaloneCustomerQrRoute(): {
  isCustomerPage: boolean;
  table: string;
  type: 'dine_in' | 'takeaway' | 'delivery';
} {
  try {
    const params = new URLSearchParams(window.location.search);
    const pathname = (window.location.pathname || '').toLowerCase();
    const hash = (window.location.hash || '').toLowerCase();

    const isQueryMenu =
      params.get('customerMenu') === '1' ||
      params.get('qrMenu') === '1' ||
      params.get('menu') === '1';

    const isPathMenu =
      pathname === '/menu' ||
      pathname === '/qr-menu' ||
      pathname === '/customer-menu' ||
      pathname.endsWith('/menu');

    const isHashMenu =
      hash.startsWith('#menu') ||
      hash.startsWith('#/menu') ||
      hash.startsWith('#qr-menu') ||
      hash.startsWith('#/qr-menu') ||
      hash.startsWith('#customer-menu');

    // Also allow hash query params e.g. #/menu?table=...
    let hashTable = '';
    let hashType = '';
    if (hash.includes('?')) {
      const hashParams = new URLSearchParams(hash.slice(hash.indexOf('?')));
      hashTable = hashParams.get('table') || '';
      hashType = hashParams.get('type') || '';
    }

    const tbl = params.get('table') || hashTable || 'الطاولة 1';
    const rawType = params.get('type') || hashType || 'dine_in';
    const tp: 'dine_in' | 'takeaway' | 'delivery' =
      rawType === 'takeaway' || rawType === 'delivery' ? rawType : 'dine_in';

    return {
      isCustomerPage: isQueryMenu || isPathMenu || isHashMenu,
      table: tbl,
      type: tp,
    };
  } catch {
    return { isCustomerPage: false, table: 'الطاولة 1', type: 'dine_in' };
  }
}

export default function App() {
  const [customerRoute, setCustomerRoute] = useState(detectStandaloneCustomerQrRoute);

  useEffect(() => {
    const handleLocationChange = () => {
      setCustomerRoute(detectStandaloneCustomerQrRoute());
    };
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  // Completely isolated Standalone Customer QR Menu Page (no POS AppProvider, Sidebar, Header, or Modals)
  if (customerRoute.isCustomerPage) {
    return (
      <ErrorBoundary>
        <CustomerQrMenuPage
          isStandalone={true}
          initialTable={customerRoute.table}
          initialDiningType={customerRoute.type}
        />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <AppProvider>
        <LongPressProvider>
          <AppContent />
        </LongPressProvider>
      </AppProvider>
    </ErrorBoundary>
  );
}
