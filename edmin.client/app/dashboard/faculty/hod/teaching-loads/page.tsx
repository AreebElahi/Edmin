'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { UserRole } from '@/types/types';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminTabBar from '@/components/admin/AdminTabBar';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import AdminStatusBadge from '@/components/admin/AdminStatusBadge';
import { BookOpen, Building, Check, X, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { HodAPI } from '@/utils/api';

export default function HodTeachingLoadsPage() {
    const [activeTab, setActiveTab] = useState<'pending' | 'approved'>('pending');
    const queryClient = useQueryClient();

    const { data: loadsRes, isLoading } = useQuery({
        queryKey: ['hod-teaching-loads'],
        queryFn: () => HodAPI.getDepartmentTeachingLoads()
    });

    const loads = loadsRes || [];

    const pendingLoads = loads.filter((l: any) => l.status === 'PENDING' && l.hodstatus === 'PENDING');
    const approvedLoads = loads.filter((l: any) => l.hodstatus === 'APPROVED' || l.hodstatus === 'REJECTED' || l.status === 'APPROVED' || l.status === 'REJECTED');

    const displayLoads = activeTab === 'pending' ? pendingLoads : approvedLoads;

    const getStatusVariant = (status: string) => {
        if (!status) return 'warning';
        if (status === 'APPROVED') return 'success';
        if (status === 'REJECTED') return 'error';
        return 'warning';
    };

    return (
        <DashboardLayout userRole={UserRole.FACULTY} userName="HOD" notifications={[]} currentPath="/dashboard/faculty/hod/teaching-loads">
            <AdminPageWrapper>
                <AdminPageHeader
                    icon={BookOpen}
                    title="Teaching Loads"
                    titleAccent="Review"
                    subtitle="Review and approve teaching loads for the department faculty."
                    eyebrow={{ icon: Building, label: "HOD Administration" }}
                />
                
                <AdminTabBar
                    tabs={[
                        { id: 'pending', label: `Pending Approval (${pendingLoads.length})` },
                        { id: 'approved', label: 'History' }
                    ]}
                    activeTab={activeTab}
                    onTabChange={(id) => setActiveTab(id as any)}
                />

                <div className="bg-surface rounded-[2.5rem] shadow-none border border-border overflow-hidden flex flex-col flex-1">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-text-secondary whitespace-nowrap">
                            <thead className="bg-surface-hover text-text-secondary text-xs uppercase tracking-widest font-semibold">
                                <tr>
                                    <th className="px-6 py-4">Faculty</th>
                                    <th className="px-6 py-4">Semester</th>
                                    <th className="px-6 py-4">Courses Assigned</th>
                                    <th className="px-6 py-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-surface">
                                {isLoading ? (
                                    <tr><td colSpan={4} className="text-center py-10"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></td></tr>
                                ) : displayLoads.length === 0 ? (
                                    <tr><td colSpan={4} className="text-center py-10 font-bold text-text-secondary">No teaching loads found.</td></tr>
                                ) : (
                                    displayLoads.map((tl: any) => (
                                        <tr key={tl.teachingloadid} className="hover:bg-surface-hover transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-text-primary">{tl.faculty?.user?.username || tl.faculty?.fullname || 'Unknown'}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-text-primary">{typeof tl.semester === 'object' ? tl.semester?.name : (tl.semester || 'Current')}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-wrap max-w-[250px]">
                                                    {(tl.teachingassignment || []).map((ta: any) => ta.courseoffering?.course?.name).filter(Boolean).join(', ') || 'None'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <AdminStatusBadge status={tl.status || 'PENDING'} variant={getStatusVariant(tl.status || 'PENDING')} />
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </AdminPageWrapper>
        </DashboardLayout>
    );
}
