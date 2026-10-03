import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ActiveTab } from '../../types';
import {
  ReceiptText,
  Package,
  FileSpreadsheet,
  Coins,
  Grid
} from 'lucide-react';
import { SectionsNavModal } from '../modals/SectionsNavModal';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, t, cart, language } = useApp();
  const [isSectionsModalOpen, setIsSectionsModalOpen] = useState(false);

  const cartCount = cart.reduce((acc, it) => acc + it.quantity, 0);

  const navButtons = [
    {
      id: 'pos' as ActiveTab,
      label: t('navPOS'),
      icon: ReceiptText,
      badge: cartCount > 0 ? cartCount : undefined,
      onClick: () => setActiveTab('pos')
    },
    {
      id: 'products' as ActiveTab,
      label: t('navProducts'),
      icon: Package,
      onClick: () => setActiveTab('products')
    },
    {
      id: 'invoices' as ActiveTab,
      label: language === 'ar' ? 'الفواتير' : 'Invoices',
      icon: FileSpreadsheet,
      onClick: () => setActiveTab('invoices')
    },
    {
      id: 'debts' as ActiveTab,
      label: language === 'ar' ? 'الديون' : 'Debts',
      icon: Coins,
      onClick: () => setActiveTab('debts')
    }
  ];

  return (
    <>
      {/* Mobile & Tablet Apple-Glass Bottom Navigation Bar */}
      <nav className="app-bottom-nav lg:hidden fixed bottom-0 left-0 right-0 h-14 material-panel border-t z-40 px-2 flex items-center justify-around select-none">
        {navButtons.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              id={`mobile-tab-${tab.id}`}
              type="button"
              onClick={tab.onClick}
              className={`flex-1 flex flex-col items-center justify-center h-full min-h-[40px] relative transition-all cursor-pointer active:scale-95 ${
                isActive
                  ? 'text-slate-950 dark:text-white font-black'
                  : 'text-slate-500 dark:text-slate-400 font-medium hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600 dark:text-blue-400 scale-105' : ''} transition-transform`} />
                {tab.badge !== undefined && (
                  <span className="absolute -top-1.5 -end-2.5 min-w-[16px] h-4 px-1 bg-blue-600 text-white text-[9px] font-black font-mono rounded-full flex items-center justify-center shadow-2xs">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 truncate max-w-[72px] whitespace-nowrap">{tab.label}</span>
            </button>
          );
        })}

        {/* Single Unified Sections Navigator Button (الأقسام) */}
        <button
          id="mobile-tab-sections"
          type="button"
          onClick={() => setIsSectionsModalOpen(true)}
          className="flex-1 flex flex-col items-center justify-center h-full min-h-[40px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer active:scale-95 transition-all"
        >
          <div className="relative flex items-center justify-center">
            <Grid className="w-5 h-5 text-slate-700 dark:text-slate-200" />
          </div>
          <span className="text-[10px] mt-0.5 font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
            {language === 'ar' ? 'الأقسام' : 'Sections'}
          </span>
        </button>
      </nav>

      {/* Sections Navigator Modal */}
      <SectionsNavModal
        isOpen={isSectionsModalOpen}
        onClose={() => setIsSectionsModalOpen(false)}
      />
    </>
  );
};
