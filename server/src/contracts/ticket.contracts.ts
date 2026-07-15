import { z } from 'zod';

// Pagination Cursor schema
export const PaginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
});

// Create Ticket Payload
export const CreateTicketSchema = z.object({
  subject: z.string().min(5).max(255),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  source_type: z.enum(['MANUAL', 'AUTOMATED']).default('MANUAL'),
  entity_type: z.string().max(100).optional(),
  entity_id: z.number().int().positive().optional()
});

// Resolve Ticket Payload
export const ResolveTicketSchema = z.object({
  resolutionText: z.string().min(10, 'Resolution text must be at least 10 characters.'),
  version: z.number().int().positive().describe('Optimistic Concurrency Control version')
});

// Domain Event Payload
export const TicketResolvedEventSchema = z.object({
  ticketId: z.number().int().positive(),
  status: z.literal('RESOLVED'),
  resolvedBy: z.number().int().positive()
});
