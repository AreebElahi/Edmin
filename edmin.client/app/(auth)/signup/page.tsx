"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, Loader2 } from "lucide-react";

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

// ─── Signup Page ──────────────────────────────────────────────────────────────
export default function SignupPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = React.useState(false);
    const [showPassword, setShowPassword] = React.useState(false);
    const [showConfirm, setShowConfirm] = React.useState(false);

    const [formData, setFormData] = React.useState({
        email: "",
        password: "",
        confirmPassword: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData((prev) => ({ ...prev, [id]: value }));
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.email || !formData.password || !formData.confirmPassword) {
            toast.error("Please fill in all fields");
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }
        if (formData.password.length < 6) {
            toast.error("Password should be at least 6 characters");
            return;
        }

        setIsLoading(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
            const finalEmail = formData.email.includes("@")
                ? formData.email
                : `${formData.email}@edmin.edu.pk`;
            const response = await fetch(`${apiUrl}/auth/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: finalEmail, password: formData.password }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Signup failed");
            toast.success("Account created successfully!");
            setTimeout(() => router.push("/login"), 1000);
        } catch (error: any) {
            toast.error(error.message || "Failed to create account. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const showDomainHint = !formData.email.includes("@") && formData.email.length > 0;

    return (
        <div style={{ padding: '48px 48px 40px' }}>
            
            {/* ── Header Section ────────────────────────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '36px' }}>
                <div style={{ width: '120px', height: '30px', position: 'relative', flexShrink: 0, marginBottom: '28px' }}>
                    <Image
                        src="/edmin-logo.svg"
                        alt="Edmin"
                        fill
                        priority
                        sizes="120px"
                        style={{ objectFit: 'contain', objectPosition: 'center' }}
                    />
                </div>
                <h1 style={{
                    fontSize: '34px',
                    fontWeight: 600,
                    lineHeight: '42px',
                    color: T.ink,
                    margin: '0 0 12px',
                    letterSpacing: '-0.01em',
                    textAlign: 'center',
                }}>
                    Create Account
                </h1>
                <p style={{ fontSize: '15px', color: T.gray500, margin: 0, lineHeight: '22px', textAlign: 'center' }}>
                    Create your portal account to access university services
                </p>
            </div>

            {/* ── Form ──────────────────────────────────────────────────── */}
            <form onSubmit={handleSignup} noValidate>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {/* Email */}
                    <FluentField id="email" label="Email Address / Username">
                        <span style={{ paddingLeft: '14px', display: 'flex', alignItems: 'center', flexShrink: 0, color: T.gray400 }}>
                            <Mail size={18} strokeWidth={1.75} />
                        </span>
                        <input
                            id="email"
                            type="text"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="john.doe"
                            required
                            disabled={isLoading}
                            autoComplete="username"
                            aria-label="Email address or username"
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
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            required
                            disabled={isLoading}
                            autoComplete="new-password"
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
                            disabled={isLoading}
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

                    {/* Confirm Password */}
                    <FluentField id="confirmPassword" label="Confirm Password">
                        <span style={{ paddingLeft: '14px', display: 'flex', alignItems: 'center', flexShrink: 0, color: T.gray400 }}>
                            <LockKeyhole size={18} strokeWidth={1.75} />
                        </span>
                        <input
                            id="confirmPassword"
                            type={showConfirm ? "text" : "password"}
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="••••••••"
                            required
                            disabled={isLoading}
                            autoComplete="new-password"
                            aria-label="Confirm Password"
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

                    {/* Sign in link */}
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px', color: T.gray500 }}>
                            Already have an account?{" "}
                            <button
                                type="button"
                                onClick={() => router.push("/login")}
                                style={{
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    color: T.blue,
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: 0,
                                    textDecoration: 'none',
                                    transition: 'color 0.12s',
                                }}
                                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.textDecoration = 'underline'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.textDecoration = 'none'; }}
                            >
                                Sign in
                            </button>
                        </span>
                    </div>

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
                                Creating Account…
                            </>
                        ) : (
                            <>
                                Create Account
                                <ArrowRight size={18} strokeWidth={2} />
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
