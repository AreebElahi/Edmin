'use client';

import DashboardLayout from '@/components/DashboardLayout';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { UserRole } from '@/types/types';
import { UserPlus, Home } from 'lucide-react';
import Link from 'next/link';

export default function RecruitmentPage() {
    return (
        <DashboardLayout
            userRole={UserRole.HR}
            notifications={[]}
            currentPath="/dashboard/hr/recruitment"
        >
            <AdminPageWrapper>
                <AdminPageHeader
                    icon={UserPlus}
                    title="Recruitment Portal"
                    subtitle="Post job vacancies, manage applications, and conduct interviews"
                    backHref="/dashboard/hr"
                />

                <div className="text-center py-20 bg-surface border border-border rounded-[2px] shadow-none">
                    <UserPlus className="w-16 h-16 text-border-hover mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-text-primary mb-2">Recruitment Coming Soon</h2>
                    <p className="text-text-secondary max-w-md mx-auto">
                        The recruitment and applicant tracking module is currently in development. This module will allow you to post job vacancies, manage applications, and conduct interviews once the backend integration is complete.
                    </p>
                </div>
            </AdminPageWrapper>
        </DashboardLayout>
    );
}

