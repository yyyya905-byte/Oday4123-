import React, { useState, useEffect } from 'react';
import {
  Printer,
  Bluetooth,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Scissors,
  DollarSign,
  X,
  Sliders,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';
import { bluetoothPrinter, BluetoothPrinterStatus } from '../../services/bluetoothPrinter';
import { useApp } from '../../context/AppContext';
import { soundEffects } from '../../services/audio';
import { DraggableModalWrapper } from '../common/DraggableModalWrapper';

interface BluetoothPrinterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BluetoothPrinterModal: React.FC<BluetoothPrinterModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings, notify, language } = useApp();
  const [status, setStatus] = useState<BluetoothPrinterStatus>(bluetoothPrinter.getStatus());
  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>(
    settings.printPaperSize === '58mm' ? '58mm' : '80mm'
  );
  const [isTesting, setIsTesting] = useState(false);
  const [testProgress, setTestProgress] = useState<number>(0);
  const [autoPrintEnabled, setAutoPrintEnabled] = useState(settings.autoPrintOnSale ?? false);

  useEffect(() => {
    const unsub = bluetoothPrinter.subscribe((newStatus) => {
      setStatus(newStatus);
    });
    return unsub;
  }, []);

  if (!isOpen) return null;

  const handleConnect = async () => {
    soundEffects.playClick();
    const success = await bluetoothPrinter.connect();
    if (success) {
      soundEffects.playSuccess();
      notify('تم الاتصال بطابعة البلوتوث', `متصل الآن بنجاح مع: ${bluetoothPrinter.getStatus().deviceName || 'الطابعة الحرارية'}`, 'success');
    } else {
      soundEffects.playWarning();
      notify('تعذر الاتصال', bluetoothPrinter.getStatus().error || 'يرجى التأكد من تشغيل البلوتوث واختيار الطابعة.', 'warning');
    }
  };

  const handleDisconnect = async () => {
    soundEffects.playClick();
    await bluetoothPrinter.disconnect();
    notify('تم قطع الاتصال', 'تم فصل طابعة البلوتوث', 'info');
  };

  const handleTestPrint = async () => {
    if (!status.isConnected) {
      notify('تنبيه', 'يرجى الاقتران بطابعة البلوتوث أولاً للبدء بالطباعة', 'warning');
      return;
    }

    try {
      setIsTesting(true);
      setTestProgress(10);
      soundEffects.playBeep();
      
      await bluetoothPrinter.printTestReceipt(settings, paperWidth, (p) => {
        setTestProgress(p);
      });

      soundEffects.playSuccess();
      notify('نجحت الطباعة', 'تم إرسال إيصال الاختبار إلى طابعة البلوتوث بنجاح', 'success');
    } catch (err: any) {
      soundEffects.playWarning();
      notify('فشل الاختبار', err.message || 'حدث خطأ أثناء الإرسال للطابعة', 'error');
    } finally {
      setIsTesting(false);
      setTestProgress(0);
    }
  };

  const handleKickDrawer = async () => {
    if (!status.isConnected) return;
    try {
      soundEffects.playClick();
      await bluetoothPrinter.kickCashDrawer();
      notify('فتح الدرج', 'تم إرسال نبضة فتح درج النقود الإلكتروني', 'success');
    } catch (err: any) {
      notify('خطأ', err.message || 'فشل إرسال نبضة الدرج', 'error');
    }
  };

  return (
    <DraggableModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="طابعات الإيصالات الحرارية عبر البلوتوث (ESC/POS)"
      subtitle="اتصال لاسلكي مباشر وطباعة فورية بدون كابلات أو برامج وسيطة"
      icon={<Bluetooth className="w-5 h-5 text-blue-500 shrink-0" />}
      maxWidth="max-w-md"
      className="max-h-[92vh] flex flex-col"
    >
      <div className="p-4 space-y-4 overflow-y-auto">
        {/* Support Check Warning */}
        {!status.isSupported && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">ملاحظة تقنية حول متصفح الويب:</p>
              <p className="mt-0.5 text-[11px] text-amber-800 dark:text-amber-300">
                تقنية Web Bluetooth مدعومة بالكامل على متصفحات <strong>Google Chrome</strong> و <strong>Microsoft Edge</strong> على أنظمة Android و Windows و macOS مع اتصال آمن.
              </p>
            </div>
          </div>
        )}

        {/* Connection Status Card */}
        <div className={`p-4 rounded-2xl border transition-all ${
          status.isConnected
            ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/80'
            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-white shadow-xs ${
                status.isConnected
                  ? 'bg-gradient-to-tr from-emerald-500 to-teal-600'
                  : 'bg-gradient-to-tr from-slate-400 to-slate-600'
              }`}>
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {status.deviceName || (language === 'ar' ? 'طابعة بلوتوث حرارية' : 'Bluetooth Thermal Printer')}
                  </h3>
                  {status.isConnected && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  )}
                </div>
                <p className="text-xs font-semibold mt-0.5">
                  {status.isConnected ? (
                    <span className="text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>متصل وجاهز للطباعة المباشرة</span>
                    </span>
                  ) : status.isConnecting ? (
                    <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>جاري البحث والاتصال بالجهاز...</span>
                    </span>
                  ) : (
                    <span className="text-slate-500 dark:text-slate-400">
                      غير متصل — اضغط على زر الاقتران للبدء
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Connect / Disconnect Action Buttons */}
          <div className="mt-3.5 flex items-center gap-2">
            {!status.isConnected ? (
              <button
                type="button"
                id="btn-bluetooth-pair"
                onClick={handleConnect}
                disabled={status.isConnecting}
                className="flex-1 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Bluetooth className="w-4 h-4" />
                <span>{status.isConnecting ? 'جاري الاقتران...' : 'البحث والاقتران بطابعة بلوتوث'}</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleTestPrint}
                  disabled={isTesting}
                  className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{isTesting ? `جاري الإرسال (${testProgress}%)...` : 'طباعة فحص تجريبي'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleKickDrawer}
                  className="py-2 px-3 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                  title="فتح درج الكاشير"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>الدرج</span>
                </button>
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="py-2 px-3 bg-rose-100 dark:bg-rose-950/60 hover:bg-rose-200 text-rose-700 dark:text-rose-300 font-bold text-xs rounded-xl border border-rose-300 dark:border-rose-800 transition-all cursor-pointer"
                >
                  فصل
                </button>
              </>
            )}
          </div>
        </div>

        {/* Paper Size Configuration */}
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-blue-500" />
            <span>مقاس رول الطابعة البلوتوث:</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPaperWidth('58mm')}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 text-center cursor-pointer ${
                paperWidth === '58mm'
                  ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 shadow-xs'
                  : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span className="text-sm">58 مم (رول صغير)</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                طابعات البلوتوث المحمولة POS-58 / MPT-II (عرض 384 نقطة)
              </span>
            </button>
            <button
              type="button"
              onClick={() => setPaperWidth('80mm')}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 text-center cursor-pointer ${
                paperWidth === '80mm'
                  ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 shadow-xs'
                  : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span className="text-sm">80 مم (رول كاشير عريض)</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                طابعات نقاط البيع والمطاعم Xprinter / Epson (عرض 576 نقطة)
              </span>
            </button>
          </div>
        </div>

        {/* Feature Highlights / Info */}
        <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-2">
          <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>مميزات الطباعة اللاسلكية بنظام كيان:</span>
          </div>
          <ul className="text-[11px] space-y-1.5 list-disc list-inside ps-1 text-slate-600 dark:text-slate-300">
            <li><strong>دعم لغة عربية 100%:</strong> تحويل الفاتورة إلى نمط رسومي حراري بدقة 203 DPI لضمان وضوح الحروف والتشكيل دون تشوه.</li>
            <li><strong>طباعة رمز الاستجابة السريع QR:</strong> متوافق مع الفوترة الإلكترونية وبيانات المتجر.</li>
            <li><strong>أمر قطع الورق وفتح الدرج:</strong> إرسال تلقائي لأوامر ESC/POS القياسية بعد اكتمال الإيصال.</li>
            <li><strong>توافق شامل:</strong> متوافق مع كافة طابعات Xprinter, Rongta, GOOJPRT, Bixolon, Milestone, Netum.</li>
          </ul>
        </div>
      </div>

      <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-bold text-xs rounded-xl transition-all cursor-pointer"
        >
          إغلاق
        </button>
      </div>
    </DraggableModalWrapper>
  );
};
