'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { UserRole } from '@/types/types';
import { ClipboardList, PlusCircle, CheckCircle, AlertCircle, CalendarDays, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { apiGet, apiPost } from '@/api/apiContract';
import { DashboardAPI } from '@/utils/api';
import Link from 'next/link';

interface LeaveRequestItem {
    leaverequestid: number;
    leavetype: string;
    startdate: string;
    enddate: string;
    status: string;
    createdat: string;
    comments: { comment: string }[];
}

export default function ActivityReportPage() {
    const [submitted, setSubmitted] = useState(false);
    const [report, setReport] = useState('');
    const [leaves, setLeaves] = useState<LeaveRequestItem[]>([]);
    const [activities, setActivities] = useState<any[]>([]);
    
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [profile, setProfile] = useState<any>(null);
    const [notifications, setNotifications] = useState<any[]>([]);

    const loadData = async () => {
        try {
            const [dash, hrRes, pendingRes, activityRes] = await Promise.all([
                DashboardAPI.getFacultyDashboard(),
                apiGet<any>('/faculty/hr-summary'),
                apiGet<any>('/faculty/approvals'),
                apiGet<any>('/faculty/activity')
            ]);

            const resolved = hrRes?.data?.resolvedLeaves || [];
            const pending = pendingRes?.data?.leaveRequests || [];
            
            // Combine and sort by date descending
            const allLeaves = [...pending, ...resolved].sort((a, b) => 
                new Date(b.createdat || b.startdate).getTime() - new Date(a.createdat || a.startdate).getTime()
            );

            setLeaves(allLeaves);
            setActivities(activityRes?.data || []);
            setProfile(dash?.profile || null);
            setNotifications(dash?.notifications || []);
        } catch (err: any) {
            console.error('Failed to load activity/leaves details:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleReportSubmit = async () => {
        if (!report.trim()) return;
        try {
            setSubmitting(true);
            setError(null);
            
            const payload = {
                date: new Date().toISOString().split('T')[0],
                summary: report.length > 80 ? report.substring(0, 80) + '...' : report,
                activities: [
                    {
                        title: 'Daily Activities',
                        detail: report,
                        sequence: 1
                    }
                ]
            };
            
            await apiPost('/faculty/activity', payload);
            setSubmitted(true);
        } catch (err: any) {
            setError(err.message || 'Failed to submit activity report');
        } finally {
            setSubmitting(false);
        }
    };

    const userName = profile?.fullname || profile?.user?.username || 'Faculty';
    const mappedNotifications = notifications.map(n => ({
        id: n.notificationid.toString(),
        title: n.title,
        message: n.message,
        timestamp: new Date(n.createdat),
        read: n.isread,
        type: 'info' as const
    }));

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'APPROVED': return 'bg-green-100 text-green-700';
            case 'REJECTED': return 'bg-error-bg text-error-text';
            case 'PENDING':
            case 'SUBMITTED':
            case 'PENDING_SUPERVISOR':
            case 'PENDING_HOD':
                return 'bg-warning-bg text-warning-text';
            default: return 'bg-background text-text-primary';
        }
    };

    if (loading) {
        return (
            <DashboardLayout userName="Loading..." userRole={UserRole.FACULTY} notifications={[]}>
                <div className="flex justify-center items-center h-[60vh]">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            userRole={UserRole.FACULTY}
            userName={userName}
            notifications={mappedNotifications}
            currentPath="/dashboard/faculty/activity-report"
        >
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="bg-surface rounded-[2px] p-6 shadow-none border border-border mb-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                    <h1 className="text-2xl font-bold text-text-primary mb-2 mt-2">Daily Activity & Leaves</h1>
                    <p className="text-text-secondary">Submit an end-of-day report and manage your leave requests. Reviews are handled by Supervisor and HOD.</p>
                </div>

                {error && (
                    <div className="bg-error-bg text-error-text p-4 rounded-[2px] flex items-center gap-3 mb-6">
                        <AlertCircle className="w-5 h-5" />
                        <span>{error}</span>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Activity Report Section */}
                    <div>
                        <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
                            <ClipboardList className="w-6 h-6 text-blue-500" />
                            Activity Report
                        </h2>
                        {!submitted ? (
                            <div className="bg-surface rounded-[2px] shadow-none border border-border p-6">
                                <label className="block text-sm font-medium text-text-primary mb-2">Today's Activities</label>
                                <textarea
                                    className="w-full border border-gray-300 rounded-[2px] p-4 min-h-[150px] focus:ring-2 focus:ring-blue-500 outline-none transition-shadow-none"
                                    placeholder="Describe your activities, classes taught, assignments graded..."
                                    value={report}
                                    onChange={(e) => setReport(e.target.value)}
                                />
                                <button
                                    disabled={!report.trim() || submitting}
                                    onClick={handleReportSubmit}
                                    className="mt-6 w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold py-3 rounded-[2px] transition-colors shadow-none shadow-blue-200 disabled:opacity-50"
                                >
                                    {submitting ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            <PlusCircle className="w-5 h-5" />
                                            Submit Report
                                        </>
                                    )}
                                </button>
                            </div>
                        ) : (
                            <div className="bg-surface rounded-[2px] shadow-none border border-border p-6 flex items-center gap-4">
                                <CheckCircle className="w-10 h-10 text-success-bg0 shrink-0" />
                                <div className="w-full">
                                    <h2 className="text-lg font-bold text-text-primary">Report Submitted successfully!</h2>
                                    <p className="text-text-secondary mb-3">Your report has been forwarded to the supervisor and HOD for review.</p>
                                    <div className="bg-orange-50 border border-orange-200 text-orange-800 p-3 rounded-[2px] flex items-start gap-2 text-sm font-medium">
                                        <AlertCircle className="w-5 h-5 shrink-0 text-orange-600" />
                                        <p>System Rule: If the Supervisor or HOD fails to review this within the required deadline, it will be automatically Escalated to the Admin.</p>
                                    </div>
                                    <button
                                        onClick={() => { setReport(''); setSubmitted(false); }}
                                        className="mt-4 px-4 py-2 border border-blue-200 text-primary font-semibold rounded-[2px] hover:bg-primary-light transition-colors"
                                    >
                                        Submit Another Report
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Leave Requests Section */}
                    <div>
                        <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
                            <CalendarDays className="w-6 h-6 text-rose-500" />
                            Leave Requests
                        </h2>
                        <div className="bg-surface rounded-[2px] shadow-none border border-border p-6">
                            <div className="flex justify-between items-center mb-6">
                                <p className="text-sm font-semibold text-text-secondary">Upcoming & Pending Leaves</p>
                                <Link href="/dashboard/faculty/leave">
                                    <button className="px-4 py-2 bg-error-bg text-error-text hover:bg-error-bg font-bold rounded-[2px] transition-colors text-sm">
                                        + New Leave
                                    </button>
                                </Link>
                            </div>
                            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                                {leaves.length === 0 ? (
                                    <p className="text-text-secondary italic text-sm">No leave requests found.</p>
                                ) : (
                                    leaves.map(l => (
                                        <div key={l.leaverequestid} className="p-4 border border-border bg-error-bg/20 rounded-[2px]">
                                            <div className="flex justify-between items-start mb-2 flex-wrap gap-2">
                                                <p className="font-bold text-text-primary">{l.leavetype.charAt(0) + l.leavetype.slice(1).toLowerCase()} Leave</p>
                                                <span className={`text-[9px] uppercase font-semibold tracking-widest px-2 py-0.5 rounded-[2px] ${getStatusStyle(l.status)}`}>
                                                    {l.status.replace(/_/g, ' ')}
                                                </span>
                                            </div>
                                            <p className="text-xs text-text-primary mb-1">
                                                {new Date(l.startdate).toLocaleDateString([], { month: 'short', day: 'numeric' })} - {new Date(l.enddate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </p>
                                            {l.comments?.[0]?.comment && (
                                                <p className="text-xs text-text-secondary italic">"{l.comments[0].comment}"</p>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Activity Reports History Section */}
                    <div className="mt-8">
                        <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
                            <ClipboardList className="w-6 h-6 text-blue-500" />
                            Activity Report History
                        </h2>
                        <div className="bg-surface rounded-[2px] shadow-none border border-border p-6">
                            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                                {activities.length === 0 ? (
                                    <p className="text-text-secondary italic text-sm">No past activity reports found.</p>
                                ) : (
                                    activities.map(a => (
                                        <div key={a.facultyactivityid || a.id} className="p-4 border border-border bg-primary-light/20 rounded-[2px]">
                                            <div className="flex justify-between items-start mb-2 flex-wrap gap-2">
                                                <p className="font-bold text-text-primary">{new Date(a.date).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                                                <span className={`text-[9px] uppercase font-semibold tracking-widest px-2 py-0.5 rounded-[2px] ${getStatusStyle(a.status)}`}>
                                                    {a.status.replace(/_/g, ' ')}
                                                </span>
                                            </div>
                                            <p className="text-xs text-text-primary mb-1">
                                                {a.summary}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
