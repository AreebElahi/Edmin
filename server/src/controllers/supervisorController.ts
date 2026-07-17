import * as supervisorService from '../services/faculty/supervisor.service.js';
import { Request, Response } from 'express';

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
        res.status(200).json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Internal server error' });
    }
};

export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await supervisorService.getDashboardStats(extractUserId(req));
        res.status(200).json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Internal server error' });
    }
};

// ==========================================
// 2. ACADEMIC MONITORING
// ==========================================

export const getDepartmentCourses = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await supervisorService.getDepartmentCourses(extractUserId(req));
        res.status(200).json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Internal server error' });
    }
};

export const getDepartmentTimetable = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await supervisorService.getDepartmentTimetable(extractUserId(req));
        res.status(200).json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Internal server error' });
    }
};

export const getDepartmentStudents = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await supervisorService.getDepartmentStudents(extractUserId(req));
        res.status(200).json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Internal server error' });
    }
};

export const getDepartmentFaculty = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await supervisorService.getDepartmentFaculty(extractUserId(req));
        res.status(200).json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Internal server error' });
    }
};

export const getDepartmentCalendar = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await supervisorService.getDepartmentCalendar(extractUserId(req));
        res.status(200).json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Internal server error' });
    }
};

export const getNotifications = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await supervisorService.getNotifications(extractUserId(req));
        res.status(200).json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Internal server error' });
    }
};

// ==========================================
// 3. PENDING APPROVALS / LISTINGS
// ==========================================

export const getPendingApprovals = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await supervisorService.getPendingApprovals(extractUserId(req));
        res.status(200).json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Internal server error' });
    }
};

export const getTeachingLoads = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await supervisorService.getTeachingLoads(extractUserId(req));
        res.status(200).json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Internal server error' });
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
        res.status(200).json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Internal server error' });
    }
};

export const getDepartmentActivityReports = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await supervisorService.getDepartmentActivityReports(extractUserId(req));
        res.status(200).json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Internal server error' });
    }
};

export const getDepartmentLeaves = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await supervisorService.getDepartmentLeaves(extractUserId(req));
        res.status(200).json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Internal server error' });
    }
};

export const getDepartmentAttendance = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await supervisorService.getDepartmentAttendance(extractUserId(req));
        res.status(200).json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Internal server error' });
    }
};

// ==========================================
// 4. RECOMMENDING WORKFLOWS (POST / PATCH)
// ==========================================

export const approveEnrollment = async (req: Request, res: Response): Promise<void> => {
    try {
        const { comment } = req.body;
        const data = await supervisorService.approveEnrollment(extractUserId(req), parseInt(req.params.id as string), comment);
        res.status(200).json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Internal server error' });
    }
};

export const rejectEnrollment = async (req: Request, res: Response): Promise<void> => {
    try {
        const { reason } = req.body;
        const data = await supervisorService.rejectEnrollment(extractUserId(req), parseInt(req.params.id as string), reason);
        res.status(200).json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Internal server error' });
    }
};

export const recommendTeachingLoad = async (req: Request, res: Response): Promise<void> => {
    try {
        const { comment } = req.body;
        const data = await supervisorService.recommendTeachingLoad(extractUserId(req), parseInt(req.params.id as string), comment);
        res.status(200).json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Internal server error' });
    }
};

export const rejectTeachingLoad = async (req: Request, res: Response): Promise<void> => {
    try {
        const { reason } = req.body;
        const data = await supervisorService.rejectTeachingLoad(extractUserId(req), parseInt(req.params.id as string), reason);
        res.status(200).json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Internal server error' });
    }
};

export const approveReport = async (req: Request, res: Response): Promise<void> => {
    try {
        const { comment } = req.body;
        const data = await supervisorService.reviewActivityReport(extractUserId(req), parseInt(req.params.id as string), 'APPROVED', comment);
        res.status(200).json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Internal server error' });
    }
};

