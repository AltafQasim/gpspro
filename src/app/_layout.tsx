import { DarkTheme, DefaultTheme, ThemeProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="compass" />
        <Stack.Screen name="tide" />
        <Stack.Screen name="waypoints" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="map" />
        <Stack.Screen name="calendar" />
        <Stack.Screen name="track" />
        <Stack.Screen name="premium" />
        <Stack.Screen name="weather" />
        <Stack.Screen name="login" />
        <Stack.Screen name="camera" />
        <Stack.Screen name="explore" />
      </Stack>
    </ThemeProvider>
  );
}
