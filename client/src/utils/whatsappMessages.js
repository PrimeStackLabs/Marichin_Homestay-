/**
 * Shared WhatsApp Message Builder for Marichin Homestay
 * Used by:
 *  - Guest Confirmation Screen (BookingPassCard.jsx in Booking.jsx)
 *  - Pass Page (BookingPassCard.jsx in Pass.jsx)
 *  - Admin Dashboard & Modals (AdminLayout.jsx)
 *  - Booking Status Portal (BookingStatus.jsx)
 *
 * Safe Emoji Rule:
 * Emojis are constructed strictly via code-point escapes (never pasted literals)
 * to avoid encoding corruption / question-mark box artifacts:
 *  - Heading: codePoint 0x1F33F
 *  - Dates: codePoint 0x1F4C5
 *  - Guests: codePoint 0x1F465
 *  - Payment: codePoint 0x1F4B3
 *  - Location: codePoint 0x1F4CD
 * All other emojis are dropped in favor of clean text and bullets.
 */

export const EMOJI = Object.freeze({
  HEADING: String.fromCodePoint(0x1F33F),
  DATES: String.fromCodePoint(0x1F4C5),
  GUESTS: String.fromCodePoint(0x1F465),
  PAYMENT: String.fromCodePoint(0x1F4B3),
  LOCATION: String.fromCodePoint(0x1F4CD)
});

/**
 * Format date to "19 Nov 2026"
 */
export const formatDisplayDate = (dateVal) => {
  if (!dateVal) return '';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

export const DEFAULT_HOST_PHONE = '+91 95912 09522';
export const DEFAULT_HOST_WHATSAPP_DIGITS = '919591209522';
export const DEFAULT_HOST_EMAIL = 'coorgmarichinhomestay@gmail.com';
export const DEFAULT_INSTAGRAM_URL = 'https://www.instagram.com/coorg_marichin_homestay?utm_source=qr&cplk=bWd6MjhrcHducjVt';
export const DEFAULT_INSTAGRAM_HANDLE = '@coorg_marichin_homestay';
export const DEFAULT_FACEBOOK_URL = 'https://www.facebook.com/profile.php?id=61596613283636';
export const DEFAULT_YOUTUBE_URL = 'https://www.youtube.com/channel/UCaf39e4l1iRDA-CMj72q1gQ';

/**
 * Checks if a host email is empty, a placeholder (XXXXX), or an old sample email
 */
export const isPlaceholderEmail = (email) => {
  if (!email) return true;
  const normalized = String(email).trim().toLowerCase();
  if (!normalized || !normalized.includes('@') || normalized.includes('xxxxx') || normalized.endsWith('@example.com')) {
    return true;
  }
  if (
    normalized === 'info@marichinhomestay.com' ||
    normalized === 'contact@marichinhomestay.com' ||
    normalized === 'support@marichinhomestay.com' ||
    normalized === 'stay@marichinhomestay.com'
  ) {
    return true;
  }
  return false;
};

/**
 * Resolves the verified homestay email, falling back to DEFAULT_HOST_EMAIL
 * whenever the stored value is empty, a placeholder (XXXXX), or a sample email.
 */
export const resolveHostEmail = (email) => {
  return !isPlaceholderEmail(email) ? String(email).trim() : DEFAULT_HOST_EMAIL;
};

/**
 * Normalizes phone numbers to international format (without + or spaces).
 * 10-digit Indian numbers get '91' prefixed.
 */
export const cleanInternationalPhone = (phone) => {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.startsWith('0') && digits.length === 11) return `91${digits.slice(1)}`;
  return digits;
};

/**
 * Checks if a phone number is a placeholder (e.g. XXXXX, 00000, 9876543210, etc.)
 */
export const isPlaceholderPhone = (phone) => {
  if (!phone) return true;
  const str = String(phone).toLowerCase();
  if (str.includes('x') || str.includes('00000')) return true;
  const digits = str.replace(/\D/g, '');
  if (!digits || digits.length < 8) return true;
  if (
    /^0+$/.test(digits) ||
    /^(\d)\1+$/.test(digits) ||
    digits === '9876543210' ||
    digits === '1234567890' ||
    digits === '9480180455' ||
    digits === '919480180455'
  ) {
    return true;
  }
  return false;
};

