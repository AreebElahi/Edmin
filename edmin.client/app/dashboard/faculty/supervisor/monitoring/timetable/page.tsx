'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { SupervisorAPI } from '@/utils/api';
import { UserRole } from '@/types/types';
import { CalendarDays, Clock, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SupervisorTimetableMonitoringPage() {
    const [timetable, setTimetable] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTimetable();
    }, []);

    const fetchTimetable = async () => {
        try {
            const data = await SupervisorAPI.getDepartmentTimetable();
            setTimetable(data);
        } catch (error: any) {
            toast.error(error.message || 'Failed to load timetable');
        } finally {
            setLoading(false);
        }
    };

    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return (
        <DashboardLayout userName="Supervisor" userRole={UserRole.FACULTY} notifications={[]} currentPath="/dashboard/faculty/supervisor/monitoring/timetable">
            <div className="p-6 md:p-8 space-y-8 animate-fade-in max-w-7xl mx-auto">
                <header>
                    <h1 className="text-2xl font-bold text-text-primary tracking-tight">Department Timetable</h1>
                    <p className="text-text-secondary mt-1 text-sm md:text-base">
                        Master view of all scheduled classes, rooms, and active sections.
                    </p>
                </header>

                {loading ? (
                    <div className="flex h-32 items-center justify-center">
                        <div className="text-text-muted">Loading master timetable...</div>
                    </div>
                ) : timetable.length === 0 ? (
                    <div className="bg-surface rounded-xl border border-border p-12 text-center">
                        <CalendarDays className="h-12 w-12 text-text-muted mx-auto mb-4" strokeWidth={1} />
                        <h3 className="text-lg font-medium text-text-primary mb-1">No Scheduled Classes</h3>
                        <p className="text-text-secondary text-sm">The department timetable has not been generated yet.</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {daysOfWeek.map(day => {
                            const daySlots = timetable.filter(t => t.day === day).sort((a, b) => a.startTime.localeCompare(b.startTime));
                            if (daySlots.length === 0) return null;

                            return (
                                <section key={day} className="bg-surface rounded-2xl border border-border overflow-hidden shadow-sm">
                                    <div className="bg-background px-6 py-4 border-b border-border">
                                        <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                                            <CalendarDays className="w-5 h-5 text-primary" /> {day}
                                        </h2>
                                    </div>
                                    <div className="p-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                            {daySlots.map((slot, idx) => (
                                                <div key={idx} className="p-4 rounded-xl border border-border bg-background hover:border-primary/30 hover:shadow-sm transition-all group relative overflow-hidden">
                                                    <div className="absolute top-0 left-0 w-1 h-full bg-primary/80"></div>
                                                    <h3 className="font-bold text-text-primary mb-1 pr-4 line-clamp-1">{slot.course}</h3>
                                                    <div className="flex items-center gap-2 text-xs font-semibold text-primary bg-primary/10 w-max px-2 py-0.5 rounded-md mb-3">
                                                        Section {slot.section}
                                                    </div>
                                                    
                                                    <div className="space-y-2 text-sm text-text-secondary">
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="w-4 h-4 text-text-muted" />
                                                            {slot.startTime.substring(0, 5)} - {slot.endTime.substring(0, 5)}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <MapPin className="w-4 h-4 text-text-muted" />
                                                            {slot.room || 'TBD'}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </section>
                            );
                        })}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
