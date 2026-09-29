import { PremiumUpgradeModal } from '@/components/marine/PremiumUpgradeModal';
import { BackButton } from '@/components/ui/back-button';
import { SettingsStore } from '@/services/settingsStore';
import { SubscriptionStore, SubscriptionState } from '@/services/subscriptionStore';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PremiumScreen() {
  const router = useRouter();

  const [nightMode, setNightMode] = useState<boolean>(SettingsStore.isNightMode());
  const [subState, setSubState] = useState<SubscriptionState>(() => SubscriptionStore.getState());
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  useEffect(() => {
    const unsub = SettingsStore.subscribe(() => {
      setNightMode(SettingsStore.isNightMode());
    });
    const unsubSub = SubscriptionStore.subscribe((state) => {
      setSubState(state);
    });
    return () => {
      unsub();
      unsubSub();
    };
  }, []);

  // State
  const [userId] = useState<string>('LhNpbFD3LHTEPRKoNKINhilgcZB2');
  const todayDate = new Date().toISOString().split('T')[0];
  const activePlanExpiry = subState.activePlanExpiry || 'N/A';
  const daysRemaining = subState.isSubscribed
    ? SubscriptionStore.getPlanDaysRemaining()
    : SubscriptionStore.getTrialDaysRemaining();

  const handleCopyUserId = () => {
    Alert.alert('Copied to Clipboard 📋', `User ID: ${userId}`);
  };

  const handleSyncPlan = () => {
    Alert.alert(
      'Plan Synchronized 🔄',
      `Current Status: ${
        subState.isSubscribed
          ? 'Active Pro Plan'
          : subState.trialActive
          ? 'Free Trial Active'
          : 'Trial Expired'
      }\nValid Till: ${activePlanExpiry}`
    );
  };

  const handleCallSupport = () => {
    Linking.openURL('tel:+919876543210').catch(() => {
      Alert.alert('Support Helpline', 'Contact Fishing RAHI Marine Support: +91 98765 43210');
    });
  };

  const handleWhatsAppSupport = () => {
    Linking.openURL('https://wa.me/919876543210?text=Hi%20GPS%20Pro%20Support,%20I%20need%20assistance%20with%20Marine%20Plan%20Recharge').catch(() => {
      Alert.alert('Support Helpline', 'Contact Fishing RAHI Marine Support: +91 98765 43210');
    });
  };

  const handleSendSms = () => {
    Linking.openURL(`sms:+919876543210?body=User%20ID:%20${userId}`).catch(() => {});
  };

  const handleOpenUpgradeModal = () => {
    setModalVisible(true);
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={[styles.container, { backgroundColor: nightMode ? '#070D1E' : '#F8FAFC' }]}>
      <StatusBar style={nightMode ? 'light' : 'dark'} animated={true} />

      {/* Screen Header */}
      <View style={styles.topNavRow}>
        <BackButton showLabel={true} label="Home" />

        <Text style={[styles.headerTitle, { color: nightMode ? '#F8FAFC' : '#0F172A' }]}>Upgrade to Premium</Text>

        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Active Plan Status Banner (Matching Screenshot) */}
        <View style={styles.activeBanner}>
          <Text style={styles.activeBannerText}>
            {subState.isSubscribed
              ? `✅ ${
                  subState.plan === 'yearly'
                    ? 'Yearly Pro Pass'
                    : subState.plan === 'lifetime'
                    ? 'Lifetime Skipper Pass'
                    : 'Monthly Fisherman Pass'
                } Active till ${activePlanExpiry} (${daysRemaining} Days Left)`
              : subState.trialActive && !subState.isTrialExpired
              ? `🛡️ 7-Day Free Trial Active (${daysRemaining} Days Left)`
              : '⚠️ Free Trial Expired • Recharge to Activate'}
          </Text>
        </View>

        {/* Date & User ID Header */}
        <View style={styles.userSection}>
          <Text style={styles.todayDateText}>Today&apos;s Date: {todayDate}</Text>
          <View style={styles.userIdRow}>
            <Text style={styles.userIdLabel} numberOfLines={1}>
              User ID: <Text style={styles.userIdVal}>{userId}</Text>
            </Text>
            <TouchableOpacity onPress={handleCopyUserId} style={styles.copyBtn}>
              <Text style={styles.copyBtnText}>Copy</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 4 SUPPORT ACTION BUTTONS (Matching Screenshot) */}
        <View style={styles.actionButtonsWrap}>
          {/* 1. Sync Plan (Purple/Blue Pill) */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleSyncPlan}
            style={[styles.fullActionBtn, styles.btnSyncPlan]}>
            <Text style={styles.fullActionBtnText}>🔄 Sync Plan</Text>
          </TouchableOpacity>

          {/* 2. Call Support (Royal Blue Pill) */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleCallSupport}
            style={[styles.fullActionBtn, styles.btnCallSupport]}>
            <Text style={styles.fullActionBtnText}>📞 Call Support</Text>
          </TouchableOpacity>

          {/* 3. Contact on WhatsApp (Bright Green Pill) */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleWhatsAppSupport}
            style={[styles.fullActionBtn, styles.btnWhatsApp]}>
            <Text style={styles.fullActionBtnText}>💬 Contact on WhatsApp</Text>
          </TouchableOpacity>

          {/* 4. Send Support SMS (Forest Green Pill) */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleSendSms}
            style={[styles.fullActionBtn, styles.btnSendSms]}>
            <Text style={styles.fullActionBtnText}>✉️ Send Support SMS</Text>
          </TouchableOpacity>
        </View>

        {/* PRICING PLANS CARDS SECTION */}

        {/* CARD 1: Fisherman Starter Plan (Warm Cream/Ivory Card) */}
        <View style={styles.planCardStarter}>
          <Text style={styles.planBadgeSub}>Manual Recharge • Non Auto-renew</Text>
          <Text style={styles.planDuration}>30 Day Access</Text>
          <Text style={styles.planTitle}>⚡ Fisherman Starter Plan</Text>

          <View style={styles.pricingRow}>
            <View style={styles.priceWrap}>
              <Text style={styles.priceMain}>₹100</Text>
              <Text style={styles.priceStrike}>₹280</Text>
              <View style={styles.tagFisherman}>
                <Text style={styles.tagFishermanText}>FISHERMAN PLAN</Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleOpenUpgradeModal}
              style={styles.rechargeBtn}>
              <Text style={styles.rechargeBtnText}>Recharge</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* CARD 2: Yearly Plan (Soft Lilac/Lavender Card) */}
        <View style={styles.planCardYearly}>
          <Text style={styles.planBadgeSub}>Billed yearly • Auto-renewable</Text>
          <Text style={styles.planDisclaimer}>Cancel anytime from Google Play</Text>
          <Text style={styles.planTitle}>Yearly Plan</Text>

          <View style={styles.pricingRow}>
            <View style={styles.priceWrap}>
              <Text style={[styles.priceMain, { color: '#1565C0' }]}>₹950</Text>
              <Text style={styles.priceStrike}>₹1400</Text>
              <Text style={styles.priceStrike}>₹2400</Text>
              <View style={styles.tagBestValue}>
                <Text style={styles.tagBestValueText}>BEST VALUE</Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleOpenUpgradeModal}
              style={styles.subscribeBtn}>
              <Text style={styles.subscribeBtnText}>Subscribe</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* CARD 3: Monthly Plan (Bottom Card) */}
        <View style={styles.planCardMonthly}>
          <Text style={styles.planBadgeSub}>Billed monthly • Auto-renewable</Text>
          <Text style={styles.planDisclaimer}>Cancel anytime from Google Play</Text>
          <Text style={styles.planTitle}>Monthly Plan</Text>

          <View style={styles.pricingRow}>
            <View style={styles.priceWrap}>
              <Text style={[styles.priceMain, { color: '#00838F' }]}>₹199</Text>
              <Text style={styles.priceStrike}>₹399</Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleOpenUpgradeModal}
              style={[styles.subscribeBtn, { backgroundColor: '#00838F' }]}>
              <Text style={styles.subscribeBtnText}>Subscribe</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Full Screen Premium Modal with simulated checkout, success & fail */}
      <PremiumUpgradeModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        nightMode={nightMode}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
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
    fontSize: 20,
    fontWeight: '900',
    color: '#0D47A1',
    letterSpacing: 0.3,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 14,
  },
  activeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeBannerText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1B5E20',
  },
  userSection: {
    gap: 4,
    marginTop: 2,
  },
  todayDateText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  userIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userIdLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    marginRight: 8,
  },
  userIdVal: {
    fontWeight: '600',
    color: '#334155',
  },
  copyBtn: {
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  copyBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0D47A1',
  },
  actionButtonsWrap: {
    gap: 10,
    marginVertical: 4,
  },
  fullActionBtn: {
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  btnSyncPlan: {
    backgroundColor: '#3F51B5',
  },
  btnCallSupport: {
    backgroundColor: '#1565C0',
  },
  btnWhatsApp: {
    backgroundColor: '#2E7D32',
  },
  btnSendSms: {
    backgroundColor: '#1B5E20',
  },
  fullActionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  planCardStarter: {
    backgroundColor: '#FFFDE7',
    borderRadius: 18,
    padding: 16,
    gap: 4,
    borderWidth: 1,
    borderColor: '#FFF9C4',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  planBadgeSub: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#000000',
  },
  planDuration: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#424242',
  },
  planTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#000000',
    marginTop: 2,
  },
  pricingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  priceWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    flex: 1,
  },
  priceMain: {
    fontSize: 24,
    fontWeight: '900',
    color: '#000000',
  },
  priceStrike: {
    fontSize: 14,
    fontWeight: '700',
    color: '#757575',
    textDecorationLine: 'line-through',
  },
  tagFisherman: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagFishermanText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#C62828',
  },
  rechargeBtn: {
    backgroundColor: '#FFB300',
    paddingHorizontal: 22,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFB300',
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  rechargeBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '900',
  },
  planCardYearly: {
    backgroundColor: '#F3E5F5',
    borderRadius: 18,
    padding: 16,
    gap: 4,
    borderWidth: 1,
    borderColor: '#E1BEE7',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  planDisclaimer: {
    fontSize: 12,
    fontWeight: '600',
    color: '#424242',
  },
  tagBestValue: {
    backgroundColor: '#FFE0B2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagBestValueText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#E65100',
  },
  subscribeBtn: {
    backgroundColor: '#3949AB',
    paddingHorizontal: 22,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3949AB',
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  subscribeBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  planCardMonthly: {
    backgroundColor: '#F1F5F9',
    borderRadius: 18,
    padding: 16,
    gap: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
});
