import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Settings,
  Store,
  DollarSign,
  Receipt,
  Download,
  Upload,
  RotateCcw,
  Volume2,
  VolumeX,
  Save,
  CheckCircle2,
  Sparkles,
  ShieldAlert,
  Building2,
  ShoppingBag,
  Cloud,
  Truck,
  FileSpreadsheet,
  Coins,
  ArrowRightLeft,
  Calculator,
  RefreshCw,
  Info,
  Check,
  MessageSquareShare,
  Send,
  Calendar,
  KeyRound,
  Sliders,
  ExternalLink,
  Sun,
  Moon,
  Clock,
  Monitor,
  Eye,
  EyeOff,
  Layers,
  HeartHandshake,
  Printer,
  Battery,
  BatteryCharging,
  Leaf,
  Zap,
  Contrast
} from 'lucide-react';
import { DarkContrastLevel } from '../../types';
import { soundEffects } from '../../services/audio';
import { GoogleDriveBackupSection } from '../backup/GoogleDriveBackupSection';
import { WhatsAppDebtAutomationDashboard } from '../debts/WhatsAppDebtAutomationDashboard';
import { PrintSettingsPanel } from './PrintSettingsPanel';
import { CURRENCY_PRESETS, fetchLiveSyrianLiraRates } from '../../utils/currencyUtils';
import { testWhatsAppCloudApiConnection } from '../../services/debtCollectionService';
import { isAuthorizedToGenerateCodes } from '../../utils/licenseUtils';
import { StoreLogoUploader } from './StoreLogoUploader';

interface ContrastLevelConfig {
  id: DarkContrastLevel;
  label: string;
  sublabel: string;
  description: string;
  badge: string;
  badgeColor: string;
  activeRing: string;
  bgPreview: string;
  contrastRatio: string;
  icon: React.ComponentType<{ className?: string }>;
}

