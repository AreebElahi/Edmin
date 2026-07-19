import { Request, Response } from 'express';
import prisma from '../config/prisma.js';
import catchAsync from '../utils/catchAsync.js';
import { sendSuccess, sendError } from "../contracts/api.contracts.js";
import { getCachedResponse, setCachedResponse } from "../config/redis.js";

// Submit Daily Activity Report
export const submitActivityReport = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId;
  const { date, summary, activities } = req.body; // activities: { title: string, detail: string }[]

  const faculty = await prisma.faculty.findFirst({ where: { userid: userId, isactive: true } });
  if (!faculty) return sendError(res, 'Internal error', [], 404);
  if (!faculty.departmentid) return sendError(res, 'Internal error', [], 400);

  const report = await prisma.dailyactivityreport.create({
    data: {
      facultyid: faculty.facultyid,
      departmentid: faculty.departmentid,
      reportdate: new Date(date),
      summary: summary || 'Daily Activity Report',
      status: 'SUBMITTED',
      dailyreportactivity: {
        create: activities.map((a: any, index: number) => ({
          title: a.title,
          detail: a.detail,
          sequence: index
        }))
      }
    },
    include: { dailyreportactivity: true }
  });

  sendSuccess(res, report, undefined, undefined, 201);
});

// Get My Activity Reports
export const getMyActivityReports = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId;

  const faculty = await prisma.faculty.findFirst({ where: { userid: userId, isactive: true } });
  if (!faculty) return sendError(res, 'Internal error', [], 404);

  const reports = await prisma.dailyactivityreport.findMany({
    where: { facultyid: faculty.facultyid },
    include: { dailyreportactivity: true },
    orderBy: { reportdate: 'desc' }
  });

  sendSuccess(res, reports, undefined, undefined, 200);
});
