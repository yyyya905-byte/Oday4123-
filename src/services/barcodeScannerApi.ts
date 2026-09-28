import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { normalizeArabicDigits } from '../utils/barcodeUtils';

export interface ScannerCameraDevice {
  id: string;
  label: string;
  facing: 'environment' | 'user' | 'unknown';
}

export interface BarcodeScannerConfig {
  elementId: string;
  facingMode?: 'environment' | 'user';
  deviceId?: string;
  fps?: number;
  qrbox?: { width: number; height: number } | number;
  aspectRatio?: number;
  cooldownMs?: number;
  onScan: (decodedText: string, format?: string) => void;
  onError?: (error: string) => void;
}

export interface BarcodeScanResult {
  code: string;
  format?: string;
  timestamp: number;
}

/**
 * Native BarcodeDetector declaration if supported by the browser
 */
declare global {
  interface Window {
    BarcodeDetector?: any;
  }
}

/**
 * Barcode Scanner API
 * Provides a unified, high-performance API for camera-based barcode scanning
 * with auto-detection, camera enumeration, flashlight control, and smart debouncing.
 */
export class BarcodeScannerApi {
  private scannerInstance: Html5Qrcode | null = null;
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private currentElementId: string | null = null;
  private currentDeviceId: string | null = null;
  private torchEnabled: boolean = false;
  private hasTorchSupport: boolean = false;
  private lastScannedCode: string = '';
  private lastScannedTimestamp: number = 0;
  private config: BarcodeScannerConfig | null = null;

