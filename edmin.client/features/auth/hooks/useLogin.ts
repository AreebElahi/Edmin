import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../../../api/apiClient';
import { useAuth } from '../../../providers/AuthProvider';

interface LoginPayload {
  email: string;
  password?: string; // Standard or SSO
}

interface LoginResponse {
  data: {
    access_token: string;
    user: any;
  };
}

export const useLogin = () => {
  const { login } = useAuth();

  return useMutation({
    mutationFn: async (credentials: LoginPayload) => {
      // The apiClient automatically extracts { success, data, error }
      // The auth endpoint returns { success, session } directly, not wrapped in data.
      const response = await apiClient.post<any>('/auth/login', credentials);
      return response as any;
    },
    onSuccess: (data) => {
      if (data && data.data?.access_token) {
        // Pass both token and the mustChangePassword flag
        login(data.data.access_token, data.data.user?.mustChangePassword);
        
        // Wait for auth context to settle, then redirect
      }
    },
  });
};
