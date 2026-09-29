// Marine Waypoint Store - Normalized & Database-Ready Schema
// Fully persistent to LocalStorage with Cloud Database (Firestore / PostgreSQL) synchronization support

import { AuthStore } from './authStore';

export interface WaypointItem {
  id: string;
  userId: string; // Captain ID / Phone
  name: string;

  // Normalized GIS Coordinates (Standard Decimal Degrees for spatial queries & map rendering)
  latitude: number;
  longitude: number;

  // Nautical DDM (Degree & Decimal Minutes) Components
  latDeg: string;
  latMin: string;
  latDir: 'N' | 'S';
  lonDeg: string;
  lonMin: string;
  lonDir: 'E' | 'W';

  // Marine Metadata
  icon: string;
  distance: string;
  bearing: string;
  depthMeters?: number;
  notes?: string;

  // Database Synchronization & Audit Timestamps
  createdAt: string; // ISO 8601 UTC
  updatedAt: string; // ISO 8601 UTC
  syncStatus: 'local' | 'synced' | 'pending';
  isDeleted?: boolean;
}

// Convert DDM to Standard Decimal Degrees
export function dmmToDecimal(deg: number | string, min: number | string, dir: 'N' | 'S' | 'E' | 'W'): number {
  const d = Math.abs(parseFloat(String(deg)) || 0);
  const m = Math.abs(parseFloat(String(min)) || 0);
  let dec = d + m / 60;
  if (dir === 'S' || dir === 'W') {
    dec = -dec;
  }
  return Number(dec.toFixed(7));
}

// Convert Decimal Degrees to DDM
export function decimalToDmm(dec: number, isLatitude: boolean): { deg: string; min: string; dir: 'N' | 'S' | 'E' | 'W' } {
  const abs = Math.abs(dec);
  const deg = Math.floor(abs).toString();
  const min = ((abs - Math.floor(abs)) * 60).toFixed(3);
  let dir: 'N' | 'S' | 'E' | 'W';
  if (isLatitude) {
    dir = dec >= 0 ? 'N' : 'S';
  } else {
    dir = dec >= 0 ? 'E' : 'W';
  }
  return { deg, min, dir };
}

