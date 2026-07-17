'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { UserRole } from '@/types/types';
import { Home, Search, BookOpen, Clock, Users, ArrowRight, Calendar, CheckCircle2, AlertCircle, Loader2, ClipboardList } from 'lucide-react';
import Link from 'next/link';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { useState, useEffect } from 'react';
import { apiGet } from '@/api/apiContract';
import { DashboardAPI } from '@/utils/api';

// Helper to get theme classes based on color name
const getTheme = (color: string) => {
    const themes: Record<string, any> = {
        blue: {
            iconBg: 'bg-primary-light text-primary',
            progressFill: 'bg-blue-600',
            badge: 'bg-primary-light text-primary border-border'
        },
        purple: {
            iconBg: 'bg-primary-light text-primary',
            progressFill: 'bg-indigo-600',
            badge: 'bg-primary-light text-primary border-border'
        },
        teal: {
            iconBg: 'bg-cyan-50 text-cyan-600',
            progressFill: 'bg-cyan-600',
            badge: 'bg-cyan-50 text-cyan-700 border-cyan-100'
        },
        indigo: {
            iconBg: 'bg-primary-light text-primary',
            progressFill: 'bg-indigo-600',
            badge: 'bg-primary-light text-primary border-border'
        },
        violet: {
            iconBg: 'bg-surface-hover text-text-secondary',
            progressFill: 'bg-slate-600',
            badge: 'bg-surface-hover text-text-primary border-border'
        },
    };
    return themes[color] || themes.blue;
};

interface Course {
    id: string;
    name: string;
    code: string;
    students: number;
    semester: string;
    color: string;
    progress: number;
}

interface Session {
    id: string;
    classsessionid: number | null;
    courseName: string;
    courseCode: string;
    sessionDate: string;
    startTime: string | null;
    endTime: string | null;
    status: string;
    topic: string | null;
    attendanceCount: number;
    totalStudents: number;
}

