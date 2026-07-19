import { redisConnection } from '../config/redis.js';
import { sendError } from '../contracts/api.contracts.js';
import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.utils.js';

import prisma from '../config/prisma.js';

// Extend the Express Request type to include the user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  let token: string | undefined;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query.token && typeof req.query.token === 'string') {
    token = req.query.token;
  }

  if (!token) {
    sendError(res, 'No token provided', 'UNAUTHORIZED', 401);
    return;
  }

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (jwtError) { console.error('JWT ERROR:', jwtError);
    sendError(res, 'Invalid or expired token', 'UNAUTHORIZED', 401);
    return;
  }

  try {
    const cacheKey = `api:auth:user:${decoded.userId}`;
    let user: any = null;

    if (redisConnection && redisConnection.status === 'ready') {
      const cached = await redisConnection.get(cacheKey);
      if (cached) {
        user = JSON.parse(cached);
      }
    }

    if (!user) {
      user = await prisma.user.findUnique({
        where: { userid: decoded.userId },
        select: { userid: true, accountStatus: true, mustChangePassword: true, version: true }
      });

      if (user && redisConnection && redisConnection.status === 'ready') {
        await redisConnection.setex(cacheKey, 3600, JSON.stringify(user)); // cache for 1 hour
      }
    }

    if (!user) {
      sendError(res, 'User not found', 'UNAUTHORIZED', 401);
      return;
    }

    if (decoded.version !== undefined && decoded.version !== user.version) {
      sendError(res, 'Session invalidated. Please log in again.', 'UNAUTHORIZED', 401);
      return;
    }

    if (user.accountStatus !== 'ACTIVE') {
      sendError(res, 'Account is not active', 'FORBIDDEN', 403);
      return;
    }

    if (user.mustChangePassword && !req.path.includes('/change-password') && !req.path.includes('/logout')) {
      sendError(res, 'Password change required', 'FORBIDDEN', 403, { code: 'PASSWORD_CHANGE_REQUIRED' });
      return;
    }

    req.user = {
      userId: decoded.userId,
      id: decoded.userId,
      role: decoded.role,
      roles: decoded.roles,
      mustChangePassword: user.mustChangePassword
    };
    next();
  } catch (error) {
    console.error('Database query error in authenticate middleware:', error);
    sendError(res, 'Database failure', 'INTERNAL_ERROR', 500);
  }
};

