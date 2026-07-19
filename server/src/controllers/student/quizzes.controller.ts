import { redisConnection } from '../../config/redis.js';
import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../contracts/api.contracts.js';
import * as QuizzesService from '../../services/student/quizzes.service.js';
import { getCachedResponse, setCachedResponse } from "../../config/redis.js";

export const getQuizzesHandler = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId || (req as any).user.id;
    const quizzes = await QuizzesService.getQuizzesWithStatus(userId);
    const fullResponse = { success: true, data: quizzes };

    return sendSuccess(res, (fullResponse as any).data || fullResponse, undefined, undefined, 200);
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

    const detail = await QuizzesService.getQuizDetail(userId, quizId);
    const fullResponse = { success: true, data: detail };

    return sendSuccess(res, (fullResponse as any).data || fullResponse, undefined, undefined, 200);
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
      await redisConnection.del(`user:profile:${userId}:student:quizzes`);
      await redisConnection.del(`user:profile:${userId}:student:quizzes:${quizId}`);
      await redisConnection.del(`user:profile:${userId}:student:quizzes:${quizId}:result`);
    }

    return sendSuccess(res, attempt, 'Operation completed successfully.', undefined, 201);
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

    const result = await QuizzesService.getQuizResult(userId, quizId);
    const fullResponse = { success: true, data: result };

    return sendSuccess(res, (fullResponse as any).data || fullResponse, undefined, undefined, 200);
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
    return sendSuccess(res, { message: 'Violation reported' }, 'Operation completed successfully.', undefined, 200);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return sendError(res, error.message, 'QUIZZES_ERROR', statusCode);
  }
};
