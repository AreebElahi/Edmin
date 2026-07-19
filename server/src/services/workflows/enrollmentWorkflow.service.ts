import prisma from '../../config/prisma.js';
import { createAuditEntry } from './shared/audit.service.js';
import { emitWorkflowNotification } from './shared/notification.service.js';
import { validateStateTransition } from './shared/transitionValidator.service.js';

const ALLOWED_TRANSITIONS = {
  SUBMITTED: ['PENDING_SUPERVISOR', 'APPROVED', 'REJECTED', 'ESCALATED', 'ARCHIVED'],
  PENDING_SUPERVISOR: ['APPROVED', 'REJECTED', 'ESCALATED', 'ARCHIVED'],
  APPROVED: ['ARCHIVED'],
  REJECTED: ['ARCHIVED'],
  ESCALATED: ['APPROVED', 'REJECTED', 'ARCHIVED'],
  ARCHIVED: []
};

export const createEnrollmentRequest = async (studentUserId: number, courseOfferingId: number) => {
  return await prisma.$transaction(async (tx: any) => {
    // 1. Resolve student record
    const student = await tx.student.findFirst({
      where: { userid: studentUserId }
    });

    if (!student) throw new Error('Student profile not found');

    // Check if student already enrolled or has pending request
    const existingEnrollment = await tx.courseenrollment.findFirst({
      where: {
        studentid: student.studentid,
        courseofferingid: courseOfferingId,
        status: 'ENROLLED'
      }
    });

    if (existingEnrollment) throw new Error('Already enrolled in this course offering');

    const existingRequest = await tx.enrollmentrequest.findFirst({
      where: {
        studentid: student.studentid,
        courseofferingid: courseOfferingId,
        status: { in: ['SUBMITTED', 'PENDING_SUPERVISOR'] }
      }
    });

    if (existingRequest) throw new Error('Enrollment request is already pending review');

    // 2. Check if offering exists and is active
    const offering = await tx.courseoffering.findUnique({
      where: { courseofferingid: courseOfferingId },
      include: { course: true }
    });

    if (!offering) throw new Error('Course offering not found');
    if (offering.status !== 'ACTIVE') throw new Error('Course offering is not active');

    // 3. Create Enrollment request
    const request = await tx.enrollmentrequest.create({
      data: {
        studentid: student.studentid,
        courseofferingid: courseOfferingId,
        status: 'SUBMITTED'
      }
    });

    // Create Audit Log
    await createAuditEntry(studentUserId, 'SUBMIT', 'enrollmentrequest', request.enrollmentrequestid, {
      oldStatus: null,
      newStatus: 'SUBMITTED'
    });

    // Notify Supervisor
    // Get department supervisor
    if (student.departmentid) {
      const dept = await tx.department.findUnique({
        where: { departmentid: student.departmentid }
      });

      if (dept?.supervisorid) {
        await emitWorkflowNotification(
          dept.supervisorid,
          'New Course Enrollment Request',
          `Student ${student.fullname || student.rollnumber} has requested enrollment in ${offering.course.name} (${offering.course.code}).`,
          'ENROLLMENT',
          `/dashboard/faculty/approvals`
        );
      }
    }

    return request;
  });
};

export const getEnrollmentRequests = async (userId: number, role: string) => {
  // If supervisor or HOD
  if (role === 'FACULTY') {
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
      return await prisma.enrollmentrequest.findMany({
        where: {
          student: {
            departmentid: { in: deptIds }
          }
        },
        include: {
          student: {
            include: { user: true }
          },
          courseoffering: {
            include: { course: true }
          }
        },
        orderBy: { createdat: 'desc' }
      });
    }

    return [];
  }

  // Student sees their own requests
  if (role === 'STUDENT') {
    const student = await prisma.student.findFirst({
      where: { userid: userId }
    });

    if (!student) return [];

    return await prisma.enrollmentrequest.findMany({
      where: { studentid: student.studentid },
      include: {
        student: {
          include: { user: true }
        },
        courseoffering: {
          include: { course: true }
        }
      },
      orderBy: { createdat: 'desc' }
    });
  }

  // Admin sees all
  if (role === 'ADMIN') {
    return await prisma.enrollmentrequest.findMany({
      include: {
        student: {
          include: { user: true }
        },
        courseoffering: {
          include: { course: true }
        }
      },
      orderBy: { createdat: 'desc' }
    });
  }

  return [];
};

