import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Users, MapPin, ChevronDown, Plus, Minus, X, QrCode, Eye, BellRing } from 'lucide-react';

interface RestaurantPOSHeaderProps {
  onOpenKitchenTicket?: () => void;
  onOpenGuestKeypad?: () => void;
}

export const RestaurantPOSHeader: React.FC<RestaurantPOSHeaderProps> = ({
  onOpenGuestKeypad
}) => {
  const {
    restaurantDiningType,
    setRestaurantDiningType,
    selectedTable,
    setSelectedTable,
    guestCount,
    setGuestCount,
    kitchenOrders,
    setIsRestaurantQrModalOpen,
    setIsCustomerMenuPreviewOpen,
    language,
  } = useApp();

  const [isTablePickerOpen, setIsTablePickerOpen] = useState(false);

  const pendingQrOrdersCount = useMemo(() => {
    return (kitchenOrders || []).filter(
      o => (o.isCustomerQrOrder || o.orderNumber?.startsWith('QR-')) && o.status !== 'completed'
    ).length;
  }, [kitchenOrders]);

  const restaurantZones = [
    {
      name: language === 'ar' ? 'الصالة الرئيسية' : 'Main Dining Area',
      tables: ['الطاولة 1', 'الطاولة 2', 'الطاولة 3', 'الطاولة 4', 'الطاولة 5', 'الطاولة 6'],
    },
    {
      name: language === 'ar' ? 'صالة كبار الزوار (VIP)' : 'VIP Lounge',
      tables: ['VIP 1 (رئيسي)', 'VIP 2 (عائلي)', 'VIP 3 (جلسة هادئة)'],
    },
    {
      name: language === 'ar' ? 'الشرفة والحديقة الخارجية' : 'Terrace & Garden',
      tables: ['شرفة 1', 'شرفة 2', 'شرفة 3', 'حديقة خارجية'],
    },
  ];

  return (
    <div className="apple-glass-card rounded-2xl px-3 py-2 flex flex-wrap items-center justify-between gap-2 max-w-full">
      {/* Apple Segmented Control for Dining Type */}
      <div className="flex items-center gap-1 apple-segmented p-1 rounded-xl">
        <button
          type="button"
          onClick={() => setRestaurantDiningType('dine_in')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95 whitespace-nowrap ${
            restaurantDiningType === 'dine_in'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>{language === 'ar' ? 'صالة داخلية' : 'Dine-In'}</span>
        </button>

        <button
          type="button"
          onClick={() => setRestaurantDiningType('takeaway')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95 whitespace-nowrap ${
            restaurantDiningType === 'takeaway'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>{language === 'ar' ? 'طلب سفري' : 'Takeaway'}</span>
        </button>

        <button
          type="button"
          onClick={() => setRestaurantDiningType('delivery')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95 whitespace-nowrap ${
            restaurantDiningType === 'delivery'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>{language === 'ar' ? 'توصيل دليفري' : 'Delivery'}</span>
        </button>
      </div>

      {/* Customer QR Menu & Print QR Code Actions */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          type="button"
          onClick={() => setIsRestaurantQrModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-black shadow-sm active:scale-95 transition-all cursor-pointer whitespace-nowrap"
          title="طباعة باركود QR لصفحة الزبائن وتحديد جهاز كل منتج وصورته"
        >
          <QrCode className="w-4 h-4" />
          <span>طباعة QR لصفحة الزبائن وتوجيه المنتجات</span>
          {pendingQrOrdersCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-slate-950 text-amber-400 text-[10px] font-mono font-black animate-pulse">
              {pendingQrOrdersCount} طلب
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setIsCustomerMenuPreviewOpen(true)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white text-xs font-bold border border-slate-700/60 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
          title="معاينة صفحة منيو الزبائن المخصصة"
        >
          <Eye className="w-3.5 h-3.5 text-amber-400" />
          <span>صفحة الزبون</span>
        </button>
      </div>

      {/* Table & Guest Controls (For Dine-In) */}
      {restaurantDiningType === 'dine_in' && (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsTablePickerOpen(!isTablePickerOpen)}
              className="flex items-center gap-1.5 bg-slate-200/60 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] px-3 py-1.5 rounded-xl text-xs font-bold text-slate-800 dark:text-white border border-white/60 dark:border-white/[0.08] transition-all cursor-pointer whitespace-nowrap"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{selectedTable}</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-60" />
            </button>

            {isTablePickerOpen && (
              <div className="absolute top-full end-0 mt-2 w-72 sm:w-80 apple-glass-card rounded-2xl p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/70 dark:border-white/[0.08] text-xs font-bold text-slate-900 dark:text-white">
                  <span>{language === 'ar' ? 'اختر الطاولة' : 'Select Table'}</span>
                  <button
                    type="button"
                    onClick={() => setIsTablePickerOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                    aria-label="إغلاق"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {restaurantZones.map(zone => (
                    <div key={zone.name} className="space-y-1.5">
                      <div className="text-[10px] font-bold text-slate-400">
                        {zone.name}
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        {zone.tables.map(tbl => (
                          <button
                            key={tbl}
                            type="button"
                            onClick={() => {
                              setSelectedTable(tbl);
                              setIsTablePickerOpen(false);
                            }}
                            className={`p-2 rounded-xl text-xs font-bold text-center border transition-all truncate cursor-pointer active:scale-95 ${
                              selectedTable === tbl
                                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 border-slate-900 dark:border-white'
                                : 'bg-white/60 dark:bg-white/[0.04] text-slate-700 dark:text-slate-200 border-slate-200/70 dark:border-white/[0.08]'
                            }`}
                          >
                            {tbl}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 bg-slate-200/60 dark:bg-white/[0.06] px-2.5 py-1 rounded-xl border border-white/60 dark:border-white/[0.08] text-xs">
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <button
              type="button"
              onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
              className="w-6 h-6 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center active:scale-90 transition-transform cursor-pointer"
              aria-label="تقليل الضيوف"
            >
              <Minus className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={onOpenGuestKeypad}
              className="font-mono tabular-nums font-bold text-slate-900 dark:text-white px-1.5 text-xs cursor-pointer"
            >
              {guestCount}
            </button>
            <button
              type="button"
              onClick={() => setGuestCount(guestCount + 1)}
              className="w-6 h-6 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center active:scale-90 transition-transform cursor-pointer"
              aria-label="زيادة الضيوف"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
