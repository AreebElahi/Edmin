"use client";

import React from "react";
import Image from "next/image";
import { Mail, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { useForgotPassword } from "../../../features/auth/hooks/useForgotPassword";

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

export default function ForgotPasswordPage() {
    const [email, setEmail] = React.useState("");
    const [error, setError] = React.useState("");
    const [successMsg, setSuccessMsg] = React.useState("");

    const { mutateAsync: forgotPasswordMutation, isPending } = useForgotPassword();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccessMsg("");
        try {
            const finalEmail = email.includes("@") ? email : `${email}@edmin.edu.pk`;
            const res = await forgotPasswordMutation({ email: finalEmail });
            setSuccessMsg(res.message || "If that email exists, a reset link has been sent.");
        } catch (err: any) {
            setError(err.message || "An error occurred. Please try again.");
        }
    };

    const showDomainHint = !email.includes("@") && email.length > 0;

    return (
        <div style={{ padding: '48px 48px 40px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
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
                    Reset password
                </h1>
                <p style={{ fontSize: '15px', color: T.gray700, margin: 0, lineHeight: '22px', textAlign: 'center' }}>
                    Enter your email to receive a reset link
                </p>
            </div>

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

            {successMsg && (
                <div
                    role="alert"
                    aria-live="polite"
                    style={{
                        display: 'flex', alignItems: 'flex-start', gap: '10px',
                        padding: '12px 14px', marginBottom: '24px',
                        background: '#f0fdf4', border: '1px solid #bbf7d0',
                        borderRadius: '8px', fontSize: '14px', color: '#166534', lineHeight: '20px',
                    }}
                >
                    <svg style={{ flexShrink: 0, marginTop: '2px' }} width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M14.667 4L6.333 12.333 1.333 7.333" stroke="#166534" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {successMsg}
                </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
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
                            disabled={isPending || !!successMsg}
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

                    <button
                        type="submit"
                        disabled={isPending || !!successMsg}
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
                            cursor: (isPending || !!successMsg) ? 'not-allowed' : 'pointer',
                            letterSpacing: '0.01em',
                            opacity: (isPending || !!successMsg) ? 0.7 : 1,
                        }}
                    >
                        {isPending ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Sending link…
                            </>
                        ) : (
                            <>
                                Send Reset Link
                                <ArrowRight size={18} strokeWidth={2} />
                            </>
                        )}
                    </button>
                    
                    <div style={{ textAlign: 'center' }}>
                        <a
                            href="/login"
                            style={{
                                fontSize: '14px',
                                fontWeight: 500,
                                color: T.blue,
                                textDecoration: 'none',
                                lineHeight: '20px',
                                transition: 'color 0.12s',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'underline'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'none'; }}
                        >
                            <ArrowLeft size={16} /> Back to sign in
                        </a>
                    </div>
                </div>
            </form>
        </div>
    );
}
