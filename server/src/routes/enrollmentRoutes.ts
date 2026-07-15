import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware.js';
import { requireDepartmentRole } from '../middlewares/requireDepartmentRole.js';
import * as enrollmentController from '../controllers/enrollmentController.js';
import { createEnrollmentSchema } from '../validators/enrollment.validator.js';
import { validateRequest } from '../middlewares/validateRequest.js';

const router = Router();

router.use(authenticate);

router.post('/', validateRequest({ body: createEnrollmentSchema, mode: 'enforce' }), enrollmentController.createEnrollment);
router.get('/', enrollmentController.getEnrollments);
router.patch('/:id/approve', requireDepartmentRole('SUPERVISOR'), enrollmentController.approveEnrollment);
router.patch('/:id/reject', requireDepartmentRole('SUPERVISOR'), enrollmentController.rejectEnrollment);

export default router;
