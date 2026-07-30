import { Router } from 'express';
import { query } from 'express-validator';
import multer from 'multer';
import { asyncHandler } from '../utils/errors.js';
import { requireAuth } from '../middleware/auth.js';
import { detectFaceEmotion, detectVoiceEmotion, listMyEmotionAnalyses } from '../controllers/emotionController.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const listAnalysesValidation = [
  query('modality', 'Modality must be either "face" or "voice"').optional().isIn(['face', 'voice']),
];

router.use(requireAuth);
router.post('/voice', upload.single('audio'), asyncHandler(detectVoiceEmotion));
router.post('/face', upload.single('image'), asyncHandler(detectFaceEmotion));
router.get('/me', listAnalysesValidation, asyncHandler(listMyEmotionAnalyses));

export default router;
