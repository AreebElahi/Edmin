import prisma from '../../config/prisma.js';
import { createAuditEntry } from './shared/audit.service.js';
import { emitWorkflowNotification } from './shared/notification.service.js';
import { validateStateTransition } from './shared/transitionValidator.service.js';

const ALLOWED_TRANSITIONS = {
  SUBMITTED: ['PENDING_HR', 'APPROVED', 'REJECTED', 'ESCALATED', 'ARCHIVED'],
  PENDING: ['PENDING_HR', 'APPROVED', 'REJECTED', 'ESCALATED', 'ARCHIVED'],
  PENDING_HR: ['APPROVED', 'REJECTED', 'ESCALATED', 'ARCHIVED'],
  APPROVED: ['ARCHIVED'],
  REJECTED: ['ARCHIVED'],
  ESCALATED: ['APPROVED', 'REJECTED', 'ARCHIVED'],
  ARCHIVED: []
};

export const createLeaveRequest = async (
  userId: number,
  startDate: Date,
  endDate: Date,
  leaveType: any,
  reason: string
) => {
  return await prisma.$transaction(async (tx) => {
    // Create leave request
    const leave = await tx.leaverequest.create({
      data: {
        userid: userId,
        startdate: new Date(startDate),
        enddate: new Date(endDate),
        leavetype: leaveType,
        status: 'SUBMITTED'
      }
    });

    // Save submission reason as the first comment
    await tx.leavecomment.create({
      data: {
        leaverequestid: leave.leaverequestid,
        commenterid: userId,
        comment: reason,
        userid: userId
      }
    });

    // Create Audit Log
    await createAuditEntry(userId, 'SUBMIT', 'leaverequest', leave.leaverequestid, {
      oldStatus: null,
      newStatus: 'SUBMITTED',
      comment: reason
    });

    // Notify Supervisor of new submission
    // First, find the user's department supervisor
    const user = await tx.user.findUnique({
      where: { userid: userId },
      include: {
        userDepartment: true,
        faculty: true
      }
    });

    if (user?.userDepartment?.supervisorid) {
      const userFullname = (user.faculty as any)?.fullname || user.username;
      await emitWorkflowNotification(
        user.userDepartment.supervisorid,
        'New Leave Request Submitted',
        `${userFullname} has requested leave from ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}.`,
        'LEAVE',
        `/dashboard/faculty/approvals`
      );
    }

    return leave;
  });
};

export const getLeaveRequests = async (userId: number, role: string) => {
  if (role === 'HR') {
    return await prisma.leaverequest.findMany({
      include: {
        user: true,
        leavecomment: {
          include: {
            user: true
          }
        }
      },
      orderBy: { createdat: 'desc' }
    });
  }

  // Supervisor or HOD sees department requests
  if (role === 'FACULTY') {
    // Check if user is HOD or Supervisor for any department
    const facultyUser = await prisma.faculty.findFirst({
      where: { userid: userId }
    });
    
    if (facultyUser) {
      const managedDepts = await prisma.department.findMany({
        where: {
          OR: [
            { supervisorid: facultyUser.facultyid },
            { hodid: facultyUser.facultyid }
          ]
        }
      });

      if (managedDepts.length > 0) {
        const deptIds = managedDepts.map(d => d.departmentid);
        return await prisma.leaverequest.findMany({
          where: {
            user: {
              departmentId: { in: deptIds }
            }
          },
          include: {
            user: true,
            leavecomment: {
              include: {
                user: true
              }
            }
          },
          orderBy: { createdat: 'desc' }
        });
      }
    }

    // Otherwise, just see their own
    return await prisma.leaverequest.findMany({
      where: { userid: userId },
      include: {
        user: true,
        leavecomment: {
          include: {
            user: true
          }
        }
      },
      orderBy: { createdat: 'desc' }
    });
  }

  // Student (not typical, but for security returns empty or own if somehow called)
  return [];
};

export const commentOnLeaveRequest = async (
  leaveRequestId: number,
  commenterId: number,
  commentText: string,
  commenterRole: string
) => {
  return await prisma.$transaction(async (tx) => {
    const leave = await tx.leaverequest.findUnique({
      where: { leaverequestid: leaveRequestId },
      include: {
        user: {
          include: {
            faculty: true
          }
        }
      }
    });

    if (!leave) throw new Error('Leave request not found');

    const newComment = await tx.leavecomment.create({
      data: {
        leaverequestid: leaveRequestId,
        commenterid: commenterId,
        comment: commentText,
        userid: commenterId
      }
    });

    // Check if this comment transitions the status
    let nextStatus: any = leave.status;
    
    // If commenter is HOD, transition to PENDING_HR
    const facultyUser = await tx.faculty.findFirst({
      where: { userid: commenterId }
    });

    const commenterDept = facultyUser ? await tx.department.findFirst({
      where: { hodid: facultyUser.facultyid }
    }) : null;

    if (commenterDept && leave.status === 'SUBMITTED') {
      nextStatus = 'PENDING_HR';
      await tx.leaverequest.update({
        where: { leaverequestid: leaveRequestId },
        data: { status: nextStatus }
      });

      // Audit Log
      await createAuditEntry(commenterId, 'COMMENT_AND_FORWARD', 'leaverequest', leaveRequestId, {
        oldStatus: leave.status,
        newStatus: nextStatus,
        comment: commentText
      });

      // Notify HR
      // Find all HR users to notify
      const hrUsers = await tx.user.findMany({
        where: { role: 'HR' }
      });
      for (const hr of hrUsers) {
        await emitWorkflowNotification(
          hr.userid,
          'Leave Request Pending HR Approval',
          `HOD has commented on leave request for ${(leave.user as any).faculty?.[0]?.fullname || leave.user.username}. Pending final HR approval.`,
          'LEAVE',
          `/dashboard/hr/leaves`
        );
      }
    } else {
      // Supervisor comment or standard comment, status stays same
      await createAuditEntry(commenterId, 'COMMENT', 'leaverequest', leaveRequestId, {
        oldStatus: leave.status,
        newStatus: leave.status,
        comment: commentText
      });

      // Notify HOD if supervisor commented
      const supervisorDept = facultyUser ? await tx.department.findFirst({
        where: { supervisorid: facultyUser.facultyid }
      }) : null;
      if (supervisorDept && supervisorDept.hodid) {
        await emitWorkflowNotification(
          supervisorDept.hodid,
          'Supervisor Reviewed Leave Request',
          `Supervisor has added review remarks for ${(leave.user as any).faculty?.[0]?.fullname || leave.user.username}. HOD review pending.`,
          'LEAVE',
          `/dashboard/faculty/approvals`
        );
      }
    }

    return newComment;
  });
};

