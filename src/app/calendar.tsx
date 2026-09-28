import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackButton } from '@/components/ui/back-button';
import { SettingsStore, SpeechLanguage } from '@/services/settingsStore';
import { VoiceService } from '@/services/voiceService';
import { DynamicMoonView } from '@/components/marine/DynamicMoonView';
import {
  getMoonPhaseDetails,
  getSunTimingDetails,
  getLocalizedTithiName,
  MoonPhaseInfo,
  SunTimingInfo,
} from '@/utils/astronomy';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Dynamic large moon diameter and radius - fills the circular stage edge-to-edge
export const MOON_SIZE = Math.min(250, Math.max(220, Math.round(SCREEN_WIDTH * 0.65)));
export const MOON_RADIUS = MOON_SIZE / 2;

// Ultra-high definition realistic full moon photography (crystal clear, high contrast, craters & Tycho rays)
const PRIMARY_MOON_IMAGE_URI =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/FullMoon2010.jpg/1024px-FullMoon2010.jpg';

const FALLBACK_MOON_IMAGE_URI =
  'https://images.unsplash.com/photo-1522030299830-16b8d3d049fe?w=1000&auto=format&fit=crop&q=95';

const REAL_MOON_IMAGE_URI = PRIMARY_MOON_IMAGE_URI;

// Coastal Fishing Ports Configuration for Western India / Gujarat
export interface CoastalPort {
  id: string;
  name: string;
  nameGu: string;
  nameHi: string;
  region: string;
  coords: string;
  moonOffsetMin: number;
  sunOffsetMin: number;
  tideCharacteristics: string;
  highWaterMeters: number;
}

export const COASTAL_PORTS: CoastalPort[] = [
  {
    id: 'veraval',
    name: 'Veraval Port',
    nameGu: 'વેરાવળ બંદર',
    nameHi: 'वेरावल बंदरगाह',
    region: 'Saurashtra Coast',
    coords: '20°54\'N, 70°22\'E',
    moonOffsetMin: 0,
    sunOffsetMin: 0,
    tideCharacteristics: 'Baseline Indian Spring Tide (Juvar/Bhanj)',
    highWaterMeters: 3.2,
  },
  {
    id: 'diu',
    name: 'Diu (Vanjiya)',
    nameGu: 'દીવ વાંછીયા બારા',
    nameHi: 'दीव (वाणिज्य)',
    region: 'Diu Coast',
    coords: '20°42\'N, 70°59\'E',
    moonOffsetMin: 4,
    sunOffsetMin: 3,
    tideCharacteristics: 'Active Tidal Current & Channel Surge',
    highWaterMeters: 3.4,
  },
  {
    id: 'porbandar',
    name: 'Porbandar Port',
    nameGu: 'પોરબંદર બંદર',
    nameHi: 'पोरबंदर बंदरगाह',
    region: 'Western Seaboard',
    coords: '21°38\'N, 69°36\'E',
    moonOffsetMin: -6,
    sunOffsetMin: -5,
    tideCharacteristics: 'Deep Open Sea & High Swell Waters',
    highWaterMeters: 3.0,
  },
  {
    id: 'mangrol',
    name: 'Mangrol Harbor',
    nameGu: 'માંગરોળ બંદર',
    nameHi: 'मांगरोल हार्बर',
    region: 'Saurashtra Coast',
    coords: '21°07\'N, 70°07\'E',
    moonOffsetMin: -2,
    sunOffsetMin: -2,
    tideCharacteristics: 'Sandbar Inflow & Steady Juvar',
    highWaterMeters: 3.1,
  },
  {
    id: 'jafrabad',
    name: 'Jafrabad Port',
    nameGu: 'જાફરાબાદ બંદર',
    nameHi: 'जाफराबाद बंदरगाह',
    region: 'Amreli Coast',
    coords: '20°52\'N, 71°22\'E',
    moonOffsetMin: 9,
    sunOffsetMin: 7,
    tideCharacteristics: 'Creek Protected Fast Influx',
    highWaterMeters: 3.8,
  },
  {
    id: 'okha',
    name: 'Okha / Dwarka',
    nameGu: 'ઓખા / દ્વારકા બંદર',
    nameHi: 'ओखा / द्वारका',
    region: 'Gulf of Kutch Entry',
    coords: '22°28\'N, 69°04\'E',
    moonOffsetMin: -12,
    sunOffsetMin: -9,
    tideCharacteristics: 'Turbulent Headland Currents & High Tidal Range',
    highWaterMeters: 4.1,
  },
  {
    id: 'bhavnagar',
    name: 'Bhavnagar (GOP)',
    nameGu: 'ભાવનગર (ઘોઘા / ગોપ)',
    nameHi: 'भावनगर (गल्प)',
    region: 'Gulf of Khambhat',
    coords: '21°46\'N, 72°09\'E',
    moonOffsetMin: 26,
    sunOffsetMin: 18,
    tideCharacteristics: 'Extreme Tidal Bore Surge (10.5m Macrotidal)',
    highWaterMeters: 10.5,
  },
  {
    id: 'mumbai',
    name: 'Mumbai (Sassoon Dock)',
    nameGu: 'મુંબઈ (સાસૂન ડૉક)',
    nameHi: 'मुंबई (ससून डॉक)',
    region: 'Maharashtra Coast',
    coords: '18°55\'N, 72°49\'E',
    moonOffsetMin: -14,
    sunOffsetMin: -10,
    tideCharacteristics: 'Continental Shelf Marine Fleet Harbor',
    highWaterMeters: 4.8,
  },
  {
    id: 'kandla',
    name: 'Kandla Harbor',
    nameGu: 'કંડલા બંદર',
    nameHi: 'कांडला बंदरगाह',
    region: 'Gulf of Kutch',
    coords: '23°00\'N, 70°13\'E',
    moonOffsetMin: 11,
    sunOffsetMin: 8,
    tideCharacteristics: 'Deep Gulf Macro Channel Flow',
    highWaterMeters: 6.2,
  },
  {
    id: 'mandvi',
    name: 'Mandvi Port',
    nameGu: 'માંડવી (કચ્છ)',
    nameHi: 'मांडवी (कच्छ)',
    region: 'Kutch Seaboard',
    coords: '22°50\'N, 69°21\'E',
    moonOffsetMin: -8,
    sunOffsetMin: -6,
    tideCharacteristics: 'Shallow Coastal Fishery Waters',
    highWaterMeters: 3.3,
  },
];

// Helper to convert 24h "HH:MM" to 12h "hh:mm AM/PM"
export function format24to12(timeStr: string): string {
  if (!timeStr) return '';
  if (timeStr.includes('AM') || timeStr.includes('PM')) return timeStr;
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  let h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return timeStr;
  const ampm = h >= 12 ? 'PM' : 'AM';
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
}

