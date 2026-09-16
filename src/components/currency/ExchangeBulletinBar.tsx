import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  DollarSign, 
  Euro, 
  TrendingUp, 
  Calculator, 
  Sparkles,
  RefreshCw,
  ChevronLeft,
  Coins,
  Globe
} from 'lucide-react';
import { ExchangeBulletinModal } from './ExchangeBulletinModal';
import { fetchLiveSyrianLiraRates } from '../../utils/currencyUtils';

export const ExchangeBulletinBar: React.FC = () => {
  const { settings, updateExchangeBulletin, formatCurrency, notify } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const bulletin = settings.exchangeBulletin;
  if (!bulletin || bulletin.displayInHeader === false) {
    return null;
  }

  const baseSymbol = settings.currency.symbolNative || settings.currency.symbol;

  const handleDirectRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetchLiveSyrianLiraRates();
      if (res.success && res.rates) {
        const rates = res.rates;
        updateExchangeBulletin({
          ...bulletin,
          usdBuyRate: rates.usdBuy || bulletin.usdBuyRate,
          usdSellRate: rates.usdSell || bulletin.usdSellRate,
          eurBuyRate: rates.eurBuy || bulletin.eurBuyRate,
          eurSellRate: rates.eurSell || bulletin.eurSellRate,
          goldGram21: rates.goldGram21 || bulletin.goldGram21,
          centralBankOfficialRate: rates.centralBankOfficial || bulletin.centralBankOfficialRate,
          sourceLabel: rates.source || 'موقع الليرة اليوم (sp-today.com)',
          lastUpdated: new Date().toISOString()
        });
        notify('تم تحديث الصرف', 'تم جلب أحدث أسعار العملات والذهب من موقع الليرة اليوم (sp-today.com)', 'success');
      } else {
        notify('تنبيه', 'تعذر تحديث الأسعار لحظياً، تم الإبقاء على الأسعار السابقة', 'warning');
      }
    } catch {
      notify('خطأ في الاتصال', 'تعذر الوصول إلى مزود أسعار الصرف', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <>
      <div 
        id="exchange-bulletin-bar"
        className="w-full bg-slate-900 text-white border-b border-slate-800 text-xs px-3 sm:px-6 py-1.5 flex items-center justify-between overflow-x-auto gap-4 select-none"
      >
        {/* Left Side: Title & Live Ticker */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-amber-400 font-black text-[11px] uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="flex items-center gap-1">
              <span>نشرة الصرف</span>
              <span className="text-[9px] font-mono bg-amber-500/20 text-amber-300 px-1 py-0.2 rounded">sp-today</span>
            </span>
          </div>

          <div className="h-3 w-px bg-slate-700" />

          {/* USD Ticker */}
          {(bulletin.preferredDisplay === 'USD' || bulletin.preferredDisplay === 'BOTH') && (
            <div className="flex items-center gap-1.5 font-medium">
              <span className="w-4 h-4 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">
                $
              </span>
              <span className="text-slate-400 text-[11px]">الدولار:</span>
              <span className="font-bold text-emerald-400 font-mono text-[11px]">
                {bulletin.usdSellRate.toLocaleString()}
              </span>
              <span className="text-[9px] text-slate-500">
                (شراء: {bulletin.usdBuyRate.toLocaleString()})
              </span>
            </div>
          )}

          <div className="h-3 w-px bg-slate-700 hidden sm:block" />

          {/* EUR Ticker */}
          {(bulletin.preferredDisplay === 'EUR' || bulletin.preferredDisplay === 'BOTH') && (
            <div className="flex items-center gap-1.5 font-medium">
              <span className="w-4 h-4 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px] font-bold">
                €
              </span>
              <span className="text-slate-400 text-[11px]">اليورو:</span>
              <span className="font-bold text-blue-400 font-mono text-[11px]">
                {bulletin.eurSellRate.toLocaleString()}
              </span>
              <span className="text-[9px] text-slate-500">
                (شراء: {bulletin.eurBuyRate.toLocaleString()})
              </span>
            </div>
          )}

          {/* Gold Price if available */}
          {bulletin.goldGram21 && bulletin.goldGram21 > 0 && (
            <>
              <div className="h-3 w-px bg-slate-700 hidden md:block" />
              <div className="hidden md:flex items-center gap-1 text-amber-300 font-medium text-[11px]">
                <span>🥇 غرام 21:</span>
                <span className="font-bold font-mono text-amber-400">
                  {bulletin.goldGram21.toLocaleString()} {baseSymbol}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Right Side: Quick Calculator & Edit Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            id="btn-open-currency-calculator"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-[11px] border border-slate-700 transition-colors"
            title="فتح حاسبة الصرف وتعديل النشرة"
          >
            <Calculator className="w-3 h-3" />
            <span>حاسبة الصرف</span>
          </button>
          
          <button
            id="btn-refresh-bulletin-direct"
            onClick={handleDirectRefresh}
            disabled={isRefreshing}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
            title="تحديث أسعار الصرف فوراً من موقع الليرة اليوم (sp-today.com)"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Currency & Bulletin Modal */}
      {isModalOpen && (
        <ExchangeBulletinModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
};
