import prisma from '../../config/prisma.js';

export const findAttendanceSummaries = async (userId: number) => {
  return prisma.attendancesummary.findMany({
    where: { student: { userid: userId }, isactive: true },
    select: {
      attendancesummaryid: true,
      courseofferingid: true,
      totalclasses: true,
      totalpresent: true,
      totalabsent: true,
      totallate: true,
      totalleave: true,
      totalexcused: true,
      courseoffering: {
        select: { course: { select: { code: true, name: true } } },
      },
    },
  });
};

export const findAttendanceSessionLogs = async (userId: number, courseOfferingId: number) => {
  return prisma.attendance.findMany({
    where: {
      student: { userid: userId },
      isactive: true,
      classsession: {
        courseofferingid: courseOfferingId,
        isactive: true,
      },
    },
    select: {
      attendanceid: true,
      status: true,
      classsession: {
        select: { classsessionid: true, sessiondate: true, topic: true, starttime: true, endtime: true },
      },
    },
    orderBy: {
      classsession: {
        sessiondate: 'desc',
      },
    },
  });
};
