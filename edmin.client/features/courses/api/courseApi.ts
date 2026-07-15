import { apiGet, apiPost, apiPut, apiPatch } from '@/api/apiContract';

export interface Course {
    courseid: number;
    code: string;
    name: string;
    credits: number;
    basecapacity: number;
    description?: string;
    isactive: boolean;
    departmentcourse: {
        departmentid: number;
        department: {
            departmentid: number;
            name: string;
            code: string;
        }
    }[];
}

export const courseApi = {
    getAllCourses: (): Promise<Course[]> => 
        apiGet<Course[]>('/admin/courses'),

    createCourse: (data: {
        code: string;
        name: string;
        credits: number;
        basecapacity: number;
        description?: string;
        departmentIds: number[];
    }): Promise<Course> => 
        apiPost<Course>('/admin/courses', data),

    updateCourse: (
        id: number,
        data: {
            code: string;
            name: string;
            credits: number;
            basecapacity: number;
            description?: string;
            departmentIds: number[];
        }
    ): Promise<Course> => 
        apiPut<Course>(`/admin/courses/${id}`, data),

    toggleCourseStatus: (id: number, isactive: boolean): Promise<Course> => 
        apiPatch<Course>(`/admin/courses/${id}/status`, { isactive })
};

