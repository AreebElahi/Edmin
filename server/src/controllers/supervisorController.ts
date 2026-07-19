import * as supervisorService from '../services/faculty/supervisor.service.js';
import { Request, Response } from 'express';
import { sendSuccess, sendError } from "../contracts/api.contracts.js";
import { getCachedResponse, setCachedResponse } from "../config/redis.js";

const extractUserId = (req: Request): number => {
    const user = (req as any).user;
    return user.userId || user.userid;
};

// ==========================================
// 1. DASHBOARD & ANALYTICS
// ==========================================

export const getAnalytics = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await supervisorService.getAnalytics(extractUserId(req));
        sendSuccess(res, data, undefined, undefined, 200);
    } catch (error: any) {
        sendError(res, error.message || 'Internal server error', [], 500);
    }
};

export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await supervisorService.getDashboardStats(extractUserId(req));
        sendSuccess(res, data, undefined, undefined, 200);
    } catch (error: any) {
        sendError(res, error.message || 'Internal server error', [], 500);
    }
};

// ==========================================
// 2. ACADEMIC MONITORING
// ==========================================

export const getDepartmentCourses = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await supervisorService.getDepartmentCourses(extractUserId(req));
        sendSuccess(res, data, undefined, undefined, 200);
    } catch (error: any) {
        sendError(res, error.message || 'Internal server error', [], 500);
    }
};

export const getDepartmentTimetable = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await supervisorService.getDepartmentTimetable(extractUserId(req));
        sendSuccess(res, data, undefined, undefined, 200);
    } catch (error: any) {
        sendError(res, error.message || 'Internal server error', [], 500);
    }
};

export const getDepartmentStudents = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await supervisorService.getDepartmentStudents(extractUserId(req));
        sendSuccess(res, data, undefined, undefined, 200);
    } catch (error: any) {
        sendError(res, error.message || 'Internal server error', [], 500);
    }
};

export const getDepartmentFaculty = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await supervisorService.getDepartmentFaculty(extractUserId(req));
        sendSuccess(res, data, undefined, undefined, 200);
    } catch (error: any) {
        sendError(res, error.message || 'Internal server error', [], 500);
    }
};

export const getDepartmentCalendar = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await supervisorService.getDepartmentCalendar(extractUserId(req));
        sendSuccess(res, data, undefined, undefined, 200);
    } catch (error: any) {
        sendError(res, error.message || 'Internal server error', [], 500);
    }
};

export const getNotifications = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await supervisorService.getNotifications(extractUserId(req));
        sendSuccess(res, data, undefined, undefined, 200);
    } catch (error: any) {
        sendError(res, error.message || 'Internal server error', [], 500);
    }
};

// ==========================================
// 3. PENDING APPROVALS / LISTINGS
// ==========================================

export const getPendingApprovals = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await supervisorService.getPendingApprovals(extractUserId(req));
        sendSuccess(res, data, undefined, undefined, 200);
    } catch (error: any) {
        sendError(res, error.message || 'Internal server error', [], 500);
    }
};

export const getTeachingLoads = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await supervisorService.getTeachingLoads(extractUserId(req));
        sendSuccess(res, data, undefined, undefined, 200);
    } catch (error: any) {
        sendError(res, error.message || 'Internal server error', [], 500);
    }
};

export const getEnrollmentRequests = async (req: Request, res: Response): Promise<void> => {
    try {
        const { search, status, page, limit } = req.query;
        const data = await supervisorService.getEnrollmentRequests(extractUserId(req), {
            search: search ? String(search) : undefined,
            status: status ? String(status) : undefined,
            page: page ? parseInt(String(page)) : undefined,
            limit: limit ? parseInt(String(limit)) : undefined
        });
        sendSuccess(res, data, undefined, undefined, 200);
    } catch (error: any) {
        sendError(res, error.message || 'Internal server error', [], 500);
    }
};

export const getDepartmentActivityReports = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await supervisorService.getDepartmentActivityReports(extractUserId(req));
        sendSuccess(res, data, undefined, undefined, 200);
    } catch (error: any) {
        sendError(res, error.message || 'Internal server error', [], 500);
    }
};

export const getDepartmentLeaves = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await supervisorService.getDepartmentLeaves(extractUserId(req));
        sendSuccess(res, data, undefined, undefined, 200);
    } catch (error: any) {
        sendError(res, error.message || 'Internal server error', [], 500);
    }
};

export const getDepartmentAttendance = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await supervisorService.getDepartmentAttendance(extractUserId(req));
        sendSuccess(res, data, undefined, undefined, 200);
    } catch (error: any) {
        sendError(res, error.message || 'Internal server error', [], 500);
    }
};

// ==========================================
// 4. RECOMMENDING WORKFLOWS (POST / PATCH)
// ==========================================

export const approveEnrollment = async (req: Request, res: Response): Promise<void> => {
    try {
        const { comment } = req.body;
        const data = await supervisorService.approveEnrollment(extractUserId(req), parseInt(req.params.id as string), comment);
        sendSuccess(res, data, undefined, undefined, 200);
    } catch (error: any) {
        sendError(res, error.message || 'Internal server error', [], 500);
    }
};

export const rejectEnrollment = async (req: Request, res: Response): Promise<void> => {
    try {
        const { reason } = req.body;
        const data = await supervisorService.rejectEnrollment(extractUserId(req), parseInt(req.params.id as string), reason);
        sendSuccess(res, data, undefined, undefined, 200);
    } catch (error: any) {
        sendError(res, error.message || 'Internal server error', [], 500);
    }
};

