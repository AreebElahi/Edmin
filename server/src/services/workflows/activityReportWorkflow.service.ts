import prisma from '../../config/prisma.js';
import { createAuditEntry } from './shared/audit.service.js';
import { emitWorkflowNotification } from './shared/notification.service.js';
import { validateStateTransition } from './shared/transitionValidator.service.js';

const ALLOWED_TRANSITIONS = {
  SUBMITTED: ['PENDING_SUPERVISOR', 'PENDING_HOD', 'APPROVED', 'REJECTED', 'ESCALATED', 'ARCHIVED'],
  PENDING_SUPERVISOR: ['PENDING_HOD', 'APPROVED', 'REJECTED', 'ESCALATED', 'ARCHIVED'],
  PENDING_HOD: ['APPROVED', 'REJECTED', 'ESCALATED', 'ARCHIVED'],
  APPROVED: ['ARCHIVED'],
  REJECTED: ['ARCHIVED'],
  ESCALATED: ['PENDING_HOD', 'APPROVED', 'REJECTED', 'ARCHIVED'],
  ARCHIVED: []
};

export const createActivityReport = async (
  userId: number,
  reportDate: Date,
  summary: string,
  activities: { title: string; detail: string; sequence: number }[]
) => {
  return await prisma.$transaction(async (tx) => {
    // Find faculty
    const faculty = await tx.faculty.findFirst({
      where: { userid: userId }
    });

    if (!faculty) throw new Error('Faculty profile not found');
    if (!faculty.departmentid) throw new Error('Faculty must belong to a department to submit reports');

    // Create daily activity report
    const report = await tx.dailyactivityreport.create({
      data: {
        facultyid: faculty.facultyid,
        departmentid: faculty.departmentid,
        reportdate: new Date(reportDate),
        summary,
        status: 'PENDING_SUPERVISOR'
      }
    });

    // Create report activity details
    for (const act of activities) {
      await tx.dailyreportactivity.create({
        data: {
          reportid: report.dailyactivityreportid,
          title: act.title,
          detail: act.detail,
          sequence: act.sequence
        }
      });
    }

    // Create Audit Log
    await createAuditEntry(userId, 'SUBMIT', 'dailyactivityreport', report.dailyactivityreportid, {
      oldStatus: null,
      newStatus: 'PENDING_SUPERVISOR'
    });

    // Notify Supervisor
    const dept = await tx.department.findUnique({
      where: { departmentid: faculty.departmentid }
    });

    if (dept?.supervisorid) {
      await emitWorkflowNotification(
        dept.supervisorid,
        'Daily Activity Report Submitted',
        `Faculty member ${faculty.fullname || faculty.employeenumber} has submitted a daily activity report for ${new Date(reportDate).toLocaleDateString()}.`,
        'REPORT',
        `/dashboard/faculty/approvals`
      );
    }

    return report;
  });
};

export const getActivityReports = async (userId: number, role: string) => {
  if (role === 'FACULTY') {
    // If HOD or Supervisor, fetch department reports
    const managedDepts = await prisma.department.findMany({
      where: {
        OR: [
          { supervisorid: userId },
          { hodid: userId }
        ]
      }
    });

    if (managedDepts.length > 0) {
      const deptIds = managedDepts.map(d => d.departmentid);
      return await prisma.dailyactivityreport.findMany({
        where: {
          departmentid: { in: deptIds }
        },
        include: {
          faculty: {
            include: { user: true }
          },
          dailyreportactivity: true
        },
        orderBy: { reportdate: 'desc' }
      });
    }

    // Otherwise, fetch own reports
    const faculty = await prisma.faculty.findFirst({
      where: { userid: userId }
    });

    if (!faculty) return [];

    return await prisma.dailyactivityreport.findMany({
      where: { facultyid: faculty.facultyid },
      include: {
        faculty: {
          include: { user: true }
        },
        dailyreportactivity: true
      },
      orderBy: { reportdate: 'desc' }
    });
  }

  // Admin sees all
  if (role === 'ADMIN') {
    return await prisma.dailyactivityreport.findMany({
      include: {
        faculty: {
          include: { user: true }
        },
        dailyreportactivity: true
      },
      orderBy: { reportdate: 'desc' }
    });
  }

  return [];
};

