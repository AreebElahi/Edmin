import { apiGet, apiPost, apiPatch, apiDelete } from '../api/apiContract';
import * as StudentTypes from '../types/student';

/**
 * Dashboard API endpoints.
 * All responses are unwrapped from the ApiEnvelope automatically via apiGet.
 */
export const DashboardAPI = {
  getStudentDashboard: (): Promise<any> => apiGet<any>('/dashboard/student'),
  getFacultyDashboard: (): Promise<any> => apiGet<any>('/dashboard/faculty'),
  getAdminDashboard: (): Promise<any>  => apiGet<any>('/dashboard/admin'),
  getHrDashboard: (): Promise<any>     => apiGet<any>('/dashboard/hr'),
  getHrSummary: (): Promise<any>       => apiGet<any>('/dashboard/hr/summary'),
  getHrLeavesToday: (): Promise<any>   => apiGet<any>('/dashboard/hr/leaves/today'),
  getHrCompliance: (): Promise<any>    => apiGet<any>('/dashboard/hr/compliance'),
  getHrApprovalsPending: (): Promise<any> => apiGet<any>('/dashboard/hr/approvals/pending'),
};

export const HodAPI = {
    getDashboardStats: () => apiGet<any>('/faculty/hod/dashboard-stats'),
    getFacultyActivity: () => apiGet<any>('/faculty/hod/faculty-activity'),
    getUpcomingEvents: () => apiGet<any>('/faculty/hod/upcoming-events'),
    getDepartmentCourses: () => apiGet<any>('/faculty/hod/courses'),
    getDepartmentLeaves: () => apiGet<any>('/faculty/hod/leaves'),
    getDepartmentTeachingLoads: () => apiGet<any>('/faculty/teaching-loads'),
    approveTeachingLoad: (id: number, comment: string) => apiPatch<any>(`/faculty/teaching-loads/${id}/approve`, { comment }),
    rejectTeachingLoad: (id: number, comment: string) => apiPatch<any>(`/faculty/teaching-loads/${id}/reject`, { comment }),
    getDepartmentStudents: () => apiGet<any>('/faculty/hod/students'),
    getDepartmentActivityReports: () => apiGet<any>('/faculty/hod/activity-reports'),
};

export const SupervisorAPI = {
    getPendingApprovals: () => apiGet<any>('/faculty/supervisor/pending-approvals'),
};

export const HrAPI = {
  getLeaves: () => apiGet<any>('/leaves'),
};

/**
 * Student Module API endpoints under /api/v1/student.
 */
