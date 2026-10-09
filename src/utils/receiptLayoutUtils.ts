import {
  ReceiptSectionBlock,
  ReceiptSectionId,
  ReceiptSectionSize,
  ReceiptSectionAlignment,
  StoreSettings,
} from '../types';

export interface ReceiptSectionMeta {
  id: ReceiptSectionId;
  labelAr: string;
  labelEn: string;
  shortAr: string;
  shortEn: string;
  descriptionAr: string;
  descriptionEn: string;
  category: 'logo' | 'header' | 'body' | 'tax' | 'footer';
  badgeColor: string;
  iconName: string;
  supportsHeightSlider?: boolean;
  minHeightPx?: number;
  maxHeightPx?: number;
  defaultHeightPx?: number;
}

export const RECEIPT_SECTION_METADATA: Record<ReceiptSectionId, ReceiptSectionMeta> = {
  logo: {
    id: 'logo',
    labelAr: 'شعار المتجر / المطعم (Logo)',
    labelEn: 'Store / Brand Logo',
    shortAr: 'الشعار (Logo)',
    shortEn: 'Logo',
    descriptionAr: 'تحكم بموقع الشعار، إظهاره أو إخفائه، وتكبير/تصغير أبعاده بالبكسل أو النسبة المئوية',
    descriptionEn: 'Arrange, hide, or resize the store logo height and alignment',
    category: 'logo',
    badgeColor: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
    iconName: 'Image',
    supportsHeightSlider: true,
    minHeightPx: 24,
    maxHeightPx: 140,
    defaultHeightPx: 56,
  },
  header: {
    id: 'header',
    labelAr: 'ترويسة المتجر والعنوان (Headers)',
    labelEn: 'Store Headers & Title',
    shortAr: 'الترويسة (Header)',
    shortEn: 'Headers',
    descriptionAr: 'اسم المنشأة، العنوان الترحيبي، عنوان الفاتورة، الهاتف، والعنوان الجغرافي',
    descriptionEn: 'Store name, welcome banner, receipt title, address, and contact phone',
    category: 'header',
    badgeColor: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
    iconName: 'Type',
  },
  queue_badge: {
    id: 'queue_badge',
    labelAr: 'بانر رقم الطابور والطلب (Queue Badge)',
    labelEn: 'Queue & Order Number Banner',
    shortAr: 'رقم الطابور',
    shortEn: 'Queue #',
    descriptionAr: 'مربع رقم الطابور اليومي البارز (#001) ونوع الطلب (صالة / سفري / توصيل)',
    descriptionEn: 'Prominent daily queue number box (#001) and dining type badge',
    category: 'header',
    badgeColor: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30',
    iconName: 'Hash',
  },
  meta_info: {
    id: 'meta_info',
    labelAr: 'بيانات الفاتورة والكاشير والعميل (Meta Info)',
    labelEn: 'Invoice Meta & Customer Info',
    shortAr: 'بيانات الفاتورة',
    shortEn: 'Invoice Meta',
    descriptionAr: 'رقم الفاتورة، التاريخ والوقت، اسم الكاشير، وبيانات الزبون أو الطاولة',
    descriptionEn: 'Invoice number, timestamp, cashier name, and customer/table info',
    category: 'body',
    badgeColor: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',
    iconName: 'FileText',
  },
  items_table: {
    id: 'items_table',
    labelAr: 'جدول الأصناف والمنتجات (Items Table)',
    labelEn: 'Items & Products Table',
    shortAr: 'جدول الأصناف',
    shortEn: 'Items Table',
    descriptionAr: 'قائمة المواد المباعة والكميات والأسعار الإفرادية وملاحظات التحضير',
    descriptionEn: 'Purchased items list, quantities, unit prices, and preparation notes',
    category: 'body',
    badgeColor: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30',
    iconName: 'ListOrdered',
  },
  totals: {
    id: 'totals',
    labelAr: 'ملخص المجموع والدفع (Totals & Payment)',
    labelEn: 'Totals & Payment Summary',
    shortAr: 'المجموع والدفع',
    shortEn: 'Totals',
    descriptionAr: 'المجموع الفرعي، الخصم، الصافي النهائي، المدفوع والباقي، ومعادل العملة',
    descriptionEn: 'Subtotal, discount, net total, paid/change, and currency equivalent',
    category: 'body',
    badgeColor: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    iconName: 'Calculator',
  },
  tax: {
    id: 'tax',
    labelAr: 'قسم الضريبة والرقم الضريبي (Tax Section)',
    labelEn: 'Tax Breakdown & Tax ID Section',
    shortAr: 'الضريبة (Tax)',
    shortEn: 'Tax Section',
    descriptionAr: 'تفاصيل الضريبة المضافة (VAT)، النسبة الضريبية، الرقم الضريبي، والسجل التجاري',
    descriptionEn: 'VAT breakdown, tax percentage, tax registration number, and commercial record',
    category: 'tax',
    badgeColor: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
    iconName: 'Percent',
  },
  footer: {
    id: 'footer',
    labelAr: 'تذييل الفاتورة والباركود (Footer & Policy)',
    labelEn: 'Footer, Return Policy & Barcodes',
    shortAr: 'التذييل (Footer)',
    shortEn: 'Footer',
    descriptionAr: 'رسالة الشكر، سياسة الاستبدال والاسترجاع، ملاحظات الزبون، نقاط الولاء، والباركود/QR',
    descriptionEn: 'Thank-you message, return policy, customer notes, loyalty points, and QR/barcode',
    category: 'footer',
    badgeColor: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
    iconName: 'AlignCenter',
  },
};

