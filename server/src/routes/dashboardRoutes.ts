import express from 'express';
import * as dashboardController from '../controllers/dashboardController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { requirePermission } from '../middlewares/rbac.js';

const router = express.Router();

// All dashboard routes require authentication
router.use(authenticate);

// Role-specific dashboard endpoints
router.get('/student', requirePermission('DASHBOARD', 'STUDENT'), dashboardController.getStudentDashboard);
router.get('/faculty', requirePermission('DASHBOARD', 'FACULTY'), dashboardController.getFacultyDashboard);
router.get('/admin', requirePermission('DASHBOARD', 'ADMIN'), dashboardController.getAdminDashboard);
router.get('/hr/summary', requirePermission('DASHBOARD', 'HR'), dashboardController.getHrDashboardSummary);
router.get('/hr/leaves/today', requirePermission('DASHBOARD', 'HR'), dashboardController.getHrLeavesToday);
router.get('/hr/compliance', requirePermission('DASHBOARD', 'HR'), dashboardController.getHrCompliance);
router.get('/hr/approvals/pending', requirePermission('DASHBOARD', 'HR'), dashboardController.getHrApprovalsPending);

export default router;
