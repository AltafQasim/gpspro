import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const router = useRouter();

  // State
  const [loginMode, setLoginMode] = useState<'mobile' | 'vessel'>('mobile');
  const [mobileNumber, setMobileNumber] = useState<string>('9876543210');
  const [vesselId, setVesselId] = useState<string>('IND-GJ-11-FB-8842');
  const [otpCode, setOtpCode] = useState<string>('');
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [selectedLang, setSelectedLang] = useState<'Gujarati' | 'Hindi' | 'English'>('Gujarati');

  const handleSendOtp = () => {
    if (mobileNumber.length < 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    setOtpSent(true);
    Alert.alert('OTP Sent 📲', `A 4-digit verification code was sent to +91 ${mobileNumber}`);
  };

  const handleVerifyLogin = () => {
    Alert.alert('Login Successful ⚓', 'Welcome Captain! Vessel Sagar Kripa registered for fishing season 2026-2027.', [
      {
        text: 'Enter Navigation',
        onPress: () => router.replace('/'),
      },
    ]);
  };

  const handleOfflineBypass = () => {
    router.replace('/');
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.container}>
      <StatusBar style="light" animated={true} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Top Bar with Language Selector */}
          <View style={styles.topLangRow}>
            <View style={styles.langPillsWrap}>
              {(['Gujarati', 'Hindi', 'English'] as const).map((l) => (
                <TouchableOpacity
                  key={l}
                  onPress={() => setSelectedLang(l)}
                  style={[styles.langPill, selectedLang === l && styles.langPillActive]}>
                  <Text style={[styles.langPillText, selectedLang === l && styles.langPillTextActive]}>
                    {l === 'Gujarati' ? 'ગુજરાતી' : l === 'Hindi' ? 'हिंदी' : 'Eng'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity onPress={handleOfflineBypass} style={styles.skipBtn}>
              <Text style={styles.skipBtnText}>Skip ➔</Text>
            </TouchableOpacity>
          </View>

          {/* Marine Logo & Hero Header */}
          <View style={styles.heroSection}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoAnchor}>⚓</Text>
            </View>
            <Text style={styles.appTitle}>GPS FISHING RAHI</Text>
            <Text style={styles.appSubtitle}>Professional Marine GPS & Bathymetric Navigation</Text>
          </View>

          {/* Login Mode Toggle Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setLoginMode('mobile')}
              style={[styles.tabBtn, loginMode === 'mobile' && styles.tabBtnActive]}>
              <Text style={[styles.tabText, loginMode === 'mobile' && styles.tabTextActive]}>
                📱 Mobile OTP
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setLoginMode('vessel')}
              style={[styles.tabBtn, loginMode === 'vessel' && styles.tabBtnActive]}>
              <Text style={[styles.tabText, loginMode === 'vessel' && styles.tabTextActive]}>
                🚢 Vessel ID
              </Text>
            </TouchableOpacity>
          </View>

          {/* Main Login Card */}
          <View style={styles.loginCard}>
            {loginMode === 'mobile' ? (
              <>
                <Text style={styles.inputLabel}>Enter Registered Mobile Number</Text>
                <View style={styles.mobileInputRow}>
                  <View style={styles.countryCodeBox}>
                    <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
                  </View>
                  <TextInput
                    value={mobileNumber}
                    onChangeText={setMobileNumber}
                    keyboardType="phone-pad"
                    maxLength={10}
                    placeholder="Mobile Number"
                    placeholderTextColor="#64748B"
                    style={styles.textInputMain}
                  />
                </View>

                {otpSent && (
                  <View style={styles.otpSection}>
                    <Text style={styles.inputLabel}>Enter 4-Digit Security OTP</Text>
                    <TextInput
                      value={otpCode}
                      onChangeText={setOtpCode}
                      keyboardType="number-pad"
                      maxLength={4}
                      placeholder="• • • •"
                      placeholderTextColor="#94A3B8"
                      style={styles.otpInput}
                    />
                  </View>
                )}

                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={otpSent ? handleVerifyLogin : handleSendOtp}
                  style={styles.loginSubmitBtn}>
                  <Text style={styles.loginSubmitBtnText}>
                    {otpSent ? 'Verify & Launch Marine GPS' : 'Send Login OTP'}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.inputLabel}>Enter Marine Fisheries Vessel ID</Text>
                <TextInput
                  value={vesselId}
                  onChangeText={setVesselId}
                  autoCapitalize="characters"
                  placeholder="e.g. IND-GJ-11-FB-8842"
                  placeholderTextColor="#64748B"
                  style={styles.textInputFull}
                />

                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={handleVerifyLogin}
                  style={styles.loginSubmitBtn}>
                  <Text style={styles.loginSubmitBtnText}>Authenticate Vessel Token</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Offline Bypass Link */}
            <TouchableOpacity onPress={handleOfflineBypass} style={styles.offlineBypassBtn}>
              <Text style={styles.offlineBypassText}>
                ⚡ No Internet? <Text style={{ fontWeight: '900', color: '#00E5FF' }}>Launch Offline Sea Navigator</Text>
              </Text>
            </TouchableOpacity>
          </View>

          {/* Trust Badges Footer */}
          <View style={styles.footerTrustRow}>
            <Text style={styles.footerTrustText}>
              🔒 WGS-84 Marine Compliant • Offline Cached • Gujarat Coastal Basin
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
    backgroundColor: '#0A0E17',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
    gap: 16,
  },
  topLangRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  langPillsWrap: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 3,
    gap: 4,
  },
  langPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  langPillActive: {
    backgroundColor: '#0284C7',
  },
  langPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  langPillTextActive: {
    color: '#FFFFFF',
  },
  skipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  skipBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#00E5FF',
  },
  heroSection: {
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: 4,
  },
  logoCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#0D47A1',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#00E5FF',
    shadowColor: '#00E5FF',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  logoAnchor: {
    fontSize: 38,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  appSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#161F30',
    borderRadius: 14,
    padding: 4,
    gap: 6,
  },
  tabBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#0284C7',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  loginCard: {
    backgroundColor: '#131B2A',
    borderRadius: 20,
    padding: 22,
    gap: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#E2E8F0',
    letterSpacing: 0.2,
  },
  mobileInputRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  countryCodeBox: {
    height: 52,
    paddingHorizontal: 12,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  countryCodeText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  textInputMain: {
    flex: 1,
    height: 52,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#334155',
  },
  textInputFull: {
    height: 52,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#334155',
  },
  otpSection: {
    gap: 8,
    marginTop: 4,
  },
  otpInput: {
    height: 52,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 22,
    fontWeight: '900',
    color: '#00E5FF',
    textAlign: 'center',
    letterSpacing: 8,
    borderWidth: 1.5,
    borderColor: '#0284C7',
  },
  loginSubmitBtn: {
    backgroundColor: '#0284C7',
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: '#0284C7',
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  loginSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  offlineBypassBtn: {
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 4,
  },
  offlineBypassText: {
    fontSize: 13,
    color: '#94A3B8',
  },
  footerTrustRow: {
    alignItems: 'center',
    marginTop: 8,
  },
  footerTrustText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
  },
});
