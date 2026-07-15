import { Router } from 'express';
import { authenticate } from '../../middlewares/authMiddleware.js';
import { downloadSubmission, downloadQuizPdf } from '../../controllers/storage.controller.js';

const router = Router();

// Storage routes require authentication
router.use(authenticate);

// Download an assignment submission
router.get('/assignments/:assignmentId/submissions/:submissionId/download', downloadSubmission);

// Download an AI Quiz source PDF
router.get('/quiz-pdf/:id', downloadQuizPdf);

export default router;
