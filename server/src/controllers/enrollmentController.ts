import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync.js';
import { sendSuccess, sendError } from '../contracts/api.contracts.js';
import * as enrollmentService from '../services/enrollment.service.js';
import { getCachedResponse, setCachedResponse, redisConnection } from "../config/redis.js";

const clearEnrollmentCache = async () => {
    if (redisConnection && redisConnection.status === 'ready') {
        try {
            const keys = [
                ...(await redisConnection.keys('api:student:enrollment:*')),
                ...(await redisConnection.keys('api:enrollments:*')),
                ...(await redisConnection.keys('user:profile:*:faculty:hod:students')),
                ...(await redisConnection.keys('user:profile:*:faculty:supervisor:students'))
            ];
            if (keys.length > 0) {
                await redisConnection.del(...keys);
            }
        } catch (e) {
            console.error('[Redis Cache] Failed to clear enrollment cache', e);
        }
    }
};

export const getAvailableOfferings = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId;
  const cacheKey = `api:student:enrollment:available:${userId}`;

  if (redisConnection && redisConnection.status === 'ready') {
    const cached = await redisConnection.get(cacheKey);
    if (cached) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).send(cached);
    }
  }

  const offerings = await enrollmentService.getAvailableOfferings(userId);
  const fullResponse = { success: true, data: offerings };

  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.setex(cacheKey, 3600, JSON.stringify(fullResponse));
  }

  return sendSuccess(res, (fullResponse as any).data || fullResponse, undefined, undefined, 200);
});

export const getMyEnrollmentRequests = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId;
  const cacheKey = `api:student:enrollment:mine:${userId}`;

  if (redisConnection && redisConnection.status === 'ready') {
    const cached = await redisConnection.get(cacheKey);
    if (cached) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).send(cached);
    }
  }

  const requests = await enrollmentService.getMyEnrollmentRequests(userId);
  const fullResponse = { success: true, data: requests };

  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.setex(cacheKey, 3600, JSON.stringify(fullResponse));
  }

  return sendSuccess(res, (fullResponse as any).data || fullResponse, undefined, undefined, 200);
});

export const createEnrollment = catchAsync(async (req: Request, res: Response) => {
  const { courseOfferingId } = req.body;
  const studentUserId = req.user.userId;

  if (!courseOfferingId) {
    return sendError(res, 'Course offering ID is required', 'BAD_REQUEST', 400);
  }

  const request = await enrollmentService.submitEnrollmentRequest(
    studentUserId,
    Number(courseOfferingId)
  );

  await clearEnrollmentCache();

  return sendSuccess(res, request, 'Operation completed successfully.', undefined, 201);
});

export const getEnrollments = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId;
  const role = req.user.role;
  const cacheKey = `api:enrollments:${userId}:${role}`;

  if (redisConnection && redisConnection.status === 'ready') {
    const cached = await redisConnection.get(cacheKey);
    if (cached) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).send(cached);
    }
  }

  const enrollments = await enrollmentService.getEnrollmentRequests(userId, role);
  const fullResponse = { success: true, data: enrollments };

  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.setex(cacheKey, 180, JSON.stringify(fullResponse));
  }

  return sendSuccess(res, (fullResponse as any).data || fullResponse, undefined, undefined, 200);
});

export const approveEnrollment = catchAsync(async (req: Request, res: Response) => {
  const requestId = Number(req.params.id);
  const { comment } = req.body;
  const approverUserId = req.user.userId;

  const request = await enrollmentService.approveEnrollmentRequest(
    requestId,
    approverUserId,
    comment
  );

  await clearEnrollmentCache();

  return sendSuccess(res, request);
});

export const rejectEnrollment = catchAsync(async (req: Request, res: Response) => {
  const requestId = Number(req.params.id);
  const { comment } = req.body;
  const approverUserId = req.user.userId;

  if (!comment) {
    return sendError(res, 'Rejection comment is required', 'BAD_REQUEST', 400);
  }

  const request = await enrollmentService.rejectEnrollmentRequest(
    requestId,
    approverUserId,
    comment
  );

  await clearEnrollmentCache();

  return sendSuccess(res, request);
});

export const enrollStudentDirectly = catchAsync(async (req: Request, res: Response) => {
  const { studentId, courseOfferingId } = req.body;
  const userId = req.user.userId;

  // If a student is enrolling themselves, verify they are using their own student record
  if (req.user.role === 'STUDENT') {
    try {
      await enrollmentService.validateStudentOwnership(userId, studentId);
    } catch (error: any) {
      return sendError(res, error.message, 'FORBIDDEN', 403);
    }
  }

  const enrollment = await enrollmentService.enrollStudentDirectly(studentId, courseOfferingId);
  
  await clearEnrollmentCache();

  sendSuccess(res, { success: true, enrollment }, undefined, undefined, 201);
});
