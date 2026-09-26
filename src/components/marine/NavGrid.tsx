import React, { useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  CalendarIcon,
  CameraIcon,
  CompassIcon,
  MapIcon,
  SettingsIcon,
  TideIcon,
  TrackIcon,
  WaypointsIcon,
  WeatherIcon,
} from './NavIcons';
import { MarineFeatureId } from './types';

interface NavButtonConfig {
  id: MarineFeatureId;
  label: string;
  icon: React.ReactNode;
}

interface NavGridProps {
  nightMode?: boolean;
  onPressFeature: (id: MarineFeatureId, label: string) => void;
}

const BUTTON_SIZE = 72;

const NavButton: React.FC<{
  item: NavButtonConfig;
  nightMode?: boolean;
  onPress: () => void;
}> = ({ item, nightMode, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
      speed: 40,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 4,
      tension: 60,
    }).start();
  };

  const textColor = nightMode ? '#ECEFF1' : '#000000';

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.buttonCell}>
      <Animated.View
        style={[
          styles.iconWrapper,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}>
        {item.icon}
      </Animated.View>
      <Text style={[styles.buttonLabel, { color: textColor }]} numberOfLines={1}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );
};

export const NavGrid: React.FC<NavGridProps> = ({ nightMode = false, onPressFeature }) => {
  const items: NavButtonConfig[] = [
    {
      id: 'compass',
      label: 'Compass',
      icon: <CompassIcon size={BUTTON_SIZE} />,
    },
    {
      id: 'waypoints',
      label: 'Waypoints',
      icon: <WaypointsIcon size={BUTTON_SIZE} />,
    },
    {
      id: 'map',
      label: 'Map',
      icon: <MapIcon size={BUTTON_SIZE} />,
    },
    {
      id: 'tide',
      label: 'Tide',
      icon: <TideIcon size={BUTTON_SIZE} />,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <SettingsIcon size={BUTTON_SIZE} />,
    },
    {
      id: 'calendar',
      label: 'Calendar',
      icon: <CalendarIcon size={BUTTON_SIZE} />,
    },
    {
      id: 'track',
      label: 'Track',
      icon: <TrackIcon size={BUTTON_SIZE} />,
    },
    {
      id: 'weather',
      label: 'Sea Weather',
      icon: <WeatherIcon size={BUTTON_SIZE} />,
    },
    {
      id: 'camera',
      label: 'Camera',
      icon: <CameraIcon size={BUTTON_SIZE} />,
    },
  ];

  return (
    <View style={styles.gridContainer}>
      <View style={styles.gridRow}>
        {items.slice(0, 3).map((item) => (
          <NavButton
            key={item.id}
            item={item}
            nightMode={nightMode}
            onPress={() => onPressFeature(item.id, item.label)}
          />
        ))}
      </View>

      <View style={styles.gridRow}>
        {items.slice(3, 6).map((item) => (
          <NavButton
            key={item.id}
            item={item}
            nightMode={nightMode}
            onPress={() => onPressFeature(item.id, item.label)}
          />
        ))}
      </View>

      <View style={styles.gridRow}>
        {items.slice(6, 9).map((item) => (
          <NavButton
            key={item.id}
            item={item}
            nightMode={nightMode}
            onPress={() => onPressFeature(item.id, item.label)}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  gridContainer: {
    width: '100%',
    paddingHorizontal: 16,
    gap: 16,
    marginVertical: 10,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    width: '100%',
  },
  buttonCell: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 96,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});
