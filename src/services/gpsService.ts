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

export class GpsService {
  private static posSubscription: Location.LocationSubscription | null = null;
  private static headingSubscription: Location.LocationSubscription | null = null;
  private static webOrientationHandler: any = null;

  // Request Foreground Location Permissions
  static async requestPermissions(): Promise<Location.PermissionStatus> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status;
    } catch (err) {
      console.warn('GpsService permission error:', err);
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

  // Start Live GPS Location Tracking
  static async startLocationTracking(callback: LocationCallback): Promise<boolean> {
    this.stopLocationTracking();

    try {
      this.posSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1200,
          distanceInterval: 1,
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

          callback({
            latitude: lat,
            longitude: lon,
            speedKnots,
            altitude,
            accuracy,
            latFormatted: formatNauticalLat(lat),
            lonFormatted: formatNauticalLon(lon),
          });
        }
      );
      return true;
    } catch (err) {
      console.warn('GpsService startLocationTracking error:', err);

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
            const accuracy = pos.coords.accuracy !== null ? Math.round(pos.coords.accuracy) : undefined;
            callback({
              latitude: lat,
              longitude: lon,
              speedKnots,
              altitude,
              accuracy,
              latFormatted: formatNauticalLat(lat),
              lonFormatted: formatNauticalLon(lon),
            });
          },
          undefined,
          { enableHighAccuracy: true }
        );
        this.posSubscription = {
          remove: () => navigator.geolocation.clearWatch(watchId),
        } as any;
        return true;
      }
      return false;
    }
  }

  // Start Live Mobile Sensor Compass Heading Tracking
  static async startHeadingTracking(callback: HeadingCallback): Promise<boolean> {
    this.stopHeadingTracking();

    try {
      this.headingSubscription = await Location.watchHeadingAsync((headingData) => {
        // Prefer trueHeading, fallback to magHeading
        const rawH =
          headingData.trueHeading >= 0 ? headingData.trueHeading : headingData.magHeading;
        if (typeof rawH === 'number' && !isNaN(rawH)) {
          callback(rawH);
        }
      });
      return true;
    } catch (err) {
      console.warn('GpsService startHeadingTracking fallback:', err);

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
