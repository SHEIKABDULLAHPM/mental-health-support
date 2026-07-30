import { Router } from 'express';
import { body, query } from 'express-validator';
import { asyncHandler } from '../utils/errors.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  addPositivityInteraction,
  createPositivityContent,
  listMyPositivityInteractions,
  listPositivityContent,
} from '../controllers/positivityController.js';

const router = Router();

const listContentValidation = [
  query('type').optional().isIn(['quote', 'affirmation', 'prompt']),
  query('language').optional().isString().trim(),
  query('limit').optional().isInt({ min: 1, max: 200 }),
];

const createContentValidation = [
  body('text', 'Text is required').notEmpty().isString().trim(),
  body('contentType').optional().isIn(['quote', 'affirmation', 'prompt']),
  body('author').optional().isString().trim(),
  body('tags').optional().isArray(),
  body('language').optional().isString().trim(),
];

const addInteractionValidation = [
  body('contentId', 'A valid contentId is required').isMongoId(),
  body('action', 'A valid action is required').isIn(['like', 'favorite', 'share', 'copy', 'view']),
];

router.use(requireAuth);
router.get('/content', listContentValidation, asyncHandler(listPositivityContent));
router.get('/me/interactions', asyncHandler(listMyPositivityInteractions));
router.post('/interactions', addInteractionValidation, asyncHandler(addPositivityInteraction));
router.post('/content', requireRole('admin'), createContentValidation, asyncHandler(createPositivityContent));

export default router;
