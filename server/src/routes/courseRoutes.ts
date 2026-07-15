import express from 'express';
import * as courseController from '../controllers/courseController.js';
import * as enrollmentController from '../controllers/enrollmentController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { requirePermission } from '../middlewares/rbac.js';
import { createCourseOfferingSchema } from '../validators/course.validator.js';
import { enrollStudentDirectlySchema } from '../validators/enrollment.validator.js';
import { validateRequest } from '../middlewares/validateRequest.js';

const router = express.Router();

router.use(authenticate);

// Publicly available to authenticated users
router.get('/', courseController.getAllCourses);
router.get('/offerings', courseController.getAllCourseOfferings);

// Admin / System Admin only
router.post('/offerings', requirePermission('COURSES', 'CREATE_OFFERING'), validateRequest({ body: createCourseOfferingSchema, mode: 'enforce' }), courseController.createCourseOffering);

// Students can enroll themselves, Admins can enroll anyone
router.post('/enroll', requirePermission('COURSES', 'ENROLL'), validateRequest({ body: enrollStudentDirectlySchema, mode: 'enforce' }), enrollmentController.enrollStudentDirectly);

export default router;
