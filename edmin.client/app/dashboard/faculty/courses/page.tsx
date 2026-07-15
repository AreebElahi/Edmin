'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { UserRole, Course, Notification } from '@/types/types';
import { BookOpen, Users, Clock, ArrowRight, Plus, Search, Filter, Home, MoreVertical } from 'lucide-react';
import Link from 'next/link';
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
                {/* Breadcrumb */}
                <nav className="flex mb-6" aria-label="Breadcrumb">
                    <ol className="flex items-center space-x-2 bg-surface px-3 py-2 rounded-[2px] border border-border shadow-none">
                        <li>
                            <Link href="/dashboard/faculty" className="text-text-secondary hover:text-primary transition-colors">
                                <Home className="w-4 h-4" />
                            </Link>
                        </li>
                        <li><span className="text-border-hover">/</span></li>
                        <li><span className="text-sm font-medium text-text-primary">My Courses</span></li>
                    </ol>
                </nav>

                {/* Header Card */}
                <div className="bg-surface rounded-[2px] p-6 shadow-none border border-border relative overflow-hidden mb-8">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-sky-500 to-slate-500"></div>
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-text-primary mb-1">My Teaching Courses</h1>
                            <p className="text-text-secondary">Manage your courses, assignments, and students</p>
                        </div>
                    </div>
                </div>

                {/* Search & Filters */}
                <div className="bg-surface rounded-[2px] p-4 shadow-none border border-border mb-8 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
                        <input
                            type="text"
                            placeholder="Search courses..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-[2px] border border-border focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                        />
                    </div>
                    <div className="flex gap-3">
                        <button className="flex items-center gap-2 px-4 py-2.5 rounded-[2px] border border-border hover:bg-background transition-colors text-text-primary font-medium whitespace-nowrap">
                            <Filter className="h-4 w-4" />
                            Filter Status
                        </button>
                        <select className="px-4 py-2.5 rounded-[2px] border border-border hover:bg-background transition-colors text-text-primary font-medium bg-transparent outline-none cursor-pointer">
                            <option>Fall 2025</option>
                            <option>Spring 2025</option>
                            <option>Archived</option>
                        </select>
                    </div>
                </div>

                {/* Courses Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map((course) => (
                        <div
                            key={course.id}
                            className="group relative bg-surface rounded-[2px] shadow-none hover:shadow-none transition-all duration-300 border border-border overflow-hidden flex flex-col h-full"
                        >
                            <div className={`relative h-32 bg-gradient-to-br ${course.color} p-6`}>
                                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors"></div>
                                <div className="absolute top-0 right-0 w-32 h-32 bg-surface/10 rounded-[2px] -mr-10 -mt-10 blur-xl"></div>

                                <div className="relative z-10 flex justify-between items-start">
                                    <span className="px-3 py-1 bg-surface/20  rounded-[2px] text-white text-xs font-bold border border-white/10">
                                        {course.code}
                                    </span>
                                    <button
                                        onClick={() => setShowComingSoon(true)}
                                        className="text-white/80 hover:text-white p-1 rounded-[2px] hover:bg-surface/20 transition-colors"
                                    >
                                        <MoreVertical className="h-5 w-5" />
                                    </button>
                                </div>
                                <h3 className="relative z-10 text-white font-bold text-xl mt-3 line-clamp-1">{course.name}</h3>
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
                                            className="flex items-center justify-center gap-2 py-2 px-3 bg-primary-light text-primary rounded-[2px] text-xs font-semibold hover:bg-primary-light transition-colors text-center"
                                        >
                                            Assignments
                                        </Link>
                                        <Link
                                            href={`/dashboard/faculty/courses/${course.id}?tab=attendance`}
                                            className="flex items-center justify-center gap-2 py-2 px-3 bg-primary-light text-primary rounded-[2px] text-xs font-semibold hover:bg-indigo-100 transition-colors text-center"
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
