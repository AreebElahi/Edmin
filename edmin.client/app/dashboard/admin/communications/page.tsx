'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { UserRole } from '@/types/types';
import { 
    Send, Megaphone, Clock, History, AlertCircle, 
    Users, Target, CheckCircle2, Search, Filter
} from 'lucide-react';
import { useState } from 'react';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { 
    useScheduledBroadcasts, 
    useBroadcastHistory, 
    useCreateBroadcast, 
    useCancelBroadcast 
} from '@/features/communications/hooks/useCommunications';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminTabBar from '@/components/admin/AdminTabBar';
import AdminStatusBadge from '@/components/admin/AdminStatusBadge';
import AdminPageWrapper from "@/components/admin/AdminPageWrapper";

export default function CommunicationsPage() {
    const { data: currentUser } = useCurrentUser();
    const [activeTab, setActiveTab] = useState<'compose' | 'scheduled' | 'history'>('compose');
    
    // Compose Form Data
    const [targetType, setTargetType] = useState('All Users (Global Broadcast)');
    const [priority, setPriority] = useState('Normal');
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [isScheduled, setIsScheduled] = useState(false);
    const [scheduleDate, setScheduleDate] = useState('');

    // React Query Hooks
    const { data: scheduledLog = [], isLoading: isLoadingScheduled } = useScheduledBroadcasts();
    const { data: historyLog = [], isLoading: isLoadingHistory } = useBroadcastHistory();
    const createBroadcastMutation = useCreateBroadcast();
    const cancelBroadcastMutation = useCancelBroadcast();

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        
        createBroadcastMutation.mutate({
            title,
            content: message,
            targetRole: targetType,
            priority,
            isScheduled,
            scheduleDate: isScheduled ? scheduleDate : undefined
        }, {
            onSuccess: () => {
                setTitle('');
                setMessage('');
                setIsScheduled(false);
                setScheduleDate('');
                setPriority('Normal');
                setActiveTab(isScheduled ? 'scheduled' : 'history');
            }
        });
    };

    const handleCancel = (id: string) => {
        if (confirm('Are you sure you want to cancel this scheduled announcement?')) {
            cancelBroadcastMutation.mutate(id);
        }
    };

    return (
        <DashboardLayout userRole={UserRole.ADMIN} userName={currentUser?.fullName || 'Admin'} notifications={[]}>
            <AdminPageWrapper>
                
                {/* Header Panel */}
                <AdminPageHeader
                    icon={Megaphone}
                    title="Global Announcements"
                    titleAccent="Hub"
                    subtitle="Targeted alerts, scheduled announcements, and audit logs."
                    actions={null}
                />

                {/* Sub-navigation Tabs - Scrollable on Mobile */}
                <AdminTabBar
                    tabs={[
                        { id: 'compose', label: 'New Broadcast' },
                        { id: 'scheduled', label: `Queue (${scheduledLog.length})` },
                        { id: 'history', label: 'Audit History' }
                    ]}
                    activeTab={activeTab}
                    onTabChange={(id) => setActiveTab(id as any)}
                />

                {/* TAB: COMPOSE BROADCAST */}
                {activeTab === 'compose' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4">
                        <div className="lg:col-span-2">
                            <div className="bg-surface rounded-[2px] p-8 shadow-none border border-border">
                                <h2 className="text-2xl font-semibold text-text-primary mb-6 flex items-center gap-3"><Megaphone className="w-6 h-6 text-primary"/> Compose Announcement</h2>
                                <form onSubmit={handleSend} className="space-y-6">
                                    
                                    {/* Targeting Panel */}
                                    <div className="bg-surface-hover border border-border rounded-[2px] p-5 space-y-4">
                                        <h3 className="text-[10px] font-semibold uppercase tracking-widest text-text-secondary flex items-center gap-1"><Target className="w-3 h-3"/> Audience Targeting</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <select value={targetType} onChange={e => setTargetType(e.target.value)} className="w-full bg-surface border border-border rounded-[2px] p-3 text-sm font-bold text-text-primary outline-none focus:ring-2 focus:ring-primary transition-all">
                                                    <option>All Users (Global Broadcast)</option>
                                                    <option>All Students</option>
                                                    <option>All Faculty</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content Editor */}
                                    <div className="space-y-4">
                                        <div>
                                            <input type="text" required value={title} onChange={e => setTitle(e.target.value)} placeholder="Alert Subject Line" className="w-full px-3.5 py-2.5 bg-surface-hover hover:bg-background/70 focus:bg-surface rounded-[2px] text-sm border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-primary transition-all outline-none font-bold" />
                                        </div>
                                        <div>
                                            <textarea required value={message} onChange={e => setMessage(e.target.value)} placeholder="Type announcement details here..." rows={6} className="w-full px-3.5 py-2.5 bg-surface-hover hover:bg-background/70 focus:bg-surface rounded-[2px] text-sm border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-primary transition-all outline-none resize-none"></textarea>
                                        </div>
                                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                                            <label className="flex items-center gap-3 cursor-pointer bg-surface-hover border border-border px-4 py-3 sm:py-4 rounded-[2px] flex-1 hover:bg-background transition-colors">
                                                <input type="radio" name="priority" checked={priority === 'Normal'} onChange={() => setPriority('Normal')} className="w-4 h-4 text-primary focus:ring-primary"/>
                                                <span className="text-sm font-bold text-text-primary">Normal Priority</span>
                                            </label>
                                            <label className="flex items-center gap-3 cursor-pointer bg-error-bg border border-rose-200 px-4 py-3 sm:py-4 rounded-[2px] flex-1 hover:bg-error-bg transition-colors group">
                                                <input type="radio" name="priority" checked={priority === 'Urgent'} onChange={() => setPriority('Urgent')} className="w-4 h-4 text-rose-500 focus:ring-rose-500"/>
                                                <span className="text-sm font-bold text-rose-800 flex items-center gap-1.5 group-hover:text-rose-900"><AlertCircle className="w-4 h-4 shrink-0"/> Urgent Override</span>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Scheduling */}
                                    <div className="border border-border rounded-[2px] p-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface-hover">
                                        <label className="flex items-center gap-3 cursor-pointer w-full sm:w-auto">
                                            <input type="checkbox" checked={isScheduled} onChange={e => setIsScheduled(e.target.checked)} className="w-5 h-5 rounded text-primary focus:ring-primary" />
                                            <span className="font-bold text-text-primary flex items-center gap-2"><Clock className="w-5 h-5 text-text-muted"/> Schedule for later</span>
                                        </label>
                                        {isScheduled && (
                                            <input type="datetime-local" required={isScheduled} value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} className="w-full sm:w-auto border border-border px-4 py-2 rounded-[2px] text-sm outline-none focus:ring-2 focus:ring-primary bg-surface animate-in fade-in" />
                                        )}
                                    </div>

                                    <div className="pt-4 border-t border-border">
                                        <button type="submit" disabled={createBroadcastMutation.isPending} className={`w-full font-semibold py-4 rounded-[2px] transition-all shadow-none flex items-center justify-center gap-2 ${priority === 'Urgent' ? 'bg-error-text hover:bg-[#8B1D1D] text-white' : 'bg-primary hover:bg-primary-hover text-white'}`}>
                                            {createBroadcastMutation.isPending ? 'Processing...' : (isScheduled ? 'Queue Broadcast' : priority === 'Urgent' ? 'DISPATCH URGENT ALERT' : 'Dispatch Now')}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* Audience Preview Sidebar */}
                        <div className="lg:col-span-1">
                            <div className="bg-surface rounded-[2px] p-6 text-text-primary shadow-none border border-border relative overflow-hidden">
                                <h3 className="text-lg font-bold text-text-primary mb-6 flex items-center gap-2"><Filter className="w-4 h-4"/> Estimated Reach</h3>
                                
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-[10px] font-semibold uppercase tracking-widest text-text-secondary mb-1">Target Filters Applied</p>
                                        <span className="bg-surface-hover text-text-primary border border-border px-3 py-1.5 rounded-[2px] text-xs font-bold inline-block">{targetType}</span>
                                    </div>
                                    <div className="pt-4 border-t border-border">
                                        <p className="text-[10px] font-semibold uppercase tracking-widest text-text-secondary mb-1">Estimated Inboxes</p>
                                        <p className="text-4xl font-semibold text-primary">
                                            {targetType === 'All Users (Global Broadcast)' ? '3,450' : 
                                             targetType === 'All Students' ? '2,800' : 
                                             targetType === 'All Faculty' ? '450' : '---'}
                                        </p>
                                        <p className="text-xs text-text-secondary mt-2">Delivery utilizes WebSocket real-time push and email fallback protocols.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB: SCHEDULED */}
                {activeTab === 'scheduled' && (
                    <div className="bg-surface rounded-[2px] shadow-none border border-border overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                        <div className="p-6 border-b border-border bg-surface-hover/50 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2"><Clock className="w-5 h-5 text-primary"/> Pending Delivery Queue</h2>
                        </div>
                        <div className="p-6">
                            {isLoadingScheduled ? (
                                <div className="text-center py-10 text-text-secondary font-bold">Loading scheduled broadcasts...</div>
                            ) : scheduledLog.length === 0 ? (
                                <div className="text-center py-10 text-text-secondary font-bold">No announcements in queue.</div>
                            ) : (
                                <ul className="space-y-4">
                                    {scheduledLog.map(log => (
                                        <li key={log.id} className="border border-border rounded-[2px] p-5 hover:bg-surface-hover transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    {log.priority === 'High' && <AdminStatusBadge status="High Priority" variant="error" />}
                                                    <span className="bg-warning-bg text-amber-800 text-[10px] uppercase font-semibold px-2 py-0.5 rounded"><Clock className="w-3 h-3 inline pb-0.5"/> Scheduled</span>
                                                </div>
                                                <h4 className="font-bold text-text-primary text-lg">{log.title}</h4>
                                                <p className="text-sm font-semibold text-text-secondary mt-1 flex items-center gap-2">
                                                    Target: <span className="text-primary bg-primary-light px-2 py-0.5 rounded-[2px]">{log.audience}</span>
                                                </p>
                                            </div>
                                            <div className="bg-surface border border-border px-4 py-2 rounded-[2px] text-center w-full md:w-auto shadow-none">
                                                <p className="text-[10px] font-semibold uppercase text-text-muted">Trigger Time</p>
                                                <p className="font-bold text-text-primary text-sm">{log.date}</p>
                                            </div>
                                            <button 
                                                onClick={() => handleCancel(log.id)}
                                                disabled={cancelBroadcastMutation.isPending}
                                                className="text-error-text font-bold text-sm bg-error-bg px-4 py-2 rounded-[2px] hover:bg-error-bg transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                )}

                {/* TAB: HISTORY */}
                {activeTab === 'history' && (
                    <div className="bg-surface rounded-[2.5rem] shadow-none border border-border overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                        <div className="p-6 border-b border-border bg-surface-hover/50 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2"><History className="w-5 h-5 text-text-secondary"/> Dispatch Audit Log</h2>
                        </div>
                        <div className="p-0 overflow-x-auto">
                            {isLoadingHistory ? (
                                <div className="text-center py-10 text-text-secondary font-bold">Loading history...</div>
                            ) : (
                                <table className="w-full text-left text-sm text-text-secondary">
                                    <thead className="bg-surface-hover text-text-muted text-[10px] uppercase tracking-widest font-semibold">
                                        <tr>
                                            <th className="px-6 py-4">Status & Title</th>
                                            <th className="px-6 py-4">Delivery Audience</th>
                                            <th className="px-6 py-4">Dispatched At</th>
                                            <th className="px-6 py-4 text-right pr-6">Priority</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-surface">
                                        {historyLog.map(log => (
                                            <tr key={log.id} className="hover:bg-surface-hover transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <CheckCircle2 className="w-5 h-5 text-emerald-500"/>
                                                        <span className="font-bold text-text-primary">{log.title}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4"><span className="text-primary bg-primary-light font-semibold px-2 py-1 rounded">{log.audience}</span></td>
                                                <td className="px-6 py-4 font-medium text-text-secondary">{log.date}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <AdminStatusBadge 
                                                        status={log.priority} 
                                                        variant={log.priority === 'Urgent' ? 'error' : 'default'} 
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}
            </AdminPageWrapper>
        </DashboardLayout>
    );
}
