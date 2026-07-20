import { Request, Response } from 'express';
import prisma from '../../config/prisma.js';
import { createAuditEntry } from '../../services/workflows/shared/audit.service.js';
import { sendSuccess, sendError, ApiResponse } from '../../contracts/api.contracts.js';
import { scheduleExam } from '../../services/examination/examScheduling.service.js';
import { assignInvigilator } from '../../services/examination/invigilation.service.js';
import { lockAssessmentMarks, publishCourseGrades, getPublishedResults } from '../../services/examination/resultPublication.service.js';
import { getStudentTranscriptData } from '../../services/examination/transcript.service.js';
import { getPromotionRecommendations, executePromotionOrGraduation } from '../../services/examination/promotion.service.js';
import { getDegreeAuditsList, reevaluateAllDegreeAudits } from '../../services/examination/degreeAudit.service.js';
import { getExaminationStatistics } from '../../services/examination/statistics.service.js';
import { getCachedResponse, setCachedResponse, redisConnection } from "../../config/redis.js";

const clearExamCache = async () => {
    if (redisConnection && redisConnection.status === 'ready') {
        try {
            const keys = await redisConnection.keys('user:profile:*:admin:examination:schedules');
            if (keys.length > 0) {
                await redisConnection.del(...keys);
            }
        } catch (e) {
            console.error('[Redis Cache] Failed to clear exam cache', e);
        }
    }
};

// --- 1. EXAM TIMETABLE SCHEDULING ---
export const getExamSchedules = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const schedules = await prisma.examsession.findMany({
            include: {
                room: true,
                section: true,
                assessment: {
                    include: {
                        courseoffering: {
                            include: {
                                course: true,
                                semester: true
                            }
                        }
                    }
                },
                invigilations: {
                    include: {
                        faculty: true
                    }
                }
            },
            orderBy: {
                date: 'asc'
            }
        });

        const data = schedules.map(s => ({
            examsessionid: s.examsessionid,
            date: s.date,
            starttime: s.starttime,
            endtime: s.endtime,
            duration: s.duration,
            status: s.status,
            examType: s.exam_type,
            roomName: s.room.name,
            roomCapacity: s.room.capacity,
            sectionName: s.section.name,
            courseName: s.assessment.courseoffering.course.name,
            courseCode: s.assessment.courseoffering.course.code,
            semester: s.assessment.courseoffering.semester.name,
            invigilators: s.invigilations.map(inv => ({
                invigilationid: inv.invigilationid,
                facultyName: inv.faculty.fullname,
                role: inv.role
            }))
        }));

        return sendSuccess(res, data);
    } catch (error: any) {
        console.error('getExamSchedules Error:', error);
        return sendError(res, error.message || 'Failed to fetch exam schedules');
    }
};

export const createExamSchedule = async (req: Request, res: Response<ApiResponse>) => {
    const { assessmentId, courseOfferingId, roomId, sectionId, date, startTime, endTime, duration, examType, facultyId } = req.body;
    const adminUserId = (req as any).user.userId;

    if ((!assessmentId && !courseOfferingId) || !roomId || !sectionId || !date || !startTime || !endTime || !duration || !examType) {
        return sendError(res, 'All scheduling fields are required', 'INVALID_INPUT', 400);
    }

    try {
        let finalAssessmentId = assessmentId ? parseInt(assessmentId, 10) : null;
        
        if (!finalAssessmentId && courseOfferingId) {
            let assessment = await prisma.assessment.findFirst({
                where: { offeringid: parseInt(courseOfferingId, 10), type: examType as any }
            });
            
            if (!assessment) {
                assessment = await prisma.assessment.create({
                    data: {
                        offeringid: parseInt(courseOfferingId, 10),
                        type: examType as any,
                        name: `${examType === 'MID_TERM' ? 'Mid Term' : 'Final'} Exam`,
                        totalmarks: 100,
                        weight: examType === 'MID_TERM' ? 30 : 50,
                        status: 'DRAFT',
                        createdby: adminUserId
                    }
                });
            }
            finalAssessmentId = assessment.assessmentid;
        }

        const parsedDate = new Date(date);
        const parsedStartTime = new Date(`${date}T${startTime}`);
        const parsedEndTime = new Date(`${date}T${endTime}`);

        const session = await scheduleExam({
            assessmentId: finalAssessmentId as number,
            roomId: parseInt(roomId, 10),
            sectionId: parseInt(sectionId, 10),
            date: parsedDate,
            startTime: parsedStartTime,
            endTime: parsedEndTime,
            duration: parseInt(duration, 10),
            examType: examType
        });

        if (facultyId) {
            await assignInvigilator(session.examsessionid, parseInt(facultyId, 10));
        }

        await createAuditEntry(adminUserId, 'CREATE_EXAM_SCHEDULE', 'examsession', session.examsessionid, { assessmentId, roomId, sectionId });

        await clearExamCache();

        return sendSuccess(res, { message: 'Exam session successfully scheduled', session });
    } catch (error: any) {
        console.error('createExamSchedule Error:', error);
        return sendError(res, error.message || 'Failed to create exam schedule');
    }
};

