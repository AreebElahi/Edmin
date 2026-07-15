import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getUsers, 
  registerUser, 
  toggleUserStatus, 
  getDepartments,
  resetUserPassword,
  getUserAuditLogs,
  bulkImportUsers,
  assignUserRole,
  GetUsersFilters,  
  RegisterUserPayload,
  User,
  AuditLog
} from '../api/userApi';

export const useUsers = (filters: GetUsersFilters) => {
  return useQuery({
    queryKey: ['users', filters],
    queryFn: () => getUsers(filters),
  });
};

export const useDepartments = () => {
  return useQuery({
    queryKey: ['departments'],
    queryFn: getDepartments,
    staleTime: 5 * 60 * 1000,
  });
};

export const useRegisterUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RegisterUserPayload) => registerUser(payload),
    onSuccess: () => {
      // Invalidate users list to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useToggleUserStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) => toggleUserStatus(userId, isActive),
    onMutate: async ({ userId, isActive }) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['users'] });

      // Snapshot the previous value
      const previousUsers = queryClient.getQueryData<User[]>(['users']);

      // Optimistically update to the new value
      if (previousUsers) {
        queryClient.setQueryData<User[]>(
          ['users'], 
          previousUsers.map(user => user.id === userId ? { ...user, status: isActive ? 'Active' : 'Inactive' } : user)
        );
      }

      // Return a context object with the snapshotted value
      return { previousUsers };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousUsers) {
        queryClient.setQueryData(['users'], context.previousUsers);
      }
    },
    onSettled: () => {
      // Always refetch after error or success to ensure data is in sync
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useResetUserPassword = () => {
  return useMutation({
    mutationFn: (userId: string) => resetUserPassword(userId),
  });
};

export const useUserAuditLogs = (userId: string) => {
  return useQuery({
    queryKey: ['auditLogs', userId],
    queryFn: () => getUserAuditLogs(userId),
    enabled: !!userId,
  });
};

export const useBulkImportUsers = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => bulkImportUsers(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useAssignUserRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, roleName, action }: { userId: string, roleName: string, action: 'assign' | 'revoke' }) => assignUserRole(userId, roleName, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
    },
  });
};
