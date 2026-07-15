import prisma from '../../config/prisma.js';
import { invigilation_role } from '@prisma/client';

export const assignInvigilator = async (examSessionId: number, facultyId: number, role: invigilation_role = 'INVIGILATOR') => {
  const exam = await prisma.examsession.findUnique({
    where: { examsessionid: examSessionId }
  });

  if (!exam) throw new Error('Exam session not found');

  // Conflict 1: Faculty already invigilating another exam at this time
  const existingExams = await prisma.examsession.findMany({
    where: {
      date: exam.date,
      status: { not: 'CANCELLED' },
      invigilations: {
        some: { facultyid: facultyId }
      }
    }
  });

  const isOverlap = (sTime1: Date, eTime1: Date, sTime2: Date, eTime2: Date) => {
    return sTime1.getTime() < eTime2.getTime() && sTime2.getTime() < eTime1.getTime();
  };

  for (const existingExam of existingExams) {
    if (isOverlap(exam.starttime, exam.endtime, existingExam.starttime, existingExam.endtime)) {
      throw new Error(`Faculty conflict: Faculty ${facultyId} is already invigilating exam ${existingExam.examsessionid} during this time.`);
    }
  }

  // Conflict 2: Faculty teaching a regular class at this time
  const daysOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const dayOfWeek = daysOfWeek[exam.date.getDay()];

  const existingClasses = await prisma.timetableslot.findMany({
    where: {
      dayofweek: dayOfWeek as any,
      status: 'ACTIVE',
      courseoffering: {
        instructorid: facultyId
      }
    }
  });

  for (const classSlot of existingClasses) {
    if (isOverlap(exam.starttime, exam.endtime, classSlot.starttime, classSlot.endtime)) {
      throw new Error(`Faculty conflict: Faculty ${facultyId} is teaching a regular class during this time.`);
    }
  }

  // Assign the invigilator
  return prisma.invigilation.create({
    data: {
      examsessionid: examSessionId,
      facultyid: facultyId,
      role: role
    }
  });
};

export const getInvigilatorsForExam = async (examSessionId: number) => {
  return prisma.invigilation.findMany({
    where: { examsessionid: examSessionId },
    include: { faculty: true }
  });
};

export const removeInvigilator = async (invigilationId: number) => {
  return prisma.invigilation.delete({
    where: { invigilationid: invigilationId }
  });
};
