import React, { useState, useMemo } from "react";
import { useApp } from "../../context/AppContext";
import { DeviceRole, LinkedDevice, Sale } from "../../types";
import {
  getDefaultWorkPermissionsForRole,
  getDefaultAllowedPagesForRole,
  SUB_DEVICE_PAGE_LABELS,
  generateUniqueCodeForSingleDevice,
} from "../../utils/licenseUtils";
import { soundEffects } from "../../services/audio";
import { DevicePairingModal } from "./DevicePairingModal";
import { KitchenDisplayView } from "./KitchenDisplayView";
import { CustomerFacingDisplayView } from "./CustomerFacingDisplayView";
import { MobileWaiterView } from "./MobileWaiterView";
import { MobileStockScannerView } from "./MobileStockScannerView";
import {
  Wifi,
  Plus,
  RefreshCw,
  Monitor,
  Tablet,
  Smartphone,
  ChefHat,
  Tv,
  ScanBarcode,
  Trash2,
  CheckCircle2,
  Copy,
  Sparkles,
  ExternalLink,
  BellRing,
  Link2,
  Layers,
  Crown,
  KeyRound,
  UserCheck,
  Briefcase,
  Utensils,
  BarChart3,
  Receipt,
  Eye,
  Sliders,
  Share2,
  Zap,
  Clock,
  ShieldCheck,
  X,
  TrendingUp,
  ShoppingBag,
  Activity,
} from "lucide-react";

