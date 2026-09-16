import React from 'react';
import { VehicleLoadingManifest } from '../../types';
import { useApp } from '../../context/AppContext';
import { Printer, X, Truck, Building2, User, Calendar, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface PrintableManifestModalProps {
  manifest: VehicleLoadingManifest;
  onClose: () => void;
}

export const PrintableManifestModal: React.FC<PrintableManifestModalProps> = ({
  manifest,
  onClose,
}) => {
  const { settings, formatCurrency } = useApp();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white text-slate-900 rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Action Bar (Hidden on Print) */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm">سند إخراج ونقل بضاعة لسيارة جملة (معاينة الطباعة)</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة السند (A4 / حراري)</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 overflow-y-auto flex-1 bg-white text-slate-900 space-y-6 print:p-0 print:space-y-4">
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
            <div className="space-y-1">
              <h1 className="text-2xl font-black tracking-tight text-slate-950">
                {settings.storeNameAr || 'كيان كاشير'}
              </h1>
              <p className="text-xs text-slate-600 font-semibold">
                إدارة مستودعات الجملة والنقل المركزي والتوزيع المباشر
              </p>
              <p className="text-xs text-slate-500 font-mono">
                هاتف: {settings.phone || settings.mobile} | {settings.address}
              </p>
            </div>
            <div className="text-end space-y-1">
              <div className="inline-block px-3 py-1 bg-slate-950 text-white rounded-lg text-xs font-black tracking-wider uppercase">
                سند إخراج وحمولة سيارة جملة
              </div>
              <div className="font-mono text-sm font-bold text-slate-900">
                {manifest.manifestNumber}
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                تاريخ وتوقيت الإخراج: {new Date(manifest.loadedAt).toLocaleString('ar-SY')}
              </div>
            </div>
          </div>

          {/* Metadata Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-0.5">
              <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-amber-600" />
                <span>سيارة النقل واللوحة</span>
              </div>
              <div className="font-bold text-slate-900">{manifest.vehicleModel}</div>
              <div className="font-mono font-bold text-amber-700">{manifest.vehiclePlate}</div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-0.5">
              <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>السائق / المندوب المستلم</span>
              </div>
              <div className="font-bold text-slate-900">{manifest.driverName}</div>
              <div className="font-mono text-slate-600">{manifest.driverPhone}</div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-0.5 col-span-2 sm:col-span-1">
              <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>مستودع الجملة المصدر</span>
              </div>
              <div className="font-bold text-slate-900">{manifest.warehouseName}</div>
              <div className="text-[11px] text-slate-500">أمين المستودع: {manifest.dispatchOfficerName}</div>
            </div>
          </div>

          {/* Distribution Route */}
          {manifest.routeArea && (
            <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl text-xs flex items-center justify-between">
              <span className="font-bold text-amber-900">📍 منطقة وخط السير المستهدف:</span>
              <span className="font-semibold text-amber-950">{manifest.routeArea}</span>
            </div>
          )}

          {/* Items Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              بيان البضائع والطرود المحملة بالسيارة
            </h4>
            <div className="border border-slate-300 rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700">
                    <th className="py-2.5 px-3 text-center w-10">#</th>
                    <th className="py-2.5 px-3 text-start">اسم الصنف بالجملة</th>
                    <th className="py-2.5 px-3 text-center">الباركود / SKU</th>
                    <th className="py-2.5 px-3 text-center">وحدة الجملة</th>
                    <th className="py-2.5 px-3 text-center">عدد الطرود</th>
                    <th className="py-2.5 px-3 text-center">إجمالي الوحدات</th>
                    <th className="py-2.5 px-3 text-end">سعر الجملة للوحدة</th>
                    <th className="py-2.5 px-3 text-end">إجمالي القيمة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {manifest.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-center font-mono font-bold text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-3 font-bold text-slate-900">
                        {item.productNameAr}
                      </td>
                      <td className="py-2 px-3 text-center font-mono text-slate-500 text-[11px]">
                        {item.barcode || item.sku}
                      </td>
                      <td className="py-2 px-3 text-center text-slate-700">
                        {item.wholesaleUnit}
                      </td>
                      <td className="py-2 px-3 text-center font-mono font-black text-slate-900 bg-slate-50">
                        {item.loadedPackages}
                      </td>
                      <td className="py-2 px-3 text-center font-mono font-bold text-amber-800">
                        {item.totalUnitsLoaded}
                      </td>
                      <td className="py-2 px-3 text-end font-mono text-slate-700">
                        {formatCurrency(item.wholesaleUnitPrice)}
                      </td>
                      <td className="py-2 px-3 text-end font-mono font-black text-slate-950">
                        {formatCurrency(item.totalWholesaleValue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals Summary */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-slate-900 text-white rounded-2xl gap-3">
            <div className="flex items-center gap-6 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">إجمالي الطرود المحملة:</span>
                <span className="text-lg font-black font-mono text-amber-400">
                  {manifest.totalPackagesLoaded} طرد/كرتونة
                </span>
              </div>
              <div className="h-8 w-px bg-slate-700" />
              <div>
                <span className="text-slate-400 block text-[11px]">إجمالي عدد القطع:</span>
                <span className="text-lg font-black font-mono text-white">
                  {manifest.totalUnitsLoaded} قطعة
                </span>
              </div>
            </div>

            <div className="text-end">
              <span className="text-slate-400 text-xs block">القيمة الإجمالية بسعر الجملة:</span>
              <span className="text-xl font-black font-mono text-emerald-400">
                {formatCurrency(manifest.totalWholesaleValue)}
              </span>
            </div>
          </div>

          {/* Notes */}
          {manifest.notes && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <span className="font-bold text-slate-700">ملاحظات التحميل:</span>
              <p className="text-slate-600">{manifest.notes}</p>
            </div>
          )}

          {/* Signatures & Approvals */}
          <div className="grid grid-cols-2 gap-8 pt-6 border-t-2 border-dashed border-slate-300 text-xs">
            <div className="space-y-8 text-center p-4 border border-slate-200 rounded-2xl bg-slate-50/50">
              <div className="font-bold text-slate-800">
                توقيع واعتماد أمين مستودع الجملة (المُسلّم)
              </div>
              <div className="font-serif italic text-slate-400 pt-4">
                {manifest.dispatchOfficerName}
              </div>
              <div className="border-t border-slate-400 pt-1 text-[11px] text-slate-500">
                الاسم والتوقيع
              </div>
            </div>

            <div className="space-y-8 text-center p-4 border border-slate-200 rounded-2xl bg-slate-50/50">
              <div className="font-bold text-slate-800">
                توقيع وإقرار استلام السائق / المندوب (المُستلم بالعهدة)
              </div>
              <div className="font-serif italic text-slate-400 pt-4">
                {manifest.driverName}
              </div>
              <div className="border-t border-slate-400 pt-1 text-[11px] text-slate-500">
                أقر أنا السائق باستلام البضائع المبينة أعلاه سليمة ومطابقة
              </div>
            </div>
          </div>

          {/* Footer Security Badge */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-3 border-t border-slate-200">
            <div className="flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>نظام كيان كاشير المعتمد لإدارة مستودعات الجملة وأساطيل النقل</span>
            </div>
            <div className="font-mono">
              سند رسمي موثق إلكترونياً | {manifest.id}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
