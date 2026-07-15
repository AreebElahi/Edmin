import prisma from '../../config/prisma.js';

export const findTimetableByUserId = async (userId: number) => {
  return prisma.timetable.findMany({
    where: {
      isactive: true,
      courseoffering: {
        courseenrollment: {
          some: {
            isactive: true,
            student: {
              userid: userId,
              isactive: true,
            },
          },
        },
      },
    },
    select: {
      timetableid: true,
      dayofweek: true,
      starttime: true,
      endtime: true,
      room: true,
      courseoffering: {
        select: { course: { select: { code: true, name: true } } },
      },
    },
    orderBy: [
      { dayofweek: 'asc' },
      { starttime: 'asc' },
    ],
  });
};