export const DEFAULT_RECEIPT_LAYOUT_BLOCKS: ReceiptSectionBlock[] = [
  {
    id: 'logo',
    visible: true,
    size: 'md',
    scalePercent: 100,
    heightPx: 56,
    paddingY: 4,
    alignment: 'center',
    showDividerBelow: false,
    boxed: false,
  },
  {
    id: 'header',
    visible: true,
    size: 'md',
    scalePercent: 100,
    paddingY: 6,
    alignment: 'center',
    showDividerBelow: true,
    boxed: false,
  },
  {
    id: 'queue_badge',
    visible: true,
    size: 'md',
    scalePercent: 100,
    paddingY: 6,
    alignment: 'center',
    showDividerBelow: true,
    boxed: true,
  },
  {
    id: 'meta_info',
    visible: true,
    size: 'md',
    scalePercent: 100,
    paddingY: 6,
    alignment: 'right',
    showDividerBelow: true,
    boxed: false,
  },
  {
    id: 'items_table',
    visible: true,
    size: 'md',
    scalePercent: 100,
    paddingY: 6,
    alignment: 'right',
    showDividerBelow: true,
    boxed: false,
  },
  {
    id: 'totals',
    visible: true,
    size: 'md',
    scalePercent: 100,
    paddingY: 6,
    alignment: 'right',
    showDividerBelow: true,
    boxed: false,
  },
  {
    id: 'tax',
    visible: true,
    size: 'md',
    scalePercent: 100,
    paddingY: 6,
    alignment: 'right',
    showDividerBelow: true,
    boxed: true,
  },
  {
    id: 'footer',
    visible: true,
    size: 'md',
    scalePercent: 100,
    paddingY: 8,
    alignment: 'center',
    showDividerBelow: false,
    boxed: false,
  },
];

export interface ReceiptLayoutPreset {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  badgeAr: string;
  blocks: ReceiptSectionBlock[];
}

