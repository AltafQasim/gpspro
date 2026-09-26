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
  usedCount?: number;
  visibleCount?: number;
  altitude?: number;
  accuracy?: number;
  nightMode?: boolean;
  onSelectSatellite?: (sat: Satellite) => void;
}

const RADAR_SIZE = 270;
const RADAR_RADIUS = RADAR_SIZE / 2;

export const SatelliteRadar: React.FC<SatelliteRadarProps> = ({
  usedCount = 33,
  visibleCount = 57,
  altitude = -53,
  accuracy = 3,
  nightMode = false,
  onSelectSatellite,
}) => {
  // Radar beam rotation animation
  const spinAnim = useRef(new Animated.Value(0)).current;

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

  const spinInterpolation = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Calculate satellite x, y coordinates
  const getCoordinates = (azimuth: number, elevation: number) => {
    // 90 deg elevation is center, 0 deg is edge
    const r = RADAR_RADIUS * ((90 - elevation) / 90) * 0.9;
    const rad = (azimuth * Math.PI) / 180;
    const x = RADAR_RADIUS + r * Math.sin(rad);
    const y = RADAR_RADIUS - r * Math.cos(rad);
    return { x, y };
  };

  const radarTheme = nightMode
    ? {
        border: 'rgba(255, 82, 82, 0.4)',
        axis: 'rgba(255, 82, 82, 0.5)',
        cardinal: '#FF5252',
        zenith: '#FF1744',
        text: '#ECEFF1',
        subtext: '#90A4AE',
        radarBg: 'rgba(20, 10, 15, 0.7)',
        beamColor: 'rgba(255, 82, 82, 0.15)',
      }
    : {
        border: '#80DEEA',
        axis: '#78909C',
        cardinal: '#263238',
        zenith: '#212121',
        text: '#212121',
        subtext: '#455A64',
        radarBg: 'transparent',
        beamColor: 'rgba(77, 208, 225, 0.12)',
      };

  return (
    <View style={styles.container}>
      {/* Radar Circle */}
      <View
        style={[
          styles.radarBox,
          {
            backgroundColor: radarTheme.radarBg,
          },
        ]}>
        {/* Outer Circle (0° Horizon) */}
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

        {/* Crosshair Axes */}
        {/* Vertical Axis (N - S) */}
        <View style={[styles.axisV, { backgroundColor: radarTheme.axis }]} />
        {/* Horizontal Axis (W - E) */}
        <View style={[styles.axisH, { backgroundColor: radarTheme.axis }]} />

        {/* Cardinal Directions */}
        <Text style={[styles.cardinalN, { color: radarTheme.cardinal }]}>N</Text>
        <Text style={[styles.cardinalS, { color: radarTheme.cardinal }]}>S</Text>
        <Text style={[styles.cardinalW, { color: radarTheme.cardinal }]}>W</Text>
        <Text style={[styles.cardinalE, { color: radarTheme.cardinal }]}>E</Text>

        {/* Radar Rotating Sweep Line */}
        <Animated.View
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

        {/* Zenith Center Point (Boat GPS Position) */}
        <View style={[styles.zenithDot, { backgroundColor: radarTheme.zenith }]} />

        {/* Satellite Points */}
        {INITIAL_SATELLITES.map((sat) => {
          const { x, y } = getCoordinates(sat.azimuth, sat.elevation);
          const isGps = sat.type === 'gps' || sat.used;

          return (
            <TouchableOpacity
              key={sat.id}
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
      </View>

      {/* Telemetry Stats Bar matching screenshot */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <View style={styles.statGroup}>
            <Text style={[styles.statLabel, { color: radarTheme.text }]}>Used: </Text>
            <Text style={[styles.statValueGreen]}>{usedCount}</Text>
          </View>

          <View style={styles.statGroup}>
            <Text style={[styles.statLabel, { color: radarTheme.text }]}>Visible: </Text>
            <Text style={[styles.statValueOrange]}>{visibleCount}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statGroup}>
            <Text style={[styles.statSubText, { color: radarTheme.subtext }]}>
              Alt: <Text style={styles.statSubBold}>{altitude} m</Text>
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
  radarBox: {
    width: RADAR_SIZE,
    height: RADAR_SIZE,
    borderRadius: RADAR_SIZE / 2,
    position: 'relative',
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
    height: RADAR_SIZE - 4,
    top: 2,
    left: RADAR_RADIUS - 0.5,
  },
  axisH: {
    position: 'absolute',
    height: 1,
    width: RADAR_SIZE - 4,
    left: 2,
    top: RADAR_RADIUS - 0.5,
  },
  cardinalN: {
    position: 'absolute',
    top: 6,
    fontWeight: '800',
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
    width: 9,
    height: 9,
    borderRadius: 4.5,
    zIndex: 20,
  },
  satItem: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 3,
    zIndex: 15,
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
    marginTop: 14,
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
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  statValueGreen: {
    fontSize: 18,
    fontWeight: '900',
    color: '#00C853',
  },
  statValueOrange: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FF9100',
  },
  statSubText: {
    fontSize: 15,
    fontWeight: '500',
  },
  statSubBold: {
    fontWeight: '700',
    fontSize: 15,
  },
});
