import { z } from 'zod';
import { id } from '../common/primitives.js';

export const createDepartmentSchema = z.object({
  name: z.string().min(1, 'Department name is required'),
  hodid: id.optional().nullable(),
  supervisorid: id.optional().nullable(),
}).strict();

export const updateDepartmentSchema = z.object({
  name: z.string().optional(),
  hodid: id.optional().nullable(),
  supervisorid: id.optional().nullable(),
  isactive: z.boolean().optional(),
}).strict();

export const assignDepartmentManagersSchema = z.object({
  hodId: id.optional().nullable(),
  supervisorId: id.optional().nullable(),
}).strict();

export const mapCourseToDepartmentSchema = z.object({
  courseid: z.union([z.string(), z.number()])
}).strict();

export const departmentParamsSchema = z.object({
  id: id,
}).strict();
