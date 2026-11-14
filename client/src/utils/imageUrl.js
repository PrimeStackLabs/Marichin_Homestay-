/**
 * Extracts backend origin when VITE_API_BASE_URL points to a remote server (e.g. Render).
 */
export const getBackendBaseUrl = () => {
  const apiBase = (import.meta.env.VITE_API_BASE_URL || '').trim();
  if (apiBase.startsWith('http://') || apiBase.startsWith('https://')) {
    return apiBase.replace(/\/api\/?$/, '');
  }
  return '';
};

/**
 * Resolves media URLs (video, audio, uploaded files).
 * If the path is relative (e.g. /uploads/video.mp4) and API is remote (e.g. Render),
 * it prepends the backend base origin.
 */
export const resolveMediaUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();

  if (trimmed.startsWith('/uploads/')) {
    const backend = getBackendBaseUrl();
    if (backend) {
      return `${backend}${trimmed}`;
    }
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

