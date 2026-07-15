'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { UserRole } from '@/types/types';
import { Bell, Check, Trash2, Mail, Ticket, Award, ClipboardCheck, Info, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { useNotifications } from '@/features/notifications/hooks/useNotifications';
import { useCurrentProfile } from '@/features/profile/hooks/useProfile';

export default function CentralizedNotificationsPage() {
    const { data: profile, isLoading: isProfileLoading } = useCurrentProfile();
    const { notifications, isLoading, markAsRead, markAllAsRead } = useNotifications(50);
    const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'LEAVE' | 'ENROLLMENT' | 'TEACHING_LOAD' | 'TICKET'>('ALL');

    if (isProfileLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-[2px] animate-spin"></div>
            </div>
        );
    }

    const userRole = profile?.role as UserRole || UserRole.STUDENT;
    const displayName = profile?.fullName || profile?.username || 'User';

    // Client-side filtering logic
    const filteredNotifications = notifications.filter(n => {
        if (filter === 'UNREAD') return !n.isread;
        if (filter === 'LEAVE') return n.type === 'LEAVE';
        if (filter === 'ENROLLMENT') return n.type === 'ENROLLMENT';
        if (filter === 'TEACHING_LOAD') return n.type === 'TEACHING_LOAD';
        if (filter === 'TICKET') return n.type === 'TICKET' || n.type === 'ESCALATION';
        return true; // 'ALL'
    });

    const getIcon = (type: string) => {
        switch (type) {
            case 'LEAVE':
                return <ClipboardCheck className="w-5 h-5 text-error-text" />;
            case 'ENROLLMENT':
                return <Award className="w-5 h-5 text-primary" />;
            case 'TEACHING_LOAD':
                return <Award className="w-5 h-5 text-primary" />;
            case 'TICKET':
            case 'ESCALATION':
                return <Ticket className="w-5 h-5 text-orange-600" />;
            default:
                return <Bell className="w-5 h-5 text-text-primary" />;
        }
    };

    const getBgColor = (type: string) => {
        switch (type) {
            case 'LEAVE': return 'bg-error-bg border-border';
            case 'ENROLLMENT': return 'bg-background border-violet-100';
            case 'TEACHING_LOAD': return 'bg-primary-light border-border';
            case 'TICKET':
            case 'ESCALATION': return 'bg-orange-50 border-orange-100';
            default: return 'bg-background border-border';
        }
    };

    return (
        <DashboardLayout
            userRole={userRole}
            userName={displayName}
            notifications={[]}
            currentPath="/dashboard/notifications"
        >
            <div className="max-w-5xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="bg-surface rounded-[2px] p-6 shadow-none border border-border mb-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mt-2">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary leading-tight">Notification Center 🔔</h1>
                            <p className="text-text-secondary text-sm mt-1">Stay updated with system activities, task requests, approvals, and credentials alerts.</p>
                        </div>
                        <button
                            onClick={() => markAllAsRead()}
                            className="flex items-center gap-2 px-4 py-2 bg-primary-light hover:bg-primary-light text-primary rounded-[2px] font-bold transition-all text-xs uppercase tracking-wider self-start sm:self-auto"
                        >
                            <Check className="w-4 h-4" />
                            Mark all read
                        </button>
                    </div>
                </div>

                {/* Filters Row */}
                <div className="flex flex-wrap gap-2 mb-6 bg-background p-1.5 rounded-[2px] w-fit">
                    {(['ALL', 'UNREAD', 'LEAVE', 'ENROLLMENT', 'TEACHING_LOAD', 'TICKET'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setFilter(tab)}
                            className={`px-4 py-2 rounded-[2px] text-xs font-bold transition-all ${filter === tab
                                ? 'bg-surface text-text-primary shadow-none'
                                : 'text-text-secondary hover:text-text-primary'
                                }`}
                        >
                            {tab === 'TEACHING_LOAD' ? 'LOADS' : tab}
                        </button>
                    ))}
                </div>

                {/* Notification List */}
                {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-[2px] animate-spin"></div>
                    </div>
                ) : filteredNotifications.length === 0 ? (
                    <div className="bg-surface border border-border rounded-[2px] p-12 text-center shadow-none">
                        <Bell className="w-12 h-12 text-border-hover mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-text-primary">No alerts found</h3>
                        <p className="text-text-secondary text-sm mt-1">You have caught up with all notifications in this category.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredNotifications.map(notification => (
                            <div
                                key={notification.notificationid}
                                onClick={() => {
                                    if (!notification.isread) {
                                        markAsRead(notification.notificationid);
                                    }
                                }}
                                className={`flex items-start gap-4 p-5 rounded-[2px] border transition-all cursor-pointer relative overflow-hidden bg-surface shadow-none hover:shadow-none ${!notification.isread ? 'ring-2 ring-blue-600/10' : ''
                                    }`}
                            >
                                {/* Left strip color for unread */}
                                {!notification.isread && (
                                    <div className="absolute left-0 top-0 h-full w-1.5 bg-blue-600"></div>
                                )}

                                {/* Icon box */}
                                <div className={`p-3 rounded-[2px] border ${getBgColor(notification.type || 'SYSTEM')}`}>
                                    {getIcon(notification.type || 'SYSTEM')}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-4">
                                        <h3 className={`font-bold text-base text-text-primary truncate ${!notification.isread ? 'font-semibold' : ''}`}>
                                            {notification.title}
                                        </h3>
                                        <span className="text-[10px] text-text-muted font-medium shrink-0">
                                            {new Date(notification.createdat).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-text-primary text-sm mt-1 leading-relaxed">
                                        {notification.message}
                                    </p>
                                </div>

                                {/* Action mark read button */}
                                {!notification.isread && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            markAsRead(notification.notificationid);
                                        }}
                                        className="p-1 hover:bg-background rounded text-text-muted hover:text-text-primary"
                                        title="Mark read"
                                    >
                                        <CheckCircle className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
