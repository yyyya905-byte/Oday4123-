// Bluetooth ESC/POS Thermal Receipt Printer Service for Cashier POS
// Supports Web Bluetooth API, ESC/POS byte streaming, and Canvas Raster graphics for Arabic typography

import QRCode from 'qrcode';
import { Sale, StoreSettings } from '../types';

export interface BluetoothPrinterStatus {
  isSupported: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  deviceName: string | null;
  deviceId: string | null;
  error: string | null;
  lastPrintedAt: string | null;
}

// Standard Known Bluetooth Receipt Printer Service & Characteristic UUIDs
const KNOWN_PRINTER_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Standard Printer Service (0x18f0)
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Posnet / Xprinter / Rongta
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC / Microchip / Bluetooth Serial
  '0000ff00-0000-1000-8000-00805f9b34fb', // 0xFF00 Common Chinese Thermal Printers
  '0000fee7-0000-1000-8000-00805f9b34fb', // Tencent / POS-58 / MPT-II
  '0000fff0-0000-1000-8000-00805f9b34fb', // 0xFFF0 Generic ESC/POS
  '0000af30-0000-1000-8000-00805f9b34fb',
];

type StatusListener = (status: BluetoothPrinterStatus) => void;

class BluetoothPrinterService {
  private device: any | null = null;
  private server: any | null = null;
  private characteristic: any | null = null;
  private isConnecting: boolean = false;
  private lastError: string | null = null;
  private lastPrintedTime: string | null = null;
  private listeners: Set<StatusListener> = new Set();

  public isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  public getStatus(): BluetoothPrinterStatus {
    return {
      isSupported: this.isSupported(),
      isConnected: this.isConnected(),
      isConnecting: this.isConnecting,
      deviceName: this.device?.name || null,
      deviceId: this.device?.id || null,
      error: this.lastError,
      lastPrintedAt: this.lastPrintedTime,
    };
  }

  public isConnected(): boolean {
    return !!(this.device && this.device.gatt?.connected && this.characteristic);
  }

  public subscribe(listener: StatusListener): () => void {
    this.listeners.add(listener);
    listener(this.getStatus());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const status = this.getStatus();
    this.listeners.forEach(cb => {
      try { cb(status); } catch {}
    });
  }

  /**
   * Request Bluetooth Pairing & Connect to Thermal Receipt Printer
   */
  public async connect(): Promise<boolean> {
    if (!this.isSupported()) {
      this.lastError = 'متصفحك لا يدعم Web Bluetooth API. يرجى استخدام Google Chrome أو Edge على نظام Android أو Windows.';
      this.notify();
      return false;
    }

    try {
      this.isConnecting = true;
      this.lastError = null;
      this.notify();

      // Request device with printer filter or acceptAllDevices with optionalServices
      const navAny = navigator as any;
      const device = await navAny.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: KNOWN_PRINTER_SERVICES,
      });

      if (!device) {
        throw new Error('لم يتم اختيار أي جهاز بلوتوث');
      }

      this.device = device;
      device.addEventListener('gattserverdisconnected', this.onDisconnected.bind(this));

      // Connect to GATT Server
      const server = await device.gatt.connect();
      this.server = server;

      // Find writable characteristic
      let writeChar: any = null;

      // Try discovering among known services
      for (const serviceUuid of KNOWN_PRINTER_SERVICES) {
        try {
          const service = await server.getPrimaryService(serviceUuid);
          if (service) {
            const characteristics = await service.getCharacteristics();
            for (const char of characteristics) {
              if (char.properties.write || char.properties.writeWithoutResponse) {
                writeChar = char;
                break;
              }
            }
          }
        } catch {
          // Continue searching other services
        }
        if (writeChar) break;
      }

      // If still not found, search all primary services if available
      if (!writeChar && server.getPrimaryServices) {
        try {
          const allServices = await server.getPrimaryServices();
          for (const service of allServices) {
            try {
              const characteristics = await service.getCharacteristics();
              for (const char of characteristics) {
                if (char.properties.write || char.properties.writeWithoutResponse) {
                  writeChar = char;
                  break;
                }
              }
            } catch {}
            if (writeChar) break;
          }
        } catch {}
      }

