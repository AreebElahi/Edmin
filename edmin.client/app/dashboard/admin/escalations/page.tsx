'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { apiGet, apiPatch } from '@/api/apiContract';
import { toast } from 'react-hot-toast';
import { 
  AlertTriangle, ShieldAlert, CheckCircle2, XCircle, Search, 
  Filter, Loader2, ArrowRight, Clock, User, ShieldCheck, 
  HelpCircle, Calendar, Briefcase, FileText, Check, Ticket,
  BookOpen, ClipboardList, RefreshCw, FileCheck, GraduationCap
} from 'lucide-react';
import Modal from '@/components/Modal';

import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
export default function EscalationsPage() {
    const { data: currentUser } = useCurrentUser();
  const [escalations, setEscalations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  // Modal states
  const [selectedEscalation, setSelectedEscalation] = useState<any>(null);
  const [overrideAction, setOverrideAction] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [overrideComment, setOverrideComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchEscalations = async () => {
    try {
      const res = await apiGet<any[]>('/admin/escalations');
      setEscalations(res || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch escalations');
      toast.error('Failed to load escalation queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEscalations();
  }, []);

  const handleOverrideSubmit = async () => {
    if (!selectedEscalation) return;
    setIsSubmitting(true);
    try {
      await apiPatch(`/admin/escalations/${selectedEscalation.escalationid}/override`, {
        action: overrideAction,
        comment: overrideComment
      });
      toast.success('Absolute override applied successfully. Escalation resolved.');
      setSelectedEscalation(null);
      setOverrideComment('');
      fetchEscalations();
    } catch (err: any) {
      toast.error(err.message || 'Failed to apply override');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRequestTypeDetails = (type: string) => {
    switch (type) {
      case 'TEACHING_LOAD':
        return { label: 'Teaching Load Request', icon: BookOpen, bg: 'bg-primary-light text-blue-750 border-border' };
      case 'LEAVE':
        return { label: 'Faculty Leave Request', icon: FileCheck, bg: 'bg-background text-emerald-750 border-border' };
      case 'ENROLLMENT':
        return { label: 'Enrollment Request', icon: GraduationCap, bg: 'bg-background text-purple-750 border-purple-100' };
      case 'REPORT':
        return { label: 'Daily Activity Report', icon: ClipboardList, bg: 'bg-warning-bg text-amber-750 border-border' };
      case 'TICKET':
        return { label: 'Support Ticket', icon: Ticket, bg: 'bg-error-bg text-rose-750 border-border' };
      default:
        return { label: type, icon: HelpCircle, bg: 'bg-surface-hover text-slate-750 border-border' };
    }
  };

  const getLevelBadge = (level: string) => {
    if (level.includes('Critical') || level.includes('Level 3')) {
      return <span className="px-3 py-1 bg-error-bg text-error-text border border-border rounded-[2px] text-[10px] font-bold uppercase tracking-wider">Level 3 - Critical</span>;
    } else if (level.includes('Medium') || level.includes('Level 2')) {
      return <span className="px-3 py-1 bg-warning-bg text-warning-text border border-border rounded-[2px] text-[10px] font-bold uppercase tracking-wider">Level 2 - Medium</span>;
    } else {
      return <span className="px-3 py-1 bg-primary-light text-primary border border-border rounded-[2px] text-[10px] font-bold uppercase tracking-wider">Level 1 - Warning</span>;
    }
  };

  const getOverdueDaysBadge = (days: number) => {
    if (days >= 5) {
      return <span className="px-2.5 py-1 bg-error-bg text-error-text font-semibold rounded-[2px] text-xs">{days} days overdue</span>;
    } else if (days >= 2) {
      return <span className="px-2.5 py-1 bg-warning-bg text-warning-text font-bold rounded-[2px] text-xs">{days} days overdue</span>;
    } else {
      return <span className="px-2.5 py-1 bg-background text-text-secondary font-medium rounded-[2px] text-xs">{days} days overdue</span>;
    }
  };

  const getEscalationSummary = (item: any) => {
    if (!item.relatedDetails) return `Escalated ${item.relatedtype} request #${item.relatedid}`;
    const details = item.relatedDetails;
    if (item.relatedtype === 'LEAVE') {
      return `Leave request of type ${details.leavetype || 'Casual'} from ${new Date(details.startdate).toLocaleDateString()} to ${new Date(details.enddate).toLocaleDateString()}.`;
    }
    if (item.relatedtype === 'ENROLLMENT') {
      return `Enrollment request for course offering: ${details.courseoffering?.course?.name || 'N/A'}`;
    }
    if (item.relatedtype === 'TEACHING_LOAD') {
      return `Teaching load approval for semester: ${details.semester?.name || 'N/A'}`;
    }
    if (item.relatedtype === 'REPORT') {
      return `Daily activity report on ${new Date(details.reportdate).toLocaleDateString()}. Summary: ${details.summary || 'N/A'}`;
    }
    if (item.relatedtype === 'TICKET') {
      return `Ticket ID #${details.id}: ${details.subject}. Priority: ${details.priority}.`;
    }
    return `Escalated ${item.relatedtype} request #${item.relatedid}`;
  };

  // Filter items
  const filteredItems = escalations.filter(item => {
    const matchesSearch = item.owner.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.currentAuthority.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          getEscalationSummary(item).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'ALL' || item.relatedtype === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <DashboardLayout 
      userName={currentUser?.fullName || 'Admin'} 
      userRole={'admin' as any}
      userAvatar="https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff"
      notifications={[]}
      currentPath="/dashboard/admin/escalations"
    >
      <div className="p-6 space-y-6 max-w-[1400px] mx-auto ">
        
        {/* Header Block */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-semibold text-text-primary ">Escalation Queue</h1>
            <p className="text-text-secondary text-sm mt-1">Monitor and override bottleneck workflows, overdue leave approvals, delayed teaching loads, and stagnant support tickets.</p>
          </div>
          <button 
            onClick={() => {
              setLoading(true);
              fetchEscalations();
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-surface border border-warning-text text-warning-text hover:bg-warning-bg hover:text-warning-text transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Queue
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="relative bg-surface rounded-[2px] p-5 shadow-none border border-border flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'ALL', label: 'All Escalations', count: escalations.length },
              { id: 'TEACHING_LOAD', label: 'Teaching Loads', count: escalations.filter(e => e.relatedtype === 'TEACHING_LOAD').length },
              { id: 'LEAVE', label: 'Leaves', count: escalations.filter(e => e.relatedtype === 'LEAVE').length },
              { id: 'ENROLLMENT', label: 'Enrollments', count: escalations.filter(e => e.relatedtype === 'ENROLLMENT').length },
              { id: 'REPORT', label: 'Daily Reports', count: escalations.filter(e => e.relatedtype === 'REPORT').length },
              { id: 'TICKET', label: 'Support Tickets', count: escalations.filter(e => e.relatedtype === 'TICKET').length }
            ].map(t => {
              const active = typeFilter === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTypeFilter(t.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-[2px] text-xs font-bold transition-all ${
                    active 
                      ? 'bg-primary text-white shadow-none' 
                      : 'text-text-secondary hover:bg-surface-hover'
                  }`}
                >
                  {t.label}
                  {t.count > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-[2px] text-[9px] font-semibold ${
                      active ? 'bg-primary-hover text-white' : 'bg-background text-text-secondary'
                    }`}>
                      {t.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search escalations..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface-hover hover:bg-background/70 focus:bg-surface rounded-[2px] text-xs border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-rose-500 transition-all outline-none"
            />
          </div>
        </div>

        {/* Content Table */}
        {loading ? (
          <div className="flex justify-center items-center h-[40vh] bg-surface rounded-[2px] border border-border shadow-none">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-10 h-10 animate-spin text-rose-500" />
              <p className="text-text-secondary font-medium text-xs">Syncing real-time escalations backlog...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-error-bg text-error-text p-6 rounded-[2px] flex items-center gap-3 border border-red-100">
            <ShieldAlert className="w-6 h-6" />
            <div className="flex flex-col">
              <span className="font-bold">Error Accessing Queue</span>
              <span className="text-sm">{error}</span>
            </div>
          </div>
        ) : (
          <div className="bg-surface rounded-[2px] shadow-none border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-surface-hover text-text-secondary text-[10px] font-bold uppercase tracking-wider border-b border-border">
                    <th className="px-6 py-4">Request Type</th>
                    <th className="px-6 py-4">Request Details</th>
                    <th className="px-6 py-4">Owner / Requester</th>
                    <th className="px-6 py-4">Current Authority</th>
                    <th className="px-6 py-4">Days Overdue</th>
                    <th className="px-6 py-4">Escalation Level</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                  {filteredItems.length > 0 ? (
                    filteredItems.map(item => {
                      const typeCfg = getRequestTypeDetails(item.relatedtype);
                      const Icon = typeCfg.icon;
                      
                      return (
                        <tr key={item.escalationid} className="hover:bg-surface-hover/30 transition-colors">
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-[2px] text-xs font-bold border ${typeCfg.bg}`}>
                              <Icon className="w-3.5 h-3.5" />
                              {typeCfg.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 max-w-[300px]">
                            <p className="text-text-primary text-xs font-medium leading-relaxed truncate" title={getEscalationSummary(item)}>
                              {getEscalationSummary(item)}
                            </p>
                            <span className="text-[10px] text-text-muted font-mono mt-0.5 block">
                              Created: {new Date(item.createdat).toLocaleString()}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-[2px] bg-background text-text-secondary flex items-center justify-center font-bold text-xs">
                                {item.owner[0]?.toUpperCase()}
                              </div>
                              <span className="font-semibold text-text-primary text-xs">{item.owner}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-semibold text-text-primary text-xs">
                            {item.currentAuthority}
                          </td>
                          <td className="px-6 py-4">
                            {getOverdueDaysBadge(item.daysOverdue)}
                          </td>
                          <td className="px-6 py-4">
                            {getLevelBadge(item.escalationLevel)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedEscalation(item);
                                setOverrideAction('APPROVE');
                                setOverrideComment('');
                              }}
                              className="px-4 py-2 bg-error-bg hover:bg-error-bg text-error-text hover:text-error-text text-xs font-bold rounded-[2px] transition-all"
                            >
                              Intervene / Override
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center py-20 text-text-muted italic">
                        <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3 opacity-55" />
                        No escalated or overdue items found. System is running smoothly!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Override Modal */}
        <Modal
          isOpen={!!selectedEscalation}
          onClose={() => setSelectedEscalation(null)}
          title="Admin Absolute Workflow Override"
        >
          {selectedEscalation && (
            <div className="space-y-4 p-2">
              <div className="bg-error-bg text-rose-750 p-4 rounded-[2px] border border-border flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-error-text shrink-0 mt-0.5" />
                <div className="text-xs">
                  <strong className="block mb-0.5">ADMIN OVERRIDE CONSOLE</strong>
                  You are utilizing administrator credentials to forcefully override a workflow process. This will bypass normal approvals, resolve the escalation backlog, and record this intervention in the audit trail.
                </div>
              </div>

              <div className="bg-surface-hover p-4 rounded-[2px] border border-border divide-y divide-slate-100 text-xs space-y-2.5">
                <div className="flex justify-between pt-1">
                  <span className="text-text-muted font-bold uppercase">Item Type</span>
                  <span className="font-semibold text-text-primary">{selectedEscalation.relatedtype}</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-text-muted font-bold uppercase">Owner</span>
                  <span className="font-semibold text-text-primary">{selectedEscalation.owner}</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-text-muted font-bold uppercase">Days Overdue</span>
                  <span className="font-bold text-error-text">{selectedEscalation.daysOverdue} days</span>
                </div>
                <div className="pt-2">
                  <span className="text-text-muted font-bold uppercase block mb-1">Details Context</span>
                  <p className="text-text-secondary italic">"{getEscalationSummary(selectedEscalation)}"</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-text-secondary uppercase">Override Action Decision</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setOverrideAction('APPROVE')}
                    className={`flex-1 py-3 rounded-[2px] text-xs font-bold transition-all ${
                      overrideAction === 'APPROVE' 
                        ? 'bg-emerald-600 text-white shadow-none shadow-emerald-100' 
                        : 'bg-background text-slate-650 hover:bg-slate-200'
                    }`}
                  >
                    Force Approve / Resolve
                  </button>
                  <button
                    type="button"
                    onClick={() => setOverrideAction('REJECT')}
                    className={`flex-1 py-3 rounded-[2px] text-xs font-bold transition-all ${
                      overrideAction === 'REJECT' 
                        ? 'bg-rose-600 text-white shadow-none shadow-rose-100' 
                        : 'bg-background text-slate-650 hover:bg-slate-200'
                    }`}
                  >
                    Force Reject / Close
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-text-secondary uppercase">Justification Comment</label>
                <textarea
                  placeholder="Provide comments/justifications for this absolute override..."
                  value={overrideComment}
                  onChange={e => setOverrideComment(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-surface-hover border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-rose-500 rounded-[2px] text-sm outline-none transition-all"
                  required
                />
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedEscalation(null)}
                  className="px-4 py-2.5 border border-border hover:bg-surface-hover rounded-[2px] text-xs font-bold text-text-secondary transition-all"
                >
                  Abort Action
                </button>
                <button
                  type="button"
                  disabled={isSubmitting || !overrideComment.trim()}
                  onClick={handleOverrideSubmit}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white rounded-[2px] text-xs font-bold transition-all flex items-center gap-1.5 shadow-none shadow-rose-100"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Enforcing...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" /> Enforce Override
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </Modal>

      </div>
    </DashboardLayout>
  );
}
