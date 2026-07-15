import { role_enum, user_type, account_status } from '@prisma/client';
import prisma from '../../config/prisma.js';
import bcrypt from 'bcrypt';
import { createRoleProfile, ProfileAuditAction } from '../identity/profileProvisioning.service.js';
import { assignSectionToStudent, batchAssignStudents } from '../enrollment/enrollment.service.js';
import { generateIdentity } from '../../modules/identity/identity.generator.js';
import { createAuditEntry } from '../workflows/shared/audit.service.js';
import { invalidateUserCache } from './rbac.service.js';
import { createNotification } from '../notification/notification.service.js';


export interface GetUsersFilters {
  role?: string;
  status?: string;
  departmentId?: string;
  search?: string;
}

export const getAllUsers = async (filters: GetUsersFilters) => {
  const whereClause: any = {};

  if (filters.role && filters.role !== 'All') {
    whereClause.role = filters.role;
  }

  if (filters.status && filters.status !== 'All') {
    whereClause.accountStatus = filters.status === 'Active' ? 'ACTIVE' : { not: 'ACTIVE' };
  }

  // departmentId filter
  if (filters.departmentId && filters.departmentId !== 'All') {
    whereClause.departmentmember = {
      some: {
        departmentid: parseInt(filters.departmentId, 10)
      }
    };
  }

  if (filters.search) {
    whereClause.OR = [
      { username: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } },
      { identifier: { contains: filters.search, mode: 'insensitive' } },
      { institutionalEmail: { contains: filters.search, mode: 'insensitive' } },
      ...(isNaN(parseInt(filters.search, 10)) ? [] : [{ userid: parseInt(filters.search, 10) }])
    ];
  }

  const users = await prisma.user.findMany({
    where: whereClause,
    include: {
      departmentmember: {
        include: {
          department: true
        }
      },
      usersession: {
        orderBy: { updatedat: 'desc' },
        take: 1
      }
    },
    orderBy: {
      userid: 'desc'
    }
  });

  return users;
};

export interface RegisterUserPayload {
  name: string;
  email?: string;           // Optional — auto-generated from name if omitted
  role: role_enum;
  departmentId?: number;
  adminId: number;
}

export const createUser = async (payload: RegisterUserPayload) => {
  const { name, role, departmentId } = payload;

  // Determine userType
  let uType: user_type = 'STAFF';
  if (role === 'STUDENT') uType = 'STUDENT';
  else if (role === 'FACULTY') uType = 'FACULTY';

  // Generate a random 8 character secure password
  const tempPassword = Math.random().toString(36).slice(-8);
  const hashedPassword = await bcrypt.hash(tempPassword, 10);

  const newUser = await prisma.$transaction(async (tx) => {
    // Generate clean unique username, institutional email, and identifier
    const { username, institutionalEmail, identifier, deptCode } = await generateIdentity({
      name,
      role,
      departmentId,
      tx
    });

    const finalEmail = payload.email?.trim()
      ? payload.email.trim().toLowerCase()
      : institutionalEmail;

    // Create the User record with ACTIVE status, department info, and mustChangePassword = true
    const userRecord = await tx.user.create({
      data: {
        username,
        email: finalEmail,
        institutionalEmail,
        identifier,
        role,
        userType: uType,
        accountStatus: 'ACTIVE' as account_status,
        departmentId: departmentId || null,
        departmentCode: departmentId ? deptCode : null,
        password: hashedPassword,
        mustChangePassword: true,
        ...(departmentId ? {
          departmentmember: {
            create: {
              departmentid: departmentId
            }
          }
        } : {})
      },
      include: {
        departmentmember: {
          include: {
            department: true
          }
        }
      }
    });

    await createRoleProfile(tx, userRecord, departmentId, departmentId ? deptCode : undefined);

    // ─── PROVISIONING FIX: Explicitly map the UserRole ───
    const defaultRoles = (await import('../../config/roles.config.js')).ROLE_DEFAULT_USERROLE_MAP[role as role_enum];
    const rolesInDb = await tx.role.findMany({
      where: { name: { in: defaultRoles || [] } }
    });
    if (rolesInDb.length > 0) {
      await tx.userRole.createMany({
        data: rolesInDb.map(r => ({
          user_id: userRecord.userid,
          role_id: r.id
        })),
        skipDuplicates: true
      });
    }
    // ─────────────────────────────────────────────────────

    await createAuditEntry(payload.adminId, ProfileAuditAction.PROFILE_CREATED, 'user', userRecord.userid, null, tx);

    return userRecord;
  });

  if (role === 'STUDENT' && departmentId) {
    const student = await prisma.student.findFirst({ where: { userid: newUser.userid } });
    if (student) {
      await assignSectionToStudent({
        studentId: student.studentid,
        departmentId: departmentId
      });
    }
  }

  return { user: newUser, tempPassword };
};

