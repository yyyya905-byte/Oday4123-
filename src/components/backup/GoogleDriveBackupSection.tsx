import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { GoogleDriveBackupFile } from '../../types';
import { googleDriveBackupService, GoogleDriveUser } from '../../services/googleDriveBackup';
import { GoogleIcon } from '../common/GoogleIcon';
import {
  Cloud,
  CloudUpload,
  CloudDownload,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  FileJson,
  Calendar,
  Layers,
  Database,
  ShieldCheck,
  HardDrive,
  LogOut,
  Sparkles,
  ArrowDownToLine,
  RefreshCw,
  ExternalLink,
  Info
} from 'lucide-react';

interface Props {
  onNotify?: (title: string, desc: string, type: 'success' | 'error' | 'info') => void;
}

export const GoogleDriveBackupSection: React.FC<Props> = ({ onNotify }) => {
  const {
    products,
    sales,
    customers,
    categories,
    expenses,
    stockMovements,
    wholesaleWarehouses,
    deliveryVehicles,
    vehicleManifests,
    users,
    auditLogs,
    settings,
    updateSettings,
    importDataJson,
    notify
  } = useApp();

  const [isConnected, setIsConnected] = useState<boolean>(googleDriveBackupService.isConnected());
  const [currentUser, setCurrentUser] = useState<GoogleDriveUser | null>(googleDriveBackupService.getSavedUser());
  const [backupsList, setBackupsList] = useState<GoogleDriveBackupFile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [selectedBackupForRestore, setSelectedBackupForRestore] = useState<GoogleDriveBackupFile | null>(null);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState<boolean>(settings.googleDriveAutoBackup ?? true);

  // Load backups list on mount or connection change
  const refreshBackupsList = async () => {
    setIsLoading(true);
    try {
      const list = await googleDriveBackupService.listBackups();
      setBackupsList(list);
    } catch (e) {
      console.error('Failed to list backups:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsConnected(googleDriveBackupService.isConnected());
    setCurrentUser(googleDriveBackupService.getSavedUser());
    refreshBackupsList();
  }, []);

  const handleConnectGoogle = async () => {
    setIsLoading(true);
    try {
      const res = await googleDriveBackupService.connectWithGoogle();
      if (res.success && res.user) {
        setIsConnected(true);
        setCurrentUser(res.user);
        updateSettings({
          googleDriveConnected: true,
          googleDriveEmail: res.user.email,
          googleDriveUserName: res.user.name
        });
        notify('تم ربط Google Drive بنجاح', 'تم الاتصال ومزامنة البيانات السحابية بأمان', 'success');
        await refreshBackupsList();
      } else {
        notify('تنبيه الاتصال', res.error || 'تم تفعيل الاتصال المحلي الآمن', 'info');
      }
    } catch (err: any) {
      notify('خطأ في الاتصال', err.message || 'تعذر الاتصال بـ Google Drive', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnectGoogle = () => {
    if (confirm('هل أنت متأكد من رغبتك في تسجيل الخروج وفصل حساب Google Drive؟')) {
      googleDriveBackupService.disconnect();
      setIsConnected(false);
      setCurrentUser(null);
      updateSettings({
        googleDriveConnected: false,
        googleDriveEmail: undefined,
        googleDriveUserName: undefined
      });
      notify('تم فصل الحساب', 'تم تسجيل الخروج من Google Drive بأمان', 'info');
    }
  };

  // Perform a full instant backup to Google Drive
  const handleCreateBackup = async () => {
    setIsUploading(true);
    try {
      const fullSnapshot = {
        app: 'Kian Cashier',
        version: '2.5',
        exportedAt: new Date().toISOString(),
        settings,
        products,
        categories,
        customers,
        sales,
        expenses,
        stockMovements,
        wholesaleWarehouses,
        deliveryVehicles,
        vehicleManifests,
        users,
        auditLogs
      };

      const jsonString = JSON.stringify(fullSnapshot, null, 2);
      const summary = {
        productsCount: products.length,
        salesCount: sales.length,
        customersCount: customers.length,
        inventoryMovementsCount: stockMovements.length
      };

      const result = await googleDriveBackupService.uploadBackup(jsonString, undefined, summary);

      if (result.success && result.file) {
        notify(
          'تم النسخ الاحتياطي السحابي بنجاح! ☁️',
          `تم حفظ ${products.length} صنف و ${sales.length} فاتورة على Google Drive`,
          'success'
        );
        updateSettings({
          googleDriveLastBackupAt: new Date().toISOString(),
          googleDriveLastBackupStatus: 'success'
        });
        await refreshBackupsList();
      } else {
        throw new Error(result.error || 'فشل رفع الملف');
      }
    } catch (err: any) {
      notify('خطأ في النسخ الاحتياطي', err.message || 'تعذر رفع النسخة الاحتياطية', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // Restore database from selected Google Drive Backup
  const handleConfirmRestore = async () => {
    if (!selectedBackupForRestore) return;

    setIsRestoring(true);
    try {
      const backupJson = await googleDriveBackupService.downloadBackup(selectedBackupForRestore.id);
      const success = importDataJson(backupJson);

      if (success) {
        notify(
          'تمت استعادة قاعدة البيانات بنجاح! 🎉',
          `تم تحديث كافة السجلات من النسخة المؤرخة في ${new Date(selectedBackupForRestore.createdTime).toLocaleString('ar-SY')}`,
          'success'
        );
        setSelectedBackupForRestore(null);
      } else {
        throw new Error('الملف غير صالح أو تالف');
      }
    } catch (err: any) {
      notify('فشل الاستعادة', err.message || 'تعذر استعادة البيانات من النسخة المحددة', 'error');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleDeleteBackup = async (fileId: string, fileName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`هل أنت متأكد من حذف النسخة الاحتياطية "${fileName}" نهائياً من Google Drive؟`)) {
      setIsLoading(true);
      try {
        await googleDriveBackupService.deleteBackup(fileId);
        notify('تم الحذف', 'تم حذف النسخة الاحتياطية المحددة بنجاح', 'info');
        await refreshBackupsList();
      } catch (err: any) {
        notify('خطأ', 'تعذر حذف النسخة المحددة', 'error');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5">
      {/* Header with Google Drive Branding */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                النسخ الاحتياطي السحابي عبر Google Drive
              </h3>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                مشفّر وآمن 100%
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              حفظ واستعادة بيانات فواتير الجملة والمفرق، المخزون، والعملاء مباشرة على سحابة Google Drive الشخصية
            </p>
          </div>
        </div>

        {/* Connection Action */}
        <div className="flex items-center gap-2">
          {isConnected ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-3 py-1.5 rounded-xl text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-bold text-emerald-800 dark:text-emerald-300">
                  متصل بـ Google Drive (نشط)
                </span>
              </div>
              <button
                type="button"
                onClick={handleDisconnectGoogle}
                title="تسجيل الخروج وفصل الحساب"
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-all"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleConnectGoogle}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 text-xs font-black rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <GoogleIcon className="w-4 h-4" />
              <span>ربط حساب Google Drive</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Backup Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Instant Upload Card */}
        <div className="bg-gradient-to-br from-amber-500/5 via-amber-500/10 to-transparent dark:from-amber-500/10 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/40 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900 dark:text-amber-300">
              إنشاء نسخة احتياطية فورية
            </span>
            <CloudUpload className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
            رفع لقطة متكاملة لقاعدة البيانات بما فيها فواتير الجملة والتجزئة والمستودعات والديون.
          </p>
          <button
            type="button"
            onClick={handleCreateBackup}
            disabled={isUploading}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer"
          >
            {isUploading ? (
              <>
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                <span>جاري الحفظ على Google Drive...</span>
              </>
            ) : (
              <>
                <CloudUpload className="w-3.5 h-3.5" />
                <span>نسخ احتياطي إلى Google Drive</span>
              </>
            )}
          </button>
        </div>

        {/* Database Snapshot Status */}
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
            إحصائيات البيانات الحالية
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700/60">
              <span className="text-[10px] text-slate-400 block">الأصناف المسجلة</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {products.length} صنف
              </span>
            </div>
            <div className="p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700/60">
              <span className="text-[10px] text-slate-400 block">الفواتير والمبيعات</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {sales.length} فاتورة
              </span>
            </div>
            <div className="p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700/60">
              <span className="text-[10px] text-slate-400 block">كبار العملاء والتجار</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {customers.length} عميل
              </span>
            </div>
            <div className="p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700/60">
              <span className="text-[10px] text-slate-400 block">مستودعات الجملة</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {wholesaleWarehouses.length} مستودع
              </span>
            </div>
          </div>
        </div>

        {/* Cloud Sync Settings */}
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              النسخ الاحتياطي التلقائي
            </span>
            <label className="flex items-center gap-2.5 cursor-pointer mt-2">
              <input
                type="checkbox"
                checked={autoBackupEnabled}
                onChange={e => {
                  setAutoBackupEnabled(e.target.checked);
                  updateSettings({ googleDriveAutoBackup: e.target.checked });
                  notify('تم التحديث', `النسخ التلقائي ${e.target.checked ? 'مفعّل' : 'معطّل'}`, 'info');
                }}
                className="w-4 h-4 accent-amber-500 rounded"
              />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                أخذ نسخة احتياطية تلقائياً عند إغلاق الوردية
              </span>
            </label>
          </div>

          <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-200/60 dark:border-slate-700">
            <span>آخر نسخة تم رفعها: </span>
            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
              {settings.googleDriveLastBackupAt
                ? new Date(settings.googleDriveLastBackupAt).toLocaleString('ar-SY')
                : 'لم يتم الرفع بعد'}
            </span>
          </div>
        </div>
      </div>

      {/* Cloud Backups Browser List */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Database className="w-4 h-4 text-amber-500" />
            <span>سجل النسخ الاحتياطية المحفوظة على Google Drive</span>
            <span className="font-mono text-[11px] text-slate-400">
              ({backupsList.length} نسخة متوفرة)
            </span>
          </h4>

          <button
            type="button"
            onClick={refreshBackupsList}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            <span>تحديث القائمة</span>
          </button>
        </div>

        {backupsList.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
            <Cloud className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
              لا توجد نسخ احتياطية محفوظة على السحابة حتى الآن
            </p>
            <p className="text-[11px] text-slate-400">
              اضغط على "نسخ احتياطي إلى Google Drive" أعلاه لإنشاء نسختك الأولى فوراً.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 max-h-72 overflow-y-auto pr-1">
            {backupsList.map(backup => {
              const dateStr = new Date(backup.createdTime).toLocaleString('ar-SY', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div
                  key={backup.id}
                  className="flex items-center justify-between p-3.5 bg-slate-50/80 dark:bg-slate-800/60 hover:bg-amber-500/5 dark:hover:bg-amber-500/10 rounded-2xl border border-slate-200/80 dark:border-slate-800 transition-all gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <FileJson className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {backup.name}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-800 shrink-0">
                          {formatFileSize(backup.size)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        <span className="flex items-center gap-1 font-mono">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {dateStr}
                        </span>
                        {backup.summary && (
                          <span className="text-amber-600 dark:text-amber-400 font-medium">
                            • {backup.summary.productsCount} صنف | {backup.summary.salesCount} فاتورة | {backup.summary.customersCount} عميل
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedBackupForRestore(backup)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xl shadow-xs transition-all cursor-pointer"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>استعادة</span>
                    </button>

                    <button
                      type="button"
                      onClick={e => handleDeleteBackup(backup.id, backup.name, e)}
                      title="حذف النسخة من Google Drive"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-all"
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

      {/* Confirmation Modal for Restoring from Cloud */}
      {selectedBackupForRestore && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden space-y-4 p-6">
            <div className="flex items-center gap-3 text-amber-500">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  تأكيد استعادة قاعدة البيانات من السحابة
                </h3>
                <span className="text-[11px] text-slate-400">
                  Google Drive Cloud Restore
                </span>
              </div>
            </div>

            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-300 space-y-2">
              <p className="font-bold">
                ⚠️ تحذير: استعادة هذه النسخة ستستبدل البيانات الحالية ببيانات النسخة السحابية المؤرخة في:
              </p>
              <div className="font-mono font-extrabold text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-900 p-2 rounded-xl border border-amber-300 dark:border-amber-800">
                {new Date(selectedBackupForRestore.createdTime).toLocaleString('ar-SY')}
              </div>
              {selectedBackupForRestore.summary && (
                <div className="text-[11px] space-y-0.5 pt-1 text-slate-600 dark:text-slate-400">
                  <div>• عدد الأصناف المستعادة: {selectedBackupForRestore.summary.productsCount}</div>
                  <div>• عدد الفواتير المستعادة: {selectedBackupForRestore.summary.salesCount}</div>
                  <div>• كبار العملاء والتجار: {selectedBackupForRestore.summary.customersCount}</div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedBackupForRestore(null)}
                disabled={isRestoring}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmRestore}
                disabled={isRestoring}
                className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-extrabold text-xs rounded-xl shadow-md shadow-amber-500/20"
              >
                {isRestoring ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    <span>جاري استعادة البيانات...</span>
                  </>
                ) : (
                  <>
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>تأكيد الاستعادة الفورية</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
