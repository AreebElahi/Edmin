import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware.js';
import * as activityReportController from '../controllers/activityReportController.js';
import { createReportSchema } from '../validators/activityReport.validator.js';
import { validateRequest } from '../middlewares/validateRequest.js';

const router = Router();

router.use(authenticate);

import { requireDepartmentRole } from '../middlewares/requireDepartmentRole.js';

router.post('/', validateRequest({ body: createReportSchema, mode: 'enforce' }), activityReportController.createReport);
router.get('/', activityReportController.getReports);
router.patch('/:id/approve', requireDepartmentRole('ANY_LEADER'), activityReportController.approveReport);
router.patch('/:id/reject', requireDepartmentRole('ANY_LEADER'), activityReportController.rejectReport);

export default router;
