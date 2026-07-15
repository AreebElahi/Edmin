'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { UserRole } from '@/types/types';
import { ClipboardCheck, CheckCircle2, XCircle, MessageSquare, Loader2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiPost, apiPatch } from '@/api/apiContract';
import { toast } from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { DashboardAPI } from '@/utils/api';

export default function SupervisorDashboard() {
    const [profile, setProfile] = useState<any>(null);
    const [reviewComment, setReviewComment] = useState('');
    const [selectedItemId, setSelectedItemId] = useState<number | null>(null);

    useEffect(() => {
        DashboardAPI.getFacultyDashboard().then(res => setProfile(res?.profile)).catch(console.error);
    }, []);

    // Mutations extracted from approvals/page.tsx and updated to hit the new /supervisor namespace
    const commentLeaveMutation = useMutation({
        mutationFn: ({ id, comment }: { id: number; comment: string }) => 
            apiPost(`/faculty/supervisor/leaves/${id}/comment`, { comment }),
        onSuccess: () => {
            toast.success('Leave review comments submitted');
            setReviewComment('');
            setSelectedItemId(null);
            // refetchLeaves(); // In a full implementation, you would refetch queries here
        },
        onError: (err: any) => {
            toast.error(err?.message || 'Failed to submit comment');
        }
    });

    const actionLoadMutation = useMutation({
        mutationFn: ({ id, action, comment }: { id: number; action: 'approve' | 'reject'; comment?: string }) => 
            apiPatch(`/faculty/supervisor/teaching-loads/${id}/${action}`, { comment }),
        onSuccess: (_, variables) => {
            toast.success(`Teaching load request ${variables.action}d successfully`);
            setReviewComment('');
            setSelectedItemId(null);
            // refetchLoads();
        },
        onError: (err: any) => {
            toast.error(err?.message || 'Action failed');
        }
    });

    const actionEnrollmentMutation = useMutation({
        mutationFn: ({ id, action, comment }: { id: number; action: 'approve' | 'reject'; comment?: string }) => 
            apiPatch(`/faculty/supervisor/enrollment/${id}/${action}`, { comment }),
        onSuccess: (_, variables) => {
            toast.success(`Enrollment request ${variables.action}d`);
            setReviewComment('');
            setSelectedItemId(null);
            // refetchEnrollments();
        },
        onError: (err: any) => {
            toast.error(err?.message || 'Action failed');
        }
    });

    const actionReportMutation = useMutation({
        mutationFn: ({ id, action, comment }: { id: number; action: 'approve' | 'reject'; comment?: string }) => 
            apiPatch(`/faculty/supervisor/activity-reports/${id}/${action}`, { comment }),
        onSuccess: (_, variables) => {
            toast.success(`Activity report ${variables.action}d`);
            setReviewComment('');
            setSelectedItemId(null);
            // refetchReports();
        },
        onError: (err: any) => {
            toast.error(err?.message || 'Action failed');
        }
    });

    return (
        <DashboardLayout
            userRole={UserRole.FACULTY}
            userName={profile?.fullname || 'Supervisor'}
            notifications={[]}
            currentPath="/dashboard/faculty/supervisor"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header Card */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-text-primary">Supervisor Dashboard</h1>
                        <p className="text-text-secondary mt-1">Manage and approve departmental requests.</p>
                    </div>
                    <div className="flex gap-3">
                        <span className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-[2px] font-medium">
                            <ClipboardCheck className="w-4 h-4" />
                            {profile?.department || 'Department'}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    <div className="bg-surface rounded-[2px] shadow-none border border-border p-6">
                        <h2 className="text-xl font-bold text-text-primary mb-4">Pending Approvals</h2>
                        <p className="text-sm text-text-secondary mb-6">
                            This dashboard exposes the mutation capabilities extracted from the faculty approvals view.
                            To test these mutations, implement the respective UI cards (Teaching Loads, Enrollments, Activity Reports, Leaves) that trigger them.
                        </p>

                        {/* Placeholder UI to demonstrate the mutations */}
                        <div className="space-y-4">
                            <div className="p-4 border border-border rounded-[2px] bg-surface-hover flex justify-between items-center">
                                <div>
                                    <h3 className="font-semibold text-text-primary">Teaching Load Approval Example</h3>
                                    <p className="text-xs text-text-secondary">Request ID: 1234</p>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => {
                                            if (window.confirm("Approve this teaching load?")) {
                                                actionLoadMutation.mutate({ id: 1234, action: 'approve' });
                                            }
                                        }}
                                        disabled={actionLoadMutation.isPending}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-success-bg text-success-text hover:bg-success-bg/80 rounded-[2px] text-xs font-semibold disabled:opacity-50"
                                    >
                                        {actionLoadMutation.isPending && actionLoadMutation.variables?.action === 'approve' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} Approve
                                    </button>
                                    <button 
                                        onClick={() => {
                                            if (window.confirm("Reject this teaching load?")) {
                                                actionLoadMutation.mutate({ id: 1234, action: 'reject', comment: 'Insufficient load' });
                                            }
                                        }}
                                        disabled={actionLoadMutation.isPending}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-error-bg text-error-text hover:bg-error-bg/80 rounded-[2px] text-xs font-semibold disabled:opacity-50"
                                    >
                                        {actionLoadMutation.isPending && actionLoadMutation.variables?.action === 'reject' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />} Reject
                                    </button>
                                </div>
                            </div>
                            
                            <div className="p-4 border border-border rounded-[2px] bg-surface-hover flex justify-between items-center">
                                <div>
                                    <h3 className="font-semibold text-text-primary">Enrollment Approval Example</h3>
                                    <p className="text-xs text-text-secondary">Request ID: 5678</p>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => {
                                            if (window.confirm("Approve this enrollment request?")) {
                                                actionEnrollmentMutation.mutate({ id: 5678, action: 'approve' });
                                            }
                                        }}
                                        disabled={actionEnrollmentMutation.isPending}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-success-bg text-success-text hover:bg-success-bg/80 rounded-[2px] text-xs font-semibold disabled:opacity-50"
                                    >
                                        {actionEnrollmentMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} Approve
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
