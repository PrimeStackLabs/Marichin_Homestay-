/**
 * Single Source of Truth for Cancellation & Refund Calculations (Client)
 * Mirrors server/utils/refundPolicy.js identically, plus safe host-contact visibility helpers.
 */

import {
  cleanInternationalPhone,
  isPlaceholderPhone,
  isPlaceholderEmail
} from './whatsappMessages';

export const DEFAULT_CANCELLATION_TIERS = Object.freeze([
  { daysBeforeCheckIn: 15, refundPercent: 100 },
  { daysBeforeCheckIn: 7, refundPercent: 50 },
  { daysBeforeCheckIn: 0, refundPercent: 0 }
]);

export const DEFAULT_SAFETY_FEATURES = Object.freeze({
  firstAidKit: false,
  fireExtinguisher: false,
  cctvCommonAreas: false,
  outdoorLighting: false,
  secureParking: false,
  onSiteCaretaker: false
});

export const SAFETY_FEATURE_DEFS = Object.freeze([
  {
    key: 'firstAidKit',
    icon: 'HeartPulse',
    title: { en: 'Basic First-Aid Kit', kn: 'ಪ್ರಾಥಮಿಕ ಚಿಕಿತ್ಸಾ ಪೆಟ್ಟಿಗೆ' },
    description: {
      en: 'A basic first-aid kit is stocked on the property for minor cuts, scrapes, and everyday needs.',
      kn: 'ಸಣ್ಣಪುಟ್ಟ ಗಾಯಗಳು ಮತ್ತು ದೈನಂದಿನ ಅಗತ್ಯಗಳಿಗಾಗಿ ಪ್ರಾಥಮಿಕ ಚಿಕಿತ್ಸಾ ಪೆಟ್ಟಿಗೆಯು ಲಭ್ಯವಿದೆ.'
    }
  },
  {
    key: 'fireExtinguisher',
    icon: 'Flame',
    title: { en: 'Fire Extinguisher', kn: 'ಅಗ್ನಿಶಾಮಕ ಸಾಧನ' },
    description: {
      en: 'Fire extinguisher is maintained at the homestay for emergency fire safety.',
      kn: 'ತುರ್ತು ಅಗ್ನಿ ಸುರಕ್ಷತೆಗಾಗಿ ಹೋಂಸ್ಟೇನಲ್ಲಿ ಅಗ್ನಿಶಾಮಕ ಸಾಧನವನ್ನು ಇರಿಸಲಾಗಿದೆ.'
    }
  },
  {
    key: 'cctvCommonAreas',
    icon: 'Video',
    title: { en: 'CCTV in Exterior / Common Areas', kn: 'ಹೊರಾಂಗಣ / ಸಾಮಾನ್ಯ ಪ್ರದೇಶಗಳಲ್ಲಿ ಸಿಸಿಟಿವಿ' },
    description: {
      en: 'Exterior entrances and common outdoor areas are covered by CCTV cameras (never inside private rooms).',
      kn: 'ಹೊರಾಂಗಣ ಪ್ರವೇಶ ಮತ್ತು ಸಾಮಾನ್ಯ ಪ್ರದೇಶಗಳಲ್ಲಿ ಸಿಸಿಟಿವಿ ಕ್ಯಾಮೆರಾಗಳಿವೆ (ಖಾಸಗಿ ಕೊಠಡಿಗಳಲ್ಲಿ ಅಲ್ಲ).'
    }
  },
  {
    key: 'outdoorLighting',
    icon: 'Sun',
    title: { en: 'Exterior Lighting', kn: 'ಹೊರಾಂಗಣ ಬೆಳಕಿನ ವ್ಯವಸ್ಥೆ' },
    description: {
      en: 'Pathways, parking area, and building entrances are lit after dusk for safe movement.',
      kn: 'ಸಂಜೆಯ ನಂತರ ನಡೆದಾಡುವ ದಾರಿಗಳು, ಪಾರ್ಕಿಂಗ್ ಮತ್ತು ಪ್ರವೇಶದ್ವಾರಗಳಲ್ಲಿ ಬೆಳಕಿನ ವ್ಯವಸ್ಥೆ ಇದೆ.'
    }
  },
  {
    key: 'secureParking',
    icon: 'Car',
    title: { en: 'On-Site Parking Space', kn: 'ಆವರಣದಲ್ಲಿ ಪಾರ್ಕಿಂಗ್ ಸೌಲಭ್ಯ' },
    description: {
      en: 'Dedicated on-site vehicle parking area within the homestay premises.',
      kn: 'ಹೋಂಸ್ಟೇ ಆವರಣದೊಳಗೆ ಅತಿಥಿ ವಾಹನಗಳಿಗೆ ನಿಗದಿತ ಪಾರ್ಕಿಂಗ್ ಸ್ಥಳ.'
    }
  },
  {
    key: 'onSiteCaretaker',
    icon: 'ShieldCheck',
    title: { en: 'Host / Caretaker Assistance', kn: 'ಆತಿಥೇಯ / ಪಾಲಕರ ಸಹಾಯ' },
    description: {
      en: 'Host or designated caretaker available during your stay to assist with check-in and property questions.',
      kn: 'ನಿಮ್ಮ ವಾಸ್ತವ್ಯದ ಸಮಯದಲ್ಲಿ ಚೆಕ್-ಇನ್ ಮತ್ತು ಅಗತ್ಯ ಸಹಾಯಕ್ಕಾಗಿ ಆತಿಥೇಯರು ಅಥವಾ ಪಾಲಕರು ಲಭ್ಯರಿರುತ್ತಾರೆ.'
    }
  }
]);

