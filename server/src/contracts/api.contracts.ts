import { z } from 'zod';
import { Response } from 'express';

export const ApiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.any().optional(),
});

export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: ApiErrorSchema.optional(),
});

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// Utility wrapper for sending consistent responses
export const sendSuccess = <T>(res: Response<ApiResponse<T>>, data: T, statusCode = 200) => {
  return res.status(statusCode).json({ success: true, data });
};

export const sendError = (res: Response<ApiResponse<null>>, message: string, code = 'INTERNAL_ERROR', statusCode = 500, details?: any) => {
  return res.status(statusCode).json({
    success: false,
    error: { code, message, details }
  });
};
