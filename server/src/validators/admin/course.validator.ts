import { z } from 'zod';
import { id } from '../common/primitives.js';

export const createCourseSchema = z.object({
  code: z.string().min(1, 'Course code is required'),
  name: z.string().min(1, 'Course name is required'),
  credits: z.coerce.number().int().positive(),
  basecapacity: z.coerce.number().int().positive(),
  description: z.string().optional(),
  departmentIds: z.array(id).optional(),
}).strict();

export const updateCourseSchema = z.object({
  code: z.string().optional(),
  name: z.string().optional(),
  credits: z.coerce.number().int().positive().optional(),
  basecapacity: z.coerce.number().int().positive().optional(),
  description: z.string().optional(),
  departmentIds: z.array(id).optional(),
}).strict();

export const toggleCourseStatusSchema = z.object({
  isactive: z.boolean(),
}).strict();

export const courseParamsSchema = z.object({
  id: id,
}).strict();
