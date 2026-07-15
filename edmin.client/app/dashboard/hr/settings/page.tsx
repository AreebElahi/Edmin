'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { UserRole, Notification } from '@/types/types';
import { Home, Bell, Globe, Shield, Moon, Phone, Mail, User, Save, CheckCircle, Tag, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useCurrentProfile, useUpdateProfile } from '@/features/profile/hooks/useProfile';
import AvatarUpload from '@/components/AvatarUpload';

export default function HRSettingsPage() {
    const { data: profile, isLoading } = useCurrentProfile();
    const updateProfile = useUpdateProfile();

    const userName = profile?.fullName || profile?.username || 'HR Manager';
    const [phone, setPhone] = useState('');
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (profile?.phone) setPhone(profile.phone);
    }, [profile?.phone]);

    const handleSaveContact = async () => {
        await updateProfile.mutateAsync({ phone });
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <DashboardLayout
            userRole={UserRole.HR}
            userName={userName}
            notifications={[]}
            currentPath="/dashboard/hr/settings"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Breadcrumb */}
                <nav className="flex mb-6" aria-label="Breadcrumb">
                    <ol className="flex items-center space-x-2 bg-surface px-3 py-2 rounded-[2px] border border-border shadow-none">
                        <li>
                            <Link href="/dashboard/hr" className="text-text-secondary hover:text-success-text transition-colors">
                                <Home className="w-4 h-4" />
                            </Link>
                        </li>
                        <li><span className="text-border-hover">/</span></li>
                        <li><span className="text-sm font-medium text-text-primary">Account Settings</span></li>
                    </ol>
                </nav>

                {/* Header */}
                <div className="bg-surface rounded-[2px] p-6 shadow-none border border-border relative overflow-hidden mb-8">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-slate-500"></div>
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="w-14 h-14 rounded-[2px] bg-background flex items-center justify-center text-success-text text-2xl font-bold shrink-0">
                            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : userName.charAt(0)}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-text-primary">{isLoading ? 'Loading...' : userName}</h1>
                            <p className="text-sm text-text-secondary">{isLoading ? '' : (profile?.institutionalEmail || profile?.email || '')}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Contact Info Card */}
                    <div className="lg:col-span-1">
                        <div className="bg-surface rounded-[2px] p-6 shadow-none border border-border space-y-5">
                            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                                <User className="w-5 h-5 text-success-text" />
                                Contact Information
                            </h2>

                            {/* Avatar Upload */}
                            <div className="flex justify-center py-2">
                                <AvatarUpload
                                    userId={profile?.userId}
                                    role={profile?.role}
                                    displayName={userName}
                                    size="md"
                                    accentColor="bg-background"
                                    accentTextColor="text-success-text"
                                />
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Institutional Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                        <input
                                            type="email"
                                            value={isLoading ? 'Loading...' : (profile?.institutionalEmail || profile?.email || '—')}
                                            readOnly
                                            className="w-full pl-9 pr-4 py-2.5 rounded-[2px] border border-border bg-background text-text-secondary text-sm outline-none cursor-not-allowed"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Staff ID</label>
                                    <div className="relative">
                                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                        <input
                                            type="text"
                                            value={isLoading ? 'Loading...' : (profile?.identifier || '—')}
                                            readOnly
                                            className="w-full pl-9 pr-4 py-2.5 rounded-[2px] border border-border bg-background text-text-secondary text-sm outline-none cursor-not-allowed font-mono"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Phone Number</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={e => setPhone(e.target.value)}
                                            placeholder="+1 (555) 000-0000"
                                            className="w-full pl-9 pr-4 py-2.5 rounded-[2px] border border-border focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 outline-none transition-all text-sm text-text-primary bg-surface"
                                        />
                                    </div>
                                    <p className="text-xs text-text-muted mt-1">Visible to admin and faculty</p>
                                </div>
                            </div>

                            <button
                                onClick={handleSaveContact}
                                disabled={updateProfile.isPending || isLoading}
                                className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-[2px] transition-all shadow-none shadow-emerald-200 disabled:opacity-60 hover:scale-[1.02] active:scale-[0.98] text-sm"
                            >
                                {updateProfile.isPending ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                                ) : saved ? (
                                    <><CheckCircle className="w-4 h-4" /> Saved!</>
                                ) : (
                                    <><Save className="w-4 h-4" /> Save Contact Info</>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Right — Notifications + Preferences */}
                    <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-surface rounded-[2px] p-6 shadow-none border border-border space-y-6">
                            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                                <Bell className="w-5 h-5 text-success-text" />
                                HR Notifications
                            </h2>
                            <div className="space-y-4">
                                {[
                                    { title: 'Leave Applications', desc: 'Get notified when a faculty member applies for leave' },
                                    { title: 'Employee Onboarding', desc: 'Alerts for new employee registration status' },
                                    { title: 'Payroll Deadlines', desc: 'Reminders for monthly payroll processing' }
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3.5 rounded-[2px] border border-border hover:bg-background transition-colors">
                                        <div>
                                            <h3 className="font-semibold text-text-primary text-sm">{item.title}</h3>
                                            <p className="text-xs text-text-secondary">{item.desc}</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                                            <input type="checkbox" className="sr-only peer" defaultChecked />
                                            <div className="w-11 h-6 bg-border peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-100 rounded-[2px] peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-surface after:border-gray-300 after:border after:rounded-[2px] after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-surface rounded-[2px] p-6 shadow-none border border-border space-y-6">
                            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                                <Shield className="w-5 h-5 text-primary" />
                                System Preferences
                            </h2>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3.5 rounded-[2px] border border-border hover:bg-background transition-colors">
                                    <div className="flex items-center gap-3">
                                        <Globe className="w-5 h-5 text-text-muted" />
                                        <div>
                                            <h3 className="font-semibold text-text-primary text-sm">Language</h3>
                                            <p className="text-xs text-text-secondary">English (United States)</p>
                                        </div>
                                    </div>
                                    <button className="text-success-text font-semibold text-sm">Change</button>
                                </div>
                                <div className="flex items-center justify-between p-3.5 rounded-[2px] border border-border hover:bg-background transition-colors">
                                    <div className="flex items-center gap-3">
                                        <Moon className="w-5 h-5 text-text-muted" />
                                        <div>
                                            <h3 className="font-semibold text-text-primary text-sm">Dark Mode</h3>
                                            <p className="text-xs text-text-secondary">Use system theme</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" />
                                        <div className="w-11 h-6 bg-border peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-100 rounded-[2px] peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-surface after:border-gray-300 after:border after:rounded-[2px] after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
