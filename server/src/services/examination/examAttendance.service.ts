import prisma from '../../config/prisma.js';
import { exam_attendance_status } from '@prisma/client';
import { processExamResultMapping } from './examResultIntegration.service.js';

export const markExamAttendance = async (
  examSessionId: number, 
  studentId: number, 
  status: exam_attendance_status, 
  markedByUserId: number, 
  remarks?: string
) => {
  const attendanceRecord = await prisma.examattendance.upsert({
    where: {
      examsessionid_studentid: {
        examsessionid: examSessionId,
        studentid: studentId
      }
    },
    update: {
      status,
      remarks,
      markedby: markedByUserId,
      markedat: new Date()
    },
    create: {
      examsessionid: examSessionId,
      studentid: studentId,
      status,
      remarks,
      markedby: markedByUserId,
      markedat: new Date()
    }
  });

  // If marked as UFM or ABSENT, trigger the integration to lock the assessment result
  if (status === 'UFM' || status === 'ABSENT') {
    await processExamResultMapping(examSessionId, studentId, status);
  }

  // Update summary cache asynchronously
  updateExamResultSummary(examSessionId).catch(console.error);

  return attendanceRecord;
};

const updateExamResultSummary = async (examSessionId: number) => {
  const presentCount = await prisma.examattendance.count({ where: { examsessionid: examSessionId, status: 'PRESENT' } });
  const absentCount = await prisma.examattendance.count({ where: { examsessionid: examSessionId, status: 'ABSENT' } });
  const ufmCount = await prisma.examattendance.count({ where: { examsessionid: examSessionId, status: 'UFM' } });

  await prisma.examresultsummary.upsert({
    where: { examsessionid: examSessionId },
    update: {
      totalpresent: presentCount,
      totalabsent: absentCount,
      totalufm: ufmCount
    },
    create: {
      examsessionid: examSessionId,
      totalpresent: presentCount,
      totalabsent: absentCount,
      totalufm: ufmCount
    }
  });
};
