'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { UserRole } from '@/types/types';
import { FileText, Plus, Search, Filter, CheckCircle2, XCircle, Loader2, AlertCircle, Home } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import Modal from '@/components/Modal';
import { useLeaves, useApproveLeave, useRejectLeave } from '@/features/leaves/hooks/useLeaves';

export default function LeavesPage() {
    const { data: leaves = [], isLoading, error } = useLeaves();
    const { mutate: approveLeave } = useApproveLeave();
    const { mutate: rejectLeave } = useRejectLeave();
    
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredRequests = leaves.filter(req => {
        const name = req.user?.fullname || 'Unknown';
        return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
               (req.leavetype && req.leavetype.toLowerCase().includes(searchTerm.toLowerCase()));
    });

    return (
        <DashboardLayout
            userRole={UserRole.HR}
            userName="Areeb Elahi"
            userAvatar="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
            notifications={[]}
            currentPath="/dashboard/hr/leaves"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Breadcrumb */}
                <nav className="flex mb-6" aria-label="Breadcrumb">
                    <ol className="flex items-center space-x-2 bg-surface px-3 py-2 rounded-[2px] border border-border shadow-none">
                        <li>
                            <Link href="/dashboard/hr" className="text-text-secondary hover:text-primary transition-colors">
                                <Home className="w-4 h-4" />
                            </Link>
                        </li>
                        <li><span className="text-border-hover">/</span></li>
                        <li><span className="text-sm font-medium text-text-primary">Leaves</span></li>
                    </ol>
                </nav>

                {/* Header Card */}
                <div className="bg-surface rounded-[2px] p-6 shadow-none border border-border relative overflow-hidden mb-8">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-sky-500 to-slate-500"></div>
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-text-primary mb-1">Leave Management</h1>
                            <p className="text-text-secondary">Review and manage employee leave requests</p>
                        </div>
                        <button
                            onClick={() => setIsRequestModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-[2px] font-medium hover:bg-primary-hover transition-colors shadow-none shadow-blue-200"
                        >
                            <Plus className="w-4 h-4" />
                            New Leave Request
                        </button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center h-48 bg-surface rounded-[2px] border border-border shadow-none">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                ) : error ? (
                    <div className="bg-error-bg text-error-text p-4 rounded-[2px] border border-border flex items-center gap-2 mb-8">
                        <AlertCircle className="w-5 h-5" />
                        <span>Failed to load leave requests. Please try again.</span>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                            <div className="bg-surface p-5 rounded-[2px] border border-border shadow-none">
                                <p className="text-sm font-medium text-text-secondary">Pending Requests</p>
                                <h3 className="text-2xl font-bold text-text-primary mt-2">{leaves.filter(r => r.status === 'SUBMITTED' || r.status === 'PENDING_HR').length}</h3>
                                <div className="mt-2 text-xs text-error-text bg-error-bg inline-block px-2 py-1 rounded-[2px]">Requires Action</div>
                            </div>
                            <div className="bg-surface p-5 rounded-[2px] border border-border shadow-none">
                                <p className="text-sm font-medium text-text-secondary">On Leave Today</p>
                                <h3 className="text-2xl font-bold text-text-primary mt-2">--</h3>
                            </div>
                            <div className="bg-surface p-5 rounded-[2px] border border-border shadow-none">
                                <p className="text-sm font-medium text-text-secondary">Approved (Total)</p>
                                <h3 className="text-2xl font-bold text-text-primary mt-2">{leaves.filter(r => r.status === 'APPROVED').length}</h3>
                            </div>
                            <div className="bg-surface p-5 rounded-[2px] border border-border shadow-none">
                                <p className="text-sm font-medium text-text-secondary">Rejected (Total)</p>
                                <h3 className="text-2xl font-bold text-text-primary mt-2">{leaves.filter(r => r.status === 'REJECTED').length}</h3>
                            </div>
                        </div>

                        <div className="bg-surface rounded-[2px] border border-border shadow-none overflow-hidden">
                            <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <h3 className="font-bold text-text-primary">Recent Requests</h3>
                                <div className="flex gap-2">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                        <input
                                            type="text"
                                            placeholder="Search employee..."
                                            className="pl-9 pr-4 py-2 text-sm rounded-[2px] border border-border focus:border-blue-500 outline-none w-full sm:w-auto"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <button className="flex items-center gap-2 px-3 py-2 border border-border rounded-[2px] text-sm font-medium text-text-primary hover:bg-background">
                                        <Filter className="w-4 h-4" /> Filter
                                    </button>
                                </div>
                            </div>
                            
                            {filteredRequests.length === 0 ? (
                                <div className="text-center py-16 bg-surface border-t border-border rounded-[2px] shadow-none">
                                    <FileText className="w-12 h-12 text-border-hover mx-auto mb-4" />
                                    <h3 className="text-lg font-bold text-text-primary mb-1">No requests found</h3>
                                    <p className="text-text-secondary">Try adjusting your search query.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-background/50">
                                            <tr>
                                                <th className="px-6 py-4 text-xs font-semibold text-text-secondary uppercase">Employee Name</th>
                                                <th className="px-6 py-4 text-xs font-semibold text-text-secondary uppercase">Leave Type</th>
                                                <th className="px-6 py-4 text-xs font-semibold text-text-secondary uppercase">From Date</th>
                                                <th className="px-6 py-4 text-xs font-semibold text-text-secondary uppercase">To Date</th>
                                                <th className="px-6 py-4 text-xs font-semibold text-text-secondary uppercase">Status</th>
                                                <th className="px-6 py-4 text-xs font-semibold text-text-secondary uppercase text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#EDEBE9]">
                                            {filteredRequests.map((req) => (
                                                <tr key={req.leaverequestid} className="hover:bg-background/50">
                                                    <td className="px-6 py-4">
                                                        <p className="font-semibold text-text-primary text-sm">{req.user?.fullname || 'Unknown'}</p>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-text-primary">{req.leavetype}</td>
                                                    <td className="px-6 py-4 text-sm text-text-primary">{new Date(req.startdate).toLocaleDateString()}</td>
                                                    <td className="px-6 py-4 text-sm text-text-primary">{new Date(req.enddate).toLocaleDateString()}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-[2px] text-xs font-medium border ${req.status === 'APPROVED' ? 'bg-primary-light text-primary border-border' :
                                                            req.status === 'REJECTED' ? 'bg-error-bg text-error-text border-border' :
                                                                'bg-surface-hover text-text-primary border-border'
                                                            }`}>
                                                            {req.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        {req.status === 'SUBMITTED' || req.status === 'PENDING_HR' ? (
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button
                                                                    onClick={() => approveLeave(req.leaverequestid)}
                                                                    className="p-1 text-success-text hover:bg-success-bg rounded transition-colors"
                                                                    title="Approve"
                                                                >
                                                                    <CheckCircle2 className="w-5 h-5" />
                                                                </button>
                                                                <button
                                                                    onClick={() => rejectLeave(req.leaverequestid)}
                                                                    className="p-1 text-error-text hover:bg-error-bg rounded transition-colors"
                                                                    title="Reject"
                                                                >
                                                                    <XCircle className="w-5 h-5" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-text-muted italic">No actions</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                )}

                <Modal
                    isOpen={isRequestModalOpen}
                    onClose={() => setIsRequestModalOpen(false)}
                    title="New Leave Request"
                    type="default"
                >
                    <div className="p-4 text-center">
                        <AlertCircle className="w-12 h-12 text-border-hover mx-auto mb-2" />
                        <h3 className="text-lg font-bold">Self-service requests coming soon</h3>
                        <p className="text-sm text-text-secondary mt-1">HR administrative leave entry is currently disabled pending backend integration.</p>
                        <button 
                            className="mt-4 px-4 py-2 bg-primary text-white rounded-[2px] text-sm"
                            onClick={() => setIsRequestModalOpen(false)}
                        >
                            Close
                        </button>
                    </div>
                </Modal>
            </div>
        </DashboardLayout>
    );
}
