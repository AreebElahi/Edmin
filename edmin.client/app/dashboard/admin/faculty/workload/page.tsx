'use client';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
﻿import DashboardLayout from '@/components/DashboardLayout';
import FacultyManagementContent from '../FacultyManagementContent';

import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
export default function WorkloadAnalyticsPage() {
    const { data: currentUser } = useCurrentUser();
  return (
    <DashboardLayout 
      userName={currentUser?.fullName || 'Admin'} 
      userRole={'admin' as any}
      userAvatar="https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff"
      notifications={[]}
      currentPath="/dashboard/admin/faculty/workload"
    >
      <AdminPageWrapper>
        <FacultyManagementContent activeTab="workload" />
      </AdminPageWrapper>
    </DashboardLayout>
  );
}
