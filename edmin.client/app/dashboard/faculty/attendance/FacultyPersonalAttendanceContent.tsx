'use client';

import React, { useState, useEffect } from 'react';
import { apiGet, apiPost } from '@/api/apiContract';
import { toast } from 'react-hot-toast';
import { 
  Calendar, Clock, LogIn, LogOut, FileText, 
  AlertCircle, CheckCircle2, ShieldAlert, 
  Send, RefreshCw, Filter, Search, PlusCircle
} from 'lucide-react';
import Modal from '@/components/Modal';

export default function FacultyPersonalAttendanceContent() {
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [corrections, setCorrections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Modal State
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [selectedLogForCorrection, setSelectedLogForCorrection] = useState<any>(null);
  const [correctionForm, setCorrectionForm] = useState({
    requestedCheckIn: '',
    requestedCheckOut: '',
    reason: '',
  });
  const [submittingCorrection, setSubmittingCorrection] = useState(false);

  const fetchPersonalAttendance = async () => {
    setLoading(true);
    try {
      const [todayRes, logsRes, statsRes, corrRes] = await Promise.allSettled([
        apiGet<any>('/faculty-attendance/today'),
        apiGet<any[]>('/faculty-attendance?limit=100'),
        apiGet<any>('/faculty-attendance/stats'),
        apiGet<any[]>('/faculty-attendance/corrections'),
      ]);

      if (todayRes.status === 'fulfilled') setTodayRecord(todayRes.value);
      if (logsRes.status === 'fulfilled') {
        const val = logsRes.value;
        setLogs(Array.isArray(val) ? val : (val as any)?.data ?? []);
      }
      if (statsRes.status === 'fulfilled') setStats(statsRes.value || {});
      if (corrRes.status === 'fulfilled') {
        const val = corrRes.value;
        setCorrections(Array.isArray(val) ? val : (val as any)?.data ?? []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load personal attendance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPersonalAttendance();
  }, []);

  const handleOpenCorrection = (logRecord?: any) => {
    if (logRecord) {
      setSelectedLogForCorrection(logRecord);
      const dateStr = logRecord.date || new Date().toISOString().split('T')[0];
      setCorrectionForm({
        requestedCheckIn: logRecord.checkInTime ? new Date(logRecord.checkInTime).toTimeString().slice(0, 5) : '09:00',
        requestedCheckOut: logRecord.checkOutTime ? new Date(logRecord.checkOutTime).toTimeString().slice(0, 5) : '17:00',
        reason: '',
      });
    } else {
      setSelectedLogForCorrection(null);
      setCorrectionForm({
        requestedCheckIn: '09:00',
        requestedCheckOut: '17:00',
        reason: '',
      });
    }
    setIsCorrectionModalOpen(true);
  };

  const handleSubmitCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionForm.reason.trim()) {
      toast.error('Please provide a reason for the correction request');
      return;
    }

    setSubmittingCorrection(true);
    try {
      const targetDate = selectedLogForCorrection?.date || new Date().toISOString().split('T')[0];
      const checkInIso = `${targetDate}T${correctionForm.requestedCheckIn}:00.000Z`;
      const checkOutIso = `${targetDate}T${correctionForm.requestedCheckOut}:00.000Z`;

      await apiPost('/faculty-attendance/correction-request', {
        attendanceId: selectedLogForCorrection?.id,
        requestedCheckIn: checkInIso,
        requestedCheckOut: checkOutIso,
        reason: correctionForm.reason,
      });

      toast.success('Correction request submitted successfully!');
      setIsCorrectionModalOpen(false);
      fetchPersonalAttendance();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit correction request');
    } finally {
      setSubmittingCorrection(false);
    }
  };

  const statusColors: Record<string, string> = {
    PRESENT: 'bg-emerald-100 text-emerald-700',
    Present: 'bg-emerald-100 text-emerald-700',
    'Currently Working': 'bg-blue-100 text-blue-700',
    LATE: 'bg-amber-100 text-amber-700',
    'Late Arrival': 'bg-amber-100 text-amber-700',
    'Forgot Check Out': 'bg-rose-100 text-rose-700',
    'Auto Checked Out': 'bg-slate-100 text-slate-600',
    'Early Departure': 'bg-purple-100 text-purple-700',
    ABSENT: 'bg-red-100 text-red-700',
  };

  const filteredLogs = logs.filter((log: any) => {
    const matchesStatus = !filterStatus || log.status === filterStatus;
    const matchesDate = !filterDate || (log.date ?? '').startsWith(filterDate);
    return matchesStatus && matchesDate;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Bar Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-text-primary">My Work Check-In & Attendance</h2>
          <p className="text-xs text-text-secondary">View your RFID card check-in times, working hours, and correction requests.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchPersonalAttendance}
            className="flex items-center gap-1.5 px-3 py-2 bg-surface hover:bg-surface-hover border border-border text-text-secondary rounded-[2px] text-xs font-bold transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <button
            onClick={() => handleOpenCorrection()}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-[2px] text-xs font-bold transition-all shadow-none"
          >
            <PlusCircle className="w-4 h-4" /> Request Correction
          </button>
        </div>
      </div>

      {/* Today's Status Widget */}
      <div className="bg-surface rounded-[2.5rem] border border-border p-6 shadow-none flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary-light text-primary flex items-center justify-center font-bold text-xl">
            <Clock className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Today's Attendance</span>
              <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${statusColors[todayRecord?.status] ?? 'bg-slate-100 text-slate-600'}`}>
                {todayRecord?.status ? todayRecord.status.replace(/_/g, ' ') : 'Not Checked In Yet'}
              </span>
            </div>
            <p className="text-lg font-bold text-text-primary mt-1">
              {todayRecord?.checkintime 
                ? `Checked in at ${new Date(todayRecord.checkintime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` 
                : 'No RFID tap recorded today'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 border-t lg:border-t-0 lg:border-l border-border pt-4 lg:pt-0 lg:pl-6 text-xs">
          <div>
            <span className="text-text-muted text-[10px] font-bold uppercase block mb-1">Check-In</span>
            <span className="font-semibold text-emerald-700 flex items-center gap-1">
              <LogIn className="w-3.5 h-3.5" />
              {todayRecord?.checkintime ? new Date(todayRecord.checkintime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
            </span>
          </div>
          <div>
            <span className="text-text-muted text-[10px] font-bold uppercase block mb-1">Check-Out</span>
            <span className="font-semibold text-rose-600 flex items-center gap-1">
              <LogOut className="w-3.5 h-3.5" />
              {todayRecord?.checkouttime ? new Date(todayRecord.checkouttime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
            </span>
          </div>
          <div>
            <span className="text-text-muted text-[10px] font-bold uppercase block mb-1">Hours Worked</span>
            <span className="font-bold text-text-primary">
              {todayRecord?.workinghours ? `${todayRecord.workinghours.toFixed(1)} hrs` : '0 hrs'}
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface p-5 rounded-[2px] border border-border flex flex-col gap-1">
          <span className="text-text-muted text-[10px] font-bold uppercase tracking-wider">Days Present</span>
          <span className="text-2xl font-semibold text-success-text">{stats.facultyPresent ?? logs.length}</span>
          <span className="text-[10px] text-text-muted">this period</span>
        </div>
        <div className="bg-surface p-5 rounded-[2px] border border-border flex flex-col gap-1">
          <span className="text-text-muted text-[10px] font-bold uppercase tracking-wider">Late Arrivals</span>
          <span className="text-2xl font-semibold text-warning-text">{stats.lateArrivals ?? 0}</span>
          <span className="text-[10px] text-text-muted">past grace period</span>
        </div>
        <div className="bg-surface p-5 rounded-[2px] border border-border flex flex-col gap-1">
          <span className="text-text-muted text-[10px] font-bold uppercase tracking-wider">Forgot Check Out</span>
          <span className="text-2xl font-semibold text-error-text">{stats.missingCheckOut ?? 0}</span>
          <span className="text-[10px] text-text-muted">missed tap out</span>
        </div>
        <div className="bg-surface p-5 rounded-[2px] border border-border flex flex-col gap-1">
          <span className="text-text-muted text-[10px] font-bold uppercase tracking-wider">Pending Corrections</span>
          <span className="text-2xl font-semibold text-primary">{corrections.filter((c: any) => c.status === 'PENDING').length}</span>
          <span className="text-[10px] text-text-muted">awaiting review</span>
        </div>
      </div>

      {/* Main Grid: Attendance History + Correction Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* History Table (2 cols) */}
        <div className="lg:col-span-2 bg-surface rounded-[2.5rem] border border-border overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-50 flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-bold text-text-primary text-base">My Attendance History</h3>
            
            {/* Filters */}
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={filterDate}
                onChange={e => setFilterDate(e.target.value)}
                className="px-3 py-1.5 text-xs bg-surface-hover border border-border rounded-[2px] text-text-secondary outline-none"
              />
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="px-3 py-1.5 text-xs bg-surface-hover border border-border rounded-[2px] text-text-secondary outline-none"
              >
                <option value="">All Statuses</option>
                <option value="Present">Present</option>
                <option value="Late Arrival">Late Arrival</option>
                <option value="Early Departure">Early Departure</option>
                <option value="Forgot Check Out">Forgot Check Out</option>
                <option value="Auto Checked Out">Auto Checked Out</option>
                <option value="Manual Entry">Manual Entry</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-background/50 border-b border-border uppercase font-bold text-[10px] text-text-secondary tracking-wider">
                <tr>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Check-In</th>
                  <th className="px-5 py-3">Check-Out</th>
                  <th className="px-5 py-3">Duration</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredLogs.map((log: any) => {
                  const badgeClass = statusColors[log.status] ?? 'bg-slate-100 text-slate-600';
                  const checkIn = log.checkInTime ? new Date(log.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
                  const checkOut = log.checkouttime || log.checkOutTime ? new Date(log.checkouttime || log.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
                  const duration = log.workingHours ? `${log.workingHours.toFixed(1)}h` : '—';

                  return (
                    <tr key={log.id ?? log.facultyattendanceid} className="hover:bg-surface-hover/50 transition-colors">
                      <td className="px-5 py-3.5 font-semibold text-text-primary">{log.date || new Date(log.attendancedate).toLocaleDateString()}</td>
                      <td className="px-5 py-3.5 text-emerald-700 font-mono flex items-center gap-1">
                        <LogIn className="w-3 h-3" /> {checkIn}
                      </td>
                      <td className="px-5 py-3.5 text-rose-600 font-mono">
                        <div className="flex items-center gap-1">
                          <LogOut className="w-3 h-3" /> {checkOut}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-text-secondary">{duration}</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${badgeClass}`}>
                          {log.status?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => handleOpenCorrection(log)}
                          className="px-2.5 py-1 text-[10px] font-bold bg-primary-light text-primary hover:bg-indigo-100 rounded-[2px] transition-all"
                        >
                          Request Correction
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-text-muted italic text-sm">
                      No personal attendance logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Correction Requests Drawer / Card (1 col) */}
        <div className="bg-surface rounded-[2.5rem] border border-border overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-text-primary text-base">My Correction Requests</h3>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-primary-light text-primary rounded-full">
              {corrections.length} total
            </span>
          </div>

          <div className="divide-y divide-slate-50 overflow-y-auto max-h-[450px] p-2">
            {corrections.map((c: any) => (
              <div key={c.correctionrequestid || c.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-primary">
                    {c.requestedcheckin ? new Date(c.requestedcheckin).toLocaleDateString() : 'Correction Request'}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    c.status === 'PENDING' ? 'bg-amber-100 text-amber-700'
                    : c.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-rose-100 text-rose-700'
                  }`}>
                    {c.status}
                  </span>
                </div>
                <p className="text-xs text-text-secondary">{c.reason}</p>
                <div className="text-[10px] text-text-muted flex gap-3">
                  <span>Req In: {c.requestedcheckin ? new Date(c.requestedcheckin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</span>
                  <span>Req Out: {c.requestedcheckout ? new Date(c.requestedcheckout).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</span>
                </div>
                {c.comments && (
                  <p className="text-[10px] italic text-indigo-700 bg-primary-light/50 p-2 rounded">
                    Review Note: {c.comments}
                  </p>
                )}
              </div>
            ))}

            {corrections.length === 0 && (
              <div className="text-center py-12 text-text-muted italic text-sm">
                No correction requests submitted yet.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* CORRECTION REQUEST MODAL */}
      <Modal
        isOpen={isCorrectionModalOpen}
        onClose={() => setIsCorrectionModalOpen(false)}
        title="Request Attendance Correction"
      >
        <form onSubmit={handleSubmitCorrection} className="space-y-4 p-2">
          <p className="text-xs text-text-muted">
            Submit a correction request for missing or incorrect RFID check-in/out logs. Your request will be reviewed by your Supervisor/Admin.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">Requested Check-In Time</label>
              <input
                type="time"
                value={correctionForm.requestedCheckIn}
                onChange={e => setCorrectionForm(f => ({ ...f, requestedCheckIn: e.target.value }))}
                className="w-full px-3 py-2 text-xs bg-surface-hover ring-1 ring-slate-200 rounded-[2px] border-none outline-none focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">Requested Check-Out Time</label>
              <input
                type="time"
                value={correctionForm.requestedCheckOut}
                onChange={e => setCorrectionForm(f => ({ ...f, requestedCheckOut: e.target.value }))}
                className="w-full px-3 py-2 text-xs bg-surface-hover ring-1 ring-slate-200 rounded-[2px] border-none outline-none focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">Justification Reason</label>
            <textarea
              rows={3}
              value={correctionForm.reason}
              onChange={e => setCorrectionForm(f => ({ ...f, reason: e.target.value }))}
              placeholder="e.g. RFID scanner was unresponsive at gate; verified by security desk."
              className="w-full px-3 py-2 text-xs bg-surface-hover ring-1 ring-slate-200 rounded-[2px] border-none outline-none focus:ring-indigo-500 resize-none"
              required
            />
          </div>

          <div className="flex gap-2 justify-end pt-3">
            <button
              type="button"
              onClick={() => setIsCorrectionModalOpen(false)}
              className="px-4 py-2 border border-border hover:bg-surface-hover rounded-[2px] text-xs font-bold text-text-secondary transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingCorrection}
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-[2px] text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              {submittingCorrection ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
