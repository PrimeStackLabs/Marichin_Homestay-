import express from 'express';
import {
  getRazorpayConfig,
  createRazorpayOrderHandler,
  verifyRazorpayPaymentHandler,
  razorpayWebhookHandler,
  getBookingStatusHandler
} from '../controllers/paymentController.js';
import { paymentLimiter, webhookLimiter, availabilityLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Public Razorpay Client Config (Key ID only)
router.get('/razorpay/config', getRazorpayConfig);

// Order creation & payment verification (Rate limited)
router.post('/razorpay/create-order', paymentLimiter, createRazorpayOrderHandler);
router.post('/razorpay/verify', paymentLimiter, verifyRazorpayPaymentHandler);

// Webhook listener (Raw signature verification + higher rate limit)
router.post('/razorpay/webhook', webhookLimiter, razorpayWebhookHandler);

// Guest Booking Status lookup
router.get('/booking/status', availabilityLimiter, getBookingStatusHandler);

export default router;

