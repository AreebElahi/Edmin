import { apiGet } from '@/api/apiContract';

export interface AttendanceReportItem {
    unit: string;
    totalStudents: number;
    avgAttendance: string;
    defaulters: string;
}

export interface EnrollmentReportItem {
    code: string;
    name: string;
    dept: string;
    enrolled: number;
    capacity: number;
}

export interface LeaveReportSummary {
    summary: {
        pending: number;
        approved: number;
        rejected: number;
    };
    list: Array<{
        applicant: string;
        department: string;
        type: string;
        days: number;
        status: string;
    }>;
}

export interface GradeDistributionItem {
    course: string;
    grades: {
        A: number;
        B: number;
        C: number;
        D: number;
        F: number;
    };
}

export const reportsApi = {
    getAttendanceReport: (): Promise<AttendanceReportItem[]> =>
        apiGet<AttendanceReportItem[]>('/admin/reports/attendance'),

    getEnrollmentReport: (): Promise<EnrollmentReportItem[]> =>
        apiGet<EnrollmentReportItem[]>('/admin/reports/enrollment'),

    getLeaveReportSummary: (): Promise<LeaveReportSummary> =>
        apiGet<LeaveReportSummary>('/admin/reports/leaves'),

    getGradeDistributionReport: (): Promise<GradeDistributionItem[]> =>
        apiGet<GradeDistributionItem[]>('/admin/reports/grades'),

    exportReportsUrl: (format: 'CSV' | 'PDF'): string => {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
        let token = '';
        if (typeof window !== 'undefined') {
            token = localStorage.getItem('token') || '';
        }
        return `${baseUrl}/admin/reports/export?format=${format}${token ? `&token=${token}` : ''}`;
    }
};
