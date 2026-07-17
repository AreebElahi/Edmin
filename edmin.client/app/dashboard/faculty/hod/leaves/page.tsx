'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { UserRole } from '@/types/types';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import AdminStatusBadge from '@/components/admin/AdminStatusBadge';
import { CalendarCheck, Building } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { HodAPI } from '@/utils/api';

export default function HodLeavesPage() {
    const { data: leavesRes, isLoading } = useQuery({
        queryKey: ['hod-leaves'],
        queryFn: HodAPI.getDepartmentLeaves
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
                                    </tr>
                                </thead>
                                <tbody>
                                    {leaves.map((leave: any) => (
                                        <tr key={leave.leaverequestid} className="border-b border-border hover:bg-surface-hover">
                                            <td className="p-3 font-medium text-sm text-text-primary">
                                                {leave.user?.username || leave.user?.faculty?.[0]?.fullname || 'Unknown'}
                                            </td>
                                            <td className="p-3 text-sm text-text-secondary">
                                                {leave.leavetype}
                                            </td>
                                            <td className="p-3 text-sm text-text-secondary">
                                                {new Date(leave.startdate).toLocaleDateString()} - {new Date(leave.enddate).toLocaleDateString()}
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
