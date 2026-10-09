import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Receipt,
  Eye,
  Sliders,
  Printer,
  Sparkles,
  Save,
  RotateCcw,
  CheckCircle2,
  ZoomIn,
  ZoomOut,
  Scissors,
  QrCode,
  Barcode as BarcodeIcon,
  Store,
  DollarSign,
  FileText,
  MessageSquare,
  Building,
  User,
  Clock,
  Layers,
  Check,
  ShieldCheck,
  Tag,
  Info,
  Maximize2,
  Smartphone,
  CheckSquare,
  Square
} from 'lucide-react';
import { PrintPaperSize, ReceiptTemplateStyle, ReceiptFontFamily, StoreSettings } from '../../types';
import { generateBarcodeSvg } from '../../utils/barcodeUtils';
import { soundEffects } from '../../services/audio';
import { StoreLogoUploader } from './StoreLogoUploader';
import { ReceiptLayoutDragDropEditor } from './ReceiptLayoutDragDropEditor';
import QRCode from 'qrcode';

interface ReceiptCustomizerPanelProps {
  onSaved?: () => void;
}

export const ReceiptCustomizerPanel: React.FC<ReceiptCustomizerPanelProps> = ({ onSaved }) => {
  const { settings, updateSettings, notify, formatCurrency, language } = useApp();

  // Local state for all customizable options
  const [formData, setFormData] = useState<StoreSettings>({
    ...settings,
    receiptShowLogo: settings.receiptShowLogo ?? settings.printStoreLogo ?? true,
    receiptShowTaxNumber: settings.receiptShowTaxNumber ?? settings.printTaxDetails ?? true,
    receiptShowCustomerNotes: settings.receiptShowCustomerNotes ?? true,
    receiptShowFooterMessage: settings.receiptShowFooterMessage ?? true,
    receiptSampleCustomerNote: settings.receiptSampleCustomerNote || 'يرجى تغليف الطلب بعناية — تسليم فوري',
    receiptLogoSize: settings.receiptLogoSize || 'md',
    receiptShowStoreNameAr: settings.receiptShowStoreNameAr ?? true,
    receiptShowStoreNameEn: settings.receiptShowStoreNameEn ?? true,
    receiptShowTagline: settings.receiptShowTagline ?? false,
    receiptShowAddress: settings.receiptShowAddress ?? true,
    receiptShowPhone: settings.receiptShowPhone ?? true,
    receiptShowCommercialRecord: settings.receiptShowCommercialRecord ?? true,
    receiptShowCashierName: settings.receiptShowCashierName ?? settings.printCashierDetails ?? true,
    receiptShowCustomerInfo: settings.receiptShowCustomerInfo ?? true,
    receiptShowCustomerPhone: settings.receiptShowCustomerPhone ?? true,
    receiptShowOrderDiningType: settings.receiptShowOrderDiningType ?? true,
    receiptShowItemNotes: settings.receiptShowItemNotes ?? true,
    receiptShowItemSku: settings.receiptShowItemSku ?? false,
    receiptShowItemUnit: settings.receiptShowItemUnit ?? true,
    receiptShowItemCount: settings.receiptShowItemCount ?? true,
    receiptShowSubtotal: settings.receiptShowSubtotal ?? true,
    receiptShowDiscount: settings.receiptShowDiscount ?? true,
    receiptShowTax: settings.receiptShowTax ?? true,
    receiptShowPaymentMethod: settings.receiptShowPaymentMethod ?? true,
    receiptShowPaidAndChange: settings.receiptShowPaidAndChange ?? true,
    receiptShowExchangeRate: settings.receiptShowExchangeRate ?? settings.printExchangeRateOnReceipt ?? true,
    receiptShowPoints: settings.receiptShowPoints ?? true,
    receiptShowBarcode: settings.receiptShowBarcode ?? settings.printBarcodeOnReceipt ?? true,
    receiptShowQrCode: settings.receiptShowQrCode ?? true,
    receiptShowReturnPolicy: settings.receiptShowReturnPolicy ?? true,
    receiptReturnPolicyDays: settings.receiptReturnPolicyDays ?? 3,
    receiptTemplateStyle: settings.receiptTemplateStyle || 'modern',
    receiptFontFamily: settings.receiptFontFamily || 'cairo',
    receiptFontScale: settings.receiptFontScale || 'normal',
    printPaperSize: settings.printPaperSize || '80mm',
    receiptTopMarginMm: settings.receiptTopMarginMm ?? 3,
    receiptBottomMarginMm: settings.receiptBottomMarginMm ?? 4,
    receiptLeftMarginMm: settings.receiptLeftMarginMm ?? 3,
    receiptRightMarginMm: settings.receiptRightMarginMm ?? 3,
    receiptBottomCutFeedMm: settings.receiptBottomCutFeedMm ?? 18,
    receiptHeader: settings.receiptHeader || 'أهلاً بكم في كيان — نسعد بخدمتكم دائماً',
    receiptFooter: settings.receiptFooter || 'شكراً لزيارتكم! يرجى الاحتفاظ بالفاتورة لضمان حق الاسترجاع خلال 3 أيام.'
  });

  // Active section tab in customizer controls
  const [activeControlTab, setActiveControlTab] = useState<'visibility' | 'text_content' | 'style_paper' | 'margins'>('visibility');

  // Preview Scale and Rulers
  const [zoomScale, setZoomScale] = useState<number>(1.0);
  const [showRulers, setShowRulers] = useState<boolean>(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  // Sample items for realistic preview
  const sampleItems = [
    {
      nameAr: 'شاي سيلاني فاخر 250غ',
      wholesaleUnit: 'علبة',
      quantity: 2,
      price: 35000,
      total: 70000,
      note: 'مغلف بأكياس مزدوجة'
    },
    {
      nameAr: 'قهوة عربية بالهيل 500غ',
      wholesaleUnit: 'كيس',
      quantity: 1,
      price: 65000,
      total: 65000,
      note: 'تحميص وسط'
    },
    {
      nameAr: 'مياه معدنية طبيعية 500 مل',
      wholesaleUnit: '',
      quantity: 3,
      price: 3000,
      total: 9000,
      note: ''
    }
  ];

  const subtotal = sampleItems.reduce((acc, it) => acc + it.total, 0);
  const discount = 4000;
  const tax = Math.round((subtotal - discount) * 0.05);
  const total = subtotal - discount + (formData.receiptShowTax ? tax : 0);
  const paidAmount = total + 6000;
  const changeAmount = 6000;

  // Generate Sample QR Code on mount or settings change
  useEffect(() => {
    const payload = JSON.stringify({
      seller: formData.storeNameAr || 'كيان كاشير',
      taxId: formData.taxNumber || 'TX-963-884210',
      time: new Date().toISOString(),
      total: total,
      tax: tax
    });

    QRCode.toDataURL(payload, { width: 140, margin: 1 })
      .then(url => setQrCodeDataUrl(url))
      .catch(() => {});
  }, [formData.storeNameAr, formData.taxNumber, total, tax]);

  // Save handler
  const handleSave = () => {
    updateSettings(formData);
    soundEffects.playSuccess();
    notify('تم حفظ تخصيص الفاتورة', 'تم تحديث مظهر وهوامش وحقول الفاتورة فورياً', 'success');
    if (onSaved) onSaved();
  };

  // Reset to defaults
  const handleResetDefaults = () => {
    setFormData(prev => ({
      ...prev,
      receiptShowLogo: true,
      receiptShowTaxNumber: true,
      receiptShowCustomerNotes: true,
      receiptShowFooterMessage: true,
      receiptSampleCustomerNote: 'يرجى تغليف الطلب بعناية — تسليم فوري',
      receiptLogoSize: 'md',
      receiptShowStoreNameAr: true,
      receiptShowStoreNameEn: true,
      receiptShowTagline: false,
      receiptShowAddress: true,
      receiptShowPhone: true,
      receiptShowCommercialRecord: true,
      receiptShowCashierName: true,
      receiptShowCustomerInfo: true,
      receiptShowCustomerPhone: true,
      receiptShowOrderDiningType: true,
      receiptShowItemNotes: true,
      receiptShowItemSku: false,
      receiptShowItemUnit: true,
      receiptShowItemCount: true,
      receiptShowSubtotal: true,
      receiptShowDiscount: true,
      receiptShowTax: true,
      receiptShowPaymentMethod: true,
      receiptShowPaidAndChange: true,
      receiptShowExchangeRate: true,
      receiptShowPoints: true,
      receiptShowBarcode: true,
      receiptShowQrCode: true,
      receiptShowReturnPolicy: true,
      receiptReturnPolicyDays: 3,
      receiptTemplateStyle: 'modern',
      receiptFontFamily: 'cairo',
      receiptFontScale: 'normal',
      printPaperSize: '80mm',
      receiptTopMarginMm: 3,
      receiptBottomMarginMm: 4,
      receiptLeftMarginMm: 3,
      receiptRightMarginMm: 3,
      receiptBottomCutFeedMm: 18,
      receiptHeader: 'أهلاً بكم في كيان — نسعد بخدمتكم دائماً',
      receiptFooter: 'شكراً لزيارتكم! يرجى الاحتفاظ بالفاتورة لضمان حق الاسترجاع خلال 3 أيام.'
    }));
    soundEffects.playBeep();
    notify('استعادة الإعدادات القياسية', 'تمت استعادة كافة خيارات الفاتورة الافتراضية', 'info');
  };

  // Test Print
  const handleTestPrint = () => {
    soundEffects.playBeep();
    window.print();
  };

  // Paper width in mm for preview
  const paperWidthMm =
    formData.printPaperSize === '58mm' ? 52 :
    formData.printPaperSize === '76mm' ? 70 :
    formData.printPaperSize === 'a4' ? 190 : 76;

  const fontScaleClass =
    formData.receiptFontScale === 'compact' ? 'text-[10px]' :
    formData.receiptFontScale === 'large' ? 'text-[13px]' : 'text-[11.5px]';

  const fontFamilyClass =
    formData.receiptFontFamily === 'cairo' ? 'font-[Cairo,sans-serif]' :
    formData.receiptFontFamily === 'tajawal' ? 'font-[Tajawal,sans-serif]' :
    formData.receiptFontFamily === 'mono' ? 'font-mono' : 'font-sans';

  // Toggle helper
  const toggleField = (key: keyof StoreSettings) => {
    setFormData(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Interactive Drag-and-Drop Receipt Layout Editor (Arrange, Hide & Resize Logo, Headers, Tax, Footer) */}
      <ReceiptLayoutDragDropEditor />

      {/* Top Banner / Actions Bar for Detailed Field & Margin Settings */}
      <div className="material-panel p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-500/20">
            <Receipt className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                لوحة تخصيص شكل الفاتورة والإيصال
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                معاينة فورية حية
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              تحكم بظهور الشعار، الرقم الضريبي، ملاحظات العميل، وتذييل الفاتورة مع معاينة مطابقة 100% للطباعة
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer btn-tactile"
            title="استعادة القيم الافتراضية القياسية"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>استعادة الافتراضي</span>
          </button>

          <button
            type="button"
            onClick={handleTestPrint}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-all cursor-pointer btn-tactile"
            title="طباعة تجريبية فورية"
          >
            <Printer className="w-4 h-4 text-amber-500" />
            <span>طباعة تجريبية</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            id="btn-save-receipt-customizer"
            className="flex items-center gap-2 px-5 py-2 text-xs font-black text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 rounded-xl shadow-md shadow-amber-500/25 transition-all cursor-pointer btn-tactile"
          >
            <Save className="w-4 h-4" />
            <span>حفظ التخصيصات</span>
          </button>
        </div>
      </div>

      {/* Main Dual-Pane Grid: Controls on Left, Sticky Real-Time Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Controls Pane (7 Columns on large screens) */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Controls Navigation Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveControlTab('visibility')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeControlTab === 'visibility'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-amber-500" />
              <span>إظهار وإخفاء الحقول</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveControlTab('text_content')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeControlTab === 'text_content'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-blue-500" />
              <span>نصوص الترويسة والتذييل</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveControlTab('style_paper')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeControlTab === 'style_paper'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              <span>القالب والخط ومقاس الرول</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveControlTab('margins')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeControlTab === 'margins'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Scissors className="w-3.5 h-3.5 text-rose-500" />
              <span>الهوامش ومسافة القص</span>
            </button>
          </div>

          {/* TAB 1: FIELD VISIBILITY TOGGLES */}
          {activeControlTab === 'visibility' && (
            <div className="space-y-4">
              
              {/* PRIMARY 4 REQUESTED FIELDS (Company Logo, Tax ID, Customer Notes, Footer Message) */}
              <div className="p-4 rounded-3xl bg-amber-500/5 dark:bg-amber-500/10 border-2 border-amber-500/30 space-y-3">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-black text-xs">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>الحقول الأساسية المخصصة (Primary Custom Fields):</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* 1. COMPANY LOGO TOGGLE */}
                  <div
                    onClick={() => toggleField('receiptShowLogo')}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      formData.receiptShowLogo
                        ? 'bg-white dark:bg-slate-900 border-amber-500/60 shadow-xs'
                        : 'bg-white/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        formData.receiptShowLogo ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                      }`}>
                        <Store className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-black text-slate-900 dark:text-white">
                          شعار الشركة / المتجر (Company Logo)
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {formData.receiptShowLogo ? 'ظاهر أعلى الفاتورة' : 'مخفي حالياً'}
                        </div>
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                      formData.receiptShowLogo ? 'bg-amber-500 text-slate-950 font-bold' : 'border border-slate-300 dark:border-slate-700'
                    }`}>
                      {formData.receiptShowLogo && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>

                  {/* 2. TAX ID TOGGLE */}
                  <div
                    onClick={() => toggleField('receiptShowTaxNumber')}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      formData.receiptShowTaxNumber
                        ? 'bg-white dark:bg-slate-900 border-amber-500/60 shadow-xs'
                        : 'bg-white/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        formData.receiptShowTaxNumber ? 'bg-blue-500/15 text-blue-700 dark:text-blue-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                      }`}>
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-black text-slate-900 dark:text-white">
                          الرقم الضريبي (Tax ID)
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {formData.receiptShowTaxNumber ? 'معتمد للفواتير الضريبية' : 'مخفي حالياً'}
                        </div>
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                      formData.receiptShowTaxNumber ? 'bg-amber-500 text-slate-950 font-bold' : 'border border-slate-300 dark:border-slate-700'
                    }`}>
                      {formData.receiptShowTaxNumber && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>

                  {/* 3. CUSTOMER NOTES TOGGLE */}
                  <div
                    onClick={() => toggleField('receiptShowCustomerNotes')}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      formData.receiptShowCustomerNotes
                        ? 'bg-white dark:bg-slate-900 border-amber-500/60 shadow-xs'
                        : 'bg-white/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        formData.receiptShowCustomerNotes ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                      }`}>
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-black text-slate-900 dark:text-white">
                          ملاحظات العميل والطلب (Customer Notes)
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {formData.receiptShowCustomerNotes ? 'تظهر بوضوح بالفاتورة' : 'مخفية'}
                        </div>
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                      formData.receiptShowCustomerNotes ? 'bg-amber-500 text-slate-950 font-bold' : 'border border-slate-300 dark:border-slate-700'
                    }`}>
                      {formData.receiptShowCustomerNotes && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>

                  {/* 4. FOOTER MESSAGE TOGGLE */}
                  <div
                    onClick={() => toggleField('receiptShowFooterMessage')}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      formData.receiptShowFooterMessage
                        ? 'bg-white dark:bg-slate-900 border-amber-500/60 shadow-xs'
                        : 'bg-white/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        formData.receiptShowFooterMessage ? 'bg-purple-500/15 text-purple-700 dark:text-purple-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                      }`}>
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-black text-slate-900 dark:text-white">
                          رسالة التذييل (Footer Message)
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {formData.receiptShowFooterMessage ? 'تظهر أسفل الفاتورة' : 'مخفية'}
                        </div>
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                      formData.receiptShowFooterMessage ? 'bg-amber-500 text-slate-950 font-bold' : 'border border-slate-300 dark:border-slate-700'
                    }`}>
                      {formData.receiptShowFooterMessage && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>

                </div>
              </div>

              {/* STORE INFO TOGGLES */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                <h3 className="text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-amber-500" />
                  <span>بيانات المتجر والفرع (Store & Branch Info):</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {[
                    { key: 'receiptShowStoreNameAr', label: 'اسم المتجر بالعربي', desc: formData.storeNameAr },
                    { key: 'receiptShowStoreNameEn', label: 'اسم المتجر بالإنجليزي', desc: formData.storeNameEn },
                    { key: 'receiptShowAddress', label: 'العنوان الجغرافي للمحل', desc: formData.address },
                    { key: 'receiptShowPhone', label: 'رقم هاتف المتجر', desc: formData.phone },
                    { key: 'receiptShowCommercialRecord', label: 'السجل التجاري (CR)', desc: formData.commercialRecord },
                    { key: 'receiptShowTagline', label: 'شعار المتجر اللفظي (Slogan)', desc: formData.tagline }
                  ].map(f => (
                    <label
                      key={f.key}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                    >
                      <div>
                        <div className="font-bold text-slate-900 dark:text-slate-200">{f.label}</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[200px]">{f.desc || 'غير محدد'}</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={Boolean(formData[f.key as keyof StoreSettings])}
                        onChange={() => toggleField(f.key as keyof StoreSettings)}
                        className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* SALES, ITEMS & CUSTOMER TOGGLES */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                <h3 className="text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-500" />
                  <span>تفاصيل المبيعات، العميل والباركود:</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {[
                    { key: 'receiptShowCashierName', label: 'اسم الكاشير والوردية', desc: 'يساعد بمتابعة المبيعات' },
                    { key: 'receiptShowCustomerInfo', label: 'اسم العميل ورقم هاتفه', desc: 'للعملاء المسجلين' },
                    { key: 'receiptShowOrderDiningType', label: 'نوع الطلب (صالة / سفري / جملة)', desc: 'للمطاعم وتجارة الجملة' },
                    { key: 'receiptShowItemNotes', label: 'ملاحظات الصنف الفردية', desc: 'ملاحظات الطبخ أو التجهيز' },
                    { key: 'receiptShowItemUnit', label: 'وحدة القياس (كرتونة / باقة)', desc: 'ضروري لتجارة الجملة' },
                    { key: 'receiptShowItemCount', label: 'إجمالي عدد الأصناف والقطع', desc: 'ملخص سريع لعدد السلع' },
                    { key: 'receiptShowTax', label: 'تفاصيل قيمة الضريبة', desc: 'إظهار نسبة ومبلغ الضريبة' },
                    { key: 'receiptShowPaymentMethod', label: 'طريقة الدفع (نقداً / شبكة / آجل)', desc: 'تحديد نوع السداد' },
                    { key: 'receiptShowPaidAndChange', label: 'المبلغ المدفوع والباقي', desc: 'مبلغ الفكة أو الدين المتبقي' },
                    { key: 'receiptShowExchangeRate', label: 'المعادل بالدولار (نشرة الصرف)', desc: 'حسب نشرة أسعار الصرف الحية' },
                    { key: 'receiptShowPoints', label: 'نقاط الولاء المكتسبة', desc: 'نقاط مكافآت الزبائن' },
                    { key: 'receiptShowBarcode', label: 'باركود استرجاع الفاتورة (1D Code128)', desc: 'لمسح الفاتورة فورياً بجهاز الباركود' },
                    { key: 'receiptShowQrCode', label: 'رمز الاستجابة السريعة (2D QR Code)', desc: 'للتحقق الرقمي والفوترة الإلكترونية' },
                    { key: 'receiptShowReturnPolicy', label: 'سياسة الاسترجاع والاستبدال', desc: `مسموح خلال ${formData.receiptReturnPolicyDays} أيام` }
                  ].map(f => (
                    <label
                      key={f.key}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                    >
                      <div>
                        <div className="font-bold text-slate-900 dark:text-slate-200">{f.label}</div>
                        <div className="text-[10px] text-slate-400">{f.desc}</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={Boolean(formData[f.key as keyof StoreSettings])}
                        onChange={() => toggleField(f.key as keyof StoreSettings)}
                        className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                      />
                    </label>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: TEXT CONTENT EDITING */}
          {activeControlTab === 'text_content' && (
            <div className="space-y-4">
              
              {/* Company Logo Upload & Sizing */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Store className="w-4 h-4 text-amber-500" />
                    <span>شعار الشركة / المتجر (Company Logo)</span>
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 font-bold">الحجم بالفاتورة:</span>
                    {(['sm', 'md', 'lg'] as const).map(sz => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setFormData({ ...formData, receiptLogoSize: sz })}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                          formData.receiptLogoSize === sz
                            ? 'bg-amber-500 text-slate-950 font-black'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {sz === 'sm' ? 'صغير' : sz === 'md' ? 'متوسط' : 'كبير'}
                      </button>
                    ))}
                  </div>
                </div>

                <StoreLogoUploader
                  onLogoUpdated={(newLogo) => setFormData(prev => ({ ...prev, logo: newLogo }))}
                  showReceiptPreview={false}
                />
              </div>

              {/* Tax ID & Commercial Record */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-500" />
                  <span>الرقم الضريبي والسجل التجاري (Tax ID & Commercial Record)</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      الرقم الضريبي (Tax ID / VAT):
                    </label>
                    <input
                      type="text"
                      value={formData.taxNumber}
                      onChange={e => setFormData({ ...formData, taxNumber: e.target.value })}
                      placeholder="e.g. TX-963-884210"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      رقم السجل التجاري (Commercial Record):
                    </label>
                    <input
                      type="text"
                      value={formData.commercialRecord}
                      onChange={e => setFormData({ ...formData, commercialRecord: e.target.value })}
                      placeholder="e.g. CR-104928/DAM"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:border-amber-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Customer Notes Sample & Configuration */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-500" />
                  <span>ملاحظات العميل والطلب (Customer Notes)</span>
                </h3>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    نص ملاحظة العميل التجريبية (Live Preview Sample Note):
                  </label>
                  <input
                    type="text"
                    value={formData.receiptSampleCustomerNote}
                    onChange={e => setFormData({ ...formData, receiptSampleCustomerNote: e.target.value })}
                    placeholder="e.g. يرجى تغليف الطلب بعناية — تسليم فوري"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:border-amber-500 outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    هذا النص يظهر في المعاينة الحية لترى كيف تظهر ملاحظات الزبائن عند إصدار الفاتورة أو طلبات المطبخ
                  </p>
                </div>
              </div>

              {/* Header & Footer Message Inputs */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-500" />
                  <span>رسالة الترويسة والتذييل (Header & Footer Messages)</span>
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      رسالة الترحيب أعلى الفاتورة (Header Welcome Message):
                    </label>
                    <input
                      type="text"
                      value={formData.receiptHeader}
                      onChange={e => setFormData({ ...formData, receiptHeader: e.target.value })}
                      placeholder="e.g. أهلاً بكم في كيان — نسعد بخدمتكم دائماً"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      رسالة التذييل والشكر أسفل الفاتورة (Footer Message):
                    </label>
                    <textarea
                      rows={2}
                      value={formData.receiptFooter}
                      onChange={e => setFormData({ ...formData, receiptFooter: e.target.value })}
                      placeholder="e.g. شكراً لزيارتكم! يرجى الاحتفاظ بالفاتورة لضمان حق الاسترجاع خلال 3 أيام."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        مدة حق الاسترجاع (بالأيام):
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={60}
                        value={formData.receiptReturnPolicyDays}
                        onChange={e => setFormData({ ...formData, receiptReturnPolicyDays: Number(e.target.value) })}
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:border-amber-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: STYLES, PAPER & FONTS */}
          {activeControlTab === 'style_paper' && (
            <div className="space-y-4">
              
              {/* Paper Roll Size Presets */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-amber-500" />
                  <span>مقاس ورق ورول الطباعة (Paper Size Preset):</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: '80mm', title: '80 مم عريض', desc: 'رول كاشير standard', badge: 'الأكثر شيوعاً' },
                    { id: '58mm', title: '58 مم مدمج', desc: 'طابعات بلوتوث متنقلة', badge: 'طابعات جيب' },
                    { id: '76mm', title: '76 مم وسط', desc: 'طابعات مطبخ حرارية', badge: 'مطابخ' },
                    { id: 'a4', title: 'A4 مكتبي', desc: 'فواتير ضريبية كاملة', badge: 'صفحة كاملة' }
                  ].map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, printPaperSize: p.id as PrintPaperSize })}
                      className={`p-3 rounded-2xl border text-start transition-all cursor-pointer ${
                        formData.printPaperSize === p.id
                          ? 'bg-amber-500/10 border-amber-500 text-amber-900 dark:text-amber-200 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black">{p.title}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-white dark:bg-slate-700 font-bold">
                          {p.badge}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">{p.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Template Style Selector */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  <span>طراز وتصميم الفاتورة (Visual Template Style):</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: 'modern', label: 'عصري مريح (Modern)', desc: 'خلفية سوداء للإجمالي وخطوط عصرية' },
                    { id: 'classic', label: 'كلاسيكي تقليدي (Classic)', desc: 'إطارات مزدوجة ونمط الإيصالات الرسمي' },
                    { id: 'thermal_bold', label: 'حراري عالي الوضوح (Bold)', desc: 'خطوط سوداء عريضة للمطابخ' },
                    { id: 'minimal', label: 'بسيط ناعم (Minimal)', desc: 'فواصل ناعمة وهدوء بصري' },
                    { id: 'compact', label: 'مضغوط موفر للورق (Compact)', desc: 'أقل استهلاك لرول الورق' }
                  ].map(tmpl => (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, receiptTemplateStyle: tmpl.id as ReceiptTemplateStyle })}
                      className={`p-3 rounded-2xl border text-start transition-all cursor-pointer ${
                        formData.receiptTemplateStyle === tmpl.id
                          ? 'bg-amber-500/10 border-amber-500 font-black shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <div className="text-xs font-bold text-slate-900 dark:text-white">{tmpl.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{tmpl.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Typography / Font Family */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-500" />
                  <span>نوع وحجم خط الفاتورة (Font Family & Scale):</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'cairo', label: 'خط كايرو (Cairo)', family: 'font-[Cairo,sans-serif]' },
                    { id: 'tajawal', label: 'خط تجوال (Tajawal)', family: 'font-[Tajawal,sans-serif]' },
                    { id: 'sans', label: 'خط النظام (Sans)', family: 'font-sans' },
                    { id: 'mono', label: 'خط رقمي (Monospace)', family: 'font-mono' }
                  ].map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, receiptFontFamily: f.id as ReceiptFontFamily })}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${f.family} ${
                        formData.receiptFontFamily === f.id
                          ? 'bg-amber-500 text-slate-950 border-amber-500 font-black'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="text-xs font-bold">{f.label}</div>
                      <div className="text-[10px] opacity-75 mt-0.5">123456 فواتير</div>
                    </button>
                  ))}
                </div>

                <div className="pt-2">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    مقياس حجم الخط (Font Scale):
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'compact', label: 'صغير 10px', desc: 'موفر للورق' },
                      { id: 'normal', label: 'متوازن 11.5px', desc: 'القياسي الموصى به' },
                      { id: 'large', label: 'بارز 13px', desc: 'واضح ومريح للقراءة' }
                    ].map(fs => (
                      <button
                        key={fs.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, receiptFontScale: fs.id as any })}
                        className={`p-2 rounded-xl border text-center transition-colors cursor-pointer ${
                          formData.receiptFontScale === fs.id
                            ? 'bg-amber-500 text-slate-950 font-bold border-amber-500'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="text-xs font-bold">{fs.label}</div>
                        <div className="text-[9px] text-slate-400">{fs.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: MARGINS & CUT FEED */}
          {activeControlTab === 'margins' && (
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4">
              <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Scissors className="w-4 h-4 text-rose-500" />
                <span>معايرة هوامش الورق الحراري ومسافة تلقيم القاطع (Margins & Cut Feed)</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { key: 'receiptTopMarginMm', label: 'الهامش العلوي', val: formData.receiptTopMarginMm },
                  { key: 'receiptBottomMarginMm', label: 'الهامش السفلي', val: formData.receiptBottomMarginMm },
                  { key: 'receiptRightMarginMm', label: 'الهامش الأيمن', val: formData.receiptRightMarginMm },
                  { key: 'receiptLeftMarginMm', label: 'الهامش الأيسر', val: formData.receiptLeftMarginMm }
                ].map(m => (
                  <div key={m.key} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-center space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">{m.label}</span>
                    <div className="text-base font-black font-mono text-slate-900 dark:text-white">{m.val} mm</div>
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, [m.key]: Math.max(0, (formData[m.key as keyof StoreSettings] as number || 0) - 1) })}
                        className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 border text-xs font-bold hover:bg-slate-100 cursor-pointer"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, [m.key]: Math.min(25, (formData[m.key as keyof StoreSettings] as number || 0) + 1) })}
                        className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 border text-xs font-bold hover:bg-slate-100 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Cut Feed (Distance before cutter blade) */}
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-black text-rose-900 dark:text-rose-200">
                      مسافة تلقيم الورق قبل شفرة القص التلقائي (Cut Clearance Feed):
                    </div>
                    <div className="text-[10px] text-rose-700/80 dark:text-rose-300/80">
                      المسافة الفارغة بعد الفاتورة لمنع سكين القاطع من تمزيق الباركود أو رسالة الشكر
                    </div>
                  </div>
                  <span className="text-xs font-mono font-black px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-700">
                    {formData.receiptBottomCutFeedMm} mm
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-slate-400">5mm</span>
                  <input
                    type="range"
                    min={5}
                    max={40}
                    step={1}
                    value={formData.receiptBottomCutFeedMm}
                    onChange={e => setFormData({ ...formData, receiptBottomCutFeedMm: Number(e.target.value) })}
                    className="flex-1 accent-rose-500 cursor-pointer"
                  />
                  <span className="text-[10px] font-mono text-slate-400">40mm</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Real-Time Live Preview Pane (5 Columns, Sticky on Desktop) */}
        <div className="lg:col-span-5 sticky top-4 space-y-3">
          
          {/* Preview Header & Controls */}
          <div className="bg-slate-900 text-white px-4 py-2.5 rounded-2xl flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-black">المعاينة المباشرة اللحظية</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                {formData.printPaperSize}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowRulers(!showRulers)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                  showRulers ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
                title="إظهار أبعاد الهوامش"
              >
                مسطرة mm
              </button>
              <button
                type="button"
                onClick={() => setZoomScale(z => Math.max(0.7, Number((z - 0.1).toFixed(1))))}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                title="تصغير"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-mono font-bold px-1 text-amber-300">
                {Math.round(zoomScale * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoomScale(z => Math.min(1.3, Number((z + 0.1).toFixed(1))))}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                title="تكبير"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Virtual Receipt Paper Viewport */}
          <div className="p-4 sm:p-6 bg-slate-200/90 dark:bg-slate-950/80 rounded-3xl border border-slate-300 dark:border-slate-800 flex justify-center overflow-x-auto min-h-[500px]">
            
            {/* The Actual Simulated Thermal Paper */}
            <div
              id="printable-receipt-customized"
              className={`receipt-paper-roll receipt-zigzag-top receipt-zigzag-bottom transition-all duration-200 ${fontFamilyClass} ${fontScaleClass} ${
                formData.receiptTemplateStyle === 'thermal_bold' ? 'font-black' : ''
              }`}
              style={{
                width: `${paperWidthMm}mm`,
                maxWidth: '100%',
                paddingTop: `${formData.receiptTopMarginMm}mm`,
                paddingBottom: `${formData.receiptBottomMarginMm}mm`,
                paddingRight: `${formData.receiptRightMarginMm}mm`,
                paddingLeft: `${formData.receiptLeftMarginMm}mm`,
                transform: `scale(${zoomScale})`,
                transformOrigin: 'top center',
                boxSizing: 'border-box'
              }}
            >
              {/* Optional Rulers Overlay */}
              {showRulers && (
                <div className="absolute inset-0 pointer-events-none border border-dashed border-amber-500/50">
                  <span className="absolute top-0.5 right-1 text-[8px] font-mono font-bold text-amber-600 bg-white/90 px-1 rounded">
                    ع:{formData.receiptTopMarginMm}mm
                  </span>
                  <span className="absolute bottom-1 right-1 text-[8px] font-mono font-bold text-amber-600 bg-white/90 px-1 rounded">
                    س:{formData.receiptBottomMarginMm}mm
                  </span>
                </div>
              )}

              {/* 1. STORE BRANDING & COMPANY LOGO */}
              <div className={`pb-2.5 mb-2 text-center ${
                formData.receiptTemplateStyle === 'classic' ? 'border-b-2 border-double border-black' :
                formData.receiptTemplateStyle === 'thermal_bold' ? 'border-b-2 border-black' :
                formData.receiptTemplateStyle === 'minimal' ? 'border-b border-slate-200' :
                'border-b border-dashed border-slate-400'
              }`}>
                
                {/* COMPANY LOGO (Toggled via receiptShowLogo) */}
                {formData.receiptShowLogo && (
                  <div className="flex flex-col items-center justify-center mb-1.5 animate-in fade-in">
                    {formData.logo ? (
                      <img
                        src={formData.logo}
                        alt="شعار الشركة"
                        className={`object-contain mb-1 filter grayscale contrast-125 mx-auto ${
                          formData.receiptLogoSize === 'sm' ? 'max-h-10 max-w-[100px]' :
                          formData.receiptLogoSize === 'lg' ? 'max-h-18 max-w-[160px]' :
                          'max-h-14 max-w-[130px]'
                        }`}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg border border-dashed border-slate-400 flex items-center justify-center text-slate-400 mb-1">
                        <Store className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                )}

                {/* Store Name Ar */}
                {formData.receiptShowStoreNameAr && (
                  <h2 className={`tracking-tight ${
                    formData.receiptTemplateStyle === 'thermal_bold' ? 'text-base sm:text-lg font-black uppercase' :
                    formData.receiptTemplateStyle === 'classic' ? 'text-sm sm:text-base font-bold tracking-wider' :
                    'text-sm sm:text-base font-black'
                  }`}>
                    {formData.storeNameAr || 'كيان كاشير'}
                  </h2>
                )}

                {/* Store Name En */}
                {formData.receiptShowStoreNameEn && formData.storeNameEn && (
                  <p className="text-[9.5px] text-slate-600 font-bold uppercase tracking-wider">{formData.storeNameEn}</p>
                )}

                {/* Tagline */}
                {formData.receiptShowTagline && formData.tagline && (
                  <p className="text-[9px] text-slate-500 italic mt-0.5">{formData.tagline}</p>
                )}

                {/* Address */}
                {formData.receiptShowAddress && formData.address && (
                  <p className="text-[10px] text-slate-700 mt-0.5">{formData.address}</p>
                )}

                {/* Phone */}
                {formData.receiptShowPhone && formData.phone && (
                  <p className="text-[9.5px] text-slate-600 font-mono">هاتف: {formData.phone}</p>
                )}

                {/* 2. TAX ID (Toggled via receiptShowTaxNumber) */}
                {formData.receiptShowTaxNumber && formData.taxNumber && (
                  <p className="text-[9.5px] text-slate-700 font-mono font-bold mt-0.5 animate-in fade-in">
                    الرقم الضريبي: {formData.taxNumber}
                  </p>
                )}

                {/* Commercial Record */}
                {formData.receiptShowCommercialRecord && formData.commercialRecord && (
                  <p className="text-[9px] text-slate-500 font-mono">س.ت: {formData.commercialRecord}</p>
                )}
              </div>

              {/* Welcome Header Message */}
              {formData.receiptHeader && (
                <div className="text-[9.5px] text-slate-600 italic text-center mb-2 border-b border-dashed border-slate-200 pb-1.5">
                  {formData.receiptHeader}
                </div>
              )}

              {/* Invoice Meta */}
              <div className={`text-[10px] space-y-0.5 pb-1.5 mb-1.5 text-start font-mono ${
                formData.receiptTemplateStyle === 'classic' ? 'border-b-2 border-double border-black' :
                formData.receiptTemplateStyle === 'thermal_bold' ? 'border-b-2 border-black font-bold' :
                'border-b border-dashed border-slate-300'
              }`}>
                <div className="flex justify-between">
                  <span>رقم الفاتورة:</span>
                  <span className="font-bold">INV-2026-9042</span>
                </div>
                <div className="flex justify-between">
                  <span>التاريخ والوقت:</span>
                  <span>{new Date().toLocaleString(language === 'ar' ? 'ar-SY' : 'en-US')}</span>
                </div>

                {formData.receiptShowCashierName && (
                  <div className="flex justify-between">
                    <span>الكاشير:</span>
                    <span className="font-semibold">أحمد الشامي (الوردية 1)</span>
                  </div>
                )}

                {formData.receiptShowOrderDiningType && (
                  <div className="flex justify-between font-bold text-amber-900 bg-amber-50 px-1 py-0.5 rounded">
                    <span>نوع المعاملة:</span>
                    <span>مبيعات تجزئة / طلب فوري</span>
                  </div>
                )}

                {formData.receiptShowCustomerInfo && (
                  <div className="flex justify-between font-bold">
                    <span>العميل:</span>
                    <span>محمد العلي (CUST-089)</span>
                  </div>
                )}
              </div>

              {/* 3. CUSTOMER NOTES (Toggled via receiptShowCustomerNotes) */}
              {formData.receiptShowCustomerNotes && formData.receiptSampleCustomerNote && (
                <div className="my-1.5 p-1.5 bg-amber-50/80 border border-dashed border-amber-300 rounded text-start text-[9.5px] animate-in fade-in">
                  <div className="font-bold text-amber-900">ملاحظات العميل / الطلب:</div>
                  <div className="text-slate-700 italic">{formData.receiptSampleCustomerNote}</div>
                </div>
              )}

              {/* Items Table */}
              <table className="w-full text-[10px] my-1 text-start border-collapse">
                <thead>
                  <tr className={`${
                    formData.receiptTemplateStyle === 'classic' ? 'border-b-2 border-t-2 border-black text-black' :
                    formData.receiptTemplateStyle === 'thermal_bold' ? 'border-b-2 border-black text-black font-black bg-slate-100' :
                    'border-b border-black text-black font-bold'
                  }`}>
                    <th className="py-1 text-start">الصنف</th>
                    <th className="py-1 text-center">الكمية</th>
                    <th className="py-1 text-end">السعر</th>
                    <th className="py-1 text-end">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${
                  formData.receiptTemplateStyle === 'thermal_bold' ? 'divide-black' : 'divide-dashed divide-slate-200'
                }`}>
                  {sampleItems.map((it, idx) => (
                    <tr key={idx} className="py-0.5">
                      <td className="py-0.5 text-start font-medium font-sans">
                        <div>{it.nameAr}</div>
                        {formData.receiptShowItemUnit && it.wholesaleUnit && (
                          <span className="text-[8.5px] text-amber-700 font-bold">({it.wholesaleUnit})</span>
                        )}
                        {formData.receiptShowItemNotes && it.note && (
                          <div className="text-[8.5px] text-slate-500 italic">ملاحظة: {it.note}</div>
                        )}
                      </td>
                      <td className="py-0.5 text-center font-mono">{it.quantity}</td>
                      <td className="py-0.5 text-end font-mono">{it.price.toLocaleString()}</td>
                      <td className="py-0.5 text-end font-bold font-mono">{it.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Items Count */}
              {formData.receiptShowItemCount && (
                <div className="flex justify-between text-[9px] text-slate-500 border-t border-dashed border-slate-200 py-1 font-mono">
                  <span>عدد الأصناف: 3</span>
                  <span>إجمالي القطع: 6</span>
                </div>
              )}

              {/* Totals Section */}
              <div className={`border-t pt-1.5 text-[10px] space-y-0.5 font-mono ${
                formData.receiptTemplateStyle === 'classic' ? 'border-double border-t-2 border-black' :
                formData.receiptTemplateStyle === 'thermal_bold' ? 'border-black border-t-2 font-bold' :
                'border-dashed border-black'
              }`}>
                {formData.receiptShowSubtotal && (
                  <div className="flex justify-between text-slate-700">
                    <span className="font-sans">المجموع الفرعي:</span>
                    <span>{subtotal.toLocaleString()} {settings.currency.symbol}</span>
                  </div>
                )}

                {formData.receiptShowDiscount && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span className="font-sans">الخصم الممنوح:</span>
                    <span>-{discount.toLocaleString()} {settings.currency.symbol}</span>
                  </div>
                )}

                {formData.receiptShowTax && (
                  <div className="flex justify-between text-slate-700">
                    <span className="font-sans">الضريبة (5%):</span>
                    <span>+{tax.toLocaleString()} {settings.currency.symbol}</span>
                  </div>
                )}

                {/* Final Total Box */}
                <div className={`flex justify-between py-1 my-1 ${
                  formData.receiptTemplateStyle === 'modern' ? 'bg-slate-900 text-white px-2 rounded-lg font-black text-xs sm:text-sm' :
                  formData.receiptTemplateStyle === 'classic' ? 'border-y-2 border-double border-black font-black text-xs sm:text-sm' :
                  formData.receiptTemplateStyle === 'thermal_bold' ? 'border-y-2 border-black font-black text-sm' :
                  'border-y border-black font-black text-xs sm:text-sm'
                }`}>
                  <span className="font-sans">الإجمالي النهائي:</span>
                  <span>{total.toLocaleString()} {settings.currency.symbol}</span>
                </div>

                {/* USD Bulletin Equiv */}
                {formData.receiptShowExchangeRate && (
                  <div className="flex justify-between text-[9px] bg-slate-100 px-1 py-0.5 rounded border border-slate-200">
                    <span className="font-sans">المعادل بالدولار تقريباً:</span>
                    <span className="font-bold font-mono">${(total / 14950).toFixed(2)} USD</span>
                  </div>
                )}

                {/* Payment Method */}
                {formData.receiptShowPaymentMethod && (
                  <div className="flex justify-between text-slate-800">
                    <span className="font-sans">طريقة الدفع:</span>
                    <span className="font-bold font-sans">نقداً (Cash)</span>
                  </div>
                )}

                {/* Paid & Change */}
                {formData.receiptShowPaidAndChange && (
                  <>
                    <div className="flex justify-between text-slate-800">
                      <span className="font-sans">المبلغ المدفوع:</span>
                      <span>{paidAmount.toLocaleString()} {settings.currency.symbol}</span>
                    </div>
                    <div className="flex justify-between font-bold text-emerald-800 bg-emerald-50 px-1 py-0.5 rounded">
                      <span className="font-sans">المبلغ الباقي (الفكة):</span>
                      <span>{changeAmount.toLocaleString()} {settings.currency.symbol}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Customer Points */}
              {formData.receiptShowPoints && (
                <div className="my-1.5 p-1 bg-slate-50 border border-slate-200 rounded text-[9px] flex justify-between font-bold text-amber-700">
                  <span>النقاط المكتسبة من الفاتورة:</span>
                  <span>+14 نقطة</span>
                </div>
              )}

              {/* 1D Barcode */}
              {formData.receiptShowBarcode && (
                <div className="my-2 flex flex-col items-center justify-center animate-in fade-in">
                  <div
                    className="max-w-full overflow-hidden flex justify-center"
                    dangerouslySetInnerHTML={{
                      __html: generateBarcodeSvg('INV-2026-9042', {
                        width: Math.min(240, paperWidthMm * 3.2),
                        height: 40,
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
              {formData.receiptShowQrCode && qrCodeDataUrl && (
                <div className="my-1.5 flex flex-col items-center justify-center animate-in fade-in">
                  <img src={qrCodeDataUrl} alt="QR Code" className="w-16 h-16" />
                  <span className="text-[7.5px] text-slate-400 font-mono mt-0.5">مسح للتحقق الرقمي من الفاتورة</span>
                </div>
              )}

              {/* Return Policy */}
              {formData.receiptShowReturnPolicy && (
                <div className="text-[8.5px] text-slate-600 border-t border-dashed border-slate-300 pt-1 my-1 text-center">
                  البضاعة المباعة ترد وتستبدل خلال {formData.receiptReturnPolicyDays} أيام بإحضار أصل الفاتورة
                </div>
              )}

              {/* 4. FOOTER MESSAGE (Toggled via receiptShowFooterMessage) */}
              {formData.receiptShowFooterMessage && formData.receiptFooter && (
                <div className="border-t border-dashed border-slate-300 pt-1.5 text-[9px] text-slate-500 text-center animate-in fade-in">
                  <p>{formData.receiptFooter}</p>
                  <p className="font-bold mt-0.5 text-[8px]">نظام كيان كاشير لإدارة نقاط البيع والمستودعات</p>
                </div>
              )}

              {/* Visual Cutter Blade Line */}
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
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-rose-50 text-rose-600 px-2 py-0.2 rounded-full text-[8px] font-black flex items-center gap-1 border border-rose-300 shadow-2xs whitespace-nowrap">
                    <Scissors className="w-2.5 h-2.5" />
                    <span>موضع سكين القاطع ({formData.receiptBottomCutFeedMm}mm)</span>
                  </span>
                </div>
              </div>

            </div>
          </div>

          <div className="text-center text-[10px] text-slate-400 flex items-center justify-center gap-1">
            <Info className="w-3.5 h-3.5 text-amber-500" />
            <span>المعاينة أعلاه حية ومطابقة تماماً لما سيتم إرساله لرأس الطابعة الحرارية</span>
          </div>

        </div>

      </div>
    </div>
  );
};
