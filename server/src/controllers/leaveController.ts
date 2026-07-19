import { redisConnection } from '../config/redis.js';
import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync.js';
import { sendSuccess, sendError } from '../contracts/api.contracts.js';
import * as leaveWorkflow from '../services/workflows/leaveWorkflow.service.js';
import { getCachedResponse, setCachedResponse } from "../config/redis.js";

export const createLeave = catchAsync(async (req: Request, res: Response) => {
  const { startDate, endDate, leaveType, reason } = req.body;
  const userId = req.user.userId;

  if (!startDate || !endDate || !leaveType || !reason) {
    return sendError(res, 'Missing required parameters', 'BAD_REQUEST', 400);
  }

  const leave = await leaveWorkflow.createLeaveRequest(
    userId,
    new Date(startDate),
    new Date(endDate),
    leaveType,
    reason
  );

  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.del(`api:leaves:${userId}:${req.user.role}`);
  }

  return sendSuccess(res, leave, 'Operation completed successfully.', undefined, 201);
});

export const getLeaves = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId;
  const role = req.user.role;
  const cacheKey = `api:leaves:${userId}:${role}`;

  if (redisConnection && redisConnection.status === 'ready') {
    const cached = await redisConnection.get(cacheKey);
    if (cached) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).send(cached);
    }
  }

  const leaves = await leaveWorkflow.getLeaveRequests(userId, role);
  const fullResponse = { success: true, data: leaves };

  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.setex(cacheKey, 180, JSON.stringify(fullResponse));
  }

  return sendSuccess(res, (fullResponse as any).data || fullResponse, undefined, undefined, 200);
});

export const commentLeave = catchAsync(async (req: Request, res: Response) => {
  const leaveRequestId = Number(req.params.id);
  const { comment } = req.body;
  const commenterId = req.user.userId;
  const role = req.user.role;

  if (!comment) {
    return sendError(res, 'Comment text is required', 'BAD_REQUEST', 400);
  }

  const commentRecord = await leaveWorkflow.commentOnLeaveRequest(
    leaveRequestId,
    commenterId,
    comment,
    role
  );

  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.del(`api:leaves:${commenterId}:${role}`);
  }

  return sendSuccess(res, commentRecord, 'Operation completed successfully.', undefined, 201);
});

export const approveLeave = catchAsync(async (req: Request, res: Response) => {
  const leaveRequestId = Number(req.params.id);
  const { comment } = req.body;
  const hrUserId = req.user.userId;

  const leave = await leaveWorkflow.approveLeaveRequest(leaveRequestId, hrUserId, comment);
  
  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.del(`api:leaves:${hrUserId}:${req.user.role}`);
  }

  return sendSuccess(res, leave);
});

export const rejectLeave = catchAsync(async (req: Request, res: Response) => {
  const leaveRequestId = Number(req.params.id);
  const { comment } = req.body;
  const hrUserId = req.user.userId;

  if (!comment) {
    return sendError(res, 'Rejection comment is required', 'BAD_REQUEST', 400);
  }

  const leave = await leaveWorkflow.rejectLeaveRequest(leaveRequestId, hrUserId, comment);

  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.del(`api:leaves:${hrUserId}:${req.user.role}`);
  }

  return sendSuccess(res, leave);
});
