import { role_enum } from '@prisma/client';

/**
 * Single source of truth for mapping a user's primary enum role
 * to the granular string roles in the `Role` table.
 * 
 * Used during provisioning (signup/admin creation) and backfilling
 * to ensure all users have explicit `UserRole` mapping entries.
 */
export const ROLE_DEFAULT_USERROLE_MAP: Record<role_enum, string[]> = {
  STUDENT: ['STUDENT'],
  FACULTY: ['FACULTY'],
  ADMIN: ['ADMIN'],
  HR: ['HR'],
  STAFF: ['STAFF'] // Assuming STAFF exists in Role table if needed
};
