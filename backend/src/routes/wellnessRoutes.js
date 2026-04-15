import { Router } from 'express';
import { asyncHandler } from '../utils/errors.js';
import { requireAuth } from '../middleware/auth.js';
import {
  addReflectionReaction,
  createFutureLetter,
  createJournalEntry,
  createReflection,
  deleteJournalEntry,
  listFutureLetters,
  listJournalEntries,
  listReflections,
  updateJournalEntry,
} from '../controllers/wellnessController.js';

const router = Router();

router.use(requireAuth);

router.get('/journal', asyncHandler(listJournalEntries));
router.post('/journal', asyncHandler(createJournalEntry));
router.patch('/journal/:id', asyncHandler(updateJournalEntry));
router.delete('/journal/:id', asyncHandler(deleteJournalEntry));

router.get('/reflections', asyncHandler(listReflections));
router.post('/reflections', asyncHandler(createReflection));
router.post('/reflections/:id/reactions', asyncHandler(addReflectionReaction));

router.get('/future-letters', asyncHandler(listFutureLetters));
router.post('/future-letters', asyncHandler(createFutureLetter));

export default router;
