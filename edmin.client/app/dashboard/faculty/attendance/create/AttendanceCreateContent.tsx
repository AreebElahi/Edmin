'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { UserRole } from '@/types/types';
import { BookOpen, MapPin, CheckCircle2, Home, X } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

import { DashboardAPI } from '@/utils/api';
import { apiGet, apiPost } from '@/api/apiContract';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export default function CreateAttendanceContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const preSelectedCourseId = searchParams.get('courseId') || searchParams.get('from');
    const fromCourse = searchParams.get('from');
    const courseNameParam = searchParams.get('courseName');

    const [profile, setProfile] = useState<any>(null);
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Form state
    const [courseId, setCourseId] = useState(preSelectedCourseId || '');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState('09:00');
    const [topic, setTopic] = useState('');

    useEffect(() => {
        DashboardAPI.getFacultyDashboard().then(res => setProfile(res?.profile)).catch(console.error);
        
        apiGet<any[]>('/faculty/courses').then(res => {
            setCourses(res || []);
        }).catch(console.error);
    }, []);

    const handleCreateAndMark = async () => {
        if (!courseId) {
            toast.error('Please select a course.');
            return;
        }
        if (!date) {
            toast.error('Please select a date.');
            return;
        }

        try {
            setLoading(true);
            
            // Construct start time if provided
            let startTime;
            if (time) {
                const [hours, minutes] = time.split(':');
                const dt = new Date(date);
                dt.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
                startTime = dt.toISOString();
            }

            const payload = {
                courseOfferingId: parseInt(courseId, 10),
                sessionDate: new Date(date).toISOString(),
                startTime,
                topic: topic || 'Class Session'
            };

            const response = await apiPost<any>('/faculty/attendance/sessions', payload);
            
            toast.success('Session created successfully!');
            router.push(`/dashboard/faculty/attendance/mark/${response.classsessionid}?from=${courseId}&courseName=${encodeURIComponent(courses.find(c => c.id === courseId)?.name || courseNameParam || '')}`);
        } catch (err: any) {
            toast.error(err.message || 'Failed to create session');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout
            userRole={UserRole.FACULTY}
            userName={profile?.fullname || 'Faculty'}
            userAvatar={profile?.avatar}
            notifications={[]}
            currentPath="/dashboard/faculty/attendance/create"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <nav className="flex mb-6" aria-label="Breadcrumb">
                    <ol className="flex items-center space-x-2 bg-surface px-3 py-2 rounded-[2px] border border-border shadow-none">
                        <li>
                            <Link href="/dashboard/faculty" className="text-text-secondary hover:text-primary transition-colors">
                                <Home className="w-4 h-4" />
                            </Link>
                        </li>
                        <li><span className="text-border-hover">/</span></li>

                        {fromCourse && courseNameParam ? (
                            <>
                                <li>
                                    <Link href="/dashboard/faculty/courses" className="text-sm font-medium text-text-secondary hover:text-primary transition-colors">
                                        My Courses
                                    </Link>
                                </li>
                                <li><span className="text-border-hover">/</span></li>
                                <li>
                                    <Link href={`/dashboard/faculty/courses/${fromCourse}`} className="text-sm font-medium text-text-secondary hover:text-primary transition-colors">
                                        {courseNameParam}
                                    </Link>
                                </li>
                                <li><span className="text-border-hover">/</span></li>
                                <li><span className="text-sm font-medium text-text-primary">New Session</span></li>
                            </>
                        ) : (
                            <>
                                <li>
                                    <Link href="/dashboard/faculty/attendance" className="text-sm font-medium text-text-secondary hover:text-primary transition-colors">
                                        Attendance
                                    </Link>
                                </li>
                                <li><span className="text-border-hover">/</span></li>
                                <li><span className="text-sm font-medium text-text-primary">New Session</span></li>
                            </>
                        )}
                    </ol>
                </nav>

                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-text-primary">New Attendance Session</h1>
                    <Link href="/dashboard/faculty/attendance">
                        <button className="p-2 text-text-muted hover:text-text-primary hover:bg-background rounded-[2px] transition-colors">
                            <X className="h-6 w-6" />
                        </button>
                    </Link>
                </div>

                <div className="bg-surface rounded-[2px] shadow-none border border-border p-6 md:p-8 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-primary">Course</label>
                            <div className="relative">
                                <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
                                <select
                                    value={courseId}
                                    onChange={(e) => setCourseId(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-[2px] border border-border focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all appearance-none bg-surface"
                                >
                                    <option value="" disabled>Select a course</option>
                                    {courses.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.name || c.courseCode} ({c.code || 'Course'})
                                        </option>
                                    ))}
                                    {(!courses.length && fromCourse) && (
                                        <option value={fromCourse}>{courseNameParam || 'Selected Course'}</option>
                                    )}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-text-primary">Date</label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-[2px] border border-border focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-text-primary">Time</label>
                                <input
                                    type="time"
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-[2px] border border-border focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-primary">Topic (Optional)</label>
                            <input
                                type="text"
                                placeholder="e.g. Midterm Review"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-[2px] border border-border focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="pt-6">
                        <button
                            onClick={handleCreateAndMark}
                            disabled={loading}
                            className={`w-full py-3 rounded-[2px] ${loading ? 'bg-gray-400' : 'bg-primary hover:bg-primary-hover'} text-white font-semibold shadow-none transition-all flex items-center justify-center gap-2`}
                        >
                            <CheckCircle2 className="h-5 w-5" />
                            {loading ? 'Creating...' : 'Create & Start Marking'}
                        </button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
