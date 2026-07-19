'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { UserRole } from '@/types/types';
import { FileText, Calendar, BookOpen, Clock, Download, Edit, Home, ArrowLeft, CheckCircle2, Users, Search, AlertCircle, Loader2 } from 'lucide-react';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import Modal from '@/components/Modal';
import { DashboardAPI } from '@/utils/api';
import { apiGet, apiPost } from '@/api/apiContract';

function SubmissionsViewContent() {
    const params = useParams();
    const searchParams = useSearchParams();

    const assignmentId = params.assignmentId;
    const from = searchParams.get('from'); // courseId if coming from course page
    const courseName = searchParams.get('courseName'); // course name if coming from course page
    const [searchTerm, setSearchTerm] = useState('');
    const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
    const [gradeInput, setGradeInput] = useState('');
    const [feedbackInput, setFeedbackInput] = useState('');
    const [downloading, setDownloading] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<'success' | 'error'>('success');
    
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [assignment, setAssignment] = useState<any>(null);
    const [students, setStudents] = useState<any[]>([]);

    const fetchSubmissions = async () => {
        try {
            const res = await apiGet<any[]>(`/faculty/assignments/${assignmentId}/submissions`);
            if (res) {
                setStudents((res as any).data || res);
            }
        } catch (err) {
            console.error('Failed to load student submissions', err);
        }
    };

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
                
                await fetchSubmissions();
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [assignmentId]);

    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.studentId.includes(searchTerm)
    );

    const getFileName = (url: string | null) => {
        if (!url) return '';
        try {
            const parts = url.split('/');
            const name = parts[parts.length - 1];
            // Remove UUID/timestamp prefix if any
            return name.substring(name.indexOf('_') + 1) || name;
        } catch {
            return 'Attachment';
        }
    };

    const submissionCount = students.filter(s => s.status !== 'Pending').length;
    const totalStudents = students.length;

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
            <DashboardLayout userName="Loading..." userRole={UserRole.FACULTY} notifications={[]} currentPath={`/dashboard/faculty/assignments/${assignmentId}`}>
                <div className="flex justify-center items-center h-[60vh]">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
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
                        <li>
                            <Link href={`/dashboard/faculty/assignments/${assignmentId}${from ? `?from=${from}&courseName=${encodeURIComponent(courseName || '')}` : ''}`} className="text-sm font-medium text-text-secondary hover:text-primary transition-colors">
                                {assignment.title}
                            </Link>
                        </li>
                        <li><span className="text-border-hover">/</span></li>
                        <li><span className="text-sm font-medium text-text-primary">Submissions</span></li>
                    </ol>
                </nav>

                <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Link
                                href={`/dashboard/faculty/assignments/${assignmentId}${from ? `?from=${from}&courseName=${encodeURIComponent(courseName || '')}` : ''}`}
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
                </div>

                <div className="bg-surface rounded-[2px] border border-border overflow-hidden shadow-none mb-6">
                    <div className="p-6 border-b border-border flex items-center justify-between flex-wrap gap-4">
                        <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                            <Users className="h-5 w-5 text-indigo-500" />
                            Student Submissions ({submissionCount}/{totalStudents})
                        </h2>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                            <input
                                type="text"
                                placeholder="Search students..."
                                className="pl-9 pr-4 py-2 rounded-[2px] border border-border text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none w-full sm:w-64"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-background border-b border-border">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Student</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Submitted On</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">File</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Grade</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Feedback</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#EDEBE9]">
                                {filteredStudents.length > 0 ? (
                                    filteredStudents.map((student) => (
                                        <tr key={student.id} className="hover:bg-background/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="font-medium text-text-primary">{student.name}</div>
                                                    <div className="text-xs text-text-secondary">{student.studentId}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-[2px] text-xs font-medium ${
                                                    student.status === 'Graded' ? 'bg-green-100 text-green-800' :
                                                    student.status === 'Submitted' ? 'bg-primary-light text-blue-800' :
                                                    'bg-background text-text-primary'
                                                }`}>
                                                    {student.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-text-primary">
                                                {student.submittedDate ? new Date(student.submittedDate).toLocaleString() : '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {student.downloadUrl ? (
                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                setDownloading(true);
                                                                const cleanUrl = student.downloadUrl.replace(/^\/api\/v1/, '');
                                                                const res = await apiGet<{ url: string; expiresIn: number }>(cleanUrl);
                                                                if (res.url) window.open(res.url, '_blank');
                                                            } catch (err) {
                                                                setToastMessage('Failed to download file');
                                                                setToastType('error');
                                                                setShowToast(true);
                                                            } finally {
                                                                setDownloading(false);
                                                            }
                                                        }}
                                                        disabled={downloading}
                                                        className="text-primary hover:underline flex items-center gap-1 font-medium disabled:opacity-50 text-xs"
                                                    >
                                                        <Download className="w-3.5 h-3.5" />
                                                        {getFileName(student.downloadUrl) || 'Download'}
                                                    </button>
                                                ) : (
                                                    <span className="text-text-muted text-xs">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap font-medium text-text-primary">
                                                {student.grade !== null ? `${student.grade}/${assignment.points || 100}` : '-'}
                                            </td>
                                            <td className="px-6 py-4 max-w-xs truncate text-text-secondary" title={student.feedback || ''}>
                                                {student.feedback || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <button
                                                    onClick={() => {
                                                        setSelectedStudent(student);
                                                        setGradeInput(student.grade !== null ? student.grade.toString() : '');
                                                        setFeedbackInput(student.feedback || '');
                                                        setIsGradeModalOpen(true);
                                                    }}
                                                    className="text-primary hover:text-primary-hover font-semibold text-sm transition-colors"
                                                >
                                                    {student.status === 'Graded' ? 'Edit Grade' : 'Grade'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-8 text-center text-text-secondary">
                                            No students found matching your search.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Grading Modal */}
                <Modal
                    isOpen={isGradeModalOpen}
                    onClose={() => {
                        setIsGradeModalOpen(false);
                        setSelectedStudent(null);
                        setGradeInput('');
                        setFeedbackInput('');
                    }}
                    title="Grade Submission"
                >
                    {selectedStudent && (
                        <div className="space-y-5">
                            <div>
                                <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-1">Student Details</h4>
                                <p className="font-semibold text-text-primary text-base">{selectedStudent.name}</p>
                                <p className="text-xs text-text-secondary">{selectedStudent.studentId}</p>
                            </div>

                            {selectedStudent.downloadUrl && (
                                <div>
                                    <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-2">Submitted Attachment</h4>
                                    <div className="p-3 bg-background border border-border rounded-[2px] flex items-center justify-between">
                                        <span className="text-xs text-text-secondary font-medium truncate max-w-[70%]">
                                            {getFileName(selectedStudent.downloadUrl) || 'student_submission.zip'}
                                        </span>
                                        <button 
                                            onClick={async () => {
                                                try {
                                                    setDownloading(true);
                                                    const cleanUrl = selectedStudent.downloadUrl.replace(/^\/api\/v1/, '');
                                                    const res = await apiGet<{ url: string; expiresIn: number }>(cleanUrl);
                                                    if (res.url) window.open(res.url, '_blank');
                                                } catch (err) {
                                                    setToastMessage('Failed to download file');
                                                    setToastType('error');
                                                    setShowToast(true);
                                                } finally {
                                                    setDownloading(false);
                                                }
                                            }}
                                            disabled={downloading}
                                            className="text-xs text-primary hover:underline flex items-center gap-1 disabled:opacity-50 font-semibold"
                                        >
                                            <Download className="w-3.5 h-3.5" />
                                            {downloading ? 'Loading...' : 'Download'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-semibold text-text-primary mb-1.5">
                                    Grade (out of {assignment.points || 100})
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max={assignment.points || 100}
                                    value={gradeInput}
                                    onChange={(e) => setGradeInput(e.target.value)}
                                    className="w-full px-3 py-2 border border-border rounded-[2px] focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm"
                                    placeholder={`Enter grade (0-${assignment.points || 100})`}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-text-primary mb-1.5">
                                    Written Feedback / Remarks
                                </label>
                                <textarea
                                    value={feedbackInput}
                                    onChange={(e) => setFeedbackInput(e.target.value)}
                                    className="w-full px-3 py-2 border border-border rounded-[2px] focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all min-h-[120px] text-sm"
                                    placeholder="Provide feedback on the submission..."
                                />
                            </div>

                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
                                <button
                                    onClick={() => {
                                        setIsGradeModalOpen(false);
                                        setSelectedStudent(null);
                                        setGradeInput('');
                                        setFeedbackInput('');
                                    }}
                                    className="px-4 py-2 text-text-primary font-semibold hover:bg-background rounded-[2px] transition-colors border border-transparent text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={async () => {
                                        const grade = parseFloat(gradeInput);
                                        const maxPts = assignment.points || 100;
                                        if (isNaN(grade) || grade < 0 || grade > maxPts) {
                                            setToastMessage(`Please enter a valid grade between 0 and ${maxPts}`);
                                            setToastType('error');
                                            setShowToast(true);
                                            return;
                                        }

                                        try {
                                            await apiPost(`/faculty/assignments/${assignmentId}/students/${selectedStudent.id}/grade`, {
                                                obtainedMarks: grade,
                                                remarks: feedbackInput
                                            });
                                            setToastMessage(`Grade saved successfully for ${selectedStudent.name}`);
                                            setToastType('success');
                                            await fetchSubmissions();
                                        } catch (err: any) {
                                            setToastMessage(err.message || 'Failed to save grade');
                                            setToastType('error');
                                        } finally {
                                            setShowToast(true);
                                            setIsGradeModalOpen(false);
                                            setSelectedStudent(null);
                                            setGradeInput('');
                                            setFeedbackInput('');
                                        }
                                    }}
                                    className="px-5 py-2 bg-primary text-white rounded-[2px] hover:bg-primary-hover transition-colors font-semibold text-sm"
                                >
                                    Save Grade
                                </button>
                            </div>
                        </div>
                    )}
                </Modal>

                {/* Toast Notification */}
                {showToast && (
                    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-5">
                        <div className={`px-6 py-4 rounded-[2px] border ${toastType === 'success'
                            ? 'bg-success-bg border-green-200 text-green-800'
                            : 'bg-error-bg border-red-200 text-red-800'
                            }`}>
                            <div className="flex items-center gap-3">
                                {toastType === 'success' ? (
                                    <CheckCircle2 className="w-5 h-5 text-success-text" />
                                ) : (
                                    <AlertCircle className="w-5 h-5 text-error-text" />
                                )}
                                <p className="font-semibold text-sm">{toastMessage}</p>
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

export default function SubmissionsPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen items-center justify-center bg-background">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        }>
            <SubmissionsViewContent />
        </Suspense>
    );
}
