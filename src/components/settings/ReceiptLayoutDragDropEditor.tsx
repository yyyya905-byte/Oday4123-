import React, { useState, useEffect, useRef } from 'react';
import {
  GripVertical,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Save,
  Printer,
  Maximize2,
  Minimize2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Image as ImageIcon,
  Type,
  Hash,
  FileText,
  ListOrdered,
  Calculator,
  Percent,
  Sparkles,
  Check,
  Sliders,
  Layers,
  MoveVertical,
  QrCode,
  Barcode,
  Store,
  CheckCircle2,
  ChevronsUp,
  ChevronsDown,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  ReceiptSectionBlock,
  ReceiptSectionId,
  ReceiptSectionSize,
  ReceiptSectionAlignment,
  PrintPaperSize,
  Sale,
} from '../../types';
import {
  RECEIPT_SECTION_METADATA,
  DEFAULT_RECEIPT_LAYOUT_BLOCKS,
  RECEIPT_LAYOUT_PRESETS,
  SIZE_TO_SCALE_MAP,
  SIZE_TO_LOGO_HEIGHT_MAP,
  scaleToNearestSizePreset,
  logoHeightToNearestSizePreset,
  normalizeReceiptLayoutBlocks,
  buildSettingsPatchFromBlocks,
  getReceiptSectionComputedStyle,
} from '../../utils/receiptLayoutUtils';
import { soundEffects } from '../../services/audio';
import { PrintableReceiptModal } from '../pos/PrintableReceiptModal';

interface ReceiptLayoutDragDropEditorProps {
  compactHeader?: boolean;
}

const SIZE_OPTIONS: { id: ReceiptSectionSize; label: string; labelAr: string }[] = [
  { id: 'xs', label: 'XS', labelAr: 'صغير جداً' },
  { id: 'sm', label: 'SM', labelAr: 'صغير' },
  { id: 'md', label: 'MD', labelAr: 'متوسط' },
  { id: 'lg', label: 'LG', labelAr: 'كبير' },
  { id: 'xl', label: 'XL', labelAr: 'ضخم' },
];

