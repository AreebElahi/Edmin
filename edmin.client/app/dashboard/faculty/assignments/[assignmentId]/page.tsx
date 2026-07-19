'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { UserRole } from '@/types/types';
import { FileText, Calendar, BookOpen, Edit, Home, ArrowLeft, CheckCircle2, Users, Download } from 'lucide-react';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { DashboardAPI } from '@/utils/api';
import { apiGet } from '@/api/apiContract';

function AssignmentViewContent() {
    const params = useParams();
    const searchParams = useSearchParams();

    const assignmentId = params.assignmentId;
    const from = searchParams.get('from'); // courseId if coming from course page
    const courseName = searchParams.get('courseName'); // course name if coming from course page
    
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [assignment, setAssignment] = useState<any>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [dash, assignmentsRes] = await Promise.all([
                    DashboardAPI.getFacultyDashboard(),
                    apiGet('/faculty/assignments')
                ]);
                setProfile(dash.profile);
                const allAssignments = Array.isArray(assignmentsRes) ? assignmentsRes : (assignmentsRes as any)?.data || [];
                const found = allAssignments.find((a: any) => a.id === assignmentId);
                if (found) {
                    setAssignment(found);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [assignmentId]);

    if (loading) {
        return (
            <DashboardLayout userName="Loading..." userRole={UserRole.FACULTY} notifications={[]} currentPath={`/dashboard/faculty/assignments/${assignmentId}`}>
                <div className="flex justify-center items-center h-[60vh]">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-[2px] animate-spin"></div>
                </div>
            </DashboardLayout>
        );
    }
    
    if (!assignment) {
        return (
            <DashboardLayout userName={profile?.fullname || 'Faculty'} userRole={UserRole.FACULTY} notifications={[]} currentPath={`/dashboard/faculty/assignments/${assignmentId}`}>
                <div className="flex justify-center items-center h-[60vh]">
                    <p className="text-text-secondary">Assignment not found</p>
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
            currentPath={`/dashboard/faculty/assignments/${assignmentId}`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Breadcrumb */}
                <nav className="flex mb-6" aria-label="Breadcrumb">
                    <ol className="flex items-center space-x-2 bg-surface px-3 py-2 rounded-[2px] border border-border text-sm">
                        <li>
                            <Link href="/dashboard/faculty" className="text-text-secondary hover:text-primary transition-colors">
                                <Home className="w-4 h-4" />
                            </Link>
                        </li>
                        <li><span className="text-border-hover">/</span></li>
                        {from ? (
                            <>
                                <li>
                                    <Link href="/dashboard/faculty/courses" className="text-sm font-medium text-text-secondary hover:text-primary transition-colors">
                                        My Courses
                                    </Link>
                                </li>
                                <li><span className="text-border-hover">/</span></li>
                                <li>
                                    <Link href={`/dashboard/faculty/courses/${from}`} className="text-sm font-medium text-text-secondary hover:text-primary transition-colors">
                                        {courseName || 'Course'}
                                    </Link>
                                </li>
                                <li><span className="text-border-hover">/</span></li>
                            </>
                        ) : (
                            <>
                                <li>
                                    <Link href="/dashboard/faculty/assignments" className="text-sm font-medium text-text-secondary hover:text-primary transition-colors">
                                        Assignments
                                    </Link>
                                </li>
                                <li><span className="text-border-hover">/</span></li>
                            </>
                        )}
                        <li><span className="text-sm font-medium text-text-primary">{assignment.title}</span></li>
                    </ol>
                </nav>

                <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Link
                                href={from ? `/dashboard/faculty/courses/${from}?tab=assignments` : '/dashboard/faculty/assignments'}
                                className="p-1 rounded-[2px] text-text-muted hover:bg-background hover:text-text-primary transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                            <h1 className="text-3xl font-bold text-text-primary">{assignment.title}</h1>
                        </div>
                        <div className="flex items-center gap-2 text-text-secondary ml-9">
                            <BookOpen className="w-4 h-4" />
                            <span>{assignment.courseName}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href={`/dashboard/faculty/assignments/${assignmentId}/submissions${from ? `?from=${from}&courseName=${encodeURIComponent(courseName || '')}` : ''}`}>
                            <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-[2px] hover:bg-primary-hover transition-colors font-semibold shadow-none text-sm">
                                <Users className="w-4 h-4" />
                                View Submissions
                            </button>
                        </Link>
                        <Link href={`/dashboard/faculty/assignments/${assignmentId}/edit`}>
                            <button className="flex items-center gap-2 px-5 py-2.5 bg-surface border border-border text-text-primary rounded-[2px] hover:bg-background transition-colors font-semibold text-sm">
                                <Edit className="w-4 h-4" />
                                Edit Assignment
                            </button>
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Description */}
                        <div className="bg-surface rounded-[2px] border border-border p-6 md:p-8">
                            <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2 mb-4">
                                <FileText className="h-5 w-5 text-blue-500" />
                                Description
                            </h2>
                            <p className="text-text-primary leading-relaxed whitespace-pre-wrap text-sm">
                                {assignment.description || 'No description provided.'}
                            </p>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Status Card */}
                        <div className="bg-surface rounded-[2px] border border-border p-6">
                            <h3 className="font-semibold text-text-primary mb-4">Assignment Details</h3>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm text-text-secondary mb-1">Due Date</p>
                                    <div className="flex items-center gap-2 text-text-primary font-medium text-sm">
                                        <Calendar className="w-4 h-4 text-indigo-500" />
                                        <span>{assignment.dueDate || 'No Due Date'}</span>
                                    </div>
                                </div>
                                <hr className="border-border" />
                                <div>
                                    <p className="text-sm text-text-secondary mb-1">Points Possible</p>
                                    <p className="text-2xl font-bold text-text-primary">{assignment.points || 100}</p>
                                </div>
                                <hr className="border-border" />
                                <div>
                                    <p className="text-sm text-text-secondary mb-1">Submission Progress</p>
                                    <div className="flex items-center justify-between text-sm text-text-primary font-semibold mb-2">
                                        <span>Submissions Received</span>
                                        <span>{assignment.submissions || 0} / {assignment.totalStudents || 0}</span>
                                    </div>
                                    <div className="w-full bg-background rounded-full h-2 overflow-hidden border border-border">
                                        <div 
                                            className="bg-primary h-full rounded-full transition-all duration-500"
                                            style={{ 
                                                width: `${assignment.totalStudents ? ((assignment.submissions || 0) / assignment.totalStudents) * 100 : 0}%` 
                                            }}
                                        />
                                    </div>
                                    {assignment.gradedSubmissions !== undefined && assignment.gradedSubmissions >= 0 && (
                                        <div className="flex items-center justify-between text-xs text-text-secondary mt-3">
                                            <span>Graded Submissions</span>
                                            <span>{assignment.gradedSubmissions} / {assignment.submissions || 0}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Attachments Sidebar Widget */}
                        <div className="bg-surface rounded-[2px] border border-border p-6">
                            <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                                <Download className="h-4 w-4 text-sky-500" />
                                Attachments
                            </h3>
                            <p className="text-xs text-text-secondary">No attachments uploaded for this assignment.</p>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

export default function AssignmentViewPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-[2px] animate-spin"></div>
            </div>
        }>
            <AssignmentViewContent />
        </Suspense>
    );
}
