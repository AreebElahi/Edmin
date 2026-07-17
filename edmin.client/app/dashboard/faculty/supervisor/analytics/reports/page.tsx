'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { FileText, Download, BarChart2, Users, CalendarCheck, Loader2 } from 'lucide-react';
import { UserRole } from '@/types/types';
import { SupervisorAPI } from '@/utils/api';
import { downloadCSV } from '@/utils/csv';
import toast from 'react-hot-toast';

export default function SupervisorReportsPage() {
    const [generating, setGenerating] = useState<string | null>(null);

    const handleGenerate = async (reportId: string) => {
        setGenerating(reportId);
        try {
            let data: any[] = [];
            let filename = `Report_${reportId}_${new Date().toISOString().split('T')[0]}`;

            if (reportId === 'WORKLOAD') {
                const loads = await SupervisorAPI.getDepartmentFaculty();
                data = loads.map((l: any) => ({
                    Faculty_Name: l.name,
                    Email: l.email,
                    Total_Credits: l.totalCredits,
                    Active_Courses: Array.isArray(l.activeCourses) ? l.activeCourses.join(' | ') : '',
                    Status: l.performanceStatus || 'GOOD'
                }));
            } else if (reportId === 'ATTENDANCE') {
                const students = await SupervisorAPI.getDepartmentStudents();
                data = students.map((s: any) => ({
                    Roll_Number: s.rollnumber,
                    Student_Name: s.studentName,
                    Course: s.courseName,
                    Attendance_Percentage: s.attendancePercentage,
                    Status: s.status
                }));
            } else if (reportId === 'ACTIVITY_LOG') {
                const logs = await SupervisorAPI.getDepartmentActivityReports();
                data = logs.map((l: any) => ({
                    Date: new Date(l.date).toLocaleDateString(),
                    Faculty_Name: l.facultyName,
                    Summary: l.summary,
                    Status: l.status
                }));
            } else if (reportId === 'KPI_METRICS') {
                const health = await SupervisorAPI.getAnalyticsHealth();
                data = [
                    { Metric: 'Department Health Score', Value: health?.healthScore },
                    { Metric: 'Total Faculty', Value: health?.faculty?.total },
                    { Metric: 'Total Students', Value: health?.students?.total },
                    { Metric: 'Active Courses', Value: health?.courses?.running },
                    { Metric: 'Pending Teaching Loads', Value: health?.operations?.pendingTeachingLoads },
                    { Metric: 'Pending Activity Reports', Value: health?.operations?.pendingReports },
                    { Metric: 'Pending Leave Requests', Value: health?.operations?.pendingLeaves },
                ];
            }

            if (data.length === 0) {
                toast.error('No data available to generate this report.');
            } else {
                downloadCSV(data, filename);
                toast.success(`${filename}.csv downloaded successfully!`);
            }

        } catch (err: any) {
            toast.error(err.message || 'Failed to generate report');
        } finally {
            setGenerating(null);
        }
    };

    const reports = [
        {
            id: 'WORKLOAD',
            title: 'Faculty Workload Summary',
            description: 'Comprehensive overview of all faculty teaching assignments, credit hours, and current status.',
            icon: Users,
            color: 'text-purple-500',
            bg: 'bg-purple-500/10'
        },
        {
            id: 'ATTENDANCE',
            title: 'Department Attendance Analytics',
            description: 'Detailed attendance statistics for all courses in the department, highlighting at-risk students.',
            icon: CalendarCheck,
            color: 'text-teal-500',
            bg: 'bg-teal-500/10'
        },
        {
            id: 'ACTIVITY_LOG',
            title: 'Daily Activity Log Export',
            description: 'Export of all daily activity reports submitted by faculty members over a selected period.',
            icon: FileText,
            color: 'text-orange-500',
            bg: 'bg-orange-500/10'
        },
        {
            id: 'KPI_METRICS',
            title: 'Performance & KPI Metrics',
            description: 'High-level department performance indicators, approval turnaround times, and general statistics.',
            icon: BarChart2,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10'
        }
    ];

    return (
        <DashboardLayout userName="Supervisor" userRole={UserRole.FACULTY} notifications={[]} currentPath="/dashboard/faculty/supervisor/analytics/reports">
            <div className="p-6 md:p-8 space-y-8 animate-fade-in max-w-7xl mx-auto">
                <header>
                    <h1 className="text-2xl font-bold text-text-primary tracking-tight">Generate Reports</h1>
                    <p className="text-text-secondary mt-1 text-sm md:text-base">
                        Export department data and analytics for review or presentation.
                    </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {reports.map((report, idx) => {
                        const Icon = report.icon;
                        const isGenerating = generating === report.id;
                        return (
                            <div key={idx} className="bg-surface rounded-xl border border-border p-6 shadow-sm hover:border-primary/30 transition-all duration-200 group flex flex-col h-full">
                                <div className="flex items-start gap-4 mb-4">
                                    <div className={`p-3 rounded-xl ${report.bg} group-hover:scale-110 transition-transform`}>
                                        <Icon className={`h-6 w-6 ${report.color}`} strokeWidth={1.5} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-text-primary group-hover:text-primary transition-colors">
                                            {report.title}
                                        </h3>
                                        <p className="text-sm text-text-secondary mt-1">
                                            {report.description}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-auto pt-4 border-t border-border flex justify-end">
                                    <button
                                        onClick={() => handleGenerate(report.id)}
                                        disabled={isGenerating || generating !== null}
                                        className="flex items-center gap-2 px-4 py-2 bg-surface-hover hover:bg-primary/10 text-text-primary hover:text-primary font-medium text-sm rounded-lg border border-border hover:border-primary/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                        {isGenerating ? 'Generating...' : 'Download CSV'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </DashboardLayout>
    );
}
