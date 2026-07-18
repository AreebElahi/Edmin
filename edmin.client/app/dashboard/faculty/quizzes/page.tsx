'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { UserRole, Notification } from '@/types/types';
import { Award, Plus, Search, Filter, Home, CheckCircle2, MoreVertical, Edit2, Trash2, Eye, Calendar, Clock, BookOpen, AlertCircle, Sparkles, ClipboardList, Play, Edit, Globe, Users } from 'lucide-react';
import Link from 'next/link';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminFilterBar from '@/components/admin/AdminFilterBar';
import { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import { DashboardAPI, FacultyAPI } from '@/utils/api';
import { apiGet, apiPut } from '@/api/apiContract';

export default function FacultyQuizzesPage() {
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [showComingSoon, setShowComingSoon] = useState(false);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, quizId: null as string | null });
    const [publishModal, setPublishModal] = useState({ isOpen: false, quizId: null as string | null, error: '' });
    const [isPublishing, setIsPublishing] = useState(false);
    
    // Filtering state
    const [allQuizzes, setAllQuizzes] = useState<any[]>([]);
    const [courses, setCourses] = useState<any[]>([]);
    const [searchValue, setSearchValue] = useState('');
    const [selectedCourseId, setSelectedCourseId] = useState<string>('all');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [dash, quizzesRes, coursesRes] = await Promise.all([
                    DashboardAPI.getFacultyDashboard(),
                    apiGet('/faculty/quizzes'),
                    FacultyAPI.getCourses()
                ]);
                setProfile(dash.profile);
                
                const fetchedCourses = Array.isArray(coursesRes) ? coursesRes : ((coursesRes as any)?.data || []);
                setCourses(fetchedCourses);

                const fetchedQuizzes = Array.isArray(quizzesRes) ? quizzesRes : ((quizzesRes as any)?.data || []);
                setAllQuizzes(fetchedQuizzes);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        let filtered = allQuizzes;

        if (searchValue) {
            filtered = filtered.filter(q => q.title?.toLowerCase().includes(searchValue.toLowerCase()));
        }

        if (selectedCourseId !== 'all') {
            filtered = filtered.filter(q => 
                q.courseofferingid?.toString() === selectedCourseId ||
                q.courseOfferingId?.toString() === selectedCourseId ||
                q.courseid?.toString() === selectedCourseId ||
                q.courseId?.toString() === selectedCourseId
            );
        }

        setQuizzes(filtered);
    }, [searchValue, selectedCourseId, allQuizzes]);

    const handleDelete = () => {
        if (deleteModal.quizId) {
            setQuizzes(prev => prev.filter(q => q.id !== deleteModal.quizId));
            setDeleteModal({ isOpen: false, quizId: null });
        }
    };

    const handlePublish = async () => {
        if (!publishModal.quizId) return;
        
        setIsPublishing(true);
        try {
            await apiPut(`/ai-quiz/${publishModal.quizId}/status`, { status: 'PUBLISHED' });
            setQuizzes(prev => prev.map(q => q.id === publishModal.quizId ? { ...q, status: 'Published' } : q));
            setPublishModal({ isOpen: false, quizId: null, error: '' });
        } catch (err: any) {
            setPublishModal(prev => ({ ...prev, error: err.message || 'Failed to publish quiz' }));
        } finally {
            setIsPublishing(false);
        }
    };

    const attemptPublish = (quiz: any) => {
        if (quiz.courseId === 'N/A') {
            setPublishModal({ isOpen: true, quizId: quiz.id, error: 'You must edit this draft to assign a course before it can be published.' });
        } else {
            setPublishModal({ isOpen: true, quizId: quiz.id, error: '' });
        }
    };

    if (loading) {
        return (
            <DashboardLayout userName="Loading..." userRole={UserRole.FACULTY} notifications={[]} currentPath="/dashboard/faculty/quizzes">
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
            currentPath="/dashboard/faculty/quizzes"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <AdminPageHeader
                    icon={Award}
                    title="Student"
                    titleAccent="Quizzes"
                    subtitle="Manage quizzes and assessments"
                    eyebrow={{ icon: Home, label: "Faculty Portal" }}
                    actions={
                        <div className="flex gap-2">
                            <Link href="/dashboard/faculty/quizzes/ai-quiz-generator" className="flex items-center gap-2 px-4 py-2 bg-primary-light text-primary rounded-[2px] text-sm font-semibold shadow-none border border-primary/20 hover:bg-primary hover:text-white transition-all">
                                <Sparkles className="h-4 w-4" />
                                AI Generator
                            </Link>
                            <Link href="/dashboard/faculty/quizzes/create" className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-[2px] text-sm font-semibold shadow-none shadow-blue-200 hover:bg-primary-hover hover:shadow-none transition-all">
                                <Plus className="h-5 w-5" />
                                Create Quiz
                            </Link>
                        </div>
                    }
                />

                {/* Filters */}
                <AdminFilterBar
                    searchValue={searchValue}
                    onSearchChange={setSearchValue}
                    searchPlaceholder="Search quizzes..."
                    filters={[
                        {
                            id: 'course',
                            label: 'Course',
                            value: selectedCourseId,
                            onChange: setSelectedCourseId,
                            options: [
                                { value: 'all', label: 'Filter by Course' },
                                ...courses.map((c: any, idx: number) => ({
                                    value: c.id?.toString() || c.courseOfferingId?.toString() || c.courseofferingid?.toString() || c.courseid?.toString() || idx.toString(),
                                    label: c.name || c.course?.name || 'Unknown Course'
                                }))
                            ]
                        },
                        {
                            id: 'status',
                            label: 'Status',
                            value: 'Status',
                            onChange: () => setShowComingSoon(true),
                            options: [
                                { value: 'Status', label: 'Status' }
                            ]
                        }
                    ]}
                />

                {/* Quizzes List */}
                <div className="grid grid-cols-1 gap-4">
                    {quizzes.map((quiz) => (
                        <div key={quiz.id} className="bg-surface border border-warning-text text-warning-text hover:bg-warning-bg hover:text-warning-text transition-colors">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-primary-light text-primary rounded-[2px] group-hover:scale-105 transition-transform">
                                    <ClipboardList className="h-6 w-6" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-lg text-text-primary group-hover:text-primary transition-colors">
                                            {quiz.title}
                                        </h3>
                                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${quiz.status === 'Active' ? 'bg-sky-100 text-primary' :
                                            quiz.status === 'Closed' ? 'bg-error-bg text-error-text' : 'bg-background text-text-primary'
                                            }`}>
                                            {quiz.status}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary">
                                        <span className="font-medium text-text-primary bg-background px-2 py-0.5 rounded-[2px]">
                                            {quiz.courseId || quiz.courseName}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3.5 w-3.5" />
                                            {quiz.duration} mins
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <ClipboardList className="h-3.5 w-3.5" />
                                            {quiz.totalMarks} Marks
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="text-right hidden md:block">
                                    <div className="flex items-center gap-1 text-text-primary font-semibold justify-end">
                                        <Users className="h-4 w-4 text-text-secondary" />
                                        <span>{quiz.totalAttempts || 0}</span>
                                    </div>
                                    <p className="text-xs text-text-muted">Attempts completed</p>
                                </div>

                                <div className="flex items-center gap-2 pl-6 border-l border-border">
                                    <Link 
                                        href={`/dashboard/faculty/quizzes/${quiz.id}`}
                                        className="p-2 text-text-muted hover:text-primary hover:bg-background rounded-[2px] transition-colors"
                                        title="View"
                                    >
                                        <Play className="h-4 w-4" />
                                    </Link>
                                    {quiz.status === 'Draft' && (
                                        <button
                                            onClick={() => attemptPublish(quiz)}
                                            className="p-2 text-text-muted hover:text-success-text hover:bg-success-bg rounded-[2px] transition-colors"
                                            title="Publish"
                                        >
                                            <Globe className="h-4 w-4" />
                                        </button>
                                    )}
                                    <Link 
                                        href={`/dashboard/faculty/quizzes/create?edit=${quiz.id}`}
                                        className="p-2 text-text-muted hover:text-primary hover:bg-primary-light rounded-[2px] transition-colors"
                                        title="Edit"
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Link>
                                    <button
                                        onClick={() => setDeleteModal({ isOpen: true, quizId: quiz.id })}
                                        className="p-2 text-text-muted hover:text-error-text hover:bg-error-bg rounded-[2px] transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modals */}
            <Modal
                isOpen={showComingSoon}
                onClose={() => setShowComingSoon(false)}
                title="Feature Coming Soon"
                type="default"
            >
                <div className="text-center py-4">
                    <div className="p-3 bg-primary-light rounded-[2px] text-primary w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <Clock className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-semibold text-text-primary mb-2">Quiz Management</h3>
                    <p className="text-text-secondary mb-6">
                        This feature is currently under development.
                    </p>
                    <button
                        onClick={() => setShowComingSoon(false)}
                        className="bg-gray-900 text-white px-6 py-2 rounded-[2px] text-sm font-medium hover:bg-gray-800 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </Modal>

            <Modal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, quizId: null })}
                title="Delete Quiz"
                type="danger"
            >
                <div>
                    <p className="text-text-primary mb-6">
                        Are you sure you want to delete this quiz? This action cannot be undone.
                    </p>
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => setDeleteModal({ isOpen: false, quizId: null })}
                            className="px-4 py-2 rounded-[2px] text-text-primary font-semibold hover:bg-background transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDelete}
                            className="px-4 py-2 rounded-[2px] bg-error-text text-white font-semibold hover:bg-red-700 transition-colors shadow-none shadow-red-200"
                        >
                            Delete Quiz
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={publishModal.isOpen}
                onClose={() => setPublishModal({ isOpen: false, quizId: null, error: '' })}
                title="Publish Quiz"
                type={publishModal.error && !publishModal.error.includes('Failed') ? 'danger' : 'default'}
            >
                <div>
                    {publishModal.error ? (
                        <div className="mb-6">
                            <p className="text-error-text font-medium">{publishModal.error}</p>
                        </div>
                    ) : (
                        <p className="text-text-primary mb-6">
                            Are you sure you want to publish this quiz? Once published, enrolled students will be able to attempt it.
                        </p>
                    )}
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => setPublishModal({ isOpen: false, quizId: null, error: '' })}
                            className="px-4 py-2 rounded-[2px] text-text-primary font-semibold hover:bg-background transition-colors"
                        >
                            {publishModal.error && !publishModal.error.includes('Failed') ? 'Close' : 'Cancel'}
                        </button>
                        {(!publishModal.error || publishModal.error.includes('Failed')) && (
                            <button
                                onClick={handlePublish}
                                disabled={isPublishing}
                                className="px-4 py-2 rounded-[2px] bg-success-text text-white font-semibold hover:bg-green-700 transition-colors shadow-none disabled:opacity-50"
                            >
                                {isPublishing ? 'Publishing...' : 'Publish'}
                            </button>
                        )}
                    </div>
                </div>
            </Modal>

        </DashboardLayout >
    );
}
