'use client';

import { AlertTriangle, Loader2, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isPending?: boolean;
}

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = 'Delete',
    cancelLabel = 'Cancel',
    isPending = false
}: ConfirmModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!mounted || !isOpen) return null;

    const content = (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                className="bg-surface w-full max-w-sm border border-border"
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="confirm-title"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-error-bg">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-error-text" strokeWidth={1.5} />
                        <h3 id="confirm-title" className="font-semibold text-sm text-error-text">{title}</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 text-error-text hover:bg-border transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                </div>

                {/* Body */}
                <div className="px-5 py-4">
                    <p className="text-sm text-text-secondary leading-relaxed">{message}</p>
                </div>

                {/* Divider */}
                <div className="h-px bg-border" />

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 px-5 py-3">
                    <button
                        onClick={onClose}
                        disabled={isPending}
                        className="px-4 py-2 text-xs font-semibold text-text-primary border border-border hover:bg-background transition-colors disabled:opacity-50 rounded-[2px]"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isPending}
                        className="px-4 py-2 text-xs font-semibold text-white bg-error-text hover:bg-error-hover transition-colors flex items-center gap-2 disabled:opacity-60 rounded-[2px]"
                    >
                        {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />}
                        {isPending ? 'Deleting...' : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(content, document.body);
}