export const RECEIPT_LAYOUT_PRESETS: ReceiptLayoutPreset[] = [
  {
    id: 'standard',
    nameAr: 'التخطيط القياسي المتوازن',
    nameEn: 'Standard Balanced',
    descriptionAr: 'الشعار في الأعلى يليه الترويسة، الطابور، الأصناف، الإجماليات، الضريبة، والتذييل',
    badgeAr: 'الافتراضي ⭐',
    blocks: DEFAULT_RECEIPT_LAYOUT_BLOCKS.map(b => ({ ...b })),
  },
  {
    id: 'tax_prominent',
    nameAr: 'فاتورة ضريبية رسمية بارزة',
    nameEn: 'Formal Tax Prominent',
    descriptionAr: 'يضع قسم الضريبة والرقم الضريبي بحجم كبير مباشرة تحت الترويسة مع إطار رسمي',
    badgeAr: 'ضريبي رسمي 🏛️',
    blocks: [
      { id: 'logo', visible: true, size: 'lg', scalePercent: 115, heightPx: 72, paddingY: 6, alignment: 'center', showDividerBelow: false, boxed: false },
      { id: 'header', visible: true, size: 'lg', scalePercent: 110, paddingY: 8, alignment: 'center', showDividerBelow: true, boxed: false },
      { id: 'tax', visible: true, size: 'lg', scalePercent: 115, paddingY: 8, alignment: 'center', showDividerBelow: true, boxed: true },
      { id: 'meta_info', visible: true, size: 'md', scalePercent: 100, paddingY: 6, alignment: 'right', showDividerBelow: true, boxed: false },
      { id: 'items_table', visible: true, size: 'md', scalePercent: 100, paddingY: 6, alignment: 'right', showDividerBelow: true, boxed: false },
      { id: 'totals', visible: true, size: 'lg', scalePercent: 110, paddingY: 8, alignment: 'right', showDividerBelow: true, boxed: true },
      { id: 'queue_badge', visible: false, size: 'sm', scalePercent: 90, paddingY: 4, alignment: 'center', showDividerBelow: false, boxed: true },
      { id: 'footer', visible: true, size: 'md', scalePercent: 100, paddingY: 8, alignment: 'center', showDividerBelow: false, boxed: false },
    ],
  },
  {
    id: 'restaurant_queue_top',
    nameAr: 'مطعم وكافيه (الطابور أولاً)',
    nameEn: 'Restaurant Queue First',
    descriptionAr: 'يضع رقم الطابور بحجم ضخم في قمة الإيصال لسهولة القراءة في المطبخ والصالة',
    badgeAr: 'للمطاعم 🍔',
    blocks: [
      { id: 'queue_badge', visible: true, size: 'xl', scalePercent: 130, paddingY: 10, alignment: 'center', showDividerBelow: true, boxed: true },
      { id: 'logo', visible: true, size: 'sm', scalePercent: 85, heightPx: 44, paddingY: 4, alignment: 'center', showDividerBelow: false, boxed: false },
      { id: 'header', visible: true, size: 'sm', scalePercent: 90, paddingY: 4, alignment: 'center', showDividerBelow: true, boxed: false },
      { id: 'meta_info', visible: true, size: 'md', scalePercent: 100, paddingY: 5, alignment: 'right', showDividerBelow: true, boxed: false },
      { id: 'items_table', visible: true, size: 'lg', scalePercent: 110, paddingY: 8, alignment: 'right', showDividerBelow: true, boxed: false },
      { id: 'totals', visible: true, size: 'lg', scalePercent: 110, paddingY: 6, alignment: 'right', showDividerBelow: true, boxed: false },
      { id: 'tax', visible: true, size: 'xs', scalePercent: 80, paddingY: 3, alignment: 'center', showDividerBelow: true, boxed: false },
      { id: 'footer', visible: true, size: 'sm', scalePercent: 90, paddingY: 4, alignment: 'center', showDividerBelow: false, boxed: false },
    ],
  },
  {
    id: 'compact_eco',
    nameAr: 'مدمج لتوفير الورق الحراري',
    nameEn: 'Compact Paper Saver',
    descriptionAr: 'يخفي الشعار وقسم الضريبة المنفصل ويقلص الترويسة والتذييل لتوفير 35% من الورق',
    badgeAr: 'توفير ورق 🌿',
    blocks: [
      { id: 'logo', visible: false, size: 'xs', scalePercent: 75, heightPx: 32, paddingY: 2, alignment: 'center', showDividerBelow: false, boxed: false },
      { id: 'header', visible: true, size: 'xs', scalePercent: 80, paddingY: 2, alignment: 'center', showDividerBelow: true, boxed: false },
      { id: 'meta_info', visible: true, size: 'xs', scalePercent: 85, paddingY: 2, alignment: 'right', showDividerBelow: true, boxed: false },
      { id: 'items_table', visible: true, size: 'sm', scalePercent: 90, paddingY: 4, alignment: 'right', showDividerBelow: true, boxed: false },
      { id: 'totals', visible: true, size: 'md', scalePercent: 100, paddingY: 4, alignment: 'right', showDividerBelow: false, boxed: false },
      { id: 'queue_badge', visible: false, size: 'xs', scalePercent: 80, paddingY: 2, alignment: 'center', showDividerBelow: false, boxed: false },
      { id: 'tax', visible: false, size: 'xs', scalePercent: 75, paddingY: 2, alignment: 'right', showDividerBelow: false, boxed: false },
      { id: 'footer', visible: true, size: 'xs', scalePercent: 80, paddingY: 2, alignment: 'center', showDividerBelow: false, boxed: false },
    ],
  },
  {
    id: 'logo_bottom_signature',
    nameAr: 'الشعار والضريبة أسفل الإيصال',
    nameEn: 'Bottom Brand & Tax Signature',
    descriptionAr: 'ترويسة نصية سريعة في الأعلى، مع وضع الشعار والضريبة والتذييل كختم أسفل الفاتورة',
    badgeAr: 'ختم سفلي ✨',
    blocks: [
      { id: 'header', visible: true, size: 'lg', scalePercent: 110, paddingY: 6, alignment: 'center', showDividerBelow: true, boxed: true },
      { id: 'queue_badge', visible: true, size: 'md', scalePercent: 100, paddingY: 6, alignment: 'center', showDividerBelow: true, boxed: true },
      { id: 'meta_info', visible: true, size: 'md', scalePercent: 100, paddingY: 6, alignment: 'right', showDividerBelow: true, boxed: false },
      { id: 'items_table', visible: true, size: 'md', scalePercent: 100, paddingY: 6, alignment: 'right', showDividerBelow: true, boxed: false },
      { id: 'totals', visible: true, size: 'lg', scalePercent: 110, paddingY: 6, alignment: 'right', showDividerBelow: true, boxed: false },
      { id: 'tax', visible: true, size: 'md', scalePercent: 100, paddingY: 6, alignment: 'center', showDividerBelow: true, boxed: true },
      { id: 'logo', visible: true, size: 'md', scalePercent: 100, heightPx: 52, paddingY: 6, alignment: 'center', showDividerBelow: false, boxed: false },
      { id: 'footer', visible: true, size: 'md', scalePercent: 100, paddingY: 6, alignment: 'center', showDividerBelow: false, boxed: false },
    ],
  },
];

