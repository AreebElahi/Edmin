import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../contracts/api.contracts.js';
import prisma from '../../config/prisma.js';
import * as reportsService from '../../services/admin/reports.service.js';
import PDFDocument from 'pdfkit';
import { redisConnection, acquireLock, releaseLock } from '../../config/redis.js';
import { getCachedResponse, setCachedResponse } from "../../config/redis.js";

export const getAttendanceReportHandler = async (req: Request, res: Response) => {
  try {
    const cacheKey = 'api:admin:reports:attendance';

    if (redisConnection && redisConnection.status === 'ready') {
      const cached = await redisConnection.get(cacheKey);
      if (cached) {
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).send(cached);
      }
    }

    let isLeader = false;
    if (redisConnection && redisConnection.status === 'ready') {
      isLeader = await acquireLock(cacheKey, 5);
    } else {
      isLeader = true;
    }

    if (isLeader) {
      try {
        const formatted = await reportsService.getAttendanceReport();

        const fullResponse = { success: true, data: formatted };

        if (redisConnection && redisConnection.status === 'ready') {
          await redisConnection.setex(cacheKey, 30, JSON.stringify(fullResponse));
          await releaseLock(cacheKey);
        }

        return sendSuccess(res, (fullResponse as any).data || fullResponse, undefined, undefined, 200);
      } catch (error) {
        if (redisConnection && redisConnection.status === 'ready') {
          await releaseLock(cacheKey);
        }
        throw error;
      }
    } else {
      for (let attempt = 0; attempt < 10; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        const cached = await redisConnection!.get(cacheKey);
        if (cached) {
          res.setHeader('Content-Type', 'application/json');
          return res.status(200).send(cached);
        }
      }
      return sendSuccess(res, [], undefined, undefined, 200);
    }
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to fetch attendance report');
  }
};

export const getEnrollmentReportHandler = async (req: Request, res: Response) => {
  try {
    const cacheKey = 'api:admin:reports:enrollment';

    if (redisConnection && redisConnection.status === 'ready') {
      const cached = await redisConnection.get(cacheKey);
      if (cached) {
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).send(cached);
      }
    }

    let isLeader = false;
    if (redisConnection && redisConnection.status === 'ready') {
      isLeader = await acquireLock(cacheKey, 5);
    } else {
      isLeader = true;
    }

    if (isLeader) {
      try {
        const formatted = await reportsService.getEnrollmentReport();

        const fullResponse = { success: true, data: formatted };

        if (redisConnection && redisConnection.status === 'ready') {
          await redisConnection.setex(cacheKey, 30, JSON.stringify(fullResponse));
          await releaseLock(cacheKey);
        }

        return sendSuccess(res, (fullResponse as any).data || fullResponse, undefined, undefined, 200);
      } catch (error) {
        if (redisConnection && redisConnection.status === 'ready') {
          await releaseLock(cacheKey);
        }
        throw error;
      }
    } else {
      for (let attempt = 0; attempt < 10; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        const cached = await redisConnection!.get(cacheKey);
        if (cached) {
          res.setHeader('Content-Type', 'application/json');
          return res.status(200).send(cached);
        }
      }
      return sendSuccess(res, [], undefined, undefined, 200);
    }
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to fetch enrollment report');
  }
};

export const getLeaveReportSummaryHandler = async (req: Request, res: Response) => {
  try {
    const cacheKey = 'api:admin:reports:leaves';

    if (redisConnection && redisConnection.status === 'ready') {
      const cached = await redisConnection.get(cacheKey);
      if (cached) {
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).send(cached);
      }
    }

    let isLeader = false;
    if (redisConnection && redisConnection.status === 'ready') {
      isLeader = await acquireLock(cacheKey, 5);
    } else {
      isLeader = true;
    }

    if (isLeader) {
      try {
        const data = await reportsService.getLeaveReportSummary();

        const fullResponse = {
          success: true,
          data
        };

        if (redisConnection && redisConnection.status === 'ready') {
          await redisConnection.setex(cacheKey, 30, JSON.stringify(fullResponse));
          await releaseLock(cacheKey);
        }

        return sendSuccess(res, (fullResponse as any).data || fullResponse, undefined, undefined, 200);
      } catch (error) {
        if (redisConnection && redisConnection.status === 'ready') {
          await releaseLock(cacheKey);
        }
        throw error;
      }
    } else {
      for (let attempt = 0; attempt < 10; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        const cached = await redisConnection!.get(cacheKey);
        if (cached) {
          res.setHeader('Content-Type', 'application/json');
          return res.status(200).send(cached);
        }
      }
      return sendSuccess(res, {
                summary: { pending: 0, approved: 0, rejected: 0 },
                list: [],
              }, undefined, undefined, 200);
    }
  } catch (error: any) {
    return sendSuccess(res, {
      summary: { pending: 0, approved: 0, rejected: 0 },
      list: [],
      notice: 'Leave data not available — backend integration pending.'
    });
  }
};