export const approveLeaveRequest = async (
  leaveRequestId: number,
  hrUserId: number,
  comment = 'Approved by HR'
) => {
  return await prisma.$transaction(async (tx) => {
    const leave = await tx.leaverequest.findUnique({
      where: { leaverequestid: leaveRequestId }
    });

    if (!leave) throw new Error('Leave request not found');

    const isValid = validateStateTransition(leave.status as string, 'APPROVED', ALLOWED_TRANSITIONS);
    if (!isValid) throw new Error(`Invalid status transition from ${leave.status} to APPROVED`);

    const updated = await tx.leaverequest.update({
      where: { leaverequestid: leaveRequestId },
      data: { status: 'APPROVED' }
    });

    // Log Approval comment
    await tx.leavecomment.create({
      data: {
        leaverequestid: leaveRequestId,
        commenterid: hrUserId,
        comment,
        userid: hrUserId
      }
    });

    // Create Audit Log
    await createAuditEntry(hrUserId, 'APPROVE', 'leaverequest', leaveRequestId, {
      oldStatus: leave.status,
      newStatus: 'APPROVED',
      comment
    });

    // Notify Faculty
    await emitWorkflowNotification(
      leave.userid,
      'Leave Request Approved',
      `Your leave request has been approved by HR.`,
      'LEAVE',
      `/dashboard/faculty`
    );

    return updated;
  });
};

export const rejectLeaveRequest = async (
  leaveRequestId: number,
  hrUserId: number,
  comment: string
) => {
  if (!comment) throw new Error('Rejection comment is required');

  return await prisma.$transaction(async (tx) => {
    const leave = await tx.leaverequest.findUnique({
      where: { leaverequestid: leaveRequestId }
    });

    if (!leave) throw new Error('Leave request not found');

    const isValid = validateStateTransition(leave.status as string, 'REJECTED', ALLOWED_TRANSITIONS);
    if (!isValid) throw new Error(`Invalid status transition from ${leave.status} to REJECTED`);

    const updated = await tx.leaverequest.update({
      where: { leaverequestid: leaveRequestId },
      data: { status: 'REJECTED' }
    });

    // Log Rejection comment
    await tx.leavecomment.create({
      data: {
        leaverequestid: leaveRequestId,
        commenterid: hrUserId,
        comment,
        userid: hrUserId
      }
    });

    // Create Audit Log
    await createAuditEntry(hrUserId, 'REJECT', 'leaverequest', leaveRequestId, {
      oldStatus: leave.status,
      newStatus: 'REJECTED',
      comment
    });

    // Notify Faculty
    await emitWorkflowNotification(
      leave.userid,
      'Leave Request Rejected',
      `Your leave request was rejected. Reason: ${comment}`,
      'LEAVE',
      `/dashboard/faculty`
    );

    return updated;
  });
};

export const archiveLeaveRequest = async (
  leaveRequestId: number,
  actorUserId: number,
  comment = 'Archived'
) => {
  return await prisma.$transaction(async (tx) => {
    const leave = await tx.leaverequest.findUnique({
      where: { leaverequestid: leaveRequestId }
    });

    if (!leave) throw new Error('Leave request not found');

    const isValid = validateStateTransition(leave.status as string, 'ARCHIVED', ALLOWED_TRANSITIONS);
    if (!isValid) throw new Error(`Invalid status transition from ${leave.status} to ARCHIVED`);

    const updated = await tx.leaverequest.update({
      where: { leaverequestid: leaveRequestId },
      data: { status: 'ARCHIVED' }
    });

    // Log archiving comment
    await tx.leavecomment.create({
      data: {
        leaverequestid: leaveRequestId,
        commenterid: actorUserId,
        comment,
        userid: actorUserId
      }
    });

    // Create Audit Log
    await createAuditEntry(actorUserId, 'ARCHIVE', 'leaverequest', leaveRequestId, {
      oldStatus: leave.status,
      newStatus: 'ARCHIVED',
      comment
    });

    // Notify Faculty
    await emitWorkflowNotification(
      leave.userid,
      'Leave Request Archived',
      `Your leave request was archived.`,
      'LEAVE',
      `/dashboard/faculty`
    );

    return updated;
  });
};
