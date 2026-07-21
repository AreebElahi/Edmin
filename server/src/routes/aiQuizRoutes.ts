import express from 'express';
import * as aiQuizController from '../controllers/aiQuizController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { requirePermission } from '../middlewares/rbac.js';

const router = express.Router();

router.use(authenticate);

import multer from 'multer';

import { createFileFilter } from '../middlewares/fileFilter.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
  fileFilter: createFileFilter({
    'application/pdf': ['.pdf'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
  })
});

// ===== Faculty Endpoints =====

// Generate AI quiz questions (preview)
router.post(
  '/generate',
  requirePermission('AI_QUIZ', 'MANAGE'),
  upload.single('pdf'),
  aiQuizController.generateQuiz
);

// Regenerate single question
router.post(
  '/regenerate',
  requirePermission('AI_QUIZ', 'MANAGE'),
  aiQuizController.regenerateQuestion
);

// Save generated quiz
router.post(
  '/save',
  requirePermission('AI_QUIZ', 'MANAGE'),
  aiQuizController.saveQuiz
);

// List quizzes (faculty: own quizzes, student: published quizzes)
router.get('/', aiQuizController.listQuizzes);

// Get quiz by ID
router.get('/:id', aiQuizController.getQuiz);

// Update quiz status (publish/archive)
router.put(
  '/:id/status',
  requirePermission('AI_QUIZ', 'MANAGE'),
  aiQuizController.updateStatus
);

// Delete quiz (soft delete)
router.delete(
  '/:id',
  requirePermission('AI_QUIZ', 'MANAGE'),
  aiQuizController.deleteQuiz
);

// Get all attempts for a quiz (gradebook)
router.get(
  '/:id/attempts',
  requirePermission('AI_QUIZ', 'MANAGE'),
  aiQuizController.getAttempts
);

// Grant reattempt to a student
router.post(
  '/:id/reattempt',
  requirePermission('AI_QUIZ', 'MANAGE'),
  aiQuizController.grantReattempt
);

// ===== Student Endpoints =====

// Start a quiz attempt
router.post(
  '/:id/attempt',
  requirePermission('AI_QUIZ', 'ATTEMPT'),
  aiQuizController.startAttempt
);

// Submit attempt / update
router.put(
  '/:id/attempt/:attemptId',
  requirePermission('AI_QUIZ', 'ATTEMPT'),
  aiQuizController.submitAttempt
);

// Update violation count
router.put(
  '/:id/attempt/:attemptId/violation',
  requirePermission('AI_QUIZ', 'ATTEMPT'),
  aiQuizController.updateViolation
);

// Get attempt details (result page) — any authenticated user
router.get('/attempt/:attemptId', aiQuizController.getAttemptDetails);

export default router;
