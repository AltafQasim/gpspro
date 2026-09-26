import React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { MarineFeatureId, Satellite } from './types';

interface FeatureModalProps {
  visible: boolean;
  featureId: MarineFeatureId | 'satellite' | 'coordinates' | null;
  featureTitle: string;
  selectedSat?: Satellite | null;
  nightMode?: boolean;
  onClose: () => void;
  onMarkWaypoint?: () => void;
}

export const FeatureModal: React.FC<FeatureModalProps> = ({
  visible,
  featureId,
  featureTitle,
  selectedSat,
  nightMode = false,
  onClose,
  onMarkWaypoint,
}) => {
  if (!visible || !featureId) return null;

  const colors = nightMode
    ? {
        bg: '#1A1C23',
        card: '#252836',
        text: '#ECEFF1',
        subtext: '#90A4AE',
        accent: '#00E676',
        border: 'rgba(255, 82, 82, 0.3)',
      }
    : {
        bg: '#FFFFFF',
        card: '#F4F6F9',
        text: '#212121',
        subtext: '#546E7A',
        accent: '#2979FF',
        border: '#E0E0E0',
      };

  const renderContent = () => {
    switch (featureId) {
      case 'compass':
        return (
          <View style={styles.contentBox}>
            <View style={[styles.badge, { backgroundColor: '#E3F2FD' }]}>
              <Text style={styles.badgeText}>HEADING: 142° SE (COURSE TO PORT)</Text>
            </View>
            <View style={styles.metricGrid}>
              <View style={[styles.metricCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.metricLabel, { color: colors.subtext }]}>True North</Text>
                <Text style={[styles.metricValue, { color: colors.text }]}>142.4°</Text>
              </View>
              <View style={[styles.metricCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.metricLabel, { color: colors.subtext }]}>Magnetic Var</Text>
                <Text style={[styles.metricValue, { color: colors.text }]}>+0.8° E</Text>
              </View>
              <View style={[styles.metricCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.metricLabel, { color: colors.subtext }]}>Speed (SOG)</Text>
                <Text style={[styles.metricValue, { color: '#00C853' }]}>0.0 kn</Text>
              </View>
              <View style={[styles.metricCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.metricLabel, { color: colors.subtext }]}>Pitch / Roll</Text>
                <Text style={[styles.metricValue, { color: colors.text }]}>+0.3° / -0.8°</Text>
              </View>
            </View>
          </View>
        );

      case 'waypoints':
        return (
          <View style={styles.contentBox}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Saved Fishing Marks (3 Active)</Text>
            <View style={styles.listWrap}>
              <View style={[styles.listItem, { backgroundColor: colors.card }]}>
                <Text style={styles.listIcon}>📍</Text>
                <View style={styles.listInfo}>
                  <Text style={[styles.listName, { color: colors.text }]}>Deep Coral Reef #4</Text>
                  <Text style={[styles.listSub, { color: colors.subtext }]}>N 20° 43.120&apos;, E 71° 06.400&apos; • 2.1 nmi</Text>
                </View>
                <Text style={styles.targetBadge}>TARGET</Text>
              </View>
              <View style={[styles.listItem, { backgroundColor: colors.card }]}>
                <Text style={styles.listIcon}>🦀</Text>
                <View style={styles.listInfo}>
                  <Text style={[styles.listName, { color: colors.text }]}>Crab / Lobster Cage Line</Text>
                  <Text style={[styles.listSub, { color: colors.subtext }]}>N 20° 45.890&apos;, E 71° 02.150&apos; • 3.4 nmi</Text>
                </View>
              </View>
              <View style={[styles.listItem, { backgroundColor: colors.card }]}>
                <Text style={styles.listIcon}>⚓</Text>
                <View style={styles.listInfo}>
                  <Text style={[styles.listName, { color: colors.text }]}>Harbor Return Safe Anchorage</Text>
                  <Text style={[styles.listSub, { color: colors.subtext }]}>N 20° 44.010&apos;, E 71° 00.220&apos; • 4.0 nmi</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity
              onPress={onMarkWaypoint}
              style={[styles.primaryActionBtn, { backgroundColor: '#FF5722' }]}>
              <Text style={styles.primaryActionText}>+ Mark Current Fishing Spot</Text>
            </TouchableOpacity>
          </View>
        );

      case 'map':
        return (
          <View style={styles.contentBox}>
            <View style={[styles.badge, { backgroundColor: '#EDE7F6' }]}>
              <Text style={[styles.badgeText, { color: '#512DA8' }]}>NAUTICAL BATHYMETRIC CHARTS</Text>
            </View>
            <Text style={[styles.descText, { color: colors.subtext }]}>
              Offline marine navigation chart with 5m depth contours, restricted shipping lanes, and coastal bathymetry ready.
            </Text>
            <View style={styles.chipRow}>
              <View style={[styles.featureChip, { backgroundColor: colors.card }]}>
                <Text style={[styles.chipText, { color: colors.text }]}>Depth Soundings: Active</Text>
              </View>
              <View style={[styles.featureChip, { backgroundColor: colors.card }]}>
                <Text style={[styles.chipText, { color: colors.text }]}>Coastline: High Res</Text>
              </View>
              <View style={[styles.featureChip, { backgroundColor: colors.card }]}>
                <Text style={[styles.chipText, { color: colors.text }]}>GPS Overlay: Realtime</Text>
              </View>
            </View>
          </View>
        );

      case 'tide':
        return (
          <View style={styles.contentBox}>
            <View style={[styles.badge, { backgroundColor: '#E0F2F1' }]}>
              <Text style={[styles.badgeText, { color: '#00796B' }]}>TIDAL PHASE: EBB TIDE (WATER RECEDING)</Text>
            </View>
            <View style={styles.metricGrid}>
              <View style={[styles.metricCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.metricLabel, { color: colors.subtext }]}>Next High Tide</Text>
                <Text style={[styles.metricValue, { color: '#00BFA5' }]}>04:30 PM (3.8 m)</Text>
              </View>
              <View style={[styles.metricCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.metricLabel, { color: colors.subtext }]}>Next Low Tide</Text>
                <Text style={[styles.metricValue, { color: '#FF7043' }]}>10:15 PM (0.6 m)</Text>
              </View>
            </View>
            <Text style={[styles.descText, { color: colors.subtext, marginTop: 10 }]}>
              🎣 Peak fish feeding activity occurs during tidal flow change: next optimal window in 1 hr 45 min.
            </Text>
          </View>
        );

      case 'settings':
        return (
          <View style={styles.contentBox}>
            <View style={[styles.settingRow, { backgroundColor: colors.card }]}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>GPS Datum</Text>
              <Text style={[styles.settingVal, { color: '#2979FF' }]}>WGS 84 (Universal Marine)</Text>
            </View>
            <View style={[styles.settingRow, { backgroundColor: colors.card }]}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Coordinate Format</Text>
              <Text style={[styles.settingVal, { color: '#2979FF' }]}>DD° MM.MMM&apos; (Nautical)</Text>
            </View>
            <View style={[styles.settingRow, { backgroundColor: colors.card }]}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>NMEA 0183 Output</Text>
              <Text style={[styles.settingVal, { color: '#00C853' }]}>4800 Baud • ACTIVE</Text>
            </View>
            <View style={[styles.settingRow, { backgroundColor: colors.card }]}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Speed Units</Text>
              <Text style={[styles.settingVal, { color: '#2979FF' }]}>Knots (kn)</Text>
            </View>
          </View>
        );

      case 'calendar':
        return (
          <View style={styles.contentBox}>
            <View style={[styles.badge, { backgroundColor: '#E1F5FE' }]}>
              <Text style={[styles.badgeText, { color: '#0288D1' }]}>SOLUNAR FISHING BITE INDEX: 88% (EXCELLENT)</Text>
            </View>
            <View style={styles.metricGrid}>
              <View style={[styles.metricCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.metricLabel, { color: colors.subtext }]}>Major Feeding Window</Text>
                <Text style={[styles.metricValue, { color: '#00C853' }]}>05:15 AM - 07:15 AM</Text>
              </View>
              <View style={[styles.metricCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.metricLabel, { color: colors.subtext }]}>Minor Feeding Window</Text>
                <Text style={[styles.metricValue, { color: '#FFB300' }]}>11:30 AM - 12:45 PM</Text>
              </View>
            </View>
            <Text style={[styles.descText, { color: colors.subtext, marginTop: 10 }]}>
              🌙 Moon Phase: Waxing Crescent (28% Illumination) • Good light conditions for night netting.
            </Text>
          </View>
        );

      case 'track':
        return (
          <View style={styles.contentBox}>
            <View style={[styles.badge, { backgroundColor: '#FCE4EC' }]}>
              <Text style={[styles.badgeText, { color: '#C2185B' }]}>CRUISE & TROLLING TRACK RECORDER</Text>
            </View>
            <View style={styles.metricGrid}>
              <View style={[styles.metricCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.metricLabel, { color: colors.subtext }]}>Current Trip</Text>
                <Text style={[styles.metricValue, { color: colors.text }]}>14.8 nmi</Text>
              </View>
              <View style={[styles.metricCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.metricLabel, { color: colors.subtext }]}>Time at Sea</Text>
                <Text style={[styles.metricValue, { color: colors.text }]}>3h 22m</Text>
              </View>
            </View>
            <TouchableOpacity style={[styles.primaryActionBtn, { backgroundColor: '#D81B60' }]}>
              <Text style={styles.primaryActionText}>⏺ Start Recording Return Track</Text>
            </TouchableOpacity>
          </View>
        );

      case 'weather':
        return (
          <View style={styles.contentBox}>
            <View style={[styles.badge, { backgroundColor: '#E3F2FD' }]}>
              <Text style={[styles.badgeText, { color: '#1565C0' }]}>ARABIAN SEA REGION • SAFE TO SAIL</Text>
            </View>
            <View style={styles.metricGrid}>
              <View style={[styles.metricCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.metricLabel, { color: colors.subtext }]}>Wind Speed</Text>
                <Text style={[styles.metricValue, { color: colors.text }]}>11 kn NW</Text>
              </View>
              <View style={[styles.metricCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.metricLabel, { color: colors.subtext }]}>Wave Height</Text>
                <Text style={[styles.metricValue, { color: '#00C853' }]}>1.1 m (Slight)</Text>
              </View>
              <View style={[styles.metricCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.metricLabel, { color: colors.subtext }]}>Water Temp</Text>
                <Text style={[styles.metricValue, { color: colors.text }]}>27.4 °C</Text>
              </View>
              <View style={[styles.metricCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.metricLabel, { color: colors.subtext }]}>Barometer</Text>
                <Text style={[styles.metricValue, { color: colors.text }]}>1013 hPa</Text>
              </View>
            </View>
          </View>
        );

      case 'camera':
        return (
          <View style={styles.contentBox}>
            <View style={[styles.badge, { backgroundColor: '#FFF3E0' }]}>
              <Text style={[styles.badgeText, { color: '#EF6C00' }]}>GEO-STAMPED MARINE CATCH LOG</Text>
            </View>
            <Text style={[styles.descText, { color: colors.subtext }]}>
              Capture photos of catch, fishing spots, and water conditions. Every photo automatically embeds exact GPS Coordinates, Water Depth, and Timestamp for your personal fishing log.
            </Text>
            <TouchableOpacity style={[styles.primaryActionBtn, { backgroundColor: '#673AB7' }]}>
              <Text style={styles.primaryActionText}>📷 Open Marine Camera</Text>
            </TouchableOpacity>
          </View>
        );

      case 'premium':
        return (
          <View style={styles.contentBox}>
            <View style={[styles.badge, { backgroundColor: '#FFF8E1' }]}>
              <Text style={[styles.badgeText, { color: '#F57F17' }]}>⭐ MARINE GPS PRO SUITE</Text>
            </View>
            <View style={styles.listWrap}>
              <Text style={[styles.premiumFeature, { color: colors.text }]}>
                ✓ Offline High-Res Bathymetric Sea Charts (No internet needed)
              </Text>
              <Text style={[styles.premiumFeature, { color: colors.text }]}>
                ✓ Unlimited Fishing Waypoints, Net Markers & Route Logs
              </Text>
              <Text style={[styles.premiumFeature, { color: colors.text }]}>
                ✓ Solunar Peak Fish Feeding & Bite Time Forecaster
              </Text>
              <Text style={[styles.premiumFeature, { color: colors.text }]}>
                ✓ Marine Weather, Wind Gust & Cyclone Radar Alerts
              </Text>
              <Text style={[styles.premiumFeature, { color: colors.text }]}>
                ✓ Cloud Sync across Phone, Tablet & Boat MFDs
              </Text>
            </View>
            <TouchableOpacity style={[styles.primaryActionBtn, { backgroundColor: '#FFB300' }]}>
              <Text style={[styles.primaryActionText, { color: '#000000' }]}>
                Start 7-Day Free Trial
              </Text>
            </TouchableOpacity>
          </View>
        );

      case 'satellite':
        if (!selectedSat) return null;
        return (
          <View style={styles.contentBox}>
            <View style={[styles.badge, { backgroundColor: '#E8F5E9' }]}>
              <Text style={[styles.badgeText, { color: '#2E7D32' }]}>
                SATELLITE PRN #{selectedSat.prn} • {selectedSat.type.toUpperCase()}
              </Text>
            </View>
            <View style={styles.metricGrid}>
              <View style={[styles.metricCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.metricLabel, { color: colors.subtext }]}>Status</Text>
                <Text
                  style={[
                    styles.metricValue,
                    { color: selectedSat.used ? '#00C853' : '#2979FF' },
                  ]}>
                  {selectedSat.used ? 'LOCKED (USED)' : 'TRACKING'}
                </Text>
              </View>
              <View style={[styles.metricCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.metricLabel, { color: colors.subtext }]}>Signal Strength</Text>
                <Text style={[styles.metricValue, { color: colors.text }]}>
                  {selectedSat.snr} dB-Hz
                </Text>
              </View>
              <View style={[styles.metricCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.metricLabel, { color: colors.subtext }]}>Elevation</Text>
                <Text style={[styles.metricValue, { color: colors.text }]}>
                  {selectedSat.elevation}°
                </Text>
              </View>
              <View style={[styles.metricCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.metricLabel, { color: colors.subtext }]}>Azimuth</Text>
                <Text style={[styles.metricValue, { color: colors.text }]}>
                  {selectedSat.azimuth}°
                </Text>
              </View>
            </View>
          </View>
        );

      case 'coordinates':
        return (
          <View style={styles.contentBox}>
            <View style={[styles.badge, { backgroundColor: '#E8F5E9' }]}>
              <Text style={[styles.badgeText, { color: '#2E7D32' }]}>
                DGPS 3D FIX LOCKED (3 METERS CEP)
              </Text>
            </View>
            <Text style={[styles.coordLarge, { color: colors.text }]}>
              N 20° 44.572&apos;{'\n'}E 71° 04.313&apos;
            </Text>
            <Text style={[styles.descText, { color: colors.subtext }]}>
              Veraval / Diu Coastline • Arabian Sea Fishing Basin
            </Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                onPress={onClose}
                style={[styles.primaryActionBtn, { flex: 1, backgroundColor: '#00C853' }]}>
                <Text style={styles.primaryActionText}>📋 Copy for VHF / Radio</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.modalCard, { backgroundColor: colors.bg }]}>
              {/* Drag Handle */}
              <View style={styles.handleBar} />

              {/* Header */}
              <View style={styles.headerRow}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                  {featureTitle}
                </Text>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <Text style={[styles.closeBtnText, { color: colors.subtext }]}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}>
                {renderContent()}

                {/* Subtext indicating ready for dedicated screens */}
                <View style={[styles.nextScreenHint, { backgroundColor: colors.card }]}>
                  <Text style={[styles.hintText, { color: colors.subtext }]}>
                    💡 <Text style={{ fontWeight: '700' }}>Note for developer:</Text> Home page preview is live. Send the next dedicated page design anytime to replace this sheet with the full screen!
                  </Text>
                </View>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
    maxHeight: '75%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  handleBar: {
    width: 44,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#B0BEC5',
    alignSelf: 'center',
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: 16,
  },
  contentBox: {
    gap: 14,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  descText: {
    fontSize: 14,
    lineHeight: 20,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    flexBasis: '48%',
    flexGrow: 1,
    padding: 12,
    borderRadius: 12,
    gap: 4,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  listWrap: {
    gap: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  listIcon: {
    fontSize: 20,
  },
  listInfo: {
    flex: 1,
  },
  listName: {
    fontSize: 14,
    fontWeight: '700',
  },
  listSub: {
    fontSize: 12,
    marginTop: 2,
  },
  targetBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D50000',
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  primaryActionBtn: {
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  settingVal: {
    fontSize: 13,
    fontWeight: '700',
  },
  premiumFeature: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 22,
  },
  coordLarge: {
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.8,
    lineHeight: 32,
    marginVertical: 6,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  featureChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  nextScreenHint: {
    marginTop: 20,
    padding: 12,
    borderRadius: 10,
  },
  hintText: {
    fontSize: 12.5,
    lineHeight: 18,
  },
});