export const SIZE_TO_SCALE_MAP: Record<ReceiptSectionSize, number> = {
  xs: 75,
  sm: 88,
  md: 100,
  lg: 118,
  xl: 138,
};

export const SIZE_TO_LOGO_HEIGHT_MAP: Record<ReceiptSectionSize, number> = {
  xs: 32,
  sm: 44,
  md: 56,
  lg: 76,
  xl: 104,
};

export function scaleToNearestSizePreset(scalePercent: number): ReceiptSectionSize {
  if (scalePercent <= 80) return 'xs';
  if (scalePercent <= 93) return 'sm';
  if (scalePercent <= 108) return 'md';
  if (scalePercent <= 126) return 'lg';
  return 'xl';
}

export function logoHeightToNearestSizePreset(heightPx: number): ReceiptSectionSize {
  if (heightPx <= 36) return 'xs';
  if (heightPx <= 48) return 'sm';
  if (heightPx <= 64) return 'md';
  if (heightPx <= 88) return 'lg';
  return 'xl';
}

/**
 * Normalizes and returns the ordered array of 8 receipt layout blocks from StoreSettings,
 * keeping legacy settings flags in sync.
 */
export function normalizeReceiptLayoutBlocks(settings?: Partial<StoreSettings>): ReceiptSectionBlock[] {
  if (!settings) {
    return DEFAULT_RECEIPT_LAYOUT_BLOCKS.map(b => ({ ...b }));
  }

  const savedBlocks = Array.isArray(settings.receiptLayoutBlocks) && settings.receiptLayoutBlocks.length > 0
    ? settings.receiptLayoutBlocks
    : null;

  const baseBlocks: ReceiptSectionBlock[] = [];
  const seenIds = new Set<ReceiptSectionId>();

  if (savedBlocks) {
    for (const raw of savedBlocks) {
      if (raw && raw.id && RECEIPT_SECTION_METADATA[raw.id] && !seenIds.has(raw.id)) {
        const def = DEFAULT_RECEIPT_LAYOUT_BLOCKS.find(d => d.id === raw.id)!;
        seenIds.add(raw.id);
        baseBlocks.push({
          ...def,
          ...raw,
          scalePercent: raw.scalePercent ?? SIZE_TO_SCALE_MAP[raw.size || def.size] ?? 100,
          heightPx: raw.id === 'logo'
            ? (raw.heightPx ?? settings.receiptLogoHeightPx ?? SIZE_TO_LOGO_HEIGHT_MAP[raw.size || def.size] ?? 56)
            : raw.heightPx,
        });
      }
    }
  }

  // Append any missing default blocks so all 8 sections are always present in the editor
  for (const def of DEFAULT_RECEIPT_LAYOUT_BLOCKS) {
    if (!seenIds.has(def.id)) {
      let visible = def.visible;
      let size: ReceiptSectionSize = def.size;
      let heightPx = def.heightPx;
      let alignment: ReceiptSectionAlignment | undefined = def.alignment;

      if (def.id === 'logo') {
        visible = settings.receiptShowLogo ?? settings.printStoreLogo ?? true;
        size = settings.receiptLogoSize || 'md';
        heightPx = settings.receiptLogoHeightPx ?? SIZE_TO_LOGO_HEIGHT_MAP[size] ?? 56;
        alignment = settings.receiptLogoAlignment || 'center';
      } else if (def.id === 'header') {
        size = settings.receiptHeaderSize || 'md';
        alignment = settings.receiptHeaderAlignment || 'center';
      } else if (def.id === 'tax') {
        visible = (settings.receiptShowTax ?? true) || (settings.printTaxDetails ?? true) || (settings.receiptShowTaxNumber ?? true);
        size = settings.receiptTaxSectionSize || 'md';
        alignment = settings.receiptTaxAlignment || 'right';
      } else if (def.id === 'footer') {
        visible = (settings.receiptShowFooterMessage ?? true) || (settings.receiptShowReturnPolicy ?? true) || (settings.receiptShow1DBarcode ?? true) || (settings.receiptShowQRCode ?? true);
        size = settings.receiptFooterSize || 'md';
        alignment = settings.receiptFooterAlignment || 'center';
      }

      baseBlocks.push({
        ...def,
        visible,
        size,
        scalePercent: SIZE_TO_SCALE_MAP[size] || 100,
        heightPx,
        alignment,
      });
    }
  }

  return baseBlocks;
}

