import React from 'react';
import { StyleSheet, View } from 'react-native';

interface IconProps {
  size?: number;
  color?: string;
}

// 1. Sleek Search Lens Icon
export const ModernSearchIcon: React.FC<IconProps> = ({ size = 18, color = '#334155' }) => {
  const circleSize = size * 0.65;
  return (
    <View style={[styles.center, { width: size, height: size }]}>
      <View
        style={{
          width: circleSize,
          height: circleSize,
          borderRadius: circleSize / 2,
          borderWidth: 2,
          borderColor: color,
          position: 'absolute',
          top: 1,
          left: 1,
        }}
      />
      <View
        style={{
          position: 'absolute',
          bottom: 1.5,
          right: 1.5,
          width: size * 0.35,
          height: 2.2,
          backgroundColor: color,
          borderRadius: 1.1,
          transform: [{ rotate: '45deg' }],
        }}
      />
    </View>
  );
};

// 2. Modern 3-Dots Vertical Menu Icon
export const ModernMenuDotsIcon: React.FC<IconProps> = ({ size = 18, color = '#334155' }) => {
  const dotSize = Math.max(3.2, size * 0.18);
  return (
    <View style={[styles.center, { width: size, height: size, gap: 2.5 }]}>
      <View style={{ width: dotSize, height: dotSize, borderRadius: dotSize / 2, backgroundColor: color }} />
      <View style={{ width: dotSize, height: dotSize, borderRadius: dotSize / 2, backgroundColor: color }} />
      <View style={{ width: dotSize, height: dotSize, borderRadius: dotSize / 2, backgroundColor: color }} />
    </View>
  );
};

// 3. Modern Sort Bidirectional Arrows Icon
export const ModernSortIcon: React.FC<IconProps> = ({ size = 16, color = '#1D4ED8' }) => {
  return (
    <View style={[styles.center, { width: size, height: size, flexDirection: 'row', gap: 2.5 }]}>
      {/* Up Arrow */}
      <View style={styles.center}>
        <View
          style={{
            width: 0,
            height: 0,
            borderLeftWidth: 3,
            borderRightWidth: 3,
            borderBottomWidth: 4,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: color,
          }}
        />
        <View style={{ width: 1.8, height: 7, backgroundColor: color, borderRadius: 1 }} />
      </View>
      {/* Down Arrow */}
      <View style={styles.center}>
        <View style={{ width: 1.8, height: 7, backgroundColor: color, borderRadius: 1 }} />
        <View
          style={{
            width: 0,
            height: 0,
            borderLeftWidth: 3,
            borderRightWidth: 3,
            borderTopWidth: 4,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderTopColor: color,
          }}
        />
      </View>
    </View>
  );
};

// 4. Modern Share Node Icon
export const ModernShareIcon: React.FC<IconProps> = ({ size = 16, color = '#2563EB' }) => {
  const nodeSize = 4.2;
  return (
    <View style={[styles.center, { width: size, height: size, position: 'relative' }]}>
      {/* Connecting lines */}
      <View
        style={{
          position: 'absolute',
          top: size * 0.3,
          left: size * 0.25,
          width: size * 0.45,
          height: 1.6,
          backgroundColor: color,
          transform: [{ rotate: '-28deg' }],
        }}
      />
      <View
        style={{
          position: 'absolute',
          bottom: size * 0.3,
          left: size * 0.25,
          width: size * 0.45,
          height: 1.6,
          backgroundColor: color,
          transform: [{ rotate: '28deg' }],
        }}
      />
      {/* Left Node */}
      <View
        style={{
          position: 'absolute',
          left: 1.5,
          width: nodeSize,
          height: nodeSize,
          borderRadius: nodeSize / 2,
          backgroundColor: color,
        }}
      />
      {/* Top Right Node */}
      <View
        style={{
          position: 'absolute',
          top: 1.5,
          right: 1.5,
          width: nodeSize,
          height: nodeSize,
          borderRadius: nodeSize / 2,
          backgroundColor: color,
        }}
      />
      {/* Bottom Right Node */}
      <View
        style={{
          position: 'absolute',
          bottom: 1.5,
          right: 1.5,
          width: nodeSize,
          height: nodeSize,
          borderRadius: nodeSize / 2,
          backgroundColor: color,
        }}
      />
    </View>
  );
};

