import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackButton } from '@/components/ui/back-button';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TideEvent {
  type: 'high' | 'low';
  time: string;
  height: number;
}

interface PortTideData {
  portName: string;
  state: string;
  events: TideEvent[];
}

const PORTS_DATA: Record<string, PortTideData> = {
  Diu: {
    portName: 'Diu Port',
    state: 'Daman & Diu / Arabian Sea',
    events: [
      { type: 'high', time: '12:16 am', height: 2.10 },
      { type: 'low', time: '6:41 am', height: 0.90 },
      { type: 'high', time: '11:33 am', height: 1.70 },
      { type: 'low', time: '6:06 pm', height: 0.50 },
    ],
  },
  Veraval: {
    portName: 'Veraval Fishing Harbor',
    state: 'Gujarat / Arabian Sea',
    events: [
      { type: 'high', time: '12:35 am', height: 2.25 },
      { type: 'low', time: '7:02 am', height: 0.85 },
      { type: 'high', time: '11:58 am', height: 1.85 },
      { type: 'low', time: '6:28 pm', height: 0.45 },
    ],
  },
  Porbandar: {
    portName: 'Porbandar Port',
    state: 'Gujarat / Arabian Sea',
    events: [
      { type: 'high', time: '01:10 am', height: 2.40 },
      { type: 'low', time: '7:35 am', height: 0.95 },
      { type: 'high', time: '12:30 pm', height: 1.95 },
      { type: 'low', time: '7:00 pm', height: 0.55 },
    ],
  },
  Okha: {
    portName: 'Okha Port',
    state: 'Gulf of Kutch',
    events: [
      { type: 'high', time: '02:05 am', height: 3.10 },
      { type: 'low', time: '8:25 am', height: 1.10 },
      { type: 'high', time: '01:45 pm', height: 2.65 },
      { type: 'low', time: '8:05 pm', height: 0.65 },
    ],
  },
  Jafarabad: {
    portName: 'Jafarabad Fishing Harbor',
    state: 'Gujarat',
    events: [
      { type: 'high', time: '12:05 am', height: 2.05 },
      { type: 'low', time: '6:30 am', height: 0.85 },
      { type: 'high', time: '11:20 am', height: 1.65 },
      { type: 'low', time: '5:55 pm', height: 0.45 },
    ],
  },
};

const TRANSLATIONS = {
  English: {
    port: 'Port:',
    selectPort: 'Select Port',
    language: 'Language:',
    selectLanguage: 'Select Language',
    openSunMoon: '🌙 Open Sun Moon Info',
    tideTable: '📊 Tide Table',
    highTide: 'High tide at',
    lowTide: 'Low tide at',
    fishingAdvice: 'Optimal Fishing Window',
    optimalAdviceText: 'Best boat netting & reef fishing: 2 hours before High Tide (Slack water change).',
    tideGraph: '24-HOUR TIDAL WAVE (METERS)',
    currentWaterLevel: 'Live Level',
    rising: 'WATER RISING (FLOOD)',
    falling: 'WATER RECEDING (EBB)',
  },
  Gujarati: {
    port: 'બંદર (Port):',
    selectPort: 'બંદર પસંદ કરો',
    language: 'ભાષા (Language):',
    selectLanguage: 'ભાષા પસંદ કરો',
    openSunMoon: '🌙 સૂર્ય-ચંદ્ર માહિતી (Sun Moon Info)',
    tideTable: '📊 ભરતી-ઓટ પત્રક (Tide Table)',
    highTide: 'ભરતી (High tide)',
    lowTide: 'ઓટ (Low tide)',
    fishingAdvice: 'માછીમારી માટે ઉત્તમ સમય',
    optimalAdviceText: 'ભરતી ચઢવાના ૨ કલાક પહેલા માછલી પકડવા માટે સૌથી અનુકૂળ સમય છે.',
    tideGraph: '૨૪ કલાકની ભરતી મોજાં (ઊંચાઈ મીટરમાં)',
    currentWaterLevel: 'હાલનું જળસ્તર',
    rising: 'ભરતી ચાલુ છે (પાણી ચઢે છે)',
    falling: 'ઓટ ચાલુ છે (પાણી ઉતરે છે)',
  },
  Hindi: {
    port: 'बंदरगाह (Port):',
    selectPort: 'बंदरगाह चुनें',
    language: 'भाषा (Language):',
    selectLanguage: 'भाषा चुनें',
    openSunMoon: '🌙 सूर्य-चंद्रमा जानकारी (Sun Moon Info)',
    tideTable: '📊 ज्वार-भाटा तालिका (Tide Table)',
    highTide: 'ज्वार (High tide)',
    lowTide: 'भाटा (Low tide)',
    fishingAdvice: 'मछली पकड़ने का सर्वोत्तम समय',
    optimalAdviceText: 'उच्च ज्वार से २ घंटे पहले मछली पकड़ने और जाल डालने का सबसे अच्छा समय।',
    tideGraph: '२४ घंटे का ज्वार तरंग ग्राफ (मीटर)',
    currentWaterLevel: 'वर्तमान जलस्तर',
    rising: 'पानी चढ़ रहा है (Flood)',
    falling: 'पानी उतर रहा है (Ebb)',
  },
};

