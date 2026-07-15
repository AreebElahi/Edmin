import { Router } from 'express';
import { authenticate } from '../../middlewares/authMiddleware.js';
import { requirePermission } from '../../middlewares/rbac.js';
import { studentLimiter } from '../../middlewares/rateLimit.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { requireCache } from '../../middlewares/cache.middleware.js';

import { enrollmentSchema } from '../../validators/student/enrollment.validator.js';
import { quizAttemptSchema } from '../../validators/student/quiz.validator.js';
import { submitAssignmentSchema, quizIdParamSchema, notificationIdParamSchema } from '../../validators/student.validator.js';

import { getProfileHandler } from '../../controllers/student/profile.controller.js';
import { getAttendanceSummaryHandler, getAttendanceDetailHandler } from '../../controllers/student/attendance.controller.js';
import { getGradesHandler } from '../../controllers/student/grades.controller.js';
import { getScheduleHandler } from '../../controllers/student/schedule.controller.js';
import { getAvailableOfferings, getMyEnrollmentRequests, createEnrollment } from '../../controllers/enrollmentController.js';
import { getAssignmentsHandler, getAssignmentDetailHandler, submitAssignmentHandler, unsubmitAssignmentHandler } from '../../controllers/student/assignments.controller.js';
import { getQuizzesHandler, getQuizDetailHandler, submitQuizAttemptHandler, getQuizResultHandler, reportQuizViolationHandler } from '../../controllers/student/quizzes.controller.js';
import { getNotificationsHandler, markAsReadHandler } from '../../controllers/student/notifications.controller.js';
import { getStudentCoursesHandler, getStudentCourseDetailHandler } from '../../controllers/student/courses.controller.js';

import multer from 'multer';

import { createFileFilter } from '../../middlewares/fileFilter.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

const router = Router();

// Apply student rate limiter
router.use(studentLimiter);

// Protect all routes: Require Auth & STUDENT role
router.use(authenticate);
router.use(requirePermission('STUDENT_ROUTES', 'ACCESS'));

// Enterprise Caching for GET requests (5 minutes)
router.use(requireCache(300));

router.get('/profile', getProfileHandler);
router.get('/courses', getStudentCoursesHandler);
router.get('/courses/:courseOfferingId', getStudentCourseDetailHandler);
router.get('/attendance', getAttendanceSummaryHandler);
router.get('/attendance/:courseOfferingId', getAttendanceDetailHandler);
router.get('/grades', getGradesHandler);
router.get('/schedule', getScheduleHandler);
router.get('/enrollment', getAvailableOfferings);
router.get('/enrollment/mine', getMyEnrollmentRequests);
router.post('/enrollment', validateRequest({ body: enrollmentSchema, mode: 'enforce' }), createEnrollment);
router.get('/assignments', getAssignmentsHandler);
router.get('/assignments/:assignmentId', getAssignmentDetailHandler);
router.post('/assignments/:assignmentId/submit', upload.single('file'), validateRequest({ body: submitAssignmentSchema, mode: 'enforce' }), submitAssignmentHandler);
router.delete('/assignments/:assignmentId/submit', unsubmitAssignmentHandler);
router.get('/quizzes', getQuizzesHandler);
router.get('/quizzes/:quizId', getQuizDetailHandler);
router.post('/quizzes/:quizId/attempt', validateRequest({ body: quizAttemptSchema, mode: 'enforce' }), submitQuizAttemptHandler);
router.get('/quizzes/:quizId/result', getQuizResultHandler);
router.post('/quizzes/:quizId/violation', validateRequest({ params: quizIdParamSchema, mode: 'enforce' }), reportQuizViolationHandler);
router.get('/notifications', getNotificationsHandler);
router.patch('/notifications/:id/read', validateRequest({ params: notificationIdParamSchema, mode: 'enforce' }), markAsReadHandler);

export default router;
