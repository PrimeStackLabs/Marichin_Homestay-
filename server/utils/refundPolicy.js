/**
 * Single Source of Truth for Cancellation & Refund Calculations (Server)
 * Mirrors client/src/utils/refundPolicy.js identically.
 */

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

export const DEFAULT_DATE_CHANGE_RULE = Object.freeze({
  en: 'Date change requests are subject to room availability and tariff differences for the newly requested dates.',
  kn: 'ದಿನಾಂಕ ಬದಲಾವಣೆ ವಿನಂತಿಗಳು ಕೊಠಡಿ ಲಭ್ಯತೆ ಮತ್ತು ಹೊಸ ದಿನಾಂಕಗಳ ದರ ವ್ಯತ್ಯಾಸಕ್ಕೆ ಒಳಪಟ್ಟಿರುತ್ತವೆ.'
});

export const DEFAULT_EARLY_DEPARTURE_RULE = Object.freeze({
  en: 'Early check-out or reduction in nights after check-in is generally non-refundable unless approved by the host in exceptional cases.',
  kn: 'ಚೆಕ್-ಇನ್ ನಂತರ ಬೇಗನೆ ನಿರ್ಗಮಿಸಿದರೆ ಅಥವಾ ರಾತ್ರಿಗಳನ್ನು ಕಡಿಮೆ ಮಾಡಿದರೆ ಸಾಮಾನ್ಯವಾಗಿ ಮರುಪಾವತಿ ಲಭ್ಯವಿರುವುದಿಲ್ಲ.'
});

export const DEFAULT_GATEWAY_FEE_NOTE = Object.freeze({
  en: 'Payment gateway processing charges (if any) are handled as per Razorpay settlement terms; any approved refund is issued back to the original payment method.',
  kn: 'ಪಾವತಿ ಗೇಟ್‌ವೇ ಶುಲ್ಕಗಳು (ಯಾವುದಾದರೂ ಇದ್ದರೆ) ರೇಜರ್‌ಪೇ ನಿಯಮಗಳಿಗೆ ಒಳಪಟ್ಟಿರುತ್ತವೆ; ಅನುಮೋದಿತ ಮರುಪಾವತಿಯನ್ನು ಮೂಲ ಪಾವತಿ ವಿಧಾನಕ್ಕೆ ಹಿಂದಿರುಗಿಸಲಾಗುತ್ತದೆ.'
});

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

