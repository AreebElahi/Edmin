import { Router } from 'express';
import { 
  broadcastAnnouncementHandler, 
  getQueueHandler, 
  cancelScheduledHandler, 
  getHistoryHandler
} from './communications.controller.js';
import { requirePermission } from '../../middlewares/rbac.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { broadcastAnnouncementSchema, communicationsParamsSchema } from '../../validators/admin/communications.validator.js';
import { authenticate } from '../../middlewares/authMiddleware.js';
import { requireCache } from '../../middlewares/cache.middleware.js';

const router = Router();

router.use(authenticate);

router.post(
  '/broadcast', 
  requirePermission('COMMUNICATIONS', 'UPDATE'), 
  validateRequest({ body: broadcastAnnouncementSchema, mode: 'enforce' }), 
  broadcastAnnouncementHandler
);

router.get(
  '/queue', 
  requirePermission('COMMUNICATIONS', 'READ'), 
  requireCache(300),
  getQueueHandler
);

router.delete(
  '/queue/:id', 
  requirePermission('COMMUNICATIONS', 'UPDATE'), 
  validateRequest({ params: communicationsParamsSchema, mode: 'enforce' }), 
  cancelScheduledHandler
);

router.get(
  '/history', 
  requirePermission('COMMUNICATIONS', 'READ'), 
  requireCache(300),
  getHistoryHandler
);

// All authenticated users can view announcements (no admin permission needed)
router.get('/announcements', requireCache(300), getHistoryHandler);

export default router;
