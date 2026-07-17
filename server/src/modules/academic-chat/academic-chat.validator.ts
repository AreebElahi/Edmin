import { z } from 'zod';

export const academicChatValidator = {
  createSession: {
    body: z.object({
      targetUserId: z.number().int('Target user ID must be an integer'),
      courseOfferingId: z.number().int().optional(),
    }),
  },
  sendMessage: {
    body: z.object({
      message: z.string().min(1, 'Message is required').max(5000, 'Message is too long (max 5000 chars)'),
    }),
  },
};
