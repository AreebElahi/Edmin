import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware.js';
import { requireDepartmentRole } from '../middlewares/requireDepartmentRole.js';
import * as teachingLoadController from '../controllers/teachingLoadController.js';
import { createTeachingLoadSchema } from '../validators/teachingLoad.validator.js';
import { validateRequest } from '../middlewares/validateRequest.js';

const router = Router();

router.use(authenticate);

router.post('/', validateRequest({ body: createTeachingLoadSchema, mode: 'enforce' }), teachingLoadController.createTeachingLoad);
router.get('/', teachingLoadController.getTeachingLoads);
router.patch('/:id/approve', requireDepartmentRole('HOD'), teachingLoadController.approveTeachingLoad);
router.patch('/:id/reject', requireDepartmentRole('HOD'), teachingLoadController.rejectTeachingLoad);

export default router;
