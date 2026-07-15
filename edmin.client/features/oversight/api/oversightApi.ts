import { apiGet, apiDelete } from '@/api/apiContract';

export interface AttachmentItem {
    id: string;
    name: string;
    course: string;
    uploader: string;
    type: string;
    status: 'Clean' | 'Flagged';
}

export interface PlagiarismAlertItem {
    id: string;
    student: string;
    course: string;
    assignment: string;
    similarity: number;
    source: string;
}

export interface SubmissionMapItem {
    id: string;
    title: string;
    course: string;
    dueDate: string;
    submissionsCount: number;
    status: 'Upcoming' | 'Past Due';
}

export const oversightApi = {
    getAttachments: (): Promise<AttachmentItem[]> =>
        apiGet<AttachmentItem[]>('/admin/oversight/attachments'),

    deleteAttachment: (id: string): Promise<any> =>
        apiDelete<any>(`/admin/oversight/attachments/${id}`),

    getPlagiarismAlerts: (): Promise<PlagiarismAlertItem[]> =>
        apiGet<PlagiarismAlertItem[]>('/admin/oversight/plagiarism'),

    getSubmissionsMap: (): Promise<SubmissionMapItem[]> =>
        apiGet<SubmissionMapItem[]>('/admin/oversight/submissions')
};
