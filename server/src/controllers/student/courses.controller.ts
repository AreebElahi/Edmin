import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../contracts/api.contracts.js';
import * as CoursesService from '../../services/student/courses.service.js';

import { redisConnection } from '../../config/redis.js';

export const getStudentCoursesHandler = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId || (req as any).user.id;
    const cacheKey = `api:student:courses:${userId}`;

    if (redisConnection && redisConnection.status === 'ready') {
      const cached = await redisConnection.get(cacheKey);
      if (cached) {
        return sendSuccess(res, JSON.parse(cached), 200);
      }
    }

    const courses = await CoursesService.getEnrolledCourses(userId);

    if (redisConnection && redisConnection.status === 'ready') {
      await redisConnection.setex(cacheKey, 3600, JSON.stringify(courses)); // cache for 1 hour
    }

    return sendSuccess(res, courses, 200);
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
    return sendSuccess(res, details, 200);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return sendError(res, error.message, 'COURSES_DETAIL_ERROR', statusCode);
  }
};
