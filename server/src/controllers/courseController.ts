import { redisConnection } from '../config/redis.js';
import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync.js';
import * as courseService from '../services/courseService.js';
import { sendSuccess, sendError } from "../contracts/api.contracts.js";
import { getCachedResponse, setCachedResponse } from "../config/redis.js";

export const createCourseOffering = catchAsync(async (req: Request, res: Response) => {
  const { courseId, semesterId, departmentId, facultyId } = req.body;

  if (!courseId || !semesterId || !departmentId || !facultyId) {
    sendError(res, 'Internal error', [], 400);
    return;
  }

  const offering = await courseService.createCourseOffering(courseId, semesterId, departmentId, facultyId);
  sendSuccess(res, { success: true, offering }, undefined, undefined, 201);
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

  sendSuccess(res, (fullResponse as any).data || fullResponse, undefined, undefined, 200);
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

  sendSuccess(res, (fullResponse as any).data || fullResponse, undefined, undefined, 200);
});
