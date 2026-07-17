import { Router } from 'express';
import { 
  resolveTicketHandler, 
  streamTickets, 
  getTicketsHandler, 
  getTicketByIdHandler, 
  assignTicketHandler, 
  createMessageHandler,
  createTicketHandler,
  getAssignableStaffHandler
} from '../../controllers/admin/ticket.controller.js';
import {
  getAllUsersHandler,
  registerUserHandler,
  toggleUserStatusHandler,
  resetPasswordHandler,
  getAuditTrailHandler,
  bulkImportHandler,
  previewEmailHandler,
  previewIdentifierHandler,
  assignUserRoleHandler
} from '../../controllers/admin/user.controller.js';
import {
  getDepartmentsHandler,
  createDepartmentHandler,
  updateDepartmentHandler,
  mapCourseToDepartmentHandler,
  deleteDepartmentHandler,
  createSectionHandler,
  assignDepartmentManagersHandler
} from '../../controllers/admin/department.controller.js';
import {
  getAllCoursesHandler,
  createCourseHandler,
  updateCourseHandler,
  toggleCourseStatusHandler
} from '../../controllers/admin/course.controller.js';
import { authenticate } from '../../middlewares/authMiddleware.js';
import { requirePermission } from '../../middlewares/rbac.js';
import { sseLimiter } from '../../middlewares/rateLimit.js';
import multer from 'multer';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { createDepartmentSchema, updateDepartmentSchema, assignDepartmentManagersSchema, mapCourseToDepartmentSchema, departmentParamsSchema } from '../../validators/admin/department.validator.js';
import { createCourseSchema, updateCourseSchema, toggleCourseStatusSchema } from '../../validators/admin/course.validator.js';
import { createTicketSchema, assignTicketSchema, updateTicketStatusSchema, createTicketMessageSchema } from '../../validators/admin/ticket.validator.js';
import { createFeePlanSchema, generateInvoiceSchema, recordPaymentSchema } from '../../validators/admin/finance.validator.js';
import { overrideTeachingLoadSchema, reassignTeachingLoadCourseSchema, overrideLeaveSchema, overrideActivityReportSchema, facultyOversightParamsSchema } from '../../validators/admin/facultyOversight.validator.js';
import { overrideEnrollmentRequestSchema } from '../../validators/admin/studentOversight.validator.js';
import { reportQuerySchema } from '../../validators/admin/reports.validator.js';
import { updateConfigSchema, restoreBackupSchema, settingsParamsSchema } from '../../validators/admin/settings.validator.js';
import { createSemesterSchema, rolloverSemesterSchema } from '../../validators/admin/semester.validator.js';
import { createRoomSchema, slotSchema, publishTimetableSchema, timetableParamsSchema } from '../../validators/admin/timetable.validator.js';
import { broadcastAnnouncementSchema, communicationsParamsSchema } from '../../validators/admin/communications.validator.js';
import { injectEventSchema, overrideEscalationSchema, workflowParamsSchema } from '../../validators/admin/workflow.validator.js';
import { registerUserSchema, assignUserRoleSchema, createSectionSchema } from '../../validators/admin/admin.validator.js';
import { toggleUserStatusSchema, userParamsSchema } from '../../validators/admin/user.validator.js';

import { createFileFilter } from '../../middlewares/fileFilter.js';

const upload = multer({ 
  storage: multer.memoryStorage(),
  fileFilter: createFileFilter({
    'text/csv': ['.csv'],
    'application/vnd.ms-excel': ['.csv']
  })
});

const ticketUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'text/plain'];
    cb(null, allowed.includes(file.mimetype));
  }
});

const router = Router();

// Secure all admin routes
router.use(authenticate);
router.use(requirePermission('ADMIN_ROUTES', 'ACCESS'));

import { previewIdentityHandler } from '../../modules/identity/identity.controller.js';

