'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { UserRole } from '@/types/types';
import { ClipboardCheck, CheckCircle2, XCircle, Home, FileText, Users, BookOpen, Clock } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminTabBar from '@/components/admin/AdminTabBar';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import AdminStatusBadge from '@/components/admin/AdminStatusBadge';
import AdminActionIconButton from '@/components/admin/AdminActionIconButton';
import { apiPost, apiPatch } from '@/api/apiContract';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { DashboardAPI, SupervisorAPI } from '@/utils/api';

export default function SupervisorDashboard() {
    const [profile, setProfile] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'loads' | 'enrollments' | 'reports' | 'leaves'>('loads');
    const queryClient = useQueryClient();

    useEffect(() => {
        DashboardAPI.getFacultyDashboard().then(res => setProfile(res?.profile)).catch(console.error);
    }, []);

    const { data: pendingData, isLoading } = useQuery({
        queryKey: ['supervisor-pending'],
        queryFn: async () => {
            const res = await SupervisorAPI.getPendingApprovals();
            return res.data;
        }
    });

    const actionLoadMutation = useMutation({
        mutationFn: ({ id, action }: { id: number; action: 'approve' | 'reject' }) => 
            apiPatch(`/faculty/supervisor/teaching-loads/${id}/${action}`, {}),
        onSuccess: (_, variables) => {
            toast.success(`Teaching load request ${variables.action}d successfully`);
            queryClient.invalidateQueries({ queryKey: ['supervisor-pending'] });
        },
        onError: (err: any) => toast.error(err?.message || 'Action failed')
    });

    const actionEnrollmentMutation = useMutation({
        mutationFn: ({ id, action }: { id: number; action: 'approve' | 'reject' }) => 
            apiPatch(`/faculty/supervisor/enrollment/${id}/${action}`, {}),
        onSuccess: (_, variables) => {
            toast.success(`Enrollment request ${variables.action}d`);
            queryClient.invalidateQueries({ queryKey: ['supervisor-pending'] });
        },
        onError: (err: any) => toast.error(err?.message || 'Action failed')
    });

    const actionReportMutation = useMutation({
        mutationFn: ({ id, action }: { id: number; action: 'approve' | 'reject' }) => 
            apiPatch(`/faculty/supervisor/activity-reports/${id}/${action}`, {}),
        onSuccess: (_, variables) => {
            toast.success(`Activity report ${variables.action}d`);
            queryClient.invalidateQueries({ queryKey: ['supervisor-pending'] });
        },
        onError: (err: any) => toast.error(err?.message || 'Action failed')
    });

    return (
        <DashboardLayout
            userRole={UserRole.FACULTY}
            userName={profile?.fullname || 'Supervisor'}
            notifications={[]}
            currentPath="/dashboard/faculty/supervisor"
        >
            <AdminPageWrapper>
                <AdminPageHeader
                    icon={ClipboardCheck}
                    title="Supervisor"
                    titleAccent="Dashboard"
                    subtitle="Manage and approve departmental requests."
                    eyebrow={{ icon: Home, label: "Faculty Portal" }}
                    actions={
                        <span className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-[2px] font-medium">
                            <ClipboardCheck className="w-4 h-4" />
                            {profile?.department || 'Department'}
                        </span>
                    }
                />

                <AdminTabBar
                    tabs={[
                        { id: 'loads', label: 'Teaching Loads' },
                        { id: 'enrollments', label: 'Enrollments' },
                        { id: 'reports', label: 'Activity Reports' },
                        { id: 'leaves', label: 'Leave Requests' }
                    ]}
                    activeTab={activeTab}
                    onTabChange={(id) => setActiveTab(id as any)}
                />

                <div className="bg-surface rounded-[2.5rem] shadow-none border border-border overflow-hidden flex flex-col flex-1">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-text-secondary whitespace-nowrap">
                            <thead className="bg-surface-hover text-text-secondary text-xs uppercase tracking-widest font-semibold">
                                <tr>
                                    <th className="px-6 py-4">Applicant / Origin</th>
                                    <th className="px-6 py-4">Details</th>
                                    <th className="px-6 py-4">Date Submitted</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-surface">
                                {isLoading ? (
                                    <tr><td colSpan={4} className="text-center py-10">Loading pending requests...</td></tr>
                                ) : (
                                    <>
                                        {activeTab === 'loads' && (pendingData?.teachingLoads?.length === 0 ? (
                                            <tr><td colSpan={4} className="text-center py-10 text-text-secondary font-bold">No pending teaching loads.</td></tr>
                                        ) : pendingData?.teachingLoads?.map((item: any) => (
                                            <tr key={item.id} className="hover:bg-surface-hover transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-text-primary flex items-center gap-2">
                                                        <Users className="w-4 h-4 text-primary" /> {item.facultyName}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm">{item.courses.join(', ')}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-xs">{new Date(item.createdAt).toLocaleDateString()}</div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <AdminActionIconButton icon={CheckCircle2} variant="success" onClick={() => actionLoadMutation.mutate({ id: item.id, action: 'approve' })} title="Approve" />
                                                        <AdminActionIconButton icon={XCircle} variant="error" onClick={() => actionLoadMutation.mutate({ id: item.id, action: 'reject' })} title="Reject" />
                                                    </div>
                                                </td>
                                            </tr>
                                        )))}

                                        {activeTab === 'enrollments' && (pendingData?.enrollments?.length === 0 ? (
                                            <tr><td colSpan={4} className="text-center py-10 text-text-secondary font-bold">No pending enrollments.</td></tr>
                                        ) : pendingData?.enrollments?.map((item: any) => (
                                            <tr key={item.id} className="hover:bg-surface-hover transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-text-primary">{item.studentName}</div>
                                                    <div className="text-xs text-text-secondary">{item.rollNo}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <BookOpen className="w-4 h-4 text-primary" /> {item.courseName}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-xs">{new Date(item.createdAt).toLocaleDateString()}</div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <AdminActionIconButton icon={CheckCircle2} variant="success" onClick={() => actionEnrollmentMutation.mutate({ id: item.id, action: 'approve' })} title="Approve" />
                                                        <AdminActionIconButton icon={XCircle} variant="error" onClick={() => actionEnrollmentMutation.mutate({ id: item.id, action: 'reject' })} title="Reject" />
                                                    </div>
                                                </td>
                                            </tr>
                                        )))}

                                        {activeTab === 'reports' && (pendingData?.activityReports?.length === 0 ? (
                                            <tr><td colSpan={4} className="text-center py-10 text-text-secondary font-bold">No pending activity reports.</td></tr>
                                        ) : pendingData?.activityReports?.map((item: any) => (
                                            <tr key={item.id} className="hover:bg-surface-hover transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-text-primary">{item.facultyName}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm truncate max-w-[200px]" title={item.summary}>{item.summary}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-xs flex items-center gap-1">
                                                        <Clock className="w-3 h-3" /> {new Date(item.date).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <AdminActionIconButton icon={CheckCircle2} variant="success" onClick={() => actionReportMutation.mutate({ id: item.id, action: 'approve' })} title="Approve" />
                                                        <AdminActionIconButton icon={XCircle} variant="error" onClick={() => actionReportMutation.mutate({ id: item.id, action: 'reject' })} title="Reject" />
                                                    </div>
                                                </td>
                                            </tr>
                                        )))}

                                        {activeTab === 'leaves' && (pendingData?.leaves?.length === 0 ? (
                                            <tr><td colSpan={4} className="text-center py-10 text-text-secondary font-bold">No pending leave requests.</td></tr>
                                        ) : pendingData?.leaves?.map((item: any) => (
                                            <tr key={item.id} className="hover:bg-surface-hover transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-text-primary">{item.facultyName}</div>
                                                    <div className="text-xs uppercase"><AdminStatusBadge status={item.type} variant="primary" /></div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm">{new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}</div>
                                                    <div className="text-xs text-text-muted truncate max-w-[150px]">{item.reason}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-xs">{new Date(item.createdAt).toLocaleDateString()}</div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="text-xs text-text-muted italic">Awaiting Comment</span>
                                                </td>
                                            </tr>
                                        )))}
                                    </>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </AdminPageWrapper>
        </DashboardLayout>
    );
}
