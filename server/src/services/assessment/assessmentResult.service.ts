import prisma from '../../config/prisma.js';

export const bulkUploadMarks = async (
  assessmentId: number,
  results: { studentId: number; obtainedMarks: number; remarks?: string }[]
) => {
  const assessment = await prisma.assessment.findUnique({ where: { assessmentid: assessmentId } });
  if (!assessment) throw new Error('Assessment not found');
  if (assessment.status === 'LOCKED') throw new Error('Cannot modify marks for a LOCKED assessment');

  return await prisma.$transaction(async (tx) => {
    const records = [];
    for (const res of results) {
      if (res.obtainedMarks < 0 || res.obtainedMarks > assessment.totalmarks) {
        throw new Error(`Marks for student ${res.studentId} are out of bounds (0 - ${assessment.totalmarks})`);
      }

      const existingRecord = await tx.assessmentresult.findUnique({
        where: { assessmentid_studentid: { assessmentid: assessmentId, studentid: res.studentId } }
      });

      if (existingRecord?.islocked) {
        throw new Error(`Marks for student ${res.studentId} are locked and cannot be overridden.`);
      }

      const record = await tx.assessmentresult.upsert({
        where: {
          assessmentid_studentid: {
            assessmentid: assessmentId,
            studentid: res.studentId
          }
        },
        update: {
          obtainedmarks: res.obtainedMarks,
          remarks: res.remarks
        },
        create: {
          assessmentid: assessmentId,
          studentid: res.studentId,
          obtainedmarks: res.obtainedMarks,
          remarks: res.remarks
        }
      });
      records.push(record);
    }
    return records;
  });
};

export const updateStudentMarks = async (
  assessmentId: number,
  studentId: number,
  obtainedMarks: number,
  remarks?: string
) => {
  const assessment = await prisma.assessment.findUnique({ where: { assessmentid: assessmentId } });
  if (!assessment) throw new Error('Assessment not found');
  if (assessment.status === 'LOCKED') throw new Error('Cannot modify marks for a LOCKED assessment');
  if (obtainedMarks < 0 || obtainedMarks > assessment.totalmarks) {
    throw new Error(`Marks are out of bounds (0 - ${assessment.totalmarks})`);
  }

  const existingRecord = await prisma.assessmentresult.findUnique({
    where: { assessmentid_studentid: { assessmentid: assessmentId, studentid: studentId } }
  });

  if (existingRecord?.islocked) {
    throw new Error(`Marks for student ${studentId} are locked and cannot be overridden.`);
  }

  return await prisma.assessmentresult.upsert({
    where: {
      assessmentid_studentid: {
        assessmentid: assessmentId,
        studentid: studentId
      }
    },
    update: {
      obtainedmarks: obtainedMarks,
      remarks: remarks
    },
    create: {
      assessmentid: assessmentId,
      studentid: studentId,
      obtainedmarks: obtainedMarks,
      remarks: remarks
    }
  });
};

export const getResults = async (assessmentId: number) => {
  return await prisma.assessmentresult.findMany({
    where: { assessmentid: assessmentId },
    include: { student: true }
  });
};
