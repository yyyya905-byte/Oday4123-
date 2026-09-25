import * as React from 'react';
import { DayPicker } from 'react-day-picker';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';
import { arSA, enUS } from 'date-fns/locale';

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  language?: 'ar' | 'en';
};

export const Calendar: React.FC<CalendarProps> = ({
  className = '',
  classNames,
  showOutsideDays = true,
  language = 'ar',
  locale,
  dir,
  ...props
}) => {
  const activeLocale = locale || (language === 'ar' ? arSA : enUS);
  const activeDir = dir || (language === 'ar' ? 'rtl' : 'ltr');
  // Middle East / Arabic accounting starts week on Saturday (6); Western locales on Sunday (0) or Monday (1)
  const defaultWeekStartsOn = language === 'ar' ? 6 : 0;

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      locale={activeLocale}
      dir={activeDir}
      weekStartsOn={props.weekStartsOn ?? defaultWeekStartsOn}
      autoFocus={props.autoFocus ?? true}
      className={`p-2 select-none ${className}`}
      classNames={{
        root: 'relative select-none focus:outline-hidden',
        months: 'flex flex-col sm:flex-row gap-4',
        month: 'space-y-3',
        month_caption: 'flex justify-center pt-1 relative items-center mb-1',
        caption_label: 'text-xs sm:text-sm font-black text-slate-900 dark:text-white',
        nav: 'flex items-center gap-1',
        button_previous:
          'absolute start-1 top-1 h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center justify-center transition-all text-slate-600 dark:text-slate-300 cursor-pointer disabled:opacity-20 focus-visible:ring-2 focus-visible:ring-amber-500',
        button_next:
          'absolute end-1 top-1 h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center justify-center transition-all text-slate-600 dark:text-slate-300 cursor-pointer disabled:opacity-20 focus-visible:ring-2 focus-visible:ring-amber-500',
        month_grid: 'w-full border-collapse space-y-1',
        weekdays: 'flex justify-between border-b border-slate-100 dark:border-slate-800/80 pb-1 mb-1',
        weekday:
          'text-slate-400 dark:text-slate-500 rounded-md w-8 sm:w-9 font-bold text-[11px] text-center',
        weeks: 'space-y-1',
        week: 'flex w-full justify-between items-center',
        day: 'h-8 sm:h-9 w-8 sm:w-9 text-center text-xs p-0 relative focus-within:relative focus-within:z-20',
        day_button:
          'h-8 sm:h-9 w-8 sm:w-9 p-0 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer flex items-center justify-center text-slate-700 dark:text-slate-200 outline-hidden focus:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500/80 focus-visible:z-20',
        range_start:
          'day-range-start !bg-amber-500 !text-slate-950 font-black !rounded-s-xl shadow-xs focus-visible:!ring-amber-600',
        range_end:
          'day-range-end !bg-amber-500 !text-slate-950 font-black !rounded-e-xl shadow-xs focus-visible:!ring-amber-600',
        range_middle:
          'day-range-middle !bg-amber-500/20 !text-amber-900 dark:!text-amber-200 font-bold !rounded-none',
        selected:
          '!bg-amber-500 !text-slate-950 font-black hover:!bg-amber-500 hover:!text-slate-950 focus:!bg-amber-500 focus:!text-slate-950',
        today:
          'font-black text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/50 rounded-xl',
        outside:
          'day-outside text-slate-300 dark:text-slate-600 opacity-40 hover:opacity-70',
        disabled: 'text-slate-300 dark:text-slate-700 opacity-30 cursor-not-allowed',
        hidden: 'invisible',
        ...classNames,
      }}
      modifiersClassNames={{
        range_start: '!bg-amber-500 !text-slate-950 font-black !rounded-s-xl shadow-xs',
        range_end: '!bg-amber-500 !text-slate-950 font-black !rounded-e-xl shadow-xs',
        range_middle: '!bg-amber-500/20 !text-amber-900 dark:!text-amber-200 font-bold !rounded-none',
        selected: '!bg-amber-500 !text-slate-950 font-black',
        today: 'font-black text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/50 rounded-xl',
      }}
      components={{
        Chevron: ({ orientation, className: chevronClass }) => {
          if (orientation === 'left') {
            return <ChevronLeft className={`h-4 w-4 ${chevronClass || ''}`} />;
          }
          if (orientation === 'right') {
            return <ChevronRight className={`h-4 w-4 ${chevronClass || ''}`} />;
          }
          if (orientation === 'up') {
            return <ChevronUp className={`h-4 w-4 ${chevronClass || ''}`} />;
          }
          return <ChevronDown className={`h-4 w-4 ${chevronClass || ''}`} />;
        },
      }}
      {...props}
    />
  );
};
