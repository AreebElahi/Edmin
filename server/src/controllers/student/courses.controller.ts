import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../contracts/api.contracts.js';
import * as CoursesService from '../../services/student/courses.service.js';

import { getCachedResponse, setCachedResponse } from "../../config/redis.js";

export const getStudentCoursesHandler = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId || (req as any).user.id;
    const courses = await CoursesService.getEnrolledCourses(userId);
    return sendSuccess(res, courses, 'Operation completed successfully.', undefined, 200);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return sendError(res, error.message, 'COURSES_ERROR', statusCode);
  }
};

export const getStudentCourseDetailHandler = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId || (req as any).user.id;
    const courseOfferingId = parseInt(req.params.courseOfferingId as string);
    
    if (isNaN(courseOfferingId)) {
      return sendError(res, 'Invalid course offering ID', 'INVALID_PARAM', 400);
    }
    
    const details = await CoursesService.getCourseDetail(userId, courseOfferingId);
    return sendSuccess(res, details, 'Operation completed successfully.', undefined, 200);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return sendError(res, error.message, 'COURSES_DETAIL_ERROR', statusCode);
  }
};
