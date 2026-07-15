export type UserType = 'STUDENT' | 'FACULTY' | 'STAFF';

export interface IdentityPreview {
  username: string;
  institutionalEmail: string;
  identifier: string;
}

export interface RegisterUserPayload {
  name: string;
  email?: string; // Optional - if provided, the admin override is used; otherwise institutional is generated
  role: string;   // e.g. STUDENT, FACULTY, STAFF, HR, ADMIN
  departmentId?: number;
  adminId: number;
}