export const deleteExamSchedule = async (req: Request, res: Response<ApiResponse>) => {
    const { id } = req.params;
    const sid = parseInt(id as any, 10);
    const adminUserId = (req as any).user.userId;

    if (isNaN(sid)) {
        return sendError(res, 'Invalid schedule ID', 'INVALID_INPUT', 400);
    }

    try {
        await prisma.examsession.delete({
            where: { examsessionid: sid }
        });

        await createAuditEntry(adminUserId, 'DELETE_EXAM_SCHEDULE', 'examsession', sid, null);

        await clearExamCache();

        return sendSuccess(res, { message: 'Exam session cancelled and deleted successfully' });
    } catch (error: any) {
        console.error('deleteExamSchedule Error:', error);
        return sendError(res, error.message || 'Failed to delete exam schedule');
    }
};


// --- 2. MARKS VERIFICATION & RESULTS PUBLISHING ---
export const getVerificationRoster = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const offerings = await prisma.courseoffering.findMany({
            include: {
                course: true,
                semester: true,
                assessment: {
                    include: {
                        assessmentresult: true
                    }
                },
                courseenrollment: true,
                section: true
            }
        });

        const roster = offerings.map(o => {
            const assessmentsData = o.assessment.map(a => {
                const totalStudents = o.courseenrollment.length;
                const uploadedCount = a.assessmentresult.length;
                
                return {
                    assessmentid: a.assessmentid,
                    name: a.name,
                    type: a.type,
                    totalmarks: a.totalmarks,
                    weight: a.weight,
                    status: a.status,
                    totalStudents,
                    uploadedCount
                };
            });

            const totalAssessments = o.assessment.length;
            const completedGrading = o.courseenrollment.every(e => e.status === 'COMPLETED');

            return {
                courseofferingid: o.courseofferingid,
                courseName: o.course.name,
                courseCode: o.course.code,
                semesterName: o.semester.name,
                studentCount: o.courseenrollment.length,
                totalAssessments,
                completedGrading,
                assessments: assessmentsData,
                sections: o.section ? [{
                    sectionid: o.section.sectionid,
                    name: o.section.name
                }] : []
            };
        });

        return sendSuccess(res, roster);
    } catch (error: any) {
        console.error('getVerificationRoster Error:', error);
        return sendError(res, error.message || 'Failed to fetch verification roster');
    }
};

export const getAssessmentMarks = async (req: Request, res: Response<ApiResponse>) => {
    const { id } = req.params;
    const aid = parseInt(id as any, 10);

    if (isNaN(aid)) {
        return sendError(res, 'Invalid assessment ID', 'INVALID_INPUT', 400);
    }

    try {
        const results = await prisma.assessmentresult.findMany({
            where: { assessmentid: aid },
            include: {
                student: {
                    include: {
                        user: true
                    }
                }
            }
        });

        const marks = results.map(r => ({
            resultid: r.resultid,
            studentid: r.studentid,
            studentName: r.student.fullname || r.student.user.username,
            rollnumber: r.student.rollnumber || 'N/A',
            obtainedmarks: r.obtainedmarks,
            islocked: r.islocked,
            remarks: r.remarks,
            updatedat: r.updatedat
        }));

        return sendSuccess(res, marks);
    } catch (error: any) {
        console.error('getAssessmentMarks Error:', error);
        return sendError(res, error.message || 'Failed to fetch assessment marks');
    }
};

