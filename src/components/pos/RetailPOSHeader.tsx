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
          <div>
            <button
              type="button"
              onClick={() => {
                soundEffects.playGlassPress();
                setIsCustomerSelectOpen(true);
              }}
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
              <div
                className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto modal-backdrop-animate text-slate-900 dark:text-white"
                onClick={e => {
                  if (e.target === e.currentTarget) {
                    setIsCustomerSelectOpen(false);
                  }
                }}
                role="dialog"
                aria-modal="true"
                aria-label={language === 'ar' ? 'اختيار عميل الولاء والمكافآت' : 'Select Loyalty Member'}
              >
                <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden flex flex-col max-h-[88vh] modal-enter-slide-down">
                  {/* Modal Header */}
                  <div className="p-4 sm:p-5 bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
                        <QrCode className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
                          {language === 'ar' ? 'اختيار عميل الولاء والمكافآت' : 'Select Loyalty Member'}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {language === 'ar'
                            ? `متاح ${retailCustomers.length} عميل بالتجزئة`
                            : `${retailCustomers.length} customers available`}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsCustomerSelectOpen(false)}
                      className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-200/60 dark:bg-slate-700/60 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer shrink-0"
                      aria-label={language === 'ar' ? 'إغلاق' : 'Close'}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Search Input Box */}
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800/70 bg-white dark:bg-slate-900 shrink-0">
                    <input
                      type="text"
                      value={customerSearchQuery}
                      onChange={e => setCustomerSearchQuery(e.target.value)}
                      placeholder={language === 'ar' ? 'بحث بالاسم، الكود أو رقم الهاتف...' : 'Search by name, code or phone...'}
                      className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      autoFocus
                    />
                  </div>

                  {/* Customers List */}
                  <div className="p-4 space-y-2 max-h-72 overflow-y-auto flex-1">
                    <div
                      onClick={() => {
                        soundEffects.playSuccess();
                        setSelectedCustomer(null);
                        setIsCustomerSelectOpen(false);
                      }}
                      className={`p-3.5 rounded-2xl border text-xs cursor-pointer min-h-[44px] flex items-center gap-2.5 transition-all ${
                        !selectedCustomer
                          ? 'bg-indigo-500/15 border-indigo-500 dark:border-indigo-400 text-slate-900 dark:text-white ring-2 ring-indigo-500/30 font-bold'
                          : 'bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <User className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span>{language === 'ar' ? 'عميل نقدي عام (بدون حساب نقاط)' : 'General Retail Customer'}</span>
                    </div>

                    {filteredRetailCustomers.map(cust => (
                      <div
                        key={cust.id}
                        onClick={() => {
                          soundEffects.playSuccess();
                          setSelectedCustomer(cust);
                          setIsCustomerSelectOpen(false);
                        }}
                        className={`p-3.5 rounded-2xl border text-xs cursor-pointer flex items-center justify-between min-h-[44px] transition-all ${
                          selectedCustomer?.id === cust.id
                            ? 'bg-indigo-500/15 border-indigo-500 dark:border-indigo-400 text-slate-900 dark:text-white ring-2 ring-indigo-500/30 font-bold'
                            : 'bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200/90 dark:border-slate-800/90 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{cust.name}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{cust.phone}</div>
                        </div>
                        <div className="text-end shrink-0">
                          <span className="text-amber-500 dark:text-amber-400 font-bold font-mono text-xs block">
                            ⭐ {cust.points} {language === 'ar' ? 'نقطة' : 'pts'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Modal Footer */}
                  <div className="p-3 bg-slate-50/80 dark:bg-slate-800/60 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 shrink-0">
                    <span>
                      {language === 'ar' ? 'انقر بالخارج للإغلاق' : 'Click outside to close'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsCustomerSelectOpen(false)}
                      className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-bold cursor-pointer transition-colors"
                    >
                      {language === 'ar' ? 'إغلاق' : 'Close'}
                    </button>
                  </div>
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
