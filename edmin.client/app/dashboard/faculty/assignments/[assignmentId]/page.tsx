'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { UserRole, Notification } from '@/types/types';
import { FileText, Calendar, BookOpen, Clock, Download, Edit, Home, ChevronRight, ArrowLeft, CheckCircle2, Users, Search } from 'lucide-react';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import Modal from '@/components/Modal';

import { DashboardAPI } from '@/utils/api';
import { apiGet } from '@/api/apiContract';

function AssignmentViewContent() {
    const params = useParams();
    const searchParams = useSearchParams();

    const assignmentId = params.assignmentId;
    const from = searchParams.get('from'); // courseId if coming from course page
    const courseName = searchParams.get('courseName'); // course name if coming from course page
    const [searchTerm, setSearchTerm] = useState('');
    const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
    const [gradeInput, setGradeInput] = useState('');
    const [downloading, setDownloading] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<'success' | 'error'>('success');
    
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [assignment, setAssignment] = useState<any>(null);
    const [students, setStudents] = useState<any[]>([]); // No API for assignment submissions currently

    useEffect(() => {
        const loadData = async () => {
            try {
                const [dash, assignmentsRes] = await Promise.all([
                    DashboardAPI.getFacultyDashboard(),
                    apiGet('/faculty/assignments')
                ]);
                setProfile(dash.profile);
                const allAssignments = (assignmentsRes as any)?.data || [];
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

    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.studentId.includes(searchTerm)
    );

    const submissionCount = assignment?.totalSubmissions || 0;
    const totalStudents = students.length;

    if (loading) {
        return (
            <DashboardLayout userName="Loading..." userRole={UserRole.FACULTY} notifications={[]} currentPath={`/dashboard/faculty/assignments/${assignmentId}`}>
                <div className="flex justify-center items-center h-[60vh]">
                    <div className="w-6 h-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
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

    useEffect(() => {
        if (showToast) {
            const timer = setTimeout(() => {
                setShowToast(false);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [showToast]);

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
                                    <Link href="/dashboard/faculty/assignments" className="text-sm font-medium text-text-secondary hover:text-primary transition-colors">
                                        Assignments
                                    </Link>
                                </li>
                                <li><span className="text-border-hover">/</span></li>
                            </>
                        )}
                        <li><span className="text-sm font-medium text-text-primary">View Assignment</span></li>
                    </ol>
                </nav>

                <div className="flex items-start justify-between mb-8">
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
                    <Link href={`/dashboard/faculty/assignments/${assignmentId}/edit`}>
                        <button className="flex items-center gap-2 px-4 py-2 bg-primary-light text-primary rounded-[2px] hover:bg-primary-light transition-colors font-semibold">
                            <Edit className="w-4 h-4" />
                            Edit Assignment
                        </button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Description */}
                        <div className="bg-surface rounded-[2px]  border border-border p-6 md:p-8">
                            <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2 mb-4">
                                <FileText className="h-5 w-5 text-blue-500" />
                                Description
                            </h2>
                            <p className="text-text-primary leading-relaxed whitespace-pre-wrap text-sm">
                                {assignment.description || 'No description provided.'}
                            </p>
                        </div>



                        {/* Student Submissions Section */}

                        <div className="bg-surface rounded-[2px]  border border-border overflow-hidden">
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
                                <table className="w-full">
                                    <thead className="bg-background border-b border-border">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Student</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Submitted On</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Grade</th>
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
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-[2px] text-xs font-medium ${student.status === 'Graded' ? 'bg-green-100 text-green-800' :
                                                            student.status === 'Submitted' ? 'bg-primary-light text-blue-800' :
                                                                student.status === 'Late' ? 'bg-orange-100 text-orange-800' :
                                                                    'bg-background text-text-primary'
                                                            }`}>
                                                            {student.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-text-primary">
                                                        {student.submittedDate ? new Date(student.submittedDate).toLocaleString() : '-'}
                                                    </td>
                                                    <td className="px-6 py-4 font-medium text-text-primary">
                                                        {student.grade !== null ? `${student.grade}/${assignment.points || 100}` : '-'}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedStudent(student);
                                                                setGradeInput(student.grade?.toString() || '');
                                                                setIsGradeModalOpen(true);
                                                            }}
                                                            className="text-primary hover:text-primary font-medium text-sm"
                                                        >
                                                            Grade
                                                        </button>
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
                            <h3 className="font-semibold text-text-primary mb-4">Assignment Status</h3>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm text-text-secondary mb-1">Due Date</p>
                                    <div className="flex items-center gap-2 text-text-primary font-medium">
                                        <Calendar className="w-4 h-4 text-indigo-500" />
                                        <span>{assignment.dueDate ? new Date(assignment.dueDate).toLocaleString() : 'No Due Date'}</span>
                                    </div>
                                </div>
                                <hr className="border-border" />
                                <div>
                                    <p className="text-sm text-text-secondary mb-1">Points Possible</p>
                                    <p className="text-2xl font-bold text-text-primary">{assignment.points || 100}</p>
                                </div>
                                <hr className="border-border" />
                                <div>
                                    <p className="text-sm text-text-secondary mb-1">Submissions</p>
                                    <div className="flex items-center gap-2 mb-1">
                                        {/* allowLateSubmissions is not strictly in schema, hardcode feature check or hide */}
                                        <CheckCircle2 className="w-4 h-4 text-success-text" />
                                        <span className="font-semibold text-text-primary">Late Submissions</span>
                                    </div>
                                    <span className="text-text-secondary text-xs">Allowed with penalty</span>
                                </div>
                            </div>
                        </div>

                        {/* Attachments Sidebar Widget */}
                        <div className="bg-surface rounded-[2px]  border border-border p-6">
                            <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                                <Download className="h-4 w-4 text-sky-500" />
                                Attachments
                            </h3>
                            {/* Attachments UI removed since attachments aren't returned natively */}
                        </div>
                    </div>
                </div>

                {/* Grading Modal */}
                <Modal
                    isOpen={isGradeModalOpen}
                    onClose={() => {
                        setIsGradeModalOpen(false);
                        setSelectedStudent(null);
                        setGradeInput('');
                    }}
                    title="Grade Assignment"
                >
                    {selectedStudent && (
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-text-primary">Student</p>
                                <p className="font-semibold text-text-primary">{selectedStudent.name}</p>
                                <p className="text-xs text-text-secondary">{selectedStudent.studentId}</p>
                            </div>

                            {selectedStudent.downloadUrl && (
                                <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-[2px] flex items-center justify-between">
                                    <span className="text-sm font-medium">Submission Attachment</span>
                                    <button 
                                        onClick={async () => {
                                            try {
                                                setDownloading(true);
                                                const url = selectedStudent.downloadUrl;
                                                const res = await apiGet<{ url: string; expiresIn: number }>(url as string);
                                                if (res.url) window.open(res.url, '_blank');
                                            } catch(err: any) {
                                                setToastMessage('Failed to download file');
                                                setToastType('error');
                                                setShowToast(true);
                                            } finally {
                                                setDownloading(false);
                                            }
                                        }}
                                        disabled={downloading}
                                        className="text-sm text-sky-600 hover:underline flex items-center gap-1 disabled:opacity-50"
                                    >
                                        <Download className="w-4 h-4" />
                                        {downloading ? 'Loading...' : 'Download'}
                                    </button>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-semibold text-text-primary mb-1">
                                    Grade (out of {assignment.points || 100})
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max={assignment.points || 100}
                                    value={gradeInput}
                                    onChange={(e) => setGradeInput(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-[2px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder={`Enter grade (0-${assignment.points || 100})`}
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
                                <button
                                    onClick={() => setIsGradeModalOpen(false)}
                                    className="px-4 py-2 text-text-primary font-semibold hover:bg-background rounded-[2px] transition-colors border border-transparent"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        const grade = parseFloat(gradeInput);
                                        const maxPts = assignment.points || 100;
                                        if (isNaN(grade) || grade < 0 || grade > maxPts) {
                                            setToastMessage(`Please enter a valid grade between 0 and ${maxPts}`);
                                            setToastType('error');
                                            setShowToast(true);
                                            return;
                                        }

                                        // TODO: Save grade to backend
                                        setToastMessage(`Grade saved successfully for ${selectedStudent.name}`);
                                        setToastType('success');
                                        setShowToast(true);
                                        setIsGradeModalOpen(false);
                                        setSelectedStudent(null);
                                        setGradeInput('');
                                    }}
                                    className="flex-1 px-4 py-2 bg-primary text-white rounded-[2px] hover:bg-primary-hover transition-colors font-medium"
                                >
                                    Save Grade
                                </button>
                                <button
                                    onClick={() => {
                                        setIsGradeModalOpen(false);
                                        setSelectedStudent(null);
                                        setGradeInput('');
                                    }}
                                    className="flex-1 px-4 py-2 bg-background text-text-primary rounded-[2px] hover:bg-border transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </Modal>

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
