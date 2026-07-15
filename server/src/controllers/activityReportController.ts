import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync.js';
import { sendSuccess, sendError } from '../contracts/api.contracts.js';
import * as activityReportWorkflow from '../services/workflows/activityReportWorkflow.service.js';
import { redisConnection } from '../config/redis.js';

export const createReport = catchAsync(async (req: Request, res: Response) => {
  const { reportDate, summary, activities } = req.body;
  const facultyUserId = req.user.userId;

  if (!reportDate || !summary || !activities || !Array.isArray(activities)) {
    return sendError(res, 'Report date, summary and activities array are required', 'BAD_REQUEST', 400);
  }

  const report = await activityReportWorkflow.createActivityReport(
    facultyUserId,
    new Date(reportDate),
    summary,
    activities
  );

  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.del(`api:activity_reports:${facultyUserId}:FACULTY`);
    // Ideally we should invalidate HOD/Admin caches too, for now we let short TTL handle it
  }

  return sendSuccess(res, report, 201);
});

export const getReports = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId;
  const role = req.user.role;
  const cacheKey = `api:activity_reports:${userId}:${role}`;

  if (redisConnection && redisConnection.status === 'ready') {
    const cached = await redisConnection.get(cacheKey);
    if (cached) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).send(cached);
    }
  }

  const reports = await activityReportWorkflow.getActivityReports(userId, role);
  const fullResponse = { success: true, data: reports };

  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.setex(cacheKey, 180, JSON.stringify(fullResponse));
  }

  return res.status(200).json(fullResponse);
});

import prisma from '../config/prisma.js';

export const approveReport = catchAsync(async (req: Request, res: Response) => {
  const reportId = Number(req.params.id);
  const { comment } = req.body;
  const approverUserId = req.user.userId;
  const approverRole = req.user.role;

  const report = await activityReportWorkflow.approveActivityReport(
    reportId,
    approverUserId,
    approverRole,
    comment
  );

  return sendSuccess(res, report);
});

export const rejectReport = catchAsync(async (req: Request, res: Response) => {
  const reportId = Number(req.params.id);
  const { comment } = req.body;
  const approverUserId = req.user.userId;
  const approverRole = req.user.role;

  if (!comment) {
    return sendError(res, 'Rejection comment is required', 'BAD_REQUEST', 400);
  }

  const report = await activityReportWorkflow.rejectActivityReport(
    reportId,
    approverUserId,
    approverRole,
    comment
  );

  return sendSuccess(res, report);
});
