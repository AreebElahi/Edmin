import { z } from 'zod';
import { id } from '../common/primitives.js';

export const createFeePlanSchema = z.object({
  programid: id,
  tuitionpercredit: z.coerce.number().positive(),
  labfees: z.coerce.number().min(0),
  registrationfee: z.coerce.number().min(0),
}).strict();

export const generateInvoiceSchema = z.object({
  studentId: id,
  semesterId: id,
  enrolledCredits: z.coerce.number().positive().optional(),
}).strict();

export const recordPaymentSchema = z.object({
  invoiceId: id,
  amount: z.coerce.number().positive(),
  method: z.string().min(1, 'Method is required'),
  transactionRef: z.string().optional(),
}).strict();
