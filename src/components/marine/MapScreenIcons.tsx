import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface IconProps {
  size?: number;
  color?: string;
}

// 1. Sleek Back Chevron Icon
export const BackChevronIcon: React.FC<IconProps> = ({ size = 20, color = '#0D47A1' }) => (
  <View style={[styles.center, { width: size, height: size }]}>
    <View
      style={{
        width: size * 0.45,
        height: size * 0.45,
        borderLeftWidth: 2.8,
        borderBottomWidth: 2.8,
        borderColor: color,
        transform: [{ rotate: '45deg' }, { translateX: size * 0.1 }],
      }}
    />
  </View>
);

// 2. Modern 3D Layer Stack Icon
export const ModernLayersIcon: React.FC<IconProps> = ({ size = 22, color = '#1E293B' }) => (
  <View style={[styles.center, { width: size, height: size }]}>
    {/* Top diamond sheet */}
    <View
      style={{
        position: 'absolute',
        top: 2,
        width: size * 0.65,
        height: size * 0.42,
        backgroundColor: '#3B82F6',
        borderRadius: 2,
        transform: [{ rotate: '45deg' }],
        borderWidth: 1,
        borderColor: '#93C5FD',
      }}
    />
    {/* Middle diamond sheet */}
    <View
      style={{
        position: 'absolute',
        top: 6,
        width: size * 0.65,
        height: size * 0.42,
        backgroundColor: '#1D4ED8',
        borderRadius: 2,
        transform: [{ rotate: '45deg' }],
        opacity: 0.8,
      }}
    />
    {/* Bottom diamond sheet */}
    <View
      style={{
        position: 'absolute',
        top: 10,
        width: size * 0.65,
        height: size * 0.42,
        backgroundColor: '#1E3A8A',
        borderRadius: 2,
        transform: [{ rotate: '45deg' }],
        opacity: 0.6,
      }}
    />
  </View>
);

