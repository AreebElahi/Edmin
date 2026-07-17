'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { SupervisorAPI } from '@/utils/api';
import { CalendarCheck, AlertTriangle } from 'lucide-react';
import { UserRole } from '@/types/types';

export default function SupervisorAttendancePage() {
    const [attendanceData, setAttendanceData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAttendance();
    }, []);

    const fetchAttendance = async () => {
        try {
            const data = await SupervisorAPI.getDepartmentAttendance();
            setAttendanceData(data);
        } catch (error: any) {
            console.error('Failed to load department attendance:', {
                message: error?.message,
                status: error?.status,
                data: error?.response?.data || error?.data,
                url: error?.config?.url || error?.url,
                method: error?.config?.method || error?.method,
                context: 'SupervisorAttendancePage.fetchAttendance'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout userName="Supervisor" userRole={UserRole.FACULTY} notifications={[]} currentPath="/dashboard/faculty/supervisor/attendance">
            <div className="p-6 md:p-8 space-y-8 animate-fade-in max-w-7xl mx-auto">
                <header>
                    <h1 className="text-2xl font-bold text-text-primary tracking-tight">Student Attendance Overview</h1>
                    <p className="text-text-secondary mt-1 text-sm md:text-base">
                        Monitor attendance analytics and identify at-risk students in your department.
                    </p>
                </header>

                {loading ? (
                    <div className="flex h-32 items-center justify-center">
                        <div className="text-text-muted">Loading attendance data...</div>
                    </div>
                ) : attendanceData.length === 0 ? (
                    <div className="bg-surface rounded-xl border border-border p-12 text-center">
                        <CalendarCheck className="h-12 w-12 text-text-muted mx-auto mb-4" strokeWidth={1} />
                        <h3 className="text-lg font-medium text-text-primary mb-1">No Attendance Data</h3>
                        <p className="text-text-secondary text-sm">Attendance records are not available for your department.</p>
                    </div>
                ) : (
                    <div className="bg-surface rounded-xl border border-border overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-surface-hover border-b border-border text-xs uppercase tracking-wider text-text-muted">
                                        <th className="p-4 font-semibold">Student Name</th>
                                        <th className="p-4 font-semibold">Roll Number</th>
                                        <th className="p-4 font-semibold">Course</th>
                                        <th className="p-4 font-semibold text-center">Attendance %</th>
                                        <th className="p-4 font-semibold">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {attendanceData.map((record, idx) => {
                                        const isAtRisk = record.attendancePercentage < 75;
                                        return (
                                            <tr key={idx} className={`border-b border-border hover:bg-surface-hover/50 transition-colors ${isAtRisk ? 'bg-red-50/30' : ''}`}>
                                                <td className="p-4">
                                                    <div className="font-medium text-text-primary">{record.studentName}</div>
                                                </td>
                                                <td className="p-4 text-sm text-text-secondary">
                                                    {record.rollnumber}
                                                </td>
                                                <td className="p-4 font-medium text-text-secondary">
                                                    {record.courseName}
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className={`font-semibold ${isAtRisk ? 'text-red-600' : 'text-green-600'}`}>
                                                        {record.attendancePercentage}%
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    {isAtRisk ? (
                                                        <span className="flex items-center gap-1.5 px-2.5 py-1 w-max text-xs font-medium rounded-full bg-red-100 text-red-700">
                                                            <AlertTriangle className="h-3 w-3" /> At Risk
                                                        </span>
                                                    ) : (
                                                        <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                                                            Regular
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
