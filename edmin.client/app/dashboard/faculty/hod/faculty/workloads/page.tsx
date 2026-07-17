'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { UserRole } from '@/types/types';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import AdminStatusBadge from '@/components/admin/AdminStatusBadge';
import { Users, Building } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { HodAPI } from '@/utils/api';

export default function HodFacultyWorkloadsPage() {
    const { data: activityRes, isLoading } = useQuery({
        queryKey: ['hod-activity'],
        queryFn: HodAPI.getFacultyActivity
    });

    const workloads = activityRes || [];

    return (
        <DashboardLayout userRole={UserRole.FACULTY} userName="HOD" notifications={[]} currentPath="/dashboard/faculty/hod/faculty/workloads">
            <AdminPageWrapper>
                <AdminPageHeader
                    icon={Users}
                    title="Faculty"
                    titleAccent="Workloads"
                    subtitle="Monitor the teaching distribution and workload of department faculty."
                    eyebrow={{ icon: Building, label: "HOD Administration" }}
                />
                
                <div className="bg-surface rounded-[2px] shadow-none border border-border flex flex-col flex-1 p-6">
                    {isLoading ? (
                        <div className="flex justify-center items-center py-10">
                            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : workloads.length === 0 ? (
                        <div className="flex justify-center items-center py-10 text-text-secondary">
                            No faculty data found for this department.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-border text-xs uppercase tracking-wider text-text-muted">
                                        <th className="p-3">Faculty Name</th>
                                        <th className="p-3">Status</th>
                                        <th className="p-3">Assigned Courses</th>
                                        <th className="p-3">Workload (Credits)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {workloads.map((faculty: any) => (
                                        <tr key={faculty.id} className="border-b border-border hover:bg-surface-hover">
                                            <td className="p-3 font-medium text-sm text-text-primary">
                                                {faculty.name}
                                            </td>
                                            <td className="p-3">
                                                <AdminStatusBadge 
                                                    status={faculty.status} 
                                                    variant={faculty.status === 'Available' ? 'success' : faculty.status === 'On Leave' ? 'warning' : 'primary'} 
                                                />
                                            </td>
                                            <td className="p-3 text-sm text-text-secondary">
                                                {faculty.course}
                                            </td>
                                            <td className="p-3 text-sm font-bold text-text-primary">
                                                {faculty.load}
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
