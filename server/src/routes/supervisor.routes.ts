import { Router } from 'express';
import * as supervisorController from '../controllers/supervisorController.js';
import { requireDepartmentRole } from '../middlewares/requireDepartmentRole.js';

const router = Router();

// Apply SUPERVISOR role check to all routes in this namespace
router.use(requireDepartmentRole('SUPERVISOR'));

// Dashboard & Analytics
router.get('/dashboard-stats', supervisorController.getDashboardStats);
router.get('/analytics/health', supervisorController.getAnalytics);

// Academic Monitoring
router.get('/courses', supervisorController.getDepartmentCourses);
router.get('/timetable', supervisorController.getDepartmentTimetable);
router.get('/students', supervisorController.getDepartmentStudents);
router.get('/calendar', supervisorController.getDepartmentCalendar);
router.get('/notifications', supervisorController.getNotifications);

// Faculty & Department Operations
router.get('/faculty', supervisorController.getDepartmentFaculty);
router.get('/activity-reports', supervisorController.getDepartmentActivityReports);
router.get('/leaves', supervisorController.getDepartmentLeaves);
router.get('/attendance', supervisorController.getDepartmentAttendance);

// Pending Approvals
router.get('/pending-approvals', supervisorController.getPendingApprovals);
router.get('/teaching-loads', supervisorController.getTeachingLoads);
router.get('/enrollment-requests', supervisorController.getEnrollmentRequests);
router.get('/enrollment-requests/:id', supervisorController.getEnrollmentRequestDetail);
router.post('/enrollment-requests/:id/change-section', supervisorController.changeSection);

// Withdrawal requests routes
router.get('/withdrawal-requests', supervisorController.getWithdrawalRequests);
router.get('/withdrawal-requests/:id', supervisorController.getWithdrawalRequestDetail);
router.post('/withdrawal-requests/:id/approve', supervisorController.approveWithdrawal);
router.post('/withdrawal-requests/:id/reject', supervisorController.rejectWithdrawal);

// Approval History
router.get('/history/:entityType/:entityId', supervisorController.getApprovalHistory);

// Recommending & Approval Workflows (POST)
router.post('/teaching-loads/:id/recommend', supervisorController.recommendTeachingLoad);
router.post('/teaching-loads/:id/reject', supervisorController.rejectTeachingLoad);

router.post('/enrollment/:id/approve', supervisorController.approveEnrollment);
router.post('/enrollment/:id/reject', supervisorController.rejectEnrollment);

router.post('/activity-reports/:id/review', supervisorController.approveReport); // Will need fix
router.post('/activity-reports/:id/reject', supervisorController.rejectReport);

router.post('/leaves/:id/comment', supervisorController.commentLeave);

export default router;