export const DEFAULT_DATE_CHANGE_RULE = Object.freeze({
  en: 'Date change requests are subject to room availability and tariff differences for the newly requested dates.',
  kn: 'ದಿನಾಂಕ ಬದಲಾವಣೆ ವಿನಂತಿಗಳು ಕೊಠಡಿ ಲಭ್ಯತೆ ಮತ್ತು ಹೊಸ ದಿನಾಂಕಗಳ ದರ ವ್ಯತ್ಯಾಸಕ್ಕೆ ಒಳಪಟ್ಟಿರುತ್ತವೆ.'
});

export const DEFAULT_EARLY_DEPARTURE_RULE = Object.freeze({
  en: 'Early check-out or reduction in nights after check-in is generally non-refundable unless approved by the host in exceptional cases.',
  kn: 'ಚೆಕ್-ಇನ್ ನಂತರ ಬೇಗನೆ ನಿರ್ಗಮಿಸಿದರೆ ಅಥವಾ ರಾತ್ರಿಗಳನ್ನು ಕಡಿಮೆ ಮಾಡಿದರೆ ಸಾಮಾನ್ಯವಾಗಿ ಮರುಪಾವತಿ ಲಭ್ಯವಿರುವುದಿಲ್ಲ.'
});

export const DEFAULT_GATEWAY_FEE_NOTE = Object.freeze({
  en: '',
  kn: ''
});

export const resolvePolicyText = (val, language = 'en') => {
  if (!val) return '';
  if (typeof val === 'string') return val.trim();
  if (typeof val === 'object') {
    const primary = language === 'kn' ? (val.kn || val.en) : (val.en || val.kn);
    return primary ? String(primary).trim() : '';
  }
  return String(val).trim();
};

export const normalizeCancellationTiers = (tiers) => {
  if (!Array.isArray(tiers) || tiers.length === 0) {
    return DEFAULT_CANCELLATION_TIERS.map((t) => ({ ...t }));
  }

  const byDays = new Map();
  for (const item of tiers) {
    if (!item || typeof item !== 'object') continue;
    const rawDays = Number(item.daysBeforeCheckIn);
    const rawPercent = Number(item.refundPercent);
    if (!Number.isFinite(rawDays) || !Number.isFinite(rawPercent)) continue;

    const daysBeforeCheckIn = Math.max(0, Math.round(rawDays));
    const refundPercent = Math.min(100, Math.max(0, Math.round(rawPercent)));
    byDays.set(daysBeforeCheckIn, { daysBeforeCheckIn, refundPercent });
  }

  if (byDays.size === 0) {
    return DEFAULT_CANCELLATION_TIERS.map((t) => ({ ...t }));
  }

  return Array.from(byDays.values()).sort((a, b) => b.daysBeforeCheckIn - a.daysBeforeCheckIn);
};

export const extractCalendarDateStr = (input) => {
  if (!input) return '';
  if (typeof input === 'string') {
    const trimmed = input.trim();
    const match = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];
    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toISOString().split('T')[0];
  }
  if (input instanceof Date && !Number.isNaN(input.getTime())) {
    return input.toISOString().split('T')[0];
  }
  return '';
};

