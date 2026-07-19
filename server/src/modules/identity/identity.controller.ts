import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../contracts/api.contracts.js';
import { previewIdentity } from './identity.preview.js';
import { signupUser, changePassword } from './identity.service.js';
import { parseOptionalString } from '../../utils/queryParser.js';

export const previewIdentityHandler = async (req: Request, res: Response) => {
  try {
    const name = parseOptionalString(req.query.name || req.body.name);
    const role = parseOptionalString(req.query.role || req.body.role);
    const departmentIdStr = parseOptionalString(req.query.departmentId || req.body.departmentId);

    if (!name || name.trim().length < 2) {
      return sendError(res, 'name parameter is required (min 2 chars)', 'BAD_REQUEST', 400);
    }
    if (!role) {
      return sendError(res, 'role parameter is required', 'BAD_REQUEST', 400);
    }

    const departmentId = departmentIdStr ? parseInt(departmentIdStr, 10) : undefined;
    const preview = await previewIdentity({
      name: name.trim(),
      role: role.toUpperCase(),
      departmentId
    });

    return sendSuccess(res, preview);
  } catch (error: any) {
    console.error('Error in previewIdentityHandler:', error);
    return sendError(res, error.message);
  }
};

export const signupHandler = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 'Email and password are required', 'BAD_REQUEST', 400);
    }

    const result = await signupUser({
      usernameInput: email,
      passwordInput: password
    });

    return sendSuccess(res, result, 'Operation completed successfully.', undefined, 201);
  } catch (error: any) {
    console.error('Error in signupHandler:', error);
    return sendError(res, error.message);
  }
};

export const changePasswordHandler = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId || (req as any).user?.id;
    const { currentPassword, newPassword } = req.body;

    if (!userId) {
      return sendError(res, 'Unauthorized', 'UNAUTHORIZED', 401);
    }
    if (!currentPassword || !newPassword) {
      return sendError(res, 'Current password and new password are required', 'BAD_REQUEST', 400);
    }

    await changePassword(userId, currentPassword, newPassword);

    // Invalidate refresh_token cookie just like logout does
    res.clearCookie('refresh_token', { path: '/auth/refresh' });

    return sendSuccess(res, { message: 'Password changed successfully' });
  } catch (error: any) {
    console.error('Error in changePasswordHandler:', error);
    return sendError(res, error.message);
  }
};
