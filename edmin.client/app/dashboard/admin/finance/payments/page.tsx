'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { UserRole } from '@/types/types';
import { CreditCard, ArrowLeft, Search, Download, Landmark, Smartphone, Calendar, Plus, X, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useCurrentProfile } from '@/features/profile/hooks/useProfile';
import { usePayments, useRecordPayment } from '@/features/finance/hooks/useFinance';

export default function PaymentsReceivedPage() {
  const { data: profile } = useCurrentProfile();
  const displayName = profile?.fullName || profile?.username || 'Administrator';

  const { data: payments, isLoading, error } = usePayments();
  const recordPaymentMut = useRecordPayment();

  const [searchQuery, setSearchQuery] = useState('');
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

  const [invoiceId, setInvoiceId] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'CASH' | 'BANK' | 'CARD' | 'ONLINE'>('BANK');
  const [txnRef, setTxnRef] = useState('');

  const filteredPayments = payments?.filter(pay => {
    const studentName = pay.invoice?.student?.fullname || pay.invoice?.student?.user?.username || '';
    const rollnumber = pay.invoice?.student?.rollnumber || '';
    return (
      studentName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      rollnumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pay.paymentid.toString().includes(searchQuery) ||
      (pay.transactionref || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }) || [];

  // Aggregated totals by method from the live data
  const bankTotal = payments?.filter(p => p.method === 'BANK').reduce((sum, p) => sum + p.amount, 0) || 0;
  const onlineTotal = payments?.filter(p => p.method === 'CARD' || p.method === 'ONLINE').reduce((sum, p) => sum + p.amount, 0) || 0;
  const cashTotal = payments?.filter(p => p.method === 'CASH').reduce((sum, p) => sum + p.amount, 0) || 0;

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceId || !amount) return;

    await recordPaymentMut.mutateAsync({
      invoiceId: Number(invoiceId),
      amount: Number(amount),
      method,
      transactionRef: txnRef || undefined
    });

    setIsRecordModalOpen(false);
    setInvoiceId('');
    setAmount('');
    setTxnRef('');
  };

  return (
    <DashboardLayout
      userRole={UserRole.ADMIN}
      userName={displayName}
      currentPath="/dashboard/admin/finance/payments"
      notifications={[]}
    >
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-8  space-y-8 text-text-primary">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/admin/finance" className="p-2 bg-background hover:bg-slate-200 text-text-secondary rounded-[2px] transition-all">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest">
                <CreditCard className="w-3.5 h-3.5" /> Finance Module
              </div>
              <h1 className="text-3xl font-semibold text-text-primary ">Payments Received</h1>
            </div>
          </div>

          <button
            onClick={() => setIsRecordModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-900 text-white font-bold text-xs rounded-[2px] hover:bg-slate-800 transition-colors uppercase tracking-wider"
          >
            <Plus className="w-3.5 h-3.5" /> Record Payment
          </button>
        </div>

        {/* Info summary panels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface rounded-[2px] p-5 border border-border shadow-none flex items-center gap-4">
            <div className="p-3 bg-background text-success-text rounded-[2px] border border-border shrink-0">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Bank Transfers</p>
              <p className="text-xl font-semibold text-text-primary">PKR {bankTotal.toLocaleString()}</p>
            </div>
          </div>
          <div className="bg-surface rounded-[2px] p-5 border border-border shadow-none flex items-center gap-4">
            <div className="p-3 bg-primary-light text-primary rounded-[2px] border border-border shrink-0">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Online Portals & Cards</p>
              <p className="text-xl font-semibold text-text-primary">PKR {onlineTotal.toLocaleString()}</p>
            </div>
          </div>
          <div className="bg-surface rounded-[2px] p-5 border border-border shadow-none flex items-center gap-4">
            <div className="p-3 bg-surface-hover text-text-secondary rounded-[2px] border border-border shrink-0">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Cash Collections</p>
              <p className="text-xl font-semibold text-text-primary">PKR {cashTotal.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-surface rounded-[2px] p-4 border border-border shadow-none flex items-center justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by student name, payment ID, transaction ref..."
              className="w-full pl-10 pr-4 py-2 rounded-[2px] border border-border focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-sm font-medium text-text-primary bg-surface"
            />
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-[2px] animate-spin"></div>
            <p className="text-xs font-semibold text-text-muted">Loading payment entries...</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-error-bg text-error-text rounded-[2px] text-xs font-semibold">
            Failed to load payments.
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="text-center py-16 text-text-muted text-xs font-semibold bg-surface rounded-[2px] border border-border shadow-none">
            No payments recorded yet.
          </div>
        ) : (
          <div className="bg-surface rounded-[2px] border border-border shadow-none overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-surface-hover/50">
                    <th className="py-4 px-6 text-[10px] font-semibold uppercase text-text-muted tracking-wider">Receipt ID</th>
                    <th className="py-4 px-6 text-[10px] font-semibold uppercase text-text-muted tracking-wider">Invoice ID</th>
                    <th className="py-4 px-6 text-[10px] font-semibold uppercase text-text-muted tracking-wider">Student</th>
                    <th className="py-4 px-6 text-[10px] font-semibold uppercase text-text-muted tracking-wider">Method</th>
                    <th className="py-4 px-6 text-[10px] font-semibold uppercase text-text-muted tracking-wider">Ref ID</th>
                    <th className="py-4 px-6 text-[10px] font-semibold uppercase text-text-muted tracking-wider">Date</th>
                    <th className="py-4 px-6 text-[10px] font-semibold uppercase text-text-muted tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredPayments.map((pay) => (
                    <tr key={pay.paymentid} className="hover:bg-surface-hover/50 transition-colors">
                      <td className="py-4 px-6 text-xs font-mono font-bold text-text-secondary">PAY-{pay.paymentid.toString().padStart(5, '0')}</td>
                      <td className="py-4 px-6 text-xs font-mono font-semibold text-text-muted">INV-{pay.invoiceid.toString().padStart(5, '0')}</td>
                      <td className="py-4 px-6 text-xs font-bold text-text-primary">{pay.invoice?.student?.fullname || pay.invoice?.student?.user?.username}</td>
                      <td className="py-4 px-6 text-xs font-semibold text-text-secondary">{pay.method}</td>
                      <td className="py-4 px-6 text-xs font-mono font-medium text-text-muted">{pay.transactionref || '—'}</td>
                      <td className="py-4 px-6 text-xs font-medium text-text-muted">{new Date(pay.createdat).toLocaleDateString()}</td>
                      <td className="py-4 px-6 text-xs font-semibold text-success-text">PKR {Number(pay.amount).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60  flex items-center justify-center p-4 z-50 ">
          <div className="bg-surface rounded-[2px] w-full max-w-md shadow-none border border-border overflow-hidden text-text-primary">
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-semibold text-sm uppercase tracking-wider">Record Student Payment</h3>
              <button onClick={() => setIsRecordModalOpen(false)} className="p-1 text-text-muted hover:text-white rounded-[2px] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Invoice ID</label>
                <input
                  type="number"
                  required
                  value={invoiceId}
                  onChange={e => setInvoiceId(e.target.value)}
                  placeholder="e.g. 1"
                  className="w-full px-3 py-2 border border-border rounded-[2px] focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-xs font-bold text-text-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Amount Paid (PKR)</label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full px-3 py-2 border border-border rounded-[2px] focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-xs font-bold text-text-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Payment Method</label>
                <select
                  value={method}
                  onChange={e => setMethod(e.target.value as any)}
                  className="w-full px-3 py-2 border border-border rounded-[2px] focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-xs font-bold text-text-primary bg-surface"
                >
                  <option value="BANK">Bank Transfer</option>
                  <option value="CARD">Credit/Debit Card</option>
                  <option value="ONLINE">Online Wallet</option>
                  <option value="CASH">Cash Deposit</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Transaction Reference (Optional)</label>
                <input
                  type="text"
                  value={txnRef}
                  onChange={e => setTxnRef(e.target.value)}
                  placeholder="e.g. FT-908122-PK"
                  className="w-full px-3 py-2 border border-border rounded-[2px] focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-xs font-bold text-text-primary"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={recordPaymentMut.isPending}
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-[2px] flex items-center justify-center gap-1.5 uppercase tracking-wider transition-colors"
                >
                  {recordPaymentMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Record Payment'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
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
