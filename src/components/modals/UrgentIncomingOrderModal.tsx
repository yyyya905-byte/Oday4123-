import React, { useState, useEffect } from 'react';
import {
  Bell,
  Clock,
  CheckCircle2,
  ChefHat,
  ShoppingCart,
  X,
  Flame,
  Sparkles,
  Utensils,
  User,
  Phone,
  MapPin,
  AlertTriangle,
  ArrowRight,
  Coffee,
  CheckCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { soundEffects } from '../../services/audio';

export const UrgentIncomingOrderModal: React.FC = () => {
  const {
    urgentIncomingOrder,
    setUrgentIncomingOrder,
    urgentTableRequest,
    setUrgentTableRequest,
    confirmKitchenOrder,
    loadKitchenOrderToCart,
    acknowledgeTableServiceRequest,
    currentSubDeviceUserName,
    currentUser,
    formatCurrency,
  } = useApp();

  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Live timer counting elapsed seconds since order arrival
  useEffect(() => {
    if (!urgentIncomingOrder && !urgentTableRequest) {
      setElapsedSeconds(0);
      return;
    }

    const startTime = urgentIncomingOrder?.createdAt
      ? new Date(urgentIncomingOrder.createdAt).getTime()
      : urgentTableRequest?.createdAt
      ? new Date(urgentTableRequest.createdAt).getTime()
      : Date.now();

    const updateElapsed = () => {
      const now = Date.now();
      const diffSec = Math.max(0, Math.floor((now - startTime) / 1000));
      setElapsedSeconds(diffSec);
    };

    updateElapsed();
    const timer = setInterval(updateElapsed, 1000);

    // Play attention-grabbing double chime
    soundEffects.playBatchChime(1);
    const chimeTimer = setTimeout(() => {
      soundEffects.playSuccess();
    }, 280);

    return () => {
      clearInterval(timer);
      clearTimeout(chimeTimer);
    };
  }, [urgentIncomingOrder, urgentTableRequest]);

  if (!urgentIncomingOrder && !urgentTableRequest) {
    return null;
  }

  const staffName =
    currentSubDeviceUserName || currentUser?.name || 'الكاشير / النادل المسؤول';

  // Handle immediate order confirmation
  const handleConfirmOrder = () => {
    if (!urgentIncomingOrder) return;
    soundEffects.playSuccess();
    confirmKitchenOrder(urgentIncomingOrder.id, staffName, 'in_progress');
    setUrgentIncomingOrder(null);
  };

  // Handle pulling order to cashier cart
  const handleLoadToCart = () => {
    if (!urgentIncomingOrder) return;
    soundEffects.playCash();
    loadKitchenOrderToCart(urgentIncomingOrder);
    confirmKitchenOrder(urgentIncomingOrder.id, staffName, 'in_progress');
    setUrgentIncomingOrder(null);
  };

  // Handle acknowledging table service request
  const handleAcknowledgeService = () => {
    if (!urgentTableRequest) return;
    soundEffects.playSuccess();
    acknowledgeTableServiceRequest(urgentTableRequest.id, 'completed');
    setUrgentTableRequest(null);
  };

  const isDineIn = urgentIncomingOrder?.diningType === 'dine_in';
  const isTakeaway = urgentIncomingOrder?.diningType === 'takeaway';

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 select-none animate-in fade-in duration-150"
    >
      <div className="bg-white dark:bg-slate-900 border-2 border-amber-500/80 dark:border-amber-500/70 rounded-3xl shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 transform animate-in zoom-in-95 duration-200 ring-4 ring-amber-500/20">
        
        {/* Urgent Animated Header */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 p-4 sm:p-5 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60" />
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs border border-white/40 flex items-center justify-center font-bold relative shadow-inner">
                <Bell className="w-5 h-5 text-amber-200 animate-bounce" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  {urgentIncomingOrder
                    ? '⚡ تنبيه فوري: طلب زبون جديد (QR Menu)'
                    : '🔔 نداء طاولة عاجل بحاجة لتلبية'}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-white/25 text-white text-[11px] font-black border border-white/30 uppercase">
                  فوري
                </span>
              </div>
              <p className="text-xs text-amber-100 font-semibold mt-0.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-200" />
                <span>وصل منذ:</span>
                <span className="font-mono font-black text-white text-xs bg-black/25 px-1.5 py-0.2 rounded-md">
                  {elapsedSeconds} ثانية
                </span>
                <span className="opacity-80">· مطلوب التأكيد لتقليل وقت انتظار الزبون</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setUrgentIncomingOrder(null);
              setUrgentTableRequest(null);
            }}
            className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
            title="إغلاق التنبيه"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {urgentIncomingOrder && (
            <>
              {/* Table & Order Identification Card */}
              <div className="bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex flex-col items-center justify-center font-black shadow-md shrink-0">
                    <span className="text-[10px] leading-none uppercase font-bold opacity-80">
                      طلب
                    </span>
                    <span className="text-sm font-mono leading-none mt-0.5">
                      {urgentIncomingOrder.orderNumber || `#${urgentIncomingOrder.queueNumber || '1'}`}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-slate-900 dark:text-white">
                        {urgentIncomingOrder.tableName ||
                          (isDineIn ? 'صالة المطعم' : isTakeaway ? 'طلب سفري' : 'توصيل منزلي')}
                      </span>
                      <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {isDineIn ? 'داخلي' : isTakeaway ? 'سفري' : 'توصيل'}
                      </span>
                      {urgentIncomingOrder.guestCount && urgentIncomingOrder.guestCount > 1 && (
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                          ({urgentIncomingOrder.guestCount} أشخاص)
                        </span>
                      )}
                    </div>
                    {urgentIncomingOrder.customerName && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 flex items-center gap-1.5 font-medium">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>الزبون: {urgentIncomingOrder.customerName}</span>
                        {urgentIncomingOrder.customerPhone && (
                          <span className="text-slate-400 font-mono text-[11px] mr-2">
                            ({urgentIncomingOrder.customerPhone})
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-end">
                  <span className="text-[11px] font-bold text-slate-500 block">الإجمالي المطلوب</span>
                  <span className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(urgentIncomingOrder.totalAmount || 0)}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 px-1">
                  <span className="flex items-center gap-1">
                    <Utensils className="w-3.5 h-3.5 text-amber-500" />
                    الأصناف المطلوبة ({urgentIncomingOrder.items.length})
                  </span>
                  <span>الكمية والسعر</span>
                </div>

                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                  {urgentIncomingOrder.items.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200/90 dark:border-slate-700/80 rounded-2xl p-2.5 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 font-black font-mono flex items-center justify-center text-xs shrink-0">
                          {item.quantity}×
                        </span>
                        <div className="min-w-0">
                          <p className="font-extrabold text-slate-800 dark:text-slate-200 truncate">
                            {item.nameAr}
                          </p>
                          {item.notes && (
                            <p className="text-[11px] text-amber-700 dark:text-amber-300 font-semibold mt-0.5 bg-amber-500/10 px-1.5 py-0.5 rounded-md inline-block">
                              📝 ملاحظة: {item.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-end shrink-0">
                        <span className="font-black font-mono text-slate-900 dark:text-white">
                          {formatCurrency(item.unitPrice * item.quantity)}
                        </span>
                        {item.targetDeviceName && (
                          <span className="block text-[10px] text-slate-500 font-medium">
                            {item.targetDeviceName}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Customer General Notes */}
              {urgentIncomingOrder.notes && (
                <div className="p-3 rounded-2xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/50 text-xs">
                  <span className="font-black text-orange-800 dark:text-orange-300 block mb-0.5">
                    ملاحظات الزبون الإضافية:
                  </span>
                  <p className="text-slate-700 dark:text-slate-300 font-medium">
                    {urgentIncomingOrder.notes}
                  </p>
                </div>
              )}
            </>
          )}

          {/* Urgent Table Service Request (Call Waiter / Bill) */}
          {urgentTableRequest && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-xl bg-rose-500 text-white font-black text-xs">
                  نداء طاولة
                </span>
                <span className="font-mono text-xs font-bold text-slate-500">
                  {urgentTableRequest.tableName}
                </span>
              </div>
              <h4 className="text-sm font-black text-rose-900 dark:text-rose-200">
                {urgentTableRequest.labelAr || 'طلب خدمة من الطاولة'}
              </h4>
              {urgentTableRequest.notes && (
                <p className="text-xs text-slate-600 dark:text-slate-300 bg-white/70 dark:bg-slate-900/60 p-2 rounded-xl border border-rose-200 dark:border-rose-800/40">
                  {urgentTableRequest.notes}
                </p>
              )}
              <button
                type="button"
                onClick={handleAcknowledgeService}
                className="w-full mt-2 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-95"
              >
                <CheckCheck className="w-4 h-4" />
                <span>تم استلام وتلبية طلب الطاولة</span>
              </button>
            </div>
          )}
        </div>

        {/* Fast Action Buttons Bar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-2.5 shrink-0">
          {urgentIncomingOrder && (
            <>
              {/* Primary 1-Tap Confirmation */}
              <button
                type="button"
                onClick={handleConfirmOrder}
                className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 active:scale-95 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-5 h-5 text-white" />
                <span>تأكيد واستلام الطلب فوراً (للمطبخ والزبون) ⚡</span>
              </button>

              {/* Load to Cashier Cart */}
              <button
                type="button"
                onClick={handleLoadToCart}
                className="py-3 px-4 rounded-2xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-md"
                title="سحب الأصناف مباشرة لسلة المبيعات لمحاسبة الزبون"
              >
                <ShoppingCart className="w-4 h-4 text-amber-400" />
                <span>سحب للكاشير</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => {
              setUrgentIncomingOrder(null);
              setUrgentTableRequest(null);
            }}
            className="py-3 px-4 rounded-2xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
