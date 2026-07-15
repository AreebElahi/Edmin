'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StudentPromotionPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/dashboard/admin/examination?tab=promotion');
    }, [router]);

    return (
        <div className="flex h-screen items-center justify-center bg-background">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-[2px] animate-spin"></div>
        </div>
    );
}
