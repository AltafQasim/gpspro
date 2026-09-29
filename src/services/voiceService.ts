let ExpoSpeech: any = null;
try {
  ExpoSpeech = require('expo-speech');
} catch {
  // Gracefully fallback
}

type VoiceListener = (text: string) => void;

/**
 * Transliterates Gujarati unicode text to Devanagari phonetics.
 * This allows standard Hindi TTS voices (installed on 100% of devices) to speak Gujarati text
 * flawlessly when a dedicated Gujarati TTS voice pack is not installed on the user's OS/device.
 */
export function gujaratiToDevanagari(str: string): string {
  if (!str) return '';
  let result = '';
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    // Gujarati Unicode block is 0x0A81 to 0x0AF1
    // Devanagari equivalent is code - 0x0180
    if (code >= 0x0a81 && code <= 0x0af1) {
      result += String.fromCharCode(code - 0x0180);
    } else {
      result += str[i];
    }
  }
  return result;
}

// Prime web speech voices cache
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  try {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices();
    };
  } catch {
    // Ignore
  }
}

class MarineVoiceService {
  private isEnabled: boolean = true;
  private language: 'English' | 'Hindi' | 'Gujarati' = 'Gujarati';
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
      } catch {
        // Silently ignore listener error
      }
    });
  }

  public announceHeading(headingDeg: number, langOverride?: 'English' | 'Hindi' | 'Gujarati') {
    if (!this.isEnabled) return;
    const activeLang = langOverride || this.language;
    const msg =
      activeLang === 'Gujarati'
        ? `હોડીની દિશા: ${headingDeg} અંશ`
        : activeLang === 'Hindi'
          ? `नाव की दिशा: ${headingDeg} डिग्री`
          : `Vessel Heading: ${headingDeg} degrees`;

    this.speak(msg, activeLang);
  }

  public announceWaypoint(name: string, dist: string, bearing: string, langOverride?: 'English' | 'Hindi' | 'Gujarati') {
    if (!this.isEnabled) return;
    const activeLang = langOverride || this.language;
    const msg =
      activeLang === 'Gujarati'
        ? `લક્ષ્ય બિંદુ: ${name}, અંતર: ${dist}, બેરિંગ: ${bearing}`
        : activeLang === 'Hindi'
          ? `नेविगेशन लक्ष्य: ${name}, दूरी: ${dist}, बेयरिंग: ${bearing}`
          : `Target: ${name}, Distance: ${dist}, Bearing: ${bearing}`;

    this.speak(msg, activeLang);
  }

  public announceOffCourse(degrees: number, langOverride?: 'English' | 'Hindi' | 'Gujarati') {
    if (!this.isEnabled) return;
    const activeLang = langOverride || this.language;
    const msg =
      activeLang === 'Gujarati'
        ? `ચેતવણી: હોડી માર્ગથી ${degrees} અંશ ભટકી ગઈ છે!`
        : activeLang === 'Hindi'
          ? `सावधान: नाव मार्ग से ${degrees} डिग्री भटक गई!`
          : `Alert: Vessel is ${degrees} degrees off course!`;

    this.speak(msg, activeLang);
  }

  public announceCalendarDate(
    dateOrOptions:
      | string
      | {
        day: number;
        monthEn?: string;
        tithiName: string;
        tithiNameGu?: string;
        tithiNameHi?: string;
        illumination: number;
        portNameEn?: string;
        portNameGu?: string;
        portNameHi?: string;
        tideTitleEn?: string;
        tideTitleGu?: string;
        tideTitleHi?: string;
        lang?: 'English' | 'Hindi' | 'Gujarati';
      },
    tithi?: string,
    illumination?: number,
    tide?: string,
    langOverride?: 'English' | 'Hindi' | 'Gujarati'
  ) {
    if (!this.isEnabled) return;

    if (typeof dateOrOptions === 'object') {
      const activeLang = dateOrOptions.lang || langOverride || this.language;
      const day = dateOrOptions.day;
      const ill = dateOrOptions.illumination;

      let msg = '';
      if (activeLang === 'Gujarati') {
        const port = dateOrOptions.portNameGu || dateOrOptions.portNameEn || '';
        const tithiGu = dateOrOptions.tithiNameGu || dateOrOptions.tithiName;
        const tideText = dateOrOptions.tideTitleGu || dateOrOptions.tideTitleEn || '';
        msg = `${day} સપ્ટેમ્બર ૨૦૨૬, તિથિ ${tithiGu}. ચંદ્ર ${ill} ટકા તેજસ્વી. ${port ? `${port}: ` : ''}${tideText}.`;
      } else if (activeLang === 'Hindi') {
        const port = dateOrOptions.portNameHi || dateOrOptions.portNameEn || '';
        const tithiHi = dateOrOptions.tithiNameHi || dateOrOptions.tithiName;
        const tideText = dateOrOptions.tideTitleHi || dateOrOptions.tideTitleEn || '';
        msg = `${day} सितम्बर २०२६, तिथि ${tithiHi}। चाँद ${ill} प्रतिशत रोशन। ${port ? `${port}: ` : ''}${tideText}।`;
      } else {
        const port = dateOrOptions.portNameEn || '';
        const tideText = dateOrOptions.tideTitleEn || '';
        msg = `${day} September 2026, Tithi ${dateOrOptions.tithiName}. Moon is ${ill}% illuminated. ${port ? `${port}: ` : ''}${tideText}.`;
      }

      this.speak(msg, activeLang);
      return;
    }

    const activeLang = langOverride || this.language;
    const msg =
      activeLang === 'Gujarati'
        ? `${dateOrOptions}, તિથિ ${tithi}. ચંદ્ર ${illumination} ટકા તેજસ્વી. ${tide}.`
        : activeLang === 'Hindi'
          ? `${dateOrOptions}, तिथि ${tithi}। चाँद ${illumination} प्रतिशत रोशन। ${tide}।`
          : `${dateOrOptions}, Tithi ${tithi}. Moon is ${illumination}% illuminated. ${tide}.`;

    this.speak(msg, activeLang);
  }

  /**
   * Immediately stops any active voice speech playback.
   */
  public stop() {
    if (ExpoSpeech && typeof ExpoSpeech.stop === 'function') {
      try {
        ExpoSpeech.stop();
      } catch { }
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch { }
    }
  }

  public announceWeather(options: {
    portNameEn: string;
    portNameGu?: string;
    portNameHi?: string;
    temp: number;
    windKnots: number;
    windDir: string;
    waveMeters: number;
    conditionEn: string;
    conditionGu?: string;
    conditionHi?: string;
    advisoryGu?: string;
    advisoryHi?: string;
    advisoryEn?: string;
    lang?: 'English' | 'Hindi' | 'Gujarati';
  }) {
    if (!this.isEnabled) return;
    const activeLang = options.lang || this.language;

    let msg = '';
    if (activeLang === 'Gujarati') {
      const portName = options.portNameGu || options.portNameEn;
      const cond = options.conditionGu || options.conditionEn;
      const adv = options.advisoryGu ? ` ${options.advisoryGu}` : '';
      msg = `${portName} દરિયાઈ હવામાન અપડેટ. હાલનું તાપમાન ${options.temp} ડિગ્રી સેલ્સિયસ. પવનની ઝડપ ${options.windKnots} નોટ્સ, દિશા ${options.windDir}. મોજાંની ઊંચાઈ ${options.waveMeters} મીટર. દરિયાની સ્થિતિ: ${cond}.${adv}`;
    } else if (activeLang === 'Hindi') {
      const portName = options.portNameHi || options.portNameEn;
      const cond = options.conditionHi || options.conditionEn;
      const adv = options.advisoryHi ? ` ${options.advisoryHi}` : '';
      msg = `${portName} समुद्री मौसम अपडेट। वर्तमान तापमान ${options.temp} डिग्री सेल्सियस। हवा की गति ${options.windKnots} नॉट्स, दिशा ${options.windDir}। लहरों की ऊंचाई ${options.waveMeters} मीटर। समुद्र की स्थिति: ${cond}।${adv}`;
    } else {
      const adv = options.advisoryEn ? ` ${options.advisoryEn}` : '';
      msg = `Marine weather update for ${options.portNameEn}. Current temperature ${options.temp} degrees Celsius. Wind speed ${options.windKnots} knots from ${options.windDir}. Wave height ${options.waveMeters} meters. Condition: ${options.conditionEn}.${adv}`;
    }

    this.speak(msg, activeLang);
  }

  public announceTide(options: {
    portNameEn: string;
    portNameGu?: string;
    portNameHi?: string;
    height: number;
    isRising: boolean;
    timeStr: string;
    nextEventTextGu?: string;
    nextEventTextHi?: string;
    nextEventTextEn?: string;
    lang?: 'English' | 'Hindi' | 'Gujarati';
  }) {
    if (!this.isEnabled) return;
    const activeLang = options.lang || this.language;

    let msg = '';
    if (activeLang === 'Gujarati') {
      const portName = options.portNameGu || options.portNameEn;
      const stateText = options.isRising
        ? 'ભરતી ચાલુ છે, પાણી ચઢે છે'
        : 'ઓટ ચાલુ છે, પાણી ઉતરે છે';
      const next = options.nextEventTextGu ? ` ${options.nextEventTextGu}.` : '';
      msg = `${portName} ભરતી-ઓટ અપડેટ. સમય ${options.timeStr}. હાલનું જળસ્તર ${options.height.toFixed(2)} મીટર છે. ${stateText}.${next} માછીમારી માટે અનુકૂળ સમય છે.`;
    } else if (activeLang === 'Hindi') {
      const portName = options.portNameHi || options.portNameEn;
      const stateText = options.isRising ? 'पानी चढ़ रहा है, ज्वार चालू है' : 'पानी उतर रहा है, भाटा चालू है';
      const next = options.nextEventTextHi ? ` ${options.nextEventTextHi}।` : '';
      msg = `${portName} ज्वार-भाटा अपडेट। समय ${options.timeStr}। वर्तमान जलस्तर ${options.height.toFixed(2)} मीटर है। ${stateText}।${next}`;
    } else {
      const stateText = options.isRising ? 'Water is rising, flood tide' : 'Water is receding, ebb tide';
      const next = options.nextEventTextEn ? ` ${options.nextEventTextEn}.` : '';
      msg = `Tide and water level update for ${options.portNameEn}. Time ${options.timeStr}. Current water level is ${options.height.toFixed(2)} meters. ${stateText}.${next} Good conditions for fishing.`;
    }

    this.speak(msg, activeLang);
  }

  public announceTideEvent(options: {
    portNameEn: string;
    portNameGu?: string;
    portNameHi?: string;
    type: 'high' | 'low';
    time: string;
    height: number;
    lang?: 'English' | 'Hindi' | 'Gujarati';
  }) {
    if (!this.isEnabled) return;
    const activeLang = options.lang || this.language;

    let msg = '';
    if (activeLang === 'Gujarati') {
      const portName = options.portNameGu || options.portNameEn;
      const typeText = options.type === 'high' ? 'મોટી ભરતી' : 'ઓટ';
      msg = `${portName} બંદર. ${options.time} વાગ્યે ${typeText} થશે. પાણીની અંદાજિત ઊંચાઈ ${options.height.toFixed(2)} મીટર રહેશે.`;
    } else if (activeLang === 'Hindi') {
      const portName = options.portNameHi || options.portNameEn;
      const typeText = options.type === 'high' ? 'उच्च ज्वार' : 'भाटा';
      msg = `${portName} बंदरगाह। ${options.time} बजे ${typeText} होगा। जलस्तर लगभग ${options.height.toFixed(2)} मीटर रहेगा।`;
    } else {
      const typeText = options.type === 'high' ? 'High tide' : 'Low tide';
      msg = `${options.portNameEn} port. ${typeText} at ${options.time}. Water level will be ${options.height.toFixed(2)} meters.`;
    }

    this.speak(msg, activeLang);
  }

  public speak(text: string, langOverride?: 'English' | 'Hindi' | 'Gujarati') {
    if (!this.isEnabled) return;
    const activeLang = langOverride || this.language;
    this.language = activeLang;
    this.notify(text);
    console.log(`[Marine Voice Announcement - ${activeLang}]: ${text}`);

    const langCode =
      activeLang === 'Gujarati' ? 'gu-IN' : activeLang === 'Hindi' ? 'hi-IN' : 'en-IN';

    // 1. Native Mobile via expo-speech (if installed)
    if (ExpoSpeech && typeof ExpoSpeech.speak === 'function') {
      try {
        if (typeof ExpoSpeech.stop === 'function') {
          ExpoSpeech.stop();
        }

        if (activeLang === 'Gujarati') {
          // Check if device actually has a native Gujarati voice installed
          if (typeof ExpoSpeech.getAvailableVoicesAsync === 'function') {
            ExpoSpeech.getAvailableVoicesAsync()
              .then((voices: any[]) => {
                const hasGu =
                  voices &&
                  voices.some(
                    (v) =>
                      v.language &&
                      (v.language.startsWith('gu') || v.language.toLowerCase().includes('gujarat'))
                  );

                if (hasGu) {
                  ExpoSpeech.speak(text, {
                    language: 'gu-IN',
                    rate: 0.95,
                    pitch: 1.0,
                    onError: () => {
                      // Fallback to Hindi voice with Gujarati phonetics transliterated to Devanagari
                      ExpoSpeech.speak(gujaratiToDevanagari(text), {
                        language: 'hi-IN',
                        rate: 0.95,
                        pitch: 1.0,
                      });
                    },
                  });
                } else {
                  // Device has no native Gujarati voice pack installed!
                  // Speak Gujarati phonetics using Hindi voice engine so speech definitely works!
                  ExpoSpeech.speak(gujaratiToDevanagari(text), {
                    language: 'hi-IN',
                    rate: 0.95,
                    pitch: 1.0,
                  });
                }
              })
              .catch(() => {
                ExpoSpeech.speak(text, {
                  language: 'gu-IN',
                  rate: 0.95,
                  pitch: 1.0,
                  onError: () => {
                    ExpoSpeech.speak(gujaratiToDevanagari(text), {
                      language: 'hi-IN',
                      rate: 0.95,
                      pitch: 1.0,
                    });
                  },
                });
              });
            return;
          } else {
            ExpoSpeech.speak(text, {
              language: 'gu-IN',
              rate: 0.95,
              pitch: 1.0,
              onError: () => {
                ExpoSpeech.speak(gujaratiToDevanagari(text), {
                  language: 'hi-IN',
                  rate: 0.95,
                  pitch: 1.0,
                });
              },
            });
            return;
          }
        }

        // English or Hindi
        ExpoSpeech.speak(text, {
          language: langCode,
          rate: 0.95,
          pitch: 1.0,
        });
        return;
      } catch {
        // Silently fall back to web speech
      }
    }

    // 2. Web & Mobile Web Speech Synthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        window.speechSynthesis.cancel();

        const voices = window.speechSynthesis.getVoices();
        let targetVoice: SpeechSynthesisVoice | null = null;
        let textToSpeak = text;
        let speechLang = langCode;

        if (activeLang === 'Gujarati') {
          const guVoice = voices.find(
            (v) =>
              v.lang === 'gu-IN' ||
              v.lang.startsWith('gu') ||
              v.name.toLowerCase().includes('gujarat')
          );

          if (guVoice) {
            targetVoice = guVoice;
            speechLang = 'gu-IN';
            textToSpeak = text;
          } else {
            // Windows / Chrome has no Gujarati TTS by default -> use Hindi voice with Devanagari text!
            const hiVoice = voices.find(
              (v) =>
                v.lang === 'hi-IN' ||
                v.lang.startsWith('hi') ||
                v.name.toLowerCase().includes('hindi')
            );
            if (hiVoice) {
              targetVoice = hiVoice;
            }
            speechLang = 'hi-IN';
            textToSpeak = gujaratiToDevanagari(text);
          }
        } else if (activeLang === 'Hindi') {
          const hiVoice = voices.find((v) => v.lang === 'hi-IN' || v.lang.startsWith('hi'));
          if (hiVoice) targetVoice = hiVoice;
          speechLang = 'hi-IN';
          textToSpeak = text;
        } else {
          const enVoice = voices.find((v) => v.lang === 'en-IN' || v.lang.startsWith('en'));
          if (enVoice) targetVoice = enVoice;
          speechLang = 'en-IN';
          textToSpeak = text;
        }

        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = speechLang;
        if (targetVoice) {
          utterance.voice = targetVoice;
        }
        utterance.rate = 0.95;

        utterance.onerror = () => {
          if (activeLang === 'Gujarati' && speechLang === 'gu-IN') {
            // Immediate fallback to Hindi voice with Devanagari transliteration
            const fallbackUtterance = new SpeechSynthesisUtterance(gujaratiToDevanagari(text));
            fallbackUtterance.lang = 'hi-IN';
            fallbackUtterance.rate = 0.95;
            window.speechSynthesis.speak(fallbackUtterance);
          }
        };

        window.speechSynthesis.speak(utterance);
      } catch {
        // Silently ignore speech synthesis browser restriction
      }
    }
  }
}

export const VoiceService = new MarineVoiceService();
