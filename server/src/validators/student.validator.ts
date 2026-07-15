import { z } from 'zod';

export const submitAssignmentSchema = z.object({}).strict();

export const quizIdParamSchema = z.object({
  quizId: z.string().regex(/^\d+$/, 'quizId must be a numeric string')
});

export const notificationIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'id must be a numeric string')
});
