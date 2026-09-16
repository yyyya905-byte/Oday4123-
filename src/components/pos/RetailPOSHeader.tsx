import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Store, ScanBarcode, QrCode, Star, Zap, ShoppingCart, Sparkles, X, User } from 'lucide-react';
import { soundEffects } from '../../services/audio';

interface RetailPOSHeaderProps {
  onScanBarcode: () => void;
  onScanCustomerQR: () => void;
}

export const RetailPOSHeader: React.FC<RetailPOSHeaderProps> = ({
  onScanBarcode,
  onScanCustomerQR,
}) => {
  const {
    selectedCustomer,
    setSelectedCustomer,
    customers,
    pointsToRedeem,
    setPointsToRedeem,
    settings,
    formatCurrency,
    language,
    t,
  } = useApp();

  const [isCustomerSelectOpen, setIsCustomerSelectOpen] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');

  const retailCustomers = customers.filter(c => c.customerType !== 'wholesale');

  const filteredRetailCustomers = retailCustomers.filter(c => {
    if (!customerSearchQuery.trim()) return true;
    const q = customerSearchQuery.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.customerCode.toLowerCase().includes(q);
  });

  return (
    <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-3 sm:p-4 shadow-md border border-blue-700/50 space-y-3 max-w-full overflow-hidden">
      {/* Top Row: Retail Title, Fast Barcode & Member Scanner */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
            <Store className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black text-blue-400 uppercase tracking-wide">
                {language === 'ar' ? 'كاشير التجزئة والسوبرماركت السريع' : 'Retail Express POS'}
              </span>
              <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full font-bold">
                {language === 'ar' ? 'الباركود الفوري نشط' : 'Scanner Ready'}
              </span>
            </div>
            <h3 className="text-sm font-extrabold text-white truncate">
              {selectedCustomer ? `${selectedCustomer.name} (عضوية)` : (language === 'ar' ? 'زبون نقدي مباشر' : 'Walk-in Retail Customer')}
            </h3>
          </div>
        </div>

        {/* Action Buttons: Scanner & Customer */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Scan Barcode Quick Trigger */}
          <button
            type="button"
            onClick={onScanBarcode}
            className="flex items-center gap-2 px-3.5 py-2 min-h-[40px] bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-xs font-bold border border-blue-500/60 shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <ScanBarcode className="w-4 h-4 text-blue-200" />
            <span>{t('scanBarcode')}</span>
          </button>

          {/* Customer QR / Member Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsCustomerSelectOpen(!isCustomerSelectOpen)}
              className={`flex items-center gap-2 px-3.5 py-2 min-h-[40px] rounded-xl text-xs font-bold border transition-all active:scale-95 cursor-pointer ${
                selectedCustomer
                  ? 'bg-amber-500 text-slate-900 border-amber-400 font-black shadow-xs'
                  : 'bg-indigo-800/80 hover:bg-indigo-700 text-white border-indigo-600/60'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>{selectedCustomer ? selectedCustomer.name : (language === 'ar' ? 'بطاقة العميل' : 'Customer Card')}</span>
            </button>

            {isCustomerSelectOpen && (
              <div className="absolute top-full end-0 mt-2 w-72 sm:w-80 bg-slate-900 text-white rounded-2xl p-3 shadow-2xl border border-slate-700 z-50 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs font-bold text-blue-400">
                  <span className="flex items-center gap-1.5">
                    <QrCode className="w-4 h-4" />
                    <span>{language === 'ar' ? 'اختيار عميل الولاء والمكافآت' : 'Select Loyalty Member'}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsCustomerSelectOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    aria-label="إغلاق"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <input
                  type="text"
                  value={customerSearchQuery}
                  onChange={e => setCustomerSearchQuery(e.target.value)}
                  placeholder={language === 'ar' ? 'بحث بالاسم أو الهاتف...' : 'Search by name or phone...'}
                  className="w-full pl-3 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 mb-2"
                  autoFocus
                />

                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                  <div
                    onClick={() => {
                      setSelectedCustomer(null);
                      setIsCustomerSelectOpen(false);
                    }}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer min-h-[38px] flex items-center gap-2 ${
                      !selectedCustomer ? 'bg-blue-950 border-blue-500 text-blue-200' : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    <User className="w-3.5 h-3.5 text-blue-400" />
                    <span>{language === 'ar' ? 'عميل نقدي عام (بدون نقاط)' : 'General Retail Customer'}</span>
                  </div>

                  {filteredRetailCustomers.map(cust => (
                    <div
                      key={cust.id}
                      onClick={() => {
                        setSelectedCustomer(cust);
                        setIsCustomerSelectOpen(false);
                      }}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer flex items-center justify-between min-h-[38px] ${
                        selectedCustomer?.id === cust.id
                          ? 'bg-blue-950 border-blue-500 text-white'
                          : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-750'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-blue-300">{cust.name}</div>
                        <div className="text-[10px] text-slate-400">{cust.phone}</div>
                      </div>
                      <div className="text-end">
                        <span className="text-amber-400 font-bold font-mono text-[11px] block">
                          ⭐ {cust.points} نقطة
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Selected Customer Points Banner in Retail Mode */}
      {selectedCustomer && settings.enableLoyaltyPoints && (
        <div className="pt-2 border-t border-blue-700/40 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 min-h-[36px]">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{language === 'ar' ? 'رصيد النقاط:' : 'Points:'} <strong>{selectedCustomer.points}</strong></span>
            </span>
            <span className="text-[11px] text-blue-200 hidden sm:inline">
              {language === 'ar' ? `قيمة الخصم المتاحة: ${formatCurrency(selectedCustomer.points * (settings.pointsRedeemRatio || 100))}` : 'Discount Value Available'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {selectedCustomer.points >= 10 && (
              <button
                type="button"
                onClick={() => {
                  const maxRedeem = Math.min(selectedCustomer.points, 100);
                  setPointsToRedeem(pointsToRedeem > 0 ? 0 : maxRedeem);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 min-h-[36px] rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                  pointsToRedeem > 0
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'bg-indigo-800 hover:bg-indigo-700 text-indigo-100 border border-indigo-600/60'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                <span>
                  {pointsToRedeem > 0
                    ? (language === 'ar' ? `تم تفعيل خصم ${pointsToRedeem} نقطة` : 'Points Applied')
                    : (language === 'ar' ? 'استبدال نقاط فوراً' : 'Redeem Points')}
                </span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
