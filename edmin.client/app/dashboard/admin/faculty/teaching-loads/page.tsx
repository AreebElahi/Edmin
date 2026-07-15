'use client';

import DashboardLayout from '@/components/DashboardLayout';
import FacultyManagementContent from '../FacultyManagementContent';

import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
export default function TeachingLoadsOversightPage() {
    const { data: currentUser } = useCurrentUser();
  return (
    <DashboardLayout 
      userName={currentUser?.fullName || 'Admin'} 
      userRole={'admin' as any}
      userAvatar="https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff"
      notifications={[]}
      currentPath="/dashboard/admin/faculty/teaching-loads"
    >
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-semibold text-text-primary ">Teaching Loads Oversight</h1>
          <p className="text-text-secondary text-sm mt-1">Audit credit distributions, process overrides, reassign courses, and manage semester teaching assignments.</p>
        </div>
        <FacultyManagementContent activeTab="teaching-loads" />
      </div>
    </DashboardLayout>
  );
}