export const INITIAL_WAYPOINTS: WaypointItem[] = [
  {
    id: 'wp-1',
    userId: 'default_captain',
    name: 'jati nvabdar',
    latitude: 20.7476833,
    longitude: 71.0888833,
    latDeg: '20',
    latMin: '44.861',
    latDir: 'N',
    lonDeg: '71',
    lonMin: '05.333',
    lonDir: 'E',
    icon: '📍',
    distance: '1.15 Mi',
    bearing: '73°',
    createdAt: '2026-09-20T00:00:00.000Z',
    updatedAt: '2026-09-20T00:00:00.000Z',
    syncStatus: 'local',
  },
  {
    id: 'wp-2',
    userId: 'default_captain',
    name: '7ka cheo ram madir sama',
    latitude: 20.7324167,
    longitude: 71.0799000,
    latDeg: '20',
    latMin: '43.945',
    latDir: 'N',
    lonDeg: '71',
    lonMin: '04.794',
    lonDir: 'E',
    icon: '📍',
    distance: '0.89 Mi',
    bearing: '144°',
    createdAt: '2026-09-21T00:00:00.000Z',
    updatedAt: '2026-09-21T00:00:00.000Z',
    syncStatus: 'local',
  },
  {
    id: 'wp-3',
    userId: 'default_captain',
    name: '19GHARI JAM BA CHARO MORA',
    latitude: 20.7267833,
    longitude: 71.0435167,
    latDeg: '20',
    latMin: '43.607',
    latDir: 'N',
    lonDeg: '71',
    lonMin: '02.611',
    lonDir: 'E',
    icon: '📍',
    distance: '2.14 Mi',
    bearing: '238°',
    createdAt: '2026-09-22T00:00:00.000Z',
    updatedAt: '2026-09-22T00:00:00.000Z',
    syncStatus: 'local',
  },
  {
    id: 'wp-4',
    userId: 'default_captain',
    name: '24amin choika',
    latitude: 20.7298833,
    longitude: 71.0975833,
    latDeg: '20',
    latMin: '43.793',
    latDir: 'N',
    lonDeg: '71',
    lonMin: '05.855',
    lonDir: 'E',
    icon: '📍',
    distance: '1.89 Mi',
    bearing: '118°',
    createdAt: '2026-09-22T00:00:00.000Z',
    updatedAt: '2026-09-22T00:00:00.000Z',
    syncStatus: 'local',
  },
  {
    id: 'wp-5',
    userId: 'default_captain',
    name: '25amin',
    latitude: 20.7301000,
    longitude: 71.0959167,
    latDeg: '20',
    latMin: '43.806',
    latDir: 'N',
    lonDeg: '71',
    lonMin: '05.755',
    lonDir: 'E',
    icon: '📍',
    distance: '1.79 Mi',
    bearing: '119°',
    createdAt: '2026-09-23T00:00:00.000Z',
    updatedAt: '2026-09-23T00:00:00.000Z',
    syncStatus: 'local',
  },
  {
    id: 'wp-6',
    userId: 'default_captain',
    name: '26amin ka par ba chero',
    latitude: 20.7296167,
    longitude: 71.0965167,
    latDeg: '20',
    latMin: '43.777',
    latDir: 'N',
    lonDeg: '71',
    lonMin: '05.791',
    lonDir: 'E',
    icon: '📍',
    distance: '1.84 Mi',
    bearing: '119°',
    createdAt: '2026-09-23T00:00:00.000Z',
    updatedAt: '2026-09-23T00:00:00.000Z',
    syncStatus: 'local',
  },
  {
    id: 'wp-7',
    userId: 'default_captain',
    name: '27amin ka ka chero',
    latitude: 20.7302167,
    longitude: 71.0961000,
    latDeg: '20',
    latMin: '43.813',
    latDir: 'N',
    lonDeg: '71',
    lonMin: '05.766',
    lonDir: 'E',
    icon: '📍',
    distance: '1.79 Mi',
    bearing: '119°',
    createdAt: '2026-09-24T00:00:00.000Z',
    updatedAt: '2026-09-24T00:00:00.000Z',
    syncStatus: 'local',
  },
  {
    id: 'wp-8',
    userId: 'default_captain',
    name: '28ka par ka chero amin',
    latitude: 20.7326000,
    longitude: 71.0945833,
    latDeg: '20',
    latMin: '43.956',
    latDir: 'N',
    lonDeg: '71',
    lonMin: '05.675',
    lonDir: 'E',
    icon: '📍',
    distance: '1.63 Mi',
    bearing: '115°',
    createdAt: '2026-09-24T00:00:00.000Z',
    updatedAt: '2026-09-24T00:00:00.000Z',
    syncStatus: 'local',
  },
  {
    id: 'wp-9',
    userId: 'default_captain',
    name: '29ka par ba chero amin sama',
    latitude: 20.7323667,
    longitude: 71.0947500,
    latDeg: '20',
    latMin: '43.942',
    latDir: 'N',
    lonDeg: '71',
    lonMin: '05.685',
    lonDir: 'E',
    icon: '📍',
    distance: '1.65 Mi',
    bearing: '116°',
    createdAt: '2026-09-25T00:00:00.000Z',
    updatedAt: '2026-09-25T00:00:00.000Z',
    syncStatus: 'local',
  },
  {
    id: 'wp-10',
    userId: 'default_captain',
    name: '30aminsama ba par ka chero',
    latitude: 20.7299833,
    longitude: 71.0965167,
    latDeg: '20',
    latMin: '43.799',
    latDir: 'N',
    lonDeg: '71',
    lonMin: '05.791',
    lonDir: 'E',
    icon: '📍',
    distance: '1.82 Mi',
    bearing: '119°',
    createdAt: '2026-09-25T00:00:00.000Z',
    updatedAt: '2026-09-25T00:00:00.000Z',
    syncStatus: 'local',
  },
];

const WAYPOINTS_STORAGE_KEY = 'gps_fishing_pro_waypoints_v2';

let currentWaypoints: WaypointItem[] = [...INITIAL_WAYPOINTS];
const waypointListeners = new Set<(list: WaypointItem[]) => void>();

// Load from LocalStorage if available
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    const saved = window.localStorage.getItem(WAYPOINTS_STORAGE_KEY);
    if (saved) {
      const parsed: WaypointItem[] = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure every item has normalized lat/lon and timestamps
        currentWaypoints = parsed.map((wp) => {
          const lat = wp.latitude ?? dmmToDecimal(wp.latDeg, wp.latMin, wp.latDir);
          const lon = wp.longitude ?? dmmToDecimal(wp.lonDeg, wp.lonMin, wp.lonDir);
          return {
            ...wp,
            latitude: lat,
            longitude: lon,
            userId: wp.userId || 'default_captain',
            createdAt: wp.createdAt || new Date().toISOString(),
            updatedAt: wp.updatedAt || new Date().toISOString(),
            syncStatus: wp.syncStatus || 'local',
          };
        });
      }
    }
  } catch {
    // Silently fall back to default waypoints
  }
}

