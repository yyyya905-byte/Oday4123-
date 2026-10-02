import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  indexedDbService,
  formatStorageSize,
  StoragePurgeCandidateReport,
  PurgeOptions,
  PurgeExecutionResult,
  downloadJsonBackup
} from '../../services/indexedDbService';
import {
  HardDrive,
  Trash2,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Download,
  RefreshCw,
  X,
  Sparkles,
  ShieldAlert,
  Sliders
} from 'lucide-react';
import { soundEffects } from '../../services/audio';

interface StorageCleanupReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StorageCleanupReportModal: React.FC<StorageCleanupReportModalProps> = ({
  isOpen,
  onClose
}) => {
  const { sales, notify, language } = useApp();

  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<StoragePurgeCandidateReport | null>(null);
  const [isPurging, setIsPurging] = useState(false);

  // Purge Options State
  const [purgeSales, setPurgeSales] = useState<boolean>(true);
  const [salesAgeDays, setSalesAgeDays] = useState<30 | 60 | 90>(30);
  const [purgeQueue, setPurgeQueue] = useState<boolean>(true);
  const [purgeTransfers, setPurgeTransfers] = useState<boolean>(true);
  const [purgeAuditLogs, setPurgeAuditLogs] = useState<boolean>(true);

  // Confirmation Modal State
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
  const [lastPurgeResult, setLastPurgeResult] = useState<PurgeExecutionResult | null>(null);

  // Simulation mode state
  const [isSimulated, setIsSimulated] = useState<boolean>(() => {
    try {
      return localStorage.getItem('kian_simulate_low_storage') === 'true';
    } catch {
      return false;
    }
  });

  const loadReport = async () => {
    setLoading(true);
    try {
      const rep = await indexedDbService.getStoragePurgeReport(sales);
      setReport(rep);
    } catch (err) {
      console.warn('Failed to load storage report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadReport();
    }
  }, [isOpen, sales]);

  if (!isOpen) return null;

  // Toggle low storage simulation for testing proactive warning
  const handleToggleSimulation = async () => {
    const nextVal = !isSimulated;
    setIsSimulated(nextVal);
    if (nextVal) {
      localStorage.setItem('kian_simulate_low_storage', 'true');
      notify('تم تفعيل وضع محاكاة الذاكرة المنخفضة', 'تم تعيين نسبة استهلاك IndexedDB إلى 86% لاختبار التنبيه الاستباقي', 'info');
    } else {
      localStorage.removeItem('kian_simulate_low_storage');
      notify('تم إيقاف محاكاة الذاكرة', 'تمت العودة لقراءة الحصة التخزينية الحقيقية من المتصفح', 'success');
    }
    await loadReport();
  };

  // Calculate selected estimated freed bytes
  let estimatedFreedBytes = 0;
  let estimatedFreedItemsCount = 0;

  if (report) {
    if (purgeSales) {
      const salesGroup = salesAgeDays === 90 
        ? report.syncedSales.olderThan90Days 
        : salesAgeDays === 60 
        ? report.syncedSales.olderThan60Days 
        : report.syncedSales.olderThan30Days;
      estimatedFreedBytes += salesGroup.bytes;
      estimatedFreedItemsCount += salesGroup.count;
    }

    if (purgeQueue && report.syncedQueue) {
      estimatedFreedBytes += report.syncedQueue.bytes;
      estimatedFreedItemsCount += report.syncedQueue.count;
    }

    if (purgeTransfers && report.expiredTransfers) {
      estimatedFreedBytes += report.expiredTransfers.bytes;
      estimatedFreedItemsCount += report.expiredTransfers.count;
    }

    if (purgeAuditLogs && report.oldAuditLogs) {
      estimatedFreedBytes += report.oldAuditLogs.bytes;
      estimatedFreedItemsCount += report.oldAuditLogs.count;
    }
  }

  // Backup candidates before deletion
  const handleDownloadBackupCandidateSales = () => {
    if (!report) return;
    const salesGroup = salesAgeDays === 90 
      ? report.syncedSales.olderThan90Days 
      : salesAgeDays === 60 
      ? report.syncedSales.olderThan60Days 
      : report.syncedSales.olderThan30Days;

    if (salesGroup.sales.length === 0) {
      notify('لا توجد فواتير', 'لا توجد فواتير قديمة ضمن النطاق الزمني المحدد لتصديرها', 'info');
      return;
    }

    downloadJsonBackup({
      exportReason: `نسخة احتياطية للفواتير المؤرشفة الأقدم من ${salesAgeDays} يوماً قبل التنظيف`,
      exportedAt: new Date().toISOString(),
      salesCount: salesGroup.sales.length,
      sales: salesGroup.sales
    }, `kian_archived_sales_${salesAgeDays}days`);

    notify('تم تنزيل النسخة الاحتياطية', `تم حفظ ملف JSON يحتوي على ${salesGroup.sales.length} فاتورة بأمان على جهازك`, 'success');
  };

  // Perform purge execution
  const handleConfirmPurge = async () => {
    setIsPurging(true);
    setShowConfirmDialog(false);

    try {
      const options: PurgeOptions = {
        purgeSalesOlderThanDays: purgeSales ? salesAgeDays : null,
        purgeSyncedQueue: purgeQueue,
        purgeExpiredTransfers: purgeTransfers,
        purgeOldAuditLogs: purgeAuditLogs,
      };

      const result = await indexedDbService.executePurge(options, sales);
      setLastPurgeResult(result);

      try {
        soundEffects.playSuccess();
      } catch {}

      notify('اكتمل التنظيف الذكي', result.messageAr, 'success');
      await loadReport();
    } catch (err: any) {
      notify('فشل التنظيف', err?.message || 'حدث خطأ أثناء محاولة تفريغ البيانات', 'error');
    } finally {
      setIsPurging(false);
    }
  };

  const percentUsed = report?.percentUsed ?? 0;
  const isWarning = report?.isWarning ?? false;
  const isCritical = report?.isCritical ?? false;

  const currentStatusTheme = isCritical
    ? {
        border: 'border-rose-500/40',
        bg: 'bg-rose-500/10 dark:bg-rose-950/20',
        badge: 'bg-rose-500 text-white',
        text: 'text-rose-600 dark:text-rose-400',
        progress: 'bg-rose-500',
        icon: ShieldAlert,
        label: 'حالة حرجة (اقتراب الامتلاء الكامل)'
      }
    : isWarning
    ? {
        border: 'border-amber-500/40',
        bg: 'bg-amber-500/10 dark:bg-amber-950/20',
        badge: 'bg-amber-500 text-slate-950 font-bold',
        text: 'text-amber-600 dark:text-amber-400',
        progress: 'bg-amber-500',
        icon: AlertTriangle,
        label: 'تنبيه استباقي (يُوصى بالتنظيف)'
      }
    : {
        border: 'border-emerald-500/30',
        bg: 'bg-emerald-500/10 dark:bg-emerald-950/20',
        badge: 'bg-emerald-600 text-white',
        text: 'text-emerald-600 dark:text-emerald-400',
        progress: 'bg-emerald-500',
        icon: ShieldCheck,
        label: 'حالة ممتازة ومستقرة'
      };

  const StatusIcon = currentStatusTheme.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-900 dark:text-slate-100"
        dir="rtl"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shadow-md ${
              isCritical 
                ? 'bg-rose-500 text-white shadow-rose-500/20' 
                : isWarning 
                ? 'bg-amber-500 text-slate-950 shadow-amber-500/20' 
                : 'bg-cyan-500 text-slate-950 shadow-cyan-500/20'
            }`}>
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                  تقرير استهلاك الذاكرة والتنظيف الذكي
                </h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${currentStatusTheme.badge}`}>
                  IndexedDB
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                مراقبة سعة التخزين المحلي واقتراح تفريغ السجلات المزامنة القديمة بأمان
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={loadReport}
              disabled={loading}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="إعادة فحص المساحة الآن"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Storage Meter & Proactive Status Banner */}
          <div className={`p-4 rounded-2xl border ${currentStatusTheme.border} ${currentStatusTheme.bg} space-y-3`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <StatusIcon className={`w-5 h-5 shrink-0 ${currentStatusTheme.text}`} />
                <div>
                  <span className={`text-xs font-black block ${currentStatusTheme.text}`}>
                    {currentStatusTheme.label}
                  </span>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    {report?.statusMessageAr || 'جارِ فحص السعة التخزينية...'}
                  </p>
                </div>
              </div>

              {/* Simulation Mode Toggle Button */}
              <button
                type="button"
                onClick={handleToggleSimulation}
                className={`self-start sm:self-auto text-[11px] font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSimulated
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs'
                    : 'bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
                title="تفعيل أو إلغاء محاكاة امتلاء الذاكرة لتجربة التنبيه الاستباقي"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>{isSimulated ? 'إيقاف المحاكاة (مفعلة 86%)' : 'تجربة محاكاة التنبيه (86%)'}</span>
              </button>
            </div>

            {/* Storage Progress Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs font-mono font-bold">
                <span className="text-slate-600 dark:text-slate-300">
                  المستخدم: <strong className="text-slate-900 dark:text-white">{formatStorageSize(report?.usageBytes || 0)}</strong>
                </span>
                <span className={currentStatusTheme.text}>
                  {percentUsed}% ممتلئ
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  الحصة: <strong className="text-slate-800 dark:text-slate-200">{formatStorageSize(report?.quotaBytes || 0)}</strong>
                </span>
              </div>

              <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden p-0.5">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${currentStatusTheme.progress}`}
                  style={{ width: `${Math.min(100, Math.max(4, percentUsed))}%` }}
                />
              </div>

              <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                <span>المساحة المتبقية المقدرة: <strong className="font-mono text-emerald-600 dark:text-emerald-400">{formatStorageSize(report?.freeBytes || 0)}</strong></span>
                <span>المساحة القابلة للتحرير الفوري: <strong className="font-mono text-cyan-600 dark:text-cyan-400">{formatStorageSize(report?.totalCleanableBytes || 0)}</strong></span>
              </div>
            </div>
          </div>

          {/* Success Banner if Purge completed just now */}
          {lastPurgeResult && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-start gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold block mb-0.5">نجحت عملية التنظيف!</span>
                <p>{lastPurgeResult.messageAr}</p>
              </div>
            </div>
          )}

          {/* Smart Candidates Checklist Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>البيانات المرشحة للتنظيف والمسح بأمان</span>
              </h4>
              <span className="text-[11px] text-slate-500">
                حدد البنود المراد تفريغها
              </span>
            </div>

            <div className="space-y-2.5">
              {/* Candidate 1: Synced & Completed Sales */}
              <div className={`p-4 rounded-2xl border transition-all ${
                purgeSales 
                  ? 'border-amber-500/40 bg-amber-50/30 dark:bg-amber-950/10' 
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 opacity-70'
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <label className="flex items-start gap-3 cursor-pointer select-none flex-1">
                    <input
                      type="checkbox"
                      checked={purgeSales}
                      onChange={(e) => setPurgeSales(e.target.checked)}
                      className="mt-1 w-4 h-4 accent-amber-500 rounded"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          سجلات المبيعات والفواتير المكتملة والمزامنة القديمة
                        </span>
                        <span className="text-[10px] px-2 py-0.2 rounded-full font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                          آمن تماماً
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        فواتير مكتملة تم رفعها ومزامنتها بنجاح مع السيرفر أو تمت معالجتها بالكامل. لا يمس الفواتير غير المزامنة.
                      </p>
                    </div>
                  </label>

                  {/* Age Selector */}
                  {purgeSales && (
                    <div className="shrink-0 flex flex-col items-end gap-1.5">
                      <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                        <button
                          type="button"
                          onClick={() => setSalesAgeDays(30)}
                          className={`px-2 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                            salesAgeDays === 30 ? 'bg-amber-500 text-slate-950' : 'text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          &gt; 30 يوم
                        </button>
                        <button
                          type="button"
                          onClick={() => setSalesAgeDays(60)}
                          className={`px-2 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                            salesAgeDays === 60 ? 'bg-amber-500 text-slate-950' : 'text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          &gt; 60 يوم
                        </button>
                        <button
                          type="button"
                          onClick={() => setSalesAgeDays(90)}
                          className={`px-2 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                            salesAgeDays === 90 ? 'bg-amber-500 text-slate-950' : 'text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          &gt; 90 يوم
                        </button>
                      </div>

                      <div className="text-[11px] font-mono text-slate-600 dark:text-slate-300 flex items-center gap-1">
                        <span>المحدد:</span>
                        <strong className="text-amber-600 dark:text-amber-400">
                          {salesAgeDays === 90 
                            ? report?.syncedSales.olderThan90Days.count 
                            : salesAgeDays === 60 
                            ? report?.syncedSales.olderThan60Days.count 
                            : report?.syncedSales.olderThan30Days.count || 0} فاتورة
                        </strong>
                        <span>({formatStorageSize(
                          salesAgeDays === 90 
                            ? report?.syncedSales.olderThan90Days.bytes || 0
                            : salesAgeDays === 60 
                            ? report?.syncedSales.olderThan60Days.bytes || 0
                            : report?.syncedSales.olderThan30Days.bytes || 0
                        )})</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Pre-deletion Backup Button */}
                {purgeSales && (
                  <div className="mt-2.5 pt-2.5 border-t border-amber-200/50 dark:border-amber-900/40 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-500">
                      هل ترغب بتأمين فواتيرك قبل حذفها؟
                    </span>
                    <button
                      type="button"
                      onClick={handleDownloadBackupCandidateSales}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-amber-500 text-[11px] font-bold transition-all cursor-pointer shadow-2xs"
                    >
                      <Download className="w-3.5 h-3.5 text-amber-500" />
                      <span>تنزيل نسخة احتياطية (JSON) للفواتير المحددة</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Candidate 2: Synced Queue Items */}
              <div className={`p-4 rounded-2xl border transition-all ${
                purgeQueue 
                  ? 'border-cyan-500/40 bg-cyan-50/30 dark:bg-cyan-950/10' 
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 opacity-70'
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <label className="flex items-start gap-3 cursor-pointer select-none flex-1">
                    <input
                      type="checkbox"
                      checked={purgeQueue}
                      onChange={(e) => setPurgeQueue(e.target.checked)}
                      className="mt-1 w-4 h-4 accent-cyan-500 rounded"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          المعاملات المنجزة والمرفوعة في طابور الأوفلاين
                        </span>
                        <span className="text-[10px] px-2 py-0.2 rounded-full font-bold bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30">
                          مزامنة مسبقاً
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        معاملات مبيعات وديون ومصروفات تم ترحيلها بنجاح واكتملت مزامنتها مع الخادم المركزي.
                      </p>
                    </div>
                  </label>

                  <div className="text-end font-mono text-xs">
                    <span className="font-bold text-cyan-600 dark:text-cyan-400 block">
                      {report?.syncedQueue.count || 0} معاملة
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {formatStorageSize(report?.syncedQueue.bytes || 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Candidate 3: Expired Device Transfer Packages */}
              <div className={`p-4 rounded-2xl border transition-all ${
                purgeTransfers 
                  ? 'border-indigo-500/40 bg-indigo-50/30 dark:bg-indigo-950/10' 
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 opacity-70'
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <label className="flex items-start gap-3 cursor-pointer select-none flex-1">
                    <input
                      type="checkbox"
                      checked={purgeTransfers}
                      onChange={(e) => setPurgeTransfers(e.target.checked)}
                      className="mt-1 w-4 h-4 accent-indigo-500 rounded"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          حزم مشاركة ونقل البيانات بين الأجهزة المنتهية
                        </span>
                        <span className="text-[10px] px-2 py-0.2 rounded-full font-bold bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                          منتهية الصلاحية
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        حزم النقل عبر الأكواد المؤقتة (PIN) التي تجاوزت مدة صلاحيتها الزمنية ولم تعد مستخدمة.
                      </p>
                    </div>
                  </label>

                  <div className="text-end font-mono text-xs">
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 block">
                      {report?.expiredTransfers.count || 0} حزمة
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {formatStorageSize(report?.expiredTransfers.bytes || 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Candidate 4: Old Audit Logs */}
              <div className={`p-4 rounded-2xl border transition-all ${
                purgeAuditLogs 
                  ? 'border-emerald-500/40 bg-emerald-50/30 dark:bg-emerald-950/10' 
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 opacity-70'
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <label className="flex items-start gap-3 cursor-pointer select-none flex-1">
                    <input
                      type="checkbox"
                      checked={purgeAuditLogs}
                      onChange={(e) => setPurgeAuditLogs(e.target.checked)}
                      className="mt-1 w-4 h-4 accent-emerald-500 rounded"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          سجلات تدقيق النشاط والحركات القديمة (&gt; 30 يوماً)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        سجلات تتبع عمليات تسجيل الدخول والتعديلات على المنتجات والفواتير التي مضى عليها أكثر من شهر.
                      </p>
                    </div>
                  </label>

                  <div className="text-end font-mono text-xs">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 block">
                      {report?.oldAuditLogs.count || 0} سجل
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {formatStorageSize(report?.oldAuditLogs.bytes || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer with Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
            <span className="text-xs text-slate-500">المساحة المتوقع تحريرها:</span>
            <span className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              +{formatStorageSize(estimatedFreedBytes)}
            </span>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              ({estimatedFreedItemsCount} عنصر)
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs transition-colors cursor-pointer"
            >
              إلغاء
            </button>

            <button
              type="button"
              disabled={isPurging || estimatedFreedItemsCount === 0}
              onClick={() => setShowConfirmDialog(true)}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-rose-600/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" />
              <span>{isPurging ? 'جارِ التنظيف...' : 'تنفيذ التنظيف الذكي الآن'}</span>
            </button>
          </div>
        </div>

        {/* Confirmation Dialog */}
        {showConfirmDialog && (
          <div className="absolute inset-0 z-60 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    تأكيد تنفيذ عملية التنظيف
                  </h4>
                  <p className="text-xs text-slate-500">
                    يرجى مراجعة تفاصيل الحذف قبل التطبيق النهائي
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">إجمالي العناصر المراد مسحها:</span>
                  <strong className="text-slate-900 dark:text-white font-mono">{estimatedFreedItemsCount} عنصر</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">المساحة المحررة المتوقعة:</span>
                  <strong className="text-emerald-600 dark:text-emerald-400 font-mono">~ {formatStorageSize(estimatedFreedBytes)}</strong>
                </div>
                {purgeSales && (
                  <div className="flex justify-between text-[11px] text-amber-600 dark:text-amber-400 pt-1 border-t border-slate-200 dark:border-slate-700">
                    <span>الفواتير المشمولة:</span>
                    <span>المكتملة الأقدم من {salesAgeDays} يوماً فقط</span>
                  </div>
                )}
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                هل أنت متأكد من رغبتك في حذف هذه السجلات القديمة من الذاكرة المحلية؟ لن تتأثر العمليات الحديثة أو الفواتير المعلقة.
              </p>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmDialog(false)}
                  className="flex-1 py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs cursor-pointer"
                >
                  تراجع
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPurge}
                  className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/20 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>تأكيد الحذف وتحرير المساحة</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
