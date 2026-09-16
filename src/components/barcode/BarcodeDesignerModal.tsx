import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import {
  X,
  Printer,
  Barcode as BarcodeIcon,
  Sparkles,
  Download,
  Copy,
  Check,
  Tag,
  FileText,
  Sliders,
  RefreshCw,
  Search
} from 'lucide-react';
import { generateBarcodeSvg, generateRandomEan13, BarcodeLabelSize } from '../../utils/barcodeUtils';
import { formatSecondaryCurrency } from '../../utils/currencyUtils';

interface BarcodeDesignerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProduct?: Product | null;
}

export const BarcodeDesignerModal: React.FC<BarcodeDesignerModalProps> = ({
  isOpen,
  onClose,
  initialProduct
}) => {
  const { products, updateProduct, settings, formatCurrency, notify } = useApp();

  const [selectedProductId, setSelectedProductId] = useState<string>(
    initialProduct ? initialProduct.id : (products[0]?.id || '')
  );
  const [searchQuery, setSearchQuery] = useState('');
  
  // Design options
  const [labelSize, setLabelSize] = useState<BarcodeLabelSize>('thermal_50x30');
  const [quantity, setQuantity] = useState<number>(1);
  const [showStoreName, setShowStoreName] = useState<boolean>(true);
  const [showProductName, setShowProductName] = useState<boolean>(true);
  const [showPrice, setShowPrice] = useState<boolean>(true);
  const [showSecondaryPrice, setShowSecondaryPrice] = useState<boolean>(false);
  const [showBarcodeText, setShowBarcodeText] = useState<boolean>(true);
  const [customTopText, setCustomTopText] = useState<string>('');

  const printAreaRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentProduct = products.find(p => p.id === selectedProductId) || initialProduct || products[0];

  const handleGenerateNewBarcode = () => {
    if (!currentProduct) return;
    const newCode = generateRandomEan13('621');
    updateProduct(currentProduct.id, { barcode: newCode });
    notify('تم توليد باركود دولي جديد EAN-13', newCode, 'success');
  };

  const handlePrint = () => {
    const printContent = printAreaRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      notify('يرجى السماح بالنوافذ المنبثقة للطباعة', '', 'warning');
      return;
    }

    const isThermal = labelSize.startsWith('thermal');
    const isA4 = labelSize.startsWith('a4');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="utf-8">
          <title>طباعة ملصقات الباركود - ${currentProduct?.nameAr || 'منتج'}</title>
          <style>
            @page {
              size: ${isThermal ? (labelSize === 'thermal_50x30' ? '50mm 30mm' : labelSize === 'thermal_40x25' ? '40mm 25mm' : '60mm 40mm') : 'A4 portrait'};
              margin: ${isThermal ? '1mm' : '5mm'};
            }
            body {
              margin: 0;
              padding: 0;
              font-family: system-ui, -apple-system, sans-serif;
              direction: rtl;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .label-container {
              display: flex;
              flex-wrap: wrap;
              gap: ${isThermal ? '0' : '4mm'};
              justify-content: ${isThermal ? 'center' : 'flex-start'};
            }
            .label-item {
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              text-align: center;
              padding: 2mm;
              page-break-inside: avoid;
              ${isThermal ? 'width: 100vw; height: 100vh;' : ''}
              ${labelSize === 'a4_sheet_24' ? 'width: 63.5mm; height: 33.9mm; border: 1px dashed #e2e8f0; margin-bottom: 2mm;' : ''}
              ${labelSize === 'a4_sheet_30' ? 'width: 70mm; height: 29.7mm; border: 1px dashed #e2e8f0; margin-bottom: 2mm;' : ''}
            }
            .store-title {
              font-size: 8pt;
              font-weight: bold;
              margin-bottom: 1mm;
              color: #1e293b;
            }
            .product-name {
              font-size: 9pt;
              font-weight: 900;
              line-height: 1.1;
              max-width: 95%;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              color: #0f172a;
            }
            .barcode-svg {
              margin: 1mm 0;
              max-width: 95%;
            }
            .price-tag {
              font-size: 9.5pt;
              font-weight: 900;
              color: #0f172a;
            }
            .secondary-price {
              font-size: 7.5pt;
              color: #475569;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="label-container">
            ${Array.from({ length: quantity }).map(() => `
              <div class="label-item">
                ${showStoreName ? `<div class="store-title">${customTopText || settings.storeNameAr}</div>` : ''}
                ${showProductName ? `<div class="product-name">${currentProduct?.nameAr}</div>` : ''}
                <div class="barcode-svg">
                  ${generateBarcodeSvg(currentProduct?.barcode || '00000000', {
                    width: isThermal ? 180 : 160,
                    height: isThermal ? 45 : 38,
                    showText: showBarcodeText,
                    fontSize: 9
                  })}
                </div>
                <div class="price-tag">
                  ${showPrice ? formatCurrency(currentProduct?.price || 0) : ''}
                  ${showSecondaryPrice && settings.exchangeBulletin ? `<span class="secondary-price"> (${formatSecondaryCurrency(currentProduct?.price || 0, 'USD', settings.exchangeBulletin)})</span>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const filteredProducts = products.filter(p => 
    p.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.barcode.includes(searchQuery)
  );

  const barcodeSvgRaw = currentProduct 
    ? generateBarcodeSvg(currentProduct.barcode, {
        width: 260,
        height: 70,
        showText: showBarcodeText,
        fontSize: 11
      })
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-amber-500 text-white flex items-center justify-center shadow-lg">
              <BarcodeIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                مصمم وطباعة ملصقات الباركود للمنتجات
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-bold">
                  Vector 300 DPI
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                توليد باركودات قياسية، تخصيص الملصقات، والطباعة على الطابعات الحرارية أو ورق A4
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

        {/* Content Body */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls & Configuration (Left/Main Side) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Product Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span>اختر المنتج المراد طباعة ملصقاته</span>
                <span className="text-slate-400 font-normal text-[11px]">
                  ({filteredProducts.length} منتج متوفر)
                </span>
              </label>

              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="ابحث بالاسم أو الباركود..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-3 pr-9 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <select
                  value={selectedProductId}
                  onChange={e => setSelectedProductId(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {filteredProducts.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nameAr} — {formatCurrency(p.price)} (باركود: {p.barcode})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Barcode Quick Actions */}
            {currentProduct && (
              <div className="p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <span>رمز الباركود الحالي:</span>
                    <span className="font-mono bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-amber-700 dark:text-amber-400 font-black">
                      {currentProduct.barcode}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    نوع الترميز: Code 128 / EAN-13 متوافق مع كافة قارئات الليزر
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateNewBarcode}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm transition-all hover:scale-105 shrink-0"
                  title="توليد باركود عشوائي جديد للمنتج"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  توليد EAN جديد
                </button>
              </div>
            )}

            {/* Label Format & Paper Size */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                مقاس ونوع ورق الطباعة
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: 'thermal_50x30', label: 'حراري 50x30 مم', icon: '🏷️' },
                  { id: 'thermal_40x25', label: 'حراري 40x25 مم', icon: '🏷️' },
                  { id: 'thermal_60x40', label: 'حراري 60x40 مم', icon: '🏷️' },
                  { id: 'a4_sheet_24', label: 'ورقة A4 (24 ملصق)', icon: '📄' },
                  { id: 'a4_sheet_30', label: 'ورقة A4 (30 ملصق)', icon: '📄' },
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setLabelSize(item.id as BarcodeLabelSize)}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                      labelSize === item.id
                        ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-2 ring-amber-400'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-base">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Label Content Customization */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                عناصر الملصق المراد إظهارها
              </label>

              <div className="grid grid-cols-2 gap-2.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showStoreName}
                    onChange={e => setShowStoreName(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-400 w-4 h-4"
                  />
                  <span>اسم المتجر</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showProductName}
                    onChange={e => setShowProductName(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-400 w-4 h-4"
                  />
                  <span>اسم المنتج</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showPrice}
                    onChange={e => setShowPrice(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-400 w-4 h-4"
                  />
                  <span>السعر الأساسي</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showSecondaryPrice}
                    onChange={e => setShowSecondaryPrice(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-400 w-4 h-4"
                  />
                  <span>السعر بالدولار ($)</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showBarcodeText}
                    onChange={e => setShowBarcodeText(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-400 w-4 h-4"
                  />
                  <span>أرقام الباركود المقروءة</span>
                </label>
              </div>
            </div>

            {/* Print Quantity */}
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">
                عدد الملصقات:
              </label>
              <div className="flex items-center gap-2">
                {[1, 5, 10, 24, 50].map(qty => (
                  <button
                    key={qty}
                    type="button"
                    onClick={() => setQuantity(qty)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      quantity === qty
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {qty}
                  </button>
                ))}
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={quantity}
                  onChange={e => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-20 px-2 py-1 text-xs font-black rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-center"
                />
              </div>
            </div>
          </div>

          {/* Real-time Preview Area (Right Side) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-between p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <div className="w-full text-center space-y-3">
              <span className="text-xs font-black text-slate-600 dark:text-slate-300 flex items-center justify-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-amber-500" />
                معاينة الملصق المباشرة (300 DPI)
              </span>

              {/* The Single Sticker Preview */}
              <div
                ref={printAreaRef}
                className="mx-auto w-64 bg-white p-3.5 rounded-xl border border-slate-300 shadow-md flex flex-col items-center text-center text-slate-900 transition-transform hover:scale-105 select-none"
                style={{ minHeight: '140px' }}
              >
                {showStoreName && (
                  <div className="text-[10px] font-bold text-slate-500 tracking-wider">
                    {customTopText || settings.storeNameAr}
                  </div>
                )}

                {showProductName && currentProduct && (
                  <div className="text-xs font-black text-slate-900 mt-1 line-clamp-1">
                    {currentProduct.nameAr}
                  </div>
                )}

                {/* SVG Vector Barcode */}
                <div 
                  className="my-1.5 w-full flex justify-center"
                  dangerouslySetInnerHTML={{ __html: barcodeSvgRaw }} 
                />

                {/* Price Display */}
                <div className="flex items-center gap-1.5 font-mono">
                  {showPrice && currentProduct && (
                    <span className="text-sm font-black text-slate-900">
                      {formatCurrency(currentProduct.price)}
                    </span>
                  )}
                  {showSecondaryPrice && currentProduct && settings.exchangeBulletin && (
                    <span className="text-[11px] font-bold text-emerald-600">
                      ({formatSecondaryCurrency(currentProduct.price, 'USD', settings.exchangeBulletin)})
                    </span>
                  )}
                </div>
              </div>
              
              <p className="text-[11px] text-slate-400">
                الباركود عالي الدقة، جاهز للمسح فورياً بكاميرا الهاتف أو أجهزة الباركود
              </p>
            </div>

            {/* Action Buttons */}
            <div className="w-full space-y-2 mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={handlePrint}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Printer className="w-4 h-4" />
                طباعة الملصقات ({quantity} ملصق)
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
