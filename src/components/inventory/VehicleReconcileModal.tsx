import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { VehicleLoadingManifest } from '../../types';
import {
  RotateCcw,
  Truck,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Coins,
  Package,
  X,
  FileSpreadsheet
} from 'lucide-react';

interface VehicleReconcileModalProps {
  manifest: VehicleLoadingManifest;
  onClose: () => void;
}

export const VehicleReconcileModal: React.FC<VehicleReconcileModalProps> = ({
  manifest,
  onClose,
}) => {
  const { reconcileVehicleManifest, formatCurrency, notify } = useApp();

  // State for each item's reconciliation quantities
  const [itemsData, setItemsData] = useState<
    Array<{
      productId: string;
      productNameAr: string;
      totalUnitsLoaded: number;
      wholesaleUnitPrice: number;
      soldUnits: number;
      returnedUnits: number;
      damagedUnits: number;
    }>
  >(() =>
    manifest.items.map((item) => ({
      productId: item.productId,
      productNameAr: item.productNameAr,
      totalUnitsLoaded: item.totalUnitsLoaded,
      wholesaleUnitPrice: item.wholesaleUnitPrice,
      soldUnits: item.soldUnits || item.totalUnitsLoaded,
      returnedUnits: item.returnedUnits || 0,
      damagedUnits: item.damagedUnits || 0,
    }))
  );

  const [cashCollected, setCashCollected] = useState<number>(manifest.cashCollected || 0);
  const [creditSalesAmount, setCreditSalesAmount] = useState<number>(
    manifest.creditSalesAmount || 0
  );
  const [reconciliationNotes, setReconciliationNotes] = useState<string>(
    manifest.reconciliationNotes || ''
  );

  const handleUpdateItem = (
    index: number,
    field: 'soldUnits' | 'returnedUnits' | 'damagedUnits',
    val: number
  ) => {
    const updated = [...itemsData];
    const item = { ...updated[index] };
    const num = Math.max(0, val);

    item[field] = num;

    // Auto-balance if sold is changed
    if (field === 'soldUnits') {
      const remaining = Math.max(0, item.totalUnitsLoaded - num - item.damagedUnits);
      item.returnedUnits = remaining;
    } else if (field === 'returnedUnits') {
      const sold = Math.max(0, item.totalUnitsLoaded - num - item.damagedUnits);
      item.soldUnits = sold;
    }

    updated[index] = item;
    setItemsData(updated);
  };

  // Calculations
  const totalSoldValue = itemsData.reduce(
    (sum, item) => sum + item.soldUnits * item.wholesaleUnitPrice,
    0
  );
  const totalReturnedUnits = itemsData.reduce((sum, item) => sum + item.returnedUnits, 0);
  const totalDamagedUnits = itemsData.reduce((sum, item) => sum + item.damagedUnits, 0);
  const totalSoldUnits = itemsData.reduce((sum, item) => sum + item.soldUnits, 0);

  // Check for any discrepancy in counts
  const discrepancies = itemsData.filter(
    (item) => item.soldUnits + item.returnedUnits + item.damagedUnits !== item.totalUnitsLoaded
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (discrepancies.length > 0) {
      const confirmDiscrepancy = window.confirm(
        'يوجد فارق بين الكمية المحملة ومجموع (المباع + المرتجع + التالف). هل تريد اعتماد التسوية رغم الفارق؟'
      );
      if (!confirmDiscrepancy) return;
    }

    reconcileVehicleManifest(manifest.id, {
      returnedItems: itemsData.map((it) => ({
        productId: it.productId,
        returnedUnits: it.returnedUnits,
        damagedUnits: it.damagedUnits,
        soldUnits: it.soldUnits,
      })),
      cashCollected: Number(cashCollected) || 0,
      creditSalesAmount: Number(creditSalesAmount) || 0,
      reconciliationNotes: reconciliationNotes || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 flex items-center justify-center text-slate-950 shadow-md">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-lg text-slate-900 dark:text-white">
                تسوية وتصفية عهدة سيارة نقل وإرجاع البضاعة للمستودع
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                سند رقم: <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{manifest.manifestNumber}</span> — سيارة: {manifest.vehiclePlate} ({manifest.driverName})
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

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6 text-xs">
          {/* Manifest Info Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80">
            <div>
              <span className="text-[11px] text-slate-500 block">السائق / المندوب:</span>
              <span className="font-bold text-slate-900 dark:text-white text-sm">
                {manifest.driverName}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">المستودع المرجع إليه:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {manifest.warehouseName}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">إجمالي القيمة المحملة:</span>
              <span className="font-mono font-black text-amber-600 dark:text-amber-400 text-sm">
                {formatCurrency(manifest.totalWholesaleValue)}
              </span>
            </div>
          </div>

          {/* Items Reconcile Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-500" />
                <span>جرد كميات الأصناف (المباع / المرتجع للمستودع / التالف)</span>
              </h4>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                الكميات المرتجعة ستعاد تلقائياً إلى رصيد مستودع الجملة
              </span>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                    <th className="py-2.5 px-3 text-start">الصنف</th>
                    <th className="py-2.5 px-3 text-center">الكمية المحملة</th>
                    <th className="py-2.5 px-3 text-center bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                      الكمية المباعة للتجار
                    </th>
                    <th className="py-2.5 px-3 text-center bg-blue-500/10 text-blue-700 dark:text-blue-400">
                      المرتجع للمستودع (إعادة)
                    </th>
                    <th className="py-2.5 px-3 text-center bg-rose-500/10 text-rose-700 dark:text-rose-400">
                      تالف / هالك
                    </th>
                    <th className="py-2.5 px-3 text-end">قيمة المبيعات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {itemsData.map((item, idx) => {
                    const isBalanced =
                      item.soldUnits + item.returnedUnits + item.damagedUnits ===
                      item.totalUnitsLoaded;

                    return (
                      <tr
                        key={item.productId}
                        className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/40 ${
                          !isBalanced ? 'bg-amber-500/10' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                          {item.productNameAr}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-black text-slate-700 dark:text-slate-300">
                          {item.totalUnitsLoaded} قطعة
                        </td>
                        {/* Sold Input */}
                        <td className="py-2.5 px-3 text-center bg-emerald-500/5">
                          <input
                            type="number"
                            min="0"
                            max={item.totalUnitsLoaded}
                            value={item.soldUnits}
                            onChange={(e) =>
                              handleUpdateItem(idx, 'soldUnits', parseInt(e.target.value) || 0)
                            }
                            className="w-20 p-1.5 text-center font-mono font-black text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden"
                          />
                        </td>
                        {/* Returned Input */}
                        <td className="py-2.5 px-3 text-center bg-blue-500/5">
                          <input
                            type="number"
                            min="0"
                            max={item.totalUnitsLoaded}
                            value={item.returnedUnits}
                            onChange={(e) =>
                              handleUpdateItem(idx, 'returnedUnits', parseInt(e.target.value) || 0)
                            }
                            className="w-20 p-1.5 text-center font-mono font-black text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden"
                          />
                        </td>
                        {/* Damaged Input */}
                        <td className="py-2.5 px-3 text-center bg-rose-500/5">
                          <input
                            type="number"
                            min="0"
                            max={item.totalUnitsLoaded}
                            value={item.damagedUnits}
                            onChange={(e) =>
                              handleUpdateItem(idx, 'damagedUnits', parseInt(e.target.value) || 0)
                            }
                            className="w-16 p-1.5 text-center font-mono font-bold text-rose-600 dark:text-rose-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-rose-500 outline-hidden"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-end font-mono font-black text-slate-900 dark:text-white">
                          {formatCurrency(item.soldUnits * item.wholesaleUnitPrice)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Reconciliation Box */}
          <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-4">
            <h4 className="font-bold text-xs text-amber-400 flex items-center gap-1.5">
              <Coins className="w-4 h-4" />
              <span>المطابقة المالية وتحصيلات السائق النقدية والذمم</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-400 font-bold block">
                  إجمالي قيمة المبيعات الفعلية بالجولة:
                </label>
                <div className="text-xl font-mono font-black text-emerald-400">
                  {formatCurrency(totalSoldValue)}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-400 font-bold block">
                  المبالغ النقدية المحصلة والمودعة بالصندوق:
                </label>
                <input
                  type="number"
                  min="0"
                  value={cashCollected}
                  onChange={(e) => setCashCollected(parseFloat(e.target.value) || 0)}
                  placeholder="المبلغ نقداً..."
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 font-mono font-black text-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-400 font-bold block">
                  مبيعات آجل / ذمم مسجلة على تجار الجملة:
                </label>
                <input
                  type="number"
                  min="0"
                  value={creditSalesAmount}
                  onChange={(e) => setCreditSalesAmount(parseFloat(e.target.value) || 0)}
                  placeholder="مبالغ الآجل..."
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 font-mono font-black text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>
            </div>

            {/* Reconciliation Balance check */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">إجمالي المرتجع للمستودع:</span>
                <span className="font-mono font-bold text-blue-400">
                  {totalReturnedUnits} قطعة
                </span>
                {totalDamagedUnits > 0 && (
                  <>
                    <span className="text-slate-500">|</span>
                    <span className="text-slate-400">تالف:</span>
                    <span className="font-mono font-bold text-rose-400">
                      {totalDamagedUnits} قطعة
                    </span>
                  </>
                )}
              </div>
              <div className="font-mono text-[11px]">
                {cashCollected + creditSalesAmount === totalSoldValue ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    المطابقة المالية متوازنة 100%
                  </span>
                ) : (
                  <span className="text-amber-400 font-bold">
                    فارق التحصيل: {formatCurrency(cashCollected + creditSalesAmount - totalSoldValue)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Reconciliation Notes */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300">
              ملاحظات وتفاصيل التسوية النهائية
            </label>
            <input
              type="text"
              value={reconciliationNotes}
              onChange={(e) => setReconciliationNotes(e.target.value)}
              placeholder="مثال: تم إرجاع 12 عبوة متبقية وسليمة للمستودع وتحصيل الدفعة النقدية كاملة"
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
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>تأكيد التسوية وإعادة البضاعة للمستودع وتحرير السيارة</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