/**
 * Resolves a real host phone number, falling back to the verified property number
 * whenever the stored value is empty, a placeholder (XXXXX), or the old sample number.
 */
export const resolveHostPhone = (phone) => {
  return !isPlaceholderPhone(phone) ? String(phone).trim() : DEFAULT_HOST_PHONE;
};

/**
 * Checks if an Instagram URL is empty, generic placeholder, or the old sample handle
 */
export const isPlaceholderInstagramUrl = (url) => {
  if (!url) return true;
  const normalized = String(url).trim().toLowerCase().replace(/\/+$/, '');
  if (
    !normalized ||
    normalized === 'https://instagram.com' ||
    normalized === 'http://instagram.com' ||
    normalized === 'https://www.instagram.com' ||
    normalized === 'http://www.instagram.com' ||
    normalized.includes('instagram.com/marichinhomestay')
  ) {
    return true;
  }
  return false;
};

/**
 * Resolves the verified Instagram URL, falling back to the real Marichin Homestay account
 * whenever the stored value is empty, a generic root URL, or the old sample handle.
 */
export const resolveInstagramUrl = (url) => {
  return !isPlaceholderInstagramUrl(url) ? String(url).trim() : DEFAULT_INSTAGRAM_URL;
};

/**
 * Checks if a Facebook URL is empty, generic root URL, or the old sample handle
 */
export const isPlaceholderFacebookUrl = (url) => {
  if (!url) return true;
  const normalized = String(url).trim().toLowerCase().replace(/\/+$/, '');
  if (
    !normalized ||
    normalized === 'https://facebook.com' ||
    normalized === 'http://facebook.com' ||
    normalized === 'https://www.facebook.com' ||
    normalized === 'http://www.facebook.com' ||
    normalized.includes('facebook.com/marichinhomestay')
  ) {
    return true;
  }
  return false;
};

/**
 * Resolves the verified Facebook URL, falling back to the real Marichin Homestay profile
 * whenever the stored value is empty, a generic root URL, or the old sample handle.
 */
export const resolveFacebookUrl = (url) => {
  return !isPlaceholderFacebookUrl(url) ? String(url).trim() : DEFAULT_FACEBOOK_URL;
};

/**
 * Checks if a YouTube URL is empty, generic root URL, or the old sample handle
 */
export const isPlaceholderYoutubeUrl = (url) => {
  if (!url) return true;
  const normalized = String(url).trim().toLowerCase().replace(/\/+$/, '');
  if (
    !normalized ||
    normalized === 'https://youtube.com' ||
    normalized === 'http://youtube.com' ||
    normalized === 'https://www.youtube.com' ||
    normalized === 'http://www.youtube.com' ||
    normalized.includes('youtube.com/@marichinhomestay') ||
    normalized.includes('youtube.com/marichinhomestay')
  ) {
    return true;
  }
  return false;
};

/**
 * Resolves the verified YouTube channel URL, falling back to the real Marichin Homestay channel
 * whenever the stored value is empty, a generic root URL, or the old sample handle.
 */
export const resolveYoutubeUrl = (url) => {
  return !isPlaceholderYoutubeUrl(url) ? String(url).trim() : DEFAULT_YOUTUBE_URL;
};

/**
 * Helper to compute nights count as integer
 */
export const getNightsCount = (booking) => {
  if (!booking) return 1;
  if (Array.isArray(booking.nights)) return booking.nights.length;
  if (typeof booking.nights === 'number' && booking.nights > 0) return booking.nights;
  if (booking.nightsCount) return booking.nightsCount;
  if (booking.checkIn && booking.checkOut) {
    const dIn = new Date(booking.checkIn).getTime();
    const dOut = new Date(booking.checkOut).getTime();
    const diffDays = Math.round((dOut - dIn) / (1000 * 60 * 60 * 24));
    if (diffDays > 0) return diffDays;
  }
  return 1;
};

/**
 * Helper to get clean accommodation name
 */
export const getStayDisplayName = (booking, isKn = false) => {
  if (!booking) return isKn ? 'ಕೊಠಡಿ' : 'Room';
  if (booking.bookingType === 'full_home') {
    return isKn ? 'ಸಂಪೂರ್ಣ ಹೋಂಸ್ಟೇ (ಎಲ್ಲಾ 5 ಕೊಠಡಿಗಳು)' : 'Full Home (All 5 Rooms)';
  }
  return booking.roomName || booking.room?.name || (isKn ? 'ಸ್ಟ್ಯಾಂಡರ್ಡ್ ಕೊಠಡಿ' : 'Standard Room');
};

