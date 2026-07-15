"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";
import { LockKeyhole, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "../../../providers/AuthProvider";

// ─── Shared token constants (Fluent Design tokens) ────────────────────────────
const T = {
    gray50:  '#f9fafb',
    gray100: '#f3f4f6',
    gray300: '#d1d5db',
    gray400: '#9ca3af',
    gray500: '#6b7280',
    gray700: '#374151',
    gray900: '#111827',
    ink:     '#201f1e',
    label:   '#323130',
    blue:    '#0078d4',
    blueD:   '#0f6cbd',
};

// ─── Fluent Input Field component ─────────────────────────────────────────────
function FluentField({
    id, label, children,
}: { id: string; label: string; children: React.ReactNode }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label
                htmlFor={id}
                style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: T.label,
                    letterSpacing: '0.01em',
                    lineHeight: '18px',
                }}
            >
                {label}
            </label>
            <div
                className="f-input"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    height: '48px',
                    borderRadius: '8px',
                    border: `1.5px solid ${T.gray300}`,
                    background: '#fff',
                    transition: 'border-color 0.12s, box-shadow 0.12s',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {children}
            </div>
        </div>
    );
}

// ─── Change Password Page ─────────────────────────────────────────────────────
export default function ChangePasswordPage() {
    const router = useRouter();
    const { logout } = useAuth();
    const [isLoading, setIsLoading] = React.useState(false);
    const [showCurrent, setShowCurrent] = React.useState(false);
    const [showNew, setShowNew] = React.useState(false);
    const [showConfirm, setShowConfirm] = React.useState(false);

    const [currentPassword, setCurrentPassword] = React.useState("");
    const [newPassword, setNewPassword] = React.useState("");
    const [confirmPassword, setConfirmPassword] = React.useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!currentPassword || !newPassword || !confirmPassword) {
            toast.error("Please fill in all fields");
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error("New passwords do not match");
            return;
        }
        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        setIsLoading(true);
        try {
            const token = localStorage.getItem("token");
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
            const response = await fetch(`${apiUrl}/auth/change-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ currentPassword, newPassword }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to change password");
            toast.success("Password changed successfully! Please log in again.");
            setTimeout(() => logout(), 1500);
        } catch (error: any) {
            toast.error(error.message || "Failed to change password. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ padding: '48px 48px 40px' }}>
            {/* ── Logo ──────────────────────────────────────────────────── */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                <div style={{ width: '152px', height: '42px', position: 'relative', flexShrink: 0 }}>
                    <Image
                        src="/edmin-logo.png"
                        alt="Edmin"
                        fill
                        priority
                        sizes="152px"
                        style={{ objectFit: 'contain', objectPosition: 'center' }}
                    />
                </div>
            </div>

            {/* ── Heading ───────────────────────────────────────────────── */}
            <div style={{ textAlign: 'center', marginBottom: '36px' }}>
                <h1 style={{
                    fontSize: '34px',
                    fontWeight: 600,
                    lineHeight: '42px',
                    color: T.ink,
                    margin: '0 0 10px',
                    letterSpacing: '-0.01em',
                }}>
                    Reset Password
                </h1>
                <p style={{ fontSize: '15px', color: T.gray500, margin: 0, lineHeight: '22px' }}>
                    You must change your temporary password to secure your account.
                </p>
            </div>

            {/* ── Form ──────────────────────────────────────────────────── */}
            <form onSubmit={handleSubmit} noValidate>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {/* Current Password */}
                    <FluentField id="currentPassword" label="Current Password">
                        <span style={{ paddingLeft: '14px', display: 'flex', alignItems: 'center', flexShrink: 0, color: T.gray400 }}>
                            <LockKeyhole size={18} strokeWidth={1.75} />
                        </span>
                        <input
                            id="currentPassword"
                            type={showCurrent ? "text" : "password"}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            disabled={isLoading}
                            autoComplete="current-password"
                            aria-label="Current Password"
                            style={{
                                flex: 1, minWidth: 0,
                                padding: '0 10px',
                                height: '100%',
                                fontSize: '15px',
                                color: T.gray900,
                                fontFamily: 'inherit',
                            }}
                        />
                        <button
                            type="button"
                            tabIndex={0}
                            onClick={() => setShowCurrent(p => !p)}
                            disabled={isLoading}
                            aria-label={showCurrent ? "Hide current password" : "Show current password"}
                            style={{
                                paddingRight: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                flexShrink: 0,
                                color: T.gray400,
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'color 0.12s',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.color = T.gray700)}
                            onMouseLeave={e => (e.currentTarget.style.color = T.gray400)}
                        >
                            {showCurrent ? <EyeOff size={18} strokeWidth={1.75} /> : <Eye size={18} strokeWidth={1.75} />}
                        </button>
                    </FluentField>

                    {/* New Password */}
                    <FluentField id="newPassword" label="New Password">
                        <span style={{ paddingLeft: '14px', display: 'flex', alignItems: 'center', flexShrink: 0, color: T.gray400 }}>
                            <LockKeyhole size={18} strokeWidth={1.75} />
                        </span>
                        <input
                            id="newPassword"
                            type={showNew ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            disabled={isLoading}
                            autoComplete="new-password"
                            aria-label="New Password"
                            style={{
                                flex: 1, minWidth: 0,
                                padding: '0 10px',
                                height: '100%',
                                fontSize: '15px',
                                color: T.gray900,
                                fontFamily: 'inherit',
                            }}
                        />
                        <button
                            type="button"
                            tabIndex={0}
                            onClick={() => setShowNew(p => !p)}
                            disabled={isLoading}
                            aria-label={showNew ? "Hide new password" : "Show new password"}
                            style={{
                                paddingRight: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                flexShrink: 0,
                                color: T.gray400,
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'color 0.12s',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.color = T.gray700)}
                            onMouseLeave={e => (e.currentTarget.style.color = T.gray400)}
                        >
                            {showNew ? <EyeOff size={18} strokeWidth={1.75} /> : <Eye size={18} strokeWidth={1.75} />}
                        </button>
                    </FluentField>

                    {/* Confirm Password */}
                    <FluentField id="confirmPassword" label="Confirm New Password">
                        <span style={{ paddingLeft: '14px', display: 'flex', alignItems: 'center', flexShrink: 0, color: T.gray400 }}>
                            <LockKeyhole size={18} strokeWidth={1.75} />
                        </span>
                        <input
                            id="confirmPassword"
                            type={showConfirm ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            disabled={isLoading}
                            autoComplete="new-password"
                            aria-label="Confirm New Password"
                            style={{
                                flex: 1, minWidth: 0,
                                padding: '0 10px',
                                height: '100%',
                                fontSize: '15px',
                                color: T.gray900,
                                fontFamily: 'inherit',
                            }}
                        />
                        <button
                            type="button"
                            tabIndex={0}
                            onClick={() => setShowConfirm(p => !p)}
                            disabled={isLoading}
                            aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                            style={{
                                paddingRight: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                flexShrink: 0,
                                color: T.gray400,
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'color 0.12s',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.color = T.gray700)}
                            onMouseLeave={e => (e.currentTarget.style.color = T.gray400)}
                        >
                            {showConfirm ? <EyeOff size={18} strokeWidth={1.75} /> : <Eye size={18} strokeWidth={1.75} />}
                        </button>
                    </FluentField>

                    {/* Submit button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="f-btn"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            width: '100%',
                            height: '48px',
                            borderRadius: '8px',
                            border: 'none',
                            color: '#fff',
                            fontSize: '15px',
                            fontWeight: 600,
                            fontFamily: 'inherit',
                            cursor: 'pointer',
                            letterSpacing: '0.01em',
                            marginTop: '4px',
                        }}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Updating Password…
                            </>
                        ) : (
                            <>
                                Update Password
                                <ArrowRight size={18} strokeWidth={2} />
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
