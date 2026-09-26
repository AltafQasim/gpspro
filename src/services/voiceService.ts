import { Alert } from 'react-native';

class MarineVoiceService {
  private isEnabled: boolean = true;
  private language: 'English' | 'Hindi' | 'Gujarati' = 'Hindi';

  public setEnabled(val: boolean) {
    this.isEnabled = val;
  }

  public getEnabled(): boolean {
    return this.isEnabled;
  }

  public setLanguage(lang: 'English' | 'Hindi' | 'Gujarati') {
    this.language = lang;
  }

  public announceHeading(headingDeg: number) {
    if (!this.isEnabled) return;
    const msg =
      this.language === 'Gujarati'
        ? `હોડીની દિશા: ${headingDeg} અંશ`
        : this.language === 'Hindi'
        ? `नाव की दिशा: ${headingDeg} डिग्री`
        : `Vessel Heading: ${headingDeg} degrees`;

    this.speak(msg);
  }

  public announceWaypoint(name: string, dist: string, bearing: string) {
    if (!this.isEnabled) return;
    const msg =
      this.language === 'Gujarati'
        ? `લક્ષ્ય બિંદુ: ${name}, અંતર: ${dist}, બેરિંગ: ${bearing}`
        : this.language === 'Hindi'
        ? `नेविगेशन लक्ष्य: ${name}, दूरी: ${dist}, बेयरिंग: ${bearing}`
        : `Target: ${name}, Distance: ${dist}, Bearing: ${bearing}`;

    this.speak(msg);
  }

  public announceOffCourse(degrees: number) {
    if (!this.isEnabled) return;
    const msg =
      this.language === 'Gujarati'
        ? `ચેતવણી: હોડી માર્ગથી ${degrees} અંશ ભટકી ગઈ છે!`
        : this.language === 'Hindi'
        ? `सावधान: नाव अपने मार्ग से ${degrees} डिग्री भटक गई है!`
        : `Alert: Vessel is ${degrees} degrees off course!`;

    this.speak(msg);
  }

  public speak(text: string) {
    console.log(`[Marine Voice Announcement - ${this.language}]: ${text}`);

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = this.language === 'Gujarati' ? 'gu-IN' : this.language === 'Hindi' ? 'hi-IN' : 'en-IN';
        utterance.rate = 0.95;
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('SpeechSynthesis error:', err);
      }
    }
  }
}

export const VoiceService = new MarineVoiceService();
