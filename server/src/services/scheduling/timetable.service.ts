import prisma from '../../config/prisma.js';
import { checkConflicts } from './conflictDetection.service.js';
import { weekday, frequency_type, delivery_mode, timetable_status } from '@prisma/client';

export const createTimetableSlot = async (data: {
  offeringId: number;
  sectionId: number;
  roomId: number;
  dayOfWeek: weekday;
  startTime: Date;
  endTime: Date;
  frequency?: frequency_type;
  delivery?: delivery_mode;
  meetingurl?: string;
}) => {
  // Check conflicts before creating
  await checkConflicts({
    offeringId: data.offeringId,
    sectionId: data.sectionId,
    roomId: data.roomId,
    dayOfWeek: data.dayOfWeek,
    startTime: data.startTime,
    endTime: data.endTime
  });

  return prisma.timetableslot.create({
    data: {
      offeringid: data.offeringId,
      sectionid: data.sectionId,
      roomid: data.roomId,
      dayofweek: data.dayOfWeek,
      starttime: data.startTime,
      endtime: data.endTime,
      frequency: data.frequency || 'WEEKLY',
      delivery: data.delivery || 'PHYSICAL',
      meetingurl: data.meetingurl
    }
  });
};

export const updateTimetableSlot = async (slotId: number, data: any) => {
  const existing = await prisma.timetableslot.findUnique({ where: { timetableslotid: slotId } });
  if (!existing) throw new Error('Slot not found');

  const checkData = {
    offeringId: data.offeringId || existing.offeringid,
    sectionId: data.sectionId || existing.sectionid,
    roomId: data.roomId || existing.roomid,
    dayOfWeek: data.dayOfWeek || existing.dayofweek,
    startTime: data.startTime || existing.starttime,
    endTime: data.endTime || existing.endtime
  };

  // Temporarily set the current slot to CANCELLED to ignore itself in conflict detection
  await prisma.timetableslot.update({ where: { timetableslotid: slotId }, data: { status: 'CANCELLED' } });

  try {
    await checkConflicts(checkData);
  } catch (err) {
    // Revert
    await prisma.timetableslot.update({ where: { timetableslotid: slotId }, data: { status: existing.status } });
    throw err;
  }

  // Apply update and restore status
  return prisma.timetableslot.update({
    where: { timetableslotid: slotId },
    data: {
      offeringid: checkData.offeringId,
      sectionid: checkData.sectionId,
      roomid: checkData.roomId,
      dayofweek: checkData.dayOfWeek,
      starttime: checkData.startTime,
      endtime: checkData.endTime,
      status: existing.status
    }
  });
};

export const deleteTimetableSlot = async (slotId: number) => {
  return prisma.timetableslot.update({
    where: { timetableslotid: slotId },
    data: { status: 'CANCELLED' }
  });
};
