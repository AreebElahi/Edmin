import prisma from '../../config/prisma.js';

export const findEnrollmentsWithGrades = async (userId: number) => {
  return prisma.courseenrollment.findMany({
    where: { student: { userid: userId }, isactive: true },
    select: {
      courseenrollmentid: true,
      courseofferingid: true,
      gradepoints: true,
      grade: true,
      percentage: true,
      status: true,
      courseoffering: {
        select: {
          course: { select: { code: true, name: true, credits: true } },
          semester: { select: { name: true } },
        },
      },
    },
  });
};
