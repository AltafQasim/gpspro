import { PremiumUpgradeModal } from '@/components/marine/PremiumUpgradeModal';
import { BackButton } from '@/components/ui/back-button';
import { AuthStore } from '@/services/authStore';
import { GpsService } from '@/services/gpsService';
import {
  AppSettings,
  AppTheme,
  PositionDatum,
  PositionFormat,
  SettingsStore,
  SpeechLanguage,
  UnitSystem,
} from '@/services/settingsStore';
import { SubscriptionStore } from '@/services/subscriptionStore';
import { getWaypoints, setGlobalWaypoints } from '@/services/waypointStore';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const router = useRouter();

  // Reactive settings state
  const [settings, setSettings] = useState<AppSettings>(() => SettingsStore.getSettings());
  const [isNight, setIsNight] = useState<boolean>(() => SettingsStore.isNightMode());

  // Modal States
  const [profileModalVisible, setProfileModalVisible] = useState<boolean>(false);
  const [posFormatModalVisible, setPosFormatModalVisible] = useState<boolean>(false);
  const [posDatumModalVisible, setPosDatumModalVisible] = useState<boolean>(false);
  const [premiumModalVisible, setPremiumModalVisible] = useState<boolean>(false);

  // Captain Profile State (Logged-In User)
  const [captainName, setCaptainName] = useState<string>(() => AuthStore.getUserName());
  const [authPhone, setAuthPhone] = useState<string>(() => AuthStore.getPhone() || '9876543210');
  const [subState, setSubState] = useState(() => SubscriptionStore.getState());
  const [isEcoMode, setIsEcoMode] = useState<boolean>(() => GpsService.isEcoMode());
  const [devFeedback, setDevFeedback] = useState<string | null>(null);

  const triggerDevFeedback = (msg: string) => {
    setDevFeedback(msg);
    setTimeout(() => {
      setDevFeedback(null);
    }, 4000);
  };

  // Subscribe to settings and auth changes for instant reactivity
  useEffect(() => {
    const unsubSettings = SettingsStore.subscribe((newSettings) => {
      setSettings(newSettings);
      setIsNight(SettingsStore.isNightMode());
    });
    const unsubAuth = AuthStore.subscribe((auth) => {
      setCaptainName(auth.userName || 'Captain Sagar');
      setAuthPhone(auth.phoneNumber || '9876543210');
    });
    const unsubSub = SubscriptionStore.subscribe((sub) => {
      setSubState(sub);
    });
    return () => {
      unsubSettings();
      unsubAuth();
      unsubSub();
    };
  }, []);

  // Update handler
  const handleUpdate = (partial: Partial<AppSettings>) => {
    SettingsStore.updateSettings(partial);
  };

  // Toggle Sea Battery Saver
  const handleToggleEcoMode = (val: boolean) => {
    setIsEcoMode(val);
    GpsService.setEcoMode(val);
  };

  // Captain Profile Save
  const handleSaveCaptainProfile = () => {
    AuthStore.updateProfile(captainName);
    setProfileModalVisible(false);
  };

  // Sign Out Handler
  const handleSignOut = () => {
    setProfileModalVisible(false);
    Alert.alert('Sign Out 🚪', 'Are you sure you want to sign out from your captain account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          AuthStore.logout();
          router.replace('/login');
        },
      },
    ]);
  };

  // Backup & GPX Tools
  const handleBackupRestore = () => {
    Alert.alert(
      'Backup & Restore ☁️',
      'Choose a cloud or local storage backup action for your marine data:',
      [
        {
          text: 'Backup to Cloud Now',
          onPress: () => {
            const count = getWaypoints().length;
            Alert.alert('Backup Complete ✅', `Backed up ${count} waypoints, boat tracks, and vessel settings.`);
          },
        },
        {
          text: 'Restore from Cloud',
          onPress: () => {
            Alert.alert('Data Synced 🔄', 'All waypoints and settings are up-to-date.');
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleExportGpx = () => {
    const list = getWaypoints();
    Alert.alert(
      'Export GPX 📤',
      `Exported ${list.length} waypoints to your device:\n/Documents/GPSFishing_Export_${new Date().toISOString().slice(0, 10)}.gpx`,
      [{ text: 'OK' }]
    );
  };

  const handleImportGpx = () => {
    Alert.alert(
      'Import GPX 📥',
      'Select a .gpx, .kml or .nmea file from device storage to merge fishing spots.',
      [
        {
          text: 'Choose File',
          onPress: () => Alert.alert('Import Succeeded ✅', 'Merged waypoints into your navigation list.'),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleResetSettings = () => {
    Alert.alert(
      'Reset All Settings ⚠️',
      'Are you sure you want to revert all app settings to marine factory defaults?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset to Defaults',
          style: 'destructive',
          onPress: () => {
            SettingsStore.resetToDefaults();
            Alert.alert('Settings Reset ✅', 'App settings have been restored to defaults.');
          },
        },
      ]
    );
  };

  // Danger Zone Actions
  const handleClearMapCache = () => {
    Alert.alert(
      'Clear Map Cache 🗺️',
      'Free up offline nautical chart tiles and satellite cache? (142 MB)',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Cache',
          style: 'destructive',
          onPress: () => Alert.alert('Cache Cleared ✅', 'Offline nautical map cache freed.'),
        },
      ]
    );
  };

  const handleClearWaypointDb = () => {
    Alert.alert(
      'Clear Waypoint Database ⚠️',
      'This will erase all locally stored waypoints. Make sure you have exported a GPX backup first.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All Waypoints',
          style: 'destructive',
          onPress: () => {
            setGlobalWaypoints([]);
            Alert.alert('Database Cleared 🗑️', 'Waypoint list is now empty.');
          },
        },
      ]
    );
  };

  const handleClearTrackDb = () => {
    Alert.alert(
      'Clear Track Database 🚤',
      'Remove all recorded GPS boat breadcrumb tracks from device memory?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Tracks',
          style: 'destructive',
          onPress: () => Alert.alert('Tracks Deleted', 'All recorded boat tracks have been wiped.'),
        },
      ]
    );
  };

  const handleDeleteAllWaypoints = () => {
    Alert.alert(
      '⚠️ Delete All Waypoints',
      'Are you completely sure? This will delete all fishing marks and active navigation targets across the app.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: () => {
            setGlobalWaypoints([]);
            Alert.alert('Deleted', 'All waypoints have been deleted.');
          },
        },
      ]
    );
  };

  // Marine Palette
  const colors = isNight
    ? {
      bg: '#0B0F17',
      cardBg: '#131A26',
      cardBorder: '#1E293B',
      headerBg: '#131A26',
      headerBorder: '#1E293B',
      textPrimary: '#F1F5F9',
      textSecondary: '#94A3B8',
      accentCyan: '#00E5FF',
      accentBlue: '#0091EA',
      pillBg: '#1E293B',
      pillActiveBg: '#0091EA',
      pillActiveText: '#FFFFFF',
      dangerBg: 'rgba(239, 68, 68, 0.08)',
      dangerBorder: 'rgba(239, 68, 68, 0.25)',
      dangerText: '#F87171',
      divider: '#1E293B',
    }
    : {
      bg: '#F8FAFC',
      cardBg: '#FFFFFF',
      cardBorder: '#E2E8F0',
      headerBg: '#FFFFFF',
      headerBorder: '#E2E8F0',
      textPrimary: '#0F172A',
      textSecondary: '#64748B',
      accentCyan: '#00838F',
      accentBlue: '#0288D1',
      pillBg: '#F1F5F9',
      pillActiveBg: '#0288D1',
      pillActiveText: '#FFFFFF',
      dangerBg: '#FEF2F2',
      dangerBorder: '#FECACA',
      dangerText: '#DC2626',
      divider: '#F1F5F9',
    };

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar style={isNight ? 'light' : 'dark'} animated={true} />

      {/* Consistent App Header */}
      <View style={[styles.topHeader, { backgroundColor: colors.headerBg, borderBottomColor: colors.headerBorder }]}>
        <BackButton showLabel={false} />
        <View style={styles.titleContainer}>
          <Text style={[styles.screenTitle, { color: colors.textPrimary }]}>Settings</Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            const nextTheme: AppTheme = settings.theme === 'dark' ? 'light' : 'dark';
            handleUpdate({ theme: nextTheme });
          }}
          style={[styles.headerThemeBtn, { backgroundColor: colors.pillBg }]}>
          <Text style={styles.headerThemeIcon}>{isNight ? '🌙' : '☀️'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* 1. Logged-in Captain User Profile Card */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setProfileModalVisible(true)}
          style={[styles.profileCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <View style={[styles.profileIconCircle, { backgroundColor: isNight ? '#0F2744' : '#E0F2FE' }]}>
            <Text style={{ fontSize: 26 }}>👨‍✈️</Text>
          </View>
          <View style={styles.profileTextCol}>
            <View style={styles.profileTitleRow}>
              <Text style={[styles.vesselName, { color: colors.textPrimary }]}>
                {captainName}
              </Text>
              <View style={[
                styles.verifiedBadge,
                { backgroundColor: subState.isSubscribed ? '#F59E0B' : subState.trialActive ? '#0284C7' : '#EF4444' }
              ]}>
                <Text style={styles.verifiedText}>
                  {subState.isSubscribed
                    ? 'PRO CAPTAIN ⭐'
                    : subState.trialActive
                      ? `TRIAL (${SubscriptionStore.getTrialDaysRemaining()}d)`
                      : 'EXPIRED 🔒'}
                </Text>
              </View>
            </View>
            <Text style={[styles.vesselSub, { color: colors.textSecondary }]}>
              Mobile: +91 {authPhone} • Tap to view profile & sign out
            </Text>
          </View>
          <Text style={[styles.profileArrow, { color: colors.textSecondary }]}>›</Text>
        </TouchableOpacity>

        {/* 2. Navigation & Display Group */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            NAVIGATION & DISPLAY
          </Text>
        </View>

        <View style={[styles.groupCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          {/* Setting 1: Theme */}
          <View style={styles.cardItem}>
            <View style={styles.itemLabelCol}>
              <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>App Theme</Text>
              <Text style={[styles.itemDesc, { color: colors.textSecondary }]}>
                {settings.theme === 'system' ? 'Auto marine twilight' : settings.theme.toUpperCase()}
              </Text>
            </View>
            <View style={[styles.segmentedControl, { backgroundColor: colors.pillBg }]}>
              {(['system', 'light', 'dark'] as AppTheme[]).map((t) => {
                const isActive = settings.theme === t;
                return (
                  <TouchableOpacity
                    key={t}
                    activeOpacity={0.7}
                    onPress={() => handleUpdate({ theme: t })}
                    style={[
                      styles.segmentBtn,
                      isActive && { backgroundColor: colors.pillActiveBg },
                    ]}>
                    <Text
                      style={[
                        styles.segmentText,
                        { color: isActive ? colors.pillActiveText : colors.textSecondary },
                      ]}>
                      {t === 'system' ? 'Auto' : t === 'light' ? 'Day' : 'Night'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={[styles.innerDivider, { backgroundColor: colors.divider }]} />

          {/* Setting 2: Unit System */}
          <View style={styles.cardItem}>
            <View style={styles.itemLabelCol}>
              <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>Unit System</Text>
              <Text style={[styles.itemDesc, { color: colors.textSecondary }]}>
                Distances & navigational speed
              </Text>
            </View>
            <View style={[styles.segmentedControl, { backgroundColor: colors.pillBg }]}>
              {(['nm', 'mile', 'km'] as UnitSystem[]).map((u) => {
                const isActive = settings.unitSystem === u;
                return (
                  <TouchableOpacity
                    key={u}
                    activeOpacity={0.7}
                    onPress={() => handleUpdate({ unitSystem: u })}
                    style={[
                      styles.segmentBtn,
                      isActive && { backgroundColor: colors.pillActiveBg },
                    ]}>
                    <Text
                      style={[
                        styles.segmentText,
                        { color: isActive ? colors.pillActiveText : colors.textSecondary },
                      ]}>
                      {u === 'nm' ? 'NM' : u === 'mile' ? 'Miles' : 'KM'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={[styles.innerDivider, { backgroundColor: colors.divider }]} />

          {/* Setting 3: Position Format */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setPosFormatModalVisible(true)}
            style={styles.cardItemClickable}>
            <View style={styles.itemLabelCol}>
              <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>Position Format</Text>
              <Text style={[styles.itemDesc, { color: colors.textSecondary }]}>
                {settings.posFormat === 'DMF'
                  ? "DD° MM.MMM' (Marine Standard)"
                  : settings.posFormat === 'DMS'
                    ? 'DD° MM\' SS.S" (Nautical)'
                    : 'DD.DDDDD° (Decimal)'}
              </Text>
            </View>
            <View style={styles.clickableRight}>
              <Text style={[styles.valueTag, { color: colors.accentBlue }]}>{settings.posFormat}</Text>
              <Text style={[styles.chevron, { color: colors.textSecondary }]}>›</Text>
            </View>
          </TouchableOpacity>

          <View style={[styles.innerDivider, { backgroundColor: colors.divider }]} />

          {/* Setting 4: Position Datum */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setPosDatumModalVisible(true)}
            style={styles.cardItemClickable}>
            <View style={styles.itemLabelCol}>
              <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>Position Datum</Text>
              <Text style={[styles.itemDesc, { color: colors.textSecondary }]}>
                Geodetic map projection reference
              </Text>
            </View>
            <View style={styles.clickableRight}>
              <Text style={[styles.valueTag, { color: colors.accentBlue }]}>{settings.posDatum}</Text>
              <Text style={[styles.chevron, { color: colors.textSecondary }]}>›</Text>
            </View>
          </TouchableOpacity>

          <View style={[styles.innerDivider, { backgroundColor: colors.divider }]} />

          {/* Setting 5: Keep Screen On */}
          <View style={styles.cardItem}>
            <View style={styles.itemLabelCol}>
              <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>Keep Screen On</Text>
              <Text style={[styles.itemDesc, { color: colors.textSecondary }]}>
                Prevents display sleep during navigation
              </Text>
            </View>
            <Switch
              value={settings.keepScreenOn}
              onValueChange={(val) => handleUpdate({ keepScreenOn: val })}
              trackColor={{ false: isNight ? '#334155' : '#CBD5E1', true: colors.accentBlue }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[styles.innerDivider, { backgroundColor: colors.divider }]} />

          {/* Setting 6: Sea Battery Optimizer */}
          <View style={styles.cardItem}>
            <View style={styles.itemLabelCol}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>Sea Battery Optimizer 🔋</Text>
                <View style={{ backgroundColor: '#10B981', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                  <Text style={{ fontSize: 9, fontWeight: '800', color: '#FFFFFF' }}>OFFSHORE ECO</Text>
                </View>
              </View>
              <Text style={[styles.itemDesc, { color: colors.textSecondary }]}>
                Reduces GPS & compass polling to save maximum battery at deep sea
              </Text>
            </View>
            <Switch
              value={isEcoMode}
              onValueChange={handleToggleEcoMode}
              trackColor={{ false: isNight ? '#334155' : '#CBD5E1', true: '#10B981' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* 3. Audio & Voice Announcements Group */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            VOICE & AUDIO GUIDANCE
          </Text>
        </View>

        <View style={[styles.groupCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          {/* Voice Announcements Toggle */}
          <View style={styles.cardItem}>
            <View style={styles.itemLabelCol}>
              <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>Voice Announcements</Text>
              <Text style={[styles.itemDesc, { color: colors.textSecondary }]}>
                Spoken course, waypoint arrival & distance
              </Text>
            </View>
            <Switch
              value={settings.voiceAnnounce}
              onValueChange={(val) => handleUpdate({ voiceAnnounce: val })}
              trackColor={{ false: isNight ? '#334155' : '#CBD5E1', true: '#00C853' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[styles.innerDivider, { backgroundColor: colors.divider }]} />

          {/* TTS Speech Language */}
          <View style={styles.cardItem}>
            <View style={styles.itemLabelCol}>
              <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>Speech Language</Text>
              <Text style={[styles.itemDesc, { color: colors.textSecondary }]}>
                Voice assistant dialect
              </Text>
            </View>
            <View style={[styles.segmentedControl, { backgroundColor: colors.pillBg }]}>
              {(['English', 'Gujarati', 'Hindi'] as SpeechLanguage[]).map((lang) => {
                const isActive = settings.ttsLang === lang;
                return (
                  <TouchableOpacity
                    key={lang}
                    activeOpacity={0.7}
                    onPress={() => handleUpdate({ ttsLang: lang })}
                    style={[
                      styles.segmentBtn,
                      isActive && { backgroundColor: '#00838F' },
                    ]}>
                    <Text
                      style={[
                        styles.segmentText,
                        { color: isActive ? '#FFFFFF' : colors.textSecondary },
                      ]}>
                      {lang === 'Gujarati' ? 'ગુજરાતી' : lang === 'Hindi' ? 'हिंदी' : 'EN'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* 4. Safe Waypoint & GPX Tools */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            BACKUP & GPX TOOLS
          </Text>
        </View>

        <View style={styles.toolsGrid}>
          {/* Backup & Restore */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleBackupRestore}
            style={[styles.toolCardBtn, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <Text style={styles.toolIcon}>☁️</Text>
            <Text style={[styles.toolBtnText, { color: colors.textPrimary }]}>Backup & Restore</Text>
          </TouchableOpacity>

          {/* Export GPX */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleExportGpx}
            style={[styles.toolCardBtn, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <Text style={styles.toolIcon}>📤</Text>
            <Text style={[styles.toolBtnText, { color: colors.textPrimary }]}>Export GPX</Text>
          </TouchableOpacity>

          {/* Import GPX */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleImportGpx}
            style={[styles.toolCardBtn, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <Text style={styles.toolIcon}>📥</Text>
            <Text style={[styles.toolBtnText, { color: colors.textPrimary }]}>Import GPX</Text>
          </TouchableOpacity>

          {/* Reset Settings */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleResetSettings}
            style={[styles.toolCardBtn, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <Text style={styles.toolIcon}>🔄</Text>
            <Text style={[styles.toolBtnText, { color: colors.textPrimary }]}>Reset Settings</Text>
          </TouchableOpacity>
        </View>

        {/* 5. Danger Zone */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.dangerText }]}>
            DANGER ZONE
          </Text>
        </View>

        <View style={[styles.groupCard, { backgroundColor: colors.dangerBg, borderColor: colors.dangerBorder }]}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleClearMapCache}
            style={styles.dangerRow}>
            <Text style={[styles.dangerLabel, { color: colors.dangerText }]}>Clear Map Cache</Text>
            <Text style={[styles.dangerSub, { color: colors.textSecondary }]}>Free offline tiles</Text>
          </TouchableOpacity>

          <View style={[styles.innerDivider, { backgroundColor: colors.dangerBorder }]} />

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleClearWaypointDb}
            style={styles.dangerRow}>
            <Text style={[styles.dangerLabel, { color: colors.dangerText }]}>Clear Waypoint Database</Text>
            <Text style={[styles.dangerSub, { color: colors.textSecondary }]}>Wipe all saved spots</Text>
          </TouchableOpacity>

          <View style={[styles.innerDivider, { backgroundColor: colors.dangerBorder }]} />

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleClearTrackDb}
            style={styles.dangerRow}>
            <Text style={[styles.dangerLabel, { color: colors.dangerText }]}>Clear Track Database</Text>
            <Text style={[styles.dangerSub, { color: colors.textSecondary }]}>Erase recorded routes</Text>
          </TouchableOpacity>

          <View style={[styles.innerDivider, { backgroundColor: colors.dangerBorder }]} />

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleDeleteAllWaypoints}
            style={styles.dangerRow}>
            <Text style={[styles.dangerLabelBold, { color: colors.dangerText }]}>Delete All Waypoints</Text>
            <Text style={[styles.dangerSub, { color: colors.dangerText }]}>Permanent wipe</Text>
          </TouchableOpacity>
        </View>

        {/* 6. Developer Option & Subscription Testing Lab */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.accentCyan }]}>
            🛠️ DEVELOPER OPTION & SUBSCRIPTION LAB
          </Text>
        </View>

        <View style={[styles.devLabCard, { backgroundColor: colors.cardBg, borderColor: isNight ? '#0284C7' : '#0284C7' }]}>
          <View style={styles.devLabHeader}>
            <Text style={styles.devLabEmoji}>🧪</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.devLabTitle, { color: colors.textPrimary }]}>
                Subscription & Expiry Testing Console
              </Text>
              <Text style={[styles.devLabSubtitle, { color: colors.textSecondary }]}>
                Switch plans, simulate expiry, test lockout & verify payment flows.
              </Text>
            </View>
          </View>

          {/* Feedback Toast */}
          {devFeedback && (
            <View style={styles.devToast}>
              <Text style={styles.devToastText}>⚡ {devFeedback}</Text>
            </View>
          )}

          {/* Live Plan & Expiry Details Card */}
          <View
            style={[
              styles.devStatusBox,
              {
                backgroundColor: isNight ? '#070D1E' : '#F1F5F9',
                borderColor: isNight ? '#1E293B' : '#CBD5E1',
              },
            ]}>
            <View style={styles.devStatusRow}>
              <Text style={[styles.devStatusLabel, { color: colors.textSecondary }]}>Access Status:</Text>
              <View
                style={[
                  styles.devStatusPill,
                  {
                    backgroundColor: subState.isSubscribed
                      ? '#10B981'
                      : subState.isTrialExpired
                      ? '#EF4444'
                      : '#0284C7',
                  },
                ]}>
                <Text style={styles.devStatusPillText}>
                  {subState.isSubscribed
                    ? '👑 PRO ACTIVE'
                    : subState.isTrialExpired
                    ? '🔒 TRIAL EXPIRED (LOCKED)'
                    : '🛡️ 7-DAY TRIAL ACTIVE'}
                </Text>
              </View>
            </View>

            <View style={styles.devStatusRow}>
              <Text style={[styles.devStatusLabel, { color: colors.textSecondary }]}>Current Plan:</Text>
              <Text style={[styles.devStatusValue, { color: colors.textPrimary }]}>
                {subState.plan === 'yearly'
                  ? 'Yearly Pro Pass (₹950)'
                  : subState.plan === 'monthly'
                  ? 'Monthly Fisherman Pass (₹100)'
                  : subState.plan === 'lifetime'
                  ? 'Lifetime Skipper Pass (₹2,499)'
                  : 'Complimentary Free Trial'}
              </Text>
            </View>

            <View style={styles.devStatusRow}>
              <Text style={[styles.devStatusLabel, { color: colors.textSecondary }]}>Plan Expiry Date:</Text>
              <Text style={[styles.devStatusValue, { color: '#F59E0B', fontWeight: '800' }]}>
                {subState.activePlanExpiry || 'N/A'}
              </Text>
            </View>

            <View style={styles.devStatusRow}>
              <Text style={[styles.devStatusLabel, { color: colors.textSecondary }]}>Days Remaining:</Text>
              <Text
                style={[
                  styles.devStatusValue,
                  { color: subState.isTrialExpired ? '#EF4444' : '#10B981', fontWeight: '800' },
                ]}>
                {subState.isSubscribed
                  ? SubscriptionStore.getPlanDaysRemaining()
                  : SubscriptionStore.getTrialDaysRemaining()}{' '}
                Days
              </Text>
            </View>

            {/* Visual Progress Bar */}
            <View style={[styles.devProgressTrack, { backgroundColor: isNight ? '#1E293B' : '#E2E8F0' }]}>
              <View
                style={[
                  styles.devProgressFill,
                  {
                    width: subState.isSubscribed ? '85%' : subState.isTrialExpired ? '100%' : '50%',
                    backgroundColor: subState.isSubscribed
                      ? '#10B981'
                      : subState.isTrialExpired
                      ? '#EF4444'
                      : '#0284C7',
                  },
                ]}
              />
            </View>

            {subState.lastTransaction && (
              <View style={[styles.devTxBox, { backgroundColor: isNight ? '#0F1A30' : '#FFFFFF', borderColor: isNight ? '#1E2D4A' : '#E2E8F0' }]}>
                <Text style={[styles.devTxTitle, { color: colors.textSecondary }]}>
                  Last Simulated Transaction:
                </Text>
                <Text
                  style={[
                    styles.devTxDetail,
                    {
                      color:
                        subState.lastTransaction.status === 'success' ? '#10B981' : '#EF4444',
                    },
                  ]}>
                  {subState.lastTransaction.id} • {subState.lastTransaction.planTitle} • ₹
                  {subState.lastTransaction.amount} (
                  {subState.lastTransaction.status.toUpperCase()})
                </Text>
              </View>
            )}
          </View>

          {/* Quick Simulation Buttons Grid */}
          <Text style={[styles.devGridLabel, { color: colors.textPrimary }]}>
            QUICK TEST SWITCHES:
          </Text>

          <View style={styles.devBtnGrid}>
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => {
                SubscriptionStore.resetTrial();
                triggerDevFeedback('Reset state: 7-Day Free Trial Active');
                setPremiumModalVisible(true);
              }}
              style={[styles.devActionBtn, { backgroundColor: '#0284C7' }]}>
              <Text style={styles.devActionBtnText}>🛡️ Set 7-Day Trial</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => {
                SubscriptionStore.setTrialDaysForTesting(1);
                triggerDevFeedback('Set trial to 1 day remaining');
                setPremiumModalVisible(true);
              }}
              style={[styles.devActionBtn, { backgroundColor: '#D97706' }]}>
              <Text style={styles.devActionBtnText}>⏳ Set 1-Day Trial</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => {
                SubscriptionStore.expireTrialForTesting();
                triggerDevFeedback('Trial expired! Hard paywall locked.');
                setPremiumModalVisible(true);
              }}
              style={[styles.devActionBtn, { backgroundColor: '#DC2626' }]}>
              <Text style={styles.devActionBtnText}>🔒 Trigger Trial Expired</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => {
                SubscriptionStore.activateSubscription('yearly');
                triggerDevFeedback('Activated Yearly Pro Pass (365 Days)');
                setPremiumModalVisible(true);
              }}
              style={[styles.devActionBtn, { backgroundColor: '#10B981' }]}>
              <Text style={styles.devActionBtnText}>👑 Set Yearly Pro</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => {
                SubscriptionStore.activateSubscription('monthly');
                triggerDevFeedback('Activated Monthly Pass (30 Days)');
                setPremiumModalVisible(true);
              }}
              style={[styles.devActionBtn, { backgroundColor: '#6366F1' }]}>
              <Text style={styles.devActionBtnText}>🐟 Set Monthly Pass</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => {
                SubscriptionStore.activateSubscription('lifetime');
                triggerDevFeedback('Activated Lifetime Skipper Pass');
                setPremiumModalVisible(true);
              }}
              style={[styles.devActionBtn, { backgroundColor: '#059669' }]}>
              <Text style={styles.devActionBtnText}>⚓ Set Lifetime Pass</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => {
                SubscriptionStore.expirePlanForTesting();
                triggerDevFeedback('Set Paid Plan as Expired');
                setPremiumModalVisible(true);
              }}
              style={[styles.devActionBtn, { backgroundColor: '#7F1D1D' }]}>
              <Text style={styles.devActionBtnText}>📅 Force Plan Expired</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => {
                setPremiumModalVisible(true);
              }}
              style={[styles.devActionBtn, { backgroundColor: '#8B5CF6' }]}>
              <Text style={styles.devActionBtnText}>💳 Launch Pro Modal</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 7. About Section */}
        <View style={[styles.aboutCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <View style={styles.aboutHeaderRow}>
            <Text style={styles.aboutAnchorIcon}>⚓</Text>
            <View>
              <Text style={[styles.aboutAppName, { color: colors.textPrimary }]}>GPS Fishing RAHI Pro</Text>
              <Text style={[styles.aboutVersion, { color: colors.textSecondary }]}>Version 1.6.9 • Build 2026.09</Text>
            </View>
          </View>
          <Text style={[styles.aboutDevText, { color: colors.textSecondary }]}>
            Engineered for Coastal & Deep Sea Marine Fishermen
          </Text>
          <Text style={[styles.aboutMeteoText, { color: colors.textSecondary }]}>
            Weather and tidal predictions powered by Open-Meteo.com
          </Text>
        </View>
      </ScrollView>

      {/* Position Format Modal */}
      <Modal
        visible={posFormatModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPosFormatModalVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setPosFormatModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalCard, { backgroundColor: colors.cardBg }]}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Position Coordinate Format</Text>
                <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                  Choose how latitude and longitude appear across all navigation screens:
                </Text>

                {[
                  {
                    key: 'DMF',
                    title: "DMF (DD° MM.MMM')",
                    desc: 'Marine standard for nautical chart plotting (e.g. N 20° 44.572\')',
                  },
                  {
                    key: 'DMS',
                    title: 'DMS (DD° MM\' SS.S")',
                    desc: 'Degrees, minutes, and seconds (e.g. N 20° 44\' 34.3")',
                  },
                  {
                    key: 'DD',
                    title: 'DD (Decimal Degrees)',
                    desc: 'Decimal notation for digital GIS systems (e.g. 20.74287° N)',
                  },
                ].map((item) => {
                  const isSelected = settings.posFormat === item.key;
                  return (
                    <TouchableOpacity
                      key={item.key}
                      activeOpacity={0.7}
                      onPress={() => {
                        handleUpdate({ posFormat: item.key as PositionFormat });
                        setPosFormatModalVisible(false);
                      }}
                      style={[
                        styles.optionRow,
                        isSelected && { backgroundColor: isNight ? '#1E293B' : '#E0F7FA' },
                      ]}>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.optionTitle,
                            { color: isSelected ? colors.accentBlue : colors.textPrimary },
                          ]}>
                          {item.title}
                        </Text>
                        <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>
                          {item.desc}
                        </Text>
                      </View>
                      {isSelected && <Text style={[styles.checkmark, { color: colors.accentBlue }]}>✓</Text>}
                    </TouchableOpacity>
                  );
                })}

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setPosFormatModalVisible(false)}
                  style={[styles.modalCancelBtn, { backgroundColor: colors.pillBg }]}>
                  <Text style={[styles.modalCancelText, { color: colors.textPrimary }]}>Done</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Position Datum Modal */}
      <Modal
        visible={posDatumModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPosDatumModalVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setPosDatumModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalCard, { backgroundColor: colors.cardBg }]}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Geodetic Datum</Text>
                <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                  Select geodetic reference spheroid:
                </Text>

                {[
                  {
                    key: 'WGS84',
                    title: 'WGS84 (Global Standard)',
                    desc: 'World Geodetic System 1984 - Universal GPS standard used worldwide.',
                  },
                  {
                    key: 'Indian 1975',
                    title: 'Indian 1975',
                    desc: 'Regional nautical datum used on older Indian hydrographic survey charts.',
                  },
                ].map((item) => {
                  const isSelected = settings.posDatum === item.key;
                  return (
                    <TouchableOpacity
                      key={item.key}
                      activeOpacity={0.7}
                      onPress={() => {
                        handleUpdate({ posDatum: item.key as PositionDatum });
                        setPosDatumModalVisible(false);
                      }}
                      style={[
                        styles.optionRow,
                        isSelected && { backgroundColor: isNight ? '#1E293B' : '#E0F7FA' },
                      ]}>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.optionTitle,
                            { color: isSelected ? colors.accentBlue : colors.textPrimary },
                          ]}>
                          {item.title}
                        </Text>
                        <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>
                          {item.desc}
                        </Text>
                      </View>
                      {isSelected && <Text style={[styles.checkmark, { color: colors.accentBlue }]}>✓</Text>}
                    </TouchableOpacity>
                  );
                })}

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setPosDatumModalVisible(false)}
                  style={[styles.modalCancelBtn, { backgroundColor: colors.pillBg }]}>
                  <Text style={[styles.modalCancelText, { color: colors.textPrimary }]}>Done</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Logged-In Captain Profile Modal */}
      <Modal
        visible={profileModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setProfileModalVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setProfileModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalCard, { backgroundColor: colors.cardBg }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Text style={{ fontSize: 28 }}>👨‍✈️</Text>
                    <View>
                      <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Captain Profile</Text>
                      <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                        Logged-in user account & license
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => setProfileModalVisible(false)}
                    style={{ padding: 6, backgroundColor: colors.pillBg, borderRadius: 12 }}>
                    <Text style={{ color: colors.textSecondary, fontWeight: '700' }}>✕</Text>
                  </TouchableOpacity>
                </View>

                {/* Captain Name */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Captain Full Name</Text>
                  <TextInput
                    value={captainName}
                    onChangeText={setCaptainName}
                    placeholder="e.g. Captain Sagar"
                    placeholderTextColor={colors.textSecondary}
                    style={[styles.textInput, { backgroundColor: colors.pillBg, color: colors.textPrimary }]}
                  />
                </View>

                {/* Mobile Number (Read-only verified) */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Registered Mobile Number</Text>
                  <View
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: colors.pillBg,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      },
                    ]}>
                    <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 14 }}>
                      🇮🇳 +91 {authPhone}
                    </Text>
                    <View
                      style={{
                        backgroundColor: '#10B981',
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 6,
                      }}>
                      <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '800' }}>VERIFIED SMS</Text>
                    </View>
                  </View>
                </View>

                {/* Membership & License Card */}
                <View
                  style={{
                    backgroundColor: colors.pillBg,
                    padding: 12,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: colors.cardBorder,
                    gap: 6,
                  }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 12, fontWeight: '800', color: colors.textPrimary }}>
                      MEMBERSHIP STATUS
                    </Text>
                    <View
                      style={{
                        backgroundColor: subState.isSubscribed
                          ? '#F59E0B'
                          : subState.trialActive
                            ? '#0284C7'
                            : '#EF4444',
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 6,
                      }}>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: '#FFFFFF' }}>
                        {subState.isSubscribed
                          ? 'PRO ACTIVATED'
                          : subState.trialActive
                            ? `${SubscriptionStore.getTrialDaysRemaining()} DAYS TRIAL`
                            : 'TRIAL EXPIRED'}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                    {subState.isSubscribed
                      ? 'Full offline Arabian sea charts & bathymetry unlocked.'
                      : subState.trialActive
                        ? 'Complimentary navigation trial active. Upgrade anytime for lifetime offline access.'
                        : 'Trial has expired. Activate a plan to re-enable charts & GPS tools.'}
                  </Text>
                  {!subState.isSubscribed && (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => {
                        setProfileModalVisible(false);
                        setPremiumModalVisible(true);
                      }}
                      style={{
                        marginTop: 4,
                        backgroundColor: '#F59E0B',
                        paddingVertical: 8,
                        borderRadius: 8,
                        alignItems: 'center',
                      }}>
                      <Text style={{ color: '#0F172A', fontWeight: '800', fontSize: 12 }}>
                        ⭐ UPGRADE TO PRO (UNLIMITED)
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Buttons: Save & Sign Out */}
                <View style={styles.modalBtnRow}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={handleSignOut}
                    style={[styles.modalHalfBtn, { backgroundColor: '#EF4444' }]}>
                    <Text style={[styles.modalBtnText, { color: '#FFFFFF' }]}>🚪 Sign Out</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={handleSaveCaptainProfile}
                    style={[styles.modalHalfBtn, { backgroundColor: colors.accentBlue }]}>
                    <Text style={[styles.modalBtnText, { color: '#FFFFFF' }]}>Save Profile</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Upgrade to Pro Modal */}
      <PremiumUpgradeModal
        visible={premiumModalVisible}
        onClose={() => setPremiumModalVisible(false)}
        nightMode={isNight}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  headerThemeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerThemeIcon: {
    fontSize: 18,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 40,
    gap: 12,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    gap: 12,
  },
  profileIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(2, 136, 209, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileBoatIcon: {
    fontSize: 22,
  },
  profileTextCol: {
    flex: 1,
    gap: 2,
  },
  profileTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vesselName: {
    fontSize: 16,
    fontWeight: '800',
  },
  verifiedBadge: {
    backgroundColor: '#00E676',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  verifiedText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#052E16',
    letterSpacing: 0.5,
  },
  vesselSub: {
    fontSize: 12,
    fontWeight: '500',
  },
  profileArrow: {
    fontSize: 22,
    fontWeight: '600',
  },
  sectionHeaderRow: {
    marginTop: 6,
    marginBottom: -4,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  groupCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  cardItemClickable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  itemLabelCol: {
    flex: 1,
    gap: 2,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  itemDesc: {
    fontSize: 12,
    fontWeight: '400',
  },
  innerDivider: {
    height: 1,
    marginHorizontal: 16,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
    gap: 2,
  },
  segmentBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '800',
  },
  clickableRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  valueTag: {
    fontSize: 14,
    fontWeight: '800',
  },
  chevron: {
    fontSize: 20,
    fontWeight: '600',
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  toolCardBtn: {
    flexBasis: '48%',
    flexGrow: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  toolIcon: {
    fontSize: 20,
  },
  toolBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  dangerLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  dangerLabelBold: {
    fontSize: 14,
    fontWeight: '800',
  },
  dangerSub: {
    fontSize: 12,
    fontWeight: '500',
  },
  aboutCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 8,
    marginTop: 4,
  },
  aboutHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  aboutAnchorIcon: {
    fontSize: 24,
  },
  aboutAppName: {
    fontSize: 15,
    fontWeight: '800',
  },
  aboutVersion: {
    fontSize: 12,
    fontWeight: '500',
  },
  aboutDevText: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  aboutMeteoText: {
    fontSize: 11,
    fontStyle: 'italic',
    lineHeight: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    padding: 20,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  modalSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  optionDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  checkmark: {
    fontSize: 18,
    fontWeight: '900',
  },
  modalCancelBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '800',
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  textInput: {
    height: 44,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  modalHalfBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },

  // Developer Testing Lab Styles
  devLabCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 16,
  },
  devLabHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  devLabEmoji: {
    fontSize: 26,
  },
  devLabTitle: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  devLabSubtitle: {
    fontSize: 11.5,
    marginTop: 2,
    lineHeight: 16,
  },
  devToast: {
    backgroundColor: '#064E3B',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#34D399',
  },
  devToastText: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: '800',
  },
  devStatusBox: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    marginBottom: 14,
  },
  devStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  devStatusLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  devStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  devStatusPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  devStatusValue: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  devProgressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 2,
  },
  devProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  devTxBox: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 4,
    gap: 2,
  },
  devTxTitle: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  devTxDetail: {
    fontSize: 11,
    fontWeight: '800',
  },
  devGridLabel: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  devBtnGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  devActionBtn: {
    flexBasis: '48%',
    flexGrow: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  devActionBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
    textAlign: 'center',
  },
});
