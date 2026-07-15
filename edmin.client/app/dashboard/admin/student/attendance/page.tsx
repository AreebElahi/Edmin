'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { UserRole } from '@/types/types';
import StudentManagementContent from '../StudentManagementContent';

import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
export default function StudentAttendancePage() {
    const { data: currentUser } = useCurrentUser();
    return (
        <DashboardLayout userRole={UserRole.ADMIN} userName={currentUser?.fullName || 'Admin'} notifications={[]}>
            <StudentManagementContent activeTab="attendance" />
        </DashboardLayout>
    );
}
