import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Sparkles,
  Sliders,
  ReceiptText,
  ScanBarcode,
  Wrench,
  Info,
  X,
  Plus,
  Coins,
  Sun,
  Moon
} from 'lucide-react';
import { haptics } from '../../services/haptics';

interface FloatingActionHubProps {
  onOpenBarcodeScanner?: () => void;
  onOpenBulletinModal?: () => void;
}

export const FloatingActionHub: React.FC<FloatingActionHubProps> = () => {
  const {
    settings,
    setActiveTab,
    setIsButtonCustomizerModalOpen,
    toggleTheme,
    theme,
    language
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);

  const layout = settings.buttonLayout;
  if (!layout || layout.floatingActionEnabled === false || layout.floatingActionPosition === 'hidden') {
    return null;
  }

  const posClass = {
    'bottom-right': 'bottom-20 right-4 sm:bottom-6 sm:right-6',
    'bottom-left': 'bottom-20 left-4 sm:bottom-6 sm:left-6',
    'top-right': 'top-20 right-4 sm:top-20 sm:right-6',
    'top-left': 'top-20 left-4 sm:top-20 sm:left-6'
  }[layout.floatingActionPosition] || 'bottom-20 right-4 sm:bottom-6 sm:right-6';

  return (
    <div className={`fixed z-40 ${posClass} select-none print:hidden flex flex-col items-center`}>
      {/* Expanded Quick Dial Menu */}
      {isOpen && (
        <div className="mb-3 flex flex-col items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          {/* 1. Customize Buttons */}
          <button
            type="button"
            onClick={() => {
              haptics.buttonPress();
              setIsOpen(false);
              setIsButtonCustomizerModalOpen(true);
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 shadow-xl hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-all cursor-pointer group text-xs font-black"
            title="تخصيص وترتيب مواقع الأزرار"
          >
            <span className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:rotate-45 transition-transform">
              <Sliders className="w-3.5 h-3.5" />
            </span>
            <span>{language === 'ar' ? 'تخصيص الأزرار' : 'Customize Buttons'}</span>
          </button>

          {/* 2. Open Changelog / About */}
          <button
            type="button"
            onClick={() => {
              haptics.buttonPress();
              setIsOpen(false);
              setActiveTab('about');
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 shadow-xl hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-all cursor-pointer group text-xs font-black"
            title="سجل التحسينات والدليل"
          >
            <span className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <span>{language === 'ar' ? 'سجل التحسينات' : 'What\'s New'}</span>
          </button>

          {/* 3. Quick Cashier POS */}
          <button
            type="button"
            onClick={() => {
              haptics.buttonPress();
              setIsOpen(false);
              setActiveTab('pos');
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 shadow-xl hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-all cursor-pointer group text-xs font-black"
            title="شاشة الكاشير"
          >
            <span className="w-7 h-7 rounded-xl bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <ReceiptText className="w-3.5 h-3.5" />
            </span>
            <span>{language === 'ar' ? 'شاشة الكاشير' : 'POS Register'}</span>
          </button>

          {/* 4. Quick Theme Switcher */}
          <button
            type="button"
            onClick={() => {
              haptics.buttonPress();
              toggleTheme();
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 shadow-xl hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-all cursor-pointer group text-xs font-black"
            title="تبديل المظهر الليلي والنهاري"
          >
            <span className="w-7 h-7 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </span>
            <span>{theme === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي'}</span>
          </button>
        </div>
      )}

      {/* Main Floating Trigger Button */}
      <button
        id="btn-floating-action-hub"
        type="button"
        onClick={() => {
          haptics.buttonPress();
          setIsOpen(!isOpen);
        }}
        className={`w-12 h-12 rounded-2xl shadow-2xl flex items-center justify-center transition-all transform active:scale-95 cursor-pointer ${
          isOpen
            ? 'bg-rose-500 hover:bg-rose-600 text-white rotate-45'
            : 'bg-gradient-to-tr from-amber-600 to-amber-400 text-slate-950 hover:scale-105 shadow-amber-500/30'
        }`}
        title={isOpen ? 'إغلاق القائمة السريعة' : 'أدوات الوصول السريع وتخصيص الأزرار'}
      >
        {isOpen ? <Plus className="w-6 h-6" /> : <Sliders className="w-5 h-5 font-black" />}
      </button>
    </div>
  );
};
