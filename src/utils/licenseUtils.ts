/**
 * License & App Activation Utility
 * Handles license validation with predefined codes (annual, monthly, lifetime),
 * Device Fingerprinting verification against Firebase Firestore, activation transfer,
 * usage timestamp tracking, and automatic revocation of other devices' subscriptions.
 */
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

// Authorized developer Gmails permitted to view developer license controls
export const AUTHORIZED_PURCHASE_GENERATOR_EMAILS: readonly string[] = [
  'yyyya901@gmail.com',
  'yyyya905@gmail.com'
];

/**
 * Checks if a given email is authorized for developer license tools
 */
export function isAuthorizedToGenerateCodes(email?: string | null): boolean {
  if (!email || typeof email !== 'string') return false;
  const normalized = email.trim().toLowerCase();
  return AUTHORIZED_PURCHASE_GENERATOR_EMAILS.some(
    authorizedEmail => authorizedEmail.toLowerCase() === normalized
  );
}

export interface PredefinedLicenseCode {
  code: string;
  duration: '1_year' | '1_month' | 'lifetime';
  durationDays: number; // 365 for year, 30 for month
  durationLabelAr: string;
  singleUse: boolean;
  notes: string;
}

/**
 * Predefined activation codes specified by the system owner:
 * - Annual (365 days, single use): K9_0u, SO_S1DF, SO_KLP1, SO_DS1K9, SO_S1HGK
 * - Monthly (30 days, single use): K9_0s50, K9_0ASD, K9_7FRS10, K9_7FKJSS9, K9_GRKSC4
 */
export const PREDEFINED_LICENSE_CODES: PredefinedLicenseCode[] = [
  // --- أكواد السنة الكاملة (365 يوماً - استخدام لمرة واحدة) ---
  {
    code: 'K9_0u',
    duration: '1_year',
    durationDays: 365,
    durationLabelAr: 'اشتراك سنوي (سنة كاملة)',
    singleUse: true,
    notes: 'كود ترخيص سنوي لمدة 365 يوماً — استخدام لمرة واحدة فقط'
  },
  {
    code: 'SO_S1DF',
    duration: '1_year',
    durationDays: 365,
    durationLabelAr: 'اشتراك سنوي (سنة كاملة)',
    singleUse: true,
    notes: 'كود ترخيص سنوي لمدة 365 يوماً — استخدام لمرة واحدة فقط'
  },
  {
    code: 'SO_KLP1',
    duration: '1_year',
    durationDays: 365,
    durationLabelAr: 'اشتراك سنوي (سنة كاملة)',
    singleUse: true,
    notes: 'كود ترخيص سنوي لمدة 365 يوماً — استخدام لمرة واحدة فقط'
  },
  {
    code: 'SO_DS1K9',
    duration: '1_year',
    durationDays: 365,
    durationLabelAr: 'اشتراك سنوي (سنة كاملة)',
    singleUse: true,
    notes: 'كود ترخيص سنوي لمدة 365 يوماً — استخدام لمرة واحدة فقط'
  },
  {
    code: 'SO_S1HGK',
    duration: '1_year',
    durationDays: 365,
    durationLabelAr: 'اشتراك سنوي (سنة كاملة)',
    singleUse: true,
    notes: 'كود ترخيص سنوي لمدة 365 يوماً — استخدام لمرة واحدة فقط'
  },

  // --- أكواد الشهر الكامل (30 يوماً - استخدام لمرة واحدة) ---
  {
    code: 'K9_0s50',
    duration: '1_month',
    durationDays: 30,
    durationLabelAr: 'اشتراك شهري (شهر كامل)',
    singleUse: true,
    notes: 'كود ترخيص شهري لمدة 30 يوماً — استخدام لمرة واحدة فقط'
  },
  {
    code: 'K9_0ASD',
    duration: '1_month',
    durationDays: 30,
    durationLabelAr: 'اشتراك شهري (شهر كامل)',
    singleUse: true,
    notes: 'كود ترخيص شهري لمدة 30 يوماً — استخدام لمرة واحدة فقط'
  },
  {
    code: 'K9_7FRS10',
    duration: '1_month',
    durationDays: 30,
    durationLabelAr: 'اشتراك شهري (شهر كامل)',
    singleUse: true,
    notes: 'كود ترخيص شهري لمدة 30 يوماً — استخدام لمرة واحدة فقط'
  },
  {
    code: 'K9_7FKJSS9',
    duration: '1_month',
    durationDays: 30,
    durationLabelAr: 'اشتراك شهري (شهر كامل)',
    singleUse: true,
    notes: 'كود ترخيص شهري لمدة 30 يوماً — استخدام لمرة واحدة فقط'
  },
  {
    code: 'K9_GRKSC4',
    duration: '1_month',
    durationDays: 30,
    durationLabelAr: 'اشتراك شهري (شهر كامل)',
    singleUse: true,
    notes: 'كود ترخيص شهري لمدة 30 يوماً — استخدام لمرة واحدة فقط'
  }
];