export const assignUserRole = async (userId: number, roleName: string, action: 'assign' | 'revoke', adminId: number) => {
  const user = await prisma.user.findUnique({ where: { userid: userId } });
  if (!user) throw new Error('User not found');

  const role = await prisma.role.findFirst({ where: { name: roleName.toUpperCase() } });
  if (!role) throw new Error(`Role ${roleName} not found in database`);

  if (action === 'assign') {
    const existing = await prisma.userRole.findFirst({
      where: { user_id: userId, role_id: role.id }
    });
    if (!existing) {
      await prisma.userRole.create({
        data: { user_id: userId, role_id: role.id }
      });
    }
  } else if (action === 'revoke') {
    await prisma.userRole.deleteMany({
      where: { user_id: userId, role_id: role.id }
    });
  }

  await createAuditEntry(adminId, action === 'assign' ? 'ROLE_ASSIGNED' : 'ROLE_REVOKED', 'userRole', userId, `Role ${role.name}`);
  await prisma.user.update({
    where: { userid: userId },
    data: { version: { increment: 1 } }
  });
  await invalidateUserCache(userId);

  await createNotification({
    userId,
    title: 'Account Access Changed',
    message: 'Your account access has changed. Please log in again to see your updated permissions.',
    type: 'SYSTEM'
  });

  return { success: true, action, role: role.name };
};

export const updateUserStatus = async (userId: number, isActive: boolean, adminId: number) => {
  const updatedUser = await prisma.user.update({
    where: { userid: userId },
    data: { accountStatus: isActive ? 'ACTIVE' : 'SUSPENDED' }
  });

  await createAuditEntry(adminId, isActive ? 'STATUS_ACTIVATED' : 'STATUS_DEACTIVATED', 'user', userId, null);
  await invalidateUserCache(userId);

  return updatedUser;
};

export const getDepartments = async () => {
  return await prisma.department.findMany({
    where: { isactive: true },
    select: {
      departmentid: true,
      name: true,
      code: true
    },
    orderBy: {
      name: 'asc'
    }
  });
};

export const resetUserPassword = async (userId: number, adminId: number) => {
  const tempPassword = Math.random().toString(36).slice(-8);
  const hashedPassword = await bcrypt.hash(tempPassword, 10);
  
  await prisma.user.update({
    where: { userid: userId },
    data: { 
      password: hashedPassword,
      mustChangePassword: true,
      passwordChangedAt: new Date()
    }
  });

  await createAuditEntry(adminId, 'PASSWORD_RESET', 'user', userId, null);

  return { userId, temporaryPassword: tempPassword };
};

export const getUserAuditTrail = async (userId: number) => {
  const logs = await prisma.auditLog.findMany({
    where: { record_id: userId, table_name: 'user' },
    orderBy: { created_at: 'desc' },
    include: {
      actor: {
        select: { username: true }
      }
    }
  });

  return logs.map(log => ({
    action: log.action,
    timestamp: log.created_at,
    performedBy: log.actor?.username || 'Unknown'
  }));
};

