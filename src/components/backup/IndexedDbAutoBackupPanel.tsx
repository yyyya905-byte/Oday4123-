import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  indexedDbService,
  downloadJsonBackup,
  formatStorageSize,
  IndexedDbAutoBackupConfig,
  IndexedDbBackupSnapshot,
  IndexedDbParsedRestorePreview,
  IndexedDbCleanWipeSummary,
} from '../../services/indexedDbService';
import { soundEffects } from '../../services/audio';
import {
  Database,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  FileJson,
  Trash2,
  RefreshCw,
  HardDrive,
  Sliders,
  Layers,
  Check,
  Sparkles,
  ArchiveRestore,
  FolderDown,
  History,
  X,
} from 'lucide-react';

export const IndexedDbAutoBackupPanel: React.FC = () => {
  const {
    products,
    categories,
    customers,
    sales,
    triggerIndexedDbBackupDownload,
    restoreFromIndexedDbBackup,
    resetToDemoData,
    notify,
  } = useApp();

  const [config, setConfig] = useState<IndexedDbAutoBackupConfig>(() =>
    indexedDbService.getAutoBackupConfig()
  );
  const [dbSummary, setDbSummary] = useState<IndexedDbCleanWipeSummary | null>(null);
  const [snapshotsHistory, setSnapshotsHistory] = useState<IndexedDbBackupSnapshot[]>([]);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isCreatingSnapshotOnly, setIsCreatingSnapshotOnly] = useState<boolean>(false);
  const [customBackupNote, setCustomBackupNote] = useState<string>('');

  // Restore from JSON File state
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [restorePreview, setRestorePreview] = useState<IndexedDbParsedRestorePreview | null>(null);
  const [restoreMode, setRestoreMode] = useState<'replace' | 'merge'>('replace');
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [restoreCompletedMessage, setRestoreCompletedMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Snapshot direct restore confirmation state
  const [confirmingSnapshotRestoreId, setConfirmingSnapshotRestoreId] = useState<string | null>(null);

  const loadEngineStatus = async () => {
    try {
      const [summary, history] = await Promise.all([
        indexedDbService.getCleanWipeSummary(),
        indexedDbService.getSavedAutoBackupHistory(),
      ]);
      setDbSummary(summary);
      setSnapshotsHistory(history);
      setConfig(indexedDbService.getAutoBackupConfig());
    } catch (err) {
      console.warn('Failed to load IndexedDB backup status:', err);
    }
  };

  useEffect(() => {
    loadEngineStatus();
  }, [products.length, categories.length, customers.length, sales.length]);

  const handleUpdateConfig = async (partial: Partial<IndexedDbAutoBackupConfig>) => {
    soundEffects.playClick();
    const updated = await indexedDbService.saveAutoBackupConfig(partial);
    setConfig(updated);
    notify(
      'تم تحديث إعدادات النسخ الاحتياطي الذاتي',
      updated.enabled
        ? `النسخ الاحتياطي الذاتي لـ IndexedDB نشط (كل ${updated.intervalMinutes} دقيقة)`
        : 'تم إيقاف النسخ الاحتياطي الذاتي الدوري مؤقتاً',
      'info'
    );
  };

  // 1. Trigger immediate IndexedDB -> Local JSON file download
  const handleDownloadJsonNow = async () => {
    soundEffects.playClick();
    setIsExporting(true);
    try {
      await triggerIndexedDbBackupDownload({
        triggerType: 'manual_download',
        downloadToDevice: true,
        notes: customBackupNote.trim() || 'نسخة احتياطية كاملة لـ IndexedDB بطلب المستخدم',
      });
      setCustomBackupNote('');
      await loadEngineStatus();
    } finally {
      setIsExporting(false);
    }
  };

  // 2. Create an instant internal Auto-Backup recovery point inside IndexedDB without downloading
  const handleCreateInternalSnapshot = async () => {
    soundEffects.playClick();
    setIsCreatingSnapshotOnly(true);
    try {
      const snap = await triggerIndexedDbBackupDownload({
        triggerType: 'scheduled_auto',
        downloadToDevice: false,
        notes: customBackupNote.trim() || 'نقطة استعادة ذاتية فورية محفوظة داخل IndexedDB',
      });
      if (snap) {
        soundEffects.playSuccess();
        notify(
          'تم حفظ نقطة استعادة ذاتية في IndexedDB',
          `تم تأمين ${snap.summary.totalRecordsCount} سجل داخل سجل النسخ الاحتياطي الذاتي ويمكنك تحميلها أو استعادتها بأي وقت`,
          'success'
        );
      }
      setCustomBackupNote('');
      await loadEngineStatus();
    } finally {
      setIsCreatingSnapshotOnly(false);
    }
  };

  // 3. Inspect a selected or dropped JSON file before restoring
  const processSelectedFile = (file: File) => {
    soundEffects.playClick();
    setSelectedFileName(file.name);
    setRestoreCompletedMessage(null);

    const reader = new FileReader();
    reader.onload = event => {
      const content = String(event.target?.result || '');
      const preview = indexedDbService.inspectBackupJsonForRestore(content);
      setRestorePreview(preview);
      if (preview.valid) {
        soundEffects.playSuccess();
        notify(
          'تم فحص ملف النسخة الاحتياطية بنجاح',
          `الملف "${file.name}" صالح ويحتوي على ${preview.counts.totalRecordsCount} سجل جاهز للاستعادة`,
          'info'
        );
      } else {
        soundEffects.playWarning();
        notify('ملف غير صالح للاستعادة', preview.error || 'تأكد من اختيار ملف JSON صحيح', 'error');
      }
    };
    reader.onerror = () => {
      notify('خطأ في قراءة الملف', 'تعذر قراءة الملف المختار من جهازك', 'error');
    };
    reader.readAsText(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDropFile = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  // 4. Execute Restore from the inspected JSON file
  const handleConfirmFileRestore = async () => {
    if (!restorePreview || !restorePreview.valid || !restorePreview.rawSnapshot) return;
    soundEffects.playClick();
    setIsRestoring(true);
    try {
      const ok = await restoreFromIndexedDbBackup(restorePreview.rawSnapshot, restoreMode);
      if (ok) {
        setRestoreCompletedMessage(
          `تمت استعادة البيانات بنجاح من الملف (${selectedFileName}) — تم تحديث ${restorePreview.counts.productsCount} منتج، ${restorePreview.counts.salesCount} فاتورة، و ${restorePreview.counts.customersCount} عميل في IndexedDB.`
        );
        setRestorePreview(null);
        setSelectedFileName('');
        await loadEngineStatus();
      }
    } finally {
      setIsRestoring(false);
    }
  };

  // 5. Download or Restore from a saved snapshot in IndexedDB Auto-Backup History
  const handleDownloadSavedSnapshot = (snap: IndexedDbBackupSnapshot) => {
    soundEffects.playClick();
    const fileName = downloadJsonBackup(snap, 'Kian_IndexedDB_AutoBackup');
    notify(
      'تم تحميل ملف النسخة الاحتياطية (JSON)',
      `تم تنزيل الملف (${fileName}) إلى جهازك بنجاح`,
      'success'
    );
  };

  const handleRestoreSavedSnapshot = async (snap: IndexedDbBackupSnapshot) => {
    soundEffects.playClick();
    setIsRestoring(true);
    try {
      const ok = await restoreFromIndexedDbBackup(snap, 'replace');
      if (ok) {
        setConfirmingSnapshotRestoreId(null);
        setRestoreCompletedMessage(
          `تمت استعادة قاعدة بيانات IndexedDB من النسخة الذاتية المؤرخة في ${new Date(
            snap.exportDate
          ).toLocaleString('ar-SY')} بنجاح.`
        );
        await loadEngineStatus();
      }
    } finally {
      setIsRestoring(false);
    }
  };

  const handleDeleteSnapshot = async (backupId: string) => {
    soundEffects.playClick();
    const updated = await indexedDbService.deleteAutoBackupFromHistory(backupId);
    setSnapshotsHistory(updated);
    notify('تم الحذف', 'تمت إزالة النسخة المحددة من سجل النسخ الاحتياطي الذاتي', 'info');
  };

  const formatTimestampAr = (iso: string | null) => {
    if (!iso) return 'لم يتم بعد';
    try {
      return new Date(iso).toLocaleString('ar-SY', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Hero Card: IndexedDB Auto-Backup & Local JSON Engine */}
      <div className="bg-gradient-to-l from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-5 sm:p-6 border border-indigo-500/30 shadow-xl space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center shadow-lg shrink-0">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-xl font-black">
                  محرك النسخ الاحتياطي الذاتي (Auto-Backup) واستعادة بيانات IndexedDB
                </h3>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md ${
                    config.enabled
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {config.enabled
                    ? `النسخ الذاتي نشط (كل ${config.intervalMinutes} دقيقة)`
                    : 'النسخ الذاتي متوقف'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                حفظ تلقائي لكافة جداول قاعدة البيانات المحلية (<span className="font-mono">KianCashier_OfflineDB</span>) إلى ملف JSON محلي قابل للتحميل الفوري عند الطلب، مع استعادة كاملة أو دمج ذكي من أي ملف سابق.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleDownloadJsonNow}
              disabled={isExporting}
              className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer disabled:opacity-60"
            >
              <FolderDown className={`w-4 h-4 ${isExporting ? 'animate-bounce' : ''}`} />
              <span>
                {isExporting ? 'جاري التصدير والتحميل...' : 'تحميل ملف النسخة الاحتياطية (JSON) الآن'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-2 border border-white/15 transition cursor-pointer"
            >
              <ArchiveRestore className="w-4 h-4 text-emerald-400" />
              <span>استعادة البيانات من ملف سابق</span>
            </button>
          </div>
        </div>

        {/* Live IndexedDB Object Stores Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/10">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
            <span className="text-[11px] text-slate-300 block">إجمالي سجلات IndexedDB</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-black font-mono tabular-nums text-white">
                {dbSummary?.totalRecordsCount ??
                  products.length + categories.length + customers.length + sales.length}
              </span>
              <span className="text-[11px] font-mono text-amber-300">
                {formatStorageSize(dbSummary?.estimatedSizeBytes || 24576)}
              </span>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
            <span className="text-[11px] text-slate-300 block">المنتجات والتصنيفات</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-black font-mono tabular-nums text-emerald-300">
                {products.length}
              </span>
              <span className="text-[11px] text-slate-300">{categories.length} تصنيف</span>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
            <span className="text-[11px] text-slate-300 block">الفواتير والعملاء</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-black font-mono tabular-nums text-indigo-300">
                {sales.length}
              </span>
              <span className="text-[11px] text-slate-300">{customers.length} عميل</span>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
            <span className="text-[11px] text-slate-300 block">آخر نسخ احتياطي ذاتي</span>
            <div className="mt-1">
              <span className="text-xs font-bold text-amber-300 block truncate">
                {formatTimestampAr(config.lastAutoBackupAt || snapshotsHistory[0]?.exportDate || null)}
              </span>
              <span className="text-[10px] text-slate-400">
                {snapshotsHistory.length} نسخ محفوظة في السجل
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Restore Success Notification Banner */}
      {restoreCompletedMessage && (
        <div className="p-4 rounded-2xl bg-emerald-600 text-white flex items-center justify-between gap-3 shadow-md animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <p className="text-xs sm:text-sm font-black">{restoreCompletedMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => setRestoreCompletedMessage(null)}
            className="p-1 rounded-lg hover:bg-white/20 text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Two-Column Action Grid: (1) Auto-Backup & On-Demand JSON Export, (2) Restore from JSON File */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Column 1: Auto-Backup Settings & Instant Export */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    1. النسخ الاحتياطي الذاتي وتحميل ملف JSON المحلي
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    ضبط جدولة النسخ الذاتي لبيانات IndexedDB أو تنزيل نسخة فورية بضغطة زر
                  </p>
                </div>
              </div>
            </div>

            {/* Auto-Backup Master Switch */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-black text-slate-900 dark:text-white block">
                  تفعيل النسخ الاحتياطي الذاتي التلقائي (Auto-Backup)
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  ينشئ لقطة كاملة لكافة جداول IndexedDB تلقائياً في الخلفية دون تعطيل الكاشير
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={e => handleUpdateConfig({ enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
              </label>
            </div>

            {/* Schedule Interval & Auto-Download Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  الفترة الزمنية للنسخ الذاتي:
                </label>
                <select
                  value={config.intervalMinutes}
                  onChange={e =>
                    handleUpdateConfig({
                      intervalMinutes: Number(e.target.value) as IndexedDbAutoBackupConfig['intervalMinutes'],
                    })
                  }
                  className="w-full text-xs font-bold px-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none"
                >
                  <option value={5}>كل 5 دقائق (حماية قصوى)</option>
                  <option value={15}>كل 15 دقيقة</option>
                  <option value={30}>كل 30 دقيقة (موصى به)</option>
                  <option value={60}>كل ساعة (60 دقيقة)</option>
                  <option value={360}>كل 6 ساعات</option>
                  <option value={1440}>يومياً (كل 24 ساعة)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  أقصى عدد نسخ محفوظة بالسجل:
                </label>
                <select
                  value={config.maxHistoryCount}
                  onChange={e => handleUpdateConfig({ maxHistoryCount: Number(e.target.value) })}
                  className="w-full text-xs font-bold px-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none"
                >
                  <option value={5}>آخر 5 نسخ ذاتية</option>
                  <option value={10}>آخر 10 نسخ ذاتية (موصى به)</option>
                  <option value={20}>آخر 20 نسخة ذاتية</option>
                </select>
              </div>
            </div>

            {/* Checkboxes for Auto-Download & Shift Close & Safety Backup */}
            <div className="space-y-2 pt-1">
              <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={config.autoDownloadToDevice}
                  onChange={e => handleUpdateConfig({ autoDownloadToDevice: e.target.checked })}
                  className="w-4 h-4 accent-amber-500 rounded mt-0.5"
                />
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">
                    تنزيل ملف JSON تلقائياً إلى مجلد التنزيلات في الجهاز عند كل نسخ ذاتي دوري
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    عند التفعيل، يقوم المتصفح بتحميل ملف النسخة الاحتياطية تلقائياً إلى جهازك دون تدخل يدوي
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={config.backupOnShiftClose}
                  onChange={e => handleUpdateConfig({ backupOnShiftClose: e.target.checked })}
                  className="w-4 h-4 accent-amber-500 rounded mt-0.5"
                />
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">
                    نسخ احتياطي تلقائي فور إغلاق الوردية وجرد الصندوق
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={config.safetyBackupBeforeRestore}
                  onChange={e => handleUpdateConfig({ safetyBackupBeforeRestore: e.target.checked })}
                  className="w-4 h-4 accent-amber-500 rounded mt-0.5"
                />
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">
                    إنشاء نسخة أمان تلقائية للبيانات الحالية قبل تنفيذ أي استعادة (Restore)
                  </span>
                </div>
              </label>
            </div>

            {/* Optional Note for Manual Backup */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ملاحظة اختيارية على النسخة الاحتياطية (تظهر عند الاستعادة):
              </label>
              <input
                type="text"
                value={customBackupNote}
                onChange={e => setCustomBackupNote(e.target.value)}
                placeholder="مثال: نسخة قبل جرد المستودع أو نسخة نهاية الأسبوع..."
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleDownloadJsonNow}
              disabled={isExporting}
              className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>تحميل ملف JSON محلي الآن</span>
            </button>

            <button
              type="button"
              onClick={handleCreateInternalSnapshot}
              disabled={isCreatingSnapshotOnly}
              className="py-2.5 px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>حفظ لقطة في السجل</span>
            </button>
          </div>
        </div>

        {/* Column 2: Restore Data from Previous JSON File */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <ArchiveRestore className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    2. استعادة البيانات (Restore) من ملف JSON سابق
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    اختر أو اسحب ملف نسخة احتياطية سابق لمعاينة محتوياته واستعادته فوراً إلى IndexedDB
                  </p>
                </div>
              </div>
            </div>

            {/* Drag & Drop File Upload Zone */}
            <div
              onDragOver={e => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDropFile}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 rounded-2xl border-2 border-dashed text-center transition cursor-pointer ${
                isDragOver
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : 'border-slate-300 dark:border-slate-700 hover:border-emerald-500/60 bg-slate-50/70 dark:bg-slate-800/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                {selectedFileName
                  ? `الملف المحدد: ${selectedFileName}`
                  : 'اضغط هنا لاختيار ملف النسخة الاحتياطية (.json) أو اسحبه إلى هنا'}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                يدعم جميع ملفات النسخ الاحتياطي المصدرة من IndexedDB أو كاشير كيان
              </p>
            </div>

            {/* Pre-Restore File Preview & Validation Card */}
            {restorePreview && (
              <div
                className={`p-4 rounded-2xl border space-y-3.5 animate-in fade-in ${
                  restorePreview.valid
                    ? 'bg-emerald-500/5 border-emerald-500/30'
                    : 'bg-rose-500/10 border-rose-500/30'
                }`}
              >
                {!restorePreview.valid ? (
                  <div className="flex items-start gap-2.5 text-rose-600 dark:text-rose-400 text-xs">
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-black">تعذر قبول الملف للاستعادة</p>
                      <p className="text-[11px] mt-0.5">{restorePreview.error}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-2 border-b border-emerald-500/20 pb-2.5">
                      <div>
                        <span className="text-xs font-black text-slate-900 dark:text-white block">
                          معاينة محتويات ملف النسخة: {restorePreview.storeName}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          تاريخ النسخة: {formatTimestampAr(restorePreview.exportDate)} · الحجم:{' '}
                          {formatStorageSize(restorePreview.fileSizeBytes)}
                        </span>
                      </div>
                      <span
                        className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300"
                        dir="ltr"
                      >
                        {restorePreview.checksum}
                      </span>
                    </div>

                    {/* Breakdown of records inside the file */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                      <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block">المنتجات</span>
                        <span className="font-mono font-black text-slate-900 dark:text-white">
                          {restorePreview.counts.productsCount}
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block">الفواتير</span>
                        <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                          {restorePreview.counts.salesCount}
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block">العملاء</span>
                        <span className="font-mono font-black text-indigo-600 dark:text-indigo-400">
                          {restorePreview.counts.customersCount}
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block">إجمالي السجلات</span>
                        <span className="font-mono font-black text-amber-600 dark:text-amber-400">
                          {restorePreview.counts.totalRecordsCount}
                        </span>
                      </div>
                    </div>

                    {/* Restore Mode Selection */}
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        طريقة استعادة البيانات إلى IndexedDB:
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setRestoreMode('replace')}
                          className={`p-2.5 rounded-xl border text-right text-xs transition cursor-pointer ${
                            restoreMode === 'replace'
                              ? 'border-emerald-600 bg-emerald-600 text-white font-black'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <span className="block">استبدال كامل (Full Restore)</span>
                          <span className="text-[10px] opacity-85 font-normal">
                            اعتماد بيانات الملف بالكامل مكان الحالية
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setRestoreMode('merge')}
                          className={`p-2.5 rounded-xl border text-right text-xs transition cursor-pointer ${
                            restoreMode === 'merge'
                              ? 'border-indigo-600 bg-indigo-600 text-white font-black'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <span className="block">دمج ذكي (Smart Merge)</span>
                          <span className="text-[10px] opacity-85 font-normal">
                            إضافة سجلات الملف مع الحفاظ على الجديد
                          </span>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleConfirmFileRestore}
                        disabled={isRestoring}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>
                          {isRestoring
                            ? 'جاري استعادة البيانات إلى IndexedDB...'
                            : 'تأكيد واستعادة البيانات الآن (Restore)'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setRestorePreview(null);
                          setSelectedFileName('');
                        }}
                        className="py-2.5 px-3 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
                      >
                        إلغاء
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Bottom helper bar */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
            <span className="text-[11px] text-slate-400">
              يتم تحديث متاجر IndexedDB والواجهة الحية فوراً دون الحاجة لإعادة تحميل الصفحة.
            </span>
            <button
              type="button"
              onClick={() => {
                if (
                  confirm(
                    'هل أنت متأكد من رغبتك في إعادة ضبط البيانات إلى الحالة التجريبية الافتراضية؟'
                  )
                ) {
                  resetToDemoData();
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>ضبط تجريبي</span>
            </button>
          </div>
        </div>
      </div>

      {/* Saved Auto-Backup Snapshots History inside IndexedDB */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white">
                سجل النسخ الاحتياطية الذاتية المحفوظة في IndexedDB ({snapshotsHistory.length})
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                يمكنك تحميل أي نسخة ذاتية سابقة كملف JSON محلي إلى جهازك أو استعادتها بنقرة واحدة
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadEngineStatus}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>تحديث السجل</span>
          </button>
        </div>

        {snapshotsHistory.length === 0 ? (
          <div className="p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
              لا توجد نسخ ذاتية مسجلة بعد في السجل المحلي
            </p>
            <p className="text-[11px] text-slate-400">
              اضغط على «حفظ لقطة في السجل» أو «تحميل ملف JSON محلي الآن» لإنشاء أول نسخة احتياطية فورية.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {snapshotsHistory.map(snap => {
              const isConfirming = confirmingSnapshotRestoreId === snap.backupId;
              return (
                <div
                  key={snap.backupId}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <FileJson className="w-4 h-4 text-amber-500 shrink-0" />
                      <span className="text-xs font-black text-slate-900 dark:text-white">
                        {snap.triggerLabelAr}
                      </span>
                      <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">
                        ·
                      </span>
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        {formatTimestampAr(snap.exportDate)}
                      </span>
                      <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">
                        ·
                      </span>
                      <span className="text-[11px] font-mono text-slate-500" dir="ltr">
                        {formatStorageSize(snap.summary?.estimatedSizeBytes || 0)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-500 dark:text-slate-400">
                      <span>المنتجات: {snap.summary?.productsCount ?? 0}</span>
                      <span aria-hidden="true">·</span>
                      <span>الفواتير: {snap.summary?.salesCount ?? 0}</span>
                      <span aria-hidden="true">·</span>
                      <span>العملاء: {snap.summary?.customersCount ?? 0}</span>
                      <span aria-hidden="true">·</span>
                      <span>إجمالي السجلات: {snap.summary?.totalRecordsCount ?? 0}</span>
                      {snap.notes && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-amber-600 dark:text-amber-400 font-bold">
                            {snap.notes}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleDownloadSavedSnapshot(snap)}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition cursor-pointer"
                      title="تحميل هذه النسخة كملف JSON محلي إلى جهازك"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>تحميل JSON</span>
                    </button>

                    {isConfirming ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleRestoreSavedSnapshot(snap)}
                          disabled={isRestoring}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1 transition cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>تأكيد الاستعادة</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmingSnapshotRestoreId(null)}
                          className="px-2 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
                        >
                          إلغاء
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmingSnapshotRestoreId(snap.backupId)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-black text-xs flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <ArchiveRestore className="w-3.5 h-3.5" />
                        <span>استعادة هذه النسخة</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDeleteSnapshot(snap.backupId)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                      title="حذف النسخة من السجل"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
