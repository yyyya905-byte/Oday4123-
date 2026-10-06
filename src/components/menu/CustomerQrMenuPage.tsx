import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAppOptional } from '../../context/AppContext';
import {
  Product,
  Category,
  DiningType,
  LinkedDevice,
  DeviceRole,
  KitchenOrder,
  QrMenuThemeConfig,
  CustomerFeedbackReview,
} from '../../types';
import { initialProducts, initialCategories, initialSettings } from '../../data/seedData';
import { soundEffects } from '../../services/audio';
import {
  UtensilsCrossed,
  Coffee,
  Search,
  ShoppingBag,
  Plus,
  Minus,
  CheckCircle2,
  Clock,
  Sparkles,
  Camera,
  Monitor,
  Smartphone,
  SlidersHorizontal,
  X,
  ArrowRight,
  Send,
  MessageSquarePlus,
  LayoutGrid,
  List,
  Image as ImageIcon,
  Check,
  Edit3,
  QrCode,
  Upload,
  RefreshCw,
  Star,
  Palette,
  Package,
  Heart,
  ThumbsUp,
} from 'lucide-react';

interface CustomerQrMenuPageProps {
  isStandalone?: boolean;
  initialTable?: string;
  initialDiningType?: DiningType;
  onClosePreview?: () => void;
}

export const DEFAULT_QR_MENU_THEME: QrMenuThemeConfig = {
  primaryColor: '#f59e0b',
  buttonTextColor: '#0f172a',
  backgroundColor: '#f8fafc',
  headerBackgroundColor: '#0f172a',
  cardBackgroundColor: '#ffffff',
  isDarkBackground: false,
  presetId: 'classic_amber',
};

export const QR_MENU_THEME_PRESETS: {
  id: string;
  nameAr: string;
  descAr: string;
  theme: QrMenuThemeConfig;
}[] = [
  {
    id: 'classic_amber',
    nameAr: 'الكهرماني الذهبي (الافتراضي)',
    descAr: 'أزرار ذهبية دافئة مع خلفية فاتحة مريحة وترويسة داكنة فاخرة',
    theme: {
      primaryColor: '#f59e0b',
      buttonTextColor: '#0f172a',
      backgroundColor: '#f8fafc',
      headerBackgroundColor: '#0f172a',
      cardBackgroundColor: '#ffffff',
      isDarkBackground: false,
      presetId: 'classic_amber',
    },
  },
  {
    id: 'emerald_garden',
    nameAr: 'الأخضر الزمردي الطازج',
    descAr: 'مثالي للمطاعم الصحية، العصائر الطبيعية، والكافيهات العصرية',
    theme: {
      primaryColor: '#10b981',
      buttonTextColor: '#ffffff',
      backgroundColor: '#f0fdf4',
      headerBackgroundColor: '#064e3b',
      cardBackgroundColor: '#ffffff',
      isDarkBackground: false,
      presetId: 'emerald_garden',
    },
  },
  {
    id: 'crimson_bistro',
    nameAr: 'الأحمر الإيطالي الفاخر',
    descAr: 'هوية جذابة لمطاعم البيتزا، البرغر، المشاوي والوجبات السريعة',
    theme: {
      primaryColor: '#e11d48',
      buttonTextColor: '#ffffff',
      backgroundColor: '#fff1f2',
      headerBackgroundColor: '#4c0519',
      cardBackgroundColor: '#ffffff',
      isDarkBackground: false,
      presetId: 'crimson_bistro',
    },
  },
  {
    id: 'specialty_coffee',
    nameAr: 'القهوة المختصة والبارستا ☕',
    descAr: 'درجات البني المحمص والكريمي الدافئ للكافيهات ومحامص القهوة',
    theme: {
      primaryColor: '#b45309',
      buttonTextColor: '#ffffff',
      backgroundColor: '#fffbeb',
      headerBackgroundColor: '#291506',
      cardBackgroundColor: '#ffffff',
      isDarkBackground: false,
      presetId: 'specialty_coffee',
    },
  },
  {
    id: 'royal_midnight',
    nameAr: 'الليلي الملكي الداكن 🌙',
    descAr: 'خلفية داكنة فخمة مع بطاقات كحلية وأزرار ذهبية ساطعة',
    theme: {
      primaryColor: '#f59e0b',
      buttonTextColor: '#0f172a',
      backgroundColor: '#090d16',
      headerBackgroundColor: '#0f172a',
      cardBackgroundColor: '#111827',
      isDarkBackground: true,
      presetId: 'royal_midnight',
    },
  },
  {
    id: 'ocean_lounge',
    nameAr: 'الأزرق البحري العصري',
    descAr: 'ألوان هادئة وأنيقة للمطاعم البحرية والصالات المفتوحة',
    theme: {
      primaryColor: '#0284c7',
      buttonTextColor: '#ffffff',
      backgroundColor: '#f0f9ff',
      headerBackgroundColor: '#082f49',
      cardBackgroundColor: '#ffffff',
      isDarkBackground: false,
      presetId: 'ocean_lounge',
    },
  },
];

// Curated food & cafe high-res preset photos for 1-click assignment by the manager
export const PRESET_FOOD_IMAGES: { label: string; url: string; keywords: string[] }[] = [
  {
    label: 'برجر لحم مشوي',
    url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
    keywords: ['برجر', 'برغر', 'burger', 'ساندوتش', 'كومبو'],
  },
  {
    label: 'بيتزا إيطالية',
    url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80',
    keywords: ['بيتزا', 'pizza', 'معجنات'],
  },
  {
    label: 'شاورما عربي',
    url: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=600&q=80',
    keywords: ['شاورما', 'shawarma', 'سندويش', 'ساندويش'],
  },
  {
    label: 'مشاوي مشكلة وكباب',
    url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80',
    keywords: ['مشاوي', 'كباب', 'شيش', 'دجاج', 'لحم'],
  },
  {
    label: 'دجاج بروستد ومقرمش',
    url: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&w=600&q=80',
    keywords: ['بروستد', 'كرسبي', 'زنجر', 'دجاج'],
  },
  {
    label: 'بطاطا مقلية مقرمشة',
    url: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=600&q=80',
    keywords: ['بطاطا', 'فرايز', 'مقبلات'],
  },
  {
    label: 'سلطة وتبولة طازجة',
    url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80',
    keywords: ['سلطة', 'تبولة', 'فتوش', 'حمص'],
  },
  {
    label: 'قهوة مختصة / كابتشينو',
    url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80',
    keywords: ['قهوة', 'كابتشينو', 'لاتيه', 'اسبريسو', 'تركي'],
  },
  {
    label: 'آيس لاتيه وقهوة باردة',
    url: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80',
    keywords: ['ايس', 'بارد', 'سبانش', 'سبانيش', 'موكا'],
  },
  {
    label: 'عصير فواكه طبيعي',
    url: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80',
    keywords: ['عصير', 'برتقال', 'مانجو', 'فراولة', 'كوكتيل', 'أفوكادو'],
  },
  {
    label: 'موهيتو ومشروبات غازية',
    url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80',
    keywords: ['موهيتو', 'بيبسي', 'مشروب', 'ليمون', 'مياه'],
  },
  {
    label: 'كيك وحلويات وكريب',
    url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80',
    keywords: ['كيك', 'حلى', 'كريب', 'وافل', 'كنافة', 'تشيز'],
  },
];

export const TARGET_DEVICE_OPTIONS: {
  role: DeviceRole | 'all';
  labelAr: string;
  descAr: string;
  badgeColor: string;
}[] = [
  {
    role: 'kitchen_display',
    labelAr: 'شاشة المطبخ الرئيسية (KDS)',
    descAr: 'يظهر الطلب فوراً للطباخ في شاشة المطبخ',
    badgeColor: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30',
  },
  {
    role: 'master_pos',
    labelAr: 'جهاز الكاشير الرئيسي (Master POS)',
    descAr: 'يظهر الطلب مباشرة عند الكاشير الرئيسي للمحاسبة والتجهيز',
    badgeColor: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  },
  {
    role: 'secondary_pos',
    labelAr: 'كاشير فرعي / ركن البارستا والعصائر',
    descAr: 'يظهر في جهاز الكاشير الفرعي أو محطة المشروبات والبارستا',
    badgeColor: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
  },
  {
    role: 'waiter_mobile',
    labelAr: 'جهاز الكابتن / النادل (Waiter)',
    descAr: 'يظهر في هاتف أو تابلت النادل المسؤول عن الصالة والطاولات',
    badgeColor: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
  },
  {
    role: 'customer_display',
    labelAr: 'شاشة تجهيز وتسليم الطلبات',
    descAr: 'يظهر في شاشة التجهيز والتسليم السريع',
    badgeColor: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
  },
  {
    role: 'all',
    labelAr: 'جميع الأجهزة المتصلة معاً',
    descAr: 'يظهر في شاشة المطبخ والكاشير وجميع الأجهزة بنفس اللحظة',
    badgeColor: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
  },
];

export function getTargetDeviceLabel(product: Product, devices: LinkedDevice[] = []): string {
  if (product.targetStationName) return product.targetStationName;
  if (product.targetDeviceId) {
    const foundDev = devices.find(d => d.id === product.targetDeviceId);
    if (foundDev) return foundDev.name;
  }
  const roleOpt = TARGET_DEVICE_OPTIONS.find(o => o.role === (product.targetDeviceRole || 'kitchen_display'));
  return roleOpt ? roleOpt.labelAr : 'شاشة المطبخ الرئيسية (KDS)';
}

/**
 * Resolves the product image and stock details from the linked Inventory record (`inventoryProducts`).
 * Ensures every product displays its inventory-linked image right beside its name and price.
 */
