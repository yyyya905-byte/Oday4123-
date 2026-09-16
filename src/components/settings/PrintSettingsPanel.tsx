import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Printer,
  Sliders,
  CheckCircle2,
  Receipt,
  Tag,
  Maximize2,
  RotateCcw,
  Sparkles,
  Save,
  Info,
  Check,
  ZoomIn,
  ZoomOut,
  Scan,
  Scissors,
  DollarSign,
  QrCode,
  ShieldCheck,
  Eye,
  FileText,
  Volume2,
  VolumeX,
  Store,
  Layers
} from 'lucide-react';
import { PrintPaperSize, LabelAlignmentConfig } from '../../types';
import { generateBarcodeSvg } from '../../utils/barcodeUtils';
import { soundEffects } from '../../services/audio';
import { StoreLogoUploader } from './StoreLogoUploader';

interface PaperPreset {
  id: PrintPaperSize;
  title: string;
  widthMm: number;
  heightMm?: number;
  desc: string;
  type: 'receipt' | 'label' | 'sheet';
  badge: string;
}

const PAPER_PRESETS: PaperPreset[] = [
  {
    id: '80mm',
    title: 'رول كاشير عريض (80 مم)',
    widthMm: 80,
    desc: 'الرول الحراري القياسي لمعظم طابعات نقاط البيع والكاشير والمطاعم (عرض الطباعة 72-80 مم - 576 نقطة)',
    type: 'receipt',
    badge: 'الأكثر شيوعاً POS'
  },
  {
    id: '58mm',
    title: 'رول كاشير مدمج (58 مم)',
    widthMm: 58,
    desc: 'لطابعات البلوتوث المحمولة، طابعات الفواتير المصغرة، وأجهزة الدفع المتنقلة POS (384 نقطة)',
    type: 'receipt',
    badge: 'طابعات متنقلة'
  },
  {
    id: '76mm',
    title: 'رول كاشير وسط (76 مم)',
    widthMm: 76,
    desc: 'لطابعات المطبخ والطلبات الحرارية والمصفوفية (Dot Matrix)',
    type: 'receipt',
    badge: 'مطابخ وطلبات'
  },
  {
    id: 'a4',
    title: 'ورق مكتبي كامل (A4)',
    widthMm: 210,
    heightMm: 297,
    desc: 'فواتير رسمية مقاس ورق كامل للشركات، كشوفات الحساب، وفواتير تجارة الجملة الكبيرة',
    type: 'sheet',
    badge: 'فواتير رسمية'
  },
  {
    id: 'label_50x30',
    title: 'ملصق باركود ورفوف (50×30 مم)',
    widthMm: 50,
    heightMm: 30,
    desc: 'المقاس الأكثر استخداماً لملصقات أسعار الرفوف والباركود في محلات السوبرماركت والتجزئة',
    type: 'label',
    badge: 'ملصق رفوف قياسي'
  },
  {
    id: 'label_40x25',
    title: 'ملصق أسعار مدمج (40×25 مم)',
    widthMm: 40,
    heightMm: 25,
    desc: 'للمنتجات الصغيرة، الإكسسوارات، العطور، والعلب المصغرة',
    type: 'label',
    badge: 'ملصق صغير'
  },
  {
    id: 'label_60x40',
    title: 'ملصق طرود وشحن (60×40 مم)',
    widthMm: 60,
    heightMm: 40,
    desc: 'لكراتين تجارة الجملة، مستودعات التوزيع، وبوليصات شحن سيارات النقل',
    type: 'label',
    badge: 'طرود وجملة'
  }
];

