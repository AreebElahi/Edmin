import { Request, Response, NextFunction } from 'express';
import { AcademicChatService } from './academic-chat.service.js';
import prisma from '../../config/prisma.js';
import { redisConnection, acquireLock, releaseLock } from '../../config/redis.js';

const invalidateChatSessionsForUsers = async (userIds: number[]) => {
  if (redisConnection && redisConnection.status === 'ready') {
    const keys = userIds.map(id => `api:chat:sessions:${id}`);
    await redisConnection.del(keys);
  }
};

export class AcademicChatController {
  static async getSessions(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = ((req.user as any).userId || (req.user as any).id);
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const cacheKey = `api:chat:sessions:${userId}`;

      if (redisConnection && redisConnection.status === 'ready') {
        const cached = await redisConnection.get(cacheKey);
        if (cached) {
          res.setHeader('Content-Type', 'application/json');
          return res.status(200).send(cached);
        }
      }

      let isLeader = false;
      if (redisConnection && redisConnection.status === 'ready') {
        isLeader = await acquireLock(cacheKey, 5);
      } else {
        isLeader = true;
      }

      if (isLeader) {
        try {
          const sessions = await AcademicChatService.getSessions(userId);
          const fullResponse = { success: true, data: sessions };

          if (redisConnection && redisConnection.status === 'ready') {
            await redisConnection.setex(cacheKey, 30, JSON.stringify(fullResponse));
            await releaseLock(cacheKey);
          }
          return res.status(200).json(fullResponse);
        } catch (error) {
          if (redisConnection && redisConnection.status === 'ready') {
            await releaseLock(cacheKey);
          }
          throw error;
        }
      } else {
        for (let attempt = 0; attempt < 10; attempt++) {
          await new Promise(resolve => setTimeout(resolve, 100));
          const cached = await redisConnection!.get(cacheKey);
          if (cached) {
            res.setHeader('Content-Type', 'application/json');
            return res.status(200).send(cached);
          }
        }
        const sessions = await AcademicChatService.getSessions(userId);
        return res.status(200).json({ success: true, data: sessions });
      }
    } catch (error) {
      next(error);
    }
  }

  static async getSession(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = ((req.user as any).userId || (req.user as any).id);
      const sessionId = parseInt(req.params.sessionId as string);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      const session = await AcademicChatService.getSession(sessionId, userId, limit, offset);
      res.json({
        success: true,
        data: session,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createSession(req: Request, res: Response, next: NextFunction) {
    try {
      const initiatorId = ((req.user as any).userId || (req.user as any).id);
      const { targetUserId, courseOfferingId } = req.body;
      const session = await AcademicChatService.createSession(
        initiatorId,
        targetUserId,
        courseOfferingId
      );

      await invalidateChatSessionsForUsers([initiatorId, Number(targetUserId)]);

      res.status(201).json({
        success: true,
        data: session,
      });
    } catch (error) {
      next(error);
    }
  }

  static async sendMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const senderId = ((req.user as any).userId || (req.user as any).id);
      const sessionId = parseInt(req.params.sessionId as string);
      const { message } = req.body;
      const sentMessage = await AcademicChatService.sendMessage(sessionId, senderId, message);

      const session = await prisma.academicchatsession.findUnique({ where: { sessionid: sessionId } });
      if (session) {
        await invalidateChatSessionsForUsers([session.studentid, session.facultyid]);
      }

      res.status(201).json({
        success: true,
        data: sentMessage,
      });
    } catch (error) {
      next(error);
    }
  }

  static async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = ((req.user as any).userId || (req.user as any).id);
      const sessionId = parseInt(req.params.sessionId as string);
      const result = await AcademicChatService.markAsRead(sessionId, userId);

      const session = await prisma.academicchatsession.findUnique({ where: { sessionid: sessionId } });
      if (session) {
        await invalidateChatSessionsForUsers([session.studentid, session.facultyid]);
      }

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = ((req.user as any).userId || (req.user as any).id);
      const messageId = parseInt(req.params.messageId as string);

      const message = await prisma.academicchatmessage.findUnique({
        where: { messageid: messageId },
        include: { session: true }
      });

      const result = await AcademicChatService.deleteMessage(messageId, userId);

      if (message?.session) {
        await invalidateChatSessionsForUsers([message.session.studentid, message.session.facultyid]);
      }

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async searchUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const requesterId = ((req.user as any).userId || (req.user as any).id);
      const requesterRole = (req.user as any).role;
      const q = (req.query.q as string) || '';

      const users = await AcademicChatService.searchChatableUsers(requesterId, requesterRole, q);
      res.json({
        success: true,
        data: users,
      });
    } catch (error) {
      next(error);
    }
  }
}
