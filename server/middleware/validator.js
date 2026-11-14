import { body, validationResult } from 'express-validator';

// Middleware to check validation results
export const validate = (validations) => {
  return async (req, res, next) => {
    for (let validation of validations) {
      const result = await validation.run(req);
      if (result.errors.length) break;
    }

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
      data: errors.array()
    });
  };
};

export const loginRules = [
  body('email').isEmail().withMessage('Please provide a valid email address').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required').trim()
];

export const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required').escape(),
  body('email').isEmail().withMessage('Please provide a valid email address').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('phone').optional().trim().escape()
];

export const bookingRules = [
  body('guestName').trim().notEmpty().withMessage('Guest full name is required').escape(),
  body('email').isEmail().withMessage('A valid email address is required').normalizeEmail(),
  body('phone').trim().notEmpty().withMessage('Phone number is required').escape(),
  body('checkIn').notEmpty().withMessage('Check-in date is required'),
  body('checkOut').notEmpty().withMessage('Check-out date is required'),
  body('adults').optional().isInt({ min: 1 }).withMessage('At least 1 adult is required'),
  body('children').optional().isInt({ min: 0 }).withMessage('Children count must be 0 or more')
];

export const enquiryRules = [
  body('name').trim().notEmpty().withMessage('Name is required').escape(),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('phone').trim().notEmpty().withMessage('Phone number is required').escape(),
  body('message').trim().notEmpty().withMessage('Message is required').escape()
];

export const reviewRules = [
  body('guestName').trim().notEmpty().withMessage('Name is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5').toInt(),
  body('text').optional({ values: 'falsy' }).trim().notEmpty().withMessage('Review content is required'),
  body('review').optional({ values: 'falsy' }).trim().notEmpty().withMessage('Review content is required')
];

