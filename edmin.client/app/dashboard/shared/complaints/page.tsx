'use client';

import { useAuth } from '../../../../providers/AuthProvider';
import DashboardLayout from '../../../../components/DashboardLayout';
import { UserRole } from '../../../../types/types';
import { ComplaintInterface } from '../../../../features/complaint/ComplaintInterface';

export default function ComplaintsPage() {
  const { user } = useAuth();
  
  if (!user) return null;

  // Determine standard role
  let role = UserRole.STUDENT;
  if (user.role === 'FACULTY') role = UserRole.FACULTY;
  else if (user.role === 'ADMIN') role = UserRole.ADMIN;
  else if (user.role === 'HR') role = UserRole.HR;

  // Derive display name
  let displayName = 'User';

  return (
    <DashboardLayout
      userRole={role}
      userName={displayName}
      notifications={[]}
      currentPath="/dashboard/shared/complaints"
    >
      <div className="p-6 h-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Support & Complaints</h1>
        <ComplaintInterface />
      </div>
    </DashboardLayout>
  );
}
