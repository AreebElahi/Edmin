import { z } from 'zod';

export const toggleUserStatusSchema = z.object({
  isActive: z.boolean()
}).strict();

export const userParamsSchema = z.object({
  id: z.string().regex(/^\d+$/)
}).strict();
