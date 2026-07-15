'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { UserRole } from '@/types/types';
import { 
    BarChart3, Users, FileSpreadsheet,
    CalendarCheck, GraduationCap, ArrowDownToLine, FileIcon,
    CheckCircle2, Clock, XCircle, Activity
} from 'lucide-react';
import { useState } from 'react';
import { 
    useAttendanceReport, 
    useEnrollmentReport, 
    useLeaveReportSummary, 
    useGradeDistributionReport 
} from '@/features/reports/hooks/useReports';
import { reportsApi } from '@/features/reports/api/reportsApi';

import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
export default function ReportsAnalyticsPage() {
    const { data: currentUser } = useCurrentUser();
    const [activeTab, setActiveTab] = useState<'attendance' | 'enrollment' | 'leaves' | 'grades' | 'usage'>('attendance');

    // React Query Hooks
    const { data: attendanceData = [], isLoading: isLoadingAttendance } = useAttendanceReport();
    const { data: enrollmentData = [], isLoading: isLoadingEnrollment } = useEnrollmentReport();
    const { data: leaveData, isLoading: isLoadingLeaves } = useLeaveReportSummary();
    const { data: gradesData = [], isLoading: isLoadingGrades } = useGradeDistributionReport();

    const handleExport = (format: 'PDF' | 'CSV') => {
        const url = reportsApi.exportReportsUrl(format);
        window.open(url, '_blank');
    };

    return (
        <DashboardLayout userRole={UserRole.ADMIN} userName={currentUser?.fullName || 'Admin'} notifications={[]}>
            <div className="max-w-7xl mx-auto px-4 py-8">
                
                {/* Header Panel */}
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-semibold text-text-primary ">Data Intelligence & Reports</h1>
                        <p className="text-text-secondary text-sm mt-1">Generate, visualize, and export institutional performance metrics globally.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <button onClick={() => handleExport('PDF')} className="w-full sm:w-auto bg-error-text hover:bg-[#8B1D1D] text-white font-bold px-4 py-3 sm:py-2.5 rounded-[2px] flex items-center justify-center gap-2 shadow-none transition-all text-sm "><FileIcon className="w-4 h-4"/> Export PDF</button>
                        <button onClick={() => handleExport('CSV')} className="w-full sm:w-auto bg-primary hover:bg-primary-hover text-white font-bold px-4 py-3 sm:py-2.5 rounded-[2px] flex items-center justify-center gap-2 shadow-none transition-all text-sm "><ArrowDownToLine className="w-4 h-4"/> Export CSV</button>
                    </div>
                </div>

                {/* Tabs - Scrollable on Mobile */}
                <div className="flex overflow-x-auto scrollbar-hide md:flex-wrap gap-2 mb-8 bg-surface p-2 rounded-[2px] shadow-none border border-border w-full md:w-fit">
                    <button onClick={() => setActiveTab('attendance')} className={`whitespace-nowrap px-5 py-3 font-bold text-sm rounded-[2px] transition-all flex items-center gap-2 shrink-0 ${activeTab === 'attendance' ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'}`}><CalendarCheck className="w-4 h-4"/> Attendance</button>
                    <button onClick={() => setActiveTab('enrollment')} className={`whitespace-nowrap px-5 py-3 font-bold text-sm rounded-[2px] transition-all flex items-center gap-2 shrink-0 ${activeTab === 'enrollment' ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'}`}><Users className="w-4 h-4"/> Enrollments</button>
                    <button onClick={() => setActiveTab('leaves')} className={`whitespace-nowrap px-5 py-3 font-bold text-sm rounded-[2px] transition-all flex items-center gap-2 shrink-0 ${activeTab === 'leaves' ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'}`}><FileSpreadsheet className="w-4 h-4"/> Leave Reports</button>
                    <button onClick={() => setActiveTab('grades')} className={`whitespace-nowrap px-5 py-3 font-bold text-sm rounded-[2px] transition-all flex items-center gap-2 shrink-0 ${activeTab === 'grades' ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'}`}><GraduationCap className="w-4 h-4"/> Grade Distribution</button>
                    </div>

                <div className="bg-surface rounded-[2px] p-6 md:p-8 shadow-none border border-border animate-in fade-in slide-in-from-bottom-4">
                    
                    {/* ATTENDANCE */}
                    {activeTab === 'attendance' && (
                        <div>
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                                <h2 className="text-xl font-bold text-text-primary">Global Attendance Registry</h2>
                            </div>
                            <div className="overflow-x-auto -mx-6 sm:mx-0 px-6 sm:px-0">
                                {isLoadingAttendance ? (
                                    <div className="text-center py-8 text-text-secondary font-medium">Loading attendance metrics...</div>
                                ) : (
                                    <table className="w-full text-left text-sm text-text-secondary whitespace-nowrap sm:whitespace-normal">
                                        <thead className="bg-surface-hover text-text-muted text-[10px] uppercase tracking-widest font-semibold">
                                            <tr><th className="p-4">Entity Unit</th><th className="p-4">Total Students</th><th className="p-4">Avg Attendance</th><th className="p-4">Defaulters (&lt;75%)</th></tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {attendanceData.map((row, idx) => (
                                                <tr key={idx}>
                                                    <td className="p-4 font-bold text-text-primary">{row.unit}</td>
                                                    <td className="p-4">{row.totalStudents}</td>
                                                    <td className="p-4 font-semibold text-success-text">{row.avgAttendance}</td>
                                                    <td className="p-4 text-rose-500 font-bold">{row.defaulters}</td>
                                                </tr>
                                            ))}
                                            {attendanceData.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="text-center py-6 text-text-muted">No attendance data found.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ENROLLMENT */}
                    {activeTab === 'enrollment' && (
                        <div>
                            <h2 className="text-xl font-bold text-text-primary mb-6">Course Capacity & Enrollment Analysis</h2>
                            {isLoadingEnrollment ? (
                                <div className="text-center py-8 text-text-secondary font-medium">Loading enrollment data...</div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {enrollmentData.map((c, idx) => {
                                        const pct = c.capacity > 0 ? (c.enrolled / c.capacity) * 100 : 0;
                                        return (
                                            <div key={`${c.code}-${idx}`} className={`border rounded-[2px] p-5 ${c.enrolled >= c.capacity ? 'bg-error-bg/30 border-border' : 'bg-primary-light/30 border-border'}`}>
                                                <h4 className="font-bold text-text-primary">{c.code} — {c.name}</h4>
                                                <p className="text-sm font-medium text-text-secondary mb-4">{c.dept}</p>
                                                <div className="w-full bg-slate-200 rounded-[2px] h-2 mb-2">
                                                    <div className={`h-2 rounded-[2px] ${c.enrolled >= c.capacity ? 'bg-error-bg0' : 'bg-blue-600'}`} style={{width: `${Math.min(pct, 100)}%`}}></div>
                                                </div>
                                                <div className="flex justify-between text-xs font-bold text-text-secondary">
                                                    <span>{c.enrolled} Enrolled</span>
                                                    <span className={c.enrolled >= c.capacity ? 'text-rose-500' : ''}>
                                                        {c.enrolled >= c.capacity ? `Full (${c.capacity})` : `Capacity: ${c.capacity}`}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {enrollmentData.length === 0 && (
                                        <div className="col-span-3 text-center py-6 text-text-muted">No enrollment records found.</div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* LEAVE REPORTS */}
                    {activeTab === 'leaves' && (
                        <div>
                            <h2 className="text-xl font-bold text-text-primary mb-6">Leave Application Reports</h2>
                            {isLoadingLeaves ? (
                                <div className="text-center py-8 text-text-secondary font-medium">Loading leave aggregates...</div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                                        <div className="bg-warning-bg border border-border rounded-[2px] p-4 text-center"><Clock className="w-6 h-6 text-amber-500 mx-auto mb-1"/><p className="text-2xl font-semibold text-warning-text">{leaveData?.summary?.pending || 0}</p><p className="text-xs font-bold text-warning-text">Pending</p></div>
                                        <div className="bg-background border border-border rounded-[2px] p-4 text-center"><CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1"/><p className="text-2xl font-semibold text-success-text">{leaveData?.summary?.approved || 0}</p><p className="text-xs font-bold text-success-text">Approved</p></div>
                                        <div className="bg-error-bg border border-border rounded-[2px] p-4 text-center"><XCircle className="w-6 h-6 text-rose-500 mx-auto mb-1"/><p className="text-2xl font-semibold text-error-text">{leaveData?.summary?.rejected || 0}</p><p className="text-xs font-bold text-error-text">Rejected</p></div>
                                    </div>
                                    <div className="overflow-x-auto -mx-6 sm:mx-0 px-6 sm:px-0">
                                        <table className="w-full text-left text-sm text-text-secondary whitespace-nowrap sm:whitespace-normal">
                                            <thead className="bg-surface-hover text-text-muted text-[10px] uppercase tracking-widest font-semibold">
                                                <tr><th className="p-4">Applicant</th><th className="p-4">Department</th><th className="p-4">Type</th><th className="p-4">Days</th><th className="p-4 text-right">Status</th></tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {leaveData?.list?.map((row, idx) => (
                                                    <tr key={idx}>
                                                        <td className="p-4 font-bold text-text-primary">{row.applicant}</td>
                                                        <td className="p-4 text-text-secondary">{row.department}</td>
                                                        <td className="p-4">{row.type}</td>
                                                        <td className="p-4 font-bold">{row.days}</td>
                                                        <td className="p-4 text-right">
                                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded ${row.status === 'Approved' ? 'bg-background text-success-text' : row.status === 'Rejected' ? 'bg-error-bg text-error-text' : 'bg-warning-bg text-warning-text'}`}>
                                                                {row.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* GRADE DISTRIBUTION */}
                    {activeTab === 'grades' && (
                        <div>
                            <h2 className="text-xl font-bold text-text-primary mb-6">Academic Performance — Grade Distribution per Course</h2>
                            {isLoadingGrades ? (
                                <div className="text-center py-8 text-text-secondary font-medium">Loading performance grades...</div>
                            ) : (
                                <div className="space-y-6">
                                    {gradesData.map((item, idx) => (
                                        <div key={`${item.course}-${idx}`} className="border border-border rounded-[2px] p-5">
                                            <h4 className="font-bold text-text-primary mb-4">{item.course}</h4>
                                            <div className="flex gap-2 items-end">
                                                {Object.entries(item.grades).map(([grade, pct]) => (
                                                    <div key={grade} className="flex-1 flex flex-col items-center gap-1">
                                                        <span className="text-xs font-semibold text-text-secondary">{pct}%</span>
                                                        <div className={`w-full rounded-t-md transition-all ${grade === 'A' ? 'bg-emerald-400' : grade === 'B' ? 'bg-blue-400' : grade === 'C' ? 'bg-amber-400' : grade === 'D' ? 'bg-orange-400' : 'bg-error-bg0'}`} style={{height: `${pct * 2}px`}}></div>
                                                        <span className="text-xs font-semibold text-text-primary">{grade}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    {gradesData.length === 0 && (
                                        <div className="text-center py-6 text-text-muted">No grading distributions found.</div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
