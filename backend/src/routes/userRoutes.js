import { Router } from 'express';
import { asyncHandler } from '../utils/errors.js';
import { requireAuth } from '../middleware/auth.js';
import {
	changeMyPassword,
	deactivateMyAccount,
	getCurrentUser,
	updateMyPreferences,
	updateMyProfile,
} from '../controllers/userController.js';

const router = Router();

router.use(requireAuth);
router.get('/me', asyncHandler(getCurrentUser));
router.patch('/me', asyncHandler(updateMyProfile));
router.patch('/me/preferences', asyncHandler(updateMyPreferences));
router.post('/me/password', asyncHandler(changeMyPassword));
router.delete('/me', asyncHandler(deactivateMyAccount));

export default router;
