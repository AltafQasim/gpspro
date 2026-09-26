import React, { useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface PremiumButtonProps {
  onPress: () => void;
  nightMode?: boolean;
}

export const PremiumButton: React.FC<PremiumButtonProps> = ({ onPress, nightMode }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 40,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 4,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: scaleAnim }],
        },
      ]}>
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.button,
          nightMode && styles.buttonNight,
        ]}>
        <View style={styles.contentRow}>
          <Text style={styles.starIcon}>⭐</Text>
          <Text style={styles.buttonText}>Upgrade to Premium</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 22,
    marginTop: 12,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#FFB300', // Signature golden yellow pill matching screenshot
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFA000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonNight: {
    backgroundColor: '#FFB300',
    shadowColor: '#000000',
    shadowOpacity: 0.6,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  starIcon: {
    fontSize: 16,
  },
  buttonText: {
    color: '#000000',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
