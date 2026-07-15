import { Request, Response, NextFunction } from 'express';
import { sendError } from '../contracts/api.contracts.js';

export const requireRoles = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;
    
    if (!userRole) {
      return sendError(res, 'Unauthorized', 'UNAUTHORIZED', 401);
    }
    
    if (userRole === 'SYSTEM_ADMIN' || roles.includes(userRole)) {
      return next();
    }
    
    return sendError(res, `Forbidden: Requires one of roles: ${roles.join(', ')}`, 'FORBIDDEN', 403);
  };
};
