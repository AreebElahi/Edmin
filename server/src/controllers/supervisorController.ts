import { approveTeachingLoad, rejectTeachingLoad } from './teachingLoadController.js';
import { approveEnrollment, rejectEnrollment } from './enrollmentController.js';
import { approveReport, rejectReport } from './activityReportController.js';
import { commentLeave } from './leaveController.js';
import * as supervisorService from '../services/faculty/supervisor.service.js';
import { Request, Response } from 'express';

export const getPendingApprovals = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const userId = user.userId || user.userid;
    
    const data = await supervisorService.getPendingApprovals(userId);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    console.error('Error fetching supervisor pending approvals:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export {
  approveTeachingLoad,
  rejectTeachingLoad,
  approveEnrollment,
  rejectEnrollment,
  approveReport,
  rejectReport,
  commentLeave
};