// Master activation codes list for backward compatibility
export const MASTER_ACTIVATION_CODES = PREDEFINED_LICENSE_CODES.map(c => c.code);

/**
 * Calculate the exact expiration ISO date string based on subscription code duration
 * - 1_year: 1 full year from startDate
 * - 1_month: 1 full month from startDate
 */
export function calculateSubscriptionExpirationDate(
  duration: '1_year' | '1_month' | 'lifetime',
  startDate: Date = new Date()
): string | null {
  if (duration === 'lifetime') {
    return null;
  }

  const expDate = new Date(startDate.getTime());
  if (duration === '1_year') {
    expDate.setFullYear(expDate.getFullYear() + 1);
  } else if (duration === '1_month') {
    expDate.setMonth(expDate.getMonth() + 1);
  } else {
    expDate.setDate(expDate.getDate() + 30);
  }

  return expDate.toISOString();
}

const USED_CODES_STORAGE_KEY = 'kian_used_license_codes';
const HARDWARE_DEVICE_ID_KEY = 'kian_pos_hardware_device_id';
const HARDWARE_FINGERPRINT_KEY = 'kian_pos_device_fingerprint_v1';

export interface DeviceHardwareInfo {
  deviceId: string;
  deviceFingerprint: string;
  deviceName: string;
  platform: string;
  screenResolution: string;
  hardwareSummary: string;
}

/**
 * Computes a multi-factor hardware & browser Device Fingerprint (Canvas + WebGL + Screen + CPU + Timezone)
 */
export function computeDeviceFingerprint(): string {
  try {
    const cached = localStorage.getItem(HARDWARE_FINGERPRINT_KEY);
    if (cached && cached.startsWith('FP-')) {
      return cached;
    }

    const nav = typeof navigator !== 'undefined' ? navigator : null;
    const scr = typeof window !== 'undefined' && window.screen ? window.screen : null;
    const tz = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC';

    let canvasSig = 'no-canvas';
    let webglSig = 'no-webgl';
    if (typeof document !== 'undefined') {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 180;
        canvas.height = 40;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.textBaseline = 'top';
          ctx.font = '14px monospace';
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(10, 5, 80, 20);
          ctx.fillStyle = '#0f172a';
          ctx.fillText('KIAN-POS-FP-2026', 6, 8);
          canvasSig = canvas.toDataURL().slice(-48);
        }
      } catch {}

      try {
        const glCanvas = document.createElement('canvas');
        const gl: any = glCanvas.getContext('webgl') || glCanvas.getContext('experimental-webgl');
        if (gl) {
          const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
          const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
          webglSig = String(renderer || 'webgl').slice(0, 48);
        }
      } catch {}
    }

    const rawSignals = [
      nav?.platform || 'POS',
      nav?.language || 'ar',
      scr ? `${scr.width}x${scr.height}x${scr.colorDepth}` : '1920x1080x24',
      nav?.hardwareConcurrency || 4,
      (nav as any)?.deviceMemory || 8,
      tz,
      canvasSig,
      webglSig,
    ].join('||');

    let h1 = 0x811c9dc5;
    let h2 = 0x1000193;
    for (let i = 0; i < rawSignals.length; i++) {
      const ch = rawSignals.charCodeAt(i);
      h1 ^= ch;
      h1 = Math.imul(h1, 0x01000193);
      h2 = (h2 << 5) - h2 + ch;
      h2 |= 0;
    }

    const p1 = Math.abs(h1).toString(16).toUpperCase().padStart(4, '0').slice(0, 4);
    const p2 = Math.abs(h2).toString(16).toUpperCase().padStart(4, '0').slice(0, 4);
    const devIdTail = getOrCreateHardwareDeviceId().split('-').pop() || 'A1B2';
    const fp = `FP-${p1}-${p2}-${devIdTail}`;
    localStorage.setItem(HARDWARE_FINGERPRINT_KEY, fp);
    return fp;
  } catch {
    return 'FP-KIAN-POS0-0001';
  }
}

/**
 * Generates or retrieves a persistent unique Device Identifier (معرف الجهاز الفريد)
 * so the system can verify whether a subscription code is bound to this device or another device.
 */
export function getOrCreateHardwareDeviceId(): string {
  try {
    const existing = localStorage.getItem(HARDWARE_DEVICE_ID_KEY);
    if (existing && existing.startsWith('KIAN-DEV-')) {
      return existing;
    }
    const nav = typeof navigator !== 'undefined' ? navigator : null;
    const scr = typeof window !== 'undefined' && window.screen ? window.screen : null;
    const rawFingerprint = [
      nav?.platform || 'POS',
      nav?.language || 'ar',
      scr ? `${scr.width}x${scr.height}` : '1920x1080',
      nav?.hardwareConcurrency || 4,
    ].join('|');

    let hash = 0;
    for (let i = 0; i < rawFingerprint.length; i++) {
      hash = (hash << 5) - hash + rawFingerprint.charCodeAt(i);
      hash |= 0;
    }
    const hwHex = Math.abs(hash).toString(16).toUpperCase().padStart(4, '0').slice(0, 4);
    const randHex = Math.floor(1000 + Math.random() * 9000).toString(16).toUpperCase().padStart(4, '0').slice(0, 4);
    const timeHex = Date.now().toString(36).toUpperCase().slice(-4);
    const generatedId = `KIAN-DEV-${hwHex}-${randHex}-${timeHex}`;
    localStorage.setItem(HARDWARE_DEVICE_ID_KEY, generatedId);
    return generatedId;
  } catch {
    return 'KIAN-DEV-MAIN-0001';
  }
}

