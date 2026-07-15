import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../contracts/api.contracts.js';
import * as ScheduleService from '../../services/student/schedule.service.js';
import { redisConnection } from '../../config/redis.js';
export const getScheduleHandler = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId || (req as any).user.id;
    const cacheKey = `api:student:schedule:${userId}`;

    if (redisConnection && redisConnection.status === 'ready') {
      const cached = await redisConnection.get(cacheKey);
      if (cached) {
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).send(cached);
      }
    }

    const schedule = await ScheduleService.getSchedule(userId);
    const fullResponse = { success: true, data: schedule };

    if (redisConnection && redisConnection.status === 'ready') {
      await redisConnection.setex(cacheKey, 3600, JSON.stringify(fullResponse)); // cache for 1 hour
    }

    return res.status(200).json(fullResponse);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return sendError(res, error.message, 'SCHEDULE_ERROR', statusCode);
  }
};
