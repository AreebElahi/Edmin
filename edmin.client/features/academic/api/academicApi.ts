import { apiGet, apiPost } from '@/api/apiContract';

export interface Semester {
    semesterid: number;
    name: string;
    year: number;
    startdate?: string | null;
    enddate?: string | null;
    status: 'UPCOMING' | 'ONGOING' | 'COMPLETED';
    isactive: boolean;
}

export const academicApi = {
    getSemesters: (): Promise<Semester[]> =>
        apiGet<Semester[]>('/admin/semesters'),

    createSemester: (data: {
        name: string;
        year: number;
        startDate?: string;
        endDate?: string;
    }): Promise<Semester> =>
        apiPost<Semester>('/admin/semesters', data),

    executeRollover: (targetSemesterId: number): Promise<Semester> =>
        apiPost<Semester>('/admin/semesters/rollover', { targetSemesterId }),

    getSemesterCourses: (semesterId: number): Promise<any[]> =>
        apiGet<any[]>(`/admin/semesters/${semesterId}/courses`)
};
