import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../contracts/api.contracts.js';
import prisma from '../../config/prisma.js';
import { redisConnection } from '../../config/redis.js';

export const broadcastAnnouncementHandler = async (req: Request, res: Response) => {
  try {
    const { title, content, targetRole, priority, isScheduled, scheduleDate } = req.body;
    const userId = (req as any).user?.id || (req as any).user?.userId;

    if (!title || !content) {
      return sendError(res, 'Title and Content are required', 'BAD_REQUEST', 400);
    }

    const expiresAt = isScheduled && scheduleDate ? new Date(scheduleDate) : null;

    const announcement = await prisma.systemAnnouncement.create({
      data: {
        title,
        content,
        created_by_id: userId,
        expires_at: expiresAt,
        audiences: {
          create: {
            target_role: `${targetRole || 'ALL'}::${priority || 'Normal'}`
          }
        }
      },
      include: {
        audiences: true
      }
    });

    // Also, if not scheduled, write notifications for all target users immediately
    if (!isScheduled) {
      let userQuery: any = { accountStatus: 'ACTIVE' };
      if (targetRole && targetRole !== 'ALL' && targetRole !== 'All Users (Global Broadcast)') {
        // Map UI roles like "All Students" or "All Faculty" to role_enum values
        let mappedRole: any = 'STUDENT';
        if (targetRole.toLowerCase().includes('faculty')) mappedRole = 'FACULTY';
        else if (targetRole.toLowerCase().includes('hr')) mappedRole = 'HR';
        
        userQuery = {
          accountStatus: 'ACTIVE',
          user_roles: {
            some: {
              role: {
                name: mappedRole
              }
            }
          }
        };
      }

      const users = await prisma.user.findMany({ where: userQuery });
      
      if (users.length > 0) {
        await prisma.notification.createMany({
          data: users.map(u => ({
            userid: u.userid,
            title: `Broadcast: ${title}`,
            message: content,
            isread: false,
            isactive: true
          }))
        });
      }
    }

    if (redisConnection && redisConnection.status === 'ready') {
      await redisConnection.del('api:communications:announcements:history');
      await redisConnection.del('api:communications:announcements:queue');
    }

    return sendSuccess(res, announcement, 201);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to dispatch broadcast');
  }
};

export const getQueueHandler = async (req: Request, res: Response) => {
  try {
    // Scheduled are announcements whose expires_at (schedule date) is in the future
    const queued = await prisma.systemAnnouncement.findMany({
      where: {
        expires_at: {
          gt: new Date()
        },
        deleted_at: null
      },
      include: {
        audiences: true
      },
      orderBy: { expires_at: 'asc' }
    });

    const formatted = queued.map(item => {
      const dbTargetRole = item.audiences?.[0]?.target_role || 'All';
      const [audience, priority] = dbTargetRole.includes('::') ? dbTargetRole.split('::') : [dbTargetRole, 'Normal'];
      return {
        id: `S${item.id}`,
        title: item.title,
        audience,
        date: item.expires_at?.toLocaleString() || '',
        priority,
        status: 'Pending'
      };
    });

    return sendSuccess(res, formatted);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to fetch queued broadcasts');
  }
};

export const cancelScheduledHandler = async (req: Request, res: Response) => {
  try {
    const idStr = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = Number(idStr.replace('S', ''));
    await prisma.systemAnnouncement.update({
      where: { id },
      data: { deleted_at: new Date() }
    });

    if (redisConnection && redisConnection.status === 'ready') {
      await redisConnection.del('api:communications:announcements:queue');
      await redisConnection.del('api:communications:announcements:history');
    }

    return sendSuccess(res, { message: 'Scheduled announcement cancelled' });
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to cancel scheduled announcement');
  }
};

export const getHistoryHandler = async (req: Request, res: Response) => {
  try {
    const cacheKey = 'api:communications:announcements:history';
    if (redisConnection && redisConnection.status === 'ready') {
      const cached = await redisConnection.get(cacheKey);
      if (cached) return res.status(200).send(cached);
    }

    // History are announcements that have already been dispatched (expires_at is null or in the past)
    const history = await prisma.systemAnnouncement.findMany({
      where: {
        OR: [
          { expires_at: null },
          { expires_at: { lte: new Date() } }
        ],
        deleted_at: null
      },
      include: {
        audiences: true
      },
      orderBy: { created_at: 'desc' }
    });

    const formatted = history.map(item => {
      const dbTargetRole = item.audiences?.[0]?.target_role || 'All';
      const [audience, priority] = dbTargetRole.includes('::') ? dbTargetRole.split('::') : [dbTargetRole, 'Normal'];
      return {
        id: `H${item.id}`,
        title: item.title,
        audience,
        date: item.created_at.toLocaleString(),
        priority,
        status: 'Delivered'
      };
    });

    const response = { success: true, data: formatted };
    if (redisConnection && redisConnection.status === 'ready') {
      await redisConnection.setex('api:communications:announcements:history', 3600, JSON.stringify(response));
    }

    return res.status(200).json(response);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to fetch broadcast history');
  }
};