// 5. Modern Edit / Pencil Icon
export const ModernEditIcon: React.FC<IconProps> = ({ size = 16, color = '#0F172A' }) => {
  return (
    <View style={[styles.center, { width: size, height: size, transform: [{ rotate: '-45deg' }] }]}>
      {/* Pencil Cap */}
      <View
        style={{
          width: size * 0.28,
          height: size * 0.18,
          backgroundColor: color,
          borderTopLeftRadius: 1.5,
          borderTopRightRadius: 1.5,
          marginBottom: 1,
        }}
      />
      {/* Pencil Barrel */}
      <View
        style={{
          width: size * 0.28,
          height: size * 0.45,
          backgroundColor: color,
          borderRadius: 1,
        }}
      />
      {/* Pencil Nib */}
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: size * 0.14,
          borderRightWidth: size * 0.14,
          borderTopWidth: size * 0.22,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderTopColor: color,
          marginTop: 1,
        }}
      />
    </View>
  );
};

// 6. Modern Trash / Delete Can Icon
export const ModernTrashIcon: React.FC<IconProps> = ({ size = 16, color = '#DC2626' }) => {
  return (
    <View style={[styles.center, { width: size, height: size }]}>
      {/* Lid handle */}
      <View
        style={{
          width: size * 0.35,
          height: 1.8,
          backgroundColor: color,
          borderTopLeftRadius: 1,
          borderTopRightRadius: 1,
          marginBottom: 1,
        }}
      />
      {/* Lid Bar */}
      <View
        style={{
          width: size * 0.75,
          height: 1.8,
          backgroundColor: color,
          borderRadius: 1,
          marginBottom: 1.5,
        }}
      />
      {/* Bin Body */}
      <View
        style={{
          width: size * 0.55,
          height: size * 0.55,
          borderWidth: 1.6,
          borderColor: color,
          borderBottomLeftRadius: 3,
          borderBottomRightRadius: 3,
          alignItems: 'center',
          justifyContent: 'space-evenly',
          flexDirection: 'row',
          paddingVertical: 1,
        }}>
        <View style={{ width: 1.2, height: '70%', backgroundColor: color }} />
        <View style={{ width: 1.2, height: '70%', backgroundColor: color }} />
      </View>
    </View>
  );
};

// 7. Modern Compass Dial Icon (Telemetry)
export const ModernCompassDialIcon: React.FC<IconProps> = ({ size = 15, color = '#0F172A' }) => {
  return (
    <View
      style={[
        styles.center,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 1.6,
          borderColor: color,
        },
      ]}>
      {/* North Red Needle */}
      <View
        style={{
          position: 'absolute',
          top: 1.5,
          width: 0,
          height: 0,
          borderLeftWidth: 2.2,
          borderRightWidth: 2.2,
          borderBottomWidth: size * 0.38,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: '#EF4444',
          transform: [{ rotate: '35deg' }],
        }}
      />
      {/* South White Needle */}
      <View
        style={{
          position: 'absolute',
          bottom: 1.5,
          width: 0,
          height: 0,
          borderLeftWidth: 2.2,
          borderRightWidth: 2.2,
          borderTopWidth: size * 0.38,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderTopColor: '#64748B',
          transform: [{ rotate: '35deg' }],
        }}
      />
      {/* Center Pivot */}
      <View
        style={{
          width: 2.8,
          height: 2.8,
          borderRadius: 1.4,
          backgroundColor: '#0F172A',
        }}
      />
    </View>
  );
};

// 8. Modern Distance Beacon Icon (Telemetry)
export const ModernDistanceIcon: React.FC<IconProps> = ({ size = 15, color = '#1D4ED8' }) => {
  return (
    <View style={[styles.center, { width: size, height: size }]}>
      <View
        style={{
          width: size * 0.55,
          height: size * 0.55,
          borderRadius: (size * 0.55) / 2,
          backgroundColor: color,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <View style={{ width: 2.5, height: 2.5, borderRadius: 1.25, backgroundColor: '#FFFFFF' }} />
      </View>
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: 2.5,
          borderRightWidth: 2.5,
          borderTopWidth: 4,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderTopColor: color,
          marginTop: -0.5,
        }}
      />
    </View>
  );
};

