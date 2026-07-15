'use client';

import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    type?: 'default' | 'danger' | 'success';
}

export default function Modal({ isOpen, onClose, title, children, type = 'default' }: ModalProps) {
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

    const modalContent = (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div
                className="bg-surface w-full max-w-md overflow-hidden border border-border"
                role="dialog"
                aria-modal="true"
            >
                {/* Header */}
                <div className={`flex items-center justify-between px-5 py-3 border-b border-border ${type === 'danger' ? 'bg-error-bg' : type === 'success' ? 'bg-success-bg' : 'bg-surface-hover'}`}>
                    <h3 className={`font-semibold text-sm ${type === 'danger' ? 'text-error-text' : type === 'success' ? 'text-success-text' : 'text-text-primary'}`}>
                        {title}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 text-text-secondary hover:bg-border transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                </div>
                {/* Body */}
                <div className="p-5">
                    {children}
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