// Helper to adjust time string by minute offset
function adjustTimeString(baseTimeStr: string, offsetMinutes: number): string {
  if (!baseTimeStr) return baseTimeStr;
  const time12 = format24to12(baseTimeStr);
  if (offsetMinutes === 0) return time12;
  const match = time12.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return time12;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridiem = match[3].toUpperCase();

  if (meridiem === 'PM' && hours < 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;

  let totalMinutes = hours * 60 + minutes + offsetMinutes;
  while (totalMinutes < 0) totalMinutes += 1440;
  totalMinutes = totalMinutes % 1440;

  let newHours = Math.floor(totalMinutes / 60);
  const newMinutes = totalMinutes % 60;
  const newMeridiem = newHours >= 12 ? 'PM' : 'AM';

  if (newHours > 12) newHours -= 12;
  if (newHours === 0) newHours = 12;

  return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')} ${newMeridiem}`;
}

interface CalendarDay {
  day: number;
  tithiNum: string;
  tithiName: string;
  illumination: number; // 0 to 100%
  phaseName: string;
  isSpecial?: boolean;
  specialColor?: 'yellow' | 'green' | 'blue' | 'purple';
  moonRise: string;
  moonSet: string;
  sunRise: string;
  sunSet: string;
  tideCondition: string;
  tideType: 'Juvar' | 'Bhanj' | 'Normal';
}

// 30 Days of September 2026 (Preserved previous calendar data)
const DAYS_DATA: (CalendarDay | null)[] = [
  null, null,
  {
    day: 1,
    tithiNum: '૪',
    tithiName: 'Choth',
    illumination: 22,
    phaseName: 'Waxing Crescent',
    moonRise: '09:20 AM',
    moonSet: '09:44 PM',
    sunRise: '06:20 AM',
    sunSet: '06:48 PM',
    tideCondition: 'Bhanj (Neap Tide)',
    tideType: 'Bhanj',
  },
  {
    day: 2,
    tithiNum: '૫',
    tithiName: 'Pancham',
    illumination: 30,
    phaseName: 'Waxing Crescent',
    moonRise: '10:14 AM',
    moonSet: '10:28 PM',
    sunRise: '06:20 AM',
    sunSet: '06:47 PM',
    tideCondition: 'Normal Tide',
    tideType: 'Normal',
  },
  {
    day: 3,
    tithiNum: '૬',
    tithiName: 'Chhath',
    illumination: 40,
    phaseName: 'Waxing Crescent',
    moonRise: '11:08 AM',
    moonSet: '11:15 PM',
    sunRise: '06:21 AM',
    sunSet: '06:46 PM',
    tideCondition: 'Normal Tide',
    tideType: 'Normal',
  },
  {
    day: 4,
    tithiNum: '૮',
    tithiName: 'Aatham',
    illumination: 52,
    phaseName: 'First Quarter',
    moonRise: '12:02 PM',
    moonSet: '11:58 PM',
    sunRise: '06:21 AM',
    sunSet: '06:45 PM',
    tideCondition: 'Bhanj (Slow Current)',
    tideType: 'Bhanj',
  },
  {
    day: 5,
    tithiNum: '૯',
    tithiName: 'Nom',
    illumination: 63,
    phaseName: 'Waxing Gibbous',
    moonRise: '01:04 PM',
    moonSet: '12:44 AM',
    sunRise: '06:22 AM',
    sunSet: '06:44 PM',
    tideCondition: 'Juvar Rising',
    tideType: 'Juvar',
  },
  {
    day: 6,
    tithiNum: '૧૦',
    tithiName: 'Dasham',
    illumination: 73,
    phaseName: 'Waxing Gibbous',
    moonRise: '02:02 PM',
    moonSet: '01:34 AM',
    sunRise: '06:22 AM',
    sunSet: '06:43 PM',
    tideCondition: 'Juvar Rising',
    tideType: 'Juvar',
  },
  {
    day: 7,
    tithiNum: '૧૧',
    tithiName: 'Agiyaras',
    illumination: 82,
    phaseName: 'Waxing Gibbous',
    moonRise: '02:56 PM',
    moonSet: '02:26 AM',
    sunRise: '06:22 AM',
    sunSet: '06:42 PM',
    tideCondition: 'High Juvar Approaching',
    tideType: 'Juvar',
  },
  {
    day: 8,
    tithiNum: '૧૨',
    tithiName: 'Baras',
    illumination: 89,
    phaseName: 'Waxing Gibbous',
    moonRise: '03:48 PM',
    moonSet: '03:20 AM',
    sunRise: '06:23 AM',
    sunSet: '06:41 PM',
    tideCondition: 'Strong Juvar (Spring Current)',
    tideType: 'Juvar',
    isSpecial: true,
    specialColor: 'yellow',
  },
  {
    day: 9,
    tithiNum: '૧૩',
    tithiName: 'Teras',
    illumination: 94,
    phaseName: 'Waxing Gibbous',
    moonRise: '04:36 PM',
    moonSet: '04:14 AM',
    sunRise: '06:23 AM',
    sunSet: '06:40 PM',
    tideCondition: 'High Spring Juvar',
    tideType: 'Juvar',
  },
  {
    day: 10,
    tithiNum: '૧૪',
    tithiName: 'Chaudas',
    illumination: 98,
    phaseName: 'Waxing Gibbous',
    moonRise: '05:22 PM',
    moonSet: '05:08 AM',
    sunRise: '06:23 AM',
    sunSet: '06:39 PM',
    tideCondition: 'Peak Juvar 🌊',
    tideType: 'Juvar',
    isSpecial: true,
    specialColor: 'green',
  },
  {
    day: 11,
    tithiNum: '૧૫',
    tithiName: 'Poonam (Full Moon)',
    illumination: 100,
    phaseName: 'Full Moon 🌕',
    moonRise: '06:06 PM',
    moonSet: '06:04 AM',
    sunRise: '06:24 AM',
    sunSet: '06:38 PM',
    tideCondition: 'Max Spring Juvar (Highest Tide)',
    tideType: 'Juvar',
    isSpecial: true,
    specialColor: 'yellow',
  },
  {
    day: 12,
    tithiNum: '૧',
    tithiName: 'Ekam (Vad)',
    illumination: 97,
    phaseName: 'Waning Gibbous',
    moonRise: '06:50 PM',
    moonSet: '07:00 AM',
    sunRise: '06:24 AM',
    sunSet: '06:37 PM',
    tideCondition: 'Strong Juvar Flow',
    tideType: 'Juvar',
  },
  {
    day: 13,
    tithiNum: '૨',
    tithiName: 'Beej',
    illumination: 92,
    phaseName: 'Waning Gibbous',
    moonRise: '07:34 PM',
    moonSet: '07:56 AM',
    sunRise: '06:25 AM',
    sunSet: '06:36 PM',
    tideCondition: 'Juvar Receding',
    tideType: 'Juvar',
  },
  {
    day: 14,
    tithiNum: '૩',
    tithiName: 'Trij',
    illumination: 85,
    phaseName: 'Waning Gibbous',
    moonRise: '08:20 PM',
    moonSet: '08:52 AM',
    sunRise: '06:25 AM',
    sunSet: '06:35 PM',
    tideCondition: 'Normal Current',
    tideType: 'Normal',
  },
  {
    day: 15,
    tithiNum: '૪',
    tithiName: 'Choth',
    illumination: 76,
    phaseName: 'Waning Gibbous',
    moonRise: '09:08 PM',
    moonSet: '09:48 AM',
    sunRise: '06:25 AM',
    sunSet: '06:34 PM',
    tideCondition: 'Bhanj Approaching',
    tideType: 'Bhanj',
  },
  {
    day: 16,
    tithiNum: '૫',
    tithiName: 'Pancham',
    illumination: 66,
    phaseName: 'Waning Gibbous',
    moonRise: '10:00 PM',
    moonSet: '10:44 AM',
    sunRise: '06:26 AM',
    sunSet: '06:33 PM',
    tideCondition: 'Bhanj (Slack Water)',
    tideType: 'Bhanj',
  },
  {
    day: 17,
    tithiNum: '૬',
    tithiName: 'Chhath',
    illumination: 55,
    phaseName: 'Last Quarter',
    moonRise: '10:56 PM',
    moonSet: '11:40 AM',
    sunRise: '06:26 AM',
    sunSet: '06:32 PM',
    tideCondition: 'Bhanj (Minimum Tidal Range)',
    tideType: 'Bhanj',
  },
  {
    day: 18,
    tithiNum: '૭',
    tithiName: 'Satam',
    illumination: 44,
    phaseName: 'Waning Crescent',
    moonRise: '11:54 PM',
    moonSet: '12:34 PM',
    sunRise: '06:26 AM',
    sunSet: '06:31 PM',
    tideCondition: 'Bhanj Turning',
    tideType: 'Bhanj',
  },
  {
    day: 19,
    tithiNum: '૮',
    tithiName: 'Aatham',
    illumination: 33,
    phaseName: 'Waning Crescent',
    moonRise: '12:54 AM',
    moonSet: '01:26 PM',
    sunRise: '06:27 AM',
    sunSet: '06:30 PM',
    tideCondition: 'Normal Current',
    tideType: 'Normal',
  },
  {
    day: 20,
    tithiNum: '૯',
    tithiName: 'Nom',
    illumination: 24,
    phaseName: 'Waning Crescent',
    moonRise: '01:54 AM',
    moonSet: '02:16 PM',
    sunRise: '06:27 AM',
    sunSet: '06:29 PM',
    tideCondition: 'Juvar Rising',
    tideType: 'Juvar',
  },
  {
    day: 21,
    tithiNum: '૧૦',
    tithiName: 'Dasham',
    illumination: 16,
    phaseName: 'Waning Crescent',
    moonRise: '02:54 AM',
    moonSet: '03:04 PM',
    sunRise: '06:27 AM',
    sunSet: '06:28 PM',
    tideCondition: 'Strong Juvar',
    tideType: 'Juvar',
  },
  {
    day: 22,
    tithiNum: '૧૧',
    tithiName: 'Agiyaras',
    illumination: 9,
    phaseName: 'Waning Crescent',
    moonRise: '03:54 AM',
    moonSet: '03:52 PM',
    sunRise: '06:28 AM',
    sunSet: '06:27 PM',
    tideCondition: 'Strong Juvar',
    tideType: 'Juvar',
  },
  {
    day: 23,
    tithiNum: '૧૨',
    tithiName: 'Baras',
    illumination: 5,
    phaseName: 'Waning Crescent',
    moonRise: '04:54 AM',
    moonSet: '04:40 PM',
    sunRise: '06:28 AM',
    sunSet: '06:26 PM',
    tideCondition: 'Peak Juvar 🌊',
    tideType: 'Juvar',
    isSpecial: true,
    specialColor: 'yellow',
  },
  {
    day: 24,
    tithiNum: '૧૩',
    tithiName: 'Teras',
    illumination: 2,
    phaseName: 'Waning Crescent',
    moonRise: '05:54 AM',
    moonSet: '05:28 PM',
    sunRise: '06:28 AM',
    sunSet: '06:25 PM',
    tideCondition: 'Peak Juvar (Spring Tide)',
    tideType: 'Juvar',
  },
  {
    day: 25,
    tithiNum: '૧૪',
    tithiName: 'Chaudas',
    illumination: 1,
    phaseName: 'New Moon Eve 🌑',
    moonRise: '06:54 AM',
    moonSet: '06:18 PM',
    sunRise: '06:29 AM',
    sunSet: '06:24 PM',
    tideCondition: 'High Spring Juvar 🐟',
    tideType: 'Juvar',
    isSpecial: true,
    specialColor: 'green',
  },
  {
    day: 26,
    tithiNum: '૧૫',
    tithiName: 'Amas (New Moon)',
    illumination: 0,
    phaseName: 'New Moon 🌑',
    moonRise: '07:54 AM',
    moonSet: '07:10 PM',
    sunRise: '06:29 AM',
    sunSet: '06:23 PM',
    tideCondition: 'Max Spring Juvar (Highest Tide)',
    tideType: 'Juvar',
    isSpecial: true,
    specialColor: 'yellow',
  },
  {
    day: 27,
    tithiNum: '૧',
    tithiName: 'Ekam (Sud)',
    illumination: 3,
    phaseName: 'Waxing Crescent',
    moonRise: '08:54 AM',
    moonSet: '08:04 PM',
    sunRise: '06:30 AM',
    sunSet: '06:22 PM',
    tideCondition: 'Strong Juvar Flow',
    tideType: 'Juvar',
  },
  {
    day: 28,
    tithiNum: '૨',
    tithiName: 'Beej',
    illumination: 8,
    phaseName: 'Waxing Crescent',
    moonRise: '09:54 AM',
    moonSet: '09:00 PM',
    sunRise: '06:30 AM',
    sunSet: '06:21 PM',
    tideCondition: 'Normal Current',
    tideType: 'Normal',
  },
  {
    day: 29,
    tithiNum: '૩',
    tithiName: 'Trij',
    illumination: 15,
    phaseName: 'Waxing Crescent',
    moonRise: '10:52 AM',
    moonSet: '09:58 PM',
    sunRise: '06:30 AM',
    sunSet: '06:20 PM',
    tideCondition: 'Normal Current',
    tideType: 'Normal',
  },
  {
    day: 30,
    tithiNum: '૪',
    tithiName: 'Choth',
    illumination: 24,
    phaseName: 'Waxing Crescent',
    moonRise: '11:48 AM',
    moonSet: '10:56 PM',
    sunRise: '06:31 AM',
    sunSet: '06:19 PM',
    tideCondition: 'Bhanj Approaching',
    tideType: 'Bhanj',
  },
];

// Helper to determine if a date is waxing (Sud paksha) or waning (Vad paksha)
export function isDateWaxing(day: number): boolean {
  if (day >= 1 && day <= 11) return true; // Waxing towards Poonam
  if (day >= 27 && day <= 30) return true; // Waxing after Amas
  return false; // Waning (Day 12 to 26)
}

// Calculate exact astronomical phase (0.0 = New Moon / Amas, 0.5 = Full Moon / Poonam)
export function getPhaseForDay(day: number, illumination: number): number {
  const waxing = isDateWaxing(day);
  if (waxing) {
    return (illumination / 100) * 0.5;
  } else {
    return 0.5 + (1 - illumination / 100) * 0.5;
  }
}

export default function CalendarScreen() {
  const router = useRouter();

  // Settings
  const [isNight, setIsNight] = useState<boolean>(() => SettingsStore.isNightMode());
  const [language, setLanguage] = useState<SpeechLanguage>(() => SettingsStore.getSettings().ttsLang);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(() => SettingsStore.getSettings().voiceAnnounce);

  // Selected Day State: Default to Poonam (Day 11 - 100% Full Moon) so the detailed moon is immediately visible in full glory
  const [selectedDay, setSelectedDay] = useState<number>(11);
  const [moonImgUri, setMoonImgUri] = useState<string>(PRIMARY_MOON_IMAGE_URI);

  // Selected Port
  const [selectedPort, setSelectedPort] = useState<CoastalPort>(COASTAL_PORTS[0]); // Veraval
  const [showPortModal, setShowPortModal] = useState<boolean>(false);

  // Manual Calibration Offsets
  const [moonRiseOffset, setMoonRiseOffset] = useState<number>(0);
  const [moonSetOffset, setMoonSetOffset] = useState<number>(0);
  const [showLangPicker, setShowLangPicker] = useState<boolean>(false);

  // Live Voice Announcement Subtitle Bar
  const [liveAnnouncement, setLiveAnnouncement] = useState<string>('');

  useEffect(() => {
    const unsubSettings = SettingsStore.subscribe((s) => {
      setIsNight(SettingsStore.isNightMode());
      setLanguage(s.ttsLang);
      VoiceService.setLanguage(s.ttsLang);
      setVoiceEnabled(s.voiceAnnounce);
    });

    const unsubVoice = VoiceService.subscribe((text) => {
      setLiveAnnouncement(text);
    });

    return () => {
      unsubSettings();
      unsubVoice();
    };
  }, []);

  // Keep VoiceService in sync whenever local language state changes
  useEffect(() => {
    VoiceService.setLanguage(language);
  }, [language]);

  const currentDayData: CalendarDay =
    DAYS_DATA.find((d) => d && d.day === selectedDay) || (DAYS_DATA[12] as CalendarDay);

  // High-precision Marine Astronomical calculation for the selected date
  const selectedDateObj = new Date(2026, 8, selectedDay, 12, 0, 0);
  const astroMoon: MoonPhaseInfo = getMoonPhaseDetails(selectedDateObj);
  const astroSun: SunTimingInfo = getSunTimingDetails(selectedDateObj);

  const currentPhase = astroMoon.phase;
  const isWaxing = astroMoon.isWaxing;
  const illumination = astroMoon.illumination;

  // Handle Day Selection with Strictly Language-Based Voice Announcement
  const handleSelectDay = (day: number) => {
    const dayItem = DAYS_DATA.find((d) => d && d.day === day);
    if (!dayItem) return;

    setSelectedDay(day);

    if (voiceEnabled) {
      const dayDate = new Date(2026, 8, day, 12, 0, 0);
      const dayAstro = getMoonPhaseDetails(dayDate);
      VoiceService.announceCalendarDate({
        day,
        tithiName: dayItem.tithiName,
        tithiNameGu: getLocalizedTithiName(dayItem.tithiName, 'Gujarati'),
        tithiNameHi: getLocalizedTithiName(dayItem.tithiName, 'Hindi'),
        illumination: dayAstro.illumination,
        portNameEn: selectedPort.name,
        portNameGu: selectedPort.nameGu,
        portNameHi: selectedPort.nameHi,
        tideTitleEn: dayAstro.tideTitleEn,
        tideTitleGu: dayAstro.tideTitleGu,
        tideTitleHi: dayAstro.tideTitleHi,
        lang: language,
      });
    }
  };

  // Tap Moon Voice trigger (Strictly Language-Based)
  const handleTapMoon = () => {
    if (!voiceEnabled) return;
    const portNameText =
      language === 'Gujarati'
        ? selectedPort.nameGu
        : language === 'Hindi'
        ? selectedPort.nameHi
        : selectedPort.name;

    const phaseText =
      language === 'Gujarati'
        ? astroMoon.phaseNameGu
        : language === 'Hindi'
        ? astroMoon.phaseNameHi
        : astroMoon.phaseNameEn;

    const tideText =
      language === 'Gujarati'
        ? astroMoon.tideTitleGu
        : language === 'Hindi'
        ? astroMoon.tideTitleHi
        : astroMoon.tideTitleEn;

    const msg =
      language === 'Gujarati'
        ? `${portNameText}, ચંદ્ર તેજસ્વીતા: ${astroMoon.illumination} ટકા, ${phaseText}, ભરતી: ${tideText}, ચંદ્રનું અંતર: ${astroMoon.distanceKm} કિલોમીટર`
        : language === 'Hindi'
        ? `${portNameText}, चाँद की रोशनी: ${astroMoon.illumination} प्रतिशत, ${phaseText}, ज्वार: ${tideText}, चाँद की दूरी: ${astroMoon.distanceKm} किलोमीटर`
        : `${portNameText}, Moon Illumination: ${astroMoon.illumination} percent, ${phaseText}, Tide: ${tideText}, Distance: ${astroMoon.distanceKm} kilometers`;

    VoiceService.speak(msg, language);
  };

  // Port Selection (Strictly Language-Based)
  const handleSelectPort = (port: CoastalPort) => {
    setSelectedPort(port);
    setShowPortModal(false);

    if (voiceEnabled) {
      const portName =
        language === 'Gujarati' ? port.nameGu : language === 'Hindi' ? port.nameHi : port.name;

      const msg =
        language === 'Gujarati'
          ? `${portName} પસંદ કર્યો. સૂર્ય અને ચંદ્ર સમય ગોઠવાઈ ગયો.`
          : language === 'Hindi'
          ? `${portName} चुना गया। चाँद और सूरज का समय अपडेट हुआ।`
          : `${port.name} selected. Data synchronized.`;

      VoiceService.speak(msg, language);
    }
  };

  const getWeekDay = (d: number) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const idx = (d + 1) % 7;
    return days[idx];
  };

  // Accurate Port Adjusted Astronomical Times based on dynamic calculations
  const effectiveMoonRise = adjustTimeString(
    astroMoon.moonrise,
    selectedPort.moonOffsetMin + moonRiseOffset
  );
  const effectiveMoonSet = adjustTimeString(
    astroMoon.moonset,
    selectedPort.moonOffsetMin + moonSetOffset
  );
  const effectiveSunRise = adjustTimeString(
    astroSun.sunrise,
    selectedPort.sunOffsetMin
  );
  const effectiveSunSet = adjustTimeString(
    astroSun.sunset,
    selectedPort.sunOffsetMin
  );

  // Theme Colors
  const colors = isNight
    ? {
        bg: '#0A0E17',
        cardBg: '#121A28',
        cardBorder: '#1E293B',
        headerBg: '#121A28',
        headerBorder: '#1E293B',
        textPrimary: '#F1F5F9',
        textSecondary: '#94A3B8',
        accentCyan: '#00E5FF',
        accentBlue: '#0288D1',
        pillBg: '#1E293B',
        tideJuvar: '#00E676',
        tideBhanj: '#FFB300',
        liveVoiceBg: 'rgba(2, 136, 209, 0.18)',
        liveVoiceBorder: '#0288D1',
      }
    : {
        bg: '#F8FAFC',
        cardBg: '#FFFFFF',
        cardBorder: '#E2E8F0',
        headerBg: '#FFFFFF',
        headerBorder: '#E2E8F0',
        textPrimary: '#0F172A',
        textSecondary: '#64748B',
        accentCyan: '#00838F',
        accentBlue: '#0288D1',
        pillBg: '#F1F5F9',
        tideJuvar: '#00C853',
        tideBhanj: '#F57C00',
        liveVoiceBg: 'rgba(2, 136, 209, 0.12)',
        liveVoiceBorder: '#0288D1',
      };

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar style={isNight ? 'light' : 'dark'} animated={true} />

      {/* Screen Header */}
      <View style={[styles.topHeader, { backgroundColor: colors.headerBg, borderBottomColor: colors.headerBorder }]}>
        <BackButton showLabel={false} />

        <View style={styles.titleContainer}>
          <Text style={[styles.screenTitle, { color: colors.textPrimary }]}>
            Juvar–Bhanj Calendar
          </Text>
        </View>

        {/* Right Controls: Voice Toggle & Language Pill */}
        <View style={styles.headerRightControls}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              const next = !voiceEnabled;
              setVoiceEnabled(next);
              SettingsStore.updateSettings({ voiceAnnounce: next });
            }}
            style={[styles.headerVoiceBtn, { backgroundColor: colors.pillBg }]}>
            <Text style={styles.headerVoiceIcon}>{voiceEnabled ? '🔊' : '🔇'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setShowLangPicker(true)}
            style={[styles.headerLangBtn, { backgroundColor: colors.pillBg }]}>
            <Text style={[styles.headerLangText, { color: colors.accentBlue }]}>
              {language === 'Gujarati' ? 'ગુજ' : language === 'Hindi' ? 'हिं' : 'EN'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* 1. PORT SELECTION BAR */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setShowPortModal(true)}
          style={[styles.portBanner, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <View style={styles.portBannerLeft}>
            <View style={styles.portIconBubble}>
              <Text style={styles.portIconText}>⚓</Text>
            </View>
            <View style={styles.portBannerInfo}>
              <Text style={[styles.portLabelText, { color: colors.textSecondary }]}>
                CALIBRATED FISHING PORT:
              </Text>
              <Text style={[styles.portNameText, { color: colors.textPrimary }]}>
                {selectedPort.name} ({selectedPort.nameGu})
              </Text>
              <Text style={[styles.portCoordsText, { color: colors.accentCyan }]}>
                {selectedPort.coords} • High Tide: {selectedPort.highWaterMeters}m
              </Text>
            </View>
          </View>
          <View style={styles.changePortBadge}>
            <Text style={styles.changePortText}>Change ▾</Text>
          </View>
        </TouchableOpacity>

        {/* 2. MONTH HEADER & 30-DAY CALENDAR GRID */}
        <View style={[styles.calendarCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <View style={styles.calendarMonthHeader}>
            <View style={styles.monthTitleRow}>
              <Text style={styles.monthBadgeEmoji}>🌊</Text>
              <Text style={[styles.monthTitleText, { color: colors.textPrimary }]}>
                September 2026
              </Text>
              <View style={styles.marineBadge}>
                <Text style={styles.marineBadgeText}>{selectedPort.name.toUpperCase()} TIDES</Text>
              </View>
            </View>
            <Text style={[styles.monthSubtitle, { color: colors.textSecondary }]}>
              Bhadrapada Shukla / Krishna Paksha • Tithi & Juvar Cycles
            </Text>
          </View>

          {/* Weekday Names Header */}
          <View style={styles.weekDaysRow}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((wDay, idx) => (
              <View key={wDay} style={styles.weekDayCell}>
                <Text
                  style={[
                    styles.weekDayText,
                    { color: idx === 0 || idx === 6 ? '#EF4444' : colors.textSecondary },
                  ]}>
                  {wDay}
                </Text>
              </View>
            ))}
          </View>

          {/* Days Grid */}
          <View style={styles.daysGrid}>
            {DAYS_DATA.map((item, index) => {
              if (!item) {
                return <View key={`empty-${index}`} style={styles.dayCellEmpty} />;
              }

              const isSelected = selectedDay === item.day;
              const isPoonam = item.day === 11;
              const isAmas = item.day === 26;
              const isBaras = item.day === 8 || item.day === 23;
              const isChaudas = item.day === 10 || item.day === 25;

              return (
                <TouchableOpacity
                  key={`day-${item.day}`}
                  activeOpacity={0.7}
                  onPress={() => handleSelectDay(item.day)}
                  style={[
                    styles.dayCell,
                    { backgroundColor: isNight ? '#1E293B' : '#F1F5F9' },
                    isPoonam && styles.dayCellPoonam,
                    isAmas && styles.dayCellAmas,
                    isBaras && styles.dayCellBaras,
                    isChaudas && styles.dayCellChaudas,
                    isSelected && styles.dayCellSelected,
                  ]}>
                  {/* English Date */}
                  <Text
                    style={[
                      styles.dayEnglishNum,
                      { color: colors.textPrimary },
                      (isPoonam || isBaras || isChaudas || isSelected) && styles.dayTextBold,
                    ]}>
                    {item.day.toString().padStart(2, '0')}
                  </Text>

                  {/* Gujarati / Tithi Numeral */}
                  <Text
                    style={[
                      styles.dayTithiNum,
                      { color: colors.accentBlue },
                      (isPoonam || isBaras || isChaudas || isSelected) && styles.dayTextTithiContrast,
                    ]}>
                    {item.tithiNum}
                  </Text>

                  {/* Special Indicator Dot */}
                  {item.isSpecial && (
                    <View
                      style={[
                        styles.specialIndicatorDot,
                        { backgroundColor: isPoonam ? '#F59E0B' : '#10B981' },
                      ]}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Calendar Legend Bar */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>Poonam / Baras</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>Chaudas (Juvar)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#6366F1' }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>Amas (New Moon)</Text>
            </View>
          </View>
        </View>

        {/* 3. SELECTED DATE DETAIL & AUTHENTIC REAL MOON WITH 3D CURVED TERMINATOR */}
        {/* Strictly fixed outer radius (210px x 210px). Inside it, the real moon waxes & wanes! */}
        <View style={[styles.dateDetailCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <View style={styles.detailHeaderRow}>
            <View style={styles.detailHeaderLeft}>
              <Text style={[styles.selectedDateTitle, { color: colors.textPrimary }]}>
                2026-09-{selectedDay.toString().padStart(2, '0')} ({getWeekDay(selectedDay)})
              </Text>
              <Text style={[styles.tithiSubTitle, { color: colors.accentBlue }]}>
                Tithi: {currentDayData.tithiNum} ({currentDayData.tithiName}) •{' '}
                {language === 'Gujarati'
                  ? astroMoon.phaseNameGu
                  : language === 'Hindi'
                  ? astroMoon.phaseNameHi
                  : astroMoon.phaseNameEn}
              </Text>
            </View>

            {/* Tide Condition Badge */}
            <View
              style={[
                styles.tideBadge,
                {
                  backgroundColor:
                    astroMoon.tideType === 'spring'
                      ? 'rgba(16, 185, 129, 0.15)'
                      : astroMoon.tideType === 'neap'
                      ? 'rgba(245, 158, 11, 0.15)'
                      : 'rgba(59, 130, 246, 0.15)',
                  borderColor:
                    astroMoon.tideType === 'spring'
                      ? '#10B981'
                      : astroMoon.tideType === 'neap'
                      ? '#F59E0B'
                      : '#3B82F6',
                },
              ]}>
              <Text
                style={[
                  styles.tideBadgeText,
                  {
                    color:
                      astroMoon.tideType === 'spring'
                        ? '#10B981'
                        : astroMoon.tideType === 'neap'
                        ? '#F59E0B'
                        : '#3B82F6',
                  },
                ]}>
                {astroMoon.tideType === 'spring' ? 'Juvar (Spring)' : astroMoon.tideType === 'neap' ? 'Bhanj (Neap)' : 'Moderate'}
              </Text>
            </View>
          </View>

          {/* PURE AUTHENTIC REAL MOON - DYNAMIC MOON VIEW */}
          <View style={styles.moonStageContainer}>
            <TouchableOpacity
              activeOpacity={0.92}
              onPress={handleTapMoon}
              style={styles.pureMoonTouchable}>
              <DynamicMoonView
                phase={astroMoon.phase}
                illumination={astroMoon.illumination}
                size={MOON_SIZE}
              />
            </TouchableOpacity>

            {/* Illumination & Phase Label */}
            <View style={[styles.moonScalePill, { backgroundColor: colors.pillBg }]}>
              <Text style={[styles.moonScalePillText, { color: colors.textPrimary }]}>
                🌙{' '}
                {language === 'Gujarati'
                  ? astroMoon.phaseNameGu.toUpperCase()
                  : language === 'Hindi'
                  ? astroMoon.phaseNameHi.toUpperCase()
                  : astroMoon.phaseNameEn.toUpperCase()}{' '}
                •{' '}
                <Text style={{ color: colors.accentCyan, fontWeight: '900' }}>
                  {astroMoon.illumination}% ILLUMINATED
                </Text>
              </Text>
            </View>

            {/* Astronomical Moon Metrics: Age, Distance, Size Scale */}
            <View style={styles.astroMetricsRow}>
              <View style={[styles.astroMetricChip, { backgroundColor: colors.pillBg }]}>
                <Text style={[styles.astroMetricLabel, { color: colors.textSecondary }]}>Moon Age</Text>
                <Text style={[styles.astroMetricValue, { color: colors.textPrimary }]}>
                  {astroMoon.moonAgeDays}d
                </Text>
              </View>

              <View style={[styles.astroMetricChip, { backgroundColor: colors.pillBg }]}>
                <Text style={[styles.astroMetricLabel, { color: colors.textSecondary }]}>Distance</Text>
                <Text style={[styles.astroMetricValue, { color: colors.textPrimary }]}>
                  {astroMoon.distanceKm.toLocaleString()} km
                </Text>
              </View>

              <View style={[styles.astroMetricChip, { backgroundColor: colors.pillBg }]}>
                <Text style={[styles.astroMetricLabel, { color: colors.textSecondary }]}>Scale</Text>
                <Text style={[styles.astroMetricValue, { color: colors.accentCyan }]}>
                  {astroMoon.sizeScale}x{astroMoon.distanceKm < 365000 ? ' ⚡Super' : ''}
                </Text>
              </View>
            </View>

            {/* Marine Solunar Tide Advisory Banner */}
            <View
              style={[
                styles.marineTideBanner,
                {
                  backgroundColor:
                    astroMoon.tideType === 'spring'
                      ? 'rgba(16, 185, 129, 0.12)'
                      : astroMoon.tideType === 'neap'
                      ? 'rgba(245, 158, 11, 0.12)'
                      : 'rgba(59, 130, 246, 0.12)',
                  borderColor:
                    astroMoon.tideType === 'spring'
                      ? '#10B981'
                      : astroMoon.tideType === 'neap'
                      ? '#F59E0B'
                      : '#3B82F6',
                },
              ]}>
              <Text
                style={[
                  styles.marineTideBannerTitle,
                  {
                    color:
                      astroMoon.tideType === 'spring'
                        ? '#10B981'
                        : astroMoon.tideType === 'neap'
                        ? '#F59E0B'
                        : '#3B82F6',
                  },
                ]}>
                ⚡ {astroMoon.tideTitleEn}
              </Text>
              <Text style={[styles.marineTideBannerDesc, { color: colors.textSecondary }]}>
                {astroMoon.tideDescEn}
              </Text>
            </View>

            <Text style={[styles.tapHintText, { color: colors.textSecondary }]}>
              Astronomical phase: {(astroMoon.phase * 100).toFixed(0)}% • Tap moon for voice announcement
            </Text>
          </View>
        </View>

        {/* 4. INLINE SUN & MOON ASTRONOMICAL INFO (NO SEPARATE MODAL) */}
        <View style={[styles.astroCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <View style={styles.astroCardHeader}>
            <Text style={styles.astroCardEmoji}>☀️🌙</Text>
            <View style={styles.astroHeaderTexts}>
              <Text style={[styles.astroCardTitle, { color: colors.textPrimary }]}>
                Sun & Moon Port Ephemeris
              </Text>
              <Text style={[styles.astroCardSub, { color: colors.textSecondary }]}>
                {selectedPort.name} ({selectedPort.region}) • Marine Solunar Data
              </Text>
            </View>
          </View>

          {/* 4-Box Astronomical Times Grid */}
          <View style={styles.timesGrid}>
            {/* Sunrise */}
            <View style={[styles.timeBox, { backgroundColor: colors.pillBg }]}>
              <Text style={styles.timeBoxEmoji}>🌅</Text>
              <Text style={[styles.timeBoxLabel, { color: colors.textSecondary }]}>Sunrise</Text>
              <Text style={[styles.timeBoxVal, { color: colors.textPrimary }]}>{effectiveSunRise}</Text>
              <Text style={[styles.timeBoxSub, { color: colors.textSecondary }]}>
                Dawn: {format24to12(astroSun.dawn)}
              </Text>
            </View>

            {/* Sunset */}
            <View style={[styles.timeBox, { backgroundColor: colors.pillBg }]}>
              <Text style={styles.timeBoxEmoji}>🌇</Text>
              <Text style={[styles.timeBoxLabel, { color: colors.textSecondary }]}>Sunset</Text>
              <Text style={[styles.timeBoxVal, { color: colors.textPrimary }]}>{effectiveSunSet}</Text>
              <Text style={[styles.timeBoxSub, { color: colors.textSecondary }]}>
                Dusk: {format24to12(astroSun.dusk)}
              </Text>
            </View>

            {/* Port Moonrise */}
            <View style={[styles.timeBox, { backgroundColor: colors.pillBg }]}>
              <Text style={styles.timeBoxEmoji}>🌙</Text>
              <Text style={[styles.timeBoxLabel, { color: colors.textSecondary }]}>Port Moonrise</Text>
              <Text style={[styles.timeBoxVal, { color: '#F59E0B' }]}>{effectiveMoonRise}</Text>
              <Text style={[styles.timeBoxSub, { color: colors.textSecondary }]}>
                {selectedPort.moonOffsetMin + moonRiseOffset === 0
                  ? 'Base'
                  : `${selectedPort.moonOffsetMin + moonRiseOffset > 0 ? '+' : ''}${selectedPort.moonOffsetMin + moonRiseOffset}m`}
              </Text>
            </View>

            {/* Port Moonset */}
            <View style={[styles.timeBox, { backgroundColor: colors.pillBg }]}>
              <Text style={styles.timeBoxEmoji}>🌘</Text>
              <Text style={[styles.timeBoxLabel, { color: colors.textSecondary }]}>Port Moonset</Text>
              <Text style={[styles.timeBoxVal, { color: '#F59E0B' }]}>{effectiveMoonSet}</Text>
              <Text style={[styles.timeBoxSub, { color: colors.textSecondary }]}>
                {selectedPort.moonOffsetMin + moonSetOffset === 0
                  ? 'Base'
                  : `${selectedPort.moonOffsetMin + moonSetOffset > 0 ? '+' : ''}${selectedPort.moonOffsetMin + moonSetOffset}m`}
              </Text>
            </View>
          </View>

          {/* Solunar Peak Feeding Transits */}
          <View style={styles.solunarRow}>
            <View style={[styles.solunarBox, { backgroundColor: colors.pillBg }]}>
              <Text style={[styles.solunarBoxTitle, { color: colors.accentBlue }]}>
                🐟 Overhead Transit
              </Text>
              <Text style={[styles.solunarBoxVal, { color: colors.textPrimary }]}>
                {format24to12(astroMoon.overhead)}
              </Text>
              <Text style={[styles.solunarBoxDesc, { color: colors.textSecondary }]}>
                Major Solunar Feed Peak
              </Text>
            </View>

            <View style={[styles.solunarBox, { backgroundColor: colors.pillBg }]}>
              <Text style={[styles.solunarBoxTitle, { color: colors.accentCyan }]}>
                ⚓ Underfoot Transit
              </Text>
              <Text style={[styles.solunarBoxVal, { color: colors.textPrimary }]}>
                {format24to12(astroMoon.underfoot)}
              </Text>
              <Text style={[styles.solunarBoxDesc, { color: colors.textSecondary }]}>
                Secondary Feed Window
              </Text>
            </View>
          </View>

          {/* Golden Hour & Daylight Hours */}
          <View style={[styles.portTideCard, { backgroundColor: colors.pillBg }]}>
            <Text style={styles.portTideTitle}>☀️ Solar Angle & Daylight:</Text>
            <Text style={[styles.portTideDesc, { color: colors.textPrimary }]}>
              Daylight: {astroSun.daylightHours}h {astroSun.daylightMinutes}m • Golden Hour: {format24to12(astroSun.goldenHour)} • Solar Noon: {format24to12(astroSun.solarNoon)} (Angle {astroSun.sunAngleDeg}°)
            </Text>
          </View>

          {/* Port Tidal Characteristics Banner */}
          <View style={[styles.portTideCard, { backgroundColor: colors.pillBg }]}>
            <Text style={styles.portTideTitle}>🌊 Tidal Hydrography for {selectedPort.name}:</Text>
            <Text style={[styles.portTideDesc, { color: colors.textPrimary }]}>
              {selectedPort.tideCharacteristics}
            </Text>
          </View>

          {/* Interactive Port Local Offset Calibrations */}
          <View style={styles.offsetControlSection}>
            <Text style={[styles.offsetSectionTitle, { color: colors.textPrimary }]}>
              Manual Local Fine Calibration (Minutes)
            </Text>

            {/* Moonrise Offset Row */}
            <View style={styles.offsetRow}>
              <Text style={[styles.offsetRowLabel, { color: colors.textSecondary }]}>
                Moonrise Offset:
              </Text>
              <View style={styles.offsetButtonsGroup}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setMoonRiseOffset((prev) => prev - 5)}
                  style={[styles.offsetStepBtn, { backgroundColor: colors.pillBg }]}>
                  <Text style={[styles.offsetStepText, { color: colors.textPrimary }]}>-5m</Text>
                </TouchableOpacity>

                <Text style={[styles.offsetValueDisplay, { color: colors.accentBlue }]}>
                  {moonRiseOffset > 0 ? `+${moonRiseOffset}` : moonRiseOffset} min
                </Text>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setMoonRiseOffset((prev) => prev + 5)}
                  style={[styles.offsetStepBtn, { backgroundColor: colors.pillBg }]}>
                  <Text style={[styles.offsetStepText, { color: colors.textPrimary }]}>+5m</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Moonset Offset Row */}
            <View style={styles.offsetRow}>
              <Text style={[styles.offsetRowLabel, { color: colors.textSecondary }]}>
                Moonset Offset:
              </Text>
              <View style={styles.offsetButtonsGroup}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setMoonSetOffset((prev) => prev - 5)}
                  style={[styles.offsetStepBtn, { backgroundColor: colors.pillBg }]}>
                  <Text style={[styles.offsetStepText, { color: colors.textPrimary }]}>-5m</Text>
                </TouchableOpacity>

                <Text style={[styles.offsetValueDisplay, { color: colors.accentBlue }]}>
                  {moonSetOffset > 0 ? `+${moonSetOffset}` : moonSetOffset} min
                </Text>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setMoonSetOffset((prev) => prev + 5)}
                  style={[styles.offsetStepBtn, { backgroundColor: colors.pillBg }]}>
                  <Text style={[styles.offsetStepText, { color: colors.textPrimary }]}>+5m</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Reset Offsets Button */}
            {(moonRiseOffset !== 0 || moonSetOffset !== 0) && (
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => {
                  setMoonRiseOffset(0);
                  setMoonSetOffset(0);
                }}
                style={[styles.resetOffsetBtn, { backgroundColor: colors.pillBg }]}>
                <Text style={[styles.resetOffsetText, { color: colors.accentBlue }]}>
                  ↺ Reset Calibration
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>

      {/* PORT SELECTOR MODAL */}
      <Modal visible={showPortModal} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setShowPortModal(false)}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback>
              <View style={[styles.portPickerCard, { backgroundColor: colors.cardBg }]}>
                <View style={styles.portModalHeader}>
                  <Text style={[styles.portPickerTitle, { color: colors.textPrimary }]}>
                    ⚓ Select Coastal Fishing Port
                  </Text>
                  <Text style={[styles.portPickerSub, { color: colors.textSecondary }]}>
                    Choose port for accurate astronomical times & tides
                  </Text>
                </View>

                <ScrollView style={styles.portListScroll} showsVerticalScrollIndicator={false}>
                  {COASTAL_PORTS.map((p) => {
                    const isSelected = selectedPort.id === p.id;
                    return (
                      <TouchableOpacity
                        key={p.id}
                        activeOpacity={0.7}
                        onPress={() => handleSelectPort(p)}
                        style={[
                          styles.portListItem,
                          isSelected && { backgroundColor: isNight ? '#1E293B' : '#E0F7FA' },
                        ]}>
                        <View style={styles.portListItemLeft}>
                          <Text style={styles.portListEmoji}>⚓</Text>
                          <View style={styles.portListDetails}>
                            <Text
                              style={[
                                styles.portListName,
                                { color: isSelected ? colors.accentBlue : colors.textPrimary },
                              ]}>
                              {p.name} ({p.nameGu})
                            </Text>
                            <Text style={[styles.portListCoords, { color: colors.textSecondary }]}>
                              {p.coords} • {p.region}
                            </Text>
                            <Text style={[styles.portListTide, { color: colors.accentCyan }]}>
                              {p.tideCharacteristics}
                            </Text>
                          </View>
                        </View>
                        {isSelected && (
                          <Text style={[styles.portCheckmark, { color: colors.accentBlue }]}>✓</Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setShowPortModal(false)}
                  style={[styles.modalCloseBtn, { backgroundColor: colors.pillBg }]}>
                  <Text style={[styles.modalCloseText, { color: colors.textPrimary }]}>Done</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* LANGUAGE SELECTOR MODAL */}
      <Modal visible={showLangPicker} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowLangPicker(false)}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback>
              <View style={[styles.langPickerCard, { backgroundColor: colors.cardBg }]}>
                <Text style={[styles.langPickerTitle, { color: colors.textPrimary }]}>
                  🌐 Select Voice Language
                </Text>

                {(['English', 'Gujarati', 'Hindi'] as SpeechLanguage[]).map((l) => (
                  <TouchableOpacity
                    key={l}
                    activeOpacity={0.7}
                    onPress={() => {
                      setLanguage(l);
                      SettingsStore.updateSettings({ ttsLang: l });
                      VoiceService.setLanguage(l);
                      setShowLangPicker(false);
                      VoiceService.speak(
                        l === 'Gujarati'
                          ? 'ગુજરાતી અવાજ સક્રિય કર્યો'
                          : l === 'Hindi'
                          ? 'हिंदी आवाज़ सक्रिय की गई'
                          : 'English voice activated',
                        l
                      );
                    }}
                    style={[
                      styles.langPickerOption,
                      language === l && { backgroundColor: isNight ? '#1E293B' : '#E0F7FA' },
                    ]}>
                    <Text
                      style={[
                        styles.langPickerOptionText,
                        { color: language === l ? colors.accentBlue : colors.textPrimary },
                      ]}>
                      {l === 'Gujarati'
                        ? 'ગુજરાતી (Gujarati)'
                        : l === 'Hindi'
                        ? 'हिंदी (Hindi)'
                        : 'English'}
                    </Text>
                    {language === l && (
                      <Text style={[styles.langCheckmark, { color: colors.accentBlue }]}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setShowLangPicker(false)}
                  style={[styles.modalCloseBtn, { backgroundColor: colors.pillBg }]}>
                  <Text style={[styles.modalCloseText, { color: colors.textPrimary }]}>Done</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  headerRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerVoiceBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerVoiceIcon: {
    fontSize: 16,
  },
  headerLangBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLangText: {
    fontSize: 12,
    fontWeight: '900',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 14,
  },
  portBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  portBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  portIconBubble: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#0288D1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  portIconText: {
    fontSize: 18,
  },
  portBannerInfo: {
    flex: 1,
    gap: 2,
  },
  portLabelText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  portNameText: {
    fontSize: 15,
    fontWeight: '900',
  },
  portCoordsText: {
    fontSize: 11,
    fontWeight: '700',
  },
  changePortBadge: {
    backgroundColor: '#0288D1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  changePortText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  calendarCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    gap: 12,
  },
  calendarMonthHeader: {
    gap: 4,
  },
  monthTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  monthBadgeEmoji: {
    fontSize: 18,
  },
  monthTitleText: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  marineBadge: {
    backgroundColor: '#00E676',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  marineBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#052E16',
    letterSpacing: 0.5,
  },
  monthSubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  weekDaysRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.15)',
    paddingBottom: 6,
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '800',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  dayCellEmpty: {
    width: (SCREEN_WIDTH - 64 - 30) / 7,
    height: 48,
  },
  dayCell: {
    width: (SCREEN_WIDTH - 64 - 30) / 7,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dayCellSelected: {
    borderColor: '#0288D1',
    borderWidth: 2,
    backgroundColor: '#E0F7FA',
    shadowColor: '#0288D1',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  dayCellPoonam: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  dayCellAmas: {
    backgroundColor: '#E0E7FF',
    borderColor: '#6366F1',
  },
  dayCellBaras: {
    backgroundColor: '#FEF9C3',
    borderColor: '#EAB308',
  },
  dayCellChaudas: {
    backgroundColor: '#D1FAE5',
    borderColor: '#10B981',
  },
  dayEnglishNum: {
    fontSize: 13,
    fontWeight: '700',
  },
  dayTithiNum: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: -1,
  },
  dayTextBold: {
    fontWeight: '900',
    color: '#0F172A',
  },
  dayTextTithiContrast: {
    color: '#0369A1',
    fontWeight: '900',
  },
  specialIndicatorDot: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.1)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '600',
  },
  dateDetailCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  detailHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  detailHeaderLeft: {
    flex: 1,
    gap: 2,
  },
  selectedDateTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  tithiSubTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  tideBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  tideBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  moonStageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 14,
  },
  pureMoonTouchable: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moonViewContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  moonAtmosphericHalo: {
    position: 'absolute',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 18,
    elevation: 10,
    backgroundColor: 'transparent',
  },
  moonDisk: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  moonImage: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  fineLimbRim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1,
  },
  totalAmasShadow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: MOON_RADIUS,
    backgroundColor: 'rgba(4, 7, 17, 0.95)',
  },
  terminatorWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: MOON_RADIUS,
    overflow: 'hidden',
  },
  leftHalfShadow: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: MOON_RADIUS,
    backgroundColor: '#040711',
  },
  rightCrescentShadow: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: MOON_RADIUS,
    backgroundColor: '#040711',
  },
  rightHalfShadow: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: MOON_RADIUS,
    backgroundColor: '#040711',
  },
  leftCrescentShadow: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: MOON_RADIUS,
    backgroundColor: '#040711',
  },
  leftHalfShadowContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: MOON_RADIUS,
    backgroundColor: '#040711',
    overflow: 'hidden',
  },
  leftBulgeLitContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    overflow: 'hidden',
  },
  rightHalfShadowContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: MOON_RADIUS,
    backgroundColor: '#040711',
    overflow: 'hidden',
  },
  rightBulgeLitContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    overflow: 'hidden',
  },
  fixedGlassRim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: MOON_RADIUS,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  moonScalePill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moonScalePillText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tapHintText: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  astroMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 8,
  },
  astroMetricChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 12,
  },
  astroMetricLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  astroMetricValue: {
    fontSize: 13,
    fontWeight: '900',
    marginTop: 2,
  },
  marineTideBanner: {
    width: '100%',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  marineTideBannerTitle: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  marineTideBannerDesc: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500',
  },
  solunarRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  solunarBox: {
    flex: 1,
    padding: 10,
    borderRadius: 12,
    gap: 2,
  },
  solunarBoxTitle: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  solunarBoxVal: {
    fontSize: 13,
    fontWeight: '900',
  },
  solunarBoxDesc: {
    fontSize: 10,
    fontWeight: '500',
  },
  astroCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  astroCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  astroCardEmoji: {
    fontSize: 24,
  },
  astroHeaderTexts: {
    flex: 1,
    gap: 2,
  },
  astroCardTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  astroCardSub: {
    fontSize: 11,
    fontWeight: '500',
  },
  timesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeBox: {
    flexBasis: '48%',
    flexGrow: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    gap: 3,
  },
  timeBoxEmoji: {
    fontSize: 20,
  },
  timeBoxLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  timeBoxVal: {
    fontSize: 14,
    fontWeight: '900',
  },
  timeBoxSub: {
    fontSize: 10,
    fontWeight: '600',
  },
  portTideCard: {
    padding: 10,
    borderRadius: 12,
    gap: 4,
  },
  portTideTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0288D1',
  },
  portTideDesc: {
    fontSize: 12,
    fontWeight: '600',
  },
  offsetControlSection: {
    gap: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.12)',
  },
  offsetSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  offsetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  offsetRowLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  offsetButtonsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  offsetStepBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.2)',
  },
  offsetStepText: {
    fontSize: 12,
    fontWeight: '800',
  },
  offsetValueDisplay: {
    fontSize: 13,
    fontWeight: '900',
    minWidth: 54,
    textAlign: 'center',
  },
  resetOffsetBtn: {
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 4,
  },
  resetOffsetText: {
    fontSize: 12,
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  portPickerCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '80%',
    borderRadius: 20,
    padding: 18,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },
  portModalHeader: {
    gap: 2,
    paddingBottom: 4,
  },
  portPickerTitle: {
    fontSize: 17,
    fontWeight: '900',
  },
  portPickerSub: {
    fontSize: 12,
    fontWeight: '500',
  },
  portListScroll: {
    maxHeight: 340,
  },
  portListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  portListItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  portListEmoji: {
    fontSize: 20,
  },
  portListDetails: {
    flex: 1,
    gap: 1,
  },
  portListName: {
    fontSize: 14,
    fontWeight: '800',
  },
  portListCoords: {
    fontSize: 11,
    fontWeight: '600',
  },
  portListTide: {
    fontSize: 10,
    fontWeight: '700',
  },
  portCheckmark: {
    fontSize: 18,
    fontWeight: '900',
    marginLeft: 8,
  },
  modalCloseBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  modalCloseText: {
    fontSize: 14,
    fontWeight: '800',
  },
  langPickerCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    padding: 20,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  langPickerTitle: {
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 4,
  },
  langPickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  langPickerOptionText: {
    fontSize: 15,
    fontWeight: '700',
  },
  langCheckmark: {
    fontSize: 16,
    fontWeight: '900',
  },
});
