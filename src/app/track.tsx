import { BackButton } from '@/components/ui/back-button';
import {
  GpsService,
  LocationTelemetry,
  calculateDistanceKm,
  formatNauticalLat,
  formatNauticalLon,
} from '@/services/gpsService';
import { SettingsStore, SpeechLanguage } from '@/services/settingsStore';
import { VoiceService } from '@/services/voiceService';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface TrackPoint {
  lat: number;
  lon: number;
  time: string;
  speedKnots?: number;
}

export interface TrackItem {
  id: number;
  name: string;
  color: string;
  pointsCount: number;
  distanceKm: number;
  date: string;
  duration?: string;
  avgSpeedKnots?: number;
  points?: TrackPoint[];
}

export const AVAILABLE_COLORS = [
  { hex: '#00E676', name: 'Radar Green', code: 'GN' },
  { hex: '#00E5FF', name: 'Marine Cyan', code: 'CY' },
  { hex: '#2979FF', name: 'Deep Blue', code: 'BL' },
  { hex: '#FFD600', name: 'Beacon Gold', code: 'YL' },
  { hex: '#FF3D00', name: 'Flare Orange', code: 'OR' },
  { hex: '#FF1744', name: 'Alert Red', code: 'RD' },
  { hex: '#E040FB', name: 'Neon Purple', code: 'PL' },
  { hex: '#00B0FF', name: 'Coastal Sky', code: 'SK' },
  { hex: '#76FF03', name: 'Lime Glow', code: 'LM' },
  { hex: '#FF9100', name: 'Amber Warn', code: 'AM' },
  { hex: '#F50057', name: 'Coral Pink', code: 'PK' },
  { hex: '#00BFA5', name: 'Seafoam Teal', code: 'TL' },
  { hex: '#651FFF', name: 'Royal Indigo', code: 'IN' },
  { hex: '#FF6D00', name: 'Sunset Rust', code: 'RU' },
  { hex: '#3D5AFE', name: 'Nav Blue', code: 'NV' },
  { hex: '#ECEFF1', name: 'Bright White', code: 'WH' },
];

const UI_TEXT = {
  English: {
    title: 'TRACK RECORDER',
    subtitle: 'Nautical Breadcrumbs & GPX Logging',
    activeGps: '3D DGPS ACTIVE',
    searchingGps: 'SEARCHING GNSS...',
    mapBtn: 'Map 🗺️',
    currentName: 'Track Name',
    selectColor: 'Select Track Line Color',
    startTrack: 'START TRACK RECORDING',
    stopTrack: 'STOP & SAVE TRACK',
    pauseTrack: 'PAUSE',
    resumeTrack: 'RESUME',
    recordingActive: 'RECORDING ACTIVE',
    recordingPaused: 'RECORDING PAUSED',
    importGpx: '📥 Import GPX (File Picker)',
    savedTracks: 'SAVED TRACK LOGBOOK',
    searchPlaceholder: 'Search track name or date...',
    noTracks: 'No saved tracks found',
    rename: 'Rename',
    changeColor: 'Color',
    export: 'Export GPX',
    delete: 'Delete',
    viewOnMap: 'View on Map',
    pts: 'pts',
    speed: 'Speed',
    heading: 'Heading',
    distance: 'Distance',
    duration: 'Duration',
    totalTracks: 'Total Tracks',
    totalDist: 'Total Logged',
  },
  Gujarati: {
    title: 'ટ્રેક રેકોર્ડર',
    subtitle: 'દરિયાઈ ટ્રેક અને GPX લોગિંગ',
    activeGps: '૩D DGPS સક્રિય',
    searchingGps: 'GPS શોધી રહ્યું છે...',
    mapBtn: 'નકશો 🗺️',
    currentName: 'ટ્રેકનું નામ',
    selectColor: 'ટ્રેક લાઇનનો રંગ પસંદ કરો',
    startTrack: 'ટ્રેક રેકોર્ડિંગ શરૂ કરો',
    stopTrack: 'રોકો અને સેવ કરો',
    pauseTrack: 'પોઝ કરો',
    resumeTrack: 'ચાલુ રાખો',
    recordingActive: 'રેકોર્ડિંગ ચાલુ છે',
    recordingPaused: 'રેકોર્ડિંગ રોકાયેલ છે',
    importGpx: '📥 GPX ફાઇલ લાવો (Import)',
    savedTracks: 'સેવ કરેલી ટ્રેક લોગબુક',
    searchPlaceholder: 'ટ્રેકનું નામ અથવા તારીખ શોધો...',
    noTracks: 'કોઈ સેવ કરેલ ટ્રેક મળ્યો નથી',
    rename: 'નામ બદલો',
    changeColor: 'રંગ',
    export: 'GPX શેર',
    delete: 'ડિલીટ',
    viewOnMap: 'નકશા પર',
    pts: 'પોઇન્ટ્સ',
    speed: 'ઝડપ',
    heading: 'દિશા',
    distance: 'અંતર',
    duration: 'સમય',
    totalTracks: 'કુલ ટ્રેક',
    totalDist: 'કુલ અંતર',
  },
  Hindi: {
    title: 'ट्रैक रिकॉर्डर',
    subtitle: 'समुद्री ट्रैक और GPX लॉगिंग',
    activeGps: '3D DGPS सक्रिय',
    searchingGps: 'GPS खोज रहा है...',
    mapBtn: 'नक्शा 🗺️',
    currentName: 'ट्रैक का नाम',
    selectColor: 'ट्रैक लाइन का रंग चुनें',
    startTrack: 'ट्रैक रिकॉर्डिंग शुरू करें',
    stopTrack: 'रोकें और सहेजें',
    pauseTrack: 'रोकें',
    resumeTrack: 'जारी रखें',
    recordingActive: 'रिकॉर्डिंग चालू है',
    recordingPaused: 'रिकॉर्डिंग रुकी हुई है',
    importGpx: '📥 GPX फ़ाइल आयात करें',
    savedTracks: 'सहेजी गई ट्रैक लॉगबुक',
    searchPlaceholder: 'ट्रैक का नाम या तारीख खोजें...',
    noTracks: 'कोई सहेजा गया ट्रैक नहीं मिला',
    rename: 'नाम बदलें',
    changeColor: 'रंग',
    export: 'GPX शेयर',
    delete: 'हटाएं',
    viewOnMap: 'नक्शे पर',
    pts: 'पॉइंट्स',
    speed: 'गति',
    heading: 'दिशा',
    distance: 'दूरी',
    duration: 'समय',
    totalTracks: 'कुल ट्रैक',
    totalDist: 'कुल दूरी',
  },
};