// Users management
router.get('/users', requirePermission('USERS', 'READ'), getAllUsersHandler);
router.get('/users/preview-email', requirePermission('USERS', 'READ'), previewEmailHandler);
router.get('/users/preview-identifier', requirePermission('USERS', 'READ'), previewIdentifierHandler);
router.get('/users/preview-identity', requirePermission('USERS', 'READ'), previewIdentityHandler);
router.post('/users', requirePermission('USERS', 'CREATE'), validateRequest({ body: registerUserSchema, mode: 'enforce' }), registerUserHandler);
router.patch('/users/:id/status', requirePermission('USERS', 'UPDATE'), validateRequest({ body: toggleUserStatusSchema, params: userParamsSchema, mode: 'enforce' }), toggleUserStatusHandler);
router.patch('/users/:id/password-reset', requirePermission('USERS', 'UPDATE'), validateRequest({ params: userParamsSchema, mode: 'enforce' }), resetPasswordHandler);
router.post('/users/:id/roles', requirePermission('USERS', 'UPDATE'), validateRequest({ body: assignUserRoleSchema, params: userParamsSchema, mode: 'enforce' }), assignUserRoleHandler);
router.get('/users/:id/audit', requirePermission('USERS', 'READ'), validateRequest({ params: userParamsSchema, mode: 'enforce' }), getAuditTrailHandler);
router.post('/users/bulk-import', requirePermission('USERS', 'CREATE'), upload.single('file'), validateRequest({ mode: 'enforce' }), bulkImportHandler);

// Departments
router.get('/departments', requirePermission('DEPARTMENTS', 'READ'), getDepartmentsHandler);
router.post('/departments', requirePermission('DEPARTMENTS', 'CREATE'), validateRequest({ body: createDepartmentSchema, mode: 'enforce' }), createDepartmentHandler);
router.put('/departments/:id', requirePermission('DEPARTMENTS', 'UPDATE'), validateRequest({ body: updateDepartmentSchema, mode: 'enforce' }), updateDepartmentHandler);
router.delete('/departments/:id', requirePermission('DEPARTMENTS', 'DELETE'), deleteDepartmentHandler);
router.post('/departments/:id/courses', requirePermission('DEPARTMENTS', 'UPDATE'), validateRequest({ body: mapCourseToDepartmentSchema, params: departmentParamsSchema, mode: 'enforce' }), mapCourseToDepartmentHandler);
router.post('/departments/:id/sections', requirePermission('DEPARTMENTS', 'UPDATE'), validateRequest({ body: createSectionSchema, mode: 'enforce' }), createSectionHandler);
router.patch('/departments/:id/managers', requirePermission('DEPARTMENTS', 'UPDATE'), validateRequest({ body: assignDepartmentManagersSchema, mode: 'enforce' }), assignDepartmentManagersHandler);

// Courses
router.get('/courses', requirePermission('DEPARTMENTS', 'READ'), getAllCoursesHandler);
router.post('/courses', requirePermission('DEPARTMENTS', 'CREATE'), validateRequest({ body: createCourseSchema, mode: 'enforce' }), createCourseHandler);
router.put('/courses/:id', requirePermission('DEPARTMENTS', 'UPDATE'), validateRequest({ body: updateCourseSchema, mode: 'enforce' }), updateCourseHandler);
router.patch('/courses/:id/status', requirePermission('DEPARTMENTS', 'UPDATE'), validateRequest({ body: toggleCourseStatusSchema, mode: 'enforce' }), toggleCourseStatusHandler);

// SSE endpoint for real-time ticket updates
router.get('/tickets/stream', sseLimiter, requirePermission('TICKETS', 'READ'), streamTickets);

// Ticket management
router.get('/staff', requirePermission('TICKETS', 'UPDATE'), getAssignableStaffHandler);
router.get('/tickets', requirePermission('TICKETS', 'READ'), getTicketsHandler);
// File check runs BEFORE validateRequest. Multer handles multipart parsing, then Zod validates the text fields.
router.post('/tickets', requirePermission('TICKETS', 'CREATE'), ticketUpload.array('attachments', 5), validateRequest({ body: createTicketSchema, mode: 'enforce' }), createTicketHandler);
router.get('/tickets/:id', requirePermission('TICKETS', 'READ'), getTicketByIdHandler);
router.patch('/tickets/:id/status', requirePermission('TICKETS', 'UPDATE'), validateRequest({ body: updateTicketStatusSchema, mode: 'enforce' }), resolveTicketHandler);
router.patch('/tickets/:id/assign', requirePermission('TICKETS', 'UPDATE'), validateRequest({ body: assignTicketSchema, mode: 'enforce' }), assignTicketHandler);
router.post('/tickets/:id/messages', requirePermission('TICKETS', 'UPDATE'), ticketUpload.array('attachments', 5), validateRequest({ body: createTicketMessageSchema, mode: 'enforce' }), createMessageHandler);

