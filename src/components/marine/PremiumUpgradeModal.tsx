import { AuthStore } from '@/services/authStore';
import { SettingsStore } from '@/services/settingsStore';
import { PlanTransaction, SubscriptionStore } from '@/services/subscriptionStore';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface PremiumUpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  nightMode?: boolean;
  isLocked?: boolean;
}

type FlowStep = 'select_plan' | 'checkout' | 'success' | 'failed';

export const PremiumUpgradeModal: React.FC<PremiumUpgradeModalProps> = ({
  visible,
  onClose,
  nightMode: propNightMode,
  isLocked: propIsLocked,
}) => {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<'yearly' | 'monthly' | 'lifetime'>('yearly');
  const [flowStep, setFlowStep] = useState<FlowStep>('select_plan');
  const [lastTx, setLastTx] = useState<PlanTransaction | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('upi');

  const nightMode = propNightMode !== undefined ? propNightMode : SettingsStore.isNightMode();
  const [subState, setSubState] = useState<SubscriptionState>(() => SubscriptionStore.getState());

  // Subscribe to live SubscriptionStore updates and sync on visible
  useEffect(() => {
    const current = SubscriptionStore.getState();
    setSubState(current);
    if (current.isSubscribed && current.plan !== 'none') {
      setSelectedPlan(current.plan);
    }
    if (visible) {
      setFlowStep('select_plan');
    }
    const unsub = SubscriptionStore.subscribe((state) => {
      setSubState(state);
      if (state.isSubscribed && state.plan !== 'none') {
        setSelectedPlan(state.plan);
      }
    });
    return unsub;
  }, [visible]);

  const isLocked = propIsLocked !== undefined ? propIsLocked : !SubscriptionStore.isAccessAllowed();

  const handleStartCheckout = () => {
    setFlowStep('checkout');
  };

  const handleSimulateSuccess = () => {
    const tx = SubscriptionStore.activateSubscription(selectedPlan);
    setLastTx(tx);
    setFlowStep('success');
  };

  const handleSimulateFailure = () => {
    const tx = SubscriptionStore.recordFailedTransaction(
      selectedPlan,
      'Bank UPI Gateway timed out. Payment was not deducted.'
    );
    setLastTx(tx);
    setFlowStep('failed');
  };

  const handleFinishSuccess = () => {
    setFlowStep('select_plan');
    onClose();
  };

  const handleRetryPayment = () => {
    setFlowStep('checkout');
  };

  const handleLogout = () => {
    AuthStore.logout();
    onClose();
    router.replace('/login');
  };

  const handleWhatsAppHelp = () => {
    Linking.openURL(
      'https://wa.me/919876543210?text=Hi%20GPS%20Pro%20Support,%20I%20need%20help%20with%20Marine%20Plan%20Recharge'
    ).catch(() => {});
  };

  const handleCallHelp = () => {
    Linking.openURL('tel:+919876543210').catch(() => {});
  };

  const colors = nightMode
    ? {
        backdrop: '#070D1E',
        cardBg: '#070D1E',
        headerBg: '#0F1A30',
        border: '#1E2D4A',
        gold: '#FFB300',
        goldLight: '#FFE082',
        cyan: '#38BDF8',
        textPrimary: '#F8FAFC',
        textSecondary: '#94A3B8',
        planSelectedBg: '#172554',
        planSelectedBorder: '#38BDF8',
        planUnselectedBg: '#0F1A30',
        planUnselectedBorder: '#1E2D4A',
        featureCardBg: 'rgba(255, 255, 255, 0.04)',
        successBg: '#064E3B',
        successText: '#34D399',
        failedBg: '#7F1D1D',
        failedText: '#F87171',
      }
    : {
        backdrop: '#F8FAFC',
        cardBg: '#FFFFFF',
        headerBg: '#EFF6FF',
        border: '#E2E8F0',
        gold: '#D97706',
        goldLight: '#F59E0B',
        cyan: '#0284C7',
        textPrimary: '#0F172A',
        textSecondary: '#64748B',
        planSelectedBg: '#EFF6FF',
        planSelectedBorder: '#2563EB',
        planUnselectedBg: '#F8FAFC',
        planUnselectedBorder: '#E2E8F0',
        featureCardBg: '#F8FAFC',
        successBg: '#ECFDF5',
        successText: '#059669',
        failedBg: '#FEF2F2',
        failedText: '#DC2626',
      };

  const planAmount = selectedPlan === 'yearly' ? 950 : selectedPlan === 'monthly' ? 100 : 2499;
  const planLabel =
    selectedPlan === 'yearly'
      ? 'Yearly Pro Pass (12 Months)'
      : selectedPlan === 'monthly'
      ? 'Monthly Fisherman Pass (30 Days)'
      : 'Lifetime Skipper Pass (Permanent)';

  // Calculate formatted expiry info
  const daysLeft = subState.isSubscribed
    ? SubscriptionStore.getPlanDaysRemaining()
    : SubscriptionStore.getTrialDaysRemaining();

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={() => {
        if (!isLocked && flowStep === 'select_plan') onClose();
      }}>
      <SafeAreaView
        edges={['top', 'left', 'right', 'bottom']}
        style={[styles.fullScreenContainer, { backgroundColor: colors.cardBg }]}>
        
        {/* Full Screen Header */}
        <View style={[styles.headerRow, { borderBottomColor: colors.border }]}>
          <View style={styles.headerTitleWrap}>
            <View style={[styles.crownIconBox, { backgroundColor: nightMode ? '#1E293B' : '#FEF3C7' }]}>
              <Text style={styles.crownEmoji}>
                {flowStep === 'success' ? '🎉' : flowStep === 'failed' ? '⚠️' : '👑'}
              </Text>
            </View>
            <View>
              <View style={styles.titleBadgeRow}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                  {flowStep === 'success'
                    ? 'PURCHASE VERIFIED'
                    : flowStep === 'failed'
                    ? 'TRANSACTION FAILED'
                    : flowStep === 'checkout'
                    ? 'SECURE CHECKOUT'
                    : 'GPS FISHING PRO'}
                </Text>
                <View style={[styles.proPill, { backgroundColor: colors.gold }]}>
                  <Text style={styles.proPillText}>
                    {subState.isSubscribed ? 'PRO ACTIVE' : 'UNLIMITED'}
                  </Text>
                </View>
              </View>
              <Text style={[styles.modalSub, { color: colors.cyan }]}>
                {flowStep === 'success'
                  ? 'All Offshore Features Unlocked'
                  : flowStep === 'failed'
                  ? 'Payment Declined by Server'
                  : flowStep === 'checkout'
                  ? 'Instant UPI / Card Payment Gateway'
                  : isLocked
                  ? 'Access Restricted • Activation Required'
                  : 'Professional Marine Navigation Suite'}
              </Text>
            </View>
          </View>

          {/* Close button only visible when NOT locked and not in transaction result */}
          {!isLocked && (flowStep === 'select_plan' || flowStep === 'checkout') ? (
            <TouchableOpacity
              onPress={() => {
                if (flowStep === 'checkout') {
                  setFlowStep('select_plan');
                } else {
                  onClose();
                }
              }}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={[styles.closeCircle, { backgroundColor: nightMode ? '#1E293B' : '#F1F5F9' }]}>
              <Text style={[styles.closeIconText, { color: colors.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          ) : isLocked && flowStep === 'select_plan' ? (
            <View style={styles.lockBadge}>
              <Text style={styles.lockBadgeText}>🔒 LOCKED</Text>
            </View>
          ) : null}
        </View>

        {/* ---------------- STEP 1: SELECT PLAN ---------------- */}
        {flowStep === 'select_plan' && (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollBody}
            bounces={false}>
            
            {/* Live Plan / Trial Status Card with Expiry Info */}
            <View
              style={[
                styles.liveStatusCard,
                {
                  backgroundColor: subState.isSubscribed
                    ? nightMode ? '#064E3B' : '#ECFDF5'
                    : isLocked
                    ? nightMode ? '#450A0A' : '#FEF2F2'
                    : nightMode ? '#082F49' : '#E0F2FE',
                  borderColor: subState.isSubscribed
                    ? '#10B981'
                    : isLocked
                    ? '#EF4444'
                    : colors.cyan,
                },
              ]}>
              <View style={styles.liveStatusTopRow}>
                <View style={styles.liveStatusIndicator}>
                  <View
                    style={[
                      styles.liveStatusDot,
                      {
                        backgroundColor: subState.isSubscribed
                          ? '#10B981'
                          : isLocked
                          ? '#EF4444'
                          : '#0284C7',
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.liveStatusBadgeText,
                      {
                        color: subState.isSubscribed
                          ? '#10B981'
                          : isLocked
                          ? '#EF4444'
                          : '#0284C7',
                      },
                    ]}>
                    {subState.isSubscribed
                      ? 'PRO PLAN ACTIVE'
                      : isLocked
                      ? 'TRIAL EXPIRED (LOCKED)'
                      : 'FREE TRIAL ACTIVE'}
                  </Text>
                </View>

                <View style={[styles.daysLeftPill, { backgroundColor: nightMode ? '#1E293B' : '#FFFFFF' }]}>
                  <Text style={[styles.daysLeftText, { color: colors.textPrimary }]}>
                    ⏳ {daysLeft} {daysLeft === 1 ? 'Day' : 'Days'} Remaining
                  </Text>
                </View>
              </View>

              <View style={styles.liveStatusDetails}>
                <Text style={[styles.liveStatusHeading, { color: colors.textPrimary }]}>
                  {subState.isSubscribed
                    ? subState.plan === 'yearly'
                      ? 'Yearly Marine Pro Pass'
                      : subState.plan === 'lifetime'
                      ? 'Lifetime Skipper Pass'
                      : 'Monthly Fisherman Pass'
                    : isLocked
                    ? '7-Day Free Trial Has Ended'
                    : '7-Day Free Trial Period'}
                </Text>

                <View style={styles.expiryRow}>
                  <Text style={[styles.expiryLabel, { color: colors.textSecondary }]}>
                    Plan Expiry Date:
                  </Text>
                  <Text style={[styles.expiryValue, { color: colors.gold }]}>
                    {subState.activePlanExpiry || 'N/A'}
                  </Text>
                </View>

                {/* Progress bar visual for plan duration */}
                <View style={[styles.progressBarTrack, { backgroundColor: nightMode ? '#1E293B' : '#CBD5E1' }]}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: subState.isSubscribed ? '85%' : isLocked ? '100%' : '55%',
                        backgroundColor: subState.isSubscribed
                          ? '#10B981'
                          : isLocked
                          ? '#EF4444'
                          : '#0284C7',
                      },
                    ]}
                  />
                </View>
              </View>
            </View>

            {/* Plan Selection Cards */}
            <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
              SELECT YOUR OFFSHORE PLAN
            </Text>

            <View style={styles.plansContainer}>
              {/* Plan 1: Yearly Pro (Recommended) */}
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => setSelectedPlan('yearly')}
                style={[
                  styles.planCard,
                  {
                    backgroundColor:
                      selectedPlan === 'yearly' ? colors.planSelectedBg : colors.planUnselectedBg,
                    borderColor:
                      selectedPlan === 'yearly' ? colors.planSelectedBorder : colors.planUnselectedBorder,
                    borderWidth: selectedPlan === 'yearly' ? 2 : 1.2,
                  },
                ]}>
                <View style={styles.planCardTop}>
                  <View style={styles.planNameWrap}>
                    <Text style={[styles.planTitle, { color: colors.textPrimary }]}>
                      YEARLY PRO PASS
                    </Text>
                    <View style={[styles.bestValueBadge, { backgroundColor: '#F59E0B' }]}>
                      <Text style={styles.bestValueBadgeText}>⭐ 60% OFF • RECOMMENDED</Text>
                    </View>
                  </View>

                  <View style={styles.radioCircle}>
                    {selectedPlan === 'yearly' && (
                      <View style={[styles.radioDot, { backgroundColor: colors.cyan }]} />
                    )}
                  </View>
                </View>

                <View style={styles.pricingRow}>
                  <Text style={[styles.currencySymbol, { color: colors.gold }]}>₹</Text>
                  <Text style={[styles.priceBig, { color: colors.textPrimary }]}>950</Text>
                  <Text style={[styles.pricePeriod, { color: colors.textSecondary }]}>/ year</Text>
                  <View style={[styles.moCostPill, { backgroundColor: nightMode ? '#1E293B' : '#E2E8F0' }]}>
                    <Text style={[styles.moCostText, { color: colors.cyan }]}>Only ₹79/month</Text>
                  </View>
                </View>

                <Text style={[styles.planPerksSummary, { color: colors.textSecondary }]}>
                  ✓ 365 days of offline Arabian Sea depth charts, unlimited waypoints, and solunar bite forecasting.
                </Text>
              </TouchableOpacity>

              {/* Plan 2: Monthly Starter */}
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => setSelectedPlan('monthly')}
                style={[
                  styles.planCard,
                  {
                    backgroundColor:
                      selectedPlan === 'monthly' ? colors.planSelectedBg : colors.planUnselectedBg,
                    borderColor:
                      selectedPlan === 'monthly' ? colors.planSelectedBorder : colors.planUnselectedBorder,
                    borderWidth: selectedPlan === 'monthly' ? 2 : 1.2,
                  },
                ]}>
                <View style={styles.planCardTop}>
                  <Text style={[styles.planTitle, { color: colors.textPrimary }]}>
                    MONTHLY FISHERMAN PASS
                  </Text>
                  <View style={styles.radioCircle}>
                    {selectedPlan === 'monthly' && (
                      <View style={[styles.radioDot, { backgroundColor: colors.cyan }]} />
                    )}
                  </View>
                </View>

                <View style={styles.pricingRow}>
                  <Text style={[styles.currencySymbol, { color: colors.gold }]}>₹</Text>
                  <Text style={[styles.priceBig, { color: colors.textPrimary }]}>100</Text>
                  <Text style={[styles.pricePeriod, { color: colors.textSecondary }]}>/ month</Text>
                  <Text style={[styles.planSubtleNote, { color: colors.textSecondary }]}>
                    Flexible • 30 Days Access
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Plan 3: Lifetime Skipper Pass */}
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => setSelectedPlan('lifetime')}
                style={[
                  styles.planCard,
                  {
                    backgroundColor:
                      selectedPlan === 'lifetime' ? colors.planSelectedBg : colors.planUnselectedBg,
                    borderColor:
                      selectedPlan === 'lifetime' ? colors.planSelectedBorder : colors.planUnselectedBorder,
                    borderWidth: selectedPlan === 'lifetime' ? 2 : 1.2,
                  },
                ]}>
                <View style={styles.planCardTop}>
                  <View style={styles.planNameWrap}>
                    <Text style={[styles.planTitle, { color: colors.textPrimary }]}>
                      LIFETIME SKIPPER PASS
                    </Text>
                    <View style={[styles.bestValueBadge, { backgroundColor: '#10B981' }]}>
                      <Text style={styles.bestValueBadgeText}>⚓ ONE-TIME PAYMENT</Text>
                    </View>
                  </View>

                  <View style={styles.radioCircle}>
                    {selectedPlan === 'lifetime' && (
                      <View style={[styles.radioDot, { backgroundColor: colors.cyan }]} />
                    )}
                  </View>
                </View>

                <View style={styles.pricingRow}>
                  <Text style={[styles.currencySymbol, { color: colors.gold }]}>₹</Text>
                  <Text style={[styles.priceBig, { color: colors.textPrimary }]}>2,499</Text>
                  <Text style={[styles.pricePeriod, { color: colors.textSecondary }]}>forever</Text>
                </View>
                <Text style={[styles.planPerksSummary, { color: colors.textSecondary }]}>
                  ✓ Permanent ownership. Lifetime bathymetric updates, VHF channel assist & device sync.
                </Text>
              </TouchableOpacity>
            </View>

            {/* Key Marine Features Included */}
            <Text style={[styles.sectionHeading, { color: colors.textPrimary, marginTop: 14 }]}>
              INCLUDED OFFSHORE CAPABILITIES
            </Text>

            <View style={styles.featuresList}>
              {[
                {
                  icon: '🗺️',
                  title: '100% Offline Nautical Charts',
                  desc: 'Bathymetric contours, reefs, shipping lanes & depths without cellular signal.',
                },
                {
                  icon: '📍',
                  title: 'Unlimited Waypoints & Net Markers',
                  desc: 'Save secret fishing hot-spots, net locations & record unlimited track logs.',
                },
                {
                  icon: '🐟',
                  title: 'Solunar Fish Feeding Forecaster',
                  desc: 'Predict high bite hours calculated from celestial moon phases & tidal curves.',
                },
                {
                  icon: '🌪️',
                  title: 'Live Wind & Cyclone Radar Alerts',
                  desc: 'Real-time advisories for high sea swells, gale gusts, and coastal storm paths.',
                },
              ].map((feat, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.featureCard,
                    { backgroundColor: colors.featureCardBg, borderColor: colors.border },
                  ]}>
                  <Text style={styles.featureIcon}>{feat.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>
                      {feat.title}
                    </Text>
                    <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>
                      {feat.desc}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Marine Support Assistance */}
            <View style={[styles.supportCard, { borderColor: colors.border }]}>
              <Text style={[styles.supportTitle, { color: colors.textPrimary }]}>
                Need Help with Plan Recharge?
              </Text>
              <Text style={[styles.supportSub, { color: colors.textSecondary }]}>
                Our Gujarat & Saurashtra Marine Support helpline is available 24/7.
              </Text>
              <View style={styles.supportButtonsRow}>
                <TouchableOpacity
                  onPress={handleWhatsAppHelp}
                  style={[styles.supportBtn, { backgroundColor: '#25D366' }]}>
                  <Text style={styles.supportBtnText}>💬 WhatsApp Support</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleCallHelp}
                  style={[styles.supportBtn, { backgroundColor: '#0284C7' }]}>
                  <Text style={styles.supportBtnText}>📞 Call Helpline</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        )}

        {/* ---------------- STEP 2: CHECKOUT & SIMULATE PAYMENT ---------------- */}
        {flowStep === 'checkout' && (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollBody}
            bounces={false}>
            
            {/* Order Summary Box */}
            <View style={[styles.checkoutSummaryCard, { backgroundColor: colors.planSelectedBg, borderColor: colors.cyan }]}>
              <Text style={[styles.checkoutOrderTitle, { color: colors.cyan }]}>ORDER SUMMARY</Text>
              
              <View style={styles.checkoutLineItem}>
                <Text style={[styles.checkoutPlanName, { color: colors.textPrimary }]}>{planLabel}</Text>
                <Text style={[styles.checkoutPlanPrice, { color: colors.gold }]}>₹{planAmount}</Text>
              </View>

              <View style={styles.checkoutDivider} />

              <View style={styles.checkoutLineItem}>
                <Text style={[styles.checkoutTotalLabel, { color: colors.textSecondary }]}>Total Payable Now:</Text>
                <Text style={[styles.checkoutTotalAmount, { color: colors.textPrimary }]}>₹{planAmount}.00</Text>
              </View>
            </View>

            {/* Simulated Payment Modes */}
            <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
              SELECT PAYMENT METHOD
            </Text>

            <View style={styles.paymentMethodsWrap}>
              {[
                { id: 'upi', icon: '📱', name: 'Instant UPI (Google Pay, PhonePe, Paytm)' },
                { id: 'card', icon: '💳', name: 'Credit / Debit Card (Visa, RuPay, MasterCard)' },
                { id: 'netbanking', icon: '🏦', name: 'Net Banking (All Indian Coastal Banks)' },
                { id: 'googleplay', icon: '▶️', name: 'Google Play Store In-App Billing' },
              ].map((pm) => (
                <TouchableOpacity
                  key={pm.id}
                  activeOpacity={0.8}
                  onPress={() => setSelectedPaymentMethod(pm.id)}
                  style={[
                    styles.paymentMethodOption,
                    {
                      backgroundColor:
                        selectedPaymentMethod === pm.id
                          ? colors.planSelectedBg
                          : colors.featureCardBg,
                      borderColor:
                        selectedPaymentMethod === pm.id
                          ? colors.planSelectedBorder
                          : colors.border,
                    },
                  ]}>
                  <Text style={styles.pmIcon}>{pm.icon}</Text>
                  <Text style={[styles.pmName, { color: colors.textPrimary }]}>{pm.name}</Text>
                  <View style={styles.radioCircle}>
                    {selectedPaymentMethod === pm.id && (
                      <View style={[styles.radioDot, { backgroundColor: colors.cyan }]} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Gateway Simulation Demo Box */}
            <View style={[styles.simNoticeBox, { backgroundColor: nightMode ? '#1E293B' : '#FEF3C7', borderColor: colors.gold }]}>
              <Text style={styles.simNoticeEmoji}>🧪</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.simNoticeHeading, { color: colors.textPrimary }]}>
                  Payment Gateway Simulator (Demo Mode)
                </Text>
                <Text style={[styles.simNoticeDesc, { color: colors.textSecondary }]}>
                  Test both payment outcomes below. Payment Gateway API will connect here in production.
                </Text>
              </View>
            </View>

            {/* Test Action Buttons */}
            <View style={styles.simButtonsCol}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleSimulateSuccess}
                style={[styles.simSuccessBtn, { backgroundColor: '#10B981' }]}>
                <Text style={styles.simActionBtnText}>✅ SIMULATE PAYMENT SUCCESS</Text>
                <Text style={styles.simActionBtnSubText}>
                  Test successful activation, receipt, and unlocked state
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleSimulateFailure}
                style={[styles.simFailBtn, { backgroundColor: '#EF4444' }]}>
                <Text style={styles.simActionBtnText}>❌ SIMULATE PAYMENT FAILURE / REJECT</Text>
                <Text style={styles.simActionBtnSubText}>
                  Test bank decline, error handling, and retry UI
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setFlowStep('select_plan')}
                style={[styles.backToPlansBtn, { borderColor: colors.border }]}>
                <Text style={[styles.backToPlansText, { color: colors.textSecondary }]}>
                  ← Back to Plans Selection
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        {/* ---------------- STEP 3: PAYMENT SUCCESS SCREEN ---------------- */}
        {flowStep === 'success' && (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollBody}
            bounces={false}>
            
            <View style={[styles.resultCard, { backgroundColor: colors.successBg, borderColor: '#10B981' }]}>
              <View style={styles.successIconCircle}>
                <Text style={styles.successLargeIcon}>✓</Text>
              </View>

              <Text style={[styles.resultTitle, { color: colors.successText }]}>
                PAYMENT SUCCESSFUL!
              </Text>
              <Text style={[styles.resultSubtitle, { color: colors.textPrimary }]}>
                Welcome to GPS Fishing Pro Unlimited
              </Text>

              {/* Receipt Details Card */}
              <View style={[styles.receiptCard, { backgroundColor: nightMode ? '#070D1E' : '#FFFFFF', borderColor: colors.border }]}>
                <View style={styles.receiptRow}>
                  <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>Plan Activated:</Text>
                  <Text style={[styles.receiptValue, { color: colors.textPrimary }]}>
                    {lastTx?.planTitle || planLabel}
                  </Text>
                </View>

                <View style={styles.receiptRow}>
                  <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>Amount Paid:</Text>
                  <Text style={[styles.receiptValue, { color: colors.gold, fontWeight: '900' }]}>
                    ₹{lastTx?.amount || planAmount}.00
                  </Text>
                </View>

                <View style={styles.receiptRow}>
                  <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>Transaction ID:</Text>
                  <Text style={[styles.receiptValue, { color: colors.cyan }]}>
                    {lastTx?.id || 'TXN-902184'}
                  </Text>
                </View>

                <View style={styles.receiptRow}>
                  <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>Plan Valid Till:</Text>
                  <Text style={[styles.receiptValue, { color: '#10B981', fontWeight: '900' }]}>
                    {subState.activePlanExpiry || '2027-09-29'}
                  </Text>
                </View>

                <View style={styles.receiptRow}>
                  <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>Payment Status:</Text>
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedBadgeText}>VERIFIED & ACTIVE</Text>
                  </View>
                </View>
              </View>

              {/* Unlocked Perks Confirmation */}
              <View style={styles.unlockedBox}>
                <Text style={[styles.unlockedTitle, { color: colors.cyan }]}>
                  CAPTAIN, YOUR PERKS ARE LIVE:
                </Text>
                <Text style={[styles.unlockedBullet, { color: colors.textSecondary }]}>
                  • Arabian Sea bathymetric depth charts available offline
                </Text>
                <Text style={[styles.unlockedBullet, { color: colors.textSecondary }]}>
                  • Unlimited GPS waypoints, routes & net markings
                </Text>
                <Text style={[styles.unlockedBullet, { color: colors.textSecondary }]}>
                  • Solunar fish bite forecaster & cyclone wind radar
                </Text>
              </View>

              {/* Continue to App CTA */}
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={handleFinishSuccess}
                style={[styles.continueAppBtn, { backgroundColor: '#10B981' }]}>
                <Text style={styles.continueAppBtnText}>🚢 START FISHING PRO NOW</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        {/* ---------------- STEP 4: PAYMENT REJECT / FAILED SCREEN ---------------- */}
        {flowStep === 'failed' && (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollBody}
            bounces={false}>
            
            <View style={[styles.resultCard, { backgroundColor: colors.failedBg, borderColor: '#EF4444' }]}>
              <View style={styles.failIconCircle}>
                <Text style={styles.failLargeIcon}>✕</Text>
              </View>

              <Text style={[styles.resultTitle, { color: colors.failedText }]}>
                PAYMENT REJECTED / DECLINED
              </Text>
              <Text style={[styles.resultSubtitle, { color: colors.textPrimary }]}>
                Transaction could not be completed
              </Text>

              {/* Error Explanation Card */}
              <View style={[styles.receiptCard, { backgroundColor: nightMode ? '#070D1E' : '#FFFFFF', borderColor: colors.border }]}>
                <View style={styles.receiptRow}>
                  <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>Attempted Plan:</Text>
                  <Text style={[styles.receiptValue, { color: colors.textPrimary }]}>
                    {lastTx?.planTitle || planLabel}
                  </Text>
                </View>

                <View style={styles.receiptRow}>
                  <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>Amount:</Text>
                  <Text style={[styles.receiptValue, { color: colors.textPrimary }]}>
                    ₹{lastTx?.amount || planAmount}.00
                  </Text>
                </View>

                <View style={styles.receiptRow}>
                  <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>Error Code:</Text>
                  <Text style={[styles.receiptValue, { color: '#EF4444' }]}>
                    ERR_BANK_TIMEOUT_4002
                  </Text>
                </View>

                <View style={styles.receiptRow}>
                  <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>Reason:</Text>
                  <Text style={[styles.receiptValue, { color: colors.textSecondary, flex: 1, textAlign: 'right' }]}>
                    {lastTx?.failureReason || 'Bank UPI server response timed out.'}
                  </Text>
                </View>
              </View>

              <View style={[styles.failTipsBox, { backgroundColor: nightMode ? '#1E293B' : '#F1F5F9' }]}>
                <Text style={[styles.failTipsTitle, { color: colors.textPrimary }]}>
                  💡 What can you do now?
                </Text>
                <Text style={[styles.failTipsBullet, { color: colors.textSecondary }]}>
                  1. Check your internet connection or mobile banking app.
                </Text>
                <Text style={[styles.failTipsBullet, { color: colors.textSecondary }]}>
                  2. Try another payment mode like Google Pay, PhonePe or Card.
                </Text>
                <Text style={[styles.failTipsBullet, { color: colors.textSecondary }]}>
                  3. Contact our 24/7 Marine Recharge helpline for instant direct activation.
                </Text>
              </View>

              {/* Action Buttons for Failure */}
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={handleRetryPayment}
                style={[styles.retryBtn, { backgroundColor: '#2563EB' }]}>
                <Text style={styles.retryBtnText}>🔄 RETRY PAYMENT / CHANGE METHOD</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleWhatsAppHelp}
                style={[styles.supportActionBtn, { backgroundColor: '#25D366' }]}>
                <Text style={styles.supportActionBtnText}>💬 Assist via WhatsApp Helpline</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setFlowStep('select_plan')}
                style={[styles.backToPlansBtn, { borderColor: colors.border }]}>
                <Text style={[styles.backToPlansText, { color: colors.textSecondary }]}>
                  ← Back to Plans Selection
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        {/* Bottom Fixed Action Footer (Only on Plan Selection) */}
        {flowStep === 'select_plan' && (
          <View style={[styles.bottomFooter, { borderTopColor: colors.border, backgroundColor: colors.cardBg }]}>
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={handleStartCheckout}
              style={[styles.upgradeCtaBtn, { backgroundColor: '#2563EB' }]}>
              <Text style={styles.upgradeCtaText}>
                {selectedPlan === 'yearly'
                  ? isLocked
                    ? 'Activate Yearly Pro • ₹950/yr'
                    : 'Upgrade to Yearly Pro • ₹950/yr'
                  : selectedPlan === 'lifetime'
                  ? 'Activate Lifetime Skipper • ₹2,499'
                  : 'Activate 30-Day Pass • ₹100'}
              </Text>
            </TouchableOpacity>

            <Text style={[styles.legalDisclaimer, { color: colors.textSecondary }]}>
              Secured by Google Play Billing • Instant UPI Activation • Cancel Anytime
            </Text>

            {/* Optional Logout & Developer Escape Link when locked */}
            {isLocked && (
              <View style={{ alignItems: 'center', gap: 4, marginTop: 4 }}>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutLinkBtn}>
                  <Text style={styles.logoutLinkText}>
                    Sign in with another mobile number (Logout)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    SubscriptionStore.resetTrial();
                    onClose();
                  }}
                  style={{ paddingVertical: 4 }}>
                  <Text style={{ color: '#38BDF8', fontSize: 11.5, fontWeight: '700' }}>
                    🛠️ Developer: Reset Trial & Unlock Screen
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  crownIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crownEmoji: {
    fontSize: 22,
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  proPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  proPillText: {
    color: '#000000',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  modalSub: {
    fontSize: 11.5,
    fontWeight: '600',
    marginTop: 2,
  },
  closeCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIconText: {
    fontSize: 15,
    fontWeight: '800',
  },
  lockBadge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },
  lockBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  scrollBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  liveStatusCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 20,
  },
  liveStatusTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  liveStatusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  liveStatusBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  daysLeftPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  daysLeftText: {
    fontSize: 11,
    fontWeight: '800',
  },
  liveStatusDetails: {
    gap: 6,
  },
  liveStatusHeading: {
    fontSize: 15,
    fontWeight: '900',
  },
  expiryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expiryLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  expiryValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  plansContainer: {
    gap: 12,
    marginBottom: 12,
  },
  planCard: {
    padding: 16,
    borderRadius: 16,
  },
  planCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  planNameWrap: {
    gap: 4,
    flex: 1,
  },
  planTitle: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  bestValueBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  bestValueBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  pricingRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 8,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '900',
  },
  priceBig: {
    fontSize: 28,
    fontWeight: '900',
  },
  pricePeriod: {
    fontSize: 14,
    fontWeight: '600',
  },
  moCostPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginLeft: 6,
  },
  moCostText: {
    fontSize: 11,
    fontWeight: '800',
  },
  planPerksSummary: {
    fontSize: 12,
    lineHeight: 17,
  },
  planSubtleNote: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
  },
  featuresList: {
    gap: 10,
    marginBottom: 16,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  featureIcon: {
    fontSize: 20,
    marginTop: 1,
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  supportCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 8,
    gap: 10,
  },
  supportTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  supportSub: {
    fontSize: 12,
  },
  supportButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  supportBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  bottomFooter: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    borderTopWidth: 1,
    gap: 8,
  },
  upgradeCtaBtn: {
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  upgradeCtaText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  legalDisclaimer: {
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
  },
  logoutLinkBtn: {
    alignSelf: 'center',
    paddingVertical: 4,
  },
  logoutLinkText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },

  // Checkout Styles
  checkoutSummaryCard: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 20,
  },
  checkoutOrderTitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 10,
  },
  checkoutLineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checkoutPlanName: {
    fontSize: 15,
    fontWeight: '800',
  },
  checkoutPlanPrice: {
    fontSize: 18,
    fontWeight: '900',
  },
  checkoutDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginVertical: 12,
  },
  checkoutTotalLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  checkoutTotalAmount: {
    fontSize: 22,
    fontWeight: '900',
  },
  paymentMethodsWrap: {
    gap: 10,
    marginBottom: 20,
  },
  paymentMethodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.2,
  },
  pmIcon: {
    fontSize: 20,
  },
  pmName: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  simNoticeBox: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.2,
    marginBottom: 20,
  },
  simNoticeEmoji: {
    fontSize: 24,
  },
  simNoticeHeading: {
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 2,
  },
  simNoticeDesc: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  simButtonsCol: {
    gap: 12,
  },
  simSuccessBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  simFailBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  simActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  simActionBtnSubText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 10.5,
    marginTop: 2,
  },
  backToPlansBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
  },
  backToPlansText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Result Screens (Success & Failure)
  resultCard: {
    padding: 22,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successLargeIcon: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '900',
  },
  failIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  failLargeIcon: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '900',
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.3,
    textAlign: 'center',
    marginBottom: 4,
  },
  resultSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  receiptCard: {
    width: '100%',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    marginBottom: 16,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  receiptValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  verifiedBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  verifiedBadgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '900',
  },
  unlockedBox: {
    width: '100%',
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    gap: 6,
    marginBottom: 20,
  },
  unlockedTitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  unlockedBullet: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  continueAppBtn: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueAppBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  failTipsBox: {
    width: '100%',
    padding: 14,
    borderRadius: 12,
    gap: 6,
    marginBottom: 20,
  },
  failTipsTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  failTipsBullet: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  retryBtn: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  supportActionBtn: {
    width: '100%',
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  supportActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
