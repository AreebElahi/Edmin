import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync.js';
import { sendSuccess, sendError } from '../contracts/api.contracts.js';
import * as teachingLoadWorkflow from '../services/workflows/teachingLoadWorkflow.service.js';
import { redisConnection } from '../config/redis.js';

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

  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.del(`api:teaching_loads:${facultyUserId}:FACULTY`);
  }

  return sendSuccess(res, load, 201);
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

  return res.status(200).json(fullResponse);
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

  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.del(`api:teaching_loads:${approverUserId}:${approverRole}`);
  }

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

  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.del(`api:teaching_loads:${approverUserId}:${approverRole}`);
  }

  return sendSuccess(res, load);
});
