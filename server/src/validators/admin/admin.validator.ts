import { z } from 'zod';

export const registerUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().optional(),
  role: z.string().min(1),
  departmentId: z.union([z.string(), z.number()]).optional()
}).strict();

export const assignUserRoleSchema = z.object({
  roleName: z.string().min(1),
  action: z.enum(['assign', 'revoke'])
}).strict();

export const createSectionSchema = z.object({}).strict();
