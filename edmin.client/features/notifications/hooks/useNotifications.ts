import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNotifications, markRead, markAllRead, Notification } from '../api/notificationApi';

export const NOTIFICATIONS_QUERY_KEY = ['notifications'] as const;

export function useNotifications(limit: number = 20) {
  const queryClient = useQueryClient();

  const query = useQuery<Notification[], Error>({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: () => getNotifications(limit),
    refetchInterval: 15000, // Poll every 15 seconds to keep notifications updated
    staleTime: 5000,
  });

  const markAsReadMutation = useMutation<{ message: string }, Error, number>({
    mutationFn: markRead,
    onSuccess: (_, notificationId) => {
      // Optimistic update
      queryClient.setQueryData<Notification[]>(NOTIFICATIONS_QUERY_KEY, (old) => {
        if (!old) return [];
        return old.map(n => n.notificationid === notificationId ? { ...n, isread: true } : n);
      });
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    }
  });

  const markAllAsReadMutation = useMutation<{ message: string }, Error, void>({
    mutationFn: markAllRead,
    onSuccess: () => {
      // Optimistic update
      queryClient.setQueryData<Notification[]>(NOTIFICATIONS_QUERY_KEY, (old) => {
        if (!old) return [];
        return old.map(n => ({ ...n, isread: true }));
      });
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    }
  });

  return {
    notifications: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    markAsRead: markAsReadMutation.mutateAsync,
    markAllAsRead: markAllAsReadMutation.mutateAsync,
    unreadCount: (query.data ?? []).filter(n => !n.isread).length,
  };
}
