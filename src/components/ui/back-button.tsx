import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle, StyleProp } from 'react-native';
import { useRouter } from 'expo-router';

export interface BackButtonProps {
  label?: string;
  showLabel?: boolean;
  isDark?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  customColor?: string;
  size?: 'normal' | 'compact' | 'large';
}

export function BackButton({
  label,
  showLabel = false,
  isDark = false,
  onPress,
  style,
  customColor,
  size = 'normal',
}: BackButtonProps) {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/');
      }
    }
  };

  const iconColor = customColor
    ? customColor
    : isDark
    ? '#38BDF8'
    : '#0F172A';

  const labelColor = customColor
    ? customColor
    : isDark
    ? '#F1F5F9'
    : '#1E293B';

  const containerBg = isDark
    ? 'rgba(15, 23, 42, 0.85)'
    : 'rgba(255, 255, 255, 0.95)';

  const containerBorder = isDark
    ? 'rgba(56, 189, 248, 0.25)'
    : 'rgba(226, 232, 240, 0.9)';

  const isCompact = size === 'compact';
  const circleSize = isCompact ? 34 : 38;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handlePress}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      accessibilityRole="button"
      accessibilityLabel={label || 'Go back'}
      style={[
        styles.touchable,
        showLabel && styles.touchableWithLabel,
        {
          backgroundColor: containerBg,
          borderColor: containerBorder,
        },
        style,
      ]}>
      <View
        style={[
          styles.chevronBox,
          { width: circleSize, height: circleSize, borderRadius: circleSize / 2 },
        ]}>
        <View style={[styles.chevronArrow, { borderColor: iconColor }]} />
      </View>

      {showLabel && (
        <Text style={[styles.labelText, { color: labelColor }]}>
          {label || 'Back'}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touchable: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1.2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  touchableWithLabel: {
    paddingRight: 12,
  },
  chevronBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronArrow: {
    width: 9.5,
    height: 9.5,
    borderLeftWidth: 2.5,
    borderBottomWidth: 2.5,
    transform: [{ rotate: '45deg' }],
    marginLeft: 3.5,
    borderRadius: 0.5,
  },
  labelText: {
    fontSize: 13.5,
    fontWeight: '800',
    letterSpacing: 0.3,
    marginLeft: -2,
  },
});
