import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
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
  getWaypoints,
  setActiveTarget,
  setGlobalWaypoints,
} from '@/services/waypointStore';
import { VoiceService } from '@/services/voiceService';

export default function WaypointsScreen() {
  const router = useRouter();

  // State
  const [waypoints, setWaypoints] = useState<WaypointItem[]>(INITIAL_WAYPOINTS);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'default' | 'name' | 'distance'>('default');

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

  // Delete Handler
  const handleDelete = (item: WaypointItem) => {
    Alert.alert(
      'Delete Waypoint? 🗑️',
      `Are you sure you want to delete "${item.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setWaypoints((prev) => prev.filter((wp) => wp.id !== item.id));
          },
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
      setWaypoints((prev) =>
        prev.map((wp) =>
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
        )
      );
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
      setWaypoints((prev) => [newWp, ...prev]);
      Alert.alert('Saved ⚓', `Waypoint "${formName}" created successfully.`);
    }

    setModalVisible(false);
  };

  // Share Waypoint
  const handleShare = (item: WaypointItem) => {
    const coordString = `${item.latDir} ${item.latDeg}° ${item.latMin}', ${item.lonDir} ${item.lonDeg}° ${item.lonMin}'`;
    Alert.alert(
      'Share Waypoint 📢',
      `Waypoint: ${item.name}\nCoordinates: ${coordString}\nVHF Radio Channel 16/68 format ready.`,
      [{ text: 'Copy Coordinates' }, { text: 'Done' }]
    );
  };

  // Navigate to Target on Click
  const handleSelectAsTarget = (item: WaypointItem) => {
    setActiveTarget(item);
    VoiceService.announceWaypoint(item.name, item.distance, item.bearing);
    router.push({
      pathname: '/compass',
      params: {
        targetId: item.id,
        targetName: item.name,
        targetBearing: item.bearing,
        targetDistance: item.distance,
        targetLat: `${item.latDir} ${item.latDeg}° ${item.latMin}'`,
        targetLon: `${item.lonDir} ${item.lonDeg}° ${item.lonMin}'`,
      },
    });
  };

  // Cycle Sort
  const handleCycleSort = () => {
    if (sortBy === 'default') {
      setSortBy('name');
      setWaypoints((prev) => [...prev].sort((a, b) => a.name.localeCompare(b.name)));
    } else if (sortBy === 'name') {
      setSortBy('distance');
      setWaypoints((prev) =>
        [...prev].sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance))
      );
    } else {
      setSortBy('default');
      setWaypoints(INITIAL_WAYPOINTS);
    }
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
      <StatusBar style="dark" />

      {/* TOP HEADER BAR (Matching Screenshot) */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          style={styles.backBtn}>
          <Text style={styles.backArrow}>‹</Text>
          <Text style={styles.backText}>Home</Text>
        </TouchableOpacity>

        {/* Sort by Button */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleCycleSort}
          style={styles.sortBtn}>
          <View style={styles.checkboxBox} />
          <Text style={styles.sortText}>
            Sort by {sortBy !== 'default' ? `(${sortBy})` : ''}
          </Text>
        </TouchableOpacity>

        {/* Title */}
        <Text style={styles.headerTitle}>Saved Waypoints</Text>

        {/* Search Icon & Menu */}
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => setIsSearching(!isSearching)}
            style={styles.actionIconBtn}>
            <Text style={styles.actionIconText}>🔍</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() =>
              Alert.alert('Waypoint Options', '', [
                { text: 'Export GPX to SD Card' },
                { text: 'Import GPX file' },
                { text: 'Cancel', style: 'cancel' },
              ])
            }
            style={styles.actionIconBtn}>
            <Text style={styles.actionIconText}>⋮</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* SEARCH BAR (Expandable) */}
      {isSearching && (
        <View style={styles.searchBarWrap}>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by name or coordinates..."
            placeholderTextColor="#90A4AE"
            style={styles.searchInput}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
              <Text style={styles.clearSearchText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* WAYPOINTS LIST */}
      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}>
        {filteredWaypoints.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyIcon}>🚩</Text>
            <Text style={styles.emptyTitle}>No Waypoints Found</Text>
            <Text style={styles.emptySub}>Tap the + button to mark a new fishing spot.</Text>
          </View>
        ) : (
          filteredWaypoints.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.85}
              onPress={() => handleSelectAsTarget(item)}
              style={styles.waypointCard}>
              {/* Left Column: Icon, Name & Coordinates */}
              <View style={styles.cardLeftCol}>
                <View style={styles.nameRow}>
                  <Text style={styles.pinEmoji}>{item.icon || '📍'}</Text>
                  <Text style={styles.waypointName} numberOfLines={1}>
                    {item.name}
                  </Text>
                </View>
                <Text style={styles.coordText}>
                  {item.latDir} {item.latDeg}° {item.latMin}&apos; {item.lonDir} {item.lonDeg}° {item.lonMin}&apos;
                </Text>
              </View>

              {/* Right Column: Actions (Share, Edit, Delete) & Distance/Bearing */}
              <View style={styles.cardRightCol}>
                <View style={styles.actionIconsRow}>
                  <TouchableOpacity
                    onPress={() => handleShare(item)}
                    style={styles.itemActionBtn}>
                    <Text style={styles.shareIconText}>🔗</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleOpenEdit(item)}
                    style={styles.itemActionBtn}>
                    <Text style={styles.editIconText}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDelete(item)}
                    style={styles.itemActionBtn}>
                    <Text style={styles.trashIconText}>🗑️</Text>
                  </TouchableOpacity>
                </View>

                {/* Distance & Bearing */}
                <Text style={styles.distBearingText}>
                  {item.distance} | {item.bearing}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* FLOATING ACTION BUTTONS (Matching Image 3) */}
      <View style={styles.fabContainer}>
        {/* Green Radio/VHF FAB */}
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
                    setWaypoints([newWp, ...waypoints]);
                    Alert.alert('Saved ⚓', 'Current boat coordinates saved.');
                  },
                },
              ]
            )
          }
          style={styles.fabRadio}>
          <Text style={styles.fabRadioIcon}>📻</Text>
        </TouchableOpacity>

        {/* Purple/Blue Location Pin + FAB */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleOpenCreate}
          style={styles.fabAdd}>
          <Text style={styles.fabAddIcon}>📍</Text>
        </TouchableOpacity>
      </View>

      {/* EDIT / CREATE WAYPOINT MODAL (Exact layout from Image 4) */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <Text style={styles.editModalTitle}>
                  {isEditing ? 'Edit Waypoint' : 'New Waypoint'}
                </Text>

                {/* NAME INPUT BOX (Floating-style label box) */}
                <View style={styles.inputWrapper}>
                  <Text style={styles.fieldFloatingLabel}>Name</Text>
                  <TextInput
                    value={formName}
                    onChangeText={setFormName}
                    placeholder="Enter waypoint name"
                    style={styles.nameTextInput}
                  />
                </View>

                {/* LATITUDE SECTION */}
                <Text style={styles.coordSectionTitle}>Latitude</Text>
                <View style={styles.coordInputsRow}>
                  {/* Degrees Box */}
                  <View style={styles.degreeBoxWrap}>
                    <Text style={styles.symbolLabel}>°</Text>
                    <TextInput
                      value={formLatDeg}
                      onChangeText={setFormLatDeg}
                      keyboardType="number-pad"
                      style={styles.degreeInput}
                    />
                  </View>

                  {/* Minutes Box */}
                  <View style={styles.minutesBoxWrap}>
                    <Text style={styles.symbolLabel}>&apos;</Text>
                    <TextInput
                      value={formLatMin}
                      onChangeText={setFormLatMin}
                      keyboardType="decimal-pad"
                      style={styles.minutesInput}
                    />
                  </View>

                  {/* Direction Box (N / S) */}
                  <TouchableOpacity
                    onPress={() => setFormLatDir(formLatDir === 'N' ? 'S' : 'N')}
                    style={styles.dirBoxWrap}>
                    <Text style={styles.dirText}>{formLatDir}</Text>
                  </TouchableOpacity>
                </View>

                {/* LONGITUDE SECTION */}
                <Text style={styles.coordSectionTitle}>Longitude</Text>
                <View style={styles.coordInputsRow}>
                  {/* Degrees Box */}
                  <View style={styles.degreeBoxWrap}>
                    <Text style={styles.symbolLabel}>°</Text>
                    <TextInput
                      value={formLonDeg}
                      onChangeText={setFormLonDeg}
                      keyboardType="number-pad"
                      style={styles.degreeInput}
                    />
                  </View>

                  {/* Minutes Box */}
                  <View style={styles.minutesBoxWrap}>
                    <Text style={styles.symbolLabel}>&apos;</Text>
                    <TextInput
                      value={formLonMin}
                      onChangeText={setFormLonMin}
                      keyboardType="decimal-pad"
                      style={styles.minutesInput}
                    />
                  </View>

                  {/* Direction Box (E / W) */}
                  <TouchableOpacity
                    onPress={() => setFormLonDir(formLonDir === 'E' ? 'W' : 'E')}
                    style={styles.dirBoxWrap}>
                    <Text style={styles.dirText}>{formLonDir}</Text>
                  </TouchableOpacity>
                </View>

                {/* ICON SECTION */}
                <View style={styles.iconSelectionRow}>
                  <Text style={styles.iconLabelText}>Icon:</Text>
                  <Text style={styles.selectedIconDisplay}>{formIcon}</Text>
                  <TouchableOpacity onPress={() => setIconPickerVisible(true)}>
                    <Text style={styles.changeIconLink}>Change</Text>
                  </TouchableOpacity>
                </View>

                {/* BOTTOM BUTTONS: CANCEL & SAVE */}
                <View style={styles.modalButtonsRow}>
                  <TouchableOpacity
                    onPress={() => setModalVisible(false)}
                    style={styles.cancelBtn}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
                    <Text style={styles.saveBtnText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ICON PICKER SUB-MODAL */}
      <Modal visible={iconPickerVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setIconPickerVisible(false)}>
          <View style={styles.iconPickerBackdrop}>
            <View style={styles.iconPickerCard}>
              <Text style={styles.iconPickerTitle}>Select Waypoint Icon</Text>
              <View style={styles.iconGrid}>
                {AVAILABLE_ICONS.map((ic) => (
                  <TouchableOpacity
                    key={ic}
                    onPress={() => {
                      setFormIcon(ic);
                      setIconPickerVisible(false);
                    }}
                    style={[
                      styles.iconChoiceBtn,
                      formIcon === ic && styles.iconChoiceSelected,
                    ]}>
                    <Text style={styles.iconChoiceEmoji}>{ic}</Text>
                  </TouchableOpacity>
                ))}
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
    backgroundColor: '#F3F4F9',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 6,
  },
  backArrow: {
    fontSize: 26,
    color: '#1E293B',
    lineHeight: 26,
  },
  backText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  checkboxBox: {
    width: 16,
    height: 16,
    borderWidth: 1.5,
    borderColor: '#475569',
    borderRadius: 2,
  },
  sortText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionIconBtn: {
    padding: 4,
  },
  actionIconText: {
    fontSize: 17,
  },
  searchBarWrap: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#0F172A',
  },
  clearSearchBtn: {
    paddingHorizontal: 8,
  },
  clearSearchText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 90,
    gap: 8,
  },
  waypointCard: {
    backgroundColor: '#E8ECF8',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardLeftCol: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pinEmoji: {
    fontSize: 14,
  },
  waypointName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
  },
  coordText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    letterSpacing: 0.3,
  },
  cardRightCol: {
    alignItems: 'flex-end',
    gap: 6,
  },
  actionIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemActionBtn: {
    padding: 3,
  },
  shareIconText: {
    fontSize: 15,
    color: '#2563EB',
  },
  editIconText: {
    fontSize: 15,
  },
  trashIconText: {
    fontSize: 15,
  },
  distBearingText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#334155',
  },
  emptySub: {
    fontSize: 14,
    color: '#64748B',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    gap: 12,
    alignItems: 'center',
  },
  fabRadio: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#00E676',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 6,
  },
  fabRadioIcon: {
    fontSize: 22,
  },
  fabAdd: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3949AB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  fabAddIcon: {
    fontSize: 26,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 22,
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  editModalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0D47A1',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  inputWrapper: {
    borderWidth: 1.5,
    borderColor: '#475569',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
    position: 'relative',
  },
  fieldFloatingLabel: {
    position: 'absolute',
    top: -9,
    left: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 4,
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  nameTextInput: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  coordSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  coordInputsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  degreeBoxWrap: {
    width: 80,
    borderWidth: 1.5,
    borderColor: '#475569',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    position: 'relative',
    height: 48,
    justifyContent: 'center',
  },
  minutesBoxWrap: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#475569',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    position: 'relative',
    height: 48,
    justifyContent: 'center',
  },
  symbolLabel: {
    position: 'absolute',
    top: -8,
    left: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 4,
    fontSize: 12,
    fontWeight: '900',
    color: '#475569',
  },
  degreeInput: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  minutesInput: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  dirBoxWrap: {
    width: 44,
    height: 48,
    backgroundColor: '#E2E8F0',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dirText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  iconSelectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  iconLabelText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  selectedIconDisplay: {
    fontSize: 18,
  },
  changeIconLink: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0D47A1',
    marginLeft: 4,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#525B76',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  saveBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0D47A1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  iconPickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconPickerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '80%',
    alignItems: 'center',
    gap: 14,
  },
  iconPickerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  iconChoiceBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconChoiceSelected: {
    backgroundColor: '#E0E7FF',
    borderWidth: 2,
    borderColor: '#4338CA',
  },
  iconChoiceEmoji: {
    fontSize: 22,
  },
});
