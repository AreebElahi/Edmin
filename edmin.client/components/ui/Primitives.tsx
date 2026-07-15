'use client';

import React from 'react';

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
}

/**
 * M365-style button — replaces all ad-hoc button styling.
 * appearance="primary" → blue fill
 * appearance="secondary" → white + border
 * appearance="ghost" → transparent
 * appearance="danger" → red destructive
 */
export function ActionButton({
  variant = 'secondary',
  size = 'md',
  icon,
  children,
  className = '',
  ...props
}: ActionButtonProps) {
  const base =
    'inline-flex items-center gap-1.5 font-semibold rounded-[2px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 disabled:cursor-not-allowed';

  const sizes: Record<string, string> = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3.5 py-1.5 text-xs',
  };

  const variants: Record<string, string> = {
    primary:
      'bg-primary hover:bg-primary-hover text-white border border-primary',
    secondary:
      'bg-surface hover:bg-background text-text-primary border border-border',
    ghost:
      'bg-transparent hover:bg-background text-text-primary border border-transparent',
    danger:
      'bg-surface hover:bg-error-bg text-error-text border border-border hover:border-error-text',
  };

  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </button>
  );
}

// ─── Section Card ──────────────────────────────────────────────────────────────

interface SectionCardProps {
  title?: string;
  subtitle?: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** Remove default body padding */
  noPadding?: boolean;
}

/**
 * Standard content card — replaces all `bg-surface border border-border rounded-[2px]` wrappers.
 */
export function SectionCard({
  title,
  subtitle,
  headerRight,
  children,
  className = '',
  noPadding = false,
}: SectionCardProps) {
  return (
    <div className={`bg-surface border border-border rounded-[2px] ${className}`}>
      {(title || headerRight) && (
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div>
            {title && (
              <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
            )}
            {subtitle && (
              <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>
            )}
          </div>
          {headerRight && <div className="flex items-center gap-2">{headerRight}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-5'}>{children}</div>
    </div>
  );
}

// ─── Section Label ─────────────────────────────────────────────────────────────

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
      {children}
    </p>
  );
}

// ─── Empty State ───────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
      {icon && <div className="text-[#C8C6C4]">{icon}</div>}
      <p className="text-sm font-semibold text-text-secondary">{title}</p>
      {description && <p className="text-xs text-text-muted max-w-xs">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
