'use client';

import React from 'react';

interface PageLayoutProps {
  children: React.ReactNode;
  /** Max width — defaults to a comfortable dashboard width */
  maxWidth?: string;
  /** Additional padding/margin classes */
  className?: string;
}

/**
 * Standard page content wrapper.
 * Provides consistent max-width, padding, and vertical spacing.
 */
export default function PageLayout({
  children,
  maxWidth = 'max-w-[1600px]',
  className = '',
}: PageLayoutProps) {
  return (
    <div className={`${maxWidth} mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 ${className}`}>
      {children}
    </div>
  );
}
