import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackButton } from '@/components/ui/back-button';

export default function SettingsScreen() {
  const router = useRouter();

  // Settings state
  const [theme, setTheme] = useState<'system' | 'light' | 'dark'>('system');
  const [unitSystem, setUnitSystem] = useState<'mile' | 'nm' | 'km'>('mile');
  const [ttsLang, setTtsLang] = useState<'English' | 'Gujarati' | 'Hindi'>('English');
  const [voiceAnnounce, setVoiceAnnounce] = useState<boolean>(false);
  const [posFormat, setPosFormat] = useState<string>('DMF');
  const [posDatum, setPosDatum] = useState<string>('WGS84');
  const [keepScreenOn, setKeepScreenOn] = useState<boolean>(false);

  // Cycle Theme
  const handleCycleTheme = () => {
    const next = theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system';
    setTheme(next);
  };

  // Cycle Units
  const handleCycleUnit = () => {
    const next = unitSystem === 'mile' ? 'nm' : unitSystem === 'nm' ? 'km' : 'mile';
    setUnitSystem(next);
  };

  // Cycle Language
  const handleCycleLang = () => {
    const next = ttsLang === 'English' ? 'Gujarati' : ttsLang === 'Gujarati' ? 'Hindi' : 'English';
    setTtsLang(next);
  };

  // Danger zone alerts
  const handleClearMapCache = () => {
    Alert.alert('Clear Map Cache', 'Free up offline nautical chart cache?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear (142 MB)', style: 'destructive', onPress: () => Alert.alert('Cache Cleared ✅') },
    ]);
  };

  const handleClearWaypointDb = () => {
    Alert.alert('Clear Waypoint Database', 'This will wipe all locally stored waypoints.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear Database', style: 'destructive', onPress: () => Alert.alert('Database Cleared') },
    ]);
  };

  const handleClearTrackDb = () => {
    Alert.alert('Clear Track Database', 'Remove all recorded GPS boat tracks?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear Tracks', style: 'destructive', onPress: () => Alert.alert('Tracks Cleared') },
    ]);
  };

  const handleDeleteAllWaypoints = () => {
    Alert.alert(
      '⚠️ Delete All Waypoints',
      'Are you completely sure? This action cannot be undone unless you have a GPX backup.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete Everything', style: 'destructive', onPress: () => Alert.alert('All Waypoints Deleted') },
      ]
    );
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.container}>
      <StatusBar style="dark" animated={true} />

      {/* Screen Header */}
      <View style={styles.topHeader}>
        <BackButton showLabel={true} label="Home" />

        <View style={styles.titleRow}>
          <Text style={styles.gearEmoji}>⚙️</Text>
          <Text style={styles.screenTitle}>App Settings</Text>
        </View>

        <View style={{ width: 50 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() =>
            Alert.alert('Fishing Boat Profile', 'Vessel: Sagar Kripa #4\nCallsign: IND-GUJ-9921\nHome Port: Diu / Veraval')
          }
          style={styles.profileCard}>
          <Text style={styles.profileIcon}>👤</Text>
          <Text style={styles.profileText}>Profile</Text>
        </TouchableOpacity>

        {/* Setting 1: Theme */}
        <View style={styles.settingBlock}>
          <Text style={styles.settingLabel}>Theme</Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleCycleTheme}
            style={styles.themePillBtn}>
            <Text style={styles.pillBtnText}>{theme}</Text>
          </TouchableOpacity>
        </View>

        {/* Setting 2: Unit System */}
        <View style={styles.settingBlock}>
          <Text style={styles.settingLabel}>Unit System</Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleCycleUnit}
            style={styles.unitPillBtn}>
            <Text style={styles.pillBtnText}>
              {unitSystem === 'nm' ? 'nautical mile (nm)' : unitSystem}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Setting 3: TTS Speech Language */}
        <View style={styles.settingBlock}>
          <Text style={styles.settingLabel}>TTS Speech Language</Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleCycleLang}
            style={styles.langPillBtn}>
            <Text style={styles.pillBtnText}>{ttsLang}</Text>
          </TouchableOpacity>
        </View>

        {/* Setting 4: Voice Announcements */}
        <View style={styles.settingRow}>
          <Text style={styles.settingRowLabel}>Voice Announcements</Text>
          <Switch
            value={voiceAnnounce}
            onValueChange={setVoiceAnnounce}
            trackColor={{ false: '#CBD5E1', true: '#0288D1' }}
            thumbColor={voiceAnnounce ? '#FFFFFF' : '#F1F5F9'}
          />
        </View>

        {/* Setting 5: Position Format */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() =>
            Alert.alert(
              'Position Format',
              'Select coordinate format:',
              [
                { text: 'DMF (DD° MM.MMM\') [Recommended for Marine]', onPress: () => setPosFormat('DMF') },
                { text: 'DMS (DD° MM\' SS.S")', onPress: () => setPosFormat('DMS') },
                { text: 'DD (Decimal Degrees)', onPress: () => setPosFormat('DD') },
                { text: 'Cancel', style: 'cancel' },
              ]
            )
          }
          style={styles.settingRow}>
          <Text style={styles.settingRowLabel}>Position Format</Text>
          <Text style={styles.settingRowValue}>{posFormat}</Text>
        </TouchableOpacity>

        {/* Setting 6: Position Datum */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() =>
            Alert.alert(
              'Position Datum',
              'Select geodetic datum:',
              [
                { text: 'WGS84 (Global Standard)', onPress: () => setPosDatum('WGS84') },
                { text: 'Indian 1975', onPress: () => setPosDatum('Indian 1975') },
                { text: 'Cancel', style: 'cancel' },
              ]
            )
          }
          style={styles.settingRow}>
          <Text style={styles.settingRowLabel}>Position Datum</Text>
          <Text style={styles.settingRowValue}>{posDatum}</Text>
        </TouchableOpacity>

        {/* Setting 7: Keep Screen On */}
        <View style={styles.settingRow}>
          <Text style={styles.settingRowLabel}>Keep Screen On</Text>
          <Switch
            value={keepScreenOn}
            onValueChange={setKeepScreenOn}
            trackColor={{ false: '#CBD5E1', true: '#0288D1' }}
            thumbColor={keepScreenOn ? '#FFFFFF' : '#F1F5F9'}
          />
        </View>

        <View style={styles.divider} />

        {/* Safe Waypoint Section */}
        <Text style={styles.sectionHeaderBlue}>Safe Waypoint</Text>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() =>
            Alert.alert('Backup & Restore ☁️', 'Save waypoints to Cloud or SD Card?', [
              { text: 'Backup Waypoints Now' },
              { text: 'Restore from Cloud' },
              { text: 'Cancel', style: 'cancel' },
            ])
          }
          style={styles.backupRestoreBtn}>
          <Text style={styles.backupRestoreText}>Backup & Restore</Text>
        </TouchableOpacity>

        {/* App Backup & GPX Tools */}
        <Text style={styles.sectionHeaderBrown}>📦 App Backup & GPX Tools</Text>
        <View style={styles.gpxButtonsRow}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => Alert.alert('Export GPX 📤', 'Exported 10 waypoints to /Downloads/FishingWaypoints.gpx')}
            style={styles.gpxHalfBtn}>
            <Text style={styles.gpxBtnText}>Export GPX</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => Alert.alert('Import GPX 📥', 'Select a .gpx or .kml file from your phone.')}
            style={styles.gpxHalfBtn}>
            <Text style={styles.gpxBtnText}>Import GPX</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() =>
            Alert.alert('Reset All Settings ⚠️', 'Reset preferences to factory default?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Reset', style: 'destructive', onPress: () => Alert.alert('Settings Reset') },
            ])
          }
          style={styles.resetAllBtn}>
          <Text style={styles.resetAllText}>Reset All Settings</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Danger Zone Section */}
        <Text style={styles.sectionHeaderRed}>Danger Zone</Text>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleClearMapCache}
          style={styles.dangerSlateBtn}>
          <Text style={styles.dangerBtnText}>Clear Map Cache</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleClearWaypointDb}
          style={styles.dangerSlateBtn}>
          <Text style={styles.dangerBtnText}>Clear Waypoint Database</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleClearTrackDb}
          style={styles.dangerSlateBtn}>
          <Text style={styles.dangerBtnText}>Clear Track Database</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleDeleteAllWaypoints}
          style={styles.dangerRedBtn}>
          <Text style={styles.dangerBtnText}>Delete All Waypoints</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* About Section */}
        <View style={styles.aboutSection}>
          <Text style={styles.aboutHeader}>About</Text>
          <Text style={styles.aboutAppName}>GPS Fishing RAHI v1.6.9</Text>
          <Text style={styles.aboutDevText}>Developed by Fishing RAHI Team</Text>
          <Text style={styles.aboutMeteoText}>
            Weather information in this app is powered by Open-Meteo.com
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  topHeader: {
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
    color: '#1E293B',
    lineHeight: 26,
  },
  backText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gearEmoji: {
    fontSize: 20,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0288D1',
    letterSpacing: 0.3,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 14,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  profileIcon: {
    fontSize: 22,
    color: '#3949AB',
  },
  profileText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  settingBlock: {
    gap: 6,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  themePillBtn: {
    backgroundColor: '#00B0FF',
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitPillBtn: {
    backgroundColor: '#4CAF50',
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langPillBtn: {
    backgroundColor: '#0097A7',
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  settingRowLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  settingRowValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  divider: {
    height: 1,
    backgroundColor: '#CBD5E1',
    marginVertical: 6,
  },
  sectionHeaderBlue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0D47A1',
  },
  backupRestoreBtn: {
    backgroundColor: '#FF9100',
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF9100',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  backupRestoreText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  sectionHeaderBrown: {
    fontSize: 15,
    fontWeight: '800',
    color: '#4E342E',
    marginTop: 4,
  },
  gpxButtonsRow: {
    flexDirection: 'row',
    gap: 14,
  },
  gpxHalfBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#304FFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gpxBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  resetAllBtn: {
    backgroundColor: '#3F51B5',
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetAllText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  sectionHeaderRed: {
    fontSize: 15,
    fontWeight: '800',
    color: '#B71C1C',
  },
  dangerSlateBtn: {
    backgroundColor: '#607D8B',
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerRedBtn: {
    backgroundColor: '#C62828',
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  aboutSection: {
    gap: 4,
    marginTop: 4,
  },
  aboutHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  aboutAppName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
  },
  aboutDevText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  aboutMeteoText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 6,
    fontStyle: 'italic',
  },
});
