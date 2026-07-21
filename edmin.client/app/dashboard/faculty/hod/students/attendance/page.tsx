'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { UserRole } from '@/types/types';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import { Users, Building, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { HodAPI } from '@/utils/api';

export default function HodAttendanceAnalyticsPage() {
    const { data: studentsRes, isLoading } = useQuery({
        queryKey: ['hod-students'],
        queryFn: HodAPI.getDepartmentStudents
    });

    const attendanceRecords = studentsRes?.attendance || [];

    return (
        <DashboardLayout userRole={UserRole.FACULTY} userName="HOD" notifications={[]} currentPath="/dashboard/faculty/hod/students/attendance">
            <AdminPageWrapper>
                <AdminPageHeader
                    icon={Users}
                    title="Attendance"
                    titleAccent="Analytics"
                    subtitle="Monitor overall student attendance and identify low attendance alerts."
                    eyebrow={{ icon: Building, label: "HOD Administration" }}
                />
                
                <div className="bg-surface rounded-[2px] shadow-none border border-border flex flex-col flex-1 p-6">
                    {isLoading ? (
                        <div className="flex justify-center items-center py-10">
                            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : attendanceRecords.length === 0 ? (
                        <div className="flex flex-col justify-center items-center py-10 text-text-secondary">
                            <p>No attendance records found for this department.</p>
                            {studentsRes?.departmentName && (
                                <p className="mt-2 text-sm font-medium">Department: {studentsRes.departmentName}</p>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-border text-xs uppercase tracking-wider text-text-muted">
                                        <th className="p-3">Student</th>
                                        <th className="p-3">Course Offering</th>
                                        <th className="p-3">Total Classes</th>
                                        <th className="p-3">Attended</th>
                                        <th className="p-3">Percentage</th>
                                        <th className="p-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {attendanceRecords.map((record: any) => {
                                        const percentage = record.totalclasses > 0 ? Math.round((record.totalpresent / record.totalclasses) * 100) : 0;
                                        const isLow = percentage < 75;
                                        
                                        return (
                                            <tr key={record.attendancesummaryid} className="border-b border-border hover:bg-surface-hover">
                                                <td className="p-3 font-medium text-sm text-text-primary">
                                                    {record.student?.user?.username || 'Unknown'}
                                                </td>
                                                <td className="p-3 text-sm text-text-secondary">
                                                    {record.courseoffering?.course?.name || 'Unknown'}
                                                </td>
                                                <td className="p-3 text-sm text-text-secondary">
                                                    {record.totalclasses}
                                                </td>
                                                <td className="p-3 text-sm text-text-secondary">
                                                    {record.totalpresent}
                                                </td>
                                                <td className={`p-3 text-sm font-bold ${isLow ? 'text-error-600' : 'text-text-primary'}`}>
                                                    {percentage}%
                                                </td>
                                                <td className="p-3">
                                                    {isLow && (
                                                        <span className="flex items-center text-xs text-error-600 bg-error-50 px-2 py-1 rounded-full w-fit">
                                                            <AlertCircle className="w-3 h-3 mr-1" />
                                                            Low Attendance
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </AdminPageWrapper>
        </DashboardLayout>
    );
}
