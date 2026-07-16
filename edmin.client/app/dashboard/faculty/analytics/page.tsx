'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { UserRole, Notification } from '@/types/types';
import { Home, BarChart3, TrendingUp, Users, Award, BookOpen, ArrowUp, ArrowDown, Download, Calendar } from 'lucide-react';
import Link from 'next/link';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { useState, useEffect } from 'react';
import { DashboardAPI } from '@/utils/api';
import { apiGet } from '@/api/apiContract';

export default function FacultyAnalyticsPage() {
    const [timeRange, setTimeRange] = useState('This Semester');
    const [stats, setStats] = useState<any[]>([]);
    const [coursePerformance, setCoursePerformance] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [dash, analyticsRes] = await Promise.all([
                    DashboardAPI.getFacultyDashboard(),
                    apiGet('/faculty/analytics')
                ]);
                setProfile(dash.profile);
                const data = (analyticsRes as any)?.data;
                if (data) {
                    setStats(data.stats || []);
                    setCoursePerformance(data.coursePerformance || []);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <DashboardLayout userName="Loading..." userRole={UserRole.FACULTY} notifications={[]} currentPath="/dashboard/faculty/analytics">
                <div className="flex justify-center items-center h-[60vh]">
                    <div className="w-6 h-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            userRole={UserRole.FACULTY}
            userName={profile?.fullname || 'Faculty'}
            userAvatar={profile?.avatar}
            notifications={[]}
            currentPath="/dashboard/faculty/analytics"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <AdminPageHeader
                    icon={BarChart3}
                    title="Course"
                    titleAccent="Analytics"
                    subtitle="Insights into student performance and engagement"
                    eyebrow={{ icon: Home, label: "Faculty Portal" }}
                    actions={
                        <div className="flex gap-3">
                            <div className="relative">
                                <select
                                    value={timeRange}
                                    onChange={(e) => setTimeRange(e.target.value)}
                                    className="appearance-none bg-surface py-2.5 pl-4 pr-10 rounded-[2px] border border-border text-sm font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 shadow-none cursor-pointer"
                                >
                                    <option>This Semester</option>
                                    <option>Last Month</option>
                                    <option>Last Year</option>
                                </select>
                                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                            </div>
                            <button className="flex items-center gap-2 px-4 py-2 bg-surface border border-border text-text-primary font-medium rounded-[2px] hover:bg-surface-hover transition-colors">
                                <Download className="w-4 h-4" />
                                Export Report
                            </button>
                        </div>
                    }
                />

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {stats.map((stat, index) => {
                        let IconComponent;
                        if (index === 0) IconComponent = Users;
                        else if (index === 1) IconComponent = BookOpen;
                        else if (index === 2) IconComponent = Award;
                        else IconComponent = TrendingUp;

                        return (
                            <div key={index} className="bg-surface rounded-[2px] p-6 shadow-none border border-border">
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`p-3 rounded-[2px] bg-${stat.color}-50 text-${stat.color}-600`}>
                                        <IconComponent className="w-6 h-6" />
                                    </div>
                                    <div className={`flex items-center space-x-1 text-sm font-medium
                                        ${stat.trend === 'up' ? 'text-green-600' :
                                            stat.trend === 'down' ? 'text-red-600' :
                                                'text-gray-600'}`}>
                                        {stat.trend === 'up' && <ArrowUp className="w-4 h-4" />}
                                        {stat.trend === 'down' && <ArrowDown className="w-4 h-4" />}
                                        <span>{stat.change}</span>
                                    </div>
                                </div>
                                <h3 className="text-2xl font-bold text-text-primary mb-1">{stat.value}</h3>
                                <p className="text-text-secondary text-sm font-medium">{stat.title}</p>
                            </div>
                        );
                    })}
                </div>

                {/* Detailed Performance Table */}
                <div className="bg-surface rounded-[2px] shadow-none border border-border overflow-hidden mb-8">
                    <div className="p-6 border-b border-border flex items-center justify-between">
                        <h2 className="text-lg font-bold text-text-primary">Performance by Course</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-background">
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Course Name</th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-text-secondary uppercase tracking-wider">Attendance Rate</th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-text-secondary uppercase tracking-wider">Avg. Grade</th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-text-secondary uppercase tracking-wider">Submission Rate</th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-text-secondary uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#EDEBE9]">
                                {coursePerformance.map((course, index) => (
                                    <tr key={index} className="hover:bg-background/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-semibold text-text-primary">{course.name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="w-24 bg-background rounded-[2px] h-2 overflow-hidden">
                                                    <div className="bg-primary-light0 h-full rounded-[2px]" style={{ width: `${course.attendance}%` }}></div>
                                                </div>
                                                <span className="text-sm font-medium text-text-primary">{course.attendance}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className="px-2.5 py-1 rounded-[2px] bg-background text-text-primary font-bold text-sm">
                                                {course.grade}%
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className={`text-sm font-medium ${course.submissions >= 90 ? 'text-primary' : 'text-text-secondary'}`}>
                                                {course.submissions}%
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className="px-3 py-1 rounded-[2px] text-xs font-semibold bg-primary-light text-primary border border-border">
                                                On Track
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-blue-600 to-sky-600 rounded-[2px] p-6 text-white shadow-none">
                        <h3 className="text-lg font-bold mb-2">Student Engagement Insights</h3>
                        <p className="text-blue-100 mb-6 text-sm">
                            Students in Computer Science are showing 15% higher engagement in practical sessions compared to lectures.
                        </p>
                        <button className="bg-surface/20  hover:bg-surface/30 transition-colors text-white px-4 py-2 rounded-[2px] text-sm font-semibold">
                            View Detailed Report
                        </button>
                    </div>
                    <div className="bg-gradient-to-br from-slate-600 to-slate-700 rounded-[2px] p-6 text-white shadow-none">
                        <h3 className="text-lg font-bold mb-2">At-Risk Students</h3>
                        <p className="text-slate-100 mb-6 text-sm">
                            5 students across your courses have attendance below 75%. Early intervention is recommended.
                        </p>
                        <button className="bg-surface/20  hover:bg-surface/30 transition-colors text-white px-4 py-2 rounded-[2px] text-sm font-semibold">
                            View Students
                        </button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
