'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { UserRole, Notification } from '@/types/types';
import { Home, Calendar, Users, BarChart } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { DashboardAPI, FacultyAPI } from '@/utils/api';

export default function CourseAttendancePage() {
    const params = useParams();
    const courseId = params.courseId as string;
    const [activeTab, setActiveTab] = useState<'session' | 'student'>('session');

    const [user, setUser] = useState<{ name: string; avatar?: string }>({ name: 'Faculty' });
    const [courseData, setCourseData] = useState<any>({ name: 'Loading...', code: courseId, students: 0, semester: 'Current' });
    const [sessions, setSessions] = useState<any[]>([]);
    const [studentsList, setStudentsList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [dashboardData, coursesData, sessionsData, studentsData] = await Promise.all([
                    DashboardAPI.getFacultyDashboard(),
                    FacultyAPI.getCourses(),
                    FacultyAPI.getAttendanceSessions(),
                    FacultyAPI.getStudents()
                ]);

                if (dashboardData?.user) {
                    setUser({ name: dashboardData.user.name, avatar: dashboardData.user.avatar });
                }

                const matchedCourse = coursesData.find((c: any) => c.id.toString() === courseId);
                if (matchedCourse) {
                    setCourseData(matchedCourse);
                }

                setSessions(sessionsData.filter((s: any) => s.courseCode === (matchedCourse?.code || courseId)));
                
                const enrolledStudents = studentsData.filter((s: any) => s.course === matchedCourse?.name || s.courseCode === matchedCourse?.code);
                setStudentsList(enrolledStudents.map((s: any) => ({
                    id: s.id,
                    name: s.name,
                    rollNo: s.studentId,
                    attendancePercentage: s.attendance || 100,
                    classesAttended: s.classesAttended || 20,
                    totalClasses: s.totalClasses || 20
                })));
            } catch (err) {
                console.error("Failed to load attendance data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [courseId]);

    if (loading) return <div className="p-8 text-center text-text-secondary">Loading attendance...</div>;

    return (
        <DashboardLayout
            userRole={UserRole.FACULTY}
            userName={user.name}
            userAvatar={user.avatar}
            notifications={[]}
            currentPath={`/dashboard/faculty/attendance/${courseId}`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Breadcrumb */}
                <nav className="flex mb-6" aria-label="Breadcrumb">
                    <ol className="flex items-center space-x-2 bg-surface px-3 py-2 rounded-[2px] border border-border ">
                        <li>
                            <Link href="/dashboard/faculty" className="text-text-secondary hover:text-primary transition-colors">
                                <Home className="w-4 h-4" />
                            </Link>
                        </li>
                        <li><span className="text-border-hover">/</span></li>
                        <li>
                            <Link href="/dashboard/faculty/attendance" className="text-sm font-medium text-text-secondary hover:text-primary transition-colors">
                                Attendance
                            </Link>
                        </li>
                        <li><span className="text-border-hover">/</span></li>
                        <li><span className="text-sm font-medium text-text-primary">{courseData.name}</span></li>
                    </ol>
                </nav>

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-3xl font-bold text-text-primary">{courseData.name}</h1>
                            <span className="px-3 py-1 bg-primary-light text-primary text-xs font-bold rounded-[2px] border border-border">
                                {courseData.code}
                            </span>
                        </div>
                        <p className="text-text-secondary">{courseData.semester} • {courseData.students} Students Enrolled</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex p-1 bg-surface rounded-[2px] border border-border w-fit mb-8 ">
                    <button
                        onClick={() => setActiveTab('session')}
                        className={`px-4 py-2 rounded-[2px] text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'session'
                            ? 'bg-primary text-white '
                            : 'text-text-primary hover:bg-background'
                            }`}
                    >
                        <Calendar className="w-4 h-4" />
                        Session Wise
                    </button>
                    <button
                        onClick={() => setActiveTab('student')}
                        className={`px-4 py-2 rounded-[2px] text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'student'
                            ? 'bg-primary text-white '
                            : 'text-text-primary hover:bg-background'
                            }`}
                    >
                        <Users className="w-4 h-4" />
                        Student Wise
                    </button>
                </div>

                {/* Content */}
                {activeTab === 'session' ? (
                    <div className="grid grid-cols-1 gap-4">
                        {sessions.map((session) => (
                            <Link
                                href={`/dashboard/faculty/attendance/mark/${session.id}`}
                                key={session.id}
                                className="block"
                            >
                                <div className="bg-primary hover:bg-primary-hover text-white shadow-none transition-colors border-transparent">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="flex items-start gap-4">
                                            <div className="flex flex-col items-center justify-center w-16 h-16 bg-primary-light rounded-[2px] border border-border text-primary">
                                                <span className="text-xs font-bold uppercase">{new Date(session.sessionDate || session.date).toLocaleString('default', { month: 'short' })}</span>
                                                <span className="text-2xl font-bold">{new Date(session.sessionDate || session.date).getDate()}</span>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="text-lg font-bold text-text-primary group-hover:text-primary transition-colors">
                                                        {session.type || session.topic || 'Regular'} Session
                                                    </h3>
                                                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${session.status === 'Completed' ? 'bg-primary-light text-primary' : 'bg-surface-hover text-text-primary'}`}>
                                                        {session.status}
                                                    </span>
                                                </div>
                                                <div className="text-sm text-text-secondary flex items-center gap-3">
                                                    <span>{new Date(session.sessionDate || session.date).toLocaleDateString()}, {session.startTime || session.time}</span>
                                                    <span>•</span>
                                                    <span>{session.totalStudents || session.total || 0} Students</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-8 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-8 mt-2 md:mt-0">
                                            <div className="text-center">
                                                <p className="text-xs text-text-secondary mb-1">Present</p>
                                                <p className="text-lg font-bold text-primary">{session.attendanceCount || session.present || 0}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-xs text-text-secondary mb-1">Absent</p>
                                                <p className="text-lg font-bold text-error-text">{Math.max(0, (session.totalStudents || session.total || 0) - (session.attendanceCount || session.present || 0))}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-xs text-text-secondary mb-1">Attendance</p>
                                                <p className="text-lg font-bold text-text-primary">
                                                    {(session.totalStudents || session.total || 0) > 0 ? Math.round(((session.attendanceCount || session.present || 0) / (session.totalStudents || session.total || 1)) * 100) : 0}%
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="bg-surface rounded-[2px]  border border-border overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-background border-b border-border">
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Student</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Roll No</th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-text-secondary uppercase tracking-wider">Classes Attended</th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">Attendance %</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#EDEBE9]">
                                    {studentsList.map((student) => (
                                        <tr key={student.id} className="hover:bg-background/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-[2px] bg-background text-text-primary flex items-center justify-center font-bold text-xs">
                                                        {student.name.charAt(0)}
                                                    </div>
                                                    <span className="font-medium text-text-primary">{student.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                                                {student.rollNo}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-text-primary">
                                                {student.classesAttended} / {student.totalClasses}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <div className="w-24 bg-background rounded-[2px] h-2 overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-[2px] ${student.attendancePercentage >= 90 ? 'bg-primary-light0' :
                                                                student.attendancePercentage >= 75 ? 'bg-primary-light0' :
                                                                    'bg-error-bg0'
                                                                }`}
                                                            style={{ width: `${student.attendancePercentage}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-sm font-bold text-text-primary w-12">{student.attendancePercentage}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
