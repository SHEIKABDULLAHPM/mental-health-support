import { Router } from 'express';
import { asyncHandler } from '../utils/errors.js';
import { requireAuth } from '../middleware/auth.js';
import { getMyPreferences, upsertMyPreferences } from '../controllers/preferencesController.js';

const router = Router();

router.use(requireAuth);
router.get('/me', asyncHandler(getMyPreferences));
router.put('/me', asyncHandler(upsertMyPreferences));

export default router;
