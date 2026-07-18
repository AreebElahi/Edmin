import { Request, Response } from 'express';
import prisma from '../../config/prisma.js';
import { parseNumber } from '../../utils/queryParser.js';
import { createAuditEntry } from '../../services/workflows/shared/audit.service.js';
import { 
  getAllDepartments, 
  createDepartment, 
  updateDepartment, 
  mapCourseToDepartment,
  deleteDepartment
} from '../../services/admin/department.service.js';
import { redisConnection } from '../../config/redis.js';
import { sendSuccess, sendError } from '../../contracts/api.contracts.js';
import { redisConnection, acquireLock, releaseLock } from '../../config/redis.js';

const invalidateDepartmentsCache = async () => {
  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.del('api:admin:departments');
  }
};

export const getDepartmentsHandler = async (req: Request, res: Response) => {
  try {
    const cacheKey = `api:admin:departments`;

    if (redisConnection && redisConnection.status === 'ready') {
      const cached = await redisConnection.get(cacheKey);
      if (cached) {
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).send(cached);
      }
    }

    // Stampede protection: Acquire lock so concurrent requests wait instead of hitting the DB
    let isLeader = false;
    if (redisConnection && redisConnection.status === 'ready') {
      isLeader = await acquireLock(cacheKey, 5); // 5 seconds lock
    } else {
      isLeader = true;
    }

    if (isLeader) {
      try {
        // Run database calls in parallel to eliminate sequential delays
        const [departments, studentsWithSections, offeringsWithSections] = await Promise.all([
          getAllDepartments(),
          prisma.student.findMany({
            where: { isactive: true, sectionid: { not: null } },
            select: { studentid: true, sectionid: true }
          }),
          prisma.courseoffering.findMany({
            where: { isactive: true, sectionid: { not: null } },
            include: { course: true }
          })
        ]);

        // Group students by sectionid
        const studentCountMap = new Map<number, number>();
        for (const student of studentsWithSections) {
          if (student.sectionid) {
            studentCountMap.set(student.sectionid, (studentCountMap.get(student.sectionid) || 0) + 1);
          }
        }

        // Group courses by sectionid
        const coursesMap = new Map<number, string[]>();
        for (const offering of offeringsWithSections) {
          if (offering.sectionid && offering.course) {
            const list = coursesMap.get(offering.sectionid) || [];
            list.push(`${offering.course.code} ${offering.course.name}`);
            coursesMap.set(offering.sectionid, list);
          }
        }
        
        // Map to frontend expected format
        const mappedDepartments = departments.map(d => ({
          id: d.departmentid,
          departmentid: d.departmentid, // For backward compatibility with users module
          name: d.name,
          code: d.code,
          hod: d.user?.username || 'Not Assigned',
          supervisor: d.supervisor?.username || 'Not Assigned',
          status: d.isactive ? 'Active' : 'Inactive',
          sections: d.section.map(s => ({
            id: s.sectionid,
            name: s.name,
            students: studentCountMap.get(s.sectionid) || 0,
            courses: coursesMap.get(s.sectionid) || []
          })),
          courses: d.departmentcourse.map(dc => ({
            id: dc.course.code, // using code as frontend id
            name: dc.course.name,
            credits: dc.course.credits
          }))
        }));

        const fullResponse = { success: true, data: mappedDepartments };

        if (redisConnection && redisConnection.status === 'ready') {
          const serialized = JSON.stringify(fullResponse);
          await redisConnection.setex(cacheKey, 30, serialized); // Cache for 30 seconds
          await releaseLock(cacheKey);
        }

        return res.status(200).json(fullResponse);
      } catch (error) {
        if (redisConnection && redisConnection.status === 'ready') {
          await releaseLock(cacheKey);
        }
        throw error;
      }
    } else {
      // If not the leader, poll Redis for the cached value (up to 10 attempts, 100ms intervals)
      for (let attempt = 0; attempt < 10; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        const cached = await redisConnection!.get(cacheKey);
        if (cached) {
          res.setHeader('Content-Type', 'application/json');
          return res.status(200).send(cached);
        }
      }
      // Fallback direct execution
      return res.status(200).json({ success: true, data: [] });
    }
  } catch (error: any) {
    console.error('Error fetching departments:', error);
    return sendError(res, error.message);
  }
};

export const createDepartmentHandler = async (req: Request, res: Response) => {
  try {
    const { name, hodid, supervisorid } = req.body;

    if (!name) {
      return sendError(res, 'Department name is required', 'BAD_REQUEST', 400);
    }

    const adminId = (req as any).user?.userid || 1;
    
    // Generate a code from name e.g. "Computer Science" -> "CS"
    const code = name.split(' ').map((word: string) => word[0].toUpperCase()).join('').substring(0, 5);

    const dept = await createDepartment({
      name,
      code,
      hodid: hodid ? parseInt(hodid, 10) : undefined,
      supervisorid: supervisorid ? parseInt(supervisorid, 10) : undefined
    }, adminId);

    await invalidateDepartmentsCache();

    return sendSuccess(res, dept, 201);
  } catch (error: any) {
    console.error('Error creating department:', error);
    return sendError(res, error.message);
  }
};

