import { useState, useEffect, useRef, useCallback } from 'react';
import {
  BarcodeScannerApi,
  ScannerCameraDevice,
  BarcodeScannerConfig
} from '../services/barcodeScannerApi';

export interface UseCameraBarcodeScannerOptions {
  onScan: (decodedText: string, format?: string) => void;
  onError?: (error: string) => void;
  cooldownMs?: number;
  facingMode?: 'environment' | 'user';
  fps?: number;
  qrbox?: { width: number; height: number } | number;
}

export interface UseCameraBarcodeScannerReturn {
  isScanning: boolean;
  isStarting: boolean;
  isPaused: boolean;
  error: string | null;
  cameras: ScannerCameraDevice[];
  activeCameraId: string | null;
  hasTorch: boolean;
  isTorchOn: boolean;
  isSupported: boolean;
  startScanner: (elementId: string) => Promise<boolean>;
  stopScanner: () => Promise<void>;
  pauseScanner: () => void;
  resumeScanner: () => void;
  toggleTorch: (enable?: boolean) => Promise<boolean>;
  switchCamera: (deviceId: string) => Promise<boolean>;
  scanImageFile: (file: File) => Promise<string | null>;
}

export function useCameraBarcodeScanner(options: UseCameraBarcodeScannerOptions): UseCameraBarcodeScannerReturn {
  const [isScanning, setIsScanning] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<ScannerCameraDevice[]>([]);
  const [activeCameraId, setActiveCameraId] = useState<string | null>(null);
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const isSupported = BarcodeScannerApi.isCameraSupported();

  const scannerRef = useRef<BarcodeScannerApi | null>(null);
  const currentElementIdRef = useRef<string | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  if (!scannerRef.current) {
    scannerRef.current = new BarcodeScannerApi();
  }

  // Load available camera devices once
  useEffect(() => {
    let isMounted = true;
    if (isSupported) {
      BarcodeScannerApi.getAvailableCameras().then((deviceList) => {
        if (isMounted) {
          setCameras(deviceList);
          // Pick environment back camera as default if found
          const backCam = deviceList.find(d => d.facing === 'environment') || deviceList[0];
          if (backCam) {
            setActiveCameraId(backCam.id);
          }
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [isSupported]);

  // Clean up when unmounting
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop();
      }
    };
  }, []);

  const startScanner = useCallback(async (elementId: string): Promise<boolean> => {
    if (!scannerRef.current) return false;
    setIsStarting(true);
    setError(null);
    currentElementIdRef.current = elementId;

    const config: BarcodeScannerConfig = {
      elementId,
      facingMode: optionsRef.current.facingMode || 'environment',
      deviceId: activeCameraId || undefined,
      fps: optionsRef.current.fps || 20,
      qrbox: optionsRef.current.qrbox || { width: 280, height: 160 },
      cooldownMs: optionsRef.current.cooldownMs ?? 750,
      onScan: (text, format) => {
        optionsRef.current.onScan(text, format);
      },
      onError: (err) => {
        setError(err);
        if (optionsRef.current.onError) {
          optionsRef.current.onError(err);
        }
      }
    };

    const success = await scannerRef.current.start(config);
    setIsStarting(false);
    setIsScanning(success);
    setIsPaused(false);
    setHasTorch(scannerRef.current.getHasTorchSupport());
    setIsTorchOn(scannerRef.current.getIsTorchOn());
    return success;
  }, [activeCameraId]);

  const stopScanner = useCallback(async (): Promise<void> => {
    if (!scannerRef.current) return;
    await scannerRef.current.stop();
    setIsScanning(false);
    setIsPaused(false);
    setIsTorchOn(false);
  }, []);

  const pauseScanner = useCallback((): void => {
    if (!scannerRef.current) return;
    scannerRef.current.pause();
    setIsPaused(true);
  }, []);

  const resumeScanner = useCallback((): void => {
    if (!scannerRef.current) return;
    scannerRef.current.resume();
    setIsPaused(false);
  }, []);

  const toggleTorch = useCallback(async (enable?: boolean): Promise<boolean> => {
    if (!scannerRef.current) return false;
    const ok = await scannerRef.current.toggleTorch(enable);
    if (ok) {
      setIsTorchOn(scannerRef.current.getIsTorchOn());
    }
    return ok;
  }, []);

  const switchCamera = useCallback(async (deviceId: string): Promise<boolean> => {
    setActiveCameraId(deviceId);
    if (!scannerRef.current || !currentElementIdRef.current) return false;
    return scannerRef.current.switchCamera(deviceId);
  }, []);

  const scanImageFile = useCallback(async (file: File): Promise<string | null> => {
    if (!scannerRef.current) return null;
    return scannerRef.current.scanImageFile(file);
  }, []);

  return {
    isScanning,
    isStarting,
    isPaused,
    error,
    cameras,
    activeCameraId,
    hasTorch,
    isTorchOn,
    isSupported,
    startScanner,
    stopScanner,
    pauseScanner,
    resumeScanner,
    toggleTorch,
    switchCamera,
    scanImageFile,
  };
}
