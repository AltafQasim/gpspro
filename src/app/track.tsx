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
import { BackButton } from '@/components/ui/back-button';

interface TrackItem {
  id: number;
  name: string;
  color: string;
  pointsCount: number;
  distanceKm: number;
  date: string;
}

const AVAILABLE_COLORS = [
  '#81C784', // Light green
  '#2196F3', // Blue
  '#F44336', // Red
  '#FFEB3B', // Yellow
  '#FF9800', // Orange
  '#9C27B0', // Purple
  '#E91E63', // Pink
  '#00BCD4', // Cyan
  '#4CAF50', // Dark green
  '#3F51B5', // Indigo
  '#009688', // Teal
  '#FF5722', // Deep orange
  '#795548', // Brown
  '#607D8B', // Blue grey
  '#FFD600', // Amber
  '#00E676', // Bright green
];

export default function TrackRecorderScreen() {
  const router = useRouter();

  // State
  const [selectedColor, setSelectedColor] = useState<string>('#81C784');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [currentTrackName, setCurrentTrackName] = useState<string>('Track 3');

  // Saved Tracks
  const [tracks, setTracks] = useState<TrackItem[]>([
    {
      id: 1,
      name: 'Track 1',
      color: '#4CAF50',
      pointsCount: 142,
      distanceKm: 4.8,
      date: '2026-09-22',
    },
    {
      id: 2,
      name: 'Track 2',
      color: '#4CAF50',
      pointsCount: 98,
      distanceKm: 3.2,
      date: '2026-09-24',
    },
  ]);

  // Rename Modal
  const [renameModalVisible, setRenameModalVisible] = useState<boolean>(false);
  const [editingTrack, setEditingTrack] = useState<TrackItem | null>(null);
  const [renameInput, setRenameInput] = useState<string>('');

  // Palette Modal
  const [paletteModalVisible, setPaletteModalVisible] = useState<boolean>(false);
  const [paletteTrack, setPaletteTrack] = useState<TrackItem | null>(null);

  // Start Track
  const handleStartTrack = () => {
    setIsRecording(true);
    Alert.alert(
      'Track Recording Active ⏺️',
      `Recording "${currentTrackName}" with selected color.\nGPS breadcrumbs are being logged.`
    );
  };

  // Stop Track
  const handleStopTrack = () => {
    if (!isRecording) {
      Alert.alert('Notice', 'No track is currently recording.');
      return;
    }

    setIsRecording(false);
    const newTrack: TrackItem = {
      id: tracks.length + 1,
      name: currentTrackName,
      color: selectedColor,
      pointsCount: 164,
      distanceKm: 5.4,
      date: '2026-09-26',
    };
    setTracks([newTrack, ...tracks]);
    setCurrentTrackName(`Track ${tracks.length + 2}`);
    Alert.alert('Track Saved 💾', `"${newTrack.name}" saved to your marine track log.`);
  };

  // Import GPX
  const handleImportGpx = () => {
    Alert.alert(
      'Import GPX File 📥',
      'Choose a file from device storage or SD card:',
      [
        {
          text: 'Harbor_Return_Route.gpx',
          onPress: () => {
            const imported: TrackItem = {
              id: tracks.length + 1,
              name: 'Imported: Harbor Route',
              color: '#2196F3',
              pointsCount: 310,
              distanceKm: 12.6,
              date: '2026-09-26',
            };
            setTracks([imported, ...tracks]);
            Alert.alert('GPX Imported ✅', 'Successfully added 310 track points.');
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  // Rename Track
  const handleOpenRename = (item: TrackItem) => {
    setEditingTrack(item);
    setRenameInput(item.name);
    setRenameModalVisible(true);
  };

  const handleSaveRename = () => {
    if (!renameInput.trim() || !editingTrack) return;
    setTracks((prev) =>
      prev.map((t) => (t.id === editingTrack.id ? { ...t, name: renameInput.trim() } : t))
    );
    setRenameModalVisible(false);
  };

  // Change Track Color
  const handleOpenPalette = (item: TrackItem) => {
    setPaletteTrack(item);
    setPaletteModalVisible(true);
  };

  const handleSelectTrackColor = (c: string) => {
    if (!paletteTrack) return;
    setTracks((prev) =>
      prev.map((t) => (t.id === paletteTrack.id ? { ...t, color: c } : t))
    );
    setPaletteModalVisible(false);
  };

  // Export GPX
  const handleExportGpx = (item: TrackItem) => {
    Alert.alert(
      'Export GPX File 📤',
      `Export "${item.name}" to Downloads folder?\nFormat: Marine GPX 1.1 with timestamps & depth.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: () => Alert.alert('Export Complete ✅', `File saved as /Downloads/${item.name}.gpx`),
        },
      ]
    );
  };

  // Delete Track
  const handleDeleteTrack = (item: TrackItem) => {
    Alert.alert(
      'Delete Track? 🗑️',
      `Are you sure you want to permanently delete "${item.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => setTracks((prev) => prev.filter((t) => t.id !== item.id)),
        },
      ]
    );
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.container}>
      <StatusBar style="dark" animated={true} />

      {/* Screen Header */}
      <View style={styles.topNavRow}>
        <BackButton showLabel={true} label="Home" />

        <Text style={styles.headerTitle}>TRACK RECORDER</Text>

        <TouchableOpacity
          onPress={() => router.push('/map')}
          style={styles.mapLinkBtn}>
          <Text style={styles.mapLinkText}>Map 🗺️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Title & Current Track Name (Matching Screenshot) */}
        <View style={styles.titleSection}>
          <View style={styles.mainTitleRow}>
            <Text style={styles.mapPinEmoji}>🗺️</Text>
            <Text style={styles.mainTitle}>Track Recorder</Text>
          </View>
          <Text style={styles.currentNameLabel}>
            Current Name: <Text style={styles.currentNameVal}>{currentTrackName}</Text>
          </Text>
        </View>

        {/* Color Palette Header */}
        <Text style={styles.colorPaletteTitle}>
          Select Track Line Color (28 Colors Available):
        </Text>

        {/* Horizontal Color Swatches Row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.colorSwatchesScroll}>
          {AVAILABLE_COLORS.map((c, idx) => {
            const isSelected = selectedColor === c;
            return (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.75}
                onPress={() => setSelectedColor(c)}
                style={[
                  styles.colorCircle,
                  { backgroundColor: c },
                  isSelected && styles.colorCircleSelected,
                ]}>
                {isSelected && <View style={styles.colorInnerWhiteDot} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Start Track & Stop Track Action Buttons */}
        <View style={styles.actionButtonsRow}>
          {/* Start Track (Blue Pill) */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleStartTrack}
            style={[styles.halfActionBtn, styles.startTrackBtn]}>
            <Text style={styles.btnActionText}>Start Track</Text>
          </TouchableOpacity>

          {/* Stop Track (Coral/Red Pill) */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleStopTrack}
            style={[styles.halfActionBtn, styles.stopTrackBtn]}>
            <Text style={styles.btnActionText}>Stop Track</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* Import GPX (File Picker) Button */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handleImportGpx}
          style={styles.importGpxBtn}>
          <Text style={styles.importGpxBtnText}>📥 Import GPX (File Picker)</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* SAVED TRACKS LIST */}
        <View style={styles.savedTracksList}>
          {tracks.map((item) => (
            <View key={item.id} style={styles.trackCard}>
              <Text style={styles.trackIdText}>ID: {item.id}</Text>
              <Text style={styles.trackNameText}>Name: {item.name}</Text>
              <View style={styles.lineColorRow}>
                <Text style={styles.lineColorLabel}>Line Color: </Text>
                <View style={[styles.miniColorDot, { backgroundColor: item.color }]} />
              </View>

              {/* 4 Action Buttons Row: Edit (✏️), Palette (🎨), Export (📤), Delete (🗑️) */}
              <View style={styles.trackActionsRow}>
                {/* 1. Rename (✏️) */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleOpenRename(item)}
                  style={[styles.trackActionBtn, styles.actionBtnBlue]}>
                  <Text style={styles.actionBtnIcon}>✏️</Text>
                </TouchableOpacity>

                {/* 2. Change Color (🎨) */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleOpenPalette(item)}
                  style={[styles.trackActionBtn, styles.actionBtnBlue]}>
                  <Text style={styles.actionBtnIcon}>🎨</Text>
                </TouchableOpacity>

                {/* 3. Export GPX (📤) */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleExportGpx(item)}
                  style={[styles.trackActionBtn, styles.actionBtnBlue]}>
                  <Text style={styles.actionBtnIcon}>📤</Text>
                </TouchableOpacity>

                {/* 4. Delete Track (🗑️) */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleDeleteTrack(item)}
                  style={[styles.trackActionBtn, styles.actionBtnRed]}>
                  <Text style={styles.actionBtnIcon}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* RENAME TRACK MODAL */}
      <Modal visible={renameModalVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setRenameModalVisible(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>✏️ Rename Track</Text>
              <TextInput
                value={renameInput}
                onChangeText={setRenameInput}
                style={styles.modalInput}
                placeholder="Enter track name..."
                autoFocus
              />
              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  onPress={() => setRenameModalVisible(false)}
                  style={styles.modalCancelBtn}>
                  <Text style={styles.modalBtnTextCancel}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSaveRename}
                  style={styles.modalSaveBtn}>
                  <Text style={styles.modalBtnTextSave}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* PALETTE COLOR PICKER MODAL */}
      <Modal visible={paletteModalVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setPaletteModalVisible(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>🎨 Select Line Color</Text>
              <View style={styles.paletteGrid}>
                {AVAILABLE_COLORS.map((c, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => handleSelectTrackColor(c)}
                    style={[styles.paletteCircle, { backgroundColor: c }]}
                  />
                ))}
              </View>
              <TouchableOpacity
                onPress={() => setPaletteModalVisible(false)}
                style={styles.modalCancelBtnWide}>
                <Text style={styles.modalBtnTextCancel}>Cancel</Text>
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
    backgroundColor: '#F8F9FA',
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
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
    color: '#0D47A1',
    lineHeight: 26,
  },
  backText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0D47A1',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  mapLinkBtn: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  mapLinkText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1565C0',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 14,
  },
  titleSection: {
    alignItems: 'center',
    gap: 6,
  },
  mainTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mapPinEmoji: {
    fontSize: 24,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.2,
  },
  currentNameLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
  },
  currentNameVal: {
    fontWeight: '900',
    color: '#0F172A',
  },
  colorPaletteTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginTop: 4,
  },
  colorSwatchesScroll: {
    paddingVertical: 10,
    gap: 12,
    alignItems: 'center',
  },
  colorCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  colorCircleSelected: {
    borderWidth: 3,
    borderColor: '#000000',
    transform: [{ scale: 1.1 }],
  },
  colorInnerWhiteDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 4,
  },
  halfActionBtn: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  startTrackBtn: {
    backgroundColor: '#2196F3',
  },
  stopTrackBtn: {
    backgroundColor: '#EF5350',
  },
  btnActionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  importGpxBtn: {
    backgroundColor: '#0D47A1',
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0D47A1',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  importGpxBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  savedTracksList: {
    gap: 14,
  },
  trackCard: {
    backgroundColor: '#E8ECFB',
    borderRadius: 16,
    padding: 18,
    gap: 8,
    borderWidth: 1,
    borderColor: '#D4DCF7',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  trackIdText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#334155',
  },
  trackNameText: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
  },
  lineColorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  lineColorLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#334155',
  },
  miniColorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginLeft: 4,
  },
  trackActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  trackActionBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  actionBtnBlue: {
    backgroundColor: '#1565C0',
  },
  actionBtnRed: {
    backgroundColor: '#D32F2F',
  },
  actionBtnIcon: {
    fontSize: 18,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '88%',
    gap: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  modalInput: {
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtnWide: {
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  modalSaveBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1565C0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnTextCancel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#475569',
  },
  modalBtnTextSave: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  paletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    paddingVertical: 8,
  },
  paletteCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
});
