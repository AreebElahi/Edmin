import express from 'express';
import { authenticate } from '../middlewares/authMiddleware.js';
import { requirePermission } from '../middlewares/rbac.js';
import * as attendanceController from '../controllers/attendanceController.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { markAttendanceSchema, attendanceParamsSchema } from '../validators/attendance.validator.js';

const router = express.Router();

router.use(authenticate);

// Student Endpoint
router.get('/student', requirePermission('ATTENDANCE', 'VIEW_OWN'), attendanceController.getStudentAttendance);

// Faculty & Admins
router.get('/faculty/sessions', requirePermission('ATTENDANCE', 'VIEW_SESSIONS'), attendanceController.getFacultySessions);
router.get('/sessions/:sessionId/roster', requirePermission('ATTENDANCE', 'VIEW_ROSTER'), attendanceController.getClassSessionRoster);
router.post('/sessions/:sessionId/mark', requirePermission('ATTENDANCE', 'MARK'), validateRequest({ body: markAttendanceSchema, params: attendanceParamsSchema, mode: 'enforce' }), attendanceController.bulkMarkAttendanceHandler);

export default router;
