import { z } from 'zod';

export const createLeaveSchema = z.object({
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  leaveType: z.string().min(1),
  reason: z.string().min(1)
}).strict();

export const commentLeaveSchema = z.object({
  comment: z.string().min(1)
}).strict();
