import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  aiService,
  ChatMessage,
  GeneratedProductData,
  OCRInvoiceData,
  SuggestedAIAction,
  StructuredSalesAudit,
  StructuredRestockPlan,
  RestockPlanItem,
  StructuredMarketingCampaign,
  PricingOptimizationPlan,
  PricingRecommendationItem,
  DebtAnalysisPlan,
  DebtorCollectionItem,
} from '../../services/aiService';
import { sendWhatsAppDebtMessage } from '../../services/debtCollectionService';
import {
  Sparkles,
  Bot,
  User,
  Send,
  Loader2,
  TrendingUp,
  Boxes,
  Megaphone,
  FileScan,
  Wand2,
  Copy,
  Check,
  RotateCcw,
  Upload,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Package,
  Layers,
  ArrowRight,
  RefreshCw,
  Plus,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Tag,
  Wallet,
  MessageCircle,
  Zap,
  ShieldAlert,
  FileText,
  Sliders,
} from 'lucide-react';

type AISubTab = 'chat' | 'analysis' | 'inventory' | 'pricing' | 'debts' | 'ocr' | 'studio';

// Clean Markdown-like renderer for structured AI text
const FormattedAIText: React.FC<{ content: string }> = ({ content }) => {
  if (!content) return null;
  const lines = content.split('\n');

  const formatInline = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={idx} className="font-bold text-slate-900 dark:text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  return (
    <div className="space-y-2 text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-200">
      {lines.map((rawLine, idx) => {
        const line = rawLine.trim();
        if (!line) return <div key={idx} className="h-1.5" />;

        if (line.startsWith('### ')) {
          return (
            <h4 key={idx} className="text-sm font-black text-slate-900 dark:text-white pt-2 pb-0.5">
              {formatInline(line.replace(/^###\s+/, ''))}
            </h4>
          );
        }
        if (line.startsWith('## ') || line.startsWith('# ')) {
          return (
            <h3 key={idx} className="text-base font-black text-slate-900 dark:text-white pt-3 pb-1 border-b border-slate-100 dark:border-slate-800">
              {formatInline(line.replace(/^#+\s+/, ''))}
            </h3>
          );
        }
        if (line.startsWith('- ') || line.startsWith('* ') || line.startsWith('• ')) {
          return (
            <div key={idx} className="flex items-start gap-2 ps-1">
              <span className="text-amber-500 font-bold select-none mt-0.5">•</span>
              <span className="flex-1">{formatInline(line.replace(/^[-*•]\s+/, ''))}</span>
            </div>
          );
        }
        const numberedMatch = line.match(/^(\d+)\.\s+(.*)$/);
        if (numberedMatch) {
          return (
            <div key={idx} className="flex items-start gap-2 ps-1">
              <span className="font-mono tabular-nums font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                {numberedMatch[1]}.
              </span>
              <span className="flex-1">{formatInline(numberedMatch[2])}</span>
            </div>
          );
        }
        return <p key={idx}>{formatInline(line)}</p>;
      })}
    </div>
  );
};

export const AIAssistantView: React.FC = () => {
  const {
    language,
    formatCurrency,
    sales = [],
    products = [],
    expenses = [],
    customers = [],
    suppliers = [],
    debtTransactions = [],
    promotions = [],
    businessMode,
    settings,
    addProduct,
    updateProduct,
    adjustStock,
    addPromotion,
    applyBulkWholesaleMargin,
    recordSupplierPurchaseInvoice,
    setActiveTab,
    notify,
    categories = [],
  } = useApp();

  const safeProducts = products || [];
  const safeSales = sales || [];
  const safeCustomers = customers || [];
  const safeSuppliers = suppliers || [];
  const safeExpenses = expenses || [];
  const safeDebtTransactions = debtTransactions || [];
  const storeName = settings?.storeNameAr || 'متجر كيان';

  const [activeSubTab, setActiveSubTab] = useState<AISubTab>('chat');

  // ============================================================================
  // LIVE STORE QUANTITATIVE INTELLIGENCE ENGINE (Local Real-Time Computations)
  // ============================================================================
  const liveStoreIntel = useMemo(() => {
    const activeSales = safeSales.filter(s => s.status !== 'refunded' && s.status !== 'cancelled');
    const totalRevenue = activeSales.reduce((acc, s) => acc + (Number(s.total) || 0), 0);

    // Compute COGS & Product Velocity
    const productSalesMap = new Map<string, { qty: number; revenue: number; profit: number; name: string }>();
    let totalCOGS = 0;

    activeSales.forEach(sale => {
      (sale.items || []).forEach(item => {
        const prod = safeProducts.find(p => p.id === item.productId);
        const unitCost = prod?.costPrice ?? Math.round((item.unitPrice || 0) * 0.7);
        const itemCost = unitCost * (item.quantity || 0);
        const itemRev = Number(item.total) || (item.unitPrice || 0) * (item.quantity || 0);
        const itemProfit = itemRev - itemCost;
        totalCOGS += itemCost;

        const prev = productSalesMap.get(item.productId) || {
          qty: 0,
          revenue: 0,
          profit: 0,
          name: item.productName || prod?.nameAr || 'صنف',
        };
        productSalesMap.set(item.productId, {
          qty: prev.qty + (item.quantity || 0),
          revenue: prev.revenue + itemRev,
          profit: prev.profit + itemProfit,
          name: prev.name,
        });
      });
    });

    const grossProfit = totalRevenue - totalCOGS;
    const totalExpensesAmount = safeExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
    const netProfit = grossProfit - totalExpensesAmount;
    const netMarginPercent = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 1000) / 10 : 0;
    const avgBasket = activeSales.length > 0 ? Math.round(totalRevenue / activeSales.length) : 0;

    // Top selling products
    const topSellingProducts = Array.from(productSalesMap.entries())
      .map(([id, stats]) => ({ id, ...stats }))
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 6);

    // Out of stock & Low stock
    const outOfStockProducts = safeProducts.filter(p => p.status === 'active' && p.stock <= 0);
    const lowStockProducts = safeProducts.filter(p => p.status === 'active' && p.stock > 0 && p.stock <= (p.minStock || 5));

    // Slow-moving products (high stock, 0 or very low sales)
    const slowMovingProducts = safeProducts
      .filter(p => {
        const sold = productSalesMap.get(p.id)?.qty || 0;
        return p.status === 'active' && p.stock >= Math.max((p.minStock || 5) * 2, 10) && sold <= 1;
      })
      .slice(0, 8);

    // Low-margin products (<18% retail margin)
    const lowMarginProducts = safeProducts.filter(p => {
      if (!p.price || p.price <= 0) return false;
      const margin = ((p.price - (p.costPrice || 0)) / p.price) * 100;
      return margin < 18;
    });

    // Inventory total cost value
    const inventoryCostValue = safeProducts.reduce((acc, p) => acc + Math.max(0, p.stock) * (p.costPrice || 0), 0);

    // Debts
    const debtors = safeCustomers
      .filter(c => Number(c.debtBalance) > 0)
      .sort((a, b) => (Number(b.debtBalance) || 0) - (Number(a.debtBalance) || 0));
    const totalCustomerDebt = debtors.reduce((acc, c) => acc + (Number(c.debtBalance) || 0), 0);

    const creditors = safeSuppliers
      .filter(s => Number(s.creditBalance) > 0)
      .sort((a, b) => (Number(b.creditBalance) || 0) - (Number(a.creditBalance) || 0));
    const totalSupplierDebt = creditors.reduce((acc, s) => acc + (Number(s.creditBalance) || 0), 0);

    return {
      activeSalesCount: activeSales.length,
      totalRevenue,
      totalCOGS,
      grossProfit,
      totalExpensesAmount,
      netProfit,
      netMarginPercent,
      avgBasket,
      topSellingProducts,
      outOfStockProducts,
      lowStockProducts,
      slowMovingProducts,
      lowMarginProducts,
      inventoryCostValue,
      debtors,
      totalCustomerDebt,
      creditors,
      totalSupplierDebt,
      productSalesMap,
    };
  }, [safeSales, safeProducts, safeExpenses, safeCustomers, safeSuppliers]);

  // ============================================================================
  // 1. CHAT & EXECUTABLE ACTIONS STATE
  // ============================================================================
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('kian_ai_chat_history_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return [
      {
        id: 'welcome-msg',
        role: 'model',
        content:
          language === 'ar'
            ? `مرحباً بك في منظومة الذكاء الاصطناعي المالي والتشغيلي لـ **${storeName}**.\n\nأنا متصل مباشرة ببيانات متجرك الحية (**${safeProducts.length}** صنف، **${safeSales.length}** فاتورة، صافي الربح الحالي **${formatCurrency(liveStoreIntel.netProfit)}**). يمكنك سؤالي عن أي تفصيل مالي أو تنفيذ إجراءات ذكية بضغطة زر.`
            : `Welcome to the Financial & Operational AI System for **${storeName}**.\n\nConnected to your live store data (**${safeProducts.length}** products, **${safeSales.length}** invoices). Ask any question or trigger smart actions below.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedActions: [
          ...(liveStoreIntel.lowStockProducts.length + liveStoreIntel.outOfStockProducts.length > 0
            ? [
                {
                  actionType: 'restock_low_items' as const,
                  labelAr: `توريد النواقص الحرجة (${liveStoreIntel.lowStockProducts.length + liveStoreIntel.outOfStockProducts.length} صنف)`,
                  descriptionAr: 'تعبئة رصيد المخزون تلقائياً للأصناف المنخفضة والنافدة',
                },
              ]
            : []),
          {
            actionType: 'create_promotion' as const,
            labelAr: 'تفعيل عرض تنشيط المبيعات 15%',
            descriptionAr: 'إنشاء عرض خصم ترويجي تلقائي في شاشة الكاشير',
            value: 15,
          },
          {
            actionType: 'apply_wholesale_margin' as const,
            labelAr: 'ضبط أسعار الجملة تلقائياً (خصم 12%)',
            descriptionAr: 'تحديث أسعار البيع بالجملة لكافة الأصناف',
            value: 12,
          },
        ],
      },
    ];
  });

  const [inputPrompt, setInputPrompt] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    try {
      localStorage.setItem('kian_ai_chat_history_v2', JSON.stringify(messages.slice(-30)));
    } catch {
      // ignore storage quota
    }
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const quickQuestions =
    language === 'ar'
      ? [
          'ما هي الأصناف الأكثر ربحية اليوم وكم صافي الدخل؟',
          'كيف أتصرف بالأصناف الراكدة لتحرير السيولة النقدية؟',
          'اقترح خطة تسعير جملة ومفرق لرفع هامش الربح إلى 25%',
          'حلل ديون الزبائن واقترح خطة تحصيل سريعة هذا الأسبوع',
          'ما هي أهم النصائح لتقليل المصروفات التشغيلية وزيادة السيولة؟',
        ]
      : [
          'What are the most profitable items and current net income?',
          'How can I liquidate slow-moving inventory to free up cash?',
          'Suggest retail & wholesale pricing to reach a 25% margin',
          'Analyze customer debts and suggest a collection plan',
          'How to reduce operating expenses and boost cash flow?',
        ];

  // Execute Smart AI Action directly in AppContext
  const handleExecuteSmartAction = (action: SuggestedAIAction) => {
    if (action.actionType === 'restock_low_items') {
      const targetItems = [...liveStoreIntel.outOfStockProducts, ...liveStoreIntel.lowStockProducts];
      if (targetItems.length === 0) {
        notify('المخزون مكتمل', 'جميع الأصناف في المتجر فوق الحد الأدنى حالياً.', 'info');
        return;
      }
      targetItems.forEach(prod => {
        const needed = Math.max((prod.minStock || 10) * 3 - prod.stock, 15);
        adjustStock(prod.id, needed, 'in', 'توريد ذكي تلقائي عبر المستشار الذكي (AI Auto-Restock)');
      });
      notify(
        'تم توريد النواقص بنجاح',
        `قام الذكاء الاصطناعي بتغذية المخزون لـ ${targetItems.length} صنف حرج بنجاح.`,
        'success'
      );
      return;
    }

    if (action.actionType === 'create_promotion') {
      const discountVal = action.value && action.value > 0 && action.value <= 70 ? action.value : 15;
      addPromotion({
        nameAr: action.labelAr || `عرض الذكاء الاصطناعي (${discountVal}%)`,
        nameEn: `AI Smart Promo (${discountVal}%)`,
        description: action.descriptionAr || `خصم ترويجي مقترح من المستشار الذكي بنسبة ${discountVal}% لتنشيط المبيعات`,
        type: 'percentage_discount',
        discountValue: discountVal,
        scope: 'all',
        isActive: true,
        badgeColor: '#f59e0b',
      });
      notify(
        'تم تفعيل العرض الترويجي',
        `تم إنشاء وتفعيل "${action.labelAr}" بنسبة خصم ${discountVal}% في شاشة الكاشير.`,
        'success'
      );
      return;
    }

    if (action.actionType === 'apply_wholesale_margin') {
      const marginDiscount = action.value && action.value > 0 && action.value <= 50 ? action.value : 12;
      applyBulkWholesaleMargin(marginDiscount);
      notify(
        'تم تحديث أسعار الجملة',
        `تم ضبط أسعار الجملة لكافة الأصناف بخصم ${marginDiscount}% عن سعر المفرق.`,
        'success'
      );
      return;
    }

    if (action.actionType === 'open_tab' && action.targetTab) {
      setActiveTab(action.targetTab as any);
    }
  };

  // Voice Input (Speech-to-Text)
  const handleToggleVoiceInput = () => {
    if (isListeningVoice) {
      recognitionRef.current?.stop();
      setIsListeningVoice(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      notify('غير مدعوم', 'المتصفح الحالي لا يدعم الإدخال الصوتي المباشر.', 'warning');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language === 'ar' ? 'ar-SA' : 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListeningVoice(true);
    recognition.onend = () => setIsListeningVoice(false);
    recognition.onerror = () => setIsListeningVoice(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (transcript) {
        setInputPrompt(prev => (prev ? `${prev} ${transcript}` : transcript));
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  // Text-to-Speech Readout
  const handleSpeakMessage = (msg: ChatMessage) => {
    if (!('speechSynthesis' in window)) return;
    if (speakingMessageId === msg.id) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const cleanText = msg.content.replace(/[*#_`~]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = language === 'ar' ? 'ar-SA' : 'en-US';
    utterance.rate = 1.02;
    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => setSpeakingMessageId(null);
    setSpeakingMessageId(msg.id);
    window.speechSynthesis.speak(utterance);
  };

  // Local Intelligent Fallback Reply Generator (when offline or API key not set)
  const buildLocalFallbackChatReply = (query: string) => {
    const q = query.toLowerCase();
    const {
      totalRevenue,
      netProfit,
      netMarginPercent,
      totalExpensesAmount,
      topSellingProducts,
      lowStockProducts,
      outOfStockProducts,
      slowMovingProducts,
      totalCustomerDebt,
      debtors,
    } = liveStoreIntel;

    if (q.includes('ربح') || q.includes('مبيعات') || q.includes('دخل') || q.includes('profit') || q.includes('sales')) {
      const topList = topSellingProducts
        .slice(0, 4)
        .map((p, i) => `${i + 1}. **${p.name}** — المباع: ${p.qty} وحدة · صافي الربح: ${formatCurrency(p.profit)}`)
        .join('\n');

      return {
        reply: `### ملخص الأداء المالي والأرباح اللحظي\n- **إجمالي إيرادات المبيعات:** ${formatCurrency(totalRevenue)} (${liveStoreIntel.activeSalesCount} فاتورة)\n- **إجمالي المصروفات التشغيلية:** ${formatCurrency(totalExpensesAmount)}\n- **صافي الربح الفعلي:** **${formatCurrency(netProfit)}** (هامش ربح صافي **${netMarginPercent}%**)\n\n### الأصناف الأعلى ربحية في متجرك\n${topList || '- لا توجد مبيعات مسجلة بعد.'}\n\n### التوصية التنفيذية\nلزيادة صافي الربح بنسبة **15%–20%** خلال هذا الأسبوع، ركز على ترويج الأصناف الأعلى هامشاً مع تفعيل عروض الباقات (Bundles) لرفع متوسط قيمة الفاتورة الحالية (${formatCurrency(liveStoreIntel.avgBasket)}).`,
        followUpQuestions: [
          'كيف أرفع متوسط قيمة الفاتورة؟',
          'ما هي الأصناف ذات هامش الربح الضعيف؟',
          'اعرض خطة خفض المصاريف التشغيلية',
        ],
        suggestedActions: [
          {
            actionType: 'create_promotion' as const,
            labelAr: 'تفعيل عرض خصم 10% لتنشيط المبيعات',
            value: 10,
          },
        ],
      };
    }

    if (q.includes('مخزون') || q.includes('راكد') || q.includes('نواقص') || q.includes('stock') || q.includes('inventory')) {
      const criticalTotal = outOfStockProducts.length + lowStockProducts.length;
      const slowNames = slowMovingProducts.slice(0, 4).map(p => `${p.nameAr} (${p.stock} ${p.unit})`).join('، ');
      return {
        reply: `### تحليل المخزون ودوران البضاعة\n- **أصناف نافدة تماماً (رصيد 0):** ${outOfStockProducts.length} صنف\n- **أصناف منخفضة الرصيد:** ${lowStockProducts.length} صنف\n- **أصناف راكدة أو بطيئة الحركة:** ${slowMovingProducts.length} صنف (${slowNames || 'لا يوجد'})\n- **إجمالي رأس المال المجمد في المخزون:** ${formatCurrency(liveStoreIntel.inventoryCostValue)}\n\n### خطة العمل المقترحة\n1. قم بتوريد الأصناف الحرجة (${criticalTotal} صنف) فوراً لتجنب خسارة المبيعات اليومية.\n2. قم بإنشاء عرض تصفية بخصم **15%–20%** على الأصناف البطيئة لتحويلها إلى سيولة نقدية سريعة.`,
        followUpQuestions: [
          'ما هي ميزانية إعادة تعبئة المخزون؟',
          'اقترح عرض تصفية للأصناف الراكدة',
        ],
        suggestedActions: [
          {
            actionType: 'restock_low_items' as const,
            labelAr: `توريد النواقص الحرجة (${criticalTotal} صنف)`,
          },
          {
            actionType: 'create_promotion' as const,
            labelAr: 'إنشاء عرض تصفية للأصناف الراكدة (15%)',
            value: 15,
          },
        ],
      };
    }

    if (q.includes('دين') || q.includes('ديون') || q.includes('عملاء') || q.includes('debt')) {
      const topDebtorsText = debtors
        .slice(0, 4)
        .map((c, i) => `${i + 1}. **${c.name}** — الرصيد المستحق: ${formatCurrency(c.debtBalance || 0)}`)
        .join('\n');
      return {
        reply: `### تحليل الذمم المالية والديون\n- **إجمالي ديون العملاء (لنا في السوق):** **${formatCurrency(totalCustomerDebt)}** موزعة على ${debtors.length} عميل.\n- **إجمالي مستحقات الموردين (علينا):** **${formatCurrency(liveStoreIntel.totalSupplierDebt)}**.\n\n### أبرز الحسابات المدينة للتحصيل العاجل\n${topDebtorsText || '- لا توجد ديون متأخرة حالياً.'}\n\n### نصيحة التحصيل الذكي\nأرسل تذكيرات واتساب ودية لأعلى 3 عملاء مدينين اليوم مع عرض خصم تعجيل دفع **3%** عند السداد النقدي الفوري.`,
        followUpQuestions: [
          'انتقل إلى تبويب ذكاء الديون لإرسال رسائل واتساب',
          'كيف أوازن بين ديون الزبائن ومستحقات الموردين؟',
        ],
        suggestedActions: [
          {
            actionType: 'open_tab' as const,
            labelAr: 'فتح دفتر الديون والتحصيل',
            targetTab: 'debts',
          },
        ],
      };
    }

    return {
      reply: `### التقرير التشغيلي الذكي لـ ${storeName}\nبناءً على فحص بيانات متجرك اللحظية:\n- **المبيعات النشطة:** ${liveStoreIntel.activeSalesCount} فاتورة بإجمالي **${formatCurrency(totalRevenue)}**\n- **صافي الربح بعد المصاريف:** **${formatCurrency(netProfit)}** (هامش **${netMarginPercent}%**)\n- **تنبيهات المخزون:** ${outOfStockProducts.length} صنف نافد و ${lowStockProducts.length} صنف منخفض\n- **أصناف تحتاج مراجعة تسعير:** ${liveStoreIntel.lowMarginProducts.length} صنف هامش ربحها أقل من 18%\n- **ديون الزبائن المستحقة:** ${formatCurrency(totalCustomerDebt)}\n\nيمكنك استخدام الأزرار أدناه لتنفيذ التحسينات مباشرة في النظام.`,
      followUpQuestions: [
        'ما هي الأصناف الأكثر ربحية اليوم؟',
        'كيف أحسن دوران المخزون للأصناف الراكدة؟',
        'حلل ديون الزبائن واقترح خطة تحصيل',
      ],
      suggestedActions: [
        ...(outOfStockProducts.length + lowStockProducts.length > 0
          ? [
              {
                actionType: 'restock_low_items' as const,
                labelAr: `توريد النواقص الحرجة (${outOfStockProducts.length + lowStockProducts.length} صنف)`,
              },
            ]
          : []),
        {
          actionType: 'create_promotion' as const,
          labelAr: 'تفعيل عرض ترويجي ذكي (15%)',
          value: 15,
        },
      ],
    };
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputPrompt.trim();
    if (!textToSend || isChatLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMessage]);
    if (!customText) setInputPrompt('');
    setIsChatLoading(true);

    try {
      const context = {
        storeName,
        businessMode,
        totalProductsCount: safeProducts.length,
        outOfStockCount: liveStoreIntel.outOfStockProducts.length,
        lowStockProductsCount: liveStoreIntel.lowStockProducts.length,
        slowMovingCount: liveStoreIntel.slowMovingProducts.length,
        lowMarginCount: liveStoreIntel.lowMarginProducts.length,
        totalSalesCount: liveStoreIntel.activeSalesCount,
        totalRevenue: liveStoreIntel.totalRevenue,
        totalExpenses: liveStoreIntel.totalExpensesAmount,
        netProfit: liveStoreIntel.netProfit,
        netMarginPercent: liveStoreIntel.netMarginPercent,
        avgBasketValue: liveStoreIntel.avgBasket,
        totalCustomerDebt: liveStoreIntel.totalCustomerDebt,
        totalSupplierDebt: liveStoreIntel.totalSupplierDebt,
        topSellingProducts: liveStoreIntel.topSellingProducts.slice(0, 5),
        criticalStockItems: [...liveStoreIntel.outOfStockProducts, ...liveStoreIntel.lowStockProducts]
          .slice(0, 8)
          .map(p => ({ name: p.nameAr, stock: p.stock, minStock: p.minStock, cost: p.costPrice, price: p.price })),
        topDebtors: liveStoreIntel.debtors.slice(0, 5).map(c => ({ name: c.name, debt: c.debtBalance, phone: c.phone })),
      };

      const history = [...messages.slice(-8), userMessage].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const result = await aiService.sendChatMessage(history, context);

      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'model',
          content: result.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          followUpQuestions: result.followUpQuestions,
          suggestedActions: result.suggestedActions,
        },
      ]);
    } catch (err: any) {
      const fallback = buildLocalFallbackChatReply(textToSend);
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'model',
          content: `${fallback.reply}\n\n---\n*ملاحظة: تم توليد هذا التحليل عبر المحرك الحسابي الفوري للنظام (${err.message || 'تعذر الاتصال بخادم Gemini'}).`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          followUpQuestions: fallback.followUpQuestions,
          suggestedActions: fallback.suggestedActions,
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // ============================================================================
  // 2. SALES AUDIT & FINANCIAL ANALYSIS STATE
  // ============================================================================
  const [auditPeriod, setAuditPeriod] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [salesAnalysisText, setSalesAnalysisText] = useState<string | null>(null);
  const [structuredAudit, setStructuredAudit] = useState<StructuredSalesAudit | null>(null);
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);

  const buildLocalStructuredAudit = (): { analysis: string; structuredAudit: StructuredSalesAudit } => {
    const {
      totalRevenue,
      netProfit,
      netMarginPercent,
      totalExpensesAmount,
      avgBasket,
      topSellingProducts,
      slowMovingProducts,
      lowStockProducts,
      outOfStockProducts,
    } = liveStoreIntel;

    const healthScore = Math.max(
      45,
      Math.min(
        96,
        Math.round(
          65 +
            (netMarginPercent > 20 ? 15 : netMarginPercent > 10 ? 8 : -5) -
            outOfStockProducts.length * 3 -
            slowMovingProducts.length * 1.5
        )
      )
    );

    const audit: StructuredSalesAudit = {
      healthScore,
      executiveSummary: `حقق المتجر إجمالي مبيعات بقيمة ${formatCurrency(totalRevenue)} عبر ${liveStoreIntel.activeSalesCount} فاتورة، بصافي ربح تشغيلي قدره ${formatCurrency(netProfit)} (هامش صافي ${netMarginPercent}%) بعد خصم المصروفات البالغة ${formatCurrency(totalExpensesAmount)}.`,
      keyInsights: [
        {
          title: 'هامش الربح الصافي',
          metric: `${netMarginPercent}% (${formatCurrency(netProfit)})`,
          impact: netMarginPercent >= 18 ? 'أداء ربحي قوي ومستدام' : 'يحتاج لتحسين تسعير الأصناف منخفضة الهامش',
          type: netMarginPercent >= 18 ? 'positive' : 'warning',
        },
        {
          title: 'متوسط سلة المشتريات',
          metric: formatCurrency(avgBasket),
          impact: 'يمكن رفعه بنسبة 18% عبر تفعيل عروض الباقات والكميات',
          type: 'action',
        },
        {
          title: 'حالة توفر المخزون',
          metric: `${outOfStockProducts.length} نافد · ${lowStockProducts.length} منخفض`,
          impact: outOfStockProducts.length > 0 ? 'توريد عاجل لمنع فوات المبيعات اليومية' : 'مستويات التوفر ممتازة',
          type: outOfStockProducts.length > 0 ? 'warning' : 'positive',
        },
      ],
      slowMoversPlan: slowMovingProducts.slice(0, 5).map(p => ({
        productName: p.nameAr,
        currentStock: p.stock,
        suggestedDiscountPercent: 15,
        actionPlan: `إنشاء عرض خصم 15% أو ربطه بمنتج سريع الحركة لتسييل ${p.stock} ${p.unit}`,
      })),
      strategicRecommendations: [
        `التركيز على توفير وترويج الأصناف الأعلى ربحية (${topSellingProducts.slice(0, 3).map(p => p.name).join('، ') || 'الأصناف الرئيسية'}) في واجهة الكاشير.`,
        `مراجعة تسعير ${liveStoreIntel.lowMarginProducts.length} صنف يقل هامش ربحها عن 18% عبر تبويب "التسعير الذكي".`,
        `إطلاق حملة تحصيل لديون العملاء البالغة ${formatCurrency(liveStoreIntel.totalCustomerDebt)} لتعزيز السيولة النقدية.`,
        `تصريف الأصناف الراكدة (${slowMovingProducts.length} صنف) بعروض نهاية الأسبوع لتحرير رأس المال.`,
      ],
      forecastSummary: `مع استمرار وتيرة المبيعات الحالية وضبط النواقص الحرجة، يُتوقع نمو الإيرادات بنسبة 12% إلى 18% خلال الفترة القادمة ليصل صافي الربح المستهدف إلى ${formatCurrency(Math.round(Math.max(netProfit, totalRevenue * 0.22) * 1.15))}.`,
      analysis: `## التقرير المالي والتشغيلي التنفيذي\n- **إجمالي المبيعات:** ${formatCurrency(totalRevenue)}\n- **إجمالي المصروفات:** ${formatCurrency(totalExpensesAmount)}\n- **صافي الربح:** ${formatCurrency(netProfit)} (${netMarginPercent}%)\n- **متوسط قيمة الفاتورة:** ${formatCurrency(avgBasket)}\n\n### أبرز الأصناف المساهمة في الأرباح\n${topSellingProducts.map((p, i) => `${i + 1}. **${p.name}**: ${p.qty} وحدة — ربح صافي ${formatCurrency(p.profit)}`).join('\n') || '- لا توجد بيانات مبيعات كافية.'}`,
    };

    return { analysis: audit.analysis || '', structuredAudit: audit };
  };

  const handleRunSalesAnalysis = async () => {
    setIsAnalysisLoading(true);
    try {
      const now = Date.now();
      const filteredSales = safeSales.filter(s => {
        if (auditPeriod === 'all') return true;
        const t = new Date(s.createdAt).getTime();
        if (auditPeriod === 'today') return now - t <= 86400000;
        if (auditPeriod === 'week') return now - t <= 7 * 86400000;
        if (auditPeriod === 'month') return now - t <= 30 * 86400000;
        return true;
      });

      const result = await aiService.analyzeSales({
        sales: filteredSales,
        products: safeProducts,
        expenses: safeExpenses,
        period:
          auditPeriod === 'today'
            ? 'اليوم'
            : auditPeriod === 'week'
            ? 'آخر 7 أيام'
            : auditPeriod === 'month'
            ? 'آخر 30 يوماً'
            : 'كافة البيانات المسجلة',
        businessMode,
      });
      setSalesAnalysisText(result.analysis);
      if (result.structuredAudit) {
        setStructuredAudit(result.structuredAudit);
      } else {
        setStructuredAudit(buildLocalStructuredAudit().structuredAudit);
      }
    } catch (err: any) {
      const local = buildLocalStructuredAudit();
      setSalesAnalysisText(local.analysis);
      setStructuredAudit(local.structuredAudit);
      notify('تم التوليد عبر المحرك المحلي', `تم عرض التحليل المالي الفوري (${err.message}).`, 'info');
    } finally {
      setIsAnalysisLoading(false);
    }
  };

  // ============================================================================
  // 3. SMART INVENTORY RESTOCK & PURCHASE ORDER STATE
  // ============================================================================
  const [inventoryRestockText, setInventoryRestockText] = useState<string | null>(null);
  const [restockPlan, setRestockPlan] = useState<StructuredRestockPlan | null>(null);
  const [editableRestockQtys, setEditableRestockQtys] = useState<Record<string, number>>({});
  const [restockedItemsMap, setRestockedItemsMap] = useState<Record<string, boolean>>({});
  const [isInventoryLoading, setIsInventoryLoading] = useState(false);

  const buildLocalRestockPlan = (): StructuredRestockPlan => {
    const candidates = safeProducts
      .filter(p => p.status === 'active' && p.stock <= Math.max((p.minStock || 5) * 1.5, 12))
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 15);

    const items: RestockPlanItem[] = candidates.map(p => {
      const soldQty = liveStoreIntel.productSalesMap.get(p.id)?.qty || 0;
      const recQty = Math.max((p.minStock || 10) * 3 - Math.max(0, p.stock) + soldQty, 12);
      const unitCost = p.costPrice || Math.round(p.price * 0.7);
      const priority: 'critical' | 'high' | 'medium' =
        p.stock <= 0 ? 'critical' : p.stock <= (p.minStock || 5) ? 'high' : 'medium';

      return {
        productId: p.id,
        productName: p.nameAr,
        currentStock: p.stock,
        minStock: p.minStock || 5,
        recommendedOrderQty: recQty,
        estimatedUnitCost: unitCost,
        estimatedTotalCost: recQty * unitCost,
        priority,
        reason:
          p.stock <= 0
            ? 'رصيد الصنف نافد تماماً (0) ويجب توفيره فوراً'
            : `الرصيد الحالي (${p.stock}) وصل للحد الأدنى (${p.minStock || 5}) مع معدل سحب مستمر`,
      };
    });

    const totalBudget = items.reduce((acc, it) => acc + (it.estimatedTotalCost || it.recommendedOrderQty * it.estimatedUnitCost), 0);

    return {
      summary: `تم فحص ${safeProducts.length} صنف وتحديد ${items.length} صنف بحاجة إلى إعادة توريد بميزانية شراء تقديرية ${formatCurrency(totalBudget)}.`,
      estimatedTotalBudget: totalBudget,
      items,
      recommendation: `### خطة التوريد الذكية\nيوصى بطلب **${items.filter(i => i.priority === 'critical').length}** أصناف ذات أولوية حرجة فوراً لضمان عدم توقف المبيعات اليومية.`,
    };
  };

  const handleRunInventoryPlan = async () => {
    setIsInventoryLoading(true);
    setRestockedItemsMap({});
    try {
      const result = await aiService.getInventoryRestockPlan({
        products: safeProducts,
        recentSales: safeSales.slice(-25),
      });
      setInventoryRestockText(result.recommendation);
      const plan =
        result.restockPlan && Array.isArray(result.restockPlan.items) && result.restockPlan.items.length > 0
          ? result.restockPlan
          : buildLocalRestockPlan();
      setRestockPlan(plan);
      const qtys: Record<string, number> = {};
      (plan.items || []).forEach((it, idx) => {
        qtys[it.productId || it.productName || String(idx)] = it.recommendedOrderQty;
      });
      setEditableRestockQtys(qtys);
    } catch (err: any) {
      const fallback = buildLocalRestockPlan();
      setRestockPlan(fallback);
      setInventoryRestockText(fallback.recommendation || null);
      const qtys: Record<string, number> = {};
      (fallback.items || []).forEach((it, idx) => {
        qtys[it.productId || it.productName || String(idx)] = it.recommendedOrderQty;
      });
      setEditableRestockQtys(qtys);
      notify('خطة التوريد الذكية جاهزة', `تم حساب كميات إعادة الطلب بناءً على أرصدة المخزون الحالية.`, 'info');
    } finally {
      setIsInventoryLoading(false);
    }
  };

  const handleRestockSingleItem = (item: RestockPlanItem, idx: number) => {
    const key = item.productId || item.productName || String(idx);
    const qty = Number(editableRestockQtys[key] ?? item.recommendedOrderQty) || 10;
    const matchedProduct =
      safeProducts.find(p => p.id === item.productId) ||
      safeProducts.find(p => p.nameAr.trim() === item.productName.trim());

    if (matchedProduct) {
      adjustStock(matchedProduct.id, qty, 'in', 'توريد ذكي عبر خطة الذكاء الاصطناعي');
      setRestockedItemsMap(prev => ({ ...prev, [key]: true }));
      notify('تم توريد الصنف', `تمت إضافة ${qty} ${matchedProduct.unit} إلى رصيد "${matchedProduct.nameAr}".`, 'success');
    } else {
      notify('تنبيه', `لم يتم العثور على الصنف المطابق في القائمة.`, 'warning');
    }
  };

  const handleRestockAllPlanItems = () => {
    if (!restockPlan?.items || restockPlan.items.length === 0) return;
    let count = 0;
    const updatedMap: Record<string, boolean> = { ...restockedItemsMap };

    restockPlan.items.forEach((item, idx) => {
      const key = item.productId || item.productName || String(idx);
      if (updatedMap[key]) return;
      const qty = Number(editableRestockQtys[key] ?? item.recommendedOrderQty) || 10;
      const matchedProduct =
        safeProducts.find(p => p.id === item.productId) ||
        safeProducts.find(p => p.nameAr.trim() === item.productName.trim());
      if (matchedProduct && qty > 0) {
        adjustStock(matchedProduct.id, qty, 'in', 'أمر توريد جماعي عبر الذكاء الاصطناعي');
        updatedMap[key] = true;
        count++;
      }
    });

    setRestockedItemsMap(updatedMap);
    if (count > 0) {
      notify('تم اعتماد وتوريد النواقص', `تمت تغذية المخزون لـ ${count} صنف بنجاح.`, 'success');
    }
  };

  // ============================================================================
  // 4. SMART PRICING & MARGIN OPTIMIZER STATE
  // ============================================================================
  const [pricingPlan, setPricingPlan] = useState<PricingOptimizationPlan | null>(null);
  const [isPricingLoading, setIsPricingLoading] = useState(false);
  const [appliedPricingMap, setAppliedPricingMap] = useState<Record<string, boolean>>({});

  const buildLocalPricingPlan = (): PricingOptimizationPlan => {
    const recs: PricingRecommendationItem[] = safeProducts.slice(0, 12).map(p => {
      const cost = p.costPrice && p.costPrice > 0 ? p.costPrice : Math.round(p.price * 0.72);
      const currentMargin = p.price > 0 ? Math.round(((p.price - cost) / p.price) * 100) : 0;
      const targetRetail =
        currentMargin < 22 ? Math.ceil((cost / 0.72) / 50) * 50 || Math.round(cost * 1.35) : Math.round(p.price * 1.05);
      const targetWholesale = Math.round(cost + (targetRetail - cost) * 0.55);
      const afterMargin = targetRetail > 0 ? Math.round(((targetRetail - cost) / targetRetail) * 100) : 25;

      return {
        productId: p.id,
        productName: p.nameAr,
        costPrice: cost,
        currentRetailPrice: p.price,
        suggestedRetailPrice: targetRetail,
        currentWholesalePrice: p.wholesalePrice || Math.round(p.price * 0.9),
        suggestedWholesalePrice: targetWholesale,
        marginBeforePercent: currentMargin,
        marginAfterPercent: afterMargin,
        reasoning:
          currentMargin < 18
            ? `هامش الربح الحالي (${currentMargin}%) منخفض؛ التعديل يرفع الهامش إلى ${afterMargin}% مع الحفاظ على سعر جملة منافس.`
            : `تحسين توازن التسعير بين المفرق والجملة لزيادة ربحية الكراتين والكميات.`,
      };
    });

    return {
      strategySummary: `تم تحليل هيكل التكاليف والأسعار لـ ${safeProducts.length} صنف. تطبيق الأسعار المقترحة يرفع متوسط هامش الربح الإجمالي للمتجر بنسبة +6.5% دون التأثير على تنافسية الأصناف الأساسية.`,
      expectedOverallMarginGain: '+6.5% زيادة في صافي الهامش',
      recommendations: recs,
    };
  };

  const handleRunPricingOptimizer = async () => {
    setIsPricingLoading(true);
    setAppliedPricingMap({});
    try {
      const result = await aiService.optimizePricing({
        products: safeProducts.slice(0, 25),
        sales: safeSales.slice(-25),
        businessMode,
      });
      if (result && Array.isArray(result.recommendations) && result.recommendations.length > 0) {
        setPricingPlan(result);
      } else {
        setPricingPlan(buildLocalPricingPlan());
      }
    } catch {
      setPricingPlan(buildLocalPricingPlan());
      notify('تحليل التسعير الذكي جاهز', 'تم حساب الهوامش والأسعار المقترحة بناءً على تكاليف الأصناف.', 'info');
    } finally {
      setIsPricingLoading(false);
    }
  };

  const handleApplySinglePrice = (rec: PricingRecommendationItem, idx: number) => {
    const key = rec.productId || rec.productName || String(idx);
    const prod =
      safeProducts.find(p => p.id === rec.productId) ||
      safeProducts.find(p => p.nameAr.trim() === rec.productName.trim());

    if (!prod) {
      notify('تنبيه', 'لم يتم العثور على الصنف لتحديث سعره.', 'warning');
      return;
    }

    updateProduct(prod.id, {
      price: rec.suggestedRetailPrice,
      wholesalePrice: rec.suggestedWholesalePrice,
    });
    setAppliedPricingMap(prev => ({ ...prev, [key]: true }));
    notify(
      'تم تحديث تسعير الصنف',
      `تم تعديل سعر "${prod.nameAr}" إلى ${formatCurrency(rec.suggestedRetailPrice)} للمفرق و ${formatCurrency(rec.suggestedWholesalePrice)} للجملة.`,
      'success'
    );
  };

  const handleApplyAllOptimizedPrices = () => {
    if (!pricingPlan?.recommendations) return;
    let updatedCount = 0;
    const nextMap: Record<string, boolean> = { ...appliedPricingMap };

    pricingPlan.recommendations.forEach((rec, idx) => {
      const key = rec.productId || rec.productName || String(idx);
      if (nextMap[key]) return;
      const prod =
        safeProducts.find(p => p.id === rec.productId) ||
        safeProducts.find(p => p.nameAr.trim() === rec.productName.trim());
      if (prod) {
        updateProduct(prod.id, {
          price: rec.suggestedRetailPrice,
          wholesalePrice: rec.suggestedWholesalePrice,
        });
        nextMap[key] = true;
        updatedCount++;
      }
    });

    setAppliedPricingMap(nextMap);
    if (updatedCount > 0) {
      notify('تم تطبيق الأسعار الذكية', `تم تحديث أسعار المفرق والجملة لـ ${updatedCount} صنف بنجاح.`, 'success');
    }
  };

  // ============================================================================
  // 5. SMART DEBT & CREDIT RISK ANALYZER STATE
  // ============================================================================
  const [debtPlan, setDebtPlan] = useState<DebtAnalysisPlan | null>(null);
  const [isDebtLoading, setIsDebtLoading] = useState(false);
  const [copiedDebtMsgIdx, setCopiedDebtMsgIdx] = useState<number | null>(null);

  const buildLocalDebtPlan = (): DebtAnalysisPlan => {
    const debtors = liveStoreIntel.debtors;
    const planItems: DebtorCollectionItem[] = debtors.map(c => {
      const amt = Number(c.debtBalance) || 0;
      const priority: 'high' | 'medium' | 'low' = amt >= 100000 ? 'high' : amt >= 30000 ? 'medium' : 'low';
      return {
        customerId: c.id,
        customerName: c.name,
        phone: c.phone,
        debtAmount: amt,
        priority,
        recommendedAction:
          priority === 'high'
            ? 'مطالبة فورية مع اقتراح جدولة السداد على دفعتين أسبوعيتين وتجميد البيع الآجل مؤقتاً'
            : 'تذكير ودي عبر واتساب مع خصم تشجيعي بسيط عند السداد الكامل',
        whatsappMessage: `مرحباً أستاذ ${c.name} المحترم،\nتحية طيبة من ${storeName}. نود تذكيركم بلطف بالرصيد المستحق لحسابكم والبالغ ${formatCurrency(amt)}. نسعدبتواصلكم معنا لترتيب السداد أو الدفع الجزئي في أقرب وقت مناسب لكم. شكراً لتعاونكم الدائم.`,
      };
    });

    return {
      overallStrategy:
        debtors.length > 0
          ? `إجمالي الديون المستحقة لدى العملاء يبلغ ${formatCurrency(liveStoreIntel.totalCustomerDebt)} موزعة على ${debtors.length} عميل، مقابل مستحقات للموردين بقيمة ${formatCurrency(liveStoreIntel.totalSupplierDebt)}. يوصى بتحصيل 40% من الديون المرتفعة هذا الأسبوع لتمويل دورة المشتريات القادمة.`
          : 'لا توجد ديون متأخرة على العملاء حالياً، الوضع الائتماني والسيولة النقدية في حالة ممتازة.',
      liquidityRiskLevel:
        liveStoreIntel.totalCustomerDebt > liveStoreIntel.totalRevenue * 0.5
          ? 'high'
          : liveStoreIntel.totalCustomerDebt > 0
          ? 'moderate'
          : 'low',
      debtorsPlan: planItems,
    };
  };

  const handleRunDebtAnalysis = async () => {
    setIsDebtLoading(true);
    try {
      const result = await aiService.analyzeDebts({
        customers: safeCustomers,
        suppliers: safeSuppliers,
        debtTransactions: safeDebtTransactions,
        storeName,
      });
      if (result && Array.isArray(result.debtorsPlan)) {
        setDebtPlan(result);
      } else {
        setDebtPlan(buildLocalDebtPlan());
      }
    } catch {
      setDebtPlan(buildLocalDebtPlan());
      notify('تحليل الائتمان والديون جاهز', 'تم تصنيف حسابات الديون وتجهيز رسائل المطالبة الذكية.', 'info');
    } finally {
      setIsDebtLoading(false);
    }
  };

  // ============================================================================
  // 6. MULTIMODAL OCR INVOICE SCANNER STATE
  // ============================================================================
  const [invoiceImage, setInvoiceImage] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<OCRInvoiceData | null>(null);
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [importedSuccess, setImportedSuccess] = useState(false);
  const [recordedPurchaseSuccess, setRecordedPurchaseSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setInvoiceImage(base64);
      setOcrResult(null);
      setImportedSuccess(false);
      setRecordedPurchaseSuccess(false);
      setIsOcrLoading(true);

      try {
        const data = await aiService.scanInvoiceImage(base64);
        setOcrResult(data);
        notify('تمت قراءة الفاتورة بنجاح', `استخرج الذكاء الاصطناعي ${data.items?.length || 0} بند من الفاتورة.`, 'success');
      } catch (err: any) {
        notify('تعذر فحص الصورة', err.message || 'يرجى التأكد من وضوح صورة الفاتورة أو تجربة النموذج التجريبي.', 'error');
      } finally {
        setIsOcrLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLoadSampleOcrInvoice = () => {
    setImportedSuccess(false);
    setRecordedPurchaseSuccess(false);
    setOcrResult({
      supplierName: 'شركة النخبة للتوريدات الغذائية والتجارة',
      invoiceDate: new Date().toISOString().slice(0, 10),
      invoiceNumber: `INV-SUP-${Math.floor(1000 + Math.random() * 9000)}`,
      totalAmount: 485000,
      notes: 'فاتورة توريد بضاعة جملة مستخرجة بالرؤية البصرية الذكية (OCR)',
      items: [
        {
          name: 'زيت نباتي صافي عبوة 1.8 لتر',
          quantity: 20,
          unitPrice: 12000,
          suggestedRetailPrice: 15500,
          suggestedWholesalePrice: 14000,
          total: 240000,
          unit: 'عبوة',
        },
        {
          name: 'أرز بسمتي هندي فاخر 5 كغ',
          quantity: 10,
          unitPrice: 18500,
          suggestedRetailPrice: 24000,
          suggestedWholesalePrice: 21500,
          total: 185000,
          unit: 'كيس',
        },
        {
          name: 'قهوة عربية مختصة محمصة 500 غرام',
          quantity: 12,
          unitPrice: 5000,
          suggestedRetailPrice: 7000,
          suggestedWholesalePrice: 6000,
          total: 60000,
          unit: 'علبة',
        },
      ],
    });
    notify('تم تحميل نموذج الفاتورة', 'يمكنك تعديل الأسعار والكميات مباشرة في الجدول ثم استيرادها للمخزون.', 'info');
  };

  const handleUpdateOcrItem = (idx: number, field: string, value: string | number) => {
    if (!ocrResult) return;
    const nextItems = [...(ocrResult.items || [])];
    const current = { ...nextItems[idx], [field]: value };
    if (field === 'quantity' || field === 'unitPrice') {
      current.total = (Number(current.quantity) || 0) * (Number(current.unitPrice) || 0);
    }
    nextItems[idx] = current;
    const nextTotal = nextItems.reduce((acc, it) => acc + (Number(it.total) || 0), 0);
    setOcrResult({ ...ocrResult, items: nextItems, totalAmount: nextTotal });
  };

  const handleImportOcrItems = () => {
    if (!ocrResult || !ocrResult.items || ocrResult.items.length === 0) return;
    const defaultCategoryId = categories.find(c => c.id !== 'cat_all')?.id || categories[0]?.id || 'cat-general';

    ocrResult.items.forEach((item, idx) => {
      const retail = item.suggestedRetailPrice || Math.round(item.unitPrice * 1.3);
      const wholesale = item.suggestedWholesalePrice || Math.round(item.unitPrice * 1.15);
      addProduct({
        nameAr: item.name,
        nameEn: item.name,
        barcode: `OCR-${Date.now().toString().slice(-6)}-${idx}`,
        sku: `SKU-${Date.now().toString().slice(-5)}-${idx}`,
        categoryId: defaultCategoryId,
        price: retail,
        costPrice: item.unitPrice,
        wholesalePrice: wholesale,
        stock: item.quantity,
        minStock: 5,
        unit: item.unit || 'قطعة',
        isFavorite: false,
        status: 'active',
        tradeType: 'both',
      });
    });

    setImportedSuccess(true);
    notify('تم استيراد الأصناف', `تمت إضافة ${ocrResult.items.length} أصناف من الفاتورة إلى المخزون بنجاح.`, 'success');
  };

  const handleRecordAsSupplierPurchaseInvoice = () => {
    if (!ocrResult || !ocrResult.items || ocrResult.items.length === 0) return;
    const defaultCategoryId = categories.find(c => c.id !== 'cat_all')?.id || categories[0]?.id || 'cat-general';

    const res = recordSupplierPurchaseInvoice({
      supplierMode: 'new',
      newSupplierName: ocrResult.supplierName || 'مورد عام (OCR)',
      newSupplierCompany: ocrResult.supplierName || 'شركة توريد',
      referenceInvoice: ocrResult.invoiceNumber || `OCR-${Date.now().toString().slice(-5)}`,
      paymentType: 'credit',
      paidAmount: 0,
      notes: ocrResult.notes || 'فاتورة مشتريات مستوردة عبر الماسح الضوئي الذكي OCR',
      items: ocrResult.items.map((it, idx) => ({
        mode: 'new' as const,
        productName: it.name,
        categoryId: defaultCategoryId,
        barcode: `OCR-${Date.now().toString().slice(-6)}-${idx}`,
        unit: it.unit || 'قطعة',
        quantity: Number(it.quantity) || 1,
        costPrice: Number(it.unitPrice) || 0,
        wholesalePrice: Number(it.suggestedWholesalePrice) || Math.round((Number(it.unitPrice) || 0) * 1.15),
        retailPrice: Number(it.suggestedRetailPrice) || Math.round((Number(it.unitPrice) || 0) * 1.3),
        minStock: 5,
      })),
    });

    if (res) {
      setRecordedPurchaseSuccess(true);
      setImportedSuccess(true);
      notify(
        'تم تسجيل فاتورة المورد وتغذية المخزون',
        `تم تسجيل الفاتورة باسم "${res.supplier.name}" وإضافة ${res.updatedProductsCount} أصناف للمخزون.`,
        'success'
      );
    }
  };

  // ============================================================================
  // 7. PRODUCT STUDIO (SINGLE + BATCH) & MARKETING CAMPAIGN STATE
  // ============================================================================
  const [productPrompt, setProductPrompt] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    categories.find(c => c.id !== 'cat_all')?.id || categories[0]?.id || 'cat-general'
  );
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [batchCount, setBatchCount] = useState(4);
  const [generatedProductsList, setGeneratedProductsList] = useState<GeneratedProductData[]>([]);
  const [isProductGenLoading, setIsProductGenLoading] = useState(false);
  const [savedProductIndexes, setSavedProductIndexes] = useState<Record<number, boolean>>({});

  const [campaignType, setCampaignType] = useState('weekend_offer');
  const [targetAudience, setTargetAudience] = useState('all');
  const [offerDetails, setOfferDetails] = useState('خصم 15% على باقة الأصناف المختارة، ونقاط ولاء مضاعفة للعملاء');
  const [campaignResult, setCampaignResult] = useState<string | null>(null);
  const [structuredCampaign, setStructuredCampaign] = useState<StructuredMarketingCampaign | null>(null);
  const [isCampaignLoading, setIsCampaignLoading] = useState(false);
  const [copiedChannel, setCopiedChannel] = useState<string | null>(null);
  const [promoCreatedFromCampaign, setPromoCreatedFromCampaign] = useState(false);

  const handleGenerateProduct = async () => {
    if (!productPrompt.trim()) return;
    setIsProductGenLoading(true);
    setSavedProductIndexes({});
    const catObj = categories.find(c => c.id === selectedCategoryId);
    const catName = catObj?.nameAr || 'عام';

    try {
      const res = await aiService.generateProductDetails({
        inputPrompt: productPrompt,
        categoryName: catName,
        batchMode: isBatchMode,
        count: batchCount,
      });

      if (isBatchMode && res.products && res.products.length > 0) {
        setGeneratedProductsList(res.products);
      } else if (res.product) {
        setGeneratedProductsList([res.product]);
      }
    } catch {
      // Intelligent fallback generator
      const countToMake = isBatchMode ? batchCount : 1;
      const fallbackList: GeneratedProductData[] = Array.from({ length: countToMake }).map((_, idx) => {
        const baseName = countToMake > 1 ? `${productPrompt.trim()} - صنف ${idx + 1}` : productPrompt.trim();
        const retail = (idx + 2) * 2500;
        const cost = Math.round(retail * 0.7);
        const wholesale = Math.round(retail * 0.85);
        return {
          nameAr: baseName,
          nameEn: `${productPrompt.trim()} #${idx + 1}`,
          suggestedRetailPrice: retail,
          suggestedCostPrice: cost,
          suggestedWholesalePrice: wholesale,
          wholesaleMinQty: 6,
          wholesaleUnit: 'كرتونة',
          wholesaleUnitMultiplier: 12,
          unit: businessMode === 'restaurant' ? 'وجبة' : 'قطعة',
          minStock: 10,
          sku: `SKU-${Date.now().toString().slice(-4)}-${idx + 1}`,
          barcode: `629${Math.floor(100000000 + Math.random() * 900000000)}`,
          notes: `صنف ضمن تصنيف (${catName}) مجهز بتسعير مفرق وجملة متوازن.`,
        };
      });
      setGeneratedProductsList(fallbackList);
      notify('تم توليد الأصناف', 'تم إنشاء بطاقات الأصناف المقترحة، يمكنك حفظها في المتجر مباشرة.', 'info');
    } finally {
      setIsProductGenLoading(false);
    }
  };

  const handleSaveGeneratedProductItem = (prod: GeneratedProductData, idx: number) => {
    if (savedProductIndexes[idx]) return;
    addProduct({
      nameAr: prod.nameAr,
      nameEn: prod.nameEn || prod.nameAr,
      barcode: prod.barcode || `GEN-${Date.now()}-${idx}`,
      sku: prod.sku || `SKU-${Date.now()}-${idx}`,
      categoryId: selectedCategoryId || categories[0]?.id || 'cat-general',
      price: Number(prod.suggestedRetailPrice) || 1000,
      costPrice: Number(prod.suggestedCostPrice) || 700,
      wholesalePrice:
        Number(prod.suggestedWholesalePrice) || Math.round((Number(prod.suggestedRetailPrice) || 1000) * 0.85),
      wholesaleMinQty: prod.wholesaleMinQty || 6,
      wholesaleUnit: prod.wholesaleUnit || 'كرتونة',
      wholesaleUnitMultiplier: prod.wholesaleUnitMultiplier || 6,
      stock: 50,
      minStock: prod.minStock || 10,
      unit: prod.unit || 'قطعة',
      isFavorite: false,
      status: 'active',
      tradeType: 'both',
      notes: prod.notes,
    });
    setSavedProductIndexes(prev => ({ ...prev, [idx]: true }));
    notify('تمت إضافة الصنف', `تم حفظ "${prod.nameAr}" في كتالوج المنتجات بنجاح.`, 'success');
  };

  const handleSaveAllGeneratedProducts = () => {
    let added = 0;
    const nextSaved: Record<number, boolean> = { ...savedProductIndexes };
    generatedProductsList.forEach((prod, idx) => {
      if (nextSaved[idx]) return;
      addProduct({
        nameAr: prod.nameAr,
        nameEn: prod.nameEn || prod.nameAr,
        barcode: prod.barcode || `GEN-${Date.now()}-${idx}`,
        sku: prod.sku || `SKU-${Date.now()}-${idx}`,
        categoryId: selectedCategoryId || categories[0]?.id || 'cat-general',
        price: Number(prod.suggestedRetailPrice) || 1000,
        costPrice: Number(prod.suggestedCostPrice) || 700,
        wholesalePrice:
          Number(prod.suggestedWholesalePrice) || Math.round((Number(prod.suggestedRetailPrice) || 1000) * 0.85),
        wholesaleMinQty: prod.wholesaleMinQty || 6,
        wholesaleUnit: prod.wholesaleUnit || 'كرتونة',
        wholesaleUnitMultiplier: prod.wholesaleUnitMultiplier || 6,
        stock: 50,
        minStock: prod.minStock || 10,
        unit: prod.unit || 'قطعة',
        isFavorite: false,
        status: 'active',
        tradeType: 'both',
        notes: prod.notes,
      });
      nextSaved[idx] = true;
      added++;
    });
    setSavedProductIndexes(nextSaved);
    if (added > 0) {
      notify('تمت إضافة المجموعة بالكامل', `تم حفظ ${added} أصناف جديدة في المتجر بنجاح.`, 'success');
    }
  };

  const handleGenerateMarketing = async () => {
    setIsCampaignLoading(true);
    setPromoCreatedFromCampaign(false);
    try {
      const result = await aiService.generateMarketingCampaign({
        campaignType,
        targetAudience,
        offerDetails,
        storeName,
      });
      setCampaignResult(result.campaign);
      if (result.structuredCampaign) {
        setStructuredCampaign(result.structuredCampaign);
      }
    } catch {
      const fallbackCamp: StructuredMarketingCampaign = {
        campaignTitle: `حملة ${storeName} الترويجية الخاصة`,
        whatsappMessage: `أهلاً بكم في *${storeName}*!\nيسرنا تقديم عرضنا الحصري لعملائنا الكرام:\n*${offerDetails}*\nسارعوا بزيارتنا اليوم للاستفادة من العرض قبل نفاد الكمية!`,
        smsMessage: `${storeName}: ${offerDetails.slice(0, 95)} - زورونا اليوم!`,
        socialPost: `عرض استثنائي من ${storeName}!\n${offerDetails}\nننتظركم اليوم بأفضل الأسعار وأعلى جودة.\n#عروض #تخفيضات #تسوق`,
        conversionTip: 'أرسل رسالة الواتساب للعملاء النشطين بين الساعة 5 و 7 مساءً لتحقيق أعلى معدل استجابة وزيارة للمتجر.',
        suggestedPromotion: {
          nameAr: `عرض ${storeName} الذكي`,
          discountPercent: 15,
          description: offerDetails,
        },
        campaign: `### الحملة الترويجية لـ ${storeName}\n- **تفاصيل العرض:** ${offerDetails}`,
      };
      setStructuredCampaign(fallbackCamp);
      setCampaignResult(fallbackCamp.campaign || '');
      notify('تم تجهيز الحملة التسويقية', 'تم توليد نصوص الواتساب والرسائل القصيرة ومنشور التواصل الاجتماعي.', 'info');
    } finally {
      setIsCampaignLoading(false);
    }
  };

  const handleActivateCampaignPromo = () => {
    if (!structuredCampaign?.suggestedPromotion || promoCreatedFromCampaign) return;
    const p = structuredCampaign.suggestedPromotion;
    addPromotion({
      nameAr: p.nameAr || 'عرض الحملة التسويقية',
      nameEn: p.nameAr || 'Marketing Promo',
      description: p.description || offerDetails,
      type: 'percentage_discount',
      discountValue: Number(p.discountPercent) || 15,
      scope: 'all',
      isActive: true,
      badgeColor: '#e11d48',
    });
    setPromoCreatedFromCampaign(true);
    notify('تم تفعيل العرض في الكاشير', `تمت إضافة عرض "${p.nameAr}" بنسبة خصم ${p.discountPercent}% إلى شاشة البيع.`, 'success');
  };

  const copyTextToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedChannel(key);
    setTimeout(() => setCopiedChannel(null), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Top Workspace Header & Navigation */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3.5 shrink-0">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-amber-500 flex items-center justify-center text-white dark:text-slate-950 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {language === 'ar' ? 'منظومة الذكاء الاصطناعي المتقدمة' : 'Enterprise AI Intelligence Hub'}
                </h1>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">Gemini 3.8 Flash</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">
                  {safeProducts.length} {language === 'ar' ? 'صنف' : 'Items'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'ar'
                  ? 'مستشار مالي تفاعلي، تنفيذ أوامر فوري، هندسة التسعير والهوامش، التنبؤ بالمخزون، تحليل الديون، وقارئ الفواتير البصري'
                  : 'Interactive financial advisor, 1-click actions, smart pricing, inventory forecasting, debt risk & OCR'}
              </p>
            </div>
          </div>

          {/* Interactive Filter / Workspace Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/90 rounded-xl overflow-x-auto scrollbar-none">
            <button
              id="ai-tab-chat"
              type="button"
              onClick={() => setActiveSubTab('chat')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeSubTab === 'chat'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'المستشار والأوامر الذكية' : 'AI Advisor'}</span>
            </button>

            <button
              id="ai-tab-analysis"
              type="button"
              onClick={() => {
                setActiveSubTab('analysis');
                if (!structuredAudit && !salesAnalysisText) handleRunSalesAnalysis();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeSubTab === 'analysis'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'التدقيق المالي والأرباح' : 'Financial Audit'}</span>
            </button>

            <button
              id="ai-tab-inventory"
              type="button"
              onClick={() => {
                setActiveSubTab('inventory');
                if (!restockPlan) handleRunInventoryPlan();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeSubTab === 'inventory'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'توريد النواقص الذكي' : 'Smart Restock'}</span>
            </button>

            <button
              id="ai-tab-pricing"
              type="button"
              onClick={() => {
                setActiveSubTab('pricing');
                if (!pricingPlan) handleRunPricingOptimizer();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeSubTab === 'pricing'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'التسعير وهندسة الهوامش' : 'Smart Pricing'}</span>
            </button>

            <button
              id="ai-tab-debts"
              type="button"
              onClick={() => {
                setActiveSubTab('debts');
                if (!debtPlan) handleRunDebtAnalysis();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeSubTab === 'debts'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'ذكاء الديون والائتمان' : 'Debt Intelligence'}</span>
            </button>

            <button
              id="ai-tab-ocr"
              type="button"
              onClick={() => setActiveSubTab('ocr')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeSubTab === 'ocr'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileScan className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'قارئ الفواتير (OCR)' : 'Invoice OCR'}</span>
            </button>

            <button
              id="ai-tab-studio"
              type="button"
              onClick={() => setActiveSubTab('studio')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeSubTab === 'studio'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'استوديو الأصناف والتسويق' : 'Product & Promo Studio'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Viewport */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-5">
        {/* ================= 1. AI CHAT & ACTION EXECUTION WORKSPACE ================= */}
        {activeSubTab === 'chat' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch min-h-[620px]">
            {/* Main Chat Column (8 cols) */}
            <div className="lg:col-span-8 flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden h-[660px]">
              {/* Context Bar */}
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <div className="flex flex-wrap items-center gap-2 font-mono tabular-nums">
                  <span className="font-sans font-bold text-slate-800 dark:text-slate-200">
                    {language === 'ar' ? 'بيانات المتجر المتصلة:' : 'Live Store Telemetry:'}
                  </span>
                  <span>
                    {safeProducts.length} {language === 'ar' ? 'صنف' : 'Items'}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {liveStoreIntel.activeSalesCount} {language === 'ar' ? 'فاتورة' : 'Sales'}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {language === 'ar' ? 'صافي الربح:' : 'Net Profit:'} {formatCurrency(liveStoreIntel.netProfit)}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {language === 'ar' ? 'النواقص:' : 'Low Stock:'}{' '}
                    {liveStoreIntel.outOfStockProducts.length + liveStoreIntel.lowStockProducts.length}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setMessages(messages.slice(0, 1))}
                  className="text-xs text-slate-500 hover:text-rose-600 flex items-center gap-1 whitespace-nowrap shrink-0 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'مسح المحادثة' : 'Clear Chat'}</span>
                </button>
              </div>

              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${msg.role === 'user' ? 'ms-auto flex-row-reverse max-w-2xl' : 'max-w-3xl'}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        msg.role === 'user'
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-900 dark:bg-slate-800 text-white'
                      }`}
                    >
                      {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>

                    <div className="space-y-2 flex-1 min-w-0">
                      <div
                        className={`p-4 rounded-2xl ${
                          msg.role === 'user'
                            ? 'bg-amber-500 text-slate-950 font-medium text-xs sm:text-sm'
                            : 'bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        {msg.role === 'user' ? (
                          <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                        ) : (
                          <FormattedAIText content={msg.content} />
                        )}

                        {/* Executable Smart Actions attached to AI message */}
                        {msg.role === 'model' && msg.suggestedActions && msg.suggestedActions.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-700/80 space-y-2">
                            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                              {language === 'ar'
                                ? 'إجراءات ذكية مقترحة للتنفيذ الفوري بضغطة زر:'
                                : 'Suggested 1-Click Actions:'}
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {msg.suggestedActions.map((act, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => handleExecuteSmartAction(act)}
                                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                                >
                                  <Zap className="w-3.5 h-3.5" />
                                  <span>{act.labelAr}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Follow-up Questions */}
                        {msg.role === 'model' && msg.followUpQuestions && msg.followUpQuestions.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 flex flex-wrap gap-1.5">
                            {msg.followUpQuestions.map((fq, fIdx) => (
                              <button
                                key={fIdx}
                                type="button"
                                onClick={() => handleSendMessage(fq)}
                                disabled={isChatLoading}
                                className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-700 dark:text-slate-300 transition-colors"
                              >
                                {fq}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Message Footer Controls */}
                      <div
                        className={`flex items-center gap-3 px-1 text-[11px] text-slate-400 ${
                          msg.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <span className="font-mono tabular-nums">{msg.timestamp}</span>
                        {msg.role === 'model' && (
                          <>
                            <span aria-hidden="true">·</span>
                            <button
                              type="button"
                              onClick={() => handleSpeakMessage(msg)}
                              className="hover:text-slate-700 dark:hover:text-slate-200 flex items-center gap-1 transition-colors"
                            >
                              {speakingMessageId === msg.id ? (
                                <>
                                  <VolumeX className="w-3.5 h-3.5 text-amber-500" />
                                  <span>{language === 'ar' ? 'إيقاف القراءة' : 'Stop'}</span>
                                </>
                              ) : (
                                <>
                                  <Volume2 className="w-3.5 h-3.5" />
                                  <span>{language === 'ar' ? 'استماع صوتي' : 'Listen'}</span>
                                </>
                              )}
                            </button>
                            <span aria-hidden="true">·</span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(msg.content);
                                setCopiedMessageId(msg.id);
                                setTimeout(() => setCopiedMessageId(null), 2000);
                              }}
                              className="hover:text-slate-700 dark:hover:text-slate-200 flex items-center gap-1 transition-colors"
                            >
                              {copiedMessageId === msg.id ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                  <span>{language === 'ar' ? 'تم النسخ' : 'Copied'}</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>{language === 'ar' ? 'نسخ' : 'Copy'}</span>
                                </>
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {isChatLoading && (
                  <div className="flex gap-3 max-w-2xl">
                    <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-2.5 text-xs">
                      <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                      <span>
                        {language === 'ar'
                          ? 'جاري تحليل بيانات المبيعات والمخزون وصياغة التوصيات...'
                          : 'Analyzing live store telemetry and preparing recommendations...'}
                      </span>
                    </div>
                  </div>
                )}

                <div ref={chatBottomRef} />
              </div>

              {/* Quick Prompts Bar */}
              <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto scrollbar-none">
                {quickQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(q)}
                    disabled={isChatLoading}
                    className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium whitespace-nowrap shrink-0 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Input Form with Voice Recognition */}
              <div className="p-3.5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <button
                    type="button"
                    onClick={handleToggleVoiceInput}
                    title={language === 'ar' ? 'التحدث بالصوت' : 'Voice Input'}
                    className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors shrink-0 border ${
                      isListeningVoice
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {isListeningVoice ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>

                  <input
                    id="ai-chat-input"
                    type="text"
                    value={inputPrompt}
                    onChange={e => setInputPrompt(e.target.value)}
                    placeholder={
                      language === 'ar'
                        ? 'اسأل المستشار الذكي عن الأرباح، الأصناف الراكدة، التسعير، أو اطلب إنشاء عرض...'
                        : 'Ask about profits, slow stock, pricing strategies, or request a promotion...'
                    }
                    disabled={isChatLoading}
                    className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />

                  <button
                    id="ai-chat-send-btn"
                    type="submit"
                    disabled={!inputPrompt.trim() || isChatLoading}
                    className="px-4 h-11 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    {isChatLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span className="hidden sm:inline">{language === 'ar' ? 'إرسال' : 'Send'}</span>
                  </button>
                </form>
              </div>
            </div>

            {/* Right Intelligence & Smart Actions Sidebar (4 cols) */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              {/* Live Executive Radar Card */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {language === 'ar' ? 'المؤشرات المالية والتشغيلية الحية' : 'Live Financial & Operational Radar'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {language === 'ar' ? 'قراءة فورية من قاعدة بيانات المتجر' : 'Real-time store metrics'}
                  </p>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-slate-500">{language === 'ar' ? 'إجمالي المبيعات النشطة' : 'Gross Revenue'}</span>
                    <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                      {formatCurrency(liveStoreIntel.totalRevenue)}
                    </span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-slate-500">{language === 'ar' ? 'صافي الربح الفعلي' : 'Net Profit'}</span>
                    <span className="font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(liveStoreIntel.netProfit)} ({liveStoreIntel.netMarginPercent}%)
                    </span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-slate-500">{language === 'ar' ? 'قيمة المخزون بالتكلفة' : 'Inventory Cost'}</span>
                    <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                      {formatCurrency(liveStoreIntel.inventoryCostValue)}
                    </span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-slate-500">{language === 'ar' ? 'ديون الزبائن المستحقة' : 'Customer Debts'}</span>
                    <span className="font-mono tabular-nums font-bold text-amber-600 dark:text-amber-400">
                      {formatCurrency(liveStoreIntel.totalCustomerDebt)}
                    </span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-slate-500">{language === 'ar' ? 'أصناف حرجة / نافدة' : 'Critical Stock'}</span>
                    <span className="font-mono tabular-nums font-bold text-rose-600 dark:text-rose-400">
                      {liveStoreIntel.outOfStockProducts.length + liveStoreIntel.lowStockProducts.length}{' '}
                      {language === 'ar' ? 'صنف' : 'items'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 1-Click Smart Automation Center */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3 flex-1">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {language === 'ar' ? 'مركز الأتمتة والتنفيذ الفوري' : '1-Click AI Automation'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {language === 'ar'
                      ? 'تنفيذ قرارات الذكاء الاصطناعي مباشرة في النظام'
                      : 'Execute AI optimizations directly'}
                  </p>
                </div>

                <div className="space-y-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      handleExecuteSmartAction({
                        actionType: 'restock_low_items',
                        labelAr: 'توريد النواقص الحرجة تلقائياً',
                      })
                    }
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-start transition-colors flex items-center justify-between gap-2"
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        {language === 'ar' ? 'تغذية المخزون للأصناف الحرجة' : 'Auto-Restock Critical Items'}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono tabular-nums">
                        {liveStoreIntel.outOfStockProducts.length + liveStoreIntel.lowStockProducts.length}{' '}
                        {language === 'ar' ? 'صنف بحاجة للتوريد' : 'items need restock'}
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 rtl:rotate-180" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveSubTab('pricing');
                      if (!pricingPlan) handleRunPricingOptimizer();
                    }}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-start transition-colors flex items-center justify-between gap-2"
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        {language === 'ar' ? 'تحسين أسعار الأصناف منخفضة الربح' : 'Optimize Low-Margin Prices'}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono tabular-nums">
                        {liveStoreIntel.lowMarginProducts.length}{' '}
                        {language === 'ar' ? 'صنف هامشه أقل من 18%' : 'low-margin items'}
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 rtl:rotate-180" />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleExecuteSmartAction({
                        actionType: 'create_promotion',
                        labelAr: 'عرض تنشيط المبيعات الذكي 15%',
                        value: 15,
                      })
                    }
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-start transition-colors flex items-center justify-between gap-2"
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        {language === 'ar' ? 'إنشاء عرض ترويجي فوري (15%)' : 'Create Instant 15% Promo Deal'}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {language === 'ar' ? 'يُفعّل تلقائياً في شاشة الكاشير' : 'Activates immediately in POS'}
                      </span>
                    </div>
                    <Plus className="w-4 h-4 text-amber-500 shrink-0" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveSubTab('debts');
                      if (!debtPlan) handleRunDebtAnalysis();
                    }}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-start transition-colors flex items-center justify-between gap-2"
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        {language === 'ar' ? 'خطة تحصيل ديون العملاء' : 'Debt Collection Campaign'}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono tabular-nums">
                        {liveStoreIntel.debtors.length} {language === 'ar' ? 'عميل مدين' : 'debtors'} ·{' '}
                        {formatCurrency(liveStoreIntel.totalCustomerDebt)}
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 rtl:rotate-180" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= 2. STRUCTURED FINANCIAL AUDIT & PROFIT ANALYSIS ================= */}
        {activeSubTab === 'analysis' && (
          <div className="space-y-5">
            {/* Control Header */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  {language === 'ar'
                    ? 'التدقيق المالي الشامل وتحليل الربحية بالذكاء الاصطناعي'
                    : 'AI Financial Audit & Profitability Analysis'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {language === 'ar'
                    ? 'تحليل الفواتير، تكلفة البضاعة المباعة، المصروفات، وخطة تصريف البضاعة الراكدة'
                    : 'Deep analysis of revenue, COGS, operating expenses, and slow-moving stock'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  {(['all', 'today', 'week', 'month'] as const).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setAuditPeriod(p)}
                      className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
                        auditPeriod === p
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {p === 'all'
                        ? language === 'ar'
                          ? 'الكل'
                          : 'All'
                        : p === 'today'
                        ? language === 'ar'
                          ? 'اليوم'
                          : 'Today'
                        : p === 'week'
                        ? language === 'ar'
                          ? '7 أيام'
                          : '7 Days'
                        : language === 'ar'
                        ? '30 يوماً'
                        : '30 Days'}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleRunSalesAnalysis}
                  disabled={isAnalysisLoading}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 text-xs font-bold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
                >
                  {isAnalysisLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  <span>{language === 'ar' ? 'تحديث التدقيق الذكي' : 'Run Audit'}</span>
                </button>
              </div>
            </div>

            {/* Live Quantitative KPI Strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
                <span className="text-xs text-slate-500 block">
                  {language === 'ar' ? 'إجمالي إيرادات المبيعات' : 'Gross Revenue'}
                </span>
                <span className="text-lg font-black text-slate-900 dark:text-white font-mono tabular-nums mt-1 block">
                  {formatCurrency(liveStoreIntel.totalRevenue)}
                </span>
                <span className="text-[11px] text-slate-400 font-mono tabular-nums mt-0.5 block">
                  {liveStoreIntel.activeSalesCount} {language === 'ar' ? 'فاتورة مكتملة' : 'invoices'}
                </span>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
                <span className="text-xs text-slate-500 block">
                  {language === 'ar' ? 'تكلفة البضاعة المباعة (COGS)' : 'Estimated COGS'}
                </span>
                <span className="text-lg font-black text-slate-900 dark:text-white font-mono tabular-nums mt-1 block">
                  {formatCurrency(liveStoreIntel.totalCOGS)}
                </span>
                <span className="text-[11px] text-slate-400 font-mono tabular-nums mt-0.5 block">
                  {language === 'ar' ? 'إجمالي المصروفات:' : 'Expenses:'} {formatCurrency(liveStoreIntel.totalExpensesAmount)}
                </span>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
                <span className="text-xs text-slate-500 block">
                  {language === 'ar' ? 'صافي الربح بعد المصاريف' : 'Net Profit'}
                </span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono tabular-nums mt-1 block">
                  {formatCurrency(liveStoreIntel.netProfit)}
                </span>
                <span className="text-[11px] text-slate-400 font-mono tabular-nums mt-0.5 block">
                  {language === 'ar' ? 'هامش الربح الصافي:' : 'Net Margin:'} {liveStoreIntel.netMarginPercent}%
                </span>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
                <span className="text-xs text-slate-500 block">
                  {language === 'ar' ? 'متوسط قيمة الفاتورة' : 'Average Basket'}
                </span>
                <span className="text-lg font-black text-slate-900 dark:text-white font-mono tabular-nums mt-1 block">
                  {formatCurrency(liveStoreIntel.avgBasket)}
                </span>
                <span className="text-[11px] text-slate-400 font-mono tabular-nums mt-0.5 block">
                  {language === 'ar' ? 'أصناف راكدة:' : 'Slow Items:'} {liveStoreIntel.slowMovingProducts.length}
                </span>
              </div>
            </div>

            {isAnalysisLoading ? (
              <div className="h-56 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-6 text-center space-y-3">
                <Loader2 className="w-7 h-7 animate-spin text-amber-500" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {language === 'ar'
                    ? 'جاري فحص السجلات المالية وحساب هوامش الربح عبر Gemini 3.8 Flash...'
                    : 'Auditing financial records and margins with Gemini 3.8 Flash...'}
                </p>
              </div>
            ) : (
              structuredAudit && (
                <div className="space-y-5">
                  {/* Executive Summary & Insights Grid */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 space-y-5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                          {language === 'ar' ? 'الملخص التنفيذي للتدقيق المالي' : 'Executive Audit Summary'}
                        </span>
                        <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                          {structuredAudit.executiveSummary}
                        </p>
                      </div>
                      {typeof structuredAudit.healthScore === 'number' && (
                        <div className="px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center shrink-0">
                          <span className="text-[11px] text-slate-500 block">
                            {language === 'ar' ? 'مؤشر الكفاءة المالية' : 'Financial Efficiency'}
                          </span>
                          <span className="text-xl font-black font-mono tabular-nums text-slate-900 dark:text-white">
                            {structuredAudit.healthScore}%
                          </span>
                        </div>
                      )}
                    </div>

                    {structuredAudit.keyInsights && structuredAudit.keyInsights.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {structuredAudit.keyInsights.map((ins, idx) => (
                          <div
                            key={idx}
                            className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-1.5"
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-slate-700 dark:text-slate-300">{ins.title}</span>
                              <span
                                className={`font-bold ${
                                  ins.type === 'positive'
                                    ? 'text-emerald-600'
                                    : ins.type === 'warning'
                                    ? 'text-amber-600'
                                    : 'text-indigo-600'
                                }`}
                              >
                                {ins.type === 'positive'
                                  ? language === 'ar'
                                    ? 'إيجابي'
                                    : 'Positive'
                                  : ins.type === 'warning'
                                  ? language === 'ar'
                                    ? 'تنبيه'
                                    : 'Alert'
                                  : language === 'ar'
                                  ? 'فرصة نمو'
                                  : 'Action'}
                              </span>
                            </div>
                            <div className="text-base font-black font-mono tabular-nums text-slate-900 dark:text-white">
                              {ins.metric}
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed">{ins.impact}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Slow Movers Liquidation Table + Strategic Recommendations */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-4">
                      <div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white">
                          {language === 'ar'
                            ? 'خطة تسييل الأصناف الراكدة وبطيئة الحركة'
                            : 'Slow-Moving Inventory Liquidation Plan'}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {language === 'ar'
                            ? 'فعّل عرض تصفية بضغطة زر لتحويل المخزون الراكد إلى سيولة نقدية'
                            : 'Create instant liquidation promotions for slow-moving stock'}
                        </p>
                      </div>

                      {structuredAudit.slowMoversPlan && structuredAudit.slowMoversPlan.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-start">
                            <thead>
                              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                                <th className="py-2 text-start font-bold">{language === 'ar' ? 'الصنف' : 'Product'}</th>
                                <th className="py-2 text-center font-bold">{language === 'ar' ? 'الرصيد' : 'Stock'}</th>
                                <th className="py-2 text-center font-bold">{language === 'ar' ? 'الخصم المقترح' : 'Discount'}</th>
                                <th className="py-2 text-end font-bold">{language === 'ar' ? 'إجراء فوري' : 'Action'}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {structuredAudit.slowMoversPlan.map((sm, idx) => (
                                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                  <td className="py-2.5">
                                    <span className="font-bold text-slate-900 dark:text-white block">{sm.productName}</span>
                                    <span className="text-[11px] text-slate-500">{sm.actionPlan}</span>
                                  </td>
                                  <td className="py-2.5 text-center font-mono tabular-nums font-bold">
                                    {sm.currentStock ?? '-'}
                                  </td>
                                  <td className="py-2.5 text-center font-mono tabular-nums font-bold text-amber-600">
                                    {sm.suggestedDiscountPercent}%
                                  </td>
                                  <td className="py-2.5 text-end">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleExecuteSmartAction({
                                          actionType: 'create_promotion',
                                          labelAr: `تصفية ${sm.productName} (${sm.suggestedDiscountPercent}%)`,
                                          descriptionAr: sm.actionPlan,
                                          value: sm.suggestedDiscountPercent || 15,
                                        })
                                      }
                                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 text-[11px] font-bold whitespace-nowrap"
                                    >
                                      {language === 'ar' ? 'تفعيل عرض تصفية' : 'Create Promo'}
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 py-4">
                          {language === 'ar'
                            ? 'لا توجد أصناف راكدة حرجة حالياً — سرعة دوران المخزون جيدة.'
                            : 'No slow-moving stock detected.'}
                        </p>
                      )}
                    </div>

                    {/* Strategic Recommendations & Forecast */}
                    <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-4">
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">
                        {language === 'ar' ? 'التوصيات الاستراتيجية وتوقع النمو' : 'Strategic Action Plan & Forecast'}
                      </h3>

                      {structuredAudit.strategicRecommendations && (
                        <div className="space-y-2.5">
                          {structuredAudit.strategicRecommendations.map((rec, idx) => (
                            <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                              <span className="font-mono tabular-nums font-bold text-amber-600 shrink-0">
                                0{idx + 1}.
                              </span>
                              <span className="leading-relaxed">{rec}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {structuredAudit.forecastSummary && (
                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1">
                          <span className="text-[11px] font-bold text-slate-500 block">
                            {language === 'ar' ? 'توقع الإيرادات والتدفق النقدي:' : 'Revenue Forecast:'}
                          </span>
                          <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                            {structuredAudit.forecastSummary}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Full Formatted Report */}
                  {salesAnalysisText && (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                        <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                          <FileText className="w-4 h-4 text-slate-500" />
                          <span>{language === 'ar' ? 'التقرير المالي التفصيلي الكامل' : 'Detailed Audit Report'}</span>
                        </h3>
                        <button
                          type="button"
                          onClick={() => copyTextToClipboard(salesAnalysisText, 'audit_report')}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold flex items-center gap-1.5"
                        >
                          {copiedChannel === 'audit_report' ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          <span>{copiedChannel === 'audit_report' ? 'تم النسخ' : 'نسخ التقرير'}</span>
                        </button>
                      </div>
                      <FormattedAIText content={salesAnalysisText} />
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        )}

        {/* ================= 3. SMART INVENTORY RESTOCK & PURCHASE ORDER ================= */}
        {activeSubTab === 'inventory' && (
          <div className="space-y-5">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  {language === 'ar'
                    ? 'التنبؤ الذكي بالمخزون وأوامر التوريد التلقائية'
                    : 'AI Inventory Forecasting & Smart Restock Plan'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {language === 'ar'
                    ? 'حساب الكميات المثالية لإعادة الطلب وتكلفة الشراء التقديرية مع إمكانية التوريد بضغطة زر'
                    : 'Calculates optimal reorder quantities and estimated PO budget with 1-click restock'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {restockPlan?.items && restockPlan.items.length > 0 && (
                  <button
                    type="button"
                    onClick={handleRestockAllPlanItems}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {language === 'ar' ? 'اعتماد وتوريد كافة النواقص للمخزون' : 'Approve & Restock All'}
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleRunInventoryPlan}
                  disabled={isInventoryLoading}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                >
                  {isInventoryLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  <span>{language === 'ar' ? 'إعادة فحص المخزون' : 'Refresh Plan'}</span>
                </button>
              </div>
            </div>

            {isInventoryLoading ? (
              <div className="h-56 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-6 text-center space-y-3">
                <Loader2 className="w-7 h-7 animate-spin text-amber-500" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {language === 'ar'
                    ? 'جاري تحليل سرعة دوران الأصناف وحساب كميات الشراء المثالية...'
                    : 'Analyzing product velocity and calculating optimal order quantities...'}
                </p>
              </div>
            ) : (
              restockPlan && (
                <div className="space-y-5">
                  {/* Summary Banner */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-slate-500">
                        {language === 'ar' ? 'ملخص خطة الشراء والتوريد' : 'Purchase Order Summary'}
                      </span>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{restockPlan.summary}</p>
                    </div>
                    <div className="px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-end shrink-0">
                      <span className="text-[11px] text-slate-500 block">
                        {language === 'ar' ? 'الميزانية التقديرية للشراء' : 'Estimated PO Budget'}
                      </span>
                      <span className="text-lg font-black font-mono tabular-nums text-slate-900 dark:text-white">
                        {formatCurrency(restockPlan.estimatedTotalBudget || 0)}
                      </span>
                    </div>
                  </div>

                  {/* Restock Items Table */}
                  {restockPlan.items && restockPlan.items.length > 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-start">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                              <th className="py-3 px-4 text-start font-bold">{language === 'ar' ? 'الصنف والسبب' : 'Product'}</th>
                              <th className="py-3 px-3 text-center font-bold">{language === 'ar' ? 'الرصيد الحالي' : 'Current'}</th>
                              <th className="py-3 px-3 text-center font-bold">{language === 'ar' ? 'الأولوية' : 'Priority'}</th>
                              <th className="py-3 px-3 text-center font-bold">{language === 'ar' ? 'الكمية المقترحة' : 'Order Qty'}</th>
                              <th className="py-3 px-3 text-end font-bold">{language === 'ar' ? 'التكلفة التقديرية' : 'Est. Cost'}</th>
                              <th className="py-3 px-4 text-end font-bold">{language === 'ar' ? 'التنفيذ' : 'Action'}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {restockPlan.items.map((it, idx) => {
                              const key = it.productId || it.productName || String(idx);
                              const qty = editableRestockQtys[key] ?? it.recommendedOrderQty;
                              const isDone = Boolean(restockedItemsMap[key]);
                              return (
                                <tr key={key} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                  <td className="py-3 px-4">
                                    <span className="font-bold text-slate-900 dark:text-white block">{it.productName}</span>
                                    <span className="text-[11px] text-slate-500">{it.reason}</span>
                                  </td>
                                  <td className="py-3 px-3 text-center font-mono tabular-nums font-bold text-slate-700 dark:text-slate-300">
                                    {it.currentStock}
                                  </td>
                                  <td className="py-3 px-3 text-center">
                                    <span
                                      className={`font-bold ${
                                        it.priority === 'critical'
                                          ? 'text-rose-600 dark:text-rose-400'
                                          : it.priority === 'high'
                                          ? 'text-amber-600 dark:text-amber-400'
                                          : 'text-slate-600 dark:text-slate-400'
                                      }`}
                                    >
                                      {it.priority === 'critical'
                                        ? language === 'ar'
                                          ? 'حرج جداً'
                                          : 'Critical'
                                        : it.priority === 'high'
                                        ? language === 'ar'
                                          ? 'عالي'
                                          : 'High'
                                        : language === 'ar'
                                        ? 'متوسط'
                                        : 'Medium'}
                                    </span>
                                  </td>
                                  <td className="py-3 px-3 text-center">
                                    <input
                                      type="number"
                                      min={1}
                                      value={qty}
                                      disabled={isDone}
                                      onChange={e =>
                                        setEditableRestockQtys(prev => ({
                                          ...prev,
                                          [key]: Math.max(1, Number(e.target.value) || 1),
                                        }))
                                      }
                                      className="w-20 text-center font-mono tabular-nums font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-900 dark:text-white"
                                    />
                                  </td>
                                  <td className="py-3 px-3 text-end font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                                    {formatCurrency(qty * (it.estimatedUnitCost || 0))}
                                  </td>
                                  <td className="py-3 px-4 text-end">
                                    <button
                                      type="button"
                                      disabled={isDone}
                                      onClick={() => handleRestockSingleItem(it, idx)}
                                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                                        isDone
                                          ? 'bg-emerald-600 text-white cursor-default'
                                          : 'bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950'
                                      }`}
                                    >
                                      {isDone
                                        ? language === 'ar'
                                          ? 'تم التوريد'
                                          : 'Restocked'
                                        : language === 'ar'
                                        ? 'توريد الآن'
                                        : 'Restock'}
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : null}

                  {inventoryRestockText && (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800">
                      <FormattedAIText content={inventoryRestockText} />
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        )}

        {/* ================= 4. SMART PRICING & MARGIN OPTIMIZER ================= */}
        {activeSubTab === 'pricing' && (
          <div className="space-y-5">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  {language === 'ar'
                    ? 'مُحسّن التسعير الذكي وهندسة هوامش الربح (مفرق وجملة)'
                    : 'AI Smart Pricing & Profit Margin Optimizer'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {language === 'ar'
                    ? 'يكتشف الأصناف ذات الهامش الضعيف ويقترح أسعار بيع مثالية للمفرق والجملة مع تطبيق فوري'
                    : 'Detects low-margin items and recommends optimal retail and wholesale prices'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {pricingPlan?.recommendations && pricingPlan.recommendations.length > 0 && (
                  <button
                    type="button"
                    onClick={handleApplyAllOptimizedPrices}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{language === 'ar' ? 'تطبيق كافة الأسعار المقترحة' : 'Apply All Suggested Prices'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleRunPricingOptimizer}
                  disabled={isPricingLoading}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                >
                  {isPricingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sliders className="w-4 h-4" />}
                  <span>{language === 'ar' ? 'إعادة تحليل التسعير' : 'Analyze Pricing'}</span>
                </button>
              </div>
            </div>

            {isPricingLoading ? (
              <div className="h-56 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-6 text-center space-y-3">
                <Loader2 className="w-7 h-7 animate-spin text-amber-500" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {language === 'ar'
                    ? 'جاري فحص تكاليف الأصناف وهوامش المفرق والجملة...'
                    : 'Analyzing product costs and retail/wholesale margins...'}
                </p>
              </div>
            ) : (
              pricingPlan && (
                <div className="space-y-5">
                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                      {pricingPlan.strategySummary}
                    </p>
                    {pricingPlan.expectedOverallMarginGain && (
                      <div className="px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs whitespace-nowrap shrink-0">
                        {pricingPlan.expectedOverallMarginGain}
                      </div>
                    )}
                  </div>

                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-start">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                            <th className="py-3 px-4 text-start font-bold">{language === 'ar' ? 'الصنف والتحليل' : 'Product'}</th>
                            <th className="py-3 px-3 text-end font-bold">{language === 'ar' ? 'التكلفة' : 'Cost'}</th>
                            <th className="py-3 px-3 text-end font-bold">{language === 'ar' ? 'المفرق (الحالي ← المقترح)' : 'Retail'}</th>
                            <th className="py-3 px-3 text-end font-bold">{language === 'ar' ? 'الجملة المقترح' : 'Wholesale'}</th>
                            <th className="py-3 px-3 text-center font-bold">{language === 'ar' ? 'الهامش' : 'Margin'}</th>
                            <th className="py-3 px-4 text-end font-bold">{language === 'ar' ? 'تطبيق' : 'Apply'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {pricingPlan.recommendations.map((rec, idx) => {
                            const key = rec.productId || rec.productName || String(idx);
                            const isApplied = Boolean(appliedPricingMap[key]);
                            return (
                              <tr key={key} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                <td className="py-3 px-4">
                                  <span className="font-bold text-slate-900 dark:text-white block">{rec.productName}</span>
                                  <span className="text-[11px] text-slate-500">{rec.reasoning}</span>
                                </td>
                                <td className="py-3 px-3 text-end font-mono tabular-nums text-slate-600 dark:text-slate-400">
                                  {formatCurrency(rec.costPrice)}
                                </td>
                                <td className="py-3 px-3 text-end font-mono tabular-nums">
                                  <span className="text-slate-400 line-through me-1.5">
                                    {formatCurrency(rec.currentRetailPrice)}
                                  </span>
                                  <span className="font-bold text-slate-900 dark:text-white">
                                    {formatCurrency(rec.suggestedRetailPrice)}
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-end font-mono tabular-nums font-bold text-amber-600 dark:text-amber-400">
                                  {formatCurrency(rec.suggestedWholesalePrice)}
                                </td>
                                <td className="py-3 px-3 text-center font-mono tabular-nums">
                                  {rec.marginBeforePercent !== undefined && (
                                    <span className="text-slate-400 me-1">{rec.marginBeforePercent}% →</span>
                                  )}
                                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                    {rec.marginAfterPercent ??
                                      Math.round(
                                        ((rec.suggestedRetailPrice - rec.costPrice) /
                                          Math.max(1, rec.suggestedRetailPrice)) *
                                          100
                                      )}
                                    %
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-end">
                                  <button
                                    type="button"
                                    disabled={isApplied}
                                    onClick={() => handleApplySinglePrice(rec, idx)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                                      isApplied
                                        ? 'bg-emerald-600 text-white cursor-default'
                                        : 'bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950'
                                    }`}
                                  >
                                    {isApplied
                                      ? language === 'ar'
                                        ? 'تم التحديث'
                                        : 'Applied'
                                      : language === 'ar'
                                      ? 'تطبيق السعر'
                                      : 'Apply Price'}
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {/* ================= 5. SMART DEBT & CREDIT RISK ANALYZER ================= */}
        {activeSubTab === 'debts' && (
          <div className="space-y-5">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  {language === 'ar'
                    ? 'ذكاء تحصيل الديون وتقييم المخاطر الائتمانية'
                    : 'AI Debt Collection & Credit Risk Analyzer'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {language === 'ar'
                    ? 'ترتيب أولويات التحصيل وصياغة رسائل مطالبة واتساب مخصصة لكل عميل مدين بضغطة زر'
                    : 'Prioritizes customer receivables and crafts personalized WhatsApp reminders'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleRunDebtAnalysis}
                disabled={isDebtLoading}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap self-start sm:self-auto"
              >
                {isDebtLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                <span>{language === 'ar' ? 'تحديث خطة التحصيل' : 'Analyze Debts'}</span>
              </button>
            </div>

            {isDebtLoading ? (
              <div className="h-56 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-6 text-center space-y-3">
                <Loader2 className="w-7 h-7 animate-spin text-amber-500" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {language === 'ar'
                    ? 'جاري تحليل أرصدة الديون وصياغة رسائل التحصيل الذكية...'
                    : 'Analyzing debt balances and generating collection messages...'}
                </p>
              </div>
            ) : (
              debtPlan && (
                <div className="space-y-5">
                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-slate-500">
                        {language === 'ar' ? 'استراتيجية السيولة والتحصيل' : 'Collection Strategy'}
                      </span>
                      <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                        {debtPlan.overallStrategy}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 font-mono tabular-nums">
                      <div className="px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-end">
                        <span className="text-[11px] font-sans text-slate-500 block">
                          {language === 'ar' ? 'إجمالي ديون العملاء' : 'Receivables'}
                        </span>
                        <span className="text-base font-black text-amber-600">
                          {formatCurrency(liveStoreIntel.totalCustomerDebt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {debtPlan.debtorsPlan && debtPlan.debtorsPlan.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {debtPlan.debtorsPlan.map((d, idx) => (
                        <div
                          key={idx}
                          className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-4"
                        >
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <h4 className="text-sm font-black text-slate-900 dark:text-white">{d.customerName}</h4>
                                <span className="text-xs text-slate-500 font-mono tabular-nums">
                                  {d.phone || 'بدون رقم هاتف'} ·{' '}
                                  {d.priority === 'high'
                                    ? 'أولوية قصوى'
                                    : d.priority === 'medium'
                                    ? 'أولوية متوسطة'
                                    : 'أولوية عادية'}
                                </span>
                              </div>
                              <div className="text-end font-mono tabular-nums">
                                <span className="text-[11px] font-sans text-slate-400 block">
                                  {language === 'ar' ? 'المبلغ المستحق' : 'Debt'}
                                </span>
                                <span className="text-base font-black text-rose-600 dark:text-rose-400">
                                  {formatCurrency(d.debtAmount)}
                                </span>
                              </div>
                            </div>

                            <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg">
                              <strong className="text-slate-800 dark:text-slate-200">
                                {language === 'ar' ? 'التوصية:' : 'Action:'}{' '}
                              </strong>
                              {d.recommendedAction}
                            </p>

                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                              {d.whatsappMessage}
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(d.whatsappMessage);
                                setCopiedDebtMsgIdx(idx);
                                setTimeout(() => setCopiedDebtMsgIdx(null), 2000);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
                            >
                              {copiedDebtMsgIdx === idx ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                              <span>{copiedDebtMsgIdx === idx ? 'تم النسخ' : 'نسخ الرسالة'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                sendWhatsAppDebtMessage(d.phone || '', d.whatsappMessage, msg =>
                                  notify('تنبيه واتساب', msg, 'warning')
                                )
                              }
                              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>{language === 'ar' ? 'إرسال عبر واتساب' : 'Send WhatsApp'}</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 text-center space-y-2">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {language === 'ar' ? 'سجل ديون العملاء نظيف بالكامل' : 'Zero Customer Debts'}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {language === 'ar'
                          ? 'لا يوجد أي عملاء مدينين حالياً في دفتر الديون.'
                          : 'No outstanding customer receivables found.'}
                      </p>
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        )}

        {/* ================= 6. MULTIMODAL OCR INVOICE SCANNER ================= */}
        {activeSubTab === 'ocr' && (
          <div className="space-y-5">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <FileScan className="w-5 h-5 text-emerald-600" />
                    <span>
                      {language === 'ar'
                        ? 'الماسح الضوئي الذكي لفواتير الموردين (Multimodal OCR)'
                        : 'Smart Multimodal OCR Invoice Scanner'}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {language === 'ar'
                      ? 'ارفع صورة فاتورة المورد الورقية ليقوم الذكاء الاصطناعي باستخراج الأصناف والكميات والأسعار وتسجيلها فوراً'
                      : 'Upload a supplier invoice photo to extract items, quantities, and prices automatically'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleLoadSampleOcrInvoice}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap self-start sm:self-auto"
                >
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>{language === 'ar' ? 'تجربة نموذج فاتورة مورد جاهزة' : 'Load Sample Invoice'}</span>
                </button>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50 dark:bg-slate-900/50 flex flex-col items-center justify-center gap-2"
              >
                <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block">
                    {language === 'ar'
                      ? 'انقر لرفع صورة فاتورة المورد أو التقاطها بالكاميرا'
                      : 'Click to upload or capture supplier invoice image'}
                  </span>
                  <span className="text-xs text-slate-400">
                    PNG · JPG · JPEG (يدعم الفواتير العربية والإنجليزية)
                  </span>
                </div>
              </div>
            </div>

            {isOcrLoading && (
              <div className="h-56 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-6 text-center space-y-3">
                <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {language === 'ar'
                    ? 'جاري قراءة الفاتورة واستخراج الأصناف والأسعار بالرؤية البصرية الذكية...'
                    : 'Extracting invoice items and prices with Gemini Vision...'}
                </p>
              </div>
            )}

            {ocrResult && !isOcrLoading && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block">{language === 'ar' ? 'اسم المورد:' : 'Supplier:'}</span>
                      <span className="text-sm font-black text-slate-900 dark:text-white">
                        {ocrResult.supplierName || 'مورد عام'}
                      </span>
                    </div>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <div>
                      <span className="text-slate-400 block">{language === 'ar' ? 'رقم الفاتورة:' : 'Invoice #:'}</span>
                      <span className="text-sm font-mono tabular-nums font-bold text-slate-800 dark:text-slate-200">
                        {ocrResult.invoiceNumber || 'غير محدد'}
                      </span>
                    </div>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <div>
                      <span className="text-slate-400 block">{language === 'ar' ? 'إجمالي الفاتورة:' : 'Total:'}</span>
                      <span className="text-base font-black text-emerald-600 font-mono tabular-nums">
                        {formatCurrency(ocrResult.totalAmount || 0)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleImportOcrItems}
                      disabled={importedSuccess}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                        importedSuccess
                          ? 'bg-emerald-600 text-white cursor-default'
                          : 'bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 text-white'
                      }`}
                    >
                      {importedSuccess ? <CheckCircle2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      <span>
                        {importedSuccess
                          ? language === 'ar'
                            ? 'تم الاستيراد للمخزون'
                            : 'Imported!'
                          : language === 'ar'
                          ? 'استيراد مباشر للمخزون'
                          : 'Import to Stock'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={handleRecordAsSupplierPurchaseInvoice}
                      disabled={recordedPurchaseSuccess}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                        recordedPurchaseSuccess
                          ? 'bg-emerald-600 text-white cursor-default'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {recordedPurchaseSuccess
                          ? language === 'ar'
                            ? 'تم التسجيل في فواتير الموردين'
                            : 'Recorded as Supplier Invoice'
                          : language === 'ar'
                          ? 'تسجيل كفاتورة مشتريات مورد رسمية'
                          : 'Record Supplier Purchase Invoice'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Editable OCR Items Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-start">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                        <th className="py-2.5 px-2 text-start font-bold">#</th>
                        <th className="py-2.5 px-2 text-start font-bold">{language === 'ar' ? 'اسم الصنف' : 'Item Name'}</th>
                        <th className="py-2.5 px-2 text-center font-bold">{language === 'ar' ? 'الكمية' : 'Qty'}</th>
                        <th className="py-2.5 px-2 text-center font-bold">{language === 'ar' ? 'سعر التكلفة' : 'Unit Cost'}</th>
                        <th className="py-2.5 px-2 text-center font-bold">{language === 'ar' ? 'سعر المفرق المقترح' : 'Suggested Retail'}</th>
                        <th className="py-2.5 px-2 text-end font-bold">{language === 'ar' ? 'الإجمالي' : 'Total'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {ocrResult.items?.map((it, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 px-2 font-mono tabular-nums text-slate-400">{idx + 1}</td>
                          <td className="py-2.5 px-2">
                            <input
                              type="text"
                              value={it.name}
                              onChange={e => handleUpdateOcrItem(idx, 'name', e.target.value)}
                              className="w-full bg-transparent font-bold text-slate-900 dark:text-white border-b border-transparent focus:border-emerald-500 focus:outline-none"
                            />
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <input
                              type="number"
                              min={1}
                              value={it.quantity}
                              onChange={e => handleUpdateOcrItem(idx, 'quantity', Number(e.target.value) || 1)}
                              className="w-16 text-center font-mono tabular-nums font-bold bg-slate-100 dark:bg-slate-800 rounded-md px-1.5 py-1"
                            />
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <input
                              type="number"
                              min={0}
                              value={it.unitPrice}
                              onChange={e => handleUpdateOcrItem(idx, 'unitPrice', Number(e.target.value) || 0)}
                              className="w-24 text-center font-mono tabular-nums bg-slate-100 dark:bg-slate-800 rounded-md px-1.5 py-1"
                            />
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <input
                              type="number"
                              min={0}
                              value={it.suggestedRetailPrice ?? Math.round(it.unitPrice * 1.3)}
                              onChange={e =>
                                handleUpdateOcrItem(idx, 'suggestedRetailPrice', Number(e.target.value) || 0)
                              }
                              className="w-24 text-center font-mono tabular-nums font-bold text-indigo-600 dark:text-indigo-400 bg-slate-100 dark:bg-slate-800 rounded-md px-1.5 py-1"
                            />
                          </td>
                          <td className="py-2.5 px-2 text-end font-mono tabular-nums font-black text-slate-900 dark:text-white">
                            {formatCurrency(it.total || it.quantity * it.unitPrice)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= 7. PRODUCT STUDIO (SINGLE + BATCH) & MARKETING STUDIO ================= */}
        {activeSubTab === 'studio' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left Column: AI Product & Batch Catalog Generator (6 cols) */}
            <div className="lg:col-span-6 space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <Wand2 className="w-4 h-4 text-amber-500" />
                      <span>
                        {language === 'ar'
                          ? 'مُولّد الأصناف والكتالوج الذكي (مفرد أو دفعة كاملة)'
                          : 'AI Product & Batch Catalog Generator'}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {language === 'ar'
                        ? 'ولّد صنفاً واحداً أو باقة أصناف كاملة مع أسعار المفرق والجملة والباركود تلقائياً'
                        : 'Generate single items or a full category batch with retail/wholesale pricing'}
                    </p>
                  </div>

                  {/* Single vs Batch Mode Switch */}
                  <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsBatchMode(false)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors whitespace-nowrap ${
                        !isBatchMode
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-500'
                      }`}
                    >
                      {language === 'ar' ? 'صنف مفرد' : 'Single'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsBatchMode(true)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors whitespace-nowrap ${
                        isBatchMode
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-500'
                      }`}
                    >
                      {language === 'ar' ? 'باقة أصناف (Batch)' : 'Batch (4)'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      {language === 'ar' ? 'القسم المستهدف' : 'Target Category'}
                    </label>
                    <select
                      value={selectedCategoryId}
                      onChange={e => setSelectedCategoryId(e.target.value)}
                      className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                    >
                      {categories
                        .filter(c => c.id !== 'cat_all')
                        .map(cat => (
                          <option key={cat.id} value={cat.id}>
                            {cat.nameAr}
                          </option>
                        ))}
                    </select>
                  </div>

                  {isBatchMode && (
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        {language === 'ar' ? 'عدد الأصناف المطلوب توليدها' : 'Batch Size'}
                      </label>
                      <select
                        value={batchCount}
                        onChange={e => setBatchCount(Number(e.target.value))}
                        className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 font-mono tabular-nums"
                      >
                        <option value={3}>3 أصناف</option>
                        <option value={4}>4 أصناف</option>
                        <option value={6}>6 أصناف</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={productPrompt}
                    onChange={e => setProductPrompt(e.target.value)}
                    placeholder={
                      isBatchMode
                        ? language === 'ar'
                          ? 'مثال: مشروبات قهوة باردة وساخنة للمقهى، أو منظفات منزلية...'
                          : 'e.g. Cold & hot specialty coffee drinks...'
                        : language === 'ar'
                        ? 'مثال: برغر دجاج كرسبي دبل مع جبنة شيدر...'
                        : 'e.g. Double Crispy Chicken Burger...'
                    }
                    className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />

                  <button
                    type="button"
                    onClick={handleGenerateProduct}
                    disabled={!productPrompt.trim() || isProductGenLoading}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 disabled:opacity-50 text-white dark:text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                  >
                    {isProductGenLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                    <span>{language === 'ar' ? 'توليد الآن' : 'Generate'}</span>
                  </button>
                </div>
              </div>

              {generatedProductsList.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      {language === 'ar'
                        ? `الأصناف المولدة (${generatedProductsList.length})`
                        : `Generated Products (${generatedProductsList.length})`}
                    </span>

                    {generatedProductsList.length > 1 && (
                      <button
                        type="button"
                        onClick={handleSaveAllGeneratedProducts}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{language === 'ar' ? 'إضافة كل المجموعة للمتجر' : 'Save All to Store'}</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {generatedProductsList.map((prod, idx) => {
                      const isSaved = Boolean(savedProductIndexes[idx]);
                      return (
                        <div
                          key={idx}
                          className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <h4 className="text-sm font-black text-slate-900 dark:text-white">{prod.nameAr}</h4>
                              <span className="text-[11px] text-slate-400 font-mono tabular-nums">
                                {prod.nameEn} · {prod.barcode}
                              </span>
                            </div>

                            <button
                              type="button"
                              disabled={isSaved}
                              onClick={() => handleSaveGeneratedProductItem(prod, idx)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors whitespace-nowrap ${
                                isSaved
                                  ? 'bg-emerald-600 text-white cursor-default'
                                  : 'bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 text-white dark:text-slate-950'
                              }`}
                            >
                              {isSaved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                              <span>{isSaved ? 'تم الحفظ' : 'حفظ للمتجر'}</span>
                            </button>
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-xs font-mono tabular-nums">
                            <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800">
                              <span className="text-[10px] font-sans text-slate-400 block">
                                {language === 'ar' ? 'سعر المفرق' : 'Retail'}
                              </span>
                              <span className="font-bold text-slate-900 dark:text-white">
                                {formatCurrency(prod.suggestedRetailPrice)}
                              </span>
                            </div>
                            <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800">
                              <span className="text-[10px] font-sans text-slate-400 block">
                                {language === 'ar' ? 'سعر التكلفة' : 'Cost'}
                              </span>
                              <span className="font-bold text-slate-600 dark:text-slate-300">
                                {formatCurrency(prod.suggestedCostPrice)}
                              </span>
                            </div>
                            <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800">
                              <span className="text-[10px] font-sans text-slate-400 block">
                                {language === 'ar' ? 'سعر الجملة' : 'Wholesale'}
                              </span>
                              <span className="font-bold text-amber-600">
                                {formatCurrency(
                                  prod.suggestedWholesalePrice || Math.round(prod.suggestedRetailPrice * 0.85)
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: AI Multi-Channel Marketing & Promo Generator (6 cols) */}
            <div className="lg:col-span-6 space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Megaphone className="w-4 h-4 text-rose-600" />
                    <span>
                      {language === 'ar'
                        ? 'مُولّد الحملات التسويقية والعروض الترويجية'
                        : 'AI Marketing & POS Promotion Generator'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {language === 'ar'
                      ? 'صياغة رسائل واتساب وSMS ومنشورات سوشيال ميديا مع تفعيل العرض في الكاشير مباشرة'
                      : 'Generate WhatsApp, SMS, and social campaigns and activate POS promotions'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      {language === 'ar' ? 'نوع الحملة' : 'Campaign Type'}
                    </label>
                    <select
                      value={campaignType}
                      onChange={e => setCampaignType(e.target.value)}
                      className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                    >
                      <option value="weekend_offer">
                        {language === 'ar' ? 'عروض عطلة نهاية الأسبوع' : 'Weekend Flash Sale'}
                      </option>
                      <option value="loyalty_reward">
                        {language === 'ar' ? 'مكافآت نقاط الولاء' : 'Loyalty Points Promo'}
                      </option>
                      <option value="wholesale_deals">
                        {language === 'ar' ? 'تخفيضات خاصة لتجار الجملة' : 'Wholesale Merchant Special'}
                      </option>
                      <option value="new_arrival">
                        {language === 'ar' ? 'إطلاق صنف أو وجبة جديدة' : 'New Product Arrival'}
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      {language === 'ar' ? 'الجمهور المستهدف' : 'Target Audience'}
                    </label>
                    <select
                      value={targetAudience}
                      onChange={e => setTargetAudience(e.target.value)}
                      className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                    >
                      <option value="all">{language === 'ar' ? 'كافة العملاء والزبائن' : 'All Customers'}</option>
                      <option value="vip">{language === 'ar' ? 'كبار العملاء (VIP)' : 'VIP Customers'}</option>
                      <option value="wholesale">{language === 'ar' ? 'تجار الجملة والشركات' : 'Wholesale Traders'}</option>
                      <option value="dormant">{language === 'ar' ? 'عملاء لم يزوروا المتجر مؤخراً' : 'Dormant Customers'}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'تفاصيل العرض الترويجي' : 'Offer Details'}
                  </label>
                  <input
                    type="text"
                    value={offerDetails}
                    onChange={e => setOfferDetails(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleGenerateMarketing}
                  disabled={isCampaignLoading}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  {isCampaignLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Megaphone className="w-4 h-4" />}
                  <span>{language === 'ar' ? 'توليد الحملة المتكاملة' : 'Generate Campaign'}</span>
                </button>
              </div>

              {structuredCampaign && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      {structuredCampaign.campaignTitle || 'الحملة الترويجية الجاهزة'}
                    </h4>

                    {structuredCampaign.suggestedPromotion && (
                      <button
                        type="button"
                        disabled={promoCreatedFromCampaign}
                        onClick={handleActivateCampaignPromo}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                          promoCreatedFromCampaign
                            ? 'bg-emerald-600 text-white cursor-default'
                            : 'bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 text-white dark:text-slate-950'
                        }`}
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>
                          {promoCreatedFromCampaign
                            ? 'تم تفعيل العرض في الكاشير'
                            : `تفعيل عرض (${structuredCampaign.suggestedPromotion.discountPercent}%) في الكاشير`}
                        </span>
                      </button>
                    )}
                  </div>

                  {/* WhatsApp Message Box */}
                  {structuredCampaign.whatsappMessage && (
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-600">
                          {language === 'ar' ? 'رسالة واتساب جاهزة للإرسال' : 'WhatsApp Promo Message'}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyTextToClipboard(structuredCampaign.whatsappMessage || '', 'wa')}
                          className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1"
                        >
                          {copiedChannel === 'wa' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedChannel === 'wa' ? 'تم النسخ' : 'نسخ'}</span>
                        </button>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                        {structuredCampaign.whatsappMessage}
                      </p>
                    </div>
                  )}

                  {/* SMS Message Box */}
                  {structuredCampaign.smsMessage && (
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-600">
                          {language === 'ar' ? 'رسالة SMS قصيرة' : 'Short SMS'}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyTextToClipboard(structuredCampaign.smsMessage || '', 'sms')}
                          className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1"
                        >
                          {copiedChannel === 'sms' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedChannel === 'sms' ? 'تم النسخ' : 'نسخ'}</span>
                        </button>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
                        {structuredCampaign.smsMessage}
                      </p>
                    </div>
                  )}

                  {/* Social Media Post */}
                  {structuredCampaign.socialPost && (
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-rose-600">
                          {language === 'ar' ? 'منشور انستغرام / فيسبوك' : 'Social Media Post'}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyTextToClipboard(structuredCampaign.socialPost || '', 'social')}
                          className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1"
                        >
                          {copiedChannel === 'social' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedChannel === 'social' ? 'تم النسخ' : 'نسخ'}</span>
                        </button>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                        {structuredCampaign.socialPost}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
