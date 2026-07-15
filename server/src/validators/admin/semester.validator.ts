import { z } from 'zod';
import { id } from '../common/primitives.js';

export const createSemesterSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  year: z.coerce.number().int().positive(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  durationWeeks: z.coerce.number().int().positive().optional(),
}).strict();

export const rolloverSemesterSchema = z.object({
  targetSemesterId: id,
}).strict();
