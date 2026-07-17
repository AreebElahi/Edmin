'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { SupervisorAPI } from '@/utils/api';
import { BookOpen, Check, X, AlertCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { UserRole } from '@/types/types';

import ApprovalHistoryModal from '@/components/ApprovalHistoryModal';

export default function SupervisorTeachingLoadsPage() {
    const [loads, setLoads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    const [selectedEntityId, setSelectedEntityId] = useState<number | null>(null);
    const [selectedTitle, setSelectedTitle] = useState<string>('');

    useEffect(() => {
        fetchLoads();
    }, []);

    const fetchLoads = async () => {
        try {
            const data = await SupervisorAPI.getTeachingLoads();
            setLoads(data);
        } catch (error: any) {
            toast.error('Failed to load teaching assignments');
            console.error('Failed to load teaching loads:', {
                message: error?.message,
                status: error?.status,
                data: error?.response?.data || error?.data,
                url: error?.config?.url || error?.url,
                method: error?.config?.method || error?.method,
                context: 'SupervisorTeachingLoadsPage.fetchLoads'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleRecommend = async (id: number) => {
        const comment = prompt("Enter a comment/recommendation for the HOD (Optional):");
        if (comment === null) return; // Cancelled
        setProcessingId(id);
        try {
            await SupervisorAPI.recommendTeachingLoad(id, comment);
            toast.success('Teaching load recommended and forwarded to HOD');
            setLoads(loads.map(l => l.id === id ? { ...l, status: 'PENDING_HOD' } : l));
        } catch (error: any) {
            toast.error(error.message || 'Recommendation failed');
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (id: number) => {
        const reason = prompt("Enter reason for rejection:");
        if (!reason) return;

        setProcessingId(id);
        try {
            await SupervisorAPI.rejectTeachingLoad(id, reason);
            toast.success('Teaching load rejected');
            setLoads(loads.map(l => l.id === id ? { ...l, status: 'REJECTED' } : l));
        } catch (error: any) {
            toast.error(error.message || 'Rejection failed');
        } finally {
            setProcessingId(null);
        }
    };

    const handleViewHistory = (id: number, name: string) => {
        setSelectedEntityId(id);
        setSelectedTitle(`Teaching Load for ${name}`);
        setHistoryModalOpen(true);
    };

    return (
        <DashboardLayout userName="Supervisor" userRole={UserRole.FACULTY} notifications={[]} currentPath="/dashboard/faculty/supervisor/teaching-loads">
            <div className="p-6 md:p-8 space-y-8 animate-fade-in max-w-7xl mx-auto">
                <header>
                    <h1 className="text-2xl font-bold text-text-primary tracking-tight">Review Teaching Loads</h1>
                    <p className="text-text-secondary mt-1 text-sm md:text-base">
                        Review, approve, and forward faculty teaching workloads to the HOD.
                    </p>
                </header>

                {loading ? (
                    <div className="flex h-32 items-center justify-center">
                        <div className="text-text-muted">Loading teaching loads...</div>
                    </div>
                ) : loads.length === 0 ? (
                    <div className="bg-surface rounded-xl border border-border p-12 text-center">
                        <BookOpen className="h-12 w-12 text-text-muted mx-auto mb-4" strokeWidth={1} />
                        <h3 className="text-lg font-medium text-text-primary mb-1">No Teaching Loads</h3>
                        <p className="text-text-secondary text-sm">There are no teaching loads awaiting your review.</p>
                    </div>
                ) : (
                    <div className="bg-surface rounded-xl border border-border overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-surface-hover border-b border-border text-xs uppercase tracking-wider text-text-muted">
                                        <th className="p-4 font-semibold">Faculty Member</th>
                                        <th className="p-4 font-semibold">Assigned Courses</th>
                                        <th className="p-4 font-semibold text-center">Total Credits</th>
                                        <th className="p-4 font-semibold">Submission Date</th>
                                        <th className="p-4 font-semibold">Status</th>
                                        <th className="p-4 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loads.map((load) => (
                                        <tr key={load.id} className="border-b border-border hover:bg-surface-hover/50 transition-colors">
                                            <td className="p-4">
                                                <div className="font-medium text-text-primary">{load.facultyName}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {load.courses.map((c: string, idx: number) => (
                                                        <span key={idx} className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                                                            {c}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="p-4 text-center font-medium text-text-secondary">
                                                {load.totalCredits}
                                            </td>
                                            <td className="p-4 text-sm text-text-secondary">
                                                {new Date(load.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                                                    load.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                                                    load.status === 'APPROVED_SUPERVISOR' || load.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                    {load.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleViewHistory(load.id, load.facultyName)}
                                                        className="p-1.5 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                                                        title="View History"
                                                    >
                                                        <Clock className="h-4 w-4" />
                                                    </button>
                                                    {load.status === 'PENDING' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleRecommend(load.id)}
                                                                disabled={processingId === load.id}
                                                                className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
                                                                title="Recommend to HOD"
                                                            >
                                                                <Check className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleReject(load.id)}
                                                                disabled={processingId === load.id}
                                                                className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                                                                title="Reject Load"
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {selectedEntityId && (
                <ApprovalHistoryModal
                    isOpen={historyModalOpen}
                    onClose={() => setHistoryModalOpen(false)}
                    entityType="TEACHING_LOAD"
                    entityId={selectedEntityId}
                    title={selectedTitle}
                />
            )}
        </DashboardLayout>
    );
}
