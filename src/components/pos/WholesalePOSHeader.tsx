import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Building2, CreditCard, ShieldAlert, UserCheck, Search, Plus, Layers, AlertCircle, ArrowUpRight, X } from 'lucide-react';
import { Customer } from '../../types';

export const WholesalePOSHeader: React.FC = () => {
  const {
    customers,
    selectedCustomer,
    setSelectedCustomer,
    posTradeMode,
    setPosTradeMode,
    formatCurrency,
    language,
    t,
  } = useApp();

  const [isMerchantDropdownOpen, setIsMerchantDropdownOpen] = useState(false);
  const [merchantSearchQuery, setMerchantSearchQuery] = useState('');

  // Wholesale merchants list
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
  const debtUsagePercentage = Math.min(100, Math.round((currentDebt / creditLimit) * 100));

  return (
    <div className="bg-gradient-to-r from-amber-900 via-amber-950 to-slate-900 text-white rounded-3xl p-3 sm:p-4 shadow-md border border-amber-700/50 space-y-3 max-w-full overflow-hidden">
      {/* Top Row: Wholesale Account & Dealer Selection */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black text-amber-400 uppercase tracking-wide">
                {language === 'ar' ? 'نظام تجارة وتوزيع الجملة (B2B)' : 'Wholesale Distribution POS'}
              </span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                {posTradeMode === 'wholesale' ? 'أسعار الجملة مفعلة' : 'أسعار التجزئة'}
              </span>
            </div>
            <h3 className="text-sm font-extrabold text-white truncate">
              {selectedCustomer ? (selectedCustomer.companyName || selectedCustomer.name) : (language === 'ar' ? 'مبيعات الجملة المباشرة (عميل نقدي)' : 'Cash Wholesale Sale')}
            </h3>
          </div>
        </div>

        {/* Merchant Select / Switch Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsMerchantDropdownOpen(!isMerchantDropdownOpen)}
            className="flex items-center gap-2 px-3.5 py-2 min-h-[40px] bg-amber-800/80 hover:bg-amber-700 text-white rounded-xl text-xs font-bold border border-amber-600/60 shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <UserCheck className="w-4 h-4 text-amber-300" />
            <span>
              {selectedCustomer
                ? (selectedCustomer.companyName || selectedCustomer.name)
                : (language === 'ar' ? 'اختيار التاجر / الموزع' : 'Select Merchant')}
            </span>
          </button>

          {/* Merchants Dropdown Search Modal */}
          {isMerchantDropdownOpen && (
            <div className="absolute top-full end-0 mt-2 w-80 sm:w-96 bg-slate-900 text-white rounded-2xl p-3.5 shadow-2xl border border-slate-700 z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                <span className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-amber-400" />
                  <span>{language === 'ar' ? 'سجل التجار والموزعين المعتمدين' : 'Authorized Merchant Accounts'}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsMerchantDropdownOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
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
                  placeholder={language === 'ar' ? 'ابحث باسم المحل، التاجر، أو الهاتف...' : 'Search merchant...'}
                  className="w-full pl-3 pr-8 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  autoFocus
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute start-2.5 top-2.5" />
              </div>

              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {/* Cash option */}
                <div
                  onClick={() => {
                    setSelectedCustomer(null);
                    setIsMerchantDropdownOpen(false);
                  }}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                    !selectedCustomer
                      ? 'bg-amber-950/80 border-amber-500 text-amber-200'
                      : 'bg-slate-800/80 border-slate-700 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div className="text-xs font-bold">{language === 'ar' ? 'عميل جملة نقدي عام (بدون ذمة)' : 'Walk-in Cash Merchant'}</div>
                  <div className="text-[10px] text-slate-400">{language === 'ar' ? 'الدفع نقدي فوري واستلام مباشر' : 'Immediate cash settlement'}</div>
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
                        ? 'bg-amber-950/80 border-amber-500 text-white'
                        : 'bg-slate-800/80 border-slate-700 hover:bg-slate-800 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-amber-300">
                        {merchant.companyName || merchant.name}
                      </span>
                      <span className="text-[10px] font-mono bg-slate-700 px-1.5 py-0.5 rounded text-slate-300">
                        {merchant.customerCode}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                      <span>{merchant.phone}</span>
                      <span className="text-rose-400 font-bold font-mono">
                        {language === 'ar' ? 'ذمة:' : 'Debt:'} {formatCurrency(merchant.currentDebt || 0)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Selected Merchant Credit Profile Bar */}
      {selectedCustomer ? (
        <div className="pt-2 border-t border-amber-700/40 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          {/* Commercial Info */}
          <div className="bg-amber-950/60 p-2.5 rounded-2xl border border-amber-700/40">
            <span className="text-[10px] text-amber-300/80 block font-semibold">
              {language === 'ar' ? 'السجل التجاري والبيانات:' : 'Commercial Registry:'}
            </span>
            <span className="font-bold text-white font-mono block mt-0.5">
              {selectedCustomer.commercialRecord || 'CR-109482/DAM'}
            </span>
            <span className="text-[10px] text-slate-400 truncate block">
              {selectedCustomer.phone}
            </span>
          </div>

          {/* Current Debt & Ceiling */}
          <div className="bg-amber-950/60 p-2.5 rounded-2xl border border-amber-700/40">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-amber-300/80 font-semibold">
                {language === 'ar' ? 'الذمة الحالية المستحقة:' : 'Current Debt:'}
              </span>
              <span className="font-mono font-black text-rose-300">
                {formatCurrency(currentDebt)}
              </span>
            </div>
            <div className="mt-1.5 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  debtUsagePercentage > 80 ? 'bg-rose-500' : 'bg-amber-500'
                }`}
                style={{ width: `${debtUsagePercentage}%` }}
              />
            </div>
            <div className="mt-1 flex items-center justify-between text-[9px] text-slate-400 font-mono">
              <span>{language === 'ar' ? 'سقف الدين:' : 'Limit:'} {formatCurrency(creditLimit)}</span>
              <span>{debtUsagePercentage}%</span>
            </div>
          </div>

          {/* Available Credit & Payment Terms */}
          <div className="bg-amber-950/60 p-2.5 rounded-2xl border border-amber-700/40 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-emerald-300 font-semibold">
                {language === 'ar' ? 'الرصيد الائتماني المتاح:' : 'Available Credit:'}
              </span>
              <span className="font-mono font-black text-emerald-400 text-xs">
                {formatCurrency(availableCredit)}
              </span>
            </div>
            <div className="text-[10px] text-amber-200/80 font-semibold mt-1">
              ⚡ {language === 'ar' ? 'شروط السداد: آجل 30 يوماً / شيكات' : 'Terms: Net 30 Days'}
            </div>
          </div>
        </div>
      ) : (
        <div className="pt-2 border-t border-amber-700/40 flex items-center justify-between text-xs text-amber-200/90">
          <div className="flex items-center gap-2">
            <span className="bg-amber-800/60 px-2.5 py-1 rounded-xl text-amber-300 font-bold border border-amber-600/40">
              📦 {language === 'ar' ? 'تطبيق تلقائي لأسعار الجملة والكراتين والطرود' : 'Wholesale multipliers applied'}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            {language === 'ar' ? 'يمكنك ربط الفاتورة بتاجر مسجل لحساب الآجل والذمم' : 'Select merchant to record credit invoice'}
          </span>
        </div>
      )}
    </div>
  );
};
