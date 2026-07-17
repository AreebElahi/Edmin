'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { UserRole } from '@/types/types';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import AdminStatusBadge from '@/components/admin/AdminStatusBadge';
import { ClipboardList, Building } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { HodAPI } from '@/utils/api';

export default function HodActivityReportsPage() {
    const { data: reportsRes, isLoading } = useQuery({
        queryKey: ['hod-activity-reports'],
        queryFn: HodAPI.getDepartmentActivityReports
    });

    const reports = reportsRes || [];

    return (
        <DashboardLayout userRole={UserRole.FACULTY} userName="HOD" notifications={[]} currentPath="/dashboard/faculty/hod/faculty/activity-reports">
            <AdminPageWrapper>
                <AdminPageHeader
                    icon={ClipboardList}
                    title="Activity"
                    titleAccent="Reports"
                    subtitle="Review daily activity reports submitted by department faculty."
                    eyebrow={{ icon: Building, label: "HOD Administration" }}
                />
                
                <div className="bg-surface rounded-[2px] shadow-none border border-border flex flex-col flex-1 p-6">
                    {isLoading ? (
                        <div className="flex justify-center items-center py-10">
                            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : reports.length === 0 ? (
                        <div className="flex justify-center items-center py-10 text-text-secondary">
                            No activity reports found for this department.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-border text-xs uppercase tracking-wider text-text-muted">
                                        <th className="p-3">Date</th>
                                        <th className="p-3">Faculty</th>
                                        <th className="p-3">Report Details</th>
                                        <th className="p-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reports.map((report: any) => (
                                        <tr key={report.dailyactivityreportid} className="border-b border-border hover:bg-surface-hover">
                                            <td className="p-3 whitespace-nowrap text-sm text-text-primary">
                                                {new Date(report.reportdate).toLocaleDateString()}
                                            </td>
                                            <td className="p-3 font-medium text-sm text-text-primary">
                                                {report.faculty?.user?.username || report.faculty?.fullname || 'Unknown'}
                                            </td>
                                            <td className="p-3 text-sm text-text-secondary max-w-md truncate" title={report.activities}>
                                                {report.activities}
                                            </td>
                                            <td className="p-3">
                                                <AdminStatusBadge 
                                                    status={report.status} 
                                                    variant={report.status === 'APPROVED' ? 'success' : report.status === 'REJECTED' ? 'error' : 'warning'} 
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
