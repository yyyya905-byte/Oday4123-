/**
 * License & App Activation Utility
 * Handles license validation with predefined codes (annual, monthly, lifetime)
 * and enforces single-use policy ("استخدام لمرة واحدة فقط").
 */

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

export interface DeviceHardwareInfo {
  deviceId: string;
  deviceName: string;
  platform: string;
  screenResolution: string;
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
 * Returns readable information about the current device along with its unique ID
 */
export function getDeviceHardwareInfo(): DeviceHardwareInfo {
  const deviceId = getOrCreateHardwareDeviceId();
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      deviceId,
      deviceName: 'جهاز كاشير رئيسي',
      platform: 'POS System',
      screenResolution: '1920x1080',
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

  return {
    deviceId,
    deviceName: `${os} (${browser})`,
    platform: navigator.platform || os,
    screenResolution,
  };
}

export interface UsedCodeRecord {
  code: string;
  usedAt: string;
  deviceId?: string;
  deviceName?: string;
  customerName?: string;
  customerPhone?: string;
  expiresAt?: string;
  durationLabelAr?: string;
}

export interface LicenseDeviceVerificationResult {
  validCode: boolean;
  matchedCode?: PredefinedLicenseCode;
  isUsedOnAnyDevice: boolean;
  isUsedByAnotherDevice: boolean;
  isSameDevice: boolean;
  boundDeviceId: string | null;
  boundDeviceName: string | null;
  boundStoreName: string | null;
  boundActivatedAt: string | null;
  requestingDeviceId: string;
  requestingDeviceName: string;
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
 * Mark a single-use code as consumed/used and bind it to the device ID
 */
export function markCodeAsUsed(
  code: string,
  customerInfo?: { name?: string; phone?: string; deviceId?: string; deviceName?: string; expiresAt?: string; durationLabelAr?: string }
): void {
  const clean = code.trim();
  const devInfo = getDeviceHardwareInfo();
  const usedList = getUsedLicenseCodes();
  const existingIdx = usedList.findIndex(item => item.code.toLowerCase() === clean.toLowerCase());
  const record: UsedCodeRecord = {
    code: clean,
    usedAt: new Date().toISOString(),
    deviceId: customerInfo?.deviceId || devInfo.deviceId,
    deviceName: customerInfo?.deviceName || devInfo.deviceName,
    customerName: customerInfo?.name,
    customerPhone: customerInfo?.phone,
    expiresAt: customerInfo?.expiresAt,
    durationLabelAr: customerInfo?.durationLabelAr,
  };

  if (existingIdx === -1) {
    usedList.push(record);
  } else {
    usedList[existingIdx] = { ...usedList[existingIdx], ...record };
  }
  localStorage.setItem(USED_CODES_STORAGE_KEY, JSON.stringify(usedList));
}

/**
 * Queries the server protection engine to verify:
 * 1. Is this subscription code used on ANY device? (هل هذا الكود مستخدم في أي جهاز؟)
 * 2. What is the Device ID of the device using it? (وأيش معرفه؟)
 * 3. Is it currently used by another device? (هل هو مستخدم؟)
 */
export async function verifyCodeDeviceProtectionOnServer(
  inputCode: string,
  overrideRequestingDeviceId?: string,
  overrideRequestingDeviceName?: string
): Promise<LicenseDeviceVerificationResult> {
  const devInfo = getDeviceHardwareInfo();
  const requestingDeviceId = overrideRequestingDeviceId || devInfo.deviceId;
  const requestingDeviceName = overrideRequestingDeviceName || devInfo.deviceName;

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
      boundDeviceName: null,
      boundStoreName: null,
      boundActivatedAt: null,
      requestingDeviceId,
      requestingDeviceName,
      securityQuestions: {
        q1_isUsedOnAnyDevice: 'الكود المدخل غير مسجل في قائمة الأكواد المعتمدة',
        q2_whatIsDeviceId: 'لا يوجد (الكود غير صحيح)',
        q3_isCurrentlyActive: false,
        statusSummaryAr: 'كود غير صالح',
      },
      message: 'كود التفعيل غير صحيح، يرجى التأكد من كتابة الكود بدقة كما استلمته من المطور',
    };
  }

