import { Request, Response } from 'express';
import prisma from '../config/prisma.js';
import catchAsync from '../utils/catchAsync.js';

// Submit Daily Activity Report
export const submitActivityReport = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId;
  const { date, summary, activities } = req.body; // activities: { title: string, detail: string }[]

  const faculty = await prisma.faculty.findFirst({ where: { userid: userId, isactive: true } });
  if (!faculty) return res.status(404).json({ success: false, error: 'Faculty profile not found' });
  if (!faculty.departmentid) return res.status(400).json({ success: false, error: 'Faculty does not belong to a department' });

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

  res.status(201).json({ success: true, data: report });
});

// Get My Activity Reports
export const getMyActivityReports = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId;

  const faculty = await prisma.faculty.findFirst({ where: { userid: userId, isactive: true } });
  if (!faculty) return res.status(404).json({ success: false, error: 'Faculty profile not found' });

  const reports = await prisma.dailyactivityreport.findMany({
    where: { facultyid: faculty.facultyid },
    include: { dailyreportactivity: true },
    orderBy: { reportdate: 'desc' }
  });

  res.status(200).json({ success: true, data: reports });
});
