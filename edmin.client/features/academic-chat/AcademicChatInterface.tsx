'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../providers/AuthProvider';
import {
  AcademicChatService,
  AcademicChatSession,
  AcademicChatMessage,
  ChatableUser,
} from './AcademicChatService';
import {
  Send,
  Loader2,
  MessageSquare,
  BookOpen,
  Trash2,
  CheckCheck,
  Check,
  Plus,
  X,
  Search,
  User,
  ChevronLeft,
} from 'lucide-react';
import { MessageBar, MessageBarBody } from '@fluentui/react-components';

// ─── New Chat Modal ─────────────────────────────────────────────────────────

interface NewChatModalProps {
  onClose: () => void;
  onSessionCreated: (session: AcademicChatSession) => void;
}

function NewChatModal({ onClose, onSessionCreated }: NewChatModalProps) {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<ChatableUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    // Load default list
    handleSearch('');
  }, []);

  const handleSearch = async (q: string) => {
    try {
      setIsSearching(true);
      setError(null);
      const results = await AcademicChatService.searchUsers(q);
      setUsers(results);
    } catch (e: any) {
      setError('Failed to load users');
    } finally {
      setIsSearching(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => handleSearch(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const handleStart = async (targetUser: ChatableUser) => {
    try {
      setIsCreating(targetUser.userid);
      setError(null);
      const session = await AcademicChatService.createSession(targetUser.userid);
      onSessionCreated(session);
    } catch (e: any) {
      setError(e?.message || 'Failed to start conversation');
      setIsCreating(null);
    }
  };

  const roleColor: Record<string, string> = {
    FACULTY: 'bg-blue-100 text-blue-700',
    ADMIN: 'bg-purple-100 text-purple-700',
    STUDENT: 'bg-green-100 text-green-700',
    HR: 'bg-amber-100 text-amber-700',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in">
      <div className="bg-surface w-full max-w-md rounded-[4px] shadow-2xl border border-border overflow-hidden animate-in slide-in-from-bottom-4">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Plus className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-base font-bold text-text-primary">New Conversation</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-[2px] hover:bg-surface-hover text-text-muted hover:text-text-primary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-9 pr-4 py-2.5 border border-border rounded-[2px] bg-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-text-muted" />
            )}
          </div>
        </div>

        {/* Results */}
        <div className="overflow-y-auto max-h-72">
          {error && (
            <div className="p-4 text-sm text-red-600 bg-red-50 border-b border-border">{error}</div>
          )}

          {!isSearching && users.length === 0 ? (
            <div className="p-8 text-center text-text-secondary">
              <User className="w-10 h-10 mx-auto mb-3 text-text-muted" />
              <p className="text-sm font-semibold">No users found</p>
              <p className="text-xs mt-1 text-text-muted">Try a different search term</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {users.map((u) => (
                <li key={u.userid}>
                  <button
                    onClick={() => handleStart(u)}
                    disabled={isCreating === u.userid}
                    className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-surface-hover transition-colors text-left disabled:opacity-60"
                  >
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0 border border-primary/20">
                      {u.username[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate">{u.username}</p>
                      <p className="text-xs text-text-muted truncate">{u.email}</p>
                    </div>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full flex-shrink-0 ${roleColor[u.role] || 'bg-surface-hover text-text-secondary'}`}>
                      {u.role.toLowerCase()}
                    </span>
                    {isCreating === u.userid && (
                      <Loader2 className="w-4 h-4 animate-spin text-primary flex-shrink-0" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border bg-surface-hover/30">
          <p className="text-[11px] text-text-muted text-center">Select a person to open or start a conversation</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Interface ─────────────────────────────────────────────────────────

export function AcademicChatInterface() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<AcademicChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<AcademicChatSession | null>(null);
  const [messages, setMessages] = useState<AcademicChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchSessions(); }, []);
  useEffect(() => {
    if (activeSession) fetchMessages(activeSession.sessionid);
  }, [activeSession?.sessionid]);
  useEffect(() => { scrollToBottom(); }, [messages]);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  const fetchSessions = async () => {
    try {
      setIsLoadingSessions(true);
      setError(null);
      const data = await AcademicChatService.getSessions();
      setSessions(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load chat sessions');
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const fetchMessages = async (sessionId: number) => {
    try {
      setIsLoadingMessages(true);
      setError(null);
      const data = await AcademicChatService.getSession(sessionId);
      setMessages(data.messages || []);
      await AcademicChatService.markAsRead(sessionId);
    } catch (err: any) {
      setError(err?.message || 'Failed to load messages');
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeSession || !user) return;
    try {
      setIsSending(true);
      setError(null);
      const sentMessage = await AcademicChatService.sendMessage(activeSession.sessionid, newMessage);
      setMessages((prev) => [...prev, sentMessage]);
      setNewMessage('');
    } catch (err: any) {
      setError(err?.message || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    try {
      await AcademicChatService.deleteMessage(messageId);
      setMessages(prev =>
        prev.map(msg =>
          msg.messageid === messageId
            ? { ...msg, message: 'This message was deleted', deletedat: new Date().toISOString() }
            : msg
        )
      );
    } catch (err: any) {
      setError(err?.message || 'Failed to delete message');
    }
  };

  const handleSessionCreated = async (session: AcademicChatSession) => {
    setShowNewChatModal(false);
    // Merge into sessions list if new
    setSessions(prev => {
      const exists = prev.find(s => s.sessionid === session.sessionid);
      if (exists) return prev;
      return [session, ...prev];
    });
    // Fetch full session data and activate
    try {
      const full = await AcademicChatService.getSession(session.sessionid);
      setActiveSession(full);
      setMessages(full.messages || []);
    } catch {
      setActiveSession(session);
      setMessages([]);
    }
  };

  const getOtherParticipant = (session: AcademicChatSession) => {
    if (!user) return null;
    const currentUserId = Number((user as any)?.userId || (user as any)?.id);
    return session.studentid === currentUserId ? session.faculty : session.student;
  };

  const currentUserId = Number((user as any)?.userId || (user as any)?.id);

  return (
    <>
      {showNewChatModal && (
        <NewChatModal
          onClose={() => setShowNewChatModal(false)}
          onSessionCreated={handleSessionCreated}
        />
      )}

      <div className="flex h-[calc(100vh-8rem)] bg-surface rounded-[2px] shadow-sm overflow-hidden border border-border">
        {/* Sessions Sidebar */}
        <div className={`w-full md:w-80 border-r border-border flex flex-col bg-surface-hover/30 flex-shrink-0 ${activeSession ? 'hidden md:flex' : 'flex'}`}>
          {/* Sidebar Header */}
          <div className="p-4 border-b border-border bg-surface flex items-center justify-between">
            <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              Messages
              {sessions.length > 0 && (
                <span className="ml-1 text-[10px] font-bold text-text-muted bg-surface-hover border border-border px-1.5 py-0.5 rounded-full">
                  {sessions.length}
                </span>
              )}
            </h2>
            <button
              onClick={() => setShowNewChatModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-primary text-white text-xs font-semibold rounded-[2px] hover:bg-primary/90 transition-colors shadow-sm"
              title="Start a new conversation"
            >
              <Plus className="w-3.5 h-3.5" />
              New
            </button>
          </div>

          {/* Session List */}
          <div className="flex-1 overflow-y-auto">
            {isLoadingSessions ? (
              <div className="flex justify-center items-center h-32">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="p-8 text-center text-text-secondary mt-6">
                <div className="w-14 h-14 bg-surface border border-border rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-7 h-7 text-text-muted" />
                </div>
                <p className="font-bold text-text-primary text-sm">No conversations yet</p>
                <p className="text-xs text-text-muted mt-1">Click <strong>New</strong> to start one</p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {sessions.map((session) => {
                  const other = getOtherParticipant(session);
                  const isActive = activeSession?.sessionid === session.sessionid;
                  const lastMsg = session.messages?.[0];

                  return (
                    <li
                      key={session.sessionid}
                      onClick={() => setActiveSession(session)}
                      className={`px-4 py-3.5 cursor-pointer transition-colors border-l-2 ${
                        isActive
                          ? 'bg-primary-light border-primary'
                          : 'hover:bg-surface-hover border-transparent'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold text-sm border border-primary/20">
                          {other?.username?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={`text-sm font-bold truncate ${isActive ? 'text-primary' : 'text-text-primary'}`}>
                              {other?.username}
                            </p>
                          </div>
                          <p className="text-[10px] text-text-muted capitalize font-medium">{other?.role?.toLowerCase()}</p>
                          {lastMsg && (
                            <p className="text-[11px] text-text-secondary truncate mt-0.5">
                              {lastMsg.message}
                            </p>
                          )}
                        </div>
                      </div>
                      {session.courseoffering && (
                        <div className="mt-2 text-[9px] uppercase font-bold tracking-wider text-text-secondary flex items-center bg-surface border border-border px-1.5 py-0.5 rounded-[2px] w-fit">
                          <BookOpen className="w-2.5 h-2.5 mr-1" />
                          {session.courseoffering.course.code}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col bg-surface ${!activeSession ? 'hidden md:flex' : 'flex w-full'}`}>
          {activeSession ? (
            <>
              {/* Chat Header */}
              <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-surface shadow-sm">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setActiveSession(null)}
                    className="md:hidden flex items-center justify-center p-1.5 -ml-2 rounded-full text-text-secondary hover:bg-surface-hover transition-colors"
                    title="Back to messages"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20">
                    {getOtherParticipant(activeSession)?.username?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-text-primary">
                      {getOtherParticipant(activeSession)?.username}
                    </h3>
                    <p className="text-[11px] text-text-secondary capitalize font-medium">
                      {getOtherParticipant(activeSession)?.role?.toLowerCase()}
                    </p>
                  </div>
                </div>
                {activeSession.courseoffering && (
                  <div className="hidden sm:flex items-center text-[10px] uppercase tracking-wider font-bold text-text-secondary bg-surface-hover border border-border px-3 py-1.5 rounded-[2px]">
                    <BookOpen className="w-3 h-3 mr-1.5" />
                    {activeSession.courseoffering.course.code}
                  </div>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 bg-[#FAFAFA]">
                {isLoadingMessages ? (
                  <div className="flex justify-center items-center h-full">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-text-secondary">
                    <div className="w-16 h-16 bg-surface border border-border rounded-full flex items-center justify-center mb-4 shadow-sm">
                      <MessageSquare className="w-8 h-8 text-text-muted" />
                    </div>
                    <p className="text-sm font-bold">No messages yet</p>
                    <p className="text-xs mt-1 text-text-muted">Send a message to start the conversation.</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.senderid === currentUserId;
                    return (
                      <div key={msg.messageid} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        {/* Avatar for other person */}
                        {!isMe && (
                          <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs mr-2 flex-shrink-0 self-end mb-5">
                            {msg.sender?.username?.[0]?.toUpperCase() || '?'}
                          </div>
                        )}
                        <div className={`max-w-[70%] relative group`}>
                          {/* Delete button for own messages */}
                          {isMe && !msg.deletedat && (
                            <button
                              onClick={() => handleDeleteMessage(msg.messageid)}
                              className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-text-muted hover:text-red-500 rounded-full hover:bg-surface"
                              title="Delete message"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <div className={`px-4 py-2.5 rounded-2xl shadow-sm ${
                            isMe
                              ? 'bg-primary text-white rounded-br-sm'
                              : 'bg-white text-text-primary border border-border rounded-bl-sm'
                          } ${msg.deletedat ? 'opacity-60 italic' : ''}`}>
                            <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{msg.message}</p>
                          </div>
                          {/* Timestamp & Read receipt */}
                          <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <span className="text-[10px] text-text-muted">
                              {new Date(msg.sentat).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isMe && (
                              <span title={msg.messagestate}>
                                {msg.messagestate === 'SEEN' ? (
                                  <CheckCheck className="w-3 h-3 text-blue-500" />
                                ) : msg.messagestate === 'DELIVERED' ? (
                                  <CheckCheck className="w-3 h-3 text-text-muted" />
                                ) : (
                                  <Check className="w-3 h-3 text-text-muted" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Error Banner */}
              {error && (
                <div className="px-4 py-2">
                  <MessageBar intent="error">
                    <MessageBarBody>{error}</MessageBarBody>
                  </MessageBar>
                </div>
              )}

              {/* Message Input */}
              <div className="px-4 py-3 bg-surface border-t border-border">
                <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message... (Enter to send, Shift+Enter for newline)"
                    className="flex-1 px-4 py-2.5 border border-border rounded-2xl bg-[#FAFAFA] focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all text-sm resize-none"
                    disabled={isSending}
                    rows={1}
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
                    className="p-2.5 bg-primary text-white rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center justify-center flex-shrink-0"
                  >
                    {isSending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </form>
              </div>
            </>
          ) : (
            /* Empty State */
            <div className="flex-1 flex flex-col items-center justify-center bg-surface text-text-secondary">
              <div className="w-20 h-20 bg-[#FAFAFA] border border-border rounded-full flex items-center justify-center mb-6 shadow-sm">
                <MessageSquare className="w-10 h-10 text-text-muted" />
              </div>
              <p className="text-xl font-bold text-text-primary">Your Messages</p>
              <p className="text-sm mt-2 text-text-muted mb-6">Select a conversation or start a new one</p>
              <button
                onClick={() => setShowNewChatModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-[2px] hover:bg-primary/90 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                New Conversation
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
