import { Suspense } from 'react';
import CreateAttendanceContent from './AttendanceCreateContent';

export default function CreateAttendanceSessionPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-[2px] animate-spin"></div>
            </div>
        }>
            <CreateAttendanceContent />
        </Suspense>
    );
}
