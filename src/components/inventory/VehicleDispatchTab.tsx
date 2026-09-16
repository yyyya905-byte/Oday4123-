import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DeliveryVehicle, VehicleLoadingManifest, VehicleStatus } from '../../types';
import {
  Truck,
  Plus,
  RotateCcw,
  Printer,
  Search,
  Filter,
  Package,
  Coins,
  Building2,
  User,
  Phone,
  MapPin,
  CheckCircle2,
  Clock,
  AlertCircle,
  Edit2,
  Trash2,
  FileText,
  FileSpreadsheet,
  Layers
} from 'lucide-react';
import { NewVehicleManifestModal } from './NewVehicleManifestModal';
import { VehicleReconcileModal } from './VehicleReconcileModal';
import { PrintableManifestModal } from './PrintableManifestModal';
import { AddEditVehicleModal } from './AddEditVehicleModal';

export const VehicleDispatchTab: React.FC = () => {
  const {
    deliveryVehicles,
    vehicleManifests,
    wholesaleWarehouses,
    deleteDeliveryVehicle,
    updateVehicleStatus,
    formatCurrency,
    notify,
  } = useApp();

  // Modals state
  const [isNewManifestOpen, setIsNewManifestOpen] = useState(false);
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<DeliveryVehicle | null>(null);
  const [reconcilingManifest, setReconcilingManifest] = useState<VehicleLoadingManifest | null>(
    null
  );
  const [printingManifest, setPrintingManifest] = useState<VehicleLoadingManifest | null>(null);

  // Sub-view toggle: 'fleet' (vehicles grid) or 'manifests' (manifest archive table)
  const [activeSubTab, setActiveSubTab] = useState<'fleet' | 'manifests'>('fleet');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterWarehouse, setFilterWarehouse] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Active loaded manifests (currently in transit / loaded)
  const activeManifests = vehicleManifests.filter(
    (m) => m.status === 'dispatched' || m.status === 'loaded'
  );

  // KPI Calculations
  const vehiclesOnRoute = deliveryVehicles.filter((v) => v.status === 'on_route').length;
  const totalPackagesInTransit = activeManifests.reduce(
    (sum, m) => sum + m.totalPackagesLoaded,
    0
  );
  const totalCargoValueInTransit = activeManifests.reduce(
    (sum, m) => sum + m.totalWholesaleValue,
    0
  );

  // Filtered Vehicles
  const filteredVehicles = deliveryVehicles.filter((v) => {
    const matchesSearch =
      v.modelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.distributionRoute && v.distributionRoute.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesWarehouse =
      filterWarehouse === 'all' || v.assignedWarehouseId === filterWarehouse;

    const matchesStatus = filterStatus === 'all' || v.status === filterStatus;

    return matchesSearch && matchesWarehouse && matchesStatus;
  });

  // Filtered Manifests
  const filteredManifests = vehicleManifests.filter((m) => {
    const matchesSearch =
      m.manifestNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.vehiclePlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.warehouseName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesWarehouse =
      filterWarehouse === 'all' || m.warehouseId === filterWarehouse;

    const matchesStatus = filterStatus === 'all' || m.status === filterStatus;

    return matchesSearch && matchesWarehouse && matchesStatus;
  });

  const getStatusBadge = (status: VehicleStatus) => {
    switch (status) {
      case 'on_route':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-amber-500 text-slate-950 shadow-xs animate-pulse">
            <Truck className="w-3.5 h-3.5" />
            في جولة توزيع بضاعة
          </span>
        );
      case 'loading':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400">
            <Clock className="w-3.5 h-3.5" />
            قيد التحميل بالمستودع
          </span>
        );
      case 'returned_for_audit':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400">
            <RotateCcw className="w-3.5 h-3.5" />
            عادت — بانتظار مطابقة الجرد
          </span>
        );
      case 'maintenance':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400">
            <AlertCircle className="w-3.5 h-3.5" />
            في الصيانة
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            جاهزة للتحميل (فارغة)
          </span>
        );
    }
  };

  const getManifestStatusBadge = (status: VehicleLoadingManifest['status']) => {
    switch (status) {
      case 'dispatched':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
            في طريق التوزيع
          </span>
        );
      case 'reconciled':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
            تمت التسوية والإرجاع ✓
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400">
            ملغى
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400">
            محملة وجاهزة
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Vehicles on Route */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              سيارات قيد التوزيع حالياً
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {vehiclesOnRoute} <span className="text-xs font-bold text-slate-400">من أصل {deliveryVehicles.length} سيارة</span>
          </h3>
          <p className="text-[11px] text-amber-600 font-bold">
            جولات توزيع نشطة في الأسواق
          </p>
        </div>

        {/* Cargo Value in Transit */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              قيمة بضاعة الجملة المحمّلة بالسيارات
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {formatCurrency(totalCargoValueInTransit)}
          </h3>
          <p className="text-[11px] text-slate-400 font-semibold">
            بسعر الجملة المعتمد للتجار
          </p>
        </div>

        {/* Total Packages in Fleet */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              إجمالي الطرود المحملة بالأسطول
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
            {totalPackagesInTransit} طرد / كرتونة
          </h3>
          <p className="text-[11px] text-slate-400 font-semibold">
            عبر {activeManifests.length} سندات إخراج نشطة
          </p>
        </div>

        {/* Wholesale Warehouses Link */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              مستودعات الجملة المركزية
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {wholesaleWarehouses.length} مستودعات
          </h3>
          <p className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold">
            ربط ومزامنة فورية مع الفانات
          </p>
        </div>
      </div>

      {/* Main Control & Action Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Sub Tab Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl">
            <button
              onClick={() => setActiveSubTab('fleet')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                activeSubTab === 'fleet'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Truck className="w-4 h-4 text-amber-500" />
              <span>أسطول السيارات والحمولات الحية ({deliveryVehicles.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('manifests')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                activeSubTab === 'manifests'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4 text-amber-500" />
              <span>سجل سندات الإخراج والتحميل (المنافست) ({vehicleManifests.length})</span>
            </button>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                setEditingVehicle(null);
                setIsAddVehicleOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة سيارة نقل للأسطول</span>
            </button>

            <button
              onClick={() => setIsNewManifestOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Truck className="w-4 h-4" />
              <span>إصدار سند إخراج وتحميل سيارة نقل</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute top-3 right-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث برقم اللوحة، اسم السائق، أو الموديل..."
              className="w-full pl-3 pr-9 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-xs font-medium text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Warehouse Filter */}
          <select
            value={filterWarehouse}
            onChange={(e) => setFilterWarehouse(e.target.value)}
            className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-xs font-bold text-slate-900 dark:text-white outline-hidden"
          >
            <option value="all">جميع مستودعات الجملة</option>
            {wholesaleWarehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.nameAr}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-xs font-bold text-slate-900 dark:text-white outline-hidden"
          >
            <option value="all">جميع الحالات</option>
            {activeSubTab === 'fleet' ? (
              <>
                <option value="available">جاهزة للتحميل</option>
                <option value="on_route">في جولة توزيع</option>
                <option value="loading">قيد التحميل</option>
                <option value="returned_for_audit">بانتظار مطابقة الجرد</option>
              </>
            ) : (
              <>
                <option value="dispatched">في طريق التوزيع</option>
                <option value="reconciled">تمت التسوية والإرجاع</option>
                <option value="loaded">محملة</option>
              </>
            )}
          </select>
        </div>
      </div>

      {/* SUB-VIEW 1: Live Fleet Vehicles Cards */}
      {activeSubTab === 'fleet' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVehicles.length === 0 ? (
            <div className="col-span-full p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400">
              <Truck className="w-12 h-12 mx-auto mb-3 opacity-30 text-amber-500" />
              <h4 className="font-bold text-slate-700 dark:text-slate-300">
                لا توجد سيارات نقل مطابقة لمعايير البحث
              </h4>
              <p className="text-xs mt-1">
                يمكنك إضافة سيارة نقل جديدة عبر زر الإضافة أعلاه
              </p>
            </div>
          ) : (
            filteredVehicles.map((vehicle) => {
              // Find active manifest for this vehicle if any
              const activeManifest = vehicleManifests.find(
                (m) =>
                  m.vehicleId === vehicle.id &&
                  (m.status === 'dispatched' || m.status === 'loaded')
              );

              return (
                <div
                  key={vehicle.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs space-y-4 hover:border-amber-400 dark:hover:border-amber-500/50 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Top: Model, Plate & Status */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-slate-900 dark:text-white text-base">
                            {vehicle.modelName}
                          </h4>
                          <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                            {vehicle.plateNumber}
                          </span>
                        </div>
                        <div>{getStatusBadge(vehicle.status)}</div>
                      </div>

                      {/* Edit / Delete actions */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingVehicle(vehicle);
                            setIsAddVehicleOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="تعديل بيانات السيارة"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`هل تريد حذف سيارة ${vehicle.plateNumber}؟`)) {
                              deleteDeliveryVehicle(vehicle.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="حذف السيارة"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Driver & Warehouse Metadata */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-blue-500" />
                          <span>السائق / المندوب:</span>
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {vehicle.driverName}
                        </span>
                      </div>

                      {vehicle.driverPhone && (
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-emerald-500" />
                            <span>الهاتف:</span>
                          </span>
                          <span className="font-mono text-slate-700 dark:text-slate-300">
                            {vehicle.driverPhone}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px]">
                        <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-purple-500" />
                          <span>مستودع الجملة:</span>
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {vehicle.assignedWarehouseName || 'المستودع الرئيسي'}
                        </span>
                      </div>

                      {vehicle.distributionRoute && (
                        <div className="flex items-center gap-1 pt-1 text-[11px] text-amber-700 dark:text-amber-400 truncate">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{vehicle.distributionRoute}</span>
                        </div>
                      )}
                    </div>

                    {/* Active Cargo Box */}
                    {activeManifest ? (
                      <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1">
                            <Package className="w-3.5 h-3.5 text-amber-600" />
                            <span>الحمولة الحالية بالسيارة:</span>
                          </span>
                          <span className="font-mono text-[11px] font-black text-amber-800 dark:text-amber-400">
                            {activeManifest.manifestNumber}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-center pt-1">
                          <div className="bg-white/80 dark:bg-slate-800/80 p-2 rounded-xl">
                            <span className="text-[10px] text-slate-400 block">عدد الطرود:</span>
                            <span className="font-mono font-black text-slate-900 dark:text-white">
                              {activeManifest.totalPackagesLoaded} طرد
                            </span>
                          </div>
                          <div className="bg-white/80 dark:bg-slate-800/80 p-2 rounded-xl">
                            <span className="text-[10px] text-slate-400 block">قيمة الجملة:</span>
                            <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(activeManifest.totalWholesaleValue)}
                            </span>
                          </div>
                        </div>

                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                          <span>{activeManifest.items.length} أصناف محملة</span>
                          <button
                            type="button"
                            onClick={() => setPrintingManifest(activeManifest)}
                            className="font-bold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1"
                          >
                            <Printer className="w-3 h-3" />
                            <span>كشف الحمولة</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                        السيارة فارغة حالياً وجاهزة للتحميل
                      </div>
                    )}
                  </div>

                  {/* Actions Bar for the Vehicle */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                    {activeManifest ? (
                      <button
                        onClick={() => setReconcilingManifest(activeManifest)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs shadow-md transition-colors"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>تسوية وتصفية عهدة الجولة</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setIsNewManifestOpen(true)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-amber-500 hover:text-slate-950 dark:hover:bg-amber-400 dark:hover:text-slate-950 font-black text-xs transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        <span>تحميل بضاعة للسيارة</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* SUB-VIEW 2: Loading Manifests Archive Table */}
      {activeSubTab === 'manifests' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-500" />
              <span>أرشيف وسجلات سندات إخراج وتحميل البضاعة</span>
            </h3>
            <span className="text-xs font-mono text-slate-400">
              {filteredManifests.length} سند مسجل
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold">
                  <th className="py-3 px-4 text-start">رقم السند</th>
                  <th className="py-3 px-3 text-start">سيارة النقل / المندوب</th>
                  <th className="py-3 px-3 text-start">مستودع الجملة المصدر</th>
                  <th className="py-3 px-3 text-center">الطرود / القطع</th>
                  <th className="py-3 px-3 text-end">القيمة بسعر الجملة</th>
                  <th className="py-3 px-3 text-center">حالة السند</th>
                  <th className="py-3 px-3 text-start">تاريخ الإخراج</th>
                  <th className="py-3 px-4 text-end">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredManifests.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      لا توجد سندات تحميل مطابقة
                    </td>
                  </tr>
                ) : (
                  filteredManifests.map((manifest) => (
                    <tr
                      key={manifest.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                    >
                      <td className="py-3 px-4 font-mono font-black text-slate-900 dark:text-white">
                        {manifest.manifestNumber}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {manifest.vehiclePlate}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {manifest.driverName} ({manifest.vehicleModel})
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-700 dark:text-slate-300 font-medium">
                        {manifest.warehouseName}
                      </td>
                      <td className="py-3 px-3 text-center font-mono">
                        <span className="font-black text-slate-900 dark:text-white">
                          {manifest.totalPackagesLoaded} طرد
                        </span>
                        <span className="text-[11px] text-slate-400 block">
                          ({manifest.totalUnitsLoaded} قطعة)
                        </span>
                      </td>
                      <td className="py-3 px-3 text-end font-mono font-black text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(manifest.totalWholesaleValue)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {getManifestStatusBadge(manifest.status)}
                      </td>
                      <td className="py-3 px-3 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        {new Date(manifest.loadedAt).toLocaleDateString('ar-SY')}
                      </td>
                      <td className="py-3 px-4 text-end">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setPrintingManifest(manifest)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                            title="طباعة ومعاينة السند"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {(manifest.status === 'dispatched' || manifest.status === 'loaded') && (
                            <button
                              onClick={() => setReconcilingManifest(manifest)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-[11px] transition-colors"
                            >
                              تسوية العهدة
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {isNewManifestOpen && (
        <NewVehicleManifestModal
          onClose={() => setIsNewManifestOpen(false)}
          onCreated={(manifest) => {
            setIsNewManifestOpen(false);
            setPrintingManifest(manifest);
          }}
        />
      )}

      {isAddVehicleOpen && (
        <AddEditVehicleModal
          vehicle={editingVehicle}
          onClose={() => {
            setIsAddVehicleOpen(false);
            setEditingVehicle(null);
          }}
        />
      )}

      {reconcilingManifest && (
        <VehicleReconcileModal
          manifest={reconcilingManifest}
          onClose={() => setReconcilingManifest(null)}
        />
      )}

      {printingManifest && (
        <PrintableManifestModal
          manifest={printingManifest}
          onClose={() => setPrintingManifest(null)}
        />
      )}
    </div>
  );
};
