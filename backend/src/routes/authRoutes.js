import { Router } from 'express';
import { body } from 'express-validator';
import { asyncHandler } from '../utils/errors.js';
import { requireAuth } from '../middleware/auth.js';
import { createRateLimiter } from '../middleware/rateLimit.js';
import { login, logout, me, profile, register } from '../controllers/authController.js';

const router = Router();
const authLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 20 });

const registerValidation = [
  body('full_name', 'Full name is required').notEmpty(),
  body('email', 'A valid email is required').isEmail(),
  body('password', 'Password must be at least 8 characters').isLength({ min: 8 }),
];

const loginValidation = [
  body('email', 'A valid email is required').isEmail(),
  body('password', 'Password is required').notEmpty(),
];

router.post('/register', authLimiter, registerValidation, asyncHandler(register));
router.post('/login', authLimiter, loginValidation, asyncHandler(login));
router.get('/me', requireAuth, asyncHandler(me));
router.get('/profile', requireAuth, asyncHandler(profile));
router.post('/logout', requireAuth, asyncHandler(logout));

export default router;
