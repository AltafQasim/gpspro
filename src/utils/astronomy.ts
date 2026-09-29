/**
 * High-precision marine astronomical calculations for Moon, Sun, and Solunar Fishing.
 * Computes exact moon phase, illumination percentage, moon age, distance, and rise/set timings
 * using standard NOAA Solar and Meeus Lunar ephemeris algorithms calibrated for coastal waters.
 */

export type MoonPhaseInfo = {
  phase: number; // 0.0 to 1.0 (0 = New, 0.25 = First Qtr, 0.5 = Full, 0.75 = Last Qtr)
  phaseKey:
    | 'phase_new'
    | 'phase_waxing_crescent'
    | 'phase_first_quarter'
    | 'phase_waxing_gibbous'
    | 'phase_full'
    | 'phase_waning_gibbous'
    | 'phase_last_quarter'
    | 'phase_waning_crescent';
  phaseNameEn: string;
  phaseNameGu: string;
  phaseNameHi: string;
  illumination: number; // 0 to 100
  moonAgeDays: number; // 0.0 to 29.53
  distanceKm: number; // ~356,500 to ~406,700
  sizeScale: number; // 0.88 to 1.15 for dynamic visual scaling (bada/chota)
  isWaxing: boolean;
  tideType: 'spring' | 'neap' | 'moderate';
  tideTitleEn: string;
  tideTitleGu: string;
  tideTitleHi: string;
  tideDescEn: string;
  tideDescGu: string;
  tideDescHi: string;
  moonrise: string;
  moonset: string;
  overhead: string;
  underfoot: string;
};

export type SunTimingInfo = {
  sunrise: string;
  sunset: string;
  dawn: string;
  dusk: string;
  solarNoon: string;
  goldenHour: string;
  daylightHours: number;
  daylightMinutes: number;
  sunAngleDeg: number;
};

// --- Astronomical Helper Functions ---

function getJulianDate(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5;
}