export const lockAssessmentMarksHandler = async (req: Request, res: Response<ApiResponse>) => {
    const { id } = req.params;
    const aid = parseInt(id as any, 10);
    const adminUserId = (req as any).user.userId;

    if (isNaN(aid)) {
        return sendError(res, 'Invalid assessment ID', 'INVALID_INPUT', 400);
    }

    try {
        const updated = await lockAssessmentMarks(aid, adminUserId);
        return sendSuccess(res, { message: 'Assessment marks successfully verified and locked', updated });
    } catch (error: any) {
        console.error('lockAssessmentMarks Error:', error);
        return sendError(res, error.message || 'Failed to lock assessment marks');
    }
};

export const publishCourseGradesHandler = async (req: Request, res: Response<ApiResponse>) => {
    const { id } = req.params;
    const offeringId = parseInt(id as any, 10);
    const adminUserId = (req as any).user.userId;

    if (isNaN(offeringId)) {
        return sendError(res, 'Invalid course offering ID', 'INVALID_INPUT', 400);
    }

    try {
        const result = await publishCourseGrades(offeringId, adminUserId);
        return sendSuccess(res, result);
    } catch (error: any) {
        console.error('publishCourseGrades Error:', error);
        return sendError(res, error.message || 'Failed to publish course grades');
    }
};

export const getPublishedResultsHandler = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const auditLog = await getPublishedResults();
        return sendSuccess(res, auditLog);
    } catch (error: any) {
        console.error('getPublishedResults Error:', error);
        return sendError(res, error.message || 'Failed to fetch published results history');
    }
};


// --- 3. TRANSCRIPT GENERATION ---
export const getStudentTranscript = async (req: Request, res: Response<ApiResponse>) => {
    const { studentId } = req.params;
    const sid = parseInt(studentId as any, 10);

    if (isNaN(sid)) {
        return sendError(res, 'Invalid student ID', 'INVALID_INPUT', 400);
    }

    try {
        const transcript = await getStudentTranscriptData(sid);
        return sendSuccess(res, transcript);
    } catch (error: any) {
        console.error('getStudentTranscript Error:', error);
        return sendError(res, error.message || 'Failed to fetch student transcript');
    }
};


// --- 4. PROMOTION & GRADUATION ---
export const getPromotionRecommendationsHandler = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const recommendations = await getPromotionRecommendations();
        return sendSuccess(res, recommendations);
    } catch (error: any) {
        console.error('getPromotionRecommendations Error:', error);
        return sendError(res, error.message || 'Failed to fetch promotion recommendations');
    }
};

export const executePromotionHandler = async (req: Request, res: Response<ApiResponse>) => {
    const { studentId } = req.params;
    const sid = parseInt(studentId as any, 10);
    const { status, standing, comment } = req.body;
    const adminUserId = (req as any).user.userId;

    if (isNaN(sid)) {
        return sendError(res, 'Invalid student ID', 'INVALID_INPUT', 400);
    }

    if (!status || !standing) {
        return sendError(res, 'Status and Standing parameters are required', 'INVALID_INPUT', 400);
    }

    try {
        const updated = await executePromotionOrGraduation(sid, { status, standing, comment }, adminUserId);
        return sendSuccess(res, { message: 'Student status and academic standing successfully updated', updated });
    } catch (error: any) {
        console.error('executePromotion Error:', error);
        return sendError(res, error.message || 'Failed to commit promotion override');
    }
};


// --- 5. DEGREE AUDIT ---
export const getDegreeAudits = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const audits = await getDegreeAuditsList();
        return sendSuccess(res, audits);
    } catch (error: any) {
        console.error('getDegreeAudits Error:', error);
        return sendError(res, error.message || 'Failed to fetch degree audits');
    }
};

export const reevaluateDegreeAudits = async (req: Request, res: Response<ApiResponse>) => {
    const adminUserId = (req as any).user.userId;
    try {
        const result = await reevaluateAllDegreeAudits(adminUserId);
        return sendSuccess(res, { message: `Reevaluated degree compliance audits for all students`, result });
    } catch (error: any) {
        console.error('reevaluateDegreeAudits Error:', error);
        return sendError(res, error.message || 'Failed to reevaluate degree audits');
    }
};


// --- 6. STATISTICS ---
export const getExaminationStats = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const stats = await getExaminationStatistics();
        return sendSuccess(res, stats);
    } catch (error: any) {
        console.error('getExaminationStats Error:', error);
        return sendError(res, error.message || 'Failed to fetch examination statistics');
    }
};
