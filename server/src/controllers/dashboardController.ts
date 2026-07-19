import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync.js';
import * as dashboardService from '../services/dashboardService.js';

import { redisConnection, acquireLock, releaseLock } from '../config/redis.js';

export const getStudentDashboard = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId; // Provided by authenticate middleware
  const cacheKey = `api:dashboard:student:${userId}`;

  if (redisConnection && redisConnection.status === 'ready') {
    const cached = await redisConnection.get(cacheKey);
    if (cached) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).send(cached);
    }
  }

  const data = await dashboardService.getStudentDashboardData(userId);

  const fullResponse = { success: true, data };

  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.setex(cacheKey, 3600, JSON.stringify(fullResponse)); // cache for 1 hour
  }

  res.status(200).json(fullResponse);
});

export const getFacultyDashboard = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId;
  const cacheKey = `api:dashboard:faculty:${userId}`;

  if (redisConnection && redisConnection.status === 'ready') {
    const cached = await redisConnection.get(cacheKey);
    if (cached) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).send(cached);
    }
  }

  const data = await dashboardService.getFacultyDashboardData(userId);
  const fullResponse = { success: true, data };

  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.setex(cacheKey, 900, JSON.stringify(fullResponse)); // cache for 15 mins
  }

  res.status(200).json(fullResponse);
});

export const getAdminDashboard = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId;
  const cacheKey = `api:dashboard:admin:${userId}`;

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
      const data = await dashboardService.getAdminDashboardData(userId);
      const fullResponse = { success: true, data };

      if (redisConnection && redisConnection.status === 'ready') {
        const serialized = JSON.stringify(fullResponse);
        await redisConnection.setex(cacheKey, 30, serialized); // Micro-cache for 30 seconds
        await releaseLock(cacheKey);
      }

      return res.status(200).json(fullResponse);
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
    // Fallback if lock holder failed or timed out
    const data = await dashboardService.getAdminDashboardData(userId);
    return res.status(200).json({ success: true, data });
  }
});

export const getHrDashboardSummary = catchAsync(async (req: Request, res: Response) => {
  const data = await dashboardService.getHrDashboardSummary(req.user.userId);
  res.status(200).json({ success: true, data });
});

export const getHrLeavesToday = catchAsync(async (req: Request, res: Response) => {
  const data = await dashboardService.getHrLeavesToday();
  res.status(200).json({ success: true, data });
});

export const getHrCompliance = catchAsync(async (req: Request, res: Response) => {
  const data = await dashboardService.getHrCompliance();
  res.status(200).json({ success: true, data });
});

export const getHrApprovalsPending = catchAsync(async (req: Request, res: Response) => {
  const data = await dashboardService.getHrApprovalsPending();
  res.status(200).json({ success: true, data });
});
