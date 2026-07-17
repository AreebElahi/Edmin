'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { UserRole, Notification } from '@/types/types';
import {
    Users, Building, BookOpen, AlertCircle, CalendarDays,
    ShieldAlert, CheckCircle2, XCircle, Edit3, Briefcase, 
    ChevronRight, GraduationCap, Activity, Bell, ShieldCheck, 
    Clock, Database, PlusCircle, Send, MessageSquare, 
    TrendingUp, TrendingDown, MoreHorizontal, UserCheck,
    Calendar, AlertTriangle, Loader2, FileText
} from 'lucide-react';
import Link from 'next/link';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminStatusBadge from '@/components/admin/AdminStatusBadge';
import PersonalLeaveWidget from '@/components/PersonalLeaveWidget';
import { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import { DashboardAPI } from '@/utils/api';
import { BackendNotification } from '@/types/types';
import { apiGet, apiPatch } from '@/api/apiContract';
import { toast } from 'react-hot-toast';

import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import AdminPageWrapper from "@/components/admin/AdminPageWrapper";

export default function AdminDashboard() {
    const { data: currentUser } = useCurrentUser();

    const [modifyingItem, setModifyingItem] = useState<any>(null);
    const [isAdminActionModalOpen, setIsAdminActionModalOpen] = useState(false);
    const [kpiIndex, setKpiIndex] = useState(0);
    const [pendingIndex, setPendingIndex] = useState(0);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [metrics, setMetrics] = useState<any>({ totalStudents: 0, totalFaculty: 0, totalCourses: 0, openTickets: 0, dbLatencyMs: 0 });
    const [notifications, setNotifications] = useState<BackendNotification[]>([]);
    const [systemActivity, setSystemActivity] = useState<any[]>([]);
    const [escalations, setEscalations] = useState<any[]>([]);

    const [overrideComment, setOverrideComment] = useState('');
    const [overrideAction, setOverrideAction] = useState<'APPROVE' | 'REJECT'>('APPROVE');
    const [overridePending, setOverridePending] = useState(false);

    const fetchData = async () => {
        try {
            const [response, escalationsList] = await Promise.all([
                DashboardAPI.getAdminDashboard(),
                apiGet<any[]>('/admin/escalations')
            ]);
            if (response) {
                setMetrics(response.metrics || { totalStudents: 0, totalFaculty: 0, totalCourses: 0, openTickets: 0, dbLatencyMs: 0 });
                setNotifications(response.notifications || []);
                setSystemActivity(response.systemActivity || []);
            }
            if (escalationsList) {
                setEscalations(escalationsList.filter((e: any) => e.status === 'OPEN'));
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOverride = async () => {
        if (!modifyingItem) return;
        setOverridePending(true);
        try {
            await apiPatch(`/admin/escalations/${modifyingItem.escalationid}/override`, {
                action: overrideAction,
                comment: overrideComment
            });
            toast.success('Escalation resolved via absolute override.');
            setModifyingItem(null);
            setOverrideComment('');
            setOverrideAction('APPROVE');
            fetchData();
        } catch (err: any) {
            toast.error(err.message || 'Failed to apply override');
        } finally {
            setOverridePending(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout userName="Loading..." userRole={'admin' as any} notifications={[]}>
                <div className="flex justify-center items-center h-[60vh]">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout userName="Error" userRole={'admin' as any} notifications={[]}>
                <div className="bg-error-bg text-error-text p-3 border border-border flex items-center gap-2 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                </div>
            </DashboardLayout>
        );
    }

    const mappedNotifications = notifications.map(n => ({
        id: n.notificationid.toString(),
        title: n.title,
        message: n.message,
        timestamp: new Date(n.createdat),
        read: n.isread,
        type: 'info' as const
    }));

    const stats = [
        { 
            title: 'Active Students', 
            value: metrics.totalStudents.toString(), 
            trend: '+12%', 
            isPositive: true, 
            icon: Users,
            color: 'from-blue-500 to-indigo-600',
            bgIcon: 'text-blue-100'
        },
        { 
            title: 'Total Faculty', 
            value: metrics.totalFaculty.toString(), 
            trend: '+3%', 
            isPositive: true, 
            icon: Briefcase,
            color: 'from-emerald-500 to-teal-600',
            bgIcon: 'text-emerald-100'
        },
        { 
            title: 'Active Courses', 
            value: metrics.totalCourses.toString(), 
            trend: 'Stable', 
            isPositive: true, 
            icon: BookOpen,
            color: 'from-amber-500 to-orange-600',
            bgIcon: 'text-amber-100'
        },
        { 
            title: 'Open Tickets', 
            value: metrics.openTickets.toString(), 
            trend: metrics.openTickets > 0 ? 'Needs Review' : 'All Clear', 
            isPositive: metrics.openTickets === 0, 
            icon: TrendingUp,
            color: metrics.openTickets > 0 ? 'from-rose-500 to-pink-600' : 'from-emerald-500 to-teal-600',
            bgIcon: 'text-rose-100'
        },
    ];

    const getEscalationDetails = (item: any) => {
        if (!item.relatedDetails) return `Escalated ${item.relatedtype} request #${item.relatedid}`;
        const details = item.relatedDetails;
        if (item.relatedtype === 'LEAVE') {
            return `Leave request from ${new Date(details.startdate).toLocaleDateString()} to ${new Date(details.enddate).toLocaleDateString()}.`;
        }
        if (item.relatedtype === 'ENROLLMENT') {
            return `Enrollment request for course offering: ${details.courseoffering?.course?.name || 'N/A'}`;
        }
        if (item.relatedtype === 'TEACHING_LOAD') {
            return `Teaching load approval for semester: ${details.semester?.name || 'N/A'}`;
        }
        if (item.relatedtype === 'REPORT') {
            return `Daily activity report on ${new Date(details.reportdate).toLocaleDateString()}. Summary: ${details.summary || 'N/A'}`;
        }
        return `Escalated ${item.relatedtype} request #${item.relatedid}`;
    };

    const getEscalationTypeLabel = (relatedtype: string) => {
        const labels: Record<string, string> = {
            LEAVE: 'Faculty Leave Request',
            ENROLLMENT: 'Student Enrollment Request',
            TEACHING_LOAD: 'Teaching Load Request',
            REPORT: 'Daily Activity Report'
        };
        return labels[relatedtype] || relatedtype;
    };

    return (
        <DashboardLayout 
            userName={currentUser?.fullName || 'Admin'}
            userRole={'admin' as any}
            userAvatar="https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff"
            notifications={mappedNotifications}
        >
            <AdminPageWrapper>

                {/* Page Header */}
                <AdminPageHeader
                    icon={ShieldCheck}
                    title="System Overview"
                    subtitle="Monitor critical KPIs, resolve escalated bottlenecks, and manage the university infrastructure."
                    eyebrow={{ icon: ShieldCheck, label: 'System Administrator' }}
                    actions={
                        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                            <Link href="/dashboard/admin/reports" className="flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-[2px] text-sm font-semibold transition-colors w-full sm:w-auto justify-center">
                                <FileText className="w-4 h-4" /> Generate Report
                            </Link>
                            <button onClick={() => setIsAdminActionModalOpen(true)} className="flex items-center gap-1.5 px-4 py-2 bg-white text-primary hover:bg-slate-100 rounded-[2px] text-sm font-semibold transition-colors w-full sm:w-auto justify-center">
                                <PlusCircle className="w-4 h-4" /> New Admin Action
                            </button>
                        </div>
                    }
                />

                {/* Core KPIs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {stats.map((stat, i) => (
                        <div key={i} className="bg-surface border border-border p-5 flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                                <stat.icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
                                <AdminStatusBadge 
                                    status={stat.trend} 
                                    variant={stat.isPositive ? 'success' : 'error'} 
                                />
                            </div>
                            <div>
                                <p className="text-xs text-text-secondary font-medium uppercase tracking-wider">{stat.title}</p>
                                <h3 className="text-2xl font-semibold text-text-primary mt-0.5">{stat.value}</h3>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
                    
                    {/* Left Column: Escalations */}
                    <div className="xl:col-span-2 h-full">
                        <div className="bg-surface border border-border overflow-hidden h-full flex flex-col">
                            <div className="px-5 py-3 border-b border-border flex justify-between items-center bg-surface-hover">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-error-text" strokeWidth={1.5} />
                                    <h2 className="text-sm font-semibold text-text-primary">Escalation Center</h2>
                                    <span className="text-xs text-text-secondary">Items requiring immediate Admin override</span>
                                </div>
                                <AdminStatusBadge status={`${escalations.length} Pending`} variant="error" />
                            </div>
                            
                            <div className="divide-y divide-[#EDEBE9] flex-1">
                                {escalations.length === 0 ? (
                                    <div className="text-center py-10">
                                        <CheckCircle2 className="w-10 h-10 text-success-text mx-auto mb-3 opacity-60" strokeWidth={1.5} />
                                        <h3 className="text-sm font-semibold text-success-text ">All Clear</h3>
                                        <p className="text-xs text-text-secondary mt-1">No pending escalations require admin override.</p>
                                    </div>
                                ) : (
                                    escalations.map((item) => (
                                        <div key={item.escalationid} className="px-5 py-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between hover:bg-surface-hover transition-colors">
                                            <div className="flex items-start gap-3 flex-1">
                                                <AlertCircle className="w-4 h-4 text-error-text shrink-0 mt-0.5" strokeWidth={1.5} />
                                                <div>
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <h4 className="text-sm font-semibold text-text-primary">{getEscalationTypeLabel(item.relatedtype)}</h4>
                                                        <span className="text-[10px] font-semibold uppercase tracking-wide text-text-secondary px-1.5 py-0.5 bg-background rounded-[2px]">By: {item.user?.fullname || item.user?.username || 'System'}</span>
                                                    </div>
                                                    <p className="text-xs text-text-secondary mb-1.5">{getEscalationDetails(item)}</p>
                                                    <div className="flex items-center gap-3 text-[10px] font-medium text-text-muted">
                                                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" strokeWidth={1.5} /> {new Date(item.createdat).toLocaleString()}</span>
                                                        <span className="text-error-text bg-error-bg px-1.5 py-0.5 rounded-[2px]">critical</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => setModifyingItem(item)}
                                                className="w-full sm:w-auto px-4 py-2 bg-surface border border-warning-text text-warning-text hover:bg-warning-bg text-xs font-semibold rounded-[2px] transition-colors shrink-0"
                                            >
                                                Force Modify
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Activity & Sub-systems */}
                    <div className="space-y-3">
                        {/* System Activity Feed */}
                        <div className="bg-surface border border-border overflow-hidden">
                            <div className="px-5 py-3 border-b border-border bg-surface-hover">
                                <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-primary" strokeWidth={1.5} />
                                    System Activity Log
                                </h2>
                            </div>
                            <div className="p-4">
                                <div className="space-y-3">
                                    {systemActivity.length === 0 ? (
                                        <div className="text-center py-6 text-text-muted text-xs">No recent activity recorded.</div>
                                    ) : systemActivity.map((activity: any) => (
                                        <div key={activity.id} className="flex items-start gap-3">
                                            <div className="w-6 h-6 bg-primary-light flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <Activity className="h-3 w-3 text-primary" strokeWidth={1.5} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="text-xs font-semibold text-text-primary">{activity.performedBy}</p>
                                                    <span className="text-[10px] text-text-muted">{new Date(activity.timestamp).toLocaleTimeString()}</span>
                                                </div>
                                                <p className="text-[11px] text-text-secondary mt-0.5">
                                                    <span className="font-semibold text-text-primary">{activity.action}</span> — {activity.table}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Infrastructure Status */}
                        <div className="bg-surface border border-border p-5 text-text-primary rounded-[2px]">
                            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                                <Database className="w-4 h-4 text-primary" strokeWidth={1.5} />
                                Infrastructure Status
                            </h3>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center py-2 border-b border-border">
                                    <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">DB Latency</span>
                                    <span className="text-sm font-semibold">{metrics.dbLatencyMs}ms</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-border">
                                    <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">Open Tickets</span>
                                    <span className="text-sm font-semibold">{metrics.openTickets}</span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">Active Courses</span>
                                    <span className="text-sm font-semibold">{metrics.totalCourses}</span>
                                </div>
                                <Link href="/dashboard/admin/settings" className="w-full mt-2 py-2 bg-background hover:bg-surface-hover text-text-secondary border border-border text-xs font-semibold uppercase tracking-wider transition-colors rounded-[2px] text-center block">
                                    Open System Console
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </AdminPageWrapper>

            {/* Modal for Admin Modification */}
            <Modal isOpen={!!modifyingItem} onClose={() => setModifyingItem(null)} title="Admin Absolute Override" type="default">
                {modifyingItem && (
                    <div className="space-y-4">
                        <div className="bg-surface-hover border border-border p-4 mb-2">
                            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest mb-2">Request Context</p>
                            <div className="space-y-1.5">
                                <div className="flex justify-between"><span className="text-xs font-semibold text-text-secondary">Type</span> <span className="text-xs text-text-primary">{modifyingItem.relatedtype || modifyingItem.type}</span></div>
                                <div className="flex justify-between"><span className="text-xs font-semibold text-text-secondary">Subject</span> <span className="text-xs text-text-primary">{modifyingItem.user?.fullname || modifyingItem.user?.username || modifyingItem.user}</span></div>
                                <div className="pt-2 border-t border-border">
                                    <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest mb-1">Issue Details</p>
                                    <p className="text-xs text-text-secondary">"{getEscalationDetails(modifyingItem)}"</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-semibold text-text-primary uppercase tracking-wide block mb-1">Action</label>
                                <select 
                                    value={overrideAction} 
                                    onChange={e => setOverrideAction(e.target.value as any)}
                                    className="w-full border border-border p-2.5 text-sm outline-none focus:border-primary bg-surface rounded-[2px]"
                                >
                                    <option value="APPROVE">APPROVE REQUEST</option>
                                    <option value="REJECT">REJECT REQUEST</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-text-primary uppercase tracking-wide flex items-center gap-2">
                                    <Edit3 className="w-3.5 h-3.5 text-primary" strokeWidth={1.5} />
                                    Admin Override Comments
                                </label>
                                <textarea
                                    rows={4}
                                    value={overrideComment}
                                    onChange={e => setOverrideComment(e.target.value)}
                                    className="w-full border border-border p-3 text-sm focus:border-primary outline-none resize-none transition-colors rounded-[2px]"
                                    placeholder="Enter specific override comments explaining this resolution..."
                                ></textarea>
                                <div className="flex items-start gap-2 p-3 bg-error-bg border border-border">
                                    <ShieldAlert className="w-3.5 h-3.5 text-error-text shrink-0 mt-0.5" strokeWidth={1.5} />
                                    <p className="text-[10px] font-semibold text-error-text leading-tight">
                                        CRITICAL: This decision is final and will bypass all automated business rules. Ensure all documentation is accurate.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-3 border-t border-border">
                            <button onClick={() => setModifyingItem(null)} className="flex-1 px-4 py-2.5 border border-border text-text-primary text-sm font-semibold hover:bg-background transition-colors rounded-[2px]">Abort</button>
                            <button onClick={handleOverride} disabled={overridePending} className="flex-[2] py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 rounded-[2px]">
                                {overridePending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" strokeWidth={1.5} />} ENFORCE OVERRIDE
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Modal for New Admin Action (Quick Launcher) */}
            <Modal isOpen={isAdminActionModalOpen} onClose={() => setIsAdminActionModalOpen(false)} title="Administrative Actions Console">
                <div className="space-y-3">
                    <p className="text-xs text-text-secondary">Select a system module or quick administrative action to launch:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {[
                            { title: 'Create User Account', desc: 'Register students, faculty, or staff.', href: '/dashboard/admin/users', icon: Users },
                            { title: 'Map Course to Dept', desc: 'Link active courses to departments.', href: '/dashboard/admin/departments', icon: BookOpen },
                            { title: 'Manage Course Sections', desc: 'Add sections and balance cohorts.', href: '/dashboard/admin/departments', icon: Building },
                            { title: 'Broadcast Announcement', desc: 'Send urgent overrides or normal alerts.', href: '/dashboard/admin/communications', icon: MessageSquare },
                            { title: 'Rollover Semester', desc: 'Transition active semesters.', href: '/dashboard/admin/academic', icon: Calendar },
                            { title: 'Inject Workflow Event', desc: 'Replay, retry or inject outbox events.', href: '/dashboard/admin/workflow', icon: Activity },
                        ].map((action, idx) => {
                            const Icon = action.icon;
                            return (
                                <Link 
                                    key={idx} 
                                    href={action.href}
                                    onClick={() => setIsAdminActionModalOpen(false)}
                                    className="flex items-start gap-3 p-3.5 border border-border hover:border-primary hover:bg-primary-light transition-colors group"
                                >
                                    <Icon className="w-4 h-4 text-primary shrink-0 mt-0.5" strokeWidth={1.5} />
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-text-primary text-xs group-hover:text-primary transition-colors flex items-center gap-1">
                                            {action.title} <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </h4>
                                        <p className="text-[10px] text-text-muted mt-0.5">{action.desc}</p>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </Modal>
        </DashboardLayout>
    );
}

