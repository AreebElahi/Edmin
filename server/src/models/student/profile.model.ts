import prisma from '../../config/prisma.js';

export const findStudentByUserId = async (userId: number) => {
  return prisma.student.findFirst({
    where: { userid: userId, isactive: true },
    select: {
      studentid: true,
      userid: true,
      fullname: true,
      avatar: true,
      rollnumber: true,
      status: true,
      financialstatus: true,
      program: { select: { name: true } },
      department: { select: { name: true } },
    },
  });
};

export const findStudentIdOnly = async (userId: number) => {
  return prisma.student.findFirst({
    where: { userid: userId, isactive: true },
    select: { studentid: true },
  });
};

export const findPersonalRecordByStudentId = async (studentId: number) => {
  return prisma.studentpersonalrecord.findFirst({
    where: { studentid_ref: studentId, isactive: true },
  });
};
