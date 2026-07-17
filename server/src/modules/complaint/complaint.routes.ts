import express from 'express';
import { authenticate } from '../../middlewares/authMiddleware.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import * as complaintController from './complaint.controller.js';
import { createComplaintSchema, updateComplaintStatusSchema, sendComplaintMessageSchema } from './complaint.validator.js';

const router = express.Router();

router.use(authenticate);

router.post('/', validateRequest({ body: createComplaintSchema, mode: 'enforce' }), complaintController.createComplaint);
router.get('/', complaintController.getComplaints);
router.get('/:id', complaintController.getComplaintById);
router.patch('/:id/status', validateRequest({ body: updateComplaintStatusSchema, mode: 'enforce' }), complaintController.updateComplaintStatus);
router.patch('/:id/assign', complaintController.assignComplaint);
router.post('/:id/messages', validateRequest({ body: sendComplaintMessageSchema, mode: 'enforce' }), complaintController.sendComplaintMessage);

export default router;