/**
 * Returns readable information about the current device along with its unique ID and Device Fingerprint
 */
export function getDeviceHardwareInfo(): DeviceHardwareInfo {
  const deviceId = getOrCreateHardwareDeviceId();
  const deviceFingerprint = computeDeviceFingerprint();
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      deviceId,
      deviceFingerprint,
      deviceName: 'جهاز كاشير رئيسي',
      platform: 'POS System',
      screenResolution: '1920x1080',
      hardwareSummary: 'POS Terminal',
    };
  }

  const ua = navigator.userAgent || '';
  let os = 'جهاز كمبيوتر';
  if (/Windows/i.test(ua)) os = 'Windows PC';
  else if (/Android/i.test(ua)) os = 'جهاز Android';
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'جهاز iOS / iPad';
  else if (/Mac/i.test(ua)) os = 'جهاز Mac';
  else if (/Linux/i.test(ua)) os = 'نظام Linux';

  let browser = 'متصفح';
  if (/Edg\//i.test(ua)) browser = 'Edge';
  else if (/Chrome\//i.test(ua)) browser = 'Chrome';
  else if (/Firefox\//i.test(ua)) browser = 'Firefox';
  else if (/Safari\//i.test(ua)) browser = 'Safari';

  const screenResolution = window.screen ? `${window.screen.width}×${window.screen.height}` : 'قياسي';
  const cores = navigator.hardwareConcurrency ? `${navigator.hardwareConcurrency} أنوية` : '';

  return {
    deviceId,
    deviceFingerprint,
    deviceName: `${os} (${browser})`,
    platform: navigator.platform || os,
    screenResolution,
    hardwareSummary: `${os} • ${browser} • ${screenResolution}${cores ? ` • ${cores}` : ''}`,
  };
}

export interface UsedCodeRecord {
  code: string;
  usedAt: string;
  deviceId?: string;
  deviceFingerprint?: string;
  deviceName?: string;
  customerName?: string;
  customerPhone?: string;
  expiresAt?: string;
  durationLabelAr?: string;
  transferCount?: number;
  revokedDeviceIds?: string[];
  lastRevokedDeviceId?: string;
  lastRevokedAt?: string;
}

export interface LicenseDeviceVerificationResult {
  validCode: boolean;
  matchedCode?: PredefinedLicenseCode;
  isUsedOnAnyDevice: boolean;
  isUsedByAnotherDevice: boolean;
  isSameDevice: boolean;
  boundDeviceId: string | null;
  boundDeviceFingerprint: string | null;
  boundDeviceName: string | null;
  boundStoreName: string | null;
  boundActivatedAt: string | null;
  firstActivatedAt?: string | null;
  transferCount?: number;
  revokedDeviceIds?: string[];
  lastRevokedDeviceId?: string | null;
  lastRevokedAt?: string | null;
  requestingDeviceId: string;
  requestingDeviceFingerprint: string;
  requestingDeviceName: string;
  canTransferToCurrentDevice: boolean;
  firebaseVerified: boolean;
  securityQuestions: {
    q1_isUsedOnAnyDevice: string;
    q2_whatIsDeviceId: string;
    q3_isCurrentlyActive: boolean;
    statusSummaryAr: string;
  };
  message: string;
  attemptCount?: number;
}

/**
 * Retrieve list of all previously used/consumed license codes from localStorage
 */
export function getUsedLicenseCodes(): UsedCodeRecord[] {
  try {
    const raw = localStorage.getItem(USED_CODES_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Find the local usage record of a code if it exists
 */
export function getUsedCodeRecord(code: string): UsedCodeRecord | undefined {
  if (!code) return undefined;
  const clean = code.trim().toLowerCase();
  const usedList = getUsedLicenseCodes();
  return usedList.find(item => item.code.trim().toLowerCase() === clean);
}

/**
 * Check if a code has already been redeemed / used
 */
export function isCodeAlreadyUsed(code: string, currentActiveKey?: string): boolean {
  if (!code) return false;
  const clean = code.trim().toLowerCase();

  // If this code is currently active on this system, check if it's bound to a different device ID
  const currentDevice = getDeviceHardwareInfo();
  const usedList = getUsedLicenseCodes();
  const existingRecord = usedList.find(item => item.code.trim().toLowerCase() === clean);

  if (existingRecord) {
    // If recorded with a different deviceId, always block!
    if (existingRecord.deviceId && existingRecord.deviceId !== currentDevice.deviceId) {
      return true;
    }
    if (currentActiveKey && currentActiveKey.trim().toLowerCase() === clean) {
      return false;
    }
    return true;
  }

  return false;
}

/**
 * Mark a single-use code as consumed/used and bind it to the device ID & Fingerprint
 */
export function markCodeAsUsed(
  code: string,
  customerInfo?: {
    name?: string;
    phone?: string;
    deviceId?: string;
    deviceFingerprint?: string;
    deviceName?: string;
    usedAt?: string;
    expiresAt?: string;
    durationLabelAr?: string;
    transferCount?: number;
    revokedDeviceIds?: string[];
    lastRevokedDeviceId?: string;
    lastRevokedAt?: string;
  }
): void {
  const clean = code.trim();
  const devInfo = getDeviceHardwareInfo();
  const usedList = getUsedLicenseCodes();
  const existingIdx = usedList.findIndex(item => item.code.toLowerCase() === clean.toLowerCase());
  const record: UsedCodeRecord = {
    code: clean,
    usedAt: customerInfo?.usedAt || new Date().toISOString(),
    deviceId: customerInfo?.deviceId || devInfo.deviceId,
    deviceFingerprint: customerInfo?.deviceFingerprint || devInfo.deviceFingerprint,
    deviceName: customerInfo?.deviceName || devInfo.deviceName,
    customerName: customerInfo?.name,
    customerPhone: customerInfo?.phone,
    expiresAt: customerInfo?.expiresAt,
    durationLabelAr: customerInfo?.durationLabelAr,
    transferCount: customerInfo?.transferCount,
    revokedDeviceIds: customerInfo?.revokedDeviceIds,
    lastRevokedDeviceId: customerInfo?.lastRevokedDeviceId,
    lastRevokedAt: customerInfo?.lastRevokedAt,
  };

  if (existingIdx === -1) {
    usedList.push(record);
  } else {
    usedList[existingIdx] = { ...usedList[existingIdx], ...record };
  }
  localStorage.setItem(USED_CODES_STORAGE_KEY, JSON.stringify(usedList));
}

/**
 * Formats an ISO timestamp into a detailed Arabic date and exact time string (موعد استخدام الكود)
 */
export function formatCodeUsageTimestampAr(isoString?: string | null): string {
  if (!isoString) return 'غير مسجل';
  try {
    const dt = new Date(isoString);
    if (isNaN(dt.getTime())) return isoString;
    const datePart = dt.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const timePart = dt.toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    return `${datePart} — الساعة ${timePart}`;
  } catch {
    return isoString;
  }
}

/**
 * Queries Firebase Firestore (`licenseActivations/{codeId}`) AND the server protection engine to:
 * 1. Compare the current Device Fingerprint & Device ID with the Firebase database record.
 * 2. Check if the code is used on another device, and if so, return `canTransferToCurrentDevice: true`
 *    along with the exact usage timestamp (`boundActivatedAt`).
 */
export async function verifyCodeDeviceProtectionOnServer(
  inputCode: string,
  overrideRequestingDeviceId?: string,
  overrideRequestingDeviceName?: string,
  overrideRequestingFingerprint?: string
): Promise<LicenseDeviceVerificationResult> {
  const devInfo = getDeviceHardwareInfo();
  const requestingDeviceId = overrideRequestingDeviceId || devInfo.deviceId;
  const requestingDeviceName = overrideRequestingDeviceName || devInfo.deviceName;
  const requestingDeviceFingerprint =
    overrideRequestingFingerprint ||
    (overrideRequestingDeviceId ? `FP-SIM-${overrideRequestingDeviceId.slice(-8)}` : devInfo.deviceFingerprint);

  const cleaned = (inputCode || '').trim();
  const matched = PREDEFINED_LICENSE_CODES.find(
    c => c.code.toLowerCase() === cleaned.toLowerCase()
  );

  if (!matched) {
    return {
      validCode: false,
      isUsedOnAnyDevice: false,
      isUsedByAnotherDevice: false,
      isSameDevice: false,
      boundDeviceId: null,
      boundDeviceFingerprint: null,
      boundDeviceName: null,
      boundStoreName: null,
      boundActivatedAt: null,
      requestingDeviceId,
      requestingDeviceFingerprint,
      requestingDeviceName,
      canTransferToCurrentDevice: false,
      firebaseVerified: true,
      securityQuestions: {
        q1_isUsedOnAnyDevice: 'الكود المدخل غير مسجل في قائمة الأكواد المعتمدة',
        q2_whatIsDeviceId: 'لا يوجد (الكود غير صحيح)',
        q3_isCurrentlyActive: false,
        statusSummaryAr: 'كود غير صالح',
      },
      message: 'كود التفعيل غير صحيح، يرجى التأكد من كتابة الكود بدقة كما استلمته من المطور',
    };
  }

  const docId = matched.code.toLowerCase();
  let firebaseDocData: any = null;
  let firebaseVerified = false;

  // 1. Primary Check: Query Firebase Firestore `licenseActivations/{docId}`
  try {
    const docRef = doc(db, 'licenseActivations', docId);
    const snap = await getDoc(docRef);
    firebaseVerified = true;
    if (snap.exists()) {
      firebaseDocData = snap.data();
    }
  } catch (err) {
    try {
      handleFirestoreError(err, OperationType.GET, `licenseActivations/${docId}`);
    } catch {
      // Continue to server/local check if offline
    }
  }

  // 2. Secondary Check & Sync: Query Express Server `/api/license/verify-device`
  let serverData: any = null;
  try {
    const response = await fetch('/api/license/verify-device', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: matched.code,
        requestingDeviceId,
        requestingDeviceFingerprint,
        requestingDeviceName,
      }),
    });
    if (response.ok) {
      serverData = await response.json();
    }
  } catch {}

  // If Firebase has the authoritative record, use it; or if server has it and Firebase didn't yet, sync to Firebase!
  const activeRecord = firebaseDocData && firebaseDocData.isUsed
    ? {
        isUsed: true,
        deviceId: firebaseDocData.deviceId,
        deviceFingerprint: firebaseDocData.deviceFingerprint || `FP-${firebaseDocData.deviceId}`,
        deviceName: firebaseDocData.deviceName || 'جهاز كاشير مفعل',
        storeName: firebaseDocData.storeName || 'متجر كيان',
        usedAt: firebaseDocData.usedAt,
        firstActivatedAt: firebaseDocData.firstActivatedAt || firebaseDocData.usedAt,
        transferCount: firebaseDocData.transferCount || 0,
        revokedDeviceIds: firebaseDocData.revokedDeviceIds || [],
        lastRevokedDeviceId: firebaseDocData.lastRevokedDeviceId || null,
        lastRevokedAt: firebaseDocData.lastRevokedAt || null,
      }
    : serverData && serverData.isUsed
    ? {
        isUsed: true,
        deviceId: serverData.boundDeviceId,
        deviceFingerprint: serverData.boundDeviceFingerprint || `FP-${serverData.boundDeviceId}`,
        deviceName: serverData.boundDeviceName || 'جهاز كاشير مفعل',
        storeName: serverData.storeName || 'متجر كيان',
        usedAt: serverData.activatedAt,
        firstActivatedAt: serverData.firstActivatedAt || serverData.activatedAt,
        transferCount: serverData.transferCount || 0,
        revokedDeviceIds: serverData.revokedDeviceIds || [],
        lastRevokedDeviceId: serverData.lastRevokedDeviceId || null,
        lastRevokedAt: serverData.lastRevokedAt || null,
      }
    : null;

  if (activeRecord && activeRecord.isUsed) {
    // Backfill Firebase if server had it first
    if (!firebaseDocData && firebaseVerified) {
      try {
        await setDoc(doc(db, 'licenseActivations', docId), {
          code: matched.code,
          isUsed: true,
          deviceId: String(activeRecord.deviceId).slice(0, 120),
          deviceFingerprint: String(activeRecord.deviceFingerprint).slice(0, 120),
          deviceName: String(activeRecord.deviceName).slice(0, 190),
          storeName: String(activeRecord.storeName || 'متجر كيان').slice(0, 190),
          durationLabelAr: matched.durationLabelAr.slice(0, 110),
          usedAt: String(activeRecord.usedAt || new Date().toISOString()).slice(0, 60),
          firstActivatedAt: String(activeRecord.firstActivatedAt || new Date().toISOString()).slice(0, 60),
          transferCount: Number(activeRecord.transferCount || 0),
          revokedDeviceIds: Array.isArray(activeRecord.revokedDeviceIds) ? activeRecord.revokedDeviceIds.slice(0, 40) : [],
        });
      } catch {}
    }

    // Compare both Device ID and Device Fingerprint
    const isSameDevice =
      activeRecord.deviceId === requestingDeviceId &&
      (!activeRecord.deviceFingerprint ||
        activeRecord.deviceFingerprint === requestingDeviceFingerprint ||
        !overrideRequestingDeviceId);
    const isUsedByAnotherDevice = !isSameDevice;

    markCodeAsUsed(matched.code, {
      deviceId: activeRecord.deviceId,
      deviceFingerprint: activeRecord.deviceFingerprint,
      deviceName: activeRecord.deviceName,
      name: activeRecord.storeName,
      usedAt: activeRecord.usedAt,
      transferCount: activeRecord.transferCount,
      revokedDeviceIds: activeRecord.revokedDeviceIds,
      lastRevokedDeviceId: activeRecord.lastRevokedDeviceId || undefined,
      lastRevokedAt: activeRecord.lastRevokedAt || undefined,
    });

    const formattedTime = formatCodeUsageTimestampAr(activeRecord.usedAt);

    return {
      validCode: true,
      matchedCode: matched,
      isUsedOnAnyDevice: true,
      isUsedByAnotherDevice,
      isSameDevice,
      boundDeviceId: activeRecord.deviceId,
      boundDeviceFingerprint: activeRecord.deviceFingerprint,
      boundDeviceName: activeRecord.deviceName,
      boundStoreName: activeRecord.storeName,
      boundActivatedAt: activeRecord.usedAt,
      firstActivatedAt: activeRecord.firstActivatedAt,
      transferCount: activeRecord.transferCount,
      revokedDeviceIds: activeRecord.revokedDeviceIds,
      lastRevokedDeviceId: activeRecord.lastRevokedDeviceId,
      lastRevokedAt: activeRecord.lastRevokedAt,
      requestingDeviceId,
      requestingDeviceFingerprint,
      requestingDeviceName,
      canTransferToCurrentDevice: isUsedByAnotherDevice,
      firebaseVerified,
      securityQuestions: {
        q1_isUsedOnAnyDevice: `نعم، مستخدم منذ (${formattedTime})`,
        q2_whatIsDeviceId: `${activeRecord.deviceId} | بصمة: ${activeRecord.deviceFingerprint}`,
        q3_isCurrentlyActive: true,
        statusSummaryAr: isUsedByAnotherDevice
          ? `⚠️ مستخدم في جهاز آخر (${activeRecord.deviceId}) — يمكنك طلب نقل التفعيل وإلغاء اشتراك الجهاز الآخر`
          : `✓ الكود مفعل ومربوط ببصمة هذا الجهاز (${activeRecord.deviceId})`,
      },
      message: isUsedByAnotherDevice
        ? `⛔ إشعار: هذا الكود (${matched.code}) مستخدم في جهاز آخر بمعرف (${activeRecord.deviceId}) وموعد استخدامه (${formattedTime}). يمكنك تأكيد نقل التفعيل إلى جهازك الحالي وإلغاء اشتراك الجهاز الآخر فوراً.`
        : `هذا الكود (${matched.code}) مفعل ومرتبط ببصمة هذا الجهاز منذ (${formattedTime}).`,
      attemptCount: serverData?.attemptCount || 0,
    };
  }

  // Code is NOT used in Firebase or Server
  return {
    validCode: true,
    matchedCode: matched,
    isUsedOnAnyDevice: false,
    isUsedByAnotherDevice: false,
    isSameDevice: false,
    boundDeviceId: null,
    boundDeviceFingerprint: null,
    boundDeviceName: null,
    boundStoreName: null,
    boundActivatedAt: null,
    requestingDeviceId,
    requestingDeviceFingerprint,
    requestingDeviceName,
    canTransferToCurrentDevice: false,
    firebaseVerified,
    securityQuestions: {
      q1_isUsedOnAnyDevice: 'لا، الكود غير مستخدم في أي جهاز في قاعدة بيانات فايربيس',
      q2_whatIsDeviceId: `غير مرتبط — جاهز للربط ببصمة جهازك (${requestingDeviceFingerprint})`,
      q3_isCurrentlyActive: false,
      statusSummaryAr: 'الكود متاح وآمن للتفعيل في فايربيس ✓',
    },
    message: 'تم التحقق عبر Firebase: الكود غير مستخدم في أي جهاز آخر ومتاح للتفعيل الآن',
  };
}

/**
 * Binds a subscription code OR transfers an existing activation to the target device in Firebase Firestore + Server,
 * records the exact usage timestamp (`usedAt`), and revokes/cancels the subscription of previous/other devices!
 */
export async function bindOrTransferLicenseInFirebaseAndServer(params: {
  code: string;
  deviceId?: string;
  deviceFingerprint?: string;
  deviceName?: string;
  storeName?: string;
  customerPhone?: string;
  expiresAt?: string;
  durationLabelAr?: string;
  isTransfer?: boolean;
  previousDeviceIdToRevoke?: string | null;
}): Promise<{
  success: boolean;
  usedAt: string;
  revokedDeviceIds: string[];
  deviceId: string;
  deviceFingerprint: string;
}> {
  const hw = getDeviceHardwareInfo();
  const targetDeviceId = params.deviceId || hw.deviceId;
  const targetFingerprint = params.deviceFingerprint || hw.deviceFingerprint;
  const targetDeviceName = params.deviceName || hw.deviceName;
  const cleanCode = params.code.trim();
  const docId = cleanCode.toLowerCase();
  const nowIso = new Date().toISOString();

  let existingData: any = null;
  try {
    const snap = await getDoc(doc(db, 'licenseActivations', docId));
    if (snap.exists()) {
      existingData = snap.data();
    }
  } catch {}

  const prevRevoked: string[] = Array.isArray(existingData?.revokedDeviceIds)
    ? [...existingData.revokedDeviceIds]
    : [];

  const oldBoundDeviceId = params.previousDeviceIdToRevoke || existingData?.deviceId;
  if (oldBoundDeviceId && oldBoundDeviceId !== targetDeviceId && !prevRevoked.includes(oldBoundDeviceId)) {
    prevRevoked.unshift(oldBoundDeviceId);
  }
  const boundedRevoked = prevRevoked.slice(0, 45);
  const transferCount = params.isTransfer
    ? Number(existingData?.transferCount || 0) + 1
    : Number(existingData?.transferCount || 0);

  const firestorePayload: Record<string, any> = {
    code: cleanCode.slice(0, 64),
    isUsed: true,
    deviceId: targetDeviceId.slice(0, 128),
    deviceFingerprint: targetFingerprint.slice(0, 128),
    deviceName: targetDeviceName.slice(0, 200),
    storeName: (params.storeName || 'متجر كيان').slice(0, 200),
    durationLabelAr: (params.durationLabelAr || 'اشتراك مفعل').slice(0, 120),
    usedAt: nowIso,
    firstActivatedAt: existingData?.firstActivatedAt || nowIso,
    transferCount,
    revokedDeviceIds: boundedRevoked,
  };

  if (params.expiresAt) {
    firestorePayload.expiresAt = params.expiresAt.slice(0, 64);
  }
  if (oldBoundDeviceId && oldBoundDeviceId !== targetDeviceId) {
    firestorePayload.lastRevokedDeviceId = oldBoundDeviceId.slice(0, 128);
    firestorePayload.lastRevokedAt = nowIso;
  }

  // 1. Write to Firebase Firestore (`licenseActivations/{docId}`)
  try {
    await setDoc(doc(db, 'licenseActivations', docId), firestorePayload);
  } catch (err) {
    try {
      handleFirestoreError(err, OperationType.WRITE, `licenseActivations/${docId}`);
    } catch {
      // Continue to server sync
    }
  }

  // 2. Sync to Server Registry (`/api/license/activate-device`) with `confirmTransfer: true`
  try {
    await fetch('/api/license/activate-device', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: cleanCode,
        deviceId: targetDeviceId,
        deviceFingerprint: targetFingerprint,
        deviceName: targetDeviceName,
        customerName: params.storeName || 'متجر كيان',
        customerPhone: params.customerPhone || '',
        expiresAt: params.expiresAt,
        durationLabelAr: params.durationLabelAr,
        confirmTransfer: Boolean(params.isTransfer),
        previousDeviceIdToRevoke: oldBoundDeviceId,
      }),
    });
  } catch {}

  // 3. Update local storage record
  markCodeAsUsed(cleanCode, {
    deviceId: targetDeviceId,
    deviceFingerprint: targetFingerprint,
    deviceName: targetDeviceName,
    name: params.storeName,
    phone: params.customerPhone,
    usedAt: nowIso,
    expiresAt: params.expiresAt,
    durationLabelAr: params.durationLabelAr,
    transferCount,
    revokedDeviceIds: boundedRevoked,
    lastRevokedDeviceId: oldBoundDeviceId || undefined,
    lastRevokedAt: oldBoundDeviceId ? nowIso : undefined,
  });

  // 4. Broadcast across tabs/windows so any other open instance immediately cancels its subscription
  try {
    const bc = new BroadcastChannel('kian_pos_devices_mesh');
    bc.postMessage({
      type: 'LICENSE_TRANSFERRED_OR_REVOKED',
      payload: {
        code: cleanCode,
        newOwnerDeviceId: targetDeviceId,
        newOwnerFingerprint: targetFingerprint,
        newOwnerDeviceName: targetDeviceName,
        revokedDeviceIds: boundedRevoked,
        lastRevokedDeviceId: oldBoundDeviceId,
        usedAt: nowIso,
      },
    });
    bc.close();
  } catch {}

  return {
    success: true,
    usedAt: nowIso,
    revokedDeviceIds: boundedRevoked,
    deviceId: targetDeviceId,
    deviceFingerprint: targetFingerprint,
  };
}

