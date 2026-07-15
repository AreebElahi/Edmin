import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
  mode?: 'warn' | 'enforce';
}

interface FormattedError {
  field: string;
  message: string;
  code: string;
}

const getGenericMessage = (code: string): string => {
  switch (code) {
    case 'invalid_type':
      return 'Invalid data type provided';
    case 'invalid_string':
      return 'Invalid string format';
    case 'too_small':
      return 'Value is missing required characters or is too small';
    case 'too_big':
      return 'Value exceeds maximum allowed size';
    case 'unrecognized_keys':
      return 'Unrecognized fields provided';
    default:
      return 'Invalid input parameter';
  }
};

export const validateRequest = ({ body, query, params, mode = 'warn' }: ValidationSchemas) => {
  const middleware = (req: Request, res: Response, next: NextFunction) => {
    const errors: FormattedError[] = [];

    const processSchema = (schema: ZodSchema, data: any, prefix: 'body' | 'query' | 'params') => {
      const result = schema.safeParse(data);
      if (!result.success) {
        result.error.issues.forEach(issue => {
          const isDev = process.env.NODE_ENV !== 'production';
          errors.push({
            field: `${prefix}.${issue.path.join('.')}`,
            message: isDev ? issue.message : getGenericMessage(issue.code),
            code: issue.code
          });
        });
      } else {
        if (prefix === 'body') req.body = result.data;
        if (prefix === 'query') Object.defineProperty(req, 'query', { value: result.data, writable: true, configurable: true });
        if (prefix === 'params') req.params = result.data as any;
      }
    };

    if (params) processSchema(params, req.params, 'params');
    if (query) processSchema(query, req.query, 'query');
    if (body) processSchema(body, req.body, 'body');

    if (errors.length > 0) {
      if (mode === 'warn') {
        const userId = (req as any).user?.userId || (req as any).user?.id || 'anonymous';
        console.warn(`[VALIDATION_WARN] ${req.method} ${req.originalUrl} | User: ${userId} | Offending Fields:`, errors.map(e => e.field).join(', '));
        return next();
      }

      // enforce mode
      return res.status(400).json({
        success: false,
        errors
      });
    } else {
      next();
    }
  };

  (middleware as any).__isValidateRequest = true;
  return middleware;
};
