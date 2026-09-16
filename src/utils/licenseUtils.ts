/**
 * License & App Activation Utility
 * Handles 1-week guest trial period and validation of purchase activation codes.
 */

// Authorized developer Gmails permitted to access code generation tools and buttons
export const AUTHORIZED_PURCHASE_GENERATOR_EMAILS: readonly string[] = [
  'yyyya901@gmail.com',
  'yyyya905@gmail.com'
];

/**
 * Checks if a given email is authorized to create/generate purchase activation codes
 */
export function isAuthorizedToGenerateCodes(email?: string | null): boolean {
  if (!email || typeof email !== 'string') return false;
  const normalized = email.trim().toLowerCase();
  return AUTHORIZED_PURCHASE_GENERATOR_EMAILS.some(
    authorizedEmail => authorizedEmail.toLowerCase() === normalized
  );
}

// Master activation codes the developer can directly give to customers
export const MASTER_ACTIVATION_CODES = [
  'KIAN-PRO-2026',
  'KIAN-2026-LIFETIME',
  'CASHIER-VIP-7788',
  'KIAN-FULL-ACCESS',
  'PRO-8899-KIAN',
  'KIAN-APP-VIP',
  'KIAN-GOLD-2026',
  'KIAN-MASTER-KEY'
];

/**
 * Standard checksum algorithm for developer custom license codes:
 * Format: KIAN-XXXX-YYYY (where YYYY is checksum derived from XXXX)
 */
export function generateLicenseCode(seed: string = ''): string {
  const cleanSeed = seed.replace(/[^A-Za-z0-9]/g, '').toUpperCase() || Math.random().toString(36).substring(2, 6).toUpperCase();
  const part1 = (cleanSeed.slice(0, 4) + 'KIAN').slice(0, 4).toUpperCase();
  
  // Calculate checksum
  let sum = 0;
  for (let i = 0; i < part1.length; i++) {
    sum += part1.charCodeAt(i) * (i + 3);
  }
  const checksumPart = ((sum * 17) % 8999 + 1000).toString();
  return `KIAN-${part1}-${checksumPart}`;
}

/**
 * Validates a purchase code:
 * 1. Checks master codes
 * 2. Checks checksum algorithm
 * 3. Checks standard developer format
 */
export function validateLicenseCode(inputCode: string): { valid: boolean; reason?: string } {
  if (!inputCode || typeof inputCode !== 'string') {
    return { valid: false, reason: 'يرجى إدخال كود الشراء' };
  }

  const cleaned = inputCode.trim().toUpperCase();

  // 1. Direct match with master developer codes
  if (MASTER_ACTIVATION_CODES.includes(cleaned)) {
    return { valid: true };
  }

  // 2. Pattern: KIAN-XXXX-YYYY
  const parts = cleaned.split('-');
  if (parts.length === 3 && parts[0] === 'KIAN') {
    const part1 = parts[1];
    const checksumPart = parts[2];

    let sum = 0;
    for (let i = 0; i < part1.length; i++) {
      sum += part1.charCodeAt(i) * (i + 3);
    }
    const expectedChecksum = ((sum * 17) % 8999 + 1000).toString();
    if (checksumPart === expectedChecksum) {
      return { valid: true };
    }
  }

  // 3. Flexible developer activation format: KIAN-[4 chars]-[4 chars]
  const generalPattern = /^KIAN-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  if (generalPattern.test(cleaned)) {
    return { valid: true };
  }

  return { valid: false, reason: 'كود التفعيل غير صحيح، يرجى مراجعة الكود والتأكد من مطابقته للكود الممنوح لك من المطور' };
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
