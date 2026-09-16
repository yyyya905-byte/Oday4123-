import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { indexedDbService, formatStorageSize, StorageStats } from '../../services/indexedDbService';
import {
  HardDrive,
  Database,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  Layers,
  ShoppingBag,
  Users,
  Receipt,
  WifiOff,
  Wifi,
  CheckCircle2,
  ArrowLeftRight,
  Info
} from 'lucide-react';

interface DataUsageSummaryWidgetProps {
  compact?: boolean;
  className?: string;
  onOpenDataTransfer?: () => void;
}

export const DataUsageSummaryWidget: React.FC<DataUsageSummaryWidgetProps> = ({
  compact = false,
  className = '',
  onOpenDataTransfer
}) => {
  const {
    offlineQueueCount,
    isSyncingOffline,
    syncOfflineQueueNow,
    isOnline,
    language,
    t
  } = useApp();

  const [stats, setStats] = useState<StorageStats | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStats = async () => {
    setIsRefreshing(true);
    try {
      const data = await indexedDbService.getStorageStats();
      setStats(data);
    } catch {
      // Ignored
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const timer = setInterval(fetchStats, 15000);
    return () => clearInterval(timer);
  }, [offlineQueueCount]);

  const usedBytes = stats?.usageBytes || 0;
  const formattedSize = formatStorageSize(usedBytes);

  return (
    <div className={`relative font-sans select-none ${className}`}>
      {/* Main compact pill/bar */}
      <div className="flex items-center gap-2 py-1 px-2 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 text-white transition-all shadow-xs">
        {/* Storage Size Indicator */}
        <div 
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 cursor-pointer hover:text-cyan-300 transition-colors"
          title="انقر لعرض تفاصيل استهلاك التخزين المحلي والعمليات المعلقة"
        >
          <HardDrive className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <div className="flex items-center gap-1 text-[11px]">
            <span className="text-slate-300 hidden sm:inline">
              {language === 'ar' ? 'تخزين IndexedDB:' : 'IndexedDB:'}
            </span>
            <span className="font-mono font-black text-cyan-300">
              {formattedSize}
            </span>
          </div>
        </div>

        <span className="text-slate-600 text-xs">|</span>

        {/* Pending Transactions Indicator */}
        <div 
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 cursor-pointer hover:text-amber-300 transition-colors"
          title={`${offlineQueueCount} عمليات معلقة بانتظار المزامنة`}
        >
          <Database className={`w-3.5 h-3.5 shrink-0 ${offlineQueueCount > 0 ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}`} />
          <div className="flex items-center gap-1 text-[11px]">
            <span className="text-slate-300">
              {language === 'ar' ? 'معلقة:' : 'Pending:'}
            </span>
            <span className={`font-mono font-black ${offlineQueueCount > 0 ? 'text-amber-400 font-bold px-1.5 py-0.2 rounded-full bg-amber-500/20 border border-amber-500/40' : 'text-emerald-400'}`}>
              {offlineQueueCount}
            </span>
          </div>
        </div>

        {/* Details Toggle Button */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-0.5 rounded-md hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="عرض تفاصيل التخزين"
        >
          {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Expanded Details Popover */}
      {isExpanded && (
        <div className="absolute bottom-full mb-2 start-0 w-72 sm:w-80 rounded-2xl bg-slate-900 border border-slate-700/90 shadow-2xl p-3.5 text-white z-50 animate-in fade-in slide-in-from-bottom-2">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-800">
            <div className="flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-black">
                {language === 'ar' ? 'استهلاك البيانات وقاعدة بيانات أوفلاين' : 'Data Usage & Local Storage'}
              </span>
            </div>
            <button
              type="button"
              onClick={fetchStats}
              disabled={isRefreshing}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
              title="تحديث الإحصائيات"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
              <span className="text-[10px] text-slate-400 block mb-0.5">
                {language === 'ar' ? 'المساحة المستخدمة' : 'Used Storage'}
              </span>
              <span className="text-sm font-black font-mono text-cyan-300">
                {formattedSize}
              </span>
              {stats?.percentUsed ? (
                <span className="text-[9px] text-slate-400 block mt-0.5">
                  {stats.percentUsed}% {language === 'ar' ? 'من الحصة المقدرة' : 'of quota'}
                </span>
              ) : null}
            </div>

            <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
              <span className="text-[10px] text-slate-400 block mb-0.5">
                {language === 'ar' ? 'عمليات بانتظار المزامنة' : 'Pending Mutations'}
              </span>
              <span className={`text-sm font-black font-mono ${offlineQueueCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {offlineQueueCount} {language === 'ar' ? 'معاملة' : 'tx'}
              </span>
              <span className="text-[9px] text-slate-400 block mt-0.5">
                {offlineQueueCount > 0 ? (language === 'ar' ? 'مضغوطة وجاهزة للرفع' : 'Batched & ready') : (language === 'ar' ? 'كافة البيانات متزامنة' : 'All synced')}
              </span>
            </div>
          </div>

          {/* Stored Entities Breakdown */}
          <div className="space-y-1.5 bg-slate-950/60 p-2 rounded-xl border border-slate-800 text-[11px] mb-3">
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1.5 text-slate-400">
                <ShoppingBag className="w-3 h-3 text-amber-400" />
                <span>{language === 'ar' ? 'المنتجات والأسعار المحفوظة:' : 'Cached Products:'}</span>
              </span>
              <span className="font-mono font-bold text-white">{stats?.productsCount ?? 0}</span>
            </div>

            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Users className="w-3 h-3 text-blue-400" />
                <span>{language === 'ar' ? 'العملاء ودفاتر الديون:' : 'Cached Customers:'}</span>
              </span>
              <span className="font-mono font-bold text-white">{stats?.customersCount ?? 0}</span>
            </div>

            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Receipt className="w-3 h-3 text-emerald-400" />
                <span>{language === 'ar' ? 'فواتير المبيعات المحلية:' : 'Stored Invoices:'}</span>
              </span>
              <span className="font-mono font-bold text-white">{stats?.salesCount ?? 0}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            {isOnline && offlineQueueCount > 0 && (
              <button
                type="button"
                onClick={syncOfflineQueueNow}
                disabled={isSyncingOffline}
                className="flex-1 py-1.5 px-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingOffline ? 'animate-spin' : ''}`} />
                <span>{isSyncingOffline ? (language === 'ar' ? 'جارِ المزامنة...' : 'Syncing...') : (language === 'ar' ? 'مزامنة المعاملات الآن' : 'Sync Batch Now')}</span>
              </button>
            )}

            {onOpenDataTransfer && (
              <button
                type="button"
                onClick={() => {
                  setIsExpanded(false);
                  onOpenDataTransfer();
                }}
                className="py-1.5 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                title="نقل وتصدير البيانات لجهاز آخر"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-400" />
                <span>{language === 'ar' ? 'نقل بكود' : 'Transfer'}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
