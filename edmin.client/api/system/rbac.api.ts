import { apiGet } from '../apiContract';

/**
 * Retrieves the current logged in user's permissions array.
 */
export const getUserPermissions = (): Promise<string[]> =>
  apiGet<string[]>('/auth/me/permissions');
