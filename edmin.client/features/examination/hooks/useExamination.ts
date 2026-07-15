import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { examinationApi } from '@/api/examinationApi';
import { toast } from 'sonner';

export const useExamSchedules = () => {
    return useQuery({
        queryKey: ['examSchedules'],
        queryFn: examinationApi.getSchedules
    });
};

export const useCreateExamSchedule = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: examinationApi.createSchedule,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['examSchedules'] });
            toast.success('Exam session scheduled successfully');
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Failed to schedule exam session');
        }
    });
};

export const useDeleteExamSchedule = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => examinationApi.deleteSchedule(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['examSchedules'] });
            toast.success('Exam schedule cancelled successfully');
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Failed to cancel exam schedule');
        }
    });
};

export const useVerificationRoster = () => {
    return useQuery({
        queryKey: ['verificationRoster'],
        queryFn: examinationApi.getVerificationRoster
    });
};

export const useAssessmentMarks = (assessmentId: number) => {
    return useQuery({
        queryKey: ['assessmentMarks', assessmentId],
        queryFn: () => examinationApi.getAssessmentMarks(assessmentId),
        enabled: !isNaN(assessmentId) && assessmentId > 0
    });
};

export const useLockAssessmentMarks = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => examinationApi.lockAssessmentMarks(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['verificationRoster'] });
            queryClient.invalidateQueries({ queryKey: ['assessmentMarks'] });
            toast.success('Assessment marks verified and locked successfully');
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Failed to verify and lock assessment marks');
        }
    });
};

export const usePublishCourseGrades = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => examinationApi.publishCourseGrades(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['verificationRoster'] });
            queryClient.invalidateQueries({ queryKey: ['publishedResults'] });
            queryClient.invalidateQueries({ queryKey: ['promotionRecommendations'] });
            queryClient.invalidateQueries({ queryKey: ['degreeAudits'] });
            queryClient.invalidateQueries({ queryKey: ['examinationStats'] });
            toast.success('Course grades calculated and published successfully');
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Failed to publish course grades');
        }
    });
};

export const usePublishedResults = () => {
    return useQuery({
        queryKey: ['publishedResults'],
        queryFn: examinationApi.getPublishedResults
    });
};

export const useStudentTranscript = (studentId: number) => {
    return useQuery({
        queryKey: ['studentTranscript', studentId],
        queryFn: () => examinationApi.getStudentTranscript(studentId),
        enabled: !isNaN(studentId) && studentId > 0
    });
};

export const useDegreeAudits = () => {
    return useQuery({
        queryKey: ['degreeAudits'],
        queryFn: examinationApi.getDegreeAudits
    });
};

export const useReevaluateDegreeAudits = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: examinationApi.reevaluateDegreeAudits,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['degreeAudits'] });
            toast.success('Degree compliance audits reevaluated successfully for all students');
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Failed to reevaluate degree compliance audits');
        }
    });
};

export const usePromotionRecommendations = () => {
    return useQuery({
        queryKey: ['promotionRecommendations'],
        queryFn: examinationApi.getPromotionRecommendations
    });
};

export const useExecutePromotion = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ studentId, payload }: { studentId: number; payload: { status: string; standing: string; comment?: string } }) =>
            examinationApi.executePromotion(studentId, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['promotionRecommendations'] });
            queryClient.invalidateQueries({ queryKey: ['degreeAudits'] });
            toast.success('Student standing and promotion committed successfully');
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Failed to update student standing');
        }
    });
};

export const useExaminationStats = () => {
    return useQuery({
        queryKey: ['examinationStats'],
        queryFn: examinationApi.getStats
    });
};
