import { redisConnection } from '../../config/redis.js';
import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../contracts/api.contracts.js';
import * as NotificationsService from '../../services/student/notifications.service.js';

import { getCachedResponse, setCachedResponse } from "../../config/redis.js";

export const getNotificationsHandler = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId || (req as any).user.id;
    const notifications = await NotificationsService.getNotifications(userId);

    return sendSuccess(res, notifications, 'Operation completed successfully.', undefined, 200);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return sendError(res, error.message, 'NOTIFICATIONS_ERROR', statusCode);
  }
};

export const markAsReadHandler = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId || (req as any).user.id;
    const notificationId = parseInt(req.params.id as string, 10);

    if (isNaN(notificationId)) {
      return sendError(res, 'Invalid notificationId', 'VALIDATION_FAILED', 400);
    }

    const updated = await NotificationsService.markAsRead(userId, notificationId);
    
    if (redisConnection && redisConnection.status === 'ready') {
      await redisConnection.del(`user:profile:${userId}:student:notifications`);
      await redisConnection.del(`user:profile:${userId}:dashboard:student`);
    }
    
    return sendSuccess(res, updated, 'Operation completed successfully.', undefined, 200);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return sendError(res, error.message, 'NOTIFICATIONS_ERROR', statusCode);
  }
};
