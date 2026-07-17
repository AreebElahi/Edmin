import { z } from 'zod';
import { complaint_status, complaint_priority } from '@prisma/client';

export const createComplaintSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  description: z.string().min(1, "Description is required"),
  priority: z.nativeEnum(complaint_priority).optional().default('MEDIUM')
}).strict();

export const updateComplaintStatusSchema = z.object({
  status: z.nativeEnum(complaint_status)
}).strict();

export const sendComplaintMessageSchema = z.object({
  message: z.string().min(1, "Message cannot be empty")
}).strict();
