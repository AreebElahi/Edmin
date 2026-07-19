import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../contracts/api.contracts.js';
import prisma from '../../config/prisma.js';
import { createTimetableSlot, deleteTimetableSlot, updateTimetableSlot } from '../../services/scheduling/timetable.service.js';
import { redisConnection, acquireLock, releaseLock } from '../../config/redis.js';
import { getCachedResponse, setCachedResponse } from "../../config/redis.js";

const invalidateTimetableCache = async () => {
  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.del('api:admin:rooms');
    await redisConnection.del('api:admin:timetable:slots');
    await redisConnection.del('api:admin:timetable:versions');
    await redisConnection.del('api:admin:timetable:offerings');
    await redisConnection.del('api:admin:timetable:programs');
  }
};

export const getRoomsHandler = async (req: Request, res: Response) => {
  try {
    const cacheKey = 'api:admin:rooms';

    if (redisConnection && redisConnection.status === 'ready') {
      const cached = await redisConnection.get(cacheKey);
      if (cached) {
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).send(cached);
      }
    }

    let isLeader = false;
    if (redisConnection && redisConnection.status === 'ready') {
      isLeader = await acquireLock(cacheKey, 5);
    } else {
      isLeader = true;
    }

    if (isLeader) {
      try {
        const rooms = await prisma.room.findMany({
          where: { isactive: true }
        });
        const fullResponse = { success: true, data: rooms };

        if (redisConnection && redisConnection.status === 'ready') {
          await redisConnection.setex(cacheKey, 30, JSON.stringify(fullResponse));
          await releaseLock(cacheKey);
        }
        return sendSuccess(res, (fullResponse as any).data || fullResponse, undefined, undefined, 200);
      } catch (error) {
        if (redisConnection && redisConnection.status === 'ready') {
          await releaseLock(cacheKey);
        }
        throw error;
      }
    } else {
      for (let attempt = 0; attempt < 10; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        const cached = await redisConnection!.get(cacheKey);
        if (cached) {
          res.setHeader('Content-Type', 'application/json');
          return res.status(200).send(cached);
        }
      }
      const rooms = await prisma.room.findMany({ where: { isactive: true } });
      return sendSuccess(res, rooms, undefined, undefined, 200);
    }
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

    await invalidateTimetableCache();

    return sendSuccess(res, newRoom, 'Operation completed successfully.', undefined, 201);
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

    await invalidateTimetableCache();

    return sendSuccess(res, { message: 'Room archived successfully' });
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to archive room');
  }
};

export const getSlotsHandler = async (req: Request, res: Response) => {
  try {
    const cacheKey = 'api:admin:timetable:slots';

    if (redisConnection && redisConnection.status === 'ready') {
      const cached = await redisConnection.get(cacheKey);
      if (cached) {
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).send(cached);
      }
    }

    let isLeader = false;
    if (redisConnection && redisConnection.status === 'ready') {
      isLeader = await acquireLock(cacheKey, 5);
    } else {
      isLeader = true;
    }

    if (isLeader) {
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

        const fullResponse = { success: true, data: formatted };

        if (redisConnection && redisConnection.status === 'ready') {
          await redisConnection.setex(cacheKey, 30, JSON.stringify(fullResponse));
          await releaseLock(cacheKey);
        }
        return sendSuccess(res, (fullResponse as any).data || fullResponse, undefined, undefined, 200);
      } catch (error) {
        if (redisConnection && redisConnection.status === 'ready') {
          await releaseLock(cacheKey);
        }
        throw error;
      }
    } else {
      for (let attempt = 0; attempt < 10; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        const cached = await redisConnection!.get(cacheKey);
        if (cached) {
          res.setHeader('Content-Type', 'application/json');
          return res.status(200).send(cached);
        }
      }
      return sendSuccess(res, [], undefined, undefined, 200);
    }
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

    await invalidateTimetableCache();

    return sendSuccess(res, slot, 'Operation completed successfully.', undefined, 201);
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

    await invalidateTimetableCache();

    return sendSuccess(res, slot, 'Operation completed successfully.', undefined, 200);
  } catch (error: any) {
    return sendError(res, error.message || 'Timetable scheduling conflict detected', 'CONFLICT', 409);
  }
};

export const deleteSlotHandler = async (req: Request, res: Response) => {
  try {
    const slotId = Number(req.params.id);
    await deleteTimetableSlot(slotId);

    await invalidateTimetableCache();

    return sendSuccess(res, { message: 'Slot deleted successfully' });
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to delete timetable slot');
  }
};

