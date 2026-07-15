'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { UserRole } from '@/types/types';
import { Bot, User, Send, Loader2, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function ChatContent() {
    const searchParams = useSearchParams();
    const [messages, setMessages] = useState<{ text: string, sender: 'bot' | 'user' }[]>([
        { text: 'Hello! I am your AI Assistant. How can I help you today?', sender: 'bot' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [userRole, setUserRole] = useState<UserRole>(UserRole.STUDENT);

    useEffect(() => {
        // First check URL params
        const roleParam = searchParams.get('role');
        if (roleParam) {
            setUserRole(roleParam as UserRole);
            return;
        }

        // If no param, try to infer from referrer or current path if possible
        if (typeof window !== 'undefined') {
            const path = window.location.pathname;
            if (path.includes('/faculty')) setUserRole(UserRole.FACULTY);
            else if (path.includes('/admin')) setUserRole(UserRole.ADMIN);
            else if (path.includes('/hr')) setUserRole(UserRole.HR);
        }
    }, [searchParams]);

    const sendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        setMessages(prev => [...prev, { text: input, sender: 'user' }]);
        setInput('');
        setLoading(true);

        setTimeout(() => {
            setMessages(prev => [...prev, { text: "I'm a prototype AI! Our Quiz Generator for faculty is now active, please check that if you need educational content.", sender: 'bot' }]);
            setLoading(false);
        }, 1500);
    };

    return (
        <DashboardLayout
            userRole={userRole}
            userName={userRole === UserRole.FACULTY ? "Prof. User" : "Edmin User"}
            notifications={[]}
            currentPath="/dashboard/shared/chat"
        >
            <div className="max-w-4xl mx-auto px-4 py-8 h-[calc(100vh-80px)] flex flex-col">
                <div className="bg-surface rounded-t-2xl p-6 shadow-none border border-border flex items-center gap-4 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 to-emerald-500"></div>
                    <div className="p-3 bg-background rounded-[2px] text-primary">
                        <Bot className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-text-primary">Edmin AI Assistant</h1>
                        <p className="text-sm text-text-secondary">Fast (<span className="font-semibold text-primary">{'<5s'}</span>) intelligent responses.</p>
                    </div>
                    {userRole === UserRole.FACULTY && (
                        <Link href="/dashboard/faculty/ai-quiz" className="ml-auto bg-purple-600 text-white px-4 py-2 rounded-[2px] text-xs font-bold hover:bg-purple-700 transition-all flex items-center gap-2  shadow-none shadow-purple-200">
                            <Sparkles className="w-4 h-4" /> Go to AI Quiz Gen
                        </Link>
                    )}
                </div>

                <div className="flex-1 bg-background/50 border-x border-border overflow-y-auto p-6 space-y-4">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex gap-3 max-w-[80%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
                            <div className={`p-2 rounded-[2px] h-fit flex-shrink-0 ${msg.sender === 'user' ? 'bg-primary-light text-primary' : 'bg-surface border text-primary shadow-none'}`}>
                                {msg.sender === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                            </div>
                            <div className={`p-4 rounded-[2px] shadow-none text-sm ${msg.sender === 'user' ? 'bg-primary text-white rounded-tr-sm' : 'bg-surface border text-text-primary rounded-tl-sm'}`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex gap-3 max-w-[80%]">
                            <div className="p-2 rounded-[2px] h-fit flex-shrink-0 bg-surface border text-primary shadow-none">
                                <Bot className="w-5 h-5" />
                            </div>
                            <div className="p-4 rounded-[2px] bg-surface border text-text-secondary rounded-tl-sm flex gap-2 items-center">
                                <Loader2 className="w-4 h-4 animate-spin" /> Thinking...
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-surface rounded-b-2xl p-4 shadow-none border border-border">
                    <form onSubmit={sendMessage} className="flex gap-3">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask anything..."
                            className="flex-1 border border-border rounded-[2px] px-4 py-3 outline-none focus:ring-2 focus:ring-teal-500 transition-all bg-background focus:bg-surface"
                        />
                        <button disabled={loading} className="bg-teal-600 hover:bg-teal-700 text-white p-3 rounded-[2px] transition-all shadow-none shadow-teal-200">
                            <Send className="w-5 h-5" />
                        </button>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
}