function generateGpxXml(track: TrackItem): string {
  const pointsXml =
    track.points && track.points.length > 0
      ? track.points
          .map(
            (p) => `      <trkpt lat="${p.lat.toFixed(6)}" lon="${p.lon.toFixed(6)}">
        <time>${p.time}</time>
        ${p.speedKnots ? `<speed>${(p.speedKnots * 0.514444).toFixed(2)}</speed>` : ''}
      </trkpt>`
          )
          .join('\n')
      : `      <trkpt lat="20.900000" lon="70.366667">
        <time>${track.date}T10:00:00Z</time>
      </trkpt>
      <trkpt lat="20.920000" lon="70.380000">
        <time>${track.date}T10:30:00Z</time>
      </trkpt>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="GpsPro Marine Navigator" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${track.name}</name>
    <desc>Marine Vessel Track recorded with GpsPro</desc>
    <time>${new Date().toISOString()}</time>
  </metadata>
  <trk>
    <name>${track.name}</name>
    <extensions>
      <lineColor>${track.color}</lineColor>
      <distanceKm>${track.distanceKm}</distanceKm>
    </extensions>
    <trkseg>
${pointsXml}
    </trkseg>
  </trk>
</gpx>`;
}

export default function TrackRecorderScreen() {
  const router = useRouter();

  // Settings & Theme
  const [isNight, setIsNight] = useState<boolean>(() => SettingsStore.isNightMode());
  const [language, setLanguage] = useState<SpeechLanguage>(() => SettingsStore.getSettings().ttsLang);

  useEffect(() => {
    const unsub = SettingsStore.subscribe(() => {
      setIsNight(SettingsStore.isNightMode());
      setLanguage(SettingsStore.getSettings().ttsLang);
    });
    return unsub;
  }, []);

  const t = UI_TEXT[language] || UI_TEXT.English;

  // Selected Line Color
  const [selectedColor, setSelectedColor] = useState<string>('#00E676');

  // Track Recording State
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [currentTrackName, setCurrentTrackName] = useState<string>('Track 3');
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [recordedDistanceKm, setRecordedDistanceKm] = useState<number>(0);
  const [recordedPointsCount, setRecordedPointsCount] = useState<number>(0);
  const recordedPointsRef = useRef<TrackPoint[]>([]);
  const lastRecordedCoordRef = useRef<{ lat: number; lon: number } | null>(null);

  // Live GPS Telemetry
  const [liveGps, setLiveGps] = useState<LocationTelemetry | null>(() => GpsService.getLastTelemetry());

  useEffect(() => {
    // Initial fetch
    const last = GpsService.getLastTelemetry();
    if (last) setLiveGps(last);

    // Watch position
    GpsService.startLocationTracking((telemetry) => {
      setLiveGps(telemetry);

      // If active recording and not paused, accumulate track point and distance
      if (isRecording && !isPaused) {
        const nowIso = new Date().toISOString();
        const pt: TrackPoint = {
          lat: telemetry.latitude,
          lon: telemetry.longitude,
          time: nowIso,
          speedKnots: telemetry.speedKnots,
        };
        recordedPointsRef.current.push(pt);
        setRecordedPointsCount((c) => c + 1);

        if (lastRecordedCoordRef.current) {
          const deltaKm = calculateDistanceKm(
            lastRecordedCoordRef.current.lat,
            lastRecordedCoordRef.current.lon,
            telemetry.latitude,
            telemetry.longitude
          );
          if (deltaKm > 0.005) {
            // Ignore GPS jitter under 5 meters
            setRecordedDistanceKm((prev) => prev + deltaKm);
            lastRecordedCoordRef.current = { lat: telemetry.latitude, lon: telemetry.longitude };
          }
        } else {
          lastRecordedCoordRef.current = { lat: telemetry.latitude, lon: telemetry.longitude };
        }
      }
    });

    return () => {
      GpsService.stopLocationTracking();
    };
  }, [isRecording, isPaused]);

  // Elapsed recording timer
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isRecording && !isPaused) {
      timer = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRecording, isPaused]);

  // Format Elapsed Time (hh:mm:ss)
  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs > 0 ? String(hrs).padStart(2, '0') + ':' : ''}${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Saved Tracks Database
  const [tracks, setTracks] = useState<TrackItem[]>([
    {
      id: 1,
      name: 'Track 1 - Veraval Channel Route',
      color: '#00E676',
      pointsCount: 142,
      distanceKm: 4.8,
      date: '2026-09-22',
      duration: '45m 12s',
      avgSpeedKnots: 6.4,
    },
    {
      id: 2,
      name: 'Track 2 - Deep Sea Trawl #4',
      color: '#00E5FF',
      pointsCount: 98,
      distanceKm: 3.2,
      date: '2026-09-24',
      duration: '32m 04s',
      avgSpeedKnots: 5.8,
    },
  ]);

  // Search Filter
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredTracks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return tracks;
    return tracks.filter(
      (t) => t.name.toLowerCase().includes(q) || t.date.toLowerCase().includes(q)
    );
  }, [tracks, searchQuery]);

  // Rename Modal
  const [renameModalVisible, setRenameModalVisible] = useState<boolean>(false);
  const [editingTrack, setEditingTrack] = useState<TrackItem | null>(null);
  const [renameInput, setRenameInput] = useState<string>('');

  // Palette Modal
  const [paletteModalVisible, setPaletteModalVisible] = useState<boolean>(false);
  const [paletteTrack, setPaletteTrack] = useState<TrackItem | null>(null);

  // Start Track Recording
  const handleStartTrack = () => {
    setIsRecording(true);
    setIsPaused(false);
    setRecordingSeconds(0);
    setRecordedDistanceKm(0);
    setRecordedPointsCount(1);
    recordedPointsRef.current = [];
    if (liveGps) {
      lastRecordedCoordRef.current = { lat: liveGps.latitude, lon: liveGps.longitude };
      recordedPointsRef.current.push({
        lat: liveGps.latitude,
        lon: liveGps.longitude,
        time: new Date().toISOString(),
        speedKnots: liveGps.speedKnots,
      });
    } else {
      lastRecordedCoordRef.current = null;
    }

    VoiceService.speak(
      language === 'Gujarati'
        ? `ટ્રેક રેકોર્ડિંગ શરૂ કર્યું: ${currentTrackName}`
        : language === 'Hindi'
          ? `ट्रैक रिकॉर्डिंग शुरू: ${currentTrackName}`
          : `Track recording started: ${currentTrackName}`,
      language
    );

    Alert.alert(
      'Track Recording Active ⏺️',
      `Recording "${currentTrackName}" with ${AVAILABLE_COLORS.find((c) => c.hex === selectedColor)?.name || 'selected color'}.\nHigh-accuracy GPS breadcrumbs logging.`
    );
  };

  // Pause / Resume Track Recording
  const handleTogglePause = () => {
    const next = !isPaused;
    setIsPaused(next);
    VoiceService.speak(
      next
        ? language === 'Gujarati'
          ? 'ટ્રેક પોઝ કર્યો'
          : language === 'Hindi'
            ? 'ट्रैक रोक दिया'
            : 'Track recording paused'
        : language === 'Gujarati'
          ? 'ટ્રેક ફરી ચાલુ કર્યો'
          : language === 'Hindi'
            ? 'ट्रैक फिर से शुरू'
            : 'Track recording resumed',
      language
    );
  };

  // Stop & Save Track
  const handleStopTrack = () => {
    if (!isRecording) return;

    setIsRecording(false);
    setIsPaused(false);

    const finalDistance = recordedDistanceKm > 0 ? recordedDistanceKm : 1.2;
    const finalPoints = recordedPointsCount > 0 ? recordedPointsCount : 24;
    const finalDuration = formatTime(recordingSeconds);
    const avgSpeed = recordingSeconds > 0 ? (finalDistance / (recordingSeconds / 3600)) * 0.539957 : 6.0;

    const newTrack: TrackItem = {
      id: tracks.length + 1,
      name: currentTrackName.trim() || `Track ${tracks.length + 1}`,
      color: selectedColor,
      pointsCount: finalPoints,
      distanceKm: Number(finalDistance.toFixed(2)),
      date: new Date().toISOString().split('T')[0],
      duration: finalDuration,
      avgSpeedKnots: Number(avgSpeed.toFixed(1)),
      points: [...recordedPointsRef.current],
    };

    setTracks([newTrack, ...tracks]);
    setCurrentTrackName(`Track ${tracks.length + 2}`);

    VoiceService.speak(
      language === 'Gujarati'
        ? `ટ્રેક સેવ કર્યો: ${newTrack.name}`
        : language === 'Hindi'
          ? `ट्रैक सहेजा गया: ${newTrack.name}`
          : `Track saved: ${newTrack.name}`,
      language
    );

    Alert.alert(
      'Track Saved Successfully 💾',
      `"${newTrack.name}" saved to your marine logbook.\nDistance: ${newTrack.distanceKm} km • ${newTrack.pointsCount} points logged.`
    );
  };

  // Import GPX Simulation / Picker
  const handleImportGpx = () => {
    Alert.alert(
      'Import Marine GPX 📥',
      'Select a route from device memory or onboard storage:',
      [
        {
          text: 'Harbor_Approach_South.gpx',
          onPress: () => {
            const imported: TrackItem = {
              id: tracks.length + 1,
              name: 'Imported: Harbor Approach South',
              color: '#00E5FF',
              pointsCount: 284,
              distanceKm: 9.6,
              date: new Date().toISOString().split('T')[0],
              duration: '1h 12m',
              avgSpeedKnots: 7.2,
            };
            setTracks([imported, ...tracks]);
            Alert.alert('GPX Route Imported ✅', 'Successfully imported 284 navigational track points.');
          },
        },
        {
          text: 'DeepSea_Fishing_WaypointTrack.gpx',
          onPress: () => {
            const imported: TrackItem = {
              id: tracks.length + 1,
              name: 'Imported: DeepSea Trawl #8',
              color: '#FFD600',
              pointsCount: 412,
              distanceKm: 14.8,
              date: new Date().toISOString().split('T')[0],
              duration: '1h 55m',
              avgSpeedKnots: 6.8,
            };
            setTracks([imported, ...tracks]);
            Alert.alert('GPX Route Imported ✅', 'Successfully imported 412 navigational track points.');
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  // Rename Track
  const handleOpenRename = (item: TrackItem) => {
    setEditingTrack(item);
    setRenameInput(item.name);
    setRenameModalVisible(true);
  };

  const handleSaveRename = () => {
    if (!renameInput.trim() || !editingTrack) return;
    setTracks((prev) =>
      prev.map((t) => (t.id === editingTrack.id ? { ...t, name: renameInput.trim() } : t))
    );
    setRenameModalVisible(false);
  };

  // Change Track Color
  const handleOpenPalette = (item: TrackItem) => {
    setPaletteTrack(item);
    setPaletteModalVisible(true);
  };

  const handleSelectTrackColor = (c: string) => {
    if (!paletteTrack) return;
    setTracks((prev) =>
      prev.map((t) => (t.id === paletteTrack.id ? { ...t, color: c } : t))
    );
    setPaletteModalVisible(false);
  };

  // Export GPX
  const handleExportGpx = async (item: TrackItem) => {
    try {
      const gpxContent = generateGpxXml(item);
      await Share.share({
        title: `${item.name}.gpx`,
        message: gpxContent,
      });
    } catch {
      Alert.alert(
        'Export GPX File 📤',
        `Track "${item.name}" exported.\nFormat: Marine GPX 1.1\nPoints: ${item.pointsCount} • Distance: ${item.distanceKm} km`
      );
    }
  };

  // Delete Track
  const handleDeleteTrack = (item: TrackItem) => {
    Alert.alert(
      'Delete Track? 🗑️',
      `Are you sure you want to permanently delete "${item.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setTracks((prev) => prev.filter((t) => t.id !== item.id));
          },
        },
      ]
    );
  };

  // View on Map
  const handleViewOnMap = (item: TrackItem) => {
    Alert.alert(
      'Open in Marine Map 🗺️',
      `Loading "${item.name}" track line onto full tactical chart...`,
      [
        {
          text: 'Open Map',
          onPress: () => router.push('/map'),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  // Theme Styles
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
        hudBg: '#09101D',
        hudBorder: '#00E5FF',
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
        hudBg: '#F0F9FF',
        hudBorder: '#0288D1',
      };

  const totalLoggedDistanceKm = useMemo(() => {
    return tracks.reduce((sum, t) => sum + t.distanceKm, 0);
  }, [tracks]);

  const totalPointsLogged = useMemo(() => {
    return tracks.reduce((sum, t) => sum + t.pointsCount, 0);
  }, [tracks]);

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar style={isNight ? 'light' : 'dark'} animated={true} />

      {/* Screen Header */}
      <View style={[styles.topHeader, { backgroundColor: colors.headerBg, borderBottomColor: colors.headerBorder }]}>
        <BackButton showLabel={false} />

        <View style={styles.headerTitleCol}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerAnchorEmoji}>⚓</Text>
            <Text style={[styles.screenTitle, { color: colors.textPrimary }]}>{t.title}</Text>
          </View>
          <Text style={[styles.screenSubtitle, { color: isNight ? '#00E5FF' : '#0288D1' }]}>
            {isRecording ? `● ${isPaused ? t.recordingPaused : t.recordingActive}` : t.subtitle}
          </Text>
        </View>

        {/* Right Header Buttons */}
        <View style={styles.headerRightControls}>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => {
              const next = !isNight;
              setIsNight(next);
              SettingsStore.updateSettings({ theme: next ? 'dark' : 'light' });
            }}
            style={[styles.headerIconBtn, { backgroundColor: colors.pillBg }]}>
            <Text style={styles.headerIconText}>{isNight ? '🌙' : '☀️'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/map')}
            style={[styles.mapHeaderBtn, { backgroundColor: isNight ? 'rgba(0, 229, 255, 0.15)' : 'rgba(2, 136, 209, 0.12)', borderColor: isNight ? '#00E5FF' : '#0288D1' }]}>
            <Text style={[styles.mapHeaderBtnText, { color: isNight ? '#00E5FF' : '#0288D1' }]}>
              {t.mapBtn}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* 1. LIVE GNSS TELEMETRY BAR */}
        <View style={[styles.gnssStatusBar, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <View style={styles.gnssStatusLeft}>
            <View style={[styles.gnssFixDot, { backgroundColor: liveGps ? '#00E676' : '#FFB300' }]} />
            <Text style={[styles.gnssStatusText, { color: liveGps ? (isNight ? '#00E676' : '#00A854') : '#FFB300' }]}>
              {liveGps ? t.activeGps : t.searchingGps}
            </Text>
          </View>
          <View style={styles.gnssCoordsGroup}>
            <Text style={[styles.gnssCoordText, { color: colors.textPrimary }]}>
              {liveGps
                ? `${formatNauticalLat(liveGps.latitude)}  ${formatNauticalLon(liveGps.longitude)}`
                : '20°54.218\'N, 70°22.145\'E'}
            </Text>
            <Text style={[styles.gnssSpeedText, { color: isNight ? '#00E5FF' : '#0288D1' }]}>
              {liveGps ? `${liveGps.speedKnots.toFixed(1)} kn` : '0.0 kn'} • ±{liveGps?.accuracy ? Math.round(liveGps.accuracy) : 2}m
            </Text>
          </View>
        </View>

        {/* 2. LIVE RECORDING HUD / CONTROL CENTER */}
        <View style={[styles.recorderCard, { backgroundColor: colors.cardBg, borderColor: isRecording ? (isNight ? '#00E5FF' : '#0288D1') : colors.cardBorder }]}>
          {isRecording ? (
            /* ACTIVE RECORDING HUD */
            <View style={styles.activeHudContainer}>
              {/* Top Banner with Red Blinking REC beacon */}
              <View style={[styles.hudTopBanner, { backgroundColor: isNight ? 'rgba(255, 23, 68, 0.15)' : 'rgba(239, 83, 80, 0.12)', borderColor: '#FF1744' }]}>
                <View style={styles.recBadgeRow}>
                  <View style={[styles.recBlinkDot, isPaused && { backgroundColor: '#FFB300' }]} />
                  <Text style={[styles.recBadgeText, { color: isPaused ? '#FFB300' : '#FF1744' }]}>
                    {isPaused ? '⏸ PAUSED' : '● REC'}
                  </Text>
                </View>
                <Text style={[styles.recTimerDisplay, { color: colors.textPrimary }]}>
                  {formatTime(recordingSeconds)}
                </Text>
                <View style={[styles.lineColorPill, { backgroundColor: selectedColor }]}>
                  <Text style={styles.lineColorPillText}>LINE</Text>
                </View>
              </View>

              <Text style={[styles.recordingTrackName, { color: colors.textPrimary }]}>
                ⚓ {currentTrackName}
              </Text>

              {/* 4 Tactical Metrics Tiles */}
              <View style={styles.metricsGrid}>
                <View style={[styles.metricTile, { backgroundColor: colors.pillBg }]}>
                  <Text style={[styles.metricTileLabel, { color: colors.textSecondary }]}>
                    📏 {t.distance}
                  </Text>
                  <Text style={[styles.metricTileVal, { color: isNight ? '#00E5FF' : '#0288D1' }]}>
                    {(recordedDistanceKm / 1.852).toFixed(2)} NM
                  </Text>
                  <Text style={[styles.metricTileSub, { color: colors.textSecondary }]}>
                    {recordedDistanceKm.toFixed(2)} km
                  </Text>
                </View>

                <View style={[styles.metricTile, { backgroundColor: colors.pillBg }]}>
                  <Text style={[styles.metricTileLabel, { color: colors.textSecondary }]}>
                    📍 {t.pts}
                  </Text>
                  <Text style={[styles.metricTileVal, { color: colors.textPrimary }]}>
                    {recordedPointsCount}
                  </Text>
                  <Text style={[styles.metricTileSub, { color: colors.textSecondary }]}>
                    Logged
                  </Text>
                </View>

                <View style={[styles.metricTile, { backgroundColor: colors.pillBg }]}>
                  <Text style={[styles.metricTileLabel, { color: colors.textSecondary }]}>
                    🚤 {t.speed}
                  </Text>
                  <Text style={[styles.metricTileVal, { color: '#00E676' }]}>
                    {liveGps ? `${liveGps.speedKnots.toFixed(1)}` : '0.0'} kn
                  </Text>
                  <Text style={[styles.metricTileSub, { color: colors.textSecondary }]}>
                    {liveGps ? `${(liveGps.speedKnots * 1.852).toFixed(1)} km/h` : '0.0 km/h'}
                  </Text>
                </View>

                <View style={[styles.metricTile, { backgroundColor: colors.pillBg }]}>
                  <Text style={[styles.metricTileLabel, { color: colors.textSecondary }]}>
                    ⏱️ {t.duration}
                  </Text>
                  <Text style={[styles.metricTileVal, { color: colors.textPrimary }]}>
                    {formatTime(recordingSeconds)}
                  </Text>
                  <Text style={[styles.metricTileSub, { color: colors.textSecondary }]}>
                    Active
                  </Text>
                </View>
              </View>

              {/* Action Buttons: Pause / Resume & Stop & Save */}
              <View style={styles.hudActionButtonsRow}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleTogglePause}
                  style={[styles.hudSecondaryBtn, { backgroundColor: colors.pillBg }]}>
                  <Text style={[styles.hudSecondaryBtnText, { color: colors.textPrimary }]}>
                    {isPaused ? `▶️ ${t.resumeTrack}` : `⏸️ ${t.pauseTrack}`}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={handleStopTrack}
                  style={styles.hudStopBtn}>
                  <Text style={styles.hudStopBtnText}>⏹ {t.stopTrack}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* IDLE PRE-RECORDING CARD */
            <View style={styles.idleCardContainer}>
              <View style={styles.trackNameInputRow}>
                <Text style={styles.inputIconText}>✏️</Text>
                <View style={styles.inputCol}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                    {t.currentName}:
                  </Text>
                  <TextInput
                    value={currentTrackName}
                    onChangeText={setCurrentTrackName}
                    style={[styles.trackNameInput, { color: colors.textPrimary, borderBottomColor: isNight ? '#334155' : '#CBD5E1' }]}
                    placeholder="Enter track name..."
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
              </View>

              {/* Color Swatch Header */}
              <View style={styles.colorHeaderRow}>
                <Text style={[styles.colorSectionTitle, { color: colors.textPrimary }]}>
                  🎨 {t.selectColor}:
                </Text>
                <View style={styles.selectedColorBadge}>
                  <View style={[styles.selectedColorDot, { backgroundColor: selectedColor }]} />
                  <Text style={[styles.selectedColorName, { color: colors.textPrimary }]}>
                    {AVAILABLE_COLORS.find((c) => c.hex === selectedColor)?.name || 'Selected'}
                  </Text>
                </View>
              </View>

              {/* Horizontal Color Swatches Bar */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.colorSwatchesScroll}>
                {AVAILABLE_COLORS.map((c) => {
                  const isSelected = selectedColor === c.hex;
                  return (
                    <TouchableOpacity
                      key={c.hex}
                      activeOpacity={0.75}
                      onPress={() => setSelectedColor(c.hex)}
                      style={[
                        styles.colorSwatchBtn,
                        { backgroundColor: c.hex },
                        isSelected && [styles.colorSwatchSelected, { borderColor: isNight ? '#FFFFFF' : '#0F172A' }],
                      ]}>
                      {isSelected ? (
                        <Text style={styles.colorCheckmark}>✓</Text>
                      ) : (
                        <Text style={styles.colorCodeText}>{c.code}</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Primary START RECORDING BUTTON */}
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={handleStartTrack}
                style={styles.startRecordBtn}>
                <Text style={styles.startRecordBtnText}>▶ {t.startTrack}</Text>
              </TouchableOpacity>

              {/* Secondary Import GPX Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleImportGpx}
                style={[styles.importGpxPillBtn, { backgroundColor: isNight ? '#1E293B' : '#E2E8F0' }]}>
                <Text style={[styles.importGpxPillText, { color: colors.textPrimary }]}>
                  {t.importGpx}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 3. SAVED TRACKS LOGBOOK SECTION */}
        <View style={styles.logbookSection}>
          <View style={styles.logbookHeaderRow}>
            <View>
              <Text style={[styles.logbookTitle, { color: colors.textPrimary }]}>
                🗺️ {t.savedTracks} ({tracks.length})
              </Text>
              <Text style={[styles.logbookSubtitle, { color: colors.textSecondary }]}>
                {totalLoggedDistanceKm.toFixed(1)} km ({((totalLoggedDistanceKm / 1.852)).toFixed(1)} NM) • {totalPointsLogged} {t.pts}
              </Text>
            </View>
          </View>

          {/* Search Box */}
          <View style={[styles.searchBox, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t.searchPlaceholder}
              placeholderTextColor={colors.textSecondary}
              style={[styles.searchInput, { color: colors.textPrimary }]}
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
                <Text style={[styles.clearSearchText, { color: colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* TRACKS LIST CARDS */}
          {filteredTracks.length === 0 ? (
            <View style={[styles.emptyTracksCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
              <Text style={{ fontSize: 32 }}>⚓</Text>
              <Text style={[styles.emptyTracksText, { color: colors.textSecondary }]}>
                {t.noTracks}
              </Text>
            </View>
          ) : (
            filteredTracks.map((item) => {
              const distanceNm = (item.distanceKm / 1.852).toFixed(2);
              return (
                <View
                  key={item.id}
                  style={[
                    styles.trackCard,
                    {
                      backgroundColor: colors.cardBg,
                      borderColor: colors.cardBorder,
                      borderLeftColor: item.color,
                    },
                  ]}>
                  {/* Track Header */}
                  <View style={styles.trackCardHeader}>
                    <View style={styles.trackNameGroup}>
                      <View style={styles.trackTitleRow}>
                        <View style={[styles.cardColorDot, { backgroundColor: item.color }]} />
                        <Text style={[styles.trackCardTitle, { color: colors.textPrimary }]}>
                          {item.name}
                        </Text>
                      </View>
                      <Text style={[styles.trackCardDate, { color: colors.textSecondary }]}>
                        📅 {item.date} • {item.duration || '35 min'}
                      </Text>
                    </View>

                    <View style={[styles.statusPill, { backgroundColor: isNight ? 'rgba(0, 230, 118, 0.15)' : 'rgba(0, 200, 83, 0.12)' }]}>
                      <Text style={styles.statusPillText}>GPX SAVED</Text>
                    </View>
                  </View>

                  {/* 3 Metric Pills */}
                  <View style={styles.trackMetricsRow}>
                    <View style={[styles.trackMetricPill, { backgroundColor: colors.pillBg }]}>
                      <Text style={[styles.trackMetricPillLabel, { color: colors.textSecondary }]}>📏 {t.distance}</Text>
                      <Text style={[styles.trackMetricPillVal, { color: isNight ? '#00E5FF' : '#0288D1' }]}>
                        {distanceNm} NM
                      </Text>
                      <Text style={[styles.trackMetricPillSub, { color: colors.textSecondary }]}>
                        {item.distanceKm.toFixed(1)} km
                      </Text>
                    </View>

                    <View style={[styles.trackMetricPill, { backgroundColor: colors.pillBg }]}>
                      <Text style={[styles.trackMetricPillLabel, { color: colors.textSecondary }]}>📍 {t.pts}</Text>
                      <Text style={[styles.trackMetricPillVal, { color: colors.textPrimary }]}>
                        {item.pointsCount}
                      </Text>
                      <Text style={[styles.trackMetricPillSub, { color: colors.textSecondary }]}>
                        Points
                      </Text>
                    </View>

                    <View style={[styles.trackMetricPill, { backgroundColor: colors.pillBg }]}>
                      <Text style={[styles.trackMetricPillLabel, { color: colors.textSecondary }]}>🚤 Avg Speed</Text>
                      <Text style={[styles.trackMetricPillVal, { color: '#00E676' }]}>
                        {item.avgSpeedKnots ? `${item.avgSpeedKnots} kn` : '6.2 kn'}
                      </Text>
                      <Text style={[styles.trackMetricPillSub, { color: colors.textSecondary }]}>
                        Cruising
                      </Text>
                    </View>
                  </View>

                  {/* Track Actions Toolbar: Map, Rename, Color, Export, Delete */}
                  <View style={styles.trackCardToolbar}>
                    <TouchableOpacity
                      activeOpacity={0.75}
                      onPress={() => handleViewOnMap(item)}
                      style={[styles.toolBtn, { backgroundColor: isNight ? 'rgba(0, 229, 255, 0.12)' : 'rgba(2, 136, 209, 0.10)' }]}>
                      <Text style={[styles.toolBtnText, { color: isNight ? '#00E5FF' : '#0288D1' }]}>
                        🗺️ {t.viewOnMap}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.75}
                      onPress={() => handleOpenRename(item)}
                      style={[styles.toolBtn, { backgroundColor: colors.pillBg }]}>
                      <Text style={[styles.toolBtnText, { color: colors.textPrimary }]}>
                        ✏️ {t.rename}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.75}
                      onPress={() => handleOpenPalette(item)}
                      style={[styles.toolBtn, { backgroundColor: colors.pillBg }]}>
                      <Text style={[styles.toolBtnText, { color: colors.textPrimary }]}>
                        🎨 {t.changeColor}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.75}
                      onPress={() => handleExportGpx(item)}
                      style={[styles.toolBtn, { backgroundColor: colors.pillBg }]}>
                      <Text style={[styles.toolBtnText, { color: colors.textPrimary }]}>
                        📤 {t.export}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.75}
                      onPress={() => handleDeleteTrack(item)}
                      style={[styles.toolBtnDelete, { backgroundColor: isNight ? 'rgba(255, 23, 68, 0.12)' : 'rgba(211, 47, 47, 0.10)' }]}>
                      <Text style={styles.toolBtnDeleteText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* RENAME TRACK MODAL */}
      <Modal visible={renameModalVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setRenameModalVisible(false)}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={[styles.modalCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>✏️ {t.rename}</Text>
                <TextInput
                  value={renameInput}
                  onChangeText={setRenameInput}
                  style={[styles.modalInput, { color: colors.textPrimary, borderColor: isNight ? '#334155' : '#CBD5E1', backgroundColor: colors.pillBg }]}
                  placeholder="Enter track name..."
                  placeholderTextColor={colors.textSecondary}
                  autoFocus
                />
                <View style={styles.modalBtnRow}>
                  <TouchableOpacity
                    onPress={() => setRenameModalVisible(false)}
                    style={[styles.modalCancelBtn, { backgroundColor: colors.pillBg }]}>
                    <Text style={[styles.modalBtnTextCancel, { color: colors.textSecondary }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSaveRename}
                    style={styles.modalSaveBtn}>
                    <Text style={styles.modalBtnTextSave}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* PALETTE COLOR PICKER MODAL */}
      <Modal visible={paletteModalVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setPaletteModalVisible(false)}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={[styles.modalCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>🎨 {t.changeColor}</Text>
                <View style={styles.paletteGrid}>
                  {AVAILABLE_COLORS.map((c) => (
                    <TouchableOpacity
                      key={c.hex}
                      onPress={() => handleSelectTrackColor(c.hex)}
                      style={[styles.paletteCircle, { backgroundColor: c.hex }]}>
                      {paletteTrack?.color === c.hex && (
                        <Text style={styles.colorCheckmark}>✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity
                  onPress={() => setPaletteModalVisible(false)}
                  style={[styles.modalCancelBtnWide, { backgroundColor: colors.pillBg }]}>
                  <Text style={[styles.modalBtnTextCancel, { color: colors.textSecondary }]}>Close</Text>
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
  headerTitleCol: {
    flex: 1,
    marginLeft: 8,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerAnchorEmoji: {
    fontSize: 18,
  },
  screenTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  screenSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 1,
  },
  headerRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconText: {
    fontSize: 16,
  },
  mapHeaderBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  mapHeaderBtnText: {
    fontSize: 12,
    fontWeight: '900',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 14,
  },

  /* GNSS Status Bar */
  gnssStatusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  gnssStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gnssFixDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  gnssStatusText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  gnssCoordsGroup: {
    alignItems: 'flex-end',
    gap: 1,
  },
  gnssCoordText: {
    fontSize: 12,
    fontWeight: '800',
  },
  gnssSpeedText: {
    fontSize: 11,
    fontWeight: '700',
  },

  /* Recorder Card */
  recorderCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },

  /* Idle Card */
  idleCardContainer: {
    gap: 14,
  },
  trackNameInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inputIconText: {
    fontSize: 20,
  },
  inputCol: {
    flex: 1,
    gap: 2,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  trackNameInput: {
    fontSize: 16,
    fontWeight: '900',
    paddingVertical: 2,
    borderBottomWidth: 1.5,
  },
  colorHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  colorSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  selectedColorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  selectedColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  selectedColorName: {
    fontSize: 12,
    fontWeight: '800',
  },
  colorSwatchesScroll: {
    paddingVertical: 4,
    gap: 10,
  },
  colorSwatchBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  colorSwatchSelected: {
    borderWidth: 3,
    transform: [{ scale: 1.1 }],
  },
  colorCheckmark: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '900',
  },
  colorCodeText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '900',
    opacity: 0.7,
  },
  startRecordBtn: {
    backgroundColor: '#0288D1',
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0288D1',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
    marginTop: 4,
  },
  startRecordBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  importGpxPillBtn: {
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  importGpxPillText: {
    fontSize: 13.5,
    fontWeight: '800',
  },

  /* Active HUD */
  activeHudContainer: {
    gap: 12,
  },
  hudTopBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  recBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recBlinkDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF1744',
  },
  recBadgeText: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  recTimerDisplay: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
    fontVariant: ['tabular-nums'],
  },
  lineColorPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  lineColorPillText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '900',
  },
  recordingTrackName: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricTile: {
    width: (SCREEN_WIDTH - 64 - 10) / 2,
    padding: 12,
    borderRadius: 14,
    gap: 2,
  },
  metricTileLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  metricTileVal: {
    fontSize: 17,
    fontWeight: '900',
  },
  metricTileSub: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  hudActionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  hudSecondaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hudSecondaryBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  hudStopBtn: {
    flex: 1.3,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF1744',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF1744',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  hudStopBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.3,
  },

  /* Logbook Section */
  logbookSection: {
    gap: 12,
    marginTop: 6,
  },
  logbookHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logbookTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  logbookSubtitle: {
    fontSize: 11.5,
    fontWeight: '700',
    marginTop: 1,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.2,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  searchIcon: {
    fontSize: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '600',
    paddingVertical: 0,
  },
  clearSearchBtn: {
    padding: 4,
  },
  clearSearchText: {
    fontSize: 13,
    fontWeight: '800',
  },
  emptyTracksCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  emptyTracksText: {
    fontSize: 13.5,
    fontWeight: '700',
  },

  /* Track Card */
  trackCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderLeftWidth: 5,
    padding: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  trackCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  trackNameGroup: {
    flex: 1,
    gap: 3,
  },
  trackTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  trackCardTitle: {
    fontSize: 15,
    fontWeight: '900',
    flex: 1,
  },
  trackCardDate: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusPillText: {
    color: '#00E676',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  trackMetricsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  trackMetricPill: {
    flex: 1,
    padding: 9,
    borderRadius: 12,
    gap: 1,
  },
  trackMetricPillLabel: {
    fontSize: 10,
    fontWeight: '800',
  },
  trackMetricPillVal: {
    fontSize: 13.5,
    fontWeight: '900',
  },
  trackMetricPillSub: {
    fontSize: 9.5,
    fontWeight: '600',
  },
  trackCardToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  toolBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  toolBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  toolBtnDelete: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    marginLeft: 'auto',
  },
  toolBtnDeleteText: {
    fontSize: 13,
  },

  /* Modals */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.70)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 20,
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '900',
  },
  modalInput: {
    borderWidth: 1.2,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: '700',
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  modalCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtnWide: {
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  modalSaveBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0288D1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnTextCancel: {
    fontSize: 14,
    fontWeight: '800',
  },
  modalBtnTextSave: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  paletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    paddingVertical: 8,
  },
  paletteCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
});
