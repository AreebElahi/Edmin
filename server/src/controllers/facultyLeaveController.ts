import { Request, Response } from 'express';
import prisma from '../config/prisma.js';
import catchAsync from '../utils/catchAsync.js';

// Submit Leave Request
export const submitLeaveRequest = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId;
  const { startDate, endDate, leaveType, reason } = req.body;

  const sDate = new Date(startDate);
  const eDate = new Date(endDate);

  if (eDate < sDate) {
    return res.status(400).json({ success: false, error: { code: 'INVALID_DATES', message: 'End date cannot be earlier than start date.' } });
  }

  const request = await prisma.leaverequest.create({
    data: {
      userid: userId,
      startdate: new Date(startDate),
      enddate: new Date(endDate),
      leavetype: leaveType,
      reason: reason,
      status: 'PENDING',
      leavecomment: {
        create: {
          comment: reason,
          commenterid: userId,
          userid: userId
        }
      }
    },
    include: { leavecomment: true }
  });

  res.status(201).json({ success: true, data: request });
});

// Get My Leave Requests
export const getMyLeaveRequests = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId;

  const requests = await prisma.leaverequest.findMany({
    where: { userid: userId },
    include: { leavecomment: true },
    orderBy: { createdat: 'desc' }
  });

  res.status(200).json({ success: true, data: requests });
});