export const DevicesHubView: React.FC = () => {
  const {
    devices,
    sales,
    kitchenOrders,
    masterPairingPin,
    subscriptionBoundLinkCode,
    isMasterDevice,
    currentDeviceId,
    currentDeviceName,
    currentDeviceRole,
    licenseKey,
    isAppPurchased,
    setIsPairingModalOpen,
    disconnectDevice,
    refreshMasterPin,
    syncAllDevices,
    pingDevice,
    simulateSubDeviceSale,
    dedicatedDeviceRole,
    setDedicatedDeviceRole,
    activateSubDevicePreview,
    exitSubDeviceMode,
    setIsFirstLoginModalOpen,
    setIsConnectToCashierModalOpen,
    regenerateSingleDeviceCode,
    setActiveTab,
    businessMode,
    formatCurrency,
  } = useApp();

  const [activeSubView, setActiveSubView] = useState<
    "hub" | "master_monitor" | "kds" | "cfd" | "waiter" | "scanner"
  >("hub");
  const [copiedPin, setCopiedPin] = useState(false);
  const [copiedDeviceCodeId, setCopiedDeviceCodeId] = useState<string | null>(null);
  const [pingingId, setPingingId] = useState<string | null>(null);
  const [editingDevice, setEditingDevice] = useState<LinkedDevice | null>(null);
  const [inspectingDevice, setInspectingDevice] = useState<LinkedDevice | null>(null);

  // Filter out restaurant-only devices when not in restaurant mode
  const visibleDevices = useMemo(() => {
    return devices.filter((d) =>
      businessMode === "restaurant"
        ? true
        : d.role !== "kitchen_display" && d.role !== "waiter_mobile"
    );
  }, [devices, businessMode]);

  const handleCopyDeviceUniqueCode = (dev: LinkedDevice) => {
    soundEffects.playClick();
    const code =
      dev.uniqueDeviceCode || generateUniqueCodeForSingleDevice(dev.role, dev.id);
    navigator.clipboard.writeText(code);
    setCopiedDeviceCodeId(dev.id);
    setTimeout(() => setCopiedDeviceCodeId(null), 2200);
  };

  const handleCopyBoundCode = () => {
    soundEffects.playClick();
    navigator.clipboard.writeText(subscriptionBoundLinkCode);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2200);
  };

  const handlePing = async (id: string) => {
    setPingingId(id);
    await pingDevice(id);
    setTimeout(() => setPingingId(null), 900);
  };

  // Compute per-device sales & orders statistics for Master Device oversight
  const deviceStatsMap = useMemo(() => {
    const map: Record<
      string,
      {
        salesList: Sale[];
        salesCount: number;
        totalRevenue: number;
        ordersCount: number;
        lastInvoiceNumber?: string;
        lastSaleTime?: string;
      }
    > = {};

    devices.forEach((dev) => {
      const matchedSales = sales.filter(
        (s) =>
          s.status !== "voided" &&
          (s.sourceDeviceId === dev.id ||
            (dev.role === "master_pos" &&
              (!s.sourceDeviceId ||
                s.sourceDeviceRole === "master_pos" ||
                s.sourceDeviceId === currentDeviceId)) ||
            (s.cashierName && dev.name && s.cashierName.includes(dev.name)))
      );

      const matchedOrders = kitchenOrders.filter(
        (o) =>
          o.sourceDeviceId === dev.id ||
          (o.sourceDeviceName && dev.name && o.sourceDeviceName.includes(dev.name)) ||
          (o.sourceDevice && dev.name && o.sourceDevice.includes(dev.name))
      );

      const calcRevenue = matchedSales.reduce((acc, s) => acc + (Number(s.total) || 0), 0);
      const finalSalesCount = Math.max(dev.salesCount || 0, matchedSales.length);
      const finalRevenue = Math.max(dev.totalSalesAmount || 0, calcRevenue);
      const finalOrdersCount = Math.max(dev.ordersCount || 0, matchedOrders.length);

      map[dev.id] = {
        salesList: matchedSales,
        salesCount: finalSalesCount,
        totalRevenue: finalRevenue,
        ordersCount: finalOrdersCount,
        lastInvoiceNumber: matchedSales[0]?.invoiceNumber,
        lastSaleTime: matchedSales[0]?.createdAt || dev.lastActivityAt || dev.lastSeen,
      };
    });

    return map;
  }, [devices, sales, kitchenOrders, currentDeviceId]);

  const totalNetworkSalesRevenue = useMemo(() => {
    return Object.values(deviceStatsMap).reduce((sum, st) => sum + st.totalRevenue, 0);
  }, [deviceStatsMap]);

  const totalNetworkSalesCount = useMemo(() => {
    return Object.values(deviceStatsMap).reduce((sum, st) => sum + st.salesCount, 0);
  }, [deviceStatsMap]);

  // If user switched to a live companion screen preview
  if (activeSubView === "kds") {
    return <KitchenDisplayView onBackToMain={() => setActiveSubView("hub")} />;
  }
  if (activeSubView === "cfd") {
    return <CustomerFacingDisplayView onBackToMain={() => setActiveSubView("hub")} />;
  }
  if (activeSubView === "waiter") {
    return <MobileWaiterView onBackToMain={() => setActiveSubView("hub")} />;
  }
  if (activeSubView === "scanner") {
    return <MobileStockScannerView onBackToMain={() => setActiveSubView("hub")} />;
  }

  const getRoleBadge = (role: DeviceRole, customLabel?: string) => {
    switch (role) {
      case "master_pos":
        return {
          label: customLabel || "الجهاز الرئيسي (صاحب الاشتراك)",
          color:
            "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
          icon: Crown,
        };
      case "secondary_pos":
        return {
          label: customLabel || "كاشير فرعي",
          color:
            "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30",
          icon: Monitor,
        };
      case "waiter_mobile":
        return {
          label: customLabel || "نادل / كابتن صالة",
          color:
            "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30",
          icon: Utensils,
        };
      case "assistant":
        return {
          label: customLabel || "مساعد كاشير ومبيعات",
          color:
            "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
          icon: UserCheck,
        };
      case "supervisor":
        return {
          label: customLabel || "مشرف فرع ومتابعة",
          color:
            "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
          icon: Briefcase,
        };
      case "kitchen_display":
        return {
          label: customLabel || "شاشة مطبخ (KDS)",
          color:
            "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30",
          icon: ChefHat,
        };
      case "customer_display":
        return {
          label: customLabel || "شاشة عرض الزبون (CFD)",
          color:
            "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
          icon: Tv,
        };
      case "stock_scanner":
        return {
          label: customLabel || "مساعد مخزون وباركود",
          color:
            "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30",
          icon: ScanBarcode,
        };
      default:
        return {
          label: customLabel || "جهاز مرتبط",
          color: "bg-slate-500/15 text-slate-600 border-slate-500/30",
          icon: Smartphone,
        };
    }
  };

  const getDeviceTypeIcon = (type: "desktop" | "tablet" | "mobile") => {
    if (type === "desktop") return Monitor;
    if (type === "tablet") return Tablet;
    return Smartphone;
  };

  const openRoleTerminalPreview = (role: DeviceRole) => {
    if (role === "kitchen_display") setActiveSubView("kds");
    else if (role === "customer_display") setActiveSubView("cfd");
    else if (role === "waiter_mobile" || role === "assistant") setActiveSubView("waiter");
    else if (role === "stock_scanner") setActiveSubView("scanner");
  };

  return (
    <div className="space-y-6 pb-12" dir="rtl">
      {/* Top Hero Banner: Master Device & Subscription-Bound Code */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-indigo-950 via-slate-900 to-violet-950 text-white p-6 sm:p-7 shadow-2xl border border-indigo-500/25">
        <div className="absolute -left-20 -top-20 w-72 h-72 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-24 w-72 h-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-black">
              <Crown className="w-4 h-4 text-amber-400" />
              {isMasterDevice
                ? "هذا الجهاز هو الجهاز الرئيسي (صاحب كود الاشتراك)"
                : `جهاز فرعي مرتبط بالجهاز الرئيسي (${getRoleBadge(currentDeviceRole).label})`}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-snug">
              إدارة الأجهزة المرتبطة بالاشتراك والمشاركة التلقائية للبيانات
            </h1>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              الجهاز الذي استخدم كود الاشتراك هو <strong className="text-amber-300">الجهاز الرئيسي</strong>. تم إلغاء كود مشاركة البيانات المنفصل واستبداله بـ{" "}
              <strong className="text-emerald-300">كود موحد مربوط بالجهاز الرئيسي والاشتراك</strong>. يمكنك من هنا{" "}
              <strong className="text-white">إضافة جهاز جديد بكود خاص به</strong> وتحديد وظيفته ({businessMode === "restaurant" ? "كاشير، نادل، شاشة مطبخ، مساعد" : "كاشير، مساعد، مشرف، جرد"}) وتحديد عمله، وتتم مشاركة المبيعات والبيانات تلقائياً مع بقاء الجهاز الرئيسي على اطلاع كامل على حالة ومبيعات كل جهاز.
            </p>

            {/* Device Identity & Subscription Status Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 text-slate-200 text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                معرف الجهاز الرئيسي:{" "}
                <strong className="font-mono text-amber-300" dir="ltr">
                  {currentDeviceId}
                </strong>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 text-slate-200 text-xs font-bold">
                <KeyRound className="w-3.5 h-3.5 text-indigo-300" />
                حالة الاشتراك:{" "}
                <strong className="text-emerald-300">
                  {isAppPurchased && licenseKey
                    ? `مفعّل (${licenseKey.slice(0, 10)}...)`
                    : "الفترة التجريبية (مرتبط بالجهاز)"}
                </strong>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-black">
                <Share2 className="w-3.5 h-3.5" />
                مشاركة البيانات التلقائية: نشطة 100%
              </span>
            </div>
          </div>

          {/* Right Panel: Subscription-Bound Code + Primary "Add Device" Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 shrink-0">
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 flex flex-col justify-between min-w-[255px]">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[11px] text-amber-300 font-black flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5" />
                  كود الربط بالجهاز الرئيسي والاشتراك
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                  بديل كود المشاركة
                </span>
              </div>

              <div
                className="font-mono font-black text-base sm:text-lg tracking-wider text-white my-1 select-all"
                dir="ltr"
              >
                {subscriptionBoundLinkCode}
              </div>

              <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-white/10">
                <span className="text-[11px] text-slate-300 font-mono" dir="ltr">
                  PIN: {masterPairingPin}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleCopyBoundCode}
                    className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1 transition"
                    title="نسخ كود الربط بالاشتراك"
                  >
                    {copiedPin ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    {copiedPin ? "تم النسخ" : "نسخ الكود"}
                  </button>
                  <button
                    onClick={refreshMasterPin}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 transition"
                    title="تحديث كود الربط"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-col gap-2.5 justify-center">
              {/* Prominent "إضافة جهاز" button for Master Device */}
              <button
                onClick={() => {
                  soundEffects.playClick();
                  setEditingDevice(null);
                  setIsPairingModalOpen(true);
                }}
                className="px-6 py-4 bg-gradient-to-l from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 rounded-2xl font-black text-sm shadow-xl shadow-amber-500/25 transition flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <Plus className="w-5 h-5 stroke-[2.5]" />
                <span>إضافة جهاز (بكود خاص وتحديد العمل)</span>
              </button>

              <button
                onClick={() => {
                  soundEffects.playClick();
                  setActiveTab("devices_status");
                }}
                className="px-4 py-3 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 rounded-2xl font-black text-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>فتح صفحة حالة الأجهزة المرتبطة ({visibleDevices.length})</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsFirstLoginModalOpen(true)}
                  className="flex-1 px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/15 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Link2 className="w-3.5 h-3.5 text-emerald-400" />
                  صفحة التسجيل الأولى وربط جهاز تابع
                </button>
                <button
                  onClick={syncAllDevices}
                  className="px-3.5 py-2.5 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                  title="مزامنة فورية مع جميع الأجهزة"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  مزامنة
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dedicated Sub-Device Mode Banner (if this device is currently acting as Waiter/Assistant/Cashier 2) */}
      {dedicatedDeviceRole && dedicatedDeviceRole !== "master_pos" && (
        <div className="bg-indigo-600/10 border-2 border-indigo-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-indigo-600 text-white">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-sm">
                يعمل هذا الجهاز حالياً كجهاز فرعي بوظيفة:{" "}
                <span className="text-indigo-600 dark:text-indigo-400">
                  {getRoleBadge(dedicatedDeviceRole).label}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                جميع المبيعات والطلبات التي تسجلها هنا تتم مشاركتها تلقائياً ولحظياً مع الجهاز الرئيسي وبقية الأجهزة.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {dedicatedDeviceRole !== "secondary_pos" &&
              dedicatedDeviceRole !== "supervisor" && (
                <button
                  onClick={() => openRoleTerminalPreview(dedicatedDeviceRole)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition"
                >
                  فتح شاشة العمل المخصصة
                </button>
              )}
            <button
              onClick={exitSubDeviceMode}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black transition flex items-center gap-1.5"
            >
              <Crown className="w-3.5 h-3.5" />
              العودة لوضع الجهاز الرئيسي
            </button>
          </div>
        </div>
      )}

      {/* Master Device Live Oversight Summary Strip (اطلاع الجهاز الرئيسي على بيانات ومبيعات الأجهزة) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                مركز اطلاع الجهاز الرئيسي على مبيعات وبيانات الأجهزة المرتبطة
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  تحديث تلقائي مباشر
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {businessMode === "restaurant"
                  ? "لكل جهاز كود خاص به • يبقى الجهاز الرئيسي على اطلاع لحظي على مبيعات كل كاشير أو نادل أو شاشة مطبخ"
                  : "لكل جهاز كود خاص به • يبقى الجهاز الرئيسي على اطلاع لحظي على مبيعات كل كاشير أو مساعد أو مشرف"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                soundEffects.playClick();
                setActiveTab("devices_status");
              }}
              className="px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow transition cursor-pointer"
            >
              <Activity className="w-4 h-4" />
              <span>صفحة حالة الأجهزة المرتبطة</span>
            </button>
            <button
              onClick={() =>
                setActiveSubView(
                  activeSubView === "master_monitor" ? "hub" : "master_monitor"
                )
              }
              className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition ${
                activeSubView === "master_monitor"
                  ? "bg-indigo-600 text-white shadow"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200"
              }`}
            >
              <Eye className="w-4 h-4" />
              {activeSubView === "master_monitor"
                ? "عرض بطاقات الأجهزة"
                : "جدول مقارنة مبيعات الأجهزة"}
            </button>
          </div>
        </div>

        {/* 4 Summary KPI Cards across connected devices */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold">
              <span>إجمالي الأجهزة المرتبطة بالاشتراك</span>
              <Wifi className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1.5">
              {visibleDevices.length}{" "}
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                ({visibleDevices.filter((d) => d.isOnline).length} متصل الآن)
              </span>
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-900/50">
            <div className="flex items-center justify-between text-xs text-indigo-600 dark:text-indigo-300 font-bold">
              <span>إجمالي مبيعات كافة الأجهزة</span>
              <TrendingUp className="w-4 h-4 text-indigo-500" />
            </div>
            <p className="text-2xl font-black text-indigo-700 dark:text-indigo-300 mt-1.5">
              {formatCurrency(totalNetworkSalesRevenue)}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/50">
            <div className="flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-300 font-bold">
              <span>إجمالي الفواتير المشتركة تلقائياً</span>
              <Receipt className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1.5">
              {totalNetworkSalesCount}{" "}
              <span className="text-xs font-bold">فاتورة مبيعات</span>
            </p>
          </div>

          {businessMode === "restaurant" ? (
            <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/50">
              <div className="flex items-center justify-between text-xs text-amber-700 dark:text-amber-300 font-bold">
                <span>طلبات الطاولات والمطبخ النشطة</span>
                <ShoppingBag className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-1.5">
                {kitchenOrders.length}{" "}
                <span className="text-xs font-bold">طلب مشترك</span>
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/50">
              <div className="flex items-center justify-between text-xs text-amber-700 dark:text-amber-300 font-bold">
                <span>أكواد الأجهزة الخاصة المفعلة</span>
                <KeyRound className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-1.5">
                {visibleDevices.length}{" "}
                <span className="text-xs font-bold">كود جهاز مستقل</span>
              </p>
            </div>
          )}
        </div>

        {/* Detailed Comparison Table if Master Monitor is toggled */}
        {activeSubView === "master_monitor" && (
          <div className="mt-5 overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black">
                <tr>
                  <th className="p-3.5">اسم الجهاز المتصل</th>
                  <th className="p-3.5">اسم المستخدم</th>
                  <th className="p-3.5">الكود الخاص بالجهاز</th>
                  <th className="p-3.5">الوظيفة المحددة</th>
                  <th className="p-3.5">الصفحات المسموح ظهورها</th>
                  <th className="p-3.5">عدد الفواتير</th>
                  <th className="p-3.5">إجمالي المبيعات</th>
                  <th className="p-3.5 text-center">إجراءات الجهاز الرئيسي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {visibleDevices.map((dev) => {
                  const badge = getRoleBadge(dev.role, dev.roleLabelAr);
                  const st = deviceStatsMap[dev.id] || {
                    salesCount: 0,
                    totalRevenue: 0,
                    ordersCount: 0,
                    salesList: [],
                  };
                  const devUniqueCode =
                    dev.uniqueDeviceCode ||
                    generateUniqueCodeForSingleDevice(dev.role, dev.id);
                  const allowedList =
                    dev.workPermissions?.allowedPages && dev.workPermissions.allowedPages.length > 0
                      ? dev.workPermissions.allowedPages
                      : getDefaultAllowedPagesForRole(dev.role);
                  return (
                    <tr
                      key={dev.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="p-3.5 font-black text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              dev.isOnline ? "bg-emerald-500" : "bg-slate-400"
                            }`}
                          />
                          <span>{dev.name}</span>
                        </div>
                      </td>
                      <td className="p-3.5 font-bold text-indigo-700 dark:text-indigo-300">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                          {dev.connectedUserName || dev.cashierName || "موظف مناوب"}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span
                          className="font-mono font-black text-xs px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                          dir="ltr"
                        >
                          {devUniqueCode}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${badge.color}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {dev.role === "master_pos" ? (
                            <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] font-black">
                              كافة صفحات النظام (جهاز رئيسي)
                            </span>
                          ) : (
                            allowedList.map((pId) => (
                              <span
                                key={pId}
                                className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-black"
                              >
                                {SUB_DEVICE_PAGE_LABELS[pId] || pId}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="p-3.5 font-black text-slate-900 dark:text-white">
                        {st.salesCount} فاتورة
                      </td>
                      <td className="p-3.5 font-black text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(st.totalRevenue)}
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setInspectingDevice(dev)}
                            className="px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 font-bold hover:bg-indigo-100 transition"
                          >
                            عرض المبيعات
                          </button>
                          <button
                            onClick={() => setEditingDevice(dev)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 transition"
                          >
                            تحديد العمل والصفحات
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Connected Devices Grid (الأجهزة المربوطة بالجهاز الرئيسي والاشتراك) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Wifi className="w-5 h-5 text-indigo-500" />
            الأجهزة المربوطة بالجهاز الرئيسي والاشتراك ({visibleDevices.length})
          </h2>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                soundEffects.playClick();
                setActiveTab("devices_status");
              }}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition cursor-pointer"
            >
              <Activity className="w-4 h-4" />
              صفحة حالة الأجهزة المرتبطة
            </button>
            <button
              onClick={() => {
                soundEffects.playClick();
                setEditingDevice(null);
                setIsPairingModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              إضافة جهاز جديد بكود خاص
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visibleDevices.map((dev) => {
            const badge = getRoleBadge(dev.role, dev.roleLabelAr);
            const RoleIcon = badge.icon;
            const DeviceIcon = getDeviceTypeIcon(dev.deviceType);
            const preset = getDefaultWorkPermissionsForRole(dev.role);
            const perms = dev.workPermissions || preset;
            const stats = deviceStatsMap[dev.id] || {
              salesList: [],
              salesCount: 0,
              totalRevenue: 0,
              ordersCount: 0,
            };
            const isMasterCard = dev.role === "master_pos" || dev.isMasterDevice;

            return (
              <div
                key={dev.id}
                className={`bg-white dark:bg-slate-900 rounded-3xl p-5 border-2 transition-all flex flex-col justify-between shadow-sm hover:shadow-md ${
                  isMasterCard
                    ? "border-amber-500/50 dark:border-amber-500/40 bg-gradient-to-b from-amber-50/20 to-transparent dark:from-amber-950/10"
                    : "border-slate-200 dark:border-slate-800"
                }`}
              >
                <div>
                  {/* Card Top Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-3 rounded-2xl ${
                          isMasterCard
                            ? "bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 shadow-md shadow-amber-500/20"
                            : dev.isOnline
                            ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {isMasterCard ? (
                          <Crown className="w-6 h-6" />
                        ) : (
                          <DeviceIcon className="w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-black text-slate-900 dark:text-white text-sm">
                            {dev.name}
                          </h3>
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              dev.isOnline
                                ? "bg-emerald-500 animate-pulse"
                                : "bg-slate-400"
                            }`}
                            title={dev.isOnline ? "متصل" : "غير متصل"}
                          />
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black border ${badge.color}`}
                          >
                            <RoleIcon className="w-3 h-3" />
                            {badge.label}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <Share2 className="w-2.5 h-2.5" />
                            مشاركة تلقائية
                          </span>
                        </div>
                      </div>
                    </div>

                    {!isMasterCard && (
                      <button
                        onClick={() => disconnectDevice(dev.id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                        title="فصل الجهاز من شبكة الاشتراك"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Dedicated Unique Device Code Box */}
                  <div className="bg-amber-500/10 dark:bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 mb-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <KeyRound className="w-4 h-4 text-amber-500 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">
                          الكود الخاص بهذا الجهاز:
                        </span>
                        <span
                          className="font-mono font-black text-xs sm:text-sm text-amber-600 dark:text-amber-400 tracking-wider block truncate"
                          dir="ltr"
                        >
                          {dev.uniqueDeviceCode ||
                            generateUniqueCodeForSingleDevice(dev.role, dev.id)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopyDeviceUniqueCode(dev)}
                        className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] flex items-center gap-1 transition cursor-pointer"
                      >
                        {copiedDeviceCodeId === dev.id ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>{copiedDeviceCodeId === dev.id ? "تم النسخ" : "نسخ"}</span>
                      </button>
                      {!isMasterCard && (
                        <button
                          type="button"
                          onClick={() => regenerateSingleDeviceCode(dev.id)}
                          className="p-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                          title="توليد كود جديد خاص بهذا الجهاز"
                        >
                          <RefreshCw className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Connected Device Name & User Name Box (يظهر اسم الجهاز المتصل واسم المستخدم) */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 block">
                        اسم الجهاز المتصل:
                      </span>
                      <span className="text-xs font-black text-slate-900 dark:text-white truncate block mt-0.5">
                        {dev.name}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/50">
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 block">
                        اسم المستخدم على الجهاز:
                      </span>
                      <span className="text-xs font-black text-indigo-950 dark:text-indigo-200 truncate flex items-center gap-1 mt-0.5">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        {dev.connectedUserName || dev.cashierName || "موظف مناوب"}
                      </span>
                    </div>
                  </div>

                  {/* Assigned Work & Allowed Pages Box */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3 mb-3 border border-slate-200/60 dark:border-slate-800">
                    <div className="flex items-center justify-between text-[11px] font-black text-slate-700 dark:text-slate-300 mb-1">
                      <span>الصفحات المحددة من الرئيسي:</span>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        {isMasterCard
                          ? "وصول كامل"
                          : `${(perms.allowedPages || getDefaultAllowedPagesForRole(dev.role)).length} صفحات فقط`}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {isMasterCard ? (
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] font-black">
                          كافة صفحات النظام (الجهاز الرئيسي)
                        </span>
                      ) : (
                        (perms.allowedPages && perms.allowedPages.length > 0
                          ? perms.allowedPages
                          : getDefaultAllowedPagesForRole(dev.role)
                        ).map((pageId) => (
                          <span
                            key={pageId}
                            className="px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/25 text-[10px] font-black"
                          >
                            {SUB_DEVICE_PAGE_LABELS[pageId] || pageId}
                          </span>
                        ))
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      {dev.workDescription || preset.workDescription}
                    </p>
                  </div>

                  {/* Live Sales & Data Metrics Box (اطلاع الجهاز الرئيسي على بيانات الجهاز) */}
                  <div className="bg-gradient-to-br from-indigo-50/70 to-emerald-50/40 dark:from-indigo-950/30 dark:to-emerald-950/20 rounded-2xl p-3.5 mb-3 border border-indigo-200/60 dark:border-indigo-900/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-black text-indigo-900 dark:text-indigo-200 flex items-center gap-1">
                        <BarChart3 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        بيانات ومبيعات الجهاز المشتركة:
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400" dir="ltr">
                        {dev.subscriptionLinkCode || subscriptionBoundLinkCode}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-white dark:bg-slate-900/90 rounded-xl p-2 border border-slate-200/60 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 font-bold block">
                          إجمالي المبيعات
                        </span>
                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 block mt-0.5">
                          {formatCurrency(stats.totalRevenue)}
                        </span>
                      </div>
                      <div className="bg-white dark:bg-slate-900/90 rounded-xl p-2 border border-slate-200/60 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 font-bold block">
                          عدد الفواتير
                        </span>
                        <span className="text-xs font-black text-slate-900 dark:text-white block mt-0.5">
                          {stats.salesCount} فاتورة
                        </span>
                      </div>
                      <div className="bg-white dark:bg-slate-900/90 rounded-xl p-2 border border-slate-200/60 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 font-bold block">
                          الطلبات
                        </span>
                        <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 block mt-0.5">
                          {stats.ordersCount} طلب
                        </span>
                      </div>
                    </div>

                    {dev.lastActivitySummary && (
                      <div className="mt-2 pt-2 border-t border-indigo-200/40 dark:border-indigo-800/40 flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                        <Clock className="w-3 h-3 text-indigo-500 shrink-0" />
                        <span className="truncate">{dev.lastActivitySummary}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions for Master Device Oversight & Role Assignment */}
                <div className="space-y-2 pt-1">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        soundEffects.playClick();
                        setInspectingDevice(dev);
                      }}
                      className="py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black flex items-center justify-center gap-1.5 transition shadow-sm"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      بيانات ومبيعات الجهاز
                    </button>

                    <button
                      onClick={() => {
                        soundEffects.playClick();
                        setEditingDevice(dev);
                      }}
                      className="py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                    >
                      <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                      تحديد الوظيفة والعمل
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isMasterCard && (
                      <button
                        onClick={() => simulateSubDeviceSale(dev)}
                        className="flex-1 py-2 px-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 text-[11px] font-black flex items-center justify-center gap-1 transition"
                        title="اختبار مشاركة فاتورة مبيعات حية من هذا الجهاز إلى الجهاز الرئيسي"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        تجربة مشاركة مبيعات تلقائية
                      </button>
                    )}

                    {!isMasterCard && (
                      <button
                        onClick={() => activateSubDevicePreview(dev)}
                        className="py-2 px-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 text-[11px] font-black flex items-center justify-center gap-1 transition cursor-pointer"
                        title="تشغيل ومعاينة النظام بصلاحيات وصفحات هذا الجهاز التابع فقط"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        معاينة صفحاته
                      </button>
                    )}

                    <button
                      onClick={() => handlePing(dev.id)}
                      disabled={pingingId === dev.id}
                      className="py-2 px-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-600 dark:text-amber-400 text-[11px] font-bold flex items-center justify-center gap-1 transition"
                      title="إرسال تنبيه وفحص الاتصال"
                    >
                      <BellRing
                        className={`w-3.5 h-3.5 ${
                          pingingId === dev.id ? "animate-bounce" : ""
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Companion Screen Previews */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              {businessMode === "restaurant"
                ? "واجهات عمل الأجهزة الفرعية (شاشات النادل، المطبخ، فاحص الباركود، وشاشة الزبون)"
                : "واجهات عمل الأجهزة الفرعية (جهاز المساعد وفاحص الباركود، وشاشة عرض الفاتورة للعميل)"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              افتح أي شاشة لمعاينة كيف يعمل الجهاز الفرعي وكيف يشارك بياناته ومبيعاته تلقائياً مع الجهاز الرئيسي
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {businessMode === "restaurant" && (
            <>
              <div
                onClick={() => setActiveSubView("waiter")}
                className="group cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-violet-500 rounded-2xl p-4 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-600 flex items-center justify-center mb-3">
                  <Utensils className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  واجهة النادل والمساعد
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  استلام طلبات الطاولات والزبائن ومشاركتها تلقائياً مع الكاشير الرئيسي والمطبخ.
                </p>
              </div>

              <div
                onClick={() => setActiveSubView("kds")}
                className="group cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-orange-500 rounded-2xl p-4 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center mb-3">
                  <ChefHat className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  شاشة المطبخ والتحضير (KDS)
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  عرض الطلبات الواردة من الجهاز الرئيسي وأجهزة الندلاء لحظة بلحظة.
                </p>
              </div>
            </>
          )}

          <div
            onClick={() => setActiveSubView("scanner")}
            className="group cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 rounded-2xl p-4 transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-3">
              <ScanBarcode className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              جهاز المساعد وفاحص المخزون
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              مسح الباركود بالكاميرا وإرسال الأصناف مباشرة لسلة الكاشير الرئيسي.
            </p>
          </div>

          <div
            onClick={() => setActiveSubView("cfd")}
            className="group cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 rounded-2xl p-4 transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center mb-3">
              <Tv className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              شاشة عرض الفاتورة للعميل
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              مزامنة السلة الحية والمبلغ الإجمالي أمام الزبون تلقائياً.
            </p>
          </div>
        </div>
      </div>

      {/* Add / Edit Device Role & Work Modal */}
      <DevicePairingModal
        editingDevice={editingDevice}
        onCloseEdit={() => setEditingDevice(null)}
      />

      {/* Master Device Inspector Modal: View Specific Device Sales, Orders & Activity */}
      {inspectingDevice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-4 overflow-y-auto"
          dir="rtl"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl my-auto max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-l from-indigo-950 via-slate-900 to-violet-950 text-white p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-amber-300">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg">
                    سجل بيانات ومبيعات الجهاز: {inspectingDevice.name}
                  </h3>
                  <p className="text-xs text-slate-300">
                    الوظيفة:{" "}
                    {getRoleBadge(inspectingDevice.role, inspectingDevice.roleLabelAr).label} —
                    مشاركة تلقائية مع الجهاز الرئيسي
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectingDevice(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-5">
              {(() => {
                const st = deviceStatsMap[inspectingDevice.id] || {
                  salesList: [],
                  salesCount: 0,
                  totalRevenue: 0,
                  ordersCount: 0,
                };
                return (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60">
                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                          إجمالي مبيعات هذا الجهاز
                        </span>
                        <p className="text-xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
                          {formatCurrency(st.totalRevenue)}
                        </p>
                      </div>
                      <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60">
                        <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                          عدد الفواتير المصدرة
                        </span>
                        <p className="text-xl font-black text-indigo-700 dark:text-indigo-300 mt-1">
                          {st.salesCount} فاتورة
                        </p>
                      </div>
                      <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60">
                        <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
                          عدد الطلبات المرسلة للمطبخ
                        </span>
                        <p className="text-xl font-black text-amber-700 dark:text-amber-300 mt-1">
                          {st.ordersCount} طلب
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">
                        قائمة الفواتير والمبيعات الواردة من ({inspectingDevice.name})
                      </h4>
                      <button
                        onClick={() => simulateSubDeviceSale(inspectingDevice)}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1.5 transition shadow"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        محاكاة فاتورة مبيعات جديدة من هذا الجهاز
                      </button>
                    </div>

                    {st.salesList.length === 0 ? (
                      <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 text-center space-y-2">
                        <Receipt className="w-8 h-8 text-slate-400 mx-auto" />
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                          لا توجد فواتير مسجلة من هذا الجهاز حتى الآن
                        </p>
                        <p className="text-[11px] text-slate-400">
                          اضغط على زر "محاكاة فاتورة مبيعات جديدة" أعلاه لاختبار وصول المبيعات تلقائياً للجهاز الرئيسي
                        </p>
                      </div>
                    ) : (
                      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                        <table className="w-full text-right text-xs">
                          <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black">
                            <tr>
                              <th className="p-3">رقم الفاتورة</th>
                              <th className="p-3">الأصناف</th>
                              <th className="p-3">طريقة الدفع</th>
                              <th className="p-3">المبلغ الإجمالي</th>
                              <th className="p-3">الوقت</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {st.salesList.slice(0, 15).map((sale) => (
                              <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                <td className="p-3 font-mono font-black text-indigo-600 dark:text-indigo-400">
                                  {sale.invoiceNumber}
                                </td>
                                <td className="p-3 text-slate-700 dark:text-slate-300">
                                  {sale.items
                                    .map((i) => `${i.quantity}× ${i.productNameAr}`)
                                    .join("، ")}
                                </td>
                                <td className="p-3 font-bold">
                                  {sale.paymentMethod === "cash"
                                    ? "نقدي"
                                    : sale.paymentMethod === "card"
                                    ? "بطاقة"
                                    : "آجل"}
                                </td>
                                <td className="p-3 font-black text-emerald-600 dark:text-emerald-400">
                                  {formatCurrency(sale.total)}
                                </td>
                                <td className="p-3 text-slate-400 font-mono">
                                  {new Date(sale.createdAt).toLocaleTimeString("ar-SA")}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
