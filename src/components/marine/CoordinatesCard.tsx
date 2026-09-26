import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface CoordinatesCardProps {
  latitude?: string;
  longitude?: string;
  batteryPercent?: number;
  signalBars?: number;
  nightMode?: boolean;
  onPressCoordinates?: () => void;
  onPressBattery?: () => void;
  onPressSignal?: () => void;
}

export const CoordinatesCard: React.FC<CoordinatesCardProps> = ({
  latitude = "N 20° 44.572'",
  longitude = "E 71° 04.313'",
  batteryPercent = 22,
  signalBars = 5,
  nightMode = false,
  onPressCoordinates,
  onPressBattery,
  onPressSignal,
}) => {
  const barHeights = [10, 16, 22, 28, 34];

  const colors = nightMode
    ? {
        text: '#FFFFFF',
        subtext: '#90A4AE',
        signalActive: '#00E676',
        signalInactive: '#37474F',
        batteryBorder: '#FFFFFF',
        batteryFill: batteryPercent <= 20 ? '#FF5252' : '#00E676',
        bg: 'transparent',
      }
    : {
        text: '#000000',
        subtext: '#455A64',
        signalActive: '#00E676',
        signalInactive: '#CFD8DC',
        batteryBorder: '#000000',
        batteryFill: batteryPercent <= 20 ? '#FF5252' : '#00E676',
        bg: 'transparent',
      };

  return (
    <View style={styles.container}>
      {/* Left: Signal Bars */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPressSignal}
        style={styles.signalTouchArea}>
        <View style={styles.signalContainer}>
          {barHeights.map((h, index) => {
            const isActive = index < signalBars;
            return (
              <View
                key={index}
                style={[
                  styles.signalBar,
                  {
                    height: h,
                    backgroundColor: isActive
                      ? colors.signalActive
                      : colors.signalInactive,
                  },
                ]}
              />
            );
          })}
        </View>
      </TouchableOpacity>

      {/* Center: High Visibility GPS Coordinates */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPressCoordinates}
        style={styles.coordinatesContainer}>
        <Text style={[styles.coordText, { color: colors.text }]}>{latitude}</Text>
        <Text style={[styles.coordText, { color: colors.text }]}>{longitude}</Text>
      </TouchableOpacity>

      {/* Right: Battery Gauge */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPressBattery}
        style={styles.batteryContainer}>
        <Text style={[styles.batteryText, { color: colors.text }]}>
          {batteryPercent}%
        </Text>
        <View style={styles.batteryWrapper}>
          <View
            style={[
              styles.batteryBody,
              {
                borderColor: colors.batteryBorder,
              },
            ]}>
            <View
              style={[
                styles.batteryLevel,
                {
                  width: `${Math.min(100, Math.max(8, batteryPercent))}%`,
                  backgroundColor: colors.batteryFill,
                },
              ]}
            />
          </View>
          {/* Battery Terminal Pin */}
          <View
            style={[
              styles.batteryTerminal,
              { backgroundColor: colors.batteryBorder },
            ]}
          />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 18,
    marginBottom: 20,
  },
  signalTouchArea: {
    padding: 6,
  },
  signalContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3.5,
    height: 38,
  },
  signalBar: {
    width: 6,
    borderRadius: 2.5,
  },
  coordinatesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  coordText: {
    fontSize: 25,
    fontWeight: '800',
    letterSpacing: 0.6,
    lineHeight: 32,
    fontVariant: ['tabular-nums'],
  },
  batteryContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    minWidth: 54,
  },
  batteryText: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 3,
  },
  batteryWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  batteryBody: {
    width: 38,
    height: 19,
    borderWidth: 2,
    borderRadius: 4.5,
    padding: 2,
    justifyContent: 'center',
  },
  batteryLevel: {
    height: '100%',
    borderRadius: 2,
  },
  batteryTerminal: {
    width: 2.5,
    height: 7,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
});
