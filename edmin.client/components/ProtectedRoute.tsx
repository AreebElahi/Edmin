'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../providers/AuthProvider';

export function ProtectedRoute({ children, requiredRole, requiredSubRole }: { children: React.ReactNode; requiredRole?: string; requiredSubRole?: string }) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) return null; // Wait for initial auth check

  if (!isAuthenticated) return null; // Avoid flashing protected content

  if (requiredRole && user?.role !== requiredRole) {
    // Optionally redirect to a generic dashboard or unauthorized page
    router.push('/dashboard');
    return null;
  }

  if (requiredSubRole && user?.subRole !== requiredSubRole) {
    // If they don't have the necessary sub-role, keep them on their main dashboard
    router.push('/dashboard');
    return null;
  }

  return <>{children}</>;
}