export default function FacultyAttendancePage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [courses, setCourses] = useState<Course[]>([]);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [profile, setProfile] = useState<any>(null);
    const [notifications, setNotifications] = useState<any[]>([]);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [coursesRes, sessionsRes, dash] = await Promise.all([
                    apiGet<any>('/faculty/courses'),
                    apiGet<any>('/faculty/attendance/sessions').catch(() => []),
                    DashboardAPI.getFacultyDashboard()
                ]);

                setCourses(coursesRes || []);
                setSessions(sessionsRes || []);
                setProfile(dash?.profile || null);
                setNotifications(dash?.notifications || []);
            } catch (err: any) {
                setError(err.message || 'Failed to load attendance dashboard');
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

    // Filter today's sessions vs historical sessions
    const todayStr = new Date().toLocaleDateString('en-CA');
    const todaySessions = sessions.filter(s => {
        const sDate = new Date(s.sessionDate).toLocaleDateString('en-CA');
        return sDate === todayStr;
    });

    const historicalSessions = sessions.filter(s => {
        const sDate = new Date(s.sessionDate).toLocaleDateString('en-CA');
        return sDate !== todayStr;
    });

    const userName = profile?.fullname || profile?.user?.username || 'Faculty';
    const mappedNotifications = notifications.map(n => ({
        id: n.notificationid.toString(),
        title: n.title,
        message: n.message,
        timestamp: new Date(n.createdat),
        read: n.isread,
        type: 'info' as const
    }));

    const AttendanceCourseCard = ({ course }: { course: Course }) => {
        const theme = getTheme(course.color || 'blue');

        return (
            <div className="bg-surface rounded-[2px] p-6 shadow-none border border-border hover:shadow-none hover:border-blue-200 transition-all h-full flex flex-col group">
                <Link href={`/dashboard/faculty/courses/${course.id}?tab=attendance`} className="flex-1">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`px-2.5 py-0.5 rounded-[2px] text-xs font-semibold border ${theme.badge}`}>
                                    {course.code}
                                </span>
                                <span className="text-xs text-text-secondary font-medium flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {course.semester}
                                </span>
                            </div>
                            <h3 className="text-xl font-bold text-text-primary group-hover:text-primary transition-colors line-clamp-1">
                                {course.name}
                            </h3>
                        </div>
                        <div className={`p-3 rounded-[2px] ${theme.iconBg} group-hover:scale-110 transition-transform`}>
                            <BookOpen className="w-6 h-6" />
                        </div>
                    </div>
                </Link>

                <div className="mt-auto pt-6 border-t border-gray-50 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                        <Users className="w-4 h-4" />
                        <span>{course.students} Students</span>
                    </div>
                    <Link href={`/dashboard/faculty/courses/${course.id}?tab=attendance`}>
                        <button className="px-5 py-2 rounded-[2px] bg-gray-900 text-white text-sm font-semibold shadow-none hover:bg-gray-800 hover:translate-y-[-1px] transition-all flex items-center gap-2">
                            Update Attendance
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </Link>
                </div>
            </div>
        );
    };

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
            currentPath="/dashboard/faculty/attendance"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <AdminPageHeader
                    icon={ClipboardList}
                    title="Attendance"
                    titleAccent="Dashboard"
                    subtitle="Manage daily attendance and view recent records"
                    eyebrow={{ icon: Home, label: "Faculty Portal" }}
                />

                {/* Today's Sessions */}
                <section className="mb-10">
                    <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-primary" />
                        Today's Sessions
                    </h2>
                    {todaySessions.length === 0 ? (
                        <p className="text-text-secondary italic bg-background border border-border p-6 rounded-[2px]">No class sessions scheduled for today.</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {todaySessions.map(s => (
                                <div key={s.id} className="bg-surface rounded-[2px] p-6 shadow-none border border-border hover:shadow-none transition-shadow-none relative overflow-hidden group">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <span className="px-2.5 py-0.5 rounded-[2px] text-xs font-semibold bg-primary-light text-primary border border-border mb-2 inline-block">
                                                {s.courseCode}
                                            </span>
                                            <h3 className="text-lg font-bold text-text-primary">{s.courseName}</h3>
                                            <p className="text-sm text-text-secondary">{s.topic || 'Lecture'}</p>
                                        </div>
                                        <div className="p-2 bg-primary-light rounded-[2px] text-primary">
                                            <Clock className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm font-medium text-text-primary mb-6">
                                        <span className="w-2 h-2 rounded-[2px] bg-primary-light0 "></span>
                                        {s.startTime ? new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '09:00 AM'} - {s.endTime ? new Date(s.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '10:30 AM'}
                                    </div>
                                    <Link href={`/dashboard/faculty/attendance/mark/${s.id}`}>
                                        <button className="w-full py-2.5 rounded-[2px] bg-primary text-white font-semibold text-sm hover:bg-primary-hover transition-all shadow-none shadow-blue-200 flex items-center justify-center gap-2 group/btn">
                                            Mark Attendance
                                            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                        </button>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Courses Directory for Attendance */}
                <section className="mb-10">
                    <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-text-muted" />
                        My Courses Directory
                    </h2>
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
                                <AttendanceCourseCard key={course.id} course={course} />
                            ))}
                        </div>
                    )}
                </section>

                {/* Recent History */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-text-muted" />
                            Recent History
                        </h2>
                    </div>
                    <div className="bg-surface rounded-[2px] border border-border shadow-none overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-background/50 border-b border-border">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Course</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Session</th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-text-secondary uppercase tracking-wider">Attendance</th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#EDEBE9]">
                                    {historicalSessions.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-8 text-center text-text-secondary italic">No past sessions found.</td>
                                        </tr>
                                    ) : (
                                        historicalSessions.map((s) => (
                                            <tr key={s.id} className="hover:bg-background/50 transition-colors group">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary font-medium">{new Date(s.sessionDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div>
                                                        <div className="font-semibold text-text-primary">{s.courseName}</div>
                                                        <div className="text-xs text-text-secondary">{s.courseCode}</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{s.topic || 'Lecture'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-[2px] text-xs font-medium bg-primary-light text-primary">
                                                        {s.attendanceCount} / {s.totalStudents}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[2px] text-xs font-semibold ${s.status === 'COMPLETED' ? 'bg-background text-success-text' : 'bg-background text-text-primary'}`}>
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        {s.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <Link href={`/dashboard/faculty/attendance/mark/${s.id}`}>
                                                        <button className="text-sm font-medium text-primary hover:text-blue-800 hover:underline">
                                                            View Details
                                                        </button>
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            </div>
        </DashboardLayout>
    );
}
