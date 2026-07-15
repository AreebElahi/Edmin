import { apiClient } from './apiClient';

export interface StudentDirectoryItem {
    studentid: number;
    fullname: string;
    rollnumber: string;
    email: string;
    department: string;
    departmentCode: string;
    semester: string;
    status: string;
    cgpa: number;
    attendanceRate: number;
}

export interface EnrollmentRequestItem {
    enrollmentrequestid: number;
    studentName: string;
    rollnumber: string;
    department: string;
    courseName: string;
    courseCode: string;
    semester: string;
    status: string;
    createdat: string;
}

export interface AcademicProgressItem {
    studentid: number;
    fullname: string;
    rollnumber: string;
    department: string;
    semester: string;
    completedCredits: number;
    cgpa: number;
    semesterGpa: number;
    failedCourses: number;
    remainingCredits: number;
    graduationStatus: string;
    isProbation: boolean;
}

export interface PromotionGraduationItem {
    studentid: number;
    fullname: string;
    rollnumber: string;
    department: string;
    semester: string;
    completedCredits: number;
    cgpa: number;
    failedCount: number;
    status: 'PROMOTION_ELIGIBLE' | 'REPEAT_SEMESTER' | 'PROBATION' | 'GRADUATED' | 'GRADUATION_ELIGIBLE';
}

export interface AttendanceAnalyticsItem {
    studentid: number;
    fullname: string;
    rollnumber: string;
    department: string;
    semester: string;
    totalClasses: number;
    presentClasses: number;
    attendanceRate: number;
    riskStatus: 'GOOD' | 'CRITICAL' | 'WARNING';
}

export interface AtRiskStudentItem {
    studentid: number;
    fullname: string;
    rollnumber: string;
    department: string;
    semester: string;
    cgpa: number;
    attendanceRate: number;
    failedCourses: number;
    riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
    reasons: string[];
}

export interface ScholarshipItem {
    scholarshipid: number;
    discountpercentage: number;
    isactive: boolean;
    studentName: string;
    rollnumber: string;
    department: string;
    email: string;
}

export interface StudentProfileData {
    student: {
        studentid: number;
        fullname: string;
        rollnumber: string;
        email: string;
        department: string;
        departmentCode: string;
        semester: string;
        avatar?: string;
        status: string;
        cgpa: number;
        completedCredits: number;
        attendanceRate: number;
    };
    enrollmentHistory: Array<{
        courseenrollmentid: number;
        courseName: string;
        courseCode: string;
        credits: number;
        semester: string;
        status: string;
        grade: string;
        gradepoints: number | null;
    }>;
    attendanceLogs: Array<{
        attendanceid: number;
        date: string;
        topic: string;
        status: string;
    }>;
    invoices: Array<{
        invoiceid: number;
        totalamount: number;
        amountpaid: number;
        status: string;
        duedate: string;
        payments: Array<{
            paymentid: number;
            amount: number;
            method: string;
            createdat: string;
        }>;
    }>;
    scholarships: Array<{
        scholarshipid: number;
        discountpercentage: number;
        isactive: boolean;
    }>;
    tickets: Array<{
        id: number;
        subject: string;
        status: string;
        priority: string;
        created_at: string;
        assignee: string;
    }>;
    auditLogs: Array<{
        auditlogid: number;
        action: string;
        createdat: string;
        newvalues: any;
        oldvalues: any;
    }>;
    quizAttempts: Array<{
        quizattemptid: number;
        score: number;
        attemptdate: string;
    }>;
}

export const studentOversightApi = {
    getDirectory: async (): Promise<StudentDirectoryItem[]> => {
        const res = await apiClient.get('/admin/student/directory');
        return res.data;
    },
    getEnrollments: async (): Promise<EnrollmentRequestItem[]> => {
        const res = await apiClient.get('/admin/student/enrollments');
        return res.data;
    },
    overrideEnrollment: async (id: number, data: { action: 'APPROVE' | 'REJECT'; comment?: string }): Promise<any> => {
        const res = await apiClient.patch(`/admin/student/enrollments/${id}/override`, data);
        return res.data;
    },
    getProgress: async (): Promise<AcademicProgressItem[]> => {
        const res = await apiClient.get('/admin/student/progress');
        return res.data;
    },
    getPromotion: async (): Promise<PromotionGraduationItem[]> => {
        const res = await apiClient.get('/admin/student/promotion');
        return res.data;
    },
    getAttendanceAnalytics: async (): Promise<AttendanceAnalyticsItem[]> => {
        const res = await apiClient.get('/admin/student/attendance-analytics');
        return res.data;
    },
    getAtRisk: async (): Promise<AtRiskStudentItem[]> => {
        const res = await apiClient.get('/admin/student/at-risk');
        return res.data;
    },
    getScholarships: async (): Promise<ScholarshipItem[]> => {
        const res = await apiClient.get('/admin/student/scholarships');
        return res.data;
    },
    getTimeline: async (studentId: number): Promise<StudentProfileData> => {
        const res = await apiClient.get(`/admin/student/timeline/${studentId}`);
        return res.data;
    }
};
