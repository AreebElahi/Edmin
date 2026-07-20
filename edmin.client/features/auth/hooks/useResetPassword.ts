import { useMutation } from '@tanstack/react-query';
import { apiPost } from '../../../api/apiContract';

interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}

interface ResetPasswordResponse {
  message: string;
}

export const useResetPassword = () => {
  return useMutation({
    mutationFn: async (payload: ResetPasswordPayload) => {
      return await apiPost<ResetPasswordResponse>('/auth/reset-password', payload);
    },
  });
};
