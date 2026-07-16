'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { UserRole } from '@/types/types';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { Save, UserCheck, XCircle, Clock, Home, CheckCircle2, AlertCircle, Loader2, ClipboardList } from 'lucide-react';
import Link from 'next/link';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import Modal from '@/components/Modal';
import { apiGet, apiPost } from '@/api/apiContract';
import { DashboardAPI } from '@/utils/api';

interface StudentRosterItem {
    id: string;
    name: string;
    rollNo: string;
    status: 'present' | 'absent' | 'late' | 'pending';
}

function MarkAttendanceContent() {
    const params = useParams();
    const sessionId = params.sessionId as string;
    const router = useRouter();
    const searchParams = useSearchParams();
    const fromCourse = searchParams.get('from');
    const courseNameParam = searchParams.get('courseName');

    const [students, setStudents] = useState<StudentRosterItem[]>([]);
    const [courseName, setCourseName] = useState('Course');
    const [courseCode, setCourseCode] = useState('');
    const [sessionDate, setSessionDate] = useState<string | null>(null);
    const [topic, setTopic] = useState<string | null>(null);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [notifications, setNotifications] = useState<any[]>([]);

    useEffect(() => {
        const loadRoster = async () => {
            try {
                const [rosterRes, dash] = await Promise.all([
                    apiGet<any>(`/faculty/attendance/sessions/${sessionId}/roster`),
                    DashboardAPI.getFacultyDashboard()
                ]);

                setStudents(rosterRes.roster || []);
                setCourseName(rosterRes.courseName);
                setCourseCode(rosterRes.courseCode);
                setSessionDate(rosterRes.sessionDate);
                setTopic(rosterRes.topic);
                
                setProfile(dash?.profile || null);
                setNotifications(dash?.notifications || []);
            } catch (err: any) {
                setError(err.message || 'Failed to load session roster');
            } finally {
                setLoading(false);
            }
        };
        loadRoster();
    }, [sessionId]);

    const handleMark = (studentId: string, status: 'present' | 'absent' | 'late') => {
        setStudents(prev => prev.map(s =>
            s.id === studentId ? { ...s, status } : s
        ));
    };

    const handleMarkAllPresent = () => {
        setStudents(prev => prev.map(s => ({ ...s, status: 'present' })));
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            const payload = {
                sessionId,
                records: students.map(s => ({
                    studentId: s.id,
                    status: s.status === 'pending' ? 'present' : s.status // Default pending to present
                }))
            };
            await apiPost(`/faculty/attendance`, payload);
            setIsSuccessModalOpen(true);
        } catch (err: any) {
            alert(err.message || 'Failed to save attendance');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'present': return 'bg-sky-100 text-primary border-sky-200';
            case 'absent': return 'bg-error-bg text-error-text border-rose-200';
            case 'late': return 'bg-background text-text-primary border-border';
            default: return 'bg-background text-text-secondary border-border';
        }
    };

    const userName = profile?.fullname || profile?.user?.username || 'Faculty';
    const mappedNotifications = notifications.map(n => ({
        id: n.notificationid.toString(),
        title: n.title,
        message: n.message,
        timestamp: new Date(n.createdat),
        read: n.isread,
        type: 'info' as const
    }));

    if (loading && students.length === 0) {
        return (
            <DashboardLayout userName="Loading..." userRole={UserRole.FACULTY} notifications={[]}>
                <div className="flex justify-center items-center h-[60vh]">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
            currentPath={`/dashboard/faculty/attendance/mark/${sessionId}`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <AdminPageHeader
                    icon={ClipboardList}
                    title="Mark"
                    titleAccent="Attendance"
                    subtitle={`${courseName} (${courseCode}) • ${topic || 'Lecture'} • ${sessionDate ? new Date(sessionDate).toLocaleDateString([], { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : ''}`}
                    eyebrow={{ icon: Home, label: fromCourse && courseNameParam ? "Course Attendance" : "Attendance Dashboard" }}
                    backHref={fromCourse ? `/dashboard/faculty/courses/${fromCourse}?tab=attendance` : "/dashboard/faculty/attendance"}
                    actions={
                        <button
                            onClick={handleMarkAllPresent}
                            className="w-full sm:w-auto px-4 py-2 bg-surface border border-border text-text-primary font-medium rounded-[2px] hover:bg-surface-hover transition-colors flex items-center justify-center gap-2"
                        >
                            <UserCheck className="w-4 h-4" />
                            Mark All Present
                        </button>
                    }
                />

                <div className="flex items-start sm:items-center gap-2 mb-6 text-sm text-primary bg-primary-light px-3 py-2 rounded-[2px] border border-border">
                    <Clock className="w-4 h-4 shrink-0 mt-0.5 sm:mt-0" />
                    <span>Audit Trail Active: Every edit is permanently logged.</span>
                </div>

                <div className="bg-surface rounded-[2px]  border border-border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-background border-b border-border">
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Student</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Roll No</th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-text-secondary uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider w-48">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#EDEBE9]">
                                {students.map((student) => (
                                    <tr key={student.id} className="hover:bg-background/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-[2px] bg-primary-light text-primary flex items-center justify-center font-bold text-xs">
                                                    {student.name.charAt(0)}
                                                </div>
                                                <span className="font-medium text-text-primary">{student.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                                            {student.rollNo}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className={`px-3 py-1 rounded-[2px] text-xs font-semibold border ${getStatusColor(student.status)}`}>
                                                {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleMark(student.id, 'present')}
                                                    className={`p-1.5 rounded-[2px] transition-all ${student.status === 'present' ? 'bg-sky-100 text-primary ring-2 ring-sky-500 ring-offset-1' : 'bg-background text-text-muted hover:bg-primary-light hover:text-primary'}`}
                                                    title="Mark Present"
                                                >
                                                    <CheckCircle2 className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleMark(student.id, 'absent')}
                                                    className={`p-1.5 rounded-[2px] transition-all ${student.status === 'absent' ? 'bg-error-bg text-error-text ring-2 ring-rose-500 ring-offset-1' : 'bg-background text-text-muted hover:bg-error-bg hover:text-error-text'}`}
                                                    title="Mark Absent"
                                                >
                                                    <XCircle className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleMark(student.id, 'late')}
                                                    className={`p-1.5 rounded-[2px] transition-all ${student.status === 'late' ? 'bg-background text-text-primary ring-2 ring-slate-500 ring-offset-1' : 'bg-background text-text-muted hover:bg-surface-hover hover:text-text-secondary'}`}
                                                    title="Mark Late"
                                                >
                                                    <Clock className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Save Button at Bottom */}
                    <div className="p-4 sm:p-6 border-t border-border bg-background">
                        <div className="flex justify-center sm:justify-end">
                            <button
                                onClick={handleSave}
                                className="w-full sm:w-auto px-8 py-3 bg-primary text-white font-semibold rounded-[2px]  shadow-blue-200 hover:bg-primary-hover hover:translate-y-[-1px] transition-all flex items-center justify-center gap-2"
                            >
                                <Save className="w-5 h-5 shrink-0" />
                                Save Attendance
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <Modal
                isOpen={isSuccessModalOpen}
                onClose={() => setIsSuccessModalOpen(false)}
                title="Success!"
                type="success"
            >
                <div className="text-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="p-3 bg-primary-light rounded-[2px] text-primary">
                            <CheckCircle2 className="h-8 w-8" />
                        </div>
                        <p className="text-text-primary mb-2">
                            Attendance has been saved successfully.
                        </p>
                        <div className="text-xs text-text-secondary bg-surface-hover border border-border p-2 rounded-[2px] w-full mb-4 font-mono text-left">
                            <p className="font-bold border-b border-border pb-1 mb-1">Audit Trail Entry</p>
                            <p>Action: Update Attendance</p>
                            <p>User: {userName}</p>
                            <p>Timestamp: {new Date().toLocaleString()}</p>
                            <p>Status: Logged successfully</p>
                        </div>
                        <button
                            onClick={() => router.push('/dashboard/faculty/attendance')}
                            className="w-full px-4 py-2.5 rounded-[2px] bg-primary text-white font-semibold hover:bg-primary-hover  shadow-blue-200 transition-colors"
                        >
                            Back to Attendance
                        </button>
                    </div>
                </div>
            </Modal>

        </DashboardLayout >
    );
}

export default function MarkAttendancePage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-[2px] animate-spin"></div>
            </div>
        }>
            <MarkAttendanceContent />
        </Suspense>
    );
}