function persistWaypoints() {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(WAYPOINTS_STORAGE_KEY, JSON.stringify(currentWaypoints));
    } catch {
      // Silently ignore storage quota or serialization error
    }
  }
}

export function getWaypoints(): WaypointItem[] {
  return currentWaypoints;
}

export function setGlobalWaypoints(list: WaypointItem[]) {
  // Normalize items before saving
  currentWaypoints = list.map((wp) => {
    const lat = wp.latitude ?? dmmToDecimal(wp.latDeg, wp.latMin, wp.latDir);
    const lon = wp.longitude ?? dmmToDecimal(wp.lonDeg, wp.lonMin, wp.lonDir);
    return {
      ...wp,
      latitude: lat,
      longitude: lon,
      userId: wp.userId || AuthStore.getPhone() || 'default_captain',
      updatedAt: new Date().toISOString(),
      syncStatus: wp.syncStatus || 'local',
    };
  });
  persistWaypoints();
  waypointListeners.forEach((fn) => fn(currentWaypoints));
}

export function addWaypoint(
  wp: Omit<WaypointItem, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'userId' | 'latitude' | 'longitude'> & {
    latitude?: number;
    longitude?: number;
  }
): WaypointItem {
  const now = new Date().toISOString();
  const lat = wp.latitude ?? dmmToDecimal(wp.latDeg, wp.latMin, wp.latDir);
  const lon = wp.longitude ?? dmmToDecimal(wp.lonDeg, wp.lonMin, wp.lonDir);

  const item: WaypointItem = {
    ...wp,
    id: `wp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId: AuthStore.getPhone() || 'default_captain',
    latitude: lat,
    longitude: lon,
    createdAt: now,
    updatedAt: now,
    syncStatus: 'local',
  };

  currentWaypoints = [item, ...currentWaypoints];
  persistWaypoints();
  waypointListeners.forEach((fn) => fn(currentWaypoints));
  return item;
}

export function updateWaypoint(id: string, partial: Partial<WaypointItem>): boolean {
  let found = false;
  currentWaypoints = currentWaypoints.map((wp) => {
    if (wp.id === id) {
      found = true;
      const updated = {
        ...wp,
        ...partial,
        updatedAt: new Date().toISOString(),
        syncStatus: 'pending' as const,
      };
      if (partial.latDeg || partial.latMin || partial.latDir) {
        updated.latitude = dmmToDecimal(updated.latDeg, updated.latMin, updated.latDir);
      }
      if (partial.lonDeg || partial.lonMin || partial.lonDir) {
        updated.longitude = dmmToDecimal(updated.lonDeg, updated.lonMin, updated.lonDir);
      }
      return updated;
    }
    return wp;
  });

  if (found) {
    persistWaypoints();
    waypointListeners.forEach((fn) => fn(currentWaypoints));
  }
  return found;
}

export function deleteWaypoint(id: string): boolean {
  const initialLen = currentWaypoints.length;
  currentWaypoints = currentWaypoints.filter((wp) => wp.id !== id);
  if (currentWaypoints.length !== initialLen) {
    persistWaypoints();
    waypointListeners.forEach((fn) => fn(currentWaypoints));
    if (activeTargetWaypoint?.id === id) {
      setActiveTarget(null);
    }
    return true;
  }
  return false;
}

export function subscribeWaypoints(fn: (list: WaypointItem[]) => void): () => void {
  waypointListeners.add(fn);
  return () => {
    waypointListeners.delete(fn);
  };
}

let activeTargetWaypoint: WaypointItem | null = currentWaypoints[0] || null;
const targetListeners = new Set<(target: WaypointItem | null) => void>();

export function getActiveTarget(): WaypointItem | null {
  return activeTargetWaypoint;
}

export function setActiveTarget(wp: WaypointItem | null) {
  activeTargetWaypoint = wp;
  targetListeners.forEach((fn) => fn(wp));
}

export function subscribeActiveTarget(fn: (target: WaypointItem | null) => void): () => void {
  targetListeners.add(fn);
  return () => {
    targetListeners.delete(fn);
  };
}

// Cloud Database Ready Export Payload
export function exportWaypointsForCloudSync(): WaypointItem[] {
  return currentWaypoints.map((wp) => ({
    ...wp,
    userId: AuthStore.getPhone() || wp.userId,
    updatedAt: new Date().toISOString(),
  }));
}
