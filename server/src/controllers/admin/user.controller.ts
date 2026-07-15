import { Request, Response } from 'express';
import { getAllUsers, createUser, updateUserStatus, RegisterUserPayload, resetUserPassword, getUserAuditTrail, bulkImportUsers, assignUserRole } from '../../services/admin/user.service.js';
import { generateUsername, generateInstitutionalEmail } from '../../modules/identity/identity.generator.js';
import { previewIdentity } from '../../modules/identity/identity.preview.js';
import prisma from '../../config/prisma.js';
import { parse } from 'csv-parse/sync';
import { sendSuccess, sendError } from '../../contracts/api.contracts.js';
import { role_enum } from '@prisma/client';
import { parseString, parseOptionalString, parseNumber } from '../../utils/queryParser.js';

export const getAllUsersHandler = async (req: Request, res: Response) => {
  try {
    const filters = {
      role: parseOptionalString(req.query.role),
      status: parseOptionalString(req.query.status),
      departmentId: parseOptionalString(req.query.departmentId),
      search: parseOptionalString(req.query.search),
    };

    const users = await getAllUsers(filters);

    // Map Prisma models to a cleaner response format
    const mappedUsers = users.map(u => {
      let deptName = 'N/A';
      if (u.departmentmember && u.departmentmember.length > 0) {
        deptName = u.departmentmember[0].department.name;
      }
      const lastSession = (u as any).usersession?.[0];
      return {
        id: u.userid.toString(),
        name: u.username,
        email: u.email,
        role: u.role,
        dept: deptName,
        status: u.accountStatus === 'ACTIVE' ? 'Active' : 'Inactive',
        lastActive: lastSession?.updatedat ? new Date(lastSession.updatedat).toISOString() : null,
      };
    });

    return sendSuccess(res, mappedUsers);
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return sendError(res, error.message);
  }
};

export const registerUserHandler = async (req: Request, res: Response) => {
  try {
    const { name, email, role, departmentId } = req.body;

    if (!name || !role) {
      return sendError(res, 'Name and role are required', 'BAD_REQUEST', 400);
    }

    const payload: RegisterUserPayload = {
      name,
      email: email && email.trim() ? email.trim() : undefined,
      role: role as role_enum,
      departmentId: departmentId ? parseInt(departmentId, 10) : undefined,
      adminId: (req as any).user?.userid || 1, // fallback to 1 if not available
    };

    const result = await createUser(payload);

    let deptName = 'N/A';
    if (result.user.departmentmember && result.user.departmentmember.length > 0) {
      deptName = result.user.departmentmember[0].department.name;
    }

    const createdUser = {
      id: result.user.userid.toString(),
      name: result.user.username,
      email: result.user.email,
      role: result.user.role,
      dept: deptName,
      status: result.user.accountStatus === 'ACTIVE' ? 'Active' : 'Inactive',
    };

    return sendSuccess(res, { user: createdUser, tempPassword: result.tempPassword }, 201);
  } catch (error: any) {
    console.error('Error registering user:', error);
    return sendError(res, error.message);
  }
};

export const toggleUserStatusHandler = async (req: Request, res: Response) => {
  try {
    const userId = parseNumber(req.params.id, NaN);
    const { isActive } = req.body;

    if (isNaN(userId)) {
      return sendError(res, 'Invalid user ID', 'BAD_REQUEST', 400);
    }
    if (typeof isActive !== 'boolean') {
      return sendError(res, 'isActive must be a boolean', 'BAD_REQUEST', 400);
    }

    const adminId = (req as any).user?.userid || 1;
    const updatedUser = await updateUserStatus(userId, isActive, adminId);

    return sendSuccess(res, { id: updatedUser.userid.toString(), status: updatedUser.accountStatus === 'ACTIVE' ? 'Active' : 'Inactive' });
  } catch (error: any) {
    console.error('Error updating user status:', error);
    return sendError(res, error.message);
  }
};


export const resetPasswordHandler = async (req: Request, res: Response) => {
  try {
    const userId = parseNumber(req.params.id, NaN);
    const adminId = (req as any).user?.userid || 1;

    if (isNaN(userId)) {
      return sendError(res, 'Invalid user ID', 'BAD_REQUEST', 400);
    }

    const result = await resetUserPassword(userId, adminId);
    return sendSuccess(res, result);
  } catch (error: any) {
    console.error('Error resetting password:', error);
    return sendError(res, error.message);
  }
};

export const getAuditTrailHandler = async (req: Request, res: Response) => {
  try {
    const userId = parseNumber(req.params.id, NaN);
    if (isNaN(userId)) {
      return sendError(res, 'Invalid user ID', 'BAD_REQUEST', 400);
    }

    const auditLogs = await getUserAuditTrail(userId);
    return sendSuccess(res, auditLogs);
  } catch (error: any) {
    console.error('Error fetching audit trail:', error);
    return sendError(res, error.message);
  }
};

export const previewEmailHandler = async (req: Request, res: Response) => {
  try {
    const name = parseOptionalString(req.query.name);
    if (!name || name.trim().length < 2) {
      return sendError(res, 'name query parameter is required (min 2 chars)', 'BAD_REQUEST', 400);
    }
    const username = await generateUsername(name.trim());
    const email = generateInstitutionalEmail(username);
    return sendSuccess(res, { email });
  } catch (error: any) {
    return sendError(res, error.message);
  }
};

export const previewIdentifierHandler = async (req: Request, res: Response) => {
  try {
    const role = parseOptionalString(req.query.role);
    const dept = parseOptionalString(req.query.dept);

    if (!role) {
      return sendError(res, 'role query parameter is required', 'BAD_REQUEST', 400);
    }

    let deptId: number | undefined;
    if (dept) {
      const d = await prisma.department.findFirst({ where: { code: dept } });
      deptId = d?.departmentid;
    }

    const preview = await previewIdentity({
      name: 'Temp Name',
      role: role.toUpperCase(),
      departmentId: deptId
    });

    return sendSuccess(res, { identifier: preview.identifier });
  } catch (error: any) {
    return sendError(res, error.message);
  }
};

export const bulkImportHandler = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return sendError(res, 'No CSV file provided', 'BAD_REQUEST', 400);
    }

    const adminId = (req as any).user?.userid || 1;
    
    const fileContent = req.file.buffer.toString('utf-8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    if (records.length === 0) {
      return sendError(res, 'CSV file is empty', 'BAD_REQUEST', 400);
    }

    const result = await bulkImportUsers(records, adminId);
    return sendSuccess(res, result, 201);
  } catch (error: any) {
    console.error('Error processing bulk import:', error);
    return sendError(res, error.message);
  }
};

export const assignUserRoleHandler = async (req: Request, res: Response) => {
  try {
    const userId = parseNumber(req.params.id, NaN);
    const { roleName, action } = req.body;
    const adminId = (req as any).user?.userid || 1;

    if (isNaN(userId)) {
      return sendError(res, 'Invalid user ID', 'BAD_REQUEST', 400);
    }
    if (action !== 'assign' && action !== 'revoke') {
      return sendError(res, "Invalid action. Must be 'assign' or 'revoke'", 'BAD_REQUEST', 400);
    }
    if (typeof roleName !== 'string') {
      return sendError(res, 'roleName must be a string', 'BAD_REQUEST', 400);
    }

    const result = await assignUserRole(userId, roleName, action, adminId);
    return sendSuccess(res, result);
  } catch (error: any) {
    console.error('Error in assignUserRoleHandler:', error);
    return sendError(res, error.message);
  }
};
