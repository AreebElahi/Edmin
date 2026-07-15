'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { UserRole } from '@/types/types';
import ExaminationContent from './ExaminationContent';

import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
export default function ExaminationWorkspacePage() {
    const { data: currentUser } = useCurrentUser();
    return (
        <DashboardLayout userRole={UserRole.ADMIN} userName={currentUser?.fullName || 'Admin'} notifications={[]}>
            <ExaminationContent />
        </DashboardLayout>
    );
}
