import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync.js';
import * as notificationService from '../services/notification/notification.service.js';
import { redisConnection, acquireLock, releaseLock } from '../config/redis.js';
import { sendSuccess, sendError } from "../contracts/api.contracts.js";
import { getCachedResponse, setCachedResponse } from "../config/redis.js";

const invalidateNotificationsCache = async (userId: number) => {
  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.del(`api:notifications:${userId}:20`);
    await redisConnection.del(`api:notifications:${userId}:5`);
  }
};

export const getNotifications = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId || (req as any).user?.id;
  if (!userId) {
    sendError(res, 'Internal error', [], 401);
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

  // Stampede protection: Acquire lock so concurrent requests wait instead of hitting the DB
  let isLeader = false;
  if (redisConnection && redisConnection.status === 'ready') {
    isLeader = await acquireLock(cacheKey, 5); // 5 seconds lock
  } else {
    isLeader = true;
  }

  if (isLeader) {
    try {
      const notifications = await notificationService.getUserNotifications(userId, limit);
      const fullResponse = { success: true, data: notifications };

      if (redisConnection && redisConnection.status === 'ready') {
        const serialized = JSON.stringify(fullResponse);
        await redisConnection.setex(cacheKey, 3600, serialized); // Cache for 1 hour
        await releaseLock(cacheKey);
      }

      return sendSuccess(res, (fullResponse as any).data || fullResponse, undefined, undefined, 200);
    } catch (error) {
      if (redisConnection && redisConnection.status === 'ready') {
        await releaseLock(cacheKey);
      }
      throw error;
    }
  } else {
    // If not the leader, poll Redis for the cached value (up to 10 attempts, 100ms intervals)
    for (let attempt = 0; attempt < 10; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      const cached = await redisConnection!.get(cacheKey);
      if (cached) {
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).send(cached);
      }
    }
    // Fallback if leader failed
    const notifications = await notificationService.getUserNotifications(userId, limit);
    return sendSuccess(res, notifications, undefined, undefined, 200);
  }
});

export const readNotification = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId || (req as any).user?.id;
  const { id } = req.params;
  if (!id) {
    sendError(res, 'Internal error', [], 400);
    return;
  }
  await notificationService.markNotificationRead(parseInt(id as string, 10));
  if (userId) {
    await invalidateNotificationsCache(userId);
  }
  sendSuccess(res, { message: 'Notification marked as read' }, undefined, undefined, 200);
});

export const readAllNotifications = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId || (req as any).user?.id;
  if (!userId) {
    sendError(res, 'Internal error', [], 401);
    return;
  }
  await notificationService.markAllNotificationsRead(userId);
  await invalidateNotificationsCache(userId);
  sendSuccess(res, { message: 'All notifications marked as read' }, undefined, undefined, 200);
});
