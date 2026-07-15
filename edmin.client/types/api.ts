export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

// User context stored in JWT
export interface AuthUser {
  id: number;
  role: string;
  subRole?: string;
  exp?: number;
}
