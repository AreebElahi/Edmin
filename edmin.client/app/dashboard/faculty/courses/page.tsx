'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { UserRole, Course, Notification } from '@/types/types';
import { BookOpen, Users, Clock, ArrowRight, Plus, Search, Filter, Home, MoreVertical } from 'lucide-react';
import Link from 'next/link';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminFilterBar from '@/components/admin/AdminFilterBar';
import { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import { DashboardAPI } from '@/utils/api';
import { apiGet } from '@/api/apiContract';

export default function FacultyCoursesPage() {
    const [showComingSoon, setShowComingSoon] = useState(false);
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [dash, coursesRes] = await Promise.all([
                    DashboardAPI.getFacultyDashboard(),
                    apiGet<any[]>('/faculty/courses')
                ]);
                setProfile(dash.profile);
                setCourses(coursesRes || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <DashboardLayout userName="Loading..." userRole={UserRole.FACULTY} notifications={[]} currentPath="/dashboard/faculty/courses">
                <div className="flex justify-center items-center h-[60vh]">
                    <div className="w-6 h-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            userRole={UserRole.FACULTY}
            userName={profile?.fullname || 'Faculty'}
            userAvatar={profile?.avatar}
            notifications={[]}
            currentPath="/dashboard/faculty/courses"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <AdminPageHeader
                    icon={BookOpen}
                    title="My Teaching"
                    titleAccent="Courses"
                    subtitle="Manage your courses, assignments, and students"
                    eyebrow={{ icon: Home, label: "Faculty Portal" }}
                />

                {/* Search & Filters */}
                <AdminFilterBar
                    searchValue=""
                    onSearchChange={() => {}}
                    searchPlaceholder="Search courses..."
                    filters={[
                        {
                            id: 'status',
                            label: 'Term',
                            value: 'Fall 2025',
                            onChange: () => { },
                            options: [
                                { value: 'Fall 2025', label: 'Fall 2025' },
                                { value: 'Spring 2025', label: 'Spring 2025' },
                                { value: 'Archived', label: 'Archived' }
                            ]
                        }
                    ]}
                />

                {/* Courses Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map((course) => (
                        <div
                            key={course.id}
                            className="group relative bg-surface rounded-[2px] shadow-none hover:shadow-none transition-all duration-300 border border-border overflow-hidden flex flex-col h-full"
                        >
                            <div className="relative h-32 bg-surface p-6 border-b border-border">
                                <div className="absolute inset-0 bg-surface-hover/0 group-hover:bg-surface-hover/50 transition-colors"></div>

                                <div className="relative z-10 flex justify-between items-start">
                                    <span className="px-3 py-1 bg-surface-hover rounded-[2px] text-text-secondary text-xs font-bold border border-border">
                                        {course.code}
                                    </span>
                                    <button
                                        onClick={() => setShowComingSoon(true)}
                                        className="text-text-secondary hover:text-text-primary p-1 rounded-[2px] hover:bg-surface-hover transition-colors"
                                    >
                                        <MoreVertical className="h-5 w-5" />
                                    </button>
                                </div>
                                <h3 className="relative z-10 text-text-primary font-bold text-xl mt-3 line-clamp-1">{course.name}</h3>
                            </div>

                            <div className="p-6 flex-1 flex flex-col">
                                <div className="space-y-4 mb-6 flex-1">
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2 text-text-primary">
                                            <Users className="h-4 w-4 text-text-muted" />
                                            <span>{course.students} Students</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-text-primary">
                                            <Clock className="h-4 w-4 text-text-muted" />
                                            <span>{course.semester}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <Link
                                            href={`/dashboard/faculty/courses/${course.id}?tab=assignments`}
                                            className="flex items-center justify-center gap-2 py-2 px-3 bg-primary-light text-primary rounded-[2px] text-xs font-semibold hover:bg-primary-hover hover:text-white transition-colors text-center"
                                        >
                                            Assignments
                                        </Link>
                                        <Link
                                            href={`/dashboard/faculty/courses/${course.id}?tab=attendance`}
                                            className="flex items-center justify-center gap-2 py-2 px-3 bg-primary-light text-primary rounded-[2px] text-xs font-semibold hover:bg-primary-hover hover:text-white transition-colors text-center"
                                        >
                                            Attendance
                                        </Link>
                                    </div>
                                </div>

                                <Link href={`/dashboard/faculty/courses/${course.id}`} className="block mt-auto">
                                    <button className="w-full py-2.5 flex items-center justify-center gap-2 bg-primary text-white rounded-[2px] font-medium hover:bg-primary-hover transition-all group/btn shadow-none shadow-blue-200">
                                        Manage Course
                                        <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                                    </button>
                                </Link>
                            </div>
                        </div>
                    ))}


                </div>

                <Modal
                    isOpen={showComingSoon}
                    onClose={() => setShowComingSoon(false)}
                    title="Feature Coming Soon"
                    type="default"
                >
                    <div className="text-center py-4">
                        <div className="p-3 bg-primary-light rounded-[2px] text-primary w-16 h-16 flex items-center justify-center mx-auto mb-4">
                            <BookOpen className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-semibold text-text-primary mb-2">Course Management</h3>
                        <p className="text-text-secondary mb-6">
                            This feature is currently under development.
                        </p>
                        <button
                            onClick={() => setShowComingSoon(false)}
                            className="bg-primary text-white px-6 py-2 rounded-[2px] text-sm font-medium hover:bg-primary-hover transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </Modal>
            </div>
        </DashboardLayout>
    );
}
