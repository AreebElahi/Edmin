'use client';

import React from 'react';
import { X } from 'lucide-react';

interface AppDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Optional subtitle / description below the title */
  description?: string;
  children?: React.ReactNode;
  /** Footer buttons — right-aligned */
  actions?: React.ReactNode;
  /** 'sm' | 'md' | 'lg' | 'xl' — default 'md' */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Danger variant colours the title bar */
  variant?: 'default' | 'danger';
}

const sizeClasses: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

/**
 * M365-style flat dialog (replaces Modal.tsx + ConfirmModal.tsx).
 * Sharp corners, white surface, no shadows.
 */
export default function AppDialog({
  open,
  onClose,
  title,
  description,
  children,
  actions,
  size = 'md',
  variant = 'default',
}: AppDialogProps) {
  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog surface */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className={`fixed z-50 inset-0 flex items-center justify-center p-4 pointer-events-none`}
      >
        <div
          className={`relative bg-surface border border-border rounded-[2px] w-full ${sizeClasses[size]} pointer-events-auto`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className={`flex items-start justify-between px-5 py-3.5 border-b border-border ${
              variant === 'danger' ? 'bg-error-bg' : 'bg-surface-hover'
            }`}
          >
            <div className="flex-1 min-w-0 pr-4">
              <h2
                id="dialog-title"
                className={`text-sm font-semibold ${
                  variant === 'danger' ? 'text-error-text' : 'text-text-primary'
                }`}
              >
                {title}
              </h2>
              {description && (
                <p className="text-xs text-text-secondary mt-0.5">{description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-black/5 rounded-[2px] transition-colors flex-shrink-0"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4 text-text-secondary" strokeWidth={1.5} />
            </button>
          </div>

          {/* Body */}
          {children && (
            <div className="px-5 py-4 text-sm text-text-primary">{children}</div>
          )}

          {/* Footer */}
          {actions && (
            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border bg-surface-hover">
              {actions}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
