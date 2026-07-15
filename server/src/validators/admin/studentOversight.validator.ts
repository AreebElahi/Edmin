import { z } from 'zod';
import { id } from '../common/primitives.js';

export const overrideEnrollmentRequestSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
  comment: z.string().optional(),
}).strict();

export const studentOversightParamsSchema = z.object({
  id: id,
}).strict();
