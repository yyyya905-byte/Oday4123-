import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { DeviceRole, DeviceWorkPermissions, LinkedDevice, ActiveTab } from "../../types";
import {
  getDefaultWorkPermissionsForRole,
  getDefaultAllowedPagesForRole,
  SUB_DEVICE_PAGE_LABELS,
  generateUniqueCodeForSingleDevice,
} from "../../utils/licenseUtils";
import { soundEffects } from "../../services/audio";
import {
  X,
  Plus,
  Smartphone,
  Tablet,
  Monitor,
  ChefHat,
  Tv,
  ScanBarcode,
  RefreshCw,
  CheckCircle2,
  Copy,
  Wifi,
  ShieldCheck,
  QrCode,
  ExternalLink,
  UserCheck,
  Briefcase,
  Crown,
  Share2,
  Sliders,
  Check,
  Sparkles,
  KeyRound,
  Utensils,
} from "lucide-react";

interface DevicePairingModalProps {
  editingDevice?: LinkedDevice | null;
  onCloseEdit?: () => void;
}

export const DevicePairingModal: React.FC<DevicePairingModalProps> = ({
  editingDevice = null,
  onCloseEdit,
}) => {
  const {
    isPairingModalOpen,
    setIsPairingModalOpen,
    masterPairingPin,
    subscriptionBoundLinkCode,
    isMasterDevice,
    currentDeviceId,
    licenseKey,
    refreshMasterPin,
    pairDevice,
    updateSubDeviceRoleAndWork,
    businessMode,
  } = useApp();

  const [activeMode, setActiveMode] = useState<"add_device" | "qr_bound_code">("add_device");
  const [name, setName] = useState("");
  const [role, setRole] = useState<DeviceRole>("secondary_pos");
  const [deviceType, setDeviceType] = useState<"desktop" | "tablet" | "mobile">("tablet");
  const [cashierName, setCashierName] = useState("");
  const [branchName, setBranchName] = useState("الفرع الرئيسي");
  const [workDescription, setWorkDescription] = useState("");
  const [workPermissions, setWorkPermissions] = useState<DeviceWorkPermissions>(() =>
    getDefaultWorkPermissionsForRole("secondary_pos")
  );
  const [deviceUniqueCode, setDeviceUniqueCode] = useState<string>(() =>
    generateUniqueCodeForSingleDevice("secondary_pos")
  );
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedUniqueCode, setCopiedUniqueCode] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Populate default work permissions when role changes (unless editing an existing device's initial load)
  useEffect(() => {
    if (editingDevice) {
      setName(editingDevice.name || "");
      setRole(editingDevice.role || "secondary_pos");
      setDeviceType(editingDevice.deviceType || "tablet");
      setCashierName(editingDevice.connectedUserName || editingDevice.cashierName || "");
      setBranchName(editingDevice.branchName || "الفرع الرئيسي");
      const preset = getDefaultWorkPermissionsForRole(editingDevice.role || "secondary_pos");
      const perms = editingDevice.workPermissions || preset;
      setWorkPermissions({
        ...preset,
        ...perms,
        allowedPages:
          perms.allowedPages && perms.allowedPages.length > 0
            ? perms.allowedPages
            : getDefaultAllowedPagesForRole(editingDevice.role || "secondary_pos"),
      });
      setWorkDescription(editingDevice.workDescription || perms.workDescription || preset.workDescription);
      setDeviceUniqueCode(
        editingDevice.uniqueDeviceCode ||
          generateUniqueCodeForSingleDevice(editingDevice.role || "secondary_pos", editingDevice.id)
      );
      setActiveMode("add_device");
    } else {
      setDeviceUniqueCode(generateUniqueCodeForSingleDevice(role));
    }
  }, [editingDevice]);

  if (!isPairingModalOpen && !editingDevice) return null;

  const handleClose = () => {
    setIsPairingModalOpen(false);
    if (onCloseEdit) onCloseEdit();
  };

  const allRolesList: {
    id: DeviceRole;
    title: string;
    subtitle: string;
    icon: React.FC<{ className?: string }>;
    defaultType: "desktop" | "tablet" | "mobile";
    defaultName: string;
    badgeColor: string;
    restaurantOnly?: boolean;
  }[] = [
    {
      id: "secondary_pos",
      title: "كاشير (نقطة بيع فرعية)",
      subtitle: "إصدار فواتير، تحصيل نقدي وبطاقات، ومشاركة المبيعات لحظياً مع الجهاز الرئيسي",
      icon: Monitor,
      defaultType: "desktop",
      defaultName: "كاشير فرعي 2",
      badgeColor: "from-indigo-600 to-violet-600",
    },
    {
      id: "waiter_mobile",
      title: "نادل (كابتن صالة وطلبات)",
      subtitle: "استلام طلبات الطاولات والزبائن وإرسالها فوراً للمطبخ والكاشير الرئيسي",
      icon: Utensils,
      defaultType: "mobile",
      defaultName: "جهاز النادل 1",
      badgeColor: "from-violet-600 to-purple-600",
      restaurantOnly: true,
    },
    {
      id: "assistant",
      title: "مساعد (مساعد كاشير ومبيعات)",
      subtitle: "تجهيز سلة المشتريات، مسح المنتجات، ومساعدة الكاشير الرئيسي في البيع السريع",
      icon: UserCheck,
      defaultType: "mobile",
      defaultName: "جهاز المساعد 1",
      badgeColor: "from-emerald-600 to-teal-600",
    },
    {
      id: "supervisor",
      title: "مشرف (متابعة وإدارة)",
      subtitle: "الإشراف على المبيعات، منح الخصومات، متابعة المخزون والديون والورديات",
      icon: Briefcase,
      defaultType: "tablet",
      defaultName: "جهاز المشرف",
      badgeColor: "from-amber-600 to-orange-600",
    },
    {
      id: "stock_scanner",
      title: "مساعد مخزون وقارئ باركود",
      subtitle: "جرد البضاعة، فحص الأسعار، وإرسال الباركود مباشرة إلى سلة الجهاز الرئيسي",
      icon: ScanBarcode,
      defaultType: "mobile",
      defaultName: "جهاز الجرد والباركود",
      badgeColor: "from-cyan-600 to-blue-600",
    },
    {
      id: "kitchen_display",
      title: "شاشة مطبخ وتحضير (KDS)",
      subtitle: "استقبال طلبات الكاشير والنادل تلقائياً وتحديث حالة التجهيز لحظياً",
      icon: ChefHat,
      defaultType: "tablet",
      defaultName: "شاشة المطبخ 1",
      badgeColor: "from-orange-500 to-red-600",
      restaurantOnly: true,
    },
    {
      id: "customer_display",
      title: "شاشة عرض الزبون (CFD)",
      subtitle: "عرض السلة الحية والمبلغ المطلوب ورمز الدفع الإلكتروني أمام الزبون",
      icon: Tv,
      defaultType: "tablet",
      defaultName: "شاشة عرض العميل",
      badgeColor: "from-blue-600 to-indigo-600",
    },
  ];

  const rolesList = allRolesList.filter((r) =>
    r.restaurantOnly ? businessMode === "restaurant" : true
  );

  const handleSelectRole = (selectedRoleId: DeviceRole) => {
    soundEffects.playClick();
    setRole(selectedRoleId);
    const roleMeta = allRolesList.find((r) => r.id === selectedRoleId);
    if (roleMeta) {
      setDeviceType(roleMeta.defaultType);
      if (!editingDevice && (!name.trim() || allRolesList.some((r) => r.defaultName === name.trim()))) {
        setName(roleMeta.defaultName);
      }
    }
    if (!editingDevice) {
      setDeviceUniqueCode(generateUniqueCodeForSingleDevice(selectedRoleId));
    }
    const preset = getDefaultWorkPermissionsForRole(selectedRoleId);
    setWorkPermissions(preset);
    setWorkDescription(preset.workDescription);
  };

  const handleRegenerateUniqueDeviceCode = () => {
    soundEffects.playClick();
    setDeviceUniqueCode(generateUniqueCodeForSingleDevice(role));
  };

  const handleCopyUniqueDeviceCode = () => {
    soundEffects.playClick();
    navigator.clipboard.writeText(deviceUniqueCode);
    setCopiedUniqueCode(true);
    setTimeout(() => setCopiedUniqueCode(false), 2500);
  };

  const togglePermission = (key: keyof Omit<DeviceWorkPermissions, "roleLabelAr" | "workDescription" | "allowedPages">) => {
    soundEffects.playClick();
    setWorkPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const toggleAllowedPage = (pageId: ActiveTab) => {
    soundEffects.playClick();
    setWorkPermissions((prev) => {
      const currentPages =
        prev.allowedPages && prev.allowedPages.length > 0
          ? prev.allowedPages
          : getDefaultAllowedPagesForRole(role);
      const exists = currentPages.includes(pageId);
      if (exists && currentPages.length <= 1) {
        return prev; // Must keep at least 1 allowed page
      }
      const nextPages = exists
        ? currentPages.filter((p) => p !== pageId)
        : [...currentPages, pageId];
      return {
        ...prev,
        allowedPages: nextPages,
      };
    });
  };

  // Auto-generate pairing URL with this device's unique code
  const selectedRoleTitle = allRolesList.find((r) => r.id === role)?.defaultName || "جهاز فرعي";
  const pairingUrl = `${window.location.origin}${window.location.pathname}?pairPin=${encodeURIComponent(
    deviceUniqueCode
  )}&role=${role}&name=${encodeURIComponent(name || selectedRoleTitle)}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=12&data=${encodeURIComponent(
    pairingUrl
  )}`;

  const handleCopyBoundCode = () => {
    soundEffects.playClick();
    navigator.clipboard.writeText(subscriptionBoundLinkCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleCopyUrl = () => {
    soundEffects.playClick();
    navigator.clipboard.writeText(pairingUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  const handleSaveOrPairDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const finalName = name.trim() || selectedRoleTitle;

    setIsSubmitting(true);
    const updatedPerms: DeviceWorkPermissions = {
      ...workPermissions,
      allowedPages:
        workPermissions.allowedPages && workPermissions.allowedPages.length > 0
          ? workPermissions.allowedPages
          : getDefaultAllowedPagesForRole(role),
      workDescription: workDescription.trim() || workPermissions.workDescription,
      autoShareDataWithMaster: true,
    };

    if (editingDevice) {
      await updateSubDeviceRoleAndWork(editingDevice.id, {
        name: finalName,
        role,
        roleLabelAr: updatedPerms.roleLabelAr,
        workDescription: updatedPerms.workDescription,
        workPermissions: updatedPerms,
        cashierName: cashierName.trim() || editingDevice.cashierName,
        connectedUserName: cashierName.trim() || editingDevice.connectedUserName || editingDevice.cashierName,
      });
      setIsSubmitting(false);
      handleClose();
      return;
    }

    const res = await pairDevice({
      name: finalName,
      role,
      roleLabelAr: updatedPerms.roleLabelAr,
      workDescription: updatedPerms.workDescription,
      workPermissions: updatedPerms,
      pairingCode: deviceUniqueCode,
      uniqueDeviceCode: deviceUniqueCode,
      subscriptionLinkCode: subscriptionBoundLinkCode,
      deviceType,
      cashierName: cashierName.trim() || updatedPerms.roleLabelAr,
      connectedUserName: cashierName.trim() || updatedPerms.roleLabelAr,
      branchName: branchName.trim() || "الفرع الرئيسي",
    });
    setIsSubmitting(false);

    if (res.success) {
      setName("");
      handleClose();
    } else {
      setError(res.error || "تعذر إضافة الجهاز، يرجى المحاولة مرة أخرى.");
    }
  };

  const allPermissionItems: {
    key: keyof Omit<DeviceWorkPermissions, "roleLabelAr" | "workDescription" | "autoShareDataWithMaster" | "allowedPages">;
    label: string;
    desc: string;
    restaurantOnly?: boolean;
  }[] = [
    {
      key: "canProcessSales",
      label: "إصدار فواتير المبيعات والتحصيل",
      desc: "السماح للجهاز ببيع الأصناف وإصدار الفواتير ومشاركتها فوراً مع الجهاز الرئيسي",
    },
    {
      key: "canTakeTableOrders",
      label: "استلام طلبات الطاولات والزبائن",
      desc: "تسجيل طلبات الصالة والسفري وإرسالها مباشرة للكاشير والمطبخ",
      restaurantOnly: true,
    },
    {
      key: "canManageInventory",
      label: "فحص وإدارة المخزون والباركود",
      desc: "مسح الباركود، جرد الكميات، وتحديث المخزون المشترك",
    },
    {
      key: "canAccessKitchenOrders",
      label: "استقبال وتحديث طلبات المطبخ (KDS)",
      desc: "عرض شاشة التحضير وتغيير حالة الطلبات إلى جاهز للتقديم",
      restaurantOnly: true,
    },
    {
      key: "canApplyDiscounts",
      label: "منح خصومات على الفواتير",
      desc: "صلاحية تطبيق خصم نقدي أو نسبة مئوية أثناء البيع",
    },
    {
      key: "canManageCustomersAndDebts",
      label: "إدارة العملاء والديون والمصروفات",
      desc: "تسجيل دفعات الديون وإضافة عملاء جدد ومصروفات فرعية",
    },
    {
      key: "canViewSalesReports",
      label: "الاطلاع على تقارير المبيعات",
      desc: "رؤية ملخص مبيعات الوردية والتقارير المالية",
    },
  ];

  const permissionItems = allPermissionItems.filter((p) =>
    p.restaurantOnly ? businessMode === "restaurant" : true
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-3 sm:p-4 overflow-y-auto"
      dir="rtl"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 my-auto max-h-[94vh] flex flex-col">
        {/* Top Header */}
        <div className="bg-gradient-to-l from-indigo-950 via-slate-900 to-violet-950 text-white p-5 sm:p-6 relative overflow-hidden shrink-0">
          <div className="absolute -left-12 -top-12 w-44 h-44 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/25 shrink-0">
                <Crown className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-black">
                    {editingDevice
                      ? `تحديد وتعديل عمل الجهاز: ${editingDevice.name}`
                      : "إضافة جهاز جديد وربطه بالجهاز الرئيسي والاشتراك"}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    {isMasterDevice ? "الجهاز الرئيسي (صاحب الاشتراك)" : "شبكة الاشتراك الموحدة"}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  {businessMode === "restaurant"
                    ? "لكل جهاز كود خاص به • حدّد وظيفة الجهاز (كاشير، نادل، شاشة مطبخ، مساعد) ليتم مشاركة البيانات تلقائياً مع الجهاز الرئيسي"
                    : "لكل جهاز كود خاص به • حدّد وظيفة الجهاز (كاشير، مساعد، مشرف، جرد) ليتم مشاركة البيانات تلقائياً مع الجهاز الرئيسي"}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 transition shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Dedicated Per-Device Unique Code Banner + Master Subscription Link */}
          <div className="mt-4 pt-3.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 bg-white/5 rounded-2xl px-4 py-2.5">
            <div className="flex items-center gap-2.5">
              <KeyRound className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <span className="text-[11px] text-slate-300 block">
                  الكود الخاص بهذا الجهاز فقط (Unique Device Code):
                </span>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="font-mono font-black text-sm sm:text-base tracking-wider text-amber-300" dir="ltr">
                    {String(deviceUniqueCode || "")}
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 border border-emerald-400/30 px-2 py-0.5 rounded text-emerald-300 font-mono" dir="ltr">
                    PIN: {String(deviceUniqueCode || "").replace(/[^0-9]/g, "").slice(0, 6)}
                  </span>
                  <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-slate-300 font-mono" dir="ltr">
                    الشبكة: {subscriptionBoundLinkCode}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyUniqueDeviceCode}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition shadow"
              >
                {copiedUniqueCode ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedUniqueCode ? "تم نسخ كود الجهاز" : "نسخ كود الجهاز الخاص"}
              </button>
              {!editingDevice && (
                <button
                  type="button"
                  onClick={handleRegenerateUniqueDeviceCode}
                  className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-amber-300 font-bold text-xs flex items-center gap-1 transition"
                  title="توليد كود جديد خاص بهذا الجهاز"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>كود جديد</span>
                </button>
              )}
              {!editingDevice && (
                <button
                  type="button"
                  onClick={() =>
                    setActiveMode(activeMode === "add_device" ? "qr_bound_code" : "add_device")
                  }
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  {activeMode === "add_device" ? "عرض باركود الربط QR" : "العودة لإعداد الجهاز"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {activeMode === "qr_bound_code" && !editingDevice ? (
            <div className="space-y-5">
              <div className="bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/40 dark:to-violet-950/30 border border-indigo-200 dark:border-indigo-800/60 rounded-3xl p-6 text-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 mb-3">
                  <Sparkles className="w-3.5 h-3.5" />
                  كود موحد مربوط بالجهاز الرئيسي وكود الاشتراك
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  امسح الباركود أو أدخل الكود في الجهاز الفرعي المراد إضافته
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-xl mx-auto">
                  بمجرد إدخال هذا الكود في الجهاز الآخر، سيتم ربطه تلقائياً باشتراكك وبجهازك الرئيسي كـ{" "}
                  <strong className="text-indigo-600 dark:text-indigo-400">
                    ({workPermissions.roleLabelAr})
                  </strong>{" "}
                  ومشاركة المبيعات والبيانات تلقائياً بدون الحاجة لأي كود مشاركة منفصل.
                </p>

                <div className="my-5 flex flex-col sm:flex-row items-center justify-center gap-6">
                  <div className="bg-white p-4 rounded-2xl shadow-md border border-slate-200">
                    <img
                      src={qrImageUrl}
                      alt="باركود ربط الجهاز الفرعي"
                      className="w-40 h-40 rounded-xl object-contain"
                    />
                  </div>
                  <div className="text-right space-y-3 max-w-sm">
                    <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-amber-500/40 dark:border-amber-500/30">
                      <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold block">
                        الكود الخاص بهذا الجهاز فقط (Unique Device Code):
                      </span>
                      <span
                        className="font-mono font-black text-base text-amber-600 dark:text-amber-400 tracking-wider block mt-0.5"
                        dir="ltr"
                      >
                        {deviceUniqueCode}
                      </span>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <span className="text-[11px] text-slate-400 font-bold block">
                        كود شبكة الاشتراك للجهاز الرئيسي:
                      </span>
                      <span
                        className="font-mono font-black text-sm text-indigo-600 dark:text-indigo-400 tracking-wider block mt-0.5"
                        dir="ltr"
                      >
                        {subscriptionBoundLinkCode}
                      </span>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <span className="text-[11px] text-slate-400 font-bold block">
                        الرمز الرقمي السريع (6 أرقام):
                      </span>
                      <div className="flex items-center justify-between mt-0.5">
                        <span
                          className="font-mono font-black text-xl tracking-[0.25em] text-slate-900 dark:text-white"
                          dir="ltr"
                        >
                          {masterPairingPin}
                        </span>
                        <button
                          type="button"
                          onClick={refreshMasterPin}
                          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          توليد جديد
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCopyUrl}
                        className="flex-1 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition"
                      >
                        {copiedUrl ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                        {copiedUrl ? "تم نسخ الرابط المباشر" : "نسخ رابط الربط المباشر"}
                      </button>
                      <a
                        href={pairingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2.5 px-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-xs flex items-center gap-1 transition"
                      >
                        <ExternalLink className="w-4 h-4" />
                        تجربة
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveOrPairDevice} className="space-y-6">
              {/* Step 1: Select Device Role */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs flex items-center justify-center font-black">
                      1
                    </span>
                    {businessMode === "restaurant"
                      ? "حدد وظيفة الجهاز المضاف (كاشير / نادل / شاشة مطبخ / مساعد):"
                      : "حدد وظيفة الجهاز المضاف (كاشير / مساعد / مشرف / جرد):"}
                  </label>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    الوظيفة المختارة: {workPermissions.roleLabelAr}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {rolesList.map((r) => {
                    const Icon = r.icon;
                    const isSelected = role === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => handleSelectRole(r.id)}
                        className={`text-right p-3.5 rounded-2xl border-2 transition-all flex items-start gap-3 ${
                          isSelected
                            ? "border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/40 shadow-md"
                            : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
                        }`}
                      >
                        <div
                          className={`p-2.5 rounded-xl bg-gradient-to-br ${r.badgeColor} text-white shadow-sm shrink-0`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                              {r.title}
                            </p>
                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                            {r.subtitle}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Device Name, Responsible Person & Hardware Type */}
              <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-4">
                <label className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs flex items-center justify-center font-black">
                    2
                  </span>
                  بيانات الجهاز واسم الموظف المسؤول:
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      اسم الجهاز في الشبكة
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={selectedRoleTitle}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      {businessMode === "restaurant"
                        ? "اسم الموظف (الكاشير / النادل / المساعد)"
                        : "اسم الموظف (الكاشير / المساعد / المشرف)"}
                    </label>
                    <input
                      type="text"
                      value={cashierName}
                      onChange={(e) => setCashierName(e.target.value)}
                      placeholder={`مثال: أحمد (${workPermissions.roleLabelAr})`}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      نوع الجهاز
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(
                        [
                          { id: "mobile", label: "جوال", icon: Smartphone },
                          { id: "tablet", label: "تابلت", icon: Tablet },
                          { id: "desktop", label: "كمبيوتر", icon: Monitor },
                        ] as const
                      ).map((t) => {
                        const TIcon = t.icon;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setDeviceType(t.id)}
                            className={`py-2 px-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition ${
                              deviceType === t.id
                                ? "border-indigo-600 bg-indigo-600 text-white"
                                : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400"
                            }`}
                          >
                            <TIcon className="w-3.5 h-3.5" />
                            {t.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Define Device Work & Automatic Data Sharing Permissions */}
              <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs flex items-center justify-center font-black">
                      3
                    </span>
                    <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    تحديد عمل الجهاز وصلاحياته ومشاركة البيانات التلقائية:
                  </label>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                    <Share2 className="w-3.5 h-3.5" />
                    مشاركة المبيعات والبيانات تلقائياً مع الجهاز الرئيسي مفعّلة
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    وصف عمل الجهاز ومهامه اليومية:
                  </label>
                  <input
                    type="text"
                    value={workDescription}
                    onChange={(e) => setWorkDescription(e.target.value)}
                    placeholder="حدد عمل الجهاز بالتفصيل..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Allowed Pages Selector determined by the Master Device */}
                <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/70 space-y-2.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <span className="text-xs font-black text-indigo-950 dark:text-indigo-200 block">
                        الصفحات التي تظهر لهذا الجهاز التابع فقط (حسب تحديد الجهاز الرئيسي):
                      </span>
                      <span className="text-[11px] text-slate-600 dark:text-slate-400">
                        {role === "secondary_pos"
                          ? "كاشير فرعي: محدد افتراضياً لكي لا تظهر له سوى صفحة الكاشير وصفحة الفواتير فقط (ويمكنك التعديل أدناه)"
                          : "اختر الصفحات التي يُسمح لهذا الجهاز التابع برؤيتها وفتحها فقط"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setWorkPermissions((prev) => ({
                          ...prev,
                          allowedPages: getDefaultAllowedPagesForRole(role),
                        }))
                      }
                      className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      إعادة ضبط افتراضي للدور
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(Object.entries(SUB_DEVICE_PAGE_LABELS) as [ActiveTab, string][]).map(
                      ([pageId, pageLabel]) => {
                        const currentAllowed =
                          workPermissions.allowedPages && workPermissions.allowedPages.length > 0
                            ? workPermissions.allowedPages
                            : getDefaultAllowedPagesForRole(role);
                        const isPageAllowed = currentAllowed.includes(pageId);
                        return (
                          <button
                            key={pageId}
                            type="button"
                            onClick={() => toggleAllowedPage(pageId)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black border flex items-center gap-1.5 transition cursor-pointer ${
                              isPageAllowed
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                                : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-indigo-400"
                            }`}
                          >
                            <div
                              className={`w-4 h-4 rounded flex items-center justify-center ${
                                isPageAllowed
                                  ? "bg-white/20 text-white"
                                  : "border border-slate-300 dark:border-slate-600"
                              }`}
                            >
                              {isPageAllowed && <Check className="w-3 h-3" />}
                            </div>
                            <span>{pageLabel}</span>
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {permissionItems.map((perm) => {
                    const isChecked = Boolean(workPermissions[perm.key]);
                    return (
                      <button
                        key={perm.key}
                        type="button"
                        onClick={() => togglePermission(perm.key)}
                        className={`p-3 rounded-xl border text-right flex items-start gap-2.5 transition ${
                          isChecked
                            ? "border-indigo-500/60 bg-indigo-50/70 dark:bg-indigo-950/30"
                            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 opacity-75"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center mt-0.5 shrink-0 transition ${
                            isChecked
                              ? "bg-indigo-600 text-white"
                              : "border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800"
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900 dark:text-white">
                            {perm.label}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {perm.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-300 text-xs font-bold text-center">
                  {error}
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-gradient-to-l from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-2xl font-black text-sm shadow-lg shadow-indigo-600/25 transition flex items-center gap-2 disabled:opacity-50"
                >
                  <Plus className="w-5 h-5" />
                  {isSubmitting
                    ? "جاري الحفظ والمزامنة..."
                    : editingDevice
                    ? "حفظ وظيفة وعمل الجهاز ومزامنته فوراً"
                    : `إضافة الجهاز (${workPermissions.roleLabelAr}) وتفعيل المشاركة التلقائية`}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
