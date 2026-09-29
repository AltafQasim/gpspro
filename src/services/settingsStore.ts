import { VoiceService } from './voiceService';

export type AppTheme = 'system' | 'light' | 'dark';
export type UnitSystem = 'nm' | 'mile' | 'km';
export type SpeechLanguage = 'English' | 'Gujarati' | 'Hindi';
export type PositionFormat = 'DMF' | 'DMS' | 'DD';
export type PositionDatum = 'WGS84' | 'Indian 1975';

export interface VesselProfile {
  name: string;
  callsign: string;
  homePort: string;
  registrationNo: string;
}

export interface AppSettings {
  theme: AppTheme;
  unitSystem: UnitSystem;
  ttsLang: SpeechLanguage;
  voiceAnnounce: boolean;
  posFormat: PositionFormat;
  posDatum: PositionDatum;
  keepScreenOn: boolean;
  profile: VesselProfile;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  unitSystem: 'mile',
  ttsLang: 'English',
  voiceAnnounce: true,
  posFormat: 'DMF',
  posDatum: 'WGS84',
  keepScreenOn: true,
  profile: {
    name: 'Sagar Kripa #4',
    callsign: 'IND-GUJ-9921',
    homePort: 'Diu / Veraval',
    registrationNo: 'GJ-11-MM-4492',
  },
};

// Global in-memory reactive store
let currentSettings: AppSettings = { ...DEFAULT_SETTINGS };
const settingsListeners = new Set<(settings: AppSettings) => void>();

// Synchronize VoiceService on initialization
try {
  VoiceService.setLanguage(currentSettings.ttsLang);
  VoiceService.setEnabled(currentSettings.voiceAnnounce);
} catch {
  // Graceful
}

// Local storage key for web persistence
const SETTINGS_STORAGE_KEY = 'gps_fishing_pro_settings_v1';

// Initialize from storage if available
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    const saved = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      currentSettings = { ...DEFAULT_SETTINGS, ...parsed };
      // Sync voice service immediately
      if (currentSettings.ttsLang) {
        VoiceService.setLanguage(currentSettings.ttsLang);
      }
      if (typeof currentSettings.voiceAnnounce === 'boolean') {
        VoiceService.setEnabled(currentSettings.voiceAnnounce);
      }
    }
  } catch {
    // Silently fall back to default settings
  }
}

export class SettingsStore {
  static getSettings(): AppSettings {
    return currentSettings;
  }

  static getTheme(): AppTheme {
    return currentSettings.theme;
  }

  static isNightMode(): boolean {
    if (currentSettings.theme === 'dark') return true;
    if (currentSettings.theme === 'light') return false;
    // System theme: check hour for marine twilight (after 7 PM or before 6 AM)
    const hour = new Date().getHours();
    return hour >= 19 || hour < 6;
  }

  static updateSettings(partial: Partial<AppSettings>) {
    currentSettings = {
      ...currentSettings,
      ...partial,
    };

    // Synchronize VoiceService immediately
    if (partial.ttsLang) {
      VoiceService.setLanguage(partial.ttsLang);
    }
    if (typeof partial.voiceAnnounce === 'boolean') {
      VoiceService.setEnabled(partial.voiceAnnounce);
    }

    // Persist to web storage if available
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(currentSettings));
      } catch {
        // Silently ignore storage errors
      }
    }

    // Notify all active listeners across all screens
    settingsListeners.forEach((fn) => {
      try {
        fn(currentSettings);
      } catch {
        // Silently suppress listener errors
      }
    });
  }

  static subscribe(fn: (settings: AppSettings) => void): () => void {
    settingsListeners.add(fn);
    return () => {
      settingsListeners.delete(fn);
    };
  }

  static resetToDefaults() {
    this.updateSettings(DEFAULT_SETTINGS);
  }

  /**
   * Helper to format a distance according to the currently active unitSystem
   * Base distance is in Nautical Miles (standard for GPS calculations)
   */
  static formatDistance(distanceInNauticalMiles: number): string {
    const unit = currentSettings.unitSystem;
    if (unit === 'nm') {
      return `${distanceInNauticalMiles.toFixed(2)} NM`;
    } else if (unit === 'km') {
      const km = distanceInNauticalMiles * 1.852;
      return `${km.toFixed(2)} km`;
    } else {
      // Statute Miles ('mile')
      const mi = distanceInNauticalMiles * 1.15078;
      return `${mi.toFixed(2)} Mi`;
    }
  }

  /**
   * Helper to parse and convert existing distance strings (e.g. "1.82 Mi", "2.14 NM")
   * into the currently selected unit system.
   */
  static convertDistanceString(distStr: string): string {
    if (!distStr || distStr === '--') return distStr;
    const match = distStr.match(/^([\d.]+)\s*(Mi|NM|nm|km|mi)?$/i);
    if (!match) return distStr;

    const num = parseFloat(match[1]);
    const rawUnit = (match[2] || 'mi').toLowerCase();

    // Convert to Nautical Miles base
    let baseNm = num;
    if (rawUnit === 'mi' || rawUnit === 'mile') {
      baseNm = num / 1.15078;
    } else if (rawUnit === 'km') {
      baseNm = num / 1.852;
    }

    return this.formatDistance(baseNm);
  }

  /**
   * Helper to format GPS latitude and longitude based on the active posFormat setting
   * Formats:
   * - DMF (Degrees & Decimal Minutes): N 20° 44.572'
   * - DMS (Degrees, Minutes & Seconds): N 20° 44' 34.3"
   * - DD (Decimal Degrees): 20.74287° N
   */
  static formatCoordinates(
    lat: number,
    lon: number
  ): { latFormatted: string; lonFormatted: string } {
    const format = currentSettings.posFormat;
    const latDir = lat >= 0 ? 'N' : 'S';
    const lonDir = lon >= 0 ? 'E' : 'W';
    const absLat = Math.abs(lat);
    const absLon = Math.abs(lon);

    if (format === 'DD') {
      return {
        latFormatted: `${absLat.toFixed(5)}° ${latDir}`,
        lonFormatted: `${absLon.toFixed(5)}° ${lonDir}`,
      };
    }

    if (format === 'DMS') {
      const latDeg = Math.floor(absLat);
      const latMinRem = (absLat - latDeg) * 60;
      const latMin = Math.floor(latMinRem);
      const latSec = ((latMinRem - latMin) * 60).toFixed(1);

      const lonDeg = Math.floor(absLon);
      const lonMinRem = (absLon - lonDeg) * 60;
      const lonMin = Math.floor(lonMinRem);
      const lonSec = ((lonMinRem - lonMin) * 60).toFixed(1);

      return {
        latFormatted: `${latDir} ${latDeg}° ${latMin}' ${latSec}"`,
        lonFormatted: `${lonDir} ${lonDeg}° ${lonMin}' ${lonSec}"`,
      };
    }

    // Default: DMF (DD° MM.MMM')
    const latDeg = Math.floor(absLat);
    const latMin = ((absLat - latDeg) * 60).toFixed(3);

    const lonDeg = Math.floor(absLon);
    const lonMin = ((absLon - lonDeg) * 60).toFixed(3);

    return {
      latFormatted: `${latDir} ${latDeg}° ${latMin}'`,
      lonFormatted: `${lonDir} ${lonDeg}° ${lonMin}'`,
    };
  }
}
