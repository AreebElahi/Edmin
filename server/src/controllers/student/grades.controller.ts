import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../contracts/api.contracts.js';
import * as GradesService from '../../services/student/grades.service.js';
import { redisConnection } from '../../config/redis.js';

export const getGradesHandler = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId || (req as any).user.id;
    const grades = await GradesService.getGrades(userId);
    const fullResponse = { success: true, data: grades };

    return res.status(200).json(fullResponse);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return sendError(res, error.message, 'GRADES_ERROR', statusCode);
  }
};
