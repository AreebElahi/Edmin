'use client';

import React, { useState, useEffect } from 'react';
import { apiGet, apiPatch, apiPost, apiPut } from '@/api/apiContract';
import { toast } from 'react-hot-toast';
import { 
  Users, BookOpen, FileCheck, ClipboardList, 
  CalendarCheck, BarChart3, Clock, Search, 
  UserCheck, AlertTriangle, ShieldAlert, CheckCircle2, 
  XCircle, Filter, Edit3, ArrowRight, Loader2,
  Calendar, FileText, ChevronRight, Briefcase
} from 'lucide-react';
import Modal from '@/components/Modal';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminTabBar from '@/components/admin/AdminTabBar';
import AdminFilterBar from '@/components/admin/AdminFilterBar';
import AdminStatusBadge from '@/components/admin/AdminStatusBadge';
import AdminPageWrapper from "@/components/admin/AdminPageWrapper";

interface FacultyManagementContentProps {
  activeTab: 'directory' | 'teaching-loads' | 'leaves' | 'activity-reports' | 'attendance' | 'workload' | 'history';
}

export default function FacultyManagementContent({ activeTab: initialTab }: FacultyManagementContentProps) {
  const [tab, setTab] = useState(initialTab);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Data States
  const [directory, setDirectory] = useState<any[]>([]);
  const [teachingLoads, setTeachingLoads] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [activities, setActivities] = useState<any>({ metrics: {}, reports: [] });
  const [attendance, setAttendance] = useState<any>({ sessionsCreated: [], missingSessions: [], editedSessions: [], auditLogs: [] });
  const [workload, setWorkload] = useState<any>({ facultyCredits: [], overloadedFaculty: [], underutilizedFaculty: [], coursesByDepartment: [], metrics: {} });
  
  // History States
  const [selectedFacultyId, setSelectedFacultyId] = useState<number | null>(null);
  const [facultyHistory, setFacultyHistory] = useState<any>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Loading & Error States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal States
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  
  // Input fields for modals
  const [overrideAction, setOverrideAction] = useState<'APPROVE' | 'REJECT' | 'ARCHIVE'>('APPROVE');
  const [overrideComment, setOverrideComment] = useState('');
  const [availableOfferings, setAvailableOfferings] = useState<any[]>([]);
  const [selectedOfferingIds, setSelectedOfferingIds] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch functions
  const fetchDirectory = async () => {
    try {
      const res = await apiGet<any[]>('/admin/faculty/directory');
      setDirectory(res || []);
    } catch (err: any) {
      toast.error('Failed to load faculty directory');
    }
  };

  const fetchTeachingLoads = async () => {
    try {
      const res = await apiGet<any[]>('/admin/faculty/teaching-loads');
      setTeachingLoads(res || []);
    } catch (err: any) {
      toast.error('Failed to load teaching loads');
    }
  };

  const fetchLeaves = async () => {
    try {
      const res = await apiGet<any[]>('/admin/faculty/leaves');
      setLeaves(res || []);
    } catch (err: any) {
      toast.error('Failed to load leaves oversight');
    }
  };

  const fetchActivities = async () => {
    try {
      const res = await apiGet<any>('/admin/faculty/activity-reports');
      setActivities(res || { metrics: {}, reports: [] });
    } catch (err: any) {
      toast.error('Failed to load daily activity reports');
    }
  };

  const fetchAttendance = async () => {
    try {
      const res = await apiGet<any>('/admin/faculty/attendance-audit');
      setAttendance(res || { sessionsCreated: [], missingSessions: [], editedSessions: [], auditLogs: [] });
    } catch (err: any) {
      toast.error('Failed to load attendance audits');
    }
  };

  const fetchWorkload = async () => {
    try {
      const res = await apiGet<any>('/admin/faculty/workload-analytics');
      setWorkload(res || { facultyCredits: [], overloadedFaculty: [], underutilizedFaculty: [], coursesByDepartment: [] });
    } catch (err: any) {
      toast.error('Failed to load workload analytics');
    }
  };

  const fetchFacultyHistory = async (fid: number) => {
    setHistoryLoading(true);
    try {
      const res = await apiGet<any>(`/admin/faculty/history/${fid}`);
      setFacultyHistory(res);
    } catch (err: any) {
      toast.error('Failed to load faculty history timeline');
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchActiveOfferings = async () => {
    try {
      const res = await apiGet<any[]>('/admin/timetable/offerings');
      setAvailableOfferings(res || []);
    } catch (err: any) {
      console.error(err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (tab === 'directory') await fetchDirectory();
      else if (tab === 'teaching-loads') await fetchTeachingLoads();
      else if (tab === 'leaves') await fetchLeaves();
      else if (tab === 'activity-reports') await fetchActivities();
      else if (tab === 'attendance') await fetchAttendance();
      else if (tab === 'workload') await fetchWorkload();
      else if (tab === 'history') {
        await fetchDirectory(); // Fetch directory to select a user
        if (selectedFacultyId) {
          await fetchFacultyHistory(selectedFacultyId);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tab]);

  useEffect(() => {
    if (tab === 'history' && selectedFacultyId) {
      fetchFacultyHistory(selectedFacultyId);
    }
  }, [selectedFacultyId]);

  // Actions
  const handleEscalate = async (id: number) => {
    try {
      await apiPatch(`/admin/faculty/teaching-loads/${id}/escalate`);
      toast.success('Teaching load request manually escalated to priority override.');
      fetchTeachingLoads();
    } catch (err: any) {
      toast.error(err.message || 'Failed to escalate load request');
    }
  };

  const handleOverrideSubmit = async () => {
    if (!selectedItem) return;
    setIsSubmitting(true);
    try {
      if (tab === 'teaching-loads') {
        await apiPatch(`/admin/faculty/teaching-loads/${selectedItem.teachingloadid}/override`, {
          action: overrideAction === 'APPROVE' ? 'APPROVE' : 'REJECT',
          comment: overrideComment
        });
        toast.success('Teaching load status overridden successfully.');
        fetchTeachingLoads();
      } else if (tab === 'leaves') {
        await apiPatch(`/admin/faculty/leaves/${selectedItem.leaverequestid}/override`, {
          action: overrideAction,
          comment: overrideComment
        });
        toast.success('Leave request overridden successfully.');
        fetchLeaves();
      } else if (tab === 'activity-reports') {
        await apiPatch(`/admin/faculty/activity-reports/${selectedItem.dailyactivityreportid}/override`, {
          status: overrideAction === 'APPROVE' ? 'APPROVED' : overrideAction === 'REJECT' ? 'REJECTED' : 'ARCHIVED',
          comment: overrideComment
        });
        toast.success('Daily report status overridden successfully.');
        fetchActivities();
      }
      setIsOverrideModalOpen(false);
      setOverrideComment('');
      setSelectedItem(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to apply override');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReassignSubmit = async () => {
    if (!selectedItem) return;
    setIsSubmitting(true);
    try {
      await apiPatch(`/admin/faculty/teaching-loads/${selectedItem.teachingloadid}/reassign`, {
        courseOfferingIds: selectedOfferingIds
      });
      toast.success('Teaching load assignments reassigned.');
      fetchTeachingLoads();
      setIsReassignModalOpen(false);
      setSelectedItem(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to reassign courses');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleOfferingSelection = (id: number) => {
    if (selectedOfferingIds.includes(id)) {
      setSelectedOfferingIds(selectedOfferingIds.filter(item => item !== id));
    } else {
      setSelectedOfferingIds([...selectedOfferingIds, id]);
    }
  };

  // Helper labels
  const getStatusBadge = (status: string) => {
    let variant: 'success' | 'error' | 'warning' | 'primary' | 'default' = 'default';
    switch (status) {
      case 'APPROVED': case 'ACTIVE': variant = 'success'; break;
      case 'REJECTED': case 'CANCELLED': case 'SUSPENDED': variant = 'error'; break;
      case 'SUBMITTED': case 'PENDING': case 'UNDER_REVIEW': case 'PENDING_HR': variant = 'warning'; break;
    }
    return <AdminStatusBadge status={status} variant={variant} />;
  };

  const getHeaderProps = () => {
    switch(tab) {
      case 'directory': return { title: 'Faculty', titleAccent: 'Directory', subtitle: 'Manage institutional faculty profiles, supervisor hierarchies, and class schedules.', icon: Users };
      case 'teaching-loads': return { title: 'Teaching Loads', titleAccent: 'Oversight', subtitle: 'Audit credit distributions, process overrides, reassign courses, and manage semester teaching assignments.', icon: BookOpen };
      case 'leaves': return { title: 'Leave', titleAccent: 'Oversight', subtitle: 'Audit leaves approvals, review reviewer remarks, and override requests absolute decisions.', icon: FileCheck };
      case 'activity-reports': return { title: 'Daily Activity Reports', titleAccent: 'Monitoring', subtitle: 'Monitor department compliance rates, late submissions, and comment/override activity status.', icon: ClipboardList };
      case 'attendance': return { title: 'Faculty Attendance', titleAccent: 'Audit', subtitle: 'Audit class sessions created, missing schedules, edited attendance logs, and system audits.', icon: CalendarCheck };
      case 'workload': return { title: 'Workload', titleAccent: 'Analytics', subtitle: 'Monitor credit hour balances, underutilized/overloaded teachers, and department courses distribution.', icon: BarChart3 };
      case 'history': return { title: 'Faculty History &', titleAccent: 'Timelines', subtitle: 'Audit complete professional timeline histories including courses taught, leaves taken, reports, and attendance stats.', icon: Clock };
      default: return { title: 'Faculty', titleAccent: 'Management', subtitle: '', icon: Users };
    }
  };
  const headerProps = getHeaderProps();

  return (
    <div className="space-y-8">
      <AdminPageHeader {...headerProps} />

      {/* Header Tabs Navigation */}
      <AdminTabBar
        tabs={[
          { id: 'directory', label: 'Faculty Directory' },
          { id: 'teaching-loads', label: 'Teaching Loads' },
          { id: 'leaves', label: 'Leave Oversight' },
          { id: 'activity-reports', label: 'Activity Reports' },
          { id: 'attendance', label: 'Attendance Audit' },
          { id: 'workload', label: 'Workload Analytics' },
          { id: 'history', label: 'Faculty History' }
        ]}
        activeTab={tab}
        onTabChange={(id) => {
          setTab(id as any);
          setSearchTerm('');
        }}
      />

      {/* Global Tab Search Removed - Moved to individual tabs */}

      {loading ? (
        <div className="flex justify-center items-center h-[50vh] bg-surface rounded-[2px] border border-border shadow-none">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-text-secondary font-medium text-sm">Loading oversight dashboard data...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-error-bg text-error-text p-6 rounded-[2px] flex items-center gap-3 border border-red-100">
          <ShieldAlert className="w-6 h-6" />
          <div className="flex flex-col">
            <span className="font-bold">Error Loading Data</span>
            <span className="text-sm">{error}</span>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* TAB 1: FACULTY DIRECTORY */}
          {tab === 'directory' && (
            <div className="bg-surface rounded-[2.5rem] shadow-none border border-border overflow-hidden">
              <AdminFilterBar
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                searchPlaceholder="Search faculty..."
                filters={[]}
              />
              <div className="px-6 py-5 border-b border-slate-50 flex justify-between items-center">
                <h3 className="font-bold text-text-primary text-lg">Active Faculty Members</h3>
                <span className="text-xs font-bold text-text-secondary bg-surface-hover px-2.5 py-1 rounded-[2px] uppercase tracking-wider">
                  Total: {directory.length}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-surface-hover text-text-secondary text-xs font-bold uppercase tracking-wider border-b border-border">
                      <th className="px-6 py-4">Faculty Member</th>
                      <th className="px-6 py-4">Employee ID</th>
                      <th className="px-6 py-4">Department</th>
                      <th className="px-6 py-4">Supervisor / HOD</th>
                      <th className="px-6 py-4">Assigned Courses</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-sm">
                    {directory
                      .filter(f => f.fullname.toLowerCase().includes(searchTerm.toLowerCase()) || f.employeenumber.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map(fac => (
                        <tr key={fac.facultyid} className="hover:bg-surface-hover/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-[2px] bg-primary-light text-primary flex items-center justify-center font-bold text-sm">
                                {fac.fullname[0]}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-semibold text-text-primary">{fac.fullname}</span>
                                <span className="text-xs text-text-muted">{fac.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-text-secondary font-mono">{fac.employeenumber}</td>
                          <td className="px-6 py-4 text-text-secondary font-medium">{fac.department}</td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col text-xs text-text-secondary gap-0.5">
                              <span><strong className="text-text-secondary">Sup:</strong> {fac.supervisorName}</span>
                              <span><strong className="text-text-secondary">HOD:</strong> {fac.hodName}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1 max-w-[250px]">
                                {fac.assignedCourses.length > 0 ? (
                                  fac.assignedCourses.map((c: any) => (
                                    <span key={c.courseofferingid} className="px-2 py-0.5 bg-background text-text-secondary rounded text-[10px] font-bold border border-border">
                                      {c.code}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-xs text-text-muted italic">None assigned</span>
                                )}
                            </div>
                          </td>
                          <td className="px-6 py-4">{getStatusBadge(fac.accountStatus === 'APPROVED' ? 'ACTIVE' : fac.accountStatus)}</td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedFacultyId(fac.facultyid);
                                setTab('history');
                              }}
                              className="text-xs font-bold text-primary hover:text-indigo-800 flex items-center gap-1 ml-auto bg-primary-light/50 hover:bg-primary-light px-3 py-1.5 rounded-[2px] transition-all"
                            >
                              Audit Timeline <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: TEACHING LOADS */}
          {tab === 'teaching-loads' && (
            <div className="bg-surface rounded-[2.5rem] shadow-none border border-border overflow-hidden">
              <AdminFilterBar
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                searchPlaceholder="Search faculty..."
                filters={[]}
              />
              <div className="px-6 py-5 border-b border-slate-50 flex justify-between items-center">
                <h3 className="font-bold text-text-primary text-lg">Academic Teaching Loads</h3>
                <span className="text-xs font-bold text-text-secondary bg-surface-hover px-2.5 py-1 rounded-[2px] uppercase tracking-wider">
                  Total Requests: {teachingLoads.length}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-surface-hover text-text-secondary text-xs font-bold uppercase tracking-wider border-b border-border">
                      <th className="px-6 py-4">Faculty Member</th>
                      <th className="px-6 py-4">Semester</th>
                      <th className="px-6 py-4">Selected Courses</th>
                      <th className="px-6 py-4">Total Credits</th>
                      <th className="px-6 py-4">Approvals status</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions Override</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-sm">
                    {teachingLoads
                      .filter(tl => tl.facultyName.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map(tl => (
                        <tr key={tl.teachingloadid} className="hover:bg-surface-hover/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-semibold text-text-primary">{tl.facultyName}</span>
                              <span className="text-xs text-text-muted">{tl.department}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-text-secondary font-medium">{tl.semester}</td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1 text-xs text-text-secondary">
                              {tl.courses.map((c: any) => (
                                <span key={c.courseofferingid} className="font-mono">
                                  - {c.name} ({c.credits} cr)
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-[2px] text-xs font-bold ${
                              tl.totalCredits > 18 
                                ? 'bg-error-bg text-error-text' 
                                : tl.totalCredits < 12 
                                ? 'bg-warning-bg text-warning-text' 
                                : 'bg-background text-text-primary'
                            }`}>
                              {tl.totalCredits} credits
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col text-xs text-text-secondary gap-1">
                              {tl.approvals.length > 0 ? (
                                tl.approvals.map((app: any, idx: number) => (
                                  <span key={idx} className="flex items-center gap-1">
                                    <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                                    <span>{app.approver}: {app.action}</span>
                                  </span>
                                ))
                              ) : (
                                <span className="text-text-muted italic">No reviewers yet</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">{getStatusBadge(tl.status)}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {tl.status === 'PENDING' && (
                                <button
                                  onClick={() => handleEscalate(tl.teachingloadid)}
                                  className="px-2.5 py-1.5 bg-warning-bg hover:bg-warning-bg text-warning-text rounded-[2px] text-xs font-bold transition-all"
                                  title="Force Escalate request to admin queue"
                                >
                                  Escalate
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setSelectedItem(tl);
                                  setOverrideAction('APPROVE');
                                  setIsOverrideModalOpen(true);
                                }}
                                className="px-2.5 py-1.5 bg-primary-light hover:bg-indigo-100 text-primary rounded-[2px] text-xs font-bold transition-all"
                              >
                                Override
                              </button>
                              <button
                                onClick={async () => {
                                  setSelectedItem(tl);
                                  await fetchActiveOfferings();
                                  setSelectedOfferingIds(tl.courses.map((c: any) => c.courseofferingid));
                                  setIsReassignModalOpen(true);
                                }}
                                className="px-2.5 py-1.5 bg-surface-hover hover:bg-background text-text-secondary rounded-[2px] text-xs font-bold transition-all"
                              >
                                Reassign
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

          {/* TAB 3: LEAVE OVERSIGHT */}
          {tab === 'leaves' && (
            <div className="bg-surface rounded-[2.5rem] shadow-none border border-border overflow-hidden">
              <AdminFilterBar
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                searchPlaceholder="Search faculty..."
                filters={[]}
              />
              <div className="px-6 py-5 border-b border-slate-50 flex justify-between items-center">
                <h3 className="font-bold text-text-primary text-lg">Leave Oversight (Admin Audit)</h3>
                <span className="text-xs font-bold text-text-secondary bg-surface-hover px-2.5 py-1 rounded-[2px] uppercase tracking-wider">
                  Total Leaves: {leaves.length}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-surface-hover text-text-secondary text-xs font-bold uppercase tracking-wider border-b border-border">
                      <th className="px-6 py-4">Faculty Member</th>
                      <th className="px-6 py-4">Department</th>
                      <th className="px-6 py-4">Leave Type</th>
                      <th className="px-6 py-4">Dates</th>
                      <th className="px-6 py-4">Status & Decision</th>
                      <th className="px-6 py-4">Comments Logs</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-sm">
                    {leaves
                      .filter(l => l.facultyName.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map(l => (
                        <tr key={l.leaverequestid} className="hover:bg-surface-hover/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-semibold text-text-primary">{l.facultyName}</span>
                              <span className="text-xs text-text-muted">{l.employeenumber}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-text-secondary font-medium">{l.department}</td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 bg-background text-text-secondary rounded-[2px] text-xs font-bold">
                              {l.leavetype}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-text-secondary">
                            <div>From: {new Date(l.startdate).toLocaleDateString()}</div>
                            <div>To: {new Date(l.enddate).toLocaleDateString()}</div>
                          </td>
                          <td className="px-6 py-4">{getStatusBadge(l.status)}</td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1 text-xs text-text-secondary max-w-[280px]">
                              {l.comments.length > 0 ? (
                                l.comments.map((c: any, idx: number) => (
                                  <span key={idx} className="block bg-surface-hover p-1.5 rounded">
                                    <strong className="text-text-secondary">{c.commenter}:</strong> {c.comment}
                                  </span>
                                ))
                              ) : (
                                <span className="text-text-muted italic">No comments</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedItem(l);
                                setOverrideAction('APPROVE');
                                setIsOverrideModalOpen(true);
                              }}
                              className="px-2.5 py-1.5 bg-primary-light hover:bg-indigo-100 text-primary rounded-[2px] text-xs font-bold transition-all"
                            >
                              Override Status
                            </button>
                          </td>
                        </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: DAILY ACTIVITY REPORTS */}
          {tab === 'activity-reports' && (
            <div className="space-y-6">
              {/* Metrics Header */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-surface p-5 rounded-[2px] border border-border shadow-none flex flex-col gap-1">
                  <span className="text-text-muted text-xs font-bold uppercase tracking-wider">Submitted Today</span>
                  <span className="text-2xl font-semibold text-text-primary">{activities.metrics.reportsSubmittedToday}</span>
                </div>
                <div className="bg-surface p-5 rounded-[2px] border border-border shadow-none flex flex-col gap-1">
                  <span className="text-text-muted text-xs font-bold uppercase tracking-wider">Missing Today</span>
                  <span className="text-2xl font-semibold text-error-text">{activities.metrics.missingReportsToday}</span>
                </div>
                <div className="bg-surface p-5 rounded-[2px] border border-border shadow-none flex flex-col gap-1">
                  <span className="text-text-muted text-xs font-bold uppercase tracking-wider">Compliance Rate</span>
                  <span className="text-2xl font-semibold text-primary">{activities.metrics.complianceRatePercentage}%</span>
                </div>
                <div className="bg-surface p-5 rounded-[2px] border border-border shadow-none flex flex-col gap-1">
                  <span className="text-text-muted text-xs font-bold uppercase tracking-wider">Late Submissions</span>
                  <span className="text-2xl font-semibold text-warning-text">{activities.metrics.lateSubmissionsCount}</span>
                </div>
                <div className="bg-surface p-5 rounded-[2px] border border-border shadow-none flex flex-col gap-1">
                  <span className="text-text-muted text-xs font-bold uppercase tracking-wider">Escalated Reports</span>
                  <span className="text-2xl font-semibold text-error-text">{activities.metrics.escalatedReportsCount}</span>
                </div>
              </div>

              {/* Reports Table */}
              <div className="bg-surface rounded-[2.5rem] shadow-none border border-border overflow-hidden">
                <AdminFilterBar
                  searchValue={searchTerm}
                  onSearchChange={setSearchTerm}
                  searchPlaceholder="Search faculty..."
                  filters={[]}
                />
                <div className="px-6 py-5 border-b border-slate-50">
                  <h3 className="font-bold text-text-primary text-lg">Daily Activity Log</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-surface-hover text-text-secondary text-xs font-bold uppercase tracking-wider border-b border-border">
                        <th className="px-6 py-4">Faculty</th>
                        <th className="px-6 py-4">Department</th>
                        <th className="px-6 py-4">Report Date</th>
                        <th className="px-6 py-4">Summary</th>
                        <th className="px-6 py-4">Detailed Activities</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-sm">
                      {activities.reports
                        .filter((r: any) => r.facultyName.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map((r: any) => (
                          <tr key={r.dailyactivityreportid} className="hover:bg-surface-hover/50 transition-colors">
                            <td className="px-6 py-4 font-semibold text-text-primary">{r.facultyName}</td>
                            <td className="px-6 py-4 text-text-secondary">{r.department}</td>
                            <td className="px-6 py-4 text-text-secondary">{new Date(r.reportdate).toLocaleDateString()}</td>
                            <td className="px-6 py-4 text-text-secondary italic text-xs max-w-[200px] truncate" title={r.summary}>
                              {r.summary}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col gap-0.5 text-xs text-text-secondary max-w-[250px]">
                                {r.activities.length > 0 ? (
                                  r.activities.map((act: any, idx: number) => (
                                    <span key={idx}>- <strong>{act.title}</strong>: {act.detail}</span>
                                  ))
                                ) : (
                                  <span className="text-text-muted italic">No sub-activities</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">{getStatusBadge(r.status)}</td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => {
                                  setSelectedItem(r);
                                  setOverrideAction('APPROVE');
                                  setIsOverrideModalOpen(true);
                                }}
                                className="px-2.5 py-1.5 bg-primary-light hover:bg-indigo-100 text-primary rounded-[2px] text-xs font-bold transition-all"
                              >
                                Comment / Override
                              </button>
                            </td>
                          </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ATTENDANCE AUDIT */}
          {tab === 'attendance' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Missing Sessions */}
              <div className="bg-surface rounded-[2.5rem] shadow-none border border-border overflow-hidden flex flex-col">
                <div className="px-6 py-5 border-b border-slate-50 bg-error-bg/30 flex justify-between items-center">
                  <h3 className="font-bold text-rose-900 text-base flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-rose-500" />
                    Missing Attendance Sessions ({attendance.missingSessions.length})
                  </h3>
                </div>
                <div className="overflow-y-auto max-h-[400px] divide-y divide-slate-50 p-4">
                  {attendance.missingSessions.length > 0 ? (
                    attendance.missingSessions.map((s: any) => (
                      <div key={s.classsessionid} className="py-3 flex justify-between items-start gap-4">
                        <div>
                          <h4 className="font-bold text-text-primary text-sm">{s.courseName} ({s.courseCode})</h4>
                          <p className="text-text-secondary text-xs">Instructor: {s.facultyName}</p>
                          <p className="text-text-muted text-xs">Scheduled: {new Date(s.date).toLocaleDateString()}</p>
                        </div>
                        <span className="px-2 py-1 bg-error-bg text-error-text text-[10px] font-bold rounded">
                          No Attendance Marked
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-text-muted text-sm py-10 italic">
                      All scheduled sessions have active attendance logs.
                    </div>
                  )}
                </div>
              </div>

              {/* Edited Sessions / Audit Logs */}
              <div className="bg-surface rounded-[2.5rem] shadow-none border border-border overflow-hidden flex flex-col">
                <div className="px-6 py-5 border-b border-slate-50 bg-primary-light/30 flex justify-between items-center">
                  <h3 className="font-bold text-indigo-900 text-base flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-indigo-500" />
                    Attendance Audit Logs (Edits)
                  </h3>
                </div>
                <div className="overflow-y-auto max-h-[400px] divide-y divide-slate-50 p-4">
                  {attendance.editedSessions.length > 0 ? (
                    attendance.editedSessions.map((log: any) => (
                      <div key={log.auditLogId} className="py-3 flex flex-col gap-1">
                        <div className="flex justify-between text-xs text-text-muted">
                          <span>{new Date(log.timestamp).toLocaleString()}</span>
                          <span className="font-semibold text-text-secondary">Editor: {log.editorName}</span>
                        </div>
                        <p className="text-sm font-semibold text-slate-850">
                          Edited student <strong className="text-primary">{log.studentName}</strong> attendance in <strong>{log.courseName}</strong>.
                        </p>
                        <div className="flex gap-2 items-center text-xs mt-1">
                          <span className="px-2 py-0.5 bg-background text-text-secondary rounded font-bold font-mono">{log.oldStatus}</span>
                          <span className="text-text-muted">➔</span>
                          <span className="px-2 py-0.5 bg-background text-success-text rounded font-bold font-mono">{log.newStatus}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-text-muted text-sm py-10 italic">
                      No attendance audits or edits logged.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: WORKLOAD ANALYTICS */}
          {tab === 'workload' && (
            <div className="space-y-6">
              
              {/* Faculty Analytics Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-surface p-5 rounded-[2px] border border-border shadow-none flex flex-col gap-1">
                  <span className="text-text-muted text-xs font-bold uppercase tracking-wider text-[10px]">Total Faculty</span>
                  <span className="text-2xl font-semibold text-text-primary">{workload.metrics?.totalFaculty ?? 0}</span>
                </div>
                <div className="bg-surface p-5 rounded-[2px] border border-border shadow-none flex flex-col gap-1">
                  <span className="text-text-muted text-xs font-bold uppercase tracking-wider text-[10px]">Active Faculty</span>
                  <span className="text-2xl font-semibold text-success-text">{workload.metrics?.activeFaculty ?? 0}</span>
                </div>
                <div className="bg-surface p-5 rounded-[2px] border border-border shadow-none flex flex-col gap-1">
                  <span className="text-text-muted text-xs font-bold uppercase tracking-wider text-[10px]">Pending Loads</span>
                  <span className="text-2xl font-semibold text-warning-text">{workload.metrics?.pendingTeachingLoads ?? 0}</span>
                </div>
                <div className="bg-surface p-5 rounded-[2px] border border-border shadow-none flex flex-col gap-1">
                  <span className="text-text-muted text-xs font-bold uppercase tracking-wider text-[10px]">Leaves Awaiting HR</span>
                  <span className="text-2xl font-semibold text-primary">{workload.metrics?.leavesAwaitingHR ?? 0}</span>
                </div>
                <div className="bg-surface p-5 rounded-[2px] border border-border shadow-none flex flex-col gap-1">
                  <span className="text-text-muted text-xs font-bold uppercase tracking-wider text-[10px]">Missing Activity Reports</span>
                  <span className="text-2xl font-semibold text-error-text">{workload.metrics?.missingActivityReports ?? 0}</span>
                </div>
                <div className="bg-surface p-5 rounded-[2px] border border-border shadow-none flex flex-col gap-1">
                  <span className="text-text-muted text-xs font-bold uppercase tracking-wider text-[10px]">Attendance Compliance</span>
                  <span className="text-2xl font-semibold text-primary">{workload.metrics?.attendanceCompliance ?? 100}%</span>
                </div>
                <div className="bg-surface p-5 rounded-[2px] border border-border shadow-none flex flex-col gap-1">
                  <span className="text-text-muted text-xs font-bold uppercase tracking-wider text-[10px]">Average Credits</span>
                  <span className="text-2xl font-semibold text-text-primary">{workload.metrics?.averageCredits ?? 0} cr</span>
                </div>
                <div className="bg-surface p-5 rounded-[2px] border border-border shadow-none flex flex-col gap-1">
                  <span className="text-text-muted text-xs font-bold uppercase tracking-wider text-[10px]">Overloaded Faculty</span>
                  <span className="text-2xl font-semibold text-error-text">{workload.metrics?.overloadedFacultyCount ?? 0}</span>
                </div>
              </div>

              {/* Overloaded & Underutilized Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Overloaded */}
                <div className="bg-surface rounded-[2.5rem] border border-border shadow-none p-6 space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
                    <AlertTriangle className="w-5 h-5 text-rose-500" />
                    <h3 className="font-bold text-text-primary">Overloaded Faculty ({workload.overloadedFaculty.length})</h3>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {workload.overloadedFaculty.length > 0 ? (
                      workload.overloadedFaculty.map((f: any) => (
                        <div key={f.facultyid} className="py-3 flex justify-between items-center">
                          <div>
                            <h4 className="font-bold text-slate-850 text-sm">{f.fullname}</h4>
                            <p className="text-text-muted text-xs">{f.department}</p>
                          </div>
                          <span className="px-2.5 py-1 bg-error-bg text-error-text text-xs font-bold rounded-[2px]">
                            {f.credits} Credits ({f.coursesCount} courses)
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-text-muted text-sm py-6 italic text-center">No overloaded faculty detected.</div>
                    )}
                  </div>
                </div>

                {/* Underutilized */}
                <div className="bg-surface rounded-[2.5rem] border border-border shadow-none p-6 space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    <h3 className="font-bold text-text-primary">Underutilized Faculty ({workload.underutilizedFaculty.length})</h3>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {workload.underutilizedFaculty.length > 0 ? (
                      workload.underutilizedFaculty.map((f: any) => (
                        <div key={f.facultyid} className="py-3 flex justify-between items-center">
                          <div>
                            <h4 className="font-bold text-slate-850 text-sm">{f.fullname}</h4>
                            <p className="text-text-muted text-xs">{f.department}</p>
                          </div>
                          <span className="px-2.5 py-1 bg-warning-bg text-warning-text text-xs font-bold rounded-[2px]">
                            {f.credits} Credits ({f.coursesCount} courses)
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-text-muted text-sm py-6 italic text-center">No underutilized faculty detected.</div>
                    )}
                  </div>
                </div>

              </div>

              {/* Department Workload Summary */}
              <div className="bg-surface rounded-[2.5rem] border border-border shadow-none p-6 space-y-4">
                <h3 className="font-bold text-text-primary border-b border-slate-50 pb-3">Courses Handled By Departments</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {workload.coursesByDepartment.map((d: any, idx: number) => (
                    <div key={idx} className="bg-surface-hover p-4 rounded-[2px] flex flex-col gap-1">
                      <span className="text-text-muted font-bold text-xs uppercase tracking-wider">{d.code}</span>
                      <span className="text-text-primary text-sm font-semibold truncate">{d.name}</span>
                      <span className="text-2xl font-semibold text-primary mt-2">{d.count} offerings</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: FACULTY TIMELINE HISTORY */}
          {tab === 'history' && (
            <div className="space-y-6">
              {/* Selector */}
              <div className="bg-surface p-6 rounded-[2px] border border-border shadow-none flex flex-col md:flex-row gap-4 items-center">
                <span className="font-bold text-text-primary">Audit History for:</span>
                <select
                  value={selectedFacultyId || ''}
                  onChange={e => setSelectedFacultyId(Number(e.target.value))}
                  className="px-4 py-2.5 bg-surface-hover rounded-[2px] text-sm border-none ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-semibold text-text-primary"
                >
                  <option value="">-- Select Faculty Member --</option>
                  {directory.map(fac => (
                    <option key={fac.facultyid} value={fac.facultyid}>
                      {fac.fullname} ({fac.employeenumber})
                    </option>
                  ))}
                </select>
              </div>

              {historyLoading ? (
                <div className="flex justify-center items-center h-[30vh]">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : facultyHistory ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                  
                  {/* Aggregated profile metrics */}
                  <div className="lg:col-span-1 bg-surface p-6 rounded-[2.5rem] border border-border shadow-none space-y-6">
                    <div className="text-center space-y-2">
                      <div className="w-16 h-16 rounded-[2px] bg-primary text-white flex items-center justify-center font-bold text-2xl mx-auto">
                        {facultyHistory.faculty.fullname[0]}
                      </div>
                      <h3 className="font-semibold text-text-primary text-lg">{facultyHistory.faculty.fullname}</h3>
                      <p className="text-text-muted text-xs font-mono">{facultyHistory.faculty.employeenumber}</p>
                      <span className="inline-block px-3 py-1 bg-background text-text-secondary text-xs font-bold rounded-[2px]">
                        {facultyHistory.faculty.department}
                      </span>
                    </div>

                    <div className="border-t border-slate-50 pt-4 space-y-3.5">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-text-muted font-semibold text-xs">Courses Taught:</span>
                        <span className="font-bold text-slate-805 text-xs">{facultyHistory.stats.totalCoursesTaught}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-text-muted font-semibold text-xs">Credit Hours:</span>
                        <span className="font-bold text-slate-805 text-xs">{facultyHistory.stats.creditHours} cr</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-text-muted font-semibold text-xs">Attendance Completion:</span>
                        <span className="font-bold text-indigo-650 text-xs">{facultyHistory.stats.attendanceCompletionRate}%</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-text-muted font-semibold text-xs">Leave Count (Approved):</span>
                        <span className="font-bold text-slate-805 text-xs">{facultyHistory.stats.totalLeavesTaken}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-text-muted font-semibold text-xs">Activity Reports:</span>
                        <span className="font-bold text-slate-805 text-xs">{facultyHistory.stats.totalReportsSubmitted}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-text-muted font-semibold text-xs">Teaching Load Approvals:</span>
                        <span className="font-bold text-slate-850 text-xs">{facultyHistory.stats.teachingLoadApprovals} requests</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-text-muted font-semibold text-xs">Student Count:</span>
                        <span className="font-bold text-slate-850 text-xs">{facultyHistory.stats.studentCount} students</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-text-muted font-semibold text-xs">Ticket Count:</span>
                        <span className="font-bold text-slate-855 text-xs">{facultyHistory.stats.ticketCount} tickets</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-text-muted font-semibold text-xs">AI Quiz Usage:</span>
                        <span className="font-bold text-slate-805 text-xs">{facultyHistory.stats.quizCount} times</span>
                      </div>
                    </div>
                  </div>

                  {/* Timelines list */}
                  <div className="lg:col-span-2 space-y-6">
                    
                    {/* Courses semester history */}
                    <div className="bg-surface p-6 rounded-[2.5rem] border border-border shadow-none space-y-4">
                      <h4 className="font-bold text-text-primary border-b border-slate-50 pb-2">Academic Semester Assignments</h4>
                      <div className="space-y-3">
                        {facultyHistory.semesterHistory.length > 0 ? (
                          facultyHistory.semesterHistory.map((sh: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center text-sm bg-surface-hover p-3 rounded-[2px]">
                              <div>
                                <strong className="text-text-primary">{sh.courseName}</strong> ({sh.courseCode})
                                <p className="text-xs text-text-muted">Semester: {sh.semester} | {sh.credits} cr</p>
                              </div>
                              <div className="text-right">
                                <span className="text-xs font-bold text-text-secondary block">Attendance Rate</span>
                                <span className="font-semibold text-primary">{sh.attendanceRate}%</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-text-muted italic">No assigned courses found.</p>
                        )}
                      </div>
                    </div>

                    {/* Teaching load timeline */}
                    <div className="bg-surface p-6 rounded-[2.5rem] border border-border shadow-none space-y-4">
                      <h4 className="font-bold text-text-primary border-b border-slate-50 pb-2">Teaching Load Requests history</h4>
                      <div className="space-y-3">
                        {facultyHistory.loadHistory.length > 0 ? (
                          facultyHistory.loadHistory.map((lh: any) => (
                            <div key={lh.teachingloadid} className="flex justify-between items-center text-sm">
                              <div>
                                <span className="font-semibold text-text-primary">{lh.semester} teaching load</span>
                                <p className="text-xs text-text-muted">Courses: {lh.courses.join(', ')}</p>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <span className="text-[10px] text-text-muted">{new Date(lh.date).toLocaleDateString()}</span>
                                {getStatusBadge(lh.status)}
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-text-muted italic">No teaching loads requested.</p>
                        )}
                      </div>
                    </div>

                    {/* Leave requests timeline */}
                    <div className="bg-surface p-6 rounded-[2.5rem] border border-border shadow-none space-y-4">
                      <h4 className="font-bold text-text-primary border-b border-slate-50 pb-2">Leave Request Audits</h4>
                      <div className="space-y-3">
                        {facultyHistory.leaveHistory.length > 0 ? (
                          facultyHistory.leaveHistory.map((lh: any) => (
                            <div key={lh.leaverequestid} className="flex justify-between items-center text-sm">
                              <div>
                                <span className="font-semibold text-text-primary">{lh.leavetype} Leave Request</span>
                                <p className="text-xs text-text-muted">
                                  {new Date(lh.startdate).toLocaleDateString()} to {new Date(lh.enddate).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <span className="text-[10px] text-text-muted">{new Date(lh.createdat).toLocaleDateString()}</span>
                                {getStatusBadge(lh.status)}
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-text-muted italic">No leaves recorded.</p>
                        )}
                      </div>
                    </div>

                    {/* Activity report timeline */}
                    <div className="bg-surface p-6 rounded-[2.5rem] border border-border shadow-none space-y-4">
                      <h4 className="font-bold text-text-primary border-b border-slate-50 pb-2">Compliance Daily Activity Reports</h4>
                      <div className="space-y-3">
                        {facultyHistory.reportHistory.length > 0 ? (
                          facultyHistory.reportHistory.map((rh: any) => (
                            <div key={rh.dailyactivityreportid} className="flex justify-between items-start text-sm border-b border-slate-50 pb-2">
                              <div>
                                <strong className="text-text-primary">{new Date(rh.reportdate).toLocaleDateString()}</strong>
                                <p className="text-xs text-text-secondary mt-1">{rh.summary}</p>
                                <div className="text-[10px] text-text-muted mt-1 flex gap-1.5 flex-wrap">
                                  {rh.activities.map((a: string, idx: number) => (
                                    <span key={idx} className="bg-background px-1.5 py-0.5 rounded">{a}</span>
                                  ))}
                                </div>
                              </div>
                              {getStatusBadge(rh.status)}
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-text-muted italic">No daily activity reports submitted.</p>
                        )}
                      </div>
                    </div>

                  </div>

                </div>
              ) : (
                <div className="bg-surface-hover text-center py-20 rounded-[2px] text-text-muted text-sm border-2 border-dashed border-border">
                  Please select a faculty member above to render their unified history timeline.
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* OVERRIDE STATUS MODAL */}
      <Modal
        isOpen={isOverrideModalOpen}
        onClose={() => setIsOverrideModalOpen(false)}
        title="Admin Absolute Workflow Override"
      >
        <div className="space-y-4 p-2">
          <p className="text-xs text-text-muted leading-relaxed">
            As a System Administrator, you are exercising absolute override authority. This action bypasses conventional workflow checks, resolves active escalations, and logs your identity to the audit log.
          </p>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-text-secondary uppercase">Override Action</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOverrideAction('APPROVE')}
                className={`flex-1 py-2 rounded-[2px] text-xs font-bold transition-all ${
                  overrideAction === 'APPROVE' 
                    ? 'bg-emerald-600 text-white shadow-none' 
                    : 'bg-background text-text-secondary hover:bg-slate-200'
                }`}
              >
                Force Approve
              </button>
              <button
                type="button"
                onClick={() => setOverrideAction('REJECT')}
                className={`flex-1 py-2 rounded-[2px] text-xs font-bold transition-all ${
                  overrideAction === 'REJECT' 
                    ? 'bg-rose-600 text-white shadow-none' 
                    : 'bg-background text-text-secondary hover:bg-slate-200'
                }`}
              >
                Force Reject
              </button>
              {tab === 'leaves' && (
                <button
                  type="button"
                  onClick={() => setOverrideAction('ARCHIVE')}
                  className={`flex-1 py-2 rounded-[2px] text-xs font-bold transition-all ${
                    overrideAction === 'ARCHIVE' 
                      ? 'bg-slate-700 text-white shadow-none' 
                      : 'bg-background text-text-secondary hover:bg-slate-200'
                  }`}
                >
                  Archive Request
                </button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-text-secondary uppercase">Justification Comment</label>
            <textarea
              placeholder="Provide comments for this absolute override..."
              value={overrideComment}
              onChange={e => setOverrideComment(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-surface-hover border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-600 rounded-[2px] text-sm outline-none transition-all"
            />
          </div>

          <div className="flex gap-2 justify-end pt-3">
            <button
              type="button"
              onClick={() => setIsOverrideModalOpen(false)}
              className="px-4 py-2 border border-border hover:bg-surface-hover rounded-[2px] text-xs font-bold text-text-secondary transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleOverrideSubmit}
              className="px-4 py-2 bg-primary hover:bg-primary-hover disabled:bg-indigo-400 text-white rounded-[2px] text-xs font-bold transition-all"
            >
              {isSubmitting ? 'Submitting Override...' : 'Apply Override'}
            </button>
          </div>
        </div>
      </Modal>

      {/* REASSIGN COURSES MODAL */}
      <Modal
        isOpen={isReassignModalOpen}
        onClose={() => setIsReassignModalOpen(false)}
        title="Reassign Faculty Teaching Assignments"
      >
        <div className="space-y-4 p-2">
          <p className="text-xs text-text-muted leading-relaxed">
            Reassign the course offerings associated with this teaching load request. This directly alters course assignments in the semester timetable slot allocations.
          </p>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-text-secondary uppercase">Available Course Offerings</label>
            <div className="max-h-[250px] overflow-y-auto border border-border rounded-[2px] divide-y divide-slate-50 p-2 bg-surface-hover/50">
              {availableOfferings.map(offering => {
                const isSelected = selectedOfferingIds.includes(offering.offeringId);
                return (
                  <label 
                    key={offering.offeringId} 
                    className="flex items-center gap-3 p-2.5 hover:bg-surface rounded-[2px] cursor-pointer transition-all text-xs font-medium"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleOfferingSelection(offering.offeringId)}
                      className="rounded text-primary focus:ring-indigo-600 w-4 h-4"
                    />
                    <div className="flex flex-col">
                      <span className="font-bold text-text-primary">{offering.name}</span>
                      <span className="text-[10px] text-text-muted">Current Instructor: {offering.teacher}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-3">
            <button
              type="button"
              onClick={() => setIsReassignModalOpen(false)}
              className="px-4 py-2 border border-border hover:bg-surface-hover rounded-[2px] text-xs font-bold text-text-secondary transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleReassignSubmit}
              className="px-4 py-2 bg-primary hover:bg-primary-hover disabled:bg-indigo-400 text-white rounded-[2px] text-xs font-bold transition-all"
            >
              {isSubmitting ? 'Updating Assignments...' : 'Reassign Selected'}
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
