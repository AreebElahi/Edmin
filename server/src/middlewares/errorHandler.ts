import { sendError } from '../contracts/api.contracts.js';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/errors.js';
import { PrismaClientKnownRequestError, PrismaClientValidationError } from '@prisma/client/runtime/library';



import { Prisma } from '@prisma/client';

export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV !== 'test') {
    logger.error({ err, path: req.path, method: req.method }, 'Unhandled Exception Caught');
  }

  let error = err;

  // Map Prisma errors
  if (err instanceof PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      error = new AppError('Duplicate field value entered', 409, [{ field: (err.meta?.target as string[])?.join(','), message: 'Duplicate value' }]);
    } else if (err.code === 'P2025') {
      error = new AppError('Resource not found', 404);
    } else {
      error = new AppError(`Database Error: ${err.message}`, 400);
    }
  } else if (err instanceof PrismaClientValidationError) {
    error = new AppError('Invalid data provided to database', 400);
  }

  if (err.name === 'ZodError') {
    const formattedErrors = err.errors.map((e: any) => ({ field: e.path.join('.'), message: e.message }));
    return sendError(res, 'Validation Error', formattedErrors, 400);
  }

  if (err.name === 'MulterError') {
    return sendError(res, err.message, [], 400);
  }

  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 'Invalid token. Please log in again!', [], 401);
  }
  if (err.name === 'TokenExpiredError') {
    return sendError(res, 'Your token has expired! Please log in again.', [], 401);
  }

  if (error instanceof AppError || error.statusCode) {
    return sendError(res, error.message, error.errors || [], error.statusCode || 500);
  }

  // Prevent stack traces from leaking in production
  const isProd = process.env.NODE_ENV === 'production';
  return sendError(
    res, 
    isProd ? 'Internal Server Error' : err.message, 
    [], 
    500
  );
};
