import * as Location from 'expo-location';
import { Platform } from 'react-native';

export interface LocationTelemetry {
  latitude: number;
  longitude: number;
  speedKnots: number;
  altitude?: number;
  accuracy?: number;
  latFormatted: string;
  lonFormatted: string;
}

export type HeadingCallback = (heading: number) => void;
export type LocationCallback = (telemetry: LocationTelemetry) => void;

// Format decimal latitude to Nautical DDM (Degrees & Decimal Minutes)
export function formatNauticalLat(lat: number): string {
  const dir = lat >= 0 ? 'N' : 'S';
  const abs = Math.abs(lat);
  const deg = Math.floor(abs);
  const min = ((abs - deg) * 60).toFixed(3);
  return `${dir} ${deg}° ${min}'`;
}

// Format decimal longitude to Nautical DDM (Degrees & Decimal Minutes)
export function formatNauticalLon(lon: number): string {
  const dir = lon >= 0 ? 'E' : 'W';
  const abs = Math.abs(lon);
  const deg = Math.floor(abs);
  const min = ((abs - deg) * 60).toFixed(3);
  return `${dir} ${deg}° ${min}'`;
}

// Calculate Nautical Miles & Bearing between two GPS points
export function calculateNavDistanceAndBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): { distanceNmi: string; bearing: number } {
  const R = 3440.065; // Earth radius in nautical miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const radLat1 = (lat1 * Math.PI) / 180;
  const radLat2 = (lat2 * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const dist = R * c;

  const y = Math.sin(dLon) * Math.cos(radLat2);
  const x =
    Math.cos(radLat1) * Math.sin(radLat2) -
    Math.sin(radLat1) * Math.cos(radLat2) * Math.cos(dLon);
  let bearing = (Math.atan2(y, x) * 180) / Math.PI;
  bearing = ((bearing % 360) + 360) % 360;

  return {
    distanceNmi: dist.toFixed(2) + ' Mi',
    bearing: Math.round(bearing),
  };
}

// Calculate distance in Kilometers between two lat/lon coordinates (Haversine formula)
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const radLat1 = (lat1 * Math.PI) / 180;
  const radLat2 = (lat2 * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
}

export class GpsService {
  private static posSubscription: Location.LocationSubscription | null = null;
  private static headingSubscription: Location.LocationSubscription | null = null;
  private static webOrientationHandler: any = null;
  private static ecoMode: boolean = false;
  private static lastTelemetry: LocationTelemetry | null = null;

  static getLastTelemetry(): LocationTelemetry | null {
    return this.lastTelemetry;
  }

  static async getCurrentLocationAsync(): Promise<LocationTelemetry | null> {
    if (this.lastTelemetry) return this.lastTelemetry;
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const lat = loc.coords.latitude;
      const lon = loc.coords.longitude;
      const speedKnots =
        loc.coords.speed !== null && loc.coords.speed >= 0
          ? parseFloat((loc.coords.speed * 1.94384).toFixed(1))
          : 0;
      const tele: LocationTelemetry = {
        latitude: lat,
        longitude: lon,
        speedKnots,
        altitude: loc.coords.altitude !== null ? Math.round(loc.coords.altitude) : undefined,
        accuracy: loc.coords.accuracy !== null ? Math.round(loc.coords.accuracy) : undefined,
        latFormatted: formatNauticalLat(lat),
        lonFormatted: formatNauticalLon(lon),
      };
      this.lastTelemetry = tele;
      return tele;
    } catch {
      return null;
    }
  }

  // Sea Eco Mode / Battery Optimization
  static setEcoMode(enabled: boolean) {
    this.ecoMode = enabled;
  }

  static isEcoMode(): boolean {
    return this.ecoMode;
  }

  // Request Foreground Location Permissions
  static async requestPermissions(): Promise<Location.PermissionStatus> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status;
    } catch {
      return Location.PermissionStatus.DENIED;
    }
  }

  // Check current permission status
  static async checkPermissions(): Promise<Location.PermissionStatus> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      return status;
    } catch {
      return Location.PermissionStatus.UNDETERMINED;
    }
  }

  // Start Live GPS Location Tracking with Sea Battery Optimization
  static async startLocationTracking(callback: LocationCallback): Promise<boolean> {
    this.stopLocationTracking();

    // Balanced accuracy and optimal polling interval saves 50%+ battery out at sea
    const accuracy = this.ecoMode ? Location.Accuracy.Balanced : Location.Accuracy.High;
    const timeInterval = this.ecoMode ? 4500 : 2500;
    const distanceInterval = this.ecoMode ? 5 : 2;

    try {
      this.posSubscription = await Location.watchPositionAsync(
        {
          accuracy,
          timeInterval,
          distanceInterval,
        },
        (loc) => {
          const lat = loc.coords.latitude;
          const lon = loc.coords.longitude;
          const speedKnots =
            loc.coords.speed !== null && loc.coords.speed >= 0
              ? parseFloat((loc.coords.speed * 1.94384).toFixed(1))
              : 0;

          const altitude = loc.coords.altitude !== null ? Math.round(loc.coords.altitude) : undefined;
          const accuracy = loc.coords.accuracy !== null ? Math.round(loc.coords.accuracy) : undefined;

          const telemetry: LocationTelemetry = {
            latitude: lat,
            longitude: lon,
            speedKnots,
            altitude,
            accuracy,
            latFormatted: formatNauticalLat(lat),
            lonFormatted: formatNauticalLon(lon),
          };
          this.lastTelemetry = telemetry;
          callback(telemetry);
        }
      );
    } catch {
      // Web Geolocation Fallback
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.geolocation) {
        const watchId = navigator.geolocation.watchPosition(
          (pos) => {
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;
            const speedKnots =
              pos.coords.speed !== null && pos.coords.speed >= 0
                ? parseFloat((pos.coords.speed * 1.94384).toFixed(1))
                : 0;
            const altitude = pos.coords.altitude !== null ? Math.round(pos.coords.altitude) : undefined;
            const telemetry: LocationTelemetry = {
              latitude: lat,
              longitude: lon,
              speedKnots,
              altitude,
              accuracy,
              latFormatted: formatNauticalLat(lat),
              lonFormatted: formatNauticalLon(lon),
            };
            this.lastTelemetry = telemetry;
            callback(telemetry);
          },
          undefined,
          { enableHighAccuracy: !this.ecoMode }
        );
        this.posSubscription = {
          remove: () => navigator.geolocation.clearWatch(watchId),
        } as any;
        return true;
      }
      return false;
    }
  }

  // Start Live Mobile Sensor Compass Heading Tracking with Throttle / Deadband
  static async startHeadingTracking(callback: HeadingCallback): Promise<boolean> {
    this.stopHeadingTracking();

    let lastHeadingTime = 0;
    let lastHeadingValue = -999;
    // 33ms (~30fps) for fluid native compass rotation across all devices
    const minIntervalMs = this.ecoMode ? 140 : 33;
    const minAngleDelta = this.ecoMode ? 0.8 : 0.2;

    try {
      this.headingSubscription = await Location.watchHeadingAsync((headingData) => {
        // Prefer trueHeading, fallback to magHeading
        const rawH =
          headingData.trueHeading >= 0 ? headingData.trueHeading : headingData.magHeading;
        if (typeof rawH === 'number' && !isNaN(rawH)) {
          const now = Date.now();
          // Skip if under minInterval and angle change is negligible
          if (now - lastHeadingTime < minIntervalMs && Math.abs(rawH - lastHeadingValue) < minAngleDelta) {
            return;
          }
          lastHeadingTime = now;
          lastHeadingValue = rawH;
          callback(rawH);
        }
      });
      return true;
    } catch {
      // Web DeviceOrientation fallback for browser testing
      if (Platform.OS === 'web' && typeof window !== 'undefined' && 'addEventListener' in window) {
        this.webOrientationHandler = (e: any) => {
          let h: number | null = null;
          if (typeof e.webkitCompassHeading !== 'undefined') {
            h = e.webkitCompassHeading;
          } else if (e.alpha !== null && typeof e.alpha !== 'undefined') {
            h = (360 - e.alpha) % 360;
          }
          if (h !== null && !isNaN(h)) {
            const now = Date.now();
            if (now - lastHeadingTime < minIntervalMs && Math.abs(h - lastHeadingValue) < minAngleDelta) {
              return;
            }
            lastHeadingTime = now;
            lastHeadingValue = h;
            callback(h);
          }
        };
        window.addEventListener('deviceorientation', this.webOrientationHandler, true);
        return true;
      }
      return false;
    }
  }

  static stopLocationTracking() {
    if (this.posSubscription) {
      this.posSubscription.remove();
      this.posSubscription = null;
    }
  }

  static stopHeadingTracking() {
    if (this.headingSubscription) {
      this.headingSubscription.remove();
      this.headingSubscription = null;
    }
    if (this.webOrientationHandler && Platform.OS === 'web' && typeof window !== 'undefined') {
      window.removeEventListener('deviceorientation', this.webOrientationHandler, true);
      this.webOrientationHandler = null;
    }
  }

  static stopAll() {
    this.stopLocationTracking();
    this.stopHeadingTracking();
  }
}