export const getGradeDistributionReportHandler = async (req: Request, res: Response) => {
  try {
    const cacheKey = 'api:admin:reports:grades';

    if (redisConnection && redisConnection.status === 'ready') {
      const cached = await redisConnection.get(cacheKey);
      if (cached) {
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).send(cached);
      }
    }

    let isLeader = false;
    if (redisConnection && redisConnection.status === 'ready') {
      isLeader = await acquireLock(cacheKey, 5);
    } else {
      isLeader = true;
    }

    if (isLeader) {
      try {
        const formatted = await reportsService.getGradeDistributionReport();

        const fullResponse = { success: true, data: formatted };

        if (redisConnection && redisConnection.status === 'ready') {
          await redisConnection.setex(cacheKey, 30, JSON.stringify(fullResponse));
          await releaseLock(cacheKey);
        }

        return sendSuccess(res, (fullResponse as any).data || fullResponse, undefined, undefined, 200);
      } catch (error) {
        if (redisConnection && redisConnection.status === 'ready') {
          await releaseLock(cacheKey);
        }
        throw error;
      }
    } else {
      for (let attempt = 0; attempt < 10; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        const cached = await redisConnection!.get(cacheKey);
        if (cached) {
          res.setHeader('Content-Type', 'application/json');
          return res.status(200).send(cached);
        }
      }
      return sendSuccess(res, [], undefined, undefined, 200);
    }
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to fetch grade distribution report');
  }
};

export const exportReportsHandler = async (req: Request, res: Response) => {
  try {
    const format = typeof req.query.format === 'string' ? req.query.format.toUpperCase() : 'CSV';

    const { studentCount, facultyCount, courseCount, openTickets, departments } = await reportsService.getExportReportData();

    if (format === 'CSV') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename=InstitutionalReport.csv');

      const lines = [
        'Report Type,Metric,Value',
        `Academic,Active Students,${studentCount}`,
        `Academic,Active Faculty,${facultyCount}`,
        `Academic,Active Courses,${courseCount}`,
        `Support,Open Tickets,${openTickets}`,
        `Departments,Total Active,${departments.length}`,
        ...departments.map((d: any) => `Department,${d.name} (${d.code}),Active`),
      ];

      return res.status(200).send(lines.join('\r\n'));
    } else {
      const doc = new PDFDocument();
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=InstitutionalReport.pdf');
      
      doc.pipe(res);
      
      doc.fontSize(24).text('Edmin Institutional Report', { align: 'center' });
      doc.moveDown();
      
      doc.fontSize(12).text(`Date Generated: ${new Date().toLocaleString()}`);
      doc.moveDown();
      
      doc.fontSize(16).text('Academic Summary', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12).text(`Active Students: ${studentCount}`);
      doc.text(`Active Faculty: ${facultyCount}`);
      doc.text(`Active Courses: ${courseCount}`);
      doc.text(`Open Support Tickets: ${openTickets}`);
      doc.text(`Active Departments: ${departments.length}`);
      doc.moveDown();
      
      doc.fontSize(16).text('Departments List', { underline: true });
      doc.moveDown(0.5);
      departments.forEach((dept: any) => {
        doc.fontSize(12).text(`- ${dept.name} (${dept.code})`);
      });
      
      doc.end();
      return;
    }
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to export reports');
  }
};
