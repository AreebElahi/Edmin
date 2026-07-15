import { apiGet, apiPatch, apiPost } from '@/api/apiContract';

export interface UserProfile {
  userId: number;
  username: string;
  fullName: string | null;
  email: string;
  institutionalEmail: string | null;
  identifier: string | null;
  role: string;
  accountStatus: string;
  mustChangePassword: boolean;
  createdAt: string;
  phone: string | null;
  employeeId: string | null;
  department: string | null;
  designation: string | null;
  stats?: any;
  tags?: string[];
}

export interface UpdateProfilePayload {
  phone?: string;
  expertise?: string[];
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

/** Fetch the current logged-in user's enriched profile */
export function getMyProfile(): Promise<UserProfile> {
  return apiGet<UserProfile>('/auth/me');
}

/** Update editable profile fields */
export function updateMyProfile(data: UpdateProfilePayload): Promise<{ message: string }> {
  return apiPatch<{ message: string }>('/auth/profile', data);
}

/** Change password via the identity controller */
export function changeMyPassword(data: ChangePasswordPayload): Promise<{ message: string }> {
  return apiPost<{ message: string }>('/auth/change-password', data);
}

/** Upload base64 avatar */
export function uploadAvatar(avatar: string): Promise<{ message: string; avatar: string }> {
  return apiPatch<{ message: string; avatar: string }>('/auth/avatar', { avatar });
}

/** Get current avatar (DB-stored, for faculty/student only) */
export function getAvatar(): Promise<{ avatar: string | null }> {
  return apiGet<{ avatar: string | null }>('/auth/avatar');
}
