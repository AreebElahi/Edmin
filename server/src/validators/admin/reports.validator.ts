import { z } from 'zod';

export const reportQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  format: z.string().optional(),
  token: z.string().optional()
}).strict().refine(data => {
  if (data.startDate && data.endDate) {
    return data.endDate >= data.startDate;
  }
  return true;
}, {
  message: "endDate must be after or equal to startDate",
  path: ["endDate"],
});
