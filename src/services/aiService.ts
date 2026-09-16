// Client-side AI Service calling server endpoints

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: string;
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

export interface OCRInvoiceData {
  supplierName?: string;
  invoiceDate?: string;
  invoiceNumber?: string;
  totalAmount?: number;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
    unit?: string;
  }>;
  notes?: string;
}

export const aiService = {
  // 1. Send chat message to Gemini
  async sendChatMessage(messages: { role: string; content: string }[], contextData?: any, systemPrompt?: string) {
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
    return data.reply as string;
  },

  // 2. Perform deep sales analysis
  async analyzeSales(params: {
    sales: any[];
    products: any[];
    expenses: any[];
    period?: string;
    businessMode?: string;
  }) {
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
    return data.analysis as string;
  },

  // 3. Smart Inventory Restock Suggestions
  async getInventoryRestockPlan(params: { products: any[]; recentSales: any[] }) {
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
    return data.recommendation as string;
  },

  // 4. Smart Product Details & Pricing Generator
  async generateProductDetails(params: { inputPrompt: string; categoryName?: string; imageBase64?: string }) {
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
    return data.product as GeneratedProductData;
  },

  // 5. Marketing Campaign Generator
  async generateMarketingCampaign(params: {
    campaignType: string;
    targetAudience: string;
    offerDetails: string;
    storeName?: string;
  }) {
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
    return data.campaign as string;
  },

  // 6. OCR Invoice Scanner
  async scanInvoiceImage(imageBase64: string) {
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
};
