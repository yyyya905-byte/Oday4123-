import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { indexedDbService, formatStorageSize, StoragePurgeCandidateReport } from '../../services/indexedDbService';
import { HardDrive, AlertTriangle, ShieldAlert, Sparkles, X, ChevronLeft } from 'lucide-react';
import { soundEffects } from '../../services/audio';

interface StorageProactiveAlertToastProps {
  onOpenCleanupModal: () => void;
}

export const StorageProactiveAlertToast: React.FC<StorageProactiveAlertToastProps> = ({
  onOpenCleanupModal
}) => {
  const { sales, isOnline } = useApp();
  const [report, setReport] = useState<StoragePurgeCandidateReport | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('kian_storage_alert_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  const checkStorageHealth = async () => {
    try {
      const rep = await indexedDbService.getStoragePurgeReport(sales);
      setReport(rep);

      if (rep.isWarning && !isDismissed) {
        setIsVisible(true);
        try {
          soundEffects.playWarning();
        } catch {}
      } else if (!rep.isWarning) {
        setIsVisible(false);
      }
    } catch (err) {
      // Ignored
    }
  };

  useEffect(() => {
    checkStorageHealth();
    // Re-check periodically every 60 seconds
    const interval = setInterval(checkStorageHealth, 60000);
    return () => clearInterval(interval);
  }, [sales, isDismissed]);

  if (!isVisible || !report || !report.isWarning) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    try {
      sessionStorage.setItem('kian_storage_alert_dismissed', 'true');
      setIsDismissed(true);
    } catch {}
  };

  const handleOpenReport = () => {
    setIsVisible(false);
    onOpenCleanupModal();
  };

  const isCritical = report.isCritical;

  return (
    <aside
      aria-label="تنبيه استباقي لمساحة التخزين"
      dir="rtl"
      className="fixed bottom-20 sm:bottom-6 start-3 sm:start-6 z-50 max-w-sm sm:max-w-md w-[calc(100vw-1.5rem)] animate-in slide-in-from-bottom-5 duration-300 select-none shadow-2xl rounded-3xl overflow-hidden border backdrop-blur-md bg-slate-900/95 border-amber-500/40 text-white"
    >
      {/* Top accent bar */}
      <div className={`h-1.5 w-full ${isCritical ? 'bg-rose-500' : 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600'}`} />

      <div className="p-4 space-y-3">
        {/* Header & Close */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold shadow-md shrink-0 ${
              isCritical ? 'bg-rose-500 text-white' : 'bg-amber-500 text-slate-950'
            }`}>
              {isCritical ? <ShieldAlert className="w-5 h-5 animate-pulse" /> : <HardDrive className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-white">
                  تنبيه استباقي: امتلاء سعة الذاكرة
                </span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  isCritical ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}>
                  {report.percentUsed}%
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                {report.statusMessageAr}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            title="إخفاء التنبيه مؤقتاً"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Insight Meter */}
        <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between text-[11px]">
          <span className="text-slate-400">
            المساحة القابلة للتفريغ فوراً:
          </span>
          <span className="font-mono font-black text-cyan-300">
            ~ {formatStorageSize(report.totalCleanableBytes)}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-0.5">
          <button
            type="button"
            onClick={handleOpenReport}
            className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>عرض التقرير الذكي والتنظيف</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
          >
            لاحقاً
          </button>
        </div>
      </div>
    </aside>
  );
};
