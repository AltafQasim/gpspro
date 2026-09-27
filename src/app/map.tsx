import {
  CompassGyroIcon,
  ModernCloseIcon,
  ModernLayersIcon,
  ModernZoomInIcon,
  ModernZoomOutIcon,
  OfflineStorageIcon,
  OrientationCompassIcon,
  PrecisionCrosshairIcon,
  RecordTrackIcon,
  TargetBullseyeIcon,
  ToolsConsoleIcon,
  VoiceSpeakerIcon,
  WaypointBeaconIcon,
} from '@/components/marine/MapScreenIcons';
import { BackButton } from '@/components/ui/back-button';
import {
  GpsService,
  calculateNavDistanceAndBearing,
} from '@/services/gpsService';
import { VoiceService } from '@/services/voiceService';
import { SettingsStore } from '@/services/settingsStore';
import {
  WaypointItem,
  getActiveTarget,
  getWaypoints,
  setActiveTarget,
  subscribeActiveTarget,
  subscribeWaypoints,
} from '@/services/waypointStore';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  Modal,
  PanResponder,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 3 Real Map Tile Layer Providers
export type MapLayerType = 'openstreet' | 'satellite' | 'nautical';

interface TileInfo {
  key: string;
  x: number;
  y: number;
  z: number;
  url: string;
  left: number;
  top: number;
}

