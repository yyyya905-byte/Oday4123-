import React, { useRef, useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { UtensilsCrossed, Printer, CheckCircle, X, Clock, Users, Flame, Coffee, Bluetooth, RefreshCw } from 'lucide-react';
import { soundEffects } from '../../services/audio';
import { DraggableModalWrapper } from '../common/DraggableModalWrapper';
import { bluetoothPrinter, BluetoothPrinterStatus } from '../../services/bluetoothPrinter';

interface KitchenTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KitchenTicketModal: React.FC<KitchenTicketModalProps> = ({ isOpen, onClose }) => {
  const {
    cart,
    restaurantDiningType,
    selectedTable,
    guestCount,
    currentUser,
    settings,
    language,
    t,
    notify,
  } = useApp();

  const printRef = useRef<HTMLDivElement>(null);
  const [btStatus, setBtStatus] = useState<BluetoothPrinterStatus>(bluetoothPrinter.getStatus());
  const [isBtPrinting, setIsBtPrinting] = useState(false);

  useEffect(() => {
    const unsub = bluetoothPrinter.subscribe(status => {
      setBtStatus(status);
    });
    return unsub;
  }, []);

  if (!isOpen) return null;

  const handlePrint = () => {
    soundEffects.playBeep();
    notify(
      language === 'ar' ? 'تم إرسال بون المطبخ (KOT)' : 'Kitchen Ticket Sent',
      language === 'ar' ? `طاولة: ${selectedTable} • عدد الأصناف: ${cart.length}` : `Table: ${selectedTable}`,
      'success'
    );
    window.print();
    onClose();
  };

  const handleBluetoothPrint = async () => {
    if (!btStatus.isConnected) {
      const connected = await bluetoothPrinter.connect();
      if (!connected) {
        notify('طابعة البلوتوث', 'يرجى الاقتران بطابعة البلوتوث الحرارية أولاً', 'warning');
        return;
      }
    }

    try {
      setIsBtPrinting(true);
      soundEffects.playBeep();

      const ticketPayload = {
        orderId: Math.floor(1000 + Math.random() * 9000).toString(),
        tableName: selectedTable,
        guestCount: guestCount,
        diningType: restaurantDiningType,
        items: cart.map(item => ({
          name: language === 'ar' ? item.product.nameAr : item.product.nameEn,
          quantity: item.quantity,
          notes: item.notes,
        })),
        timestamp: new Date().toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' }),
      };

      await bluetoothPrinter.printKitchenTicket(
        ticketPayload,
        settings,
        settings.printPaperSize === '58mm' ? '58mm' : '80mm'
      );

      soundEffects.playSuccess();
      notify('طباعة المطبخ', 'تم إرسال بون المطبخ KOT لطابعة البلوتوث بنجاح', 'success');
      onClose();
    } catch (err: any) {
      soundEffects.playWarning();
      notify('خطأ بالطباعة', err.message || 'تعذر إرسال الطلب لطابعة المطبخ', 'error');
    } finally {
      setIsBtPrinting(false);
    }
  };

  const diningLabel = {
    dine_in: language === 'ar' ? 'صالة داخلية' : 'Dine-In',
    takeaway: language === 'ar' ? 'طلب سفري' : 'Takeaway',
    delivery: language === 'ar' ? 'طلب توصيل' : 'Delivery',
  }[restaurantDiningType];

  return (
    <DraggableModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={`${t('kitchenTicket')} (KOT)`}
      subtitle={`${diningLabel} • ${selectedTable}`}
      icon={<UtensilsCrossed className="w-5 h-5 text-emerald-600" />}
      maxWidth="max-w-md"
    >
      <div className="p-4 sm:p-5 space-y-4">
        {/* Printable Ticket Receipt Preview */}
        <div className="p-5 overflow-y-auto max-h-[60vh] bg-slate-50 dark:bg-slate-950">
          <div
            ref={printRef}
            className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 p-5 rounded-2xl font-mono text-xs text-slate-800 dark:text-slate-200 shadow-xs"
          >
            <div className="text-center pb-3 border-b border-dashed border-slate-300 dark:border-slate-700">
              <span className="inline-block px-3 py-1 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-md font-black text-sm tracking-wider">
                بون تحضير المطبخ (KOT)
              </span>
              <div className="mt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {diningLabel.toUpperCase()}
              </div>
            </div>

            <div className="py-2.5 border-b border-dashed border-slate-300 dark:border-slate-700 text-[11px] space-y-1">
              {restaurantDiningType === 'dine_in' && (
                <div className="flex justify-between font-bold text-sm text-slate-900 dark:text-white">
                  <span>الطاولة / القسم:</span>
                  <span className="bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded">
                    {selectedTable}
                  </span>
                </div>
              )}
              {restaurantDiningType === 'dine_in' && (
                <div className="flex justify-between">
                  <span>عدد الضيوف:</span>
                  <span>{guestCount} أشخاص</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>الكابتن / الكاشير:</span>
                <span>{currentUser.name}</span>
              </div>
              <div className="flex justify-between">
                <span>وقت الطلب:</span>
                <span>{new Date().toLocaleTimeString(language === 'ar' ? 'ar-SY' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>

            {/* Kitchen Items List */}
            <div className="py-3 space-y-2.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                قائمة الأصناف المطلوبة
              </div>
              {cart.map((item, idx) => (
                <div key={item.productId} className="flex flex-col border-b border-slate-100 dark:border-slate-800 pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 flex items-center justify-center font-black text-xs">
                        {item.quantity}x
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white text-xs">
                        {language === 'ar' ? item.product.nameAr : item.product.nameEn}
                      </span>
                    </div>
                  </div>
                  {item.kitchenNotes && (
                    <div className="mt-1 ms-8 text-[11px] text-amber-600 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950/40 px-2 py-1 rounded-md border border-amber-200 dark:border-amber-900">
                      ⚡ ملاحظة: {item.kitchenNotes}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="text-center pt-2 text-[10px] text-slate-400">
              --- نهاية أمر التحضير KOT ---
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2.5">
          <button
            onClick={onClose}
            className="px-3 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
          >
            {t('cancel')}
          </button>

          {/* Bluetooth ESC/POS Kitchen Print Button */}
          <button
            type="button"
            onClick={handleBluetoothPrint}
            disabled={isBtPrinting}
            data-longpress-title="طباعة للمطبخ عبر طابعة البلوتوث"
            data-longpress-desc="إرسال أمر التجهيز مباشرة إلى طابعة المطبخ الحرارية اللاسلكية."
            className={`flex-1 py-2.5 px-3 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
              btStatus.isConnected
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                : 'bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
            }`}
          >
            {isBtPrinting ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Bluetooth className="w-3.5 h-3.5" />
            )}
            <span>
              {isBtPrinting
                ? 'جاري الإرسال...'
                : btStatus.isConnected
                  ? `بلوتوث (${btStatus.deviceName?.slice(0, 8) || 'متصل'})`
                  : 'بلوتوث KOT'
              }
            </span>
          </button>

          <button
            onClick={handlePrint}
            data-longpress-title="طباعة وإرسال للشيف"
            data-longpress-desc="إرسال طلب التحضير والتجهيز إلى طابعة المطبخ أو شاشة العرض مباشرة."
            className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-98 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>{language === 'ar' ? 'طباعة كابل/PDF' : 'Standard KOT'}</span>
          </button>
        </div>
      </div>
    </DraggableModalWrapper>
  );
};
