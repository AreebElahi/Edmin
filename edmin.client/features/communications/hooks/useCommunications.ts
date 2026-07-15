import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { communicationsApi, BroadcastItem } from '../api/communicationsApi';
import { toast } from 'sonner';

export const useScheduledBroadcasts = () => {
    return useQuery<BroadcastItem[]>({
        queryKey: ['broadcastQueue'],
        queryFn: communicationsApi.getQueue
    });
};

export const useBroadcastHistory = () => {
    return useQuery<BroadcastItem[]>({
        queryKey: ['broadcastHistory'],
        queryFn: communicationsApi.getHistory
    });
};

export const useCreateBroadcast = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: communicationsApi.broadcastAnnouncement,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['broadcastQueue'] });
            queryClient.invalidateQueries({ queryKey: ['broadcastHistory'] });
            toast.success('Broadcast announcement dispatched successfully');
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Failed to dispatch broadcast');
        }
    });
};

export const useCancelBroadcast = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: communicationsApi.cancelScheduled,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['broadcastQueue'] });
            toast.success('Scheduled broadcast cancelled successfully');
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Failed to cancel scheduled broadcast');
        }
    });
};
