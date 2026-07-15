'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { UserRole } from '@/types/types';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/api/apiContract';
import { useCurrentProfile } from '@/features/profile/hooks/useProfile';
import { useState } from 'react';
import { History, FileText, CheckCircle2, XCircle, AlertCircle, Clock } from 'lucide-react';

export default function CentralizedHistoryPage() {
    const { data: profile, isLoading: isProfileLoading } = useCurrentProfile();
    const [activeTab, setActiveTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('ALL');
    const [subCategory, setSubCategory] = useState<'ALL' | 'LEAVE' | 'ENROLLMENT' | 'LOAD' | 'REPORT'>('ALL');

    const role = (profile?.role?.toLowerCase() as UserRole) || UserRole.STUDENT;
    const userId = profile?.userId;

    // Fetch leaves
    const { data: leaves = [], isLoading: isLeavesLoading } = useQuery<any[]>({
        queryKey: ['history-leaves', role, userId],
        queryFn: () => apiGet('/faculty/leaves'),
        enabled: !!profile && role === UserRole.FACULTY
    });

    // Fetch enrollment requests
    const { data: enrollments = [], isLoading: isEnrollmentsLoading } = useQuery<any[]>({
        queryKey: ['history-enrollments', role, userId],
        queryFn: () => apiGet('/student/enrollment/mine'),
        enabled: !!profile && role === UserRole.STUDENT
    });

    // Fetch teaching loads
    const { data: teachingLoads = [], isLoading: isLoadsLoading } = useQuery<any[]>({
        queryKey: ['history-loads', role, userId],
        queryFn: () => apiGet<any>('/faculty/teaching-loads'),
        enabled: !!profile && role === UserRole.FACULTY
    });

    // Fetch daily activity reports
    const { data: activityReports = [], isLoading: isReportsLoading } = useQuery<any[]>({
        queryKey: ['history-activity-reports', role, userId],
        queryFn: () => apiGet('/faculty/activity'),
        enabled: !!profile && role === UserRole.FACULTY
    });

    if (isProfileLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-[2px] animate-spin"></div>
            </div>
        );
    }

    const displayName = profile?.fullName || profile?.username || 'User';

    // Consolidate all requests into a single unified array with standardized properties
    const historyItems: { id: string; type: string; title: string; date: string; status: string; detail: string }[] = [];

    // Filter own requests or managed requests depending on role
    // Leaves
    const filteredLeaves = role === UserRole.FACULTY 
        ? leaves.filter(l => l.userid === userId) 
        : leaves;
    filteredLeaves.forEach(l => {
        historyItems.push({
            id: `leave-${l.leaverequestid}`,
            type: 'LEAVE',
            title: 'Leave Request',
            date: new Date(l.createdat).toLocaleDateString(),
            status: l.status,
            detail: `Date range: ${new Date(l.startdate).toLocaleDateString()} - ${new Date(l.enddate).toLocaleDateString()} (${l.leavetype})`
        });
    });

    // Enrollments
    enrollments.forEach(e => {
        historyItems.push({
            id: `enr-${e.enrollmentrequestid}`,
            type: 'ENROLLMENT',
            title: `Course Enrollment Request`,
            date: new Date(e.createdat).toLocaleDateString(),
            status: e.status,
            detail: `${e.courseoffering?.course?.name || 'Course'} (${e.courseoffering?.course?.code || 'CS-101'})`
        });
    });

    // Teaching Loads
    teachingLoads.forEach(tl => {
        const assignmentsStr = tl.teachingassignment?.map((a: any) => a.courseoffering?.course?.name).join(', ') || 'Draft Load';
        historyItems.push({
            id: `load-${tl.teachingloadid}`,
            type: 'LOAD',
            title: 'Teaching Load Proposal',
            date: new Date(tl.createdat).toLocaleDateString(),
            status: tl.status,
            detail: `Selected: ${assignmentsStr}`
        });
    });

    // Activity Reports
    activityReports.forEach(r => {
        historyItems.push({
            id: `rep-${r.dailyactivityreportid}`,
            type: 'REPORT',
            title: 'Daily Activity Log',
            date: new Date(r.createdat).toLocaleDateString(),
            status: r.status,
            detail: r.summary
        });
    });

    // Filter by tab status
    const statusFiltered = historyItems.filter(item => {
        const statusLower = item.status?.toUpperCase() || '';
        if (activeTab === 'PENDING') {
            return statusLower.includes('PENDING') || statusLower === 'SUBMITTED' || statusLower === 'UNDER_REVIEW';
        }
        if (activeTab === 'APPROVED') return statusLower === 'APPROVED';
        if (activeTab === 'REJECTED') return statusLower === 'REJECTED';
        return true; // 'ALL'
    });

    // Filter by subcategory
    const categoryFiltered = statusFiltered.filter(item => {
        if (subCategory === 'ALL') return true;
        return item.type === subCategory;
    });

    const getStatusIcon = (status: string) => {
        const statusUpper = status?.toUpperCase() || '';
        if (statusUpper === 'APPROVED') return <CheckCircle2 className="w-5 h-5 text-success-bg0" />;
        if (statusUpper === 'REJECTED') return <XCircle className="w-5 h-5 text-error-bg0" />;
        if (statusUpper.includes('PENDING') || statusUpper === 'SUBMITTED' || statusUpper === 'UNDER_REVIEW') return <Clock className="w-5 h-5 text-blue-500" />;
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
    };

    const getStatusBadge = (status: string) => {
        const statusUpper = status?.toUpperCase() || '';
        let colors = 'bg-background text-text-primary';
        if (statusUpper === 'APPROVED') colors = 'bg-green-100 text-green-700 font-bold';
        if (statusUpper === 'REJECTED') colors = 'bg-red-100 text-red-700 font-bold';
        if (statusUpper.includes('PENDING') || statusUpper === 'SUBMITTED' || statusUpper === 'UNDER_REVIEW') colors = 'bg-primary-light text-primary font-bold';
        if (statusUpper === 'ESCALATED') colors = 'bg-orange-100 text-orange-700 font-bold ';

        return (
            <span className={`px-2.5 py-1 rounded-[2px] text-xs font-semibold ${colors}`}>
                {status}
            </span>
        );
    };

    const isLoading = isLeavesLoading || isEnrollmentsLoading || isLoadsLoading || isReportsLoading;

    return (
        <DashboardLayout
            userRole={role}
            userName={displayName}
            notifications={[]}
            currentPath="/dashboard/history"
        >
            <div className="max-w-5xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="bg-surface rounded-[2px] p-6 shadow-none border border-border mb-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-text-primary leading-tight mt-2">Request History Log 🕰️</h1>
                    <p className="text-text-secondary text-sm mt-1">Audit log of your submissions, approvals status transitions, and final resolutions records.</p>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    {/* Status Tabs */}
                    <div className="flex bg-background p-1.5 rounded-[2px] w-fit">
                        {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 rounded-[2px] text-xs font-bold transition-all ${activeTab === tab
                                    ? 'bg-surface text-text-primary shadow-none'
                                    : 'text-text-secondary hover:text-text-primary'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Category Filter */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Filter by:</span>
                        <select
                            value={subCategory}
                            onChange={e => setSubCategory(e.target.value as any)}
                            className="bg-surface border border-border rounded-[2px] px-3 py-1.5 text-xs font-bold text-text-primary outline-none"
                        >
                            <option value="ALL">All Categories</option>
                            {role === UserRole.FACULTY && <option value="LEAVE">Leave Requests</option>}
                            {role === UserRole.STUDENT && <option value="ENROLLMENT">Enrollments</option>}
                            {role === UserRole.FACULTY && <option value="LOAD">Teaching Loads</option>}
                            {role === UserRole.FACULTY && <option value="REPORT">Activity Reports</option>}
                        </select>
                    </div>
                </div>

                {/* Items */}
                {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-[2px] animate-spin"></div>
                    </div>
                ) : categoryFiltered.length === 0 ? (
                    <div className="bg-surface border border-border rounded-[2px] p-12 text-center shadow-none">
                        <History className="w-12 h-12 text-border-hover mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-text-primary">No records found</h3>
                        <p className="text-text-secondary text-sm mt-1">Try adjusting your filters or submit a new request.</p>
                    </div>
                ) : (
                    <div className="bg-surface border border-border rounded-[2px] overflow-hidden shadow-none divide-y divide-[#EDEBE9]">
                        {categoryFiltered.map(item => (
                            <div key={item.id} className="p-6 hover:bg-surface-hover/50 transition-colors flex items-start gap-4">
                                <div className="p-2 rounded-[2px] bg-background text-text-secondary mt-1">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-primary bg-primary-light px-2 py-0.5 rounded uppercase tracking-wider">{item.type}</span>
                                            <h3 className="font-bold text-text-primary text-base">{item.title}</h3>
                                        </div>
                                        <span className="text-xs text-text-muted font-medium">{item.date}</span>
                                    </div>
                                    <p className="text-sm text-text-primary mt-1">{item.detail}</p>
                                    <div className="mt-3 flex items-center gap-2">
                                        {getStatusIcon(item.status)}
                                        {getStatusBadge(item.status)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
