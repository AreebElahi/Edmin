import prisma from '../../config/prisma.js';
import { exam_attendance_status } from '@prisma/client';

export const processExamResultMapping = async (examSessionId: number, studentId: number, status: exam_attendance_status) => {
  const exam = await prisma.examsession.findUnique({
    where: { examsessionid: examSessionId }
  });

  if (!exam) throw new Error('Exam session not found');

  if (status === 'UFM' || status === 'ABSENT') {
    // Override assessment result with 0 and lock it
    await prisma.assessmentresult.upsert({
      where: {
        assessmentid_studentid: { // Need to verify if this unique constraint exists
          assessmentid: exam.assessmentid,
          studentid: studentId
        }
      },
      update: {
        obtainedmarks: 0,
        remarks: `Auto-assigned 0 due to Exam status: ${status}`,
        islocked: true
      },
      create: {
        assessmentid: exam.assessmentid,
        studentid: studentId,
        obtainedmarks: 0,
        remarks: `Auto-assigned 0 due to Exam status: ${status}`,
        islocked: true
      }
    });
  }
};
