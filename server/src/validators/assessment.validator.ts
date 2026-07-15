import { z } from 'zod';
import { id } from './common/primitives.js';

const validGrades = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F', 'N/A'] as const;

export const createAssessmentSchema = z.object({
  courseOfferingId: id,
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  maxMarks: z.coerce.number().nonnegative('Max marks must be a positive number or zero'),
  dueDate: z.coerce.date().optional(),
}).strict();

export const updateAssessmentSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  maxMarks: z.coerce.number().nonnegative().optional(),
  dueDate: z.coerce.date().optional(),
}).strict();

export const submitAssessmentResultSchema = z.object({
  studentId: id,
  obtainedMarks: z.coerce.number().nonnegative('Obtained marks must be a positive number or zero'),
  remarks: z.string().max(1000).optional(),
}).strict();

export const updateStudentGradeSchema = z.object({
  grade: z.enum(validGrades),
}).strict();

export const assessmentParamsSchema = z.object({
  id: id,
}).strict();

export const assessmentResultParamsSchema = z.object({
  assessmentId: id,
}).strict();

export const enrollmentParamsSchema = z.object({
  enrollmentId: id,
}).strict();