export const PrintSettingsPanel: React.FC = () => {
  const { settings, updateSettings, products, notify, formatCurrency, language } = useApp();

  // Local Form State
  const [formData, setFormData] = useState({
    receiptHeader: settings.receiptHeader || 'أهلاً بكم في كيان — نسعد بخدمتكم دائماً',
    receiptFooter: settings.receiptFooter || 'شكراً لزيارتكم! يرجى الاحتفاظ بالفاتورة لضمان حق الاسترجاع خلال 3 أيام.',
    printPaperSize: settings.printPaperSize || '80mm',
    autoPrintOnSale: settings.autoPrintOnSale ?? false,
    autoPrintKitchenTicket: settings.autoPrintKitchenTicket ?? false,
    printCustomerAndMerchantCopies: settings.printCustomerAndMerchantCopies ?? false,
    printBarcodeOnReceipt: settings.printBarcodeOnReceipt ?? true,
    printExchangeRateOnReceipt: settings.printExchangeRateOnReceipt ?? true,
    printStoreLogo: settings.printStoreLogo ?? true,
    printTaxDetails: settings.printTaxDetails ?? true,
    printCashierDetails: settings.printCashierDetails ?? true,
    enableAutoCutter: settings.enableAutoCutter ?? true,
    enableCashDrawerKick: settings.enableCashDrawerKick ?? false,
    soundOnPrint: settings.soundOnPrint ?? true,
    // Custom Receipt Template & Visual Styling
    receiptTemplateStyle: settings.receiptTemplateStyle || 'modern',
    receiptFontFamily: settings.receiptFontFamily || 'default',
    receiptShowLogo: settings.receiptShowLogo ?? settings.printStoreLogo ?? true,
    receiptShowTaxNumber: settings.receiptShowTaxNumber ?? settings.printTaxDetails ?? true,
    receiptShowCashierName: settings.receiptShowCashierName ?? settings.printCashierDetails ?? true,
    receiptShowCustomerInfo: settings.receiptShowCustomerInfo ?? true,
    receiptShowBarcode: settings.receiptShowBarcode ?? settings.printBarcodeOnReceipt ?? true,
    receiptShowQrCode: settings.receiptShowQrCode ?? true,
    receiptShowItemCount: settings.receiptShowItemCount ?? true,
    receiptShowReturnPolicy: settings.receiptShowReturnPolicy ?? true,
    receiptReturnPolicyDays: settings.receiptReturnPolicyDays ?? 3,
    // Custom Receipt Thermal Margins & Preview Controls
    previewReceiptBeforePrint: settings.previewReceiptBeforePrint ?? true,
    receiptTopMarginMm: settings.receiptTopMarginMm ?? 3,
    receiptBottomMarginMm: settings.receiptBottomMarginMm ?? 4,
    receiptLeftMarginMm: settings.receiptLeftMarginMm ?? 3,
    receiptRightMarginMm: settings.receiptRightMarginMm ?? 3,
    receiptBottomCutFeedMm: settings.receiptBottomCutFeedMm ?? 18,
    receiptFontScale: settings.receiptFontScale || 'normal',
    receiptCustomWidthMm: settings.receiptCustomWidthMm || 80,
    labelAlignment: {
      topMarginMm: settings.labelAlignment?.topMarginMm ?? 2,
      bottomMarginMm: settings.labelAlignment?.bottomMarginMm ?? 2,
      leftMarginMm: settings.labelAlignment?.leftMarginMm ?? 2,
      rightMarginMm: settings.labelAlignment?.rightMarginMm ?? 2,
      textAlign: settings.labelAlignment?.textAlign ?? 'center',
      barcodeAlign: settings.labelAlignment?.barcodeAlign ?? 'center',
      gapOffsetMm: settings.labelAlignment?.gapOffsetMm ?? 3,
      fontScale: settings.labelAlignment?.fontScale ?? 'normal',
      density: settings.labelAlignment?.density ?? 'high',
      showStoreName: settings.labelAlignment?.showStoreName ?? true,
      showProductName: settings.labelAlignment?.showProductName ?? true,
      showPrice: settings.labelAlignment?.showPrice ?? true,
      showBarcode: settings.labelAlignment?.showBarcode ?? true,
      showSku: settings.labelAlignment?.showSku ?? true,
      showDate: settings.labelAlignment?.showDate ?? false
    } as LabelAlignmentConfig
  });

  // Preview & Sandbox State
  const [previewZoom, setPreviewZoom] = useState<number>(1.25);
  const [receiptZoom, setReceiptZoom] = useState<number>(1.0);
  const [showReceiptRulers, setShowReceiptRulers] = useState<boolean>(true);
  const [showRulerGuides, setShowRulerGuides] = useState<boolean>(true);
  const [showCrosshairs, setShowCrosshairs] = useState<boolean>(true);
  const [sampleProductId, setSampleProductId] = useState<string>(products[0]?.id || '');
  const [activePrintMode, setActivePrintMode] = useState<'receipt' | 'calibration' | 'label' | null>(null);

  const sampleProduct = products.find(p => p.id === sampleProductId) || products[0] || {
    id: 'sample_01',
    nameAr: 'شاي سيلاني فاخر 250غ',
    nameEn: 'Ceylon Black Tea 250g',
    price: 35000,
    barcode: '6210984521043',
    sku: 'TEA-043'
  };

  const selectedPreset = PAPER_PRESETS.find(p => p.id === formData.printPaperSize) || PAPER_PRESETS[0];

  const handleSave = () => {
    updateSettings(formData);
    notify('تم الحفظ بنجاح', 'تم تحديث إعدادات الطباعة، مقاسات الرول، هوامش الفاتورة ومعايرة المحاذاة', 'success');
  };

  const handleResetAlignmentDefaults = () => {
    setFormData(prev => ({
      ...prev,
      labelAlignment: {
        topMarginMm: 2,
        bottomMarginMm: 2,
        leftMarginMm: 2,
        rightMarginMm: 2,
        textAlign: 'center',
        barcodeAlign: 'center',
        gapOffsetMm: 3,
        fontScale: 'normal',
        density: 'high',
        showStoreName: true,
        showProductName: true,
        showPrice: true,
        showBarcode: true,
        showSku: true,
        showDate: false
      }
    }));
    notify('تمت استعادة القيم الافتراضية', 'تمت إعادة ضبط هوامش ومحاذاة الملصقات إلى الإعدادات القياسية', 'info');
  };

  const handleAdjustMargin = (key: keyof Pick<LabelAlignmentConfig, 'topMarginMm' | 'bottomMarginMm' | 'leftMarginMm' | 'rightMarginMm' | 'gapOffsetMm'>, delta: number) => {
    setFormData(prev => {
      const current = prev.labelAlignment[key];
      const nextVal = Math.max(0, Math.min(25, current + delta));
      return {
        ...prev,
        labelAlignment: {
          ...prev.labelAlignment,
          [key]: nextVal
        }
      };
    });
  };

  // Receipt Margin & Cut Clearance Handlers
  const handleAdjustReceiptMargin = (
    key: 'receiptTopMarginMm' | 'receiptBottomMarginMm' | 'receiptLeftMarginMm' | 'receiptRightMarginMm' | 'receiptBottomCutFeedMm',
    delta: number
  ) => {
    setFormData(prev => {
      const current = prev[key] ?? (key === 'receiptBottomCutFeedMm' ? 18 : 3);
      const maxLimit = key === 'receiptBottomCutFeedMm' ? 50 : 25;
      const nextVal = Math.max(0, Math.min(maxLimit, current + delta));
      return {
        ...prev,
        [key]: nextVal
      };
    });
  };

  const handleResetReceiptMargins = () => {
    setFormData(prev => ({
      ...prev,
      receiptTopMarginMm: 3,
      receiptBottomMarginMm: 4,
      receiptLeftMarginMm: 3,
      receiptRightMarginMm: 3,
      receiptBottomCutFeedMm: 18,
      receiptFontScale: 'normal'
    }));
    notify('تمت استعادة هوامش الفاتورة القياسية', 'علوي 3mm، سفلي 4mm، جانبي 3mm، ومسافة قص 18mm', 'info');
  };

  const handleApplyReceiptPreset = (preset: 'standard' | 'compact' | 'comfort') => {
    if (preset === 'standard') {
      setFormData(prev => ({
        ...prev,
        receiptTopMarginMm: 3,
        receiptBottomMarginMm: 4,
        receiptLeftMarginMm: 3,
        receiptRightMarginMm: 3,
        receiptBottomCutFeedMm: 18,
        receiptFontScale: 'normal'
      }));
      notify('تم تطبيق الهوامش القياسية', 'تنسيق متوازن لطابعات 80mm و 58mm', 'info');
    } else if (preset === 'compact') {
      setFormData(prev => ({
        ...prev,
        receiptTopMarginMm: 1,
        receiptBottomMarginMm: 2,
        receiptLeftMarginMm: 1,
        receiptRightMarginMm: 1,
        receiptBottomCutFeedMm: 12,
        receiptFontScale: 'compact'
      }));
      notify('تم تطبيق الهوامش الموفرة للورق', 'هوامش 1mm ضيقة مع خط مدمج لتقليل طول الورق', 'info');
    } else if (preset === 'comfort') {
      setFormData(prev => ({
        ...prev,
        receiptTopMarginMm: 5,
        receiptBottomMarginMm: 6,
        receiptLeftMarginMm: 5,
        receiptRightMarginMm: 5,
        receiptBottomCutFeedMm: 22,
        receiptFontScale: 'large'
      }));
      notify('تم تطبيق الهوامش المريحة الواسعة', 'هوامش 5mm مريحة ومسافة قص 22mm وخط واضح وكبير', 'info');
    }
  };

  // Printing Handlers
  const handlePrintCalibrationSheet = () => {
    setActivePrintMode('calibration');
    if (formData.soundOnPrint) soundEffects.playBeep();
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handlePrintTestReceipt = () => {
    setActivePrintMode('receipt');
    if (formData.soundOnPrint) soundEffects.playBeep();
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handlePrintTestLabel = () => {
    setActivePrintMode('label');
    if (formData.soundOnPrint) soundEffects.playBeep();
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Generate clean SVG for preview
  const sampleBarcodeSvg = generateBarcodeSvg(sampleProduct.barcode || '6210001234567', {
    width: 180,
    height: 48,
    showText: false,
    barColor: '#000000'
  });

  return (
    <div className="space-y-6 max-w-5xl animate-in fade-in">
      {/* Top Banner & Active Status */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/80 to-slate-900 text-white p-6 rounded-3xl border border-amber-500/20 shadow-md relative overflow-hidden">
        <div className="absolute top-0 end-0 translate-x-8 -translate-y-8 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Printer className="w-5 h-5" />
              </span>
              <h3 className="text-lg font-black tracking-tight">إعدادات الطباعة، مقاسات الرول، ومعايرة المحاذاة</h3>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              تخصيص كامل للطابعات الحرارية (80mm و 58mm)، أوامر قطع الورق ودرج النقدية، ومعايرة محاذاة ملصقات الباركود والرفوف مع مسطرة اختبار حقيقية.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>حفظ الإعدادات</span>
            </button>
          </div>
        </div>

        {/* Quick Spec Pills */}
        <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-lg">
            <span className="text-slate-400">المقاس النشط:</span>
            <span className="font-bold text-amber-300">{selectedPreset.title}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-lg">
            <span className="text-slate-400">الطباعة التلقائية:</span>
            <span className={`font-bold ${formData.autoPrintOnSale ? 'text-emerald-400' : 'text-slate-300'}`}>
              {formData.autoPrintOnSale ? 'مفعلة' : 'يدوية'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-lg">
            <span className="text-slate-400">الهوامش الحالية:</span>
            <span className="font-mono text-amber-300 font-bold">
              ع:{formData.labelAlignment.topMarginMm}م | س:{formData.labelAlignment.bottomMarginMm}م | ي:{formData.labelAlignment.rightMarginMm}م | س:{formData.labelAlignment.leftMarginMm}م
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 1: Paper Sizes & Media Dimensions */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Maximize2 className="w-4 h-4 text-amber-500" />
              <span>اختيار مقاس ورق الطابعة الحرارية والملصقات (Paper & Media Sizes)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              حدد المقاس الفعلي للورق المركّب في طابعتك لضبط هوامش وحدود الفواتير والملصقات تلقائياً
            </p>
          </div>
          <span className="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full self-start sm:self-auto">
            عرض الرول: {selectedPreset.widthMm} مم
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PAPER_PRESETS.map(preset => {
            const isSelected = formData.printPaperSize === preset.id;
            return (
              <div
                key={preset.id}
                onClick={() => setFormData({ ...formData, printPaperSize: preset.id })}
                className={`p-4 rounded-2xl border transition-all cursor-pointer text-start flex flex-col justify-between ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500/5 dark:bg-amber-500/10 shadow-sm ring-2 ring-amber-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-amber-500 bg-amber-500' : 'border-slate-400'
                      }`}>
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                      </span>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white">
                        {preset.title}
                      </h4>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 shrink-0">
                      {preset.badge}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {preset.desc}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>الأبعاد: {preset.widthMm}mm {preset.heightMm ? `× ${preset.heightMm}mm` : '(رول مستمر)'}</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    {isSelected ? '✓ محدد حالياً' : 'تحديد'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Print Density & Font Scale Options */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              كثافة الحبر الحراري (Thermal Print Density / Contrast)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData({
                  ...formData,
                  labelAlignment: { ...formData.labelAlignment, density: 'normal' }
                })}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  formData.labelAlignment.density === 'normal'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800'
                }`}
              >
                عادي (Standard)
              </button>
              <button
                type="button"
                onClick={() => setFormData({
                  ...formData,
                  labelAlignment: { ...formData.labelAlignment, density: 'high' }
                })}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  formData.labelAlignment.density === 'high'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800'
                }`}
              >
                عالي وداكن (High Contrast - للملصقات)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              حجم خط الإيصال (Receipt Font Scale)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['compact', 'normal', 'large'] as const).map(scale => (
                <button
                  key={scale}
                  type="button"
                  onClick={() => setFormData({
                    ...formData,
                    labelAlignment: { ...formData.labelAlignment, fontScale: scale }
                  })}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all capitalize ${
                    formData.labelAlignment.fontScale === scale
                      ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800'
                  }`}
                >
                  {scale === 'compact' ? 'مدمج (صغير)' : scale === 'normal' ? 'قياسي (متوسط)' : 'عريض (واضح)'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Smart Print Toggles & Behavior */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-500" />
            <span>مفاتيح وخيارات الطباعة الذكية (Print Automation & Features)</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            التحكم في الأوامر التلقائية عند البيع، بونات المطبخ، قطع الورق، ودرج النقدية
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* 1. Auto Print on Sale */}
          <div className="p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-start justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                الطباعة التلقائية عند البيع
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                إرسال الإيصال للطابعة فوراً عند تأكيد الدفع
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer select-none shrink-0 mt-0.5">
              <input
                type="checkbox"
                checked={formData.autoPrintOnSale}
                onChange={e => setFormData({ ...formData, autoPrintOnSale: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] peer-checked:after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-amber-500"></div>
            </label>
          </div>

          {/* 2. Auto Print Kitchen Ticket */}
          <div className="p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-start justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                طباعة بون تحضير المطبخ
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                إصدار تذكرة تشغيل المطبخ للمطاعم والكافيهات
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer select-none shrink-0 mt-0.5">
              <input
                type="checkbox"
                checked={formData.autoPrintKitchenTicket}
                onChange={e => setFormData({ ...formData, autoPrintKitchenTicket: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] peer-checked:after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-amber-500"></div>
            </label>
          </div>

          {/* 3. Customer & Merchant Double Copies */}
          <div className="p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-start justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                طباعة نسختين (عميل + محل)
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                نسخة للزبون ونسخة لأرشيف الكاشير تلقائياً
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer select-none shrink-0 mt-0.5">
              <input
                type="checkbox"
                checked={formData.printCustomerAndMerchantCopies}
                onChange={e => setFormData({ ...formData, printCustomerAndMerchantCopies: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] peer-checked:after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-amber-500"></div>
            </label>
          </div>

          {/* 4. Invoice Barcode & QR Code */}
          <div className="p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-start justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                باركود ورمز QR الفاتورة
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                للفحص السريع، الاسترجاع، والفوترة الإلكترونية
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer select-none shrink-0 mt-0.5">
              <input
                type="checkbox"
                checked={formData.printBarcodeOnReceipt}
                onChange={e => setFormData({ ...formData, printBarcodeOnReceipt: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] peer-checked:after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-amber-500"></div>
            </label>
          </div>

          {/* 5. Exchange Rate in Receipt */}
          <div className="p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-start justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                طباعة أسعار الصرف ($ / €)
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                إظهار المعادل بالدولار حسب نشرة الليرة لليوم
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer select-none shrink-0 mt-0.5">
              <input
                type="checkbox"
                checked={formData.printExchangeRateOnReceipt}
                onChange={e => setFormData({ ...formData, printExchangeRateOnReceipt: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] peer-checked:after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-amber-500"></div>
            </label>
          </div>

          {/* 6. Auto Cutter Signal */}
          <div className="p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-start justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                أمر قص الورق التلقائي
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                إرسال إشارة قاطع الرول الحراري (ESC/POS Auto Cut)
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer select-none shrink-0 mt-0.5">
              <input
                type="checkbox"
                checked={formData.enableAutoCutter}
                onChange={e => setFormData({ ...formData, enableAutoCutter: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] peer-checked:after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-amber-500"></div>
            </label>
          </div>

          {/* 7. Cash Drawer Kick */}
          <div className="p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-start justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                فتح درج النقدية تلقائياً
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                نبضة كهربائية لفتح درج الكاشير المعدني مع الطباعة
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer select-none shrink-0 mt-0.5">
              <input
                type="checkbox"
                checked={formData.enableCashDrawerKick}
                onChange={e => setFormData({ ...formData, enableCashDrawerKick: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] peer-checked:after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-amber-500"></div>
            </label>
          </div>

          {/* 8. Cashier & Shift Details */}
          <div className="p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-start justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                اسم الكاشير وتوقيت الوردية
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                توثيق اسم الموظف والتاريخ والوقت بالثواني
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer select-none shrink-0 mt-0.5">
              <input
                type="checkbox"
                checked={formData.printCashierDetails}
                onChange={e => setFormData({ ...formData, printCashierDetails: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] peer-checked:after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-amber-500"></div>
            </label>
          </div>

          {/* 9. Sound on Print */}
          <div className="p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-start justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                تنبيه صوتي عند الطباعة
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                نغمة تأكيد خفيفة لتنبيه الكاشير بخروج الإيصال
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer select-none shrink-0 mt-0.5">
              <input
                type="checkbox"
                checked={formData.soundOnPrint}
                onChange={e => setFormData({ ...formData, soundOnPrint: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] peer-checked:after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-amber-500"></div>
            </label>
          </div>
        </div>

        {/* Receipt Header & Footer Text */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              رسالة ترويسة الإيصال (Header Text)
            </label>
            <input
              type="text"
              value={formData.receiptHeader}
              onChange={e => setFormData({ ...formData, receiptHeader: e.target.value })}
              placeholder="أهلاً بكم في متجرنا"
              className="w-full text-xs px-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              رسالة تذييل الإيصال وسياسة الاستبدال (Footer Text)
            </label>
            <input
              type="text"
              value={formData.receiptFooter}
              onChange={e => setFormData({ ...formData, receiptFooter: e.target.value })}
              placeholder="شكراً لزيارتكم! البضاعة ترد وتستبدل خلال 3 أيام"
              className="w-full text-xs px-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>
      </div>

      {/* SECTION 2.5: Receipt Template Style & Customization (تخصيص شكل وتصميم الفاتورة) */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Sparkles className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              تخصيص شكل وقالب الفاتورة (Receipt Template & Visual Design)
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            اختر نمط الفاتورة المفضل لديك، نوع الخط، وتحكم بالعناصر الظاهرة مثل الشعار، الرقم الضريبي، اسم الكاشير، الباركود، ورمز QR.
          </p>
        </div>

        {/* 1. Template Style Cards */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            نمط وقالب الفاتورة المعتمد:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                id: 'modern',
                title: 'عصري (Modern)',
                badge: 'الأحدث',
                desc: 'تصميم أنيق مع إبراز الإجمالي في صندوق مميز وفواصل دقيقة ناعمة.'
              },
              {
                id: 'classic',
                title: 'كلاسيكي (Classic)',
                badge: 'تقليدي POS',
                desc: 'النمط التقليدي المعتمد مع خطوط مزدوجة كلاسيكية وتنسيق هادئ.'
              },
              {
                id: 'minimal',
                title: 'مبسط (Minimal)',
                badge: 'موفر للورق',
                desc: 'تصميم مضغوط جداً يقلل استهلاك الورق إلى أقصى درجة.'
              },
              {
                id: 'thermal_bold',
                title: 'حراري عريض (Thermal Bold)',
                badge: 'طابعات سريعة',
                desc: 'خطوط عريضة داكنة شديدة الوضوح للطابعات الحرارية القديمة أو السريعة.'
              }
            ].map(tpl => {
              const isSelected = formData.receiptTemplateStyle === tpl.id;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, receiptTemplateStyle: tpl.id as any })}
                  className={`p-3.5 rounded-2xl border text-start transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-amber-500 bg-amber-500/10 dark:bg-amber-500/15 ring-2 ring-amber-500/30 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">{tpl.title}</span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold">
                        {tpl.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      {tpl.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Font & Typography Settings */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              نوع خط الفاتورة (Receipt Font Family):
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'default', label: 'الافتراضي (System)' },
                { id: 'cairo', label: 'خط القاهرة (Cairo)' },
                { id: 'tajawal', label: 'خط تجوال (Tajawal)' },
                { id: 'mono', label: 'رقمي مونو (Mono POS)' }
              ].map(font => (
                <button
                  key={font.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, receiptFontFamily: font.id as any })}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                    formData.receiptFontFamily === font.id
                      ? 'border-amber-500 bg-amber-500/15 text-amber-800 dark:text-amber-300 ring-1 ring-amber-500/40'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800'
                  }`}
                >
                  {font.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              مهلة سياسة الاستبدال والاسترجاع (أيام):
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={0}
                max={90}
                value={formData.receiptReturnPolicyDays}
                onChange={e => setFormData({ ...formData, receiptReturnPolicyDays: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-24 text-center font-mono font-bold text-sm py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
              <span className="text-xs text-slate-500 dark:text-slate-400">
                أيام مسموحة للزبون لإرجاع البضاعة مع أصل الفاتورة
              </span>
            </div>
          </div>
        </div>

        {/* 2.5 Store Logo Upload and Integration */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <StoreLogoUploader
            showReceiptPreview={false}
            onLogoUpdated={newLogo => {
              setFormData(prev => ({ ...prev, logo: newLogo }));
            }}
          />
        </div>

        {/* 3. Elements Visibility Toggles */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
            العناصر المرئية على إيصال الفاتورة (Receipt Elements Visibility):
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { key: 'receiptShowLogo', label: 'اسم وشعار المتجر', desc: 'إظهار ترويسة المتجر واسمه بالعربي/الإنجليزي' },
              { key: 'receiptShowTaxNumber', label: 'الرقم الضريبي', desc: 'إظهار الرقم الضريبي والسجل التجاري' },
              { key: 'receiptShowCashierName', label: 'اسم الكاشير', desc: 'إظهار اسم الموظف أو المستخدم المحاسب' },
              { key: 'receiptShowCustomerInfo', label: 'بيانات العميل', desc: 'إظهار اسم العميل وكوده ورصيد النقاط' },
              { key: 'receiptShowBarcode', label: 'باركود الفاتورة 1D', desc: 'باركود خطي لقراءة رقم الفاتورة بجهاز الماسح' },
              { key: 'receiptShowQrCode', label: 'رمز الاستجابة السريعة QR', desc: 'كود QR للتحقق الرقمي من الفاتورة' },
              { key: 'receiptShowItemCount', label: 'إجمالي القطع والأصناف', desc: 'ملخص عدد الأصناف وإجمالي القطع بالفاتورة' },
              { key: 'receiptShowReturnPolicy', label: 'شروط وسياسة الإرجاع', desc: 'إظهار عبارة الاستبدال وعدد الأيام المسموح بها' },
            ].map(item => {
              const checked = (formData as any)[item.key] ?? true;
              return (
                <label
                  key={item.key}
                  className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-start justify-between gap-2.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors"
                >
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      {item.label}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                      {item.desc}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={e => setFormData({ ...formData, [item.key]: e.target.checked })}
                    className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500 shrink-0 mt-0.5"
                  />
                </label>
              );
            })}
          </div>
        </div>
      </div>

      {/* SECTION 3: Thermal Receipt Margins & Pre-Print Preview (ضبط هوامش الفاتورة ومعاينة ما قبل الطباعة) */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-6">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <Receipt className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                هوامش الفاتورة الحرارية ومعاينة ما قبل الطباعة (Thermal Margins & Cut Safety)
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              معايرة دقيقة لهوامش الفاتورة بالمليمتر ومسافة تلقيم الورق قبل شفرة القص التلقائي لتفادي قص الباركود أو الإجمالي على الطابعات الحرارية المختلفة.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetReceiptMargins}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>استعادة هوامش الفاتورة القياسية</span>
            </button>
          </div>
        </div>

        {/* 1. Toggle: Preview Receipt Before Printing */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="p-2.5 rounded-2xl bg-amber-500 text-slate-950 shadow-sm shrink-0">
              <Eye className="w-5 h-5" />
            </span>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-black text-slate-900 dark:text-white">
                  معاينة الفاتورة قبل الطباعة (Preview Receipt Before Print)
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300">
                  موصى به لتفادي أخطاء الورق
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                عند التفعيل، تظهر نافذة تفاعلية لمعاينة الفاتورة ببنودها، الإجماليات، والباركود مع خط توجيه القص قبل إرسال أمر الطباعة المادي للطابعة الحرارية، مما يمنح الكاشير فرصة التحقق وتجنب هدر الورق.
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={formData.previewReceiptBeforePrint}
              onChange={e => setFormData({ ...formData, previewReceiptBeforePrint: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-12 h-6.5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[3px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5.5 after:w-5.5 after:transition-all peer-checked:bg-amber-500"></div>
          </label>
        </div>

        {/* 2. Quick Presets Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              أنماط وهوامش سريعة جاهزة:
            </span>
            <span className="text-[10px] text-slate-400">انقر لتطبيق الإعدادات الموصى بها فوراً</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => handleApplyReceiptPreset('standard')}
              className={`p-3 rounded-2xl border text-start transition-all cursor-pointer ${
                formData.receiptTopMarginMm === 3 && formData.receiptBottomMarginMm === 4 && formData.receiptLeftMarginMm === 3 && formData.receiptRightMarginMm === 3 && formData.receiptBottomCutFeedMm === 18 && formData.receiptFontScale === 'normal'
                  ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/20 ring-1 ring-amber-500'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-slate-50/50 dark:bg-slate-800/40'
              }`}
            >
              <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center justify-between">
                <span>قياسي متوازن (Standard)</span>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono">3mm / 4mm</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                تنسيق متوازن لمعظم طابعات 80mm و 58mm مع مسافة قص أمان 18mm وخط قياسي 11.5px.
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleApplyReceiptPreset('compact')}
              className={`p-3 rounded-2xl border text-start transition-all cursor-pointer ${
                formData.receiptTopMarginMm === 1 && formData.receiptBottomMarginMm === 2 && formData.receiptLeftMarginMm === 1 && formData.receiptRightMarginMm === 1 && formData.receiptBottomCutFeedMm === 12 && formData.receiptFontScale === 'compact'
                  ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/20 ring-1 ring-amber-500'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-slate-50/50 dark:bg-slate-800/40'
              }`}
            >
              <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center justify-between">
                <span>مضغوط موفر للورق (Paper Saver)</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">1mm / 2mm</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                هوامش ضيقة 1mm ومسافة قص 12mm مع خط 10px لتقليل استهلاك رول الورق الحراري.
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleApplyReceiptPreset('comfort')}
              className={`p-3 rounded-2xl border text-start transition-all cursor-pointer ${
                formData.receiptTopMarginMm === 5 && formData.receiptBottomMarginMm === 6 && formData.receiptLeftMarginMm === 5 && formData.receiptRightMarginMm === 5 && formData.receiptBottomCutFeedMm === 22 && formData.receiptFontScale === 'large'
                  ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/20 ring-1 ring-amber-500'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-slate-50/50 dark:bg-slate-800/40'
              }`}
            >
              <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center justify-between">
                <span>واسع وبارز (Comfort / Large)</span>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono">5mm / 6mm</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                هوامش واسعة 5mm ومسافة قص 22mm مع خط بارز 13px لسهولة القراءة في المطاعم.
              </p>
            </button>
          </div>
        </div>

        {/* 3. Detailed Margins & Cut Clearance Calibration Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Margins Controls Column */}
          <div className="lg:col-span-7 space-y-4">
            <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-amber-500" />
              <span>هوامش الفاتورة الأربعة بالمليمتر (Millimeter Margins)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Top Margin */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">الهامش العلوي (Top)</span>
                  <span className="text-xs font-mono font-black text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-700 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-600">
                    {formData.receiptTopMarginMm} mm
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAdjustReceiptMargin('receiptTopMarginMm', -1)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-bold text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600"
                  >
                    -
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={25}
                    value={formData.receiptTopMarginMm}
                    onChange={e => setFormData({ ...formData, receiptTopMarginMm: Number(e.target.value) })}
                    className="flex-1 accent-amber-500 cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => handleAdjustReceiptMargin('receiptTopMarginMm', 1)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-bold text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Bottom Margin */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">الهامش السفلي (Bottom)</span>
                  <span className="text-xs font-mono font-black text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-700 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-600">
                    {formData.receiptBottomMarginMm} mm
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAdjustReceiptMargin('receiptBottomMarginMm', -1)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-bold text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600"
                  >
                    -
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={25}
                    value={formData.receiptBottomMarginMm}
                    onChange={e => setFormData({ ...formData, receiptBottomMarginMm: Number(e.target.value) })}
                    className="flex-1 accent-amber-500 cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => handleAdjustReceiptMargin('receiptBottomMarginMm', 1)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-bold text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Right Margin */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">الهامش الأيمن (Right)</span>
                  <span className="text-xs font-mono font-black text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-700 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-600">
                    {formData.receiptRightMarginMm} mm
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAdjustReceiptMargin('receiptRightMarginMm', -1)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-bold text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600"
                  >
                    -
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={20}
                    value={formData.receiptRightMarginMm}
                    onChange={e => setFormData({ ...formData, receiptRightMarginMm: Number(e.target.value) })}
                    className="flex-1 accent-amber-500 cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => handleAdjustReceiptMargin('receiptRightMarginMm', 1)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-bold text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Left Margin */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">الهامش الأيسر (Left)</span>
                  <span className="text-xs font-mono font-black text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-700 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-600">
                    {formData.receiptLeftMarginMm} mm
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAdjustReceiptMargin('receiptLeftMarginMm', -1)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-bold text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600"
                  >
                    -
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={20}
                    value={formData.receiptLeftMarginMm}
                    onChange={e => setFormData({ ...formData, receiptLeftMarginMm: Number(e.target.value) })}
                    className="flex-1 accent-amber-500 cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => handleAdjustReceiptMargin('receiptLeftMarginMm', 1)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-bold text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Cut Feed Clearance Spacer */}
            <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                    <Scissors className="w-4 h-4" />
                  </span>
                  <div>
                    <h5 className="text-xs font-black text-slate-900 dark:text-white">
                      مسافة تلقيم الورق قبل شفرة القص التلقائي (Cut Clearance Feed)
                    </h5>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      المسافة الإضافية الفارغة أسفل الفاتورة لضمان خروج الورق بعد رأس الطباعة وقبل موضع السكين
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono font-black text-rose-700 dark:text-rose-300 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-xl border border-rose-200 dark:border-rose-800 shadow-xs">
                  {formData.receiptBottomCutFeedMm} mm
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleAdjustReceiptMargin('receiptBottomCutFeedMm', -2)}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-800 font-bold text-xs text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-900/40"
                >
                  -2 mm
                </button>
                <input
                  type="range"
                  min={5}
                  max={45}
                  step={1}
                  value={formData.receiptBottomCutFeedMm}
                  onChange={e => setFormData({ ...formData, receiptBottomCutFeedMm: Number(e.target.value) })}
                  className="flex-1 accent-rose-500 cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => handleAdjustReceiptMargin('receiptBottomCutFeedMm', 2)}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-800 font-bold text-xs text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-900/40"
                >
                  +2 mm
                </button>
              </div>

              <div className="text-[10px] text-rose-900/80 dark:text-rose-200/80 leading-relaxed bg-white/70 dark:bg-slate-800/70 p-2.5 rounded-xl border border-rose-200/60 dark:border-rose-800/40 flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                <span>
                  <strong>تنبيه فني مهم:</strong> الطابعات الحرارية المزودة بقاطع آلي (مثل Xprinter و Epson و Bixolon) تقع شفرة القص فيها على مسافة 12mm إلى 20mm بعد رأس الطباعة الحراري. إذا كانت مسافة التلقيم صغيرة جداً، ستقوم الشفرة بقص باركود الاسترجاع أو رسالة التذييل! القيمة الموصى بها هي <strong>18mm</strong>.
                </span>
              </div>
            </div>

            {/* Receipt Font Scaling Selector */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  مقياس حجم خط الفاتورة (Receipt Font Scale):
                </label>
                <span className="text-[10px] font-mono text-slate-400">
                  {formData.receiptFontScale === 'compact' ? '10px مدمج' : formData.receiptFontScale === 'large' ? '13px بارز' : '11.5px قياسي'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'compact', label: 'مضغوط (10px)', desc: 'موفر للورق وكثيف' },
                  { id: 'normal', label: 'قياسي (11.5px)', desc: 'المتوازن الموصى به' },
                  { id: 'large', label: 'كبير وواضح (13px)', desc: 'بارز للمطاعم والمسنين' }
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, receiptFontScale: item.id as any })}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      formData.receiptFontScale === item.id
                        ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold shadow-xs'
                        : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-xs font-bold">{item.label}</div>
                    <div className={`text-[9px] mt-0.5 ${formData.receiptFontScale === item.id ? 'text-slate-900/80' : 'text-slate-400'}`}>
                      {item.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Live Receipt Interactive Sandbox Column */}
          <div className="lg:col-span-5 bg-slate-100/90 dark:bg-slate-950/70 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-start space-y-3">
            {/* Sandbox Controls Bar */}
            <div className="w-full flex items-center justify-between text-xs pb-2 border-b border-slate-200 dark:border-slate-800">
              <span className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-amber-500" />
                معاينة مباشرة لشريط الرول ({formData.printPaperSize === '58mm' ? '58mm' : '80mm'})
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowReceiptRulers(!showReceiptRulers)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                    showReceiptRulers
                      ? 'bg-amber-500/20 text-amber-600 border-amber-500/40'
                      : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                  }`}
                  title="إظهار / إخفاء مسطرة المليمتر"
                >
                  مسطرة mm
                </button>
                <button
                  type="button"
                  onClick={() => setReceiptZoom(z => Math.max(0.7, Number((z - 0.1).toFixed(1))))}
                  className="p-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                  title="تصغير"
                >
                  <ZoomOut className="w-3 h-3" />
                </button>
                <span className="text-[10px] font-mono font-bold px-1 text-slate-600 dark:text-slate-300">
                  {Math.round(receiptZoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setReceiptZoom(z => Math.min(1.3, Number((z + 0.1).toFixed(1))))}
                  className="p-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                  title="تكبير"
                >
                  <ZoomIn className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Virtual Thermal Receipt Simulation Roll */}
            <div className="w-full flex justify-center overflow-x-auto py-2">
              <div
                className={`bg-white text-black shadow-lg rounded-sm relative transition-all border border-slate-300 select-none ${
                  formData.receiptFontFamily === 'cairo' ? 'font-[Cairo,sans-serif]' :
                  formData.receiptFontFamily === 'tajawal' ? 'font-[Tajawal,sans-serif]' :
                  formData.receiptFontFamily === 'mono' ? 'font-mono' : 'font-sans'
                } ${formData.receiptTemplateStyle === 'thermal_bold' ? 'font-black' : ''}`}
                style={{
                  width: `${formData.printPaperSize === '58mm' ? 52 : 76}mm`,
                  maxWidth: '100%',
                  paddingTop: `${formData.receiptTopMarginMm}mm`,
                  paddingBottom: `${formData.receiptBottomMarginMm}mm`,
                  paddingRight: `${formData.receiptRightMarginMm}mm`,
                  paddingLeft: `${formData.receiptLeftMarginMm}mm`,
                  transform: `scale(${receiptZoom})`,
                  transformOrigin: 'top center',
                  fontSize: formData.receiptFontScale === 'compact' ? '10px' : formData.receiptFontScale === 'large' ? '13px' : '11.5px',
                  boxSizing: 'border-box'
                }}
              >
                {/* Rulers Overlay Guide */}
                {showReceiptRulers && (
                  <div className="absolute inset-0 pointer-events-none border border-dashed border-amber-400/40">
                    <span className="absolute top-0.5 right-1 text-[8px] font-mono text-amber-600">
                      ع:{formData.receiptTopMarginMm}mm
                    </span>
                    <span className="absolute bottom-1 right-1 text-[8px] font-mono text-amber-600">
                      س:{formData.receiptBottomMarginMm}mm
                    </span>
                  </div>
                )}

                {/* Header */}
                <div className={`pb-2 mb-2 text-center ${
                  formData.receiptTemplateStyle === 'classic' ? 'border-b-2 border-double border-black' :
                  formData.receiptTemplateStyle === 'thermal_bold' ? 'border-b-2 border-black' :
                  formData.receiptTemplateStyle === 'minimal' ? 'border-b border-slate-300' :
                  'border-b border-dashed border-slate-400'
                }`}>
                  {formData.receiptShowLogo && (
                    <div className="flex flex-col items-center justify-center mb-1">
                      {settings.logo && (
                        <img
                          src={settings.logo}
                          alt="شعار المتجر"
                          className="max-h-12 max-w-[120px] object-contain mb-1 filter grayscale contrast-125"
                        />
                      )}
                      <div className={`font-black tracking-tight ${
                        formData.receiptTemplateStyle === 'thermal_bold' ? 'text-base font-black uppercase' :
                        formData.receiptTemplateStyle === 'classic' ? 'text-sm font-bold tracking-wider' :
                        'text-sm'
                      }`}>
                        {settings.storeNameAr || 'كاشير كيان'}
                      </div>
                    </div>
                  )}
                  <div className="text-[9px] text-slate-600">{settings.storeNameEn}</div>
                  <div className="text-[10px] text-slate-700">{settings.address}</div>
                  <div className="text-[9.5px] text-slate-600 font-mono">هاتف: {settings.phone}</div>
                  {formData.receiptShowTaxNumber && settings.taxNumber && (
                    <div className="text-[9px] text-slate-600 font-mono">الرقم الضريبي: {settings.taxNumber}</div>
                  )}
                </div>

                {formData.receiptHeader && (
                  <div className="text-[9.5px] italic text-slate-600 text-center mb-2 border-b border-dashed border-slate-200 pb-1">
                    {formData.receiptHeader}
                  </div>
                )}

                {/* Meta */}
                <div className={`text-[10px] space-y-0.5 pb-1.5 mb-1.5 text-start font-mono ${
                  formData.receiptTemplateStyle === 'classic' ? 'border-b-2 border-double border-black' :
                  formData.receiptTemplateStyle === 'thermal_bold' ? 'border-b-2 border-black font-bold' :
                  'border-b border-dashed border-slate-400'
                }`}>
                  <div className="flex justify-between">
                    <span>رقم الفاتورة:</span>
                    <span className="font-bold">INV-2026-TEST</span>
                  </div>
                  <div className="flex justify-between">
                    <span>التاريخ:</span>
                    <span>{new Date().toLocaleDateString('ar-SY')}</span>
                  </div>
                  {formData.receiptShowCashierName && (
                    <div className="flex justify-between">
                      <span>الكاشير:</span>
                      <span>كاشير تجريبي</span>
                    </div>
                  )}
                  {formData.receiptShowCustomerInfo && (
                    <div className="flex justify-between">
                      <span>العميل:</span>
                      <span>محمد السعيد (CUST-001)</span>
                    </div>
                  )}
                </div>

                {/* Items */}
                <table className="w-full text-[10px] mb-2 text-start">
                  <thead>
                    <tr className={`${
                      formData.receiptTemplateStyle === 'classic' ? 'border-b-2 border-t-2 border-black text-black' :
                      formData.receiptTemplateStyle === 'thermal_bold' ? 'border-b-2 border-black text-black font-black bg-slate-100' :
                      'border-b border-black text-black'
                    }`}>
                      <th className="text-start py-0.5">الصنف</th>
                      <th className="text-center py-0.5">الكمية</th>
                      <th className="text-end py-0.5">المجموع</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${
                    formData.receiptTemplateStyle === 'thermal_bold' ? 'divide-black' : 'divide-dashed divide-slate-200'
                  } font-mono`}>
                    <tr>
                      <td className="py-0.5 font-sans font-medium">{sampleProduct.nameAr}</td>
                      <td className="text-center py-0.5">2</td>
                      <td className="text-end py-0.5 font-bold">{(sampleProduct.price * 2).toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 font-sans font-medium">مياه معدنية 500 مل</td>
                      <td className="text-center py-0.5">1</td>
                      <td className="text-end py-0.5 font-bold">3,000</td>
                    </tr>
                  </tbody>
                </table>

                {/* Items Count Summary */}
                {formData.receiptShowItemCount && (
                  <div className="flex justify-between text-[9px] text-slate-500 border-t border-dashed border-slate-200 py-1 font-mono">
                    <span>عدد الأصناف: 2</span>
                    <span>إجمالي القطع: 3</span>
                  </div>
                )}

                {/* Totals */}
                <div className={`pt-1.5 mb-2 font-mono text-[10px] ${
                  formData.receiptTemplateStyle === 'classic' ? 'border-double border-t-2 border-black' :
                  formData.receiptTemplateStyle === 'thermal_bold' ? 'border-black border-t-2 font-bold' :
                  'border-t border-dashed border-black'
                }`}>
                  <div className={`flex justify-between py-1 my-1 ${
                    formData.receiptTemplateStyle === 'modern' ? 'bg-slate-900 text-white px-1.5 rounded font-black text-xs' :
                    formData.receiptTemplateStyle === 'classic' ? 'border-y-2 border-double border-black font-black text-xs' :
                    formData.receiptTemplateStyle === 'thermal_bold' ? 'border-y-2 border-black font-black text-xs' :
                    'border-y border-black font-bold text-xs'
                  }`}>
                    <span className="font-sans">الإجمالي النهائي:</span>
                    <span>{(sampleProduct.price * 2 + 3000).toLocaleString()} {settings.currency.symbol}</span>
                  </div>
                </div>

                {/* Barcode */}
                {formData.receiptShowBarcode && (
                  <div className="my-2 flex flex-col items-center justify-center">
                    <div
                      className="max-w-full overflow-hidden flex justify-center"
                      dangerouslySetInnerHTML={{
                        __html: generateBarcodeSvg('INV-2026-TEST', {
                          width: Math.min(220, (formData.printPaperSize === '58mm' ? 52 : 76) * 3.2),
                          height: 42,
                          fontSize: 8.5,
                          showText: true,
                          barColor: '#000000',
                          bgColor: '#ffffff'
                        })
                      }}
                    />
                    <span className="text-[8px] text-slate-400 font-mono mt-0.5">باركود استرجاع الفاتورة</span>
                  </div>
                )}

                {/* QR Code */}
                {formData.receiptShowQrCode && (
                  <div className="my-1.5 flex flex-col items-center justify-center">
                    <div className="w-14 h-14 border border-slate-300 p-1 bg-white flex items-center justify-center rounded">
                      <QrCode className="w-10 h-10 text-slate-900" />
                    </div>
                    <span className="text-[7.5px] text-slate-400 font-mono mt-0.5">مسح للتحقق الرقمي</span>
                  </div>
                )}

                {/* Return Policy */}
                {formData.receiptShowReturnPolicy && (
                  <div className="text-[8.5px] text-slate-600 border-t border-dashed border-slate-300 pt-1 my-1 text-center">
                    البضاعة المباعة ترد وتستبدل خلال {formData.receiptReturnPolicyDays || 3} أيام مع أصل الفاتورة
                  </div>
                )}

                {/* Footer */}
                {formData.receiptFooter && (
                  <div className="border-t border-dashed border-slate-300 pt-1.5 text-[9px] text-slate-500 text-center">
                    {formData.receiptFooter}
                  </div>
                )}

                {/* Visual Scissors Cut Line & Clearance Feed */}
                <div
                  style={{
                    height: `${formData.receiptBottomCutFeedMm}mm`,
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  className="relative my-1"
                >
                  <div className="w-full border-b-2 border-dashed border-rose-400 my-auto relative">
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full text-[8px] font-black flex items-center gap-1 border border-rose-300 shadow-xs whitespace-nowrap">
                      <Scissors className="w-2.5 h-2.5" />
                      <span>خط سكين القاطع ({formData.receiptBottomCutFeedMm}mm مسافة أمان)</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Print Test Button */}
            <div className="w-full pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrintTestReceipt}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span>طباعة إيصال تجريبي على الطابعة الحرارية</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: Label Alignment & Calibration Studio (Interactive Visual Sandbox) */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Tag className="w-4 h-4 text-amber-500" />
              <span>استوديو معايرة ومحاذاة ملصقات الباركود والرفوف (Label Alignment Studio)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              تحكم دقيق بالهوامش بالمليمتر (mm) مع مسطرة قياس وشبكة محاذاة مرئية لتجنب خروج النصوص عن حواف الورق
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetAlignmentDefaults}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>استعادة القياسات القياسية</span>
            </button>
          </div>
        </div>

        {/* Layout: Controls on Left / Right, Live Visual Sandbox on the other */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Column (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Margin Calibration Numeric Controls */}
            <div className="bg-slate-50/80 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-amber-500" />
                  <span>معايرة الهوامش الدقيقة بالمليمتر (Margins Calibration)</span>
                </span>
                <span className="text-[10px] text-slate-400">خطوة الضبط: 1mm</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Top Margin */}
                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    الهامش العلوي
                  </span>
                  <div className="flex items-center justify-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleAdjustMargin('topMarginMm', -1)}
                      className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-amber-500 hover:text-slate-950 font-bold text-xs"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-mono font-bold text-xs text-amber-600 dark:text-amber-400">
                      {formData.labelAlignment.topMarginMm}mm
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAdjustMargin('topMarginMm', 1)}
                      className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-amber-500 hover:text-slate-950 font-bold text-xs"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Bottom Margin */}
                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    الهامش السفلي
                  </span>
                  <div className="flex items-center justify-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleAdjustMargin('bottomMarginMm', -1)}
                      className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-amber-500 hover:text-slate-950 font-bold text-xs"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-mono font-bold text-xs text-amber-600 dark:text-amber-400">
                      {formData.labelAlignment.bottomMarginMm}mm
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAdjustMargin('bottomMarginMm', 1)}
                      className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-amber-500 hover:text-slate-950 font-bold text-xs"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Right Margin */}
                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    الهامش الأيمن
                  </span>
                  <div className="flex items-center justify-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleAdjustMargin('rightMarginMm', -1)}
                      className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-amber-500 hover:text-slate-950 font-bold text-xs"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-mono font-bold text-xs text-amber-600 dark:text-amber-400">
                      {formData.labelAlignment.rightMarginMm}mm
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAdjustMargin('rightMarginMm', 1)}
                      className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-amber-500 hover:text-slate-950 font-bold text-xs"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Left Margin */}
                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    الهامش الأيسر
                  </span>
                  <div className="flex items-center justify-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleAdjustMargin('leftMarginMm', -1)}
                      className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-amber-500 hover:text-slate-950 font-bold text-xs"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-mono font-bold text-xs text-amber-600 dark:text-amber-400">
                      {formData.labelAlignment.leftMarginMm}mm
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAdjustMargin('leftMarginMm', 1)}
                      className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-amber-500 hover:text-slate-950 font-bold text-xs"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Feed Offset / Label Gap */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                <div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    فاصل تغذية الملصق (Label Gap / Sensor Offset):
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    المسافة بين كل ملصق والملصق الذي يليه على رول التغذية
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleAdjustMargin('gapOffsetMm', -1)}
                    className="w-6 h-6 rounded bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-amber-500 hover:text-slate-950 font-bold text-xs"
                  >
                    -
                  </button>
                  <span className="w-10 text-center font-mono font-bold text-xs text-amber-600 dark:text-amber-400">
                    {formData.labelAlignment.gapOffsetMm}mm
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAdjustMargin('gapOffsetMm', 1)}
                    className="w-6 h-6 rounded bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-amber-500 hover:text-slate-950 font-bold text-xs"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Alignment Orientations & Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Text Alignment */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  محاذاة النصوص والأسعار
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['right', 'center', 'left'] as const).map(align => (
                    <button
                      key={align}
                      type="button"
                      onClick={() => setFormData({
                        ...formData,
                        labelAlignment: { ...formData.labelAlignment, textAlign: align }
                      })}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                        formData.labelAlignment.textAlign === align
                          ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {align === 'right' ? 'يمين' : align === 'center' ? 'وسط' : 'يسار'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Barcode Alignment */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  محاذاة خطوط الباركود
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['right', 'center', 'left'] as const).map(align => (
                    <button
                      key={align}
                      type="button"
                      onClick={() => setFormData({
                        ...formData,
                        labelAlignment: { ...formData.labelAlignment, barcodeAlign: align }
                      })}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                        formData.labelAlignment.barcodeAlign === align
                          ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {align === 'right' ? 'يمين' : align === 'center' ? 'وسط' : 'يسار'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Elements Display Toggles */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                العناصر المضمنة في الملصق
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { key: 'showStoreName', label: 'اسم المتجر' },
                  { key: 'showProductName', label: 'اسم الصنف' },
                  { key: 'showPrice', label: 'سعر البيع' },
                  { key: 'showBarcode', label: 'خطوط الباركود' },
                  { key: 'showSku', label: 'رمز SKU' },
                  { key: 'showDate', label: 'تاريخ الطباعة' }
                ].map(el => {
                  const isChecked = (formData.labelAlignment as any)[el.key];
                  return (
                    <label
                      key={el.key}
                      className="flex items-center gap-2 p-2 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={e => setFormData({
                          ...formData,
                          labelAlignment: {
                            ...formData.labelAlignment,
                            [el.key]: e.target.checked
                          }
                        })}
                        className="w-3.5 h-3.5 accent-amber-500 rounded"
                      />
                      <span className="font-bold text-slate-700 dark:text-slate-300">{el.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Test Sample Product Picker */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                الصنف التجريبي للمعاينة والاختبار
              </label>
              <select
                value={sampleProductId}
                onChange={e => setSampleProductId(e.target.value)}
                className="w-full text-xs font-bold px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none"
              >
                {products.slice(0, 15).map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nameAr} — {formatCurrency(p.price)} ({p.barcode})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Live Visual Sandbox & Rulers Column (5 cols) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-4 bg-slate-100/90 dark:bg-slate-950/80 rounded-2xl border border-slate-200 dark:border-slate-800 relative overflow-hidden">
            {/* Sandbox Toolbar */}
            <div className="w-full flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2 mb-3 text-xs">
              <div className="flex items-center gap-1.5">
                <Scan className="w-3.5 h-3.5 text-amber-500" />
                <span className="font-black text-slate-800 dark:text-slate-200">معاينة المحاذاة الحية</span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowRulerGuides(!showRulerGuides)}
                  className={`p-1 rounded-md text-[10px] font-bold ${
                    showRulerGuides ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300' : 'text-slate-400'
                  }`}
                  title="إظهار/إخفاء المسطرة"
                >
                  المسطرة
                </button>
                <button
                  type="button"
                  onClick={() => setShowCrosshairs(!showCrosshairs)}
                  className={`p-1 rounded-md text-[10px] font-bold ${
                    showCrosshairs ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300' : 'text-slate-400'
                  }`}
                  title="إظهار/إخفاء خطوط المنتصف"
                >
                  التقاطع
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewZoom(z => Math.max(0.8, Number((z - 0.2).toFixed(1))))}
                  className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-mono text-slate-400 w-8 text-center">{Math.round(previewZoom * 100)}%</span>
                <button
                  type="button"
                  onClick={() => setPreviewZoom(z => Math.min(2.0, Number((z + 0.2).toFixed(1))))}
                  className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Visual Canvas Area */}
            <div className="w-full flex items-center justify-center p-4 min-h-[300px] overflow-auto">
              <div
                style={{
                  transform: `scale(${previewZoom})`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.15s ease'
                }}
                className="relative"
              >
                {/* Horizontal Millimeter Ticks (Ruler) */}
                {showRulerGuides && (
                  <div className="absolute -top-5 left-0 right-0 h-4 flex justify-between text-[8px] font-mono text-slate-400 select-none border-b border-slate-300 dark:border-slate-700 px-1">
                    <span>0</span>
                    <span>10mm</span>
                    <span>20mm</span>
                    <span>30mm</span>
                    <span>40mm</span>
                    <span>50mm</span>
                  </div>
                )}

                {/* Vertical Millimeter Ticks (Ruler) */}
                {showRulerGuides && (
                  <div className="absolute top-0 -left-6 bottom-0 w-5 flex flex-col justify-between text-[8px] font-mono text-slate-400 select-none border-e border-slate-300 dark:border-slate-700 py-1 text-end pe-1">
                    <span>0</span>
                    <span>10</span>
                    <span>20</span>
                    <span>30</span>
                  </div>
                )}

                {/* Center Crosshairs Overlay */}
                {showCrosshairs && (
                  <>
                    <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[1px] bg-red-400/40 border-r border-dashed border-red-500 pointer-events-none z-20" />
                    <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[1px] bg-red-400/40 border-b border-dashed border-red-500 pointer-events-none z-20" />
                  </>
                )}

                {/* Simulated Thermal Label Container */}
                <div
                  className="bg-white text-slate-950 shadow-xl border border-slate-300 rounded-md relative select-none"
                  style={{
                    width: `${Math.min(260, selectedPreset.widthMm * 3.4)}px`,
                    minHeight: selectedPreset.heightMm ? `${selectedPreset.heightMm * 3.4}px` : '180px',
                    paddingTop: `${formData.labelAlignment.topMarginMm * 3.4}px`,
                    paddingBottom: `${formData.labelAlignment.bottomMarginMm * 3.4}px`,
                    paddingRight: `${formData.labelAlignment.rightMarginMm * 3.4}px`,
                    paddingLeft: `${formData.labelAlignment.leftMarginMm * 3.4}px`
                  }}
                >
                  {/* Safety Margins Guide Box (Dashed Cyan Boundary) */}
                  <div
                    className="w-full h-full border border-dashed border-cyan-500/50 rounded flex flex-col justify-between p-1 relative"
                    style={{
                      textAlign: formData.labelAlignment.textAlign
                    }}
                  >
                    {/* Top: Store Name */}
                    {formData.labelAlignment.showStoreName && (
                      <div className="text-[10px] font-bold text-slate-600 truncate border-b border-dashed border-slate-200 pb-0.5">
                        {settings.storeNameAr}
                      </div>
                    )}

                    {/* Middle: Product Name & SKU */}
                    <div className="my-1 space-y-0.5">
                      {formData.labelAlignment.showProductName && (
                        <h4 className="text-xs font-black text-slate-900 leading-tight">
                          {sampleProduct.nameAr}
                        </h4>
                      )}
                      {formData.labelAlignment.showSku && (
                        <span className="text-[9px] font-mono text-slate-500 block">
                          SKU: {sampleProduct.sku || 'N/A'}
                        </span>
                      )}
                    </div>

                    {/* Barcode Vector Graphic */}
                    {formData.labelAlignment.showBarcode && (
                      <div
                        className="my-1 flex"
                        style={{
                          justifyContent: formData.labelAlignment.barcodeAlign === 'right' ? 'flex-end' : formData.labelAlignment.barcodeAlign === 'left' ? 'flex-start' : 'center'
                        }}
                      >
                        <div
                          dangerouslySetInnerHTML={{ __html: sampleBarcodeSvg }}
                          className="w-full flex justify-center [&>svg]:max-h-11"
                        />
                      </div>
                    )}

                    {/* Bottom: Price & Expiry Date */}
                    <div className="flex items-center justify-between border-t border-dashed border-slate-200 pt-0.5 mt-0.5 text-xs">
                      {formData.labelAlignment.showPrice && (
                        <div className="font-black text-slate-950 font-mono text-sm leading-none">
                          {formatCurrency(sampleProduct.price)}
                        </div>
                      )}
                      {formData.labelAlignment.showDate && (
                        <span className="text-[8px] text-slate-400 font-mono">
                          {new Date().toLocaleDateString(language === 'ar' ? 'ar-SY' : 'en-US')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sandbox Legend */}
            <div className="w-full pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span>إطار الهوامش الآمنة</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                <span>نقطة المركز والتقاطع</span>
              </span>
              <span className="font-mono text-amber-600 dark:text-amber-400">
                {selectedPreset.widthMm}mm رول
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: Live Test Actions & Diagnostic Prints */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>الاختبار الفعلي وأوامر الطباعة التجريبية (Live Test Printing Actions)</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            أرسل أوامر تجريبية حقيقية لطابعتك للتحقق من سلامة المحاذاة، حدة الحبر الحراري، وقابلية قراءة الباركود
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Test 1: Calibration Test Sheet */}
          <button
            type="button"
            onClick={handlePrintCalibrationSheet}
            className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 text-start space-y-1.5 transition-all cursor-pointer group hover:border-amber-500/50"
          >
            <div className="flex items-center justify-between">
              <span className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black group-hover:scale-105 transition-transform">
                <Maximize2 className="w-4 h-4" />
              </span>
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                معايرة هندسية
              </span>
            </div>
            <h4 className="text-xs font-black text-slate-900 dark:text-white">
              طباعة صفحة معايرة المحاذاة
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              تطبع شبكة مليمترية دقيقة مع أهداف التقاطع لاختبار انحراف الورق ومطابقته بالمسطرة
            </p>
          </button>

          {/* Test 2: Sample Receipt Print */}
          <button
            type="button"
            onClick={handlePrintTestReceipt}
            className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 text-start space-y-1.5 transition-all cursor-pointer group hover:border-amber-500/50"
          >
            <div className="flex items-center justify-between">
              <span className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black group-hover:scale-105 transition-transform">
                <Receipt className="w-4 h-4" />
              </span>
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                {selectedPreset.title.split(' ')[0]}
              </span>
            </div>
            <h4 className="text-xs font-black text-slate-900 dark:text-white">
              طباعة إيصال كاشير تجريبي
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              تطبع فاتورة مبيعات نموذجية وفق مقاس الورق المختار ({selectedPreset.widthMm}mm) مع الترويسة والباركود
            </p>
          </button>

          {/* Test 3: Sample Label Print */}
          <button
            type="button"
            onClick={handlePrintTestLabel}
            className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 text-start space-y-1.5 transition-all cursor-pointer group hover:border-amber-500/50"
          >
            <div className="flex items-center justify-between">
              <span className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black group-hover:scale-105 transition-transform">
                <Tag className="w-4 h-4" />
              </span>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                ملصق صنف
              </span>
            </div>
            <h4 className="text-xs font-black text-slate-900 dark:text-white">
              طباعة ملصق باركود تجريبي
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              تطبع ملصق الصنف ({sampleProduct.nameAr}) بالهوامش المخصصة مباشرة على طابعة الباركود
            </p>
          </button>
        </div>
      </div>

      {/* HIDDEN PRINTABLE ELEMENTS FOR BROWSER PRINT TRIGGER */}

      {/* 1. Printable Calibration Sheet */}
      {activePrintMode === 'calibration' && (
        <div id="printable-calibration-sheet" className="hidden font-sans text-black">
          <div style={{ width: `${selectedPreset.widthMm || 80}mm`, margin: '0 auto', textAlign: 'center' }}>
            <div style={{ borderBottom: '2px solid #000', paddingBottom: '4px', marginBottom: '8px' }}>
              <h2 style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 2px 0' }}>ورقة معايرة ومحاذاة الطباعة</h2>
              <p style={{ fontSize: '10px', margin: 0 }}>نظام كيان كاشير • المقاس: {selectedPreset.title}</p>
            </div>

            {/* Millimeter Ruler Pattern */}
            <div style={{ border: '1px solid #000', height: '25px', position: 'relative', margin: '8px 0', background: '#fff' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '8px', borderBottom: '1px solid #000', display: 'flex', justifyContent: 'space-between', fontSize: '7px', padding: '0 2px' }}>
                <span>0</span>
                <span>10mm</span>
                <span>20mm</span>
                <span>30mm</span>
                <span>40mm</span>
                <span>50mm</span>
                <span>60mm</span>
                <span>70mm</span>
              </div>
              <div style={{ position: 'absolute', bottom: '2px', left: 0, right: 0, fontSize: '8px', textAlign: 'center' }}>
                مسطرة مطابقة 100% (تأكد من عدم تصغير الحجم عند الطباعة)
              </div>
            </div>

            {/* Target Crosshairs */}
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '12px 0', fontSize: '9px' }}>
              <div style={{ border: '1px dashed #000', padding: '4px', width: '30%' }}>
                + هدف اليمين
              </div>
              <div style={{ border: '1px solid #000', padding: '4px', width: '30%', fontWeight: 'bold' }}>
                ✛ هدف المركز
              </div>
              <div style={{ border: '1px dashed #000', padding: '4px', width: '30%' }}>
                + هدف اليسار
              </div>
            </div>

            {/* Current Config Values */}
            <div style={{ border: '1px solid #000', padding: '6px', fontSize: '9px', textAlign: 'start', margin: '8px 0' }}>
              <div><b>الهوامش المطبقة:</b></div>
              <div>علوي: {formData.labelAlignment.topMarginMm}mm | سفلي: {formData.labelAlignment.bottomMarginMm}mm</div>
              <div>أيمن: {formData.labelAlignment.rightMarginMm}mm | أيسر: {formData.labelAlignment.leftMarginMm}mm</div>
              <div>فاصل التغذية: {formData.labelAlignment.gapOffsetMm}mm</div>
            </div>

            {/* Barcode Test */}
            <div style={{ margin: '8px 0' }}>
              <div dangerouslySetInnerHTML={{ __html: sampleBarcodeSvg }} style={{ display: 'flex', justifyContent: 'center' }} />
              <div style={{ fontSize: '9px', fontFamily: 'monospace' }}>6210984521043</div>
              <div style={{ fontSize: '8px', color: '#666' }}>افحص هذا الباركود بمسدس الليزر للتأكد من سهولة القراءة</div>
            </div>

            <div style={{ borderTop: '1px dashed #000', paddingTop: '4px', fontSize: '8px' }}>
              تاريخ وتوقيت الاختبار: {new Date().toLocaleString('ar-SY')}
            </div>
          </div>
        </div>
      )}

      {/* 2. Printable Sample Receipt */}
      {activePrintMode === 'receipt' && (
        <div id="printable-receipt" className="hidden font-sans text-black">
          <div
            style={{
              width: `${formData.printPaperSize === '58mm' ? 52 : 76}mm`,
              margin: '0 auto',
              textAlign: 'center',
              fontSize: formData.receiptFontScale === 'compact' ? '10px' : formData.receiptFontScale === 'large' ? '13px' : '11.5px',
              paddingTop: `${formData.receiptTopMarginMm}mm`,
              paddingBottom: `${formData.receiptBottomMarginMm}mm`,
              paddingRight: `${formData.receiptRightMarginMm}mm`,
              paddingLeft: `${formData.receiptLeftMarginMm}mm`,
              boxSizing: 'border-box'
            }}
          >
            <div style={{ borderBottom: '1px dashed #000', paddingBottom: '6px', marginBottom: '6px' }}>
              {formData.printStoreLogo && (
                <div style={{ fontSize: '16px', fontWeight: '900', marginBottom: '2px' }}>{settings.storeNameAr}</div>
              )}
              <div style={{ fontSize: '9px', color: '#444' }}>{settings.storeNameEn}</div>
              <div style={{ fontSize: '10px' }}>{settings.address}</div>
              <div style={{ fontSize: '10px' }}>هاتف: {settings.phone}</div>
              {formData.printTaxDetails && settings.taxNumber && (
                <div style={{ fontSize: '9px' }}>الرقم الضريبي: {settings.taxNumber}</div>
              )}
            </div>

            {formData.receiptHeader && (
              <div style={{ fontSize: '10px', fontStyle: 'italic', marginBottom: '6px' }}>
                {formData.receiptHeader}
              </div>
            )}

            <div style={{ textAlign: 'start', fontSize: '10px', borderBottom: '1px dashed #000', paddingBottom: '4px', marginBottom: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>رقم الفاتورة:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>INV-2026-TEST</span>
              </div>
              {formData.printCashierDetails && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>الكاشير:</span>
                    <span>كاشير تجريبي (الوردية 1)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>التاريخ والوقت:</span>
                    <span>{new Date().toLocaleString('ar-SY')}</span>
                  </div>
                </>
              )}
            </div>

            {/* Items Table */}
            <table style={{ width: '100%', fontSize: '10px', borderCollapse: 'collapse', marginBottom: '6px', textAlign: 'start' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #000' }}>
                  <th style={{ textAlign: 'start', padding: '2px 0' }}>الصنف</th>
                  <th style={{ textAlign: 'center', padding: '2px 0' }}>الكمية</th>
                  <th style={{ textAlign: 'end', padding: '2px 0' }}>الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '3px 0' }}>{sampleProduct.nameAr}</td>
                  <td style={{ textAlign: 'center', padding: '3px 0' }}>2</td>
                  <td style={{ textAlign: 'end', padding: '3px 0', fontWeight: 'bold' }}>{formatCurrency(sampleProduct.price * 2)}</td>
                </tr>
                <tr>
                  <td style={{ padding: '3px 0' }}>مياه معدنية 500 مل</td>
                  <td style={{ textAlign: 'center', padding: '3px 0' }}>1</td>
                  <td style={{ textAlign: 'end', padding: '3px 0', fontWeight: 'bold' }}>{formatCurrency(3000)}</td>
                </tr>
              </tbody>
            </table>

            {/* Totals */}
            <div style={{ borderTop: '1px dashed #000', paddingTop: '4px', marginBottom: '6px', fontSize: '11px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '13px' }}>
                <span>المجموع النهائي:</span>
                <span>{formatCurrency(sampleProduct.price * 2 + 3000)}</span>
              </div>
            </div>

            {formData.printExchangeRateOnReceipt && settings.exchangeBulletin && (
              <div style={{ fontSize: '9px', border: '1px solid #000', padding: '3px', margin: '6px 0' }}>
                المعادل بالدولار تقريباً: ${( (sampleProduct.price * 2 + 3000) / (settings.exchangeBulletin.usdSellRate || 14800) ).toFixed(2)} USD
              </div>
            )}

            {formData.printBarcodeOnReceipt && (
              <div style={{ margin: '8px 0' }}>
                <div dangerouslySetInnerHTML={{ __html: sampleBarcodeSvg }} style={{ display: 'flex', justifyContent: 'center' }} />
                <div style={{ fontSize: '9px', fontFamily: 'monospace' }}>INV-2026-TEST</div>
              </div>
            )}

            {formData.receiptFooter && (
              <div style={{ fontSize: '9px', borderTop: '1px dashed #000', paddingTop: '6px', color: '#444' }}>
                {formData.receiptFooter}
              </div>
            )}

            {/* Thermal Cutter Clearance Spacer */}
            <div style={{ height: `${formData.receiptBottomCutFeedMm}mm` }} />
          </div>
        </div>
      )}

      {/* 3. Printable Test Label */}
      {activePrintMode === 'label' && (
        <div id="printable-test-label" className="hidden font-sans text-black">
          <div
            style={{
              width: `${selectedPreset.widthMm || 50}mm`,
              minHeight: `${selectedPreset.heightMm || 30}mm`,
              paddingTop: `${formData.labelAlignment.topMarginMm}mm`,
              paddingBottom: `${formData.labelAlignment.bottomMarginMm}mm`,
              paddingRight: `${formData.labelAlignment.rightMarginMm}mm`,
              paddingLeft: `${formData.labelAlignment.leftMarginMm}mm`,
              textAlign: formData.labelAlignment.textAlign,
              margin: '0 auto',
              boxSizing: 'border-box'
            }}
          >
            {formData.labelAlignment.showStoreName && (
              <div style={{ fontSize: '9px', fontWeight: 'bold', borderBottom: '1px dashed #000', paddingBottom: '2px', marginBottom: '3px' }}>
                {settings.storeNameAr}
              </div>
            )}

            {formData.labelAlignment.showProductName && (
              <div style={{ fontSize: '11px', fontWeight: 'bold', margin: '2px 0' }}>
                {sampleProduct.nameAr}
              </div>
            )}

            {formData.labelAlignment.showSku && (
              <div style={{ fontSize: '8px', fontFamily: 'monospace', color: '#333' }}>
                SKU: {sampleProduct.sku || 'N/A'}
              </div>
            )}

            {formData.labelAlignment.showBarcode && (
              <div style={{ margin: '3px 0', display: 'flex', justifyContent: formData.labelAlignment.barcodeAlign === 'right' ? 'flex-end' : formData.labelAlignment.barcodeAlign === 'left' ? 'flex-start' : 'center' }}>
                <div dangerouslySetInnerHTML={{ __html: sampleBarcodeSvg }} />
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed #000', paddingTop: '2px', marginTop: '2px' }}>
              {formData.labelAlignment.showPrice && (
                <div style={{ fontSize: '13px', fontWeight: 'bold' }}>
                  {formatCurrency(sampleProduct.price)}
                </div>
              )}
              {formData.labelAlignment.showDate && (
                <div style={{ fontSize: '7px', color: '#666' }}>
                  {new Date().toLocaleDateString('ar-SY')}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
