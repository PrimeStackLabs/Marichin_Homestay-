import rateLimit from 'express-rate-limit';

const isProduction = process.env.NODE_ENV === 'production';

const isLoopbackIp = (ip = '') => {
  const clean = String(ip).trim();
  return (
    clean === '127.0.0.1' ||
    clean === '::1' ||
    clean === '::ffff:127.0.0.1' ||
    clean === 'localhost'
  );
};

// General API rate limiter: higher ceiling in dev for multi-tab / Vite HMR workflows;
// production enforces 3000 req / 15 min per IP (bypassed for tests and admin requests)
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 3000 : 8000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    if (process.env.NODE_ENV === 'test') return true;
    const url = req?.originalUrl || req?.url || '';
    if (url.startsWith('/api/admin') || url.startsWith('/admin')) return true;
    if (!isProduction && req.method === 'GET' && isLoopbackIp(req.ip || req.socket?.remoteAddress)) {
      return true;
    }
    return false;
  },
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
    data: null
  }
});

// Stricter rate limiter for authentication endpoints: 15 attempts per 15 minutes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: {
    success: false,
    message: 'Too many login attempts from this IP, please try again after 15 minutes',
    data: null
  }
});

// Stricter rate limiter for booking creation: 20 bookings per hour
export const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: {
    success: false,
    message: 'Too many booking attempts from this IP, please try again later',
    data: null
  }
});

// Contact / Enquiry limiter: 10 per hour
export const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: {
    success: false,
    message: 'Too many enquiry submissions from this IP, please try again later',
    data: null
  }
});

// Availability and Quote limiter: 120 requests per minute
export const availabilityLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: {
    success: false,
    message: 'Too many availability requests, please try again shortly',
    data: null
  }
});

// Stricter rate limiter for online payment operations: 30 requests per 15 minutes
export const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: {
    success: false,
    message: 'Too many payment requests from this IP, please try again after a few minutes',
    data: null
  }
});

// Razorpay Webhook limiter: 200 requests per minute
export const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: {
    success: false,
    message: 'Webhook rate limit exceeded',
    data: null
  }
});

// Hero banner media upload limiter: 25 uploads per 15 minutes per IP
export const heroBannerUploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: {
    success: false,
    message: 'Too many hero banner uploads, please wait a few minutes before uploading again',
    data: null
  }
});



