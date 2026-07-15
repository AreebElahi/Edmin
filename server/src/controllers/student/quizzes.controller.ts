import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../contracts/api.contracts.js';
import * as QuizzesService from '../../services/student/quizzes.service.js';
import { redisConnection } from '../../config/redis.js';

export const getQuizzesHandler = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId || (req as any).user.id;
    const cacheKey = `api:student:quizzes:${userId}`;

    if (redisConnection && redisConnection.status === 'ready') {
      const cached = await redisConnection.get(cacheKey);
      if (cached) {
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).send(cached);
      }
    }

    const quizzes = await QuizzesService.getQuizzesWithStatus(userId);
    const fullResponse = { success: true, data: quizzes };

    if (redisConnection && redisConnection.status === 'ready') {
      await redisConnection.setex(cacheKey, 180, JSON.stringify(fullResponse));
    }

    return res.status(200).json(fullResponse);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return sendError(res, error.message, 'QUIZZES_ERROR', statusCode);
  }
};

export const getQuizDetailHandler = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId || (req as any).user.id;
    const quizId = parseInt(req.params.quizId as string, 10);

    if (isNaN(quizId)) {
      return sendError(res, 'Invalid quizId', 'VALIDATION_FAILED', 400);
    }

    const cacheKey = `api:student:quiz:${quizId}:${userId}`;
    if (redisConnection && redisConnection.status === 'ready') {
      const cached = await redisConnection.get(cacheKey);
      if (cached) {
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).send(cached);
      }
    }

    const detail = await QuizzesService.getQuizDetail(userId, quizId);
    const fullResponse = { success: true, data: detail };

    if (redisConnection && redisConnection.status === 'ready') {
      await redisConnection.setex(cacheKey, 180, JSON.stringify(fullResponse));
    }

    return res.status(200).json(fullResponse);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return sendError(res, error.message, 'QUIZZES_ERROR', statusCode);
  }
};

export const submitQuizAttemptHandler = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId || (req as any).user.id;
    const quizId = parseInt(req.params.quizId as string, 10);
    const { answers } = req.body;

    if (isNaN(quizId)) {
      return sendError(res, 'Invalid quizId', 'VALIDATION_FAILED', 400);
    }

    const attempt = await QuizzesService.submitQuizAttempt(userId, quizId, answers);
    
    if (redisConnection && redisConnection.status === 'ready') {
      await redisConnection.del(`api:student:quizzes:${userId}`);
      await redisConnection.del(`api:student:quiz:${quizId}:${userId}`);
      await redisConnection.del(`api:student:quiz_result:${quizId}:${userId}`);
    }

    return sendSuccess(res, attempt, 201);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return sendError(res, error.message, 'QUIZZES_ERROR', statusCode);
  }
};

export const getQuizResultHandler = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId || (req as any).user.id;
    const quizId = parseInt(req.params.quizId as string, 10);

    if (isNaN(quizId)) {
      return sendError(res, 'Invalid quizId', 'VALIDATION_FAILED', 400);
    }

    const cacheKey = `api:student:quiz_result:${quizId}:${userId}`;
    if (redisConnection && redisConnection.status === 'ready') {
      const cached = await redisConnection.get(cacheKey);
      if (cached) {
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).send(cached);
      }
    }

    const result = await QuizzesService.getQuizResult(userId, quizId);
    const fullResponse = { success: true, data: result };

    if (redisConnection && redisConnection.status === 'ready') {
      await redisConnection.setex(cacheKey, 180, JSON.stringify(fullResponse));
    }

    return res.status(200).json(fullResponse);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return sendError(res, error.message, 'QUIZZES_ERROR', statusCode);
  }
};

export const reportQuizViolationHandler = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId || (req as any).user.id;
    const quizId = parseInt(req.params.quizId as string, 10);

    if (isNaN(quizId)) {
      return sendError(res, 'Invalid quizId', 'VALIDATION_FAILED', 400);
    }

    await QuizzesService.reportViolation(userId, quizId);
    return sendSuccess(res, { message: 'Violation reported' }, 200);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return sendError(res, error.message, 'QUIZZES_ERROR', statusCode);
  }
};
