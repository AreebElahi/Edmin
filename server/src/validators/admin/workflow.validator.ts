import { z } from 'zod';
import { id } from '../common/primitives.js';

export const injectEventSchema = z.object({
  event_type: z.string().min(1, 'Event type is required'),
  aggregate_type: z.string().min(1, 'Aggregate type is required'),
  aggregate_id: z.coerce.number().int().positive(),
  payload: z.any(), // Payload shape is specific to the event_type
}).strict();

export const overrideEscalationSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
  comment: z.string().optional(),
}).strict();

export const workflowParamsSchema = z.object({
  id: id,
}).strict();
