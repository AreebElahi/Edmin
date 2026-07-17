'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../../../components/DashboardLayout';
import { useAuth } from '../../../../providers/AuthProvider';
import { apiClient } from '../../../../api/apiClient';
import { UserRole } from '../../../../types/types';
import {
  Megaphone,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Info,
  Bell,
  RefreshCw,
  Calendar,
  Users,
} from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  audience: string;
  date: string;
  priority: string;
  status: string;
}

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnnouncements = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiClient.get('/communications/announcements');
      setAnnouncements(res.data || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load announcements');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  if (!user) return null;

  let role = UserRole.STUDENT;
  if (user.role === 'FACULTY') role = UserRole.FACULTY;
  else if (user.role === 'ADMIN') role = UserRole.ADMIN;
  else if (user.role === 'HR') role = UserRole.HR;

  const priorityConfig: Record<string, { icon: React.ReactNode; bg: string; text: string; border: string }> = {
    Urgent: {
      icon: <AlertCircle className="w-4 h-4" />,
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-200',
    },
    High: {
      icon: <AlertCircle className="w-4 h-4" />,
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      border: 'border-orange-200',
    },
    Normal: {
      icon: <Info className="w-4 h-4" />,
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
    },
    Low: {
      icon: <Info className="w-4 h-4" />,
      bg: 'bg-surface',
      text: 'text-text-secondary',
      border: 'border-border',
    },
  };

  return (
    <DashboardLayout
      userRole={role}
      userName=""
      notifications={[]}
      currentPath="/dashboard/shared/announcements"
    >
      <div className="p-6 max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
              <Megaphone className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Announcements</h1>
              <p className="text-sm text-text-secondary mt-0.5">
                Official broadcasts from university administration
              </p>
            </div>
          </div>
          <button
            onClick={fetchAnnouncements}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-hover border border-border rounded-[2px] transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-text-secondary">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
            <p className="text-sm font-medium">Loading announcements...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 text-text-secondary">
            <AlertCircle className="w-10 h-10 text-red-400 mb-4" />
            <p className="text-sm font-semibold text-red-600">{error}</p>
            <button
              onClick={fetchAnnouncements}
              className="mt-4 px-4 py-2 bg-primary text-white text-sm rounded-[2px] hover:bg-primary/90"
            >
              Try Again
            </button>
          </div>
        ) : announcements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-text-secondary bg-surface border border-border rounded-[2px]">
            <div className="w-16 h-16 bg-surface-hover border border-border rounded-full flex items-center justify-center mb-5">
              <Bell className="w-8 h-8 text-text-muted" />
            </div>
            <p className="text-base font-bold text-text-primary">No announcements yet</p>
            <p className="text-sm text-text-muted mt-1">
              Check back later for updates from the administration.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map((item) => {
              const config = priorityConfig[item.priority] || priorityConfig['Normal'];
              return (
                <div
                  key={item.id}
                  className={`rounded-[2px] border ${config.border} ${config.bg} p-5 transition-all hover:shadow-sm`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Priority icon */}
                      <div className={`mt-0.5 flex-shrink-0 ${config.text}`}>
                        {config.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Title */}
                        <h3 className="text-sm font-bold text-text-primary leading-snug">
                          {item.title}
                        </h3>

                        {/* Meta row */}
                        <div className="flex flex-wrap items-center gap-3 mt-2">
                          <span className="flex items-center gap-1 text-[11px] text-text-muted font-medium">
                            <Calendar className="w-3 h-3" />
                            {item.date}
                          </span>
                          <span className="flex items-center gap-1 text-[11px] text-text-muted font-medium">
                            <Users className="w-3 h-3" />
                            {item.audience}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Priority badge */}
                    <div className="flex-shrink-0 flex flex-col items-end gap-2">
                      {item.priority !== 'Normal' && item.priority !== 'Low' && (
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${config.bg} ${config.text} border ${config.border}`}
                        >
                          {item.priority}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        Delivered
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer count */}
        {!isLoading && !error && announcements.length > 0 && (
          <p className="mt-6 text-center text-xs text-text-muted">
            {announcements.length} announcement{announcements.length !== 1 ? 's' : ''} total
          </p>
        )}
      </div>
    </DashboardLayout>
  );
}
