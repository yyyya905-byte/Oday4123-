import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { QrCode, Search, UserCheck, Star, Sparkles, X, PlusCircle } from 'lucide-react';
import { soundEffects } from '../../services/audio';
import { DraggableModalWrapper } from '../common/DraggableModalWrapper';

interface CustomerQRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCustomer: (customer: any) => void;
}

export const CustomerQRScannerModal: React.FC<CustomerQRScannerModalProps> = ({
  isOpen,
  onClose,
  onSelectCustomer
}) => {
  const { customers, findCustomerByCodeOrPhone, formatCurrency, t } = useApp();
  const [query, setQuery] = useState('');
  const [foundCustomer, setFoundCustomer] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleSearch = (code: string) => {
    const cust = findCustomerByCodeOrPhone(code);
    if (cust) {
      soundEffects.playBeep();
      setFoundCustomer(cust);
    } else {
      soundEffects.playWarning();
      setFoundCustomer(null);
    }
  };

  const handleConfirmCustomer = () => {
    if (foundCustomer) {
      onSelectCustomer(foundCustomer);
      soundEffects.playSuccess();
      onClose();
    }
  };

  return (
    <DraggableModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={`${t('scanCustomerQR')} / بطاقة العضوية`}
      subtitle="مسح رمز الولاء أو البحث برقم الهاتف"
      icon={<QrCode className="w-5 h-5 text-amber-500" />}
      maxWidth="max-w-md"
    >
      <div className="p-4 sm:p-6 space-y-4">
        {/* Scanner Simulation box */}
        <div className="relative w-full h-36 bg-slate-900 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-amber-500/50">
          <QrCode className="w-14 h-14 text-amber-400 animate-pulse" />
          <span className="text-[11px] text-slate-300 mt-2 font-semibold">
            امسح رمز QR الخاص ببطاقة العميل
          </span>
        </div>

        {/* Search by Code / Phone */}
        <div className="flex gap-2">
          <input
            type="text"
            autoFocus
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              handleSearch(e.target.value);
            }}
            placeholder="أدخل كود العميل (مثال: CUS634567) أو الهاتف..."
            className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500"
          />
          <button
            onClick={() => handleSearch(query)}
            data-longpress-title="البحث عن العميل"
            data-longpress-desc="البحث في سجل العملاء باستخدام رقم الهاتف أو كود البطاقة."
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs shrink-0 cursor-pointer"
          >
            بحث
          </button>
        </div>

        {/* Quick Demo Customer Buttons */}
        <div>
          <p className="text-[11px] font-bold text-slate-400 mb-1.5">عملاء تجريبيون للمعاينة:</p>
          <div className="flex flex-wrap gap-1.5">
            {customers.map(c => (
              <button
                key={c.id}
                onClick={() => {
                  setQuery(c.customerCode);
                  handleSearch(c.customerCode);
                }}
                data-longpress-title={`العميل: ${c.name}`}
                data-longpress-desc={`تحديد فوري لحساب العميل ${c.name} برقم ${c.customerCode}.`}
                className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-[11px] font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1 cursor-pointer"
              >
                <span>{c.name}</span>
                <span className="text-[9px] font-mono text-amber-600">({c.customerCode})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Customer Detected Card */}
        {foundCustomer && (
          <div className="p-4 bg-gradient-to-br from-amber-500/10 to-amber-500/5 dark:from-amber-950/40 dark:to-slate-800/40 border border-amber-500/30 rounded-2xl animate-in fade-in">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-full">
                  تم التعرف على العضو
                </span>
                <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                  {foundCustomer.name}
                </h4>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{foundCustomer.phone}</p>
              </div>
              <div className="text-end bg-white dark:bg-slate-800 p-2 rounded-xl shadow-xs border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 block font-semibold">النقاط الحالية</span>
                <span className="text-base font-black text-amber-500 flex items-center justify-end gap-1">
                  <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                  {foundCustomer.points}
                </span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-amber-500/20 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
              <span>إجمالي المشتريات: <strong>{formatCurrency(foundCustomer.totalSpent)}</strong></span>
              <span>عدد الزيارات: <strong>{foundCustomer.visitCount}</strong></span>
            </div>

            <button
              onClick={handleConfirmCustomer}
              data-longpress-title="ربط العميل بالفاتورة"
              data-longpress-desc="احتساب نقاط الولاء ومشتريات هذه الفاتورة في رصيد هذا العميل."
              className="w-full mt-3.5 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-98 text-white font-bold text-xs rounded-xl shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              <span>ربط العميل بهذه الفاتورة وكسب النقاط</span>
            </button>
          </div>
        )}
      </div>
    </DraggableModalWrapper>
  );
};
