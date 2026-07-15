import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { timetableApi, Room, TimetableSlot, TimetableVersion, TimetableOffering, Program } from '../api/timetableApi';
import { toast } from 'sonner';

export const useRooms = () => {
    return useQuery<Room[]>({
        queryKey: ['rooms'],
        queryFn: timetableApi.getRooms
    });
};

export const useCreateRoom = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: timetableApi.createRoom,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rooms'] });
            toast.success('Room registered successfully');
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Failed to register room');
        }
    });
};

export const useDeleteRoom = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: timetableApi.deleteRoom,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rooms'] });
            toast.success('Room archived successfully');
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Failed to archive room');
        }
    });
};

export const useTimetableSlots = () => {
    return useQuery<TimetableSlot[]>({
        queryKey: ['slots'],
        queryFn: timetableApi.getSlots
    });
};

export const useCreateTimetableSlot = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: timetableApi.createSlot,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['slots'] });
            toast.success('Timetable slot created successfully');
        },
        onError: (error: any) => {
            const msg = error?.message || 'Conflict detected: Failed to create timetable slot';
            toast.error(msg);
            alert(`⚠️ Scheduling Conflict:\n\n${msg}`);
        }
    });
};

export const useUpdateTimetableSlot = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) => timetableApi.updateSlot(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['slots'] });
            toast.success('Timetable slot updated successfully');
        },
        onError: (error: any) => {
            const msg = error?.message || 'Conflict detected: Failed to update timetable slot';
            toast.error(msg);
            alert(`⚠️ Scheduling Conflict:\n\n${msg}`);
        }
    });
};

export const useDeleteTimetableSlot = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: timetableApi.deleteSlot,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['slots'] });
            toast.success('Timetable slot deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Failed to delete slot');
        }
    });
};

export const useTimetableVersions = () => {
    return useQuery<TimetableVersion[]>({
        queryKey: ['versions'],
        queryFn: timetableApi.getVersions
    });
};

export const usePublishTimetable = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: timetableApi.publishTimetable,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['versions'] });
            toast.success('Timetable published successfully');
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Failed to publish timetable');
        }
    });
};

export const useTimetableOfferings = () => {
    return useQuery<TimetableOffering[]>({
        queryKey: ['timetableOfferings'],
        queryFn: timetableApi.getOfferings
    });
};

export const useTimetablePrograms = () => {
    return useQuery<Program[]>({
        queryKey: ['timetablePrograms'],
        queryFn: timetableApi.getPrograms
    });
};
