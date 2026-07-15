import { z } from 'zod';
import { id } from '../common/primitives.js';

export const overrideTeachingLoadSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
  comment: z.string().optional(),
}).strict();

export const reassignTeachingLoadCourseSchema = z.object({
  courseOfferingIds: z.array(z.coerce.number().int().positive()),
}).strict();

export const overrideLeaveSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT', 'ARCHIVE']),
  comment: z.string().optional(),
}).strict();

export const overrideActivityReportSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT', 'ARCHIVE']),
  comment: z.string().optional(),
}).strict();

export const facultyOversightParamsSchema = z.object({
  id: id,
}).strict();
