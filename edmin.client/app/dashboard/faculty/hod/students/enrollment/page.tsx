'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { UserRole } from '@/types/types';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import AdminStatusBadge from '@/components/admin/AdminStatusBadge';
import { GraduationCap, Building } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { HodAPI } from '@/utils/api';

export default function HodEnrollmentStatisticsPage() {
    const { data: studentsRes, isLoading } = useQuery({
        queryKey: ['hod-students'],
        queryFn: HodAPI.getDepartmentStudents
    });

    const enrollments = studentsRes?.enrollments || [];

    return (
        <DashboardLayout userRole={UserRole.FACULTY} userName="HOD" notifications={[]} currentPath="/dashboard/faculty/hod/students/enrollment">
            <AdminPageWrapper>
                <AdminPageHeader
                    icon={GraduationCap}
                    title="Enrollment"
                    titleAccent="Statistics"
                    subtitle="View student enrollment requests, trends, and course occupancy."
                    eyebrow={{ icon: Building, label: "HOD Administration" }}
                />
                
                <div className="bg-surface rounded-[2px] shadow-none border border-border flex flex-col flex-1 p-6">
                    {isLoading ? (
                        <div className="flex justify-center items-center py-10">
                            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : enrollments.length === 0 ? (
                        <div className="flex justify-center items-center py-10 text-text-secondary">
                            No enrollment records found for this department.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-border text-xs uppercase tracking-wider text-text-muted">
                                        <th className="p-3">Student</th>
                                        <th className="p-3">Course Offering</th>
                                        <th className="p-3">Term</th>
                                        <th className="p-3">Status</th>
                                        <th className="p-3">Percentage</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {enrollments.map((enrollment: any) => (
                                        <tr key={enrollment.courseenrollmentid} className="border-b border-border hover:bg-surface-hover">
                                            <td className="p-3 font-medium text-sm text-text-primary">
                                                {enrollment.student?.user?.username || 'Unknown'}
                                            </td>
                                            <td className="p-3 text-sm text-text-secondary">
                                                {enrollment.courseoffering?.course?.name || 'Unknown'}
                                            </td>
                                            <td className="p-3 text-sm text-text-secondary">
                                                {enrollment.courseoffering?.term || 'Ongoing'}
                                            </td>
                                            <td className="p-3">
                                                <AdminStatusBadge 
                                                    status={enrollment.isactive ? 'Active' : 'Inactive'} 
                                                    variant={enrollment.isactive ? 'success' : 'warning'} 
                                                />
                                            </td>
                                            <td className="p-3 text-sm font-bold text-text-primary">
                                                {enrollment.percentage != null ? `${enrollment.percentage}%` : 'N/A'}
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