export const bulkImportUsers = async (usersData: any[], adminId: number) => {
  const departments = await prisma.department.findMany({ select: { departmentid: true, code: true } });
  const deptMap = new Map(departments.map(d => [d.code.toUpperCase(), d.departmentid]));

  let created = 0;
  let failed = 0;
  const errors: string[] = [];
  
  const createdStudentsForBatch: { studentId: number, departmentId: number }[] = [];

  for (const [index, row] of usersData.entries()) {
    try {
      const { fullName, email, role, departmentCode, temporaryPassword } = row;
      
      if (!fullName || !email || !role || !departmentCode) {
        const missing = ['fullName', 'email', 'role', 'departmentCode']
          .filter(k => !row[k]).join(', ');
        throw new Error(`Missing required fields: ${missing}`);
      }

      const normalizedRole = String(role).trim().toUpperCase();
      const allowedRoles = ['STUDENT', 'FACULTY', 'ADMIN', 'HR', 'STAFF'];
      if (!allowedRoles.includes(normalizedRole)) {
        throw new Error(`Invalid role "${role}". Allowed values: ${allowedRoles.join(', ')}`);
      }

      const normalizedEmail = String(email).trim().toLowerCase();

      const existingUser = await prisma.user.findFirst({ where: { email: normalizedEmail }, select: { userid: true } });
      if (existingUser) {
        throw new Error(`Email already registered: ${normalizedEmail}`);
      }

      const deptId = deptMap.get(String(departmentCode).toUpperCase());
      if (!deptId) {
        throw new Error(`Invalid department code: ${departmentCode}`);
      }


      const tempPass = temporaryPassword || Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(tempPass, 10);

      let uType: user_type = 'STAFF';
      if (normalizedRole === 'STUDENT') uType = 'STUDENT';
      else if (normalizedRole === 'FACULTY') uType = 'FACULTY';

      await prisma.$transaction(async (tx) => {
        const { username, institutionalEmail, identifier, deptCode: resolvedDeptCode } = await generateIdentity({
          name: fullName,
          role: normalizedRole,
          departmentId: deptId,
          tx
        });

        const newUser = await tx.user.create({
          data: {
            username,
            email: normalizedEmail || institutionalEmail,
            institutionalEmail,
            identifier,
            role: normalizedRole as role_enum,
            userType: uType,
            accountStatus: 'ACTIVE' as account_status,
            departmentId: deptId,
            departmentCode: String(departmentCode).toUpperCase(),
            password: hashedPassword,
            mustChangePassword: true,
            departmentmember: {
              create: {
                departmentid: deptId
              }
            }
          }
        });

        await createRoleProfile(tx, newUser, deptId, String(departmentCode).toUpperCase());

        // ─── PROVISIONING FIX: Explicitly map the UserRole ───
        const defaultRoles = (await import('../../config/roles.config.js')).ROLE_DEFAULT_USERROLE_MAP[normalizedRole as role_enum];
        const rolesInDb = await tx.role.findMany({
          where: { name: { in: defaultRoles || [] } }
        });
        if (rolesInDb.length > 0) {
          await tx.userRole.createMany({
            data: rolesInDb.map(r => ({
              user_id: newUser.userid,
              role_id: r.id
            })),
            skipDuplicates: true
          });
        }
        // ─────────────────────────────────────────────────────

        await createAuditEntry(adminId, ProfileAuditAction.PROFILE_CREATED, 'user', newUser.userid, null, tx);

        if (normalizedRole === 'STUDENT') {
          const studentProfile = await tx.student.findFirst({ where: { userid: newUser.userid } });
          if (studentProfile) {
            createdStudentsForBatch.push({
              studentId: studentProfile.studentid,
              departmentId: deptId
            });
          }
        }
      });

      created++;
    } catch (err: any) {
      failed++;
      errors.push(`Row ${index + 1} (${row.email || 'Unknown'}): ${err.message}`);
    }
  }

  // Batch assign sections for imported students
  // Group by department to optimize if needed, but batchAssignStudents iterates and assigns
  for (const item of createdStudentsForBatch) {
    try {
      await assignSectionToStudent({
        studentId: item.studentId,
        departmentId: item.departmentId
      });
    } catch (e: any) {
      errors.push(`Failed to assign section to student ID ${item.studentId}: ${e.message}`);
    }
  }

  return { created, failed, errors };
};
