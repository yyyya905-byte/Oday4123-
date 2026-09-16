/**
 * Haptic Feedback Service (محرك الاستجابة الحسية والاهتزاز الفيزيائي)
 * Provides tactile vibration feedback for retail scanning, button clicks,
 * keypad entry, and error states.
 */

export type HapticPattern = 
  | 'tap' 
  | 'selection' 
  | 'buttonPress' 
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
    this.hasSupport = typeof window !== 'undefined' && 'navigator' in window && typeof navigator.vibrate === 'function';
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('kian_haptics_enabled');
      if (stored !== null) {
        this.enabled = stored === 'true';
      }
    }
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
        navigator.vibrate(pattern);
        return true;
      }

      switch (pattern) {
        // Micro-tick for keypad typing, category switching, navigation pills
        case 'tap':
        case 'selection':
          navigator.vibrate(18);
          break;

        // Standard button click (e.g. quantity +/-, touch buttons)
        case 'buttonPress':
          navigator.vibrate(28);
          break;

        // Crisp double pulse for barcode scanner registration
        // (Gives cashier distinct physical confirmation even in noisy environments)
        case 'successScan':
          navigator.vibrate([35, 45, 65]);
          break;

        // Ascending rapid pulses for continuous sequential scanning
        case 'batchScan':
          navigator.vibrate([22, 28, 35]);
          break;

        // Dual alert pulse for warnings / stock threshold reached
        case 'warning':
          navigator.vibrate([60, 50, 70]);
          break;

        // Distinct rhythmic rejection buzz for unregistered barcode or failure
        case 'errorState':
          navigator.vibrate([90, 60, 90, 60, 130]);
          break;

        // Solid confirmation pulse for payment completion, receipt printing
        case 'confirm':
          navigator.vibrate([50, 40, 80]);
          break;

        // Delete/Clear alert pulse (e.g. item removed from cart, clear order)
        case 'delete':
          navigator.vibrate([45, 35, 45]);
          break;

        default:
          navigator.vibrate(25);
          break;
      }
      return true;
    } catch (e) {
      // Browsers may block if not inside user gesture; silently ignore
      return false;
    }
  }

  // Convenience shorthand methods
  public tap(): boolean {
    return this.trigger('tap');
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