/**
 * Subscribe to real-time Firebase Firestore changes on the active license code.
 * If another device transfers the license or adds this device to `revokedDeviceIds`,
 * `onRevoked` is triggered immediately to cancel this device's subscription!
 */
export function subscribeToFirebaseLicenseBinding(
  activeCode: string,
  currentDeviceId: string,
  onRevoked: (details: { newDeviceId: string; newDeviceName: string; usedAt: string }) => void
): () => void {
  if (!activeCode || !activeCode.trim()) return () => {};
  const docId = activeCode.trim().toLowerCase();
  const docRef = doc(db, 'licenseActivations', docId);

  const unsubscribe = onSnapshot(
    docRef,
    snapshot => {
      if (!snapshot.exists()) return;
      const data = snapshot.data();
      if (!data) return;

      const boundId = data.deviceId;
      const revokedList: string[] = Array.isArray(data.revokedDeviceIds) ? data.revokedDeviceIds : [];

      if (
        (boundId && boundId !== currentDeviceId) ||
        revokedList.includes(currentDeviceId)
      ) {
        onRevoked({
          newDeviceId: boundId || 'جهاز آخر',
          newDeviceName: data.deviceName || 'جهاز جديد',
          usedAt: data.usedAt || new Date().toISOString(),
        });
      }
    },
    error => {
      try {
        handleFirestoreError(error, OperationType.GET, `licenseActivations/${docId}`);
      } catch {}
    }
  );

  return unsubscribe;
}

