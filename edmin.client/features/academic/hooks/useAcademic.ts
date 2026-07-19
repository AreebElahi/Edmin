import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { academicApi, Semester } from '../api/academicApi';
import { toast } from 'sonner';

export const useSemesters = () => {
    return useQuery<Semester[]>({
        queryKey: ['semesters'],
        queryFn: academicApi.getSemesters
    });
};

export const useCreateSemester = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: academicApi.createSemester,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['semesters'] });
            toast.success('Semester drafted successfully');
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Failed to draft semester');
        }
    });
};

export const useExecuteRollover = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: academicApi.executeRollover,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['semesters'] });
            toast.success('Semester rollover executed successfully');
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Failed to execute rollover');
        }
    });
};

export const useSemesterCourses = (semesterId: number | null) => {
    return useQuery<any[]>({
        queryKey: ['semesterCourses', semesterId],
        queryFn: () => academicApi.getSemesterCourses(semesterId as number),
        enabled: !!semesterId
    });
};
