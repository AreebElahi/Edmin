import prisma from '../../config/prisma.js';
import { createAuditEntry } from '../workflows/shared/audit.service.js';


export interface CreateDepartmentPayload {
  name: string;
  code: string;
  hodid?: number | null;
  supervisorid?: number | null;
  isactive?: boolean;
}

export interface MapCoursePayload {
  courseid: number;
}

export const getAllDepartments = async () => {
  return await prisma.department.findMany({
    include: {
      user: {
        select: { userid: true, username: true, email: true } // HOD
      },
      supervisor: {
        select: { userid: true, username: true, email: true } // Supervisor
      },
      section: true,
      departmentcourse: {
        include: {
          course: true
        }
      }
    },
    orderBy: { name: 'asc' }
  });
};

export const createDepartment = async (payload: CreateDepartmentPayload, adminId: number) => {
  const trimmedName = payload.name.trim();

  const existing = await prisma.department.findFirst({
    where: { 
      name: { equals: trimmedName, mode: 'insensitive' }
    }
  });
  
  if (existing) {
    throw new Error(`Department name already exists (${existing.isactive ? 'Active' : 'Inactive'})`);
  }

  const dept = await prisma.department.create({
    data: {
      name: trimmedName,
      code: payload.code,
      hodid: payload.hodid,
      supervisorid: payload.supervisorid,
      isactive: true,
    }
  });

  await createAuditEntry(adminId, 'DEPARTMENT_CREATION', 'department', dept.departmentid, null);

  return dept;
};

export const updateDepartment = async (departmentId: number, payload: Partial<CreateDepartmentPayload>, adminId: number) => {
  const existing = await prisma.department.findUnique({
    where: { departmentid: departmentId }
  });

  if (!existing) {
    throw new Error('Department not found');
  }

  let finalName = existing.name;
  if (payload.name) {
    finalName = payload.name.trim();
    if (finalName.toLowerCase() !== existing.name.toLowerCase()) {
      const nameExists = await prisma.department.findFirst({
        where: { 
          name: { equals: finalName, mode: 'insensitive' },
          departmentid: { not: departmentId } 
        }
      });
      if (nameExists) throw new Error(`Department name already exists (${nameExists.isactive ? 'Active' : 'Inactive'})`);
    }
  }

  const updatedDept = await prisma.department.update({
    where: { departmentid: departmentId },
    data: {
      name: finalName,
      code: payload.code,
      hodid: payload.hodid,
      supervisorid: payload.supervisorid,
      isactive: payload.isactive !== undefined ? payload.isactive : existing.isactive,
    }
  });

  await createAuditEntry(adminId, 'DEPARTMENT_UPDATE', 'department', updatedDept.departmentid, null);

  return updatedDept;
};

export const deleteDepartment = async (departmentId: number, adminId: number) => {
  const existing = await prisma.department.findUnique({
    where: { departmentid: departmentId },
    include: {
      section: true,
      departmentcourse: true
    }
  });

  if (!existing || !existing.isactive) {
    throw new Error('Department not found or already deleted');
  }

  // Safe Mode: Prevent deletion if dependencies exist
  if (existing.section.length > 0 || existing.departmentcourse.length > 0) {
    throw new Error('Cannot delete department with active sections or mapped courses');
  }

  const deletedDept = await prisma.department.update({
    where: { departmentid: departmentId },
    data: { isactive: false }
  });

  await createAuditEntry(adminId, 'DEPARTMENT_DELETION', 'department', deletedDept.departmentid, null);

  return deletedDept;
};

export const mapCourseToDepartment = async (departmentId: number, payload: MapCoursePayload, adminId: number) => {
  const dept = await prisma.department.findUnique({ where: { departmentid: departmentId } });
  if (!dept) throw new Error('Department not found');

  const course = await prisma.course.findUnique({ where: { courseid: payload.courseid } });
  if (!course) throw new Error('Course not found');

  const existingMapping = await prisma.departmentcourse.findFirst({
    where: { departmentid: departmentId, courseid: payload.courseid }
  });

  if (existingMapping) {
    throw new Error('Course already mapped to this department');
  }

  const mapping = await prisma.departmentcourse.create({
    data: {
      departmentid: departmentId,
      courseid: payload.courseid
    }
  });

  await createAuditEntry(adminId, 'DEPARTMENT_COURSE_MAPPING', 'departmentcourse', departmentId, null);

  return mapping;
};
