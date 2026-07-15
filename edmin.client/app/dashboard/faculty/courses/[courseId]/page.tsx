'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { UserRole, Notification } from '@/types/types';
import { BookOpen, Users, Clock, ArrowRight, Plus, Search, Filter, Home, FileText, ClipboardList, Award, Settings, MoreVertical, Calendar, Upload, Edit2, Eye, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useState, Suspense, useEffect } from 'react';
import { DashboardAPI, FacultyAPI } from '@/utils/api';

// Types
interface Announcement {
    id: number;
    title: string;
    date: string;
    content: string;
    author: string;
}

interface Resource {
    id: number;
    title: string;
    description: string;
    type: string;
}

interface Session {
    id: number;
    date: string;
    type: string;
    status: 'Completed' | 'Pending';
    present: number;
    total: number;
}

function FacultyCourseDetailContent() {
    const params = useParams();
    const searchParams = useSearchParams();
    const courseId = params.courseId as string;
    const initialTab = searchParams.get('tab') || 'overview';
    const [activeTab, setActiveTab] = useState(initialTab);
    const [attendanceView, setAttendanceView] = useState<'session' | 'student'>('session');

    // Modal States
    const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
    const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);

    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [resources, setResources] = useState<Resource[]>([]);
    const [user, setUser] = useState<{ name: string; avatar?: string }>({ name: 'Faculty' });
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [courseData, setCourseData] = useState<any>(null);
    const [assignments, setAssignments] = useState<any[]>([]);
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [dashboardData, coursesData, assignmentsData, quizzesData, sessionsData] = await Promise.all([
                    DashboardAPI.getFacultyDashboard(),
                    FacultyAPI.getCourses(),
                    FacultyAPI.getAssignments(),
                    FacultyAPI.getQuizzes(),
                    FacultyAPI.getAttendanceSessions()
                ]);

                if (dashboardData?.user) {
                    setUser({ name: dashboardData.user.name, avatar: dashboardData.user.avatar });
                }
                
                const matched = coursesData.find((c: any) => c.id.toString() === courseId);
                if (matched) {
                    setCourseData(matched);
                }
                
                setAssignments(assignmentsData.filter((a: any) => a.courseId === (matched?.code || courseId)));
                setQuizzes(quizzesData.filter((q: any) => q.courseId === (matched?.code || courseId)));
                setSessions(sessionsData.filter((s: any) => s.courseCode === (matched?.code || courseId)));
            } catch (err) {
                console.error("Failed to load course data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [courseId]);

    // Form States
    const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '' });
    const [newResource, setNewResource] = useState({ title: '', description: '', type: 'book', fileName: '' });

    // Handlers
    const handleAddAnnouncement = () => {
        if (!newAnnouncement.title || !newAnnouncement.content) return;

        const announcement = {
            id: Date.now(),
            title: newAnnouncement.title,
            content: newAnnouncement.content,
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            author: user.name
        };

        setAnnouncements([announcement, ...announcements]);
        setNewAnnouncement({ title: '', content: '' });
        setIsAnnouncementModalOpen(false);
    };

    const handleAddResource = () => {
        if (!newResource.title || !newResource.description) return;

        const resource = {
            id: Date.now(),
            title: newResource.title,
            description: newResource.description,
            type: newResource.type
        };

        setResources([resource, ...resources]);
        setNewResource({ title: '', description: '', type: 'book', fileName: '' });
        setIsResourceModalOpen(false);
    };



    // Default fallback if not found in list (should ideally handle 404)
    const course = {
        id: courseId,
        name: courseData?.name || 'Computer Science',
        code: courseData?.code || 'CS-101',
        description: courseData?.description || 'Introduction to Computer Science fundamental concepts including algorithms, data structures, and software engineering principles.',
        students: courseData?.students ?? 45,
        assignmentsCount: courseData?.assignmentsCount ?? 0,
        quizzesCount: courseData?.quizzesCount ?? 0,
        semester: courseData?.semester || 'Fall 2025',
        progress: courseData?.progress ?? 75,
        color: courseData?.color || 'from-blue-500 to-blue-600',
    };

    return (
        <DashboardLayout
            userRole={UserRole.FACULTY}
            userName={user.name}
            userAvatar={user.avatar}
            notifications={notifications}
            currentPath={`/dashboard/faculty/courses/${courseId}`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Breadcrumb */}
                <nav className="flex mb-6" aria-label="Breadcrumb">
                    <ol className="flex items-center space-x-2 bg-surface px-3 py-2 rounded-[2px] border border-border ">
                        <li>
                            <Link href="/dashboard/faculty" className="text-text-secondary hover:text-primary transition-colors">
                                <Home className="w-4 h-4" />
                            </Link>
                        </li>
                        <li><span className="text-border-hover">/</span></li>
                        <li>
                            <Link href="/dashboard/faculty/courses" className="text-sm font-medium text-text-secondary hover:text-primary transition-colors">
                                My Courses
                            </Link>
                        </li>
                        <li><span className="text-border-hover">/</span></li>
                        <li><span className="text-sm font-medium text-text-primary">{course.name}</span></li>
                    </ol>
                </nav>

                {/* Course Header */}
                <div className="relative overflow-hidden rounded-[2px] bg-gradient-to-br from-gray-900 to-gray-800  mb-8">
                    <div className={`absolute top-0 right-0 w-full h-full bg-gradient-to-br ${course.color} opacity-20`}></div>
                    <div className="absolute top-0 right-0 w-96 h-96 bg-surface/10 rounded-[2px] blur-3xl -mr-20 -mt-20"></div>

                    <div className="relative z-10 p-8 text-white">
                        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                            <div>
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="px-3 py-1 bg-surface/20  rounded-[2px] text-sm font-semibold border border-white/10">
                                        {course.code}
                                    </span>
                                    <span className="flex items-center gap-1.5 text-white/80 text-sm font-medium bg-black/20 px-3 py-1 rounded-[2px]">
                                        <Clock className="w-4 h-4" />
                                        {course.semester}
                                    </span>
                                </div>
                                <h1 className="text-4xl font-bold mb-4">{course.name}</h1>
                                <p className="text-lg text-white/80 max-w-2xl leading-relaxed">
                                    {course.description}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-8 mt-8 border-t border-white/10 pt-6">
                            <div className="flex items-center gap-3 text-white/90">
                                <div className="p-2 bg-surface/10 rounded-[2px]">
                                    <Users className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xl font-bold">{course.students}</p>
                                    <p className="text-sm text-white/60">Students</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-white/90">
                                <div className="p-2 bg-surface/10 rounded-[2px]">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xl font-bold">{course.assignmentsCount}</p>
                                    <p className="text-sm text-white/60">Assignments</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-white/90">
                                <div className="p-2 bg-surface/10 rounded-[2px]">
                                    <ClipboardList className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xl font-bold">{course.quizzesCount}</p>
                                    <p className="text-sm text-white/60">Quizzes</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs & Content */}
                <div className="space-y-6">
                    {/* Tabs Navigation */}
                    <div className="flex overflow-x-auto border-b border-border pb-1 scrollbar-hide">
                        {['overview', 'announcements', 'resources', 'assignments', 'quizzes', 'attendance', 'grades'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors relative ${activeTab === tab
                                    ? 'text-primary'
                                    : 'text-text-secondary hover:text-text-primary'
                                    }`}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                {activeTab === tab && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"></div>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Content Area */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Overview Tab (Default) */}
                            {activeTab === 'overview' && (
                                <>
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-xl font-bold text-text-primary">Recent Activity</h2>
                                        <button className="text-sm text-primary font-medium hover:text-primary">View All</button>
                                    </div>
                                    <div>
                                        {assignments.slice(0, 3).length > 0 ? (
                                            assignments.slice(0, 3).map((assignment, index, array) => (
                                                <Link href={`/dashboard/faculty/assignments/${assignment.id}?from=${courseId}&courseName=${encodeURIComponent(course.name)}`} key={assignment.id}>
                                                    <div className={`bg-surface p-4 rounded-[2px] border border-border  flex items-start gap-4 hover: transition-shadow cursor-pointer ${index < array.length - 1 ? 'mb-5' : ''}`}>
                                                        <div className="p-2 bg-primary-light text-primary rounded-[2px] flex-shrink-0">
                                                            <ClipboardList className="w-5 h-5" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex justify-between items-start">
                                                                <h3 className="font-semibold text-text-primary">{assignment.title}</h3>
                                                                <span className="text-xs text-text-muted">
                                                                    {new Date(assignment.dueDate) > new Date() ? 'Due Soon' : 'Past Due'}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-text-primary mt-1">
                                                                Due: {assignment.dueDate} - <span className={`${assignment.submissions > 0 ? 'text-success-text' : 'text-orange-500'} font-medium`}>
                                                                    {assignment.submissions} Submissions
                                                                </span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))
                                        ) : (
                                            <div className="text-center py-6 bg-background rounded-[2px] border border-border border-dashed">
                                                <p className="text-text-secondary">No recent assignments found.</p>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            {/* Announcements Tab */}
                            {activeTab === 'announcements' && (
                                <div>
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-xl font-bold text-text-primary">Announcements</h2>
                                        <button
                                            onClick={() => setIsAnnouncementModalOpen(true)}
                                            className="px-4 py-2 bg-primary text-white rounded-[2px] text-sm font-semibold  hover:bg-primary-hover transition-all flex items-center gap-2"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Create Announcement
                                        </button>
                                    </div>
                                    <div className="space-y-4">
                                        {announcements.map((announcement) => (
                                            <div key={announcement.id} className="bg-surface p-5 rounded-[2px] border border-border ">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h3 className="text-lg font-semibold text-text-primary">{announcement.title}</h3>
                                                    <span className="text-xs text-text-secondary bg-background px-2 py-1 rounded-[2px]">{announcement.date}</span>
                                                </div>
                                                <p className="text-text-primary text-sm leading-relaxed mb-3">
                                                    {announcement.content}
                                                </p>
                                                <div className="flex items-center gap-2 text-xs text-text-muted">
                                                    <span>Posted by {announcement.author}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Resources Tab */}
                            {activeTab === 'resources' && (
                                <div>
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-xl font-bold text-text-primary">Resources & Textbooks</h2>
                                        <button
                                            onClick={() => setIsResourceModalOpen(true)}
                                            className="px-4 py-2 bg-primary text-white rounded-[2px] text-sm font-semibold  hover:bg-primary-hover transition-all flex items-center gap-2"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Add Resource
                                        </button>
                                    </div>
                                    <div className="space-y-4">
                                        {resources.map((resource) => (
                                            <div key={resource.id} className="bg-surface p-4 rounded-[2px] border border-border  flex items-start gap-4">
                                                <div className={`h-16 w-12 rounded-[2px] flex items-center justify-center flex-shrink-0 ${resource.type === 'pdf' ? 'bg-error-bg text-rose-500' : 'bg-background text-text-muted'}`}>
                                                    {resource.type === 'pdf' ? <FileText className="w-6 h-6" /> : <BookOpen className="w-6 h-6" />}
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-text-primary">{resource.title}</h3>
                                                    <p className="text-sm text-text-secondary mb-2">{resource.description}</p>
                                                    <button className="text-primary text-sm font-medium hover:underline">View / Download</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Assignments Tab */}
                            {activeTab === 'assignments' && (
                                <div>
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-xl font-bold text-text-primary">Assignments</h2>
                                        <Link href={`/dashboard/faculty/assignments/create?courseId=${courseId}&from=${courseId}&courseName=${encodeURIComponent(course.name)}`}>
                                            <button className="px-4 py-2 bg-primary text-white rounded-[2px] text-sm font-semibold  hover:bg-primary-hover transition-all flex items-center gap-2">
                                                <Plus className="w-4 h-4" />
                                                Create Assignment
                                            </button>
                                        </Link>
                                    </div>
                                    <div className="space-y-4">
                                        {assignments.length > 0 ? (
                                            assignments.map((assignment) => (
                                                <div key={assignment.id} className="bg-primary hover:bg-primary-hover text-white shadow-none transition-colors border-transparent">
                                                    <div className="flex items-start gap-4">
                                                        <div className="p-3 bg-primary-light text-primary rounded-[2px] group-hover:scale-105 transition-transform">
                                                            <ClipboardList className="h-6 w-6" />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-lg text-text-primary group-hover:text-primary transition-colors">
                                                                {assignment.title}
                                                            </h3>
                                                            <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-text-secondary">
                                                                <span className="flex items-center gap-1">
                                                                    <Calendar className="h-3.5 w-3.5" />
                                                                    Due: {assignment.dueDate}
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <Users className="h-3.5 w-3.5" />
                                                                    {assignment.submissions || 0}/{assignment.totalStudents || course.students} Submitted
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3 self-end md:self-center">
                                                        <div className={`px-3 py-1 rounded-[2px] text-xs font-semibold ${assignment.status === 'Active' ? 'bg-primary-light text-primary' : 'bg-surface-hover text-text-primary'
                                                            }`}>
                                                            {assignment.status}
                                                        </div>
                                                        <div className="flex items-center gap-1 border-l border-border pl-3">
                                                            <Link href={`/dashboard/faculty/assignments/${assignment.id}?from=${courseId}&courseName=${encodeURIComponent(course.name)}`}>
                                                                <button className="p-2 text-text-muted hover:text-primary hover:bg-primary-light rounded-[2px] transition-colors" title="View details">
                                                                    <Eye className="h-4 w-4" />
                                                                </button>
                                                            </Link>
                                                            <Link href={`/dashboard/faculty/assignments/${assignment.id}/edit`}>
                                                                <button className="p-2 text-text-muted hover:text-primary hover:bg-primary-light rounded-[2px] transition-colors" title="Edit">
                                                                    <Edit2 className="h-4 w-4" />
                                                                </button>
                                                            </Link>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    // TODO: Open delete confirmation modal
                                                                }}
                                                                className="p-2 text-text-muted hover:text-error-text hover:bg-error-bg rounded-[2px] transition-colors"
                                                                title="Delete"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="bg-surface rounded-[2px] border border-border  p-8 text-center bg-background/50">
                                                <div className="w-12 h-12 bg-surface text-text-muted rounded-[2px] flex items-center justify-center mx-auto mb-3 ">
                                                    <ClipboardList className="h-6 w-6" />
                                                </div>
                                                <h3 className="text-text-primary font-medium">No assignments yet</h3>
                                                <p className="text-sm text-text-secondary mt-1">Create an assignment for this course.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Quizzes Tab */}
                            {activeTab === 'quizzes' && (
                                <div>
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-xl font-bold text-text-primary">Quizzes</h2>
                                        <Link href={`/dashboard/faculty/quizzes/create?courseId=${courseId}&from=${courseId}&courseName=${encodeURIComponent(course.name)}`}>
                                            <button className="px-4 py-2 bg-primary text-white rounded-[2px] text-sm font-semibold  hover:bg-primary-hover transition-all flex items-center gap-2">
                                                <Plus className="w-4 h-4" />
                                                Create Quiz
                                            </button>
                                        </Link>
                                    </div>
                                    <div className="space-y-4">
                                        {quizzes.length > 0 ? (
                                            quizzes.map((quiz) => (
                                                <div key={quiz.id} className="bg-surface border border-warning-text text-warning-text hover:bg-warning-bg hover:text-warning-text transition-colors">
                                                    <div className="flex items-start gap-4">
                                                        <div className="p-3 bg-background text-primary rounded-[2px] group-hover:scale-105 transition-transform">
                                                            <Award className="h-6 w-6" />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-lg text-text-primary group-hover:text-primary transition-colors">
                                                                {quiz.title}
                                                            </h3>
                                                            <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-text-secondary">
                                                                <span className="flex items-center gap-1">
                                                                    <Calendar className="h-3.5 w-3.5" />
                                                                    Due: {quiz.dueDate}
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <Clock className="h-3.5 w-3.5" />
                                                                    {quiz.duration} mins
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <Users className="h-3.5 w-3.5" />
                                                                    {quiz.attempts || 0}/{quiz.totalStudents || course.students} Attempted
                                                                </span>
                                                                <span>
                                                                    {quiz.totalQuestions || 0} Questions • {quiz.totalPoints || quiz.totalMarks} Points
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3 self-end md:self-center">
                                                        <div className={`px-3 py-1 rounded-[2px] text-xs font-semibold ${quiz.status === 'Active' ? 'bg-success-bg text-green-700' :
                                                            quiz.status === 'Scheduled' ? 'bg-primary-light text-primary' :
                                                                quiz.status === 'Completed' ? 'bg-background text-text-primary' :
                                                                    quiz.status === 'Closed' ? 'bg-error-bg text-error-text' :
                                                                        'bg-surface-hover text-text-primary'
                                                            }`}>
                                                            {quiz.status}
                                                        </div>
                                                        <div className="flex items-center gap-1 border-l border-border pl-3">
                                                            <Link href={`/dashboard/faculty/quizzes/${quiz.id}?from=${courseId}&courseName=${encodeURIComponent(course.name)}`}>
                                                                <button className="p-2 text-text-muted hover:text-primary hover:bg-background rounded-[2px] transition-colors" title="View details">
                                                                    <Eye className="h-4 w-4" />
                                                                </button>
                                                            </Link>
                                                            <Link href={`/dashboard/faculty/quizzes/${quiz.id}/edit`}>
                                                                <button className="p-2 text-text-muted hover:text-primary hover:bg-primary-light rounded-[2px] transition-colors" title="Edit">
                                                                    <Edit2 className="h-4 w-4" />
                                                                </button>
                                                            </Link>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    // TODO: Open delete confirmation modal
                                                                }}
                                                                className="p-2 text-text-muted hover:text-error-text hover:bg-error-bg rounded-[2px] transition-colors"
                                                                title="Delete"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="bg-surface rounded-[2px] border border-border  p-8 text-center bg-background/50">
                                                <div className="w-12 h-12 bg-surface text-text-muted rounded-[2px] flex items-center justify-center mx-auto mb-3 ">
                                                    <Award className="h-6 w-6" />
                                                </div>
                                                <h3 className="text-text-primary font-medium">No quizzes yet</h3>
                                                <p className="text-sm text-text-secondary mt-1">Create a quiz for this course.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Attendance Tab (formerly Students) */}
                            {activeTab === 'attendance' && (
                                <div>
                                    <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
                                        <div className="bg-background/80 p-1.5 rounded-[2px] inline-flex border border-border/50">
                                            <button
                                                onClick={() => setAttendanceView('session')}
                                                className={`px-6 py-2.5 rounded-[2px] text-sm font-semibold transition-all flex items-center gap-2.5 ${attendanceView === 'session'
                                                    ? 'bg-surface text-primary  ring-1 ring-gray-200/60'
                                                    : 'text-text-secondary hover:text-text-primary hover:bg-surface/50'
                                                    }`}
                                            >
                                                <Calendar className={`w-4 h-4 ${attendanceView === 'session' ? 'text-primary' : 'text-text-muted'}`} />
                                                Session Wise
                                            </button>
                                            <button
                                                onClick={() => setAttendanceView('student')}
                                                className={`px-6 py-2.5 rounded-[2px] text-sm font-semibold transition-all flex items-center gap-2.5 ${attendanceView === 'student'
                                                    ? 'bg-surface text-primary  ring-1 ring-gray-200/60'
                                                    : 'text-text-secondary hover:text-text-primary hover:bg-surface/50'
                                                    }`}
                                            >
                                                <Users className={`w-4 h-4 ${attendanceView === 'student' ? 'text-primary' : 'text-text-muted'}`} />
                                                Student Wise
                                            </button>
                                        </div>
                                        {attendanceView === 'session' && (
                                            <Link href={`/dashboard/faculty/attendance/create?courseId=${courseId}&from=${courseId}&courseName=${encodeURIComponent(course.name)}`}>
                                                <button className="w-full sm:w-auto px-5 py-2.5 bg-gray-900 text-white rounded-[2px] text-sm font-semibold  shadow-gray-200 hover:bg-gray-800 hover:translate-y-[-1px] transition-all flex items-center justify-center gap-2.5">
                                                    <Plus className="w-4 h-4" />
                                                    Record New Session
                                                </button>
                                            </Link>
                                        )}
                                    </div>

                                    {/* Session Wise View */}
                                    {attendanceView === 'session' && (
                                        <div className="space-y-4">
                                            {sessions.map((session) => (
                                                <Link key={session.id || session.classsessionid} href={`/dashboard/faculty/attendance/mark/${session.id || session.classsessionid}?from=${courseId}&courseName=${encodeURIComponent(course.name)}`} className="block group">
                                                    <div className="bg-primary hover:bg-primary-hover text-white shadow-none transition-colors border-transparent">
                                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                            <div className="flex items-start gap-4">
                                                                <div className="flex flex-col items-center justify-center w-14 h-14 bg-primary-light rounded-[2px] text-primary border border-border">
                                                                    <span className="text-[10px] font-bold uppercase">{new Date(session.sessionDate || session.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                                                                    <span className="text-xl font-bold">{new Date(session.sessionDate || session.date).getDate()}</span>
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <h3 className="font-bold text-text-primary group-hover:text-primary transition-colors">
                                                                            {session.type || session.topic} Session
                                                                        </h3>
                                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${session.status === 'Completed' ? 'bg-primary-light text-primary' : 'bg-surface-hover text-text-primary'
                                                                            }`}>
                                                                            {session.status}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-sm text-text-secondary">{session.total} Students Enrolled</p>
                                                                </div>
                                                            </div>

                                                            {session.status === 'Completed' ? (
                                                                <div className="flex items-center gap-6 md:pr-4">
                                                                    <div className="text-center">
                                                                        <p className="text-xs text-text-secondary mb-0.5">Present</p>
                                                                        <p className="font-bold text-primary">{session.present}</p>
                                                                    </div>
                                                                    <div className="text-center">
                                                                        <p className="text-xs text-text-secondary mb-0.5">Absent</p>
                                                                        <p className="font-bold text-error-text">{session.total - session.present}</p>
                                                                    </div>
                                                                    <div className="text-center pl-6 border-l border-border">
                                                                        <p className="text-xs text-text-secondary mb-0.5">Rate</p>
                                                                        <p className="font-bold text-text-primary">{Math.round((session.present / session.total) * 100)}%</p>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center">
                                                                    <button className="px-4 py-2 bg-gray-900 text-white rounded-[2px] text-sm font-medium group-hover:bg-blue-600 transition-colors">
                                                                        Mark Attendance
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    )}

                                    {/* Student Wise View */}
                                    {attendanceView === 'student' && (
                                        <div className="bg-surface rounded-[2px]  border border-border overflow-hidden">
                                            <div className="overflow-x-auto">
                                                <table className="w-full">
                                                    <thead>
                                                        <tr className="bg-background border-b border-border">
                                                            <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Student</th>
                                                            <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">ID</th>
                                                            <th className="px-6 py-4 text-center text-xs font-semibold text-text-secondary uppercase tracking-wider">Classes</th>
                                                            <th className="px-6 py-4 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">Attendance %</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-[#EDEBE9]">
                                                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
                                                            const percent = Math.floor(Math.random() * (100 - 60) + 60);
                                                            return (
                                                                <tr key={i} className="hover:bg-background/50 transition-colors">
                                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-8 h-8 rounded-[2px] bg-background text-text-primary flex items-center justify-center font-bold text-xs">
                                                                                S{i}
                                                                            </div>
                                                                            <span className="font-medium text-text-primary">Student Name {i}</span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                                                                        202500{i}
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-text-primary">
                                                                        20 / 24
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                                        <div className="flex items-center justify-end gap-2">
                                                                            <div className="w-20 bg-background rounded-[2px] h-1.5 overflow-hidden">
                                                                                <div
                                                                                    className={`h-full rounded-[2px] ${percent >= 90 ? 'bg-primary-light0' : percent >= 75 ? 'bg-primary-light0' : 'bg-error-bg0'}`}
                                                                                    style={{ width: `${percent}%` }}
                                                                                ></div>
                                                                            </div>
                                                                            <span className="text-sm font-bold text-text-primary w-10 text-right">{percent}%</span>
                                                                        </div>
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
                            )}

                            {/* Grades Tab */}
                            {activeTab === 'grades' && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-xl font-bold text-text-primary">Student Grades</h2>
                                        <button className="flex items-center gap-2 px-4 py-2 bg-surface border border-border text-text-primary font-medium rounded-[2px] hover:bg-background  transition-colors">
                                            <FileText className="w-4 h-4" />
                                            Export Report
                                        </button>
                                    </div>

                                    <div className="bg-surface rounded-[2px]  border border-border overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="bg-background/50 border-b border-border">
                                                        <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Student</th>
                                                        <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">ID</th>
                                                        <th className="px-6 py-4 text-center text-xs font-semibold text-text-secondary uppercase tracking-wider">Assignments</th>
                                                        <th className="px-6 py-4 text-center text-xs font-semibold text-text-secondary uppercase tracking-wider">Quizzes</th>
                                                        <th className="px-6 py-4 text-center text-xs font-semibold text-text-secondary uppercase tracking-wider">Midterm</th>
                                                        <th className="px-6 py-4 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">Final Grade</th>
                                                        <th className="px-6 py-4 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-[#EDEBE9]">
                                                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
                                                        const assignmentScore = Math.floor(Math.random() * (100 - 70) + 70);
                                                        const quizScore = Math.floor(Math.random() * (100 - 60) + 60);
                                                        const midtermScore = Math.floor(Math.random() * (100 - 50) + 50);
                                                        const finalGrade = Math.round((assignmentScore * 0.3) + (quizScore * 0.3) + (midtermScore * 0.4));

                                                        let gradeLetter = 'F';
                                                        if (finalGrade >= 90) gradeLetter = 'A';
                                                        else if (finalGrade >= 80) gradeLetter = 'B';
                                                        else if (finalGrade >= 70) gradeLetter = 'C';
                                                        else if (finalGrade >= 60) gradeLetter = 'D';

                                                        return (
                                                            <tr key={i} className="hover:bg-background/50 transition-colors">
                                                                <td className="px-6 py-4">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-8 h-8 rounded-[2px] bg-primary-light text-primary flex items-center justify-center font-bold text-xs">
                                                                            S{i}
                                                                        </div>
                                                                        <span className="font-medium text-text-primary">Student {i}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 text-sm text-text-secondary">202500{i}</td>
                                                                <td className="px-6 py-4 text-center text-sm text-text-primary">{assignmentScore}%</td>
                                                                <td className="px-6 py-4 text-center text-sm text-text-primary">{quizScore}%</td>
                                                                <td className="px-6 py-4 text-center text-sm text-text-primary">{midtermScore}%</td>
                                                                <td className="px-6 py-4 text-right">
                                                                    <div className="flex items-center justify-end gap-3">
                                                                        <span className="font-bold text-text-primary">{finalGrade}%</span>
                                                                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-[2px] text-sm font-bold ${gradeLetter === 'A' ? 'bg-green-100 text-green-700' :
                                                                            gradeLetter === 'B' ? 'bg-primary-light text-primary' :
                                                                                gradeLetter === 'C' ? 'bg-yellow-100 text-yellow-700' :
                                                                                    gradeLetter === 'D' ? 'bg-orange-100 text-orange-700' :
                                                                                        'bg-red-100 text-red-700'
                                                                            }`}>
                                                                            {gradeLetter}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 text-right">
                                                                    <Link
                                                                        href={`/dashboard/faculty/courses/${courseId}/grades/202500${i}`}
                                                                        className="p-2 text-text-muted hover:text-primary hover:bg-primary-light rounded-[2px] transition-colors inline-block"
                                                                        title="Edit Grades"
                                                                    >
                                                                        <Edit2 className="w-4 h-4" />
                                                                    </Link>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Modals */}
                            {isAnnouncementModalOpen && (
                                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 ">
                                    <div className="bg-surface rounded-[2px] w-full max-w-lg p-6  animate-in fade-in zoom-in duration-200">
                                        <h3 className="text-xl font-bold mb-4">Post New Announcement</h3>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-text-primary mb-1">Title</label>
                                                <input
                                                    type="text"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-[2px] focus:ring-2 focus:ring-blue-500 outline-none"
                                                    value={newAnnouncement.title}
                                                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-text-primary mb-1">Content</label>
                                                <textarea
                                                    rows={4}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-[2px] focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                                    value={newAnnouncement.content}
                                                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                                                ></textarea>
                                            </div>
                                            <div className="flex justify-end gap-3 pt-2">
                                                <button
                                                    onClick={() => setIsAnnouncementModalOpen(false)}
                                                    className="px-4 py-2 text-text-primary hover:bg-background rounded-[2px] font-medium"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={handleAddAnnouncement}
                                                    className="px-4 py-2 bg-primary text-white rounded-[2px] font-medium hover:bg-primary-hover"
                                                >
                                                    Post Announcement
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {isResourceModalOpen && (
                                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 ">
                                    <div className="bg-surface rounded-[2px] w-full max-w-lg p-6  animate-in fade-in zoom-in duration-200">
                                        <h3 className="text-xl font-bold mb-4">Add New Resource</h3>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-text-primary mb-1">Title</label>
                                                <input
                                                    type="text"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-[2px] focus:ring-2 focus:ring-blue-500 outline-none"
                                                    value={newResource.title}
                                                    onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-text-primary mb-1">Description</label>
                                                <input
                                                    type="text"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-[2px] focus:ring-2 focus:ring-blue-500 outline-none"
                                                    value={newResource.description}
                                                    onChange={(e) => setNewResource({ ...newResource, description: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-text-primary mb-1">Type</label>
                                                <select
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-[2px] focus:ring-2 focus:ring-blue-500 outline-none"
                                                    value={newResource.type}
                                                    onChange={(e) => setNewResource({ ...newResource, type: e.target.value })}
                                                >
                                                    <option value="book">Textbook</option>
                                                    <option value="pdf">PDF Document</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-text-primary mb-1">Upload File</label>
                                                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-[2px] hover:border-blue-500 transition-colors cursor-pointer bg-background hover:bg-primary-light group">
                                                    <div className="space-y-1 text-center">
                                                        <Upload className="mx-auto h-12 w-12 text-text-muted group-hover:text-blue-500 transition-colors" />
                                                        <div className="flex text-sm text-text-primary justify-center">
                                                            <label htmlFor="file-upload" className="relative cursor-pointer rounded-[2px] font-medium text-primary hover:text-blue-500 focus-within:outline-none">
                                                                <span>Upload a file</span>
                                                                <input
                                                                    id="file-upload"
                                                                    name="file-upload"
                                                                    type="file"
                                                                    className="sr-only"
                                                                    onChange={(e) => {
                                                                        const file = e.target.files?.[0];
                                                                        if (file) {
                                                                            setNewResource({ ...newResource, fileName: file.name });
                                                                        }
                                                                    }}
                                                                />
                                                            </label>
                                                            <p className="pl-1">or drag and drop</p>
                                                        </div>
                                                        <p className="text-xs text-text-secondary">
                                                            {newResource.fileName ? (
                                                                <span className="text-primary font-medium">{newResource.fileName}</span>
                                                            ) : (
                                                                "PDF, DOC, PPT up to 10MB"
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-3 pt-2">
                                                <button
                                                    onClick={() => setIsResourceModalOpen(false)}
                                                    className="px-4 py-2 text-text-primary hover:bg-background rounded-[2px] font-medium"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={handleAddResource}
                                                    className="px-4 py-2 bg-primary text-white rounded-[2px] font-medium hover:bg-primary-hover"
                                                >
                                                    Add Resource
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Sidebar Stats */}

                        </div>{/* End of Main Content Column */}

                        {/* Sidebar */}
                        <div className="space-y-6">
                            <div className="bg-surface p-6 rounded-[2px] border border-border ">
                                <h3 className="font-bold text-text-primary mb-4 flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-text-muted" />
                                    Upcoming Schedule
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex gap-4 items-start pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                                        <div className="flex flex-col items-center min-w-[3rem] bg-background rounded-[2px] p-2">
                                            <span className="text-xs font-bold text-text-secondary uppercase">NOV</span>
                                            <span className="text-xl font-bold text-text-primary">20</span>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-text-primary">Assignment Due</p>
                                            <p className="text-sm text-text-secondary">Cloud comparison paper</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 items-start">
                                        <div className="flex flex-col items-center min-w-[3rem] bg-background rounded-[2px] p-2">
                                            <span className="text-xs font-bold text-text-secondary uppercase">NOV</span>
                                            <span className="text-xl font-bold text-text-primary">22</span>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-text-primary">Lecture: AWS Basics</p>
                                            <p className="text-sm text-text-secondary">10:00 AM - Room 402</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout >
    );
}

export default function FacultyCourseDetailPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-text-secondary">Loading course details...</div>}>
            <FacultyCourseDetailContent />
        </Suspense>
    );
}
