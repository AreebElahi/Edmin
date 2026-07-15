import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../contracts/api.contracts.js';
import prisma from '../../config/prisma.js';
import PDFDocument from 'pdfkit';

export const getAttendanceReportHandler = async (req: Request, res: Response) => {
  try {
    // Dynamic attendance aggregates from prisma
    const departments = await prisma.department.findMany({
      include: {
        student: {
          include: {
            attendance: true
          }
        }
      }
    });

    const formatted = departments.map(dept => {
      const allAttendance = dept.student.flatMap(s => s.attendance);
      const total = allAttendance.length;
      const presents = allAttendance.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
      const pct = total > 0 ? Number(((presents / total) * 100).toFixed(1)) : 0.0;

      let defaultersCount = 0;
      dept.student.forEach(s => {
        const sAttendance = s.attendance;
        if (sAttendance.length > 0) {
          const sTotal = sAttendance.length;
          const sPresents = sAttendance.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
          const sPct = (sPresents / sTotal) * 100;
          if (sPct < 75.0) {
            defaultersCount++;
          }
        }
      });

      return {
        unit: `${dept.name} (${dept.code})`,
        totalStudents: dept.student.length,
        avgAttendance: total > 0 ? `${pct}%` : 'N/A',
        defaulters: `${defaultersCount} students`
      };
    });

    return sendSuccess(res, formatted);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to fetch attendance report');
  }
};

export const getEnrollmentReportHandler = async (req: Request, res: Response) => {
  try {
    const offerings = await prisma.courseoffering.findMany({
      where: { isactive: true },
      include: {
        course: true,
        courseenrollment: {
          where: { status: 'ENROLLED' }
        }
      },
      take: 10
    });

    const formatted = offerings.map(offering => {
      const enrolled = offering.courseenrollment.length;
      const capacity = offering.capacity || 60;
      return {
        code: offering.course?.code || 'N/A',
        name: offering.course?.name || 'Unknown Course',
        dept: 'Academics',
        enrolled,
        capacity
      };
    });

    return sendSuccess(res, formatted);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to fetch enrollment report');
  }
};

export const getLeaveReportSummaryHandler = async (req: Request, res: Response) => {
  try {
    // 1. Get real counts using groupBy
    const grouped = await prisma.leaverequest.groupBy({
      by: ['status'],
      _count: {
        _all: true
      }
    });

    let pending = 0;
    let approved = 0;
    let rejected = 0;

    grouped.forEach((g: any) => {
      if (g.status === 'PENDING') pending = g._count._all;
      if (g.status === 'APPROVED') approved = g._count._all;
      if (g.status === 'REJECTED') rejected = g._count._all;
    });

    // 2. Fetch the latest 10 requests for the list view
    const latestRequests = await prisma.leaverequest.findMany({
      orderBy: { createdat: 'desc' },
      take: 10,
      include: {
        user: { select: { username: true } }
      }
    });

    // Calculate days from startdate/enddate
    const list = latestRequests.map((l: any) => {
      const start = l.startdate ? new Date(l.startdate) : null;
      const end = l.enddate ? new Date(l.enddate) : null;
      const days = start && end ? Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1 : 1;
      return {
        applicant: l.user?.username || 'Unknown',
        department: 'N/A',
        type: l.leavetype || 'Leave',
        days,
        status: l.status ? l.status.charAt(0) + l.status.slice(1).toLowerCase() : 'Unknown',
        startDate: l.startdate,
        endDate: l.enddate,
      };
    });

    return sendSuccess(res, {
      summary: { pending, approved, rejected },
      list,
    });
  } catch (error: any) {
    // If the leaverequest table doesn't exist or has different column names
    return sendSuccess(res, {
      summary: { pending: 0, approved: 0, rejected: 0 },
      list: [],
      notice: 'Leave data not available — backend integration pending.'
    });
  }
};

export const getGradeDistributionReportHandler = async (req: Request, res: Response) => {
  try {
    // Pull grade distribution stats from real courseenrollment records
    const courses = await prisma.course.findMany({
      where: { isactive: true },
      take: 5,
    });

    const courseIds = courses.map(c => c.courseid);

    // Fetch all enrollments for these courses in one query
    const enrollments = await prisma.courseenrollment.findMany({
      where: {
        courseoffering: { courseid: { in: courseIds } },
        grade: { not: null },
      },
      select: { grade: true, courseoffering: { select: { courseid: true } } },
      take: 200 * courses.length, // approximate the per-course limit
    });

    // Group enrollments by course
    const enrollmentsByCourse = enrollments.reduce((acc: any, e: any) => {
      const cid = e.courseoffering.courseid;
      if (!acc[cid]) acc[cid] = [];
      acc[cid].push(e);
      return acc;
    }, {});

    const formatted = courses.map((c) => {
      const courseEnrollments = enrollmentsByCourse[c.courseid] || [];
      const grades = { A: 0, B: 0, C: 0, D: 0, F: 0 };
      
      for (const e of courseEnrollments) {
        const g = (e.grade || '').toUpperCase();
        if (g.startsWith('A')) grades.A++;
        else if (g.startsWith('B')) grades.B++;
        else if (g.startsWith('C')) grades.C++;
        else if (g.startsWith('D')) grades.D++;
        else if (g === 'F' || g === 'FAIL') grades.F++;
      }

      return {
        course: `${c.code} ${c.name}`,
        grades,
        totalRecords: courseEnrollments.length,
      };
    });

    return sendSuccess(res, formatted);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to fetch grade distribution report');
  }
};

export const exportReportsHandler = async (req: Request, res: Response) => {
  try {
    const format = typeof req.query.format === 'string' ? req.query.format.toUpperCase() : 'CSV';

    // Gather real data
    const [studentCount, facultyCount, courseCount, openTickets] = await Promise.all([
      prisma.student.count({ where: { isactive: true } }),
      prisma.faculty.count({ where: { isactive: true } }),
      prisma.course.count({ where: { isactive: true } }),
      prisma.ticket.count({ where: { status: 'OPEN' } }),
    ]);

    const departments = await prisma.department.findMany({
      where: { isactive: true },
      select: { name: true, code: true },
    });

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
        ...departments.map(d => `Department,${d.name} (${d.code}),Active`),
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
      departments.forEach(dept => {
        doc.fontSize(12).text(`- ${dept.name} (${dept.code})`);
      });
      
      doc.end();
      return;
    }
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to export reports');
  }
};
