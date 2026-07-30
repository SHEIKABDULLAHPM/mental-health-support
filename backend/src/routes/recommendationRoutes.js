import { Router } from 'express';
import { body, query } from 'express-validator';
import { asyncHandler } from '../utils/errors.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  addRecommendationFeedback,
  createRecommendationCatalogItem,
  getPersonalizedRecommendations,
  listRecommendationCatalog,
} from '../controllers/recommendationsController.js';

const router = Router();

const itemTypes = ['book', 'music', 'activity', 'challenge', 'breathing', 'positivity', 'nature-sound'];
const feedbackActions = ['clicked', 'completed', 'dismissed', 'viewed'];

const listCatalogValidation = [
  query('type').optional().isIn(itemTypes),
  query('language').optional().isString().trim(),
  query('limit').optional().isInt({ min: 1, max: 300 }),
];

const createItemValidation = [
  body('itemType').isIn(itemTypes),
  body('title', 'Title is required').notEmpty().isString().trim(),
  body('description', 'Description is required').notEmpty().isString().trim(),
  body('tags').optional().isArray(),
  body('language').optional().isString().trim(),
  body('metadata').optional().isObject(),
];

const getPersonalizedValidation = [
  query('topN').optional().isInt({ min: 1, max: 50 }),
  query('mood').optional().isString().trim(),
];

const addFeedbackValidation = [
  body('itemId', 'A valid itemId is required').isMongoId(),
  body('rating').optional({ checkFalsy: true }).isFloat({ min: 0, max: 5 }),
  body('action').isIn(feedbackActions),
];

router.use(requireAuth);
router.get('/catalog', listCatalogValidation, asyncHandler(listRecommendationCatalog));
router.get('/me', getPersonalizedValidation, asyncHandler(getPersonalizedRecommendations));
router.post('/feedback', addFeedbackValidation, asyncHandler(addRecommendationFeedback));
router.post('/catalog', requireRole('admin'), createItemValidation, asyncHandler(createRecommendationCatalogItem));

export default router;
