import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Building2, UserCheck, Search, X } from 'lucide-react';

export const WholesalePOSHeader: React.FC = () => {
  const {
    customers,
    selectedCustomer,
    setSelectedCustomer,
    formatCurrency,
    language,
  } = useApp();

  const [isMerchantDropdownOpen, setIsMerchantDropdownOpen] = useState(false);
  const [merchantSearchQuery, setMerchantSearchQuery] = useState('');

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

  return (
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

      {/* Merchant Select Dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsMerchantDropdownOpen(!isMerchantDropdownOpen)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-200/60 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-800 dark:text-white rounded-xl text-xs font-bold border border-white/60 dark:border-white/[0.08] transition-all active:scale-95 cursor-pointer whitespace-nowrap"
        >
          <UserCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span>
            {selectedCustomer
              ? (language === 'ar' ? 'تغيير التاجر' : 'Change Merchant')
              : (language === 'ar' ? 'اختيار تاجر جملة' : 'Select Merchant')}
          </span>
        </button>

        {isMerchantDropdownOpen && (
          <div className="absolute top-full end-0 mt-2 w-80 sm:w-96 apple-glass-card rounded-2xl p-3.5 shadow-2xl z-50 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/70 dark:border-white/[0.08]">
              <span className="text-xs font-black text-slate-900 dark:text-white">
                {language === 'ar' ? 'سجل التجار والموزعين' : 'Merchant Accounts'}
              </span>
              <button
                type="button"
                onClick={() => setIsMerchantDropdownOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
                aria-label="إغلاق"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative mb-2">
              <input
                type="text"
                value={merchantSearchQuery}
                onChange={e => setMerchantSearchQuery(e.target.value)}
                placeholder={language === 'ar' ? 'ابحث باسم المحل أو الهاتف...' : 'Search merchant...'}
                className="w-full ps-8 pe-3 py-1.5 bg-slate-200/60 dark:bg-white/[0.06] border border-white/60 dark:border-white/[0.08] rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                autoFocus
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute start-2.5 top-2" />
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto">
              <div
                onClick={() => {
                  setSelectedCustomer(null);
                  setIsMerchantDropdownOpen(false);
                }}
                className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                  !selectedCustomer
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 border-slate-900 dark:border-white'
                    : 'bg-white/60 dark:bg-white/[0.04] border-slate-200/70 dark:border-white/[0.07] text-slate-700 dark:text-slate-200'
                }`}
              >
                <div className="text-xs font-bold">{language === 'ar' ? 'عميل جملة نقدي عام' : 'Walk-in Cash Merchant'}</div>
              </div>

              {filteredMerchants.map(merchant => (
                <div
                  key={merchant.id}
                  onClick={() => {
                    setSelectedCustomer(merchant);
                    setIsMerchantDropdownOpen(false);
                  }}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                    selectedCustomer?.id === merchant.id
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 border-slate-900 dark:border-white'
                      : 'bg-white/60 dark:bg-white/[0.04] border-slate-200/70 dark:border-white/[0.07] text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">
                      {merchant.companyName || merchant.name}
                    </span>
                    <span className="text-[10px] font-mono opacity-75">
                      {merchant.customerCode}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center justify-between text-[11px] opacity-80 font-mono tabular-nums">
                    <span>{merchant.phone}</span>
                    <span>{formatCurrency(merchant.currentDebt || 0)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
