import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync.js';
import * as notificationService from '../services/notification/notification.service.js';

import { redisConnection } from '../config/redis.js';

export const getNotifications = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId || (req as any).user?.id;
  if (!userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
  const cacheKey = `api:notifications:${userId}:${limit}`;

  if (redisConnection && redisConnection.status === 'ready') {
    const cached = await redisConnection.get(cacheKey);
    if (cached) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).send(cached);
    }
  }

  const notifications = await notificationService.getUserNotifications(userId, limit);

  const fullResponse = { success: true, data: notifications };

  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.setex(cacheKey, 3600, JSON.stringify(fullResponse)); // cache for 1 hour
  }

  res.status(200).json(fullResponse);
});

export const readNotification = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    res.status(400).json({ success: false, error: 'Notification ID is required' });
    return;
  }
  await notificationService.markNotificationRead(parseInt(id as string, 10));
  res.status(200).json({ success: true, data: { message: 'Notification marked as read' } });
});

export const readAllNotifications = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId || (req as any).user?.id;
  if (!userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }
  await notificationService.markAllNotificationsRead(userId);
  res.status(200).json({ success: true, data: { message: 'All notifications marked as read' } });
});
