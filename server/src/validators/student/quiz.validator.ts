import { z } from 'zod';

export const quizAttemptSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.number().int().positive({ message: 'questionId must be a positive integer' }),
      selectedOptionId: z.number().int().positive({ message: 'selectedOptionId must be a positive integer' }),
    })
  ).min(1, { message: 'At least one answer must be submitted' }),
});
