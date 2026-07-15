'use client';

import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Action buttons / links rendered on the right side */
  actions?: React.ReactNode;
  /** Optional breadcrumb / back element */
  breadcrumb?: React.ReactNode;
  /** Additional wrapper classes */
  className?: string;
}

/**
 * M365-style flat page header.
 * White background, sharp bottom border, h1 title.
 */
export default function PageHeader({
  title,
  subtitle,
  actions,
  breadcrumb,
  className = '',
}: PageHeaderProps) {
  return (
    <div className={`bg-surface border-b border-border px-6 py-4 ${className}`}>
      {breadcrumb && (
        <div className="mb-1 text-xs text-text-muted">{breadcrumb}</div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-text-primary leading-tight">{title}</h1>
          {subtitle && (
            <p className="text-sm text-text-secondary mt-0.5">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 flex-wrap">{actions}</div>
        )}
      </div>
    </div>
  );
}
