import { sendError } from '../contracts/api.contracts.js';
import { Request, Response, NextFunction } from 'express';
import { hasPermission } from '../services/admin/rbac.service.js';

export const requirePermission = (module: string, action: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      if (!user || !user.id) {
        return sendError(res, 'User identity not found', 'UNAUTHORIZED', 401);
      }


      if (user.role === 'ADMIN') {
        return next();
      }

      if (user.role === 'HR' && ['FACULTY_OVERSIGHT', 'LEAVE_MANAGEMENT', 'FACULTY_ROUTES', 'ATTENDANCE', 'HR', 'REPORTS'].includes(module)) {
        return next();
      }

      if (user.role === 'FACULTY' && module === 'AI_QUIZ') {
        return next();
      }

      if (user.role === 'STUDENT' && module === 'AI_QUIZ' && action === 'ATTEMPT') {
        return next();
      }

      const isAuthorized = await hasPermission(user.id, module, action);
      if (!isAuthorized) {
        return sendError(res, `Missing permission: ${module}:${action}`, 'FORBIDDEN', 403);
      }

      next();
    } catch (err: any) {
      return sendError(res, 'Authorization check failed', 'INTERNAL_ERROR', 500, err.message);
    }
  };
};