export function resolveProductFromInventory(
  product: Product,
  inventoryProducts: Product[] = []
): {
  imageUrl: string;
  stock: number;
  minStock: number;
  unit: string;
  sku: string;
  description: string;
} {
  // 1. Find linked product in live inventory by id, sku, barcode, or Arabic name
  const linkedInv =
    inventoryProducts.find(p => p.id === product.id) ||
    (product.sku ? inventoryProducts.find(p => p.sku && p.sku === product.sku) : undefined) ||
    (product.barcode ? inventoryProducts.find(p => p.barcode && p.barcode === product.barcode) : undefined) ||
    inventoryProducts.find(p => p.nameAr === product.nameAr);

  // 2. Also check seed inventory catalog in case an image was defined on the base SKU
  const seedInv =
    initialProducts.find(p => p.id === product.id) ||
    (product.sku ? initialProducts.find(p => p.sku === product.sku) : undefined) ||
    initialProducts.find(p => p.nameAr === product.nameAr);

  // 3. Determine image URL from linked inventory data -> product.image -> seed inventory -> smart keyword match
  let resolvedImage = linkedInv?.image || product.image || seedInv?.image || '';

  if (!resolvedImage) {
    const nameText = `${product.nameAr} ${product.nameEn || ''}`.toLowerCase();
    const matchedPreset = PRESET_FOOD_IMAGES.find(preset =>
      preset.keywords.some(kw => nameText.includes(kw.toLowerCase()))
    );
    if (matchedPreset) {
      resolvedImage = matchedPreset.url;
    }
  }

  return {
    imageUrl: resolvedImage,
    stock: linkedInv?.stock ?? product.stock ?? 0,
    minStock: linkedInv?.minStock ?? product.minStock ?? 5,
    unit: linkedInv?.unit || product.unit || 'قطعة',
    sku: linkedInv?.sku || product.sku || '',
    description:
      product.descriptionAr ||
      linkedInv?.descriptionAr ||
      product.notes ||
      linkedInv?.notes ||
      seedInv?.notes ||
      'يحضر طازجاً عند الطلب بأعلى جودة',
  };
}

