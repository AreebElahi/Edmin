'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { UserRole } from '@/types/types';
import { CalendarDays, BookOpen, Building, Users, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { useSemesters, useSemesterCourses } from '@/features/academic/hooks/useAcademic';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminPageWrapper from "@/components/admin/AdminPageWrapper";
import AdminStatusBadge from '@/components/admin/AdminStatusBadge';

export default function SemestersDetailsPage() {
    const { data: currentUser } = useCurrentUser();
    const { data: semestersList = [], isLoading: isLoadingSemesters } = useSemesters();
    
    // Default to the ongoing semester if none selected
    const activeSemester = semestersList.find(s => s.status === 'ONGOING');
    const defaultSemesterId = activeSemester ? activeSemester.semesterid : (semestersList.length > 0 ? semestersList[0].semesterid : null);
    
    const [selectedSemesterId, setSelectedSemesterId] = useState<number | null>(null);
    
    // Use the explicitly selected semester, or fall back to the default
    const effectiveSemesterId = selectedSemesterId !== null ? selectedSemesterId : defaultSemesterId;

    const { data: courses = [], isLoading: isLoadingCourses } = useSemesterCourses(effectiveSemesterId);

    return (
        <DashboardLayout userRole={UserRole.ADMIN} userName={currentUser?.fullName || 'Admin'} notifications={[]}>            
            <AdminPageWrapper>
                
                {/* Header */}
                <AdminPageHeader
                    icon={CalendarDays}
                    title="Semester"
                    titleAccent="Details"
                    subtitle="View dynamic course, instructor, and department data for specific terms."
                />

                <div className="bg-surface border border-border">
                    <div className="px-5 py-4 border-b border-border bg-surface-hover flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-primary" strokeWidth={1.5} />
                            <h2 className="text-sm font-semibold text-text-primary">Ongoing Courses & Sections</h2>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-text-secondary uppercase tracking-widest">Select Term:</span>
                            <select 
                                value={effectiveSemesterId || ''} 
                                onChange={(e) => setSelectedSemesterId(Number(e.target.value))}
                                className="border border-border p-2 text-sm font-semibold outline-none focus:border-primary transition-colors bg-surface rounded-[2px] min-w-[200px]"
                                disabled={isLoadingSemesters}
                            >
                                {isLoadingSemesters ? (
                                    <option value="">Loading terms...</option>
                                ) : (
                                    semestersList.map(s => (
                                        <option key={s.semesterid} value={s.semesterid}>
                                            {s.name} {s.status === 'ONGOING' ? '(Active)' : ''}
                                        </option>
                                    ))
                                )}
                            </select>
                        </div>
                    </div>

                    <div className="p-0">
                        {isLoadingCourses ? (
                            <div className="flex flex-col items-center justify-center py-16 text-text-secondary">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                                <p className="text-sm">Loading semester data...</p>
                            </div>
                        ) : courses.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-text-muted">
                                <AlertCircle className="w-12 h-12 mb-4 opacity-50" strokeWidth={1} />
                                <h3 className="text-sm font-semibold text-text-primary mb-1">No Courses Found</h3>
                                <p className="text-xs">There are no courses scheduled for the selected semester.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-border bg-surface-hover text-[10px] uppercase tracking-widest text-text-secondary">
                                            <th className="p-4 font-semibold">Course Details</th>
                                            <th className="p-4 font-semibold">Department</th>
                                            <th className="p-4 font-semibold">Instructor</th>
                                            <th className="p-4 font-semibold">Capacity</th>
                                            <th className="p-4 font-semibold">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm divide-y divide-border">
                                        {courses.map((co: any) => (
                                            <tr key={co.courseofferingid} className="hover:bg-surface-hover transition-colors group">
                                                <td className="p-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-text-primary">{co.course?.name || 'Unknown Course'}</span>
                                                        <span className="text-xs text-text-secondary mt-0.5">{co.course?.code || 'N/A'}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2 text-text-secondary">
                                                        <Building className="w-3.5 h-3.5" />
                                                        <span className="text-xs font-medium">{co.department?.name || 'N/A'}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-primary-light flex items-center justify-center text-primary">
                                                            <Users className="w-3 h-3" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-semibold text-text-primary">
                                                                {co.faculty?.user?.name || co.faculty?.user?.email || 'Unassigned'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <span className="text-xs font-semibold text-text-secondary bg-surface-hover px-2 py-1 rounded-[2px] border border-border">
                                                        {co.capacity} Seats
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <AdminStatusBadge 
                                                        status={co.status === 'ACTIVE' ? 'Active' : 'Inactive'} 
                                                        variant={co.status === 'ACTIVE' ? 'success' : 'default'} 
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </AdminPageWrapper>
        </DashboardLayout>
    );
}
