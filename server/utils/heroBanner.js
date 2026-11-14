import fs from 'fs';
import path from 'path';

export const DEFAULT_HERO_VIDEO_URL = '/images/resortvdo.mp4';
export const DEFAULT_HERO_POSTER_FALLBACK = '/images/realimage/homeimage.jpeg';
export const HERO_OVERLAY_OPTIONS = ['light', 'medium', 'strong'];

export const DEFAULT_HERO_BANNER = {
  heroVideoUrl: DEFAULT_HERO_VIDEO_URL,
  heroPosterUrl: '',
  heroBadge: {
    en: 'MARICHIN HOMESTAY • KUSHALNAGAR, COORG',
    kn: 'ಮರಿಚಿನ್ ಹೋಂಸ್ಟೇ • ಕುಶಾಲನಗರ, ಕೊಡಗು'
  },
  heroTitle: {
    en: 'Experience Serene Coorg at Marichin Homestay',
    kn: 'ಮರಿಚಿನ್ ಹೋಂಸ್ಟೇನಲ್ಲಿ ಕೊಡಗಿನ ಪ್ರಶಾಂತತೆಯನ್ನು ಅನುಭವಿಸಿ'
  },
  heroSubtitle: {
    en: 'Nestled within a peaceful green coffee estate in Chikkabettageri Village, Kushalnagar. Enjoy authentic home-cooked meals, guided estate walks, and cozy evening campfires.',
    kn: 'ಕುಶಾಲನಗರದ ಚಿಕ್ಕಬೆಟ್ಟಗೇರಿಯ ಹಚ್ಚಹಸಿರಿನ ಕಾಫಿ ತೋಟಗಳ ನಡುವೆ ನೆಲೆಸಿರುವ ಸುಂದರ ತಾಣ. ರುಚಿಕರ ಮನೆ ಊಟ, ತೋಟದ ನಡಿಗೆ ಮತ್ತು ಬೆಚ್ಚನೆಯ ಸಂಜೆಯ ಕ್ಯಾಂಪ್‌ಫೈರ್ ಆನಂದಿಸಿ.'
  },
  heroPrimaryLabel: {
    en: 'Explore Rooms',
    kn: 'ಕೊಠಡಿಗಳನ್ನು ವೀಕ್ಷಿಸಿ'
  },
  heroSecondaryLabel: {
    en: 'Reserve Your Stay',
    kn: 'ನಿಮ್ಮ ವಾಸ್ತವ್ಯ ಕಾಯ್ದಿರಿಸಿ'
  },
  heroOverlay: 'medium'
};

const LOCAL_UPLOAD_VIDEO_RE = /^\/uploads\/[a-zA-Z0-9._-]+\.(mp4|webm)$/i;
const LOCAL_UPLOAD_IMAGE_RE = /^\/uploads\/[a-zA-Z0-9._-]+\.(jpg|jpeg|png|webp)$/i;
const LOCAL_STATIC_IMAGE_RE = /^\/images\/[a-zA-Z0-9/._-]+\.(jpg|jpeg|png|webp)$/i;

export const validateHeroVideoUrl = (raw) => {
  if (raw === null || raw === undefined) {
    return { valid: true, value: DEFAULT_HERO_VIDEO_URL };
  }
  if (typeof raw !== 'string') {
    return { valid: false, message: 'heroVideoUrl must be a string' };
  }
  const trimmed = raw.trim();
  if (!trimmed || trimmed === DEFAULT_HERO_VIDEO_URL) {
    return { valid: true, value: DEFAULT_HERO_VIDEO_URL };
  }
  if (trimmed.includes('..')) {
    return { valid: false, message: 'Invalid video path' };
  }
  if (LOCAL_UPLOAD_VIDEO_RE.test(trimmed)) {
    return { valid: true, value: trimmed };
  }
  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    return {
      valid: false,
      message: 'Banner video URL must be a valid https:// link ending in .mp4 or .webm'
    };
  }
  if (parsed.protocol !== 'https:') {
    return {
      valid: false,
      message: 'External banner video link must use https:// (other schemes are not allowed)'
    };
  }
  if (!/\.(mp4|webm)$/i.test(parsed.pathname)) {
    return {
      valid: false,
      message: 'External banner video URL must end in .mp4 or .webm'
    };
  }
  return { valid: true, value: parsed.toString() };
};

