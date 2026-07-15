'use client';

import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { UserRole } from '@/types/types';
import TranscriptPreview from '../../TranscriptPreview';

import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
export default function StudentTranscriptPage() {
    const { data: currentUser } = useCurrentUser();
    const params = useParams();
    const studentId = parseInt(params.studentId as string, 10);

    return (
        <DashboardLayout 
            userName={currentUser?.fullName || 'Admin'} 
            userRole={UserRole.ADMIN}
            notifications={[]}
            currentPath="/dashboard/admin/examination"
        >
            <div className="p-6">
                <TranscriptPreview studentId={studentId} />
            </div>
        </DashboardLayout>
    );
}
