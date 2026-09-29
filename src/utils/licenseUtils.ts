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

export interface UsedCodeRecord {
  code: string;
  usedAt: string;
  customerName?: string;
  customerPhone?: string;
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
 * Check if a code has already been redeemed / used
 */
export function isCodeAlreadyUsed(code: string, currentActiveKey?: string): boolean {
  if (!code) return false;
  const clean = code.trim().toLowerCase();

  // If this code is currently active on this system, don't block
  if (currentActiveKey && currentActiveKey.trim().toLowerCase() === clean) {
    return false;
  }

  const usedList = getUsedLicenseCodes();
  return usedList.some(item => item.code.trim().toLowerCase() === clean);
}

/**
 * Mark a single-use code as consumed/used
 */
export function markCodeAsUsed(code: string, customerInfo?: { name?: string; phone?: string }): void {
  const clean = code.trim();
  const usedList = getUsedLicenseCodes();
  const exists = usedList.some(item => item.code.toLowerCase() === clean.toLowerCase());
  if (!exists) {
    usedList.push({
      code: clean,
      usedAt: new Date().toISOString(),
      customerName: customerInfo?.name,
      customerPhone: customerInfo?.phone
    });
    localStorage.setItem(USED_CODES_STORAGE_KEY, JSON.stringify(usedList));
  }
}

/**
 * Validates an entered activation code:
 * 1. Checks matching with predefined codes (case-insensitive)
 * 2. Enforces single-use policy ("استخدام لمرة واحدة فقط")
 */
export function validateLicenseCode(
  inputCode: string,
  currentActiveKey?: string
): {
  valid: boolean;
  reason?: string;
  matchedCode?: PredefinedLicenseCode;
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

  // 2. Check if code has already been used (single-use constraint)
  if (matched.singleUse && isCodeAlreadyUsed(matched.code, currentActiveKey)) {
    return {
      valid: false,
      reason: `تم استخدام هذا الكود (${matched.code}) مسبقاً! كل كود مخصص للاستخدام لمرة واحدة فقط.`
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
