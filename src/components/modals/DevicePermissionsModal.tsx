import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { LinkedDevice, ActiveTab, DeviceRole, DeviceWorkPermissions } from '../../types';
import {
  X,
  Shield,
  Sliders,
  Check,
  CheckCircle2,
  Tv,
  Monitor,
  Smartphone,
  Tablet,
  Laptop,
  ShoppingBag,
  ChefHat,
  Utensils,
  BookOpen,
  FileText,
  Boxes,
  Users,
  Receipt,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import {
  DEVICE_ROLE_WORK_PRESETS,
  RoleWorkPreset,
  getDefaultAllowedPagesForRole,
  SUB_DEVICE_PAGE_LABELS
} from '../../utils/licenseUtils';
import { soundEffects } from '../../services/audio';

interface DevicePermissionsModalProps {
  device: LinkedDevice | null;
  isOpen: boolean;
  onClose: () => void;
}

interface PageOption {
  id: ActiveTab;
  titleAr: string;
  descriptionAr: string;
  icon: React.ComponentType<{ className?: string }>;
  recommendedFor: DeviceRole[];
}

const AVAILABLE_PAGES: readonly PageOption[] = [
  {
    id: 'pos',
    titleAr: 'نقطة البيع (الكاشير)',
    descriptionAr: 'مسح الباركود، إضافة السلة، تحصيل المدفوعات النقدية والشبكة',
    icon: ShoppingBag,
    recommendedFor: ['secondary_pos', 'assistant', 'supervisor', 'master_pos']
  },
  {
    id: 'invoices',
    titleAr: 'سجل الفواتير والمبيعات',
    descriptionAr: 'استعراض الفواتير الصادرة، إعادة الطباعة، ومعاينة تفاصيل البيع',
    icon: FileText,
    recommendedFor: ['secondary_pos', 'assistant', 'supervisor', 'master_pos']
  },
  {
    id: 'restaurant',
    titleAr: 'المطعم وطلبات الطاولات',
    descriptionAr: 'خريطة الصالة، حجز الطاولات، وإرسال طلبات النوادل',
    icon: Utensils,
    recommendedFor: ['waiter_mobile', 'supervisor', 'master_pos']
  },
  {
    id: 'products',
    titleAr: 'المنتجات والأسعار',
    descriptionAr: 'استعراض الكتالوج، الأسعار، وفئات الأصناف',
    icon: BookOpen,
    recommendedFor: ['assistant', 'stock_scanner', 'supervisor', 'master_pos']
  },
  {
    id: 'inventory',
    titleAr: 'المخزون والمستودع',
    descriptionAr: 'جرد المستودع، التوريدات، مراقبة النواقص والكميات الحرجة',
    icon: Boxes,
    recommendedFor: ['stock_scanner', 'supervisor', 'master_pos']
  },
  {
    id: 'debts',
    titleAr: 'العملاء والديون',
    descriptionAr: 'سجل الذمم المدينة، كشوف الحسابات، وتسجيل دفعات السداد',
    icon: Users,
    recommendedFor: ['secondary_pos', 'supervisor', 'master_pos']
  },
  {
    id: 'expenses',
    titleAr: 'المصروفات النقدية',
    descriptionAr: 'تسجيل النثريات وفواتير المصاريف التشغيلية من الصندوق',
    icon: Receipt,
    recommendedFor: ['supervisor', 'master_pos']
  },
  {
    id: 'reports',
    titleAr: 'التقارير والأرباح',
    descriptionAr: 'ملخصات الأرباح، تقارير الإغلاق اليومي، ومؤشرات الأداء',
    icon: TrendingUp,
    recommendedFor: ['supervisor', 'master_pos']
  }
];

export const DevicePermissionsModal: React.FC<DevicePermissionsModalProps> = ({
  device,
  isOpen,
  onClose
}) => {
  const { updateSubDeviceRoleAndWork, updateDeviceAllowedPages, notify } = useApp();

  const [selectedRole, setSelectedRole] = useState<DeviceRole>('secondary_pos');
  const [selectedPages, setSelectedPages] = useState<ActiveTab[]>(['pos', 'invoices']);
  const [permissions, setPermissions] = useState<DeviceWorkPermissions>({
    allowPosSales: true,
    allowTableOrders: false,
    allowKitchenDisplay: false,
    allowCatalogAndStock: false,
    allowCustomersAndDebts: true,
    allowExpenses: false,
    canApplyDiscounts: true,
    autoShareDataWithMaster: true,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (device) {
      setSelectedRole(device.role || 'secondary_pos');
      const currentPages = (device.workPermissions?.allowedPages && device.workPermissions.allowedPages.length > 0)
        ? (device.workPermissions.allowedPages as ActiveTab[])
        : (device.allowedPages && device.allowedPages.length > 0)
        ? device.allowedPages
        : (getDefaultAllowedPagesForRole(device.role) as ActiveTab[]);
      setSelectedPages(currentPages);

      const perms = device.workPermissions || DEVICE_ROLE_WORK_PRESETS[device.role]?.permissions || {
        allowPosSales: true,
        allowTableOrders: false,
        allowKitchenDisplay: false,
        allowCatalogAndStock: false,
        allowCustomersAndDebts: false,
        allowExpenses: false,
        autoShareDataWithMaster: true,
      };
      setPermissions({
        ...perms,
        autoShareDataWithMaster: true,
      });
    }
  }, [device, isOpen]);

  if (!isOpen || !device) return null;

  const handleRolePresetChange = (role: DeviceRole) => {
    soundEffects.playCategorySwitch();
    setSelectedRole(role);
    const preset = DEVICE_ROLE_WORK_PRESETS[role];
    if (preset) {
      setPermissions(prev => ({
        ...prev,
        ...preset.permissions,
        autoShareDataWithMaster: true,
      }));
      const pages = getDefaultAllowedPagesForRole(role) as ActiveTab[];
      setSelectedPages(pages);
    }
  };

  const handleTogglePage = (pageId: ActiveTab) => {
    soundEffects.playClick();
    setSelectedPages(prev => {
      if (prev.includes(pageId)) {
        // Keep at least 1 page
        if (prev.length === 1) {
          notify('تنبيه', 'يجب إبقاء صفحة واحدة على الأقل متاحة للجهاز', 'warning');
          return prev;
        }
        return prev.filter(p => p !== pageId);
      } else {
        return [...prev, pageId];
      }
    });
  };

  const handleTogglePermission = (key: keyof DeviceWorkPermissions) => {
    soundEffects.playClick();
    setPermissions(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSelectAllPages = () => {
    soundEffects.playGlassTap();
    setSelectedPages(AVAILABLE_PAGES.map(p => p.id));
  };

  const handleSelectCashierOnly = () => {
    soundEffects.playGlassTap();
    setSelectedPages(['pos', 'invoices']);
  };

  const handleSave = async () => {
    if (!device) return;
    setIsSaving(true);
    soundEffects.playGlassPress();

    try {
      const preset = DEVICE_ROLE_WORK_PRESETS[selectedRole];
      const updatedPerms: DeviceWorkPermissions = {
        ...permissions,
        allowedPages: selectedPages,
        autoShareDataWithMaster: true,
      };

      // 1. Update sub-device role & permissions
      await updateSubDeviceRoleAndWork(device.id, {
        role: selectedRole,
        roleLabelAr: preset?.labelAr,
        workDescription: preset?.workDescriptionAr,
        workPermissions: updatedPerms,
      });

      // 2. Explicitly call updateDeviceAllowedPages to ensure synced allowedPages
      await updateDeviceAllowedPages(device.id, selectedPages);

      soundEffects.playSuccess();
      notify(
        'تم حفظ وتطبيق الصلاحيات بنجاح',
        `تم تحديث صلاحيات الجهاز "${device.name}" وتعيين ${selectedPages.length} صفحات مسموحة ومزامنتها فورياً`,
        'success'
      );
      onClose();
    } catch (err: any) {
      notify('خطأ في حفظ الصلاحيات', err?.message || 'تعذر تحديث الصلاحيات', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const getDeviceIcon = () => {
    if (device.role === 'kitchen_display') return Tv;
    if (device.role === 'waiter_mobile') return Smartphone;
    if (device.deviceType === 'mobile') return Smartphone;
    if (device.deviceType === 'tablet') return Tablet;
    return Laptop;
  };

  const DeviceIcon = getDeviceIcon();

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto text-start flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
              <DeviceIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-black tracking-tight">
                  تعديل صلاحيات وصفحات الجهاز
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  device.isOnline
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-slate-700 text-slate-300'
                }`}>
                  {device.isOnline ? '🟢 متصل بالشبكة' : '🔴 غير متصل'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 font-medium">
                {device.name} • {device.uniqueDeviceCode || device.id}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
            title="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs text-slate-700 dark:text-slate-300 flex-1">
          {/* 1. Quick Role Preset Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-black text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                <Shield className="w-3.5 h-3.5 text-amber-500" />
                <span>الدور التشغيلي للجهاز (Role Preset):</span>
              </label>
              <span className="text-[11px] text-slate-400">
                يحدد النمط الأساسي لعمل الجهاز تلقائياً
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'secondary_pos' as const, label: 'كاشير فرعي', icon: ShoppingBag, color: 'text-amber-500' },
                { id: 'kitchen_display' as const, label: 'شاشة مطبخ KDS', icon: ChefHat, color: 'text-rose-500' },
                { id: 'waiter_mobile' as const, label: 'نادل / كابتن صالة', icon: Utensils, color: 'text-emerald-500' },
                { id: 'customer_display' as const, label: 'شاشة الزبون CFD', icon: Tv, color: 'text-blue-500' },
                { id: 'assistant' as const, label: 'مساعد مبيعات', icon: BookOpen, color: 'text-indigo-500' },
                { id: 'supervisor' as const, label: 'مشرف / محاسب', icon: Shield, color: 'text-purple-500' }
              ].map(item => {
                const ItemIcon = item.icon;
                const isSelected = selectedRole === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleRolePresetChange(item.id)}
                    className={`p-2.5 rounded-2xl border text-start transition cursor-pointer flex items-center gap-2 ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500 text-slate-900 dark:text-white shadow-2xs'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className={`p-1.5 rounded-xl ${isSelected ? 'bg-amber-500 text-slate-950' : 'bg-white dark:bg-slate-700 text-slate-500'}`}>
                      <ItemIcon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-xs block truncate">{item.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Allowed Pages Selection (الصفحات المسموحة لهذا الجهاز) */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="font-black text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                  <Sliders className="w-3.5 h-3.5 text-amber-500" />
                  <span>الصفحات المسموح بظهورها في شاشة الجهاز:</span>
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  إذا حُدد للجهاز أن يكون كاشيراً، لن تظهر له سوى الصفحات التي يتم تفعيلها هنا.
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleSelectCashierOnly}
                  className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-[10px] font-bold transition cursor-pointer"
                >
                  كاشير فقط
                </button>
                <button
                  type="button"
                  onClick={handleSelectAllPages}
                  className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-[10px] font-bold transition cursor-pointer"
                >
                  تحديد الكل
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {AVAILABLE_PAGES.map(page => {
                const PageIcon = page.icon;
                const isChecked = selectedPages.includes(page.id);
                return (
                  <label
                    key={page.id}
                    className={`flex items-start gap-2.5 p-3 rounded-2xl border transition cursor-pointer select-none ${
                      isChecked
                        ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800 shadow-2xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleTogglePage(page.id)}
                      className="mt-0.5 w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <PageIcon className={`w-3.5 h-3.5 ${isChecked ? 'text-amber-500' : 'text-slate-400'}`} />
                        <span className={`font-black text-xs ${isChecked ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                          {page.titleAr}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                        {page.descriptionAr}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* 3. Granular Capabilities Switches (مفاتيح البيع والصلاحيات الميدانية) */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="font-black text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
              <Shield className="w-3.5 h-3.5 text-amber-500" />
              <span>مفاتيح الصلاحيات الميدانية للعمليات:</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { key: 'allowPosSales' as const, label: 'البيع وإصدار الفواتير وتحصيل المدفوعات' },
                { key: 'allowTableOrders' as const, label: 'استلام طلبات الطاولات وإرسالها للمطبخ' },
                { key: 'allowKitchenDisplay' as const, label: 'شاشة المطبخ وتجهيز الطلبات KDS' },
                { key: 'allowCatalogAndStock' as const, label: 'إدارة المنتجات وتحديث الكميات والمخزون' },
                { key: 'allowCustomersAndDebts' as const, label: 'إدارة سجل الزبائن وتحصيل الديون' },
                { key: 'allowExpenses' as const, label: 'تسجيل المصروفات النقدية من الصندوق' },
                { key: 'canApplyDiscounts' as const, label: 'إمكانية تطبيق الخصومات المئوية على الفواتير' }
              ].map(item => {
                const isActive = Boolean(permissions[item.key]);
                return (
                  <label
                    key={item.key}
                    className={`flex items-center justify-between p-2.5 rounded-2xl border transition cursor-pointer select-none ${
                      isActive
                        ? 'bg-slate-50 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700'
                        : 'bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-70'
                    }`}
                  >
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200 ps-1">
                      {item.label}
                    </span>
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={() => handleTogglePermission(item.key)}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 cursor-pointer"
                    />
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>سيتم تطبيق الصلاحيات ومزامنتها فورياً على الجهاز</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition border border-slate-200 dark:border-slate-700 cursor-pointer"
            >
              إلغاء
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 active:scale-95 text-slate-950 text-xs font-black transition flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>جارٍ الحفظ...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>حفظ وتطبيق فورياً على الجهاز</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
