import { ThemeColorPreset, ThemeColorItem } from '../types';

/**
 * Utility functions to manage and dynamically apply Store Theme Colors
 * across Kian Cashier POS system.
 */

// Helper: Convert HEX to RGB
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    return isNaN(r) || isNaN(g) || isNaN(b) ? null : { r, g, b };
  }
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return isNaN(r) || isNaN(g) || isNaN(b) ? null : { r, g, b };
  }
  return null;
}

// Helper: RGB to HSL
function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rNorm:
        h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0);
        break;
      case gNorm:
        h = (bNorm - rNorm) / d + 2;
        break;
      case bNorm:
        h = (rNorm - gNorm) / d + 4;
        break;
    }
    h /= 6;
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

// Helper: HSL to HEX
function hslToHex(h: number, s: number, l: number): string {
  const sNorm = s / 100;
  const lNorm = l / 100;

  const a = sNorm * Math.min(lNorm, 1 - lNorm);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = lNorm - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// Generate complete 11-step shade scale (50..950) from any primary HEX color
export function generateShadesFromHex(primaryHex: string): ThemeColorItem['shades'] {
  const rgb = hexToRgb(primaryHex);
  if (!rgb) {
    // Fallback to Amber
    return THEME_COLOR_PRESETS[0].shades;
  }

  const { h, s, l } = rgbToHsl(rgb.r, rgb.g, rgb.b);

  return {
    50: hslToHex(h, Math.min(100, Math.round(s * 0.9)), 97),
    100: hslToHex(h, Math.min(100, Math.round(s * 0.9)), 92),
    200: hslToHex(h, Math.min(100, Math.round(s * 0.88)), 83),
    300: hslToHex(h, Math.min(100, Math.round(s * 0.88)), 72),
    400: hslToHex(h, Math.min(100, Math.round(s * 0.92)), 61),
    500: primaryHex.startsWith('#') ? primaryHex : `#${primaryHex}`,
    600: hslToHex(h, Math.min(100, Math.round(s * 0.95)), Math.max(10, Math.round(l * 0.85))),
    700: hslToHex(h, Math.min(100, Math.round(s * 0.95)), Math.max(8, Math.round(l * 0.70))),
    800: hslToHex(h, Math.min(100, Math.round(s * 0.90)), Math.max(6, Math.round(l * 0.54))),
    900: hslToHex(h, Math.min(100, Math.round(s * 0.85)), Math.max(5, Math.round(l * 0.38))),
    950: hslToHex(h, Math.min(100, Math.round(s * 0.80)), Math.max(4, Math.round(l * 0.20))),
  };
}

export const THEME_COLOR_PRESETS: ThemeColorItem[] = [
  {
    id: 'amber',
    nameAr: 'العسلي والذهبي الأصيل',
    nameEn: 'Amber & Classic Gold',
    primaryHex: '#f59e0b',
    hoverHex: '#d97706',
    darkHex: '#b45309',
    lightHex: '#fef3c7',
    badge: 'الافتراضي الأصيل',
    recommendedFor: 'المطاعم، الكافيهات، المخابز والحلويات، والمتاجر التقليدية',
    shades: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
      950: '#451a03',
    },
  },
  {
    id: 'emerald',
    nameAr: 'الأخضر الزمردي الطبيعي',
    nameEn: 'Emerald Green',
    primaryHex: '#10b981',
    hoverHex: '#059669',
    darkHex: '#047857',
    lightHex: '#d1fae5',
    badge: 'سوبرماركت وأغذية',
    recommendedFor: 'السوبرماركت، الخضار والفواكه، الصيدليات، والأغذية الصحية العضوية',
    shades: {
      50: '#ecfdf5',
      100: '#d1fae5',
      200: '#a7f3d0',
      300: '#6ee7b7',
      400: '#34d399',
      500: '#10b981',
      600: '#059669',
      700: '#047857',
      800: '#065f46',
      900: '#064e3b',
      950: '#022c22',
    },
  },
  {
    id: 'blue',
    nameAr: 'الأزرق الملكي الياقوتي',
    nameEn: 'Royal Sapphire Blue',
    primaryHex: '#3b82f6',
    hoverHex: '#2563eb',
    darkHex: '#1d4ed8',
    lightHex: '#dbeafe',
    badge: 'إلكترونيات وتقنية',
    recommendedFor: 'محلات الهواتف، الإلكترونيات، قطع الكمبيوتر، ومراكز الصيانة',
    shades: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554',
    },
  },
  {
    id: 'indigo',
    nameAr: 'النيلي الفاخر العصري',
    nameEn: 'Deep Indigo',
    primaryHex: '#6366f1',
    hoverHex: '#4f46e5',
    darkHex: '#4338ca',
    lightHex: '#e0e7ff',
    badge: 'متاجر راقية وبرمجيات',
    recommendedFor: 'محلات المجوهرات والساعات، المتاجر الكبرى، والمؤسسات المهنية',
    shades: {
      50: '#eef2ff',
      100: '#e0e7ff',
      200: '#c7d2fe',
      300: '#a5b4fc',
      400: '#818cf8',
      500: '#6366f1',
      600: '#4f46e5',
      700: '#4338ca',
      800: '#3730a3',
      900: '#312e81',
      950: '#1e1b4b',
    },
  },
  {
    id: 'purple',
    nameAr: 'الأرجواني الملكي البنفسجي',
    nameEn: 'Amethyst Purple',
    primaryHex: '#a855f7',
    hoverHex: '#9333ea',
    darkHex: '#7e22ce',
    lightHex: '#f3e8ff',
    badge: 'عطور ومستحضرات تجميل',
    recommendedFor: 'محلات العطور والبخور، مستحضرات التجميل، وصالونات الحلاقة والعناية',
    shades: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#a855f7',
      600: '#9333ea',
      700: '#7e22ce',
      800: '#6b21a8',
      900: '#581c87',
      950: '#3b0764',
    },
  },
  {
    id: 'rose',
    nameAr: 'الوردي والمرجاني الجذاب',
    nameEn: 'Rose & Coral',
    primaryHex: '#f43f5e',
    hoverHex: '#e11d48',
    darkHex: '#be123c',
    lightHex: '#ffe4e6',
    badge: 'أزياء وإكسسوارات وورود',
    recommendedFor: 'البوتيكات النسائية، محلات الورود والهدايا، ومحلات الإكسسوارات',
    shades: {
      50: '#fff1f2',
      100: '#ffe4e6',
      200: '#fecdd3',
      300: '#fda4af',
      400: '#fb7185',
      500: '#f43f5e',
      600: '#e11d48',
      700: '#be123c',
      800: '#9f1239',
      900: '#881337',
      950: '#4c0519',
    },
  },
  {
    id: 'ruby',
    nameAr: 'الأحمر الياقوتي الحماسي',
    nameEn: 'Crimson Ruby Red',
    primaryHex: '#ef4444',
    hoverHex: '#dc2626',
    darkHex: '#b91c1c',
    lightHex: '#fee2e2',
    badge: 'ملاحم ومطاعم سريعة',
    recommendedFor: 'الملاحم والقصابين، مطاعم الشاورما والبرغر، ومحلات التخفيضات الكبرى',
    shades: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
      950: '#450a0a',
    },
  },
  {
    id: 'teal',
    nameAr: 'الفيروزي التيل الحديث',
    nameEn: 'Modern Teal',
    primaryHex: '#14b8a6',
    hoverHex: '#0d9488',
    darkHex: '#0f766e',
    lightHex: '#ccfbf1',
    badge: 'بصريات ومستلزمات طبية',
    recommendedFor: 'نظارات وبصريات، تجهيزات طبية، عصائر طبيعية، ومحلات الآيس كريم',
    shades: {
      50: '#f0fdfa',
      100: '#ccfbf1',
      200: '#99f6e4',
      300: '#5eead4',
      400: '#2dd4bf',
      500: '#14b8a6',
      600: '#0d9488',
      700: '#0f766e',
      800: '#115e59',
      900: '#134e4a',
      950: '#042f2e',
    },
  },
  {
    id: 'orange',
    nameAr: 'البرتقالي الحيوي المشرق',
    nameEn: 'Sunset Orange',
    primaryHex: '#f97316',
    hoverHex: '#ea580c',
    darkHex: '#c2410c',
    lightHex: '#ffedd5',
    badge: 'محامص ومقرمشات وألعاب',
    recommendedFor: 'المحامص والبن والمكسرات، محلات الألعاب، ومراكز الترفيه العائلي',
    shades: {
      50: '#fff7ed',
      100: '#ffedd5',
      200: '#fed7aa',
      300: '#fdba74',
      400: '#fb923c',
      500: '#f97316',
      600: '#ea580c',
      700: '#c2410c',
      800: '#9a3412',
      900: '#7c2d12',
      950: '#431407',
    },
  },
  {
    id: 'cyan',
    nameAr: 'السماوي والسيان المنعش',
    nameEn: 'Sky Cyan',
    primaryHex: '#06b6d4',
    hoverHex: '#0891b2',
    darkHex: '#0e7490',
    lightHex: '#cffafe',
    badge: 'مغاسل ومنظفات ورياضة',
    recommendedFor: 'المغاسل الجافة، محلات المنظفات ومستودعات المياه، والمتاجر الرياضية',
    shades: {
      50: '#ecfeff',
      100: '#cffafe',
      200: '#a5f3fc',
      300: '#67e8f9',
      400: '#22d3ee',
      500: '#06b6d4',
      600: '#0891b2',
      700: '#0e7490',
      800: '#155e75',
      900: '#164e63',
      950: '#083344',
    },
  },
  {
    id: 'coffee',
    nameAr: 'القهوة والبرونز العريق',
    nameEn: 'Warm Bronze & Coffee',
    primaryHex: '#854d0e',
    hoverHex: '#713f12',
    darkHex: '#58310c',
    lightHex: '#fef3c7',
    badge: 'محامص وتمور وعطارة',
    recommendedFor: 'المقاهي المختصة، محلات التمور الفاخرة، العطارة والبهارات، والجلديات',
    shades: {
      50: '#fdf8f6',
      100: '#f2e8e5',
      200: '#eaddd7',
      300: '#e0cec7',
      400: '#d2bab0',
      500: '#854d0e',
      600: '#713f12',
      700: '#58310c',
      800: '#422409',
      900: '#2d1806',
      950: '#1c0f04',
    },
  },
  {
    id: 'slate',
    nameAr: 'الرمادي الفحمي الراقي',
    nameEn: 'Modern Charcoal & Slate',
    primaryHex: '#475569',
    hoverHex: '#334155',
    darkHex: '#1e293b',
    lightHex: '#f1f5f9',
    badge: 'بوتيكات رجالية وديكور',
    recommendedFor: 'الملابس الرجالية الراقية، معارض الأثاث والديكور، والمكاتب الهندسية',
    shades: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#475569',
      600: '#334155',
      700: '#1e293b',
      800: '#0f172a',
      900: '#020617',
      950: '#000000',
    },
  },
];

