import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, '../uploads');

// Ensure directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage engine configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanBasename = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${cleanBasename}-${uniqueSuffix}${ext}`);
  }
});

// File filter: accept only jpg, jpeg, png, webp
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extValid = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimeValid = allowedTypes.test(file.mimetype);

  if (extValid && mimeValid) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type! Only JPG, JPEG, PNG, and WEBP image files are allowed.'));
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB max
  },
  fileFilter
});

const HERO_VIDEO_LIMIT_BYTES = 50 * 1024 * 1024; // 50 MB max
const HERO_POSTER_LIMIT_BYTES = 5 * 1024 * 1024; // 5 MB max

const HERO_VIDEO_MIME_EXT = {
  'video/mp4': ['.mp4'],
  'video/webm': ['.webm']
};

const HERO_POSTER_MIME_EXT = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/jpg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp']
};

const heroBannerStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const isPoster =
      req.query?.kind === 'poster' ||
      req.body?.kind === 'poster' ||
      String(file.mimetype || '').startsWith('image/');
    const prefix = isPoster ? 'hero-poster' : 'hero-video';
    const randomToken = crypto.randomBytes(12).toString('hex');
    cb(null, `${prefix}-${Date.now()}-${randomToken}${ext}`);
  }
});

const heroBannerFileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname || '').toLowerCase();
  const mime = String(file.mimetype || '').toLowerCase();
  const requestedKind = req.query?.kind || req.body?.kind;

  if (requestedKind !== undefined && requestedKind !== 'video' && requestedKind !== 'poster') {
    return cb(new Error('Invalid upload kind. Expected video or poster.'));
  }

  if (requestedKind === 'video') {
    const allowedExts = HERO_VIDEO_MIME_EXT[mime];
    if (allowedExts && allowedExts.includes(ext)) {
      return cb(null, true);
    }
    return cb(new Error('Invalid video file type! Only MP4 and WebM videos are allowed.'));
  }

  if (requestedKind === 'poster') {
    const allowedExts = HERO_POSTER_MIME_EXT[mime];
    if (allowedExts && allowedExts.includes(ext)) {
      return cb(null, true);
    }
    return cb(new Error('Invalid poster image type! Only JPG, JPEG, PNG, and WEBP images are allowed.'));
  }

  const videoExts = HERO_VIDEO_MIME_EXT[mime];
  const posterExts = HERO_POSTER_MIME_EXT[mime];
  if ((videoExts && videoExts.includes(ext)) || (posterExts && posterExts.includes(ext))) {
    return cb(null, true);
  }
  return cb(new Error('Invalid file type! Allowed formats: MP4, WebM for video; JPG, PNG, WEBP for poster image.'));
};

const heroBannerMulter = multer({
  storage: heroBannerStorage,
  limits: {
    fileSize: HERO_VIDEO_LIMIT_BYTES,
    files: 1
  },
  fileFilter: heroBannerFileFilter
});

const removeTempFileQuietly = (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (unlinkErr) {
    console.warn('Could not clean up rejected hero upload file:', unlinkErr.message);
  }
};

export const handleHeroBannerUpload = (req, res, next) => {
  heroBannerMulter.single('file')(req, res, (err) => {
    if (err) {
      const requestedKind = req.query?.kind || req.body?.kind;
      if (err.code === 'LIMIT_FILE_SIZE') {
        const msg =
          requestedKind === 'poster'
            ? 'Poster image cannot exceed 5 MB.'
            : 'Banner video file cannot exceed 50 MB.';
        return res.status(400).json({ success: false, message: msg, data: null });
      }
      return res.status(400).json({
        success: false,
        message: err.message || 'Hero banner media upload failed.',
        data: null
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please select a file to upload.',
        data: null
      });
    }

    const ext = path.extname(req.file.originalname || '').toLowerCase();
    const mime = String(req.file.mimetype || '').toLowerCase();
    const kind =
      req.body?.kind ||
      req.query?.kind ||
      (mime.startsWith('image/') ? 'poster' : 'video');

    if (kind === 'video') {
      const allowedExts = HERO_VIDEO_MIME_EXT[mime];
      if (!allowedExts || !allowedExts.includes(ext)) {
        removeTempFileQuietly(req.file.path);
        return res.status(400).json({
          success: false,
          message: 'Invalid video file type! Only MP4 and WebM videos are allowed.',
          data: null
        });
      }
      if (req.file.size > HERO_VIDEO_LIMIT_BYTES) {
        removeTempFileQuietly(req.file.path);
        return res.status(400).json({
          success: false,
          message: 'Banner video file cannot exceed 50 MB.',
          data: null
        });
      }
      req.heroMediaKind = 'video';
      return next();
    }

    if (kind === 'poster') {
      const allowedExts = HERO_POSTER_MIME_EXT[mime];
      if (!allowedExts || !allowedExts.includes(ext)) {
        removeTempFileQuietly(req.file.path);
        return res.status(400).json({
          success: false,
          message: 'Invalid poster image type! Only JPG, JPEG, PNG, and WEBP images are allowed.',
          data: null
        });
      }
      if (req.file.size > HERO_POSTER_LIMIT_BYTES) {
        removeTempFileQuietly(req.file.path);
        return res.status(400).json({
          success: false,
          message: 'Poster image cannot exceed 5 MB.',
          data: null
        });
      }
      req.heroMediaKind = 'poster';
      return next();
    }

    removeTempFileQuietly(req.file.path);
    return res.status(400).json({
      success: false,
      message: 'Invalid upload kind. Expected video or poster.',
      data: null
    });
  });
};

