import { apiGet, apiPost, apiPatch, apiPut, apiDelete } from '../../../api/apiContract';

export interface Section {
  id: number;
  name: string;
  students: number;
  courses: string[];
  studentList?: string[];
}

export interface DepartmentCourse {
  id: string;
  name: string;
  credits: number;
}

export interface Department {
  id: number;
  departmentid: number;
  name: string;
  code: string;
  hod: string;
  supervisor: string;
  status: string;
  sections: Section[];
  courses: DepartmentCourse[];
}

export interface CreateDepartmentPayload {
  name: string;
  hodid?: number | null;
  supervisorid?: number | null;
  isactive?: boolean;
}

export interface MapCoursePayload {
  courseid: number;
}

export const getDepartments = (): Promise<Department[]> =>
  apiGet<Department[]>('/admin/departments');

export const createDepartment = (payload: CreateDepartmentPayload): Promise<Department> =>
  apiPost<Department>('/admin/departments', payload);

export const updateDepartment = (id: number, payload: Partial<CreateDepartmentPayload>): Promise<Department> =>
  apiPut<Department>(`/admin/departments/${id}`, payload);

export const mapCourseToDepartment = (departmentId: number, courseId: number): Promise<any> =>
  apiPost<any>(`/admin/departments/${departmentId}/courses`, { courseid: courseId });

export const deleteDepartment = (id: number): Promise<any> =>
  apiDelete<any>(`/admin/departments/${id}`);

export const createSection = (departmentId: number): Promise<any> =>
  apiPost<any>(`/admin/departments/${departmentId}/sections`, {});

export const assignDepartmentManagers = (id: number, hodId: number | null, supervisorId: number | null): Promise<any> =>
  apiPatch<any>(`/admin/departments/${id}/managers`, { hodId, supervisorId });
