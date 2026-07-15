import { z } from 'zod';

export const createEnrollmentSchema = z.object({
  courseOfferingId: z.coerce.number().int().positive()
}).strict();

export const enrollStudentDirectlySchema = z.object({
  studentId: z.union([z.string(), z.number()]),
  courseOfferingId: z.union([z.string(), z.number()])
}).strict();
