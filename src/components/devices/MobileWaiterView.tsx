import React, { useState, useMemo } from 'react';
import {
  Utensils,
  Search,
  Plus,
  Minus,
  Send,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  QrCode,
  ShoppingBag,
  X,
  Bell,
  Smartphone,
  ChefHat,
  Receipt,
  Check,
  CheckCheck,
  Flame,
  Droplets,
  HelpCircle,
  Layers,
  Phone,
  MapPin,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Product, KitchenOrderItem, TableServiceRequest } from '../../types';
import { soundEffects } from '../../services/audio';

type WaiterTab = 'new_order' | 'live_qr_and_calls' | 'tables_ready';

interface MobileWaiterViewProps {
  onBackToMain?: () => void;
}

export const MobileWaiterView: React.FC<MobileWaiterViewProps> = ({ onBackToMain }) => {
  const {
    products,
    categories,
    language,
    formatCurrency,
    addKitchenOrder,
    kitchenOrders,
    confirmKitchenOrder,
    updateKitchenItemStatus,
    updateKitchenOrderStatus,
    tableServiceRequests,
    acknowledgeTableServiceRequest,
    restaurantTables,
    getNextRestaurantQueueNumber,
    notify,
    currentSubDeviceUserName,
    currentUser,
    setIsCustomerMenuPreviewOpen,
  } = useApp();

  const isAr = language === 'ar';
  const waiterName = currentSubDeviceUserName || currentUser?.name || 'كابتن الصالة';

  const [activeWaiterTab, setActiveWaiterTab] = useState<WaiterTab>('new_order');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [tableNumber, setTableNumber] = useState('الطاولة 1');
  const [diningType, setDiningType] = useState<'dine_in' | 'takeaway' | 'delivery'>('dine_in');
  const [cartItems, setCartItems] = useState<{ product: Product; quantity: number; notes: string }[]>([]);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');

  const availableTables = useMemo(() => {
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

  // Live queues for the Waiter Device
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

  const readyToServeOrders = useMemo(
    () =>
      activeOrders.filter(
        o => o.status === 'ready' || o.items.some(it => it.status === 'ready')
      ),
    [activeOrders]
  );

  const urgentCount = unconfirmedQrOrders.length + pendingTableCalls.length + readyToServeOrders.length;

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCat = selectedCategory === 'all' || p.categoryId === selectedCategory;
      const matchesQuery =
        !searchQuery.trim() ||
        p.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.nameEn || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.barcode || '').includes(searchQuery);
      return matchesCat && matchesQuery;
    });
  }, [products, selectedCategory, searchQuery]);

  const handleAddToCart = (product: Product) => {
    soundEffects.playClick();
    setCartItems(prev => {
      const existing = prev.find(it => it.product.id === product.id);
      if (existing) {
        return prev.map(it =>
          it.product.id === product.id ? { ...it, quantity: it.quantity + 1 } : it
        );
      }
      return [...prev, { product, quantity: 1, notes: '' }];
    });
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    soundEffects.buttonClick();
    setCartItems(prev =>
      prev
        .map(it =>
          it.product.id === productId ? { ...it, quantity: it.quantity + delta } : it
        )
        .filter(it => it.quantity > 0)
    );
  };

  const handleUpdateItemNote = (productId: string, note: string) => {
    setCartItems(prev =>
      prev.map(it => (it.product.id === productId ? { ...it, notes: note } : it))
    );
  };

  const totalCartCount = cartItems.reduce((acc, it) => acc + it.quantity, 0);
  const totalCartAmount = cartItems.reduce(
    (acc, it) => acc + it.product.price * it.quantity,
    0
  );

  const handleSendOrder = () => {
    if (cartItems.length === 0) return;

    const orderItems: KitchenOrderItem[] = cartItems.map((it, idx) => ({
      id: `waiter-item-${Date.now()}-${idx}`,
      productId: it.product.id,
      nameAr: it.product.nameAr,
      nameEn: it.product.nameEn || it.product.nameAr,
      productName: isAr ? it.product.nameAr : it.product.nameEn,
      quantity: it.quantity,
      unitPrice: it.product.price,
      notes: it.notes.trim() || orderNotes.trim() || undefined,
      status: 'pending',
    }));

    const assignedQueueNumber = getNextRestaurantQueueNumber();
    const formattedQueue = String(assignedQueueNumber).padStart(3, '0');

    addKitchenOrder({
      orderNumber: `Q-${formattedQueue}`,
      queueNumber: assignedQueueNumber,
      sourceDevice: `جهاز النادل (${waiterName})`,
      tableName: diningType === 'dine_in' ? tableNumber : diningType === 'takeaway' ? 'طلب سفري' : 'طلب توصيل',
      diningType,
      routedToCashier: true,
      routedToWaiter: true,
      waiterConfirmed: true,
      waiterConfirmedBy: waiterName,
      waiterConfirmedAt: new Date().toISOString(),
      totalAmount: totalCartAmount,
      status: 'new',
      items: orderItems,
    });

    soundEffects.saleSuccess();
    notify(
      isAr ? 'تم إرسال الطلب للمطبخ والكاشير!' : 'Order Sent to Kitchen & Cashier!',
      isAr
        ? `تم إرسال ${totalCartCount} أصناف لـ (${tableNumber}) وإشعار الكاشير والمطبخ فوراً`
        : `Dispatched ${totalCartCount} items for ${tableNumber}`,
      'success'
    );

    setCartItems([]);
    setOrderNotes('');
    setIsCartDrawerOpen(false);
  };

  const getCallBadge = (type: TableServiceRequest['requestType']) => {
    switch (type) {
      case 'call_waiter':
        return { label: 'استدعاء الكابتن / النادل', icon: Bell, bg: 'bg-amber-500 text-slate-950' };
      case 'request_bill':
        return { label: 'طلب الفاتورة والحساب', icon: Receipt, bg: 'bg-rose-600 text-white' };
      case 'water_napkins':
        return { label: 'طلب مياه / مناديل', icon: Droplets, bg: 'bg-sky-500 text-white' };
      default:
        return { label: 'طلب مساعدة للطاولة', icon: HelpCircle, bg: 'bg-indigo-600 text-white' };
    }
  };

  return (
    <div
      className="flex flex-col h-screen h-[100dvh] max-h-screen bg-slate-50 dark:bg-slate-950 select-none overflow-hidden"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* Top Waiter Command Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950 text-white p-3.5 shadow-lg shrink-0 border-b border-amber-500/20">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-md shadow-amber-500/20">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-black">
                  {isAr ? 'جهاز النادل الذكي (Captain Pad)' : 'Smart Waiter Pad'}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  متصل بالكاشير والمطبخ
                </span>
              </div>
              <p className="text-[11px] text-amber-200/80">
                الكابتن: <strong>{waiterName}</strong> • يستقبل طلبات منيو الزبائن (QR) فورياً
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {onBackToMain && (
              <button
                type="button"
                onClick={onBackToMain}
                className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold cursor-pointer"
              >
                رجوع
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsCustomerMenuPreviewOpen(true)}
              className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-amber-300 border border-amber-400/30 text-[11px] font-black flex items-center gap-1.5 cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">منيو الزبائن QR</span>
            </button>
          </div>
        </div>

        {/* Navigation Switcher inside Waiter Device */}
        <div className="grid grid-cols-3 gap-1.5 mt-3">
          <button
            type="button"
            onClick={() => setActiveWaiterTab('new_order')}
            className={`py-2 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeWaiterTab === 'new_order'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-white/10 text-slate-200 hover:bg-white/15'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>تسجيل طلب طاولة</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveWaiterTab('live_qr_and_calls')}
            className={`py-2 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer relative ${
              activeWaiterTab === 'live_qr_and_calls'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : unconfirmedQrOrders.length + pendingTableCalls.length > 0
                ? 'bg-rose-600 text-white animate-pulse'
                : 'bg-white/10 text-slate-200 hover:bg-white/15'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>طلبات الزبائن والنداءات</span>
            {unconfirmedQrOrders.length + pendingTableCalls.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-slate-950 text-amber-400">
                {unconfirmedQrOrders.length + pendingTableCalls.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveWaiterTab('tables_ready')}
            className={`py-2 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeWaiterTab === 'tables_ready'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : readyToServeOrders.length > 0
                ? 'bg-emerald-600 text-white animate-pulse'
                : 'bg-white/10 text-slate-200 hover:bg-white/15'
            }`}
          >
            <ChefHat className="w-3.5 h-3.5" />
            <span>أطباق جاهزة للتقديم</span>
            {readyToServeOrders.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-white text-emerald-900">
                {readyToServeOrders.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Live Urgent Alert Strip inside Waiter View */}
      {(unconfirmedQrOrders.length > 0 || pendingTableCalls.length > 0) &&
        activeWaiterTab !== 'live_qr_and_calls' && (
          <div
            onClick={() => setActiveWaiterTab('live_qr_and_calls')}
            className="bg-gradient-to-r from-rose-600 to-amber-600 text-white px-3.5 py-2 flex items-center justify-between text-xs font-black cursor-pointer animate-pulse shrink-0"
          >
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 animate-bounce" />
              <span>
                لديك ({unconfirmedQrOrders.length}) طلب منيو زبون جديد و ({pendingTableCalls.length}) نداء طاولة بانتظارك!
              </span>
            </div>
            <span className="underline">افتح الآن ⬅</span>
          </div>
        )}

      {/* =========================================================
          WAITER TAB 1: NEW TABLE ORDER PAD
         ========================================================= */}
      {activeWaiterTab === 'new_order' && (
        <>
          {/* Table Selector & Dining Type */}
          <div className="p-2.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 space-y-2 shrink-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                {(
                  [
                    { id: 'dine_in', label: 'طاولة بالصالة' },
                    { id: 'takeaway', label: 'سفري' },
                    { id: 'delivery', label: 'توصيل' },
                  ] as const
                ).map(dt => (
                  <button
                    key={dt.id}
                    type="button"
                    onClick={() => setDiningType(dt.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                      diningType === dt.id
                        ? 'bg-amber-500 text-slate-950 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {dt.label}
                  </button>
                ))}
              </div>

              <div className="relative flex-1 max-w-xs">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={isAr ? 'بحث سريع عن صنف...' : 'Search item...'}
                  className="w-full pr-8 pl-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Horizontal Table Chips */}
            {diningType === 'dine_in' && (
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                {availableTables.map(tbl => (
                  <button
                    key={tbl}
                    type="button"
                    onClick={() => setTableNumber(tbl)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer border ${
                      tableNumber === tbl
                        ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 border-slate-900 dark:border-amber-500 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {tbl}
                  </button>
                ))}
              </div>
            )}

            {/* Category Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {isAr ? 'جميع الأصناف' : 'All'}
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {isAr ? cat.nameAr : cat.nameEn}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1 min-h-0 p-3 overflow-y-auto pb-32 overscroll-contain">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 pb-10">
              {filteredProducts.map(product => {
                const inCart = cartItems.find(it => it.product.id === product.id);
                return (
                  <div
                    key={product.id}
                    onClick={() => handleAddToCart(product)}
                    className={`bg-white dark:bg-slate-900 p-3 rounded-2xl border-2 flex flex-col justify-between transition-all cursor-pointer ${
                      inCart
                        ? 'border-amber-500 shadow-md shadow-amber-500/10'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div>
                      <h3 className="text-xs font-black text-slate-900 dark:text-white line-clamp-2">
                        {isAr ? product.nameAr : product.nameEn}
                      </h3>
                      <span className="text-xs font-black text-amber-600 dark:text-amber-400 mt-1 block">
                        {formatCurrency(product.price)}
                      </span>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                      {inCart ? (
                        <div
                          className="flex items-center justify-between bg-amber-500/15 p-1 rounded-xl"
                          onClick={e => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(product.id, -1)}
                            className="w-6 h-6 rounded-lg bg-amber-200 dark:bg-amber-800 text-slate-900 dark:text-white flex items-center justify-center font-bold text-xs"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-black text-amber-700 dark:text-amber-300">
                            {inCart.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(product.id, 1)}
                            className="w-6 h-6 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-xs"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="w-full py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{isAr ? 'إضافة للطلب' : 'Add'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* =========================================================
          WAITER TAB 2: LIVE CUSTOMER QR ORDERS & TABLE CALLS
         ========================================================= */}
      {activeWaiterTab === 'live_qr_and_calls' && (
        <div className="flex-1 overflow-y-auto p-3.5 space-y-4 pb-20">
          {/* Section A: Urgent Table Calls (استدعاء النادل / الفاتورة) */}
          <div className="space-y-2.5">
            <h2 className="text-xs font-black text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
              <Bell className="w-4 h-4" />
              <span>نداءات الطاولات المباشرة ({pendingTableCalls.length})</span>
            </h2>

            {pendingTableCalls.length === 0 ? (
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 text-center">
                لا توجد نداءات طاولات معلقة حالياً.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {pendingTableCalls.map(call => {
                  const badge = getCallBadge(call.requestType);
                  const Icon = badge.icon;
                  return (
                    <div
                      key={call.id}
                      className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-rose-500 shadow-md flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${badge.bg}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-sm font-black text-slate-900 dark:text-white block">
                            {call.tableName}
                          </span>
                          <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                            {badge.label}
                          </span>
                          {call.notes && (
                            <p className="text-[11px] text-slate-500 mt-0.5">{call.notes}</p>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => acknowledgeTableServiceRequest(call.id, 'completed')}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shrink-0 cursor-pointer"
                      >
                        تلبية النداء ✓
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section B: Incoming Customer QR Menu Orders */}
          <div className="space-y-2.5">
            <h2 className="text-xs font-black text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4" />
              <span>طلبات منيو الزبائن (QR) الواردة للنادل والكاشير ({activeOrders.length})</span>
            </h2>

            {activeOrders.length === 0 ? (
              <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-2">
                <Smartphone className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500">
                  لا توجد طلبات نشطة حالياً. أي طلب يرسله الزبون من الباركود سيظهر هنا فوراً.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeOrders.map(order => {
                  const isConfirmed = Boolean(order.waiterConfirmed);
                  const total =
                    order.totalAmount ||
                    order.items.reduce((s, it) => s + (it.unitPrice || 0) * it.quantity, 0);

                  return (
                    <div
                      key={order.id}
                      className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 space-y-3 ${
                        order.isCustomerQrOrder && !isConfirmed
                          ? 'border-amber-500 ring-2 ring-amber-500/20'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-xl bg-amber-500 text-slate-950 font-black font-mono text-xs shadow-2xs">
                            طابور #{String(order.queueNumber || Number((order.orderNumber.match(/\d+/) || [1])[0])).padStart(3, '0')}
                          </span>
                          <span className="px-2.5 py-1 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-black text-xs">
                            {order.tableName}
                          </span>
                          <span className="text-xs font-black text-slate-700 dark:text-slate-200 font-mono">
                            {order.orderNumber}
                          </span>
                          {order.isCustomerQrOrder && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-700 dark:text-amber-300">
                              طلب زبون QR
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(total)}
                        </span>
                      </div>

                      {/* Items */}
                      <div className="space-y-1.5 divide-y divide-slate-100 dark:divide-slate-800">
                        {order.items.map(item => (
                          <div
                            key={item.id}
                            className="pt-1.5 flex items-center justify-between text-xs"
                          >
                            <div>
                              <span className="font-black text-slate-800 dark:text-slate-200">
                                {item.quantity}× {item.nameAr || item.productName}
                              </span>
                              {item.notes && (
                                <p className="text-[11px] text-amber-600">ملاحظة: {item.notes}</p>
                              )}
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${
                                item.status === 'ready'
                                  ? 'bg-emerald-500 text-white'
                                  : item.status === 'served'
                                  ? 'bg-slate-200 text-slate-500'
                                  : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                              }`}
                            >
                              {item.status === 'ready'
                                ? 'جاهز للتقديم ✓'
                                : item.status === 'served'
                                ? 'تم التقديم'
                                : 'بالمطبخ'}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Waiter Action Buttons */}
                      <div className="pt-2 flex flex-wrap gap-2">
                        {!isConfirmed ? (
                          <button
                            type="button"
                            onClick={() => confirmKitchenOrder(order.id, waiterName)}
                            className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>تأكيد طلب الزبون وإشعار الكاشير والمطبخ</span>
                          </button>
                        ) : (
                          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCheck className="w-4 h-4" />
                            مؤكد بواسطة {order.waiterConfirmedBy || waiterName} • وصل للكاشير ✓
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => updateKitchenOrderStatus(order.id, 'completed')}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>تم التقديم للطاولة</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================
          WAITER TAB 3: READY DISHES FROM KITCHEN TO SERVE
         ========================================================= */}
      {activeWaiterTab === 'tables_ready' && (
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3 pb-20">
          <h2 className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <ChefHat className="w-4 h-4" />
            <span>أطباق جاهزة في المطبخ بانتظار التقديم للطاولات ({readyToServeOrders.length})</span>
          </h2>

          {readyToServeOrders.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-2">
              <ChefHat className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500">
                لا توجد أطباق جاهزة للتسليم حالياً. عند انتهاء الشيف من تحضير أي طبق سيظهر لك هنا فوراً.
              </p>
            </div>
          ) : (
            readyToServeOrders.map(order => (
              <div
                key={order.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-emerald-500 space-y-3 shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-xl bg-emerald-600 text-white font-black text-xs">
                    {order.tableName} • #{order.orderNumber}
                  </span>
                  <span className="text-xs font-black text-emerald-600">جاهز للاستلام من المطبخ</span>
                </div>

                <div className="space-y-1.5">
                  {order.items.map(item => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs"
                    >
                      <span className="font-bold">
                        {item.quantity}× {item.nameAr || item.productName}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateKitchenItemStatus(order.id, item.id, 'served')}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500 text-white font-black text-[11px] cursor-pointer"
                      >
                        تم تقديم الطبق ✓
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => updateKitchenOrderStatus(order.id, 'completed')}
                  className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-emerald-500 text-white dark:text-slate-950 font-black text-xs cursor-pointer"
                >
                  تأكيد تقديم كامل الطلب للطاولة ✓✓
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Floating Bottom Cart Bar (when on New Order tab) */}
      {totalCartCount > 0 && activeWaiterTab === 'new_order' && (
        <div className="fixed bottom-0 left-0 right-0 p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-2xl z-40 flex items-center justify-between gap-3">
          <div
            onClick={() => setIsCartDrawerOpen(true)}
            className="flex items-center gap-2.5 cursor-pointer"
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-600 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                {totalCartCount}
              </span>
            </div>
            <div>
              <p className="text-xs font-black text-slate-900 dark:text-white">{tableNumber}</p>
              <p className="text-xs font-black text-amber-600 dark:text-amber-400">
                {formatCurrency(totalCartAmount)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSendOrder}
            className="flex-1 max-w-xs py-2.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 active:scale-95 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-transform cursor-pointer"
          >
            <Send className="w-4 h-4 rtl:rotate-180" />
            <span>{isAr ? 'إرسال للكاشير والمطبخ' : 'Send to Cashier & Kitchen'}</span>
          </button>
        </div>
      )}

      {/* Cart Drawer Modal */}
      {isCartDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end">
          <div className="bg-white dark:bg-slate-900 rounded-t-3xl p-4 max-h-[85vh] flex flex-col border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-amber-500" />
                <span>
                  {isAr ? 'مراجعة طلب الطاولة' : 'Order Details'} ({tableNumber})
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCartDrawerOpen(false)}
                className="p-1 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 my-3 pe-1">
              {cartItems.map((item, idx) => (
                <div key={idx} className="py-2.5 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {isAr ? item.product.nameAr : item.product.nameEn}
                      </p>
                      <span className="text-[11px] text-slate-400">
                        {formatCurrency(item.product.price)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(item.product.id, -1)}
                        className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(item.product.id, 1)}
                        className="w-6 h-6 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-xs"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={item.notes}
                    onChange={e => handleUpdateItemNote(item.product.id, e.target.value)}
                    placeholder="ملاحظة خاصة بهذا الطبق (بدون بصل، سبايسي...)"
                    className="w-full px-2.5 py-1.5 text-[11px] bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                  />
                </div>
              ))}
            </div>

            <div className="mb-3">
              <input
                type="text"
                value={orderNotes}
                onChange={e => setOrderNotes(e.target.value)}
                placeholder={
                  isAr
                    ? 'ملاحظات عامة للطلب (تظهر للكاشير والمطبخ)...'
                    : 'General kitchen notes...'
                }
                className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <button
              type="button"
              onClick={handleSendOrder}
              className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-transform cursor-pointer"
            >
              <Send className="w-4 h-4 rtl:rotate-180" />
              <span>
                {isAr ? 'تأكيد وإرسال للكاشير والمطبخ' : 'Confirm Order'} (
                {formatCurrency(totalCartAmount)})
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