/**
 * Produces synchronized StoreSettings updates when the user modifies blocks in the Drag-and-Drop Editor.
 */
export function buildSettingsPatchFromBlocks(
  blocks: ReceiptSectionBlock[],
  currentSettings?: Partial<StoreSettings>
): Partial<StoreSettings> {
  const logoBlock = blocks.find(b => b.id === 'logo');
  const headerBlock = blocks.find(b => b.id === 'header');
  const taxBlock = blocks.find(b => b.id === 'tax');
  const footerBlock = blocks.find(b => b.id === 'footer');

  const patch: Partial<StoreSettings> = {
    receiptLayoutBlocks: blocks,
  };

  if (logoBlock) {
    patch.receiptShowLogo = logoBlock.visible;
    patch.printStoreLogo = logoBlock.visible;
    patch.receiptLogoSize = logoBlock.size;
    patch.receiptLogoHeightPx = logoBlock.heightPx ?? SIZE_TO_LOGO_HEIGHT_MAP[logoBlock.size] ?? 56;
    patch.receiptLogoAlignment = logoBlock.alignment || 'center';
  }

  if (headerBlock) {
    patch.receiptHeaderSize = headerBlock.size;
    patch.receiptHeaderAlignment = headerBlock.alignment || 'center';
  }

  if (taxBlock) {
    patch.receiptShowTax = taxBlock.visible;
    patch.printTaxDetails = taxBlock.visible;
    patch.receiptShowTaxNumber = taxBlock.visible;
    patch.receiptTaxSectionSize = taxBlock.size;
    patch.receiptTaxAlignment = taxBlock.alignment || 'right';
  }

  if (footerBlock) {
    patch.receiptShowFooterMessage = footerBlock.visible;
    patch.receiptFooterSize = footerBlock.size;
    patch.receiptFooterAlignment = footerBlock.alignment || 'center';
  }

  return {
    ...(currentSettings ? {} : {}),
    ...patch,
  };
}

/**
 * Computes inline CSS styles for a section block based on its size, scalePercent, paddingY, and alignment.
 */
export function getReceiptSectionComputedStyle(block: ReceiptSectionBlock): {
  scaleRatio: number;
  fontSizeEm: string;
  paddingYRem: string;
  textAlign: 'left' | 'center' | 'right';
  flexAlign: string;
  logoHeightPx: number;
} {
  const pct = block.scalePercent ?? SIZE_TO_SCALE_MAP[block.size] ?? 100;
  const scaleRatio = Math.max(0.65, Math.min(1.65, pct / 100));
  const padPx = block.paddingY ?? 6;
  const align = block.alignment || 'center';

  const flexAlign =
    align === 'left'
      ? 'items-start text-left'
      : align === 'right'
      ? 'items-end text-right'
      : 'items-center text-center';

  const logoHeightPx =
    block.heightPx ?? SIZE_TO_LOGO_HEIGHT_MAP[block.size] ?? Math.round(56 * scaleRatio);

  return {
    scaleRatio,
    fontSizeEm: `${scaleRatio.toFixed(2)}em`,
    paddingYRem: `${padPx}px`,
    textAlign: align,
    flexAlign,
    logoHeightPx: Math.max(24, Math.min(150, logoHeightPx)),
  };
}
