import { z } from 'zod';
import { id } from '../common/primitives.js';

export const createRoomSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  capacity: z.coerce.number().int().positive(),
  building: z.string().optional(),
}).strict();

export const slotSchema = z.object({
  offeringId: id,
  sectionId: id,
  roomId: id,
  dayOfWeek: z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
}).strict();

export const publishTimetableSchema = z.object({
  timetableId: id,
}).strict();

export const timetableParamsSchema = z.object({
  id: id,
}).strict();
