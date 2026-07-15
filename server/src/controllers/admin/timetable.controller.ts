import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../contracts/api.contracts.js';
import prisma from '../../config/prisma.js';
import { createTimetableSlot, deleteTimetableSlot, updateTimetableSlot } from '../../services/scheduling/timetable.service.js';

export const getRoomsHandler = async (req: Request, res: Response) => {
  try {
    const rooms = await prisma.room.findMany({
      where: { isactive: true }
    });
    return sendSuccess(res, rooms);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to fetch rooms');
  }
};

export const createRoomHandler = async (req: Request, res: Response) => {
  try {
    const { name, code, capacity, building } = req.body;
    if (!name || !code || !capacity) {
      return sendError(res, 'Name, Code and Capacity are required', 'BAD_REQUEST', 400);
    }

    const newRoom = await prisma.room.create({
      data: {
        name,
        code,
        capacity: Number(capacity),
        building: building || '',
        isactive: true
      }
    });

    return sendSuccess(res, newRoom, 201);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to create room');
  }
};

export const deleteRoomHandler = async (req: Request, res: Response) => {
  try {
    const roomId = Number(req.params.id);
    await prisma.room.update({
      where: { roomid: roomId },
      data: { isactive: false }
    });
    return sendSuccess(res, { message: 'Room archived successfully' });
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to archive room');
  }
};

export const getSlotsHandler = async (req: Request, res: Response) => {
  try {
    const slots = await prisma.timetableslot.findMany({
      where: { status: 'ACTIVE' },
      include: {
        courseoffering: {
          include: {
            course: true,
            faculty: {
              include: {
                user: true
              }
            }
          }
        },
        room: true,
        section: true
      }
    });
    
    // Map to a cleaner layout matching the frontend's grid expectations
    const formatted = slots.map(slot => ({
      slotId: slot.timetableslotid,
      dayOfWeek: slot.dayofweek,
      startTime: slot.starttime,
      endTime: slot.endtime,
      course: `${slot.courseoffering?.course?.code || 'N/A'}`,
      teacher: slot.courseoffering?.faculty?.user?.username || 'Unassigned',
      room: slot.room?.name || 'No Room',
      offeringId: slot.offeringid,
      sectionId: slot.sectionid,
      programId: slot.section?.programid || null
    }));

    return sendSuccess(res, formatted);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to fetch timetable slots');
  }
};

export const createSlotHandler = async (req: Request, res: Response) => {
  try {
    const { offeringId, sectionId, roomId, dayOfWeek, startTime, endTime } = req.body;
    
    if (!offeringId || !sectionId || !roomId || !dayOfWeek || !startTime || !endTime) {
      return sendError(res, 'Missing required slot mapping fields', 'BAD_REQUEST', 400);
    }

    const slot = await createTimetableSlot({
      offeringId: Number(offeringId),
      sectionId: Number(sectionId),
      roomId: Number(roomId),
      dayOfWeek: dayOfWeek,
      startTime: new Date(startTime),
      endTime: new Date(endTime)
    });

    return sendSuccess(res, slot, 201);
  } catch (error: any) {
    return sendError(res, error.message || 'Timetable scheduling conflict detected', 'CONFLICT', 409);
  }
};

export const updateSlotHandler = async (req: Request, res: Response) => {
  try {
    const slotId = Number(req.params.id);
    const { offeringId, sectionId, roomId, dayOfWeek, startTime, endTime } = req.body;
    
    if (!offeringId || !sectionId || !roomId || !dayOfWeek || !startTime || !endTime) {
      return sendError(res, 'Missing required slot mapping fields', 'BAD_REQUEST', 400);
    }

    const slot = await updateTimetableSlot(slotId, {
      offeringId: Number(offeringId),
      sectionId: Number(sectionId),
      roomId: Number(roomId),
      dayOfWeek,
      startTime: new Date(startTime),
      endTime: new Date(endTime)
    });

    return sendSuccess(res, slot, 200);
  } catch (error: any) {
    return sendError(res, error.message || 'Timetable scheduling conflict detected', 'CONFLICT', 409);
  }
};

export const deleteSlotHandler = async (req: Request, res: Response) => {
  try {
    const slotId = Number(req.params.id);
    await deleteTimetableSlot(slotId);
    return sendSuccess(res, { message: 'Slot deleted successfully' });
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to delete timetable slot');
  }
};

export const getVersionsHandler = async (req: Request, res: Response) => {
  try {
    const timetables = await prisma.timetable.findMany({
      orderBy: { createdat: 'desc' }
    });
    return sendSuccess(res, timetables);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to fetch versions');
  }
};

export const publishTimetableHandler = async (req: Request, res: Response) => {
  try {
    const { timetableId } = req.body;
    if (!timetableId) {
      return sendError(res, 'Timetable ID is required to publish', 'BAD_REQUEST', 400);
    }

    const updated = await prisma.timetable.update({
      where: { timetableid: Number(timetableId) },
      data: { isactive: true }
    });

    return sendSuccess(res, updated);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to publish timetable');
  }
};

export const getTimetableOfferingsHandler = async (req: Request, res: Response) => {
  try {
    const offerings = await prisma.courseoffering.findMany({
      where: { isactive: true },
      include: {
        course: true,
        faculty: {
          include: {
            user: {
              select: { username: true }
            }
          }
        }
      }
    });

    const formatted = offerings.map(o => ({
      offeringId: o.courseofferingid,
      name: `${o.course?.name || 'Unknown Course'} (${o.course?.code || 'N/A'})`,
      teacher: o.faculty?.user?.username || 'Unassigned',
      courseCode: o.course?.code || ''
    }));

    return sendSuccess(res, formatted);
  } catch (error: any) {
    console.error('Error fetching timetable offerings:', error);
    return sendError(res, error.message);
  }
};

export const getTimetableProgramsHandler = async (req: Request, res: Response) => {
  try {
    const programs = await prisma.program.findMany({
      where: { isactive: true },
      include: {
        department: {
          include: {
            section: {
              where: { isactive: true }
            }
          }
        }
      }
    });

    const formatted = programs.map(p => ({
      programid: p.programid,
      name: p.name,
      code: p.code,
      departmentid: p.departmentid,
      isactive: p.isactive,
      section: p.department?.section || []
    }));

    return sendSuccess(res, formatted);
  } catch (error: any) {
    console.error('Error fetching timetable programs:', error);
    return sendError(res, error.message || 'Failed to fetch programs');
  }
};

