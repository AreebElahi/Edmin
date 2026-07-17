'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { UserRole } from '@/types/types';
import { SendIcon, AlertCircle, Loader2, Calendar, Home } from 'lucide-react';
import { useState, useEffect } from 'react';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { apiPost, apiGet } from '@/api/apiContract';
import { DashboardAPI } from '@/utils/api';

export default function LeaveRequestPage() {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [leaveType, setLeaveType] = useState('CASUAL');
    const [reason, setReason] = useState('');
    
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [profile, setProfile] = useState<any>(null);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [leaveHistory, setLeaveHistory] = useState<any[]>([]);

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const [dash, hrRes] = await Promise.all([
                    DashboardAPI.getFacultyDashboard(),
                    apiGet<any>('/faculty/hr-summary')
                ]);
                setProfile(dash?.profile || null);
                setNotifications(dash?.notifications || []);
                if (hrRes?.data?.resolvedLeaves) {
                    setLeaveHistory(hrRes.data.resolvedLeaves);
                }
            } catch (err: any) {
                console.error('Failed to load profile:', err);
            } finally {
                setLoading(false);
            }
        };
        loadProfile();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (end < start) {
            setError('End Date cannot be earlier than Start Date.');
            return;
        }

        try {
            setSubmitting(true);
            setError(null);
            await apiPost('/leaves', {
                startDate,
                endDate,
                leaveType,
                reason
            });
            setSubmitted(true);
        } catch (err: any) {
            setError(err.message || 'Failed to submit leave request');
        } finally {
            setSubmitting(false);
        }
    };

    const userName = profile?.fullname || profile?.user?.username || 'Faculty';
    const mappedNotifications = notifications.map(n => ({
        id: n.notificationid.toString(),
        title: n.title,
        message: n.message,
        timestamp: new Date(n.createdat),
        read: n.isread,
        type: 'info' as const
    }));

    if (loading) {
        return (
            <DashboardLayout userName="Loading..." userRole={UserRole.FACULTY} notifications={[]}>
                <div className="flex justify-center items-center h-[60vh]">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            userRole={UserRole.FACULTY}
            userName={userName}
            notifications={mappedNotifications}
            currentPath="/dashboard/faculty/leave"
        >
            <div className="max-w-4xl mx-auto px-4 py-8">
                <AdminPageHeader
                    icon={Calendar}
                    title="Leave"
                    titleAccent="Management"
                    subtitle="Submit requests for time off. Supervisor and HOD will be notified, and HR will approve."
                    eyebrow={{ icon: Home, label: "Faculty Portal" }}
                />

                {error && (
                    <div className="bg-error-bg text-error-text p-4 rounded-[2px] flex items-center gap-3 mb-6">
                        <AlertCircle className="w-5 h-5" />
                        <span>{error}</span>
                    </div>
                )}

                {!submitted ? (
                    <form onSubmit={handleSubmit} className="bg-surface rounded-[2px] shadow-none border border-border p-6">
                        <div className="grid grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-text-primary mb-2">Start Date</label>
                                <input
                                    type="date"
                                    required
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full border border-gray-300 rounded-[2px] p-3 focus:ring-2 focus:ring-rose-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-primary mb-2">End Date</label>
                                <input
                                    type="date"
                                    required
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full border border-gray-300 rounded-[2px] p-3 focus:ring-2 focus:ring-rose-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-text-primary mb-2">Leave Type</label>
                            <select
                                value={leaveType}
                                onChange={(e) => setLeaveType(e.target.value)}
                                className="w-full border border-gray-300 rounded-[2px] p-3 focus:ring-2 focus:ring-rose-500 outline-none"
                            >
                                <option value="CASUAL">Casual Leave</option>
                                <option value="SICK">Sick Leave</option>
                                <option value="ANNUAL">Annual Leave</option>
                                <option value="MATERNITY">Maternity Leave</option>
                            </select>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-text-primary mb-2">Reason</label>
                            <textarea
                                required
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="w-full border border-gray-300 rounded-[2px] p-3 focus:ring-2 focus:ring-rose-500 outline-none min-h-[100px]"
                                placeholder="Explain why you need leave"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold py-3 rounded-[2px] transition-colors shadow-none shadow-rose-200 disabled:opacity-50"
                        >
                            {submitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <SendIcon className="w-5 h-5" />
                                    Send Leave Request
                                </>
                            )}
                        </button>
                    </form>
                ) : (
                    <div className="bg-error-bg rounded-[2px] p-6 border border-border flex gap-4">
                        <AlertCircle className="w-8 h-8 text-rose-500 shrink-0" />
                        <div>
                            <h2 className="text-lg font-bold text-rose-900">Request Sent to HR</h2>
                            <p className="text-error-text">Supervisor & HOD notified. HR approval pending. If no action is taken within the deadline, history will be escalated to Admin.</p>
                            <button
                                onClick={() => setSubmitted(false)}
                                className="mt-4 px-4 py-2 bg-primary hover:bg-primary-hover text-white shadow-none transition-colors border-transparent"
                            >
                                Submit Another Request
                            </button>
                        </div>
                    </div>
                )}
                
                {/* Leave History Section */}
                <div className="mt-8 bg-surface rounded-[2px] shadow-none border border-border p-6">
                    <h2 className="text-xl font-bold text-text-primary mb-4">Leave History</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-background/50 border-b border-border">
                                    <th className="px-6 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Leave Type</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Duration</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Applied On</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#EDEBE9]">
                                {leaveHistory.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-text-secondary">
                                            No leave history found.
                                        </td>
                                    </tr>
                                ) : (
                                    leaveHistory.map((leave, index) => (
                                        <tr key={leave.leaverequestid || index} className="hover:bg-background/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-text-primary whitespace-nowrap">
                                                {leave.leavetype}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-text-primary whitespace-nowrap">
                                                {new Date(leave.startdate).toLocaleDateString()} - {new Date(leave.enddate).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 rounded-[2px] text-xs font-medium border ${leave.status === 'APPROVED' ? 'bg-background text-success-text border-border' : leave.status === 'REJECTED' ? 'bg-error-bg text-error-text border-rose-200' : 'bg-warning-bg text-warning-text border-border'}`}>
                                                    {leave.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-text-primary whitespace-nowrap">
                                                {new Date(leave.updatedat || leave.startdate).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
