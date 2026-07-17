'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { UserRole } from '@/types/types';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import { Calendar, Building } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { HodAPI } from '@/utils/api';

export default function HodCoursesOfferingsPage() {
    const { data: coursesRes, isLoading } = useQuery({
        queryKey: ['hod-courses'],
        queryFn: HodAPI.getDepartmentCourses
    });

    const courses = coursesRes || [];
    const offerings = courses.flatMap((c: any) => 
        (c.courseoffering || []).map((o: any) => ({
            ...o,
            courseCode: c.code,
            courseName: c.name,
            credits: c.credits,
            enrollmentCount: o._count?.courseenrollment || 0
        }))
    );

    return (
        <DashboardLayout userRole={UserRole.FACULTY} userName="HOD" notifications={[]} currentPath="/dashboard/faculty/hod/courses/offerings">
            <AdminPageWrapper>
                <AdminPageHeader
                    icon={Calendar}
                    title="Semester"
                    titleAccent="Offerings"
                    subtitle="Review course offerings scheduled for the current and upcoming semesters."
                    eyebrow={{ icon: Building, label: "HOD Administration" }}
                />
                
                <div className="bg-surface rounded-[2px] shadow-none border border-border flex flex-col flex-1 p-6">
                    {isLoading ? (
                        <div className="flex justify-center items-center py-10">
                            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : offerings.length === 0 ? (
                        <div className="flex justify-center items-center py-10 text-text-secondary">
                            No course offerings found for this department.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-border text-xs uppercase tracking-wider text-text-muted">
                                        <th className="p-3">Course</th>
                                        <th className="p-3">Term</th>
                                        <th className="p-3">Assigned Faculty</th>
                                        <th className="p-3">Enrollments</th>
                                        <th className="p-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {offerings.map((offering: any) => (
                                        <tr key={offering.courseofferingid} className="border-b border-border hover:bg-surface-hover">
                                            <td className="p-3">
                                                <div className="font-bold text-sm text-text-primary">{offering.courseName}</div>
                                                <div className="text-xs text-text-secondary">{offering.courseCode} ({offering.credits} Cr)</div>
                                            </td>
                                            <td className="p-3 font-medium text-sm text-text-primary">
                                                {offering.term || 'Ongoing'}
                                            </td>
                                            <td className="p-3 text-sm text-text-primary">
                                                {offering.faculty?.user?.username || offering.faculty?.fullname || 'Not Assigned'}
                                            </td>
                                            <td className="p-3 text-sm text-text-secondary font-medium">
                                                {offering.enrollmentCount} / {offering.maxcapacity}
                                            </td>
                                            <td className="p-3 text-sm">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${offering.isactive ? 'bg-success-10 text-success-600' : 'bg-surface-hover text-text-secondary'}`}>
                                                    {offering.isactive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </AdminPageWrapper>
        </DashboardLayout>
    );
}
