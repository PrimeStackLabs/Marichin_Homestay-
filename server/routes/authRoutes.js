import express from 'express';
import { login, register, getMe, logout, changePassword } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { validate, loginRules, registerRules } from '../middleware/validator.js';

const router = express.Router();

const authRateLimiter = (req, res, next) => {
  if (process.env.NODE_ENV === 'test') return next();
  return authLimiter(req, res, next);
};

router.post('/login', authRateLimiter, validate(loginRules), login);
router.post('/register', authRateLimiter, validate(registerRules), register);
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);
router.post('/logout', logout);

export default router;