// 9. Modern VHF Marine Radio Handset Icon (FAB)
export const ModernVhfRadioIcon: React.FC<IconProps> = ({ size = 26, color = '#FFFFFF' }) => {
  return (
    <View style={[styles.center, { width: size, height: size }]}>
      {/* Antenna */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: size * 0.28,
          width: 2.2,
          height: size * 0.32,
          backgroundColor: color,
          borderRadius: 1,
        }}
      />
      {/* Radio Body */}
      <View
        style={{
          position: 'absolute',
          bottom: 1,
          width: size * 0.58,
          height: size * 0.68,
          borderRadius: 4,
          backgroundColor: color,
          padding: 2.5,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
        {/* Screen */}
        <View
          style={{
            width: '80%',
            height: '28%',
            borderRadius: 2,
            backgroundColor: '#047857',
            marginTop: 1,
          }}
        />
        {/* Speaker slits */}
        <View style={{ width: '75%', gap: 1.5, marginBottom: 2 }}>
          <View style={{ width: '100%', height: 1.2, backgroundColor: '#065F46', borderRadius: 0.6 }} />
          <View style={{ width: '100%', height: 1.2, backgroundColor: '#065F46', borderRadius: 0.6 }} />
          <View style={{ width: '70%', height: 1.2, backgroundColor: '#065F46', borderRadius: 0.6, alignSelf: 'center' }} />
        </View>
      </View>
    </View>
  );
};

// 10. Modern Plus Pin Icon (FAB Add)
export const ModernPlusPinIcon: React.FC<IconProps> = ({ size = 28, color = '#FFFFFF' }) => {
  return (
    <View style={[styles.center, { width: size, height: size }]}>
      {/* Pin head */}
      <View
        style={{
          width: size * 0.72,
          height: size * 0.72,
          borderRadius: (size * 0.72) / 2,
          backgroundColor: color,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        {/* Plus Symbol */}
        <View style={{ width: 10, height: 2.5, backgroundColor: '#1D4ED8', borderRadius: 1.25 }} />
        <View
          style={{
            position: 'absolute',
            width: 2.5,
            height: 10,
            backgroundColor: '#1D4ED8',
            borderRadius: 1.25,
          }}
        />
      </View>
      {/* Pin pointer */}
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: size * 0.16,
          borderRightWidth: size * 0.16,
          borderTopWidth: size * 0.28,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderTopColor: color,
          marginTop: -1,
        }}
      />
    </View>
  );
};

// 11. Modern Close / Dismiss Cross Icon
export const ModernCloseIcon: React.FC<IconProps> = ({ size = 14, color = '#64748B' }) => {
  return (
    <View style={[styles.center, { width: size, height: size }]}>
      <View
        style={{
          width: size * 0.8,
          height: 2,
          backgroundColor: color,
          borderRadius: 1,
          transform: [{ rotate: '45deg' }],
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: size * 0.8,
          height: 2,
          backgroundColor: color,
          borderRadius: 1,
          transform: [{ rotate: '-45deg' }],
        }}
      />
    </View>
  );
};

// 12. Modern Checkmark Icon
export const ModernCheckIcon: React.FC<IconProps> = ({ size = 16, color = '#FFFFFF' }) => {
  return (
    <View style={[styles.center, { width: size, height: size }]}>
      <View
        style={{
          width: size * 0.35,
          height: size * 0.65,
          borderBottomWidth: 2.4,
          borderRightWidth: 2.4,
          borderColor: color,
          transform: [{ rotate: '45deg' }, { translateY: -size * 0.1 }],
          borderRadius: 1,
        }}
      />
    </View>
  );
};

// 13. Modern Label / Tag Icon (Modal Input)
export const ModernTagIcon: React.FC<IconProps> = ({ size = 18, color = '#3B82F6' }) => {
  return (
    <View style={[styles.center, { width: size, height: size }]}>
      <View
        style={{
          width: size * 0.65,
          height: size * 0.75,
          backgroundColor: color,
          borderTopLeftRadius: 2,
          borderTopRightRadius: 2,
          alignItems: 'center',
          justifyContent: 'flex-start',
          paddingTop: 2.5,
        }}>
        <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#FFFFFF' }} />
      </View>
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: size * 0.325,
          borderRightWidth: size * 0.325,
          borderTopWidth: size * 0.25,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderTopColor: color,
        }}
      />
    </View>
  );
};

// 14. Modern Target Reticle Icon
export const ModernTargetReticleIcon: React.FC<IconProps> = ({ size = 14, color = '#FFFFFF' }) => {
  return (
    <View style={[styles.center, { width: size, height: size }]}>
      <View
        style={{
          width: size * 0.8,
          height: size * 0.8,
          borderRadius: (size * 0.8) / 2,
          borderWidth: 1.6,
          borderColor: color,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <View
          style={{
            width: size * 0.28,
            height: size * 0.28,
            borderRadius: (size * 0.28) / 2,
            backgroundColor: color,
          }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
});
