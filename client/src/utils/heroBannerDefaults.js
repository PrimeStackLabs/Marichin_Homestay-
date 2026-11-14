export const DEFAULT_HERO_VIDEO_URL = '/images/resortvdo.mp4';
export const DEFAULT_HERO_ROTATION_VIDEOS = ['/images/resortvdo.mp4', '/images/home2.mp4'];
export const DEFAULT_HERO_POSTER_FALLBACK = '/images/realimage/homeimage.jpeg';
export const HERO_OVERLAY_OPTIONS = ['light', 'medium', 'strong'];

export const MAX_HERO_VIDEO_BYTES = 50 * 1024 * 1024; // 50 MB
export const MAX_HERO_POSTER_BYTES = 5 * 1024 * 1024; // 5 MB

export const HERO_TITLE_RECOMMENDED_LENGTH = 60;
export const HERO_SUBTITLE_RECOMMENDED_LENGTH = 160;
export const HERO_BADGE_RECOMMENDED_LENGTH = 50;

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

export const isDefaultHeroVideo = (url) => {
  const trimmed = String(url || '').trim();
  return !trimmed || trimmed === DEFAULT_HERO_VIDEO_URL;
};

export const validateHeroVideoUrlInput = (raw) => {
  const trimmed = String(raw || '').trim();
  if (!trimmed || trimmed === DEFAULT_HERO_VIDEO_URL) {
    return { valid: true, value: DEFAULT_HERO_VIDEO_URL };
  }
  if (trimmed.includes('..')) {
    return { valid: false, message: 'Invalid banner video path.' };
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
      message: 'Please enter a valid direct https:// video URL ending in .mp4 or .webm.'
    };
  }
  if (parsed.protocol !== 'https:') {
    return {
      valid: false,
      message: 'External video link must begin with https:// (http, javascript, or data URLs are not allowed).'
    };
  }
  if (!/\.(mp4|webm)$/i.test(parsed.pathname)) {
    return {
      valid: false,
      message: 'Direct video URL must end with .mp4 or .webm.'
    };
  }
  return { valid: true, value: parsed.toString() };
};

export const validateHeroVideoFile = (file) => {
  if (!file) {
    return { valid: false, message: 'No video file selected.' };
  }
  const name = String(file.name || '').toLowerCase();
  const type = String(file.type || '').toLowerCase();
  const validExt = name.endsWith('.mp4') || name.endsWith('.webm');
  const validMime = type === 'video/mp4' || type === 'video/webm';

  if (!validExt || (type && !validMime)) {
    return {
      valid: false,
      message: 'Invalid video file type. Only MP4 (.mp4) and WebM (.webm) videos are allowed.'
    };
  }
  if (file.size > MAX_HERO_VIDEO_BYTES) {
    return {
      valid: false,
      message: `Video file is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is 50 MB.`
    };
  }
  return { valid: true };
};

export const validateHeroPosterFile = (file) => {
  if (!file) {
    return { valid: false, message: 'No poster image selected.' };
  }
  const name = String(file.name || '').toLowerCase();
  const type = String(file.type || '').toLowerCase();
  const validExt = /\.(jpg|jpeg|png|webp)$/i.test(name);
  const validMime = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(type);

  if (!validExt || (type && !validMime)) {
    return {
      valid: false,
      message: 'Invalid poster image type. Only JPG, JPEG, PNG, and WEBP images are allowed.'
    };
  }
  if (file.size > MAX_HERO_POSTER_BYTES) {
    return {
      valid: false,
      message: `Poster image is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is 5 MB.`
    };
  }
  return { valid: true };
};

export const validateHeroPosterUrlInput = (raw) => {
  const trimmed = String(raw || '').trim();
  if (!trimmed) return { valid: true, value: '' };
  if (trimmed.includes('..')) return { valid: false, message: 'Invalid poster image path.' };
  if (LOCAL_UPLOAD_IMAGE_RE.test(trimmed) || LOCAL_STATIC_IMAGE_RE.test(trimmed)) {
    return { valid: true, value: trimmed };
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:') {
      return { valid: false, message: 'External poster URL must use https://.' };
    }
    return { valid: true, value: parsed.toString() };
  } catch {
    return { valid: false, message: 'Poster URL must be an uploaded image or valid https:// link.' };
  }
};

export const resolveLocalizedHeroField = (fieldObj, isKn, fallbackObj) => {
  if (!fieldObj || typeof fieldObj !== 'object') {
    return isKn ? fallbackObj.kn : fallbackObj.en;
  }
  const enVal = typeof fieldObj.en === 'string' && fieldObj.en.trim() ? fieldObj.en : fallbackObj.en;
  const knVal = typeof fieldObj.kn === 'string' && fieldObj.kn.trim() ? fieldObj.kn : fallbackObj.kn;
  return isKn ? knVal : enVal;
};

export const normalizeHeroBannerSettingsClient = (raw = {}) => {
  const videoRes = validateHeroVideoUrlInput(raw?.heroVideoUrl);
  const posterRes = validateHeroPosterUrlInput(raw?.heroPosterUrl);
  const overlay = HERO_OVERLAY_OPTIONS.includes(raw?.heroOverlay)
    ? raw.heroOverlay
    : DEFAULT_HERO_BANNER.heroOverlay;

  const mergeBilingual = (incoming, fallback) => ({
    en: typeof incoming?.en === 'string' && incoming.en.trim() ? incoming.en : fallback.en,
    kn: typeof incoming?.kn === 'string' && incoming.kn.trim() ? incoming.kn : fallback.kn
  });

  return {
    heroVideoUrl: videoRes.valid ? videoRes.value : DEFAULT_HERO_VIDEO_URL,
    heroPosterUrl: posterRes.valid ? posterRes.value : '',
    heroBadge: mergeBilingual(raw?.heroBadge, DEFAULT_HERO_BANNER.heroBadge),
    heroTitle: mergeBilingual(raw?.heroTitle, DEFAULT_HERO_BANNER.heroTitle),
    heroSubtitle: mergeBilingual(raw?.heroSubtitle, DEFAULT_HERO_BANNER.heroSubtitle),
    heroPrimaryLabel: mergeBilingual(raw?.heroPrimaryLabel, DEFAULT_HERO_BANNER.heroPrimaryLabel),
    heroSecondaryLabel: mergeBilingual(raw?.heroSecondaryLabel, DEFAULT_HERO_BANNER.heroSecondaryLabel),
    heroOverlay: overlay
  };
};

export const resolveHeroPosterUrl = (settings) => {
  const customPoster = String(settings?.heroPosterUrl || '').trim();
  if (customPoster) return customPoster;
  const heroImage = String(settings?.heroImage || '').trim();
  if (heroImage) return heroImage;
  return DEFAULT_HERO_POSTER_FALLBACK;
};

export const resolveHeroOverlayClasses = (overlay = 'medium') => {
  switch (overlay) {
    case 'light':
      return {
        gradient: 'from-[#0F2A20]/90 via-black/25 to-black/35',
        radial: 'from-black/30 via-black/10 to-transparent'
      };
    case 'strong':
      return {
        gradient: 'from-[#0F2A20] via-black/65 to-black/80',
        radial: 'from-black/75 via-black/35 to-black/15'
      };
    case 'medium':
    default:
      return {
        gradient: 'from-[#0F2A20] via-black/45 to-black/60',
        radial: 'from-black/55 via-black/20 to-transparent'
      };
  }
};

