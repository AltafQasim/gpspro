import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
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
import {
  calculateDistanceKm,
  MARINE_PORTS_DATABASE,
  MarinePortInfo,
} from '@/services/marineData';
import { SettingsStore } from '@/services/settingsStore';
import { SubscriptionStore } from '@/services/subscriptionStore';

export default function MarineHomeScreen() {
  const router = useRouter();
  const [nightMode, setNightMode] = useState<boolean>(() => SettingsStore.isNightMode());
  const [activeModal, setActiveModal] = useState<MarineFeatureId | 'satellite' | 'coordinates' | null>(null);
  const [modalTitle, setModalTitle] = useState<string>('');
  const [selectedSat, setSelectedSat] = useState<Satellite | null>(null);

  // Global Active Port Selection State (Synchronized across all screens)
  const [selectedPortId, setSelectedPortId] = useState<string>(() => SettingsStore.getSelectedPortId());
  const [showPortModal, setShowPortModal] = useState<boolean>(false);
  const [portSearchText, setPortSearchText] = useState<string>('');

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

  // Active Selected Marine Port
  const activePort: MarinePortInfo = useMemo(() => {
    return (
      MARINE_PORTS_DATABASE.find((p) => p.id === selectedPortId) ||
      MARINE_PORTS_DATABASE[0]
    );
  }, [selectedPortId]);

  // Filtered & Distance-Sorted Ports List for the Modal
  const filteredAndSortedPorts = useMemo(() => {
    const query = portSearchText.trim().toLowerCase();
    const list = MARINE_PORTS_DATABASE.map((p) => {
      const distanceKm = latestCoordsRef.current
        ? calculateDistanceKm(
            latestCoordsRef.current.lat,
            latestCoordsRef.current.lon,
            p.lat,
            p.lon
          )
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

    if (latestCoordsRef.current) {
      return [...filtered].sort((a, b) => (a.distanceKm ?? 99999) - (b.distanceKm ?? 99999));
    }
    return filtered;
  }, [portSearchText, hasGpsFix]);

  // Real Hardware Listeners for Battery, Network, Location & Compass Gyro
  useEffect(() => {
    DeviceStatusService.init();

    const unsubSettings = SettingsStore.subscribe((s) => {
      setNightMode(SettingsStore.isNightMode());
      if (s.selectedPortId && s.selectedPortId !== selectedPortId) {
        setSelectedPortId(s.selectedPortId);
      }
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

    const setupGpsAndHeading = async () => {
      const status = await GpsService.requestPermissions();
      if (status === 'granted') {
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

          const satData = DeviceStatusService.calculateSatellites(
            telemetry.latitude,
            telemetry.longitude,
            telemetry.accuracy
          );
          setSatellites(satData.satellites);
          setUsedSatellites(satData.usedCount);
          setVisibleSatellites(satData.visibleCount);
        });

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
  }, [selectedPortId]);

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
          {/* LEFT SIDE: PORT SELECTOR DROPDOWN (Replaces 3D FIX badge) */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => setShowPortModal(true)}
            style={[
              styles.portSelectBtn,
              {
                backgroundColor: nightMode
                  ? 'rgba(0, 229, 255, 0.12)'
                  : 'rgba(2, 136, 209, 0.10)',
                borderColor: nightMode
                  ? 'rgba(0, 229, 255, 0.35)'
                  : 'rgba(2, 136, 209, 0.30)',
              },
            ]}>
            <Text style={styles.portSelectIcon}>⚓</Text>
            <View style={styles.portSelectTextGroup}>
              <Text
                numberOfLines={1}
                style={[
                  styles.portSelectTitle,
                  { color: nightMode ? '#00E5FF' : '#0288D1' },
                ]}>
                {activePort.nameGu}
              </Text>
              <Text
                numberOfLines={1}
                style={[
                  styles.portSelectSubtitle,
                  { color: themeColors.headerText },
                ]}>
                {activePort.name}
              </Text>
            </View>
            <Text
              style={[
                styles.portSelectArrow,
                { color: nightMode ? '#00E5FF' : '#0288D1' },
              ]}>
              ▾
            </Text>
          </TouchableOpacity>

          {/* RIGHT SIDE: ACCOUNT PROFILE & NIGHT MODE TOGGLE */}
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

        {/* 1. Tactical Satellite Radar Compass Display */}
        <SatelliteRadar
          heading={heading}
          satellites={satellites}
          usedSatellites={usedSatellites}
          visibleSatellites={visibleSatellites}
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

      {/* GUJARAT ALL BANDARS SELECTOR MODAL WITH GPS DISTANCE (KM) & SEARCH */}
      <Modal visible={showPortModal} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setShowPortModal(false)}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View
                style={[
                  styles.bandarModalCard,
                  {
                    backgroundColor: themeColors.cardBg,
                    borderColor: nightMode ? '#1F2937' : '#E2E8F0',
                  },
                ]}>
                {/* Header */}
                <View style={styles.bandarModalHeader}>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.bandarModalTitle,
                        { color: themeColors.headerText },
                      ]}>
                      ⚓ ગુજરાતના તમામ બંદરો ({MARINE_PORTS_DATABASE.length})
                    </Text>
                    <Text
                      style={[
                        styles.bandarModalSubtitle,
                        { color: nightMode ? '#38BDF8' : '#0288D1' },
                      ]}>
                      {latestCoordsRef.current
                        ? `📍 તમારું સ્થાન: ${latestCoordsRef.current.lat.toFixed(2)}°N, ${latestCoordsRef.current.lon.toFixed(2)}°E • નજીકનું બંદર પહેલાં`
                        : '📍 GPS લોકેશન આધારે કિલોમીટર (km) ગણતરી'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setShowPortModal(false)}
                    style={[
                      styles.modalCloseBtn,
                      {
                        backgroundColor: nightMode
                          ? 'rgba(255, 255, 255, 0.08)'
                          : '#E2E8F0',
                      },
                    ]}>
                    <Text
                      style={[
                        styles.modalCloseText,
                        { color: themeColors.headerText },
                      ]}>
                      ✕
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View
                  style={[
                    styles.bandarSearchBox,
                    {
                      backgroundColor: nightMode ? '#0D1117' : '#FFFFFF',
                      borderColor: nightMode ? '#30363D' : '#CBD5E1',
                    },
                  ]}>
                  <Text style={styles.searchIconText}>🔍</Text>
                  <TextInput
                    value={portSearchText}
                    onChangeText={setPortSearchText}
                    placeholder="બંદર શોધો / Search bandar name..."
                    placeholderTextColor={nightMode ? '#8B949E' : '#64748B'}
                    style={[
                      styles.bandarSearchInput,
                      { color: themeColors.headerText },
                    ]}
                    autoCorrect={false}
                    clearButtonMode="while-editing"
                  />
                  {portSearchText.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setPortSearchText('')}
                      style={styles.searchClearBtn}>
                      <Text
                        style={[
                          styles.searchClearText,
                          { color: nightMode ? '#8B949E' : '#64748B' },
                        ]}>
                        ✕
                      </Text>
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
                      <Text
                        style={[
                          styles.emptyPortText,
                          { color: nightMode ? '#8B949E' : '#64748B' },
                        ]}>
                        કોઈ બંદર મળ્યું નથી ("{portSearchText}")
                      </Text>
                    </View>
                  ) : (
                    filteredAndSortedPorts.map((item, idx) => {
                      const isSelected = selectedPortId === item.id;
                      const isClosest =
                        idx === 0 &&
                        latestCoordsRef.current !== null &&
                        item.distanceKm !== null;

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
                                ? nightMode
                                  ? 'rgba(0, 229, 255, 0.12)'
                                  : 'rgba(2, 136, 209, 0.12)'
                                : nightMode
                                ? '#0D1117'
                                : '#FFFFFF',
                              borderColor: isSelected
                                ? '#0288D1'
                                : nightMode
                                ? '#21262D'
                                : '#E2E8F0',
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
                                    : nightMode
                                    ? '#161B22'
                                    : '#E2E8F0',
                                },
                              ]}>
                              <Text
                                style={{
                                  fontSize: 16,
                                  color: isSelected ? '#FFFFFF' : '#0288D1',
                                }}>
                                ⚓
                              </Text>
                            </View>
                            <View style={styles.bandarNameCol}>
                              <View style={styles.bandarTitleRow}>
                                <Text
                                  style={[
                                    styles.bandarNameMain,
                                    {
                                      color: isSelected
                                        ? '#0288D1'
                                        : themeColors.headerText,
                                      fontWeight: isSelected ? '900' : '700',
                                    },
                                  ]}>
                                  {item.nameGu}
                                </Text>
                                {isClosest && (
                                  <View style={styles.closestTag}>
                                    <Text style={styles.closestTagText}>
                                      સૌથી નજીક / NEAREST
                                    </Text>
                                  </View>
                                )}
                              </View>
                              <Text
                                style={[
                                  styles.bandarNameEn,
                                  {
                                    color: nightMode ? '#8B949E' : '#64748B',
                                  },
                                ]}>
                                {item.name} • {item.regionGu}
                              </Text>
                            </View>
                          </View>

                          <View style={styles.bandarItemRight}>
                            {item.distanceKm !== null && (
                              <View
                                style={[
                                  styles.distancePill,
                                  isClosest && styles.distancePillClosest,
                                ]}>
                                <Text
                                  style={[
                                    styles.distanceNumber,
                                    isClosest && styles.distanceNumberClosest,
                                  ]}>
                                  {item.distanceKm < 1
                                    ? `${Math.round(item.distanceKm * 1000)}m`
                                    : `${item.distanceKm.toFixed(1)} km`}
                                </Text>
                              </View>
                            )}
                            {isSelected && (
                              <View style={styles.activeCheckPill}>
                                <Text style={styles.activeCheckText}>✓ સક્રિય</Text>
                              </View>
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
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 6,
    gap: 8,
  },

  /* Left Port Selector Button (Replaces 3D FIX badge) */
  portSelectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1.2,
    maxWidth: 220,
  },
  portSelectIcon: {
    fontSize: 16,
  },
  portSelectTextGroup: {
    flex: 1,
    gap: 1,
  },
  portSelectTitle: {
    fontSize: 12.5,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  portSelectSubtitle: {
    fontSize: 10,
    fontWeight: '600',
    opacity: 0.8,
  },
  portSelectArrow: {
    fontSize: 12,
    fontWeight: '900',
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

  /* Modal Styles for Bandar Selection */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.70)',
    justifyContent: 'flex-end',
  },
  bandarModalCard: {
    maxHeight: '82%',
    minHeight: '55%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderWidth: 1.5,
    borderBottomWidth: 0,
    gap: 12,
  },
  bandarModalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: 4,
  },
  bandarModalTitle: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.3,
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
    marginLeft: 8,
  },
  modalCloseText: {
    fontSize: 15,
    fontWeight: '900',
  },
  bandarSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.2,
    borderRadius: 12,
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
    fontSize: 13,
    fontWeight: '800',
  },
  bandarScrollView: {
    flex: 1,
  },
  bandarScrollContent: {
    gap: 8,
    paddingBottom: 16,
  },
  emptyPortView: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyPortText: {
    fontSize: 13.5,
    fontWeight: '700',
    textAlign: 'center',
  },
  bandarItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 11,
    borderRadius: 14,
  },
  bandarItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  bandarIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
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
  bandarNameMain: {
    fontSize: 14,
  },
  closestTag: {
    backgroundColor: '#00E676',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
  },
  closestTagText: {
    color: '#000000',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  bandarNameEn: {
    fontSize: 11,
    fontWeight: '500',
  },
  bandarItemRight: {
    alignItems: 'flex-end',
    gap: 4,
    marginLeft: 8,
  },
  distancePill: {
    backgroundColor: 'rgba(2, 136, 209, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(2, 136, 209, 0.3)',
  },
  distancePillClosest: {
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    borderColor: '#00E676',
  },
  distanceNumber: {
    color: '#0288D1',
    fontSize: 11.5,
    fontWeight: '900',
  },
  distanceNumberClosest: {
    color: '#00E676',
  },
  activeCheckPill: {
    backgroundColor: '#0288D1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activeCheckText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '900',
  },
});
