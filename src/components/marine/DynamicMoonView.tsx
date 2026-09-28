import React, { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Stop,
} from 'react-native-svg';

export type DynamicMoonViewProps = {
  phase: number; // 0.0 to 1.0 (0.0 = New Moon, 0.5 = Full Moon)
  illumination: number; // 0 to 100
  size?: number; // Fixed diameter, default 78
};

// High-definition photographic Full Moon with real craters and maria
const REAL_MOON_IMAGE_URI =
  'https://images.unsplash.com/photo-1532693322450-2cb5c511067d?w=400&auto=format&fit=crop&q=85';

/**
 * High-fidelity Photographic Moon Component:
 * - Fixed solid size: outer diameter remains rock-solid and stable.
 * - Only the illuminated visibility and curved terminator shadow changes based on lunar phase.
 * - Shows genuine high-resolution lunar photographic texture with real craters and maria.
 * - Earthshine shading on the nightside and radiant atmospheric glow on the dayside.
 */
export function DynamicMoonView({
  phase,
  illumination,
  size = 78,
}: DynamicMoonViewProps) {
  const [imageFailed, setImageFailed] = useState(false);

  // FIXED solid dimensions (no size jumping or scaling)
  const diskSize = size;
  const diskRadius = Math.round(diskSize / 2);
  const R = diskRadius;

  // Atmospheric halo parameters (subtle, fixed bounds)
  const glowOpacity = Math.max(0.12, (illumination / 100) * 0.55);
  const haloRadius = diskRadius + 6;

  // Determine shadow masking path based on astronomical phase (0.0 = New Moon, 0.5 = Full Moon)
  const p = ((phase % 1) + 1) % 1; // Normalize to [0, 1)

  // Calculate terminator curvature rx
  let terminatorRx = Math.abs(Math.cos(p * 2 * Math.PI) * R);
  if (terminatorRx < 0.3) terminatorRx = 0.3;

  let shadowPath = '';
  const isNewMoon = p < 0.03 || p >= 0.97;
  const isFullMoon = Math.abs(p - 0.5) <= 0.03;

  if (isNewMoon) {
    // New Moon: Entire disk covered in dark shadow
    shadowPath = `M ${R} 0 A ${R} ${R} 0 1 0 ${R} ${2 * R} A ${R} ${R} 0 1 0 ${R} 0 Z`;
  } else if (isFullMoon) {
    // Full Moon: Completely lit, no shadow
    shadowPath = '';
  } else if (p < 0.25) {
    // Waxing Crescent: Shadow covers left hemisphere + bows into right side (terminator sweep 0 curves right)
    shadowPath = `M ${R} 0 A ${R} ${R} 0 0 0 ${R} ${2 * R} A ${terminatorRx} ${R} 0 0 0 ${R} 0 Z`;
  } else if (p < 0.5) {
    // Waxing Gibbous: Shadow covers only left sliver (terminator sweep 1 curves left)
    shadowPath = `M ${R} 0 A ${R} ${R} 0 0 0 ${R} ${2 * R} A ${terminatorRx} ${R} 0 0 1 ${R} 0 Z`;
  } else if (p < 0.75) {
    // Waning Gibbous: Shadow covers only right sliver (terminator sweep 0 curves right)
    shadowPath = `M ${R} 0 A ${R} ${R} 0 0 1 ${R} ${2 * R} A ${terminatorRx} ${R} 0 0 0 ${R} 0 Z`;
  } else {
    // Waning Crescent: Shadow covers right hemisphere + bows into left side (terminator sweep 1 curves left)
    shadowPath = `M ${R} 0 A ${R} ${R} 0 0 1 ${R} ${2 * R} A ${terminatorRx} ${R} 0 0 1 ${R} 0 Z`;
  }

  const containerDim = diskSize + 14;

  return (
    <View style={[styles.container, { width: containerDim, height: containerDim }]}>
      {/* 1. Ambient Atmospheric Glow (Fixed bounds) */}
      <Svg
        width={containerDim}
        height={containerDim}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      >
        <Defs>
          <RadialGradient id="fixedMoonAura" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="50%" stopColor="#FDE68A" stopOpacity={glowOpacity * 0.8} />
            <Stop offset="80%" stopColor="#38BDF8" stopOpacity={glowOpacity * 0.3} />
            <Stop offset="100%" stopColor="#0284C7" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle
          cx={containerDim / 2}
          cy={containerDim / 2}
          r={haloRadius}
          fill="url(#fixedMoonAura)"
        />
      </Svg>

      {/* 2. Fixed Photographic Moon Body */}
      <View
        style={[
          styles.moonDisk,
          {
            width: diskSize,
            height: diskSize,
            borderRadius: diskRadius,
            backgroundColor: '#0F172A',
          },
        ]}
      >
        {/* Real High-Resolution Lunar Photograph */}
        {!imageFailed && (
          <Image
            source={{ uri: REAL_MOON_IMAGE_URI }}
            style={[styles.moonImage, { width: diskSize, height: diskSize }]}
            resizeMode="cover"
            onError={() => setImageFailed(true)}
          />
        )}

        {/* Realistic Procedural Lunar Texture Fallback (Shows while loading or if offline) */}
        {imageFailed && (
          <Svg width={diskSize} height={diskSize} viewBox={`0 0 ${diskSize} ${diskSize}`}>
            <Defs>
              <RadialGradient id="lunarSurfaceFixed" cx="45%" cy="45%" rx="55%" ry="55%">
                <Stop offset="0%" stopColor="#F8FAFC" />
                <Stop offset="50%" stopColor="#E2E8F0" />
                <Stop offset="85%" stopColor="#94A3B8" />
                <Stop offset="100%" stopColor="#475569" />
              </RadialGradient>
            </Defs>
            <Circle cx={R} cy={R} r={R} fill="url(#lunarSurfaceFixed)" />

            {/* Realistic Basaltic Lunar Maria */}
            <G opacity={0.45}>
              <Ellipse cx={R * 0.7} cy={R * 0.7} rx={R * 0.28} ry={R * 0.22} fill="#334155" />
              <Ellipse cx={R * 1.15} cy={R * 0.65} rx={R * 0.22} ry={R * 0.18} fill="#334155" />
              <Ellipse cx={R * 0.6} cy={R * 1.1} rx={R * 0.32} ry={R * 0.25} fill="#1E293B" />
              <Ellipse cx={R * 1.1} cy={R * 1.2} rx={R * 0.26} ry={R * 0.2} fill="#334155" />
            </G>

            {/* Tycho & Copernicus Crater Rays */}
            <Circle cx={R * 0.95} cy={R * 1.55} r={R * 0.07} fill="#FFFFFF" opacity={0.8} />
            <Circle cx={R * 0.65} cy={R * 0.85} r={R * 0.05} fill="#FFFFFF" opacity={0.7} />
          </Svg>
        )}

        {/* 3. Astronomical Shadow Overlay (Terminator Mask representing visibility) */}
        {shadowPath ? (
          <Svg
            width={diskSize}
            height={diskSize}
            viewBox={`0 0 ${diskSize} ${diskSize}`}
            style={StyleSheet.absoluteFill}
          >
            <Defs>
              <LinearGradient id="fixedEarthshineShadow" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0%" stopColor="#0B1320" stopOpacity={0.92} />
                <Stop offset="70%" stopColor="#040914" stopOpacity={0.94} />
                <Stop offset="100%" stopColor="#02060D" stopOpacity={0.96} />
              </LinearGradient>
            </Defs>

            <Path d={shadowPath} fill="url(#fixedEarthshineShadow)" />
          </Svg>
        ) : null}

        {/* 4. Fine Limb Rim */}
        <Svg
          width={diskSize}
          height={diskSize}
          viewBox={`0 0 ${diskSize} ${diskSize}`}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        >
          <Circle
            cx={R}
            cy={R}
            r={R - 0.5}
            fill="none"
            stroke={illumination > 50 ? 'rgba(254, 240, 138, 0.45)' : 'rgba(56, 189, 248, 0.25)'}
            strokeWidth={1}
          />
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  moonDisk: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 8,
  },
  moonImage: {
    position: 'absolute',
    transform: [{ scale: 1.84 }],
  },
});
