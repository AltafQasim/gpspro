import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { INITIAL_SATELLITES } from './satelliteData';
import { Satellite } from './types';

interface SatelliteRadarProps {
  heading?: number;
  satellites?: Satellite[];
  usedCount?: number;
  visibleCount?: number;
  altitude?: number;
  accuracy?: number;
  nightMode?: boolean;
  onSelectSatellite?: (sat: Satellite) => void;
}

const RADAR_SIZE = 270;
const RADAR_RADIUS = RADAR_SIZE / 2;

// 12 Degree tick marks for authentic nautical compass ring
const COMPASS_TICKS = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

export const SatelliteRadar: React.FC<SatelliteRadarProps> = ({
  heading = 0,
  satellites = INITIAL_SATELLITES,
  usedCount = 33,
  visibleCount = 57,
  altitude = -53,
  accuracy = 3,
  nightMode = false,
  onSelectSatellite,
}) => {
  // Radar sweep animation
  const spinAnim = useRef(new Animated.Value(0)).current;

  // Real-time Smooth Compass Dial Rotation (Continuous shortest-angle spring)
  const accumulatedRotationRef = useRef<number>(0);
  const headingAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [spinAnim]);

  useEffect(() => {
    const normH = ((heading % 360) + 360) % 360;
    // Compass dial rotates in opposite direction (-normH) so N points to real geographic North
    const targetDialAngle = -normH;
    const current = accumulatedRotationRef.current;
    const diff = ((((targetDialAngle - (current % 360)) + 540) % 360) - 180);
    const newAccumulated = current + diff;
    accumulatedRotationRef.current = newAccumulated;

    Animated.spring(headingAnim, {
      toValue: newAccumulated,
      friction: 12,
      tension: 50,
      useNativeDriver: true,
    }).start();
  }, [heading]);

  const spinInterpolation = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const dialRotationInterpolation = headingAnim.interpolate({
    inputRange: [-36000, 36000],
    outputRange: ['-36000deg', '36000deg'],
  });

  // Calculate satellite x, y coordinates
  const getCoordinates = (azimuth: number, elevation: number) => {
    // 90 deg elevation is center, 0 deg is edge
    const r = RADAR_RADIUS * ((90 - elevation) / 90) * 0.88;
    const rad = (azimuth * Math.PI) / 180;
    const x = RADAR_RADIUS + r * Math.sin(rad);
    const y = RADAR_RADIUS - r * Math.cos(rad);
    return { x, y };
  };

  const radarTheme = nightMode
    ? {
        border: 'rgba(255, 82, 82, 0.4)',
        axis: 'rgba(255, 82, 82, 0.45)',
        cardinal: '#FF5252',
        cardinalN: '#FF1744',
        zenith: '#FF1744',
        text: '#ECEFF1',
        subtext: '#90A4AE',
        radarBg: 'rgba(20, 10, 15, 0.75)',
        beamColor: 'rgba(255, 82, 82, 0.15)',
        tick: 'rgba(255, 82, 82, 0.35)',
        lubber: '#FF1744',
      }
    : {
        border: '#80DEEA',
        axis: '#90A4AE',
        cardinal: '#37474F',
        cardinalN: '#D32F2F',
        zenith: '#00838F',
        text: '#212121',
        subtext: '#546E7A',
        radarBg: 'rgba(224, 247, 250, 0.25)',
        beamColor: 'rgba(77, 208, 225, 0.12)',
        tick: 'rgba(120, 144, 156, 0.4)',
        lubber: '#E53935',
      };

  return (
    <View style={styles.container}>
      {/* Radar Box & Lubber Line Pointer */}
      <View style={styles.radarContainerWrapper}>
        {/* Vessel Heading Lubber Line (Top Reference Index) */}
        <View style={styles.lubberLineContainer}>
          <View style={[styles.lubberLine, { backgroundColor: radarTheme.lubber }]} />
          <View style={[styles.lubberTriangle, { borderTopColor: radarTheme.lubber }]} />
        </View>

        {/* Radar Circular Frame */}
        <View
          style={[
            styles.radarBox,
            {
              backgroundColor: radarTheme.radarBg,
            },
          ]}>
          {/* Static Outer Circular Bezel */}
          <View
            style={[
              styles.circle,
              styles.outerCircle,
              { borderColor: radarTheme.border },
            ]}
          />

          {/* Middle Circle (45° Elevation) */}
          <View
            style={[
              styles.circle,
              styles.midCircle,
              { borderColor: radarTheme.border },
            ]}
          />

          {/* Inner Circle (70° Elevation) */}
          <View
            style={[
              styles.circle,
              styles.innerCircle,
              { borderColor: radarTheme.border },
            ]}
          />

          {/* FULLY ROTATING COMPASS DIAL (Crosshairs, Cardinals, Ticks & Satellite Skyplot) */}
          <Animated.View
            style={[
              styles.rotatingDial,
              {
                transform: [{ rotate: dialRotationInterpolation }],
              },
            ]}>
            {/* Crosshair Axes */}
            <View style={[styles.axisV, { backgroundColor: radarTheme.axis }]} />
            <View style={[styles.axisH, { backgroundColor: radarTheme.axis }]} />

            {/* Dial Degree Ticks */}
            {COMPASS_TICKS.map((deg) => {
              const rad = (deg * Math.PI) / 180;
              const r = RADAR_RADIUS - 7;
              const x = RADAR_RADIUS + r * Math.sin(rad);
              const y = RADAR_RADIUS - r * Math.cos(rad);
              const isMajor = deg % 90 === 0;

              return (
                <View
                  key={`tick-${deg}`}
                  style={[
                    styles.tickMark,
                    {
                      left: x - 1,
                      top: y - 1,
                      width: isMajor ? 3 : 2,
                      height: isMajor ? 3 : 2,
                      borderRadius: isMajor ? 1.5 : 1,
                      backgroundColor: isMajor ? radarTheme.cardinal : radarTheme.tick,
                    },
                  ]}
                />
              );
            })}

            {/* Cardinal Direction Letters */}
            <Text style={[styles.cardinalN, { color: radarTheme.cardinalN }]}>N</Text>
            <Text style={[styles.cardinalS, { color: radarTheme.cardinal }]}>S</Text>
            <Text style={[styles.cardinalW, { color: radarTheme.cardinal }]}>W</Text>
            <Text style={[styles.cardinalE, { color: radarTheme.cardinal }]}>E</Text>

            {/* Live Satellites Points - Rotating with True Azimuth */}
            {satellites.map((sat) => {
              const { x, y } = getCoordinates(sat.azimuth, sat.elevation);
              const isGps = sat.type === 'gps' || sat.used;

              return (
                <TouchableOpacity
                  key={`sat-${sat.id}-${sat.prn}`}
                  activeOpacity={0.7}
                  onPress={() => onSelectSatellite && onSelectSatellite(sat)}
                  style={[
                    styles.satItem,
                    isGps ? styles.satCircle : styles.satSquare,
                    {
                      left: x - (isGps ? 9 : 8),
                      top: y - (isGps ? 9 : 8),
                      backgroundColor: isGps
                        ? nightMode
                          ? '#00E676'
                          : '#00E676'
                        : nightMode
                        ? '#2979FF'
                        : '#2979FF',
                    },
                  ]}>
                  <Text
                    style={[
                      styles.satText,
                      {
                        color: isGps ? '#052e16' : '#ffffff',
                        fontWeight: '700',
                      },
                    ]}>
                    {sat.prn}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </Animated.View>

          {/* Radar Rotating Sweep Line Animation */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.sweepContainer,
              {
                transform: [{ rotate: spinInterpolation }],
              },
            ]}>
            <View
              style={[
                styles.sweepLine,
                {
                  backgroundColor: nightMode ? '#FF5252' : '#00BCD4',
                },
              ]}
            />
            <View
              style={[
                styles.sweepGlow,
                {
                  borderRightColor: nightMode
                    ? 'rgba(255, 82, 82, 0.25)'
                    : 'rgba(77, 208, 225, 0.25)',
                },
              ]}
            />
          </Animated.View>

          {/* Zenith Center Point (Boat Position) */}
          <View style={[styles.zenithDot, { backgroundColor: radarTheme.zenith }]} />
        </View>
      </View>

      {/* Telemetry Stats Bar */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <View style={styles.statGroup}>
            <Text style={[styles.statLabel, { color: radarTheme.text }]}>Used: </Text>
            <Text style={styles.statValueGreen}>{usedCount}</Text>
          </View>

          <View style={styles.statGroup}>
            <Text style={[styles.statLabel, { color: radarTheme.text }]}>Visible: </Text>
            <Text style={styles.statValueOrange}>{visibleCount}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statGroup}>
            <Text style={[styles.statSubText, { color: radarTheme.subtext }]}>
              Alt: <Text style={styles.statSubBold}>{altitude > 0 ? `+${altitude}` : altitude} m</Text>
            </Text>
          </View>

          <View style={styles.statGroup}>
            <Text style={[styles.statSubText, { color: radarTheme.subtext }]}>
              Acc: <Text style={styles.statSubBold}>{accuracy} m</Text>
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  radarContainerWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  lubberLineContainer: {
    position: 'absolute',
    top: -10,
    alignItems: 'center',
    zIndex: 30,
  },
  lubberTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  lubberLine: {
    width: 2,
    height: 6,
    borderRadius: 1,
  },
  radarBox: {
    width: RADAR_SIZE,
    height: RADAR_SIZE,
    borderRadius: RADAR_SIZE / 2,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  rotatingDial: {
    position: 'absolute',
    width: RADAR_SIZE,
    height: RADAR_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    position: 'absolute',
    borderWidth: 1.5,
    borderRadius: 9999,
  },
  outerCircle: {
    width: RADAR_SIZE - 2,
    height: RADAR_SIZE - 2,
  },
  midCircle: {
    width: RADAR_SIZE * 0.62,
    height: RADAR_SIZE * 0.62,
  },
  innerCircle: {
    width: RADAR_SIZE * 0.32,
    height: RADAR_SIZE * 0.32,
  },
  axisV: {
    position: 'absolute',
    width: 1,
    height: RADAR_SIZE - 6,
    top: 3,
    left: RADAR_RADIUS - 0.5,
  },
  axisH: {
    position: 'absolute',
    height: 1,
    width: RADAR_SIZE - 6,
    left: 3,
    top: RADAR_RADIUS - 0.5,
  },
  tickMark: {
    position: 'absolute',
  },
  cardinalN: {
    position: 'absolute',
    top: 6,
    fontWeight: '900',
    fontSize: 14,
    zIndex: 10,
  },
  cardinalS: {
    position: 'absolute',
    bottom: 6,
    fontWeight: '800',
    fontSize: 14,
    zIndex: 10,
  },
  cardinalW: {
    position: 'absolute',
    left: 6,
    fontWeight: '800',
    fontSize: 14,
    zIndex: 10,
  },
  cardinalE: {
    position: 'absolute',
    right: 6,
    fontWeight: '800',
    fontSize: 14,
    zIndex: 10,
  },
  sweepContainer: {
    position: 'absolute',
    width: RADAR_SIZE,
    height: RADAR_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sweepLine: {
    position: 'absolute',
    top: 4,
    width: 1.5,
    height: RADAR_RADIUS - 4,
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  sweepGlow: {
    position: 'absolute',
    top: 4,
    left: RADAR_RADIUS - 40,
    width: 40,
    height: RADAR_RADIUS - 4,
    borderRightWidth: 38,
    borderTopWidth: RADAR_RADIUS - 8,
    borderTopColor: 'transparent',
    borderBottomWidth: 0,
    opacity: 0.35,
  },
  zenithDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    zIndex: 25,
  },
  satItem: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 1.5,
    elevation: 3,
    zIndex: 20,
  },
  satCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  satSquare: {
    width: 16,
    height: 16,
    borderRadius: 2.5,
  },
  satText: {
    fontSize: 8.5,
    lineHeight: 10,
    textAlign: 'center',
  },
  statsContainer: {
    marginTop: 12,
    alignItems: 'center',
    gap: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  statGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  statValueGreen: {
    fontSize: 17,
    fontWeight: '900',
    color: '#00C853',
  },
  statValueOrange: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FF9100',
  },
  statSubText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statSubBold: {
    fontWeight: '700',
    fontSize: 14,
  },
});
