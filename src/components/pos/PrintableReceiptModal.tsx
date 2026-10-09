import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Sale } from '../../types';
import QRCode from 'qrcode';
import { Printer, CheckCircle, X, Barcode as BarcodeIcon, ZoomIn, ZoomOut, Sliders, Scissors, Bluetooth, RefreshCw, Palette } from 'lucide-react';
import { generateBarcodeSvg } from '../../utils/barcodeUtils';
import { soundEffects } from '../../services/audio';
import { DraggableModalWrapper } from '../common/DraggableModalWrapper';
import { bluetoothPrinter, BluetoothPrinterStatus } from '../../services/bluetoothPrinter';
import { BluetoothPrinterModal } from './BluetoothPrinterModal';
import { ReceiptCustomizerModal } from '../modals/ReceiptCustomizerModal';
import {
  normalizeReceiptLayoutBlocks,
  getReceiptSectionComputedStyle,
} from '../../utils/receiptLayoutUtils';

interface PrintableReceiptModalProps {
  isOpen?: boolean;
  onClose: () => void;
  sale: Sale | null;
}

export const PrintableReceiptModal: React.FC<PrintableReceiptModalProps> = ({
  isOpen = true,
  onClose,
  sale
}) => {
  const { settings, formatCurrency, t, language, notify } = useApp();
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [zoomScale, setZoomScale] = useState<number>(1.0);
  const [btStatus, setBtStatus] = useState<BluetoothPrinterStatus>(bluetoothPrinter.getStatus());
  const [isBtPrinting, setIsBtPrinting] = useState<boolean>(false);
  const [btProgress, setBtProgress] = useState<number>(0);
  const [isBtModalOpen, setIsBtModalOpen] = useState<boolean>(false);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState<boolean>(false);

  useEffect(() => {
    const unsub = bluetoothPrinter.subscribe(status => {
      setBtStatus(status);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (sale) {
      // Standard POS QR Data containing store, invoice #, timestamp, total, and tax
      const qrPayload = JSON.stringify({
        store: settings.storeNameAr,
        inv: sale.invoiceNumber,
        date: sale.createdAt,
        total: sale.total,
        tax: sale.taxTotal,
        cashier: sale.cashierName,
      });

      QRCode.toDataURL(qrPayload, { width: 140, margin: 1 })
        .then(url => setQrCodeDataUrl(url))
        .catch(() => {});
    }
  }, [sale, settings]);

  // Keyboard shortcut listener for Enter / Ctrl+P to trigger immediate printing
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
        handlePrint();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen || !sale) return null;

  const handlePrint = () => {
    if (settings.soundOnPrint) soundEffects.playBeep();
    window.print();
  };

  const handleBluetoothPrint = async () => {
    if (!btStatus.isConnected) {
      // Prompt user to connect or open bluetooth modal
      const connected = await bluetoothPrinter.connect();
      if (!connected) {
        setIsBtModalOpen(true);
        return;
      }
    }

    try {
      setIsBtPrinting(true);
      setBtProgress(15);
      soundEffects.playBeep();

      const success = await bluetoothPrinter.printSaleReceipt(
        sale,
        settings,
        paperSize === '58mm' ? '58mm' : '80mm',
        (percent) => setBtProgress(percent)
      );

      if (success) {
        soundEffects.playSuccess();
        notify('تمت الطباعة عبر البلوتوث', `تم إرسال الفاتورة #${sale.invoiceNumber} لطابعة البلوتوث بنجاح`, 'success');
      }
    } catch (err: any) {
      soundEffects.playWarning();
      notify('خطأ بالطباعة اللاسلكية', err.message || 'تعذر إرسال الفاتورة للطابعة', 'error');
    } finally {
      setIsBtPrinting(false);
      setBtProgress(0);
    }
  };

  // Resolved Margins & Font Sizing
  const topMargin = settings.receiptTopMarginMm ?? 3;
  const bottomMargin = settings.receiptBottomMarginMm ?? 4;
  const rightMargin = settings.receiptRightMarginMm ?? 3;
  const leftMargin = settings.receiptLeftMarginMm ?? 3;
  const bottomCutFeed = settings.receiptBottomCutFeedMm ?? 18;
  const paperSize = settings.printPaperSize || '80mm';
  const paperWidthMm = paperSize === '58mm' ? 52 : 76;
  const fontScale = settings.receiptFontScale || 'normal';
  const fontSizeClass = fontScale === 'compact' ? 'text-[10px]' : fontScale === 'large' ? 'text-[13px]' : 'text-[11.5px]';

  // Derived template styles & custom visibility toggles
  const templateStyle = settings.receiptTemplateStyle || 'modern';
  const fontFamilyClass = 
    settings.receiptFontFamily === 'cairo' ? 'font-[Cairo,sans-serif]' :
    settings.receiptFontFamily === 'tajawal' ? 'font-[Tajawal,sans-serif]' :
    settings.receiptFontFamily === 'mono' ? 'font-mono' : 'font-sans';

  const showLogo = settings.receiptShowLogo ?? settings.printStoreLogo ?? true;
  const showTax = settings.receiptShowTaxNumber ?? settings.printTaxDetails ?? true;
  const showCashier = settings.receiptShowCashierName ?? settings.printCashierDetails ?? true;
  const showCustomer = settings.receiptShowCustomerInfo ?? true;
  const showCustomerNotes = settings.receiptShowCustomerNotes ?? true;
  const showFooterMessage = settings.receiptShowFooterMessage ?? true;
  const showBarcode = settings.receiptShowBarcode ?? settings.printBarcodeOnReceipt ?? true;
  const showQr = settings.receiptShowQrCode ?? true;
  const showItemCount = settings.receiptShowItemCount ?? true;
  const showReturnPolicy = settings.receiptShowReturnPolicy ?? true;
  const returnPolicyDays = settings.receiptReturnPolicyDays ?? 3;

  const totalQuantity = sale.items.reduce((acc, it) => acc + (it.quantity || 0), 0);
  const layoutBlocks = normalizeReceiptLayoutBlocks(settings);
  const saleDiscount = sale.discountTotal ?? sale.discount ?? 0;
  const saleTax = sale.taxTotal ?? sale.tax ?? 0;

  return (
    <>
    <DraggableModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="معاينة الفاتورة قبل الطباعة"
      subtitle={`رقم: ${sale.invoiceNumber} • ${paperSize}`}
      icon={<CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />}
      maxWidth="max-w-lg"
      className="max-h-[92vh] flex flex-col"
      headerExtra={
        <div className="flex items-center gap-1.5">
          {/* Quick Receipt Customizer Button */}
          <button
            type="button"
            onClick={() => setIsCustomizerOpen(true)}
            data-longpress-title="تخصيص شكل وحقول الفاتورة"
            data-longpress-desc="تعديل الشعار، الرقم الضريبي، ملاحظات العميل، ورسالة التذييل فورياً."
            className="flex items-center gap-1 px-2.5 py-2 font-bold text-xs rounded-xl bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-300/80 dark:border-amber-700/80 transition-all cursor-pointer active:scale-95 shadow-2xs"
            title="تخصيص حقول وشكل الفاتورة"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="hidden sm:inline">تخصيص الفاتورة</span>
          </button>

          {/* Zoom Controls */}
          <div className="hidden sm:flex items-center gap-1 bg-white dark:bg-slate-700 p-1 rounded-xl border border-slate-200 dark:border-slate-600">
            <button
              type="button"
              onClick={() => setZoomScale(z => Math.max(0.8, Number((z - 0.1).toFixed(1))))}
              data-longpress-title="تصغير المعاينة"
              data-longpress-desc="تقليل مقياس عرض الفاتورة على الشاشة لمشاهدة التفاصيل بالكامل."
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg text-slate-500 dark:text-slate-300 cursor-pointer"
              title="تصغير المعاينة"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono font-bold px-1 text-slate-700 dark:text-slate-200">
              {Math.round(zoomScale * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoomScale(z => Math.min(1.4, Number((z + 0.1).toFixed(1))))}
              data-longpress-title="تكبير المعاينة"
              data-longpress-desc="تكبير مقياس الفاتورة لفحص النصوص والأسعار بوضوح."
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg text-slate-500 dark:text-slate-300 cursor-pointer"
              title="تكبير المعاينة"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Bluetooth ESC/POS Direct Print Button */}
          <button
            type="button"
            onClick={handleBluetoothPrint}
            disabled={isBtPrinting}
            data-longpress-title="طباعة حرارية عبر البلوتوث (ESC/POS)"
            data-longpress-desc="إرسال الفاتورة لاسلكياً ومباشرة إلى طابعة الإيصالات الحرارية المتصلة عبر البلوتوث."
            className={`flex items-center gap-1.5 px-3 py-2 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 ${
              btStatus.isConnected
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                : 'bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
            }`}
            title="طباعة عبر طابعة البلوتوث الحرارية"
          >
            {isBtPrinting ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Bluetooth className={`w-3.5 h-3.5 ${btStatus.isConnected ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`} />
            )}
            <span className="hidden sm:inline">
              {isBtPrinting 
                ? `جاري الإرسال (${btProgress}%)...` 
                : btStatus.isConnected 
                  ? `بلوتوث (${btStatus.deviceName?.slice(0, 10) || 'متصل'})` 
                  : 'بلوتوث ESC/POS'
              }
            </span>
          </button>

          <button
            onClick={handlePrint}
            id="btn-print-receipt-confirm"
            data-longpress-title="طباعة الفاتورة (Enter)"
            data-longpress-desc="إرسال الفاتورة الحالية إلى الطابعة الحرارية مباشرة أو حفظها كـ PDF."
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-md shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة (Enter)</span>
          </button>
        </div>
      }
    >
      <div className="flex flex-col flex-1 overflow-hidden">

        {/* Live Calibration Info Strip (no-print) */}
        <div className="bg-amber-50/70 dark:bg-amber-950/30 px-4 py-1.5 border-b border-amber-200/50 dark:border-amber-900/30 flex items-center justify-between text-[10px] text-amber-900 dark:text-amber-200 no-print">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="font-bold flex items-center gap-1">
              <Sliders className="w-3 h-3 text-amber-600" />
              الهوامش المطبقة:
            </span>
            <span className="bg-white/80 dark:bg-slate-800/80 px-1.5 py-0.5 rounded border border-amber-200/60 font-mono">
              ع:{topMargin}mm | س:{bottomMargin}mm | ي:{rightMargin}mm | ي:{leftMargin}mm
            </span>
            <span className="bg-white/80 dark:bg-slate-800/80 px-1.5 py-0.5 rounded border border-amber-200/60 font-mono text-emerald-700 dark:text-emerald-300 font-bold">
              تلقيم القص: {bottomCutFeed}mm
            </span>
          </div>
          <span className="text-[9px] text-amber-700/80 dark:text-amber-300/80 font-medium hidden sm:inline">
            جاهز للطابعات الحرارية
          </span>
        </div>

        {/* Printable Receipt Scrollable Canvas */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-100/80 dark:bg-slate-950/60 flex justify-center">
          <div
            id="printable-receipt"
            className={`bg-white text-black shadow-md text-center transition-transform origin-top select-none print:shadow-none print:transform-none ${fontFamilyClass} ${fontSizeClass} ${
              templateStyle === 'thermal_bold' ? 'font-black' : ''
            }`}
            style={{
              width: `${paperWidthMm}mm`,
              maxWidth: '100%',
              margin: '0 auto',
              paddingTop: `${topMargin}mm`,
              paddingBottom: `${bottomMargin}mm`,
              paddingRight: `${rightMargin}mm`,
              paddingLeft: `${leftMargin}mm`,
              transform: `scale(${zoomScale})`,
              boxSizing: 'border-box'
            }}
          >
            {/* Dynamically Ordered, Hideable & Resizable Receipt Sections */}
            {layoutBlocks.map((block) => {
              if (!block.visible) return null;
              const computed = getReceiptSectionComputedStyle(block);
              const dividerStyleClass = block.showDividerBelow
                ? templateStyle === 'classic'
                  ? 'border-b-2 border-double border-black'
                  : templateStyle === 'thermal_bold'
                  ? 'border-b-2 border-black'
                  : templateStyle === 'minimal'
                  ? 'border-b border-slate-300'
                  : 'border-b border-dashed border-slate-300'
                : '';

              return (
                <div
                  key={block.id}
                  style={{
                    fontSize: computed.fontSizeEm,
                    paddingTop: computed.paddingYRem,
                    paddingBottom: computed.paddingYRem,
                    textAlign: computed.textAlign,
                  }}
                  className={`${
                    block.boxed ? 'border-2 border-black rounded-lg p-2 my-1.5 bg-slate-50/60' : ''
                  } ${dividerStyleClass}`}
                >
                  {/* 1. LOGO SECTION */}
                  {block.id === 'logo' && showLogo && (
                    <div className={`flex flex-col ${computed.flexAlign}`}>
                      {settings.logo ? (
                        <img
                          src={settings.logo}
                          alt={settings.storeNameAr || 'شعار المتجر'}
                          style={{ height: `${computed.logoHeightPx}px` }}
                          className="w-auto max-w-[180px] object-contain filter grayscale contrast-125 print:filter-none"
                        />
                      ) : (
                        <div
                          style={{
                            height: `${computed.logoHeightPx}px`,
                            width: `${computed.logoHeightPx}px`,
                          }}
                          className="rounded-xl border-2 border-black bg-slate-100 flex flex-col items-center justify-center text-black font-black"
                        >
                          <span className="text-xs font-mono">LOGO</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 2. HEADERS SECTION */}
                  {block.id === 'header' && (
                    <div className={`flex flex-col ${computed.flexAlign} space-y-0.5`}>
                      {(settings.receiptShowStoreNameAr ?? true) && (
                        <h2
                          className={`tracking-tight text-[1.35em] leading-tight ${
                            templateStyle === 'thermal_bold'
                              ? 'font-black uppercase'
                              : templateStyle === 'classic'
                              ? 'font-bold tracking-wider'
                              : 'font-black'
                          }`}
                        >
                          {settings.storeNameAr || 'كاشير كيان'}
                        </h2>
                      )}
                      {(settings.receiptShowStoreNameEn ?? true) && settings.storeNameEn && (
                        <p className="text-[0.82em] text-slate-600 font-bold uppercase tracking-wider">
                          {settings.storeNameEn}
                        </p>
                      )}
                      {settings.receiptHeaderTitle && (
                        <div className="my-0.5 inline-block px-2.5 py-0.5 rounded bg-black text-white font-bold text-[0.85em]">
                          {settings.receiptHeaderTitle}
                        </div>
                      )}
                      {settings.receiptHeader && (
                        <div className="text-[0.88em] text-slate-700 font-bold pt-0.5">
                          {settings.receiptHeader}
                        </div>
                      )}
                      {(settings.receiptShowAddress ?? true) && settings.address && (
                        <p className="text-[0.85em] text-slate-700 mt-0.5">{settings.address}</p>
                      )}
                      {(settings.receiptShowPhone ?? true) && settings.phone && (
                        <p className="text-[0.82em] text-slate-600 font-mono">هاتف: {settings.phone}</p>
                      )}
                    </div>
                  )}

                  {/* 3. QUEUE BADGE SECTION */}
                  {block.id === 'queue_badge' &&
                    (sale.queueNumber || sale.businessMode === 'restaurant') && (
                      <div className="my-1 p-2 border-2 border-black rounded-xl bg-slate-100 text-center">
                        <div className="text-[0.82em] font-black uppercase tracking-wider text-slate-700">
                          رقم الطابور / الدور (QUEUE NO)
                        </div>
                        <div className="text-[2.2em] font-mono font-black tracking-tight text-black leading-none my-1">
                          #
                          {String(
                            sale.queueNumber ||
                              Number((sale.invoiceNumber.match(/Q-(\d+)/i) || [])[1]) ||
                              1
                          ).padStart(3, '0')}
                        </div>
                        <div className="text-[0.85em] font-bold text-slate-800">
                          {sale.diningType === 'dine_in'
                            ? `صالة داخلية • ${sale.tableName || 'طاولة'}`
                            : sale.diningType === 'takeaway'
                            ? 'طلب سفري (Takeaway)'
                            : sale.diningType === 'delivery'
                            ? 'طلب توصيل (Delivery)'
                            : 'طلب مطعم مرقم'}
                        </div>
                      </div>
                    )}

                  {/* 4. INVOICE META INFO SECTION */}
                  {block.id === 'meta_info' && (
                    <div className="text-[0.92em] text-slate-700 text-start space-y-0.5">
                      <div className="flex justify-between">
                        <span>رقم الفاتورة:</span>
                        <span className="font-mono font-bold">{sale.invoiceNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>التاريخ والوقت:</span>
                        <span className="font-mono">
                          {new Date(sale.createdAt).toLocaleString(
                            language === 'ar' ? 'ar-SY' : 'en-US'
                          )}
                        </span>
                      </div>
                      {showCashier && (
                        <div className="flex justify-between">
                          <span>الكاشير:</span>
                          <span className="font-semibold">{sale.cashierName}</span>
                        </div>
                      )}
                      {sale.businessMode === 'restaurant' && (
                        <div className="flex justify-between font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
                          <span>نوع الطلب:</span>
                          <span>
                            {sale.diningType === 'dine_in'
                              ? `صالة (${sale.tableName || 'طاولة'} - ${sale.guestCount || 1} ضيوف)`
                              : sale.diningType === 'takeaway'
                              ? 'سفري / معلب'
                              : 'توصيل دليفري'}
                          </span>
                        </div>
                      )}
                      {sale.tradeType === 'wholesale' && (
                        <div className="flex justify-between font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded">
                          <span>نوع المعاملة:</span>
                          <span>فاتورة جملة / موزع</span>
                        </div>
                      )}
                      {showCustomer && sale.customerName && (
                        <div className="flex justify-between">
                          <span>العميل:</span>
                          <span className="font-bold">
                            {sale.customerName} {sale.customerCode ? `(${sale.customerCode})` : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 5. ITEMS TABLE SECTION */}
                  {block.id === 'items_table' && (
                    <div>
                      <table className="w-full text-[0.92em] my-1 text-start border-collapse">
                        <thead>
                          <tr
                            className={
                              templateStyle === 'classic'
                                ? 'border-b-2 border-t-2 border-black text-black'
                                : templateStyle === 'thermal_bold'
                                ? 'border-b-2 border-black text-black font-black bg-slate-100'
                                : 'border-b border-black text-black'
                            }
                          >
                            <th className="py-1 text-start">الصنف</th>
                            <th className="py-1 text-center">الكمية</th>
                            <th className="py-1 text-end">السعر</th>
                            <th className="py-1 text-end">الإجمالي</th>
                          </tr>
                        </thead>
                        <tbody
                          className={`divide-y ${
                            templateStyle === 'thermal_bold'
                              ? 'divide-black'
                              : 'divide-dashed divide-slate-200'
                          }`}
                        >
                          {sale.items.map((it, idx) => (
                            <tr key={idx} className="py-1">
                              <td className="py-1 font-medium text-start">
                                <div>{it.productNameAr || it.product?.nameAr || 'منتج'}</div>
                                {it.wholesaleUnit && (
                                  <div className="text-[0.82em] text-amber-700 font-bold">
                                    ({it.wholesaleUnit})
                                  </div>
                                )}
                                {showCustomerNotes && it.kitchenNotes && (
                                  <div className="text-[0.82em] text-slate-500 italic font-mono">
                                    ملاحظة: {it.kitchenNotes}
                                  </div>
                                )}
                              </td>
                              <td className="py-1 text-center font-mono">{it.quantity}</td>
                              <td className="py-1 text-end font-mono">
                                {(it.unitPrice || 0).toLocaleString()}
                              </td>
                              <td className="py-1 text-end font-bold font-mono">
                                {(it.total || 0).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {showItemCount && (
                        <div className="flex justify-between text-[0.82em] text-slate-500 border-t border-dashed border-slate-200 py-1 font-mono">
                          <span>عدد الأصناف: {sale.items.length}</span>
                          <span>إجمالي القطع: {totalQuantity}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 6. TOTALS & PAYMENT SECTION */}
                  {block.id === 'totals' && (
                    <div className="text-[0.92em] space-y-1">
                      <div className="flex justify-between text-slate-700">
                        <span>المجموع الفرعي:</span>
                        <span className="font-mono">
                          {(sale.subtotal || 0).toLocaleString()} {settings.currency.symbol}
                        </span>
                      </div>

                      {saleDiscount > 0 && (
                        <div className="flex justify-between text-emerald-700 font-semibold">
                          <span>الخصم الممنوح:</span>
                          <span className="font-mono">
                            -{saleDiscount.toLocaleString()} {settings.currency.symbol}
                          </span>
                        </div>
                      )}

                      <div
                        className={`flex justify-between py-1.5 my-1 ${
                          templateStyle === 'modern'
                            ? 'bg-slate-900 text-white px-2 rounded-lg font-black text-[1.15em]'
                            : 'border-t-2 border-b-2 border-black font-black text-[1.15em]'
                        }`}
                      >
                        <span>الإجمالي النهائي:</span>
                        <span className="font-mono">
                          {(sale.total || 0).toLocaleString()} {settings.currency.symbol}
                        </span>
                      </div>

                      {settings.printExchangeRateOnReceipt && settings.exchangeBulletin && (
                        <div className="flex justify-between text-[0.85em] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300 font-mono">
                          <span>
                            {settings.currency.code === 'USD'
                              ? settings.exchangeBulletin.sourceLabel?.includes('لبنان')
                                ? 'المعادل بالليرة اللبنانية:'
                                : 'المعادل بالليرة السورية:'
                              : 'المعادل بالدولار تقريباً:'}
                          </span>
                          <span>
                            {settings.currency.code === 'USD'
                              ? `${Math.round(
                                  sale.total * (settings.exchangeBulletin.usdSellRate || 89500)
                                ).toLocaleString()} ${
                                  settings.exchangeBulletin.sourceLabel?.includes('لبنان')
                                    ? 'ل.ل'
                                    : 'ل.س'
                                }`
                              : `$${(
                                  sale.total /
                                  (settings.exchangeBulletin.usdSellRate ||
                                    (settings.currency.code === 'LBP' ? 89500 : 14800))
                                ).toFixed(2)} USD`}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between text-slate-800">
                        <span>طريقة الدفع:</span>
                        <span className="font-bold">
                          {sale.paymentMethod === 'cash' || sale.paymentMethod === 'نقداً'
                            ? 'نقداً (Cash)'
                            : sale.paymentMethod === 'card'
                            ? 'بطاقة بنكية (Card)'
                            : sale.paymentMethod === 'transfer'
                            ? 'تحويل إلكتروني (Transfer)'
                            : sale.paymentMethod === 'credit' || sale.paymentMethod === 'آجل'
                            ? 'آجل على الحساب (Credit/Debt)'
                            : sale.paymentMethod}
                        </span>
                      </div>

                      <div className="flex justify-between text-slate-800">
                        <span>المبلغ المدفوع / المستلم:</span>
                        <span className="font-mono font-bold">
                          {(sale.paidAmount || 0).toLocaleString()} {settings.currency.symbol}
                        </span>
                      </div>

                      {(sale.changeAmount || 0) > 0 ? (
                        <div className="flex justify-between font-black text-emerald-800 bg-emerald-50 px-1 py-0.5 rounded">
                          <span>المبلغ الباقي للزبون (الفكة):</span>
                          <span className="font-mono">
                            {(sale.changeAmount || 0).toLocaleString()} {settings.currency.symbol}
                          </span>
                        </div>
                      ) : (sale.paymentMethod === 'credit' || sale.paymentMethod === 'آجل') &&
                        sale.total - (sale.paidAmount || 0) > 0 ? (
                        <div className="flex justify-between font-black text-indigo-900 bg-indigo-50 px-1 py-0.5 rounded">
                          <span>المتبقي كدين آجل على الحساب:</span>
                          <span className="font-mono">
                            {(sale.total - (sale.paidAmount || 0)).toLocaleString()}{' '}
                            {settings.currency.symbol}
                          </span>
                        </div>
                      ) : (
                        <div className="flex justify-between text-slate-600">
                          <span>الباقي:</span>
                          <span className="font-mono">0 {settings.currency.symbol}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 7. TAX SECTION */}
                  {block.id === 'tax' && (
                    <div className={`text-[0.88em] space-y-0.5 ${computed.flexAlign}`}>
                      <div className="w-full space-y-0.5">
                        <div className="flex justify-between font-black text-black border-b border-dotted border-slate-300 pb-0.5">
                          <span>تفاصيل الضريبة والبيانات الضريبية (VAT)</span>
                          <span className="font-mono">{settings.defaultTaxRate ?? 5}%</span>
                        </div>
                        <div className="flex justify-between text-slate-700">
                          <span>قيمة الضريبة المضافة:</span>
                          <span className="font-mono font-bold">
                            +{saleTax.toLocaleString()} {settings.currency.symbol}
                          </span>
                        </div>
                        {settings.taxNumber && (
                          <div className="flex justify-between text-slate-600 font-mono">
                            <span>الرقم الضريبي (Tax ID):</span>
                            <span className="font-bold">{settings.taxNumber}</span>
                          </div>
                        )}
                        {settings.commercialRecord && (
                          <div className="flex justify-between text-slate-600 font-mono">
                            <span>السجل التجاري (CR):</span>
                            <span className="font-bold">{settings.commercialRecord}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 8. FOOTER, NOTES, LOYALTY & BARCODES SECTION */}
                  {block.id === 'footer' && (
                    <div className={`flex flex-col ${computed.flexAlign} space-y-1.5 text-[0.88em]`}>
                      {showCustomerNotes && sale.notes && (
                        <div className="w-full p-1.5 bg-slate-50 border border-dashed border-slate-300 rounded text-start">
                          <div className="font-bold text-slate-800">ملاحظات العميل / الطلب:</div>
                          <div className="text-slate-600 italic">{sale.notes}</div>
                        </div>
                      )}

                      {sale.customerName && (sale.pointsEarned || sale.pointsRedeemed) ? (
                        <div className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-xl">
                          <div className="flex justify-between font-bold text-amber-700">
                            <span>النقاط المكتسبة من هذه الفاتورة:</span>
                            <span>+{sale.pointsEarned || 0} نقطة</span>
                          </div>
                          {(sale.pointsRedeemed || 0) > 0 && (
                            <div className="flex justify-between text-rose-700">
                              <span>النقاط المستبدلة:</span>
                              <span>-{sale.pointsRedeemed} نقطة</span>
                            </div>
                          )}
                        </div>
                      ) : null}

                      {showReturnPolicy && (
                        <div className="text-slate-600 border-t border-dashed border-slate-300 pt-1 w-full">
                          {settings.receiptCustomFooterText ||
                            `البضاعة المباعة ترد وتستبدل خلال ${returnPolicyDays} أيام بإحضار أصل الفاتورة بحالتها الأصلية`}
                        </div>
                      )}

                      {showFooterMessage && settings.receiptFooter && (
                        <div className="border-t border-dashed border-slate-300 pt-1.5 text-slate-600 w-full">
                          <p className="font-bold text-black">{settings.receiptFooter}</p>
                          <p className="font-bold mt-0.5 text-[0.85em] text-slate-500">
                            نظام كيان كاشير الذكي لإدارة نقاط البيع
                          </p>
                        </div>
                      )}

                      {showBarcode && (
                        <div className="my-1.5 flex flex-col items-center justify-center w-full">
                          <div
                            className="max-w-full overflow-hidden flex justify-center"
                            dangerouslySetInnerHTML={{
                              __html: generateBarcodeSvg(sale.invoiceNumber, {
                                width: Math.min(260, paperWidthMm * 3.4),
                                height: 48,
                                fontSize: 9,
                                showText: true,
                                barColor: '#000000',
                                bgColor: '#ffffff',
                              }),
                            }}
                          />
                          <span className="text-[0.8em] text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                            <BarcodeIcon className="w-3 h-3 text-slate-400" />
                            باركود استرجاع الفاتورة ({sale.invoiceNumber})
                          </span>
                        </div>
                      )}

                      {showQr && qrCodeDataUrl && (
                        <div className="my-1 flex flex-col items-center justify-center w-full">
                          <img src={qrCodeDataUrl} alt="Receipt QR" className="w-20 h-20" />
                          <span className="text-[0.8em] text-slate-400 font-mono mt-0.5">
                            مسح للتحقق الرقمي من الفاتورة
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Thermal Cutter Safe Clearance Feed Space */}
            <div
              style={{
                height: `${bottomCutFeed}mm`,
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              className="relative no-print group my-1"
            >
              <div className="w-full border-b border-dashed border-rose-300 dark:border-rose-700/60 my-auto relative">
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full text-[8px] font-bold flex items-center gap-1 border border-rose-200">
                  <Scissors className="w-2.5 h-2.5" />
                  <span>خط قاطع الطابعة الحرارية ({bottomCutFeed}mm مسافة أمان)</span>
                </span>
              </div>
            </div>

            {/* Physical Print Spacer Element */}
            <div
              className="hidden print:block"
              style={{ height: `${bottomCutFeed}mm` }}
            />
          </div>
        </div>

        {/* Bottom Bar: Action Buttons */}
        <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2.5 no-print">
          <button
            type="button"
            onClick={onClose}
            data-longpress-title="بدء عملية بيع جديدة"
            data-longpress-desc="إغلاق نافذة المعاينة والرجوع إلى شاشة الكاشير للبدء بفاتورة جديدة فوراً."
            className="w-full sm:w-auto px-4 py-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-bold text-xs rounded-2xl transition-all cursor-pointer text-center"
          >
            {t('newSale')} (جديدة)
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto flex-1 justify-end">
            {/* Direct Bluetooth Print Button */}
            <button
              type="button"
              onClick={handleBluetoothPrint}
              disabled={isBtPrinting}
              data-longpress-title="طباعة عبر طابعة البلوتوث"
              data-longpress-desc="إرسال الفاتورة عبر اتصال البلوتوث اللاسلكي مباشرة."
              className={`flex-1 sm:flex-initial py-3 px-4 rounded-2xl font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 disabled:opacity-60 ${
                btStatus.isConnected
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                  : 'bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
              }`}
            >
              {isBtPrinting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Bluetooth className="w-4 h-4" />
              )}
              <span>
                {isBtPrinting
                  ? `جاري الإرسال (${btProgress}%)...`
                  : btStatus.isConnected
                    ? `طباعة بلوتوث (${btStatus.deviceName || 'متصل'})`
                    : 'طباعة طابعة بلوتوث (ESC/POS)'
                }
              </span>
            </button>

            {/* Standard Window Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              data-longpress-title="طباعة الإيصال فوراً"
              data-longpress-desc="إرسال أمر الطباعة المباشر إلى الطابعة الموصولة."
              className="flex-1 sm:flex-initial py-3 px-5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-2xl shadow-md shadow-amber-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة عادية (كابل/PDF)</span>
            </button>
          </div>
        </div>
      </div>

      <BluetoothPrinterModal
        isOpen={isBtModalOpen}
        onClose={() => setIsBtModalOpen(false)}
      />

      <ReceiptCustomizerModal
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
      />
    </DraggableModalWrapper>
    </>
  );
};

