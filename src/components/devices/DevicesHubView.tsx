import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DeviceRole, LinkedDevice } from '../../types';
import { DevicePairingModal } from './DevicePairingModal';
import { KitchenDisplayView } from './KitchenDisplayView';
import { CustomerFacingDisplayView } from './CustomerFacingDisplayView';
import { MobileWaiterView } from './MobileWaiterView';
import { MobileStockScannerView } from './MobileStockScannerView';
import {
  Laptop,
  Tablet,
  Smartphone,
  UtensilsCrossed,
  Tv,
  ScanBarcode,
  Radio,
  Plus,
  RefreshCw,
  Battery,
  Clock,
  ShieldCheck,
  ExternalLink,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Wifi,
  Layers,
  ArrowUpRight,
  Maximize2,
  ArrowLeftRight,
  KeyRound
} from 'lucide-react';

export const DevicesHubView: React.FC = () => {
  const { 
    devices, 
    disconnectDevice, 
    refreshDevices, 
    masterPairingPin, 
    refreshMasterPin, 
    syncAllDevices,
    pingDevice,
    sendRemoteBarcodeScan,
    products,
    notify,
    t, 
    language,
    setIsDataTransferModalOpen,
    setIsConnectToCashierModalOpen
  } = useApp();

  const [isPairModalOpen, setIsPairModalOpen] = useState(false);
  const [activeDedicatedMode, setActiveDedicatedMode] = useState<DeviceRole | null>(null);
  const [pingingDeviceId, setPingingDeviceId] = useState<string | null>(null);

  // If a dedicated full-screen mode is launched
  if (activeDedicatedMode === 'kitchen_display') {
    return <KitchenDisplayView onBackToMain={() => setActiveDedicatedMode(null)} />;
  }
  if (activeDedicatedMode === 'customer_display') {
    return <CustomerFacingDisplayView onBackToMain={() => setActiveDedicatedMode(null)} />;
  }
  if (activeDedicatedMode === 'waiter_mobile') {
    return <MobileWaiterView onBackToMain={() => setActiveDedicatedMode(null)} />;
  }
  if (activeDedicatedMode === 'stock_scanner') {
    return <MobileStockScannerView onBackToMain={() => setActiveDedicatedMode(null)} />;
  }

  const roleMeta: Record<DeviceRole, { labelAr: string; labelEn: string; icon: React.ElementType; color: string; badgeBg: string }> = {
    master_pos: {
      labelAr: 'الكاشير المركزي (Master POS)',
      labelEn: 'Master POS Terminal',
      icon: Laptop,
      color: 'text-amber-500',
      badgeBg: 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
    },
    secondary_pos: {
      labelAr: 'كاشير فرعي (Satellite)',
      labelEn: 'Secondary Cashier',
      icon: Laptop,
      color: 'text-blue-500',
      badgeBg: 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800'
    },
    kitchen_display: {
      labelAr: 'شاشة المطبخ (KDS)',
      labelEn: 'Kitchen Display (KDS)',
      icon: UtensilsCrossed,
      color: 'text-rose-500',
      badgeBg: 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800'
    },
    customer_display: {
      labelAr: 'شاشة العميل (CFD)',
      labelEn: 'Customer Display (CFD)',
      icon: Tv,
      color: 'text-purple-500',
      badgeBg: 'bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-800'
    },
    waiter_mobile: {
      labelAr: 'هاتف النادل المتنقل',
      labelEn: 'Mobile Waiter Pad',
      icon: Smartphone,
      color: 'text-emerald-500',
      badgeBg: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
    },
    stock_scanner: {
      labelAr: 'ماسح الجرد المتنقل',
      labelEn: 'Stock Barcode Scanner',
      icon: ScanBarcode,
      color: 'text-cyan-500',
      badgeBg: 'bg-cyan-100 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800'
    }
  };

  const getDeviceTypeIcon = (type: string) => {
    if (type === 'mobile') return Smartphone;
    if (type === 'tablet') return Tablet;
    return Laptop;
  };

  const onlineDevicesCount = devices.filter(d => d.isOnline).length;

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6 bg-slate-50 dark:bg-slate-950 font-sans select-none">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              {t('devicesTitle')}
            </h1>
            <span className="text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
              {onlineDevicesCount} {language === 'ar' ? 'أجهزة متصلة ومزامنة' : 'Online Devices'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
            {t('devicesSubtitle')}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          {/* Master PIN Pill */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 py-1.5 px-3 rounded-2xl border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
              {language === 'ar' ? 'رمز الربط PIN:' : 'PIN:'}
            </span>
            <span className="text-sm font-black font-mono text-amber-600 dark:text-amber-400">
              {masterPairingPin}
            </span>
            <button
              onClick={refreshMasterPin}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              title={t('refreshPin')}
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>

          <button
            onClick={syncAllDevices}
            className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
            title={t('syncAllDevicesNow')}
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            id="btn-device-data-transfer"
            onClick={() => setIsDataTransferModalOpen(true)}
            className="py-2.5 px-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
            title="نقل ومزامنة البيانات بين الأجهزة عبر كود الربط"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-500" />
            <span>نقل البيانات (كود الربط)</span>
          </button>

          <button
            id="btn-pair-by-cashier-code"
            onClick={() => setIsConnectToCashierModalOpen(true)}
            className="py-2.5 px-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
            title="ربط هذه الشاشة أو جهاز جديد بإدخال الكود المعروض على شاشة الكاشير"
          >
            <KeyRound className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{language === 'ar' ? 'ربط بكود الكاشير' : 'Connect via Cashier PIN'}</span>
          </button>

          <button
            id="btn-pair-new-device"
            onClick={() => setIsPairModalOpen(true)}
            className="flex-1 md:flex-initial py-2.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-95 text-white text-xs font-black shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{t('pairNewDevice')}</span>
          </button>
        </div>
      </div>

      {/* Quick Launch Dedicated Modes */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>{language === 'ar' ? 'اختبار وتشغيل الشاشات المتخصصة مباشرة:' : 'Launch Specialized Screen Interfaces:'}</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Kitchen Display (KDS) */}
          <div
            onClick={() => setActiveDedicatedMode('kitchen_display')}
            className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-amber-500/60 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UtensilsCrossed className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded-md">
                  KDS
                </span>
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                {language === 'ar' ? 'شاشة المطبخ والطلبات (KDS)' : 'Kitchen Display (KDS)'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {language === 'ar' ? 'تذاكر حية للطهاة، مؤقتات للوجبات، وتنبيه صوتي' : 'Live order tickets, cook timers & audio alerts'}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-rose-600 dark:text-rose-400">
              <span>{language === 'ar' ? 'فتح شاشة المطبخ' : 'Open KDS'}</span>
              <Maximize2 className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* 2. Customer Display (CFD) */}
          <div
            onClick={() => setActiveDedicatedMode('customer_display')}
            className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-amber-500/60 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Tv className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-md">
                  CFD
                </span>
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                {language === 'ar' ? 'شاشة العميل التفاعلية (CFD)' : 'Customer Display (CFD)'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {language === 'ar' ? 'عرض السلة الحية، العروض الترويجية، وكود الدفع' : 'Live cart reflection, promos & QR pay'}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-purple-600 dark:text-purple-400">
              <span>{language === 'ar' ? 'فتح شاشة العميل' : 'Open CFD'}</span>
              <Maximize2 className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* 3. Mobile Waiter Pad */}
          <div
            onClick={() => setActiveDedicatedMode('waiter_mobile')}
            className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-amber-500/60 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Smartphone className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-md">
                  Waiter
                </span>
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                {language === 'ar' ? 'هاتف النادل والطلبات' : 'Mobile Waiter Pad'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {language === 'ar' ? 'تسجيل طلبات الطاولات والتوصيل وإرسالها فورياً' : 'Handheld dining orders sent to kitchen'}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <span>{language === 'ar' ? 'فتح تطبيق النادل' : 'Open Waiter'}</span>
              <Maximize2 className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* 4. Stock Barcode Scanner */}
          <div
            onClick={() => setActiveDedicatedMode('stock_scanner')}
            className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-amber-500/60 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ScanBarcode className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-300 px-2 py-0.5 rounded-md">
                  Scanner
                </span>
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                {language === 'ar' ? 'ماسح الجرد المتنقل' : 'Stock Scanner'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {language === 'ar' ? 'قراءة الباركود بكاميرا الهاتف وتحديث الرفوف' : 'Camera barcode scan for stock audit'}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-cyan-600 dark:text-cyan-400">
              <span>{language === 'ar' ? 'فتح ماسح الجرد' : 'Open Scanner'}</span>
              <Maximize2 className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Active Connected Terminals List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-500" />
            <span>{t('activeTerminalsCount')} ({devices.length})</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.map(device => {
            const meta = roleMeta[device.role] || roleMeta.secondary_pos;
            const RoleIcon = meta.icon;
            const DevTypeIcon = getDeviceTypeIcon(device.deviceType);

            return (
              <div
                key={device.id}
                className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Card Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border flex items-center gap-1.5 ${meta.badgeBg}`}>
                      <RoleIcon className="w-3.5 h-3.5" />
                      <span>{language === 'ar' ? meta.labelAr : meta.labelEn}</span>
                    </span>

                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${device.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        {device.isOnline ? t('onlineStatus') : t('offlineStatus')}
                      </span>
                    </div>
                  </div>

                  {/* Device Title */}
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <DevTypeIcon className="w-4 h-4 text-slate-400" />
                    <span>{device.name}</span>
                  </h3>

                  {/* Device Specs */}
                  <div className="grid grid-cols-2 gap-2 mt-3 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-2xl">
                    <div className="flex items-center gap-1.5">
                      <Battery className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{device.batteryLevel || 95}% {t('batteryLevel')}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span>{device.branchName || 'الفرع الرئيسي'}</span>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => setActiveDedicatedMode(device.role)}
                      className="flex-1 py-1.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-white text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>{t('openDedicatedScreen')}</span>
                    </button>

                    <button
                      onClick={async () => {
                        setPingingDeviceId(device.id);
                        await pingDevice(device.id);
                        setTimeout(() => setPingingDeviceId(null), 800);
                      }}
                      className="py-1.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500 hover:text-white text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                      title={language === 'ar' ? 'فحص الاتصال الفوري بالجهاز' : 'Ping Device'}
                    >
                      <Wifi className={`w-3.5 h-3.5 ${pingingDeviceId === device.id ? 'animate-spin text-emerald-400' : ''}`} />
                      <span>{pingingDeviceId === device.id ? 'جارٍ...' : 'Ping'}</span>
                    </button>

                    {device.role !== 'master_pos' && (
                      <button
                        onClick={() => disconnectDevice(device.id)}
                        className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title={t('disconnectDevice')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* If scanner role, provide quick test scan button */}
                  {(device.role === 'stock_scanner' || device.role === 'secondary_pos') && products.length > 0 && (
                    <button
                      onClick={async () => {
                        const sampleProd = products[0];
                        await sendRemoteBarcodeScan(sampleProd.barcode, 1, device.name);
                        notify(
                          '⚡ تجربة مسح باركود ناجحة',
                          `تم إرسال باركود تجريبي (${sampleProd.barcode}) لكاشير البيع فوراً`,
                          'success'
                        );
                      }}
                      className="w-full py-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg flex items-center justify-center gap-1 transition-colors"
                    >
                      <ScanBarcode className="w-3 h-3" />
                      <span>{language === 'ar' ? 'إرسال باركود تجريبي للسلة الآن' : 'Test Send Barcode to Cart'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Network & Multi-Terminal Architecture Info Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 p-5 rounded-3xl flex items-start gap-3.5">
        <div className="p-2.5 bg-amber-500 text-white rounded-2xl shadow-md shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-xs font-black text-slate-900 dark:text-white">
            {language === 'ar' ? 'بنية الربط السحابي والشبكي المتطور لكيان كاشير' : 'KIAN Mesh Sync & Multi-Terminal Architecture'}
          </h3>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
            {language === 'ar'
              ? 'تتيح لك تقنية الربط الشبكي فتح النظام على عدة شاشات في نفس الوقت (شاشة الكاشير الرئيسي، شاشة المطبخ، شاشة الزبون، وهواتف النوادل). يتم تحديث الفواتير والمخزون والطلبات فورياً وبشكل متزامن عبر شبكة Wi-Fi أو الإنترنت دون أي تأخير.'
              : 'Multi-device synchronization connects your master POS register with Kitchen Displays (KDS), Customer-Facing Displays (CFD), and mobile handheld pads seamlessly in real time.'}
          </p>
        </div>
      </div>

      {/* Pairing Modal */}
      {isPairModalOpen && (
        <DevicePairingModal
          isOpen={isPairModalOpen}
          onClose={() => setIsPairModalOpen(false)}
        />
      )}
    </div>
  );
};
