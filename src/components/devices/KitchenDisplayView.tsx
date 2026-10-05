import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { KitchenOrder } from '../../types';
import { TARGET_DEVICE_OPTIONS } from '../menu/CustomerQrMenuPage';
import {
  UtensilsCrossed,
  Clock,
  CheckCircle2,
  AlertCircle,
  Volume2,
  RefreshCw,
  SlidersHorizontal,
  Flame,
  Check,
  UserCheck,
  ArrowRight,
  Sparkles,
  Monitor,
  QrCode,
  ShoppingBag,
} from 'lucide-react';
import { soundEffects } from '../../services/audio';

export const KitchenDisplayView: React.FC<{ onBackToMain?: () => void }> = ({ onBackToMain }) => {
  const { 
    kitchenOrders, 
    updateKitchenItemStatus, 
    loadKitchenOrderToCart,
    devices,
    formatCurrency, 
    language,
    t,
    settings 
  } = useApp();

  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'ready'>('all');
  const [diningFilter, setDiningFilter] = useState<'all' | 'dine_in' | 'takeaway' | 'delivery'>('all');
  const [stationFilter, setStationFilter] = useState<string>('all');
  const [now, setNow] = useState(Date.now());

  // Clock ticker for elapsed time calculation
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  const itemMatchesStation = (item: any, stFilter: string): boolean => {
    if (stFilter === 'all') return true;
    if (item.targetDeviceRole === 'all') return true;
    if (stFilter.startsWith('device:')) {
      const devId = stFilter.replace('device:', '');
      return item.targetDeviceId === devId;
    }
    if (stFilter.startsWith('role:')) {
      const role = stFilter.replace('role:', '');
      return (item.targetDeviceRole || 'kitchen_display') === role;
    }
    return true;
  };

  const filteredOrders = useMemo(() => {
    return kitchenOrders.filter(ord => {
      if (filter !== 'all' && ord.status !== filter) return false;
      if (diningFilter !== 'all' && ord.diningType !== diningFilter) return false;
      if (stationFilter !== 'all') {
        const hasMatchingItem = (ord.items || []).some(it => itemMatchesStation(it, stationFilter));
        if (!hasMatchingItem) return false;
      }
      return true;
    });
  }, [kitchenOrders, filter, diningFilter, stationFilter]);

  const getElapsedTimeMinutes = (createdAt: string) => {
    const diff = Math.floor((now - new Date(createdAt).getTime()) / 60000);
    return Math.max(0, diff);
  };

  const getOrderTimerBadge = (minutes: number) => {
    if (minutes >= 15) {
      return {
        bg: 'bg-rose-500 text-white animate-pulse',
        label: `${minutes} دقيقة ⚠️ (تأخير)`
      };
    }
    if (minutes >= 8) {
      return {
        bg: 'bg-amber-500 text-white',
        label: `${minutes} دقيقة`
      };
    }
    return {
      bg: 'bg-emerald-500 text-white',
      label: `${minutes} دقيقة`
    };
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 text-slate-100 overflow-hidden font-sans select-none">
      {/* Top KDS Header */}
      <div className="min-h-16 py-2 bg-slate-950 border-b border-slate-800 px-4 flex flex-wrap items-center justify-between gap-2 shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          {onBackToMain && (
            <button
              onClick={onBackToMain}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1 text-xs font-bold cursor-pointer"
            >
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              <span>{language === 'ar' ? 'الرجوع للنظام' : 'Back'}</span>
            </button>
          )}
          <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-black flex items-center gap-2">
              <span>{language === 'ar' ? 'شاشة الأجهزة الموجهة وإعداد الطلبات (KDS)' : 'Kitchen & Station Display (KDS)'}</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{language === 'ar' ? 'تزامن مباشر' : 'Live Sync'}</span>
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              {settings.storeNameAr} — يظهر هنا كل منتج حسب الجهاز الموجه له من المسؤول
            </p>
          </div>
        </div>

        {/* Filter Controls + Target Device Station Selector */}
        <div className="flex flex-wrap items-center gap-2 py-1">
          {/* Station / Device Target Filter */}
          <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1.5 rounded-xl border border-blue-500/40">
            <Monitor className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="text-[11px] font-bold text-slate-300">الجهاز المعروض:</span>
            <select
              value={stationFilter}
              onChange={e => setStationFilter(e.target.value)}
              className="bg-slate-800 text-amber-400 text-xs font-black px-2 py-1 rounded-lg border border-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">جميع الأجهزة والمحطات ({kitchenOrders.length})</option>
              <optgroup label="حسب القسم / الجهاز الموجه">
                {TARGET_DEVICE_OPTIONS.filter(o => o.role !== 'all').map(opt => (
                  <option key={opt.role} value={`role:${opt.role}`}>
                    {opt.labelAr}
                  </option>
                ))}
              </optgroup>
              {devices.length > 0 && (
                <optgroup label="أجهزة مربوطة بالشبكة">
                  {devices.map(dev => (
                    <option key={dev.id} value={`device:${dev.id}`}>
                      جهاز: {dev.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${filter === 'all' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-400 hover:text-white'}`}
            >
              {language === 'ar' ? 'الكل' : 'All'} ({filteredOrders.length})
            </button>
            <button
              onClick={() => setFilter('in_progress')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${filter === 'in_progress' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-400 hover:text-white'}`}
            >
              {language === 'ar' ? 'قيد التحضير' : 'Cooking'} ({kitchenOrders.filter(o => o.status === 'in_progress').length})
            </button>
            <button
              onClick={() => setFilter('ready')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${filter === 'ready' ? 'bg-emerald-500 text-slate-950 shadow-xs' : 'text-slate-400 hover:text-white'}`}
            >
              {language === 'ar' ? 'جاهز للتسليم' : 'Ready'} ({kitchenOrders.filter(o => o.status === 'ready').length})
            </button>
          </div>

          <button
            onClick={() => soundEffects.buttonClick()}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            title="اختبار جرس التنبيه"
          >
            <Volume2 className="w-4 h-4 text-amber-400" />
          </button>
        </div>
      </div>

      {/* Ticket Grid Body */}
      <div className="flex-1 p-4 overflow-y-auto">
        {filteredOrders.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 rounded-3xl bg-slate-800 flex items-center justify-center text-slate-600 mb-4">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            <h3 className="text-lg font-black text-slate-300">
              {language === 'ar' ? 'لا توجد طلبات معلقة لهذا الجهاز حالياً! 🎉' : 'All kitchen orders completed! 🎉'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              {language === 'ar' ? 'أي طلب جديد يُرسل من باركود الزبون (QR) أو الكاشير وموجه لهذا الجهاز سيظهر هنا فوراً مع تنبيه صوتي.' : 'New orders will automatically appear here with sound alert.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredOrders.map(order => {
              const elapsedMins = getElapsedTimeMinutes(order.createdAt);
              const timerBadge = getOrderTimerBadge(elapsedMins);
              const isQrOrder = order.isCustomerQrOrder || order.orderNumber?.startsWith('QR-');
              const visibleItems = (order.items || []).filter(it => itemMatchesStation(it, stationFilter));

              return (
                <div
                  key={order.id}
                  className={`bg-slate-800/90 rounded-2xl border flex flex-col overflow-hidden shadow-xl transition-all ${
                    order.status === 'ready' 
                      ? 'border-emerald-500/80 ring-2 ring-emerald-500/20' 
                      : isQrOrder
                      ? 'border-amber-500/70 ring-1 ring-amber-500/20'
                      : 'border-slate-700 hover:border-slate-600'
                  }`}
                >
                  {/* Ticket Header */}
                  <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-black text-amber-400">{order.orderNumber}</span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                          {order.tableName || (order.diningType === 'takeaway' ? 'سفري' : 'محلي')}
                        </span>
                        {isQrOrder && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 flex items-center gap-1">
                            <QrCode className="w-3 h-3" />
                            <span>طلب زبون QR</span>
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {order.customerName ? `الزبون: ${order.customerName} • ` : ''}{order.sourceDevice}
                      </span>
                    </div>

                    {/* Timer */}
                    <div className={`px-2.5 py-1 rounded-lg text-xs font-black flex items-center gap-1 ${timerBadge.bg}`}>
                      <Clock className="w-3 h-3" />
                      <span>{timerBadge.label}</span>
                    </div>
                  </div>

                  {/* Notes if any */}
                  {order.notes && (
                    <div className="px-3.5 py-2 bg-amber-950/40 border-b border-amber-900/30 text-amber-300 text-xs font-bold flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{order.notes}</span>
                    </div>
                  )}

                  {/* Order Items List */}
                  <div className="p-3.5 flex-1 divide-y divide-slate-700/60 overflow-y-auto max-h-72">
                    {visibleItems.map(item => {
                      const isReady = item.status === 'ready';
                      const isServed = item.status === 'served';

                      return (
                        <div key={item.id} className="py-2.5 flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5 flex-1 min-w-0">
                            {item.image && (
                              <img
                                src={item.image}
                                alt={item.nameAr}
                                className="w-10 h-10 rounded-xl object-cover shrink-0 border border-slate-700"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-lg bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0">
                                  {item.quantity}x
                                </span>
                                <span className={`text-xs font-bold truncate ${isReady || isServed ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                                  {language === 'ar' ? item.nameAr : item.nameEn}
                                </span>
                              </div>
                              {item.targetDeviceName && (
                                <span className="inline-block mt-1 text-[10px] font-bold text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-800/50">
                                  🖥️ {item.targetDeviceName}
                                </span>
                              )}
                              {item.notes && (
                                <p className="text-[11px] text-amber-400 mt-1 font-semibold">
                                  ⚠️ {item.notes}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Quick item state bumper */}
                          <div className="flex items-center gap-1 shrink-0">
                            {item.status !== 'ready' && item.status !== 'served' && (
                              <button
                                onClick={() => updateKitchenItemStatus(order.id, item.id, 'ready')}
                                className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-[11px] font-bold transition-all cursor-pointer"
                              >
                                {language === 'ar' ? 'جاهز ✅' : 'Ready'}
                              </button>
                            )}
                            {item.status === 'ready' && (
                              <button
                                onClick={() => updateKitchenItemStatus(order.id, item.id, 'served')}
                                className="px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-[11px] font-bold transition-all cursor-pointer"
                              >
                                {language === 'ar' ? 'تم التسليم 🍽️' : 'Served'}
                              </button>
                            )}
                            {item.status === 'served' && (
                              <span className="text-[10px] text-emerald-400 font-bold px-1.5 py-0.5 bg-emerald-950/60 rounded">
                                مكتمل
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Ticket Bump Bar Footer */}
                  <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
                    {isQrOrder && (
                      <button
                        onClick={() => {
                          loadKitchenOrderToCart(order);
                          if (onBackToMain) onBackToMain();
                        }}
                        className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-1 cursor-pointer shrink-0"
                        title="سحب الطلب إلى سلة الكاشير لإصدار الفاتورة"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>للسلة</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        visibleItems.forEach(it => {
                          if (it.status !== 'ready' && it.status !== 'served') {
                            updateKitchenItemStatus(order.id, it.id, 'ready');
                          }
                        });
                      }}
                      className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-black shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>{language === 'ar' ? 'تجهيز الكل' : 'Mark All Ready'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
