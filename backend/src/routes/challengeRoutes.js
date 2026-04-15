import { Router } from 'express';
import { asyncHandler } from '../utils/errors.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  createChallenge,
  listChallengeCatalog,
  listMyChallenges,
  startChallenge,
  updateMyChallengeProgress,
} from '../controllers/challengesController.js';

const router = Router();

router.use(requireAuth);
router.get('/catalog', asyncHandler(listChallengeCatalog));
router.get('/me', asyncHandler(listMyChallenges));
router.post('/me/start', asyncHandler(startChallenge));
router.patch('/me/:id', asyncHandler(updateMyChallengeProgress));
router.post('/catalog', requireRole('admin'), asyncHandler(createChallenge));

export default router;
