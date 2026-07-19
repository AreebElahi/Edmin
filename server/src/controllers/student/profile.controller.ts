import { redisConnection } from '../../config/redis.js';
import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../contracts/api.contracts.js';
import * as ProfileService from '../../services/student/profile.service.js';

import { getCachedResponse, setCachedResponse } from "../../config/redis.js";

export const getProfileHandler = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId || (req as any).user.id;
    const cacheKey = `api:student:profile:${userId}`;

    if (redisConnection && redisConnection.status === 'ready') {
      const cached = await redisConnection.get(cacheKey);
      if (cached) {
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).send(cached);
      }
    }

    const profile = await ProfileService.getProfile(userId);

    const fullResponse = { success: true, data: profile };

    if (redisConnection && redisConnection.status === 'ready') {
      await redisConnection.setex(cacheKey, 3600, JSON.stringify(fullResponse)); // cache for 1 hour
    }

    return sendSuccess(res, (fullResponse as any).data || fullResponse, undefined, undefined, 200);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return sendError(res, error.message, 'PROFILE_ERROR', statusCode);
  }
};
