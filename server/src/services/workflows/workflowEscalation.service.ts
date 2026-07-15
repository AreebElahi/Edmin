import prisma from '../../config/prisma.js';
import { createAuditEntry } from './shared/audit.service.js';
import { emitWorkflowNotification } from './shared/notification.service.js';

// Escalate a single request manually or automatically
export const escalateRequest = async (
  relatedId: number,
  relatedType: 'LEAVE' | 'ENROLLMENT' | 'TEACHING_LOAD' | 'REPORT',
  initiatorUserId: number,
  reason = 'Deadline exceeded. Escalated to Admin.'
) => {
  return await prisma.$transaction(async (tx) => {
    let oldStatus = '';
    
    // 1. Update the parent status to ESCALATED
    if (relatedType === 'LEAVE') {
      const leave = await tx.leaverequest.findUnique({ where: { leaverequestid: relatedId } });
      if (!leave) throw new Error('Leave request not found');
      oldStatus = leave.status || 'PENDING';
      
      await tx.leaverequest.update({
        where: { leaverequestid: relatedId },
        data: { status: 'ESCALATED' }
      });

      // Add a system comment explaining escalation
      await tx.leavecomment.create({
        data: {
          leaverequestid: relatedId,
          commenterid: initiatorUserId,
          comment: `[SYSTEM ESCALATION] ${reason}`,
          userid: initiatorUserId
        }
      });
    } 
    else if (relatedType === 'ENROLLMENT') {
      const request = await tx.enrollmentrequest.findUnique({ where: { enrollmentrequestid: relatedId } });
      if (!request) throw new Error('Enrollment request not found');
      oldStatus = request.status || 'PENDING';

      await tx.enrollmentrequest.update({
        where: { enrollmentrequestid: relatedId },
        data: { status: 'ESCALATED' }
      });
    } 
    else if (relatedType === 'TEACHING_LOAD') {
      const load = await tx.teachingload.findUnique({ where: { teachingloadid: relatedId } });
      if (!load) throw new Error('Teaching load not found');
      oldStatus = load.status || 'PENDING';

      await tx.teachingload.update({
        where: { teachingloadid: relatedId },
        data: { status: 'ESCALATED' }
      });
    } 
    else if (relatedType === 'REPORT') {
      const report = await tx.dailyactivityreport.findUnique({ where: { dailyactivityreportid: relatedId } });
      if (!report) throw new Error('Activity report not found');
      oldStatus = report.status || 'SUBMITTED';

      await tx.dailyactivityreport.update({
        where: { dailyactivityreportid: relatedId },
        data: { status: 'ESCALATED' }
      });
    }

    // 2. Create the Escalation record in DB
    const escalation = await tx.escalation.create({
      data: {
        initiatedbyid: initiatorUserId,
        relatedid: relatedId,
        relatedtype: relatedType,
        status: 'OPEN',
        target: 'ADMIN_OVERRIDE',
        userid: initiatorUserId
      }
    });

    // 3. Create Audit Log Entry
    await createAuditEntry(initiatorUserId, 'ESCALATE', relatedType.toLowerCase() + 'request', relatedId, {
      oldStatus,
      newStatus: 'ESCALATED',
      escalationId: escalation.escalationid,
      comment: reason
    });

    // 4. Notify all Admins
    const admins = await tx.user.findMany({
      where: { role: 'ADMIN' }
    });

    for (const admin of admins) {
      await emitWorkflowNotification(
        admin.userid,
        'Workflow Escalation Triggered',
        `A pending ${relatedType} request (#${relatedId}) has been escalated to Admin due to review inactivity.`,
        'ESCALATION',
        `/dashboard/admin/workflow`
      );
    }

    return escalation;
  });
};

// Automatic batch scanner to simulate a cron/BullMQ trigger
export const scanAndEscalateStaleRequests = async () => {
  const cutoffDate = new Date();
  cutoffDate.setHours(cutoffDate.getHours() - 48); // 48-hour expiration deadline

  let count = 0;

  // 1. Stale Leave Requests in PENDING_HR state
  const staleLeaves = await prisma.leaverequest.findMany({
    where: {
      status: 'PENDING_HR',
      updatedat: { lt: cutoffDate }
    }
  });
  for (const leave of staleLeaves) {
    await escalateRequest(leave.leaverequestid, 'LEAVE', leave.userid, 'Leave request escalated after 48h HR inactivity.');
    count++;
  }

  // 2. Stale Enrollment Requests in PENDING_SUPERVISOR state
  const staleEnrollments = await prisma.enrollmentrequest.findMany({
    where: {
      status: 'PENDING_SUPERVISOR',
      updatedat: { lt: cutoffDate }
    },
    include: { student: true }
  });
  for (const enr of staleEnrollments) {
    await escalateRequest(enr.enrollmentrequestid, 'ENROLLMENT', enr.student.userid, 'Enrollment request escalated after 48h Supervisor inactivity.');
    count++;
  }

  // 3. Stale Teaching Loads in PENDING_SUPERVISOR state
  const staleLoads = await prisma.teachingload.findMany({
    where: {
      status: 'PENDING_SUPERVISOR',
      updatedat: { lt: cutoffDate }
    },
    include: { faculty: true }
  });
  for (const load of staleLoads) {
    await escalateRequest(load.teachingloadid, 'TEACHING_LOAD', load.faculty.userid, 'Teaching load escalated after 48h Supervisor inactivity.');
    count++;
  }

  // 4. Stale Daily Activity Reports in PENDING_HOD state
  const staleReports = await prisma.dailyactivityreport.findMany({
    where: {
      status: 'PENDING_HOD',
      updatedat: { lt: cutoffDate }
    },
    include: { faculty: true }
  });
  for (const rep of staleReports) {
    await escalateRequest(rep.dailyactivityreportid, 'REPORT', rep.faculty.userid, 'Activity report escalated after 48h HOD inactivity.');
    count++;
  }

  return { escalatedCount: count };
};
