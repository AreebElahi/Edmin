'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../providers/AuthProvider';
import { ComplaintService, Complaint, ComplaintMessage } from './ComplaintService';
import { CreateComplaintModal } from './CreateComplaintModal';
import {
  Loader2,
  Plus,
  Send,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  Headphones,
  User,
  ChevronLeft,
} from 'lucide-react';
import {
  Button,
  Badge,
  Input,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
} from '@fluentui/react-components';

export function ComplaintInterface() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [activeComplaint, setActiveComplaint] = useState<Complaint | null>(null);
  const [messages, setMessages] = useState<ComplaintMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchComplaints();
  }, []);

  useEffect(() => {
    if (activeComplaint) {
      fetchMessages(activeComplaint.complaintid);
    }
  }, [activeComplaint?.complaintid]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchComplaints = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await ComplaintService.getComplaints();
      setComplaints(data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load complaints');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (complaintId: number) => {
    try {
      setIsLoadingMessages(true);
      setError(null);
      const data = await ComplaintService.getComplaintById(complaintId);
      setMessages(data.messages || []);
      // If we got updated data, maybe update the active complaint in the list
      setActiveComplaint(data);
      
      const idx = complaints.findIndex(c => c.complaintid === data.complaintid);
      if (idx !== -1) {
        const newComplaints = [...complaints];
        newComplaints[idx] = data;
        setComplaints(newComplaints);
      }

    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load messages');
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeComplaint || !user) return;

    try {
      setIsSending(true);
      setError(null);
      const sentMessage = await ComplaintService.sendComplaintMessage(
        activeComplaint.complaintid,
        newMessage
      );
      
      setMessages((prev) => [...prev, sentMessage]);
      setNewMessage('');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <Badge color="danger" icon={<AlertCircle className="w-3 h-3" />}>Open</Badge>;
      case 'IN_PROGRESS':
        return <Badge color="warning" icon={<Clock className="w-3 h-3" />}>In Progress</Badge>;
      case 'RESOLVED':
        return <Badge color="success" icon={<CheckCircle className="w-3 h-3" />}>Resolved</Badge>;
      case 'CLOSED':
        return <Badge appearance="outline">Closed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <Badge color="danger" appearance="filled">URGENT</Badge>;
      case 'HIGH':
        return <Badge color="danger" appearance="outline">High</Badge>;
      case 'MEDIUM':
        return <Badge color="warning" appearance="outline">Medium</Badge>;
      case 'LOW':
        return <Badge color="success" appearance="outline">Low</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-surface rounded-[2px] shadow-sm overflow-hidden border border-border">
      {/* Left Pane: Complaints List */}
      <div className={`w-full md:w-1/3 border-r border-border flex flex-col bg-surface-hover/30 ${activeComplaint ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-5 border-b border-border bg-surface flex justify-between items-center">
          <h2 className="text-lg font-bold text-text-primary flex items-center">
            <Headphones className="w-5 h-5 mr-2 text-primary" />
            Support Center
          </h2>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-[2px] flex items-center hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4 mr-1" /> New Ticket
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : complaints.length === 0 ? (
            <div className="p-8 text-center text-text-secondary mt-10">
              <div className="w-16 h-16 bg-surface border border-border rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                 <Headphones className="w-8 h-8 text-text-muted" />
              </div>
              <p className="font-bold text-text-primary">No active tickets</p>
              <p className="text-xs mt-1">If you have any issues, please create a new ticket.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {complaints.map((complaint) => {
                const isActive = activeComplaint?.complaintid === complaint.complaintid;
                
                return (
                  <li
                    key={complaint.complaintid}
                    onClick={() => setActiveComplaint(complaint)}
                    className={`p-5 cursor-pointer transition-colors ${
                      isActive ? 'bg-primary-light border-l-4 border-primary' : 'hover:bg-surface-hover border-l-4 border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-[2px] tracking-wider">
                        {complaint.tokenid}
                      </span>
                      <div className="flex gap-2">
                        {getPriorityBadge(complaint.priority)}
                        {getStatusBadge(complaint.status)}
                      </div>
                    </div>
                    <h3 className={`text-sm font-bold line-clamp-1 ${isActive ? 'text-primary' : 'text-text-primary'}`}>
                      {complaint.subject}
                    </h3>
                    <p className="text-[11px] text-text-secondary mt-1.5 flex justify-between font-medium">
                      <span>{new Date(complaint.createdat).toLocaleDateString()}</span>
                      <span className="capitalize text-text-muted">{complaint.createdby.username} ({complaint.createdby.role.toLowerCase()})</span>
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Right Pane: Complaint Details & Chat */}
      <div className={`flex-1 flex flex-col bg-surface relative ${!activeComplaint ? 'hidden md:flex' : 'flex w-full'}`}>
        {activeComplaint ? (
          <>
            {/* Header */}
            <div className="p-6 border-b border-border bg-surface shadow-sm z-10">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <button 
                      onClick={() => setActiveComplaint(null)}
                      className="md:hidden flex items-center justify-center p-1.5 -ml-2 rounded-full text-text-secondary hover:bg-surface-hover transition-colors"
                      title="Back to list"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="font-mono text-[10px] font-bold text-text-secondary bg-surface-hover border border-border px-2 py-1 rounded-[2px] tracking-wider whitespace-nowrap">
                      {activeComplaint.tokenid}
                    </span>
                    <div className="flex gap-2">
                      {getPriorityBadge(activeComplaint.priority)}
                      {getStatusBadge(activeComplaint.status)}
                    </div>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-text-primary mt-1">
                    {activeComplaint.subject}
                  </h2>
                  <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-text-secondary mt-3">
                    <span className="flex items-center whitespace-nowrap"><Clock className="w-3.5 h-3.5 mr-1.5"/> SLA Due: {activeComplaint.sladuedate ? new Date(activeComplaint.sladuedate).toLocaleString() : 'N/A'}</span>
                    <span className="flex items-center whitespace-nowrap"><User className="w-3.5 h-3.5 mr-1.5"/> Assignee: <strong className="ml-1 text-primary">{activeComplaint.assignedto ? activeComplaint.assignedto.username : 'Unassigned'}</strong></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#FAFAFA]">
              {isLoadingMessages ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  {/* Initial Description Message */}
                  {(() => {
                    const currentUserId = Number((user as any)?.userId || (user as any)?.id);
                    const currentUserIsSupport = (user as any)?.role === 'ADMIN' || (user as any)?.role === 'HR';
                    const isMe = activeComplaint.createdby?.userid === currentUserId;
                    const isSupport = activeComplaint.createdby?.role !== 'STUDENT' && activeComplaint.createdby?.role !== 'FACULTY';
                    const isRightSide = currentUserIsSupport ? isSupport : isMe;
                    
                    return (
                      <div className={`flex ${isRightSide ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[80%] rounded-[2px] px-4 py-3 shadow-sm ${
                            isRightSide
                              ? 'bg-primary text-white'
                              : isSupport 
                                ? 'bg-[#E3F2FD] text-[#0D47A1] border border-[#BBDEFB]'
                                : 'bg-surface text-text-primary border border-border'
                          }`}
                        >
                          {!isMe && (
                            <p className={`text-[10px] uppercase tracking-wider font-bold mb-1.5 ${isRightSide ? 'text-white/80' : isSupport ? 'text-[#1565C0]' : 'text-text-secondary'}`}>
                              {activeComplaint.createdby?.username || 'User'} {isSupport && '(Support Agent)'}
                            </p>
                          )}
                          <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{activeComplaint.description}</p>
                          <p
                            className={`text-[9px] font-bold mt-2 text-right ${
                              isRightSide ? 'text-white/70' : 'text-text-muted'
                            }`}
                          >
                            {new Date(activeComplaint.createdat).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })()}

                  {messages.map((msg) => {
                      const currentUserId = Number((user as any)?.userId || (user as any)?.id);
                      const currentUserIsSupport = (user as any)?.role === 'ADMIN' || (user as any)?.role === 'HR';
                      const isMe = msg.senderid === currentUserId;
                      const isSupport = msg.sender.role !== 'STUDENT' && msg.sender.role !== 'FACULTY';
                      const isRightSide = currentUserIsSupport ? isSupport : isMe;
                      
                      return (
                        <div
                          key={msg.complaintmessageid}
                          className={`flex ${isRightSide ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-[2px] px-4 py-3 shadow-sm ${
                              isRightSide
                                ? 'bg-primary text-white'
                                : isSupport 
                                  ? 'bg-[#E3F2FD] text-[#0D47A1] border border-[#BBDEFB]'
                                  : 'bg-surface text-text-primary border border-border'
                            }`}
                          >
                            {!isMe && (
                              <p className={`text-[10px] uppercase tracking-wider font-bold mb-1.5 ${isRightSide ? 'text-white/80' : isSupport ? 'text-[#1565C0]' : 'text-text-secondary'}`}>
                                {msg.sender.username} {isSupport && '(Support Agent)'}
                              </p>
                            )}
                            <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{msg.message}</p>
                            <p
                              className={`text-[9px] font-bold mt-2 text-right ${
                                isRightSide ? 'text-white/70' : 'text-text-muted'
                              }`}
                            >
                              {new Date(msg.sentat).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  }
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Error Banner */}
            {error && (
              <div className="px-4 py-2">
                <MessageBar intent="error">
                  <MessageBarBody>{error}</MessageBarBody>
                </MessageBar>
              </div>
            )}

            {/* Input Area */}
            <div className="p-4 bg-surface border-t border-border">
              {activeComplaint.status === 'CLOSED' || activeComplaint.status === 'RESOLVED' ? (
                <div className="text-center p-3 bg-surface-hover rounded-[2px] border border-border">
                  <p className="text-xs font-bold text-text-secondary flex items-center justify-center tracking-wide">
                    <CheckCircle className="w-4 h-4 mr-2 text-primary" />
                    This ticket has been resolved or closed and cannot accept new messages.
                  </p>
                </div>
              ) : ((user as any)?.role === 'ADMIN' || (user as any)?.role === 'HR') && activeComplaint.assignedto && activeComplaint.assignedto.userid !== Number((user as any)?.userId || (user as any)?.id) ? (
                <div className="text-center p-3 bg-red-50 rounded-[2px] border border-red-100">
                  <p className="text-xs font-bold text-red-600 flex items-center justify-center tracking-wide">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    This ticket is being handled by {activeComplaint.assignedto.username}.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="flex space-x-3 items-end">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a reply or provide more details..."
                    className="flex-1 px-4 py-3 border border-border rounded-[2px] bg-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all text-sm resize-none"
                    disabled={isSending}
                    rows={2}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || isSending}
                    className="p-3 h-11 w-11 bg-primary text-white rounded-[2px] hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center justify-center shrink-0"
                  >
                    {isSending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </form>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-surface text-text-secondary">
            <div className="w-20 h-20 bg-[#FAFAFA] border border-border rounded-full flex items-center justify-center mb-6 shadow-sm">
                <Headphones className="w-10 h-10 text-text-muted" />
            </div>
            <p className="text-xl font-bold text-text-primary">No ticket selected</p>
            <p className="text-sm mt-2 text-text-muted">Choose a ticket from the sidebar to view details and updates.</p>
          </div>
        )}
      </div>

      <CreateComplaintModal
        isOpen={isCreateModalOpen}
        setIsOpen={setIsCreateModalOpen}
        onSuccess={(newComplaint) => {
          setComplaints([newComplaint, ...complaints]);
          setActiveComplaint(newComplaint);
        }}
      />
    </div>
  );
}