/**
 * Safely resolves the origin URL without hardcoding localhost
 */
const getOrigin = (baseUrl) => {
  if (baseUrl) return String(baseUrl).replace(/\/+$/, '');
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return window.location.origin;
  }
  if (typeof process !== 'undefined' && process.env) {
    const envUrl = process.env.SITE_URL || process.env.APP_URL;
    if (envUrl) return String(envUrl).replace(/\/+$/, '');
  }
  return '';
};

/**
 * 1. Booking Confirmed Message
 */
const buildBookingConfirmedText = (booking, siteSettings, language, baseUrl) => {
  const isKn = language === 'kn';
  const refCode = booking.bookingCode || booking.id || booking._id || 'MH-REF';
  const passToken = booking.passToken || refCode;
  const guestName = booking.guestName || booking.guest?.fullName || booking.primaryGuest?.name || 'Valued Guest';
  const checkInDate = formatDisplayDate(booking.checkIn);
  const checkOutDate = formatDisplayDate(booking.checkOut);
  const checkInTime = siteSettings?.checkInTime || '12:00 PM';
  const checkOutTime = siteSettings?.checkOutTime || '11:00 AM';
  const nights = getNightsCount(booking);
  const adults = booking.adults ?? booking.guestCount?.adults ?? 2;
  const children = booking.children ?? booking.guestCount?.children ?? 0;
  const stayName = getStayDisplayName(booking, isKn);

  const total = Number(
    booking.totalAmount ?? booking.pricing?.total ?? booking.pricing?.totalAmount ?? 0
  ).toLocaleString('en-IN');
  const advance = Number(
    booking.advancePaid ?? (booking.amountPaidPaise ? Math.round(booking.amountPaidPaise / 100) : 0)
  ).toLocaleString('en-IN');
  const balance = Number(
    booking.balanceDue ?? Math.max(0, (booking.pricing?.total || 0) - (booking.advancePaid || 0))
  ).toLocaleString('en-IN');

  const origin = getOrigin(baseUrl);
  const passUrl = origin ? `${origin}/pass/${passToken}` : `/pass/${passToken}`;

  const hostAddress = (siteSettings?.address || 'Chikkabettageri Village, Gudde Hosur Post, Kushalnagar, Kodagu District, Karnataka 571234').trim();
  const stayGps = "12°25'32.1\"N 75°54'42.8\"E";
  const defaultMapUrl = 'https://www.google.com/maps/dir/?api=1&destination=12.425583,75.911889';
  const mapUrl = (siteSettings?.googleMapsShareUrl && siteSettings.googleMapsShareUrl.trim()) || defaultMapUrl;

  const hostPhone = siteSettings?.whatsappNumber || siteSettings?.whatsapp || (siteSettings?.phones && siteSettings.phones[0]) || '';
  const cleanPhone = resolveHostPhone(hostPhone);

  if (isKn) {
    const guestsText = `${adults} ವಯಸ್ಕರು${children > 0 ? `, ${children} ಮಕ್ಕಳು` : ''}`;
    const nightsText = `${nights} ${nights > 1 ? 'ರಾತ್ರಿಗಳು' : 'ರಾತ್ರಿ'}`;

    return [
      `${EMOJI.HEADING} *ಮರಿಚಿನ್ ಹೋಂಸ್ಟೇ - ಅಧಿಕೃತ ಬುಕಿಂಗ್ ಪಾಸ್* ${EMOJI.HEADING}`,
      `ಕುಶಾಲನಗರ, ಕೊಡಗಿನ ಮರಿಚಿನ್ ಹೋಂಸ್ಟೇಗೆ ಹೃತ್ಪೂರ್ವಕ ಸ್ವಾಗತ!`,
      ``,
      `ಆತ್ಮೀಯ *${guestName}*,`,
      `ನಿಮ್ಮ ಬುಕಿಂಗ್ ಯಶಸ್ವಿಯಾಗಿ ದೃಢೀಕರಿಸಲ್ಪಟ್ಟಿದೆ. ನಿಮ್ಮ ಅಧಿಕೃತ ಚೆಕ್-ಇನ್ ಪಾಸ್ ವಿವರಗಳು:`,
      ``,
      `*ಬುಕಿಂಗ್ ರೆಫರೆನ್ಸ್:* ${refCode}`,
      `${EMOJI.DATES} *ಚೆಕ್-ಇನ್:* ${checkInDate} (${checkInTime} ನಂತರ)`,
      `${EMOJI.DATES} *ಚೆಕ್-ಔಟ್:* ${checkOutDate} (${checkOutTime} ಒಳಗೆ)`,
      `*ವಾಸ್ತವ್ಯ ಅವಧಿ:* ${nightsText}`,
      `${EMOJI.GUESTS} *ಅತಿಥಿಗಳು:* ${guestsText}`,
      `*ವಾಸ್ತವ್ಯ:* ${stayName}`,
      ``,
      `${EMOJI.PAYMENT} *ದರ ಮತ್ತು ಪಾವತಿ ವಿವರ:*`,
      `• ಒಟ್ಟು ವೆಚ್ಚ: ₹${total}`,
      `• ಮುಂಗಡ ಪಾವತಿ: ₹${advance}`,
      `• ಚೆಕ್-ಇನ್ ಸಮಯದಲ್ಲಿ ಬಾಕಿ: ₹${balance}`,
      ``,
      `*ನಿಮ್ಮ ಬುಕಿಂಗ್ ಪಾಸ್ (QR ಮತ್ತು ವಿವರಗಳು):*`,
      `${passUrl}`,
      ``,
      cleanPhone
        ? `ನಿಮ್ಮ ಆಗಮನಕ್ಕಾಗಿ ನಾವು ಎದುರುನೋಡುತ್ತಿದ್ದೇವೆ! ಯಾವುದೇ ಪ್ರಶ್ನೆಗಳಿಗೆ ಸಂಪರ್ಕಿಸಿ: ${cleanPhone}.`
        : `ನಿಮ್ಮ ಆಗಮನಕ್ಕಾಗಿ ನಾವು ಎದುರುನೋಡುತ್ತಿದ್ದೇವೆ!`,
      ``,
      `${EMOJI.LOCATION} *ಹೋಂಸ್ಟೇ ಇರುವ ನಿಖರ ಸ್ಥಳ ಮತ್ತು ಲೈವ್ ಮಾರ್ಗ (GPS):*`,
      `• ಜಿಪಿಎಸ್ ಪಿನ್: ${stayGps}`,
      `• ವಿಳಾಸ: ${hostAddress}`,
      `• ಲೈವ್ ಗೂಗಲ್ ಮ್ಯಾಪ್ ದಾರಿ: ${mapUrl}`,
      `(ನಿಮ್ಮ ಮೊಬೈಲ್‌ನಲ್ಲಿ ನೇರ ದಾರಿ ಪಡೆಯಲು ಮೇಲಿನ ಲಿಂಕ್ ಟ್ಯಾಪ್ ಮಾಡಿ)`
    ].join('\n');
  }

  const guestsText = `${adults} Adults${children > 0 ? `, ${children} Children` : ''}`;
  const nightsText = `${nights} Night${nights > 1 ? 's' : ''}`;

  return [
    `${EMOJI.HEADING} *MARICHIN HOMESTAY - OFFICIAL BOOKING PASS* ${EMOJI.HEADING}`,
    `Warm greetings from Marichin Homestay, Kushalnagar, Coorg!`,
    ``,
    `Dear *${guestName}*,`,
    `Your booking reservation is confirmed. Here is your official check-in pass:`,
    ``,
    `*Booking Pass Ref:* ${refCode}`,
    `${EMOJI.DATES} *Check-In:* ${checkInDate} (${checkInTime} onwards)`,
    `${EMOJI.DATES} *Check-Out:* ${checkOutDate} (by ${checkOutTime})`,
    `*Duration:* ${nightsText}`,
    `${EMOJI.GUESTS} *Guests:* ${guestsText}`,
    `*Stay:* ${stayName}`,
    ``,
    `${EMOJI.PAYMENT} *Tariff & Payment:*`,
    `• Total Tariff: ₹${total}`,
    `• Advance Paid: ₹${advance}`,
    `• Balance Due at Check-In: ₹${balance}`,
    ``,
    `*Your booking pass (QR and details):*`,
    `${passUrl}`,
    ``,
    cleanPhone
      ? `We look forward to hosting you in peaceful coffee country! For any queries or arrival coordination, contact: ${cleanPhone}.`
      : `We look forward to hosting you in peaceful coffee country!`,
    ``,
    `${EMOJI.LOCATION} *Official Stay Location & Live Driving Navigation:*`,
    `• Exact GPS Pin: ${stayGps}`,
    `• Address: ${hostAddress}`,
    `• Live Google Maps Directions: ${mapUrl}`,
    `(Tap the link above on your mobile phone for direct turn-by-turn navigation straight to our estate gate)`
  ].join('\n');
};

