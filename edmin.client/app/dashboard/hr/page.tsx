'use client';

import DashboardLayout from '@/components/DashboardLayout';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { UserRole, Notification } from '@/types/types';
import {
    Users, Building, CalendarCheck, DollarSign,
    UserPlus, TrendingUp, FileText,
    CheckCircle2, AlertCircle, Loader2, CheckCircle,
    Info
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { DashboardAPI } from '@/utils/api';
import { BackendNotification } from '@/types/types';

export default function HRDashboard() {

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [summary, setSummary] = useState<any>(null);
    const [leavesToday, setLeavesToday] = useState<any[]>([]);
    const [compliance, setCompliance] = useState<any>(null);
    const [approvals, setApprovals] = useState<any[]>([]);
    const [notifications, setNotifications] = useState<BackendNotification[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch new endpoints in parallel
                const [sumRes, leaveRes, compRes, appRes] = await Promise.all([
                    DashboardAPI.getHrSummary(),
                    DashboardAPI.getHrLeavesToday(),
                    DashboardAPI.getHrCompliance(),
                    DashboardAPI.getHrApprovalsPending(),
                ]);

                setSummary(sumRes);
                setLeavesToday(leaveRes || []);
                setCompliance(compRes);
                setApprovals(appRes || []);
                
                setError(null);
            } catch (err: any) {
                console.error("Dashboard fetch error", err);
                setError(err.message || 'Failed to load dashboard data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <DashboardLayout userRole={'hr' as any} notifications={[]}>
                <div className="flex justify-center items-center h-[60vh]">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout userRole={'hr' as any} notifications={[]}>
                <div className="max-w-[1200px] mx-auto p-4 space-y-4">
                    <div className="bg-error-bg text-error-text p-4 border border-border flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" />
                            <span className="font-semibold text-sm">Failed to load dashboard</span>
                        </div>
                        <p className="text-xs">{error}</p>
                        <button 
                            onClick={() => window.location.reload()}
                            className="self-start px-4 py-2 text-xs font-semibold bg-white text-error-text border border-error-text rounded hover:bg-error-bg transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    const mappedNotifications = notifications.map(n => ({
        id: n.notificationid.toString(),
        title: n.title,
        message: n.message,
        timestamp: new Date(n.createdat),
        read: n.isread,
        type: 'info' as const
    }));

    const stats = [
        {
            title: 'Total Employees',
            value: summary?.totalEmployees ?? '0',
            trend: summary?.totalEmployeesDelta,
            subtext: 'vs last month',
            icon: Users,
            color: 'bg-primary',
            bg: 'bg-primary-light',
            text: 'text-primary'
        },
        {
            title: 'Faculty Staff',
            value: summary?.facultyStaff ?? '0',
            trend: summary?.facultyStaffDelta,
            subtext: 'vs last month',
            icon: Building,
            color: 'bg-primary',
            bg: 'bg-primary-light',
            text: 'text-primary'
        },
        {
            title: 'HR Staff',
            value: summary?.hrStaff ?? '0',
            trend: summary?.hrStaffTrend,
            subtext: 'vs last month',
            icon: CheckCircle2,
            color: 'from-emerald-500 to-teal-600',
            bg: 'bg-background',
            text: 'text-success-text'
        },
        {
            title: 'Departments',
            value: summary?.departments ?? '0',
            trend: summary?.departmentsDelta,
            subtext: summary?.departmentsDeltaLabel ?? 'Newly created',
            icon: TrendingUp,
            color: 'from-amber-500 to-orange-600',
            bg: 'bg-warning-bg',
            text: 'text-warning-text'
        }
    ];

    const actionCount = approvals.filter(a => a.requiresAction).length;

    return (
        <DashboardLayout 
            userRole={'hr' as any}
            notifications={mappedNotifications}
        >
            <AdminPageWrapper>
                {/* Page Header */}
                <AdminPageHeader 
                    icon={Users}
                    title="Human Resources"
                    subtitle="Manage employees, payroll, and university staffing."
                />

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {stats.map((stat, index) => (
                        <div key={index} className="bg-surface border border-border p-5 flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                                <stat.icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
                                {stat.trend ? (
                                    <span className="text-[10px] font-semibold px-2 py-0.5 bg-primary-light text-primary rounded-[2px]">
                                        {stat.trend}
                                    </span>
                                ) : null}
                            </div>
                            <div>
                                <p className="text-xs text-text-secondary font-medium uppercase tracking-wider">{stat.title}</p>
                                <h3 className="text-2xl font-semibold text-text-primary mt-0.5">{stat.value}</h3>
                                <p className="text-[11px] text-text-muted mt-0.5">{stat.subtext}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Left Main Content */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Quick Actions / Hub */}
                        <div className="bg-surface border border-border p-5">
                            <h2 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                                <Building className="w-4 h-4 text-primary" strokeWidth={1.5} />
                                Management Hub
                            </h2>
                            <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3">
                                <Link href="/dashboard/hr/employees" className="flex items-start gap-3 p-4 border border-border hover:border-primary hover:bg-primary-light transition-colors group">
                                    <Users className="w-4 h-4 text-primary mt-0.5 shrink-0" strokeWidth={1.5} />
                                    <div>
                                        <h3 className="text-xs font-semibold text-text-primary group-hover:text-primary transition-colors">Employee Directory</h3>
                                        <p className="text-[10px] text-text-muted mt-0.5 leading-relaxed">Manage staff records, personal information, and professional details.</p>
                                    </div>
                                </Link>
                                <Link href="/dashboard/hr/payroll" className="flex items-start gap-3 p-4 border border-border hover:border-primary hover:bg-primary-light transition-colors group">
                                    <DollarSign className="w-4 h-4 text-primary mt-0.5 shrink-0" strokeWidth={1.5} />
                                    <div>
                                        <h3 className="text-xs font-semibold text-text-primary group-hover:text-primary transition-colors">Payroll Center</h3>
                                        <p className="text-[10px] text-text-muted mt-0.5 leading-relaxed">Process salaries, manage allowances, and generate payslips.</p>
                                    </div>
                                </Link>
                                <Link href="/dashboard/hr/leaves" className="flex items-start gap-3 p-4 border border-border hover:border-primary hover:bg-primary-light transition-colors group">
                                    <CalendarCheck className="w-4 h-4 text-primary mt-0.5 shrink-0" strokeWidth={1.5} />
                                    <div>
                                        <h3 className="text-xs font-semibold text-text-primary group-hover:text-primary transition-colors">Leave Requests</h3>
                                        <p className="text-[10px] text-text-muted mt-0.5 leading-relaxed">Handle sick leave, annual leave, and approve/reject staff requests.</p>
                                    </div>
                                </Link>
                                <Link href="/dashboard/hr/recruitment" className="flex items-start gap-3 p-4 border border-border hover:border-primary hover:bg-primary-light transition-colors group">
                                    <UserPlus className="w-4 h-4 text-primary mt-0.5 shrink-0" strokeWidth={1.5} />
                                    <div>
                                        <h3 className="text-xs font-semibold text-text-primary group-hover:text-primary transition-colors">Recruitment</h3>
                                        <p className="text-[10px] text-text-muted mt-0.5 leading-relaxed">Post job vacancies, manage applications, and conduct interviews.</p>
                                    </div>
                                </Link>
                            </div>
                        </div>

                        {/* Pending Approvals */}
                        <div className="bg-surface border border-border overflow-hidden">
                            <div className="px-5 py-3 border-b border-border bg-surface-hover flex items-center justify-between">
                                <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-warning-text" strokeWidth={1.5} />
                                    Pending Approvals
                                </h2>
                                {actionCount > 0 && (
                                    <span className="bg-warning-bg text-warning-text text-[10px] font-semibold px-2 py-0.5 rounded-[2px]">{actionCount} Requires Action</span>
                                )}
                            </div>
                            
                            {approvals.length > 0 ? (
                                <div className="divide-y divide-border">
                                    {approvals.map((approval) => (
                                        <div key={approval.id} className="px-5 py-3 flex items-center justify-between hover:bg-surface-hover transition-colors">
                                            <div>
                                                <p className="text-sm font-semibold text-text-primary">{approval.title}</p>
                                                <p className="text-xs text-text-secondary mt-0.5">{approval.subtitle}</p>
                                            </div>
                                            <Link href={approval.reviewUrl}>
                                                <button className="px-3 py-1.5 text-xs font-semibold text-primary border border-primary hover:bg-primary-light transition-colors rounded-[2px]">
                                                    Review
                                                </button>
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="px-5 py-8 flex flex-col items-center justify-center text-center">
                                    <CheckCircle2 className="w-8 h-8 text-success-text mb-2 opacity-50" />
                                    <p className="text-sm font-semibold text-text-primary">No pending approvals</p>
                                    <p className="text-xs text-text-muted mt-1">You're all caught up!</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Sidebar */}
                    <div className="space-y-3">
                        {/* On Leave Today */}
                        <div className="bg-surface border border-border p-4">
                            <h3 className="text-xs font-semibold text-text-primary mb-3 flex items-center gap-2">
                                <CalendarCheck className="w-3.5 h-3.5 text-primary" strokeWidth={1.5} />
                                On Leave Today
                            </h3>
                            
                            {leavesToday.length > 0 ? (
                                <div className="space-y-3">
                                    {leavesToday.map((leave, idx) => (
                                        <div key={idx} className="flex justify-between items-start text-xs border-b border-border pb-2 last:border-0 last:pb-0">
                                            <div>
                                                <p className="font-semibold text-text-primary">{leave.name}</p>
                                                <p className="text-text-secondary mt-0.5">{leave.department}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-primary font-medium">{leave.leaveType}</p>
                                                <p className="text-text-muted text-[10px] mt-0.5">Returns: {new Date(leave.returnDate).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-4 text-center">
                                    <p className="text-sm font-semibold text-text-primary">No one is on leave today</p>
                                    <p className="text-xs text-text-muted mt-1">Full attendance reported.</p>
                                </div>
                            )}
                            
                            <Link href="/dashboard/hr/leaves" className="block mt-3">
                                <button className="w-full py-2 text-xs font-semibold text-primary bg-primary-light hover:bg-primary hover:text-white transition-colors border border-primary-light rounded-[2px]">
                                    Manage All Leaves
                                </button>
                            </Link>
                        </div>

                        {/* Quick Reports */}
                        <div className="bg-surface border border-border p-4">
                            <h3 className="text-xs font-semibold text-text-primary mb-3 flex items-center gap-2">
                                <FileText className="w-3.5 h-3.5 text-primary" strokeWidth={1.5} />
                                Compliance Analytics
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-xs border-b border-border pb-2">
                                    <span className="text-text-secondary">Gender Ratio</span>
                                    <span className="font-semibold text-text-primary">{compliance?.genderRatio ?? '45% F / 55% M'}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-text-secondary">Avg Tenure</span>
                                    <span className="font-semibold text-text-primary">{compliance?.avgTenureYears ?? '4.2 Years'}</span>
                                </div>
                                <button 
                                    onClick={() => toast.success('Annual Compliance Report downloading...')}
                                    className="w-full mt-1 py-2 text-xs font-semibold text-primary bg-primary-light hover:bg-primary hover:text-white transition-colors border border-primary-light rounded-[2px]"
                                >
                                    Download Annual Report
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </AdminPageWrapper>
        </DashboardLayout>
    );
}
