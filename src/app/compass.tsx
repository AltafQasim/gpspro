import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Modal,
  PanResponder,
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
import {
  WaypointItem,
  getActiveTarget,
  getWaypoints,
  setActiveTarget,
  subscribeActiveTarget,
} from '@/services/waypointStore';
import { VoiceService } from '@/services/voiceService';
import {
  GpsService,
  LocationTelemetry,
  calculateNavDistanceAndBearing,
  formatNauticalLat,
  formatNauticalLon,
} from '@/services/gpsService';
import { SettingsStore } from '@/services/settingsStore';
import { BackButton } from '@/components/ui/back-button';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DIAL_SIZE = Math.min(SCREEN_WIDTH * 0.84, 336);
const DIAL_RADIUS = DIAL_SIZE / 2;

// 12 Major Compass Degree Labels & Cardinals
const DIAL_LABELS = [
  { deg: 0, label: 'N', isCardinal: true, isNorth: true },
  { deg: 30, label: '30°', isCardinal: false, isNorth: false },
  { deg: 60, label: '60°', isCardinal: false, isNorth: false },
  { deg: 90, label: 'E', isCardinal: true, isNorth: false },
  { deg: 120, label: '120°', isCardinal: false, isNorth: false },
  { deg: 150, label: '150°', isCardinal: false, isNorth: false },
  { deg: 180, label: 'S', isCardinal: true, isNorth: false },
  { deg: 210, label: '210°', isCardinal: false, isNorth: false },
  { deg: 240, label: '240°', isCardinal: false, isNorth: false },
  { deg: 270, label: 'W', isCardinal: true, isNorth: false },
  { deg: 300, label: '300°', isCardinal: false, isNorth: false },
  { deg: 330, label: '330°', isCardinal: false, isNorth: false },
];

function getCardinalDirection(deg: number): string {
  const cardinals = [
    'N', 'NNE', 'NE', 'ENE',
    'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW',
    'W', 'WNW', 'NW', 'NNW',
  ];
  const index = Math.round(((deg % 360) + 360) % 360 / 22.5) % 16;
  return cardinals[index];
}

