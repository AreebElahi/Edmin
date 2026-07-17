'use client';

import React, { useEffect, useState } from 'react';
import { 
    Activity, Users, GraduationCap, BookOpen, AlertTriangle, 
    Calendar, Bell, FileCheck, CheckCircle2, TrendingUp, AlertCircle, CalendarDays, ClipboardList
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { SupervisorAPI } from '@/utils/api';
import Link from 'next/link';
import { UserRole } from '@/types/types';

export default function AnalyticsDashboardPage() {
    const [health, setHealth] = useState<any>(null);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [healthData, notifData] = await Promise.all([
                    SupervisorAPI.getAnalyticsHealth(),
                    SupervisorAPI.getNotifications()
                ]);
                setHealth(healthData);
                setNotifications(notifData);
                setLoading(false);
            } catch (err: any) {
                console.error('Error loading supervisor analytics:', {
                    message: err?.message,
                    name: err?.name,
                    stack: err?.stack,
                    status: err?.response?.status || err?.status,
                    data: err?.response?.data || err?.data,
                    url: err?.config?.url || err?.url,
                    method: err?.config?.method || err?.method
                });
                // Handle both AxiosError and contract error shapes
                const msg = err?.message || err?.response?.data?.message || err?.response?.data?.error || 'Failed to load dashboard analytics.';
                setError(msg);
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <DashboardLayout userName="Supervisor" userRole={UserRole.FACULTY} notifications={[]} currentPath="/dashboard/faculty/supervisor/analytics">
                <div className="flex h-full items-center justify-center">
                    <div className="flex flex-col items-center gap-4 animate-pulse">
                        <Activity className="h-10 w-10 text-primary animate-bounce" />
                        <div className="text-text-muted font-medium">Loading Operations Center...</div>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout userName="Supervisor" userRole={UserRole.FACULTY} notifications={[]} currentPath="/dashboard/faculty/supervisor/analytics">
                <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                    <AlertTriangle className="h-12 w-12 text-danger mb-4" />
                    <h2 className="text-xl font-semibold text-danger mb-2">Error Accessing Dashboard</h2>
                    <p className="text-text-secondary">{error}</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout userName="Supervisor" userRole={UserRole.FACULTY} notifications={[]} currentPath="/dashboard/faculty/supervisor/analytics">
            <div className="p-6 md:p-8 space-y-8 animate-fade-in max-w-7xl mx-auto bg-background min-h-screen">
                
                {/* Header Section */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-text-primary tracking-tight">Operations Center</h1>
                        <p className="text-text-secondary mt-1 flex items-center gap-2">
                            <BuildingIcon className="w-4 h-4" /> {health?.departmentName || 'Department'} Operational Overview
                        </p>
                    </div>
                </header>

                {/* Quick Stats Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard 
                        title="Faculty" value={health?.faculty?.total} icon={Users} color="text-blue-500" bg="bg-blue-500/10" 
                        alerts={health?.faculty?.pendingReviews > 0 ? `${health.faculty.pendingReviews} pending reviews` : undefined}
                    />
                    <StatCard 
                        title="Students" value={health?.students?.total} icon={GraduationCap} color="text-purple-500" bg="bg-purple-500/10"
                        alerts={health?.students?.enrollmentRequests > 0 ? `${health.students.enrollmentRequests} enrollment requests` : undefined}
                    />
                    <StatCard 
                        title="Courses" value={health?.courses?.running} icon={BookOpen} color="text-indigo-500" bg="bg-indigo-500/10"
                        alerts={health?.courses?.behindSchedule > 0 ? `${health.courses.behindSchedule} behind schedule` : undefined}
                    />
                    <StatCard 
                        title="Pending Actions" value={health?.operations?.pendingTeachingLoads + health?.operations?.pendingReports + health?.operations?.pendingLeaves} icon={AlertCircle} color="text-amber-500" bg="bg-amber-500/10"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left Column: Pipeline & Calendar */}
                    <div className="lg:col-span-2 space-y-8">
                        
                        {/* Approval Pipeline */}
                        <section className="bg-surface rounded-2xl p-6 border border-border shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold flex items-center gap-2 text-text-primary">
                                    <ClipboardList className="w-5 h-5 text-primary" /> Approval Pipeline
                                </h2>
                                <Link href="/dashboard/faculty/supervisor/operations/teaching-loads" className="text-sm text-primary hover:underline font-medium">
                                    View All
                                </Link>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <PipelineCard title="Teaching Loads" count={health?.operations?.pendingTeachingLoads} href="/dashboard/faculty/supervisor/operations/teaching-loads" color="text-blue-500" />
                                <PipelineCard title="Activity Reports" count={health?.operations?.pendingReports} href="/dashboard/faculty/supervisor/operations/activity-reports" color="text-orange-500" />
                                <PipelineCard title="Leave Requests" count={health?.operations?.pendingLeaves} href="/dashboard/faculty/supervisor/faculty/leaves" color="text-red-500" />
                            </div>
                        </section>

                        {/* Student Risk List & Faculty Performance Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <section className="bg-surface rounded-2xl p-6 border border-border shadow-sm">
                                <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-text-primary">
                                    <AlertTriangle className="w-5 h-5 text-amber-500" /> Student Risks
                                </h2>
                                <div className="space-y-3">
                                    {health?.students?.attendanceAlerts > 0 ? (
                                        <div className="p-3 bg-danger/5 rounded-lg border border-danger/10 flex items-center justify-between">
                                            <span className="text-sm font-medium text-text-secondary">Low Attendance Alerts</span>
                                            <span className="px-2 py-1 bg-danger/10 text-danger rounded text-xs font-bold">{health.students.attendanceAlerts}</span>
                                        </div>
                                    ) : (
                                        <div className="p-4 text-center text-sm text-text-muted bg-background rounded-lg">No critical student risks identified.</div>
                                    )}
                                </div>
                            </section>

                            <section className="bg-surface rounded-2xl p-6 border border-border shadow-sm">
                                <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-text-primary">
                                    <TrendingUp className="w-5 h-5 text-green-500" /> Faculty Health
                                </h2>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center p-3 hover:bg-background rounded-lg transition-colors border border-transparent hover:border-border">
                                        <span className="text-sm text-text-secondary">Present Today</span>
                                        <span className="text-sm font-semibold">{health?.faculty?.total - health?.faculty?.leaveToday} / {health?.faculty?.total}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 hover:bg-background rounded-lg transition-colors border border-transparent hover:border-border">
                                        <span className="text-sm text-text-secondary">On Leave</span>
                                        <span className="text-sm font-semibold text-amber-500">{health?.faculty?.leaveToday}</span>
                                    </div>
                                </div>
                            </section>
                        </div>

                    </div>

                    {/* Right Column: Notifications & Calendar */}
                    <div className="space-y-8">
                        <section className="bg-surface rounded-2xl p-6 border border-border shadow-sm h-[400px] flex flex-col">
                            <h2 className="text-lg font-bold flex items-center gap-2 mb-6 text-text-primary">
                                <Bell className="w-5 h-5 text-primary" /> Urgent Notifications
                            </h2>
                            <div className="overflow-y-auto pr-2 space-y-4 flex-1 custom-scrollbar">
                                {notifications.length > 0 ? notifications.map((n, i) => (
                                    <div key={i} className="flex gap-3 p-3 rounded-lg hover:bg-background border border-transparent hover:border-border transition-colors">
                                        <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                                        <div>
                                            <p className="text-sm font-semibold text-text-primary">{n.title}</p>
                                            <p className="text-xs text-text-secondary mt-1">{n.message}</p>
                                            <p className="text-[10px] text-text-muted mt-2">{new Date(n.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="flex flex-col items-center justify-center h-full text-center text-text-muted">
                                        <CheckCircle2 className="w-8 h-8 mb-2 opacity-20" />
                                        <p className="text-sm">Inbox is empty</p>
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="bg-surface rounded-2xl p-6 border border-border shadow-sm">
                            <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-text-primary">
                                <CalendarDays className="w-5 h-5 text-primary" /> Upcoming Event
                            </h2>
                            <div className="p-4 bg-background rounded-xl border border-border text-center">
                                <p className="text-sm text-text-muted">No upcoming departmental events.</p>
                            </div>
                        </section>
                    </div>

                </div>
            </div>
        </DashboardLayout>
    );
}

function BuildingIcon(props: any) {
    return <Building {...props} />;
}
import { Building } from 'lucide-react';

function StatCard({ title, value, icon: Icon, color, bg, alerts }: any) {
    return (
        <div className="bg-surface rounded-2xl p-5 border border-border shadow-sm flex flex-col justify-between group hover:border-primary/30 transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-text-secondary tracking-wide">{title}</h3>
                <div className={`p-2 ${bg} rounded-xl group-hover:scale-110 transition-transform`}>
                    <Icon className={`h-5 w-5 ${color}`} />
                </div>
            </div>
            <div>
                <p className="text-3xl font-black text-text-primary">{value || 0}</p>
                {alerts && (
                    <p className={`text-xs mt-2 font-medium ${alerts.includes('0') ? 'text-text-muted' : 'text-amber-500'}`}>
                        {alerts}
                    </p>
                )}
            </div>
        </div>
    );
}

function PipelineCard({ title, count, href, color }: any) {
    return (
        <Link href={href} className="block group">
            <div className="p-5 rounded-xl border border-border bg-background hover:bg-surface hover:border-primary/40 transition-all flex flex-col items-center text-center">
                <p className={`text-4xl font-black mb-2 ${count > 0 ? color : 'text-text-muted'}`}>{count || 0}</p>
                <p className="text-sm font-medium text-text-secondary group-hover:text-text-primary transition-colors">{title}</p>
            </div>
        </Link>
    );
}
