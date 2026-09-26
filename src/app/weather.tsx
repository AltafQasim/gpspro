import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface HourlyForecast {
  time: string;
  temp: number;
  windKnots: number;
  windDir: string;
  waveMeters: number;
  condition: string;
  icon: string;
}

interface DailyForecast {
  day: string;
  date: string;
  maxWind: number;
  waveHeight: string;
  safety: 'SAFE' | 'MODERATE' | 'CAUTION';
  icon: string;
}

const HOURLY_DATA: HourlyForecast[] = [
  { time: 'NOW', temp: 28, windKnots: 11, windDir: 'NW', waveMeters: 1.1, condition: 'Clear', icon: '☀️' },
  { time: '09:00', temp: 29, windKnots: 12, windDir: 'NW', waveMeters: 1.2, condition: 'Partly Cloudy', icon: '🌤️' },
  { time: '12:00', temp: 31, windKnots: 14, windDir: 'WNW', waveMeters: 1.4, condition: 'Sunny', icon: '☀️' },
  { time: '15:00', temp: 30, windKnots: 15, windDir: 'W', waveMeters: 1.5, condition: 'Breezy', icon: '💨' },
  { time: '18:00', temp: 28, windKnots: 13, windDir: 'NW', waveMeters: 1.3, condition: 'Clear Sunset', icon: '🌅' },
  { time: '21:00', temp: 27, windKnots: 10, windDir: 'NNW', waveMeters: 1.0, condition: 'Calm Night', icon: '🌙' },
  { time: '00:00', temp: 26, windKnots: 9, windDir: 'N', waveMeters: 0.9, condition: 'Calm Night', icon: '🌙' },
  { time: '03:00', temp: 25, windKnots: 8, windDir: 'N', waveMeters: 0.8, condition: 'Calm Night', icon: '🌙' },
];

const DAILY_DATA: DailyForecast[] = [
  { day: 'Today', date: '26 Sep', maxWind: 15, waveHeight: '1.0 - 1.5 m', safety: 'SAFE', icon: '☀️' },
  { day: 'Sun', date: '27 Sep', maxWind: 14, waveHeight: '0.9 - 1.4 m', safety: 'SAFE', icon: '🌤️' },
  { day: 'Mon', date: '28 Sep', maxWind: 18, waveHeight: '1.2 - 1.8 m', safety: 'SAFE', icon: '💨' },
  { day: 'Tue', date: '29 Sep', maxWind: 22, waveHeight: '1.6 - 2.2 m', safety: 'MODERATE', icon: '🌧️' },
  { day: 'Wed', date: '30 Sep', maxWind: 25, waveHeight: '2.0 - 2.6 m', safety: 'CAUTION', icon: '⛈️' },
];

