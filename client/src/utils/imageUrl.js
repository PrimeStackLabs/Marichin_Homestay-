/**
 * Extracts backend origin when VITE_API_BASE_URL points to a remote server (e.g. Render).
 */
export const getBackendBaseUrl = () => {
  const apiBase = (import.meta.env.VITE_API_BASE_URL || '').trim();
  if (apiBase.startsWith('http://') || apiBase.startsWith('https://')) {
    return apiBase.replace(/\/api\/?$/, '');
  }
  // Production fallback if VITE_API_BASE_URL is not set at build time
  if (typeof window !== 'undefined' && window.location.hostname.includes('marichinhomestay.in')) {
    return 'https://marichin-homestay-api-g4jk.onrender.com';
  }
  return '';
};

/**
 * Resolves media URLs (video, audio, uploaded files).
 * If the path is relative (e.g. /uploads/video.mp4) or a bare filename,
 * it prepends the backend base origin.
 */
export const resolveMediaUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();

  // If already full URL or inline data URI
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
    return trimmed;
  }

  const backend = getBackendBaseUrl();

  // If starts with /uploads/
  if (trimmed.startsWith('/uploads/')) {
    return backend ? `${backend}${trimmed}` : trimmed;
  }

  // If starts with uploads/ (missing leading slash)
  if (trimmed.startsWith('uploads/')) {
    return backend ? `${backend}/${trimmed}` : `/${trimmed}`;
  }

  // Local frontend assets stay on current host
  if (trimmed.startsWith('/images/') || trimmed.startsWith('/assets/')) {
    return trimmed;
  }

  // Bare uploaded filename (e.g. realx-1794847955316-198434.png, homecta-..., hero-...)
  if (/^[a-zA-Z0-9._-]+\.(jpe?g|png|webp|mp4|webm)$/i.test(trimmed)) {
    return backend ? `${backend}/uploads/${trimmed}` : `/uploads/${trimmed}`;
  }

  return trimmed;
};

/**
 * Helper to normalize image URLs, especially Google Drive share links and uploaded server images.
 * Google Drive viewer links (drive.google.com/file/d/.../view) cannot be rendered
 * inside an <img> tag directly. This function transforms them into direct raw image stream URLs:
 * https://lh3.googleusercontent.com/d/{FILE_ID}
 */
export const normalizeImageUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = resolveMediaUrl(url);

  // Handle Google Drive links
  if (trimmed.includes('drive.google.com') || trimmed.includes('docs.google.com')) {
    // 1. Match /file/d/{id}
    const fileDMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileDMatch && fileDMatch[1]) {
      return `https://lh3.googleusercontent.com/d/${fileDMatch[1]}`;
    }

    // 2. Match id={id}
    const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idParamMatch && idParamMatch[1]) {
      return `https://lh3.googleusercontent.com/d/${idParamMatch[1]}`;
    }

    // 3. Match /d/{id}
    const dMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (dMatch && dMatch[1]) {
      return `https://lh3.googleusercontent.com/d/${dMatch[1]}`;
    }
  }

  return trimmed;
};

export const isGoogleDriveUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  return url.includes('drive.google.com') || url.includes('docs.google.com') || url.includes('googleusercontent.com');
};

export const DEFAULT_ROOM_FALLBACK = '/images/realimage/real3.jpeg';
export const DEFAULT_SUITE_FALLBACK = '/images/realimage/real4.jpeg';
