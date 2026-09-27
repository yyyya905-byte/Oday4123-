import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Sparkles,
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  Instagram,
  User,
  Zap,
  Globe,
  Coins,
  Battery,
  Sliders,
  Printer,
  Barcode,
  Truck,
  MessageSquare,
  Search,
  Filter,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  Clock,
  Check,
  Layers,
  ArrowRight,
  Database,
  Cloud,
  FileSpreadsheet
} from 'lucide-react';

interface ChangelogItem {
  id: string;
  version: string;
  date: string;
  isLatest?: boolean;
  titleAr: string;
  titleEn: string;
  summaryAr: string;
  summaryEn: string;
  category: 'all' | 'currency' | 'pos' | 'ui_buttons' | 'devices' | 'wholesale' | 'security';
  badgeAr: string;
  badgeEn: string;
  badgeColor: string;
  features: {
    icon: React.ElementType;
    titleAr: string;
    titleEn: string;
    descAr: string;
    descEn: string;
    tag: string;
    actionLabelAr?: string;
    actionLabelEn?: string;
    onAction?: (app: any) => void;
  }[];
}

export const AboutView: React.FC = () => {
  const app = useApp();
  const {
    language,
    setActiveTab,
    setIsButtonCustomizerModalOpen,
    notify
  } = app;

  const [activeSubTab, setActiveSubTab] = useState<'changelog' | 'buttons' | 'specs' | 'developer'>('changelog');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedVersions, setExpandedVersions] = useState<Record<string, boolean>>({
    'v2.5.4': true,
    'v2.5.0': true,
    'v2.4.0': false,
    'v2.3.0': false,
    'v2.2.0': false,
    'v2.0.0': false
  });

  const toggleVersionExpand = (version: string) => {
    setExpandedVersions(prev => ({
      ...prev,
      [version]: !prev[version]
    }));
  };

  const changelogData: ChangelogItem[] = [
    {
      id: 'v2.5.4',
      version: 'v2.5.4 Pro',
      date: 'سبتمبر 2026',
      isLatest: true,
      titleAr: 'تحديث العملة اللبنانية، مؤشر البطارية الذكي، والتحكم بمواقع الأزرار',
      titleEn: 'Lebanese Currency, Battery Indicator & Custom Button Positioning',
      summaryAr: 'إضافة شاملة لخيارات العملة اللبنانية، مؤشر شحن البطارية الديناميكي، ونظام كامل للتحكم بمواقع وترتيب أزرار الواجهة ولوحة السلة.',
      summaryEn: 'Comprehensive Lebanese LBP support, dynamic battery indicator, and full UI button placement customization.',
      category: 'all',
      badgeAr: 'الإصدار الأحدث ✨',
      badgeEn: 'Latest Release ✨',
      badgeColor: 'bg-amber-500 text-slate-950',
      features: [
        {
          icon: Coins,
          titleAr: 'خيارات العملة اللبنانية الشاملة (LBP)',
          titleEn: 'Comprehensive Lebanese Currency Options (LBP)',
          descAr: 'دعم كامل لليرة اللبنانية (ل.ل) كعملة رئيسية أو ثانوية، مع نشرة أسعار الصرف الحية، ومساعد استلام الدولار النقدي، وفئات النقد اللبنانية (50,000 إلى 2,000,000 ل.ل)، وتحويل الفواتير والديون تلقائياً.',
          descEn: 'Full support for Lebanese Pound (LBP) as base or secondary currency, live market bulletin, cash USD acceptance helper with instant dual change calculation, and LBP banknote buttons.',
          tag: 'عملات ومالية',
          actionLabelAr: 'فتح إعدادات العملة',
          actionLabelEn: 'Currency Settings',
          onAction: (a) => a.setActiveTab('settings')
        },
        {
          icon: Battery,
          titleAr: 'مؤشر نسبة شحن البطارية ووضع توفير الطاقة',
          titleEn: 'Battery Charge Indicator & Power Saving Integration',
          descAr: 'مؤشر تفاعلي متقدم في الشريط العلوي يوضح مستوى شحن البطارية وحالة التوصيل بالشاحن مع ألوان ديناميكية، ويتكامل تلقائياً مع وضع توفير الطاقة للكاشير لتقليل استهلاك البطارية في الورديات الطويلة.',
          descEn: 'Real-time battery level and charging state indicator in the top header with adaptive colors, fully integrated with cashier power saving eco-mode.',
          tag: 'طاقة وأجهزة',
          actionLabelAr: 'عرض إعدادات الطاقة',
          actionLabelEn: 'Power Settings',
          onAction: (a) => a.setActiveTab('settings')
        },
        {
          icon: Sliders,
          titleAr: 'التحكم الكامل بمواقع وترتيب جميع الأزرار والواجهة',
          titleEn: 'Full UI Button Positions & Layout Customization',
          descAr: 'حرية كاملة لنقل لوحة السلة يمين أو يسار الشاشة (يناسب مستخدمي اليد اليمنى واليسرى)، وإعادة ترتيب أو إخفاء أزرار الكاشير، والشريط العلوي، والزر العائم الذكي، مع 4 أوضاع مريحة جاهزة بضغطة واحدة.',
          descEn: 'Full control to switch cart to left or right side (ideal for left-handed cashiers), reorder or toggle cashier tools, header controls, and floating action button with 4 instant presets.',
          tag: 'تخصيص الواجهة',
          actionLabelAr: 'تخصيص الأزرار الآن 🎛️',
          actionLabelEn: 'Customize Buttons Now',
          onAction: (a) => a.setIsButtonCustomizerModalOpen(true)
        },
        {
          icon: Sparkles,
          titleAr: 'واجهة سجل التحسينات الدورية الموثقة في صفحة حول',
          titleEn: 'Periodic Improvements Log in About Screen',
          descAr: 'سجل تفصيلي دوري ومبسط يوثق كل ما تم تطويره وإضافته في النظام مع تصنيفات تفاعلية وخاصية البحث والتجربة الفورية للميزات.',
          descEn: 'A streamlined, periodic changelog interface documenting every enhancement, feature, and optimization with search and direct action launchers.',
          tag: 'سجل التحديثات'
        }
      ]
    },
    {
      id: 'v2.5.0',
      version: 'v2.5.0',
      date: 'أغسطس 2026',
      titleAr: 'نظام شاحنات التوزيع، مستودعات الجملة، وتنبيهات المخزون',
      titleEn: 'Wholesale Depot, Distribution Vehicles & Inventory Alerts',
      summaryAr: 'إدارة أسطول سيارات التوزيع المتنقلة ومانيفست البضائع المطبوع ومطابقة العهدة مع مراقبة المستودعات المركزية.',
      summaryEn: 'Mobile delivery vehicles dispatching, printable loading manifests, driver reconciliation, and low-stock alerts center.',
      category: 'wholesale',
      badgeAr: 'تحديث الجملة 🚚',
      badgeEn: 'Wholesale Update 🚚',
      badgeColor: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
      features: [
        {
          icon: Truck,
          titleAr: 'إدارة مركبات وسيارات التوزيع المتنقلة',
          titleEn: 'Delivery Vehicles Fleet Management',
          descAr: 'تسجيل الشاحنات وسائقيها وخطوط السير وإصدار مانيفست التحميل بالطرود والقطع وقيمة البضاعة مع إمكانية الطباعة الحرارية المباشرة.',
          descEn: 'Fleet tracking, drivers, routes, loading manifests in cartons/units, and wholesale valuation with thermal printing.',
          tag: 'جملة ومخازن',
          actionLabelAr: 'شاحنات التوزيع',
          actionLabelEn: 'Vehicles Tab',
          onAction: (a) => a.setActiveTab('inventory')
        },
        {
          icon: ShieldCheck,
          titleAr: 'مطابقة العهدة النقدية والمخزنية للسائقين',
          titleEn: 'Driver Inventory & Cash Reconciliation',
          descAr: 'تصفية ومطابقة بضائع السائق بعد العودة من خط السير، وحساب المبيعات النقدية والآجلة والتالف بدقة متناهية.',
          descEn: 'Reconcile returned stock, cash collected, credit sales, and damaged units with automated audit reports.',
          tag: 'تدقيق مالي'
        },
        {
          icon: Zap,
          titleAr: 'مركز تنبيهات نواقص المخزون والحد الأدنى',
          titleEn: 'Smart Low Stock Alerts Center',
          descAr: 'لوحة فورية ترصد الأصناف التي اقتربت من النفاد لتفادي انقطاع البيع، مع تصدير قوائم الطلب للموردين.',
          descEn: 'Real-time alert center flagging items reaching reorder levels to prevent stockouts.',
          tag: 'مخزون ذكي'
        }
      ]
    },
    {
      id: 'v2.4.0',
      version: 'v2.4.0',
      date: 'يوليو 2026',
      titleAr: 'مصمم ملصقات الباركود، كشوفات الحسابات، وأتمتة الواتساب',
      titleEn: 'Barcode Designer, Account Statements & WhatsApp Automation',
      summaryAr: 'تصميم وطباعة ملصقات الباركود بمقاسات متعددة، وأتمتة رسائل الديون عبر WhatsApp مع كشوفات حساب تفصيلية.',
      summaryEn: 'Multi-size barcode label designer, automated WhatsApp debt reminders, and detailed account statements.',
      category: 'pos',
      badgeAr: 'الباركود والديون 🏷️',
      badgeEn: 'Barcode & Debts 🏷️',
      badgeColor: 'bg-blue-500/20 text-blue-700 dark:text-blue-300',
      features: [
        {
          icon: Barcode,
          titleAr: 'مصمم ملصقات الباركود والأسعار الشامل',
          titleEn: 'Thermal Barcode & Shelf Label Designer',
          descAr: 'طباعة باركودات المنتجات وملصقات الرفوف بمقاسات 50x30 و 40x25 و 30x20 ملم مع التحكم بظهور السعر والاسم واسم المتجر.',
          descEn: 'Customizable barcode and price tag designer supporting 50x30, 40x25, and 30x20mm thermal rolls.',
          tag: 'طباعة وباركود',
          actionLabelAr: 'فتح مصمم الباركود',
          actionLabelEn: 'Open Barcode Designer',
          onAction: (a) => a.setActiveTab('products')
        },
        {
          icon: MessageSquare,
          titleAr: 'أتمتة رسائل الديون وكشوفات الحسابات عبر WhatsApp',
          titleEn: 'WhatsApp Debt Collection Automation',
          descAr: 'إرسال إشعارات الديون الدورية ورسائل الفواتير الآجلة وسندات القبض للزبائن بضغطة زر واحدة مع تفاصيل الأصناف وقيمة الدولار.',
          descEn: 'One-click automated WhatsApp debt reminders, credit invoices, and payment receipts with breakdown.',
          tag: 'أتمتة الزبائن',
          actionLabelAr: 'قسم الديون والذمم',
          actionLabelEn: 'Debts Section',
          onAction: (a) => a.setActiveTab('debts')
        },
        {
          icon: FileSpreadsheet,
          titleAr: 'كشف حساب تفصيلي وسندات قبض وصرف قابلة للطباعة',
          titleEn: 'Detailed Statements & Printable Vouchers',
          descAr: 'تصدير وطباعة كشوفات حساب معتمدة توثق حركات الفواتير والمدفوعات والمتبقي وسندات القبض الرسمية.',
          descEn: 'Printable financial statements and official receipt/payment vouchers for clients and vendors.',
          tag: 'محاسبة وذمم'
        }
      ]
    },
    {
      id: 'v2.3.0',
      version: 'v2.3.0',
      date: 'يونيو 2026',
      titleAr: 'طابعات البلوتوث المحمولة وشبكة الأجهزة المتصلة',
      titleEn: 'Bluetooth Thermal Printers & Linked Terminals Network',
      summaryAr: 'دعم طابعات البلوتوث المحمولة وربط شاشات المطبخ والزبائن المتصلة فورياً.',
      summaryEn: 'Portable Bluetooth ESC/POS printers, wireless terminals sync, customer displays, and KDS.',
      category: 'devices',
      badgeAr: 'أجهزة وشبكات 🖨️',
      badgeEn: 'Devices & Sync 🖨️',
      badgeColor: 'bg-purple-500/20 text-purple-700 dark:text-purple-300',
      features: [
        {
          icon: Printer,
          titleAr: 'دعم طابعات البلوتوث الحرارية ESC/POS المحمولة',
          titleEn: 'Bluetooth ESC/POS Thermal Printing',
          descAr: 'فحص الاتصال والاقتران المباشر مع طابعات الفواتير المحمولة عبر Web Bluetooth دون الحاجة لبرامج وسيطة.',
          descEn: 'Direct Web Bluetooth connection to mobile receipt printers with instant test printing.',
          tag: 'طابعات حرارية',
          actionLabelAr: 'إعدادات الطابعات',
          actionLabelEn: 'Printer Settings',
          onAction: (a) => a.setActiveTab('settings')
        },
        {
          icon: Smartphone,
          titleAr: 'شاشة الزبون التفاعلية (Customer Display - CFD)',
          titleEn: 'Customer Facing Display (CFD)',
          descAr: 'شاشة مخصصة للزبون تعرض سلة المشتريات والحساب المتبقي ورمز QR لنقاط الولاء فورياً.',
          descEn: 'Dedicated customer screen showing live cart items, totals, change, and loyalty QR.',
          tag: 'شاشات ذكية'
        },
        {
          icon: Zap,
          titleAr: 'شاشة المطبخ (KDS) وجهاز النادل المتنقل',
          titleEn: 'Kitchen Display System & Mobile Waiter',
          descAr: 'إرسال طلبات الطاولات للمطبخ فورياً مع الملاحظات وتنظيم التحضير للأطعمة والمشروبات.',
          descEn: 'Instant kitchen order routing with notes, preparation timers, and mobile waiter ordering.',
          tag: 'مطاعم وكافيهات'
        }
      ]
    },
    {
      id: 'v2.2.0',
      version: 'v2.2.0',
      date: 'مايو 2026',
      titleAr: 'نشرة أسعار الصرف الحية والنسخ السحابي مع Google Drive',
      titleEn: 'Live Exchange Bulletin & Google Drive Cloud Backup',
      summaryAr: 'شريط مباشر لأسعار صرف العملات والذهب، والنسخ السحابي التلقائي الآمن مع حساب Google Drive.',
      summaryEn: 'Real-time currency & gold rate bulletin, multi-currency conversion, and Google Drive auto-backup.',
      category: 'security',
      badgeAr: 'المالية والسحاب ☁️',
      badgeEn: 'Finance & Cloud ☁️',
      badgeColor: 'bg-teal-500/20 text-teal-700 dark:text-teal-300',
      features: [
        {
          icon: Coins,
          titleAr: 'شريط ونشرة أسعار الصرف الحية للعملات والذهب',
          titleEn: 'Live Exchange Rate Bulletin Bar',
          descAr: 'عرض دائم لأسعار شراء ومبيع الدولار واليورو وغرام الذهب 21 مع إمكانية تحويل الأسعار والفواتير بنقرة واحدة.',
          descEn: 'Sticky bulletin showing live USD, EUR, and 21K gold rates with one-click store recalculation.',
          tag: 'عملات وصرف'
        },
        {
          icon: Cloud,
          titleAr: 'النسخ الاحتياطي السحابي التلقائي مع Google Drive',
          titleEn: 'Google Drive Automated Cloud Backup',
          descAr: 'مزامنة وحفظ نسخة احتياطية مشفرة من قاعدة البيانات على حساب Google Drive الخاص بصاحب العمل مع استعادة سريعة.',
          descEn: 'Secure encrypted cloud backup to merchant’s Google Drive account with scheduled backups.',
          tag: 'نسخ سحابي',
          actionLabelAr: 'إعدادات النسخ السحابي',
          actionLabelEn: 'Backup Settings',
          onAction: (a) => a.setActiveTab('settings')
        },
        {
          icon: ShieldCheck,
          titleAr: 'التبديل السريع بكلمة المرور PIN وورديات الكاشير',
          titleEn: 'Fast PIN Switch & Shift Management',
          descAr: 'تبديل سريع بين الموظفين والكاشيرية برمز سري من 4 أرقام مع قفل تلقائي عند الخمول وصلاحيات دقيقة.',
          descEn: '4-digit quick PIN login for cashiers with role-based permissions and auto-lock timer.',
          tag: 'أمان وصلاحيات'
        }
      ]
    },
    {
      id: 'v2.0.0',
      version: 'v2.0.0',
      date: 'مارس 2026',
      titleAr: 'أوضاع التشغيل الثلاثة (تجزئة، مطاعم، جملة) ونقاط الولاء',
      titleEn: 'Tri-Mode Engine (Retail, Dining, Wholesale) & Loyalty Cards',
      summaryAr: 'نظام تشغيل ثلاثي مخصص للمحلات والمطاعم والجملة مع بطاقات ولاء رقمية وقاعدة بيانات محلية فائق السرعة.',
      summaryEn: 'Tri-mode specialized POS engine, digital loyalty points cards, and ultra-fast local database.',
      category: 'pos',
      badgeAr: 'الإصدار التأسيسي 🚀',
      badgeEn: 'Foundation Release 🚀',
      badgeColor: 'bg-amber-600/20 text-amber-800 dark:text-amber-300',
      features: [
        {
          icon: Layers,
          titleAr: 'وضعيات التشغيل المتخصصة: تجزئة / مطاعم / جملة',
          titleEn: 'Specialized Business Operating Modes',
          descAr: 'واجهة مخصصة تتكيف تلقائياً مع نوع نشاطك: إدارة الطاولات للمطاعم، بيع بالباركود للتجزئة، وبيع بالطرود للجملة.',
          descEn: 'Tailored workflows adapting to your store type: table seating, fast barcode retail, or wholesale packaging.',
          tag: 'محرك الكاشير'
        },
        {
          icon: Sparkles,
          titleAr: 'بطاقات ولاء العملاء الذكية ونظام النقاط والمكافآت',
          titleEn: 'Digital Loyalty Membership & Points System',
          descAr: 'بطاقات ولاء رقمية برمز QR لكل زبين تمنح نقاطاً عند كل عملية شراء مع إمكانية استبدالها بخصومات نقدية.',
          descEn: 'QR loyalty cards for customers earning points on purchases redeemable for cash discounts.',
          tag: 'ولاء الزبائن'
        },
        {
          icon: Database,
          titleAr: 'قاعدة بيانات محلية تعمل بدون إنترنت بنسبة 100% (Offline-First)',
          titleEn: '100% Offline-First IndexedDB Engine',
          descAr: 'تخزين آمن ومحلي لكافة المنتجات والفواتير والمبيعات في جهازك لضمان عدم توقف البيع إطلاقاً عند انقطاع الإنترنت.',
          descEn: 'High-speed local IndexedDB storage keeping your register operational 24/7 with zero downtime.',
          tag: 'سرعة وأمان'
        }
      ]
    }
  ];

  // Filtering changelog
  const filteredChangelog = useMemo(() => {
    return changelogData.filter(item => {
      // Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        // check if any feature matches category
        const matchesFeature = item.features.some(f => {
          if (selectedCategory === 'currency') return f.tag.includes('عملات') || f.tag.includes('مالية');
          if (selectedCategory === 'pos') return f.tag.includes('كاشير') || f.tag.includes('مخزون') || f.tag.includes('ولاء');
          if (selectedCategory === 'ui_buttons') return f.tag.includes('تخصيص') || f.tag.includes('واجهة');
          if (selectedCategory === 'devices') return f.tag.includes('طابعات') || f.tag.includes('شاشات') || f.tag.includes('أجهزة');
          if (selectedCategory === 'wholesale') return f.tag.includes('جملة') || f.tag.includes('مخازن');
          if (selectedCategory === 'security') return f.tag.includes('أمان') || f.tag.includes('سحابي');
          return false;
        });
        if (!matchesFeature) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = item.titleAr.toLowerCase().includes(query) || item.titleEn.toLowerCase().includes(query);
        const matchesSummary = item.summaryAr.toLowerCase().includes(query) || item.summaryEn.toLowerCase().includes(query);
        const matchesVersion = item.version.toLowerCase().includes(query);
        const matchesFeatures = item.features.some(f =>
          f.titleAr.toLowerCase().includes(query) ||
          f.titleEn.toLowerCase().includes(query) ||
          f.descAr.toLowerCase().includes(query) ||
          f.descEn.toLowerCase().includes(query) ||
          f.tag.toLowerCase().includes(query)
        );
        return matchesTitle || matchesSummary || matchesVersion || matchesFeatures;
      }

      return true;
    });
  }, [selectedCategory, searchQuery]);

  const copyChangelogSummary = () => {
    const text = changelogData
      .map(item => `📌 ${item.version} (${item.date}):\n${item.titleAr}\n${item.summaryAr}\n• ` + item.features.map(f => f.titleAr).join('\n• '))
      .join('\n\n====================\n\n');

    navigator.clipboard.writeText(text);
    notify(
      language === 'ar' ? 'تم نسخ سجل التحسينات والإضافات إلى الحافظة 📋' : 'Changelog copied to clipboard 📋',
      language === 'ar' ? 'يمكنك الآن مشاركة ملخص التحديثات أو حفظه' : 'You can now share or paste the release notes',
      'success'
    );
  };

  return (
    <div className="flex-1 p-3 sm:p-6 overflow-y-auto space-y-6 bg-slate-50/50 dark:bg-slate-950 flex flex-col items-center">
      {/* Brand Hero Card */}
      <div className="max-w-4xl w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xl overflow-hidden p-5 sm:p-7 space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-5 border-b border-slate-100 dark:border-slate-800 pb-6 text-center sm:text-start">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-amber-600 to-amber-500 text-slate-950 flex items-center justify-center font-black text-3xl sm:text-4xl shadow-xl shadow-amber-500/25 shrink-0">
              K
            </div>
            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  KIAN CASHIER — كيان كاشير
                </h2>
                <span className="text-[11px] font-mono font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-2.5 py-0.5 rounded-full">
                  الإصدار v2.5.4 Pro
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-lg leading-relaxed">
                نظام نقاط بيع سحابي ومحلي متكامل مصمم للمتاجر، المطاعم، والمستودعات بأعلى معايير السرعة، مع دعم العملات المتعددة والتحكم الكامل بالواجهة.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsButtonCustomizerModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
              title="تخصيص وترتيب أزرار الواجهة"
            >
              <Sliders className="w-4 h-4" />
              <span>{language === 'ar' ? 'تخصيص الأزرار 🎛️' : 'Customize Buttons'}</span>
            </button>

            <button
              type="button"
              onClick={copyChangelogSummary}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all cursor-pointer border border-slate-200/80 dark:border-slate-700/80"
              title="نسخ سجل التحديثات"
            >
              <Copy className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">نسخ السجل</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-center">
            <p className="text-lg font-black text-amber-600 dark:text-amber-400">45+</p>
            <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300">ميزة وتحسين متطور</p>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-center">
            <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">6</p>
            <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300">إصدارات دورية موثقة</p>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-center">
            <p className="text-lg font-black text-blue-600 dark:text-blue-400">100%</p>
            <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300">يعمل بدون إنترنت</p>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-center">
            <p className="text-lg font-black text-purple-600 dark:text-purple-400">LBP / SYP / $</p>
            <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300">متعدد العملات وأسعار الصرف</p>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveSubTab('changelog')}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeSubTab === 'changelog'
                ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>سجل التحسينات والإضافات الدورية</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded-full font-mono bg-black/10 dark:bg-white/20">
              {changelogData.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('buttons')}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeSubTab === 'buttons'
                ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>تخصيص وترتيب الأزرار</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('specs')}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeSubTab === 'specs'
                ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>إمكانيات وميزات النظام</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('developer')}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeSubTab === 'developer'
                ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>المطور والترخيص</span>
          </button>
        </div>

        {/* SUBTAB 1: CHANGELOG & IMPROVEMENTS LOG (REQUESTED FEATURE) */}
        {activeSubTab === 'changelog' && (
          <div className="space-y-5 text-start">
            {/* Search and Category Filter Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute start-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث في سجل التحديثات والتحسينات (مثل: لبنان، بطارية، أزرار، طابعة)..."
                  className="w-full ps-9 pe-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/50"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute end-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    مسح
                  </button>
                )}
              </div>

              {/* Category pills */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                {[
                  { id: 'all', label: 'الكل' },
                  { id: 'currency', label: 'العملات 💰' },
                  { id: 'pos', label: 'الكاشير 🛒' },
                  { id: 'ui_buttons', label: 'الأزرار 🎛️' },
                  { id: 'devices', label: 'الأجهزة 🖨️' },
                  { id: 'wholesale', label: 'الجملة 📦' },
                  { id: 'security', label: 'الأمان 🛡️' }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                      selectedCategory === cat.id
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Releases Timeline */}
            <div className="space-y-4">
              {filteredChangelog.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-400 space-y-2">
                  <Sparkles className="w-8 h-8 mx-auto text-slate-400 opacity-60" />
                  <p className="text-xs font-bold">لا توجد نتائج تطابق بحثك</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                    }}
                    className="text-xs text-amber-600 dark:text-amber-400 font-bold hover:underline"
                  >
                    إعادة ضبط التصفية
                  </button>
                </div>
              ) : (
                filteredChangelog.map((item) => {
                  const isExpanded = expandedVersions[item.id] !== false;

                  return (
                    <div
                      key={item.id}
                      className={`rounded-2xl border transition-all overflow-hidden ${
                        item.isLatest
                          ? 'border-amber-500/80 bg-gradient-to-b from-amber-50/30 to-white dark:from-amber-950/20 dark:to-slate-900 shadow-md'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                      }`}
                    >
                      {/* Version Header Bar */}
                      <div
                        onClick={() => toggleVersionExpand(item.id)}
                        className="p-4 sm:p-5 flex items-start sm:items-center justify-between gap-3 cursor-pointer select-none hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <div className="flex items-start sm:items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-xs ${
                              item.isLatest
                                ? 'bg-amber-500 text-slate-950'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <Sparkles className="w-5 h-5" />
                          </div>

                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                                {item.version} — {language === 'ar' ? item.titleAr : item.titleEn}
                              </h3>
                              <span
                                className={`text-[10px] font-black px-2 py-0.5 rounded-full ${item.badgeColor}`}
                              >
                                {language === 'ar' ? item.badgeAr : item.badgeEn}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              {language === 'ar' ? item.summaryAr : item.summaryEn}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                            {item.date}
                          </span>
                          <button
                            type="button"
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                            aria-label="توسيع أو طي"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Expanded Feature List */}
                      {isExpanded && (
                        <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 border-t border-slate-100 dark:border-slate-800/80 space-y-3 mt-1">
                          <div className="pt-3 grid grid-cols-1 gap-2.5">
                            {item.features.map((feat, idx) => {
                              const FeatIcon = feat.icon;

                              return (
                                <div
                                  key={idx}
                                  className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-amber-400/50 transition-colors"
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                                      <FeatIcon className="w-4 h-4" />
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <h4 className="text-xs font-black text-slate-900 dark:text-white">
                                          {language === 'ar' ? feat.titleAr : feat.titleEn}
                                        </h4>
                                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                          {feat.tag}
                                        </span>
                                      </div>
                                      <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                                        {language === 'ar' ? feat.descAr : feat.descEn}
                                      </p>
                                    </div>
                                  </div>

                                  {feat.actionLabelAr && feat.onAction && (
                                    <button
                                      type="button"
                                      onClick={() => feat.onAction?.(app)}
                                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-700 dark:text-slate-200 font-black text-xs border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shrink-0 shadow-2xs self-end sm:self-auto"
                                    >
                                      <span>
                                        {language === 'ar' ? feat.actionLabelAr : feat.actionLabelEn}
                                      </span>
                                      <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* SUBTAB 2: BUTTON POSITION CUSTOMIZATION QUICK LAUNCH */}
        {activeSubTab === 'buttons' && (
          <div className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 text-start space-y-5">
            <div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white">
                تخصيص وترتيب أزرار الواجهة والنظام
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                يمكنك تخصيص موضع لوحة السلة (يمين أو يسار الشاشة لتناسب اليد اليمنى واليسرى)، وإعادة ترتيب أدوات الكاشير، والشريط العلوي، والزر العائم.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="text-2xl">🖐️</span>
                <h5 className="text-xs font-black text-slate-900 dark:text-white">
                  وضع اليد اليسرى (Left-Handed)
                </h5>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  ينقل السلة بالكامل لليسار ويعكس أزرار المحاسبة لتسهيل العمل باليد اليسرى.
                </p>
                <button
                  type="button"
                  onClick={() => app.applyButtonLayoutPreset('left_handed')}
                  className="w-full mt-2 py-1.5 px-3 rounded-lg bg-amber-500/10 hover:bg-amber-500 text-amber-800 hover:text-slate-950 font-black text-xs transition-colors cursor-pointer"
                >
                  تفعيل وضع الأعسر الآن
                </button>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="text-2xl">🎯</span>
                <h5 className="text-xs font-black text-slate-900 dark:text-white">
                  الوضع القياسي الافتراضي (Standard)
                </h5>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  السلة على اليمين مع أزرار الأدوات المتكاملة والزر العائم أسفل اليمين.
                </p>
                <button
                  type="button"
                  onClick={() => app.applyButtonLayoutPreset('standard')}
                  className="w-full mt-2 py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer"
                >
                  تفعيل الوضع القياسي
                </button>
              </div>
            </div>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setIsButtonCustomizerModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <Sliders className="w-4 h-4" />
                <span>فتح نافذة التحكم والترتيب الكامل لجميع الأزرار 🎛️</span>
              </button>
            </div>
          </div>
        )}

        {/* SUBTAB 3: SYSTEM CAPABILITIES & SPECS */}
        {activeSubTab === 'specs' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-start">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/70 dark:border-slate-700/70 space-y-2">
              <Smartphone className="w-5 h-5 text-amber-500" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">يعمل على كل الشاشات</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                متوافق بالكامل مع أجهزة الكمبيوتر، شاشات اللمس الكبيرة، التابلت، وهواتف الكاشير الذكية.
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/70 dark:border-slate-700/70 space-y-2">
              <Zap className="w-5 h-5 text-amber-500" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">بدون إنترنت 100%</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                قاعدة بيانات محلية متقدمة في المتصفح تحفظ البيانات فورياً وتزامن مع السحابة عند توفر الشبكة.
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/70 dark:border-slate-700/70 space-y-2">
              <Coins className="w-5 h-5 text-amber-500" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">نشرة أسعار الصرف الحية</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                دعم كامل لليرة اللبنانية، الليرة السورية، الدولار، واليورو مع حساب الباقي المزدوج.
              </p>
            </div>
          </div>
        )}

        {/* SUBTAB 4: DEVELOPER & LICENSE */}
        {activeSubTab === 'developer' && (
          <div className="space-y-4 text-start">
            <div className="p-5 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-slate-100/50 dark:from-amber-950/40 dark:to-slate-800/40 rounded-2xl border border-amber-500/30 space-y-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                  معلومات المطور والترخيص
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-amber-500/20">
                <div>
                  <p className="text-sm font-black text-slate-900 dark:text-white">
                    تطوير وهندسة النظم: <span className="text-amber-600 dark:text-amber-400">عدي الزعبي</span>
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                    Software & POS Solutions Engineer
                  </p>
                </div>

                <a
                  href="https://instagram.com/o-xtr8"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-600 text-white font-bold text-xs shadow-xs hover:opacity-95 transition-opacity self-start sm:self-auto"
                >
                  <Instagram className="w-4 h-4" />
                  <span className="font-mono">o-xtr8</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Copyright notice */}
        <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
          جميع الحقوق محفوظة © {new Date().getFullYear()} KIAN CASHIER POS — كيان كاشير.
        </div>
      </div>
    </div>
  );
};
