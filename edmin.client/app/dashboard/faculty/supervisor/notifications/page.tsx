'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { SupervisorAPI } from '@/utils/api';
import { UserRole } from '@/types/types';
import { Bell, CheckCircle2, Circle, Clock, Info, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SupervisorNotificationsPage() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const data = await SupervisorAPI.getNotifications();
            setNotifications(data);
        } catch (error: any) {
            toast.error(error.message || 'Failed to load notifications');
        } finally {
            setLoading(false);
        }
    };

    const getIcon = (priority: string) => {
        switch(priority) {
            case 'CRITICAL': return <AlertTriangle className="w-5 h-5 text-red-500" />;
            case 'HIGH': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
            case 'MEDIUM': return <Info className="w-5 h-5 text-blue-500" />;
            default: return <Bell className="w-5 h-5 text-slate-500" />;
        }
    };

    return (
        <DashboardLayout userName="Supervisor" userRole={UserRole.FACULTY} notifications={[]} currentPath="/dashboard/faculty/supervisor/notifications">
            <div className="p-6 md:p-8 space-y-8 animate-fade-in max-w-4xl mx-auto">
                <header className="flex justify-between items-end border-b border-border pb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-text-primary tracking-tight flex items-center gap-2">
                            <Bell className="w-6 h-6 text-primary" /> Notifications Center
                        </h1>
                        <p className="text-text-secondary mt-1 text-sm md:text-base">
                            Your operational inbox and system alerts.
                        </p>
                    </div>
                    <button className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Mark all as read
                    </button>
                </header>

                {loading ? (
                    <div className="flex h-32 items-center justify-center">
                        <div className="text-text-muted">Loading inbox...</div>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="bg-surface rounded-xl border border-border p-12 text-center">
                        <CheckCircle2 className="h-16 w-16 text-green-500/50 mx-auto mb-4" strokeWidth={1} />
                        <h3 className="text-lg font-medium text-text-primary mb-1">You're all caught up!</h3>
                        <p className="text-text-secondary text-sm">There are no new notifications in your operational inbox.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {notifications.map((n, idx) => (
                            <div key={idx} className={`bg-surface rounded-xl p-5 border shadow-sm flex gap-4 hover:border-primary/30 transition-all ${n.priority === 'CRITICAL' ? 'border-red-200' : 'border-border'}`}>
                                <div className="mt-1 flex-shrink-0">
                                    {getIcon(n.priority)}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="font-bold text-text-primary text-base">{n.title}</h3>
                                        <span className="flex items-center gap-1 text-xs text-text-muted whitespace-nowrap">
                                            <Clock className="w-3 h-3" /> {new Date(n.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-text-secondary text-sm leading-relaxed">{n.message}</p>
                                    
                                    <div className="mt-4 flex gap-2">
                                        <button className="px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-semibold rounded-lg transition-colors">
                                            View Details
                                        </button>
                                    </div>
                                </div>
                                <div className="flex items-center justify-center pl-4 border-l border-border">
                                    <button className="text-text-muted hover:text-primary transition-colors p-2 rounded-full hover:bg-background" title="Mark as read">
                                        <Circle className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
