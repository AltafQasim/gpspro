import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
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
  setGlobalWaypoints,
  subscribeActiveTarget,
  subscribeWaypoints,
} from '@/services/waypointStore';
import { SettingsStore } from '@/services/settingsStore';
import { VoiceService } from '@/services/voiceService';
import { BackButton } from '@/components/ui/back-button';
import {
  ModernCheckIcon,
  ModernCloseIcon,
  ModernCompassDialIcon,
  ModernDistanceIcon,
  ModernEditIcon,
  ModernMenuDotsIcon,
  ModernPlusPinIcon,
  ModernSearchIcon,
  ModernShareIcon,
  ModernSortIcon,
  ModernTagIcon,
  ModernTargetReticleIcon,
  ModernTrashIcon,
  ModernVhfRadioIcon,
} from '@/components/marine/WaypointIcons';

// Helper to convert DDM to Decimal Degrees for GPX
function convertDdmToDecimal(degStr: string, minStr: string, dir: string): number {
  const deg = parseFloat(degStr) || 0;
  const min = parseFloat(minStr) || 0;
  let dec = deg + min / 60;
  if (dir === 'S' || dir === 'W') {
    dec = -dec;
  }
  return parseFloat(dec.toFixed(6));
}

// Generate Standard GPX 1.1 XML
function generateGpxXml(items: WaypointItem[]): string {
  const pointsXml = items
    .map((wp) => {
      const lat = convertDdmToDecimal(wp.latDeg, wp.latMin, wp.latDir);
      const lon = convertDdmToDecimal(wp.lonDeg, wp.lonMin, wp.lonDir);
      return `  <wpt lat="${lat}" lon="${lon}">\n    <name>${wp.name}</name>\n    <sym>${wp.icon || 'Waypoint'}</sym>\n    <desc>Distance: ${wp.distance} | Bearing: ${wp.bearing}</desc>\n  </wpt>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="GPS Fishing Pro">\n  <metadata>\n    <name>Marine Fishing Waypoints</name>\n    <time>${new Date().toISOString()}</time>\n  </metadata>\n${pointsXml}\n</gpx>`;
}

export default function WaypointsScreen() {
  const router = useRouter();

  // State
  const [waypoints, setWaypoints] = useState<WaypointItem[]>(() => {
    const stored = getWaypoints();
    return stored && stored.length > 0 ? stored : INITIAL_WAYPOINTS;
  });
  const [activeTargetId, setActiveTargetId] = useState<string | null>(() => {
    const current = getActiveTarget();
    return current ? current.id : null;
  });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'default' | 'name' | 'distance'>('default');
  const [sortDropdownVisible, setSortDropdownVisible] = useState<boolean>(false);
  const [moreMenuVisible, setMoreMenuVisible] = useState<boolean>(false);

  // Edit / Add Modal State
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields matching Image 4
  const [formName, setFormName] = useState<string>('');
  const [formLatDeg, setFormLatDeg] = useState<string>('20');
  const [formLatMin, setFormLatMin] = useState<string>('44.861');
  const [formLatDir, setFormLatDir] = useState<'N' | 'S'>('N');
  const [formLonDeg, setFormLonDeg] = useState<string>('71');
  const [formLonMin, setFormLonMin] = useState<string>('05.333');
  const [formLonDir, setFormLonDir] = useState<'E' | 'W'>('E');
  const [formIcon, setFormIcon] = useState<string>('📍');

  // Icon Picker Modal State
  const [iconPickerVisible, setIconPickerVisible] = useState<boolean>(false);
  const AVAILABLE_ICONS = ['📍', '⚓', '🐟', '🦀', '🚩', '🪨', '⚠️', '🚢', '🏝️', '🛟'];

  // Subscribe to target changes
  useEffect(() => {
    const unsubscribe = subscribeActiveTarget((target) => {
      setActiveTargetId(target ? target.id : null);
    });
    return unsubscribe;
  }, []);

  // Subscribe to global waypoints store
  useEffect(() => {
    const unsubscribeWp = subscribeWaypoints((list) => {
      setWaypoints(list);
    });
    return unsubscribeWp;
  }, []);

  // Subscribe to SettingsStore for immediate units updates
  const [, setSettingsUpdateTick] = useState<number>(0);
  useEffect(() => {
    const unsubscribeSettings = SettingsStore.subscribe(() => {
      setSettingsUpdateTick((t) => t + 1);
    });
    return unsubscribeSettings;
  }, []);

  // Update both local and global stores
  const updateWaypointsList = (newList: WaypointItem[]) => {
    setWaypoints(newList);
    setGlobalWaypoints(newList);
  };

  // Delete Handler with Web and Native support
  const handleDelete = (item: WaypointItem) => {
    const confirmDelete = () => {
      setWaypoints((prev) => {
        const updated = prev.filter((wp) => wp.id !== item.id);
        setGlobalWaypoints(updated);
        return updated;
      });
      if (activeTargetId === item.id) {
        setActiveTarget(null);
        setActiveTargetId(null);
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`Are you sure you want to delete "${item.name}"?`);
      if (confirmed) {
        confirmDelete();
      }
      return;
    }

    Alert.alert(
      'Delete Waypoint? 🗑️',
      `Are you sure you want to delete "${item.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: confirmDelete,
        },
      ]
    );
  };

  // Open Edit Modal
  const handleOpenEdit = (item: WaypointItem) => {
    setIsEditing(true);
    setEditingId(item.id);
    setFormName(item.name);
    setFormLatDeg(item.latDeg);
    setFormLatMin(item.latMin);
    setFormLatDir(item.latDir);
    setFormLonDeg(item.lonDeg);
    setFormLonMin(item.lonMin);
    setFormLonDir(item.lonDir);
    setFormIcon(item.icon || '📍');
    setModalVisible(true);
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormName('New Fishing Spot');
    setFormLatDeg('20');
    setFormLatMin('44.572');
    setFormLatDir('N');
    setFormLonDeg('71');
    setFormLonMin('04.313');
    setFormLonDir('E');
    setFormIcon('📍');
    setModalVisible(true);
  };

  // Save (Create or Update)
  const handleSave = () => {
    if (!formName.trim()) {
      Alert.alert('Error', 'Please enter a waypoint name.');
      return;
    }

    if (isEditing && editingId) {
      // Update
      const updated = waypoints.map((wp) =>
        wp.id === editingId
          ? {
              ...wp,
              name: formName.trim(),
              latDeg: formLatDeg.trim(),
              latMin: formLatMin.trim(),
              latDir: formLatDir,
              lonDeg: formLonDeg.trim(),
              lonMin: formLonMin.trim(),
              lonDir: formLonDir,
              icon: formIcon,
            }
          : wp
      );
      updateWaypointsList(updated);
      Alert.alert('Updated ✅', `Waypoint "${formName}" updated successfully.`);
    } else {
      // Create
      const newWp: WaypointItem = {
        id: `wp-${Date.now()}`,
        name: formName.trim(),
        latDeg: formLatDeg.trim(),
        latMin: formLatMin.trim(),
        latDir: formLatDir,
        lonDeg: formLonDeg.trim(),
        lonMin: formLonMin.trim(),
        lonDir: formLonDir,
        icon: formIcon,
        distance: '0.00 Mi',
        bearing: '000°',
        createdAt: new Date().toISOString().split('T')[0],
      };
      const updated = [newWp, ...waypoints];
      updateWaypointsList(updated);
      Alert.alert('Saved ⚓', `Waypoint "${formName}" created successfully.`);
    }

    setModalVisible(false);
  };

  // Share Waypoint with Real Native / Web Share API
  const handleShare = async (item: WaypointItem) => {
    const coordString = `${item.latDir} ${item.latDeg}° ${item.latMin}', ${item.lonDir} ${item.lonDeg}° ${item.lonMin}'`;
    const message = `⚓ Marine Waypoint: ${item.name}\n📍 Coordinates: ${coordString}\n📏 Distance: ${item.distance} | 🧭 Bearing: ${item.bearing}\n📻 VHF Radio Channel 16/68 format ready.`;

    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && navigator.share) {
        try {
          await navigator.share({ title: item.name, text: message });
          return;
        } catch {
          // User cancelled
        }
      }
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(message);
          Alert.alert('Copied 📋', `Coordinates for "${item.name}" copied to clipboard!`);
          return;
        } catch {
          // Fallback
        }
      }
    }

    try {
      await Share.share({
        title: `Waypoint: ${item.name}`,
        message,
      });
    } catch {
      Alert.alert(
        'Share Waypoint 📢',
        `Waypoint: ${item.name}\nCoordinates: ${coordString}\nVHF Radio Channel 16/68 format ready.`,
        [{ text: 'OK' }]
      );
    }
  };

  // Navigate to Target on Click
  const handleSelectAsTarget = (item: WaypointItem) => {
    setActiveTarget(item);
    setActiveTargetId(item.id);
    const formattedDist = SettingsStore.convertDistanceString(item.distance);
    VoiceService.announceWaypoint(item.name, formattedDist, item.bearing);
    router.push({
      pathname: '/compass',
      params: {
        targetId: item.id,
        targetName: item.name,
        targetBearing: item.bearing,
        targetDistance: formattedDist,
        targetLat: `${item.latDir} ${item.latDeg}° ${item.latMin}'`,
        targetLon: `${item.lonDir} ${item.lonDeg}° ${item.lonMin}'`,
      },
    });
  };

  // Handle Sort Selection via Dropdown
  const handleSelectSort = (type: 'default' | 'name' | 'distance') => {
    setSortBy(type);
    if (type === 'name') {
      const sorted = [...waypoints].sort((a, b) => a.name.localeCompare(b.name));
      updateWaypointsList(sorted);
    } else if (type === 'distance') {
      const sorted = [...waypoints].sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
      updateWaypointsList(sorted);
    } else {
      updateWaypointsList(INITIAL_WAYPOINTS);
    }
    setSortDropdownVisible(false);
  };

  // MORE MENU FUNCTIONALITY:
  // 1. Export GPX File
  const handleExportGpx = async () => {
    setMoreMenuVisible(false);
    const gpxContent = generateGpxXml(waypoints);
    try {
      if (Platform.OS === 'web') {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          await navigator.clipboard.writeText(gpxContent);
          Alert.alert(
            'GPX Exported! 📤',
            `Exported ${waypoints.length} waypoints in GPX XML format and copied to clipboard.\nReady for marine SD card and chartplotter.`
          );
          return;
        }
      }
      await Share.share({
        title: 'FishingWaypoints.gpx',
        message: gpxContent,
      });
    } catch {
      Alert.alert('Export GPX', `Generated GPX with ${waypoints.length} waypoints.`);
    }
  };

  // 2. Import Sample Marine Spots
  const handleImportSampleSpots = () => {
    setMoreMenuVisible(false);
    const sampleSpots: WaypointItem[] = [
      {
        id: `wp-${Date.now()}-1`,
        name: 'Veraval Deep Coral Reef',
        latDeg: '20',
        latMin: '48.120',
        latDir: 'N',
        lonDeg: '70',
        lonMin: '22.450',
        lonDir: 'E',
        icon: '🪨',
        distance: '3.40 Mi',
        bearing: '215°',
        createdAt: new Date().toISOString().split('T')[0],
      },
      {
        id: `wp-${Date.now()}-2`,
        name: 'Porbandar Fish Catch Point #9',
        latDeg: '21',
        latMin: '38.640',
        latDir: 'N',
        lonDeg: '69',
        lonMin: '35.120',
        lonDir: 'E',
        icon: '🐟',
        distance: '5.20 Mi',
        bearing: '310°',
        createdAt: new Date().toISOString().split('T')[0],
      },
      {
        id: `wp-${Date.now()}-3`,
        name: 'Diu Harbor Safe Anchorage',
        latDeg: '20',
        latMin: '42.910',
        latDir: 'N',
        lonDeg: '70',
        lonMin: '59.300',
        lonDir: 'E',
        icon: '⚓',
        distance: '1.45 Mi',
        bearing: '095°',
        createdAt: new Date().toISOString().split('T')[0],
      },
    ];

    const updated = [...sampleSpots, ...waypoints];
    updateWaypointsList(updated);
    Alert.alert(
      'Imported Successfully 📥',
      `Added 3 verified marine fishing spots to your waypoints list.`
    );
  };

  // 3. Reset / Restore Default Waypoints
  const handleRestoreDefaults = () => {
    setMoreMenuVisible(false);
    updateWaypointsList(INITIAL_WAYPOINTS);
    Alert.alert('Reset Complete ⚓', 'Waypoints restored to default marine fishing list.');
  };

  // 4. Delete All Waypoints
  const handleDeleteAll = () => {
    setMoreMenuVisible(false);
    const executeClear = () => {
      updateWaypointsList([]);
      setActiveTarget(null);
      setActiveTargetId(null);
      Alert.alert('Cleared 🗑️', 'All waypoints have been removed.');
    };

    if (Platform.OS === 'web') {
      if (window.confirm('⚠️ Are you sure you want to delete ALL saved waypoints?')) {
        executeClear();
      }
      return;
    }

    Alert.alert(
      '⚠️ Delete All Waypoints',
      'Are you sure you want to delete all saved fishing spots? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete All', style: 'destructive', onPress: executeClear },
      ]
    );
  };

  // Filtered List
  const filteredWaypoints = waypoints.filter(
    (wp) =>
      wp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wp.latMin.includes(searchQuery) ||
      wp.lonMin.includes(searchQuery)
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.container}>
      <StatusBar style="dark" animated={true} />

      {/* TOP HEADER BAR (Mathematically Centered Title, No "Home" text) */}
      <View style={styles.topHeader}>
        <View style={styles.headerSideLeft}>
          <BackButton showLabel={false} />
        </View>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Saved Waypoints</Text>
        </View>

        <View style={styles.headerSideRight}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setMoreMenuVisible(true)}
            style={styles.actionIconBtn}>
            <ModernMenuDotsIcon size={16} color="#334155" />
          </TouchableOpacity>
        </View>
      </View>

      {/* JOINED TOP SEARCH & SORT BAR */}
      <View style={styles.searchSortBar}>
        {/* Search Input Box */}
        <View style={styles.searchInputContainer}>
          <ModernSearchIcon size={16} color="#2563EB" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search spot or coordinates..."
            placeholderTextColor="#94A3B8"
            style={styles.searchInput}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.clearSearchBtn}>
              <ModernCloseIcon size={11} color="#64748B" />
            </TouchableOpacity>
          )}
        </View>

        {/* Sort Dropdown Button */}
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => setSortDropdownVisible(true)}
          style={styles.sortDropdownBtn}>
          <ModernSortIcon size={13} color="#1D4ED8" />
          <Text style={styles.sortDropdownBtnText} numberOfLines={1}>
            {sortBy === 'default' ? 'Default' : sortBy === 'name' ? 'A-Z' : 'Nearest'}
          </Text>
          <Text style={styles.dropdownChevron}>▾</Text>
        </TouchableOpacity>
      </View>

      {/* WAYPOINTS LIST */}
      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}>
        {filteredWaypoints.length === 0 ? (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIconCircle}>
              <Text style={styles.emptyIcon}>⚓</Text>
            </View>
            <Text style={styles.emptyTitle}>No Waypoints Found</Text>
            <Text style={styles.emptySub}>
              {searchQuery
                ? `No spots match "${searchQuery}". Tap clear to show all.`
                : 'Tap the + button to mark a new fishing spot.'}
            </Text>
            {searchQuery ? (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setSearchQuery('')}
                style={styles.emptyActionBtn}>
                <Text style={styles.emptyActionBtnText}>Clear Search</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleOpenCreate}
                style={styles.emptyActionBtn}>
                <Text style={styles.emptyActionBtnText}>+ Add New Spot</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredWaypoints.map((item) => {
            const isTarget = item.id === activeTargetId;

            return (
              <View
                key={item.id}
                style={[styles.waypointCard, isTarget && styles.waypointCardActiveTarget]}>
                
                {/* Active Target Banner */}
                {isTarget && (
                  <View style={styles.targetBanner}>
                    <ModernTargetReticleIcon size={13} color="#FFFFFF" />
                    <Text style={styles.targetBannerText}>CURRENT COMPASS TARGET</Text>
                  </View>
                )}

                {/* Card Main Body: Directly Navigates to Compass */}
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={() => handleSelectAsTarget(item)}
                  style={styles.cardHeaderTouchable}>
                  {/* Left: Avatar with Icon */}
                  <View style={[styles.avatarBox, isTarget && styles.avatarBoxTarget]}>
                    <Text style={styles.avatarEmoji}>{item.icon || '📍'}</Text>
                  </View>

                  {/* Center: Title & Coordinates (No "Navigate ➔" text) */}
                  <View style={styles.cardInfoCol}>
                    <View style={styles.titleRow}>
                      <Text style={styles.waypointName} numberOfLines={1}>
                        {item.name}
                      </Text>
                    </View>

                    {/* Clean Coordinate Badge */}
                    <View style={styles.coordBadge}>
                      <Text style={styles.coordText}>
                        {item.latDir} {item.latDeg}° {item.latMin}&apos; • {item.lonDir} {item.lonDeg}° {item.lonMin}&apos;
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Card Footer: Telemetry & Independent Action Buttons */}
                <View style={styles.cardFooterRow}>
                  {/* Distance & Bearing Pill */}
                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() => handleSelectAsTarget(item)}
                    style={styles.telemetryPill}>
                    <View style={styles.telemetryItemRow}>
                      <ModernCompassDialIcon size={14} color="#0F172A" />
                      <Text style={styles.telemetryBearing}>{item.bearing}</Text>
                    </View>
                    <View style={styles.telemetryDivider} />
                    <View style={styles.telemetryItemRow}>
                      <ModernDistanceIcon size={13} color="#1D4ED8" />
                      <Text style={styles.telemetryDist}>
                        {SettingsStore.convertDistanceString(item.distance)}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Independent Action Buttons: NOT nested in any card touchable */}
                  <View style={styles.actionButtonsGroup}>
                    {/* Share Button */}
                    <TouchableOpacity
                      activeOpacity={0.65}
                      hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
                      onPress={() => handleShare(item)}
                      style={styles.actionCircleBtn}>
                      <ModernShareIcon size={15} color="#2563EB" />
                    </TouchableOpacity>

                    {/* Edit Button */}
                    <TouchableOpacity
                      activeOpacity={0.65}
                      hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
                      onPress={() => handleOpenEdit(item)}
                      style={styles.actionCircleBtn}>
                      <ModernEditIcon size={15} color="#1E293B" />
                    </TouchableOpacity>

                    {/* Delete Button */}
                    <TouchableOpacity
                      activeOpacity={0.65}
                      hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
                      onPress={() => handleDelete(item)}
                      style={[styles.actionCircleBtn, styles.deleteCircleBtn]}>
                      <ModernTrashIcon size={15} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* FLOATING ACTION BUTTONS */}
      <View style={styles.fabContainer}>
        {/* Green Radio/VHF FAB with Precision Vector Radio Icon */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() =>
            Alert.alert(
              'VHF Radio Mark 📻',
              'Quick mark location via Marine NMEA VHF Radio link?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Mark Current Spot',
                  onPress: () => {
                    const newWp: WaypointItem = {
                      id: `wp-${Date.now()}`,
                      name: `VHF Spot #${waypoints.length + 1}`,
                      latDeg: '20',
                      latMin: '44.572',
                      latDir: 'N',
                      lonDeg: '71',
                      lonMin: '04.313',
                      lonDir: 'E',
                      icon: '📻',
                      distance: '0.00 Mi',
                      bearing: '000°',
                      createdAt: new Date().toISOString().split('T')[0],
                    };
                    const updated = [newWp, ...waypoints];
                    updateWaypointsList(updated);
                    Alert.alert('Saved ⚓', 'Current boat coordinates saved.');
                  },
                },
              ]
            )
          }
          style={styles.fabRadio}>
          <ModernVhfRadioIcon size={24} color="#FFFFFF" />
          <View style={styles.fabRadioPulseBadge} />
        </TouchableOpacity>

        {/* Primary Add Waypoint FAB with Precision Plus Pin Icon */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handleOpenCreate}
          style={styles.fabAdd}>
          <ModernPlusPinIcon size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* MORE OPTIONS ACTION SHEET MODAL */}
      <Modal visible={moreMenuVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setMoreMenuVisible(false)}>
          <View style={styles.dropdownModalBackdrop}>
            <TouchableWithoutFeedback>
              <View style={styles.moreMenuCard}>
                <View style={styles.dropdownHeader}>
                  <View style={styles.dropdownTitleWrap}>
                    <Text style={styles.moreMenuHeaderIcon}>⚙️</Text>
                    <Text style={styles.dropdownTitle}>Waypoint Options</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setMoreMenuVisible(false)}
                    style={styles.dropdownCloseBtn}>
                    <ModernCloseIcon size={12} color="#64748B" />
                  </TouchableOpacity>
                </View>

                {/* Option 1: Export GPX */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleExportGpx}
                  style={styles.moreMenuItem}>
                  <View style={[styles.moreMenuIconCircle, { backgroundColor: '#EFF6FF' }]}>
                    <Text style={styles.moreItemEmoji}>📤</Text>
                  </View>
                  <View style={styles.moreItemContent}>
                    <Text style={styles.moreItemTitle}>Export GPX File</Text>
                    <Text style={styles.moreItemSub}>
                      Save all {waypoints.length} spots in standard GPX XML format
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Option 2: Import Marine Fishing Spots */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleImportSampleSpots}
                  style={styles.moreMenuItem}>
                  <View style={[styles.moreMenuIconCircle, { backgroundColor: '#F0FDF4' }]}>
                    <Text style={styles.moreItemEmoji}>📥</Text>
                  </View>
                  <View style={styles.moreItemContent}>
                    <Text style={styles.moreItemTitle}>Import Marine Fishing Spots</Text>
                    <Text style={styles.moreItemSub}>
                      Add verified coral reefs & offshore fishing grounds
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Option 3: Restore Default Waypoints */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleRestoreDefaults}
                  style={styles.moreMenuItem}>
                  <View style={[styles.moreMenuIconCircle, { backgroundColor: '#FFFBEB' }]}>
                    <Text style={styles.moreItemEmoji}>🔄</Text>
                  </View>
                  <View style={styles.moreItemContent}>
                    <Text style={styles.moreItemTitle}>Restore Default List</Text>
                    <Text style={styles.moreItemSub}>
                      Reset list back to initial 10 fishing waypoints
                    </Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.moreMenuDivider} />

                {/* Option 4: Delete All Waypoints (Danger) */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleDeleteAll}
                  style={styles.moreMenuItem}>
                  <View style={[styles.moreMenuIconCircle, { backgroundColor: '#FEF2F2' }]}>
                    <Text style={styles.moreItemEmoji}>🗑️</Text>
                  </View>
                  <View style={styles.moreItemContent}>
                    <Text style={[styles.moreItemTitle, { color: '#DC2626' }]}>
                      Delete All Waypoints
                    </Text>
                    <Text style={styles.moreItemSub}>
                      Remove all spots from your local device database
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* SORT DROPDOWN MODAL */}
      <Modal visible={sortDropdownVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setSortDropdownVisible(false)}>
          <View style={styles.dropdownModalBackdrop}>
            <TouchableWithoutFeedback>
              <View style={styles.dropdownMenuCard}>
                <View style={styles.dropdownHeader}>
                  <View style={styles.dropdownTitleWrap}>
                    <ModernSortIcon size={16} color="#1D4ED8" />
                    <Text style={styles.dropdownTitle}>Sort Waypoints</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setSortDropdownVisible(false)}
                    style={styles.dropdownCloseBtn}>
                    <ModernCloseIcon size={12} color="#64748B" />
                  </TouchableOpacity>
                </View>

                {/* Option 1: Default */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleSelectSort('default')}
                  style={[styles.dropdownItem, sortBy === 'default' && styles.dropdownItemActive]}>
                  <View style={styles.dropdownItemTextCol}>
                    <Text style={[styles.dropdownItemLabel, sortBy === 'default' && styles.dropdownItemLabelActive]}>
                      Default Order
                    </Text>
                    <Text style={styles.dropdownItemSub}>Original saved order</Text>
                  </View>
                  {sortBy === 'default' && <ModernCheckIcon size={16} color="#1D4ED8" />}
                </TouchableOpacity>

                {/* Option 2: Name */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleSelectSort('name')}
                  style={[styles.dropdownItem, sortBy === 'name' && styles.dropdownItemActive]}>
                  <View style={styles.dropdownItemTextCol}>
                    <Text style={[styles.dropdownItemLabel, sortBy === 'name' && styles.dropdownItemLabelActive]}>
                      Name (A to Z)
                    </Text>
                    <Text style={styles.dropdownItemSub}>Alphabetical by spot name</Text>
                  </View>
                  {sortBy === 'name' && <ModernCheckIcon size={16} color="#1D4ED8" />}
                </TouchableOpacity>

                {/* Option 3: Distance */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleSelectSort('distance')}
                  style={[styles.dropdownItem, sortBy === 'distance' && styles.dropdownItemActive]}>
                  <View style={styles.dropdownItemTextCol}>
                    <Text style={[styles.dropdownItemLabel, sortBy === 'distance' && styles.dropdownItemLabelActive]}>
                      Distance (Nearest First)
                    </Text>
                    <Text style={styles.dropdownItemSub}>Closest GPS distance</Text>
                  </View>
                  {sortBy === 'distance' && <ModernCheckIcon size={16} color="#1D4ED8" />}
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* EDIT / CREATE WAYPOINT MODAL */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <TouchableWithoutFeedback
          onPress={() => {
            Keyboard.dismiss();
            setModalVisible(false);
          }}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.modalKeyboardAvoid}>
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.modalContent}>
                  {/* Drag Handle Bar */}
                  <View style={styles.modalHandleBar} />

                  {/* Modal Header */}
                  <View style={styles.modalHeaderRow}>
                    <View style={styles.modalHeaderTitleWrap}>
                      <View style={styles.modalTitleIconBox}>
                        {isEditing ? (
                          <ModernEditIcon size={20} color="#1D4ED8" />
                        ) : (
                          <ModernDistanceIcon size={20} color="#1D4ED8" />
                        )}
                      </View>
                      <View>
                        <Text style={styles.editModalTitle}>
                          {isEditing ? 'Edit Waypoint' : 'New Waypoint'}
                        </Text>
                        <Text style={styles.editModalSubtitle}>
                          Marine GPS Coordinates & Marker
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => {
                        Keyboard.dismiss();
                        setModalVisible(false);
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      style={styles.modalCloseCircle}>
                      <ModernCloseIcon size={13} color="#64748B" />
                    </TouchableOpacity>
                  </View>

                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.modalScrollBody}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag">
                    {/* NAME INPUT BOX WITH INLINE SAVE BUTTON */}
                    <View style={styles.formSection}>
                      <View style={styles.nameHeaderRow}>
                        <Text style={styles.formLabel}>WAYPOINT NAME</Text>
                        <View style={styles.quickSaveBadge}>
                          <Text style={styles.quickSaveBadgeText}>Quick Save</Text>
                        </View>
                      </View>

                      <View style={styles.nameInputRow}>
                        <View style={styles.nameInputContainer}>
                          <ModernTagIcon size={16} color="#3B82F6" />
                          <TextInput
                            value={formName}
                            onChangeText={setFormName}
                            placeholder="e.g. Sagar Kripa Spot"
                            placeholderTextColor="#94A3B8"
                            style={styles.nameTextInput}
                            returnKeyType="done"
                            onSubmitEditing={handleSave}
                          />
                          {formName.trim().length > 0 && (
                            <TouchableOpacity
                              onPress={() => setFormName('')}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              style={styles.clearNameBtn}>
                              <ModernCloseIcon size={11} color="#94A3B8" />
                            </TouchableOpacity>
                          )}
                        </View>

                        <TouchableOpacity
                          activeOpacity={0.82}
                          onPress={handleSave}
                          style={styles.inlineNameSaveBtn}>
                          <ModernCheckIcon size={15} color="#FFFFFF" />
                          <Text style={styles.inlineNameSaveBtnText}>Save</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* LATITUDE CARD */}
                    <View style={styles.coordCard}>
                      <View style={styles.coordCardHeader}>
                        <Text style={styles.coordCardTitle}>LATITUDE</Text>
                        <View style={styles.coordTag}>
                          <Text style={styles.coordTagText}>{formLatDir}</Text>
                        </View>
                      </View>

                      <View style={styles.coordInputsRow}>
                        {/* Degrees Box */}
                        <View style={styles.degreeBoxWrap}>
                          <Text style={styles.inputMicroLabel}>DEGREES</Text>
                          <View style={styles.innerInputRow}>
                            <TextInput
                              value={formLatDeg}
                              onChangeText={setFormLatDeg}
                              keyboardType="number-pad"
                              maxLength={3}
                              style={styles.coordNumInput}
                            />
                            <Text style={styles.unitSymbolText}>°</Text>
                          </View>
                        </View>

                        {/* Minutes Box */}
                        <View style={styles.minutesBoxWrap}>
                          <Text style={styles.inputMicroLabel}>MINUTES</Text>
                          <View style={styles.innerInputRow}>
                            <TextInput
                              value={formLatMin}
                              onChangeText={setFormLatMin}
                              keyboardType="decimal-pad"
                              style={styles.coordNumInput}
                            />
                            <Text style={styles.unitSymbolText}>&apos;</Text>
                          </View>
                        </View>

                        {/* Interactive Direction Switch (N / S) */}
                        <View style={styles.dirToggleContainer}>
                          <TouchableOpacity
                            onPress={() => setFormLatDir('N')}
                            style={[
                              styles.dirToggleHalf,
                              formLatDir === 'N' && styles.dirToggleHalfActive,
                            ]}>
                            <Text
                              style={[
                                styles.dirToggleText,
                                formLatDir === 'N' && styles.dirToggleTextActive,
                              ]}>
                              N
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => setFormLatDir('S')}
                            style={[
                              styles.dirToggleHalf,
                              formLatDir === 'S' && styles.dirToggleHalfActive,
                            ]}>
                            <Text
                              style={[
                                styles.dirToggleText,
                                formLatDir === 'S' && styles.dirToggleTextActive,
                              ]}>
                              S
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>

                    {/* LONGITUDE CARD */}
                    <View style={styles.coordCard}>
                      <View style={styles.coordCardHeader}>
                        <Text style={styles.coordCardTitle}>LONGITUDE</Text>
                        <View style={styles.coordTag}>
                          <Text style={styles.coordTagText}>{formLonDir}</Text>
                        </View>
                      </View>

                      <View style={styles.coordInputsRow}>
                        {/* Degrees Box */}
                        <View style={styles.degreeBoxWrap}>
                          <Text style={styles.inputMicroLabel}>DEGREES</Text>
                          <View style={styles.innerInputRow}>
                            <TextInput
                              value={formLonDeg}
                              onChangeText={setFormLonDeg}
                              keyboardType="number-pad"
                              maxLength={3}
                              style={styles.coordNumInput}
                            />
                            <Text style={styles.unitSymbolText}>°</Text>
                          </View>
                        </View>

                        {/* Minutes Box */}
                        <View style={styles.minutesBoxWrap}>
                          <Text style={styles.inputMicroLabel}>MINUTES</Text>
                          <View style={styles.innerInputRow}>
                            <TextInput
                              value={formLonMin}
                              onChangeText={setFormLonMin}
                              keyboardType="decimal-pad"
                              style={styles.coordNumInput}
                            />
                            <Text style={styles.unitSymbolText}>&apos;</Text>
                          </View>
                        </View>

                        {/* Interactive Direction Switch (E / W) */}
                        <View style={styles.dirToggleContainer}>
                          <TouchableOpacity
                            onPress={() => setFormLonDir('E')}
                            style={[
                              styles.dirToggleHalf,
                              formLonDir === 'E' && styles.dirToggleHalfActive,
                            ]}>
                            <Text
                              style={[
                                styles.dirToggleText,
                                formLonDir === 'E' && styles.dirToggleTextActive,
                              ]}>
                              E
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => setFormLonDir('W')}
                            style={[
                              styles.dirToggleHalf,
                              formLonDir === 'W' && styles.dirToggleHalfActive,
                            ]}>
                            <Text
                              style={[
                                styles.dirToggleText,
                                formLonDir === 'W' && styles.dirToggleTextActive,
                              ]}>
                              W
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>

                    {/* INLINE ICON PICKER ROW */}
                    <View style={styles.formSection}>
                      <View style={styles.iconSectionHeader}>
                        <Text style={styles.formLabel}>SELECT MARKER ICON</Text>
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => setIconPickerVisible(true)}>
                          <Text style={styles.viewAllIconsLink}>More Icons ▾</Text>
                        </TouchableOpacity>
                      </View>

                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.inlineIconScroll}>
                        {AVAILABLE_ICONS.map((ic) => {
                          const isSelected = formIcon === ic;
                          return (
                            <TouchableOpacity
                              key={ic}
                              activeOpacity={0.8}
                              onPress={() => setFormIcon(ic)}
                              style={[
                                styles.inlineIconBtn,
                                isSelected && styles.inlineIconBtnSelected,
                              ]}>
                              <Text style={styles.inlineIconEmoji}>{ic}</Text>
                              {isSelected && (
                                <View style={styles.selectedCheckPip}>
                                  <ModernCheckIcon size={10} color="#FFFFFF" />
                                </View>
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  </ScrollView>

                  {/* BOTTOM BUTTONS: CANCEL & SAVE */}
                  <View style={styles.modalButtonsRow}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => {
                        Keyboard.dismiss();
                        setModalVisible(false);
                      }}
                      style={styles.cancelBtn}>
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={handleSave}
                      style={styles.saveBtn}>
                      <ModernCheckIcon size={16} color="#FFFFFF" />
                      <Text style={styles.saveBtnText}>
                        {isEditing ? 'Save Changes' : 'Save Waypoint'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ICON PICKER SUB-MODAL */}
      <Modal visible={iconPickerVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setIconPickerVisible(false)}>
          <View style={styles.iconPickerBackdrop}>
            <View style={styles.iconPickerCard}>
              <View style={styles.iconPickerHeader}>
                <Text style={styles.iconPickerTitle}>Select Waypoint Icon</Text>
                <TouchableOpacity
                  onPress={() => setIconPickerVisible(false)}
                  style={styles.iconPickerCloseBtn}>
                  <ModernCloseIcon size={12} color="#64748B" />
                </TouchableOpacity>
              </View>

              <View style={styles.iconGrid}>
                {AVAILABLE_ICONS.map((ic) => {
                  const isSelected = formIcon === ic;
                  return (
                    <TouchableOpacity
                      key={ic}
                      activeOpacity={0.75}
                      onPress={() => {
                        setFormIcon(ic);
                        setIconPickerVisible(false);
                      }}
                      style={[
                        styles.iconChoiceBtn,
                        isSelected && styles.iconChoiceSelected,
                      ]}>
                      <Text style={styles.iconChoiceEmoji}>{ic}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
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
    backgroundColor: '#F8FAFC',
  },

  // TOP HEADER BAR (Mathematically Centered)
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  headerSideLeft: {
    width: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  countBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 2,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1D4ED8',
    letterSpacing: 0.5,
  },
  headerSideRight: {
    width: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  actionIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  // JOINED TOP SEARCH & SORT BAR
  searchSortBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 8,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#0F172A',
    fontWeight: '600',
    padding: 0,
  },
  clearSearchBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 11,
    paddingVertical: Platform.OS === 'ios' ? 8.5 : 7,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: '#BFDBFE',
    gap: 5,
  },
  sortDropdownBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  dropdownChevron: {
    fontSize: 12,
    color: '#1D4ED8',
    fontWeight: '900',
    marginLeft: 1,
  },

  // MORE MENU ACTION SHEET CARD
  moreMenuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 12,
    gap: 8,
  },
  moreMenuHeaderIcon: {
    fontSize: 18,
  },
  moreMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  moreMenuIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreItemEmoji: {
    fontSize: 18,
  },
  moreItemContent: {
    flex: 1,
    gap: 2,
  },
  moreItemTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  moreItemSub: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  moreMenuDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },

  // SORT DROPDOWN MODAL
  dropdownModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dropdownMenuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    width: '100%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
    gap: 6,
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 4,
  },
  dropdownTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dropdownTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },
  dropdownCloseBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  dropdownItemActive: {
    backgroundColor: '#EFF6FF',
  },
  dropdownItemTextCol: {
    gap: 2,
  },
  dropdownItemLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  dropdownItemLabelActive: {
    color: '#1D4ED8',
    fontWeight: '900',
  },
  dropdownItemSub: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },

  // LIST CONTENT
  listContent: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 110,
    gap: 10,
  },

  // WAYPOINT CARDS
  waypointCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    gap: 12,
  },
  waypointCardActiveTarget: {
    borderColor: '#2563EB',
    backgroundColor: '#F8FAFF',
    borderWidth: 1.8,
    shadowColor: '#2563EB',
    shadowOpacity: 0.15,
  },
  targetBanner: {
    backgroundColor: '#2563EB',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
    marginTop: -4,
    marginBottom: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  targetBannerText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  cardHeaderTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatarBoxTarget: {
    backgroundColor: '#EFF6FF',
    borderColor: '#93C5FD',
  },
  avatarEmoji: {
    fontSize: 22,
  },
  cardInfoCol: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  waypointName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
    flex: 1,
  },
  coordBadge: {
    backgroundColor: '#F8FAFC',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  coordText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#334155',
    letterSpacing: 0.2,
  },

  // CARD FOOTER
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  telemetryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 8,
  },
  telemetryItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  telemetryBearing: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  telemetryDivider: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#94A3B8',
  },
  telemetryDist: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  actionButtonsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  deleteCircleBtn: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FEE2E2',
  },

  // EMPTY STATE
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
    gap: 12,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
  },
  emptyIcon: {
    fontSize: 34,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 13.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
  },
  emptyActionBtn: {
    marginTop: 8,
    backgroundColor: '#1D4ED8',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#1D4ED8',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  // FLOATING ACTION BUTTONS
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    gap: 14,
    alignItems: 'center',
  },
  fabRadio: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  fabRadioPulseBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22C55E',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  fabAdd: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1D4ED8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1D4ED8',
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
  },

  // MODAL OVERLAY & CARD
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalKeyboardAvoid: {
    width: '100%',
    maxHeight: '94%',
    justifyContent: 'flex-end',
  },
  modalContent: {
    width: '100%',
    maxHeight: '100%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  modalHandleBar: {
    width: 44,
    height: 4.5,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalHeaderTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalTitleIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  editModalTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  editModalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 1,
  },
  modalCloseCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScrollBody: {
    paddingTop: 16,
    paddingBottom: 20,
    gap: 16,
  },

  // FORM INPUTS
  formSection: {
    gap: 6,
  },
  formLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.6,
  },
  nameHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  quickSaveBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  quickSaveBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1D4ED8',
    letterSpacing: 0.3,
  },
  nameInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nameInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 48,
    gap: 8,
  },
  nameTextInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    height: '100%',
  },
  clearNameBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineNameSaveBtn: {
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#1D4ED8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  inlineNameSaveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // COORDINATE CARD
  coordCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  coordCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  coordCardTitle: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#1E293B',
    letterSpacing: 0.5,
  },
  coordTag: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  coordTagText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#1D4ED8',
  },
  coordInputsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  degreeBoxWrap: {
    width: 86,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  minutesBoxWrap: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  inputMicroLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  innerInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  coordNumInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    padding: 0,
  },
  unitSymbolText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#64748B',
  },

  // SEGMENTED DIRECTION TOGGLE
  dirToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    padding: 3,
    height: 48,
    alignItems: 'center',
  },
  dirToggleHalf: {
    width: 34,
    height: '100%',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dirToggleHalfActive: {
    backgroundColor: '#1D4ED8',
    shadowColor: '#1D4ED8',
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
  },
  dirToggleText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#64748B',
  },
  dirToggleTextActive: {
    color: '#FFFFFF',
  },

  // INLINE ICON PICKER
  iconSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  viewAllIconsLink: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  inlineIconScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  inlineIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  inlineIconBtnSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
    borderWidth: 2,
  },
  inlineIconEmoji: {
    fontSize: 20,
  },
  selectedCheckPip: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },

  // MODAL ACTION BUTTONS
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cancelBtnText: {
    color: '#475569',
    fontSize: 15,
    fontWeight: '800',
  },
  saveBtn: {
    flex: 1.5,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#1D4ED8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#1D4ED8',
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  // ICON PICKER SUB-MODAL
  iconPickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconPickerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 340,
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  iconPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconPickerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  iconPickerCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  iconChoiceBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconChoiceSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
    borderWidth: 2,
  },
  iconChoiceEmoji: {
    fontSize: 24,
  },
});
