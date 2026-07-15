import { user, role_enum } from '@prisma/client';
import prisma from '../../config/prisma.js';
import { createAuditEntry } from '../workflows/shared/audit.service.js';


export enum ProfileAuditAction {
  PROFILE_CREATED = 'PROFILE_CREATED',
  PROFILE_BACKFILLED = 'PROFILE_BACKFILLED',
  AUTO_PROFILE_RECREATED = 'AUTO_PROFILE_RECREATED',
  PROFILE_VALIDATION_FAILED = 'PROFILE_VALIDATION_FAILED'
}

import { generateIdentifier } from '../../modules/identity/identity.generator.js';
import { validateIdentifier } from '../../modules/identity/identity.validator.js';

export const createRoleProfile = async (tx: any, user: user, departmentId?: number, departmentCode?: string) => {
  const dept = departmentCode || 'UND';
  
  let identifier = user.identifier;
  if (!identifier) {
    identifier = await generateIdentifier(user.role, dept, tx);
    // Sync back to user
    await tx.user.update({
      where: { userid: user.userid },
      data: { identifier }
    });
  }

  switch (user.role) {
    case 'FACULTY':
      await tx.faculty.create({
        data: {
          userid: user.userid,
          employeenumber: identifier,
          fullname: user.username,
          departmentid: departmentId || null,
          isactive: true
        }
      });
      break;
    case 'STUDENT':
      await tx.student.create({
        data: {
          userid: user.userid,
          rollnumber: identifier,
          fullname: user.username,
          departmentid: departmentId || null,
          status: 'ACTIVE',
          isactive: true
        }
      });
      break;
    case 'HR':
      await tx.hrprofile.create({
        data: {
          userid: user.userid,
          fullname: user.username,
          designation: 'HR Officer',
          emailaddress: user.email,
          isactive: true
        }
      });
      break;
    case 'ADMIN':
      await tx.adminprofile.create({
        data: {
          userid: user.userid,
          fullname: user.username,
          emailaddress: user.email,
          isactive: true
        }
      });
      break;
    case 'STAFF':
      await tx.staffprofile.create({
        data: {
          userid: user.userid,
          fullname: user.username,
          employeenumber: identifier,
          departmentid: departmentId || null,
          isactive: true
        }
      });
      break;
  }
};

export const ensureRoleProfile = async (userId: number) => {
  const userRecord = await prisma.user.findUnique({ where: { userid: userId } });
  if (!userRecord) return;

  let missing = false;
  switch (userRecord.role) {
    case 'FACULTY':
      const f = await prisma.faculty.findFirst({ where: { userid: userId } });
      if (!f) missing = true;
      break;
    case 'STUDENT':
      const s = await prisma.student.findFirst({ where: { userid: userId } });
      if (!s) missing = true;
      break;
    case 'HR':
      const h = await prisma.hrprofile.findFirst({ where: { userid: userId } });
      if (!h) missing = true;
      break;
    case 'ADMIN':
      const a = await prisma.adminprofile.findFirst({ where: { userid: userId } });
      if (!a) missing = true;
      break;
  }

  if (missing) {
    await prisma.$transaction(async (tx) => {
      const deptMember = await tx.departmentmember.findFirst({
        where: { userid: userId },
        include: { department: true }
      });
      const deptId = deptMember?.departmentid;
      const deptCode = deptMember?.department?.code;

      await createRoleProfile(tx, userRecord, deptId, deptCode);

      await createAuditEntry(userId, ProfileAuditAction.AUTO_PROFILE_RECREATED, 'user', userId, null, tx);
    });
  }
};

export const backfillProfiles = async () => {
  const users = await prisma.user.findMany({
    include: {
      departmentmember: {
        include: {
          department: true
        }
      }
    }
  });

  let backfilled = 0;

  for (const user of users) {
    let missing = false;
    switch (user.role) {
      case 'FACULTY':
        missing = !(await prisma.faculty.findFirst({ where: { userid: user.userid } }));
        break;
      case 'STUDENT':
        missing = !(await prisma.student.findFirst({ where: { userid: user.userid } }));
        break;
      case 'HR':
        missing = !(await prisma.hrprofile.findFirst({ where: { userid: user.userid } }));
        break;
      case 'ADMIN':
        missing = !(await prisma.adminprofile.findFirst({ where: { userid: user.userid } }));
        break;
    }

    if (missing) {
      await prisma.$transaction(async (tx) => {
        const deptId = user.departmentmember[0]?.departmentid;
        const deptCode = user.departmentmember[0]?.department?.code;
        await createRoleProfile(tx, user, deptId, deptCode);

        await createAuditEntry(1, ProfileAuditAction.PROFILE_BACKFILLED, 'user', user.userid, null, tx);
      });
      backfilled++;
    }
  }

  return backfilled;
};

export const validateProfileIntegrity = async (user: user) => {
  try {
    let profile: any = null;
    let identifierField: string | null = null;

    switch (user.role) {
      case 'FACULTY':
        profile = await prisma.faculty.findFirst({ where: { userid: user.userid } });
        identifierField = 'employeenumber';
        break;
      case 'STUDENT':
        profile = await prisma.student.findFirst({ where: { userid: user.userid } });
        identifierField = 'rollnumber';
        break;
      case 'HR':
        profile = await prisma.hrprofile.findFirst({ where: { userid: user.userid } });
        identifierField = 'employeenumber';
        break;
      case 'ADMIN':
        profile = await prisma.adminprofile.findFirst({ where: { userid: user.userid } });
        identifierField = 'employeenumber';
        break;
      case 'STAFF':
        profile = await prisma.staffprofile.findFirst({ where: { userid: user.userid } });
        identifierField = 'employeenumber';
        break;
    }

    if (!profile) {
      throw new Error(`Profile table missing for role: ${user.role}`);
    }

    if (identifierField) {
      const idVal = profile[identifierField] || user.identifier;
      if (!idVal) {
        throw new Error(`Identifier is missing for role: ${user.role}`);
      }

      const deptMember = await prisma.departmentmember.findFirst({
        where: { userid: user.userid },
        include: { department: true }
      });
      const deptCode = deptMember?.department?.code || 'UND';

      const isValid = validateIdentifier(idVal, user.role, deptCode);
      if (!isValid) {
        throw new Error(`Invalid identifier format. Got: ${idVal}`);
      }
    }

    return { valid: true };
  } catch (error: any) {
    await createAuditEntry(user.userid, ProfileAuditAction.PROFILE_VALIDATION_FAILED, 'user', user.userid, { error: error.message });
    return { valid: false, error: error.message };
  }
};
