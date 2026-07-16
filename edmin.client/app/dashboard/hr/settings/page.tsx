'use client';

import DashboardLayout from '@/components/DashboardLayout';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { UserRole, Notification } from '@/types/types';
import { Home, Bell, Globe, Shield, Moon, Phone, Mail, User, Save, CheckCircle, Tag, Loader2, Settings } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useCurrentProfile, useUpdateProfile } from '@/features/profile/hooks/useProfile';
import AvatarUpload from '@/components/AvatarUpload';

export default function HRSettingsPage() {
    const { data: profile, isLoading } = useCurrentProfile();
    const updateProfile = useUpdateProfile();

    const userName = profile?.role === 'HR' ? 'Test_Hr' : (profile?.fullName || profile?.username || 'Test_Hr');
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
            <AdminPageWrapper>
                <AdminPageHeader
                    icon={Settings}
                    title="HR Settings & Compliance"
                    subtitle="Manage account details, notifications, and system preferences"
                    backHref="/dashboard/hr"
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Contact Info Card */}
                    <div className="lg:col-span-1">
                        <div className="bg-surface rounded-[2px] p-6 shadow-none border border-border space-y-5">
                            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                                <User className="w-5 h-5 text-primary" />
                                Contact Information
                            </h2>

                            <div className="flex flex-col items-center justify-center py-6 border-b border-border">
                                <div className="relative group">
                                    <AvatarUpload
                                        userId={profile?.userId}
                                        role={profile?.role}
                                        displayName={userName}
                                        size="lg"
                                        accentColor="bg-background"
                                        accentTextColor="text-primary"
                                    />
                                </div>
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
                                            className="w-full pl-9 pr-4 py-2.5 rounded-[2px] border border-border focus:ring-2 focus:ring-primary-light focus:border-primary outline-none transition-all text-sm text-text-primary bg-surface"
                                        />
                                    </div>
                                    <p className="text-xs text-text-muted mt-1">Visible to admin and faculty</p>
                                </div>
                            </div>

                            <button
                                onClick={handleSaveContact}
                                disabled={updateProfile.isPending || isLoading}
                                className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-[2px] transition-all shadow-none disabled:opacity-60 hover:scale-[1.02] active:scale-[0.98] text-sm"
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
                                <Bell className="w-5 h-5 text-primary" />
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
                                            <div className="w-11 h-6 bg-border peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-light rounded-[2px] peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-surface after:border-gray-300 after:border after:rounded-[2px] after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
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
                                    <button className="text-primary font-semibold text-sm hover:underline">Change</button>
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
                                        <div className="w-11 h-6 bg-border peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-light rounded-[2px] peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-surface after:border-gray-300 after:border after:rounded-[2px] after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </AdminPageWrapper>
        </DashboardLayout>
    );
}
