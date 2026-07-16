import { apiGet, apiPost, apiPut, apiDelete } from '@/api/apiContract';

export interface SystemConfig {
    maintenanceMode: boolean;
    aiEnabled: boolean;
    institutionName: string;
    supportContactEmail: string;
    maxUploadSizeLimit: string;
    globalAttendanceThreshold: number;
    maxQuizQuestions: number;
    minimumTeachingCredits?: number;
    maximumTeachingCredits?: number;
}


export interface GlobalAuditLogItem {
    id: string;
    event: string;
    user: string;
    time: string;
    severity: string;
}

export interface SessionItem {
    id: number;
    ip: string;
    user: string;
    type: string;
    device: string;
    time: string;
}

export interface BackupItem {
    id: string;
    date: string;
    type: string;
    size: string;
    status: string;
}

export const settingsApi = {
    getConfig: (): Promise<SystemConfig> =>
        apiGet<SystemConfig>('/admin/settings/config'),

    updateConfig: (data: Partial<SystemConfig>): Promise<SystemConfig> =>
        apiPut<SystemConfig>('/admin/settings/config', data),

    getAuditLogs: (): Promise<GlobalAuditLogItem[]> =>
        apiGet<GlobalAuditLogItem[]>('/admin/settings/audit'),

    getSessions: (): Promise<SessionItem[]> =>
        apiGet<SessionItem[]>('/admin/settings/sessions'),

    terminateSession: (id: number): Promise<any> =>
        apiDelete<any>(`/admin/settings/sessions/${id}`),

    getBackups: (): Promise<BackupItem[]> =>
        apiGet<BackupItem[]>('/admin/settings/backups'),

    createBackup: (): Promise<BackupItem> =>
        apiPost<BackupItem>('/admin/settings/backups', {}),

    restoreBackup: (backupId: string): Promise<any> =>
        apiPost<any>('/admin/settings/backups/restore', { backupId })
};
