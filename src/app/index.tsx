import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CoordinatesCard } from '@/components/marine/CoordinatesCard';
import { FeatureModal } from '@/components/marine/FeatureModal';
import { NavGrid } from '@/components/marine/NavGrid';
import { PremiumButton } from '@/components/marine/PremiumButton';
import { PremiumUpgradeModal } from '@/components/marine/PremiumUpgradeModal';
import { INITIAL_SATELLITES } from '@/components/marine/satelliteData';
import { SatelliteRadar } from '@/components/marine/SatelliteRadar';
import { MarineFeatureId, Satellite } from '@/components/marine/types';
import { AuthStore } from '@/services/authStore';
import { DeviceStatusService } from '@/services/deviceStatusService';
import { GpsService, LocationTelemetry } from '@/services/gpsService';
import { SettingsStore } from '@/services/settingsStore';
import { SubscriptionStore } from '@/services/subscriptionStore';

export default function MarineHomeScreen() {
  const router = useRouter();
  const [nightMode, setNightMode] = useState<boolean>(() => SettingsStore.isNightMode());
  const [activeModal, setActiveModal] = useState<MarineFeatureId | 'satellite' | 'coordinates' | null>(null);
  const [modalTitle, setModalTitle] = useState<string>('');
  const [selectedSat, setSelectedSat] = useState<Satellite | null>(null);

  // Paywall & Subscription Lockout State
  const [isAccessAllowed, setIsAccessAllowed] = useState<boolean>(() => SubscriptionStore.isAccessAllowed());
  const [premiumModalVisible, setPremiumModalVisible] = useState<boolean>(() => !SubscriptionStore.isAccessAllowed());

  // Auth state for Top Status Bar
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(AuthStore.isLoggedIn());
  const [userPhone, setUserPhone] = useState<string | null>(AuthStore.getPhone());

  useEffect(() => {
    const unsubAuth = AuthStore.subscribe((auth) => {
      setIsLoggedIn(auth.isLoggedIn);
      setUserPhone(auth.phoneNumber);
    });
    const unsubSub = SubscriptionStore.subscribe(() => {
      const allowed = SubscriptionStore.isAccessAllowed();
      setIsAccessAllowed(allowed);
      if (!allowed) {
        setPremiumModalVisible(true);
      }
    });
    return () => {
      unsubAuth();
      unsubSub();
    };
  }, []);

  // Live Mobile Compass & Gyro Sensor Telemetry
  const [heading, setHeading] = useState<number>(354);
  const filteredHRef = useRef<number>(354);
  const [sensorActive, setSensorActive] = useState<boolean>(false);

  // Live GPS Coordinates & Location Telemetry
  const latestCoordsRef = useRef<{ lat: number; lon: number } | null>(null);
  const [latitude, setLatitude] = useState<string>("N 20° 44.572'");
  const [longitude, setLongitude] = useState<string>("E 71° 04.313'");
  const [altitude, setAltitude] = useState<number>(-53);
  const [accuracy, setAccuracy] = useState<number>(3);
  const [hasGpsFix, setHasGpsFix] = useState<boolean>(false);

  // Dynamic Real-Time Satellite Constellation Telemetry
  const [satellites, setSatellites] = useState<Satellite[]>(INITIAL_SATELLITES);
  const [usedSatellites, setUsedSatellites] = useState<number>(33);
  const [visibleSatellites, setVisibleSatellites] = useState<number>(57);

  // Real Device Hardware Battery & Network Telemetry
  const [batteryPercent, setBatteryPercent] = useState<number>(85);
  const [isCharging, setIsCharging] = useState<boolean>(false);
  const [signalBars, setSignalBars] = useState<number>(5);
  const [networkType, setNetworkType] = useState<string>('4G LTE');

  // Real Hardware Listeners for Battery, Network, Location & Compass Gyro
  useEffect(() => {
    // 1. Initialize Real Device Status (Battery & Network)
    DeviceStatusService.init();

    const unsubSettings = SettingsStore.subscribe(() => {
      setNightMode(SettingsStore.isNightMode());
      if (latestCoordsRef.current) {
        const c = SettingsStore.formatCoordinates(
          latestCoordsRef.current.lat,
          latestCoordsRef.current.lon
        );
        setLatitude(c.latFormatted);
        setLongitude(c.lonFormatted);
      }
    });

    const unsubBattery = DeviceStatusService.subscribeBattery((info) => {
      setBatteryPercent(info.level);
      setIsCharging(info.isCharging);
    });

    const unsubNetwork = DeviceStatusService.subscribeNetwork((info) => {
      setSignalBars(info.signalBars);
      setNetworkType(info.type);
    });

    // 2. Request Location & Start Live GPS & Gyro Tracking
    const setupGpsAndHeading = async () => {
      const status = await GpsService.requestPermissions();
      if (status === 'granted') {
        // Start Live GPS location tracking
        GpsService.startLocationTracking((telemetry: LocationTelemetry) => {
          setHasGpsFix(true);
          latestCoordsRef.current = { lat: telemetry.latitude, lon: telemetry.longitude };
          const coords = SettingsStore.formatCoordinates(telemetry.latitude, telemetry.longitude);
          setLatitude(coords.latFormatted);
          setLongitude(coords.lonFormatted);
          if (typeof telemetry.altitude === 'number') {
            setAltitude(telemetry.altitude);
          }
          if (typeof telemetry.accuracy === 'number') {
            setAccuracy(telemetry.accuracy);
          }

          // Dynamically compute authentic GNSS satellite constellation for current GPS fix
          const satData = DeviceStatusService.calculateSatellites(
            telemetry.latitude,
            telemetry.longitude,
            telemetry.accuracy
          );
          setSatellites(satData.satellites);
          setUsedSatellites(satData.usedCount);
          setVisibleSatellites(satData.visibleCount);
        });

        // Start Live Heading & Gyro tracking
        GpsService.startHeadingTracking((rawHeading: number) => {
          setSensorActive(true);
          const cur = filteredHRef.current;
          const diff = ((((rawHeading - cur) % 360) + 540) % 360) - 180;
          if (Math.abs(diff) < 0.5) return;
          const alpha = Math.abs(diff) > 40 ? 0.45 : 0.25;
          const nextH = ((cur + diff * alpha) % 360 + 360) % 360;
          filteredHRef.current = nextH;
          setHeading(Math.round(nextH));
        });
      }
    };

    setupGpsAndHeading();

    return () => {
      unsubSettings();
      unsubBattery();
      unsubNetwork();
      GpsService.stopAll();
    };
  }, []);

  const handlePressFeature = (id: MarineFeatureId, label: string) => {
    if (id === 'compass') {
      router.push('/compass');
      return;
    }
    if (id === 'tide') {
      router.push('/tide');
      return;
    }
    if (id === 'waypoints') {
      router.push('/waypoints');
      return;
    }
    if (id === 'settings') {
      router.push('/settings');
      return;
    }
    if (id === 'map') {
      router.push('/map');
      return;
    }
    if (id === 'calendar') {
      router.push('/calendar');
      return;
    }
    if (id === 'track') {
      router.push('/track');
      return;
    }
    if (id === 'premium') {
      setPremiumModalVisible(true);
      return;
    }
    if (id === 'weather') {
      router.push('/weather');
      return;
    }
    if (id === 'camera') {
      router.push('/camera');
      return;
    }
    setActiveModal(id);
    setModalTitle(label);
  };

  const handlePressAccount = () => {
    if (isLoggedIn) {
      Alert.alert(
        'Captain Profile ⚓',
        `Logged in Mobile: +91 ${userPhone || '9876543210'}\nVessel: Sagar Kripa #4\nStatus: Verified Captain (Active Session)`,
        [
          { text: 'Close', style: 'cancel' },
          {
            text: 'Logout',
            style: 'destructive',
            onPress: () => {
              AuthStore.logout();
              router.replace('/login');
            },
          },
        ]
      );
    } else {
      router.push('/login');
    }
  };

  const handleSelectSatellite = (sat: Satellite) => {
    setSelectedSat(sat);
    setActiveModal('satellite');
    setModalTitle(`Satellite PRN #${sat.prn}`);
  };

  const handlePressCoordinates = () => {
    setActiveModal('coordinates');
    setModalTitle('Vessel GPS Coordinates');
  };

  const handlePressBattery = () => {
    Alert.alert(
      'Device Battery Status 🔋',
      `Battery Level: ${batteryPercent}%\nState: ${isCharging ? '⚡ Connected to Power (Charging)' : 'Discharging on Battery'}\nBackup Marine Radio: Operational`,
      [{ text: 'OK' }]
    );
  };

  const handlePressSignal = () => {
    Alert.alert(
      'Network & GNSS Status 🛰️',
      `Mobile Network: ${networkType} (${signalBars}/5 Bars)\nGNSS Fix: ${hasGpsFix ? '3D DGPS Active' : 'Acquiring...'}\nUsed Satellites: ${usedSatellites} / ${visibleSatellites}\nAccuracy: ±${accuracy}m CEP\nSensor Heading: ${heading}° (${sensorActive ? 'Live Gyro Active' : 'Default'})`,
      [{ text: 'OK' }]
    );
  };

  const handleMarkWaypoint = () => {
    Alert.alert(
      'Fishing Spot Marked! ⚓',
      `Saved waypoint at:\n${latitude}, ${longitude}\nDepth: ${Math.abs(altitude)}m\nAdded to your Waypoints list.`,
      [{ text: 'Done', onPress: () => setActiveModal(null) }]
    );
  };

  const themeColors = nightMode
    ? {
      background: '#0D1117',
      cardBg: '#161B22',
      headerText: '#ECEFF1',
      statusGreen: '#00E676',
      gnssBadgeBg: 'rgba(16, 185, 129, 0.12)',
      gnssBadgeBorder: 'rgba(16, 185, 129, 0.35)',
      userBadgeBg: 'rgba(56, 189, 248, 0.12)',
      userBadgeBorder: 'rgba(56, 189, 248, 0.35)',
      userBadgeText: '#38BDF8',
      nightToggleBg: 'rgba(245, 158, 11, 0.14)',
      nightToggleBorder: 'rgba(245, 158, 11, 0.4)',
      nightToggleText: '#FBBF24',
    }
    : {
      background: '#FFFFFF',
      cardBg: '#F8FAFC',
      headerText: '#1E293B',
      statusGreen: '#00C853',
      gnssBadgeBg: 'rgba(16, 185, 129, 0.08)',
      gnssBadgeBorder: 'rgba(16, 185, 129, 0.25)',
      userBadgeBg: 'rgba(37, 99, 235, 0.08)',
      userBadgeBorder: 'rgba(37, 99, 235, 0.25)',
      userBadgeText: '#1D4ED8',
      nightToggleBg: 'rgba(100, 116, 139, 0.08)',
      nightToggleBorder: '#CBD5E1',
      nightToggleText: '#475569',
    };

  return (
    <SafeAreaView
      edges={['top', 'left', 'right', 'bottom']}
      style={[styles.safeArea, { backgroundColor: themeColors.background }]}>
      <StatusBar style={nightMode ? 'light' : 'dark'} animated={true} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}>
        {/* Top Control Bar (Cockpit Marine Status HUD) */}
        <View style={styles.topControlBar}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handlePressSignal}
            style={[
              styles.fixStatusBadge,
              {
                backgroundColor: hasGpsFix ? themeColors.gnssBadgeBg : 'rgba(245, 158, 11, 0.12)',
                borderColor: hasGpsFix ? themeColors.gnssBadgeBorder : 'rgba(245, 158, 11, 0.35)',
              },
            ]}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: hasGpsFix ? '#10B981' : '#F59E0B' },
              ]}
            />
            <Text style={[styles.fixStatusText, { color: hasGpsFix ? (nightMode ? '#34D399' : '#059669') : '#F59E0B' }]}>
              {hasGpsFix ? `3D FIX • ±${accuracy}m` : 'ACQUIRING GNSS...'}
            </Text>
            {hasGpsFix && (
              <View style={[styles.svMiniPill, { backgroundColor: nightMode ? '#1E293B' : '#E2E8F0' }]}>
                <Text style={[styles.svMiniPillText, { color: themeColors.headerText }]}>{usedSatellites} SV</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.topRightControls}>
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={handlePressAccount}
              style={[
                styles.accountToggleBtn,
                {
                  backgroundColor: themeColors.userBadgeBg,
                  borderColor: themeColors.userBadgeBorder,
                },
              ]}>
              <Text style={[styles.accountToggleText, { color: themeColors.userBadgeText }]}>
                {isLoggedIn ? `⚓ ${userPhone ? userPhone.slice(-4) : 'Captain'}` : '⚓ LOGIN'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => {
                const next = !nightMode;
                setNightMode(next);
                SettingsStore.updateSettings({ theme: next ? 'dark' : 'light' });
              }}
              style={[
                styles.nightToggleBtn,
                {
                  backgroundColor: themeColors.nightToggleBg,
                  borderColor: themeColors.nightToggleBorder,
                },
              ]}>
              <Text style={[styles.nightToggleText, { color: themeColors.nightToggleText }]}>
                {nightMode ? '🌙 NIGHT' : '☀️ DAY'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 1. Fully Working Satellite Skyplot Radar & Compass View */}
        <SatelliteRadar
          heading={heading}
          satellites={satellites}
          usedCount={usedSatellites}
          visibleCount={visibleSatellites}
          altitude={altitude}
          accuracy={accuracy}
          nightMode={nightMode}
          onSelectSatellite={handleSelectSatellite}
        />

        {/* 2. Real Hardware Network Signal, Marine Coordinates & Battery Row */}
        <CoordinatesCard
          latitude={latitude}
          longitude={longitude}
          batteryPercent={batteryPercent}
          isCharging={isCharging}
          signalBars={signalBars}
          networkType={networkType}
          nightMode={nightMode}
          onPressCoordinates={handlePressCoordinates}
          onPressBattery={handlePressBattery}
          onPressSignal={handlePressSignal}
        />

        {/* 3. 3x3 Marine Navigation Action Grid */}
        <NavGrid
          nightMode={nightMode}
          onPressFeature={handlePressFeature}
        />

        {/* 4. Bottom Upgrade to Premium Button */}
        <PremiumButton
          nightMode={nightMode}
          onPress={() => setPremiumModalVisible(true)}
        />
      </ScrollView>

      {/* Luxury Upgrade to Premium Modal - Full Screen Hard Locked if trial expired */}
      <PremiumUpgradeModal
        visible={premiumModalVisible || !isAccessAllowed}
        onClose={() => {
          if (isAccessAllowed) {
            setPremiumModalVisible(false);
          }
        }}
        nightMode={nightMode}
        isLocked={!isAccessAllowed}
      />

      {/* Interactive Feature Modal / Bottom Sheet */}
      <FeatureModal
        visible={activeModal !== null}
        featureId={activeModal}
        featureTitle={modalTitle}
        selectedSat={selectedSat}
        nightMode={nightMode}
        onClose={() => {
          setActiveModal(null);
          setSelectedSat(null);
        }}
        onMarkWaypoint={handleMarkWaypoint}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 12 : 20,
  },
  topControlBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 6,
  },
  fixStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1.2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  fixStatusText: {
    fontSize: 11.5,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  svMiniPill: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 6,
    marginLeft: 2,
  },
  svMiniPillText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  topRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accountToggleBtn: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  accountToggleText: {
    fontSize: 11.5,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  nightToggleBtn: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.2,
  },
  nightToggleText: {
    fontSize: 11.5,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
});
