export interface Satellite {
  id: number;
  prn: number;
  type: 'gps' | 'glonass' | 'galileo' | 'beidou';
  used: boolean;
  azimuth: number; // 0 - 360 deg
  elevation: number; // 0 - 90 deg (90 is center)
  snr: number; // Signal to noise ratio in dB-Hz
}

export interface MarineNavState {
  latitude: string; // e.g. "N 20° 44.572'"
  longitude: string; // e.g. "E 71° 04.313'"
  altitudeMeters: number;
  accuracyMeters: number;
  usedSatellites: number;
  visibleSatellites: number;
  batteryPercent: number;
  signalBars: number;
  speedKnots: number;
  courseDeg: number;
  hdop: number;
  isFixLocked: boolean;
  nightMode: boolean;
}

export type MarineFeatureId =
  | 'compass'
  | 'waypoints'
  | 'map'
  | 'tide'
  | 'settings'
  | 'calendar'
  | 'track'
  | 'weather'
  | 'camera'
  | 'premium';
