import { apiGet, apiPost, apiPatch } from '../../../api/apiContract';
import { apiClient } from '../../../api/apiClient';
import { unwrap } from '../../../api/apiContract';


export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  dept: string;
  status: string;
}

export interface AuditLog {
  action: string;
  timestamp: string;
  performedBy: string;
}

export interface Department {
  departmentid: number;
  name: string;
  code: string;
}

export interface GetUsersFilters {
  role?: string;
  status?: string;
  departmentId?: string;
  search?: string;
}

export interface RegisterUserPayload {
  name: string;
  email?: string;
  role: string;
  departmentId?: number;
}

export const getUsers = (filters: GetUsersFilters = {}): Promise<User[]> => {
  const params = new URLSearchParams();
  if (filters.role) params.append('role', filters.role);
  if (filters.status) params.append('status', filters.status);
  if (filters.departmentId) params.append('departmentId', filters.departmentId);
  if (filters.search) params.append('search', filters.search);
  return apiGet<User[]>(`/admin/users?${params.toString()}`);
};

export const registerUser = (payload: RegisterUserPayload): Promise<{ user: User; tempPassword: string }> =>
  apiPost<{ user: User; tempPassword: string }>('/admin/users', payload);

export const toggleUserStatus = (userId: string, isActive: boolean): Promise<{ id: string; status: string }> =>
  apiPatch<{ id: string; status: string }>(`/admin/users/${userId}/status`, { isActive });

export const getDepartments = (): Promise<Department[]> =>
  apiGet<Department[]>('/admin/departments');

export const resetUserPassword = (userId: string): Promise<{ userId: number; temporaryPassword: string }> =>
  apiPatch<{ userId: number; temporaryPassword: string }>(`/admin/users/${userId}/password-reset`);

export const getUserAuditLogs = (userId: string): Promise<AuditLog[]> =>
  apiGet<AuditLog[]>(`/admin/users/${userId}/audit`);

export const bulkImportUsers = async (file: File): Promise<{ created: number; failed: number; errors: string[] }> => {
  const formData = new FormData();
  formData.append('file', file);
  const envelope = await (apiClient.post('/admin/users/bulk-import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }) as unknown as Promise<import('../../../types/api').ApiResponse<{ created: number; failed: number; errors: string[] }>>);
  return unwrap(envelope);
};

export const assignUserRole = (userId: string, roleName: string, action: 'assign' | 'revoke'): Promise<any> =>
  apiPost<any>(`/admin/users/${userId}/roles`, { roleName, action });

