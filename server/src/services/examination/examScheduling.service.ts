import prisma from '../../config/prisma.js';
import { AppError } from '../../utils/errors.js';
import { checkConflicts } from '../scheduling/conflictDetection.service.js';
import { exam_type } from '@prisma/client';

interface ExamScheduleParams {
  assessmentId: number;
  roomId: number;
  sectionId: number;
  date: Date;
  startTime: Date;
  endTime: Date;
  duration: number;
  examType?: exam_type;
}

export const scheduleExam = async (params: ExamScheduleParams) => {
  const { assessmentId, roomId, sectionId, date, startTime, endTime, duration, examType } = params;

  // Verify assessment exists
  const assessment = await prisma.assessment.findUnique({
    where: { assessmentid: assessmentId }
  });

  if (!assessment) throw new AppError('Assessment not found', 404);

  // The conflictDetection service from Phase 7 expects a dayOfWeek string, but for exams it's a specific date
  // We can adapt or write specific exam conflict logic. For exams, let's verify both timetableslots and examsessions.
  
  // 1. Timetable Conflict (Regular Classes)
  const daysOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const dayOfWeek = daysOfWeek[date.getDay()];

  const isOverlap = (sTime1: Date, eTime1: Date, sTime2: Date, eTime2: Date) => {
    return sTime1.getTime() < eTime2.getTime() && sTime2.getTime() < eTime1.getTime();
  };

  const existingSlots = await prisma.timetableslot.findMany({
    where: {
      status: 'ACTIVE',
      dayofweek: dayOfWeek as any,
      roomid: roomId
    }
  });

  for (const slot of existingSlots) {
    if (isOverlap(startTime, endTime, slot.starttime, slot.endtime)) {
      throw new AppError(`Room conflict: Room ${roomId} is already booked for a regular class during this time.`, 409);
    }
  }

  // 2. Exam Session Conflict (Other Exams in same room)
  const existingExams = await prisma.examsession.findMany({
    where: {
      date: date,
      status: { not: 'CANCELLED' }
    }
  });

  for (const exam of existingExams) {
    if (isOverlap(startTime, endTime, exam.starttime, exam.endtime)) {
      if (exam.roomid === roomId) {
        throw new AppError(`Room conflict: Room ${roomId} is already booked for another exam.`, 409);
      }
      if (exam.sectionid === sectionId) {
        throw new AppError(`Section conflict: Section ${sectionId} already has an exam scheduled at this time.`, 409);
      }
    }
  }

  // 3. Exam Isolation Rule (No student has 2 exams on same day - Policy check)
  // Optional: check if section already has an exam on this date
  const sectionExamsOnDay = existingExams.filter(e => e.sectionid === sectionId);
  if (sectionExamsOnDay.length > 0) {
    console.warn(`Policy Warning: Section ${sectionId} already has an exam scheduled on ${date.toDateString()}`);
    // Not throwing an error to allow flexibility, but it's flagged.
  }

  // Create the Exam Session
  return prisma.examsession.create({
    data: {
      assessmentid: assessmentId,
      roomid: roomId,
      sectionid: sectionId,
      date: date,
      starttime: startTime,
      endtime: endTime,
      duration: duration,
      exam_type: examType || 'FINAL',
      status: 'SCHEDULED'
    }
  });
};
