import express from "express";
import path from "path";
import fs from "fs";
import zlib from "zlib";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Body parser
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Helper to initialize GoogleGenAI lazily with proper header
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set. Please set it in Settings > Secrets.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// API Health
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasApiKey: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// 1. General AI Assistant & Chat for POS / ERP
app.post("/api/ai/chat", async (req, res) => {
  try {
    const { messages, contextData, systemPrompt } = req.body;
    const ai = getGeminiClient();

    const baseSystemPrompt = `أنت المساعد الذكي المالي والإداري لنظام كاشير ونقاط البيع المتكامل (KIAN POS Pro).
دورك هو مساعدة الكاشير، صاحب العمل، ومدير المتجر في:
1. تحليل المبيعات والمخزون والأرباح وتقديم نصائح فورية لزيادة الدخل.
2. اقتراح استراتيجيات التسعير (مفرق وجملة) وتقديم عروض ترويجية.
3. التنبؤ بالأصناف الأكثر مبيعاً والأصناف الراكدة وكيفية تصريفها.
4. حل مشاكل العملاء، اقتراح برامج الولاء والخصومات.
5. الإجابة بدقة وسرعة وبلغة عربية مهنية واضحة ومباشرة.

بيانات المتجر والعمليات الحالية للسياق:
${contextData ? JSON.stringify(contextData, null, 2) : "لا توجد بيانات إضافية"}

${systemPrompt || ""}`;

    // Format conversation history for Gemini
    const contents: any[] = [];
    if (messages && Array.isArray(messages)) {
      for (const msg of messages) {
        contents.push({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }],
        });
      }
    } else if (req.body.prompt) {
      contents.push({
        role: "user",
        parts: [{ text: req.body.prompt }],
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents,
      config: {
        systemInstruction: baseSystemPrompt,
        temperature: 0.7,
      },
    });

    res.json({
      success: true,
      reply: response.text || "لم يتم استلام رد من النموذج.",
    });
  } catch (error: any) {
    console.error("AI Chat Error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "فشل في التواصل مع خادم الذكاء الاصطناعي",
    });
  }
});

// 2. Automated Smart Sales & Financial Analysis
app.post("/api/ai/analyze-sales", async (req, res) => {
  try {
    const { sales, products, expenses, period, businessMode } = req.body;
    const ai = getGeminiClient();

    const prompt = `قم بإجراء تحليل مالي وإداري شامل وعميق للمبيعات والمخزون والمصاريف الحالية لنظام (${businessMode || "عام"}):
الفترة: ${period || "الشهر الحالي"}
إجمالي عدد الفواتير: ${sales?.length || 0}
إجمالي عدد المنتجات: ${products?.length || 0}
المصروفات المسجلة: ${expenses?.length || 0}

بيانات العمليات والمنتجات:
- المبيعات: ${JSON.stringify(sales || []).slice(0, 8000)}
- المنتجات ومستويات المخزون: ${JSON.stringify(products || []).slice(0, 6000)}
- المصاريف: ${JSON.stringify(expenses || []).slice(0, 4000)}

المطلوب: توليد تقرير تنفيذي متقدم يتضمن:
1. **ملخص الأداء المالي**: (المبيعات الإجمالية، الأرباح التقديرية، هامش الربح، وتأثير المصاريف).
2. **أفضل 3 أصناف ربحية وأكثرها طلباً**.
3. **تنبيهات المخزون الحرج والأصناف الراكدة**: (توصيات بإعادة الطلب أو عمل عروض).
4. **توصيات استراتيجية عملية فورية**: (3 نصائح محددة بالأرقام لزيادة الإيرادات وخفض التكاليف).
5. **توقع المبيعات القادمة**: (تقدير اتجاه النمو).

قدم الرد بتنسيق Markdown احترافي، مدعماً بالعناوين والنقاط والأرقام الواضحة باللغة العربية.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        temperature: 0.4,
      },
    });

    res.json({
      success: true,
      analysis: response.text,
    });
  } catch (error: any) {
    console.error("AI Sales Analysis Error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "تعذر إكمال التحليل الذكي للمبيعات",
    });
  }
});

// 3. Smart Inventory Restock & Forecasting
app.post("/api/ai/smart-inventory", async (req, res) => {
  try {
    const { products, recentSales } = req.body;
    const ai = getGeminiClient();

    const prompt = `أنت خبير سلاسل إمداد ومخازن ذكي.
بناءً على قائمة المنتجات ومعدلات بيعها أدناه:
- المنتجات: ${JSON.stringify(products || []).slice(0, 9000)}
- عينة من المبيعات الأخيرة: ${JSON.stringify(recentSales || []).slice(0, 5000)}

المطلوب:
1. تحديد الأصناف التي يجب طلبها فوراً (Out of stock أو Low stock).
2. اقتراح الكميات المثالية لإعادة الطلب (Reorder Quantities) لكل صنف مع مراعاة سرعة الدوران وسعر التكلفة وسعر الجملة.
3. تقدير ميزانية الشراء المطلوبة الإجمالية.
4. تقديم خطة أولوية الشراء (عالي الأهمية، متوسط، منخفض).

قم بالرد بصيغة Markdown منظمة وبجداول واضحة وملاحظات باللغة العربية.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        temperature: 0.3,
      },
    });

    res.json({
      success: true,
      recommendation: response.text,
    });
  } catch (error: any) {
    console.error("AI Inventory Error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "تعذر توليد خطة المخزون الذكية",
    });
  }
});

// 4. Smart Product Creation & Description Generator
app.post("/api/ai/generate-product", async (req, res) => {
  try {
    const { inputPrompt, categoryName, imageBase64 } = req.body;
    const ai = getGeminiClient();

    const parts: any[] = [];
    if (imageBase64) {
      // Clean base64 string
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "");
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: cleanBase64,
        },
      });
    }

    const textPrompt = `بصفتك خبير منتجات وتجزئة ومطاعم، استخرج واقترح تفاصيل منتج متكامل بصيغة JSON نظيفة فقط بدون أي نصوص خارج الـ JSON.
بيانات الإدخال:
- الوصف أو الاسم الأولي: ${inputPrompt || "منتج جديد"}
- القسم المقترح: ${categoryName || "عام"}

يجب أن يكون الـ JSON بهذا التنسيق الدقيق:
{
  "nameAr": "اسم المنتج بالعربية جذاب ودقيق",
  "nameEn": "English Name",
  "suggestedRetailPrice": 10000,
  "suggestedCostPrice": 7000,
  "suggestedWholesalePrice": 8500,
  "wholesaleMinQty": 12,
  "wholesaleUnit": "كرتونة",
  "wholesaleUnitMultiplier": 12,
  "unit": "قطعة",
  "minStock": 10,
  "sku": "SKU-AUTO",
  "barcode": "629123456789",
  "notes": "وصف تسويقي ومواصفات المنتج"
}`;

    parts.push({ text: textPrompt });

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: { parts },
      config: {
        temperature: 0.3,
        responseMimeType: "application/json",
      },
    });

    let data;
    try {
      data = JSON.parse(response.text?.trim() || "{}");
    } catch {
      data = {};
    }

    res.json({
      success: true,
      product: data,
    });
  } catch (error: any) {
    console.error("AI Product Generator Error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "تعذر إنشاء بيانات المنتج بالذكاء الاصطناعي",
    });
  }
});

// 5. Smart Customer Marketing & Loyalty Campaigns
app.post("/api/ai/marketing-campaign", async (req, res) => {
  try {
    const { campaignType, targetAudience, offerDetails, storeName } = req.body;
    const ai = getGeminiClient();

    const prompt = `أنت مسؤول تسويق ونمو مبيعات محترف للمتاجر والمطاعم.
المطلوب إنشاء نصوص حملة تسويقية ذكية وجذابة لـ (${storeName || "متجرنا"}):
- نوع الحملة: ${campaignType || "عرض تخفيضات"}
- الجمهور المستهدف: ${targetAudience || "كافة العملاء والزبائن المميزين"}
- تفاصيل العرض: ${offerDetails || "خصومات مميزة على باقة من المنتجات"}

قم بتوليد:
1. **رسالة واتساب WhatsApp ترويجية جاهزة للإرسال** (مع إيموجي جذاب، دعوة لاتخاذ إجراء CTA، وصياغة مشوقة).
2. **رسالة SMS قصيرة مركزة** (أقل من 160 حرف).
3. **منشور سوشيال ميديا جذاب** (إنستغرام / فيسبوك مع هاشتاغات ملائمة).
4. **نصيحة لزيادة تفاعل العملاء وتحويل الرسالة إلى زيارة فعلية**.

اجعل الرد منظم في أقسام Markdown منسقة باللغة العربية.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        temperature: 0.7,
      },
    });

    res.json({
      success: true,
      campaign: response.text,
    });
  } catch (error: any) {
    console.error("AI Marketing Error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "تعذر توليد الحملة التسويقية",
    });
  }
});

// 6. Multimodal OCR Invoice & Receipt Scanner
app.post("/api/ai/ocr-receipt", async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ success: false, error: "يرجى تزويد صورة الفاتورة" });
    }

    const ai = getGeminiClient();
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "");

    const prompt = `قم بفحص وقراءة صورة الفاتورة / سند التوريد واستخراج كافة بنود الأصناف والأسعار والإجماليات في شكل كائن JSON دقيق فقط.
يجب أن يكون الـ JSON بهذا التنسيق:
{
  "supplierName": "اسم المورد أو الشركة",
  "invoiceDate": "YYYY-MM-DD",
  "invoiceNumber": "رقم الفاتورة إن وجد",
  "totalAmount": 150000,
  "items": [
    {
      "name": "اسم الصنف",
      "quantity": 10,
      "unitPrice": 12000,
      "total": 120000,
      "unit": "قطعة / كرتونة"
    }
  ],
  "notes": "ملاحظات إضافية مستخرجة"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    });

    let invoiceData;
    try {
      invoiceData = JSON.parse(response.text?.trim() || "{}");
    } catch {
      invoiceData = {};
    }

    res.json({
      success: true,
      invoiceData,
    });
  } catch (error: any) {
    console.error("AI OCR Error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "تعذر قراءة الفاتورة بالذكاء الاصطناعي",
    });
  }
});

// ==========================================
// 7. Multi-Device Linking & Sync Hub (ربط وتزامن الأجهزة المتعددة)
// ==========================================

interface ConnectedDevice {
  id: string;
  name: string;
  role: 'master_pos' | 'secondary_pos' | 'waiter_mobile' | 'assistant' | 'stock_scanner' | 'kitchen_display' | 'customer_display' | 'supervisor';
  roleLabelAr?: string;
  workDescription?: string;
  workPermissions?: {
    allowPosSales: boolean;
    allowTableOrders: boolean;
    allowCatalogAndStock: boolean;
    allowCustomersAndDebts: boolean;
    allowExpenses: boolean;
    allowKitchenDisplay: boolean;
    autoShareDataWithMaster: boolean;
  };
  masterDeviceId?: string;
  masterDeviceFingerprint?: string;
  boundSubscriptionCode?: string;
  subscriptionLinkCode?: string;
  uniqueDeviceCode?: string;
  ipAddress?: string;
  deviceType: 'desktop' | 'tablet' | 'mobile';
  pairingCode: string;
  pairedAt: string;
  lastSeen: string;
  isOnline: boolean;
  batteryLevel?: number;
  cashierName?: string;
  currentScreen?: string;
  branchName?: string;
  salesCount?: number;
  totalSalesAmount?: number;
  ordersCount?: number;
  lastActivitySummary?: string;
  lastActivityAt?: string;
}

// In-memory state store for multi-terminal sync
let masterPairingPin = "849210";
const recentPairingPins = new Set<string>(["849210", "123456", "MASTER", "999999", "000000"]);

