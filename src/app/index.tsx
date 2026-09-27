import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CoordinatesCard } from '@/components/marine/CoordinatesCard';
import { useRouter } from 'expo-router';
import { FeatureModal } from '@/components/marine/FeatureModal';
import { NavGrid } from '@/components/marine/NavGrid';
import { PremiumButton } from '@/components/marine/PremiumButton';
import { SatelliteRadar } from '@/components/marine/SatelliteRadar';
import { MarineFeatureId, Satellite } from '@/components/marine/types';

export default function MarineHomeScreen() {
  const router = useRouter();
  const [nightMode, setNightMode] = useState<boolean>(false);
  const [activeModal, setActiveModal] = useState<MarineFeatureId | 'satellite' | 'coordinates' | null>(null);
  const [modalTitle, setModalTitle] = useState<string>('');
  const [selectedSat, setSelectedSat] = useState<Satellite | null>(null);

  // Marine Navigation State
  const latitude = "N 20° 44.572'";
  const longitude = "E 71° 04.313'";
  const altitude = -53;
  const accuracy = 3;
  const usedSatellites = 33;
  const visibleSatellites = 57;
  const batteryPercent = 22;
  const signalBars = 5;

  const handlePressFeature = (id: MarineFeatureId, label: string) => {
    if (id === 'compass') {
      router.push('/compass');
      return;
    }
    if (id === 'tide') {
      router.push('/tide');
      return;
    }
    if (id === 'waypoints') {
      router.push('/waypoints');
      return;
    }
    if (id === 'settings') {
      router.push('/settings');
      return;
    }
    if (id === 'map') {
      router.push('/map');
      return;
    }
    if (id === 'calendar') {
      router.push('/calendar');
      return;
    }
    if (id === 'track') {
      router.push('/track');
      return;
    }
    if (id === 'premium') {
      router.push('/premium');
      return;
    }
    if (id === 'weather') {
      router.push('/weather');
      return;
    }
    if (id === 'camera') {
      router.push('/camera');
      return;
    }
    setActiveModal(id);
    setModalTitle(label);
  };

  const handleSelectSatellite = (sat: Satellite) => {
    setSelectedSat(sat);
    setActiveModal('satellite');
    setModalTitle(`Satellite PRN #${sat.prn}`);
  };

  const handlePressCoordinates = () => {
    setActiveModal('coordinates');
    setModalTitle('Vessel GPS Coordinates');
  };

  const handlePressBattery = () => {
    Alert.alert(
      'Marine Power Status',
      `Battery Level: ${batteryPercent}%\nStatus: Discharging\nBackup Marine VHF Radio Power: OK`,
      [{ text: 'OK' }]
    );
  };

  const handlePressSignal = () => {
    Alert.alert(
      'GNSS Signal Health',
      `Signal Status: 5/5 Bars (Excellent)\nCorrection: DGPS / WAAS Active\nHDOP: 0.8\nCEP Accuracy: ${accuracy} Meters`,
      [{ text: 'OK' }]
    );
  };

  const handleMarkWaypoint = () => {
    Alert.alert(
      'Fishing Spot Marked! ⚓',
      `Saved waypoint at:\n${latitude}, ${longitude}\nDepth: 53m\nAdded to your Waypoints list.`,
      [{ text: 'Done', onPress: () => setActiveModal(null) }]
    );
  };

  const themeColors = nightMode
    ? {
        background: '#0D1117',
        cardBg: '#161B22',
        headerText: '#ECEFF1',
        statusGreen: '#00E676',
        toggleBg: 'rgba(255, 82, 82, 0.15)',
        toggleBorder: '#FF5252',
        toggleText: '#FF8A80',
      }
    : {
        background: '#FFFFFF',
        cardBg: '#F8FAFC',
        headerText: '#1E293B',
        statusGreen: '#00C853',
        toggleBg: '#F1F5F9',
        toggleBorder: '#CBD5E1',
        toggleText: '#475569',
      };

  return (
    <SafeAreaView
      edges={['top', 'left', 'right', 'bottom']}
      style={[styles.safeArea, { backgroundColor: themeColors.background }]}>
      <StatusBar style={nightMode ? 'light' : 'dark'} animated={true} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}>
        {/* Top Control Bar (Night Mode toggle & Marine Fix Indicator) */}
        <View style={styles.topControlBar}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handlePressSignal}
            style={styles.fixStatusBadge}>
            <View style={[styles.statusDot, { backgroundColor: themeColors.statusGreen }]} />
            <Text style={[styles.fixStatusText, { color: themeColors.headerText }]}>
              3D DGPS FIX • 3m ACC
            </Text>
          </TouchableOpacity>

          <View style={styles.topRightControls}>
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => router.push('/login')}
              style={[
                styles.loginToggleBtn,
                {
                  backgroundColor: themeColors.toggleBg,
                  borderColor: themeColors.toggleBorder,
                },
              ]}>
              <Text style={[styles.loginToggleText, { color: themeColors.toggleText }]}>
                ⚓ LOGIN
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => setNightMode(!nightMode)}
              style={[
                styles.nightToggleBtn,
                {
                  backgroundColor: themeColors.toggleBg,
                  borderColor: themeColors.toggleBorder,
                },
              ]}>
              <Text style={[styles.nightToggleText, { color: themeColors.toggleText }]}>
                {nightMode ? '🌙 NIGHT' : '☀️ DAY'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 1. Satellite Skyplot Radar View */}
        <SatelliteRadar
          usedCount={usedSatellites}
          visibleCount={visibleSatellites}
          altitude={altitude}
          accuracy={accuracy}
          nightMode={nightMode}
          onSelectSatellite={handleSelectSatellite}
        />

        {/* 2. Signal, Marine Coordinates & Battery Row */}
        <CoordinatesCard
          latitude={latitude}
          longitude={longitude}
          batteryPercent={batteryPercent}
          signalBars={signalBars}
          nightMode={nightMode}
          onPressCoordinates={handlePressCoordinates}
          onPressBattery={handlePressBattery}
          onPressSignal={handlePressSignal}
        />

        {/* 3. 3x3 Marine Navigation Action Grid */}
        <NavGrid
          nightMode={nightMode}
          onPressFeature={handlePressFeature}
        />

        {/* 4. Bottom Upgrade to Premium Button */}
        <PremiumButton
          nightMode={nightMode}
          onPress={() => handlePressFeature('premium', 'Upgrade to Premium')}
        />
      </ScrollView>

      {/* Interactive Feature Modal / Bottom Sheet */}
      <FeatureModal
        visible={activeModal !== null}
        featureId={activeModal}
        featureTitle={modalTitle}
        selectedSat={selectedSat}
        nightMode={nightMode}
        onClose={() => {
          setActiveModal(null);
          setSelectedSat(null);
        }}
        onMarkWaypoint={handleMarkWaypoint}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 12 : 20,
  },
  topControlBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 4,
  },
  fixStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  fixStatusText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  topRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loginToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  loginToggleText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  nightToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  nightToggleText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
