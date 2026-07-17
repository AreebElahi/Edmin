'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { UserRole } from '@/types/types';
import { 
    Ticket as TicketIcon, CheckCircle2, Clock, User, MessageSquare, 
    ChevronRight, CornerDownRight, ShieldAlert, CircleDot, Send
} from 'lucide-react';
import { useState } from 'react';
import { useInfiniteTickets } from '@/features/tickets/hooks/useInfiniteTickets';
import { useTicketStream } from '@/features/tickets/hooks/useTicketStream';
import { getTicketById, resolveTicket, assignTicket, createMessage, getAssignableStaff } from '@/features/tickets/api/ticketApi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ticket } from '@/features/tickets/types';
import { CreateTicketModal } from '@/features/tickets/components/CreateTicketModal';
import { Can } from '@/providers/RBACProvider';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';

import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
export default function TicketManagementPage() {
    const { data: currentUser } = useCurrentUser();
    // Mount SSE for live updates
    useTicketStream();
    
    const queryClient = useQueryClient();
    
    const [activeTicketId, setActiveTicketId] = useState<number | null>(null);
    const [replyText, setReplyText] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Fetch Tickets
    const { 
        data, 
        isLoading,
        fetchNextPage, 
        hasNextPage, 
        isFetchingNextPage 
    } = useInfiniteTickets({ limit: 20 });

    const tickets = data?.pages.flatMap((page) => page.tickets) || [];

    // Fetch Active Ticket Details
    const { data: activeTicket, isLoading: isTicketLoading } = useQuery({
        queryKey: ['ticket', activeTicketId],
        queryFn: () => getTicketById(activeTicketId!),
        enabled: !!activeTicketId,
    });

    // Fetch Staff for Assignment
    const { data: staffMembers } = useQuery({
        queryKey: ['assignableStaff'],
        queryFn: getAssignableStaff
    });

    // Mutations
    const assignMutation = useMutation({
        mutationFn: (variables: { id: number, staffId: number, version: number }) => 
            assignTicket(variables.id, { assignee_id: variables.staffId, version: variables.version }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
            queryClient.invalidateQueries({ queryKey: ['ticket', activeTicketId] });
        }
    });

    const resolveMutation = useMutation({
        mutationFn: (variables: { id: number, version: number }) => 
            resolveTicket(variables.id, { resolutionText: "Marked as resolved.", version: variables.version }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
            queryClient.invalidateQueries({ queryKey: ['ticket', activeTicketId] });
        }
    });

    const replyMutation = useMutation({
        mutationFn: (variables: { id: number, text: string }) => 
            createMessage(variables.id, { content: variables.text, is_internal: false }),
        onSuccess: () => {
            setReplyText('');
            queryClient.invalidateQueries({ queryKey: ['ticket', activeTicketId] });
        }
    });

    const handleStatusChange = (newStatus: string) => {
        if (!activeTicket) return;
        if (newStatus === 'RESOLVED') {
            resolveMutation.mutate({ id: activeTicket.id, version: activeTicket.version });
        }
    };

    const handleAssign = (staffIdStr: string) => {
        if (!activeTicket) return;
        const staffId = parseInt(staffIdStr, 10);
        assignMutation.mutate({ id: activeTicket.id, staffId, version: activeTicket.version });
    };

    const handleReply = (e: React.FormEvent) => {
        e.preventDefault();
        if(!activeTicket || !replyText.trim()) return;
        replyMutation.mutate({ id: activeTicket.id, text: replyText });
    };

    const formatStatus = (status: string) => {
        if (status === 'OPEN') return 'Open';
        if (status === 'IN_PROGRESS') return 'In Progress';
        if (status === 'RESOLVED') return 'Resolved';
        return status;
    };

    return (
        <DashboardLayout userRole={UserRole.ADMIN} userName={currentUser?.fullName || 'Admin'} notifications={[]}>
            <AdminPageWrapper>
                
                {/* Header Sub-Nav */}
                <AdminPageHeader
                    icon={TicketIcon}
                    title="Complaint Resolution Center"
                    subtitle="Global view of all student issues, routing, and resolution metrics."
                    actions={
                        <Can I="CREATE" a="TICKETS">
                            <button 
                                onClick={() => setIsCreateModalOpen(true)}
                                className="flex items-center gap-1.5 px-4 py-2 bg-white text-primary hover:bg-slate-100 rounded-[2px] text-sm font-semibold transition-colors w-full sm:w-auto justify-center"
                            >
                                + New Ticket
                            </button>
                        </Can>
                    }
                />

                <div className="flex-1 flex gap-6 overflow-hidden">
                    {/* TICKETS LIST (Left Panel) */}
                    <div className="w-full lg:w-5/12 xl:w-1/3 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar pb-12">
                        {isLoading ? (
                             <div className="text-center text-text-secondary py-10 font-medium">Loading tickets...</div>
                        ) : tickets.length === 0 ? (
                             <div className="text-center text-text-secondary py-10 font-medium">No tickets found.</div>
                        ) : tickets.map((t: any) => (
                            <div 
                                key={t.id} 
                                onClick={() => setActiveTicketId(t.id)}
                                className={`cursor-pointer rounded-[2px] p-5 border-2 transition-all ${activeTicketId === t.id ? 'bg-primary-light border-indigo-300 shadow-none transform scale-[1.02]' : 'bg-surface border-border hover:border-border hover:shadow-none'}`}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <span className={`text-[10px] font-semibold uppercase tracking-widest px-2 py-1 rounded-[2px] ${t.status === 'OPEN' ? 'bg-warning-bg text-warning-text' : t.status === 'IN_PROGRESS' ? 'bg-primary-light text-primary' : 'bg-background text-success-text'}`}>
                                        {t.status === 'OPEN' ? <CircleDot className="w-3 h-3 inline mr-1 pb-0.5"/> : t.status === 'IN_PROGRESS' ? <Clock className="w-3 h-3 inline mr-1 pb-0.5"/> : <CheckCircle2 className="w-3 h-3 inline mr-1 pb-0.5"/>}
                                        {formatStatus(t.status)}
                                    </span>
                                    <span className="text-xs font-bold text-text-muted">{new Date(t.created_at).toLocaleDateString()}</span>
                                </div>
                                <h3 className="font-bold text-text-primary leading-tight mb-2">{t.subject}</h3>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-medium text-text-secondary flex items-center gap-1.5"><User className="w-4 h-4 text-slate-300"/> {t.requester?.name || t.requester?.email || 'Unknown'}</span>
                                    <span className="text-[10px] uppercase font-semibold tracking-widest bg-background text-text-secondary px-2 rounded">{t.source_type}</span>
                                </div>
                            </div>
                        ))}
                        
                        {hasNextPage && (
                            <button 
                                onClick={() => fetchNextPage()} 
                                disabled={isFetchingNextPage}
                                className="w-full py-3 mt-2 text-sm font-bold text-primary bg-primary-light rounded-[2px] hover:bg-indigo-100 transition-colors disabled:opacity-50"
                            >
                                {isFetchingNextPage ? 'Loading...' : 'Load More'}
                            </button>
                        )}
                    </div>

                    {/* TICKET DETAILS (Right Panel) */}
                    {activeTicketId ? (
                        <div className="hidden lg:flex flex-1 bg-surface rounded-[2.5rem] border border-border shadow-none overflow-hidden flex-col">
                            {isTicketLoading || !activeTicket ? (
                                <div className="flex-1 flex items-center justify-center text-text-muted font-medium">
                                    Loading ticket details...
                                </div>
                            ) : (
                                <>
                                    {/* Detailed Header */}
                                    <div className="p-6 border-b border-border bg-surface-hover flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <h2 className="text-2xl font-bold text-text-primary">{activeTicket.subject}</h2>
                                                <span className="text-xs font-semibold text-text-muted">(T-{activeTicket.id})</span>
                                            </div>
                                            <p className="text-sm font-medium text-text-secondary mb-6">Filed by <b className="text-text-primary">{activeTicket.requester?.name || activeTicket.requester?.email || 'Unknown'}</b> under <b>{activeTicket.source_type}</b> category on {new Date(activeTicket.created_at).toLocaleDateString()}</p>
                                            
                                            <div className="flex gap-4 items-center bg-surface p-2 rounded-[2px] border border-border shadow-none w-fit">
                                                <div className="flex flex-col border-r border-border pr-4">
                                                    <span className="text-[10px] font-semibold uppercase text-text-muted ml-1">Status Tracking</span>
                                                    <select 
                                                        value={activeTicket.status} 
                                                        onChange={(e) => handleStatusChange(e.target.value)}
                                                        className={`text-sm font-bold outline-none cursor-pointer ${activeTicket.status === 'RESOLVED' ? 'text-success-text' : activeTicket.status === 'OPEN' ? 'text-warning-text' : 'text-primary'}`}
                                                    >
                                                        <option value="OPEN">● Open Request</option>
                                                        <option value="IN_PROGRESS">● In Progress</option>
                                                        <option value="RESOLVED">● Marked Resolved</option>
                                                    </select>
                                                </div>
                                                <div className="flex flex-col pl-2">
                                                    <span className="text-[10px] font-semibold uppercase text-text-muted ml-1">Staff Assignment</span>
                                                    <select 
                                                        value={activeTicket.assignee_id || ''} 
                                                        onChange={(e) => handleAssign(e.target.value)}
                                                        className="text-sm font-bold outline-none cursor-pointer text-text-primary"
                                                    >
                                                        <option value="" disabled>Unassigned (Admin Bucket)</option>
                                                        {staffMembers?.map((s: any) => <option key={s.id} value={s.id}>{s.name} ({s.departmentRole})</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Response History View */}
                                    <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-surface-hover/50">
                                        {activeTicket.messages?.map((m: any) => {
                                            const isAdmin = m.sender?.role !== 'STUDENT';
                                            return (
                                                <div key={m.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[75%] rounded-[2px] p-4 ${
                                                        isAdmin ? 'bg-primary text-white shadow-none shadow-indigo-200 rounded-tr-sm' 
                                                        : 'bg-surface border text-text-primary border-border shadow-none rounded-tl-sm'
                                                    }`}>
                                                        <div className={`text-[10px] font-semibold uppercase tracking-widest mb-2 ${isAdmin ? 'text-indigo-200' : 'text-text-muted'}`}>
                                                            {m.sender?.name || m.sender?.email || 'System'} • {new Date(m.created_at).toLocaleTimeString()}
                                                        </div>
                                                        <div className={isAdmin ? '' : 'flex items-center gap-2'}>
                                                            {!isAdmin && <CornerDownRight className="w-3 h-3 text-text-muted"/>}
                                                            {m.content}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {activeTicket.messages?.length === 0 && (
                                            <div className="text-center text-sm font-medium text-text-muted mt-10">No messages yet.</div>
                                        )}
                                    </div>

                                    {/* Reply Input Box */}
                                    <div className="p-4 border-t border-border bg-surface">
                                        <form onSubmit={handleReply} className="flex gap-4">
                                            <input 
                                                type="text" 
                                                value={replyText}
                                                onChange={e => setReplyText(e.target.value)}
                                                placeholder="Type an administrative response or internal note..." 
                                                className="flex-1 bg-surface-hover border border-border rounded-[2px] px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
                                                disabled={replyMutation.isPending || activeTicket.status === 'RESOLVED'}
                                            />
                                            <button 
                                                type="submit" 
                                                disabled={!replyText.trim() || replyMutation.isPending || activeTicket.status === 'RESOLVED'} 
                                                className="bg-indigo-600 disabled:bg-indigo-300 disabled:shadow-none hover:bg-primary-hover text-white font-bold px-6 rounded-[2px] flex items-center gap-2 shadow-none transition-all"
                                            >
                                                {replyMutation.isPending ? <div className="w-4 h-4 border-2 border-white/50 border-t-transparent rounded-[2px] animate-spin"/> : <Send className="w-4 h-4"/>} 
                                                Reply
                                            </button>
                                        </form>
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="hidden lg:flex flex-1 items-center justify-center bg-surface-hover border-2 border-dashed border-border rounded-[2px] animate-in fade-in">
                            <div className="text-center text-text-muted flex flex-col items-center">
                                <ShieldAlert className="w-16 h-16 mb-4 text-slate-300"/>
                                <p className="font-bold text-lg text-text-secondary mb-1">No Ticket Selected</p>
                                <p className="text-sm">Select a complaint from the queue to view full history and respond.</p>
                            </div>
                        </div>
                    )}
                </div>
                <CreateTicketModal 
                    isOpen={isCreateModalOpen} 
                    onClose={() => setIsCreateModalOpen(false)} 
                />
            </AdminPageWrapper>
        </DashboardLayout>
    );
}
