import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../contracts/api.contracts.js';
import prisma from '../../config/prisma.js';

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

    return sendSuccess(res, newSemester, 201);
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

    return sendSuccess(res, result);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to execute rollover');
  }
};
