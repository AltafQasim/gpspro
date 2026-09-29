import { BackButton } from '@/components/ui/back-button';
import {
  getCalculatedTideEventsForDate,
  MARINE_PORTS_DATABASE,
  MarinePortInfo,
} from '@/services/marineData';
import { SettingsStore } from '@/services/settingsStore';
import { VoiceService } from '@/services/voiceService';
import { getMoonPhaseDetails, getSunTimingDetails } from '@/utils/astronomy';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View
} from 'react-native';
import { GpsService, calculateDistanceKm } from '@/services/gpsService';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  LinearGradient,
  Path,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TRANSLATIONS = {
  English: {
    screenTitle: 'Tide & Water Level',
    port: 'Port:',
    selectPort: 'Select Port',
    language: 'Language:',
    selectLanguage: 'Select Language',
    openSunMoon: '🌙 Solar & Lunar Astrological Info',
    tideTable: '📊 Tide Table (High / Low Events)',
    highTide: 'High tide at',
    lowTide: 'Low tide at',
    fishingAdvice: 'Optimal Fishing Window',
    optimalAdviceText: 'Best boat netting & reef fishing: 2 hours before High Tide (Slack water change).',
    tideGraph: '24-HOUR TIDAL WAVE (METERS)',
    currentWaterLevel: 'Live Level',
    rising: 'WATER RISING (FLOOD)',
    falling: 'WATER RECEDING (EBB)',
    slack: 'SLACK WATER (TURN)',
    tideMeterTitle: 'LIVE TIDE METER',
    scrubHint: '👆 Touch & drag across chart to inspect 24-hr water levels',
    resetToLive: 'Reset to Live Time',
    selectedTime: 'Selected Time',
    liveTime: 'Current Live Time',
    waterDepth: 'Water Height',
    flowRate: 'Flow Rate',
    maxScale: '3.5m (Spring High)',
    minScale: '0.0m (Zero Datum)',
    calibratedPort: 'CALIBRATED FISHING PORT:',
    changePort: 'Change ▾',
    listenVoice: 'Listen Tide Voice Announcement',
    stopVoice: 'Stop Voice Announcement',
    langSubtitle: 'Language: English',
    tideTableSubtitle: '👆 Tap any High or Low tide to hear voice announcement & view on meter',
    tapToSpeak: 'Tap to speak',
    speaking: 'Speaking...',
  },
  Gujarati: {
    screenTitle: 'ભરતી-ઓટ અને જળસ્તર',
    port: 'બંદર (Port):',
    selectPort: 'બંદર પસંદ કરો',
    language: 'ભાષા (Language):',
    selectLanguage: 'ભાષા પસંદ કરો',
    openSunMoon: '🌙 સૂર્ય-ચંદ્ર અને નક્ષત્ર માહિતી',
    tideTable: '📊 ભરતી-ઓટ પત્રક (Tide Table)',
    highTide: 'ભરતી (High tide)',
    lowTide: 'ઓટ (Low tide)',
    fishingAdvice: 'માછીમારી માટે ઉત્તમ સમય',
    optimalAdviceText: 'ભરતી ચઢવાના ૨ કલાક પહેલા માછલી પકડવા અને જાળ નાખવા માટે સૌથી શ્રેષ્ઠ સમય છે.',
    tideGraph: '૨૪ કલાકની ભરતી મોજાં (ઊંચાઈ મીટરમાં)',
    currentWaterLevel: 'હાલનું જળસ્તર',
    rising: 'ભરતી ચાલુ છે (પાણી ચઢે છે)',
    falling: 'ઓટ ચાલુ છે (પાણી ઉતરે છે)',
    slack: 'સ્થિર પાણી (Slack Water)',
    tideMeterTitle: 'લાઈવ ટાઈડ મીટર (જળસ્તર માપક)',
    scrubHint: '👆 ચાર્ટ પર ટચ/સ્ક્રોલ કરીને ૨૪ કલાકનું જળસ્તર જુઓ',
    resetToLive: 'હાલના સમય પર લાવો',
    selectedTime: 'પસંદ કરેલ સમય',
    liveTime: 'હાલનો લાઈવ સમય',
    waterDepth: 'પાણીની ઊંચાઈ',
    flowRate: 'પાણીનો પ્રવાહ',
    maxScale: '૩.૫ મીટર (મોટી ભરતી)',
    minScale: '૦.૦ મીટર (તળિયું)',
    calibratedPort: 'પસંદ કરેલ ફિશિંગ બંદર:',
    changePort: 'બદલો ▾',
    listenVoice: 'ભરતી-ઓટ જાહેરાત સાંભળો (Voice)',
    stopVoice: 'અવાજ બંધ કરો (Stop)',
    langSubtitle: 'ભાષા: ગુજરાતી (ડિફોલ્ટ)',
    tideTableSubtitle: '👆 ભરતી કે ઓટ પર ટચ કરો — અવાજમાં સાંભળવા અને મીટરમાં જોવા માટે',
    tapToSpeak: 'સાંભળો',
    speaking: 'બોલે છે...',
  },
  Hindi: {
    screenTitle: 'ज्वार-भाटा एवं जलस्तर',
    port: 'बंदरगाह (Port):',
    selectPort: 'बंदरगाह चुनें',
    language: 'भाषा (Language):',
    selectLanguage: 'भाषा चुनें',
    openSunMoon: '🌙 सूर्य-चंद्रमा एवं नक्षत्र जानकारी',
    tideTable: '📊 ज्वार-भाटा तालिका (Tide Table)',
    highTide: 'ज्वार (High tide)',
    lowTide: 'भाटा (Low tide)',
    fishingAdvice: 'मछली पकड़ने का सर्वोत्तम समय',
    optimalAdviceText: 'उच्च ज्वार से २ घंटे पहले मछली पकड़ने और जाल डालने का सबसे अच्छा समय।',
    tideGraph: '२४ घंटे का ज्वार तरंग ग्राफ (मीटर)',
    currentWaterLevel: 'वर्तमान जलस्तर',
    rising: 'पानी चढ़ रहा है (Flood)',
    falling: 'पानी उतर रहा है (Ebb)',
    slack: 'स्थिर जल (Slack Water)',
    tideMeterTitle: 'लाइव टाइड मीटर (जलस्तर गेज)',
    scrubHint: '👆 चार्ट पर टच/स्क्रोल करके २४ घंटे का जलस्तर देखें',
    resetToLive: 'वर्तमान समय पर लाएं',
    selectedTime: 'चुना हुआ समय',
    liveTime: 'वर्तमान लाइव समय',
    waterDepth: 'पानी की ऊंचाई',
    flowRate: 'प्रवाह दर',
    maxScale: '३.५ मीटर (उच्च ज्वार)',
    minScale: '०.० मीटर (शून्य तल)',
    calibratedPort: 'चुना हुआ बंदरगाह:',
    changePort: 'बदलें ▾',
    listenVoice: 'ज्वार-भाटा घोषणा सुनें (Voice)',
    stopVoice: 'आवाज़ बंद करें (Stop)',
    langSubtitle: 'भाषा: हिंदी',
    tideTableSubtitle: '👆 किसी भी ज्वार या भाटा पर टैप करें — आवाज़ में सुनने और मीटर में देखने के लिए',
    tapToSpeak: 'सुनें',
    speaking: 'बोल रहा है...',
  },
};

// ----------------- Tidal Interpolation Helper Math -----------------

interface TideEventPoint {
  hour: number;
  height: number;
  type: 'high' | 'low';
}

function parseTimeToDecimalHour(timeStr: string): number {
  const clean = timeStr.trim().toLowerCase();
  const isPM = clean.includes('pm');
  const isAM = clean.includes('am');
  const timePart = clean.replace(/(am|pm)/g, '').trim();
  const [hStr, mStr] = timePart.split(':');
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr || '0', 10);
  if (isPM && h < 12) h += 12;
  if (isAM && h === 12) h = 0;
  return h + m / 60;
}

function formatDecimalHourToTime(hourVal: number): string {
  let normalized = hourVal % 24;
  if (normalized < 0) normalized += 24;
  const totalMinutes = Math.round(normalized * 60) % 1440;
  const hours24 = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const displayHour = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const mm = minutes < 10 ? `0${minutes}` : `${minutes}`;
  const hh = displayHour < 10 ? `0${displayHour}` : `${displayHour}`;
  return `${hh}:${mm} ${period}`;
}

function getTideHeightAtHour(
  targetHour: number,
  events: { type: 'high' | 'low'; time: string; height: number }[]
): { height: number; rate: number; isRising: boolean } {
  if (!events || events.length === 0) {
    return { height: 1.5, rate: 0, isRising: true };
  }

  const parsed: TideEventPoint[] = events
    .map((e) => ({
      hour: parseTimeToDecimalHour(e.time),
      height: e.height,
      type: e.type,
    }))
    .sort((a, b) => a.hour - b.hour);

  const first = parsed[0];
  const second = parsed[1] || { hour: first.hour + 6.2, height: first.height > 1.5 ? 0.7 : 2.0, type: 'low' };
  const last = parsed[parsed.length - 1];
  const secondLast = parsed[parsed.length - 2] || { hour: last.hour - 6.2, height: last.height > 1.5 ? 0.7 : 2.0, type: 'low' };

  const wrapCycleDelta = Math.max(5.5, 24 - last.hour + first.hour);

  const virtualBefore: TideEventPoint = {
    hour: first.hour - wrapCycleDelta,
    height: last.type !== first.type ? last.height : second.height,
    type: first.type === 'high' ? 'low' : 'high',
  };

  const virtualAfter: TideEventPoint = {
    hour: last.hour + wrapCycleDelta,
    height: first.type !== last.type ? first.height : secondLast.height,
    type: last.type === 'high' ? 'low' : 'high',
  };

  const virtualAfter2: TideEventPoint = {
    hour: virtualAfter.hour + Math.max(5.5, second.hour - first.hour),
    height: second.height,
    type: second.type,
  };

  const timeline = [virtualBefore, ...parsed, virtualAfter, virtualAfter2];

  let a = timeline[0];
  let b = timeline[1];
  for (let i = 0; i < timeline.length - 1; i++) {
    if (targetHour >= timeline[i].hour && targetHour <= timeline[i + 1].hour) {
      a = timeline[i];
      b = timeline[i + 1];
      break;
    }
  }

  const dt = b.hour - a.hour;
  if (dt <= 0) {
    return { height: a.height, rate: 0, isRising: true };
  }

  const fraction = (targetHour - a.hour) / dt;
  const theta = fraction * Math.PI;

  const height = (a.height + b.height) / 2 + ((a.height - b.height) / 2) * Math.cos(theta);
  const rate = -((a.height - b.height) / 2) * (Math.PI / dt) * Math.sin(theta);
  const isRising = rate >= 0;

  return { height, rate, isRising };
}