export const validateHeroPosterUrl = (raw) => {
  if (raw === null || raw === undefined || raw === '') {
    return { valid: true, value: '' };
  }
  if (typeof raw !== 'string') {
    return { valid: false, message: 'heroPosterUrl must be a string' };
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    return { valid: true, value: '' };
  }
  if (trimmed.includes('..')) {
    return { valid: false, message: 'Invalid poster path' };
  }
  if (LOCAL_UPLOAD_IMAGE_RE.test(trimmed) || LOCAL_STATIC_IMAGE_RE.test(trimmed)) {
    return { valid: true, value: trimmed };
  }
  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { valid: false, message: 'Poster image URL must be an uploaded image or valid https:// URL' };
  }
  if (parsed.protocol !== 'https:') {
    return { valid: false, message: 'External poster image URL must use https://' };
  }
  return { valid: true, value: parsed.toString() };
};

export const validateBilingualHeroField = (raw, fieldName, fallbackObj) => {
  if (raw === undefined) {
    return { valid: true, provided: false };
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { valid: false, message: `${fieldName} must be an object with en and kn strings` };
  }
  if (raw.en !== undefined && typeof raw.en !== 'string') {
    return { valid: false, message: `${fieldName}.en must be a string` };
  }
  if (raw.kn !== undefined && typeof raw.kn !== 'string') {
    return { valid: false, message: `${fieldName}.kn must be a string` };
  }
  return {
    valid: true,
    provided: true,
    value: {
      en: raw.en !== undefined ? raw.en.trim() : (fallbackObj?.en || ''),
      kn: raw.kn !== undefined ? raw.kn.trim() : (fallbackObj?.kn || '')
    }
  };
};

export const validateHeroOverlay = (raw) => {
  if (raw === undefined) {
    return { valid: true, provided: false };
  }
  if (typeof raw !== 'string' || !HERO_OVERLAY_OPTIONS.includes(raw)) {
    return { valid: false, message: 'heroOverlay must be one of: light, medium, strong' };
  }
  return { valid: true, provided: true, value: raw };
};

const pickBilingualWithFallback = (rawField, defField) => {
  const enVal = typeof rawField?.en === 'string' && rawField.en.trim() ? rawField.en : defField.en;
  const knVal = typeof rawField?.kn === 'string' && rawField.kn.trim() ? rawField.kn : defField.kn;
  return { en: enVal, kn: knVal };
};

export const normalizeHeroBannerSettings = (raw = {}) => {
  const videoRes = validateHeroVideoUrl(raw?.heroVideoUrl);
  const posterRes = validateHeroPosterUrl(raw?.heroPosterUrl);
  const overlay = HERO_OVERLAY_OPTIONS.includes(raw?.heroOverlay)
    ? raw.heroOverlay
    : DEFAULT_HERO_BANNER.heroOverlay;

  return {
    heroVideoUrl: videoRes.valid ? videoRes.value : DEFAULT_HERO_VIDEO_URL,
    heroPosterUrl: posterRes.valid ? posterRes.value : '',
    heroBadge: pickBilingualWithFallback(raw?.heroBadge, DEFAULT_HERO_BANNER.heroBadge),
    heroTitle: pickBilingualWithFallback(raw?.heroTitle, DEFAULT_HERO_BANNER.heroTitle),
    heroSubtitle: pickBilingualWithFallback(raw?.heroSubtitle, DEFAULT_HERO_BANNER.heroSubtitle),
    heroPrimaryLabel: pickBilingualWithFallback(raw?.heroPrimaryLabel, DEFAULT_HERO_BANNER.heroPrimaryLabel),
    heroSecondaryLabel: pickBilingualWithFallback(raw?.heroSecondaryLabel, DEFAULT_HERO_BANNER.heroSecondaryLabel),
    heroOverlay: overlay
  };
};

export const deleteUploadedFileIfSafe = (fileUrl, uploadsDir) => {
  try {
    if (!fileUrl || typeof fileUrl !== 'string') return false;
    const trimmed = fileUrl.trim();
    if (!trimmed.startsWith('/uploads/')) {
      // Never touch default static files under /images/... or external URLs
      return false;
    }
    const safeName = path.basename(trimmed.replace(/^\/uploads\//, ''));
    if (!safeName || safeName === '.' || safeName === '..') return false;

    const resolvedUploadsRoot = path.resolve(uploadsDir);
    const candidatePath = path.resolve(resolvedUploadsRoot, safeName);
    if (!candidatePath.startsWith(`${resolvedUploadsRoot}${path.sep}`)) {
      return false;
    }

    if (fs.existsSync(candidatePath)) {
      fs.unlinkSync(candidatePath);
      return true;
    }
    return false;
  } catch (err) {
    console.warn('Could not delete obsolete uploaded banner media:', err.message);
    return false;
  }
};

