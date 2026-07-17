'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { SupervisorAPI } from '@/utils/api';
import { UserRole } from '@/types/types';
import { GraduationCap, AlertTriangle, UserX, ShieldAlert, FileWarning } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SupervisorStudentMonitoringPage() {
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const data = await SupervisorAPI.getDepartmentStudents();
            setStudents(data);
        } catch (error: any) {
            toast.error(error.message || 'Failed to load student monitoring');
        } finally {
            setLoading(false);
        }
    };

    // Extract unique at-risk students since multiple courses might report the same student
    const atRiskStudents = Array.from(new Set(students.filter(s => s.status === 'AT_RISK').map(s => s.rollnumber)))
        .map(roll => {
            const records = students.filter(s => s.rollnumber === roll);
            const student = records[0];
            return {
                ...student,
                coursesAtRisk: records.map(r => r.courseName),
                totalAlerts: records.reduce((sum, r) => sum + r.alerts.length, 0)
            };
        });

    return (
        <DashboardLayout userName="Supervisor" userRole={UserRole.FACULTY} notifications={[]} currentPath="/dashboard/faculty/supervisor/monitoring/students">
            <div className="p-6 md:p-8 space-y-8 animate-fade-in max-w-7xl mx-auto">
                <header>
                    <h1 className="text-2xl font-bold text-text-primary tracking-tight">Student Risk Monitoring</h1>
                    <p className="text-text-secondary mt-1 text-sm md:text-base">
                        Identify and intervene for students exhibiting academic or attendance risks.
                    </p>
                </header>

                {loading ? (
                    <div className="flex h-32 items-center justify-center">
                        <div className="text-text-muted">Loading risk factors...</div>
                    </div>
                ) : atRiskStudents.length === 0 ? (
                    <div className="bg-surface rounded-xl border border-border p-12 text-center">
                        <ShieldAlert className="h-12 w-12 text-green-500 mx-auto mb-4" strokeWidth={1} />
                        <h3 className="text-lg font-medium text-text-primary mb-1">No At-Risk Students</h3>
                        <p className="text-text-secondary text-sm">All students are currently maintaining regular attendance and good academic standing.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {atRiskStudents.map((student, idx) => (
                            <div key={idx} className="bg-surface rounded-2xl p-6 border border-amber-200 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-16 h-16 bg-amber-50 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
                                
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex gap-4 items-center">
                                        <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-lg font-bold shadow-inner">
                                            {student.studentName.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-text-primary">{student.studentName}</h3>
                                            <p className="text-sm font-medium text-text-secondary">{student.rollnumber}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <div className="px-2.5 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-md flex items-center gap-1">
                                            <AlertTriangle className="w-3 h-3" />
                                            {student.totalAlerts} Alerts
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-border">
                                    <div className="bg-background rounded-lg p-3 border border-border">
                                        <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Primary Risk Factors</h4>
                                        <ul className="space-y-2">
                                            {student.alerts.map((alert: string, i: number) => (
                                                <li key={i} className="flex items-start gap-2 text-sm text-text-primary">
                                                    <UserX className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                                                    <span>
                                                        <span className="font-semibold text-red-600">{alert}: </span> 
                                                        Attendance is currently at {student.attendancePercentage}% (Below 75% threshold)
                                                    </span>
                                                </li>
                                            ))}
                                            <li className="flex items-start gap-2 text-sm text-text-primary">
                                                <FileWarning className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                                <span>
                                                    <span className="font-semibold text-amber-600">Affected Courses: </span> 
                                                    {student.coursesAtRisk.join(', ')}
                                                </span>
                                            </li>
                                        </ul>
                                    </div>
                                    
                                    <div className="flex justify-end gap-2 pt-2">
                                        <button className="px-4 py-2 bg-background border border-border text-text-secondary text-sm font-medium rounded-lg hover:bg-surface-hover transition-colors">
                                            View Profile
                                        </button>
                                        <button className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors shadow-sm">
                                            Initiate Intervention
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
