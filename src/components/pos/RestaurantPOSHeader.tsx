import React, { useState, useMemo } from 'react';
import {
  Utensils,
  ShoppingBag,
  Truck,
  Users,
  CheckCircle2,
  ChefHat,
  QrCode,
  Bell,
  Smartphone,
  Receipt,
  Layers,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { KitchenOrder } from '../../types';
import { soundEffects } from '../../services/audio';

interface RestaurantPOSHeaderProps {
  onOpenKitchenTicket?: () => void;
  onOpenGuestKeypad?: () => void;
}

export const RestaurantPOSHeader: React.FC<RestaurantPOSHeaderProps> = ({
  onOpenKitchenTicket,
  onOpenGuestKeypad,
}) => {
  const {
    language,
    formatCurrency,
    products,
    cart,
    addToCart,
    clearCart,
    selectedTable,
    setSelectedTable,
    restaurantDiningType: diningType,
    setRestaurantDiningType: setDiningType,
    guestCount: guestsCount,
    kitchenOrders,
    confirmKitchenOrder,
    tableServiceRequests,
    acknowledgeTableServiceRequest,
    restaurantTables,
    setActiveTab,
    setIsCustomerMenuPreviewOpen,
    nextRestaurantQueueNumber,
    loadKitchenOrderToCart,
    notify,
  } = useApp();

  const isAr = language === 'ar';
  const [isLiveInboxOpen, setIsLiveInboxOpen] = useState(false);
  const cartLength = cart.reduce((acc, it) => acc + it.quantity, 0);

  const tables = useMemo(() => {
    if (restaurantTables && restaurantTables.length > 0) {
      return restaurantTables.map(t => t.name);
    }
    return [
      'الطاولة 1',
      'الطاولة 2',
      'الطاولة 3',
      'الطاولة 4',
      'الطاولة 5',
      'الطاولة 6',
      'الطاولة 7',
      'الطاولة 8',
      'VIP 1 (رئيسي)',
      'VIP 2 (عائلي)',
      'تراس خارجي 1',
      'تراس خارجي 2',
    ];
  }, [restaurantTables]);

  const activeOrders = useMemo(
    () => kitchenOrders.filter(o => o.status !== 'completed' && o.status !== 'cancelled'),
    [kitchenOrders]
  );

  const unconfirmedQrOrders = useMemo(
    () => activeOrders.filter(o => o.isCustomerQrOrder && !o.waiterConfirmed),
    [activeOrders]
  );

  const pendingTableCalls = useMemo(
    () => tableServiceRequests.filter(r => r.status !== 'completed'),
    [tableServiceRequests]
  );

  const occupiedTablesSet = useMemo(() => {
    const set = new Set<string>();
    activeOrders.forEach(o => {
      if (o.tableName) set.add(o.tableName.trim());
    });
    return set;
  }, [activeOrders]);

  const handleLoadOrderToCashier = (order: KitchenOrder) => {
    loadKitchenOrderToCart(order);
    setIsLiveInboxOpen(false);
  };

  return (
    <div className="bg-gradient-to-l from-amber-500/10 via-orange-500/5 to-transparent dark:from-amber-950/40 dark:via-slate-900/60 border border-amber-200/80 dark:border-amber-800/50 rounded-2xl p-3 mb-2 shadow-xs space-y-2.5">
      {/* Row 1: Service Type & Live Cashier/Waiter Inbox & Quick Hub Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-sm shadow-amber-500/20">
            <Utensils className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>{isAr ? 'نقطة بيع المطعم والصالة' : 'Restaurant POS'}</span>
              <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
                {diningType === 'dine_in'
                  ? selectedTable
                  : diningType === 'takeaway'
                  ? isAr
                    ? 'سفري'
                    : 'Takeaway'
                  : isAr
                  ? 'توصيل'
                  : 'Delivery'}
              </span>
              <span
                onClick={() => setActiveTab('restaurant')}
                title="رقم الطابور التسلسلي للفاتورة القادمة في قسم المطعم"
                className="px-2.5 py-0.5 text-[10px] font-black font-mono rounded-full bg-slate-900 dark:bg-amber-500 text-amber-400 dark:text-slate-950 cursor-pointer flex items-center gap-1"
              >
                <span>رقم الطابور القادم:</span>
                <span>#{String(nextRestaurantQueueNumber).padStart(3, '0')}</span>
              </span>
              {diningType === 'dine_in' && onOpenGuestKeypad && (
                <button
                  type="button"
                  onClick={onOpenGuestKeypad}
                  className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1 cursor-pointer"
                >
                  <Users className="w-3 h-3" />
                  <span>{guestsCount} ضيوف</span>
                </button>
              )}
            </h3>
          </div>
        </div>

        {/* Dining Type Switcher */}
        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setDiningType('dine_in')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              diningType === 'dine_in'
                ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>{isAr ? 'محلي (طاولة)' : 'Dine-In'}</span>
          </button>

          <button
            type="button"
            onClick={() => setDiningType('takeaway')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              diningType === 'takeaway'
                ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{isAr ? 'سفري' : 'Takeaway'}</span>
          </button>

          <button
            type="button"
            onClick={() => setDiningType('delivery')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              diningType === 'delivery'
                ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>{isAr ? 'توصيل' : 'Delivery'}</span>
          </button>
        </div>

        {/* Live QR Orders & Table Calls Button + Restaurant Hub Button */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsLiveInboxOpen(!isLiveInboxOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer border ${
              unconfirmedQrOrders.length + pendingTableCalls.length > 0
                ? 'bg-rose-600 text-white border-rose-500 animate-pulse shadow-md shadow-rose-500/20'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-amber-500'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>طلبات الزبائن والنداءات</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-950 text-amber-400">
              {activeOrders.length + pendingTableCalls.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('restaurant')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 text-xs font-black shadow-xs transition-all cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>خريطة الصالة والمطعم</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCustomerMenuPreviewOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isAr ? 'منيو الزبائن QR' : 'QR Menu'}</span>
          </button>

          {cartLength > 0 && onOpenKitchenTicket && (
            <button
              type="button"
              onClick={onOpenKitchenTicket}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-black shadow-sm transition-all cursor-pointer"
            >
              <ChefHat className="w-3.5 h-3.5" />
              <span>{isAr ? 'إرسال للمطبخ والنادل' : 'Send to Kitchen'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Expandable Cashier Inbox for Customer QR Orders & Table Calls */}
      {isLiveInboxOpen && (
        <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border-2 border-amber-500/60 space-y-3 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-500" />
              <span>صندوق طلبات الزبائن (QR) ونداءات الطاولات المباشر في الكاشير</span>
            </h4>
            <button
              type="button"
              onClick={() => setIsLiveInboxOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {pendingTableCalls.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {pendingTableCalls.map(call => (
                <div
                  key={call.id}
                  className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 flex items-center gap-2 text-xs"
                >
                  <Bell className="w-3.5 h-3.5 text-rose-600 animate-bounce" />
                  <span className="font-black text-rose-900 dark:text-rose-200">
                    {call.tableName}:{' '}
                    {call.requestType === 'request_bill'
                      ? 'طلب الفاتورة والحساب'
                      : call.requestType === 'call_waiter'
                      ? 'استدعاء النادل'
                      : 'طلب مياه/خدمة'}
                  </span>
                  <button
                    type="button"
                    onClick={() => acknowledgeTableServiceRequest(call.id, 'completed')}
                    className="px-2 py-0.5 rounded-lg bg-rose-600 text-white text-[10px] font-black cursor-pointer"
                  >
                    تمت التلبية ✓
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeOrders.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-3">
              لا توجد طلبات طاولات أو طلبات QR جارية حالياً.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto">
              {activeOrders.map(ord => {
                const total =
                  ord.totalAmount ||
                  ord.items.reduce((s, it) => s + (it.unitPrice || 0) * it.quantity, 0);
                return (
                  <div
                    key={ord.id}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        {ord.queueNumber && (
                          <span className="px-1.5 py-0.5 rounded-md bg-slate-900 dark:bg-amber-500 text-amber-400 dark:text-slate-950 font-mono font-black text-[10px]">
                            طابور #{String(ord.queueNumber).padStart(3, '0')}
                          </span>
                        )}
                        <span className="text-xs font-black text-slate-900 dark:text-white">
                          {ord.tableName} (#{ord.orderNumber})
                        </span>
                        {ord.isCustomerQrOrder && (
                          <span className="px-1.5 py-0.2 rounded-md text-[10px] font-black bg-amber-500/20 text-amber-700 dark:text-amber-300">
                            منيو الزبون QR
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate max-w-xs">
                        {ord.items
                          .map(i => `${i.quantity}× ${i.nameAr || i.productName}`)
                          .join(' ، ')}
                      </p>
                      <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(total)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {ord.isCustomerQrOrder && !ord.waiterConfirmed && (
                        <button
                          type="button"
                          onClick={() => confirmKitchenOrder(ord.id, 'الكاشير')}
                          className="px-2.5 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-black text-[11px] cursor-pointer"
                        >
                          تأكيد ✓
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleLoadOrderToCashier(ord)}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        <Receipt className="w-3 h-3" />
                        <span>سحب للفاتورة</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Row 2: Quick Table Selector Strip (for Dine-in) */}
      {diningType === 'dine_in' && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {tables.map(table => {
            const isSelected = selectedTable === table;
            const isOccupied = occupiedTablesSet.has(table.trim());
            return (
              <button
                key={table}
                type="button"
                onClick={() => setSelectedTable(table)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer border ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 font-black border-amber-500 shadow-xs'
                    : isOccupied
                    ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-400/50'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-amber-400'
                }`}
              >
                {isSelected ? (
                  <CheckCircle2 className="w-3 h-3" />
                ) : isOccupied ? (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                ) : null}
                <span>{table}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
