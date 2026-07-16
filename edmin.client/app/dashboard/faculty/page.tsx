'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { BookOpen, Users, FileText, TrendingUp, Clock, Award, ArrowRight, Calendar, BarChart, CheckCircle2, Star, AlertCircle, Loader2, PlusCircle, CheckCircle } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PersonalLeaveWidget from '@/components/PersonalLeaveWidget';
import { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import { DashboardAPI } from '@/utils/api';
import { BackendCourse, BackendAssignment, BackendQuiz, BackendNotification } from '@/types/types';
import AdminPageHeader from '@/components/admin/AdminPageHeader';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';

const getTheme = (index: number) => {
    const colors = ['blue', 'indigo', 'rose', 'sky'];
    const color = colors[index % colors.length];
    
    const themes: Record<string, any> = {
        blue: {
            iconBg: 'bg-primary-light text-primary',
            badge: 'bg-primary-light text-primary border-border'
        },
        indigo: {
            iconBg: 'bg-primary-light text-primary',
            badge: 'bg-primary-light text-primary border-border'
        },
        rose: {
            iconBg: 'bg-error-bg text-error-text',
            badge: 'bg-error-bg text-error-text border-border'
        },
        sky: {
            iconBg: 'bg-primary-light text-primary',
            badge: 'bg-primary-light text-primary border-border'
        }
    };
    return themes[color] || themes.blue;
};

export default function FacultyDashboard() {
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [courses, setCourses] = useState<BackendCourse[]>([]);
    const [assignments, setAssignments] = useState<BackendAssignment[]>([]);
    const [quizzes, setQuizzes] = useState<BackendQuiz[]>([]);
    const [notifications, setNotifications] = useState<BackendNotification[]>([]);
    const [recentLeaves, setRecentLeaves] = useState<any[]>([]);
    const [profile, setProfile] = useState<any>(null);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await DashboardAPI.getFacultyDashboard();
                if (response) {
                    setCourses(response.courses || []);
                    setAssignments(response.assignments || []);
                    setQuizzes(response.quizzes || []);
                    setNotifications(response.notifications || []);
                    setProfile(response.profile || null);
                    setRecentLeaves(response.recentLeaves || []);

                    // Redirect based on subRole
                    if (response.profile?.subRole === 'HOD') {
                        router.push('/dashboard/faculty/hod');
                        return; // Prevent further rendering
                    } else if (response.profile?.subRole === 'SUPERVISOR') {
                        router.push('/dashboard/faculty/supervisor');
                        return; // Prevent further rendering
                    }
                }
            } catch (err: any) {
                setError(err.message || 'Failed to load dashboard data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <DashboardLayout userName="Loading..." userRole={'faculty' as any} notifications={[]}>
                <div className="flex justify-center items-center h-[60vh]">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout userName="Error" userRole={'faculty' as any} notifications={[]}>
                <div className="bg-error-bg text-error-text p-3 border border-border flex items-center gap-2 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                </div>
            </DashboardLayout>
        );
    }

    const mappedNotifications = notifications.map(n => ({
        id: n.notificationid.toString(),
        title: n.title,
        message: n.message,
        timestamp: new Date(n.createdat),
        read: n.isread,
        type: 'info' as const
    }));

    return (
        <DashboardLayout 
            userName={profile?.fullname || 'Faculty Member'}
            userRole={'faculty' as any}
            userAvatar={profile?.avatar || undefined}
            notifications={mappedNotifications}
        >
            <div className="max-w-7xl mx-auto space-y-4 p-4">
                {/* Page Header */}
                <AdminPageHeader
                    icon={BookOpen}
                    title="Welcome back,"
                    titleAccent={profile?.fullname?.split(' ')[0] || 'Professor'}
                    subtitle={`You are teaching ${courses.length} course${courses.length !== 1 ? 's' : ''} this semester.`}
                />

                {/* KPI Strip */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-surface border border-border p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-text-secondary uppercase tracking-wide font-semibold">Active Courses</span>
                            <BookOpen className="w-4 h-4 text-primary" strokeWidth={1.5} />
                        </div>
                        <div className="text-2xl font-semibold text-text-primary">{courses.length}</div>
                        <div className="text-[11px] text-success-text mt-1">Current Semester</div>
                    </div>
                    <div className="bg-surface border border-border p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-text-secondary uppercase tracking-wide font-semibold">Assignments</span>
                            <FileText className="w-4 h-4 text-primary" strokeWidth={1.5} />
                        </div>
                        <div className="text-2xl font-semibold text-text-primary">{assignments.length}</div>
                    </div>
                    <div className="bg-surface border border-border p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-text-secondary uppercase tracking-wide font-semibold">Quizzes</span>
                            <Award className="w-4 h-4 text-primary" strokeWidth={1.5} />
                        </div>
                        <div className="text-2xl font-semibold text-text-primary">{quizzes.length}</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 space-y-4">
                        {/* My Courses */}
                        <section>
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-sm font-semibold text-text-primary">My Classes</h2>
                                <button 
                                    onClick={() => setIsCreateModalOpen(true)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-colors rounded-[2px]"
                                >
                                    <FileText className="w-3.5 h-3.5" strokeWidth={1.5} />
                                    Create Assignment
                                </button>
                            </div>
                            
                            {courses.length === 0 ? (
                                <div className="bg-surface p-8 border border-border text-center">
                                    <p className="text-sm text-text-secondary">You are not assigned to any courses yet.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3">
                                    {courses.map((course, index) => {
                                        const theme = {
                                            badge: 'bg-primary-light text-primary border-primary-light'
                                        };
                                        return (
                                            <div key={course.courseid} className="bg-surface border border-border hover:border-primary transition-colors flex flex-col">
                                                <div className="flex justify-between items-start p-4 flex-1">
                                                    <div>
                                                        <span className={`px-2 py-0.5 text-[10px] font-semibold border ${theme.badge} rounded-[2px] mb-1.5 inline-block`}>
                                                            {course.code}
                                                        </span>
                                                        <h3 className="text-sm font-semibold text-text-primary line-clamp-1">
                                                            {course.name}
                                                        </h3>
                                                    </div>
                                                    <Users className="w-4 h-4 text-primary flex-shrink-0 mt-1" strokeWidth={1.5} />
                                                </div>

                                                <Link 
                                                    href={`/dashboard/faculty/courses/${course.courseid}`}
                                                    className="block w-full text-center text-xs font-semibold text-primary hover:bg-primary-light py-2.5 border-t border-border transition-colors mt-auto"
                                                >
                                                    Manage Course
                                                </Link>
                                            </div>
                                        );
                                    })}
                                    <button
                                        onClick={() => setIsCreateModalOpen(true)}
                                        className="bg-surface-hover border border-dashed border-border hover:border-primary hover:bg-primary-light transition-colors flex flex-col items-center justify-center p-4 min-h-[120px] rounded-[2px]"
                                    >
                                        <PlusCircle className="w-6 h-6 text-primary mb-2" strokeWidth={1.5} />
                                        <span className="text-sm font-semibold text-text-primary">Create Content</span>
                                        <span className="text-xs text-text-secondary mt-0.5">Assignment or Quiz</span>
                                    </button>
                                </div>
                            )}
                        </section>

                        {/* Dynamic Upcoming Deadlines & Tasks */}
                        <div className="bg-surface border border-border">
                            <div className="px-5 py-3 border-b border-border bg-surface-hover flex items-center gap-2">
                                <Clock className="w-4 h-4 text-primary" strokeWidth={1.5} />
                                <h2 className="text-sm font-semibold text-text-primary">Upcoming Deadlines & Tasks</h2>
                            </div>
                            <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {(() => {
                                    const upcomingTasks = assignments
                                        .filter(a => new Date(a.duedate) > new Date())
                                        .sort((a, b) => new Date(a.duedate).getTime() - new Date(b.duedate).getTime())
                                        .slice(0, 3)
                                        .map(a => {
                                            const daysUntilDue = Math.ceil((new Date(a.duedate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                                            return {
                                                id: a.assignmentid,
                                                title: `Grade ${a.title}`,
                                                courseCode: a.courseCode || 'Course',
                                                days: daysUntilDue
                                            };
                                        });

                                    if (upcomingTasks.length === 0) {
                                        return (
                                            <div className="col-span-1 sm:col-span-3 text-center py-4 text-text-secondary text-sm">
                                                No upcoming deadlines
                                            </div>
                                        );
                                    }

                                    return upcomingTasks.map((task, idx) => (
                                        <div key={task.id || idx} className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-full bg-warning-bg flex items-center justify-center flex-shrink-0">
                                                <FileText className="w-4 h-4 text-warning-text" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-semibold text-text-primary">{task.title}</h4>
                                                <p className="text-[11px] text-text-secondary mt-0.5">{task.courseCode} • Due in {task.days} days</p>
                                            </div>
                                        </div>
                                    ));
                                })()}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* Personal Leave Widget */}
                        <PersonalLeaveWidget />
                        
                        {/* Recent Leave Requests to balance column height */}
                        <div className="bg-surface border border-border overflow-hidden">
                            <div className="px-4 py-3 border-b border-border bg-surface-hover">
                                <h3 className="text-sm font-semibold text-text-primary">Recent Leave Requests</h3>
                            </div>
                            <div className="divide-y divide-border">
                                {recentLeaves.length === 0 ? (
                                    <div className="p-4 text-center text-sm text-text-secondary">
                                        No recent leave requests
                                    </div>
                                ) : (
                                    recentLeaves.map((leave, index) => {
                                        const startDate = new Date(leave.startdate).toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
                                        const endDate = new Date(leave.enddate).toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
                                        const isApproved = leave.status === 'APPROVED';
                                        
                                        let statusColor = 'bg-surface-hover text-text-muted';
                                        if (leave.status === 'APPROVED') statusColor = 'bg-success-bg text-success-text';
                                        if (leave.status === 'PENDING') statusColor = 'bg-warning-bg text-warning-text';
                                        if (leave.status === 'REJECTED') statusColor = 'bg-error-bg text-error-text';
                                        
                                        // e.g. "SICK" -> "Sick Leave", "CASUAL" -> "Casual Leave", etc.
                                        const typeName = leave.leavetype 
                                            ? leave.leavetype.charAt(0) + leave.leavetype.slice(1).toLowerCase() + ' Leave'
                                            : 'Leave';

                                        return (
                                            <div key={leave.leaverequestid || index} className="p-3">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="text-sm font-medium text-text-primary">{typeName}</p>
                                                        <p className="text-xs text-text-secondary mt-0.5">{startDate} - {endDate}</p>
                                                    </div>
                                                    <span className={`px-2 py-0.5 ${statusColor} text-[10px] font-semibold rounded-[2px] capitalize`}>
                                                        {leave.status?.toLowerCase() || 'pending'}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                            <div className="px-4 py-2 border-t border-border bg-surface-hover text-center">
                                <Link href="/dashboard/faculty/leave" className="text-xs font-semibold text-primary hover:underline">View All Requests</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Create New Content"
            >
                <div className="space-y-3">
                    <p className="text-xs text-text-secondary">
                        What would you like to create? Select an option below.
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                        <button 
                            onClick={() => router.push('/dashboard/faculty/assignments/create')}
                            className="flex items-center p-3.5 border border-border hover:border-primary hover:bg-primary-light transition-colors text-left group rounded-[2px]"
                        >
                            <FileText className="w-4 h-4 text-primary mr-3 flex-shrink-0" strokeWidth={1.5} />
                            <div>
                                <h4 className="text-xs font-semibold text-text-primary group-hover:text-primary transition-colors">Assignment</h4>
                                <p className="text-[10px] text-text-muted mt-0.5">Create a new assignment for your students.</p>
                            </div>
                        </button>
                        <button 
                            onClick={() => router.push('/dashboard/faculty/quizzes/create')}
                            className="flex items-center p-3.5 border border-border hover:border-primary hover:bg-primary-light transition-colors text-left group rounded-[2px]"
                        >
                            <Award className="w-4 h-4 text-primary mr-3 flex-shrink-0" strokeWidth={1.5} />
                            <div>
                                <h4 className="text-xs font-semibold text-text-primary group-hover:text-primary transition-colors">Quiz</h4>
                                <p className="text-[10px] text-text-muted mt-0.5">Design a new quiz with multiple question types.</p>
                            </div>
                        </button>
                    </div>
                </div>
            </Modal>
        </DashboardLayout>
    );
}