      if (!writeChar) {
        throw new Error('تم الاتصال بالجهاز، لكن لم يتم العثور على قناة إرسال بيانات متوافقة مع ESC/POS.');
      }

      this.characteristic = writeChar;
      this.isConnecting = false;
      this.lastError = null;
      this.notify();
      return true;
    } catch (err: any) {
      console.warn('Bluetooth connection error:', err);
      this.isConnecting = false;
      this.lastError = err.message || 'فشل الاتصال بطابعة البلوتوث';
      this.notify();
      return false;
    }
  }

  private onDisconnected() {
    this.server = null;
    this.characteristic = null;
    this.notify();
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.device?.gatt?.connected) {
        this.device.gatt.disconnect();
      }
    } catch {}
    this.device = null;
    this.server = null;
    this.characteristic = null;
    this.notify();
  }

  /**
   * Stream raw bytes in small chunks to prevent Bluetooth buffer overflow
   */
  public async sendRawBytes(data: Uint8Array, onProgress?: (percent: number) => void): Promise<boolean> {
    if (!this.isConnected()) {
      throw new Error('طابعة البلوتوث غير متصلة حالياً.');
    }

    const CHUNK_SIZE = 128; // Safe packet size for BLE thermal printers
    const total = data.length;
    let offset = 0;

    while (offset < total) {
      const chunk = data.slice(offset, offset + CHUNK_SIZE);
      if (this.characteristic.writeValueWithoutResponse) {
        await this.characteristic.writeValueWithoutResponse(chunk);
      } else {
        await this.characteristic.writeValue(chunk);
      }
      offset += chunk.length;
      if (onProgress) {
        onProgress(Math.min(100, Math.round((offset / total) * 100)));
      }
      // Brief sleep between chunks for thermal printhead buffer
      await new Promise(r => setTimeout(r, 20));
    }

    this.lastPrintedTime = new Date().toLocaleTimeString('ar-SY');
    this.notify();
    return true;
  }

  /**
   * Convert an HTML5 Canvas into ESC/POS monochrome raster data (GS v 0)
   * This is the industry gold-standard for printing Arabic text and QR codes on thermal receipt printers!
   */
  public canvasToEscPosRaster(canvas: HTMLCanvasElement): Uint8Array {
    const width = canvas.width;
    const height = canvas.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new Uint8Array(0);

    const imageData = ctx.getImageData(0, 0, width, height);
    const pixels = imageData.data;
    const widthBytes = Math.ceil(width / 8);

    // ESC/POS GS v 0 m xL xH yL yH
    // m = 0 (Normal)
    const xL = widthBytes & 0xff;
    const xH = (widthBytes >> 8) & 0xff;
    const yL = height & 0xff;
    const yH = (height >> 8) & 0xff;

    const header = [
      0x1b, 0x40,             // ESC @: Initialize printer
      0x1b, 0x61, 0x01,       // ESC a 1: Center alignment
      0x1d, 0x76, 0x30, 0x00, // GS v 0 0: Raster bit image normal mode
      xL, xH, yL, yH,
    ];

    const rasterBytes = new Uint8Array(widthBytes * height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const r = pixels[idx];
        const g = pixels[idx + 1];
        const b = pixels[idx + 2];
        const a = pixels[idx + 3];

        // Luminance thresholding
        // Black pixel on white receipt = 1 bit in ESC/POS
        const luminance = a < 128 ? 255 : 0.299 * r + 0.587 * g + 0.114 * b;
        const isBlack = luminance < 140;

        if (isBlack) {
          const byteIdx = y * widthBytes + Math.floor(x / 8);
          const bitPos = 7 - (x % 8);
          rasterBytes[byteIdx] |= (1 << bitPos);
        }
      }
    }

    // Trailing feed and optional cut
    const footer = [
      0x1b, 0x64, 0x05,       // ESC d 5: Feed 5 lines
      0x1d, 0x56, 0x41, 0x10, // GS V A 16: Partial paper cut
    ];

    const combined = new Uint8Array(header.length + rasterBytes.length + footer.length);
    combined.set(header, 0);
    combined.set(rasterBytes, header.length);
    combined.set(footer, header.length + rasterBytes.length);

    return combined;
  }

  /**
   * Render a Sale Invoice to an offscreen Canvas and print it via ESC/POS Raster
   */
  public async printSaleReceipt(
    sale: Sale,
    settings: StoreSettings,
    paperWidthMm: '58mm' | '80mm' = '80mm',
    onProgress?: (percent: number) => void
  ): Promise<boolean> {
    const canvas = document.createElement('canvas');
    // 58mm = 384 dots width, 80mm = 576 dots width (203 DPI standard)
    const targetWidth = paperWidthMm === '58mm' ? 384 : 576;
    canvas.width = targetWidth;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context unavailable');

    // Generate QR Code data URL first
    const qrPayload = JSON.stringify({
      store: settings.storeNameAr || 'كيان',
      inv: sale.invoiceNumber,
      date: sale.createdAt,
      total: sale.total,
      tax: sale.taxTotal,
      cashier: sale.cashierName,
    });

    let qrImage: HTMLImageElement | null = null;
    try {
      const qrUrl = await QRCode.toDataURL(qrPayload, { width: 140, margin: 1 });
      qrImage = await new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = qrUrl;
      });
    } catch {}

    // Load Store Logo if configured
    let logoImage: HTMLImageElement | null = null;
    const shouldPrintLogo = (settings.printStoreLogo ?? settings.receiptShowLogo ?? true) && !!settings.logo;
    if (shouldPrintLogo && settings.logo) {
      try {
        logoImage = await new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
          img.src = settings.logo;
        });
      } catch {}
    }

    // Estimate Canvas Height
    const baseHeight = 350;
    const itemsHeight = sale.items.length * (paperWidthMm === '58mm' ? 36 : 30);
    const qrHeight = qrImage ? 160 : 0;
    const logoHeight = logoImage ? (paperWidthMm === '58mm' ? 75 : 95) : 0;
    const totalHeight = baseHeight + itemsHeight + qrHeight + logoHeight;
    canvas.height = totalHeight;

    // Fill Pure White Background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, targetWidth, totalHeight);

    // Setup Text Rendering
    ctx.fillStyle = '#000000';
    ctx.textBaseline = 'top';

    let y = 14;
    const padding = paperWidthMm === '58mm' ? 10 : 20;
    const contentWidth = targetWidth - padding * 2;
    const centerX = targetWidth / 2;

    // 0. Store Logo (if available)
    if (logoImage) {
      const maxLogoW = paperWidthMm === '58mm' ? 130 : 170;
      const maxLogoH = paperWidthMm === '58mm' ? 65 : 85;
      let lw = logoImage.width;
      let lh = logoImage.height;
      if (lw > maxLogoW) {
        lh = (lh * maxLogoW) / lw;
        lw = maxLogoW;
      }
      if (lh > maxLogoH) {
        lw = (lw * maxLogoH) / lh;
        lh = maxLogoH;
      }
      const lx = centerX - lw / 2;
      ctx.drawImage(logoImage, lx, y, lw, lh);
      y += lh + 10;
    }

    // 1. Header: Store Name
    ctx.font = `bold ${paperWidthMm === '58mm' ? '22px' : '26px'} 'Segoe UI', Tahoma, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(settings.storeNameAr || 'نظام كيان كاشير', centerX, y);
    y += paperWidthMm === '58mm' ? 26 : 32;

    if (settings.tagline) {
      ctx.font = `normal ${paperWidthMm === '58mm' ? '12px' : '14px'} Tahoma, sans-serif`;
      ctx.fillText(settings.tagline, centerX, y);
      y += 20;
    }

    if (settings.phone) {
      ctx.font = `normal ${paperWidthMm === '58mm' ? '12px' : '14px'} Tahoma, sans-serif`;
      ctx.fillText(`هاتف: ${settings.phone}`, centerX, y);
      y += 20;
    }

    // Divider
    drawDashedLine(ctx, padding, y, targetWidth - padding);
    y += 12;

    // 2. Invoice Meta Info
    ctx.font = `bold ${paperWidthMm === '58mm' ? '13px' : '15px'} Tahoma, sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText(`فاتورة بيع #${sale.invoiceNumber}`, targetWidth - padding, y);
    ctx.textAlign = 'left';
    ctx.font = `normal ${paperWidthMm === '58mm' ? '11px' : '13px'} Tahoma, sans-serif`;
    ctx.fillText(new Date(sale.createdAt).toLocaleDateString('ar-SY'), padding, y);
    y += 22;

    if (sale.cashierName) {
      ctx.textAlign = 'right';
      ctx.fillText(`الكاشير: ${sale.cashierName}`, targetWidth - padding, y);
      if (sale.diningType) {
        ctx.textAlign = 'left';
        ctx.fillText(sale.diningType === 'dine_in' ? `صالة (${sale.tableName || 'طاولة'})` : 'سفري', padding, y);
      }
      y += 20;
    }

    // Divider
    drawDashedLine(ctx, padding, y, targetWidth - padding);
    y += 10;

    // 3. Items Header
    ctx.font = `bold ${paperWidthMm === '58mm' ? '12px' : '13px'} Tahoma, sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText('الصنف', targetWidth - padding, y);
    ctx.textAlign = 'center';
    ctx.fillText('الكمية', centerX - (paperWidthMm === '58mm' ? 10 : 0), y);
    ctx.textAlign = 'left';
    ctx.fillText('الإجمالي', padding, y);
    y += 20;

    ctx.lineWidth = 1;
    ctx.strokeStyle = '#000000';
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(targetWidth - padding, y);
    ctx.stroke();
    y += 8;

    // 4. Items Rows
    ctx.font = `normal ${paperWidthMm === '58mm' ? '12px' : '13px'} Tahoma, sans-serif`;
    for (const item of sale.items) {
      const name = item.productNameAr || item.productNameEn || 'صنف';
      const truncatedName = name.length > (paperWidthMm === '58mm' ? 18 : 26) 
        ? name.slice(0, paperWidthMm === '58mm' ? 16 : 24) + '..' 
        : name;

      ctx.textAlign = 'right';
      ctx.font = `bold ${paperWidthMm === '58mm' ? '12px' : '13px'} Tahoma, sans-serif`;
      ctx.fillText(truncatedName, targetWidth - padding, y);

      ctx.textAlign = 'center';
      ctx.font = `normal ${paperWidthMm === '58mm' ? '11px' : '12px'} Tahoma, sans-serif`;
      ctx.fillText(`${item.quantity}`, centerX - (paperWidthMm === '58mm' ? 10 : 0), y);

      ctx.textAlign = 'left';
      ctx.font = `bold ${paperWidthMm === '58mm' ? '12px' : '13px'} Tahoma, sans-serif`;
      ctx.fillText(item.total.toLocaleString(), padding, y);

      y += 22;
    }

    // Divider
    drawDashedLine(ctx, padding, y, targetWidth - padding);
    y += 14;

    // 5. Totals Section
    ctx.font = `bold ${paperWidthMm === '58mm' ? '13px' : '14px'} Tahoma, sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText('المجموع الفرعي:', targetWidth - padding, y);
    ctx.textAlign = 'left';
    ctx.fillText(`${sale.subtotal.toLocaleString()} ${settings.currency?.symbol || 'ل.س'}`, padding, y);
    y += 20;

    if (sale.discountTotal && sale.discountTotal > 0) {
      ctx.textAlign = 'right';
      ctx.fillText('الخصم:', targetWidth - padding, y);
      ctx.textAlign = 'left';
      ctx.fillText(`-${sale.discountTotal.toLocaleString()} ${settings.currency?.symbol || 'ل.س'}`, padding, y);
      y += 20;
    }

    if (sale.taxTotal && sale.taxTotal > 0) {
      ctx.textAlign = 'right';
      ctx.fillText('الضريبة:', targetWidth - padding, y);
      ctx.textAlign = 'left';
      ctx.fillText(`${sale.taxTotal.toLocaleString()} ${settings.currency?.symbol || 'ل.س'}`, padding, y);
      y += 20;
    }

    // Grand Total (Large Bold Box)
    y += 4;
    ctx.strokeRect(padding, y, contentWidth, 38);
    ctx.font = `bold ${paperWidthMm === '58mm' ? '16px' : '18px'} Tahoma, sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText('الإجمالي النهائي:', targetWidth - padding - 8, y + 9);
    ctx.textAlign = 'left';
    ctx.fillText(`${sale.total.toLocaleString()} ${settings.currency?.symbol || 'ل.س'}`, padding + 8, y + 9);
    y += 48;

    // Payment Method
    ctx.font = `normal ${paperWidthMm === '58mm' ? '11px' : '12px'} Tahoma, sans-serif`;
    ctx.textAlign = 'center';
    const methodStr = sale.paymentMethod === 'cash' ? 'نقداً (كاش)' : sale.paymentMethod === 'card' ? 'بطاقة بنكية' : 'ذمم / آجل';
    ctx.fillText(`طريقة الدفع: ${methodStr}`, centerX, y);
    y += 18;

    // 6. QR Code
    if (qrImage) {
      const qrSize = paperWidthMm === '58mm' ? 110 : 130;
      ctx.drawImage(qrImage, centerX - qrSize / 2, y, qrSize, qrSize);
      y += qrSize + 8;
    }

    // 7. Footer message
    if (settings.receiptFooter) {
      ctx.font = `normal ${paperWidthMm === '58mm' ? '10px' : '11px'} Tahoma, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(settings.receiptFooter, centerX, y);
      y += 18;
    }

    // Convert Canvas to ESC/POS Raster Bytes
    const rasterData = this.canvasToEscPosRaster(canvas);

    // Stream to Bluetooth Device
    return await this.sendRawBytes(rasterData, onProgress);
  }

  /**
   * Print Kitchen Ticket via ESC/POS
   */
  public async printKitchenTicket(
    ticket: {
      orderId: string;
      tableName?: string;
      guestCount?: number;
      diningType: string;
      items: { name: string; quantity: number; notes?: string }[];
      timestamp: string;
    },
    settings: StoreSettings,
    paperWidthMm: '58mm' | '80mm' = '80mm',
    onProgress?: (percent: number) => void
  ): Promise<boolean> {
    const canvas = document.createElement('canvas');
    const targetWidth = paperWidthMm === '58mm' ? 384 : 576;
    canvas.width = targetWidth;

    const baseHeight = 240;
    const itemsHeight = ticket.items.length * (paperWidthMm === '58mm' ? 44 : 38);
    canvas.height = baseHeight + itemsHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context unavailable');

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, targetWidth, canvas.height);
    ctx.fillStyle = '#000000';
    ctx.textBaseline = 'top';

    let y = 14;
    const padding = 16;
    const centerX = targetWidth / 2;

    // Kitchen Header
    ctx.font = `bold ${paperWidthMm === '58mm' ? '24px' : '28px'} Tahoma, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('🍳 طلب مطبخ فوري', centerX, y);
    y += 36;

    // Table / Type Banner
    ctx.strokeRect(padding, y, targetWidth - padding * 2, 40);
    ctx.font = `bold ${paperWidthMm === '58mm' ? '16px' : '18px'} Tahoma, sans-serif`;
    ctx.textAlign = 'center';
    const typeLabel = ticket.diningType === 'dine_in' ? `طاولة [${ticket.tableName || '1'}] (${ticket.guestCount || 1} ضيوف)` : 'طلب سفري / تيك أواي';
    ctx.fillText(typeLabel, centerX, y + 8);
    y += 50;

    // Time & Order #
    ctx.font = `normal ${paperWidthMm === '58mm' ? '12px' : '13px'} Tahoma, sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText(`طلب #${ticket.orderId}`, targetWidth - padding, y);
    ctx.textAlign = 'left';
    ctx.fillText(ticket.timestamp, padding, y);
    y += 24;

    drawDashedLine(ctx, padding, y, targetWidth - padding);
    y += 12;

    // Items list (High Contrast, Large Font for Chefs)
    for (const item of ticket.items) {
      ctx.textAlign = 'right';
      ctx.font = `bold ${paperWidthMm === '58mm' ? '16px' : '18px'} Tahoma, sans-serif`;
      ctx.fillText(item.name, targetWidth - padding, y);

      ctx.textAlign = 'left';
      ctx.font = `bold ${paperWidthMm === '58mm' ? '20px' : '24px'} Tahoma, sans-serif`;
      ctx.fillText(`× ${item.quantity}`, padding, y);
      y += 26;

      if (item.notes) {
        ctx.font = `italic ${paperWidthMm === '58mm' ? '12px' : '14px'} Tahoma, sans-serif`;
        ctx.textAlign = 'right';
        ctx.fillText(`ملاحظة: ${item.notes}`, targetWidth - padding - 8, y);
        y += 20;
      }
    }

    y += 10;
    drawDashedLine(ctx, padding, y, targetWidth - padding);

    const rasterData = this.canvasToEscPosRaster(canvas);
    return await this.sendRawBytes(rasterData, onProgress);
  }

  /**
   * Diagnostic Test Print
   */
  public async printTestReceipt(
    settings: StoreSettings,
    paperWidthMm: '58mm' | '80mm' = '80mm',
    onProgress?: (percent: number) => void
  ): Promise<boolean> {
    const canvas = document.createElement('canvas');
    const targetWidth = paperWidthMm === '58mm' ? 384 : 576;
    canvas.width = targetWidth;
    canvas.height = 360;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context unavailable');

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, targetWidth, canvas.height);
    ctx.fillStyle = '#000000';
    ctx.textBaseline = 'top';

    const centerX = targetWidth / 2;
    const padding = 16;
    let y = 14;

    ctx.font = 'bold 22px Tahoma, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🖨️ اختبار طابعة البلوتوث', centerX, y);
    y += 32;

    ctx.font = 'normal 13px Tahoma, sans-serif';
    ctx.fillText(settings.storeNameAr || 'نظام كيان كاشير', centerX, y);
    y += 22;

    drawDashedLine(ctx, padding, y, targetWidth - padding);
    y += 14;

    ctx.font = 'normal 13px Tahoma, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`اسم الجهاز: ${this.device?.name || 'طابعة حرارية بلوتوث'}`, targetWidth - padding, y);
    y += 22;

    ctx.fillText(`مقاس الرول: ${paperWidthMm}`, targetWidth - padding, y);
    y += 22;

    ctx.fillText(`تاريخ ووقت الاختبار: ${new Date().toLocaleString('ar-SY')}`, targetWidth - padding, y);
    y += 22;

    ctx.fillText('حالة الاتصال: متصل وجاهز للطباعة بنجاح ✅', targetWidth - padding, y);
    y += 28;

    drawDashedLine(ctx, padding, y, targetWidth - padding);
    y += 14;

    ctx.font = 'bold 12px Tahoma, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('*** نهاية فحص الاتصال اللاسلكي ***', centerX, y);

    const rasterData = this.canvasToEscPosRaster(canvas);
    return await this.sendRawBytes(rasterData, onProgress);
  }

  /**
   * Cash Drawer Kick (Standard ESC/POS Pulse)
   */
  public async kickCashDrawer(): Promise<boolean> {
    if (!this.isConnected()) return false;
    // ESC p 0 25 250 (pulse drawer pin 2, 50ms on, 500ms off)
    const kickCommand = new Uint8Array([0x1b, 0x70, 0x00, 0x19, 0xfa]);
    return await this.sendRawBytes(kickCommand);
  }
}

function drawDashedLine(ctx: CanvasRenderingContext2D, x1: number, y: number, x2: number) {
  ctx.save();
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2, y);
  ctx.stroke();
  ctx.restore();
}

export const bluetoothPrinter = new BluetoothPrinterService();
