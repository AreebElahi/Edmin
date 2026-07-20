'use client';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import DashboardLayout from '@/components/DashboardLayout';
import { UserRole } from '@/types/types';
import { Receipt, ArrowLeft, Plus, Search, Filter, Mail, CreditCard, X, Loader2, ChevronDown, Check } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useCurrentProfile } from '@/features/profile/hooks/useProfile';
import { useInvoices, useGenerateInvoice } from '@/features/finance/hooks/useFinance';
import { useStudentDirectory } from '@/features/studentOversight/hooks/useStudentOversight';
import { useSemesters } from '@/features/academic/hooks/useAcademic';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminFilterBar from '@/components/admin/AdminFilterBar';

export default function StudentInvoicesPage() {
  const { data: profile } = useCurrentProfile();
  const displayName = profile?.fullName || profile?.username || 'Administrator';

  const { data: invoices, isLoading, error } = useInvoices();
  const generateInvoiceMut = useGenerateInvoice();

  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);

  const [studentId, setStudentId] = useState('');
  const [semesterId, setSemesterId] = useState('');

  const { data: semesters = [] } = useSemesters();
  const { data: students = [] } = useStudentDirectory();
  const [studentSearch, setStudentSearch] = useState('');
  const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState(false);
  
  const filteredStudentsForDropdown = students.filter(s => 
    (s.fullname || '').toLowerCase().includes(studentSearch.toLowerCase()) ||
    (s.rollnumber || '').toLowerCase().includes(studentSearch.toLowerCase()) ||
    (s.department || '').toLowerCase().includes(studentSearch.toLowerCase())
  );
  
  const selectedStudentDetails = students.find(s => s.studentid.toString() === studentId);
  const [credits, setCredits] = useState('');

  const filteredInvoices = invoices?.filter(inv => {
    const matchesStatus = filterStatus === 'ALL' || inv.status === filterStatus;
    const matchesSearch = 
      (inv.student?.fullname || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (inv.student?.rollnumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.invoiceid.toString().includes(searchQuery);
    return matchesStatus && matchesSearch;
  }) || [];

  const handleIssueInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !semesterId) return;

    await generateInvoiceMut.mutateAsync({
      studentId: Number(studentId),
      semesterId: Number(semesterId),
      enrolledCredits: credits ? Number(credits) : undefined
    });

    setIsIssueModalOpen(false);
    setStudentId('');
    setCredits('');
  };

  return (
    <DashboardLayout
      userRole={UserRole.ADMIN}
      userName={displayName}
      currentPath="/dashboard/admin/finance/invoices"
      notifications={[]}
    >
      <AdminPageWrapper>
        {/* Header */}
        <AdminPageHeader
            icon={Receipt}
            eyebrow={{ icon: Receipt, label: 'Finance Module' }}
            title="Student"
            titleAccent="Invoices"
            backHref="/dashboard/admin/finance"
            actions={
                <button
                    onClick={() => setIsIssueModalOpen(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-white text-primary hover:bg-slate-100 rounded-[2px] text-sm font-semibold transition-colors w-full sm:w-auto justify-center"
                >
                    <Plus className="w-4 h-4" /> Issue Invoice
                </button>
            }
        />

        {/* Filters */}
        <AdminFilterBar
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search student, invoice, ID..."
            filters={[
                {
                    id: 'status',
                    label: 'Status',
                    value: filterStatus,
                    onChange: setFilterStatus,
                    options: [
                        { value: 'ALL', label: 'All Status' },
                        { value: 'PAID', label: 'Paid' },
                        { value: 'PARTIAL', label: 'Partial' },
                        { value: 'PENDING', label: 'Pending' },
                        { value: 'OVERDUE', label: 'Overdue' }
                    ]
                }
            ]}
        />

        {/* Invoices list */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-[2px] animate-spin"></div>
            <p className="text-xs font-semibold text-text-muted">Loading student invoices...</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-error-bg text-error-text rounded-[2px] text-xs font-semibold">
            Failed to load student invoices ledger.
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="text-center py-16 text-text-muted text-xs font-semibold bg-surface rounded-[2px] border border-border shadow-none">
            No invoices issued. Click "Issue Invoice" to run billing.
          </div>
        ) : (
          <div className="bg-surface rounded-[2px] border border-border shadow-none overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-surface-hover/50">
                    <th className="py-4 px-6 text-[10px] font-semibold uppercase text-text-muted tracking-wider">Invoice ID</th>
                    <th className="py-4 px-6 text-[10px] font-semibold uppercase text-text-muted tracking-wider">Student Details</th>
                    <th className="py-4 px-6 text-[10px] font-semibold uppercase text-text-muted tracking-wider">Semester</th>
                    <th className="py-4 px-6 text-[10px] font-semibold uppercase text-text-muted tracking-wider">Due Date</th>
                    <th className="py-4 px-6 text-[10px] font-semibold uppercase text-text-muted tracking-wider">Total Amount</th>
                    <th className="py-4 px-6 text-[10px] font-semibold uppercase text-text-muted tracking-wider">Paid</th>
                    <th className="py-4 px-6 text-[10px] font-semibold uppercase text-text-muted tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.invoiceid} className="hover:bg-surface-hover/50 transition-colors">
                      <td className="py-4 px-6 text-xs font-mono font-bold text-text-secondary">INV-{inv.invoiceid.toString().padStart(5, '0')}</td>
                      <td className="py-4 px-6">
                        <p className="text-xs font-bold text-text-primary">{inv.student?.fullname || inv.student?.user?.username}</p>
                        <p className="text-[10px] font-semibold text-text-muted font-mono mt-0.5">{inv.student?.rollnumber || 'N/A'}</p>
                      </td>
                      <td className="py-4 px-6 text-xs font-medium text-text-secondary">{inv.semester?.name}</td>
                      <td className="py-4 px-6 text-xs font-medium text-text-muted">{new Date(inv.duedate).toLocaleDateString()}</td>
                      <td className="py-4 px-6 text-xs font-semibold text-text-primary">PKR {Number(inv.totalamount).toLocaleString()}</td>
                      <td className="py-4 px-6 text-xs font-bold text-text-secondary">PKR {Number(inv.amountpaid).toLocaleString()}</td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex px-2.5 py-1 rounded-[2px] text-[10px] font-semibold uppercase tracking-wider ${
                          inv.status === 'PAID' ? 'bg-background text-success-text border border-border' :
                          inv.status === 'PARTIAL' ? 'bg-primary-light text-primary border border-border' :
                          inv.status === 'PENDING' ? 'bg-warning-bg text-warning-text border border-border' :
                          'bg-error-bg text-error-text border border-border'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </AdminPageWrapper>

      {/* Issue Invoice Modal */}
      {isIssueModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60  flex items-center justify-center p-4 z-50 ">
          <div className="bg-surface rounded-[2px] w-full max-w-md shadow-none border border-border overflow-hidden text-text-primary">
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-semibold text-sm uppercase tracking-wider">Issue Student Invoice</h3>
              <button onClick={() => setIsIssueModalOpen(false)} className="p-1 text-text-muted hover:text-white rounded-[2px] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleIssueInvoice} className="p-6 space-y-4">
              <div className="relative">
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Student</label>
                <div 
                  className="w-full px-3 py-2 border border-border rounded-[2px] cursor-pointer bg-surface flex justify-between items-center text-xs font-bold text-text-primary"
                  onClick={() => setIsStudentDropdownOpen(!isStudentDropdownOpen)}
                >
                  <span>
                    {selectedStudentDetails 
                      ? `${selectedStudentDetails.rollnumber} - ${selectedStudentDetails.fullname} (${selectedStudentDetails.department})` 
                      : 'Select a student...'}
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isStudentDropdownOpen ? 'rotate-180' : ''}`} />
                </div>
                
                {isStudentDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-surface border border-border shadow-lg max-h-60 overflow-y-auto rounded-[2px]">
                    <div className="p-2 sticky top-0 bg-surface border-b border-border">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                        <input
                          type="text"
                          autoFocus
                          placeholder="Search name, ID, or department..."
                          value={studentSearch}
                          onChange={(e) => setStudentSearch(e.target.value)}
                          className="w-full pl-9 pr-3 py-1.5 bg-background border border-border rounded-[2px] text-xs focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                    {filteredStudentsForDropdown.length === 0 ? (
                      <div className="p-3 text-xs text-center text-text-muted">No students found</div>
                    ) : (
                      filteredStudentsForDropdown.map((s) => (
                        <div
                          key={s.studentid}
                          className="px-3 py-2 text-xs hover:bg-surface-hover cursor-pointer flex justify-between items-center"
                          onClick={() => {
                            setStudentId(s.studentid.toString());
                            setIsStudentDropdownOpen(false);
                            setStudentSearch('');
                          }}
                        >
                          <div>
                            <span className="font-bold text-text-primary">{s.fullname}</span>
                            <span className="text-text-muted ml-2">{s.rollnumber}</span>
                            <div className="text-[10px] text-text-muted mt-0.5">{s.department}</div>
                          </div>
                          {studentId === s.studentid.toString() && <Check className="w-4 h-4 text-primary" />}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Semester</label>
                <select
                  required
                  value={semesterId}
                  onChange={e => setSemesterId(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-[2px] focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-xs font-bold text-text-primary bg-surface"
                >
                  <option value="" disabled>Select a semester</option>
                  {semesters.map(semester => (
                    <option key={semester.semesterid} value={semester.semesterid.toString()}>
                      {semester.name} (ID {semester.semesterid})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Credits Override (Optional)</label>
                <input
                  type="number"
                  value={credits}
                  onChange={e => setCredits(e.target.value)}
                  placeholder="Auto-calculates from enrollments if empty"
                  className="w-full px-3 py-2 border border-border rounded-[2px] focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-xs font-bold text-text-primary"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={generateInvoiceMut.isPending}
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-[2px] flex items-center justify-center gap-1.5 uppercase tracking-wider transition-colors"
                >
                  {generateInvoiceMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generate Invoice'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsIssueModalOpen(false)}
                  className="px-4 py-2.5 border border-border text-text-primary hover:bg-surface-hover font-bold text-xs rounded-[2px] uppercase tracking-wider transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