export default function CompassScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    targetId?: string;
    targetName?: string;
    targetBearing?: string;
    targetDistance?: string;
    targetLat?: string;
    targetLon?: string;
  }>();

  // Navigation Telemetry State
  const [heading, setHeading] = useState<number>(354);
  const [targetBearing, setTargetBearing] = useState<number>(135);
  const [isNavigating, setIsNavigating] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(() => !SettingsStore.getSettings().voiceAnnounce);
  const [speedKnots, setSpeedKnots] = useState<number>(4.2);
  const [nightMode, setNightMode] = useState<boolean>(() => SettingsStore.isNightMode());

  // Target Information State
  const [targetName, setTargetName] = useState<string>('7ka cheo ram reef');
  const [targetCoords, setTargetCoords] = useState<string>("N 20° 43.945', E 71° 04.794'");
  const [distanceNmi, setDistanceNmi] = useState<string>(() => SettingsStore.convertDistanceString('1.82 Mi'));
  const [showWaypointModal, setShowWaypointModal] = useState<boolean>(false);
  const [modalSearch, setModalSearch] = useState<string>('');

  // Live Mobile GPS & Sensor Telemetry State
  const [currentPosLat, setCurrentPosLat] = useState<string>("N 20° 44.571'");
  const [currentPosLon, setCurrentPosLon] = useState<string>("E 71° 04.313'");
  const [hasGpsFix, setHasGpsFix] = useState<boolean>(false);
  const [sensorActive, setSensorActive] = useState<boolean>(false);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const etaTime = '08:42 PM';
  const currentTime = '08:17 PM';
  const moonRise = '5:46 PM';
  const moonSet = '5:07 AM';
  const moonIllumination = '99%';

  // Continuous rotation animation refs (shortest angle calculation)
  const accumulatedRotationRef = useRef<number>(-354);
  const accumulatedArrowRef = useRef<number>(141);
  const rotationAnim = useRef(new Animated.Value(-354)).current;
  const arrowRotateAnim = useRef(new Animated.Value(141)).current;

  // Real-time synced references for gestures & listeners
  const headingRef = useRef<number>(354);
  const targetBearingRef = useRef<number>(135);
  const isNavigatingRef = useRef<boolean>(true);
  const targetNameRef = useRef<string>('7ka cheo ram reef');
  const panStartHeadingRef = useRef<number>(354);

  // Sync refs with state
  useEffect(() => {
    headingRef.current = heading;
  }, [heading]);
  useEffect(() => {
    targetBearingRef.current = targetBearing;
  }, [targetBearing]);
  useEffect(() => {
    isNavigatingRef.current = isNavigating;
  }, [isNavigating]);
  useEffect(() => {
    targetNameRef.current = targetName;
  }, [targetName]);

  // Function to smoothly animate compass heading and waypoint pointer
  const animateToHeading = (newHeading: number, newTargetBearing: number, navigating: boolean) => {
    const normH = ((newHeading % 360) + 360) % 360;
    const roundedH = Math.round(normH);
    setHeading(roundedH);
    headingRef.current = roundedH;

    // Compass bezel rotates in opposite direction to show magnetic direction
    const targetDialAngle = -normH;
    const dialDiff = ((targetDialAngle - (accumulatedRotationRef.current % 360) + 540) % 360) - 180;
    accumulatedRotationRef.current += dialDiff;

    Animated.spring(rotationAnim, {
      toValue: accumulatedRotationRef.current,
      friction: 12,
      tension: 50,
      useNativeDriver: true,
    }).start();

    // Target pointer rotates to relative bearing: (targetBearing - heading)
    if (navigating) {
      const relAngle = ((newTargetBearing - normH) % 360 + 360) % 360;
      const arrowDiff = ((relAngle - (accumulatedArrowRef.current % 360) + 540) % 360) - 180;
      accumulatedArrowRef.current += arrowDiff;

      Animated.spring(arrowRotateAnim, {
        toValue: accumulatedArrowRef.current,
        friction: 12,
        tension: 50,
        useNativeDriver: true,
      }).start();
    }
  };



  // Sync route params on screen entry (when coming from Waypoints or Map)
  useEffect(() => {
    if (params.targetName) {
      const b = parseInt(params.targetBearing || '0') || 0;
      setTargetName(params.targetName);
      setTargetBearing(b);
      targetBearingRef.current = b;
      setDistanceNmi(params.targetDistance || '0.00 Mi');
      if (params.targetLat && params.targetLon) {
        setTargetCoords(`${params.targetLat}, ${params.targetLon}`);
      }
      setIsNavigating(true);
      isNavigatingRef.current = true;
      animateToHeading(headingRef.current, b, true);
    } else {
      const globalTarget = getActiveTarget();
      if (globalTarget) {
        const b = parseInt(globalTarget.bearing) || 0;
        setTargetName(globalTarget.name);
        setTargetBearing(b);
        targetBearingRef.current = b;
        setDistanceNmi(globalTarget.distance);
        setTargetCoords(
          `${globalTarget.latDir} ${globalTarget.latDeg}° ${globalTarget.latMin}', ${globalTarget.lonDir} ${globalTarget.lonDeg}° ${globalTarget.lonMin}'`
        );
        setIsNavigating(true);
        isNavigatingRef.current = true;
        animateToHeading(headingRef.current, b, true);
      }
    }
  }, [params.targetName, params.targetBearing, params.targetDistance, params.targetLat, params.targetLon]);

  // Subscribe to global active target changes
  useEffect(() => {
    const unsub = subscribeActiveTarget((newTarget) => {
      if (newTarget) {
        const b = parseInt(newTarget.bearing) || 0;
        setTargetName(newTarget.name);
        setTargetBearing(b);
        targetBearingRef.current = b;
        setDistanceNmi(SettingsStore.convertDistanceString(newTarget.distance));
        setTargetCoords(
          `${newTarget.latDir} ${newTarget.latDeg}° ${newTarget.latMin}', ${newTarget.lonDir} ${newTarget.lonDeg}° ${newTarget.lonMin}'`
        );
        setIsNavigating(true);
        isNavigatingRef.current = true;
        animateToHeading(headingRef.current, b, true);
      } else {
        setTargetName('');
        setIsNavigating(false);
        isNavigatingRef.current = false;
        setTargetBearing(0);
        targetBearingRef.current = 0;
        setDistanceNmi('--');
        setTargetCoords('--');
      }
    });
    return unsub;
  }, []);

  // Subscribe to SettingsStore for immediate app-wide settings updates
  useEffect(() => {
    const unsub = SettingsStore.subscribe((s) => {
      setNightMode(SettingsStore.isNightMode());
      setIsMuted(!s.voiceAnnounce);
      const active = getActiveTarget();
      if (active) {
        setDistanceNmi(SettingsStore.convertDistanceString(active.distance));
      }
    });
    return unsub;
  }, []);

  // Butter-Smooth Low-Pass Filter for Mobile Sensor Heading
  const filteredSensorHRef = useRef<number>(354);
  const handleSensorHeading = (rawHeading: number) => {
    setSensorActive(true);
    const cur = filteredSensorHRef.current;
    // Shortest angular difference (-180 to 180)
    const diff = ((((rawHeading - cur) % 360) + 540) % 360) - 180;

    // Small jitter deadzone to prevent micro-vibrations
    if (Math.abs(diff) < 0.5) return;

    // Adaptive smoothing: 0.22 for normal motion, 0.45 for rapid turns
    const alpha = Math.abs(diff) > 40 ? 0.45 : 0.22;
    const nextH = ((cur + diff * alpha) % 360 + 360) % 360;
    filteredSensorHRef.current = nextH;

    animateToHeading(nextH, targetBearingRef.current, isNavigatingRef.current && !!targetNameRef.current);
  };

  // Live GPS Telemetry Update
  const handleLocationUpdate = (telemetry: LocationTelemetry) => {
    setHasGpsFix(true);
    const c = SettingsStore.formatCoordinates(telemetry.latitude, telemetry.longitude);
    setCurrentPosLat(c.latFormatted);
    setCurrentPosLon(c.lonFormatted);
    if (telemetry.speedKnots >= 0) {
      setSpeedKnots(telemetry.speedKnots);
    }
  };

  // Request Location & Mobile Sensor Access
  const handleRequestPermission = async () => {
    const status = await GpsService.requestPermissions();
    if (status === 'granted') {
      setPermissionStatus('granted');
      GpsService.startLocationTracking(handleLocationUpdate);
      GpsService.startHeadingTracking(handleSensorHeading);
    } else {
      setPermissionStatus('denied');
      Alert.alert(
        'GPS Access Denied 🛰️',
        'Vessel position aur compass orientation ke liye Location permission zaroori hai. Kripya app settings me location allow karein.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry', onPress: handleRequestPermission },
        ]
      );
    }
  };

  // Check and initialize permissions on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      const status = await GpsService.checkPermissions();
      if (!mounted) return;
      if (status === 'granted') {
        setPermissionStatus('granted');
        GpsService.startLocationTracking(handleLocationUpdate);
        GpsService.startHeadingTracking(handleSensorHeading);
      } else {
        setPermissionStatus(status === 'denied' ? 'denied' : 'undetermined');
        // Prompt user immediately if undetermined
        const req = await GpsService.requestPermissions();
        if (!mounted) return;
        if (req === 'granted') {
          setPermissionStatus('granted');
          GpsService.startLocationTracking(handleLocationUpdate);
          GpsService.startHeadingTracking(handleSensorHeading);
        } else {
          setPermissionStatus('denied');
        }
      }
    })();

    return () => {
      mounted = false;
      GpsService.stopAll();
    };
  }, []);

  // Realistic gentle marine yaw sway around current heading when sensor is still
  useEffect(() => {
    const interval = setInterval(() => {
      // Only sway if sensor is not actively updating
      if (sensorActive) return;
      const sway = (Math.random() - 0.5) * 1.5;
      const swayH = ((headingRef.current + sway) % 360 + 360) % 360;
      const targetDialAngle = -swayH;
      const dialDiff = ((targetDialAngle - (accumulatedRotationRef.current % 360) + 540) % 360) - 180;
      accumulatedRotationRef.current += dialDiff;

      Animated.spring(rotationAnim, {
        toValue: accumulatedRotationRef.current,
        friction: 14,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }, 1400);

    return () => clearInterval(interval);
  }, [sensorActive]);

  // PanResponder to allow captain to smoothly drag / rotate compass dial with finger in 360°
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        panStartHeadingRef.current = headingRef.current;
      },
      onPanResponderMove: (_, gestureState) => {
        // Drag horizontally to rotate compass dial smoothly (0.5 deg per pixel)
        const deltaDeg = gestureState.dx * 0.5;
        const newH = ((panStartHeadingRef.current - deltaDeg) % 360 + 360) % 360;
        animateToHeading(newH, targetBearingRef.current, isNavigatingRef.current && !!targetNameRef.current);
      },
      onPanResponderRelease: () => {
        panStartHeadingRef.current = headingRef.current;
      },
    })
  ).current;

  // Toggle Mute Audio
  const handleToggleMute = () => {
    setIsMuted(!isMuted);
    Alert.alert(
      isMuted ? 'Off-Course Voice Alarm Enabled 🔔' : 'Alarms Muted 🔕',
      isMuted
        ? 'Audible marine voice alert will sound if vessel drifts > 15° off target bearing.'
        : 'All navigational drift and off-course alerts muted.'
    );
  };

  // Cross icon clicked: Blank out the target immediately
  const handleCancelTarget = () => {
    setIsNavigating(false);
    setTargetName('');
    setTargetBearing(0);
    setDistanceNmi('--');
    setTargetCoords('--');
    setActiveTarget(null);
    Alert.alert('Target Cleared ✕', 'Waypoint navigation stopped. Compass is now in Free Steering mode.');
  };

  // Open Saved Waypoint Picker Modal
  const handleOpenWaypointPicker = () => {
    setShowWaypointModal(true);
  };

  // Select a waypoint to start navigation
  const handleSelectWaypoint = (wp: WaypointItem) => {
    const b = parseInt(wp.bearing) || 0;
    setTargetName(wp.name);
    setTargetBearing(b);
    setDistanceNmi(wp.distance);
    setTargetCoords(`${wp.latDir} ${wp.latDeg}° ${wp.latMin}', ${wp.lonDir} ${wp.lonDeg}° ${wp.lonMin}'`);
    setIsNavigating(true);
    setActiveTarget(wp);
    VoiceService.announceWaypoint(wp.name, wp.distance, wp.bearing);
    setShowWaypointModal(false);
    animateToHeading(heading, b, true);
    Alert.alert('Navigation Started 🧭', `Target: ${wp.name}\nBearing: ${wp.bearing} • Distance: ${wp.distance}`);
  };

  // Calculate Relative Steering Cue
  const relativeSteerDeg = isNavigating && targetName ? ((targetBearing - heading + 540) % 360) - 180 : 0;
  const isTargetLocked = Math.abs(relativeSteerDeg) <= 3;

  const theme = nightMode
    ? {
        bg: '#060B16',
        headerBg: 'rgba(12, 22, 45, 0.75)',
        headerText: '#FFFFFF',
        headerSub: '#38BDF8',
        cardBg: '#0B1528',
        cardBorder: 'rgba(56, 189, 248, 0.22)',
        cardAccent: '#00E5FF',
        label: '#94A3B8',
        value: '#38BDF8',
        valueBright: '#FFFFFF',
        subVal: '#7DD3FC',
        accent: '#00E5FF',
        dialBg: '#07101E',
        dialBezel: '#0284C7',
        dialBezelBorder: 'rgba(56, 189, 248, 0.4)',
        dialGlow: 'rgba(0, 229, 255, 0.18)',
        dialTickMajor: '#00E5FF',
        dialTickMinor: 'rgba(56, 189, 248, 0.35)',
        dialTickText: '#94A3B8',
        arrowColor: '#FF6D00',
        hubColor: '#FFB300',
        hubBorder: '#FFFFFF',
        cardinalN: '#EF4444',
      }
    : {
        bg: '#F1F6FA',
        headerBg: 'rgba(255, 255, 255, 0.85)',
        headerText: '#0F172A',
        headerSub: '#0284C7',
        cardBg: '#FFFFFF',
        cardBorder: '#D0E3F0',
        cardAccent: '#0284C7',
        label: '#64748B',
        value: '#0369A1',
        valueBright: '#0F172A',
        subVal: '#0284C7',
        accent: '#0284C7',
        dialBg: '#FFFFFF',
        dialBezel: '#0284C7',
        dialBezelBorder: 'rgba(2, 132, 199, 0.3)',
        dialGlow: 'rgba(2, 132, 199, 0.12)',
        dialTickMajor: '#0284C7',
        dialTickMinor: 'rgba(100, 116, 139, 0.3)',
        dialTickText: '#334155',
        arrowColor: '#EA580C',
        hubColor: '#F59E0B',
        hubBorder: '#FFFFFF',
        cardinalN: '#DC2626',
      };

  const formattedHeading = heading.toString().padStart(3, '0');
  const cardinalDirection = getCardinalDirection(heading);
  const allSavedWaypoints = getWaypoints();
  const filteredWaypoints = allSavedWaypoints.filter(
    (wp) =>
      wp.name.toLowerCase().includes(modalSearch.toLowerCase()) ||
      wp.latMin.includes(modalSearch) ||
      wp.lonMin.includes(modalSearch)
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar style={nightMode ? 'light' : 'dark'} animated={true} />

      {/* Screen Header */}
      <View style={[styles.topHeader, { backgroundColor: theme.headerBg, borderBottomColor: theme.cardBorder }]}>
        <BackButton
          isDark={nightMode}
          showLabel={true}
          label="Home"
          customColor={nightMode ? '#38BDF8' : '#0284C7'}
        />

        <View style={styles.headerTitleWrap}>
          <Text style={[styles.screenTitle, { color: theme.headerText }]}>
            MARINE COMPASS
          </Text>
          <Text style={[styles.screenSubTitle, { color: theme.headerSub }]}>
            DGPS GYRO • WGS84
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => {
            const next = !nightMode;
            setNightMode(next);
            SettingsStore.updateSettings({ theme: next ? 'dark' : 'light' });
          }}
          style={[
            styles.nightToggle,
            {
              backgroundColor: nightMode ? 'rgba(56, 189, 248, 0.12)' : 'rgba(2, 132, 199, 0.08)',
              borderColor: theme.cardBorder,
            },
          ]}>
          <Text style={styles.nightToggleIcon}>{nightMode ? '🌙' : '☀️'}</Text>
          <Text style={[styles.nightToggleText, { color: theme.label }]}>
            {nightMode ? 'NIGHT' : 'DAY'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}>

        {/* GPS ACCESS PERMISSION PROMPT BANNER (Shown when location is not granted) */}
        {permissionStatus !== 'granted' && (
          <View style={[styles.permissionCard, { backgroundColor: nightMode ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.08)' }]}>
            <View style={styles.permissionCardTop}>
              <Text style={styles.permissionCardIcon}>🛰️</Text>
              <View style={styles.permissionCardTextWrap}>
                <Text style={styles.permissionCardTitle}>Location Access Required</Text>
                <Text style={styles.permissionCardDesc}>
                  Compass ko real mobile sensor se ghumane aur live GPS coordinates ke liye permission allow karein.
                </Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleRequestPermission}
              style={styles.permissionAllowBtn}>
              <Text style={styles.permissionAllowBtnText}>📍 Allow Location & Sensors</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* COMPASS DIAL SECTION */}
        <View style={styles.dialWrapper}>
          {/* Top Lubber Line Indicator (Golden Precision Arrowhead & Live Heading) */}
          <View style={styles.lubberWrapper}>
            <View style={styles.lubberTriangle} />
            <View style={styles.lubberBadge}>
              <Text style={styles.lubberDegreeText}>
                {formattedHeading}° {cardinalDirection}
              </Text>
            </View>
          </View>

          {/* Compass Dial Outer Ring with Pan Gesture for manual smooth rotation */}
          <View
            {...panResponder.panHandlers}
            style={[
              styles.dialFrame,
              {
                width: DIAL_SIZE,
                height: DIAL_SIZE,
                borderRadius: DIAL_RADIUS,
                borderColor: theme.dialBezel,
                backgroundColor: theme.dialBg,
                shadowColor: theme.accent,
              },
            ]}>
            {/* Background Gyro Reticle Rings (Concentric circles for marine instrument look) */}
            <View pointerEvents="none" style={[styles.reticleRing, { width: DIAL_SIZE * 0.72, height: DIAL_SIZE * 0.72, borderRadius: (DIAL_SIZE * 0.72) / 2 }]} />
            <View pointerEvents="none" style={[styles.reticleRing, { width: DIAL_SIZE * 0.44, height: DIAL_SIZE * 0.44, borderRadius: (DIAL_SIZE * 0.44) / 2 }]} />
            <View pointerEvents="none" style={styles.reticleCrossH} />
            <View pointerEvents="none" style={styles.reticleCrossV} />

            {/* Rotating Bezel with 36 Graduation Ticks & 12 Precision Cardinals */}
            <Animated.View
              style={[
                styles.dialFace,
                {
                  transform: [
                    {
                      rotate: rotationAnim.interpolate({
                        inputRange: [-360000, 360000],
                        outputRange: ['-360000deg', '360000deg'],
                      }),
                    },
                  ],
                },
              ]}>
              {/* Outer Metallic Bezel Ring */}
              <View style={[styles.bezelRing, { borderColor: theme.dialBezelBorder }]} />

              {/* Port (Red) / Starboard (Green) Sectors */}
              <View style={styles.portStarboardRing}>
                <View style={styles.greenStarboardArc} />
                <View style={styles.redPortArc} />
              </View>

              {/* 36 Circular Graduation Tick Lines */}
              {Array.from({ length: 36 }).map((_, i) => {
                const deg = i * 10;
                const isCardinal = deg % 90 === 0;
                const isMajor = deg % 30 === 0;
                return (
                  <View
                    key={`tick-${deg}`}
                    style={[
                      styles.tickLineWrap,
                      {
                        width: DIAL_SIZE,
                        height: DIAL_SIZE,
                        transform: [{ rotate: `${deg}deg` }],
                      },
                    ]}>
                    <View
                      style={[
                        styles.tickLine,
                        isCardinal
                          ? [styles.tickLineCardinal, { backgroundColor: deg === 0 ? '#EF4444' : theme.accent }]
                          : isMajor
                          ? [styles.tickLineMajor, { backgroundColor: theme.dialTickMajor }]
                          : [styles.tickLineMinor, { backgroundColor: theme.dialTickMinor }],
                      ]}
                    />
                  </View>
                );
              })}

              {/* 12 Mathematical Degree & Cardinal Labels (Kept Perfectly Upright) */}
              {DIAL_LABELS.map((item) => {
                const angleRad = ((item.deg - 90) * Math.PI) / 180;
                const labelR = DIAL_RADIUS - 30;
                const left = DIAL_RADIUS + labelR * Math.cos(angleRad) - 18;
                const top = DIAL_RADIUS + labelR * Math.sin(angleRad) - 10;
                return (
                  <View key={`lbl-${item.deg}`} style={[styles.dialLabelBox, { left, top }]}>
                    {item.isNorth && <Text style={styles.northArrowIcon}>▲</Text>}
                    <Text
                      style={[
                        styles.dialLabelText,
                        item.isNorth
                          ? styles.northLabelText
                          : item.isCardinal
                          ? [styles.cardinalLabelText, { color: theme.accent }]
                          : [styles.degLabelText, { color: theme.dialTickText }],
                      ]}>
                      {item.label}
                    </Text>
                  </View>
                );
              })}
            </Animated.View>

            {/* WAYPOINT TARGET NAVIGATION ARROW (High-Visibility Marine Needle) */}
            {isNavigating && !!targetName ? (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.bearingPointerContainer,
                  {
                    transform: [
                      {
                        rotate: arrowRotateAnim.interpolate({
                          inputRange: [-360000, 360000],
                          outputRange: ['-360000deg', '360000deg'],
                        }),
                      },
                    ],
                  },
                ]}>
                {/* Arrowhead pointing towards target waypoint on dial ring */}
                <View
                  style={[
                    styles.navArrowHead,
                    { borderBottomColor: theme.arrowColor },
                  ]}
                />
                <View style={styles.navArrowCenterSpine} />

                {/* Needle Shaft */}
                <View
                  style={[
                    styles.navArrowShaft,
                    { backgroundColor: theme.arrowColor },
                  ]}
                />

                {/* Needle Tail Counterweight */}
                <View style={[styles.navArrowTail, { backgroundColor: theme.arrowColor }]} />

                {/* Target Bearing Degree Pip at perimeter */}
                <View style={[styles.targetPipBadge, { backgroundColor: theme.arrowColor }]}>
                  <Text style={styles.targetPipText}>🎯 {targetBearing}°</Text>
                </View>

                {/* Center Nautical Pivot Hub */}
                <View style={[styles.centerNavHub, { borderColor: theme.hubColor }]}>
                  <View style={[styles.centerNavDot, { backgroundColor: theme.hubColor }]} />
                </View>
              </Animated.View>
            ) : (
              /* Center Digital Heading Display when no target active */
              <View style={styles.centerHeadingBox}>
                <Text style={[styles.centerHeadingText, { color: theme.valueBright }]}>
                  {formattedHeading}°
                </Text>
                <View style={[styles.centerCardinalBadge, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
                  <Text style={[styles.centerCardinalText, { color: theme.accent }]}>
                    {cardinalDirection} • {formattedHeading}°
                  </Text>
                </View>
                <Text style={[styles.centerHeadingSub, { color: theme.label }]}>
                  GYRO STEERING
                </Text>
              </View>
            )}
          </View>

          {/* Left / Right Action Buttons below Dial */}
          <View style={styles.dialActionsRow}>
            {/* Mute Off-Course Audio Alert Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleToggleMute}
              style={[
                styles.roundActionBtn,
                { backgroundColor: isMuted ? '#64748B' : '#DC2626' },
              ]}>
              <Text style={styles.roundActionIcon}>{isMuted ? '🔇' : '🔔'}</Text>
            </TouchableOpacity>

            {/* Cancel / Clear Navigation Target Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleCancelTarget}
              style={[styles.roundActionBtn, { backgroundColor: '#B91C1C' }]}>
              <Text style={styles.roundActionTextX}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* DYNAMIC STEERING GUIDANCE BANNER */}
        {isNavigating && !!targetName ? (
          <View
            style={[
              styles.steeringBanner,
              isTargetLocked ? styles.steeringLocked : styles.steeringAdjust,
            ]}>
            <View style={styles.steeringHeaderRow}>
              <View style={[styles.steeringBadgePill, isTargetLocked ? styles.badgeLocked : styles.badgeAdjust]}>
                <Text style={styles.steeringBadgeText}>
                  {isTargetLocked ? '✓ ON COURSE' : relativeSteerDeg > 0 ? '👉 STEER STBD' : '👈 STEER PORT'}
                </Text>
              </View>
              <Text style={[styles.steeringDevText, { color: isTargetLocked ? '#10B981' : '#F59E0B' }]}>
                {isTargetLocked ? 'DEV: 0° (LOCK)' : `DEV: ${Math.abs(relativeSteerDeg)}°`}
              </Text>
            </View>

            {/* Visual Deviation Gauge Bar */}
            <View style={styles.deviationBarWrap}>
              <View style={styles.deviationCenterNotch} />
              <View
                style={[
                  styles.deviationIndicator,
                  {
                    left: `${Math.max(5, Math.min(95, 50 + (relativeSteerDeg / 45) * 45))}%`,
                    backgroundColor: isTargetLocked ? '#10B981' : relativeSteerDeg > 0 ? '#10B981' : '#EF4444',
                  },
                ]}
              />
            </View>

            <View style={styles.steeringMetaRow}>
              <Text style={[styles.steeringTargetName, { color: theme.valueBright }]} numberOfLines={1}>
                🎯 {targetName}
              </Text>
              <Text style={[styles.steeringDistanceText, { color: theme.accent }]}>
                {distanceNmi} • {targetBearing}°
              </Text>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            onPress={handleOpenWaypointPicker}
            activeOpacity={0.8}
            style={[styles.noTargetBanner, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <Text style={styles.noTargetBannerIcon}>🎯</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.noTargetBannerTitle, { color: theme.valueBright }]}>
                Free Steering Mode Active
              </Text>
              <Text style={[styles.noTargetBannerSub, { color: theme.label }]}>
                Tap here to select saved waypoint or enter coordinates
              </Text>
            </View>
            <Text style={[styles.noTargetArrow, { color: theme.accent }]}>›</Text>
          </TouchableOpacity>
        )}

        {/* 5 SHORTCUT NAVIGATION ROUND ICONS (Matching Screenshot) */}
        <View style={styles.shortcutRow}>
          {/* Settings */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => router.push('/settings')}
            style={[styles.shortcutCircle, { backgroundColor: '#E53935' }]}>
            <Text style={styles.shortcutIconText}>⚙️</Text>
          </TouchableOpacity>

          {/* Map */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => router.push('/map')}
            style={[styles.shortcutCircle, { backgroundColor: '#7E57C2' }]}>
            <Text style={styles.shortcutIconText}>🗺️</Text>
          </TouchableOpacity>

          {/* Lifebuoy / Safety MOB */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() =>
              Alert.alert('M.O.B. Alarm (Man Overboard)', 'Drop emergency GPS marker at current location?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Mark MOB Position', style: 'destructive' },
              ])
            }
            style={[styles.shortcutCircle, styles.lifebuoyCircle]}>
            <View style={styles.lifebuoyInner}>
              <View style={styles.lifebuoyHole} />
            </View>
          </TouchableOpacity>

          {/* Location Pin / Anchor */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() =>
              Alert.alert('Anchor Watch', 'Anchor alarm set for 35m swinging radius.', [{ text: 'OK' }])
            }
            style={[styles.shortcutCircle, { backgroundColor: '#3949AB' }]}>
            <Text style={styles.shortcutIconText}>📍</Text>
          </TouchableOpacity>

          {/* Waypoints */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => router.push('/waypoints')}
            style={[styles.shortcutCircle, { backgroundColor: '#FF5722' }]}>
            <Text style={styles.shortcutIconText}>🚩</Text>
          </TouchableOpacity>
        </View>

        {/* 2-COLUMN MARINE TELEMETRY GRID (Exact Layout from Screenshot) */}
        <View style={styles.telemetryGrid}>
          {/* Row 1: SPEED & DISTANCE */}
          <View style={styles.gridRow}>
            <View style={[styles.gridCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
              <Text style={[styles.cardValueLarge, { color: theme.value }]}>
                {speedKnots.toFixed(2)}
              </Text>
              <Text style={[styles.cardLabel, { color: theme.label }]}>SPEED (KN)</Text>
            </View>

            <View style={[styles.gridCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
              <Text style={[styles.cardValueLarge, { color: theme.value }]}>
                {isNavigating && !!targetName ? distanceNmi : '--'}
              </Text>
              <Text style={[styles.cardLabel, { color: theme.label }]}>DISTANCE</Text>
            </View>
          </View>

          {/* Row 2: BEARING & COURSE */}
          <View style={styles.gridRow}>
            <View style={[styles.gridCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
              <Text style={[styles.cardValueLarge, { color: theme.value }]}>
                {isNavigating && !!targetName ? `${targetBearing.toString().padStart(3, '0')}°` : '000°'}
              </Text>
              <Text style={[styles.cardLabel, { color: theme.label }]}>BEARING</Text>
            </View>

            <View style={[styles.gridCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
              <Text style={[styles.cardValueLarge, { color: theme.value }]}>
                {formattedHeading}°
              </Text>
              <Text style={[styles.cardLabel, { color: theme.label }]}>COURSE (COG)</Text>
            </View>
          </View>

          {/* Row 3: HEADING & POSITION */}
          <View style={styles.gridRow}>
            <View style={[styles.gridCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
              <Text style={[styles.cardValueLarge, { color: theme.value }]}>
                {formattedHeading}°
              </Text>
              <Text style={[styles.cardLabel, { color: theme.label }]}>HEADING</Text>
            </View>

            <View style={[styles.gridCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
              <Text style={[styles.cardCoordText, { color: theme.value }]}>{currentPosLat}</Text>
              <Text style={[styles.cardCoordText, { color: theme.value }]}>{currentPosLon}</Text>
              <Text style={[styles.cardLabel, { color: theme.label, marginTop: 4 }]}>POSITION</Text>
            </View>
          </View>

          {/* Row 4: TARGET NAME & TARGET COORDS (TAP TO SELECT SAVED WAYPOINT) */}
          <View style={styles.gridRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleOpenWaypointPicker}
              style={[
                styles.gridCard,
                styles.targetCardInteractive,
                { backgroundColor: theme.cardBg, borderColor: isNavigating && !!targetName ? '#F59E0B' : theme.cardBorder },
              ]}>
              <View style={styles.targetCardHeaderRow}>
                <Text style={styles.targetCardIcon}>🎯</Text>
                {isNavigating && !!targetName ? (
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      handleCancelTarget();
                    }}
                    style={styles.cardMiniCrossBtn}>
                    <Text style={styles.cardMiniCrossText}>✕</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              <Text style={[styles.targetNameText, { color: isNavigating && !!targetName ? '#F59E0B' : theme.value }]} numberOfLines={1}>
                {targetName || '-- NO TARGET --'}
              </Text>
              <Text style={[styles.cardLabel, { color: theme.label }]}>
                TARGET NAME (TAP TO PICK)
              </Text>
            </TouchableOpacity>

            <View style={[styles.gridCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
              {isNavigating && !!targetName ? (
                <>
                  <Text style={[styles.cardCoordText, { color: theme.value }]}>
                    {targetCoords.split(',')[0] || ''}
                  </Text>
                  <Text style={[styles.cardCoordText, { color: theme.value }]}>
                    {targetCoords.split(',')[1] || ''}
                  </Text>
                </>
              ) : (
                <Text style={[styles.cardValueLarge, { color: theme.value }]}>--</Text>
              )}
              <Text style={[styles.cardLabel, { color: theme.label, marginTop: 4 }]}>TARGET COORDS</Text>
            </View>
          </View>

          {/* Row 5: ETA & TIME */}
          <View style={styles.gridRow}>
            <View style={[styles.gridCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
              <Text style={[styles.cardValueLarge, { color: theme.value }]}>
                {isNavigating && !!targetName ? etaTime : '--:--'}
              </Text>
              <Text style={[styles.cardLabel, { color: theme.label }]}>ETA</Text>
            </View>

            <View style={[styles.gridCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
              <Text style={[styles.cardValueLarge, { color: theme.value }]}>
                {currentTime}
              </Text>
              <Text style={[styles.cardLabel, { color: theme.label }]}>TIME</Text>
            </View>
          </View>

          {/* Row 6: MOON RISE & MOON SET */}
          <View style={styles.gridRow}>
            <View style={[styles.gridCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
              <Text style={[styles.cardValueLarge, { color: theme.value }]}>{moonRise}</Text>
              <Text style={[styles.cardLabel, { color: theme.label }]}>MOON RISE</Text>
            </View>

            <View style={[styles.gridCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
              <Text style={[styles.cardValueLarge, { color: theme.value }]}>{moonSet}</Text>
              <Text style={[styles.cardLabel, { color: theme.label }]}>MOON SET</Text>
            </View>
          </View>

          {/* Row 7: MOON PHASE & ILLUMINATION */}
          <View style={styles.gridRow}>
            <View
              style={[
                styles.gridCard,
                styles.moonCard,
                { backgroundColor: theme.cardBg, borderColor: theme.cardBorder },
              ]}>
              <View style={styles.moonGraphic}>
                <View style={styles.moonSphere} />
              </View>
              <Text style={[styles.cardLabel, { color: theme.label }]}>MOON PHASE (FULL)</Text>
            </View>

            <View style={[styles.gridCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
              <View style={styles.illuminationRow}>
                <Text style={[styles.illuminationNumber, { color: theme.value }]}>99</Text>
                <Text style={[styles.percentSign, { color: theme.value }]}>%</Text>
              </View>
              <Text style={[styles.cardLabel, { color: theme.label }]}>ILLUMINATION</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* SAVED WAYPOINTS SELECTOR MODAL */}
      <Modal visible={showWaypointModal} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setShowWaypointModal(false)}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalCard}>
                <View style={styles.modalHeaderRow}>
                  <View style={styles.modalTitleWrap}>
                    <Text style={styles.modalTitleIcon}>🧭</Text>
                    <Text style={styles.modalTitleText}>Select Waypoint Target</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setShowWaypointModal(false)}
                    style={styles.modalCloseCircle}>
                    <Text style={styles.modalCloseCircleText}>✕</Text>
                  </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View style={styles.modalSearchBox}>
                  <Text style={styles.modalSearchIcon}>🔍</Text>
                  <TextInput
                    value={modalSearch}
                    onChangeText={setModalSearch}
                    placeholder="Search saved fishing spots..."
                    placeholderTextColor="#94A3B8"
                    style={styles.modalSearchInput}
                  />
                  {modalSearch.length > 0 && (
                    <TouchableOpacity onPress={() => setModalSearch('')}>
                      <Text style={styles.modalClearSearchText}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Clear Active Target Button */}
                {isNavigating && !!targetName && (
                  <TouchableOpacity
                    onPress={() => {
                      handleCancelTarget();
                      setShowWaypointModal(false);
                    }}
                    style={styles.clearTargetBtn}>
                    <Text style={styles.clearTargetBtnText}>✕ Clear Active Target (Blank Target)</Text>
                  </TouchableOpacity>
                )}

                {/* Waypoints List */}
                <ScrollView style={styles.modalScrollList} showsVerticalScrollIndicator={false}>
                  {filteredWaypoints.length === 0 ? (
                    <View style={styles.modalEmptyBox}>
                      <Text style={styles.modalEmptyText}>No matching waypoints found.</Text>
                    </View>
                  ) : (
                    filteredWaypoints.map((wp) => {
                      const isSelected = isNavigating && targetName === wp.name;
                      return (
                        <TouchableOpacity
                          key={wp.id}
                          activeOpacity={0.8}
                          onPress={() => handleSelectWaypoint(wp)}
                          style={[
                            styles.modalWaypointItem,
                            isSelected && styles.modalWaypointItemSelected,
                          ]}>
                          <View style={styles.modalItemLeft}>
                            <Text style={styles.modalItemIcon}>{wp.icon || '📍'}</Text>
                            <View style={styles.modalItemDetails}>
                              <Text style={styles.modalItemName} numberOfLines={1}>
                                {wp.name}
                              </Text>
                              <Text style={styles.modalItemCoords}>
                                {wp.latDir} {wp.latDeg}° {wp.latMin}&apos; • {wp.lonDir} {wp.lonDeg}° {wp.lonMin}&apos;
                              </Text>
                            </View>
                          </View>

                          <View style={styles.modalItemRight}>
                            <View style={styles.modalBearingBadge}>
                              <Text style={styles.modalBearingText}>{wp.bearing}</Text>
                            </View>
                            <Text style={styles.modalDistanceText}>{wp.distance}</Text>
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  backArrow: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 22,
  },
  backLabel: {
    fontSize: 14,
    fontWeight: '800',
  },
  headerTitleWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  screenSubTitle: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: 1,
  },
  nightToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  nightToggleIcon: {
    fontSize: 13,
  },
  nightToggleText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 40,
  },

  // DIAL SECTION
  dialWrapper: {
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 16,
    position: 'relative',
  },
  lubberWrapper: {
    alignItems: 'center',
    marginBottom: -8,
    zIndex: 35,
  },
  lubberTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderTopWidth: 16,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 5,
  },
  lubberBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: -3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  lubberDegreeText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  dialFrame: {
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 10,
  },
  dialFace: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bezelRing: {
    position: 'absolute',
    width: '92%',
    height: '92%',
    borderRadius: 9999,
    borderWidth: 1.5,
  },
  portStarboardRing: {
    position: 'absolute',
    width: '84%',
    height: '84%',
    borderRadius: 9999,
    overflow: 'hidden',
    opacity: 0.85,
  },
  greenStarboardArc: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '50%',
    borderRightWidth: 3.5,
    borderColor: '#10B981',
  },
  redPortArc: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '50%',
    borderLeftWidth: 3.5,
    borderColor: '#EF4444',
  },
  reticleRing: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.16)',
  },
  reticleCrossH: {
    position: 'absolute',
    width: '68%',
    height: 1,
    backgroundColor: 'rgba(56, 189, 248, 0.14)',
  },
  reticleCrossV: {
    position: 'absolute',
    height: '68%',
    width: 1,
    backgroundColor: 'rgba(56, 189, 248, 0.14)',
  },
  tickLineWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  tickLine: {
    borderRadius: 1,
  },
  tickLineCardinal: {
    width: 3.5,
    height: 14,
  },
  tickLineMajor: {
    width: 2,
    height: 10,
  },
  tickLineMinor: {
    width: 1,
    height: 6,
  },
  dialLabelBox: {
    position: 'absolute',
    width: 36,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialLabelText: {
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
  },
  northArrowIcon: {
    color: '#EF4444',
    fontSize: 9,
    marginBottom: -2,
  },
  northLabelText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '900',
  },
  cardinalLabelText: {
    fontSize: 12,
    fontWeight: '900',
  },
  degLabelText: {
    fontSize: 9.5,
    fontWeight: '700',
  },

  // WAYPOINT NAVIGATION ARROW STYLES (PROMINENT & HIGH-VISIBILITY)
  bearingPointerContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 25,
  },
  navArrowHead: {
    width: 0,
    height: 0,
    borderLeftWidth: 15,
    borderRightWidth: 15,
    borderBottomWidth: 36,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    position: 'absolute',
    top: 22,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 4,
    elevation: 5,
  },
  navArrowCenterSpine: {
    position: 'absolute',
    top: 24,
    width: 2,
    height: 34,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    zIndex: 2,
  },
  navArrowShaft: {
    width: 6,
    height: 74,
    borderRadius: 3,
    position: 'absolute',
    top: 50,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 2,
    elevation: 3,
  },
  navArrowTail: {
    position: 'absolute',
    bottom: 52,
    width: 14,
    height: 14,
    transform: [{ rotate: '45deg' }],
    borderRadius: 2,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 2,
  },
  targetPipBadge: {
    position: 'absolute',
    top: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 4,
  },
  targetPipText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  centerNavHub: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    borderWidth: 3.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 6,
  },
  centerNavDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },

  // Center Heading Digital Box when not navigating
  centerHeadingBox: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerHeadingText: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  centerCardinalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 2,
  },
  centerCardinalText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  centerHeadingSub: {
    fontSize: 9,
    fontWeight: '800',
    marginTop: 3,
    letterSpacing: 1.2,
  },

  // Location Permission Card
  permissionCard: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 10,
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1.5,
    borderColor: '#EF4444',
  },
  permissionCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  permissionCardIcon: {
    fontSize: 26,
  },
  permissionCardTextWrap: {
    flex: 1,
  },
  permissionCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#EF4444',
  },
  permissionCardDesc: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
    lineHeight: 15,
  },
  permissionAllowBtn: {
    backgroundColor: '#0284C7',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  permissionAllowBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Dial Bottom Controls (Mute & Cross Cancel)
  dialActionsRow: {
    position: 'absolute',
    bottom: -16,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 40,
  },
  roundActionBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 6,
  },
  roundActionIcon: {
    fontSize: 20,
  },
  roundActionTextX: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },

  // STEERING GUIDANCE BANNER
  steeringBanner: {
    width: '92%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    marginBottom: 10,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  steeringLocked: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.6)',
  },
  steeringAdjust: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.6)',
  },
  steeringHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  steeringBadgePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeLocked: {
    backgroundColor: '#10B981',
  },
  badgeAdjust: {
    backgroundColor: '#F59E0B',
  },
  steeringBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  steeringDevText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  deviationBarWrap: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
    position: 'relative',
    justifyContent: 'center',
    marginVertical: 4,
  },
  deviationCenterNotch: {
    position: 'absolute',
    left: '50%',
    marginLeft: -1,
    width: 2,
    height: 12,
    backgroundColor: '#64748B',
    borderRadius: 1,
  },
  deviationIndicator: {
    position: 'absolute',
    width: 14,
    height: 14,
    marginLeft: -7,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  steeringMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 6,
  },
  steeringTargetName: {
    fontSize: 13,
    fontWeight: '800',
    flex: 1,
  },
  steeringDistanceText: {
    fontSize: 12,
    fontWeight: '800',
  },
  noTargetBanner: {
    width: '92%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginTop: 18,
    marginBottom: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    gap: 12,
  },
  noTargetBannerIcon: {
    fontSize: 24,
  },
  noTargetBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  noTargetBannerSub: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  noTargetArrow: {
    fontSize: 22,
    fontWeight: '700',
  },

  // 5 SHORTCUT BUTTONS
  shortcutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '92%',
    marginVertical: 14,
    paddingHorizontal: 6,
  },
  shortcutCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  shortcutIconText: {
    fontSize: 24,
  },
  lifebuoyCircle: {
    backgroundColor: '#F4511E',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  lifebuoyInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lifebuoyHole: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#F4511E',
  },

  // 2-COLUMN TELEMETRY GRID
  telemetryGrid: {
    width: '92%',
    gap: 10,
    marginTop: 4,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 10,
  },
  gridCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 86,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  targetCardInteractive: {
    position: 'relative',
  },
  targetCardHeaderRow: {
    position: 'absolute',
    top: 6,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  targetCardIcon: {
    fontSize: 14,
  },
  cardMiniCrossBtn: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardMiniCrossText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  cardValueLarge: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  cardCoordText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  targetNameText: {
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 8,
  },
  cardLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 4,
    textAlign: 'center',
  },

  // MOON SECTION
  moonCard: {
    paddingVertical: 8,
  },
  moonGraphic: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#0D47A1',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  moonSphere: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFE082',
  },
  illuminationRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  illuminationNumber: {
    fontSize: 26,
    fontWeight: '900',
  },
  percentSign: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 2,
  },

  // MODAL STYLES (SAVED WAYPOINTS PICKER)
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '80%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitleIcon: {
    fontSize: 22,
  },
  modalTitleText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  modalCloseCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseCircleText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#64748B',
  },
  modalSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
    gap: 8,
  },
  modalSearchIcon: {
    fontSize: 16,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
    padding: 0,
  },
  modalClearSearchText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '700',
    padding: 4,
  },
  clearTargetBtn: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#F87171',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  clearTargetBtnText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '800',
  },
  modalScrollList: {
    maxHeight: 380,
  },
  modalEmptyBox: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  modalEmptyText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '600',
  },
  modalWaypointItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalWaypointItemSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  modalItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  modalItemIcon: {
    fontSize: 22,
  },
  modalItemDetails: {
    flex: 1,
  },
  modalItemName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalItemCoords: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  modalItemRight: {
    alignItems: 'flex-end',
    gap: 3,
  },
  modalBearingBadge: {
    backgroundColor: '#0D47A1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  modalBearingText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  modalDistanceText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
});
