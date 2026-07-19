import { redisConnection } from '../config/redis.js';
import { Request, Response } from 'express';
import prisma from '../config/prisma.js';
import catchAsync from '../utils/catchAsync.js';
import { sendSuccess, sendError } from "../contracts/api.contracts.js";
import { getCachedResponse, setCachedResponse } from "../config/redis.js";

// Submit Leave Request
export const submitLeaveRequest = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId;
  const { startDate, endDate, leaveType, reason } = req.body;

  const sDate = new Date(startDate);
  const eDate = new Date(endDate);

  if (eDate < sDate) {
    return sendError(res, 'Internal error', [], 400);
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

  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.del(`api:faculty:hr-summary:${userId}`);
    // Also invalidate the first page of pending approvals since a new pending leave was created
    await redisConnection.del(`api:faculty:pending-approvals:${userId}:1:20`);
  }

  sendSuccess(res, request, undefined, undefined, 201);
});

// Get My Leave Requests
export const getMyLeaveRequests = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId;

  const requests = await prisma.leaverequest.findMany({
    where: { userid: userId },
    include: { leavecomment: true },
    orderBy: { createdat: 'desc' }
  });

  sendSuccess(res, requests, undefined, undefined, 200);
});
