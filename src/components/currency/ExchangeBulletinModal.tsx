import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  DollarSign, 
  Euro, 
  TrendingUp, 
  Calculator, 
  Save, 
  RefreshCw, 
  X, 
  ArrowRightLeft, 
  Clock, 
  Check, 
  Sparkles,
  Sliders,
  Eye,
  Info,
  ExternalLink,
  CheckCircle2,
  Globe
} from 'lucide-react';
import { CURRENCY_PRESETS, fetchLiveSyrianLiraRates } from '../../utils/currencyUtils';

interface ExchangeBulletinModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExchangeBulletinModal: React.FC<ExchangeBulletinModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateExchangeBulletin, formatCurrency, changeBaseCurrency, notify } = useApp();
  const bulletin = settings.exchangeBulletin || {
    usdBuyRate: 13100,
    usdSellRate: 13150,
    eurBuyRate: 15120,
    eurSellRate: 15300,
    goldGram21: 1652300,
    centralBankOfficialRate: 13500,
    lastUpdated: new Date().toISOString(),
    sourceLabel: 'موقع الليرة اليوم (sp-today.com — سوق دمشق)',
    displayInHeader: true,
    displayInPosCart: true,
    displayInReceipts: true,
    preferredDisplay: 'BOTH'
  };

  // Form state
  const [usdBuyRate, setUsdBuyRate] = useState<number>(bulletin.usdBuyRate || 13100);
  const [usdSellRate, setUsdSellRate] = useState<number>(bulletin.usdSellRate || 13150);
  const [eurBuyRate, setEurBuyRate] = useState<number>(bulletin.eurBuyRate || 15120);
  const [eurSellRate, setEurSellRate] = useState<number>(bulletin.eurSellRate || 15300);
  const [goldGram21, setGoldGram21] = useState<number>(bulletin.goldGram21 || 1652300);
  const [centralBankOfficialRate, setCentralBankOfficialRate] = useState<number>(bulletin.centralBankOfficialRate || 13500);
  const [sourceLabel, setSourceLabel] = useState<string>(bulletin.sourceLabel || 'موقع الليرة اليوم (sp-today.com)');
  const [displayInHeader, setDisplayInHeader] = useState<boolean>(bulletin.displayInHeader !== false);
  const [displayInPosCart, setDisplayInPosCart] = useState<boolean>(bulletin.displayInPosCart !== false);
  const [displayInReceipts, setDisplayInReceipts] = useState<boolean>(bulletin.displayInReceipts !== false);
  const [preferredDisplay, setPreferredDisplay] = useState<'USD' | 'EUR' | 'BOTH'>(bulletin.preferredDisplay || 'BOTH');
  const [isFetchingLive, setIsFetchingLive] = useState<boolean>(false);
  const [lastFetchStatus, setLastFetchStatus] = useState<string | null>(null);

  // Calculator State
  const [calcAmount, setCalcAmount] = useState<number>(100);
  const [calcDirection, setCalcDirection] = useState<'fromForeign' | 'fromBase'>('fromForeign');
  const [calcCurrency, setCalcCurrency] = useState<'USD' | 'EUR'>('USD');
  const [calcRateType, setCalcRateType] = useState<'buy' | 'sell'>('sell');

  if (!isOpen) return null;

  const handleFetchFromSpToday = async () => {
    setIsFetchingLive(true);
    setLastFetchStatus(null);
    try {
      const res = await fetchLiveSyrianLiraRates();
      if (res.success && res.rates) {
        const rates = res.rates;
        if (rates.usdBuy) setUsdBuyRate(rates.usdBuy);
        if (rates.usdSell) setUsdSellRate(rates.usdSell);
        if (rates.eurBuy) setEurBuyRate(rates.eurBuy);
        if (rates.eurSell) setEurSellRate(rates.eurSell);
        if (rates.goldGram21) setGoldGram21(rates.goldGram21);
        if (rates.centralBankOfficial) setCentralBankOfficialRate(rates.centralBankOfficial);
        if (rates.source) setSourceLabel(rates.source);

        const timeStr = new Date().toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' });
        setLastFetchStatus(`تم جلب الأسعار مباشرة من موقع الليرة اليوم (sp-today.com) — ${timeStr}`);
        notify('تم جلب الأسعار الحية', `تم تحديث أسعار الصرف بنجاح من موقع الليرة اليوم (sp-today.com)`, 'success');
      } else {
        notify('تنبيه', 'تعذر جلب البيانات المباشرة، تم الاحتفاظ بالأسعار الحالية', 'warning');
      }
    } catch (err: any) {
      notify('خطأ في الاتصال', 'تعذر جلب الأسعار المباشرة من الموقع', 'error');
    } finally {
      setIsFetchingLive(false);
    }
  };

  const handleSave = () => {
    updateExchangeBulletin({
      usdBuyRate,
      usdSellRate,
      eurBuyRate,
      eurSellRate,
      goldGram21,
      centralBankOfficialRate,
      sourceLabel,
      displayInHeader,
      displayInPosCart,
      displayInReceipts,
      preferredDisplay
    });
    onClose();
  };

  // Live Calculator computation
  const activeRate = calcCurrency === 'USD'
    ? (calcRateType === 'buy' ? usdBuyRate : usdSellRate)
    : (calcRateType === 'buy' ? eurBuyRate : eurSellRate);

  const calcResult = calcDirection === 'fromForeign'
    ? calcAmount * activeRate
    : (activeRate > 0 ? calcAmount / activeRate : 0);

  const baseSymbol = settings.currency.symbolNative || settings.currency.symbol;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-transparent to-emerald-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                نشرة أسعار الصرف والتحويل
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-bold">
                  مباشر
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                تحديث أسعار الدولار واليورو والذهب مقابل العملة الأساسية ({settings.currency.nameAr})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* SP-Today Live Sync Banner */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-emerald-500/10 to-blue-500/15 border border-amber-300/60 dark:border-amber-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-900 dark:text-white">
                    نشرة أسعار الصرف الحية من موقع الليرة اليوم
                  </span>
                  <a
                    href="https://sp-today.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:underline"
                    title="زيارة الموقع الرسمي sp-today.com"
                  >
                    <span>sp-today.com</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {lastFetchStatus || 'جلب مباشر لأسعار الدولار واليورو وغرام الذهب عيار 21 وفق سوق دمشق'}
                </p>
              </div>
            </div>

            <button
              type="button"
              id="btn-fetch-live-rates-sp-today"
              onClick={handleFetchFromSpToday}
              disabled={isFetchingLive}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetchingLive ? 'animate-spin' : ''}`} />
              <span>{isFetchingLive ? 'جارِ جلب الأسعار...' : 'تحديث فوري من sp-today'}</span>
            </button>
          </div>

          {/* Quick Rates Input Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* USD Card */}
            <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold text-sm">
                    $
                  </div>
                  <span className="font-black text-slate-900 dark:text-white text-sm">
                    الدولار الأمريكي (USD)
                  </span>
                </div>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full">
                  1 USD = {usdSellRate.toLocaleString()} {baseSymbol}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    سعر الشراء (نشتري به)
                  </label>
                  <input
                    type="number"
                    value={usdBuyRate}
                    onChange={e => setUsdBuyRate(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm font-black rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-center focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    سعر المبيع (نبيع به)
                  </label>
                  <input
                    type="number"
                    value={usdSellRate}
                    onChange={e => setUsdSellRate(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm font-black rounded-lg border border-emerald-400 dark:border-emerald-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-center focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* EUR Card */}
            <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-500 text-white flex items-center justify-center font-bold text-sm">
                    €
                  </div>
                  <span className="font-black text-slate-900 dark:text-white text-sm">
                    اليورو الأوروبي (EUR)
                  </span>
                </div>
                <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/60 px-2 py-0.5 rounded-full">
                  1 EUR = {eurSellRate.toLocaleString()} {baseSymbol}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    سعر الشراء (نشتري به)
                  </label>
                  <input
                    type="number"
                    value={eurBuyRate}
                    onChange={e => setEurBuyRate(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm font-black rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-center focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    سعر المبيع (نبيع به)
                  </label>
                  <input
                    type="number"
                    value={eurSellRate}
                    onChange={e => setEurSellRate(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm font-black rounded-lg border border-blue-400 dark:border-blue-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-center focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Secondary Indicators: Gold & Central Bank */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-950/20">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span>🥇 غرام الذهب عيار 21</span>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono">
                  {goldGram21.toLocaleString()} {baseSymbol}
                </span>
              </label>
              <input
                type="number"
                value={goldGram21}
                onChange={e => setGoldGram21(Number(e.target.value) || 0)}
                placeholder="سعر الغرام بالعملة الأساسية"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
              />
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span>🏛️ سعر الصرف الرسمي (المركزي)</span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {centralBankOfficialRate.toLocaleString()} {baseSymbol}
                </span>
              </label>
              <input
                type="number"
                value={centralBankOfficialRate}
                onChange={e => setCentralBankOfficialRate(Number(e.target.value) || 0)}
                placeholder="سعر الصرف الرسمي"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
              />
            </div>
          </div>

          {/* Interactive Quick Converter */}
          <div className="p-4 rounded-xl bg-slate-900 text-white shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-black">حاسبة تحويل العملات السريعة</h3>
              </div>
              <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setCalcRateType('sell')}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${calcRateType === 'sell' ? 'bg-amber-500 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  سعر المبيع
                </button>
                <button
                  type="button"
                  onClick={() => setCalcRateType('buy')}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${calcRateType === 'buy' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  سعر الشراء
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              {/* Input Amount */}
              <div className="sm:col-span-5">
                <label className="block text-[11px] text-slate-400 font-medium mb-1">
                  المبلغ المراد تحويله
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={calcAmount}
                    onChange={e => setCalcAmount(Number(e.target.value) || 0)}
                    className="w-full pl-3 pr-16 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-black text-lg focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                  <div className="absolute right-2 top-2 text-xs font-bold bg-slate-700 px-2 py-1 rounded text-amber-300">
                    {calcDirection === 'fromForeign' ? (calcCurrency === 'USD' ? 'USD $' : 'EUR €') : baseSymbol}
                  </div>
                </div>
              </div>

              {/* Swap / Toggle Currency */}
              <div className="sm:col-span-2 flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setCalcDirection(prev => prev === 'fromForeign' ? 'fromBase' : 'fromForeign')}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 transition-all hover:rotate-180"
                  title="عكس اتجاه التحويل"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCalcCurrency(prev => prev === 'USD' ? 'EUR' : 'USD')}
                  className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-white transition-all"
                >
                  {calcCurrency}
                </button>
              </div>

              {/* Converted Result */}
              <div className="sm:col-span-5">
                <label className="block text-[11px] text-slate-400 font-medium mb-1">
                  الناتج المعادل
                </label>
                <div className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl flex items-center justify-between">
                  <span className="text-xl font-black text-amber-400 font-mono">
                    {calcDirection === 'fromForeign'
                      ? Math.round(calcResult).toLocaleString()
                      : calcResult.toFixed(2)}
                  </span>
                  <span className="text-xs font-bold text-slate-300 bg-slate-700 px-2 py-0.5 rounded">
                    {calcDirection === 'fromForeign' ? baseSymbol : (calcCurrency === 'USD' ? '$' : '€')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bulletin Options */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">
              خيارات عرض النشرة في واجهة الكاشير والفواتير
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={displayInHeader}
                  onChange={e => setDisplayInHeader(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-400 w-4 h-4"
                />
                <span>شريط النشرة في الرأس</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={displayInPosCart}
                  onChange={e => setDisplayInPosCart(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-400 w-4 h-4"
                />
                <span>السعر المعادل في السلة</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={displayInReceipts}
                  onChange={e => setDisplayInReceipts(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-400 w-4 h-4"
                />
                <span>طباعة المعادل بالفواتير</span>
              </label>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            آخر تحديث: {new Date(bulletin.lastUpdated).toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' })}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              إلغاء
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Save className="w-4 h-4" />
              حفظ النشرة وتطبيقها
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
