'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { useQuery } from '@tanstack/react-query';
import { getUserPermissions } from '../api/system/rbac.api';

interface RBACContextType {
  permissions: Set<string>;
  isLoading: boolean;
  hasPermission: (module: string, action: string) => boolean;
}

const RBACContext = createContext<RBACContextType | undefined>(undefined);

// Fetch permissions from backend via TanStack Query
export function RBACProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();

  const { data: permissionsArray = [], isLoading } = useQuery({
    queryKey: ['me', 'permissions'],
    queryFn: async () => {
      try {
        return await getUserPermissions();
      } catch (e) {
        return []; // If endpoint is missing, fallback to empty array
      }
    },
    enabled: isAuthenticated, // Only fetch if user is logged in
    staleTime: 1000 * 60 * 5, // Cache permissions for 5 mins
  });

  const permissions = new Set<string>(permissionsArray);

  const hasPermission = (module: string, action: string) => {
    if (user?.role === 'ADMIN') return true;
    return permissions.has(`${module}:${action}`);
  };

  return (
    <RBACContext.Provider value={{ permissions, isLoading, hasPermission }}>
      {children}
    </RBACContext.Provider>
  );
}

export const useRBAC = () => {
  const context = useContext(RBACContext);
  if (context === undefined) {
    throw new Error('useRBAC must be used within an RBACProvider');
  }
  return context;
};

// Utility Component to hide/show UI based on permissions
export function Can({ I, a, children }: { I: string; a: string; children: React.ReactNode }) {
  const { hasPermission, isLoading } = useRBAC();

  if (isLoading) return null; // Avoid flickering layout

  if (!hasPermission(a, I)) {
    return null;
  }

  return <>{children}</>;
}