// 3. Precision GPS Crosshair / Recenter Icon
export const PrecisionCrosshairIcon: React.FC<IconProps> = ({ size = 22, color = '#0D47A1' }) => (
  <View style={[styles.center, { width: size, height: size }]}>
    {/* Outer Ring */}
    <View
      style={{
        width: size * 0.82,
        height: size * 0.82,
        borderRadius: (size * 0.82) / 2,
        borderWidth: 2,
        borderColor: color,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      {/* Center target pip */}
      <View
        style={{
          width: size * 0.28,
          height: size * 0.28,
          borderRadius: (size * 0.28) / 2,
          backgroundColor: color,
        }}
      />
    </View>
    {/* Reticle ticks */}
    <View style={{ position: 'absolute', top: 0, width: 2, height: size * 0.22, backgroundColor: color }} />
    <View style={{ position: 'absolute', bottom: 0, width: 2, height: size * 0.22, backgroundColor: color }} />
    <View style={{ position: 'absolute', left: 0, width: size * 0.22, height: 2, backgroundColor: color }} />
    <View style={{ position: 'absolute', right: 0, width: size * 0.22, height: 2, backgroundColor: color }} />
  </View>
);

// 4. Record Track Icon (Active vs Idle)
export const RecordTrackIcon: React.FC<IconProps & { isRecording?: boolean }> = ({
  size = 22,
  isRecording = false,
}) => (
  <View style={[styles.center, { width: size, height: size }]}>
    {isRecording ? (
      <View
        style={{
          width: size * 0.55,
          height: size * 0.55,
          borderRadius: 3,
          backgroundColor: '#EF4444',
          shadowColor: '#EF4444',
          shadowOpacity: 0.8,
          shadowRadius: 4,
          elevation: 4,
        }}
      />
    ) : (
      <View
        style={{
          width: size * 0.7,
          height: size * 0.7,
          borderRadius: (size * 0.7) / 2,
          borderWidth: 2.5,
          borderColor: '#EA580C',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <View
          style={{
            width: size * 0.36,
            height: size * 0.36,
            borderRadius: (size * 0.36) / 2,
            backgroundColor: '#EA580C',
          }}
        />
      </View>
    )}
  </View>
);

// 5. Modern Waypoint Pin / Drop Mark Icon
export const WaypointBeaconIcon: React.FC<IconProps> = ({ size = 22, color = '#7C3AED' }) => (
  <View style={[styles.center, { width: size, height: size }]}>
    {/* Pin bulb */}
    <View
      style={{
        width: size * 0.65,
        height: size * 0.65,
        borderRadius: (size * 0.65) / 2,
        backgroundColor: color,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: '#FFFFFF',
      }}>
      <View
        style={{
          width: size * 0.22,
          height: size * 0.22,
          borderRadius: (size * 0.22) / 2,
          backgroundColor: '#FFFFFF',
        }}
      />
    </View>
    {/* Pin pointer tip */}
    <View
      style={{
        width: 0,
        height: 0,
        borderLeftWidth: size * 0.16,
        borderRightWidth: size * 0.16,
        borderTopWidth: size * 0.26,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: color,
        marginTop: -1,
      }}
    />
  </View>
);

// 6. Modern Compass Gyro Icon
export const CompassGyroIcon: React.FC<IconProps> = ({ size = 22 }) => (
  <View style={[styles.center, { width: size, height: size }]}>
    {/* Compass Ring */}
    <View
      style={{
        width: size * 0.88,
        height: size * 0.88,
        borderRadius: (size * 0.88) / 2,
        borderWidth: 1.8,
        borderColor: '#0284C7',
        backgroundColor: '#0F172A',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      {/* North red pointer */}
      <View
        style={{
          position: 'absolute',
          top: 2,
          width: 0,
          height: 0,
          borderLeftWidth: 4,
          borderRightWidth: 4,
          borderBottomWidth: size * 0.38,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: '#EF4444',
        }}
      />
      {/* South white pointer */}
      <View
        style={{
          position: 'absolute',
          bottom: 2,
          width: 0,
          height: 0,
          borderLeftWidth: 4,
          borderRightWidth: 4,
          borderTopWidth: size * 0.38,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderTopColor: '#F8FAFC',
        }}
      />
      {/* Center jewel */}
      <View
        style={{
          width: 4,
          height: 4,
          borderRadius: 2,
          backgroundColor: '#F59E0B',
          zIndex: 5,
        }}
      />
    </View>
  </View>
);

// 7. Orientation North-Up / Head-Up Icon
export const OrientationCompassIcon: React.FC<IconProps & { northUp?: boolean }> = ({
  size = 22,
  northUp = true,
}) => (
  <View style={[styles.center, { width: size, height: size }]}>
    <View
      style={{
        width: size * 0.78,
        height: size * 0.78,
        borderRadius: (size * 0.78) / 2,
        backgroundColor: northUp ? '#059669' : '#0284C7',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '900' }}>
        {northUp ? 'N' : 'H'}
      </Text>
    </View>
  </View>
);

// 8. Offline Disk / Cache Storage Icon
export const OfflineStorageIcon: React.FC<IconProps> = ({ size = 22, color = '#0284C7' }) => (
  <View style={[styles.center, { width: size, height: size }]}>
    {/* Disk platter */}
    <View
      style={{
        width: size * 0.75,
        height: size * 0.55,
        borderRadius: 4,
        borderWidth: 1.8,
        borderColor: color,
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 2,
      }}>
      <View style={{ width: size * 0.5, height: 1.5, backgroundColor: color }} />
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          width: '75%',
          alignItems: 'center',
        }}>
        <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#10B981' }} />
        <View style={{ width: 10, height: 2, backgroundColor: color, borderRadius: 1 }} />
      </View>
    </View>
  </View>
);

// 9. Modern Minimalist Zoom Plus (+) Icon
export const ModernZoomInIcon: React.FC<IconProps> = ({ size = 20, color = '#0F172A' }) => (
  <View style={[styles.center, { width: size, height: size }]}>
    <View style={{ width: size * 0.65, height: 2.5, backgroundColor: color, borderRadius: 1.25 }} />
    <View
      style={{
        position: 'absolute',
        width: 2.5,
        height: size * 0.65,
        backgroundColor: color,
        borderRadius: 1.25,
      }}
    />
  </View>
);

// 10. Modern Minimalist Zoom Minus (-) Icon
export const ModernZoomOutIcon: React.FC<IconProps> = ({ size = 20, color = '#0F172A' }) => (
  <View style={[styles.center, { width: size, height: size }]}>
    <View style={{ width: size * 0.65, height: 2.5, backgroundColor: color, borderRadius: 1.25 }} />
  </View>
);

// 11. Target Navigational Bullseye Icon
export const TargetBullseyeIcon: React.FC<IconProps> = ({ size = 20, color = '#FFFFFF' }) => (
  <View style={[styles.center, { width: size, height: size }]}>
    <View
      style={{
        width: size * 0.85,
        height: size * 0.85,
        borderRadius: (size * 0.85) / 2,
        borderWidth: 2,
        borderColor: color,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <View
        style={{
          width: size * 0.35,
          height: size * 0.35,
          borderRadius: (size * 0.35) / 2,
          backgroundColor: color,
        }}
      />
    </View>
  </View>
);

// 12. Voice Announcement Speaker Icon
export const VoiceSpeakerIcon: React.FC<IconProps> = ({ size = 20, color = '#FFFFFF' }) => (
  <View style={[styles.center, { width: size, height: size, flexDirection: 'row' }]}>
    {/* Speaker body */}
    <View style={{ width: 4, height: 8, backgroundColor: color, borderRadius: 1 }} />
    <View
      style={{
        width: 0,
        height: 0,
        borderTopWidth: 6,
        borderBottomWidth: 6,
        borderRightWidth: 7,
        borderTopColor: 'transparent',
        borderBottomColor: 'transparent',
        borderRightColor: color,
      }}
    />
    {/* Sound waves */}
    <View
      style={{
        width: 4,
        height: 10,
        borderRightWidth: 2,
        borderColor: color,
        borderRadius: 4,
        marginLeft: 2,
      }}
    />
  </View>
);

// 13. Route Connected Polyline Icon
export const RouteTrackIcon: React.FC<IconProps> = ({ size = 22, color = '#0284C7' }) => (
  <View style={[styles.center, { width: size, height: size }]}>
    {/* Point 1 */}
    <View
      style={{
        position: 'absolute',
        top: 3,
        left: 3,
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: color,
      }}
    />
    {/* Line 1 */}
    <View
      style={{
        position: 'absolute',
        top: 6,
        left: 6,
        width: 12,
        height: 2,
        backgroundColor: color,
        transform: [{ rotate: '40deg' }],
      }}
    />
    {/* Point 2 */}
    <View
      style={{
        position: 'absolute',
        top: 10,
        right: 4,
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#10B981',
      }}
    />
    {/* Line 2 */}
    <View
      style={{
        position: 'absolute',
        bottom: 5,
        left: 6,
        width: 14,
        height: 2,
        backgroundColor: color,
        transform: [{ rotate: '-35deg' }],
      }}
    />
    {/* Point 3 */}
    <View
      style={{
        position: 'absolute',
        bottom: 2,
        left: 4,
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#EF4444',
      }}
    />
  </View>
);

// 14. Modern Close (X) Icon
export const ModernCloseIcon: React.FC<IconProps> = ({ size = 18, color = '#64748B' }) => (
  <View style={[styles.center, { width: size, height: size }]}>
    <View
      style={{
        width: size * 0.75,
        height: 2.2,
        backgroundColor: color,
        borderRadius: 1.1,
        transform: [{ rotate: '45deg' }],
      }}
    />
    <View
      style={{
        position: 'absolute',
        width: size * 0.75,
        height: 2.2,
        backgroundColor: color,
        borderRadius: 1.1,
        transform: [{ rotate: '-45deg' }],
      }}
    />
  </View>
);

// 15. Tools Console Icon (Floating Action Button)
export const ToolsConsoleIcon: React.FC<IconProps> = ({ size = 24, color = '#FFFFFF' }) => (
  <View style={[styles.center, { width: size, height: size }]}>
    <View style={{ flexDirection: 'row', gap: 3.5, marginBottom: 3.5 }}>
      <View style={{ width: size * 0.32, height: size * 0.32, borderRadius: 3, backgroundColor: color }} />
      <View style={{ width: size * 0.32, height: size * 0.32, borderRadius: 3, backgroundColor: color }} />
    </View>
    <View style={{ flexDirection: 'row', gap: 3.5 }}>
      <View style={{ width: size * 0.32, height: size * 0.32, borderRadius: 3, backgroundColor: color }} />
      <View style={{ width: size * 0.32, height: size * 0.32, borderRadius: 3, backgroundColor: '#00E5FF' }} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
});
