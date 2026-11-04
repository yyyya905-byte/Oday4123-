/**
 * Arabic & Multilingual Product Search Utility for Kian Cashier
 * Provides fuzzy-like Arabic normalization (Alef, Taa Marbouta, Yaa, Tashkeel removal)
 * and multi-token matching across names, categories, variants, and barcodes.
 */

import { Product } from '../types';

/**
 * Normalize Arabic text by unifying character variants and stripping diacritics
 */
export function normalizeArabicText(text: string | null | undefined): string {
  if (!text) return '';

  return String(text)
    .trim()
    .toLowerCase()
    // Remove Arabic Tashkeel / Harakat (Fatha, Damma, Kasra, Sukun, Tanween, Shadda, etc.)
    .replace(/[\u064B-\u065F\u0670]/g, '')
    // Remove Tatweel / Kashida (ـ)
    .replace(/\u0640/g, '')
    // Unify all Alef variants (أ, إ, آ, ٱ -> ا)
    .replace(/[أإآٱ]/g, 'ا')
    // Unify Taa Marbouta to Haa (ة -> ه) for flexible search
    .replace(/ة/g, 'ه')
    // Unify Yaa / Alef Maqsoura (ى -> ي)
    .replace(/ى/g, 'ي')
    // Unify Hamza on Waw / Yaa (ؤ -> و, ئ -> ي)
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    // Replace punctuation with space
    .replace(/[ـ.,/#!$%^&*;:{}=\-_`~()?"'«»]/g, ' ')
    // Collapse multiple whitespace
    .replace(/\s+/g, ' ');
}

/**
 * Check if a product matches a search query using intelligent Arabic and multilingual matching
 */
export function matchesProductSearch(
  product: Product,
  query: string,
  categoryName?: string
): boolean {
  if (!query || !query.trim()) return true;

  const rawQuery = query.trim().toLowerCase();
  const normalizedQuery = normalizeArabicText(query);

  // 1. Direct barcode, SKU, or identification code match (exact or prefix)
  if (
    (product.barcode && product.barcode.toLowerCase().includes(rawQuery)) ||
    (product.sku && product.sku.toLowerCase().includes(rawQuery)) ||
    product.identificationCodes?.some(c => c.toLowerCase().includes(rawQuery))
  ) {
    return true;
  }

  // 2. Variants SKU or Barcode match
  if (product.variants && product.variants.length > 0) {
    const variantCodeMatch = product.variants.some(
      v =>
        (v.barcode && v.barcode.toLowerCase().includes(rawQuery)) ||
        (v.sku && v.sku.toLowerCase().includes(rawQuery))
    );
    if (variantCodeMatch) return true;
  }

  // 3. Search query tokens (for multi-word queries like "كابتشينو وسط" or "برغر لحم دبل")
  const queryTokens = normalizedQuery.split(' ').filter(t => t.length > 0);
  if (queryTokens.length === 0) return true;

  // Build searchable text corpus for the product
  const searchableCorpusParts: string[] = [
    normalizeArabicText(product.nameAr),
    (product.nameEn || '').toLowerCase(),
    normalizeArabicText(product.descriptionAr),
    normalizeArabicText(categoryName),
    (product.unit || '').toLowerCase(),
  ];

  // Include variant names and attribute values in the corpus
  if (product.variants && product.variants.length > 0) {
    product.variants.forEach(v => {
      searchableCorpusParts.push(normalizeArabicText(v.nameAr));
      if (v.nameEn) searchableCorpusParts.push(v.nameEn.toLowerCase());
      if (v.attributes) {
        Object.values(v.attributes).forEach(val => {
          searchableCorpusParts.push(normalizeArabicText(val));
        });
      }
    });
  }

  const combinedSearchCorpus = searchableCorpusParts.join(' ');

  // Every token in the query must match somewhere in the product's corpus
  return queryTokens.every(token => combinedSearchCorpus.includes(token));
}

/**
 * Check if a customer matches search query with Arabic normalization
 */
export function matchesCustomerSearch(
  customer: { name: string; phone: string; customerCode?: string; companyName?: string },
  query: string
): boolean {
  if (!query || !query.trim()) return true;

  const rawQuery = query.trim().toLowerCase();
  const normalizedQuery = normalizeArabicText(query);

  if (customer.phone.includes(rawQuery) || (customer.customerCode && customer.customerCode.toLowerCase().includes(rawQuery))) {
    return true;
  }

  const queryTokens = normalizedQuery.split(' ').filter(t => t.length > 0);
  if (queryTokens.length === 0) return true;

  const corpus = [
    normalizeArabicText(customer.name),
    customer.companyName ? normalizeArabicText(customer.companyName) : '',
    customer.phone
  ].join(' ');

  return queryTokens.every(token => corpus.includes(token));
}

/**
 * Check if a sale / invoice matches search query
 */
export function matchesSaleSearch(
  sale: { invoiceNumber: string; customerName?: string; id: string },
  query: string
): boolean {
  if (!query || !query.trim()) return true;

  const rawQuery = query.trim().toLowerCase();
  const normalizedQuery = normalizeArabicText(query);

  if (sale.invoiceNumber.toLowerCase().includes(rawQuery) || sale.id.toLowerCase().includes(rawQuery)) {
    return true;
  }

  if (sale.customerName) {
    const normName = normalizeArabicText(sale.customerName);
    const queryTokens = normalizedQuery.split(' ').filter(t => t.length > 0);
    return queryTokens.every(token => normName.includes(token));
  }

  return false;
}