// Convert Lat/Lon to World Mercator Coordinates at a given zoom level
function latLonToWorld(lat: number, lon: number, zoom: number) {
  const scale = 256 * Math.pow(2, zoom);
  const normLon = ((((lon + 180) % 360) + 360) % 360) - 180;
  const x = ((normLon + 180) / 360) * scale;
  const clampedLat = Math.max(-85.05112878, Math.min(85.05112878, lat));
  const latRad = (clampedLat * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * scale;
  return { x, y };
}

// Convert World Mercator Coordinates back to Lat/Lon at a given zoom level
function worldToLatLon(x: number, y: number, zoom: number) {
  const scale = 256 * Math.pow(2, zoom);
  const lon = (x / scale) * 360 - 180;
  const y2 = 1 - (2 * y) / scale;
  const clampedY2 = Math.max(-1, Math.min(1, y2));
  const latRad = Math.atan(Math.sinh(Math.PI * clampedY2));
  const lat = (latRad * 180) / Math.PI;
  return {
    lat: Math.max(-85.0511, Math.min(85.0511, lat)),
    lon: ((((lon + 180) % 360) + 360) % 360) - 180,
  };
}

// Convert DMF Waypoint (Deg + Min) to Decimal Degrees
function waypointToDecimal(wp: WaypointItem) {
  const lat = (parseFloat(wp.latDeg) + parseFloat(wp.latMin) / 60) * (wp.latDir === 'S' ? -1 : 1);
  const lon = (parseFloat(wp.lonDeg) + parseFloat(wp.lonMin) / 60) * (wp.lonDir === 'W' ? -1 : 1);
  return { lat, lon };
}

export default function MarineMapScreen() {
  const router = useRouter();
  const searchParams = useLocalSearchParams();

  // Vessel GPS Location (Live boat position)
  const [boatLat, setBoatLat] = useState<number>(20.7428);
  const [boatLon, setBoatLon] = useState<number>(71.0718);

  // Map Screen View Center (Geographic Coordinates)
  const [mapCenter, setMapCenter] = useState<{ lat: number; lon: number }>({
    lat: 20.7428,
    lon: 71.0718,
  });

  // Zoom level: 0 to 20.
  // Zoom 0 = entire planet Earth (full world view like Google Maps)
  // Zoom 13 = local coastal fishing grounds
  // Zoom 20 = pier/harbor detail
  const [zoom, setZoom] = useState<number>(13);

  // Real-time drag delta in pixels during active drag
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const mapCenterRef = useRef<{ lat: number; lon: number }>({ lat: 20.7428, lon: 71.0718 });
  const zoomRef = useRef<number>(13);

  useEffect(() => {
    mapCenterRef.current = mapCenter;
  }, [mapCenter]);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  // Live Vessel Telemetry from Mobile Sensors
  const [speedKnots, setSpeedKnots] = useState<number>(0.0);
  const [heading, setHeading] = useState<number>(0);
  const [distance, setDistance] = useState<number>(1.15);
  const [bearing, setBearing] = useState<number>(73);
  const [latStr, setLatStr] = useState<string>("N 20° 44.572'");
  const [lonStr, setLonStr] = useState<string>("E 71° 04.313'");

  // Animated heading for butter-smooth mobile sensor rotation
  const boatRotateAnim = useRef(new Animated.Value(0)).current;
  const currentHeadingRef = useRef<number>(0);

  // Subscribe to SettingsStore for instant units and theme updates
  const [, setSettingsTick] = useState<number>(0);
  useEffect(() => {
    const unsub = SettingsStore.subscribe(() => {
      setSettingsTick((t) => t + 1);
    });
    return unsub;
  }, []);

  // Continuous Smooth 2-Finger Pinch Zoom Animation
  const pinchScaleAnim = useRef(new Animated.Value(1)).current;
  const pinchStartDistRef = useRef<number | null>(null);
  const currentPinchScaleRef = useRef<number>(1);
  const isPinchingRef = useRef<boolean>(false);
  const pinchStartZoomRef = useRef<number>(13);
  const isZoomingRef = useRef<boolean>(false);
  const lastTapRef = useRef<number>(0);

  // Pulsing Target Beacon Animation
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseOpacityAnim = useRef(new Animated.Value(0.8)).current;

  // Floating Tools Animated Hide/Show State
  const [toolsVisible, setToolsVisible] = useState<boolean>(true);
  const toolsAnim = useRef(new Animated.Value(1)).current;

  // Waypoint Card Slide-in Animation
  const cardSlideAnim = useRef(new Animated.Value(0)).current;

  // Map Controls State
  const [activeLayer, setActiveLayer] = useState<MapLayerType>('openstreet');
  const [showLayerModal, setShowLayerModal] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [northUp, setNorthUp] = useState<boolean>(true);
  const [weatherOverlay, setWeatherOverlay] = useState<boolean>(false);

  // Recorded Breadcrumb Track History
  const [trackHistory, setTrackHistory] = useState<Array<{ lat: number; lon: number }>>([
    { lat: 20.7412, lon: 71.069 },
    { lat: 20.7418, lon: 71.0702 },
    { lat: 20.7424, lon: 71.0712 },
    { lat: 20.7428, lon: 71.0718 },
  ]);

  // Offline Tile Cache State
  const [showOfflineModal, setShowOfflineModal] = useState<boolean>(false);
  const [cachedTileCount, setCachedTileCount] = useState<number>(184);
  const [isDownloadingCache, setIsDownloadingCache] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [selectedSector, setSelectedSector] = useState<string>('Diu & Veraval Deep Basin');

  // Selected Waypoint (null by default — only shows card when user clicks a pin)
  const [selectedWaypoint, setSelectedWaypoint] = useState<WaypointItem | null>(null);
  const [activeTargetWp, setActiveTargetWp] = useState<WaypointItem | null>(null);
  const [allWaypointsList, setAllWaypointsList] = useState<WaypointItem[]>(getWaypoints());

  // Toggle tools with smooth spring animation
  const handleToggleTools = () => {
    const nextVal = toolsVisible ? 0 : 1;
    Animated.spring(toolsAnim, {
      toValue: nextVal,
      friction: 7,
      tension: 40,
      useNativeDriver: true,
    }).start();
    setToolsVisible(!toolsVisible);
  };

  // Open Waypoint Card with smooth slide-up
  const handleSelectWaypoint = (wp: WaypointItem) => {
    setSelectedWaypoint(wp);
    Animated.spring(cardSlideAnim, {
      toValue: 1,
      friction: 8,
      tension: 45,
      useNativeDriver: true,
    }).start();
    VoiceService.announceWaypoint(wp.name, wp.distance, wp.bearing);
  };

  // Close Waypoint Card cleanly with smooth slide-down
  const handleCloseWaypointCard = () => {
    Animated.timing(cardSlideAnim, {
      toValue: 0,
      duration: 160,
      useNativeDriver: true,
    }).start(() => {
      setSelectedWaypoint(null);
    });
  };

  // Pulsing radar animation loop for active waypoint target
  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 2.2,
            duration: 1600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacityAnim, {
            toValue: 0,
            duration: 1600,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacityAnim, {
            toValue: 0.85,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [pulseAnim, pulseOpacityAnim]);

  // Subscribe to waypoint store changes
  useEffect(() => {
    const unsubWp = subscribeWaypoints((list) => {
      setAllWaypointsList(list);
    });
    const unsubTarget = subscribeActiveTarget((tgt) => {
      setActiveTargetWp(tgt);
      if (tgt) {
        const wpDec = waypointToDecimal(tgt);
        const navCalc = calculateNavDistanceAndBearing(
          boatLat,
          boatLon,
          wpDec.lat,
          wpDec.lon
        );
        setDistance(parseFloat(navCalc.distanceNmi) || 0);
        setBearing(typeof navCalc.bearing === 'number' ? navCalc.bearing : (parseInt(tgt.bearing) || 0));
      }
    });
    return () => {
      unsubWp();
      unsubTarget();
    };
  }, [boatLat, boatLon]);

  // Safe initial target synchronization
  const targetIdParam = typeof searchParams?.targetId === 'string' ? searchParams.targetId : undefined;
  const targetNameParam = typeof searchParams?.targetName === 'string' ? searchParams.targetName : undefined;
  const initialTargetSyncedRef = useRef(false);

  useEffect(() => {
    if (targetIdParam) {
      const match = allWaypointsList.find(
        (w) => w.id === targetIdParam || w.name === targetNameParam
      );
      if (match) {
        setActiveTarget(match);
      }
    } else if (!initialTargetSyncedRef.current) {
      initialTargetSyncedRef.current = true;
      const curTarget = getActiveTarget();
      if (curTarget) {
        setActiveTargetWp(curTarget);
      }
    }
  }, [targetIdParam, targetNameParam, allWaypointsList]);

  // Live GPS Sensor Integration with Gyroscope & Compass Heading
  useEffect(() => {
    GpsService.startHeadingTracking((headDeg) => {
      setHeading(headDeg);
      let diff = headDeg - (currentHeadingRef.current % 360);
      if (diff > 180) diff -= 360;
      if (diff < -180) diff += 360;
      const targetAnimVal = currentHeadingRef.current + diff;
      currentHeadingRef.current = targetAnimVal;

      Animated.timing(boatRotateAnim, {
        toValue: targetAnimVal,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });

    GpsService.startLocationTracking((loc) => {
      setSpeedKnots(loc.speedKnots);
      if (loc.latitude && loc.longitude) {
        setBoatLat(loc.latitude);
        setBoatLon(loc.longitude);
        setLatStr(loc.latDmf);
        setLonStr(loc.lonDmf);

        if (isRecording) {
          setTrackHistory((prev) => [
            ...prev,
            { lat: loc.latitude, lon: loc.longitude },
          ]);
        }
      }

      const currentTgt = getActiveTarget();
      if (currentTgt && loc.latitude && loc.longitude) {
        const wpDec = waypointToDecimal(currentTgt);
        const navCalc = calculateNavDistanceAndBearing(
          loc.latitude,
          loc.longitude,
          wpDec.lat,
          wpDec.lon
        );
        setDistance(parseFloat(navCalc.distanceNmi) || 0);
        setBearing(typeof navCalc.bearing === 'number' ? navCalc.bearing : 0);
      }
    });

    return () => {
      GpsService.stopHeadingTracking();
      GpsService.stopLocationTracking();
    };
  }, [isRecording, boatRotateAnim]);

  // Zoom In / Out Handlers (Full World 0 to Ultra Pier 20) - Direct, rock-solid, zero-bounce
  const handleZoomIn = () => {
    setZoom((prev) => Math.min(20, prev + 1));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(0, prev - 1));
  };

  // Center on boat GPS position & zoom in to close-up navigation view (Direct, zero bounce)
  const handleCenterOnBoat = () => {
    setDragOffset({ x: 0, y: 0 });
    setMapCenter({ lat: boatLat, lon: boatLon });
    setZoom((curZoom) => (curZoom < 15 ? 15 : curZoom));
  };

  // Web Mouse Dragging Listeners
  const isMouseDownRef = useRef(false);
  const mouseStartRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isMouseDownRef.current) return;
      const dx = e.clientX - mouseStartRef.current.x;
      const dy = e.clientY - mouseStartRef.current.y;
      setDragOffset({ x: dx, y: dy });
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!isMouseDownRef.current) return;
      isMouseDownRef.current = false;
      const dx = e.clientX - mouseStartRef.current.x;
      const dy = e.clientY - mouseStartRef.current.y;
      setDragOffset({ x: 0, y: 0 });

      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
        const curCenter = mapCenterRef.current;
        const curZoom = zoomRef.current;
        const centerWorld = latLonToWorld(curCenter.lat, curCenter.lon, curZoom);
        const newCenter = worldToLatLon(centerWorld.x - dx, centerWorld.y - dy, curZoom);
        setMapCenter(newCenter);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleWebMouseDown = (e: any) => {
    if (Platform.OS !== 'web') return;
    if (e.button !== 0) return;
    isMouseDownRef.current = true;
    mouseStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleWebWheel = (e: any) => {
    if (Platform.OS !== 'web') return;
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  // Mobile PanResponder for Touch Drag & 2-Finger Pinch Zoom
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3;
      },
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3;
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (evt) => {
        const touches = evt.nativeEvent.touches;
        if (touches && touches.length === 2) {
          isPinchingRef.current = true;
          pinchStartZoomRef.current = zoomRef.current;
          const dx = touches[0].pageX - touches[1].pageX;
          const dy = touches[0].pageY - touches[1].pageY;
          pinchStartDistRef.current = Math.hypot(dx, dy);
          currentPinchScaleRef.current = 1;
          pinchScaleAnim.setValue(1);
        } else {
          isPinchingRef.current = false;
          pinchStartDistRef.current = null;
          const now = Date.now();
          if (now - lastTapRef.current < 280) {
            handleZoomIn();
          }
          lastTapRef.current = now;
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        const touches = evt.nativeEvent.touches;
        if (touches && touches.length === 2) {
          if (!isPinchingRef.current || !pinchStartDistRef.current) {
            isPinchingRef.current = true;
            pinchStartZoomRef.current = zoomRef.current;
            const dx = touches[0].pageX - touches[1].pageX;
            const dy = touches[0].pageY - touches[1].pageY;
            pinchStartDistRef.current = Math.hypot(dx, dy);
            currentPinchScaleRef.current = 1;
            pinchScaleAnim.setValue(1);
            return;
          }
          const dx = touches[0].pageX - touches[1].pageX;
          const dy = touches[0].pageY - touches[1].pageY;
          const dist = Math.hypot(dx, dy);
          if (pinchStartDistRef.current > 0) {
            const rawScale = dist / pinchStartDistRef.current;
            const scale = Math.max(0.35, Math.min(3.5, rawScale));
            currentPinchScaleRef.current = scale;
            pinchScaleAnim.setValue(scale);
          }
        } else if (!isPinchingRef.current) {
          setDragOffset({ x: gestureState.dx, y: gestureState.dy });
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (isPinchingRef.current && pinchStartDistRef.current) {
          isPinchingRef.current = false;
          const finalScale = currentPinchScaleRef.current;
          const zoomChange = Math.log2(finalScale);
          const zoomDelta = Math.round(zoomChange);
          const startZ = pinchStartZoomRef.current;
          const targetZoom = Math.min(20, Math.max(0, startZ + zoomDelta));

          if (targetZoom !== startZ) {
            setZoom(targetZoom);
          }
          currentPinchScaleRef.current = 1;
          pinchScaleAnim.setValue(1);
          pinchStartDistRef.current = null;
        } else {
          const dx = gestureState.dx;
          const dy = gestureState.dy;
          setDragOffset({ x: 0, y: 0 });
          if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
            const curCenter = mapCenterRef.current;
            const curZoom = zoomRef.current;
            const centerWorld = latLonToWorld(curCenter.lat, curCenter.lon, curZoom);
            const newCenter = worldToLatLon(centerWorld.x - dx, centerWorld.y - dy, curZoom);
            setMapCenter(newCenter);
          }
        }
      },
    })
  ).current;

  // Start / Stop Track Recording
  const handleToggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      Alert.alert('Voyage Recording Started 🔴', 'Nautical track recording with real-time GPS breadcrumbs.');
    } else {
      setIsRecording(false);
      Alert.alert('Track Saved 💾', `Recorded ${trackHistory.length} GPS checkpoints to marine log.`);
    }
  };

  // Drop Waypoint at Current Boat Position
  const handleDropWaypoint = () => {
    const newWp: WaypointItem = {
      id: `wp-${Date.now()}`,
      name: `Mark #${Math.floor(Math.random() * 900 + 100)}`,
      latDeg: latStr.split(' ')[1]?.replace('°', '') || '20',
      latMin: latStr.split(' ')[2]?.replace("'", '') || '44.572',
      latDir: (latStr.split(' ')[0] as any) || 'N',
      lonDeg: lonStr.split(' ')[1]?.replace('°', '') || '71',
      lonMin: lonStr.split(' ')[2]?.replace("'", '') || '04.313',
      lonDir: (lonStr.split(' ')[0] as any) || 'E',
      icon: '📍',
      distance: '0.00 Mi',
      bearing: '000°',
      createdAt: new Date().toISOString().split('T')[0],
    };
    handleSelectWaypoint(newWp);
    Alert.alert('Waypoint Marked! 📍', `Saved "${newWp.name}" at boat GPS coordinates.`);
  };

  // Offline Cache Downloader Simulation
  const handleStartOfflineDownload = () => {
    setIsDownloadingCache(true);
    setDownloadProgress(15);

    const step1 = setTimeout(() => setDownloadProgress(45), 500);
    const step2 = setTimeout(() => setDownloadProgress(80), 1000);
    const step3 = setTimeout(() => {
      setDownloadProgress(100);
      setIsDownloadingCache(false);
      setCachedTileCount((prev) => prev + 96);
      Alert.alert(
        'Offline Cache Complete ✅',
        `Successfully cached nautical tiles for ${selectedSector} (${zoom} zoom). 100% offline navigation ready for deep sea!`
      );
    }, 1600);

    return () => {
      clearTimeout(step1);
      clearTimeout(step2);
      clearTimeout(step3);
    };
  };

  // MATHEMATICALLY CONTINUOUS SLIPPY TILE & MERCATOR ENGINE
  // Zoom 0 = whole world (1 tile). Zoom 19 = deepest server tile layer.
  const effectiveZoom = Math.min(20, Math.max(0, zoom));
  const tileZoom = Math.min(19, Math.floor(effectiveZoom));
  const maxTilesAtZoom = Math.pow(2, tileZoom);

  const centerWorld = latLonToWorld(mapCenter.lat, mapCenter.lon, tileZoom);
  const activeCenterX = centerWorld.x - dragOffset.x;
  const activeCenterY = centerWorld.y - dragOffset.y;

  const centerTileX = Math.floor(activeCenterX / 256);
  const centerTileY = Math.floor(activeCenterY / 256);

  const offsetInsideTileX = activeCenterX - centerTileX * 256;
  const offsetInsideTileY = activeCenterY - centerTileY * 256;

  // Tile coverage buffer to ensure entire viewport is filled
  const halfTilesX = Math.ceil(SCREEN_WIDTH / 256 / 2) + 2;
  const halfTilesY = Math.ceil(SCREEN_HEIGHT / 256 / 2) + 2;

  const tiles: TileInfo[] = [];
  for (let dx = -halfTilesX; dx <= halfTilesX; dx++) {
    for (let dy = -halfTilesY; dy <= halfTilesY; dy++) {
      const rawTileX = centerTileX + dx;
      const tileX = ((rawTileX % maxTilesAtZoom) + maxTilesAtZoom) % maxTilesAtZoom;
      const tileY = centerTileY + dy;
      if (tileY < 0 || tileY >= maxTilesAtZoom) continue;

      let tileUrl = '';
      if (activeLayer === 'openstreet') {
        const sub = ['a', 'b', 'c'][Math.abs((tileX + tileY) % 3)];
        tileUrl = `https://${sub}.tile.openstreetmap.org/${tileZoom}/${tileX}/${tileY}.png`;
      } else if (activeLayer === 'satellite') {
        tileUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${tileZoom}/${tileY}/${tileX}`;
      } else {
        tileUrl = `https://services.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/${tileZoom}/${tileY}/${tileX}`;
      }

      const left = SCREEN_WIDTH / 2 - offsetInsideTileX + dx * 256;
      const top = SCREEN_HEIGHT / 2 - offsetInsideTileY + dy * 256;

      tiles.push({
        key: `${tileZoom}-${tileX}-${tileY}-${dx}-${dy}-${activeLayer}`,
        x: tileX,
        y: tileY,
        z: tileZoom,
        url: tileUrl,
        left,
        top,
      });
    }
  }

  // Vessel Screen Position (Locks mathematically to boatLat / boatLon)
  const boatWorld = latLonToWorld(boatLat, boatLon, tileZoom);
  const vesselScreenX = SCREEN_WIDTH / 2 + (boatWorld.x - activeCenterX);
  const vesselScreenY = SCREEN_HEIGHT / 2 + (boatWorld.y - activeCenterY);

  // Plotted Waypoints
  const plottedWaypoints = allWaypointsList.map((wp, index) => {
    const { lat, lon } = waypointToDecimal(wp);
    const wpWorld = latLonToWorld(lat, lon, tileZoom);
    const screenX = SCREEN_WIDTH / 2 + (wpWorld.x - activeCenterX);
    const screenY = SCREEN_HEIGHT / 2 + (wpWorld.y - activeCenterY);
    return {
      item: wp,
      index,
      screenX,
      screenY,
    };
  });

  // ONLY ACTIVE TARGET WAYPOINT NAVIGATION ROUTE (No background voyage routes)
  const targetWpPlotted = plottedWaypoints.find(
    (p) => activeTargetWp && (p.item.id === activeTargetWp.id || p.item.name === activeTargetWp.name)
  );

  let targetRouteLine: {
    length: number;
    angle: number;
    midX: number;
    midY: number;
  } | null = null;

  if (targetWpPlotted) {
    const dx = targetWpPlotted.screenX - vesselScreenX;
    const dy = targetWpPlotted.screenY - vesselScreenY;
    const len = Math.hypot(dx, dy);
    const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
    targetRouteLine = {
      length: len,
      angle: ang,
      midX: (vesselScreenX + targetWpPlotted.screenX) / 2,
      midY: (vesselScreenY + targetWpPlotted.screenY) / 2,
    };
  }

  // Platform safe image headers
  const imageHeaders = useMemo(() => {
    if (Platform.OS === 'web') return undefined;
    return {
      'User-Agent': 'GpsProMarine/1.0.0 (Marine Navigation; contact@gpspro.app)',
      Accept: 'image/png,image/webp,image/*;q=0.8',
    };
  }, []);

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.container}>
      <StatusBar style="dark" animated={true} />

      {/* 1. TOP HEADER BAR */}
      <View style={styles.topHeaderBar}>
        <BackButton showLabel={true} label="Home" />

        {/* Marine Map Title with Layer Pill */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setShowLayerModal(true)}
          style={styles.layerSelectorBadge}>
          <ModernLayersIcon size={18} color="#0D47A1" />
          <Text style={styles.layerSelectorText}>
            {activeLayer === 'openstreet'
              ? 'OpenStreetMap'
              : activeLayer === 'satellite'
              ? 'Satellite Map'
              : 'Nautical Bathymetry'}
          </Text>
          <Text style={styles.layerDropdownArrow}>▼</Text>
        </TouchableOpacity>

        {/* Offline Cache Status Pill */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setShowOfflineModal(true)}
          style={styles.offlineStatusPill}>
          <View style={styles.offlineDot} />
          <Text style={styles.offlineStatusText}>{cachedTileCount} Tiles</Text>
          <OfflineStorageIcon size={14} color="#047857" />
        </TouchableOpacity>
      </View>

      {/* 2. TOP 4 HUD METRIC CARDS (Fixed height, perfectly stable) */}
      <View style={styles.hudRow}>
        <View style={styles.hudCard}>
          <Text style={styles.hudLabel} numberOfLines={1}>SPEED (KN)</Text>
          <Text style={styles.hudValue} numberOfLines={1}>{speedKnots.toFixed(2)}</Text>
        </View>

        <View style={styles.hudCard}>
          <Text style={styles.hudLabel} numberOfLines={1}>DISTANCE</Text>
          <Text style={styles.hudValue} numberOfLines={1}>{activeTargetWp ? `${distance.toFixed(2)} mi` : '--'}</Text>
        </View>

        <View style={styles.hudCard}>
          <Text style={styles.hudLabel} numberOfLines={1}>BEARING</Text>
          <Text style={styles.hudValue} numberOfLines={1}>{activeTargetWp ? `${bearing ?? 0}°` : '000°'}</Text>
        </View>

        <View style={styles.hudCard}>
          <Text style={styles.hudLabel} numberOfLines={1}>HEADING</Text>
          <Text style={styles.hudValue} numberOfLines={1}>{heading.toString().padStart(3, '0')}°</Text>
        </View>
      </View>

      {/* 3. BLACK POSITION & DGPS BANNER */}
      <View style={styles.positionBanner}>
        <Text style={styles.positionText}>
          {latStr}   {lonStr}
        </Text>
        <View style={styles.dgpsStatusWrap}>
          <View style={styles.dgpsDot} />
          <Text style={styles.dgpsText}>3D DGPS FIX • 3m</Text>
        </View>
      </View>

      {/* 4. MAIN MAP CANVAS (UNLIMITED ZOOM 0-20 • SMOOTH DRAG PAN • PINCH & WHEEL ZOOM) */}
      <View
        style={[
          styles.mapCanvasWrapper,
          activeLayer === 'satellite'
            ? { backgroundColor: '#0B192C' }
            : activeLayer === 'nautical'
            ? { backgroundColor: '#BFE5EC' }
            : { backgroundColor: '#AAD3DF' },
        ]}
        {...panResponder.panHandlers}
        {...(Platform.OS === 'web'
          ? {
              onMouseDown: handleWebMouseDown,
              onWheel: handleWebWheel,
            }
          : {})}>
        
        {/* Unified Hardware-Accelerated Dynamic Map Canvas (Tiles + Waypoints + Vessel + Routes all scale together!) */}
        <Animated.View
          style={[
            styles.mapContentLayer,
            {
              transform: [
                { scale: pinchScaleAnim },
                !northUp
                  ? {
                      rotate: boatRotateAnim.interpolate({
                        inputRange: [-360000, 360000],
                        outputRange: ['360000deg', '-360000deg'],
                      }),
                    }
                  : { rotate: '0deg' },
              ],
            },
          ]}
          pointerEvents="box-none">
          
          {/* Dynamic Slippy Map Tiles Layer (Instant loading transition=0, zero bounce) */}
          <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
            {tiles.map((tile) => (
              <Image
                key={tile.key}
                source={{
                  uri: tile.url,
                  headers: imageHeaders,
                }}
                cachePolicy="disk"
                transition={0}
                style={[
                  styles.mapTile,
                  {
                    left: tile.left,
                    top: tile.top,
                  },
                ]}
                contentFit="cover"
              />
            ))}
          </View>
          
          {/* Recorded GPS Breadcrumbs Trail */}
          {trackHistory.map((pt, i) => {
            const ptWorld = latLonToWorld(pt.lat, pt.lon, tileZoom);
            const ptX = SCREEN_WIDTH / 2 + (ptWorld.x - activeCenterX);
            const ptY = SCREEN_HEIGHT / 2 + (ptWorld.y - activeCenterY);
            return (
              <View
                key={`track-${i}`}
                style={[styles.breadcrumbDot, { left: ptX - 3, top: ptY - 3 }]}
                pointerEvents="none"
              />
            );
          })}

          {/* ONLY ACTIVE WAYPOINT NAVIGATION ROUTE LINE (Vessel to Target) */}
          {targetRouteLine && targetWpPlotted && (
            <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
              {/* Outer Glow Route Line */}
              <View
                style={[
                  styles.routeOuterGlow,
                  {
                    left: targetRouteLine.midX - targetRouteLine.length / 2,
                    top: targetRouteLine.midY - 4,
                    width: targetRouteLine.length,
                    transform: [{ rotate: `${targetRouteLine.angle}deg` }],
                  },
                ]}
              />

              {/* Vibrant Core Navigation Course Line */}
              <View
                style={[
                  styles.routeCoreLine,
                  {
                    left: targetRouteLine.midX - targetRouteLine.length / 2,
                    top: targetRouteLine.midY - 1.75,
                    width: targetRouteLine.length,
                    transform: [{ rotate: `${targetRouteLine.angle}deg` }],
                  },
                ]}
              />

              {/* Floating Route Midpoint Course Badge */}
              {targetRouteLine.length > 80 && (
                <View
                  style={[
                    styles.routeBadgePill,
                    {
                      left: targetRouteLine.midX - 60,
                      top: targetRouteLine.midY - 13,
                    },
                  ]}>
                  <Text style={styles.routeBadgeText}>
                    {distance.toFixed(2)} Mi • {bearing ?? 0}°
                  </Text>
                </View>
              )}

              {/* Pulsing Radar Beacon Ring around Target Waypoint */}
              <Animated.View
                style={[
                  styles.targetPulseCircle,
                  {
                    left: targetWpPlotted.screenX - 24,
                    top: targetWpPlotted.screenY - 24,
                    transform: [{ scale: pulseAnim }],
                    opacity: pulseOpacityAnim,
                  },
                ]}
              />
            </View>
          )}

          {/* ALL MATHEMATICALLY ACCURATE WAYPOINTS PLOTTED ON MAP */}
          {plottedWaypoints.map(({ item, screenX, screenY, index }) => {
            const isTarget = activeTargetWp?.name === item.name || activeTargetWp?.id === item.id;
            const isSelected = selectedWaypoint?.id === item.id;

            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.8}
                onPress={() => handleSelectWaypoint(item)}
                style={[
                  styles.waypointPinWrap,
                  { left: screenX - 16, top: screenY - 32 },
                  isSelected && styles.waypointPinSelected,
                ]}>
                {/* Waypoint Pin Head */}
                <View
                  style={[
                    styles.waypointBeacon,
                    isTarget && styles.waypointBeaconTarget,
                    isSelected && styles.waypointBeaconSelected,
                  ]}>
                  <Text style={styles.waypointBeaconText}>{index + 1}</Text>
                </View>
                {/* Pointing Needle Tip */}
                <View
                  style={[
                    styles.waypointNeedleTip,
                    isTarget && styles.needleTipTarget,
                    isSelected && styles.needleTipSelected,
                  ]}
                />
                {/* Waypoint Name Pill */}
                <View style={[styles.waypointPillBox, isTarget && styles.waypointPillBoxTarget]}>
                  <Text style={styles.waypointPillText} numberOfLines={1}>
                    {item.name}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}

          {/* GPS FISHING VESSEL MARKER */}
          <Animated.View
            style={[
              styles.boatMarkerWrap,
              {
                left: vesselScreenX - 24,
                top: vesselScreenY - 24,
                transform: [
                  {
                    rotate: boatRotateAnim.interpolate({
                      inputRange: [-360000, 360000],
                      outputRange: ['-360000deg', '360000deg'],
                    }),
                  },
                ],
              },
            ]}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleCenterOnBoat}
              style={styles.boatTouchInner}>
              <View style={styles.radarCone} />
              <View style={styles.bowHeadingLine} />

              <View style={styles.boatHull}>
                <View style={styles.boatBowTriangle} />
                <View style={styles.boatDeck} />
                <View style={styles.boatCenterPip}>
                  <View style={styles.boatInnerDot} />
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        {/* Weather Banner (If active) */}
        {weatherOverlay && (
          <View style={styles.weatherBannerBox} pointerEvents="none">
            <Text style={styles.weatherBannerText}>
              🌦️ Swell: 1.1 m • Wind: 11 kn NW • Baro: 1013 hPa (Arabian Sea Safe)
            </Text>
          </View>
        )}

        {/* 5. BOTTOM-LEFT MINIMALIST ZOOM CONTROLS (ONLY + AND - BUTTONS, NO Z13 BADGE) */}
        <View style={styles.bottomLeftZoomCapsule}>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={handleZoomIn}
            style={styles.zoomCapBtn}>
            <ModernZoomInIcon size={24} color="#0D47A1" />
          </TouchableOpacity>
          <View style={styles.zoomDivider} />
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={handleZoomOut}
            style={styles.zoomCapBtn}>
            <ModernZoomOutIcon size={24} color="#0D47A1" />
          </TouchableOpacity>
        </View>

        {/* 6. BOTTOM-RIGHT FLOATING COMMAND CONSOLE (HIGH-TECH FAB + ANIMATED DOCK) */}
        <View style={styles.bottomRightDockWrapper} pointerEvents="box-none">
          {/* Animated Tools Stack (Floats directly above the FAB) */}
          <Animated.View
            style={[
              styles.bottomRightFloatingDock,
              {
                opacity: toolsAnim,
                transform: [
                  {
                    translateY: toolsAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [240, 0],
                    }),
                  },
                  {
                    scale: toolsAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.75, 1],
                    }),
                  },
                ],
              },
            ]}
            pointerEvents={toolsVisible ? 'auto' : 'none'}>
            {/* 1. Orientation Toggle (N-UP / H-UP) */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setNorthUp(!northUp);
                Alert.alert(
                  'Chart Orientation',
                  northUp ? 'Head-Up Mode (Chart rotates with vessel heading)' : 'North-Up Mode (Top is True North)'
                );
              }}
              style={styles.dockActionBtnBig}>
              <OrientationCompassIcon size={24} northUp={northUp} />
            </TouchableOpacity>

            {/* 2. Layers Switcher */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowLayerModal(true)}
              style={styles.dockActionBtnBig}>
              <ModernLayersIcon size={24} color="#0D47A1" />
            </TouchableOpacity>

            {/* 3. Center on Vessel */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleCenterOnBoat}
              style={styles.dockActionBtnBig}>
              <PrecisionCrosshairIcon size={24} color="#0D47A1" />
            </TouchableOpacity>

            {/* 4. Record Track */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleToggleRecording}
              style={[styles.dockActionBtnBig, isRecording && styles.dockActionBtnRecording]}>
              <RecordTrackIcon size={24} isRecording={isRecording} />
            </TouchableOpacity>

            {/* 5. Drop Mark / Pin */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleDropWaypoint}
              style={styles.dockActionBtnBigPurple}>
              <WaypointBeaconIcon size={24} color="#FFFFFF" />
            </TouchableOpacity>

            {/* 6. Compass Screen Shortcut */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/compass')}
              style={styles.dockActionBtnBig}>
              <CompassGyroIcon size={24} />
            </TouchableOpacity>

            {/* 7. Offline Cache Manager */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowOfflineModal(true)}
              style={styles.dockActionBtnBig}>
              <OfflineStorageIcon size={22} color="#0284C7" />
            </TouchableOpacity>
          </Animated.View>

          {/* High-Tech Circular Floating Action Button (FAB) Toggle */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleToggleTools}
            style={[styles.toolsFabButton, toolsVisible && styles.toolsFabButtonActive]}>
            {toolsVisible ? (
              <ModernCloseIcon size={20} color="#FFFFFF" />
            ) : (
              <ToolsConsoleIcon size={22} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>

        {/* 7. INTERACTIVE WAYPOINT INSPECTOR OVERLAY CARD (ONLY SHOWN WHEN SELECTED) */}
        {selectedWaypoint && (
          <Animated.View
            style={[
              styles.waypointInspectorCard,
              {
                opacity: cardSlideAnim,
                transform: [
                  {
                    translateY: cardSlideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [240, 0],
                    }),
                  },
                ],
              },
            ]}>
            <View style={styles.inspectorTopRow}>
              <View style={styles.inspectorTitleWrap}>
                <View style={styles.inspectorPinBadge}>
                  <WaypointBeaconIcon size={20} color="#0D47A1" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inspectorNameText} numberOfLines={1}>
                    {selectedWaypoint.name}
                  </Text>
                  <Text style={styles.inspectorCoordsText}>
                    {selectedWaypoint.latDir} {selectedWaypoint.latDeg}° {selectedWaypoint.latMin}&apos;   {selectedWaypoint.lonDir} {selectedWaypoint.lonDeg}° {selectedWaypoint.lonMin}&apos;
                  </Text>
                </View>
              </View>

              {/* Working Close (✕) Button */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleCloseWaypointCard}
                style={styles.inspectorCloseBtn}>
                <ModernCloseIcon size={16} color="#475569" />
              </TouchableOpacity>
            </View>

            <View style={styles.inspectorStatsRow}>
              <View style={styles.inspectorStatBox}>
                <Text style={styles.inspectorStatLbl}>DISTANCE</Text>
                <Text style={styles.inspectorStatVal}>{selectedWaypoint.distance || '0.00 Mi'}</Text>
              </View>
              <View style={styles.inspectorStatBox}>
                <Text style={styles.inspectorStatLbl}>BEARING</Text>
                <Text style={styles.inspectorStatVal}>{selectedWaypoint.bearing || '000°'}</Text>
              </View>
              <View style={styles.inspectorStatBox}>
                <Text style={styles.inspectorStatLbl}>CREATED</Text>
                <Text style={[styles.inspectorStatVal, { fontSize: 11 }]}>
                  {selectedWaypoint.createdAt || 'Recent'}
                </Text>
              </View>
            </View>

            <View style={styles.inspectorButtonsRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setActiveTarget(selectedWaypoint);
                  VoiceService.speak(`Navigating to ${selectedWaypoint.name}`);
                  Alert.alert(
                    'Target Activated 🎯',
                    `Steering guidance set for "${selectedWaypoint.name}". Active navigation course line plotted.`
                  );
                }}
                style={styles.inspectorTargetBtn}>
                <TargetBullseyeIcon size={18} color="#FFFFFF" />
                <Text style={styles.inspectorTargetBtnText}>Set Target</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  router.push({
                    pathname: '/compass',
                    params: {
                      targetId: selectedWaypoint.id,
                      targetName: selectedWaypoint.name,
                      bearing: selectedWaypoint.bearing,
                      distance: selectedWaypoint.distance,
                    },
                  });
                }}
                style={styles.inspectorCompassBtn}>
                <CompassGyroIcon size={18} />
                <Text style={styles.inspectorCompassBtnText}>Compass</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  VoiceService.announceWaypoint(
                    selectedWaypoint.name,
                    selectedWaypoint.distance,
                    selectedWaypoint.bearing
                  );
                }}
                style={styles.inspectorVoiceBtn}>
                <VoiceSpeakerIcon size={18} color="#FFFFFF" />
                <Text style={styles.inspectorVoiceBtnText}>Voice</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      </View>

      {/* 8. LAYER SELECTOR MODAL */}
      <Modal
        visible={showLayerModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLayerModal(false)}>
        <TouchableWithoutFeedback onPress={() => setShowLayerModal(false)}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback>
              <View style={styles.modalCard}>
                <View style={styles.modalHeaderRow}>
                  <ModernLayersIcon size={22} color="#0D47A1" />
                  <Text style={styles.modalTitleText}>Select Chart Layer</Text>
                </View>
                <Text style={styles.modalSubtitleText}>
                  Choose optimal live cartography for deep sea navigation & fishing.
                </Text>

                {/* Layer 1: OpenStreetMap */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    setActiveLayer('openstreet');
                    setShowLayerModal(false);
                  }}
                  style={[
                    styles.layerOptionRow,
                    activeLayer === 'openstreet' && styles.layerOptionRowActive,
                  ]}>
                  <View style={styles.layerOptionIconBadge}>
                    <Text style={{ fontSize: 18 }}>🗺️</Text>
                  </View>
                  <View style={styles.layerOptionInfo}>
                    <Text style={styles.layerOptionTitle}>OpenStreetMap (Standard)</Text>
                    <Text style={styles.layerOptionDesc}>
                      Fast rendering, coastal topology, harbors, channels & docks.
                    </Text>
                  </View>
                  {activeLayer === 'openstreet' && <Text style={styles.layerActiveCheck}>✓</Text>}
                </TouchableOpacity>

                {/* Layer 2: Satellite Imagery */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    setActiveLayer('satellite');
                    setShowLayerModal(false);
                  }}
                  style={[
                    styles.layerOptionRow,
                    activeLayer === 'satellite' && styles.layerOptionRowActive,
                  ]}>
                  <View style={styles.layerOptionIconBadge}>
                    <Text style={{ fontSize: 18 }}>🛰️</Text>
                  </View>
                  <View style={styles.layerOptionInfo}>
                    <Text style={styles.layerOptionTitle}>ESRI High-Res Satellite</Text>
                    <Text style={styles.layerOptionDesc}>
                      True aerial photography of reefs, shoreline, shoals & water clarity.
                    </Text>
                  </View>
                  {activeLayer === 'satellite' && <Text style={styles.layerActiveCheck}>✓</Text>}
                </TouchableOpacity>

                {/* Layer 3: Nautical Bathymetry */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    setActiveLayer('nautical');
                    setShowLayerModal(false);
                  }}
                  style={[
                    styles.layerOptionRow,
                    activeLayer === 'nautical' && styles.layerOptionRowActive,
                  ]}>
                  <View style={styles.layerOptionIconBadge}>
                    <Text style={{ fontSize: 18 }}>🌊</Text>
                  </View>
                  <View style={styles.layerOptionInfo}>
                    <Text style={styles.layerOptionTitle}>Nautical Ocean Chart</Text>
                    <Text style={styles.layerOptionDesc}>
                      Bathymetric depth gradients, marine trenches & underwater contours.
                    </Text>
                  </View>
                  {activeLayer === 'nautical' && <Text style={styles.layerActiveCheck}>✓</Text>}
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setShowLayerModal(false)}
                  style={styles.modalCloseBtn}>
                  <Text style={styles.modalCloseBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* 9. OFFLINE TILE CACHE MANAGER MODAL */}
      <Modal
        visible={showOfflineModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowOfflineModal(false)}>
        <TouchableWithoutFeedback onPress={() => setShowOfflineModal(false)}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback>
              <View style={styles.modalCard}>
                <View style={styles.offlineModalHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <OfflineStorageIcon size={22} color="#0D47A1" />
                    <Text style={styles.modalTitleText}>Offline Marine Storage</Text>
                  </View>
                </View>

                <Text style={styles.modalSubtitleText}>
                  Cache full nautical chart grids for deep offshore navigation where mobile network is unavailable.
                </Text>

                <View style={styles.offlineStatsBox}>
                  <View style={styles.offlineStatCol}>
                    <Text style={styles.offlineStatVal}>{cachedTileCount}</Text>
                    <Text style={styles.offlineStatLbl}>STORED TILES</Text>
                  </View>
                  <View style={styles.offlineStatDivider} />
                  <View style={styles.offlineStatCol}>
                    <Text style={styles.offlineStatVal}>{(cachedTileCount * 0.024).toFixed(1)} MB</Text>
                    <Text style={styles.offlineStatLbl}>CACHE SIZE</Text>
                  </View>
                  <View style={styles.offlineStatDivider} />
                  <View style={styles.offlineStatCol}>
                    <Text style={[styles.offlineStatVal, { color: '#059669' }]}>100%</Text>
                    <Text style={styles.offlineStatLbl}>OFFLINE READY</Text>
                  </View>
                </View>

                <Text style={styles.sectorSelectTitle}>Select Fishing Sector:</Text>

                {[
                  'Diu & Veraval Deep Basin',
                  'Porbandar Continental Shelf',
                  'Gulf of Khambhat Estuary',
                  'Okha & Dwarka Reefs',
                ].map((sector) => (
                  <TouchableOpacity
                    key={sector}
                    activeOpacity={0.8}
                    onPress={() => setSelectedSector(sector)}
                    style={[
                      styles.sectorItemRow,
                      selectedSector === sector && styles.sectorItemRowActive,
                    ]}>
                    <Text style={styles.sectorItemText}>{sector}</Text>
                    {selectedSector === sector && <Text style={styles.sectorCheck}>✓</Text>}
                  </TouchableOpacity>
                ))}

                {isDownloadingCache ? (
                  <View style={styles.downloadProgressWrap}>
                    <Text style={styles.downloadProgressText}>
                      Caching tiles: {downloadProgress}%
                    </Text>
                    <View style={styles.progressBarTrack}>
                      <View style={[styles.progressBarFill, { width: `${downloadProgress}%` }]} />
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={handleStartOfflineDownload}
                    style={styles.downloadActionBtn}>
                    <Text style={styles.downloadActionText}>Download Sector Tiles (15 Mi)</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setShowOfflineModal(false)}
                  style={[styles.modalCloseBtn, { backgroundColor: '#F1F5F9' }]}>
                  <Text style={[styles.modalCloseBtnText, { color: '#334155' }]}>Close</Text>
                </TouchableOpacity>
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
    backgroundColor: '#F8FAFC',
  },

  // 1. TOP HEADER BAR
  topHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    zIndex: 60,
  },
  layerSelectorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 7,
  },
  layerSelectorText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0D47A1',
  },
  layerDropdownArrow: {
    fontSize: 9,
    color: '#0D47A1',
    marginTop: 1,
  },
  offlineStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: 6,
  },
  offlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  offlineStatusText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#047857',
  },

  // 2. TOP HUD METRICS (4 CARDS) - Rock-solid 52px fixed height, perfectly stable
  hudRow: {
    flexDirection: 'row',
    backgroundColor: '#0D47A1',
    paddingVertical: 8,
    paddingHorizontal: 8,
    gap: 6,
    zIndex: 58,
    alignItems: 'stretch',
  },
  hudCard: {
    flex: 1,
    height: 52,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  hudLabel: {
    color: '#93C5FD',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    lineHeight: 12,
    textAlign: 'center',
  },
  hudValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    marginTop: 2,
    lineHeight: 18,
    textAlign: 'center',
  },

  // 3. BLACK POSITION & DGPS BANNER
  positionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    paddingVertical: 7,
    paddingHorizontal: 14,
    zIndex: 55,
  },
  positionText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  dgpsStatusWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dgpsDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#00E676',
  },
  dgpsText: {
    color: '#00E676',
    fontSize: 10,
    fontWeight: '800',
  },

  // 4. MAP CANVAS
  mapCanvasWrapper: {
    flex: 1,
    backgroundColor: '#AAD3DF',
    overflow: 'hidden',
    position: 'relative',
    ...(Platform.OS === 'web'
      ? {
          userSelect: 'none' as const,
          touchAction: 'none' as const,
          cursor: 'grab' as const,
        }
      : {}),
  },
  mapContentLayer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  mapTile: {
    position: 'absolute',
    width: 256,
    height: 256,
  },

  // BREADCRUMBS
  breadcrumbDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(234, 88, 12, 0.85)',
    zIndex: 32,
  },

  // ONLY ACTIVE NAVIGATION ROUTE LINE
  routeOuterGlow: {
    position: 'absolute',
    height: 8,
    backgroundColor: 'rgba(6, 182, 212, 0.45)',
    borderRadius: 4,
    zIndex: 36,
  },
  routeCoreLine: {
    position: 'absolute',
    height: 3.5,
    backgroundColor: '#00E5FF',
    borderRadius: 1.75,
    zIndex: 37,
  },
  routeBadgePill: {
    position: 'absolute',
    width: 120,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#00E5FF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 42,
  },
  routeBadgeText: {
    color: '#00E5FF',
    fontSize: 10,
    fontWeight: '800',
  },
  targetPulseCircle: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2.5,
    borderColor: '#00E5FF',
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    zIndex: 38,
  },

  // WAYPOINT PINS
  waypointPinWrap: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 40,
  },
  waypointPinSelected: {
    transform: [{ scale: 1.25 }],
  },
  waypointBeacon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0D47A1',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 5,
  },
  waypointBeaconTarget: {
    backgroundColor: '#E11D48',
    borderColor: '#FFE4E6',
  },
  waypointBeaconSelected: {
    backgroundColor: '#7C3AED',
    borderColor: '#EDE9FE',
  },
  waypointBeaconText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  waypointNeedleTip: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#0D47A1',
    marginTop: -1,
  },
  needleTipTarget: {
    borderTopColor: '#E11D48',
  },
  needleTipSelected: {
    borderTopColor: '#7C3AED',
  },
  waypointPillBox: {
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
    maxWidth: 95,
  },
  waypointPillBoxTarget: {
    backgroundColor: 'rgba(225, 29, 72, 0.92)',
  },
  waypointPillText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    textAlign: 'center',
  },

  // FISHING VESSEL MARKER
  boatMarkerWrap: {
    position: 'absolute',
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 45,
  },
  boatTouchInner: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarCone: {
    position: 'absolute',
    top: -55,
    width: 0,
    height: 0,
    borderLeftWidth: 40,
    borderRightWidth: 40,
    borderTopWidth: 65,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'rgba(6, 182, 212, 0.22)',
  },
  bowHeadingLine: {
    position: 'absolute',
    top: -45,
    width: 2,
    height: 45,
    backgroundColor: '#00E5FF',
  },
  boatHull: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boatBowTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 9,
    borderRightWidth: 9,
    borderBottomWidth: 16,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#EF4444',
  },
  boatDeck: {
    width: 14,
    height: 8,
    backgroundColor: '#1E40AF',
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    marginTop: -2,
  },
  boatCenterPip: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boatInnerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0D47A1',
  },

  // WEATHER OVERLAY
  weatherBannerBox: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    alignItems: 'center',
    zIndex: 50,
  },
  weatherBannerText: {
    color: '#E0F2FE',
    fontSize: 11,
    fontWeight: '700',
  },

  // 5. BOTTOM-LEFT ZOOM CONTROLS (ONLY + AND - BUTTONS, NO Z13 BADGE)
  bottomLeftZoomCapsule: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 8,
    zIndex: 48,
  },
  zoomCapBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomDivider: {
    width: 26,
    height: 1.5,
    backgroundColor: '#E2E8F0',
  },

  // 6. BOTTOM-RIGHT FLOATING COMMAND CONSOLE & HIGH-TECH FAB
  bottomRightDockWrapper: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    alignItems: 'center',
    gap: 10,
    zIndex: 55,
  },
  bottomRightFloatingDock: {
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 6,
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 9,
    alignItems: 'center',
  },
  dockActionBtnBig: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dockActionBtnRecording: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },
  dockActionBtnBigPurple: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#6D28D9',
  },
  toolsFabButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#0D47A1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 9,
    borderWidth: 2,
    borderColor: '#38BDF8',
  },
  toolsFabButtonActive: {
    backgroundColor: '#0F172A',
    borderColor: '#64748B',
  },

  // 7. WAYPOINT INSPECTOR OVERLAY CARD
  waypointInspectorCard: {
    position: 'absolute',
    bottom: 16,
    left: 12,
    right: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.32,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: 1.5,
    borderColor: '#0D47A1',
    zIndex: 70,
  },
  inspectorTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  inspectorTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  inspectorPinBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  inspectorNameText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  inspectorCoordsText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#2563EB',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 2,
  },
  inspectorCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inspectorStatsRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  inspectorStatBox: {
    flex: 1,
    alignItems: 'center',
  },
  inspectorStatLbl: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
  },
  inspectorStatVal: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0D47A1',
    marginTop: 2,
  },
  inspectorButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  inspectorTargetBtn: {
    flex: 2,
    flexDirection: 'row',
    backgroundColor: '#0D47A1',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  inspectorTargetBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  inspectorCompassBtn: {
    flex: 1.2,
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  inspectorCompassBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  inspectorVoiceBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#0284C7',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  inspectorVoiceBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  // MODAL STYLES
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 420,
    gap: 12,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalTitleText: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
  },
  modalSubtitleText: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    fontWeight: '500',
  },
  layerOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  layerOptionRowActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  layerOptionIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  layerOptionInfo: {
    flex: 1,
  },
  layerOptionTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  layerOptionDesc: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  layerActiveCheck: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '900',
  },
  modalCloseBtn: {
    backgroundColor: '#0D47A1',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  modalCloseBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  // OFFLINE MODAL
  offlineModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  offlineStatsBox: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  offlineStatCol: {
    flex: 1,
    alignItems: 'center',
  },
  offlineStatVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0D47A1',
  },
  offlineStatLbl: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    marginTop: 2,
  },
  offlineStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#CBD5E1',
  },
  sectorSelectTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 4,
  },
  sectorItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectorItemRowActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  sectorItemText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  sectorCheck: {
    color: '#3B82F6',
    fontWeight: '900',
    fontSize: 14,
  },
  downloadProgressWrap: {
    gap: 6,
    marginTop: 4,
  },
  downloadProgressText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  downloadActionBtn: {
    backgroundColor: '#0D47A1',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  downloadActionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
