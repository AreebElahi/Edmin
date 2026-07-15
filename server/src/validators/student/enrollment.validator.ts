import { z } from 'zod';

export const enrollmentSchema = z.object({
  courseOfferingId: z.number().int().positive({ message: 'courseOfferingId must be a positive integer' }),
});