const CONTRAST_LEVELS: readonly ContrastLevelConfig[] = [
  {
    id: 'soft',
    label: 'هادئ مريح',
    sublabel: 'Soft Contrast',
    description: 'نغمات ناعمة خافتة لتقليل توهج الشاشة ومنع إجهاد العين في الإضاءة المتوسطة.',
    badge: 'مريح للعين',
    badgeColor: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/20',
    activeRing: 'ring-blue-500/40 border-blue-500 bg-blue-500/10',
    bgPreview: '#182234',
    contrastRatio: '8:1',
    icon: Eye,
  },
  {
    id: 'normal',
    label: 'متوازن قياسي',
    sublabel: 'Standard Balanced',
    description: 'التباين المعياري الأنيق المتوازن لكافة شاشات الكاشير (الوضع الافتراضي للنظام).',
    badge: 'الافتراضي',
    badgeColor: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/20',
    activeRing: 'ring-indigo-500/40 border-indigo-500 bg-indigo-500/10',
    bgPreview: '#111827',
    contrastRatio: '12:1',
    icon: Monitor,
  },
  {
    id: 'high',
    label: 'عالي التباين ⭐',
    sublabel: 'High Visibility',
    description: 'حدود ناصعة بارزة وخلفية عميقة ونصوص بيضاء ساطعة لبيئات العمل المظلمة والخافتة.',
    badge: 'موصى به للظلام',
    badgeColor: 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-500/30',
    activeRing: 'ring-amber-500/40 border-amber-500 bg-amber-500/10',
    bgPreview: '#0c1220',
    contrastRatio: '16:1',
    icon: Sparkles,
  },
  {
    id: 'ultra',
    label: 'أسود مطلق OLED',
    sublabel: 'True Black 100%',
    description: 'سواد نقي 100% يمنع أي توهج جانبي ويوفر طاقة بطارية شاشات OLED بأقصى حدة.',
    badge: 'أقصى حدة وتوفير',
    badgeColor: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/20',
    activeRing: 'ring-purple-500/40 border-purple-500 bg-purple-500/10',
    bgPreview: '#000000',
    contrastRatio: '∞:1',
    icon: Zap,
  },
];

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    exportDataJson,
    importDataJson,
    resetToDemoData,
    t,
    language,
    notify,
    changeBaseCurrency,
    updateExchangeBulletin,
    products,
    sales,
    theme,
    themeMode,
    setThemeMode,
    toggleTheme,
    isNightTime,
    isPowerSavingActive,
    togglePowerSaving,
    setPowerSavingActive,
    batteryInfo,
    isAppPurchased,
    licenseKey,
    trialDaysRemaining,
    trialHoursRemaining,
    isTrialExpired,
    setIsPurchaseModalOpen,
    currentUser,
    googleUser
  } = useApp();

  const activeEmail = (
    googleUser?.email ||
    currentUser?.googleEmail ||
    currentUser?.email ||
    ''
  ).trim().toLowerCase();

  const isAuthorizedToGenerate = isAuthorizedToGenerateCodes(activeEmail);

  const [activeSubTab, setActiveSubTab] = useState<'appearance' | 'currency' | 'google_drive' | 'general' | 'retail_pos' | 'wholesale_depot' | 'debt_whatsapp' | 'printer' | 'license'>('appearance');
  const [formData, setFormData] = useState({ ...settings });
  const [fileInputKey, setFileInputKey] = useState(Date.now());

  // Live Rates Fetching State
  const [isFetchingLiveRates, setIsFetchingLiveRates] = useState<boolean>(false);
  const [liveFetchSuccessTime, setLiveFetchSuccessTime] = useState<string | null>(null);

  // WhatsApp Connection Test State
  const [isTestingWhatsApp, setIsTestingWhatsApp] = useState<boolean>(false);
  const [whatsappTestResult, setWhatsappTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testPhoneNumber, setTestPhoneNumber] = useState<string>(settings.managerWhatsappPhone || '+963933123456');


  // Currency Migration State
  const [targetCurrencyCode, setTargetCurrencyCode] = useState<string>(settings.currency.code || 'SYP');
  const [conversionMultiplier, setConversionMultiplier] = useState<number>(1);
  const [recalculateData, setRecalculateData] = useState<boolean>(true);
  const [isChangingCurrency, setIsChangingCurrency] = useState<boolean>(false);

  // Exchange Bulletin State
  const [bulletinState, setBulletinState] = useState({
    usdBuyRate: settings.exchangeBulletin?.usdBuyRate || 14800,
    usdSellRate: settings.exchangeBulletin?.usdSellRate || 14950,
    eurBuyRate: settings.exchangeBulletin?.eurBuyRate || 16100,
    eurSellRate: settings.exchangeBulletin?.eurSellRate || 16250,
    goldGram21: settings.exchangeBulletin?.goldGram21 || 1050000,
    centralBankOfficialRate: settings.exchangeBulletin?.centralBankOfficialRate || 13500,
    sourceLabel: settings.exchangeBulletin?.sourceLabel || 'نشرة أسعار الصرف لليوم',
    displayInHeader: settings.exchangeBulletin?.displayInHeader !== false,
    displayInPosCart: settings.exchangeBulletin?.displayInPosCart !== false,
    displayInReceipts: settings.exchangeBulletin?.displayInReceipts !== false,
    preferredDisplay: settings.exchangeBulletin?.preferredDisplay || 'BOTH'
  });

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    notify('تم بنجاح', 'تم حفظ إعدادات النظام وتحديثها', 'success');
  };

  const handleSaveBulletin = (e: React.FormEvent) => {
    e.preventDefault();
    updateExchangeBulletin(bulletinState);
    notify('تم تحديث النشرة', 'تم حفظ وتطبيق نشرة أسعار الصرف بنجاح', 'success');
  };

  const handleFetchLiveSpToday = async () => {
    setIsFetchingLiveRates(true);
    try {
      const res = await fetchLiveSyrianLiraRates();
      if (res.success && res.rates) {
        const rates = res.rates;
        setBulletinState(prev => ({
          ...prev,
          usdBuyRate: rates.usdBuy || prev.usdBuyRate,
          usdSellRate: rates.usdSell || prev.usdSellRate,
          eurBuyRate: rates.eurBuy || prev.eurBuyRate,
          eurSellRate: rates.eurSell || prev.eurSellRate,
          goldGram21: rates.goldGram21 || prev.goldGram21,
          centralBankOfficialRate: rates.centralBankOfficial || prev.centralBankOfficialRate,
          sourceLabel: rates.source || 'موقع الليرة اليوم — دمشق'
        }));

        // Apply to store settings automatically
        updateExchangeBulletin({
          ...bulletinState,
          usdBuyRate: rates.usdBuy || bulletinState.usdBuyRate,
          usdSellRate: rates.usdSell || bulletinState.usdSellRate,
          eurBuyRate: rates.eurBuy || bulletinState.eurBuyRate,
          eurSellRate: rates.eurSell || bulletinState.eurSellRate,
          goldGram21: rates.goldGram21 || bulletinState.goldGram21,
          centralBankOfficialRate: rates.centralBankOfficial || bulletinState.centralBankOfficialRate,
          sourceLabel: rates.source || 'موقع الليرة اليوم — دمشق'
        });

        const timeStr = new Date().toLocaleTimeString(language === 'ar' ? 'ar-SY' : 'en-US', { hour: '2-digit', minute: '2-digit' });
        setLiveFetchSuccessTime(timeStr);
        notify('تم جلب أسعار الصرف الحية', `تم تحديث الأسعار بنجاح وفق نشرة موقع (الليرة اليوم) — ${timeStr}`, 'success');
      } else {
        notify('تنبيه', 'تعذر جلب البيانات المباشرة حالياً، يرجى المحاولة لاحقاً', 'warning');
      }
    } catch (err: any) {
      notify('خطأ في الاتصال', 'تعذر الوصول إلى مزود أسعار الصرف', 'error');
    } finally {
      setIsFetchingLiveRates(false);
    }
  };

  const handleTestWhatsAppConnection = async () => {
    if (!formData.whatsappApiKey || !formData.whatsappPhoneId) {
      notify('تنبيه', 'يرجى إدخال مفتاح API و Phone Number ID أولاً لاختبار الاتصال السحابي', 'warning');
      return;
    }

    setIsTestingWhatsApp(true);
    setWhatsappTestResult(null);
    try {
      const res = await testWhatsAppCloudApiConnection({
        apiKey: formData.whatsappApiKey,
        phoneNumberId: formData.whatsappPhoneId,
        testPhone: testPhoneNumber
      });
      setWhatsappTestResult(res);
      if (res.success) {
        notify('نجح الاتصال بـ WhatsApp API', res.message, 'success');
      } else {
        notify('فشل اختبار الاتصال', res.message, 'error');
      }
    } catch (err: any) {
      setWhatsappTestResult({ success: false, message: err.message || 'خطأ غير معروف في الاتصال' });
      notify('خطأ في اختبار الواتساب', err.message || 'فشل الاتصال', 'error');
    } finally {
      setIsTestingWhatsApp(false);
    }
  };


  const handleApplyBaseCurrencyChange = () => {
    const selectedPreset = CURRENCY_PRESETS.find(c => c.code === targetCurrencyCode);
    if (!selectedPreset) return;

    if (selectedPreset.code === settings.currency.code && conversionMultiplier === 1) {
      notify('تنبيه', 'العملة المختارة هي العملة الحالية نفسها', 'info');
      return;
    }

    const confirmMsg = recalculateData
      ? `هل أنت متأكد من تغيير العملة الأساسية إلى (${selectedPreset.nameAr}) وتحديث جميع أسعار المنتجات (${products.length}) وقيم الفواتير (${sales.length}) بمعامل تحويل ${conversionMultiplier}؟`
      : `هل أنت متأكد من تغيير رمز العملة الأساسية إلى (${selectedPreset.nameAr}) دون تعديل القيم الرقمية؟`;

    if (confirm(confirmMsg)) {
      setIsChangingCurrency(true);
      setTimeout(() => {
        changeBaseCurrency(selectedPreset, recalculateData ? conversionMultiplier : undefined);
        setFormData(prev => ({ ...prev, currency: selectedPreset }));
        setIsChangingCurrency(false);
      }, 100);
    }
  };

  const handlePresetSelect = (code: string) => {
    setTargetCurrencyCode(code);
    const curr = settings.currency.code;
    // Suggest intelligent auto-conversion multiplier if switching between common pairs
    if (curr === 'SYP' && code === 'USD') {
      const rate = settings.exchangeBulletin?.usdSellRate || 14800;
      setConversionMultiplier(Number((1 / rate).toFixed(8)));
    } else if (curr === 'USD' && code === 'SYP') {
      const rate = settings.exchangeBulletin?.usdSellRate || 14800;
      setConversionMultiplier(rate);
    } else if (curr === 'SYP' && code === 'EUR') {
      const rate = settings.exchangeBulletin?.eurSellRate || 16100;
      setConversionMultiplier(Number((1 / rate).toFixed(8)));
    } else if (curr === 'EUR' && code === 'SYP') {
      const rate = settings.exchangeBulletin?.eurSellRate || 16100;
      setConversionMultiplier(rate);
    } else if (curr === code) {
      setConversionMultiplier(1);
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      const success = importDataJson(content);
      if (success) {
        notify('تم بنجاح', 'تم استيراد نسخة قاعدة البيانات الاحتياطية بنجاح!', 'success');
      } else {
        notify('خطأ', 'الملف المحدد غير صالح أو تالف', 'error');
      }
      setFileInputKey(Date.now());
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (confirm('تحذير: هل أنت متأكد من رغبتك في إعادة ضبط البيانات إلى الحالة التجريبية الافتراضية؟')) {
      resetToDemoData();
      notify('تمت الإعادة', 'تمت استعادة البيانات التجريبية بنجاح', 'info');
    }
  };

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6 bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>{t('settingsTitle')}</span>
            <span className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold px-2.5 py-0.5 rounded-full">
              النسخ الاحتياطي وإعدادات الأقسام
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            النسخ السحابي عبر Google Drive، تخصيص قسم المفرق والكاشير، وإعدادات قسم الجملة والمستودعات
          </p>
        </div>
      </div>

      {/* Sub Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveSubTab('appearance')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all shrink-0 cursor-pointer ${
            activeSubTab === 'appearance'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Moon className="w-4 h-4 text-amber-500" />
          <span>المظهر والوضع الليلي لراحة الكاشير</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-500 text-white font-mono font-bold">
            {themeMode === 'auto_time' ? 'تلقائي ذكي' : theme === 'dark' ? 'داكن' : 'فاتح'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('currency')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all shrink-0 cursor-pointer ${
            activeSubTab === 'currency'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>العملة الأساسية ونشرة أسعار الصرف</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500 text-white font-mono font-bold">
            {settings.currency.symbol}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('google_drive')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all shrink-0 cursor-pointer ${
            activeSubTab === 'google_drive'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Cloud className="w-4 h-4" />
          <span>النسخ السحابي (Google Drive)</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-950 text-amber-400 font-mono font-bold">
            Google
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('retail_pos')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all shrink-0 cursor-pointer ${
            activeSubTab === 'retail_pos'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>إعدادات قسم المفرق والتجزئة (POS)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('printer')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all shrink-0 cursor-pointer ${
            activeSubTab === 'printer'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Printer className="w-4 h-4 text-amber-500" />
          <span>الطباعة ومعايرة الملصقات</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono font-bold">
            {formData.printPaperSize || '80mm'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('wholesale_depot')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all shrink-0 cursor-pointer ${
            activeSubTab === 'wholesale_depot'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>إعدادات قسم الجملة والمستودعات</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('debt_whatsapp')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all shrink-0 cursor-pointer ${
            activeSubTab === 'debt_whatsapp'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <MessageSquareShare className="w-4 h-4 text-emerald-500" />
          <span>تحصيل الديون الآلي (WhatsApp)</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-600 text-white font-mono font-bold">
            آلي
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('general')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all shrink-0 cursor-pointer ${
            activeSubTab === 'general'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>شعار المتجر وبيانات المنشأة</span>
          {settings.logo && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('license')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all shrink-0 cursor-pointer ${
            activeSubTab === 'license'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <KeyRound className="w-4 h-4 text-amber-500" />
          <span>شراء وترخيص التطبيق</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
            isAppPurchased
              ? 'bg-emerald-600 text-white'
              : isTrialExpired
              ? 'bg-rose-600 text-white'
              : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
          }`}>
            {isAppPurchased ? 'مرخص دائم' : isTrialExpired ? 'منتهي' : `ضيف (${trialDaysRemaining} أيام)`}
          </span>
        </button>
      </div>

      {/* TAB 0: Currency & Exchange Rate Bulletin */}
      {activeSubTab === 'currency' && (
        <div className="space-y-6 max-w-4xl animate-in fade-in">
          {/* Base Currency Switcher & Conversion Card */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    تغيير العملة الأساسية للنظام
                  </h3>
                  <p className="text-xs text-slate-400">
                    العملة المعتمدة حالياً: <span className="font-bold text-amber-600 dark:text-amber-400">{settings.currency.nameAr} ({settings.currency.symbolNative || settings.currency.symbol})</span>
                  </p>
                </div>
              </div>

              <div className="px-3 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 rounded-xl text-xs font-black font-mono border border-amber-200/60 dark:border-amber-900/60">
                {settings.currency.code}
              </div>
            </div>

            {/* Currency Presets Grid */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                اختر العملة الأساسية المطلوبة:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {CURRENCY_PRESETS.map(preset => {
                  const isSelected = targetCurrencyCode === preset.code;
                  const isCurrent = settings.currency.code === preset.code;

                  return (
                    <button
                      key={preset.code}
                      type="button"
                      onClick={() => handlePresetSelect(preset.code)}
                      className={`p-3 rounded-2xl border text-start transition-all cursor-pointer ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/40 ring-2 ring-amber-400'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-black text-slate-900 dark:text-white">
                          {preset.code}
                        </span>
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                          {preset.symbolNative || preset.symbol}
                        </span>
                      </div>
                      <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300 mt-1 line-clamp-1">
                        {preset.nameAr}
                      </p>
                      {isCurrent && (
                        <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.2 rounded font-bold mt-1 inline-block">
                          الحالية
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Conversion Options */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="recalculate-toggle"
                  checked={recalculateData}
                  onChange={e => setRecalculateData(e.target.checked)}
                  className="w-5 h-5 accent-amber-500 rounded mt-0.5"
                />
                <div>
                  <label htmlFor="recalculate-toggle" className="text-xs font-black text-slate-900 dark:text-white cursor-pointer">
                    تحديث وإعادة احتساب قيم وأسعار المنتجات ({products.length}) والفواتير السابقة ({sales.length}) تلقائياً
                  </label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    عند التفعيل، سيتم ضرب أسعار جميع المنتجات والمبيعات والمصروفات بمعامل التحويل المحدد أدناه للحفاظ على القيمة الحقيقية لرأس المال.
                  </p>
                </div>
              </div>

              {recalculateData && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      معامل التحويل (Multiplier)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="any"
                        value={conversionMultiplier}
                        onChange={e => setConversionMultiplier(Number(e.target.value) || 1)}
                        className="w-full px-3 py-2 text-sm font-mono font-black rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      مثال: إذا كان 1 دولار = 14,800 ل.س، للتحويل من الليرة إلى الدولار ضع: 0.00006757
                    </span>
                  </div>

                  {/* Live Simulation Preview */}
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-slate-400">معاينة تأثير التحويل التلقائي:</span>
                    <div className="flex items-center justify-between text-xs font-mono font-bold mt-1">
                      <span className="text-slate-500">10,000 {settings.currency.symbol}</span>
                      <ArrowRightLeft className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-emerald-600 dark:text-emerald-400 font-black">
                        {(10000 * conversionMultiplier).toLocaleString(undefined, { maximumFractionDigits: 2 })} {CURRENCY_PRESETS.find(c => c.code === targetCurrencyCode)?.symbolNative || targetCurrencyCode}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-mono font-bold mt-1">
                      <span className="text-slate-500">1,000,000 {settings.currency.symbol}</span>
                      <ArrowRightLeft className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-emerald-600 dark:text-emerald-400 font-black">
                        {(1000000 * conversionMultiplier).toLocaleString(undefined, { maximumFractionDigits: 2 })} {CURRENCY_PRESETS.find(c => c.code === targetCurrencyCode)?.symbolNative || targetCurrencyCode}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleApplyBaseCurrencyChange}
                  disabled={isChangingCurrency}
                  className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-md shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isChangingCurrency ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>تطبيق العملة الأساسية ({targetCurrencyCode}) وتحديث النظام</span>
                </button>
              </div>
            </div>
          </div>

          {/* Daily Exchange Bulletin Management Card */}
          <form onSubmit={handleSaveBulletin} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    نشرة أسعار الصرف اليومية (الدولار واليورو والذهب)
                  </h3>
                  <p className="text-xs text-slate-400">
                    تحديد أسعار الشراء والمبيع للعملات الأجنبية مقابل العملة الرئيسية للمتجر
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isFetchingLiveRates}
                  onClick={handleFetchLiveSpToday}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-black shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                  title="جلب أسعار الصرف الحية من موقع (الليرة اليوم sp-today)"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isFetchingLiveRates ? 'animate-spin' : ''}`} />
                  <span>تحديث حي من موقع الليرة اليوم</span>
                </button>

                {liveFetchSuccessTime && (
                  <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-1 rounded-lg">
                    محدّث: {liveFetchSuccessTime}
                  </span>
                )}
              </div>
            </div>

            {/* Currency Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* USD Rates */}
              <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-black text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-lg bg-emerald-500 text-white flex items-center justify-center text-xs font-bold">$</span>
                    الدولار الأمريكي (USD)
                  </span>
                  <span className="text-[10px] font-mono text-emerald-600 font-bold">
                    1 USD = {bulletinState.usdSellRate.toLocaleString()} {settings.currency.symbol}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      سعر الشراء (نشتري به)
                    </label>
                    <input
                      type="number"
                      value={bulletinState.usdBuyRate}
                      onChange={e => setBulletinState({ ...bulletinState, usdBuyRate: Number(e.target.value) || 0 })}
                      className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      سعر المبيع (نبيع به)
                    </label>
                    <input
                      type="number"
                      value={bulletinState.usdSellRate}
                      onChange={e => setBulletinState({ ...bulletinState, usdSellRate: Number(e.target.value) || 0 })}
                      className="w-full px-3 py-2 text-xs font-mono font-black rounded-xl border border-emerald-400 dark:border-emerald-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-center"
                    />
                  </div>
                </div>
              </div>

              {/* EUR Rates */}
              <div className="p-4 rounded-2xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/30 dark:bg-blue-950/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-black text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-lg bg-blue-500 text-white flex items-center justify-center text-xs font-bold">€</span>
                    اليورو الأوروبي (EUR)
                  </span>
                  <span className="text-[10px] font-mono text-blue-600 font-bold">
                    1 EUR = {bulletinState.eurSellRate.toLocaleString()} {settings.currency.symbol}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      سعر الشراء (نشتري به)
                    </label>
                    <input
                      type="number"
                      value={bulletinState.eurBuyRate}
                      onChange={e => setBulletinState({ ...bulletinState, eurBuyRate: Number(e.target.value) || 0 })}
                      className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      سعر المبيع (نبيع به)
                    </label>
                    <input
                      type="number"
                      value={bulletinState.eurSellRate}
                      onChange={e => setBulletinState({ ...bulletinState, eurSellRate: Number(e.target.value) || 0 })}
                      className="w-full px-3 py-2 text-xs font-mono font-black rounded-xl border border-blue-400 dark:border-blue-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-center"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Gold & Central Bank */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  🥇 سعر غرام الذهب عيار 21 ({settings.currency.symbol})
                </label>
                <input
                  type="number"
                  value={bulletinState.goldGram21}
                  onChange={e => setBulletinState({ ...bulletinState, goldGram21: Number(e.target.value) || 0 })}
                  className="w-full px-3 py-2.5 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  🏛️ سعر الصرف الرسمي (المصرف المركزي)
                </label>
                <input
                  type="number"
                  value={bulletinState.centralBankOfficialRate}
                  onChange={e => setBulletinState({ ...bulletinState, centralBankOfficialRate: Number(e.target.value) || 0 })}
                  className="w-full px-3 py-2.5 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Preferred Display Selection */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                تفضيل عرض النشرة في النظام (إن كان دولار أو يورو على العملة الرئيسية):
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setBulletinState({ ...bulletinState, preferredDisplay: 'USD' })}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    bulletinState.preferredDisplay === 'USD'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  💵 عرض الدولار فقط (USD)
                </button>
                <button
                  type="button"
                  onClick={() => setBulletinState({ ...bulletinState, preferredDisplay: 'EUR' })}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    bulletinState.preferredDisplay === 'EUR'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  💶 عرض اليورو فقط (EUR)
                </button>
                <button
                  type="button"
                  onClick={() => setBulletinState({ ...bulletinState, preferredDisplay: 'BOTH' })}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    bulletinState.preferredDisplay === 'BOTH'
                      ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm font-black'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  🌐 عرض الاثنين معاً (USD + EUR)
                </button>
              </div>
            </div>

            {/* Display Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <label className="flex items-center gap-2 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={bulletinState.displayInHeader}
                  onChange={e => setBulletinState({ ...bulletinState, displayInHeader: e.target.checked })}
                  className="w-4 h-4 accent-amber-500 rounded"
                />
                <span>شريط النشرة في الرأس</span>
              </label>

              <label className="flex items-center gap-2 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={bulletinState.displayInPosCart}
                  onChange={e => setBulletinState({ ...bulletinState, displayInPosCart: e.target.checked })}
                  className="w-4 h-4 accent-amber-500 rounded"
                />
                <span>السعر المعادل في السلة</span>
              </label>

              <label className="flex items-center gap-2 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={bulletinState.displayInReceipts}
                  onChange={e => setBulletinState({ ...bulletinState, displayInReceipts: e.target.checked })}
                  className="w-4 h-4 accent-amber-500 rounded"
                />
                <span>طباعة المعادل بالفواتير</span>
              </label>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="flex items-center gap-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-2xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>حفظ وتحديث نشرة الصرف</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 1: Google Drive Cloud Backup & Offline JSON */}
      {activeSubTab === 'google_drive' && (
        <div className="space-y-6 max-w-4xl">
          <GoogleDriveBackupSection />

          {/* Local Backup Section */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Download className="w-4 h-4 text-amber-500" />
              <span>النسخ الاحتياطي المحلي المباشر (Offline JSON File)</span>
            </h3>
            <p className="text-xs text-slate-400">
              تطبيق KIAN يعمل بدون إنترنت تماماً. يمكنك تنزيل ملف JSON محلي إلى جهازك أو فلاش ميموري واستعادته بأي وقت.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={exportDataJson}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>تحميل ملف نسخة احتياطية (JSON)</span>
              </button>

              <label className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl cursor-pointer transition-all">
                <Upload className="w-4 h-4" />
                <span>استيراد ملف من الجهاز</span>
                <input
                  key={fileInputKey}
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>استعادة البيانات التجريبية الافتراضية</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Retail & POS Settings */}
      {activeSubTab === 'retail_pos' && (
        <form onSubmit={handleSaveSettings} className="space-y-6 max-w-4xl">
          {/* Thermal Receipt Settings */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Receipt className="w-4 h-4 text-amber-500" />
              <span>إعدادات إيصالات المفرق الحرارية (Thermal POS Receipts)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  مقاس ورق الطابعة الحرارية والملصقات
                </label>
                <select
                  value={formData.printPaperSize}
                  onChange={e => setFormData({ ...formData, printPaperSize: e.target.value as any })}
                  className="w-full text-xs font-bold px-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none"
                >
                  <option value="80mm">طابعة حرارية عريضة (80mm - كاشير قياسي)</option>
                  <option value="58mm">طابعة حرارية مدمجة صغيرة (58mm - فواتير مصغرة)</option>
                  <option value="76mm">طابعة حرارية وسط (76mm - مطابخ وطلبات)</option>
                  <option value="a4">صفحة كاملة (A4 - فواتير رسمية وجملة)</option>
                  <option value="label_50x30">ملصق باركود ورفوف (50×30 مم)</option>
                  <option value="label_40x25">ملصق أسعار صغير (40×25 مم)</option>
                  <option value="label_60x40">ملصق طرود وشحن جملة (60×40 مم)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  الطباعة التلقائية عند إتمام البيع
                </label>
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="auto-print-toggle"
                    checked={formData.autoPrintOnSale}
                    onChange={e => setFormData({ ...formData, autoPrintOnSale: e.target.checked })}
                    className="w-4 h-4 accent-amber-500 rounded"
                  />
                  <label htmlFor="auto-print-toggle" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    طباعة الإيصال فوراً بمجرد الضغط على دفع
                  </label>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  رسالة تذييل الإيصال الحراري
                </label>
                <input
                  type="text"
                  value={formData.receiptFooter}
                  onChange={e => setFormData({ ...formData, receiptFooter: e.target.value })}
                  placeholder="شكراً لزيارتكم • البضاعة المباعة ترد وتستبدل خلال 3 أيام"
                  className="w-full text-xs px-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none"
                />
              </div>

              {/* Quick Jump to Calibration Studio */}
              <div className="sm:col-span-2 p-3 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Printer className="w-3.5 h-3.5 text-amber-500" />
                    <span>استوديو معايرة الهوامش والطباعة المتقدمة (Thermal & Label Calibration)</span>
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    ضبط الهوامش بالمليمتر، أوامر قطع الورق وفتح الدرج، واختبار محاذاة ملصقات الباركود على مسطرة حقيقية
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('printer')}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xl transition-all shadow-xs shrink-0 cursor-pointer"
                >
                  فتح استوديو المعايرة
                </button>
              </div>
            </div>
          </div>

          {/* Loyalty Points for Retail Customers */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>نظام نقاط ولاء ومكافآت الزبائن (Loyalty System)</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      formData.enableLoyaltyPoints !== false
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      {formData.enableLoyaltyPoints !== false ? 'مُفعّل ونشط' : 'مُعطّل (متوقف)'}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    يمكنك تشغيل أو إيقاف احتساب واستبدال نقاط الولاء في شاشات الكاشير وفواتير المفرق
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <label className="relative inline-flex items-center cursor-pointer select-none self-start sm:self-auto">
                <input
                  type="checkbox"
                  checked={formData.enableLoyaltyPoints !== false}
                  onChange={e => setFormData({ ...formData, enableLoyaltyPoints: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] peer-checked:after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-amber-500"></div>
                <span className="ms-2 text-xs font-bold text-slate-900 dark:text-white">
                  {formData.enableLoyaltyPoints !== false ? 'تشغيل النظام' : 'إيقاف النظام'}
                </span>
              </label>
            </div>

            {formData.enableLoyaltyPoints !== false ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    المبلغ المطلوب لكسب نقطة واحدة ({formData.currency.symbol})
                  </label>
                  <input
                    type="number"
                    min={100}
                    value={formData.pointsSpendRatio || 1000}
                    onChange={e => setFormData({ ...formData, pointsSpendRatio: Number(e.target.value) })}
                    className="w-full text-xs font-mono font-bold px-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    مثال: كل 1,000 {formData.currency.symbol} شراء = 1 نقطة ولاء
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    قيمة النقطة عند الاستبدال ({formData.currency.symbol})
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.pointsRedeemRatio || 100}
                    onChange={e => setFormData({ ...formData, pointsRedeemRatio: Number(e.target.value) })}
                    className="w-full text-xs font-mono font-bold px-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    مثال: كل 1 نقطة ولاء = خصم 100 {formData.currency.symbol}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-500 shrink-0" />
                <span>
                  نظام الولاء معطّل حالياً. لن تظهر أزرار استبدال النقاط أو احتساب النقاط الجديدة أثناء البيع، مع الاحتفاظ بأرصدة النقاط السابقة والديون المالية للزبائن بأمان.
                </span>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-8 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-2xl shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>حفظ إعدادات المفرق</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: Wholesale & Depot Settings */}
      {activeSubTab === 'wholesale_depot' && (
        <form onSubmit={handleSaveSettings} className="space-y-6 max-w-4xl">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Building2 className="w-4 h-4 text-amber-500" />
              <span>إعدادات تجارة الجملة ومستودعات التوزيع</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  حد الائتمان الافتراضي لكبار تجار الجملة ({formData.currency.symbol})
                </label>
                <input
                  type="number"
                  defaultValue={2000000}
                  className="w-full text-xs font-mono font-bold px-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  سقف المبيعات الآجلة المسموح بها قبل طلب تسوية الدفعات
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  تنسيق طباعة فواتير الجملة
                </label>
                <select
                  defaultValue="a4_formal"
                  className="w-full text-xs font-bold px-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none"
                >
                  <option value="a4_formal">فاتورة ضريبية رسمية A4 مع تفقيط وتفاصيل الشاحنة</option>
                  <option value="a4_condensed">فاتورة جملة مدمجة مع باركود وسند استلام</option>
                </select>
              </div>
            </div>
          </div>

          {/* WhatsApp Reporting for Wholesale Fleet & Depot */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="w-5 h-5 rounded-lg bg-emerald-500 text-white flex items-center justify-center text-xs">💬</span>
              <span>تقارير الجملة والإغلاق اليومي ومنافسات السيارات عبر WhatsApp</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  رقم واتساب الإدارة / مشرف المستودع
                </label>
                <input
                  type="text"
                  value={formData.managerWhatsappPhone || ''}
                  onChange={e => setFormData({ ...formData, managerWhatsappPhone: e.target.value })}
                  placeholder="+963 933 123 456"
                  className="w-full text-xs font-mono font-bold px-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-4">
                <input
                  type="checkbox"
                  id="include-inventory-toggle"
                  checked={formData.includeInventoryInReport ?? true}
                  onChange={e => setFormData({ ...formData, includeInventoryInReport: e.target.checked })}
                  className="w-4 h-4 accent-emerald-500 rounded"
                />
                <label htmlFor="include-inventory-toggle" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  تضمين ملخص حمولات سيارات النقل والمستودعات في التقرير اليومي
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-8 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-2xl shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>حفظ إعدادات الجملة</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 4: General Settings */}
      {activeSubTab === 'general' && (
        <div className="space-y-6 max-w-4xl animate-in fade-in">
          {/* Store Logo Management & Receipt Header Synchronization */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
            <StoreLogoUploader
              onLogoUpdated={newLogo => setFormData(prev => ({ ...prev, logo: newLogo }))}
            />
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-6">
            {/* Store Profile Section */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <Store className="w-4 h-4 text-amber-500" />
                <span>بيانات المنشأة التجارية والفرع</span>
              </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  اسم المنشأة (بالعربية) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.storeNameAr}
                  onChange={e => setFormData({ ...formData, storeNameAr: e.target.value })}
                  className="w-full text-xs font-bold px-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  اسم المنشأة (بالإنجليزية)
                </label>
                <input
                  type="text"
                  value={formData.storeNameEn}
                  onChange={e => setFormData({ ...formData, storeNameEn: e.target.value })}
                  className="w-full text-xs font-bold px-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  رقم الهاتف للتواصل
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full text-xs font-mono px-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  الرقم الضريبي / السجل التجاري
                </label>
                <input
                  type="text"
                  value={formData.taxNumber}
                  onChange={e => setFormData({ ...formData, taxNumber: e.target.value })}
                  className="w-full text-xs font-mono px-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  العنوان والمدينة
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full text-xs px-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Currency and Tax Section */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <DollarSign className="w-4 h-4 text-amber-500" />
              <span>العملة والضرائب</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  رمز العملة (Symbol)
                </label>
                <input
                  type="text"
                  value={formData.currency.symbol}
                  onChange={e => setFormData({ ...formData, currency: { ...formData.currency, symbol: e.target.value } })}
                  className="w-full text-xs font-bold px-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  كود العملة (ISO Code)
                </label>
                <input
                  type="text"
                  value={formData.currency.code}
                  onChange={e => setFormData({ ...formData, currency: { ...formData.currency, code: e.target.value } })}
                  className="w-full text-xs font-mono font-bold px-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  نسبة الضريبة الافتراضية (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={formData.defaultTaxRate}
                  onChange={e => setFormData({ ...formData, defaultTaxRate: Number(e.target.value) })}
                  className="w-full text-xs font-mono font-bold px-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="tax-toggle"
                checked={formData.enableTax}
                onChange={e => setFormData({ ...formData, enableTax: e.target.checked })}
                className="w-4 h-4 accent-amber-500 rounded"
              />
              <label htmlFor="tax-toggle" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                تفعيل احتساب الضريبة المضافة على الفواتير
              </label>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-8 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-2xl shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>حفظ الإعدادات العامة</span>
            </button>
          </div>
        </form>
      </div>
      )}

      {/* TAB: Automated Debt Collection & WhatsApp Business Settings */}
      {activeSubTab === 'debt_whatsapp' && (
        <WhatsAppDebtAutomationDashboard />
      )}

      {/* TAB: Cashier Night Mode & Appearance Settings */}
      {activeSubTab === 'appearance' && (
        <div className="space-y-6 max-w-4xl animate-in fade-in">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl border border-indigo-900/50 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 end-0 translate-x-10 -translate-y-10 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <Moon className="w-5 h-5" />
                  </span>
                  <h3 className="text-lg font-black tracking-tight">الوضع الليلي الذكي وإعدادات مظهر شاشة الكاشير</h3>
                </div>
                <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                  مخصص لراحة عين الكاشير أثناء نوبات العمل الطويلة، مع إمكانية التبديل اليدوي السريع أو الجدولة التلقائية الذكية بناءً على توقيت جهاز العمل.
                </p>
              </div>

              {/* Current Status Badge */}
              <div className="flex flex-col sm:items-end gap-1.5 bg-white/5 border border-white/10 p-3.5 rounded-2xl backdrop-blur-xs">
                <span className="text-[10px] text-slate-400 font-bold">الحالة المطبقة حالياً على الشاشة:</span>
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${theme === 'dark' ? 'bg-indigo-400 shadow-sm shadow-indigo-400/50 animate-pulse' : 'bg-amber-400 shadow-sm shadow-amber-400/50 animate-pulse'}`} />
                  <span className="text-sm font-black text-amber-300 font-mono">
                    {theme === 'dark' ? '🌙 الوضع الليلي (Dark Mode)' : '☀️ الوضع النهاري (Light Mode)'}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  نمط التبديل: {
                    themeMode === 'auto_time' ? '⏰ تلقائي حسب الساعة' :
                    themeMode === 'system' ? '💻 متزامن مع الجهاز' :
                    themeMode === 'dark' ? '🌙 يدوي ليلي' : '☀️ يدوي نهاري'
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Theme Selection Cards (4 Modes) */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-500" />
              <span>اختر نمط الإضاءة المناسب لنقطة البيع:</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* 1. Manual Light */}
              <button
                type="button"
                onClick={() => {
                  setThemeMode('light');
                  soundEffects.playClick();
                  notify('تم تفعيل الوضع النهاري الدائم', 'info');
                }}
                className={`p-4 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  themeMode === 'light'
                    ? 'border-amber-500 bg-amber-500/10 shadow-md ring-2 ring-amber-500/30'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50 dark:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                    <Sun className="w-5 h-5" />
                  </div>
                  {themeMode === 'light' && (
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  )}
                </div>
                <div>
                  <h5 className="text-xs font-black text-slate-900 dark:text-white">☀️ نهاري يدوي</h5>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    إضاءة ساطعة وواضحة تناسب الصالات ذات الإضاءة القوية ونوبات العمل النهارية.
                  </p>
                </div>
              </button>

              {/* 2. Manual Dark */}
              <button
                type="button"
                onClick={() => {
                  setThemeMode('dark');
                  soundEffects.playClick();
                  notify('تم تفعيل الوضع الليلي الدائم', 'info');
                }}
                className={`p-4 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  themeMode === 'dark'
                    ? 'border-indigo-500 bg-indigo-500/10 shadow-md ring-2 ring-indigo-500/30'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50 dark:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                    <Moon className="w-5 h-5" />
                  </div>
                  {themeMode === 'dark' && (
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  )}
                </div>
                <div>
                  <h5 className="text-xs font-black text-slate-900 dark:text-white">🌙 ليلي يدوي</h5>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    شاشات داكنة عميقة تقلل إجهاد العين في الإضاءة الخافتة وفترات العمل المسائية.
                  </p>
                </div>
              </button>

              {/* 3. Automatic Time-based (Recommended) */}
              <button
                type="button"
                onClick={() => {
                  setThemeMode('auto_time');
                  soundEffects.playClick();
                  notify('تم تفعيل التبديل التلقائي الذكي حسب توقيت جهاز الكاشير', 'success');
                }}
                className={`p-4 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between gap-3 relative ${
                  themeMode === 'auto_time'
                    ? 'border-emerald-500 bg-emerald-500/10 shadow-md ring-2 ring-emerald-500/30'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50 dark:bg-slate-800/50'
                }`}
              >
                <div className="absolute top-2 end-2">
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-emerald-500 text-white">
                    موصى به
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <h5 className="text-xs font-black text-slate-900 dark:text-white">⏰ تلقائي حسب الساعة</h5>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    يتحول أوتوماتيكياً للوضع الليلي في المساء وللنهاري صباحاً حسب ساعة جهاز الكاشير.
                  </p>
                </div>
              </button>

              {/* 4. System OS */}
              <button
                type="button"
                onClick={() => {
                  setThemeMode('system');
                  soundEffects.playClick();
                  notify('تم تفعيل التزامن مع نظام التشغيل', 'info');
                }}
                className={`p-4 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  themeMode === 'system'
                    ? 'border-cyan-500 bg-cyan-500/10 shadow-md ring-2 ring-cyan-500/30'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50 dark:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-cyan-100 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300">
                    <Monitor className="w-5 h-5" />
                  </div>
                  {themeMode === 'system' && (
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                  )}
                </div>
                <div>
                  <h5 className="text-xs font-black text-slate-900 dark:text-white">💻 متزامن مع الجهاز</h5>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    يتبع الوضع المفعّل في نظام تشغيل الويندوز، الأندرويد، أو الآيباد تلقائياً.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Configuration Form for Automatic Night Mode Hours and Battery Power-Saving Mode */}
          <form
            onSubmit={e => {
              e.preventDefault();
              const isPowerSaving = Boolean(formData.enablePowerSavingMode);
              updateSettings({
                nightModeStartHour: formData.nightModeStartHour ?? 18,
                nightModeEndHour: formData.nightModeEndHour ?? 6,
                cashierEyeComfort: formData.cashierEyeComfort !== false,
                darkContrastLevel: formData.darkContrastLevel || 'normal',
                darkHighVisibilityBorders: Boolean(formData.darkHighVisibilityBorders),
                themeMode: formData.themeMode || themeMode,
                enablePowerSavingMode: isPowerSaving,
                powerSavingDimLevel: formData.powerSavingDimLevel ?? 25,
                powerSavingAutoDimTimeout: formData.powerSavingAutoDimTimeout ?? 1,
                powerSavingThrottleUpdates: formData.powerSavingThrottleUpdates !== false,
                powerSavingDisableAnimations: formData.powerSavingDisableAnimations !== false,
              });
              setPowerSavingActive(isPowerSaving);
              soundEffects.playSuccess();
              notify('تم حفظ إعدادات المظهر، تباين الوضع الداكن، ووضع توفير الطاقة بنجاح', 'success');
            }}
            className="space-y-6"
          >
            {/* Dark Mode Contrast Intensity & Visibility in Dim Environments */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Contrast className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">
                        كثافة التباين في الوضع الداكن (Dark Mode Contrast Intensity)
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                        لبيئات العمل المظلمة والخافتة
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      اضبط تباين السواد وبروز الحواف ووضوح النصوص لتحسين الرؤية ومنع إجهاد العين في الصالات المعتمة، المستودعات، ونوبات العمل الليلية.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs">
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">المستوى الفعّال:</span>
                  <span className="font-black text-indigo-600 dark:text-indigo-400">
                    {CONTRAST_LEVELS.find(opt => opt.id === (formData.darkContrastLevel || 'normal'))?.label}
                  </span>
                </div>
              </div>

              {/* 4 Contrast Level Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {CONTRAST_LEVELS.map(opt => {
                  const Icon = opt.icon;
                  const isSelected = (formData.darkContrastLevel || 'normal') === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, darkContrastLevel: opt.id }));
                        updateSettings({ darkContrastLevel: opt.id });
                        soundEffects.playClick();
                        notify(`تم تفعيل مستوى التباين: ${opt.label}`, 'info');
                      }}
                      className={`p-4 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between gap-3 relative ${
                        isSelected
                          ? `${opt.activeRing} shadow-md ring-2`
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50 dark:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border ${opt.badgeColor}`}>
                          {opt.badge}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-black text-slate-900 dark:text-white">
                            {opt.label}
                          </h5>
                          {isSelected && (
                            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                          )}
                        </div>
                        <span className="text-[9px] text-slate-400 font-mono block">
                          {opt.sublabel}
                        </span>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                          {opt.description}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between text-[10px]">
                        <span className="text-slate-400 font-mono">التباين: {opt.contrastRatio}</span>
                        <div
                          className="w-5 h-5 rounded-lg border border-slate-600 shadow-xs"
                          style={{ backgroundColor: opt.bgPreview }}
                          title={`درجة الخلفية: ${opt.bgPreview}`}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Slider for Smooth Step Selection */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                    <span>مقياس كثافة التباين التدريجي:</span>
                  </span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-[11px]">
                    مستوى {Math.max(0, CONTRAST_LEVELS.findIndex(c => c.id === (formData.darkContrastLevel || 'normal'))) + 1} من 4 (
                    {CONTRAST_LEVELS.find(c => c.id === (formData.darkContrastLevel || 'normal'))?.label}
                    )
                  </span>
                </div>

                <div className="px-1">
                  <input
                    type="range"
                    min={0}
                    max={3}
                    step={1}
                    value={Math.max(0, CONTRAST_LEVELS.findIndex(c => c.id === (formData.darkContrastLevel || 'normal')))}
                    onChange={e => {
                      const idx = Number(e.target.value);
                      const targetId = CONTRAST_LEVELS[idx]?.id || 'normal';
                      setFormData(prev => ({ ...prev, darkContrastLevel: targetId }));
                      updateSettings({ darkContrastLevel: targetId });
                      soundEffects.playClick();
                    }}
                    className="w-full accent-indigo-600 dark:accent-indigo-400 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1.5">
                    <span>1. هادئ مريح</span>
                    <span>2. قياسي متوازن</span>
                    <span className="text-amber-500 dark:text-amber-400 font-black">3. عالي التباين ⭐</span>
                    <span>4. أسود OLED</span>
                  </div>
                </div>
              </div>

              {/* High-Visibility Luminous Borders in the Dark */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <label htmlFor="high-visibility-borders-toggle" className="text-xs font-black text-slate-900 dark:text-white cursor-pointer block">
                      إبراز حواف الأزرار والبطاقات بخطوط عالية الوضوح في الظلام (High-Visibility Luminous Borders)
                    </label>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      يضيف إطاراً ناصعاً ومحدداً حول بطاقات المنتجات وحقول البحث وأزرار الصندوق لتسهيل اللمس السريع في الغرف المعتمة والصالات المظلمة.
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
                  <input
                    type="checkbox"
                    id="high-visibility-borders-toggle"
                    checked={Boolean(formData.darkHighVisibilityBorders)}
                    onChange={e => {
                      const val = e.target.checked;
                      setFormData(prev => ({ ...prev, darkHighVisibilityBorders: val }));
                      updateSettings({ darkHighVisibilityBorders: val });
                      soundEffects.playClick();
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] peer-checked:after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-500"></div>
                </label>
              </div>

              {/* Live Interactive Cashier Simulator Widget */}
              <div className="p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-950/40 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-indigo-500" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      معاينة حية ومحاكاة فورية لبطاقات الكاشير بالتباين المختار:
                    </span>
                  </div>

                  {theme !== 'dark' && (
                    <button
                      type="button"
                      onClick={() => {
                        setThemeMode('dark');
                        soundEffects.playClick();
                        notify('تم الانتقال للوضع الداكن لتجربة التباين مباشرة على كامل شاشات البرنامج', 'info');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                    >
                      <Moon className="w-3.5 h-3.5" />
                      <span>تطبيق الوضع الداكن الآن على كامل البرنامج</span>
                    </button>
                  )}
                </div>

                {/* Simulated Dark Box */}
                <div
                  className={`dark p-4 rounded-2xl border transition-all ${
                    formData.darkHighVisibilityBorders ? 'dark-high-borders ring-1 ring-indigo-500/40' : ''
                  }`}
                  data-dark-contrast={formData.darkContrastLevel || 'normal'}
                  style={{
                    backgroundColor:
                      formData.darkContrastLevel === 'ultra'
                        ? '#000000'
                        : formData.darkContrastLevel === 'high'
                        ? '#040711'
                        : formData.darkContrastLevel === 'soft'
                        ? '#0f172a'
                        : '#0b0f19',
                  }}
                >
                  <div className="flex items-center justify-between border-b border-slate-700/80 pb-2.5 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs font-black text-white">
                        محاكاة بطاقات البيع في بيئة مظلمة
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono border border-slate-700">
                        {CONTRAST_LEVELS.find(c => c.id === (formData.darkContrastLevel || 'normal'))?.label}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-400 font-bold">
                      نسبة التباين: {CONTRAST_LEVELS.find(c => c.id === (formData.darkContrastLevel || 'normal'))?.contrastRatio}
                    </span>
                  </div>

                  {/* 3 Simulated POS Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] text-slate-400 font-mono">باركود: 62190844</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 font-bold">
                            متوفر (35)
                          </span>
                        </div>
                        <h5 className="text-xs font-black text-white mt-1.5 line-clamp-1">
                          بن مطحون برازيلي فاخر 250غ
                        </h5>
                      </div>
                      <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between">
                        <span className="text-xs font-black text-amber-400 font-mono">45,000 ل.س</span>
                        <button
                          type="button"
                          onClick={() => soundEffects.playBeep()}
                          className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black cursor-pointer active:scale-95 transition-all"
                        >
                          + إضافة
                        </button>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] text-slate-400 font-mono">باركود: 62100412</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-amber-950/80 text-amber-300 border border-amber-800/60 font-bold">
                            كمية محدودة (3)
                          </span>
                        </div>
                        <h5 className="text-xs font-black text-white mt-1.5 line-clamp-1">
                          حليب مبستر كامل الدسم 1 لتر
                        </h5>
                      </div>
                      <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between">
                        <span className="text-xs font-black text-amber-400 font-mono">18,500 ل.س</span>
                        <button
                          type="button"
                          onClick={() => soundEffects.playBeep()}
                          className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black cursor-pointer active:scale-95 transition-all"
                        >
                          + إضافة
                        </button>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[11px] text-slate-300">
                          <span>المجموع الفرعي:</span>
                          <span className="font-mono font-bold text-white">63,500 ل.س</span>
                        </div>
                        <div className="flex justify-between text-[11px] text-emerald-400">
                          <span>خصم خاص:</span>
                          <span className="font-mono font-bold">- 3,500 ل.س</span>
                        </div>
                        <div className="border-t border-slate-800 pt-1 flex justify-between text-xs font-black text-amber-300">
                          <span>الصافي النهائي:</span>
                          <span className="font-mono text-sm">60,000 ل.س</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => soundEffects.playSuccess()}
                        className="w-full mt-2 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black cursor-pointer active:scale-95 transition-all shadow-sm flex items-center justify-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>إتمام الفاتورة (F10)</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      مواعيد التبديل التلقائي للوضع الليلي (ساعات العمل)
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      حدد الساعات التي يُفعل فيها الوضع الليلي لحماية بصر الكاشير تلقائياً دون الحاجة لضغط أي زر
                    </p>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono font-bold">
                  <span>توقيت جهاز الكاشير الآن:</span>
                  <span className="text-amber-500 font-black">
                    {new Date().toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ساعة بدء الوضع الليلي مساءً (نظام 24 ساعة)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={23}
                      value={formData.nightModeStartHour ?? 18}
                      onChange={e => setFormData({ ...formData, nightModeStartHour: Number(e.target.value) })}
                      className="w-full text-xs font-mono font-bold px-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none"
                    />
                    <span className="absolute end-3 top-2.5 text-xs text-slate-400 font-mono">
                      {(formData.nightModeStartHour ?? 18) >= 12
                        ? `${(formData.nightModeStartHour ?? 18) === 12 ? 12 : (formData.nightModeStartHour ?? 18) - 12}:00 مساءً`
                        : `${formData.nightModeStartHour ?? 18}:00 صباحاً`}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    الافتراضي 18 (الساعة 6:00 مساءً مع حلول الغروب وبدء الإضاءة الداخلية)
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ساعة انتهاء الوضع الليلي صباحاً (نظام 24 ساعة)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={23}
                      value={formData.nightModeEndHour ?? 6}
                      onChange={e => setFormData({ ...formData, nightModeEndHour: Number(e.target.value) })}
                      className="w-full text-xs font-mono font-bold px-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none"
                    />
                    <span className="absolute end-3 top-2.5 text-xs text-slate-400 font-mono">
                      {(formData.nightModeEndHour ?? 6) >= 12
                        ? `${(formData.nightModeEndHour ?? 6) === 12 ? 12 : (formData.nightModeEndHour ?? 6) - 12}:00 مساءً`
                        : `${formData.nightModeEndHour ?? 6}:00 صباحاً`}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    الافتراضي 6 (الساعة 6:00 صباحاً مع شروق الشمس وبدء الوردية الصباحية)
                  </span>
                </div>
              </div>

              {/* Eye Comfort Feature Toggle */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mt-0.5">
                    <Eye className="w-4 h-4" />
                  </div>
                  <div>
                    <label htmlFor="eye-comfort-toggle" className="text-xs font-black text-slate-900 dark:text-white cursor-pointer block">
                      تفعيل ميزة راحة عين الكاشير (Eye-Comfort Soft Glow Reduction)
                    </label>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      يضبط مستويات التباين والألوان المشبعة لتقليل إجهاد النظر وجفاف العين أثناء الجلوس المطول أمام الشاشة.
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
                  <input
                    type="checkbox"
                    id="eye-comfort-toggle"
                    checked={formData.cashierEyeComfort !== false}
                    onChange={e => setFormData({ ...formData, cashierEyeComfort: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] peer-checked:after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {/* Inactivity Auto-Lock PIN Setting */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mt-0.5 sm:mt-0">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white">
                      قفل الكاشير التلقائي برمز PIN عند عدم النشاط (Idle Auto-Lock)
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      يقوم بقفل الشاشة والمطالبة بـ PIN تلقائياً عند ترك الجهاز دون نشاط للمحافظة على أمان المتجر.
                    </p>
                  </div>
                </div>

                <div className="w-full sm:w-48 shrink-0">
                  <select
                    value={formData.idleAutoLockMinutes ?? 15}
                    onChange={e => setFormData({ ...formData, idleAutoLockMinutes: Number(e.target.value) })}
                    className="w-full text-xs font-bold px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none cursor-pointer"
                  >
                    <option value={5}>بعد 5 دقائق</option>
                    <option value={10}>بعد 10 دقائق</option>
                    <option value={15}>بعد 15 دقيقة (الموصى به)</option>
                    <option value={30}>بعد 30 دقيقة</option>
                    <option value={60}>بعد 60 دقيقة</option>
                    <option value={0}>معطل (عدم القفل تلقائياً)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Battery & Eco Power-Saving Mode Card */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Leaf className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        وضع توفير الطاقة وحماية بطارية الكاشير (Eco Power-Saving)
                      </h3>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                        مخصص للورديات الطويلة وأجهزة البطارية
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      يقوم بتعتيم الشاشة وخفض وتيرة تحديثات واجهة المستخدم وإيقاف المؤثرات لتوفير طاقة البطارية لأقصى وقت تشغيل.
                    </p>
                  </div>
                </div>

                {/* Device Battery Status Badge */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono font-bold">
                  {batteryInfo.supported ? (
                    <>
                      {batteryInfo.charging ? (
                        <BatteryCharging className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Battery className={`w-4 h-4 ${batteryInfo.level <= 20 ? 'text-rose-500' : 'text-slate-600 dark:text-slate-300'}`} />
                      )}
                      <span>بطارية الجهاز:</span>
                      <span className={`font-black ${batteryInfo.level <= 20 ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {batteryInfo.level}% {batteryInfo.charging ? '(متصل بالشاحن ⚡)' : ''}
                      </span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-amber-500" />
                      <span>متوافق مع أجهزة نقاط البيع المحمولة والتابلت</span>
                    </>
                  )}
                </div>
              </div>

              {/* Master Power Saving Toggle */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl transition-colors ${
                    formData.enablePowerSavingMode
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}>
                    <Leaf className="w-5 h-5" />
                  </div>
                  <div>
                    <label htmlFor="master-powersaving-toggle" className="text-xs font-black text-slate-900 dark:text-white cursor-pointer block">
                      تفعيل وضع توفير الطاقة الآن (Eco Mode)
                    </label>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      يُطبق تعتيم الشاشة فوراً ويضبط وتيرة تحديثات النظام لتوفير استهلاك الطاقة أثناء العمل.
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
                  <input
                    type="checkbox"
                    id="master-powersaving-toggle"
                    checked={Boolean(formData.enablePowerSavingMode)}
                    onChange={e => {
                      const enabled = e.target.checked;
                      setFormData({ ...formData, enablePowerSavingMode: enabled });
                      setPowerSavingActive(enabled);
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] peer-checked:after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              {/* Power Saving Configuration Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {/* 1. Screen Dimming Level */}
                <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <span>درجة تعتيم الشاشة الموفر للطاقة:</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-mono font-black">{formData.powerSavingDimLevel ?? 25}%</span>
                    </label>
                    <span className="text-[10px] text-slate-400">
                      {(formData.powerSavingDimLevel ?? 25) <= 20 ? 'تعتيم خفيف' : (formData.powerSavingDimLevel ?? 25) <= 30 ? 'متوازن ومثالي' : 'توفير فائق'}
                    </span>
                  </div>

                  <input
                    type="range"
                    min={15}
                    max={50}
                    step={5}
                    value={formData.powerSavingDimLevel ?? 25}
                    onChange={e => {
                      const val = Number(e.target.value);
                      setFormData({ ...formData, powerSavingDimLevel: val });
                      if (formData.enablePowerSavingMode) {
                        document.documentElement.style.setProperty('--ps-brightness', ((100 - val) / 100).toFixed(2));
                      }
                    }}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />

                  {/* Quick Select Preset Pills */}
                  <div className="flex items-center gap-2 pt-1">
                    {[
                      { label: '15% خفيف', val: 15 },
                      { label: '25% موصى به', val: 25 },
                      { label: '35% توفير قوي', val: 35 },
                      { label: '50% طوارئ', val: 50 },
                    ].map(preset => (
                      <button
                        key={preset.val}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, powerSavingDimLevel: preset.val });
                          if (formData.enablePowerSavingMode) {
                            document.documentElement.style.setProperty('--ps-brightness', ((100 - preset.val) / 100).toFixed(2));
                          }
                        }}
                        className={`flex-1 py-1 px-2 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                          (formData.powerSavingDimLevel ?? 25) === preset.val
                            ? 'bg-emerald-500 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400">
                    يقلل استهلاك إضاءة الشاشة الخلفية (LCD / OLED) مع المحافظة على وضوح أرقام الفاتورة.
                  </p>
                </div>

                {/* 2. Auto-Dim on Inactivity (Standby) */}
                <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      التعتيم التلقائي عند عدم النشاط (الاستعداد الذكي):
                    </label>
                  </div>

                  <select
                    value={formData.powerSavingAutoDimTimeout ?? 1}
                    onChange={e => setFormData({ ...formData, powerSavingAutoDimTimeout: Number(e.target.value) })}
                    className="w-full text-xs font-bold px-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none cursor-pointer"
                  >
                    <option value={0}>تعتيم مستمر دائماً (بدون انتظار)</option>
                    <option value={1}>بعد دقيقة واحدة من عدم اللمس (موصى به)</option>
                    <option value={2}>بعد دقيقتين من عدم اللمس</option>
                    <option value={3}>بعد 3 دقائق من عدم اللمس</option>
                    <option value={5}>بعد 5 دقائق من عدم اللمس</option>
                  </select>

                  <p className="text-[10px] text-slate-400">
                    عند ترك جهاز الكاشير في فترات الهدوء، تنتقل الشاشة فوراً لتعتيم خفيف لتوفير الطاقة، وتستيقظ فور لمسها أو مسح باركود.
                  </p>
                </div>
              </div>

              {/* Throttling and Animation Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100 dark:border-slate-800">
                {/* Throttle UI Updates */}
                <label className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.powerSavingThrottleUpdates !== false}
                    onChange={e => setFormData({ ...formData, powerSavingThrottleUpdates: e.target.checked })}
                    className="mt-1 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      تقليل وتيرة تحديثات واجهة المستخدم (UI Throttling)
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block leading-relaxed">
                      يقلل وتيرة الفحص الخلفي وتحديث الساعات وتكرار طلبات المزامنة لتخفيف حمل المعالج وتبريد الجهاز.
                    </span>
                  </div>
                </label>

                {/* Disable Animations & Blurs */}
                <label className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.powerSavingDisableAnimations !== false}
                    onChange={e => setFormData({ ...formData, powerSavingDisableAnimations: e.target.checked })}
                    className="mt-1 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      تعطيل المؤثرات الحركية والانتقالات والـ Blur
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block leading-relaxed">
                      يقوم بإيقاف مؤثرات الضبابية والظلال المتحركة الثقيلة لتوفير معالجة كرت الشاشة (GPU) والبطارية.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Quick Live Preview Bar */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>تجربة التبديل السريع الآن لمعاينة التباين والألوان:</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    toggleTheme();
                    soundEffects.playClick();
                  }}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5 text-indigo-400" />}
                  <span>تبديل الوضع المعروض الآن</span>
                </button>

                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>حفظ إعدادات المظهر ووضع توفير الطاقة</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* TAB: Printer & Label Alignment Studio */}
      {activeSubTab === 'printer' && (
        <PrintSettingsPanel />
      )}

      {/* TAB: License & App Purchase */}
      {activeSubTab === 'license' && (
        <div className="space-y-6 max-w-4xl animate-in fade-in">
          {/* Main License Status Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
              <div className="flex items-center gap-3.5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md ${
                  isAppPurchased
                    ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                    : isTrialExpired
                    ? 'bg-rose-500 text-white shadow-rose-500/20'
                    : 'bg-amber-500 text-slate-950 shadow-amber-500/20'
                }`}>
                  <KeyRound className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      ترخيص وشراء تطبيق كاشير كيان
                    </h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                      isAppPurchased
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                        : isTrialExpired
                        ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                        : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                    }`}>
                      {isAppPurchased ? 'نسخة مرخصة دائمة' : isTrialExpired ? 'انتهت الفترة التجريبية' : 'وضع الضيف التجريبي'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {isAppPurchased
                      ? 'النظام مفعل بكامل مميزاته ومربوط بهذا الجهاز مدى الحياة بدون اشتراكات شهرية.'
                      : 'أنت الآن في فترة التجربة المجانية الممنوحة للضيف بعد تسجيل الدخول الإلزامي الأول.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsPurchaseModalOpen(true)}
                className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 transition-all cursor-pointer shrink-0"
              >
                <KeyRound className="w-4 h-4" />
                <span>{isAppPurchased ? 'معاينة / تغيير كود الشراء' : 'إدخال كود شراء التطبيق'}</span>
              </button>
            </div>

            {/* Trial Counter Banner (if guest mode) */}
            {!isAppPurchased && (
              <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                isTrialExpired
                  ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/40 text-rose-900 dark:text-rose-200'
                  : 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 text-slate-800 dark:text-slate-200'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl shrink-0 ${
                    isTrialExpired ? 'bg-rose-500 text-white' : 'bg-amber-500 text-slate-950'
                  }`}>
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black">
                      {isTrialExpired ? 'انتهت مهلة وضع الضيف المجاني (7 أيام)' : 'الوقت المتبقي في وضع الضيف (أسبوع مجاناً):'}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {isTrialExpired
                        ? 'يرجى التواصل مع المطور للحصول على كود التفعيل ومواصلة عمليات البيع والفوترة.'
                        : 'يمكنك استخدام جميع مميزات النظام بحرية حتى انتهاء الأسبوع التجريبي.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto font-mono font-black text-xs">
                  <span className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
                    {trialDaysRemaining} أيام
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
                    {trialHoursRemaining} ساعات
                  </span>
                </div>
              </div>
            )}

            {/* License Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-[11px] font-bold text-slate-400 block">كود الترخيص المفعل:</span>
                <div className="font-mono text-xs font-black text-slate-800 dark:text-slate-200 break-all">
                  {licenseKey || 'لا يوجد كود مفعل حالياً (وضع الضيف)'}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-[11px] font-bold text-slate-400 block">نوع الرخصة:</span>
                <div className="text-xs font-black text-slate-800 dark:text-slate-200">
                  {isAppPurchased ? 'ترخيص دائم مدى الحياة (Lifetime License)' : 'فترة تجريبية لمدة أسبوع (7 Days Trial)'}
                </div>
              </div>
            </div>

            {/* Support / Developer Purchase Contact */}
            <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-900 dark:text-white block">
                  كيف تحصل على كود الشراء الدائم لمتجرك؟
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                  يقوم المطور بإنشاء كود ترخيص مشفر ومخصص لاسم متجرك ورقم هاتفك ليعمل للأبد.
                </span>
              </div>

              {isAuthorizedToGenerate ? (
                <button
                  type="button"
                  onClick={() => setIsPurchaseModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
                  title="أدوات المطور المعتمد — انقر لتوليد أكواد الشراء"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>زر إنشاء أكواد الشراء (المطور)</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsPurchaseModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs transition-all cursor-pointer active:scale-95"
                >
                  إدخال كود الشراء / تفعيل
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
