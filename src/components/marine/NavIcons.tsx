import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface IconProps {
  size?: number;
}

// 1. Compass: Modern Marine 3D Gyro Compass
export const CompassIcon: React.FC<IconProps> = ({ size = 68 }) => {
  return (
    <View style={[styles.outerGlowRing, { width: size, height: size, borderRadius: size / 2 }]}>
      <View style={[styles.innerPlate, { backgroundColor: '#1A237E' }]}>
        {/* Outer Degree Rim */}
        <View style={styles.compassRim} />
        {/* Cardinal North Pin */}
        <Text style={styles.compassNorthText}>N</Text>
        {/* High-definition 3D Dual-Color Needle */}
        <View style={styles.compassNeedleStem}>
          <View style={styles.needleRedHalf} />
          <View style={styles.needleWhiteHalf} />
          <View style={styles.needlePivot} />
        </View>
      </View>
    </View>
  );
};

// 2. Waypoints: Glowing GPS Fishing Beacons & Connecting Route
export const WaypointsIcon: React.FC<IconProps> = ({ size = 68 }) => {
  return (
    <View style={[styles.outerGlowRing, { width: size, height: size, borderRadius: size / 2 }]}>
      <View style={[styles.innerPlate, { backgroundColor: '#E64A19' }]}>
        {/* Connected Route Polyline */}
        <View style={styles.routeConnectorLine1} />
        <View style={styles.routeConnectorLine2} />

        {/* Pin 1 (Top Left) */}
        <View style={[styles.modernPin, { top: 9, left: 13 }]}>
          <View style={[styles.pinBubble, { backgroundColor: '#FFD54F' }]}>
            <View style={styles.pinCore} />
          </View>
          <View style={[styles.pinTail, { borderTopColor: '#FFD54F' }]} />
        </View>

        {/* Pin 2 (Top Right) */}
        <View style={[styles.modernPin, { top: 12, right: 12 }]}>
          <View style={[styles.pinBubble, { backgroundColor: '#FFFFFF' }]}>
            <View style={[styles.pinCore, { backgroundColor: '#E64A19' }]} />
          </View>
          <View style={[styles.pinTail, { borderTopColor: '#FFFFFF' }]} />
        </View>

        {/* Pin 3 (Active Fishing Spot - Glowing) */}
        <View style={[styles.modernPin, { bottom: 10, left: 24 }]}>
          <View style={[styles.pinBubble, styles.activePinBubble]}>
            <Text style={styles.activePinStar}>★</Text>
          </View>
          <View style={[styles.pinTail, { borderTopColor: '#00E5FF' }]} />
        </View>
      </View>
    </View>
  );
};

// 3. Map: 3D Folded Nautical Bathymetric Chart
export const MapIcon: React.FC<IconProps> = ({ size = 68 }) => {
  return (
    <View style={[styles.outerGlowRing, { width: size, height: size, borderRadius: size / 2 }]}>
      <View style={[styles.innerPlate, { backgroundColor: '#512DA8' }]}>
        {/* 3D Folded Map Base */}
        <View style={styles.modernMapBase}>
          <View style={styles.mapFoldSegment1}>
            <View style={styles.bathymetricCurve1} />
            <View style={styles.bathymetricCurve2} />
          </View>
          <View style={styles.mapFoldSegment2}>
            <View style={styles.seaChannelLane} />
            {/* Marine Beacon */}
            <View style={styles.mapBeaconDot} />
          </View>
          <View style={styles.mapFoldSegment3}>
            <View style={styles.bathymetricCurve3} />
          </View>
        </View>
      </View>
    </View>
  );
};

// 4. Tide: Dynamic Liquid Ocean Swell & Wave Foam
export const TideIcon: React.FC<IconProps> = ({ size = 68 }) => {
  return (
    <View style={[styles.outerGlowRing, { width: size, height: size, borderRadius: size / 2 }]}>
      <View style={[styles.innerPlate, { backgroundColor: '#00897B' }]}>
        {/* Wave Swell */}
        <View style={styles.modernWaveContainer}>
          <View style={styles.waveLayerDeep} />
          <View style={styles.waveLayerCrest}>
            <View style={styles.foamSplash1} />
            <View style={styles.foamSplash2} />
          </View>
          <Text style={styles.tideIndicatorSymbol}>〰️</Text>
        </View>
      </View>
    </View>
  );
};

