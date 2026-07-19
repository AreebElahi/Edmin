import { Router } from 'express';
import * as supervisorController from '../controllers/supervisorController.js';
import { requireDepartmentRole } from '../middlewares/requireDepartmentRole.js';
import { requireCache } from '../middlewares/cache.middleware.js';

const router = Router();

// Apply SUPERVISOR role check to all routes in this namespace
router.use(requireDepartmentRole('SUPERVISOR'));

// Dashboard & Analytics
router.get('/dashboard-stats', requireCache(900), supervisorController.getDashboardStats);
router.get('/analytics/health', requireCache(900), supervisorController.getAnalytics);

// Academic Monitoring
router.get('/courses', requireCache(900), supervisorController.getDepartmentCourses);
router.get('/timetable', requireCache(900), supervisorController.getDepartmentTimetable);
router.get('/students', requireCache(900), supervisorController.getDepartmentStudents);
router.get('/calendar', requireCache(900), supervisorController.getDepartmentCalendar);
router.get('/notifications', requireCache(300), supervisorController.getNotifications);

// Faculty & Department Operations
router.get('/faculty', requireCache(900), supervisorController.getDepartmentFaculty);
router.get('/activity-reports', requireCache(300), supervisorController.getDepartmentActivityReports);
router.get('/leaves', requireCache(300), supervisorController.getDepartmentLeaves);
router.get('/attendance', requireCache(300), supervisorController.getDepartmentAttendance);

// Pending Approvals
router.get('/pending-approvals', requireCache(300), supervisorController.getPendingApprovals);
router.get('/teaching-loads', requireCache(900), supervisorController.getTeachingLoads);
router.get('/enrollment-requests', requireCache(300), supervisorController.getEnrollmentRequests);
router.get('/enrollment-requests/:id', requireCache(300), supervisorController.getEnrollmentRequestDetail);
router.post('/enrollment-requests/:id/change-section', supervisorController.changeSection);

// Withdrawal requests routes
router.get('/withdrawal-requests', requireCache(300), supervisorController.getWithdrawalRequests);
router.get('/withdrawal-requests/:id', requireCache(300), supervisorController.getWithdrawalRequestDetail);
router.post('/withdrawal-requests/:id/approve', supervisorController.approveWithdrawal);
router.post('/withdrawal-requests/:id/reject', supervisorController.rejectWithdrawal);

// Approval History
router.get('/history/:entityType/:entityId', requireCache(900), supervisorController.getApprovalHistory);

// Recommending & Approval Workflows (POST)
router.post('/teaching-loads/:id/recommend', supervisorController.recommendTeachingLoad);
router.post('/teaching-loads/:id/reject', supervisorController.rejectTeachingLoad);

router.post('/enrollment/:id/approve', supervisorController.approveEnrollment);
router.post('/enrollment/:id/reject', supervisorController.rejectEnrollment);

router.post('/activity-reports/:id/review', supervisorController.approveReport); // Will need fix
router.post('/activity-reports/:id/reject', supervisorController.rejectReport);

router.post('/leaves/:id/comment', supervisorController.commentLeave);

export default router;
