'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { UserRole } from '@/types/types';
import { Search, Filter, Mail, Phone, Loader2, Building, Users, Home } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useUsers, useDepartments } from '@/features/users/hooks/useUsers';

export default function EmployeesPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDept, setSelectedDept] = useState('All');

    // Fetch live data from backend using react-query hooks
    const { data: users = [], isLoading: isLoadingUsers } = useUsers({
        search: searchTerm
    });
    const { data: departments = [] } = useDepartments();

    // Filter out student role, keeping only actual employees (FACULTY, STAFF, HR, ADMIN)
    const employees = users.filter(u => u.role !== 'STUDENT');

    const filteredEmployees = employees.filter(emp =>
        selectedDept === 'All' || emp.dept === selectedDept
    );

    return (
        <DashboardLayout
            userRole={UserRole.HR}
            userName="Sarah Anderson"
            userAvatar="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
            notifications={[]}
            currentPath="/dashboard/hr/employees"
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
                        <li><span className="text-sm font-medium text-text-primary">Employees</span></li>
                    </ol>
                </nav>

                {/* Header Card */}
                <div className="bg-surface rounded-[2px] p-6 shadow-none border border-border relative overflow-hidden mb-8">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-sky-500 to-slate-500"></div>
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-text-primary mb-1">Employee Directory</h1>
                            <p className="text-text-secondary">Manage and view all university staff and faculty members</p>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-surface p-4 rounded-[2px] border border-border shadow-none mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                        <input
                            type="text"
                            placeholder="Search by name, ID, or email..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-[2px] border border-border focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-surface"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <div className="relative min-w-[150px] flex-1 md:flex-none">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                            <select
                                className="w-full pl-9 pr-4 py-2.5 rounded-[2px] border border-border bg-surface focus:border-blue-500 outline-none appearance-none cursor-pointer text-sm font-medium text-text-primary"
                                value={selectedDept}
                                onChange={(e) => setSelectedDept(e.target.value)}
                            >
                                <option value="All">All Departments</option>
                                {departments.map(dept => (
                                    <option key={dept.departmentid} value={dept.name}>{dept.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Table */}
                {isLoadingUsers ? (
                    <div className="flex justify-center items-center h-48 bg-surface rounded-[2px] border border-border shadow-none">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                ) : filteredEmployees.length === 0 ? (
                    <div className="text-center py-16 bg-surface border border-border rounded-[2px] shadow-none">
                        <Users className="w-12 h-12 text-border-hover mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-text-primary mb-1">No employees found</h3>
                        <p className="text-text-secondary">Try adjusting your filters or search query.</p>
                    </div>
                ) : (
                    <div className="bg-surface rounded-[2px] border border-border shadow-none overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-background/50 border-b border-border">
                                        <th className="px-6 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Employee</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Role & Dept</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Position</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Contact</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Join Date</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#EDEBE9]">
                                    {filteredEmployees.map((emp) => (
                                        <tr key={emp.id} className="hover:bg-background/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-[2px] bg-primary-light flex items-center justify-center text-primary font-bold border-2 border-white shadow-none">
                                                        {emp.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-sm font-semibold text-text-primary">{emp.name}</h3>
                                                        <span className="text-xs text-text-secondary">UID-{emp.id}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-medium text-text-primary">{emp.role}</p>
                                                <p className="text-xs text-text-secondary">{emp.dept}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-xs text-text-muted italic">Not available</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                                                        <Mail className="w-3 h-3" />
                                                        {emp.email}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-text-muted italic">
                                                        <Phone className="w-3 h-3" />
                                                        Not available
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-xs text-text-muted italic">Not available</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-[2px] text-xs font-medium border ${emp.status === 'Active'
                                                    ? 'bg-primary-light text-primary border-border'
                                                    : 'bg-error-bg text-error-text border-border'
                                                    }`}>
                                                    <div className={`w-1.5 h-1.5 rounded-[2px] mr-1.5 ${emp.status === 'Active' ? 'bg-primary-light0' : 'bg-error-bg0'
                                                        }`}></div>
                                                    {emp.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
                            <p className="text-sm text-text-secondary">Showing <span className="font-medium">{filteredEmployees.length}</span> results</p>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
