'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { UserRole, Notification } from '@/types/types';
import { Award, Calendar, Clock, Home, ArrowLeft, CheckCircle2, Users, Search, Edit, Eye } from 'lucide-react';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import Modal from '@/components/Modal';
import { FacultyAPI, DashboardAPI } from '@/utils/api';

function QuizViewContent() {
    const params = useParams();
    const searchParams = useSearchParams();

    const quizId = params.quizId as string;
    const from = searchParams.get('from'); // courseId if coming from course page
    const courseName = searchParams.get('courseName'); // course name if coming from course page
    const [searchTerm, setSearchTerm] = useState('');
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<'success' | 'error'>('success');

    const [loading, setLoading] = useState(true);
    const [quiz, setQuiz] = useState<any>(null);
    const [user, setUser] = useState<{ name: string; avatar?: string }>({ name: 'Faculty' });
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [studentAttempts, setStudentAttempts] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [dashboardData, quizzesData] = await Promise.all([
                    DashboardAPI.getFacultyDashboard(),
                    FacultyAPI.getQuizzes()
                ]);

                if (dashboardData?.user) {
                    setUser({ name: dashboardData.user.name, avatar: dashboardData.user.avatar });
                }
                
                const foundQuiz = quizzesData.find((q: any) => q.id === quizId);
                if (foundQuiz) {
                    setQuiz(foundQuiz);
                }
                
                setStudentAttempts([]); // Backend doesn't provide attempts list yet
            } catch (error) {
                console.error('Failed to fetch quiz data:', error);
                setToastMessage('Failed to load quiz data');
                setToastType('error');
                setShowToast(true);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [quizId]);

    const filteredStudents = studentAttempts.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.studentId.includes(searchTerm)
    );

    const attemptCount = studentAttempts.filter(s => s.attempted).length;
    const totalStudents = studentAttempts.length;

    useEffect(() => {
        if (showToast) {
            const timer = setTimeout(() => {
                setShowToast(false);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [showToast]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-[2px] animate-spin"></div>
            </div>
        );
    }

    if (!quiz) {
        return (
            <DashboardLayout
                userRole={UserRole.FACULTY}
                userName={user.name}
                userAvatar={user.avatar}
                notifications={notifications}
                currentPath={`/dashboard/faculty/quizzes/${quizId}`}
            >
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <p className="text-red-500">Quiz not found.</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            userRole={UserRole.FACULTY}
            userName={user.name}
            userAvatar={user.avatar}
            notifications={notifications}
            currentPath={`/dashboard/faculty/quizzes/${quizId}`}
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
                                    <Link href="/dashboard/faculty/quizzes" className="text-sm font-medium text-text-secondary hover:text-primary transition-colors">
                                        Quizzes
                                    </Link>
                                </li>
                                <li><span className="text-border-hover">/</span></li>
                            </>
                        )}
                        <li><span className="text-sm font-medium text-text-primary">View Quiz</span></li>
                    </ol>
                </nav>

                <div className="flex items-start justify-between mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Link
                                href={from ? `/dashboard/faculty/courses/${from}?tab=quizzes` : '/dashboard/faculty/quizzes'}
                                className="p-1 rounded-[2px] text-text-muted hover:bg-background hover:text-text-primary transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                            <h1 className="text-3xl font-bold text-text-primary">{quiz.title}</h1>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-text-secondary ml-9">
                            <Award className="w-4 h-4" />
                            <span className="font-medium">{quiz.courseName || quiz.course} ({quiz.courseId || quiz.code})</span>
                        </div>
                    </div>
                    <Link href={`/dashboard/faculty/quizzes/${quizId}/edit`}>
                        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-[2px] text-sm font-semibold  hover:bg-primary-hover transition-all">
                            <Edit className="w-4 h-4" />
                            Edit Quiz
                        </button>
                    </Link>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Quiz Details Card */}
                        <div className="bg-surface rounded-[2px]  border border-border p-6">
                            <h2 className="text-xl font-bold text-text-primary mb-4">Quiz Details</h2>
                            <div className="prose max-w-none text-text-primary">
                                <p>{quiz.description || 'No description provided.'}</p>
                            </div>
                        </div>

                        {/* Student Attempts */}
                        <div className="bg-surface rounded-[2px]  border border-border p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-text-primary">Student Attempts</h2>
                                    <p className="text-sm text-text-secondary mt-1">{attemptCount} of {totalStudents} students attempted</p>
                                </div>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                                    <input
                                        type="text"
                                        placeholder="Search students..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-9 pr-4 py-2 border border-border rounded-[2px] text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-background border-b border-border">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Student</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Attempted On</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Score</th>
                                            <th className="px-6 py-4 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#EDEBE9] text-sm">
                                        {filteredStudents.length > 0 ? (
                                            filteredStudents.map((student) => (
                                                <tr key={student.id} className="hover:bg-background/50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div>
                                                            <div className="font-medium text-text-primary">{student.name}</div>
                                                            <div className="text-xs text-text-secondary">{student.studentId}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-[2px] text-xs font-medium ${student.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                                            'bg-background text-text-primary'
                                                            }`}>
                                                            {student.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-text-primary">
                                                        {student.attemptDate ? new Date(student.attemptDate).toLocaleString() : '-'}
                                                    </td>
                                                    <td className="px-6 py-4 font-medium text-text-primary">
                                                        {student.score !== null ? `${student.score}/${quiz.totalMarks || quiz.totalPoints}` : '-'}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        {student.attempted ? (
                                                            <Link href={`/dashboard/faculty/quizzes/${quizId}/attempts/${student.id}`}>
                                                                <button className="text-primary hover:text-purple-700 font-medium text-sm">
                                                                    View Attempt
                                                                </button>
                                                            </Link>
                                                        ) : (
                                                            <span className="text-text-muted text-sm">-</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-8 text-center text-text-secondary">
                                                    No students found matching your search.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Status Card */}
                        <div className="bg-surface rounded-[2px]  border border-border p-6">
                            <h3 className="font-semibold text-text-primary mb-4">Quiz Information</h3>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm text-text-secondary mb-1">Due Date</p>
                                    <div className="flex items-center gap-2 text-text-primary font-medium">
                                        <Calendar className="w-4 h-4 text-purple-500" />
                                        <span>{quiz.dueDate || '-'}</span>
                                    </div>
                                </div>
                                <hr className="border-border" />
                                <div>
                                    <p className="text-sm text-text-secondary mb-1">Duration</p>
                                    <div className="flex items-center gap-2 text-text-primary font-medium">
                                        <Clock className="w-4 h-4 text-purple-500" />
                                        <span>{quiz.duration} minutes</span>
                                    </div>
                                </div>
                                <hr className="border-border" />
                                <div>
                                    <p className="text-sm text-text-secondary mb-1">Total Questions</p>
                                    <div className="flex items-center gap-2 text-text-primary font-medium">
                                        <Award className="w-4 h-4 text-purple-500" />
                                        <span>{quiz.totalQuestions || '-'} questions</span>
                                    </div>
                                </div>
                                <hr className="border-border" />
                                <div>
                                    <p className="text-sm text-text-secondary mb-1">Total Points</p>
                                    <div className="flex items-center gap-2 text-text-primary font-medium">
                                        <CheckCircle2 className="w-4 h-4 text-purple-500" />
                                        <span>{quiz.totalMarks || quiz.totalPoints} points</span>
                                    </div>
                                </div>
                                <hr className="border-border" />
                                <div>
                                    <p className="text-sm text-text-secondary mb-1">Attempts</p>
                                    <div className="flex items-center gap-2 text-text-primary font-medium">
                                        <Users className="w-4 h-4 text-purple-500" />
                                        <span>{quiz.totalAttempts || quiz.attempts}/{quiz.totalStudents || '-'}</span>
                                    </div>
                                </div>
                                <hr className="border-border" />
                                <div>
                                    <p className="text-sm text-text-secondary mb-1">Status</p>
                                    <span className={`inline-flex px-3 py-1 rounded-[2px] text-xs font-semibold ${quiz.status === 'Active' ? 'bg-success-bg text-green-700' :
                                        quiz.status === 'Scheduled' ? 'bg-primary-light text-primary' :
                                            quiz.status === 'Completed' ? 'bg-background text-text-primary' :
                                                quiz.status === 'Closed' ? 'bg-error-bg text-error-text' :
                                                    'bg-surface-hover text-text-primary'
                                        }`}>
                                        {quiz.status}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Settings Card */}
                        <div className="bg-surface rounded-[2px]  border border-border p-6">
                            <h3 className="font-semibold text-text-primary mb-4">Settings</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-text-primary">Multiple Attempts</span>
                                    <span className="font-medium text-text-primary">{quiz.allowMultipleAttempts ? 'Yes' : 'No'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-text-primary">Passing Score</span>
                                    <span className="font-medium text-text-primary">{quiz.passingScore}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Toast Notification */}
                {showToast && (
                    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-5">
                        <div className={`px-6 py-4 rounded-[2px]  border ${toastType === 'success'
                            ? 'bg-success-bg border-green-200 text-green-800'
                            : 'bg-error-bg border-red-200 text-red-800'
                            }`}>
                            <div className="flex items-center gap-3">
                                {toastType === 'success' ? (
                                    <CheckCircle2 className="w-5 h-5" />
                                ) : (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                )}
                                <p className="font-medium">{toastMessage}</p>
                                <button
                                    onClick={() => setShowToast(false)}
                                    className="ml-4 text-text-muted hover:text-text-primary"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

export default function QuizViewPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-[2px] animate-spin"></div>
            </div>
        }>
            <QuizViewContent />
        </Suspense>
    );
}
