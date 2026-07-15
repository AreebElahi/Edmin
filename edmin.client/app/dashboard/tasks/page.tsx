'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { UserRole } from '@/types/types';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/api/apiContract';
import { useCurrentProfile } from '@/features/profile/hooks/useProfile';
import { ClipboardList, AlertCircle, CheckCircle, Clock, Link as LinkIcon, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function CentralizedTasksPage() {
    const { data: profile, isLoading: isProfileLoading } = useCurrentProfile();

    const role = profile?.role as UserRole || UserRole.STUDENT;
    const userId = profile?.userId;

    // Fetch leaves (Faculty sees own, HR/Supervisor/HOD see pending reviews)
    const { data: leaves = [], isLoading: isLeavesLoading } = useQuery<any[]>({
        queryKey: ['tasks-leaves', role, userId],
        queryFn: () => apiGet('/faculty/leaves'),
        enabled: !!profile && role === UserRole.FACULTY
    });

    // Fetch enrollment requests
    const { data: enrollments = [], isLoading: isEnrollmentsLoading } = useQuery<any[]>({
        queryKey: ['tasks-enrollments', role, userId],
        queryFn: () => apiGet('/student/enrollment/mine'),
        enabled: !!profile && role === UserRole.STUDENT
    });

    // Fetch teaching loads
    const { data: teachingLoads = [], isLoading: isLoadsLoading } = useQuery<any[]>({
        queryKey: ['tasks-loads', role, userId],
        queryFn: () => apiGet<any>('/faculty/approvals').then(res => res?.teachingLoads || res?.data?.teachingLoads || []),
        enabled: !!profile && role === UserRole.FACULTY
    });

    // Fetch daily activity reports
    const { data: activityReports = [], isLoading: isReportsLoading } = useQuery<any[]>({
        queryKey: ['tasks-activity-reports', role, userId],
        queryFn: () => apiGet('/faculty/activity'),
        enabled: !!profile && role === UserRole.FACULTY
    });

    // Fetch open tickets (For Admin / Faculty)
    const { data: tickets = [], isLoading: isTicketsLoading } = useQuery<any>({
        queryKey: ['tasks-tickets', role],
        queryFn: () => apiGet('/admin/tickets'),
        enabled: profile?.role === 'ADMIN' || profile?.role === 'FACULTY'
    });

    if (isProfileLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-[2px] animate-spin"></div>
            </div>
        );
    }

    const displayName = profile?.fullName || profile?.username || 'User';

    // Build the tasks array depending on role
    const tasks: { id: string; title: string; category: string; description: string; date: string; status: 'PENDING' | 'ALERT' | 'INFO'; link: string }[] = [];

    // STUDENT tasks
    if (role === UserRole.STUDENT) {
        // Enrollment status alert
        const activeEnrollments = enrollments.filter(e => e.status === 'SUBMITTED' || e.status === 'PENDING_SUPERVISOR');
        activeEnrollments.forEach(e => {
            tasks.push({
                id: `enr-${e.enrollmentrequestid}`,
                title: 'Course Enrollment Pending',
                category: 'Enrollment',
                description: `Your request to enroll in ${e.courseoffering?.course?.name || 'Course'} is awaiting Supervisor approval.`,
                date: new Date(e.createdat).toLocaleDateString(),
                status: 'PENDING',
                link: `/dashboard/student/courses`
            });
        });

        if (tasks.length === 0) {
            tasks.push({
                id: 'no-tasks',
                title: 'All caught up!',
                category: 'Compliance',
                description: 'You have no pending enrollment, registration, or administrative tasks at this time.',
                date: 'Now',
                status: 'INFO',
                link: '#'
            });
        }
    }

    // FACULTY tasks (Teacher view)
    if (role === UserRole.FACULTY) {
        // check if user is Supervisor or HOD
        const isSupervisor = managedDepts(leaves, userId, 'supervisor');
        const isHod = managedDepts(leaves, userId, 'hod');

        // Leaves pending HR approval
        const ownLeaves = leaves.filter(l => l.userid === userId && (l.status === 'SUBMITTED' || l.status === 'PENDING_HR'));
        ownLeaves.forEach(l => {
            tasks.push({
                id: `leave-${l.leaverequestid}`,
                title: 'Leave Request Under Review',
                category: 'Leave',
                description: `Your leave request from ${new Date(l.startdate).toLocaleDateString()} is awaiting HR final approval.`,
                date: new Date(l.createdat).toLocaleDateString(),
                status: 'PENDING',
                link: `/dashboard/notifications`
            });
        });

        // Teaching Load status
        const ownLoad = teachingLoads.filter(tl => tl.faculty?.userid === userId && tl.status !== 'APPROVED' && tl.status !== 'REJECTED');
        ownLoad.forEach(tl => {
            tasks.push({
                id: `load-${tl.teachingloadid}`,
                title: 'Teaching Load Under Review',
                category: 'Academic Core',
                description: `Your semester teaching load is currently status: ${tl.status}.`,
                date: new Date(tl.createdat).toLocaleDateString(),
                status: 'PENDING',
                link: `/dashboard/faculty/teaching-load`
            });
        });

        // Supervisor tasks: Review department requests
        const pendingLeaves = leaves.filter(l => l.status === 'SUBMITTED' && l.userid !== userId);
        pendingLeaves.forEach(l => {
            tasks.push({
                id: `rev-leave-${l.leaverequestid}`,
                title: `Review Leave: ${l.user?.fullname || 'Teacher'}`,
                category: 'Supervisor/HOD Approval',
                description: `Action needed: Review and attach remarks for leave request starting ${new Date(l.startdate).toLocaleDateString()}.`,
                date: new Date(l.createdat).toLocaleDateString(),
                status: 'ALERT',
                link: `/dashboard/faculty/approvals`
            });
        });

        const pendingEnrollments = enrollments.filter(e => e.status === 'SUBMITTED');
        pendingEnrollments.forEach(e => {
            tasks.push({
                id: `rev-enr-${e.enrollmentrequestid}`,
                title: `Review Enrollment: ${e.student?.fullname || 'Student'}`,
                category: 'Supervisor Approval',
                description: `Action needed: Approve course enrollment request for ${e.courseoffering?.course?.name || 'Course'}.`,
                date: new Date(e.createdat).toLocaleDateString(),
                status: 'ALERT',
                link: `/dashboard/faculty/approvals`
            });
        });

        const pendingLoads = teachingLoads.filter(tl => tl.status === 'SUBMITTED' || tl.status === 'PENDING_HOD');
        pendingLoads.forEach(tl => {
            tasks.push({
                id: `rev-load-${tl.teachingloadid}`,
                title: `Review Teaching Load: ${tl.faculty?.fullname || 'Faculty'}`,
                category: 'Supervisor/HOD Approval',
                description: `Action needed: Review credit load proposal (Status: ${tl.status}).`,
                date: new Date(tl.createdat).toLocaleDateString(),
                status: 'ALERT',
                link: `/dashboard/faculty/approvals`
            });
        });

        const pendingReports = activityReports.filter(r => r.status === 'PENDING_SUPERVISOR' || r.status === 'PENDING_HOD');
        pendingReports.forEach(r => {
            tasks.push({
                id: `rev-rep-${r.dailyactivityreportid}`,
                title: `Review Activity Report: ${r.faculty?.fullname || 'Faculty'}`,
                category: 'Supervisor/HOD Approval',
                description: `Action needed: Review activity summary log for ${new Date(r.reportdate).toLocaleDateString()}.`,
                date: new Date(r.createdat).toLocaleDateString(),
                status: 'ALERT',
                link: `/dashboard/faculty/approvals`
            });
        });
    }

    // HR tasks
    if (role === UserRole.HR) {
        const pendingHrLeaves = leaves.filter(l => l.status === 'PENDING_HR');
        pendingHrLeaves.forEach(l => {
            tasks.push({
                id: `hr-leave-${l.leaverequestid}`,
                title: `Approve Leave: ${l.user?.fullname || 'Teacher'}`,
                category: 'HR Management',
                description: `Action needed: Execute final approval on leave request from ${new Date(l.startdate).toLocaleDateString()}.`,
                date: new Date(l.createdat).toLocaleDateString(),
                status: 'ALERT',
                link: `/dashboard/hr/leaves`
            });
        });

        tasks.push({
            id: 'hr-payroll-reminder',
            title: 'Verify Payroll Ledger',
            category: 'Finance Compliance',
            description: 'Monthly compliance check: audit and verify faculty payroll disbursement records.',
            date: 'Recurring',
            status: 'INFO',
            link: '/dashboard/hr/payroll'
        });
    }

    // ADMIN tasks
    if (role === UserRole.ADMIN) {
        // Open tickets
        const openTickets = Array.isArray(tickets?.tickets) ? tickets.tickets.filter((t: any) => t.status === 'OPEN') : [];
        openTickets.forEach((t: any) => {
            tasks.push({
                id: `ticket-${t.id}`,
                title: `Resolve Support Ticket #${t.id}`,
                category: 'Support Escalations',
                description: `Action needed: Respond to user query: "${t.title}".`,
                date: new Date(t.created_at).toLocaleDateString(),
                status: 'ALERT',
                link: `/dashboard/admin/tickets`
            });
        });

        // Workflow errors
        tasks.push({
            id: 'admin-workflow-watch',
            title: 'Verify Workflow Engine events',
            category: 'System Health',
            description: 'Monitor active queue pipelines and review failed event states.',
            date: 'Real-time',
            status: 'INFO',
            link: '/dashboard/admin/workflow'
        });
    }

    const isLoadingData = isLeavesLoading || isEnrollmentsLoading || isLoadsLoading || isReportsLoading || isTicketsLoading;

    return (
        <DashboardLayout
            userRole={role}
            userName={displayName}
            notifications={[]}
            currentPath="/dashboard/tasks"
        >
            <div className="max-w-5xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="bg-surface rounded-[2px] p-6 shadow-none border border-border mb-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-text-primary leading-tight mt-2">Tasks & Action Items 📋</h1>
                    <p className="text-text-secondary text-sm mt-1">Review active process flows, pending reviews, and tasks needing your immediate signature or feedback.</p>
                </div>

                {/* Tasks List */}
                {isLoadingData ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-[2px] animate-spin"></div>
                    </div>
                ) : tasks.length === 0 ? (
                    <div className="bg-surface border border-border rounded-[2px] p-12 text-center shadow-none">
                        <CheckCircle className="w-12 h-12 text-success-bg0 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-text-primary">All Tasks Completed!</h3>
                        <p className="text-text-secondary text-sm mt-1">You do not have any pending workflows requiring action.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {tasks.map(task => (
                            <div
                                key={task.id}
                                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-surface rounded-[2px] border border-border shadow-none transition-all hover:shadow-none`}
                            >
                                <div className="flex items-start gap-4 min-w-0">
                                    <div className={`p-3 rounded-[2px] ${task.status === 'ALERT'
                                        ? 'bg-orange-50 text-orange-600 border border-orange-100'
                                        : task.status === 'PENDING'
                                            ? 'bg-primary-light text-primary border border-border'
                                            : 'bg-surface-hover text-text-secondary border border-border'
                                        }`}>
                                        <ClipboardList className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-xs font-bold uppercase tracking-wider text-text-muted">{task.category}</span>
                                            <span className="text-[10px] text-text-muted font-medium">• {task.date}</span>
                                        </div>
                                        <h3 className="font-bold text-text-primary text-base mt-1">{task.title}</h3>
                                        <p className="text-sm text-text-secondary mt-1">{task.description}</p>
                                    </div>
                                </div>
                                <div className="shrink-0">
                                    {task.link !== '#' ? (
                                        <Link
                                            href={task.link}
                                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold rounded-[2px] shadow-none transition-all uppercase tracking-wider"
                                        >
                                            Take Action
                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </Link>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-success-bg text-green-700 text-xs font-bold rounded-[2px] border border-green-100">
                                            <CheckCircle className="w-3.5 h-3.5" /> Completed
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

// Utility checker for department managers
function managedDepts(items: any[], userId: number | undefined, role: 'supervisor' | 'hod') {
    return false; // dynamic check handles in routes
}
