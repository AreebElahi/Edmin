'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { UserRole } from '@/types/types';
import { 
  DollarSign, ArrowUpRight, ArrowDownRight, Users, 
  TrendingUp, Calendar, AlertCircle, FileText, UsersRound,
  Landmark, Receipt, CreditCard
} from 'lucide-react';
import Link from 'next/link';
import { useCurrentProfile } from '@/features/profile/hooks/useProfile';
import { useFinanceReports } from '@/features/finance/hooks/useFinance';

export default function FinanceOverviewPage() {
  const { data: profile } = useCurrentProfile();
  const displayName = profile?.fullName || profile?.username || 'Administrator';

  const { data: reports, isLoading } = useFinanceReports();

  const formatCurrency = (val?: number) => {
    return `PKR ${(val || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  };

  // Live database stats
  const stats = [
    { 
      label: 'Total Revenue', 
      value: isLoading ? '...' : formatCurrency(reports?.totalRevenue), 
      change: 'Live Database', 
      isPositive: true, 
      icon: DollarSign, 
      color: 'text-success-text bg-background border-border' 
    },
    { 
      label: 'Outstanding Invoices', 
      value: isLoading ? '...' : reports?.outstandingInvoices?.toString() || '0', 
      change: 'Active Invoices', 
      isPositive: false, 
      icon: AlertCircle, 
      color: 'text-warning-text bg-warning-bg border-border' 
    },
    { 
      label: 'Approved Payroll', 
      value: isLoading ? '...' : `PKR ${(reports?.payrollCosts || 0).toLocaleString()}`, 
      change: 'Disbursed', 
      isPositive: true, 
      icon: Users, 
      color: 'text-primary bg-primary-light border-border' 
    },
    { 
      label: 'Collection Rate', 
      value: isLoading ? '...' : reports?.collectionRate ? `${reports.collectionRate.toFixed(1)}%` : '0%', 
      change: 'Revenue Ratio', 
      isPositive: true, 
      icon: TrendingUp, 
      color: 'text-primary bg-primary-light border-border' 
    },
  ];

  return (
    <DashboardLayout
      userRole={UserRole.ADMIN}
      userName={displayName}
      currentPath="/dashboard/admin/finance"
      notifications={[]}
    >
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8  text-text-primary">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-semibold text-text-primary ">Financial Overview</h1>
            <p className="text-text-secondary font-medium mt-1">Manage institutional payroll systems and analyze database-backed financial metrics.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/admin/finance/payroll" className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-slate-800 text-white font-bold text-xs rounded-[2px] shadow-none  transition-all uppercase tracking-wider">
              <UsersRound className="w-4 h-4" /> Manage Payroll
            </Link>
            <Link href="/dashboard/admin/finance/reports" className="flex items-center gap-2 px-4 py-2.5 bg-surface border border-border text-text-primary hover:bg-surface-hover font-bold text-xs rounded-[2px] shadow-none  transition-all uppercase tracking-wider">
              <FileText className="w-4 h-4" /> Financial Reports
            </Link>
          </div>
        </div>

        {/* Grid Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className="bg-surface rounded-[2px] p-6 border border-border shadow-none hover:shadow-none transition-all flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-xs font-bold text-text-muted uppercase tracking-widest">{stat.label}</p>
                  <p className="text-3xl font-semibold text-text-primary ">{stat.value}</p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-text-muted bg-background py-0.5 px-2 rounded-[2px]">
                      {stat.change}
                    </span>
                  </div>
                </div>
                <div className={`p-4 rounded-[2px] border ${stat.color} shrink-0`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Sub-Navigation Modules Grid */}
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-widest mb-4">Active Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {[
            { label: 'Tuition & Fees', desc: 'Configure fee plans per credit and review waivers', href: '/dashboard/admin/finance/fees', icon: Landmark, color: 'from-blue-500 to-indigo-600 shadow-blue-100' },
            { label: 'Student Invoices', desc: 'Generate invoices and track outstanding states', href: '/dashboard/admin/finance/invoices', icon: Receipt, color: 'from-sky-500 to-blue-600 shadow-sky-100' },
            { label: 'Payments Received', desc: 'Verify incoming payment transactions and cashier ledger', href: '/dashboard/admin/finance/payments', icon: CreditCard, color: 'from-emerald-500 to-teal-600 shadow-emerald-100' },
            { label: 'Faculty Payroll', desc: 'Monitor salary ledger disbursement and individual payslips', href: '/dashboard/admin/finance/payroll', icon: Users, color: 'from-violet-500 to-purple-600 shadow-purple-100' },
            { label: 'Finance Reports', desc: 'Analyze revenues, invoices collection rates, and audit files', href: '/dashboard/admin/finance/reports', icon: FileText, color: 'from-teal-500 to-emerald-600 shadow-teal-100' },
          ].map((mod, idx) => {
            const Icon = mod.icon;
            return (
              <Link href={mod.href} key={idx} className="group bg-surface rounded-[2px] p-6 border border-border shadow-none hover:shadow-none  transition-all flex gap-5 items-center">
                <div className={`w-14 h-14 rounded-[2px] bg-gradient-to-br ${mod.color} flex items-center justify-center text-white shadow-none shrink-0`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-text-primary text-base group-hover:text-primary transition-colors truncate">{mod.label}</h3>
                  <p className="text-text-muted text-xs mt-1 font-medium leading-relaxed">{mod.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