// Workflow Engine Management
import { 
  getEventsHandler, 
  replayEventHandler,
  forceRetryEventHandler,
  resolveEventHandler,
  injectEventHandler,
  getEscalationsHandler,
  overrideEscalationHandler
} from '../../controllers/admin/workflow.controller.js';
router.get('/workflow/events', requirePermission('WORKFLOW', 'READ'), getEventsHandler);
router.post('/workflow/events/:id/replay', requirePermission('WORKFLOW', 'UPDATE'), validateRequest({ params: workflowParamsSchema, mode: 'enforce' }), replayEventHandler);
router.post('/workflow/events/:id/force-retry', requirePermission('WORKFLOW', 'UPDATE'), validateRequest({ params: workflowParamsSchema, mode: 'enforce' }), forceRetryEventHandler);
router.post('/workflow/events/:id/resolve', requirePermission('WORKFLOW', 'UPDATE'), validateRequest({ params: workflowParamsSchema, mode: 'enforce' }), resolveEventHandler);
router.post('/workflow/events/inject', (req, res, next) => {
  if (process.env.ENABLE_SIMULATOR !== 'true') return res.status(404).send();
  next();
}, requirePermission('WORKFLOW', 'UPDATE'), validateRequest({ body: injectEventSchema, mode: 'enforce' }), injectEventHandler);
router.get('/escalations', requirePermission('WORKFLOW', 'READ'), getEscalationsHandler);
router.patch('/escalations/:id/override', requirePermission('WORKFLOW', 'UPDATE'), validateRequest({ body: overrideEscalationSchema, params: workflowParamsSchema, mode: 'enforce' }), overrideEscalationHandler);

// Academic Semesters
import {
  getSemestersHandler,
  createSemesterHandler,
  rolloverSemesterHandler
} from '../../controllers/admin/semester.controller.js';
router.get('/semesters', requirePermission('SEMESTERS', 'READ'), getSemestersHandler);
router.post('/semesters', requirePermission('SEMESTERS', 'UPDATE'), validateRequest({ body: createSemesterSchema, mode: 'enforce' }), createSemesterHandler);
router.post('/semesters/rollover', requirePermission('SEMESTERS', 'UPDATE'), validateRequest({ body: rolloverSemesterSchema, mode: 'enforce' }), rolloverSemesterHandler);

// Timetable Engine
import {
  getRoomsHandler,
  createRoomHandler,
  deleteRoomHandler,
  getSlotsHandler,
  createSlotHandler,
  updateSlotHandler,
  deleteSlotHandler,
  getVersionsHandler,
  publishTimetableHandler,
  getTimetableOfferingsHandler,
  getTimetableProgramsHandler
} from '../../controllers/admin/timetable.controller.js';
router.get('/rooms', requirePermission('TIMETABLE', 'READ'), getRoomsHandler);
router.post('/rooms', requirePermission('TIMETABLE', 'UPDATE'), validateRequest({ body: createRoomSchema, mode: 'enforce' }), createRoomHandler);
router.delete('/rooms/:id', requirePermission('TIMETABLE', 'UPDATE'), validateRequest({ params: timetableParamsSchema, mode: 'enforce' }), deleteRoomHandler);
router.get('/timetable/slots', requirePermission('TIMETABLE', 'READ'), getSlotsHandler);
router.post('/timetable/slots', requirePermission('TIMETABLE', 'UPDATE'), validateRequest({ body: slotSchema, mode: 'enforce' }), createSlotHandler);
router.put('/timetable/slots/:id', requirePermission('TIMETABLE', 'UPDATE'), validateRequest({ body: slotSchema, params: timetableParamsSchema, mode: 'enforce' }), updateSlotHandler);
router.delete('/timetable/slots/:id', requirePermission('TIMETABLE', 'UPDATE'), validateRequest({ params: timetableParamsSchema, mode: 'enforce' }), deleteSlotHandler);
router.get('/timetable/versions', requirePermission('TIMETABLE', 'READ'), getVersionsHandler);
router.post('/timetable/publish', requirePermission('TIMETABLE', 'UPDATE'), validateRequest({ body: publishTimetableSchema, mode: 'enforce' }), publishTimetableHandler);
router.get('/timetable/offerings', requirePermission('TIMETABLE', 'READ'), getTimetableOfferingsHandler);
router.get('/timetable/programs', requirePermission('TIMETABLE', 'READ'), getTimetableProgramsHandler);

