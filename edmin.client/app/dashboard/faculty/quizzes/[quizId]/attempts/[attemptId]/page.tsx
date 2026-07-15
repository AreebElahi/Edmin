'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { UserRole, Notification } from '@/types/types';
import { Home, ArrowLeft, Clock, Award, CheckCircle2, XCircle, User } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { FacultyAPI, DashboardAPI } from '@/utils/api';

export default function ViewAttemptPage() {
    const params = useParams();
    const quizId = params.quizId as string;
    const attemptId = params.attemptId as string;

    const [loading, setLoading] = useState(true);
    const [quiz, setQuiz] = useState<any>(null);
    const [user, setUser] = useState<{ name: string; avatar?: string }>({ name: 'Faculty' });
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [studentAttempt, setStudentAttempt] = useState<any>(null);

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
                
                // Backend does not provide specific attempt details yet
                setStudentAttempt(null);
            } catch (error) {
                console.error('Failed to fetch attempt data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [quizId, attemptId]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-[2px] animate-spin"></div>
            </div>
        );
    }

    if (!quiz || !studentAttempt) {
        return (
            <DashboardLayout
                userRole={UserRole.FACULTY}
                userName={user.name}
                userAvatar={user.avatar}
                notifications={notifications}
                currentPath={`/dashboard/faculty/quizzes/${quizId}/attempts/${attemptId}`}
            >
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <div className="flex items-center gap-3 mb-6">
                        <Link
                            href={`/dashboard/faculty/quizzes/${quizId}`}
                            className="p-1 rounded-[2px] text-text-muted hover:bg-background hover:text-text-primary transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <h1 className="text-2xl font-bold text-text-primary">Back to Quiz</h1>
                    </div>
                    <p className="text-red-500 font-medium">Attempt details are not available from the backend yet.</p>
                </div>
            </DashboardLayout>
        );
    }

    // Since we don't have attempt data, the rest of the UI is essentially unreachable,
    // but we can leave a skeleton for when the backend is ready.
    return (
        <DashboardLayout
            userRole={UserRole.FACULTY}
            userName={user.name}
            userAvatar={user.avatar}
            notifications={notifications}
            currentPath={`/dashboard/faculty/quizzes/${quizId}/attempts/${attemptId}`}
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
                            <Link href="/dashboard/faculty/quizzes" className="text-sm font-medium text-text-secondary hover:text-primary transition-colors">
                                Quizzes
                            </Link>
                        </li>
                        <li><span className="text-border-hover">/</span></li>
                        <li>
                            <Link href={`/dashboard/faculty/quizzes/${quizId}`} className="text-sm font-medium text-text-secondary hover:text-primary transition-colors">
                                {quiz.title}
                            </Link>
                        </li>
                        <li><span className="text-border-hover">/</span></li>
                        <li><span className="text-sm font-medium text-text-primary">Attempt Details</span></li>
                    </ol>
                </nav>

                <div className="flex items-start justify-between mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Link
                                href={`/dashboard/faculty/quizzes/${quizId}`}
                                className="p-1 rounded-[2px] text-text-muted hover:bg-background hover:text-text-primary transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                            <h1 className="text-3xl font-bold text-text-primary">Quiz Attempt Review</h1>
                        </div>
                        <p className="text-text-secondary ml-9">{quiz.title}</p>
                    </div>
                </div>

                <div className="bg-surface rounded-[2px] border border-border p-6">
                    <p className="text-text-secondary">Attempt details would render here when the backend API is connected.</p>
                </div>
            </div>
        </DashboardLayout>
    );
}
