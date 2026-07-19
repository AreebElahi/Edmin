import { z } from 'zod';
import { Response } from 'express';

export const ApiErrorSchema = z.object({
  field: z.string().optional(),
  message: z.string(),
});

export const ApiResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.any().optional(),
  meta: z.any().optional(),
  errors: z.array(ApiErrorSchema).optional(),
  timestamp: z.string(),
  requestId: z.string(),
});

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: any;
  errors?: { field?: string; message: string }[];
  timestamp: string;
  requestId: string;
}

export const sendSuccess = <T>(res: Response<ApiResponse<T>>, data: T, message = 'Operation completed successfully.', meta?: any, statusCode = 200) => {
  const requestId = res.locals.requestId || 'unknown-request-id';
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    meta: meta || {},
    timestamp: new Date().toISOString(),
    requestId
  });
};

export const sendError = (res: Response<ApiResponse<null>>, message: string, errorsOrCode: any[] | string = [], statusCode = 500, details?: any) => {
  const requestId = res.locals.requestId || 'unknown-request-id';
  
  // Backwards compatibility for old sendError signature: (res, message, code, statusCode, details)
  let errors: any[] = [];
  if (Array.isArray(errorsOrCode)) {
    errors = errorsOrCode;
  } else if (typeof errorsOrCode === 'string') {
    errors = [{ field: errorsOrCode, message }];
  }

  if (details && Array.isArray(details)) {
    errors = [...errors, ...details];
  } else if (details) {
    errors.push({ field: 'details', message: JSON.stringify(details) });
  }

  return res.status(statusCode).json({
    success: false,
    message,
    errors,
    timestamp: new Date().toISOString(),
    requestId
  });
};
