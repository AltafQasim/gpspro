import { AuthStore } from '@/services/authStore';
import { SettingsStore } from '@/services/settingsStore';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const router = useRouter();

  // Theme State
  const [nightMode, setNightMode] = useState<boolean>(SettingsStore.isNightMode());

  useEffect(() => {
    const unsub = SettingsStore.subscribe(() => {
      setNightMode(SettingsStore.isNightMode());
    });
    return unsub;
  }, []);

  // Form State - Mobile Only
  const [mobileNumber, setMobileNumber] = useState<string>('9876543210');
  const [otpCode, setOtpCode] = useState<string>('');
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [resendTimer, setResendTimer] = useState<number>(30);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);

  // Pulse Animation for Emblem
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.06,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  // Resend Countdown Timer
  useEffect(() => {
    if (!otpSent) return;
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [otpSent, resendTimer]);

  const handleSendOtp = () => {
    const cleaned = mobileNumber.replace(/\D/g, '');
    if (cleaned.length !== 10) {
      setPhoneError('Please enter a valid 10-digit mobile number');
      return;
    }
    setPhoneError(null);
    Keyboard.dismiss();
    setOtpSent(true);
    setResendTimer(30);
    setOtpCode('');
  };

  const handleVerifyOtp = () => {
    const cleaned = mobileNumber.replace(/\D/g, '');
    if (cleaned.length !== 10) {
      setPhoneError('Please enter a valid 10-digit mobile number');
      return;
    }
    if (otpCode.trim().length < 4) {
      setOtpError('Please enter the 4-digit SMS verification code');
      return;
    }

    setOtpError(null);
    Keyboard.dismiss();
    setIsVerifying(true);

    setTimeout(() => {
      setIsVerifying(false);
      // Perform login in AuthStore
      AuthStore.login(cleaned, `Captain Sagar`);
      router.replace('/');
    }, 350);
  };

  const handleQuickDemoFill = () => {
    setOtpCode('1234');
    setOtpError(null);
  };

  const themeColors = nightMode
    ? {
      bg: '#070D1E',
      cardBg: '#0F172A',
      cardBorder: '#1E293B',
      textPrimary: '#F8FAFC',
      textSecondary: '#94A3B8',
      inputBg: '#1E293B',
      inputBorder: '#334155',
      inputBorderActive: '#38BDF8',
      accent: '#0284C7',
      accentGlow: '#38BDF8',
      pillBg: '#1E293B',
      pillActive: '#0284C7',
      statusDot: '#10B981',
    }
    : {
      bg: '#F1F5F9',
      cardBg: '#FFFFFF',
      cardBorder: '#E2E8F0',
      textPrimary: '#0F172A',
      textSecondary: '#64748B',
      inputBg: '#F8FAFC',
      inputBorder: '#CBD5E1',
      inputBorderActive: '#1D4ED8',
      accent: '#1D4ED8',
      accentGlow: '#2563EB',
      pillBg: '#E2E8F0',
      pillActive: '#1D4ED8',
      statusDot: '#059669',
    };

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={[styles.container, { backgroundColor: themeColors.bg }]}>
      <StatusBar hidden={true} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Marine Hero Header */}
          <View style={styles.heroSection}>
            <Animated.View style={[styles.logoCircle, { transform: [{ scale: pulseAnim }], borderColor: themeColors.accentGlow }]}>
              <View style={[styles.logoInnerCircle, { backgroundColor: nightMode ? '#0A2540' : '#DBEAFE' }]}>
                <Text style={styles.logoAnchor}>⚓</Text>
              </View>
            </Animated.View>

            <Text style={[styles.appTitle, { color: themeColors.textPrimary }]}>GPS FISHING RAHI</Text>
            <Text style={[styles.appSubtitle, { color: themeColors.accentGlow }]}>
              PROFESSIONAL MARINE NAVIGATION & ARABIAN SEA CHARTS
            </Text>

            <View style={styles.secureBadgeRow}>
              <View style={[styles.secureBadge, { borderColor: themeColors.cardBorder }]}>
                <View style={[styles.liveDot, { backgroundColor: themeColors.statusDot }]} />
                <Text style={[styles.secureBadgeText, { color: themeColors.textSecondary }]}>
                  CAPTAIN PORTAL • SECURE OTP ACCESS
                </Text>
              </View>
            </View>
          </View>

          {/* Main Mobile Login Card */}
          <View style={[styles.loginCard, { backgroundColor: themeColors.cardBg, borderColor: themeColors.cardBorder }]}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardTitleWrap}>
                <Text style={[styles.cardTitle, { color: themeColors.textPrimary }]}>
                  {otpSent ? 'Enter SMS Verification Code' : 'Mobile Number Login'}
                </Text>
                <Text style={[styles.cardSub, { color: themeColors.textSecondary }]}>
                  {otpSent
                    ? `Verification code dispatched to +91 ${mobileNumber}`
                    : 'Sign in to access your offline charts, saved waypoints & GPS tracks'}
                </Text>
              </View>

              {otpSent && (
                <TouchableOpacity
                  onPress={() => {
                    setOtpSent(false);
                    setOtpCode('');
                    setOtpError(null);
                  }}
                  style={styles.changePhoneBtn}>
                  <Text style={[styles.changePhoneBtnText, { color: themeColors.accentGlow }]}>✏️ Change</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Step 1: Mobile Number Input */}
            {!otpSent ? (
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: themeColors.textPrimary }]}>10-Digit Mobile Number</Text>
                <View
                  style={[
                    styles.mobileInputRow,
                    { backgroundColor: themeColors.inputBg, borderColor: themeColors.inputBorder },
                    phoneError ? { borderColor: '#EF4444', borderWidth: 1.5 } : null,
                  ]}>
                  <View style={[styles.countryCodeBadge, { borderColor: themeColors.cardBorder }]}>
                    <Text style={styles.flagEmoji}>🇮🇳</Text>
                    <Text style={[styles.countryCodeText, { color: themeColors.textPrimary }]}>+91</Text>
                  </View>

                  <TextInput
                    value={mobileNumber}
                    onChangeText={(val) => {
                      setMobileNumber(val.replace(/\D/g, '').slice(0, 10));
                      if (phoneError) setPhoneError(null);
                    }}
                    keyboardType="number-pad"
                    maxLength={10}
                    placeholder="Enter mobile number"
                    placeholderTextColor={themeColors.textSecondary}
                    style={[styles.mobileTextInput, { color: themeColors.textPrimary }]}
                  />

                  {mobileNumber.length > 0 && (
                    <TouchableOpacity
                      onPress={() => {
                        setMobileNumber('');
                        if (phoneError) setPhoneError(null);
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      style={styles.clearBtn}>
                      <Text style={styles.clearBtnText}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Inline Phone Error */}
                {phoneError ? (
                  <View style={{ marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Text style={{ fontSize: 12, color: '#EF4444', fontWeight: '700' }}>⚠️ {phoneError}</Text>
                  </View>
                ) : null}

                {/* Send OTP Button */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleSendOtp}
                  style={[styles.primaryActionBtn, { backgroundColor: themeColors.accent }]}>
                  <Text style={styles.primaryActionBtnText}>Send Verification Code 📲</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* Step 2: 4-Digit OTP Code Verification */
              <View style={styles.inputGroup}>
                <View style={styles.otpHeaderRow}>
                  <Text style={[styles.inputLabel, { color: themeColors.textPrimary }]}>4-Digit Security OTP</Text>
                  <TouchableOpacity onPress={handleQuickDemoFill}>
                    <Text style={[styles.demoFillLink, { color: themeColors.accentGlow }]}>Demo Auto-Fill (1234)</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.otpBoxesRow}>
                  {[0, 1, 2, 3].map((index) => {
                    const char = otpCode[index] || '';
                    const isFocused = otpCode.length === index;
                    return (
                      <View
                        key={index}
                        style={[
                          styles.otpSingleBox,
                          {
                            backgroundColor: themeColors.inputBg,
                            borderColor: otpError
                              ? '#EF4444'
                              : char
                                ? themeColors.accentGlow
                                : isFocused
                                  ? themeColors.accent
                                  : themeColors.inputBorder,
                          },
                        ]}>
                        <Text style={[styles.otpBoxChar, { color: themeColors.textPrimary }]}>{char ? char : '•'}</Text>
                      </View>
                    );
                  })}
                </View>

                {/* Inline OTP Error */}
                {otpError ? (
                  <View style={{ marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Text style={{ fontSize: 12, color: '#EF4444', fontWeight: '700' }}>⚠️ {otpError}</Text>
                  </View>
                ) : null}

                <TextInput
                  value={otpCode}
                  onChangeText={(val) => {
                    setOtpCode(val.replace(/\D/g, '').slice(0, 4));
                    if (otpError) setOtpError(null);
                  }}
                  keyboardType="number-pad"
                  maxLength={4}
                  autoFocus={true}
                  style={styles.hiddenOtpInput}
                />

                {/* Resend Timer & Action */}
                <View style={styles.resendRow}>
                  {resendTimer > 0 ? (
                    <Text style={[styles.resendTimerText, { color: themeColors.textSecondary }]}>
                      Resend code in <Text style={{ fontWeight: '900', color: themeColors.accentGlow }}>{resendTimer}s</Text>
                    </Text>
                  ) : (
                    <TouchableOpacity onPress={handleSendOtp}>
                      <Text style={[styles.resendLink, { color: themeColors.accentGlow }]}>Didn't receive code? Resend OTP</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Verify Button */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleVerifyOtp}
                  disabled={isVerifying}
                  style={[styles.primaryActionBtn, { backgroundColor: themeColors.accent }]}>
                  <Text style={styles.primaryActionBtnText}>
                    {isVerifying ? 'Verifying Credentials...' : 'Verify & Launch Marine GPS ⚓'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Maritime Security Guarantees */}
            <View style={[styles.trustDivider, { borderColor: themeColors.cardBorder }]} />
            <View style={styles.securityGuarantees}>
              <View style={styles.guaranteeItem}>
                <Text style={styles.guaranteeIcon}>🔒</Text>
                <Text style={[styles.guaranteeText, { color: themeColors.textSecondary }]}>
                  Encrypted Captain Credentials & Boat License
                </Text>
              </View>
              <View style={styles.guaranteeItem}>
                <Text style={styles.guaranteeIcon}>📶</Text>
                <Text style={[styles.guaranteeText, { color: themeColors.textSecondary }]}>
                  Once verified, works 100% offline at sea
                </Text>
              </View>
            </View>
          </View>

          {/* Footer note */}
          <View style={styles.footerNoteRow}>
            <Text style={[styles.footerNoteText, { color: themeColors.textSecondary }]}>
              Compliant with Gujarat Maritime Board & Indian EEZ Navigation Rules
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
    gap: 18,
  },
  heroSection: {
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    marginBottom: 4,
  },
  logoCircle: {
    width: 82,
    height: 82,
    borderRadius: 41,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    shadowColor: '#00E5FF',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  logoInnerCircle: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoAnchor: {
    fontSize: 34,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  appSubtitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    textAlign: 'center',
    maxWidth: '90%',
  },
  secureBadgeRow: {
    marginTop: 4,
  },
  secureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  secureBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  loginCard: {
    borderRadius: 24,
    padding: 22,
    gap: 18,
    borderWidth: 1.2,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  cardTitleWrap: {
    flex: 1,
    gap: 3,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  cardSub: {
    fontSize: 12.5,
    fontWeight: '500',
    lineHeight: 18,
  },
  changePhoneBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
  },
  changePhoneBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  inputGroup: {
    gap: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  mobileInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    height: 54,
    gap: 10,
  },
  countryCodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 10,
    borderRightWidth: 1,
  },
  flagEmoji: {
    fontSize: 18,
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: '900',
  },
  mobileTextInput: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 1,
    height: '100%',
  },
  clearBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '800',
  },
  primaryActionBtn: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  otpHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  demoFillLink: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  otpBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  otpSingleBox: {
    flex: 1,
    height: 60,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxChar: {
    fontSize: 22,
    fontWeight: '900',
  },
  hiddenOtpInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  resendRow: {
    alignItems: 'center',
    paddingVertical: 2,
  },
  resendTimerText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  resendLink: {
    fontSize: 12.5,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  trustDivider: {
    borderTopWidth: 1,
    marginTop: 2,
  },
  securityGuarantees: {
    gap: 8,
  },
  guaranteeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  guaranteeIcon: {
    fontSize: 14,
  },
  guaranteeText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  footerNoteRow: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  footerNoteText: {
    fontSize: 10.5,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 15,
  },
});
