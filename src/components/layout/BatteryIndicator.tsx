import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Battery,
  BatteryCharging,
  BatteryLow,
  BatteryMedium,
  BatteryWarning,
  Zap,
  Leaf,
  Sliders,
  Check,
  Power,
  ShieldCheck,
  AlertTriangle,
  Info,
  ChevronDown,
  X,
  Sparkles
} from 'lucide-react';

export const BatteryIndicator: React.FC = () => {
  const {
    batteryInfo,
    updateBatteryInfo,
    isPowerSavingActive,
    isPowerSavingStandby,
    togglePowerSaving,
    setPowerSavingActive,
    settings,
    updateSettings,
    setActiveTab,
    language,
    notify
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const level = Math.min(100, Math.max(0, batteryInfo.level || 0));
  const isCharging = Boolean(batteryInfo.charging);
  const isLow = level <= 20;
  const isMedium = level > 20 && level <= 50;

  // Determine current system power state & color configuration
  type PowerState = 'power_saving' | 'charging' | 'critical' | 'medium' | 'healthy';
  let powerState: PowerState = 'healthy';

  if (isPowerSavingActive) {
    powerState = 'power_saving';
  } else if (isCharging) {
    powerState = 'charging';
  } else if (isLow) {
    powerState = 'critical';
  } else if (isMedium) {
    powerState = 'medium';
  } else {
    powerState = 'healthy';
  }

  // Dynamic Visual Style Configurations based on power state
  const stateConfig = {
    power_saving: {
      labelAr: 'وضع التوفير',
      labelEn: 'Eco Mode',
      badgeAr: 'توفير الطاقة نشط 🌿',
      badgeEn: 'Eco Saver Active',
      buttonBg: 'bg-amber-500/15 dark:bg-amber-950/60 hover:bg-amber-500/25',
      borderColor: 'border-amber-400/80 dark:border-amber-500/60 ring-1 ring-amber-400/40',
      textColor: 'text-amber-800 dark:text-amber-300',
      barColor: 'bg-amber-500',
      iconColor: 'text-amber-600 dark:text-amber-400',
      icon: Leaf,
    },
    charging: {
      labelAr: 'جاري الشحن',
      labelEn: 'Charging',
      badgeAr: 'متصل بالشاحن ⚡',
      badgeEn: 'Plugged In ⚡',
      buttonBg: 'bg-emerald-500/10 dark:bg-emerald-950/60 hover:bg-emerald-500/20',
      borderColor: 'border-emerald-400/70 dark:border-emerald-500/50',
      textColor: 'text-emerald-800 dark:text-emerald-300',
      barColor: 'bg-emerald-500',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      icon: BatteryCharging,
    },
    critical: {
      labelAr: 'شحن منخفض',
      labelEn: 'Low Battery',
      badgeAr: 'شحن منخفض جداً!',
      badgeEn: 'Critically Low!',
      buttonBg: 'bg-rose-500/15 dark:bg-rose-950/60 hover:bg-rose-500/25 animate-pulse',
      borderColor: 'border-rose-400 dark:border-rose-500 ring-1 ring-rose-400/40',
      textColor: 'text-rose-800 dark:text-rose-300',
      barColor: 'bg-rose-500',
      iconColor: 'text-rose-600 dark:text-rose-400',
      icon: BatteryWarning,
    },
    medium: {
      labelAr: 'مستوى متوسط',
      labelEn: 'Medium',
      badgeAr: 'مستوى شحن متوسط',
      badgeEn: 'Medium Battery',
      buttonBg: 'bg-amber-500/10 dark:bg-amber-950/40 hover:bg-amber-500/20',
      borderColor: 'border-amber-300 dark:border-amber-700/80',
      textColor: 'text-amber-800 dark:text-amber-300',
      barColor: 'bg-amber-500',
      iconColor: 'text-amber-600 dark:text-amber-400',
      icon: BatteryMedium,
    },
    healthy: {
      labelAr: 'شحن كافٍ',
      labelEn: 'Good',
      badgeAr: 'شحن البطارية جيد',
      badgeEn: 'Battery Healthy',
      buttonBg: 'bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80',
      borderColor: 'border-slate-200 dark:border-slate-700',
      textColor: 'text-slate-700 dark:text-slate-300',
      barColor: 'bg-emerald-500',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      icon: Battery,
    },
  }[powerState];

  const StatusIcon = stateConfig.icon;

  const handleSimulateBattery = (simLevel: number, simCharging: boolean) => {
    updateBatteryInfo({
      level: simLevel,
      charging: simCharging,
      supported: true
    });
    notify(
      'محاكاة الشحن',
      `تم ضبط محاكاة البطارية إلى ${simLevel}% (${simCharging ? 'متصل بالشاحن ⚡' : 'يعمل على البطارية 🔋'})`,
      'info'
    );
  };

  const autoLowBatteryEnabled = settings.autoEnablePowerSavingOnLowBattery !== false;

  const toggleAutoLowBattery = () => {
    const nextVal = !autoLowBatteryEnabled;
    updateSettings({ autoEnablePowerSavingOnLowBattery: nextVal });
    notify(
      'التوفير التلقائي',
      nextVal
        ? 'سيتم تفعيل وضع توفير الطاقة تلقائياً عند انخفاض البطارية إلى 20%'
        : 'تم إلغاء التفعيل التلقائي عند انخفاض البطارية',
      'info'
    );
  };

  return (
    <div className="relative inline-flex items-center">
      {/* Header Battery Pill Button */}
      <button
        ref={buttonRef}
        id="btn-header-battery-indicator"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-xl border text-xs font-mono font-bold transition-all active:scale-95 cursor-pointer shadow-2xs ${stateConfig.buttonBg} ${stateConfig.borderColor} ${stateConfig.textColor}`}
        title={`حالة الطاقة: ${level}% — ${language === 'ar' ? stateConfig.badgeAr : stateConfig.badgeEn}. انقر لإدارة وضع توفير الطاقة`}
        aria-label="Battery Status and Power Saving"
      >
        {/* Horizontal Battery Graphic */}
        <div className="relative flex items-center">
          <div className="w-5 h-2.5 rounded-[3px] border border-current p-[1px] flex items-center">
            <div
              className={`h-full rounded-[1.5px] transition-all duration-300 ${stateConfig.barColor}`}
              style={{ width: `${Math.max(8, level)}%` }}
            />
          </div>
          {/* Battery Positive Tip */}
          <div className="w-0.5 h-1 bg-current rounded-e-[1px] -ms-[1px]" />
          
          {/* Lightning badge overlay when charging */}
          {isCharging && (
            <Zap className="w-2.5 h-2.5 text-amber-500 fill-amber-500 absolute -top-1 -start-1 drop-shadow-xs" />
          )}

          {/* Leaf overlay when Eco mode is active */}
          {isPowerSavingActive && !isCharging && (
            <span className="text-[9px] absolute -top-1.5 -start-1 leading-none select-none">
              🌿
            </span>
          )}
        </div>

        {/* Battery Level Percentage */}
        <span className="text-[11px] font-black tracking-tight">
          {level}%
        </span>

        {/* Status Cue Icon */}
        {isPowerSavingActive ? (
          <span className="text-[10px] hidden md:inline font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 px-1 py-0.2 rounded font-sans">
            Eco
          </span>
        ) : isCharging ? (
          <Zap className="w-3 h-3 text-emerald-500 fill-emerald-500 shrink-0" />
        ) : isLow ? (
          <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />
        ) : null}
      </button>

      {/* Interactive Power & Battery Popover */}
      {isOpen && (
        <div
          ref={popoverRef}
          id="popover-battery-power-manager"
          className="absolute end-0 top-full mt-2 w-80 sm:w-92 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 z-50 animate-in fade-in slide-in-from-top-2 text-slate-900 dark:text-white space-y-4"
        >
          {/* Popover Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${stateConfig.buttonBg} ${stateConfig.textColor}`}>
                <StatusIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white">
                  طاقة النظام والشحن (Power & Battery)
                </h3>
                <p className="text-[10px] text-slate-400">
                  مستوى البطارية والتحكم بوضع توفير الطاقة
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Large Battery Gauge Card */}
          <div className={`p-4 rounded-2xl border ${stateConfig.buttonBg} ${stateConfig.borderColor} space-y-3`}>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">
                  مستوى الشحن الحالي:
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-3xl font-black font-mono tracking-tight">
                    {level}%
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    {isCharging ? '(متصل بالتيار ⚡)' : '(يعمل بالبطارية 🔋)'}
                  </span>
                </div>
              </div>

              {/* Graphical Pill Icon */}
              <div className="relative">
                <div className="w-14 h-7 rounded-lg border-2 border-current p-0.5 flex items-center">
                  <div
                    className={`h-full rounded-md transition-all duration-500 ${stateConfig.barColor}`}
                    style={{ width: `${Math.max(6, level)}%` }}
                  />
                </div>
                <div className="w-1 h-3 bg-current rounded-e-sm absolute -end-1 top-1/2 -translate-y-1/2" />
                {isCharging && (
                  <Zap className="w-4 h-4 text-amber-400 fill-amber-400 absolute inset-0 m-auto drop-shadow-md" />
                )}
              </div>
            </div>

            {/* Meter Progress Bar */}
            <div className="w-full bg-slate-200/80 dark:bg-slate-700/80 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${stateConfig.barColor}`}
                style={{ width: `${level}%` }}
              />
            </div>

            {/* Status Information Details */}
            <div className="flex items-center justify-between text-[11px] font-bold pt-1">
              <span className="flex items-center gap-1">
                {isCharging ? (
                  <>
                    <Zap className="w-3.5 h-3.5 text-emerald-500" />
                    <span>جاري الشحن السريع للكاشير</span>
                  </>
                ) : isLow ? (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                    <span className="text-rose-600 dark:text-rose-400">البطارية منخفضة — يرجى التوصيل بالشاحن</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>حالة تفريغ طبيعية ومستقرة</span>
                  </>
                )}
              </span>

              {batteryInfo.supported && (
                <span className="text-[10px] text-slate-400 font-mono">
                  Web Battery API ✓
                </span>
              )}
            </div>
          </div>

          {/* MAIN POWER SAVING TOGGLE CARD (الاندماج مع ميزة توفير الطاقة) */}
          <div className={`p-3.5 rounded-2xl border transition-all ${
            isPowerSavingActive
              ? 'bg-amber-500/10 dark:bg-amber-950/40 border-amber-400/80 dark:border-amber-600'
              : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80'
          }`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm ${
                  isPowerSavingActive
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}>
                  <Leaf className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>وضع توفير الطاقة (Eco Saver)</span>
                    {isPowerSavingActive && (
                      <span className="text-[9px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.2 rounded-full">
                        نشط الآن
                      </span>
                    )}
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                    {isPowerSavingActive
                      ? 'تم تعتيم الشاشة وخفض استهلاك المعالج لإطالة عمر البطارية بنسبة تصل إلى 40%'
                      : 'الشاشة بكامل سطوعها والمؤثرات البصرية مفعلة'}
                  </p>
                </div>
              </div>

              {/* Tactile Switch Button */}
              <button
                type="button"
                id="btn-toggle-power-saving-from-battery"
                onClick={togglePowerSaving}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isPowerSavingActive ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-600'
                }`}
                title="تشغيل / إيقاف وضع توفير الطاقة"
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    isPowerSavingActive ? (language === 'ar' ? '-translate-x-5' : 'translate-x-5') : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Auto Low-Battery Protection Switch */}
          <div className="flex items-center justify-between px-2 py-1 text-xs">
            <label htmlFor="chk-auto-power-saving" className="text-slate-600 dark:text-slate-300 font-bold cursor-pointer flex items-center gap-2">
              <input
                id="chk-auto-power-saving"
                type="checkbox"
                checked={autoLowBatteryEnabled}
                onChange={toggleAutoLowBattery}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
              <span>تفعيل التوفير تلقائياً عند انخفاض الشحن (≤ 20%)</span>
            </label>
          </div>

          {/* Simulation & Testing Bar (اختبار الحالات) */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
              <span>أزرار تجربة مستويات الشحن المختلفة:</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() => handleSimulateBattery(15, false)}
                className="px-2 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 text-[10px] font-bold hover:bg-rose-100 transition-colors"
                title="محاكاة شحن حرج 15%"
              >
                15% حرج 🚨
              </button>
              <button
                type="button"
                onClick={() => handleSimulateBattery(45, false)}
                className="px-2 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60 text-[10px] font-bold hover:bg-amber-100 transition-colors"
                title="محاكاة شحن متوسط 45%"
              >
                45% متوسط ⚠️
              </button>
              <button
                type="button"
                onClick={() => handleSimulateBattery(95, false)}
                className="px-2 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60 text-[10px] font-bold hover:bg-emerald-100 transition-colors"
                title="محاكاة شحن ممتاز 95%"
              >
                95% ممتاز ✓
              </button>
              <button
                type="button"
                onClick={() => handleSimulateBattery(level, !isCharging)}
                className="px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[10px] font-bold hover:bg-slate-200 transition-colors"
                title="تبديل وضع الشحن/البطارية"
              >
                {isCharging ? 'فصل الشاحن 🔌' : 'وصل الشاحن ⚡'}
              </button>
            </div>
          </div>

          {/* Quick link to Settings -> Appearance */}
          <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-[10px] text-slate-400">
              يمكن ضبط درجة التعتيم في إعدادات المظهر
            </span>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setActiveTab('settings');
              }}
              className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
            >
              <Sliders className="w-3 h-3" />
              <span>الإعدادات المتقدمة</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
