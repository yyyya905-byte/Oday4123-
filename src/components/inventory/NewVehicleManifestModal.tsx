import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, VehicleLoadingManifest, VehicleManifestItem } from '../../types';
import {
  Truck,
  Plus,
  Trash2,
  AlertTriangle,
  Building2,
  User,
  Package,
  X,
  CheckCircle2,
  Coins,
  FileText
} from 'lucide-react';

interface NewVehicleManifestModalProps {
  onClose: () => void;
  onCreated: (manifest: VehicleLoadingManifest) => void;
}

export const NewVehicleManifestModal: React.FC<NewVehicleManifestModalProps> = ({
  onClose,
  onCreated,
}) => {
  const {
    products,
    wholesaleWarehouses,
    deliveryVehicles,
    currentUser,
    createVehicleLoadingManifest,
    formatCurrency,
    notify,
  } = useApp();

  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(
    deliveryVehicles[0]?.id || ''
  );
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(
    wholesaleWarehouses[0]?.id || ''
  );
  const [routeArea, setRouteArea] = useState<string>(
    deliveryVehicles[0]?.distributionRoute || ''
  );
  const [notes, setNotes] = useState<string>('');

  // Loaded Items State
  const [loadedItems, setLoadedItems] = useState<
    Array<{
      productId: string;
      loadedPackages: number;
    }>
  >([]);

  // Selected vehicle & warehouse objects
  const selectedVehicle = deliveryVehicles.find((v) => v.id === selectedVehicleId);
  const selectedWarehouse = wholesaleWarehouses.find((w) => w.id === selectedWarehouseId);

  const handleVehicleChange = (vId: string) => {
    setSelectedVehicleId(vId);
    const v = deliveryVehicles.find((veh) => veh.id === vId);
    if (v) {
      if (v.assignedWarehouseId) {
        setSelectedWarehouseId(v.assignedWarehouseId);
      }
      if (v.distributionRoute) {
        setRouteArea(v.distributionRoute);
      }
    }
  };

  const handleAddItem = (productId: string) => {
    if (loadedItems.some((item) => item.productId === productId)) {
      notify('الصنف مضاف بالفعل', 'يمكنك تعديل عدد الطرود في الجدول أدناه', 'info');
      return;
    }
    setLoadedItems([...loadedItems, { productId, loadedPackages: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    setLoadedItems(loadedItems.filter((_, i) => i !== index));
  };

  const handleUpdatePackages = (index: number, packages: number) => {
    const updated = [...loadedItems];
    updated[index].loadedPackages = Math.max(1, packages);
    setLoadedItems(updated);
  };

  // Compute full manifest items details
  const manifestItems: VehicleManifestItem[] = loadedItems
    .map((item) => {
      const prod = products.find((p) => p.id === item.productId);
      if (!prod) return null;

      const unitMultiplier = prod.wholesaleUnitMultiplier || 1;
      const wholesaleUnit = prod.wholesaleUnit || 'طرد / كرتونة';
      const totalUnitsLoaded = item.loadedPackages * unitMultiplier;
      const wholesaleUnitPrice = prod.wholesalePrice || prod.price;
      const totalWholesaleValue = totalUnitsLoaded * wholesaleUnitPrice;
      const costPrice = prod.costPrice;

      return {
        productId: prod.id,
        productNameAr: prod.nameAr,
        productNameEn: prod.nameEn,
        barcode: prod.barcode,
        sku: prod.sku,
        wholesaleUnit,
        unitMultiplier,
        loadedPackages: item.loadedPackages,
        totalUnitsLoaded,
        costPrice,
        wholesaleUnitPrice,
        totalWholesaleValue,
        soldUnits: 0,
        returnedUnits: 0,
        damagedUnits: 0,
      };
    })
    .filter(Boolean) as VehicleManifestItem[];

  const totalPackages = manifestItems.reduce((sum, item) => sum + item.loadedPackages, 0);
  const totalUnits = manifestItems.reduce((sum, item) => sum + item.totalUnitsLoaded, 0);
  const totalCost = manifestItems.reduce(
    (sum, item) => sum + item.totalUnitsLoaded * item.costPrice,
    0
  );
  const totalWholesaleValue = manifestItems.reduce(
    (sum, item) => sum + item.totalWholesaleValue,
    0
  );

  // Check if any product has insufficient stock
  const hasInsufficientStock = manifestItems.some((item) => {
    const prod = products.find((p) => p.id === item.productId);
    return prod ? prod.stock < item.totalUnitsLoaded : true;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle || !selectedWarehouse) {
      notify('يرجى اختيار سيارة ومستودع الجملة', '', 'warning');
      return;
    }
    if (manifestItems.length === 0) {
      notify('يرجى إضافة أصناف لتحميلها في السيارة', '', 'warning');
      return;
    }

    if (hasInsufficientStock) {
      const confirmProceed = window.confirm(
        'تنبيه: الكمية المحملة لبعض الأصناف أكبر من المخزون الحالي في المستودع. هل تريد الاستمرار وإصدار السند؟'
      );
      if (!confirmProceed) return;
    }

    const newManifest = createVehicleLoadingManifest({
      vehicleId: selectedVehicle.id,
      vehiclePlate: selectedVehicle.plateNumber,
      vehicleModel: selectedVehicle.modelName,
      driverName: selectedVehicle.driverName,
      driverPhone: selectedVehicle.driverPhone,
      warehouseId: selectedWarehouse.id,
      warehouseName: selectedWarehouse.nameAr,
      dispatchOfficerId: currentUser?.id || 'usr_inventory',
      dispatchOfficerName: currentUser?.name || 'أمين مستودع الجملة',
      routeArea: routeArea || selectedVehicle.distributionRoute,
      items: manifestItems,
      totalPackagesLoaded: totalPackages,
      totalUnitsLoaded: totalUnits,
      totalCostValue: totalCost,
      totalWholesaleValue: totalWholesaleValue,
      notes: notes || undefined,
    });

    onCreated(newManifest);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-slate-950 shadow-md">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-lg text-slate-900 dark:text-white">
                إصدار أمر إخراج وتحميل سيارة نقل (سند جملة)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ربط مباشر بمستودعات الجملة المركزية وخصم الكميات من المخزون فورياً
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6 text-xs">
          {/* Top Selection Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Vehicle Selector */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-amber-500" />
                <span>سيارة النقل / المندوب *</span>
              </label>
              <select
                value={selectedVehicleId}
                onChange={(e) => handleVehicleChange(e.target.value)}
                required
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-hidden"
              >
                {deliveryVehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.modelName} — {v.plateNumber} ({v.driverName})
                  </option>
                ))}
              </select>
              {selectedVehicle && (
                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-0.5">
                  <span>السائق: {selectedVehicle.driverName}</span>
                  <span className="font-mono text-amber-600 font-bold">
                    حالة: {selectedVehicle.status === 'available' ? 'جاهزة' : 'محملة / في جولة'}
                  </span>
                </div>
              )}
            </div>

            {/* Source Warehouse Selector */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>مستودع الجملة المصدر *</span>
              </label>
              <select
                value={selectedWarehouseId}
                onChange={(e) => setSelectedWarehouseId(e.target.value)}
                required
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-hidden"
              >
                {wholesaleWarehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.nameAr} ({w.code})
                  </option>
                ))}
              </select>
              {selectedWarehouse && (
                <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                  أمين المستودع: {selectedWarehouse.managerName}
                </div>
              )}
            </div>

            {/* Distribution Route */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                منطقة وخط التوزيع المستهدف
              </label>
              <input
                type="text"
                value={routeArea}
                onChange={(e) => setRouteArea(e.target.value)}
                placeholder="مثال: أسواق الجملة — الشاغور وباب سريجة"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-hidden"
              />
            </div>
          </div>

          {/* Product Quick-Add Bar */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-500" />
                <span>إضافة بضائع وطرود لتحميلها في السيارة</span>
              </h4>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                اختر الصنف لإدراجه فورياً في كشف الحمولة
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
              {products.map((p) => {
                const isLoaded = loadedItems.some((item) => item.productId === p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleAddItem(p.id)}
                    className={`p-2.5 rounded-xl border text-start flex items-center justify-between transition-all ${
                      isLoaded
                        ? 'bg-amber-500/10 border-amber-500 text-amber-900 dark:text-amber-300 font-bold'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-amber-400 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div className="truncate pl-2">
                      <div className="font-bold truncate">{p.nameAr}</div>
                      <div className="text-[10px] text-slate-400">
                        متاح بالمستودع: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{p.stock}</span> {p.unit}
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                        isLoaded
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {isLoaded ? 'مُدرج ✓' : '+ إضافة'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Loaded Items Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 dark:text-white">
                جدول حمولة السيارة الحالية ({manifestItems.length} أصناف)
              </h4>
              <span className="text-[11px] text-slate-400">
                عدّل عدد الطرود/الكراتين لكل صنف
              </span>
            </div>

            {manifestItems.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-40 text-amber-500" />
                <p className="font-bold">لم تقم بإضافة أصناف للحمولة بعد</p>
                <p className="text-[11px]">اضغط على الأصناف أعلاه لإضافتها لسيارة النقل</p>
              </div>
            ) : (
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                      <th className="py-2.5 px-3 text-start">الصنف</th>
                      <th className="py-2.5 px-3 text-center">وحدة الجملة</th>
                      <th className="py-2.5 px-3 text-center">عدد الطرود المحملة</th>
                      <th className="py-2.5 px-3 text-center">إجمالي القطع</th>
                      <th className="py-2.5 px-3 text-center">المتوفر بالمستودع</th>
                      <th className="py-2.5 px-3 text-end">سعر الجملة للوحدة</th>
                      <th className="py-2.5 px-3 text-end">إجمالي القيمة</th>
                      <th className="py-2.5 px-3 text-center w-10">حذف</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {manifestItems.map((item, idx) => {
                      const prod = products.find((p) => p.id === item.productId);
                      const isOverStock = prod ? item.totalUnitsLoaded > prod.stock : false;

                      return (
                        <tr
                          key={item.productId}
                          className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/40 ${
                            isOverStock ? 'bg-rose-500/10' : ''
                          }`}
                        >
                          <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                            <div>{item.productNameAr}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {item.barcode}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-center text-slate-600 dark:text-slate-300">
                            {item.wholesaleUnit} ({item.unitMultiplier} قطع)
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="inline-flex items-center gap-1.5">
                              <input
                                type="number"
                                min="1"
                                value={item.loadedPackages}
                                onChange={(e) =>
                                  handleUpdatePackages(idx, parseInt(e.target.value) || 1)
                                }
                                className="w-16 p-1.5 text-center font-mono font-black text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden"
                              />
                              <span className="text-[11px] text-slate-400">طرد</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-amber-600 dark:text-amber-400">
                            {item.totalUnitsLoaded} قطعة
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono">
                            <span
                              className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                                isOverStock
                                  ? 'bg-rose-100 dark:bg-rose-950 text-rose-600'
                                  : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600'
                              }`}
                            >
                              {prod?.stock || 0}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-end font-mono text-slate-700 dark:text-slate-300">
                            {formatCurrency(item.wholesaleUnitPrice)}
                          </td>
                          <td className="py-2.5 px-3 text-end font-mono font-black text-slate-900 dark:text-white">
                            {formatCurrency(item.totalWholesaleValue)}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Manifest Totals Box */}
          <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs w-full sm:w-auto">
              <div>
                <span className="text-slate-400 block text-[11px]">إجمالي الطرود:</span>
                <span className="text-lg font-black font-mono text-amber-400">
                  {totalPackages} طرد/كرتونة
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">إجمالي الوحدات:</span>
                <span className="text-lg font-black font-mono text-white">
                  {totalUnits} قطعة
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">التكلفة الإجمالية:</span>
                <span className="text-lg font-bold font-mono text-slate-300">
                  {formatCurrency(totalCost)}
                </span>
              </div>
            </div>

            <div className="text-end w-full sm:w-auto border-t sm:border-t-0 sm:border-r border-slate-700 sm:pr-4 pt-2 sm:pt-0">
              <span className="text-slate-400 text-[11px] block">
                القيمة الإجمالية بسعر الجملة:
              </span>
              <span className="text-2xl font-black font-mono text-emerald-400">
                {formatCurrency(totalWholesaleValue)}
              </span>
            </div>
          </div>

          {/* Additional Notes */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300">
              ملاحظات أمر الإخراج والتحميل (اختياري)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: شحنة صباحية مستعجلة — يرجى التحصيل نقداً أو تسليم سند قبض"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-hidden"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={manifestItems.length === 0}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>تأكيد الإخراج وتحميل السيارة وخصم المخزون</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
