import { z } from 'zod';

export const createCourseOfferingSchema = z.object({
  courseId: z.union([z.string(), z.number()]),
  semesterId: z.union([z.string(), z.number()]),
  departmentId: z.union([z.string(), z.number()]),
  facultyId: z.union([z.string(), z.number()])
}).strict();
