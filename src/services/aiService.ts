// Client-side AI Service calling server endpoints (/api/ai/*)

export interface SuggestedAIAction {
  actionType: 'create_promotion' | 'restock_low_items' | 'apply_wholesale_margin' | 'open_tab';
  labelAr: string;
  descriptionAr?: string;
  value?: number;
  targetTab?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: string;
  followUpQuestions?: string[];
  suggestedActions?: SuggestedAIAction[];
}

export interface StructuredSalesAudit {
  healthScore?: number;
  executiveSummary?: string;
  keyInsights?: Array<{
    title: string;
    metric: string;
    impact: string;
    type: 'positive' | 'warning' | 'action' | string;
  }>;
  slowMoversPlan?: Array<{
    productName: string;
    currentStock?: number;
    suggestedDiscountPercent: number;
    actionPlan: string;
  }>;
  strategicRecommendations?: string[];
  forecastSummary?: string;
  analysis?: string;
}

export interface RestockPlanItem {
  productId?: string;
  productName: string;
  currentStock: number;
  minStock?: number;
  recommendedOrderQty: number;
  estimatedUnitCost: number;
  estimatedTotalCost?: number;
  priority: 'critical' | 'high' | 'medium' | string;
  reason: string;
}

export interface StructuredRestockPlan {
  summary?: string;
  estimatedTotalBudget?: number;
  items?: RestockPlanItem[];
  recommendation?: string;
}

export interface GeneratedProductData {
  nameAr: string;
  nameEn: string;
  suggestedRetailPrice: number;
  suggestedCostPrice: number;
  suggestedWholesalePrice?: number;
  wholesaleMinQty?: number;
  wholesaleUnit?: string;
  wholesaleUnitMultiplier?: number;
  unit: string;
  minStock: number;
  sku: string;
  barcode: string;
  notes: string;
}

export interface StructuredMarketingCampaign {
  campaignTitle?: string;
  whatsappMessage?: string;
  smsMessage?: string;
  socialPost?: string;
  conversionTip?: string;
  suggestedPromotion?: {
    nameAr: string;
    discountPercent: number;
    description: string;
  };
  campaign?: string;
}

export interface OCRInvoiceData {
  supplierName?: string;
  invoiceDate?: string;
  invoiceNumber?: string;
  totalAmount?: number;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    suggestedRetailPrice?: number;
    suggestedWholesalePrice?: number;
    total: number;
    unit?: string;
  }>;
  notes?: string;
}

export interface PricingRecommendationItem {
  productId?: string;
  productName: string;
  costPrice: number;
  currentRetailPrice: number;
  suggestedRetailPrice: number;
  currentWholesalePrice?: number;
  suggestedWholesalePrice: number;
  marginBeforePercent?: number;
  marginAfterPercent?: number;
  reasoning: string;
}

export interface PricingOptimizationPlan {
  strategySummary: string;
  expectedOverallMarginGain?: string;
  recommendations: PricingRecommendationItem[];
}

export interface DebtorCollectionItem {
  customerId?: string;
  customerName: string;
  phone?: string;
  debtAmount: number;
  priority: 'high' | 'medium' | 'low' | string;
  recommendedAction: string;
  whatsappMessage: string;
}

export interface DebtAnalysisPlan {
  overallStrategy: string;
  liquidityRiskLevel: 'low' | 'moderate' | 'high' | string;
  debtorsPlan: DebtorCollectionItem[];
}