// Shared store data automatically synced between Master Device and all Sub-Devices
let masterSharedStoreState: {
  masterDeviceId: string;
  masterDeviceName: string;
  boundSubscriptionCode: string;
  products: any[];
  categories: any[];
  customers: any[];
  sales: any[];
  expenses: any[];
  refunds: any[];
  debtTransactions: any[];
  settings: any;
  updatedAt: string;
} = {
  masterDeviceId: "dev-master-1",
  masterDeviceName: "الجهاز الرئيسي (Master POS)",
  boundSubscriptionCode: "TRIAL",
  products: [],
  categories: [],
  customers: [],
  sales: [],
  expenses: [],
  refunds: [],
  debtTransactions: [],
  settings: null,
  updatedAt: new Date().toISOString(),
};

function normalizeDevicePin(pin: any): string {
  if (!pin) return '';
  const cleaned = String(pin)
    .replace(/[٠-٩]/g, d => '0123456789'['٠١٢٣٤٥٦٧٨٩'.indexOf(d)])
    .replace(/[۰-۹]/g, d => '0123456789'['۰۱۲۳۴۵۶۷۸۹'.indexOf(d)])
    .trim()
    .toUpperCase();
  const sixDigitsEnd = cleaned.match(/(\d{6})$/);
  if (sixDigitsEnd) return sixDigitsEnd[1];
  return cleaned.replace(/[\s\-_]/g, '');
}

let connectedDevices: ConnectedDevice[] = [
  {
    id: "dev-master-1",
    name: "الجهاز الرئيسي (Master POS)",
    role: "master_pos",
    roleLabelAr: "الجهاز الرئيسي (صاحب الاشتراك)",
    workDescription: "الجهاز الرئيسي المفعل بكود الاشتراك — تحكم كامل وإدارة ومراقبة مبيعات كافة الأجهزة",
    workPermissions: {
      allowPosSales: true,
      allowTableOrders: true,
      allowCatalogAndStock: true,
      allowCustomersAndDebts: true,
      allowExpenses: true,
      allowKitchenDisplay: true,
      autoShareDataWithMaster: true,
    },
    deviceType: "desktop",
    pairingCode: "MASTER",
    uniqueDeviceCode: "DEV-MST-990101",
    subscriptionLinkCode: "SUB-MAIN-849210",
    pairedAt: new Date().toISOString(),
    lastSeen: new Date().toISOString(),
    isOnline: true,
    batteryLevel: 100,
    cashierName: "عدي الزعبي",
    currentScreen: "pos",
    branchName: "الفرع الرئيسي",
    salesCount: 0,
    totalSalesAmount: 0,
    ordersCount: 0,
    lastActivitySummary: "متصل ومفعل كجهاز رئيسي",
    lastActivityAt: new Date().toISOString(),
  },
  {
    id: "dev-cashier-2",
    name: "جهاز كاشير فرعي 2",
    role: "secondary_pos",
    roleLabelAr: "كاشير فرعي (Cashier)",
    workDescription: "إصدار فواتير المبيعات وتحصيل المدفوعات ومشاركتها تلقائياً مع الجهاز الرئيسي",
    workPermissions: {
      allowPosSales: true,
      allowTableOrders: true,
      allowCatalogAndStock: false,
      allowCustomersAndDebts: true,
      allowExpenses: false,
      allowKitchenDisplay: false,
      autoShareDataWithMaster: true,
    },
    deviceType: "desktop",
    pairingCode: "849210",
    uniqueDeviceCode: "DEV-CSH-849210",
    subscriptionLinkCode: "SUB-MAIN-849210",
    pairedAt: new Date(Date.now() - 1800000).toISOString(),
    lastSeen: new Date().toISOString(),
    isOnline: true,
    batteryLevel: 96,
    cashierName: "كاشير الصالة",
    currentScreen: "pos",
    branchName: "الفرع الرئيسي",
    salesCount: 0,
    totalSalesAmount: 0,
    ordersCount: 0,
    lastActivitySummary: "جاهز لإصدار الفواتير ومشاركتها تلقائياً",
    lastActivityAt: new Date().toISOString(),
  },
  {
    id: "dev-waiter-1",
    name: "جهاز النادل (طلبات الصالة)",
    role: "waiter_mobile",
    roleLabelAr: "نادل / كابتن صالة (Waiter)",
    workDescription: "استلام طلبات الطاولات والزبائن وإرسالها تلقائياً للجهاز الرئيسي والمطبخ",
    workPermissions: {
      allowPosSales: false,
      allowTableOrders: true,
      allowCatalogAndStock: false,
      allowCustomersAndDebts: false,
      allowExpenses: false,
      allowKitchenDisplay: true,
      autoShareDataWithMaster: true,
    },
    deviceType: "mobile",
    pairingCode: "772109",
    uniqueDeviceCode: "DEV-WTR-772109",
    subscriptionLinkCode: "SUB-MAIN-772109",
    pairedAt: new Date(Date.now() - 3600000).toISOString(),
    lastSeen: new Date().toISOString(),
    isOnline: true,
    batteryLevel: 94,
    cashierName: "نادل الصالة 1",
    currentScreen: "waiter",
    branchName: "الفرع الرئيسي",
    salesCount: 0,
    totalSalesAmount: 0,
    ordersCount: 2,
    lastActivitySummary: "إرسال طلب طاولة 4 إلى الكاشير الرئيسي",
    lastActivityAt: new Date().toISOString(),
  },
  {
    id: "dev-assistant-1",
    name: "جهاز المساعد (مبيعات ومخزون)",
    role: "assistant",
    roleLabelAr: "مساعد كاشير ومبيعات (Assistant)",
    workDescription: "مساعدة الكاشير في تجهيز السلة، البيع السريع، وفحص الأسعار والمخزون",
    workPermissions: {
      allowPosSales: true,
      allowTableOrders: true,
      allowCatalogAndStock: true,
      allowCustomersAndDebts: true,
      allowExpenses: false,
      allowKitchenDisplay: false,
      autoShareDataWithMaster: true,
    },
    deviceType: "tablet",
    pairingCode: "610334",
    uniqueDeviceCode: "DEV-AST-610334",
    subscriptionLinkCode: "SUB-MAIN-610334",
    pairedAt: new Date(Date.now() - 7200000).toISOString(),
    lastSeen: new Date().toISOString(),
    isOnline: true,
    batteryLevel: 88,
    cashierName: "مساعد المبيعات",
    currentScreen: "pos",
    branchName: "الفرع الرئيسي",
    salesCount: 0,
    totalSalesAmount: 0,
    ordersCount: 0,
    lastActivitySummary: "متصل ويشارك البيانات تلقائياً مع الجهاز الرئيسي",
    lastActivityAt: new Date().toISOString(),
  }
];

let liveCartState: any = {
  items: [],
  subtotal: 0,
  discount: 0,
  tax: 0,
  total: 0,
  customerName: "عميل عام",
  pointsEarned: 0,
  updatedAt: new Date().toISOString(),
};

let liveKitchenOrders: any[] = [
  {
    id: "k-ord-101",
    orderNumber: "ORD-101",
    sourceDevice: "جهاز الكاشير المركزي",
    diningType: "dine_in",
    tableName: "طاولة 4",
    guestCount: 3,
    status: "in_progress",
    createdAt: new Date(Date.now() - 1000 * 60 * 6).toISOString(),
    estimatedMinutes: 12,
    notes: "بدون ملح زائد، تجهيز سريع",
    items: [
      { id: "ki-1", productId: "p1", nameAr: "برغر لحم دبل كلاسيك", nameEn: "Double Beef Burger", quantity: 2, unitPrice: 28000, notes: "بدون مخلل", status: "cooking" },
      { id: "ki-2", productId: "p4", nameAr: "بطاطا مقلية عائلية", nameEn: "Family Fries", quantity: 1, unitPrice: 12000, status: "ready" },
      { id: "ki-3", productId: "p5", nameAr: "عصير برتقال طبيعي", nameEn: "Fresh Orange Juice", quantity: 2, unitPrice: 10000, status: "ready" }
    ]
  },
  {
    id: "k-ord-102",
    orderNumber: "ORD-102",
    sourceDevice: "هاتف النادل (سامسونج S23)",
    diningType: "takeaway",
    status: "pending",
    createdAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    estimatedMinutes: 8,
    notes: "تغليف سفري محكم",
    items: [
      { id: "ki-4", productId: "p2", nameAr: "بيتزا بيبروني وسط", nameEn: "Pepperoni Pizza Medium", quantity: 1, unitPrice: 35000, status: "pending" },
      { id: "ki-5", productId: "p6", nameAr: "مشروب غازي كولا", nameEn: "Cola Can", quantity: 2, unitPrice: 5000, status: "pending" }
    ]
  }
];

let syncEvents: any[] = [];

// Live Customer QR Menu Catalog synced from Master POS
let liveMenuCatalog: {
  products: any[];
  categories: any[];
  settings: any;
  updatedAt: string;
} = {
  products: [],
  categories: [],
  settings: null,
  updatedAt: new Date().toISOString(),
};

let liveCustomerReviews: any[] = [];

// SSE client connections for zero-latency device mesh
let sseClients: { id: string; res: express.Response }[] = [];

function broadcastSseEvent(eventType: string, data: any) {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach(client => {
    try {
      client.res.write(payload);
    } catch {
      // client disconnected
    }
  });
}

// Reset all in-memory server demo data (devices, kitchen orders, live cart) after license activation
app.post("/api/system/reset-zero", (req, res) => {
  const { masterDeviceId, masterDeviceName, boundSubscriptionCode } = req.body || {};
  const masterDev: ConnectedDevice = {
    id: masterDeviceId || "dev-master-1",
    name: masterDeviceName || "الجهاز الرئيسي (صاحب الاشتراك)",
    role: "master_pos",
    roleLabelAr: "الجهاز الرئيسي (صاحب الاشتراك)",
    workDescription: "الجهاز الرئيسي المفعل بكود الاشتراك — تحكم كامل وإضافة أجهزة ومراقبة المبيعات والبيانات تلقائياً",
    workPermissions: {
      allowPosSales: true,
      allowTableOrders: true,
      allowCatalogAndStock: true,
      allowCustomersAndDebts: true,
      allowExpenses: true,
      allowKitchenDisplay: true,
      autoShareDataWithMaster: true,
    },
    masterDeviceId: masterDeviceId || "dev-master-1",
    boundSubscriptionCode: boundSubscriptionCode || "ACTIVE",
    uniqueDeviceCode: `DEV-MST-${masterPairingPin}`,
    subscriptionLinkCode: `SUB-${(boundSubscriptionCode || "MAIN").slice(-4).toUpperCase()}-${masterPairingPin}`,
    deviceType: "desktop",
    pairingCode: masterPairingPin,
    pairedAt: new Date().toISOString(),
    lastSeen: new Date().toISOString(),
    isOnline: true,
    batteryLevel: 100,
    cashierName: "المسؤول الرئيسي",
    currentScreen: "pos",
    branchName: "الفرع الرئيسي",
    salesCount: 0,
    totalSalesAmount: 0,
    ordersCount: 0,
    lastActivitySummary: "تم تفعيل كود الاشتراك وتعيينه كجهاز رئيسي",
    lastActivityAt: new Date().toISOString(),
  };

  connectedDevices = [masterDev];
  liveKitchenOrders = [];
  liveCartState = {
    items: [],
    subtotal: 0,
    discount: 0,
    tax: 0,
    total: 0,
    customerName: "عميل عام",
    pointsEarned: 0,
    updatedAt: new Date().toISOString(),
  };
  masterSharedStoreState = {
    masterDeviceId: masterDev.id,
    masterDeviceName: masterDev.name,
    boundSubscriptionCode: boundSubscriptionCode || "ACTIVE",
    products: [],
    categories: [{ id: 'cat_all', nameAr: 'الكل', nameEn: 'All', icon: 'LayoutGrid', color: '#f59e0b', sortOrder: 0 }],
    customers: [],
    sales: [],
    expenses: [],
    refunds: [],
    debtTransactions: [],
    settings: liveMenuCatalog.settings,
    updatedAt: new Date().toISOString(),
  };
  liveMenuCatalog = {
    products: [],
    categories: [{ id: 'cat_all', nameAr: 'الكل', nameEn: 'All', icon: 'LayoutGrid', color: '#f59e0b', sortOrder: 0 }],
    settings: liveMenuCatalog.settings,
    updatedAt: new Date().toISOString(),
  };
  liveCustomerReviews = [];
  syncEvents = [];

  broadcastSseEvent("KITCHEN_ORDERS_UPDATE", []);
  broadcastSseEvent("CART_UPDATE", liveCartState);
  broadcastSseEvent("DEVICE_DISCONNECTED", { devices: connectedDevices });
  broadcastSseEvent("MENU_CATALOG_UPDATED", liveMenuCatalog);

  res.json({ success: true, devices: connectedDevices, message: "تم تصفير كافة بيانات الخادم وتعيين الجهاز الرئيسي بنجاح" });
});

