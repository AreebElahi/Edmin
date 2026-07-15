import { z } from 'zod';

export const createQuizSchema = z.object({
  courseOfferingId: z.union([z.string(), z.number()]),
  title: z.string().min(1),
  duration: z.number().min(1),
  totalMarks: z.number().min(1)
}).strict();

export const submitActivityReportSchema = z.object({
  date: z.string().min(1),
  summary: z.string().optional(),
  activities: z.array(z.object({
    title: z.string().min(1),
    detail: z.string().min(1)
  }))
}).strict();

export const submitLeaveRequestSchema = z.object({
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  leaveType: z.string().min(1),
  reason: z.string().min(1)
}).strict();

export const chatSchema = z.object({
  message: z.string().min(1)
}).strict();