export const aiService = {
  // 1. Send chat message to Gemini with actionable suggestions
  async sendChatMessage(
    messages: { role: string; content: string }[],
    contextData?: any,
    systemPrompt?: string
  ): Promise<{
    reply: string;
    followUpQuestions: string[];
    suggestedActions: SuggestedAIAction[];
  }> {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, contextData, systemPrompt }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Network error' }));
      throw new Error(err.error || `HTTP error ${res.status}`);
    }

    const data = await res.json();
    return {
      reply: data.reply as string,
      followUpQuestions: data.followUpQuestions || [],
      suggestedActions: data.suggestedActions || [],
    };
  },

  // 2. Perform deep sales & financial analysis
  async analyzeSales(params: {
    sales: any[];
    products: any[];
    expenses: any[];
    period?: string;
    businessMode?: string;
  }): Promise<{ analysis: string; structuredAudit?: StructuredSalesAudit }> {
    const res = await fetch('/api/ai/analyze-sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Network error' }));
      throw new Error(err.error || `HTTP error ${res.status}`);
    }

    const data = await res.json();
    return {
      analysis: data.analysis as string,
      structuredAudit: data.structuredAudit as StructuredSalesAudit | undefined,
    };
  },

  // 3. Smart Inventory Restock Suggestions
  async getInventoryRestockPlan(params: {
    products: any[];
    recentSales: any[];
  }): Promise<{ recommendation: string; restockPlan?: StructuredRestockPlan }> {
    const res = await fetch('/api/ai/smart-inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Network error' }));
      throw new Error(err.error || `HTTP error ${res.status}`);
    }

    const data = await res.json();
    return {
      recommendation: data.recommendation as string,
      restockPlan: data.restockPlan as StructuredRestockPlan | undefined,
    };
  },

  // 4. Smart Product Details & Batch Catalog Generator
  async generateProductDetails(params: {
    inputPrompt: string;
    categoryName?: string;
    imageBase64?: string;
    batchMode?: boolean;
    count?: number;
  }): Promise<{ product: GeneratedProductData | null; products?: GeneratedProductData[] }> {
    const res = await fetch('/api/ai/generate-product', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Network error' }));
      throw new Error(err.error || `HTTP error ${res.status}`);
    }

    const data = await res.json();
    return {
      product: (data.product as GeneratedProductData) || null,
      products: data.products as GeneratedProductData[] | undefined,
    };
  },

  // 5. Marketing Campaign Generator
  async generateMarketingCampaign(params: {
    campaignType: string;
    targetAudience: string;
    offerDetails: string;
    storeName?: string;
  }): Promise<{ campaign: string; structuredCampaign?: StructuredMarketingCampaign }> {
    const res = await fetch('/api/ai/marketing-campaign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Network error' }));
      throw new Error(err.error || `HTTP error ${res.status}`);
    }

    const data = await res.json();
    return {
      campaign: data.campaign as string,
      structuredCampaign: data.structuredCampaign as StructuredMarketingCampaign | undefined,
    };
  },

  // 6. OCR Invoice Scanner
  async scanInvoiceImage(imageBase64: string): Promise<OCRInvoiceData> {
    const res = await fetch('/api/ai/ocr-receipt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64 }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Network error' }));
      throw new Error(err.error || `HTTP error ${res.status}`);
    }

    const data = await res.json();
    return data.invoiceData as OCRInvoiceData;
  },

  // 7. Smart Pricing & Margin Optimizer
  async optimizePricing(params: {
    products: any[];
    sales: any[];
    businessMode?: string;
  }): Promise<PricingOptimizationPlan> {
    const res = await fetch('/api/ai/optimize-pricing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Network error' }));
      throw new Error(err.error || `HTTP error ${res.status}`);
    }

    const data = await res.json();
    return data.pricingPlan as PricingOptimizationPlan;
  },

  // 8. Smart Debt & Credit Risk Analyzer
  async analyzeDebts(params: {
    customers: any[];
    suppliers: any[];
    debtTransactions: any[];
    storeName?: string;
  }): Promise<DebtAnalysisPlan> {
    const res = await fetch('/api/ai/analyze-debts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Network error' }));
      throw new Error(err.error || `HTTP error ${res.status}`);
    }

    const data = await res.json();
    return data.debtAnalysis as DebtAnalysisPlan;
  },
};