export const updateDepartmentHandler = async (req: Request, res: Response) => {
  try {
    const departmentId = parseNumber(req.params.id, NaN);
    if (isNaN(departmentId)) {
      return sendError(res, 'Invalid department ID', 'BAD_REQUEST', 400);
    }

    const adminId = (req as any).user?.userid || 1;
    
    // Convert string 'null' to actual null, empty string to null, undefined remains undefined
    const parsedPayload = { ...req.body };
    if (parsedPayload.hodid === 'null' || parsedPayload.hodid === '') parsedPayload.hodid = null;
    else if (typeof parsedPayload.hodid === 'string') parsedPayload.hodid = parseInt(parsedPayload.hodid, 10);
    
    if (parsedPayload.supervisorid === 'null' || parsedPayload.supervisorid === '') parsedPayload.supervisorid = null;
    else if (typeof parsedPayload.supervisorid === 'string') parsedPayload.supervisorid = parseInt(parsedPayload.supervisorid, 10);
    
    if (typeof parsedPayload.isactive === 'string') {
      parsedPayload.isactive = parsedPayload.isactive === 'true';
    }

    const dept = await updateDepartment(departmentId, parsedPayload, adminId);

    await invalidateDepartmentsCache();

    return sendSuccess(res, dept);
  } catch (error: any) {
    console.error('Error updating department:', error);
    return sendError(res, error.message);
  }
};

export const deleteDepartmentHandler = async (req: Request, res: Response) => {
  try {
    const departmentId = parseNumber(req.params.id, NaN);
    if (isNaN(departmentId)) {
      return sendError(res, 'Invalid department ID', 'BAD_REQUEST', 400);
    }

    const adminId = (req as any).user?.userid || 1;
    const dept = await deleteDepartment(departmentId, adminId);

    await invalidateDepartmentsCache();

    return sendSuccess(res, dept);
  } catch (error: any) {
    console.error('Error deleting department:', error);
    return sendError(res, error.message);
  }
};

export const mapCourseToDepartmentHandler = async (req: Request, res: Response) => {
  try {
    const departmentId = parseNumber(req.params.id, NaN);
    const { courseid } = req.body;

    if (isNaN(departmentId)) {
      return sendError(res, 'Invalid department ID', 'BAD_REQUEST', 400);
    }
    if (!courseid) {
      return sendError(res, 'courseid is required', 'BAD_REQUEST', 400);
    }

    const adminId = (req as any).user?.userid || 1;
    const mapping = await mapCourseToDepartment(departmentId, { courseid: parseInt(courseid, 10) }, adminId);

    await invalidateDepartmentsCache();

    return sendSuccess(res, mapping, 201);
  } catch (error: any) {
    console.error('Error mapping course:', error);
    return sendError(res, error.message);
  }
};

export const createSectionHandler = async (req: Request, res: Response) => {
  try {
    const departmentId = parseNumber(req.params.id, NaN);
    if (isNaN(departmentId)) {
      return sendError(res, 'Invalid department ID', 'BAD_REQUEST', 400);
    }

    const dept = await prisma.department.findUnique({
      where: { departmentid: departmentId },
      include: { section: true }
    });

    if (!dept) {
      return sendError(res, 'Department not found', 'NOT_FOUND', 404);
    }

    // Name the section Section A, B, C, etc.
    const activeSectionsCount = dept.section.filter(s => s.isactive).length;
    const letter = String.fromCharCode(65 + activeSectionsCount); // A, B, C...
    const name = `Section ${letter}`;

    // Create the section
    const newSection = await prisma.section.create({
      data: {
        name,
        departmentid: departmentId,
        capacity: 50,
        isactive: true,
        status: 'ACTIVE'
      }
    });

    // Re-balance students of this department across all active sections
    const allActiveSections = await prisma.section.findMany({
      where: { departmentid: departmentId, isactive: true },
      orderBy: { name: 'asc' }
    });

    const allActiveStudents = await prisma.student.findMany({
      where: { departmentid: departmentId, isactive: true },
      orderBy: { rollnumber: 'asc' }
    });

    if (allActiveSections.length > 0 && allActiveStudents.length > 0) {
      for (let i = 0; i < allActiveStudents.length; i++) {
        const student = allActiveStudents[i];
        const section = allActiveSections[i % allActiveSections.length];
        await prisma.student.update({
          where: { studentid: student.studentid },
          data: { sectionid: section.sectionid }
        });
      }
    }

    // Log audit
    const adminId = (req as any).user?.userid || (req as any).user?.id || 1;
    await createAuditEntry(adminId, 'SECTION_CREATION', 'section', newSection.sectionid, null);

    await invalidateDepartmentsCache();

    return sendSuccess(res, {
      section: newSection,
      message: `Section ${letter} created and ${allActiveStudents.length} students re-balanced across ${allActiveSections.length} sections.`
    }, 201);
  } catch (error: any) {
    console.error('Error creating section:', error);
    return sendError(res, error.message);
  }
};

export const assignDepartmentManagersHandler = async (req: Request, res: Response) => {
  try {
    const departmentId = parseNumber(req.params.id, NaN);
    if (isNaN(departmentId)) {
      return sendError(res, 'Invalid department ID', 'BAD_REQUEST', 400);
    }
    const { hodId, supervisorId } = req.body;

    const parsedHodId = (hodId === null || hodId === undefined || hodId === '') ? null : parseInt(hodId as any, 10);
    const parsedSupervisorId = (supervisorId === null || supervisorId === undefined || supervisorId === '') ? null : parseInt(supervisorId as any, 10);

    const updated = await prisma.department.update({
      where: { departmentid: departmentId },
      data: {
        hodid: parsedHodId,
        supervisorid: parsedSupervisorId
      }
    });

    const adminId = (req as any).user?.userid || (req as any).user?.userId || 1;
    await createAuditEntry(adminId, 'ASSIGN_MANAGERS', 'department', departmentId, { hodId: parsedHodId, supervisorId: parsedSupervisorId });

    await invalidateDepartmentsCache();

    return sendSuccess(res, updated);
  } catch (error: any) {
    console.error('Error assigning department managers:', error);
    return sendError(res, error.message);
  }
};
