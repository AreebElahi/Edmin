import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware.js';
import * as leaveController from '../controllers/leaveController.js';
import { createLeaveSchema, commentLeaveSchema } from '../validators/leave.validator.js';
import { validateRequest } from '../middlewares/validateRequest.js';

const router = Router();

router.use(authenticate);

import { requireRoles } from '../middlewares/requireRoles.js';
import { requireDepartmentRole } from '../middlewares/requireDepartmentRole.js';

const approveRejectAuth = (req: any, res: any, next: any) => {
  if (req.user?.role === 'HR' || req.user?.role === 'ADMIN' || req.user?.role === 'SYSTEM_ADMIN') {
    return next();
  }
  return requireDepartmentRole('HOD')(req, res, next);
};

router.post('/', validateRequest({ body: createLeaveSchema, mode: 'enforce' }), leaveController.createLeave);
router.get('/', leaveController.getLeaves);
router.post('/:id/comment', validateRequest({ body: commentLeaveSchema, mode: 'enforce' }), leaveController.commentLeave);
router.patch('/:id/approve', approveRejectAuth, leaveController.approveLeave);
router.patch('/:id/reject', approveRejectAuth, leaveController.rejectLeave);

export default router;
