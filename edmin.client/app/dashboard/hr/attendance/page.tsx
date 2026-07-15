'use client';

import DashboardLayout from '@/components/DashboardLayout';
import FacultyManagementContent from '../../admin/faculty/FacultyManagementContent';

import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
export default function AttendanceAuditPage() {
    const { data: currentUser } = useCurrentUser();
  return (
    <DashboardLayout 
      userName={currentUser?.fullName || 'HR User'} 
      userRole={'hr' as any}
      userAvatar="https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff"
      notifications={[]}
      currentPath="/dashboard/hr/attendance"
    >
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-semibold text-text-primary ">Faculty Attendance Audit</h1>
          <p className="text-text-secondary text-sm mt-1">Audit class sessions created, missing schedules, edited attendance logs, and system audits.</p>
        </div>
        <FacultyManagementContent activeTab="attendance" />
      </div>
    </DashboardLayout>
  );
}
