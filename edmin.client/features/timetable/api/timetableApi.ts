import { apiGet, apiPost, apiDelete, apiPut } from '@/api/apiContract';

export interface Room {
    roomid: number;
    name: string;
    code: string;
    capacity: number;
    building?: string;
    isactive: boolean;
}

export interface TimetableSlot {
    slotId: number;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    course: string;
    teacher: string;
    room: string;
    offeringId: number;
    sectionId: number;
    programId: number | null;
}

export interface TimetableVersion {
    timetableid: number;
    name: string;
    status: 'DRAFT' | 'PUBLISHED';
    createdat: string;
}

export interface Section {
    sectionid: number;
    name: string;
    capacity: number;
    departmentid: number;
    programid: number | null;
    semesterid: number | null;
    isactive: boolean;
}

export interface Program {
    programid: number;
    name: string;
    code: string;
    departmentid: number;
    isactive: boolean;
    section: Section[];
}

export const timetableApi = {
    getRooms: (): Promise<Room[]> =>
        apiGet<Room[]>('/admin/rooms'),

    createRoom: (data: {
        name: string;
        code: string;
        capacity: number;
        building?: string;
    }): Promise<Room> =>
        apiPost<Room>('/admin/rooms', data),

    deleteRoom: (id: number): Promise<any> =>
        apiDelete<any>(`/admin/rooms/${id}`),

    getSlots: (): Promise<TimetableSlot[]> =>
        apiGet<TimetableSlot[]>('/admin/timetable/slots'),

    createSlot: (data: {
        offeringId: number;
        sectionId: number;
        roomId: number;
        dayOfWeek: string;
        startTime: string;
        endTime: string;
    }): Promise<any> =>
        apiPost<any>('/admin/timetable/slots', data),

    updateSlot: (id: number, data: {
        offeringId: number;
        sectionId: number;
        roomId: number;
        dayOfWeek: string;
        startTime: string;
        endTime: string;
    }): Promise<any> =>
        apiPut<any>(`/admin/timetable/slots/${id}`, data),

    deleteSlot: (id: number): Promise<any> =>
        apiDelete<any>(`/admin/timetable/slots/${id}`),

    getVersions: (): Promise<TimetableVersion[]> =>
        apiGet<TimetableVersion[]>('/admin/timetable/versions'),

    publishTimetable: (timetableId: number): Promise<any> =>
        apiPost<any>('/admin/timetable/publish', { timetableId }),

    getOfferings: (): Promise<TimetableOffering[]> =>
        apiGet<TimetableOffering[]>('/admin/timetable/offerings'),

    getPrograms: (): Promise<Program[]> =>
        apiGet<Program[]>('/admin/timetable/programs')
};

export interface TimetableOffering {
    offeringId: number;
    name: string;
    teacher: string;
    courseCode: string;
}

