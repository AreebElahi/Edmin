import { Suspense } from 'react';
import AdminUsersContent from './AdminUsersContent';

export default function AdminUsersPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="p-8 text-center text-text-secondary">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-[2px] animate-spin mx-auto mb-4"></div>
                    Loading Records...
                </div>
            </div>
        }>
            <AdminUsersContent />
        </Suspense>
    );
}
