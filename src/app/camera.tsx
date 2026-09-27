import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  Modal,
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

interface CatchLogItem {
  id: string;
  species: string;
  weightKg: number;
  time: string;
  coords: string;
  depthMeters: number;
  temp: number;
  note: string;
}

const COMMON_SPECIES = [
  'Silver Pomfret (Paplet)',
  'Surmai (Kingfish)',
  'Tiger Prawns (Jhinga)',
  'Hilsa',
  'Ribbonfish',
  'Tuna',
  'Crab (Kekda)',
  'Squid / Calamari',
];

export default function MarineCameraScreen() {
  const router = useRouter();

  // Coordinates & marine telemetry
  const latStr = "N 20° 44.572'";
  const lonStr = "E 71° 04.313'";
  const currentDepth = 48;
  const waterTemp = 27.4;
  const currentTime = '08:15 PM';

  // State
  const [catches, setCatches] = useState<CatchLogItem[]>([
    {
      id: 'c-1',
      species: 'Silver Pomfret (Paplet)',
      weightKg: 42.5,
      time: '06:30 PM',
      coords: "N 20° 43.945', E 71° 04.794'",
      depthMeters: 52,
      temp: 27.2,
      note: 'Net haul near deep reef #4',
    },
    {
      id: 'c-2',
      species: 'Surmai (Kingfish)',
      weightKg: 18.0,
      time: '04:15 PM',
      coords: "N 20° 44.120', E 71° 03.880'",
      depthMeters: 44,
      temp: 27.5,
      note: 'Trolling strike',
    },
  ]);

  const [logModalVisible, setLogModalVisible] = useState<boolean>(false);
  const [selectedSpecies, setSelectedSpecies] = useState<string>('Silver Pomfret (Paplet)');
  const [weightInput, setWeightInput] = useState<string>('25');
  const [noteInput, setNoteInput] = useState<string>('Good catch during flood tide');

  const handleCapturePhoto = () => {
    setLogModalVisible(true);
  };

  const handleSaveCatch = () => {
    const newCatch: CatchLogItem = {
      id: `c-${Date.now()}`,
      species: selectedSpecies,
      weightKg: parseFloat(weightInput) || 10,
      time: currentTime,
      coords: `${latStr}, ${lonStr}`,
      depthMeters: currentDepth,
      temp: waterTemp,
      note: noteInput.trim(),
    };
    setCatches([newCatch, ...catches]);
    setLogModalVisible(false);
    Alert.alert('Geo-Stamped Catch Saved 🐟', `Logged ${newCatch.weightKg} kg of ${newCatch.species} at ${newCatch.coords}!`);
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.container}>
      <StatusBar style="light" animated={true} />

      {/* Screen Header */}
      <View style={styles.topNavRow}>
        <BackButton isDark={true} showLabel={true} label="Home" />

        <Text style={styles.headerTitle}>GEO-STAMPED CATCH LOG</Text>

        <TouchableOpacity onPress={() => router.push('/waypoints')} style={styles.headerActionBtn}>
          <Text style={styles.headerActionText}>Waypoints 📍</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* CAMERA VIEWFINDER SIMULATOR WITH LIVE GPS WATERMARK */}
        <View style={styles.viewfinderBox}>
          {/* Top Marine Watermark Stamp */}
          <View style={styles.watermarkTop}>
            <Text style={styles.watermarkTextBold}>⚓ SAGAR KRIPA • DIU HARBOR BASIN</Text>
            <Text style={styles.watermarkTextSub}>
              {latStr} • {lonStr}
            </Text>
            <Text style={styles.watermarkTextSub}>
              DEPTH: {currentDepth}m • TEMP: {waterTemp}°C • {currentTime}
            </Text>
          </View>

          {/* Center Targeting Reticle */}
          <View style={styles.reticleWrap}>
            <View style={styles.reticleRing}>
              <View style={styles.reticleDot} />
            </View>
            <Text style={styles.reticleHintText}>Tap shutter to log catch & geo-stamp spot</Text>
          </View>

          {/* Shutter Button */}
          <View style={styles.shutterRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleCapturePhoto}
              style={styles.shutterOuterBtn}>
              <View style={styles.shutterInnerCircle} />
            </TouchableOpacity>
          </View>
        </View>

        {/* LOGGED CATCHES SUMMARY */}
        <View style={styles.summaryBar}>
          <Text style={styles.summaryTitle}>Today&apos;s Marine Catch Log</Text>
          <Text style={styles.summaryTotal}>
            Total: {catches.reduce((acc, c) => acc + c.weightKg, 0).toFixed(1)} kg
          </Text>
        </View>

        {/* Catches List */}
        <View style={styles.catchListWrap}>
          {catches.map((item) => (
            <View key={item.id} style={styles.catchCard}>
              <View style={styles.catchTopRow}>
                <Text style={styles.catchSpeciesText}>🐟 {item.species}</Text>
                <View style={styles.weightBadge}>
                  <Text style={styles.weightBadgeText}>{item.weightKg} kg</Text>
                </View>
              </View>

              <Text style={styles.catchCoordText}>📍 {item.coords}</Text>

              <View style={styles.catchMetaRow}>
                <Text style={styles.catchMetaText}>Depth: {item.depthMeters}m</Text>
                <Text style={styles.catchMetaText}>•</Text>
                <Text style={styles.catchMetaText}>Water: {item.temp}°C</Text>
                <Text style={styles.catchMetaText}>•</Text>
                <Text style={styles.catchMetaText}>Time: {item.time}</Text>
              </View>

              {item.note ? <Text style={styles.catchNoteText}>📝 &quot;{item.note}&quot;</Text> : null}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* CATCH DETAILS MODAL */}
      <Modal visible={logModalVisible} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setLogModalVisible(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalHeaderTitle}>📸 Geo-Stamp Catch</Text>

              {/* Species Selector */}
              <Text style={styles.inputTitle}>Select Species:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.speciesScroll}>
                {COMMON_SPECIES.map((sp) => (
                  <TouchableOpacity
                    key={sp}
                    onPress={() => setSelectedSpecies(sp)}
                    style={[styles.speciesPill, selectedSpecies === sp && styles.speciesPillActive]}>
                    <Text style={[styles.speciesText, selectedSpecies === sp && styles.speciesTextActive]}>
                      {sp}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Weight Input */}
              <Text style={styles.inputTitle}>Estimated Catch Weight (kg):</Text>
              <TextInput
                value={weightInput}
                onChangeText={setWeightInput}
                keyboardType="decimal-pad"
                style={styles.modalTextInput}
              />

              {/* Notes Input */}
              <Text style={styles.inputTitle}>Haul Notes:</Text>
              <TextInput
                value={noteInput}
                onChangeText={setNoteInput}
                placeholder="Water condition, bait, net depth..."
                style={styles.modalTextInput}
              />

              {/* Geo Stamp Coordinates preview */}
              <View style={styles.stampPreviewBox}>
                <Text style={styles.stampPreviewText}>
                  📍 Embedded GPS: {latStr}, {lonStr} • Depth: {currentDepth}m
                </Text>
              </View>

              {/* Buttons */}
              <View style={styles.modalBtnRow}>
                <TouchableOpacity onPress={() => setLogModalVisible(false)} style={styles.modalCancelBtn}>
                  <Text style={styles.modalBtnCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleSaveCatch} style={styles.modalSaveBtn}>
                  <Text style={styles.modalBtnSaveText}>Save to Catch Log</Text>
                </TouchableOpacity>
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
    backgroundColor: '#0F172A',
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 6,
  },
  backArrow: {
    fontSize: 26,
    color: '#38BDF8',
    lineHeight: 26,
  },
  backText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#38BDF8',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  headerActionBtn: {
    backgroundColor: '#0369A1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  headerActionText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 14,
  },
  viewfinderBox: {
    height: 320,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    borderWidth: 2,
    borderColor: '#38BDF8',
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'space-between',
    padding: 16,
  },
  watermarkTop: {
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    padding: 10,
    borderRadius: 10,
    gap: 2,
  },
  watermarkTextBold: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  watermarkTextSub: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '700',
  },
  reticleWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  reticleRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reticleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  reticleHintText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  shutterRow: {
    alignItems: 'center',
  },
  shutterOuterBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInnerCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EF4444',
  },
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  summaryTotal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#38BDF8',
  },
  catchListWrap: {
    gap: 10,
  },
  catchCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  catchTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catchSpeciesText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  weightBadge: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  weightBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  catchCoordText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  catchMetaRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  catchMetaText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  catchNoteText: {
    fontSize: 12,
    color: '#E2E8F0',
    fontStyle: 'italic',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  modalCard: {
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 20,
    width: '100%',
    gap: 10,
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  inputTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
  },
  speciesScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  speciesPill: {
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  speciesPillActive: {
    backgroundColor: '#0284C7',
  },
  speciesText: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '700',
  },
  speciesTextActive: {
    color: '#FFFFFF',
  },
  modalTextInput: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#334155',
  },
  stampPreviewBox: {
    backgroundColor: '#0F172A',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  stampPreviewText: {
    fontSize: 11,
    color: '#38BDF8',
    fontWeight: '700',
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnCancelText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '800',
  },
  modalSaveBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnSaveText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
});
