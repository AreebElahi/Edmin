'use client';

import { useState } from 'react';
import { Thermometer, User, Briefcase, History, Send } from 'lucide-react';
import Modal from '@/components/Modal';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '@/api/apiContract';

interface PersonalLeaveWidgetProps {
    variant?: 'compact' | 'full';
}

export default function PersonalLeaveWidget({ variant = 'full' }: PersonalLeaveWidgetProps) {
    const queryClient = useQueryClient();
    const [leaveModalOpen, setLeaveModalOpen] = useState(false);
    const [leaveRequest, setLeaveRequest] = useState({ type: 'SICK', startDate: '', endDate: '', reason: '' });

    const { data: hrSummary, isLoading } = useQuery({
        queryKey: ['hr-summary'],
        queryFn: () => apiGet('/faculty/hr-summary')
    });

    const submitLeaveMutation = useMutation({
        mutationFn: (data: any) => apiPost('/faculty/leaves', data),
        onSuccess: () => {
            toast.success('Leave request submitted successfully!');
            setLeaveModalOpen(false);
            setLeaveRequest({ type: 'SICK', startDate: '', endDate: '', reason: '' });
            queryClient.invalidateQueries({ queryKey: ['hr-summary'] });
            queryClient.invalidateQueries({ queryKey: ['my-approvals'] });
        },
        onError: (err: any) => {
            toast.error(err?.message || 'Failed to submit leave request');
        }
    });

    const handleSubmit = () => {
        if (!leaveRequest.startDate || !leaveRequest.endDate) {
            toast.error('Please select both start and end dates');
            return;
        }
        submitLeaveMutation.mutate({
            leaveType: leaveRequest.type,
            startDate: leaveRequest.startDate,
            endDate: leaveRequest.endDate,
            reason: leaveRequest.reason
        });
    };

    const isCompact = variant === 'compact';

    // Calculate dynamic stats from resolvedLeaves
    const resolvedLeaves = (hrSummary as any)?.data?.resolvedLeaves || [];
    
    // We assume a hardcoded total allocation for now since the DB doesn't have a leavebalance table
    const TOTAL_ALLOCATION = { SICK: 8, CASUAL: 10, EARNED: 12 };
    
    const calculateTaken = (type: string) => {
        return resolvedLeaves
            .filter((l: any) => l.leavetype === type && l.status === 'APPROVED')
            .length;
    };

    const leaveStats = {
        sick: { taken: calculateTaken('SICK'), total: TOTAL_ALLOCATION.SICK },
        casual: { taken: calculateTaken('CASUAL'), total: TOTAL_ALLOCATION.CASUAL },
        earned: { taken: calculateTaken('EARNED'), total: TOTAL_ALLOCATION.EARNED },
    };

    const totalUsed = leaveStats.sick.taken + leaveStats.casual.taken + leaveStats.earned.taken;
    const totalLeaves = leaveStats.sick.total + leaveStats.casual.total + leaveStats.earned.total;

    if (isLoading) {
        return (
            <div className="bg-surface p-6 border border-border flex justify-center items-center h-[200px]">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-[2px] animate-spin"></div>
            </div>
        );
    }

    return (
        <div className={isCompact ? "" : "mb-4"}>
            <div className="flex justify-between items-center mb-3 gap-3">
                <h2 className="text-sm font-semibold text-text-primary">Personal Leave Status</h2>
                <button
                    onClick={() => setLeaveModalOpen(true)}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs bg-primary text-white font-semibold hover:bg-primary-hover transition-colors rounded-[2px] whitespace-nowrap shrink-0"
                    disabled={submitLeaveMutation.isPending}
                >
                    <Send className="w-3 h-3 shrink-0" strokeWidth={1.5} />
                    New Request
                </button>
            </div>

            {/* Stats Grid */}
            <div className={`grid ${isCompact ? 'grid-cols-2' : 'grid-cols-2'} gap-2`}>
                {/* Sick Leaves */}
                <div className="bg-surface p-3.5 border border-border hover:border-primary transition-colors flex flex-col justify-between min-h-[110px]">
                    <div className="flex justify-between items-start mb-2 gap-2">
                        <div className="min-w-0">
                            <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">Sick Leave</p>
                            <h3 className="text-xl font-semibold text-text-primary mt-0.5">
                                {leaveStats.sick.taken}
                                <span className="text-text-muted text-xs font-normal"> / {leaveStats.sick.total}</span>
                            </h3>
                        </div>
                        <div className="p-1.5 bg-error-bg text-error-text shrink-0">
                            <Thermometer className="w-3.5 h-3.5" strokeWidth={1.5} />
                        </div>
                    </div>
                    <div className="w-full bg-border h-1">
                        <div
                            className="bg-error-text h-1"
                            style={{ width: `${(leaveStats.sick.taken / leaveStats.sick.total) * 100}%` }}
                        ></div>
                    </div>
                </div>

                {/* Casual Leaves */}
                <div className="bg-surface p-3.5 border border-border hover:border-primary transition-colors flex flex-col justify-between min-h-[110px]">
                    <div className="flex justify-between items-start mb-2 gap-2">
                        <div className="min-w-0">
                            <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">Casual Leave</p>
                            <h3 className="text-xl font-semibold text-text-primary mt-0.5">
                                {leaveStats.casual.taken}
                                <span className="text-text-muted text-xs font-normal"> / {leaveStats.casual.total}</span>
                            </h3>
                        </div>
                        <div className="p-1.5 bg-warning-bg text-warning-text shrink-0">
                            <User className="w-3.5 h-3.5" strokeWidth={1.5} />
                        </div>
                    </div>
                    <div className="w-full bg-border h-1">
                        <div
                            className="bg-warning-text h-1"
                            style={{ width: `${(leaveStats.casual.taken / leaveStats.casual.total) * 100}%` }}
                        ></div>
                    </div>
                </div>

                {/* Earned Leaves */}
                <div className="bg-surface p-3.5 border border-border hover:border-primary transition-colors flex flex-col justify-between min-h-[110px]">
                    <div className="flex justify-between items-start mb-2 gap-2">
                        <div className="min-w-0">
                            <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">Earned Leave</p>
                            <h3 className="text-xl font-semibold text-text-primary mt-0.5">
                                {leaveStats.earned.taken}
                                <span className="text-text-muted text-xs font-normal"> / {leaveStats.earned.total}</span>
                            </h3>
                        </div>
                        <div className="p-1.5 bg-success-bg text-success-text shrink-0">
                            <Briefcase className="w-3.5 h-3.5" strokeWidth={1.5} />
                        </div>
                    </div>
                    <div className="w-full bg-border h-1">
                        <div
                            className="bg-success-text h-1"
                            style={{ width: `${(leaveStats.earned.taken / leaveStats.earned.total) * 100}%` }}
                        ></div>
                    </div>
                </div>

                {/* Total Summary */}
                <div className="bg-primary p-3.5 text-white flex flex-col justify-between min-h-[110px] border border-primary-hover">
                    <div className="flex justify-between items-start mb-2 gap-2">
                        <div className="min-w-0">
                            <p className="text-[10px] font-semibold text-blue-100 uppercase tracking-wider">Total Used</p>
                            <h3 className="text-xl font-semibold text-white mt-0.5">
                                {totalUsed}
                                <span className="text-blue-200 text-xs font-normal"> / {totalLeaves}</span>
                            </h3>
                        </div>
                        <div className="p-1.5 bg-surface/20 text-white shrink-0">
                            <History className="w-3.5 h-3.5" strokeWidth={1.5} />
                        </div>
                    </div>
                    <p className="text-[10px] text-blue-100 font-semibold uppercase tracking-wide">
                        {totalLeaves - totalUsed} days remaining
                    </p>
                </div>
            </div>

            {/* Leave Request Modal */}
            <Modal
                isOpen={leaveModalOpen}
                onClose={() => setLeaveModalOpen(false)}
                title="Application for Leave"
            >
                <div className="space-y-3">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-text-primary uppercase tracking-wide">Leave Type</label>
                        <select
                            className="w-full px-3 py-2 border border-border bg-surface focus:border-primary outline-none transition-colors text-sm rounded-[2px]"
                            value={leaveRequest.type}
                            onChange={(e) => setLeaveRequest({ ...leaveRequest, type: e.target.value })}
                        >
                            <option value="SICK">Sick Leave</option>
                            <option value="CASUAL">Casual Leave</option>
                            <option value="EARNED">Earned Leave</option>
                            <option value="UNPAID">Unpaid Leave</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-text-primary uppercase tracking-wide">From Date</label>
                            <input
                                type="date"
                                className="w-full px-3 py-2 border border-border focus:border-primary outline-none transition-colors text-sm rounded-[2px]"
                                value={leaveRequest.startDate}
                                onChange={(e) => setLeaveRequest({ ...leaveRequest, startDate: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-text-primary uppercase tracking-wide">To Date</label>
                            <input
                                type="date"
                                className="w-full px-3 py-2 border border-border focus:border-primary outline-none transition-colors text-sm rounded-[2px]"
                                value={leaveRequest.endDate}
                                onChange={(e) => setLeaveRequest({ ...leaveRequest, endDate: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-text-primary uppercase tracking-wide">Reason</label>
                        <textarea
                            rows={3}
                            placeholder="Briefly describe the reason for your leave..."
                            className="w-full px-3 py-2 border border-border focus:border-primary outline-none transition-colors resize-none text-sm rounded-[2px]"
                            value={leaveRequest.reason}
                            onChange={(e) => setLeaveRequest({ ...leaveRequest, reason: e.target.value })}
                        ></textarea>
                    </div>

                    <div className="pt-3 flex justify-end gap-2 border-t border-border">
                        <button
                            onClick={() => setLeaveModalOpen(false)}
                            className="px-4 py-2 border border-border text-text-primary text-xs font-semibold hover:bg-background transition-colors rounded-[2px]"
                            disabled={submitLeaveMutation.isPending}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="px-4 py-2 bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition-colors rounded-[2px] disabled:opacity-50"
                            disabled={submitLeaveMutation.isPending}
                        >
                            {submitLeaveMutation.isPending ? 'Submitting...' : 'Submit Application'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
