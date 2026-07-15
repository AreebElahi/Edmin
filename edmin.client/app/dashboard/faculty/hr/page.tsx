'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { UserRole } from '@/types/types';
import {
    CalendarCheck, Clock, FileText, Send,
    AlertCircle, CheckCircle2, History, X,
    Thermometer, User, Briefcase, DollarSign, Download
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { apiGet } from '@/api/apiContract';
import { DashboardAPI } from '@/utils/api';

export default function FacultyHRPage() {
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [notifications, setNotifications] = useState<any[]>([]);
    
    const [leaveStats, setLeaveStats] = useState({
        sick: { taken: 0, total: 8 },
        casual: { taken: 0, total: 10 },
        earned: { taken: 0, total: 12 },
    });
    
    const [payrollHistory, setPayrollHistory] = useState<any[]>([]);
    const [selectedPayslip, setSelectedPayslip] = useState<any>(null);
    const [payslipLoading, setPayslipLoading] = useState(false);

    const openPayslip = async (id: number) => {
        setPayslipLoading(true);
        try {
            const res = await apiGet<any>(`/faculty/payroll/${id}`);
            if (res.data) {
                setSelectedPayslip(res.data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setPayslipLoading(false);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                const [hrRes, dash] = await Promise.all([
                    apiGet<any>('/faculty/hr-summary'),
                    DashboardAPI.getFacultyDashboard()
                ]);

                setProfile(dash?.profile || null);
                setNotifications(dash?.notifications || []);

                const resolvedLeaves = hrRes.data?.resolvedLeaves || [];
                const payrollRecords = hrRes.data?.payrollRecords || [];

                let sick = 0;
                let casual = 0;
                let earned = 0;

                resolvedLeaves.forEach((l: any) => {
                    if (l.status === 'APPROVED') {
                        // Rough day diff calculation, or just count as 1 request for now
                        const days = Math.max(1, Math.ceil((new Date(l.enddate).getTime() - new Date(l.startdate).getTime()) / (1000 * 3600 * 24)));
                        if (l.leavetype === 'SICK') sick += days;
                        if (l.leavetype === 'CASUAL') casual += days;
                        if (l.leavetype === 'EARNED') earned += days;
                    }
                });

                setLeaveStats({
                    sick: { taken: sick, total: 8 },
                    casual: { taken: casual, total: 10 },
                    earned: { taken: earned, total: 12 },
                });
                
                setPayrollHistory(payrollRecords);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const totalUsed = leaveStats.sick.taken + leaveStats.casual.taken + leaveStats.earned.taken;
    const totalLeaves = leaveStats.sick.total + leaveStats.casual.total + leaveStats.earned.total;

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
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-[2px] animate-spin"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            userRole={UserRole.FACULTY}
            userName={userName}
            userAvatar={profile?.avatar}
            notifications={mappedNotifications}
            currentPath="/dashboard/faculty/hr"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-text-primary">My HR Dashboard</h1>
                    <p className="text-text-secondary">Manage your leaves, payroll, and daily reports</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

                    {/* Sick Leaves */}
                    <div className="bg-surface p-5 rounded-[2px] border border-border shadow-none relative overflow-hidden group hover:border-blue-200 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <p className="text-sm font-medium text-text-secondary">Sick Leaves</p>
                                <h3 className="text-2xl font-bold text-text-primary mt-1">{leaveStats.sick.taken} / {leaveStats.sick.total}</h3>
                            </div>
                            <div className="p-2 bg-error-bg rounded-[2px] text-rose-500">
                                <Thermometer className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="w-full bg-background rounded-[2px] h-1.5">
                            <div
                                className="bg-error-text h-1.5 rounded-[2px]"
                                style={{ width: `${Math.min(100, (leaveStats.sick.taken / leaveStats.sick.total) * 100)}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Casual Leaves */}
                    <div className="bg-surface p-5 rounded-[2px] border border-border shadow-none relative overflow-hidden group hover:border-blue-200 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <p className="text-sm font-medium text-text-secondary">Casual Leaves</p>
                                <h3 className="text-2xl font-bold text-text-primary mt-1">{leaveStats.casual.taken} / {leaveStats.casual.total}</h3>
                            </div>
                            <div className="p-2 bg-warning-bg rounded-[2px] text-amber-500">
                                <User className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="w-full bg-background rounded-[2px] h-1.5">
                            <div
                                className="bg-warning-text h-1.5 rounded-[2px]"
                                style={{ width: `${Math.min(100, (leaveStats.casual.taken / leaveStats.casual.total) * 100)}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Earned Leaves */}
                    <div className="bg-surface p-5 rounded-[2px] border border-border shadow-none relative overflow-hidden group hover:border-blue-200 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <p className="text-sm font-medium text-text-secondary">Earned Leaves</p>
                                <h3 className="text-2xl font-bold text-text-primary mt-1">{leaveStats.earned.taken} / {leaveStats.earned.total}</h3>
                            </div>
                            <div className="p-2 bg-primary-light rounded-[2px] text-primary">
                                <Briefcase className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="w-full bg-background rounded-[2px] h-1.5">
                            <div
                                className="bg-primary h-1.5 rounded-[2px]"
                                style={{ width: `${Math.min(100, (leaveStats.earned.taken / leaveStats.earned.total) * 100)}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Total Summary */}
                    <div className="bg-gradient-to-br bg-primary p-5 rounded-[2px] shadow-none text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-surface opacity-10 rounded-[2px] -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <p className="text-sm font-medium text-blue-100">Total Used</p>
                                <h3 className="text-2xl font-bold text-white mt-1">{totalUsed} / {totalLeaves}</h3>
                            </div>
                            <div className="p-2 bg-surface/20 rounded-[2px] text-white">
                                <History className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-xs text-blue-100 mt-2">
                            {totalLeaves - totalUsed} leaves remaining this year
                        </p>
                    </div>
                </div>

                {/* Quick Actions Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <Link
                        href="/dashboard/faculty/activity-report"
                        className="bg-surface border border-border p-4 rounded-[2px] shadow-none hover:shadow-none hover:border-blue-200 transition-all flex items-center justify-center gap-3 group"
                    >
                        <div className="p-2 bg-primary-light text-primary rounded-[2px] group-hover:scale-110 transition-transform">
                            <Send className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                            <span className="block font-bold text-text-primary">New Leave Request</span>
                            <span className="text-xs text-text-secondary">Apply via Activity & Leaves</span>
                        </div>
                    </Link>

                    <Link
                        href="/dashboard/faculty/activity-report"
                        className="bg-primary hover:bg-primary-hover text-white shadow-none transition-colors border-transparent"
                    >
                        <div className="p-2 bg-primary-light text-primary rounded-[2px] group-hover:scale-110 transition-transform">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                            <span className="block font-bold text-text-primary">Submit Daily Report</span>
                            <span className="text-xs text-text-secondary">File your work report for today</span>
                        </div>
                    </Link>
                </div>

                {/* Payroll History Section */}
                <div className="bg-surface rounded-[2px] border border-border shadow-none overflow-hidden">
                    <div className="p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-emerald-600" />
                                Payroll History
                            </h2>
                            <p className="text-sm text-text-secondary">View your recent salary payouts</p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-background/50 border-b border-border">
                                    <th className="px-6 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider whitespace-nowrap">Month</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider whitespace-nowrap">Year</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider whitespace-nowrap">Net Pay</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider whitespace-nowrap">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#EDEBE9]">
                                {payrollHistory.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-text-secondary">
                                            No payroll records found.
                                        </td>
                                    </tr>
                                ) : (
                                    payrollHistory.map((record, index) => (
                                        <tr key={record.payrollid || index} className="hover:bg-background/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-text-primary whitespace-nowrap">
                                                {new Date(record.year, record.month - 1).toLocaleString('default', { month: 'long' })}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-text-primary font-mono whitespace-nowrap">
                                                {record.year}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-text-primary font-mono whitespace-nowrap">
                                                ${parseFloat(record.netpay).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] text-xs font-medium border ${record.status === 'PAID' || record.status === 'APPROVED'
                                                    ? 'bg-background text-success-text border-border'
                                                    : 'bg-warning-bg text-warning-text border-border'
                                                    }`}>
                                                    {(record.status === 'PAID' || record.status === 'APPROVED') && <CheckCircle2 className="w-3 h-3" />}
                                                    {(record.status !== 'PAID' && record.status !== 'APPROVED') && <Clock className="w-3 h-3" />}
                                                    {record.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <button 
                                                    onClick={() => openPayslip(record.payrollid)}
                                                    className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-primary bg-primary-light rounded-[2px] hover:bg-primary-light transition-colors"
                                                >
                                                    <Download className="w-3.5 h-3.5" />
                                                    View Payslip
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Payslip Modal */}
            {selectedPayslip && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-surface rounded-[2px] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-border">
                            <div>
                                <h3 className="text-xl font-bold text-text-primary">
                                    Payslip: {new Date(selectedPayslip.year, selectedPayslip.month - 1).toLocaleString('default', { month: 'long' })} {selectedPayslip.year}
                                </h3>
                                <p className="text-sm text-text-secondary mt-1">Ref ID: PR-{selectedPayslip.payrollid.toString().padStart(5, '0')}</p>
                            </div>
                            <button
                                onClick={() => setSelectedPayslip(null)}
                                className="p-2 hover:bg-background rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-text-secondary" />
                            </button>
                        </div>
                        
                        {/* Content */}
                        <div className="p-6">
                            <div className="grid grid-cols-2 gap-8">
                                {/* Earnings */}
                                <div>
                                    <h4 className="font-bold text-text-primary mb-4 pb-2 border-b border-border">Earnings</h4>
                                    <div className="space-y-3">
                                        {selectedPayslip.payrollcomponent?.filter((c: any) => c.type === 'EARNING').map((c: any, i: number) => (
                                            <div key={i} className="flex justify-between text-sm">
                                                <span className="text-text-secondary">{c.name}</span>
                                                <span className="font-mono">${parseFloat(c.amount).toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {/* Deductions */}
                                <div>
                                    <h4 className="font-bold text-text-primary mb-4 pb-2 border-b border-border">Deductions</h4>
                                    <div className="space-y-3">
                                        {selectedPayslip.payrollcomponent?.filter((c: any) => c.type === 'DEDUCTION').map((c: any, i: number) => (
                                            <div key={i} className="flex justify-between text-sm text-error-text">
                                                <span className="text-text-secondary">{c.name}</span>
                                                <span className="font-mono">-${parseFloat(c.amount).toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-8 pt-6 border-t border-border flex justify-between items-center bg-background/50 p-4 rounded-[2px]">
                                <span className="font-bold text-text-primary">Net Pay Transfer</span>
                                <span className="text-2xl font-bold text-success-text font-mono">
                                    ${parseFloat(selectedPayslip.netpay).toLocaleString()}
                                </span>
                            </div>
                        </div>
                        
                        {/* Footer */}
                        <div className="p-4 border-t border-border bg-background/30 flex justify-end">
                            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-[2px] font-medium hover:bg-primary-hover transition-colors shadow-none">
                                <Download className="w-4 h-4" />
                                Download PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
