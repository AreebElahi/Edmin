import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentOversightApi } from '@/api/studentOversightApi';
import { toast } from 'sonner';

export const useStudentDirectory = () => {
    return useQuery({
        queryKey: ['studentDirectory'],
        queryFn: studentOversightApi.getDirectory
    });
};

export const useEnrollmentRequests = () => {
    return useQuery({
        queryKey: ['enrollmentRequests'],
        queryFn: studentOversightApi.getEnrollments
    });
};

export const useOverrideEnrollment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: { action: 'APPROVE' | 'REJECT'; comment?: string } }) =>
            studentOversightApi.overrideEnrollment(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['enrollmentRequests'] });
            queryClient.invalidateQueries({ queryKey: ['studentDirectory'] });
            queryClient.invalidateQueries({ queryKey: ['studentTimeline'] });
            toast.success('Enrollment request status overridden successfully');
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Failed to override enrollment request');
        }
    });
};

export const useAcademicProgress = () => {
    return useQuery({
        queryKey: ['academicProgress'],
        queryFn: studentOversightApi.getProgress
    });
};

export const usePromotionGraduation = () => {
    return useQuery({
        queryKey: ['promotionGraduation'],
        queryFn: studentOversightApi.getPromotion
    });
};

export const useAttendanceAnalytics = () => {
    return useQuery({
        queryKey: ['attendanceAnalytics'],
        queryFn: studentOversightApi.getAttendanceAnalytics
    });
};

export const useAtRiskStudents = () => {
    return useQuery({
        queryKey: ['atRiskStudents'],
        queryFn: studentOversightApi.getAtRisk
    });
};

export const useScholarships = () => {
    return useQuery({
        queryKey: ['scholarships'],
        queryFn: studentOversightApi.getScholarships
    });
};

export const useStudentTimeline = (studentId: number) => {
    return useQuery({
        queryKey: ['studentTimeline', studentId],
        queryFn: () => studentOversightApi.getTimeline(studentId),
        enabled: !isNaN(studentId) && studentId > 0
    });
};