export const recommendTeachingLoad = async (req: Request, res: Response): Promise<void> => {
    try {
        const { comment } = req.body;
        const data = await supervisorService.recommendTeachingLoad(extractUserId(req), parseInt(req.params.id as string), comment);
        sendSuccess(res, data, undefined, undefined, 200);
    } catch (error: any) {
        sendError(res, error.message || 'Internal server error', [], 500);
    }
};

export const rejectTeachingLoad = async (req: Request, res: Response): Promise<void> => {
    try {
        const { reason } = req.body;
        const data = await supervisorService.rejectTeachingLoad(extractUserId(req), parseInt(req.params.id as string), reason);
        sendSuccess(res, data, undefined, undefined, 200);
    } catch (error: any) {
        sendError(res, error.message || 'Internal server error', [], 500);
    }
};

export const approveReport = async (req: Request, res: Response): Promise<void> => {
    try {
        const { comment } = req.body;
        const data = await supervisorService.reviewActivityReport(extractUserId(req), parseInt(req.params.id as string), 'APPROVED', comment);
        sendSuccess(res, data, undefined, undefined, 200);
    } catch (error: any) {
        sendError(res, error.message || 'Internal server error', [], 500);
    }
};

export const rejectReport = async (req: Request, res: Response): Promise<void> => {
    try {
        const { reason } = req.body;
        const data = await supervisorService.reviewActivityReport(extractUserId(req), parseInt(req.params.id as string), 'REJECTED', reason);
        sendSuccess(res, data, undefined, undefined, 200);
    } catch (error: any) {
        sendError(res, error.message || 'Internal server error', [], 500);
    }
};

export const commentLeave = async (req: Request, res: Response): Promise<void> => {
    try {
        const { comment } = req.body;
        const data = await supervisorService.commentLeave(extractUserId(req), parseInt(req.params.id as string), comment);
        sendSuccess(res, data, undefined, undefined, 200);
    } catch (error: any) {
        sendError(res, error.message || 'Internal server error', [], 500);
    }
};

export const getApprovalHistory = async (req: Request, res: Response): Promise<void> => {
    try {
        const { entityType, entityId } = req.params;
        const data = await supervisorService.getApprovalHistory(extractUserId(req), entityType as string, parseInt(entityId as string));
        sendSuccess(res, data, undefined, undefined, 200);
    } catch (error: any) {
        sendError(res, error.message || 'Internal server error', [], 500);
    }
};

export const getEnrollmentRequestDetail = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await supervisorService.getEnrollmentRequestDetail(extractUserId(req), parseInt(req.params.id as string));
        sendSuccess(res, data, undefined, undefined, 200);
    } catch (error: any) {
        console.error('Error in getEnrollmentRequestDetail:', {
            userId: extractUserId(req),
            params: req.params,
            message: error.message,
            stack: error.stack
        });
        sendError(res, error.message || 'Internal server error', [], 500);
    }
};

export const changeSection = async (req: Request, res: Response): Promise<void> => {
    try {
        const { type, targetSectionId } = req.body;
        const data = await supervisorService.changeSection(extractUserId(req), parseInt(req.params.id as string), type as 'REQUEST' | 'ENROLLMENT', parseInt(targetSectionId as string));
        sendSuccess(res, data, undefined, undefined, 200);
    } catch (error: any) {
        console.error('Error in changeSection:', {
            userId: extractUserId(req),
            params: req.params,
            body: req.body,
            message: error.message,
            stack: error.stack
        });
        sendError(res, error.message || 'Internal server error', [], 500);
    }
};

export const getWithdrawalRequests = async (req: Request, res: Response): Promise<void> => {
    try {
        const { search, status, page, limit } = req.query;
        const data = await supervisorService.getWithdrawalRequests(extractUserId(req), {
            search: search ? String(search) : undefined,
            status: status ? String(status) : undefined,
            page: page ? parseInt(String(page)) : undefined,
            limit: limit ? parseInt(String(limit)) : undefined
        });
        sendSuccess(res, data, undefined, undefined, 200);
    } catch (error: any) {
        console.error('Error in getWithdrawalRequests:', {
            userId: extractUserId(req),
            query: req.query,
            message: error.message,
            stack: error.stack
        });
        sendError(res, error.message || 'Internal server error', [], 500);
    }
};

export const getWithdrawalRequestDetail = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await supervisorService.getWithdrawalRequestDetail(extractUserId(req), parseInt(req.params.id as string));
        sendSuccess(res, data, undefined, undefined, 200);
    } catch (error: any) {
        console.error('Error in getWithdrawalRequestDetail:', {
            userId: extractUserId(req),
            params: req.params,
            message: error.message,
            stack: error.stack
        });
        sendError(res, error.message || 'Internal server error', [], 500);
    }
};

export const approveWithdrawal = async (req: Request, res: Response): Promise<void> => {
    try {
        const { comment } = req.body;
        const data = await supervisorService.approveWithdrawal(extractUserId(req), parseInt(req.params.id as string), comment);
        sendSuccess(res, data, undefined, undefined, 200);
    } catch (error: any) {
        console.error('Error in approveWithdrawal:', {
            userId: extractUserId(req),
            params: req.params,
            body: req.body,
            message: error.message,
            stack: error.stack
        });
        sendError(res, error.message || 'Internal server error', [], 500);
    }
};

export const rejectWithdrawal = async (req: Request, res: Response): Promise<void> => {
    try {
        const { reason } = req.body;
        const data = await supervisorService.rejectWithdrawal(extractUserId(req), parseInt(req.params.id as string), reason);
        sendSuccess(res, data, undefined, undefined, 200);
    } catch (error: any) {
        console.error('Error in rejectWithdrawal:', {
            userId: extractUserId(req),
            params: req.params,
            body: req.body,
            message: error.message,
            stack: error.stack
        });
        sendError(res, error.message || 'Internal server error', [], 500);
    }
};
