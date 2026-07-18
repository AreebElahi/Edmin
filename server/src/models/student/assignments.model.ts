import prisma from '../../config/prisma.js';

export const findAssignmentsByStudent = async (userId: number) => {
  return prisma.assignment.findMany({
    where: {
      courseoffering: {
        courseenrollment: {
          some: {
            student: { userid: userId },
            isactive: true
          }
        }
      },
      isactive: true,
    },
    select: {
      assignmentid: true,
      title: true,
      duedate: true,
      maxmarks: true,
      courseoffering: {
        select: {
          course: { select: { code: true, name: true } },
        },
      },
      assignmentsubmission: {
        where: { student: { userid: userId }, isactive: true },
        select: { status: true, assignmentsubmissionid: true, createdat: true },
      },
    },
    orderBy: { duedate: 'asc' },
  });
};

export const findAssignmentById = async (assignmentId: number) => {
  return prisma.assignment.findFirst({
    where: { assignmentid: assignmentId, isactive: true },
    include: {
      courseoffering: {
        include: {
          course: true,
        },
      },
    },
  });
};

export const findSubmissionByStudentAndAssignment = async (studentId: number, assignmentId: number) => {
  return prisma.assignmentsubmission.findFirst({
    where: {
      studentid: studentId,
      assignmentid: assignmentId,
      isactive: true,
    },
  });
};

export const upsertAssignmentSubmission = async (studentId: number, assignmentId: number, fileUrl: string) => {
  const existing = await prisma.assignmentsubmission.findFirst({
    where: {
      studentid: studentId,
      assignmentid: assignmentId,
      isactive: true,
    },
  });

  if (existing) {
    const submission = await prisma.assignmentsubmission.update({
      where: { assignmentsubmissionid: existing.assignmentsubmissionid },
      data: {
        status: 'SUBMITTED',
        fileUrl: fileUrl,
        updatedat: new Date(),
      },
    });
    return { submission, oldFileUrl: existing.fileUrl };
  }

  const submission = await prisma.assignmentsubmission.create({
    data: {
      studentid: studentId,
      assignmentid: assignmentId,
      status: 'SUBMITTED',
      fileUrl: fileUrl,
    },
  });
  return { submission, oldFileUrl: null };
};
