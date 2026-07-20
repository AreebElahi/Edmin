import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../contracts/api.contracts.js';
import prisma from '../../config/prisma.js';
import { getCachedResponse, setCachedResponse, redisConnection } from "../../config/redis.js";

const clearSemesterCache = async () => {
    if (redisConnection && redisConnection.status === 'ready') {
        try {
            const keys = [
                ...(await redisConnection.keys('api:admin:semesters')),
                ...(await redisConnection.keys('api:semesters')),
                ...(await redisConnection.keys('user:profile:*:faculty:hod:courses')),
                ...(await redisConnection.keys('user:profile:*:faculty:supervisor:courses'))
            ];
            if (keys.length > 0) {
                await redisConnection.del(...keys);
            }
        } catch (e) {
            console.error('[Redis Cache] Failed to clear semester cache', e);
        }
    }
};

export const getSemestersHandler = async (req: Request, res: Response) => {
  try {
    const semesters = await prisma.semester.findMany({
      orderBy: { year: 'desc' }
    });
    return sendSuccess(res, semesters);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to fetch semesters');
  }
};

export const createSemesterHandler = async (req: Request, res: Response) => {
  try {
    const { name, year, startDate, endDate, durationWeeks } = req.body;
    if (!name || !year) {
      return sendError(res, 'Name and Year are required', 'BAD_REQUEST', 400);
    }

    let resolvedEndDate: Date | null = null;
    if (endDate) {
      resolvedEndDate = new Date(endDate);
    } else if (startDate) {
      const weeks = Number(durationWeeks) > 0 ? Number(durationWeeks) : 16;
      const start = new Date(startDate);
      resolvedEndDate = new Date(start.getTime() + weeks * 7 * 24 * 60 * 60 * 1000);
    }

    const newSemester = await prisma.semester.create({
      data: {
        name,
        year: Number(year),
        startdate: startDate ? new Date(startDate) : null,
        enddate: resolvedEndDate,
        status: 'UPCOMING',
        isactive: true
      }
    });

    await clearSemesterCache();

    return sendSuccess(res, newSemester, 'Operation completed successfully.', undefined, 201);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to create semester');
  }
};

export const rolloverSemesterHandler = async (req: Request, res: Response) => {
  try {
    const { targetSemesterId } = req.body;
    if (!targetSemesterId) {
      return sendError(res, 'Target Semester ID is required', 'BAD_REQUEST', 400);
    }

    const targetSemId = Number(targetSemesterId);

    // Run rollover inside a Prisma transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Mark all ONGOING semesters as COMPLETED
      await tx.semester.updateMany({
        where: { status: 'ONGOING' },
        data: { status: 'COMPLETED' }
      });

      // 2. Set the target semester as ONGOING
      const updated = await tx.semester.update({
        where: { semesterid: targetSemId },
        data: { status: 'ONGOING' }
      });

      return updated;
    });

    await clearSemesterCache();

    return sendSuccess(res, result);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to execute rollover');
  }
};

export const getSemesterCoursesHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return sendError(res, 'Semester ID is required', 'BAD_REQUEST', 400);
    }

    const courses = await prisma.courseoffering.findMany({
      where: { semesterid: Number(id) },
      include: {
        course: true,
        department: true,
        faculty: {
          include: { user: true }
        }
      },
      orderBy: { courseofferingid: 'asc' }
    });

    return sendSuccess(res, courses);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to fetch semester courses');
  }
};
