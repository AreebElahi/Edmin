'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
    ArrowLeft, User, Mail, Award, BookOpen, Calendar, DollarSign, 
    FileText, HelpCircle, Landmark, ShieldAlert, Sparkles, Activity, 
    CheckCircle2, XCircle, Clock, Search, AlertCircle, RefreshCw,
    AlertTriangle, Ticket, History, ExternalLink, GraduationCap,
    Check, ArrowUpRight
} from 'lucide-react';
import { useStudentTimeline } from '@/features/studentOversight/hooks/useStudentOversight';

interface StudentProfileContentProps {
    studentId: number;
}

export default function StudentProfileContent({ studentId }: StudentProfileContentProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'attendance' | 'billing' | 'cases' | 'quizzes'>('overview');
    const { data: timelineData, isLoading, refetch } = useStudentTimeline(studentId);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] text-text-muted font-bold gap-3">
                <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                Loading 360° Student Profile...
            </div>
        );
    }

    if (!timelineData) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] text-text-secondary font-bold gap-4 p-8 text-center bg-surface rounded-[2px] border border-border shadow-none max-w-lg mx-auto mt-20">
                <ShieldAlert className="w-16 h-16 text-rose-500" />
                <div>
                    <h3 className="text-xl font-semibold text-text-primary">Student Profile Not Found</h3>
                    <p className="text-sm text-text-muted mt-1">The student profile does not exist or has been deleted.</p>
                </div>
                <Link 
                    href="/dashboard/admin/student/directory"
                    className="bg-primary hover:bg-primary-hover text-white font-bold px-6 py-3 rounded-[2px] transition-all text-sm"
                >
                    Return to Directory
                </Link>
            </div>
        );
    }

    const { student, enrollmentHistory, attendanceLogs, invoices, scholarships, tickets, auditLogs, quizAttempts } = timelineData;

    // Calculate billing summary
    const totalBilled = invoices.reduce((acc, inv) => acc + inv.totalamount, 0);
    const totalPaid = invoices.reduce((acc, inv) => acc + inv.amountpaid, 0);
    const outstandingBalance = totalBilled - totalPaid;

    const profileTabs = [
        { id: 'overview', label: '360° Overview', icon: Activity },
        { id: 'courses', label: 'Courses & Grades', icon: BookOpen },
        { id: 'attendance', label: 'Attendance History', icon: Calendar },
        { id: 'billing', label: 'Invoices & Billing', icon: DollarSign },
        { id: 'quizzes', label: 'Quiz Performance', icon: Award },
        { id: 'cases', label: 'Tickets & Audits', icon: ShieldAlert },
    ];

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Back Nav */}
            <div className="mb-6">
                <Link 
                    href="/dashboard/admin/student/directory" 
                    className="inline-flex items-center gap-2 text-xs font-bold text-text-secondary hover:text-text-primary bg-background hover:bg-slate-200/80 px-4 py-2.5 rounded-[2px] transition-all"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Student Roster
                </Link>
            </div>

            {/* Profile Header Header Panel */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 sm:p-10 text-white shadow-none mb-8 border border-white/5">
                <div className="absolute top-0 right-0 -mr-24 -mt-24 h-72 w-72 rounded-[2px] bg-primary-light0 opacity-20 blur-3xl"></div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-[2px] bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center border-4 border-white/10 shadow-none text-white text-3xl sm:text-4xl font-semibold shrink-0">
                            {student.fullname ? student.fullname.charAt(0) : <User className="w-10 h-10" />}
                            {student.status === 'ACTIVE' && (
                                <span className="absolute bottom-0 right-0 w-5 h-5 rounded-[2px] bg-background0 border-4 border-slate-900"></span>
                            )}
                        </div>
                        <div>
                            <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                                <h1 className="text-2xl sm:text-3xl font-semibold leading-none">{student.fullname}</h1>
                                <span className={`px-2.5 py-1 rounded-[2px] text-[9px] font-semibold tracking-wider uppercase ${
                                    student.status === 'ACTIVE' ? 'bg-background0/20 text-emerald-300' :
                                    student.status === 'SUSPENDED' ? 'bg-error-bg0/20 text-rose-300' : 'bg-surface/10 text-slate-300'
                                }`}>{student.status}</span>
                            </div>
                            <p className="text-text-muted text-xs sm:text-sm font-semibold flex items-center gap-2">
                                <Mail className="w-4 h-4 text-text-secondary" /> {student.email}
                            </p>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs font-bold text-text-muted">
                                <span>Roll No: <strong className="text-slate-200 font-mono">{student.rollnumber}</strong></span>
                                <span>Dept: <strong className="text-slate-200">{student.department} ({student.departmentCode})</strong></span>
                                <span>Current: <strong className="text-slate-200">{student.semester}</strong></span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats Header Summary */}
                    <div className="bg-surface/5  px-5 py-4 rounded-[2px] border border-white/10 flex items-center gap-6 self-start md:self-auto">
                        <div className="text-center">
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-300">CGPA</p>
                            <p className="font-mono font-semibold text-2xl text-white mt-1">{student.cgpa.toFixed(2)}</p>
                        </div>
                        <div className="w-px h-8 bg-surface/10"></div>
                        <div className="text-center">
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-300">Attendance</p>
                            <p className="font-mono font-semibold text-2xl text-emerald-400 mt-1">{student.attendanceRate}%</p>
                        </div>
                        <div className="w-px h-8 bg-surface/10"></div>
                        <div className="text-center">
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-300">Credits Completed</p>
                            <p className="font-mono font-semibold text-2xl text-blue-400 mt-1">{student.completedCredits}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Profile Tab Navigation */}
            <div className="flex overflow-x-auto scrollbar-hide gap-2 mb-8 bg-surface p-2 rounded-[2px] shadow-none border border-border">
                {profileTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`whitespace-nowrap px-6 py-3.5 font-bold text-xs rounded-[2px] transition-all flex items-center gap-2 shrink-0 ${
                                isActive 
                                    ? 'bg-primary text-white shadow-none shadow-blue-500/10' 
                                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                            }`}
                        >
                            <Icon className="w-4 h-4" /> {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Content Area */}
            <div className="bg-surface rounded-[2.5rem] border border-border shadow-none p-8 min-h-[400px]">
                {/* Tab 1: Overview */}
                {activeTab === 'overview' && (
                    <div className="space-y-8 animate-in fade-in">
                        {/* Summary Widgets */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-surface-hover border border-border/60 rounded-[2px] p-6 flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-xs font-semibold uppercase tracking-widest text-text-muted">Financial Summary</h4>
                                    <DollarSign className="w-5 h-5 text-primary" />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm font-semibold">
                                        <span className="text-text-secondary">Total Billed:</span>
                                        <span className="text-text-primary font-mono">${totalBilled.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm font-semibold">
                                        <span className="text-text-secondary">Paid:</span>
                                        <span className="text-text-primary font-mono">${totalPaid.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm font-semibold border-t border-border/60 pt-2">
                                        <span className="text-text-primary">Outstanding Balance:</span>
                                        <span className={`font-mono ${outstandingBalance > 0 ? 'text-error-text' : 'text-success-text'}`}>
                                            ${outstandingBalance.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-surface-hover border border-border/60 rounded-[2px] p-6 flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-xs font-semibold uppercase tracking-widest text-text-muted">Academic Standing</h4>
                                    <Award className="w-5 h-5 text-primary" />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm font-semibold">
                                        <span className="text-text-secondary">Current CGPA:</span>
                                        <span className="font-mono font-bold text-text-primary">{student.cgpa.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm font-semibold">
                                        <span className="text-text-secondary">Completed Credits:</span>
                                        <span className="font-mono font-bold text-text-primary">{student.completedCredits} hrs</span>
                                    </div>
                                    <div className="flex justify-between text-sm font-semibold border-t border-border/60 pt-2">
                                        <span className="text-text-primary">Audit Status:</span>
                                        <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded ${student.cgpa < 2.0 ? 'bg-error-bg text-error-text' : 'bg-background text-success-text'}`}>
                                            {student.cgpa < 2.0 ? 'Academic Probation' : 'Good Standing'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-surface-hover border border-border/60 rounded-[2px] p-6 flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-xs font-semibold uppercase tracking-widest text-text-muted">Active Scholarships</h4>
                                    <Landmark className="w-5 h-5 text-primary" />
                                </div>
                                <div className="space-y-3">
                                    {scholarships.length === 0 ? (
                                        <p className="text-xs font-bold text-text-muted italic py-2">No active waivers registered.</p>
                                    ) : (
                                        scholarships.map(sch => (
                                            <div key={sch.scholarshipid} className="flex justify-between items-center text-sm font-semibold bg-surface p-2.5 rounded-[2px] border border-border">
                                                <span className="text-text-secondary">Tuition Waiver:</span>
                                                <span className="font-mono font-semibold text-purple-700">{sch.discountpercentage}% Discount</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Direct Timeline */}
                        <div className="border border-border rounded-[2px] p-6">
                            <h3 className="text-lg font-semibold text-text-primary mb-5 flex items-center gap-2"><Activity className="w-5 h-5 text-primary" /> 360° Activity Summary</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Academics & Tests</h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center text-xs font-semibold text-text-secondary bg-surface-hover px-4 py-3 rounded-[2px]">
                                            <span>Enrolled Courses</span>
                                            <span className="font-mono font-bold text-text-primary">{enrollmentHistory.length}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs font-semibold text-text-secondary bg-surface-hover px-4 py-3 rounded-[2px]">
                                            <span>Completed Courses</span>
                                            <span className="font-mono font-bold text-text-primary">{enrollmentHistory.filter(e => e.status === 'COMPLETED').length}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs font-semibold text-text-secondary bg-surface-hover px-4 py-3 rounded-[2px]">
                                            <span>Quiz Attempts Record</span>
                                            <span className="font-mono font-bold text-text-primary">{quizAttempts.length}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Support Cases & Actions</h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center text-xs font-semibold text-text-secondary bg-surface-hover px-4 py-3 rounded-[2px]">
                                            <span>Support Tickets Opened</span>
                                            <span className={`font-mono font-bold ${tickets.length > 0 ? 'text-warning-text' : 'text-text-primary'}`}>{tickets.length} tickets</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs font-semibold text-text-secondary bg-surface-hover px-4 py-3 rounded-[2px]">
                                            <span>Administrative Changes</span>
                                            <span className="font-mono font-bold text-text-primary">{auditLogs.length} events logged</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab 2: Courses */}
                {activeTab === 'courses' && (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="overflow-x-auto">
                            {enrollmentHistory.length === 0 ? (
                                <div className="text-center py-10 text-text-muted font-bold">No enrollment records available.</div>
                            ) : (
                                <table className="w-full text-left text-sm text-text-secondary">
                                    <thead className="bg-surface-hover text-text-muted text-[10px] uppercase tracking-widest font-semibold border-b border-border">
                                        <tr>
                                            <th className="px-6 py-4">Course Name</th>
                                            <th className="px-6 py-4">Code</th>
                                            <th className="px-6 py-4">Credits</th>
                                            <th className="px-6 py-4">Semester</th>
                                            <th className="px-6 py-4">Enrollment Status</th>
                                            <th className="px-6 py-4">Grade Received</th>
                                            <th className="px-6 py-4 text-right pr-6">Grade Points</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {enrollmentHistory.map((course) => (
                                            <tr key={course.courseenrollmentid} className="hover:bg-surface-hover/50 transition-colors">
                                                <td className="px-6 py-4 font-bold text-text-primary">{course.courseName}</td>
                                                <td className="px-6 py-4 font-mono font-bold text-text-secondary text-xs">{course.courseCode}</td>
                                                <td className="px-6 py-4 font-bold text-text-primary">{course.credits} hrs</td>
                                                <td className="px-6 py-4 text-xs font-semibold text-text-secondary">{course.semester}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-0.5 rounded-[2px] text-[9px] font-semibold tracking-wider uppercase ${
                                                        course.status === 'COMPLETED' ? 'bg-background text-success-text' :
                                                        course.status === 'ENROLLED' ? 'bg-primary-light text-primary' : 'bg-background text-text-secondary'
                                                    }`}>{course.status}</span>
                                                </td>
                                                <td className="px-6 py-4 font-mono font-semibold text-text-primary">{course.grade}</td>
                                                <td className="px-6 py-4 text-right pr-6 font-mono font-bold text-text-secondary">
                                                    {course.gradepoints !== null && course.gradepoints !== undefined ? course.gradepoints.toFixed(1) : '---'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}

                {/* Tab 3: Attendance */}
                {activeTab === 'attendance' && (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="overflow-x-auto">
                            {attendanceLogs.length === 0 ? (
                                <div className="text-center py-10 text-text-muted font-bold">No attendance records recorded.</div>
                            ) : (
                                <table className="w-full text-left text-sm text-text-secondary">
                                    <thead className="bg-surface-hover text-text-muted text-[10px] uppercase tracking-widest font-semibold border-b border-border">
                                        <tr>
                                            <th className="px-6 py-4">Session Date</th>
                                            <th className="px-6 py-4">Class Topic</th>
                                            <th className="px-6 py-4 text-right pr-6">Attendance Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {attendanceLogs.map((log) => (
                                            <tr key={log.attendanceid} className="hover:bg-surface-hover/50 transition-colors">
                                                <td className="px-6 py-4 font-mono font-semibold text-text-secondary text-xs">
                                                    {new Date(log.date).toLocaleDateString()} {new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </td>
                                                <td className="px-6 py-4 font-bold text-text-primary">{log.topic}</td>
                                                <td className="px-6 py-4 text-right pr-6">
                                                    <span className={`px-2.5 py-1.5 rounded-[2px] text-[10px] font-semibold tracking-wider uppercase ${
                                                        log.status === 'PRESENT' ? 'bg-background text-success-text' :
                                                        log.status === 'ABSENT' ? 'bg-error-bg text-error-text' : 'bg-warning-bg text-warning-text'
                                                    }`}>{log.status}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}

                {/* Tab 4: Billing */}
                {activeTab === 'billing' && (
                    <div className="space-y-8 animate-in fade-in">
                        <div className="space-y-4">
                            <h3 className="text-base font-semibold text-text-primary">Invoice Timeline</h3>
                            <div className="overflow-x-auto border border-border rounded-[2px]">
                                {invoices.length === 0 ? (
                                    <p className="text-center py-10 text-text-muted font-bold">No invoice history available.</p>
                                ) : (
                                    <table className="w-full text-left text-sm text-text-secondary">
                                        <thead className="bg-surface-hover text-text-muted text-[10px] uppercase tracking-widest font-semibold border-b border-border">
                                            <tr>
                                                <th className="px-6 py-4">Invoice ID</th>
                                                <th className="px-6 py-4">Total Amount</th>
                                                <th className="px-6 py-4">Amount Paid</th>
                                                <th className="px-6 py-4">Due Date</th>
                                                <th className="px-6 py-4">Status</th>
                                                <th className="px-6 py-4 text-right pr-6">Recorded Payments</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {invoices.map((inv) => (
                                                <tr key={inv.invoiceid} className="hover:bg-surface-hover/50 transition-colors">
                                                    <td className="px-6 py-4 font-mono font-bold text-text-primary text-xs">#INV-{inv.invoiceid}</td>
                                                    <td className="px-6 py-4 font-mono font-bold text-text-primary">${inv.totalamount.toLocaleString()}</td>
                                                    <td className="px-6 py-4 font-mono font-medium text-text-secondary">${inv.amountpaid.toLocaleString()}</td>
                                                    <td className="px-6 py-4 font-mono text-xs font-semibold text-text-muted">{new Date(inv.duedate).toLocaleDateString()}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2.5 py-1 rounded-[2px] text-[10px] font-semibold tracking-wider uppercase ${
                                                            inv.status === 'PAID' ? 'bg-background text-success-text' :
                                                            inv.status === 'PARTIAL' ? 'bg-warning-bg text-warning-text' : 'bg-error-bg text-error-text'
                                                        }`}>{inv.status}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right pr-6">
                                                        <div className="inline-flex flex-col gap-1 items-end">
                                                            {inv.payments.length === 0 ? (
                                                                <span className="text-text-muted text-xs italic">No transactions</span>
                                                            ) : (
                                                                inv.payments.map((pay) => (
                                                                    <div key={pay.paymentid} className="text-[10px] font-bold text-text-secondary bg-surface-hover px-2 py-0.5 rounded border border-border">
                                                                        ${pay.amount} ({pay.method}) on {new Date(pay.createdat).toLocaleDateString()}
                                                                    </div>
                                                                ))
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab 5: Quizzes */}
                {activeTab === 'quizzes' && (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="overflow-x-auto">
                            {quizAttempts.length === 0 ? (
                                <div className="text-center py-10 text-text-muted font-bold">No quiz attempt submissions found.</div>
                            ) : (
                                <table className="w-full text-left text-sm text-text-secondary">
                                    <thead className="bg-surface-hover text-text-muted text-[10px] uppercase tracking-widest font-semibold border-b border-border">
                                        <tr>
                                            <th className="px-6 py-4">Attempt ID</th>
                                            <th className="px-6 py-4">Score</th>
                                            <th className="px-6 py-4 text-right pr-6">Submission Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {quizAttempts.map((attempt) => (
                                            <tr key={attempt.quizattemptid} className="hover:bg-surface-hover/50 transition-colors">
                                                <td className="px-6 py-4 font-mono font-bold text-text-primary text-xs">#QA-{attempt.quizattemptid}</td>
                                                <td className="px-6 py-4">
                                                    <span className="font-mono font-semibold text-primary text-sm">{attempt.score.toFixed(1)}</span>
                                                </td>
                                                <td className="px-6 py-4 text-right pr-6 font-mono font-semibold text-text-muted text-xs">
                                                    {new Date(attempt.attemptdate).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}

                {/* Tab 6: Cases */}
                {activeTab === 'cases' && (
                    <div className="space-y-8 animate-in fade-in">
                        {/* Support Tickets */}
                        <div className="space-y-4">
                            <h3 className="text-base font-semibold text-text-primary flex items-center gap-2"><Ticket className="w-4 h-4 text-text-muted" /> Support Tickets Opened</h3>
                            <div className="overflow-x-auto border border-border rounded-[2px]">
                                {tickets.length === 0 ? (
                                    <p className="text-center py-8 text-text-muted font-bold">No support requests opened.</p>
                                ) : (
                                    <table className="w-full text-left text-sm text-text-secondary">
                                        <thead className="bg-surface-hover text-text-muted text-[10px] uppercase tracking-widest font-semibold border-b border-border">
                                            <tr>
                                                <th className="px-6 py-4">Ticket ID</th>
                                                <th className="px-6 py-4">Subject</th>
                                                <th className="px-6 py-4">Priority</th>
                                                <th className="px-6 py-4">Assignee</th>
                                                <th className="px-6 py-4">Created At</th>
                                                <th className="px-6 py-4 text-right pr-6">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {tickets.map((t) => (
                                                <tr key={t.id} className="hover:bg-surface-hover/50 transition-colors">
                                                    <td className="px-6 py-4 font-mono font-bold text-text-secondary text-xs">#TCK-{t.id}</td>
                                                    <td className="px-6 py-4 font-bold text-text-primary">{t.subject}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-0.5 rounded-[2px] text-[9px] font-semibold uppercase tracking-wider ${
                                                            t.priority === 'High' || t.priority === 'CRITICAL' ? 'bg-error-bg text-error-text' :
                                                            t.priority === 'Medium' ? 'bg-warning-bg text-warning-text' : 'bg-primary-light text-primary'
                                                        }`}>{t.priority}</span>
                                                    </td>
                                                    <td className="px-6 py-4 font-semibold text-text-secondary text-xs">{t.assignee}</td>
                                                    <td className="px-6 py-4 font-mono text-xs text-text-muted">{new Date(t.created_at).toLocaleDateString()}</td>
                                                    <td className="px-6 py-4 text-right pr-6">
                                                        <span className={`px-2.5 py-1 rounded-[2px] text-[10px] font-semibold tracking-wider uppercase ${
                                                            t.status === 'RESOLVED' ? 'bg-background text-success-text' : 'bg-warning-bg text-warning-text'
                                                        }`}>{t.status}</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>

                        {/* Audit Log */}
                        <div className="space-y-4">
                            <h3 className="text-base font-semibold text-text-primary flex items-center gap-2"><History className="w-4 h-4 text-text-muted" /> Administrative Audit Log</h3>
                            <div className="overflow-x-auto border border-border rounded-[2px]">
                                {auditLogs.length === 0 ? (
                                    <p className="text-center py-8 text-text-muted font-bold">No administrative changes logged.</p>
                                ) : (
                                    <table className="w-full text-left text-sm text-text-secondary">
                                        <thead className="bg-surface-hover text-text-muted text-[10px] uppercase tracking-widest font-semibold border-b border-border">
                                            <tr>
                                                <th className="px-6 py-4">Timestamp</th>
                                                <th className="px-6 py-4">Action</th>
                                                <th className="px-6 py-4">Old State</th>
                                                <th className="px-6 py-4 text-right pr-6">New State Override</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {auditLogs.map((log) => (
                                                <tr key={log.auditlogid} className="hover:bg-surface-hover/50 transition-colors">
                                                    <td className="px-6 py-4 font-mono font-medium text-text-muted text-xs">
                                                        {new Date(log.createdat).toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="bg-background text-text-primary text-xs font-bold px-2.5 py-1 rounded-[2px]">
                                                            {log.action}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-xs font-semibold text-text-secondary font-mono">
                                                        {log.oldvalues ? JSON.stringify(log.oldvalues) : 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4 text-right pr-6 text-xs font-semibold text-text-secondary font-mono">
                                                        {log.newvalues ? JSON.stringify(log.newvalues) : 'N/A'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
