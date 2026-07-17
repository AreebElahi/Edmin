'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { UserRole } from '@/types/types';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import { BookOpen, Building } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { HodAPI } from '@/utils/api';

export default function HodCoursesListPage() {
    const { data: coursesRes, isLoading } = useQuery({
        queryKey: ['hod-courses'],
        queryFn: HodAPI.getDepartmentCourses
    });

    const courses = coursesRes || [];

    return (
        <DashboardLayout userRole={UserRole.FACULTY} userName="HOD" notifications={[]} currentPath="/dashboard/faculty/hod/courses/list">
            <AdminPageWrapper>
                <AdminPageHeader
                    icon={BookOpen}
                    title="Department"
                    titleAccent="Courses"
                    subtitle="View the complete list of courses offered by the department."
                    eyebrow={{ icon: Building, label: "HOD Administration" }}
                />
                
                <div className="bg-surface rounded-[2px] shadow-none border border-border flex flex-col flex-1 p-6">
                    {isLoading ? (
                        <div className="flex justify-center items-center py-10">
                            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : courses.length === 0 ? (
                        <div className="flex justify-center items-center py-10 text-text-secondary">
                            No courses found for this department.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-border text-xs uppercase tracking-wider text-text-muted">
                                        <th className="p-3">Course Code</th>
                                        <th className="p-3">Course Name</th>
                                        <th className="p-3">Credits</th>
                                        <th className="p-3">Base Capacity</th>
                                        <th className="p-3">Offerings</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {courses.map((course: any) => (
                                        <tr key={course.courseid} className="border-b border-border hover:bg-surface-hover">
                                            <td className="p-3 font-medium text-sm text-text-primary">
                                                {course.code}
                                            </td>
                                            <td className="p-3 font-bold text-sm text-text-primary">
                                                {course.name}
                                            </td>
                                            <td className="p-3 text-sm text-text-secondary">
                                                {course.credits}
                                            </td>
                                            <td className="p-3 text-sm text-text-secondary">
                                                {course.basecapacity}
                                            </td>
                                            <td className="p-3 text-sm text-primary font-medium">
                                                {course.courseoffering?.length || 0} active
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
