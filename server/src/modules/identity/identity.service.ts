import prisma from '../../config/prisma.js';
import { createAuditEntry } from '../../services/workflows/shared/audit.service.js';
import { hashData, verifyData } from '../../utils/hash.utils.js';
import { generateIdentity } from './identity.generator.js';
import { createRoleProfile } from '../../services/identity/profileProvisioning.service.js';
import { role_enum, user_type, account_status } from '@prisma/client';
import { redisConnection } from '../../config/redis.js';

/**
 * Register a new user from the self-signup portal.
 * Registers them as a PENDING STUDENT under the UND department.
 */
export async function signupUser(payload: {
  usernameInput: string; // The username portion, or full email
  passwordInput: string;
}) {
  const { usernameInput, passwordInput } = payload;

  const emailDomain = 'edmin.edu.pk';
  const cleanInput = usernameInput.trim();
  
  // Resolve correct username part
  let namePart = cleanInput;
  if (cleanInput.includes('@')) {
    const [local, domain] = cleanInput.split('@');
    if (domain.toLowerCase() !== emailDomain) {
      throw new Error(`Self-signup is only allowed for the ${emailDomain} domain.`);
    }
    namePart = local;
  }

  // Find or create Undeclared department (UND)
  let undDept = await prisma.department.findFirst({
    where: { code: 'UND' }
  });
  if (!undDept) {
    undDept = await prisma.department.create({
      data: {
        name: 'Undeclared',
        code: 'UND',
        type: 'OPERATIONAL',
        isactive: true
      }
    });
  }

  // Generate identity details atomically using a transaction
  return await prisma.$transaction(async (tx) => {
    // Generate clean unique username, institutional email, and roll number
    // For full name, we fallback to the capitalized namePart
    const name = namePart
      .split('.')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    const { username, institutionalEmail, identifier, deptCode } = await generateIdentity({
      name,
      role: 'STUDENT',
      departmentId: undDept.departmentid,
      tx
    });

    const hashedPassword = await hashData(passwordInput);

    // Create the User record with PENDING status
    const newUser = await tx.user.create({
      data: {
        username,
        email: institutionalEmail, // default email to institutional
        institutionalEmail,
        identifier,
        password: hashedPassword,
        role: 'STUDENT' as role_enum,
        userType: 'STUDENT' as user_type,
        accountStatus: 'PENDING' as account_status,
        departmentId: undDept.departmentid,
        departmentCode: 'UND',
        mustChangePassword: false,
        departmentmember: {
          create: {
            departmentid: undDept.departmentid
          }
        }
      }
    });

    // ─── PROVISIONING FIX: Explicitly map the UserRole ───
    const defaultRoles = (await import('../../config/roles.config.js')).ROLE_DEFAULT_USERROLE_MAP['STUDENT'];
    const rolesInDb = await tx.role.findMany({
      where: { name: { in: defaultRoles } }
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

    // Create student profile
    await createRoleProfile(tx, newUser, undDept.departmentid, 'UND');

    return {
      userId: newUser.userid,
      username: newUser.username,
      email: newUser.email,
      identifier: newUser.identifier,
      accountStatus: newUser.accountStatus
    };
  });
}

/**
 * Approve a pending user (Admin only).
 */
export async function approveUser(userId: number, adminId: number) {
  return await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { userid: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.accountStatus !== 'PENDING') {
      throw new Error(`Cannot approve user with status ${user.accountStatus}`);
    }

    const updatedUser = await tx.user.update({
      where: { userid: userId },
      data: {
        accountStatus: 'ACTIVE' as account_status,
        approvedById: adminId,
        approvedAt: new Date()
      }
    });

    // Make sure profile is initialized
    await createRoleProfile(tx, updatedUser, user.departmentId || undefined, user.departmentCode || undefined);

    // Write audit log
    await createAuditEntry(adminId, 'USER_APPROVED', 'user', userId, null, tx);

    return updatedUser;
  });
}

/**
 * Change user password and invalidate all active sessions.
 */
export async function changePassword(userId: number, currentPasswordInput: string, newPasswordInput: string) {
  const user = await prisma.user.findUnique({
    where: { userid: userId }
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Verify current password
  const isMatch = await verifyData(currentPasswordInput, user.password);
  if (!isMatch) {
    throw new Error('Incorrect current password');
  }

  const hashedNewPassword = await hashData(newPasswordInput);

  await prisma.$transaction(async (tx) => {
    // Update user password and mustChangePassword flag
    await tx.user.update({
      where: { userid: userId },
      data: {
        password: hashedNewPassword,
        mustChangePassword: false,
        passwordChangedAt: new Date()
      }
    });

    // Invalidate all active sessions for this user to force re-login
    await tx.usersession.updateMany({
      where: { userid: userId, isactive: true },
      data: {
        isactive: false,
        logouttime: new Date()
      }
    });

    // Audit log
    await createAuditEntry(userId, 'PASSWORD_CHANGED', 'user', userId, null, tx);
  });

  // Invalidate cached user data so authenticate middleware picks up mustChangePassword=false
  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.del(`api:auth:user:${userId}`);
  }

  return { success: true };
}
