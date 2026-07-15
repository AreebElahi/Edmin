import { apiGet, apiPatch } from '@/api/apiContract';

export interface Notification {
  notificationid: number;
  userid: number;
  title: string;
  message: string;
  type: string;
  isread: boolean;
  action_url?: string;
  metadata?: any;
  createdat: string;
  updatedat: string;
}

export function getNotifications(limit: number = 20): Promise<Notification[]> {
  return apiGet<Notification[]>(`/notifications?limit=${limit}`);
}

export function markRead(id: number): Promise<{ message: string }> {
  return apiPatch<{ message: string }>(`/notifications/${id}/read`, {});
}

export function markAllRead(): Promise<{ message: string }> {
  return apiPatch<{ message: string }>('/notifications/read-all', {});
}
