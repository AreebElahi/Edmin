import { useQuery } from '@tanstack/react-query';
import { reportsApi, AttendanceReportItem, EnrollmentReportItem, LeaveReportSummary, GradeDistributionItem } from '../api/reportsApi';

export const useAttendanceReport = () => {
    return useQuery<AttendanceReportItem[]>({
        queryKey: ['reports', 'attendance'],
        queryFn: reportsApi.getAttendanceReport
    });
};

export const useEnrollmentReport = () => {
    return useQuery<EnrollmentReportItem[]>({
        queryKey: ['reports', 'enrollment'],
        queryFn: reportsApi.getEnrollmentReport
    });
};

export const useLeaveReportSummary = () => {
    return useQuery<LeaveReportSummary>({
        queryKey: ['reports', 'leaves'],
        queryFn: reportsApi.getLeaveReportSummary
    });
};

export const useGradeDistributionReport = () => {
    return useQuery<GradeDistributionItem[]>({
        queryKey: ['reports', 'grades'],
        queryFn: reportsApi.getGradeDistributionReport
    });
};
