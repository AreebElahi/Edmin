import { redisConnection } from '../config/redis.js';
import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync.js';
import { sendSuccess, sendError } from '../contracts/api.contracts.js';
import * as teachingLoadWorkflow from '../services/workflows/teachingLoadWorkflow.service.js';
import { getCachedResponse, setCachedResponse } from "../config/redis.js";

const clearTeachingLoadCache = async () => {
    if (redisConnection && redisConnection.status === 'ready') {
        try {
            const keys = [
                ...(await redisConnection.keys('user:profile:*:faculty:approvals')),
                ...(await redisConnection.keys('user:profile:*:faculty:teaching-loads')),
                ...(await redisConnection.keys('user:profile:*:faculty:hod:teaching-loads')),
                ...(await redisConnection.keys('user:profile:*:faculty:supervisor:teaching-loads')),
                ...(await redisConnection.keys('api:teaching_loads:*'))
            ];
            if (keys.length > 0) {
                await redisConnection.del(...keys);
            }
        } catch (e) {
            console.error('[Redis Cache] Failed to clear teaching load cache', e);
        }
    }
};

export const createTeachingLoad = catchAsync(async (req: Request, res: Response) => {
  const { semesterId, courseOfferingIds } = req.body;
  const facultyUserId = req.user.userId;

  if (!semesterId || !courseOfferingIds || !Array.isArray(courseOfferingIds)) {
    return sendError(res, 'Semester ID and courseOfferingIds array are required', 'BAD_REQUEST', 400);
  }

  const load = await teachingLoadWorkflow.createTeachingLoad(
    facultyUserId,
    Number(semesterId),
    courseOfferingIds.map(Number)
  );

  await clearTeachingLoadCache();

  return sendSuccess(res, load, 'Operation completed successfully.', undefined, 201);
});

export const getTeachingLoads = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId;
  const role = req.user.role;
  const cacheKey = `api:teaching_loads:${userId}:${role}`;

  if (redisConnection && redisConnection.status === 'ready') {
    const cached = await redisConnection.get(cacheKey);
    if (cached) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).send(cached);
    }
  }

  const loads = await teachingLoadWorkflow.getTeachingLoads(userId, role);
  const fullResponse = { success: true, data: loads };

  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.setex(cacheKey, 180, JSON.stringify(fullResponse));
  }

  return sendSuccess(res, (fullResponse as any).data || fullResponse, undefined, undefined, 200);
});

export const approveTeachingLoad = catchAsync(async (req: Request, res: Response) => {
  const loadId = Number(req.params.id);
  const { comment } = req.body;
  const approverUserId = req.user.userId;
  const approverRole = req.user.role;

  const load = await teachingLoadWorkflow.approveTeachingLoad(
    loadId,
    approverUserId,
    approverRole,
    comment
  );

  await clearTeachingLoadCache();

  return sendSuccess(res, load);
});

export const rejectTeachingLoad = catchAsync(async (req: Request, res: Response) => {
  const loadId = Number(req.params.id);
  const { comment } = req.body;
  const approverUserId = req.user.userId;
  const approverRole = req.user.role;

  if (!comment) {
    return sendError(res, 'Rejection comment is required', 'BAD_REQUEST', 400);
  }

  const load = await teachingLoadWorkflow.rejectTeachingLoad(
    loadId,
    approverUserId,
    approverRole,
    comment
  );

  await clearTeachingLoadCache();

  return sendSuccess(res, load);
});
