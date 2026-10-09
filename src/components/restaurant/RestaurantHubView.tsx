import React, { useState, useMemo } from 'react';
import {
  Utensils,
  UtensilsCrossed,
  QrCode,
  ChefHat,
  Bell,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
  Sparkles,
  ArrowRightLeft,
  Receipt,
  Flame,
  Coffee,
  ShoppingBag,
  Truck,
  Star,
  Calendar,
  Phone,
  UserCheck,
  Volume2,
  Eye,
  Check,
  X,
  RefreshCw,
  Smartphone,
  Monitor,
  Layers,
  MapPin,
  DollarSign,
  TrendingUp,
  Award,
  MessageSquare,
  Printer,
  Play,
  CheckCheck,
  Droplets,
  HelpCircle,
  Hash,
  Maximize2,
  Minimize2,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { KitchenOrder, RestaurantTableInfo, TableServiceRequest, Sale } from '../../types';
import { soundEffects } from '../../services/audio';
import { PrintableReceiptModal } from '../pos/PrintableReceiptModal';

type RestaurantSubTab =
  | 'queue_invoices'
  | 'floor_plan'
  | 'live_qr_orders'
  | 'kitchen_kds'
  | 'reservations'
  | 'menu_studio'
  | 'reviews_analytics';

export const RestaurantHubView: React.FC = () => {
  const {
    language,
    formatCurrency,
    products,
    categories,
    sales,
    kitchenOrders,
    addKitchenOrder,
    updateKitchenItemStatus,
    confirmKitchenOrder,
    updateKitchenOrderStatus,
    transferKitchenOrderTable,
    restaurantTables,
    updateRestaurantTables,
    tableServiceRequests,
    submitTableServiceRequest,
    acknowledgeTableServiceRequest,
    customerReviews,
    devices,
    setActiveTab,
    setIsRestaurantQrModalOpen,
    setIsCustomerMenuPreviewOpen,
    addToCart,
    clearCart,
    notify,
    setSelectedTable,
    setRestaurantDiningType,
    setGuestCount,
    nextRestaurantQueueNumber,
    resetRestaurantQueueCounter,
    updateSaleQueueStatus,
    announceQueueNumber,
    loadKitchenOrderToCart,
  } = useApp();

  const isAr = language === 'ar';
  const [activeSubTab, setActiveSubTab] = useState<RestaurantSubTab>('queue_invoices');
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [queueSearchQuery, setQueueSearchQuery] = useState('');
  const [queueFilterStatus, setQueueFilterStatus] = useState<'all' | 'preparing' | 'ready' | 'served'>('all');
  const [queueDateFilter, setQueueDateFilter] = useState<'today' | 'all'>('today');
  const [studioMenuCategory, setStudioMenuCategory] = useState<string>('all');
  const [studioMenuSearch, setStudioMenuSearch] = useState<string>('');
  const [isTvQueueFullscreen, setIsTvQueueFullscreen] = useState(false);
  const [lastCalledQueueNum, setLastCalledQueueNum] = useState<number | null>(null);
  const [printingReceiptSale, setPrintingReceiptSale] = useState<Sale | null>(null);
  const [transferSourceOrderId, setTransferSourceOrderId] = useState<string | null>(null);
  const [transferTargetTable, setTransferTargetTable] = useState<string>('');

  // New Table Modal State
  const [isAddTableModalOpen, setIsAddTableModalOpen] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [newTableZone, setNewTableZone] = useState('الصالة الرئيسية');
  const [newTableCapacity, setNewTableCapacity] = useState(4);
  const [newTableWaiter, setNewTableWaiter] = useState('أحمد النادل');

  // New Reservation Modal State
  const [isAddReservationOpen, setIsAddReservationOpen] = useState(false);
  const [resTableId, setResTableId] = useState('');
  const [resGuestName, setResGuestName] = useState('');
  const [resGuestPhone, setResGuestPhone] = useState('');
  const [resTime, setResTime] = useState('20:00');
  const [resGuestsCount, setResGuestsCount] = useState(4);
  const [resNotes, setResNotes] = useState('');

  // Synchronize table statuses dynamically with active kitchen orders & service requests
  const enrichedTables = useMemo(() => {
    return restaurantTables.map(tbl => {
      const activeOrdersForTable = kitchenOrders.filter(
        o =>
          o.status !== 'completed' &&
          o.status !== 'cancelled' &&
          o.tableName &&
          (o.tableName.trim() === tbl.name.trim() ||
            o.tableName.includes(tbl.name) ||
            tbl.name.includes(o.tableName))
      );

      const pendingCalls = tableServiceRequests.filter(
        r =>
          r.status !== 'completed' &&
          (r.tableName.trim() === tbl.name.trim() || r.tableName.includes(tbl.name))
      );

      const hasBillRequest = pendingCalls.some(r => r.requestType === 'request_bill');
      const totalRunningAmount = activeOrdersForTable.reduce(
        (sum, ord) =>
          sum +
          (ord.totalAmount ||
            ord.items.reduce((s, it) => s + (it.unitPrice || 0) * it.quantity, 0)),
        0
      );

      const readyItemsCount = activeOrdersForTable.reduce(
        (sum, ord) => sum + ord.items.filter(i => i.status === 'ready').length,
        0
      );

      const unconfirmedQrCount = activeOrdersForTable.filter(
        o => o.isCustomerQrOrder && !o.waiterConfirmed
      ).length;

      let effectiveStatus = tbl.status;
      if (hasBillRequest) {
        effectiveStatus = 'bill_requested';
      } else if (activeOrdersForTable.length > 0 && tbl.status === 'available') {
        effectiveStatus = 'occupied';
      }

      return {
        ...tbl,
        effectiveStatus,
        activeOrders: activeOrdersForTable,
        pendingCalls,
        totalRunningAmount,
        readyItemsCount,
        unconfirmedQrCount,
      };
    });
  }, [restaurantTables, kitchenOrders, tableServiceRequests]);

  const zones = useMemo(() => {
    const set = new Set<string>();
    restaurantTables.forEach(t => set.add(t.zone));
    return ['all', ...Array.from(set)];
  }, [restaurantTables]);

  const filteredTables = useMemo(() => {
    return enrichedTables.filter(t => {
      if (selectedZone !== 'all' && t.zone !== selectedZone) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          t.name.toLowerCase().includes(q) ||
          t.zone.toLowerCase().includes(q) ||
          (t.waiterName || '').toLowerCase().includes(q) ||
          (t.reservedBy || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [enrichedTables, selectedZone, searchQuery]);

  const selectedTable = useMemo(
    () => enrichedTables.find(t => t.id === selectedTableId) || null,
    [enrichedTables, selectedTableId]
  );

  // Helper for local calendar date key (YYYY-MM-DD) so queue numbers reset to #001 daily
  const getLocalDayKey = (isoOrDate?: string | Date): string => {
    const d = isoOrDate ? new Date(isoOrDate) : new Date();
    if (Number.isNaN(d.getTime())) {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const todayDateKey = getLocalDayKey();

  // Numbered Restaurant Invoices for Queue Management (الفواتير المرقمة للطابور - يبدأ من #001 يومياً)
  const numberedRestaurantInvoices = useMemo(() => {
    // Filter restaurant invoices or fallback to all completed sales so every invoice in restaurant section is numbered
    const restaurantSales = sales.filter(
      s =>
        s.businessMode === 'restaurant' ||
        Boolean(s.queueNumber) ||
        Boolean(s.tableName) ||
        Boolean(s.diningType) ||
        (s.invoiceNumber || '').startsWith('Q-')
    );
    const sourceList = restaurantSales.length > 0 ? restaurantSales : sales;

    // Sort oldest-to-newest first to assign deterministic daily sequential queue numbers starting from 1 each day
    const chronological = [...sourceList].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const dailyCountersMap = new Map<string, number>();

    const withQueueNumbers = chronological.map(sale => {
      const saleDayKey = getLocalDayKey(sale.createdAt);
      const currentDayCounter = dailyCountersMap.get(saleDayKey) || 1;
      const extractedFromInv = Number((sale.invoiceNumber?.match(/Q-(\d+)/) || [])[1]);
      const qNum = sale.queueNumber || extractedFromInv || currentDayCounter;

      if (qNum >= currentDayCounter) {
        dailyCountersMap.set(saleDayKey, qNum + 1);
      } else {
        dailyCountersMap.set(saleDayKey, currentDayCounter + 1);
      }

      const qPadded = String(qNum).padStart(3, '0');
      const formattedInvoiceNum = (sale.invoiceNumber || '').startsWith('Q-')
        ? sale.invoiceNumber
        : `Q-${qPadded}-${sale.invoiceNumber}`;

      // Match with any linked KitchenOrder to sync live status
      const linkedKo = kitchenOrders.find(
        ko =>
          ko.id === sale.kitchenOrderId ||
          ko.saleId === sale.id ||
          (ko.queueNumber === qNum && getLocalDayKey(ko.createdAt) === saleDayKey) ||
          ko.invoiceNumber === sale.invoiceNumber
      );

      let resolvedQueueStatus: 'waiting' | 'preparing' | 'ready' | 'served' =
        sale.queueStatus || 'preparing';
      if (linkedKo) {
        if (linkedKo.status === 'ready') resolvedQueueStatus = 'ready';
        else if (linkedKo.status === 'completed') resolvedQueueStatus = 'served';
        else if (linkedKo.status === 'in_progress' || linkedKo.status === 'new')
          resolvedQueueStatus = sale.queueStatus || 'preparing';
      }

      return {
        ...sale,
        saleDayKey,
        isTodayInvoice: saleDayKey === todayDateKey,
        queueNumber: qNum,
        formattedQueueNumber: qPadded,
        displayInvoiceNumber: formattedInvoiceNum,
        resolvedQueueStatus,
        linkedKitchenOrder: linkedKo,
      };
    });

    // Return newest invoices first, prioritizing today's queue numbers
    return withQueueNumbers.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [sales, kitchenOrders, todayDateKey]);

  // Filtered Numbered Invoices for search, daily scope & status filter
  const filteredNumberedInvoices = useMemo(() => {
    const hasTodayInvoices = numberedRestaurantInvoices.some(inv => inv.isTodayInvoice);
    return numberedRestaurantInvoices.filter(inv => {
      if (queueDateFilter === 'today' && hasTodayInvoices && !inv.isTodayInvoice) {
        return false;
      }
      if (queueFilterStatus !== 'all' && inv.resolvedQueueStatus !== queueFilterStatus) {
        return false;
      }
      const q = queueSearchQuery.trim().toLowerCase();
      if (!q) return true;
      return (
        inv.formattedQueueNumber.includes(q) ||
        String(inv.queueNumber).includes(q) ||
        inv.displayInvoiceNumber.toLowerCase().includes(q) ||
        inv.invoiceNumber.toLowerCase().includes(q) ||
        (inv.tableName || '').toLowerCase().includes(q) ||
        (inv.customerName || '').toLowerCase().includes(q)
      );
    });
  }, [numberedRestaurantInvoices, queueDateFilter, queueFilterStatus, queueSearchQuery]);

  // Filtered products for the Menu Studio tab inside Restaurant Hub
  const filteredStudioMenuProducts = useMemo(() => {
    return products.filter(p => {
      if (studioMenuCategory !== 'all' && p.categoryId !== studioMenuCategory) {
        return false;
      }
      if (studioMenuSearch.trim()) {
        const q = studioMenuSearch.trim().toLowerCase();
        return (
          p.nameAr.toLowerCase().includes(q) ||
          (p.nameEn || '').toLowerCase().includes(q) ||
          (p.barcode || '').toLowerCase().includes(q) ||
          (p.sku || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [products, studioMenuCategory, studioMenuSearch]);

  // Unified Live Queue Tickets (Combines active Kitchen Orders & Numbered Invoices for the Customer Queue Board)
  const liveQueueBoard = useMemo(() => {
    const map = new Map<
      number,
      {
        queueNumber: number;
        formattedQueue: string;
        invoiceNumber: string;
        tableName: string;
        diningType: 'dine_in' | 'takeaway' | 'delivery';
        customerName?: string;
        totalAmount: number;
        itemsCount: number;
        itemsSummary: string;
        status: 'preparing' | 'ready' | 'served';
        createdAt: string;
        saleObj?: Sale;
        kitchenOrderObj?: KitchenOrder;
      }
    >();

    // 1. Add numbered invoices
    numberedRestaurantInvoices.forEach(inv => {
      const qNum = inv.queueNumber || 1;
      map.set(qNum, {
        queueNumber: qNum,
        formattedQueue: inv.formattedQueueNumber,
        invoiceNumber: inv.displayInvoiceNumber,
        tableName:
          inv.tableName ||
          (inv.diningType === 'takeaway'
            ? 'طلب سفري'
            : inv.diningType === 'delivery'
            ? 'طلب توصيل'
            : 'صالة المطعم'),
        diningType: inv.diningType || 'dine_in',
        customerName: inv.customerName,
        totalAmount: inv.total,
        itemsCount: inv.items.reduce((s, i) => s + i.quantity, 0),
        itemsSummary: inv.items
          .slice(0, 3)
          .map(i => `${i.quantity}× ${i.productName}`)
          .join(' ، '),
        status:
          inv.resolvedQueueStatus === 'ready'
            ? 'ready'
            : inv.resolvedQueueStatus === 'served'
            ? 'served'
            : 'preparing',
        createdAt: inv.createdAt,
        saleObj: inv,
        kitchenOrderObj: inv.linkedKitchenOrder,
      });
    });

    // 2. Add active kitchen orders that may not yet have a finalized Sale invoice
    kitchenOrders
      .filter(o => o.status !== 'cancelled')
      .forEach((ko, idx) => {
        const extracted = Number((ko.orderNumber.match(/\d+/) || [])[0]);
        const qNum = ko.queueNumber || extracted || idx + 1;
        const existing = map.get(qNum);
        const koStatus: 'preparing' | 'ready' | 'served' =
          ko.status === 'ready'
            ? 'ready'
            : ko.status === 'completed'
            ? 'served'
            : 'preparing';

        if (!existing) {
          const qPad = String(qNum).padStart(3, '0');
          map.set(qNum, {
            queueNumber: qNum,
            formattedQueue: qPad,
            invoiceNumber: ko.invoiceNumber || `Q-${qPad}`,
            tableName: ko.tableName || 'طلب سفري',
            diningType: ko.diningType || 'dine_in',
            customerName: ko.customerName,
            totalAmount:
              ko.totalAmount ||
              ko.items.reduce((s, it) => s + (it.unitPrice || 0) * it.quantity, 0),
            itemsCount: ko.items.reduce((s, it) => s + it.quantity, 0),
            itemsSummary: ko.items
              .slice(0, 3)
              .map(i => `${i.quantity}× ${i.nameAr || i.productName}`)
              .join(' ، '),
            status: koStatus,
            createdAt: ko.createdAt,
            kitchenOrderObj: ko,
          });
        } else {
          // Sync status if kitchen order is ready or completed
          if (ko.status === 'ready' && existing.status !== 'served') {
            existing.status = 'ready';
          }
          existing.kitchenOrderObj = ko;
        }
      });

    const allTickets = Array.from(map.values()).sort((a, b) => a.queueNumber - b.queueNumber);
    return {
      all: allTickets,
      preparing: allTickets.filter(t => t.status === 'preparing'),
      ready: allTickets.filter(t => t.status === 'ready'),
      served: allTickets.filter(t => t.status === 'served'),
    };
  }, [numberedRestaurantInvoices, kitchenOrders]);

  const handleCallQueueNumber = (queueNumber: number, tableName?: string) => {
    setLastCalledQueueNum(queueNumber);
    announceQueueNumber(queueNumber, tableName);
  };

  // Live Restaurant Statistics
  const stats = useMemo(() => {
    const activeKitchenOrders = kitchenOrders.filter(
      o => o.status !== 'completed' && o.status !== 'cancelled'
    );
    const unconfirmedQrOrders = activeKitchenOrders.filter(
      o => o.isCustomerQrOrder && !o.waiterConfirmed
    );
    const readyOrdersCount = activeKitchenOrders.filter(
      o => o.status === 'ready' || o.items.some(i => i.status === 'ready')
    ).length;
    const pendingTableCalls = tableServiceRequests.filter(r => r.status !== 'completed');
    const occupiedTablesCount = enrichedTables.filter(
      t => t.effectiveStatus === 'occupied' || t.effectiveStatus === 'bill_requested'
    ).length;

    const todayStr = new Date().toISOString().slice(0, 10);
    const todaySales = sales.filter(
      s => (s.createdAt || '').startsWith(todayStr) && s.status === 'completed'
    );
    const todayRevenue = todaySales.reduce((acc, s) => acc + s.total, 0);

    const onlineWaiterDevices = devices.filter(
      d => (d.role === 'waiter_mobile' || d.role === 'secondary_pos') && d.isOnline
    ).length;

    return {
      activeKitchenOrdersCount: activeKitchenOrders.length,
      unconfirmedQrOrdersCount: unconfirmedQrOrders.length,
      readyOrdersCount,
      pendingTableCallsCount: pendingTableCalls.length,
      occupiedTablesCount,
      totalTablesCount: enrichedTables.length,
      todayRevenue,
      onlineWaiterDevices,
    };
  }, [kitchenOrders, tableServiceRequests, enrichedTables, sales, devices]);

  // Load order items directly into POS Cart for immediate Cashier checkout while preserving sequential Queue Number
  const handleLoadOrderToCashierPOS = (order: KitchenOrder) => {
    loadKitchenOrderToCart(order);
    soundEffects.playSuccess();
    const qFormatted = order.queueNumber ? `#${String(order.queueNumber).padStart(3, '0')}` : order.orderNumber;
    notify(
      'تم تحويل الطلب لشاشة الكاشير',
      `تم تحميل أصناف الطلب (${order.orderNumber} - طابور ${qFormatted}) للطاولة (${order.tableName}) لإتمام الدفع وإصدار الفاتورة المرقمة`,
      'success'
    );
    setActiveTab('pos');
  };

  // Start a new order on POS for a specific table
  const handleOpenTableInPOS = (table: RestaurantTableInfo) => {
    setSelectedTable(table.name);
    setRestaurantDiningType('dine_in');
    setGuestCount(table.capacity || 4);
    soundEffects.buttonClick();
    notify(
      `فتح كاشير ${table.name}`,
      `تم تحديد (${table.name}) في نقطة البيع لإضافة الأصناف`,
      'info'
    );
    setActiveTab('pos');
  };

  const handleSetTableStatus = (
    tableId: string,
    status: RestaurantTableInfo['status']
  ) => {
    const next = restaurantTables.map(t =>
      t.id === tableId
        ? {
            ...t,
            status,
            ...(status === 'available'
              ? {
                  reservedBy: undefined,
                  reservedPhone: undefined,
                  reservedTime: undefined,
                   occupiedSince: undefined,
                }
              : {}),
          }
        : t
    );
    updateRestaurantTables(next);
    soundEffects.buttonClick();
  };

  const handleAddTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableName.trim()) return;
    const newTbl: RestaurantTableInfo = {
      id: `tbl-${Date.now().toString(36)}`,
      name: newTableName.trim(),
      zone: newTableZone.trim() || 'الصالة الرئيسية',
      capacity: Number(newTableCapacity) || 4,
      status: 'available',
      waiterName: newTableWaiter.trim() || 'أحمد النادل',
    };
    updateRestaurantTables([...restaurantTables, newTbl]);
    setNewTableName('');
    setIsAddTableModalOpen(false);
    soundEffects.playSuccess();
    notify('تمت إضافة الطاولة', `تمت إضافة (${newTbl.name}) إلى ${newTbl.zone}`, 'success');
  };

  const handleAddReservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resTableId || !resGuestName.trim()) return;
    const next = restaurantTables.map(t =>
      t.id === resTableId
        ? {
            ...t,
            status: 'reserved' as const,
            reservedBy: resGuestName.trim(),
            reservedPhone: resGuestPhone.trim(),
            reservedTime: resTime,
            reservedGuests: Number(resGuestsCount) || 4,
            notes: resNotes.trim(),
          }
        : t
    );
    updateRestaurantTables(next);
    setIsAddReservationOpen(false);
    setResGuestName('');
    setResGuestPhone('');
    setResNotes('');
    soundEffects.playSuccess();
    notify('تم تثبيت الحجز بنجاح', `تم حجز الطاولة باسم (${resGuestName}) الساعة ${resTime}`, 'success');
  };

  const getStatusBadgeConfig = (status: RestaurantTableInfo['status']) => {
    switch (status) {
      case 'available':
        return {
          label: isAr ? 'متاحة (فارغة)' : 'Available',
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300',
          dot: 'bg-emerald-500',
          cardBorder: 'border-emerald-200/80 dark:border-emerald-900/50 hover:border-emerald-400',
        };
      case 'occupied':
        return {
          label: isAr ? 'مشغولة حالياً' : 'Occupied',
          bg: 'bg-amber-500/15 border-amber-500/40 text-amber-800 dark:text-amber-300',
          dot: 'bg-amber-500 animate-pulse',
          cardBorder: 'border-amber-400/80 dark:border-amber-600/60 shadow-amber-500/10 shadow-lg',
        };
      case 'bill_requested':
        return {
          label: isAr ? 'طلب الفاتورة / الحساب' : 'Bill Requested',
          bg: 'bg-rose-500/15 border-rose-500/40 text-rose-700 dark:text-rose-300',
          dot: 'bg-rose-500 animate-ping',
          cardBorder: 'border-rose-500 dark:border-rose-500 ring-2 ring-rose-500/20 shadow-rose-500/15 shadow-lg',
        };
      case 'reserved':
        return {
          label: isAr ? 'محجوزة مسبقاً' : 'Reserved',
          bg: 'bg-indigo-500/15 border-indigo-500/40 text-indigo-700 dark:text-indigo-300',
          dot: 'bg-indigo-500',
          cardBorder: 'border-indigo-300 dark:border-indigo-800',
        };
      case 'cleaning':
        return {
          label: isAr ? 'قيد التجهيز والتنظيف' : 'Cleaning',
          bg: 'bg-sky-500/15 border-sky-500/40 text-sky-700 dark:text-sky-300',
          dot: 'bg-sky-500',
          cardBorder: 'border-sky-300 dark:border-sky-800',
        };
    }
  };

  const getServiceRequestLabel = (type: TableServiceRequest['requestType']) => {
    switch (type) {
      case 'call_waiter':
        return { label: 'استدعاء النادل للطاولة', icon: Bell, color: 'text-amber-600 bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300' };
      case 'request_bill':
        return { label: 'طلب الفاتورة والحساب', icon: Receipt, color: 'text-rose-600 bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300' };
      case 'water_napkins':
        return { label: 'طلب مياه / مناديل إضافية', icon: Droplets, color: 'text-sky-600 bg-sky-100 dark:bg-sky-950/60 dark:text-sky-300' };
      default:
        return { label: 'مساعدة خاصة للطاولة', icon: HelpCircle, color: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300' };
    }
  };

  return (
    <div className="space-y-5 pb-12" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top Hero Command Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-slate-900 via-slate-900 to-amber-950 text-white p-5 sm:p-6 shadow-xl border border-amber-500/20">
        <div className="absolute -left-16 -top-16 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30 shrink-0">
              <UtensilsCrossed className="w-7 h-7 text-slate-950" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                  {isAr ? 'مركز عمليات المطعم والصالة الذكي' : 'Smart Restaurant & Dining Hub'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {isAr ? 'ربط مباشر: الزبون ⇄ النادل ⇄ الكاشير ⇄ المطبخ' : 'Live Sync Active'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl">
                {isAr
                  ? 'إدارة متكاملة لخريطة الطاولات، استقبال طلبات منيو الزبائن (QR) فورياً على الكاشير وجهاز النادل، متابعة شاشة المطبخ (KDS)، وتلبية نداءات الطاولات.'
                  : 'Complete restaurant management: interactive floor plan, instant customer QR orders to Cashier & Waiter, live KDS, and table calls.'}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Next Queue Number Live Badge */}
            <div
              onClick={() => setActiveSubTab('queue_invoices')}
              className="px-3.5 py-2 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 flex items-center gap-2 cursor-pointer transition-all"
              title="رقم فاتورة الطابور التسلسلي القادم"
            >
              <Hash className="w-4 h-4 text-amber-400" />
              <div className="text-right">
                <span className="text-[9px] font-bold text-amber-200/80 block leading-none">
                  {isAr ? 'رقم الطابور القادم' : 'Next Queue #'}
                </span>
                <span className="text-sm font-black font-mono text-white leading-tight">
                  #{String(nextRestaurantQueueNumber || 1).padStart(3, '0')}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsCustomerMenuPreviewOpen(true)}
              className="px-3.5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
            >
              <Smartphone className="w-4 h-4" />
              <span>{isAr ? 'معاينة منيو الزبائن التفاعلي' : 'Customer QR Menu'}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsRestaurantQrModalOpen(true)}
              className="px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white border border-white/15 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-amber-400" />
              <span>{isAr ? 'باركود الطاولات وتوجيه الأجهزة' : 'Table QR & Routing'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('pos')}
              className="px-3.5 py-2.5 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <Receipt className="w-4 h-4" />
              <span>{isAr ? 'شاشة كاشير المطعم' : 'Restaurant POS'}</span>
            </button>
          </div>
        </div>

        {/* Live KPI Strip */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-5 pt-4 border-t border-white/10">
          <div
            onClick={() => setActiveSubTab('floor_plan')}
            className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-3 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold">
              <span>{isAr ? 'إشغال الطاولات' : 'Table Occupancy'}</span>
              <Users className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-black text-white">{stats.occupiedTablesCount}</span>
              <span className="text-xs text-slate-400">/ {stats.totalTablesCount} طاولة</span>
            </div>
          </div>

          <div
            onClick={() => setActiveSubTab('live_qr_orders')}
            className={`rounded-2xl p-3 cursor-pointer transition-all border ${
              stats.unconfirmedQrOrdersCount > 0
                ? 'bg-amber-500/20 border-amber-400 animate-pulse'
                : 'bg-white/5 hover:bg-white/10 border-white/10'
            }`}
          >
            <div className="flex items-center justify-between text-amber-200 text-[11px] font-bold">
              <span>{isAr ? 'طلبات زبائن QR جديدة' : 'New QR Orders'}</span>
              <Smartphone className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-black text-white">{stats.unconfirmedQrOrdersCount}</span>
              <span className="text-[11px] text-amber-300 font-bold">
                {stats.unconfirmedQrOrdersCount > 0 ? 'بانتظار التأكيد!' : 'مؤكدة بالكامل'}
              </span>
            </div>
          </div>

          <div
            onClick={() => setActiveSubTab('live_qr_orders')}
            className={`rounded-2xl p-3 cursor-pointer transition-all border ${
              stats.pendingTableCallsCount > 0
                ? 'bg-rose-500/25 border-rose-400 animate-pulse'
                : 'bg-white/5 hover:bg-white/10 border-white/10'
            }`}
          >
            <div className="flex items-center justify-between text-rose-200 text-[11px] font-bold">
              <span>{isAr ? 'نداءات الطاولات' : 'Table Calls'}</span>
              <Bell className="w-4 h-4 text-rose-400" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-black text-white">{stats.pendingTableCallsCount}</span>
              <span className="text-[11px] text-rose-300 font-bold">
                {stats.pendingTableCallsCount > 0 ? 'نداء نشط الآن' : 'لا يوجد نداء'}
              </span>
            </div>
          </div>

          <div
            onClick={() => setActiveSubTab('kitchen_kds')}
            className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-3 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold">
              <span>{isAr ? 'قيد التحضير بالمطبخ' : 'In Kitchen'}</span>
              <Flame className="w-4 h-4 text-orange-400" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-black text-white">{stats.activeKitchenOrdersCount}</span>
              <span className="text-xs text-emerald-400 font-bold">
                ({stats.readyOrdersCount} جاهز للتقديم)
              </span>
            </div>
          </div>

          <div
            onClick={() => setActiveSubTab('reservations')}
            className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-3 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold">
              <span>{isAr ? 'الحجوزات المؤكدة' : 'Reservations'}</span>
              <Calendar className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-black text-white">
                {restaurantTables.filter(t => t.status === 'reserved').length}
              </span>
              <span className="text-xs text-slate-400">حجز اليوم</span>
            </div>
          </div>

          <div
            onClick={() => setActiveSubTab('reviews_analytics')}
            className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-3 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold">
              <span>{isAr ? 'مبيعات اليوم' : 'Today Sales'}</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-base sm:text-lg font-black text-emerald-400 truncate">
                {formatCurrency(stats.todayRevenue)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Urgent Alert Banner if there are unconfirmed Customer QR Orders or Table Calls */}
      {(stats.unconfirmedQrOrdersCount > 0 || stats.pendingTableCallsCount > 0) && (
        <div className="rounded-2xl bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-amber-500/15 border-2 border-amber-500/50 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 animate-bounce">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>تنبيه حي للكاشير وجهاز النادل!</span>
                {stats.unconfirmedQrOrdersCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] bg-amber-500 text-slate-950 font-black">
                    {stats.unconfirmedQrOrdersCount} طلب منيو زبون جديد
                  </span>
                )}
                {stats.pendingTableCallsCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] bg-rose-600 text-white font-black">
                    {stats.pendingTableCallsCount} نداء طاولة
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                وصلت طلبات جديدة من منيو الزبائن (QR) إلى الكاشير وجهاز النادل في نفس اللحظة. يمكنك تأكيدها أو تحويلها للفوترة فوراً.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveSubTab('live_qr_orders')}
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 font-black text-xs shrink-0 hover:opacity-90 transition-opacity cursor-pointer"
          >
            عرض وتأكيد الطلبات الآن
          </button>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {[
          {
            id: 'queue_invoices',
            label: isAr ? 'الفواتير المرقمة وشاشة الطابور' : 'Numbered Queue Invoices',
            icon: Receipt,
            badge: String(numberedRestaurantInvoices.length),
            urgent: liveQueueBoard.ready.length > 0,
          },
          {
            id: 'floor_plan',
            label: isAr ? 'خريطة الصالة والطاولات' : 'Floor Plan & Tables',
            icon: Layers,
            badge: `${stats.occupiedTablesCount}/${stats.totalTablesCount}`,
          },
          {
            id: 'live_qr_orders',
            label: isAr ? 'طلبات الزبائن والنداءات (كاشير + نادل)' : 'Customer QR & Table Calls',
            icon: Smartphone,
            badge:
              stats.unconfirmedQrOrdersCount + stats.pendingTableCallsCount > 0
                ? String(stats.unconfirmedQrOrdersCount + stats.pendingTableCallsCount)
                : undefined,
            urgent: stats.unconfirmedQrOrdersCount + stats.pendingTableCallsCount > 0,
          },
          {
            id: 'kitchen_kds',
            label: isAr ? 'شاشة المطبخ والتحضير (KDS)' : 'Kitchen Display (KDS)',
            icon: ChefHat,
            badge: stats.activeKitchenOrdersCount > 0 ? String(stats.activeKitchenOrdersCount) : undefined,
          },
          {
            id: 'reservations',
            label: isAr ? 'الحجوزات وقائمة الانتظار' : 'Reservations',
            icon: Calendar,
          },
          {
            id: 'menu_studio',
            label: isAr ? 'منيو المطعم والمنتجات (QR)' : 'Restaurant Menu & QR',
            icon: QrCode,
            badge: String(products.length),
          },
          {
            id: 'reviews_analytics',
            label: isAr ? 'تقييمات الضيوف والتحليلات' : 'Reviews & Analytics',
            icon: Star,
            badge: customerReviews.length > 0 ? String(customerReviews.length) : undefined,
          },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                soundEffects.buttonClick();
                setActiveSubTab(tab.id as RestaurantSubTab);
              }}
              className={`px-4 py-2.5 rounded-2xl font-black text-xs flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer border ${
                isActive
                  ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-lg shadow-amber-500/20'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-amber-400'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                    tab.urgent
                      ? 'bg-rose-600 text-white animate-pulse'
                      : isActive
                      ? 'bg-slate-950 text-amber-400'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* =========================================================
          TAB 0: NUMBERED QUEUE INVOICES & LIVE CUSTOMER QUEUE BOARD
         ========================================================= */}
      {activeSubTab === 'queue_invoices' && (
        <div className="space-y-6">
          {/* Top Control Bar for Queue Numbering & Customer Queue Screen */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-slate-950 flex items-center justify-center font-black text-lg shadow-md shadow-amber-500/20 shrink-0">
                #{String(nextRestaurantQueueNumber || 1).padStart(3, '0')}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    {isAr
                      ? 'نظام الفواتير المرقمة وشاشة الطابور للمطعم'
                      : 'Numbered Restaurant Queue Invoices & Live Display'}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                    {isAr
                      ? 'يبدأ من رقم #001 تلقائياً كل يوم جديد'
                      : 'Resets to #001 Daily'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                    {isAr
                      ? `الفاتورة القادمة اليوم تحمل رقم الطابور #${String(nextRestaurantQueueNumber || 1).padStart(3, '0')}`
                      : `Next Queue Today #${String(nextRestaurantQueueNumber || 1).padStart(3, '0')}`}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {isAr
                    ? 'يبدأ عداد الفواتير المرقمة من الرقم 1 (#001) يومياً بشكل تلقائي مع بداية كل يوم، ويظهر رقم الطابور على الفاتورة المطبوعة وشاشة المطبخ وشاشة نداء الزبائن.'
                    : 'Every day starts fresh from queue number #001 automatically, printed on receipts and shown on the live queue board.'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  soundEffects.buttonClick();
                  setActiveTab('pos');
                }}
                className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-2 shadow-md shadow-amber-500/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>
                  {isAr
                    ? `إصدار فاتورة طابور جديدة (#${String(nextRestaurantQueueNumber || 1).padStart(3, '0')})`
                    : `New Queue Invoice (#${String(nextRestaurantQueueNumber || 1).padStart(3, '0')})`}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIsTvQueueFullscreen(!isTvQueueFullscreen)}
                className="px-3.5 py-2.5 rounded-2xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-black text-xs flex items-center gap-2 cursor-pointer"
              >
                {isTvQueueFullscreen ? (
                  <>
                    <Minimize2 className="w-4 h-4 text-amber-400" />
                    <span>{isAr ? 'إغلاق وضع شاشة العرض' : 'Exit TV Mode'}</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-4 h-4 text-amber-400" />
                    <span>{isAr ? 'شاشة عرض الطابور للزبائن (TV)' : 'Customer Queue TV'}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  resetRestaurantQueueCounter();
                  setLastCalledQueueNum(null);
                }}
                className="px-3 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-500/15 text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title="تصفير عداد الطابور ليبدأ من #001 لبداية يوم عمل جديد"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isAr ? 'تصفير الطابور لـ #001' : 'Reset Queue to #001'}</span>
              </button>
            </div>
          </div>

          {/* Last Called Queue Number Flashing Banner */}
          {lastCalledQueueNum !== null && (
            <div className="rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 text-white p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 border-2 border-emerald-300 animate-in fade-in">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white text-emerald-700 flex items-center justify-center font-black font-mono text-2xl shadow-lg">
                  #{String(lastCalledQueueNum).padStart(3, '0')}
                </div>
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-100 flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4 animate-bounce" />
                    {isAr ? 'النداء الصوتي الحالي على شاشة الاستلام' : 'Now Calling Queue Ticket'}
                  </span>
                  <h3 className="text-lg sm:text-xl font-black mt-0.5">
                    {isAr
                      ? `فاتورة الطابور رقم #${String(lastCalledQueueNum).padStart(3, '0')} جاهزة للاستلام الآن!`
                      : `Queue Invoice #${String(lastCalledQueueNum).padStart(3, '0')} is Ready for Pickup!`}
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCallQueueNumber(lastCalledQueueNum)}
                  className="px-4 py-2 rounded-xl bg-white text-emerald-800 font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>{isAr ? 'تكرار النداء الصوتي' : 'Repeat Call'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLastCalledQueueNum(null)}
                  className="p-2 rounded-xl bg-black/20 hover:bg-black/30 text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* LIVE SPLIT-SCREEN QUEUE BOARD (قيد التحضير 🔥 vs جاهز للاستلام ✅) */}
          <div
            className={`${
              isTvQueueFullscreen
                ? 'fixed inset-0 z-50 bg-slate-950 p-6 overflow-y-auto flex flex-col gap-6'
                : ''
            }`}
          >
            {isTvQueueFullscreen && (
              <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
                    <Monitor className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black">
                      {isAr ? 'شاشة متابعة أرقام طابور الطلبات والفواتير' : 'Live Order Queue Screen'}
                    </h2>
                    <p className="text-xs text-slate-400">
                      {isAr
                        ? 'يرجى الانتظار حتى يظهر رقم فاتورتك في قائمة (جاهز للاستلام الآن)'
                        : 'Please wait until your invoice queue number appears in Ready for Pickup'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTvQueueFullscreen(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-black text-xs flex items-center gap-2 cursor-pointer"
                >
                  <Minimize2 className="w-4 h-4" />
                  <span>{isAr ? 'إغلاق الشاشة الكاملة' : 'Exit Fullscreen'}</span>
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Column 1: PREPARING NOW (قيد التحضير بالمطبخ الآن) */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-amber-500/40 overflow-hidden shadow-sm flex flex-col">
                <div className="bg-gradient-to-l from-amber-500 to-orange-500 text-slate-950 px-5 py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Flame className="w-5 h-5 animate-pulse" />
                    <h3 className="text-base font-black">
                      {isAr ? 'قيد التحضير الآن (Preparing)' : 'Preparing Now'}
                    </h3>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-slate-950 text-amber-400 font-black text-xs font-mono">
                    {liveQueueBoard.preparing.length} {isAr ? 'في الطابور' : 'in queue'}
                  </span>
                </div>

                <div className="p-4 flex-1">
                  {liveQueueBoard.preparing.length === 0 ? (
                    <div className="py-10 text-center text-slate-400 space-y-2">
                      <ChefHat className="w-10 h-10 mx-auto opacity-40" />
                      <p className="text-xs font-bold">
                        {isAr ? 'لا توجد فواتير قيد التحضير حالياً' : 'No orders currently preparing'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {liveQueueBoard.preparing.map(ticket => (
                        <div
                          key={`prep-${ticket.queueNumber}`}
                          className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-slate-800/80 border-2 border-amber-400/50 flex flex-col justify-between gap-2.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <span className="px-3 py-1.5 rounded-xl bg-slate-900 text-amber-400 font-black font-mono text-xl tracking-wider shadow-sm">
                                #{ticket.formattedQueue}
                              </span>
                              <div>
                                <span className="text-xs font-black text-slate-900 dark:text-white block">
                                  {ticket.tableName}
                                </span>
                                <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400">
                                  {ticket.invoiceNumber}
                                </span>
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-800 dark:text-amber-300 text-[10px] font-black">
                              {ticket.diningType === 'takeaway'
                                ? 'سفري'
                                : ticket.diningType === 'delivery'
                                ? 'توصيل'
                                : 'صالة'}
                            </span>
                          </div>

                          <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300 line-clamp-1">
                            {ticket.itemsSummary}
                          </p>

                          <div className="pt-2 border-t border-amber-200/60 dark:border-slate-700 flex items-center justify-between gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                if (ticket.saleObj) {
                                  updateSaleQueueStatus(ticket.saleObj.id, 'ready');
                                }
                                if (ticket.kitchenOrderObj) {
                                  updateKitchenOrderStatus(ticket.kitchenOrderObj.id, 'ready');
                                }
                                handleCallQueueNumber(ticket.queueNumber, ticket.tableName);
                              }}
                              className="flex-1 py-1.5 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{isAr ? 'جاهز + نداء الرقم' : 'Mark Ready & Call'}</span>
                            </button>
                            {ticket.saleObj && (
                              <button
                                type="button"
                                onClick={() => setPrintingReceiptSale(ticket.saleObj!)}
                                className="p-1.5 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-amber-500 cursor-pointer"
                                title="طباعة فاتورة الطابور"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Column 2: READY FOR PICKUP / SERVING (جاهز للاستلام والتسليم الآن ✅) */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-emerald-500/60 overflow-hidden shadow-md flex flex-col">
                <div className="bg-gradient-to-l from-emerald-600 to-teal-600 text-white px-5 py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5" />
                    <h3 className="text-base font-black">
                      {isAr ? 'جاهز للاستلام والتسليم الآن (Ready)' : 'Ready for Pickup Now'}
                    </h3>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-white text-emerald-800 font-black text-xs font-mono">
                    {liveQueueBoard.ready.length} {isAr ? 'جاهز للاستلام' : 'ready'}
                  </span>
                </div>

                <div className="p-4 flex-1">
                  {liveQueueBoard.ready.length === 0 ? (
                    <div className="py-10 text-center text-slate-400 space-y-2">
                      <Bell className="w-10 h-10 mx-auto opacity-40" />
                      <p className="text-xs font-bold">
                        {isAr ? 'لا توجد أرقام جاهزة بالانتظار حالياً' : 'No queue numbers waiting for pickup'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {liveQueueBoard.ready.map(ticket => (
                        <div
                          key={`ready-${ticket.queueNumber}`}
                          className="p-3.5 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/30 border-2 border-emerald-500 shadow-md shadow-emerald-500/10 flex flex-col justify-between gap-2.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <span className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black font-mono text-2xl tracking-wider shadow-md animate-pulse">
                                #{ticket.formattedQueue}
                              </span>
                              <div>
                                <span className="text-xs font-black text-slate-900 dark:text-white block">
                                  {ticket.tableName}
                                </span>
                                <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-300">
                                  {ticket.invoiceNumber}
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCallQueueNumber(ticket.queueNumber, ticket.tableName)}
                              className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] flex items-center gap-1 shadow-xs cursor-pointer"
                              title="نداء صوتي لرقم الطابور"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                              <span>{isAr ? 'نداء 🔊' : 'Call'}</span>
                            </button>
                          </div>

                          <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 line-clamp-1">
                            {ticket.itemsSummary}
                          </p>

                          <div className="pt-2 border-t border-emerald-200/70 dark:border-emerald-800/60 flex items-center justify-between gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                if (ticket.saleObj) {
                                  updateSaleQueueStatus(ticket.saleObj.id, 'served');
                                }
                                if (ticket.kitchenOrderObj) {
                                  updateKitchenOrderStatus(ticket.kitchenOrderObj.id, 'completed');
                                }
                              }}
                              className="flex-1 py-1.5 px-2.5 rounded-xl bg-slate-900 dark:bg-emerald-500 text-white dark:text-slate-950 font-black text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <CheckCheck className="w-3.5 h-3.5" />
                              <span>{isAr ? 'تم تسليم الطلب ✓' : 'Mark Served'}</span>
                            </button>
                            {ticket.saleObj && (
                              <button
                                type="button"
                                onClick={() => setPrintingReceiptSale(ticket.saleObj!)}
                                className="p-1.5 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 cursor-pointer"
                                title="طباعة فاتورة الطابور"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* NUMBERED RESTAURANT INVOICES DIRECTORY (قائمة فواتير المطعم المرقمة حسب الطابور) */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-amber-500" />
                  <span>
                    {isAr
                      ? `سجل فواتير المطعم المرقمة حسب الطابور (${filteredNumberedInvoices.length})`
                      : `Numbered Restaurant Queue Invoices (${filteredNumberedInvoices.length})`}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isAr
                    ? 'جميع الفواتير مرقمة تسلسلياً (طابور #001، #002، #003...) مع إمكانية طباعة تذكرة الطابور أو النداء الصوتي على الرقم.'
                    : 'All restaurant invoices are sequentially numbered (#001, #002, #003...) with queue ticket printing and voice calling.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Daily Scope Filter (Today starting from #001 vs All Days) */}
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setQueueDateFilter('today')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                      queueDateFilter === 'today'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {isAr ? 'طابور اليوم (من #001)' : 'Today (#001+)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setQueueDateFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                      queueDateFilter === 'all'
                        ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {isAr ? 'كل الأيام' : 'All Days'}
                  </button>
                </div>

                {/* Status Filter Pills */}
                {(
                  [
                    { id: 'all', label: isAr ? 'الكل' : 'All' },
                    { id: 'preparing', label: isAr ? 'قيد التحضير 🔥' : 'Preparing' },
                    { id: 'ready', label: isAr ? 'جاهز للاستلام ✅' : 'Ready' },
                    { id: 'served', label: isAr ? 'تم التسليم ✓' : 'Served' },
                  ] as const
                ).map(st => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setQueueFilterStatus(st.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      queueFilterStatus === st.id
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}

                {/* Search Input */}
                <div className="relative w-full sm:w-56">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={queueSearchQuery}
                    onChange={e => setQueueSearchQuery(e.target.value)}
                    placeholder={isAr ? 'ابحث برقم الطابور (001) أو الفاتورة...' : 'Search queue #001...'}
                    className="w-full pr-8 pl-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {filteredNumberedInvoices.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <Receipt className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-500">
                  {isAr
                    ? 'لا توجد فواتير مطابقة للبحث الحالي.'
                    : 'No numbered queue invoices match the current filter.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredNumberedInvoices.map(inv => {
                  const isReady = inv.resolvedQueueStatus === 'ready';
                  const isServed = inv.resolvedQueueStatus === 'served';

                  return (
                    <div
                      key={inv.id}
                      className={`rounded-2xl border-2 p-4 flex flex-col justify-between gap-3 transition-all ${
                        isReady
                          ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-500 shadow-md shadow-emerald-500/10'
                          : isServed
                          ? 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                          : 'bg-white dark:bg-slate-900 border-amber-400/70 shadow-sm'
                      }`}
                    >
                      {/* Top Header: Giant Queue Number Badge + Invoice Code + Status */}
                      <div>
                        <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-3">
                            <div
                              className={`px-3.5 py-2 rounded-2xl font-black font-mono text-xl tracking-wider shadow-sm flex flex-col items-center justify-center leading-none ${
                                isReady
                                  ? 'bg-emerald-600 text-white'
                                  : isServed
                                  ? 'bg-slate-800 text-slate-200'
                                  : 'bg-amber-500 text-slate-950'
                              }`}
                            >
                              <span className="text-[9px] font-bold opacity-80 mb-0.5">
                                {isAr ? 'طابور' : 'QUEUE'}
                              </span>
                              <span>#{inv.formattedQueueNumber}</span>
                            </div>

                            <div>
                              <span className="text-xs font-black font-mono text-slate-900 dark:text-white block">
                                {inv.displayInvoiceNumber}
                              </span>
                              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-black">
                                  {inv.tableName ||
                                    (inv.diningType === 'takeaway'
                                      ? 'طلب سفري'
                                      : inv.diningType === 'delivery'
                                      ? 'توصيل'
                                      : 'صالة المطعم')}
                                </span>
                                {inv.customerName && (
                                  <span className="text-[11px] font-bold text-slate-500">
                                    • {inv.customerName}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-left">
                            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 block">
                              {formatCurrency(inv.total)}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(inv.createdAt).toLocaleTimeString('ar-SY', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>

                        {/* Items inside the numbered invoice */}
                        <div className="py-2.5 space-y-1 max-h-32 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                          {inv.items.map((item, idx) => (
                            <div
                              key={`${inv.id}-item-${idx}`}
                              className="pt-1 flex items-center justify-between text-xs"
                            >
                              <span className="font-bold text-slate-800 dark:text-slate-200">
                                {item.quantity}× {item.productName}
                              </span>
                              <span className="font-mono text-[11px] text-slate-500">
                                {formatCurrency(item.total)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Queue Status Switcher & Print / Voice Call Actions */}
                      <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 space-y-2">
                        <div className="grid grid-cols-3 gap-1.5">
                          <button
                            type="button"
                            onClick={() => updateSaleQueueStatus(inv.id, 'preparing')}
                            className={`py-1.5 px-2 rounded-xl text-[10px] font-black transition-all cursor-pointer ${
                              inv.resolvedQueueStatus === 'preparing' ||
                              inv.resolvedQueueStatus === 'waiting'
                                ? 'bg-amber-500 text-slate-950 shadow-2xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                            }`}
                          >
                            🔥 قيد التحضير
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              updateSaleQueueStatus(inv.id, 'ready');
                              handleCallQueueNumber(inv.queueNumber || 1, inv.tableName);
                            }}
                            className={`py-1.5 px-2 rounded-xl text-[10px] font-black transition-all cursor-pointer ${
                              inv.resolvedQueueStatus === 'ready'
                                ? 'bg-emerald-600 text-white shadow-2xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                            }`}
                          >
                            ✅ جاهز للاستلام
                          </button>
                          <button
                            type="button"
                            onClick={() => updateSaleQueueStatus(inv.id, 'served')}
                            className={`py-1.5 px-2 rounded-xl text-[10px] font-black transition-all cursor-pointer ${
                              inv.resolvedQueueStatus === 'served'
                                ? 'bg-slate-900 dark:bg-slate-700 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                            }`}
                          >
                            ✓ تم التسليم
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleCallQueueNumber(inv.queueNumber || 1, inv.tableName)
                            }
                            className="flex-1 py-2 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500 text-amber-800 dark:text-amber-300 hover:text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 border border-amber-500/30 transition-all cursor-pointer"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>نداء طابور #{inv.formattedQueueNumber}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setPrintingReceiptSale(inv)}
                            className="flex-1 py-2 px-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-xs hover:opacity-90 transition-opacity cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>طباعة فاتورة الطابور</span>
                          </button>
                        </div>
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
          TAB 1: INTERACTIVE FLOOR PLAN & TABLE MANAGEMENT
         ========================================================= */}
      {activeSubTab === 'floor_plan' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Floor Plan Grid */}
          <div className="lg:col-span-8 space-y-4">
            {/* Zone & Search Toolbar */}
            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {zones.map(z => (
                  <button
                    key={z}
                    type="button"
                    onClick={() => setSelectedZone(z)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      selectedZone === z
                        ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {z === 'all' ? (isAr ? 'جميع الصالات' : 'All Zones') : z}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:w-48">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder={isAr ? 'بحث عن طاولة أو نادل...' : 'Search table...'}
                    className="w-full pr-8 pl-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddTableModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAr ? 'إضافة طاولة' : 'Add Table'}</span>
                </button>
              </div>
            </div>

            {/* Tables Interactive Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
              {filteredTables.map(table => {
                const badge = getStatusBadgeConfig(table.effectiveStatus);
                const isSelected = selectedTableId === table.id;
                return (
                  <div
                    key={table.id}
                    onClick={() => setSelectedTableId(table.id)}
                    className={`bg-white dark:bg-slate-900 rounded-2xl p-4 border-2 transition-all cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? 'ring-2 ring-amber-500 border-amber-500'
                        : badge.cardBorder
                    }`}
                  >
                    {/* Top Row: Table Name + Status Pill */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block">
                          {table.zone}
                        </span>
                        <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{table.name}</span>
                        </h3>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black border flex items-center gap-1.5 ${badge.bg}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                        {badge.label}
                      </span>
                    </div>

                    {/* Capacity & Waiter Info */}
                    <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1 font-medium">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        سعة {table.capacity} ضيوف
                      </span>
                      <span className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-300">
                        <UserCheck className="w-3.5 h-3.5 text-amber-500" />
                        {table.waiterName || 'غير معين'}
                      </span>
                    </div>

                    {/* Urgent Alerts on Table (Unconfirmed QR Order / Ready Dish / Table Call) */}
                    {(table.unconfirmedQrCount > 0 ||
                      table.readyItemsCount > 0 ||
                      table.pendingCalls.length > 0) && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {table.unconfirmedQrCount > 0 && (
                          <span className="px-2 py-0.5 rounded-lg bg-amber-500 text-slate-950 text-[10px] font-black flex items-center gap-1 animate-pulse">
                            <Smartphone className="w-3 h-3" />
                            طلب QR جديد ({table.unconfirmedQrCount})
                          </span>
                        )}
                        {table.readyItemsCount > 0 && (
                          <span className="px-2 py-0.5 rounded-lg bg-emerald-500 text-white text-[10px] font-black flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            {table.readyItemsCount} طبق جاهز للتقديم
                          </span>
                        )}
                        {table.pendingCalls.map(call => {
                          const cfg = getServiceRequestLabel(call.requestType);
                          return (
                            <span
                              key={call.id}
                              className="px-2 py-0.5 rounded-lg bg-rose-600 text-white text-[10px] font-black flex items-center gap-1 animate-bounce"
                            >
                              <Bell className="w-3 h-3" />
                              {cfg.label}
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {/* Reservation Details if Reserved */}
                    {table.effectiveStatus === 'reserved' && table.reservedBy && (
                      <div className="mt-3 p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 text-xs">
                        <p className="font-black text-indigo-900 dark:text-indigo-200">
                          حجز: {table.reservedBy}
                        </p>
                        <p className="text-[11px] text-indigo-600 dark:text-indigo-400">
                          الساعة {table.reservedTime || '20:00'} • {table.reservedGuests || table.capacity} ضيوف
                        </p>
                      </div>
                    )}

                    {/* Running Balance & Quick Action Footer */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] text-slate-400 block">الحساب الجاري</span>
                        <span className="text-sm font-black text-amber-600 dark:text-amber-400">
                          {table.totalRunningAmount > 0
                            ? formatCurrency(table.totalRunningAmount)
                            : isAr
                            ? 'لا يوجد طلب نشط'
                            : 'No active bill'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleOpenTableInPOS(table)}
                          className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500 text-amber-700 dark:text-amber-300 hover:text-slate-950 font-black text-[11px] transition-colors cursor-pointer"
                        >
                          + طلب بالكاشير
                        </button>
                        {table.activeOrders.length > 0 && (
                          <button
                            type="button"
                            onClick={() => handleLoadOrderToCashierPOS(table.activeOrders[0])}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-500 text-white font-black text-[11px] hover:bg-emerald-600 transition-colors cursor-pointer"
                          >
                            تحصيل الفاتورة
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Inspector Panel: Selected Table Details & Live Orders */}
          <div className="lg:col-span-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sticky top-4 space-y-4 shadow-sm">
              {selectedTable ? (
                <>
                  <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div>
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                        {selectedTable.zone}
                      </span>
                      <h2 className="text-lg font-black text-slate-900 dark:text-white">
                        {selectedTable.name}
                      </h2>
                      <p className="text-xs text-slate-500">
                        النادل المسؤول: <strong className="text-slate-800 dark:text-slate-200">{selectedTable.waiterName}</strong> • السعة: {selectedTable.capacity} مقاعد
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedTableId(null)}
                      className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Quick Table Status Switcher */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1.5">
                      تغيير حالة الطاولة يدوياً:
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(
                        [
                          { id: 'available', label: 'متاحة' },
                          { id: 'occupied', label: 'مشغولة' },
                          { id: 'bill_requested', label: 'طلب الحساب' },
                          { id: 'reserved', label: 'محجوزة' },
                          { id: 'cleaning', label: 'تنظيف' },
                        ] as const
                      ).map(st => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => handleSetTableStatus(selectedTable.id, st.id)}
                          className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                            selectedTable.effectiveStatus === st.id
                              ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 border-slate-900 dark:border-amber-500'
                              : 'bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Active Table Service Calls */}
                  {selectedTable.pendingCalls.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-black text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                        <Bell className="w-4 h-4 animate-bounce" />
                        نداءات الزبون من هذه الطاولة:
                      </h4>
                      {selectedTable.pendingCalls.map(call => {
                        const cfg = getServiceRequestLabel(call.requestType);
                        return (
                          <div
                            key={call.id}
                            className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center justify-between gap-2"
                          >
                            <div>
                              <p className="text-xs font-black text-rose-900 dark:text-rose-200">
                                {cfg.label}
                              </p>
                              {call.notes && (
                                <p className="text-[11px] text-rose-700 dark:text-rose-300">
                                  {call.notes}
                                </p>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => acknowledgeTableServiceRequest(call.id, 'completed')}
                              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-black shrink-0 cursor-pointer"
                            >
                              تمت التلبية ✓
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Active Orders for Selected Table */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">
                        الطلبات الجارية للطاولة ({selectedTable.activeOrders.length})
                      </h4>
                      <button
                        type="button"
                        onClick={() => handleOpenTableInPOS(selectedTable)}
                        className="text-xs font-black text-amber-600 hover:underline cursor-pointer"
                      >
                        + إضافة أصناف
                      </button>
                    </div>

                    {selectedTable.activeOrders.length === 0 ? (
                      <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-center space-y-2">
                        <Utensils className="w-7 h-7 text-slate-400 mx-auto" />
                        <p className="text-xs text-slate-500">
                          لا توجد طلبات نشطة على هذه الطاولة حالياً.
                        </p>
                        <button
                          type="button"
                          onClick={() => handleOpenTableInPOS(selectedTable)}
                          className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-black text-xs cursor-pointer"
                        >
                          فتح طلب جديد على الكاشير
                        </button>
                      </div>
                    ) : (
                      selectedTable.activeOrders.map(ord => (
                        <div
                          key={ord.id}
                          className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded-lg bg-amber-500 text-slate-950 font-black font-mono text-[11px]">
                                طابور #{String(ord.queueNumber || Number((ord.orderNumber.match(/\d+/) || [1])[0])).padStart(3, '0')}
                              </span>
                              <span className="text-xs font-black text-slate-900 dark:text-white font-mono">
                                {ord.orderNumber}
                              </span>
                              {ord.isCustomerQrOrder && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-700 dark:text-amber-300">
                                  منيو الزبون QR
                                </span>
                              )}
                            </div>
                            <span className="text-xs font-black text-amber-600 dark:text-amber-400">
                              {formatCurrency(
                                ord.totalAmount ||
                                  ord.items.reduce(
                                    (s, i) => s + (i.unitPrice || 0) * i.quantity,
                                    0
                                  )
                              )}
                            </span>
                          </div>

                          {/* Items list */}
                          <div className="space-y-1 divide-y divide-slate-200/60 dark:divide-slate-700/60">
                            {ord.items.map(item => (
                              <div
                                key={item.id}
                                className="pt-1 flex items-center justify-between text-xs"
                              >
                                <span className="font-bold text-slate-700 dark:text-slate-200">
                                  {item.quantity}× {item.nameAr || item.productName}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextStatus =
                                      item.status === 'pending'
                                        ? 'cooking'
                                        : item.status === 'cooking'
                                        ? 'ready'
                                        : 'served';
                                    updateKitchenItemStatus(ord.id, item.id, nextStatus);
                                  }}
                                  className={`px-2 py-0.5 rounded-lg text-[10px] font-black cursor-pointer ${
                                    item.status === 'ready'
                                      ? 'bg-emerald-500 text-white'
                                      : item.status === 'served'
                                      ? 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                                      : item.status === 'cooking'
                                      ? 'bg-amber-500 text-slate-950'
                                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                  }`}
                                >
                                  {item.status === 'pending'
                                    ? 'بانتظار التحضير'
                                    : item.status === 'cooking'
                                    ? 'قيد الطهي 🔥'
                                    : item.status === 'ready'
                                    ? 'جاهز للتقديم ✓'
                                    : 'تم التقديم ✓✓'}
                                </button>
                              </div>
                            ))}
                          </div>

                          {/* Order Actions */}
                          <div className="pt-2 flex flex-wrap gap-1.5">
                            {ord.isCustomerQrOrder && !ord.waiterConfirmed && (
                              <button
                                type="button"
                                onClick={() => confirmKitchenOrder(ord.id)}
                                className="flex-1 py-1.5 px-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                تأكيد استلام الطلب (كاشير/نادل)
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleLoadOrderToCashierPOS(ord)}
                              className="flex-1 py-1.5 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                              إصدار الفاتورة بالكاشير
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setTransferSourceOrderId(ord.id);
                                setTransferTargetTable(restaurantTables[0]?.name || 'الطاولة 1');
                              }}
                              className="py-1.5 px-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                              title="نقل الطلب لطاولة أخرى"
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5" />
                              نقل
                            </button>
                          </div>

                          {/* Table Transfer Inline Selector */}
                          {transferSourceOrderId === ord.id && (
                            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-400 flex items-center gap-2">
                              <select
                                value={transferTargetTable}
                                onChange={e => setTransferTargetTable(e.target.value)}
                                className="flex-1 text-xs bg-slate-100 dark:bg-slate-800 rounded-lg px-2 py-1.5 font-bold"
                              >
                                {restaurantTables.map(t => (
                                  <option key={t.id} value={t.name}>
                                    {t.name} ({t.zone})
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => {
                                  transferKitchenOrderTable(ord.id, transferTargetTable);
                                  setTransferSourceOrderId(null);
                                }}
                                className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-black text-xs cursor-pointer"
                              >
                                تأكيد النقل
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <div className="py-12 text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                    <UtensilsCrossed className="w-7 h-7" />
                  </div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">
                    اختر أي طاولة من خريطة الصالة
                  </h3>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    اضغط على أي طاولة لمعاينة طلباتها الجارية، تأكيد طلبات منيو الزبائن (QR)، نقل الطاولة، أو تحويل الحساب مباشرة إلى الكاشير.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 2: LIVE CUSTOMER QR ORDERS & WAITER/CASHIER QUEUE
         ========================================================= */}
      {activeSubTab === 'live_qr_orders' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Customer QR Orders Feed (Cashier + Waiter Queue) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-amber-500" />
                  <span>طلبات منيو الزبائن المباشرة (تصل للكاشير وجهاز النادل معاً)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  كل طلب يرسله الزبون عبر الباركود يظهر هنا فوراً وفي شاشة الكاشير وجهاز النادل المحمول وشاشة المطبخ.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomerMenuPreviewOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-amber-500 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>تجربة إرسال طلب زبون الآن</span>
              </button>
            </div>

            {kitchenOrders.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 text-center border border-slate-200 dark:border-slate-800 space-y-3">
                <Smartphone className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-base font-black text-slate-700 dark:text-slate-200">
                  لا توجد طلبات زبائن حالية
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  عندما يقوم أي زبون بمسح رمز QR للطاولة وإرسال طلبه، سيصل تنبيه صوتي ومرئي فوري للكاشير وجهاز النادل.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {kitchenOrders.map(order => {
                  const isConfirmed = Boolean(order.waiterConfirmed);
                  const orderTotal =
                    order.totalAmount ||
                    order.items.reduce((s, it) => s + (it.unitPrice || 0) * it.quantity, 0);

                  return (
                    <div
                      key={order.id}
                      className={`bg-white dark:bg-slate-900 rounded-2xl p-4 border-2 transition-all ${
                        order.isCustomerQrOrder && !isConfirmed
                          ? 'border-amber-500 shadow-lg shadow-amber-500/10'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-3 py-1 rounded-xl bg-amber-500 text-slate-950 font-black font-mono text-xs shadow-xs">
                            طابور #{String(order.queueNumber || Number((order.orderNumber.match(/\d+/) || [1])[0])).padStart(3, '0')}
                          </span>
                          <span className="px-2.5 py-1 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-black text-xs font-mono">
                            {order.orderNumber}
                          </span>
                          <span className="px-2.5 py-1 rounded-xl bg-amber-500/15 text-amber-800 dark:text-amber-300 font-black text-xs">
                            {order.tableName}
                          </span>
                          <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs">
                            {order.diningType === 'takeaway'
                              ? 'سفري (Takeaway)'
                              : order.diningType === 'delivery'
                              ? 'توصيل (Delivery)'
                              : 'محلي بالصالة (Dine-in)'}
                          </span>
                          {order.customerName && (
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                              العميل: {order.customerName}
                            </span>
                          )}
                          {order.customerPhone && (
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {order.customerPhone}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(orderTotal)}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {new Date(order.createdAt).toLocaleTimeString('ar-SY', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Real-time Delivery Routing Badges (Cashier + Waiter + Kitchen) */}
                      <div className="py-2.5 flex flex-wrap items-center gap-2 text-[11px]">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1 border border-emerald-500/20">
                          <Monitor className="w-3.5 h-3.5" />
                          وصل لشاشة الكاشير ✓
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-700 dark:text-sky-300 font-bold flex items-center gap-1 border border-sky-500/20">
                          <Smartphone className="w-3.5 h-3.5" />
                          وصل لجهاز النادل ✓
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-700 dark:text-orange-300 font-bold flex items-center gap-1 border border-orange-500/20">
                          <ChefHat className="w-3.5 h-3.5" />
                          وصل لشاشة المطبخ ✓
                        </span>
                        {isConfirmed ? (
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-black flex items-center gap-1">
                            <CheckCheck className="w-3.5 h-3.5" />
                            تم التأكيد بواسطة: {order.waiterConfirmedBy || 'الكابتن / الكاشير'}
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-black animate-pulse">
                            بانتظار تأكيد النادل أو الكاشير
                          </span>
                        )}
                      </div>

                      {order.deliveryAddress && (
                        <div className="mb-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs flex items-center gap-2 text-slate-700 dark:text-slate-300">
                          <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
                          <span>عنوان التوصيل: {order.deliveryAddress}</span>
                        </div>
                      )}

                      {/* Order Items */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-2">
                        {order.items.map(item => (
                          <div
                            key={item.id}
                            className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700 flex items-center justify-between"
                          >
                            <div>
                              <p className="text-xs font-black text-slate-800 dark:text-slate-200">
                                {item.quantity}× {item.nameAr || item.productName}
                              </p>
                              {item.notes && (
                                <p className="text-[11px] text-amber-600 dark:text-amber-400">
                                  ملاحظة: {item.notes}
                                </p>
                              )}
                              {item.targetDeviceName && (
                                <span className="text-[10px] text-slate-400">
                                  التوجيه: {item.targetDeviceName}
                                </span>
                              )}
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${
                                item.status === 'ready'
                                  ? 'bg-emerald-500 text-white'
                                  : item.status === 'served'
                                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                                  : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                              }`}
                            >
                              {item.status === 'ready'
                                ? 'جاهز ✓'
                                : item.status === 'served'
                                ? 'تم التقديم'
                                : 'قيد التحضير'}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Action Buttons for Cashier & Waiter */}
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-end gap-2">
                        {!isConfirmed && (
                          <button
                            type="button"
                            onClick={() => confirmKitchenOrder(order.id)}
                            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>تأكيد الطلب وبدء التحضير</span>
                          </button>
                        )}
                        {order.status !== 'ready' && order.status !== 'completed' && (
                          <button
                            type="button"
                            onClick={() => updateKitchenOrderStatus(order.id, 'ready')}
                            className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-black text-xs flex items-center gap-1.5 cursor-pointer"
                          >
                            <Bell className="w-3.5 h-3.5" />
                            <span>إشعار النادل: الطلب جاهز للتقديم</span>
                          </button>
                        )}
                        {order.status !== 'completed' && (
                          <button
                            type="button"
                            onClick={() => updateKitchenOrderStatus(order.id, 'completed')}
                            className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                            <span>تم التقديم للطاولة</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleLoadOrderToCashierPOS(order)}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <Receipt className="w-4 h-4" />
                          <span>فتح الفاتورة في الكاشير للدفع</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Live Table Service Requests (استدعاء نادل / طلب فاتورة) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Bell className="w-4 h-4 text-rose-500" />
                  <span>نداءات وطلبات خدمة الطاولات</span>
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-rose-500/15 text-rose-600 dark:text-rose-400">
                  {stats.pendingTableCallsCount} نشط
                </span>
              </div>

              {tableServiceRequests.length === 0 ? (
                <div className="py-10 text-center space-y-2">
                  <Bell className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-500">
                    لا توجد نداءات طاولات حالياً. يمكن للزبون من المنيو الضغط على (استدعاء النادل) أو (طلب الفاتورة).
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[540px] overflow-y-auto pr-1">
                  {tableServiceRequests.map(req => {
                    const cfg = getServiceRequestLabel(req.requestType);
                    const Icon = cfg.icon;
                    const isCompleted = req.status === 'completed';

                    return (
                      <div
                        key={req.id}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          isCompleted
                            ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'
                            : 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 shadow-sm'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cfg.color}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-xs font-black text-slate-900 dark:text-white block">
                                {req.tableName}
                              </span>
                              <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
                                {cfg.label}
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {new Date(req.createdAt).toLocaleTimeString('ar-SY', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        {req.notes && (
                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 bg-white/70 dark:bg-slate-900/60 p-2 rounded-xl">
                            {req.notes}
                          </p>
                        )}

                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-[11px] text-slate-500">
                            {isCompleted
                              ? `تمت التلبية بواسطة: ${req.acknowledgedBy || 'النادل'}`
                              : 'وصل التنبيه للكاشير والنادل'}
                          </span>
                          {!isCompleted && (
                            <button
                              type="button"
                              onClick={() => acknowledgeTableServiceRequest(req.id, 'completed')}
                              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black cursor-pointer"
                            >
                              تلبية الطلب ✓
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 3: LIVE KITCHEN DISPLAY SYSTEM (KDS)
         ========================================================= */}
      {activeSubTab === 'kitchen_kds' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/15 text-orange-500 flex items-center justify-center">
                <ChefHat className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  شاشة المطبخ والتحضير الفوري (KDS)
                </h2>
                <p className="text-xs text-slate-500">
                  انقر على أي صنف لتحويل حالته من (قيد الانتظار) إلى (جاري الطهي 🔥) ثم (جاهز للتقديم للنادل ✓).
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {kitchenOrders
              .filter(o => o.status !== 'completed' && o.status !== 'cancelled')
              .map(order => (
                <div
                  key={order.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col justify-between shadow-sm"
                >
                  <div>
                    <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-black font-mono text-lg tracking-wider shadow-sm">
                          #{String(order.queueNumber || Number((order.orderNumber.match(/\d+/) || [1])[0])).padStart(3, '0')}
                        </span>
                        <div>
                          <span className="text-[11px] font-bold font-mono text-amber-400 block">
                            {order.orderNumber}
                          </span>
                          <h3 className="text-sm font-black">{order.tableName}</h3>
                        </div>
                      </div>
                      <div className="text-left">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-white/15">
                          {order.diningType === 'takeaway'
                            ? 'سفري'
                            : order.diningType === 'delivery'
                            ? 'توصيل'
                            : 'صالة'}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {new Date(order.createdAt).toLocaleTimeString('ar-SY', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 divide-y divide-slate-100 dark:divide-slate-800">
                      {order.items.map(item => (
                        <div
                          key={item.id}
                          onClick={() => {
                            const next =
                              item.status === 'pending'
                                ? 'cooking'
                                : item.status === 'cooking'
                                ? 'ready'
                                : 'served';
                            updateKitchenItemStatus(order.id, item.id, next);
                          }}
                          className="py-2.5 flex items-center justify-between gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 px-2 rounded-xl transition-colors"
                        >
                          <div>
                            <p className="text-xs font-black text-slate-900 dark:text-white">
                              {item.quantity}× {item.nameAr || item.productName}
                            </p>
                            {item.notes && (
                              <p className="text-[11px] text-rose-500 font-bold">
                                ملاحظة: {item.notes}
                              </p>
                            )}
                          </div>
                          <span
                            className={`px-2.5 py-1 rounded-xl text-[10px] font-black ${
                              item.status === 'ready'
                                ? 'bg-emerald-500 text-white'
                                : item.status === 'cooking'
                                ? 'bg-amber-500 text-slate-950'
                                : item.status === 'served'
                                ? 'bg-slate-200 text-slate-500'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {item.status === 'pending'
                              ? 'بدء الطهي'
                              : item.status === 'cooking'
                              ? 'قيد الطهي 🔥'
                              : item.status === 'ready'
                              ? 'جاهز للتقديم ✓'
                              : 'تم التقديم'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const qNum = order.queueNumber || Number((order.orderNumber.match(/\d+/) || [1])[0]);
                        updateKitchenOrderStatus(order.id, 'ready');
                        handleCallQueueNumber(qNum, order.tableName);
                      }}
                      className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>تجهيز الطلب + نداء طابور #{String(order.queueNumber || Number((order.orderNumber.match(/\d+/) || [1])[0])).padStart(3, '0')} ✓</span>
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 4: TABLE RESERVATIONS & VIP BOOKINGS
         ========================================================= */}
      {activeSubTab === 'reservations' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                إدارة حجوزات الطاولات وكبار الزوار (VIP)
              </h2>
              <p className="text-xs text-slate-500">
                تنظيم الحجوزات المسبقة وتخصيص الطاولات للضيوف والعائلات.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setResTableId(restaurantTables[0]?.id || '');
                setIsAddReservationOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>حجز طاولة جديد</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {restaurantTables
              .filter(t => t.status === 'reserved')
              .map(tbl => (
                <div
                  key={tbl.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-4 border-2 border-indigo-400/60 dark:border-indigo-700 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-xl bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-black text-xs">
                      {tbl.name} ({tbl.zone})
                    </span>
                    <span className="text-xs font-black text-indigo-600">
                      الساعة {tbl.reservedTime || '20:00'}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      الضيف: {tbl.reservedBy || 'عميل محجوز'}
                    </h3>
                    {tbl.reservedPhone && (
                      <p className="text-xs text-slate-500 mt-0.5">هاتف: {tbl.reservedPhone}</p>
                    )}
                    <p className="text-xs text-slate-500">
                      عدد الضيوف: {tbl.reservedGuests || tbl.capacity} أشخاص
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        handleSetTableStatus(tbl.id, 'occupied');
                        handleOpenTableInPOS(tbl);
                      }}
                      className="flex-1 py-2 rounded-xl bg-emerald-600 text-white font-black text-xs cursor-pointer"
                    >
                      وصول الضيف وفتح الطاولة
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetTableStatus(tbl.id, 'available')}
                      className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs cursor-pointer"
                    >
                      إلغاء الحجز
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 5: DIGITAL QR MENU & INTERACTIVE RESTAURANT PRODUCTS CATALOG
         ========================================================= */}
      {activeSubTab === 'menu_studio' && (
        <div className="space-y-5">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-amber-500" />
                  <span>منيو المطعم الكامل واستوديو باركود الطاولات (QR)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  تصفح جميع منتجات وأصناف المنيو ({products.length} صنف)، أضف الأصناف فوراً لأي طاولة أو فاتورة، أو افتح منيو الزبائن التفاعلي.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setIsCustomerMenuPreviewOpen(true)}
                  className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>فتح منيو الزبائن التفاعلي الكامل (QR)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsRestaurantQrModalOpen(true)}
                  className="px-4 py-2.5 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white font-black text-xs flex items-center gap-2 cursor-pointer"
                >
                  <QrCode className="w-4 h-4 text-amber-400" />
                  <span>طباعة باركود الطاولات وتوجيه الأجهزة</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('products')}
                  className="px-3.5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-amber-500" />
                  <span>إدارة وإضافة أصناف جديدة</span>
                </button>
              </div>
            </div>

            {/* Search & Category Filter Bar for Restaurant Menu Catalog */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={studioMenuSearch}
                    onChange={e => setStudioMenuSearch(e.target.value)}
                    placeholder="ابحث في المنيو عن أي وجبة، مشروب، أو صنف..."
                    className="w-full pr-10 pl-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:outline-none focus:border-amber-500"
                  />
                  {studioMenuSearch && (
                    <button
                      type="button"
                      onClick={() => setStudioMenuSearch('')}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                  <span>عدد الأصناف المعروضة:</span>
                  <span className="px-2.5 py-1 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300 font-black font-mono">
                    {filteredStudioMenuProducts.length} / {products.length}
                  </span>
                </div>
              </div>

              {/* Category Chips */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                <button
                  type="button"
                  onClick={() => setStudioMenuCategory('all')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                    studioMenuCategory === 'all'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  جميع أصناف المنيو ({products.length})
                </button>
                {categories
                  .filter(c => c.id !== 'cat_all')
                  .map(cat => {
                    const count = products.filter(p => p.categoryId === cat.id).length;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setStudioMenuCategory(cat.id)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                          studioMenuCategory === cat.id
                            ? 'bg-amber-500 text-slate-950 shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        <span>{isAr ? cat.nameAr : cat.nameEn}</span>
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10 dark:bg-white/10 font-mono">
                          {count}
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Full Scrollable Products Grid in Menu Tab */}
            {filteredStudioMenuProducts.length === 0 ? (
              <div className="py-12 text-center space-y-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
                <Utensils className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-500">
                  لا توجد أصناف مطابقة للبحث الحالي.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setStudioMenuCategory('all');
                    setStudioMenuSearch('');
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-black text-xs cursor-pointer"
                >
                  عرض جميع المنتجات ({products.length})
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5 pb-6">
                {filteredStudioMenuProducts.map(product => {
                  const catObj = categories.find(c => c.id === product.categoryId);
                  return (
                    <div
                      key={product.id}
                      className="bg-slate-50/80 dark:bg-slate-800/60 rounded-2xl p-3 border border-slate-200 dark:border-slate-700/80 hover:border-amber-500 transition-all flex flex-col justify-between gap-3 shadow-2xs"
                    >
                      <div>
                        <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-900 mb-2.5">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.nameAr}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-amber-500/10 text-amber-600 dark:text-amber-400 font-black text-2xl">
                              {product.nameAr.charAt(0)}
                            </div>
                          )}
                          {catObj && (
                            <span className="absolute top-2 right-2 px-2 py-0.5 rounded-lg bg-slate-950/75 text-white text-[10px] font-bold backdrop-blur-xs">
                              {isAr ? catObj.nameAr : catObj.nameEn}
                            </span>
                          )}
                          <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-lg bg-amber-500 text-slate-950 font-black font-mono text-xs shadow-sm">
                            {formatCurrency(product.price)}
                          </span>
                        </div>

                        <h3 className="text-sm font-black text-slate-900 dark:text-white line-clamp-1">
                          {isAr ? product.nameAr : product.nameEn}
                        </h3>
                        {product.descriptionAr && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                            {product.descriptionAr}
                          </p>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700/70 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            soundEffects.playClick();
                            addToCart(product, 1, false);
                            notify(
                              'تمت الإضافة للفاتورة',
                              `تم إرسال (${product.nameAr}) إلى سلة الكاشير`,
                              'success'
                            );
                          }}
                          className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>إضافة للطلب</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsRestaurantQrModalOpen(true)}
                          className="py-2 px-2.5 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-bold cursor-pointer"
                          title="تخصيص صورة الصنف وتوجيه الجهاز"
                        >
                          توجيه
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
          TAB 6: REVIEWS & RESTAURANT ANALYTICS
         ========================================================= */}
      {activeSubTab === 'reviews_analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-12 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 space-y-4">
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" />
              <span>تقييمات الضيوف وتجربة منيو المطعم ({customerReviews.length})</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
              {customerReviews.map(rev => (
                <div
                  key={rev.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      {rev.customerName || 'ضيف المطعم'} • {rev.tableName}
                    </span>
                    <div className="flex items-center gap-0.5 text-amber-500">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star
                          key={idx}
                          className={`w-3.5 h-3.5 ${
                            idx < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  {rev.comment && (
                    <p className="text-xs text-slate-600 dark:text-slate-300">"{rev.comment}"</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Table Modal */}
      {isAddTableModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleAddTable}
            className="bg-white dark:bg-slate-900 rounded-3xl p-5 w-full max-w-md border border-slate-200 dark:border-slate-800 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                إضافة طاولة جديدة للصالة
              </h3>
              <button
                type="button"
                onClick={() => setIsAddTableModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  اسم / رقم الطاولة
                </label>
                <input
                  type="text"
                  required
                  value={newTableName}
                  onChange={e => setNewTableName(e.target.value)}
                  placeholder="مثال: الطاولة 9 أو جناح عائلي 5"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  الصالة / القسم
                </label>
                <input
                  type="text"
                  value={newTableZone}
                  onChange={e => setNewTableZone(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    عدد المقاعد
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={newTableCapacity}
                    onChange={e => setNewTableCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    النادل المسؤول
                  </label>
                  <input
                    type="text"
                    value={newTableWaiter}
                    onChange={e => setNewTableWaiter(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs cursor-pointer"
            >
              حفظ وإضافة الطاولة
            </button>
          </form>
        </div>
      )}

      {/* Add Reservation Modal */}
      {isAddReservationOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleAddReservation}
            className="bg-white dark:bg-slate-900 rounded-3xl p-5 w-full max-w-md border border-slate-200 dark:border-slate-800 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                تثبيت حجز طاولة جديد
              </h3>
              <button
                type="button"
                onClick={() => setIsAddReservationOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  اختر الطاولة
                </label>
                <select
                  value={resTableId}
                  onChange={e => setResTableId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  {restaurantTables.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} - {t.zone} (سعة {t.capacity})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  اسم الضيف صاحب الحجز
                </label>
                <input
                  type="text"
                  required
                  value={resGuestName}
                  onChange={e => setResGuestName(e.target.value)}
                  placeholder="مثال: المهندس سامي..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    رقم الهاتف
                  </label>
                  <input
                    type="text"
                    value={resGuestPhone}
                    onChange={e => setResGuestPhone(e.target.value)}
                    placeholder="09..."
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    وقت الحجز
                  </label>
                  <input
                    type="time"
                    value={resTime}
                    onChange={e => setResTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-black text-xs cursor-pointer"
            >
              تأكيد الحجز
            </button>
          </form>
        </div>
      )}

      {/* Printable Queue Invoice Modal */}
      {printingReceiptSale && (
        <PrintableReceiptModal
          isOpen={Boolean(printingReceiptSale)}
          onClose={() => setPrintingReceiptSale(null)}
          sale={printingReceiptSale}
        />
      )}
    </div>
  );
};
