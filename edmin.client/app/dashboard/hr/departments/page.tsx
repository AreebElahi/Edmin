'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { UserRole } from '@/types/types';
import { Building, Users, TrendingUp, Search, Loader2, Home } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useDepartments } from '@/features/departments/hooks/useDepartments';

export default function DepartmentsPage() {
    const { data: departments = [], isLoading } = useDepartments();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredDepartments = departments.filter(dept =>
        dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dept.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <DashboardLayout
            userRole={UserRole.HR}
            userName="Sarah Anderson"
            userAvatar="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
            notifications={[]}
            currentPath="/dashboard/hr/departments"
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
                        <li><span className="text-sm font-medium text-text-primary">Departments</span></li>
                    </ol>
                </nav>

                {/* Header Card */}
                <div className="bg-surface rounded-[2px] p-6 shadow-none border border-border relative overflow-hidden mb-8">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-sky-500 to-slate-500"></div>
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-text-primary mb-1">Departments</h1>
                            <p className="text-text-secondary">Overview of all university faculties and divisions</p>
                        </div>
                    </div>
                </div>

                {/* Search Filter */}
                <div className="mb-6 max-w-md">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                        <input
                            type="text"
                            placeholder="Search departments..."
                            className="w-full pl-9 pr-4 py-2 text-sm rounded-[2px] border border-border focus:border-blue-500 outline-none bg-surface"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Grid */}
                {isLoading ? (
                    <div className="flex justify-center items-center h-48">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                ) : filteredDepartments.length === 0 ? (
                    <div className="text-center py-16 bg-surface border border-border rounded-[2px] shadow-none">
                        <Building className="w-12 h-12 text-border-hover mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-text-primary mb-1">No departments found</h3>
                        <p className="text-text-secondary">Try adjusting your search query.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredDepartments.map((dept, idx) => {
                            const colors = ['blue', 'purple', 'indigo', 'teal', 'orange', 'rose'];
                            const color = colors[idx % colors.length];
                            const themeColors: Record<string, any> = {
                                blue: { bg: 'bg-primary-light', text: 'text-primary' },
                                purple: { bg: 'bg-primary-light', text: 'text-primary' },
                                indigo: { bg: 'bg-surface-hover', text: 'text-text-secondary' },
                                teal: { bg: 'bg-primary-light', text: 'text-primary' },
                                orange: { bg: 'bg-error-bg', text: 'text-error-text' },
                                rose: { bg: 'bg-pink-50', text: 'text-pink-600' },
                            };
                            const theme = themeColors[color] || themeColors.blue;
                            const staffCount = dept.sections ? dept.sections.reduce((acc: number, s: any) => acc + (s.students || 0), 0) : 0;

                            return (
                                <div key={dept.id} className="bg-surface rounded-[2px] border border-border shadow-none p-6 hover:shadow-none transition-all h-full">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className={`p-3 rounded-[2px] ${theme.bg} ${theme.text}`}>
                                            <Building className="w-6 h-6" />
                                        </div>
                                        <span className="text-xs font-mono font-bold bg-background text-text-secondary px-2 py-0.5 rounded">
                                            {dept.code}
                                        </span>
                                    </div>

                                    <h3 className="text-xl font-bold text-text-primary mb-2">{dept.name}</h3>

                                    <div className="flex items-center gap-3 mb-6">
                                        <img 
                                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(dept.hod)}&background=0D8ABC&color=fff`} 
                                            alt={dept.hod} 
                                            className="w-8 h-8 rounded-[2px] object-cover border border-white shadow-none" 
                                        />
                                        <div>
                                            <p className="text-xs text-text-secondary">Head of Dept.</p>
                                            <p className="text-sm font-medium text-text-primary">{dept.hod}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-sm">
                                            <div className="flex items-center gap-2 text-text-primary">
                                                <Users className="w-4 h-4" />
                                                <span>{staffCount} Students Enrolled</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-primary font-medium bg-primary-light px-2 py-0.5 rounded-[2px] text-xs">
                                                <TrendingUp className="w-3 h-3" />
                                                Active
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
