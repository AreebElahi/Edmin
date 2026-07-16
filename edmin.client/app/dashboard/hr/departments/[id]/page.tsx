'use client';

import DashboardLayout from '@/components/DashboardLayout';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { UserRole } from '@/types/types';
import { Search, Filter, ArrowLeft, Mail, Phone, CalendarCheck, Loader2, Home, Building } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useUsers, useDepartments } from '@/features/users/hooks/useUsers';

export default function DepartmentDetailsPage() {
    const params = useParams();
    const deptId = Number(params.id);
    const [searchTerm, setSearchTerm] = useState('');

    const { data: users = [], isLoading: isLoadingUsers } = useUsers({});
    const { data: departments = [], isLoading: isLoadingDepts } = useDepartments();

    const deptName = departments.find(d => d.departmentid === deptId)?.name || 'Department';

    // In a real app we would filter by departmentid, but the useUsers hook currently
    // maps department to a string name. So we match by name.
    const filteredEmployees = users.filter(emp => 
        emp.dept === deptName && 
        emp.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const isLoading = isLoadingUsers || isLoadingDepts;

    return (
        <DashboardLayout
            userRole={UserRole.HR}
            notifications={[]}
            currentPath={`/dashboard/hr/departments/${deptId}`}
        >
            <AdminPageWrapper>
                <AdminPageHeader
                    icon={Building}
                    title={deptName}
                    subtitle="Department details and staff directory"
                    backHref="/dashboard/hr/departments"
                    eyebrow={{ icon: Home, label: "Departments" }}
                />

                <div className="mb-6 flex gap-3">
                    <div className="relative max-w-md w-full flex-[2]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                        <input
                            type="text"
                            placeholder="Search staff..."
                            className="w-full pl-9 pr-4 py-2 text-sm rounded-[2px] border border-border focus:border-blue-500 outline-none bg-surface"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center h-48 bg-surface rounded-[2px] border border-border">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                ) : filteredEmployees.length === 0 ? (
                    <div className="text-center py-16 bg-surface border border-border rounded-[2px]">
                        <p className="text-text-secondary">No staff members found in this department.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredEmployees.map((emp) => (
                            <div key={emp.id} className="bg-surface rounded-[2px] border border-border p-6 flex flex-col h-full">
                                <div className="flex gap-4 items-start mb-4">
                                    <div className="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center text-primary font-bold shrink-0">
                                        {emp.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-text-primary">{emp.name}</h3>
                                        <p className="text-sm font-medium text-text-secondary">{emp.role}</p>
                                    </div>
                                </div>
                                
                                <div className="space-y-3 mt-auto pt-4 border-t border-border">
                                    <div className="flex items-center gap-3 text-sm text-text-secondary">
                                        <Mail className="w-4 h-4 text-text-muted" />
                                        <span className="truncate">{emp.email}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-text-muted italic">
                                        <Phone className="w-4 h-4 text-text-muted" />
                                        <span>Not available</span>
                                    </div>
                                    <div className="flex justify-between items-center mt-2">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-[2px] text-xs font-medium border ${emp.status === 'Active' ? 'bg-primary-light text-primary border-border' : 'bg-error-bg text-error-text border-border'}`}>
                                            <div className={`w-1.5 h-1.5 rounded-[2px] mr-1.5 ${emp.status === 'Active' ? 'bg-primary-light0' : 'bg-error-bg0'}`}></div>
                                            {emp.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </AdminPageWrapper>
        </DashboardLayout>
    );
}
