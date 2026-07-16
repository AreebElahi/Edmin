'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { UserRole } from '@/types/types';
import { 
    CalendarDays, PlusCircle, AlertTriangle, Play, Archive, 
    MoreVertical, Library, ChevronRight, Building, BookOpen, Layers
} from 'lucide-react';
import { useState } from 'react';
import Modal from '@/components/Modal';
import Link from 'next/link';
import { useSemesters, useCreateSemester, useExecuteRollover } from '@/features/academic/hooks/useAcademic';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminStatusBadge from '@/components/admin/AdminStatusBadge';
import AdminActionIconButton from '@/components/admin/AdminActionIconButton';
import AdminPageWrapper from "@/components/admin/AdminPageWrapper";

export default function AcademicStructurePage() {
    const { data: currentUser } = useCurrentUser();
    const { data: semestersList = [], isLoading } = useSemesters();
    const createSemesterMutation = useCreateSemester();
    const executeRolloverMutation = useExecuteRollover();

    const [isRolloverModalOpen, setIsRolloverModalOpen] = useState(false);
    const [isAddSemesterModalOpen, setIsAddSemesterModalOpen] = useState(false);
    const [targetRolloverSemester, setTargetRolloverSemester] = useState('');

    // Form states for creation
    const [name, setName] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const handleRolloverSemester = (e: React.FormEvent) => {
        e.preventDefault();
        if (!targetRolloverSemester) return;
        executeRolloverMutation.mutate(Number(targetRolloverSemester), {
            onSuccess: () => {
                setIsRolloverModalOpen(false);
                setTargetRolloverSemester('');
            }
        });
    };

    const handleCreateSemester = (e: React.FormEvent) => {
        e.preventDefault();
        createSemesterMutation.mutate({
            name,
            year: startDate ? new Date(startDate).getFullYear() : new Date().getFullYear(),
            startDate,
            endDate
        }, {
            onSuccess: () => {
                setIsAddSemesterModalOpen(false);
                setName('');
                setStartDate('');
                setEndDate('');
            }
        });
    };

    const activeSemester = semestersList.find(s => s.status === 'ONGOING');

    return (
        <DashboardLayout userRole={UserRole.ADMIN} userName={currentUser?.fullName || 'Admin'} notifications={[]}>            
            <AdminPageWrapper>
                
                {/* Header */}
                <AdminPageHeader
                    icon={Library}
                    title="Academic Structure"
                    titleAccent="Core"
                    subtitle="Global term management and system rollover controls."
                    actions={
                        <div className="bg-surface/10 border border-white/20 px-4 py-2 flex items-center gap-3 rounded-[2px]">
                            <span className="text-[10px] font-semibold uppercase tracking-widest text-blue-200">Current Term</span>
                            <span className="font-semibold text-white text-sm flex items-center gap-1.5">
                                <Play className="w-3 h-3 fill-white"/> 
                                {activeSemester ? activeSemester.name : 'None Active'}
                            </span>
                        </div>
                    }
                />

                {/* Quick Links Dashboard */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Link href="/dashboard/admin/departments" className="bg-surface border border-border p-5 hover:border-primary hover:bg-primary-light transition-colors group flex flex-col items-center justify-center text-center">
                        <Building className="w-6 h-6 text-primary mb-3" strokeWidth={1.5} />
                        <h3 className="font-semibold text-text-primary text-sm">Manage Departments</h3>
                        <p className="text-[11px] text-text-secondary mt-1">HOD assignments and programs</p>
                    </Link>

                    <Link href="/dashboard/admin/courses" className="bg-surface border border-border p-5 hover:border-primary hover:bg-primary-light transition-colors group flex flex-col items-center justify-center text-center">
                        <BookOpen className="w-6 h-6 text-primary mb-3" strokeWidth={1.5} />
                        <h3 className="font-semibold text-text-primary text-sm">Course Catalog</h3>
                        <p className="text-[11px] text-text-secondary mt-1">Global curriculum and credits</p>
                    </Link>

                    <Link href="/dashboard/admin/timetable" className="bg-surface border border-border p-5 hover:border-primary hover:bg-primary-light transition-colors group flex flex-col items-center justify-center text-center">
                        <Layers className="w-6 h-6 text-primary mb-3" strokeWidth={1.5} />
                        <h3 className="font-semibold text-text-primary text-sm">Allocations &amp; Timetable</h3>
                        <p className="text-[11px] text-text-secondary mt-1">Teacher sections and scheduling</p>
                    </Link>
                </div>

                <div className="bg-surface border border-border">
                    <div className="px-5 py-3 border-b border-border bg-surface-hover flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-primary" strokeWidth={1.5} />
                        <h2 className="text-sm font-semibold text-text-primary">Term / Semester Control</h2>
                    </div>

                    <div className="p-5 space-y-4">
                        {/* Control Panel */}
                        <div className="bg-error-bg border border-border p-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                            <div className="flex gap-3 items-start">
                                <AlertTriangle className="w-4 h-4 text-error-text mt-0.5 shrink-0" strokeWidth={1.5} />
                                <div>
                                    <h3 className="text-sm font-semibold text-error-text">Critical System Rollover</h3>
                                    <p className="text-xs text-text-secondary mt-0.5 max-w-2xl">Rolling over to a new semester archives all current active sections, finalizes enrollments, and updates system dates globally. <b>Only one semester can be active at a time.</b></p>
                                </div>
                            </div>
                            <button onClick={() => setIsRolloverModalOpen(true)} className="bg-error-text hover:bg-error-hover text-white text-xs font-semibold px-4 py-2 transition-colors whitespace-nowrap flex items-center gap-2 rounded-[2px]">
                                Execute Rollover <ChevronRight className="w-4 h-4"/>
                            </button>
                        </div>

                        {/* Semester List */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {/* Create New Add Card */}
                            <div onClick={() => setIsAddSemesterModalOpen(true)} className="border-2 border-dashed border-border p-8 flex flex-col items-center justify-center text-text-muted hover:bg-background hover:border-primary transition-colors cursor-pointer group">
                                <PlusCircle className="w-8 h-8 mb-3 group-hover:text-primary transition-colors" strokeWidth={1.5} />
                                <span className="text-xs font-semibold">Draft New Semester</span>
                            </div>
                            
                            {isLoading ? (
                                <div className="col-span-2 flex items-center justify-center py-12 text-text-secondary text-sm">
                                    Loading semesters structure...
                                </div>
                            ) : semestersList.map(sem => {
                                const displayStatus = sem.status === 'ONGOING' ? 'Active' : sem.status === 'UPCOMING' ? 'Draft' : 'Archived';
                                const startDateStr = sem.startdate ? new Date(sem.startdate).toLocaleDateString() : 'N/A';
                                const endDateStr = sem.enddate ? new Date(sem.enddate).toLocaleDateString() : 'N/A';
                                
                                return (
                                    <div key={sem.semesterid} className={`border p-4 transition-all ${displayStatus === 'Active' ? 'bg-success-bg border-success-text' : displayStatus === 'Archived' ? 'bg-surface-hover border-border opacity-70 grayscale' : 'bg-surface border-border'}`}>
                                        <div className="flex justify-between items-start mb-3">
                                            <AdminStatusBadge 
                                                status={displayStatus} 
                                                variant={displayStatus === 'Active' ? 'success' : displayStatus === 'Archived' ? 'default' : 'primary'} 
                                            />
                                            <AdminActionIconButton 
                                                icon={MoreVertical} 
                                                onClick={() => alert(`Opening advanced controls for ${sem.name}`)} 
                                                variant="default"
                                            />
                                        </div>
                                        <h3 className="text-lg font-semibold text-text-primary mb-0.5">{sem.name}</h3>
                                        <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wide mb-3">ID: {sem.semesterid}</p>
                                        
                                        <div className="bg-surface-hover border border-border p-3 space-y-2">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-text-secondary">Start Date</span>
                                                <span className="font-semibold text-text-primary">{startDateStr}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-text-secondary">End Date</span>
                                                <span className="font-semibold text-text-primary">{endDateStr}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* MODAL: Rollover */}
                <Modal isOpen={isRolloverModalOpen} onClose={() => setIsRolloverModalOpen(false)} title="System Rollover Execution" type="danger">
                    <form onSubmit={handleRolloverSemester} className="space-y-4">
                        <div className="bg-error-bg border border-border text-error-text p-3 text-xs font-medium flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={1.5} />
                            <span><b>Warning:</b> This action operates on the global database. All ongoing enrollments will be finalized. Current active sections will be archived to history.</span>
                        </div>
                        <div>
                            <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-1">Target Semester to Activate</label>
                            <select required value={targetRolloverSemester} onChange={e => setTargetRolloverSemester(e.target.value)} className="w-full border border-border p-3 text-sm font-semibold outline-none focus:border-error-text transition-colors bg-surface rounded-[2px]">
                                <option value="" disabled>Select drafted semester...</option>
                                {semestersList.filter(s => s.status === 'UPCOMING').map(s => (
                                    <option key={s.semesterid} value={s.semesterid}>{s.name} ({s.semesterid})</option>
                                ))}
                            </select>
                        </div>
                        <button type="submit" disabled={!targetRolloverSemester || executeRolloverMutation.isPending} className="w-full mt-2 bg-error-text disabled:bg-border disabled:text-text-muted text-white text-sm font-semibold py-3 hover:bg-error-hover transition-colors flex items-center justify-center gap-2 rounded-[2px]">
                            <Archive className="w-4 h-4" strokeWidth={1.5}/> {executeRolloverMutation.isPending ? 'Executing Rollover...' : 'Force Rollover Now'}
                        </button>
                    </form>
                </Modal>
                
                {/* MODAL: Add Semester */}
                <Modal isOpen={isAddSemesterModalOpen} onClose={() => setIsAddSemesterModalOpen(false)} title="Draft New Semester Configuration">
                    <form className="space-y-3" onSubmit={handleCreateSemester}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-1">Display Name</label>
                                <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Fall 2026" className="w-full border border-border px-3 py-2.5 outline-none focus:border-primary text-sm transition-colors rounded-[2px]" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-1">Start Date</label>
                                <input type="date" required value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border border-border px-3 py-2.5 outline-none focus:border-primary text-sm transition-colors rounded-[2px]" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-1">End Date</label>
                                <input type="date" required value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full border border-border px-3 py-2.5 outline-none focus:border-primary text-sm transition-colors rounded-[2px]" />
                            </div>
                        </div>
                        <button type="submit" disabled={createSemesterMutation.isPending} className="w-full mt-2 bg-primary text-white text-sm font-semibold py-3 hover:bg-primary-hover transition-colors flex items-center justify-center gap-2 disabled:opacity-50 rounded-[2px]">
                             {createSemesterMutation.isPending ? 'Confirming Draft...' : 'Confirm Draft Creation'}
                        </button>
                    </form>
                </Modal>
            </AdminPageWrapper>
        </DashboardLayout>
    );
}
