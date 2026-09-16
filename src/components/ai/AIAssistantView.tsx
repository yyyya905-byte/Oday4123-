import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { aiService, ChatMessage, GeneratedProductData, OCRInvoiceData } from '../../services/aiService';
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
  Plus
} from 'lucide-react';

export const AIAssistantView: React.FC = () => {
  const {
    t,
    language,
    formatCurrency,
    sales = [],
    products = [],
    expenses = [],
    customers = [],
    businessMode,
    storeSettings,
    addProduct,
    categories = [],
  } = useApp();

  const safeProducts = products || [];
  const safeSales = sales || [];
  const safeCustomers = customers || [];
  const safeExpenses = expenses || [];

  const [activeSubTab, setActiveSubTab] = useState<'chat' | 'analysis' | 'inventory' | 'ocr' | 'marketing' | 'product_gen'>('chat');

  // 1. Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'model',
      content: language === 'ar'
        ? `مرحباً بك! أنا المستشار الذكي لنظامك (KIAN AI). أنا متصل ومطلع على بيانات متجرك اللحظية (${safeProducts.length} صنف، ${safeSales.length} فاتورة مسجلة). كيف يمكنني مساعدتك اليوم في تنمية تجارتك وزيادة أرباحك؟`
        : `Hello! I am your KIAN AI Assistant. Connected to your live store data (${safeProducts.length} products, ${safeSales.length} sales). How can I assist you in optimizing your business today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Pre-configured questions
  const quickQuestions = language === 'ar' ? [
    '📊 ما هي الأصناف الأكثر ربحية اليوم؟',
    '📦 كيف أحسن دوران المخزون للأصناف الراكدة؟',
    '💰 اقترح خطة تسعير جملة لزيادة مبيعات الكراتين',
    '🚀 اقترح أفكار عروض لزيادة المبيعات بنسبة 20%',
    '⚠️ ما هي أهم النصائح لخفض المصروفات التشغيلية؟',
  ] : [
    '📊 What are the most profitable items today?',
    '📦 How to liquidate slow-moving inventory?',
    '💰 Suggest wholesale pricing strategy',
    '🚀 Ideas to increase today sales by 20%',
    '⚠️ Tips to reduce operating expenses',
  ];

  // 2. Sales Analysis State
  const [salesAnalysisText, setSalesAnalysisText] = useState<string | null>(null);
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);

  // 3. Inventory Restock State
  const [inventoryRestockText, setInventoryRestockText] = useState<string | null>(null);
  const [isInventoryLoading, setIsInventoryLoading] = useState(false);

  // 4. Marketing Campaign State
  const [campaignType, setCampaignType] = useState('weekend_offer');
  const [targetAudience, setTargetAudience] = useState('all');
  const [offerDetails, setOfferDetails] = useState('خصم 15% على باقة المشروبات والوجبات، ونقاط مضاعفة لعملاء الولاء');
  const [campaignResult, setCampaignResult] = useState<string | null>(null);
  const [isCampaignLoading, setIsCampaignLoading] = useState(false);
  const [copiedCampaign, setCopiedCampaign] = useState(false);

  // 5. OCR Receipt Scanner State
  const [invoiceImage, setInvoiceImage] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<OCRInvoiceData | null>(null);
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [importedSuccess, setImportedSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 6. Product Generator State
  const [productPrompt, setProductPrompt] = useState('');
  const [generatedProduct, setGeneratedProduct] = useState<GeneratedProductData | null>(null);
  const [isProductGenLoading, setIsProductGenLoading] = useState(false);
  const [productAddedSuccess, setProductAddedSuccess] = useState(false);

  // Send Chat Message
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
      // Build summary context
      const context = {
        storeName: storeSettings?.storeNameAr || 'متجري',
        businessMode,
        totalProductsCount: safeProducts.length,
        lowStockProductsCount: safeProducts.filter(p => p.stock <= p.minStock).length,
        totalSalesCount: safeSales.length,
        totalCustomersCount: safeCustomers.length,
        totalExpensesCount: safeExpenses.length,
        topProducts: safeProducts.slice(0, 8).map(p => ({ name: p.nameAr, price: p.price, stock: p.stock, unit: p.unit })),
      };

      const history = [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const reply = await aiService.sendChatMessage(history, context);

      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'model',
          content: reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'model',
          content: language === 'ar'
            ? `⚠️ عذراً، تعذر الاتصال بنظام الذكاء الاصطناعي: ${err.message || 'يرجى التأكد من اتصال الخادم ومفتاح API في الإعدادات.'}`
            : `⚠️ Error communicating with AI: ${err.message || 'Please check server connection.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Run Sales Audit
  const handleRunSalesAnalysis = async () => {
    setIsAnalysisLoading(true);
    try {
      const result = await aiService.analyzeSales({
        sales,
        products,
        expenses,
        period: language === 'ar' ? 'البيانات الحالية' : 'Current Data',
        businessMode,
      });
      setSalesAnalysisText(result);
    } catch (err: any) {
      setSalesAnalysisText(`حدث خطأ أثناء التحليل: ${err.message}`);
    } finally {
      setIsAnalysisLoading(false);
    }
  };

  // Run Inventory Plan
  const handleRunInventoryPlan = async () => {
    setIsInventoryLoading(true);
    try {
      const result = await aiService.getInventoryRestockPlan({
        products,
        recentSales: sales.slice(-20),
      });
      setInventoryRestockText(result);
    } catch (err: any) {
      setInventoryRestockText(`حدث خطأ أثناء فحص المخزون: ${err.message}`);
    } finally {
      setIsInventoryLoading(false);
    }
  };

  // Generate Marketing Campaign
  const handleGenerateMarketing = async () => {
    setIsCampaignLoading(true);
    try {
      const result = await aiService.generateMarketingCampaign({
        campaignType,
        targetAudience,
        offerDetails,
        storeName: storeSettings.storeNameAr,
      });
      setCampaignResult(result);
    } catch (err: any) {
      setCampaignResult(`حدث خطأ أثناء توليد الحملة: ${err.message}`);
    } finally {
      setIsCampaignLoading(false);
    }
  };

  // OCR Image Upload Handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setInvoiceImage(base64);
      setOcrResult(null);
      setImportedSuccess(false);
      setIsOcrLoading(true);

      try {
        const data = await aiService.scanInvoiceImage(base64);
        setOcrResult(data);
      } catch (err: any) {
        alert(language === 'ar' ? `فشل في فحص الفاتورة: ${err.message}` : `Scan failed: ${err.message}`);
      } finally {
        setIsOcrLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Import OCR Items to Products Inventory
  const handleImportOcrItems = () => {
    if (!ocrResult || !ocrResult.items || ocrResult.items.length === 0) return;

    const defaultCategoryId = categories[0]?.id || 'cat-general';

    ocrResult.items.forEach((item, idx) => {
      const newProduct = {
        nameAr: item.name,
        nameEn: item.name,
        barcode: `OCR-${Date.now()}-${idx}`,
        sku: `SKU-${Date.now()}-${idx}`,
        categoryId: defaultCategoryId,
        price: Math.round(item.unitPrice * 1.3), // Suggested 30% margin
        costPrice: item.unitPrice,
        wholesalePrice: Math.round(item.unitPrice * 1.15),
        stock: item.quantity,
        minStock: 5,
        unit: item.unit || 'قطعة',
        isFavorite: false,
        status: 'active' as const,
        tradeType: 'both' as const,
      };
      addProduct(newProduct);
    });

    setImportedSuccess(true);
  };

  // Generate Product Details
  const handleGenerateProduct = async () => {
    if (!productPrompt.trim()) return;
    setIsProductGenLoading(true);
    setProductAddedSuccess(false);
    try {
      const data = await aiService.generateProductDetails({
        inputPrompt: productPrompt,
        categoryName: categories[0]?.nameAr || 'عام',
      });
      setGeneratedProduct(data);
    } catch (err: any) {
      alert(language === 'ar' ? `فشل التوليد: ${err.message}` : `Generation failed: ${err.message}`);
    } finally {
      setIsProductGenLoading(false);
    }
  };

  // Add Generated Product to Store
  const handleSaveGeneratedProduct = () => {
    if (!generatedProduct) return;
    const defaultCategoryId = categories[0]?.id || 'cat-general';

    addProduct({
      nameAr: generatedProduct.nameAr,
      nameEn: generatedProduct.nameEn || generatedProduct.nameAr,
      barcode: generatedProduct.barcode || `GEN-${Date.now()}`,
      sku: generatedProduct.sku || `SKU-${Date.now()}`,
      categoryId: defaultCategoryId,
      price: generatedProduct.suggestedRetailPrice || 1000,
      costPrice: generatedProduct.suggestedCostPrice || 700,
      wholesalePrice: generatedProduct.suggestedWholesalePrice || Math.round((generatedProduct.suggestedRetailPrice || 1000) * 0.85),
      wholesaleMinQty: generatedProduct.wholesaleMinQty || 6,
      wholesaleUnit: generatedProduct.wholesaleUnit || 'كرتونة',
      wholesaleUnitMultiplier: generatedProduct.wholesaleUnitMultiplier || 6,
      stock: 50,
      minStock: generatedProduct.minStock || 10,
      unit: generatedProduct.unit || 'قطعة',
      isFavorite: false,
      status: 'active',
      tradeType: 'both',
      notes: generatedProduct.notes,
    });

    setProductAddedSuccess(true);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Top Header Bar with Tabs */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 shrink-0 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {language === 'ar' ? 'منظومة الذكاء الاصطناعي (Gemini AI Engine)' : 'AI Intelligence System (Gemini)'}
                </h1>
                <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Gemini 3.7 Flash Active
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'ar'
                  ? 'مساعد مالي وإداري ذكي، تحليل المبيعات، قارئ فواتير OCR، اقتراحات التوريد والتسويق'
                  : 'Smart financial consultant, sales auditing, OCR receipt scanner, restocking & marketing campaigns'}
              </p>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              id="ai-tab-chat"
              onClick={() => setActiveSubTab('chat')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                activeSubTab === 'chat'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'المستشار المالي الذكي' : 'AI Advisor Chat'}</span>
            </button>

            <button
              id="ai-tab-analysis"
              onClick={() => {
                setActiveSubTab('analysis');
                if (!salesAnalysisText) handleRunSalesAnalysis();
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                activeSubTab === 'analysis'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'التحليل المالي والمبيعات' : 'Sales Audit'}</span>
            </button>

            <button
              id="ai-tab-inventory"
              onClick={() => {
                setActiveSubTab('inventory');
                if (!inventoryRestockText) handleRunInventoryPlan();
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                activeSubTab === 'inventory'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'إدارة النواقص والتوريد' : 'Restock Forecast'}</span>
            </button>

            <button
              id="ai-tab-ocr"
              onClick={() => setActiveSubTab('ocr')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                activeSubTab === 'ocr'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <FileScan className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'قارئ الفواتير (OCR)' : 'Invoice OCR'}</span>
            </button>

            <button
              id="ai-tab-marketing"
              onClick={() => setActiveSubTab('marketing')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                activeSubTab === 'marketing'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Megaphone className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'حملات تسويقية وعروض' : 'Marketing'}</span>
            </button>

            <button
              id="ai-tab-product_gen"
              onClick={() => setActiveSubTab('product_gen')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                activeSubTab === 'product_gen'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'مُولّد الأصناف' : 'Product Studio'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Tab Content Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-7xl mx-auto w-full">
        {/* ================= 1. AI CHAT ADVISOR ================= */}
        {activeSubTab === 'chat' && (
          <div className="h-full flex flex-col bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {/* Quick Context Strip */}
            <div className="p-3 px-4 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-3">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {language === 'ar' ? 'سياق النظام المباشر:' : 'Live Store Context:'}
                </span>
                <span>{safeProducts.length} {language === 'ar' ? 'صنف' : 'Items'}</span>
                <span>•</span>
                <span>{safeSales.length} {language === 'ar' ? 'فاتورة' : 'Sales'}</span>
                <span>•</span>
                <span>{safeCustomers.length} {language === 'ar' ? 'عميل' : 'Customers'}</span>
              </div>
              <button
                type="button"
                onClick={() => setMessages(messages.slice(0, 1))}
                className="text-[11px] text-slate-400 hover:text-rose-500 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{language === 'ar' ? 'مسح المحادثة' : 'Clear Chat'}</span>
              </button>
            </div>

            {/* Chat Messages List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-3xl ${
                    msg.role === 'user' ? 'ms-auto flex-row-reverse' : ''
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs ${
                      msg.role === 'user'
                        ? 'bg-amber-500 text-white'
                        : 'bg-gradient-to-tr from-amber-500 to-indigo-600 text-white'
                    }`}
                  >
                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  <div className="space-y-1 max-w-[85%]">
                    <div
                      className={`p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                        msg.role === 'user'
                          ? 'bg-amber-500 text-white font-medium rounded-tr-xs'
                          : 'bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 rounded-tl-xs border border-slate-200/60 dark:border-slate-700/60'
                      }`}
                    >
                      {msg.content}
                    </div>
                    <div
                      className={`text-[10px] text-slate-400 px-1 font-mono ${
                        msg.role === 'user' ? 'text-end' : 'text-start'
                      }`}
                    >
                      {msg.timestamp}
                    </div>
                  </div>
                </div>
              ))}

              {isChatLoading && (
                <div className="flex gap-3 max-w-3xl">
                  <div className="w-8 h-8 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 text-white flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center gap-2 text-xs">
                    <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                    <span>{language === 'ar' ? 'جاري التفكير وتحليل البيانات...' : 'Analyzing store data...'}</span>
                  </div>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>

            {/* Quick Suggestion Chips */}
            <div className="px-4 py-2 bg-slate-50/50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              {quickQuestions.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(q)}
                  disabled={isChatLoading}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-medium shrink-0 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Chat Input Bar */}
            <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  id="ai-chat-input"
                  type="text"
                  value={inputPrompt}
                  onChange={e => setInputPrompt(e.target.value)}
                  placeholder={
                    language === 'ar'
                      ? 'اسأل المستشار الذكي عن أي شيء في مبيعاتك، المخزون، أو خطط التسعير...'
                      : 'Ask anything about your sales, inventory, or pricing strategies...'
                  }
                  disabled={isChatLoading}
                  className="flex-1 bg-slate-100 dark:bg-slate-800 border-0 rounded-2xl px-4 py-3 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />

                <button
                  id="ai-chat-send-btn"
                  type="submit"
                  disabled={!inputPrompt.trim() || isChatLoading}
                  className="w-11 h-11 rounded-2xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white flex items-center justify-center transition-all shadow-xs shrink-0"
                >
                  {isChatLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ================= 2. SALES AUDIT & FINANCIAL ANALYSIS ================= */}
        {activeSubTab === 'analysis' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                  <span>{language === 'ar' ? 'التقرير المالي الذكي وتحليل الأرباح' : 'AI Financial Audit & Sales Intelligence'}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {language === 'ar'
                    ? 'يقوم Gemini AI بفحص جميع الفواتير والمبيعات ومصروفات المحل واكتشاف فرص زيادة الدخل'
                    : 'Deep AI audit examining your revenue margins, expense ratios, and fastest-growing items.'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleRunSalesAnalysis}
                disabled={isAnalysisLoading}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-xs self-start sm:self-auto"
              >
                {isAnalysisLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                <span>{language === 'ar' ? 'إعادة تحليل البيانات الآن' : 'Run Full Audit Now'}</span>
              </button>
            </div>

            {isAnalysisLoading ? (
              <div className="h-64 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-6 text-center space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {language === 'ar' ? 'جاري معالجة الفواتير وحساب هوامش الربح...' : 'Crunching financial data & margins...'}
                </p>
              </div>
            ) : salesAnalysisText ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm leading-relaxed whitespace-pre-wrap text-sm text-slate-800 dark:text-slate-200">
                {salesAnalysisText}
              </div>
            ) : null}
          </div>
        )}

        {/* ================= 3. INVENTORY RESTOCK & FORECAST ================= */}
        {activeSubTab === 'inventory' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Boxes className="w-5 h-5 text-blue-600" />
                  <span>{language === 'ar' ? 'خطة التوريد وإدارة النواقص بالذكاء الاصطناعي' : 'Smart Restock & Supply Optimization'}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {language === 'ar'
                    ? 'يقوم النظام بحساب كميات إعادة الطلب المثالية والميزانية التقديرية بناءً على وتيرة البيع'
                    : 'Calculates optimal reorder quantities and estimated PO costs based on velocity.'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleRunInventoryPlan}
                disabled={isInventoryLoading}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-xs self-start sm:self-auto"
              >
                {isInventoryLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                <span>{language === 'ar' ? 'تحديث خطة التوريد' : 'Refresh Restock Plan'}</span>
              </button>
            </div>

            {isInventoryLoading ? (
              <div className="h-64 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-6 text-center space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {language === 'ar' ? 'جاري فحص مستويات المخزون ومعدل الاستهلاك...' : 'Analyzing stock levels and sales velocity...'}
                </p>
              </div>
            ) : inventoryRestockText ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm leading-relaxed whitespace-pre-wrap text-sm text-slate-800 dark:text-slate-200">
                {inventoryRestockText}
              </div>
            ) : null}
          </div>
        )}

        {/* ================= 4. OCR INVOICE SCANNER ================= */}
        {activeSubTab === 'ocr' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <FileScan className="w-5 h-5 text-emerald-600" />
                <span>{language === 'ar' ? 'الماسح الضوئي الذكي للفواتير (OCR Receipt Scanner)' : 'Smart OCR Invoice Scanner'}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {language === 'ar'
                  ? 'التقط أو ارفع صورة فاتورة المورد الورقية، وسيقوم الذكاء الاصطناعي باستخراج الأصناف وإضافتها للمخزون فوراً'
                  : 'Upload or capture a photo of a supplier invoice, and AI will extract items and import them.'}
              </p>

              {/* Upload Dropzone */}
              <div className="mt-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl p-6 text-center cursor-pointer transition-all bg-slate-50 dark:bg-slate-900/50 flex flex-col items-center justify-center gap-2"
                >
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block">
                      {language === 'ar' ? 'انقر لرفع صورة الفاتورة أو السند' : 'Click to upload invoice image'}
                    </span>
                    <span className="text-xs text-slate-400">PNG, JPG, JPEG (يدعم الصور الممسوحة بالكاميرا)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* OCR Processing State */}
            {isOcrLoading && (
              <div className="h-64 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-6 text-center space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {language === 'ar' ? 'جاري فحص وقراءة بنود الفاتورة بالرؤية البصرية الذكية...' : 'Analyzing invoice with multimodal Gemini OCR...'}
                </p>
              </div>
            )}

            {/* OCR Result Table & Importer */}
            {ocrResult && !isOcrLoading && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-xs text-slate-400 block">{language === 'ar' ? 'المورد المستخرج:' : 'Supplier:'}</span>
                    <span className="text-base font-black text-slate-900 dark:text-white">
                      {ocrResult.supplierName || 'غير محدد'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-end">
                      <span className="text-xs text-slate-400 block">{language === 'ar' ? 'إجمالي الفاتورة:' : 'Total Amount:'}</span>
                      <span className="text-base font-black text-emerald-600 font-mono">
                        {formatCurrency(ocrResult.totalAmount || 0)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleImportOcrItems}
                      disabled={importedSuccess}
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs ${
                        importedSuccess
                          ? 'bg-emerald-600 text-white cursor-default'
                          : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                      }`}
                    >
                      {importedSuccess ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{language === 'ar' ? 'تمت إضافة الأصناف للمخزون بنجاح!' : 'Items Imported to Inventory!'}</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          <span>{language === 'ar' ? 'استيراد كل البنود للمخزون' : 'Import All Items to Inventory'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Items Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-start">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400">
                        <th className="pb-2 text-start font-bold">#</th>
                        <th className="pb-2 text-start font-bold">{language === 'ar' ? 'اسم الصنف' : 'Item Name'}</th>
                        <th className="pb-2 text-center font-bold">{language === 'ar' ? 'الكمية' : 'Qty'}</th>
                        <th className="pb-2 text-center font-bold">{language === 'ar' ? 'سعر التكلفة' : 'Unit Cost'}</th>
                        <th className="pb-2 text-end font-bold">{language === 'ar' ? 'الإجمالي' : 'Total'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {ocrResult.items?.map((it, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 font-mono text-slate-400">{idx + 1}</td>
                          <td className="py-2.5 font-bold text-slate-800 dark:text-slate-200">{it.name}</td>
                          <td className="py-2.5 text-center font-mono font-bold">{it.quantity} {it.unit || ''}</td>
                          <td className="py-2.5 text-center font-mono">{formatCurrency(it.unitPrice)}</td>
                          <td className="py-2.5 text-end font-mono font-black text-slate-900 dark:text-white">
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

        {/* ================= 5. MARKETING CAMPAIGNS ================= */}
        {activeSubTab === 'marketing' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-rose-600" />
                  <span>{language === 'ar' ? 'مُولّد الحملات التسويقية ورسائل الواتساب' : 'AI Marketing & WhatsApp Campaign Generator'}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {language === 'ar'
                    ? 'ابتكار رسائل ترويجية جذابة وخصومات لعملاء الولاء وتجار الجملة مع دعوة لاتخاذ إجراء CTA'
                    : 'Craft high-converting SMS, WhatsApp, and social media promotions for your customers.'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'نوع الحملة' : 'Campaign Type'}
                  </label>
                  <select
                    value={campaignType}
                    onChange={e => setCampaignType(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white border-0 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  >
                    <option value="weekend_offer">{language === 'ar' ? 'عروض عطلة نهاية الأسبوع' : 'Weekend Flash Sale'}</option>
                    <option value="loyalty_reward">{language === 'ar' ? 'مكافآت نقاط الولاء' : 'Loyalty Points Promo'}</option>
                    <option value="wholesale_deals">{language === 'ar' ? 'تخفيضات خاصة لتجار الجملة' : 'Wholesale Merchant Special'}</option>
                    <option value="new_arrival">{language === 'ar' ? 'إطلاق صنف أو وجبة جديدة' : 'New Product Arrival'}</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'الجمهور المستهدف' : 'Target Audience'}
                  </label>
                  <select
                    value={targetAudience}
                    onChange={e => setTargetAudience(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white border-0 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  >
                    <option value="all">{language === 'ar' ? 'كافة العملاء والزبائن' : 'All Customers'}</option>
                    <option value="vip">{language === 'ar' ? 'كبار العملاء (VIP)' : 'VIP High Spenders'}</option>
                    <option value="wholesale">{language === 'ar' ? 'تجار الجملة والشركات' : 'Wholesale Traders'}</option>
                    <option value="dormant">{language === 'ar' ? 'عملاء لم يزوروا المتجر منذ شهر' : 'Dormant Customers (Re-engage)'}</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'تفاصيل العرض' : 'Offer Details'}
                  </label>
                  <input
                    type="text"
                    value={offerDetails}
                    onChange={e => setOfferDetails(e.target.value)}
                    placeholder="مثال: خصم 20%، اشتري 2 واحصل على 1 مجاناً"
                    className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white border-0 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleGenerateMarketing}
                disabled={isCampaignLoading}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-xs"
              >
                {isCampaignLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Wand2 className="w-4 h-4" />
                )}
                <span>{language === 'ar' ? 'توليد الحملة بالذكاء الاصطناعي' : 'Generate Campaign Now'}</span>
              </button>
            </div>

            {campaignResult && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(campaignResult);
                    setCopiedCampaign(true);
                    setTimeout(() => setCopiedCampaign(false), 2000);
                  }}
                  className="absolute top-5 end-5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  {copiedCampaign ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCampaign ? (language === 'ar' ? 'تم النسخ!' : 'Copied!') : (language === 'ar' ? 'نسخ النصوص' : 'Copy Text')}</span>
                </button>

                <div className="leading-relaxed whitespace-pre-wrap text-sm text-slate-800 dark:text-slate-200 pt-2">
                  {campaignResult}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= 6. PRODUCT DESIGNER ================= */}
        {activeSubTab === 'product_gen' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-purple-600" />
                <span>{language === 'ar' ? 'مُصمم ومُولّد بيانات المنتجات الذكي' : 'AI Product Studio'}</span>
              </h3>
              <p className="text-xs text-slate-500">
                {language === 'ar'
                  ? 'اكتب اسم المنتج أو مواصفاته الأولية، وسيقوم الذكاء الاصطناعي باقتراح الأسعار والباركود والوصف والكراتين تلقائياً'
                  : 'Enter raw keywords or product type to auto-generate pricing models, barcodes, and SKU.'}
              </p>

              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  value={productPrompt}
                  onChange={e => setProductPrompt(e.target.value)}
                  placeholder={
                    language === 'ar'
                      ? 'مثال: عصير برتقال طبيعي 1 لتر، أو برغر لحم دبل جبنة...'
                      : 'e.g. Natural Orange Juice 1L, or Double Cheese Burger...'
                  }
                  className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-3 text-xs sm:text-sm text-slate-900 dark:text-white border-0 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />

                <button
                  type="button"
                  onClick={handleGenerateProduct}
                  disabled={!productPrompt.trim() || isProductGenLoading}
                  className="px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-xs shrink-0"
                >
                  {isProductGenLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                  <span>{language === 'ar' ? 'توليد المنتج' : 'Generate'}</span>
                </button>
              </div>
            </div>

            {generatedProduct && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h4 className="text-base font-black text-slate-900 dark:text-white">{generatedProduct.nameAr}</h4>
                    <span className="text-xs text-slate-400 font-mono">{generatedProduct.nameEn}</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveGeneratedProduct}
                    disabled={productAddedSuccess}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs ${
                      productAddedSuccess
                        ? 'bg-emerald-600 text-white'
                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                    }`}
                  >
                    {productAddedSuccess ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{language === 'ar' ? 'تمت الإضافة للمنتجات!' : 'Added to Products!'}</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>{language === 'ar' ? 'حفظ وإضافة للمتجر' : 'Save to Products'}</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                    <span className="text-[10px] text-slate-400 block">{language === 'ar' ? 'سعر المفرق المقترح' : 'Retail Price'}</span>
                    <span className="text-sm font-black text-blue-600 font-mono">{formatCurrency(generatedProduct.suggestedRetailPrice)}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                    <span className="text-[10px] text-slate-400 block">{language === 'ar' ? 'سعر التكلفة المقترح' : 'Cost Price'}</span>
                    <span className="text-sm font-black text-slate-700 dark:text-slate-300 font-mono">{formatCurrency(generatedProduct.suggestedCostPrice)}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                    <span className="text-[10px] text-slate-400 block">{language === 'ar' ? 'سعر الجملة للقطعة' : 'Wholesale Price'}</span>
                    <span className="text-sm font-black text-amber-600 font-mono">
                      {formatCurrency(generatedProduct.suggestedWholesalePrice || Math.round(generatedProduct.suggestedRetailPrice * 0.85))}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                    <span className="text-[10px] text-slate-400 block">{language === 'ar' ? 'الباركود و SKU' : 'Barcode & SKU'}</span>
                    <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 truncate block">
                      {generatedProduct.barcode || generatedProduct.sku}
                    </span>
                  </div>
                </div>

                {generatedProduct.notes && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl">
                    <span className="font-bold block mb-0.5">{language === 'ar' ? 'الوصف والمواصفات:' : 'Description:'}</span>
                    {generatedProduct.notes}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
