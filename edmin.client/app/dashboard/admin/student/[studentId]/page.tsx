'use client';

import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { UserRole } from '@/types/types';
import StudentProfileContent from '../StudentProfileContent';

import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
export default function StudentTimelinePage() {
    const { data: currentUser } = useCurrentUser();
    const params = useParams();
    const studentId = parseInt(params.studentId as string, 10);

    return (
        <DashboardLayout userRole={UserRole.ADMIN} userName={currentUser?.fullName || 'Admin'} notifications={[]}>
            <StudentProfileContent studentId={studentId} />
        </DashboardLayout>
    );
}