export const getVersionsHandler = async (req: Request, res: Response) => {
  try {
    const cacheKey = 'api:admin:timetable:versions';

    if (redisConnection && redisConnection.status === 'ready') {
      const cached = await redisConnection.get(cacheKey);
      if (cached) {
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).send(cached);
      }
    }

    let isLeader = false;
    if (redisConnection && redisConnection.status === 'ready') {
      isLeader = await acquireLock(cacheKey, 5);
    } else {
      isLeader = true;
    }

    if (isLeader) {
      try {
        const timetables = await prisma.timetable.findMany({
          orderBy: { createdat: 'desc' }
        });
        const fullResponse = { success: true, data: timetables };

        if (redisConnection && redisConnection.status === 'ready') {
          await redisConnection.setex(cacheKey, 30, JSON.stringify(fullResponse));
          await releaseLock(cacheKey);
        }
        return sendSuccess(res, (fullResponse as any).data || fullResponse, undefined, undefined, 200);
      } catch (error) {
        if (redisConnection && redisConnection.status === 'ready') {
          await releaseLock(cacheKey);
        }
        throw error;
      }
    } else {
      for (let attempt = 0; attempt < 10; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        const cached = await redisConnection!.get(cacheKey);
        if (cached) {
          res.setHeader('Content-Type', 'application/json');
          return res.status(200).send(cached);
        }
      }
      return sendSuccess(res, [], undefined, undefined, 200);
    }
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

    await invalidateTimetableCache();

    return sendSuccess(res, updated);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to publish timetable');
  }
};

export const getTimetableOfferingsHandler = async (req: Request, res: Response) => {
  try {
    const cacheKey = 'api:admin:timetable:offerings';

    if (redisConnection && redisConnection.status === 'ready') {
      const cached = await redisConnection.get(cacheKey);
      if (cached) {
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).send(cached);
      }
    }

    let isLeader = false;
    if (redisConnection && redisConnection.status === 'ready') {
      isLeader = await acquireLock(cacheKey, 5);
    } else {
      isLeader = true;
    }

    if (isLeader) {
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

        const fullResponse = { success: true, data: formatted };

        if (redisConnection && redisConnection.status === 'ready') {
          await redisConnection.setex(cacheKey, 30, JSON.stringify(fullResponse));
          await releaseLock(cacheKey);
        }
        return sendSuccess(res, (fullResponse as any).data || fullResponse, undefined, undefined, 200);
      } catch (error) {
        if (redisConnection && redisConnection.status === 'ready') {
          await releaseLock(cacheKey);
        }
        throw error;
      }
    } else {
      for (let attempt = 0; attempt < 10; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        const cached = await redisConnection!.get(cacheKey);
        if (cached) {
          res.setHeader('Content-Type', 'application/json');
          return res.status(200).send(cached);
        }
      }
      return sendSuccess(res, [], undefined, undefined, 200);
    }
  } catch (error: any) {
    console.error('Error fetching timetable offerings:', error);
    return sendError(res, error.message);
  }
};

export const getTimetableProgramsHandler = async (req: Request, res: Response) => {
  try {
    const cacheKey = 'api:admin:timetable:programs';

    if (redisConnection && redisConnection.status === 'ready') {
      const cached = await redisConnection.get(cacheKey);
      if (cached) {
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).send(cached);
      }
    }

    let isLeader = false;
    if (redisConnection && redisConnection.status === 'ready') {
      isLeader = await acquireLock(cacheKey, 5);
    } else {
      isLeader = true;
    }

    if (isLeader) {
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

        const fullResponse = { success: true, data: formatted };

        if (redisConnection && redisConnection.status === 'ready') {
          await redisConnection.setex(cacheKey, 30, JSON.stringify(fullResponse));
          await releaseLock(cacheKey);
        }
        return sendSuccess(res, (fullResponse as any).data || fullResponse, undefined, undefined, 200);
      } catch (error) {
        if (redisConnection && redisConnection.status === 'ready') {
          await releaseLock(cacheKey);
        }
        throw error;
      }
    } else {
      for (let attempt = 0; attempt < 10; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        const cached = await redisConnection!.get(cacheKey);
        if (cached) {
          res.setHeader('Content-Type', 'application/json');
          return res.status(200).send(cached);
        }
      }
      return sendSuccess(res, [], undefined, undefined, 200);
    }
  } catch (error: any) {
    console.error('Error fetching timetable programs:', error);
    return sendError(res, error.message || 'Failed to fetch programs');
  }
};
