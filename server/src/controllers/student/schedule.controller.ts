import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../contracts/api.contracts.js';
import * as ScheduleService from '../../services/student/schedule.service.js';
import { redisConnection } from '../../config/redis.js';
export const getScheduleHandler = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId || (req as any).user.id;
    const schedule = await ScheduleService.getSchedule(userId);
    const fullResponse = { success: true, data: schedule };

    return res.status(200).json(fullResponse);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return sendError(res, error.message, 'SCHEDULE_ERROR', statusCode);
  }
};
