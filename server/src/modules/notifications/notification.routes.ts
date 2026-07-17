import { Router } from 'express';
import { getNotifications, markAllAsRead, markAsRead } from './notification.controller.js';
import { authenticate } from '../../middlewares/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/', getNotifications);
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', markAsRead);

export default router;
