import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { DeviceRole } from "../../types";
import {
  getDefaultWorkPermissionsForRole,
  getDefaultAllowedPagesForRole,
  SUB_DEVICE_PAGE_LABELS,
} from "../../utils/licenseUtils";
import {
  X,
  Wifi,
  Smartphone,
  Tablet,
  Monitor,
  ChefHat,
  Tv,
  ScanBarcode,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  Link2,
  UserCheck,
  Briefcase,
  Utensils,
  Crown,
  Share2,
} from "lucide-react";

interface ConnectToCashierModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const ConnectToCashierModal: React.FC<ConnectToCashierModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    isConnectToCashierModalOpen,
    setIsConnectToCashierModalOpen,
    pairDevice,
    setDedicatedDeviceRole,
    masterPairingPin,
    subscriptionBoundLinkCode,
    businessMode,
  } = useApp();

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedRole, setSelectedRole] = useState<DeviceRole>("secondary_pos");
  const [deviceName, setDeviceName] = useState("كاشير فرعي 2");
  const [connectedUserName, setConnectedUserName] = useState("أحمد محمود (كاشير)");
  const [pinCode, setPinCode] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState("");

  const modalOpen = isOpen !== undefined ? isOpen : isConnectToCashierModalOpen;
  const handleCloseModal = () => {
    setIsConnectToCashierModalOpen(false);
    if (onClose) onClose();
  };

  if (!modalOpen) return null;

  const allRoleOptions: {
    id: DeviceRole;
    title: string;
    subtitle: string;
    defaultName: string;
    deviceType: "mobile" | "tablet" | "desktop";
    icon: React.FC<{ className?: string }>;
    gradient: string;
    restaurantOnly?: boolean;
  }[] = [
    {
      id: "secondary_pos",
      title: "كاشير فرعي (نقطة بيع 2)",
      subtitle: "إصدار فواتير ومبيعات ومشاركتها تلقائياً مع الجهاز الرئيسي",
      defaultName: "كاشير فرعي 2",
      deviceType: "desktop",
      icon: Monitor,
      gradient: "from-indigo-600 to-violet-600",
    },
    {
      id: "waiter_mobile",
      title: "نادل (كابتن صالة وطلبات)",
      subtitle: "استلام طلبات الطاولات وإرسالها للمطبخ والجهاز الرئيسي",
      defaultName: "جهاز النادل 1",
      deviceType: "mobile",
      icon: Utensils,
      gradient: "from-violet-600 to-purple-600",
      restaurantOnly: true,
    },
    {
      id: "assistant",
      title: "مساعد (مساعد مبيعات وتجهيز)",
      subtitle: "تجهيز سلة الزبائن ومسح الأصناف ومساعدة الكاشير الرئيسي",
      defaultName: "جهاز المساعد 1",
      deviceType: "mobile",
      icon: UserCheck,
      gradient: "from-emerald-600 to-teal-600",
    },
    {
      id: "supervisor",
      title: "مشرف (متابعة وإدارة)",
      subtitle: "متابعة المبيعات والمخزون والديون ومنح الخصومات",
      defaultName: "جهاز المشرف",
      deviceType: "tablet",
      icon: Briefcase,
      gradient: "from-amber-600 to-orange-600",
    },
    {
      id: "stock_scanner",
      title: "مساعد مخزون وقارئ باركود",
      subtitle: "جرد المخزون ومسح الباركود وإرساله لسلة الجهاز الرئيسي",
      defaultName: "قارئ الباركود والجرد",
      deviceType: "mobile",
      icon: ScanBarcode,
      gradient: "from-cyan-600 to-blue-600",
    },
    {
      id: "kitchen_display",
      title: "شاشة المطبخ والتحضير (KDS)",
      subtitle: "عرض الطلبات الواردة من الجهاز الرئيسي والندلاء لحظياً",
      defaultName: "شاشة المطبخ 1",
      deviceType: "tablet",
      icon: ChefHat,
      gradient: "from-orange-500 to-red-600",
      restaurantOnly: true,
    },
    {
      id: "customer_display",
      title: "شاشة عرض الفاتورة للزبون (CFD)",
      subtitle: "عرض السلة الحية والمبلغ المطلوب أمام العميل مباشرة",
      defaultName: "شاشة الزبون",
      deviceType: "tablet",
      icon: Tv,
      gradient: "from-blue-600 to-indigo-600",
    },
  ];

  const roleOptions = allRoleOptions.filter((r) =>
    r.restaurantOnly ? businessMode === "restaurant" : true
  );

  const handleSelectRole = (option: (typeof roleOptions)[number]) => {
    setSelectedRole(option.id);
    setDeviceName(option.defaultName);
    setError("");
    setStep(2);
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleanPin = pinCode.trim();
    if (!cleanPin) {
      setError("يرجى إدخال كود الربط المربوط بالجهاز الرئيسي والاشتراك");
      return;
    }

    setIsConnecting(true);
    const chosenOption =
      roleOptions.find((r) => r.id === selectedRole) || roleOptions[0];
    const preset = getDefaultWorkPermissionsForRole(selectedRole);

    const res = await pairDevice({
      name: deviceName.trim() || chosenOption.defaultName,
      role: selectedRole,
      roleLabelAr: preset.roleLabelAr,
      workDescription: preset.workDescription,
      workPermissions: preset,
      deviceType: chosenOption.deviceType,
      pairingCode: cleanPin,
      uniqueDeviceCode: cleanPin.startsWith("DEV-") ? cleanPin : undefined,
      subscriptionLinkCode: cleanPin,
      cashierName: connectedUserName.trim() || preset.roleLabelAr,
      connectedUserName: connectedUserName.trim() || preset.roleLabelAr,
      branchName: "الفرع الرئيسي",
      registerAsCurrentSubDevice: true,
    });

    setIsConnecting(false);

    if (res.success) {
      setDedicatedDeviceRole(selectedRole);
      try {
        localStorage.setItem("kian_dedicated_device_role", selectedRole);
      } catch {}
      setIsConnectToCashierModalOpen(false);
      setStep(1);
      setPinCode("");
    } else {
      setError(
        res.error ||
          "كود الربط غير صحيح! تأكد من نسخ الكود المربوط بالجهاز الرئيسي والاشتراك."
      );
    }
  };

  const currentOption =
    roleOptions.find((r) => r.id === selectedRole) || roleOptions[0];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto"
      dir="rtl"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 my-auto">
        {/* Top Gradient Header */}
        <div className="relative bg-gradient-to-l from-indigo-950 via-slate-900 to-violet-950 text-white p-6 overflow-hidden">
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-amber-300 shadow-lg">
                <Link2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black">
                    ربط هذا الجهاز بالجهاز الرئيسي والاشتراك
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    مشاركة تلقائية
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  {businessMode === "restaurant"
                    ? "اختر وظيفة هذا الجهاز (كاشير، نادل، شاشة مطبخ، مساعد) وأدخل الكود الخاص بالجهاز"
                    : "اختر وظيفة هذا الجهاز (كاشير، مساعد، مشرف، جرد) وأدخل الكود الخاص بالجهاز"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsConnectToCashierModalOpen(false)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {step === 1 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  1. اختر وظيفة وعمل هذا الجهاز:
                </h3>
                <span className="text-xs text-slate-400 font-bold">
                  الخطوة 1 من 2
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[55vh] overflow-y-auto pr-1">
                {roleOptions.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectRole(opt)}
                      className="group text-right p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 transition-all flex items-start gap-3.5 shadow-sm hover:shadow-md"
                    >
                      <div
                        className={`p-3 rounded-2xl bg-gradient-to-br ${opt.gradient} text-white shadow-md shrink-0 group-hover:scale-105 transition-transform`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-black text-slate-900 dark:text-white text-xs sm:text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {opt.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                          {opt.subtitle}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <form onSubmit={handleConnect} className="space-y-5">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                  تغيير وظيفة الجهاز
                </button>
                <span className="text-xs text-slate-400 font-bold">
                  الخطوة 2 من 2
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 flex items-center gap-3.5">
                <div
                  className={`p-3 rounded-2xl bg-gradient-to-br ${currentOption.gradient} text-white shadow-md`}
                >
                  <currentOption.icon className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                    الوظيفة المحددة لهذا الجهاز:
                  </span>
                  <h4 className="font-black text-slate-900 dark:text-white text-base">
                    {currentOption.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                    <Share2 className="w-3 h-3 text-emerald-500" />
                    سيتم مشاركة المبيعات والطلبات تلقائياً مع الجهاز الرئيسي
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      اسم هذا الجهاز المتصل (يظهر للجهاز الرئيسي)
                    </label>
                    <input
                      type="text"
                      value={deviceName}
                      onChange={(e) => setDeviceName(e.target.value)}
                      placeholder={currentOption.defaultName}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      اسم المستخدم / الموظف (يظهر للجهاز الرئيسي)
                    </label>
                    <input
                      type="text"
                      value={connectedUserName}
                      onChange={(e) => setConnectedUserName(e.target.value)}
                      placeholder="مثال: أحمد محمود (كاشير)"
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Allowed Pages Notice */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] font-black text-slate-600 dark:text-slate-300 block mb-1.5">
                    الصفحات التي ستظهر لهذا الجهاز (حسب تحديد الجهاز الرئيسي):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {getDefaultAllowedPagesForRole(selectedRole).map((pageId) => (
                      <span
                        key={pageId}
                        className="px-2.5 py-1 rounded-lg bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 text-[11px] font-black border border-indigo-500/30"
                      >
                        {SUB_DEVICE_PAGE_LABELS[pageId] || pageId}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      أدخل الكود الخاص بهذا الجهاز أو كود الربط للجهاز الرئيسي
                    </label>
                    <button
                      type="button"
                      onClick={() => setPinCode(subscriptionBoundLinkCode)}
                      className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      استخدام كود الجهاز الرئيسي ({subscriptionBoundLinkCode})
                    </button>
                  </div>
                  <input
                    type="text"
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value.toUpperCase())}
                    placeholder="مثال: DEV-CSH-482910 أو KIAN-XXXX-YYYY-849210"
                    dir="ltr"
                    className="w-full px-4 py-3.5 rounded-2xl border-2 border-indigo-200 dark:border-indigo-800/80 bg-white dark:bg-slate-950 text-center font-mono text-base sm:text-lg font-black tracking-wider text-indigo-600 dark:text-indigo-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isConnecting}
                className="w-full py-4 bg-gradient-to-l from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-600/25 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <CheckCircle2 className="w-5 h-5" />
                {isConnecting
                  ? "جاري الربط وتفعيل المشاركة التلقائية..."
                  : "ربط بالجهاز الرئيسي وتفعيل مشاركة البيانات التلقائية"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
