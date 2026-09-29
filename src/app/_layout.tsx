import { DarkTheme, DefaultTheme, Stack, ThemeProvider, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthStore } from '@/services/authStore';
import { SettingsStore } from '@/services/settingsStore';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [nightMode, setNightMode] = useState<boolean>(SettingsStore.isNightMode());
  const [isAuth, setIsAuth] = useState<boolean>(AuthStore.isLoggedIn());
  const segments = useSegments();
  const router = useRouter();

  // Subscribe to theme updates
  useEffect(() => {
    const unsubTheme = SettingsStore.subscribe(() => {
      setNightMode(SettingsStore.isNightMode());
    });
    return unsubTheme;
  }, []);

  // Subscribe to auth state updates
  useEffect(() => {
    const unsubAuth = AuthStore.subscribe((state) => {
      setIsAuth(state.isLoggedIn);
    });
    return unsubAuth;
  }, []);

  // Protected route enforcement
  useEffect(() => {
    const inAuthGroup = segments[0] === 'login';

    if (!isAuth && !inAuthGroup) {
      router.replace('/login');
    } else if (isAuth && inAuthGroup) {
      router.replace('/');
    }
  }, [isAuth, segments]);

  const activeTheme = nightMode ? DarkTheme : DefaultTheme;

  return (
    <ThemeProvider value={activeTheme}>
      <View style={{ flex: 1, backgroundColor: nightMode ? '#070D1E' : '#F8FAFC' }}>
        <StatusBar style={nightMode ? 'light' : 'dark'} animated={true} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="compass" />
          <Stack.Screen name="tide" />
          <Stack.Screen name="waypoints" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="map" />
          <Stack.Screen name="calendar" />
          <Stack.Screen name="track" />
          <Stack.Screen name="premium" />
          <Stack.Screen name="weather" />
          <Stack.Screen name="camera" />
          <Stack.Screen name="explore" />
        </Stack>
        <AnimatedSplashOverlay />
      </View>
    </ThemeProvider>
  );
}
