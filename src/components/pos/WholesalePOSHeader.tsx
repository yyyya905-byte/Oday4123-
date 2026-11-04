import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Building2, UserCheck, Search, X, Check, CreditCard, Phone, Hash, AlertCircle } from 'lucide-react';
import { soundEffects } from '../../services/audio';

export const WholesalePOSHeader: React.FC = () => {
  const {
    customers,
    selectedCustomer,
    setSelectedCustomer,
    formatCurrency,
    language,
  } = useApp();

  const [isMerchantModalOpen, setIsMerchantModalOpen] = useState(false);
  const [merchantSearchQuery, setMerchantSearchQuery] = useState('');

  // Close modal on Escape key
  useEffect(() => {
    if (!isMerchantModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMerchantModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMerchantModalOpen]);

  const wholesaleCustomers = customers.filter(c => c.customerType === 'wholesale');

  const filteredMerchants = wholesaleCustomers.filter(c => {
    if (!merchantSearchQuery.trim()) return true;
    const q = merchantSearchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.companyName && c.companyName.toLowerCase().includes(q)) ||
      c.customerCode.toLowerCase().includes(q) ||
      c.phone.includes(q)
    );
  });

  const creditLimit = selectedCustomer?.creditLimit || 5000000;
  const currentDebt = selectedCustomer?.currentDebt || 0;
  const availableCredit = Math.max(0, creditLimit - currentDebt);

  const handleOpenModal = () => {
    soundEffects.playGlassPress();
    setIsMerchantModalOpen(true);
  };

  const handleSelectMerchant = (merchant: typeof customers[0] | null) => {
    soundEffects.playSuccess();
    setSelectedCustomer(merchant);
    setIsMerchantModalOpen(false);
  };

  return (
    <>
      <div className="apple-glass-card rounded-2xl px-3.5 py-2 flex flex-wrap items-center justify-between gap-2.5 max-w-full">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
              {selectedCustomer
                ? (selectedCustomer.companyName || selectedCustomer.name)
                : (language === 'ar' ? 'مبيعات جملة نقدية' : 'Cash Wholesale Sale')}
            </h3>
            {selectedCustomer && (
              <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                <span>{language === 'ar' ? 'الذمة:' : 'Debt:'} {formatCurrency(currentDebt)}</span>
                <span>·</span>
                <span>{language === 'ar' ? 'المتاح:' : 'Avail:'} {formatCurrency(availableCredit)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Merchant Select Trigger Button */}
        <div>
          <button
            type="button"
            onClick={handleOpenModal}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 cursor-pointer whitespace-nowrap min-h-[38px] ${
              selectedCustomer
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 border-amber-400 shadow-sm font-black'
                : 'bg-slate-200/60 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-800 dark:text-white border-white/60 dark:border-white/[0.08]'
            }`}
          >
            <UserCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>
              {selectedCustomer
                ? (language === 'ar' ? `التاجر: ${selectedCustomer.companyName || selectedCustomer.name}` : `Merchant: ${selectedCustomer.companyName || selectedCustomer.name}`)
                : (language === 'ar' ? 'اختيار تاجر جملة' : 'Select Merchant')}
            </span>
          </button>
        </div>
      </div>

      {/* Top-Level Full Screen Modal Dialog with Smooth Slide-Down Fade Animation */}
      {isMerchantModalOpen && (
        <div
          className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto modal-backdrop-animate"
          onClick={e => {
            if (e.target === e.currentTarget) {
              setIsMerchantModalOpen(false);
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-label={language === 'ar' ? 'سجل واختيار تجار الجملة' : 'Select Wholesale Merchant'}
        >
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden flex flex-col max-h-[88vh] modal-enter-slide-down">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
                    {language === 'ar' ? 'سجل واختيار تجار الجملة' : 'Select Wholesale Merchant'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {language === 'ar'
                      ? `متاح ${wholesaleCustomers.length} تاجر مسجل في النظام`
                      : `${wholesaleCustomers.length} registered merchants available`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsMerchantModalOpen(false)}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-200/60 dark:bg-slate-700/60 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer shrink-0"
                aria-label={language === 'ar' ? 'إغلاق' : 'Close'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input Box */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800/70 bg-white dark:bg-slate-900 shrink-0">
              <div className="relative">
                <input
                  type="text"
                  value={merchantSearchQuery}
                  onChange={e => setMerchantSearchQuery(e.target.value)}
                  placeholder={language === 'ar' ? 'ابحث باسم المحل، التاجر، الرمز أو رقم الهاتف...' : 'Search by store name, code or phone...'}
                  className="w-full ps-10 pe-9 py-2.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  autoFocus
                />
                <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-3" />
                {merchantSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setMerchantSearchQuery('')}
                    className="absolute end-3 top-2.5 p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Merchant List */}
            <div className="p-4 space-y-2 overflow-y-auto flex-1 min-h-[160px]">
              {/* Option 1: Walk-in Cash Sale */}
              <button
                type="button"
                onClick={() => handleSelectMerchant(null)}
                className={`w-full text-start p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  !selectedCustomer
                    ? 'bg-amber-500/15 border-amber-500 dark:border-amber-400 text-slate-900 dark:text-white ring-2 ring-amber-500/30 font-bold'
                    : 'bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    !selectedCustomer ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                  }`}>
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      {language === 'ar' ? 'عميل جملة نقدي عام (بدون حساب ذمة)' : 'Walk-in Cash Merchant (No Credit Account)'}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {language === 'ar' ? 'دفع نقدي فوري مباشر بالفاتورة' : 'Immediate cash settlement'}
                    </div>
                  </div>
                </div>

                {!selectedCustomer && (
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </span>
                )}
              </button>

              {/* Wholesale Merchants List */}
              {filteredMerchants.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs sm:text-sm flex flex-col items-center justify-center gap-2">
                  <AlertCircle className="w-6 h-6 opacity-40" />
                  <span>{language === 'ar' ? 'لم يتم العثور على تاجر يطابق البحث' : 'No merchant matched your search'}</span>
                </div>
              ) : (
                filteredMerchants.map(merchant => {
                  const isSelected = selectedCustomer?.id === merchant.id;
                  const mDebt = merchant.currentDebt || 0;
                  const mLimit = merchant.creditLimit || 5000000;
                  const isOverLimit = mDebt >= mLimit;

                  return (
                    <button
                      key={merchant.id}
                      type="button"
                      onClick={() => handleSelectMerchant(merchant)}
                      className={`w-full text-start p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500 dark:border-amber-400 text-slate-900 dark:text-white ring-2 ring-amber-500/30'
                          : 'bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200/90 dark:border-slate-800/90 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                            {merchant.companyName || merchant.name}
                          </span>
                          {merchant.companyName && merchant.name !== merchant.companyName && (
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              ({merchant.name})
                            </span>
                          )}
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            {merchant.customerCode}
                          </span>
                        </div>

                        <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums flex-wrap">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{merchant.phone}</span>
                          </span>
                          <span>·</span>
                          <span className={`font-semibold ${isOverLimit ? 'text-red-500' : 'text-slate-600 dark:text-slate-300'}`}>
                            {language === 'ar' ? 'الذمة:' : 'Debt:'} {formatCurrency(mDebt)}
                          </span>
                          <span>·</span>
                          <span>
                            {language === 'ar' ? 'السقف:' : 'Limit:'} {formatCurrency(mLimit)}
                          </span>
                        </div>
                      </div>

                      {isSelected ? (
                        <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </span>
                      ) : (
                        <div className="text-end shrink-0 hidden sm:block">
                          <span className="text-[11px] px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                            {language === 'ar' ? 'اختيار' : 'Select'}
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Modal Footer with Active Info */}
            <div className="p-3 bg-slate-50/80 dark:bg-slate-800/60 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 shrink-0">
              <span>
                {language === 'ar' ? 'اضغط Esc للإغلاق أو انقر بالخارج' : 'Press Esc to close or click outside'}
              </span>
              <button
                type="button"
                onClick={() => setIsMerchantModalOpen(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-bold cursor-pointer transition-colors"
              >
                {language === 'ar' ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

