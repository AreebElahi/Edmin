import express from 'express';
import * as facultyController from '../../controllers/facultyController.js';
import * as facultyActivityController from '../../controllers/facultyActivityController.js';
import * as facultyLeaveController from '../../controllers/facultyLeaveController.js';
import * as assessmentController from '../../controllers/assessmentController.js';
import * as hodController from '../../controllers/hodController.js';
import supervisorRoutes from '../supervisor.routes.js';
import { authenticate } from '../../middlewares/authMiddleware.js';
import { requirePermission } from '../../middlewares/rbac.js';
import { requireDepartmentRole } from '../../middlewares/requireDepartmentRole.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { markAttendanceSchema, createAttendanceSessionSchema } from '../../validators/attendance.validator.js';
import { createAssessmentSchema, updateAssessmentSchema, submitAssessmentResultSchema, updateStudentGradeSchema, assessmentParamsSchema, assessmentResultParamsSchema, enrollmentParamsSchema } from '../../validators/assessment.validator.js';
import { createQuizSchema, submitActivityReportSchema, submitLeaveRequestSchema } from '../../validators/faculty.validator.js';
import { requireCache } from '../../middlewares/cache.middleware.js';

const router = express.Router();

// All routes require faculty, admin, or system admin role
router.use(authenticate);
router.use(requirePermission('FACULTY_ROUTES', 'ACCESS'));

router.get('/courses', requireCache(900), facultyController.getCourses);
router.get('/courses/:id/details', requireCache(900), facultyController.getCourseDetails);
router.get('/courses/:courseId/assessments', requireCache(300), assessmentController.getCourseAssessments);

router.get('/students', requireCache(900), facultyController.getStudents);
router.patch('/students/:enrollmentId/grade', validateRequest({ body: updateStudentGradeSchema, params: enrollmentParamsSchema, mode: 'enforce' }), facultyController.updateStudentGrade);
router.get('/assignments', requireCache(900), facultyController.getAssignments);
router.get('/assignments/:assignmentId/submissions', facultyController.getAssignmentSubmissions);
router.post('/assignments/:assignmentId/students/:studentId/grade', facultyController.gradeAssignmentSubmission);
router.post('/assignments', validateRequest({ body: createAssessmentSchema, mode: 'enforce' }), facultyController.createAssignment);
router.patch('/assignments/:id', validateRequest({ body: updateAssessmentSchema, params: assessmentParamsSchema, mode: 'enforce' }), facultyController.updateAssignment);
router.delete('/assignments/:id', validateRequest({ params: assessmentParamsSchema, mode: 'enforce' }), facultyController.deleteAssignment);

router.get('/quizzes', requireCache(900), facultyController.getQuizzes);
router.get('/quizzes/:id', requireCache(900), facultyController.getQuizDetails);
router.post('/quizzes', validateRequest({ body: createQuizSchema, mode: 'enforce' }), facultyController.createQuiz);
router.delete('/quizzes/:id', facultyController.deleteQuiz);
router.post('/quizzes/:id/reattempt', facultyController.grantReattempt);

router.post('/assessments/:assessmentId/results', validateRequest({ body: submitAssessmentResultSchema, params: assessmentResultParamsSchema, mode: 'enforce' }), assessmentController.updateAssessmentResult);
router.get('/schedule', requireCache(900), facultyController.getSchedule);

router.get('/teaching-loads/available-courses', requireCache(300), facultyController.getAvailableTeachingCourses);
router.post('/teaching-loads', facultyController.submitTeachingLoad);

router.post('/attendance', validateRequest({ body: markAttendanceSchema, mode: 'enforce' }), facultyController.markAttendance);
router.get('/attendance/sessions', requireCache(300), facultyController.getAttendanceSessions);
router.get('/attendance/sessions/:sessionId/roster', requireCache(300), facultyController.getAttendanceSessionRoster);
router.post('/attendance/sessions', validateRequest({ body: createAttendanceSessionSchema, mode: 'enforce' }), facultyController.createAttendanceSession);

router.get('/analytics', requireCache(900), facultyController.getAnalytics);

router.post('/activity', validateRequest({ body: submitActivityReportSchema, mode: 'enforce' }), facultyActivityController.submitActivityReport);
router.get('/activity', requireCache(300), facultyActivityController.getMyActivityReports);

router.post('/leaves', validateRequest({ body: submitLeaveRequestSchema, mode: 'enforce' }), facultyLeaveController.submitLeaveRequest);
router.get('/leaves', requireCache(300), facultyLeaveController.getMyLeaveRequests);

router.get('/approvals', requireCache(300), facultyController.getMyPendingApprovals);

router.get('/hr-summary', requireCache(900), facultyController.getHrSummary);
router.get('/payroll/:id', requireCache(900), facultyController.getPayslip);

// HOD Dashboard Routes
router.get('/hod/dashboard-stats', requireDepartmentRole('HOD'), requireCache(5), hodController.getHodDashboardStats);
router.get('/hod/faculty-activity', requireDepartmentRole('HOD'), requireCache(5), hodController.getHodFacultyActivity);
router.get('/hod/upcoming-events', requireDepartmentRole('HOD'), requireCache(5), hodController.getUpcomingEvents);
router.get('/hod/courses', requireDepartmentRole('HOD'), requireCache(0), hodController.getDepartmentCourses);
router.get('/hod/leaves', requireDepartmentRole('HOD'), requireCache(5), hodController.getDepartmentLeaves);
router.get('/hod/students', requireDepartmentRole('HOD'), requireCache(0), hodController.getDepartmentStudents);
router.get('/hod/activity-reports', requireDepartmentRole('HOD'), requireCache(5), hodController.getDepartmentActivityReports);
router.get('/teaching-loads', requireDepartmentRole('HOD'), requireCache(5), hodController.getDepartmentTeachingLoads);
router.use('/supervisor', supervisorRoutes);

export default router;