export const approveActivityReport = async (
  reportId: number,
  approverUserId: number,
  approverRole: string,
  comment = 'Approved'
) => {
  return await prisma.$transaction(async (tx) => {
    const report = await tx.dailyactivityreport.findUnique({
      where: { dailyactivityreportid: reportId },
      include: {
        faculty: {
          include: { user: true }
        }
      }
    });

    if (!report) throw new Error('Daily activity report not found');

    let nextStatus: any = report.status;

    if (approverRole === 'FACULTY') {
      const dept = await tx.department.findUnique({
        where: { departmentid: report.departmentid }
      });

      const approverFaculty = await tx.faculty.findUnique({
        where: { userid: approverUserId }
      });

      if (dept?.supervisorid === approverFaculty?.facultyid && report.status === 'PENDING_SUPERVISOR') {
        nextStatus = 'PENDING_HOD';
      } else if (dept?.hodid === approverFaculty?.facultyid && report.status === 'PENDING_HOD') {
        nextStatus = 'APPROVED';
      } else {
        throw new Error('You do not have permission to approve this report in its current state');
      }
    } else if (approverRole === 'ADMIN') {
      nextStatus = 'APPROVED';
    } else {
      throw new Error('Unauthorized approver role');
    }

    const isValid = validateStateTransition(report.status as string, nextStatus, ALLOWED_TRANSITIONS);
    if (!isValid) throw new Error(`Invalid status transition from ${report.status} to ${nextStatus}`);

    const updated = await tx.dailyactivityreport.update({
      where: { dailyactivityreportid: reportId },
      data: { status: nextStatus }
    });

    // Create Audit Log
    await createAuditEntry(approverUserId, 'APPROVE', 'dailyactivityreport', reportId, {
      oldStatus: report.status,
      newStatus: nextStatus,
      comment
    });

    // Notify HOD if supervisor approved
    if (nextStatus === 'PENDING_HOD') {
      const dept = await tx.department.findUnique({
        where: { departmentid: report.departmentid }
      });

      if (dept?.hodid) {
        await emitWorkflowNotification(
          dept.hodid,
          'Daily Activity Report Pending HOD Review',
          `Supervisor has approved the daily activity report for ${report.faculty.fullname || report.faculty.employeenumber}. HOD review is pending.`,
          'REPORT',
          `/dashboard/faculty/approvals`
        );
      }
    } else if (nextStatus === 'APPROVED') {
      // Notify Faculty of approval
      await emitWorkflowNotification(
        report.faculty.userid,
        'Daily Activity Report Approved',
        `Your daily activity report for ${new Date(report.reportdate).toLocaleDateString()} has been approved.`,
        'REPORT',
        `/dashboard/faculty`
      );
    }

    return updated;
  });
};

export const rejectActivityReport = async (
  reportId: number,
  approverUserId: number,
  approverRole: string,
  comment: string
) => {
  if (!comment) throw new Error('Rejection comment is required');

  return await prisma.$transaction(async (tx) => {
    const report = await tx.dailyactivityreport.findUnique({
      where: { dailyactivityreportid: reportId },
      include: {
        faculty: {
          include: { user: true }
        }
      }
    });

    if (!report) throw new Error('Daily activity report not found');

    const nextStatus = 'REJECTED';
    const isValid = validateStateTransition(report.status as string, nextStatus, ALLOWED_TRANSITIONS);
    if (!isValid) throw new Error(`Invalid status transition from ${report.status} to ${nextStatus}`);

    const updated = await tx.dailyactivityreport.update({
      where: { dailyactivityreportid: reportId },
      data: { status: nextStatus }
    });

    // Create Audit Log
    await createAuditEntry(approverUserId, 'REJECT', 'dailyactivityreport', reportId, {
      oldStatus: report.status,
      newStatus: nextStatus,
      comment
    });

    // Notify Faculty
    await emitWorkflowNotification(
      report.faculty.userid,
      'Daily Activity Report Rejected',
      `Your daily activity report for ${new Date(report.reportdate).toLocaleDateString()} was rejected. Reason: ${comment}`,
      'REPORT',
      `/dashboard/faculty`
    );

    return updated;
  });
};

export const archiveActivityReport = async (
  reportId: number,
  actorUserId: number,
  comment = 'Archived'
) => {
  return await prisma.$transaction(async (tx) => {
    const report = await tx.dailyactivityreport.findUnique({
      where: { dailyactivityreportid: reportId },
      include: {
        faculty: {
          include: { user: true }
        }
      }
    });

    if (!report) throw new Error('Daily activity report not found');

    const nextStatus = 'ARCHIVED';
    const isValid = validateStateTransition(report.status as string, nextStatus, ALLOWED_TRANSITIONS);
    if (!isValid) throw new Error(`Invalid status transition from ${report.status} to ${nextStatus}`);

    const updated = await tx.dailyactivityreport.update({
      where: { dailyactivityreportid: reportId },
      data: { status: nextStatus }
    });

    // Create Audit Log
    await createAuditEntry(actorUserId, 'ARCHIVE', 'dailyactivityreport', reportId, {
      oldStatus: report.status,
      newStatus: nextStatus,
      comment
    });

    // Notify Faculty
    await emitWorkflowNotification(
      report.faculty.userid,
      'Daily Activity Report Archived',
      `Your daily activity report for ${new Date(report.reportdate).toLocaleDateString()} was archived.`,
      'REPORT',
      `/dashboard/faculty`
    );

    return updated;
  });
};
