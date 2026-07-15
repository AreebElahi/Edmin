import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi, SystemConfig, SessionItem, BackupItem } from '../api/settingsApi';
import { toast } from 'sonner';

export const useSystemConfig = () => {
    return useQuery<SystemConfig>({
        queryKey: ['settings', 'config'],
        queryFn: settingsApi.getConfig
    });
};

export const useUpdateSystemConfig = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: settingsApi.updateConfig,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['settings', 'config'] });
            toast.success('System configuration updated successfully');
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Failed to update system config');
        }
    });
};

export const useActiveSessions = () => {
    return useQuery<SessionItem[]>({
        queryKey: ['settings', 'sessions'],
        queryFn: settingsApi.getSessions
    });
};

export const useTerminateSession = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: settingsApi.terminateSession,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['settings', 'sessions'] });
            toast.success('User session terminated successfully');
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Failed to terminate session');
        }
    });
};

export const useBackupSnapshots = () => {
    return useQuery<BackupItem[]>({
        queryKey: ['settings', 'backups'],
        queryFn: settingsApi.getBackups
    });
};

export const useCreateBackup = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: settingsApi.createBackup,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['settings', 'backups'] });
            toast.success('Manual backup snapshot created successfully');
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Failed to create backup');
        }
    });
};

export const useRestoreBackup = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: settingsApi.restoreBackup,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['settings', 'backups'] });
            toast.success(data?.message || 'Snapshot restoration queued');
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Failed to restore snapshot');
        }
    });
};