// 5. Settings: Precision Dual Marine Cogs & Compass Tool
export const SettingsIcon: React.FC<IconProps> = ({ size = 68 }) => {
  return (
    <View style={[styles.outerGlowRing, { width: size, height: size, borderRadius: size / 2 }]}>
      <View style={[styles.innerPlate, { backgroundColor: '#C2185B' }]}>
        {/* Modern Gear Assembly */}
        <View style={styles.modernGearContainer}>
          <View style={styles.gearOuter}>
            <View style={[styles.gearSpoke, { transform: [{ rotate: '0deg' }] }]} />
            <View style={[styles.gearSpoke, { transform: [{ rotate: '45deg' }] }]} />
            <View style={[styles.gearSpoke, { transform: [{ rotate: '90deg' }] }]} />
            <View style={[styles.gearSpoke, { transform: [{ rotate: '135deg' }] }]} />
            <View style={styles.gearInnerHub}>
              <View style={styles.gearCenterHole} />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

// 6. Calendar: Solunar Lunar Tithi & Speedometer Dial
export const CalendarIcon: React.FC<IconProps> = ({ size = 68 }) => {
  return (
    <View style={[styles.outerGlowRing, { width: size, height: size, borderRadius: size / 2 }]}>
      <View style={[styles.innerPlate, { backgroundColor: '#0288D1' }]}>
        <View style={styles.calendarCard}>
          {/* Top Red Binding Bar */}
          <View style={styles.calendarTopBar}>
            <View style={styles.calendarRing} />
            <View style={styles.calendarRing} />
          </View>
          {/* Calendar Body with Crescent Moon & Tithi */}
          <View style={styles.calendarBody}>
            <Text style={styles.calendarTithiChar}>૧૫</Text>
            <Text style={styles.calendarMoonIcon}>🌙</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

// 7. Track: Live Glowing GPS Ocean Track with Target Vessel
export const TrackIcon: React.FC<IconProps> = ({ size = 68 }) => {
  return (
    <View style={[styles.outerGlowRing, { width: size, height: size, borderRadius: size / 2 }]}>
      <View style={[styles.innerPlate, { backgroundColor: '#7B1FA2' }]}>
        {/* Circular GPS Track Radar */}
        <View style={styles.trackRadarRing}>
          <View style={styles.trackRadarSweep} />
          <View style={styles.trackDottedArc} />
          {/* Target Vessel Arrow */}
          <View style={styles.trackVesselArrow} />
          <View style={styles.trackCenterBlip} />
        </View>
      </View>
    </View>
  );
};

// 8. Sea Weather: Radiant Sun & Marine Precipitation Cloud
export const WeatherIcon: React.FC<IconProps> = ({ size = 68 }) => {
  return (
    <View style={[styles.outerGlowRing, { width: size, height: size, borderRadius: size / 2 }]}>
      <View style={[styles.innerPlate, { backgroundColor: '#1565C0' }]}>
        {/* Golden Sun */}
        <View style={styles.weatherSunDisc} />
        {/* Fluffy Storm Cloud */}
        <View style={styles.weatherCloudBody}>
          <View style={styles.cloudPuff1} />
          <View style={styles.cloudPuff2} />
          <View style={styles.cloudPuff3} />
          <View style={styles.cloudFlatBase} />
        </View>
        {/* Rain drop */}
        <View style={styles.rainDropPebble} />
      </View>
    </View>
  );
};

// 9. Camera: Marine Catch Lens & Digital Watermark
export const CameraIcon: React.FC<IconProps> = ({ size = 68 }) => {
  return (
    <View style={[styles.outerGlowRing, { width: size, height: size, borderRadius: size / 2 }]}>
      <View style={[styles.innerPlate, { backgroundColor: '#F57C00' }]}>
        <View style={styles.modernCameraBox}>
          {/* Viewfinder Hump */}
          <View style={styles.cameraPrism} />
          {/* Main Body */}
          <View style={styles.cameraChassis}>
            <View style={styles.cameraShutterBtn} />
            {/* Multi-Coated Lens */}
            <View style={styles.cameraLensBezel}>
              <View style={styles.cameraLensGlass}>
                <View style={styles.cameraLensGlint} />
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerGlowRing: {
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  innerPlate: {
    width: '78%',
    height: '78%',
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },

  // 1. COMPASS
  compassRim: {
    position: 'absolute',
    width: '84%',
    height: '84%',
    borderRadius: 9999,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 229, 255, 0.6)',
  },
  compassNorthText: {
    position: 'absolute',
    top: 3,
    fontSize: 10,
    fontWeight: '900',
    color: '#FF5252',
  },
  compassNeedleStem: {
    width: 14,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '42deg' }],
  },
  needleRedHalf: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 18,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#FF1744',
  },
  needleWhiteHalf: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 18,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#ECEFF1',
  },
  needlePivot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFD600',
    borderWidth: 1,
    borderColor: '#000000',
  },

  // 2. WAYPOINTS
  routeConnectorLine1: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 20,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    transform: [{ rotate: '25deg' }],
  },
  routeConnectorLine2: {
    position: 'absolute',
    bottom: 22,
    left: 26,
    width: 18,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    transform: [{ rotate: '-45deg' }],
  },
  modernPin: {
    position: 'absolute',
    alignItems: 'center',
  },
  pinBubble: {
    width: 13,
    height: 13,
    borderRadius: 6.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinCore: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#D84315',
  },
  pinTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 3.5,
    borderRightWidth: 3.5,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
  activePinBubble: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#00E5FF',
    shadowColor: '#00E5FF',
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  activePinStar: {
    fontSize: 9,
    color: '#000000',
    fontWeight: '900',
  },

  // 3. MAP
  modernMapBase: {
    width: 36,
    height: 28,
    flexDirection: 'row',
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  mapFoldSegment1: {
    flex: 1,
    backgroundColor: '#3949AB',
    position: 'relative',
    overflow: 'hidden',
  },
  mapFoldSegment2: {
    flex: 1.2,
    backgroundColor: '#283593',
    position: 'relative',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  mapFoldSegment3: {
    flex: 1,
    backgroundColor: '#1A237E',
    position: 'relative',
  },
  bathymetricCurve1: {
    position: 'absolute',
    top: 4,
    left: -4,
    width: 14,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#00E5FF',
  },
  bathymetricCurve2: {
    position: 'absolute',
    bottom: 3,
    left: 2,
    width: 12,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#00E5FF',
  },
  seaChannelLane: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 4,
    width: 4,
    backgroundColor: '#00E676',
    opacity: 0.7,
  },
  mapBeaconDot: {
    position: 'absolute',
    top: 8,
    right: 3,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#FFD600',
  },
  bathymetricCurve3: {
    position: 'absolute',
    top: 8,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#00E5FF',
  },

  // 4. TIDE
  modernWaveContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveLayerDeep: {
    position: 'absolute',
    bottom: -12,
    width: 42,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#004D40',
  },
  waveLayerCrest: {
    width: 38,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#00B4D8',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    position: 'relative',
  },
  foamSplash1: {
    position: 'absolute',
    top: 2,
    right: 6,
    width: 6,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  foamSplash2: {
    position: 'absolute',
    top: 5,
    left: 8,
    width: 8,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  tideIndicatorSymbol: {
    fontSize: 16,
    marginTop: 4,
  },

  // 5. SETTINGS
  modernGearContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gearOuter: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  gearSpoke: {
    position: 'absolute',
    width: 34,
    height: 8,
    backgroundColor: '#FFD54F',
    borderRadius: 2,
  },
  gearInnerHub: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFE082',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#880E4F',
  },
  gearCenterHole: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#880E4F',
  },

  // 6. CALENDAR
  calendarCard: {
    width: 32,
    height: 34,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  calendarTopBar: {
    height: 10,
    backgroundColor: '#D32F2F',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  calendarRing: {
    width: 3,
    height: 5,
    borderRadius: 1.5,
    backgroundColor: '#FFFFFF',
  },
  calendarBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 2,
  },
  calendarTithiChar: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0D47A1',
    lineHeight: 12,
  },
  calendarMoonIcon: {
    fontSize: 8,
    lineHeight: 9,
  },

  // 7. TRACK
  trackRadarRing: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: '#00E5FF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  trackRadarSweep: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 17,
    borderTopWidth: 2,
    borderColor: '#FFD600',
    transform: [{ rotate: '45deg' }],
  },
  trackDottedArc: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  trackVesselArrow: {
    position: 'absolute',
    top: 4,
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderBottomWidth: 9,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#FF5252',
  },
  trackCenterBlip: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00E676',
  },

  // 8. WEATHER
  weatherSunDisc: {
    position: 'absolute',
    top: 8,
    right: 10,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFB300',
    borderWidth: 1.5,
    borderColor: '#FFE082',
  },
  weatherCloudBody: {
    position: 'absolute',
    bottom: 10,
    left: 8,
    width: 28,
    height: 18,
    alignItems: 'center',
  },
  cloudPuff1: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ECEFF1',
  },
  cloudPuff2: {
    position: 'absolute',
    top: -2,
    left: 8,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
  },
  cloudPuff3: {
    position: 'absolute',
    top: 3,
    right: 2,
    width: 11,
    height: 11,
    borderRadius: 5.5,
    backgroundColor: '#CFD8DC',
  },
  cloudFlatBase: {
    position: 'absolute',
    bottom: 2,
    width: 26,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ECEFF1',
  },
  rainDropPebble: {
    position: 'absolute',
    bottom: 4,
    left: 17,
    width: 3,
    height: 5,
    borderRadius: 1.5,
    backgroundColor: '#00E5FF',
  },

  // 9. CAMERA
  modernCameraBox: {
    alignItems: 'center',
  },
  cameraPrism: {
    width: 12,
    height: 4,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    backgroundColor: '#E65100',
  },
  cameraChassis: {
    width: 32,
    height: 22,
    borderRadius: 5,
    backgroundColor: '#37474F',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#78909C',
    position: 'relative',
  },
  cameraShutterBtn: {
    position: 'absolute',
    top: 2,
    left: 3,
    width: 4,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#FF1744',
  },
  cameraLensBezel: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#263238',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#B0BEC5',
  },
  cameraLensGlass: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00E5FF',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  cameraLensGlint: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#FFFFFF',
    marginTop: 1,
    marginLeft: 1,
  },
});