/**
 * 2. Cannot Host These Dates Hook
 */
const buildCannotHostText = (booking, siteSettings, language, options = {}) => {
  const isKn = language === 'kn';
  const refCode = booking.bookingCode || booking.id || 'MH-REF';
  const guestName = booking.guestName || booking.primaryGuest?.name || 'Valued Guest';
  const checkInDate = formatDisplayDate(booking.checkIn);
  const checkOutDate = formatDisplayDate(booking.checkOut);
  const reason = options.reason || booking.dateChangeReason || (isKn ? 'ನಿರ್ವಹಣೆ ಅಥವಾ ಆಸ್ತಿ ಅಲಭ್ಯತೆ' : 'Maintenance or property unavailability');

  const alternateRanges = options.alternateRanges || [];
  let rangesTextEn = '';
  let rangesTextKn = '';

  if (alternateRanges.length > 0) {
    rangesTextEn = alternateRanges
      .map((r, i) => {
        if (typeof r === 'string') return `${i + 1}. ${r}`;
        const s = formatDisplayDate(r.checkIn || r.from);
        const e = formatDisplayDate(r.checkOut || r.to);
        return `${i + 1}. ${s} to ${e}`;
      })
      .join('\n');

    rangesTextKn = alternateRanges
      .map((r, i) => {
        if (typeof r === 'string') return `${i + 1}. ${r}`;
        const s = formatDisplayDate(r.checkIn || r.from);
        const e = formatDisplayDate(r.checkOut || r.to);
        return `${i + 1}. ${s} ರಿಂದ ${e}`;
      })
      .join('\n');
  }

  if (isKn) {
    return [
      `${EMOJI.HEADING} *ಮರಿಚಿನ್ ಹೋಂಸ್ಟೇ - ದಿನಾಂಕ ಬದಲಾವಣೆ ವಿನಂತಿ* ${EMOJI.HEADING}`,
      `ಕುಶಾಲನಗರ, ಕೊಡಗಿನ ಮರಿಚಿನ್ ಹೋಂಸ್ಟೇ ವತಿಯಿಂದ ನಮಸ್ಕಾರ.`,
      ``,
      `ಆತ್ಮೀಯ *${guestName}*,`,
      `ಕ್ಷಮಿಸಿ, ಅನಿವಾರ್ಯ ಕಾರಣಗಳಿಂದ ನಾವು ನಿಮ್ಮ ನಿಗದಿತ ದಿನಾಂಕಗಳಲ್ಲಿ ಆತಿಥ್ಯ ನೀಡಲು ಸಾಧ್ಯವಾಗುತ್ತಿಲ್ಲ:`,
      `${EMOJI.DATES} *ಬುಕಿಂಗ್ ದಿನಾಂಕಗಳು:* ${checkInDate} ರಿಂದ ${checkOutDate} (ರೆಫರೆನ್ಸ್: ${refCode})`,
      `• *ಕಾರಣ:* ${reason}`,
      ``,
      rangesTextKn
        ? `ಉಂಟಾದ ಅನಾನುಕೂಲತೆಗೆ ಕ್ಷಮೆಯಿರಲಿ. ನಾವು ನಿಮ್ಮನ್ನು ಈ ಕೆಳಗಿನ ಪರ್ಯಾಯ ದಿನಾಂಕಗಳಲ್ಲಿ ಸ್ವಾಗತಿಸಲು ಇಷ್ಟಪಡುತ್ತೇವೆ:\n${rangesTextKn}\n`
        : '',
      `ನಿಮ್ಮ ಆದ್ಯತೆಯ ದಿನಾಂಕವನ್ನು ತಿಳಿಸಲು ದಯವಿಟ್ಟು ಈ ಸಂದೇಶಕ್ಕೆ ಉತ್ತರಿಸಿ, ಅಥವಾ ನೀವು ಪೂರ್ಣ ಮರುಪಾವತಿಯನ್ನು ಬಯಸಿದರೆ ತಿಳಿಸಿ.`
    ].filter(Boolean).join('\n');
  }

  return [
    `${EMOJI.HEADING} *Marichin Homestay Reservation Notice* ${EMOJI.HEADING}`,
    `Warm greetings from Marichin Homestay, Kushalnagar, Coorg.`,
    ``,
    `Dear *${guestName}*,`,
    `We regret to inform you that we are unable to host your stay for the booked dates:`,
    `${EMOJI.DATES} *Current Dates:* ${checkInDate} to ${checkOutDate} (Booking Ref: ${refCode})`,
    `• *Reason:* ${reason}`,
    ``,
    rangesTextEn
      ? `We sincerely apologize for the inconvenience. We would love to welcome you on alternate dates:\n${rangesTextEn}\n`
      : '',
    `Please reply to this message with your preferred option, or let us know if you prefer a full refund.`
  ].filter(Boolean).join('\n');
};

