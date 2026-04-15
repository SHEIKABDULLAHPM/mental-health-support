import { Router } from 'express';
import { asyncHandler } from '../utils/errors.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  addPositivityInteraction,
  createPositivityContent,
  listMyPositivityInteractions,
  listPositivityContent,
} from '../controllers/positivityController.js';

const router = Router();

router.use(requireAuth);
router.get('/content', asyncHandler(listPositivityContent));
router.get('/me/interactions', asyncHandler(listMyPositivityInteractions));
router.post('/interactions', asyncHandler(addPositivityInteraction));
router.post('/content', requireRole('admin'), asyncHandler(createPositivityContent));

export default router;
