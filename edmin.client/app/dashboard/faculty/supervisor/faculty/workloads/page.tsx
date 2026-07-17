'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { SupervisorAPI } from '@/utils/api';
import { Users, FileText, CheckCircle2, Clock } from 'lucide-react';
import { UserRole } from '@/types/types';

export default function SupervisorFacultyWorkloadsPage() {
    const [faculty, setFaculty] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFaculty();
    }, []);

    const fetchFaculty = async () => {
        try {
            const data = await SupervisorAPI.getDepartmentFaculty();
            setFaculty(data);
        } catch (error: any) {
            console.error('Failed to load faculty workloads:', {
                message: error?.message,
                status: error?.status,
                data: error?.response?.data || error?.data,
                url: error?.config?.url || error?.url,
                method: error?.config?.method || error?.method,
                context: 'SupervisorFacultyWorkloadsPage.fetchFaculty'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout userName="Supervisor" userRole={UserRole.FACULTY} notifications={[]} currentPath="/dashboard/faculty/supervisor/faculty/workloads">
            <div className="p-6 md:p-8 space-y-8 animate-fade-in max-w-7xl mx-auto">
                <header>
                    <h1 className="text-2xl font-bold text-text-primary tracking-tight">Faculty Workloads</h1>
                    <p className="text-text-secondary mt-1 text-sm md:text-base">
                        Monitor active faculty members, their courses, and current workload status.
                    </p>
                </header>

                {loading ? (
                    <div className="flex h-32 items-center justify-center">
                        <div className="text-text-muted">Loading faculty data...</div>
                    </div>
                ) : faculty.length === 0 ? (
                    <div className="bg-surface rounded-xl border border-border p-12 text-center">
                        <Users className="h-12 w-12 text-text-muted mx-auto mb-4" strokeWidth={1} />
                        <h3 className="text-lg font-medium text-text-primary mb-1">No Faculty Found</h3>
                        <p className="text-text-secondary text-sm">No faculty members are assigned to your department yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {faculty.map((member) => (
                            <div key={member.id} className="bg-surface rounded-xl border border-border p-6 shadow-sm hover:border-primary/30 transition-colors">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                                            {member.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-text-primary">{member.name}</h3>
                                            <p className="text-sm text-text-secondary">{member.email}</p>
                                        </div>
                                    </div>
                                    <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                                        {member.activeCourses.length} Courses
                                    </span>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">Active Courses</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {member.activeCourses.length > 0 ? (
                                                member.activeCourses.map((c: string, idx: number) => (
                                                    <span key={idx} className="px-2.5 py-1 bg-surface-hover border border-border text-text-secondary text-xs rounded-md">
                                                        {c}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-sm text-text-muted">No active courses</span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                                        <div>
                                            <p className="text-xs text-text-muted mb-1">Total Credits</p>
                                            <p className="text-lg font-medium text-text-primary">{member.totalCredits}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-text-muted mb-1">Status</p>
                                            <div className="flex items-center gap-1.5">
                                                {member.totalCredits > 12 ? (
                                                    <><Clock className="h-4 w-4 text-amber-500" /><span className="text-sm font-medium text-amber-600">Overloaded</span></>
                                                ) : (
                                                    <><CheckCircle2 className="h-4 w-4 text-green-500" /><span className="text-sm font-medium text-green-600">Optimal</span></>
                                                )}
                                            </div>
                                        </div>
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
