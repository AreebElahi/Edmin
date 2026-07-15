import { z } from 'zod';

export const createTeachingLoadSchema = z.object({
  semesterId: z.union([z.string(), z.number()]),
  courseOfferingIds: z.array(z.union([z.string(), z.number()]))
}).strict();