function normDeg(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

function formatHourMin(hourVal: number): string {
  let normalized = hourVal % 24;
  if (normalized < 0) normalized += 24;
  const totalMin = Math.round(normalized * 60) % 1440;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Calculates high-accuracy astronomical moon parameters, phase, and rise/set for any given Date and location.
 * Uses Meeus lunar position equations and IST local solar meridian transit.
 */
export function getMoonPhaseDetails(
  targetDate: Date = new Date(),
  lat: number = 20.9,
  lon: number = 70.36
): MoonPhaseInfo {
  const y = targetDate.getFullYear();
  const m = targetDate.getMonth();
  const d = targetDate.getDate();

  // Noon local time in IST (~06:30 UTC)
  const refDateUtc = new Date(Date.UTC(y, m, d, 6, 30, 0));
  const jd = getJulianDate(refDateUtc);
  const T = (jd - 2451545.0) / 36525.0;

  // Fundamental Lunar Arguments (Meeus Chap 47)
  const Lp = normDeg(218.3164477 + 481267.88123421 * T);
  const D = normDeg(297.8501921 + 445267.1114034 * T);
  const M = normDeg(357.5291092 + 35999.0502909 * T);
  const Mp = normDeg(134.9633964 + 477198.8675055 * T);
  const F = normDeg(93.272095 + 483202.0175233 * T);

  const Dr = degToRad(D);
  const Mr = degToRad(M);
  const Mpr = degToRad(Mp);
  const Fr = degToRad(F);

  // Periodic perturbations in Moon's longitude (degrees)
  const deltaL =
    6.288774 * Math.sin(Mpr) +
    1.274027 * Math.sin(2 * Dr - Mpr) +
    0.658309 * Math.sin(2 * Dr) +
    0.213618 * Math.sin(2 * Mpr) -
    0.185116 * Math.sin(Mr) -
    0.114332 * Math.sin(2 * Fr) +
    0.058793 * Math.sin(2 * Dr - 2 * Mpr) +
    0.057066 * Math.sin(2 * Dr - Mr - Mpr) +
    0.053322 * Math.sin(2 * Dr + Mpr) +
    0.046019 * Math.sin(2 * Dr - Mr) -
    0.03472 * Math.sin(Dr) -
    0.030465 * Math.sin(Mr + Mpr) +
    0.015327 * Math.sin(2 * Dr - 2 * Fr);

  const moonEclLong = normDeg(Lp + deltaL);

  // Periodic perturbations in Moon's latitude (degrees)
  const deltaB =
    5.128154 * Math.sin(Fr) +
    0.280602 * Math.sin(Mpr + Fr) +
    0.277693 * Math.sin(Mpr - Fr) +
    0.173237 * Math.sin(2 * Dr - Fr) +
    0.055413 * Math.sin(2 * Dr - Mpr + Fr) +
    0.046271 * Math.sin(2 * Dr - Mpr - Fr) +
    0.032573 * Math.sin(2 * Dr + Fr);

  const moonEclLat = deltaB;

  // Earth-Moon distance in kilometers
  const distanceKm = Math.round(
    385000.56 -
      20905.355 * Math.cos(Mpr) -
      3699.111 * Math.cos(2 * Dr - Mpr) -
      2955.968 * Math.cos(2 * Dr) -
      569.925 * Math.cos(2 * Mpr) +
      48.888 * Math.cos(Mr) -
      3.149 * Math.cos(2 * Fr)
  );

  // Obliquity of the Ecliptic
  const eps = 23.439291 - 0.0130042 * T;
  const epsRad = degToRad(eps);
  const lRad = degToRad(moonEclLong);
  const bRad = degToRad(moonEclLat);

  // Convert Moon coordinates to Right Ascension & Declination
  const sinDec =
    Math.sin(bRad) * Math.cos(epsRad) +
    Math.cos(bRad) * Math.sin(epsRad) * Math.sin(lRad);
  const moonDecRad = Math.asin(Math.max(-1, Math.min(1, sinDec)));

  const yRa =
    Math.cos(bRad) * Math.sin(lRad) * Math.cos(epsRad) -
    Math.sin(bRad) * Math.sin(epsRad);
  const xRa = Math.cos(bRad) * Math.cos(lRad);
  const moonRaDeg = normDeg(radToDeg(Math.atan2(yRa, xRa)));

  // Sun Ecliptic Longitude and RA
  const L0 = normDeg(280.46646 + T * 36000.76983);
  const Msun = normDeg(357.52911 + T * 35999.05029);
  const sunTrueLong = L0 + 1.914602 * Math.sin(degToRad(Msun));
  const sunRaDeg = normDeg(
    radToDeg(
      Math.atan2(
        Math.cos(epsRad) * Math.sin(degToRad(sunTrueLong)),
        Math.cos(degToRad(sunTrueLong))
      )
    )
  );

  // Phase & Illumination
  const phaseAngle = normDeg(moonEclLong - sunTrueLong);
  const phase = phaseAngle / 360; // 0.0 to 1.0
  const illumination = Math.round(((1 - Math.cos(degToRad(phaseAngle))) / 2) * 100);
  const moonAgeDays = parseFloat((phase * 29.530588853).toFixed(1));
  const isWaxing = phase < 0.5;

  // Dynamic Visual Scaling Factor
  const distanceScale = 1 + (384400 - distanceKm) / 70000;
  const phaseGlowScale = 0.88 + (illumination / 100) * 0.26;
  const sizeScale = parseFloat((distanceScale * phaseGlowScale).toFixed(2));

  // Solar Noon in IST for this observer's longitude (Standard meridian = 82.5° E)
  const deltaLonMin = (82.5 - lon) * 4;
  const eotMin =
    4 *
    radToDeg(
      0.043 * Math.sin(2 * degToRad(L0)) - 0.033 * Math.sin(degToRad(Msun))
    );
  const solarNoonHour = 12 + (deltaLonMin - eotMin) / 60;

  // Lunar transit (overhead) in IST:
  // Right ascension difference (Moon RA - Sun RA) gives the time offset from Solar Noon
  const raDiffHours = normDeg(moonRaDeg - sunRaDeg) / 15;
  const transitHour = ((solarNoonHour + raDiffHours) % 24 + 24) % 24;
  const underfootHour = ((transitHour + 12.42) % 24 + 24) % 24;

  // Moon Hour Angle for Rise / Set:
  // Moon zenith for rise/set ~ 89.875° (accounting for 57' parallax and 34' refraction)
  const latRad = degToRad(lat);
  const cosZenithMoon = Math.cos(degToRad(89.875));
  const cosHAMoon =
    (cosZenithMoon - Math.sin(latRad) * Math.sin(moonDecRad)) /
    (Math.cos(latRad) * Math.cos(moonDecRad));
  const haMoonDeg = radToDeg(Math.acos(Math.max(-1, Math.min(1, cosHAMoon))));
  const haMoonHours = haMoonDeg / 15;

  // Moon advances ~13.2° per day eastward, slightly extending the daily hour angle interval
  const moonriseHour = (((transitHour - haMoonHours * 0.98) % 24) + 24) % 24;
  const moonsetHour = (((transitHour + haMoonHours * 1.035) % 24) + 24) % 24;

  let phaseKey: MoonPhaseInfo['phaseKey'] = 'phase_new';
  let phaseNameEn = 'New Moon';
  let phaseNameGu = 'અમાસ (નવો ચંદ્ર)';
  let phaseNameHi = 'अमावस्या (नया चाँद)';

  if (phase < 0.03 || phase >= 0.97) {
    phaseKey = 'phase_new';
    phaseNameEn = 'New Moon (Amavasya / Amas)';
    phaseNameGu = 'અમાવસ્યા (અમાસ)';
    phaseNameHi = 'अमावस्या (अमास)';
  } else if (phase < 0.22) {
    phaseKey = 'phase_waxing_crescent';
    phaseNameEn = 'Waxing Crescent (Sud)';
    phaseNameGu = 'સુદ બીજ / ચોથ (વધતો ચંદ્ર)';
    phaseNameHi = 'शुक्ल द्वितीया / चतुर्थी (बढ़ता चाँद)';
  } else if (phase < 0.28) {
    phaseKey = 'phase_first_quarter';
    phaseNameEn = 'First Quarter (Ashtami)';
    phaseNameGu = 'સુદ આઠમ (પ્રથમ અર્ધચંદ્ર)';
    phaseNameHi = 'शुक्ल अष्टमी (पहला अर्धचंद्र)';
  } else if (phase < 0.47) {
    phaseKey = 'phase_waxing_gibbous';
    phaseNameEn = 'Waxing Gibbous';
    phaseNameGu = 'સુદ અગિયારસ / તેરસ';
    phaseNameHi = 'शुक्ल एकादशी / त्रयोदशी';
  } else if (phase < 0.53) {
    phaseKey = 'phase_full';
    phaseNameEn = 'Full Moon (Purnima / Poonam)';
    phaseNameGu = 'પૂનમ (પૂર્ણ ચંદ્ર)';
    phaseNameHi = 'पूर्णिमा (पूरा चाँद)';
  } else if (phase < 0.72) {
    phaseKey = 'phase_waning_gibbous';
    phaseNameEn = 'Waning Gibbous';
    phaseNameGu = 'વદ અગિયારસ / તેરસ';
    phaseNameHi = 'कृष्ण एकादशी / त्रयोदशी';
  } else if (phase < 0.78) {
    phaseKey = 'phase_last_quarter';
    phaseNameEn = 'Last Quarter (Vad Ashtami)';
    phaseNameGu = 'વદ આઠમ (બીજો અર્ધચંદ્ર)';
    phaseNameHi = 'कृष्ण अष्टमी (दूसरा अर्धचंद्र)';
  } else {
    phaseKey = 'phase_waning_crescent';
    phaseNameEn = 'Waning Crescent (Vad)';
    phaseNameGu = 'વદ બીજ / ચોથ (ઘટતો ચંદ્ર)';
    phaseNameHi = 'कृष्ण द्वितीया / चतुर्थी (घटता चाँद)';
  }

  // Tidal Strength & Marine Currents
  let tideType: MoonPhaseInfo['tideType'] = 'moderate';
  let tideTitleEn = 'Moderate Coastal Currents';
  let tideTitleGu = 'સામાન્ય ભરતી-ઓટ (મધ્યમ કરંટ)';
  let tideTitleHi = 'सामान्य ज्वार-भाटा (मध्यम धारा)';
  let tideDescEn = 'Balanced tidal range suitable for general fishing & nearshore netting.';
  let tideDescGu = 'સામાન્ય દરિયાઈ પ્રવાહ, સામાન્ય માછીમારી માટે અનુકૂળ સમય.';
  let tideDescHi = 'संतुलित समुद्री हलचल, सामान्य मछली पकड़ने के लिए उपयुक्त समय।';

  if (illumination >= 88 || illumination <= 12) {
    tideType = 'spring';
    tideTitleEn = 'SPRING TIDE (STRONG CURRENTS - JUVAR)';
    tideTitleGu = 'મોટી જુવાર (ભારે કરંટ - સ્પ્રિંગ ટાઈડ)';
    tideTitleHi = 'बड़ी ज्वार (तेज़ धारा - स्प्रिंग टाइड)';
    tideDescEn =
      'High tidal surge & maximum currents. Deep sea pelagic fish actively feed near reefs.';
    tideDescGu =
      'દરિયામાં ભારે કરંટ અને મોજા વધશે. ઊંડા પાણીની માછલીઓ ચરવા નીકળશે.';
    tideDescHi =
      'समुद्र में तेज़ धारा और लहरें बढ़ेंगी। गहरे पानी की मछलियाँ सक्रिय रूप से भोजन करेंगी।';
  } else if (Math.abs(phase - 0.25) < 0.08 || Math.abs(phase - 0.78) < 0.08) {
    tideType = 'neap';
    tideTitleEn = 'NEAP TIDE (WEAK CURRENTS - BHANJ)';
    tideTitleGu = 'શાંત ભાંજ (ધીમો કરંટ - નીપ ટાઈડ)';
    tideTitleHi = 'शांत भांज (धीमी धारा - नीप टाइड)';
    tideDescEn =
      'Gentle tidal movements with minimal water shift. Excellent anchor stability & bottom fishing.';
    tideDescGu =
      'પાણીની હિલચાલ શાંત રહેશે. તળિયે જાળી નાખવા અને એન્કર સ્થિર રાખવા ઉત્તમ.';
    tideDescHi =
      'पानी की हलचल शांत रहेगी। बॉटम फिशिंग और लंगर डालने के लिए बहुत अच्छा समय।';
  }

  return {
    phase,
    phaseKey,
    phaseNameEn,
    phaseNameGu,
    phaseNameHi,
    illumination,
    moonAgeDays,
    distanceKm,
    sizeScale,
    isWaxing,
    tideType,
    tideTitleEn,
    tideTitleGu,
    tideTitleHi,
    tideDescEn,
    tideDescGu,
    tideDescHi,
    moonrise: formatHourMin(moonriseHour),
    moonset: formatHourMin(moonsetHour),
    overhead: formatHourMin(transitHour),
    underfoot: formatHourMin(underfootHour),
  };
}

/**
 * Calculates high-precision Sun, dawn, dusk, solar noon, and golden hour timings
 * using the official NOAA Solar Calculation algorithm for any coastal latitude and longitude.
 */
export function getSunTimingDetails(
  targetDate: Date = new Date(),
  lat: number = 20.9,
  lon: number = 70.36
): SunTimingInfo {
  const y = targetDate.getFullYear();
  const m = targetDate.getMonth();
  const d = targetDate.getDate();

  // Noon local time in IST (~06:30 UTC)
  const noonUtc = new Date(Date.UTC(y, m, d, 6, 30, 0));
  const jd = getJulianDate(noonUtc);
  const T = (jd - 2451545.0) / 36525.0;

  // Sun geometric mean longitude
  const L0 = normDeg(280.46646 + T * (36000.76983 + T * 0.0003032));

  // Sun mean anomaly
  const M = normDeg(357.52911 + T * (35999.05029 - 0.0001537 * T));
  const Mrad = degToRad(M);

  // Earth orbit eccentricity
  const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);

  // Sun equation of center
  const C =
    Math.sin(Mrad) * (1.914602 - T * (0.004817 + 0.000014 * T)) +
    Math.sin(2 * Mrad) * (0.019993 - 0.000101 * T) +
    Math.sin(3 * Mrad) * 0.000289;

  // Sun true longitude
  const sunTrueLong = L0 + C;

  // Sun apparent longitude
  const omega = 125.04 - 1934.136 * T;
  const lambda = sunTrueLong - 0.00569 - 0.00478 * Math.sin(degToRad(omega));
  const lambdaRad = degToRad(lambda);

  // Mean obliquity of ecliptic
  const eps0 =
    23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60;
  const eps = eps0 + 0.00256 * Math.cos(degToRad(omega));
  const epsRad = degToRad(eps);

  // Solar declination
  const sinDec = Math.sin(epsRad) * Math.sin(lambdaRad);
  const declinationRad = Math.asin(Math.max(-1, Math.min(1, sinDec)));
  const declinationDeg = radToDeg(declinationRad);

  // Equation of Time (minutes)
  const yTan = Math.tan(epsRad / 2) * Math.tan(epsRad / 2);
  const L0Rad = degToRad(L0);
  const eotMin =
    4 *
    radToDeg(
      yTan * Math.sin(2 * L0Rad) -
        2 * e * Math.sin(Mrad) +
        4 * e * yTan * Math.sin(Mrad) * Math.cos(2 * L0Rad) -
        0.5 * yTan * yTan * Math.sin(4 * L0Rad) -
        1.25 * e * e * Math.sin(2 * Mrad)
    );

  // Local Solar Noon in Indian Standard Time (UTC+5.5, reference longitude 82.5° E)
  const deltaLonMin = (82.5 - lon) * 4;
  const solarNoonHour = 12 + (deltaLonMin - eotMin) / 60;

  // Hour angle for sunrise / sunset (zenith = 90.833° for atmospheric refraction & solar disc)
  const latRad = degToRad(lat);
  const cosZenithSun = Math.cos(degToRad(90.833));
  const cosHA0 =
    (cosZenithSun - Math.sin(latRad) * Math.sin(declinationRad)) /
    (Math.cos(latRad) * Math.cos(declinationRad));
  const ha0Deg = radToDeg(Math.acos(Math.max(-1, Math.min(1, cosHA0))));
  const halfDayHours = ha0Deg / 15;

  const sunriseHour = solarNoonHour - halfDayHours;
  const sunsetHour = solarNoonHour + halfDayHours;

  // Civil Twilight (Dawn / Dusk, zenith = 96.0°)
  const cosZenithCivil = Math.cos(degToRad(96.0));
  const cosHACivil =
    (cosZenithCivil - Math.sin(latRad) * Math.sin(declinationRad)) /
    (Math.cos(latRad) * Math.cos(declinationRad));
  const haCivilDeg = radToDeg(Math.acos(Math.max(-1, Math.min(1, cosHACivil))));
  const civilHalfHours = haCivilDeg / 15;

  const dawnHour = solarNoonHour - civilHalfHours;
  const duskHour = solarNoonHour + civilHalfHours;
  const goldenHour = sunsetHour - 0.75; // 45 min before sunset

  const daylightTotalHours = halfDayHours * 2;
  const daylightHours = Math.floor(daylightTotalHours);
  const daylightMinutes = Math.floor((daylightTotalHours - daylightHours) * 60);

  const sunAngleDeg = Math.round(90 - Math.abs(lat - declinationDeg));

  return {
    sunrise: formatHourMin(sunriseHour),
    sunset: formatHourMin(sunsetHour),
    dawn: formatHourMin(dawnHour),
    dusk: formatHourMin(duskHour),
    solarNoon: formatHourMin(solarNoonHour),
    goldenHour: formatHourMin(goldenHour),
    daylightHours,
    daylightMinutes,
    sunAngleDeg,
  };
}

/**
 * Maps raw tithi names (e.g. "Choth", "Poonam (Full Moon)") to accurate Gujarati, Hindi, or English names.
 */
export function getLocalizedTithiName(tithiName: string, lang: 'English' | 'Hindi' | 'Gujarati'): string {
  const guMap: Record<string, string> = {
    'Choth': 'ચોથ',
    'Pancham': 'પાંચમ',
    'Chhath': 'છઠ',
    'Satam': 'સાતમ',
    'Aatham': 'આઠમ',
    'Nom': 'નોમ',
    'Dasham': 'દસમ',
    'Agiyaras': 'અગિયારસ',
    'Baras': 'બારસ',
    'Teras': 'તેરસ',
    'Chaudas': 'ચૌદસ',
    'Poonam': 'પૂનમ',
    'Poonam (Full Moon)': 'પૂનમ (પૂર્ણ ચંદ્ર)',
    'Amas': 'અમાસ',
    'Amas (New Moon)': 'અમાસ (નવો ચંદ્ર)',
    'Ekam (Vad)': 'વદ એકમ',
    'Ekam (Sud)': 'સુદ એકમ',
    'Beej': 'બીજ',
    'Trij': 'ત્રીજ',
  };

  const hiMap: Record<string, string> = {
    'Choth': 'चतुर्थी',
    'Pancham': 'पंचमी',
    'Chhath': 'षष्ठी',
    'Satam': 'सप्तमी',
    'Aatham': 'अष्टमी',
    'Nom': 'नवमी',
    'Dasham': 'दशमी',
    'Agiyaras': 'एकादशी',
    'Baras': 'द्वादशी',
    'Teras': 'त्रयोदशी',
    'Chaudas': 'चतुर्दशी',
    'Poonam': 'पूर्णिमा',
    'Poonam (Full Moon)': 'पूर्णिमा (पूरा चाँद)',
    'Amas': 'अमावस्या',
    'Amas (New Moon)': 'अमावस्या (नया चाँद)',
    'Ekam (Vad)': 'कृष्ण प्रतिपदा',
    'Ekam (Sud)': 'शुक्ल प्रतिपदा',
    'Beej': 'द्वितीया',
    'Trij': 'तृतीया',
  };

  if (lang === 'Gujarati') {
    return guMap[tithiName] || tithiName;
  }
  if (lang === 'Hindi') {
    return hiMap[tithiName] || tithiName;
  }
  return tithiName;
}
