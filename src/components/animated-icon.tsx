import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, StyleSheet, Text, View } from 'react-native';

const { width, height } = Dimensions.get('window');

export function AnimatedSplashOverlay() {
  const [visible, setVisible] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(0.95)).current;
  const [statusText, setStatusText] = useState('Initializing DGPS Receiver...');

  useEffect(() => {
    // Pulse animation
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.95,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    // Sequence status messages
    const timer1 = setTimeout(() => {
      setStatusText('Acquiring Satellites (33 In Use / 57 In View)...');
    }, 600);

    const timer2 = setTimeout(() => {
      setStatusText('Arabian Sea Nautical Charts Loaded ✓');
    }, 1200);

    const timer3 = setTimeout(() => {
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setVisible(false);
      });
    }, 1800);

    SplashScreen.hideAsync().catch(() => {});

    return () => {
      pulseLoop.stop();
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.splashOverlay, { opacity: fadeAnim }]}>
      {/* Background Radial Glow */}
      <View style={styles.ambientGlow} />

      {/* Pulsing Marine Emblem */}
      <Animated.View style={[styles.emblemContainer, { transform: [{ scale: pulseAnim }] }]}>
        <View style={styles.outerRadarRing}>
          <View style={styles.innerRadarRing}>
            <Text style={styles.anchorEmoji}>⚓</Text>
          </View>
        </View>
      </Animated.View>

      {/* App Branding */}
      <Text style={styles.appTitle}>GPS FISHING RAHI</Text>
      <Text style={styles.appSubtitle}>MARINE NAVIGATION & ARABIAN SEA CHARTS</Text>

      {/* Feature Badges */}
      <View style={styles.badgesRow}>
        <View style={styles.badgePill}>
          <Text style={styles.badgeText}>🛰️ DGPS 3D FIX</Text>
        </View>
        <View style={styles.badgePill}>
          <Text style={styles.badgeText}>📶 100% OFFLINE</Text>
        </View>
        <View style={styles.badgePill}>
          <Text style={styles.badgeText}>🌊 TIDES & REEFS</Text>
        </View>
      </View>

      {/* Dynamic Status Bar */}
      <View style={styles.statusBox}>
        <View style={styles.statusLiveDot} />
        <Text style={styles.statusLabel}>{statusText}</Text>
      </View>

      {/* Footer Info */}
      <View style={styles.footerWrap}>
        <Text style={styles.footerVersion}>Veraval • Porbandar • Okha • Diu • Jafarabad</Text>
        <Text style={styles.footerBuild}>v2.4.0 Marine Pro Edition</Text>
      </View>
    </Animated.View>
  );
}

const keyframe = new Keyframe({
  0: {
    transform: [{ scale: INITIAL_SCALE_FACTOR }],
  },
  100: {
    transform: [{ scale: 1 }],
    easing: Easing.elastic(0.7),
  },
});

const logoKeyframe = new Keyframe({
  0: {
    transform: [{ scale: 1.3 }],
    opacity: 0,
  },
  40: {
    transform: [{ scale: 1.3 }],
    opacity: 0,
    easing: Easing.elastic(0.7),
  },
  100: {
    opacity: 1,
    transform: [{ scale: 1 }],
    easing: Easing.elastic(0.7),
  },
});

const glowKeyframe = new Keyframe({
  0: {
    transform: [{ rotateZ: '0deg' }],
  },
  100: {
    transform: [{ rotateZ: '7200deg' }],
  },
});

export function AnimatedIcon() {
  return (
    <View style={styles.iconContainer}>
      <Animated.View entering={glowKeyframe.duration(60 * 1000 * 4)} style={styles.glow}>
        <Image style={styles.glow} source={require('@/assets/images/logo-glow.png')} />
      </Animated.View>

      <Animated.View entering={keyframe.duration(DURATION)} style={styles.background} />
      <Animated.View style={styles.imageContainer} entering={logoKeyframe.duration(DURATION)}>
        <Image style={styles.image} source={require('@/assets/images/expo-logo.png')} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    width: 201,
    height: 201,
    position: 'absolute',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 128,
    height: 128,
    zIndex: 100,
  },
  image: {
    width: 76,
    height: 71,
  },
  background: {
    borderRadius: 40,
    experimental_backgroundImage: `linear-gradient(180deg, #3C9FFE, #0274DF)`,
    width: 128,
    height: 128,
    position: 'absolute',
  },
  splashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#070D1E',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    zIndex: 1000,
  },
  ambientGlow: {
    position: 'absolute',
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: (width * 1.2) / 2,
    backgroundColor: 'rgba(21, 101, 192, 0.12)',
  },
  emblemContainer: {
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRadarRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: 'rgba(37, 99, 235, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
  },
  innerRadarRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
  },
  anchorEmoji: {
    fontSize: 44,
  },
  appTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 2,
    marginBottom: 6,
    textAlign: 'center',
  },
  appSubtitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 1.5,
    marginBottom: 24,
    textAlign: 'center',
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 32,
  },
  badgePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  badgeText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    marginBottom: 40,
  },
  statusLiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  statusLabel: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '700',
  },
  footerWrap: {
    position: 'absolute',
    bottom: 30,
    alignItems: 'center',
    gap: 4,
  },
  footerVersion: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  footerBuild: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '600',
  },
});
