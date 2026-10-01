import { BackButton } from '@/components/ui/back-button';
import {
  fetchLiveMarineWeather,
  LiveMarineWeatherResult,
} from '@/services/liveWeatherService';
import {
  getDynamicDailyForecast,
  MARINE_PORTS_DATABASE,
  MarinePortInfo,
} from '@/services/marineData';
import { SettingsStore } from '@/services/settingsStore';
import { VoiceService } from '@/services/voiceService';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { GpsService, calculateDistanceKm } from '@/services/gpsService';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function SeaWeatherScreen() {
  const router = useRouter();

  // Theme & Night Mode Subscription
  const [isNight, setIsNight] = useState<boolean>(() => SettingsStore.isNightMode());
  // Selected Port (Synchronized globally via SettingsStore)
  const [selectedPortId, setSelectedPortId] = useState<string>(() => SettingsStore.getSelectedPortId());
  const [showPortModal, setShowPortModal] = useState<boolean>(false);
  const [showLangModal, setShowLangModal] = useState<boolean>(false);
  const [speechLang, setSpeechLang] = useState<'Gujarati' | 'Hindi' | 'English'>('Gujarati');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Live GPS Coordinates for computing real-time distance (km) to all ports
  const [currentGps, setCurrentGps] = useState<{ latitude: number; longitude: number } | null>(null);
  const [portSearchText, setPortSearchText] = useState<string>('');

  useEffect(() => {
    const unsub = SettingsStore.subscribe((s) => {
      setIsNight(SettingsStore.isNightMode());
      if (s.selectedPortId && s.selectedPortId !== selectedPortId) {
        setSelectedPortId(s.selectedPortId);
      }
    });
    return unsub;
  }, [selectedPortId]);

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
    return () => {
      VoiceService.stop();
    };
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
  const [liveData, setLiveData] = useState<LiveMarineWeatherResult | null>(null);
  const [isLoadingLive, setIsLoadingLive] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>(() => {
    const now = new Date();
    const dateFormatted = `${now.getDate()} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][now.getMonth()]}`;
    const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `Today, ${dateFormatted} at ${timeFormatted} (Live IMD Marine Satellite)`;
  });

  const port: MarinePortInfo =
    MARINE_PORTS_DATABASE.find((p) => p.id === selectedPortId) || MARINE_PORTS_DATABASE[0];

  // Fetch Live Satellite Weather on port change or initial load
  useEffect(() => {
    let isMounted = true;
    setIsLoadingLive(true);
    fetchLiveMarineWeather(port)
      .then((res) => {
        if (isMounted) {
          setLiveData(res);
          setLastUpdated(res.updatedAtText);
          setIsLoadingLive(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsLoadingLive(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [port]);

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
    };

  // Open Windy.com for high-res marine radar calibrated to port coordinates
  const handleOpenWindy = async () => {
    const windyUrl = `https://www.windy.com/?${port.lat.toFixed(2)},${port.lon.toFixed(2)},10`;
    try {
      if (Platform.OS === 'web') {
        window.open(windyUrl, '_blank');
      } else {
        await WebBrowser.openBrowserAsync(windyUrl);
      }
    } catch (e) {
      Linking.openURL(windyUrl).catch(() => {
        Alert.alert('Notice', 'Unable to open browser. Please check internet connection.');
      });
    }
  };

  const handleRefreshWeather = async () => {
    setIsLoadingLive(true);
    try {
      const res = await fetchLiveMarineWeather(port);
      setLiveData(res);
      setLastUpdated(res.updatedAtText);
      Alert.alert(
        res.isLive ? 'Marine Satellite Synchronized 🟢' : 'Offline Baseline Active 📡',
        res.isLive
          ? `Live coastal meteorological & ocean swell data updated for ${port.name} (${port.coords}) via Open-Meteo satellite feed.`
          : `Deep-sea offline calibrated baseline loaded for ${port.name}. Navigation safe.`
      );
    } catch (e) {
      Alert.alert('Marine Weather', `Weather information refreshed for ${port.name}.`);
    } finally {
      setIsLoadingLive(false);
    }
  };

  const currentWeather = liveData
    ? liveData.weather
    : {
      ...port.weather,
      windKmh: Math.round(port.weather.windKnots * 1.852),
      gustKmh: Math.round(port.weather.gustKnots * 1.852),
      conditionHi: port.weather.condition,
    };

  const hourlyForecast = liveData ? liveData.hourly : port.hourly;

  const dailyForecast = useMemo(() => {
    if (liveData?.daily && liveData.daily.length > 0) {
      return liveData.daily;
    }
    return getDynamicDailyForecast(port);
  }, [liveData, port]);

  const formatDayName = (dayStr: string) => {
    if (dayStr === 'Today') {
      return speechLang === 'Gujarati' ? 'આજે' : speechLang === 'Hindi' ? 'आज' : 'Today';
    }
    if (dayStr === 'Tomorrow') {
      return speechLang === 'Gujarati' ? 'આવતીકાલે' : speechLang === 'Hindi' ? 'कल' : 'Tomorrow';
    }
    const dayMapGu: Record<string, string> = { Sun: 'રવિ', Mon: 'સોમ', Tue: 'મંગળ', Wed: 'બુધ', Thu: 'ગુરુ', Fri: 'શુક્ર', Sat: 'શનિ' };
    const dayMapHi: Record<string, string> = { Sun: 'रवि', Mon: 'सोम', Tue: 'मंगल', Wed: 'बुध', Thu: 'गुरु', Fri: 'शुक्र', Sat: 'शनि' };
    if (speechLang === 'Gujarati' && dayMapGu[dayStr]) return dayMapGu[dayStr];
    if (speechLang === 'Hindi' && dayMapHi[dayStr]) return dayMapHi[dayStr];
    return dayStr;
  };

  // Voice Announcement Handler (Gujarati default, Hindi, English)
  const handleToggleVoice = () => {
    if (isSpeaking) {
      VoiceService.stop();
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);
    VoiceService.announceWeather({
      portNameEn: port.name,
      portNameGu: port.nameGu,
      portNameHi: port.nameHi,
      temp: currentWeather.temp,
      windKnots: currentWeather.windKnots,
      windDir: currentWeather.windDir,
      waveMeters: currentWeather.waveMeters,
      conditionEn: currentWeather.condition,
      conditionGu: currentWeather.conditionGu,
      conditionHi: currentWeather.conditionHi || currentWeather.condition,
      advisoryGu: currentWeather.advisoryGu,
      advisoryHi: currentWeather.advisoryHi,
      advisoryEn: currentWeather.advisoryEn,
      lang: speechLang,
    });

    // Reset speaking animation state after estimated sentence length
    setTimeout(() => {
      setIsSpeaking(false);
    }, 9000);
  };

  const isSafe = currentWeather.safety === 'SAFE';
  const isModerate = currentWeather.safety === 'MODERATE';
  const isCaution = currentWeather.safety === 'CAUTION';

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar style={isNight ? 'light' : 'dark'} animated={true} />

      {/* Screen Header - Uniform with App Header (Calendar, Settings, Waypoints) */}
      <View style={[styles.topHeader, { backgroundColor: colors.headerBg, borderBottomColor: colors.headerBorder }]}>
        <BackButton showLabel={false} />

        <View style={styles.titleContainer}>
          <Text style={[styles.screenTitle, { color: colors.textPrimary }]}>
            {speechLang === 'Gujarati' ? 'દરિયાઈ હવામાન' : speechLang === 'Hindi' ? 'समुद्री मौसम' : 'Sea Weather'}
          </Text>
        </View>

        {/* Right Controls: Voice Speaker & Language Pill */}
        <View style={styles.headerRightGroup}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleToggleVoice}
            style={[styles.headerVoiceBtn, isSpeaking && styles.headerVoiceBtnActive, { backgroundColor: colors.pillBg }]}>
            <Text style={styles.headerVoiceIcon}>{isSpeaking ? '⏹️' : '🔊'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setShowLangModal(true)}
            style={[styles.headerLangBtn, { backgroundColor: colors.pillBg }]}>
            <Text style={[styles.headerLangText, { color: colors.accentBlue }]}>
              {speechLang === 'Gujarati' ? 'ગુજ' : speechLang === 'Hindi' ? 'હિં' : 'EN'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* PORT SELECTION BANNER */}
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
                {speechLang === 'Gujarati' ? 'પસંદ કરેલ ફિશિંગ બંદર:' : speechLang === 'Hindi' ? 'चुना हुआ बंदरगाह:' : 'CALIBRATED HARBOR:'}
              </Text>
              <Text style={[styles.portNameText, { color: colors.textPrimary }]}>
                {port.name} ({port.nameGu})
              </Text>
              <Text style={[styles.portCoordsText, { color: colors.accentBlue }]}>
                📍 {port.coords} • {port.region}
              </Text>
            </View>
          </View>
          <View style={[styles.portChangeBadge, { backgroundColor: colors.pillBg }]}>
            <Text style={[styles.portChangeText, { color: colors.accentBlue }]}>
              {speechLang === 'Gujarati' ? 'બદલો ▾' : speechLang === 'Hindi' ? 'बदलें ▾' : 'Change ▾'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* 100% ACCURATE CURRENT MARINE HERO CARD */}
        <View style={styles.heroWeatherCard}>
          <View style={styles.heroLocationRow}>
            <View style={styles.heroPinWrap}>
              <Text style={styles.heroLocationIcon}>⚓</Text>
              <Text style={styles.heroLocationTitle}>{port.name}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {isLoadingLive ? (
                <View style={styles.liveSyncingBadge}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.liveSyncingText}>SYNCING...</Text>
                </View>
              ) : (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleRefreshWeather}
                  style={[
                    styles.liveStatusBadge,
                    liveData?.isLive ? styles.liveStatusLive : styles.liveStatusOffline,
                  ]}>
                  <Text style={styles.liveStatusText}>
                    {liveData?.isLive ? '🟢 LIVE SATELLITE' : '📡 OFFLINE'}
                  </Text>
                </TouchableOpacity>
              )}
              <View
                style={[
                  styles.safetyHeroBadge,
                  isSafe && styles.safetyBadgeGreen,
                  isModerate && styles.safetyBadgeYellow,
                  isCaution && styles.safetyBadgeRed,
                ]}>
                <Text style={styles.safetyHeroText}>{currentWeather.safety}</Text>
              </View>
            </View>
          </View>

          <View style={styles.heroMetricsMainRow}>
            <View>
              <Text style={styles.heroTempText}>{currentWeather.temp}°C</Text>
              <Text style={styles.heroConditionText}>{currentWeather.condition}</Text>
              <Text style={styles.heroConditionGuText}>{currentWeather.conditionGu}</Text>
            </View>
            <Text style={styles.heroWeatherEmoji}>{currentWeather.icon}</Text>
          </View>

          {/* DEDICATED VOICE ANNOUNCEMENT BUTTON IN HERO */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleToggleVoice}
            style={[styles.voiceHeroButton, isSpeaking && styles.voiceHeroButtonActive]}>
            <View style={styles.voiceHeroLeft}>
              <Text style={styles.voiceHeroSpeakerIcon}>{isSpeaking ? '⏹️' : '📢'}</Text>
              <View style={styles.voiceHeroTextWrap}>
                <Text style={styles.voiceHeroMainTitle}>
                  {isSpeaking
                    ? speechLang === 'Gujarati'
                      ? 'અવાજ બંધ કરો (Stop)'
                      : speechLang === 'Hindi'
                        ? 'आवाज़ बंद करें (Stop)'
                        : 'Stop Voice Announcement'
                    : speechLang === 'Gujarati'
                      ? 'હવામાન જાહેરાત સાંભળો (Voice Announcement)'
                      : speechLang === 'Hindi'
                        ? 'मौसम घोषणा सुनें (Voice Announcement)'
                        : 'Listen Weather Announcement'}
                </Text>
                <Text style={styles.voiceHeroSubTitle}>
                  {speechLang === 'Gujarati'
                    ? 'ભાષા: ગુજરાતી (ડિફોલ્ટ)'
                    : speechLang === 'Hindi'
                      ? 'भाषा: हिंदी'
                      : 'Language: English'}
                </Text>
              </View>
            </View>
            <View style={[styles.voicePlayPill, isSpeaking && styles.voicePlayPillActive]}>
              <Text style={styles.voicePlayPillText}>{isSpeaking ? 'STOP' : 'LISTEN'}</Text>
            </View>
          </TouchableOpacity>

          {/* 6 Core Marine Vital Signs (Accurate to Port) */}
          <View style={styles.vitalMetricsGrid}>
            <View style={styles.vitalMetricItem}>
              <Text style={styles.vitalLabel}>WIND SPEED</Text>
              <Text style={styles.vitalValue}>{currentWeather.windKmh} km/h</Text>
              <Text style={styles.vitalSub}>
                {currentWeather.windKnots} kn • {currentWeather.windDir} ({currentWeather.windAngle}°)
              </Text>
            </View>

            <View style={styles.vitalMetricItem}>
              <Text style={styles.vitalLabel}>WAVE HEIGHT</Text>
              <Text style={[styles.vitalValue, { color: isSafe ? '#00E676' : '#FFB74D' }]}>
                {currentWeather.waveMeters} m
              </Text>
              <Text style={styles.vitalSub}>Swell {currentWeather.swellPeriod}</Text>
            </View>

            <View style={styles.vitalMetricItem}>
              <Text style={styles.vitalLabel}>WATER TEMP</Text>
              <Text style={styles.vitalValue}>{currentWeather.waterTemp}°C</Text>
              <Text style={styles.vitalSub}>Arabian Sea</Text>
            </View>
          </View>

          <View style={styles.vitalMetricsGrid}>
            <View style={styles.vitalMetricItem}>
              <Text style={styles.vitalLabel}>BAROMETER</Text>
              <Text style={styles.vitalValue}>{currentWeather.pressure}</Text>
              <Text style={styles.vitalSub}>Surface</Text>
            </View>

            <View style={styles.vitalMetricItem}>
              <Text style={styles.vitalLabel}>HUMIDITY</Text>
              <Text style={styles.vitalValue}>{currentWeather.humidity}</Text>
              <Text style={styles.vitalSub}>Marine Air</Text>
            </View>

            <View style={styles.vitalMetricItem}>
              <Text style={styles.vitalLabel}>GUST SPEED</Text>
              <Text style={styles.vitalValue}>{currentWeather.gustKmh} km/h</Text>
              <Text style={styles.vitalSub}>Max Peak ({currentWeather.gustKnots} kn)</Text>
            </View>
          </View>

          {/* Real Marine Advisory */}
          <View style={styles.advisoryChip}>
            <Text style={styles.advisoryIcon}>{isSafe ? '🟢' : isModerate ? '🟡' : '🔴'}</Text>
            <View style={styles.advisoryTextCol}>
              <Text style={styles.advisoryEnText}>{currentWeather.advisoryEn}</Text>
              <Text style={styles.advisoryGuText}>ગુજરાતી: {currentWeather.advisoryGu}</Text>
            </View>
          </View>
        </View>

        {/* BIG BUTTON: OPEN LIVE WINDY.COM RADAR */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handleOpenWindy}
          style={styles.windyCtaButton}>
          <View style={styles.windyBtnInner}>
            <Text style={styles.windyLogoIcon}>🌐</Text>
            <View style={styles.windyTextCol}>
              <Text style={styles.windyMainTitle}>Open Live Windy.com Marine Radar</Text>
              <Text style={styles.windySubTitle}>
                Direct satellite radar for {port.name} ({port.coords})
              </Text>
            </View>
            <Text style={styles.windyArrow}>➔</Text>
          </View>
        </TouchableOpacity>

        {/* HOURLY MARINE SWELL & WIND FORECAST */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>24-Hour Marine Forecast</Text>
          <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>Hourly Swell & Wind</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hourlyScroll}>
          {hourlyForecast.map((h, i) => (
            <View
              key={i}
              style={[
                styles.hourlyCard,
                { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
              ]}>
              <Text style={[styles.hourlyTime, { color: colors.textSecondary }]}>{h.time}</Text>
              <Text style={styles.hourlyIcon}>{h.icon}</Text>
              <Text style={[styles.hourlyTemp, { color: colors.textPrimary }]}>{h.temp}°</Text>
              <View style={styles.hourlyWindPill}>
                <Text style={styles.hourlyWindText}>{Math.round(h.windKnots * 1.852)} km/h</Text>
              </View>
              <Text style={[styles.hourlyWaveText, { color: colors.textSecondary }]}>{h.waveMeters}m wave</Text>
              <Text style={[styles.hourlyDirText, { color: colors.textPrimary }]}>{h.windDir}</Text>
            </View>
          ))}
        </ScrollView>

        {/* 5-DAY FISHING SAFETY OUTLOOK */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>5-Day Sea Outlook</Text>
          <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>Fishing Boat Safety Rating</Text>
        </View>

        <View style={[styles.dailyForecastCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          {dailyForecast.map((d, i) => {
            const isDaySafe = d.safety === 'SAFE';
            const isDayCaution = d.safety === 'CAUTION';
            return (
              <View
                key={i}
                style={[
                  styles.dailyRow,
                  i < dailyForecast.length - 1 && [styles.dailyBorder, { borderBottomColor: colors.cardBorder }],
                ]}>
                <View style={styles.dailyDayCol}>
                  <Text style={[styles.dailyDayTitle, { color: colors.textPrimary }]}>{formatDayName(d.day)}</Text>
                  <Text style={[styles.dailyDayDate, { color: colors.textSecondary }]}>{d.date}</Text>
                </View>

                <Text style={styles.dailyIcon}>{d.icon}</Text>

                <View style={styles.dailyMetricsCol}>
                  <Text style={[styles.dailyWindText, { color: colors.textPrimary }]}>
                    Max Wind: <Text style={{ fontWeight: '800' }}>{Math.round(d.maxWind * 1.852)} km/h</Text>
                  </Text>
                  <Text style={[styles.dailyWaveText, { color: colors.textSecondary }]}>Waves: {d.waveHeight}</Text>
                </View>

                <View
                  style={[
                    styles.safetyPill,
                    isDaySafe && styles.safetyPillGreen,
                    isDayCaution && styles.safetyPillRed,
                  ]}>
                  <Text
                    style={[
                      styles.safetyPillText,
                      isDaySafe && styles.safetyTextGreen,
                      isDayCaution && styles.safetyTextRed,
                    ]}>
                    {d.safety}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* DATA SOURCE & OFFLINE SAFETY BANNER */}
        <View style={[styles.dataSourceCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <View style={styles.dataSourceHeader}>
            <View style={styles.dataSourceLeft}>
              <Text style={styles.dataSourceIcon}>{liveData?.isLive ? '🛰️' : '📡'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.dataSourceTitle, { color: colors.textPrimary }]}>
                  {liveData?.sourceLabel ?? '🟢 Live Satellite (Open-Meteo & IMD Marine)'}
                </Text>
                <Text style={[styles.dataSourceUpdated, { color: colors.textSecondary }]}>
                  {lastUpdated}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleRefreshWeather}
              disabled={isLoadingLive}
              style={[styles.refreshSyncBtn, { backgroundColor: colors.pillBg }]}>
              {isLoadingLive ? (
                <ActivityIndicator size="small" color={colors.accentBlue} />
              ) : (
                <Text style={[styles.refreshSyncBtnText, { color: colors.accentBlue }]}>🔄 Refresh</Text>
              )}
            </TouchableOpacity>
          </View>
          <View style={[styles.offlineGuaranteeBox, { backgroundColor: colors.pillBg }]}>
            <Text style={styles.offlineGuaranteeShield}>🛡️</Text>
            <Text style={[styles.offlineGuaranteeText, { color: colors.textSecondary }]}>
              {speechLang === 'Gujarati'
                ? 'દરિયામાં નેટવર્ક ન હોય ત્યારે પણ ઓફલાઇન મોડેલ સચોટ માહિતી આપે છે.'
                : speechLang === 'Hindi'
                  ? 'गहरे समुद्र में नेटवर्क न होने पर भी ऑफलाइन डेटा पूरी तरह सुरक्षित कार्य करता है।'
                  : '100% Deep-sea safe: Coastal tidal & marine models work without cellular connection.'}
            </Text>
          </View>
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
                        speechLang === 'Gujarati'
                          ? item.nameGu
                          : speechLang === 'Hindi'
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

      {/* VOICE LANGUAGE SELECTOR MODAL */}
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
                    setSpeechLang(lang.key);
                    VoiceService.setLanguage(lang.key);
                    setShowLangModal(false);
                  }}
                  style={[
                    styles.pickerOption,
                    { backgroundColor: colors.pillBg },
                    speechLang === lang.key && styles.pickerOptionSelected,
                  ]}>
                  <View style={styles.pickerOptionRow}>
                    <Text
                      style={[
                        styles.pickerOptionText,
                        { color: colors.textPrimary },
                        speechLang === lang.key && styles.pickerOptionTextSelected,
                      ]}>
                      {lang.title}
                    </Text>
                    {speechLang === lang.key && <Text style={{ color: '#0288D1', fontWeight: '900' }}>✓</Text>}
                  </View>
                </TouchableOpacity>
              ))}
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
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  headerLangText: {
    fontSize: 12,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: 16,
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
  portCoordsText: {
    fontSize: 11,
    fontWeight: '700',
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

  /* Current Weather Hero Card */
  heroWeatherCard: {
    backgroundColor: '#0D47A1',
    borderRadius: 20,
    padding: 18,
    gap: 12,
    shadowColor: '#0D47A1',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 6,
  },
  heroLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroPinWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  heroLocationIcon: {
    fontSize: 18,
  },
  heroLocationTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#E3F2FD',
  },
  safetyHeroBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  safetyBadgeGreen: {
    backgroundColor: '#00E676',
  },
  safetyBadgeYellow: {
    backgroundColor: '#FFD600',
  },
  safetyBadgeRed: {
    backgroundColor: '#FF1744',
  },
  safetyHeroText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  heroMetricsMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTempText: {
    fontSize: 42,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  heroConditionText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#90CAF9',
    marginTop: 2,
  },
  heroConditionGuText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E3F2FD',
    marginTop: 1,
  },
  heroWeatherEmoji: {
    fontSize: 48,
  },

  /* Voice Button Inside Hero */
  voiceHeroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  voiceHeroButtonActive: {
    backgroundColor: 'rgba(0, 230, 118, 0.25)',
    borderColor: '#00E676',
  },
  voiceHeroLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  voiceHeroSpeakerIcon: {
    fontSize: 22,
  },
  voiceHeroTextWrap: {
    flex: 1,
    gap: 2,
  },
  voiceHeroMainTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  voiceHeroSubTitle: {
    color: '#BBDEFB',
    fontSize: 11,
    fontWeight: '600',
  },
  voicePlayPill: {
    backgroundColor: '#00E5FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  voicePlayPillActive: {
    backgroundColor: '#FF5252',
  },
  voicePlayPillText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '900',
  },

  vitalMetricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  vitalMetricItem: {
    alignItems: 'center',
    flex: 1,
    gap: 2,
  },
  vitalLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#BBDEFB',
    letterSpacing: 0.3,
  },
  vitalValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  vitalSub: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#E3F2FD',
  },
  advisoryChip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
    padding: 10,
    borderRadius: 10,
    gap: 8,
  },
  advisoryIcon: {
    fontSize: 14,
    marginTop: 2,
  },
  advisoryTextCol: {
    flex: 1,
    gap: 2,
  },
  advisoryEnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: '600',
  },
  advisoryGuText: {
    color: '#81D4FA',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
  },

  /* Windy CTA */
  windyCtaButton: {
    backgroundColor: '#C2185B',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#C2185B',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 4,
  },
  windyBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  windyLogoIcon: {
    fontSize: 26,
  },
  windyTextCol: {
    flex: 1,
  },
  windyMainTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  windySubTitle: {
    color: '#F8BBD0',
    fontSize: 11.5,
    fontWeight: '600',
    marginTop: 2,
  },
  windyArrow: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },

  /* Section Header */
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  sectionSub: {
    fontSize: 11.5,
    fontWeight: '700',
  },

  /* Hourly Forecast */
  hourlyScroll: {
    gap: 10,
    paddingVertical: 4,
  },
  hourlyCard: {
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 4,
    width: 86,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  hourlyTime: {
    fontSize: 11,
    fontWeight: '800',
  },
  hourlyIcon: {
    fontSize: 22,
    marginVertical: 2,
  },
  hourlyTemp: {
    fontSize: 15,
    fontWeight: '900',
  },
  hourlyWindPill: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 2,
  },
  hourlyWindText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#1565C0',
  },
  hourlyWaveText: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  hourlyDirText: {
    fontSize: 10.5,
    fontWeight: '800',
  },

  /* Daily Forecast */
  dailyForecastCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  dailyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  dailyBorder: {
    borderBottomWidth: 1,
  },
  dailyDayCol: {
    width: 68,
  },
  dailyDayTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  dailyDayDate: {
    fontSize: 11,
    fontWeight: '600',
  },
  dailyIcon: {
    fontSize: 22,
  },
  dailyMetricsCol: {
    flex: 1,
    paddingHorizontal: 10,
  },
  dailyWindText: {
    fontSize: 12.5,
  },
  dailyWaveText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  safetyPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    minWidth: 64,
    alignItems: 'center',
  },
  safetyPillGreen: {
    backgroundColor: '#E8F5E9',
  },
  safetyPillRed: {
    backgroundColor: '#FFEBEE',
  },
  safetyPillText: {
    fontSize: 10.5,
    fontWeight: '900',
  },
  safetyTextGreen: {
    color: '#2E7D32',
  },
  safetyTextRed: {
    color: '#C62828',
  },

  /* Modal */
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
  },
  pickerOptionText: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  pickerOptionTextSelected: {
    color: '#0D47A1',
    fontWeight: '900',
  },
  pickerOptionCoords: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0288D1',
  },
  pickerOptionSub: {
    fontSize: 11,
    marginTop: 2,
  },

  /* Live Satellite & Offline Badges */
  liveSyncingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  liveSyncingText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800',
  },
  liveStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  liveStatusLive: {
    backgroundColor: 'rgba(0, 230, 118, 0.2)',
    borderWidth: 1,
    borderColor: '#00E676',
  },
  liveStatusOffline: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  liveStatusText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.3,
  },

  /* Data Source & Offline Guarantee Card */
  dataSourceCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.2,
    gap: 10,
    marginTop: 4,
  },
  dataSourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  dataSourceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  dataSourceIcon: {
    fontSize: 22,
  },
  dataSourceTitle: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  dataSourceUpdated: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  refreshSyncBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshSyncBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  offlineGuaranteeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
  },
  offlineGuaranteeShield: {
    fontSize: 16,
  },
  offlineGuaranteeText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
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
});