export const rejectReport = async (req: Request, res: Response): Promise<void> => {
    try {
        const { reason } = req.body;
        const data = await supervisorService.reviewActivityReport(extractUserId(req), parseInt(req.params.id as string), 'REJECTED', reason);
        res.status(200).json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Internal server error' });
    }
};

export const commentLeave = async (req: Request, res: Response): Promise<void> => {
    try {
        const { comment } = req.body;
        const data = await supervisorService.commentLeave(extractUserId(req), parseInt(req.params.id as string), comment);
        res.status(200).json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Internal server error' });
    }
};

export const getApprovalHistory = async (req: Request, res: Response): Promise<void> => {
    try {
        const { entityType, entityId } = req.params;
        const data = await supervisorService.getApprovalHistory(extractUserId(req), entityType as string, parseInt(entityId as string));
        res.status(200).json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Internal server error' });
    }
};

export const getEnrollmentRequestDetail = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await supervisorService.getEnrollmentRequestDetail(extractUserId(req), parseInt(req.params.id as string));
        res.status(200).json({ success: true, data });
    } catch (error: any) {
        console.error('Error in getEnrollmentRequestDetail:', {
            userId: extractUserId(req),
            params: req.params,
            message: error.message,
            stack: error.stack
        });
        res.status(500).json({ message: error.message || 'Internal server error' });
    }
};

export const changeSection = async (req: Request, res: Response): Promise<void> => {
    try {
        const { type, targetSectionId } = req.body;
        const data = await supervisorService.changeSection(extractUserId(req), parseInt(req.params.id as string), type as 'REQUEST' | 'ENROLLMENT', parseInt(targetSectionId as string));
        res.status(200).json({ success: true, data });
    } catch (error: any) {
        console.error('Error in changeSection:', {
            userId: extractUserId(req),
            params: req.params,
            body: req.body,
            message: error.message,
            stack: error.stack
        });
        res.status(500).json({ message: error.message || 'Internal server error' });
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
        res.status(200).json({ success: true, data });
    } catch (error: any) {
        console.error('Error in getWithdrawalRequests:', {
            userId: extractUserId(req),
            query: req.query,
            message: error.message,
            stack: error.stack
        });
        res.status(500).json({ message: error.message || 'Internal server error' });
    }
};

export const getWithdrawalRequestDetail = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await supervisorService.getWithdrawalRequestDetail(extractUserId(req), parseInt(req.params.id as string));
        res.status(200).json({ success: true, data });
    } catch (error: any) {
        console.error('Error in getWithdrawalRequestDetail:', {
            userId: extractUserId(req),
            params: req.params,
            message: error.message,
            stack: error.stack
        });
        res.status(500).json({ message: error.message || 'Internal server error' });
    }
};

export const approveWithdrawal = async (req: Request, res: Response): Promise<void> => {
    try {
        const { comment } = req.body;
        const data = await supervisorService.approveWithdrawal(extractUserId(req), parseInt(req.params.id as string), comment);
        res.status(200).json({ success: true, data });
    } catch (error: any) {
        console.error('Error in approveWithdrawal:', {
            userId: extractUserId(req),
            params: req.params,
            body: req.body,
            message: error.message,
            stack: error.stack
        });
        res.status(500).json({ message: error.message || 'Internal server error' });
    }
};

export const rejectWithdrawal = async (req: Request, res: Response): Promise<void> => {
    try {
        const { reason } = req.body;
        const data = await supervisorService.rejectWithdrawal(extractUserId(req), parseInt(req.params.id as string), reason);
        res.status(200).json({ success: true, data });
    } catch (error: any) {
        console.error('Error in rejectWithdrawal:', {
            userId: extractUserId(req),
            params: req.params,
            body: req.body,
            message: error.message,
            stack: error.stack
        });
        res.status(500).json({ message: error.message || 'Internal server error' });
    }
};
