'use client';

import * as Icons from 'lucide-react';
import { Home, BookOpen, Calendar, FileText, Users, Settings, Settings2, Award, BarChart3, ChevronDown, ChevronRight, ClipboardList, Building, CalendarCheck, DollarSign, UserPlus, FileCheck, GraduationCap, CalendarDays, Briefcase, MessageSquare, User, KeyRound, Ticket, ShieldAlert, Activity, Bell, Brain, TrendingUp, Headphones, Eye } from 'lucide-react';
import { UserRole } from '@/types/types';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { apiGet } from '@/api/apiContract';


interface SidebarProps {
    userRole: UserRole;
    roles?: string[];
    userName: string;
    userAvatar?: string;
    currentPath?: string;
    isOpen?: boolean;
    designation?: string;
}

export default function Sidebar({ userRole, roles, userName, userAvatar, currentPath, isOpen = true, designation }: SidebarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const resolvedPath = currentPath || pathname;
    const [isCoursesOpen, setIsCoursesOpen] = useState(false);
    const [isIdentityOpen, setIsIdentityOpen] = useState(resolvedPath?.startsWith('/dashboard/admin/users') || false);
    const [isAcademicsOpen, setIsAcademicsOpen] = useState(
        resolvedPath?.startsWith('/dashboard/admin/academic') || 
        resolvedPath?.startsWith('/dashboard/admin/departments') || 
        resolvedPath?.startsWith('/dashboard/admin/courses') || 
        resolvedPath?.startsWith('/dashboard/admin/timetable') ||
        resolvedPath?.startsWith('/dashboard/admin/reports') || false
    );
    const [isFinanceOpen, setIsFinanceOpen] = useState(resolvedPath?.startsWith('/dashboard/admin/finance') || false);
    const [isSupportOpen, setIsSupportOpen] = useState(
        resolvedPath?.startsWith('/dashboard/shared/messages') || 
        resolvedPath?.startsWith('/dashboard/shared/complaints') || 
        resolvedPath?.startsWith('/dashboard/shared/announcements') ||
        resolvedPath?.startsWith('/dashboard/shared/communications') || false
    );
    const [isSystemOpen, setIsSystemOpen] = useState(
        resolvedPath?.startsWith('/dashboard/admin/settings') || 
        resolvedPath?.startsWith('/dashboard/admin/oversight') || 
        resolvedPath?.startsWith('/dashboard/admin/escalations') || false
    );
    const [isFacultyOpen, setIsFacultyOpen] = useState(
        resolvedPath?.startsWith('/dashboard/admin/faculty') || false
    );
    const [isStudentOpen, setIsStudentOpen] = useState(
        resolvedPath?.startsWith('/dashboard/admin/student') || false
    );
    const [isExaminationOpen, setIsExaminationOpen] = useState(
        resolvedPath?.startsWith('/dashboard/admin/examination') || false
    );

    const [isSupOperationsOpen, setIsSupOperationsOpen] = useState(
        resolvedPath?.includes('/supervisor/teaching-loads') || 
        resolvedPath?.includes('/supervisor/enrollment') || 
        resolvedPath?.includes('/supervisor/notifications') || 
        resolvedPath?.includes('/supervisor/faculty/activity-reports') || false
    );
    const [isSupFacultyOpen, setIsSupFacultyOpen] = useState(
        resolvedPath?.includes('/supervisor/faculty/workloads') || 
        resolvedPath?.includes('/supervisor/leaves') || false
    );
    const [isSupMonitoringOpen, setIsSupMonitoringOpen] = useState(
        resolvedPath?.includes('/supervisor/monitoring') || 
        resolvedPath?.includes('/supervisor/attendance') || false
    );
    const [isSupAnalyticsOpen, setIsSupAnalyticsOpen] = useState(resolvedPath?.includes('/supervisor/analytics') || false);

    const supervisorGroups = [
        {
            label: 'Academic Operations',
            icon: ClipboardList,
            isOpen: isSupOperationsOpen,
            setIsOpen: setIsSupOperationsOpen,
            subItems: [
                { label: 'Teaching Loads', href: '/dashboard/faculty/supervisor/teaching-loads' },
                { label: 'Enrollment Requests', href: '/dashboard/faculty/supervisor/enrollment' },
                { label: 'Activity Reports', href: '/dashboard/faculty/supervisor/faculty/activity-reports' },
                { label: 'Notifications', href: '/dashboard/faculty/supervisor/notifications' }
            ]
        },
        {
            label: 'Faculty Management',
            icon: Users,
            isOpen: isSupFacultyOpen,
            setIsOpen: setIsSupFacultyOpen,
            subItems: [
                { label: 'Workloads', href: '/dashboard/faculty/supervisor/faculty/workloads' },
                { label: 'Leave Remarks', href: '/dashboard/faculty/supervisor/leaves' }
            ]
        },
        {
            label: 'Academic Monitoring',
            icon: Building,
            isOpen: isSupMonitoringOpen,
            setIsOpen: setIsSupMonitoringOpen,
            subItems: [
                { label: 'Courses & Sections', href: '/dashboard/faculty/supervisor/monitoring/courses' },
                { label: 'Timetable', href: '/dashboard/faculty/supervisor/monitoring/timetable' },
                { label: 'Students', href: '/dashboard/faculty/supervisor/monitoring/students' },
                { label: 'Attendance', href: '/dashboard/faculty/supervisor/attendance' }
            ]
        },
        {
            label: 'Analytics',
            icon: TrendingUp,
            isOpen: isSupAnalyticsOpen,
            setIsOpen: setIsSupAnalyticsOpen,
            subItems: [
                { label: 'Department Dashboard', href: '/dashboard/faculty/supervisor/analytics' },
                { label: 'Generate Reports', href: '/dashboard/faculty/supervisor/analytics/reports' }
            ]
        }
    ];

    const [isHodTeachingLoadOpen, setIsHodTeachingLoadOpen] = useState(resolvedPath?.startsWith('/dashboard/faculty/hod/teaching-loads') || false);
    const [isHodFacultyOpen, setIsHodFacultyOpen] = useState(resolvedPath?.startsWith('/dashboard/faculty/hod/faculty') || false);
    const [isHodStudentsOpen, setIsHodStudentsOpen] = useState(resolvedPath?.startsWith('/dashboard/faculty/hod/students') || false);
    const [isHodCoursesOpen, setIsHodCoursesOpen] = useState(resolvedPath?.startsWith('/dashboard/faculty/hod/courses') || false);
    const [isHodLeavesOpen, setIsHodLeavesOpen] = useState(resolvedPath?.startsWith('/dashboard/faculty/hod/leaves') || false);
    const [isHodReportsOpen, setIsHodReportsOpen] = useState(resolvedPath?.startsWith('/dashboard/faculty/hod/reports') || false);

    const hodGroups = [
        {
            label: 'Teaching Load',
            icon: BookOpen,
            isOpen: isHodTeachingLoadOpen,
            setIsOpen: setIsHodTeachingLoadOpen,
            subItems: [
                { label: 'Pending Approval', href: '/dashboard/faculty/hod/teaching-loads?tab=pending' },
                { label: 'Approved Loads', href: '/dashboard/faculty/hod/teaching-loads?tab=approved' }
            ]
        },
        {
            label: 'Faculty',
            icon: Users,
            isOpen: isHodFacultyOpen,
            setIsOpen: setIsHodFacultyOpen,
            subItems: [
                { label: 'Faculty List', href: '/dashboard/faculty/hod/faculty/workloads' },
                { label: 'Activity Reports', href: '/dashboard/faculty/hod/faculty/activity-reports' }
            ]
        },
        {
            label: 'Students',
            icon: GraduationCap,
            isOpen: isHodStudentsOpen,
            setIsOpen: setIsHodStudentsOpen,
            subItems: [
                { label: 'Enrollment Statistics', href: '/dashboard/faculty/hod/students/enrollment' },
                { label: 'Attendance Analytics', href: '/dashboard/faculty/hod/students/attendance' }
            ]
        },
        {
            label: 'Courses',
            icon: BookOpen,
            isOpen: isHodCoursesOpen,
            setIsOpen: setIsHodCoursesOpen,
            subItems: [
                { label: 'Department Courses', href: '/dashboard/faculty/hod/courses/list' },
                { label: 'Semester Offerings', href: '/dashboard/faculty/hod/courses/offerings' }
            ]
        },
        {
            label: 'Leave Requests',
            icon: CalendarCheck,
            isOpen: isHodLeavesOpen,
            setIsOpen: setIsHodLeavesOpen,
            subItems: [
                { label: 'Pending Comments', href: '/dashboard/faculty/hod/leaves' }
            ]
        },
        {
            label: 'Reports',
            icon: FileText,
            isOpen: isHodReportsOpen,
            setIsOpen: setIsHodReportsOpen,
            subItems: [
                { label: 'Department Reports', href: '/dashboard/faculty/hod/reports' }
            ]
        }
    ];

    const financeSubItems = [
        { label: 'Overview', href: '/dashboard/admin/finance' },
        { label: 'Tuition & Fees', href: '/dashboard/admin/finance/fees' },
        { label: 'Student Invoices', href: '/dashboard/admin/finance/invoices' },
        { label: 'Payments', href: '/dashboard/admin/finance/payments' },
        { label: 'Faculty Payroll', href: '/dashboard/admin/finance/payroll' },
        { label: 'Financial Reports', href: '/dashboard/admin/finance/reports' },
    ];

    const adminGroups = [
        {
            label: 'Identity & Access',
            icon: Users,
            isOpen: isIdentityOpen,
            setIsOpen: setIsIdentityOpen,
            subItems: [
                { label: 'Users & Roles', href: '/dashboard/admin/users' },
            ]
        },
        {
            label: 'Academics',
            icon: Building,
            isOpen: isAcademicsOpen,
            setIsOpen: setIsAcademicsOpen,
            subItems: [
                { label: 'Academic Core', href: '/dashboard/admin/academic' },
                { label: 'Departments', href: '/dashboard/admin/departments' },
                { label: 'Courses', href: '/dashboard/admin/courses' },
                { label: 'Timetable', href: '/dashboard/admin/timetable' },
                { label: 'Academic Reports', href: '/dashboard/admin/reports' },
            ]
        },
        {
            label: 'Finance',
            icon: DollarSign,
            isOpen: isFinanceOpen,
            setIsOpen: setIsFinanceOpen,
            subItems: financeSubItems
        },
        {
            label: 'Support & Comms',
            icon: Headphones,
            isOpen: isSupportOpen,
            setIsOpen: setIsSupportOpen,
            subItems: [
                { label: 'Messages', href: '/dashboard/shared/messages' },
                { label: 'Complaints', href: '/dashboard/shared/complaints' },
                { label: 'Broadcasts (Manage)', href: '/dashboard/shared/communications' },
            ]
        },
        {
            label: 'Faculty Management',
            icon: Briefcase,
            isOpen: isFacultyOpen,
            setIsOpen: setIsFacultyOpen,
            subItems: [
                { label: 'Faculty Directory', href: '/dashboard/admin/faculty/directory' },
                { label: 'Teaching Loads', href: '/dashboard/admin/faculty/teaching-loads' },
                { label: 'Leave Oversight', href: '/dashboard/admin/faculty/leaves' },
                { label: 'Activity Reports', href: '/dashboard/admin/faculty/activity-reports' },
                { label: 'Attendance Audit', href: '/dashboard/admin/faculty/attendance' },
                { label: 'Workload Analytics', href: '/dashboard/admin/faculty/workload' },
                { label: 'Faculty History', href: '/dashboard/admin/faculty/history' },
            ]
        },
        {
            label: 'Student Management',
            icon: GraduationCap,
            isOpen: isStudentOpen,
            setIsOpen: setIsStudentOpen,
            subItems: [
                { label: 'Student Directory', href: '/dashboard/admin/student/directory' },
                { label: 'Enrollment Oversight', href: '/dashboard/admin/student/enrollment' },
                { label: 'Academic Progress', href: '/dashboard/admin/student/progress' },
                { label: 'Promotion & Graduation', href: '/dashboard/admin/student/promotion' },
                { label: 'Attendance Analytics', href: '/dashboard/admin/student/attendance' },
                { label: 'At-Risk Students', href: '/dashboard/admin/student/at-risk' },
                { label: 'Scholarships', href: '/dashboard/admin/student/scholarships' },
            ]
        },
        {
            label: 'Examination Department',
            icon: Award,
            isOpen: isExaminationOpen,
            setIsOpen: setIsExaminationOpen,
            subItems: [
                { label: 'Dashboard', href: '/dashboard/admin/examination?tab=dashboard' },
                { label: 'Schedule', href: '/dashboard/admin/examination?tab=schedule' },
                { label: 'Verification', href: '/dashboard/admin/examination?tab=verification' },
                { label: 'Publishing', href: '/dashboard/admin/examination?tab=publishing' },
                { label: 'Transcripts', href: '/dashboard/admin/examination?tab=transcripts' },
                { label: 'Promotion & Graduation', href: '/dashboard/admin/examination?tab=promotion' },
                { label: 'Degree Audit', href: '/dashboard/admin/examination?tab=degree-audit' },
                { label: 'Statistics', href: '/dashboard/admin/examination?tab=statistics' },
            ]
        },
        {
            label: 'System & Tools',
            icon: Settings2,
            isOpen: isSystemOpen,
            setIsOpen: setIsSystemOpen,
            subItems: [
                { label: 'System Settings', href: '/dashboard/admin/settings' },
                { label: 'Content Oversight', href: '/dashboard/admin/oversight' },
                { label: 'Escalation Queue', href: '/dashboard/admin/escalations' },
            ]
        }
    ];

    const coursesPath = userRole === UserRole.STUDENT ? '/dashboard/student/courses' : '/dashboard/faculty/courses';
    const isCoursesPageActive = resolvedPath === coursesPath;
    const isCoursesSectionActive = resolvedPath?.startsWith(coursesPath || '');
    const shouldHighlightCourses = isCoursesPageActive || (!isOpen && isCoursesSectionActive);

    const [courses, setCourses] = useState<{name: string, id: string, code: string}[]>([]);

    useEffect(() => {
        const fetchCourses = async () => {
            if (typeof window !== 'undefined' && !localStorage.getItem('token')) {
                return;
            }
            try {
                if (userRole === UserRole.FACULTY) {
                    const data = await apiGet<any[]>('/faculty/courses');
                    setCourses(data.map((c, idx) => ({
                        name: c.name || c.course?.name || 'Unknown Course',
                        id: c.id?.toString() || c.courseOfferingId?.toString() || c.courseofferingid?.toString() || c.courseid?.toString() || idx.toString(),
                        code: c.code || c.course?.code || ''
                    })));
                } else if (userRole === UserRole.STUDENT) {
                    const data = await apiGet<any[]>('/student/courses');
                    setCourses(data.map((c, idx) => ({
                        name: c.name || c.course?.name || 'Unknown Course',
                        id: c.id?.toString() || c.courseOfferingId?.toString() || c.courseofferingid?.toString() || c.courseid?.toString() || idx.toString(),
                        code: c.code || c.course?.code || ''
                    })));
                }
            } catch (err: any) {
                const msg = err?.message || err?.toString() || '';
                if (err?.status !== 401 && err?.status !== 403 && err?.code !== 'UNAUTHORIZED' && err?.code !== 'PASSWORD_CHANGE_REQUIRED' && !msg.includes('Faculty profile not found')) {
                    console.error('Failed to load courses for sidebar', err?.message || err);
                }
            }
        };
        fetchCourses();
    }, [userRole]);

    const studentMenuItems = [
        { label: 'Dashboard', icon: Home, href: '/dashboard/student', active: true },
        { label: 'Enrollment', icon: BookOpen, href: '/dashboard/student/enrollment' },
        { label: 'Schedule', icon: Calendar, href: '/dashboard/student/schedule' },
        { label: 'Assignments', icon: FileText, href: '/dashboard/student/assignments' },
        { label: 'Quizzes', icon: Award, href: '/dashboard/student/quizzes' },
        { label: 'Grades', icon: TrendingUp, href: '/dashboard/student/grades' },
        { label: 'Attendance', icon: Users, href: '/dashboard/student/attendance' },
        {
            label: 'Support & Comms',
            icon: Headphones,
            isOpen: isSupportOpen,
            setIsOpen: setIsSupportOpen,
            subItems: [
                { label: 'Messages', href: '/dashboard/shared/messages' },
                { label: 'Complaints', href: '/dashboard/shared/complaints' },
                { label: 'Announcements', href: '/dashboard/shared/announcements' },
            ]
        },
    ];

    let facultyMenuItems = [
        { label: 'Dashboard', icon: Home, href: '/dashboard/faculty', active: true },
        { label: 'Teaching Load', icon: BookOpen, href: '/dashboard/faculty/teaching-load' },
        { label: 'Courses', icon: BookOpen, href: '/dashboard/faculty/courses' },
        { label: 'Schedule', icon: Calendar, href: '/dashboard/faculty/schedule' },
        { label: 'Assignments', icon: FileText, href: '/dashboard/faculty/assignments' },
        { label: 'Quizzes', icon: Award, href: '/dashboard/faculty/quizzes' },
        { label: 'Grades', icon: TrendingUp, href: '/dashboard/faculty/grades' },
        { label: 'Attendance', icon: Users, href: '/dashboard/faculty/attendance' },
        { label: 'Activity & Leaves', icon: ClipboardList, href: '/dashboard/faculty/leave' },
        { label: 'Approvals', icon: FileCheck, href: '/dashboard/faculty/approvals' },
        {
            label: 'Support & Comms',
            icon: Headphones,
            isOpen: isSupportOpen,
            setIsOpen: setIsSupportOpen,
            subItems: [
                { label: 'Messages', href: '/dashboard/shared/messages' },
                { label: 'Complaints', href: '/dashboard/shared/complaints' },
                { label: 'Announcements', href: '/dashboard/shared/announcements' },
            ]
        },
    ];

    const designationUpper = designation?.toUpperCase();

    const hrMenuItems = [
        { label: 'Dashboard', icon: Home, href: '/dashboard/hr', active: true },
        { label: 'Employees', icon: Users, href: '/dashboard/hr/employees' },
        { label: 'Departments', icon: Building, href: '/dashboard/hr/departments' },
        { label: 'Leaves', icon: FileCheck, href: '/dashboard/hr/leaves' },
        { label: 'Attendance', icon: CalendarCheck, href: '/dashboard/hr/attendance' },
        { label: 'Payroll', icon: DollarSign, href: '/dashboard/hr/payroll' },
        { label: 'Reports', icon: FileText, href: '/dashboard/hr/reports' },
        {
            label: 'Support & Comms',
            icon: Headphones,
            isOpen: isSupportOpen,
            setIsOpen: setIsSupportOpen,
            subItems: [
                { label: 'Messages', href: '/dashboard/shared/messages' },
                { label: 'Complaints', href: '/dashboard/shared/complaints' },
                { label: 'Announcements', href: '/dashboard/shared/announcements' },
            ]
        },
    ];

    const roleLower = String(userRole).toLowerCase();
    const effectiveRoles = roles && roles.length > 0 ? roles.map(r => r.toLowerCase()) : [roleLower];
    
    // Ensure the primary user role is always included in effective roles
    // so that we don't lose the base menu items if the API returns a different role array (e.g., ['Teacher', 'HOD'])
    if (!effectiveRoles.includes(roleLower)) {
        effectiveRoles.push(roleLower);
    }

    let mergedItems: any[] = [];
    if (roleLower === UserRole.STUDENT.toLowerCase()) {
        mergedItems = [...studentMenuItems];
    } else if (roleLower === UserRole.FACULTY.toLowerCase()) {
        mergedItems = [...facultyMenuItems];
    } else if (roleLower === UserRole.HR.toLowerCase()) {
        mergedItems = [...hrMenuItems];
    }

    // Deduplicate by label & href to avoid duplicate generic items (like Dashboard, Tasks, History, Notifications)
    // We prefer the first one found so that standard links like "Dashboard" link to the primary role's dashboard.
    const menuItems = mergedItems.filter((item, index, self) =>
      index === self.findIndex((t) => (
        t.label === item.label && t.href === item.href
      ))
    );

    const dashboardLink = roleLower === UserRole.STUDENT ? '/dashboard/student' :
        roleLower === UserRole.FACULTY ? '/dashboard/faculty' :
            roleLower === UserRole.HR ? '/dashboard/hr' : '/dashboard/admin';

    return (
        <aside className="h-screen bg-surface border-r border-border flex flex-col transition-all duration-200 pt-12 app-sidebar overflow-hidden">

            {/* Navigation Menu */}
            <nav className="flex-1 overflow-y-auto py-1 sidebar-nav scrollbar-hide">
                <ul className="space-y-0">
                    {/* Dashboard Link */}
                    <li className="relative" style={{ zIndex: 50 }}>
                        <a
                            href={dashboardLink}
                            onClick={(e) => {
                                e.preventDefault();
                                // Close sidebar on mobile
                                if (window.innerWidth < 1024) {
                                    const cb = document.getElementById('dashboard-drawer') as HTMLInputElement;
                                    if (cb) cb.checked = false;
                                }
                                router.push(dashboardLink);
                            }}
                            className={`flex items-center px-2 py-2 transition-colors duration-100 sidebar-link ${isOpen ? 'justify-start gap-2.5' : 'justify-center gap-0'} ${resolvedPath === dashboardLink
                                ? 'bg-primary-light text-primary border-l-2 border-primary font-semibold'
                                : 'text-text-primary hover:bg-surface-hover hover:text-text-primary border-l-2 border-transparent'
                                }`}
                            style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                        >
                            <Home className={`h-4 w-4 flex-shrink-0 ${resolvedPath === dashboardLink ? 'text-primary' : 'text-text-secondary'}`} strokeWidth={1.5} />
                            {isOpen && <span className="text-sm sidebar-text">{roleLower === UserRole.FACULTY ? 'Faculty Dashboard view' : 'Dashboard'}</span>}
                        </a>
                    </li>

                    {/* My Courses Dropdown (Student & Faculty) */}
                    {(roleLower === UserRole.STUDENT || roleLower === UserRole.FACULTY) && (
                        <li className="relative">
                            <button
                                onClick={() => {
                                    if ((typeof window !== 'undefined' && window.innerWidth < 1024) || !isOpen) {
                                        router.push(roleLower === UserRole.STUDENT
                                            ? '/dashboard/student/courses'
                                            : '/dashboard/faculty/courses'
                                        );
                                    } else {
                                        setIsCoursesOpen(!isCoursesOpen);
                                    }
                                }}
                                className={`w-full flex items-center px-2 py-2 transition-colors duration-100 sidebar-link ${isOpen ? 'justify-between gap-2.5' : 'justify-center gap-0'} ${shouldHighlightCourses
                                    ? 'bg-primary-light text-primary border-l-2 border-primary font-semibold'
                                    : 'text-text-primary hover:bg-surface-hover hover:text-text-primary border-l-2 border-transparent'
                                    }`}
                            >
                                <div className={`flex items-center ${isOpen ? 'gap-2.5' : 'gap-0 justify-center'}`}>
                                    <BookOpen className={`h-4 w-4 flex-shrink-0 ${shouldHighlightCourses ? 'text-primary' : 'text-text-secondary'}`} strokeWidth={1.5} />
                                    {isOpen && <span className="text-sm sidebar-text font-medium">My Courses</span>}
                                </div>
                                {isOpen && <ChevronDown className={`h-3 w-3 transition-transform duration-200 sidebar-text text-text-muted ${isCoursesOpen ? 'rotate-180' : ''}`} strokeWidth={1.5} />}
                            </button>

                            {/* Dropdown Content */}
                            <div className={`overflow-hidden transition-all duration-200 ${isCoursesOpen && isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'} ${!isOpen ? 'hidden' : ''}`}>
                                <ul className={`space-y-0 ${isOpen ? 'pl-4 border-l border-border ml-4' : ''}`}>
                                    {courses.map((course, index) => (
                                        <li key={`course-${course.id}-${index}`}>
                                            <Link
                                                href={roleLower === UserRole.STUDENT
                                                    ? `/dashboard/student/courses/${course.id}`
                                                    : `/dashboard/faculty/courses/${course.id}`
                                                }
                                                className={`flex items-center py-1.5 text-xs text-text-primary hover:text-text-primary hover:bg-surface-hover transition-colors sidebar-text font-medium ${isOpen ? 'justify-start gap-2 px-3' : 'justify-center gap-0 px-1'}`}
                                            >
                                                {isOpen && <span className="w-1 h-1 bg-[#C8C6C4]"></span>}
                                                {isOpen ? (
                                                    <span className="truncate">{course.name}</span>
                                                ) : (
                                                    <span className="text-[9px] font-bold text-text-muted">{course.code.split('-')[1]}</span>
                                                )}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </li>
                    )}

                    {/* Admin Collapsible Groups vs Normal Menu Items */}
                    {roleLower === UserRole.ADMIN ? (
                        adminGroups.map((group) => {
                            const Icon = group.icon;
                            const isGroupActive = group.subItems.some(sub => resolvedPath === sub.href || (sub.href && resolvedPath.startsWith(sub.href + '/')));
                            return (
                                <li key={group.label} className="relative">
                                    <button
                                        onClick={() => {
                                            if (!isOpen) {
                                                router.push(group.subItems[0].href);
                                            } else {
                                                group.setIsOpen(!group.isOpen);
                                            }
                                        }}
                                        className={`w-full flex items-center px-2 py-2 transition-colors duration-100 sidebar-link ${isOpen ? 'justify-between gap-2.5' : 'justify-center gap-0'} ${isGroupActive && !group.isOpen
                                            ? 'bg-primary-light text-primary border-l-2 border-primary font-semibold'
                                            : 'text-text-primary hover:bg-surface-hover border-l-2 border-transparent'
                                            }`}
                                    >
                                        <div className={`flex items-center ${isOpen ? 'gap-2.5' : 'gap-0 justify-center'}`}>
                                            <Icon className={`h-4 w-4 flex-shrink-0 ${isGroupActive && !group.isOpen ? 'text-primary' : 'text-text-secondary'}`} strokeWidth={1.5} />
                                            {isOpen && <span className="text-sm sidebar-text font-medium">{group.label}</span>}
                                        </div>
                                        {isOpen && <ChevronDown className={`h-3 w-3 transition-transform duration-200 sidebar-text text-text-muted ${group.isOpen ? 'rotate-180' : ''}`} strokeWidth={1.5} />}
                                    </button>

                                    {/* Dropdown Content */}
                                    <div className={`overflow-hidden transition-all duration-200 ${group.isOpen && isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'} ${!isOpen ? 'hidden' : ''}`}>
                                        <ul className="border-l border-border ml-4 pl-0">
                                            {group.subItems.map((sub) => {
                                                const isSubActive = resolvedPath === sub.href || (sub.href && resolvedPath.startsWith(sub.href + '/'));
                                                return (
                                                    <li key={sub.href} style={{ zIndex: 50 }}>
                                                        <a
                                                            href={sub.href}
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                if (window.innerWidth < 1024) {
                                                                    const cb = document.getElementById('dashboard-drawer') as HTMLInputElement;
                                                                    if (cb) cb.checked = false;
                                                                }
                                                                router.push(sub.href);
                                                            }}
                                                            className={`flex items-center py-1.5 px-3 text-xs transition-colors ${isSubActive ? 'text-primary bg-primary-light font-semibold' : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'}`}
                                                            style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                                                        >
                                                            <span className="truncate">{sub.label}</span>
                                                        </a>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                </li>
                            );
                        })
                    ) : (
                        <>
                            {menuItems.filter(item => item.label !== 'Dashboard').map((item) => {
                                if (item.label === '_DIVIDER_') {
                                    return isOpen ? (
                                        <li key="divider-system" className="pt-3 pb-1 px-3">
                                            <p className="text-[9px] font-semibold uppercase tracking-widest text-text-muted">System</p>
                                        </li>
                                    ) : (
                                        <li key="divider-system" className="py-1.5">
                                            <div className="mx-2 h-px bg-border" />
                                        </li>
                                    );
                                }

                                const Icon = item.icon;

                                if (item.subItems) {
                                    const isGroupActive = item.subItems.some((sub: any) => resolvedPath === sub.href || (sub.href && resolvedPath.startsWith(sub.href + '/')));
                                    return (
                                        <li key={item.label} className="relative">
                                            <button
                                                onClick={() => {
                                                    if (!isOpen) {
                                                        router.push(item.subItems[0].href);
                                                    } else {
                                                        item.setIsOpen(!item.isOpen);
                                                    }
                                                }}
                                                className={`w-full flex items-center px-2 py-2 transition-colors duration-100 sidebar-link ${isOpen ? 'justify-between gap-2.5' : 'justify-center gap-0'} ${isGroupActive && !item.isOpen
                                                    ? 'bg-primary-light text-primary border-l-2 border-primary font-semibold'
                                                    : 'text-text-primary hover:bg-surface-hover border-l-2 border-transparent'
                                                    }`}
                                            >
                                                <div className={`flex items-center ${isOpen ? 'gap-2.5' : 'gap-0 justify-center'}`}>
                                                    <Icon className={`h-4 w-4 flex-shrink-0 ${isGroupActive && !item.isOpen ? 'text-primary' : 'text-text-secondary'}`} strokeWidth={1.5} />
                                                    {isOpen && <span className="text-sm sidebar-text font-medium">{item.label}</span>}
                                                </div>
                                                {isOpen && <ChevronDown className={`h-3 w-3 transition-transform duration-200 sidebar-text text-text-muted ${item.isOpen ? 'rotate-180' : ''}`} strokeWidth={1.5} />}
                                            </button>

                                            {/* Dropdown Content */}
                                            <div className={`overflow-hidden transition-all duration-200 ${item.isOpen && isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'} ${!isOpen ? 'hidden' : ''}`}>
                                                <ul className="border-l border-border ml-4 pl-0">
                                                    {item.subItems.map((sub: any) => {
                                                        const isSubActive = resolvedPath === sub.href || (sub.href && resolvedPath.startsWith(sub.href + '/'));
                                                        return (
                                                            <li key={sub.href} style={{ zIndex: 50 }}>
                                                                <a
                                                                    href={sub.href}
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        if (window.innerWidth < 1024) {
                                                                            const cb = document.getElementById('dashboard-drawer') as HTMLInputElement;
                                                                            if (cb) cb.checked = false;
                                                                        }
                                                                        router.push(sub.href);
                                                                    }}
                                                                    className={`flex items-center py-1.5 px-3 text-xs transition-colors ${isSubActive ? 'text-primary bg-primary-light font-semibold' : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'}`}
                                                                    style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                                                                >
                                                                    <span className="truncate">{sub.label}</span>
                                                                </a>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            </div>
                                        </li>
                                    );
                                }

                                const isActive = resolvedPath === item.href || (item.href && resolvedPath.startsWith(item.href + '/'));

                                return (
                                    <li key={item.href} className="relative" style={{ zIndex: 50 }}>
                                        <a
                                            href={item.href}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                // Close sidebar on mobile
                                                if (window.innerWidth < 1024) {
                                                    const cb = document.getElementById('dashboard-drawer') as HTMLInputElement;
                                                    if (cb) cb.checked = false;
                                                }
                                                router.push(item.href);
                                            }}
                                            className={`flex items-center px-2 py-2 transition-colors duration-100 sidebar-link ${isOpen ? 'justify-start gap-2.5' : 'justify-center gap-0'} ${isActive
                                                ? 'bg-primary-light text-primary border-l-2 border-primary font-semibold'
                                                : 'text-text-primary hover:bg-surface-hover border-l-2 border-transparent'
                                                }`}
                                            title={item.label}
                                            style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                                        >
                                            <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-primary' : 'text-text-secondary'}`} strokeWidth={1.5} />
                                            {isOpen && <span className="text-sm sidebar-text">{item.label}</span>}
                                        </a>
                                    </li>
                                );
                            })}
                            
                            {/* Inject HOD Groups right after the faculty menu items if designation is HOD */}
                            {(designationUpper === 'HOD' || effectiveRoles.includes('hod')) && roleLower === 'faculty' && (
                                <>
                                    {isOpen ? (
                                        <li key="divider-hod" className="pt-3 pb-1 px-3">
                                            <p className="text-[9px] font-semibold uppercase tracking-widest text-text-muted">HOD Administration</p>
                                        </li>
                                    ) : (
                                        <li key="divider-hod" className="py-1.5">
                                            <div className="mx-2 h-px bg-border" />
                                        </li>
                                    )}
                                    <li key="/dashboard/faculty/hod" className="relative" style={{ zIndex: 50 }}>
                                        <a
                                            href="/dashboard/faculty/hod"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                if (window.innerWidth < 1024) {
                                                    const cb = document.getElementById('dashboard-drawer') as HTMLInputElement;
                                                    if (cb) cb.checked = false;
                                                }
                                                router.push('/dashboard/faculty/hod');
                                            }}
                                            className={`flex items-center px-2 py-2 transition-colors duration-100 sidebar-link ${isOpen ? 'justify-start gap-2.5' : 'justify-center gap-0'} ${resolvedPath === '/dashboard/faculty/hod'
                                                ? 'bg-primary-light text-primary border-l-2 border-primary font-semibold'
                                                : 'text-text-primary hover:bg-surface-hover border-l-2 border-transparent'
                                                }`}
                                            title="HOD Dashboard view"
                                            style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                                        >
                                            <Building className={`h-4 w-4 flex-shrink-0 ${resolvedPath === '/dashboard/faculty/hod' ? 'text-primary' : 'text-text-secondary'}`} strokeWidth={1.5} />
                                            {isOpen && <span className="text-sm sidebar-text">HOD Dashboard view</span>}
                                        </a>
                                    </li>
                                    {hodGroups.map((group) => {
                                        const Icon = group.icon;
                                        const isGroupActive = group.subItems.some(sub => resolvedPath === sub.href || (sub.href && resolvedPath.startsWith(sub.href.split('?')[0])));
                                        return (
                                            <li key={group.label} className="relative">
                                                <button
                                                    onClick={() => {
                                                        if (!isOpen) {
                                                            router.push(group.subItems[0].href);
                                                        } else {
                                                            group.setIsOpen(!group.isOpen);
                                                        }
                                                    }}
                                                    className={`w-full flex items-center px-2 py-2 transition-colors duration-100 sidebar-link ${isOpen ? 'justify-between gap-2.5' : 'justify-center gap-0'} ${isGroupActive && !group.isOpen
                                                        ? 'bg-primary-light text-primary border-l-2 border-primary font-semibold'
                                                        : 'text-text-primary hover:bg-surface-hover border-l-2 border-transparent'
                                                        }`}
                                                >
                                                    <div className={`flex items-center ${isOpen ? 'gap-2.5' : 'gap-0 justify-center'}`}>
                                                        <Icon className={`h-4 w-4 flex-shrink-0 ${isGroupActive && !group.isOpen ? 'text-primary' : 'text-text-secondary'}`} strokeWidth={1.5} />
                                                        {isOpen && <span className="text-sm sidebar-text font-medium">{group.label}</span>}
                                                    </div>
                                                    {isOpen && <ChevronDown className={`h-3 w-3 transition-transform duration-200 sidebar-text text-text-muted ${group.isOpen ? 'rotate-180' : ''}`} strokeWidth={1.5} />}
                                                </button>

                                                <div className={`overflow-hidden transition-all duration-200 ${group.isOpen && isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'} ${!isOpen ? 'hidden' : ''}`}>
                                                    <ul className="border-l border-border ml-4 pl-0">
                                                        {group.subItems.map((sub) => {
                                                            const isSubActive = resolvedPath === sub.href || (sub.href && resolvedPath.startsWith(sub.href.split('?')[0]));
                                                            return (
                                                                <li key={sub.label} style={{ zIndex: 50 }}>
                                                                    <a
                                                                        href={sub.href}
                                                                        onClick={(e) => {
                                                                            e.preventDefault();
                                                                            if (window.innerWidth < 1024) {
                                                                                const cb = document.getElementById('dashboard-drawer') as HTMLInputElement;
                                                                                if (cb) cb.checked = false;
                                                                            }
                                                                            router.push(sub.href);
                                                                        }}
                                                                        className={`flex items-center py-1.5 px-3 text-xs transition-colors ${isSubActive ? 'text-primary bg-primary-light font-semibold' : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'}`}
                                                                        style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                                                                    >
                                                                        <span className="truncate">{sub.label}</span>
                                                                    </a>
                                                                </li>
                                                            );
                                                        })}
                                                    </ul>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </>
                            )}

                            {(designationUpper === 'SUPERVISOR' || effectiveRoles.includes('supervisor')) && designationUpper !== 'HOD' && !effectiveRoles.includes('hod') && roleLower === 'faculty' && (
                                <>
                                    {isOpen ? (
                                        <li key="divider-sup" className="pt-3 pb-1 px-3">
                                            <p className="text-[9px] font-semibold uppercase tracking-widest text-text-muted">Supervisor Administration</p>
                                        </li>
                                    ) : (
                                        <li key="divider-sup" className="py-1.5">
                                            <div className="mx-2 h-px bg-border" />
                                        </li>
                                    )}
                                    <li key="/dashboard/faculty/supervisor" className="relative" style={{ zIndex: 50 }}>
                                        <a
                                            href="/dashboard/faculty/supervisor"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                if (window.innerWidth < 1024) {
                                                    const cb = document.getElementById('dashboard-drawer') as HTMLInputElement;
                                                    if (cb) cb.checked = false;
                                                }
                                                router.push('/dashboard/faculty/supervisor');
                                            }}
                                            className={`flex items-center px-2 py-2 transition-colors duration-100 sidebar-link ${isOpen ? 'justify-start gap-2.5' : 'justify-center gap-0'} ${resolvedPath === '/dashboard/faculty/supervisor'
                                                ? 'bg-primary-light text-primary border-l-2 border-primary font-semibold'
                                                : 'text-text-primary hover:bg-surface-hover border-l-2 border-transparent'
                                                }`}
                                            title="Supervisor Portal"
                                            style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                                        >
                                            <Building className={`h-4 w-4 flex-shrink-0 ${resolvedPath === '/dashboard/faculty/supervisor' ? 'text-primary' : 'text-text-secondary'}`} strokeWidth={1.5} />
                                            {isOpen && <span className="text-sm sidebar-text">Supervisor Portal</span>}
                                        </a>
                                    </li>
                                    {supervisorGroups.map((group) => {
                                        const Icon = group.icon;
                                        const isGroupActive = group.subItems.some(sub => resolvedPath === sub.href || (sub.href && resolvedPath.startsWith(sub.href.split('?')[0])));
                                        return (
                                            <li key={group.label} className="relative">
                                                <button
                                                    onClick={() => {
                                                        if (!isOpen) {
                                                            router.push(group.subItems[0].href);
                                                        } else {
                                                            group.setIsOpen(!group.isOpen);
                                                        }
                                                    }}
                                                    className={`w-full flex items-center px-2 py-2 transition-colors duration-100 sidebar-link ${isOpen ? 'justify-between gap-2.5' : 'justify-center gap-0'} ${isGroupActive && !group.isOpen
                                                        ? 'bg-primary-light text-primary border-l-2 border-primary font-semibold'
                                                        : 'text-text-primary hover:bg-surface-hover border-l-2 border-transparent'
                                                        }`}
                                                >
                                                    <div className={`flex items-center ${isOpen ? 'gap-2.5' : 'gap-0 justify-center'}`}>
                                                        <Icon className={`h-4 w-4 flex-shrink-0 ${isGroupActive && !group.isOpen ? 'text-primary' : 'text-text-secondary'}`} strokeWidth={1.5} />
                                                        {isOpen && <span className="text-sm sidebar-text font-medium">{group.label}</span>}
                                                    </div>
                                                    {isOpen && <ChevronDown className={`h-3 w-3 transition-transform duration-200 sidebar-text text-text-muted ${group.isOpen ? 'rotate-180' : ''}`} strokeWidth={1.5} />}
                                                </button>

                                                <div className={`overflow-hidden transition-all duration-200 ${group.isOpen && isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'} ${!isOpen ? 'hidden' : ''}`}>
                                                    <ul className="border-l border-border ml-4 pl-0">
                                                        {group.subItems.map((sub) => {
                                                            const isSubActive = resolvedPath === sub.href || (sub.href && resolvedPath.startsWith(sub.href.split('?')[0]));
                                                            return (
                                                                <li key={sub.label} style={{ zIndex: 50 }}>
                                                                    <a
                                                                        href={sub.href}
                                                                        onClick={(e) => {
                                                                            e.preventDefault();
                                                                            if (window.innerWidth < 1024) {
                                                                                const cb = document.getElementById('dashboard-drawer') as HTMLInputElement;
                                                                                if (cb) cb.checked = false;
                                                                            }
                                                                            router.push(sub.href);
                                                                        }}
                                                                        className={`flex items-center py-1.5 px-3 text-xs transition-colors ${isSubActive ? 'text-primary bg-primary-light font-semibold' : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'}`}
                                                                        style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                                                                    >
                                                                        <span className="truncate">{sub.label}</span>
                                                                    </a>
                                                                </li>
                                                            );
                                                        })}
                                                    </ul>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </>
                            )}
                        </>
                    )}
                </ul>
            </nav>

            {/* Footer Section */}
            <div className="border-t border-border px-3 py-2">
                <div className="text-center hidden lg:block">
                    <p className="text-[10px] text-text-muted">
                        © 2026 Edmin
                    </p>
                </div>
                <div className="lg:hidden flex justify-center">
                    <div className="w-6 h-0.5 bg-border"></div>
                </div>
            </div>
        </aside>
    );
}
