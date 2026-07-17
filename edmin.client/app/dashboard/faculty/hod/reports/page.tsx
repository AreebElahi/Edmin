'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { UserRole } from '@/types/types';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import { FileText, Building, Users, BookOpen, GraduationCap, TrendingUp, Download } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { HodAPI } from '@/utils/api';

const downloadCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
        alert('No data available to export.');
        return;
    }
    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => JSON.stringify(row[header] ?? '')).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export default function HodReportsPage() {
    const { data: statsRes, isLoading } = useQuery({
        queryKey: ['hod-stats'],
        queryFn: HodAPI.getDashboardStats
    });

    const [isGeneratingAcademic, setIsGeneratingAcademic] = useState(false);
    const [isGeneratingActivity, setIsGeneratingActivity] = useState(false);

    const stats = statsRes?.stats || { totalFaculty: 0, totalStudents: 0, activeCourses: 0, avgProgress: 0 };
    const departmentName = statsRes?.departmentName || 'Department';

    const handleAcademicReport = async () => {
        setIsGeneratingAcademic(true);
        try {
            const data = await HodAPI.getDepartmentStudents();
            const enrollments = data?.enrollments || [];
            
            const formattedData = enrollments.map((s: any) => ({
                'Student Name': s.student?.user?.username || 'Unknown',
                'Course': s.courseoffering?.course?.name || 'Unknown',
                'Status': s.isactive ? 'Active' : 'Inactive',
                'Enrollment Date': new Date(s.createdat).toLocaleDateString()
            }));
            
            downloadCSV(formattedData, `academic_report_${new Date().toISOString().split('T')[0]}.csv`);
        } catch (error) {
            console.error('Failed to generate report', error);
            alert('Failed to generate report.');
        } finally {
            setIsGeneratingAcademic(false);
        }
    };

    const handleActivityReport = async () => {
        setIsGeneratingActivity(true);
        try {
            const reports = await HodAPI.getDepartmentActivityReports();
            
            const formattedData = (reports || []).map((r: any) => ({
                'Faculty Name': r.facultyName || 'Unknown',
                'Date': new Date(r.date).toLocaleDateString(),
                'Summary': r.summary,
                'Status': r.status
            }));
            
            downloadCSV(formattedData, `faculty_activity_${new Date().toISOString().split('T')[0]}.csv`);
        } catch (error) {
            console.error('Failed to generate report', error);
            alert('Failed to generate report.');
        } finally {
            setIsGeneratingActivity(false);
        }
    };

    return (
        <DashboardLayout userRole={UserRole.FACULTY} userName="HOD" notifications={[]} currentPath="/dashboard/faculty/hod/reports">
            <AdminPageWrapper>
                <AdminPageHeader
                    icon={FileText}
                    title="Department"
                    titleAccent="Reports"
                    subtitle={`Export reports for faculty workload, attendance, and academics for ${departmentName}.`}
                    eyebrow={{ icon: Building, label: "HOD Administration" }}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* KPI Widget */}
                    <div className="bg-surface rounded-[2px] shadow-none border border-border flex flex-col p-6">
                        <h3 className="text-lg font-bold mb-4">Department Aggregate Metrics</h3>
                        {isLoading ? (
                            <div className="flex justify-center items-center flex-1">
                                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-surface-hover rounded-[2px] border border-border">
                                    <Users className="w-5 h-5 text-primary mb-2" />
                                    <p className="text-xs text-text-secondary">Total Faculty</p>
                                    <p className="text-2xl font-bold">{stats.totalFaculty}</p>
                                </div>
                                <div className="p-4 bg-surface-hover rounded-[2px] border border-border">
                                    <GraduationCap className="w-5 h-5 text-indigo-500 mb-2" />
                                    <p className="text-xs text-text-secondary">Total Students</p>
                                    <p className="text-2xl font-bold">{stats.totalStudents}</p>
                                </div>
                                <div className="p-4 bg-surface-hover rounded-[2px] border border-border">
                                    <BookOpen className="w-5 h-5 text-sky-500 mb-2" />
                                    <p className="text-xs text-text-secondary">Active Courses</p>
                                    <p className="text-2xl font-bold">{stats.activeCourses}</p>
                                </div>
                                <div className="p-4 bg-surface-hover rounded-[2px] border border-border">
                                    <TrendingUp className="w-5 h-5 text-emerald-500 mb-2" />
                                    <p className="text-xs text-text-secondary">Average Progress</p>
                                    <p className="text-2xl font-bold">{stats.avgProgress}%</p>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* Exports Placeholder */}
                    <div className="bg-surface rounded-[2px] shadow-none border border-border flex flex-col p-6 items-center justify-center text-center">
                        <FileText className="w-12 h-12 text-text-muted mb-4" />
                        <h3 className="text-lg font-bold mb-2">Export Data Reports</h3>
                        <p className="text-sm text-text-secondary mb-6">Generate downloadable reports in CSV format for archiving and deeper analysis.</p>
                        
                        <div className="flex flex-col gap-3 w-full max-w-sm">
                            <button 
                                onClick={handleAcademicReport}
                                disabled={isGeneratingAcademic}
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white font-semibold rounded-[2px] hover:bg-primary-hover transition-colors disabled:opacity-50"
                            >
                                {isGeneratingAcademic ? 'Generating...' : (
                                    <>
                                        <Download className="w-4 h-4" />
                                        Generate Monthly Academic Report
                                    </>
                                )}
                            </button>
                            <button 
                                onClick={handleActivityReport}
                                disabled={isGeneratingActivity}
                                className="flex items-center justify-center gap-2 px-4 py-2 border border-border bg-surface font-semibold rounded-[2px] hover:bg-surface-hover transition-colors disabled:opacity-50"
                            >
                                {isGeneratingActivity ? 'Generating...' : (
                                    <>
                                        <Download className="w-4 h-4" />
                                        Export Faculty Activity Log
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </AdminPageWrapper>
        </DashboardLayout>
    );
}
