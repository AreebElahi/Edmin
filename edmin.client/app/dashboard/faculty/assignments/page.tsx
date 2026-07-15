import { Suspense } from 'react';
import FacultyAssignmentsContent from './AssignmentsContent';

export default function FacultyAssignmentsPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen items-center justify-center bg-background">
                <div className=" flex flex-col items-center">
                    <div className="h-12 w-12 bg-blue-200 rounded-[2px] mb-4"></div>
                    <div className="h-4 w-32 bg-border rounded"></div>
                </div>
            </div>
        }>
            <FacultyAssignmentsContent />
        </Suspense>
    );
}
