import { Router } from 'express';
import { asyncHandler } from '../utils/errors.js';
import { requireAuth } from '../middleware/auth.js';
import { createRateLimiter } from '../middleware/rateLimit.js';
import { login, logout, me, profile, register } from '../controllers/authController.js';

const router = Router();
const authLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 20 });

router.post('/register', authLimiter, asyncHandler(register));
router.post('/login', authLimiter, asyncHandler(login));
router.get('/me', requireAuth, asyncHandler(me));
router.get('/profile', requireAuth, asyncHandler(profile));
router.post('/logout', requireAuth, asyncHandler(logout));

export default router;