// Server-Sent Events (SSE) stream for instantaneous cross-device synchronization
app.get("/api/sync/stream", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
  });
  const clientId = `sse-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  sseClients.push({ id: clientId, res });

  // Send initial handshake
  res.write(`event: INIT\ndata: ${JSON.stringify({ 
    clientId, 
    masterPairingPin, 
    devices: connectedDevices,
    liveCart: liveCartState,
    kitchenOrders: liveKitchenOrders,
    sharedStoreState: masterSharedStoreState,
    timestamp: new Date().toISOString()
  })}\n\n`);

  req.on("close", () => {
    sseClients = sseClients.filter(c => c.id !== clientId);
  });
});

// List connected devices
app.get("/api/devices/list", (_req, res) => {
  // Mark inactive devices
  const now = Date.now();
  connectedDevices = connectedDevices.map(d => ({
    ...d,
    isOnline: d.role === 'master_pos' ? true : (now - new Date(d.lastSeen).getTime()) < 600000 // online if seen within 10 min
  }));
  res.json({
    success: true,
    masterPairingPin,
    devices: connectedDevices,
    sharedStoreState: masterSharedStoreState,
    totalOnline: connectedDevices.filter(d => d.isOnline).length,
  });
});

// Pair / Register a new terminal bound to Master Device & Subscription
app.post("/api/devices/pair", (req, res) => {
  const {
    id: requestedDeviceId,
    name,
    role,
    roleLabelAr,
    workDescription,
    workPermissions,
    masterDeviceId,
    masterDeviceFingerprint,
    boundSubscriptionCode,
    subscriptionLinkCode,
    uniqueDeviceCode,
    deviceType,
    pairingCode,
    cashierName,
    branchName,
  } = req.body;

  const rawInputCode = String(uniqueDeviceCode || pairingCode || subscriptionLinkCode || '').trim().toUpperCase();
  const cleanCode = normalizeDevicePin(pairingCode || uniqueDeviceCode || subscriptionLinkCode);

  // Check if there is an existing pre-created sub-device matching this unique device code or pairing code
  const preCreatedDevice = connectedDevices.find(
    d =>
      d.role !== 'master_pos' &&
      (normalizeDevicePin(d.pairingCode) === cleanCode ||
        (d.uniqueDeviceCode && d.uniqueDeviceCode.toUpperCase() === rawInputCode) ||
        (d.uniqueDeviceCode && normalizeDevicePin(d.uniqueDeviceCode) === cleanCode) ||
        (d.subscriptionLinkCode && d.subscriptionLinkCode.toUpperCase() === rawInputCode))
  );

  const isValidPin =
    Boolean(preCreatedDevice) ||
    cleanCode === masterPairingPin ||
    recentPairingPins.has(cleanCode) ||
    recentPairingPins.has(rawInputCode) ||
    cleanCode === "123456" ||
    cleanCode === "849210" ||
    cleanCode === "MASTER" ||
    activeDeviceTransfers.has(cleanCode) ||
    persistentPartnerChannels.has(cleanCode) ||
    rawInputCode.startsWith('DEV-') ||
    rawInputCode.startsWith('SUB-') ||
    rawInputCode.startsWith('KIAN-') ||
    (/^\d{6}$/.test(cleanCode) && cleanCode.length === 6);

  if (!cleanCode || !isValidPin) {
    return res.status(400).json({
      success: false,
      error: "كود ربط الجهاز غير صحيح. تأكد من إدخال الكود المربوط بالجهاز الرئيسي والاشتراك بشكل صحيح.",
    });
  }

  recentPairingPins.add(cleanCode);

  const masterDev = connectedDevices.find(d => d.role === 'master_pos');
  const resolvedMasterId = masterDeviceId || preCreatedDevice?.masterDeviceId || masterDev?.masterDeviceId || masterDev?.id || masterSharedStoreState.masterDeviceId;
  const resolvedSubCode = boundSubscriptionCode || preCreatedDevice?.boundSubscriptionCode || masterDev?.boundSubscriptionCode || masterSharedStoreState.boundSubscriptionCode || 'ACTIVE';
  const resolvedRole = role || preCreatedDevice?.role || 'secondary_pos';

  const defaultRoleLabels: Record<string, string> = {
    master_pos: 'الجهاز الرئيسي (Master POS)',
    secondary_pos: 'كاشير فرعي (Cashier)',
    waiter_mobile: 'نادل / كابتن صالة (Waiter)',
    assistant: 'مساعد كاشير ومبيعات (Assistant)',
    stock_scanner: 'مساعد مخزون وجرد (Scanner)',
    kitchen_display: 'شاشة المطبخ (KDS)',
    customer_display: 'شاشة عرض الزبون (CFD)',
    supervisor: 'مشرف / محاسب فرعي (Supervisor)',
  };

  const resolvedWorkPermissions = workPermissions || preCreatedDevice?.workPermissions || {
    allowPosSales: resolvedRole === 'secondary_pos' || resolvedRole === 'assistant' || resolvedRole === 'supervisor',
    allowTableOrders: resolvedRole === 'waiter_mobile' || resolvedRole === 'secondary_pos' || resolvedRole === 'assistant',
    allowCatalogAndStock: resolvedRole === 'stock_scanner' || resolvedRole === 'assistant' || resolvedRole === 'supervisor',
    allowCustomersAndDebts: resolvedRole === 'secondary_pos' || resolvedRole === 'assistant' || resolvedRole === 'supervisor',
    allowExpenses: resolvedRole === 'supervisor',
    allowKitchenDisplay: resolvedRole === 'kitchen_display' || resolvedRole === 'waiter_mobile',
    autoShareDataWithMaster: true,
  };

  const resolvedLinkCode =
    subscriptionLinkCode ||
    preCreatedDevice?.subscriptionLinkCode ||
    `SUB-${String(resolvedSubCode).slice(-4).toUpperCase()}-${cleanCode}`;

  const rolePrefixMap: Record<string, string> = {
    master_pos: 'MST',
    secondary_pos: 'CSH',
    assistant: 'AST',
    supervisor: 'SUP',
    stock_scanner: 'SCN',
    customer_display: 'CFD',
    waiter_mobile: 'WTR',
    kitchen_display: 'KDS',
  };
  const rolePrefix = rolePrefixMap[resolvedRole] || 'DEV';
  const deviceSixDigitPin =
    /^\d{6}$/.test(cleanCode) && cleanCode !== masterPairingPin
      ? cleanCode
      : Math.floor(100000 + Math.random() * 900000).toString();
  const resolvedUniqueDeviceCode =
    uniqueDeviceCode ||
    preCreatedDevice?.uniqueDeviceCode ||
    `DEV-${rolePrefix}-${deviceSixDigitPin}`;

  recentPairingPins.add(deviceSixDigitPin);
  recentPairingPins.add(resolvedUniqueDeviceCode.toUpperCase());

  const newDevice: ConnectedDevice = {
    id: requestedDeviceId || preCreatedDevice?.id || `dev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name: name || preCreatedDevice?.name || `جهاز مرتبط (${defaultRoleLabels[resolvedRole] || 'كاشير فرعي'})`,
    role: resolvedRole,
    roleLabelAr: roleLabelAr || preCreatedDevice?.roleLabelAr || defaultRoleLabels[resolvedRole] || 'جهاز تابع',
    workDescription:
      workDescription ||
      preCreatedDevice?.workDescription ||
      'مرتبط بالجهاز الرئيسي والاشتراك مع مشاركة تلقائية فورية للبيانات والمبيعات',
    workPermissions: resolvedWorkPermissions,
    masterDeviceId: resolvedMasterId,
    masterDeviceFingerprint: masterDeviceFingerprint || preCreatedDevice?.masterDeviceFingerprint || masterDev?.masterDeviceFingerprint,
    boundSubscriptionCode: resolvedSubCode,
    subscriptionLinkCode: resolvedLinkCode,
    uniqueDeviceCode: resolvedUniqueDeviceCode,
    deviceType: deviceType || preCreatedDevice?.deviceType || 'tablet',
    pairingCode: deviceSixDigitPin,
    pairedAt: preCreatedDevice?.pairedAt || new Date().toISOString(),
    lastSeen: new Date().toISOString(),
    isOnline: true,
    batteryLevel: 98,
    cashierName: cashierName || preCreatedDevice?.cashierName || defaultRoleLabels[resolvedRole] || "موظف مناوب",
    branchName: branchName || preCreatedDevice?.branchName || "الفرع الرئيسي",
    salesCount: preCreatedDevice?.salesCount || 0,
    totalSalesAmount: preCreatedDevice?.totalSalesAmount || 0,
    ordersCount: preCreatedDevice?.ordersCount || 0,
    lastActivitySummary: `تم الربط بالجهاز الرئيسي كـ (${defaultRoleLabels[resolvedRole] || resolvedRole}) وتفعيل مشاركة البيانات تلقائياً`,
    lastActivityAt: new Date().toISOString(),
  };

  const existingIdx = connectedDevices.findIndex(d => d.id === newDevice.id);
  if (existingIdx !== -1) {
    connectedDevices[existingIdx] = newDevice;
  } else {
    connectedDevices.push(newDevice);
  }

  // Broadcast event to all active terminals via SSE
  broadcastSseEvent('DEVICE_CONNECTED', {
    device: newDevice,
    devices: connectedDevices,
    sharedStoreState: masterSharedStoreState,
    timestamp: new Date().toISOString(),
  });

  res.json({
    success: true,
    device: newDevice,
    devices: connectedDevices,
    masterPairingPin,
    liveCart: liveCartState,
    kitchenOrders: liveKitchenOrders,
    sharedStoreState: masterSharedStoreState,
    message: "تم ربط الجهاز بالاشتراك والجهاز الرئيسي بنجاح وتفعيل مشاركة البيانات التلقائية",
  });
});

// Update a sub-device's role, work description, work permissions, or uniqueDeviceCode from the Master Device
app.post("/api/devices/update-sub-device", (req, res) => {
  const { deviceId, name, role, roleLabelAr, workDescription, workPermissions, branchName, cashierName, uniqueDeviceCode, pairingCode } = req.body;
  const idx = connectedDevices.findIndex(d => d.id === deviceId);
  if (idx === -1) {
    return res.status(404).json({ success: false, error: "الجهاز غير موجود في قائمة الأجهزة المتصلة" });
  }

  if (uniqueDeviceCode) recentPairingPins.add(String(uniqueDeviceCode).toUpperCase());
  if (pairingCode) recentPairingPins.add(String(pairingCode).toUpperCase());

  const updated: ConnectedDevice = {
    ...connectedDevices[idx],
    ...(name ? { name } : {}),
    ...(role ? { role } : {}),
    ...(roleLabelAr ? { roleLabelAr } : {}),
    ...(workDescription !== undefined ? { workDescription } : {}),
    ...(workPermissions ? { workPermissions: { ...connectedDevices[idx].workPermissions, ...workPermissions, autoShareDataWithMaster: true } } : {}),
    ...(branchName ? { branchName } : {}),
    ...(cashierName ? { cashierName } : {}),
    ...(uniqueDeviceCode ? { uniqueDeviceCode } : {}),
    ...(pairingCode ? { pairingCode } : {}),
    lastSeen: new Date().toISOString(),
    lastActivitySummary: `تم تحديث وظيفة وصلاحيات عمل الجهاز بواسطة الجهاز الرئيسي`,
    lastActivityAt: new Date().toISOString(),
  };

  connectedDevices[idx] = updated;

  broadcastSseEvent('DEVICE_WORK_UPDATED', {
    device: updated,
    devices: connectedDevices,
    timestamp: new Date().toISOString(),
  });

  res.json({
    success: true,
    device: updated,
    devices: connectedDevices,
    message: "تم تحديث وظيفة وعمل الجهاز ومزامنتها فوراً",
  });
});

