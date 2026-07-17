'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { SupervisorAPI } from '@/utils/api';
import { UserRole } from '@/types/types';
import { BookOpen, Users, AlertCircle, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SupervisorCoursesMonitoringPage() {
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            const data = await SupervisorAPI.getDepartmentCourses();
            setCourses(data);
        } catch (error: any) {
            toast.error(error.message || 'Failed to load courses monitoring');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ON_TRACK': return 'bg-green-100 text-green-700 border-green-200';
            case 'WARNING': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'CRITICAL': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'ON_TRACK': return <CheckCircle2 className="w-4 h-4 mr-1.5" />;
            case 'WARNING': return <AlertCircle className="w-4 h-4 mr-1.5" />;
            case 'CRITICAL': return <AlertCircle className="w-4 h-4 mr-1.5" />;
            default: return null;
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'ON_TRACK': return 'On Track';
            case 'WARNING': return 'Behind Schedule / Unassigned';
            case 'CRITICAL': return 'Critical Delay / Over-Capacity';
            default: return status;
        }
    };

    return (
        <DashboardLayout userName="Supervisor" userRole={UserRole.FACULTY} notifications={[]} currentPath="/dashboard/faculty/supervisor/monitoring/courses">
            <div className="p-6 md:p-8 space-y-8 animate-fade-in max-w-7xl mx-auto">
                <header>
                    <h1 className="text-2xl font-bold text-text-primary tracking-tight">Course Monitoring</h1>
                    <p className="text-text-secondary mt-1 text-sm md:text-base">
                        Real-time operational monitoring of all running courses in the department.
                    </p>
                </header>

                {loading ? (
                    <div className="flex h-32 items-center justify-center">
                        <div className="text-text-muted">Loading courses...</div>
                    </div>
                ) : courses.length === 0 ? (
                    <div className="bg-surface rounded-xl border border-border p-12 text-center">
                        <BookOpen className="h-12 w-12 text-text-muted mx-auto mb-4" strokeWidth={1} />
                        <h3 className="text-lg font-medium text-text-primary mb-1">No Active Courses</h3>
                        <p className="text-text-secondary text-sm">There are no courses currently offered in this department.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {courses.map((course, idx) => (
                            <div key={idx} className={`bg-surface rounded-2xl p-6 border shadow-sm transition-all hover:shadow-md ${course.status === 'CRITICAL' ? 'border-red-200' : 'border-border'}`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded-md">{course.courseCode}</span>
                                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-semibold rounded-md">Sec: {course.sectionName}</span>
                                        </div>
                                        <h3 className="text-lg font-bold text-text-primary line-clamp-1">{course.courseName}</h3>
                                    </div>
                                    <div className="p-2 bg-slate-50 rounded-lg">
                                        <BookOpen className="w-5 h-5 text-text-muted" />
                                    </div>
                                </div>
                                
                                <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border mb-5 ${getStatusColor(course.status)}`}>
                                    {getStatusIcon(course.status)}
                                    {getStatusText(course.status)}
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2 text-text-secondary">
                                            <Users className="w-4 h-4" /> Enrolled Students
                                        </div>
                                        <span className={`font-semibold ${course.enrolled > course.capacity ? 'text-red-500' : 'text-text-primary'}`}>
                                            {course.enrolled} / {course.capacity}
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2 text-text-secondary">
                                            <AlertCircle className="w-4 h-4" /> Instructor
                                        </div>
                                        <span className={`font-semibold ${course.instructors.length === 0 ? 'text-amber-500' : 'text-text-primary'}`}>
                                            {course.instructors.length > 0 ? course.instructors.join(', ') : 'Unassigned'}
                                        </span>
                                    </div>

                                    {/* Mock Operational Progress */}
                                    <div className="pt-4 border-t border-border">
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-text-secondary font-medium">Syllabus Completion</span>
                                            <span className="text-text-primary font-bold">45%</span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                                            <div className="bg-primary h-1.5 rounded-full" style={{ width: '45%' }}></div>
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
