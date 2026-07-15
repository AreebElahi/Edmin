import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { courseApi, Course } from '../api/courseApi';
import { toast } from 'sonner';

export const useCourses = () => {
    return useQuery<Course[]>({
        queryKey: ['courses'],
        queryFn: courseApi.getAllCourses
    });
};

export const useCreateCourse = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: courseApi.createCourse,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['courses'] });
            toast.success('Course created successfully');
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Failed to create course');
        }
    });
};

export const useUpdateCourse = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number, data: any }) => courseApi.updateCourse(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['courses'] });
            toast.success('Course updated successfully');
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Failed to update course');
        }
    });
};

export const useToggleCourseStatus = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, isactive }: { id: number, isactive: boolean }) => courseApi.toggleCourseStatus(id, isactive),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['courses'] });
            toast.success(`Course ${data.isactive ? 'activated' : 'archived'} successfully`);
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Failed to update course status');
        }
    });
};
