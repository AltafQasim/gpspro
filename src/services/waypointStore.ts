export interface WaypointItem {
  id: string;
  name: string;
  latDeg: string;
  latMin: string;
  latDir: 'N' | 'S';
  lonDeg: string;
  lonMin: string;
  lonDir: 'E' | 'W';
  icon: string;
  distance: string;
  bearing: string;
  createdAt: string;
}

export const INITIAL_WAYPOINTS: WaypointItem[] = [
  {
    id: 'wp-1',
    name: 'jati nvabdar',
    latDeg: '20',
    latMin: '44.861',
    latDir: 'N',
    lonDeg: '71',
    lonMin: '05.333',
    lonDir: 'E',
    icon: '📍',
    distance: '1.15 Mi',
    bearing: '73°',
    createdAt: '2026-09-20',
  },
  {
    id: 'wp-2',
    name: '7ka cheo ram madir sama',
    latDeg: '20',
    latMin: '43.945',
    latDir: 'N',
    lonDeg: '71',
    lonMin: '04.794',
    lonDir: 'E',
    icon: '📍',
    distance: '0.89 Mi',
    bearing: '144°',
    createdAt: '2026-09-21',
  },
  {
    id: 'wp-3',
    name: '19GHARI JAM BA CHARO MORA',
    latDeg: '20',
    latMin: '43.607',
    latDir: 'N',
    lonDeg: '71',
    lonMin: '02.611',
    lonDir: 'E',
    icon: '📍',
    distance: '2.14 Mi',
    bearing: '238°',
    createdAt: '2026-09-22',
  },
  {
    id: 'wp-4',
    name: '24amin choika',
    latDeg: '20',
    latMin: '43.793',
    latDir: 'N',
    lonDeg: '71',
    lonMin: '05.855',
    lonDir: 'E',
    icon: '📍',
    distance: '1.89 Mi',
    bearing: '118°',
    createdAt: '2026-09-22',
  },
  {
    id: 'wp-5',
    name: '25amin',
    latDeg: '20',
    latMin: '43.806',
    latDir: 'N',
    lonDeg: '71',
    lonMin: '05.755',
    lonDir: 'E',
    icon: '📍',
    distance: '1.79 Mi',
    bearing: '119°',
    createdAt: '2026-09-23',
  },
  {
    id: 'wp-6',
    name: '26amin ka par ba chero',
    latDeg: '20',
    latMin: '43.777',
    latDir: 'N',
    lonDeg: '71',
    lonMin: '05.791',
    lonDir: 'E',
    icon: '📍',
    distance: '1.84 Mi',
    bearing: '119°',
    createdAt: '2026-09-23',
  },
  {
    id: 'wp-7',
    name: '27amin ka ka chero',
    latDeg: '20',
    latMin: '43.813',
    latDir: 'N',
    lonDeg: '71',
    lonMin: '05.766',
    lonDir: 'E',
    icon: '📍',
    distance: '1.79 Mi',
    bearing: '119°',
    createdAt: '2026-09-24',
  },
  {
    id: 'wp-8',
    name: '28ka par ka chero amin',
    latDeg: '20',
    latMin: '43.956',
    latDir: 'N',
    lonDeg: '71',
    lonMin: '05.675',
    lonDir: 'E',
    icon: '📍',
    distance: '1.63 Mi',
    bearing: '115°',
    createdAt: '2026-09-24',
  },
  {
    id: 'wp-9',
    name: '29ka par ba chero amin sama',
    latDeg: '20',
    latMin: '43.942',
    latDir: 'N',
    lonDeg: '71',
    lonMin: '05.685',
    lonDir: 'E',
    icon: '📍',
    distance: '1.65 Mi',
    bearing: '116°',
    createdAt: '2026-09-25',
  },
  {
    id: 'wp-10',
    name: '30aminsama ba par ka chero',
    latDeg: '20',
    latMin: '43.799',
    latDir: 'N',
    lonDeg: '71',
    lonMin: '05.791',
    lonDir: 'E',
    icon: '📍',
    distance: '1.82 Mi',
    bearing: '119°',
    createdAt: '2026-09-25',
  },
];

// Reactive Waypoint & Target Navigation Store
let currentWaypoints: WaypointItem[] = [...INITIAL_WAYPOINTS];
const waypointListeners = new Set<(list: WaypointItem[]) => void>();

export function getWaypoints(): WaypointItem[] {
  return currentWaypoints;
}

export function setGlobalWaypoints(list: WaypointItem[]) {
  currentWaypoints = list;
  waypointListeners.forEach((fn) => fn(currentWaypoints));
}

export function subscribeWaypoints(fn: (list: WaypointItem[]) => void): () => void {
  waypointListeners.add(fn);
  return () => {
    waypointListeners.delete(fn);
  };
}

let activeTargetWaypoint: WaypointItem | null = INITIAL_WAYPOINTS[0];
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