// Communications
import {
  broadcastAnnouncementHandler,
  getQueueHandler,
  cancelScheduledHandler,
  getHistoryHandler
} from '../../controllers/admin/communications.controller.js';
router.post('/communications/broadcast', requirePermission('COMMUNICATIONS', 'UPDATE'), validateRequest({ body: broadcastAnnouncementSchema, mode: 'enforce' }), broadcastAnnouncementHandler);
router.get('/communications/queue', requirePermission('COMMUNICATIONS', 'READ'), getQueueHandler);
router.delete('/communications/queue/:id', requirePermission('COMMUNICATIONS', 'UPDATE'), validateRequest({ params: communicationsParamsSchema, mode: 'enforce' }), cancelScheduledHandler);
router.get('/communications/history', requirePermission('COMMUNICATIONS', 'READ'), getHistoryHandler);

// Reports & Analytics
import {
  getAttendanceReportHandler,
  getEnrollmentReportHandler,
  getLeaveReportSummaryHandler,
  getGradeDistributionReportHandler,
  exportReportsHandler
} from '../../controllers/admin/reports.controller.js';
router.get('/reports/attendance', requirePermission('REPORTS', 'READ'), validateRequest({ query: reportQuerySchema, mode: 'enforce' }), getAttendanceReportHandler);
router.get('/reports/enrollment', requirePermission('REPORTS', 'READ'), validateRequest({ query: reportQuerySchema, mode: 'enforce' }), getEnrollmentReportHandler);
router.get('/reports/leaves', requirePermission('REPORTS', 'READ'), validateRequest({ query: reportQuerySchema, mode: 'enforce' }), getLeaveReportSummaryHandler);
router.get('/reports/grades', requirePermission('REPORTS', 'READ'), validateRequest({ query: reportQuerySchema, mode: 'enforce' }), getGradeDistributionReportHandler);
router.get('/reports/export', requirePermission('REPORTS', 'READ'), validateRequest({ query: reportQuerySchema, mode: 'enforce' }), exportReportsHandler);

// Content Oversight
import {
  getAttachmentsHandler,
  deleteAttachmentHandler,
  getPlagiarismAlertsHandler,
  getSubmissionsMapHandler
} from '../../controllers/admin/oversight.controller.js';
router.get('/oversight/attachments', requirePermission('OVERSIGHT', 'READ'), getAttachmentsHandler);
router.delete('/oversight/attachments/:id', requirePermission('OVERSIGHT', 'UPDATE'), deleteAttachmentHandler);
router.get('/oversight/plagiarism', requirePermission('OVERSIGHT', 'READ'), getPlagiarismAlertsHandler);
router.get('/oversight/submissions', requirePermission('OVERSIGHT', 'READ'), getSubmissionsMapHandler);

// System Settings
import {
  getConfigHandler,
  updateConfigHandler,
  getAuditLogsHandler,
  getSessionsHandler,
  terminateSessionHandler,
  getBackupsHandler,
  createBackupHandler,
  restoreBackupHandler
} from '../../controllers/admin/settings.controller.js';
import { getQuizMetadataHandler } from '../../controllers/admin/quiz.controller.js';
router.get('/settings/config', requirePermission('SETTINGS', 'READ'), getConfigHandler);
router.get('/settings/audit', requirePermission('SETTINGS', 'READ'), getAuditLogsHandler);
router.put('/settings/config', requirePermission('SETTINGS', 'UPDATE'), validateRequest({ body: updateConfigSchema, mode: 'enforce' }), updateConfigHandler);
router.get('/settings/sessions', requirePermission('SETTINGS', 'READ'), getSessionsHandler);
router.delete('/settings/sessions/:id', requirePermission('SETTINGS', 'UPDATE'), validateRequest({ params: settingsParamsSchema, mode: 'enforce' }), terminateSessionHandler);
router.get('/settings/backups', requirePermission('SETTINGS', 'READ'), getBackupsHandler);
router.post('/settings/backups', requirePermission('SETTINGS', 'UPDATE'), createBackupHandler);
router.post('/settings/backups/restore', requirePermission('SETTINGS', 'UPDATE'), validateRequest({ body: restoreBackupSchema, mode: 'enforce' }), restoreBackupHandler);
router.get('/quizzes/metadata', requirePermission('QUIZZES', 'READ'), getQuizMetadataHandler);

