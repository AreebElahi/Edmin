import { apiClient } from './apiClient';

export interface ExamScheduleItem {
    examsessionid: number;
    date: string;
    starttime: string;
    endtime: string;
    duration: number;
    status: string;
    examType: string;
    roomName: string;
    roomCapacity: number;
    sectionName: string;
    courseName: string;
    courseCode: string;
    semester: string;
    invigilators: Array<{
        invigilationid: number;
        facultyName: string;
        role: string;
    }>;
}

export interface VerificationRosterItem {
    courseofferingid: number;
    courseName: string;
    courseCode: string;
    semesterName: string;
    studentCount: number;
    totalAssessments: number;
    completedGrading: boolean;
    assessments: Array<{
        assessmentid: number;
        name: string;
        type: string;
        totalmarks: number;
        weight: number;
        status: string;
        totalStudents: number;
        uploadedCount: number;
    }>;
}

export interface AssessmentMarkItem {
    resultid: number;
    studentid: number;
    studentName: string;
    rollnumber: string;
    obtainedmarks: number;
    islocked: boolean;
    remarks: string | null;
    updatedat: string;
}

export interface PublishedResultHistoryItem {
    offeringId: number;
    courseName: string;
    courseCode: string;
    semester: string;
    instructorName: string;
    enrolledCount: number;
    completedCount: number;
    avgGpa: number;
    passRate: number;
    publishedAt: string;
}

export interface TranscriptData {
    student: {
        studentid: number;
        fullname: string;
        rollnumber: string;
        email: string;
        department: string;
        departmentCode: string;
        currentSemester: string;
        status: string;
    };
    semesters: Array<{
        semesterId: number;
        semesterName: string;
        gpa: number;
        cgpa: number;
        earnedCredits: number;
        courses: Array<{
            enrollmentId: number;
            courseName: string;
            courseCode: string;
            credits: number;
            grade: string;
            gradepoints: number | null;
        }>;
    }>;
    summary: {
        totalCredits: number;
        cgpa: number;
        completedCourses: number;
    };
}

export interface DegreeAuditItem {
    degreeauditid: number;
    studentId: number;
    studentName: string;
    rollnumber: string;
    department: string;
    currentSemester: string;
    requiredCredits: number;
    earnedCredits: number;
    remainingCredits: number;
    eligible: boolean;
    status: 'NOT_ELIGIBLE' | 'ELIGIBLE' | 'GRADUATED';
}

export interface PromotionRecommendationItem {
    studentId: number;
    fullname: string;
    rollnumber: string;
    departmentName: string;
    currentSemester: string;
    currentStatus: string;
    currentStanding: string;
    earnedCredits: number;
    cgpa: number;
    failedCount: number;
    recommendedStanding: string;
    recommendedStatus: string;
    statusReason: string;
}

export interface ExaminationStats {
    departmentGpaAverages: Array<{
        departmentName: string;
        avgGpa: number;
    }>;
    passRates: Array<{
        courseCode: string;
        courseName: string;
        completedCount: number;
        passRate: number;
        failRate: number;
    }>;
    topPerformers: Array<{
        studentName: string;
        rollnumber: string;
        department: string;
        cgpa: number;
        earnedCredits: number;
    }>;
    highFailureCourses: Array<{
        courseCode: string;
        courseName: string;
        completedCount: number;
        passRate: number;
        failRate: number;
    }>;
}

export const examinationApi = {
    getSchedules: async (): Promise<ExamScheduleItem[]> => {
        const res = await apiClient.get('/admin/examination/schedules');
        return res.data;
    },
    createSchedule: async (payload: {
        assessmentId: number;
        roomId: number;
        sectionId: number;
        date: string;
        startTime: string;
        endTime: string;
        duration: number;
        examType: string;
        facultyId?: number;
    }): Promise<any> => {
        const res = await apiClient.post('/admin/examination/schedules', payload);
        return res.data;
    },
    deleteSchedule: async (id: number): Promise<any> => {
        const res = await apiClient.delete(`/admin/examination/schedules/${id}`);
        return res.data;
    },
    getVerificationRoster: async (): Promise<VerificationRosterItem[]> => {
        const res = await apiClient.get('/admin/examination/verification-roster');
        return res.data;
    },
    getAssessmentMarks: async (id: number): Promise<AssessmentMarkItem[]> => {
        const res = await apiClient.get(`/admin/examination/assessment-marks/${id}`);
        return res.data;
    },
    lockAssessmentMarks: async (id: number): Promise<any> => {
        const res = await apiClient.patch(`/admin/examination/assessment-marks/${id}/lock`);
        return res.data;
    },
    publishCourseGrades: async (id: number): Promise<any> => {
        const res = await apiClient.patch(`/admin/examination/course-grades/${id}/publish`);
        return res.data;
    },
    getPublishedResults: async (): Promise<PublishedResultHistoryItem[]> => {
        const res = await apiClient.get('/admin/examination/published-results');
        return res.data;
    },
    getStudentTranscript: async (studentId: number): Promise<TranscriptData> => {
        const res = await apiClient.get(`/admin/examination/transcripts/${studentId}`);
        return res.data;
    },
    getDegreeAudits: async (): Promise<DegreeAuditItem[]> => {
        const res = await apiClient.get('/admin/examination/degree-audits');
        return res.data;
    },
    reevaluateDegreeAudits: async (): Promise<any> => {
        const res = await apiClient.post('/admin/examination/degree-audits/reevaluate');
        return res.data;
    },
    getPromotionRecommendations: async (): Promise<PromotionRecommendationItem[]> => {
        const res = await apiClient.get('/admin/examination/promotion-recommendations');
        return res.data;
    },
    executePromotion: async (studentId: number, payload: { status: string; standing: string; comment?: string }): Promise<any> => {
        const res = await apiClient.post(`/admin/examination/promote/${studentId}`, payload);
        return res.data;
    },
    getStats: async (): Promise<ExaminationStats> => {
        const res = await apiClient.get('/admin/examination/stats');
        return res.data;
    }
};
