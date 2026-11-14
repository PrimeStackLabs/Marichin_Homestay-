import './config/env.js';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';

import { connectDB } from './config/db.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/authRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import { expireStaleHolds } from './utils/inventoryEngine.js';

// Resolve environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Validate JWT Secret strength and absence of predictable words
const jwtSecret = process.env.JWT_SECRET || '';
const forbiddenWords = ['secret', 'marichin', 'coorg'];
const matchedForbiddenWord = forbiddenWords.find(word => jwtSecret.toLowerCase().includes(word));

if (!jwtSecret || jwtSecret.length < 32 || matchedForbiddenWord) {
  const reason = !jwtSecret
    ? 'missing'
    : jwtSecret.length < 32
    ? 'shorter than 32 characters'
    : `contains forbidden word "${matchedForbiddenWord}"`;
  console.error(`❌ FATAL CONFIG ERROR: JWT_SECRET is invalid (${reason}). Server refusing to start.`);
  console.error('Security Requirement: JWT_SECRET must be at least 32 characters and must not contain "secret", "marichin", or "coorg".');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// Enable trust proxy for use behind a reverse proxy (e.g. Nginx, Cloudflare, Heroku, AWS ALB)
app.set('trust proxy', 1);

// Connect to MongoDB
connectDB();

// Security Middlewares with Content Security Policy allowing Razorpay Checkout domains
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allows frontend to load /uploads images
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://checkout.razorpay.com'
        ],
        frameSrc: [
          "'self'",
          'https://api.razorpay.com',
          'https://checkout.razorpay.com',
          'https://www.google.com'
        ],
        connectSrc: [
          "'self'",
          'https://api.razorpay.com',
          'https://lumberjack.razorpay.com'
        ],
        imgSrc: ["'self'", 'data:', 'https:'],
        mediaSrc: ["'self'", 'https:'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com']
      }
    }
  })
);

// Compression & Logging (skip compression for /uploads so video byte-range requests work cleanly)
app.use(
  compression({
    filter: (req, res) => {
      if (req.originalUrl?.startsWith('/uploads') || req.path?.startsWith('/uploads')) {
        return false;
      }
      return compression.filter(req, res);
    }
  })
);
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// CORS configuration (reads CLIENT_URL and supports comma-separated list + dev fallbacks)
const rawClientUrls = CLIENT_URL.split(',').map((u) => u.trim().replace(/\/+$/, '')).filter(Boolean);
const expandedOrigins = [];
for (const orig of rawClientUrls) {
  expandedOrigins.push(orig);
  try {
    const urlObj = new URL(orig);
    if (urlObj.hostname.startsWith('www.')) {
      expandedOrigins.push(`${urlObj.protocol}//${urlObj.hostname.slice(4)}${urlObj.port ? ':' + urlObj.port : ''}`);
    } else if (!urlObj.hostname.includes('localhost') && !urlObj.hostname.includes('127.0.0.1') && urlObj.hostname.split('.').length >= 2) {
      expandedOrigins.push(`${urlObj.protocol}//www.${urlObj.hostname}${urlObj.port ? ':' + urlObj.port : ''}`);
    }
  } catch {}
}

const allowedOrigins = Array.from(
  new Set([
    ...expandedOrigins,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5000',
    'http://127.0.0.1:5000',
    'http://localhost:5173',
    'http://127.0.0.1:5173'
  ])
);

app.use(
  cors({
    origin: function (origin, callback) {
      const normalizedOrigin = origin ? origin.replace(/\/+$/, '') : null;
      if (!normalizedOrigin || allowedOrigins.includes(normalizedOrigin)) {
        callback(null, true);
      } else {
        const corsError = new Error(`Origin ${origin} not allowed by CORS`);
        corsError.status = 403;
        callback(corsError);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
);

// Body parsers with request size limits (stores rawBody for webhook HMAC verification)
app.use(
  express.json({
    limit: '2mb',
    verify: (req, res, buf) => {
      req.rawBody = buf;
    }
  })
);
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());

// Static folder for uploaded files (explicit byte-range support for streamed banner videos)
app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'), {
    acceptRanges: true,
    setHeaders: (res) => {
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    }
  })
);

// Disable HTTP caching for dynamic API responses so Admin edits reflect immediately
app.use('/api', (req, res, next) => {
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
    'Surrogate-Control': 'no-store'
  });
  next();
});

// General API Rate Limiter (bypassed in test environment)
if (process.env.NODE_ENV !== 'test') {
  app.use('/api', apiLimiter);
}

// API Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Marichin Homestay API Server is running smoothly',
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api', publicRoutes);

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

// Start Server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Marichin Homestay API Server listening on port ${PORT}`);
    console.log(`📡 Client URL: ${CLIENT_URL}`);

    // Sweep expired payment holds immediately on startup and every 60 seconds thereafter
    expireStaleHolds().catch(() => {});
    setInterval(async () => {
      try {
        const released = await expireStaleHolds();
        if (released > 0) {
          console.log(`⏰ [Background Hold Sweeper] Released ${released} expired booking hold(s).`);
        }
      } catch (err) {
        console.warn('⚠️ [Background Hold Sweeper] Error running hold sweep:', err.message);
      }
    }, 60 * 1000);
  });
}

export default app;

