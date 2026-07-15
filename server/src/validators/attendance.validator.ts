import { z } from 'zod';
import { id } from './common/primitives.js';

export const attendanceRecordSchema = z.object({
  studentId: z.union([z.coerce.number().int().positive(), z.string()]),
  status: z.enum(['present', 'absent', 'late', 'PRESENT', 'ABSENT', 'LATE']),
}).strict();

export const markAttendanceSchema = z.object({
  records: z.preprocess((val) => {
    if (typeof val === 'string') {
      try { return JSON.parse(val); } catch (e) { return val; }
    }
    return val;
  }, z.array(attendanceRecordSchema)),
  sessionId: id.optional(), // Used in faculty.routes.ts where sessionId is in body
}).strict();

export const createAttendanceSessionSchema = z.object({
  courseOfferingId: id,
  sessionDate: z.coerce.date(),
  startTime: z.coerce.date().optional(),
  endTime: z.coerce.date().optional(),
  topic: z.string().optional(),
}).strict();

export const attendanceParamsSchema = z.object({
  sessionId: id,
}).strict();

/* 
 * NOTE ON MULTIPART/FORM-DATA & PHOTO EVIDENCE:
 * When attendance marking includes photo evidence, the route must use `multer` to handle the file upload.
 * 
 * IMPORTANT MIDDLEWARE ORDERING:
 * 1. authenticate
 * 2. upload.single('photo') // MUST RUN BEFORE validateRequest to parse req.body and req.file
 * 3. validateRequest({ body: markAttendanceSchema }) // Validates the JSON fields
 * 4. controller
 * 
 * The multer configuration itself should handle the documented secondary check:
 * const upload = multer({
 *   limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
 *   fileFilter: (req, file, cb) => {
 *     if (['image/jpeg', 'image/png'].includes(file.mimetype)) cb(null, true);
 *     else cb(new Error('Invalid file type'));
 *   }
 * });
 */