export const ReceiptLayoutDragDropEditor: React.FC<ReceiptLayoutDragDropEditorProps> = ({
  compactHeader = false,
}) => {
  const {
    settings,
    updateSettings,
    formatCurrency,
    formatSecondaryCurrency,
    notify,
    businessMode,
    sales,
  } = useApp();

  const [blocks, setBlocks] = useState<ReceiptSectionBlock[]>(() =>
    normalizeReceiptLayoutBlocks(settings)
  );
  const [selectedSectionId, setSelectedSectionId] = useState<ReceiptSectionId>('logo');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'core' | 'visible' | 'hidden'>('all');
  const [interactiveCanvasMode, setInteractiveCanvasMode] = useState<boolean>(true);
  const [isSavedToast, setIsSavedToast] = useState<boolean>(false);
  const [testPrintSale, setTestPrintSale] = useState<Sale | null>(null);

  // Pointer drag-to-resize state on the live receipt canvas
  const resizingRef = useRef<{
    sectionId: ReceiptSectionId;
    startY: number;
    startScale: number;
    startHeightPx: number;
    startPaddingY: number;
  } | null>(null);

  // Sync when external settings change
  useEffect(() => {
    setBlocks(normalizeReceiptLayoutBlocks(settings));
  }, [settings.receiptLayoutBlocks, settings.receiptShowLogo, settings.receiptLogoSize, settings.receiptShowTax]);

  const applyAndPersistBlocks = (nextBlocks: ReceiptSectionBlock[], silent = false) => {
    setBlocks(nextBlocks);
    const patch = buildSettingsPatchFromBlocks(nextBlocks, settings);
    updateSettings(patch);
    if (!silent) {
      setIsSavedToast(true);
      setTimeout(() => setIsSavedToast(false), 1800);
    }
  };

  // Update a single block by ID
  const updateBlock = (
    id: ReceiptSectionId,
    updater: Partial<ReceiptSectionBlock> | ((prev: ReceiptSectionBlock) => ReceiptSectionBlock)
  ) => {
    const next = blocks.map(b => {
      if (b.id !== id) return b;
      const updated = typeof updater === 'function' ? updater(b) : { ...b, ...updater };
      return updated;
    });
    applyAndPersistBlocks(next);
  };

  // Toggle visibility
  const toggleSectionVisibility = (id: ReceiptSectionId, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    soundEffects.playClick();
    updateBlock(id, prev => ({ ...prev, visible: !prev.visible }));
  };

  // Change size preset
  const setSectionSizePreset = (id: ReceiptSectionId, size: ReceiptSectionSize, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    soundEffects.playClick();
    updateBlock(id, prev => ({
      ...prev,
      size,
      scalePercent: SIZE_TO_SCALE_MAP[size],
      heightPx: id === 'logo' ? SIZE_TO_LOGO_HEIGHT_MAP[size] : prev.heightPx,
    }));
  };

  // Reorder helpers
  const moveBlockByIndex = (fromIndex: number, toIndex: number) => {
    if (fromIndex < 0 || toIndex < 0 || fromIndex >= blocks.length || toIndex >= blocks.length) return;
    if (fromIndex === toIndex) return;
    const copy = [...blocks];
    const [moved] = copy.splice(fromIndex, 1);
    copy.splice(toIndex, 0, moved);
    soundEffects.playClick();
    applyAndPersistBlocks(copy);
  };

  const moveBlockUp = (id: ReceiptSectionId, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const idx = blocks.findIndex(b => b.id === id);
    if (idx > 0) moveBlockByIndex(idx, idx - 1);
  };

  const moveBlockDown = (id: ReceiptSectionId, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const idx = blocks.findIndex(b => b.id === id);
    if (idx >= 0 && idx < blocks.length - 1) moveBlockByIndex(idx, idx + 1);
  };

  const moveBlockToEdge = (id: ReceiptSectionId, edge: 'top' | 'bottom', e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const idx = blocks.findIndex(b => b.id === id);
    if (idx < 0) return;
    moveBlockByIndex(idx, edge === 'top' ? 0 : blocks.length - 1);
  };

  // HTML5 Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, index: number, id: ReceiptSectionId) => {
    setDraggedIndex(index);
    setSelectedSectionId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const sourceIndex = draggedIndex !== null ? draggedIndex : Number(e.dataTransfer.getData('text/plain'));
    setDraggedIndex(null);
    setDragOverIndex(null);
    if (!isNaN(sourceIndex) && sourceIndex !== targetIndex) {
      moveBlockByIndex(sourceIndex, targetIndex);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Mouse / Touch Vertical Resize Handle on Live Receipt Canvas
  const startCanvasResize = (
    e: React.MouseEvent | React.TouchEvent,
    block: ReceiptSectionBlock
  ) => {
    e.stopPropagation();
    e.preventDefault();
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setSelectedSectionId(block.id);

    resizingRef.current = {
      sectionId: block.id,
      startY: clientY,
      startScale: block.scalePercent ?? SIZE_TO_SCALE_MAP[block.size] ?? 100,
      startHeightPx: block.heightPx ?? SIZE_TO_LOGO_HEIGHT_MAP[block.size] ?? 56,
      startPaddingY: block.paddingY ?? 6,
    };

    const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
      if (!resizingRef.current) return;
      const currentY =
        'touches' in moveEvent
          ? moveEvent.touches[0]?.clientY ?? resizingRef.current.startY
          : moveEvent.clientY;
      const deltaY = currentY - resizingRef.current.startY;
      const { sectionId, startScale, startHeightPx, startPaddingY } = resizingRef.current;

      setBlocks(prev => {
        const next = prev.map(b => {
          if (b.id !== sectionId) return b;
          if (sectionId === 'logo') {
            const newHeight = Math.max(24, Math.min(140, Math.round(startHeightPx + deltaY)));
            const newSize = logoHeightToNearestSizePreset(newHeight);
            return {
              ...b,
              heightPx: newHeight,
              size: newSize,
              scalePercent: Math.round((newHeight / 56) * 100),
            };
          } else {
            const newScale = Math.max(65, Math.min(160, Math.round(startScale + deltaY * 0.8)));
            const newPad = Math.max(0, Math.min(24, Math.round(startPaddingY + deltaY * 0.15)));
            return {
              ...b,
              scalePercent: newScale,
              paddingY: newPad,
              size: scaleToNearestSizePreset(newScale),
            };
          }
        });
        return next;
      });
    };

    const handleUp = () => {
      if (resizingRef.current) {
        resizingRef.current = null;
        setBlocks(latest => {
          const patch = buildSettingsPatchFromBlocks(latest, settings);
          updateSettings(patch);
          return latest;
        });
        setIsSavedToast(true);
        setTimeout(() => setIsSavedToast(false), 1500);
      }
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleUp);
  };

  const handleApplyPreset = (presetId: string) => {
    const preset = RECEIPT_LAYOUT_PRESETS.find(p => p.id === presetId);
    if (!preset) return;
    soundEffects.playSuccess();
    const cloned = preset.blocks.map(b => ({ ...b }));
    applyAndPersistBlocks(cloned);
    notify('تم تطبيق تخطيط الفاتورة', `تم اعتماد نمط "${preset.nameAr}" بنجاح`, 'success');
  };

  const handleResetDefault = () => {
    soundEffects.playClick();
    const cloned = DEFAULT_RECEIPT_LAYOUT_BLOCKS.map(b => ({ ...b }));
    applyAndPersistBlocks(cloned);
    notify('استعادة التخطيط الافتراضي', 'تمت إعادة ترتيب وأحجام أقسام الفاتورة للوضع القياسي', 'info');
  };

  const handleOpenTestPrintModal = () => {
    soundEffects.playClick();
    if (sales && sales.length > 0) {
      setTestPrintSale(sales[0]);
      return;
    }
    const sampleSale: Sale = {
      id: 'sale_preview_001',
      invoiceNumber: 'INV-2026-0842',
      queueNumber: 1,
      items: [
        {
          product: {
            id: 'p1',
            nameAr: businessMode === 'restaurant' ? 'وجبة شاورما عربي دبل' : 'بن برازيلي فاخر 500 غرام',
            nameEn: 'Premium Item 1',
            barcode: '6210001',
            categoryId: 'c1',
            costPrice: 30000,
            salePrice: 45000,
            stock: 50,
            minStockAlert: 5,
            unit: 'قطعة',
          },
          quantity: 2,
          unitPrice: 45000,
          discount: 0,
          total: 90000,
          kitchenNotes: businessMode === 'restaurant' ? 'زيادة ثوم ومخلل — خبز محمص' : undefined,
        },
        {
          product: {
            id: 'p2',
            nameAr: businessMode === 'restaurant' ? 'عصير برتقال طبيعي طازج' : 'حليب كامل الدسم 1 لتر',
            nameEn: 'Fresh Item 2',
            barcode: '6210002',
            categoryId: 'c1',
            costPrice: 12000,
            salePrice: 20000,
            stock: 80,
            minStockAlert: 10,
            unit: 'قطعة',
          },
          quantity: 1,
          unitPrice: 20000,
          discount: 0,
          total: 20000,
        },
      ],
      subtotal: 110000,
      discount: 5000,
      tax: settings.enableTax ? Math.round(105000 * ((settings.defaultTaxRate || 5) / 100)) : 5250,
      total: 110250,
      paidAmount: 115000,
      changeAmount: 4750,
      paymentMethod: 'cash',
      tradeType: businessMode === 'wholesale' ? 'wholesale' : 'retail',
      diningType: businessMode === 'restaurant' ? 'dine_in' : undefined,
      tableName: businessMode === 'restaurant' ? 'طاولة 4' : undefined,
      cashierId: 'u1',
      cashierName: 'أحمد العلي',
      customerName: 'محمد الدمشقي',
      customerPhone: '0933123456',
      notes: settings.receiptSampleCustomerNote || 'يرجى تغليف الطلب بعناية — تسليم فوري',
      pointsEarned: 11,
      createdAt: new Date().toISOString(),
    };
    setTestPrintSale(sampleSale);
  };

  const renderSectionIcon = (id: ReceiptSectionId, className = 'w-4 h-4') => {
    switch (id) {
      case 'logo':
        return <ImageIcon className={className} />;
      case 'header':
        return <Type className={className} />;
      case 'queue_badge':
        return <Hash className={className} />;
      case 'meta_info':
        return <FileText className={className} />;
      case 'items_table':
        return <ListOrdered className={className} />;
      case 'totals':
        return <Calculator className={className} />;
      case 'tax':
        return <Percent className={className} />;
      case 'footer':
        return <QrCode className={className} />;
    }
  };

  const selectedBlock = blocks.find(b => b.id === selectedSectionId) || blocks[0];
  const selectedMeta = RECEIPT_SECTION_METADATA[selectedBlock.id];

  const filteredBlocks = blocks.filter(b => {
    if (filterMode === 'core') {
      return b.id === 'logo' || b.id === 'header' || b.id === 'tax' || b.id === 'footer';
    }
    if (filterMode === 'visible') return b.visible;
    if (filterMode === 'hidden') return !b.visible;
    return true;
  });

  // Sample values for live preview
  const sampleSubtotal = 110000;
  const sampleDiscount = 5000;
  const taxRate = settings.defaultTaxRate || 5;
  const sampleTax = Math.round((sampleSubtotal - sampleDiscount) * (taxRate / 100));
  const sampleTotal = sampleSubtotal - sampleDiscount + sampleTax;

  const dividerClass =
    settings.receiptDividerStyle === 'solid'
      ? 'border-solid border-slate-400'
      : settings.receiptDividerStyle === 'double'
      ? 'border-double border-b-4 border-slate-400'
      : settings.receiptDividerStyle === 'dotted'
      ? 'border-dotted border-slate-400'
      : 'border-dashed border-slate-300';

  const paperWidthClass =
    settings.printPaperSize === '58mm'
      ? 'w-[255px]'
      : settings.printPaperSize === '76mm'
      ? 'w-[305px]'
      : settings.printPaperSize === 'a4'
      ? 'w-full max-w-[460px]'
      : 'w-[330px]';

  // Core 4 quick-access blocks (Logo, Headers, Tax, Footer)
  const coreIds: ReceiptSectionId[] = ['logo', 'header', 'tax', 'footer'];

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      {!compactHeader && (
        <div className="bg-gradient-to-r from-slate-900 via-amber-950/90 to-slate-900 text-white p-5 sm:p-6 rounded-3xl border border-amber-500/30 shadow-xl relative overflow-hidden">
          <div className="absolute -top-12 -left-12 w-52 h-52 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/25 shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-black tracking-tight">
                      محرر تخطيط الفاتورة بالسحب والإفلات (Drag & Drop Receipt Layout Studio)
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-amber-500 text-slate-950">
                      مباشر وتفاعلي 100%
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    رتّب أقسام الإيصال المطبوع بالسحب والإفلات، أو قم بإخفاء وتكبير/تصغير الشعار (Logo)، الترويسة (Headers)، الضريبة (Tax)، والتذييل (Footer) مع معاينة حرارية حية.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap shrink-0">
              {isSavedToast && (
                <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-black flex items-center gap-1.5 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تم الحفظ تلقائياً</span>
                </span>
              )}

              <button
                type="button"
                onClick={handleResetDefault}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-white/10"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>الترتيب الافتراضي</span>
              </button>

              <button
                type="button"
                onClick={handleOpenTestPrintModal}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>معاينة وطباعة فاتورة تجريبية</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Control Strip for the 4 Primary Sections: Logo, Headers, Tax, Footer */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-500" />
            <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
              التحكم السريع بالأقسام الرئيسية (Logo • Headers • Tax • Footer)
            </h4>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            اضغط على أي بطاقة لتعديل محتواها، أو غيّر حجمها (XS–XL) وأظهرها/أخفها فوراً
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {coreIds.map(coreId => {
            const block = blocks.find(b => b.id === coreId);
            if (!block) return null;
            const meta = RECEIPT_SECTION_METADATA[coreId];
            const orderPosition = blocks.findIndex(b => b.id === coreId) + 1;
            const isSelected = selectedSectionId === coreId;

            return (
              <div
                key={coreId}
                onClick={() => setSelectedSectionId(coreId)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500/5 dark:bg-amber-500/10 ring-2 ring-amber-500/25'
                    : block.visible
                    ? 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:border-slate-300'
                    : 'border-dashed border-slate-300 dark:border-slate-800 bg-slate-100/40 dark:bg-slate-900/30 opacity-65'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-slate-900 dark:bg-slate-700 text-amber-400 font-mono text-[11px] font-black flex items-center justify-center shrink-0">
                      #{orderPosition}
                    </span>
                    <div className="truncate">
                      <span className="text-xs font-black text-slate-900 dark:text-white block truncate">
                        {meta.shortAr}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        {meta.shortEn} • {block. id === 'logo' ? `${block.heightPx || 56}px` : `${block.scalePercent || 100}%`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={e => moveBlockUp(coreId, e)}
                      disabled={orderPosition === 1}
                      title="تحريك للأعلى"
                      className="p-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-amber-500 hover:text-slate-950 disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={e => moveBlockDown(coreId, e)}
                      disabled={orderPosition === blocks.length}
                      title="تحريك للأسفل"
                      className="p-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-amber-500 hover:text-slate-950 disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={e => toggleSectionVisibility(coreId, e)}
                      title={block.visible ? 'إخفاء القسم من الطباعة' : 'إظهار القسم في الطباعة'}
                      className={`px-2 py-1 rounded-lg text-[10px] font-black flex items-center gap-1 cursor-pointer transition-all ${
                        block.visible
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {block.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      <span>{block.visible ? 'ظاهر' : 'مخفي'}</span>
                    </button>
                  </div>
                </div>

                {/* Quick Size Selector (XS / SM / MD / LG / XL) */}
                <div className="flex items-center gap-1 pt-1 border-t border-slate-200/60 dark:border-slate-700/50">
                  <span className="text-[10px] font-bold text-slate-400 me-1">الحجم:</span>
                  {SIZE_OPTIONS.map(sz => (
                    <button
                      key={sz.id}
                      type="button"
                      onClick={e => setSectionSizePreset(coreId, sz.id, e)}
                      className={`flex-1 py-1 rounded-md text-[10px] font-mono font-black transition-all cursor-pointer ${
                        block.size === sz.id
                          ? 'bg-amber-500 text-slate-950 shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {sz.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Split Workspace: Left Controls (Draggable Stack + Section Inspector) & Right Live Interactive Thermal Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (7 cols): Presets, Draggable Section Stack, and Selected Section Inspector */}
        <div className="lg:col-span-7 space-y-5">
          {/* 1-Click Layout Presets */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>قوالب تخطيط جاهزة بنقرة واحدة (Layout Presets):</span>
              </span>
              <span className="text-[10px] text-slate-400">تعيد ترتيب وتغيير أحجام الأقسام تلقائياً</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {RECEIPT_LAYOUT_PRESETS.map(preset => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleApplyPreset(preset.id)}
                  className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 hover:border-amber-500 hover:bg-amber-500/5 text-right transition-all cursor-pointer flex flex-col justify-between gap-1.5"
                >
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 self-start">
                    {preset.badgeAr}
                  </span>
                  <span className="text-[11px] font-black text-slate-900 dark:text-white leading-tight">
                    {preset.nameAr}
                  </span>
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {preset.descriptionAr}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Draggable Receipt Sections List */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <GripVertical className="w-4 h-4 text-amber-500" />
                  <span>ترتيب وأحجام أقسام الفاتورة (اسحب وأفلت لإعادة الترتيب)</span>
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  اسحب أي قسم بالماوس أو اللمس لتغيير موقعه في الفاتورة المطبوعة، أو استخدم أزرار الأسهم والحجم
                </p>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0">
                {[
                  { id: 'all', label: `الكل (${blocks.length})` },
                  { id: 'core', label: 'الأساسية (4)' },
                  { id: 'visible', label: `ظاهر (${blocks.filter(b => b.visible).length})` },
                  { id: 'hidden', label: `مخفي (${blocks.filter(b => !b.visible).length})` },
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFilterMode(tab.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                      filterMode === tab.id
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Draggable Cards Stack */}
            <div className="space-y-2.5">
              {filteredBlocks.map(block => {
                const actualIndex = blocks.findIndex(b => b.id === block.id);
                const meta = RECEIPT_SECTION_METADATA[block.id];
                const isSelected = selectedSectionId === block.id;
                const isDragged = draggedIndex === actualIndex;
                const isDragOver = dragOverIndex === actualIndex && draggedIndex !== actualIndex;

                return (
                  <div
                    key={block.id}
                    draggable
                    onDragStart={e => handleDragStart(e, actualIndex, block.id)}
                    onDragOver={e => handleDragOver(e, actualIndex)}
                    onDrop={e => handleDrop(e, actualIndex)}
                    onDragEnd={handleDragEnd}
                    onClick={() => setSelectedSectionId(block.id)}
                    className={`group relative rounded-2xl border p-3 sm:p-3.5 transition-all select-none cursor-pointer ${
                      isDragged
                        ? 'opacity-40 scale-[0.98] border-amber-500 bg-amber-500/10'
                        : isDragOver
                        ? 'border-2 border-amber-500 bg-amber-500/15 shadow-lg -translate-y-0.5'
                        : isSelected
                        ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 ring-2 ring-amber-500/20 shadow-xs'
                        : block.visible
                        ? 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700'
                        : 'border-dashed border-slate-200 dark:border-slate-800 bg-slate-100/40 dark:bg-slate-900/40 opacity-60'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Left: Drag Handle, Position Number, Icon, Title & Description */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="p-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 group-hover:text-amber-500 cursor-grab active:cursor-grabbing shrink-0"
                          title="اسحب لتغيير ترتيب القسم"
                        >
                          <GripVertical className="w-4 h-4" />
                        </div>

                        <div className="w-7 h-7 rounded-xl bg-slate-900 dark:bg-slate-700 text-amber-400 font-mono text-xs font-black flex items-center justify-center shrink-0">
                          {actualIndex + 1}
                        </div>

                        <div className={`p-2 rounded-xl border shrink-0 ${meta.badgeColor}`}>
                          {renderSectionIcon(block.id, 'w-4 h-4')}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                              {meta.labelAr}
                            </span>
                            {!block.visible && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-500/15 text-rose-600 dark:text-rose-400">
                                مخفي من الطباعة
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {meta.descriptionAr}
                          </p>
                        </div>
                      </div>

                      {/* Right: Resize Pills, Up/Down Reorder, Visibility Toggle */}
                      <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 dark:border-slate-800">
                        {/* Size Preset Buttons */}
                        <div className="flex items-center gap-0.5 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                          {SIZE_OPTIONS.map(sz => (
                            <button
                              key={sz.id}
                              type="button"
                              onClick={e => setSectionSizePreset(block.id, sz.id, e)}
                              title={`حجم ${sz.labelAr} (${sz.label})`}
                              className={`px-2 py-1 rounded-lg text-[10px] font-mono font-black transition-all cursor-pointer ${
                                block.size === sz.id
                                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                              }`}
                            >
                              {sz.label}
                            </button>
                          ))}
                        </div>

                        {/* Up / Down Buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={e => moveBlockUp(block.id, e)}
                            disabled={actualIndex === 0}
                            title="تحريك لأعلى"
                            className="p-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-amber-500 hover:text-slate-950 disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={e => moveBlockDown(block.id, e)}
                            disabled={actualIndex === blocks.length - 1}
                            title="تحريك لأسفل"
                            className="p-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-amber-500 hover:text-slate-950 disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Hide / Show Toggle */}
                        <button
                          type="button"
                          onClick={e => toggleSectionVisibility(block.id, e)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                            block.visible
                              ? 'bg-emerald-500 text-slate-950 shadow-xs hover:bg-emerald-400'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300'
                          }`}
                        >
                          {block.visible ? (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              <span>ظاهر</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3.5 h-3.5" />
                              <span>مخفي</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Inspector for the Currently Selected Section */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border-2 border-amber-500/40 dark:border-amber-500/30 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className={`p-2.5 rounded-2xl border ${selectedMeta.badgeColor}`}>
                  {renderSectionIcon(selectedBlock.id, 'w-5 h-5')}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded bg-amber-500 text-slate-950">
                      تخصيص القسم المحدد #{blocks.findIndex(b => b.id === selectedBlock.id) + 1}
                    </span>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      {selectedMeta.labelAr}
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {selectedMeta.descriptionAr}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={e => moveBlockToEdge(selectedBlock.id, 'top', e)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                  title="نقل إلى قمة الفاتورة"
                >
                  <ChevronsUp className="w-3.5 h-3.5" />
                  <span>للأعلى</span>
                </button>
                <button
                  type="button"
                  onClick={e => moveBlockToEdge(selectedBlock.id, 'bottom', e)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                  title="نقل إلى أسفل الفاتورة"
                >
                  <ChevronsDown className="w-3.5 h-3.5" />
                  <span>للأسفل</span>
                </button>
              </div>
            </div>

            {/* Resize & Dimensions Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Scale % or Logo Height Slider */}
              {selectedBlock.id === 'logo' ? (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Maximize2 className="w-3.5 h-3.5 text-amber-500" />
                      <span>ارتفاع وحجم الشعار (Logo Height):</span>
                    </span>
                    <span className="font-mono font-black text-amber-600 dark:text-amber-400">
                      {selectedBlock.heightPx || 56} px ({selectedBlock.size.toUpperCase()})
                    </span>
                  </div>
                  <input
                    type="range"
                    min={24}
                    max={140}
                    step={2}
                    value={selectedBlock.heightPx || 56}
                    onChange={e => {
                      const h = Number(e.target.value);
                      updateBlock('logo', prev => ({
                        ...prev,
                        heightPx: h,
                        size: logoHeightToNearestSizePreset(h),
                        scalePercent: Math.round((h / 56) * 100),
                      }));
                    }}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>24px (صغير)</span>
                    <span>56px (قياسي)</span>
                    <span>96px (كبير)</span>
                    <span>140px (ضخم)</span>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Maximize2 className="w-3.5 h-3.5 text-amber-500" />
                      <span>مقياس حجم الخط والعناصر (Scale):</span>
                    </span>
                    <span className="font-mono font-black text-amber-600 dark:text-amber-400">
                      {selectedBlock.scalePercent || 100}% ({selectedBlock.size.toUpperCase()})
                    </span>
                  </div>
                  <input
                    type="range"
                    min={65}
                    max={160}
                    step={5}
                    value={selectedBlock.scalePercent || 100}
                    onChange={e => {
                      const pct = Number(e.target.value);
                      updateBlock(selectedBlock.id, prev => ({
                        ...prev,
                        scalePercent: pct,
                        size: scaleToNearestSizePreset(pct),
                      }));
                    }}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>65% (مدمج)</span>
                    <span>100% (قياسي)</span>
                    <span>130% (كبير)</span>
                    <span>160% (بارز)</span>
                  </div>
                </div>
              )}

              {/* Vertical Padding Slider */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <MoveVertical className="w-3.5 h-3.5 text-amber-500" />
                    <span>المسافة العمودية (Vertical Padding):</span>
                  </span>
                  <span className="font-mono font-black text-amber-600 dark:text-amber-400">
                    {selectedBlock.paddingY ?? 6} px
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={24}
                  step={2}
                  value={selectedBlock.paddingY ?? 6}
                  onChange={e => {
                    const pad = Number(e.target.value);
                    updateBlock(selectedBlock.id, { paddingY: pad });
                  }}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>0px (متلاصق)</span>
                  <span>6px (متوازن)</span>
                  <span>14px (مريح)</span>
                  <span>24px (واسع)</span>
                </div>
              </div>
            </div>

            {/* Alignment & Box/Divider Options */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Alignment */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                  محاذاة القسم (Alignment):
                </span>
                <div className="grid grid-cols-3 gap-1">
                  {(
                    [
                      { id: 'right', label: 'يمين', icon: AlignRight },
                      { id: 'center', label: 'وسط', icon: AlignCenter },
                      { id: 'left', label: 'يسار', icon: AlignLeft },
                    ] as const
                  ).map(al => {
                    const Icon = al.icon;
                    const active = (selectedBlock.alignment || 'center') === al.id;
                    return (
                      <button
                        key={al.id}
                        type="button"
                        onClick={() => updateBlock(selectedBlock.id, { alignment: al.id })}
                        className={`py-1.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all ${
                          active
                            ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{al.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Boxed Frame Toggle */}
              <label className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    إطار محيط (Boxed)
                  </span>
                  <span className="text-[10px] text-slate-400">إحاطة القسم بمربع مطبوع بارز</span>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(selectedBlock.boxed)}
                  onChange={e => updateBlock(selectedBlock.id, { boxed: e.target.checked })}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
              </label>

              {/* Divider Below Toggle */}
              <label className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    خط فاصل سفلي
                  </span>
                  <span className="text-[10px] text-slate-400">رسم خط حراري أسفل هذا القسم</span>
                </div>
                <input
                  type="checkbox"
                  checked={selectedBlock.showDividerBelow !== false}
                  onChange={e => updateBlock(selectedBlock.id, { showDividerBelow: e.target.checked })}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
              </label>
            </div>

            {/* Section-Specific Content Fields (Header, Tax, Footer, Logo) */}
            {selectedBlock.id === 'header' && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    اسم المتجر / المطعم في الترويسة
                  </label>
                  <input
                    type="text"
                    value={settings.storeNameAr || ''}
                    onChange={e => updateSettings({ storeNameAr: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    عنوان نوع الفاتورة (Header Badge)
                  </label>
                  <input
                    type="text"
                    value={settings.receiptHeaderTitle || ''}
                    onChange={e => updateSettings({ receiptHeaderTitle: e.target.value })}
                    placeholder="فاتورة مبيعات ضريبية مبسطة"
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    رسالة الترحيب أعلى الفاتورة (Receipt Header Text)
                  </label>
                  <input
                    type="text"
                    value={settings.receiptHeader || ''}
                    onChange={e => updateSettings({ receiptHeader: e.target.value })}
                    placeholder="أهلاً بكم في متجرنا — نسعد بخدمتكم دائماً"
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            )}

            {selectedBlock.id === 'tax' && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    الرقم الضريبي (Tax ID)
                  </label>
                  <input
                    type="text"
                    value={settings.taxNumber || ''}
                    onChange={e => updateSettings({ taxNumber: e.target.value })}
                    placeholder="TX-963-884210"
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    السجل التجاري (CR)
                  </label>
                  <input
                    type="text"
                    value={settings.commercialRecord || ''}
                    onChange={e => updateSettings({ commercialRecord: e.target.value })}
                    placeholder="CR-104928"
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    نسبة الضريبة المضافة (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={settings.defaultTaxRate ?? 5}
                    onChange={e => updateSettings({ defaultTaxRate: Number(e.target.value), enableTax: true })}
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            )}

            {selectedBlock.id === 'footer' && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    رسالة الشكر في التذييل (Footer Message)
                  </label>
                  <input
                    type="text"
                    value={settings.receiptFooter || ''}
                    onChange={e => updateSettings({ receiptFooter: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    سياسة الاستبدال والاسترجاع (Return Policy)
                  </label>
                  <input
                    type="text"
                    value={settings.receiptCustomFooterText || ''}
                    onChange={e => updateSettings({ receiptCustomFooterText: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.receiptShow1DBarcode !== false}
                      onChange={e => updateSettings({ receiptShow1DBarcode: e.target.checked })}
                      className="w-4 h-4 accent-amber-500 rounded"
                    />
                    <span>إظهار الباركود الخطي (1D)</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.receiptShowQRCode !== false}
                      onChange={e => updateSettings({ receiptShowQRCode: e.target.checked })}
                      className="w-4 h-4 accent-amber-500 rounded"
                    />
                    <span>إظهار رمز QR الضريبي</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN (5 cols): Live Interactive Thermal Paper Canvas (Drag, Reorder & Drag-to-Resize directly on paper!) */}
        <div className="lg:col-span-5 lg:sticky lg:top-4 space-y-4">
          <div className="bg-slate-900 text-white p-4 rounded-3xl border border-slate-800 shadow-xl space-y-4">
            {/* Canvas Top Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-black">
                  معاينة الإيصال الحراري التفاعلية (Live Canvas)
                </span>
              </div>

              {/* Paper Width Switcher */}
              <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl">
                {(
                  [
                    { id: '80mm', label: '80mm' },
                    { id: '76mm', label: '76mm' },
                    { id: '58mm', label: '58mm' },
                    { id: 'a4', label: 'A4' },
                  ] as { id: PrintPaperSize; label: string }[]
                ).map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => updateSettings({ printPaperSize: p.id })}
                    className={`px-2 py-1 rounded-lg text-[10px] font-mono font-black transition-all cursor-pointer ${
                      (settings.printPaperSize || '80mm') === p.id
                        ? 'bg-amber-500 text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Overlay Toggle */}
            <div className="flex items-center justify-between text-[11px] bg-slate-800/70 px-3 py-2 rounded-2xl border border-slate-700/60">
              <span className="text-slate-300">
                💡 يمكنك <strong className="text-amber-400">سحب الأقسام</strong> أو <strong className="text-amber-400">سحب الحافة السفلية</strong> لأي قسم على الورقة لتغيير حجمه!
              </span>
              <button
                type="button"
                onClick={() => setInteractiveCanvasMode(!interactiveCanvasMode)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black shrink-0 ms-2 cursor-pointer transition-all ${
                  interactiveCanvasMode
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-slate-700 text-slate-300'
                }`}
              >
                {interactiveCanvasMode ? 'وضع التخطيط التفاعلي' : 'معاينة صافية'}
              </button>
            </div>

            {/* Thermal Paper Container */}
            <div className="flex justify-center py-3 px-2 bg-slate-950/70 rounded-2xl border border-slate-800/80 overflow-x-auto max-h-[700px] overflow-y-auto">
              <div
                dir="rtl"
                className={`${paperWidthClass} bg-white text-slate-950 rounded-md shadow-2xl p-4 transition-all duration-200 select-none relative`}
                style={{
                  fontFamily:
                    settings.receiptFontFamily === 'mono'
                      ? 'monospace'
                      : "'Cairo', 'Tajawal', sans-serif",
                }}
              >
                {/* Top zig-zag thermal paper edge */}
                <div className="text-center text-[9px] font-mono text-slate-400 pb-2 border-b border-dashed border-slate-200 mb-2">
                  ═══ معاينة الطباعة الحرارية ({settings.printPaperSize || '80mm'}) ═══
                </div>

                <div className="space-y-1">
                  {blocks.map((block, index) => {
                    if (!block.visible) return null;
                    const meta = RECEIPT_SECTION_METADATA[block.id];
                    const computed = getReceiptSectionComputedStyle(block);
                    const isSelected = selectedSectionId === block.id;
                    const isDragOver = dragOverIndex === index && draggedIndex !== index;

                    return (
                      <div
                        key={block.id}
                        draggable
                        onDragStart={e => handleDragStart(e, index, block.id)}
                        onDragOver={e => handleDragOver(e, index)}
                        onDrop={e => handleDrop(e, index)}
                        onDragEnd={handleDragEnd}
                        onClick={() => setSelectedSectionId(block.id)}
                        style={{
                          fontSize: computed.fontSizeEm,
                          paddingTop: computed.paddingYRem,
                          paddingBottom: computed.paddingYRem,
                          textAlign: computed.textAlign,
                        }}
                        className={`group/canvas relative rounded-lg transition-all cursor-pointer ${
                          block.boxed ? 'border-2 border-slate-900 p-2 my-1 bg-slate-50/60' : 'px-1'
                        } ${
                          block.showDividerBelow ? `border-b ${dividerClass}` : ''
                        } ${
                          interactiveCanvasMode && isSelected
                            ? 'ring-2 ring-amber-500 bg-amber-50/40'
                            : interactiveCanvasMode
                            ? 'hover:ring-1 hover:ring-amber-400/70 hover:bg-amber-50/20'
                            : ''
                        } ${isDragOver ? 'border-t-4 border-t-amber-500' : ''}`}
                      >
                        {/* Floating Section Badge on Hover/Selection in Interactive Mode */}
                        {interactiveCanvasMode && (
                          <div
                            className={`flex items-center justify-between gap-1 text-[9px] font-sans font-black px-1.5 py-0.5 rounded mb-1 transition-opacity ${
                              isSelected
                                ? 'bg-amber-500 text-slate-950 opacity-100'
                                : 'bg-slate-900/85 text-white opacity-0 group-hover/canvas:opacity-100'
                            }`}
                          >
                            <span className="flex items-center gap-1">
                              <GripVertical className="w-2.5 h-2.5" />
                              <span>#{index + 1} {meta.shortAr}</span>
                              <span className="font-mono">
                                ({block.id === 'logo' ? `${computed.logoHeightPx}px` : `${block.scalePercent || 100}%`})
                              </span>
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={e => moveBlockUp(block.id, e)}
                                disabled={index === 0}
                                className="hover:text-amber-300 disabled:opacity-30"
                                title="تحريك لأعلى"
                              >
                                ↑
                              </button>
                              <button
                                type="button"
                                onClick={e => moveBlockDown(block.id, e)}
                                disabled={index === blocks.length - 1}
                                className="hover:text-amber-300 disabled:opacity-30"
                                title="تحريك لأسفل"
                              >
                                ↓
                              </button>
                              <button
                                type="button"
                                onClick={e => toggleSectionVisibility(block.id, e)}
                                className="hover:text-rose-300 ms-1"
                                title="إخفاء القسم"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        )}

                        {/* SECTION 1: LOGO */}
                        {block.id === 'logo' && (
                          <div className={`flex flex-col ${computed.flexAlign}`}>
                            {settings.logo ? (
                              <img
                                src={settings.logo}
                                alt={settings.storeNameAr}
                                style={{ height: `${computed.logoHeightPx}px` }}
                                className="w-auto object-contain rounded"
                              />
                            ) : (
                              <div
                                style={{
                                  height: `${computed.logoHeightPx}px`,
                                  width: `${computed.logoHeightPx}px`,
                                }}
                                className="rounded-xl border-2 border-slate-900 bg-slate-100 flex flex-col items-center justify-center text-slate-900 font-black shadow-2xs"
                              >
                                <Store className="w-1/2 h-1/2 text-slate-800" />
                                <span className="text-[8px] font-mono leading-none mt-0.5">LOGO</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* SECTION 2: HEADER */}
                        {block.id === 'header' && (
                          <div className={`flex flex-col ${computed.flexAlign} space-y-0.5`}>
                            {(settings.receiptShowStoreNameAr ?? true) && (
                              <div className="font-black text-[1.25em] leading-tight text-slate-950">
                                {settings.storeNameAr || 'كيان كاشير'}
                              </div>
                            )}
                            {(settings.receiptShowStoreNameEn ?? true) && settings.storeNameEn && (
                              <div className="text-[0.75em] font-bold text-slate-500 tracking-wider uppercase">
                                {settings.storeNameEn}
                              </div>
                            )}
                            {settings.receiptHeaderTitle && (
                              <div className="mt-1 inline-block px-2.5 py-0.5 rounded bg-slate-900 text-white font-bold text-[0.78em]">
                                {settings.receiptHeaderTitle}
                              </div>
                            )}
                            {settings.receiptHeader && (
                              <div className="text-[0.82em] font-bold text-slate-700 pt-0.5">
                                {settings.receiptHeader}
                              </div>
                            )}
                            {(settings.receiptShowAddress ?? true) && settings.address && (
                              <div className="text-[0.75em] text-slate-600">{settings.address}</div>
                            )}
                            {(settings.receiptShowPhone ?? true) && settings.phone && (
                              <div className="text-[0.75em] font-mono text-slate-600" dir="ltr">
                                ☎ {settings.phone}
                              </div>
                            )}
                          </div>
                        )}

                        {/* SECTION 3: QUEUE BADGE */}
                        {block.id === 'queue_badge' && (
                          <div className={`flex flex-col ${computed.flexAlign}`}>
                            <div className="w-full py-1.5 px-3 rounded-lg border-2 border-slate-900 bg-slate-100 text-center">
                              <span className="text-[0.72em] font-black text-slate-600 block">
                                رقم الطابور اليومي • QUEUE NUMBER
                              </span>
                              <span className="text-[1.8em] font-mono font-black tracking-wider text-slate-950 leading-none block my-0.5">
                                #001
                              </span>
                              <span className="text-[0.72em] font-bold text-slate-700 block">
                                🍽️ طلب صالة — طاولة 4
                              </span>
                            </div>
                          </div>
                        )}

                        {/* SECTION 4: META INFO */}
                        {block.id === 'meta_info' && (
                          <div className="text-[0.8em] space-y-0.5">
                            <div className="flex justify-between">
                              <span className="text-slate-500">رقم الفاتورة:</span>
                              <span className="font-mono font-black">INV-2026-0842</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">التاريخ والوقت:</span>
                              <span className="font-mono">
                                {new Date().toLocaleDateString('ar-SY')} • {new Date().toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            {(settings.receiptShowCashier ?? true) && (
                              <div className="flex justify-between">
                                <span className="text-slate-500">الكاشير:</span>
                                <span className="font-bold">أحمد العلي</span>
                              </div>
                            )}
                            {(settings.receiptShowCustomer ?? true) && (
                              <div className="flex justify-between">
                                <span className="text-slate-500">العميل:</span>
                                <span className="font-bold">محمد الدمشقي</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* SECTION 5: ITEMS TABLE */}
                        {block.id === 'items_table' && (
                          <div className="text-[0.82em] space-y-1">
                            <div className="grid grid-cols-12 font-black border-b border-slate-900 pb-1 text-[0.9em]">
                              <span className="col-span-6 text-right">الصنف</span>
                              <span className="col-span-2 text-center">الكمية</span>
                              <span className="col-span-4 text-left">الإجمالي</span>
                            </div>
                            <div className="grid grid-cols-12 items-center py-0.5 border-b border-dotted border-slate-300">
                              <div className="col-span-6 text-right font-bold leading-tight">
                                {businessMode === 'restaurant' ? 'وجبة شاورما عربي دبل' : 'بن برازيلي فاخر 500غ'}
                                {(settings.receiptShowItemNotes ?? true) && (
                                  <span className="block text-[0.82em] text-slate-500 font-normal">
                                    * ملاحظة: تحضير خاص
                                  </span>
                                )}
                              </div>
                              <span className="col-span-2 text-center font-mono font-bold">2</span>
                              <span className="col-span-4 text-left font-mono font-black">
                                {formatCurrency(90000)}
                              </span>
                            </div>
                            <div className="grid grid-cols-12 items-center py-0.5">
                              <span className="col-span-6 text-right font-bold">
                                {businessMode === 'restaurant' ? 'عصير برتقال طبيعي' : 'حليب كامل الدسم 1 لتر'}
                              </span>
                              <span className="col-span-2 text-center font-mono font-bold">1</span>
                              <span className="col-span-4 text-left font-mono font-black">
                                {formatCurrency(20000)}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* SECTION 6: TOTALS & PAYMENT */}
                        {block.id === 'totals' && (
                          <div className="text-[0.84em] space-y-1">
                            {(settings.receiptShowSubtotal ?? true) && (
                              <div className="flex justify-between text-slate-600">
                                <span>المجموع الفرعي:</span>
                                <span className="font-mono font-bold">{formatCurrency(sampleSubtotal)}</span>
                              </div>
                            )}
                            {(settings.receiptShowDiscount ?? true) && (
                              <div className="flex justify-between text-slate-700">
                                <span>الخصم:</span>
                                <span className="font-mono font-bold">-{formatCurrency(sampleDiscount)}</span>
                              </div>
                            )}
                            <div className="flex justify-between items-center text-[1.18em] font-black pt-1 border-t border-slate-900">
                              <span>الإجمالي الصافي:</span>
                              <span className="font-mono">{formatCurrency(sampleTotal)}</span>
                            </div>
                            {(settings.receiptShowExchangeRate ?? true) && (
                              <div className="flex justify-between text-[0.85em] text-slate-600 font-mono">
                                <span>المعادل بالدولار:</span>
                                <span className="font-bold">{formatSecondaryCurrency(sampleTotal, 'USD')}</span>
                              </div>
                            )}
                            {(settings.receiptShowPaymentMethod ?? true) && (
                              <div className="flex justify-between text-[0.85em] text-slate-600 pt-0.5">
                                <span>طريقة الدفع:</span>
                                <span className="font-bold">نقدي (Cash)</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* SECTION 7: TAX SECTION */}
                        {block.id === 'tax' && (
                          <div className={`text-[0.8em] space-y-1 ${computed.flexAlign}`}>
                            <div className="w-full space-y-0.5">
                              <div className="flex items-center justify-between font-black text-slate-900 border-b border-dotted border-slate-300 pb-0.5">
                                <span>تفاصيل الضريبة والبيانات الضريبية (VAT)</span>
                                <span className="font-mono">{taxRate}%</span>
                              </div>
                              <div className="flex justify-between text-slate-700">
                                <span>قيمة الضريبة المضافة ({taxRate}%):</span>
                                <span className="font-mono font-bold">{formatCurrency(sampleTax)}</span>
                              </div>
                              {settings.taxNumber && (
                                <div className="flex justify-between text-slate-600 font-mono text-[0.92em]">
                                  <span>الرقم الضريبي (Tax ID):</span>
                                  <span className="font-bold">{settings.taxNumber}</span>
                                </div>
                              )}
                              {settings.commercialRecord && (
                                <div className="flex justify-between text-slate-600 font-mono text-[0.92em]">
                                  <span>السجل التجاري (CR):</span>
                                  <span className="font-bold">{settings.commercialRecord}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* SECTION 8: FOOTER & BARCODES */}
                        {block.id === 'footer' && (
                          <div className={`flex flex-col ${computed.flexAlign} space-y-1.5 text-[0.8em]`}>
                            {(settings.receiptShowCustomerNotes ?? true) && settings.receiptSampleCustomerNote && (
                              <div className="w-full p-1.5 rounded bg-slate-100 border border-slate-300 text-[0.9em] text-slate-700">
                                📝 ملاحظة: {settings.receiptSampleCustomerNote}
                              </div>
                            )}
                            {(settings.receiptShowFooterMessage ?? true) && settings.receiptFooter && (
                              <div className="font-bold text-slate-900 leading-snug">
                                {settings.receiptFooter}
                              </div>
                            )}
                            {(settings.receiptShowReturnPolicy ?? true) && settings.receiptCustomFooterText && (
                              <div className="text-[0.88em] text-slate-600 border border-slate-300 rounded px-2 py-1 w-full">
                                {settings.receiptCustomFooterText}
                              </div>
                            )}
                            {(settings.receiptShow1DBarcode ?? true) && (
                              <div className="pt-1 flex flex-col items-center">
                                <div className="h-7 w-40 bg-[repeating-linear-gradient(90deg,#0f172a,#0f172a_2px,transparent_2px,transparent_4px,#0f172a_4px,#0f172a_5px,transparent_5px,transparent_8px)]" />
                                <span className="text-[9px] font-mono tracking-widest text-slate-500 mt-0.5">
                                  *INV-2026-0842*
                                </span>
                              </div>
                            )}
                            {(settings.receiptShowQRCode ?? true) && (
                              <div className="pt-1 flex flex-col items-center">
                                <div className="w-12 h-12 border-2 border-slate-900 p-1 rounded flex items-center justify-center bg-white">
                                  <QrCode className="w-full h-full text-slate-900" />
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Interactive Bottom Drag-to-Resize Handle */}
                        {interactiveCanvasMode && (
                          <div
                            onMouseDown={e => startCanvasResize(e, block)}
                            onTouchStart={e => startCanvasResize(e, block)}
                            title="اسحب لأعلى أو لأسفل لتكبير أو تصغير هذا القسم"
                            className={`mt-1 h-2.5 w-full flex items-center justify-center cursor-ns-resize rounded transition-opacity ${
                              isSelected
                                ? 'opacity-100 bg-amber-500/20 hover:bg-amber-500/40'
                                : 'opacity-0 group-hover/canvas:opacity-100 hover:bg-amber-500/30'
                            }`}
                          >
                            <div className="w-8 h-1 rounded-full bg-amber-500" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Tear Line */}
                <div className="text-center text-[9px] font-mono text-slate-400 pt-3 mt-2 border-t border-dashed border-slate-200">
                  ✂ ──────────────────────── ✂
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Test Print Modal */}
      {testPrintSale && (
        <PrintableReceiptModal
          sale={testPrintSale}
          onClose={() => setTestPrintSale(null)}
        />
      )}
    </div>
  );
};
