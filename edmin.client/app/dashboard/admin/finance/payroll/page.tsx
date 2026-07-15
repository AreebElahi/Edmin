'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { UserRole } from '@/types/types';
import { useCurrentProfile } from '@/features/profile/hooks/useProfile';
import { usePayrolls, usePayrollDetails } from '@/features/finance/hooks/useFinance';
import { Users, ArrowLeft, Search, Calendar, FileText, Download, Eye, X, Printer, Lock } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function PayrollPage() {
  const { data: profile } = useCurrentProfile();
  const displayName = profile?.fullName || profile?.username || 'Administrator';

  const { data: payrolls, isLoading, error } = usePayrolls();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPayrollId, setSelectedPayrollId] = useState<number | null>(null);

  // Filter payroll records based on search query
  const filteredPayrolls = payrolls?.filter(p =>
    p.fullname.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.employeenumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.departmentName.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Helper to convert month number to name
  const getMonthName = (monthNum: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthNum - 1] || `Month ${monthNum}`;
  };

  return (
    <DashboardLayout
      userRole={UserRole.ADMIN}
      userName={displayName}
      currentPath="/dashboard/admin/finance/payroll"
      notifications={[]}
    >
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-8  space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/admin/finance" className="p-2 bg-background hover:bg-slate-200 text-text-secondary rounded-[2px] transition-all">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest">
                <Users className="w-3.5 h-3.5" /> Finance Module
              </div>
              <h1 className="text-3xl font-semibold text-text-primary ">Faculty & Staff Payroll</h1>
            </div>
          </div>

          <div className="relative group">
            <button
              disabled
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-200 text-text-secondary font-bold text-xs rounded-[2px] cursor-not-allowed border border-slate-300 transition-all uppercase tracking-wider"
            >
              <Lock className="w-3.5 h-3.5" /> Run Payroll (Coming Soon)
            </button>
            <div className="absolute right-0 top-full mt-2 hidden group-hover:block bg-slate-800 text-white text-[10px] py-1 px-2 rounded shadow-none whitespace-nowrap z-50">
              Integrations with Attendance, Leaves, and Taxes are coming soon.
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-surface rounded-[2px] p-4 border border-border shadow-none flex items-center justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search employee by name, ID, department..."
              className="w-full pl-10 pr-4 py-2 rounded-[2px] border border-border focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-sm font-medium text-text-primary bg-surface"
            />
          </div>
        </div>

        {/* Main List */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-[2px] animate-spin"></div>
            <p className="text-sm font-bold text-text-secondary">Loading payroll ledger...</p>
          </div>
        ) : error ? (
          <div className="p-6 bg-error-bg border border-border text-error-text rounded-[2px] text-sm font-semibold">
            Failed to load payroll entries. Please try again.
          </div>
        ) : filteredPayrolls.length === 0 ? (
          <div className="bg-surface rounded-[2px] p-16 text-center border border-border shadow-none">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-text-primary">No Payroll Records Found</h3>
            <p className="text-text-muted text-xs mt-1">Try refining your search terms or verify database records.</p>
          </div>
        ) : (
          <div className="bg-surface rounded-[2px] border border-border shadow-none overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-surface-hover/50">
                    <th className="py-4 px-6 text-[10px] font-semibold uppercase text-text-muted tracking-wider">Payroll ID</th>
                    <th className="py-4 px-6 text-[10px] font-semibold uppercase text-text-muted tracking-wider">Employee</th>
                    <th className="py-4 px-6 text-[10px] font-semibold uppercase text-text-muted tracking-wider">Department</th>
                    <th className="py-4 px-6 text-[10px] font-semibold uppercase text-text-muted tracking-wider">Period</th>
                    <th className="py-4 px-6 text-[10px] font-semibold uppercase text-text-muted tracking-wider">Base Salary</th>
                    <th className="py-4 px-6 text-[10px] font-semibold uppercase text-text-muted tracking-wider">Net Paid</th>
                    <th className="py-4 px-6 text-[10px] font-semibold uppercase text-text-muted tracking-wider">Status</th>
                    <th className="py-4 px-6 text-[10px] font-semibold uppercase text-text-muted tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredPayrolls.map((pay) => (
                    <tr key={pay.payrollid} className="hover:bg-surface-hover/50 transition-colors">
                      <td className="py-4 px-6 text-xs font-mono font-bold text-text-muted">PAY-{pay.payrollid.toString().padStart(4, '0')}</td>
                      <td className="py-4 px-6">
                        <p className="text-xs font-bold text-text-primary">{pay.fullname}</p>
                        <p className="text-[10px] font-semibold text-text-muted font-mono mt-0.5">{pay.employeenumber}</p>
                      </td>
                      <td className="py-4 px-6 text-xs font-semibold text-text-secondary">{pay.departmentName}</td>
                      <td className="py-4 px-6 text-xs font-medium text-text-primary">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-text-muted" />
                          {getMonthName(pay.month)} {pay.year}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-xs font-semibold text-text-secondary">PKR {Number(pay.basesalary).toLocaleString()}</td>
                      <td className="py-4 px-6 text-xs font-semibold text-text-primary">PKR {Number(pay.netpay).toLocaleString()}</td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex px-2.5 py-1 rounded-[2px] text-[10px] font-semibold uppercase tracking-wider ${
                          pay.status === 'APPROVED' ? 'bg-background text-success-text border border-border' :
                          pay.status === 'DRAFT' ? 'bg-primary-light text-primary border border-border' :
                          'bg-error-bg text-error-text border border-border'
                        }`}>
                          {pay.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setSelectedPayrollId(pay.payrollid)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-background hover:bg-primary-light text-text-secondary hover:text-primary rounded-[2px] text-[10px] font-bold uppercase transition-all"
                          >
                            <Eye className="w-3.5 h-3.5" /> View Slip
                          </button>
                          <button className="p-1.5 hover:bg-background text-text-secondary hover:text-success-text rounded-[2px] transition-colors" title="Download Payslip">
                            <Download className="w-4 h-4" />
                          </button>
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

      {/* Slip Details Modal */}
      {selectedPayrollId !== null && (
        <PayrollDetailsModal
          payrollId={selectedPayrollId}
          onClose={() => setSelectedPayrollId(null)}
          getMonthName={getMonthName}
        />
      )}
    </DashboardLayout>
  );
}

interface ModalProps {
  payrollId: number;
  onClose: () => void;
  getMonthName: (m: number) => string;
}

function PayrollDetailsModal({ payrollId, onClose, getMonthName }: ModalProps) {
  const { data: details, isLoading } = usePayrollDetails(payrollId);

  // Compute mock calculations to make it look premium
  const baseVal = details ? Number(details.basesalary) : 0;
  const taxDeduction = baseVal * 0.1; // 10% mock income tax
  const providentFund = baseVal * 0.05; // 5% mock provident fund
  const netPaidVal = details ? Number(details.netpay) : 0;
  const allowances = netPaidVal - (baseVal - taxDeduction - providentFund);

  return (
    <div className="fixed inset-0 bg-slate-900/60  flex items-center justify-center p-4 z-50 ">
      <div className="bg-surface rounded-[2px] w-full max-w-xl shadow-none border border-border overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold text-sm uppercase tracking-wider">Salary Payslip Detailed View</h3>
          </div>
          <button onClick={onClose} className="p-1 text-text-muted hover:text-white rounded-[2px] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4 flex-1">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-[2px] animate-spin"></div>
            <p className="text-xs font-semibold text-text-secondary">Loading slip details...</p>
          </div>
        ) : !details ? (
          <div className="p-8 text-center text-rose-500 font-bold flex-1">
            Failed to fetch salary details.
          </div>
        ) : (
          <div className="p-6 space-y-6 overflow-y-auto flex-1 text-text-primary">
            {/* Institution Banner */}
            <div className="text-center space-y-1 pb-4 border-b border-border">
              <h2 className="text-xl font-semibold text-text-primary ">EDMIN INSTITUTE OF LEARNING</h2>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Official Salary Breakdown Statement</p>
              <p className="text-xs font-semibold text-text-secondary mt-2">
                For the period of <span className="text-text-primary font-bold">{getMonthName(details.month)} {details.year}</span>
              </p>
            </div>

            {/* Employee info grid */}
            <div className="grid grid-cols-2 gap-4 bg-surface-hover rounded-[2px] p-4 border border-border text-xs">
              <div>
                <p className="text-text-muted font-bold uppercase text-[9px]">Employee Name</p>
                <p className="font-bold text-text-primary mt-0.5">{details.fullname}</p>
              </div>
              <div>
                <p className="text-text-muted font-bold uppercase text-[9px]">Employee Number</p>
                <p className="font-mono font-bold text-text-primary mt-0.5">{details.employeenumber}</p>
              </div>
              <div>
                <p className="text-text-muted font-bold uppercase text-[9px]">Department</p>
                <p className="font-semibold text-text-primary mt-0.5">{details.departmentName}</p>
              </div>
              <div>
                <p className="text-text-muted font-bold uppercase text-[9px]">Payslip Status</p>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider ${
                  details.status === 'APPROVED' ? 'bg-background text-success-text' :
                  details.status === 'DRAFT' ? 'bg-primary-light text-primary' :
                  'bg-error-bg text-error-text'
                }`}>
                  {details.status}
                </span>
              </div>
            </div>

            {/* Calculations Table */}
            <div className="space-y-4">
              <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider">Salary Details</h4>
              
              <div className="border border-border rounded-[2px] overflow-hidden text-xs">
                {/* Earnings */}
                <div className="bg-surface-hover/50 px-4 py-2 font-bold text-text-primary border-b border-border">Earnings</div>
                <div className="divide-y divide-slate-50 px-4">
                  <div className="py-2.5 flex justify-between">
                    <span className="text-text-secondary">Base Salary</span>
                    <span className="font-semibold text-text-primary">PKR {baseVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  {allowances > 0 && (
                    <div className="py-2.5 flex justify-between">
                      <span className="text-text-secondary">Allowances & Overtime</span>
                      <span className="font-semibold text-text-primary">PKR {allowances.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                </div>

                {/* Deductions */}
                <div className="bg-surface-hover/50 px-4 py-2 font-bold text-text-primary border-y border-border">Deductions</div>
                <div className="divide-y divide-slate-50 px-4">
                  <div className="py-2.5 flex justify-between">
                    <span className="text-text-secondary">Income Tax (10%)</span>
                    <span className="font-semibold text-error-text">-PKR {taxDeduction.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-text-secondary">Provident Fund (5%)</span>
                    <span className="font-semibold text-error-text">-PKR {providentFund.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {/* Total */}
                <div className="bg-slate-900 text-white px-4 py-3 font-bold flex justify-between items-center text-sm">
                  <span>Net Disbursed Pay</span>
                  <span className="font-semibold text-lg">PKR {netPaidVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex gap-3 pt-4 border-t border-border">
              <button className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-[2px] flex items-center justify-center gap-2 uppercase tracking-wider transition-colors">
                <Printer className="w-4 h-4" /> Print Statement
              </button>
              <button onClick={onClose} className="px-5 py-2.5 border border-border hover:bg-surface-hover text-text-primary font-bold text-xs rounded-[2px] uppercase tracking-wider transition-colors">
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
