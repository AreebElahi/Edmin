import { Request, Response } from 'express';
import * as complaintService from './complaint.service.js';
import catchAsync from '../../utils/catchAsync.js';
import { redisConnection } from '../../config/redis.js';

const invalidateComplaintCache = async (userId: number, userRole: string, complaintId?: number) => {
  if (redisConnection && redisConnection.status === 'ready') {
    // Delete the paginated lists. A wildcard deletion would be better but we don't have SCAN handy.
    // We'll just delete the first few pages which are most common
    await redisConnection.del(`api:complaints:${userId}:${userRole}:50:0`);
    if (userRole === 'ADMIN' || userRole === 'HR') {
      // Invalidate general admin caches if needed
      await redisConnection.del(`api:complaints:ALL:${userRole}:50:0`); 
    }
  }
};

export const createComplaint = catchAsync(async (req: Request, res: Response) => {
  const userId = ((req.user as any).userId || (req.user as any).id);
  const { subject, description, priority } = req.body;

  const complaint = await complaintService.createComplaint(userId, subject, description, priority);
  await invalidateComplaintCache(userId, (req.user as any).role);
  res.status(201).json({ success: true, data: complaint });
});

export const getComplaints = catchAsync(async (req: Request, res: Response) => {
  const userId = ((req.user as any).userId || (req.user as any).id);
  const userRole = (req.user as any).role;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
  const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

  const cacheKey = `api:complaints:${userId}:${userRole}:${limit}:${offset}`;

  if (redisConnection && redisConnection.status === 'ready') {
    const cached = await redisConnection.get(cacheKey);
    if (cached) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).send(cached);
    }
  }

  const complaints = await complaintService.getComplaints(userId, userRole, limit, offset);
  const fullResponse = { success: true, data: complaints };

  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.setex(cacheKey, 300, JSON.stringify(fullResponse)); // 5 mins
  }

  res.status(200).json(fullResponse);
});

export const getComplaintById = catchAsync(async (req: Request, res: Response) => {
  const userId = ((req.user as any).userId || (req.user as any).id);
  const userRole = (req.user as any).role;
  const complaintId = parseInt(req.params.id as string);

  if (isNaN(complaintId)) {
    return res.status(400).json({ success: false, message: 'Invalid complaint ID' });
  }

  try {
    const complaint = await complaintService.getComplaintById(complaintId, userId, userRole);
    res.status(200).json({ success: true, data: complaint });
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }
    if (error.message === 'NOT_AUTHORIZED') {
      return res.status(403).json({ success: false, message: 'Not authorized to view this complaint' });
    }
    throw error;
  }
});

export const updateComplaintStatus = catchAsync(async (req: Request, res: Response) => {
  const userId = ((req.user as any).userId || (req.user as any).id);
  const userRole = (req.user as any).role;
  const complaintId = parseInt(req.params.id as string);
  const { status } = req.body;

  if (isNaN(complaintId)) {
    return res.status(400).json({ success: false, message: 'Invalid complaint ID' });
  }

  try {
    const complaint = await complaintService.updateComplaintStatus(complaintId, status, userId, userRole);
    await invalidateComplaintCache(userId, userRole, complaintId);
    res.status(200).json({ success: true, data: complaint });
  } catch (error: any) {
    if (error.message === 'NOT_AUTHORIZED') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this complaint' });
    }
    throw error;
  }
});
export const assignComplaint = catchAsync(async (req: Request, res: Response) => {
  const userId = ((req.user as any).userId || (req.user as any).id);
  const userRole = (req.user as any).role;
  const complaintId = parseInt(req.params.id as string);
  const { assigneeId } = req.body;

  if (isNaN(complaintId)) {
    return res.status(400).json({ success: false, message: 'Invalid complaint ID' });
  }

  try {
    const complaint = await complaintService.assignComplaint(complaintId, assigneeId, userId, userRole);
    await invalidateComplaintCache(userId, userRole, complaintId);
    // Also invalidate the assignee's cache
    await invalidateComplaintCache(assigneeId, 'ADMIN'); // ASSUMING ASSIGNEE IS ADMIN/HR
    res.status(200).json({ success: true, data: complaint });
  } catch (error: any) {
    if (error.message === 'NOT_AUTHORIZED') {
      return res.status(403).json({ success: false, message: 'Not authorized to assign this complaint' });
    }
    if (error.message === 'NOT_FOUND') {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }
    throw error;
  }
});
export const sendComplaintMessage = catchAsync(async (req: Request, res: Response) => {
  const userId = ((req.user as any).userId || (req.user as any).id);
  const userRole = (req.user as any).role;
  const complaintId = parseInt(req.params.id as string);
  const { message } = req.body;

  if (isNaN(complaintId)) {
    return res.status(400).json({ success: false, message: 'Invalid complaint ID' });
  }

  try {
    const newMessage = await complaintService.sendComplaintMessage(complaintId, userId, userRole, message);
    await invalidateComplaintCache(userId, userRole, complaintId);
    res.status(201).json({ success: true, data: newMessage });
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }
    if (error.message === 'NOT_AUTHORIZED') {
      return res.status(403).json({ success: false, message: 'Not authorized to participate in this complaint' });
    }
    throw error;
  }
});
