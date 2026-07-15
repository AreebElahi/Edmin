'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { UserRole } from '@/types/types';
import { ShieldAlert, KeyRound, CheckCircle2, History, Monitor, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { useChangePassword } from '@/features/profile/hooks/useChangePassword';
import { useCurrentProfile } from '@/features/profile/hooks/useProfile';

export default function UnifiedChangePasswordPage() {
    const [step, setStep] = useState(1);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [validationError, setValidationError] = useState('');

    const changePassword = useChangePassword();
    const { data: profile, isLoading } = useCurrentProfile();

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-[2px] animate-spin"></div>
            </div>
        );
    }

    const userRole = profile?.role as UserRole || UserRole.STUDENT;
    const displayName = profile?.fullName || profile?.username || 'System User';

    const handleUpdate = async () => {
        setValidationError('');

        if (!currentPassword || !newPassword || !confirmPassword) {
            setValidationError('All fields are required.');
            return;
        }
        if (newPassword.length < 8) {
            setValidationError('New password must be at least 8 characters.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setValidationError('New passwords do not match.');
            return;
        }

        try {
            await changePassword.mutateAsync({ currentPassword, newPassword });
            setStep(2);
        } catch {
            // error already shown via toast in hook
        }
    };

    return (
        <DashboardLayout
            userRole={userRole}
            userName={displayName}
            notifications={[]}
            currentPath="/dashboard/change-password"
        >
            <div className="max-w-4xl mx-auto px-4 py-12 flex justify-center items-start min-h-[80vh]">
                <div className="w-full max-w-lg bg-surface rounded-[2px] shadow-none border border-border p-8 md:p-10 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#FDE7E9]0 to-rose-600"></div>

                    {step === 1 ? (
                        <div className="space-y-8 animate-in fade-in zoom-in-95">
                            <div className="text-center">
                                <div className="w-20 h-20 bg-error-bg text-error-text rounded-[2px] flex items-center justify-center mx-auto mb-6 shadow-none rotate-6 hover:rotate-0 transition-transform cursor-help">
                                    <KeyRound className="w-10 h-10" strokeWidth={2.5} />
                                </div>
                                <h1 className="text-3xl font-semibold text-text-primary ">Access Rotation</h1>
                                <p className="text-text-secondary mt-2 font-medium">Update your credentials globally.</p>
                            </div>

                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <label className="uppercase tracking-widest text-[10px] font-semibold text-text-muted block">Current Credential</label>
                                    <div className="relative">
                                        <input
                                            type={showCurrent ? 'text' : 'password'}
                                            value={currentPassword}
                                            onChange={e => setCurrentPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full border border-border rounded-[2px] px-5 py-4 text-text-primary focus:ring-4 focus:ring-error-bg0/10 outline-none transition-all pr-12"
                                        />
                                        <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
                                            {showCurrent ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="uppercase tracking-widest text-[10px] font-semibold text-text-muted block">New Access Key</label>
                                    <div className="relative">
                                        <input
                                            type={showNew ? 'text' : 'password'}
                                            value={newPassword}
                                            onChange={e => setNewPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full border border-border rounded-[2px] px-5 py-4 text-text-primary focus:ring-4 focus:ring-error-bg0/10 outline-none transition-all pr-12"
                                        />
                                        <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
                                            {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="uppercase tracking-widest text-[10px] font-semibold text-text-muted block">Confirm Key Rotation</label>
                                    <div className="relative">
                                        <input
                                            type={showConfirm ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={e => setConfirmPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full border border-border rounded-[2px] px-5 py-4 text-text-primary focus:ring-4 focus:ring-error-bg0/10 outline-none transition-all pr-12"
                                        />
                                        <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
                                            {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {validationError && (
                                <div className="flex items-center gap-2 text-error-text bg-error-bg border border-red-100 rounded-[2px] px-4 py-3 text-sm">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    {validationError}
                                </div>
                            )}

                            <div className="p-4 bg-error-bg text-red-800 rounded-[2px] border border-red-100 flex items-start gap-4">
                                <ShieldAlert className="w-6 h-6 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold text-sm  mb-0.5">Global Session Invalidation</p>
                                    <p className="text-xs text-red-700/80 leading-relaxed italic">Updating this password will terminate all existing dashboard sessions across all devices for security compliance.</p>
                                </div>
                            </div>

                            <button
                                onClick={handleUpdate}
                                disabled={changePassword.isPending}
                                className="w-full py-4 bg-gray-900 text-white font-semibold rounded-[2px] shadow-none hover:bg-black transition-all active:scale-[0.98] uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 disabled:opacity-60"
                            >
                                {changePassword.isPending ? (
                                    <><svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Updating Password...</>
                                ) : 'Update Key & Sync'}
                            </button>
                        </div>
                    ) : (
                        <div className="text-center space-y-8 animate-in fade-in slide-in-from-bottom-6">
                            <div className="w-24 h-24 bg-success-bg text-success-text rounded-[2px] flex items-center justify-center mx-auto shadow-inner relative">
                                <CheckCircle2 className="w-16 h-16 animate-in zoom-in-50 duration-500" />
                                <div className="absolute -top-1 -right-1 w-6 h-6 bg-surface rounded-[2px] flex items-center justify-center border-2 border-success-bg0 text-[10px] font-semibold italic">!</div>
                            </div>
                            <div>
                                <h2 className="text-3xl font-semibold text-text-primary mb-2 ">Rotation Successful</h2>
                                <p className="text-text-secondary font-medium">Your password has been updated successfully.</p>
                            </div>

                            <div className="grid grid-cols-1 gap-2 pt-6">
                                <div className="flex items-center justify-between p-3 bg-surface-hover border border-border rounded-[2px] text-text-secondary">
                                    <div className="flex items-center gap-3">
                                        <History className="w-4 h-4" />
                                        <span className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">Last rotation</span>
                                    </div>
                                    <span className="text-xs font-bold text-text-primary">Just Now</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-surface-hover border border-border rounded-[2px] text-text-secondary">
                                    <div className="flex items-center gap-3">
                                        <Monitor className="w-4 h-4" />
                                        <span className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">Status</span>
                                        <span className="px-1.5 py-0.5 bg-green-100 text-success-text rounded text-[9px] font-semibold">SECURED</span>
                                    </div>
                                    <span className="text-xs font-bold text-text-primary">Active</span>
                                </div>
                            </div>

                            <button
                                onClick={() => { setStep(1); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }}
                                className="w-full py-4 border-2 border-border text-text-primary font-semibold rounded-[2px] hover:bg-surface-hover transition-colors uppercase tracking-[0.2em] text-xs"
                            >
                                Change Again
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
