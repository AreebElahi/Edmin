'use client';

import DashboardLayout from '@/components/DashboardLayout';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { Calendar } from 'lucide-react';
import FacultyManagementContent from '../../admin/faculty/FacultyManagementContent';

import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
export default function AttendanceAuditPage() {
    const { data: currentUser } = useCurrentUser();
  return (
    <DashboardLayout 
      userName={currentUser?.fullName || 'HR User'} 
      userRole={'hr' as any}
      notifications={[]}
      currentPath="/dashboard/hr/attendance"
    >
      <AdminPageWrapper>

        <FacultyManagementContent activeTab="checkin-monitor" />
      </AdminPageWrapper>
    </DashboardLayout>
  );
}

