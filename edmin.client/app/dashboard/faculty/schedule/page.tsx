'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { UserRole, Notification } from '@/types/types';
import { Home, ChevronLeft, ChevronRight, Clock, MapPin, Users, Calendar as CalendarIcon } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { DashboardAPI } from '@/utils/api';
import { apiGet } from '@/api/apiContract';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

export default function FacultySchedulePage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [scheduleEvents, setScheduleEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [dash, scheduleRes] = await Promise.all([
                    DashboardAPI.getFacultyDashboard(),
                    apiGet('/faculty/schedule')
                ]);
                setProfile(dash.profile);
                const rawSchedule = (scheduleRes as any[]) || [];
                const dayMap: Record<string, number> = { 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5 };
                setScheduleEvents(rawSchedule.map((s: any) => ({
                    id: s.id,
                    title: `${s.courseName} (${s.courseId})`,
                    type: s.type,
                    startTime: s.startTime?.substring(0,5), // e.g. "09:00"
                    endTime: s.endTime?.substring(0,5),
                    room: s.room,
                    day: dayMap[s.day] || 1,
                    students: 0,
                    color: 'bg-primary-light border-border text-primary'
                })));
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const nextWeek = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + 7);
        setCurrentDate(newDate);
    };

    const prevWeek = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() - 7);
        setCurrentDate(newDate);
    };

    const getDayDate = (dayIndex: number) => {
        const startOfWeek = new Date(currentDate);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
        startOfWeek.setDate(diff);

        const targetDate = new Date(startOfWeek);
        targetDate.setDate(startOfWeek.getDate() + dayIndex);
        return targetDate.getDate();
    };

    const getMonthName = () => {
        return currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    };

    if (loading) {
        return (
            <DashboardLayout userName="Loading..." userRole={UserRole.FACULTY} notifications={[]} currentPath="/dashboard/faculty/schedule">
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
            currentPath="/dashboard/faculty/schedule"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Breadcrumb */}
                <nav className="flex mb-6" aria-label="Breadcrumb">
                    <ol className="flex items-center space-x-2 bg-surface px-3 py-2 rounded-[2px] border border-border shadow-none">
                        <li>
                            <Link href="/dashboard/faculty" className="text-text-secondary hover:text-primary transition-colors">
                                <Home className="w-4 h-4" />
                            </Link>
                        </li>
                        <li><span className="text-border-hover">/</span></li>
                        <li><span className="text-sm font-medium text-text-primary">Schedule</span></li>
                    </ol>
                </nav>

                {/* Header with Calendar Controls */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-text-primary">Weekly Schedule</h1>
                        <p className="text-text-secondary mt-1">Manage your classes and meetings</p>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4 bg-surface p-1.5 rounded-[2px] border border-border shadow-none self-start md:self-auto shrink-0 max-w-full overflow-x-auto no-scrollbar">
                        <button
                            onClick={prevWeek}
                            className="p-2 hover:bg-background rounded-[2px] text-text-primary transition-colors shrink-0"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-2 px-2 font-semibold text-text-primary min-w-max justify-center text-sm sm:text-base">
                            <CalendarIcon className="w-4 h-4 text-text-secondary shrink-0" />
                            <span className="whitespace-nowrap">{getMonthName()}</span>
                        </div>
                        <button
                            onClick={nextWeek}
                            className="p-2 hover:bg-background rounded-[2px] text-text-primary transition-colors shrink-0"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Calendar Grid */}
                <div className="bg-surface rounded-[2px] shadow-none border border-border overflow-hidden">
                    <div className="overflow-x-auto no-scrollbar">
                        <div className="min-w-[800px]">
                            {/* Days Header */}
                            <div className="grid grid-cols-6 border-b border-border bg-background">
                                <div className="p-4 border-r border-border text-center text-sm font-semibold text-text-secondary">
                                    Time
                                </div>
                                {days.map((day, index) => (
                                    <div key={day} className="p-4 border-r border-border last:border-r-0 text-center">
                                        <div className="text-sm font-semibold text-text-primary">{day}</div>
                                        <div className={`text-xs mt-1 font-medium ${new Date().getDay() === index + 1 && new Date().toDateString() === currentDate.toDateString() // Basic check, ideally compare full dates
                                            ? 'text-primary bg-primary-light px-2 py-0.5 rounded-[2px] inline-block'
                                            : 'text-text-secondary'
                                            }`}>
                                            {getDayDate(index)}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Time Slots */}
                            <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                                {timeSlots.map((time) => (
                                    <div key={time} className="grid grid-cols-6 border-b border-border last:border-0 min-h-[100px]">
                                        <div className="p-4 border-r border-border text-xs font-medium text-text-muted text-center">
                                            {time}
                                        </div>
                                        {days.map((_, dayIndex) => {
                                            // Find events for this day and time slot
                                            // Check if event start time matches current slot
                                            const event = scheduleEvents.find(
                                                (e) => e.day === dayIndex + 1 && e.startTime.startsWith(time.split(':')[0])
                                            );

                                            return (
                                                <div key={dayIndex} className="p-1 border-r border-border last:border-r-0 relative group">
                                                    {event && (
                                                        <div className={`absolute top-1 left-1 right-1 bottom-1 rounded-[2px] p-3 border ${event.color} shadow-none hover:shadow-none transition-all cursor-pointer z-10 overflow-hidden`}>
                                                            <div className="flex flex-col h-full">
                                                                <div className="font-bold text-sm truncate mb-1">{event.title}</div>
                                                                <div className="text-xs opacity-90 truncate mb-2">{event.type}</div>

                                                                <div className="mt-auto flex flex-col gap-1 text-xs opacity-80">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <Clock className="w-3 h-3 shrink-0" />
                                                                        <span className="truncate">{event.startTime} - {event.endTime}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <MapPin className="w-3 h-3 shrink-0" />
                                                                        <span className="truncate">{event.room}</span>
                                                                    </div>
                                                                    {event.students && (
                                                                        <div className="flex items-center gap-1.5">
                                                                            <Users className="w-3 h-3 shrink-0" />
                                                                            <span className="truncate">{event.students} Students</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