// Finance Management
import {
  getPayrollsHandler,
  getPayrollByIdHandler,
  getFinanceReportsHandler,
  getFeePlansHandler,
  createFeePlanHandler,
  getInvoicesHandler,
  generateInvoiceHandler,
  getPaymentsHandler,
  recordPaymentHandler,
  downloadFinanceReportHandler
} from '../../controllers/admin/financeController.js';

router.get('/finance/payroll', requirePermission('FINANCE', 'READ'), getPayrollsHandler);
router.get('/finance/payroll/:id', requirePermission('FINANCE', 'READ'), getPayrollByIdHandler);
router.get('/finance/reports/download/:type', requirePermission('FINANCE', 'READ'), downloadFinanceReportHandler);
router.get('/finance/reports', requirePermission('FINANCE', 'READ'), getFinanceReportsHandler);
router.get('/finance/fees', requirePermission('FINANCE', 'READ'), getFeePlansHandler);
router.post('/finance/fees', requirePermission('FINANCE', 'UPDATE'), validateRequest({ body: createFeePlanSchema, mode: 'enforce' }), createFeePlanHandler);
router.get('/finance/invoices', requirePermission('FINANCE', 'READ'), getInvoicesHandler);
router.post('/finance/invoices/generate', requirePermission('FINANCE', 'UPDATE'), validateRequest({ body: generateInvoiceSchema, mode: 'enforce' }), generateInvoiceHandler);
router.get('/finance/payments', requirePermission('FINANCE', 'READ'), getPaymentsHandler);
router.post('/finance/payments/record', requirePermission('FINANCE', 'UPDATE'), validateRequest({ body: recordPaymentSchema, mode: 'enforce' }), recordPaymentHandler);

// Faculty Oversight
import {
  getFacultyDirectory,
  getTeachingLoads,
  overrideTeachingLoad,
  reassignTeachingLoadCourse,
  escalateTeachingLoad,
  getLeaves,
  overrideLeave,
  getActivityReports,
  overrideActivityReport,
  getAttendanceAudit,
  getWorkloadAnalytics,
  getFacultyHistory
} from '../../controllers/admin/facultyOversight.controller.js';

router.get('/faculty/directory', requirePermission('USERS', 'READ'), getFacultyDirectory);
router.get('/faculty/teaching-loads', requirePermission('FACULTY_OVERSIGHT', 'READ'), getTeachingLoads);
router.patch('/faculty/teaching-loads/:id/override', requirePermission('FACULTY_OVERSIGHT', 'UPDATE'), validateRequest({ body: overrideTeachingLoadSchema, params: facultyOversightParamsSchema, mode: 'enforce' }), overrideTeachingLoad);
router.patch('/faculty/teaching-loads/:id/reassign', requirePermission('FACULTY_OVERSIGHT', 'UPDATE'), validateRequest({ body: reassignTeachingLoadCourseSchema, params: facultyOversightParamsSchema, mode: 'enforce' }), reassignTeachingLoadCourse);
router.patch('/faculty/teaching-loads/:id/escalate', requirePermission('FACULTY_OVERSIGHT', 'UPDATE'), validateRequest({ params: facultyOversightParamsSchema, mode: 'enforce' }), escalateTeachingLoad);
router.get('/faculty/leaves', requirePermission('FACULTY_OVERSIGHT', 'READ'), getLeaves);
router.patch('/faculty/leaves/:id/override', requirePermission('FACULTY_OVERSIGHT', 'UPDATE'), validateRequest({ body: overrideLeaveSchema, params: facultyOversightParamsSchema, mode: 'enforce' }), overrideLeave);
router.get('/faculty/activity-reports', requirePermission('FACULTY_OVERSIGHT', 'READ'), getActivityReports);
router.patch('/faculty/activity-reports/:id/override', requirePermission('FACULTY_OVERSIGHT', 'UPDATE'), validateRequest({ body: overrideActivityReportSchema, params: facultyOversightParamsSchema, mode: 'enforce' }), overrideActivityReport);
router.get('/faculty/attendance-audit', requirePermission('FACULTY_OVERSIGHT', 'READ'), getAttendanceAudit);
router.get('/faculty/workload-analytics', requirePermission('FACULTY_OVERSIGHT', 'READ'), getWorkloadAnalytics);
router.get('/faculty/history/:facultyId', requirePermission('FACULTY_OVERSIGHT', 'READ'), getFacultyHistory);

