import { useMutation } from '@tanstack/react-query';
import { apiPost } from '../../../api/apiContract';

interface ForgotPasswordPayload {
  email: string;
}

interface ForgotPasswordResponse {
  message: string;
}

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: async (payload: ForgotPasswordPayload) => {
      return await apiPost<ForgotPasswordResponse>('/auth/forgot-password', payload);
    },
  });
};
