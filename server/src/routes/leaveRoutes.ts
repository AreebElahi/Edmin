import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware.js';
import * as leaveController from '../controllers/leaveController.js';
import { createLeaveSchema, commentLeaveSchema } from '../validators/leave.validator.js';
import { validateRequest } from '../middlewares/validateRequest.js';

const router = Router();

router.use(authenticate);

import { requireRoles } from '../middlewares/requireRoles.js';

router.post('/', validateRequest({ body: createLeaveSchema, mode: 'enforce' }), leaveController.createLeave);
router.get('/', leaveController.getLeaves);
router.post('/:id/comment', validateRequest({ body: commentLeaveSchema, mode: 'enforce' }), leaveController.commentLeave);
router.patch('/:id/approve', requireRoles(['HR', 'ADMIN']), leaveController.approveLeave);
router.patch('/:id/reject', requireRoles(['HR', 'ADMIN']), leaveController.rejectLeave);

export default router;
