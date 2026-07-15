import { z } from 'zod';
import { email, phone } from './common/primitives.js';

export const loginSchema = z.object({
  email: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
}).strict();

export const signupSchema = z.object({
  email: email,
  password: z.string().min(8, 'Password must be at least 8 characters long'),
}).strict();

export const updateProfileSchema = z.object({
  phone: phone.optional().nullable(),
  expertise: z.array(z.string()).optional(),
}).strict();

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters long'),
}).strict();

export const forgotPasswordSchema = z.object({
  email: email,
}).strict();

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters long'),
}).strict();
