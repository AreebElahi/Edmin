'use client';

import React from 'react';

type StatusKey =
  | 'active'
  | 'inactive'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'completed'
  | 'onleave'
  | 'on leave'
  | 'open'
  | 'closed'
  | 'resolved'
  | 'in progress'
  | 'inprogress'
  | 'draft'
  | 'published'
  | 'suspended'
  | 'graduated'
  | 'enrolled'
  | 'true'
  | 'false'
  | string;

interface Appearance {
  bg: string;
  text: string;
  label: string;
}

const STATUS_MAP: Record<string, Appearance> = {
  active:       { bg: 'bg-success-bg', text: 'text-success-text', label: 'Active' },
  enrolled:     { bg: 'bg-success-bg', text: 'text-success-text', label: 'Enrolled' },
  approved:     { bg: 'bg-success-bg', text: 'text-success-text', label: 'Approved' },
  completed:    { bg: 'bg-success-bg', text: 'text-success-text', label: 'Completed' },
  resolved:     { bg: 'bg-success-bg', text: 'text-success-text', label: 'Resolved' },
  published:    { bg: 'bg-success-bg', text: 'text-success-text', label: 'Published' },
  graduated:    { bg: 'bg-success-bg', text: 'text-success-text', label: 'Graduated' },
  true:         { bg: 'bg-success-bg', text: 'text-success-text', label: 'Yes' },

  pending:      { bg: 'bg-warning-bg', text: 'text-warning-text', label: 'Pending' },
  'in progress': { bg: 'bg-warning-bg', text: 'text-warning-text', label: 'In Progress' },
  inprogress:   { bg: 'bg-warning-bg', text: 'text-warning-text', label: 'In Progress' },
  draft:        { bg: 'bg-warning-bg', text: 'text-warning-text', label: 'Draft' },
  open:         { bg: 'bg-warning-bg', text: 'text-warning-text', label: 'Open' },
  onleave:      { bg: 'bg-warning-bg', text: 'text-warning-text', label: 'On Leave' },
  'on leave':   { bg: 'bg-warning-bg', text: 'text-warning-text', label: 'On Leave' },

  rejected:     { bg: 'bg-error-bg', text: 'text-error-text', label: 'Rejected' },
  cancelled:    { bg: 'bg-error-bg', text: 'text-error-text', label: 'Cancelled' },
  suspended:    { bg: 'bg-error-bg', text: 'text-error-text', label: 'Suspended' },
  false:        { bg: 'bg-error-bg', text: 'text-error-text', label: 'No' },

  inactive:     { bg: 'bg-background', text: 'text-text-secondary', label: 'Inactive' },
  closed:       { bg: 'bg-background', text: 'text-text-secondary', label: 'Closed' },
};

interface StatusBadgeProps {
  status: StatusKey;
  /** Override the displayed label */
  label?: string;
  className?: string;
}

/**
 * M365-style status badge.
 * All status colours map to the Fluent neutral palette.
 */
export default function StatusBadge({ status, label, className = '' }: StatusBadgeProps) {
  const key = (status ?? '').toString().toLowerCase().trim();
  const appearance: Appearance = STATUS_MAP[key] ?? {
    bg: 'bg-primary-light',
    text: 'text-primary',
    label: status ?? '',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-[2px] uppercase tracking-wider ${appearance.bg} ${appearance.text} ${className}`}
    >
      {label ?? appearance.label}
    </span>
  );
}
