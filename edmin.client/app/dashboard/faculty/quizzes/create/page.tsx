'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { UserRole, Notification } from '@/types/types';
import { Plus, X, Upload, Save, CheckCircle2, ChevronDown, List, AlignLeft, AlertCircle, Trash2, Home, FileText, Settings, Clock, Award, Users, BookOpen, Layers, BarChart, ChevronRight, CheckCircle, RefreshCcw, ClipboardList, AlertTriangle } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { Suspense, useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import { apiClient } from '@/api/apiClient';
import { DashboardAPI } from '@/utils/api';

// Types
interface Question {
    id: number;
    text: string;
    type: 'mcq' | 'question-answer';
    points: number;
    options?: string[];
    correctAnswer?: string;
}

function CreateQuizContent() {
    const searchParams = useSearchParams();
    const preSelectedCourseId = searchParams.get('courseId');
    const fromCourse = searchParams.get('from');
    const courseName = searchParams.get('courseName');
    const editId = searchParams.get('edit');

    // Quiz State
    const [quizTitle, setQuizTitle] = useState('');
    const [quizDescription, setQuizDescription] = useState('');
    const [selectedCourseId, setSelectedCourseId] = useState(preSelectedCourseId || '');
    const [timeLimit, setTimeLimit] = useState<number | ''>('');
    const [totalPoints, setTotalPoints] = useState<number | ''>('');
    const [shuffleQuestions, setShuffleQuestions] = useState(false);
    const [showResultsImmediately, setShowResultsImmediately] = useState(false);
    const [courses, setCourses] = useState<any[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    
    const [user, setUser] = useState<{ name: string; avatar?: string }>({ name: 'Faculty' });
    const [notifications, setNotifications] = useState<Notification[]>([]);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const dashboardData = await DashboardAPI.getFacultyDashboard();
                if (dashboardData?.user) {
                    setUser({ name: dashboardData.user.name, avatar: dashboardData.user.avatar });
                }
            } catch (err) {
                console.error("Failed to load user data", err);
            }
        };
        fetchUser();
    }, []);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const res = await apiClient.get('/faculty/courses');
                if (res.data?.success && res.data?.data) setCourses(res.data.data);
            } catch (err) {
                console.error("Failed to load courses", err);
            }
        };
        fetchCourses();
    }, []);

    useEffect(() => {
        const fetchEditQuiz = async () => {
            if (!editId) return;
            try {
                const res: any = await apiClient.get(`/ai-quiz/${editId}`);
                if (res.success && res.data) {
                    const q = res.data;
                    setQuizTitle(q.title || '');
                    setQuizDescription(q.description || '');
                    setSelectedCourseId(q.courseofferingid ? String(q.courseofferingid) : '');
                    setTimeLimit(q.timelimitminutes || '');
                    setTotalPoints(q.questions ? q.questions.length : '');
                    
                    if (q.questiontype) {
                        setQuizType(q.questiontype === 'MCQ' ? 'mcq' : 'question-answer');
                    }
                    
                    if (q.questions && Array.isArray(q.questions)) {
                        setQuestions(q.questions.map((question: any, index: number) => ({
                            id: question.aiquizquestionid || Date.now() + index,
                            text: question.questiontext,
                            type: (question.type === 'MCQ' || question.type === 'TRUE_FALSE') ? 'mcq' : 'question-answer',
                            points: question.points || 1,
                            options: question.options || [],
                            correctAnswer: question.correctanswer || ''
                        })));
                    }
                }
            } catch (err) {
                console.error("Failed to load draft for editing", err);
                setToast({ show: true, message: 'Failed to load quiz data for editing.', type: 'error' });
            }
        };
        fetchEditQuiz();
    }, [editId]);

    const router = useRouter();
    const [quizType, setQuizType] = useState<'mcq' | 'question-answer'>('mcq');
    // Questions State
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isAddingQuestion, setIsAddingQuestion] = useState(false);

    // Modals
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' });
    const [errorModal, setErrorModal] = useState({ isOpen: false, message: '' });

    // New Question Form State
    const [newQuestion, setNewQuestion] = useState<Partial<Question>>({
        type: 'mcq',
        points: 5,
        options: ['', '', '', ''],
        correctAnswer: ''
    });

    const handleAddQuestion = () => {
        if (!newQuestion.text || !newQuestion.correctAnswer) {
            setErrorModal({ isOpen: true, message: "Please fill in the question text and select a correct answer." });
            return;
        }

        const question: Question = {
            id: Date.now(),
            text: newQuestion.text || 'Untitled Question',
            type: newQuestion.type as 'mcq' | 'question-answer',
            points: newQuestion.points || 5,
            options: newQuestion.type === 'mcq' ? newQuestion.options : undefined,
            correctAnswer: newQuestion.type === 'mcq' ? newQuestion.correctAnswer : undefined
        };

        setQuestions([...questions, question]);
        setIsAddingQuestion(false);
        setNewQuestion({
            type: quizType,
            points: 5,
            options: quizType === 'mcq' ? ['', '', '', ''] : undefined,
            correctAnswer: ''
        });
    };

    const handleQuizTypeChange = (type: 'mcq' | 'question-answer') => {
        setQuizType(type);
        setNewQuestion({
            type: type,
            points: 5,
            options: type === 'mcq' ? ['', '', '', ''] : undefined,
            correctAnswer: ''
        });
    };

    const handleOptionChange = (index: number, value: string) => {
        if (!newQuestion.options) return;
        const newOptions = [...newQuestion.options];
        const oldOption = newOptions[index];
        newOptions[index] = value;

        // If the edited option was the correct answer, update the correct answer too
        let newCorrectAnswer = newQuestion.correctAnswer;
        if (newQuestion.correctAnswer === oldOption) {
            newCorrectAnswer = value;
        }

        setNewQuestion({
            ...newQuestion,
            options: newOptions,
            correctAnswer: newCorrectAnswer
        });
    };

    const handlePublish = () => {
        setIsConfirmModalOpen(true);
    };

    const handleSave = async (status: 'DRAFT' | 'PUBLISHED') => {
        if (!quizTitle || !timeLimit || !totalPoints) {
            setToast({ show: true, message: 'Please fill in Title, Time Limit, and Total Points.', type: 'error' });
            return;
        }

        if (status === 'PUBLISHED' && !selectedCourseId) {
            setToast({ show: true, message: 'You must select a course to publish.', type: 'error' });
            return;
        }

        if (questions.length === 0) {
            setToast({ show: true, message: 'Please add at least one question.', type: 'error' });
            return;
        }

        setIsSaving(true);
        setIsConfirmModalOpen(false);

        // Format questions for backend
        const formattedQuestions = questions.map(q => ({
            questiontext: q.text,
            type: q.type === 'mcq' ? 'MCQ' : 'SHORT_ANSWER',
            options: q.options ? q.options.filter(opt => opt.trim() !== '') : [],
            correctanswer: q.correctAnswer || '',
        }));

        try {
            const payload: any = {
                title: quizTitle,
                description: quizDescription,
                courseOfferingId: selectedCourseId ? Number(selectedCourseId) : undefined,
                difficulty: 'MEDIUM',
                questionType: quizType === 'mcq' ? 'MCQ' : 'SHORT_ANSWER',
                timeLimitMinutes: Number(timeLimit),
                topic: 'Manual Quiz',
                maxWarnings: 3,
                ai_model: 'manual',
                status: status,
                questions: formattedQuestions
            };
            
            if (editId) {
                payload.id = Number(editId);
            }

            const res: any = await apiClient.post('/ai-quiz/save', payload);

            if (res.success) {
                setToast({ show: true, message: `Quiz saved successfully as ${status}!`, type: 'success' });
                setTimeout(() => {
                    router.push('/dashboard/faculty/quizzes');
                }, 2000);
            } else {
                setToast({ show: true, message: 'Failed to save quiz.', type: 'error' });
            }
        } catch (err: any) {
            setToast({ show: true, message: err.message || 'An error occurred while saving.', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const confirmPublish = () => {
        handleSave('PUBLISHED');
    };

    return (
        <DashboardLayout
            userRole={UserRole.FACULTY}
            userName={user.name}
            userAvatar={user.avatar}
            notifications={notifications}
            currentPath="/dashboard/faculty/quizzes/create"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <AdminPageHeader
                    icon={ClipboardList}
                    title={editId ? 'Edit' : 'Create'}
                    titleAccent="Quiz"
                    eyebrow={{ icon: Home, label: fromCourse ? (courseName || 'Course') : "Faculty Portal" }}
                    backHref={fromCourse ? `/dashboard/faculty/courses/${fromCourse}?tab=quizzes` : "/dashboard/faculty/quizzes"}
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Quiz Details */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-surface rounded-[2px] shadow-none border border-border p-6 space-y-6">
                            <div className="space-y-4">
                                <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                                    <ClipboardList className="h-5 w-5 text-indigo-500" />
                                    Quiz Information
                                </h2>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-text-primary">Quiz Title</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., Chapter 1 Assessment"
                                        className="w-full px-4 py-2.5 rounded-[2px] border border-border focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                        value={quizTitle}
                                        onChange={(e) => setQuizTitle(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-text-primary">Instructions / Description</label>
                                    <textarea
                                        rows={4}
                                        placeholder="Instructions for students..."
                                        className="w-full px-4 py-3 rounded-[2px] border border-border focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none"
                                        value={quizDescription}
                                        onChange={(e) => setQuizDescription(e.target.value)}
                                    ></textarea>
                                </div>
                            </div>
                        </div>

                        {/* Quiz Type Selection */}
                        <div className="bg-surface rounded-[2px] shadow-none border border-border p-6">
                            <h2 className="text-lg font-semibold text-text-primary mb-4">Quiz Type</h2>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => handleQuizTypeChange('mcq')}
                                    className={`flex-1 px-4 py-3 rounded-[2px] border-2 transition-all ${quizType === 'mcq'
                                        ? 'border-purple-500 bg-background text-purple-700'
                                        : 'border-border hover:border-gray-300'
                                        }`}
                                >
                                    <div className="font-semibold">Multiple Choice (MCQs)</div>
                                    <div className="text-xs text-text-secondary mt-1">Questions with multiple options</div>
                                </button>
                                <button
                                    onClick={() => handleQuizTypeChange('question-answer')}
                                    className={`flex-1 px-4 py-3 rounded-[2px] border-2 transition-all ${quizType === 'question-answer'
                                        ? 'border-purple-500 bg-background text-purple-700'
                                        : 'border-border hover:border-gray-300'
                                        }`}
                                >
                                    <div className="font-semibold">Question & Answer</div>
                                    <div className="text-xs text-text-secondary mt-1">Open-ended questions only</div>
                                </button>
                            </div>
                        </div>

                        <div className="bg-surface rounded-[2px] shadow-none border border-border p-6 space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-text-primary">Questions ({questions.length})</h2>
                                {!isAddingQuestion && (
                                    <button
                                        onClick={() => setIsAddingQuestion(true)}
                                        className="text-sm text-primary font-medium hover:text-primary flex items-center gap-1 bg-primary-light px-3 py-1.5 rounded-[2px] transition-colors"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Add Question
                                    </button>
                                )}
                            </div>

                            {/* Questions List */}
                            {questions.length > 0 && (
                                <div className="space-y-4">
                                    {questions.map((q, index) => (
                                        <div key={q.id} className="p-4 border border-border rounded-[2px] hover:border-blue-200 transition-colors bg-background/30">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-medium text-text-primary">
                                                    <span className="text-text-secondary mr-2">{index + 1}.</span>
                                                    {q.text}
                                                </h3>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-semibold bg-purple-100 text-primary px-2 py-1 rounded">
                                                        {q.type === 'mcq' ? 'MCQ' : 'Q&A'}
                                                    </span>
                                                    <span className="text-xs font-semibold bg-background text-text-primary px-2 py-1 rounded">
                                                        {q.points} pts
                                                    </span>
                                                </div>
                                            </div>
                                            {q.type === 'mcq' && q.options && (
                                                <div className="pl-6 space-y-1">
                                                    {q.options.map((opt, i) => (
                                                        <div key={i} className={`text-sm ${opt === q.correctAnswer ? 'text-primary font-medium flex items-center gap-1' : 'text-text-secondary'}`}>
                                                            {opt === q.correctAnswer && <CheckCircle2 className="w-3 h-3" />}
                                                            {opt}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {q.type === 'question-answer' && (
                                                <div className="pl-6 mt-2 text-sm text-text-secondary italic">
                                                    Open-ended answer expected
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Add Question Form */}
                            {isAddingQuestion && (
                                <div className="border border-border bg-primary-light/30 rounded-[2px] p-4 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="font-semibold text-text-primary">
                                            New {quizType === 'mcq' ? 'MCQ' : 'Question'}
                                        </h3>
                                        <button onClick={() => setIsAddingQuestion(false)} className="text-text-muted hover:text-text-primary">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="col-span-2 space-y-1">
                                            <label className="text-xs font-medium text-text-primary">Question Text</label>
                                            <input
                                                type="text"
                                                className="w-full px-3 py-2 rounded-[2px] border border-border focus:border-blue-500 outline-none text-sm"
                                                value={newQuestion.text || ''}
                                                onChange={(e) => setNewQuestion({ ...newQuestion, text: e.target.value })}
                                                placeholder={quizType === 'mcq' ? 'Enter your MCQ question...' : 'Enter your question...'}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-text-primary">Points</label>
                                            <input
                                                type="number"
                                                className="w-full px-3 py-2 rounded-[2px] border border-border focus:border-blue-500 outline-none text-sm"
                                                value={newQuestion.points}
                                                onChange={(e) => setNewQuestion({ ...newQuestion, points: parseInt(e.target.value) })}
                                            />
                                        </div>
                                    </div>

                                    {/* MCQ Options */}
                                    {quizType === 'mcq' && (
                                        <div className="space-y-2">
                                            <label className="text-xs font-medium text-text-primary">Options (Check correct answer)</label>
                                            {newQuestion.options?.map((opt, idx) => (
                                                <div key={idx} className="flex items-center gap-2">
                                                    <input
                                                        type="radio"
                                                        name="correctAnswer"
                                                        checked={newQuestion.correctAnswer === opt && opt !== ''}
                                                        onChange={() => setNewQuestion({ ...newQuestion, correctAnswer: opt })}
                                                        className="text-primary focus:ring-blue-500"
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder={`Option ${idx + 1}`}
                                                        className="flex-1 px-3 py-1.5 rounded-[2px] border border-border focus:border-blue-500 outline-none text-sm"
                                                        value={opt}
                                                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Question & Answer Type Info */}
                                    {quizType === 'question-answer' && (
                                        <div className="bg-primary-light border border-blue-200 rounded-[2px] p-3">
                                            <p className="text-xs text-primary">
                                                <strong>Note:</strong> Students will provide open-ended answers. You'll need to grade these manually.
                                            </p>
                                        </div>
                                    )}

                                    <div className="flex justify-end pt-2">
                                        <button
                                            onClick={handleAddQuestion}
                                            className="px-4 py-2 bg-primary text-white rounded-[2px] text-sm font-semibold hover:bg-primary-hover transition-colors"
                                        >
                                            Save Question
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Empty State Placeholder (only if no questions and not adding) */}
                            {questions.length === 0 && !isAddingQuestion && (
                                <div className="border-2 border-dashed border-border rounded-[2px] p-8 text-center bg-background/50">
                                    <div className="w-12 h-12 bg-surface text-text-muted rounded-[2px] flex items-center justify-center mx-auto mb-3 shadow-none">
                                        <Plus className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-text-primary font-medium">No questions added yet</h3>
                                    <p className="text-sm text-text-secondary mt-1">
                                        Start adding {quizType === 'mcq' ? 'MCQ' : 'Q&A'} questions to build your quiz.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Settings */}
                    <div className="space-y-6">
                        <div className="bg-surface rounded-[2px] shadow-none border border-border p-6 space-y-6">
                            <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                                <BookOpen className="h-5 w-5 text-blue-500" />
                                Settings
                            </h2>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-text-primary">Course</label>
                                    <select
                                        value={selectedCourseId}
                                        onChange={(e) => setSelectedCourseId(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-[2px] border border-border focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-surface"
                                    >
                                        <option value="">Select a course (Optional for Draft)</option>
                                        {courses.map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.code} - {c.name} {c.semester ? `(${c.semester})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-text-primary">Time Limit (Minutes)</label>
                                    <div className="relative">
                                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                                        <input
                                            type="number"
                                            placeholder="30"
                                            className="w-full pl-10 pr-4 py-2.5 rounded-[2px] border border-border focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                            value={timeLimit}
                                            onChange={(e) => setTimeLimit(parseInt(e.target.value) || '')}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-text-primary">Total Points</label>
                                    <input
                                        type="number"
                                        placeholder="100"
                                        className="w-full px-4 py-2.5 rounded-[2px] border border-border focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                        value={totalPoints}
                                        onChange={(e) => setTotalPoints(parseInt(e.target.value) || '')}
                                    />
                                </div>

                                <hr className="border-border" />

                                <div className="space-y-3 pt-1">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded text-primary focus:ring-blue-500 border-gray-300"
                                            checked={shuffleQuestions}
                                            onChange={(e) => setShuffleQuestions(e.target.checked)}
                                        />
                                        <span className="text-sm text-text-primary">Shuffle Questions</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded text-primary focus:ring-blue-500 border-gray-300"
                                            checked={showResultsImmediately}
                                            onChange={(e) => setShowResultsImmediately(e.target.checked)}
                                        />
                                        <span className="text-sm text-text-primary">Show Results Immediately</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="bg-surface rounded-[2px] shadow-none border border-border p-6 space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-text-secondary">Status</span>
                                <span className="px-2 py-1 bg-surface-hover text-text-primary rounded text-xs font-semibold">Draft</span>
                            </div>
                            <button
                                onClick={handlePublish}
                                disabled={isSaving}
                                className="w-full py-2.5 rounded-[2px] bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-none shadow-blue-200 hover:shadow-none hover:translate-y-[-1px] transition-all disabled:opacity-50"
                            >
                                {isSaving ? 'Saving...' : 'Publish Quiz'}
                            </button>
                            <button 
                                onClick={() => handleSave('DRAFT')}
                                disabled={isSaving}
                                className="w-full py-2.5 rounded-[2px] border border-border font-semibold text-text-primary hover:bg-background transition-colors disabled:opacity-50"
                            >
                                {isSaving ? 'Saving...' : 'Save Draft'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            <Modal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                title="Confirm Publish"
                type="default"
            >
                <div className="text-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="p-4 bg-primary-light rounded-[2px] text-primary">
                            <AlertTriangle className="h-8 w-8" />
                        </div>
                        <p className="text-text-primary max-w-md">
                            Are you sure you want to publish this quiz? Students will be able to see and attempt it once published.
                        </p>
                        <div className="flex justify-center gap-3 w-full mt-2">
                            <button
                                onClick={() => setIsConfirmModalOpen(false)}
                                className="px-6 py-2.5 rounded-[2px] bg-background text-text-primary font-semibold hover:bg-border transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmPublish}
                                className="px-6 py-2.5 rounded-[2px] bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-colors"
                            >
                                Confirm & Publish
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={errorModal.isOpen}
                onClose={() => setErrorModal({ ...errorModal, isOpen: false })}
                title="Error"
                type="danger"
            >
                <div className="text-center sm:text-left">
                    <div className="flex flex-col items-center sm:items-start gap-4">
                        <div className="p-3 bg-error-bg rounded-[2px] text-error-text mb-2 sm:mb-0">
                            <AlertTriangle className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-text-secondary mb-4">
                                {errorModal.message}
                            </p>
                            <div className="flex justify-end gap-3 w-full">
                                <button
                                    onClick={() => setErrorModal({ ...errorModal, isOpen: false })}
                                    className="px-4 py-2 rounded-[2px] bg-background text-text-primary font-semibold hover:bg-border transition-colors"
                                >
                                    Okay
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Toast Notification */}
            {toast.show && (
                <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-5">
                    <div className={`flex items-center gap-3 px-6 py-4 rounded-[2px] shadow-none border ${toast.type === 'success'
                        ? 'bg-success-bg border-green-200 text-green-800'
                        : 'bg-error-bg border-red-200 text-red-800'
                        }`}>
                        {toast.type === 'success' ? (
                            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                        ) : (
                            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                        )}
                        <span className="font-medium">{toast.message}</span>
                        <button
                            onClick={() => setToast({ ...toast, show: false })}
                            className="ml-4 text-text-muted hover:text-text-primary transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

        </DashboardLayout>
    );
}

export default function CreateQuizPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CreateQuizContent />
        </Suspense>
    );
}
