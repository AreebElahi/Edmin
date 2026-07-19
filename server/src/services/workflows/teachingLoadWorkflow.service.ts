import prisma from '../../config/prisma.js';
import { createAuditEntry } from './shared/audit.service.js';
import { emitWorkflowNotification } from './shared/notification.service.js';
import { validateStateTransition } from './shared/transitionValidator.service.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configFilePath = path.resolve(__dirname, '../../controllers/admin/systemConfig.json');

const ALLOWED_TRANSITIONS = {
  SUBMITTED: ['PENDING_SUPERVISOR', 'APPROVED', 'REJECTED', 'ESCALATED', 'ARCHIVED'],
  PENDING_SUPERVISOR: ['PENDING_HOD', 'APPROVED', 'REJECTED', 'ESCALATED', 'ARCHIVED'],
  PENDING_HOD: ['APPROVED', 'REJECTED', 'ESCALATED', 'ARCHIVED'],
  APPROVED: ['ARCHIVED'],
  REJECTED: ['ARCHIVED'],
  ESCALATED: ['PENDING_HOD', 'APPROVED', 'REJECTED', 'ARCHIVED'],
  ARCHIVED: []
};

import { MIN_REQUIRED_CREDIT_HOURS } from '../../utils/constants.js';

// Retrieve current credit rules from config
const getCreditRules = () => {
  return { min: MIN_REQUIRED_CREDIT_HOURS, max: 18 };
};

export const createTeachingLoad = async (
  userId: number,
  semesterId: number,
  courseOfferingIds: number[]
) => {
  return await prisma.$transaction(async (tx: any) => {
    // Find faculty
    const faculty = await tx.faculty.findFirst({
      where: { userid: userId }
    });

    if (!faculty) throw new Error('Faculty profile not found');

    // Check if faculty already has a teaching load for this semester
    const existing = await tx.teachingload.findFirst({
      where: {
        facultyid: faculty.facultyid,
        semesterid: semesterId,
        status: { not: 'REJECTED' }
      }
    });

    if (existing) throw new Error('Teaching load request is already pending or approved for this semester');

    // Retrieve offerings and calculate credit hours
    const offerings = await tx.courseoffering.findMany({
      where: { courseofferingid: { in: courseOfferingIds } },
      include: { course: true }
    });

    let totalCredits = offerings.reduce((sum: number, o: any) => sum + o.course.credits, 0);
    const rules = getCreditRules();

    const selectedOfferingIds = [...courseOfferingIds];

    // Load Balancing: if total credits < minimum credits, auto-assign from other active courses
    if (totalCredits < rules.min) {
      const departmentId = faculty.departmentid;
      if (departmentId) {
        const otherOfferings = await tx.courseoffering.findMany({
          where: {
            departmentid: departmentId,
            semesterid: semesterId,
            status: 'ACTIVE',
            courseofferingid: { notIn: selectedOfferingIds }
          },
          include: { course: true }
        });

        for (const o of otherOfferings) {
          if (totalCredits < rules.min) {
            selectedOfferingIds.push(o.courseofferingid);
            totalCredits += o.course.credits;
          } else {
            break;
          }
        }
      }
    }

    if (totalCredits > rules.max) {
      throw new Error(`Total selected credits (${totalCredits}) exceeds maximum allowed (${rules.max})`);
    }

    // Create teaching load
    const teachingLoad = await tx.teachingload.create({
      data: {
        facultyid: faculty.facultyid,
        semesterid: semesterId,
        status: 'SUBMITTED'
      }
    });

    // Create teaching assignments
    for (const offeringId of selectedOfferingIds) {
      await tx.teachingassignment.create({
        data: {
          teachingloadid: teachingLoad.teachingloadid,
          courseofferingid: offeringId
        }
      });
    }

    // Create Audit Log
    const autoAssigned = selectedOfferingIds.length > courseOfferingIds.length;
    await createAuditEntry(userId, 'SUBMIT', 'teachingload', teachingLoad.teachingloadid, {
      oldStatus: null,
      newStatus: 'SUBMITTED',
      autoBalanced: autoAssigned
    });

    // Notify Admin about auto-assignment
    if (autoAssigned) {
      const adminUser = await tx.user.findFirst({ where: { role: 'ADMIN' } });
      if (adminUser) {
        await tx.notification.create({
          data: {
            userid: adminUser.userid,
            title: 'Teaching Load Auto-Assigned',
            message: `System auto-assigned courses to faculty ID ${faculty.facultyid} to meet minimum credit requirements.`,
            type: 'SYSTEM',
            isread: false
          }
        });
      }
    }

    // Notify Supervisor
    if (faculty.departmentid) {
      const dept = await tx.department.findUnique({
        where: { departmentid: faculty.departmentid }
      });
      if (dept?.supervisorid) {
        await emitWorkflowNotification(
          dept.supervisorid,
          'Teaching Load Submitted',
          `${faculty.userid} has submitted teaching load for semester ${semesterId}.`,
          'TEACHING_LOAD_APPROVAL'
        );
      }
    }

    return teachingLoad;
  });
};

