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

const router = express.Router();

// All routes require faculty, admin, or system admin role
router.use(authenticate);
router.use(requirePermission('FACULTY_ROUTES', 'ACCESS'));

router.get('/courses', facultyController.getCourses);
router.get('/courses/:courseId/assessments', assessmentController.getCourseAssessments);

router.get('/students', facultyController.getStudents);
router.patch('/students/:enrollmentId/grade', validateRequest({ body: updateStudentGradeSchema, params: enrollmentParamsSchema, mode: 'enforce' }), facultyController.updateStudentGrade);
router.get('/assignments', facultyController.getAssignments);
router.post('/assignments', validateRequest({ body: createAssessmentSchema, mode: 'enforce' }), facultyController.createAssignment);
router.patch('/assignments/:id', validateRequest({ body: updateAssessmentSchema, params: assessmentParamsSchema, mode: 'enforce' }), facultyController.updateAssignment);
router.delete('/assignments/:id', validateRequest({ params: assessmentParamsSchema, mode: 'enforce' }), facultyController.deleteAssignment);

router.get('/quizzes', facultyController.getQuizzes);
router.post('/quizzes', validateRequest({ body: createQuizSchema, mode: 'enforce' }), facultyController.createQuiz);
router.delete('/quizzes/:id', facultyController.deleteQuiz);
router.post('/quizzes/:id/reattempt', facultyController.grantReattempt);

router.post('/assessments/:assessmentId/results', validateRequest({ body: submitAssessmentResultSchema, params: assessmentResultParamsSchema, mode: 'enforce' }), assessmentController.updateAssessmentResult);
router.get('/schedule', facultyController.getSchedule);

router.get('/teaching-loads/available-courses', facultyController.getAvailableTeachingCourses);


router.post('/attendance', validateRequest({ body: markAttendanceSchema, mode: 'enforce' }), facultyController.markAttendance);
router.get('/attendance/sessions', facultyController.getAttendanceSessions);
router.get('/attendance/sessions/:sessionId/roster', facultyController.getAttendanceSessionRoster);
router.post('/attendance/sessions', validateRequest({ body: createAttendanceSessionSchema, mode: 'enforce' }), facultyController.createAttendanceSession);

router.get('/analytics', facultyController.getAnalytics);

router.post('/activity', validateRequest({ body: submitActivityReportSchema, mode: 'enforce' }), facultyActivityController.submitActivityReport);
router.get('/activity', facultyActivityController.getMyActivityReports);

router.post('/leaves', validateRequest({ body: submitLeaveRequestSchema, mode: 'enforce' }), facultyLeaveController.submitLeaveRequest);
router.get('/leaves', facultyLeaveController.getMyLeaveRequests);

router.get('/approvals', facultyController.getMyPendingApprovals);

router.get('/hr-summary', facultyController.getHrSummary);
router.get('/payroll/:id', facultyController.getPayslip);

// HOD Dashboard Routes
router.get('/hod/dashboard-stats', requireDepartmentRole('HOD'), hodController.getHodDashboardStats);
router.get('/hod/faculty-activity', requireDepartmentRole('HOD'), hodController.getHodFacultyActivity);
router.get('/hod/upcoming-events', requireDepartmentRole('HOD'), hodController.getUpcomingEvents);

router.use('/supervisor', supervisorRoutes);

export default router;
