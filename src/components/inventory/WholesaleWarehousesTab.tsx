import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { WholesaleWarehouse, WholesaleWarehouseType } from '../../types';
import {
  Building2,
  Plus,
  ArrowLeftRight,
  MapPin,
  Phone,
  User,
  Package,
  CheckCircle2,
  X,
  Edit2,
  Trash2,
  ShieldCheck,
  Snowflake,
  Truck
} from 'lucide-react';

export const WholesaleWarehousesTab: React.FC = () => {
  const {
    wholesaleWarehouses,
    deliveryVehicles,
    products,
    addWholesaleWarehouse,
    updateWholesaleWarehouse,
    deleteWholesaleWarehouse,
    transferWarehouseStock,
    formatCurrency,
    notify,
  } = useApp();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<WholesaleWarehouse | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // Transfer Form State
  const [transferFromId, setTransferFromId] = useState<string>(
    wholesaleWarehouses[0]?.id || ''
  );
  const [transferToId, setTransferToId] = useState<string>(
    wholesaleWarehouses[1]?.id || wholesaleWarehouses[0]?.id || ''
  );
  const [transferProductId, setTransferProductId] = useState<string>(
    products[0]?.id || ''
  );
  const [transferQuantity, setTransferQuantity] = useState<number>(10);
  const [transferNotes, setTransferNotes] = useState<string>('');

  // Add / Edit Warehouse Form State
  const [whNameAr, setWhNameAr] = useState('');
  const [whNameEn, setWhNameEn] = useState('');
  const [whCode, setWhCode] = useState('');
  const [whType, setWhType] = useState<WholesaleWarehouseType>('main_wholesale');
  const [whLocation, setWhLocation] = useState('');
  const [whManager, setWhManager] = useState('');
  const [whPhone, setWhPhone] = useState('');
  const [whCapacity, setWhCapacity] = useState('5000 كرتونة');

  const openEditModal = (wh: WholesaleWarehouse) => {
    setEditingWarehouse(wh);
    setWhNameAr(wh.nameAr);
    setWhNameEn(wh.nameEn);
    setWhCode(wh.code);
    setWhType(wh.type);
    setWhLocation(wh.location);
    setWhManager(wh.managerName);
    setWhPhone(wh.managerPhone);
    setWhCapacity(wh.capacity || '');
    setIsAddModalOpen(true);
  };

  const openAddModal = () => {
    setEditingWarehouse(null);
    setWhNameAr('');
    setWhNameEn('');
    setWhCode(`WH-0${wholesaleWarehouses.length + 1}`);
    setWhType('main_wholesale');
    setWhLocation('');
    setWhManager('');
    setWhPhone('');
    setWhCapacity('5000 كرتونة');
    setIsAddModalOpen(true);
  };

  const handleSaveWarehouse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!whNameAr.trim() || !whCode.trim() || !whManager.trim()) {
      notify('يرجى ملء الحقول الإلزامية', '', 'warning');
      return;
    }

    if (editingWarehouse) {
      updateWholesaleWarehouse(editingWarehouse.id, {
        nameAr: whNameAr.trim(),
        nameEn: whNameEn.trim(),
        code: whCode.trim(),
        type: whType,
        location: whLocation.trim(),
        managerName: whManager.trim(),
        managerPhone: whPhone.trim(),
        capacity: whCapacity.trim(),
      });
    } else {
      addWholesaleWarehouse({
        nameAr: whNameAr.trim(),
        nameEn: whNameEn.trim(),
        code: whCode.trim(),
        type: whType,
        location: whLocation.trim(),
        managerName: whManager.trim(),
        phone: whPhone.trim(),
        managerPhone: whPhone.trim(),
        capacity: whCapacity.trim(),
        active: true,
        isMainWholesale: false,
      });
    }

    setIsAddModalOpen(false);
  };

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (transferFromId === transferToId) {
      notify('المستودع المصدر والمستهدف متطابقان', 'اختر مستودعاً مختلفاً للتحويل', 'warning');
      return;
    }
    if (transferQuantity <= 0) {
      notify('الكمية يجب أن تكون أكبر من صفر', '', 'warning');
      return;
    }

    const prod = products.find((p) => p.id === transferProductId);
    if (!prod) return;

    if (prod.stock < transferQuantity) {
      notify(
        'المخزون الحالي غير كافٍ للتحويل',
        `المتاح: ${prod.stock} ${prod.unit}`,
        'error'
      );
      return;
    }

    const sourceWh = wholesaleWarehouses.find((w) => w.id === transferFromId);
    const targetWh = wholesaleWarehouses.find((w) => w.id === transferToId);

    transferWarehouseStock({
      sourceWarehouseId: transferFromId,
      sourceWarehouseName: sourceWh?.nameAr || 'المستودع المصدر',
      targetWarehouseId: transferToId,
      targetWarehouseName: targetWh?.nameAr || 'المستودع الهدف',
      items: [
        {
          productId: prod.id,
          productNameAr: prod.nameAr,
          quantity: transferQuantity,
          unit: prod.unit,
        },
      ],
      reason: transferNotes || 'تحويل مخزني بين مستودعات الجملة',
    });

    setIsTransferModalOpen(false);
    setTransferNotes('');
  };

  const getTypeBadge = (type: WholesaleWarehouseType) => {
    switch (type) {
      case 'cold_storage':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-400">
            <Snowflake className="w-3 h-3" />
            مستودع تبريد وتجميد
          </span>
        );
      case 'distribution_hub':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
            <Truck className="w-3 h-3" />
            مركز لوجستي وتوزيع
          </span>
        );
      case 'buffer_depot':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400">
            <Package className="w-3 h-3" />
            مستودع احتياطي وطوارئ
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
            <Building2 className="w-3 h-3" />
            مستودع جملة مركزي رئيسي
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-500" />
            <span>مستودعات الجملة المركزية والمخازن اللوجستية</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            ربط مباشر مع أسطول سيارات النقل والتوزيع وإدارة التحويلات المخزنية
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsTransferModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors"
          >
            <ArrowLeftRight className="w-4 h-4 text-amber-500" />
            <span>تحويل بضاعة بين المستودعات</span>
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة مستودع جملة</span>
          </button>
        </div>
      </div>

      {/* Warehouses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {wholesaleWarehouses.map((wh) => {
          // Find vehicles assigned to this warehouse
          const assignedVehicles = deliveryVehicles.filter(
            (v) => v.assignedWarehouseId === wh.id
          );

          return (
            <div
              key={wh.id}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs space-y-4 hover:border-amber-400 dark:hover:border-amber-500/50 transition-all"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-slate-900 dark:text-white text-base">
                      {wh.nameAr}
                    </h4>
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {wh.code}
                    </span>
                  </div>
                  {getTypeBadge(wh.type)}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(wh)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="تعديل بيانات المستودع"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {wholesaleWarehouses.length > 1 && (
                    <button
                      onClick={() => {
                        if (confirm(`هل أنت متأكد من حذف مستودع ${wh.nameAr}؟`)) {
                          deleteWholesaleWarehouse(wh.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="حذف المستودع"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Warehouse Details */}
              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="truncate">{wh.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span>
                    أمين المستودع: <strong className="text-slate-900 dark:text-white">{wh.managerName}</strong>
                  </span>
                </div>
                {wh.managerPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="font-mono">{wh.managerPhone}</span>
                  </div>
                )}
                {wh.capacity && (
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px] text-slate-500">
                    <Package className="w-3 h-3 text-purple-500 shrink-0" />
                    <span>الطاقة الاستيعابية: {wh.capacity}</span>
                  </div>
                )}
              </div>

              {/* Assigned Vehicles */}
              <div className="pt-1">
                <span className="text-[11px] font-bold text-slate-400 block mb-1.5">
                  سيارات النقل المرتبطة بهذا المستودع:
                </span>
                {assignedVehicles.length === 0 ? (
                  <span className="text-[11px] text-slate-400 italic">
                    لا توجد سيارات مخصصة حالياً
                  </span>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {assignedVehicles.map((v) => (
                      <span
                        key={v.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                      >
                        <Truck className="w-3 h-3 text-amber-500" />
                        <span>{v.plateNumber}</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          ({v.driverName})
                        </span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Transfer Stock Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl max-w-lg w-full flex flex-col shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 bg-gradient-to-r from-amber-500/10 to-transparent border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-slate-950 shadow-md">
                  <ArrowLeftRight className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">
                    تحويل بضاعة بين مستودعات الجملة
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    نقل مخزون من مستودع لآخر مع توثيق الحركة في السجلات
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteTransfer} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    من المستودع (المصدر) *
                  </label>
                  <select
                    value={transferFromId}
                    onChange={(e) => setTransferFromId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white outline-hidden"
                  >
                    {wholesaleWarehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.nameAr}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    إلى المستودع (المستهدف) *
                  </label>
                  <select
                    value={transferToId}
                    onChange={(e) => setTransferToId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white outline-hidden"
                  >
                    {wholesaleWarehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.nameAr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  الصنف المراد تحويله *
                </label>
                <select
                  value={transferProductId}
                  onChange={(e) => setTransferProductId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white outline-hidden"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nameAr} (المتوفر بالمخزن: {p.stock} {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  الكمية المحولة (بالوحدة) *
                </label>
                <input
                  type="number"
                  min="1"
                  value={transferQuantity}
                  onChange={(e) => setTransferQuantity(parseInt(e.target.value) || 1)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-white outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  ملاحظات وسبب التحويل
                </label>
                <input
                  type="text"
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  placeholder="مثال: تغذية المستودع الاحتياطي استعداداً لعطلة نهاية الأسبوع"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black shadow-md cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تنفيذ التحويل المخزني فورياً</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Warehouse Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl max-w-lg w-full flex flex-col shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 bg-gradient-to-r from-amber-500/10 to-transparent border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-slate-950 shadow-md">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">
                    {editingWarehouse ? 'تعديل مستودع الجملة' : 'إضافة مستودع جملة مركزي جديد'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    إدارة المنشآت والمخازن التابعة للمؤسسة
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveWarehouse} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    اسم المستودع (بالعربية) *
                  </label>
                  <input
                    type="text"
                    required
                    value={whNameAr}
                    onChange={(e) => setWhNameAr(e.target.value)}
                    placeholder="مثال: مستودع الجملة المركزي"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white outline-hidden"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    كود المستودع *
                  </label>
                  <input
                    type="text"
                    required
                    value={whCode}
                    onChange={(e) => setWhCode(e.target.value)}
                    placeholder="مثال: WH-MAIN"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-white outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    نوع وتصنيف المستودع
                  </label>
                  <select
                    value={whType}
                    onChange={(e) => setWhType(e.target.value as WholesaleWarehouseType)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white outline-hidden"
                  >
                    <option value="main_wholesale">مستودع جملة مركزي رئيسي</option>
                    <option value="bulk_storage">مخزن بضائع فلت وشحنات كبرى</option>
                    <option value="cold_storage">مستودع تبريد وتجميد غذائي</option>
                    <option value="distribution_hub">مركز تجميع لوجستي وفانات</option>
                    <option value="buffer_depot">مستودع احتياطي</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    الطاقة الاستيعابية
                  </label>
                  <input
                    type="text"
                    value={whCapacity}
                    onChange={(e) => setWhCapacity(e.target.value)}
                    placeholder="مثال: 10,000 طرد"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  الموقع والعنوان التفصيلي
                </label>
                <input
                  type="text"
                  value={whLocation}
                  onChange={(e) => setWhLocation(e.target.value)}
                  placeholder="مثال: المنطقة الصناعية — طريق المطار"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    أمين ومسؤول المستودع *
                  </label>
                  <input
                    type="text"
                    required
                    value={whManager}
                    onChange={(e) => setWhManager(e.target.value)}
                    placeholder="مثال: م. زياد الحكيم"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white outline-hidden"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    هاتف أمين المستودع
                  </label>
                  <input
                    type="text"
                    value={whPhone}
                    onChange={(e) => setWhPhone(e.target.value)}
                    placeholder="مثال: +963 933 554 123"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-slate-900 dark:text-white outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black shadow-md cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingWarehouse ? 'حفظ التعديلات' : 'إضافة المستودع'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
