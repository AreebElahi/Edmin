import { findStudentIdOnly } from '../../models/student/profile.model.js';
import { findAttendanceSummaries, findAttendanceSessionLogs } from '../../models/student/attendance.model.js';
import { AppError } from '../../utils/AppError.js';
import prisma from '../../config/prisma.js';

const getStudentId = async (userId: number): Promise<number> => {
  const student = await findStudentIdOnly(userId);
  if (!student) {
    throw new AppError(404, 'Student profile not found');
  }
  return student.studentid;
};

export const getAttendanceSummary = async (userId: number) => {
  const summaries = await findAttendanceSummaries(userId);
  
  return summaries.map((s) => {
    const total = s.totalclasses ?? 0;
    const present = s.totalpresent ?? 0;
    const percentage = total > 0 ? (present / total) * 100 : 0;
    
    return {
      attendancesummaryid: s.attendancesummaryid,
      courseOfferingId: s.courseofferingid,
      totalClasses: total,
      totalPresent: present,
      totalAbsent: s.totalabsent ?? 0,
      totalLate: s.totallate ?? 0,
      totalExcused: s.totalexcused ?? 0,
      percentage: Math.round(percentage * 100) / 100,
      course: {
        code: s.courseoffering.course.code,
        name: s.courseoffering.course.name,
      },
    };
  });
};

export const getAttendanceDetail = async (userId: number, courseOfferingId: number) => {
  const [summaries, logs, isEnrolled] = await Promise.all([
    findAttendanceSummaries(userId),
    findAttendanceSessionLogs(userId, courseOfferingId),
    // Verify enrollment ownership directly in courseenrollment
    prisma.courseenrollment.findFirst({
      where: {
        student: { userid: userId },
        courseofferingid: courseOfferingId,
        isactive: true,
      },
    }),
  ]);
  if (!isEnrolled) {
    throw new AppError(403, 'Forbidden: You are not enrolled in this course offering');
  }

  return logs.map((l) => ({
    attendanceid: l.attendanceid,
    sessionid: l.classsession.classsessionid,
    status: l.status,
    sessiondate: l.classsession.sessiondate,
    topic: l.classsession.topic,
    starttime: l.classsession.starttime,
    endtime: l.classsession.endtime,
  }));
};
