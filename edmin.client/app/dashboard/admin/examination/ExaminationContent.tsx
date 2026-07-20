'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
    Search, Filter, Calendar, Award, CheckCircle2, XCircle, 
    AlertCircle, RefreshCw, Plus, Trash2, ShieldAlert, Sparkles, 
    BookOpen, DollarSign, Landmark, BarChart3, Users, Clock, 
    ExternalLink, Check, X, ArrowRight, Printer, AlertTriangle
} from 'lucide-react';
import { 
    useExamSchedules, 
    useCreateExamSchedule, 
    useDeleteExamSchedule, 
    useVerificationRoster, 
    useAssessmentMarks, 
    useLockAssessmentMarks, 
    usePublishCourseGrades, 
    usePublishedResults, 
    useDegreeAudits, 
    useReevaluateDegreeAudits, 
    usePromotionRecommendations, 
    useExecutePromotion, 
    useExaminationStats 
} from '@/features/examination/hooks/useExamination';
import { useRooms, useTimetablePrograms } from '@/features/timetable/hooks/useTimetable';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminTabBar from '@/components/admin/AdminTabBar';
import AdminStatusBadge from '@/components/admin/AdminStatusBadge';

export default function ExaminationContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const tabParam = searchParams.get('tab');
    
    // Tab State
    const [activeTab, setActiveTab] = useState<string>('dashboard');

    useEffect(() => {
        if (tabParam) {
            setActiveTab(tabParam);
        }
    }, [tabParam]);

    const handleTabChange = (tabId: string) => {
        setActiveTab(tabId);
        router.push(`/dashboard/admin/examination?tab=${tabId}`);
    };

    // Filter States
    const [searchQuery, setSearchQuery] = useState('');
    const [deptFilter, setDeptFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');

    // Modals & In-tab Interaction States
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
    const [isPromotionModalOpen, setIsPromotionModalOpen] = useState(false);

    // Form inputs for scheduling
    const [scheduleForm, setScheduleForm] = useState({
        assessmentId: '',
        roomId: '',
        sectionId: '',
        date: '',
        startTime: '',
        endTime: '',
        duration: '180',
        examType: 'FINAL',
        facultyId: ''
    });

    // Selected items for modal operations
    const [selectedAssessmentId, setSelectedAssessmentId] = useState<number | null>(null);
    const [selectedStudentForPromotion, setSelectedStudentForPromotion] = useState<any | null>(null);
    const [promotionForm, setPromotionForm] = useState({
        status: 'ACTIVE',
        standing: 'GOOD_STANDING',
        comment: ''
    });

    // React Query Queries
    const { data: schedules = [], isLoading: loadingSchedules } = useExamSchedules();
    const { data: roster = [], isLoading: loadingRoster } = useVerificationRoster();
    const { data: marks = [], isLoading: loadingMarks } = useAssessmentMarks(selectedAssessmentId || 0);
    const { data: publishedHistory = [], isLoading: loadingHistory } = usePublishedResults();
    const { data: degreeAudits = [], isLoading: loadingAudits } = useDegreeAudits();
    const { data: recommendations = [], isLoading: loadingPromotions } = usePromotionRecommendations();
    const { data: stats, isLoading: loadingStats } = useExaminationStats();
    
    // Additional Data for Dropdowns
    const { data: rooms = [] } = useRooms();
    const { data: programs = [] } = useTimetablePrograms();

    // UI state for dropdown filtering
    const [selectedCourseOfferingId, setSelectedCourseOfferingId] = useState<string>('');
    const [selectedProgramId, setSelectedProgramId] = useState<string>('');

    // Mutations
    const createScheduleMutation = useCreateExamSchedule();
    const deleteScheduleMutation = useDeleteExamSchedule();
    const lockMarksMutation = useLockAssessmentMarks();
    const publishGradesMutation = usePublishCourseGrades();
    const reevaluateAuditsMutation = useReevaluateDegreeAudits();
    const executePromotionMutation = useExecutePromotion();

    // Form Submissions
    const handleCreateSchedule = (e: React.FormEvent) => {
        e.preventDefault();
        createScheduleMutation.mutate({
            assessmentId: parseInt(scheduleForm.assessmentId, 10),
            roomId: parseInt(scheduleForm.roomId, 10),
            sectionId: parseInt(scheduleForm.sectionId, 10),
            date: scheduleForm.date,
            startTime: scheduleForm.startTime,
            endTime: scheduleForm.endTime,
            duration: parseInt(scheduleForm.duration, 10),
            examType: scheduleForm.examType,
            facultyId: scheduleForm.facultyId ? parseInt(scheduleForm.facultyId, 10) : undefined
        }, {
            onSuccess: () => {
                setIsScheduleModalOpen(false);
                setScheduleForm({
                    assessmentId: '',
                    roomId: '',
                    sectionId: '',
                    date: '',
                    startTime: '',
                    endTime: '',
                    duration: '180',
                    examType: 'FINAL',
                    facultyId: ''
                });
            }
        });
    };

    const handleDeleteSchedule = (id: number) => {
        if (confirm('Are you sure you want to cancel and delete this scheduled exam session?')) {
            deleteScheduleMutation.mutate(id);
        }
    };

    const handleLockMarks = () => {
        if (!selectedAssessmentId) return;
        lockMarksMutation.mutate(selectedAssessmentId, {
            onSuccess: () => {
                setIsVerificationModalOpen(false);
                setSelectedAssessmentId(null);
            }
        });
    };

    const handlePublishGrades = (offeringId: number) => {
        if (confirm('This will compute weighted assessment scores and publish final letter grades/GPA to the database. Are you sure?')) {
            publishGradesMutation.mutate(offeringId);
        }
    };

    const handleExecutePromotion = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStudentForPromotion) return;
        executePromotionMutation.mutate({
            studentId: selectedStudentForPromotion.studentId,
            payload: {
                status: promotionForm.status,
                standing: promotionForm.standing,
                comment: promotionForm.comment
            }
        }, {
            onSuccess: () => {
                setIsPromotionModalOpen(false);
                setSelectedStudentForPromotion(null);
                setPromotionForm({ status: 'ACTIVE', standing: 'GOOD_STANDING', comment: '' });
            }
        });
    };

    // Derived Statistics Fallbacks
    const totalSchedulesCount = schedules.length;
    const pendingVerificationsCount = roster.reduce((acc, r) => 
        acc + r.assessments.filter(a => a.status === 'PUBLISHED').length, 0
    );
    const lockedAssessmentsCount = roster.reduce((acc, r) => 
        acc + r.assessments.filter(a => a.status === 'LOCKED').length, 0
    );
    const publishedResultsCount = publishedHistory.length;
    const graduationEligibleCount = degreeAudits.filter(a => a.eligible).length;
    const probationCount = recommendations.filter(r => r.currentStanding === 'PROBATION' || r.recommendedStanding === 'PROBATION').length;

    // Filters application helper
    const getFilteredList = <T extends Record<string, any>>(list: T[], searchFields: (keyof T)[]): T[] => {
        return list.filter(item => {
            if (searchQuery.trim() !== '') {
                const query = searchQuery.toLowerCase();
                const match = searchFields.some(f => item[f]?.toString().toLowerCase().includes(query));
                if (!match) return false;
            }
            if (deptFilter !== 'ALL' && item.department !== deptFilter && item.departmentName !== deptFilter) return false;
            if (statusFilter !== 'ALL') {
                if (item.status && item.status !== statusFilter) return false;
                if (item.currentStanding && item.currentStanding !== statusFilter) return false;
            }
            return true;
        });
    };

    const getUniqueDepartments = () => {
        const set = new Set<string>();
        degreeAudits.forEach(a => a.department && set.add(a.department));
        recommendations.forEach(r => r.departmentName && set.add(r.departmentName));
        return Array.from(set);
    };
    const depts = getUniqueDepartments();

    // Tab items Configuration
    const tabs = [
        { id: 'dashboard', label: 'Dashboard', icon: BarChart3, desc: 'Examination summary KPIs' },
        { id: 'schedule', label: 'Schedule', icon: Calendar, desc: 'Timetables & scheduling' },
        { id: 'verification', label: 'Verification', icon: ShieldAlert, desc: 'Verify assessment marks' },
        { id: 'publishing', label: 'Publishing', icon: CheckCircle2, desc: 'Publish final course grades' },
        { id: 'transcripts', label: 'Transcripts', icon: Printer, desc: 'Transcript directory' },
        { id: 'promotion', label: 'Promotion & Standing', icon: Award, desc: 'Promotion & standing overrides' },
        { id: 'degree-audit', label: 'Degree Audit', icon: Landmark, desc: 'Required vs completed credits' },
        { id: 'statistics', label: 'Statistics', icon: Sparkles, desc: 'Pass rates & GPA analytics' }
    ];

    return (
        <div className="space-y-8">
            <AdminPageHeader
                icon={Award}
                title="Examination Department"
                titleAccent="Portal"
                subtitle="Schedule examinations, verify faculty uploaded marks, lock & publish course letter grades, reevaluate degree progress, and promote students."
            />

            <AdminTabBar
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={handleTabChange}
            />

            {/* 1. TAB: OVERVIEW DASHBOARD */}
            {activeTab === 'dashboard' && (
                <div className="space-y-8 animate-in fade-in">
                    {/* KPI Roster */}
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-surface rounded-[2px] p-6 border border-border shadow-none flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase text-text-muted">Exam Sessions</p>
                                <p className="text-3xl font-semibold text-text-primary mt-2">{totalSchedulesCount}</p>
                            </div>
                            <div className="p-4 bg-primary-light text-primary rounded-[2px]"><Calendar className="w-6 h-6" /></div>
                        </div>
                        <div className="bg-surface rounded-[2px] p-6 border border-border shadow-none flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase text-text-muted">Pending Verifications</p>
                                <p className="text-3xl font-semibold text-warning-text mt-2">{pendingVerificationsCount}</p>
                            </div>
                            <div className="p-4 bg-warning-bg text-warning-text rounded-[2px]"><ShieldAlert className="w-6 h-6" /></div>
                        </div>
                        <div className="bg-surface rounded-[2px] p-6 border border-border shadow-none flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase text-text-muted">Locked Assessments</p>
                                <p className="text-3xl font-semibold text-text-primary mt-2">{lockedAssessmentsCount}</p>
                            </div>
                            <div className="p-4 bg-background text-success-text rounded-[2px]"><CheckCircle2 className="w-6 h-6" /></div>
                        </div>
                        <div className="bg-surface rounded-[2px] p-6 border border-border shadow-none flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase text-text-muted">Published Results</p>
                                <p className="text-3xl font-semibold text-text-primary mt-2">{publishedResultsCount}</p>
                            </div>
                            <div className="p-4 bg-primary-light text-primary rounded-[2px]"><BookOpen className="w-6 h-6" /></div>
                        </div>
                        <div className="bg-surface rounded-[2px] p-6 border border-border shadow-none flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase text-text-muted">Graduation Eligible</p>
                                <p className="text-3xl font-semibold text-success-text mt-2">{graduationEligibleCount}</p>
                            </div>
                            <div className="p-4 bg-background text-success-text rounded-[2px]"><Award className="w-6 h-6" /></div>
                        </div>
                        <div className="bg-surface rounded-[2px] p-6 border border-border shadow-none flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase text-text-muted">Students on Probation</p>
                                <p className="text-3xl font-semibold text-error-text mt-2">{probationCount}</p>
                            </div>
                            <div className="p-4 bg-error-bg text-error-text rounded-[2px]"><AlertTriangle className="w-6 h-6" /></div>
                        </div>
                    </div>

                    {/* Published History Audit Log */}
                    <div className="bg-surface rounded-[2.5rem] border border-border shadow-none p-6">
                        <h3 className="text-lg font-semibold text-text-primary mb-6 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-indigo-500" /> Recent Published Course Grades Audit Log
                        </h3>
                        <div className="overflow-x-auto">
                            {loadingHistory ? (
                                <div className="text-center py-10 text-text-muted font-bold">Loading audit logs...</div>
                            ) : publishedHistory.length === 0 ? (
                                <div className="text-center py-10 text-text-muted font-medium">No results published in database yet.</div>
                            ) : (
                                <table className="w-full text-left text-sm text-text-secondary">
                                    <thead className="bg-surface-hover text-text-muted text-[10px] uppercase tracking-widest font-semibold">
                                        <tr>
                                            <th className="px-6 py-4">Semester & Course</th>
                                            <th className="px-6 py-4">Instructor</th>
                                            <th className="px-6 py-4">Students Graded</th>
                                            <th className="px-6 py-4">Average GPA</th>
                                            <th className="px-6 py-4">Pass Rate</th>
                                            <th className="px-6 py-4 text-right pr-6">Published Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-surface">
                                        {publishedHistory.map((log, index) => (
                                            <tr key={index} className="hover:bg-surface-hover/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-text-primary">{log.courseName}</span>
                                                        <span className="text-[10px] font-bold text-text-muted font-mono">{log.courseCode} ({log.semester})</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 font-semibold text-text-secondary">{log.instructorName}</td>
                                                <td className="px-6 py-4 font-mono font-bold">{log.completedCount} / {log.enrolledCount}</td>
                                                <td className="px-6 py-4 font-mono font-bold text-primary">{log.avgGpa.toFixed(2)}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`font-mono font-bold ${log.passRate < 70 ? 'text-error-text font-semibold' : 'text-success-text'}`}>{log.passRate}%</span>
                                                </td>
                                                <td className="px-6 py-4 text-right pr-6 font-mono text-xs text-text-muted">{new Date(log.publishedAt).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 2. TAB: SCHEDULE */}
            {activeTab === 'schedule' && (
                <div className="space-y-6 animate-in fade-in">
                    <div className="flex justify-between items-center bg-surface p-6 rounded-[2px] border border-border shadow-none">
                        <div>
                            <h3 className="text-lg font-semibold text-text-primary">Exam Timetables & Scheduling</h3>
                            <p className="text-xs text-text-muted mt-1">Review scheduled midterm/final slots or book a new room session.</p>
                        </div>
                        <button
                            onClick={() => setIsScheduleModalOpen(true)}
                            className="bg-primary hover:bg-primary-hover text-white font-semibold text-xs px-5 py-3 rounded-[2px] transition-all shadow-none shadow-indigo-100 flex items-center gap-1.5"
                        >
                            <Plus className="w-4 h-4" /> Schedule New Session
                        </button>
                    </div>

                    {/* Schedules Grid */}
                    <div className="bg-surface rounded-[2.5rem] border border-border shadow-none overflow-hidden">
                        {loadingSchedules ? (
                            <div className="text-center py-20 text-text-muted font-bold">Loading schedules...</div>
                        ) : schedules.length === 0 ? (
                            <div className="text-center py-20 text-text-muted font-bold">No exam sessions scheduled. Click above to add one.</div>
                        ) : (
                            <table className="w-full text-left text-sm text-text-secondary">
                                <thead className="bg-surface-hover text-text-muted text-[10px] uppercase tracking-widest font-semibold border-b border-border">
                                    <tr>
                                        <th className="px-6 py-4">Course & Type</th>
                                        <th className="px-6 py-4">Section & Room</th>
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4">Time (Duration)</th>
                                        <th className="px-6 py-4">Invigilator</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right pr-6">Cancel</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {schedules.map((s) => (
                                        <tr key={s.examsessionid} className="hover:bg-surface-hover/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-text-primary">{s.courseName}</span>
                                                    <span className="text-[10px] font-bold text-primary uppercase tracking-wide">{s.examType} Exam</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-text-primary">{s.sectionName}</span>
                                                    <span className="text-xs text-text-muted">Room: {s.roomName} (Cap: {s.roomCapacity})</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-text-primary">{new Date(s.date).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 font-semibold">
                                                <div className="flex flex-col">
                                                    <span className="text-text-primary text-xs font-mono">{new Date(s.starttime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(s.endtime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                    <span className="text-[10px] text-text-muted">{s.duration} mins</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-text-secondary font-medium">
                                                {s.invigilators.length > 0 ? s.invigilators.map(i => i.facultyName).join(', ') : 'Unassigned'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <AdminStatusBadge 
                                                    status={s.status} 
                                                    variant={s.status === 'SCHEDULED' ? 'primary' : s.status === 'COMPLETED' ? 'success' : 'error'} 
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-right pr-6">
                                                <button
                                                    onClick={() => handleDeleteSchedule(s.examsessionid)}
                                                    className="p-2 hover:bg-error-bg text-error-text hover:text-error-text rounded-[2px] transition-all"
                                                    title="Cancel Session"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {/* 3. TAB: VERIFICATION */}
            {activeTab === 'verification' && (
                <div className="space-y-6 animate-in fade-in">
                    <div className="bg-surface p-6 rounded-[2px] border border-border shadow-none">
                        <h3 className="text-lg font-semibold text-text-primary">Marks Verification Desk</h3>
                        <p className="text-xs text-text-muted mt-1">Review faculty-uploaded marks for course assessments. Verifying will Lock marks, making them final for grading.</p>
                    </div>

                    <div className="bg-surface rounded-[2.5rem] border border-border shadow-none overflow-hidden">
                        {loadingRoster ? (
                            <div className="text-center py-20 text-text-muted font-bold">Loading assessments roster...</div>
                        ) : roster.length === 0 ? (
                            <div className="text-center py-20 text-text-muted font-bold">No active courses or assessments found.</div>
                        ) : (
                            <table className="w-full text-left text-sm text-text-secondary">
                                <thead className="bg-surface-hover text-text-muted text-[10px] uppercase tracking-widest font-semibold border-b border-border">
                                    <tr>
                                        <th className="px-6 py-4">Course Offering</th>
                                        <th className="px-6 py-4">Assessment Name</th>
                                        <th className="px-6 py-4">Assessment Type</th>
                                        <th className="px-6 py-4">Marks Roster Upload</th>
                                        <th className="px-6 py-4">Weight</th>
                                        <th className="px-6 py-4">Lock Status</th>
                                        <th className="px-6 py-4 text-right pr-6">Verify & Lock</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {roster.map((c) => (
                                        c.assessments.map((a) => (
                                            <tr key={a.assessmentid} className="hover:bg-surface-hover/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-text-primary">{c.courseName}</span>
                                                        <span className="text-[10px] font-mono text-text-muted">{c.courseCode} ({c.semesterName})</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 font-semibold text-text-primary">{a.name}</td>
                                                <td className="px-6 py-4 font-medium text-text-secondary uppercase text-xs">{a.type}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-16 bg-background rounded-[2px] h-1.5 overflow-hidden">
                                                            <div 
                                                                className={`h-full ${a.uploadedCount === a.totalStudents ? 'bg-background0' : 'bg-warning-bg0'}`} 
                                                                style={{ width: `${(a.uploadedCount / (a.totalStudents || 1)) * 100}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="text-xs font-bold font-mono">{a.uploadedCount} / {a.totalStudents}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 font-mono font-bold">{a.weight}%</td>
                                                <td className="px-6 py-4">
                                                    <AdminStatusBadge 
                                                        status={a.status} 
                                                        variant={a.status === 'LOCKED' ? 'success' : a.status === 'PUBLISHED' ? 'warning' : 'default'} 
                                                    />
                                                </td>
                                                <td className="px-6 py-4 text-right pr-6">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedAssessmentId(a.assessmentid);
                                                            setIsVerificationModalOpen(true);
                                                        }}
                                                        className={`inline-flex items-center gap-1 text-xs font-bold px-3.5 py-2 rounded-[2px] transition-all ${
                                                            a.status === 'LOCKED' 
                                                                ? 'text-text-muted bg-background cursor-not-allowed'
                                                                : 'text-primary bg-primary-light hover:bg-indigo-100'
                                                        }`}
                                                        disabled={a.status === 'LOCKED'}
                                                    >
                                                        {a.status === 'LOCKED' ? 'Verified' : 'Verify Marks'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {/* 4. TAB: RESULTS PUBLISHING */}
            {activeTab === 'publishing' && (
                <div className="space-y-6 animate-in fade-in">
                    <div className="bg-surface p-6 rounded-[2px] border border-border shadow-none">
                        <h3 className="text-lg font-semibold text-text-primary">Results Publishing Board</h3>
                        <p className="text-xs text-text-muted mt-1">Locks final grades for a course offering and generates cumulative student GPAs/CGPAs.</p>
                    </div>

                    <div className="bg-surface rounded-[2.5rem] border border-border shadow-none overflow-hidden">
                        {loadingRoster ? (
                            <div className="text-center py-20 text-text-muted font-bold">Loading course roster...</div>
                        ) : roster.length === 0 ? (
                            <div className="text-center py-20 text-text-muted font-bold">No courses available.</div>
                        ) : (
                            <table className="w-full text-left text-sm text-text-secondary">
                                <thead className="bg-surface-hover text-text-muted text-[10px] uppercase tracking-widest font-semibold border-b border-border">
                                    <tr>
                                        <th className="px-6 py-4">Course Offering</th>
                                        <th className="px-6 py-4">Department & Sem</th>
                                        <th className="px-6 py-4">Student Count</th>
                                        <th className="px-6 py-4">Assessments Status</th>
                                        <th className="px-6 py-4">Publication Status</th>
                                        <th className="px-6 py-4 text-right pr-6">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {roster.map((c) => {
                                        const lockedCount = c.assessments.filter(a => a.status === 'LOCKED').length;
                                        const totalCount = c.totalAssessments;
                                        const canPublish = totalCount > 0 && lockedCount === totalCount;
                                        
                                        return (
                                            <tr key={c.courseofferingid} className="hover:bg-surface-hover/50 transition-colors">
                                                <td className="px-6 py-4 font-bold text-text-primary">{c.courseName} <span className="text-text-muted font-mono text-xs ml-1 font-semibold">{c.courseCode}</span></td>
                                                <td className="px-6 py-4 text-xs font-semibold text-text-secondary">{c.semesterName}</td>
                                                <td className="px-6 py-4 font-mono font-bold">{c.studentCount} students</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-0.5 rounded-[2px] text-[10px] font-bold ${canPublish ? 'text-success-text bg-background' : 'text-text-secondary bg-background'}`}>
                                                        {lockedCount} / {totalCount} Assessments Locked
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <AdminStatusBadge 
                                                        status={c.completedGrading ? 'PUBLISHED' : 'PENDING'} 
                                                        variant={c.completedGrading ? 'success' : 'warning'} 
                                                    />
                                                </td>
                                                <td className="px-6 py-4 text-right pr-6">
                                                    <button
                                                        onClick={() => handlePublishGrades(c.courseofferingid)}
                                                        disabled={!canPublish || c.completedGrading || publishGradesMutation.isPending}
                                                        className={`inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-[2px] transition-all ${
                                                            c.completedGrading 
                                                                ? 'text-success-text bg-background cursor-not-allowed'
                                                                : !canPublish 
                                                                    ? 'text-text-muted bg-background cursor-not-allowed'
                                                                    : 'text-white bg-primary hover:bg-primary-hover shadow-none shadow-indigo-100'
                                                        }`}
                                                    >
                                                        {c.completedGrading ? 'Published' : 'Publish Grades'}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {/* 5. TAB: TRANSCRIPTS */}
            {activeTab === 'transcripts' && (
                <div className="space-y-6 animate-in fade-in">
                    <div className="bg-surface p-6 rounded-[2px] border border-border shadow-none flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-semibold text-text-primary">Student Official Transcripts</h3>
                            <p className="text-xs text-text-muted mt-1">Search student rosters and generate print-optimized official academic transcripts.</p>
                        </div>
                        <div className="w-full md:w-80 relative">
                            <Search className="absolute left-4 top-3 h-4 w-4 text-text-muted" />
                            <input
                                type="text"
                                placeholder="Search by name, roll number..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-11 pr-4 py-2.5 rounded-[2px] border border-border text-xs outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all font-semibold"
                            />
                        </div>
                    </div>

                    <div className="bg-surface rounded-[2.5rem] border border-border shadow-none overflow-hidden">
                        {loadingAudits ? (
                            <div className="text-center py-20 text-text-muted font-bold">Loading student transcripts directory...</div>
                        ) : getFilteredList(degreeAudits, ['studentName', 'rollnumber']).length === 0 ? (
                            <div className="text-center py-20 text-text-muted font-bold">No students found matching search.</div>
                        ) : (
                            <table className="w-full text-left text-sm text-text-secondary">
                                <thead className="bg-surface-hover text-text-muted text-[10px] uppercase tracking-widest font-semibold border-b border-border">
                                    <tr>
                                        <th className="px-6 py-4">Student Name</th>
                                        <th className="px-6 py-4">Roll Number</th>
                                        <th className="px-6 py-4">Department</th>
                                        <th className="px-6 py-4">Completed Credits</th>
                                        <th className="px-6 py-4">Graduation Eligibility</th>
                                        <th className="px-6 py-4 text-right pr-6">Official Transcript</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {getFilteredList(degreeAudits, ['studentName', 'rollnumber']).map((a) => (
                                        <tr key={a.studentId} className="hover:bg-surface-hover/50 transition-colors">
                                            <td className="px-6 py-4 font-bold text-text-primary">{a.studentName}</td>
                                            <td className="px-6 py-4 font-mono font-bold text-text-secondary text-xs">{a.rollnumber}</td>
                                            <td className="px-6 py-4 font-semibold text-text-secondary text-xs">{a.department}</td>
                                            <td className="px-6 py-4 font-mono font-bold text-text-primary">{a.earnedCredits} hrs</td>
                                            <td className="px-6 py-4">
                                                <AdminStatusBadge 
                                                    status={a.eligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'} 
                                                    variant={a.eligible ? 'success' : 'default'} 
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-right pr-6">
                                                <Link
                                                    href={`/dashboard/admin/examination/transcript/${a.studentId}`}
                                                    target="_blank"
                                                    className="inline-flex items-center gap-1 text-xs font-bold text-primary bg-primary-light hover:bg-indigo-100 px-3.5 py-2 rounded-[2px] transition-all"
                                                >
                                                    <Printer className="w-3.5 h-3.5" /> Print Transcript
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {/* 6. TAB: PROMOTION & STANDING */}
            {activeTab === 'promotion' && (
                <div className="space-y-6 animate-in fade-in">
                    <div className="bg-surface p-6 rounded-[2px] border border-border shadow-none flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-semibold text-text-primary">Promotion & Academic Standing Oversight</h3>
                            <p className="text-xs text-text-muted mt-1">Review computed recommendations and adjust student standings (Good Standing, Probation, Repeat, Graduated).</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="bg-surface border border-border rounded-[2px] px-4 py-2.5 text-xs font-bold text-text-secondary outline-none focus:border-indigo-500 transition-all shadow-none"
                            >
                                <option value="ALL">All Standings</option>
                                <option value="GOOD_STANDING">Good Standing</option>
                                <option value="WARNING">Warning</option>
                                <option value="PROBATION">Probation</option>
                                <option value="SUSPENDED">Suspended</option>
                            </select>
                        </div>
                    </div>

                    <div className="bg-surface rounded-[2.5rem] border border-border shadow-none overflow-hidden">
                        {loadingPromotions ? (
                            <div className="text-center py-20 text-text-muted font-bold">Evaluating promotion candidate evaluations...</div>
                        ) : getFilteredList(recommendations, ['fullname', 'rollnumber']).length === 0 ? (
                            <div className="text-center py-20 text-text-muted font-bold">No students found matching standings filter.</div>
                        ) : (
                            <table className="w-full text-left text-sm text-text-secondary">
                                <thead className="bg-surface-hover text-text-muted text-[10px] uppercase tracking-widest font-semibold border-b border-border">
                                    <tr>
                                        <th className="px-6 py-4">Student Info</th>
                                        <th className="px-6 py-4">Roll Number</th>
                                        <th className="px-6 py-4">Credits Completed</th>
                                        <th className="px-6 py-4">CGPA</th>
                                        <th className="px-6 py-4">Standing</th>
                                        <th className="px-6 py-4">Action Status</th>
                                        <th className="px-6 py-4">System Recommendation</th>
                                        <th className="px-6 py-4 text-right pr-6">Override</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {getFilteredList(recommendations, ['fullname', 'rollnumber']).map((r) => (
                                        <tr key={r.studentId} className="hover:bg-surface-hover/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-text-primary">{r.fullname}</span>
                                                    <span className="text-xs text-text-muted">{r.departmentName}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-mono font-bold text-text-secondary text-xs">{r.rollnumber}</td>
                                            <td className="px-6 py-4 font-mono font-bold text-text-primary">{r.earnedCredits} hrs</td>
                                            <td className="px-6 py-4 font-mono font-semibold text-text-primary">{r.cgpa.toFixed(2)}</td>
                                            <td className="px-6 py-4">
                                                <AdminStatusBadge 
                                                    status={r.currentStanding.replace('_', ' ')} 
                                                    variant={r.currentStanding === 'GOOD_STANDING' ? 'success' : r.currentStanding === 'PROBATION' ? 'error' : r.currentStanding === 'WARNING' ? 'warning' : 'default'} 
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <AdminStatusBadge 
                                                    status={r.currentStatus === 'ALUMNI' ? 'GRADUATED' : 'ACTIVE'} 
                                                    variant={r.currentStatus === 'ALUMNI' ? 'success' : 'primary'} 
                                                />
                                            </td>
                                            <td className="px-6 py-4 max-w-xs">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-text-primary">{r.statusReason}</span>
                                                    <span className="text-[10px] text-text-muted font-semibold mt-0.5">Recommended: {r.recommendedStanding.replace('_', ' ')}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right pr-6">
                                                <button
                                                    onClick={() => {
                                                        setSelectedStudentForPromotion(r);
                                                        setPromotionForm({
                                                            status: r.recommendedStatus,
                                                            standing: r.recommendedStanding,
                                                            comment: ''
                                                        });
                                                        setIsPromotionModalOpen(true);
                                                    }}
                                                    className="inline-flex items-center gap-1 text-xs font-bold text-primary bg-primary-light hover:bg-indigo-100 px-3.5 py-2 rounded-[2px] transition-all"
                                                >
                                                    Override Standing
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {/* 7. TAB: DEGREE AUDIT */}
            {activeTab === 'degree-audit' && (
                <div className="space-y-6 animate-in fade-in">
                    <div className="flex justify-between items-center bg-surface p-6 rounded-[2px] border border-border shadow-none flex-col sm:flex-row gap-4">
                        <div>
                            <h3 className="text-lg font-semibold text-text-primary">Graduation & Degree Audits</h3>
                            <p className="text-xs text-text-muted mt-1">Audit student completed credits against curriculum requirements (130 Credit Hours).</p>
                        </div>
                        <button
                            onClick={() => {
                                if (confirm('Re-run credit compliance calculations for all student records? This may take a few seconds.')) {
                                    reevaluateAuditsMutation.mutate();
                                }
                            }}
                            disabled={reevaluateAuditsMutation.isPending}
                            className="bg-primary hover:bg-primary-hover text-white font-semibold text-xs px-5 py-3 rounded-[2px] transition-all shadow-none shadow-indigo-100 flex items-center gap-1.5 disabled:opacity-50"
                        >
                            <RefreshCw className={`w-4 h-4 ${reevaluateAuditsMutation.isPending ? 'animate-spin' : ''}`} /> Re-evaluate Audits
                        </button>
                    </div>

                    <div className="bg-surface rounded-[2.5rem] border border-border shadow-none overflow-hidden">
                        {loadingAudits ? (
                            <div className="text-center py-20 text-text-muted font-bold">Running degree audit query...</div>
                        ) : degreeAudits.length === 0 ? (
                            <div className="text-center py-20 text-text-muted font-bold">No degree audit records. Click reevaluate above to generate them.</div>
                        ) : (
                            <table className="w-full text-left text-sm text-text-secondary">
                                <thead className="bg-surface-hover text-text-muted text-[10px] uppercase tracking-widest font-semibold border-b border-border">
                                    <tr>
                                        <th className="px-6 py-4">Student Name</th>
                                        <th className="px-6 py-4">Roll Number</th>
                                        <th className="px-6 py-4">Department & Sem</th>
                                        <th className="px-6 py-4">Required Credits</th>
                                        <th className="px-6 py-4">Completed Credits</th>
                                        <th className="px-6 py-4">Remaining Credits</th>
                                        <th className="px-6 py-4">Graduation Eligibility</th>
                                        <th className="px-6 py-4 text-right pr-6">Degree State</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {degreeAudits.map((a) => (
                                        <tr key={a.degreeauditid} className="hover:bg-surface-hover/50 transition-colors">
                                            <td className="px-6 py-4 font-bold text-text-primary">{a.studentName}</td>
                                            <td className="px-6 py-4 font-mono font-bold text-text-secondary text-xs">{a.rollnumber}</td>
                                            <td className="px-6 py-4 font-semibold text-text-secondary text-xs">{a.department}</td>
                                            <td className="px-6 py-4 font-mono text-text-secondary">{a.requiredCredits} hrs</td>
                                            <td className="px-6 py-4 font-mono font-bold text-text-primary">{a.earnedCredits} hrs</td>
                                            <td className="px-6 py-4 font-mono text-text-secondary">{a.remainingCredits} hrs</td>
                                            <td className="px-6 py-4">
                                                <AdminStatusBadge status={a.eligible ? 'COMPLIANT' : 'INCOMPLETE'} variant={a.eligible ? 'success' : 'error'} />
                                            </td>
                                            <td className="px-6 py-4 text-right pr-6">
                                                <AdminStatusBadge status={a.status} variant={a.status === 'GRADUATED' ? 'success' : a.status === 'ELIGIBLE' ? 'primary' : 'default'} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {/* 8. TAB: STATISTICS */}
            {activeTab === 'statistics' && (
                <div className="space-y-6 animate-in fade-in">
                    <div className="bg-surface p-6 rounded-[2px] border border-border shadow-none">
                        <h3 className="text-lg font-semibold text-text-primary">Academic Grading Statistics</h3>
                        <p className="text-xs text-text-muted mt-1">Review department GPA benchmarks, course compliance ratings, and top academic performers.</p>
                    </div>

                    {loadingStats ? (
                        <div className="text-center py-20 text-text-muted font-bold">Computing statistics data...</div>
                    ) : !stats ? (
                        <div className="text-center py-20 text-text-muted font-bold">No academic statistics available.</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Department GPA Averages */}
                            <div className="bg-surface p-6 border border-border rounded-[2px] shadow-none space-y-4">
                                <h4 className="text-sm font-semibold text-text-primary uppercase tracking-wide">Department Average GPAs</h4>
                                <div className="space-y-3">
                                    {stats.departmentGpaAverages.map((d, i) => (
                                        <div key={i} className="flex justify-between items-center bg-surface-hover px-4 py-3 rounded-[2px] border border-border">
                                            <span className="font-bold text-text-primary text-xs">{d.departmentName}</span>
                                            <span className="font-mono font-semibold text-primary text-sm">{d.avgGpa.toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Top Performers Listing */}
                            <div className="bg-surface p-6 border border-border rounded-[2px] shadow-none space-y-4">
                                <h4 className="text-sm font-semibold text-text-primary uppercase tracking-wide">Top Performing Students</h4>
                                <div className="space-y-3">
                                    {stats.topPerformers.map((p, i) => (
                                        <div key={i} className="flex justify-between items-center bg-surface-hover px-4 py-2.5 rounded-[2px] border border-border">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-text-primary text-xs">{p.studentName}</span>
                                                <span className="text-[10px] font-mono text-text-muted">{p.rollnumber} | {p.department}</span>
                                            </div>
                                            <span className="font-mono font-semibold text-success-text text-sm bg-background px-3 py-1 rounded-[2px]">{p.cgpa.toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* High Failure Rate Warning Signals */}
                            <div className="bg-surface p-6 border border-border rounded-[2px] shadow-none space-y-4 md:col-span-2">
                                <h4 className="text-sm font-semibold text-text-primary uppercase tracking-wide flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-rose-500" /> Early Academic Failure Warning Signals (Highest Failure Rate)
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {stats.highFailureCourses.map((c, i) => (
                                        <div key={i} className="border-2 border-rose-50 rounded-[2px] p-5 bg-error-bg/20 flex flex-col justify-between">
                                            <div>
                                                <span className="text-[10px] font-mono font-semibold text-error-text uppercase tracking-wider">{c.courseCode}</span>
                                                <h5 className="font-bold text-text-primary text-sm mt-1">{c.courseName}</h5>
                                            </div>
                                            <div className="mt-4 pt-3 border-t border-border flex justify-between items-center text-xs font-semibold text-text-secondary">
                                                <span>Fail Rate: <strong className="text-error-text text-sm font-semibold">{c.failRate}%</strong></span>
                                                <span>Completed: <strong>{c.completedCount} stds</strong></span>
                                            </div>
                                        </div>
                                    ))}
                                    {stats.highFailureCourses.length === 0 && (
                                        <p className="text-xs font-bold text-text-muted italic py-2">No failure warning signals registered.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Create Schedule Modal */}
            {isScheduleModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 animate-in fade-in">
                    <div className="bg-surface rounded-[2px] w-full max-w-lg p-8 shadow-none border border-border scale-in-center">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-xl font-semibold text-text-primary flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-primary" />
                                    Schedule Exam Session
                                </h3>
                                <p className="text-xs text-text-muted mt-1">Book room, select date, type, and assign an invigilator.</p>
                            </div>
                            <button onClick={() => setIsScheduleModalOpen(false)} className="p-1 rounded-[2px] hover:bg-background text-text-muted"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleCreateSchedule} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">Assessment</label>
                                    <select required value={scheduleForm.assessmentId} onChange={e => setScheduleForm({...scheduleForm, assessmentId: e.target.value})} className="w-full border border-border rounded-[2px] p-3 text-xs font-semibold outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50">
                                        <option value="">Select Assessment</option>
                                        {roster.map((r: any) => (
                                            <optgroup key={r.courseofferingid} label={`${r.courseCode} - ${r.courseName} (${r.semesterName})`}>
                                                {r.assessments.map((a: any) => (
                                                    <option key={a.assessmentid} value={a.assessmentid}>{a.name} ({a.type})</option>
                                                ))}
                                            </optgroup>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">Room</label>
                                    <select required value={scheduleForm.roomId} onChange={e => setScheduleForm({...scheduleForm, roomId: e.target.value})} className="w-full border border-border rounded-[2px] p-3 text-xs font-semibold outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50">
                                        <option value="">Select Room</option>
                                        {rooms.map((room: any) => (
                                            <option key={room.roomid} value={room.roomid}>{room.code} - {room.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">Section</label>
                                    <select required value={scheduleForm.sectionId} onChange={e => setScheduleForm({...scheduleForm, sectionId: e.target.value})} className="w-full border border-border rounded-[2px] p-3 text-xs font-semibold outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50">
                                        <option value="">Select Section</option>
                                        {programs.map((prog: any) => (
                                            <optgroup key={prog.programid} label={prog.code}>
                                                {prog.section?.map((sec: any) => (
                                                    <option key={sec.sectionid} value={sec.sectionid}>{sec.name}</option>
                                                ))}
                                            </optgroup>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">Exam Type</label>
                                    <select value={scheduleForm.examType} onChange={e => setScheduleForm({...scheduleForm, examType: e.target.value})} className="w-full border border-border rounded-[2px] p-3 text-xs font-bold text-text-primary outline-none focus:border-indigo-500">
                                        <option value="FINAL">Final Exam</option>
                                        <option value="MIDTERM">Midterm Exam</option>
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">Date</label>
                                    <input type="date" required value={scheduleForm.date} onChange={e => setScheduleForm({...scheduleForm, date: e.target.value})} className="w-full border border-border rounded-[2px] p-3 text-xs font-semibold outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">Start Time</label>
                                    <input type="time" required value={scheduleForm.startTime} onChange={e => setScheduleForm({...scheduleForm, startTime: e.target.value})} className="w-full border border-border rounded-[2px] p-3 text-xs font-semibold outline-none" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">End Time</label>
                                    <input type="time" required value={scheduleForm.endTime} onChange={e => setScheduleForm({...scheduleForm, endTime: e.target.value})} className="w-full border border-border rounded-[2px] p-3 text-xs font-semibold outline-none" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">Duration (minutes)</label>
                                    <input type="number" required value={scheduleForm.duration} onChange={e => setScheduleForm({...scheduleForm, duration: e.target.value})} className="w-full border border-border rounded-[2px] p-3 text-xs font-semibold outline-none" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">Invigilator Faculty ID (Optional)</label>
                                    <input type="number" value={scheduleForm.facultyId} onChange={e => setScheduleForm({...scheduleForm, facultyId: e.target.value})} className="w-full border border-border rounded-[2px] p-3 text-xs font-semibold outline-none" placeholder="e.g. 4" />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={createScheduleMutation.isPending}
                                className="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-3.5 rounded-[2px] transition-all shadow-none shadow-indigo-150 mt-4"
                            >
                                {createScheduleMutation.isPending ? 'Scheduling...' : 'Commit Exam Schedule'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Marks Verification Modal */}
            {isVerificationModalOpen && selectedAssessmentId && (
                <div className="fixed inset-0 bg-slate-900/60  flex items-center justify-center z-50 p-4 animate-in fade-in">
                    <div className="bg-surface rounded-[2px] w-full max-w-2xl p-8 shadow-none border border-border scale-in-center max-h-[85vh] flex flex-col">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-semibold text-text-primary flex items-center gap-2">
                                    <ShieldAlert className="w-5 h-5 text-primary" />
                                    Marks Verification
                                </h3>
                                <p className="text-xs text-text-muted mt-1">Audit students obtained marks before signing off.</p>
                            </div>
                            <button 
                                onClick={() => {
                                    setIsVerificationModalOpen(false);
                                    setSelectedAssessmentId(null);
                                }}
                                className="p-1 rounded-[2px] hover:bg-background text-text-muted"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto min-h-[250px] border border-border rounded-[2px] p-4 bg-surface-hover/50">
                            {loadingMarks ? (
                                <div className="text-center py-10 font-bold text-text-muted">Loading student scores...</div>
                            ) : marks.length === 0 ? (
                                <div className="text-center py-10 font-bold text-text-muted">No marks uploaded for this assessment.</div>
                            ) : (
                                <table className="w-full text-left text-xs text-text-secondary">
                                    <thead className="bg-background text-text-muted font-bold uppercase tracking-wider border-b border-border">
                                        <tr>
                                            <th className="px-4 py-2">Student Name</th>
                                            <th className="px-4 py-2">Roll Number</th>
                                            <th className="px-4 py-2">Obtained Marks</th>
                                            <th className="px-4 py-2">Lock State</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-surface">
                                        {marks.map((m) => (
                                            <tr key={m.resultid} className="hover:bg-surface-hover/20">
                                                <td className="px-4 py-3 font-bold text-text-primary">{m.studentName}</td>
                                                <td className="px-4 py-3 font-mono text-text-secondary">{m.rollnumber}</td>
                                                <td className="px-4 py-3 font-mono font-semibold text-text-primary">{m.obtainedmarks}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${m.islocked ? 'bg-background text-emerald-800' : 'bg-warning-bg text-amber-800'}`}>
                                                        {m.islocked ? 'Locked' : 'Draft'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        <div className="pt-6 border-t border-border flex gap-3 mt-4">
                            <button
                                onClick={() => {
                                    setIsVerificationModalOpen(false);
                                    setSelectedAssessmentId(null);
                                }}
                                className="flex-1 bg-background hover:bg-slate-200 text-text-secondary font-semibold py-3.5 rounded-[2px] transition-all"
                            >
                                Close View
                            </button>
                            <button
                                onClick={handleLockMarks}
                                disabled={lockMarksMutation.isPending || marks.length === 0}
                                className="flex-1 bg-primary hover:bg-primary-hover text-white font-semibold py-3.5 rounded-[2px] transition-all shadow-none shadow-indigo-150 disabled:opacity-50"
                            >
                                {lockMarksMutation.isPending ? 'Verifying...' : 'Verify & Lock Marks'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Override Promotion Modal */}
            {isPromotionModalOpen && selectedStudentForPromotion && (
                <div className="fixed inset-0 bg-slate-900/60  flex items-center justify-center z-50 p-4 animate-in fade-in">
                    <div className="bg-surface rounded-[2px] w-full max-w-lg p-8 shadow-none border border-border scale-in-center">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-xl font-semibold text-text-primary flex items-center gap-2">
                                    <ShieldAlert className="w-5 h-5 text-primary" />
                                    Override Academic Standing
                                </h3>
                                <p className="text-xs text-text-muted mt-1">Directly adjust student status & standing for the semester record.</p>
                            </div>
                            <button 
                                onClick={() => {
                                    setIsPromotionModalOpen(false);
                                    setSelectedStudentForPromotion(null);
                                }} 
                                className="p-1 rounded-[2px] hover:bg-background text-text-muted"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleExecutePromotion} className="space-y-4">
                            <div className="bg-surface-hover border border-slate-150 rounded-[2px] p-4 mb-4 text-xs font-semibold text-text-primary">
                                <p className="font-bold text-text-primary">Student: {selectedStudentForPromotion.fullname}</p>
                                <p className="mt-1">Roll No: {selectedStudentForPromotion.rollnumber}</p>
                                <p>CGPA: {selectedStudentForPromotion.cgpa.toFixed(2)} | Credits: {selectedStudentForPromotion.earnedCredits} hrs</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">Student Status</label>
                                    <select
                                        value={promotionForm.status}
                                        onChange={e => setPromotionForm({...promotionForm, status: e.target.value})}
                                        className="w-full border border-border rounded-[2px] p-3 text-xs font-bold text-text-primary outline-none focus:border-indigo-500"
                                    >
                                        <option value="ACTIVE">Active Student</option>
                                        <option value="ALUMNI">Alumni (Graduate)</option>
                                        <option value="SUSPENDED">Suspended</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">Academic Standing</label>
                                    <select
                                        value={promotionForm.standing}
                                        onChange={e => setPromotionForm({...promotionForm, standing: e.target.value})}
                                        className="w-full border border-border rounded-[2px] p-3 text-xs font-bold text-text-primary outline-none focus:border-indigo-500"
                                    >
                                        <option value="GOOD_STANDING">Good Standing</option>
                                        <option value="WARNING">Academic Warning</option>
                                        <option value="PROBATION">Probation</option>
                                        <option value="SUSPENDED">Academic Suspension</option>
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">Override Comments / Remarks</label>
                                    <textarea
                                        required
                                        value={promotionForm.comment}
                                        onChange={e => setPromotionForm({...promotionForm, comment: e.target.value})}
                                        placeholder="Explain reason for manual promotion standing change..."
                                        rows={3}
                                        className="w-full border border-border rounded-[2px] p-3 text-xs font-semibold outline-none focus:border-indigo-500 resize-none"
                                    ></textarea>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={executePromotionMutation.isPending}
                                className="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-3.5 rounded-[2px] transition-all shadow-none mt-4 disabled:opacity-50"
                            >
                                {executePromotionMutation.isPending ? 'Saving Override...' : 'Commit Academic Override'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
