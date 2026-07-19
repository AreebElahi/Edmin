import { redisConnection } from '../config/redis.js';
import { Request, Response, NextFunction } from 'express';

/**
 * Enterprise Redis Cache Middleware
 * Implements Cache-Aside pattern as per enterprise-level-enhancement.md
 */
export const requireCache = (ttlSeconds: number = 300) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Bypass if Redis is not connected
    if (!redisConnection || redisConnection.status !== 'ready') {
      return next();
    }

    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    try {
      const userId = (req as any).user?.userId || (req as any).user?.userid || (req as any).user?.id || 'public';
      
      // Clean the path to use as a semantic cache key
      const routePath = req.originalUrl.split('?')[0].replace('/api/v1/', '').replace(/\//g, ':');
      
      // Format: user:profile:{userId}:{routePath}
      const cacheKey = `user:profile:${userId}:${routePath}`;

      // Try to fetch from cache
      const cachedResponse = await redisConnection.get(cacheKey);

      if (cachedResponse) {
        // Cache Hit: Bypass JSON parsing and stringification completely!
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('X-Cache', 'HIT');
        return res.status(200).send(cachedResponse);
      }

      // Cache Miss: Intercept the response
      const originalJson = res.json.bind(res);
      res.json = (body: any) => {
        // Send the response immediately to the client
        originalJson(body);

        // Asynchronously save to Redis without blocking the request
        if (res.statusCode >= 200 && res.statusCode < 300) {
          redisConnection.set(cacheKey, JSON.stringify(body), 'EX', ttlSeconds).catch((err: any) => {
            console.error('[Redis Cache] Failed to save to cache:', err);
          });
        }
        
        return res;
      };

      res.setHeader('X-Cache', 'MISS');
      next();
    } catch (error) {
      // Fail gracefully
      console.error('[Redis Cache Middleware Error]:', error);
      next();
    }
  };
};
