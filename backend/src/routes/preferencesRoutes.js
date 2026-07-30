import { Router } from 'express';
import { body } from 'express-validator';
import { asyncHandler } from '../utils/errors.js';
import { requireAuth } from '../middleware/auth.js';
import { getMyPreferences, upsertMyPreferences } from '../controllers/preferencesController.js';

const router = Router();

const upsertPreferencesValidation = [
  body('interests').optional().isArray(),
  body('goals').optional().isArray(),
  body('moodPatterns').optional().isArray(),
  body('activityPreferences').optional().isArray(),
  body('language').optional().isString(),
  body('onboardingVersion').optional().isString(),
];

router.use(requireAuth);
router.get('/me', asyncHandler(getMyPreferences));
router.put('/me', upsertPreferencesValidation, asyncHandler(upsertMyPreferences));

export default router;
