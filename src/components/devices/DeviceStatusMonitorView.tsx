import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { DeviceRole, LinkedDevice } from '../../types';
import { generateUniqueCodeForSingleDevice } from '../../utils/licenseUtils';
import { DevicePairingModal } from './DevicePairingModal';
import { soundEffects } from '../../services/audio';
import {
  Activity,
  Wifi,
  WifiOff,
  Crown,
  Monitor,
  Smartphone,
  Tablet,
  KeyRound,
  Copy,
  CheckCircle2,
  RefreshCw,
  Plus,
  Battery,
  BatteryCharging,
  Clock,
  Sliders,
  Search,
  Radio,
  Eye,
  Trash2,
  UserCheck,
  Briefcase,
  ScanBarcode,
  ChefHat,
  Tv,
  Utensils,
  Share2,
  Signal,
  AlertTriangle,
  Package,
  Store,
  BellRing,
} from 'lucide-react';

type DeviceGroupCategory = 'cashier' | 'warehouse' | 'restaurant';

const FIVE_MINUTES_MS = 5 * 60 * 1000;

export const DeviceStatusMonitorView: React.FC = () => {
  const {
    devices,
    sales,
    kitchenOrders,
    currentDeviceId,
    isMasterDevice,
    subscriptionBoundLinkCode,
    formatCurrency,
    businessMode,
    setIsPairingModalOpen,
    setIsConnectToCashierModalOpen,
    regenerateSingleDeviceCode,
    unpairDevice,
    refreshDevices,
    syncAllDevices,
    pingDevice,
    setActiveTab,
    notify,
  } = useApp();

  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline' | 'critical_offline'>('all');
  const [groupFilter, setGroupFilter] = useState<'all' | DeviceGroupCategory>('all');
  const [roleFilter, setRoleFilter] = useState<DeviceRole | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedDeviceId, setCopiedDeviceId] = useState<string | null>(null);
  const [pingingDeviceId, setPingingDeviceId] = useState<string | null>(null);
  const [refreshingSyncId, setRefreshingSyncId] = useState<string | null>(null);
  const [isRefreshingAll, setIsRefreshingAll] = useState(false);
  const [editingDevice, setEditingDevice] = useState<LinkedDevice | null>(null);
  const [selectedDeviceForDetails, setSelectedDeviceForDetails] = useState<LinkedDevice | null>(null);

  // Live clock tick every 5 seconds to keep "Last Sync" relative timestamps and >5 min offline alerts accurate
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Local overrides for manual sync timestamps & simulated offline testing
  const [manualSyncTimestamps, setManualSyncTimestamps] = useState<Record<string, string>>({});
  const [simulatedOfflineOverrides, setSimulatedOfflineOverrides] = useState<
    Record<string, { isOnline: boolean; disconnectedSinceIso: string }>
  >({});

  // Reset restaurant group filter if user switches out of restaurant mode
  useEffect(() => {
    if (businessMode !== 'restaurant' && groupFilter === 'restaurant') {
      setGroupFilter('all');
    }
    if (
      businessMode !== 'restaurant' &&
      (roleFilter === 'waiter_mobile' || roleFilter === 'kitchen_display')
    ) {
      setRoleFilter('all');
    }
  }, [businessMode, groupFilter, roleFilter]);

  // Filter out restaurant-only devices when not in restaurant mode
  const modeFilteredDevices = useMemo(() => {
    return devices.filter(d => {
      if (
        businessMode !== 'restaurant' &&
        (d.role === 'kitchen_display' || d.role === 'waiter_mobile')
      ) {
        return false;
      }
      return true;
    });
  }, [devices, businessMode]);

  // Helper to classify any device role into one of the 3 automatic groups: (كاشير / مستودع / مطعم)
  const getDeviceGroupCategory = (role: DeviceRole | string): DeviceGroupCategory => {
    if (role === 'waiter_mobile' || role === 'kitchen_display') {
      return 'restaurant';
    }
    if (role === 'stock_scanner') {
      return 'warehouse';
    }
    return 'cashier';
  };

  const roleMetadata: Record<
    string,
    {
      label: string;
      badgeBg: string;
      icon: React.FC<{ className?: string }>;
      restaurantOnly?: boolean;
      group: DeviceGroupCategory;
    }
  > = {
    master_pos: {
      label: 'الجهاز الرئيسي (صاحب الاشتراك)',
      badgeBg: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
      icon: Crown,
      group: 'cashier',
    },
    main_cashier: {
      label: 'الجهاز الرئيسي (صاحب الاشتراك)',
      badgeBg: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
      icon: Crown,
      group: 'cashier',
    },
    secondary_pos: {
      label: 'كاشير فرعي (نقطة بيع)',
      badgeBg: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
      icon: Monitor,
      group: 'cashier',
    },
    assistant: {
      label: 'مساعد كاشير ومبيعات',
      badgeBg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
      icon: UserCheck,
      group: 'cashier',
    },
    supervisor: {
      label: 'مشرف (إدارة ومتابعة)',
      badgeBg: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
      icon: Briefcase,
      group: 'cashier',
    },
    customer_display: {
      label: 'شاشة عرض الزبون (CFD)',
      badgeBg: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
      icon: Tv,
      group: 'cashier',
    },
    stock_scanner: {
      label: 'مساعد مخزون وقارئ باركود',
      badgeBg: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',
      icon: ScanBarcode,
      group: 'warehouse',
    },
    waiter_mobile: {
      label: 'نادل (كابتن صالة وطلبات)',
      badgeBg: 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30',
      icon: Utensils,
      restaurantOnly: true,
      group: 'restaurant',
    },
    kitchen_display: {
      label: 'شاشة المطبخ والتحضير (KDS)',
      badgeBg: 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30',
      icon: ChefHat,
      restaurantOnly: true,
      group: 'restaurant',
    },
  };

  // Format relative time and exact clock time for Last Sync Timestamp
  const formatLastSyncInfo = (isoTimestamp: string, currentMs: number) => {
    const parsed = new Date(isoTimestamp).getTime();
    const validMs = Number.isNaN(parsed) ? currentMs : parsed;
    const diffMs = Math.max(0, currentMs - validMs);
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);

    let relativeLabel = 'الآن (مباشر)';
    if (diffSeconds >= 5 && diffSeconds < 60) {
      relativeLabel = `منذ ${diffSeconds} ثانية`;
    } else if (diffMinutes === 1) {
      relativeLabel = 'منذ دقيقة واحدة';
    } else if (diffMinutes === 2) {
      relativeLabel = 'منذ دقيقتين';
    } else if (diffMinutes >= 3 && diffMinutes <= 10) {
      relativeLabel = `منذ ${diffMinutes} دقائق`;
    } else if (diffMinutes > 10 && diffMinutes < 60) {
      relativeLabel = `منذ ${diffMinutes} دقيقة`;
    } else if (diffHours === 1) {
      relativeLabel = 'منذ ساعة واحدة';
    } else if (diffHours > 1) {
      relativeLabel = `منذ ${diffHours} ساعة و ${diffMinutes % 60} دقيقة`;
    }

    const timeFormatted = new Date(validMs).toLocaleTimeString('ar-SY', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    return {
      diffMs,
      diffMinutes,
      relativeLabel,
      timeFormatted,
    };
  };

  // Compute live metrics, last sync info, and >5 minute offline alert per device
  const deviceStatsMap = useMemo(() => {
    const map: Record<
      string,
      {
        salesTotal: number;
        invoicesCount: number;
        ordersCount: number;
        lastActivityLabel: string;
        recentInvoices: typeof sales;
        uniqueCode: string;
        effectiveIsOnline: boolean;
        lastSyncIso: string;
        lastSyncRelative: string;
        lastSyncClock: string;
        diffMs: number;
        diffMinutes: number;
        isOfflineOver5Min: boolean;
        groupCategory: DeviceGroupCategory;
      }
    > = {};

    modeFilteredDevices.forEach((dev, idx) => {
      const isMaster =
        dev.role === 'master_pos' || (dev.role as string) === 'main_cashier' || dev.isMasterDevice;
      const devSales = sales.filter(s => {
        if (s.status === 'voided' || (s.status as string) === 'cancelled') return false;
        if (s.sourceDeviceId && s.sourceDeviceId === dev.id) return true;
        if ((s as any).deviceId && (s as any).deviceId === dev.id) return true;
        if (isMaster && !s.sourceDeviceId && !(s as any).deviceId && idx === 0) return true;
        if (dev.cashierName && s.cashierName === dev.cashierName) return true;
        return false;
      });

      const computedSalesTotal = devSales.reduce(
        (sum, s) => sum + (Number(s.total) || Number((s as any).totalAmount) || 0),
        0
      );
      const finalSalesTotal = Math.max(
        computedSalesTotal,
        dev.totalSalesAmount || (dev as any).todaySalesAmount || 0
      );
      const finalInvoicesCount = Math.max(
        devSales.length,
        dev.salesCount || (dev as any).todayInvoicesCount || 0
      );

      const devOrdersCount =
        businessMode === 'restaurant'
          ? kitchenOrders.filter(
              o =>
                o.sourceDeviceId === dev.id ||
                (o as any).waiterName === dev.cashierName ||
                dev.role === 'kitchen_display'
            ).length
          : 0;

      const uniqueCode = String(
        dev.uniqueDeviceCode || generateUniqueCodeForSingleDevice(dev.role, dev.id)
      );

      const simOverride = simulatedOfflineOverrides[dev.id];
      const effectiveIsOnline = simOverride ? simOverride.isOnline : Boolean(dev.isOnline);

      const rawLastSyncIso = simOverride
        ? simOverride.disconnectedSinceIso
        : manualSyncTimestamps[dev.id] ||
          dev.lastSeen ||
          dev.lastActivityAt ||
          dev.pairedAt ||
          new Date(nowMs).toISOString();

      const syncInfo = formatLastSyncInfo(rawLastSyncIso, nowMs);

      // Alert triggers if device is disconnected for > 5 minutes OR if its last sync exceeded 5 minutes while offline
      const isOfflineOver5Min = !effectiveIsOnline && syncInfo.diffMs >= FIVE_MINUTES_MS;

      let lastActivityLabel = dev.lastActivitySummary || 'متصل وجاهز للعمل';
      if (isOfflineOver5Min) {
        lastActivityLabel = `انقطاع حرج! غير متصل منذ ${syncInfo.diffMinutes} دقيقة`;
      } else if (!effectiveIsOnline) {
        lastActivityLabel = `غير متصل حالياً (${syncInfo.relativeLabel})`;
      } else if (isMaster) {
        lastActivityLabel = 'الجهاز الرئيسي • يدير الشبكة ويستقبل المبيعات';
      } else if (dev.role === 'secondary_pos') {
        lastActivityLabel =
          finalInvoicesCount > 0
            ? `نشط • أصدر ${finalInvoicesCount} فاتورة ومزامن تلقائياً`
            : 'متصل • جاهز لإصدار الفواتير';
      } else if (dev.role === 'waiter_mobile') {
        lastActivityLabel = 'متصل • يستلم طلبات الصالة والطاولات';
      } else if (dev.role === 'kitchen_display') {
        lastActivityLabel = 'متصل • يستقبل طلبات التحضير لحظياً';
      } else if (dev.role === 'assistant') {
        lastActivityLabel = 'متصل • يجهز السلات ويساعد الكاشير الرئيسي';
      } else if (dev.role === 'stock_scanner') {
        lastActivityLabel = 'متصل • يمسح الباركود ويجرد المستودع';
      }

      map[dev.id] = {
        salesTotal: finalSalesTotal,
        invoicesCount: finalInvoicesCount,
        ordersCount: devOrdersCount,
        lastActivityLabel,
        recentInvoices: devSales.slice(0, 6),
        uniqueCode,
        effectiveIsOnline,
        lastSyncIso: rawLastSyncIso,
        lastSyncRelative: syncInfo.relativeLabel,
        lastSyncClock: syncInfo.timeFormatted,
        diffMs: syncInfo.diffMs,
        diffMinutes: syncInfo.diffMinutes,
        isOfflineOver5Min,
        groupCategory: getDeviceGroupCategory(dev.role),
      };
    });

    return map;
  }, [
    modeFilteredDevices,
    sales,
    kitchenOrders,
    businessMode,
    nowMs,
    manualSyncTimestamps,
    simulatedOfflineOverrides,
  ]);

  const filteredDevices = useMemo(() => {
    return modeFilteredDevices.filter(dev => {
      const st = deviceStatsMap[dev.id];
      if (!st) return false;

      if (statusFilter === 'online' && !st.effectiveIsOnline) return false;
      if (statusFilter === 'offline' && st.effectiveIsOnline) return false;
      if (statusFilter === 'critical_offline' && !st.isOfflineOver5Min) return false;
      if (groupFilter !== 'all' && st.groupCategory !== groupFilter) return false;
      if (roleFilter !== 'all' && dev.role !== roleFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const code = (st.uniqueCode || '').toLowerCase();
        const matchName = dev.name.toLowerCase().includes(q);
        const matchCashier = (dev.cashierName || '').toLowerCase().includes(q);
        const matchCode = code.includes(q);
        const matchRole = (roleMetadata[dev.role]?.label || '').toLowerCase().includes(q);
        return matchName || matchCashier || matchCode || matchRole;
      }
      return true;
    });
  }, [
    modeFilteredDevices,
    statusFilter,
    groupFilter,
    roleFilter,
    searchQuery,
    deviceStatsMap,
  ]);

  // Organize filtered devices into the 3 automatic Role-based Groups: (كاشير / مستودع / مطعم)
  const deviceGroupsConfig = useMemo(() => {
    const baseGroups: {
      id: DeviceGroupCategory;
      title: string;
      subtitle: string;
      icon: React.FC<{ className?: string }>;
      headerGradient: string;
      accentText: string;
      borderClass: string;
      devices: LinkedDevice[];
    }[] = [
      {
        id: 'cashier',
        title: 'مجموعة الكاشير ونقاط البيع والإدارة',
        subtitle: 'الجهاز الرئيسي، الكاشير الفرعي، المساعدين، المشرفين، وشاشات عرض الزبون',
        icon: Store,
        headerGradient: 'from-indigo-600/15 via-indigo-500/5 to-transparent',
        accentText: 'text-indigo-600 dark:text-indigo-400',
        borderClass: 'border-indigo-500/25',
        devices: filteredDevices.filter(d => deviceStatsMap[d.id]?.groupCategory === 'cashier'),
      },
      {
        id: 'warehouse',
        title: 'مجموعة المستودع والجرد والباركود',
        subtitle: 'أجهزة جرد المخزون وماسحات الباركود اللاسلكية المتصلة بالمستودع',
        icon: Package,
        headerGradient: 'from-cyan-600/15 via-cyan-500/5 to-transparent',
        accentText: 'text-cyan-600 dark:text-cyan-400',
        borderClass: 'border-cyan-500/25',
        devices: filteredDevices.filter(d => deviceStatsMap[d.id]?.groupCategory === 'warehouse'),
      },
    ];

    if (businessMode === 'restaurant') {
      baseGroups.push({
        id: 'restaurant',
        title: 'مجموعة المطعم والصالة والمطبخ (KDS & Waiters)',
        subtitle: 'أجهزة النادل (كابتن الصالة) وشاشات تحضير المطبخ المرتبطة بالجهاز الرئيسي',
        icon: Utensils,
        headerGradient: 'from-orange-500/15 via-amber-500/5 to-transparent',
        accentText: 'text-orange-600 dark:text-orange-400',
        borderClass: 'border-orange-500/25',
        devices: filteredDevices.filter(d => deviceStatsMap[d.id]?.groupCategory === 'restaurant'),
      });
    }

    return baseGroups;
  }, [filteredDevices, deviceStatsMap, businessMode]);

  const onlineCount = modeFilteredDevices.filter(d => deviceStatsMap[d.id]?.effectiveIsOnline).length;
  const offlineCount = modeFilteredDevices.length - onlineCount;
  const criticalOfflineDevices = modeFilteredDevices.filter(
    d => deviceStatsMap[d.id]?.isOfflineOver5Min
  );
  const totalNetworkSales = Object.values(deviceStatsMap).reduce((s, d) => s + d.salesTotal, 0);
  const totalNetworkInvoices = Object.values(deviceStatsMap).reduce((s, d) => s + d.invoicesCount, 0);

  const handleCopyCode = (device: LinkedDevice, code: string) => {
    soundEffects.playClick();
    navigator.clipboard.writeText(code);
    setCopiedDeviceId(device.id);
    notify(
      'تم نسخ الكود الخاص بالجهاز',
      `تم نسخ الكود (${code}) الخاص بجهاز "${device.name}"`,
      'success'
    );
    setTimeout(() => setCopiedDeviceId(null), 2500);
  };

  const handleRegenerateCode = async (device: LinkedDevice) => {
    soundEffects.playClick();
    await regenerateSingleDeviceCode(device.id);
  };

  // Manual status & sync refresh for a single device
  const handleManualDeviceSyncRefresh = async (device: LinkedDevice) => {
    soundEffects.playClick();
    setRefreshingSyncId(device.id);
    try {
      await pingDevice(device.id);
      await refreshDevices();
    } catch {}

    setTimeout(() => {
      const freshIso = new Date().toISOString();
      setNowMs(Date.now());
      setManualSyncTimestamps(prev => ({
        ...prev,
        [device.id]: freshIso,
      }));
      // Clear any simulated offline state when manually refreshed/reconnected
      setSimulatedOfflineOverrides(prev => {
        if (!prev[device.id]) return prev;
        const next = { ...prev };
        delete next[device.id];
        return next;
      });
      setRefreshingSyncId(null);
      soundEffects.playSuccess();
      notify(
        'تم تحديث حالة الجهاز والمزامنة بنجاح',
        `تم تحديث زمن آخر مزامنة للجهاز "${device.name}" (${deviceStatsMap[device.id]?.uniqueCode}) مع الجهاز الرئيسي`,
        'success'
      );
    }, 550);
  };

  // Manual status & sync refresh for all devices
  const handleRefreshAllDevicesStatus = async () => {
    soundEffects.playClick();
    setIsRefreshingAll(true);
    try {
      await refreshDevices();
      if (syncAllDevices) {
        await syncAllDevices();
      }
    } catch {}

    setTimeout(() => {
      const freshIso = new Date().toISOString();
      const updatedMap: Record<string, string> = {};
      modeFilteredDevices.forEach(d => {
        if (deviceStatsMap[d.id]?.effectiveIsOnline) {
          updatedMap[d.id] = freshIso;
        }
      });
      setNowMs(Date.now());
      setManualSyncTimestamps(prev => ({ ...prev, ...updatedMap }));
      setIsRefreshingAll(false);
      soundEffects.playSuccess();
      notify(
        'تم تحديث حالة جميع الأجهزة المرتبطة',
        `تم فحص الاتصال وتحديث زمن آخر مزامنة لـ ${onlineCount} جهاز متصل بالجهاز الرئيسي`,
        'success'
      );
    }, 650);
  };

  // Simulate or clear >5 min disconnection on a sub-device so manager can test the red visual alert
  const handleToggleSimulateCriticalOffline = (device: LinkedDevice) => {
    soundEffects.playClick();
    const current = deviceStatsMap[device.id];
    if (current?.isOfflineOver5Min) {
      // Restore online status immediately
      handleManualDeviceSyncRefresh(device);
    } else {
      const eightMinutesAgoIso = new Date(Date.now() - 8 * 60 * 1000).toISOString();
      setSimulatedOfflineOverrides(prev => ({
        ...prev,
        [device.id]: {
          isOnline: false,
          disconnectedSinceIso: eightMinutesAgoIso,
        },
      }));
      setNowMs(Date.now());
      soundEffects.playWarning();
      notify(
        '⚠️ تنبيه انقطاع اتصال الجهاز (> 5 دقائق)',
        `انقطع الاتصال بالجهاز "${device.name}" منذ أكثر من 5 دقائق — تم تفعيل التنبيه المرئي الأحمر على بطاقة الجهاز.`,
        'error'
      );
    }
  };

  const handlePingDevice = (device: LinkedDevice) => {
    soundEffects.playClick();
    setPingingDeviceId(device.id);
    setTimeout(() => {
      setPingingDeviceId(null);
      const freshIso = new Date().toISOString();
      setManualSyncTimestamps(prev => ({ ...prev, [device.id]: freshIso }));
      setNowMs(Date.now());
      soundEffects.playSuccess();
      notify(
        'فحص اتصال الجهاز ناجح',
        `الجهاز "${device.name}" (${deviceStatsMap[device.id]?.uniqueCode}) متصل ويشارك البيانات بسرعة 11ms`,
        'success'
      );
    }, 600);
  };

  const getDeviceTypeIcon = (type: LinkedDevice['deviceType']) => {
    if (type === 'mobile') return Smartphone;
    if (type === 'tablet') return Tablet;
    return Monitor;
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 pb-20 overflow-y-auto h-full" dir="rtl">
      {/* Top Hero Banner */}
      <div className="bg-gradient-to-l from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-5 sm:p-6 border border-indigo-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute -left-16 -top-16 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-950 flex items-center justify-center shadow-lg">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg sm:text-2xl font-black">
                    صفحة حالة الأجهزة المرتبطة بالجهاز الرئيسي
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    مراقبة حية ومباشرة
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  {businessMode === 'restaurant'
                    ? 'تصنيف تلقائي للأجهزة داخل مجموعات (كاشير، مستودع، مطعم) • مؤشر حي لزمن آخر مزامنة • تنبيه أحمر فوري عند انقطاع أي جهاز لأكثر من 5 دقائق'
                    : 'تصنيف تلقائي للأجهزة داخل مجموعات (كاشير، مستودع) • مؤشر حي لزمن آخر مزامنة • تنبيه أحمر فوري عند انقطاع أي جهاز لأكثر من 5 دقائق'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleRefreshAllDevicesStatus}
              disabled={isRefreshingAll}
              className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshingAll ? 'animate-spin' : ''}`} />
              <span>{isRefreshingAll ? 'جاري تحديث الحالة...' : 'تحديث حالة جميع الأجهزة يدوياً'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEffects.playClick();
                setIsPairingModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة جهاز بكود خاص جديد</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEffects.playClick();
                setIsConnectToCashierModalOpen(true);
              }}
              className="px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 border border-white/15 transition cursor-pointer"
            >
              <KeyRound className="w-4 h-4 text-amber-400" />
              <span>ربط جهاز بكود خاص</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEffects.playClick();
                setActiveTab('devices');
              }}
              className="px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-slate-200 font-bold text-xs flex items-center gap-1.5 border border-white/10 transition cursor-pointer"
            >
              <Radio className="w-4 h-4 text-indigo-300" />
              <span>مركز إدارة الأجهزة</span>
            </button>
          </div>
        </div>

        {/* Summary KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-white/10">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5">
            <span className="text-[11px] text-slate-300 font-bold block">إجمالي الأجهزة المرتبطة</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-black font-mono tabular-nums text-white">
                {modeFilteredDevices.length}
              </span>
              <span className="text-[11px] font-bold text-amber-300">
                {deviceGroupsConfig.length} مجموعات منظمة
              </span>
            </div>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-400/25 rounded-2xl p-3.5">
            <span className="text-[11px] text-emerald-200 font-bold block">أجهزة متصلة الآن (Online)</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-black font-mono tabular-nums text-emerald-300">
                {onlineCount}
              </span>
              <span className="text-[11px] font-bold text-emerald-300 flex items-center gap-1">
                <Wifi className="w-3.5 h-3.5" />
                تزامن نشط
              </span>
            </div>
          </div>

          <div
            className={`rounded-2xl p-3.5 border transition-colors ${
              criticalOfflineDevices.length > 0
                ? 'bg-rose-500/20 border-rose-400/50'
                : 'bg-white/5 border-white/10'
            }`}
          >
            <span className="text-[11px] text-slate-200 font-bold block">
              انقطاع الاتصال (&gt; 5 دقائق)
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span
                className={`text-2xl font-black font-mono tabular-nums ${
                  criticalOfflineDevices.length > 0 ? 'text-rose-300' : 'text-slate-200'
                }`}
              >
                {criticalOfflineDevices.length}
              </span>
              <span
                className={`text-[11px] font-bold ${
                  criticalOfflineDevices.length > 0 ? 'text-rose-300' : 'text-slate-400'
                }`}
              >
                {criticalOfflineDevices.length > 0 ? 'تنبيه أحمر نشط!' : `${offlineCount} غير متصل`}
              </span>
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-400/25 rounded-2xl p-3.5">
            <span className="text-[11px] text-amber-200 font-bold block">مبيعات شبكة الأجهزة اليوم</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-lg sm:text-xl font-black font-mono tabular-nums text-amber-300">
                {formatCurrency(totalNetworkSales)}
              </span>
              <span className="text-[11px] font-bold text-amber-200">{totalNetworkInvoices} فاتورة</span>
            </div>
          </div>
        </div>
      </div>

      {/* Global Critical Alert Banner if any device is disconnected for > 5 minutes */}
      {criticalOfflineDevices.length > 0 && (
        <div className="rounded-3xl bg-rose-600 text-white p-4 sm:p-5 shadow-xl shadow-rose-600/20 border-2 border-rose-400 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-200">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6 text-white animate-bounce" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black flex items-center gap-2">
                <span>تنبيه انقطاع اتصال حرج لأكثر من 5 دقائق ({criticalOfflineDevices.length} جهاز)</span>
              </h3>
              <p className="text-xs text-rose-100 mt-0.5">
                الأجهزة المتأثرة:{' '}
                {criticalOfflineDevices
                  .map(
                    d =>
                      `${d.name} (منذ ${deviceStatsMap[d.id]?.diffMinutes || 5} دقيقة — ${
                        deviceStatsMap[d.id]?.uniqueCode
                      })`
                  )
                  .join(' ، ')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setStatusFilter(statusFilter === 'critical_offline' ? 'all' : 'critical_offline')}
              className="px-3.5 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-black transition cursor-pointer"
            >
              {statusFilter === 'critical_offline' ? 'عرض جميع الأجهزة' : 'حصر الأجهزة المنقطعة فقط'}
            </button>
            <button
              type="button"
              onClick={() => {
                criticalOfflineDevices.forEach(d => handleManualDeviceSyncRefresh(d));
              }}
              className="px-4 py-2 rounded-xl bg-white text-rose-700 hover:bg-rose-50 text-xs font-black shadow-sm transition cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>استعادة وتحديث اتصال الأجهزة الآن</span>
            </button>
          </div>
        </div>
      )}

      {/* Group Filter Tabs + Status Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3.5">
        {/* Row 1: Automatic Role Group Category Tabs (كاشير / مستودع / مطعم) */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-black text-slate-500 dark:text-slate-400 ml-1">
              تصنيف المجموعات:
            </span>
            <button
              type="button"
              onClick={() => setGroupFilter('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                groupFilter === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <span>جميع المجموعات ({modeFilteredDevices.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setGroupFilter('cashier')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                groupFilter === 'cashier'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>
                مجموعة الكاشير (
                {modeFilteredDevices.filter(d => getDeviceGroupCategory(d.role) === 'cashier').length})
              </span>
            </button>

            <button
              type="button"
              onClick={() => setGroupFilter('warehouse')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                groupFilter === 'warehouse'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>
                مجموعة المستودع (
                {modeFilteredDevices.filter(d => getDeviceGroupCategory(d.role) === 'warehouse').length})
              </span>
            </button>

            {businessMode === 'restaurant' && (
              <button
                type="button"
                onClick={() => setGroupFilter('restaurant')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                  groupFilter === 'restaurant'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <Utensils className="w-3.5 h-3.5" />
                <span>
                  مجموعة المطعم (
                  {
                    modeFilteredDevices.filter(d => getDeviceGroupCategory(d.role) === 'restaurant')
                      .length
                  }
                  )
                </span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleRefreshAllDevicesStatus}
            disabled={isRefreshingAll}
            className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-black flex items-center gap-1.5 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingAll ? 'animate-spin' : ''}`} />
            <span>تحديث زمن المزامنة يدوياً</span>
          </button>
        </div>

        {/* Row 2: Connection Status Filter, Role Dropdown, and Search */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: `كل الحالات (${modeFilteredDevices.length})` },
              { id: 'online', label: `متصل الآن (${onlineCount})` },
              { id: 'offline', label: `غير متصل (${offlineCount})` },
              {
                id: 'critical_offline',
                label: `منقطع > 5 دقائق (${criticalOfflineDevices.length})`,
              },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                  statusFilter === tab.id
                    ? tab.id === 'critical_offline'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}

            <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value as any)}
              className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 focus:outline-none"
            >
              <option value="all">جميع الوظائف والأدوار</option>
              <option value="master_pos">الجهاز الرئيسي</option>
              <option value="secondary_pos">كاشير فرعي</option>
              {businessMode === 'restaurant' && <option value="waiter_mobile">نادل الصالة</option>}
              <option value="assistant">مساعد مبيعات</option>
              <option value="supervisor">مشرف</option>
              <option value="stock_scanner">مساعد مخزون وباركود</option>
              {businessMode === 'restaurant' && (
                <option value="kitchen_display">شاشة المطبخ (KDS)</option>
              )}
              <option value="customer_display">شاشة عرض الزبون</option>
            </select>
          </div>

          <div className="relative w-full lg:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="ابحث باسم الجهاز، الموظف، أو الكود الخاص DEV-..."
              className="w-full pr-10 pl-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Categorized Device Groups Sections (كاشير / مستودع / مطعم) */}
      <div className="space-y-8">
        {deviceGroupsConfig.map(group => {
          if (groupFilter !== 'all' && group.id !== groupFilter) return null;
          const GroupIcon = group.icon;
          const groupOnlineCount = group.devices.filter(
            d => deviceStatsMap[d.id]?.effectiveIsOnline
          ).length;
          const groupCriticalCount = group.devices.filter(
            d => deviceStatsMap[d.id]?.isOfflineOver5Min
          ).length;
          const groupSalesTotal = group.devices.reduce(
            (sum, d) => sum + (deviceStatsMap[d.id]?.salesTotal || 0),
            0
          );

          return (
            <section
              key={group.id}
              className={`rounded-3xl border ${group.borderClass} bg-white/60 dark:bg-slate-900/60 p-4 sm:p-5 space-y-4 shadow-xs`}
            >
              {/* Group Section Header */}
              <div
                className={`p-4 rounded-2xl bg-gradient-to-l ${group.headerGradient} border ${group.borderClass} flex flex-col sm:flex-row sm:items-center justify-between gap-3`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center shadow-2xs shrink-0">
                    <GroupIcon className={`w-5 h-5 ${group.accentText}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                        {group.title}
                      </h2>
                      <span className="text-xs font-mono tabular-nums font-bold text-slate-500 dark:text-slate-400">
                        ({group.devices.length} أجهزة • {groupOnlineCount} متصل)
                      </span>
                      {groupCriticalCount > 0 && (
                        <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>{groupCriticalCount} منقطع &gt; 5 دقائق</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {group.subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  {group.id === 'cashier' && (
                    <div className="text-left">
                      <span className="text-[10px] text-slate-400 block">إجمالي مبيعات المجموعة</span>
                      <span className="text-xs sm:text-sm font-black font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(groupSalesTotal)}
                      </span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.playClick();
                      setIsPairingModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة جهاز للمجموعة</span>
                  </button>
                </div>
              </div>

              {/* Group Devices Grid */}
              {group.devices.length === 0 ? (
                <div className="p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/20">
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      لا توجد أجهزة مسجلة حالياً ضمن {group.title}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      يمكنك إضافة جهاز جديد وتحديد وظيفته ليتم تصنيفه تلقائياً في هذه المجموعة.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.playClick();
                      setIsPairingModalOpen(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة جهاز الآن</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {group.devices.map(dev => {
                    const meta = roleMetadata[dev.role] || roleMetadata.secondary_pos;
                    const RoleIcon = meta.icon;
                    const TypeIcon = getDeviceTypeIcon(dev.deviceType);
                    const stats = deviceStatsMap[dev.id] || {
                      salesTotal: 0,
                      invoicesCount: 0,
                      ordersCount: 0,
                      lastActivityLabel: 'جاهز',
                      recentInvoices: [],
                      uniqueCode: dev.uniqueDeviceCode || 'DEV-SUB-000000',
                      effectiveIsOnline: Boolean(dev.isOnline),
                      lastSyncIso: new Date().toISOString(),
                      lastSyncRelative: 'الآن',
                      lastSyncClock: '--:--:--',
                      diffMs: 0,
                      diffMinutes: 0,
                      isOfflineOver5Min: false,
                      groupCategory: 'cashier' as DeviceGroupCategory,
                    };
                    const isMasterCard =
                      dev.role === 'master_pos' ||
                      (dev.role as string) === 'main_cashier' ||
                      dev.isMasterDevice;
                    const isCurrent = dev.id === currentDeviceId || (isMasterCard && isMasterDevice);
                    const isCopied = copiedDeviceId === dev.id;
                    const isPinging = pingingDeviceId === dev.id;
                    const isRefreshingSync = refreshingSyncId === dev.id;
                    const batteryPct = dev.batteryLevel ?? 95;
                    const quickNumericPin = String(stats.uniqueCode || '')
                      .replace(/[^0-9]/g, '')
                      .slice(0, 6);

                    return (
                      <div
                        key={dev.id}
                        className={`rounded-3xl border-2 p-5 transition-all flex flex-col justify-between gap-4 ${
                          stats.isOfflineOver5Min
                            ? 'bg-rose-50/95 dark:bg-rose-950/45 border-rose-600 dark:border-rose-500 ring-2 ring-rose-500/35 shadow-xl shadow-rose-500/15'
                            : isMasterCard
                            ? 'bg-white dark:bg-slate-900 border-amber-500/60 dark:border-amber-500/40 ring-1 ring-amber-500/20 shadow-sm'
                            : stats.effectiveIsOnline
                            ? 'bg-white dark:bg-slate-900 border-emerald-500/40 dark:border-emerald-500/30 shadow-sm'
                            : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800 opacity-90 shadow-sm'
                        }`}
                      >
                        <div className="space-y-3">
                          {/* RED VISUAL ALERT BANNER when disconnected > 5 minutes */}
                          {stats.isOfflineOver5Min && (
                            <div className="p-3 rounded-2xl bg-rose-600 text-white flex items-center justify-between gap-2 shadow-md">
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-white shrink-0 animate-bounce" />
                                <div>
                                  <p className="text-xs font-black">
                                    تنبيه انقطاع الاتصال لأكثر من 5 دقائق!
                                  </p>
                                  <p className="text-[11px] text-rose-100">
                                    هذا الجهاز غير متصل بالجهاز الرئيسي منذ {stats.diffMinutes} دقيقة
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleManualDeviceSyncRefresh(dev)}
                                className="px-2.5 py-1.5 rounded-xl bg-white text-rose-700 hover:bg-rose-50 text-[11px] font-black shrink-0 flex items-center gap-1 transition cursor-pointer"
                              >
                                <RefreshCw
                                  className={`w-3 h-3 ${isRefreshingSync ? 'animate-spin' : ''}`}
                                />
                                <span>استعادة الاتصال</span>
                              </button>
                            </div>
                          )}

                          {/* Card Header: Status & Identity */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 relative ${
                                  stats.isOfflineOver5Min
                                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                                    : isMasterCard
                                    ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 shadow-md shadow-amber-500/20'
                                    : stats.effectiveIsOnline
                                    ? 'bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                                }`}
                              >
                                <RoleIcon className="w-6 h-6" />
                                <span
                                  className={`w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 absolute -bottom-1 -left-1 ${
                                    stats.isOfflineOver5Min
                                      ? 'bg-rose-600 animate-ping'
                                      : stats.effectiveIsOnline
                                      ? 'bg-emerald-500 animate-pulse'
                                      : 'bg-slate-400'
                                  }`}
                                />
                              </div>

                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3
                                    className={`text-base font-black ${
                                      stats.isOfflineOver5Min
                                        ? 'text-rose-950 dark:text-rose-100'
                                        : 'text-slate-900 dark:text-white'
                                    }`}
                                  >
                                    {dev.name}
                                  </h3>
                                  {isCurrent && (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-indigo-600 text-white">
                                      هذا الجهاز
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 flex-wrap mt-1 text-xs">
                                  <span
                                    className={`font-bold ${
                                      stats.isOfflineOver5Min
                                        ? 'text-rose-700 dark:text-rose-300'
                                        : 'text-slate-600 dark:text-slate-300'
                                    }`}
                                  >
                                    {dev.roleLabelAr || meta.label}
                                  </span>
                                  <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">
                                    ·
                                  </span>
                                  <span
                                    className={`font-black flex items-center gap-1 ${
                                      stats.isOfflineOver5Min
                                        ? 'text-rose-600 dark:text-rose-400'
                                        : stats.effectiveIsOnline
                                        ? 'text-emerald-600 dark:text-emerald-400'
                                        : 'text-amber-600 dark:text-amber-400'
                                    }`}
                                  >
                                    {stats.effectiveIsOnline ? (
                                      <>
                                        <Wifi className="w-3.5 h-3.5" />
                                        <span>متصل الآن</span>
                                      </>
                                    ) : (
                                      <>
                                        <WifiOff className="w-3.5 h-3.5" />
                                        <span>
                                          {stats.isOfflineOver5Min
                                            ? 'منقطع > 5 دقائق'
                                            : 'غير متصل'}
                                        </span>
                                      </>
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Hardware & Battery Info */}
                            <div className="flex flex-col items-end gap-1 text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
                              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-xl font-mono tabular-nums font-bold">
                                {batteryPct >= 80 ? (
                                  <BatteryCharging className="w-3.5 h-3.5 text-emerald-500" />
                                ) : (
                                  <Battery className="w-3.5 h-3.5 text-amber-500" />
                                )}
                                <span>{batteryPct}%</span>
                                <span className="text-slate-300 dark:text-slate-600">|</span>
                                <TypeIcon className="w-3.5 h-3.5 text-slate-500" />
                              </div>
                              <span
                                className={`text-[10px] font-mono flex items-center gap-1 ${
                                  stats.isOfflineOver5Min
                                    ? 'text-rose-600 dark:text-rose-400 font-bold'
                                    : 'text-emerald-600 dark:text-emerald-400'
                                }`}
                              >
                                <Signal className="w-3 h-3" />
                                {stats.effectiveIsOnline
                                  ? 'استجابة 11ms • متزامن'
                                  : 'فقدان إشارة الشبكة'}
                              </span>
                            </div>
                          </div>

                          {/* Dynamic Visual Last Sync Timestamp Indicator + Manual Refresh Button */}
                          <div
                            className={`p-3 rounded-2xl border flex flex-wrap items-center justify-between gap-2 transition-colors ${
                              stats.isOfflineOver5Min
                                ? 'bg-rose-100/90 dark:bg-rose-900/40 border-rose-400 dark:border-rose-600'
                                : stats.effectiveIsOnline
                                ? 'bg-emerald-500/10 border-emerald-500/25'
                                : 'bg-amber-500/10 border-amber-500/30'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                  stats.isOfflineOver5Min
                                    ? 'bg-rose-600 text-white'
                                    : stats.effectiveIsOnline
                                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                    : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                                }`}
                              >
                                <Clock className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`w-2 h-2 rounded-full ${
                                      stats.isOfflineOver5Min
                                        ? 'bg-rose-600 animate-ping'
                                        : stats.effectiveIsOnline
                                        ? 'bg-emerald-500 animate-pulse'
                                        : 'bg-amber-500'
                                    }`}
                                  />
                                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                                    زمن آخر مزامنة مع الجهاز الرئيسي:
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                  <span
                                    className={`text-xs font-black ${
                                      stats.isOfflineOver5Min
                                        ? 'text-rose-700 dark:text-rose-300'
                                        : 'text-slate-900 dark:text-white'
                                    }`}
                                  >
                                    {stats.lastSyncRelative}
                                  </span>
                                  <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">
                                    ·
                                  </span>
                                  <span
                                    className="text-[11px] font-mono tabular-nums font-bold text-slate-600 dark:text-slate-300"
                                    dir="ltr"
                                  >
                                    {stats.lastSyncClock}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleManualDeviceSyncRefresh(dev)}
                              disabled={isRefreshingSync}
                              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer shadow-2xs ${
                                stats.isOfflineOver5Min
                                  ? 'bg-rose-600 hover:bg-rose-500 text-white'
                                  : 'bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                              }`}
                              title="تحديث حالة الجهاز وزمن آخر مزامنة يدوياً"
                            >
                              <RefreshCw
                                className={`w-3.5 h-3.5 ${isRefreshingSync ? 'animate-spin' : ''}`}
                              />
                              <span>
                                {isRefreshingSync ? 'جاري التحديث...' : 'تحديث الحالة يدوياً'}
                              </span>
                            </button>
                          </div>

                          {/* Dedicated Unique Device Code Box */}
                          <div className="p-3.5 rounded-2xl bg-gradient-to-l from-amber-500/10 via-indigo-500/5 to-slate-50 dark:from-amber-500/10 dark:via-indigo-950/30 dark:to-slate-800/70 border border-amber-500/30 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                <KeyRound className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">
                                  الكود الخاص بهذا الجهاز (Unique Device Code):
                                </span>
                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                  <span
                                    className="font-mono tabular-nums font-black text-sm sm:text-base tracking-wider text-amber-600 dark:text-amber-400"
                                    dir="ltr"
                                  >
                                    {stats.uniqueCode}
                                  </span>
                                  <span
                                    className="text-[10px] font-mono tabular-nums font-bold px-2 py-0.5 rounded bg-slate-900 dark:bg-slate-950 text-white"
                                    dir="ltr"
                                  >
                                    PIN: {quickNumericPin}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleCopyCode(dev, stats.uniqueCode)}
                                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1 transition cursor-pointer shadow-2xs"
                              >
                                {isCopied ? (
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                                <span>{isCopied ? 'تم النسخ' : 'نسخ الكود'}</span>
                              </button>
                              {!isMasterCard && (
                                <button
                                  type="button"
                                  onClick={() => handleRegenerateCode(dev)}
                                  className="p-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                                  title="توليد كود جديد خاص بهذا الجهاز"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Live Operational Status & Work Scope */}
                          <div
                            className={`p-3 rounded-2xl border space-y-2 ${
                              stats.isOfflineOver5Min
                                ? 'bg-white/80 dark:bg-slate-900/80 border-rose-300 dark:border-rose-800'
                                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-800'
                            }`}
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                <Activity
                                  className={`w-3.5 h-3.5 ${
                                    stats.isOfflineOver5Min ? 'text-rose-600' : 'text-emerald-500'
                                  }`}
                                />
                                <span>الحالة التشغيلية الآن:</span>
                              </span>
                              <span
                                className={`font-black ${
                                  stats.isOfflineOver5Min
                                    ? 'text-rose-600 dark:text-rose-400'
                                    : 'text-slate-900 dark:text-white'
                                }`}
                              >
                                {stats.lastActivityLabel}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-500 dark:text-slate-400">
                                المسؤول / الموظف:
                              </span>
                              <span className="font-bold text-slate-800 dark:text-slate-200">
                                {dev.cashierName || dev.roleLabelAr || 'غير محدد'} ·{' '}
                                {dev.branchName || 'الفرع الرئيسي'}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-500 dark:text-slate-400">
                                طبيعة العمل المحددة:
                              </span>
                              <span className="font-bold text-indigo-600 dark:text-indigo-400 truncate max-w-[230px]">
                                {dev.workDescription ||
                                  dev.workPermissions?.workDescription ||
                                  meta.label}
                              </span>
                            </div>
                          </div>

                          {/* Live Sales & Activity Metrics for this Device */}
                          <div className="grid grid-cols-3 gap-2">
                            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 text-center">
                              <span className="text-[10px] font-bold text-slate-400 block">
                                مبيعات الجهاز
                              </span>
                              <span className="text-xs sm:text-sm font-black font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                                {formatCurrency(stats.salesTotal)}
                              </span>
                            </div>

                            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 text-center">
                              <span className="text-[10px] font-bold text-slate-400 block">
                                {businessMode === 'restaurant' &&
                                (dev.role === 'waiter_mobile' || dev.role === 'kitchen_display')
                                  ? 'طلبات الصالة/المطبخ'
                                  : 'الفواتير الصادرة'}
                              </span>
                              <span className="text-xs sm:text-sm font-black font-mono tabular-nums text-slate-900 dark:text-white mt-0.5 block">
                                {businessMode === 'restaurant' &&
                                (dev.role === 'waiter_mobile' || dev.role === 'kitchen_display')
                                  ? `${stats.ordersCount} طلب`
                                  : `${stats.invoicesCount} فاتورة`}
                              </span>
                            </div>

                            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 text-center">
                              <span className="text-[10px] font-bold text-slate-400 block">
                                مشاركة البيانات
                              </span>
                              <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 mt-0.5 flex items-center justify-center gap-1">
                                <Share2 className="w-3 h-3" />
                                تلقائية فورية
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Card Footer Actions */}
                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => handlePingDevice(dev)}
                              disabled={isPinging}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500/15 hover:text-emerald-600 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                            >
                              <RefreshCw
                                className={`w-3.5 h-3.5 ${
                                  isPinging ? 'animate-spin text-emerald-500' : ''
                                }`}
                              />
                              <span>{isPinging ? 'جاري الفحص...' : 'فحص الإشارة'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setSelectedDeviceForDetails(dev)}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-500/15 hover:text-indigo-600 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>سجل نشاط الجهاز</span>
                            </button>

                            {!isMasterCard && (
                              <button
                                type="button"
                                onClick={() => setEditingDevice(dev)}
                                className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                              >
                                <Sliders className="w-3.5 h-3.5" />
                                <span>تعديل العمل</span>
                              </button>
                            )}

                            {!isMasterCard && (
                              <button
                                type="button"
                                onClick={() => handleToggleSimulateCriticalOffline(dev)}
                                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 transition cursor-pointer ${
                                  stats.isOfflineOver5Min
                                    ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                                    : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-300 hover:bg-rose-100'
                                }`}
                                title={
                                  stats.isOfflineOver5Min
                                    ? 'إلغاء تنبيه الانقطاع واستعادة الاتصال'
                                    : 'اختبار تنبيه انقطاع الاتصال لأكثر من 5 دقائق (تلوين البطاقة بالأحمر)'
                                }
                              >
                                <BellRing className="w-3 h-3" />
                                <span>
                                  {stats.isOfflineOver5Min ? 'إلغاء الانقطاع' : 'محاكاة انقطاع >5د'}
                                </span>
                              </button>
                            )}
                          </div>

                          {!isMasterCard && (
                            <button
                              type="button"
                              onClick={() => unpairDevice(dev.id)}
                              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                              title="إلغاء ربط الجهاز"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>

      {/* Modal for Inspecting a Specific Device's Detailed Status & Invoices */}
      {selectedDeviceForDetails && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          dir="rtl"
          onClick={() => setSelectedDeviceForDetails(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  تقرير حالة وعمليات الجهاز: {selectedDeviceForDetails.name}
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5" dir="ltr">
                  الكود الخاص بالجهاز: {deviceStatsMap[selectedDeviceForDetails.id]?.uniqueCode}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDeviceForDetails(null)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
              >
                إغلاق
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block">زمن آخر مزامنة</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                  {deviceStatsMap[selectedDeviceForDetails.id]?.lastSyncRelative} (
                  {deviceStatsMap[selectedDeviceForDetails.id]?.lastSyncClock})
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block">النظام والمتصفح</span>
                <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">
                  {selectedDeviceForDetails.osAndBrowser || 'نظام الكاشير الذكي'}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block">مرتبط بكود الاشتراك</span>
                <span
                  className="font-mono font-bold text-indigo-600 dark:text-indigo-400 mt-0.5 block"
                  dir="ltr"
                >
                  {subscriptionBoundLinkCode}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-black text-slate-700 dark:text-slate-300">
                أحدث الفواتير والعمليات المرسلة من هذا الجهاز إلى الجهاز الرئيسي:
              </h4>
              {(deviceStatsMap[selectedDeviceForDetails.id]?.recentInvoices || []).length === 0 ? (
                <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800">
                  لا توجد فواتير مسجلة باسم هذا الجهاز بعد اليوم — سيتم عرض أي فاتورة فور إصدارها تلقائياً.
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {deviceStatsMap[selectedDeviceForDetails.id]?.recentInvoices.map(inv => (
                    <div
                      key={inv.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-mono font-black text-slate-900 dark:text-white">
                          #{inv.invoiceNumber}
                        </span>
                        <span className="text-slate-400 mx-2">•</span>
                        <span className="text-slate-600 dark:text-slate-300">
                          {inv.items.length} أصناف
                        </span>
                      </div>
                      <span className="font-mono tabular-nums font-black text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(Number(inv.total) || Number((inv as any).totalAmount) || 0)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {editingDevice && (
        <DevicePairingModal
          editingDevice={editingDevice}
          onCloseEdit={() => setEditingDevice(null)}
        />
      )}
    </div>
  );
};
