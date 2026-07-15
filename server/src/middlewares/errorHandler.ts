import { Request, Response, NextFunction } from 'express';
import { sendError } from '../contracts/api.contracts.js';
import { logger } from '../utils/logger.js';

export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error({ err, path: req.path, method: req.method }, 'Unhandled Exception Caught');

  if (err.name === 'ZodError') {
    return sendError(res, 'Validation Error', 'VALIDATION_FAILED', 400, err.errors);
  }

  if (err.name === 'MulterError') {
    return sendError(res, err.message, 'UPLOAD_ERROR', 400);
  }

  if (err.statusCode) {
    return sendError(res, err.message, err.errorCode || 'API_ERROR', err.statusCode);
  }

  // Prevent stack traces from leaking in production
  const isProd = process.env.NODE_ENV === 'production';
  return sendError(
    res, 
    isProd ? 'Internal Server Error' : err.message, 
    'INTERNAL_ERROR', 
    500
  );
};
