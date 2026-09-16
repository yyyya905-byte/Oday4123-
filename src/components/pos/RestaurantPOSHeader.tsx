import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DiningType } from '../../types';
import { UtensilsCrossed, Users, Sparkles, Clock, MapPin, Coffee, Check, ChevronDown, Plus, Minus, X } from 'lucide-react';

interface RestaurantPOSHeaderProps {
  onOpenKitchenTicket?: () => void;
  onOpenGuestKeypad?: () => void;
}

export const RestaurantPOSHeader: React.FC<RestaurantPOSHeaderProps> = ({ 
  onOpenKitchenTicket,
  onOpenGuestKeypad
}) => {
  const {
    restaurantDiningType,
    setRestaurantDiningType,
    selectedTable,
    setSelectedTable,
    guestCount,
    setGuestCount,
    currentUser,
    cart,
    language,
    t,
  } = useApp();

  const [isTablePickerOpen, setIsTablePickerOpen] = useState(false);

  // Table options with simulated area zones
  const restaurantZones = [
    {
      name: language === 'ar' ? 'الصالة الرئيسية' : 'Main Dining Area',
      tables: ['طاولة 1', 'طاولة 2', 'طاولة 3', 'طاولة 4', 'طاولة 5', 'طاولة 6'],
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
    <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white rounded-3xl p-3 sm:p-4 shadow-md border border-emerald-700/50 space-y-3 max-w-full overflow-hidden">
      {/* Top Row: Dining Mode Selector & Captain Info */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Dining Type Buttons */}
        <div className="flex items-center flex-wrap gap-1 bg-emerald-950/70 p-1 rounded-2xl border border-emerald-700/60 shadow-inner">
          <button
            type="button"
            onClick={() => setRestaurantDiningType('dine_in')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black min-h-[40px] transition-all cursor-pointer active:scale-95 ${
              restaurantDiningType === 'dine_in'
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-900/50'
                : 'text-emerald-200 hover:text-white hover:bg-emerald-900/50'
            }`}
          >
            <span>🍽️</span>
            <span>{language === 'ar' ? 'صالة داخلية' : 'Dine-In'}</span>
          </button>

          <button
            type="button"
            onClick={() => setRestaurantDiningType('takeaway')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black min-h-[40px] transition-all cursor-pointer active:scale-95 ${
              restaurantDiningType === 'takeaway'
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-900/50'
                : 'text-emerald-200 hover:text-white hover:bg-emerald-900/50'
            }`}
          >
            <span>🥡</span>
            <span>{language === 'ar' ? 'طلب سفري' : 'Takeaway'}</span>
          </button>

          <button
            type="button"
            onClick={() => setRestaurantDiningType('delivery')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black min-h-[40px] transition-all cursor-pointer active:scale-95 ${
              restaurantDiningType === 'delivery'
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-900/50'
                : 'text-emerald-200 hover:text-white hover:bg-emerald-900/50'
            }`}
          >
            <span>🛵</span>
            <span>{language === 'ar' ? 'توصيل دليفري' : 'Delivery'}</span>
          </button>
        </div>

        {/* Server / Captain & Time badge */}
        <div className="flex items-center gap-2 text-xs font-semibold">
          <div className="flex items-center gap-1.5 bg-emerald-950/60 px-3 py-2 rounded-xl border border-emerald-700/40 text-emerald-100 min-h-[40px]">
            <UtensilsCrossed className="w-3.5 h-3.5 text-emerald-400" />
            <span>{language === 'ar' ? 'الكابتن:' : 'Server:'} <strong className="text-white font-bold">{currentUser.name}</strong></span>
          </div>

          <div className="hidden md:flex items-center gap-1 bg-emerald-950/60 px-2.5 py-2 rounded-xl border border-emerald-700/40 text-emerald-200 font-mono text-[11px] min-h-[40px]">
            <Clock className="w-3 h-3 text-emerald-400" />
            <span>{new Date().toLocaleTimeString(language === 'ar' ? 'ar-SY' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      </div>

      {/* Bottom Sub-Row: Table & Guests Selection (If Dine-in) OR Takeaway Note */}
      {restaurantDiningType === 'dine_in' ? (
        <div className="relative flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-emerald-700/40">
          <div className="flex flex-wrap items-center gap-2">
            {/* Table Quick Dropdown Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsTablePickerOpen(!isTablePickerOpen)}
                className="flex items-center gap-2 bg-emerald-700/90 hover:bg-emerald-600 px-3.5 py-2 rounded-xl text-xs font-bold text-white border border-emerald-500/60 shadow-xs transition-all active:scale-95 min-h-[40px] cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 text-amber-300" />
                <span>{language === 'ar' ? 'الطاولة النشطة:' : 'Table:'} <strong>{selectedTable}</strong></span>
                <ChevronDown className="w-3.5 h-3.5 opacity-80" />
              </button>

              {/* Floor Plan / Table Dropdown Menu */}
              {isTablePickerOpen && (
                <div className="absolute top-full start-0 mt-2 w-72 sm:w-80 bg-slate-900 text-white rounded-2xl p-3 shadow-2xl border border-slate-700 z-50 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs font-bold text-emerald-400">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-emerald-400" />
                      <span>{language === 'ar' ? 'اختر طاولة الصالة' : 'Select Table'}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsTablePickerOpen(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      aria-label="إغلاق"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    {restaurantZones.map(zone => (
                      <div key={zone.name} className="space-y-1.5">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
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
                              className={`p-2.5 rounded-xl text-xs font-bold text-center border transition-all truncate min-h-[38px] cursor-pointer active:scale-95 ${
                                selectedTable === tbl
                                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-xs'
                                  : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
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

            {/* Quick Guest Count Controls */}
            <div className="flex items-center gap-2 bg-emerald-950/70 px-3 py-1.5 rounded-xl border border-emerald-700/50 text-xs min-h-[40px]">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px] text-emerald-200">{language === 'ar' ? 'الضيوف:' : 'Guests:'}</span>
              <button
                type="button"
                onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                className="w-7 h-7 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white font-bold flex items-center justify-center active:scale-90 transition-transform cursor-pointer"
                title={language === 'ar' ? 'تقليل عدد الضيوف' : 'Decrease Guests'}
                aria-label="تقليل الضيوف"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={onOpenGuestKeypad}
                className="font-mono font-bold text-white px-2 py-0.5 rounded-lg hover:bg-emerald-800/80 active:scale-95 text-sm transition-all cursor-pointer"
                title={language === 'ar' ? 'انقر لتعديل عدد الضيوف باللوحة الرقمية اللمسية' : 'Click to edit guest count with touch keypad'}
              >
                {guestCount}
              </button>
              <button
                type="button"
                onClick={() => setGuestCount(guestCount + 1)}
                className="w-7 h-7 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white font-bold flex items-center justify-center active:scale-90 transition-transform cursor-pointer"
                title={language === 'ar' ? 'زيادة عدد الضيوف' : 'Increase Guests'}
                aria-label="زيادة الضيوف"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Table Presets Badges */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs">
            <span className="text-[10px] text-emerald-300 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-emerald-400" />
              <span>{language === 'ar' ? 'طاولات سريعة:' : 'Quick:'}</span>
            </span>
            {['طاولة 1', 'طاولة 2', 'طاولة 3', 'VIP 1'].map(tName => (
              <button
                key={tName}
                type="button"
                onClick={() => setSelectedTable(tName)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all active:scale-95 cursor-pointer min-h-[34px] ${
                  selectedTable === tName
                    ? 'bg-amber-400 text-slate-900 border-amber-300 shadow-xs'
                    : 'bg-emerald-900/60 text-emerald-200 border-emerald-700/40 hover:bg-emerald-800'
                }`}
              >
                {tName}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between text-xs text-emerald-200 pt-2 border-t border-emerald-700/40">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-950/80 px-3 py-1.5 rounded-xl text-emerald-300 font-bold border border-emerald-700/40 min-h-[36px] flex items-center">
              {restaurantDiningType === 'takeaway' ? '📦 ' + (language === 'ar' ? 'تجهيز سريع للاستلام السفري' : 'Takeaway Order') : '🛵 ' + (language === 'ar' ? 'طلب توصيل مع العنوان' : 'Delivery Dispatch')}
            </span>
            <span className="text-[11px] opacity-80 hidden sm:inline">
              {language === 'ar' ? 'سيتم طباعة بون التحضير للمطبخ والتغليف تلقائياً' : 'Automated kitchen packaging tickets'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
