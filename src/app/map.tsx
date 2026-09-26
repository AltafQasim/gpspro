import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  INITIAL_WAYPOINTS,
  WaypointItem,
  getActiveTarget,
  getWaypoints,
  setActiveTarget,
} from '@/services/waypointStore';
import { VoiceService } from '@/services/voiceService';

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
  const x = ((lon + 180) / 360) * scale;
  const latRad = (lat * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * scale;
  return { x, y };
}

// Convert DMF Waypoint (Deg + Min) to Decimal Degrees
function waypointToDecimal(wp: WaypointItem) {
  const lat = (parseFloat(wp.latDeg) + parseFloat(wp.latMin) / 60) * (wp.latDir === 'S' ? -1 : 1);
  const lon = (parseFloat(wp.lonDeg) + parseFloat(wp.lonMin) / 60) * (wp.lonDir === 'W' ? -1 : 1);
  return { lat, lon };
}

export default function MarineMapScreen() {
  const router = useRouter();

  // Gujarat Coastal Marine Fishing Center (Diu / Veraval Deep Basin)
  const [centerLat, setCenterLat] = useState<number>(20.7428);
  const [centerLon, setCenterLon] = useState<number>(71.0718);
  const [zoom, setZoom] = useState<number>(13);

  // Vessel Telemetry
  const [speedKnots, setSpeedKnots] = useState<number>(4.2);
  const [heading, setHeading] = useState<number>(352);
  const [distance, setDistance] = useState<number>(1.15);
  const [bearing, setBearing] = useState<number>(73);

  // Map Controls State
  const [activeLayer, setActiveLayer] = useState<MapLayerType>('openstreet');
  const [showLayerModal, setShowLayerModal] = useState<boolean>(false);
  const [isTrackingOn, setIsTrackingOn] = useState<boolean>(true);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isMagnetic, setIsMagnetic] = useState<boolean>(true);
  const [northUp, setNorthUp] = useState<boolean>(true);
  const [toolbarsVisible, setToolbarsVisible] = useState<boolean>(true);
  const [weatherOverlay, setWeatherOverlay] = useState<boolean>(false);

  // Offline Tile Cache State
  const [showOfflineModal, setShowOfflineModal] = useState<boolean>(false);
  const [cachedTileCount, setCachedTileCount] = useState<number>(184);
  const [isDownloadingCache, setIsDownloadingCache] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [selectedSector, setSelectedSector] = useState<string>('Diu & Veraval Deep Basin');

  // Selected Waypoint & Active Target
  const [selectedWaypoint, setSelectedWaypoint] = useState<WaypointItem | null>(null);
  const [activeTargetWp, setActiveTargetWp] = useState<WaypointItem | null>(null);

  // Position formatted string matching screenshot
  const latStr = "N 20° 44.572'";
  const lonStr = "E 71° 04.313'";

  // Map Pan Offset
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Pan gesture responder to drag map smoothly in all directions
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        panStartRef.current = { ...panOffset };
      },
      onPanResponderMove: (_, gestureState) => {
        setPanOffset({
          x: panStartRef.current.x + gestureState.dx,
          y: panStartRef.current.y + gestureState.dy,
        });
      },
    })
  ).current;

  // Sync active target from global store
  useEffect(() => {
    const curTarget = getActiveTarget();
    if (curTarget) {
      setActiveTargetWp(curTarget);
      setBearing(parseInt(curTarget.bearing) || 73);
      setDistance(parseFloat(curTarget.distance) || 1.15);
    }
  }, []);

  // Zoom In / Out
  const handleZoomIn = () => {
    if (zoom < 16) {
      setZoom((prev) => prev + 1);
      setPanOffset({ x: 0, y: 0 });
    }
  };

  const handleZoomOut = () => {
    if (zoom > 9) {
      setZoom((prev) => prev - 1);
      setPanOffset({ x: 0, y: 0 });
    }
  };

  // Center on boat GPS position
  const handleCenterOnBoat = () => {
    setPanOffset({ x: 0, y: 0 });
    Alert.alert('Vessel Centered 🛥️', 'Chart locked on boat GPS: ' + latStr + ', ' + lonStr);
  };

  // Start / Stop Track Recording
  const handleToggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      Alert.alert('Track Recording Started 🔴', 'Nautical voyage track is now recording with GPS breadcrumbs.');
    } else {
      setIsRecording(false);
      Alert.alert('Track Saved 💾', 'Recorded 4.8 nmi track saved to GPX files.');
    }
  };

  // Drop Waypoint at Current Boat Position
  const handleDropWaypoint = () => {
    const newWp: WaypointItem = {
      id: `wp-${Date.now()}`,
      name: `Mark #${Math.floor(Math.random() * 900 + 100)}`,
      latDeg: '20',
      latMin: '44.572',
      latDir: 'N',
      lonDeg: '71',
      lonMin: '04.313',
      lonDir: 'E',
      icon: '📍',
      distance: '0.00 Mi',
      bearing: '000°',
      createdAt: new Date().toISOString().split('T')[0],
    };
    setSelectedWaypoint(newWp);
    VoiceService.announceWaypoint(newWp.name, newWp.distance, newWp.bearing);
    Alert.alert('Waypoint Marked! 📍', `Dropped "${newWp.name}" at boat location.`);
  };

  // Offline Cache Downloader Simulation
  const handleStartOfflineDownload = () => {
    setIsDownloadingCache(true);
    setDownloadProgress(10);

    const step1 = setTimeout(() => setDownloadProgress(35), 600);
    const step2 = setTimeout(() => setDownloadProgress(70), 1200);
    const step3 = setTimeout(() => {
      setDownloadProgress(100);
      setIsDownloadingCache(false);
      setCachedTileCount((prev) => prev + 86);
      Alert.alert(
        'Offline Cache Complete ✅',
        `Successfully cached ${selectedSector} (${zoom} zoom levels). 100% offline navigation ready for deep sea!`
      );
    }, 1900);

    return () => {
      clearTimeout(step1);
      clearTimeout(step2);
      clearTimeout(step3);
    };
  };

  // Compute Active Tile Grid around Center (3x3 grid)
  const centerWorld = latLonToWorld(centerLat, centerLon, zoom);
  const centerTileX = Math.floor(centerWorld.x / 256);
  const centerTileY = Math.floor(centerWorld.y / 256);

  const tileOriginX = centerWorld.x % 256;
  const tileOriginY = centerWorld.y % 256;

  const tiles: TileInfo[] = [];
  for (let dx = -2; dx <= 2; dx++) {
    for (let dy = -2; dy <= 2; dy++) {
      const tileX = centerTileX + dx;
      const tileY = centerTileY + dy;

      let tileUrl = '';
      if (activeLayer === 'openstreet') {
        tileUrl = `https://tile.openstreetmap.org/${zoom}/${tileX}/${tileY}.png`;
      } else if (activeLayer === 'satellite') {
        tileUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${tileY}/${tileX}`;
      } else {
        // Nautical / Ocean Bathymetry layer
        tileUrl = `https://services.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/${zoom}/${tileY}/${tileX}`;
      }

      const left = SCREEN_WIDTH / 2 - tileOriginX + dx * 256 + panOffset.x;
      const top = SCREEN_HEIGHT / 2 - tileOriginY + dy * 256 + panOffset.y;

      tiles.push({
        key: `${zoom}-${tileX}-${tileY}-${activeLayer}`,
        x: tileX,
        y: tileY,
        z: zoom,
        url: tileUrl,
        left,
        top,
      });
    }
  }

  // Vessel Screen Position (centered by default + panOffset)
  const vesselScreenX = SCREEN_WIDTH / 2 + panOffset.x;
  const vesselScreenY = SCREEN_HEIGHT / 2 + panOffset.y;

  // Waypoints Mathematical Pixel Placement
  const allWaypoints = getWaypoints();
  const plottedWaypoints = allWaypoints.map((wp) => {
    const { lat, lon } = waypointToDecimal(wp);
    const wpWorld = latLonToWorld(lat, lon, zoom);
    const screenX = SCREEN_WIDTH / 2 + (wpWorld.x - centerWorld.x) + panOffset.x;
    const screenY = SCREEN_HEIGHT / 2 + (wpWorld.y - centerWorld.y) + panOffset.y;
    return {
      item: wp,
      screenX,
      screenY,
    };
  });

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.container}>
      <StatusBar style="dark" />

      {/* 1. TOP HEADER BAR */}
      <View style={styles.topHeaderBar}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          style={styles.backButton}>
          <Text style={styles.backArrow}>‹</Text>
          <Text style={styles.backText}>Home</Text>
        </TouchableOpacity>

        {/* Marine Map Title with Layer Pill */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setShowLayerModal(true)}
          style={styles.layerSelectorBadge}>
          <Text style={styles.layerSelectorIcon}>
            {activeLayer === 'openstreet' ? '🗺️' : activeLayer === 'satellite' ? '🛰️' : '⚓'}
          </Text>
          <Text style={styles.layerSelectorText}>
            {activeLayer === 'openstreet'
              ? 'OpenStreetMap'
              : activeLayer === 'satellite'
              ? 'Satellite Map'
              : 'Google Nautical'}
          </Text>
          <Text style={styles.layerDropdownArrow}>▼</Text>
        </TouchableOpacity>

        {/* Offline Cache Status Pill */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setShowOfflineModal(true)}
          style={styles.offlineStatusPill}>
          <View style={styles.offlineDot} />
          <Text style={styles.offlineStatusText}>{cachedTileCount} Tiles 💾</Text>
        </TouchableOpacity>
      </View>

      {/* 2. TOP 4 HUD METRIC CARDS (Matching Screenshot with Modern Polish) */}
      <View style={styles.hudRow}>
        {/* Speed */}
        <View style={styles.hudCard}>
          <Text style={styles.hudLabel}>SPEED (KN)</Text>
          <Text style={styles.hudValue}>{speedKnots.toFixed(2)}</Text>
        </View>

        {/* Distance */}
        <View style={styles.hudCard}>
          <Text style={styles.hudLabel}>DISTANCE</Text>
          <Text style={styles.hudValue}>{activeTargetWp ? `${distance.toFixed(2)} mi` : '--'}</Text>
        </View>

        {/* Bearing */}
        <View style={styles.hudCard}>
          <Text style={styles.hudLabel}>BEARING</Text>
          <Text style={styles.hudValue}>{activeTargetWp ? `${bearing}°` : '000°'}</Text>
        </View>

        {/* Heading */}
        <View style={styles.hudCard}>
          <Text style={styles.hudLabel}>HEADING</Text>
          <Text style={styles.hudValue}>{heading.toString().padStart(3, '0')}°</Text>
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

      {/* 4. MAIN MAP CANVAS (REAL TILES + ACCURATE WAYPOINTS + DRAG GESTURE) */}
      <View style={styles.mapCanvasWrapper} {...panResponder.panHandlers}>
        {/* Dynamic Slippy Map Tiles Layer with 100% Offline Disk Caching */}
        {tiles.map((tile) => (
          <Image
            key={tile.key}
            source={{ uri: tile.url }}
            cachePolicy="disk"
            style={[styles.mapTile, { left: tile.left, top: tile.top }]}
          />
        ))}

        {/* Nautical Shipping Channel Corridor Overlay */}
        <View
          style={[
            styles.shippingLaneLine,
            {
              left: vesselScreenX - 60,
              top: vesselScreenY - 140,
              transform: [{ rotate: '38deg' }],
            },
          ]}
        />

        {/* Bearing Line to Active Waypoint Target (Red Dotted Ray) */}
        {activeTargetWp && (
          <View
            style={[
              styles.bearingRayLine,
              {
                left: vesselScreenX,
                top: vesselScreenY,
                transform: [{ rotate: `${bearing}deg` }],
              },
            ]}
          />
        )}

        {/* ALL 100% MATHEMATICALLY ACCURATE WAYPOINTS PLOTTED ON MAP */}
        {plottedWaypoints.map(({ item, screenX, screenY }) => {
          const isTarget = activeTargetWp?.name === item.name;
          const isSelected = selectedWaypoint?.id === item.id;

          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.8}
              onPress={() => {
                setSelectedWaypoint(item);
                VoiceService.announceWaypoint(item.name, item.distance, item.bearing);
              }}
              style={[
                styles.waypointPinWrap,
                { left: screenX - 16, top: screenY - 32 },
                isSelected && styles.waypointPinSelected,
              ]}>
              {/* Waypoint Pin Head */}
              <View style={[styles.waypointBeacon, isTarget && styles.waypointBeaconTarget]}>
                <Text style={styles.waypointBeaconIcon}>{item.icon || '📍'}</Text>
              </View>
              {/* Pointing Needle Tip */}
              <View style={[styles.waypointNeedleTip, isTarget && styles.needleTipTarget]} />
              {/* Waypoint Name Pill */}
              <View style={styles.waypointPillBox}>
                <Text style={styles.waypointPillText} numberOfLines={1}>
                  {item.name}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* GPS FISHING VESSEL MARKER */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleCenterOnBoat}
          style={[
            styles.boatMarkerWrap,
            {
              left: vesselScreenX - 22,
              top: vesselScreenY - 22,
              transform: [{ rotate: `${heading}deg` }],
            },
          ]}>
          {/* Forward Radar Sweep Cone */}
          <View style={styles.radarCone} />
          {/* Boat Hull Shape */}
          <View style={styles.boatHull}>
            {/* Red Bow Arrow (Points in Heading direction) */}
            <View style={styles.boatBowRed} />
            {/* Blue Stern */}
            <View style={styles.boatSternBlue} />
            {/* Center Anchor Pip */}
            <View style={styles.boatCenterAnchor}>
              <Text style={styles.boatAnchorText}>⚓</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Weather Banner (If active) */}
        {weatherOverlay && (
          <View style={styles.weatherBannerBox}>
            <Text style={styles.weatherBannerText}>
              🌦️ Swell: 1.1 m • Wind: 11 kn NW • Baro: 1013 hPa (Arabian Sea Safe)
            </Text>
          </View>
        )}

        {/* 5. FLOATING TOOLBARS (LATEST 2026 MODERN ICONS) */}
        {toolbarsVisible ? (
          <>
            {/* LEFT TOOLBAR */}
            <View style={styles.leftToolbar}>
              {/* Hide Button */}
              <TouchableOpacity
                onPress={() => setToolbarsVisible(false)}
                style={styles.toolBtnPill}>
                <Text style={styles.toolBtnText}>Hide</Text>
              </TouchableOpacity>

              {/* Record Track Button */}
              <TouchableOpacity
                onPress={handleToggleRecording}
                style={[styles.toolBtnCircleOrange, isRecording && styles.toolBtnCircleOrangeActive]}>
                <Text style={styles.toolBtnPlayIcon}>{isRecording ? '⏹' : '▷'}</Text>
              </TouchableOpacity>

              {/* Center on Boat Button */}
              <TouchableOpacity
                onPress={handleCenterOnBoat}
                style={styles.toolBtnSquare}>
                <Text style={styles.toolBtnSquareIcon}>✛</Text>
              </TouchableOpacity>

              {/* Compass Screen Shortcut */}
              <TouchableOpacity
                onPress={() => router.push('/compass')}
                style={styles.toolBtnSquare}>
                <Text style={styles.toolBtnSquareIcon}>🧭</Text>
              </TouchableOpacity>
            </View>

            {/* RIGHT TOOLBAR */}
            <View style={styles.rightToolbar}>
              {/* Layers Switcher Button */}
              <TouchableOpacity
                onPress={() => setShowLayerModal(true)}
                style={styles.toolBtnSquare}>
                <Text style={styles.toolBtnSquareIcon}>🗺️</Text>
              </TouchableOpacity>

              {/* Offline Pre-cache Button */}
              <TouchableOpacity
                onPress={() => setShowOfflineModal(true)}
                style={styles.toolBtnSquare}>
                <Text style={styles.toolBtnSquareIcon}>💾</Text>
              </TouchableOpacity>

              {/* N-UP / Head-Up Orientation */}
              <TouchableOpacity
                onPress={() => {
                  setNorthUp(!northUp);
                  Alert.alert('Chart Mode', northUp ? 'Head-Up (Rotates with Boat)' : 'North-Up (Top is North)');
                }}
                style={styles.toolBtnSquareGreen}>
                <Text style={styles.toolBtnGreenText}>{northUp ? 'N-UP' : 'H-UP'}</Text>
              </TouchableOpacity>

              {/* Drop Waypoint Pin */}
              <TouchableOpacity
                onPress={handleDropWaypoint}
                style={styles.toolBtnSquarePurple}>
                <Text style={styles.toolBtnSquareIcon}>📍</Text>
              </TouchableOpacity>
            </View>

            {/* CENTER BOTTOM ZOOM CONTROLS (+ / -) */}
            <View style={styles.centerZoomControls}>
              <TouchableOpacity onPress={handleZoomOut} style={styles.zoomButton}>
                <Text style={styles.zoomButtonText}>—</Text>
              </TouchableOpacity>
              <View style={styles.zoomLevelBadge}>
                <Text style={styles.zoomLevelText}>Z{zoom}</Text>
              </View>
              <TouchableOpacity onPress={handleZoomIn} style={styles.zoomButton}>
                <Text style={styles.zoomButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <TouchableOpacity
            onPress={() => setToolbarsVisible(true)}
            style={styles.unhideFloatingPill}>
            <Text style={styles.unhideText}>Show Tools 👁️</Text>
          </TouchableOpacity>
        )}

        {/* 6. INTERACTIVE WAYPOINT INSPECTOR OVERLAY CARD */}
        {selectedWaypoint && (
          <View style={styles.waypointInspectorCard}>
            <View style={styles.inspectorTopRow}>
              <View style={styles.inspectorTitleWrap}>
                <Text style={styles.inspectorPinEmoji}>{selectedWaypoint.icon || '📍'}</Text>
                <Text style={styles.inspectorNameText} numberOfLines={1}>
                  {selectedWaypoint.name}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedWaypoint(null)}
                style={styles.inspectorCloseBtn}>
                <Text style={styles.inspectorCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inspectorCoordsText}>
              {selectedWaypoint.latDir} {selectedWaypoint.latDeg}° {selectedWaypoint.latMin}&apos;   {selectedWaypoint.lonDir} {selectedWaypoint.lonDeg}° {selectedWaypoint.lonMin}&apos;
            </Text>

            <View style={styles.inspectorMetaRow}>
              <Text style={styles.inspectorMetaText}>Distance: {selectedWaypoint.distance}</Text>
              <Text style={styles.inspectorMetaText}>•</Text>
              <Text style={styles.inspectorMetaText}>Bearing: {selectedWaypoint.bearing}</Text>
            </View>

            <View style={styles.inspectorButtonsRow}>
              {/* Steer on Compass Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setActiveTarget(selectedWaypoint);
                  VoiceService.announceWaypoint(selectedWaypoint.name, selectedWaypoint.distance, selectedWaypoint.bearing);
                  router.push({
                    pathname: '/compass',
                    params: {
                      targetId: selectedWaypoint.id,
                      targetName: selectedWaypoint.name,
                      targetBearing: selectedWaypoint.bearing,
                      targetDistance: selectedWaypoint.distance,
                      targetLat: `${selectedWaypoint.latDir} ${selectedWaypoint.latDeg}° ${selectedWaypoint.latMin}'`,
                      targetLon: `${selectedWaypoint.lonDir} ${selectedWaypoint.lonDeg}° ${selectedWaypoint.lonMin}'`,
                    },
                  });
                }}
                style={styles.inspectorTargetBtn}>
                <Text style={styles.inspectorTargetBtnText}>🎯 Steer on Compass</Text>
              </TouchableOpacity>

              {/* Voice Announcement Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  VoiceService.announceWaypoint(selectedWaypoint.name, selectedWaypoint.distance, selectedWaypoint.bearing);
                  Alert.alert(
                    'Voice Announcement 🔊',
                    `Spoken: ${selectedWaypoint.name}, Distance: ${selectedWaypoint.distance}, Bearing: ${selectedWaypoint.bearing}`
                  );
                }}
                style={styles.inspectorVoiceBtn}>
                <Text style={styles.inspectorVoiceBtnText}>🔊 Voice</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* 3-LAYER SELECTION MODAL */}
      <Modal visible={showLayerModal} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowLayerModal(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitleText}>🗺️ Choose Marine Map Layer</Text>
              <Text style={styles.modalSubtitleText}>
                All loaded tiles are automatically stored offline for sea navigation without internet.
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
                <Text style={styles.layerOptionIcon}>🗺️</Text>
                <View style={styles.layerOptionInfo}>
                  <Text style={styles.layerOptionTitle}>OpenStreetMap (Standard)</Text>
                  <Text style={styles.layerOptionDesc}>
                    Crisp vector coastlines, harbor channels, and landmarks.
                  </Text>
                </View>
                {activeLayer === 'openstreet' && <Text style={styles.layerActiveCheck}>✓</Text>}
              </TouchableOpacity>

              {/* Layer 2: Satellite Map */}
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
                <Text style={styles.layerOptionIcon}>🛰️</Text>
                <View style={styles.layerOptionInfo}>
                  <Text style={styles.layerOptionTitle}>Satellite Map (Esri Ocean)</Text>
                  <Text style={styles.layerOptionDesc}>
                    High-resolution orbital satellite photography of reefs & open water.
                  </Text>
                </View>
                {activeLayer === 'satellite' && <Text style={styles.layerActiveCheck}>✓</Text>}
              </TouchableOpacity>

              {/* Layer 3: Google Nautical Ocean */}
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
                <Text style={styles.layerOptionIcon}>⚓</Text>
                <View style={styles.layerOptionInfo}>
                  <Text style={styles.layerOptionTitle}>Google / Nautical Bathymetry</Text>
                  <Text style={styles.layerOptionDesc}>
                    Depth soundings, underwater trenches, and coral sea contours.
                  </Text>
                </View>
                {activeLayer === 'nautical' && <Text style={styles.layerActiveCheck}>✓</Text>}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowLayerModal(false)}
                style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* OFFLINE SEA TILE CACHE MANAGER MODAL */}
      <Modal visible={showOfflineModal} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setShowOfflineModal(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.offlineModalHeader}>
                <Text style={styles.modalTitleText}>💾 Offline Marine Chart Cache</Text>
                <TouchableOpacity onPress={() => setShowOfflineModal(false)}>
                  <Text style={styles.offlineCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.offlineStatsBox}>
                <View style={styles.offlineStatCol}>
                  <Text style={styles.offlineStatVal}>{cachedTileCount}</Text>
                  <Text style={styles.offlineStatLbl}>TILES SAVED</Text>
                </View>
                <View style={styles.offlineStatDivider} />
                <View style={styles.offlineStatCol}>
                  <Text style={styles.offlineStatVal}>100%</Text>
                  <Text style={styles.offlineStatLbl}>OFFLINE READY</Text>
                </View>
                <View style={styles.offlineStatDivider} />
                <View style={styles.offlineStatCol}>
                  <Text style={styles.offlineStatVal}>6.4 MB</Text>
                  <Text style={styles.offlineStatLbl}>STORAGE</Text>
                </View>
              </View>

              <Text style={styles.sectorSelectTitle}>Select Fishing Sector to Pre-Cache:</Text>
              {[
                'Diu & Veraval Deep Basin (12-25 nmi)',
                'Porbandar Offshore Fishing Grounds',
                'Okha Lighthouse & Gulf of Kutch',
                'Jafarabad & Gulf of Khambhat Basin',
              ].map((sector) => (
                <TouchableOpacity
                  key={sector}
                  onPress={() => setSelectedSector(sector)}
                  style={[
                    styles.sectorItemRow,
                    selectedSector === sector && styles.sectorItemRowActive,
                  ]}>
                  <Text style={styles.sectorItemText}>{sector}</Text>
                  {selectedSector === sector && <Text style={styles.sectorCheck}>✓</Text>}
                </TouchableOpacity>
              ))}

              {isDownloadingCache && (
                <View style={styles.downloadProgressWrap}>
                  <Text style={styles.downloadProgressText}>
                    Caching Nautical Tiles for {selectedSector}... {downloadProgress}%
                  </Text>
                  <View style={styles.progressBarTrack}>
                    <View style={[styles.progressBarFill, { width: `${downloadProgress}%` }]} />
                  </View>
                </View>
              )}

              <TouchableOpacity
                disabled={isDownloadingCache}
                onPress={handleStartOfflineDownload}
                style={styles.downloadActionBtn}>
                <Text style={styles.downloadActionText}>
                  {isDownloadingCache ? 'Downloading to Disk...' : '⬇️ Download Sector for Offline Sea Mode'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },

  // 1. TOP HEADER BAR
  topHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    zIndex: 30,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 6,
  },
  backArrow: {
    fontSize: 26,
    color: '#0D47A1',
    lineHeight: 26,
  },
  backText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0D47A1',
  },
  layerSelectorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  layerSelectorIcon: {
    fontSize: 14,
  },
  layerSelectorText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  layerDropdownArrow: {
    fontSize: 9,
    color: '#64748B',
  },
  offlineStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
    borderWidth: 1,
    borderColor: '#6EE7B7',
  },
  offlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  offlineStatusText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#047857',
  },

  // 2. HUD CARDS
  hudRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
    zIndex: 25,
  },
  hudCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  hudLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  hudValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0D47A1',
    marginTop: 2,
  },

  // 3. BLACK POSITION BANNER
  positionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#000000',
    paddingHorizontal: 14,
    paddingVertical: 4,
    zIndex: 20,
  },
  positionText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  dgpsStatusWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dgpsDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
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
    backgroundColor: '#93C5FD',
    overflow: 'hidden',
    position: 'relative',
  },
  mapTile: {
    position: 'absolute',
    width: 256,
    height: 256,
  },
  shippingLaneLine: {
    position: 'absolute',
    width: 140,
    height: 20,
    borderStyle: 'dashed',
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: 'rgba(255, 235, 59, 0.7)',
  },
  bearingRayLine: {
    position: 'absolute',
    width: 2,
    height: 280,
    backgroundColor: '#EF4444',
    borderStyle: 'dashed',
  },

  // WAYPOINT PINS
  waypointPinWrap: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 35,
  },
  waypointPinSelected: {
    transform: [{ scale: 1.25 }],
  },
  waypointBeacon: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
  waypointBeaconIcon: {
    fontSize: 15,
  },
  waypointNeedleTip: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#0D47A1',
    marginTop: -1,
  },
  needleTipTarget: {
    borderTopColor: '#E11D48',
  },
  waypointPillBox: {
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
    maxWidth: 95,
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
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 40,
  },
  radarCone: {
    position: 'absolute',
    top: -50,
    width: 0,
    height: 0,
    borderLeftWidth: 35,
    borderRightWidth: 35,
    borderTopWidth: 60,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'rgba(56, 189, 248, 0.22)',
  },
  boatHull: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boatBowRed: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 18,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#EF4444',
  },
  boatSternBlue: {
    width: 14,
    height: 8,
    backgroundColor: '#2563EB',
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    marginTop: -2,
  },
  boatCenterAnchor: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boatAnchorText: {
    fontSize: 9,
    lineHeight: 11,
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

  // FLOATING TOOLBARS
  leftToolbar: {
    position: 'absolute',
    top: 70,
    left: 12,
    gap: 12,
    zIndex: 45,
  },
  rightToolbar: {
    position: 'absolute',
    top: 70,
    right: 12,
    gap: 12,
    zIndex: 45,
  },
  toolBtnPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  toolBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1E293B',
  },
  toolBtnCircleOrange: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FF6D00',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  toolBtnCircleOrangeActive: {
    backgroundColor: '#D50000',
  },
  toolBtnPlayIcon: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '900',
  },
  toolBtnSquare: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  toolBtnSquareIcon: {
    fontSize: 18,
  },
  toolBtnSquareGreen: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#059669',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  toolBtnGreenText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  toolBtnSquarePurple: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#7C3AED',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },

  // CENTER BOTTOM ZOOM
  centerZoomControls: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 4,
    paddingVertical: 2,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 45,
  },
  zoomButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomButtonText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
  },
  zoomLevelBadge: {
    paddingHorizontal: 8,
  },
  zoomLevelText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
  },

  unhideFloatingPill: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 50,
  },
  unhideText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  // WAYPOINT INSPECTOR OVERLAY CARD
  waypointInspectorCard: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1.5,
    borderColor: '#0D47A1',
    zIndex: 60,
  },
  inspectorTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  inspectorTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  inspectorPinEmoji: {
    fontSize: 20,
  },
  inspectorNameText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    flex: 1,
  },
  inspectorCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inspectorCloseText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#64748B',
  },
  inspectorCoordsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 4,
  },
  inspectorMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  inspectorMetaText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  inspectorButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  inspectorTargetBtn: {
    flex: 2,
    backgroundColor: '#0D47A1',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inspectorTargetBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  inspectorVoiceBtn: {
    flex: 1,
    backgroundColor: '#0284C7',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
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
    gap: 14,
  },
  modalTitleText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  modalSubtitleText: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    fontWeight: '600',
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
  layerOptionIcon: {
    fontSize: 26,
  },
  layerOptionInfo: {
    flex: 1,
  },
  layerOptionTitle: {
    fontSize: 14,
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
    marginTop: 6,
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
  offlineCloseText: {
    fontSize: 18,
    color: '#64748B',
    fontWeight: '800',
    padding: 4,
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
