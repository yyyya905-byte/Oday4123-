import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ThemeColorPreset, ThemeColorItem } from '../../types';
import {
  THEME_COLOR_PRESETS,
  getThemeColorConfig,
  generateShadesFromHex,
  isValidHex
} from '../../utils/themeColorUtils';
import {
  Palette,
  Check,
  Sparkles,
  RotateCcw,
  Eye,
  Store,
  Sliders,
  CheckCircle2,
  ChevronRight,
  Sun,
  Moon,
  Receipt,
  ShoppingCart,
  QrCode,
  UtensilsCrossed
} from 'lucide-react';
import { soundEffects } from '../../services/audio';
import {
  QR_MENU_THEME_PRESETS,
  DEFAULT_QR_MENU_THEME,
} from '../menu/CustomerQrMenuPage';

interface ThemeColorSelectorProps {
  onColorChanged?: (preset: ThemeColorPreset, hex?: string) => void;
  compact?: boolean;
}

export const ThemeColorSelector: React.FC<ThemeColorSelectorProps> = ({
  onColorChanged,
  compact = false
}) => {
  const {
    settings,
    activeThemeColor,
    activePrimaryHex,
    setThemeColor,
    updateQrMenuTheme,
    setIsCustomerMenuPreviewOpen,
    businessMode,
    theme,
    notify
  } = useApp();

  const activeQrTheme = {
    ...DEFAULT_QR_MENU_THEME,
    ...(settings.qrMenuTheme || {}),
  };

  const [selectedPreset, setSelectedPreset] = useState<ThemeColorPreset>(
    settings.themeColor || activeThemeColor || 'amber'
  );
  const [customHexInput, setCustomHexInput] = useState<string>(
    settings.primaryColorHex || activePrimaryHex || '#f59e0b'
  );
  const [isCustomMode, setIsCustomMode] = useState<boolean>(
    selectedPreset === 'custom'
  );
  const [previewMode, setPreviewMode] = useState<'light' | 'dark'>(theme);

  // Active or previewed configuration
  const currentConfig: ThemeColorItem = getThemeColorConfig(
    selectedPreset,
    isCustomMode ? customHexInput : undefined
  );

  const handleSelectPreset = (presetId: ThemeColorPreset) => {
    setSelectedPreset(presetId);
    setIsCustomMode(false);
    soundEffects.playClick();
    setThemeColor(presetId);
    if (onColorChanged) {
      const cfg = getThemeColorConfig(presetId);
      onColorChanged(presetId, cfg.primaryHex);
    }
  };

  const handleApplyCustomHex = (hex: string) => {
    let formatted = hex.trim();
    if (!formatted.startsWith('#')) {
      formatted = `#${formatted}`;
    }
    setCustomHexInput(formatted);
    if (isValidHex(formatted)) {
      setSelectedPreset('custom');
      setIsCustomMode(true);
      setThemeColor('custom', formatted);
      soundEffects.playSuccess();
      if (onColorChanged) {
        onColorChanged('custom', formatted);
      }
    }
  };

  const handleResetToDefault = () => {
    setSelectedPreset('amber');
    setCustomHexInput('#f59e0b');
    setIsCustomMode(false);
    setThemeColor('amber', '#f59e0b');
    soundEffects.playClick();
    notify('تمت استعادة اللون الذهبي والعسلي الافتراضي للنظام', 'info');
    if (onColorChanged) {
      onColorChanged('amber', '#f59e0b');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-5 sm:p-6 rounded-3xl border border-slate-700/80 shadow-lg relative overflow-hidden">
        <div
          className="absolute -top-12 -left-12 w-48 h-48 rounded-full blur-3xl opacity-30 pointer-events-none transition-all duration-500"
          style={{ backgroundColor: currentConfig.primaryHex }}
        />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span
                className="p-2.5 rounded-2xl text-white shadow-md transition-colors"
                style={{ backgroundColor: currentConfig.primaryHex }}
              >
                <Palette className="w-5 h-5 text-slate-950" />
              </span>
              <div>
                <h3 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                  <span>نظام الألوان وهوية المتجر (Theme Color & Store Brand)</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-white border border-white/15">
                    تخصيص كامل
                  </span>
                </h3>
                <p className="text-xs text-slate-300 max-w-xl leading-relaxed mt-0.5">
                  خصص اللون الأساسي للتطبيق ليطابق شعار وهوية متجرك بدقة. يتغير فورياً على كافة الأزرار، القوائم، بطاقات البيع، وشاشات النظام.
                </p>
              </div>
            </div>
          </div>

          {/* Current Active Color Pill */}
          <div className="flex items-center gap-3 bg-white/10 border border-white/15 px-4 py-2.5 rounded-2xl backdrop-blur-md self-start md:self-auto">
            <div
              className="w-7 h-7 rounded-xl shadow-md border-2 border-white/80 shrink-0 transition-transform hover:scale-110"
              style={{ backgroundColor: currentConfig.primaryHex }}
            />
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-bold">اللون النشط حالياً:</span>
              <span className="text-xs font-black text-white font-mono flex items-center gap-1.5">
                <span>{currentConfig.nameAr}</span>
                <span className="text-[11px] opacity-75">({currentConfig.primaryHex})</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Preset Palettes Grid */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
              اختر لوناً متناسقاً يطابق نشاط متجرك التجاري:
            </h4>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={handleResetToDefault}
              className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer py-1 px-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <RotateCcw className="w-3 h-3" />
              <span>استعادة الذهبي الافتراضي</span>
            </button>
          </div>
        </div>

        {/* 12 Presets Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {THEME_COLOR_PRESETS.map(preset => {
            const isSelected = selectedPreset === preset.id && !isCustomMode;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset.id)}
                className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between gap-3 relative group ${
                  isSelected
                    ? 'border-2 shadow-md ring-2 bg-slate-50/80 dark:bg-slate-800/80'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/60 hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
                }`}
                style={{
                  borderColor: isSelected ? preset.primaryHex : undefined,
                  boxShadow: isSelected ? `0 4px 14px -2px ${preset.primaryHex}40` : undefined
                }}
              >
                {/* Top Bar with Color Swatch & Badge */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-xl shadow-xs border border-white/20 shrink-0 flex items-center justify-center text-white transition-transform group-hover:scale-105"
                      style={{ backgroundColor: preset.primaryHex }}
                    >
                      {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                    </div>
                    <div>
                      <h5 className="text-xs font-black text-slate-900 dark:text-white">
                        {preset.nameAr}
                      </h5>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        {preset.primaryHex}
                      </span>
                    </div>
                  </div>

                  <span
                    className="px-2 py-0.5 rounded-full text-[9px] font-black shrink-0 border"
                    style={{
                      backgroundColor: `${preset.primaryHex}15`,
                      color: preset.primaryHex,
                      borderColor: `${preset.primaryHex}30`
                    }}
                  >
                    {preset.badge}
                  </span>
                </div>

                {/* Recommendation Description */}
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed text-right line-clamp-2">
                  {preset.recommendedFor}
                </p>

                {/* Shades preview strip */}
                <div className="flex items-center gap-1 pt-2 border-t border-slate-100 dark:border-slate-800/70">
                  <span
                    className="flex-1 h-2 rounded-full"
                    style={{ backgroundColor: preset.shades[100] }}
                    title="100 Light"
                  />
                  <span
                    className="flex-1 h-2 rounded-full"
                    style={{ backgroundColor: preset.shades[300] }}
                    title="300 Subtle"
                  />
                  <span
                    className="flex-1 h-2 rounded-full"
                    style={{ backgroundColor: preset.shades[500] }}
                    title="500 Primary"
                  />
                  <span
                    className="flex-1 h-2 rounded-full"
                    style={{ backgroundColor: preset.shades[700] }}
                    title="700 Dark"
                  />
                  <span
                    className="flex-1 h-2 rounded-full"
                    style={{ backgroundColor: preset.shades[900] }}
                    title="900 Deep"
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom HEX Color Picker Section */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                اختيار لون مخصص برمز HEX (Custom Store Brand HEX):
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                إذا كان لمتجرك كود لون محدد أو تدرج خاص لشعارك التجاري، أدخله هنا لتطبيقه وتوليد كافة ظلاله تلقائياً.
              </p>
            </div>
          </div>

          {isCustomMode && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>اللون المخصص مفعّل حالياً</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          {/* Inputs Container */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              رمز اللون المخصص (HEX Code):
            </label>
            <div className="flex items-center gap-2">
              {/* Native Color Picker Circle */}
              <div className="relative">
                <input
                  type="color"
                  value={isValidHex(customHexInput) ? customHexInput : '#f59e0b'}
                  onChange={e => handleApplyCustomHex(e.target.value)}
                  className="w-11 h-11 rounded-2xl cursor-pointer border border-slate-200 dark:border-slate-700 p-0.5 bg-white dark:bg-slate-800 shadow-xs"
                />
              </div>

              {/* Text Input for HEX */}
              <div className="relative flex-1">
                <input
                  type="text"
                  value={customHexInput}
                  onChange={e => handleApplyCustomHex(e.target.value)}
                  placeholder="#F59E0B"
                  maxLength={7}
                  className="w-full text-sm font-mono font-black uppercase px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2"
                  style={{
                    outlineColor: isValidHex(customHexInput) ? customHexInput : undefined
                  }}
                />
              </div>

              {/* Apply Button */}
              <button
                type="button"
                onClick={() => handleApplyCustomHex(customHexInput)}
                disabled={!isValidHex(customHexInput)}
                className="px-4 py-2.5 rounded-xl font-black text-xs text-white shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
                style={{
                  backgroundColor: isValidHex(customHexInput) ? customHexInput : '#64748b'
                }}
              >
                <Check className="w-3.5 h-3.5 text-slate-950" />
                <span className="text-slate-950">تطبيق اللون</span>
              </button>
            </div>

            {/* Quick Suggestions Chips */}
            <div className="pt-2">
              <span className="text-[10px] text-slate-400 font-bold block mb-1.5">اقتراحات سريعة لألوان المتاجر العالمية:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { name: 'كافيه موكا', hex: '#6f4e37' },
                  { name: 'ليمون نعناع', hex: '#84cc16' },
                  { name: 'كحلي نيفي', hex: '#0f172a' },
                  { name: 'أكوا مارين', hex: '#0284c7' },
                  { name: 'فوشيا فاخر', hex: '#d946ef' },
                  { name: 'برتقالي مرجاني', hex: '#ea580c' },
                  { name: 'رملي صحراوي', hex: '#d97706' },
                ].map(chip => (
                  <button
                    key={chip.hex}
                    type="button"
                    onClick={() => handleApplyCustomHex(chip.hex)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[10px] font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: chip.hex }}
                    />
                    <span>{chip.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Generated Palette Strip Preview */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2">
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
              التدرجات اللونية الـ 11 المولدة تلقائياً لنظام الكاشير (Shades 50-950):
            </span>
            <div className="grid grid-cols-11 gap-1">
              {([50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const).map(shade => {
                const colorVal = currentConfig.shades[shade];
                return (
                  <div key={shade} className="text-center group">
                    <div
                      className="w-full h-8 rounded-lg shadow-2xs border border-black/10 transition-transform group-hover:scale-110"
                      style={{ backgroundColor: colorVal }}
                      title={`${shade}: ${colorVal}`}
                    />
                    <span className="text-[8px] font-mono text-slate-400 mt-1 block">
                      {shade}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
              <span>درجات الإضاءة الخفيفة والخلفيات</span>
              <span className="font-bold text-slate-600 dark:text-slate-300">اللون الأساسي (500)</span>
              <span>درجات الظلال والحدود الداكنة</span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Cashier Screen Simulator (Real-Time Interactive Preview) */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div
              className="p-2 rounded-xl text-white shadow-xs"
              style={{ backgroundColor: currentConfig.primaryHex }}
            >
              <Eye className="w-4 h-4 text-slate-950" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                معاينة حية وتفاعلية لشاشة الكاشير بالهوية المختارة:
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                شاهد كيف تظهر بطاقات المنتجات، الفاتورة، وأزرار الدفع عند اختيار هذا اللون
              </p>
            </div>
          </div>

          {/* Toggle Simulated Light/Dark */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setPreviewMode('light')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                previewMode === 'light'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>نهاري</span>
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode('dark')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                previewMode === 'dark'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
              <span>ليلي</span>
            </button>
          </div>
        </div>

        {/* The Simulated Screen Canvas */}
        <div
          className={`p-4 sm:p-5 rounded-2xl border transition-all ${
            previewMode === 'dark'
              ? 'bg-slate-950 text-white border-slate-800'
              : 'bg-slate-50 text-slate-900 border-slate-200'
          }`}
        >
          {/* Simulated Mini Header */}
          <div
            className={`p-3 rounded-xl border flex items-center justify-between mb-4 ${
              previewMode === 'dark'
                ? 'bg-slate-900/90 border-slate-800'
                : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs text-slate-950 shadow-sm"
                style={{ backgroundColor: currentConfig.primaryHex }}
              >
                K
              </div>
              <div>
                <span className="text-xs font-black block">{settings.storeNameAr || 'متجر كاشير النموذجي'}</span>
                <span className="text-[10px] text-slate-400">شاشة نقاط البيع - مظهر الهوية</span>
              </div>
            </div>

            {/* Category Pills Strip in Mini Header */}
            <div className="hidden sm:flex items-center gap-1.5">
              <span
                className="px-2.5 py-1 rounded-lg text-[10px] font-black text-slate-950 shadow-xs"
                style={{ backgroundColor: currentConfig.primaryHex }}
              >
                الكل (نشط)
              </span>
              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${previewMode === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                المشروبات
              </span>
              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${previewMode === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                الأغذية
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono"
                style={{
                  backgroundColor: `${currentConfig.primaryHex}20`,
                  color: currentConfig.primaryHex
                }}
              >
                {currentConfig.nameAr}
              </span>
            </div>
          </div>

          {/* Simulated POS Grid: 2 Products + 1 Mini Cart */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* Simulated Product Card 1 */}
            <div
              className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                previewMode === 'dark'
                  ? 'bg-slate-900 border-slate-800'
                  : 'bg-white border-slate-200 shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className="text-[10px] text-slate-400 font-mono">باركود: 62100881</span>
                  <span
                    className="text-[9px] px-2 py-0.2 rounded-md font-bold"
                    style={{
                      backgroundColor: `${currentConfig.primaryHex}15`,
                      color: currentConfig.primaryHex
                    }}
                  >
                    متوفر (48)
                  </span>
                </div>
                <h5 className="text-xs font-black">منتج هوية المتجر الفاخر</h5>
                <p className="text-[10px] text-slate-400 mt-0.5">عبوة متميزة سعة 500 مل</p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                <span
                  className="text-xs font-black font-mono"
                  style={{ color: currentConfig.primaryHex }}
                >
                  25,000 ل.س
                </span>
                <button
                  type="button"
                  onClick={() => soundEffects.playBeep()}
                  className="px-3 py-1 rounded-lg text-slate-950 text-[10px] font-black cursor-pointer active:scale-95 transition-all shadow-xs flex items-center gap-1"
                  style={{ backgroundColor: currentConfig.primaryHex }}
                >
                  <span>+ إضافة للسلة</span>
                </button>
              </div>
            </div>

            {/* Simulated Product Card 2 */}
            <div
              className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                previewMode === 'dark'
                  ? 'bg-slate-900 border-slate-800'
                  : 'bg-white border-slate-200 shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className="text-[10px] text-slate-400 font-mono">باركود: 62100882</span>
                  <span
                    className="text-[9px] px-2 py-0.2 rounded-md font-bold"
                    style={{
                      backgroundColor: `${currentConfig.primaryHex}15`,
                      color: currentConfig.primaryHex
                    }}
                  >
                    عرض خاص ⭐
                  </span>
                </div>
                <h5 className="text-xs font-black">باقة التوفير العائلية</h5>
                <p className="text-[10px] text-slate-400 mt-0.5">مشمول بالخصم الفوري للكاشير</p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                <span
                  className="text-xs font-black font-mono"
                  style={{ color: currentConfig.primaryHex }}
                >
                  42,500 ل.س
                </span>
                <button
                  type="button"
                  onClick={() => soundEffects.playBeep()}
                  className="px-3 py-1 rounded-lg text-slate-950 text-[10px] font-black cursor-pointer active:scale-95 transition-all shadow-xs flex items-center gap-1"
                  style={{ backgroundColor: currentConfig.primaryHex }}
                >
                  <span>+ إضافة للسلة</span>
                </button>
              </div>
            </div>

            {/* Simulated Cart & Pay Action */}
            <div
              className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                previewMode === 'dark'
                  ? 'bg-slate-900/90 border-slate-800'
                  : 'bg-white border-slate-200 shadow-xs'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-black border-b border-slate-200/60 dark:border-slate-800 pb-1.5">
                  <span className="flex items-center gap-1">
                    <ShoppingCart className="w-3.5 h-3.5" style={{ color: currentConfig.primaryHex }} />
                    <span>سلة المبيعات (2 عنصر)</span>
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">#INV-9021</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                  <span>إجمالي المنتجات:</span>
                  <span className="font-mono font-bold">67,500 ل.س</span>
                </div>
                <div className="flex justify-between text-xs font-black pt-1 border-t border-slate-200/60 dark:border-slate-800">
                  <span>المبلغ المطلوب:</span>
                  <span className="font-mono text-sm font-black" style={{ color: currentConfig.primaryHex }}>
                    67,500 ل.س
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => soundEffects.playSuccess()}
                className="w-full mt-3 py-2 rounded-xl text-slate-950 text-xs font-black cursor-pointer active:scale-95 transition-all shadow-md flex items-center justify-center gap-1.5"
                style={{
                  backgroundColor: currentConfig.primaryHex,
                  boxShadow: `0 4px 12px ${currentConfig.primaryHex}40`
                }}
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>دفع وطباعة الفاتورة (F10)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ==========================================
          CUSTOMER QR MENU PAGE BRAND COLORS CUSTOMIZER (تخصيص الألوان الأساسية لصفحة منيو الزبون CustomerQrMenuPage - يظهر فقط في قسم المطعم)
         ========================================== */}
      {businessMode === 'restaurant' && (
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div
              style={{
                backgroundColor: activeQrTheme.primaryColor,
                color: activeQrTheme.buttonTextColor,
              }}
              className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-md shrink-0"
            >
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  تخصيص الألوان الأساسية لصفحة منيو الزبون (CustomerQrMenuPage)
                </h4>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  هوية المطعم والكافيه
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                خصص لون الأزرار التفاعلية، لون خلفية الصفحة، ولون الترويسة والبطاقات لصفحة طلبات الزبائن عبر الـ QR.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsCustomerMenuPreviewOpen(true)}
            style={{
              backgroundColor: activeQrTheme.primaryColor,
              color: activeQrTheme.buttonTextColor,
            }}
            className="px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-1.5 shadow-md cursor-pointer shrink-0"
          >
            <Eye className="w-4 h-4" />
            <span>معاينة صفحة الزبون الآن</span>
          </button>
        </div>

        {/* Preset Restaurant Brand Themes */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
            قوالب ألوان جاهزة لهوية المطعم والكافيه:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {QR_MENU_THEME_PRESETS.map(preset => {
              const isSelected = activeQrTheme.presetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    updateQrMenuTheme(preset.theme);
                    soundEffects.playSuccess();
                    notify('تم تحديث ألوان منيو الزبون', `تم تفعيل ثيم: ${preset.nameAr}`, 'success');
                  }}
                  className={`p-3.5 rounded-2xl border text-start transition-all cursor-pointer ${
                    isSelected
                      ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-amber-400 bg-slate-50/60 dark:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      {preset.nameAr}
                    </span>
                    <div className="flex items-center gap-1">
                      <span
                        className="w-4 h-4 rounded-full border border-slate-300"
                        style={{ backgroundColor: preset.theme.primaryColor }}
                        title="لون الأزرار"
                      />
                      <span
                        className="w-4 h-4 rounded-full border border-slate-300"
                        style={{ backgroundColor: preset.theme.backgroundColor }}
                        title="لون الخلفية"
                      />
                      <span
                        className="w-4 h-4 rounded-full border border-slate-300"
                        style={{ backgroundColor: preset.theme.headerBackgroundColor }}
                        title="لون الترويسة"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {preset.descAr}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Color Pickers for Buttons, Background, Header, and Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <span className="text-xs font-black block text-slate-900 dark:text-white">
                لون الأزرار الرئيسي
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {activeQrTheme.primaryColor}
              </span>
            </div>
            <input
              type="color"
              value={activeQrTheme.primaryColor}
              onChange={e =>
                updateQrMenuTheme({ primaryColor: e.target.value, presetId: 'custom' })
              }
              className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent"
            />
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <span className="text-xs font-black block text-slate-900 dark:text-white">
                لون خلفية الصفحة
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {activeQrTheme.backgroundColor}
              </span>
            </div>
            <input
              type="color"
              value={activeQrTheme.backgroundColor}
              onChange={e =>
                updateQrMenuTheme({ backgroundColor: e.target.value, presetId: 'custom' })
              }
              className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent"
            />
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <span className="text-xs font-black block text-slate-900 dark:text-white">
                لون ترويسة المطعم
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {activeQrTheme.headerBackgroundColor}
              </span>
            </div>
            <input
              type="color"
              value={activeQrTheme.headerBackgroundColor}
              onChange={e =>
                updateQrMenuTheme({
                  headerBackgroundColor: e.target.value,
                  presetId: 'custom',
                })
              }
              className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent"
            />
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <span className="text-xs font-black block text-slate-900 dark:text-white">
                لون بطاقات المنتجات
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {activeQrTheme.cardBackgroundColor}
              </span>
            </div>
            <input
              type="color"
              value={activeQrTheme.cardBackgroundColor}
              onChange={e =>
                updateQrMenuTheme({
                  cardBackgroundColor: e.target.value,
                  presetId: 'custom',
                })
              }
              className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent"
            />
          </div>
        </div>
      </div>
      )}
    </div>
  );
};
