import { Router } from 'express';
import { body, param } from 'express-validator';
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

const createChallengeValidation = [
  body('slug', 'Slug is required').trim().notEmpty(),
  body('title', 'Title is required').trim().notEmpty(),
  body('description').optional().trim(),
  body('difficulty').optional().isIn(['easy', 'medium', 'hard']),
  body('points').optional().isInt({ min: 1 }),
  body('target').optional().isInt({ min: 1 }),
  body('tags').optional().isArray(),
];

const startChallengeValidation = [
  body('challengeId', 'A valid challengeId is required').isMongoId(),
];

const updateProgressValidation = [
  param('id', 'A valid progress ID is required').isMongoId(),
  body('progress', 'Progress must be a non-negative number').isFloat({ min: 0 }),
];

router.use(requireAuth);
router.get('/catalog', asyncHandler(listChallengeCatalog));
router.get('/me', asyncHandler(listMyChallenges));
router.post('/me/start', startChallengeValidation, asyncHandler(startChallenge));
router.patch('/me/:id', updateProgressValidation, asyncHandler(updateMyChallengeProgress));
router.post('/catalog', requireRole('admin'), createChallengeValidation, asyncHandler(createChallenge));

export default router;
