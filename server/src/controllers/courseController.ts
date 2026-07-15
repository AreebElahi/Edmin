import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync.js';
import * as courseService from '../services/courseService.js';
import { redisConnection } from '../config/redis.js';


export const createCourseOffering = catchAsync(async (req: Request, res: Response) => {
  const { courseId, semesterId, departmentId, facultyId } = req.body;

  if (!courseId || !semesterId || !departmentId || !facultyId) {
    res.status(400).json({ success: false, error: 'Missing required offering parameters' });
    return;
  }

  const offering = await courseService.createCourseOffering(courseId, semesterId, departmentId, facultyId);
  res.status(201).json({ success: true, offering });
});



export const getAllCourses = catchAsync(async (req: Request, res: Response) => {
  const cacheKey = 'api:courses:all';
  if (redisConnection && redisConnection.status === 'ready') {
    const cached = await redisConnection.get(cacheKey);
    if (cached) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).send(cached);
    }
  }

  const courses = await courseService.getAllCourses();

  const fullResponse = { success: true, courses };

  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.setex(cacheKey, 3600, JSON.stringify(fullResponse)); // cache for 1 hour
  }

  res.status(200).json(fullResponse);
});

export const getAllCourseOfferings = catchAsync(async (req: Request, res: Response) => {
  const cacheKey = 'api:courseOfferings:all';
  if (redisConnection && redisConnection.status === 'ready') {
    const cached = await redisConnection.get(cacheKey);
    if (cached) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).send(cached);
    }
  }

  const offerings = await courseService.getAllCourseOfferings();

  const fullResponse = { success: true, offerings };

  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.setex(cacheKey, 3600, JSON.stringify(fullResponse)); // cache for 1 hour
  }

  res.status(200).json(fullResponse);
});