const CHART_HEIGHT = 200;
const PADDING_TOP = 26;
const PADDING_BOTTOM = 26;
const MIN_SCALE = 0.0;

function heightToY(h: number, chartH: number = 200, maxScale: number = 3.5): number {
  const usable = chartH - PADDING_TOP - PADDING_BOTTOM;
  const clamped = Math.max(MIN_SCALE, Math.min(maxScale, h));
  return PADDING_TOP + (1 - (clamped - MIN_SCALE) / (maxScale - MIN_SCALE)) * usable;
}

const getTodayDateStr = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export default function TideScreen() {
  const router = useRouter();

  // App Theme & Night Mode Subscription
  const [isNight, setIsNight] = useState<boolean>(() => SettingsStore.isNightMode());
  const [selectedPortId, setSelectedPortId] = useState<string>(() => SettingsStore.getSelectedPortId());

  useEffect(() => {
    const unsub = SettingsStore.subscribe((s) => {
      setIsNight(SettingsStore.isNightMode());
      if (s.selectedPortId && s.selectedPortId !== selectedPortId) {
        setSelectedPortId(s.selectedPortId);
      }
    });
    return unsub;
  }, [selectedPortId]);

  // State: Default language is Gujarati, Default date is today's real local date
  const [selectedLang, setSelectedLang] = useState<'Gujarati' | 'Hindi' | 'English'>('Gujarati');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateStr);
  const [showPortModal, setShowPortModal] = useState<boolean>(false);
  const [showLangModal, setShowLangModal] = useState<boolean>(false);
  const [showSunMoonModal, setShowSunMoonModal] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [activeEventIdx, setActiveEventIdx] = useState<number | null>(null);

  // Live GPS Coordinates for computing real-time distance (km) to all ports
  const [currentGps, setCurrentGps] = useState<{ latitude: number; longitude: number } | null>(null);
  const [portSearchText, setPortSearchText] = useState<string>('');

  useEffect(() => {
    const cached = GpsService.getLastTelemetry();
    if (cached) {
      setCurrentGps({ latitude: cached.latitude, longitude: cached.longitude });
    }
    GpsService.getCurrentLocationAsync().then((loc) => {
      if (loc) {
        setCurrentGps({ latitude: loc.latitude, longitude: loc.longitude });
      }
    });
  }, []);

  // Filtered & Distance-Sorted Ports List for the Modal Dropdown
  const filteredAndSortedPorts = useMemo(() => {
    const query = portSearchText.trim().toLowerCase();
    const list = MARINE_PORTS_DATABASE.map((p) => {
      const distanceKm = currentGps
        ? calculateDistanceKm(currentGps.latitude, currentGps.longitude, p.lat, p.lon)
        : null;
      return { ...p, distanceKm };
    });

    const filtered = query
      ? list.filter(
          (p) =>
            p.name.toLowerCase().includes(query) ||
            p.nameGu.toLowerCase().includes(query) ||
            (p.nameHi && p.nameHi.toLowerCase().includes(query)) ||
            p.region.toLowerCase().includes(query) ||
            p.regionGu.toLowerCase().includes(query) ||
            p.id.toLowerCase().includes(query)
        )
      : list;

    if (currentGps) {
      return [...filtered].sort((a, b) => (a.distanceKm ?? 99999) - (b.distanceKm ?? 99999));
    }
    return filtered;
  }, [portSearchText, currentGps]);

  // Dynamic Responsive Dimensions for All Devices (Small phones, Foldables, Tablets, Web)
  const { width: windowWidth } = useWindowDimensions();
  const isSmallDevice = windowWidth < 360;
  const isTablet = windowWidth >= 768;
  const responsivePadding = isSmallDevice ? 10 : windowWidth < 480 ? 12 : 16;
  const chartHeight = isSmallDevice ? 180 : isTablet ? 230 : 200;
  const fallbackChartWidth = Math.max(260, Math.min(windowWidth - (responsivePadding * 2) - (isSmallDevice ? 20 : 32), 680));

  // Responsive Chart Width & Scrubbing
  const [chartWidth, setChartWidth] = useState<number>(fallbackChartWidth);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [scrubHour, setScrubHour] = useState<number | null>(null);

  useEffect(() => {
    setChartWidth(fallbackChartWidth);
  }, [fallbackChartWidth]);

  const t = TRANSLATIONS[selectedLang];
  const port: MarinePortInfo =
    MARINE_PORTS_DATABASE.find((p) => p.id === selectedPortId) || MARINE_PORTS_DATABASE[0];

  // 100% Accurate date-shifted and port-calibrated tide events
  const dailyEvents = useMemo(
    () => getCalculatedTideEventsForDate(selectedPortId, selectedDate),
    [selectedPortId, selectedDate]
  );

  // Accurate Astronomical Solar and Lunar Data for Port & Date
  const astroDate = useMemo(() => new Date(`${selectedDate}T12:00:00Z`), [selectedDate]);
  const moonInfo = useMemo(
    () => getMoonPhaseDetails(astroDate, port.lat, port.lon),
    [astroDate, port.lat, port.lon]
  );
  const sunInfo = useMemo(
    () => getSunTimingDetails(astroDate, port.lat, port.lon),
    [astroDate, port.lat, port.lon]
  );

  // Current real-time clock decimal hour (updates automatically every 20s)
  const [liveClock, setLiveClock] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setLiveClock(new Date()), 20000);
    return () => clearInterval(timer);
  }, []);
  const currentLiveHour = liveClock.getHours() + liveClock.getMinutes() / 60 + liveClock.getSeconds() / 3600;

  // Active hour: user-scrubbed hour if active, else current live hour
  const isScrubbing = scrubHour !== null;
  const activeHour = isScrubbing ? scrubHour : currentLiveHour;
  const { height: activeHeight, rate: activeRate, isRising } = useMemo(
    () => getTideHeightAtHour(activeHour, dailyEvents),
    [activeHour, dailyEvents]
  );
  const activeTimeStr = useMemo(() => formatDecimalHourToTime(activeHour), [activeHour]);

  // Next tidal event for voice briefing
  const nextEvent = useMemo(() => {
    return (
      dailyEvents.find((e) => {
        const h = parseTimeToDecimalHour(e.time);
        return h > activeHour;
      }) || dailyEvents[0]
    );
  }, [dailyEvents, activeHour]);

  // Voice Announcement Function (Gujarati default, Hindi, English)
  const handleToggleVoiceAnnouncement = () => {
    if (isSpeaking) {
      VoiceService.stop();
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);

    const nextGu = nextEvent
      ? `આગામી ${nextEvent.type === 'high' ? 'ભરતી' : 'ઓટ'} ${nextEvent.time} વાગ્યે ${nextEvent.height.toFixed(2)} મીટર રહેશે`
      : '';
    const nextHi = nextEvent
      ? `अगली ${nextEvent.type === 'high' ? 'उच्च ज्वार' : 'भाटा'} ${nextEvent.time} पर ${nextEvent.height.toFixed(2)} मीटर होगी`
      : '';
    const nextEn = nextEvent
      ? `Next ${nextEvent.type === 'high' ? 'high tide' : 'low tide'} at ${nextEvent.time} with ${nextEvent.height.toFixed(2)} meters`
      : '';

    VoiceService.announceTide({
      portNameEn: port.name,
      portNameGu: port.nameGu,
      portNameHi: port.nameHi,
      height: activeHeight,
      isRising: isRising,
      timeStr: activeTimeStr,
      nextEventTextGu: nextGu,
      nextEventTextHi: nextHi,
      nextEventTextEn: nextEn,
      lang: selectedLang,
    });

    setTimeout(() => {
      setIsSpeaking(false);
    }, 8500);
  };

  // Dynamic Maximum Scale for Harbor Chart (e.g. Mandvi up to 6.5m, Okha 4.0m, Veraval 3.5m)
  const maxScale = useMemo(() => {
    return Math.max(3.5, Math.ceil(port.highSpringMax * 1.05 * 2) / 2);
  }, [port.highSpringMax]);

  const gridSteps = useMemo(() => {
    const steps: number[] = [];
    const stepSize = maxScale > 4 ? 1.0 : 0.5;
    for (let s = stepSize; s < maxScale; s += stepSize) {
      steps.push(parseFloat(s.toFixed(1)));
    }
    return steps;
  }, [maxScale]);

  // 5-Day Tidal Tabs Strip for quick navigation across 5 days
  const fiveDayTabs = useMemo(() => {
    const tabs: {
      dateStr: string;
      dayLabel: string;
      dateFormatted: string;
      moonIcon: string;
      tideType: string;
      tideBadgeBg: string;
      tideTextColor: string;
    }[] = [];
    const baseNow = new Date();
    const dayNamesEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayNamesGu = ['રવિ', 'સોમ', 'મંગળ', 'બુધ', 'ગુરુ', 'શુક્ર', 'શનિ'];
    const dayNamesHi = ['रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि'];
    const monthNamesEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthNamesGu = ['જાન્યુ', 'ફેબ્રુ', 'માર્ચ', 'એપ્રિલ', 'મે', 'જૂન', 'જુલાઈ', 'ઓગસ્ટ', 'સપ્ટે', 'ઓક્ટો', 'નવે', 'ડિસે'];
    const monthNamesHi = ['जन', 'फर', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितं', 'अक्टू', 'नव', 'दिसं'];

    for (let i = 0; i < 5; i++) {
      const d = new Date(baseNow);
      d.setDate(baseNow.getDate() + i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dayNum = String(d.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${dayNum}`;

      const dayIdx = d.getDay();
      let dayLabel = '';
      if (i === 0) {
        dayLabel = selectedLang === 'Gujarati' ? 'આજે' : selectedLang === 'Hindi' ? 'आज' : 'Today';
      } else if (i === 1) {
        dayLabel = selectedLang === 'Gujarati' ? 'આવતીકાલે' : selectedLang === 'Hindi' ? 'कल' : 'Tomorrow';
      } else {
        dayLabel = selectedLang === 'Gujarati' ? dayNamesGu[dayIdx] : selectedLang === 'Hindi' ? dayNamesHi[dayIdx] : dayNamesEn[dayIdx];
      }

      const mName = selectedLang === 'Gujarati' ? monthNamesGu[d.getMonth()] : selectedLang === 'Hindi' ? monthNamesHi[d.getMonth()] : monthNamesEn[d.getMonth()];
      const dateFormatted = `${d.getDate()} ${mName}`;

      const dayAstro = getMoonPhaseDetails(new Date(y, d.getMonth(), d.getDate(), 12, 0, 0), port.lat, port.lon);
      const moonIcon = dayAstro.phase < 0.06 || dayAstro.phase >= 0.94 ? '🌑' :
        dayAstro.phase < 0.22 ? '🌒' :
        dayAstro.phase < 0.28 ? '🌓' :
        dayAstro.phase < 0.47 ? '🌔' :
        dayAstro.phase < 0.53 ? '🌕' :
        dayAstro.phase < 0.72 ? '🌖' :
        dayAstro.phase < 0.78 ? '🌗' : '🌘';

      const isSpring = dayAstro.tideType === 'spring';
      const isNeap = dayAstro.tideType === 'neap';
      const tideType = isSpring
        ? (selectedLang === 'Gujarati' ? 'જુવાર' : selectedLang === 'Hindi' ? 'ज्वार' : 'Spring')
        : isNeap
          ? (selectedLang === 'Gujarati' ? 'ભાંજ' : selectedLang === 'Hindi' ? 'भांज' : 'Neap')
          : (selectedLang === 'Gujarati' ? 'સામાન્ય' : selectedLang === 'Hindi' ? 'सामान्य' : 'Normal');

      const tideBadgeBg = isSpring ? 'rgba(0, 229, 255, 0.15)' : isNeap ? 'rgba(255, 145, 0, 0.15)' : 'rgba(2, 136, 209, 0.1)';
      const tideTextColor = isSpring ? '#00E5FF' : isNeap ? '#FF9100' : '#0288D1';

      tabs.push({
        dateStr,
        dayLabel,
        dateFormatted,
        moonIcon,
        tideType,
        tideBadgeBg,
        tideTextColor,
      });
    }
    return tabs;
  }, [selectedLang, port.lat, port.lon]);

  // Compute 96 sample points for a continuous, silky-smooth tidal sine wave
  const wavePoints = useMemo(() => {
    const totalSamples = 96;
    const pts: { x: number; y: number; h: number; t: number }[] = [];
    const w = chartWidth > 0 ? chartWidth : fallbackChartWidth;

    for (let i = 0; i <= totalSamples; i++) {
      const hour = (i / totalSamples) * 24;
      const x = (i / totalSamples) * w;
      const { height } = getTideHeightAtHour(hour, dailyEvents);
      const y = heightToY(height, chartHeight, maxScale);
      pts.push({ x, y, h: height, t: hour });
    }
    return pts;
  }, [chartWidth, dailyEvents, fallbackChartWidth, maxScale, chartHeight]);

  // SVG Wave Paths: Line Stroke & Gradient Area Fill
  const { strokePath, fillPath } = useMemo(() => {
    if (wavePoints.length === 0) return { strokePath: '', fillPath: '' };
    const w = chartWidth > 0 ? chartWidth : fallbackChartWidth;

    const strokeD = wavePoints
      .map((p, idx) => (idx === 0 ? `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}` : `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`))
      .join(' ');

    const fillD = `${strokeD} L ${w.toFixed(1)} ${chartHeight} L 0 ${chartHeight} Z`;

    return { strokePath: strokeD, fillPath: fillD };
  }, [wavePoints, chartWidth, fallbackChartWidth, chartHeight]);

  // Handle Chart Touch & Scrubbing
  const handleChartTouch = (xPos: number) => {
    const w = chartWidth > 0 ? chartWidth : fallbackChartWidth;
    const clampedX = Math.max(0, Math.min(w, xPos));
    const ratio = clampedX / w;
    const h = ratio * 24;
    setScrubHour(h);
  };

  const handleTideEventClick = (
    evt: { time: string; height: number; type: 'high' | 'low' },
    idx: number
  ) => {
    const evtHour = parseTimeToDecimalHour(evt.time);
    setScrubHour(evtHour);
    setActiveEventIdx(idx);

    VoiceService.stop();
    VoiceService.announceTideEvent({
      portNameEn: port.name,
      portNameGu: port.nameGu,
      portNameHi: port.nameHi,
      type: evt.type,
      time: evt.time,
      height: evt.height,
      lang: selectedLang,
    });

    setTimeout(() => {
      setActiveEventIdx((curr) => (curr === idx ? null : curr));
    }, 6000);
  };

  const handleResetToLive = () => {
    setScrubHour(null);
    setActiveEventIdx(null);
  };

  const handlePrevDay = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() - 1);
    const ny = dateObj.getFullYear();
    const nm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const nd = String(dateObj.getDate()).padStart(2, '0');
    setSelectedDate(`${ny}-${nm}-${nd}`);
  };

  const handleNextDay = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() + 1);
    const ny = dateObj.getFullYear();
    const nm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const nd = String(dateObj.getDate()).padStart(2, '0');
    setSelectedDate(`${ny}-${nm}-${nd}`);
  };

  const handleResetToToday = () => {
    setSelectedDate(getTodayDateStr());
    setScrubHour(null);
    setActiveEventIdx(null);
  };

  const isToday = selectedDate === getTodayDateStr();

  // Cursor coordinates on SVG canvas (user scrubbed or live)
  const cursorX = useMemo(() => {
    const w = chartWidth > 0 ? chartWidth : fallbackChartWidth;
    return (activeHour / 24) * w;
  }, [activeHour, chartWidth, fallbackChartWidth]);

  const cursorY = useMemo(() => heightToY(activeHeight, chartHeight, maxScale), [activeHeight, maxScale, chartHeight]);

  // Real-time Current Time Vertical Indicator Coordinates (Pinned to real clock on Today's chart)
  const liveMarkerX = useMemo(() => {
    const w = chartWidth > 0 ? chartWidth : fallbackChartWidth;
    return (currentLiveHour / 24) * w;
  }, [currentLiveHour, chartWidth, fallbackChartWidth]);

  const { height: liveMarkerHeight } = useMemo(() => {
    return getTideHeightAtHour(currentLiveHour, dailyEvents);
  }, [currentLiveHour, dailyEvents]);

  const liveMarkerY = useMemo(
    () => heightToY(liveMarkerHeight, chartHeight, maxScale),
    [liveMarkerHeight, maxScale, chartHeight]
  );

  const tooltipX = useMemo(() => {
    const w = chartWidth > 0 ? chartWidth : fallbackChartWidth;
    return Math.max(58, Math.min(w - 58, cursorX));
  }, [cursorX, chartWidth, fallbackChartWidth]);

  const tooltipY = cursorY > 58 ? cursorY - 40 : cursorY + 16;

  const colors = isNight
    ? {
      bg: '#0A0F1D',
      cardBg: '#111827',
      cardBorder: '#1F2937',
      headerBg: '#0F172A',
      headerBorder: '#1E293B',
      textPrimary: '#F8FAFC',
      textSecondary: '#94A3B8',
      accentCyan: '#00E5FF',
      accentBlue: '#0288D1',
      pillBg: '#1E293B',
      meterCardBg: '#06172E',
      meterCardBorder: '#0F3460',
      meterTitle: '#00E5FF',
      meterRowBg: 'rgba(255, 255, 255, 0.05)',
      meterValueText: '#FFFFFF',
      chartCardBg: '#041326',
      chartCardBorder: '#0F3460',
      chartCanvasBg: '#020C1A',
      chartCanvasBorder: 'rgba(0, 229, 255, 0.18)',
      chartGridLine: 'rgba(255, 255, 255, 0.09)',
      chartTimeLine: 'rgba(255, 255, 255, 0.05)',
      chartGridText: 'rgba(255, 255, 255, 0.42)',
      timeAxisText: '#80DEEA',
      waveStroke: '#00E5FF',
      waveGlow: 'rgba(0, 229, 255, 0.25)',
      waveGradTop: '#00E5FF',
      waveGradMid: '#0288D1',
      waveGradBot: '#031124',
      tooltipBg: '#03172E',
      tooltipBorder: '#00E5FF',
      tooltipTimeText: '#90CAF9',
      tooltipValText: '#FFFFFF',
      gaugeTrackBg: 'rgba(255, 255, 255, 0.1)',
      voiceBtnBg: 'rgba(2, 136, 209, 0.2)',
      voiceBtnBorder: 'rgba(0, 229, 255, 0.3)',
      voiceBtnTitle: '#FFFFFF',
      voiceBtnSub: '#81D4FA',
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
      meterCardBg: '#FFFFFF',
      meterCardBorder: '#E2E8F0',
      meterTitle: '#0288D1',
      meterRowBg: '#F8FAFC',
      meterValueText: '#0F172A',
      chartCardBg: '#FFFFFF',
      chartCardBorder: '#E2E8F0',
      chartCanvasBg: '#F0F9FF',
      chartCanvasBorder: '#BAE6FD',
      chartGridLine: 'rgba(2, 136, 209, 0.14)',
      chartTimeLine: 'rgba(0, 0, 0, 0.06)',
      chartGridText: 'rgba(2, 136, 209, 0.75)',
      timeAxisText: '#0369A1',
      waveStroke: '#0288D1',
      waveGlow: 'rgba(2, 136, 209, 0.2)',
      waveGradTop: '#0288D1',
      waveGradMid: '#38BDF8',
      waveGradBot: '#E0F2FE',
      tooltipBg: '#FFFFFF',
      tooltipBorder: '#0288D1',
      tooltipTimeText: '#0288D1',
      tooltipValText: '#0F172A',
      gaugeTrackBg: '#E2E8F0',
      voiceBtnBg: '#F0F9FF',
      voiceBtnBorder: '#BAE6FD',
      voiceBtnTitle: '#0369A1',
      voiceBtnSub: '#0288D1',
    };

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar style={isNight ? 'light' : 'dark'} animated={true} />

      {/* Screen Header - Uniform with Calendar & Settings Screens */}
      <View style={[styles.topHeader, { backgroundColor: colors.headerBg, borderBottomColor: colors.headerBorder }]}>
        <BackButton showLabel={false} />

        <View style={styles.titleContainer}>
          <Text style={[styles.screenTitle, { color: colors.textPrimary }]}>{t.screenTitle}</Text>
        </View>

        {/* Header Right: Language Switcher Dropdown (in place of removed LIVE badge) & Voice Speaker */}
        <View style={styles.headerRightGroup}>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => setShowLangModal(true)}
            style={[styles.headerLangBtn, { backgroundColor: colors.pillBg, borderColor: colors.cardBorder }]}>
            <Text style={styles.headerLangEmoji}>🌐</Text>
            <Text style={[styles.headerLangText, { color: colors.textPrimary }]}>
              {selectedLang === 'Gujarati' ? 'ગુજરાતી' : selectedLang === 'Hindi' ? 'हिंदी' : 'EN'}
            </Text>
            <Text style={[styles.headerLangArrow, { color: colors.accentBlue }]}>▾</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleToggleVoiceAnnouncement}
            style={[styles.headerVoiceBtn, isSpeaking && styles.headerVoiceBtnActive, { backgroundColor: colors.pillBg }]}>
            <Text style={styles.headerVoiceIcon}>{isSpeaking ? '⏹️' : '🔊'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: responsivePadding,
            maxWidth: 720,
            width: '100%',
            alignSelf: 'center',
          },
        ]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!isDragging}
        bounces={false}>
        {/* 1. PORT SELECTION BANNER (Shows ONLY Port Name cleanly) */}
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
                {t.calibratedPort}
              </Text>
              <Text style={[styles.portNameText, { color: colors.textPrimary }]}>
                {selectedLang === 'Gujarati'
                  ? `${port.nameGu} (${port.name})`
                  : selectedLang === 'Hindi'
                    ? `${port.nameHi || port.name} (${port.name})`
                    : port.name}
              </Text>
            </View>
          </View>
          <View style={[styles.portChangeBadge, { backgroundColor: colors.pillBg }]}>
            <Text style={[styles.portChangeText, { color: colors.accentBlue }]}>{t.changePort}</Text>
          </View>
        </TouchableOpacity>

        {/* 2. SOLAR & LUNAR ASTRO ACTION BUTTON */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => setShowSunMoonModal(true)}
          style={styles.sunMoonBtnFull}>
          <Text style={styles.sunMoonBtnText}>{t.openSunMoon}</Text>
        </TouchableOpacity>

        {/* DATE & MOON PHASE ROW */}
        <View style={styles.dateRow}>
          <View style={styles.dateBadgeWrap}>
            <Text style={styles.calendarIconEmoji}>📅</Text>
            <TouchableOpacity onPress={handlePrevDay} style={styles.dateArrowBtn}>
              <Text style={[styles.dateArrowText, { color: colors.accentBlue }]}>‹</Text>
            </TouchableOpacity>
            <Text style={[styles.dateText, { color: colors.textPrimary }]}>{selectedDate}</Text>
            <TouchableOpacity onPress={handleNextDay} style={styles.dateArrowBtn}>
              <Text style={[styles.dateArrowText, { color: colors.accentBlue }]}>›</Text>
            </TouchableOpacity>
            {isToday ? (
              <View style={{ backgroundColor: 'rgba(0, 229, 255, 0.15)', borderColor: '#00E5FF', borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 4 }}>
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#00E5FF' }}>
                  {selectedLang === 'Gujarati' ? 'આજે' : selectedLang === 'Hindi' ? 'आज' : 'TODAY'}
                </Text>
              </View>
            ) : (
              <TouchableOpacity onPress={handleResetToToday} style={{ backgroundColor: colors.pillBg, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 4 }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: colors.accentBlue }}>
                  {selectedLang === 'Gujarati' ? 'આજ પર લાવો' : selectedLang === 'Hindi' ? 'आज' : 'Today'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.moonStatusBadge}>
            <Text style={styles.moonStatusEmoji}>🌙</Text>
            <Text style={[styles.moonStatusText, { color: colors.textSecondary }]}>
              {selectedLang === 'Gujarati' ? moonInfo.phaseNameGu : selectedLang === 'Hindi' ? moonInfo.phaseNameHi : moonInfo.phaseNameEn} ({moonInfo.illumination}%)
            </Text>
          </View>
        </View>

        {/* 5-DAY HORIZONTAL SCROLLABLE TIDE SELECTOR */}
        <View style={styles.fiveDayContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.fiveDayScrollContent}>
            {fiveDayTabs.map((item) => {
              const isSelected = selectedDate === item.dateStr;
              return (
                <TouchableOpacity
                  key={item.dateStr}
                  activeOpacity={0.75}
                  onPress={() => {
                    setSelectedDate(item.dateStr);
                    setScrubHour(null);
                    setActiveEventIdx(null);
                  }}
                  style={[
                    styles.fiveDayCard,
                    {
                      backgroundColor: isSelected
                        ? isNight ? 'rgba(0, 229, 255, 0.16)' : 'rgba(2, 136, 209, 0.12)'
                        : colors.cardBg,
                      borderColor: isSelected
                        ? colors.accentCyan
                        : colors.cardBorder,
                      borderWidth: isSelected ? 1.8 : 1,
                    },
                  ]}>
                  <View style={styles.fiveDayTopRow}>
                    <Text
                      style={[
                        styles.fiveDayDayText,
                        {
                          color: isSelected ? colors.accentCyan : colors.textPrimary,
                          fontWeight: isSelected ? '800' : '600',
                        },
                      ]}>
                      {item.dayLabel}
                    </Text>
                    <Text style={styles.fiveDayMoonIcon}>{item.moonIcon}</Text>
                  </View>
                  <Text style={[styles.fiveDayDateText, { color: colors.textSecondary }]}>
                    {item.dateFormatted}
                  </Text>
                  <View style={[styles.fiveDayTideBadge, { backgroundColor: item.tideBadgeBg }]}>
                    <Text style={[styles.fiveDayTideText, { color: item.tideTextColor }]}>
                      {item.tideType}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ========================================================================= */}
        {/* 1. TOP LIVE TIDE METER INSTRUMENT (Digital Gauge & Water State)           */}
        {/* ========================================================================= */}
        <View
          style={[
            styles.tideMeterCard,
            {
              backgroundColor: colors.meterCardBg,
              borderColor: colors.meterCardBorder,
              shadowColor: isNight ? '#00E5FF' : '#000',
              shadowOpacity: isNight ? 0.18 : 0.06,
            },
          ]}>
          <View style={styles.tideMeterHeaderRow}>
            <View style={styles.tideMeterTitleWrap}>
              <Text style={styles.tideMeterIcon}>🌊</Text>
              <Text style={[styles.tideMeterTitle, { color: colors.meterTitle }]}>{t.tideMeterTitle}</Text>
            </View>

            {isScrubbing && (
              <TouchableOpacity onPress={handleResetToLive} style={styles.resetLiveBtn} activeOpacity={0.8}>
                <Text style={styles.resetLiveBtnText}>🔄 {t.resetToLive}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Main Meter Readout Row */}
          <View style={[styles.meterMainRow, { backgroundColor: colors.meterRowBg }]}>
            {/* Height Readout */}
            <View style={styles.meterHeightCol}>
              <View style={[styles.meterBadgePill, !isNight && { backgroundColor: 'rgba(2, 136, 209, 0.12)' }]}>
                <Text style={[styles.meterBadgePillText, !isNight && { color: '#0288D1' }]}>
                  {isScrubbing ? `🎯 ${t.selectedTime}` : `📡 ${t.liveTime}`}
                </Text>
              </View>

              <View style={styles.meterValueRow}>
                <Text style={[styles.meterValueNumber, isSmallDevice && { fontSize: 34 }, { color: colors.meterValueText }]}>{activeHeight.toFixed(2)}</Text>
                <Text style={[styles.meterValueUnit, { color: colors.accentBlue }]}>m</Text>
              </View>

              <Text style={[styles.meterTimeValue, { color: colors.textSecondary }]}>🕒 {activeTimeStr}</Text>
            </View>

            {/* Rising / Falling Direction Badge */}
            <View style={styles.meterStatusCol}>
              <View
                style={[
                  styles.meterStatusPill,
                  isRising ? styles.statusPillRising : styles.statusPillFalling,
                ]}>
                <Text style={[styles.meterStatusArrow, isRising ? styles.statusTextRising : styles.statusTextFalling]}>
                  {isRising ? '▲' : '▼'}
                </Text>
                <Text style={[styles.meterStatusText, isRising ? styles.statusTextRising : styles.statusTextFalling]}>
                  {isRising ? t.rising : t.falling}
                </Text>
              </View>

              <View style={styles.flowRateRow}>
                <Text style={[styles.flowRateLabel, { color: colors.textSecondary }]}>{t.flowRate}:</Text>
                <Text style={[styles.flowRateValue, { color: isRising ? '#00E676' : '#FFB74D' }]}>
                  {isRising ? '+' : ''}{activeRate.toFixed(2)} m/h
                </Text>
              </View>
            </View>
          </View>

          {/* DEDICATED VOICE ANNOUNCEMENT BUTTON INSIDE TIDE METER */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleToggleVoiceAnnouncement}
            style={[
              styles.voiceMeterButton,
              {
                backgroundColor: colors.voiceBtnBg,
                borderColor: colors.voiceBtnBorder,
              },
              isSpeaking && styles.voiceMeterButtonActive,
            ]}>
            <View style={styles.voiceMeterLeft}>
              <Text style={styles.voiceMeterSpeakerIcon}>{isSpeaking ? '⏹️' : '📢'}</Text>
              <View style={styles.voiceMeterTextWrap}>
                <Text style={[styles.voiceMeterMainTitle, { color: colors.voiceBtnTitle }]}>
                  {isSpeaking ? t.stopVoice : t.listenVoice}
                </Text>
                <Text style={[styles.voiceMeterSubTitle, { color: colors.voiceBtnSub }]}>{t.langSubtitle}</Text>
              </View>
            </View>
            <View style={[styles.voicePlayPill, isSpeaking && styles.voicePlayPillActive]}>
              <Text style={styles.voicePlayPillText}>{isSpeaking ? 'STOP' : 'LISTEN'}</Text>
            </View>
          </TouchableOpacity>

          {/* Water Level Gauge Bar (0.0m to maxScale) */}
          <View style={styles.gaugeContainer}>
            <View style={styles.gaugeScaleRow}>
              <Text style={[styles.gaugeScaleText, { color: colors.textSecondary }]}>{t.minScale}</Text>
              <Text style={[styles.gaugeScaleText, { color: colors.textSecondary }]}>{(maxScale / 2).toFixed(2)}m</Text>
              <Text style={[styles.gaugeScaleText, { color: colors.textSecondary }]}>{maxScale.toFixed(1)}m (Spring)</Text>
            </View>
            <View style={[styles.gaugeTrack, { backgroundColor: colors.gaugeTrackBg }]}>
              <View
                style={[
                  styles.gaugeFill,
                  {
                    width: `${Math.min(100, Math.max(6, (activeHeight / maxScale) * 100))}%`,
                    backgroundColor: isRising ? '#00E5FF' : '#FF9100',
                  },
                ]}
              />
            </View>
          </View>

          {/* Interaction Instruction Banner */}
          <View style={styles.scrubHintBox}>
            <Text style={[styles.scrubHintText, { color: colors.accentBlue }]}>{t.scrubHint}</Text>
          </View>
        </View>

        {/* ========================================================================= */}
        {/* 2. LATEST & BEST UI INTERACTIVE 24-HOUR TIDAL WAVE SVG CHART              */}
        {/* ========================================================================= */}
        <View
          style={[
            styles.graphContainer,
            {
              backgroundColor: colors.chartCardBg,
              borderColor: colors.chartCardBorder,
              shadowColor: isNight ? '#00E5FF' : '#000',
              shadowOpacity: isNight ? 0.20 : 0.06,
            },
          ]}>
          <View style={styles.graphHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.graphDateLabel, { color: colors.textPrimary }]}>
                {selectedDate.slice(5)} (24H TIDE WAVE)
              </Text>
              {isToday && (
                <View style={{ backgroundColor: 'rgba(255, 61, 0, 0.15)', borderColor: '#FF3D00', borderWidth: 1, borderRadius: 5, paddingHorizontal: 5, paddingVertical: 1.5 }}>
                  <Text style={{ fontSize: 9.5, fontWeight: '900', color: '#FF3D00' }}>
                    ● {selectedLang === 'Gujarati' ? 'લાઇવ સમય' : selectedLang === 'Hindi' ? 'लाइव समय' : 'LIVE NOW'}
                  </Text>
                </View>
              )}
            </View>
            <View style={[styles.currentStatusPill, isRising ? styles.statusPillRisingMini : styles.statusPillFallingMini]}>
              <Text style={[styles.currentStatusText, isRising ? styles.statusTextRising : styles.statusTextFalling]}>
                {isRising ? t.rising : t.falling}
              </Text>
            </View>
          </View>

          {/* Interactive Chart Canvas */}
          <View
            style={[
              styles.chartCanvas,
              {
                height: chartHeight,
                backgroundColor: colors.chartCanvasBg,
                borderColor: colors.chartCanvasBorder,
              },
            ]}
            onLayout={(e) => {
              const w = e.nativeEvent.layout.width;
              if (w > 50) setChartWidth(w);
            }}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderGrant={(evt) => {
              setIsDragging(true);
              handleChartTouch(evt.nativeEvent.locationX);
            }}
            onResponderMove={(evt) => {
              handleChartTouch(evt.nativeEvent.locationX);
            }}
            onResponderRelease={() => {
              setIsDragging(false);
            }}
            onResponderTerminate={() => {
              setIsDragging(false);
            }}
            {...(Platform.OS === 'web'
              ? {
                onPointerDown: (e: any) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setIsDragging(true);
                  handleChartTouch(e.clientX - rect.left);
                },
                onPointerMove: (e: any) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  handleChartTouch(e.clientX - rect.left);
                },
                onPointerUp: () => {
                  setIsDragging(false);
                },
              }
              : {})}>
            <Svg width="100%" height={chartHeight}>
              <Defs>
                {/* Ocean Wave Surface to Seabed Deep Gradient Fill - Theme Aware */}
                <LinearGradient id="oceanWaveGrad" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor={colors.waveGradTop} stopOpacity={isNight ? '0.55' : '0.40'} />
                  <Stop offset="35%" stopColor={colors.waveGradMid} stopOpacity={isNight ? '0.30' : '0.20'} />
                  <Stop offset="75%" stopColor={colors.waveGradBot} stopOpacity={isNight ? '0.14' : '0.08'} />
                  <Stop offset="100%" stopColor={colors.chartCanvasBg} stopOpacity="0.02" />
                </LinearGradient>

                {/* Wave Stroke Linear Gradient */}
                <LinearGradient id="waveStrokeGrad" x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0%" stopColor={colors.waveStroke} />
                  <Stop offset="50%" stopColor={colors.waveStroke} />
                  <Stop offset="100%" stopColor={isNight ? '#29B6F6' : '#0288D1'} />
                </LinearGradient>
              </Defs>

              {/* Horizontal Depth Reference Gridlines */}
              {gridSteps.map((hVal) => {
                const yPos = heightToY(hVal, chartHeight, maxScale);
                return (
                  <G key={`depth-${hVal}`}>
                    <Line
                      x1="0"
                      y1={yPos}
                      x2={chartWidth}
                      y2={yPos}
                      stroke={colors.chartGridLine}
                      strokeWidth="1"
                      strokeDasharray="3, 3"
                    />
                    <SvgText
                      x="8"
                      y={yPos - 3}
                      fill={colors.chartGridText}
                      fontSize="9"
                      fontWeight="bold">
                      {hVal.toFixed(1)}m
                    </SvgText>
                  </G>
                );
              })}

              {/* Vertical Time Division Gridlines (3h intervals) */}
              {[0, 3, 6, 9, 12, 15, 18, 21, 24].map((hVal) => {
                const xPos = (hVal / 24) * chartWidth;
                return (
                  <Line
                    key={`time-div-${hVal}`}
                    x1={xPos}
                    y1={PADDING_TOP - 6}
                    x2={xPos}
                    y2={chartHeight - PADDING_BOTTOM}
                    stroke={colors.chartTimeLine}
                    strokeWidth="1"
                  />
                );
              })}

              {/* Ocean Wave Gradient Fill */}
              {fillPath !== '' && <Path d={fillPath} fill="url(#oceanWaveGrad)" />}

              {/* Glow Behind the Wave Stroke Line */}
              {strokePath !== '' && (
                <Path
                  d={strokePath}
                  fill="none"
                  stroke={colors.waveStroke}
                  strokeWidth="5"
                  strokeOpacity={isNight ? '0.25' : '0.15'}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Sharp High-Definition Wave Line */}
              {strokePath !== '' && (
                <Path
                  d={strokePath}
                  fill="none"
                  stroke="url(#waveStrokeGrad)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* High & Low Tide Exact Peaks Plotted on Wave */}
              {dailyEvents.map((evt, idx) => {
                const evtHour = parseTimeToDecimalHour(evt.time);
                const evtX = (evtHour / 24) * chartWidth;
                const evtY = heightToY(evt.height, chartHeight, maxScale);
                const isHigh = evt.type === 'high';

                return (
                  <G key={`peak-${idx}`}>
                    {/* Glowing Outer Halo */}
                    <Circle
                      cx={evtX}
                      cy={evtY}
                      r="6.5"
                      fill={isHigh ? 'rgba(0, 229, 255, 0.25)' : 'rgba(255, 145, 0, 0.25)'}
                      stroke={isHigh ? (isNight ? '#00E5FF' : '#0288D1') : '#FF9100'}
                      strokeWidth="1"
                    />
                    {/* Center Dot */}
                    <Circle
                      cx={evtX}
                      cy={evtY}
                      r="3.5"
                      fill={isHigh ? (isNight ? '#00E5FF' : '#0288D1') : '#FF9100'}
                    />

                    {/* Peak Tag Label */}
                    <SvgText
                      x={evtX}
                      y={isHigh ? Math.max(14, evtY - 9) : Math.min(chartHeight - 6, evtY + 14)}
                      fill={isHigh ? (isNight ? '#00E5FF' : '#0288D1') : '#FF9100'}
                      fontSize="9"
                      fontWeight="bold"
                      textAnchor="middle">
                      {isHigh ? `▲ ${evt.height.toFixed(2)}m` : `▼ ${evt.height.toFixed(2)}m`}
                    </SvgText>
                  </G>
                );
              })}

              {/* ============================================================= */}
              {/* CURRENT LIVE TIME INDICATOR LINE & PIN (Shown on Today's wave)*/}
              {/* ============================================================= */}
              {isToday && (
                <G key="live-now-indicator">
                  {/* Subtle Neon Coral Glow behind line */}
                  <Line
                    x1={liveMarkerX}
                    y1={PADDING_TOP - 16}
                    x2={liveMarkerX}
                    y2={chartHeight - PADDING_BOTTOM + 8}
                    stroke="#FF3D00"
                    strokeWidth="4"
                    strokeOpacity="0.22"
                  />

                  {/* Sharp Vertical Current Time Marker Line */}
                  <Line
                    x1={liveMarkerX}
                    y1={PADDING_TOP - 16}
                    x2={liveMarkerX}
                    y2={chartHeight - PADDING_BOTTOM + 8}
                    stroke="#FF3D00"
                    strokeWidth="1.8"
                    strokeDasharray="4, 3"
                  />

                  {/* Top Live Time Tag/Badge */}
                  <Rect
                    x={Math.max(2, Math.min((chartWidth > 0 ? chartWidth : fallbackChartWidth) - 54, liveMarkerX - 27))}
                    y={PADDING_TOP - 22}
                    width="54"
                    height="16"
                    rx="4"
                    fill="#FF3D00"
                  />
                  <SvgText
                    x={Math.max(29, Math.min((chartWidth > 0 ? chartWidth : fallbackChartWidth) - 27, liveMarkerX))}
                    y={PADDING_TOP - 10}
                    fill="#FFFFFF"
                    fontSize="8.5"
                    fontWeight="900"
                    textAnchor="middle">
                    ● {selectedLang === 'Gujarati' ? 'લાઈવ' : selectedLang === 'Hindi' ? 'लाइव' : 'NOW'}
                  </SvgText>

                  {/* Pulsing Dot Snapped on Current Water Level */}
                  <Circle
                    cx={liveMarkerX}
                    cy={liveMarkerY}
                    r="8"
                    fill="rgba(255, 61, 0, 0.3)"
                  />
                  <Circle
                    cx={liveMarkerX}
                    cy={liveMarkerY}
                    r="4.5"
                    fill="#FF3D00"
                    stroke="#FFFFFF"
                    strokeWidth="1.8"
                  />
                </G>
              )}

              {/* Scrubber Cursor Guideline (Vertical Line) */}
              <Line
                x1={cursorX}
                y1={PADDING_TOP - 10}
                x2={cursorX}
                y2={chartHeight - PADDING_BOTTOM + 8}
                stroke={isNight ? '#00E5FF' : '#0288D1'}
                strokeWidth="1.5"
                strokeDasharray="3, 2"
              />

              {/* Pulsing Luminous Snapped Cursor Circle on Wave */}
              <Circle cx={cursorX} cy={cursorY} r="9" fill={isNight ? 'rgba(0, 229, 255, 0.35)' : 'rgba(2, 136, 209, 0.25)'} />
              <Circle
                cx={cursorX}
                cy={cursorY}
                r="4.5"
                fill="#FFFFFF"
                stroke={isNight ? '#00E5FF' : '#0288D1'}
                strokeWidth="2"
              />

              {/* Interactive Tooltip Card Floating Above Scrubber */}
              <Rect
                x={tooltipX - 52}
                y={tooltipY}
                width="104"
                height="28"
                rx="6"
                fill={colors.tooltipBg}
                stroke={colors.tooltipBorder}
                strokeWidth="1.2"
              />
              <SvgText
                x={tooltipX}
                y={tooltipY + 11}
                fill={colors.tooltipTimeText}
                fontSize="8.5"
                fontWeight="bold"
                textAnchor="middle">
                {activeTimeStr}
              </SvgText>
              <SvgText
                x={tooltipX}
                y={tooltipY + 23}
                fill={colors.tooltipValText}
                fontSize="10"
                fontWeight="900"
                textAnchor="middle">
                {activeHeight.toFixed(2)} m {isRising ? '▲' : '▼'}
              </SvgText>
            </Svg>
          </View>

          {/* Time Axis Labels: 12AM, 3AM, 6AM, 9AM, 12PM, 3PM, 6PM, 9PM, 12AM */}
          <View style={styles.timeAxisRow}>
            {['12AM', '3AM', '6AM', '9AM', '12PM', '3PM', '6PM', '9PM', '12AM'].map((label, idx) => (
              <Text key={idx} style={[styles.timeAxisLabel, { color: colors.timeAxisText }]}>
                {label}
              </Text>
            ))}
          </View>
        </View>

        {/* TIDE TABLE SECTION (BHARTI PATRAK) */}
        <View style={[styles.tideTableCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <View style={styles.tideTableHeader}>
            <View style={styles.tideTitleRow}>
              <Text style={[styles.tideTableTitle, { color: colors.textPrimary }]}>{t.tideTable}</Text>
              <View style={styles.interactiveVoiceTag}>
                <Text style={styles.interactiveVoiceTagText}>🔊 Voice Enabled</Text>
              </View>
            </View>
            <Text style={[styles.tideTableSubtitle, { color: colors.accentBlue }]}>
              {t.tideTableSubtitle}
            </Text>
          </View>

          <View style={styles.tideList}>
            {dailyEvents.map((evt, idx) => {
              const isSelected = activeEventIdx === idx;
              const isHigh = evt.type === 'high';
              const accentColor = isHigh ? '#0288D1' : '#F57C00';
              const badgeBg = isHigh ? 'rgba(2, 136, 209, 0.12)' : 'rgba(245, 124, 0, 0.12)';

              return (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.7}
                  onPress={() => handleTideEventClick(evt, idx)}
                  style={[
                    styles.tideEventRowTouchable,
                    {
                      backgroundColor: isSelected
                        ? isHigh
                          ? 'rgba(2, 136, 209, 0.16)'
                          : 'rgba(245, 124, 0, 0.16)'
                        : colors.pillBg,
                      borderColor: isSelected ? accentColor : colors.cardBorder,
                      borderWidth: isSelected ? 1.5 : 1,
                    },
                  ]}>
                  {/* Left: Direction Arrow & Type & Time */}
                  <View style={styles.tideEventLeft}>
                    <View style={[styles.tideTypeIconWrap, { backgroundColor: badgeBg }]}>
                      <Text style={[styles.tideTypeArrow, { color: accentColor }]}>
                        {isHigh ? '▲' : '▼'}
                      </Text>
                    </View>
                    <View style={styles.tideEventTextGroup}>
                      <View style={styles.tideEventNameRow}>
                        <Text style={[styles.tideTypeName, { color: accentColor }]}>
                          {isHigh ? t.highTide : t.lowTide}
                        </Text>
                        <Text style={[styles.tideEventTagMini, { color: colors.textSecondary }]}>
                          {isHigh ? 'FLOOD' : 'EBB'}
                        </Text>
                      </View>
                      <Text style={[styles.tideTimeValue, { color: colors.textPrimary }]}>
                        🕒 {evt.time}
                      </Text>
                    </View>
                  </View>

                  {/* Right: Height Badge & Voice Speaker Button */}
                  <View style={styles.tideEventRight}>
                    <View style={[styles.tideHeightBadge, { backgroundColor: badgeBg }]}>
                      <Text style={[styles.tideHeightText, { color: accentColor }]}>
                        {evt.height.toFixed(2)} m
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.tideSpeakerPill,
                        {
                          backgroundColor: isSelected ? accentColor : 'rgba(0, 0, 0, 0.05)',
                        },
                      ]}>
                      <Text style={styles.tideSpeakerIcon}>{isSelected ? '🔊' : '📢'}</Text>
                      <Text
                        style={[
                          styles.tideSpeakerText,
                          { color: isSelected ? '#FFFFFF' : colors.textSecondary },
                        ]}>
                        {isSelected ? t.speaking : t.tapToSpeak}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* FISHING ADVICE BANNER */}
        <View style={styles.fishingAdviceCard}>
          <View style={styles.adviceHeaderRow}>
            <Text style={styles.adviceIcon}>🎣</Text>
            <Text style={styles.adviceTitle}>{t.fishingAdvice}</Text>
          </View>
          <Text style={styles.adviceBody}>{t.optimalAdviceText}</Text>
        </View>
      </ScrollView>

      {/* GUJARAT ALL BANDARS SELECTOR MODAL WITH GPS DISTANCE (KM) & SEARCH */}
      <Modal visible={showPortModal} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setShowPortModal(false)}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={[styles.bandarModalCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                {/* Header */}
                <View style={styles.bandarModalHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.bandarModalTitle, { color: colors.textPrimary }]}>
                      ⚓ ગુજરાતના તમામ બંદરો ({MARINE_PORTS_DATABASE.length})
                    </Text>
                    <Text style={[styles.bandarModalSubtitle, { color: colors.accentBlue }]}>
                      {currentGps
                        ? `📍 તમારું સ્થાન: ${currentGps.latitude.toFixed(2)}°N, ${currentGps.longitude.toFixed(2)}°E • નજીકનું બંદર પહેલાં`
                        : '📍 GPS લોકેશન આધારે કિલોમીટર (km) ગણતરી'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setShowPortModal(false)}
                    style={[styles.modalCloseBtn, { backgroundColor: colors.pillBg }]}>
                    <Text style={[styles.modalCloseText, { color: colors.textPrimary }]}>✕</Text>
                  </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View style={[styles.bandarSearchBox, { backgroundColor: colors.pillBg, borderColor: colors.cardBorder }]}>
                  <Text style={styles.searchIconText}>🔍</Text>
                  <TextInput
                    value={portSearchText}
                    onChangeText={setPortSearchText}
                    placeholder="બંદર શોધો / Search bandar name..."
                    placeholderTextColor={colors.textSecondary}
                    style={[styles.bandarSearchInput, { color: colors.textPrimary }]}
                    autoCorrect={false}
                    clearButtonMode="while-editing"
                  />
                  {portSearchText.length > 0 && (
                    <TouchableOpacity onPress={() => setPortSearchText('')} style={styles.searchClearBtn}>
                      <Text style={[styles.searchClearText, { color: colors.textSecondary }]}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Scrollable Bandar List */}
                <ScrollView
                  style={styles.bandarScrollView}
                  contentContainerStyle={styles.bandarScrollContent}
                  showsVerticalScrollIndicator={true}
                  keyboardShouldPersistTaps="handled">
                  {filteredAndSortedPorts.length === 0 ? (
                    <View style={styles.emptyPortView}>
                      <Text style={{ fontSize: 28 }}>⚓</Text>
                      <Text style={[styles.emptyPortText, { color: colors.textSecondary }]}>
                        કોઈ બંદર મળ્યું નથી ("{portSearchText}")
                      </Text>
                    </View>
                  ) : (
                    filteredAndSortedPorts.map((item, idx) => {
                      const isSelected = selectedPortId === item.id;
                      const isClosest = idx === 0 && currentGps !== null && item.distanceKm !== null;
                      const displayName =
                        selectedLang === 'Gujarati'
                          ? item.nameGu
                          : selectedLang === 'Hindi'
                            ? item.nameHi || item.name
                            : item.name;

                      return (
                        <TouchableOpacity
                          key={item.id}
                          activeOpacity={0.7}
                          onPress={() => {
                            SettingsStore.setSelectedPortId(item.id);
                            setSelectedPortId(item.id);
                            setShowPortModal(false);
                            setPortSearchText('');
                          }}
                          style={[
                            styles.bandarItemCard,
                            {
                              backgroundColor: isSelected
                                ? isNight
                                  ? 'rgba(0, 229, 255, 0.12)'
                                  : 'rgba(2, 136, 209, 0.12)'
                                : colors.pillBg,
                              borderColor: isSelected ? '#0288D1' : colors.cardBorder,
                              borderWidth: isSelected ? 1.5 : 1,
                            },
                          ]}>
                          <View style={styles.bandarItemLeft}>
                            <View
                              style={[
                                styles.bandarIconCircle,
                                {
                                  backgroundColor: isSelected
                                    ? '#0288D1'
                                    : isNight
                                      ? 'rgba(255,255,255,0.06)'
                                      : 'rgba(0,0,0,0.04)',
                                },
                              ]}>
                              <Text style={{ fontSize: 14 }}>{isSelected ? '⚓' : '⛵'}</Text>
                            </View>

                            <View style={styles.bandarNameCol}>
                              <View style={styles.bandarTitleRow}>
                                <Text
                                  style={[
                                    styles.bandarTitleText,
                                    { color: isSelected ? '#0288D1' : colors.textPrimary },
                                  ]}>
                                  {displayName}
                                </Text>
                                {isClosest && (
                                  <View style={styles.nearestBadge}>
                                    <Text style={styles.nearestBadgeText}>સૌથી નજીક</Text>
                                  </View>
                                )}
                              </View>
                              <Text style={[styles.bandarSubText, { color: colors.textSecondary }]}>
                                {item.name !== displayName ? `${item.name} • ` : ''}
                                {item.regionGu || item.region}
                              </Text>
                            </View>
                          </View>

                          <View style={styles.bandarItemRight}>
                            {item.distanceKm !== null ? (
                              <View
                                style={[
                                  styles.distanceBadge,
                                  {
                                    backgroundColor: isClosest
                                      ? 'rgba(0, 230, 118, 0.18)'
                                      : isNight
                                        ? 'rgba(0, 229, 255, 0.14)'
                                        : 'rgba(2, 136, 209, 0.10)',
                                    borderColor: isClosest ? '#00E676' : isNight ? '#00E5FF' : '#0288D1',
                                  },
                                ]}>
                                <Text
                                  style={[
                                    styles.distanceBadgeText,
                                    {
                                      color: isClosest ? '#00E676' : isNight ? '#00E5FF' : '#0288D1',
                                    },
                                  ]}>
                                  📍 {item.distanceKm} km
                                </Text>
                              </View>
                            ) : (
                              <Text style={[styles.distanceBadgeText, { color: colors.textSecondary }]}>
                                📍 -- km
                              </Text>
                            )}
                            {isSelected && (
                              <Text style={styles.selectedCheckText}>✓</Text>
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })
                  )}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* LANGUAGE SELECTOR MODAL */}
      <Modal visible={showLangModal} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowLangModal(false)}>
          <View style={styles.modalBackdrop}>
            <View style={[styles.pickerCard, { backgroundColor: colors.cardBg }]}>
              <Text style={[styles.pickerTitle, { color: colors.textPrimary }]}>🌐 Select Voice Language</Text>
              {(
                [
                  { key: 'Gujarati', title: 'ગુજરાતી (Gujarati - Default)', badge: 'Default' },
                  { key: 'Hindi', title: 'हिंदी (Hindi)', badge: '' },
                  { key: 'English', title: 'English', badge: '' },
                ] as const
              ).map((lang) => (
                <TouchableOpacity
                  key={lang.key}
                  onPress={() => {
                    setSelectedLang(lang.key);
                    VoiceService.setLanguage(lang.key);
                    setShowLangModal(false);
                  }}
                  style={[
                    styles.pickerOption,
                    { backgroundColor: colors.pillBg },
                    selectedLang === lang.key && styles.pickerOptionSelected,
                  ]}>
                  <View style={styles.pickerOptionRow}>
                    <Text
                      style={[
                        styles.pickerOptionText,
                        { color: colors.textPrimary },
                        selectedLang === lang.key && styles.pickerOptionTextSelected,
                      ]}>
                      {lang.title}
                    </Text>
                    {selectedLang === lang.key && <Text style={{ color: '#0288D1', fontWeight: '900' }}>✓</Text>}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ASTRONOMICAL SOLAR & LUNAR MODAL */}
      <Modal visible={showSunMoonModal} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setShowSunMoonModal(false)}>
          <View style={styles.modalBackdrop}>
            <View style={[styles.sunMoonCard, { backgroundColor: colors.cardBg }]}>
              <Text style={[styles.pickerTitle, { color: colors.textPrimary }]}>
                🌙 {port.name} • Solar & Lunar Data
              </Text>
              <View style={styles.astroGrid}>
                <View style={[styles.astroItem, { backgroundColor: colors.pillBg }]}>
                  <Text style={[styles.astroLabel, { color: colors.textSecondary }]}>Sunrise</Text>
                  <Text style={[styles.astroValue, { color: colors.textPrimary }]}>{sunInfo.sunrise}</Text>
                </View>
                <View style={[styles.astroItem, { backgroundColor: colors.pillBg }]}>
                  <Text style={[styles.astroLabel, { color: colors.textSecondary }]}>Sunset</Text>
                  <Text style={[styles.astroValue, { color: colors.textPrimary }]}>{sunInfo.sunset}</Text>
                </View>
                <View style={[styles.astroItem, { backgroundColor: colors.pillBg }]}>
                  <Text style={[styles.astroLabel, { color: colors.textSecondary }]}>Moonrise</Text>
                  <Text style={[styles.astroValue, { color: colors.textPrimary }]}>{moonInfo.moonrise}</Text>
                </View>
                <View style={[styles.astroItem, { backgroundColor: colors.pillBg }]}>
                  <Text style={[styles.astroLabel, { color: colors.textSecondary }]}>Moonset</Text>
                  <Text style={[styles.astroValue, { color: colors.textPrimary }]}>{moonInfo.moonset}</Text>
                </View>
              </View>
              <View style={styles.solunarNoteBox}>
                <Text style={styles.solunarNoteText}>
                  🐟 <Text style={{ fontWeight: '800' }}>Tidal Dynamics:</Text> {port.tideCharacteristics}. Lunar phase is {moonInfo.phaseNameEn} ({moonInfo.illumination}% lit).
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowSunMoonModal(false)}
                style={styles.closeModalBtn}>
                <Text style={styles.closeModalBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  screenTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerVoiceBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
  },
  headerVoiceBtnActive: {
    backgroundColor: '#00E676',
  },
  headerVoiceIcon: {
    fontSize: 15,
  },
  headerLangBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  headerLangEmoji: {
    fontSize: 12,
  },
  headerLangText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  headerLangArrow: {
    fontSize: 10,
    fontWeight: '900',
  },
  scrollContent: {
    paddingTop: 12,
    paddingBottom: 40,
    gap: 14,
  },

  /* Port Selection Banner */
  portBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.2,
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
    backgroundColor: 'rgba(2, 136, 209, 0.12)',
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
  portChangeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  portChangeText: {
    fontSize: 12,
    fontWeight: '800',
  },

  /* Astronomical Sun Moon Button */
  sunMoonBtnFull: {
    width: '100%',
    backgroundColor: '#0D47A1',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0D47A1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  sunMoonBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  sunMoonBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  /* Date Row */
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  dateBadgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  calendarIconEmoji: {
    fontSize: 18,
  },
  dateArrowBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  dateArrowText: {
    fontSize: 22,
    fontWeight: '700',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  moonStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  moonStatusEmoji: {
    fontSize: 16,
  },
  moonStatusText: {
    fontSize: 12.5,
    fontWeight: '700',
  },

  /* ========================================================================= */
  /* Top Live Tide Meter Instrument Styles                                     */
  /* ========================================================================= */
  tideMeterCard: {
    backgroundColor: '#06172E',
    borderRadius: 18,
    padding: 16,
    gap: 12,
    borderWidth: 1.5,
    borderColor: '#0F3460',
    shadowColor: '#00E5FF',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 6,
  },
  tideMeterCardNight: {
    backgroundColor: '#040F1E',
    borderColor: '#0C2A4D',
  },
  tideMeterHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tideMeterTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tideMeterIcon: {
    fontSize: 18,
  },
  tideMeterTitle: {
    color: '#00E5FF',
    fontSize: 13.5,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  resetLiveBtn: {
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.4)',
  },
  resetLiveBtnText: {
    color: '#00E5FF',
    fontSize: 11,
    fontWeight: '800',
  },
  meterMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    padding: 14,
  },
  meterHeightCol: {
    gap: 4,
  },
  meterBadgePill: {
    alignSelf: 'flex-start',
  },
  meterBadgePillText: {
    color: '#81D4FA',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  meterValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  meterValueNumber: {
    color: '#FFFFFF',
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  meterValueUnit: {
    color: '#00E5FF',
    fontSize: 20,
    fontWeight: '800',
  },
  meterTimeValue: {
    color: '#B0BEC5',
    fontSize: 13,
    fontWeight: '700',
  },
  meterStatusCol: {
    alignItems: 'flex-end',
    gap: 8,
  },
  meterStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1.2,
  },
  statusPillRising: {
    backgroundColor: 'rgba(0, 230, 118, 0.14)',
    borderColor: '#00E676',
  },
  statusPillFalling: {
    backgroundColor: 'rgba(255, 145, 0, 0.14)',
    borderColor: '#FF9100',
  },
  statusPillRisingMini: {
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
  },
  statusPillFallingMini: {
    backgroundColor: 'rgba(255, 145, 0, 0.12)',
  },
  meterStatusArrow: {
    fontSize: 14,
    fontWeight: '900',
  },
  meterStatusText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  statusTextRising: {
    color: '#00E676',
  },
  statusTextFalling: {
    color: '#FFB74D',
  },
  flowRateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  flowRateLabel: {
    color: '#90A4AE',
    fontSize: 11,
    fontWeight: '600',
  },
  flowRateValue: {
    fontSize: 12,
    fontWeight: '800',
  },

  /* Voice Button Inside Tide Meter */
  voiceMeterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)',
  },
  voiceMeterButtonActive: {
    backgroundColor: 'rgba(0, 230, 118, 0.25)',
    borderColor: '#00E676',
  },
  voiceMeterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  voiceMeterSpeakerIcon: {
    fontSize: 20,
  },
  voiceMeterTextWrap: {
    flex: 1,
    gap: 2,
  },
  voiceMeterMainTitle: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
  voiceMeterSubTitle: {
    color: '#81D4FA',
    fontSize: 10.5,
    fontWeight: '600',
  },
  voicePlayPill: {
    backgroundColor: '#00E5FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  voicePlayPillActive: {
    backgroundColor: '#FF5252',
  },
  voicePlayPillText: {
    color: '#000000',
    fontSize: 10.5,
    fontWeight: '900',
  },

  gaugeContainer: {
    gap: 6,
  },
  gaugeScaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gaugeScaleText: {
    color: '#78909C',
    fontSize: 10,
    fontWeight: '700',
  },
  gaugeTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  gaugeFill: {
    height: '100%',
    borderRadius: 5,
  },
  scrubHintBox: {
    alignItems: 'center',
    paddingTop: 2,
  },
  scrubHintText: {
    color: '#81D4FA',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },

  /* ========================================================================= */
  /* Latest 24-Hour Wave SVG Chart Styles                                      */
  /* ========================================================================= */
  graphContainer: {
    backgroundColor: '#041326',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#0F3460',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 5,
    gap: 8,
  },
  graphHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  graphDateLabel: {
    fontSize: 13,
    fontWeight: '900',
    color: '#E0F7FA',
    letterSpacing: 0.5,
  },
  currentStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  currentStatusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  chartCanvas: {
    height: CHART_HEIGHT,
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#020C1A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.18)',
  },
  timeAxisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: 4,
  },
  timeAxisLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#80DEEA',
  },

  /* Tide Table & Bottom Cards */
  tideTableCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    gap: 12,
  },
  tideTableHeader: {
    gap: 4,
    marginBottom: 2,
  },
  tideTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tideTableTitle: {
    fontSize: 15.5,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  interactiveVoiceTag: {
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#00E676',
  },
  interactiveVoiceTagText: {
    color: '#00E676',
    fontSize: 10,
    fontWeight: '800',
  },
  tideTableSubtitle: {
    fontSize: 11.5,
    fontWeight: '600',
    lineHeight: 16,
  },
  tideList: {
    gap: 10,
  },
  tideEventRowTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  tideEventLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  tideTypeIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tideTypeArrow: {
    fontSize: 14,
    fontWeight: '900',
  },
  tideEventTextGroup: {
    gap: 2,
  },
  tideEventNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tideTypeName: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  tideEventTagMini: {
    fontSize: 9.5,
    fontWeight: '800',
    opacity: 0.65,
    letterSpacing: 0.5,
  },
  tideTimeValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  tideEventRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  tideHeightBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tideHeightText: {
    fontSize: 13,
    fontWeight: '900',
  },
  tideSpeakerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  tideSpeakerIcon: {
    fontSize: 10,
  },
  tideSpeakerText: {
    fontSize: 10,
    fontWeight: '700',
  },
  fishingAdviceCard: {
    backgroundColor: '#E0F2F1',
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  adviceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  adviceIcon: {
    fontSize: 16,
  },
  adviceTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#00695C',
  },
  adviceBody: {
    fontSize: 12.5,
    lineHeight: 18,
    color: '#004D40',
    fontWeight: '600',
  },

  /* Modals */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pickerCard: {
    width: '94%',
    borderRadius: 16,
    padding: 18,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  pickerTitle: {
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 6,
  },
  pickerOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  pickerOptionSelected: {
    backgroundColor: '#E3F2FD',
    borderWidth: 1.5,
    borderColor: '#1976D2',
  },
  pickerOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  pickerOptionText: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  pickerOptionTextSelected: {
    color: '#0D47A1',
    fontWeight: '900',
  },
  pickerOptionCheck: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0288D1',
    marginLeft: 8,
  },

  /* Gujarat Coastal Bandar Modal Styles */
  bandarModalCard: {
    width: '95%',
    maxHeight: '88%',
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 10,
  },
  bandarModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 4,
    gap: 8,
  },
  bandarModalTitle: {
    fontSize: 16.5,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  bandarModalSubtitle: {
    fontSize: 11.5,
    fontWeight: '700',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 14,
    fontWeight: '800',
  },
  bandarSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  searchIconText: {
    fontSize: 14,
  },
  bandarSearchInput: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '600',
    paddingVertical: 0,
  },
  searchClearBtn: {
    padding: 4,
  },
  searchClearText: {
    fontSize: 12,
    fontWeight: '700',
  },
  bandarScrollView: {
    maxHeight: 460,
  },
  bandarScrollContent: {
    gap: 8,
    paddingVertical: 4,
  },
  emptyPortView: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyPortText: {
    fontSize: 13.5,
    fontWeight: '600',
    textAlign: 'center',
  },
  bandarItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 8,
  },
  bandarItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  bandarIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bandarNameCol: {
    flex: 1,
    gap: 2,
  },
  bandarTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  bandarTitleText: {
    fontSize: 14,
    fontWeight: '800',
  },
  nearestBadge: {
    backgroundColor: '#00E676',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  nearestBadgeText: {
    color: '#003314',
    fontSize: 9.5,
    fontWeight: '900',
  },
  bandarSubText: {
    fontSize: 11,
    fontWeight: '600',
  },
  bandarItemRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  distanceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  distanceBadgeText: {
    fontSize: 11.5,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  selectedCheckText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0288D1',
  },
  sunMoonCard: {
    width: '92%',
    borderRadius: 18,
    padding: 20,
    gap: 14,
  },
  astroGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  astroItem: {
    flexBasis: '47%',
    flexGrow: 1,
    padding: 12,
    borderRadius: 10,
    gap: 2,
  },
  astroLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  astroValue: {
    fontSize: 18,
    fontWeight: '900',
  },
  solunarNoteBox: {
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 10,
  },
  solunarNoteText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#1B5E20',
  },
  closeModalBtn: {
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0D47A1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeModalBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  /* 5-Day Horizontal Tide Selector */
  fiveDayContainer: {
    marginVertical: 4,
  },
  fiveDayScrollContent: {
    gap: 8,
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  fiveDayCard: {
    width: 96,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
    gap: 3,
  },
  fiveDayTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  fiveDayDayText: {
    fontSize: 12.5,
  },
  fiveDayMoonIcon: {
    fontSize: 14,
  },
  fiveDayDateText: {
    fontSize: 11,
    fontWeight: '500',
  },
  fiveDayTideBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
  },
  fiveDayTideText: {
    fontSize: 10,
    fontWeight: '800',
  },
});