export const StudentAPI = {
  getProfile: (): Promise<StudentTypes.ProfileResponse> => 
    apiGet<StudentTypes.ProfileResponse>('/student/profile'),

  getAttendanceSummary: (): Promise<StudentTypes.AttendanceSummary[]> => 
    apiGet<StudentTypes.AttendanceSummary[]>('/student/attendance'),

  getAttendanceDetail: (courseOfferingId: number): Promise<StudentTypes.AttendanceSessionLog[]> => 
    apiGet<StudentTypes.AttendanceSessionLog[]>(`/student/attendance/${courseOfferingId}`),

  getGrades: (): Promise<StudentTypes.GradesResponse> => 
    apiGet<StudentTypes.GradesResponse>('/student/grades'),

  getSchedule: (): Promise<StudentTypes.ScheduleItem[]> => 
    apiGet<StudentTypes.ScheduleItem[]>('/student/schedule'),

  getAvailableOfferings: (): Promise<StudentTypes.CourseOffering[]> => 
    apiGet<StudentTypes.CourseOffering[]>('/student/enrollment'),

  getMyEnrollmentRequests: (): Promise<StudentTypes.EnrollmentRequest[]> => 
    apiGet<StudentTypes.EnrollmentRequest[]>('/student/enrollment/mine'),

  submitEnrollmentRequest: (courseOfferingId: number): Promise<{ success: boolean; message: string }> => 
    apiPost<{ success: boolean; message: string }>('/student/enrollment', { courseOfferingId }),

  getAssignments: (): Promise<StudentTypes.StudentAssignment[]> => 
    apiGet<StudentTypes.StudentAssignment[]>('/student/assignments'),

  getAssignmentDetail: (assignmentId: number): Promise<StudentTypes.StudentAssignment> => 
    apiGet<StudentTypes.StudentAssignment>(`/student/assignments/${assignmentId}`),

  submitAssignment: (assignmentId: number, file: File): Promise<StudentTypes.AssignmentSubmission> => {
    const formData = new FormData();
    formData.append('file', file);
    return apiPost<StudentTypes.AssignmentSubmission>(`/student/assignments/${assignmentId}/submit`, formData, {
      headers: {
        'Content-Type': undefined as any,
      },
    });
  },

  unsubmitAssignment: (assignmentId: number): Promise<{ success: boolean; message: string }> =>
    apiDelete<{ success: boolean; message: string }>(`/student/assignments/${assignmentId}/submit`),

  getQuizzes: (): Promise<StudentTypes.StudentQuiz[]> => 
    apiGet<StudentTypes.StudentQuiz[]>('/student/quizzes'),

  getQuizDetail: (quizId: number): Promise<StudentTypes.StudentQuizDetail> => 
    apiGet<StudentTypes.StudentQuizDetail>(`/student/quizzes/${quizId}`),

  submitQuizAttempt: (quizId: number, answers: StudentTypes.QuizAttemptAnswer[]): Promise<StudentTypes.QuizResultResponse> => 
    apiPost<StudentTypes.QuizResultResponse>(`/student/quizzes/${quizId}/attempt`, { answers }),

  getQuizResult: (quizId: number): Promise<StudentTypes.QuizResultResponse> => 
    apiGet<StudentTypes.QuizResultResponse>(`/student/quizzes/${quizId}/result`),

  reportQuizViolation: (quizId: number) =>
    apiPost<{ message: string }>(`/student/quizzes/${quizId}/violation`, {}),

  getNotifications: (): Promise<StudentTypes.StudentNotification[]> => 
    apiGet<StudentTypes.StudentNotification[]>('/student/notifications'),

  markNotificationAsRead: (notificationId: number): Promise<StudentTypes.StudentNotification> => 
    apiPatch<StudentTypes.StudentNotification>(`/student/notifications/${notificationId}/read`),

  getCourses: (): Promise<any[]> => 
    apiGet<any[]>('/student/courses'),

  getCourseDetail: (courseOfferingId: number): Promise<any> => 
    apiGet<any>(`/student/courses/${courseOfferingId}`),
};

/**
 * Faculty Module API endpoints under /api/v1/faculty.
 */
export const FacultyAPI = {
  getCourses: (): Promise<any> => apiGet<any>('/faculty/courses'),
  getStudents: (): Promise<any> => apiGet<any>('/faculty/students'),
  updateStudentGrade: (enrollmentId: string, grade: string): Promise<any> => 
    apiPatch<any>(`/faculty/students/${enrollmentId}/grade`, { grade }),
  
  getAssignments: (): Promise<any> => apiGet<any>('/faculty/assignments'),
  createAssignment: (data: any): Promise<any> => apiPost<any>('/faculty/assignments', data),
  updateAssignment: (id: string, data: any): Promise<any> => apiPatch<any>(`/faculty/assignments/${id}`, data),
  deleteAssignment: (id: string): Promise<any> => apiDelete<any>(`/faculty/assignments/${id}`),
  
  getQuizzes: (): Promise<any> => apiGet<any>('/faculty/quizzes'),
  createQuiz: (data: any): Promise<any> => apiPost<any>('/faculty/quizzes', data),
  deleteQuiz: (id: string, isAi?: boolean): Promise<any> => apiDelete<any>(`/faculty/quizzes/${id}${isAi ? '?isAi=true' : ''}`),
  
  getSchedule: (): Promise<any> => apiGet<any>('/faculty/schedule'),
  
  getAttendanceSessions: (): Promise<any> => apiGet<any>('/faculty/attendance/sessions'),
  markAttendance: (data: any): Promise<any> => apiPost<any>('/faculty/attendance', data),
  createAttendanceSession: (data: any): Promise<any> => apiPost<any>('/faculty/attendance/sessions', data),
};

