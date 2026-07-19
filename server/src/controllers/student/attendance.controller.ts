import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../contracts/api.contracts.js';
import * as AttendanceService from '../../services/student/attendance.service.js';
import { getCachedResponse, setCachedResponse } from "../../config/redis.js";

export const getAttendanceSummaryHandler = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId || (req as any).user.id;
    const summary = await AttendanceService.getAttendanceSummary(userId);
    const fullResponse = { success: true, data: summary };

    return sendSuccess(res, (fullResponse as any).data || fullResponse, undefined, undefined, 200);
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

    const detail = await AttendanceService.getAttendanceDetail(userId, courseOfferingId);
    const fullResponse = { success: true, data: detail };

    return sendSuccess(res, (fullResponse as any).data || fullResponse, undefined, undefined, 200);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return sendError(res, error.message, 'ATTENDANCE_ERROR', statusCode);
  }
};
