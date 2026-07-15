import { z } from 'zod';
import { id } from '../common/primitives.js';

export const broadcastAnnouncementSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  content: z.string().min(1, 'Content is required').max(10000, 'Content is too long'),
  targetRole: z.string().optional(),
  priority: z.enum(['Low', 'Normal', 'High', 'Urgent']).optional(),
  isScheduled: z.boolean().optional(),
  scheduleDate: z.coerce.date().optional(),
}).strict();

export const communicationsParamsSchema = z.object({
  id: z.string(), // ID might be prefixed with 'S' according to the controller response, or just numeric. Let's use string to be safe.
}).strict();
