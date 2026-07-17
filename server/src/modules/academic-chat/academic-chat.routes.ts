import { Router } from 'express';
import { authenticate } from '../../middlewares/authMiddleware.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { AcademicChatController } from './academic-chat.controller.js';
import { academicChatValidator } from './academic-chat.validator.js';

const router = Router();

// Apply auth middleware to all academic chat routes
router.use(authenticate);

// Get all chat sessions for the logged-in user
router.get('/sessions', AcademicChatController.getSessions);

// Search users to start a new chat with
router.get('/users/search', AcademicChatController.searchUsers);

// Get a specific chat session and its messages
router.get('/sessions/:sessionId', AcademicChatController.getSession);

// Initialize a new chat session (or get existing one)
router.post(
  '/sessions',
  validateRequest(academicChatValidator.createSession),
  AcademicChatController.createSession
);

// Send a message in a session
router.post(
  '/sessions/:sessionId/messages',
  validateRequest(academicChatValidator.sendMessage),
  AcademicChatController.sendMessage
);

// Mark messages as read
router.patch(
  '/sessions/:sessionId/read',
  AcademicChatController.markAsRead
);

// Soft delete a message
router.delete(
  '/messages/:messageId',
  AcademicChatController.deleteMessage
);

export default router;
