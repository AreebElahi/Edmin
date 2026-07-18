import prisma from '../../config/prisma.js';

export const findAvailableOfferings = async (userId: number) => {
  return prisma.courseoffering.findMany({
    where: {
      status: 'ACTIVE',
      isactive: true,
    },
    select: {
      courseofferingid: true,
      status: true,
      course: { select: { code: true, name: true, credits: true } },
      semester: { select: { name: true } },
    },
  });
};

export const findMyEnrollmentRequests = async (userId: number) => {
  return prisma.enrollmentrequest.findMany({
    where: { student: { userid: userId }, isactive: true },
    select: {
      enrollmentrequestid: true,
      courseofferingid: true,
      status: true,
      createdat: true,
      courseoffering: {
        select: {
          course: { select: { code: true, name: true } },
          semester: { select: { name: true } },
        },
      },
    },
    orderBy: { createdat: 'desc' },
  });
};

export const findDuplicateEnrollment = async (userId: number, courseOfferingId: number) => {
  return prisma.enrollmentrequest.findFirst({
    where: {
      student: { userid: userId },
      courseofferingid: courseOfferingId,
      isactive: true,
    },
  });
};
export const createEnrollmentRequest = async (userId: number, courseOfferingId: number, reason?: string) => {
  return prisma.enrollmentrequest.create({
    data: {
      student: { connect: { userid: userId } },
      courseoffering: { connect: { courseofferingid: courseOfferingId } },
      status: 'PENDING',
    },
  });
};