export const getTeachingLoads = async (userId: number, role: string) => {
  if (role === 'FACULTY') {
    // If HOD or Supervisor, fetch department loads
    const managedDepts = await prisma.department.findMany({
      where: {
        OR: [
          { supervisorid: userId },
          { hodid: userId }
        ]
      }
    });

    if (managedDepts.length > 0) {
      const deptIds = managedDepts.map((d: any) => d.departmentid);
      return await prisma.teachingload.findMany({
        where: {
          faculty: {
            departmentid: { in: deptIds }
          }
        },
        include: {
          faculty: {
            include: { user: true }
          },
          semester: true,
          teachingassignment: {
            include: {
              courseoffering: {
                include: { course: true }
              }
            }
          }
        },
        orderBy: { createdat: 'desc' }
      });
    }

    // Otherwise, fetch own load
    const faculty = await prisma.faculty.findFirst({
      where: { userid: userId }
    });

    if (!faculty) return [];

    return await prisma.teachingload.findMany({
      where: { facultyid: faculty.facultyid },
      include: {
        faculty: {
          include: { user: true }
        },
        semester: true,
        teachingassignment: {
          include: {
            courseoffering: {
              include: { course: true }
            }
          }
        }
      },
      orderBy: { createdat: 'desc' }
    });
  }

  // Admin sees all
  if (role === 'ADMIN') {
    return await prisma.teachingload.findMany({
      include: {
        faculty: {
          include: { user: true }
        },
        semester: true,
        teachingassignment: {
          include: {
            courseoffering: {
              include: { course: true }
            }
          }
        }
      },
      orderBy: { createdat: 'desc' }
    });
  }

  return [];
};

export const approveTeachingLoad = async (
  teachingLoadId: number,
  approverUserId: number,
  approverRole: string,
  comment = 'Approved'
) => {
  return await prisma.$transaction(async (tx: any) => {
    const teachingLoad = await tx.teachingload.findUnique({
      where: { teachingloadid: teachingLoadId },
      include: {
        faculty: {
          include: { user: true }
        },
        teachingassignment: true
      }
    });

    if (!teachingLoad) throw new Error('Teaching load not found');

    let nextSupervisorStatus = teachingLoad.supervisorstatus;
    let nextHodStatus = teachingLoad.hodstatus;

    // Check transition based on roles
    if (approverRole === 'FACULTY') {
      const dept = await tx.department.findUnique({
        where: { departmentid: teachingLoad.faculty.departmentid || undefined }
      });

      if (dept?.supervisorid === approverUserId) {
        if (teachingLoad.status !== 'SUBMITTED' && teachingLoad.status !== 'PENDING_SUPERVISOR') {
          throw new Error('Load request is not pending supervisor approval');
        }
        nextSupervisorStatus = 'APPROVED';
      } else if (dept?.hodid === approverUserId) {
        if (teachingLoad.status !== 'PENDING_HOD' && teachingLoad.supervisorstatus !== 'APPROVED') {
          throw new Error('Load request must be approved by supervisor first');
        }
        nextHodStatus = 'APPROVED';
      } else {
        throw new Error('You do not have permission to approve this load request');
      }
    } else if (approverRole === 'ADMIN') {
      // Admin override
      nextSupervisorStatus = 'APPROVED';
      nextHodStatus = 'APPROVED';
    } else {
      throw new Error('Unauthorized approver role');
    }

    // Derive overall status
    let nextStatus: any = teachingLoad.status;
    
    if (nextSupervisorStatus === 'REJECTED' || nextHodStatus === 'REJECTED') {
      nextStatus = 'REJECTED';
    } else if (nextSupervisorStatus === 'APPROVED' && nextHodStatus === 'APPROVED') {
      nextStatus = 'APPROVED';
    } else if (nextSupervisorStatus === 'APPROVED' && teachingLoad.supervisorstatus !== 'APPROVED') {
      // Supervisor just approved
      nextStatus = 'PENDING_HOD';
    } else if (nextHodStatus === 'APPROVED' && teachingLoad.hodstatus !== 'APPROVED') {
      // HOD just approved, but if supervisor hasn't, it shouldn't happen, but just in case
      nextStatus = nextSupervisorStatus === 'APPROVED' ? 'APPROVED' : 'PENDING_SUPERVISOR';
    }

    const updated = await tx.teachingload.update({
      where: { teachingloadid: teachingLoadId },
      data: { 
        status: nextStatus,
        supervisorstatus: nextSupervisorStatus,
        hodstatus: nextHodStatus
      }
    });

    // Create Approval Entry record in teachingloadapproval
    await tx.teachingloadapproval.create({
      data: {
        teachingloadid: teachingLoadId,
        approverid: approverUserId,
        action: 'APPROVE',
        userid: approverUserId
      }
    });

    // Create Audit Log
    await createAuditEntry(approverUserId, 'APPROVE', 'teachingload', teachingLoadId, {
      oldStatus: teachingLoad.status,
      newStatus: nextStatus,
      comment
    });

    // If final APPROVED status, update the course offerings to assign the instructor
    if (nextStatus === 'APPROVED') {
      for (const assignment of teachingLoad.teachingassignment) {
        await tx.courseoffering.update({
          where: { courseofferingid: assignment.courseofferingid },
          data: { instructorid: teachingLoad.facultyid }
        });
      }

      // Notify faculty
      await emitWorkflowNotification(
        teachingLoad.faculty.userid,
        'Teaching Load Approved',
        `Your teaching load request has been fully approved by HOD.`,
        'TEACHING_LOAD',
        `/dashboard/faculty`
      );
    } else if (nextStatus === 'PENDING_HOD') {
      // Notify HOD
      const dept = await tx.department.findUnique({
        where: { departmentid: teachingLoad.faculty.departmentid || undefined }
      });

      if (dept?.hodid) {
        await emitWorkflowNotification(
          dept.hodid,
          'Teaching Load Awaiting HOD Approval',
          `Supervisor has approved the teaching load request for ${teachingLoad.faculty.fullname || teachingLoad.faculty.employeenumber}. HOD approval is pending.`,
          'TEACHING_LOAD',
          `/dashboard/faculty/approvals`
        );
      }
    }

    return updated;
  });
};

