import { Router } from 'express';
import { asyncHandler } from '../utils/errors.js';
import { requireAuth } from '../middleware/auth.js';
import { authRateLimiter } from '../middleware/rateLimit.js';
import {
	getChatHealth,
	sendMessage,
	listMyConversations,
	getMyConversation,
	clearMyConversation,
	getMyConversationAssessment,
	streamMessage,
} from '../controllers/chatController.js';

const router = Router();

router.get('/health', requireAuth, asyncHandler(getChatHealth));
router.post('/message', requireAuth, authRateLimiter(25, 60 * 1000), asyncHandler(sendMessage));
router.post('/send', requireAuth, authRateLimiter(25, 60 * 1000), asyncHandler(sendMessage));
router.post('/stream', requireAuth, authRateLimiter(25, 60 * 1000), asyncHandler(streamMessage));
router.get('/conversations', requireAuth, asyncHandler(listMyConversations));
router.get('/conversations/:id', requireAuth, asyncHandler(getMyConversation));
router.delete('/conversations/:id', requireAuth, asyncHandler(clearMyConversation));
router.get('/conversations/:id/assessment', requireAuth, asyncHandler(getMyConversationAssessment));

export default router;
