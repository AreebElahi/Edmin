export enum UserRole {
    STUDENT = 'student',
    FACULTY = 'faculty',
    HR = 'hr',
    ADMIN = 'admin'
}

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    avatar?: string;
    designation?: 'HOD' | 'Supervisor' | 'Teacher';
}

export interface Course {
    id: string;
    slug?: string; // URL-friendly identifier for slug-based routing
    name: string;
    code: string;
    instructor?: string;
    progress?: number;
    semester?: string;
    students?: number;
    attendance?: number;
    color: string; // For gradient background
    description?: string;
    lastAccessed?: Date; // For tracking last access time
}

export interface Notification {
    id: string;
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
    type: 'info' | 'warning' | 'success' | 'error';
}

export interface MenuItem {
    label: string;
    icon: string;
    href: string;
    active?: boolean;
}

// Backend Entity Types from Prisma Schema
export interface BackendCourse {
    courseid: number;
    code: string;
    name: string;
    isactive: boolean;
    createdat: string;
}

export interface BackendAssignment {
    description: any;
    assignmentid: number;
    courseofferingid: number;
    title: string;
    duedate: string;
    maxmarks: number;
    isactive: boolean;
    courseName?: string;
    courseCode?: string;
}

export interface BackendQuiz {
    quizid: number;
    courseofferingid: number;
    title: string;
    duration: number;
    totalmarks: number;
    isactive: boolean;
    createdat: string;
    courseName?: string;
    courseCode?: string;
}

export interface BackendNotification {
    notificationid: number;
    title: string;
    message: string;
    isread: boolean;
    createdat: string;
}