// Student Oversight
import {
  getStudentDirectory,
  getEnrollmentRequests,
  overrideEnrollmentRequest,
  getAcademicProgress,
  getPromotionAndGraduation,
  getAttendanceAnalytics,
  getAtRiskStudents,
  getScholarships,
  getStudentTimeline
} from '../../controllers/admin/studentOversight.controller.js';

router.get('/student/directory', requirePermission('USERS', 'READ'), getStudentDirectory);
router.get('/student/enrollments', requirePermission('STUDENT_OVERSIGHT', 'READ'), getEnrollmentRequests);
router.patch('/student/enrollments/:id/override', requirePermission('STUDENT_OVERSIGHT', 'UPDATE'), validateRequest({ body: overrideEnrollmentRequestSchema, mode: 'enforce' }), overrideEnrollmentRequest);
router.get('/student/progress', requirePermission('STUDENT_OVERSIGHT', 'READ'), getAcademicProgress);
router.get('/student/promotion', requirePermission('STUDENT_OVERSIGHT', 'READ'), getPromotionAndGraduation);
router.get('/student/attendance-analytics', requirePermission('STUDENT_OVERSIGHT', 'READ'), getAttendanceAnalytics);
router.get('/student/at-risk', requirePermission('STUDENT_OVERSIGHT', 'READ'), getAtRiskStudents);
router.get('/student/scholarships', requirePermission('STUDENT_OVERSIGHT', 'READ'), getScholarships);
router.get('/student/timeline/:studentId', requirePermission('STUDENT_OVERSIGHT', 'READ'), getStudentTimeline);

// Examination Oversight
import {
  getExamSchedules,
  createExamSchedule,
  deleteExamSchedule,
  getVerificationRoster,
  getAssessmentMarks,
  lockAssessmentMarksHandler,
  publishCourseGradesHandler,
  getPublishedResultsHandler,
  getStudentTranscript,
  getPromotionRecommendationsHandler,
  executePromotionHandler,
  getDegreeAudits,
  reevaluateDegreeAudits,
  getExaminationStats
} from '../../controllers/admin/examination.controller.js';
import { createExamScheduleSchema, executePromotionSchema, examParamsSchema, promoteParamsSchema } from '../../validators/admin/examination.validator.js';

router.get('/examination/schedules', requirePermission('EXAMINATION', 'READ'), getExamSchedules);
router.post('/examination/schedules', requirePermission('EXAMINATION', 'UPDATE'), validateRequest({ body: createExamScheduleSchema, mode: 'enforce' }), createExamSchedule);
router.delete('/examination/schedules/:id', requirePermission('EXAMINATION', 'UPDATE'), validateRequest({ params: examParamsSchema, mode: 'enforce' }), deleteExamSchedule);
router.get('/examination/verification-roster', requirePermission('EXAMINATION', 'READ'), getVerificationRoster);
router.get('/examination/assessment-marks/:id', requirePermission('EXAMINATION', 'READ'), validateRequest({ params: examParamsSchema, mode: 'enforce' }), getAssessmentMarks);
router.patch('/examination/assessment-marks/:id/lock', requirePermission('EXAMINATION', 'UPDATE'), validateRequest({ params: examParamsSchema, mode: 'enforce' }), lockAssessmentMarksHandler);
router.patch('/examination/course-grades/:id/publish', requirePermission('EXAMINATION', 'UPDATE'), validateRequest({ params: examParamsSchema, mode: 'enforce' }), publishCourseGradesHandler);
router.get('/examination/published-results', requirePermission('EXAMINATION', 'READ'), getPublishedResultsHandler);
router.get('/examination/transcripts/:studentId', requirePermission('EXAMINATION', 'READ'), validateRequest({ params: promoteParamsSchema, mode: 'enforce' }), getStudentTranscript);
router.get('/examination/degree-audits', requirePermission('EXAMINATION', 'READ'), getDegreeAudits);
router.post('/examination/degree-audits/reevaluate', requirePermission('EXAMINATION', 'UPDATE'), validateRequest({ mode: 'enforce' }), reevaluateDegreeAudits);
router.get('/examination/promotion-recommendations', requirePermission('EXAMINATION', 'READ'), getPromotionRecommendationsHandler);
router.post('/examination/promote/:studentId', requirePermission('EXAMINATION', 'UPDATE'), validateRequest({ body: executePromotionSchema, params: promoteParamsSchema, mode: 'enforce' }), executePromotionHandler);
router.get('/examination/stats', requirePermission('EXAMINATION', 'READ'), getExaminationStats);

export default router;
