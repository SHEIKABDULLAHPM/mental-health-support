import { Router } from 'express';
import { asyncHandler } from '../utils/errors.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { analytics, listConversations, listUsers, logs } from '../controllers/adminController.js';

const router = Router();

router.use(requireAuth, requireRole('admin'));
router.get('/users', asyncHandler(listUsers));
router.get('/conversations', asyncHandler(listConversations));
router.get('/analytics', asyncHandler(analytics));
router.get('/logs', asyncHandler(logs));

export default router;
