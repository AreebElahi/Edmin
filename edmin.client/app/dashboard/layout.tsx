import React from 'react';
import { ProtectedRoute } from '../../components/ProtectedRoute';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Ensure that all routes under /dashboard/** are structurally guarded
  // Role-specific layout components (like app/dashboard/student/layout.tsx) 
  // can optionally wrap their children in a tighter <ProtectedRoute requiredRole="..."> if they want,
  // but middleware handles the primary role boundary now.
  return (
    <ProtectedRoute>
      {children}
    </ProtectedRoute>
  );
}