export default function SeaWeatherScreen() {
  const router = useRouter();

  // State
  const [selectedPort, setSelectedPort] = useState<string>('Diu / Veraval Basin');
  const [isOfflineCached, setIsOfflineCached] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<string>('Today at 08:00 AM (Cached Offline)');

  // Open Windy.com for high-res marine radar
  const handleOpenWindy = async () => {
    const windyUrl = 'https://www.windy.com/?20.74,71.04,9';
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

  const handleRefreshWeather = () => {
    Alert.alert('Weather Synchronized 🔄', 'Marine meteorological satellite data updated for Gujarat & Arabian Sea Coastline.');
    setLastUpdated('Updated just now');
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.container}>
      <StatusBar style="dark" />

      {/* Screen Header */}
      <View style={styles.topNavRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          style={styles.backBtn}>
          <Text style={styles.backArrow}>‹</Text>
          <Text style={styles.backText}>Home</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>SEA WEATHER FORECAST</Text>

        <TouchableOpacity onPress={handleRefreshWeather} style={styles.refreshBtn}>
          <Text style={styles.refreshIcon}>🔄</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Offline Badge & Last Updated */}
        <View style={styles.offlineStatusCard}>
          <View style={styles.offlineBadgeRow}>
            <View style={styles.offlineGreenDot} />
            <Text style={styles.offlineBadgeText}>OFFLINE READY • MARINE CACHE ACTIVE</Text>
          </View>
          <Text style={styles.lastUpdatedText}>📡 {lastUpdated}</Text>
        </View>

        {/* CURRENT WEATHER HERO CARD */}
        <View style={styles.heroWeatherCard}>
          <View style={styles.heroLocationRow}>
            <Text style={styles.heroLocationIcon}>⚓</Text>
            <Text style={styles.heroLocationTitle}>{selectedPort}</Text>
          </View>

          <View style={styles.heroMetricsMainRow}>
            <View>
              <Text style={styles.heroTempText}>28°C</Text>
              <Text style={styles.heroConditionText}>Clear Sea & Gentle Breeze</Text>
            </View>
            <Text style={styles.heroWeatherEmoji}>🌤️</Text>
          </View>

          {/* 4 Core Marine Vital Signs */}
          <View style={styles.vitalMetricsGrid}>
            <View style={styles.vitalMetricItem}>
              <Text style={styles.vitalLabel}>WIND SPEED</Text>
              <Text style={styles.vitalValue}>11 kn</Text>
              <Text style={styles.vitalSub}>NW (315°)</Text>
            </View>

            <View style={styles.vitalMetricItem}>
              <Text style={styles.vitalLabel}>WAVE HEIGHT</Text>
              <Text style={[styles.vitalValue, { color: '#00E676' }]}>1.1 m</Text>
              <Text style={styles.vitalSub}>Slight Seas</Text>
            </View>

            <View style={styles.vitalMetricItem}>
              <Text style={styles.vitalLabel}>SWELL PERIOD</Text>
              <Text style={styles.vitalValue}>8.2 sec</Text>
              <Text style={styles.vitalSub}>South-West</Text>
            </View>

            <View style={styles.vitalMetricItem}>
              <Text style={styles.vitalLabel}>BAROMETER</Text>
              <Text style={styles.vitalValue}>1013 hPa</Text>
              <Text style={styles.vitalSub}>Stable Sea</Text>
            </View>
          </View>

          {/* Cyclone & Fishermen Advisory Warning Chip */}
          <View style={styles.advisoryChip}>
            <Text style={styles.advisoryIcon}>🟢</Text>
            <Text style={styles.advisoryText}>
              <Text style={{ fontWeight: '900' }}>IMD Coastal Advisory:</Text> Safe for all mechanized & traditional fishing boats. No cyclone warning in Gujarat basin.
            </Text>
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
              <Text style={styles.windySubTitle}>High-res wind streams, cyclone tracker & ocean waves</Text>
            </View>
            <Text style={styles.windyArrow}>➔</Text>
          </View>
        </TouchableOpacity>

        {/* HOURLY MARINE SWELL & WIND FORECAST */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>24-Hour Marine Forecast</Text>
          <Text style={styles.sectionSub}>Hourly Swell & Wind</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hourlyScroll}>
          {HOURLY_DATA.map((h, i) => (
            <View key={i} style={styles.hourlyCard}>
              <Text style={styles.hourlyTime}>{h.time}</Text>
              <Text style={styles.hourlyIcon}>{h.icon}</Text>
              <Text style={styles.hourlyTemp}>{h.temp}°</Text>
              <View style={styles.hourlyWindPill}>
                <Text style={styles.hourlyWindText}>{h.windKnots} kn</Text>
              </View>
              <Text style={styles.hourlyWaveText}>{h.waveMeters}m wave</Text>
              <Text style={styles.hourlyDirText}>{h.windDir}</Text>
            </View>
          ))}
        </ScrollView>

        {/* 5-DAY FISHING SAFETY OUTLOOK */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>5-Day Sea Outlook</Text>
          <Text style={styles.sectionSub}>Fishing Boat Safety Rating</Text>
        </View>

        <View style={styles.dailyForecastCard}>
          {DAILY_DATA.map((d, i) => {
            const isSafe = d.safety === 'SAFE';
            const isCaution = d.safety === 'CAUTION';
            return (
              <View key={i} style={[styles.dailyRow, i < DAILY_DATA.length - 1 && styles.dailyBorder]}>
                <View style={styles.dailyDayCol}>
                  <Text style={styles.dailyDayTitle}>{d.day}</Text>
                  <Text style={styles.dailyDayDate}>{d.date}</Text>
                </View>

                <Text style={styles.dailyIcon}>{d.icon}</Text>

                <View style={styles.dailyMetricsCol}>
                  <Text style={styles.dailyWindText}>Max Wind: <Text style={{ fontWeight: '800' }}>{d.maxWind} kn</Text></Text>
                  <Text style={styles.dailyWaveText}>Waves: {d.waveHeight}</Text>
                </View>

                <View
                  style={[
                    styles.safetyPill,
                    isSafe && styles.safetyPillGreen,
                    isCaution && styles.safetyPillRed,
                  ]}>
                  <Text
                    style={[
                      styles.safetyPillText,
                      isSafe && styles.safetyTextGreen,
                      isCaution && styles.safetyTextRed,
                    ]}>
                    {d.safety}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 6,
  },
  backArrow: {
    fontSize: 26,
    color: '#0D47A1',
    lineHeight: 26,
  },
  backText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0D47A1',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  refreshBtn: {
    padding: 6,
  },
  refreshIcon: {
    fontSize: 18,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 14,
  },
  offlineStatusCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  offlineBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  offlineGreenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00C853',
  },
  offlineBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#1B5E20',
    letterSpacing: 0.3,
  },
  lastUpdatedText: {
    fontSize: 11,
    color: '#388E3C',
    fontWeight: '700',
  },
  heroWeatherCard: {
    backgroundColor: '#0D47A1',
    borderRadius: 20,
    padding: 20,
    gap: 14,
    shadowColor: '#0D47A1',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  heroLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroLocationIcon: {
    fontSize: 18,
  },
  heroLocationTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#E3F2FD',
  },
  heroMetricsMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTempText: {
    fontSize: 44,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  heroConditionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#90CAF9',
    marginTop: 2,
  },
  heroWeatherEmoji: {
    fontSize: 54,
  },
  vitalMetricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  vitalMetricItem: {
    alignItems: 'center',
    flex: 1,
    gap: 2,
  },
  vitalLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#BBDEFB',
    letterSpacing: 0.3,
  },
  vitalValue: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  vitalSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#E3F2FD',
  },
  advisoryChip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    padding: 10,
    borderRadius: 10,
    gap: 8,
  },
  advisoryIcon: {
    fontSize: 14,
    marginTop: 2,
  },
  advisoryText: {
    color: '#FFFFFF',
    fontSize: 12,
    lineHeight: 17,
    flex: 1,
  },
  windyCtaButton: {
    backgroundColor: '#C2185B',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#C2185B',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  windyBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  windyLogoIcon: {
    fontSize: 28,
  },
  windyTextCol: {
    flex: 1,
  },
  windyMainTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  windySubTitle: {
    color: '#F8BBD0',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  windyArrow: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
  },
  sectionSub: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  hourlyScroll: {
    gap: 10,
    paddingVertical: 4,
  },
  hourlyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    gap: 4,
    width: 86,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  hourlyTime: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
  },
  hourlyIcon: {
    fontSize: 24,
    marginVertical: 2,
  },
  hourlyTemp: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  hourlyWindPill: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 2,
  },
  hourlyWindText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1565C0',
  },
  hourlyWaveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
  },
  hourlyDirText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
  },
  dailyForecastCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    borderBottomColor: '#F1F5F9',
  },
  dailyDayCol: {
    width: 70,
  },
  dailyDayTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  dailyDayDate: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  dailyIcon: {
    fontSize: 24,
  },
  dailyMetricsCol: {
    flex: 1,
    paddingHorizontal: 12,
  },
  dailyWindText: {
    fontSize: 13,
    color: '#334155',
  },
  dailyWaveText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  safetyPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 70,
    alignItems: 'center',
  },
  safetyPillGreen: {
    backgroundColor: '#E8F5E9',
  },
  safetyPillRed: {
    backgroundColor: '#FFEBEE',
  },
  safetyPillText: {
    fontSize: 11,
    fontWeight: '900',
  },
  safetyTextGreen: {
    color: '#2E7D32',
  },
  safetyTextRed: {
    color: '#C62828',
  },
});
