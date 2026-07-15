"use client";

import React from "react";
import Image from "next/image";
import { LockKeyhole, Mail, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { useLogin } from "../../../features/auth/hooks/useLogin";

// ─── Shared token constants (Fluent Design tokens) ────────────────────────────
const T = {
    gray50:  '#f9fafb',
    gray100: '#f3f4f6',
    gray300: '#d1d5db',
    gray400: '#9ca3af',
    gray500: '#6b7280',
    gray700: '#374151',
    gray900: '#111827',
    ink:     '#201f1e',   // Fluent ink
    label:   '#323130',   // Fluent label
    blue:    '#0078d4',   // Fluent blue
    blueD:   '#0f6cbd',   // Fluent primary button
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

// ─── Login Page ───────────────────────────────────────────────────────────────
export default function LoginPage() {
    const [showPassword, setShowPassword] = React.useState(false);
    const [email, setEmail]               = React.useState("");
    const [password, setPassword]         = React.useState("");
    const [error, setError]               = React.useState("");

    const { mutateAsync: loginMutation, isPending } = useLogin();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        try {
            const finalEmail = email.includes("@") ? email : `${email}@edmin.edu.pk`;
            await loginMutation({ email: finalEmail, password });
            // Routing handled by AuthProvider
        } catch (err: any) {
            setError(err.message || "Invalid credentials. Please try again.");
        }
    };

    const showDomainHint = !email.includes("@") && email.length > 0;

    return (
        <div style={{ padding: '48px 48px 40px' }}>

            {/* ── Header Section ────────────────────────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
                {/* Explicit container prevents CLS — reserves space before image loads */}
                <div style={{ width: '120px', height: '30px', position: 'relative', flexShrink: 0, marginBottom: '24px' }}>
                    <Image
                        src="/edmin-logo.png"
                        alt="Edmin"
                        fill
                        priority
                        unoptimized={true}
                        quality={100}
                        style={{ objectFit: 'contain', objectPosition: 'center' }}
                    />
                </div>
                <h1 style={{
                    fontSize: '24px',
                    fontWeight: 600,
                    lineHeight: '32px',
                    color: '#1b1b1b',
                    margin: '0 0 8px',
                    letterSpacing: '0',
                    textAlign: 'center',
                }}>
                    Sign in
                </h1>
                <p style={{ fontSize: '15px', color: T.gray700, margin: 0, lineHeight: '22px', textAlign: 'center' }}>
                    to continue to Edmin
                </p>
            </div>

            {/* ── Error Banner ──────────────────────────────────────────── */}
            {error && (
                <div
                    role="alert"
                    aria-live="polite"
                    style={{
                        display: 'flex', alignItems: 'flex-start', gap: '10px',
                        padding: '12px 14px', marginBottom: '24px',
                        background: '#fef2f2', border: '1px solid #fecaca',
                        borderRadius: '8px', fontSize: '14px', color: '#7f1d1d', lineHeight: '20px',
                    }}
                >
                    <svg style={{ flexShrink: 0, marginTop: '2px' }} width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="7" stroke="#dc2626" strokeWidth="1.5" />
                        <path d="M8 5v3.5M8 11h.01" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    {error}
                </div>
            )}

            {/* ── Form ──────────────────────────────────────────────────── */}
            <form onSubmit={handleLogin} noValidate>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    {/* Email */}
                    <FluentField id="email" label="Email address">
                        <span style={{ paddingLeft: '14px', display: 'flex', alignItems: 'center', flexShrink: 0, color: T.gray400 }}>
                            <Mail size={18} strokeWidth={1.75} />
                        </span>
                        <input
                            id="email"
                            type="text"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="john.doe"
                            required
                            disabled={isPending}
                            autoComplete="username"
                            aria-label="Email address"
                            style={{
                                flex: 1, minWidth: 0,
                                padding: '0 10px',
                                height: '100%',
                                fontSize: '15px',
                                color: T.gray900,
                                fontFamily: 'inherit',
                            }}
                        />
                        {showDomainHint && (
                            <span style={{
                                paddingRight: '14px',
                                fontSize: '14px',
                                color: T.gray400,
                                userSelect: 'none',
                                whiteSpace: 'nowrap',
                                flexShrink: 0,
                            }}>
                                @edmin.edu.pk
                            </span>
                        )}
                    </FluentField>

                    {/* Password */}
                    <FluentField id="password" label="Password">
                        <span style={{ paddingLeft: '14px', display: 'flex', alignItems: 'center', flexShrink: 0, color: T.gray400 }}>
                            <LockKeyhole size={18} strokeWidth={1.75} />
                        </span>
                        <input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            disabled={isPending}
                            autoComplete="current-password"
                            aria-label="Password"
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
                            onClick={() => setShowPassword(p => !p)}
                            disabled={isPending}
                            aria-label={showPassword ? "Hide password" : "Show password"}
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
                            {showPassword ? <EyeOff size={18} strokeWidth={1.75} /> : <Eye size={18} strokeWidth={1.75} />}
                        </button>
                    </FluentField>

                    {/* Remember me + Forgot password */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
                            <input
                                type="checkbox"
                                disabled={isPending}
                                aria-label="Remember me"
                                style={{ width: '16px', height: '16px', accentColor: T.blue, cursor: 'pointer', borderRadius: '4px' }}
                            />
                            <span style={{ fontSize: '14px', color: T.gray500, lineHeight: '20px' }}>
                                Remember me
                            </span>
                        </label>
                        <a
                            href="#"
                            style={{
                                fontSize: '14px',
                                fontWeight: 500,
                                color: T.blue,
                                textDecoration: 'none',
                                lineHeight: '20px',
                                transition: 'color 0.12s',
                            }}
                            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'underline'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'none'; }}
                        >
                            Forgot password?
                        </a>
                    </div>

                    {/* Submit button */}
                    <button
                        type="submit"
                        disabled={isPending}
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
                        }}
                    >
                        {isPending ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Signing in…
                            </>
                        ) : (
                            <>
                                Sign In
                                <ArrowRight size={18} strokeWidth={2} />
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