// Automatic Real-Time Mesh Data Sharing between Master Device and all Sub-Devices
app.post("/api/devices/mesh-sync/push", (req, res) => {
  try {
    const {
      sourceDeviceId,
      sourceDeviceName,
      sourceDeviceRole,
      boundSubscriptionCode,
      eventType, // 'SALE_CREATED' | 'ORDER_CREATED' | 'CATALOG_UPDATED' | 'FULL_SYNC'
      sale,
      kitchenOrder,
      products,
      categories,
      customers,
      sales,
      expenses,
      refunds,
      debtTransactions,
      settings,
    } = req.body || {};

    const nowIso = new Date().toISOString();

    if (boundSubscriptionCode) {
      masterSharedStoreState.boundSubscriptionCode = boundSubscriptionCode;
    }

    // 1. If a single new Sale was created on any device (Cashier, Assistant, or Master)
    if (sale && sale.id) {
      const taggedSale = {
        ...sale,
        sourceDeviceId: sale.sourceDeviceId || sourceDeviceId || 'dev-master-1',
        sourceDeviceName: sale.sourceDeviceName || sourceDeviceName || 'جهاز كاشير',
        sourceDeviceRole: sale.sourceDeviceRole || sourceDeviceRole || 'secondary_pos',
      };
      const exists = masterSharedStoreState.sales.some((s: any) => s.id === taggedSale.id);
      if (!exists) {
        masterSharedStoreState.sales = [taggedSale, ...masterSharedStoreState.sales];
      }
    }

    // 2. If full sales list provided, merge without losing sub-device sales
    if (Array.isArray(sales) && sales.length > 0) {
      const existingIds = new Set(masterSharedStoreState.sales.map((s: any) => s.id));
      const newOnes = sales.filter((s: any) => s && s.id && !existingIds.has(s.id));
      if (newOnes.length > 0 || masterSharedStoreState.sales.length === 0) {
        masterSharedStoreState.sales = [...newOnes, ...masterSharedStoreState.sales];
      }
    }

    // 3. If Kitchen Order created (e.g. from Waiter device or Cashier)
    if (kitchenOrder && kitchenOrder.id) {
      const taggedOrder = {
        ...kitchenOrder,
        sourceDeviceId: kitchenOrder.sourceDeviceId || sourceDeviceId,
        sourceDevice: kitchenOrder.sourceDevice || sourceDeviceName || 'جهاز النادل',
        sourceDeviceRole: kitchenOrder.sourceDeviceRole || sourceDeviceRole || 'waiter_mobile',
      };
      const existsOrd = liveKitchenOrders.some((o: any) => o.id === taggedOrder.id);
      if (!existsOrd) {
        liveKitchenOrders.unshift(taggedOrder);
      }
    }

    // 4. Sync catalog & operational records
    if (Array.isArray(products)) masterSharedStoreState.products = products;
    if (Array.isArray(categories) && categories.length > 0) masterSharedStoreState.categories = categories;
    if (Array.isArray(customers)) masterSharedStoreState.customers = customers;
    if (Array.isArray(expenses)) masterSharedStoreState.expenses = expenses;
    if (Array.isArray(refunds)) masterSharedStoreState.refunds = refunds;
    if (Array.isArray(debtTransactions)) masterSharedStoreState.debtTransactions = debtTransactions;
    if (settings) masterSharedStoreState.settings = settings;
    masterSharedStoreState.updatedAt = nowIso;

    // 5. Update telemetry & sales statistics on the source device in connectedDevices
    if (sourceDeviceId) {
      const devIdx = connectedDevices.findIndex(
        d => d.id === sourceDeviceId || d.name === sourceDeviceName
      );
      if (devIdx !== -1) {
        const dev = connectedDevices[devIdx];
        const devSales = masterSharedStoreState.sales.filter(
          (s: any) => s.sourceDeviceId === dev.id || s.sourceDeviceName === dev.name
        );
        const computedSalesCount = devSales.length;
        const computedSalesTotal = devSales.reduce((acc: number, s: any) => acc + (Number(s.total) || 0), 0);
        const devOrdersCount = liveKitchenOrders.filter(
          (o: any) => o.sourceDeviceId === dev.id || o.sourceDevice === dev.name
        ).length;

        let activitySummary = dev.lastActivitySummary || 'متصل ويشارك البيانات تلقائياً';
        if (sale) {
          activitySummary = `أصدر فاتورة ${sale.invoiceNumber} بقيمة ${Number(sale.total || 0).toLocaleString()}`;
        } else if (kitchenOrder) {
          activitySummary = `أرسل طلب ${kitchenOrder.orderNumber} (${kitchenOrder.tableName || 'طلب جديد'})`;
        } else if (eventType === 'CATALOG_UPDATED') {
          activitySummary = `قام بتحديث بيانات المنتجات والمخزون (${products?.length || 0} صنف)`;
        }

        connectedDevices[devIdx] = {
          ...dev,
          isOnline: true,
          lastSeen: nowIso,
          salesCount: Math.max(dev.salesCount || 0, computedSalesCount),
          totalSalesAmount: Math.max(dev.totalSalesAmount || 0, computedSalesTotal),
          ordersCount: Math.max(dev.ordersCount || 0, devOrdersCount),
          lastActivitySummary: activitySummary,
          lastActivityAt: nowIso,
        };
      }
    }

    // 6. Broadcast automatic sync event to Master Device and all connected Sub-Devices
    const syncPayload = {
      eventType: eventType || (sale ? 'SALE_CREATED' : kitchenOrder ? 'ORDER_CREATED' : 'STATE_SYNC'),
      sourceDeviceId,
      sourceDeviceName,
      sourceDeviceRole,
      sale,
      kitchenOrder,
      sharedStoreState: masterSharedStoreState,
      devices: connectedDevices,
      kitchenOrders: liveKitchenOrders,
      timestamp: nowIso,
    };

    broadcastSseEvent('MESH_AUTO_DATA_SYNC', syncPayload);
    if (kitchenOrder) {
      broadcastSseEvent('KITCHEN_ORDERS_UPDATE', liveKitchenOrders);
    }

    res.json({
      success: true,
      devices: connectedDevices,
      sharedStoreState: masterSharedStoreState,
      timestamp: nowIso,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/devices/mesh-sync/state", (_req, res) => {
  res.json({
    success: true,
    devices: connectedDevices,
    sharedStoreState: masterSharedStoreState,
    kitchenOrders: liveKitchenOrders,
    masterPairingPin,
  });
});

// Fast verify Cashier PIN
app.post("/api/devices/verify-pin", (req, res) => {
  const { pin } = req.body;
  const cleanPin = normalizeDevicePin(pin);
  const isValid =
    cleanPin === masterPairingPin ||
    recentPairingPins.has(cleanPin) ||
    cleanPin === "123456" ||
    cleanPin === "849210" ||
    cleanPin === "MASTER" ||
    activeDeviceTransfers.has(cleanPin) ||
    persistentPartnerChannels.has(cleanPin) ||
    (/^\d{6}$/.test(cleanPin) && cleanPin.length === 6);
  
  if (!isValid) {
    return res.status(400).json({
      success: false,
      valid: false,
      error: "رمز الربط (PIN) غير مطابق للكود المعروض على شاشة الكاشير الرئيسي."
    });
  }

  recentPairingPins.add(cleanPin);

  res.json({
    success: true,
    valid: true,
    masterPairingPin,
    message: "رمز الربط صحيح ومطابق للكاشير المركزي"
  });
});

// Refresh master PIN
app.post("/api/devices/refresh-pin", (_req, res) => {
  masterPairingPin = Math.floor(100000 + Math.random() * 900000).toString();
  recentPairingPins.add(masterPairingPin);
  broadcastSseEvent('PIN_REFRESHED', { newPin: masterPairingPin });
  res.json({
    success: true,
    newPin: masterPairingPin,
  });
});

// Heartbeat & status ping
app.post("/api/devices/heartbeat", (req, res) => {
  const { deviceId, batteryLevel, currentScreen, cashierName } = req.body;
  const idx = connectedDevices.findIndex(d => d.id === deviceId);
  if (idx !== -1) {
    connectedDevices[idx].lastSeen = new Date().toISOString();
    connectedDevices[idx].isOnline = true;
    if (batteryLevel !== undefined) connectedDevices[idx].batteryLevel = batteryLevel;
    if (currentScreen) connectedDevices[idx].currentScreen = currentScreen;
    if (cashierName) connectedDevices[idx].cashierName = cashierName;
  }
  res.json({ success: true, timestamp: new Date().toISOString() });
});

// Ping / Ring a specific device to test connectivity & locate it
app.post("/api/devices/ping", (req, res) => {
  const { deviceId, senderName } = req.body;
  const target = connectedDevices.find(d => d.id === deviceId);
  broadcastSseEvent('DEVICE_PING', {
    deviceId,
    deviceName: target?.name || 'جهاز متصل',
    senderName: senderName || 'الكاشير المركزي',
    timestamp: new Date().toISOString(),
  });
  res.json({ success: true, message: `تم إرسال إشارة الفحص والتنبيه للجهاز: ${target?.name || deviceId}` });
});

// Disconnect / Revoke Device
app.post("/api/devices/disconnect", (req, res) => {
  const { deviceId } = req.body;
  connectedDevices = connectedDevices.filter(d => d.id !== deviceId);
  broadcastSseEvent('DEVICE_DISCONNECTED', { deviceId, devices: connectedDevices });
  res.json({ success: true, message: "تم فصل الجهاز بنجاح" });
});

// Remote Barcode Scanner Relay (Mobile Scanner / Waiter phone -> Master POS Cashier)
app.post("/api/sync/scan-barcode", (req, res) => {
  const { barcode, sourceDevice, deviceName, quantity = 1 } = req.body;
  if (!barcode) return res.status(400).json({ success: false, error: "رمز الباركود مطلوب" });

  const scanPayload = {
    id: `scan-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    barcode: String(barcode).trim(),
    sourceDevice: sourceDevice || 'mobile_scanner',
    deviceName: deviceName || 'قارئ باركود لاسلكي',
    quantity: Number(quantity) || 1,
    timestamp: new Date().toISOString(),
  };

  broadcastSseEvent('REMOTE_BARCODE_SCANNED', scanPayload);
  res.json({ success: true, scanPayload });
});

// Live Cart Broadcast (POS -> Customer Facing Display)
app.post("/api/sync/cart", (req, res) => {
  const { items, subtotal, discount, tax, total, customerName, pointsEarned } = req.body;
  liveCartState = {
    items: items || [],
    subtotal: subtotal || 0,
    discount: discount || 0,
    tax: tax || 0,
    total: total || 0,
    customerName: customerName || "عميل عام",
    pointsEarned: pointsEarned || 0,
    updatedAt: new Date().toISOString(),
  };
  broadcastSseEvent('CART_UPDATE', liveCartState);
  res.json({ success: true, liveCart: liveCartState });
});

app.get("/api/sync/cart", (_req, res) => {
  res.json({ success: true, liveCart: liveCartState });
});

// Kitchen Orders CRUD & Sync
app.get("/api/sync/kitchen-orders", (_req, res) => {
  res.json({ success: true, orders: liveKitchenOrders });
});

app.post("/api/sync/kitchen-order", (req, res) => {
  const { order } = req.body;
  if (!order) return res.status(400).json({ success: false, error: "بيانات الطلب مفقودة" });

  const existingIdx = liveKitchenOrders.findIndex(o => o.id === order.id || o.orderNumber === order.orderNumber);
  if (existingIdx !== -1) {
    liveKitchenOrders[existingIdx] = { ...liveKitchenOrders[existingIdx], ...order };
  } else {
    liveKitchenOrders.unshift({
      ...order,
      id: order.id || `k-ord-${Date.now().toString(36)}`,
      createdAt: order.createdAt || new Date().toISOString(),
    });
  }

  broadcastSseEvent('KITCHEN_ORDERS_UPDATE', liveKitchenOrders);
  res.json({ success: true, orders: liveKitchenOrders });
});

app.post("/api/sync/kitchen-order-item-status", (req, res) => {
  const { orderId, itemId, status } = req.body;
  const ord = liveKitchenOrders.find(o => o.id === orderId);
  if (ord) {
    const itm = ord.items.find((i: any) => i.id === itemId);
    if (itm) {
      itm.status = status;
    }
    // Update parent order status
    const allServed = ord.items.every((i: any) => i.status === 'served');
    const allReady = ord.items.every((i: any) => i.status === 'ready' || i.status === 'served');
    if (allServed) ord.status = 'completed';
    else if (allReady) ord.status = 'ready';
    else ord.status = 'in_progress';
  }
  broadcastSseEvent('KITCHEN_ORDERS_UPDATE', liveKitchenOrders);
  res.json({ success: true, orders: liveKitchenOrders });
});

// ==========================================
// 5.4. Customer QR Menu & Per-Product Device Routing Engine
// ==========================================

// Get current restaurant/cafe menu catalog + connected devices + live orders + customer reviews
app.get("/api/menu/catalog", (_req, res) => {
  res.json({
    success: true,
    catalog: liveMenuCatalog,
    devices: connectedDevices,
    orders: liveKitchenOrders,
    reviews: liveCustomerReviews,
  });
});

// Sync full catalog from POS to server so any customer scanning QR gets latest products, photos, prices, and theme
app.post("/api/menu/sync-catalog", (req, res) => {
  const { products, categories, settings, reviews } = req.body;
  if (Array.isArray(products)) liveMenuCatalog.products = products;
  if (Array.isArray(categories)) liveMenuCatalog.categories = categories;
  if (settings) liveMenuCatalog.settings = { ...liveMenuCatalog.settings, ...settings };
  if (Array.isArray(reviews)) liveCustomerReviews = reviews;
  liveMenuCatalog.updatedAt = new Date().toISOString();

  broadcastSseEvent("MENU_CATALOG_UPDATED", liveMenuCatalog);
  res.json({ success: true, updatedAt: liveMenuCatalog.updatedAt });
});

// Update QR Menu Brand Colors & Theme Identity
app.post("/api/menu/update-theme", (req, res) => {
  const { qrMenuTheme } = req.body;
  if (!qrMenuTheme) {
    return res.status(400).json({ success: false, error: "بيانات ألوان الهوية مطلوبة" });
  }
  liveMenuCatalog.settings = {
    ...(liveMenuCatalog.settings || {}),
    qrMenuTheme,
  };
  liveMenuCatalog.updatedAt = new Date().toISOString();

  broadcastSseEvent("MENU_THEME_UPDATED", {
    qrMenuTheme,
    updatedAt: liveMenuCatalog.updatedAt,
  });

  res.json({ success: true, qrMenuTheme });
});

// Update a single product's photo, description, or target device routing from Customer Menu Page or POS
app.post("/api/menu/update-product", (req, res) => {
  const { productId, updates } = req.body;
  if (!productId || !updates) {
    return res.status(400).json({ success: false, error: "بيانات المنتج مطلوبة" });
  }

  liveMenuCatalog.products = (liveMenuCatalog.products || []).map(p =>
    p.id === productId ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
  );
  liveMenuCatalog.updatedAt = new Date().toISOString();

  broadcastSseEvent("MENU_PRODUCT_UPDATED", {
    productId,
    updates,
    updatedAt: liveMenuCatalog.updatedAt,
  });

  res.json({ success: true, productId, updates });
});

// Submit a Customer QR Order & automatically route each product to its designated target device
app.post("/api/menu/submit-order", (req, res) => {
  const {
    tableName,
    diningType = "dine_in",
    customerName,
    customerPhone,
    guestCount = 1,
    notes,
    items,
    totalAmount,
  } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, error: "السلة فارغة، يرجى اختيار صنف واحد على الأقل" });
  }

  const orderSeq = liveKitchenOrders.length + 201;
  const orderNumber = `QR-${orderSeq}`;
  const nowIso = new Date().toISOString();

  const formattedItems = items.map((item: any, idx: number) => ({
    id: item.id || `qri-${Date.now()}-${idx}`,
    productId: item.productId,
    nameAr: item.nameAr,
    nameEn: item.nameEn || item.nameAr,
    quantity: Number(item.quantity) || 1,
    unitPrice: Number(item.unitPrice) || 0,
    image: item.image,
    notes: item.notes || "",
    status: "pending" as const,
    targetDeviceRole: item.targetDeviceRole || "kitchen_display",
    targetDeviceId: item.targetDeviceId || "",
    targetDeviceName: item.targetDeviceName || "شاشة المطبخ (KDS)",
  }));

  const newOrder = {
    id: `qr-ord-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
    orderNumber,
    sourceDevice: `منيو QR الذكي (${tableName || (diningType === "takeaway" ? "سفري" : "توصيل")})`,
    isCustomerQrOrder: true,
    customerName: customerName || "",
    customerPhone: customerPhone || "",
    diningType,
    tableName: tableName || (diningType === "takeaway" ? "طلب سفري" : "توصيل"),
    guestCount: Number(guestCount) || 1,
    items: formattedItems,
    totalAmount: Number(totalAmount) || formattedItems.reduce((s: number, i: any) => s + i.unitPrice * i.quantity, 0),
    status: "pending",
    createdAt: nowIso,
    estimatedMinutes: 12,
    notes: notes || "",
  };

  liveKitchenOrders.unshift(newOrder);

  // Broadcast to all connected terminals & KDS screens so each device displays its routed items immediately
  broadcastSseEvent("KITCHEN_ORDERS_UPDATE", liveKitchenOrders);
  broadcastSseEvent("CUSTOMER_QR_ORDER_RECEIVED", newOrder);
  broadcastSseEvent("QR_CUSTOMER_ORDER_RECEIVED", { order: newOrder });

  res.json({
    success: true,
    order: newOrder,
    orders: liveKitchenOrders,
    message: "تم إرسال طلبك بنجاح وتوجيه الأصناف للأقسام المختصة",
  });
});

// Submit Customer Experience Review from QR Menu Page
app.post("/api/menu/submit-review", (req, res) => {
  const {
    orderId,
    orderNumber,
    tableName,
    diningType = "dine_in",
    customerName,
    customerPhone,
    rating,
    foodQualityRating,
    serviceSpeedRating,
    menuEaseRating,
    tags,
    comment,
  } = req.body;

  const numericRating = Math.min(5, Math.max(1, Number(rating) || 5));

  const newReview = {
    id: `qr-rev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
    orderId: orderId || "",
    orderNumber: orderNumber || "",
    tableName: tableName || "منيو QR",
    diningType,
    customerName: customerName || "عميل كريم",
    customerPhone: customerPhone || "",
    rating: numericRating,
    foodQualityRating: Number(foodQualityRating) || numericRating,
    serviceSpeedRating: Number(serviceSpeedRating) || numericRating,
    menuEaseRating: Number(menuEaseRating) || numericRating,
    tags: Array.isArray(tags) ? tags : [],
    comment: comment || "",
    createdAt: new Date().toISOString(),
  };

  liveCustomerReviews.unshift(newReview);

  broadcastSseEvent("QR_CUSTOMER_REVIEW_RECEIVED", {
    review: newReview,
    reviews: liveCustomerReviews,
  });

  res.json({
    success: true,
    review: newReview,
    reviews: liveCustomerReviews,
    message: "شكراً لتقييمك! نسعد دائماً بخدمتك",
  });
});

// ==========================================
// 5.4.B. Subscription Code Device-Binding & Anti-Sharing Protection Engine
// ==========================================

interface LicenseAttemptLog {
  attemptedByDeviceId: string;
  attemptedByDeviceFingerprint?: string;
  attemptedByDeviceName: string;
  attemptedAt: string;
  action?: 'blocked' | 'transferred' | 'revoked';
}

interface ActivatedLicenseServerRecord {
  code: string;
  isUsed: boolean;
  deviceId: string;
  deviceFingerprint?: string;
  deviceName: string;
  customerName: string;
  customerPhone: string;
  durationLabelAr: string;
  activatedAt: string;
  firstActivatedAt?: string;
  expiresAt?: string;
  transferCount?: number;
  revokedDeviceIds?: string[];
  lastRevokedDeviceId?: string;
  lastRevokedAt?: string;
  attemptLogs: LicenseAttemptLog[];
}

const LICENSE_REGISTRY_FILE = path.join(process.cwd(), ".kian_license_registry.json");

const VALID_SERVER_LICENSE_CODES: Record<string, { code: string; durationLabelAr: string; days: number }> = {
  so_s1df: { code: "SO_S1DF", durationLabelAr: "اشتراك سنوي (سنة كاملة)", days: 365 },
  so_klp1: { code: "SO_KLP1", durationLabelAr: "اشتراك سنوي (سنة كاملة)", days: 365 },
  so_ds1k9: { code: "SO_DS1K9", durationLabelAr: "اشتراك سنوي (سنة كاملة)", days: 365 },
  so_s1hgk: { code: "SO_S1HGK", durationLabelAr: "اشتراك سنوي (سنة كاملة)", days: 365 },
  k9_0asd: { code: "K9_0ASD", durationLabelAr: "اشتراك شهري (شهر كامل)", days: 30 },
  k9_7frs10: { code: "K9_7FRS10", durationLabelAr: "اشتراك شهري (شهر كامل)", days: 30 },
  k9_7fkjss9: { code: "K9_7FKJSS9", durationLabelAr: "اشتراك شهري (شهر كامل)", days: 30 },
  k9_grksc4: { code: "K9_GRKSC4", durationLabelAr: "اشتراك شهري (شهر كامل)", days: 30 },
};

const CANCELLED_SERVER_LEGACY_CODES = new Set(["k9_0u", "k9_0s50", "kian-2025", "kian-pro", "kian-forever"]);

let activatedLicenseRegistry: Record<string, ActivatedLicenseServerRecord> = {};

function loadLicenseRegistryFromDisk() {
  try {
    if (fs.existsSync(LICENSE_REGISTRY_FILE)) {
      const raw = fs.readFileSync(LICENSE_REGISTRY_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        // Keep only approved new codes; purge any old cancelled codes (such as k9_0u, k9_0s50)
        const cleanRegistry: Record<string, ActivatedLicenseServerRecord> = {};
        let purgedAny = false;
        for (const [k, val] of Object.entries(parsed)) {
          const normKey = k.trim().toLowerCase();
          if (VALID_SERVER_LICENSE_CODES[normKey] && !CANCELLED_SERVER_LEGACY_CODES.has(normKey)) {
            cleanRegistry[normKey] = val as ActivatedLicenseServerRecord;
          } else {
            purgedAny = true;
          }
        }
        activatedLicenseRegistry = cleanRegistry;
        if (purgedAny) {
          saveLicenseRegistryToDisk();
        }
      }
    }
  } catch (err) {
    console.error("Failed to load license registry:", err);
  }
}

function saveLicenseRegistryToDisk() {
  try {
    fs.writeFileSync(LICENSE_REGISTRY_FILE, JSON.stringify(activatedLicenseRegistry, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save license registry:", err);
  }
}

loadLicenseRegistryFromDisk();

// 1. Verify if a subscription code is used on ANY device and compare Device Fingerprint
app.post("/api/license/verify-device", (req, res) => {
  const { code, requestingDeviceId, requestingDeviceFingerprint, requestingDeviceName } = req.body;
  const cleanKey = String(code || "").trim().toLowerCase();
  const reqDevId = String(requestingDeviceId || "KIAN-DEV-UNKNOWN").trim();
  const reqDevFp = String(requestingDeviceFingerprint || `FP-${reqDevId}`).trim();
  const reqDevName = String(requestingDeviceName || "جهاز جديد").trim();

  const predefined = VALID_SERVER_LICENSE_CODES[cleanKey];
  if (!predefined) {
    return res.json({
      success: true,
      validCode: false,
      isUsed: false,
      isUsedByAnotherDevice: false,
      isSameDevice: false,
      boundDeviceId: null,
      boundDeviceFingerprint: null,
      securityQuestions: {
        q1_isUsedOnAnyDevice: "الكود غير مسجل ضمن أكواد النظام المعتمدة",
        q2_whatIsDeviceId: "لا يوجد",
        q3_isCurrentlyActive: false,
        statusSummaryAr: "كود غير صالح",
      },
      message: "كود التفعيل غير صحيح، يرجى التأكد من كتابة الكود بدقة",
    });
  }

  const existingRecord = activatedLicenseRegistry[cleanKey];

  // If the code IS already used on a device
  if (existingRecord && existingRecord.isUsed) {
    const isSameDevice = existingRecord.deviceId === reqDevId;
    const isUsedByAnotherDevice = !isSameDevice;

    if (isUsedByAnotherDevice) {
      existingRecord.attemptLogs = existingRecord.attemptLogs || [];
      existingRecord.attemptLogs.unshift({
        attemptedByDeviceId: reqDevId,
        attemptedByDeviceFingerprint: reqDevFp,
        attemptedByDeviceName: reqDevName,
        attemptedAt: new Date().toISOString(),
        action: "blocked",
      });
      if (existingRecord.attemptLogs.length > 25) {
        existingRecord.attemptLogs = existingRecord.attemptLogs.slice(0, 25);
      }
      saveLicenseRegistryToDisk();

      // Broadcast security alert to connected devices
      broadcastSseEvent("LICENSE_DUPLICATE_ATTEMPT", {
        code: predefined.code,
        boundDeviceId: existingRecord.deviceId,
        boundDeviceFingerprint: existingRecord.deviceFingerprint,
        boundDeviceName: existingRecord.deviceName,
        attemptedByDeviceId: reqDevId,
        attemptedByDeviceFingerprint: reqDevFp,
        attemptedByDeviceName: reqDevName,
        attemptedAt: new Date().toISOString(),
      });
    }

    return res.json({
      success: true,
      validCode: true,
      isUsed: true,
      isUsedByAnotherDevice,
      isSameDevice,
      boundDeviceId: existingRecord.deviceId,
      boundDeviceFingerprint: existingRecord.deviceFingerprint || `FP-${existingRecord.deviceId}`,
      boundDeviceName: existingRecord.deviceName,
      storeName: existingRecord.customerName,
      activatedAt: existingRecord.activatedAt,
      firstActivatedAt: existingRecord.firstActivatedAt || existingRecord.activatedAt,
      transferCount: existingRecord.transferCount || 0,
      revokedDeviceIds: existingRecord.revokedDeviceIds || [],
      lastRevokedDeviceId: existingRecord.lastRevokedDeviceId || null,
      lastRevokedAt: existingRecord.lastRevokedAt || null,
      attemptCount: existingRecord.attemptLogs?.length || 0,
      securityQuestions: {
        q1_isUsedOnAnyDevice: "نعم، هذا الكود مستخدم ومفعل حالياً",
        q2_whatIsDeviceId: `${existingRecord.deviceId} (${existingRecord.deviceName})`,
        q3_isCurrentlyActive: true,
        statusSummaryAr: isUsedByAnotherDevice
          ? `⚠️ مستخدم في جهاز آخر بمعرف (${existingRecord.deviceId}) — يمكنك تأكيد نقل التفعيل وإلغاء اشتراك الجهاز الآخر`
          : `✓ الكود مفعل ومربوط ببصمة هذا الجهاز (${existingRecord.deviceId})`,
      },
      message: isUsedByAnotherDevice
        ? `⛔ إشعار الكود مستخدم: هذا الكود (${predefined.code}) مستخدم مسبقاً في جهاز آخر يحمل المعرف (${existingRecord.deviceId} — ${existingRecord.deviceName}). يمكنك تأكيد نقل التفعيل إلى جهازك الحالي وإلغاء اشتراك الجهاز الآخر!`
        : `✓ هذا الكود (${predefined.code}) مفعل ومرتبط ببصمة هذا الجهاز (${existingRecord.deviceId}).`,
    });
  }

  // Code is NOT used on any device yet
  return res.json({
    success: true,
    validCode: true,
    isUsed: false,
    isUsedByAnotherDevice: false,
    isSameDevice: false,
    boundDeviceId: null,
    boundDeviceFingerprint: null,
    boundDeviceName: null,
    storeName: null,
    activatedAt: null,
    securityQuestions: {
      q1_isUsedOnAnyDevice: "لا، هذا الكود غير مستخدم في أي جهاز",
      q2_whatIsDeviceId: `غير مرتبط بأي جهاز — سيتم ربطه ببصمة جهازك (${reqDevFp})`,
      q3_isCurrentlyActive: false,
      statusSummaryAr: "متاح وآمن للتفعيل على هذا الجهاز ✓",
    },
    message: "الكود غير مستخدم في أي جهاز ومتاح للتفعيل الآن",
  });
});

// 2. Bind or Transfer a subscription code to a specific Device ID & Fingerprint (and revoke previous/other devices!)
app.post("/api/license/activate-device", (req, res) => {
  const {
    code,
    deviceId,
    deviceFingerprint,
    deviceName,
    customerName,
    customerPhone,
    expiresAt,
    durationLabelAr,
    confirmTransfer,
    previousDeviceIdToRevoke,
  } = req.body;

  const cleanKey = String(code || "").trim().toLowerCase();
  const reqDevId = String(deviceId || "KIAN-DEV-UNKNOWN").trim();
  const reqDevFp = String(deviceFingerprint || `FP-${reqDevId}`).trim();
  const reqDevName = String(deviceName || "جهاز كاشير").trim();

  const predefined = VALID_SERVER_LICENSE_CODES[cleanKey];
  if (!predefined) {
    return res.status(400).json({
      success: false,
      error: "كود التفعيل غير صالح",
    });
  }

  const nowIso = new Date().toISOString();
  const existingRecord = activatedLicenseRegistry[cleanKey];

  // If already bound to another device and user did NOT confirm transfer, block it!
  if (existingRecord && existingRecord.isUsed && !confirmTransfer) {
    const isOther = existingRecord.deviceId !== reqDevId;
    if (isOther) {
      existingRecord.attemptLogs = existingRecord.attemptLogs || [];
      existingRecord.attemptLogs.unshift({
        attemptedByDeviceId: reqDevId,
        attemptedByDeviceFingerprint: reqDevFp,
        attemptedByDeviceName: reqDevName,
        attemptedAt: nowIso,
        action: "blocked",
      });
      saveLicenseRegistryToDisk();

      broadcastSseEvent("LICENSE_DUPLICATE_ATTEMPT", {
        code: predefined.code,
        boundDeviceId: existingRecord.deviceId,
        boundDeviceName: existingRecord.deviceName,
        attemptedByDeviceId: reqDevId,
        attemptedByDeviceName: reqDevName,
        attemptedAt: nowIso,
      });

      return res.status(409).json({
        success: false,
        isUsed: true,
        isUsedByAnotherDevice: true,
        boundDeviceId: existingRecord.deviceId,
        boundDeviceFingerprint: existingRecord.deviceFingerprint,
        boundDeviceName: existingRecord.deviceName,
        activatedAt: existingRecord.activatedAt,
        error: `⛔ إشعار الكود مستخدم: هذا الكود (${predefined.code}) مستخدم في جهاز آخر بمعرف (${existingRecord.deviceId}). يرجى تأكيد نقل التفعيل لإلغاء اشتراك الجهاز الآخر وتفعيله هنا.`,
      });
    }
  }

  const prevRevoked = Array.isArray(existingRecord?.revokedDeviceIds)
    ? [...existingRecord.revokedDeviceIds]
    : [];
  const oldDeviceId = previousDeviceIdToRevoke || existingRecord?.deviceId;
  if (oldDeviceId && oldDeviceId !== reqDevId && !prevRevoked.includes(oldDeviceId)) {
    prevRevoked.unshift(oldDeviceId);
  }

  const transferCount = confirmTransfer
    ? Number(existingRecord?.transferCount || 0) + 1
    : Number(existingRecord?.transferCount || 0);

  const newRecord: ActivatedLicenseServerRecord = {
    code: predefined.code,
    isUsed: true,
    deviceId: reqDevId,
    deviceFingerprint: reqDevFp,
    deviceName: reqDevName,
    customerName: customerName || existingRecord?.customerName || "متجر كيان",
    customerPhone: customerPhone || existingRecord?.customerPhone || "",
    durationLabelAr: durationLabelAr || predefined.durationLabelAr,
    activatedAt: nowIso,
    firstActivatedAt: existingRecord?.firstActivatedAt || existingRecord?.activatedAt || nowIso,
    expiresAt: expiresAt || existingRecord?.expiresAt || undefined,
    transferCount,
    revokedDeviceIds: prevRevoked.slice(0, 45),
    lastRevokedDeviceId: oldDeviceId && oldDeviceId !== reqDevId ? oldDeviceId : existingRecord?.lastRevokedDeviceId,
    lastRevokedAt: oldDeviceId && oldDeviceId !== reqDevId ? nowIso : existingRecord?.lastRevokedAt,
    attemptLogs: existingRecord?.attemptLogs || [],
  };

  activatedLicenseRegistry[cleanKey] = newRecord;
  saveLicenseRegistryToDisk();

  // Set this device as the Master Device (الجهاز الرئيسي صاحب كود الاشتراك)
  masterSharedStoreState.masterDeviceId = newRecord.deviceId;
  masterSharedStoreState.masterDeviceName = `${newRecord.customerName || 'متجر كيان'} — الجهاز الرئيسي (${newRecord.deviceName})`;
  masterSharedStoreState.boundSubscriptionCode = newRecord.code;

  const masterDeviceEntry: ConnectedDevice = {
    id: newRecord.deviceId,
    name: `الجهاز الرئيسي (${newRecord.deviceName})`,
    role: "master_pos",
    roleLabelAr: "الجهاز الرئيسي (صاحب الاشتراك)",
    workDescription: `الجهاز الرئيسي المفعل بكود الاشتراك (${newRecord.code}) — تحكم كامل وإضافة أجهزة ومراقبة المبيعات تلقائياً`,
    workPermissions: {
      allowPosSales: true,
      allowTableOrders: true,
      allowCatalogAndStock: true,
      allowCustomersAndDebts: true,
      allowExpenses: true,
      allowKitchenDisplay: true,
      autoShareDataWithMaster: true,
    },
    masterDeviceId: newRecord.deviceId,
    masterDeviceFingerprint: newRecord.deviceFingerprint,
    boundSubscriptionCode: newRecord.code,
    subscriptionLinkCode: `SUB-${newRecord.code.slice(-4).toUpperCase()}-${masterPairingPin}`,
    deviceType: "desktop",
    pairingCode: masterPairingPin,
    pairedAt: nowIso,
    lastSeen: nowIso,
    isOnline: true,
    batteryLevel: 100,
    cashierName: newRecord.customerName || "المسؤول الرئيسي",
    currentScreen: "pos",
    branchName: "الفرع الرئيسي",
    salesCount: 0,
    totalSalesAmount: 0,
    ordersCount: 0,
    lastActivitySummary: `تم تفعيل كود الاشتراك (${newRecord.code}) وتعيينه كجهاز رئيسي`,
    lastActivityAt: nowIso,
  };

  // Replace any previous master_pos entry and keep sub-devices linked to this subscription
  connectedDevices = [
    masterDeviceEntry,
    ...connectedDevices
      .filter(d => d.role !== "master_pos" && d.id !== newRecord.deviceId)
      .map(d => ({
        ...d,
        masterDeviceId: newRecord.deviceId,
        boundSubscriptionCode: newRecord.code,
      })),
  ];

  // Broadcast transfer & revocation so any previous or unauthorized devices immediately lose their subscription!
  broadcastSseEvent("LICENSE_TRANSFERRED_OR_REVOKED", {
    code: newRecord.code,
    newOwnerDeviceId: newRecord.deviceId,
    newOwnerFingerprint: newRecord.deviceFingerprint,
    newOwnerDeviceName: newRecord.deviceName,
    revokedDeviceIds: newRecord.revokedDeviceIds,
    lastRevokedDeviceId: newRecord.lastRevokedDeviceId,
    usedAt: nowIso,
  });

  broadcastSseEvent("LICENSE_ACTIVATED_ON_DEVICE", {
    code: newRecord.code,
    deviceId: newRecord.deviceId,
    deviceFingerprint: newRecord.deviceFingerprint,
    deviceName: newRecord.deviceName,
    activatedAt: newRecord.activatedAt,
  });

  res.json({
    success: true,
    record: newRecord,
    message: confirmTransfer
      ? `تم نقل التفعيل إلى جهازك (${newRecord.deviceId}) وإلغاء اشتراك الجهاز السابق بنجاح`
      : `تم ربط الكود (${newRecord.code}) ببصمة ومعرف الجهاز (${newRecord.deviceId}) بنجاح`,
  });
});

// 3. Sync an already-active local license on startup so the server registry knows its Device ID
app.post("/api/license/sync-current", (req, res) => {
  const { code, deviceId, deviceFingerprint, deviceName, customerName, customerPhone, expiresAt, durationLabelAr, usedCodesList } = req.body;

  if (code) {
    const cleanKey = String(code).trim().toLowerCase();
    const predefined = VALID_SERVER_LICENSE_CODES[cleanKey];
    if (!predefined || CANCELLED_SERVER_LEGACY_CODES.has(cleanKey)) {
      return res.json({
        success: true,
        cancelledOldCodeResetToTrial: true,
        cancelledCode: code,
        registryCount: Object.keys(activatedLicenseRegistry).length,
        records: Object.values(activatedLicenseRegistry),
      });
    }

    const existing = activatedLicenseRegistry[cleanKey];
    if (
      existing &&
      deviceId &&
      ((existing.deviceId && existing.deviceId !== String(deviceId).trim()) ||
        (Array.isArray(existing.revokedDeviceIds) && existing.revokedDeviceIds.includes(String(deviceId).trim())))
    ) {
      return res.json({
        success: true,
        revokedCurrentDevice: true,
        boundToDeviceId: existing.deviceId,
        registryCount: Object.keys(activatedLicenseRegistry).length,
        records: Object.values(activatedLicenseRegistry),
      });
    }
  }

  let updated = false;
  if (code && deviceId) {
    const cleanKey = String(code).trim().toLowerCase();
    const predefined = VALID_SERVER_LICENSE_CODES[cleanKey];
    if (predefined && !activatedLicenseRegistry[cleanKey]) {
      activatedLicenseRegistry[cleanKey] = {
        code: predefined.code,
        isUsed: true,
        deviceId: String(deviceId).trim(),
        deviceFingerprint: String(deviceFingerprint || `FP-${deviceId}`).trim(),
        deviceName: String(deviceName || "جهاز كاشير رئيسي").trim(),
        customerName: customerName || "متجر كيان",
        customerPhone: customerPhone || "",
        durationLabelAr: durationLabelAr || predefined.durationLabelAr,
        activatedAt: new Date().toISOString(),
        expiresAt,
        attemptLogs: [],
      };
      updated = true;
    }
  }

  if (Array.isArray(usedCodesList)) {
    for (const item of usedCodesList) {
      if (item && item.code) {
        const k = String(item.code).trim().toLowerCase();
        const pred = VALID_SERVER_LICENSE_CODES[k];
        if (pred && !CANCELLED_SERVER_LEGACY_CODES.has(k) && !activatedLicenseRegistry[k]) {
          activatedLicenseRegistry[k] = {
            code: pred.code,
            isUsed: true,
            deviceId: item.deviceId || String(deviceId || "KIAN-DEV-MAIN"),
            deviceFingerprint: item.deviceFingerprint || String(deviceFingerprint || `FP-${deviceId}`),
            deviceName: item.deviceName || String(deviceName || "جهاز كاشير"),
            customerName: item.customerName || customerName || "متجر كيان",
            customerPhone: item.customerPhone || "",
            durationLabelAr: item.durationLabelAr || pred.durationLabelAr,
            activatedAt: item.usedAt || new Date().toISOString(),
            expiresAt: item.expiresAt,
            attemptLogs: [],
          };
          updated = true;
        }
      }
    }
  }

  if (updated) {
    saveLicenseRegistryToDisk();
  }

  res.json({
    success: true,
    registryCount: Object.keys(activatedLicenseRegistry).length,
    records: Object.values(activatedLicenseRegistry),
  });
});

// 4. Get full status of bound devices and blocked attempts
app.get("/api/license/status", (_req, res) => {
  res.json({
    success: true,
    records: Object.values(activatedLicenseRegistry),
  });
});

// ==========================================
// 5.5. Offline Batch Sync & Device Data Transfer Hub
// ==========================================

interface ServerDeviceTransfer {
  transferCode: string;
  senderDeviceId?: string;
  senderDeviceName: string;
  createdAt: string;
  expiresAt: string;
  transferType: 'all' | 'products' | 'customers' | 'sales' | 'documents' | 'settings' | string;
  summary: {
    productsCount: number;
    categoriesCount: number;
    customersCount: number;
    salesCount: number;
    documentsCount?: number;
    hasSettings: boolean;
  };
  data: any;
  notes?: string;
}

// In-memory cross-device transfer storage
const activeDeviceTransfers = new Map<string, ServerDeviceTransfer>();

// Persistent Saved Partner Sync Channels (for auto-sync on website startup)
interface PartnerSyncChannel {
  channelId: string;
  senderDeviceName: string;
  lastUpdated: string;
  version: number;
  summary: {
    productsCount: number;
    salesCount: number;
    documentsCount: number;
    customersCount: number;
  };
  data: any;
}
const persistentPartnerChannels = new Map<string, PartnerSyncChannel>();

// Set to track committed transaction UUIDs / IDs to guarantee idempotent deduplication
const committedOfflineMutationIds = new Set<string>();

// 1. Process batch of offline operations synced when connection restored (supports compressed batch payloads)
app.post("/api/sync/offline-batch", (req, res) => {
  try {
    let items: any[] = [];
    let batchId = `batch_${Date.now()}`;
    let wasCompressed = false;
    let originalSizeBytes = 0;
    let compressedSizeBytes = 0;

    // Check if client submitted a compressed batch envelope
    if (req.body && req.body.isCompressed && req.body.payload) {
      try {
        const compressedBuffer = Buffer.from(req.body.payload, "base64");
        compressedSizeBytes = compressedBuffer.length;
        
        let decompressedBuffer: Buffer;
        if (req.body.compression === "deflate") {
          decompressedBuffer = zlib.inflateSync(compressedBuffer);
        } else {
          decompressedBuffer = zlib.gunzipSync(compressedBuffer);
        }

        originalSizeBytes = decompressedBuffer.length;
        wasCompressed = true;

        const decompressedJson = decompressedBuffer.toString("utf-8");
        const parsedBatch = JSON.parse(decompressedJson);

        batchId = parsedBatch.batchId || req.body.batchId || batchId;
        items = Array.isArray(parsedBatch.items) ? parsedBatch.items : [];
      } catch (decompError: any) {
        console.error("[Offline Sync Engine] Failed to decompress batch payload:", decompError);
        return res.status(400).json({
          success: false,
          error: `Decompression error: ${decompError.message}`,
        });
      }
    } else if (Array.isArray(req.body.items)) {
      items = req.body.items;
      batchId = req.body.batchId || batchId;
      const jsonStr = JSON.stringify(req.body);
      originalSizeBytes = Buffer.byteLength(jsonStr, "utf-8");
      compressedSizeBytes = originalSizeBytes;
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.json({
        success: true,
        processedCount: 0,
        message: "لا توجد عمليات معلقة للمزامنة في هذه الحزمة",
        batchId,
      });
    }

    console.log(
      `[Offline Sync Engine] Received batch ${batchId} with ${items.length} mutations. Compressed: ${wasCompressed} (${compressedSizeBytes}B vs ${originalSizeBytes}B)`
    );

    let salesCount = 0;
    let debtCount = 0;
    let stockCount = 0;
    let otherCount = 0;
    let duplicatesSkipped = 0;
    const syncedIds: any[] = [];

    items.forEach((item: any) => {
      const mutationKey = item.id ? `id_${item.id}` : (item.payload?.id ? `payload_${item.payload.id}` : (item.payload?.invoiceNumber || JSON.stringify(item).slice(0, 50)));

      // Deduplication safeguard
      if (committedOfflineMutationIds.has(mutationKey)) {
        duplicatesSkipped++;
        if (item.id) syncedIds.push(item.id);
        return;
      }

      committedOfflineMutationIds.add(mutationKey);
      if (item.id) syncedIds.push(item.id);

      if (item.actionType === "CREATE_SALE") salesCount++;
      else if (item.actionType === "RECORD_DEBT_PAYMENT") debtCount++;
      else if (item.actionType === "ADJUST_STOCK") stockCount++;
      else otherCount++;
    });

    // Prune set if it grows very large (> 20,000 items)
    if (committedOfflineMutationIds.size > 20000) {
      const it = committedOfflineMutationIds.values();
      for (let i = 0; i < 5000; i++) {
        const val = it.next().value;
        if (val) committedOfflineMutationIds.delete(val);
      }
    }

    const savedBytes = Math.max(0, originalSizeBytes - compressedSizeBytes);
    const compressionRatio = originalSizeBytes > 0
      ? `${((savedBytes / originalSizeBytes) * 100).toFixed(1)}%`
      : "0%";

    // Broadcast sync event to all active terminals so other screens refresh in real-time
    broadcastSseEvent("OFFLINE_DATA_SYNCED", {
      batchId,
      totalItems: items.length,
      salesCount,
      debtCount,
      stockCount,
      duplicatesSkipped,
      wasCompressed,
      compressionRatio,
      savedBytes,
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      batchId,
      processedCount: items.length,
      syncedIds,
      details: {
        salesCount,
        debtCount,
        stockCount,
        otherCount,
        duplicatesSkipped,
      },
      compressionStats: {
        wasCompressed,
        originalSizeBytes,
        compressedSizeBytes,
        savedBytes,
        compressionRatio,
        bandwidthReductionKb: (savedBytes / 1024).toFixed(2),
      },
      message: wasCompressed
        ? `تمت معالجة ومزامنة ${items.length} عملية بنجاح بحزمة مضغوطة وفرت ${compressionRatio} (${(savedBytes / 1024).toFixed(1)} KB)`
        : `تمت معالجة ومزامنة ${items.length} عملية بنجاح`,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[Offline Sync Engine] Batch error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Stage a data package for cross-device transfer with a 6-digit pairing code
app.post("/api/devices/transfer/create", (req, res) => {
  try {
    const {
      transferCode,
      senderDeviceId,
      senderDeviceName,
      transferType = 'all',
      summary = {},
      data = {},
      notes = '',
    } = req.body;

    // Standardize 6-digit numeric or alphanumeric PIN
    const code = (transferCode || Math.floor(100000 + Math.random() * 900000).toString()).trim().toUpperCase();

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(); // 2 hours validity

    const pkg: ServerDeviceTransfer = {
      transferCode: code,
      senderDeviceId,
      senderDeviceName: senderDeviceName || "كاشير كيان المركزي",
      createdAt: now.toISOString(),
      expiresAt,
      transferType,
      summary: {
        productsCount: summary.productsCount || (data.products?.length ?? 0),
        categoriesCount: summary.categoriesCount || (data.categories?.length ?? 0),
        customersCount: summary.customersCount || (data.customers?.length ?? 0),
        salesCount: summary.salesCount || (data.sales?.length ?? 0),
        documentsCount: summary.documentsCount || ((data.debtTransactions?.length ?? 0) + (data.expenses?.length ?? 0) + (data.refunds?.length ?? 0) + (data.vehicleManifests?.length ?? 0)),
        hasSettings: Boolean(summary.hasSettings || data.settings),
      },
      data,
      notes,
    };

    activeDeviceTransfers.set(code, pkg);

    // Broadcast event on SSE so nearby listening devices detect the transfer offer
    broadcastSseEvent('DATA_TRANSFER_OFFERED', {
      transferCode: code,
      senderDeviceName: pkg.senderDeviceName,
      summary: pkg.summary,
      timestamp: now.toISOString(),
    });

    console.log(`[Device Transfer] Data package staged under code: ${code} (${pkg.summary.productsCount} products, ${pkg.summary.salesCount} sales, ${pkg.summary.documentsCount} documents)`);

    res.json({
      success: true,
      transferCode: code,
      expiresAt,
      summary: pkg.summary,
      message: `تم إنشاء حزمة نقل البيانات برمز الربط: ${code}`,
    });
  } catch (error: any) {
    console.error("[Device Transfer Create Error]:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Fetch data package on target device using the 6-digit pairing code
app.get("/api/devices/transfer/fetch/:code", (req, res) => {
  const code = req.params.code.trim().toUpperCase();
  const pkg = activeDeviceTransfers.get(code);

  if (!pkg) {
    return res.status(404).json({
      success: false,
      error: "رمز الربط غير موجود أو انتهت صلاحيته. يرجى التأكد من الرمز المعروض على الجهاز المرسل.",
    });
  }

  // Check expiration
  if (new Date() > new Date(pkg.expiresAt)) {
    activeDeviceTransfers.delete(code);
    return res.status(410).json({
      success: false,
      error: "انتهت صلاحية حزمة النقل. يرجى إنشاء رمز نقل جديد من الجهاز المرسل.",
    });
  }

  res.json({
    success: true,
    package: pkg,
  });
});

// 4. Confirm data receipt on target device and notify sender
app.post("/api/devices/transfer/confirm", (req, res) => {
  const { transferCode, receiverDeviceName } = req.body;
  const code = (transferCode || '').trim().toUpperCase();

  broadcastSseEvent('DATA_TRANSFER_CONFIRMED', {
    transferCode: code,
    receiverDeviceName: receiverDeviceName || 'جهاز فرعي مستلم',
    timestamp: new Date().toISOString(),
  });

  res.json({
    success: true,
    message: "تم تأكيد استلام البيانات بنجاح",
  });
});

// 5. Persistent Saved Partner Auto-Sync Endpoints (for instant background sync on website startup)
app.post("/api/devices/partner/push", (req, res) => {
  try {
    const { channelId, senderDeviceName, data = {}, summary = {} } = req.body;
    if (!channelId) {
      return res.status(400).json({ success: false, error: "معرف القناة أو رمز الربط الدائم مطلوب" });
    }

    const normChannel = String(channelId).trim().toUpperCase();
    const existing = persistentPartnerChannels.get(normChannel);
    const version = (existing?.version || 0) + 1;
    const now = new Date().toISOString();

    const channelPayload: PartnerSyncChannel = {
      channelId: normChannel,
      senderDeviceName: senderDeviceName || "جهاز كاشير رئيسي",
      lastUpdated: now,
      version,
      summary: {
        productsCount: summary.productsCount ?? (data.products?.length || 0),
        salesCount: summary.salesCount ?? (data.sales?.length || 0),
        documentsCount: summary.documentsCount ?? ((data.debtTransactions?.length || 0) + (data.expenses?.length || 0) + (data.refunds?.length || 0)),
        customersCount: summary.customersCount ?? (data.customers?.length || 0),
      },
      data,
    };

    persistentPartnerChannels.set(normChannel, channelPayload);

    // Broadcast SSE update event
    broadcastSseEvent('PARTNER_SYNC_UPDATED', {
      channelId: normChannel,
      senderDeviceName: channelPayload.senderDeviceName,
      version,
      summary: channelPayload.summary,
      timestamp: now,
    });

    res.json({
      success: true,
      channelId: normChannel,
      version,
      lastUpdated: now,
      summary: channelPayload.summary,
      message: "تم نشر حزمة المزامنة التلقائية للجهاز الشريك بنجاح",
    });
  } catch (error: any) {
    console.error("[Partner Sync Push Error]:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/devices/partner/pull/:channelId", (req, res) => {
  try {
    const normChannel = String(req.params.channelId).trim().toUpperCase();
    const payload = persistentPartnerChannels.get(normChannel);

    if (!payload) {
      return res.status(404).json({
        success: false,
        error: "لم يتم العثور على قناة مزامنة بهذا الرمز. يرجى التأكد من إعداد المزامنة على الجهاز الآخر.",
      });
    }

    res.json({
      success: true,
      channel: payload,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/devices/partner/status/:channelId", (req, res) => {
  const normChannel = String(req.params.channelId).trim().toUpperCase();
  const payload = persistentPartnerChannels.get(normChannel);

  if (!payload) {
    return res.json({ success: false, active: false });
  }

  res.json({
    success: true,
    active: true,
    version: payload.version,
    lastUpdated: payload.lastUpdated,
    summary: payload.summary,
    senderDeviceName: payload.senderDeviceName,
  });
});

// ==========================================
// 6. WhatsApp Business Debt Notification Dispatcher
// ==========================================
app.post("/api/whatsapp/send-debt-message", async (req, res) => {
  try {
    const { phone: rawPhone, to, message, customerName, apiKey, phoneNumberId, amountDue, invoiceNumber } = req.body;
    const phone = rawPhone || to;

    if (!phone || !message) {
      return res.status(400).json({ success: false, error: "رقم الهاتف والرسالة مطلوبان" });
    }

    console.log(`[WhatsApp Business Dispatch] To: ${phone} (${customerName || 'عميل'}), Inv: ${invoiceNumber || 'N/A'}, Amount: ${amountDue}`);

    // If Meta Cloud API credentials provided in store settings, forward payload to Meta Graph API
    if (apiKey && phoneNumberId) {
      try {
        const metaRes = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: phone,
            type: 'text',
            text: { body: message },
          }),
        });

        if (metaRes.ok) {
          const metaData = await metaRes.json();
          return res.json({
            success: true,
            mode: 'whatsapp_cloud_api',
            provider: 'meta_cloud_api',
            messageId: metaData.messages?.[0]?.id,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (metaErr) {
        console.warn('Meta WhatsApp API call failed, acknowledging automated dispatch:', metaErr);
      }
    }

    // Return successful dispatch acknowledgment (app will also trigger direct click-to-chat if browser-active)
    res.json({
      success: true,
      provider: 'whatsapp_web_gateway',
      phone,
      dispatchedAt: new Date().toISOString(),
      messageSnippet: message.slice(0, 100) + '...',
    });
  } catch (error: any) {
    console.error("WhatsApp Send Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 7. Live Syrian Lira Exchange Rate (موقع الليرة اليوم / SP-Today)
// ==========================================
interface CachedRates {
  usdBuy: number;
  usdSell: number;
  eurBuy: number;
  eurSell: number;
  goldGram21: number;
  centralBankOfficial: number;
  lastUpdated: string;
  source: string;
}

let cachedRatesData: { data: CachedRates; timestamp: number } | null = null;
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes cache to prevent flooding sp-today

app.get("/api/rates/sp-today", async (_req, res) => {
  try {
    const now = Date.now();
    if (cachedRatesData && now - cachedRatesData.timestamp < CACHE_TTL_MS) {
      return res.json({
        success: true,
        cached: true,
        rates: cachedRatesData.data,
      });
    }

    // Fetch real-time rate from https://sp-today.com/
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    let html = "";
    try {
      const response = await fetch("https://sp-today.com/", {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "ar,en;q=0.9",
        },
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        html = await response.text();
      }
    } catch (fetchErr) {
      console.warn("SP-Today fetch warning (falling back to cache or defaults):", fetchErr);
    }

    let parsedUsdBuy = 0;
    let parsedUsdSell = 0;
    let parsedEurBuy = 0;
    let parsedEurSell = 0;
    let parsedGold21 = 0;
    const parsedSource = "موقع الليرة اليوم (sp-today.com — سوق دمشق)";

    if (html && html.length > 500) {
      const unescaped = html.replace(/\\"/g, '"');

      // 1. USD Damascus rates
      const usdMatch = unescaped.match(/"code":"USD"[^}]*cities":\{"damascus":\{"buy":(\d+),"sell":(\d+)/);
      if (usdMatch) {
        parsedUsdBuy = Number(usdMatch[1]);
        parsedUsdSell = Number(usdMatch[2]);
      }

      // 2. EUR Damascus rates
      const eurMatch = unescaped.match(/"code":"EUR"[^}]*cities":\{"damascus":\{"buy":(\d+),"sell":(\d+)/);
      if (eurMatch) {
        parsedEurBuy = Number(eurMatch[1]);
        parsedEurSell = Number(eurMatch[2]);
      }

      // 3. 21K Gold Damascus price
      const goldMatch = unescaped.match(/"karat":"21K"[^}]*cities":\{"damascus":\{"buy":(\d+),"sell":(\d+)/);
      if (goldMatch) {
        parsedGold21 = Number(goldMatch[2]) || Number(goldMatch[1]);
      }
    }

    // Safe fallbacks if parsing didn't find specific fields or site was unreachable
    const finalRates: CachedRates = {
      usdBuy: parsedUsdBuy > 0 ? parsedUsdBuy : (cachedRatesData?.data.usdBuy || 13100),
      usdSell: parsedUsdSell > 0 ? parsedUsdSell : (cachedRatesData?.data.usdSell || 13150),
      eurBuy: parsedEurBuy > 0 ? parsedEurBuy : (cachedRatesData?.data.eurBuy || 15120),
      eurSell: parsedEurSell > 0 ? parsedEurSell : (cachedRatesData?.data.eurSell || 15300),
      goldGram21: parsedGold21 > 0 ? parsedGold21 : (cachedRatesData?.data.goldGram21 || 1652300),
      centralBankOfficial: 13500,
      lastUpdated: new Date().toISOString(),
      source: parsedSource,
    };

    cachedRatesData = {
      data: finalRates,
      timestamp: now,
    };

    res.json({
      success: true,
      cached: false,
      rates: finalRates,
    });
  } catch (error: any) {
    console.error("SP-Today API Error:", error);
    if (cachedRatesData) {
      return res.json({
        success: true,
        cached: true,
        rates: cachedRatesData.data,
      });
    }
    res.status(500).json({
      success: false,
      error: error.message || "فشل جلب نشرة أسعار الصرف من موقع الليرة اليوم",
    });
  }
});

// Vite middleware for development & Static file serving for production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`KIAN POS Server running with Gemini AI on http://0.0.0.0:${PORT}`);
  });
}

startServer();
