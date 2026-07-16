'use client';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
    Search, Filter, User, BookOpen, BarChart3, Award, Users, 
    AlertTriangle, Shield, CheckCircle2, XCircle, ArrowRight, 
    ChevronRight, RefreshCw, Download, Calendar, ExternalLink,
    AlertCircle, Check, X, ShieldAlert, Sparkles, FileText, Landmark
} from 'lucide-react';
import { 
    useStudentDirectory, 
    useEnrollmentRequests, 
    useOverrideEnrollment, 
    useAcademicProgress,
    useAttendanceAnalytics,
    useAtRiskStudents, 
    useScholarships 
} from '@/features/studentOversight/hooks/useStudentOversight';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminTabBar from '@/components/admin/AdminTabBar';
import AdminFilterBar from '@/components/admin/AdminFilterBar';
import AdminStatusBadge from '@/components/admin/AdminStatusBadge';
import AdminActionIconButton from '@/components/admin/AdminActionIconButton';

interface StudentManagementContentProps {
    activeTab: 'directory' | 'enrollment' | 'progress' | 'attendance' | 'at-risk' | 'scholarships' | 'promotion';
}

export default function StudentManagementContent({ activeTab }: StudentManagementContentProps) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [deptFilter, setDeptFilter] = useState('ALL');
    const [semesterFilter, setSemesterFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [riskFilter, setRiskFilter] = useState('ALL');

    // Override State
    const [selectedOverrideId, setSelectedOverrideId] = useState<number | null>(null);
    const [overrideComment, setOverrideComment] = useState('');
    const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);

    // Queries
    const { data: directory = [], isLoading: loadingDir, refetch: refetchDir } = useStudentDirectory();
    const { data: enrollments = [], isLoading: loadingEnroll, refetch: refetchEnroll } = useEnrollmentRequests();
    const { data: progress = [], isLoading: loadingProg, refetch: refetchProg } = useAcademicProgress();
    const { data: attendance = [], isLoading: loadingAtt, refetch: refetchAtt } = useAttendanceAnalytics();
    const { data: atRisk = [], isLoading: loadingRisk, refetch: refetchRisk } = useAtRiskStudents();
    const { data: scholarships = [], isLoading: loadingSchol, refetch: refetchSchol } = useScholarships();

    const overrideMutation = useOverrideEnrollment();

    // Tabs configuration
    const tabs = [
        { id: 'directory', label: 'Directory', icon: Users, desc: 'Complete student roster & status' },
        { id: 'enrollment', label: 'Enrollment Oversight', icon: BookOpen, desc: 'Approve & override course enrollments' },
        { id: 'progress', label: 'Academic Progress', icon: BarChart3, desc: 'CGPA, GPA & credit tracking' },
        { id: 'attendance', label: 'Attendance Analytics', icon: Calendar, desc: 'Course session compliance' },
        { id: 'at-risk', label: 'At-Risk Students', icon: AlertTriangle, desc: 'Critical performance & compliance alerts' },
        { id: 'scholarships', label: 'Scholarships', icon: Landmark, desc: 'Financial support & fee waivers' },
    ];

    const handleTabChange = (tabId: string) => {
        router.push(`/dashboard/admin/student/${tabId}`);
    };

    const handleOverrideSubmit = (action: 'APPROVE' | 'REJECT') => {
        if (!selectedOverrideId) return;
        overrideMutation.mutate({
            id: selectedOverrideId,
            data: { action, comment: overrideComment }
        }, {
            onSuccess: () => {
                setIsOverrideModalOpen(false);
                setSelectedOverrideId(null);
                setOverrideComment('');
            }
        });
    };

    // Helper to get unique departments for filtering
    const getUniqueDepartments = () => {
        const set = new Set<string>();
        if (activeTab === 'directory') directory.forEach(s => s.department && set.add(s.department));
        if (activeTab === 'enrollment') enrollments.forEach(s => s.department && set.add(s.department));
        if (activeTab === 'progress') progress.forEach(s => s.department && set.add(s.department));
        if (activeTab === 'attendance') attendance.forEach(s => s.department && set.add(s.department));
        if (activeTab === 'at-risk') atRisk.forEach(s => s.department && set.add(s.department));
        if (activeTab === 'scholarships') scholarships.forEach(s => s.department && set.add(s.department));
        return Array.from(set);
    };

    // Helper to get unique semesters for filtering
    const getUniqueSemesters = () => {
        const set = new Set<string>();
        if (activeTab === 'directory') directory.forEach(s => s.semester && set.add(s.semester));
        if (activeTab === 'enrollment') enrollments.forEach(s => s.semester && set.add(s.semester));
        if (activeTab === 'progress') progress.forEach(s => s.semester && set.add(s.semester));
        if (activeTab === 'attendance') attendance.forEach(s => s.semester && set.add(s.semester));
        if (activeTab === 'at-risk') atRisk.forEach(s => s.semester && set.add(s.semester));
        return Array.from(set);
    };

    const depts = getUniqueDepartments();
    const semesters = getUniqueSemesters();

    // Filters application
    const filterAndSearch = <T extends Record<string, any>>(list: T[], searchFields: (keyof T)[]): T[] => {
        return list.filter(item => {
            // Search
            if (searchQuery.trim() !== '') {
                const query = searchQuery.toLowerCase();
                const matchesSearch = searchFields.some(field => {
                    const val = item[field];
                    return val && val.toString().toLowerCase().includes(query);
                });
                if (!matchesSearch) return false;
            }
            // Dept
            if (deptFilter !== 'ALL' && item.department !== deptFilter) return false;
            // Semester
            if (semesterFilter !== 'ALL' && item.semester !== semesterFilter) return false;
            // Status (if exists)
            if (statusFilter !== 'ALL') {
                if (item.status && item.status !== statusFilter) return false;
                if (item.graduationStatus && item.graduationStatus !== statusFilter) return false;
            }
            // Risk
            if (riskFilter !== 'ALL' && item.riskLevel !== riskFilter && item.riskStatus !== riskFilter) return false;

            return true;
        });
    };

    const filterOptions = [];
    filterOptions.push({
        id: 'dept',
        label: 'Department',
        value: deptFilter,
        onChange: setDeptFilter,
        options: [
            { label: 'All Departments', value: 'ALL' },
            ...depts.map(d => ({ label: d, value: d }))
        ]
    });
    
    if (activeTab !== 'scholarships') {
        filterOptions.push({
            id: 'semester',
            label: 'Semester',
            value: semesterFilter,
            onChange: setSemesterFilter,
            options: [
                { label: 'All Semesters', value: 'ALL' },
                ...semesters.map(s => ({ label: s, value: s }))
            ]
        });
    }

    if (activeTab === 'directory') {
        filterOptions.push({
            id: 'status',
            label: 'Status',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
                { label: 'All Statuses', value: 'ALL' },
                { label: 'Active', value: 'ACTIVE' },
                { label: 'Suspended', value: 'SUSPENDED' },
                { label: 'Probation', value: 'PROBATION' },
                { label: 'Alumni', value: 'ALUMNI' }
            ]
        });
    } else if (activeTab === 'progress') {
        filterOptions.push({
            id: 'status',
            label: 'Status',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
                { label: 'All States', value: 'ALL' },
                { label: 'On Track', value: 'On Track' },
                { label: 'Delayed', value: 'Delayed' },
                { label: 'Eligible', value: 'Eligible' }
            ]
        });
    } else if (activeTab === 'attendance') {
        filterOptions.push({
            id: 'risk',
            label: 'Risk Status',
            value: riskFilter,
            onChange: setRiskFilter,
            options: [
                { label: 'All Standings', value: 'ALL' },
                { label: 'Good Standing', value: 'GOOD' },
                { label: 'Warning', value: 'WARNING' },
                { label: 'Critical', value: 'CRITICAL' }
            ]
        });
    } else if (activeTab === 'at-risk') {
        filterOptions.push({
            id: 'risk',
            label: 'Risk Level',
            value: riskFilter,
            onChange: setRiskFilter,
            options: [
                { label: 'All Risk Levels', value: 'ALL' },
                { label: 'High Risk', value: 'HIGH' },
                { label: 'Medium Risk', value: 'MEDIUM' },
                { label: 'Low Risk', value: 'LOW' }
            ]
        });
    }

    // Tab Metrics
    const getMetrics = () => {
        switch (activeTab) {
            case 'directory':
                return [
                    { label: 'Total Enrolled', value: directory.length, icon: Users, color: 'text-blue-500 bg-primary-light0/10' },
                    { label: 'Active Students', value: directory.filter(s => s.status === 'ACTIVE').length, icon: CheckCircle2, color: 'text-emerald-500 bg-background0/10' },
                    { label: 'Average CGPA', value: directory.length ? (directory.reduce((acc, s) => acc + s.cgpa, 0) / directory.length).toFixed(2) : '0.00', icon: Sparkles, color: 'text-indigo-500 bg-primary-light0/10' },
                    { label: 'Avg Attendance', value: directory.length ? `${(directory.reduce((acc, s) => acc + s.attendanceRate, 0) / directory.length).toFixed(1)}%` : '100%', icon: Calendar, color: 'text-purple-500 bg-background0/10' }
                ];
            case 'enrollment':
                return [
                    { label: 'Pending Requests', value: enrollments.filter(e => e.status === 'PENDING' || e.status === 'SUBMITTED').length, icon: BookOpen, color: 'text-amber-500 bg-warning-bg0/10' },
                    { label: 'Approved', value: enrollments.filter(e => e.status === 'APPROVED').length, icon: CheckCircle2, color: 'text-emerald-500 bg-background0/10' },
                    { label: 'Rejected', value: enrollments.filter(e => e.status === 'REJECTED').length, icon: XCircle, color: 'text-rose-500 bg-error-bg0/10' },
                    { label: 'Total In Queue', value: enrollments.length, icon: RefreshCw, color: 'text-indigo-500 bg-primary-light0/10' }
                ];
            case 'progress':
                return [
                    { label: 'Average CGPA', value: progress.length ? (progress.reduce((acc, s) => acc + s.cgpa, 0) / progress.length).toFixed(2) : '0.00', icon: Award, color: 'text-blue-500 bg-primary-light0/10' },
                    { label: 'Under Probation', value: progress.filter(s => s.isProbation).length, icon: ShieldAlert, color: 'text-rose-500 bg-error-bg0/10' },
                    { label: 'On Track', value: progress.filter(s => s.graduationStatus === 'On Track').length, icon: CheckCircle2, color: 'text-emerald-500 bg-background0/10' },
                    { label: 'Avg Completed Credits', value: progress.length ? (progress.reduce((acc, s) => acc + s.completedCredits, 0) / progress.length).toFixed(0) : '0', icon: BookOpen, color: 'text-purple-500 bg-background0/10' }
                ];

            case 'attendance':
                return [
                    { label: 'Avg Compliance', value: attendance.length ? `${(attendance.reduce((acc, s) => acc + s.attendanceRate, 0) / attendance.length).toFixed(1)}%` : '100%', icon: Calendar, color: 'text-purple-500 bg-background0/10' },
                    { label: 'Critical Alert (<75%)', value: attendance.filter(s => s.riskStatus === 'CRITICAL').length, icon: ShieldAlert, color: 'text-rose-500 bg-error-bg0/10' },
                    { label: 'Attendance Warning', value: attendance.filter(s => s.riskStatus === 'WARNING').length, icon: AlertCircle, color: 'text-amber-500 bg-warning-bg0/10' },
                    { label: 'Good Standing', value: attendance.filter(s => s.riskStatus === 'GOOD').length, icon: CheckCircle2, color: 'text-emerald-500 bg-background0/10' }
                ];
            case 'at-risk':
                return [
                    { label: 'High Risk Students', value: atRisk.filter(s => s.riskLevel === 'HIGH').length, icon: ShieldAlert, color: 'text-rose-500 bg-error-bg0/10' },
                    { label: 'Medium Risk', value: atRisk.filter(s => s.riskLevel === 'MEDIUM').length, icon: AlertTriangle, color: 'text-amber-500 bg-warning-bg0/10' },
                    { label: 'Low Risk', value: atRisk.filter(s => s.riskLevel === 'LOW').length, icon: AlertCircle, color: 'text-blue-500 bg-primary-light0/10' },
                    { label: 'Total Monitored', value: atRisk.length, icon: Users, color: 'text-indigo-500 bg-primary-light0/10' }
                ];
            case 'scholarships':
                return [
                    { label: 'Active Waivers', value: scholarships.filter(s => s.isactive).length, icon: CheckCircle2, color: 'text-emerald-500 bg-background0/10' },
                    { label: '100% Tuition Waiver', value: scholarships.filter(s => s.discountpercentage === 100).length, icon: Sparkles, color: 'text-purple-500 bg-background0/10' },
                    { label: 'Partial Support', value: scholarships.filter(s => s.discountpercentage < 100 && s.discountpercentage > 0).length, icon: Landmark, color: 'text-blue-500 bg-primary-light0/10' },
                    { label: 'Average Discount', value: scholarships.length ? `${(scholarships.reduce((acc, s) => acc + s.discountpercentage, 0) / scholarships.length).toFixed(0)}%` : '0%', icon: Award, color: 'text-indigo-500 bg-primary-light0/10' }
                ];
            default:
                return [];
        }
    };

    return (
        <div className="space-y-8">
            <AdminPageHeader
                icon={Shield}
                title="Student Lifecycle"
                titleAccent="Oversight"
                subtitle="Monitor academic progress, override enrollment status, track attendance compliance, flag at-risk candidates, and audit student profiles."
            />

            {/* Metrics Dashboard */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {getMetrics().map((metric, i) => {
                    const Icon = metric.icon;
                    return (
                        <div key={i} className="bg-surface border border-warning-text text-warning-text hover:bg-warning-bg hover:text-warning-text transition-colors p-4 rounded-[2px] flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">{metric.label}</p>
                                <p className="text-2xl font-semibold text-text-primary leading-none">{metric.value}</p>
                            </div>
                            <div className={`p-3 rounded-[2px] ${metric.color}`}>
                                <Icon className="w-5 h-5" />
                            </div>
                        </div>
                    );
                })}
            </div>

            <AdminTabBar
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={handleTabChange}
            />

            {/* Main Content Area */}
            <div className="bg-surface rounded-[2.5rem] border border-border shadow-none overflow-hidden min-h-[600px]">
                <AdminFilterBar
                    searchValue={searchQuery}
                    onSearchChange={setSearchQuery}
                    searchPlaceholder="Search student name, email, roll number..."
                    filters={filterOptions}
                />
                
                {/* 1. Tab: Directory */}
                {activeTab === 'directory' && (
                    <div className="overflow-x-auto">
                        {loadingDir ? (
                            <div className="text-center py-20 text-text-muted font-semibold flex flex-col items-center gap-3">
                                <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                                Loading Student Directory...
                            </div>
                        ) : filterAndSearch(directory, ['fullname', 'email', 'rollnumber']).length === 0 ? (
                            <div className="text-center py-20 text-text-muted font-bold">No students found matching your filters.</div>
                        ) : (
                            <table className="w-full text-left text-sm text-text-secondary">
                                <thead className="bg-surface-hover text-text-muted text-[10px] uppercase tracking-widest font-semibold border-b border-border">
                                    <tr>
                                        <th className="px-6 py-4">Student Info</th>
                                        <th className="px-6 py-4">Roll Number</th>
                                        <th className="px-6 py-4">Department & Sem</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">CGPA</th>
                                        <th className="px-6 py-4">Attendance</th>
                                        <th className="px-6 py-4 text-right pr-6">Profile</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filterAndSearch(directory, ['fullname', 'email', 'rollnumber']).map((s) => (
                                        <tr key={s.studentid} className="hover:bg-surface-hover/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-text-primary text-sm">{s.fullname}</span>
                                                    <span className="text-xs text-text-muted">{s.email}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-mono font-bold text-text-secondary">{s.rollnumber}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-text-primary text-xs">{s.department}</span>
                                                    <span className="text-xs text-text-muted">Semester {s.semester}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <AdminStatusBadge 
                                                    status={s.status} 
                                                    variant={s.status === 'ACTIVE' ? 'success' : s.status === 'SUSPENDED' ? 'error' : s.status === 'PROBATION' ? 'warning' : 'default'} 
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`font-mono font-semibold text-sm ${s.cgpa < 2.0 ? 'text-error-text' : 'text-text-primary'}`}>
                                                    {s.cgpa.toFixed(2)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-16 bg-background rounded-[2px] h-1.5 overflow-hidden">
                                                        <div 
                                                            className={`h-full rounded-[2px] ${s.attendanceRate < 75 ? 'bg-error-bg0' : s.attendanceRate < 80 ? 'bg-warning-bg0' : 'bg-background0'}`} 
                                                            style={{ width: `${s.attendanceRate}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className={`text-xs font-bold ${s.attendanceRate < 75 ? 'text-error-text font-semibold' : 'text-text-secondary'}`}>{s.attendanceRate}%</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right pr-6">
                                                <Link 
                                                    href={`/dashboard/admin/student/${s.studentid}`}
                                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-primary-light hover:bg-primary-light px-3.5 py-2 rounded-[2px] transition-all"
                                                >
                                                    View Timeline <ArrowRight className="w-3.5 h-3.5" />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {/* 2. Tab: Enrollment Oversight */}
                {activeTab === 'enrollment' && (
                    <div className="overflow-x-auto">
                        {loadingEnroll ? (
                            <div className="text-center py-20 text-text-muted font-semibold flex flex-col items-center gap-3">
                                <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                                Loading Enrollment Requests...
                            </div>
                        ) : filterAndSearch(enrollments, ['studentName', 'rollnumber', 'courseName', 'courseCode']).length === 0 ? (
                            <div className="text-center py-20 text-text-muted font-bold">No enrollment requests found matching filters.</div>
                        ) : (
                            <table className="w-full text-left text-sm text-text-secondary">
                                <thead className="bg-surface-hover text-text-muted text-[10px] uppercase tracking-widest font-semibold border-b border-border">
                                    <tr>
                                        <th className="px-6 py-4">Student Info</th>
                                        <th className="px-6 py-4">Roll Number</th>
                                        <th className="px-6 py-4">Course Request</th>
                                        <th className="px-6 py-4">Department & Sem</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Submitted At</th>
                                        <th className="px-6 py-4 text-right pr-6">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filterAndSearch(enrollments, ['studentName', 'rollnumber', 'courseName', 'courseCode']).map((req) => (
                                        <tr key={req.enrollmentrequestid} className="hover:bg-surface-hover/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <span className="font-bold text-text-primary">{req.studentName}</span>
                                            </td>
                                            <td className="px-6 py-4 font-mono font-bold text-text-secondary">{req.rollnumber}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-text-primary text-xs">{req.courseName}</span>
                                                    <span className="text-[10px] font-bold text-text-muted font-mono">{req.courseCode}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-text-primary text-xs">{req.department}</span>
                                                    <span className="text-[10px] text-text-muted">{req.semester}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <AdminStatusBadge 
                                                    status={req.status} 
                                                    variant={req.status === 'APPROVED' ? 'success' : req.status === 'REJECTED' ? 'error' : (req.status === 'PENDING' || req.status === 'SUBMITTED') ? 'warning' : 'default'} 
                                                />
                                            </td>
                                            <td className="px-6 py-4 font-medium text-text-muted text-xs">{new Date(req.createdat).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 text-right pr-6">
                                                {(req.status === 'PENDING' || req.status === 'SUBMITTED') ? (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedOverrideId(req.enrollmentrequestid);
                                                            setIsOverrideModalOpen(true);
                                                        }}
                                                        className="inline-flex items-center gap-1 text-xs font-bold text-primary bg-primary-light hover:bg-primary-light px-3.5 py-2 rounded-[2px] transition-all"
                                                    >
                                                        Override Decision
                                                    </button>
                                                ) : (
                                                    <span className="text-slate-300 font-bold text-xs italic">Decision Finalized</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {/* 3. Tab: Academic Progress */}
                {activeTab === 'progress' && (
                    <div className="overflow-x-auto">
                        {loadingProg ? (
                            <div className="text-center py-20 text-text-muted font-semibold flex flex-col items-center gap-3">
                                <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                                Loading Progress Metrics...
                            </div>
                        ) : filterAndSearch(progress, ['fullname', 'rollnumber']).length === 0 ? (
                            <div className="text-center py-20 text-text-muted font-bold">No progress files matched.</div>
                        ) : (
                            <table className="w-full text-left text-sm text-text-secondary">
                                <thead className="bg-surface-hover text-text-muted text-[10px] uppercase tracking-widest font-semibold border-b border-border">
                                    <tr>
                                        <th className="px-6 py-4">Student Info</th>
                                        <th className="px-6 py-4">Roll Number</th>
                                        <th className="px-6 py-4">Dept & Sem</th>
                                        <th className="px-6 py-4">Credits Completed</th>
                                        <th className="px-6 py-4">Remaining Credits</th>
                                        <th className="px-6 py-4">Current CGPA</th>
                                        <th className="px-6 py-4">Graduation Status</th>
                                        <th className="px-6 py-4 text-right pr-6">Audit</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filterAndSearch(progress, ['fullname', 'rollnumber']).map((prog) => (
                                        <tr key={prog.studentid} className="hover:bg-surface-hover/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <span className="font-bold text-text-primary">{prog.fullname}</span>
                                                {prog.isProbation && (
                                                    <span className="ml-2 bg-error-bg text-error-text text-[9px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-[2px] inline-block">PROBATION</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 font-mono font-bold text-text-secondary">{prog.rollnumber}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-text-primary text-xs">{prog.department}</span>
                                                    <span className="text-[10px] text-text-muted">{prog.semester}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-text-primary">{prog.completedCredits} hrs</td>
                                            <td className="px-6 py-4 text-text-secondary font-medium">{prog.remainingCredits} hrs</td>
                                            <td className="px-6 py-4">
                                                <span className={`font-mono font-semibold text-sm ${prog.cgpa < 2.0 ? 'text-error-text' : 'text-text-primary'}`}>
                                                    {prog.cgpa.toFixed(2)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <AdminStatusBadge 
                                                    status={prog.graduationStatus} 
                                                    variant={prog.graduationStatus === 'Eligible' ? 'success' : prog.graduationStatus === 'Delayed' ? 'error' : 'primary'} 
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-right pr-6">
                                                <Link 
                                                    href={`/dashboard/admin/student/${prog.studentid}`}
                                                    className="inline-flex items-center gap-1 text-xs font-bold text-text-secondary bg-background hover:bg-slate-200 px-3.5 py-2 rounded-[2px] transition-all"
                                                >
                                                    Audit Progress
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}



                {/* 5. Tab: Attendance Analytics */}
                {activeTab === 'attendance' && (
                    <div className="overflow-x-auto">
                        {loadingAtt ? (
                            <div className="text-center py-20 text-text-muted font-semibold flex flex-col items-center gap-3">
                                <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                                Loading attendance audit records...
                            </div>
                        ) : filterAndSearch(attendance, ['fullname', 'rollnumber']).length === 0 ? (
                            <div className="text-center py-20 text-text-muted font-bold">No attendance records matches filters.</div>
                        ) : (
                            <table className="w-full text-left text-sm text-text-secondary">
                                <thead className="bg-surface-hover text-text-muted text-[10px] uppercase tracking-widest font-semibold border-b border-border">
                                    <tr>
                                        <th className="px-6 py-4">Student Info</th>
                                        <th className="px-6 py-4">Roll Number</th>
                                        <th className="px-6 py-4">Department & Sem</th>
                                        <th className="px-6 py-4">Total Sessions</th>
                                        <th className="px-6 py-4">Present Sessions</th>
                                        <th className="px-6 py-4">Attendance Rate</th>
                                        <th className="px-6 py-4">Standing</th>
                                        <th className="px-6 py-4 text-right pr-6">History</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filterAndSearch(attendance, ['fullname', 'rollnumber']).map((att) => (
                                        <tr key={att.studentid} className="hover:bg-surface-hover/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <span className="font-bold text-text-primary">{att.fullname}</span>
                                            </td>
                                            <td className="px-6 py-4 font-mono font-bold text-text-secondary">{att.rollnumber}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-text-primary text-xs">{att.department}</span>
                                                    <span className="text-[10px] text-text-muted">{att.semester}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-text-primary font-medium">{att.totalClasses} classes</td>
                                            <td className="px-6 py-4 text-text-primary font-medium">{att.presentClasses} classes</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-20 bg-background rounded-[2px] h-2 overflow-hidden">
                                                        <div 
                                                            className={`h-full rounded-[2px] ${
                                                                att.riskStatus === 'CRITICAL' ? 'bg-error-bg0' : 
                                                                att.riskStatus === 'WARNING' ? 'bg-warning-bg0' : 'bg-background0'
                                                            }`} 
                                                            style={{ width: `${att.attendanceRate}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className={`text-sm font-bold ${
                                                        att.riskStatus === 'CRITICAL' ? 'text-error-text font-semibold' : 
                                                        att.riskStatus === 'WARNING' ? 'text-warning-text' : 'text-success-text'
                                                    }`}>{att.attendanceRate}%</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <AdminStatusBadge 
                                                    status={att.riskStatus} 
                                                    variant={att.riskStatus === 'GOOD' ? 'success' : att.riskStatus === 'WARNING' ? 'warning' : 'error'} 
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-right pr-6">
                                                <Link 
                                                    href={`/dashboard/admin/student/${att.studentid}`}
                                                    className="inline-flex items-center gap-1 text-xs font-bold text-text-secondary bg-background hover:bg-slate-200 px-3.5 py-2 rounded-[2px] transition-all"
                                                >
                                                    Full Audit
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {/* 6. Tab: At-Risk Students */}
                {activeTab === 'at-risk' && (
                    <div className="overflow-x-auto">
                        {loadingRisk ? (
                            <div className="text-center py-20 text-text-muted font-semibold flex flex-col items-center gap-3">
                                <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                                Analyzing at-risk students...
                            </div>
                        ) : filterAndSearch(atRisk, ['fullname', 'rollnumber']).length === 0 ? (
                            <div className="text-center py-20 text-text-muted font-bold">Excellent! No at-risk student indicators.</div>
                        ) : (
                            <table className="w-full text-left text-sm text-text-secondary">
                                <thead className="bg-surface-hover text-text-muted text-[10px] uppercase tracking-widest font-semibold border-b border-border">
                                    <tr>
                                        <th className="px-6 py-4">Student Info</th>
                                        <th className="px-6 py-4">Roll Number</th>
                                        <th className="px-6 py-4">Department & Sem</th>
                                        <th className="px-6 py-4">Key Metrics</th>
                                        <th className="px-6 py-4">Risk Severity</th>
                                        <th className="px-6 py-4">Risk Factors</th>
                                        <th className="px-6 py-4 text-right pr-6">Intervention</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filterAndSearch(atRisk, ['fullname', 'rollnumber']).map((risk) => (
                                        <tr key={risk.studentid} className="hover:bg-surface-hover/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <span className="font-bold text-text-primary">{risk.fullname}</span>
                                            </td>
                                            <td className="px-6 py-4 font-mono font-bold text-text-secondary">{risk.rollnumber}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-text-primary text-xs">{risk.department}</span>
                                                    <span className="text-[10px] text-text-muted">{risk.semester}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col space-y-0.5 text-xs font-semibold text-text-secondary">
                                                    <span>CGPA: <strong className={risk.cgpa < 2.0 ? 'text-error-text' : 'text-text-primary'}>{risk.cgpa.toFixed(2)}</strong></span>
                                                    <span>Attendance: <strong className={risk.attendanceRate < 75 ? 'text-error-text' : 'text-text-primary'}>{risk.attendanceRate}%</strong></span>
                                                    <span>Fails: <strong className={risk.failedCourses > 0 ? 'text-error-text' : 'text-text-primary'}>{risk.failedCourses}</strong></span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <AdminStatusBadge 
                                                    status={risk.riskLevel} 
                                                    variant={risk.riskLevel === 'HIGH' ? 'error' : risk.riskLevel === 'MEDIUM' ? 'warning' : 'primary'} 
                                                />
                                            </td>
                                            <td className="px-6 py-4 max-w-xs">
                                                <div className="flex flex-wrap gap-1">
                                                    {risk.reasons.map((r, i) => (
                                                        <span key={i} className="bg-background text-text-primary text-[10px] font-bold px-2 py-0.5 rounded-[2px]">
                                                            {r}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right pr-6">
                                                <Link 
                                                    href={`/dashboard/admin/student/${risk.studentid}`}
                                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-error-text bg-error-bg hover:bg-error-bg px-3.5 py-2 rounded-[2px] transition-all"
                                                >
                                                    Intervene <ExternalLink className="w-3.5 h-3.5" />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {/* 7. Tab: Scholarships */}
                {activeTab === 'scholarships' && (
                    <div className="overflow-x-auto">
                        {loadingSchol ? (
                            <div className="text-center py-20 text-text-muted font-semibold flex flex-col items-center gap-3">
                                <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                                Loading Scholarship database...
                            </div>
                        ) : filterAndSearch(scholarships, ['studentName', 'rollnumber', 'email']).length === 0 ? (
                            <div className="text-center py-20 text-text-muted font-bold">No active scholarships match your query.</div>
                        ) : (
                            <table className="w-full text-left text-sm text-text-secondary">
                                <thead className="bg-surface-hover text-text-muted text-[10px] uppercase tracking-widest font-semibold border-b border-border">
                                    <tr>
                                        <th className="px-6 py-4">Student Info</th>
                                        <th className="px-6 py-4">Roll Number</th>
                                        <th className="px-6 py-4">Department</th>
                                        <th className="px-6 py-4">Fee Waiver Percentage</th>
                                        <th className="px-6 py-4">Scholarship Status</th>
                                        <th className="px-6 py-4 text-right pr-6">Profile</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filterAndSearch(scholarships, ['studentName', 'rollnumber', 'email']).map((sch) => (
                                        <tr key={sch.scholarshipid} className="hover:bg-surface-hover/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-text-primary text-sm">{sch.studentName}</span>
                                                    <span className="text-xs text-text-muted">{sch.email}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-mono font-bold text-text-secondary">{sch.rollnumber}</td>
                                            <td className="px-6 py-4 font-semibold text-text-primary">{sch.department}</td>
                                            <td className="px-6 py-4">
                                                <span className="font-mono font-semibold text-text-primary text-base">
                                                    {sch.discountpercentage}% Discount
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <AdminStatusBadge 
                                                    status={sch.isactive ? 'ACTIVE WAIVER' : 'INACTIVE'} 
                                                    variant={sch.isactive ? 'success' : 'default'} 
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-right pr-6">
                                                <Link 
                                                    href={`/dashboard/admin/student/${sch.scholarshipid}`}
                                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-primary-light hover:bg-primary-light px-3.5 py-2 rounded-[2px] transition-all"
                                                >
                                                    View Timeline <ArrowRight className="w-3.5 h-3.5" />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>

            {/* Override Enrollment Modal */}
            {isOverrideModalOpen && selectedOverrideId && (
                <div className="fixed inset-0 bg-slate-900/60  flex items-center justify-center z-50 p-4 animate-in fade-in">
                    <AdminPageWrapper>
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-xl font-semibold text-text-primary flex items-center gap-2">
                                    <ShieldAlert className="w-5 h-5 text-primary" />
                                    Override Enrollment Status
                                </h3>
                                <p className="text-xs text-text-muted mt-1">Override student request to Enrolled or Rejected with audit tracking.</p>
                            </div>
                            <button 
                                onClick={() => {
                                    setIsOverrideModalOpen(false);
                                    setSelectedOverrideId(null);
                                    setOverrideComment('');
                                }}
                                className="p-1 rounded-[2px] hover:bg-background text-text-muted transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-xs font-semibold text-text-muted uppercase tracking-widest mb-2">Override Comment / Remarks</label>
                                <textarea
                                    required
                                    value={overrideComment}
                                    onChange={(e) => setOverrideComment(e.target.value)}
                                    placeholder="Provide administrative overrides comments (required for audit logging)..."
                                    rows={4}
                                    className="w-full border-2 border-border rounded-[2px] p-4 text-sm outline-none focus:border-blue-500 transition-colors placeholder:text-slate-300 resize-none font-semibold text-text-primary"
                                ></textarea>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-slate-50">
                                <button
                                    onClick={() => handleOverrideSubmit('REJECT')}
                                    disabled={overrideMutation.isPending || !overrideComment.trim()}
                                    className="flex-1 bg-error-bg border border-border text-error-text hover:bg-error-bg font-semibold py-3.5 rounded-[2px] transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <XCircle className="w-4 h-4" /> Reject Override
                                </button>
                                <button
                                    onClick={() => handleOverrideSubmit('APPROVE')}
                                    disabled={overrideMutation.isPending || !overrideComment.trim()}
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 rounded-[2px] shadow-none shadow-emerald-200 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <CheckCircle2 className="w-4 h-4" /> Approve Override
                                </button>
                            </div>
                        </div>
                    </AdminPageWrapper>
                </div>
            )}
        </div>
    );
}
