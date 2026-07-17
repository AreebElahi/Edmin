'use client';

import { useAuth } from '../../../../providers/AuthProvider';
import DashboardLayout from '../../../../components/DashboardLayout';
import { UserRole } from '../../../../types/types';
import { AcademicChatInterface } from '../../../../features/academic-chat/AcademicChatInterface';

export default function MessagesPage() {
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
      currentPath="/dashboard/shared/messages"
    >
      <div className="p-6 h-full flex flex-col">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Messages</h1>
        <div className="flex-1 min-h-0 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <AcademicChatInterface />
        </div>
      </div>
    </DashboardLayout>
  );
}
