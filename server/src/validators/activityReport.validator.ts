import { z } from 'zod';

export const createReportSchema = z.object({
  reportDate: z.string().min(1),
  summary: z.string().min(1),
  activities: z.array(z.object({
    title: z.string().min(1),
    detail: z.string().min(1)
  }))
}).strict();