  /**
   * Check if camera access is supported in current browser/environment
   */
  public static isCameraSupported(): boolean {
    return typeof navigator !== 'undefined' && 
      !!(navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function');
  }

  /**
   * Check if native browser BarcodeDetector API is available (Chrome 88+, Edge 88+, Android WebView)
   */
  public static isNativeBarcodeDetectorSupported(): boolean {
    return typeof window !== 'undefined' && 'BarcodeDetector' in window;
  }

  /**
   * Get list of available video input cameras on device
   */
  public static async getAvailableCameras(): Promise<ScannerCameraDevice[]> {
    if (!BarcodeScannerApi.isCameraSupported()) {
      return [];
    }

    try {
      const devices = await Html5Qrcode.getCameras();
      if (!devices || devices.length === 0) {
        return [];
      }

      return devices.map((d, index) => {
        const lowerLabel = (d.label || '').toLowerCase();
        let facing: 'environment' | 'user' | 'unknown' = 'unknown';
        if (lowerLabel.includes('back') || lowerLabel.includes('rear') || lowerLabel.includes('environment')) {
          facing = 'environment';
        } else if (lowerLabel.includes('front') || lowerLabel.includes('user') || lowerLabel.includes('selfie')) {
          facing = 'user';
        }
        return {
          id: d.id,
          label: d.label || `كاميرا ${index + 1}`,
          facing,
        };
      });
    } catch (err) {
      console.warn('[BarcodeScannerApi] Could not list cameras:', err);
      return [];
    }
  }

  /**
   * Start camera barcode scanner on a DOM element
   */
  public async start(config: BarcodeScannerConfig): Promise<boolean> {
    this.config = config;
    this.currentElementId = config.elementId;

    // Stop any active session first
    if (this.scannerInstance && this.isRunning) {
      try {
        await this.scannerInstance.stop();
      } catch {
        // Ignore stop error during restart
      }
      this.isRunning = false;
    }

    try {
      const scanner = new Html5Qrcode(config.elementId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.DATA_MATRIX,
          Html5QrcodeSupportedFormats.ITF,
          Html5QrcodeSupportedFormats.CODABAR,
        ],
        verbose: false
      });
      this.scannerInstance = scanner;

      const cameraSelection = config.deviceId
        ? { deviceId: { exact: config.deviceId } }
        : { facingMode: config.facingMode || 'environment' };

      const qrbox = config.qrbox || { width: 280, height: 160 };
      const fps = config.fps || 20;
      const aspectRatio = config.aspectRatio || 1.333;
      const cooldown = config.cooldownMs ?? 750;

      await scanner.start(
        cameraSelection,
        {
          fps,
          qrbox,
          aspectRatio,
        },
        (decodedText, result) => {
          if (this.isPaused) return;

          const clean = normalizeArabicDigits(decodedText).trim();
          if (!clean) return;

          const now = Date.now();
          const isSameCode = clean.toLowerCase() === this.lastScannedCode.toLowerCase();
          
          // Debounce same barcode within cooldown window
          if (isSameCode && now - this.lastScannedTimestamp < cooldown) {
            return;
          }

          this.lastScannedCode = clean;
          this.lastScannedTimestamp = now;

          const formatName = result?.result?.format?.formatName || undefined;
          config.onScan(clean, formatName);
        },
        () => {
          // Frame without barcode - normal continuous video loop
        }
      );

      this.isRunning = true;
      this.isPaused = false;
      this.currentDeviceId = config.deviceId || null;

      // Check torch capabilities
      this.checkTorchSupport();

      return true;
    } catch (err: any) {
      this.isRunning = false;
      const errorMsg = err?.message || String(err);
      console.warn('[BarcodeScannerApi] Failed to start camera:', err);
      if (config.onError) {
        config.onError(errorMsg);
      }
      return false;
    }
  }

  /**
   * Stop scanner and release hardware camera stream
   */
  public async stop(): Promise<void> {
    if (this.scannerInstance && this.isRunning) {
      try {
        await this.scannerInstance.stop();
      } catch (err) {
        console.warn('[BarcodeScannerApi] Error during stop:', err);
      }
    }
    this.isRunning = false;
    this.isPaused = false;
    this.torchEnabled = false;
  }

  /**
   * Pause scanning without closing video feed
   */
  public pause(): void {
    if (this.scannerInstance && this.isRunning && !this.isPaused) {
      try {
        this.scannerInstance.pause();
        this.isPaused = true;
      } catch (err) {
        console.warn('[BarcodeScannerApi] Error pausing:', err);
      }
    }
  }

  /**
   * Resume scanning after pause
   */
  public resume(): void {
    if (this.scannerInstance && this.isRunning && this.isPaused) {
      try {
        this.scannerInstance.resume();
        this.isPaused = false;
      } catch (err) {
        console.warn('[BarcodeScannerApi] Error resuming:', err);
      }
    }
  }

  /**
   * Check if torch / flashlight is supported on the active video track
   */
  private checkTorchSupport(): boolean {
    try {
      if (this.scannerInstance) {
        const capabilities = (this.scannerInstance as any).getRunningTrackCapabilities?.();
        this.hasTorchSupport = !!(capabilities && capabilities.torch);
        return this.hasTorchSupport;
      }
    } catch {
      this.hasTorchSupport = false;
    }
    return false;
  }

  /**
   * Toggle flashlight/torch on mobile back camera
   */
  public async toggleTorch(enable?: boolean): Promise<boolean> {
    if (!this.scannerInstance || !this.isRunning) return false;

    const nextState = enable !== undefined ? enable : !this.torchEnabled;

    try {
      await this.scannerInstance.applyVideoConstraints({
        advanced: [{ torch: nextState } as any]
      });
      this.torchEnabled = nextState;
      return true;
    } catch (err) {
      console.warn('[BarcodeScannerApi] Torch toggle not supported:', err);
      return false;
    }
  }

  /**
   * Switch between available cameras
   */
  public async switchCamera(deviceId: string): Promise<boolean> {
    if (!this.config) return false;
    await this.stop();
    return this.start({
      ...this.config,
      deviceId,
    });
  }

  /**
   * Decode barcode from an uploaded image file directly
   */
  public async scanImageFile(file: File): Promise<string | null> {
    const tempScannerId = 'temp-barcode-file-scanner';
    let tempDiv = document.getElementById(tempScannerId);
    if (!tempDiv) {
      tempDiv = document.createElement('div');
      tempDiv.id = tempScannerId;
      tempDiv.style.display = 'none';
      document.body.appendChild(tempDiv);
    }

    try {
      const fileScanner = new Html5Qrcode(tempScannerId);
      const decodedText = await fileScanner.scanFile(file, false);
      const clean = normalizeArabicDigits(decodedText).trim();
      fileScanner.clear();
      return clean;
    } catch (err) {
      console.warn('[BarcodeScannerApi] Could not decode barcode from file:', err);
      return null;
    }
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }

  public getIsPaused(): boolean {
    return this.isPaused;
  }

  public getIsTorchOn(): boolean {
    return this.torchEnabled;
  }

  public getHasTorchSupport(): boolean {
    return this.hasTorchSupport;
  }
}

/**
 * Singleton instance of the Barcode Scanner API
 */
export const barcodeScannerApi = new BarcodeScannerApi();
