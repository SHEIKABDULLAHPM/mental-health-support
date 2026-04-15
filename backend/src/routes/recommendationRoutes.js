import { Router } from 'express';
import { asyncHandler } from '../utils/errors.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  addRecommendationFeedback,
  createRecommendationCatalogItem,
  getPersonalizedRecommendations,
  listRecommendationCatalog,
} from '../controllers/recommendationsController.js';

const router = Router();

router.use(requireAuth);
router.get('/catalog', asyncHandler(listRecommendationCatalog));
router.get('/me', asyncHandler(getPersonalizedRecommendations));
router.post('/feedback', asyncHandler(addRecommendationFeedback));
router.post('/catalog', requireRole('admin'), asyncHandler(createRecommendationCatalogItem));

export default router;