// Helper to compress uploaded image to clean Data URL
export function compressImageFile(file: File, maxWidth = 700, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const QUICK_ITEM_NOTES = [
  'بدون سكر',
  'سكر وسط',
  'زيادة ثلج',
  'بدون ثلج',
  'حار سبايسي 🌶️',
  'بدون بصل',
  'إكسترا صوص',
  'خبز محمص',
];

const FEEDBACK_QUICK_TAGS = [
  'طعم رائع ولذيذ 😋',
  'سهولة وسرعة في الطلب ⚡',
  'صور الأصناف واضحة وشهية 📸',
  'أسعار مناسبة 💰',
  'خدمة ممتازة 🌟',
  'تصميم المنيو أنيق ومرتب 🎨',
];

const RATING_LABELS: Record<number, { label: string; emoji: string }> = {
  1: { label: 'غير راضٍ', emoji: '😕' },
  2: { label: 'مقبول', emoji: '😐' },
  3: { label: 'جيد', emoji: '🙂' },
  4: { label: 'رائع جداً', emoji: '😊' },
  5: { label: 'ممتاز واستثنائي!', emoji: '😍' },
};

const RESTAURANT_TABLES = Array.from({ length: 20 }, (_, i) => `الطاولة ${i + 1}`);

export const CustomerQrMenuPage: React.FC<CustomerQrMenuPageProps> = ({
  isStandalone = false,
  initialTable = '',
  initialDiningType = 'dine_in',
  onClosePreview,
}) => {
  const appCtx = useAppOptional();

  // Standalone local storage fallback when rendered outside AppProvider
  const [localProducts, setLocalProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('kian_pos_products_v1');
      return saved ? JSON.parse(saved) : initialProducts;
    } catch {
      return initialProducts;
    }
  });

  const [localCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem('kian_pos_categories_v1');
      return saved ? JSON.parse(saved) : initialCategories;
    } catch {
      return initialCategories;
    }
  });

  const [localSettings, setLocalSettings] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('kian_pos_settings_v1');
      return saved ? JSON.parse(saved) : initialSettings;
    } catch {
      return initialSettings;
    }
  });

  const contextProducts = appCtx?.products || localProducts;
  const contextCategories = appCtx?.categories || localCategories;
  const contextSettings = appCtx?.settings || localSettings;
  const contextDevices = appCtx?.devices || [];
  const contextKitchenOrders = appCtx?.kitchenOrders || [];

  const safeNotify = (title: string, message: string, type: 'info' | 'warning' | 'error' | 'success' = 'info') => {
    if (appCtx?.notify && !isStandalone) {
      appCtx.notify(title, message, type);
    }
  };

  const safeUpdateProduct = (id: string, updates: Partial<Product>) => {
    if (appCtx?.updateProduct) {
      appCtx.updateProduct(id, updates);
    }
    setLocalProducts(prev => {
      const updated = prev.map(p => (p.id === id ? { ...p, ...updates } : p));
      try {
        localStorage.setItem('kian_pos_products_v1', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const safeUpdateQrMenuTheme = (themeUpdates: Partial<QrMenuThemeConfig>) => {
    if (appCtx?.updateQrMenuTheme) {
      appCtx.updateQrMenuTheme(themeUpdates);
    }
    setLocalSettings((prev: any) => {
      const nextTheme = {
        ...DEFAULT_QR_MENU_THEME,
        ...(prev?.qrMenuTheme || {}),
        ...themeUpdates,
      };
      const updated = { ...(prev || {}), qrMenuTheme: nextTheme };
      try {
        localStorage.setItem('kian_pos_settings_v1', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Remote catalog state (fetched from /api/menu/catalog when customer scans QR on their phone)
  const [remoteProducts, setRemoteProducts] = useState<Product[]>([]);
  const [remoteCategories, setRemoteCategories] = useState<Category[]>([]);
  const [remoteSettings, setRemoteSettings] = useState<any>(null);
  const [remoteDevices, setRemoteDevices] = useState<LinkedDevice[]>([]);
  const [remoteOrders, setRemoteOrders] = useState<KitchenOrder[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);

  // Fetch live catalog from server on mount & listen to SSE + BroadcastChannel updates
  const fetchLiveCatalog = async () => {
    try {
      setIsLoadingCatalog(true);
      const res = await fetch('/api/menu/catalog');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.catalog?.products) && data.catalog.products.length > 0) {
          setRemoteProducts(data.catalog.products);
        }
        if (Array.isArray(data?.catalog?.categories) && data.catalog.categories.length > 0) {
          setRemoteCategories(data.catalog.categories);
        }
        if (data?.catalog?.settings) {
          setRemoteSettings(data.catalog.settings);
        }
        if (Array.isArray(data?.devices)) {
          setRemoteDevices(data.devices);
        }
        if (Array.isArray(data?.orders)) {
          setRemoteOrders(data.orders);
        }
      }
    } catch {
      // Fallback to context / localStorage seamlessly
    } finally {
      setIsLoadingCatalog(false);
    }
  };

  useEffect(() => {
    fetchLiveCatalog();

    let es: EventSource | null = null;
    let bc: BroadcastChannel | null = null;

    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('kian_pos_devices_mesh');
        bc.onmessage = event => {
          const { type, payload } = event.data || {};
          if (type === 'MENU_PRODUCT_UPDATED' && payload?.productId && payload?.updates) {
            setRemoteProducts(prev =>
              prev.map(p => (p.id === payload.productId ? { ...p, ...payload.updates } : p))
            );
            setLocalProducts(prev =>
              prev.map(p => (p.id === payload.productId ? { ...p, ...payload.updates } : p))
            );
          } else if (type === 'MENU_THEME_UPDATED' && payload?.qrMenuTheme) {
            setRemoteSettings((prev: any) => ({ ...(prev || {}), qrMenuTheme: payload.qrMenuTheme }));
            setLocalSettings((prev: any) => ({ ...(prev || {}), qrMenuTheme: payload.qrMenuTheme }));
          } else if (type === 'KITCHEN_ORDERS_UPDATE' && Array.isArray(payload)) {
            setRemoteOrders(payload);
          }
        };
      }
    } catch {}

    try {
      es = new EventSource('/api/sync/stream');
      es.addEventListener('MENU_CATALOG_UPDATED', (e: any) => {
        try {
          const catalog = JSON.parse(e.data);
          if (Array.isArray(catalog?.products)) setRemoteProducts(catalog.products);
          if (Array.isArray(catalog?.categories)) setRemoteCategories(catalog.categories);
          if (catalog?.settings) setRemoteSettings(catalog.settings);
        } catch {}
      });
      es.addEventListener('MENU_PRODUCT_UPDATED', (e: any) => {
        try {
          const { productId, updates } = JSON.parse(e.data);
          setRemoteProducts(prev => prev.map(p => (p.id === productId ? { ...p, ...updates } : p)));
          setLocalProducts(prev => prev.map(p => (p.id === productId ? { ...p, ...updates } : p)));
        } catch {}
      });
      es.addEventListener('MENU_THEME_UPDATED', (e: any) => {
        try {
          const { qrMenuTheme } = JSON.parse(e.data);
          if (qrMenuTheme) {
            setRemoteSettings((prev: any) => ({ ...(prev || {}), qrMenuTheme }));
            setLocalSettings((prev: any) => ({ ...(prev || {}), qrMenuTheme }));
          }
        } catch {}
      });
      es.addEventListener('KITCHEN_ORDERS_UPDATE', (e: any) => {
        try {
          const orders = JSON.parse(e.data);
          if (Array.isArray(orders)) setRemoteOrders(orders);
        } catch {}
      });
    } catch {}

    return () => {
      bc?.close();
      es?.close();
    };
  }, []);

  // Combined Inventory Catalog (links remote catalog with local inventory records)
  const combinedInventoryCatalog = useMemo(() => {
    const map = new Map<string, Product>();
    initialProducts.forEach(p => map.set(p.id, p));
    remoteProducts.forEach(p => map.set(p.id, { ...(map.get(p.id) || {}), ...p }));
    contextProducts.forEach(p => map.set(p.id, { ...(map.get(p.id) || {}), ...p }));
    return Array.from(map.values());
  }, [contextProducts, remoteProducts]);

  // Active Menu Products enriched with Inventory-linked Images
  const activeProducts = useMemo(() => {
    const baseList = contextProducts.length > 0 ? contextProducts : remoteProducts;
    return baseList
      .filter(p => p.availableInQrMenu !== false)
      .map(p => {
        const invData = resolveProductFromInventory(p, combinedInventoryCatalog);
        return {
          ...p,
          image: invData.imageUrl || p.image,
          stock: invData.stock,
          unit: invData.unit,
          descriptionAr: p.descriptionAr || invData.description,
        };
      });
  }, [contextProducts, remoteProducts, combinedInventoryCatalog]);

  const activeCategories = useMemo(() => {
    return contextCategories.length > 1
      ? contextCategories
      : remoteCategories.length > 0
      ? remoteCategories
      : contextCategories;
  }, [contextCategories, remoteCategories]);

  const activeSettings = useMemo(() => {
    return remoteSettings?.storeName ? { ...contextSettings, ...remoteSettings } : contextSettings;
  }, [contextSettings, remoteSettings]);

  // Active Custom Brand Theme for CustomerQrMenuPage
  const activeTheme: QrMenuThemeConfig = useMemo(() => {
    return {
      ...DEFAULT_QR_MENU_THEME,
      ...(contextSettings?.qrMenuTheme || {}),
      ...(remoteSettings?.qrMenuTheme || {}),
    };
  }, [contextSettings?.qrMenuTheme, remoteSettings?.qrMenuTheme]);

  const activeDevices = useMemo(() => {
    return contextDevices.length > 0 ? contextDevices : remoteDevices;
  }, [contextDevices, remoteDevices]);

  const allOrders = useMemo(() => {
    return contextKitchenOrders.length > 0 ? contextKitchenOrders : remoteOrders;
  }, [contextKitchenOrders, remoteOrders]);

  // Customer UI State
  const [selectedCategory, setSelectedCategory] = useState<string>('cat_all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewLayout, setViewLayout] = useState<'list' | 'grid'>('list'); // Default 'list' shows product photo right beside name & price
  const [diningType, setDiningType] = useState<DiningType>(initialDiningType || 'dine_in');
  const [tableName, setTableName] = useState<string>(initialTable || 'الطاولة 1');
  const [guestCount, setGuestCount] = useState<number>(2);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [orderNotes, setOrderNotes] = useState<string>('');

  // Customer Cart State
  const [customerCart, setCustomerCart] = useState<
    {
      product: Product;
      quantity: number;
      notes: string;
    }[]
  >([]);

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [editingNoteProductId, setEditingNoteProductId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOrderIds, setSubmittedOrderIds] = useState<string[]>(() => {
    try {
      const saved = sessionStorage.getItem('kian_customer_qr_orders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [zoomedImageProduct, setZoomedImageProduct] = useState<Product | null>(null);

  // Customer Post-Order Experience Rating State
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [ratingOrderInfo, setRatingOrderInfo] = useState<{
    orderId?: string;
    orderNumber?: string;
    tableName?: string;
  } | null>(null);
  const [overallRating, setOverallRating] = useState<number>(5);
  const [foodQualityRating, setFoodQualityRating] = useState<number>(5);
  const [serviceSpeedRating, setServiceSpeedRating] = useState<number>(5);
  const [menuEaseRating, setMenuEaseRating] = useState<number>(5);
  const [selectedReviewTags, setSelectedReviewTags] = useState<string[]>([
    'طعم رائع ولذيذ 😋',
    'سهولة وسرعة في الطلب ⚡',
  ]);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [hasSubmittedReview, setHasSubmittedReview] = useState(false);

  // Manager Edit Mode inside the Menu Page (to add product photo, choose target device, or customize theme colors)
  const [isManagerEditMode, setIsManagerEditMode] = useState(false);
  const [isThemeCustomizerOpen, setIsThemeCustomizerOpen] = useState(false);
  const [editingProductModal, setEditingProductModal] = useState<Product | null>(null);
  const [editImageInput, setEditImageInput] = useState('');
  const [editDescInput, setEditDescInput] = useState('');
  const [editPrepTimeInput, setEditPrepTimeInput] = useState<number>(10);
  const [editTargetRole, setEditTargetRole] = useState<DeviceRole | 'all'>('kitchen_display');
  const [editTargetDeviceId, setEditTargetDeviceId] = useState<string>('');
  const [editTargetStationName, setEditTargetStationName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatMoney = (amount: number) => {
    const num = Number(amount) || 0;
    const sym = activeSettings?.currency?.symbolNative || activeSettings?.currency?.symbol || 'ل.س';
    return `${num.toLocaleString('ar-SY')} ${sym}`;
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return activeProducts.filter(p => {
      const matchesCat = selectedCategory === 'cat_all' || p.categoryId === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        p.nameAr.toLowerCase().includes(q) ||
        (p.nameEn && p.nameEn.toLowerCase().includes(q)) ||
        (p.descriptionAr && p.descriptionAr.toLowerCase().includes(q));
      return matchesCat && matchesSearch;
    });
  }, [activeProducts, selectedCategory, searchQuery]);

  // Organized Category Sections for clean Restaurant/Cafe Menu Presentation
  const groupedMenuSections = useMemo(() => {
    if (selectedCategory !== 'cat_all' || searchQuery.trim() !== '') {
      const activeCatObj = activeCategories.find(c => c.id === selectedCategory);
      return [
        {
          id: selectedCategory,
          title:
            searchQuery.trim() !== ''
              ? `نتائج البحث (${filteredProducts.length})`
              : activeCatObj?.nameAr || 'الأصناف المتاحة',
          items: filteredProducts,
        },
      ];
    }

    const sections: { id: string; title: string; items: Product[] }[] = [];
    const seenIds = new Set<string>();

    activeCategories
      .filter(c => c.id !== 'cat_all')
      .forEach(cat => {
        const catItems = filteredProducts.filter(p => p.categoryId === cat.id);
        if (catItems.length > 0) {
          sections.push({
            id: cat.id,
            title: cat.nameAr,
            items: catItems,
          });
          catItems.forEach(item => seenIds.add(item.id));
        }
      });

    const uncategorized = filteredProducts.filter(p => !seenIds.has(p.id));
    if (uncategorized.length > 0) {
      sections.push({
        id: 'other',
        title: sections.length > 0 ? 'أصناف متنوعة أخرى' : 'قائمة الطعام والمشروبات',
        items: uncategorized,
      });
    }

    return sections;
  }, [filteredProducts, activeCategories, selectedCategory, searchQuery]);

  // Customer Cart Helpers
  const getCartItem = (productId: string) => customerCart.find(c => c.product.id === productId);

  const handleAddItem = (product: Product) => {
    soundEffects.playClick();
    setCustomerCart(prev => {
      const existing = prev.find(c => c.product.id === product.id);
      if (existing) {
        return prev.map(c => (c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c));
      }
      return [...prev, { product, quantity: 1, notes: '' }];
    });
  };

  const handleUpdateQty = (productId: string, newQty: number) => {
    soundEffects.playClick();
    if (newQty <= 0) {
      setCustomerCart(prev => prev.filter(c => c.product.id !== productId));
      return;
    }
    setCustomerCart(prev => prev.map(c => (c.product.id === productId ? { ...c, quantity: newQty } : c)));
  };

  const handleUpdateItemNote = (productId: string, notes: string) => {
    setCustomerCart(prev => prev.map(c => (c.product.id === productId ? { ...c, notes } : c)));
  };

  const totalCartCount = useMemo(
    () => customerCart.reduce((acc, item) => acc + item.quantity, 0),
    [customerCart]
  );

  const totalCartPrice = useMemo(
    () => customerCart.reduce((acc, item) => acc + item.product.price * item.quantity, 0),
    [customerCart]
  );

  // Track customer's submitted orders in real time
  const myLiveOrders = useMemo(() => {
    if (submittedOrderIds.length === 0) return [];
    return allOrders.filter(o => submittedOrderIds.includes(o.id) || submittedOrderIds.includes(o.orderNumber));
  }, [allOrders, submittedOrderIds]);

  // Open Manager Product Photo & Device Routing Editor
  const openProductEditor = (product: Product) => {
    setEditingProductModal(product);
    setEditImageInput(product.image || '');
    setEditDescInput(product.descriptionAr || '');
    setEditPrepTimeInput(product.preparationTimeMinutes || 10);
    setEditTargetRole(product.targetDeviceRole || 'kitchen_display');
    setEditTargetDeviceId(product.targetDeviceId || '');
    setEditTargetStationName(product.targetStationName || '');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImageFile(file, 700, 0.82);
      setEditImageInput(dataUrl);
      soundEffects.playSuccess();
    } catch {
      safeNotify('خطأ في الصورة', 'تعذر معالجة الصورة المختارة', 'error');
    }
  };

  const handleSaveProductEdits = async () => {
    if (!editingProductModal) return;

    const selectedDeviceObj = activeDevices.find(d => d.id === editTargetDeviceId);
    const roleObj = TARGET_DEVICE_OPTIONS.find(o => o.role === editTargetRole);

    const resolvedStationName =
      editTargetStationName.trim() ||
      selectedDeviceObj?.name ||
      roleObj?.labelAr ||
      'شاشة المطبخ الرئيسية (KDS)';

    const updates: Partial<Product> = {
      image: editImageInput.trim() || undefined,
      descriptionAr: editDescInput.trim() || undefined,
      preparationTimeMinutes: Number(editPrepTimeInput) || 10,
      targetDeviceRole: editTargetRole,
      targetDeviceId: editTargetDeviceId || undefined,
      targetStationName: resolvedStationName,
    };

    // Update in AppContext / localStorage (Inventory product record)
    safeUpdateProduct(editingProductModal.id, updates);

    // Update in remote catalog state
    setRemoteProducts(prev =>
      prev.map(p => (p.id === editingProductModal.id ? { ...p, ...updates } : p))
    );

    // Push to server for all connected QR devices
    try {
      await fetch('/api/menu/update-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: editingProductModal.id,
          updates,
        }),
      });
      const bc = new BroadcastChannel('kian_pos_devices_mesh');
      bc.postMessage({
        type: 'MENU_PRODUCT_UPDATED',
        payload: { productId: editingProductModal.id, updates },
      });
      bc.close();
    } catch {}

    soundEffects.saleSuccess();
    safeNotify(
      'تم حفظ صورة المنتج في المخزون وتوجيه الجهاز',
      `سيظهر طلب [${editingProductModal.nameAr}] في: ${resolvedStationName}`,
      'success'
    );
    setEditingProductModal(null);
  };

  // Submit Customer QR Order -> Routes each product to its designated device & opens Customer Experience Rating!
  const handleSubmitCustomerOrder = async () => {
    if (customerCart.length === 0 || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const formattedItems = customerCart.map((c, idx) => {
        const stationName = getTargetDeviceLabel(c.product, activeDevices);
        return {
          id: `qri-${Date.now()}-${idx}`,
          productId: c.product.id,
          nameAr: c.product.nameAr,
          nameEn: c.product.nameEn || c.product.nameAr,
          quantity: c.quantity,
          unitPrice: c.product.price,
          image: c.product.image,
          notes: c.notes,
          status: 'pending' as const,
          targetDeviceRole: c.product.targetDeviceRole || 'kitchen_display',
          targetDeviceId: c.product.targetDeviceId || '',
          targetDeviceName: stationName,
        };
      });

      const resolvedTable =
        diningType === 'dine_in'
          ? tableName || 'الطاولة 1'
          : diningType === 'takeaway'
          ? `طلب سفري${customerName ? ` - ${customerName}` : ''}`
          : `طلب توصيل${customerName ? ` - ${customerName}` : ''}`;

      const res = await fetch('/api/menu/submit-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableName: resolvedTable,
          diningType,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          guestCount,
          notes: orderNotes.trim(),
          items: formattedItems,
          totalAmount: totalCartPrice,
        }),
      });

      let createdOrder: KitchenOrder | null = null;
      if (res.ok) {
        const data = await res.json();
        createdOrder = data.order;
      }

      if (!createdOrder) {
        // Offline / local fallback
        createdOrder = {
          id: `qr-ord-${Date.now().toString(36)}`,
          orderNumber: `QR-${Math.floor(200 + Math.random() * 799)}`,
          sourceDevice: `منيو QR الذكي (${resolvedTable})`,
          isCustomerQrOrder: true,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          diningType,
          tableName: resolvedTable,
          guestCount,
          items: formattedItems,
          totalAmount: totalCartPrice,
          notes: orderNotes.trim(),
          status: 'new',
          createdAt: new Date().toISOString(),
        };
        if (appCtx?.addKitchenOrder) {
          appCtx.addKitchenOrder(createdOrder);
        } else {
          try {
            const saved = localStorage.getItem('kian_pos_kitchen_orders_v1');
            const parsed = saved ? JSON.parse(saved) : [];
            localStorage.setItem('kian_pos_kitchen_orders_v1', JSON.stringify([createdOrder, ...parsed]));
          } catch {}
        }
      }

      // Broadcast via BroadcastChannel for instant local tabs
      try {
        const bc = new BroadcastChannel('kian_pos_devices_mesh');
        bc.postMessage({
          type: 'QR_CUSTOMER_ORDER_RECEIVED',
          payload: { order: createdOrder },
        });
        bc.close();
      } catch {}

      const nextIds = [createdOrder.id, createdOrder.orderNumber, ...submittedOrderIds];
      setSubmittedOrderIds(nextIds);
      try {
        sessionStorage.setItem('kian_customer_qr_orders', JSON.stringify(nextIds));
      } catch {}

      setRemoteOrders(prev => [createdOrder!, ...prev.filter(o => o.id !== createdOrder!.id)]);
      setCustomerCart([]);
      setOrderNotes('');
      setIsCheckoutOpen(false);
      soundEffects.saleSuccess();

      // Open Customer Experience Rating Modal right after order submission!
      setRatingOrderInfo({
        orderId: createdOrder.id,
        orderNumber: createdOrder.orderNumber,
        tableName: resolvedTable,
      });
      setHasSubmittedReview(false);
      setOverallRating(5);
      setFoodQualityRating(5);
      setServiceSpeedRating(5);
      setMenuEaseRating(5);
      setReviewComment('');
      setIsRatingModalOpen(true);
    } catch {
      soundEffects.playWarning();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle feedback quick tag
  const toggleReviewTag = (tag: string) => {
    setSelectedReviewTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  // Submit Customer Experience Review
  const handleSubmitCustomerReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingReview) return;
    setIsSubmittingReview(true);

    const resolvedTable =
      ratingOrderInfo?.tableName ||
      myLiveOrders[0]?.tableName ||
      (diningType === 'dine_in' ? tableName : diningType === 'takeaway' ? 'طلب سفري' : 'توصيل');

    const reviewPayload: Omit<CustomerFeedbackReview, 'id' | 'createdAt'> = {
      orderId: ratingOrderInfo?.orderId || myLiveOrders[0]?.id || '',
      orderNumber: ratingOrderInfo?.orderNumber || myLiveOrders[0]?.orderNumber || 'QR',
      tableName: resolvedTable,
      diningType,
      customerName: customerName.trim() || 'عميل كريم',
      customerPhone: customerPhone.trim() || '',
      rating: overallRating,
      foodQualityRating,
      serviceSpeedRating,
      menuEaseRating,
      tags: selectedReviewTags,
      comment: reviewComment.trim(),
    };

    try {
      // 1. Save in AppContext / localStorage so Manager Dashboard has it immediately
      let createdLocal: CustomerFeedbackReview;
      if (appCtx?.addCustomerReview) {
        createdLocal = appCtx.addCustomerReview(reviewPayload);
      } else {
        createdLocal = {
          ...reviewPayload,
          id: `rev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          createdAt: new Date().toISOString(),
        };
        try {
          const saved = localStorage.getItem('kian_pos_customer_reviews_v1');
          const parsed = saved ? JSON.parse(saved) : [];
          localStorage.setItem('kian_pos_customer_reviews_v1', JSON.stringify([createdLocal, ...parsed]));
        } catch {}
      }

      // 2. Post to backend so all connected screens receive SSE
      await fetch('/api/menu/submit-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewPayload),
      }).catch(() => {});

      // 3. Broadcast on local mesh
      try {
        const bc = new BroadcastChannel('kian_pos_devices_mesh');
        bc.postMessage({
          type: 'QR_CUSTOMER_REVIEW_RECEIVED',
          payload: { review: createdLocal },
        });
        bc.close();
      } catch {}

      soundEffects.saleSuccess();
      setHasSubmittedReview(true);
      setTimeout(() => {
        setIsRatingModalOpen(false);
      }, 1800);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const isDarkPage = Boolean(activeTheme.isDarkBackground);

  return (
    <div
      dir="rtl"
      style={{
        backgroundColor: activeTheme.backgroundColor,
        color: isDarkPage ? '#f8fafc' : '#0f172a',
      }}
      className="min-h-screen w-full flex flex-col font-sans select-none overflow-x-hidden transition-colors duration-300"
    >
      {/* Top Preview / Manager Control Bar (ONLY shown when manager previews from POS — completely hidden in standalone customer mode) */}
      {!isStandalone && (
        <div className="bg-slate-900 text-white px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 z-40">
          <div className="flex items-center gap-2 flex-wrap">
            {onClosePreview && (
              <button
                type="button"
                onClick={onClosePreview}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition-all cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
                <span>العودة لشاشة النظام</span>
              </button>
            )}
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <QrCode className="w-4 h-4" />
              <span>معاينة صفحة الزبون المستقلة (CustomerQrMenuPage)</span>
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                const url = `${window.location.origin}${window.location.pathname}?customerMenu=1&table=${encodeURIComponent(tableName)}&type=${diningType}`;
                window.history.pushState({}, '', url);
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition-all cursor-pointer"
              title="فتح صفحة الزبون كصفحة مستقلة تماماً بدون أي أدوات إدارة"
            >
              <span>وضع الزبون المستقل بالكامل</span>
            </button>

            <button
              type="button"
              onClick={() => setIsThemeCustomizerOpen(!isThemeCustomizerOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
            >
              <Palette className="w-3.5 h-3.5 text-amber-400" />
              <span>تخصيص الألوان</span>
            </button>

            <button
              type="button"
              onClick={() => setIsManagerEditMode(!isManagerEditMode)}
              style={
                isManagerEditMode
                  ? {
                      backgroundColor: activeTheme.primaryColor,
                      color: activeTheme.buttonTextColor,
                    }
                  : undefined
              }
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                isManagerEditMode ? 'shadow-lg' : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>
                {isManagerEditMode
                  ? '✓ وضع تعديل الصور وتوجيه الأجهزة'
                  : 'تعديل الصور وتحديد جهاز كل منتج'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Manager Live Brand Color Customizer Drawer (Only when !isStandalone) */}
      {!isStandalone && isThemeCustomizerOpen && (
        <div className="bg-slate-900 text-white border-b border-slate-800 px-4 py-4 z-30 animate-in slide-in-from-top-2">
          <div className="max-w-5xl mx-auto space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-amber-400" />
                <div>
                  <h4 className="text-xs sm:text-sm font-black">
                    تخصيص الألوان الأساسية لصفحة منيو الزبون (CustomerQrMenuPage)
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    اختر قالباً جاهزاً أو خصص لون الأزرار ولون الخلفية والبطاقات ليتناسب مع هوية المطعم والكافيه
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsThemeCustomizerOpen(false)}
                className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold cursor-pointer"
              >
                إغلاق ✕
              </button>
            </div>

            {/* Preset Brand Themes */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {QR_MENU_THEME_PRESETS.map(preset => {
                const isSelected = activeTheme.presetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      safeUpdateQrMenuTheme(preset.theme);
                      setRemoteSettings((prev: any) => ({
                        ...(prev || {}),
                        qrMenuTheme: preset.theme,
                      }));
                      soundEffects.playClick();
                    }}
                    className={`p-2.5 rounded-2xl border text-start transition-all cursor-pointer ${
                      isSelected
                        ? 'border-amber-400 bg-white/15 ring-2 ring-amber-400/30'
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span
                        className="w-4 h-4 rounded-full border border-white/40 shrink-0"
                        style={{ backgroundColor: preset.theme.primaryColor }}
                      />
                      <span
                        className="w-4 h-4 rounded-full border border-white/40 shrink-0"
                        style={{ backgroundColor: preset.theme.backgroundColor }}
                      />
                      <span
                        className="w-4 h-4 rounded-full border border-white/40 shrink-0"
                        style={{ backgroundColor: preset.theme.headerBackgroundColor }}
                      />
                    </div>
                    <div className="text-[11px] font-black truncate">{preset.nameAr}</div>
                  </button>
                );
              })}
            </div>

            {/* Custom Color Pickers */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 border-t border-white/10">
              <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
                <label className="block text-[10px] font-bold text-slate-300 mb-1">
                  لون الأزرار الرئيسي
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={activeTheme.primaryColor}
                    onChange={e =>
                      safeUpdateQrMenuTheme({ primaryColor: e.target.value, presetId: 'custom' })
                    }
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <span className="text-xs font-mono font-bold">{activeTheme.primaryColor}</span>
                </div>
              </div>

              <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
                <label className="block text-[10px] font-bold text-slate-300 mb-1">
                  لون نص الأزرار
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      safeUpdateQrMenuTheme({ buttonTextColor: '#ffffff', presetId: 'custom' })
                    }
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-black border cursor-pointer ${
                      activeTheme.buttonTextColor === '#ffffff'
                        ? 'bg-white text-slate-950 border-white'
                        : 'bg-white/10 text-white border-white/20'
                    }`}
                  >
                    أبيض
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      safeUpdateQrMenuTheme({ buttonTextColor: '#0f172a', presetId: 'custom' })
                    }
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-black border cursor-pointer ${
                      activeTheme.buttonTextColor === '#0f172a'
                        ? 'bg-amber-400 text-slate-950 border-amber-400'
                        : 'bg-white/10 text-white border-white/20'
                    }`}
                  >
                    داكن
                  </button>
                </div>
              </div>

              <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
                <label className="block text-[10px] font-bold text-slate-300 mb-1">
                  لون خلفية الصفحة
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={activeTheme.backgroundColor}
                    onChange={e =>
                      safeUpdateQrMenuTheme({ backgroundColor: e.target.value, presetId: 'custom' })
                    }
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <span className="text-xs font-mono font-bold">{activeTheme.backgroundColor}</span>
                </div>
              </div>

              <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
                <label className="block text-[10px] font-bold text-slate-300 mb-1">
                  لون خلفية الترويسة
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={activeTheme.headerBackgroundColor}
                    onChange={e =>
                      safeUpdateQrMenuTheme({
                        headerBackgroundColor: e.target.value,
                        presetId: 'custom',
                      })
                    }
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <span className="text-xs font-mono font-bold">
                    {activeTheme.headerBackgroundColor}
                  </span>
                </div>
              </div>

              <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
                <label className="block text-[10px] font-bold text-slate-300 mb-1">
                  لون بطاقات المنتجات
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={activeTheme.cardBackgroundColor}
                    onChange={e =>
                      safeUpdateQrMenuTheme({
                        cardBackgroundColor: e.target.value,
                        presetId: 'custom',
                      })
                    }
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <span className="text-xs font-mono font-bold">
                    {activeTheme.cardBackgroundColor}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Restaurant / Cafe Hero Header (Styled with custom headerBackgroundColor & primaryColor) */}
      <header
        style={{ backgroundColor: activeTheme.headerBackgroundColor }}
        className="relative text-white pt-6 pb-5 px-4 sm:px-6 shadow-xl border-b border-white/10 transition-colors duration-300"
      >
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {activeSettings?.logoUrl || activeSettings?.logo ? (
              <img
                src={activeSettings.logoUrl || activeSettings.logo}
                alt={activeSettings.storeName || activeSettings.storeNameAr}
                style={{ borderColor: activeTheme.primaryColor }}
                className="w-16 h-16 rounded-2xl object-cover border-2 shadow-lg bg-white"
              />
            ) : (
              <div
                style={{
                  backgroundColor: activeTheme.primaryColor,
                  color: activeTheme.buttonTextColor,
                }}
                className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg border border-white/20 shrink-0"
              >
                <UtensilsCrossed className="w-8 h-8" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  {activeSettings?.storeName || activeSettings?.storeNameAr || 'المطعم والكافيه'}
                </h1>
                <span
                  style={{
                    backgroundColor: `${activeTheme.primaryColor}33`,
                    color: '#ffffff',
                    borderColor: `${activeTheme.primaryColor}66`,
                  }}
                  className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border"
                >
                  منيو الطلب الذاتي المباشر
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                {activeSettings?.storeSubtitle ||
                  activeSettings?.tagline ||
                  'اختر وجباتك ومشروباتك المفضلة بالصور والأسعار وسيتم تحضيرها فوراً'}
              </p>
              {activeSettings?.phone && (
                <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                  <span>📞 {activeSettings.phone}</span>
                  {activeSettings?.address && <span>• 📍 {activeSettings.address}</span>}
                </p>
              )}
            </div>
          </div>

          {/* Dining Type & Table Selector Pill for Customer */}
          <div className="w-full sm:w-auto flex flex-col sm:items-end gap-2 bg-white/5 backdrop-blur-md p-3 rounded-2xl border border-white/10">
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              {(
                [
                  { id: 'dine_in', label: '🍽️ داخل الصالة' },
                  { id: 'takeaway', label: '🛍️ سفري' },
                  { id: 'delivery', label: '🛵 توصيل' },
                ] as { id: DiningType; label: string }[]
              ).map(dt => {
                const active = diningType === dt.id;
                return (
                  <button
                    key={dt.id}
                    type="button"
                    onClick={() => setDiningType(dt.id)}
                    style={
                      active
                        ? {
                            backgroundColor: activeTheme.primaryColor,
                            color: activeTheme.buttonTextColor,
                          }
                        : undefined
                    }
                    className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                      active ? 'shadow-sm' : 'bg-white/10 text-slate-300 hover:bg-white/15'
                    }`}
                  >
                    {dt.label}
                  </button>
                );
              })}
            </div>

            {diningType === 'dine_in' && (
              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                <span className="text-[11px] text-slate-300 font-bold">رقم الطاولة:</span>
                <select
                  value={tableName}
                  onChange={e => setTableName(e.target.value)}
                  style={{ borderColor: `${activeTheme.primaryColor}80` }}
                  className="bg-slate-800 text-white font-black text-xs px-3 py-1.5 rounded-xl border focus:outline-none cursor-pointer"
                >
                  {RESTAURANT_TABLES.map(t => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                  <option value="تراس خارجي 1">تراس خارجي 1</option>
                  <option value="تراس خارجي 2">تراس خارجي 2</option>
                  <option value="ركن العائلات VIP">ركن العائلات VIP</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Live Customer Order Status Tracker + Rate Experience Button */}
      {myLiveOrders.length > 0 && (
        <div className="max-w-5xl w-full mx-auto px-4 pt-4">
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500/40 rounded-2xl p-3.5 sm:p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                <h3 className="text-xs sm:text-sm font-black text-emerald-900 dark:text-emerald-200">
                  متابعة حالة طلبك المباشرة ({myLiveOrders[0].orderNumber} - {myLiveOrders[0].tableName})
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setRatingOrderInfo({
                      orderId: myLiveOrders[0].id,
                      orderNumber: myLiveOrders[0].orderNumber,
                      tableName: myLiveOrders[0].tableName,
                    });
                    setHasSubmittedReview(false);
                    setIsRatingModalOpen(true);
                  }}
                  style={{
                    backgroundColor: activeTheme.primaryColor,
                    color: activeTheme.buttonTextColor,
                  }}
                  className="px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>قيّم تجربتك معنا</span>
                </button>
                <span
                  className={`px-2.5 py-1 rounded-xl text-xs font-black ${
                    myLiveOrders[0].status === 'ready'
                      ? 'bg-emerald-600 text-white'
                      : myLiveOrders[0].status === 'in_progress'
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-blue-600 text-white'
                  }`}
                >
                  {myLiveOrders[0].status === 'ready'
                    ? '✅ طلبك جاهز للتقديم!'
                    : myLiveOrders[0].status === 'in_progress'
                    ? '🔥 جاري تحضير طلبك الآن'
                    : '📨 تم استلام الطلب في القسم المختص'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-2">
              {myLiveOrders[0].items.map(item => (
                <div
                  key={item.id}
                  className="flex items-center justify-between bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-emerald-200/70 dark:border-emerald-800/50 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.nameAr}
                        className="w-8 h-8 rounded-lg object-cover shrink-0 border border-slate-200"
                      />
                    )}
                    <span className="font-black text-emerald-600 dark:text-emerald-400 font-mono">
                      {item.quantity}×
                    </span>
                    <div className="truncate">
                      <p className="font-bold text-slate-800 dark:text-slate-100 truncate">
                        {item.nameAr}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        القسم: {item.targetDeviceName || 'المطبخ'}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold shrink-0 ${
                      item.status === 'ready' || item.status === 'served'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                        : item.status === 'cooking'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {item.status === 'ready' || item.status === 'served'
                      ? 'جاهز ✓'
                      : item.status === 'cooking'
                      ? 'قيد التحضير 🔥'
                      : 'بانتظار التحضير'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sticky Search & Categories Bar */}
      <div
        style={{
          backgroundColor: `${activeTheme.backgroundColor}f2`,
        }}
        className="sticky top-0 z-30 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 py-3 px-4 shadow-2xs"
      >
        <div className="max-w-5xl mx-auto space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="ابحث عن وجبة، مشروب، أو صنف..."
                style={{
                  backgroundColor: activeTheme.cardBackgroundColor,
                  color: isDarkPage ? '#f8fafc' : '#0f172a',
                }}
                className="w-full ps-10 pe-9 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-bold focus:outline-none shadow-2xs"
              />
              <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-3" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute end-2.5 top-2.5 w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* View Mode Switcher (Side-by-Side Image beside Name/Price vs Grid) */}
            <div
              style={{ backgroundColor: activeTheme.cardBackgroundColor }}
              className="flex items-center p-1 rounded-2xl border border-slate-200 dark:border-slate-800 shrink-0"
            >
              <button
                type="button"
                onClick={() => setViewLayout('list')}
                style={
                  viewLayout === 'list'
                    ? {
                        backgroundColor: activeTheme.primaryColor,
                        color: activeTheme.buttonTextColor,
                      }
                    : undefined
                }
                className={`px-2.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1 transition-all cursor-pointer ${
                  viewLayout === 'list' ? '' : 'text-slate-500'
                }`}
                title="عرض الصورة بجانب الاسم والسعر"
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">بجانب الاسم والسعر</span>
              </button>
              <button
                type="button"
                onClick={() => setViewLayout('grid')}
                style={
                  viewLayout === 'grid'
                    ? {
                        backgroundColor: activeTheme.primaryColor,
                        color: activeTheme.buttonTextColor,
                      }
                    : undefined
                }
                className={`px-2.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1 transition-all cursor-pointer ${
                  viewLayout === 'grid' ? '' : 'text-slate-500'
                }`}
                title="عرض شبكي بصور كبيرة"
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">شبكي</span>
              </button>
            </div>

            {/* Customer Rate Experience Quick Button */}
            <button
              type="button"
              onClick={() => {
                setHasSubmittedReview(false);
                setIsRatingModalOpen(true);
              }}
              style={{
                backgroundColor: activeTheme.cardBackgroundColor,
                borderColor: `${activeTheme.primaryColor}66`,
              }}
              className="px-3 py-2 rounded-2xl border text-xs font-black flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
              title="تقييم تجربة الطلب والخدمة"
            >
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="hidden md:inline">تقييم التجربة</span>
            </button>
          </div>

          {/* Horizontal Categories Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
            <button
              type="button"
              onClick={() => setSelectedCategory('cat_all')}
              style={
                selectedCategory === 'cat_all'
                  ? {
                      backgroundColor: activeTheme.primaryColor,
                      color: activeTheme.buttonTextColor,
                    }
                  : {
                      backgroundColor: activeTheme.cardBackgroundColor,
                      color: isDarkPage ? '#cbd5e1' : '#475569',
                    }
              }
              className="px-4 py-2 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer border border-slate-200/60 dark:border-slate-800 shadow-2xs"
            >
              <UtensilsCrossed className="w-3.5 h-3.5" />
              <span>جميع الأصناف ({activeProducts.length})</span>
            </button>

            {activeCategories
              .filter(c => c.id !== 'cat_all')
              .map(cat => {
                const count = activeProducts.filter(p => p.categoryId === cat.id).length;
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    style={
                      isSelected
                        ? {
                            backgroundColor: activeTheme.primaryColor,
                            color: activeTheme.buttonTextColor,
                          }
                        : {
                            backgroundColor: activeTheme.cardBackgroundColor,
                            color: isDarkPage ? '#cbd5e1' : '#475569',
                          }
                    }
                    className="px-4 py-2 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer border border-slate-200/60 dark:border-slate-800 shadow-2xs"
                  >
                    <span>{cat.nameAr}</span>
                    <span className="text-[10px] opacity-75 font-mono">({count})</span>
                  </button>
                );
              })}
          </div>
        </div>
      </div>

      {/* Manager Notice Banner when Manager Mode is Active */}
      {isManagerEditMode && (
        <div className="max-w-5xl w-full mx-auto px-4 pt-3">
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-2xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 font-black">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-amber-900 dark:text-amber-200">
                  وضع المسؤول مفعل: الصور يتم جلبها تلقائياً من بيانات المخزون المربوطة بكل منتج
                </h4>
                <p className="text-[11px] text-amber-800 dark:text-amber-300">
                  اضغط على أي منتج لتحديث صورته في المخزون أو تحديد الجهاز الموجه له، أو اضغط على &quot;تخصيص ألوان الهوية&quot; بالأعلى.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsManagerEditMode(false)}
              className="px-3 py-1.5 rounded-xl bg-amber-600 text-white text-xs font-bold shrink-0 cursor-pointer"
            >
              إنهاء وضع التعديل
            </button>
          </div>
        </div>
      )}

      {/* Main Menu Products List / Grid */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-5 pb-32">
        {isLoadingCatalog && activeProducts.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw
              style={{ color: activeTheme.primaryColor }}
              className="w-10 h-10 animate-spin mx-auto"
            />
            <p className="text-sm font-bold text-slate-500">
              جاري تحميل قائمة الطعام والصور من المخزون...
            </p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div
            style={{ backgroundColor: activeTheme.cardBackgroundColor }}
            className="py-16 text-center rounded-3xl border border-slate-200 dark:border-slate-800 p-8 max-w-md mx-auto"
          >
            <UtensilsCrossed className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <h3 className="text-base font-black">لا توجد أصناف مطابقة حالياً</h3>
            <p className="text-xs text-slate-500 mt-1">
              جرب البحث بكلمة أخرى أو اختيار قسم آخر من الأعلى.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {groupedMenuSections.map(section => (
              <section key={section.id} className="space-y-3.5">
                {/* Organized Section Header */}
                <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-200/80 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span
                      style={{ backgroundColor: activeTheme.primaryColor }}
                      className="w-2 h-6 rounded-full shrink-0"
                    />
                    <h2 className="text-base sm:text-lg font-black tracking-tight">
                      {section.title}
                    </h2>
                  </div>
                  <span className="text-xs font-bold text-slate-400 font-mono">
                    {section.items.length} صنف
                  </span>
                </div>

                <div
                  className={
                    viewLayout === 'grid'
                      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
                      : 'grid grid-cols-1 md:grid-cols-2 gap-3.5'
                  }
                >
                  {section.items.map(product => {
                    const cartItem = getCartItem(product.id);
                    const cat = activeCategories.find(c => c.id === product.categoryId);
                    const targetLabel = getTargetDeviceLabel(product, activeDevices);
                    const invInfo = resolveProductFromInventory(product, combinedInventoryCatalog);
                    const displayImage = invInfo.imageUrl || product.image;

                    return (
                      <div
                        key={product.id}
                        style={{
                          backgroundColor: activeTheme.cardBackgroundColor,
                          borderColor: cartItem ? activeTheme.primaryColor : undefined,
                        }}
                        className={`group rounded-3xl border transition-all overflow-hidden flex flex-col justify-between ${
                          cartItem
                            ? 'ring-2 shadow-md'
                            : 'border-slate-200/90 dark:border-slate-800 hover:shadow-md shadow-xs'
                        }`}
                      >
                        {/* Optional Top Cover Image when in 'grid' layout */}
                        {viewLayout === 'grid' && (
                          <div className="relative w-full h-44 bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0">
                            {displayImage ? (
                              <img
                                src={displayImage}
                                alt={product.nameAr}
                                onClick={() =>
                                  setZoomedImageProduct({ ...product, image: displayImage })
                                }
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <UtensilsCrossed className="w-10 h-10 text-slate-400" />
                              </div>
                            )}
                            {!isStandalone && isManagerEditMode && (
                              <button
                                type="button"
                                onClick={e => {
                                  e.stopPropagation();
                                  openProductEditor(product);
                                }}
                                style={{
                                  backgroundColor: activeTheme.primaryColor,
                                  color: activeTheme.buttonTextColor,
                                }}
                                className="absolute top-2.5 end-2.5 px-2.5 py-1 rounded-xl font-black text-[11px] shadow-lg flex items-center gap-1 cursor-pointer"
                              >
                                <Camera className="w-3.5 h-3.5" />
                                <span>تعديل الصورة والوجهة</span>
                              </button>
                            )}
                          </div>
                        )}

                        {/* Product Row: Inventory Image Directly Beside Name & Price */}
                        <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between gap-3">
                          <div className="flex items-start gap-3">
                            {/* Inventory-Linked Product Image Thumbnail Beside Name & Price */}
                            <div
                              onClick={() =>
                                displayImage
                                  ? setZoomedImageProduct({ ...product, image: displayImage })
                                  : !isStandalone && isManagerEditMode
                                  ? openProductEditor(product)
                                  : undefined
                              }
                              className={`relative rounded-2xl overflow-hidden shrink-0 border border-slate-200/80 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 cursor-pointer group/img ${
                                viewLayout === 'list' ? 'w-24 h-24 sm:w-28 sm:h-28' : 'w-14 h-14'
                              }`}
                              title="اضغط لتكبير صورة الصنف"
                            >
                              {displayImage ? (
                                <img
                                  src={displayImage}
                                  alt={product.nameAr}
                                  className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center">
                                  <UtensilsCrossed
                                    style={{ color: activeTheme.primaryColor }}
                                    className="w-6 h-6 mb-1"
                                  />
                                  <span className="text-[9px] text-slate-400 font-bold">صورة الصنف</span>
                                </div>
                              )}

                              {!isStandalone && isManagerEditMode && viewLayout === 'list' && (
                                <button
                                  type="button"
                                  onClick={e => {
                                    e.stopPropagation();
                                    openProductEditor(product);
                                  }}
                                  style={{
                                    backgroundColor: activeTheme.primaryColor,
                                    color: activeTheme.buttonTextColor,
                                  }}
                                  className="absolute inset-x-1 bottom-1 py-1 rounded-lg font-black text-[9px] flex items-center justify-center gap-1 shadow-md cursor-pointer"
                                >
                                  <Camera className="w-3 h-3" />
                                  <span>تعديل</span>
                                </button>
                              )}
                            </div>

                            {/* Name, Price & Clean Customer Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <h3 className="text-sm sm:text-base font-black leading-snug truncate">
                                    {product.nameAr}
                                  </h3>
                                  <div className="flex items-center gap-1.5 flex-wrap mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                                    {cat && cat.id !== 'cat_all' && (
                                      <span>{cat.nameAr}</span>
                                    )}
                                    {invInfo.stock > 0 && (
                                      <>
                                        {cat && cat.id !== 'cat_all' && <span aria-hidden="true">·</span>}
                                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                          {!isStandalone && isManagerEditMode
                                            ? `مخزون: ${invInfo.stock} ${invInfo.unit}`
                                            : 'متوفر للطلب'}
                                        </span>
                                      </>
                                    )}
                                    {product.preparationTimeMinutes && (
                                      <>
                                        <span aria-hidden="true">·</span>
                                        <span className="inline-flex items-center gap-0.5 font-semibold">
                                          <Clock className="w-3 h-3" />
                                          <span>{product.preparationTimeMinutes} د</span>
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>

                                {/* Product Price Badge right beside Name & Photo */}
                                <div
                                  style={{
                                    backgroundColor: `${activeTheme.primaryColor}18`,
                                    color: isDarkPage ? '#ffffff' : '#0f172a',
                                    borderColor: `${activeTheme.primaryColor}45`,
                                  }}
                                  className="px-2.5 py-1.5 rounded-2xl border font-black font-mono text-xs sm:text-sm whitespace-nowrap shrink-0 shadow-2xs"
                                >
                                  {formatMoney(product.price)}
                                </div>
                              </div>

                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                                {invInfo.description}
                              </p>

                              {/* Target Device Routing Badge (ONLY Visible in Manager Preview Edit Mode) */}
                              {!isStandalone && isManagerEditMode && (
                                <div
                                  onClick={() => openProductEditor(product)}
                                  className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/60 text-[10px] font-bold text-blue-700 dark:text-blue-300 cursor-pointer hover:bg-blue-100"
                                >
                                  <Monitor className="w-3 h-3 text-blue-500 shrink-0" />
                                  <span className="truncate">يوجه إلى: {targetLabel}</span>
                                  <Edit3 className="w-2.5 h-2.5 opacity-70 shrink-0" />
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Add to Cart / Quantity Controls (Styled with activeTheme.primaryColor) */}
                          <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
                            {!cartItem ? (
                              <button
                                type="button"
                                onClick={() => handleAddItem(product)}
                                style={{
                                  backgroundColor: activeTheme.primaryColor,
                                  color: activeTheme.buttonTextColor,
                                }}
                                className="w-full py-2.5 px-4 rounded-2xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs hover:opacity-95 active:scale-98 transition-all cursor-pointer"
                              >
                                <Plus className="w-4 h-4" />
                                <span>إضافة إلى الطلب</span>
                              </button>
                            ) : (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateQty(product.id, cartItem.quantity - 1)}
                                      className="w-8 h-8 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 flex items-center justify-center shadow-2xs active:scale-90 cursor-pointer"
                                    >
                                      <Minus className="w-4 h-4" />
                                    </button>
                                    <span className="w-8 text-center font-black font-mono text-sm">
                                      {cartItem.quantity}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleAddItem(product)}
                                      style={{
                                        backgroundColor: activeTheme.primaryColor,
                                        color: activeTheme.buttonTextColor,
                                      }}
                                      className="w-8 h-8 rounded-xl flex items-center justify-center shadow-2xs active:scale-90 cursor-pointer"
                                    >
                                      <Plus className="w-4 h-4" />
                                    </button>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      setEditingNoteProductId(
                                        editingNoteProductId === product.id ? null : product.id
                                      )
                                    }
                                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                                      cartItem.notes
                                        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                                    }`}
                                  >
                                    <MessageSquarePlus className="w-3.5 h-3.5" />
                                    <span>{cartItem.notes ? 'تعديل الملاحظة' : 'ملاحظة تحضير'}</span>
                                  </button>
                                </div>

                                {/* Item Special Note Input & Quick Presets */}
                                {(editingNoteProductId === product.id || cartItem.notes) && (
                                  <div className="p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-1.5">
                                    <input
                                      type="text"
                                      value={cartItem.notes}
                                      onChange={e => handleUpdateItemNote(product.id, e.target.value)}
                                      placeholder="ملاحظة خاصة (مثال: بدون سكر، زيادة ثلج...)"
                                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold focus:outline-none"
                                    />
                                    <div className="flex items-center gap-1 flex-wrap">
                                      {QUICK_ITEM_NOTES.map(preset => (
                                        <button
                                          key={preset}
                                          type="button"
                                          onClick={() => {
                                            const current = cartItem.notes ? `${cartItem.notes}، ` : '';
                                            if (!cartItem.notes.includes(preset)) {
                                              handleUpdateItemNote(product.id, `${current}${preset}`);
                                            }
                                          }}
                                          className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
                                        >
                                          + {preset}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      {/* Sticky Bottom Customer Order Cart Bar */}
      {totalCartCount > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-40 p-3 sm:p-4 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent pointer-events-none">
          <div className="max-w-2xl mx-auto pointer-events-auto">
            <button
              type="button"
              onClick={() => setIsCheckoutOpen(true)}
              style={{
                backgroundColor: activeTheme.primaryColor,
                color: activeTheme.buttonTextColor,
              }}
              className="w-full p-3.5 sm:p-4 rounded-3xl shadow-2xl flex items-center justify-between gap-3 transition-all active:scale-98 cursor-pointer border-2 border-white/25"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-slate-950 text-white flex items-center justify-center font-black font-mono text-base shadow-md">
                  {totalCartCount}
                </div>
                <div className="text-start">
                  <p className="text-xs font-extrabold opacity-85">
                    سلة طلبك جاهزة (
                    {diningType === 'dine_in'
                      ? tableName
                      : diningType === 'takeaway'
                      ? 'سفري'
                      : 'توصيل'}
                    )
                  </p>
                  <p className="text-base sm:text-lg font-black font-mono">
                    {formatMoney(totalCartPrice)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-slate-950 text-white px-4 py-2.5 rounded-2xl font-extrabold text-xs sm:text-sm shadow-md">
                <span>تأكيد وإرسال الطلب</span>
                <Send className="w-4 h-4 text-amber-400" />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Customer Checkout & Order Confirmation Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
            <div
              style={{ backgroundColor: activeTheme.headerBackgroundColor }}
              className="p-4 sm:p-5 text-white flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <div
                  style={{
                    backgroundColor: activeTheme.primaryColor,
                    color: activeTheme.buttonTextColor,
                  }}
                  className="w-10 h-10 rounded-2xl flex items-center justify-center font-black"
                >
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black">مراجعة وإرسال الطلب</h3>
                  <p className="text-xs text-slate-300">
                    سيتم إرسال كل صنف مباشرة إلى القسم المختص بتحضيره
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: 'dine_in', label: '🍽️ على الطاولة' },
                      { id: 'takeaway', label: '🛍️ سفري' },
                      { id: 'delivery', label: '🛵 توصيل' },
                    ] as { id: DiningType; label: string }[]
                  ).map(dt => (
                    <button
                      key={dt.id}
                      type="button"
                      onClick={() => setDiningType(dt.id)}
                      style={
                        diningType === dt.id
                          ? {
                              backgroundColor: activeTheme.primaryColor,
                              color: activeTheme.buttonTextColor,
                              borderColor: activeTheme.primaryColor,
                            }
                          : undefined
                      }
                      className={`py-2 px-3 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                        diningType === dt.id
                          ? ''
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {dt.label}
                    </button>
                  ))}
                </div>

                {diningType === 'dine_in' && (
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">
                        رقم الطاولة
                      </label>
                      <select
                        value={tableName}
                        onChange={e => setTableName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-black"
                      >
                        {RESTAURANT_TABLES.map(t => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                        <option value="تراس خارجي 1">تراس خارجي 1</option>
                        <option value="تراس خارجي 2">تراس خارجي 2</option>
                        <option value="ركن العائلات VIP">ركن العائلات VIP</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">
                        عدد الأشخاص
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={guestCount}
                        onChange={e => setGuestCount(Math.max(1, Number(e.target.value) || 1))}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-black font-mono"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">
                      الاسم (اختياري)
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      placeholder="اسمك الكريم..."
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">
                      رقم الجوال (اختياري)
                    </label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      placeholder="09xxxxxxxx"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Order Items List with Inventory Photos beside Name & Price */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-500 uppercase">
                  الأصناف المختارة ({totalCartCount})
                </h4>
                {customerCart.map(item => (
                  <div
                    key={item.product.id}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {item.product.image ? (
                        <img
                          src={item.product.image}
                          alt={item.product.nameAr}
                          className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                          <UtensilsCrossed className="w-5 h-5 text-amber-500" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                          {item.product.nameAr}
                        </p>
                        <p className="text-xs font-bold text-amber-600 dark:text-amber-400 font-mono">
                          {formatMoney(item.product.price * item.quantity)}
                        </p>
                        {item.notes && (
                          <p className="text-[11px] text-slate-500 truncate">ملاحظة: {item.notes}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(item.product.id, item.quantity - 1)}
                        className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center font-black font-mono text-xs">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAddItem(item.product)}
                        style={{
                          backgroundColor: activeTheme.primaryColor,
                          color: activeTheme.buttonTextColor,
                        }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  ملاحظات عامة على الطلب (اختياري)
                </label>
                <textarea
                  rows={2}
                  value={orderNotes}
                  onChange={e => setOrderNotes(e.target.value)}
                  placeholder="أي ملاحظات إضافية للقسم المختص أو الكابتن..."
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-none"
                />
              </div>
            </div>

            <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                  الإجمالي المطلوب:
                </span>
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {formatMoney(totalCartPrice)}
                </span>
              </div>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmitCustomerOrder}
                style={{
                  backgroundColor: activeTheme.primaryColor,
                  color: activeTheme.buttonTextColor,
                }}
                className="w-full py-3.5 rounded-2xl font-black text-sm sm:text-base shadow-lg flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>إرسال الطلب الآن للقسم المختص</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          CUSTOMER POST-ORDER EXPERIENCE RATING MODAL (تقييم تجربة العميل بعد إرسال الطلب)
         ========================================== */}
      {isRatingModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {hasSubmittedReview ? (
              <div className="p-8 text-center space-y-4">
                <div
                  style={{
                    backgroundColor: `${activeTheme.primaryColor}20`,
                    color: activeTheme.primaryColor,
                  }}
                  className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
                >
                  <Heart className="w-8 h-8 fill-current" />
                </div>
                <h3 className="text-xl font-black">شكراً جزيلاً لتقييمك! ⭐</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  تم إرسال تقييمك وملاحظاتك إلى لوحة تحكم إدارة المطعم مباشرة. نسعد دائماً بخدمتك!
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitCustomerReview}>
                {/* Header */}
                <div
                  style={{ backgroundColor: activeTheme.headerBackgroundColor }}
                  className="p-5 text-white text-center relative"
                >
                  <button
                    type="button"
                    onClick={() => setIsRatingModalOpen(false)}
                    className="absolute top-4 end-4 w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-black mb-2">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      {ratingOrderInfo?.orderNumber
                        ? `تم إرسال طلبك (${ratingOrderInfo.orderNumber}) بنجاح!`
                        : 'تقييم تجربة الطلب والخدمة'}
                    </span>
                  </div>
                  <h3 className="text-lg font-black">كيف كانت تجربتك عبر منيو QR؟</h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    رأيك يهمنا ويظهر مباشرة لدى مدير المطعم لتطوير الخدمة
                  </p>
                </div>

                {/* Body */}
                <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                  {/* Main 5-Star Rating */}
                  <div className="text-center space-y-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                    <div className="flex items-center justify-center gap-2">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => {
                            soundEffects.playClick();
                            setOverallRating(star);
                          }}
                          className="p-1.5 transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                        >
                          <Star
                            className={`w-8 h-8 transition-colors ${
                              star <= overallRating
                                ? 'text-amber-400 fill-amber-400 drop-shadow-xs'
                                : 'text-slate-300 dark:text-slate-600'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    <div className="text-xs font-black text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1.5">
                      <span className="text-base">{RATING_LABELS[overallRating]?.emoji}</span>
                      <span>
                        {RATING_LABELS[overallRating]?.label} ({overallRating}/5)
                      </span>
                    </div>
                  </div>

                  {/* Sub-Ratings (Food, Speed, Menu Ease) */}
                  <div className="space-y-2 text-xs">
                    {[
                      {
                        label: '🍽️ جودة وتنوع الأصناف والصور',
                        val: foodQualityRating,
                        setter: setFoodQualityRating,
                      },
                      {
                        label: '⚡ سرعة الاستجابة والخدمة',
                        val: serviceSpeedRating,
                        setter: setServiceSpeedRating,
                      },
                      {
                        label: '📱 سهولة الطلب من صفحة QR',
                        val: menuEaseRating,
                        setter: setMenuEaseRating,
                      },
                    ].map(sub => (
                      <div
                        key={sub.label}
                        className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800"
                      >
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {sub.label}
                        </span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map(s => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => sub.setter(s)}
                              className="cursor-pointer"
                            >
                              <Star
                                className={`w-4 h-4 ${
                                  s <= sub.val
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-slate-300 dark:text-slate-600'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Quick Tags */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5">
                      ما أكثر شيء أعجبك اليوم؟
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {FEEDBACK_QUICK_TAGS.map(tag => {
                        const active = selectedReviewTags.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => toggleReviewTag(tag)}
                            style={
                              active
                                ? {
                                    backgroundColor: `${activeTheme.primaryColor}20`,
                                    borderColor: activeTheme.primaryColor,
                                  }
                                : undefined
                            }
                            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                              active
                                ? 'text-slate-900 dark:text-white font-black'
                                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {active ? '✓ ' : '+ '}
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Optional Comment */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">
                      ملاحظاتك أو اقتراحاتك لإدارة المطعم (اختياري):
                    </label>
                    <textarea
                      rows={2}
                      value={reviewComment}
                      onChange={e => setReviewComment(e.target.value)}
                      placeholder="اكتب رأيك بكل صراحة..."
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-none"
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRatingModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-200/60 cursor-pointer"
                  >
                    لاحقاً
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    style={{
                      backgroundColor: activeTheme.primaryColor,
                      color: activeTheme.buttonTextColor,
                    }}
                    className="flex-1 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <ThumbsUp className="w-4 h-4" />
                    <span>إرسال التقييم لإدارة المطعم</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Manager Product Image & Target Device Routing Modal (ONLY in Manager Preview Mode) */}
      {!isStandalone && editingProductModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white w-full max-w-xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
            <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black">
                    إعدادات الصنف في المخزون ومنيو الزبون: {editingProductModal.nameAr}
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    تخصيص صورة المنتج المربوطة بالمخزون وتحديد الجهاز الذي يظهر فيه الطلب
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingProductModal(null)}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1">
              {/* 1. Target Device Selection */}
              <div className="space-y-2.5">
                <label className="block text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Monitor className="w-4 h-4 text-blue-500" />
                  <span>1. أين يظهر هذا المنتج عندما يطلبه الزبون؟ (الجهاز الموجه له)</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {TARGET_DEVICE_OPTIONS.map(opt => (
                    <button
                      key={opt.role}
                      type="button"
                      onClick={() => {
                        setEditTargetRole(opt.role);
                        setEditTargetDeviceId('');
                        setEditTargetStationName(opt.labelAr);
                      }}
                      className={`p-3 rounded-2xl border text-start transition-all cursor-pointer ${
                        editTargetRole === opt.role && !editTargetDeviceId
                          ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 ring-2 ring-blue-500/20'
                          : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 hover:border-blue-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-900 dark:text-white">
                          {opt.labelAr}
                        </span>
                        {editTargetRole === opt.role && !editTargetDeviceId && (
                          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                        {opt.descAr}
                      </p>
                    </button>
                  ))}
                </div>

                {activeDevices.length > 0 && (
                  <div className="pt-2">
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5">
                      أو اختر جهازاً متصلاً محدداً بالاسم من الأجهزة المربوطة حالياً:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {activeDevices.map(dev => (
                        <button
                          key={dev.id}
                          type="button"
                          onClick={() => {
                            setEditTargetDeviceId(dev.id);
                            setEditTargetRole(dev.role);
                            setEditTargetStationName(dev.name);
                          }}
                          className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 cursor-pointer ${
                            editTargetDeviceId === dev.id
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          <Smartphone className="w-3.5 h-3.5" />
                          <span>{dev.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    اسم القسم / المحطة الموجه لها:
                  </label>
                  <input
                    type="text"
                    value={editTargetStationName}
                    onChange={e => setEditTargetStationName(e.target.value)}
                    placeholder="مثال: بارستا الكافيه / شاشة المطبخ الساخن"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                  />
                </div>
              </div>

              {/* 2. Product Image Upload & Gallery */}
              <div className="space-y-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                <label className="block text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-amber-500" />
                  <span>2. صورة المنتج في المخزون (تظهر بجانب الاسم والسعر)</span>
                </label>

                <div className="flex items-center gap-3">
                  <div className="w-24 h-24 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                    {editImageInput ? (
                      <img src={editImageInput} alt="preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-slate-400" />
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>رفع صورة من الجهاز / الكاميرا</span>
                      </button>
                      {editImageInput && (
                        <button
                          type="button"
                          onClick={() => setEditImageInput('')}
                          className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 text-xs font-bold cursor-pointer"
                        >
                          حذف الصورة
                        </button>
                      )}
                    </div>
                    <input
                      type="url"
                      value={editImageInput}
                      onChange={e => setEditImageInput(e.target.value)}
                      placeholder="أو الصق رابط الصورة المباشر هنا (https://...)"
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <span className="block text-[11px] font-bold text-slate-500 mb-1.5">
                    أو اختر صورة جاهزة عالية الدقة بضغطة واحدة:
                  </span>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {PRESET_FOOD_IMAGES.map(preset => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setEditImageInput(preset.url)}
                        className={`group relative rounded-xl overflow-hidden border-2 aspect-square cursor-pointer ${
                          editImageInput === preset.url
                            ? 'border-amber-500 ring-2 ring-amber-500/30'
                            : 'border-transparent hover:border-amber-400'
                        }`}
                        title={preset.label}
                      >
                        <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                        <span className="absolute inset-x-0 bottom-0 bg-slate-950/75 text-white text-[9px] font-bold py-0.5 px-1 truncate">
                          {preset.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3. Description & Preparation Time */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    وصف المنتج ومكوناته للزبون:
                  </label>
                  <input
                    type="text"
                    value={editDescInput}
                    onChange={e => setEditDescInput(e.target.value)}
                    placeholder="مثال: يقدم مع البطاطا المقلية والصوص الخاص..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    وقت التحضير (دقائق):
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={editPrepTimeInput}
                    onChange={e => setEditPrepTimeInput(Number(e.target.value) || 10)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-black font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2 bg-slate-50 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => setEditingProductModal(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveProductEdits}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>حفظ الصورة والجهاز الموجه</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox Modal */}
      {zoomedImageProduct && zoomedImageProduct.image && (
        <div
          onClick={() => setZoomedImageProduct(null)}
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="max-w-lg w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl overflow-hidden border border-white/10 shadow-2xl"
          >
            <img
              src={zoomedImageProduct.image}
              alt={zoomedImageProduct.nameAr}
              className="w-full max-h-[65vh] object-cover"
            />
            <div className="p-4 flex items-center justify-between">
              <div>
                <h4 className="font-black text-base">{zoomedImageProduct.nameAr}</h4>
                {zoomedImageProduct.descriptionAr && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    {zoomedImageProduct.descriptionAr}
                  </p>
                )}
              </div>
              <span className="font-black text-amber-500 font-mono text-base">
                {formatMoney(zoomedImageProduct.price)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
