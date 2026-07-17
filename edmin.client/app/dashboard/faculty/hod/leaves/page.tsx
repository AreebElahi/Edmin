'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { UserRole } from '@/types/types';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import AdminStatusBadge from '@/components/admin/AdminStatusBadge';
import { CalendarCheck, Building, CheckCircle, XCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { HodAPI } from '@/utils/api';

export default function HodLeavesPage() {
    const queryClient = useQueryClient();

    const { data: leavesRes, isLoading } = useQuery({
        queryKey: ['hod-leaves'],
        queryFn: HodAPI.getDepartmentLeaves
    });

    const approveMutation = useMutation({
        mutationFn: (id: number) => HodAPI.approveLeave(id, 'Approved by HOD'),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hod-leaves'] });
            alert("Successfully approved leave!");
        },
        onError: (err: any) => {
            alert(`Error approving leave: ${err?.message || err}`);
            console.error(err);
        }
    });

    const rejectMutation = useMutation({
        mutationFn: (id: number) => HodAPI.rejectLeave(id, 'Rejected by HOD'),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hod-leaves'] });
            alert("Successfully rejected leave!");
        },
        onError: (err: any) => {
            alert(`Error rejecting leave: ${err?.message || err}`);
            console.error(err);
        }
    });

    const leaves = leavesRes || [];

    return (
        <DashboardLayout userRole={UserRole.FACULTY} userName="HOD" notifications={[]} currentPath="/dashboard/faculty/hod/leaves">
            <AdminPageWrapper>
                <AdminPageHeader
                    icon={CalendarCheck}
                    title="Leave"
                    titleAccent="Requests"
                    subtitle="Comment on pending leave requests and view leave history."
                    eyebrow={{ icon: Building, label: "HOD Administration" }}
                />
                
                <div className="bg-surface rounded-[2px] shadow-none border border-border flex flex-col flex-1 p-6">
                    {isLoading ? (
                        <div className="flex justify-center items-center py-10">
                            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : leaves.length === 0 ? (
                        <div className="flex justify-center items-center py-10 text-text-secondary">
                            No leave requests found for this department.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-border text-xs uppercase tracking-wider text-text-muted">
                                        <th className="p-3">Faculty</th>
                                        <th className="p-3">Leave Type</th>
                                        <th className="p-3">Duration</th>
                                        <th className="p-3">Reason</th>
                                        <th className="p-3">Status</th>
                                        <th className="p-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leaves.map((leave: any) => (
                                        <tr key={leave.id} className="border-b border-border hover:bg-surface-hover">
                                            <td className="p-3 font-medium text-sm text-text-primary">
                                                {leave.facultyName || 'Unknown'}
                                            </td>
                                            <td className="p-3 text-sm text-text-secondary">
                                                {leave.leaveType}
                                            </td>
                                            <td className="p-3 text-sm text-text-secondary">
                                                {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                                            </td>
                                            <td className="p-3 text-sm text-text-secondary max-w-xs truncate" title={leave.reason}>
                                                {leave.reason}
                                            </td>
                                            <td className="p-3">
                                                <AdminStatusBadge 
                                                    status={leave.status} 
                                                    variant={leave.status === 'APPROVED' ? 'success' : leave.status === 'REJECTED' ? 'error' : leave.status === 'PENDING' ? 'warning' : 'primary'} 
                                                />
                                            </td>
                                            <td className="p-3 text-right">
                                                {(leave.status === 'PENDING' || leave.status === 'SUBMITTED' || leave.status === 'PENDING_HR') && (
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => approveMutation.mutate(leave.id)}
                                                            disabled={approveMutation.isPending || rejectMutation.isPending}
                                                            className="p-1.5 text-success-600 hover:bg-success-50 rounded-md transition-colors"
                                                            title="Approve"
                                                        >
                                                            <CheckCircle className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => rejectMutation.mutate(leave.id)}
                                                            disabled={approveMutation.isPending || rejectMutation.isPending}
                                                            className="p-1.5 text-error-600 hover:bg-error-50 rounded-md transition-colors"
                                                            title="Reject"
                                                        >
                                                            <XCircle className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </AdminPageWrapper>
        </DashboardLayout>
    );
}
