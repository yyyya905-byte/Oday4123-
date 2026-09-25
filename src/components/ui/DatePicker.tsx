import React, { useState, useMemo } from 'react';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { Calendar } from './Calendar';
import { Popover, PopoverContent, PopoverTrigger } from './Popover';
import {
  CivilDateString,
  toCivilDate,
  fromCivilDate,
  formatCivilDateDisplay,
  getCivilToday,
  getCivilYesterday,
} from '../../utils/civilDate';

export interface DatePickerProps {
  value?: CivilDateString;
  onChange: (date?: CivilDateString) => void;
  placeholder?: string;
  language?: 'ar' | 'en';
  className?: string;
  buttonClassName?: string;
  disabled?: boolean;
  align?: 'start' | 'center' | 'end';
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder,
  language = 'ar',
  className = '',
  buttonClassName = '',
  disabled = false,
  align = 'start',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedDate = useMemo(() => fromCivilDate(value), [value]);

  const handleSelect = (date: Date | undefined) => {
    if (!date) {
      onChange(undefined);
      return;
    }
    onChange(toCivilDate(date));
    setIsOpen(false);
  };

  const displayText = value ? formatCivilDateDisplay(value, language) : '';

  return (
    <div className={`inline-flex items-center ${className}`}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={`flex items-center justify-between gap-2 px-3 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-xs hover:border-amber-500/60 dark:hover:border-amber-500/60 transition-all cursor-pointer min-w-[170px] ${
              disabled ? 'opacity-50 cursor-not-allowed' : ''
            } ${buttonClassName}`}
          >
            <div className="flex items-center gap-2 truncate">
              <CalendarIcon className="w-4 h-4 text-amber-500 shrink-0" />
              <span className={`truncate ${!value ? 'text-slate-400 font-medium' : 'font-mono font-bold text-slate-900 dark:text-white'}`}>
                {value ? displayText : placeholder || (language === 'ar' ? 'اختر التاريخ...' : 'Select date...')}
              </span>
            </div>

            {value && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(undefined);
                }}
                className="p-1 rounded-full text-slate-400 hover:text-rose-500 transition-colors"
                title={language === 'ar' ? 'مسح' : 'Clear'}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </button>
        </PopoverTrigger>

        <PopoverContent
          align={align}
          className="p-3 w-auto bg-white dark:bg-slate-900 shadow-2xl border border-slate-200/90 dark:border-slate-800 rounded-3xl"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {language === 'ar' ? 'اختر يوماً' : 'Choose a date'}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    onChange(getCivilToday());
                    setIsOpen(false);
                  }}
                  className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20"
                >
                  {language === 'ar' ? 'اليوم' : 'Today'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onChange(getCivilYesterday());
                    setIsOpen(false);
                  }}
                  className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                >
                  {language === 'ar' ? 'أمس' : 'Yesterday'}
                </button>
              </div>
            </div>

            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleSelect}
              language={language}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
