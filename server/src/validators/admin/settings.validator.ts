import { z } from 'zod';
import { id } from '../common/primitives.js';

export const updateConfigSchema = z.object({
  maintenanceMode: z.boolean().optional(),
  aiEnabled: z.boolean().optional(),
  institutionName: z.string().optional(),
  supportContactEmail: z.string().email().optional(),
  maxUploadSizeLimit: z.string().optional(),
  globalAttendanceThreshold: z.coerce.number().min(0).max(100).optional(),
  maxQuizQuestions: z.coerce.number().positive().optional(),
  minimumTeachingCredits: z.coerce.number().positive().optional(),
  maximumTeachingCredits: z.coerce.number().positive().optional(),
}).strict();

export const restoreBackupSchema = z.object({
  backupId: z.string().min(1, 'Backup ID is required'),
}).strict();

export const settingsParamsSchema = z.object({
  id: id,
}).strict();
