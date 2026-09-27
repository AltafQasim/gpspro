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
  Switch,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackButton } from '@/components/ui/back-button';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CalendarDay {
  day: number;
  tithiNum: string; // Gujarati tithi numeral e.g. '૪', '૫', '૧૨', '૧૪'
  tithiName: string;
  isSpecial?: boolean;
}

export default function CalendarScreen() {
  const router = useRouter();

  // State
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);
  const [language, setLanguage] = useState<'Hindi' | 'Gujarati' | 'English'>('Hindi');
  const [selectedDay, setSelectedDay] = useState<number>(23);
  const [showSunMoonModal, setShowSunMoonModal] = useState<boolean>(false);
  const [showLangPicker, setShowLangPicker] = useState<boolean>(false);

  // Sun & Moon Info state (Image 3)
  const [moonRiseOffset, setMoonRiseOffset] = useState<number>(0);
  const [moonSetOffset, setMoonSetOffset] = useState<number>(0);
  const [infoDate, setInfoDate] = useState<string>('Fri, 25 Sep 2026');

  // Days of September matching screenshot
  // 1st is Tuesday (column 2, 0-indexed Sun=0, Mon=1, Tue=2)
  const DAYS_DATA: (CalendarDay | null)[] = [
    null, null, // Sun, Mon empty before 1st
    { day: 1, tithiNum: '૪', tithiName: 'Choth' },
    { day: 2, tithiNum: '૫', tithiName: 'Pancham' },
    { day: 3, tithiNum: '૬', tithiName: 'Chhath' },
    { day: 4, tithiNum: '૮', tithiName: 'Aatham' },
    { day: 5, tithiNum: '૯', tithiName: 'Nom' },

    { day: 6, tithiNum: '૧૦', tithiName: 'Dasham' },
    { day: 7, tithiNum: '૧૧', tithiName: 'Agiyaras' },
    { day: 8, tithiNum: '૧૨', tithiName: 'Baras' },
    { day: 9, tithiNum: '૧૩', tithiName: 'Teras' },
    { day: 10, tithiNum: '૧૪', tithiName: 'Chaudas' },
    { day: 11, tithiNum: '૧૫', tithiName: 'Poonam' },
    { day: 12, tithiNum: '૧', tithiName: 'Ekam' },

    { day: 13, tithiNum: '૨', tithiName: 'Beej' },
    { day: 14, tithiNum: '૩', tithiName: 'Trij' },
    { day: 15, tithiNum: '૪', tithiName: 'Choth' },
    { day: 16, tithiNum: '૫', tithiName: 'Pancham' },
    { day: 17, tithiNum: '૬', tithiName: 'Chhath' },
    { day: 18, tithiNum: '૭', tithiName: 'Satam' },
    { day: 19, tithiNum: '૮', tithiName: 'Aatham' },

    { day: 20, tithiNum: '૯', tithiName: 'Nom' },
    { day: 21, tithiNum: '૧૦', tithiName: 'Dasham' },
    { day: 22, tithiNum: '૧૧', tithiName: 'Agiyaras' },
    { day: 23, tithiNum: '૧૨', tithiName: 'Baras', isSpecial: true }, // Highlighted Yellow in screenshot
    { day: 24, tithiNum: '૧૩', tithiName: 'Teras' },
    { day: 25, tithiNum: '૧૪', tithiName: 'Chaudas', isSpecial: true }, // Highlighted Green in screenshot
    { day: 26, tithiNum: '૧૫', tithiName: 'Amas' },

    { day: 27, tithiNum: '૧', tithiName: 'Ekam' },
    { day: 28, tithiNum: '૨', tithiName: 'Beej' },
    { day: 29, tithiNum: '૩', tithiName: 'Trij' },
    { day: 30, tithiNum: '૪', tithiName: 'Choth' },
  ];

  const currentDayData = DAYS_DATA.find((d) => d && d.day === selectedDay) || {
    day: 23,
    tithiNum: '૧૨',
    tithiName: 'Baras',
  };

  const getWeekDay = (d: number) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const idx = (d + 1) % 7;
    return days[idx];
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.container}>
      <StatusBar style="dark" animated={true} />

      {/* Screen Header */}
      <View style={styles.topNavRow}>
        <BackButton showLabel={true} label="Home" />

        {/* Voice Toggle */}
        <View style={styles.voiceControlWrap}>
          <Text style={styles.voiceLabel}>Voice:</Text>
          <Switch
            value={voiceEnabled}
            onValueChange={setVoiceEnabled}
            trackColor={{ false: '#CFD8DC', true: '#0288D1' }}
            thumbColor={voiceEnabled ? '#FFFFFF' : '#F1F5F9'}
          />
        </View>

        {/* Language Selector */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setShowLangPicker(true)}
          style={styles.langSelectorWrap}>
          <Text style={styles.langPrefix}>Language: </Text>
          <Text style={styles.langValue}>{language}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Screen Title */}
        <View style={styles.titleRow}>
          <Text style={styles.calendarEmoji}>📅</Text>
          <Text style={styles.screenTitle}>September Juvar–Bhanj Calendar</Text>
        </View>

        {/* MONTH CALENDAR GRID */}
        <View style={styles.calendarGridCard}>
          {/* Weekday Labels Header */}
          <View style={styles.weekDaysRow}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((wDay) => (
              <View key={wDay} style={styles.weekDayCell}>
                <Text style={styles.weekDayText}>{wDay}</Text>
              </View>
            ))}
          </View>

          {/* Day Cells Grid */}
          <View style={styles.daysGrid}>
            {DAYS_DATA.map((item, index) => {
              if (!item) {
                return <View key={`empty-${index}`} style={styles.dayCellEmpty} />;
              }

              const isSelected = selectedDay === item.day;
              const isDay23 = item.day === 23;
              const isDay25 = item.day === 25;

              return (
                <TouchableOpacity
                  key={`day-${item.day}`}
                  activeOpacity={0.75}
                  onPress={() => setSelectedDay(item.day)}
                  style={[
                    styles.dayCell,
                    isDay23 && styles.dayCellYellow,
                    isDay25 && styles.dayCellGreen,
                    isSelected && !isDay23 && !isDay25 && styles.dayCellSelected,
                  ]}>
                  <Text
                    style={[
                      styles.dayEnglishNum,
                      (isDay23 || isDay25 || isSelected) && styles.dayTextDark,
                    ]}>
                    {item.day.toString().padStart(2, '0')}
                  </Text>
                  <Text
                    style={[
                      styles.dayTithiNum,
                      (isDay23 || isDay25 || isSelected) && styles.dayTextDark,
                    ]}>
                    {item.tithiNum}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* SELECTED DATE DETAIL SECTION */}
        <View style={styles.dateDetailCard}>
          <View style={styles.detailHeaderRow}>
            <Text style={styles.dateCalIcon}>📅</Text>
            <Text style={styles.selectedDateTitle}>
              2026-09-{selectedDay.toString().padStart(2, '0')} ({getWeekDay(selectedDay)})
            </Text>
          </View>

          <View style={styles.tithiRow}>
            <Text style={styles.scrollIcon}>📜</Text>
            <Text style={styles.tithiLabel}>
              Tithi:{' '}
              <Text style={styles.tithiValue}>{currentDayData.tithiNum} ({currentDayData.tithiName})</Text>
            </Text>
          </View>

          <View style={styles.phaseRow}>
            <Text style={styles.crescentIcon}>🌙</Text>
            <Text style={styles.phaseLabel}>Phase: Waxing Crescent / Gibbous</Text>
          </View>

          <View style={styles.noteRow}>
            <Text style={styles.noteIcon}>📝</Text>
            <Text style={styles.noteText}>Note: Bhadarva {currentDayData.tithiName}</Text>
          </View>

          {/* MOON GRAPHIC */}
          <View style={styles.moonGraphicContainer}>
            <View style={styles.moonCrescentShape}>
              <View style={styles.moonShadowCutout} />
            </View>
          </View>
        </View>

        {/* BLUE BUTTON: SUN & MOON INFO */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => setShowSunMoonModal(true)}
          style={styles.openSunMoonBtn}>
          <Text style={styles.openSunMoonText}>🌙 Sun & Moon Info</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* LANGUAGE SELECTOR MODAL */}
      <Modal visible={showLangPicker} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowLangPicker(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.langPickerCard}>
              <Text style={styles.langPickerTitle}>🌐 Select Language</Text>
              {(['Hindi', 'Gujarati', 'English'] as const).map((l) => (
                <TouchableOpacity
                  key={l}
                  onPress={() => {
                    setLanguage(l);
                    setShowLangPicker(false);
                  }}
                  style={[
                    styles.langPickerOption,
                    language === l && styles.langPickerOptionSelected,
                  ]}>
                  <Text
                    style={[
                      styles.langPickerOptionText,
                      language === l && styles.langPickerOptionTextSelected,
                    ]}>
                    {l === 'Gujarati' ? 'ગુજરાતી (Gujarati)' : l === 'Hindi' ? 'हिंदी (Hindi)' : 'English'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* SUN & MOON INFO SCREEN / MODAL (Exact match with Image 3) */}
      <Modal visible={showSunMoonModal} transparent animationType="slide">
        <SafeAreaView edges={['top', 'bottom']} style={styles.sunMoonModalContainer}>
          {/* Top Date Navigator Bar */}
          <View style={styles.sunMoonTopBar}>
            <TouchableOpacity
              onPress={() => setInfoDate('Thu, 24 Sep 2026')}
              style={styles.arrowCircleBtn}>
              <Text style={styles.arrowIcon}>◀</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => Alert.alert('Pick Date', 'Selected current fishing cycle date')}
              style={styles.pickDateBtn}>
              <Text style={styles.pickDateBtnText}>Pick Date</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setInfoDate('Sat, 26 Sep 2026')}
              style={styles.arrowCircleBtn}>
              <Text style={styles.arrowIcon}>▶</Text>
            </TouchableOpacity>

            <Text style={styles.infoDateText}>{infoDate}</Text>
          </View>

          {/* Header Title */}
          <View style={styles.astroTitleRow}>
            <Text style={styles.sunEmoji}>☀️🌙</Text>
            <Text style={styles.astroMainTitle}>Sun & Moon Info</Text>
          </View>

          <ScrollView contentContainerStyle={styles.astroScroll}>
            {/* BLACK MARINE MOON CARD (Matching Image 3) */}
            <View style={styles.blackMoonCard}>
              <View style={styles.moonCardHeader}>
                <Text style={styles.moonCardEmoji}>🌙</Text>
                <Text style={styles.moonCardTitle}>Moon</Text>
              </View>

              {/* Large Moon Graphic */}
              <View style={styles.astroMoonWrap}>
                <View style={styles.astroMoonBody}>
                  <View style={styles.astroMoonCrater1} />
                  <View style={styles.astroMoonCrater2} />
                  <View style={styles.astroMoonShadow} />
                </View>
              </View>

              <Text style={styles.phaseInfoText}>Phase: Waxing Gibbous — 98%</Text>
              <Text style={styles.ageInfoText}>Age: 13.4 days</Text>

              {/* Port Rise & Set */}
              <View style={styles.portTimesRow}>
                <View style={styles.portTimeCol}>
                  <Text style={styles.portTimeLabel}>Port Rise</Text>
                  <Text style={styles.portTimeVal}>5:46 PM</Text>
                </View>
                <View style={styles.portTimeCol}>
                  <Text style={styles.portTimeLabel}>Port Set</Text>
                  <Text style={styles.portTimeVal}>5:07 AM</Text>
                </View>
              </View>

              {/* Moon Rise Offset Controls */}
              <Text style={styles.offsetSectionTitle}>Moon Rise Offset</Text>
              <View style={styles.offsetControlsRow}>
                <TouchableOpacity
                  onPress={() => setMoonRiseOffset((prev) => prev - 5)}
                  style={styles.offsetBtn}>
                  <Text style={styles.offsetBtnText}>-5</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setMoonRiseOffset((prev) => prev + 5)}
                  style={styles.offsetBtn}>
                  <Text style={styles.offsetBtnText}>+5</Text>
                </TouchableOpacity>

                <Text style={styles.offsetDisplayVal}>{moonRiseOffset} min</Text>
              </View>

              {/* Moon Set Offset Controls */}
              <Text style={styles.offsetSectionTitle}>Moon Set Offset</Text>
              <View style={styles.offsetControlsRow}>
                <TouchableOpacity
                  onPress={() => setMoonSetOffset((prev) => prev - 5)}
                  style={styles.offsetBtn}>
                  <Text style={styles.offsetBtnText}>-5</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setMoonSetOffset((prev) => prev + 5)}
                  style={styles.offsetBtn}>
                  <Text style={styles.offsetBtnText}>+5</Text>
                </TouchableOpacity>

                <Text style={styles.offsetDisplayVal}>{moonSetOffset} min</Text>
              </View>

              {/* Calculated Local Adjusted Times */}
              <View style={styles.finalTimesSection}>
                <Text style={styles.finalTimeHeader}>Moon Rise Time</Text>
                <Text style={styles.finalTimeMaroon}>5:46 PM</Text>

                <Text style={styles.finalTimeHeader}>Moon Set Time</Text>
                <Text style={styles.finalTimeMaroon}>5:07 AM</Text>
              </View>

              {/* Reset Offsets */}
              <TouchableOpacity
                onPress={() => {
                  setMoonRiseOffset(0);
                  setMoonSetOffset(0);
                }}
                style={styles.resetOffsetsBtn}>
                <Text style={styles.resetOffsetsText}>Reset Offsets</Text>
              </TouchableOpacity>
            </View>

            {/* Close Button */}
            <TouchableOpacity
              onPress={() => setShowSunMoonModal(false)}
              style={styles.closeSunMoonBtn}>
              <Text style={styles.closeSunMoonText}>Back to Calendar ✕</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
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
    color: '#0D47A1',
    lineHeight: 26,
  },
  backText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0D47A1',
  },
  voiceControlWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  voiceLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  langSelectorWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  langPrefix: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  langValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0D47A1',
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 36,
    gap: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 4,
  },
  calendarEmoji: {
    fontSize: 20,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.2,
  },
  calendarGridCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
    gap: 10,
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekDayText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0D47A1',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  dayCellEmpty: {
    width: '12.8%',
    height: 52,
  },
  dayCell: {
    width: '12.8%',
    height: 52,
    backgroundColor: '#E8ECF8',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  dayCellYellow: {
    backgroundColor: '#FFF59D', // Signature yellow for Day 23
  },
  dayCellGreen: {
    backgroundColor: '#C8E6C9', // Signature green for Day 25
  },
  dayCellSelected: {
    borderWidth: 2,
    borderColor: '#1976D2',
    backgroundColor: '#E3F2FD',
  },
  dayEnglishNum: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
  },
  dayTithiNum: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  dayTextDark: {
    color: '#000000',
  },
  dateDetailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  detailHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateCalIcon: {
    fontSize: 16,
  },
  selectedDateTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  tithiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scrollIcon: {
    fontSize: 16,
  },
  tithiLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  tithiValue: {
    fontWeight: '900',
    color: '#0D47A1',
  },
  phaseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  crescentIcon: {
    fontSize: 16,
  },
  phaseLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  noteIcon: {
    fontSize: 16,
  },
  noteText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  moonGraphicContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  moonCrescentShape: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#CFD8DC',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  moonShadowCutout: {
    position: 'absolute',
    top: -15,
    left: 20,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FFFFFF',
  },
  openSunMoonBtn: {
    backgroundColor: '#0D47A1',
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: '#0D47A1',
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  openSunMoonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  langPickerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '85%',
    gap: 8,
  },
  langPickerTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 6,
  },
  langPickerOption: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
  },
  langPickerOptionSelected: {
    backgroundColor: '#E3F2FD',
    borderWidth: 1.5,
    borderColor: '#1976D2',
  },
  langPickerOptionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
  },
  langPickerOptionTextSelected: {
    color: '#0D47A1',
    fontWeight: '900',
  },
  sunMoonModalContainer: {
    flex: 1,
    backgroundColor: '#F4F5F7',
  },
  sunMoonTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  arrowCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowIcon: {
    fontSize: 14,
    color: '#0D47A1',
  },
  pickDateBtn: {
    borderWidth: 1,
    borderColor: '#0D47A1',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 18,
  },
  pickDateBtnText: {
    color: '#0D47A1',
    fontSize: 13,
    fontWeight: '800',
  },
  infoDateText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  astroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  sunEmoji: {
    fontSize: 22,
  },
  astroMainTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
  },
  astroScroll: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 14,
  },
  blackMoonCard: {
    backgroundColor: '#121212',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  moonCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  moonCardEmoji: {
    fontSize: 20,
  },
  moonCardTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  astroMoonWrap: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  astroMoonBody: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#ECEFF1',
    position: 'relative',
    overflow: 'hidden',
  },
  astroMoonCrater1: {
    position: 'absolute',
    top: 30,
    left: 40,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#B0BEC5',
    opacity: 0.7,
  },
  astroMoonCrater2: {
    position: 'absolute',
    bottom: 25,
    left: 55,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#B0BEC5',
    opacity: 0.6,
  },
  astroMoonShadow: {
    position: 'absolute',
    top: -15,
    left: -20,
    width: 120,
    height: 160,
    borderRadius: 60,
    backgroundColor: '#121212',
    opacity: 0.95,
  },
  phaseInfoText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  ageInfoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B0BEC5',
  },
  portTimesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  portTimeCol: {
    alignItems: 'center',
    gap: 4,
  },
  portTimeLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  portTimeVal: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  offsetSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#CE93D8',
    marginTop: 6,
  },
  offsetControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  offsetBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#263238',
  },
  offsetBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#81D4FA',
  },
  offsetDisplayVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#CE93D8',
    marginLeft: 6,
  },
  finalTimesSection: {
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
  },
  finalTimeHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: '#80DEEA',
  },
  finalTimeMaroon: {
    fontSize: 26,
    fontWeight: '900',
    color: '#EF5350',
    marginBottom: 6,
  },
  resetOffsetsBtn: {
    marginTop: 8,
    padding: 8,
  },
  resetOffsetsText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#90CAF9',
  },
  closeSunMoonBtn: {
    backgroundColor: '#263238',
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  closeSunMoonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