  try {
    const response = await fetch('/api/license/verify-device', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: matched.code,
        requestingDeviceId,
        requestingDeviceName,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.success) {
        // Also sync to local used codes if already bound on server to another device
        if (data.isUsed && data.boundDeviceId) {
          markCodeAsUsed(matched.code, {
            deviceId: data.boundDeviceId,
            deviceName: data.boundDeviceName || 'جهاز مفعل',
            name: data.storeName,
          });
        }
        return {
          validCode: true,
          matchedCode: matched,
          isUsedOnAnyDevice: Boolean(data.isUsed),
          isUsedByAnotherDevice: Boolean(data.isUsedByAnotherDevice),
          isSameDevice: Boolean(data.isSameDevice),
          boundDeviceId: data.boundDeviceId || null,
          boundDeviceName: data.boundDeviceName || null,
          boundStoreName: data.storeName || null,
          boundActivatedAt: data.activatedAt || null,
          requestingDeviceId,
          requestingDeviceName,
          securityQuestions: data.securityQuestions || {
            q1_isUsedOnAnyDevice: data.isUsed ? 'نعم، الكود مستخدم ومفعل حالياً' : 'لا، الكود غير مستخدم في أي جهاز',
            q2_whatIsDeviceId: data.boundDeviceId || 'غير مرتبط بأي جهاز حتى الآن',
            q3_isCurrentlyActive: Boolean(data.isUsed),
            statusSummaryAr: data.isUsedByAnotherDevice
              ? `مستخدم في جهاز آخر (${data.boundDeviceId})`
              : data.isUsed
              ? `مفعل على نفس هذا الجهاز (${data.boundDeviceId})`
              : 'متاح وجاهز للتفعيل',
          },
          message: data.message,
          attemptCount: data.attemptCount,
        };
      }
    }
  } catch {
    // Fallback to localStorage check if offline
  }

  // Offline fallback check
  const localRec = getUsedCodeRecord(matched.code);
  if (localRec) {
    const boundId = localRec.deviceId || requestingDeviceId;
    const isOther = boundId !== requestingDeviceId;
    return {
      validCode: true,
      matchedCode: matched,
      isUsedOnAnyDevice: true,
      isUsedByAnotherDevice: isOther,
      isSameDevice: !isOther,
      boundDeviceId: boundId,
      boundDeviceName: localRec.deviceName || 'جهاز كاشير مسجل',
      boundStoreName: localRec.customerName || null,
      boundActivatedAt: localRec.usedAt,
      requestingDeviceId,
      requestingDeviceName,
      securityQuestions: {
        q1_isUsedOnAnyDevice: 'نعم، هذا الكود مستخدم مسبقاً',
        q2_whatIsDeviceId: boundId,
        q3_isCurrentlyActive: true,
        statusSummaryAr: isOther
          ? `⛔ الكود مستخدم في جهاز آخر بمعرف (${boundId})`
          : `⛔ تم استهلاك هذا الكود مسبقاً على هذا الجهاز (${boundId})`,
      },
      message: isOther
        ? `⛔ إشعار حماية: هذا الكود (${matched.code}) مستخدم مسبقاً في جهاز آخر يحمل المعرف (${boundId}) ولا يمكن تفعيله على هذا الجهاز الجديد!`
        : `تم استخدام هذا الكود (${matched.code}) مسبقاً على هذا الجهاز (${boundId})! كل كود مخصص للاستخدام لمرة واحدة فقط.`,
    };
  }

  return {
    validCode: true,
    matchedCode: matched,
    isUsedOnAnyDevice: false,
    isUsedByAnotherDevice: false,
    isSameDevice: false,
    boundDeviceId: null,
    boundDeviceName: null,
    boundStoreName: null,
    boundActivatedAt: null,
    requestingDeviceId,
    requestingDeviceName,
    securityQuestions: {
      q1_isUsedOnAnyDevice: 'لا، الكود غير مستخدم في أي جهاز',
      q2_whatIsDeviceId: 'غير مرتبط بأي جهاز (متاح للربط بمعرف جهازك)',
      q3_isCurrentlyActive: false,
      statusSummaryAr: 'الكود متاح وآمن للتفعيل ✓',
    },
    message: 'الكود متاح وغير مستخدم في أي جهاز آخر',
  };
}

/**
 * Validates an entered activation code:
 * 1. Checks matching with predefined codes (case-insensitive)
 * 2. Enforces single-use policy and device-binding check
 */
export function validateLicenseCode(
  inputCode: string,
  currentActiveKey?: string
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

  // 2. Check if code has already been used (single-use constraint or bound to another device)
  const localRec = getUsedCodeRecord(matched.code);
  const currentDevice = getDeviceHardwareInfo();
  if (localRec && localRec.deviceId && localRec.deviceId !== currentDevice.deviceId) {
    return {
      valid: false,
      boundDeviceId: localRec.deviceId,
      reason: `⛔ إشعار الكود مستخدم: هذا الكود (${matched.code}) مستخدم ومفعل في جهاز آخر بمعرف (${localRec.deviceId}) ولا يمكن استخدامه في جهاز جديد!`
    };
  }

  if (matched.singleUse && isCodeAlreadyUsed(matched.code, currentActiveKey)) {
    return {
      valid: false,
      boundDeviceId: localRec?.deviceId || currentDevice.deviceId,
      reason: `⛔ إشعار الكود مستخدم: تم استخدام هذا الكود (${matched.code}) مسبقاً بمعرف الجهاز (${localRec?.deviceId || currentDevice.deviceId})! كل كود مخصص للاستخدام لمرة واحدة فقط.`
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
