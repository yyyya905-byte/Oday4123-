/**
 * Smart Voice Announcer Service (المساعد الصوتي الذكي للكاشير)
 * 
 * Uses Web Speech Synthesis API to announce invoice totals, greetings,
 * and quick cashier notifications in natural Arabic or English.
 */

class VoiceAnnouncerService {
  private enabled: boolean = true;
  private volume: number = 0.9;
  private rate: number = 1.0;
  private pitch: number = 1.0;

  constructor() {
    try {
      const saved = localStorage.getItem('kian_voice_announcer_enabled');
      if (saved !== null) {
        this.enabled = saved === 'true';
      }
    } catch {
      this.enabled = true;
    }
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    try {
      localStorage.setItem('kian_voice_announcer_enabled', String(enabled));
    } catch {}
  }

  public toggle(): boolean {
    this.setEnabled(!this.enabled);
    return this.enabled;
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  public speak(text: string, lang: 'ar' | 'en' = 'ar'): void {
    if (!this.enabled || !this.isSupported()) return;

    try {
      // Cancel previous utterances to avoid speech lag in fast checkout
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'ar' ? 'ar-SA' : 'en-US';
      utterance.volume = this.volume;
      utterance.rate = this.rate;
      utterance.pitch = this.pitch;

      // Select matching voice if available
      const voices = window.speechSynthesis.getVoices();
      const matchedVoice = voices.find(v => 
        lang === 'ar' ? v.lang.startsWith('ar') : v.lang.startsWith('en')
      );
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('[VoiceAnnouncer] Failed to speak utterance:', err);
    }
  }

  /**
   * Announce checkout total cleanly
   */
  public announceSale(total: number, currencySymbol: string = '', lang: 'ar' | 'en' = 'ar'): void {
    if (!this.enabled) return;

    const formattedNum = Math.round(total).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US');
    let message = '';

    if (lang === 'ar') {
      message = `المبلغ المطلوب: ${formattedNum} ${currencySymbol}. شكراً لتسوقكم!`;
    } else {
      message = `Total amount is ${formattedNum} ${currencySymbol}. Thank you!`;
    }

    this.speak(message, lang);
  }

  /**
   * Quick sound check / voice test
   */
  public testVoice(lang: 'ar' | 'en' = 'ar'): void {
    const testMsg = lang === 'ar'
      ? 'المساعد الصوتي لنظام كيان كاشير يعمل بنجاح. أهلاً وسهلاً بكم!'
      : 'Kian Cashier smart voice announcer is working perfectly. Welcome!';
    this.speak(testMsg, lang);
  }
}

export const voiceAnnouncer = new VoiceAnnouncerService();
