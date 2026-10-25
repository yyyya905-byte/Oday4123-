import React, { useState, useMemo } from 'react';
import {
  Coins,
  ArrowRightLeft,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Globe2,
  Building2,
  Calculator,
  RefreshCw,
  Sparkles,
  Info,
  DollarSign,
  TrendingUp,
  Receipt,
  ShoppingBag,
  ExternalLink,
  Sliders,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SecondaryCurrencyConfig, CurrencyConfig } from '../../types';
import { CURRENCY_PRESETS, CurrencyPreset } from '../../utils/currencyUtils';
import { soundEffects } from '../../services/audio';

export const MultiCurrencyManagerPanel: React.FC = () => {
  const { settings, updateSettings, notify } = useApp();

  const baseCurrency: CurrencyConfig = settings.currency;
  const secondaryCurrencies: SecondaryCurrencyConfig[] = useMemo(() => {
    return settings.secondaryCurrencies || [];
  }, [settings.secondaryCurrencies]);

  // Converter States
  const [calcAmount, setCalcAmount] = useState<number>(100);
  const [fromCurrencyCode, setFromCurrencyCode] = useState<string>('USD');
  const [toCurrencyCode, setToCurrencyCode] = useState<string>(baseCurrency.code);

  // Add/Edit Secondary Currency Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCurrencyId, setEditingCurrencyId] = useState<string | null>(null);
  const [selectedPresetCode, setSelectedPresetCode] = useState<string>('USD');
  const [customBranchName, setCustomBranchName] = useState<string>('');
  const [customRateToBase, setCustomRateToBase] = useState<number>(14950);
  const [showInPos, setShowInPos] = useState<boolean>(true);
  const [showInInvoices, setShowInInvoices] = useState<boolean>(true);
  const [autoSyncBulletin, setAutoSyncBulletin] = useState<boolean>(true);

  // Quick rate finder helper
  const getRateForCode = (code: string): number => {
    if (code === baseCurrency.code) return 1;
    // 1. Check secondary currencies
    const sec = secondaryCurrencies.find(c => c.code === code && c.isEnabled);
    if (sec && sec.exchangeRateToBase > 0) return sec.exchangeRateToBase;
    // 2. Check bulletin
    if (settings.exchangeBulletin) {
      if (code === 'USD') return settings.exchangeBulletin.usdSellRate || 14950;
      if (code === 'EUR') return settings.exchangeBulletin.eurSellRate || 16250;
    }
    // 3. Fallback to preset
    const preset = CURRENCY_PRESETS.find(p => p.code === code);
    return preset?.defaultUsdRate || 1;
  };

  // Conversion logic: Base currency is anchor
  const convertedResult = useMemo(() => {
    const fromRate = getRateForCode(fromCurrencyCode);
    const toRate = getRateForCode(toCurrencyCode);

    // Convert 'from' amount to base currency value:
    // If from is USD and 1 USD = 14950 Base, amount * 14950 = Base amount
    const valueInBase = fromCurrencyCode === baseCurrency.code ? calcAmount : calcAmount * fromRate;
    // Convert Base value to 'to' currency:
    const finalConverted = toCurrencyCode === baseCurrency.code ? valueInBase : toRate > 0 ? valueInBase / toRate : 0;
    return finalConverted;
  }, [calcAmount, fromCurrencyCode, toCurrencyCode, baseCurrency.code, secondaryCurrencies, settings.exchangeBulletin]);

  const handleSwapCurrencies = () => {
    soundEffects.playClick();
    setFromCurrencyCode(toCurrencyCode);
    setToCurrencyCode(fromCurrencyCode);
  };

  // Open Add Modal
  const handleOpenAddModal = (presetCode: string = 'USD') => {
    setEditingCurrencyId(null);
    setSelectedPresetCode(presetCode);
    const preset = CURRENCY_PRESETS.find(p => p.code === presetCode);
    setCustomBranchName(
      presetCode === 'USD'
        ? 'المبيعات الدولية والحوالات'
        : presetCode === 'AED'
        ? 'فرع الإمارات ودبي'
        : presetCode === 'TRY'
        ? 'فرع تركيا وإسطنبول'
        : presetCode === 'SAR'
        ? 'فرع المملكة والخليج'
        : presetCode === 'LBP'
        ? 'فرع لبنان وبيروت'
        : `فرع ${preset?.nameAr || presetCode}`
    );

    // Estimate initial rate
    if (presetCode === 'USD' && settings.exchangeBulletin?.usdSellRate) {
      setCustomRateToBase(settings.exchangeBulletin.usdSellRate);
    } else if (presetCode === 'EUR' && settings.exchangeBulletin?.eurSellRate) {
      setCustomRateToBase(settings.exchangeBulletin.eurSellRate);
    } else if (presetCode === 'AED' && settings.exchangeBulletin?.usdSellRate) {
      setCustomRateToBase(Math.round(settings.exchangeBulletin.usdSellRate / 3.67));
    } else if (presetCode === 'SAR' && settings.exchangeBulletin?.usdSellRate) {
      setCustomRateToBase(Math.round(settings.exchangeBulletin.usdSellRate / 3.75));
    } else {
      setCustomRateToBase(1);
    }

    setShowInPos(true);
    setShowInInvoices(true);
    setAutoSyncBulletin(presetCode === 'USD' || presetCode === 'EUR');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (sec: SecondaryCurrencyConfig) => {
    setEditingCurrencyId(sec.id);
    setSelectedPresetCode(sec.code);
    setCustomBranchName(sec.branchName || '');
    setCustomRateToBase(sec.exchangeRateToBase);
    setShowInPos(sec.displayInPos !== false);
    setShowInInvoices(sec.displayInInvoices !== false);
    setAutoSyncBulletin(sec.autoSyncWithBulletin || false);
    setIsModalOpen(true);
  };

  // Save Secondary Currency
  const handleSaveSecondaryCurrency = (e: React.FormEvent) => {
    e.preventDefault();
    if (customRateToBase <= 0) {
      notify('خطأ', 'يرجى إدخال سعر صرف صحيح أكبر من صفر', 'error');
      return;
    }

    const preset = CURRENCY_PRESETS.find(p => p.code === selectedPresetCode) || {
      code: selectedPresetCode,
      nameAr: selectedPresetCode,
      nameEn: selectedPresetCode,
      symbol: selectedPresetCode,
      symbolNative: selectedPresetCode,
      decimals: 2,
    };

    const newSecItem: SecondaryCurrencyConfig = {
      id: editingCurrencyId || `sec_${selectedPresetCode.toLowerCase()}_${Date.now()}`,
      code: selectedPresetCode,
      nameAr: preset.nameAr,
      nameEn: preset.nameEn,
      symbol: preset.symbol,
      symbolNative: preset.symbolNative,
      decimals: preset.decimals,
      exchangeRateToBase: customRateToBase,
      rateType: 'multiplier',
      branchName: customBranchName.trim() || undefined,
      isEnabled: true,
      displayInPos: showInPos,
      displayInInvoices: showInInvoices,
      autoSyncWithBulletin: autoSyncBulletin,
      updatedAt: new Date().toISOString(),
    };

    const existing = secondaryCurrencies.filter(c => c.id !== newSecItem.id && c.code !== newSecItem.code);
    const updated = [newSecItem, ...existing];

    updateSettings({ secondaryCurrencies: updated });
    soundEffects.playSuccess();
    notify(
      'تم الحفظ بنجاح',
      `تم اعتماد عملة (${newSecItem.code} - ${newSecItem.nameAr}) للفرع والمعاملات الدولية`,
      'success'
    );
    setIsModalOpen(false);
  };

  // Toggle Currency Enabled Status
  const handleToggleCurrency = (id: string) => {
    const updated = secondaryCurrencies.map(c => (c.id === id ? { ...c, isEnabled: !c.isEnabled } : c));
    updateSettings({ secondaryCurrencies: updated });
    soundEffects.playClick();
  };

  // Delete Secondary Currency
  const handleDeleteCurrency = (id: string, code: string) => {
    const updated = secondaryCurrencies.filter(c => c.id !== id);
    updateSettings({ secondaryCurrencies: updated });
    soundEffects.playClick();
    notify('تم الحذف', `تمت إزالة عملة (${code}) من العملات الفرعية`, 'info');
  };

  // List of all candidate currencies for converter select
  const allConverterCurrencies = useMemo(() => {
    const setCodes = new Set<string>();
    const list: { code: string; nameAr: string; symbol: string; flag: string }[] = [];

    // Add Base
    const basePreset = CURRENCY_PRESETS.find(p => p.code === baseCurrency.code);
    setCodes.add(baseCurrency.code);
    list.push({
      code: baseCurrency.code,
      nameAr: `${baseCurrency.nameAr} (العملة الأساسية)`,
      symbol: baseCurrency.symbolNative || baseCurrency.symbol,
      flag: basePreset?.flag || '🏛️',
    });

    // Add Secondary
    secondaryCurrencies.forEach(sec => {
      if (!setCodes.has(sec.code)) {
        setCodes.add(sec.code);
        const p = CURRENCY_PRESETS.find(pr => pr.code === sec.code);
        list.push({
          code: sec.code,
          nameAr: `${sec.nameAr} ${sec.branchName ? `· ${sec.branchName}` : ''}`,
          symbol: sec.symbolNative || sec.symbol,
          flag: p?.flag || '🌐',
        });
      }
    });

    // Add remaining presets
    CURRENCY_PRESETS.forEach(p => {
      if (!setCodes.has(p.code)) {
        setCodes.add(p.code);
        list.push({
          code: p.code,
          nameAr: p.nameAr,
          symbol: p.symbolNative || p.symbol,
          flag: p.flag,
        });
      }
    });

    return list;
  }, [baseCurrency, secondaryCurrencies]);

  return (
    <div className="space-y-6">
      {/* 1. Header & Base Currency Card */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-md shadow-amber-500/20 font-black">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  العملة الأساسية والعملات الفرعية للفروع والتعاملات الدولية
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  متعدد العملات
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                تحديد العملة الأساسية للمحاسبة والمخزون، مع دعم عملات فرعية موازية للفروع الخارجية والمبيعات الدولية
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleOpenAddModal('USD')}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-black text-xs rounded-xl shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة عملة فرعية جديدة</span>
            </button>
          </div>
        </div>

        {/* Base Currency Badge Banner */}
        <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-lg">
              {CURRENCY_PRESETS.find(p => p.code === baseCurrency.code)?.flag || '🏛️'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">العملة الأساسية المعتمدة للمتجر:</span>
                <span className="text-sm font-black text-slate-900 dark:text-white font-mono">
                  {baseCurrency.nameAr} ({baseCurrency.code}) — {baseCurrency.symbolNative || baseCurrency.symbol}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                تُقاس كافة أصول المستودع، التكاليف، والأرباح بالعملة الأساسية. تعتمد العملات الفرعية أدناه عليها بسعر صرف محدد.
              </p>
            </div>
          </div>

          <span className="text-xs font-mono font-bold bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
            معدل الصرف الأساسي: 1.0000
          </span>
        </div>
      </div>

      {/* 2. LIVE INTERACTIVE CURRENCY CONVERTER WIDGET */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white p-5 sm:p-6 rounded-3xl border border-indigo-900/50 shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center justify-center">
              <Calculator className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-black">
                محول العملات التفاعلي المباشر (Live Currency Converter)
              </h4>
              <p className="text-[11px] text-slate-300">
                حساب فوري لمعادلة الأسعار والتحويل المتبادل بين العملة الأساسية والعملات الدولية والفروع
              </p>
            </div>
          </div>

          <span className="text-[10px] font-mono font-bold bg-white/10 px-2.5 py-1 rounded-full text-indigo-200">
            حساب فوري
          </span>
        </div>

        {/* Converter Calculator Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Amount & From Currency (5 Cols) */}
          <div className="md:col-span-5 bg-white/5 border border-white/10 p-3.5 rounded-2xl space-y-2">
            <label className="text-[11px] font-bold text-slate-300 block">المبلغ المراد تحويله</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                step="any"
                value={calcAmount}
                onChange={e => setCalcAmount(Math.max(0, Number(e.target.value) || 0))}
                className="w-full bg-slate-950/80 border border-white/20 rounded-xl px-3 py-2 text-base font-black font-mono text-white focus:outline-none focus:border-amber-400"
                placeholder="100"
              />
              <select
                value={fromCurrencyCode}
                onChange={e => setFromCurrencyCode(e.target.value)}
                className="bg-slate-950/90 border border-white/20 text-white text-xs font-bold rounded-xl px-2.5 py-2.5 focus:outline-none shrink-0"
              >
                {allConverterCurrencies.map(c => (
                  <option key={`from_${c.code}`} value={c.code} className="bg-slate-900 text-white">
                    {c.flag} {c.code} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Amount Presets */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              {[10, 50, 100, 500, 1000, 100000].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setCalcAmount(val)}
                  className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-white/10 hover:bg-white/20 text-slate-200 cursor-pointer transition-colors"
                >
                  +{val.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Swap Button (2 Cols) */}
          <div className="md:col-span-2 flex justify-center py-1">
            <button
              type="button"
              onClick={handleSwapCurrencies}
              className="w-11 h-11 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-90 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
              title="عكس اتجاه التحويل"
            >
              <ArrowRightLeft className="w-5 h-5" />
            </button>
          </div>

          {/* Converted Output & To Currency (5 Cols) */}
          <div className="md:col-span-5 bg-white/5 border border-white/10 p-3.5 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-300">النتيجة المعاكسة / العملة المستهدفة</label>
              <select
                value={toCurrencyCode}
                onChange={e => setToCurrencyCode(e.target.value)}
                className="bg-slate-950/90 border border-white/20 text-white text-xs font-bold rounded-xl px-2 py-1 focus:outline-none"
              >
                {allConverterCurrencies.map(c => (
                  <option key={`to_${c.code}`} value={c.code} className="bg-slate-900 text-white">
                    {c.flag} {c.code} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>

            {/* Big Converted Value */}
            <div className="bg-slate-950/90 border border-emerald-500/40 rounded-xl px-4 py-3 flex items-center justify-between">
              <div>
                <span className="text-xl sm:text-2xl font-black font-mono text-emerald-400">
                  {convertedResult.toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 3,
                  })}
                </span>
                <span className="text-xs font-bold text-slate-300 mr-2">
                  {allConverterCurrencies.find(c => c.code === toCurrencyCode)?.symbol || toCurrencyCode}
                </span>
              </div>
              <span className="text-[11px] font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 rounded-md">
                معادل
              </span>
            </div>

            {/* Rate Footnote */}
            <p className="text-[10px] text-slate-400 font-mono">
              معدل التحويل المستخدم:{' '}
              {fromCurrencyCode === baseCurrency.code ? (
                <span>1 {baseCurrency.code} = {(1 / (getRateForCode(toCurrencyCode) || 1)).toFixed(6)} {toCurrencyCode}</span>
              ) : (
                <span>1 {fromCurrencyCode} = {getRateForCode(fromCurrencyCode).toLocaleString()} {baseCurrency.symbol}</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* 3. SECONDARY CURRENCIES LIST FOR BRANCHES & INTERNATIONAL TRANSACTIONS */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-500" />
            <h4 className="text-sm font-black text-slate-900 dark:text-white">
              قائمة العملات الفرعية المسجلة ({secondaryCurrencies.length})
            </h4>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick Add Presets */}
            <span className="text-[11px] font-bold text-slate-400">إضافة سريعة:</span>
            {['USD', 'EUR', 'AED', 'SAR', 'TRY', 'LBP'].map(pCode => {
              const alreadyAdded = secondaryCurrencies.some(s => s.code === pCode);
              if (alreadyAdded) return null;
              return (
                <button
                  key={pCode}
                  type="button"
                  onClick={() => handleOpenAddModal(pCode)}
                  className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-700 dark:text-slate-300 text-[11px] font-bold rounded-lg transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                >
                  + {pCode}
                </button>
              );
            })}
          </div>
        </div>

        {secondaryCurrencies.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 space-y-2">
            <Globe2 className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
              لا توجد عملات فرعية مضافة حالياً
            </p>
            <p className="text-[11px] text-slate-400 max-w-md mx-auto">
              أضف عملات فرعية مثل الدولار واليورو والدرهم لتمكين فروع المتجر الخارجية أو قبول دفعات بعملات دولية في شاشات الكاشير والفواتير.
            </p>
            <button
              type="button"
              onClick={() => handleOpenAddModal('USD')}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة عملة فرعية أولى</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {secondaryCurrencies.map(sec => {
              const preset = CURRENCY_PRESETS.find(p => p.code === sec.code);
              return (
                <div
                  key={sec.id}
                  className={`p-4 rounded-2xl border transition-all space-y-3 relative ${
                    sec.isEnabled
                      ? 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80 shadow-xs'
                      : 'bg-slate-100/50 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-lg font-black shrink-0 shadow-2xs">
                        {preset?.flag || '🌐'}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h5 className="text-sm font-black text-slate-900 dark:text-white">
                            {sec.nameAr}
                          </h5>
                          <span className="font-mono text-xs font-black text-amber-600 dark:text-amber-400">
                            ({sec.code})
                          </span>
                        </div>
                        {sec.branchName && (
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-bold">
                            الفرع / الاستخدام: {sec.branchName}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Enable Toggle Switch */}
                    <button
                      type="button"
                      onClick={() => handleToggleCurrency(sec.id)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black transition-colors cursor-pointer ${
                        sec.isEnabled
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {sec.isEnabled ? 'مفعلة' : 'معطلة'}
                    </button>
                  </div>

                  {/* Exchange Rate Badge */}
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-500">سعر الصرف المعتمد:</span>
                    <span className="font-mono font-black text-slate-900 dark:text-white">
                      1 {sec.code} = {sec.exchangeRateToBase.toLocaleString()} {baseCurrency.symbol}
                    </span>
                  </div>

                  {/* Badges for POS & Invoices */}
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 flex-wrap">
                    {sec.displayInPos && (
                      <span className="flex items-center gap-1 bg-amber-500/10 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-md font-bold">
                        <ShoppingBag className="w-3 h-3" />
                        <span>تظهر في الكاشير</span>
                      </span>
                    )}
                    {sec.displayInInvoices && (
                      <span className="flex items-center gap-1 bg-blue-500/10 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-md font-bold">
                        <Receipt className="w-3 h-3" />
                        <span>تُطبع بالفواتير</span>
                      </span>
                    )}
                    {sec.autoSyncWithBulletin && (
                      <span className="flex items-center gap-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-md font-bold">
                        <RefreshCw className="w-3 h-3" />
                        <span>مزامنة مع النشرة</span>
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/80 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(sec)}
                      className="px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>تعديل</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCurrency(sec.id, sec.code)}
                      className="px-2 py-1 text-[11px] font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>حذف</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. MODAL: ADD / EDIT SECONDARY CURRENCY */}
      {isModalOpen && (
        <div
          dir="rtl"
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col text-slate-900 dark:text-white">
            <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe2 className="w-5 h-5" />
                <h3 className="text-base font-black">
                  {editingCurrencyId ? 'تعديل العملة الفرعية' : 'إضافة عملة فرعية جديدة (فرع / دولي)'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-black/10 hover:bg-black/20 text-slate-950 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSecondaryCurrency} className="p-5 space-y-4 overflow-y-auto max-h-[80vh]">
              {/* Currency Preset Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  اختر رمز العملة
                </label>
                <select
                  value={selectedPresetCode}
                  onChange={e => {
                    const code = e.target.value;
                    setSelectedPresetCode(code);
                    const pr = CURRENCY_PRESETS.find(p => p.code === code);
                    if (pr && !customBranchName) {
                      setCustomBranchName(`فرع ${pr.nameAr}`);
                    }
                    if (code === 'USD' && settings.exchangeBulletin?.usdSellRate) {
                      setCustomRateToBase(settings.exchangeBulletin.usdSellRate);
                    }
                  }}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-black font-mono"
                >
                  {CURRENCY_PRESETS.filter(p => p.code !== baseCurrency.code).map(preset => (
                    <option key={preset.code} value={preset.code}>
                      {preset.flag} {preset.nameAr} ({preset.code}) — {preset.symbolNative}
                    </option>
                  ))}
                </select>
              </div>

              {/* Branch / Purpose Name */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  اسم الفرع أو نوع المعاملات (اختياري)
                </label>
                <input
                  type="text"
                  value={customBranchName}
                  onChange={e => setCustomBranchName(e.target.value)}
                  placeholder="مثال: فرع دبي، فرع إسطنبول، مبيعات تصدير دولية..."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                />
              </div>

              {/* Exchange Rate To Base Currency */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    سعر الصرف مقابل العملة الأساسية ({baseCurrency.symbol})
                  </label>
                  <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400 font-bold">
                    1 {selectedPresetCode} = {customRateToBase.toLocaleString()} {baseCurrency.symbol}
                  </span>
                </div>
                <input
                  type="number"
                  step="any"
                  min={0.000001}
                  value={customRateToBase}
                  onChange={e => setCustomRateToBase(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono font-black"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  حدد كم وحدة من العملة الأساسية ({baseCurrency.nameAr}) تعادل 1 وحدة من هذه العملة.
                </span>
              </div>

              {/* Integration Checkboxes */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={showInPos}
                    onChange={e => setShowInPos(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 rounded"
                  />
                  <span>إظهار المعادل بهذه العملة في شاشة الكاشير والمبيعات (POS)</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={showInInvoices}
                    onChange={e => setShowInInvoices(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 rounded"
                  />
                  <span>طباعة إجمالي الفاتورة بهذه العملة في إيصالات الزبائن</span>
                </label>

                {(selectedPresetCode === 'USD' || selectedPresetCode === 'EUR') && (
                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={autoSyncBulletin}
                      onChange={e => setAutoSyncBulletin(e.target.checked)}
                      className="w-4 h-4 accent-amber-500 rounded"
                    />
                    <span>مزامنة سعر الصرف تلقائياً مع نشرة الصرف اليومية للمتجر</span>
                  </label>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  {editingCurrencyId ? 'حفظ التعديلات' : 'اعتماد العملة الفرعية'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
