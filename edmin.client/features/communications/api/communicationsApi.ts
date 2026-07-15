import { apiGet, apiPost, apiDelete } from '@/api/apiContract';

export interface BroadcastItem {
    id: string;
    title: string;
    audience: string;
    date: string;
    priority: string;
    status: string;
}

export const communicationsApi = {
    broadcastAnnouncement: (data: {
        title: string;
        content: string;
        targetRole: string;
        priority: string;
        isScheduled: boolean;
        scheduleDate?: string;
    }): Promise<any> =>
        apiPost<any>('/admin/communications/broadcast', data),

    getQueue: (): Promise<BroadcastItem[]> =>
        apiGet<BroadcastItem[]>('/admin/communications/queue'),

    cancelScheduled: (id: string): Promise<any> =>
        apiDelete<any>(`/admin/communications/queue/${id}`),

    getHistory: (): Promise<BroadcastItem[]> =>
        apiGet<BroadcastItem[]>('/admin/communications/history')
};
