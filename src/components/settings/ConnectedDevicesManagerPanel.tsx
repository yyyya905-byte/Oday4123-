import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { LinkedDevice, DeviceRole, DeviceWorkPermissions } from '../../types';
import {
  Monitor,
  Tablet,
  Smartphone,
  Tv,
  Wifi,
  WifiOff,
  Crown,
  Plus,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Sliders,
  ShieldCheck,
  Zap,
  KeyRound,
  Eye,
  EyeOff,
  Trash2,
  Activity,
  Send,
  Sparkles,
  ShoppingBag,
  ChefHat,
  Utensils,
  UserCheck,
  Laptop
} from 'lucide-react';
import {
  DEVICE_ROLE_WORK_PRESETS,
  RoleWorkPreset
} from '../../utils/licenseUtils';
import { DevicePermissionsModal } from '../modals/DevicePermissionsModal';
import { soundEffects } from '../../services/audio';

export const ConnectedDevicesManagerPanel: React.FC = () => {
  const {
    devices,
    connectedDevices = devices,
    removeConnectedDevice,
    updateDeviceAllowedPages,
    criticalOfflineDevices = [],
    isMasterDevice,
    currentDeviceName,
    currentSubDeviceUserName,
    masterPairingPin,
    refreshMasterPin,
    disconnectDevice,
    unpairDevice,
    updateSubDeviceRoleAndWork,
    simulateSubDeviceSale,
    regenerateSingleDeviceCode,
    pingDevice,
    syncAllDevices,
    setIsPairingModalOpen,
    notify,
    businessMode,
  } = useApp();

  const [permissionsDevice, setPermissionsDevice] = useState<LinkedDevice | null>(null);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<'all' | DeviceRole>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline'>('all');
  const [showPin, setShowPin] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pingingDeviceId, setPingingDeviceId] = useState<string | null>(null);
  const [simulatingDeviceId, setSimulatingDeviceId] = useState<string | null>(null);
  const [expandedPermissionsDeviceId, setExpandedPermissionsDeviceId] = useState<string | null>(null);

  // Filtered devices list
  const filteredDevices = useMemo(() => {
    return devices.filter(dev => {
      // Role filter
      if (selectedRoleFilter !== 'all' && dev.role !== selectedRoleFilter) {
        return false;
      }
      // Status filter
      if (statusFilter === 'online' && !dev.isOnline) return false;
      if (statusFilter === 'offline' && dev.isOnline) return false;

      // Text search
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchesName = (dev.name || '').toLowerCase().includes(query);
        const matchesUser = (dev.connectedUserName || dev.cashierName || '').toLowerCase().includes(query);
        const matchesCode = (dev.uniqueDeviceCode || dev.pairingCode || '').toLowerCase().includes(query);
        const matchesIp = (dev.ipAddress || '').toLowerCase().includes(query);
        const matchesRole = (dev.roleLabelAr || '').toLowerCase().includes(query);
        return matchesName || matchesUser || matchesCode || matchesIp || matchesRole;
      }

      return true;
    });
  }, [devices, selectedRoleFilter, statusFilter, searchQuery]);

  const totalDevicesCount = devices.length;
  const onlineDevicesCount = devices.filter(d => d.isOnline).length;
  const offlineDevicesCount = totalDevicesCount - onlineDevicesCount;

  // Handle instant full network sync
  const handleFullSync = async () => {
    setIsSyncing(true);
    soundEffects.playGlassPress();
    try {
      await syncAllDevices();
      soundEffects.playSuccess();
      notify('تمت المزامنة الفورية لكافة أجهزة الشبكة', 'البيانات والمبيعات والمخزون محدثة على جميع الشاشات', 'success');
    } catch {
      notify('تنبيه المزامنة', 'تعذر استكمال المزامنة مع بعض الأجهزة غير المتصلة', 'warning');
    } finally {
      setIsSyncing(false);
    }
  };

  // One-click instant role switch
  const handleQuickRoleChange = async (device: LinkedDevice, newRole: DeviceRole) => {
    soundEffects.playClick();
    const preset: RoleWorkPreset = DEVICE_ROLE_WORK_PRESETS[newRole] || DEVICE_ROLE_WORK_PRESETS.secondary_pos;
    
    try {
      await updateSubDeviceRoleAndWork(device.id, {
        role: newRole,
        roleLabelAr: preset.labelAr,
        workDescription: preset.workDescriptionAr,
        workPermissions: {
          ...preset.permissions,
          autoShareDataWithMaster: true,
        },
      });

      soundEffects.playSuccess();
      notify(
        'تم تحديث دور وصلاحيات الجهاز بنجاح',
        `تم تحويل الجهاز "${device.name}" إلى: ${preset.labelAr}`,
        'success'
      );
    } catch (err: any) {
      notify('خطأ في تحديث الصلاحيات', err?.message || 'تعذر حفظ الدور الجديد', 'error');
    }
  };

  // Toggle specific permission
  const handleTogglePermission = async (
    device: LinkedDevice,
    permissionKey: keyof DeviceWorkPermissions,
    currentValue: boolean
  ) => {
    soundEffects.playClick();
    const currentPermissions = device.workPermissions || DEVICE_ROLE_WORK_PRESETS[device.role]?.permissions || {
      allowPosSales: true,
      allowTableOrders: false,
      allowCatalogAndStock: false,
      allowCustomersAndDebts: false,
      allowExpenses: false,
      allowKitchenDisplay: false,
      autoShareDataWithMaster: true,
    };

    const updatedPermissions: DeviceWorkPermissions = {
      ...currentPermissions,
      [permissionKey]: !currentValue,
    };

    try {
      await updateSubDeviceRoleAndWork(device.id, {
        workPermissions: updatedPermissions,
      });
      notify('تم تحديث الصلاحية', `تم تعديل الإذن بنجاح للجهاز "${device.name}"`, 'success');
    } catch {
      notify('خطأ', 'تعذر تحديث الصلاحية', 'error');
    }
  };

  // One-click disconnect
  const handleDisconnect = async (device: LinkedDevice) => {
    soundEffects.playWarning();
    try {
      if (removeConnectedDevice) {
        await removeConnectedDevice(device.id);
      } else {
        await disconnectDevice(device.id);
      }
      notify('تم فصل الجهاز بنجاح', `تم إنهاء جلسة اتصال "${device.name}" بالشبكة وإزالته فورياً`, 'info');
    } catch {
      notify('خطأ', 'تعذر فصل الجهاز', 'error');
    }
  };

  // Test ping
  const handlePing = async (device: LinkedDevice) => {
    setPingingDeviceId(device.id);
    soundEffects.playGlassTap();
    try {
      await pingDevice(device.id);
      soundEffects.playSuccess();
      notify('استجابة فحص الاتصال (Ping)', `الجهاز "${device.name}" متصل ومستجيب بالشبكة اللحظية`, 'success');
    } catch {
      notify('فحص الاتصال', `الجهاز "${device.name}" لم يستجب للإشارة الشبكية`, 'warning');
    } finally {
      setPingingDeviceId(null);
    }
  };

  // Test simulate sale
  const handleSimulateSale = async (device: LinkedDevice) => {
    setSimulatingDeviceId(device.id);
    soundEffects.play('cash_drawer');
    try {
      const sale = await simulateSubDeviceSale(device);
      if (sale) {
        soundEffects.saleSuccess();
        notify('نجحت تجربة البيع الشبكي!', `تم تسجيل فاتورة تجريبية برقم ${sale.invoiceNumber} مرسلة من ${device.name}`, 'success');
      }
    } catch {
      notify('خطأ في تجربة البيع', 'تعذر إرسال الفاتورة التجريبية', 'error');
    } finally {
      setSimulatingDeviceId(null);
    }
  };

  // Regenerate pairing code
  const handleRegenerateCode = async (device: LinkedDevice) => {
    soundEffects.playGlassTap();
    try {
      const newCode = await regenerateSingleDeviceCode(device.id);
      soundEffects.playSuccess();
      notify('تم تجديد كود الربط', `الكود الجديد للجهاز "${device.name}" هو: ${newCode}`, 'success');
    } catch {
      notify('خطأ', 'تعذر تجديد كود الجهاز', 'error');
    }
  };

  // Unpair completely
  const handleUnpair = async (device: LinkedDevice) => {
    soundEffects.play('trash');
    if (window.confirm(`هل أنت متأكد من إلغاء اقتران وحذف الجهاز "${device.name}" نهائياً من الشبكة؟`)) {
      try {
        await unpairDevice(device.id);
        notify('تم حذف الجهاز', `تمت إزالة "${device.name}" من قائمة الأجهزة المقترنة`, 'info');
      } catch {
        notify('خطأ', 'تعذر حذف الجهاز', 'error');
      }
    }
  };

  const getDeviceIcon = (dev: LinkedDevice) => {
    if (dev.role === 'kitchen_display') return Tv;
    if (dev.role === 'customer_display') return Monitor;
    if (dev.role === 'waiter_mobile') return Smartphone;
    if (dev.deviceType === 'mobile') return Smartphone;
    if (dev.deviceType === 'tablet') return Tablet;
    return Laptop;
  };

  return (
    <div className="space-y-6 text-start">
      {/* Visual Alert Banner for Critical Disconnected Devices (شاشات المطبخ أو الكاشير الفرعي) */}
      {criticalOfflineDevices && criticalOfflineDevices.length > 0 && (
        <div className="bg-rose-500/15 border-2 border-rose-500 text-rose-950 dark:text-rose-100 p-4 sm:p-5 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-pulse shadow-lg">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-md">
              <AlertTriangle className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-sm sm:text-base text-rose-900 dark:text-rose-100">
                  ⚠️ تنبيه بصري هام: فقدان الاتصال بـ ({criticalOfflineDevices.length}) أجهزة أساسية في النظام!
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black">
                  انقطاع حرج
                </span>
              </div>
              <p className="text-xs text-rose-700 dark:text-rose-300 mt-1">
                الأجهزة المتأثرة: {criticalOfflineDevices.map(d => `${d.name} (${d.roleLabelAr || (d.role === 'kitchen_display' ? 'شاشة مطبخ KDS' : 'كاشير فرعي')})`).join('، ')}. يرجى فحص الشبكة وتشغيل الأجهزة.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleFullSync}
            disabled={isSyncing}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-black text-xs transition flex items-center gap-2 cursor-pointer shadow-md shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>إعادة فحص الاتصال</span>
          </button>
        </div>
      )}

      {/* 1. Header & Live Network Summary Bar */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 sm:p-6 rounded-3xl shadow-lg border border-slate-700/60 relative overflow-hidden">
        <div className="absolute top-0 end-0 -mt-8 -me-8 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 start-0 -mb-8 -ms-8 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Radio className="w-5 h-5 animate-pulse" />
              </span>
              <h2 className="text-lg sm:text-xl font-black tracking-tight">
                إدارة الأجهزة المتصلة وشبكة الكاشير (Mesh Terminals)
              </h2>
              {/* Visual Badge Indicator */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-mono font-bold">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                  <span>{onlineDevicesCount} متصل حالياً</span>
                </span>
                <span className="text-slate-400">|</span>
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
                  <span>{offlineDevicesCount} غير نشط</span>
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
              عرض ومراقبة كافة أجهزة الكاشير الفرعية، شاشات المطبخ (KDS)، أجهزة النوادل، وشاشات العملاء. يمكنك فصل أي جهاز أو تغيير صلاحياته بضغطة زر واحدة.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleFullSync}
              disabled={isSyncing}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 text-xs font-bold text-white flex items-center gap-2 transition cursor-pointer border border-white/10"
              title="مزامنة فورية لكافة المبيعات والمخزون والطلبات بين جميع الشاشات"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-amber-400' : ''}`} />
              <span>{isSyncing ? 'جارٍ المزامنة...' : 'مزامنة الشبكة فورياً'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEffects.playGlassPress();
                setIsPairingModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 active:scale-95 text-slate-950 text-xs font-black flex items-center gap-2 transition shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>إضافة وربط جهاز جديد</span>
            </button>
          </div>
        </div>

        {/* Live Counters Metric Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mt-5 pt-4 border-t border-white/10">
          <div className="bg-white/5 rounded-2xl p-2.5 sm:p-3 border border-white/5">
            <span className="text-[11px] text-slate-400 block font-medium">إجمالي الأجهزة المسجلة</span>
            <div className="flex items-center gap-2 mt-1">
              <Monitor className="w-4 h-4 text-indigo-400" />
              <span className="text-lg font-black font-mono">{totalDevicesCount}</span>
            </div>
          </div>

          <div className="bg-emerald-500/10 rounded-2xl p-2.5 sm:p-3 border border-emerald-500/20">
            <span className="text-[11px] text-emerald-300 block font-medium">متصل ونشط حالياً</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
              <span className="text-lg font-black font-mono text-emerald-400">{onlineDevicesCount}</span>
            </div>
          </div>

          <div className="bg-white/5 rounded-2xl p-2.5 sm:p-3 border border-white/5">
            <span className="text-[11px] text-slate-400 block font-medium">غير متصل (Standby)</span>
            <div className="flex items-center gap-2 mt-1">
              <WifiOff className="w-4 h-4 text-slate-400" />
              <span className="text-lg font-black font-mono text-slate-300">{offlineDevicesCount}</span>
            </div>
          </div>

          <div className="bg-amber-500/10 rounded-2xl p-2.5 sm:p-3 border border-amber-500/20">
            <span className="text-[11px] text-amber-300 block font-medium">صفة جهازك الحالي</span>
            <div className="flex items-center gap-1.5 mt-1">
              {isMasterDevice ? (
                <>
                  <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-xs font-black text-amber-300 truncate">الجهاز الرئيسي (Master)</span>
                </>
              ) : (
                <>
                  <Laptop className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span className="text-xs font-black text-indigo-300 truncate">{currentDeviceName || 'جهاز تابع'}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Master Pairing Security & PIN Info Card */}
      {isMasterDevice && (
        <div className="bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>رمز إقران الجهاز الرئيسي (Master PIN)</span>
                <span className="px-1.5 py-0.2 rounded-md bg-amber-200 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 text-[10px] font-mono font-bold">
                  سري وآمن
                </span>
              </h3>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                يُطلب هذا الرمز على الأجهزة الفرعية للتحقق من هوية المتجر وربط الكاشير بنجاح.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 px-3 py-1.5 rounded-xl">
              <span className="font-mono text-sm font-black tracking-widest text-slate-900 dark:text-white">
                {showPin ? masterPairingPin || '1234' : '••••'}
              </span>
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                title={showPin ? 'إخفاء' : 'عرض الرمز'}
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <button
              type="button"
              onClick={async () => {
                soundEffects.playGlassTap();
                const newPin = await refreshMasterPin();
                notify('تم توليد رمز PIN جديد', `الرمز الجديد للربط: ${newPin}`, 'success');
              }}
              className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 border border-amber-500/30 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              title="تجديد رمز الـ PIN في حال تسريبه"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>تجديد الرمز</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. Filters & Search Control Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-2xs">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالاسم، الكاشير، كود الربط أو IP..."
            className="w-full ps-9 pe-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs shrink-0">
            <span className="text-[11px] font-bold text-slate-500 px-2 flex items-center gap-1">
              <Filter className="w-3 h-3" />
              <span>الحالة:</span>
            </span>
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer text-xs ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              الكل ({devices.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('online')}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer text-xs ${
                statusFilter === 'online'
                  ? 'bg-emerald-500 text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              نشط ({onlineDevicesCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('offline')}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer text-xs ${
                statusFilter === 'offline'
                  ? 'bg-slate-600 text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              غير متصل ({offlineDevicesCount})
            </button>
          </div>
        </div>
      </div>

      {/* 4. Connected Devices Cards Grid */}
      <div className="space-y-4">
        {filteredDevices.length === 0 ? (
          <div className="bg-white dark:bg-slate-900/60 rounded-3xl p-8 border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
              <Monitor className="w-7 h-7" />
            </div>
            <h3 className="font-black text-slate-900 dark:text-white text-sm">
              لا توجد أجهزة مطابقة للبحث أو الفلتر
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              يمكنك ربط جهاز كاشير فرعي، أو شاشة مطبخ (KDS)، أو جهاز نادل إضافي لمشاركة الفواتير تلقائياً مع هذا الجهاز.
            </p>
            <button
              type="button"
              onClick={() => setIsPairingModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition cursor-pointer"
            >
              ربط جهاز جديد الآن
            </button>
          </div>
        ) : (
          filteredDevices.map((dev) => {
            const Icon = getDeviceIcon(dev);
            const isThisCurrentDevice =
              (isMasterDevice && dev.isMasterDevice) ||
              (!isMasterDevice && dev.name === currentDeviceName);
            const isDeviceOnline = dev.isOnline;
            const isExpanded = expandedPermissionsDeviceId === dev.id;

            return (
              <div
                key={dev.id}
                className={`bg-white dark:bg-slate-900/80 rounded-2xl border transition-all overflow-hidden ${
                  dev.isMasterDevice
                    ? 'border-amber-400/80 dark:border-amber-500/40 shadow-xs'
                    : isDeviceOnline
                    ? 'border-emerald-500/30 hover:border-emerald-500/60 shadow-2xs'
                    : 'border-slate-200 dark:border-slate-800 opacity-90'
                }`}
              >
                {/* Main Card Header & Summary */}
                <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Device Icon, Name & Status */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="relative shrink-0 mt-0.5">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs ${
                        dev.isMasterDevice
                          ? 'bg-amber-500 text-slate-950'
                          : isDeviceOnline
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                      }`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <span
                        className={`absolute -bottom-1 -end-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 ${
                          isDeviceOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                        }`}
                        title={isDeviceOnline ? 'متصل بالشبكة الحية' : 'غير متصل'}
                      />
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-black text-sm text-slate-900 dark:text-white truncate">
                          {dev.name}
                        </h4>

                        {dev.isMasterDevice && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                            <Crown className="w-3 h-3 text-amber-500" />
                            الجهاز الرئيسي
                          </span>
                        )}

                        {isThisCurrentDevice && (
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                            هذا الجهاز الحالي
                          </span>
                        )}

                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                            isDeviceOnline
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {isDeviceOnline ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              متصل بالبث الحي
                            </>
                          ) : (
                            <>
                              <WifiOff className="w-3 h-3 text-slate-400" />
                              غير متصل
                            </>
                          )}
                        </span>
                      </div>

                      {/* Device Meta Details */}
                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                        {dev.connectedUserName && (
                          <span className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-300">
                            <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                            المستخدم: {dev.connectedUserName}
                          </span>
                        )}
                        {dev.uniqueDeviceCode && (
                          <span className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                            كود: {dev.uniqueDeviceCode}
                          </span>
                        )}
                        {dev.ipAddress && (
                          <span className="font-mono text-[11px]">
                            IP: {dev.ipAddress}
                          </span>
                        )}
                        {dev.batteryLevel !== undefined && (
                          <span className="text-[11px]">
                            🔋 {dev.batteryLevel}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Actions: Test Signal, Disconnect, etc. */}
                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    {!dev.isMasterDevice && (
                      <>
                        {/* Ping Button */}
                        <button
                          type="button"
                          onClick={() => handlePing(dev)}
                          disabled={pingingDeviceId === dev.id}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                          title="إرسال إشارة نبضية للتأكد من استجابة الجهاز الآن"
                        >
                          <Activity className={`w-3.5 h-3.5 text-blue-500 ${pingingDeviceId === dev.id ? 'animate-spin' : ''}`} />
                          <span>فحص (Ping)</span>
                        </button>

                        {/* Simulate Test Sale */}
                        <button
                          type="button"
                          onClick={() => handleSimulateSale(dev)}
                          disabled={simulatingDeviceId === dev.id}
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                          title="إرسال فاتورة تجريبية عبر الشبكة للتأكد من المزامنة"
                        >
                          <Zap className={`w-3.5 h-3.5 text-emerald-500 ${simulatingDeviceId === dev.id ? 'animate-bounce' : ''}`} />
                          <span>تجربة بيع</span>
                        </button>

                        {/* Regenerate Code */}
                        <button
                          type="button"
                          onClick={() => handleRegenerateCode(dev)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                          title="تجديد كود الربط الخاص بهذا الجهاز"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit Permissions Button (تعديل الصلاحيات) */}
                        <button
                          type="button"
                          onClick={() => {
                            soundEffects.playGlassTap();
                            setPermissionsDevice(dev);
                            setIsPermissionsModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 border border-amber-500/30 text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                          title="تعديل الصفحات المسموحة ومفاتيح البيع للجهاز"
                        >
                          <Sliders className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          <span>تعديل الصلاحيات</span>
                        </button>

                        {/* One-Click Disconnect Button */}
                        <button
                          type="button"
                          onClick={() => handleDisconnect(dev)}
                          className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                          title="فصل الجهاز عن جلسة العمل فورياً بنقرة واحدة"
                        >
                          <WifiOff className="w-3.5 h-3.5" />
                          <span>فصل الجهاز</span>
                        </button>

                        {/* Delete / Unpair */}
                        <button
                          type="button"
                          onClick={() => handleUnpair(dev)}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                          title="حذف الجهاز نهائياً من الشبكة"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Sub-Device Interactive Controls: One-Click Role Switcher */}
                {!dev.isMasterDevice && (
                  <div className="bg-slate-50/70 dark:bg-slate-800/40 px-4 py-3 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Sliders className="w-3.5 h-3.5 text-amber-500" />
                        <span>تحديث الدور فورياً (One-Click):</span>
                      </span>

                      {/* Quick Role Buttons */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleQuickRoleChange(dev, 'secondary_pos')}
                          className={`px-2.5 py-1 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1 ${
                            dev.role === 'secondary_pos'
                              ? 'bg-amber-500 text-slate-950 shadow-2xs'
                              : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-600'
                          }`}
                        >
                          <ShoppingBag className="w-3 h-3" />
                          <span>كاشير فرعي</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleQuickRoleChange(dev, 'kitchen_display')}
                          className={`px-2.5 py-1 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1 ${
                            dev.role === 'kitchen_display'
                              ? 'bg-amber-500 text-slate-950 shadow-2xs'
                              : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-600'
                          }`}
                        >
                          <ChefHat className="w-3 h-3" />
                          <span>شاشة مطبخ KDS</span>
                        </button>

                        {businessMode === 'restaurant' && (
                          <button
                            type="button"
                            onClick={() => handleQuickRoleChange(dev, 'waiter_mobile')}
                            className={`px-2.5 py-1 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1 ${
                              dev.role === 'waiter_mobile'
                                ? 'bg-amber-500 text-slate-950 shadow-2xs'
                                : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-600'
                            }`}
                          >
                            <Utensils className="w-3 h-3" />
                            <span>نادل طاولة</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleQuickRoleChange(dev, 'customer_display')}
                          className={`px-2.5 py-1 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1 ${
                            dev.role === 'customer_display'
                              ? 'bg-amber-500 text-slate-950 shadow-2xs'
                              : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-600'
                          }`}
                        >
                          <Tv className="w-3 h-3" />
                          <span>شاشة الزبون CFD</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleQuickRoleChange(dev, 'supervisor')}
                          className={`px-2.5 py-1 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1 ${
                            dev.role === 'supervisor'
                              ? 'bg-amber-500 text-slate-950 shadow-2xs'
                              : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-600'
                          }`}
                        >
                          <ShieldCheck className="w-3 h-3" />
                          <span>مشرف صالة</span>
                        </button>
                      </div>
                    </div>

                    {/* Toggle Permissions Accordion */}
                    <button
                      type="button"
                      onClick={() => setExpandedPermissionsDeviceId(isExpanded ? null : dev.id)}
                      className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 self-end cursor-pointer"
                    >
                      <span>{isExpanded ? 'إخفاء الصلاحيات الدقيقة' : 'تخصيص الصلاحيات الدقيقة'}</span>
                      <Sliders className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* Granular Permissions Expandable Panel */}
                {!dev.isMasterDevice && isExpanded && (
                  <div className="p-4 bg-slate-100/70 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200 block mb-2.5">
                      مفاتيح الصلاحيات الميدانية للجهاز:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                      {/* Allow POS Sales */}
                      <label className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(dev.workPermissions?.allowPosSales)}
                          onChange={() => handleTogglePermission(dev, 'allowPosSales', Boolean(dev.workPermissions?.allowPosSales))}
                          className="rounded text-amber-500 focus:ring-amber-500"
                        />
                        <span className="font-bold text-slate-800 dark:text-slate-200">البيع وإصدار الفواتير</span>
                      </label>

                      {/* Allow Table Orders */}
                      <label className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(dev.workPermissions?.allowTableOrders)}
                          onChange={() => handleTogglePermission(dev, 'allowTableOrders', Boolean(dev.workPermissions?.allowTableOrders))}
                          className="rounded text-amber-500 focus:ring-amber-500"
                        />
                        <span className="font-bold text-slate-800 dark:text-slate-200">طلبات الطاولات والنوادل</span>
                      </label>

                      {/* Allow Kitchen Display */}
                      <label className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(dev.workPermissions?.allowKitchenDisplay)}
                          onChange={() => handleTogglePermission(dev, 'allowKitchenDisplay', Boolean(dev.workPermissions?.allowKitchenDisplay))}
                          className="rounded text-amber-500 focus:ring-amber-500"
                        />
                        <span className="font-bold text-slate-800 dark:text-slate-200">شاشة المطبخ والطلبات KDS</span>
                      </label>

                      {/* Allow Catalog & Stock */}
                      <label className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(dev.workPermissions?.allowCatalogAndStock)}
                          onChange={() => handleTogglePermission(dev, 'allowCatalogAndStock', Boolean(dev.workPermissions?.allowCatalogAndStock))}
                          className="rounded text-amber-500 focus:ring-amber-500"
                        />
                        <span className="font-bold text-slate-800 dark:text-slate-200">إدارة المنتجات والمخزون</span>
                      </label>

                      {/* Allow Customers & Debts */}
                      <label className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(dev.workPermissions?.allowCustomersAndDebts)}
                          onChange={() => handleTogglePermission(dev, 'allowCustomersAndDebts', Boolean(dev.workPermissions?.allowCustomersAndDebts))}
                          className="rounded text-amber-500 focus:ring-amber-500"
                        />
                        <span className="font-bold text-slate-800 dark:text-slate-200">إدارة الزبائن وسجل الديون</span>
                      </label>

                      {/* Auto Share Data */}
                      <label className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(dev.workPermissions?.autoShareDataWithMaster)}
                          onChange={() => handleTogglePermission(dev, 'autoShareDataWithMaster', Boolean(dev.workPermissions?.autoShareDataWithMaster))}
                          className="rounded text-amber-500 focus:ring-amber-500"
                        />
                        <span className="font-bold text-slate-800 dark:text-slate-200">مشاركة المبيعات تلقائياً</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Quick Permissions & Allowed Pages Modal */}
      <DevicePermissionsModal
        device={permissionsDevice}
        isOpen={isPermissionsModalOpen}
        onClose={() => {
          setIsPermissionsModalOpen(false);
          setPermissionsDevice(null);
        }}
      />
    </div>
  );
};
