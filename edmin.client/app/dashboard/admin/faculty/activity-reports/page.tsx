'use client';

import DashboardLayout from '@/components/DashboardLayout';
import FacultyManagementContent from '../FacultyManagementContent';

import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
export default function ActivityReportsOversightPage() {
    const { data: currentUser } = useCurrentUser();
  return (
    <DashboardLayout 
      userName={currentUser?.fullName || 'Admin'} 
      userRole={'admin' as any}
      userAvatar="https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff"
      notifications={[]}
      currentPath="/dashboard/admin/faculty/activity-reports"
    >
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-semibold text-text-primary ">Daily Activity Reports Monitoring</h1>
          <p className="text-text-secondary text-sm mt-1">Monitor department compliance rates, late submissions, and comment/override activity status.</p>
        </div>
        <FacultyManagementContent activeTab="activity-reports" />
      </div>
    </DashboardLayout>
  );
}