/**
 * Validates an entered activation code:
 * 1. Checks matching with predefined codes (case-insensitive)
 * 2. Enforces single-use policy and device-binding check (unless allowTransfer is true)
 */
export function validateLicenseCode(
  inputCode: string,
  currentActiveKey?: string,
  allowTransfer: boolean = false
): {
  valid: boolean;
  reason?: string;
  matchedCode?: PredefinedLicenseCode;
  boundDeviceId?: string;
} {
  if (!inputCode || typeof inputCode !== 'string') {
    return { valid: false, reason: 'يرجى إدخال كود التفعيل' };
  }

  const cleaned = inputCode.trim();
  const lowerCleaned = cleaned.toLowerCase();

  // 1. Check against predefined license codes
  const matched = PREDEFINED_LICENSE_CODES.find(
    c => c.code.toLowerCase() === lowerCleaned
  );

  if (!matched) {
    return {
      valid: false,
      reason: 'كود التفعيل غير صحيح، يرجى التأكد من كتابة الكود بدقة كما استلمته من المطور'
    };
  }

  if (allowTransfer) {
    return {
      valid: true,
      matchedCode: matched
    };
  }

  // 2. Check if code has already been used (single-use constraint or bound to another device)
  const localRec = getUsedCodeRecord(matched.code);
  const currentDevice = getDeviceHardwareInfo();
  if (localRec && localRec.deviceId && localRec.deviceId !== currentDevice.deviceId) {
    return {
      valid: false,
      boundDeviceId: localRec.deviceId,
      reason: `⛔ إشعار الكود مستخدم: هذا الكود (${matched.code}) مستخدم ومفعل في جهاز آخر بمعرف (${localRec.deviceId}) ولا يمكن استخدامه دون تأكيد نقل التفعيل وإلغاء اشتراك الجهاز الآخر!`
    };
  }

  if (matched.singleUse && isCodeAlreadyUsed(matched.code, currentActiveKey)) {
    return {
      valid: false,
      boundDeviceId: localRec?.deviceId || currentDevice.deviceId,
      reason: `⛔ إشعار الكود مستخدم: تم استخدام هذا الكود (${matched.code}) مسبقاً بمعرف الجهاز (${localRec?.deviceId || currentDevice.deviceId})!`
    };
  }

  return {
    valid: true,
    matchedCode: matched
  };
}