export const getIstTodayStr = (referenceDate = new Date()) => {
  const dt = referenceDate instanceof Date ? referenceDate : new Date(referenceDate);
  if (Number.isNaN(dt.getTime())) {
    return new Date(Date.now() + 19800000).toISOString().split('T')[0];
  }
  return new Date(dt.getTime() + 19800000).toISOString().split('T')[0];
};

export const getDaysBeforeCheckIn = (checkInDate, referenceDate = new Date()) => {
  const checkInStr = extractCalendarDateStr(checkInDate);
  if (!checkInStr) return null;

  const refStr =
    typeof referenceDate === 'string' && /^\d{4}-\d{2}-\d{2}/.test(referenceDate.trim())
      ? referenceDate.trim().slice(0, 10)
      : getIstTodayStr(referenceDate);

  const [cy, cm, cd] = checkInStr.split('-').map(Number);
  const [ry, rm, rd] = refStr.split('-').map(Number);
  const checkInMs = Date.UTC(cy, cm - 1, cd);
  const refMs = Date.UTC(ry, rm - 1, rd);
  return Math.round((checkInMs - refMs) / 86400000);
};

export const calculateTierRefund = ({
  settings = {},
  checkInDate,
  paidAmount = 0,
  hostCancelled = false,
  isNoShow = false,
  referenceDate = new Date()
}) => {
  const sortedTiers = normalizeCancellationTiers(settings?.cancellationTiers);
  const paid = Math.max(0, Number(paidAmount) || 0);
  const noShowRefundPercent = Math.min(100, Math.max(0, Number(settings?.noShowRefundPercent ?? 0)));
  const hostCancelsRefundPercent = Math.min(100, Math.max(0, Number(settings?.hostCancelsRefundPercent ?? 100)));
  const daysBeforeCheckIn = getDaysBeforeCheckIn(checkInDate, referenceDate);

  if (hostCancelled) {
    return {
      daysBeforeCheckIn,
      refundPercent: hostCancelsRefundPercent,
      refundAmount: Math.round((paid * hostCancelsRefundPercent) / 100),
      paidAmount: paid,
      matchedTier: null,
      reason: 'host_cancelled',
      sortedTiers,
      noShowRefundPercent,
      hostCancelsRefundPercent
    };
  }

  if (isNoShow) {
    return {
      daysBeforeCheckIn,
      refundPercent: noShowRefundPercent,
      refundAmount: Math.round((paid * noShowRefundPercent) / 100),
      paidAmount: paid,
      matchedTier: null,
      reason: 'no_show',
      sortedTiers,
      noShowRefundPercent,
      hostCancelsRefundPercent
    };
  }

  if (daysBeforeCheckIn === null) {
    return {
      daysBeforeCheckIn: null,
      refundPercent: 0,
      refundAmount: 0,
      paidAmount: paid,
      matchedTier: null,
      reason: 'unknown_date',
      sortedTiers,
      noShowRefundPercent,
      hostCancelsRefundPercent
    };
  }

  if (daysBeforeCheckIn < 0) {
    return {
      daysBeforeCheckIn,
      refundPercent: noShowRefundPercent,
      refundAmount: Math.round((paid * noShowRefundPercent) / 100),
      paidAmount: paid,
      matchedTier: null,
      reason: 'past_checkin',
      sortedTiers,
      noShowRefundPercent,
      hostCancelsRefundPercent
    };
  }

  const matchedTier = sortedTiers.find((t) => daysBeforeCheckIn >= t.daysBeforeCheckIn) || null;
  const refundPercent = matchedTier ? matchedTier.refundPercent : 0;

  return {
    daysBeforeCheckIn,
    refundPercent,
    refundAmount: Math.round((paid * refundPercent) / 100),
    paidAmount: paid,
    matchedTier,
    reason: 'tier_match',
    sortedTiers,
    noShowRefundPercent,
    hostCancelsRefundPercent
  };
};

