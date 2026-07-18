import express from 'express';
import { authenticate } from '../../middlewares/authMiddleware.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import * as complaintController from './complaint.controller.js';
import { createComplaintSchema, updateComplaintStatusSchema, sendComplaintMessageSchema } from './complaint.validator.js';
import { requireCache } from '../../middlewares/cache.middleware.js';

const router = express.Router();

router.use(authenticate);

router.post('/', validateRequest({ body: createComplaintSchema, mode: 'enforce' }), complaintController.createComplaint);
router.get('/', requireCache(300), complaintController.getComplaints);
router.get('/:id', requireCache(300), complaintController.getComplaintById);
router.patch('/:id/status', validateRequest({ body: updateComplaintStatusSchema, mode: 'enforce' }), complaintController.updateComplaintStatus);
router.patch('/:id/assign', complaintController.assignComplaint);
router.post('/:id/messages', validateRequest({ body: sendComplaintMessageSchema, mode: 'enforce' }), complaintController.sendComplaintMessage);

export default router;
