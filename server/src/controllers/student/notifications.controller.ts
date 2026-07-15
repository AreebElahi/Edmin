import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../contracts/api.contracts.js';
import * as NotificationsService from '../../services/student/notifications.service.js';

import { redisConnection } from '../../config/redis.js';

export const getNotificationsHandler = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId || (req as any).user.id;
    const cacheKey = `api:student:notifications:${userId}`;
    console.log(`[DEBUG] getNotificationsHandler for user ${userId}. cacheKey=${cacheKey}`);

    if (redisConnection && redisConnection.status === 'ready') {
      const cached = await redisConnection.get(cacheKey);
      console.log(`[DEBUG] Cache hit?`, !!cached);
      if (cached) {
        return sendSuccess(res, JSON.parse(cached), 200);
      }
    }

    const notifications = await NotificationsService.getNotifications(userId);

    if (redisConnection && redisConnection.status === 'ready') {
      await redisConnection.setex(cacheKey, 3600, JSON.stringify(notifications)); // cache for 1 hour
    }

    return sendSuccess(res, notifications, 200);
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
    return sendSuccess(res, updated, 200);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return sendError(res, error.message, 'NOTIFICATIONS_ERROR', statusCode);
  }
};
