let ExpoSpeech: any = null;
try {
  ExpoSpeech = require('expo-speech');
} catch {
  // Gracefully fallback
}

type VoiceListener = (text: string) => void;

class MarineVoiceService {
  private isEnabled: boolean = true;
  private language: 'English' | 'Hindi' | 'Gujarati' = 'Hindi';
  private listeners: Set<VoiceListener> = new Set();
  private lastAnnouncement: string = '';

  public setEnabled(val: boolean) {
    this.isEnabled = val;
  }

  public getEnabled(): boolean {
    return this.isEnabled;
  }

  public setLanguage(lang: 'English' | 'Hindi' | 'Gujarati') {
    this.language = lang;
  }

  public getLanguage(): 'English' | 'Hindi' | 'Gujarati' {
    return this.language;
  }

  public getLastAnnouncement(): string {
    return this.lastAnnouncement;
  }

  public subscribe(listener: VoiceListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(text: string) {
    this.lastAnnouncement = text;
    this.listeners.forEach((listener) => {
      try {
        listener(text);
      } catch (e) {
        console.warn('Listener notification error:', e);
      }
    });
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
        ? `नेविगेशन लक्ष्य: ${name}, दूरी: ${dist}, बेयरિંગ: ${bearing}`
        : `Target: ${name}, Distance: ${dist}, Bearing: ${bearing}`;

    this.speak(msg);
  }

  public announceOffCourse(degrees: number) {
    if (!this.isEnabled) return;
    const msg =
      this.language === 'Gujarati'
        ? `ચેતવણી: હોડી માર્ગથી ${degrees} અંશ ભટકી ગઈ છે!`
        : this.language === 'Hindi'
        ? `सावधान: नाव मार्ग से ${degrees} डिग्री भटक गई!`
        : `Alert: Vessel is ${degrees} degrees off course!`;

    this.speak(msg);
  }

  public announceCalendarDate(dateStr: string, tithi: string, illumination: number, tide: string) {
    if (!this.isEnabled) return;
    const msg =
      this.language === 'Gujarati'
        ? `${dateStr}, તિથિ ${tithi}. ચંદ્ર ${illumination} ટકા તેજસ્વી. ${tide}.`
        : this.language === 'Hindi'
        ? `${dateStr}, तिथि ${tithi}। चाँद ${illumination} प्रतिशत रोशन। ${tide}।`
        : `${dateStr}, Tithi ${tithi}. Moon is ${illumination}% illuminated. ${tide}.`;

    this.speak(msg);
  }

  public speak(text: string) {
    this.notify(text);
    console.log(`[Marine Voice Announcement - ${this.language}]: ${text}`);

    const langCode =
      this.language === 'Gujarati' ? 'gu-IN' : this.language === 'Hindi' ? 'hi-IN' : 'en-IN';

    // 1. Native Mobile via expo-speech (if installed)
    if (ExpoSpeech && typeof ExpoSpeech.speak === 'function') {
      try {
        if (typeof ExpoSpeech.stop === 'function') {
          ExpoSpeech.stop();
        }
        ExpoSpeech.speak(text, {
          language: langCode,
          rate: 0.95,
          pitch: 1.0,
        });
        return;
      } catch (err) {
        console.warn('[ExpoSpeech error]:', err);
      }
    }

    // 2. Web & Mobile Web Speech Synthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = langCode;
        utterance.rate = 0.95;

        // On Android / iOS Chrome, check if language voice exists, else fallback to hi-IN or en-IN
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          const match = voices.find(
            (v) =>
              v.lang === langCode ||
              v.lang.startsWith(this.language === 'Gujarati' ? 'gu' : this.language === 'Hindi' ? 'hi' : 'en')
          );
          if (match) {
            utterance.voice = match;
          } else if (this.language === 'Gujarati') {
            // Gujarati voice not on device -> fallback to Hindi so sound definitely plays!
            const hiVoice = voices.find((v) => v.lang.startsWith('hi'));
            if (hiVoice) {
              utterance.voice = hiVoice;
              utterance.lang = 'hi-IN';
            }
          }
        }

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('[SpeechSynthesis error]:', err);
      }
    }
  }
}

export const VoiceService = new MarineVoiceService();
