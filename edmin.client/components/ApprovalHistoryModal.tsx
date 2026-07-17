import React, { useEffect, useState } from 'react';
import { SupervisorAPI } from '@/utils/api';
import { X, Clock, CheckCircle2, AlertCircle, MessageSquare, ArrowLeftRight } from 'lucide-react';
import toast from 'react-hot-toast';

interface ApprovalHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    entityType: 'TEACHING_LOAD' | 'ENROLLMENT' | 'LEAVE' | 'ACTIVITY_REPORT';
    entityId: number;
    title: string;
}

export default function ApprovalHistoryModal({ isOpen, onClose, entityType, entityId, title }: ApprovalHistoryModalProps) {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            SupervisorAPI.getApprovalHistory(entityType, entityId)
                .then(data => setHistory(data))
                .catch(err => toast.error(err.message || 'Failed to load history'))
                .finally(() => setLoading(false));
        }
    }, [isOpen, entityType, entityId]);

    if (!isOpen) return null;

    const getActionIcon = (action: string) => {
        switch(action) {
            case 'SUBMITTED': return <ArrowLeftRight className="w-5 h-5 text-blue-500" />;
            case 'RECOMMENDED': return <CheckCircle2 className="w-5 h-5 text-indigo-500" />;
            case 'APPROVED': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
            case 'REJECTED': return <AlertCircle className="w-5 h-5 text-red-500" />;
            case 'COMMENTED': return <MessageSquare className="w-5 h-5 text-amber-500" />;
            case 'RETURNED': return <ArrowLeftRight className="w-5 h-5 text-orange-500" />;
            default: return <Clock className="w-5 h-5 text-slate-500" />;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-surface w-full max-w-2xl rounded-2xl shadow-xl flex flex-col max-h-[85vh] overflow-hidden animate-slide-up">
                
                <div className="flex items-center justify-between p-6 border-b border-border bg-background">
                    <div>
                        <h2 className="text-xl font-bold text-text-primary">Approval Timeline</h2>
                        <p className="text-sm text-text-secondary mt-1">{title}</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-hover rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                    {loading ? (
                        <div className="flex justify-center items-center h-32">
                            <span className="text-text-muted flex items-center gap-2">
                                <Clock className="w-5 h-5 animate-spin" /> Loading timeline...
                            </span>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="text-center p-8 bg-background rounded-xl border border-border">
                            <Clock className="w-10 h-10 text-text-muted mx-auto mb-3" />
                            <p className="text-text-secondary font-medium">No history recorded yet.</p>
                        </div>
                    ) : (
                        <div className="relative pl-6 space-y-8 before:absolute before:inset-0 before:ml-[35px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                            {history.map((log, idx) => (
                                <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                    {/* Icon */}
                                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-surface bg-background shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10`}>
                                        {getActionIcon(log.action)}
                                    </div>
                                    
                                    {/* Card */}
                                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-background p-4 rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                                log.action === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                                log.action === 'RECOMMENDED' ? 'bg-indigo-100 text-indigo-700' :
                                                log.action === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                                'bg-slate-100 text-slate-700'
                                            }`}>
                                                {log.action}
                                            </span>
                                            <time className="text-xs font-medium text-text-muted flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {new Date(log.createdAt).toLocaleString()}
                                            </time>
                                        </div>
                                        <p className="text-sm font-semibold text-text-primary mb-1">
                                            {log.actor?.fullname || log.actor?.username || 'System'}
                                        </p>
                                        {log.comments && (
                                            <div className="mt-3 p-3 bg-surface-hover rounded-lg border border-border/50 relative">
                                                <MessageSquare className="w-4 h-4 text-text-muted absolute top-3 right-3 opacity-30" />
                                                <p className="text-sm text-text-secondary italic">"{log.comments}"</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
