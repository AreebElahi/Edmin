'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { SupervisorAPI } from '@/utils/api';
import { 
    GraduationCap, Check, X, Search, Filter, RefreshCw, 
    MoreVertical, Eye, History, ChevronLeft, ChevronRight 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { UserRole } from '@/types/types';

export default function SupervisorEnrollmentPage() {
    const [activeTab, setActiveTab] = useState<'ENROLLMENT' | 'WITHDRAWAL'>('ENROLLMENT');
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<number | null>(null);

    // Search and Filtering State
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 10;

    // Modal / Action States
    const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [changeSectionModalOpen, setChangeSectionModalOpen] = useState(false);
    const [availableSections, setAvailableSections] = useState<any[]>([]);
    const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);
    const [actionMenuOpenId, setActionMenuOpenId] = useState<number | null>(null);

    useEffect(() => {
        setPage(1);
        fetchRequests(1);
    }, [activeTab, statusFilter]);

    const fetchRequests = async (currentPage = page) => {
        setLoading(true);
        try {
            const params = {
                search: searchQuery.trim() || undefined,
                status: statusFilter !== 'ALL' ? statusFilter : undefined,
                page: currentPage,
                limit
            };

            if (activeTab === 'ENROLLMENT') {
                const res = await SupervisorAPI.getEnrollmentRequests(params);
                setRequests(res.items || []);
                setTotalPages(res.totalPages || 1);
            } else {
                const res = await SupervisorAPI.getWithdrawalRequests(params);
                setRequests(res.items || []);
                setTotalPages(res.totalPages || 1);
            }
        } catch (error: any) {
            console.error('Failed to load requests:', {
                message: error?.message,
                status: error?.status,
                data: error?.response?.data || error?.data,
                context: 'SupervisorEnrollmentPage.fetchRequests'
            });
            toast.error('Failed to load requests');
        } finally {
            setLoading(false);
        }
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchRequests(1);
    };

    const handleApprove = async (id: number) => {
        const comment = prompt("Enter approval comments (Optional):");
        if (comment === null) return;

        setProcessingId(id);
        setActionMenuOpenId(null);
        try {
            if (activeTab === 'ENROLLMENT') {
                await SupervisorAPI.approveEnrollment(id, comment);
                toast.success('Enrollment request approved');
            } else {
                await SupervisorAPI.approveWithdrawal(id, comment);
                toast.success('Withdrawal request approved');
            }
            fetchRequests();
        } catch (error: any) {
            console.error('Action failed:', {
                message: error?.message,
                status: error?.status,
                context: 'SupervisorEnrollmentPage.handleApprove'
            });
            toast.error(error.message || 'Approval action failed');
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (id: number) => {
        const reason = prompt("Enter reason for rejection (Required):");
        if (!reason) {
            if (reason === "") toast.error("Rejection reason is required");
            return;
        }

        setProcessingId(id);
        setActionMenuOpenId(null);
        try {
            if (activeTab === 'ENROLLMENT') {
                await SupervisorAPI.rejectEnrollment(id, reason);
                toast.success('Enrollment request rejected');
            } else {
                await SupervisorAPI.rejectWithdrawal(id, reason);
                toast.success('Withdrawal request rejected');
            }
            fetchRequests();
        } catch (error: any) {
            console.error('Action failed:', {
                message: error?.message,
                status: error?.status,
                context: 'SupervisorEnrollmentPage.handleReject'
            });
            toast.error(error.message || 'Rejection action failed');
        } finally {
            setProcessingId(null);
        }
    };

    const handleViewDetail = async (id: number) => {
        setActionMenuOpenId(null);
        try {
            if (activeTab === 'ENROLLMENT') {
                const detail = await SupervisorAPI.getEnrollmentRequestDetail(id);
                setSelectedRequest(detail);
            } else {
                const detail = await SupervisorAPI.getWithdrawalRequestDetail(id);
                setSelectedRequest(detail);
            }
            setDetailModalOpen(true);
        } catch (error: any) {
            console.error('Failed to load request details:', {
                message: error?.message,
                context: 'SupervisorEnrollmentPage.handleViewDetail'
            });
            toast.error('Failed to load request details');
        }
    };

    const handleOpenSectionMigration = async (id: number) => {
        setActionMenuOpenId(null);
        try {
            const detail = await SupervisorAPI.getEnrollmentRequestDetail(id);
            setSelectedRequest(detail);
            setAvailableSections(detail.availableSections || []);
            setSelectedSectionId(detail.section?.id || null);
            setChangeSectionModalOpen(true);
        } catch (error: any) {
            console.error('Failed to load sections for migration:', {
                message: error?.message,
                context: 'SupervisorEnrollmentPage.handleOpenSectionMigration'
            });
            toast.error('Failed to load sections');
        }
    };

    const handleSectionMigrationSubmit = async () => {
        if (!selectedRequest || !selectedSectionId) return;

        setProcessingId(selectedRequest.id);
        try {
            await SupervisorAPI.changeSection(selectedRequest.id, 'REQUEST', selectedSectionId);
            toast.success('Section changed successfully');
            setChangeSectionModalOpen(false);
            fetchRequests();
        } catch (error: any) {
            console.error('Section migration failed:', {
                message: error?.message,
                context: 'SupervisorEnrollmentPage.handleSectionMigrationSubmit'
            });
            toast.error(error.message || 'Failed to change section');
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <DashboardLayout userName="Supervisor" userRole={UserRole.FACULTY} notifications={[]} currentPath="/dashboard/faculty/supervisor/enrollment">
            <div className="p-6 md:p-8 space-y-8 animate-fade-in max-w-7xl mx-auto">
                
                {/* Header section */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-text-primary tracking-tight">Enrollments & Withdrawals</h1>
                        <p className="text-text-secondary mt-1 text-sm md:text-base">
                            Process course enrollment requests, change sections, and review student withdrawals.
                        </p>
                    </div>
                    
                    {/* Tab Selection */}
                    <div className="flex bg-slate-100 p-1 rounded-xl w-fit animate-fade-in">
                        <button 
                            onClick={() => setActiveTab('ENROLLMENT')}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'ENROLLMENT' ? 'bg-white shadow-sm text-primary font-semibold' : 'text-text-secondary hover:text-text-primary'}`}
                        >
                            Enrollment Requests
                        </button>
                        <button 
                            onClick={() => setActiveTab('WITHDRAWAL')}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'WITHDRAWAL' ? 'bg-white shadow-sm text-primary font-semibold' : 'text-text-secondary hover:text-text-primary'}`}
                        >
                            Withdrawal Requests
                        </button>
                    </div>
                </header>

                {/* Filters Row */}
                <div className="bg-surface rounded-xl border border-border p-4 shadow-sm flex flex-col md:flex-row md:items-center gap-4 justify-between">
                    <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2 max-w-md">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
                            <input 
                                type="text" 
                                placeholder="Search by Student or Roll No..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-sm bg-background text-text-primary focus:outline-none focus:border-primary"
                            />
                        </div>
                        <button type="submit" className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-medium transition-colors">
                            Search
                        </button>
                    </form>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-text-secondary" />
                            <select 
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="border border-border rounded-lg text-sm bg-background text-text-primary px-3 py-2 focus:outline-none focus:border-primary"
                            >
                                <option value="ALL">All Statuses</option>
                                <option value="PENDING">Pending</option>
                                <option value="APPROVED">Approved</option>
                                <option value="REJECTED">Rejected</option>
                            </select>
                        </div>

                        <button 
                            onClick={() => fetchRequests(page)}
                            className="p-2 border border-border rounded-lg hover:bg-surface-hover text-text-secondary transition-colors"
                            title="Refresh List"
                        >
                            <RefreshCw className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Main Table */}
                {loading ? (
                    <div className="flex h-32 items-center justify-center bg-surface border border-border rounded-xl">
                        <div className="text-text-muted">Loading requests...</div>
                    </div>
                ) : requests.length === 0 ? (
                    <div className="bg-surface rounded-xl border border-border p-12 text-center shadow-sm">
                        <GraduationCap className="h-12 w-12 text-text-muted mx-auto mb-4" strokeWidth={1} />
                        <h3 className="text-lg font-medium text-text-primary mb-1">No Requests Found</h3>
                        <p className="text-text-secondary text-sm">There are no records matching your query.</p>
                    </div>
                ) : (
                    <div className="bg-surface rounded-xl border border-border overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-surface-hover border-b border-border text-xs uppercase tracking-wider text-text-muted">
                                        <th className="p-4 font-semibold">Student Name</th>
                                        <th className="p-4 font-semibold">Roll Number</th>
                                        <th className="p-4 font-semibold">Course</th>
                                        {activeTab === 'ENROLLMENT' ? (
                                            <th className="p-4 font-semibold">Assigned Section</th>
                                        ) : (
                                            <th className="p-4 font-semibold">Reason</th>
                                        )}
                                        <th className="p-4 font-semibold">Requested Date</th>
                                        <th className="p-4 font-semibold">Status</th>
                                        <th className="p-4 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {requests.map((req) => (
                                        <tr key={req.id} className="border-b border-border hover:bg-surface-hover/30 transition-colors">
                                            <td className="p-4">
                                                <div className="font-semibold text-text-primary">{req.studentName}</div>
                                            </td>
                                            <td className="p-4 text-sm text-text-secondary">{req.rollnumber || req.rollNo}</td>
                                            <td className="p-4 font-medium text-text-secondary">{req.courseName}</td>
                                            {activeTab === 'ENROLLMENT' ? (
                                                <td className="p-4 text-sm text-text-secondary">
                                                    <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded font-semibold text-xs text-slate-700">
                                                        {req.sectionName}
                                                    </span>
                                                </td>
                                            ) : (
                                                <td className="p-4 text-sm text-text-secondary max-w-xs truncate" title={req.reason}>
                                                    {req.reason}
                                                </td>
                                            )}
                                            <td className="p-4 text-sm text-text-secondary">
                                                {new Date(req.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                                                    req.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                                                    req.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                    {req.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right relative border-l border-transparent">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button 
                                                        onClick={() => handleViewDetail(req.id)}
                                                        className="p-1 border border-border rounded hover:bg-surface-hover text-text-secondary transition-colors"
                                                        title="View Details"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>

                                                    {req.status === 'PENDING' && (
                                                        <div className="relative">
                                                            <button 
                                                                onClick={() => setActionMenuOpenId(actionMenuOpenId === req.id ? null : req.id)}
                                                                className="p-1 border border-border rounded hover:bg-surface-hover text-text-secondary transition-colors"
                                                            >
                                                                <MoreVertical className="h-4 w-4" />
                                                            </button>

                                                            {actionMenuOpenId === req.id && (
                                                                <div className="absolute right-0 mt-1 w-40 bg-white border border-border shadow-lg rounded-lg py-1 z-50 text-left">
                                                                    <button 
                                                                        onClick={() => handleApprove(req.id)}
                                                                        disabled={processingId === req.id}
                                                                        className="w-full px-4 py-2 text-sm text-green-600 hover:bg-green-50 flex items-center gap-2 transition-colors"
                                                                    >
                                                                        <Check className="h-4 w-4" /> Approve
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => handleReject(req.id)}
                                                                        disabled={processingId === req.id}
                                                                        className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                                                                    >
                                                                        <X className="h-4 w-4" /> Reject
                                                                    </button>
                                                                    {activeTab === 'ENROLLMENT' && (
                                                                        <button 
                                                                            onClick={() => handleOpenSectionMigration(req.id)}
                                                                            disabled={processingId === req.id}
                                                                            className="w-full px-4 py-2 text-sm text-primary hover:bg-primary-light/30 flex items-center gap-2 transition-colors border-t border-border"
                                                                        >
                                                                            <RefreshCw className="h-4 w-4" /> Migrate Section
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination footer */}
                        <footer className="px-6 py-4 border-t border-border bg-surface-hover/30 flex items-center justify-between">
                            <span className="text-sm text-text-muted">
                                Page <strong className="text-text-primary">{page}</strong> of <strong className="text-text-primary">{totalPages}</strong>
                            </span>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => { if (page > 1) { setPage(page - 1); fetchRequests(page - 1); } }}
                                    disabled={page === 1}
                                    className="p-2 border border-border rounded-lg bg-surface hover:bg-surface-hover text-text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <button 
                                    onClick={() => { if (page < totalPages) { setPage(page + 1); fetchRequests(page + 1); } }}
                                    disabled={page === totalPages}
                                    className="p-2 border border-border rounded-lg bg-surface hover:bg-surface-hover text-text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </footer>
                    </div>
                )}

                {/* MODAL 1: Detail and history timeline modal */}
                {detailModalOpen && selectedRequest && (
                    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                        <div className="bg-surface border border-border w-full max-w-xl rounded-2xl shadow-xl overflow-hidden animate-scale-in">
                            <header className="px-6 py-4 border-b border-border flex justify-between items-center bg-background">
                                <h3 className="text-lg font-bold text-text-primary">Request Details</h3>
                                <button onClick={() => setDetailModalOpen(false)} className="p-1.5 hover:bg-surface-hover rounded-lg text-text-secondary transition-colors">
                                    <X className="h-5 w-5" />
                                </button>
                            </header>
                            
                            <main className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-text-muted block text-xs uppercase tracking-wider font-semibold">Student</span>
                                        <span className="text-text-primary font-medium">{selectedRequest.student?.name}</span>
                                    </div>
                                    <div>
                                        <span className="text-text-muted block text-xs uppercase tracking-wider font-semibold">Roll Number</span>
                                        <span className="text-text-primary font-medium">{selectedRequest.student?.rollnumber}</span>
                                    </div>
                                    <div>
                                        <span className="text-text-muted block text-xs uppercase tracking-wider font-semibold">Course</span>
                                        <span className="text-text-primary font-medium">{selectedRequest.course?.name} ({selectedRequest.course?.code})</span>
                                    </div>
                                    <div>
                                        <span className="text-text-muted block text-xs uppercase tracking-wider font-semibold">
                                            {activeTab === 'ENROLLMENT' ? 'Section' : 'Current Status'}
                                        </span>
                                        <span className="text-text-primary font-medium">
                                            {activeTab === 'ENROLLMENT' ? selectedRequest.section?.name : selectedRequest.status}
                                        </span>
                                    </div>
                                </div>

                                {activeTab === 'WITHDRAWAL' && (
                                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm">
                                        <span className="text-text-muted block text-xs uppercase tracking-wider font-semibold mb-1">Reason for Withdrawal</span>
                                        <p className="text-text-secondary leading-relaxed">{selectedRequest.reason}</p>
                                    </div>
                                )}

                                {/* Approval History Timeline */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                                        <History className="h-4 w-4" /> Approval Log Timeline
                                    </h4>
                                    
                                    {selectedRequest.history && selectedRequest.history.length === 0 ? (
                                        <div className="text-sm text-text-muted italic border-l-2 border-border pl-4">
                                            No approval actions have been recorded yet.
                                        </div>
                                    ) : (
                                        <ul className="space-y-4 pl-2 border-l-2 border-border ml-2">
                                            {selectedRequest.history?.map((h: any, i: number) => (
                                                <li key={i} className="relative pl-6">
                                                    <div className="absolute -left-[14px] top-1 w-3 h-3 rounded-full bg-primary ring-4 ring-white"></div>
                                                    <div className="text-sm">
                                                        <strong className="text-text-primary">{h.action}</strong> by <span className="text-text-secondary font-medium">{h.actorName}</span>
                                                        <span className="text-xs text-text-muted block mt-0.5">{new Date(h.createdAt).toLocaleString()}</span>
                                                        {h.comments && (
                                                            <p className="text-text-secondary bg-slate-50 border border-slate-200 p-2 rounded mt-1.5 text-xs italic">
                                                                "{h.comments}"
                                                            </p>
                                                        )}
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </main>
                        </div>
                    </div>
                )}

                {/* MODAL 2: Change Section Modal */}
                {changeSectionModalOpen && selectedRequest && (
                    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                        <div className="bg-surface border border-border w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-scale-in">
                            <header className="px-6 py-4 border-b border-border flex justify-between items-center bg-background">
                                <h3 className="text-lg font-bold text-text-primary">Change Course Section</h3>
                                <button onClick={() => setChangeSectionModalOpen(false)} className="p-1.5 hover:bg-surface-hover rounded-lg text-text-secondary transition-colors">
                                    <X className="h-5 w-5" />
                                </button>
                            </header>

                            <main className="p-6 space-y-4">
                                <div className="text-sm">
                                    <p className="text-text-secondary mb-3">
                                        Migrate student <strong>{selectedRequest.student?.name}</strong> to a different section of <strong>{selectedRequest.course?.name}</strong>.
                                    </p>
                                    <div className="bg-slate-50 p-3 rounded-lg border border-border mb-4">
                                        <span className="text-xs text-text-muted uppercase tracking-wider block font-semibold">Current Section</span>
                                        <span className="text-sm text-text-primary font-medium">{selectedRequest.section?.name || 'TBD'}</span>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-text-secondary">Available Sections</label>
                                    {availableSections.length === 0 ? (
                                        <div className="text-sm text-red-600 font-medium italic">
                                            No other active sections are offered for this course.
                                        </div>
                                    ) : (
                                        <select 
                                            value={selectedSectionId || ''}
                                            onChange={(e) => setSelectedSectionId(Number(e.target.value))}
                                            className="w-full border border-border bg-background text-text-primary text-sm rounded-lg p-2.5 focus:outline-none focus:border-primary"
                                        >
                                            <option value="">Select Target Section...</option>
                                            {availableSections.map(s => (
                                                <option key={s.sectionId} value={s.sectionId}>
                                                    {s.sectionName} (Cap: {s.capacity})
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            </main>

                            <footer className="px-6 py-4 bg-background border-t border-border flex justify-end gap-3">
                                <button 
                                    onClick={() => setChangeSectionModalOpen(false)} 
                                    className="px-4 py-2 border border-border hover:bg-surface-hover rounded-lg text-sm font-medium text-text-primary transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleSectionMigrationSubmit} 
                                    disabled={!selectedSectionId || processingId !== null}
                                    className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Assign Section
                                </button>
                            </footer>
                        </div>
                    </div>
                )}

            </div>
        </DashboardLayout>
    );
}
