'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { UserRole } from '@/types/types';
import { Building, Users, BookOpen, BarChart3, TrendingUp, Calendar, ArrowRight, ShieldCheck, ClipboardCheck, GraduationCap, Home } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminStatusBadge from '@/components/admin/AdminStatusBadge';
import { Autoplay, Pagination } from 'swiper/modules';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { HodAPI, DashboardAPI } from '@/utils/api';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import PersonalLeaveWidget from '@/components/PersonalLeaveWidget';
import { useState, useEffect } from 'react';

export default function HODDashboard() {
    const { data: statsRes, isLoading: statsLoading } = useQuery({
        queryKey: ['hod-stats'],
        queryFn: HodAPI.getDashboardStats
    });

    const { data: activityRes, isLoading: activityLoading } = useQuery({
        queryKey: ['hod-activity'],
        queryFn: HodAPI.getFacultyActivity
    });

    const { data: eventsRes, isLoading: eventsLoading } = useQuery({
        queryKey: ['hod-events'],
        queryFn: HodAPI.getUpcomingEvents
    });

    const [profile, setProfile] = useState<any>(null);

    useEffect(() => {
        DashboardAPI.getFacultyDashboard().then(res => setProfile(res?.profile)).catch(console.error);
    }, []);

    const s = statsRes?.stats || { totalFaculty: 0, totalStudents: 0, activeCourses: 0, avgProgress: 0 };
    const departmentName = statsRes?.departmentName || 'Department';

    const stats = [
        { label: 'Total Faculty', value: s.totalFaculty.toString(), icon: Users, color: 'blue' },
        { label: 'Total Students', value: s.totalStudents.toString(), icon: GraduationCap, color: 'indigo' },
        { label: 'Active Courses', value: s.activeCourses.toString(), icon: BookOpen, color: 'sky' },
        { label: 'Average Progress', value: `${s.avgProgress}%`, icon: BarChart3, color: 'emerald' },
    ];

    const facultyStatus = activityRes || [];
    const upcomingEvents = eventsRes || [];

    return (
        <DashboardLayout
            userRole={UserRole.FACULTY}
            userName={profile?.fullname || 'HOD'}
            notifications={[]}
            currentPath="/dashboard/faculty/hod"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <AdminPageHeader
                    icon={Building}
                    title="HOD Departmental"
                    titleAccent="View"
                    subtitle={`Overview of ${departmentName} performance and staff activity.`}
                    eyebrow={{ icon: Home, label: "Faculty Portal" }}
                    actions={
                        <Link href="/dashboard/faculty/approvals" className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-[2px] font-medium hover:bg-primary-hover transition-colors shadow-none">
                            <ClipboardCheck className="w-4 h-4" />
                            Review Approvals
                        </Link>
                    }
                />

                {/* KPI Stats Swiper */}
                <div className="mb-8 relative student-stats-swiper">
                    <Swiper
                        modules={[Autoplay, Pagination]}
                        spaceBetween={16}
                        slidesPerView={1}
                        pagination={{ 
                            clickable: true,
                            dynamicBullets: true,
                        }}
                        autoplay={{ delay: 4000, disableOnInteraction: false }}
                        breakpoints={{
                            640: { slidesPerView: 2 },
                            1024: { slidesPerView: 4 }
                        }}
                        className="!overflow-visible"
                    >
                        {stats.map((stat, index) => {
                            const Icon = stat.icon;
                            return (
                                <SwiperSlide key={index}>
                                    <div className="bg-surface p-5 rounded-[2px] border border-border shadow-none hover:shadow-none transition-shadow-none group h-full">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <p className="text-sm font-medium text-text-secondary mb-1">{stat.label}</p>
                                                <h3 className="text-2xl font-bold text-text-primary">{stat.value}</h3>
                                            </div>
                                            <div className={`p-3 rounded-[2px] bg-${stat.color}-50 text-${stat.color}-600 group-hover:scale-110 transition-transform`}>
                                                <Icon className="w-5 h-5" />
                                            </div>
                                        </div>
                                    </div>
                                </SwiperSlide>
                            );
                        })}
                    </Swiper>
                </div>

                {/* Personal Leave Widget */}
                <PersonalLeaveWidget />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Faculty Activity */}
                    <div className="lg:col-span-2 bg-surface rounded-[2px] shadow-none border border-border p-6 overflow-hidden">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2 leading-tight">
                                <ShieldCheck className="w-6 h-6 text-primary shrink-0" />
                                <span>Faculty Deployment Status</span>
                            </h2>
                            <button className="text-sm font-semibold text-primary hover:underline self-start sm:self-auto shrink-0">View Detailed Roster</button>
                        </div>
                        <div className="overflow-x-auto no-scrollbar -mx-6 px-6 sm:mx-0 sm:px-0">
                            <table className="w-full min-w-[600px]">
                                <thead>
                                    <tr className="text-left text-xs font-bold text-text-muted uppercase tracking-widest border-b border-border pb-4">
                                        <th className="pb-4 whitespace-nowrap">Faculty Name</th>
                                        <th className="pb-4 whitespace-nowrap">Status</th>
                                        <th className="pb-4 whitespace-nowrap">Current Activity</th>
                                        <th className="pb-4 whitespace-nowrap">Load</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#EDEBE9]">
                                    {facultyStatus.map((f: any, i: number) => (
                                        <tr key={i} className="group hover:bg-background/50 transition-colors">
                                            <td className="py-4 font-bold text-text-primary whitespace-nowrap">{f.name}</td>
                                            <td className="py-4 whitespace-nowrap">
                                                <AdminStatusBadge 
                                                    status={f.status} 
                                                    variant={f.status === 'In Class' ? 'primary' : f.status === 'Available' ? 'success' : 'error'} 
                                                />
                                            </td>
                                            <td className="py-4 text-sm text-text-primary whitespace-nowrap">{f.course}</td>
                                            <td className="py-4 text-sm font-bold text-text-primary whitespace-nowrap">{f.load}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Quick Analytics */}
                    <div className="space-y-6">
                        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[2px] shadow-none p-6 text-white">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-indigo-200" />
                                Departmental Progress
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-xs font-bold mb-1">
                                        <span>Course Completion</span>
                                        <span>78%</span>
                                    </div>
                                    <div className="w-full bg-surface/20 rounded-[2px] h-1.5 overflow-hidden">
                                        <div className="bg-surface h-full" style={{ width: '78%' }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs font-bold mb-1">
                                        <span>Student Attendance</span>
                                        <span>85%</span>
                                    </div>
                                    <div className="w-full bg-surface/20 rounded-[2px] h-1.5 overflow-hidden">
                                        <div className="bg-surface h-full" style={{ width: '85%' }}></div>
                                    </div>
                                </div>
                            </div>
                            <button className="w-full mt-6 py-2.5 bg-surface/10 hover:bg-surface/20 rounded-[2px] text-sm font-bold transition-all border border-white/10">
                                Generate Monthly Report
                            </button>
                        </div>

                        <div className="bg-surface rounded-[2px] border border-border p-6 shadow-none">
                            <h3 className="font-bold text-text-primary mb-4 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-orange-500" />
                                Upcoming Dept Events
                            </h3>
                            <div className="space-y-4">
                                {upcomingEvents.length === 0 ? (
                                    <p className="text-sm text-text-secondary">No upcoming events</p>
                                ) : upcomingEvents.map((e: any, i: number) => {
                                    const dateStr = new Date(e.date).toLocaleDateString();
                                    return (
                                        <div key={i} className={`border-l-2 ${i % 2 === 0 ? 'border-orange-500' : 'border-blue-500'} pl-3`}>
                                            <p className="text-sm font-bold text-text-primary">{e.title}</p>
                                            <p className="text-xs text-text-secondary">{dateStr} • {e.time || 'TBD'} {e.type ? `• ${e.type}` : ''}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