export const rejectTeachingLoad = async (
  teachingLoadId: number,
  approverUserId: number,
  approverRole: string,
  comment: string
) => {
  if (!comment) throw new Error('Rejection comment is required');

  return await prisma.$transaction(async (tx: any) => {
    const teachingLoad = await tx.teachingload.findUnique({
      where: { teachingloadid: teachingLoadId },
      include: {
        faculty: {
          include: { user: true }
        }
      }
    });

    if (!teachingLoad) throw new Error('Teaching load not found');

    let nextSupervisorStatus = teachingLoad.supervisorstatus;
    let nextHodStatus = teachingLoad.hodstatus;

    if (approverRole === 'FACULTY') {
      const dept = await tx.department.findUnique({
        where: { departmentid: teachingLoad.faculty.departmentid || undefined }
      });

      if (dept?.supervisorid === approverUserId) {
        if (teachingLoad.status !== 'SUBMITTED' && teachingLoad.status !== 'PENDING_SUPERVISOR') {
          throw new Error('Load request is not pending supervisor approval');
        }
        nextSupervisorStatus = 'REJECTED';
      } else if (dept?.hodid === approverUserId) {
        if (teachingLoad.status !== 'PENDING_HOD' && teachingLoad.supervisorstatus !== 'APPROVED') {
          throw new Error('Load request must be approved by supervisor first');
        }
        nextHodStatus = 'REJECTED';
      } else {
        throw new Error('You do not have permission to reject this load request');
      }
    } else if (approverRole === 'ADMIN') {
      nextSupervisorStatus = 'REJECTED';
      nextHodStatus = 'REJECTED';
    } else {
      throw new Error('Unauthorized approver role');
    }

    // Derive overall status
    let nextStatus: any = teachingLoad.status;
    if (nextSupervisorStatus === 'REJECTED' || nextHodStatus === 'REJECTED') {
      nextStatus = 'REJECTED';
    } else if (nextSupervisorStatus === 'APPROVED' && nextHodStatus === 'APPROVED') {
      nextStatus = 'APPROVED';
    }

    const updated = await tx.teachingload.update({
      where: { teachingloadid: teachingLoadId },
      data: { 
        status: nextStatus,
        supervisorstatus: nextSupervisorStatus,
        hodstatus: nextHodStatus
      }
    });

    // Create rejection record
    await tx.teachingloadapproval.create({
      data: {
        teachingloadid: teachingLoadId,
        approverid: approverUserId,
        action: 'REJECT',
        userid: approverUserId
      }
    });

    // Create Audit Log
    await createAuditEntry(approverUserId, 'REJECT', 'teachingload', teachingLoadId, {
      oldStatus: teachingLoad.status,
      newStatus: nextStatus,
      comment
    });

    // Notify Faculty
    await emitWorkflowNotification(
      teachingLoad.faculty.userid,
      'Teaching Load Rejected',
      `Your teaching load request was rejected. Reason: ${comment}`,
      'TEACHING_LOAD',
      `/dashboard/faculty`
    );

    return updated;
  });
};
