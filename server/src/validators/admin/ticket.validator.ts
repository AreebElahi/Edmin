import { z } from 'zod';
import { id } from '../common/primitives.js';

export const createTicketSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
}).strict();

export const assignTicketSchema = z.object({
  assignedToId: id,
}).strict();

export const updateTicketStatusSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']),
  resolution: z.string().optional(),
}).strict();

export const createTicketMessageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
}).strict();

export const ticketParamsSchema = z.object({
  id: id,
}).strict();
