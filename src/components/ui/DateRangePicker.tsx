import React, { useState, useMemo } from 'react';
import { Calendar as CalendarIcon, X, Check, ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { Calendar } from './Calendar';
import { Popover, PopoverContent, PopoverTrigger } from './Popover';
import {
  CivilDateRange,
  toCivilDate,
  fromCivilDate,
  formatCivilDateRangeDisplay,
  getCivilToday,
  getCivilYesterday,
  getCivilDaysAgo,
  getCivilMonthStart,
  getCivilMonthEnd,
  normalizeCivilDateRange,
} from '../../utils/civilDate';

export interface DateRangePickerProps {
  value?: CivilDateRange;
  onChange: (range: CivilDateRange) => void;
  placeholder?: string;
  language?: 'ar' | 'en';
  className?: string;
  buttonClassName?: string;
  showPresets?: boolean;
  disabled?: boolean;
  align?: 'start' | 'center' | 'end';
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  placeholder,
  language = 'ar',
  className = '',
  buttonClassName = '',
  showPresets = true,
  disabled = false,
  align = 'start',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Convert incoming civil date strings (YYYY-MM-DD) to DateRange for DayPicker
  const selectedDateRange: DateRange | undefined = useMemo(() => {
    if (!value?.from && !value?.to) return undefined;
    return {
      from: fromCivilDate(value.from),
      to: fromCivilDate(value.to),
    };
  }, [value?.from, value?.to]);

  // Handle date selection from DayPicker
  const handleSelect = (range: DateRange | undefined) => {
    if (!range) {
      onChange({ from: undefined, to: undefined });
      return;
    }

    let fromStr = range.from ? toCivilDate(range.from) : undefined;
    let toStr = range.to ? toCivilDate(range.to) : undefined;

    // Rule out range endpoints silently swapped
    if (fromStr && toStr && fromStr > toStr) {
      const tmp = fromStr;
      fromStr = toStr;
      toStr = tmp;
    }

    onChange({ from: fromStr, to: toStr });
  };

  // Rule out end-before-start allowed after a typed edit
  const handleManualFromChange = (nextFrom?: string) => {
    if (!nextFrom) {
      onChange({ from: undefined, to: value?.to });
      return;
    }
    let nextTo = value?.to;
    // If user types a 'from' date that is after current 'to', prevent end-before-start
    if (nextTo && nextFrom > nextTo) {
      nextTo = nextFrom;
    }
    onChange({ from: nextFrom, to: nextTo });
  };

  const handleManualToChange = (nextTo?: string) => {
    if (!nextTo) {
      onChange({ from: value?.from, to: undefined });
      return;
    }
    let nextFrom = value?.from;
    // If user types a 'to' date that is before current 'from', prevent end-before-start
    if (nextFrom && nextTo < nextFrom) {
      nextFrom = nextTo;
    }
    onChange({ from: nextFrom, to: nextTo });
  };

  // Quick preset handlers
  const handlePreset = (type: 'today' | 'yesterday' | 'last7' | 'thisMonth' | 'last30' | 'all') => {
    switch (type) {
      case 'today': {
        const today = getCivilToday();
        onChange({ from: today, to: today });
        break;
      }
      case 'yesterday': {
        const yest = getCivilYesterday();
        onChange({ from: yest, to: yest });
        break;
      }
      case 'last7': {
        onChange({
          from: getCivilDaysAgo(6),
          to: getCivilToday(),
        });
        break;
      }
      case 'thisMonth': {
        onChange({
          from: getCivilMonthStart(),
          to: getCivilMonthEnd(),
        });
        break;
      }
      case 'last30': {
        onChange({
          from: getCivilDaysAgo(29),
          to: getCivilToday(),
        });
        break;
      }
      case 'all': {
        onChange({ from: undefined, to: undefined });
        break;
      }
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange({ from: undefined, to: undefined });
  };

  const hasSelection = Boolean(value?.from || value?.to);
  const displayText = formatCivilDateRangeDisplay(value, language);

  return (
    <div className={`inline-flex items-center ${className}`}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={`flex items-center justify-between gap-2.5 px-3 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-xs hover:border-amber-500/60 dark:hover:border-amber-500/60 transition-all cursor-pointer select-none group min-w-[210px] ${
              disabled ? 'opacity-50 cursor-not-allowed' : ''
            } ${buttonClassName}`}
          >
            <div className="flex items-center gap-2 truncate">
              <CalendarIcon className="w-4 h-4 text-amber-500 shrink-0 group-hover:scale-110 transition-transform" />
              <span className={`truncate ${!hasSelection ? 'text-slate-400 font-medium' : 'font-mono font-bold text-slate-900 dark:text-white'}`}>
                {hasSelection
                  ? displayText
                  : placeholder || (language === 'ar' ? 'تحديد فترة زمنية للجرد...' : 'Select date range...')}
              </span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {hasSelection && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  title={language === 'ar' ? 'مسح التحديد' : 'Clear range'}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </button>
        </PopoverTrigger>

        <PopoverContent
          align={align}
          className="p-3 w-auto max-w-[95vw] sm:max-w-none bg-white dark:bg-slate-900 shadow-2xl border border-slate-200/90 dark:border-slate-800 rounded-3xl"
        >
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Quick Presets Column */}
            {showPresets && (
              <div className="flex flex-row sm:flex-col gap-1 sm:w-36 border-b sm:border-b-0 sm:border-e border-slate-100 dark:border-slate-800 pb-2 sm:pb-0 sm:pe-3 overflow-x-auto sm:overflow-visible">
                <span className="text-[10px] font-black uppercase text-slate-400 px-2 py-1 hidden sm:block">
                  {language === 'ar' ? 'فترات سريعة' : 'Quick Presets'}
                </span>
                <button
                  type="button"
                  onClick={() => handlePreset('today')}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-start text-slate-600 dark:text-slate-300 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer whitespace-nowrap"
                >
                  {language === 'ar' ? 'اليوم' : 'Today'}
                </button>
                <button
                  type="button"
                  onClick={() => handlePreset('yesterday')}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-start text-slate-600 dark:text-slate-300 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer whitespace-nowrap"
                >
                  {language === 'ar' ? 'أمس' : 'Yesterday'}
                </button>
                <button
                  type="button"
                  onClick={() => handlePreset('last7')}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-start text-slate-600 dark:text-slate-300 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer whitespace-nowrap"
                >
                  {language === 'ar' ? 'آخر 7 أيام' : 'Last 7 days'}
                </button>
                <button
                  type="button"
                  onClick={() => handlePreset('thisMonth')}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-start text-slate-600 dark:text-slate-300 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer whitespace-nowrap"
                >
                  {language === 'ar' ? 'هذا الشهر' : 'This month'}
                </button>
                <button
                  type="button"
                  onClick={() => handlePreset('last30')}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-start text-slate-600 dark:text-slate-300 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer whitespace-nowrap"
                >
                  {language === 'ar' ? 'آخر 30 يوماً' : 'Last 30 days'}
                </button>
                <button
                  type="button"
                  onClick={() => handlePreset('all')}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-start text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap"
                >
                  {language === 'ar' ? 'جميع الفترات' : 'All time'}
                </button>
              </div>
            )}

            {/* Calendar & Manual Entry Area */}
            <div className="space-y-3">
              <Calendar
                mode="range"
                selected={selectedDateRange}
                onSelect={handleSelect}
                numberOfMonths={1}
                language={language}
              />

              {/* Civil Date Readout & Manual Inputs */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px]">
                  <span className="font-bold text-slate-700 dark:text-slate-300">من:</span>
                  <input
                    type="date"
                    value={value?.from || ''}
                    max={value?.to || undefined}
                    onChange={(e) => handleManualFromChange(e.target.value || undefined)}
                    className="px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[11px] text-slate-900 dark:text-white"
                  />
                  <span className="font-bold text-slate-700 dark:text-slate-300">إلى:</span>
                  <input
                    type="date"
                    value={value?.to || ''}
                    min={value?.from || undefined}
                    onChange={(e) => handleManualToChange(e.target.value || undefined)}
                    className="px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[11px] text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      onChange({ from: undefined, to: undefined });
                    }}
                    className="px-2.5 py-1 rounded-xl text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    {language === 'ar' ? 'إعادة ضبط' : 'Reset'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-3 py-1 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-600 cursor-pointer shadow-xs"
                  >
                    {language === 'ar' ? 'تطبيق' : 'Apply'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
