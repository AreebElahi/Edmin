import { Router } from 'express';
import * as supervisorController from '../controllers/supervisorController.js';
import { requireDepartmentRole } from '../middlewares/requireDepartmentRole.js';

const router = Router();

// Apply SUPERVISOR role check to all routes in this namespace
router.use(requireDepartmentRole('SUPERVISOR'));

router.patch('/teaching-loads/:id/approve', supervisorController.approveTeachingLoad);
router.patch('/teaching-loads/:id/reject', supervisorController.rejectTeachingLoad);

router.patch('/enrollment/:id/approve', supervisorController.approveEnrollment);
router.patch('/enrollment/:id/reject', supervisorController.rejectEnrollment);

router.patch('/activity-reports/:id/approve', supervisorController.approveReport);
router.patch('/activity-reports/:id/reject', supervisorController.rejectReport);

router.post('/leaves/:id/comment', supervisorController.commentLeave);

export default router;