export default function TideScreen() {
  const router = useRouter();

  // State
  const [selectedPort, setSelectedPort] = useState<string>('Diu');
  const [selectedLang, setSelectedLang] = useState<'English' | 'Gujarati' | 'Hindi'>('Gujarati');
  const [selectedDate, setSelectedDate] = useState<string>('2026-09-25');
  const [showPortModal, setShowPortModal] = useState<boolean>(false);
  const [showLangModal, setShowLangModal] = useState<boolean>(false);
  const [showSunMoonModal, setShowSunMoonModal] = useState<boolean>(false);

  const t = TRANSLATIONS[selectedLang];
  const portData = PORTS_DATA[selectedPort] || PORTS_DATA['Diu'];

  // Wave points for 24 hours (12AM, 3AM, 6AM, 9AM, 12PM, 3PM, 6PM, 9PM, 12AM)
  // Heights roughly matching Diu: High 2.1m (12AM) -> Low 0.9m (6AM) -> High 1.7m (12PM) -> Low 0.5m (6PM) -> Rising 2.0m (12AM)
  const wavePoints = [
    { time: '12AM', h: 2.10, pct: 85 },
    { time: '3AM', h: 1.50, pct: 58 },
    { time: '6AM', h: 0.90, pct: 35 },
    { time: '9AM', h: 1.30, pct: 52 },
    { time: '12PM', h: 1.70, pct: 68 },
    { time: '3PM', h: 1.10, pct: 45 },
    { time: '6PM', h: 0.50, pct: 20 },
    { time: '9PM', h: 1.20, pct: 48 },
    { time: '12AM', h: 2.05, pct: 82 },
  ];

  const handlePrevDay = () => {
    setSelectedDate('2026-09-24');
  };

  const handleNextDay = () => {
    setSelectedDate('2026-09-26');
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.container}>
      <StatusBar style="dark" animated={true} />

      {/* Screen Header */}
      <View style={styles.topHeader}>
        <BackButton showLabel={true} label="Home" />

        <Text style={styles.screenTitle}>TIDE & WATER LEVEL</Text>

        <View style={styles.liveIndicator}>
          <View style={styles.greenPulse} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}>
        {/* TOP SELECTORS: PORT & LANGUAGE (Exact Match with Screenshot) */}
        <View style={styles.selectorsRow}>
          {/* Port Selector */}
          <View style={styles.selectorCol}>
            <Text style={styles.selectorMainLabel}>{t.port}</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowPortModal(true)}
              style={styles.selectorCard}>
              <Text style={styles.selectorCardHint}>{t.selectPort}</Text>
              <View style={styles.selectorValueRow}>
                <Text style={styles.selectorCardValue}>{selectedPort}</Text>
                <Text style={styles.dropdownCaret}>▾</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Language Selector */}
          <View style={styles.selectorCol}>
            <Text style={styles.selectorMainLabel}>{t.language}</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowLangModal(true)}
              style={styles.selectorCard}>
              <Text style={styles.selectorCardHint}>{t.selectLanguage}</Text>
              <View style={styles.selectorValueRow}>
                <Text style={styles.selectorCardValue}>{selectedLang}</Text>
                <Text style={styles.dropdownCaret}>▾</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* BLUE BUTTON: OPEN SUN MOON INFO */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => setShowSunMoonModal(true)}
          style={styles.sunMoonBtn}>
          <Text style={styles.sunMoonBtnText}>{t.openSunMoon}</Text>
        </TouchableOpacity>

        {/* DATE & MOON STATUS ROW */}
        <View style={styles.dateRow}>
          <View style={styles.dateBadgeWrap}>
            <Text style={styles.calendarIconEmoji}>📅</Text>
            <TouchableOpacity onPress={handlePrevDay} style={styles.dateArrowBtn}>
              <Text style={styles.dateArrowText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.dateText}>{selectedDate}</Text>
            <TouchableOpacity onPress={handleNextDay} style={styles.dateArrowBtn}>
              <Text style={styles.dateArrowText}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.moonStatusBadge}>
            <Text style={styles.moonStatusEmoji}>🌙</Text>
            <Text style={styles.moonStatusText}>Full Moon (99%)</Text>
          </View>
        </View>

        {/* TIDE TABLE SECTION */}
        <View style={styles.tideTableCard}>
          <Text style={styles.tideTableTitle}>{t.tideTable}</Text>
          <View style={styles.tideList}>
            {portData.events.map((evt, idx) => (
              <View key={idx} style={styles.tideEventRow}>
                <Text style={[styles.tideBullet, { color: evt.type === 'high' ? '#1E88E5' : '#FB8C00' }]}>
                  •
                </Text>
                <Text style={styles.tideEventText}>
                  {evt.type === 'high' ? t.highTide : t.lowTide}{' '}
                  <Text style={styles.tideTimeBold}>{evt.time}</Text> —{' '}
                  <Text
                    style={[
                      styles.tideHeightBold,
                      { color: evt.type === 'high' ? '#0D47A1' : '#E65100' },
                    ]}>
                    {evt.height.toFixed(2)} m
                  </Text>
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* FISHING ADVICE BANNER */}
        <View style={styles.fishingAdviceCard}>
          <View style={styles.adviceHeaderRow}>
            <Text style={styles.adviceIcon}>🎣</Text>
            <Text style={styles.adviceTitle}>{t.fishingAdvice}</Text>
          </View>
          <Text style={styles.adviceBody}>{t.optimalAdviceText}</Text>
        </View>

        {/* 24-HOUR TIDAL WAVE GRAPH (Full Width Visual Chart from Screenshot) */}
        <View style={styles.graphContainer}>
          <View style={styles.graphHeader}>
            <Text style={styles.graphDateLabel}>{selectedDate.slice(5)} (24H TIDE)</Text>
            <View style={styles.currentStatusPill}>
              <Text style={styles.currentStatusText}>{t.falling}</Text>
            </View>
          </View>

          {/* Chart Canvas Area */}
          <View style={styles.chartCanvas}>
            {/* Depth Level Gridlines (0.5m, 1.0m, 1.5m, 2.0m, 2.5m) */}
            <View style={[styles.gridLine, { top: '15%' }]}>
              <Text style={styles.gridLineLabel}>2.5 m</Text>
            </View>
            <View style={[styles.gridLine, { top: '35%' }]}>
              <Text style={styles.gridLineLabel}>2.0 m</Text>
            </View>
            <View style={[styles.gridLine, { top: '55%' }]}>
              <Text style={styles.gridLineLabel}>1.5 m</Text>
            </View>
            <View style={[styles.gridLine, { top: '75%' }]}>
              <Text style={styles.gridLineLabel}>1.0 m</Text>
            </View>

            {/* Simulated Ocean Water Wave Curve */}
            <View style={styles.waveGraphicWrap}>
              {/* Dynamic Ocean Wave Blocks recreating the smooth tidal sine wave */}
              <View style={[styles.wavePillar, { height: '85%', borderTopRightRadius: 28 }]} />
              <View style={[styles.wavePillar, { height: '65%', borderTopRightRadius: 24 }]} />
              <View style={[styles.wavePillar, { height: '45%', borderTopLeftRadius: 16, borderTopRightRadius: 16 }]} />
              <View style={[styles.wavePillar, { height: '35%', borderTopLeftRadius: 18 }]} />
              <View style={[styles.wavePillar, { height: '52%', borderTopRightRadius: 22 }]} />
              <View style={[styles.wavePillar, { height: '68%', borderTopLeftRadius: 26, borderTopRightRadius: 26 }]} />
              <View style={[styles.wavePillar, { height: '50%', borderTopLeftRadius: 20 }]} />
              <View style={[styles.wavePillar, { height: '22%', borderTopLeftRadius: 16 }]} />
              <View style={[styles.wavePillar, { height: '40%', borderTopRightRadius: 20 }]} />
              <View style={[styles.wavePillar, { height: '65%', borderTopLeftRadius: 24 }]} />
            </View>

            {/* Live Time Indicator Marker (At ~ 08:15 PM) */}
            <View style={[styles.liveTimeMarker, { left: '78%' }]}>
              <View style={styles.liveMarkerDot} />
              <View style={styles.liveMarkerLine} />
              <View style={styles.liveHeightBadge}>
                <Text style={styles.liveHeightText}>1.05m</Text>
              </View>
            </View>
          </View>

          {/* Time Axis Labels: 12AM, 6AM, 12PM, 6PM, 12AM */}
          <View style={styles.timeAxisRow}>
            <Text style={styles.timeAxisLabel}>12AM</Text>
            <Text style={styles.timeAxisLabel}>6AM</Text>
            <Text style={styles.timeAxisLabel}>12PM</Text>
            <Text style={styles.timeAxisLabel}>6PM</Text>
            <Text style={styles.timeAxisLabel}>12AM</Text>
          </View>
        </View>
      </ScrollView>

      {/* PORT SELECTOR MODAL */}
      <Modal visible={showPortModal} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowPortModal(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.pickerCard}>
              <Text style={styles.pickerTitle}>⚓ Select Fishing Port</Text>
              {Object.keys(PORTS_DATA).map((portKey) => (
                <TouchableOpacity
                  key={portKey}
                  onPress={() => {
                    setSelectedPort(portKey);
                    setShowPortModal(false);
                  }}
                  style={[
                    styles.pickerOption,
                    selectedPort === portKey && styles.pickerOptionSelected,
                  ]}>
                  <Text
                    style={[
                      styles.pickerOptionText,
                      selectedPort === portKey && styles.pickerOptionTextSelected,
                    ]}>
                    {PORTS_DATA[portKey].portName}
                  </Text>
                  <Text style={styles.pickerOptionSub}>
                    {PORTS_DATA[portKey].state}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* LANGUAGE SELECTOR MODAL */}
      <Modal visible={showLangModal} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowLangModal(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.pickerCard}>
              <Text style={styles.pickerTitle}>🌐 Select Language</Text>
              {(['Gujarati', 'English', 'Hindi'] as const).map((lang) => (
                <TouchableOpacity
                  key={lang}
                  onPress={() => {
                    setSelectedLang(lang);
                    setShowLangModal(false);
                  }}
                  style={[
                    styles.pickerOption,
                    selectedLang === lang && styles.pickerOptionSelected,
                  ]}>
                  <Text
                    style={[
                      styles.pickerOptionText,
                      selectedLang === lang && styles.pickerOptionTextSelected,
                    ]}>
                    {lang === 'Gujarati'
                      ? 'ગુજરાતી (Gujarati)'
                      : lang === 'Hindi'
                      ? 'हिंदी (Hindi)'
                      : 'English'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* SUN MOON INFO MODAL */}
      <Modal visible={showSunMoonModal} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setShowSunMoonModal(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.sunMoonCard}>
              <Text style={styles.pickerTitle}>🌙 Solar & Lunar Astrological Tide Info</Text>
              <View style={styles.astroGrid}>
                <View style={styles.astroItem}>
                  <Text style={styles.astroLabel}>Sunrise</Text>
                  <Text style={styles.astroValue}>06:24 AM</Text>
                </View>
                <View style={styles.astroItem}>
                  <Text style={styles.astroLabel}>Sunset</Text>
                  <Text style={styles.astroValue}>06:38 PM</Text>
                </View>
                <View style={styles.astroItem}>
                  <Text style={styles.astroLabel}>Moonrise</Text>
                  <Text style={styles.astroValue}>05:46 PM</Text>
                </View>
                <View style={styles.astroItem}>
                  <Text style={styles.astroLabel}>Moonset</Text>
                  <Text style={styles.astroValue}>05:07 AM</Text>
                </View>
              </View>
              <View style={styles.solunarNoteBox}>
                <Text style={styles.solunarNoteText}>
                  🐟 <Text style={{ fontWeight: '800' }}>Tide Influence:</Text> Full Moon spring tide creates strongest currents. Excellent night fishing near reefs and rock structures!
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowSunMoonModal(false)}
                style={styles.closeModalBtn}>
                <Text style={styles.closeModalBtnText}>Done</Text>
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
    backgroundColor: '#FAFAFA',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 6,
  },
  backArrow: {
    fontSize: 28,
    fontWeight: '300',
    color: '#0D47A1',
    lineHeight: 28,
  },
  backLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0D47A1',
  },
  screenTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#102A43',
    letterSpacing: 0.5,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  greenPulse: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#00C853',
  },
  liveText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2E7D32',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 36,
    gap: 14,
  },
  selectorsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  selectorCol: {
    flex: 1,
  },
  selectorMainLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 6,
  },
  selectorCard: {
    borderWidth: 1.2,
    borderColor: '#CFD8DC',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    height: 58,
    justifyContent: 'space-between',
  },
  selectorCardHint: {
    fontSize: 11,
    color: '#78909C',
    fontWeight: '600',
  },
  selectorValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectorCardValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000000',
  },
  dropdownCaret: {
    fontSize: 16,
    color: '#546E7A',
  },
  sunMoonBtn: {
    backgroundColor: '#0D47A1', // Vibrant signature blue from screenshot
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0D47A1',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  sunMoonBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  dateBadgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  calendarIconEmoji: {
    fontSize: 18,
  },
  dateArrowBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  dateArrowText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0D47A1',
  },
  dateText: {
    fontSize: 17,
    fontWeight: '900',
    color: '#102A43',
    letterSpacing: 0.4,
  },
  moonStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  moonStatusEmoji: {
    fontSize: 16,
  },
  moonStatusText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#455A64',
  },
  tideTableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ECEFF1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    gap: 10,
  },
  tideTableTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0D47A1',
    letterSpacing: 0.2,
  },
  tideList: {
    gap: 8,
  },
  tideEventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tideBullet: {
    fontSize: 20,
    lineHeight: 20,
  },
  tideEventText: {
    fontSize: 15,
    color: '#263238',
    fontWeight: '500',
  },
  tideTimeBold: {
    fontWeight: '800',
    color: '#000000',
  },
  tideHeightBold: {
    fontWeight: '900',
  },
  fishingAdviceCard: {
    backgroundColor: '#E0F2F1',
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  adviceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  adviceIcon: {
    fontSize: 16,
  },
  adviceTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#00695C',
  },
  adviceBody: {
    fontSize: 12.5,
    lineHeight: 18,
    color: '#004D40',
    fontWeight: '600',
  },
  graphContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#CFD8DC',
    gap: 8,
  },
  graphHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  graphDateLabel: {
    fontSize: 15,
    fontWeight: '900',
    color: '#102A43',
  },
  currentStatusPill: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  currentStatusText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#E65100',
  },
  chartCanvas: {
    height: 220,
    width: '100%',
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#90A4AE',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#F5FBFF',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(144, 164, 174, 0.35)',
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  gridLineLabel: {
    fontSize: 9.5,
    color: '#78909C',
    fontWeight: '700',
    marginLeft: 4,
    marginTop: -12,
  },
  waveGraphicWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  wavePillar: {
    flex: 1,
    backgroundColor: '#2196F3',
    opacity: 0.85,
  },
  liveTimeMarker: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    alignItems: 'center',
  },
  liveMarkerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D50000',
    position: 'absolute',
    top: 60,
  },
  liveMarkerLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1.5,
    backgroundColor: '#D50000',
  },
  liveHeightBadge: {
    position: 'absolute',
    top: 40,
    backgroundColor: '#D50000',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  liveHeightText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  timeAxisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginTop: 4,
  },
  timeAxisLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#546E7A',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pickerCard: {
    width: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#102A43',
    marginBottom: 8,
  },
  pickerOption: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
  },
  pickerOptionSelected: {
    backgroundColor: '#E3F2FD',
    borderWidth: 1.5,
    borderColor: '#1976D2',
  },
  pickerOptionText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#263238',
  },
  pickerOptionTextSelected: {
    color: '#0D47A1',
    fontWeight: '900',
  },
  pickerOptionSub: {
    fontSize: 12,
    color: '#78909C',
    marginTop: 2,
  },
  sunMoonCard: {
    width: '92%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    gap: 14,
  },
  astroGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  astroItem: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: '#F1F5F9',
    padding: 12,
    borderRadius: 10,
    gap: 2,
  },
  astroLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  astroValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  solunarNoteBox: {
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 10,
  },
  solunarNoteText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#1B5E20',
  },
  closeModalBtn: {
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0D47A1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeModalBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