// Get config for given preset or custom hex
export function getThemeColorConfig(preset: ThemeColorPreset, customHex?: string): ThemeColorItem {
  if (preset === 'custom' && customHex) {
    const shades = generateShadesFromHex(customHex);
    return {
      id: 'custom',
      nameAr: 'لون هوية المتجر المخصص',
      nameEn: 'Custom Store Brand Color',
      primaryHex: customHex,
      hoverHex: shades[600],
      darkHex: shades[700],
      lightHex: shades[100],
      badge: 'لون مخصص برمز HEX',
      recommendedFor: 'هوية بصرية مخصصة ومطابقة لشعار متجرك بدقة',
      shades,
    };
  }

  const found = THEME_COLOR_PRESETS.find(p => p.id === preset);
  return found || THEME_COLOR_PRESETS[0];
}

// Validates HEX color string
export function isValidHex(hex: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex.trim());
}

/**
 * Dynamically applies the chosen theme color into the browser DOM
 * by overriding Tailwind v4 variables and injecting store theme CSS tokens.
 */
export function applyThemeColor(preset: ThemeColorPreset = 'amber', customHex?: string): void {
  if (typeof document === 'undefined') return;

  const config = getThemeColorConfig(preset, customHex);
  const { shades } = config;
  const rgb = hexToRgb(shades[500]) || { r: 245, g: 158, b: 11 };

  let styleTag = document.getElementById('kian-dynamic-theme-style') as HTMLStyleElement | null;
  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.id = 'kian-dynamic-theme-style';
    document.head.appendChild(styleTag);
  }

  styleTag.textContent = `
    /* =========================================================
       KIAN CASHIER - DYNAMIC STORE THEME COLOR SYSTEM
       Active Identity: ${config.nameAr} (${config.primaryHex})
       ========================================================= */
    :root, html {
      /* Tailwind v4 Amber Scale Override */
      --color-amber-50: ${shades[50]};
      --color-amber-100: ${shades[100]};
      --color-amber-200: ${shades[200]};
      --color-amber-300: ${shades[300]};
      --color-amber-400: ${shades[400]};
      --color-amber-500: ${shades[500]};
      --color-amber-600: ${shades[600]};
      --color-amber-700: ${shades[700]};
      --color-amber-800: ${shades[800]};
      --color-amber-900: ${shades[900]};
      --color-amber-950: ${shades[950]};

      /* Store Theme Semantic Variables */
      --store-theme-primary: ${shades[500]};
      --store-theme-hover: ${shades[600]};
      --store-theme-active: ${shades[700]};
      --store-theme-light: ${shades[100]};
      --store-theme-dark: ${shades[900]};
      --store-theme-rgb: ${rgb.r}, ${rgb.g}, ${rgb.b};

      /* Form inputs focus ring */
      --store-theme-focus-border: ${shades[600]};
      --store-theme-focus-ring: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.18);
    }

    /* Seamless focus states honoring brand identity */
    :root:not(.dark) input:focus,
    :root:not(.dark) select:focus,
    :root:not(.dark) textarea:focus {
      border-color: ${shades[600]} !important;
      box-shadow: 0 0 0 3px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.18) !important;
    }
    .dark input:focus,
    .dark select:focus,
    .dark textarea:focus {
      border-color: ${shades[500]} !important;
      box-shadow: 0 0 0 3px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.25) !important;
    }

    /* Accent color for checkboxes and sliders */
    input[type="range"].accent-brand,
    input[type="checkbox"].accent-brand {
      accent-color: ${shades[500]};
    }
  `;

  document.documentElement.setAttribute('data-store-theme', preset);
  if (preset === 'custom' && customHex) {
    document.documentElement.setAttribute('data-store-theme-hex', customHex);
  } else {
    document.documentElement.removeAttribute('data-store-theme-hex');
  }

  // Set browser address bar color to match brand identity
  let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', shades[500]);
}
