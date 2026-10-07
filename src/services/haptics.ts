/**
 * Haptic Feedback Service (محرك الاستجابة الحسية والاهتزاز الفيزيائي)
 * Provides tactile vibration feedback for retail scanning, button clicks,
 * keypad entry, and error states.
 */

export type HapticPattern = 
  | 'tap' 
  | 'selection' 
  | 'buttonPress' 
  | 'glassTap'
  | 'glassPress'
  | 'cartModify'
  | 'cashDrawer'
  | 'successScan' 
  | 'batchScan' 
  | 'warning' 
  | 'errorState' 
  | 'confirm' 
  | 'delete';

class HapticsService {
  private enabled: boolean = true;
  private hasSupport: boolean = false;

  constructor() {
    this.hasSupport =
      typeof window !== 'undefined' &&
      'navigator' in window &&
      (typeof navigator.vibrate === 'function' ||
        typeof (navigator as any).webkitVibrate === 'function' ||
        typeof (navigator as any).mozVibrate === 'function');
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('kian_haptics_enabled');
      if (stored !== null) {
        this.enabled = stored === 'true';
      }
    }
  }

  private invokeVibrate(pattern: number | number[]): boolean {
    if (typeof window === 'undefined' || !('navigator' in window)) return false;
    try {
      if (typeof navigator.vibrate === 'function') {
        return navigator.vibrate(pattern);
      }
      const navAny = navigator as any;
      if (typeof navAny.webkitVibrate === 'function') {
        return navAny.webkitVibrate(pattern);
      }
      if (typeof navAny.mozVibrate === 'function') {
        return navAny.mozVibrate(pattern);
      }
    } catch {
      // Ignore if blocked outside user gesture
    }
    return false;
  }

  /**
   * Check if Vibration API is available on this browser/device
   */
  public isSupported(): boolean {
    return this.hasSupport;
  }

  /**
   * Check if user has haptics toggled ON
   */
  public isEnabled(): boolean {
    return this.enabled && this.hasSupport;
  }

  /**
   * Set user haptic preference
   */
  public setEnabled(val: boolean): void {
    this.enabled = val;
    if (typeof window !== 'undefined') {
      localStorage.setItem('kian_haptics_enabled', val ? 'true' : 'false');
    }
  }

  /**
   * Toggle haptics
   */
  public toggle(): boolean {
    this.setEnabled(!this.enabled);
    if (this.enabled) {
      this.trigger('confirm');
    }
    return this.enabled;
  }

  /**
   * Trigger a haptic pattern safely without blocking UI thread
   */
  public trigger(pattern: HapticPattern | number | number[]): boolean {
    if (!this.isEnabled()) return false;

    try {
      if (typeof pattern === 'number' || Array.isArray(pattern)) {
        this.invokeVibrate(pattern);
        return true;
      }

      switch (pattern) {
        // Ultra-crisp Apple Glass surface micro-tap (12ms)
        case 'glassTap':
          this.invokeVibrate(12);
          break;

        // Micro-tick for keypad typing, category switching, navigation pills
        case 'tap':
        case 'selection':
          this.invokeVibrate(16);
          break;

        // Subtle dual-tick when modifying cart item quantities (+/-)
        case 'cartModify':
          this.invokeVibrate([14, 18]);
          break;

        // Refined Apple Glass primary button press (tactile dual-stage pulse)
        case 'glassPress':
          this.invokeVibrate([18, 22, 28]);
          break;

        // Standard button click (e.g. quantity +/-, touch buttons)
        case 'buttonPress':
          this.invokeVibrate(24);
          break;

        // Rich checkout / cash drawer tactile pulse
        case 'cashDrawer':
          this.invokeVibrate([30, 25, 50, 25, 70]);
          break;

        // Crisp double pulse for barcode scanner registration
        // (Gives cashier distinct physical confirmation even in noisy environments)
        case 'successScan':
          this.invokeVibrate([35, 45, 65]);
          break;

        // Ascending rapid pulses for continuous sequential scanning
        case 'batchScan':
          this.invokeVibrate([22, 28, 35]);
          break;

        // Dual alert pulse for warnings / stock threshold reached
        case 'warning':
          this.invokeVibrate([60, 50, 70]);
          break;

        // Distinct rhythmic rejection buzz for unregistered barcode or failure
        case 'errorState':
          this.invokeVibrate([90, 60, 90, 60, 130]);
          break;

        // Solid confirmation pulse for payment completion, receipt printing
        case 'confirm':
          this.invokeVibrate([50, 40, 80]);
          break;

        // Delete/Clear alert pulse (e.g. item removed from cart, clear order)
        case 'delete':
          this.invokeVibrate([40, 30, 45]);
          break;

        default:
          this.invokeVibrate(20);
          break;
      }
      return true;
    } catch {
      // Browsers may block if not inside user gesture; silently ignore
      return false;
    }
  }

  // Convenience shorthand methods
  public tap(): boolean {
    return this.trigger('tap');
  }

  public glassTap(): boolean {
    return this.trigger('glassTap');
  }

  public glassPress(): boolean {
    return this.trigger('glassPress');
  }

  public cartModify(): boolean {
    return this.trigger('cartModify');
  }

  public cashDrawer(): boolean {
    return this.trigger('cashDrawer');
  }

  public selection(): boolean {
    return this.trigger('selection');
  }

  public buttonPress(): boolean {
    return this.trigger('buttonPress');
  }

  public successScan(): boolean {
    return this.trigger('successScan');
  }

  public batchScan(): boolean {
    return this.trigger('batchScan');
  }

  public scanError(): boolean {
    return this.trigger('errorState');
  }

  public warning(): boolean {
    return this.trigger('warning');
  }

  public confirm(): boolean {
    return this.trigger('confirm');
  }

  public delete(): boolean {
    return this.trigger('delete');
  }
}

export const haptics = new HapticsService();