export const approveEnrollmentRequest = async (
  requestId: number,
  approverUserId: number,
  comment = 'Approved by Supervisor'
) => {
  return await prisma.$transaction(async (tx: any) => {
    const request = await tx.enrollmentrequest.findUnique({
      where: { enrollmentrequestid: requestId },
      include: {
        student: {
          include: { user: true }
        },
        courseoffering: {
          include: { course: true }
        }
      }
    });

    if (!request) throw new Error('Enrollment request not found');

    const approver = await tx.user.findUnique({ where: { userid: approverUserId } });
    if (!approver) throw new Error('Approver not found');
    
    if (approver.role !== 'ADMIN') {
      const dept = await tx.department.findUnique({
        where: { departmentid: request.student.departmentid || undefined }
      });
      if (!dept || dept.supervisorid !== approverUserId) {
        throw new Error('Only the department supervisor or an admin can approve enrollment requests');
      }
    }

    // Transition state from SUBMITTED to PENDING_SUPERVISOR or directly to APPROVED
    let nextStatus: any = 'APPROVED';

    // Check transition
    const isValid = validateStateTransition(request.status as string, nextStatus, ALLOWED_TRANSITIONS);
    if (!isValid) throw new Error(`Invalid status transition from ${request.status} to ${nextStatus}`);

    const updated = await tx.enrollmentrequest.update({
      where: { enrollmentrequestid: requestId },
      data: { status: nextStatus }
    });

    // Create the actual enrollment record in APPROVED state
    await tx.courseenrollment.create({
      data: {
        studentid: request.studentid,
        courseofferingid: request.courseofferingid,
        status: 'ENROLLED'
      }
    });

    // Create Audit Log
    await createAuditEntry(approverUserId, 'APPROVE', 'enrollmentrequest', requestId, {
      oldStatus: request.status,
      newStatus: nextStatus,
      comment
    });

    // Notify Student
    await emitWorkflowNotification(
      request.student.userid,
      'Enrollment Request Approved',
      `Your request to enroll in ${request.courseoffering.course.name} (${request.courseoffering.course.code}) has been approved.`,
      'ENROLLMENT',
      `/dashboard/student`
    );

    return updated;
  });
};

export const rejectEnrollmentRequest = async (
  requestId: number,
  approverUserId: number,
  comment: string
) => {
  if (!comment) throw new Error('Rejection comment is required');

  return await prisma.$transaction(async (tx: any) => {
    const request = await tx.enrollmentrequest.findUnique({
      where: { enrollmentrequestid: requestId },
      include: {
        student: {
          include: { user: true }
        },
        courseoffering: {
          include: { course: true }
        }
      }
    });

    if (!request) throw new Error('Enrollment request not found');

    const approver = await tx.user.findUnique({ where: { userid: approverUserId } });
    if (!approver) throw new Error('Approver not found');
    
    if (approver.role !== 'ADMIN') {
      const dept = await tx.department.findUnique({
        where: { departmentid: request.student.departmentid || undefined }
      });
      if (!dept || dept.supervisorid !== approverUserId) {
        throw new Error('Only the department supervisor or an admin can reject enrollment requests');
      }
    }

    const nextStatus = 'REJECTED';
    const isValid = validateStateTransition(request.status as string, nextStatus, ALLOWED_TRANSITIONS);
    if (!isValid) throw new Error(`Invalid status transition from ${request.status} to ${nextStatus}`);

    const updated = await tx.enrollmentrequest.update({
      where: { enrollmentrequestid: requestId },
      data: { status: nextStatus }
    });

    // Create Audit Log
    await createAuditEntry(approverUserId, 'REJECT', 'enrollmentrequest', requestId, {
      oldStatus: request.status,
      newStatus: nextStatus,
      comment
    });

    // Notify Student
    await emitWorkflowNotification(
      request.student.userid,
      'Enrollment Request Rejected',
      `Your request to enroll in ${request.courseoffering.course.name} (${request.courseoffering.course.code}) was rejected. Reason: ${comment}`,
      'ENROLLMENT',
      `/dashboard/student`
    );

    return updated;
  });
};
