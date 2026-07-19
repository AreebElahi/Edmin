import express from 'express';
import * as controller from '../../controllers/facultyAttendanceController.js';
import { authenticate } from '../../middlewares/authMiddleware.js';
import { requirePermission } from '../../middlewares/rbac.js';
import { requireCache } from '../../middlewares/cache.middleware.js';

const router = express.Router();

// Card Reader endpoints (no auth — hardware/simulator use)
router.post('/check-in', controller.checkInCard);
router.post('/check-out', controller.checkOutCard);
router.post('/card-tap', controller.checkInCard); // Alias used by the admin simulator

// Authenticated Routes
router.use(authenticate);

router.get('/', requireCache(60), controller.getAttendanceLogs);
router.get('/stats', requireCache(60), controller.getDashboardStats);        // Used by Check-In Monitor frontend
router.get('/dashboard', requireCache(60), controller.getDashboardStats);    // Alias
router.get('/settings', requireCache(300), controller.getSettings);
router.patch('/settings', requirePermission('FACULTY_ROUTES', 'ACCESS'), controller.updateSettings);
router.get('/today', requireCache(60), controller.getTodayAttendance);
router.get('/audit', requireCache(300), controller.getAuditLogs);
router.get('/corrections', requireCache(60), controller.getCorrectionRequests);
router.post('/correction-request', controller.submitCorrectionRequest);
router.patch('/corrections/:id/review', controller.reviewCorrectionRequest); // Used by admin monitor
router.patch('/correction/:id', controller.reviewCorrectionRequest);          // Legacy alias
router.get('/:id', requireCache(60), controller.getAttendanceById);

export default router;
