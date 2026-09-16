import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DeliveryVehicle, VehicleType } from '../../types';
import { Truck, X, CheckCircle2, Building2, User, Phone, MapPin, Scale } from 'lucide-react';

interface AddEditVehicleModalProps {
  vehicle?: DeliveryVehicle | null;
  onClose: () => void;
}

export const AddEditVehicleModal: React.FC<AddEditVehicleModalProps> = ({
  vehicle,
  onClose,
}) => {
  const {
    wholesaleWarehouses,
    addDeliveryVehicle,
    updateDeliveryVehicle,
    notify,
  } = useApp();

  const [plateNumber, setPlateNumber] = useState(vehicle?.plateNumber || '');
  const [modelName, setModelName] = useState(vehicle?.modelName || '');
  const [vehicleType, setVehicleType] = useState<VehicleType>(
    vehicle?.vehicleType || 'van'
  );
  const [driverName, setDriverName] = useState(vehicle?.driverName || '');
  const [driverPhone, setDriverPhone] = useState(vehicle?.driverPhone || '');
  const [driverCode, setDriverCode] = useState(
    vehicle?.driverCode || `MND-${Math.floor(100 + Math.random() * 900)}`
  );
  const [assignedWarehouseId, setAssignedWarehouseId] = useState(
    vehicle?.assignedWarehouseId || wholesaleWarehouses[0]?.id || ''
  );
  const [distributionRoute, setDistributionRoute] = useState(
    vehicle?.distributionRoute || ''
  );
  const [maxPayloadKg, setMaxPayloadKg] = useState(vehicle?.maxPayloadKg || 2000);
  const [notes, setNotes] = useState(vehicle?.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plateNumber.trim() || !modelName.trim() || !driverName.trim()) {
      notify('يرجى ملء جميع الحقول الإلزامية', '', 'warning');
      return;
    }

    const assignedWh = wholesaleWarehouses.find((w) => w.id === assignedWarehouseId);
    const assignedWarehouseName = assignedWh ? assignedWh.nameAr : 'المستودع الرئيسي';

    if (vehicle) {
      updateDeliveryVehicle(vehicle.id, {
        plateNumber: plateNumber.trim(),
        modelName: modelName.trim(),
        vehicleType,
        driverName: driverName.trim(),
        driverPhone: driverPhone.trim(),
        driverCode: driverCode.trim(),
        assignedWarehouseId,
        assignedWarehouseName,
        distributionRoute: distributionRoute.trim(),
        maxPayloadKg: Number(maxPayloadKg) || 2000,
        notes: notes.trim() || undefined,
      });
    } else {
      addDeliveryVehicle({
        plateNumber: plateNumber.trim(),
        modelName: modelName.trim(),
        vehicleType,
        driverName: driverName.trim(),
        driverPhone: driverPhone.trim(),
        driverCode: driverCode.trim(),
        assignedWarehouseId,
        assignedWarehouseName,
        distributionRoute: distributionRoute.trim(),
        maxPayloadKg: Number(maxPayloadKg) || 2000,
        status: 'available',
        notes: notes.trim() || undefined,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl max-w-xl w-full flex flex-col shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-amber-500/10 to-transparent border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-slate-950 shadow-md">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-lg text-slate-900 dark:text-white">
                {vehicle ? 'تعديل بيانات سيارة النقل' : 'إضافة سيارة نقل وتوزيع جديدة'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                تسجيل بيانات السائق، السيارة، والمستودع المربوطة به
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Model Name */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                نوع وموديل السيارة *
              </label>
              <input
                type="text"
                required
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder="مثال: فان تويوتا هايس تبريد"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500 outline-hidden"
              />
            </div>

            {/* Plate Number */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                رقم اللوحة والتسجيل *
              </label>
              <input
                type="text"
                required
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value)}
                placeholder="مثال: دمشق 412093"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold focus:ring-2 focus:ring-amber-500 outline-hidden"
              />
            </div>

            {/* Vehicle Type */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                تصنيف وسيلة النقل
              </label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value as VehicleType)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-hidden"
              >
                <option value="van">فان توزيع بضائع عادي</option>
                <option value="refrigerated_van">فان تبريد ومواد غذائية</option>
                <option value="light_truck">شاحنة خفيفة (بيك آب 3-5 طن)</option>
                <option value="heavy_truck">شاحنة ثقيلة / جامبو</option>
                <option value="pickup">سيارة بيك آب سريعة</option>
              </select>
            </div>

            {/* Driver Name */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                اسم السائق / المندوب *
              </label>
              <input
                type="text"
                required
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                placeholder="مثال: أحمد الخطيب"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-amber-500 outline-hidden"
              />
            </div>

            {/* Driver Phone */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                رقم هاتف المندوب
              </label>
              <input
                type="text"
                value={driverPhone}
                onChange={(e) => setDriverPhone(e.target.value)}
                placeholder="مثال: +963 944 112 334"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-amber-500 outline-hidden"
              />
            </div>

            {/* Assigned Warehouse */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                مستودع الجملة المعتمد *
              </label>
              <select
                value={assignedWarehouseId}
                onChange={(e) => setAssignedWarehouseId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-hidden"
              >
                {wholesaleWarehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.nameAr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Distribution Route */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300">
              خط ومنطقة التوزيع المعتادة
            </label>
            <input
              type="text"
              value={distributionRoute}
              onChange={(e) => setDistributionRoute(e.target.value)}
              placeholder="مثال: خط أسواق الجملة — باب سريجة، الميدان، الشاغور"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-hidden"
            />
          </div>

          {/* Max Payload and Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                الحمولة القصوى (كغ)
              </label>
              <input
                type="number"
                value={maxPayloadKg}
                onChange={(e) => setMaxPayloadKg(parseInt(e.target.value) || 0)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-hidden"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                ملاحظات
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="تفاصيل إضافية..."
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-hidden"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black shadow-md transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{vehicle ? 'حفظ التعديلات' : 'إضافة السيارة للأسطول'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
