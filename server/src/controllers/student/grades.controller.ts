import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../contracts/api.contracts.js';
import * as GradesService from '../../services/student/grades.service.js';
import { getCachedResponse, setCachedResponse } from "../../config/redis.js";

export const getGradesHandler = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId || (req as any).user.id;
    const grades = await GradesService.getGrades(userId);
    const fullResponse = { success: true, data: grades };

    return sendSuccess(res, (fullResponse as any).data || fullResponse, undefined, undefined, 200);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return sendError(res, error.message, 'GRADES_ERROR', statusCode);
  }
};
