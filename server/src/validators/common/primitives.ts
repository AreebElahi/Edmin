import { z } from 'zod';

// Shared Zod primitives

/**
 * Validates numeric IDs (used as primary keys in Prisma schema)
 */
export const id = z.coerce.number().int().positive();

/**
 * Validates standard email formats
 */
export const email = z.string().email();

/**
 * Validates phone numbers (E.164 format or standard local formats)
 * Allows optional leading +, followed by digits and optional spaces/dashes.
 */
export const phone = z.string().regex(/^\+?[\d\s\-]{7,20}$/, "Invalid phone format");

/**
 * Pagination schema with safe defaults and upper bounds
 */
export const pagination = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

/**
 * Date range schema ensuring start date is before or equal to end date
 */
export const dateRange = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
}).refine(data => data.endDate >= data.startDate, {
  message: "endDate must be after or equal to startDate",
  path: ["endDate"],
});
