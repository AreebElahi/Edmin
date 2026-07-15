'use client';

import DashboardLayout from '@/components/DashboardLayout';
import FacultyManagementContent from '../FacultyManagementContent';

import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
export default function FacultyDirectoryPage() {
    const { data: currentUser } = useCurrentUser();
  return (
    <DashboardLayout 
      userName={currentUser?.fullName || 'Admin'} 
      userRole={'admin' as any}
      userAvatar="https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff"
      notifications={[]}
      currentPath="/dashboard/admin/faculty/directory"
    >
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-semibold text-text-primary ">Faculty Directory</h1>
          <p className="text-text-secondary text-sm mt-1">Manage institutional faculty profiles, supervisor hierarchies, and class schedules.</p>
        </div>
        <FacultyManagementContent activeTab="directory" />
      </div>
    </DashboardLayout>
  );
}
