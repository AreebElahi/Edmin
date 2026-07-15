import prisma from '../../config/prisma.js';
import { classsession_status, attendance_status } from '@prisma/client';

export const createClassSession = async (
  courseOfferingId: number,
  sessionDate: Date,
  startTime?: Date,
  endTime?: Date,
  topic?: string
) => {
  return await prisma.classsession.create({
    data: {
      courseofferingid: courseOfferingId,
      sessiondate: sessionDate,
      starttime: startTime,
      endtime: endTime,
      topic,
      status: 'SCHEDULED',
      isactive: true,
    }
  });
};

export const startClassSession = async (sessionId: number) => {
  return await prisma.classsession.update({
    where: { classsessionid: sessionId },
    data: { status: 'IN_PROGRESS' }
  });
};

export const bulkMarkAttendance = async (
  sessionId: number,
  records: { studentId: number; status: attendance_status }[]
) => {
  return await prisma.$transaction(async (tx) => {
    const session = await tx.classsession.findUnique({
      where: { classsessionid: sessionId }
    });
    
    if (!session) throw new Error('Class session not found');

    const results = [];

    for (const record of records) {
      // Find existing attendance
      const existing = await tx.attendance.findUnique({
        where: {
          studentid_sessionid: {
            studentid: record.studentId,
            sessionid: sessionId
          }
        }
      });

      let oldStatus: attendance_status | null = null;

      if (existing) {
        oldStatus = existing.status as attendance_status;
        const updated = await tx.attendance.update({
          where: { attendanceid: existing.attendanceid },
          data: { status: record.status }
        });
        results.push(updated);
      } else {
        const created = await tx.attendance.create({
          data: {
            sessionid: sessionId,
            studentid: record.studentId,
            status: record.status
          }
        });
        results.push(created);
      }

      // Increment/Decrement Summary Cache
      if (oldStatus !== record.status) {
        await updateAttendanceSummary(
          tx,
          record.studentId,
          session.courseofferingid,
          oldStatus,
          record.status
        );
      }
    }

    // Mark session completed if it wasn't
    if (session.status !== 'COMPLETED') {
      await tx.classsession.update({
        where: { classsessionid: sessionId },
        data: { status: 'COMPLETED' }
      });
    }

    return results;
  });
};

const updateAttendanceSummary = async (
  tx: any,
  studentId: number,
  offeringId: number,
  oldStatus: attendance_status | null,
  newStatus: attendance_status
) => {
  let summary = await tx.attendancesummary.findFirst({
    where: { studentid: studentId, courseofferingid: offeringId }
  });

  if (!summary) {
    summary = await tx.attendancesummary.create({
      data: {
        studentid: studentId,
        courseofferingid: offeringId,
        totalclasses: 1 // We'll just init to 1, although we should theoretically track this elsewhere
      }
    });
  }

  const updateData: any = {};

  // Decrement old status
  if (oldStatus) {
    if (oldStatus === 'PRESENT') updateData.totalpresent = { decrement: 1 };
    else if (oldStatus === 'ABSENT') updateData.totalabsent = { decrement: 1 };
    else if (oldStatus === 'EXCUSED') updateData.totalexcused = { decrement: 1 };
    else if (oldStatus === 'LATE') updateData.totallate = { decrement: 1 };
    else if (oldStatus === 'LEAVE') updateData.totalleave = { decrement: 1 };
  } else {
    // If it's a completely new record, we could optionally increment totalclasses
    updateData.totalclasses = { increment: 1 };
  }

  // Increment new status
  if (newStatus === 'PRESENT') updateData.totalpresent = { increment: 1 };
  else if (newStatus === 'ABSENT') updateData.totalabsent = { increment: 1 };
  else if (newStatus === 'EXCUSED') updateData.totalexcused = { increment: 1 };
  else if (newStatus === 'LATE') updateData.totallate = { increment: 1 };
  else if (newStatus === 'LEAVE') updateData.totalleave = { increment: 1 };

  await tx.attendancesummary.update({
    where: { attendancesummaryid: summary.attendancesummaryid },
    data: updateData
  });
};

export const getOfferingAttendanceStatistics = async (offeringId: number) => {
  const summaries = await prisma.attendancesummary.findMany({
    where: { courseofferingid: offeringId }
  });

  const stats = {
    totalStudents: summaries.length,
    present: 0,
    absent: 0,
    late: 0,
    leave: 0,
    excused: 0,
    attendancePercentage: 0
  };

  let totalPossible = 0;
  let totalAttended = 0;

  for (const s of summaries) {
    stats.present += s.totalpresent || 0;
    stats.absent += s.totalabsent || 0;
    stats.late += s.totallate || 0;
    stats.leave += s.totalleave || 0;
    stats.excused += s.totalexcused || 0;

    totalAttended += (s.totalpresent || 0) + (s.totallate || 0); // Late counts as present for %? Up to uni rules. Assuming yes.
    totalPossible += s.totalclasses || 0;
  }

  if (totalPossible > 0) {
    stats.attendancePercentage = (totalAttended / totalPossible) * 100;
  }

  return stats;
};

export const getClassSessionReport = async (sessionId: number) => {
  const session = await prisma.classsession.findUnique({
    where: { classsessionid: sessionId },
    include: {
      attendance: {
        include: { student: true }
      }
    }
  });

  if (!session) throw new Error('Session not found');

  const distribution = {
    PRESENT: 0,
    ABSENT: 0,
    LATE: 0,
    LEAVE: 0,
    EXCUSED: 0,
    PENDING: 0
  };

  for (const record of session.attendance) {
    const s = record.status as keyof typeof distribution;
    if (distribution[s] !== undefined) {
      distribution[s]++;
    }
  }

  return {
    sessionDate: session.sessiondate,
    topic: session.topic,
    distribution
  };
};

export const getDefaulters = async (offeringId: number, threshold: number = 75) => {
  const summaries = await prisma.attendancesummary.findMany({
    where: { courseofferingid: offeringId },
    include: { student: true }
  });

  const defaulters = [];

  for (const s of summaries) {
    const totalClasses = s.totalclasses || 0;
    if (totalClasses === 0) continue;

    const attended = (s.totalpresent || 0) + (s.totallate || 0);
    const percentage = (attended / totalClasses) * 100;

    if (percentage < threshold) {
      defaulters.push({
        studentId: s.studentid,
        studentName: s.student.fullname || 'Unknown Student',
        percentage,
        totalClasses,
        attended
      });
    }
  }

  return defaulters;
};
