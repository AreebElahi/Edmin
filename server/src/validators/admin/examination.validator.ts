import { z } from 'zod';

export const createExamScheduleSchema = z.object({
  assessmentId: z.union([z.string(), z.number()]),
  roomId: z.union([z.string(), z.number()]),
  sectionId: z.union([z.string(), z.number()]),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  duration: z.union([z.string(), z.number()]),
  examType: z.string(),
  facultyId: z.union([z.string(), z.number()]).optional()
}).strict();

export const executePromotionSchema = z.object({
  status: z.enum(['ACTIVE', 'ALUMNI', 'SUSPENDED', 'PENDING_SECTION_ASSIGNMENT', 'WAITLISTED']),
  standing: z.string().min(1),
  comment: z.string().optional()
}).strict();

export const examParamsSchema = z.object({
  id: z.string().regex(/^\d+$/)
}).strict();

export const promoteParamsSchema = z.object({
  studentId: z.string().regex(/^\d+$/)
}).strict();