export const describeTierWindow = (tier, index, sortedTiers, language = 'en') => {
  const minDays = tier.daysBeforeCheckIn;
  const isKn = language === 'kn';

  if (index === 0) {
    return isKn
      ? `ಚೆಕ್-ಇನ್‌ಗಿಂತ ${minDays}+ ದಿನಗಳ ಮೊದಲು`
      : `${minDays}+ days before check-in`;
  }

  const prevMax = sortedTiers[index - 1].daysBeforeCheckIn - 1;
  if (minDays <= 0) {
    const cutoff = sortedTiers[index - 1].daysBeforeCheckIn;
    return isKn
      ? `ಚೆಕ್-ಇನ್‌ಗಿಂತ ${cutoff} ದಿನಗಳಿಗಿಂತ ಕಡಿಮೆ`
      : `Under ${cutoff} day${cutoff === 1 ? '' : 's'} before check-in`;
  }

  if (minDays === prevMax) {
    return isKn
      ? `ಚೆಕ್-ಇನ್‌ಗಿಂತ ${minDays} ದಿನಗಳ ಮೊದಲು`
      : `${minDays} day${minDays === 1 ? '' : 's'} before check-in`;
  }

  return isKn
    ? `ಚೆಕ್-ಇನ್‌ಗಿಂತ ${minDays}–${prevMax} ದಿನಗಳ ಮೊದಲು`
    : `${minDays}–${prevMax} days before check-in`;
};

export const formatCancellationSummaryText = (settings = {}, language = 'en') => {
  const sortedTiers = normalizeCancellationTiers(settings?.cancellationTiers);
  const isKn = language === 'kn';
  const noShow = Math.min(100, Math.max(0, Number(settings?.noShowRefundPercent ?? 0)));

  const rows = sortedTiers.map((tier, idx) => {
    const label = describeTierWindow(tier, idx, sortedTiers, language);
    return isKn ? `${label}: ${tier.refundPercent}% ಮರುಪಾವತಿ` : `${label}: ${tier.refundPercent}% refund`;
  });

  const lowest = sortedTiers[sortedTiers.length - 1];
  if (lowest && lowest.daysBeforeCheckIn > 0) {
    rows.push(
      isKn
        ? `ಚೆಕ್-ಇನ್‌ಗಿಂತ ${lowest.daysBeforeCheckIn} ದಿನಗಳಿಗಿಂತ ಕಡಿಮೆ: 0% ಮರುಪಾವತಿ`
        : `Under ${lowest.daysBeforeCheckIn} day${lowest.daysBeforeCheckIn === 1 ? '' : 's'} before check-in: 0% refund`
    );
  }

  rows.push(isKn ? `ಹಾಜರಾಗದಿದ್ದರೆ: ${noShow}% ಮರುಪಾವತಿ` : `No-show: ${noShow}% refund`);
  return rows.join(' • ');
};

export const formatPolicyLastUpdated = (dateVal, language = 'en') => {
  if (!dateVal) return '';
  const dt = new Date(dateVal);
  if (Number.isNaN(dt.getTime())) return '';
  return dt.toLocaleDateString(language === 'kn' ? 'kn-IN' : 'en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

/**
 * Extracts strictly confirmed (non-empty, non-placeholder) contact values from Site Settings.
 * Never falls back to dummy numbers or invented emails — returns '' when absent or placeholder.
 */
export const getPublicHostContact = (siteSettings = {}) => {
  const rawPhone = siteSettings?.phone || (Array.isArray(siteSettings?.phones) ? siteSettings.phones[0] : '') || '';
  const phone = !isPlaceholderPhone(rawPhone) ? String(rawPhone).trim() : '';

  const rawWa = siteSettings?.whatsappNumber || siteSettings?.whatsapp || '';
  const whatsapp = !isPlaceholderPhone(rawWa) ? String(rawWa).trim() : '';
  const whatsappDigits = whatsapp ? cleanInternationalPhone(whatsapp) : '';

  const rawEmail = siteSettings?.email || '';
  const email = !isPlaceholderEmail(rawEmail) ? String(rawEmail).trim() : '';

  const address = String(siteSettings?.address || '').trim();

  return {
    phone,
    telHref: phone ? `tel:+${cleanInternationalPhone(phone)}` : '',
    whatsapp,
    whatsappDigits,
    whatsappHref: whatsappDigits ? `https://wa.me/${whatsappDigits}` : '',
    email,
    emailHref: email ? `mailto:${email}` : '',
    address,
    hasAny: Boolean(phone || whatsapp || email)
  };
};

