/**
 * Civil Date Utilities
 * 
 * Critical principle: Treat dates strictly as civil dates (YYYY-MM-DD strings),
 * NEVER Date-parsed-as-UTC (which triggers the classic off-by-one-day bug in timezones
 * west of UTC like GMT-4, GMT-7, etc.).
 */

import { arSA, enUS } from 'date-fns/locale';

export type CivilDateString = string; // Format: "YYYY-MM-DD"

export interface CivilDateRange {
  from?: CivilDateString;
  to?: CivilDateString;
}

/**
 * Converts a JavaScript Date object into a civil date string "YYYY-MM-DD"
 * using the local calendar components (getFullYear, getMonth, getDate).
 */
export function toCivilDate(date: Date): CivilDateString {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses a civil date string "YYYY-MM-DD" into a local JavaScript Date object.
 * Uses local midday (12:00:00) to ensure full safety against DST shifts and timezone edge cases.
 * NEVER uses `new Date(str)` directly on "YYYY-MM-DD" because ISO 8601 date-only strings
 * are parsed as UTC midnight, producing the notorious off-by-one-day defect in Western timezones.
 */
export function fromCivilDate(str?: CivilDateString | null): Date | undefined {
  if (!str) return undefined;
  const parts = str.trim().split('-');
  if (parts.length !== 3) return undefined;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return undefined;
  return new Date(year, month - 1, day, 12, 0, 0);
}

/**
 * Returns today's date as a civil date string "YYYY-MM-DD".
 */
export function getCivilToday(): CivilDateString {
  return toCivilDate(new Date());
}

/**
 * Returns yesterday's date as a civil date string "YYYY-MM-DD".
 */
export function getCivilYesterday(): CivilDateString {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toCivilDate(d);
}

/**
 * Returns a civil date string N days ago.
 */
export function getCivilDaysAgo(days: number): CivilDateString {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return toCivilDate(d);
}

/**
 * Returns the first day of the current civil month "YYYY-MM-01".
 */
export function getCivilMonthStart(baseDate: Date = new Date()): CivilDateString {
  const year = baseDate.getFullYear();
  const month = String(baseDate.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
}

/**
 * Returns the last day of the current civil month.
 */
export function getCivilMonthEnd(baseDate: Date = new Date()): CivilDateString {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  // Day 0 of next month is the last day of this month
  const lastDay = new Date(year, month + 1, 0).getDate();
  const monthStr = String(month + 1).padStart(2, '0');
  const dayStr = String(lastDay).padStart(2, '0');
  return `${year}-${monthStr}-${dayStr}`;
}

/**
 * Normalizes a civil date range to guarantee endpoints are never inverted (from <= to).
 * Rules out "range endpoints silently swapped or end-before-start allowed after a typed edit".
 */
export function normalizeCivilDateRange(range?: CivilDateRange): CivilDateRange {
  if (!range) return { from: undefined, to: undefined };
  let { from, to } = range;
  if (from && to && from > to) {
    return { from: to, to: from };
  }
  return { from, to };
}

/**
 * Checks if a target timestamp or civil date string falls within [from, to] inclusive.
 * Rules out:
 * 1. Date-only string parsed as UTC and rendering one day off in local time (never parses "YYYY-MM-DD" as UTC).
 * 2. Range endpoints inverted or swapped (normalizes range first).
 */
export function isCivilDateInRange(
  targetDateOrTimestamp: string | Date | number,
  range?: CivilDateRange
): boolean {
  if (!range || (!range.from && !range.to)) return true;

  const normalized = normalizeCivilDateRange(range);
  let targetCivil: CivilDateString;

  if (typeof targetDateOrTimestamp === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(targetDateOrTimestamp)) {
    targetCivil = targetDateOrTimestamp;
  } else {
    const d = typeof targetDateOrTimestamp === 'string' || typeof targetDateOrTimestamp === 'number'
      ? new Date(targetDateOrTimestamp)
      : targetDateOrTimestamp;
    if (isNaN(d.getTime())) return true;
    targetCivil = toCivilDate(d);
  }

  if (normalized.from && targetCivil < normalized.from) return false;
  if (normalized.to && targetCivil > normalized.to) return false;
  return true;
}

/**
 * Formats a civil date string for human presentation according to the active language.
 */
export function formatCivilDateDisplay(dateStr?: CivilDateString | null, language: 'ar' | 'en' = 'ar'): string {
  if (!dateStr) return '';
  const d = fromCivilDate(dateStr);
  if (!d) return dateStr;

  try {
    return d.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Formats a civil date range for display, e.g. "2026-09-01 إلى 2026-09-18" or "1 سبتمبر – 18 سبتمبر 2026".
 */
export function formatCivilDateRangeDisplay(
  range?: CivilDateRange,
  language: 'ar' | 'en' = 'ar'
): string {
  if (!range || (!range.from && !range.to)) {
    return language === 'ar' ? 'جميع التواريخ (غير محدد)' : 'All dates';
  }
  if (range.from && !range.to) {
    return language === 'ar'
      ? `منذ ${formatCivilDateDisplay(range.from, language)}`
      : `From ${formatCivilDateDisplay(range.from, language)}`;
  }
  if (!range.from && range.to) {
    return language === 'ar'
      ? `حتى ${formatCivilDateDisplay(range.to, language)}`
      : `Until ${formatCivilDateDisplay(range.to, language)}`;
  }
  if (range.from === range.to) {
    return formatCivilDateDisplay(range.from, language);
  }
  return `${formatCivilDateDisplay(range.from, language)} ${language === 'ar' ? 'إلى' : '–'} ${formatCivilDateDisplay(range.to, language)}`;
}

/**
 * Returns the date-fns locale based on the app's language code.
 */
export function getLocaleForLanguage(language: 'ar' | 'en' = 'ar') {
  return language === 'ar' ? arSA : enUS;
}
