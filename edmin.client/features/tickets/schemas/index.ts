import { z } from 'zod';

export const CreateTicketSchema = z.object({
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(255, 'Subject is too long'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  source_type: z.enum(['MANUAL', 'AUTOMATED']).default('MANUAL'),
  entity_type: z.string().max(100).optional(),
  entity_id: z.number().int().positive().optional()
});

export const ResolveTicketSchema = z.object({
  resolutionText: z.string().min(10, 'Resolution text must be at least 10 characters.'),
  version: z.number().int().positive() // Must be passed for OCC
});

export const AssignTicketSchema = z.object({
  assignee_id: z.number().int().positive(),
  version: z.number().int().positive() // Must be passed for OCC
});

export const CreateTicketMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(2000, 'Message is too long'),
  is_internal: z.boolean().default(false)
});
