import { z } from 'zod';
import { id } from '../common/primitives.js';

export const createQuizBankSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  courseId: id,
}).strict();

export const updateQuizBankSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  isactive: z.boolean().optional(),
}).strict();

export const quizParamsSchema = z.object({
  id: id,
}).strict();
