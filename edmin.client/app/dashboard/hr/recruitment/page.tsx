'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { UserRole } from '@/types/types';
import { UserPlus, Home } from 'lucide-react';
import Link from 'next/link';

export default function RecruitmentPage() {
    return (
        <DashboardLayout
            userRole={UserRole.HR}
            userName="Areeb Elahi"
            userAvatar="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
            notifications={[]}
            currentPath="/dashboard/hr/recruitment"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Breadcrumb */}
                <nav className="flex mb-6" aria-label="Breadcrumb">
                    <ol className="flex items-center space-x-2 bg-surface px-3 py-2 rounded-[2px] border border-border shadow-none">
                        <li>
                            <Link href="/dashboard/hr" className="text-text-secondary hover:text-primary transition-colors">
                                <Home className="w-4 h-4" />
                            </Link>
                        </li>
                        <li><span className="text-border-hover">/</span></li>
                        <li><span className="text-sm font-medium text-text-primary">Recruitment</span></li>
                    </ol>
                </nav>

                <div className="text-center py-20 bg-surface border border-border rounded-[2px] shadow-none">
                    <UserPlus className="w-16 h-16 text-border-hover mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-text-primary mb-2">Recruitment Coming Soon</h2>
                    <p className="text-text-secondary max-w-md mx-auto">
                        The recruitment and applicant tracking module is currently in development. This module will allow you to post job vacancies, manage applications, and conduct interviews once the backend integration is complete.
                    </p>
                </div>

            </div>
        </DashboardLayout>
    );
}
