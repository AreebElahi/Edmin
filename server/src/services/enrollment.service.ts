import prisma from '../config/prisma.js';
import { createAuditEntry } from './workflows/shared/audit.service.js';
import { emitWorkflowNotification } from './workflows/shared/notification.service.js';
import { validateStateTransition } from './workflows/shared/transitionValidator.service.js';
import { eventBus, Events } from '../events/eventBus.js';
import { AppError } from '../utils/AppError.js';
import { findAvailableOfferings, findMyEnrollmentRequests } from '../models/student/enrollment.model.js';

const ALLOWED_TRANSITIONS = {
  SUBMITTED: ['PENDING_SUPERVISOR', 'APPROVED', 'REJECTED', 'ESCALATED', 'ARCHIVED'],
  PENDING_SUPERVISOR: ['APPROVED', 'REJECTED', 'ESCALATED', 'ARCHIVED'],
  APPROVED: ['ARCHIVED'],
  REJECTED: ['ARCHIVED'],
  ESCALATED: ['APPROVED', 'REJECTED', 'ARCHIVED'],
  ARCHIVED: []
};

export const getAvailableOfferings = async (userId: number) => {
  return findAvailableOfferings(userId);
};

export const getMyEnrollmentRequests = async (userId: number) => {
  return findMyEnrollmentRequests(userId);
};

export const submitEnrollmentRequest = async (studentUserId: number, courseOfferingId: number) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Resolve student record
    const student = await tx.student.findFirst({
      where: { userid: studentUserId }
    });

    if (!student) throw new AppError(404, 'Student profile not found');

    // Check if student already enrolled or has pending request
    const existingEnrollment = await tx.courseenrollment.findFirst({
      where: {
        studentid: student.studentid,
        courseofferingid: courseOfferingId,
        status: 'ENROLLED'
      }
    });

    if (existingEnrollment) throw new AppError(409, 'Already enrolled in this course offering');

    const existingRequest = await tx.enrollmentrequest.findFirst({
      where: {
        studentid: student.studentid,
        courseofferingid: courseOfferingId,
        status: { in: ['SUBMITTED', 'PENDING_SUPERVISOR'] }
      }
    });

    if (existingRequest) throw new AppError(409, 'Enrollment request is already pending review');

    // 2. Check if offering exists and is active
    const offering = await tx.courseoffering.findUnique({
      where: { courseofferingid: courseOfferingId },
      include: { course: true }
    });

    if (!offering) throw new AppError(404, 'Course offering not found');
    if (offering.status !== 'ACTIVE') throw new AppError(400, 'Course offering is not active');

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
  return await prisma.$transaction(async (tx) => {
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

    if (!request) throw new AppError(404, 'Enrollment request not found');

    const nextStatus: any = 'APPROVED';

    const isValid = validateStateTransition(request.status as string, nextStatus, ALLOWED_TRANSITIONS);
    if (!isValid) throw new AppError(400, `Invalid status transition from ${request.status} to ${nextStatus}`);

    const updated = await tx.enrollmentrequest.update({
      where: { enrollmentrequestid: requestId },
      data: { status: nextStatus }
    });

    await tx.courseenrollment.create({
      data: {
        studentid: request.studentid,
        courseofferingid: request.courseofferingid,
        status: 'ENROLLED'
      }
    });

    await createAuditEntry(approverUserId, 'APPROVE', 'enrollmentrequest', requestId, {
      oldStatus: request.status,
      newStatus: nextStatus,
      comment
    });

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
  if (!comment) throw new AppError(400, 'Rejection comment is required');

  return await prisma.$transaction(async (tx) => {
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

    if (!request) throw new AppError(404, 'Enrollment request not found');

    const nextStatus = 'REJECTED';
    const isValid = validateStateTransition(request.status as string, nextStatus, ALLOWED_TRANSITIONS);
    if (!isValid) throw new AppError(400, `Invalid status transition from ${request.status} to ${nextStatus}`);

    const updated = await tx.enrollmentrequest.update({
      where: { enrollmentrequestid: requestId },
      data: { status: nextStatus }
    });

    await createAuditEntry(approverUserId, 'REJECT', 'enrollmentrequest', requestId, {
      oldStatus: request.status,
      newStatus: nextStatus,
      comment
    });

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

export const validateStudentOwnership = async (userId: number, studentId: number) => {
  const studentRecord = await prisma.student.findFirst({ where: { userid: userId } });
  if (!studentRecord || studentRecord.studentid !== studentId) {
    throw new AppError(403, 'Unauthorized to enroll for another student');
  }
};

export const enrollStudentDirectly = async (studentId: number, courseOfferingId: number) => {
  const existing = await prisma.courseenrollment.findFirst({
    where: { studentid: studentId, courseofferingid: courseOfferingId }
  });

  if (existing) {
    throw new AppError(409, 'Student is already enrolled in this course offering');
  }

  const enrollment = await prisma.courseenrollment.create({
    data: {
      studentid: studentId,
      courseofferingid: courseOfferingId,
      isactive: true,
      createdat: new Date(),
      updatedat: new Date(),
    },
    include: {
      courseoffering: {
        include: { course: true }
      },
      student: true
    }
  });

  eventBus.emit(Events.USER_ENROLLED, {
    userId: enrollment.student.userid,
    courseName: enrollment.courseoffering.course.name,
  });

  return enrollment;
};
