'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { UserRole } from '@/types/types';
import { 
    ShieldAlert, FolderSearch, Search, Trash2, 
    FileText, Flag, AlertTriangle, ScrollText, PlayCircle
} from 'lucide-react';
import { useState } from 'react';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { 
    useOversightAttachments, 
    usePlagiarismAlerts, 
    useDeleteAttachment,
    useOversightSubmissions
} from '@/features/oversight/hooks/useOversight';

export default function ContentOversightPage() {
    const { data: currentUser } = useCurrentUser();
    const [activeTab, setActiveTab] = useState<'materials' | 'plagiarism' | 'submissions'>('materials');

    // React Query Hooks
    const { data: materials = [], isLoading: isLoadingMaterials } = useOversightAttachments();
    const { data: plagiarismAlerts = [], isLoading: isLoadingPlagiarism } = usePlagiarismAlerts();
    const { data: submissions = [], isLoading: isLoadingSubmissions } = useOversightSubmissions();
    const deleteAttachmentMutation = useDeleteAttachment();

    const handleDeleteMaterial = (id: string) => {
        if (confirm('Are you sure you want to moderate and remove this uploaded document attachment?')) {
            deleteAttachmentMutation.mutate(id);
        }
    };

    const activeFlagsCount = materials.filter(m => m.status === 'Flagged').length + plagiarismAlerts.length;

    return (
        <DashboardLayout userRole={UserRole.ADMIN} userName={currentUser?.fullName || 'Admin'} notifications={[]}>
            <div className="max-w-7xl mx-auto px-4 py-8">
                
                {/* Header Panel */}
                <div className="mb-8">
                    <h1 className="text-3xl font-semibold text-text-primary ">Content Quality & Oversight</h1>
                    <p className="text-text-secondary text-sm mt-1">Global surveillance of all uploaded files, plagiarism detection, and inappropriate content removal.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
                    <div className="bg-surface p-5 rounded-[2px] border border-border shadow-none flex flex-col gap-1">
                        <span className="text-text-secondary text-xs font-bold uppercase tracking-wider">Active Flags</span>
                        <span className="text-2xl font-semibold text-error-text">{isLoadingMaterials || isLoadingPlagiarism ? '...' : `${activeFlagsCount} Items`}</span>
                    </div>
                </div>

                {/* Sub-navigation Tabs */}
                <div className="flex flex-wrap gap-2 mb-8 bg-surface p-2 rounded-[2px] shadow-none border border-border w-fit">
                    <button onClick={() => setActiveTab('materials')} className={`px-5 py-2.5 font-bold text-sm rounded-[2px] transition-all flex items-center gap-2 ${activeTab === 'materials' ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'}`}><FolderSearch className="w-4 h-4"/> Global Repository</button>
                    <button onClick={() => setActiveTab('plagiarism')} className={`px-5 py-2.5 font-bold text-sm rounded-[2px] transition-all flex items-center gap-2 ${activeTab === 'plagiarism' ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'}`}><FileText className="w-4 h-4"/> Plagiarism Scans</button>
                    <button onClick={() => setActiveTab('submissions')} className={`px-5 py-2.5 font-bold text-sm rounded-[2px] transition-all flex items-center gap-2 ${activeTab === 'submissions' ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'}`}><ScrollText className="w-4 h-4"/> Student Submissions Map</button>
                </div>

                {/* TAB: MATERIALS OVERVIEW */}
                {activeTab === 'materials' && (
                    <div className="bg-surface rounded-[2px] p-6 shadow-none border border-border animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 border-b border-border pb-6">
                            <h2 className="text-xl font-bold text-text-primary">Across All Courses</h2>
                        </div>
                        <div className="overflow-x-auto">
                            {isLoadingMaterials ? (
                                <div className="text-center py-8 text-text-secondary font-medium">Loading uploaded materials...</div>
                            ) : (
                                <table className="w-full text-left text-sm text-text-secondary">
                                    <thead className="bg-surface-hover text-text-muted text-[10px] uppercase tracking-widest font-semibold">
                                        <tr>
                                            <th className="p-4">File Details</th>
                                            <th className="p-4">Origin Course</th>
                                            <th className="p-4">Uploader</th>
                                            <th className="p-4">Status & Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {materials.map(mat => (
                                            <tr key={mat.id} className={`hover:bg-surface-hover transition-colors ${mat.status === 'Flagged' ? 'bg-error-bg/30' : ''}`}>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        {mat.type === 'Video' ? <PlayCircle className="w-8 h-8 text-indigo-400"/> : <FileText className="w-8 h-8 text-emerald-400"/>}
                                                        <div>
                                                            <p className="font-bold text-text-primary">{mat.name}</p>
                                                            <p className="text-[10px] uppercase font-semibold text-text-muted">{mat.type} File</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4 font-bold text-primary">{mat.course}</td>
                                                <td className="p-4 font-medium text-text-secondary">{mat.uploader}</td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <span className={`px-2 py-1 rounded text-[10px] font-semibold uppercase flex items-center gap-1 ${mat.status === 'Flagged' ? 'bg-error-bg text-error-text' : 'bg-background text-text-secondary'}`}>
                                                                {mat.status === 'Flagged' && <Flag className="w-3 h-3"/>}
                                                                {mat.status}
                                                            </span>
                                                            <button 
                                                                onClick={() => handleDeleteMaterial(mat.id)} 
                                                                disabled={deleteAttachmentMutation.isPending}
                                                                className="text-rose-500 bg-error-bg p-2 rounded-[2px] hover:bg-rose-600 hover:text-white transition-colors" 
                                                                title="Delete Content"
                                                            >
                                                                <Trash2 className="w-4 h-4"/>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {materials.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="text-center py-6 text-text-muted">No documents found.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    )}
    
                    {/* TAB: PLAGIARISM */}
                    {activeTab === 'plagiarism' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4">
                            {isLoadingPlagiarism ? (
                                <div className="col-span-2 text-center py-12 text-text-secondary font-medium">Loading scan reports...</div>
                            ) : plagiarismAlerts.map(alert => (
                                <div key={alert.id} className="bg-surface border text-center md:text-left border-border rounded-[2px] p-6 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 bg-error-text text-white font-semibold text-sm px-4 py-2 rounded-bl-[2px] shadow-none">{alert.similarity}% Match</div>
                                    <h3 className="text-xl font-bold text-text-primary mb-1 mt-4">{alert.student}</h3>
                                    <p className="text-sm font-medium text-text-secondary mb-4">{alert.assignment} <span className="mx-2 text-slate-300">|</span> <span className="font-bold text-primary">{alert.course}</span></p>
                                    
                                    <div className="bg-surface-hover rounded-[2px] p-4 border border-border mb-6">
                                        <p className="text-[10px] font-semibold uppercase text-rose-500 tracking-widest mb-1">Primary Source Match Detected:</p>
                                        <p className="font-mono text-sm text-rose-800 select-all truncate">{alert.source}</p>
                                    </div>
    
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <button onClick={() => window.alert(`Initiating Deep Scan report for ${alert.student}...`)} className="flex-1 bg-primary hover:bg-primary-hover text-white font-bold py-3 rounded-[2px] transition-colors text-xs">View Deep Scan</button>
                                        <button onClick={() => window.alert(`Sending automated alert to instructor of ${alert.course}...`)} className="flex-1 bg-error-bg text-error-text hover:bg-error-bg font-bold py-3 rounded-[2px] transition-colors text-xs">Notify Instructor</button>
                                    </div>
                                </div>
                            ))}
                        {!isLoadingPlagiarism && plagiarismAlerts.length === 0 && (
                            <div className="col-span-2 text-center py-6 text-text-muted">No active plagiarism scans.</div>
                        )}
                    </div>
                )}
                
                {/* TAB: SUBMISSIONS */}
                {activeTab === 'submissions' && (
                    <div className="bg-surface rounded-[2px] p-6 shadow-none border border-border animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 border-b border-border pb-6">
                            <h2 className="text-xl font-bold text-text-primary">Assignment Deadlines & Submission Volumes</h2>
                        </div>
                        <div className="overflow-x-auto">
                            {isLoadingSubmissions ? (
                                <div className="text-center py-8 text-text-secondary font-medium">Loading submission map...</div>
                            ) : (
                                <table className="w-full text-left text-sm text-text-secondary">
                                    <thead className="bg-surface-hover text-text-muted text-[10px] uppercase tracking-widest font-semibold">
                                        <tr>
                                            <th className="p-4 rounded-tl-xl">Assignment Title</th>
                                            <th className="p-4">Course</th>
                                            <th className="p-4">Due Date</th>
                                            <th className="p-4">Submissions</th>
                                            <th className="p-4 rounded-tr-xl">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {submissions.map(sub => (
                                            <tr key={sub.id} className="hover:bg-surface-hover transition-colors">
                                                <td className="p-4 font-bold text-text-primary">{sub.title}</td>
                                                <td className="p-4 font-bold text-primary">{sub.course}</td>
                                                <td className="p-4 font-medium text-text-secondary">{new Date(sub.dueDate).toLocaleString()}</td>
                                                <td className="p-4">
                                                    <span className="font-bold text-text-primary bg-background px-3 py-1 rounded-[2px]">
                                                        {sub.submissionsCount} submissions
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-widest ${sub.status === 'Upcoming' ? 'bg-background text-success-text' : 'bg-error-bg text-error-text'}`}>
                                                        {sub.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {submissions.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="text-center py-12 text-text-muted">
                                                    No assignments found in the system.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
