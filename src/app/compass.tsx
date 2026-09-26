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

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DIAL_SIZE = Math.min(SCREEN_WIDTH * 0.82, 330);
const DIAL_RADIUS = DIAL_SIZE / 2;

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
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [speedKnots, setSpeedKnots] = useState<number>(4.2);
  const [nightMode, setNightMode] = useState<boolean>(false);

  // Target Information State
  const [targetName, setTargetName] = useState<string>('7ka cheo ram reef');
  const [targetCoords, setTargetCoords] = useState<string>("N 20° 43.945', E 71° 04.794'");
  const [distanceNmi, setDistanceNmi] = useState<string>('1.82 Mi');
  const [showWaypointModal, setShowWaypointModal] = useState<boolean>(false);
  const [modalSearch, setModalSearch] = useState<string>('');

  const currentPosLat = "N 20° 44.571'";
  const currentPosLon = "E 71° 04.313'";
  const etaTime = '08:42 PM';
  const currentTime = '08:17 PM';
  const moonRise = '5:46 PM';
  const moonSet = '5:07 AM';
  const moonIllumination = '99%';

  // Smooth continuous rotation animation refs (shortest angle calculation)
  const accumulatedRotationRef = useRef<number>(-354);
  const accumulatedArrowRef = useRef<number>(141);
  const rotationAnim = useRef(new Animated.Value(-354)).current;
  const arrowRotateAnim = useRef(new Animated.Value(141)).current;

  // Function to smoothly animate compass heading and waypoint pointer
  const animateToHeading = (newHeading: number, newTargetBearing: number, navigating: boolean) => {
    const normH = ((newHeading % 360) + 360) % 360;
    setHeading(Math.round(normH));

    // Compass bezel rotates in opposite direction to show magnetic direction
    const targetDialAngle = -normH;
    const dialDiff = ((targetDialAngle - (accumulatedRotationRef.current % 360) + 540) % 360) - 180;
    accumulatedRotationRef.current += dialDiff;

    Animated.spring(rotationAnim, {
      toValue: accumulatedRotationRef.current,
      friction: 12,
      tension: 45,
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
        tension: 45,
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
      setDistanceNmi(params.targetDistance || '0.00 Mi');
      if (params.targetLat && params.targetLon) {
        setTargetCoords(`${params.targetLat}, ${params.targetLon}`);
      }
      setIsNavigating(true);
      animateToHeading(heading, b, true);
    } else {
      const globalTarget = getActiveTarget();
      if (globalTarget) {
        const b = parseInt(globalTarget.bearing) || 0;
        setTargetName(globalTarget.name);
        setTargetBearing(b);
        setDistanceNmi(globalTarget.distance);
        setTargetCoords(
          `${globalTarget.latDir} ${globalTarget.latDeg}° ${globalTarget.latMin}', ${globalTarget.lonDir} ${globalTarget.lonDeg}° ${globalTarget.lonMin}'`
        );
        setIsNavigating(true);
        animateToHeading(heading, b, true);
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
        setDistanceNmi(newTarget.distance);
        setTargetCoords(
          `${newTarget.latDir} ${newTarget.latDeg}° ${newTarget.latMin}', ${newTarget.lonDir} ${newTarget.lonDeg}° ${newTarget.lonMin}'`
        );
        setIsNavigating(true);
        animateToHeading(heading, b, true);
      } else {
        setTargetName('');
        setIsNavigating(false);
        setTargetBearing(0);
        setDistanceNmi('--');
        setTargetCoords('--');
      }
    });
    return unsub;
  }, [heading]);

  // Gentle realistic marine heading sway simulation for lifelike gyro motion
  useEffect(() => {
    let curH = heading;
    const interval = setInterval(() => {
      // Gentle natural boat yaw sway (-1.2° to +1.2°)
      const delta = (Math.random() - 0.5) * 2.4;
      curH = (curH + delta + 360) % 360;
      animateToHeading(curH, targetBearing, isNavigating && !!targetName);
    }, 1200);

    return () => clearInterval(interval);
  }, [targetBearing, isNavigating, targetName]);

  // PanResponder to allow captain to smoothly drag / rotate compass dial on any device
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        // Drag horizontally to rotate compass dial smoothly
        const deltaDeg = gestureState.dx * 0.4;
        const newH = (heading - deltaDeg + 360) % 360;
        animateToHeading(newH, targetBearing, isNavigating && !!targetName);
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
        bg: '#0A0E17',
        headerText: '#FFFFFF',
        cardBg: '#131B2A',
        cardBorder: 'rgba(0, 229, 255, 0.2)',
        label: '#90A4AE',
        value: '#00E5FF',
        subVal: '#81D4FA',
        accent: '#00E5FF',
        dialBezel: '#00B0FF',
        dialGlow: 'rgba(0, 229, 255, 0.15)',
        arrowColor: '#FF9100',
        hubColor: '#FFB300',
      }
    : {
        bg: '#F4FAFC',
        headerText: '#102A43',
        cardBg: '#E0F7FA',
        cardBorder: '#80DEEA',
        label: '#243B53',
        value: '#00796B',
        subVal: '#0097A7',
        accent: '#00BCD4',
        dialBezel: '#00E5FF',
        dialGlow: 'rgba(0, 229, 255, 0.25)',
        arrowColor: '#FF6D00',
        hubColor: '#FF9100',
      };

  const formattedHeading = heading.toString().padStart(3, '0');
  const allSavedWaypoints = getWaypoints();
  const filteredWaypoints = allSavedWaypoints.filter(
    (wp) =>
      wp.name.toLowerCase().includes(modalSearch.toLowerCase()) ||
      wp.latMin.includes(modalSearch) ||
      wp.lonMin.includes(modalSearch)
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar style={nightMode ? 'light' : 'dark'} />

      {/* Screen Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          style={styles.backButton}>
          <Text style={[styles.backArrow, { color: theme.headerText }]}>‹</Text>
          <Text style={[styles.backLabel, { color: theme.headerText }]}>Home</Text>
        </TouchableOpacity>

        <Text style={[styles.screenTitle, { color: theme.headerText }]}>
          MARINE COMPASS
        </Text>

        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => setNightMode(!nightMode)}
          style={[styles.nightToggle, { borderColor: theme.cardBorder }]}>
          <Text style={[styles.nightToggleText, { color: theme.label }]}>
            {nightMode ? '🌙' : '☀️'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}>
        {/* COMPASS DIAL SECTION */}
        <View style={styles.dialWrapper}>
          {/* Top Lubber Line Indicator (Golden Triangle with live degrees) */}
          <View style={styles.lubberWrapper}>
            <View style={styles.lubberTriangle} />
            <View style={styles.lubberBadge}>
              <Text style={styles.lubberDegreeText}>{formattedHeading}°</Text>
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
                shadowColor: theme.accent,
              },
            ]}>
            {/* Rotating Bezel with Degree Ticks & Cardinals */}
            <Animated.View
              style={[
                styles.dialFace,
                {
                  transform: [
                    {
                      rotate: rotationAnim.interpolate({
                        inputRange: [-7200, 7200],
                        outputRange: ['-7200deg', '7200deg'],
                      }),
                    },
                  ],
                },
              ]}>
              {/* Outer Cyan Ring */}
              <View style={styles.bezelRing} />

              {/* Port (Red) / Starboard (Green) Sectors */}
              <View style={styles.portStarboardRing}>
                <View style={styles.greenStarboardArc} />
                <View style={styles.redPortArc} />
              </View>

              {/* Cardinal Markers */}
              <Text style={styles.cardinalN}>N</Text>
              <Text style={styles.cardinalE}>E  90°</Text>
              <Text style={styles.cardinalS}>S  180°</Text>
              <Text style={styles.cardinalW}>270°  W</Text>

              {/* Degree numbers matching screenshot */}
              <Text style={[styles.degLabel, { top: 18, right: 70 }]}>30°</Text>
              <Text style={[styles.degLabel, { top: 38, right: 38 }]}>45°</Text>
              <Text style={[styles.degLabel, { top: 72, right: 18 }]}>60°</Text>
              <Text style={[styles.degLabel, { bottom: 72, right: 18 }]}>120°</Text>
              <Text style={[styles.degLabel, { bottom: 38, right: 38 }]}>135°</Text>
              <Text style={[styles.degLabel, { bottom: 18, right: 70 }]}>150°</Text>
              <Text style={[styles.degLabel, { bottom: 18, left: 70 }]}>210°</Text>
              <Text style={[styles.degLabel, { bottom: 38, left: 38 }]}>225°</Text>
              <Text style={[styles.degLabel, { bottom: 72, left: 18 }]}>240°</Text>
              <Text style={[styles.degLabel, { top: 72, left: 18 }]}>300°</Text>
              <Text style={[styles.degLabel, { top: 38, left: 38 }]}>315°</Text>
              <Text style={[styles.degLabel, { top: 18, left: 70 }]}>330°</Text>
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
                          inputRange: [-7200, 7200],
                          outputRange: ['-7200deg', '7200deg'],
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
                {/* Needle Shaft */}
                <View
                  style={[
                    styles.navArrowShaft,
                    { backgroundColor: theme.arrowColor },
                  ]}
                />
                {/* Target Bearing Degree Pip at perimeter */}
                <View style={[styles.targetPipBadge, { backgroundColor: theme.arrowColor }]}>
                  <Text style={styles.targetPipText}>★ {targetBearing}°</Text>
                </View>
                {/* Center Nautical Pivot Hub */}
                <View style={[styles.centerNavHub, { borderColor: theme.hubColor }]}>
                  <View style={[styles.centerNavDot, { backgroundColor: theme.hubColor }]} />
                </View>
              </Animated.View>
            ) : (
              /* Center Digital Heading Display when no target active */
              <View style={styles.centerHeadingBox}>
                <Text style={styles.centerHeadingText}>{formattedHeading}°</Text>
                <Text style={styles.centerHeadingSub}>STEERING</Text>
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
                { backgroundColor: isMuted ? '#78909C' : '#D32F2F' },
              ]}>
              <Text style={styles.roundActionIcon}>{isMuted ? '🔇' : '🔔'}</Text>
            </TouchableOpacity>

            {/* Cancel / Clear Navigation Target Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleCancelTarget}
              style={[styles.roundActionBtn, { backgroundColor: '#C62828' }]}>
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
            <Text style={styles.steeringBannerTitle}>
              {isTargetLocked
                ? '🟢 ON COURSE TO TARGET'
                : relativeSteerDeg > 0
                ? `👉 STEER STARBOARD +${Math.abs(relativeSteerDeg)}°`
                : `👈 STEER PORT -${Math.abs(relativeSteerDeg)}°`}
            </Text>
            <Text style={styles.steeringBannerSub}>
              Target: {targetName} ({targetBearing}°) • Distance: {distanceNmi}
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            onPress={handleOpenWaypointPicker}
            activeOpacity={0.8}
            style={styles.noTargetBanner}>
            <Text style={styles.noTargetBannerText}>
              🎯 NO TARGET ACTIVE • TAP TO SELECT SAVED WAYPOINT
            </Text>
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
                { backgroundColor: theme.cardBg, borderColor: theme.cardBorder },
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

              <Text style={[styles.targetNameText, { color: theme.value }]} numberOfLines={1}>
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
    paddingVertical: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 6,
  },
  backArrow: {
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 28,
  },
  backLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  screenTitle: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
  },
  nightToggle: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
  },
  nightToggleText: {
    fontSize: 15,
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 40,
  },

  // DIAL SECTION
  dialWrapper: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 8,
    position: 'relative',
  },
  lubberWrapper: {
    alignItems: 'center',
    marginBottom: -10,
    zIndex: 30,
  },
  lubberTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 14,
    borderRightWidth: 14,
    borderTopWidth: 20,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FFB300',
  },
  lubberBadge: {
    backgroundColor: '#FFB300',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: -4,
  },
  lubberDegreeText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '900',
  },
  dialFrame: {
    borderWidth: 3.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
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
    borderWidth: 2,
    borderColor: '#00E5FF',
  },
  portStarboardRing: {
    position: 'absolute',
    width: '82%',
    height: '82%',
    borderRadius: 9999,
    overflow: 'hidden',
  },
  greenStarboardArc: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '50%',
    borderRightWidth: 3,
    borderColor: '#00E676',
  },
  redPortArc: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '50%',
    borderLeftWidth: 3,
    borderColor: '#FF5252',
  },
  cardinalN: {
    position: 'absolute',
    top: 10,
    fontSize: 16,
    fontWeight: '900',
    color: '#00B0FF',
  },
  cardinalE: {
    position: 'absolute',
    right: 12,
    fontSize: 14,
    fontWeight: '800',
    color: '#00B0FF',
  },
  cardinalS: {
    position: 'absolute',
    bottom: 12,
    fontSize: 14,
    fontWeight: '800',
    color: '#00B0FF',
  },
  cardinalW: {
    position: 'absolute',
    left: 12,
    fontSize: 14,
    fontWeight: '800',
    color: '#00B0FF',
  },
  degLabel: {
    position: 'absolute',
    fontSize: 9.5,
    fontWeight: '700',
    color: '#00B0FF',
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
    borderLeftWidth: 16,
    borderRightWidth: 16,
    borderBottomWidth: 34,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    position: 'absolute',
    top: 24,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 4,
  },
  navArrowShaft: {
    width: 8,
    height: 72,
    borderRadius: 4,
    position: 'absolute',
    top: 48,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 2,
    elevation: 3,
  },
  targetPipBadge: {
    position: 'absolute',
    top: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  targetPipText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  centerNavHub: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
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
    fontSize: 32,
    fontWeight: '900',
    color: '#102A43',
    letterSpacing: 1,
  },
  centerHeadingSub: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    marginTop: -2,
    letterSpacing: 1,
  },

  // Dial Bottom Controls (Mute & Cross Cancel)
  dialActionsRow: {
    position: 'absolute',
    bottom: -10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 40,
  },
  roundActionBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  roundActionIcon: {
    fontSize: 22,
  },
  roundActionTextX: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },

  // STEERING GUIDANCE BANNER
  steeringBanner: {
    width: '90%',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    marginBottom: 8,
    borderWidth: 1.5,
  },
  steeringLocked: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: '#10B981',
  },
  steeringAdjust: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: '#F59E0B',
  },
  steeringBannerTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  steeringBannerSub: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
  },
  noTargetBanner: {
    width: '90%',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    marginBottom: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
  },
  noTargetBannerText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    textAlign: 'center',
  },

  // 5 SHORTCUT BUTTONS
  shortcutRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '90%',
    marginVertical: 14,
  },
  shortcutCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
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
    gap: 8,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 8,
  },
  gridCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 82,
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
