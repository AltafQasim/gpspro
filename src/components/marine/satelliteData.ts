import { Satellite } from './types';

// Realistic satellite constellation matching marine GPS skyplot screenshot
export const INITIAL_SATELLITES: Satellite[] = [
  // Green circles (Active GPS Locked in Fix)
  { id: 1, prn: 7, type: 'gps', used: true, azimuth: 0, elevation: 85, snr: 48 }, // zenith center
  { id: 2, prn: 1, type: 'gps', used: true, azimuth: 320, elevation: 60, snr: 44 },
  { id: 3, prn: 11, type: 'gps', used: true, azimuth: 95, elevation: 75, snr: 42 },
  { id: 4, prn: 21, type: 'gps', used: true, azimuth: 98, elevation: 55, snr: 43 },
  { id: 5, prn: 18, type: 'gps', used: true, azimuth: 355, elevation: 65, snr: 47 },
  { id: 6, prn: 23, type: 'gps', used: true, azimuth: 325, elevation: 25, snr: 39 },
  { id: 7, prn: 17, type: 'gps', used: true, azimuth: 35, elevation: 32, snr: 41 },
  { id: 8, prn: 14, type: 'gps', used: true, azimuth: 75, elevation: 22, snr: 38 },
  { id: 9, prn: 32, type: 'gps', used: true, azimuth: 120, elevation: 42, snr: 45 },
  { id: 10, prn: 22, type: 'gps', used: true, azimuth: 270, elevation: 26, snr: 40 },
  { id: 11, prn: 8, type: 'gps', used: true, azimuth: 240, elevation: 48, snr: 44 },
  { id: 12, prn: 31, type: 'gps', used: true, azimuth: 215, elevation: 26, snr: 41 },
  { id: 13, prn: 54, type: 'gps', used: true, azimuth: 210, elevation: 20, snr: 36 },
  { id: 14, prn: 44, type: 'gps', used: true, azimuth: 175, elevation: 25, snr: 40 },
  { id: 15, prn: 12, type: 'gps', used: true, azimuth: 160, elevation: 12, snr: 37 },
  { id: 16, prn: 19, type: 'gps', used: true, azimuth: 55, elevation: 30, snr: 42 },

  // Blue squares (GLONASS / Galileo / Tracked Visible Satellites)
  { id: 17, prn: 53, type: 'glonass', used: false, azimuth: 5, elevation: 68, snr: 34 },
  { id: 18, prn: 49, type: 'glonass', used: false, azimuth: 15, elevation: 64, snr: 35 },
  { id: 19, prn: 33, type: 'glonass', used: false, azimuth: 40, elevation: 52, snr: 32 },
  { id: 20, prn: 55, type: 'glonass', used: false, azimuth: 80, elevation: 65, snr: 38 },
  { id: 21, prn: 52, type: 'glonass', used: false, azimuth: 85, elevation: 42, snr: 36 },
  { id: 22, prn: 50, type: 'glonass', used: false, azimuth: 100, elevation: 36, snr: 33 },
  { id: 23, prn: 48, type: 'galileo', used: false, azimuth: 45, elevation: 18, snr: 30 },
  { id: 24, prn: 47, type: 'galileo', used: false, azimuth: 52, elevation: 14, snr: 29 },
  { id: 25, prn: 13, type: 'galileo', used: false, azimuth: 58, elevation: 10, snr: 28 },
  { id: 26, prn: 37, type: 'glonass', used: false, azimuth: 98, elevation: 15, snr: 31 },
  { id: 27, prn: 35, type: 'glonass', used: false, azimuth: 130, elevation: 35, snr: 34 },
  { id: 28, prn: 34, type: 'glonass', used: false, azimuth: 135, elevation: 32, snr: 33 },
  { id: 29, prn: 36, type: 'beidou', used: false, azimuth: 170, elevation: 58, snr: 35 },
  { id: 30, prn: 42, type: 'beidou', used: false, azimuth: 195, elevation: 50, snr: 31 },
  { id: 31, prn: 56, type: 'beidou', used: false, azimuth: 185, elevation: 42, snr: 30 },
  { id: 32, prn: 40, type: 'beidou', used: false, azimuth: 180, elevation: 32, snr: 32 },
  { id: 33, prn: 20, type: 'beidou', used: false, azimuth: 182, elevation: 26, snr: 29 },
  { id: 34, prn: 45, type: 'beidou', used: false, azimuth: 150, elevation: 22, snr: 28 },
  { id: 35, prn: 43, type: 'galileo', used: false, azimuth: 260, elevation: 62, snr: 35 },
  { id: 36, prn: 46, type: 'galileo', used: false, azimuth: 290, elevation: 48, snr: 33 },
  { id: 37, prn: 9, type: 'galileo', used: false, azimuth: 295, elevation: 44, snr: 32 },
  { id: 38, prn: 38, type: 'galileo', used: false, azimuth: 315, elevation: 22, snr: 30 },
  { id: 39, prn: 51, type: 'galileo', used: false, azimuth: 320, elevation: 18, snr: 31 },
  { id: 40, prn: 57, type: 'glonass', used: false, azimuth: 255, elevation: 18, snr: 29 },
];
