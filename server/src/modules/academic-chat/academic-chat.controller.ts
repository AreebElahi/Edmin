import { Request, Response, NextFunction } from 'express';
import { AcademicChatService } from './academic-chat.service.js';

export class AcademicChatController {
  static async getSessions(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = ((req.user as any).userId || (req.user as any).id);
      const sessions = await AcademicChatService.getSessions(userId);
      res.json({
        success: true,
        data: sessions,
      });
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
      const result = await AcademicChatService.deleteMessage(messageId, userId);
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
      res.json({ success: true, data: users });
    } catch (error) {
      next(error);
    }
  }
}