/**
 * 3. Dates Changed Hook
 */
const buildDatesChangedText = (booking, siteSettings, language, baseUrl) => {
  const isKn = language === 'kn';
  const refCode = booking.bookingCode || booking.id || 'MH-REF';
  const passToken = booking.passToken || refCode;
  const guestName = booking.guestName || booking.primaryGuest?.name || 'Valued Guest';
  const checkInDate = formatDisplayDate(booking.checkIn);
  const checkOutDate = formatDisplayDate(booking.checkOut);
  const checkInTime = siteSettings?.checkInTime || '12:00 PM';
  const checkOutTime = siteSettings?.checkOutTime || '11:00 AM';
  const nights = getNightsCount(booking);
  const adults = booking.adults ?? booking.guestCount?.adults ?? 2;
  const children = booking.children ?? booking.guestCount?.children ?? 0;
  const stayName = getStayDisplayName(booking, isKn);
  const balance = Number(
    booking.balanceDue ?? Math.max(0, (booking.pricing?.total || 0) - (booking.advancePaid || 0))
  ).toLocaleString('en-IN');

  const origin = getOrigin(baseUrl);
  const passUrl = origin ? `${origin}/pass/${passToken}` : `/pass/${passToken}`;

  const hostAddress = (siteSettings?.address || 'Chikkabettageri Village, Gudde Hosur Post, Kushalnagar, Kodagu District, Karnataka 571234').trim();
  const stayGps = "12°25'32.1\"N 75°54'42.8\"E";
  const defaultMapUrl = 'https://www.google.com/maps/dir/?api=1&destination=12.425583,75.911889';
  const mapUrl = (siteSettings?.googleMapsShareUrl && siteSettings.googleMapsShareUrl.trim()) || defaultMapUrl;

  if (isKn) {
    const guestsText = `${adults} ವಯಸ್ಕರು${children > 0 ? `, ${children} ಮಕ್ಕಳು` : ''}`;
    const nightsText = `${nights} ${nights > 1 ? 'ರಾತ್ರಿಗಳು' : 'ರಾತ್ರಿ'}`;

    return [
      `${EMOJI.HEADING} *ಮರಿಚಿನ್ ಹೋಂಸ್ಟೇ - ದಿನಾಂಕ ನವೀಕರಣ* ${EMOJI.HEADING}`,
      `ಆತ್ಮೀಯ *${guestName}*,`,
      `ನಿಮ್ಮ ಬುಕಿಂಗ್ (${refCode}) ದಿನಾಂಕಗಳನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಬದಲಾಯಿಸಲಾಗಿದೆ:`,
      ``,
      `${EMOJI.DATES} *ಹೊಸ ಚೆಕ್-ಇನ್:* ${checkInDate} (${checkInTime} ನಂತರ)`,
      `${EMOJI.DATES} *ಹೊಸ ಚೆಕ್-ಔಟ್:* ${checkOutDate} (${checkOutTime} ಒಳಗೆ)`,
      `*ವಾಸ್ತವ್ಯ ಅವಧಿ:* ${nightsText}`,
      `${EMOJI.GUESTS} *ಅತಿಥಿಗಳು:* ${guestsText}`,
      `*ವಾಸ್ತವ್ಯ:* ${stayName}`,
      ``,
      `${EMOJI.PAYMENT} *ಚೆಕ್-ಇನ್ ಸಮಯದಲ್ಲಿ ಬಾಕಿ:* ₹${balance}`,
      ``,
      `*ನಿಮ್ಮ ಬುಕಿಂಗ್ ಪಾಸ್ (QR ಮತ್ತು ವಿವರಗಳು):*`,
      `${passUrl}`,
      ``,
      `${EMOJI.LOCATION} *ಹೋಂಸ್ಟೇ ಇರುವ ನಿಖರ ಸ್ಥಳ ಮತ್ತು ಲೈವ್ ಮಾರ್ಗ (GPS):*`,
      `• ಜಿಪಿಎಸ್ ಪಿನ್: ${stayGps}`,
      `• ವಿಳಾಸ: ${hostAddress}`,
      `• ಲೈವ್ ಗೂಗಲ್ ಮ್ಯಾಪ್ ದಾರಿ: ${mapUrl}`,
      `(ನಿಮ್ಮ ಮೊಬೈಲ್‌ನಲ್ಲಿ ನೇರ ದಾರಿ ಪಡೆಯಲು ಮೇಲಿನ ಲಿಂಕ್ ಟ್ಯಾಪ್ ಮಾಡಿ)`,
      ``,
      `ನಿಮ್ಮ ಆಗಮನಕ್ಕಾಗಿ ನಾವು ಎದುರುನೋಡುತ್ತಿದ್ದೇವೆ!`
    ].join('\n');
  }

  const guestsText = `${adults} Adults${children > 0 ? `, ${children} Children` : ''}`;
  const nightsText = `${nights} Night${nights > 1 ? 's' : ''}`;

  return [
    `${EMOJI.HEADING} *Marichin Homestay - Stay Dates Updated* ${EMOJI.HEADING}`,
    `Dear *${guestName}*,`,
    `Your booking reservation (${refCode}) dates have been successfully updated:`,
    ``,
    `${EMOJI.DATES} *New Check-In:* ${checkInDate} (${checkInTime} onwards)`,
    `${EMOJI.DATES} *New Check-Out:* ${checkOutDate} (by ${checkOutTime})`,
    `*Duration:* ${nightsText}`,
    `${EMOJI.GUESTS} *Guests:* ${guestsText}`,
    `*Stay:* ${stayName}`,
    ``,
    `${EMOJI.PAYMENT} *Balance Due at Check-In:* ₹${balance}`,
    ``,
    `*Your booking pass (QR and details):*`,
    `${passUrl}`,
    ``,
    `${EMOJI.LOCATION} *Official Stay Location & Live Driving Navigation:*`,
    `• Exact GPS Pin: ${stayGps}`,
    `• Address: ${hostAddress}`,
    `• Live Google Maps Directions: ${mapUrl}`,
    `(Tap the link above on your mobile phone for direct turn-by-turn navigation straight to our estate gate)`,
    ``,
    `We look forward to welcoming you to coffee country!`
  ].join('\n');
};

