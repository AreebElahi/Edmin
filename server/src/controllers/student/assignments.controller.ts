import { redisConnection } from '../../config/redis.js';
import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../contracts/api.contracts.js';
import * as AssignmentsService from '../../services/student/assignments.service.js';
import { saveFile, deleteFile } from '../../services/storage.service.js';
import path from 'path';
import { getCachedResponse, setCachedResponse } from "../../config/redis.js";

export const getAssignmentsHandler = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId || (req as any).user.id;
    const assignments = await AssignmentsService.getAssignmentsWithStatus(userId);
    const fullResponse = { success: true, data: assignments };

    return sendSuccess(res, (fullResponse as any).data || fullResponse, undefined, undefined, 200);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return sendError(res, error.message, 'ASSIGNMENTS_ERROR', statusCode);
  }
};

export const getAssignmentDetailHandler = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId || (req as any).user.id;
    const assignmentId = parseInt(req.params.assignmentId as string, 10);
    
    if (isNaN(assignmentId)) {
      return sendError(res, 'Invalid assignmentId', 'VALIDATION_FAILED', 400);
    }

    const detail = await AssignmentsService.getAssignmentDetail(userId, assignmentId);
    const fullResponse = { success: true, data: detail };

    return sendSuccess(res, (fullResponse as any).data || fullResponse, undefined, undefined, 200);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return sendError(res, error.message, 'ASSIGNMENTS_ERROR', statusCode);
  }
};

export const submitAssignmentHandler = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId || (req as any).user.id;
    const assignmentId = parseInt(req.params.assignmentId as string, 10);
    if (isNaN(assignmentId)) {
      return sendError(res, 'Invalid assignmentId', 'VALIDATION_FAILED', 400);
    }

    if (!req.file) {
      return sendError(res, 'No file uploaded', 'VALIDATION_FAILED', 400);
    }

    // Save the file physically
    const extension = path.extname(req.file.originalname);
    const fileUrl = await saveFile(req.file.buffer, extension, 'assignments', req.file.mimetype);

    const { submission, oldFileUrl } = await AssignmentsService.submitAssignment(userId, assignmentId, fileUrl);
    
    // Safely delete the old file only AFTER the DB update succeeds
    if (oldFileUrl) {
      await deleteFile(oldFileUrl).catch(e => console.error("Failed to delete orphaned submission file:", e));
    }

    if (redisConnection && redisConnection.status === 'ready') {
      await redisConnection.del(`user:profile:${userId}:student:assignments`);
      await redisConnection.del(`user:profile:${userId}:student:assignments:${assignmentId}`);
      await redisConnection.del(`user:profile:${userId}:dashboard:student`);
    }

    return sendSuccess(res, submission, 'Operation completed successfully.', undefined, 201);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return sendError(res, error.message, 'ASSIGNMENTS_ERROR', statusCode);
  }
};

export const unsubmitAssignmentHandler = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const assignmentId = parseInt(req.params.assignmentId as string, 10);
    if (isNaN(assignmentId)) {
      return sendError(res, 'Invalid assignmentId', 'VALIDATION_FAILED', 400);
    }

    const oldFileUrl = await AssignmentsService.unsubmitAssignment(userId, assignmentId);

    if (oldFileUrl) {
      await deleteFile(oldFileUrl).catch(e => console.error("Failed to delete unsubmitted file:", e));
    }

    if (redisConnection && redisConnection.status === 'ready') {
      await redisConnection.del(`api:student:assignments:${userId}`);
      await redisConnection.del(`api:student:assignment:${assignmentId}:${userId}`);
    }

    return sendSuccess(res, { message: 'Submission deleted' }, 'Operation completed successfully.', undefined, 200);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return sendError(res, error.message, 'ASSIGNMENTS_ERROR', statusCode);
  }
};