/**
 * Calculate trial time remaining for the 1-week guest mode
 */
export function getTrialTimeRemaining(startDateIso: string, durationDays: number = 7): {
  daysRemaining: number;
  hoursRemaining: number;
  isExpired: boolean;
  totalHoursLeft: number;
  progressPercent: number; // 0 to 100
} {
  try {
    const startTime = new Date(startDateIso).getTime();
    if (isNaN(startTime)) {
      return { daysRemaining: 7, hoursRemaining: 0, isExpired: false, totalHoursLeft: 168, progressPercent: 100 };
    }

    const durationMs = durationDays * 24 * 60 * 60 * 1000;
    const expiresAt = startTime + durationMs;
    const now = Date.now();
    const diffMs = expiresAt - now;

    if (diffMs <= 0) {
      return { daysRemaining: 0, hoursRemaining: 0, isExpired: true, totalHoursLeft: 0, progressPercent: 0 };
    }

    const totalHoursLeft = Math.floor(diffMs / (1000 * 60 * 60));
    const daysRemaining = Math.floor(totalHoursLeft / 24);
    const hoursRemaining = totalHoursLeft % 24;
    const progressPercent = Math.max(0, Math.min(100, Math.round((diffMs / durationMs) * 100)));

    return {
      daysRemaining,
      hoursRemaining,
      isExpired: false,
      totalHoursLeft,
      progressPercent
    };
  } catch {
    return { daysRemaining: 7, hoursRemaining: 0, isExpired: false, totalHoursLeft: 168, progressPercent: 100 };
  }
}

