/**
 * DEPRECATION WARNING:
 * This middleware is superseded by `validateRequest` from `src/middlewares/validateRequest.ts`
 * and will be removed once all consumers have migrated (Tasks 2–6).
 * Do not use this for new validation routes!
 */
import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { sendError } from '../../contracts/api.contracts.js';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      return sendError(res, 'Validation Error', 'VALIDATION_FAILED', 422, fieldErrors);
    }
    req.body = result.data;
    next();
  };
};
