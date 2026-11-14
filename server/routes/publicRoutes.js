import express from 'express';
import {
  getRooms,
  getRoomBySlug,
  getAvailability,
  getAvailabilityCalendar,
  getCheckoutOptionsApi,
  getBookingQuote,
  createBooking,
  confirmGuestPayment,
  lookupBooking,
  validatePromo,
  getPackages,
  getExperiences,
  getMenu,
  getDiningContent,
  getGallery,
  getReviews,
  createReview,
  createEnquiry,
  subscribeNewsletter,
  getSettings,
  getInclusions,
  getBookingPass,
  getPublicPolicies,
  getPublicSafety
} from '../controllers/publicController.js';
import { bookingLimiter, contactLimiter, availabilityLimiter } from '../middleware/rateLimiter.js';
import {
  validate,
  bookingRules,
  enquiryRules,
  reviewRules
} from '../middleware/validator.js';

const router = express.Router();

// Rooms & Availability
router.get('/rooms', getRooms);
router.get('/rooms/:slug', getRoomBySlug);
router.get('/availability/calendar', availabilityLimiter, getAvailabilityCalendar);
router.get('/availability/checkout-options', availabilityLimiter, getCheckoutOptionsApi);
router.get('/availability', availabilityLimiter, getAvailability);

// Bookings & Quotes
router.post('/bookings/quote', availabilityLimiter, getBookingQuote);
router.post('/bookings', bookingLimiter, validate(bookingRules), createBooking);
router.put('/bookings/:identifier/confirm-payment', confirmGuestPayment);
router.get('/bookings/lookup', lookupBooking);
router.get('/bookings/status', availabilityLimiter, lookupBooking);
router.get('/pass/:token', availabilityLimiter, getBookingPass);

// Promos
router.post('/promos/validate', validatePromo);

// Packages & Experiences
router.get('/packages', getPackages);
router.get('/experiences', getExperiences);
router.get('/inclusions', getInclusions);

// Dining Menu & Content
router.get('/dining/content', getDiningContent);
router.get('/menu', getMenu);

// Gallery & Reviews
router.get('/gallery', getGallery);
router.get('/reviews', getReviews);
router.post('/reviews', validate(reviewRules), createReview);

// Enquiries & Newsletter
router.post('/enquiries', contactLimiter, validate(enquiryRules), createEnquiry);
router.post('/newsletter', subscribeNewsletter);

// Settings & Policies
router.get('/settings', getSettings);
router.get('/policies', getPublicPolicies);
router.get('/safety', getPublicSafety);

export default router;

