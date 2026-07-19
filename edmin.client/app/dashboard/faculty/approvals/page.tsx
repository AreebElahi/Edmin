'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/api/apiContract';
import { BookOpen, Calendar, Home, CheckSquare } from 'lucide-react';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminTabBar from '@/components/admin/AdminTabBar';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import AdminStatusBadge from '@/components/admin/AdminStatusBadge';
import { UserRole } from '@/types/types';
import { DashboardAPI } from '@/utils/api';
import { useState, useEffect } from 'react';

export default function FacultyApprovalsPage() {
    const [profile, setProfile] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'loads' | 'leaves'>('loads');

    useEffect(() => {
        DashboardAPI.getFacultyDashboard().then(res => setProfile(res?.profile)).catch(console.error);
    }, []);

    const { data: approvals, isLoading } = useQuery({
        queryKey: ['my-approvals'],
        queryFn: () => apiGet('/faculty/approvals')
    });

    const { teachingLoads = [], leaveRequests = [] } = (approvals as any)?.data || {};

    const getStatusVariant = (status: string): 'success' | 'error' | 'warning' | 'primary' | 'default' => {
        if (!status) return 'warning';
        const s = status.toUpperCase();
        if (s === 'APPROVED') return 'success';
        if (s === 'REJECTED') return 'error';
        if (s === 'PENDING') return 'warning';
        return 'primary';
    };

    return (
        <DashboardLayout 
            userRole={UserRole.FACULTY} 
            userName={profile?.fullname || 'Faculty'} 
            userAvatar={profile?.avatar} 
            notifications={[]} 
            currentPath="/dashboard/faculty/approvals"
        >
            <AdminPageWrapper>
                <AdminPageHeader
                    icon={CheckSquare}
                    title="My Pending"
                    titleAccent="Requests"
                    subtitle="Track the approval status of your teaching loads and leave requests."
                    eyebrow={{ icon: Home, label: "Faculty Portal" }}
                />

                <AdminTabBar
                    tabs={[
                        { id: 'loads', label: 'Teaching Loads' },
                        { id: 'leaves', label: 'Leave Requests' }
                    ]}
                    activeTab={activeTab}
                    onTabChange={(id) => setActiveTab(id as any)}
                />

                <div className="bg-surface rounded-[2px] shadow-none border border-border overflow-hidden flex flex-col flex-1">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-text-secondary whitespace-nowrap">
                            <thead className="bg-surface-hover text-text-secondary text-xs uppercase tracking-widest font-semibold">
                                <tr>
                                    {activeTab === 'loads' ? (
                                        <>
                                            <th className="px-6 py-4">Semester Details</th>
                                            <th className="px-6 py-4">Courses Assigned</th>
                                            <th className="px-6 py-4">Supervisor Review</th>
                                            <th className="px-6 py-4">HOD Review</th>
                                            <th className="px-6 py-4 text-right">Final Status</th>
                                        </>
                                    ) : (
                                        <>
                                            <th className="px-6 py-4">Leave Type</th>
                                            <th className="px-6 py-4">Duration</th>
                                            <th className="px-6 py-4">Date Submitted</th>
                                            <th className="px-6 py-4 text-right">Status</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border bg-surface">
                                {isLoading ? (
                                    <tr><td colSpan={5} className="text-center py-10">Loading your requests...</td></tr>
                                ) : (
                                    <>
                                        {activeTab === 'loads' && (teachingLoads.length === 0 ? (
                                            <tr><td colSpan={5} className="text-center py-10 text-text-secondary font-bold">No teaching loads found.</td></tr>
                                        ) : teachingLoads.map((tl: any) => (
                                            <tr key={tl.teachingloadid} className="hover:bg-surface-hover transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-text-primary flex items-center gap-2">
                                                        <BookOpen className="w-4 h-4 text-primary" /> {tl.semester?.term} {tl.semester?.year}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-medium">{tl.teachingassignment?.length || 0} Courses</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <AdminStatusBadge status={tl.supervisorstatus || 'PENDING'} variant={getStatusVariant(tl.supervisorstatus || 'PENDING')} />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <AdminStatusBadge status={tl.hodstatus || 'PENDING'} variant={getStatusVariant(tl.hodstatus || 'PENDING')} />
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <AdminStatusBadge status={tl.status} variant={getStatusVariant(tl.status)} />
                                                </td>
                                            </tr>
                                        )))}

                                        {activeTab === 'leaves' && (leaveRequests.length === 0 ? (
                                            <tr><td colSpan={4} className="text-center py-10 text-text-secondary font-bold">No leave requests found.</td></tr>
                                        ) : leaveRequests.map((lr: any) => (
                                            <tr key={lr.leaverequestid} className="hover:bg-surface-hover transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-text-primary flex items-center gap-2">
                                                        <Calendar className="w-4 h-4 text-purple-600" /> {lr.leavetype}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm">
                                                        {new Date(lr.startdate).toLocaleDateString()} to {new Date(lr.enddate).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-xs text-text-muted">{new Date(lr.createdat || lr.startdate).toLocaleDateString()}</div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <AdminStatusBadge status={lr.status} variant={getStatusVariant(lr.status)} />
                                                </td>
                                            </tr>
                                        )))}
                                    </>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </AdminPageWrapper>
        </DashboardLayout>
    );
}