/**
 * Calculate time remaining for an activated purchased license (1 year, 1 month, or lifetime)
 */
export function getLicenseTimeRemaining(expiresAtIso?: string): {
  daysRemaining: number;
  hoursRemaining: number;
  isExpired: boolean;
  totalHoursLeft: number;
  isLifetime: boolean;
} {
  if (!expiresAtIso) {
    return { daysRemaining: 9999, hoursRemaining: 0, isExpired: false, totalHoursLeft: 999999, isLifetime: true };
  }

  try {
    const expiresAt = new Date(expiresAtIso).getTime();
    if (isNaN(expiresAt)) {
      return { daysRemaining: 0, hoursRemaining: 0, isExpired: false, totalHoursLeft: 0, isLifetime: false };
    }

    const diffMs = expiresAt - Date.now();
    if (diffMs <= 0) {
      return { daysRemaining: 0, hoursRemaining: 0, isExpired: true, totalHoursLeft: 0, isLifetime: false };
    }

    const totalHoursLeft = Math.floor(diffMs / (1000 * 60 * 60));
    const daysRemaining = Math.floor(totalHoursLeft / 24);
    const hoursRemaining = totalHoursLeft % 24;

    return {
      daysRemaining,
      hoursRemaining,
      isExpired: false,
      totalHoursLeft,
      isLifetime: false
    };
  } catch {
    return { daysRemaining: 0, hoursRemaining: 0, isExpired: false, totalHoursLeft: 0, isLifetime: false };
  }
}
