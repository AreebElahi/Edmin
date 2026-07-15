import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { changeMyPassword, ChangePasswordPayload } from '../api/profileApi';

/**
 * Mutation hook to change the current user's password.
 * Calls POST /auth/change-password with { currentPassword, newPassword }.
 * Returns { onSuccess, onError } lifecycle via mutateAsync.
 */
export function useChangePassword() {
  return useMutation<{ message: string }, Error, ChangePasswordPayload>({
    mutationFn: changeMyPassword,
    onSuccess: () => {
      toast.success('Password changed successfully!');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to change password. Please check your current password.');
    },
  });
}
