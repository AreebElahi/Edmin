'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { SupervisorAPI } from '@/utils/api';
import { FileCheck, MessageSquare, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { UserRole } from '@/types/types';

export default function SupervisorLeavesPage() {
    const [leaves, setLeaves] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [commentTexts, setCommentTexts] = useState<Record<number, string>>({});
    const [processingId, setProcessingId] = useState<number | null>(null);

    useEffect(() => {
        fetchLeaves();
    }, []);

    const fetchLeaves = async () => {
        try {
            const data = await SupervisorAPI.getDepartmentLeaves();
            setLeaves(data);
        } catch (error: any) {
            toast.error('Failed to load leave requests');
            console.error('Failed to load leaves:', {
                message: error?.message,
                status: error?.status,
                data: error?.response?.data || error?.data,
                url: error?.config?.url || error?.url,
                method: error?.config?.method || error?.method,
                context: 'SupervisorLeavesPage.fetchLeaves'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleComment = async (id: number) => {
        const comment = commentTexts[id];
        if (!comment || !comment.trim()) return;

        setProcessingId(id);
        try {
            await SupervisorAPI.commentLeave(id, comment);
            toast.success('Comment added successfully');
            setCommentTexts({ ...commentTexts, [id]: '' });
            fetchLeaves(); // Refresh leaves to show the new comment
        } catch (error: any) {
            toast.error(error.message || 'Failed to add comment');
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <DashboardLayout userName="Supervisor" userRole={UserRole.FACULTY} notifications={[]} currentPath="/dashboard/faculty/supervisor/leaves">
            <div className="p-6 md:p-8 space-y-8 animate-fade-in max-w-7xl mx-auto">
                <header>
                    <h1 className="text-2xl font-bold text-text-primary tracking-tight">Faculty Leave Requests</h1>
                    <p className="text-text-secondary mt-1 text-sm md:text-base">
                        Review leave applications and add supervisor comments before HOD/HR approval.
                    </p>
                </header>

                {loading ? (
                    <div className="flex h-32 items-center justify-center">
                        <div className="text-text-muted">Loading leave requests...</div>
                    </div>
                ) : leaves.length === 0 ? (
                    <div className="bg-surface rounded-xl border border-border p-12 text-center">
                        <FileCheck className="h-12 w-12 text-text-muted mx-auto mb-4" strokeWidth={1} />
                        <h3 className="text-lg font-medium text-text-primary mb-1">No Leave Requests</h3>
                        <p className="text-text-secondary text-sm">There are no faculty leave requests needing your attention.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {leaves.map((leave) => (
                            <div key={leave.id} className="bg-surface rounded-xl border border-border overflow-hidden shadow-sm hover:border-primary/30 transition-colors">
                                <div className="p-5 border-b border-border bg-surface-hover/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                                            {leave.facultyName}
                                            <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                                                leave.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                                                leave.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                                {leave.status}
                                            </span>
                                        </h3>
                                        <p className="text-sm text-text-secondary mt-1">
                                            {leave.leaveType} • {new Date(leave.startDate).toLocaleDateString()} to {new Date(leave.endDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="text-sm font-medium px-3 py-1.5 bg-surface border border-border rounded-lg text-text-primary">
                                        {leave.durationDays} Day(s)
                                    </div>
                                </div>
                                <div className="p-5">
                                    <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">Reason</h4>
                                    <p className="text-sm text-text-secondary whitespace-pre-wrap mb-4">{leave.reason}</p>
                                    
                                    {leave.supervisorComment && (
                                        <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                                            <h4 className="text-xs font-semibold uppercase tracking-wider text-primary mb-1 flex items-center gap-1.5">
                                                <MessageSquare className="h-3.5 w-3.5" /> Your Comment
                                            </h4>
                                            <p className="text-sm text-text-primary">{leave.supervisorComment}</p>
                                        </div>
                                    )}

                                    {!leave.supervisorComment && leave.status === 'PENDING' && (
                                        <div className="mt-4 pt-4 border-t border-border">
                                            <label htmlFor={`comment-${leave.id}`} className="block text-xs font-medium text-text-secondary mb-2">
                                                Add Supervisor Comment (Required before HOD action)
                                            </label>
                                            <div className="flex gap-2">
                                                <input
                                                    id={`comment-${leave.id}`}
                                                    type="text"
                                                    value={commentTexts[leave.id] || ''}
                                                    onChange={(e) => setCommentTexts({ ...commentTexts, [leave.id]: e.target.value })}
                                                    placeholder="E.g., Replacement arranged. Recommended for approval."
                                                    className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                                />
                                                <button
                                                    onClick={() => handleComment(leave.id)}
                                                    disabled={processingId === leave.id || !commentTexts[leave.id]?.trim()}
                                                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
                                                >
                                                    <Send className="h-4 w-4" /> Submit
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
