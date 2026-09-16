import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ActiveTab } from '../../types';
import {
  ReceiptText,
  Package,
  FileSpreadsheet,
  Wrench,
  Grid
} from 'lucide-react';
import { ToolsHubModal } from '../modals/ToolsHubModal';
import { SectionsNavModal } from '../modals/SectionsNavModal';
import { ExchangeBulletinModal } from '../currency/ExchangeBulletinModal';
import { BarcodeDesignerModal } from '../barcode/BarcodeDesignerModal';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, t, cart } = useApp();
  const [isToolsModalOpen, setIsToolsModalOpen] = useState(false);
  const [isSectionsModalOpen, setIsSectionsModalOpen] = useState(false);
  const [isBulletinModalOpen, setIsBulletinModalOpen] = useState(false);
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);

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
      label: 'الفواتير',
      icon: FileSpreadsheet,
      onClick: () => setActiveTab('invoices')
    }
  ];

  return (
    <>
      {/* Mobile & Tablet Bottom Navigation Bar */}
      <nav className="app-bottom-nav lg:hidden fixed bottom-0 left-0 right-0 h-15 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800/80 z-40 px-1 flex items-center justify-around shadow-lg select-none">
        {navButtons.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              id={`mobile-tab-${tab.id}`}
              type="button"
              onClick={tab.onClick}
              className={`flex-1 flex flex-col items-center justify-center h-full relative transition-all cursor-pointer active:scale-95 ${
                isActive
                  ? 'text-amber-600 dark:text-amber-400 font-black'
                  : 'text-slate-500 dark:text-slate-400 font-medium'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
                {tab.badge !== undefined && (
                  <span className="absolute -top-1.5 -end-2 w-4 h-4 bg-amber-500 text-slate-950 text-[9px] font-black rounded-full flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 truncate max-w-[65px]">{tab.label}</span>
            </button>
          );
        })}

        {/* Tools Menu Button (قائمة الأدوات) */}
        <button
          id="mobile-tab-tools"
          type="button"
          onClick={() => setIsToolsModalOpen(true)}
          className="flex-1 flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400 cursor-pointer active:scale-95 transition-transform"
        >
          <div className="relative">
            <Wrench className="w-5 h-5 text-amber-500" />
          </div>
          <span className="text-[10px] mt-0.5 font-bold text-slate-700 dark:text-slate-300">الأدوات</span>
        </button>

        {/* Sections Navigator Button (الأقسام) */}
        <button
          id="mobile-tab-sections"
          type="button"
          onClick={() => setIsSectionsModalOpen(true)}
          className="flex-1 flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400 cursor-pointer active:scale-95 transition-transform"
        >
          <div className="relative">
            <Grid className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </div>
          <span className="text-[10px] mt-0.5 font-bold text-slate-700 dark:text-slate-300">الأقسام</span>
        </button>
      </nav>

      {/* Mobile Modals */}
      <ToolsHubModal
        isOpen={isToolsModalOpen}
        onClose={() => setIsToolsModalOpen(false)}
        onOpenBulletin={() => setIsBulletinModalOpen(true)}
        onOpenBarcodeDesigner={() => setIsBarcodeModalOpen(true)}
      />

      <SectionsNavModal
        isOpen={isSectionsModalOpen}
        onClose={() => setIsSectionsModalOpen(false)}
      />

      {isBulletinModalOpen && (
        <ExchangeBulletinModal
          isOpen={isBulletinModalOpen}
          onClose={() => setIsBulletinModalOpen(false)}
        />
      )}

      {isBarcodeModalOpen && (
        <BarcodeDesignerModal
          isOpen={isBarcodeModalOpen}
          onClose={() => setIsBarcodeModalOpen(false)}
        />
      )}
    </>
  );
};
