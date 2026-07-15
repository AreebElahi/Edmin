'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { UserRole } from '@/types/types';
import { useCurrentProfile } from '@/features/profile/hooks/useProfile';
import { useFinanceReports } from '@/features/finance/hooks/useFinance';
import { 
  FileText, ArrowLeft, Download, DollarSign, Receipt, AlertCircle, 
  Award, Percent, Calendar, TrendingUp, Landmark, FileCheck 
} from 'lucide-react';
import Link from 'next/link';

export default function FinanceReportsPage() {
  const { data: profile } = useCurrentProfile();
  const displayName = profile?.fullName || profile?.username || 'Administrator';

  const { data: reports, isLoading, error } = useFinanceReports();

  // Helper formatting values
  const formatCurrency = (val?: number) => {
    return `PKR ${(val || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  };

  const formatPercentage = (val?: number) => {
    return `${(val || 0).toFixed(1)}%`;
  };

  const handleDownloadReport = async (type: string, filename: string) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      const response = await fetch(`${baseUrl}/admin/finance/reports/download/${type}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download report');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert('Error downloading report: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  // 1. Calculate values for Donut Chart
  const statusColors: { [key: string]: string } = {
    PAID: 'rgb(16, 185, 129)', // emerald-500
    PARTIAL: 'rgb(59, 130, 246)', // blue-500
    PENDING: 'rgb(245, 158, 11)', // amber-500
    OVERDUE: 'rgb(239, 68, 68)', // [#FDE7E9]0
    FAILED: 'rgb(107, 114, 128)', // gray-500
    PROCESSING: 'rgb(139, 92, 246)' // violet-500
  };

  const statusBg = reports?.invoiceStatuses || [];
  const totalInvoicesCount = statusBg.reduce((sum, s) => sum + s.count, 0);

  // Generate conic gradient for invoice statuses donut chart
  let gradientString = 'conic-gradient(from 0deg, var(--color-surface-hover) 0% 100%)';
  let accumulatedPercent = 0;

  if (totalInvoicesCount > 0) {
    const segments = statusBg
      .filter(s => s.count > 0)
      .map(s => {
        const percent = (s.count / totalInvoicesCount) * 100;
        const start = accumulatedPercent;
        accumulatedPercent += percent;
        return `${statusColors[s.status] || 'var(--color-border-hover)'} ${start}% ${accumulatedPercent}%`;
      });
    if (segments.length > 0) {
      gradientString = `conic-gradient(from 0deg, ${segments.join(', ')})`;
    }
  }

  // 2. Max value for Bar Chart scaling (Revenue vs Payroll)
  const maxBarVal = reports?.revenueVsPayroll 
    ? Math.max(...reports.revenueVsPayroll.map(d => Math.max(d.revenue, d.payroll)), 1000)
    : 1000;

  // 3. Max value for Line Chart scaling (Monthly Collections)
  const maxLineVal = reports?.monthlyCollections
    ? Math.max(...reports.monthlyCollections.map(d => d.amount), 1000)
    : 1000;

  // Generate SVG polyline points for collections line chart
  let polylinePoints = '';
  if (reports?.monthlyCollections) {
    const width = 600;
    const height = 150;
    const paddingX = 40;
    const paddingY = 20;

    const usableWidth = width - paddingX * 2;
    const usableHeight = height - paddingY * 2;
    const count = reports.monthlyCollections.length;

    reports.monthlyCollections.forEach((d, idx) => {
      const x = paddingX + (idx * usableWidth) / (count - 1 || 1);
      const ratio = maxLineVal > 0 ? d.amount / maxLineVal : 0;
      const y = height - paddingY - ratio * usableHeight;
      polylinePoints += `${x},${y} `;
    });
  }

  return (
    <DashboardLayout
      userRole={UserRole.ADMIN}
      userName={displayName}
      currentPath="/dashboard/admin/finance/reports"
      notifications={[]}
    >
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8  space-y-8 text-text-primary">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/admin/finance" className="p-2 bg-background hover:bg-slate-200 text-text-secondary rounded-[2px] transition-all">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest">
                <FileText className="w-3.5 h-3.5" /> Finance Module
              </div>
              <h1 className="text-3xl font-semibold text-text-primary ">Financial Reports</h1>
            </div>
          </div>

          <button 
            onClick={() => handleDownloadReport('all', 'financial_reports_export.json')}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-slate-800 text-white font-bold text-xs rounded-[2px] shadow-none  transition-all uppercase tracking-wider"
          >
            <Download className="w-4 h-4" /> Export All Reports
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-[2px] animate-spin"></div>
            <p className="text-sm font-bold text-text-secondary">Compiling financial metrics...</p>
          </div>
        ) : error ? (
          <div className="p-6 bg-error-bg border border-border text-error-text rounded-[2px] text-sm font-semibold">
            Failed to aggregate reports. Verify connection to the server.
          </div>
        ) : (
          <>
            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Total Revenue', val: formatCurrency(reports?.totalRevenue), desc: 'Payments Received', icon: DollarSign, color: 'from-emerald-500 to-teal-600 text-success-text bg-background' },
                { label: 'Total Invoiced', val: formatCurrency(reports?.invoicedTotal), desc: 'Tuition Billings Generated', icon: Receipt, color: 'from-blue-500 to-indigo-600 text-primary bg-primary-light' },
                { label: 'Outstanding Invoices', val: reports?.outstandingInvoices, desc: 'Unpaid Semester Invoices', icon: AlertCircle, color: 'from-amber-500 to-orange-600 text-warning-text bg-warning-bg' },
                { label: 'Unpaid Invoice Amount', val: formatCurrency(reports?.unpaidInvoiceAmount), desc: 'Pending Receivables Balance', icon: DollarSign, color: 'from-rose-500 to-[#A4262C] text-rose-500 bg-error-bg' },
                { label: 'Payroll Costs (Approved)', val: isLoading ? '...' : `PKR ${(reports?.payrollCosts || 0).toLocaleString()}`, desc: 'Total Faculty Base Disbursals', icon: Landmark, color: 'from-violet-500 to-purple-600 text-primary bg-background' },
                { label: 'Active Scholarships', val: reports?.scholarshipCount, desc: 'Students on Financial waivers', icon: Award, color: 'from-sky-500 to-blue-600 text-primary bg-primary-light' },
                { label: 'Average waiver Discount', val: formatPercentage(reports?.scholarshipAverage), desc: 'Mean Waiver Percentage', icon: Percent, color: 'from-teal-500 to-emerald-600 text-primary bg-background' },
                { label: 'Invoice Collection Rate', val: formatPercentage(reports?.collectionRate), desc: 'Revenue-to-Invoice Ratio', icon: TrendingUp, color: 'from-slate-600 to-slate-800 text-text-primary bg-background' },
              ].map((card, idx) => {
                const Icon = card.icon;
                return (
                  <div key={idx} className="bg-surface rounded-[2px] p-6 border border-border shadow-none flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{card.label}</p>
                      <p className="text-2xl font-semibold text-text-primary ">{card.val}</p>
                      <p className="text-[10px] font-semibold text-text-muted mt-1">{card.desc}</p>
                    </div>
                    <div className={`p-3 rounded-[2px] ${card.color.split(' ').slice(2).join(' ')} border border-border shrink-0`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Line Chart: Monthly Collections */}
              <div className="lg:col-span-2 bg-surface rounded-[2px] p-6 border border-border shadow-none space-y-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-text-primary  flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-emerald-500" /> Monthly Collections Summary
                  </h3>
                  <p className="text-text-muted text-xs font-semibold">Verification logs of total ledger receipts</p>
                </div>

                {polylinePoints && reports?.monthlyCollections && (
                  <div className="relative w-full overflow-x-auto">
                    <svg viewBox="0 0 600 150" className="w-full min-w-[500px] h-36">
                      {/* Grid Lines */}
                      <line x1="40" y1="20" x2="560" y2="20" stroke="var(--color-surface-hover)" strokeDasharray="3,3" />
                      <line x1="40" y1="65" x2="560" y2="65" stroke="var(--color-surface-hover)" strokeDasharray="3,3" />
                      <line x1="40" y1="110" x2="560" y2="110" stroke="var(--color-surface-hover)" strokeDasharray="3,3" />
                      <line x1="40" y1="130" x2="560" y2="130" stroke="var(--color-border)" strokeWidth="1" />

                      {/* Line Path */}
                      <polyline
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={polylinePoints.trim()}
                      />

                      {/* Circles on dots */}
                      {reports.monthlyCollections.map((d, idx) => {
                        const width = 600;
                        const height = 150;
                        const paddingX = 40;
                        const paddingY = 20;
                        const usableWidth = width - paddingX * 2;
                        const usableHeight = height - paddingY * 2;
                        const x = paddingX + (idx * usableWidth) / (reports.monthlyCollections.length - 1 || 1);
                        const ratio = maxLineVal > 0 ? d.amount / maxLineVal : 0;
                        const y = height - paddingY - ratio * usableHeight;

                        return (
                          <g key={idx} className="group/dot cursor-pointer">
                            <circle
                              cx={x}
                              cy={y}
                              r="5"
                              fill="#10b981"
                              stroke="#ffffff"
                              strokeWidth="1.5"
                              className="transition-transform group-hover/dot:scale-125"
                            />
                            <title>{d.month}: PKR {d.amount.toLocaleString()}</title>
                          </g>
                        );
                      })}
                    </svg>

                    {/* X-Axis labels */}
                    <div className="flex justify-between px-10 text-[10px] font-bold text-text-muted">
                      {reports.monthlyCollections.map((d, idx) => (
                        <span key={idx}>{d.month}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Pie/Donut Chart: Invoice Statuses */}
              <div className="bg-surface rounded-[2px] p-6 border border-border shadow-none space-y-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-text-primary  flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-blue-500" /> Invoice Status Breakdown
                  </h3>
                  <p className="text-text-muted text-xs font-semibold">Distribution of billings in the database</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
                  {/* CSS Donut Chart */}
                  <div 
                    className="relative w-32 h-32 rounded-[2px] shrink-0 flex items-center justify-center border border-slate-50 shadow-inner"
                    style={{ background: gradientString }}
                  >
                    {/* Inner hole */}
                    <div className="w-20 h-20 rounded-[2px] bg-surface flex flex-col items-center justify-center shadow-none">
                      <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Total</span>
                      <span className="text-lg font-semibold text-text-primary er">{totalInvoicesCount}</span>
                    </div>
                  </div>

                  {/* Legend list */}
                  <div className="space-y-2 text-xs w-full max-w-[140px]">
                    {statusBg.map((s, idx) => {
                      if (s.count === 0) return null;
                      return (
                        <div key={idx} className="flex items-center justify-between font-medium">
                          <div className="flex items-center gap-2">
                            <span 
                              className="w-2.5 h-2.5 rounded-[2px] shrink-0" 
                              style={{ backgroundColor: statusColors[s.status] || '#ccc' }}
                            />
                            <span className="text-text-secondary text-[11px]">{s.status}</span>
                          </div>
                          <span className="font-bold text-text-primary">{s.count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Revenue vs Payroll Comparison bar chart */}
            <div className="bg-surface rounded-[2px] p-6 border border-border shadow-none space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-text-primary  flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-500" /> Revenue vs Payroll Expenditure
                </h3>
                <p className="text-text-muted text-xs font-semibold">Comparison of collection income against approved faculty salaries</p>
              </div>

              {reports?.revenueVsPayroll && (
                <div className="space-y-4">
                  {/* Legend indicators */}
                  <div className="flex gap-4 text-xs justify-end font-bold">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded bg-primary-light0"></span>
                      <span className="text-text-secondary">Revenue (Collections)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded bg-background0"></span>
                      <span className="text-text-secondary">Payroll Expenditure</span>
                    </div>
                  </div>

                  <div className="h-64 flex items-end justify-between gap-4 pt-6 border-b border-border overflow-x-auto min-w-[600px] px-4">
                    {reports.revenueVsPayroll.map((d, idx) => {
                      const revPercent = maxBarVal > 0 ? (d.revenue / maxBarVal) * 100 : 0;
                      const payPercent = maxBarVal > 0 ? (d.payroll / maxBarVal) * 100 : 0;

                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center group cursor-pointer h-full justify-end">
                          <div className="flex items-end gap-1.5 h-full w-full max-w-[60px] justify-center">
                            {/* Revenue Bar */}
                            <div 
                              className="w-4 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t transition-all duration-500 group-hover:brightness-110"
                              style={{ height: `${Math.max(revPercent, 2)}%` }}
                              title={`Revenue: ${formatCurrency(d.revenue)}`}
                            />
                            {/* Payroll Bar */}
                            <div 
                              className="w-4 bg-gradient-to-t from-violet-600 to-violet-400 rounded-t transition-all duration-500 group-hover:brightness-110"
                              style={{ height: `${Math.max(payPercent, 2)}%` }}
                              title={`Payroll: PKR ${(d.payroll || 0).toLocaleString()}`}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-text-muted mt-2">{d.month}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* List of Available Fiscal Audits */}
            <div className="bg-surface rounded-[2px] p-6 border border-border shadow-none space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-text-primary ">Available Audit Statements</h3>
                <p className="text-text-muted text-xs font-semibold">Select and download official university reports</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: 'FY 2026 Q2 Financial Audit Statement', type: 'audit', ext: 'txt', format: 'Text Statement', size: 'Live DB' },
                  { name: 'Tuition Revenue & Payment Ledger Reconciliation', type: 'reconciliation', ext: 'csv', format: 'CSV Spreadsheet', size: 'Live DB' },
                  { name: 'Faculty Salary Disbursals Ledger', type: 'payroll', ext: 'csv', format: 'CSV Ledger', size: 'Live DB' },
                  { name: 'Institutional Waiver and Scholarship Review', type: 'scholarship', ext: 'txt', format: 'Text Document', size: 'Live DB' },
                ].map((doc, idx) => (
                  <div key={idx} className="p-4 rounded-[2px] border border-border hover:bg-surface-hover/50 transition-all flex justify-between items-center gap-4">
                    <div className="space-y-1">
                      <h4 className="font-bold text-text-primary text-sm">{doc.name}</h4>
                      <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">{doc.format} • {doc.size}</p>
                    </div>
                    <button 
                      onClick={() => handleDownloadReport(doc.type, `${doc.name.replace(/\s+/g, '_')}.${doc.ext}`)}
                      className="p-2 bg-background hover:bg-primary-light text-text-secondary hover:text-primary rounded-[2px] transition-all"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
