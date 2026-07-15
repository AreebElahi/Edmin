'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/api/apiContract';
import { BookOpen, Calendar, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { UserRole } from '@/types/types';
import { DashboardAPI } from '@/utils/api';
import { useState, useEffect } from 'react';

export default function FacultyApprovalsPage() {
    const [profile, setProfile] = useState<any>(null);

    useEffect(() => {
        DashboardAPI.getFacultyDashboard().then(res => setProfile(res?.profile)).catch(console.error);
    }, []);
    const { data: approvals, isLoading } = useQuery({
        queryKey: ['my-approvals'],
        queryFn: () => apiGet('/faculty/approvals')
    });

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-[2px] animate-spin"></div>
            </div>
        );
    }

    const { teachingLoads = [], leaveRequests = [] } = (approvals as any)?.data || {};

    const renderStatusBadge = (status: string) => {
        if (status === 'APPROVED') return <span className="flex items-center text-green-600 text-sm font-medium"><CheckCircle2 className="w-4 h-4 mr-1"/> Approved</span>;
        if (status === 'REJECTED') return <span className="flex items-center text-red-600 text-sm font-medium"><XCircle className="w-4 h-4 mr-1"/> Rejected</span>;
        return <span className="flex items-center text-amber-600 text-sm font-medium"><Clock className="w-4 h-4 mr-1"/> Pending</span>;
    };

    return (
        <DashboardLayout 
            userRole={UserRole.FACULTY} 
            userName={profile?.fullname || 'Faculty'} 
            userAvatar={profile?.avatar} 
            notifications={[]} 
            currentPath="/dashboard/faculty/approvals"
        >
            <div className="p-8 max-w-5xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">My Pending Requests</h1>
                    <p className="text-gray-500">Track the approval status of your teaching loads and leave requests.</p>
                </div>

                <div className="bg-surface rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                            <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
                            Teaching Loads
                        </h2>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {teachingLoads.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">No pending teaching loads.</div>
                        ) : (
                            teachingLoads.map((tl: any) => (
                                <div key={tl.teachingloadid} className="p-6 hover:bg-gray-50 transition-colors">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="text-sm text-gray-500 mb-1">Semester: {tl.semester?.term} {tl.semester?.year}</p>
                                            <p className="font-medium text-gray-900">
                                                {tl.teachingassignment?.length || 0} Courses Assigned
                                            </p>
                                        </div>
                                        {renderStatusBadge(tl.status)}
                                    </div>
                                    <div className="flex gap-6 text-sm border-t border-gray-100 pt-4">
                                        <div className="flex flex-col">
                                            <span className="text-gray-500 mb-1">Supervisor Review</span>
                                            {renderStatusBadge(tl.supervisorstatus)}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-gray-500 mb-1">HOD Review</span>
                                            {renderStatusBadge(tl.hodstatus)}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="bg-surface rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                            <Calendar className="w-5 h-5 mr-2 text-purple-600" />
                            Leave Requests
                        </h2>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {leaveRequests.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">No pending leave requests.</div>
                        ) : (
                            leaveRequests.map((lr: any) => (
                                <div key={lr.leaverequestid} className="p-6 hover:bg-gray-50 transition-colors flex justify-between items-center">
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                                                {lr.leavetype}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500">
                                            {new Date(lr.startdate).toLocaleDateString()} to {new Date(lr.enddate).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div>
                                        {renderStatusBadge(lr.status)}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