/**
 * 4. Cancelled and Refunded Hook
 */
const buildCancelledRefundedText = (booking, siteSettings, language, options = {}) => {
  const isKn = language === 'kn';
  const refCode = booking.bookingCode || booking.id || 'MH-REF';
  const guestName = booking.guestName || booking.primaryGuest?.name || 'Valued Guest';
  const reason = options.reason || booking.cancellationReason || '';

  const refundAmt = Number(
    options.refundAmount ??
      booking.refunds?.[booking.refunds.length - 1]?.amount ??
      booking.advancePaid ??
      0
  ).toLocaleString('en-IN');

  const timelineEn = siteSettings?.refundTimelineText || 'usually 5 to 7 working days';
  const timelineKn = isKn
    ? timelineEn.replace(/usually/i, 'ಸಾಮಾನ್ಯವಾಗಿ').replace(/working days/i, 'ಕೆಲಸದ ದಿನಗಳು')
    : timelineEn;

  if (isKn) {
    return [
      `${EMOJI.HEADING} *ಮರಿಚಿನ್ ಹೋಂಸ್ಟೇ - ಬುಕಿಂಗ್ ರದ್ದತಿ ಮತ್ತು ಮರುಪಾವತಿ* ${EMOJI.HEADING}`,
      `ಆತ್ಮೀಯ *${guestName}*,`,
      `ನಿಮ್ಮ ಬುಕಿಂಗ್ (${refCode}) ರದ್ದುಗೊಂಡಿದೆ.`,
      reason ? `• *ಕಾರಣ:* ${reason}` : '',
      `${EMOJI.PAYMENT} *ಮರುಪಾವತಿ ಮೊತ್ತ:* ₹${refundAmt}`,
      `• *ಮರುಪಾವತಿ ಸಮಯ:* ಮೊತ್ತವನ್ನು ನಿಮ್ಮ ಮೂಲ ಪಾವತಿ ಖಾತೆಗೆ ವರ್ಗಾಯಿಸಲಾಗುವುದು (${timelineKn}).`,
      ``,
      `ಮುಂದಿನ ದಿನಗಳಲ್ಲಿ ನಿಮ್ಮನ್ನು ಹೋಂಸ್ಟೇಗೆ ಸ್ವಾಗತಿಸಲು ನಾವು ಬಯಸುತ್ತೇವೆ.`
    ].filter(Boolean).join('\n');
  }

  return [
    `${EMOJI.HEADING} *Marichin Homestay - Cancellation & Refund Notice* ${EMOJI.HEADING}`,
    `Dear *${guestName}*,`,
    `Your reservation (${refCode}) has been cancelled.`,
    reason ? `• *Reason:* ${reason}` : '',
    `${EMOJI.PAYMENT} *Refund Amount:* ₹${refundAmt}`,
    `• *Timeline:* The refund will be credited to your original payment account (${timelineEn}).`,
    ``,
    `We regret any inconvenience and hope to have the opportunity to host you in the future.`
  ].filter(Boolean).join('\n');
};

