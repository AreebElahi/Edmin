import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../contracts/api.contracts.js';
import prisma from '../../config/prisma.js';
import { getCachedResponse, setCachedResponse } from "../../config/redis.js";

export const getAttachmentsHandler = async (req: Request, res: Response) => {
  try {
    const attachments = await prisma.admindocumentattachment.findMany({
      where: { isactive: true },
      take: 10
    });

    const userIds = attachments.map(a => a.userid);
    const users = await prisma.user.findMany({
      where: { userid: { in: userIds } },
      select: { userid: true, username: true }
    });
    const userMap = new Map(users.map(u => [u.userid, u.username]));

    const formatted = attachments.map(item => ({
      id: `M${item.admindocumentattachmentid}`,
      name: item.filename || 'Untitled Document',
      course: 'N/A',
      uploader: userMap.get(item.userid) || `User #${item.userid}`,
      type: item.filename?.split('.').pop()?.toUpperCase() || 'PDF',
      status: item.isverified ? 'Clean' : 'Flagged'
    }));

    return sendSuccess(res, formatted);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to fetch document attachments');
  }
};

export const deleteAttachmentHandler = async (req: Request, res: Response) => {
  try {
    const idStr = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = Number(idStr.replace('M', ''));
    
    // Check if attachment exists before deleting
    const exists = await prisma.admindocumentattachment.findUnique({
      where: { admindocumentattachmentid: id }
    });

    if (exists) {
      await prisma.admindocumentattachment.update({
        where: { admindocumentattachmentid: id },
        data: { isactive: false, deletedat: new Date() }
      });
    }

    return sendSuccess(res, { message: 'Document attachment moderated successfully' });
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to moderate attachment');
  }
};

export const getPlagiarismAlertsHandler = async (req: Request, res: Response) => {
  try {
    // Return empty plagiarism scan results (no backend table supporting plagiarism audits exists)
    return sendSuccess(res, []);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to fetch plagiarism reports');
  }
};

export const getSubmissionsMapHandler = async (req: Request, res: Response) => {
  try {
    const assignments = await prisma.assignment.findMany({
      where: { isactive: true },
      include: {
        courseoffering: {
          include: {
            course: true
          }
        },
        assignmentsubmission: {
          where: { isactive: true }
        }
      },
      orderBy: { duedate: 'asc' },
      take: 20
    });

    const formatted = assignments.map(item => ({
      id: `A${item.assignmentid}`,
      title: item.title,
      course: item.courseoffering?.course ? `${item.courseoffering.course.code} ${item.courseoffering.course.name}` : 'N/A',
      dueDate: item.duedate.toISOString(),
      submissionsCount: item.assignmentsubmission.length,
      status: item.duedate.getTime() > Date.now() ? 'Upcoming' : 'Past Due'
    }));

    return sendSuccess(res, formatted);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to fetch submission timeline map');
  }
};
