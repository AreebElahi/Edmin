import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../contracts/api.contracts.js';
import * as AttendanceService from '../../services/student/attendance.service.js';
import { redisConnection } from '../../config/redis.js';

export const getAttendanceSummaryHandler = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId || (req as any).user.id;
    const cacheKey = `api:student:attendance:${userId}`;

    if (redisConnection && redisConnection.status === 'ready') {
      const cached = await redisConnection.get(cacheKey);
      if (cached) {
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).send(cached);
      }
    }

    const summary = await AttendanceService.getAttendanceSummary(userId);
    const fullResponse = { success: true, data: summary };

    if (redisConnection && redisConnection.status === 'ready') {
      await redisConnection.setex(cacheKey, 180, JSON.stringify(fullResponse));
    }

    return res.status(200).json(fullResponse);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return sendError(res, error.message, 'ATTENDANCE_ERROR', statusCode);
  }
};

export const getAttendanceDetailHandler = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId || (req as any).user.id;
    const courseOfferingId = parseInt(req.params.courseOfferingId as string, 10);
    
    if (isNaN(courseOfferingId)) {
      return sendError(res, 'Invalid courseOfferingId', 'VALIDATION_FAILED', 400);
    }

    const cacheKey = `api:student:attendance:${courseOfferingId}:${userId}`;
    if (redisConnection && redisConnection.status === 'ready') {
      const cached = await redisConnection.get(cacheKey);
      if (cached) {
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).send(cached);
      }
    }

    const detail = await AttendanceService.getAttendanceDetail(userId, courseOfferingId);
    const fullResponse = { success: true, data: detail };

    if (redisConnection && redisConnection.status === 'ready') {
      await redisConnection.setex(cacheKey, 180, JSON.stringify(fullResponse));
    }

    return res.status(200).json(fullResponse);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return sendError(res, error.message, 'ATTENDANCE_ERROR', statusCode);
  }
};
