import { Request, Response } from 'express';
import * as complaintService from './complaint.service.js';
import catchAsync from '../../utils/catchAsync.js';

export const createComplaint = catchAsync(async (req: Request, res: Response) => {
  const userId = ((req.user as any).userId || (req.user as any).id);
  const { subject, description, priority } = req.body;

  const complaint = await complaintService.createComplaint(userId, subject, description, priority);
  res.status(201).json({ success: true, data: complaint });
});

export const getComplaints = catchAsync(async (req: Request, res: Response) => {
  const userId = ((req.user as any).userId || (req.user as any).id);
  const userRole = (req.user as any).role;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
  const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

  const complaints = await complaintService.getComplaints(userId, userRole, limit, offset);
  res.status(200).json({ success: true, data: complaints });
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
