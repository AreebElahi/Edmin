import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { oversightApi, AttachmentItem, PlagiarismAlertItem, SubmissionMapItem } from '../api/oversightApi';
import { toast } from 'sonner';

export const useOversightAttachments = () => {
    return useQuery<AttachmentItem[]>({
        queryKey: ['oversight', 'attachments'],
        queryFn: oversightApi.getAttachments
    });
};

export const usePlagiarismAlerts = () => {
    return useQuery<PlagiarismAlertItem[]>({
        queryKey: ['oversight', 'plagiarism'],
        queryFn: oversightApi.getPlagiarismAlerts
    });
};

export const useOversightSubmissions = () => {
    return useQuery<SubmissionMapItem[]>({
        queryKey: ['oversight', 'submissions'],
        queryFn: oversightApi.getSubmissionsMap
    });
};

export const useDeleteAttachment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: oversightApi.deleteAttachment,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['oversight', 'attachments'] });
            toast.success('Document moderated successfully');
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Failed to moderate document');
        }
    });
};
