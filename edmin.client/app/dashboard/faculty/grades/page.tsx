'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { UserRole } from '@/types/types';
import { TrendingUp, Search, Clock, Users, ArrowRight, ClipboardList, Home, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { useState, useEffect } from 'react';
import { apiGet } from '@/api/apiContract';
import { DashboardAPI } from '@/utils/api';

interface Course {
    id: string;
    name: string;
    code: string;
    students: number;
    semester: string;
    color: string;
    progress: number;
}

export default function FacultyGradesPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [profile, setProfile] = useState<any>(null);
    const [notifications, setNotifications] = useState<any[]>([]);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [coursesRes, dash] = await Promise.all([
                    apiGet<any>('/faculty/courses'),
                    DashboardAPI.getFacultyDashboard()
                ]);

                setCourses(coursesRes || []);
                setProfile(dash?.profile || null);
                setNotifications(dash?.notifications || []);
            } catch (err: any) {
                setError(err.message || 'Failed to load grades dashboard');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const filteredCourses = courses.filter(course =>
        course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const userName = profile?.fullname || profile?.user?.username || 'Faculty';
    const mappedNotifications = notifications.map(n => ({
        id: n.notificationid.toString(),
        title: n.title,
        message: n.message,
        timestamp: new Date(n.createdat),
        read: n.isread,
        type: 'info' as const
    }));

    if (loading) {
        return (
            <DashboardLayout userName="Loading..." userRole={UserRole.FACULTY} notifications={[]}>
                <div className="flex justify-center items-center h-[60vh]">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout userName="Error" userRole={UserRole.FACULTY} notifications={[]}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="bg-error-bg text-error-text p-4 rounded-[2px] flex items-center gap-3">
                        <AlertCircle className="w-5 h-5" />
                        <span>{error}</span>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            userRole={UserRole.FACULTY}
            userName={userName}
            notifications={mappedNotifications}
            currentPath="/dashboard/faculty/grades"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <AdminPageHeader
                    icon={TrendingUp}
                    title="Grades"
                    titleAccent="Dashboard"
                    subtitle="Manage student grades and track academic performance across your courses"
                    eyebrow={{ icon: Home, label: "Faculty Portal" }}
                />

                <section className="mb-10">
                    <div className="relative mb-6">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search courses..."
                            className="w-full pl-12 pr-4 py-3 bg-surface border border-border rounded-[2px] outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {filteredCourses.length === 0 ? (
                        <p className="text-text-secondary italic bg-background border border-border p-6 rounded-[2px]">No courses found.</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredCourses.map(course => (
                                <div key={course.id} className="bg-surface rounded-[2px] p-6 shadow-none border border-border hover:shadow-none hover:border-blue-200 transition-all flex flex-col group">
                                    <Link href={`/dashboard/faculty/courses/${course.id}?tab=grades`} className="flex-1">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="px-2.5 py-0.5 rounded-[2px] text-xs font-semibold border bg-primary-light text-primary border-border">
                                                        {course.code}
                                                    </span>
                                                    <span className="text-xs text-text-secondary font-medium flex items-center gap-1">
                                                        <Clock className="w-4 h-4 text-text-muted" />
                                                        {typeof course.semester === 'object' ? (course.semester as any)?.name : course.semester}
                                                    </span>
                                                </div>
                                                <h3 className="text-xl font-bold text-text-primary group-hover:text-primary transition-colors line-clamp-1">
                                                    {course.name}
                                                </h3>
                                            </div>
                                            <div className="p-3 rounded-[2px] bg-primary-light text-primary group-hover:scale-110 transition-transform">
                                                <TrendingUp className="w-6 h-6" />
                                            </div>
                                        </div>
                                    </Link>
                                    <div className="mt-auto pt-6 border-t border-border flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-2 text-sm text-text-secondary">
                                            <Users className="w-4 h-4" />
                                            <span>{course.students} Students</span>
                                        </div>
                                        <Link href={`/dashboard/faculty/courses/${course.id}?tab=grades`}>
                                            <button className="px-5 py-2 rounded-[2px] bg-primary text-white text-sm font-semibold shadow-none hover:bg-primary-hover transition-all flex items-center gap-2">
                                                Manage Grades
                                                <ArrowRight className="w-4 h-4" />
                                            </button>
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </DashboardLayout>
    );
}
