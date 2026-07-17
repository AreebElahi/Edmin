'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { SupervisorAPI } from '@/utils/api';
import { FileText, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { UserRole } from '@/types/types';

export default function SupervisorActivityReportsPage() {
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<number | null>(null);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const data = await SupervisorAPI.getDepartmentActivityReports();
            setReports(data);
        } catch (error: any) {
            toast.error('Failed to load activity reports');
            console.error('Failed to load activity reports:', {
                message: error?.message,
                status: error?.status,
                data: error?.response?.data || error?.data,
                url: error?.config?.url || error?.url,
                method: error?.config?.method || error?.method,
                context: 'SupervisorActivityReportsPage.fetchReports'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: number) => {
        setProcessingId(id);
        try {
            await SupervisorAPI.approveReport(id);
            toast.success('Report approved and forwarded to HOD');
            setReports(reports.map(r => r.id === id ? { ...r, status: 'APPROVED_SUPERVISOR' } : r));
        } catch (error: any) {
            toast.error(error.message || 'Approval failed');
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (id: number) => {
        const reason = prompt("Enter reason for rejection:");
        if (!reason) return;

        setProcessingId(id);
        try {
            await SupervisorAPI.rejectReport(id, reason);
            toast.success('Report rejected');
            setReports(reports.map(r => r.id === id ? { ...r, status: 'REJECTED' } : r));
        } catch (error: any) {
            toast.error(error.message || 'Rejection failed');
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <DashboardLayout userName="Supervisor" userRole={UserRole.FACULTY} notifications={[]} currentPath="/dashboard/faculty/supervisor/faculty/activity-reports">
            <div className="p-6 md:p-8 space-y-8 animate-fade-in max-w-7xl mx-auto">
                <header>
                    <h1 className="text-2xl font-bold text-text-primary tracking-tight">Faculty Activity Reports</h1>
                    <p className="text-text-secondary mt-1 text-sm md:text-base">
                        Review daily activity reports submitted by department faculty.
                    </p>
                </header>

                {loading ? (
                    <div className="flex h-32 items-center justify-center">
                        <div className="text-text-muted">Loading activity reports...</div>
                    </div>
                ) : reports.length === 0 ? (
                    <div className="bg-surface rounded-xl border border-border p-12 text-center">
                        <FileText className="h-12 w-12 text-text-muted mx-auto mb-4" strokeWidth={1} />
                        <h3 className="text-lg font-medium text-text-primary mb-1">No Pending Reports</h3>
                        <p className="text-text-secondary text-sm">There are no faculty activity reports awaiting your review.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {reports.map((report) => (
                            <div key={report.id} className="bg-surface rounded-xl border border-border p-5 shadow-sm hover:border-primary/30 transition-colors">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-border">
                                    <div>
                                        <h3 className="text-lg font-semibold text-text-primary">{report.facultyName}</h3>
                                        <p className="text-sm text-text-secondary">Submitted on {new Date(report.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                                            report.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                                            report.status === 'APPROVED_SUPERVISOR' || report.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                            {report.status.replace('_', ' ')}
                                        </span>
                                        
                                        {report.status === 'PENDING' && (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleApprove(report.id)}
                                                    disabled={processingId === report.id}
                                                    className="px-3 py-1.5 bg-green-50 text-green-600 font-medium text-sm rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                                                >
                                                    <Check className="h-4 w-4" /> Approve
                                                </button>
                                                <button
                                                    onClick={() => handleReject(report.id)}
                                                    disabled={processingId === report.id}
                                                    className="px-3 py-1.5 bg-red-50 text-red-600 font-medium text-sm rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                                                >
                                                    <X className="h-4 w-4" /> Reject
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="prose prose-sm max-w-none text-text-secondary">
                                    <p className="whitespace-pre-wrap">{report.content}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