/**
 * 5. Booking Enquiry Message (Guest to Host)
 */
const buildBookingEnquiryText = (booking, siteSettings, language) => {
  const isKn = language === 'kn';
  const refCode = booking?.bookingCode || booking?.id || '';
  if (isKn) {
    return refCode
      ? `ನಮಸ್ಕಾರ ಮರಿಚಿನ್ ಹೋಂಸ್ಟೇ, ನನ್ನ ಬುಕಿಂಗ್ (${refCode}) ಕುರಿತು ನನಗೆ ಒಂದು ವಿಚಾರಣೆ ಇದೆ.`
      : `ನಮಸ್ಕಾರ ಮರಿಚಿನ್ ಹೋಂಸ್ಟೇ, ನನ್ನ ವಾಸ್ತವ್ಯದ ಕುರಿತು ನನಗೆ ಒಂದು ವಿಚಾರಣೆ ಇದೆ.`;
  }
  return refCode
    ? `Hello Marichin Homestay, I have an inquiry regarding my booking (${refCode}).`
    : `Hello Marichin Homestay, I have an inquiry regarding my stay.`;
};

/**
 * Main function: builds WhatsApp message string
 */
export const buildWhatsAppMessage = (type = 'booking_confirmed', booking = {}, siteSettings = {}, options = {}) => {
  const language = options.language || 'en';
  const baseUrl = options.baseUrl;

  switch (type) {
    case 'booking_confirmed':
      return buildBookingConfirmedText(booking, siteSettings, language, baseUrl);
    case 'cannot_host':
      return buildCannotHostText(booking, siteSettings, language, options);
    case 'dates_changed':
      return buildDatesChangedText(booking, siteSettings, language, baseUrl);
    case 'cancelled_refunded':
      return buildCancelledRefundedText(booking, siteSettings, language, options);
    case 'booking_enquiry':
      return buildBookingEnquiryText(booking, siteSettings, language);
    default:
      return buildBookingConfirmedText(booking, siteSettings, language, baseUrl);
  }
};

/**
 * Generates the WhatsApp URL.
 * Encodes the text once with encodeURIComponent.
 */
export const buildWhatsAppShareUrl = (text, recipientPhone = null) => {
  const encoded = encodeURIComponent(text);
  if (recipientPhone && !isPlaceholderPhone(recipientPhone)) {
    const clean = cleanInternationalPhone(recipientPhone);
    return `https://wa.me/${clean}?text=${encoded}`;
  }
  return `https://wa.me/?text=${encoded}`;
};
