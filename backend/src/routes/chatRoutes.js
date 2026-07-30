import { Router } from 'express';
import { body, param } from 'express-validator';
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

const messageValidation = [
	body('message', 'Message is required').trim().notEmpty(),
	body('conversation_id', 'Invalid conversation_id').optional({ values: 'null' }).isMongoId(),
];

const conversationIdValidation = [
	param('id', 'A valid conversation ID is required').isMongoId(),
];

router.get('/health', requireAuth, asyncHandler(getChatHealth));
router.post('/message', requireAuth, authRateLimiter(25, 60 * 1000), messageValidation, asyncHandler(sendMessage));
router.post('/send', requireAuth, authRateLimiter(25, 60 * 1000), messageValidation, asyncHandler(sendMessage));
router.post('/stream', requireAuth, authRateLimiter(25, 60 * 1000), messageValidation, asyncHandler(streamMessage));
router.get('/conversations', requireAuth, asyncHandler(listMyConversations));
router.get('/conversations/:id', requireAuth, conversationIdValidation, asyncHandler(getMyConversation));
router.delete('/conversations/:id', requireAuth, conversationIdValidation, asyncHandler(clearMyConversation));
router.get('/conversations/:id/assessment', requireAuth, conversationIdValidation, asyncHandler(getMyConversationAssessment));

export default router;
